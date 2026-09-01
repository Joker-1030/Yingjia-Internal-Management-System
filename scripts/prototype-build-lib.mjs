import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.dirname(
  path.dirname(fileURLToPath(import.meta.url)),
);
export const sourceRoot = path.join(projectRoot, "src");
export const entryPath = path.join(sourceRoot, "prototype.html");
export const targetPath = path.join(projectRoot, "demo/prototype.html");
export const artifactManifestPath = path.join(
  projectRoot,
  "demo/prototype.artifact.json",
);

export function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid: ${error.message}`);
  }
}

function assertInside(parent, target, label) {
  const relative = path.relative(parent, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside ${path.relative(projectRoot, parent)}`);
  }
}

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".DS_Store", "node_modules"].includes(entry.name)) return [];
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
  });
}

function readModuleManifests() {
  const modulesRoot = path.join(sourceRoot, "modules");
  const manifests = fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^m\d{2}-/.test(entry.name))
    .map((entry) => {
      const filePath = path.join(modulesRoot, entry.name, "module.json");
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing module manifest: ${path.relative(projectRoot, filePath)}`);
      }
      const manifest = readJson(filePath, path.relative(projectRoot, filePath));
      if (
        manifest.schemaVersion !== 1 ||
        !/^M\d{2}$/.test(manifest.id) ||
        !Array.isArray(manifest.pages) ||
        !Array.isArray(manifest.pageStates) ||
        !Array.isArray(manifest.dataReferences) ||
        !Array.isArray(manifest.sourceFiles)
      ) {
        throw new Error(`${path.relative(projectRoot, filePath)} has an invalid module contract.`);
      }
      for (const relativePath of [
        ...manifest.dataReferences,
        ...manifest.sourceFiles,
        manifest.eventRouterSource,
      ]) {
        const resolved = path.resolve(sourceRoot, relativePath);
        assertInside(sourceRoot, resolved, `Module ${manifest.id} source`);
        if (!fs.existsSync(resolved)) {
          throw new Error(`Module ${manifest.id} references missing source: ${relativePath}`);
        }
      }
      return manifest;
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const expectedIds = Array.from({ length: 12 }, (_, index) =>
    `M${String(index + 1).padStart(2, "0")}`,
  );
  if (manifests.map((manifest) => manifest.id).join(",") !== expectedIds.join(",")) {
    throw new Error("src/modules must contain exactly one manifest for M01-M12.");
  }
  return manifests;
}

function expandSource(filePath, stack, includedFiles) {
  assertInside(sourceRoot, filePath, "Included source");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing included source: ${path.relative(projectRoot, filePath)}`);
  }
  if (stack.includes(filePath)) {
    throw new Error(
      `Circular source include: ${[...stack, filePath]
        .map((item) => path.relative(sourceRoot, item))
        .join(" -> ")}`,
    );
  }

  includedFiles.add(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  return content.replace(
    /^[ \t]*\/\* @include "([^"]+)" \*\/(?:\r?\n|$)/gm,
    (_marker, relativePath) => {
      const childPath = path.resolve(path.dirname(filePath), relativePath);
      assertInside(sourceRoot, childPath, "Source include");
      return expandSource(childPath, [...stack, filePath], includedFiles);
    },
  );
}

function validateHtml(html, entryRelative) {
  const errors = [];
  if (!/^<!doctype html>/i.test(html.trimStart())) {
    errors.push(`${entryRelative} must start with an HTML doctype.`);
  }
  if (
    /\{\{[A-Z][A-Z0-9_]+\}\}/.test(html) ||
    /@include\s+"/.test(html) ||
    /\sdata-inline(?:\s|=|>)/.test(html)
  ) {
    errors.push(`${entryRelative} contains an unresolved template token or include marker.`);
  }

  const externalAttributes = [
    ...html.matchAll(/<(?:script|img|source|video|audio)\b[^>]*\bsrc=["']([^"']+)["']/gi),
    ...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi),
  ]
    .map((match) => match[1])
    .filter((value) => !value.startsWith("data:") && !value.startsWith("#"));
  if (externalAttributes.length) {
    errors.push(
      `${entryRelative} depends on non-inlined resources: ${[...new Set(externalAttributes)].join(", ")}`,
    );
  }

  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for (const [index, match] of scripts.entries()) {
    try {
      new Function(match[1]);
    } catch (error) {
      errors.push(`${entryRelative} inline script #${index + 1} is invalid: ${error.message}`);
    }
  }

  if (errors.length) throw new Error(errors.join("\n"));
}

export function inspectPrototypeSource() {
  if (!fs.existsSync(entryPath)) {
    throw new Error("Missing Prototype entry: src/prototype.html");
  }
  const modules = readModuleManifests();
  const includedFiles = new Set();
  const html = expandSource(entryPath, [], includedFiles);
  validateHtml(html, path.relative(projectRoot, entryPath));

  const sourceFiles = listSourceFiles(sourceRoot)
    .sort((left, right) => left.localeCompare(right))
    .map((filePath) => {
      const content = fs.readFileSync(filePath);
      return {
        path: path.relative(projectRoot, filePath),
        sha256: sha256(content),
        bytes: content.byteLength,
      };
    });
  const sourceDigest = sha256(
    sourceFiles.map((file) => `${file.path}\0${file.sha256}\n`).join(""),
  );

  return {
    entryPath,
    targetPath,
    artifactManifestPath,
    html,
    modules,
    sourceFiles,
    sourceDigest,
    artifactInputs: [...includedFiles]
      .map((filePath) => path.relative(projectRoot, filePath))
      .sort(),
  };
}

export function readArtifactManifest(filePath) {
  return readJson(filePath, path.relative(projectRoot, filePath));
}
