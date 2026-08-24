#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = ".github/publish-manifest.json";

function fail(message) {
  throw new Error(message);
}

function runGit(args, cwd = projectRoot, encoding = "utf8") {
  const result = spawnSync("git", args, {
    cwd,
    encoding,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || "").trim();
    fail(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
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

function parseArgs(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!["--source", "--target"].includes(key) || !value) {
      fail("Usage: build-publish-candidate.mjs --source <commit> --target <worktree>");
    }
    values[key.slice(2)] = value;
  }
  if (!values.source || !values.target) {
    fail("Both --source and --target are required.");
  }
  return values;
}

function readManifest(sourceCommit) {
  let manifest;
  try {
    manifest = JSON.parse(runGit(["show", `${sourceCommit}:${manifestPath}`]));
  } catch (error) {
    fail(`Cannot read a valid manifest from ${sourceCommit}: ${error.message}`);
  }
  for (const key of ["include", "exclude", "sensitiveExclusions", "requiredFiles"]) {
    if (!Array.isArray(manifest[key]) || manifest[key].some((item) => typeof item !== "string")) {
      fail(`Manifest ${key} must be an array of strings.`);
    }
  }
  return manifest;
}

function sourceTree(sourceCommit) {
  const output = runGit(["ls-tree", "-r", "-z", sourceCommit]);
  return output
    .split("\0")
    .filter(Boolean)
    .map((entry) => {
      const match = /^(\d+) (\w+) ([0-9a-f]+)\t(.+)$/.exec(entry);
      if (!match) fail(`Cannot parse source tree entry: ${entry}`);
      return {
        mode: match[1],
        type: match[2],
        object: match[3],
        repoPath: normalizeRepoPath(match[4]),
      };
    });
}

function verifyTargetWorktree(target) {
  if (!fs.existsSync(target)) fail(`Target worktree does not exist: ${target}`);
  const targetRoot = path.resolve(runGit(["rev-parse", "--show-toplevel"], target).trim());
  if (targetRoot !== target) fail(`Target must be a worktree root: ${target}`);
  if (targetRoot === projectRoot) fail("Target worktree cannot be the Local Workspace.");

  const commonFromProject = path.resolve(
    projectRoot,
    runGit(["rev-parse", "--git-common-dir"], projectRoot).trim(),
  );
  const commonFromTarget = path.resolve(
    target,
    runGit(["rev-parse", "--git-common-dir"], target).trim(),
  );
  if (fs.realpathSync(commonFromProject) !== fs.realpathSync(commonFromTarget)) {
    fail("Target worktree does not belong to this repository.");
  }
  if (runGit(["status", "--porcelain"], target).trim()) {
    fail("Target worktree must be clean before candidate generation.");
  }
}

function removeTrackedFiles(target) {
  const tracked = runGit(["ls-files", "-z"], target)
    .split("\0")
    .filter(Boolean)
    .map(normalizeRepoPath);
  for (const repoPath of tracked) {
    fs.rmSync(path.join(target, repoPath), { force: true });
  }
}

function materializeEntry(target, entry) {
  const outputPath = path.join(target, entry.repoPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = runGit(["cat-file", "blob", entry.object], projectRoot, null);
  if (entry.mode === "120000") {
    fs.symlinkSync(content.toString("utf8"), outputPath);
    return;
  }
  if (entry.type !== "blob") fail(`Unsupported tree entry type for ${entry.repoPath}`);
  fs.writeFileSync(outputPath, content);
  fs.chmodSync(outputPath, entry.mode === "100755" ? 0o755 : 0o644);
}

try {
  const { source, target: targetArg } = parseArgs(process.argv.slice(2));
  const sourceCommit = runGit(["rev-parse", "--verify", `${source}^{commit}`]).trim();
  const target = path.resolve(targetArg);
  const manifest = readManifest(sourceCommit);
  const tree = sourceTree(sourceCommit);
  const treePaths = new Set(tree.map((entry) => entry.repoPath));
  const selected = tree.filter(
    (entry) =>
      matchesAny(entry.repoPath, manifest.include) &&
      !matchesAny(entry.repoPath, manifest.exclude) &&
      !matchesAny(entry.repoPath, manifest.sensitiveExclusions),
  );
  const selectedPaths = new Set(selected.map((entry) => entry.repoPath));

  for (const required of manifest.requiredFiles) {
    const repoPath = normalizeRepoPath(required);
    if (!treePaths.has(repoPath)) fail(`${repoPath}: required file is missing from source commit`);
    if (!selectedPaths.has(repoPath)) fail(`${repoPath}: required file is excluded from candidate`);
  }
  for (const pattern of manifest.include) {
    if (!tree.some((entry) => globRegex(pattern).test(entry.repoPath))) {
      fail(`Include pattern matches no source file: ${pattern}`);
    }
  }

  verifyTargetWorktree(target);
  removeTrackedFiles(target);
  for (const entry of selected) materializeEntry(target, entry);

  console.log(
    JSON.stringify(
      {
        sourceCommit,
        sourcePaths: tree.length,
        includedPaths: selected.length,
        excludedPaths: tree.length - selected.length,
        target,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("GITHUB_PUBLISH_BLOCKED");
  console.error(`- ${error.message}`);
  process.exitCode = 1;
}
