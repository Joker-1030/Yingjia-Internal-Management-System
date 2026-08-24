#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(projectRoot, ".github/publish-manifest.json");

function fail(message) {
  throw new Error(message);
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

function normalizeRepoPath(value) {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) {
    fail(`Invalid repository path: ${value}`);
  }
  return normalized;
}

function globRegex(pattern) {
  let expression = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      if (pattern[index + 2] === "/") {
        expression += "(?:.*/)?";
        index += 2;
      } else {
        expression += ".*";
        index += 1;
      }
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`${expression}$`);
}

function matchesAny(repoPath, patterns) {
  return patterns.some((pattern) => globRegex(pattern).test(repoPath));
}

function readManifest() {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`Manifest is not valid JSON: ${error.message}`);
  }

  if (manifest.schemaVersion !== 1 || manifest.mirrorType !== "allowlist-candidate-tree") {
    fail("Manifest schemaVersion or mirrorType is unsupported.");
  }
  for (const key of ["include", "exclude", "sensitiveExclusions", "requiredFiles"]) {
    if (!Array.isArray(manifest[key]) || manifest[key].some((item) => typeof item !== "string")) {
      fail(`Manifest ${key} must be an array of strings.`);
    }
  }
  if (!Number.isSafeInteger(manifest.maxFileBytes) || manifest.maxFileBytes <= 0) {
    fail("Manifest maxFileBytes must be a positive integer.");
  }
  if (typeof manifest.prototypeCheck !== "string" || !manifest.prototypeCheck.trim()) {
    fail("Manifest prototypeCheck must be a command string.");
  }
  return manifest;
}

function zeroSeparated(output) {
  return output.split("\0").filter(Boolean).map(normalizeRepoPath);
}

function selectedPaths(args) {
  if (args[0] === "--all") {
    if (args.length !== 1) fail("--all does not accept additional arguments.");
    return { mode: "all", paths: zeroSeparated(runGit(["ls-files", "-z"])) };
  }
  if (args[0] === "--staged") {
    if (args.length !== 1) fail("--staged does not accept additional arguments.");
    return {
      mode: "staged",
      paths: zeroSeparated(runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB", "-z"])),
    };
  }
  if (args[0] === "--range") {
    if (args.length !== 2) fail("Usage: --range <base>..<head>");
    return {
      mode: `range ${args[1]}`,
      paths: zeroSeparated(runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", "-z", args[1]])),
    };
  }
  if (args[0] === "--paths") {
    if (args.length < 2) fail("--paths requires at least one path.");
    return { mode: "explicit paths", paths: args.slice(1).map(normalizeRepoPath) };
  }
  if (args.length) fail(`Unknown arguments: ${args.join(" ")}`);

  const staged = zeroSeparated(
    runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB", "-z"]),
  );
  if (staged.length) return { mode: "staged (default)", paths: staged };
  return {
    mode: "HEAD commit (default)",
    paths: zeroSeparated(runGit(["show", "--pretty=format:", "--name-only", "--diff-filter=ACMRTUXB", "-z", "HEAD"])),
  };
}

const localArtifactPattern = /(?:^|\/)(?:\.DS_Store|Thumbs\.db|desktop\.ini|node_modules|coverage|dist|build|\.cache|\.tmp|tmp)(?:\/|$)|(?:\.log|\.tmp|\.temp|\.bak|\.swp|~)$/i;
const internalReportPattern = /^docs\/[^/]*(?:GOVERNANCE|SEMANTIC|COMPLETION|MIGRATION|CLOSURE|REVALIDATION|REMEDIATION)[^/]*$/i;
const secretContentPatterns = [
  ["private key material", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[opsu]_[A-Za-z0-9]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["generic assigned secret", /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'][^"'\s]{12,}["']/i],
];

function validateRequiredFiles(manifest, findings) {
  for (const required of manifest.requiredFiles) {
    const repoPath = normalizeRepoPath(required);
    if (!fs.existsSync(path.join(projectRoot, repoPath))) {
      findings.push(`${repoPath}: required file is missing`);
    }
    if (!matchesAny(repoPath, manifest.include) || matchesAny(repoPath, manifest.exclude)) {
      findings.push(`${repoPath}: required file is not publish-allowlisted`);
    }
  }
}

function validatePath(repoPath, manifest, findings) {
  if (!matchesAny(repoPath, manifest.include)) {
    findings.push(`${repoPath}: path is not in the publish allowlist`);
  }
  if (matchesAny(repoPath, manifest.exclude)) {
    findings.push(`${repoPath}: path matches an explicit publish exclusion`);
  }
  const envExample = /(?:^|\/)\.env\.(?:example|sample)$/i.test(repoPath);
  if (!envExample && matchesAny(repoPath, manifest.sensitiveExclusions)) {
    findings.push(`${repoPath}: path matches a sensitive-file exclusion`);
  }
  if (localArtifactPattern.test(repoPath)) {
    findings.push(`${repoPath}: path is a local, temporary, cache, build, or OS artifact`);
  }
  if (internalReportPattern.test(repoPath)) {
    findings.push(`${repoPath}: path is an internal governance/process report`);
  }

  const absolutePath = path.join(projectRoot, repoPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return;

  const stats = fs.statSync(absolutePath);
  if (stats.size > manifest.maxFileBytes) {
    findings.push(`${repoPath}: ${stats.size} bytes exceeds the ${manifest.maxFileBytes}-byte limit`);
    return;
  }
  const content = fs.readFileSync(absolutePath);
  if (content.includes(0)) return;
  const text = content.toString("utf8");
  for (const [label, pattern] of secretContentPatterns) {
    if (pattern.test(text)) findings.push(`${repoPath}: possible ${label}`);
  }
}

function runPrototypeCheck(command, findings) {
  const [program, ...args] = command.trim().split(/\s+/);
  const result = spawnSync(program, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "no output").trim();
    findings.push(`Prototype provenance check failed: ${detail}`);
  } else if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}

try {
  const manifest = readManifest();
  const selection = selectedPaths(process.argv.slice(2));
  const findings = [];
  validateRequiredFiles(manifest, findings);
  for (const repoPath of [...new Set(selection.paths)].sort()) {
    validatePath(repoPath, manifest, findings);
  }
  runPrototypeCheck(manifest.prototypeCheck, findings);

  if (findings.length) {
    console.error("GITHUB_PUBLISH_BLOCKED");
    for (const finding of [...new Set(findings)]) console.error(`- ${finding}`);
    process.exitCode = 1;
  } else {
    console.log(`GITHUB_PUBLISH_READY mode=${selection.mode} paths=${new Set(selection.paths).size}`);
  }
} catch (error) {
  console.error("GITHUB_PUBLISH_BLOCKED");
  console.error(`- ${error.message}`);
  process.exitCode = 1;
}
