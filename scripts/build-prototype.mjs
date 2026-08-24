import fs from "node:fs";
import path from "node:path";

import {
  inspectPrototypeSource,
  projectRoot,
  sha256,
} from "./prototype-build-lib.mjs";

try {
  const state = inspectPrototypeSource();
  fs.mkdirSync(path.dirname(state.targetPath), { recursive: true });
  fs.writeFileSync(state.targetPath, state.html, "utf8");

  const artifactContent = fs.readFileSync(state.targetPath);
  const artifactManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    generator: "scripts/build-prototype.mjs",
    buildCommand: "node scripts/build-prototype.mjs",
    sourceRoot: "src",
    entry: path.relative(projectRoot, state.entryPath),
    sourceDigest: state.sourceDigest,
    sourceFiles: state.sourceFiles,
    artifactInputs: state.artifactInputs,
    artifact: {
      path: path.relative(projectRoot, state.targetPath),
      sha256: sha256(artifactContent),
      bytes: artifactContent.byteLength,
    },
    legacyBridge: false,
    architecture: "lightweight-modular",
    featureStatus: Object.fromEntries(
      state.modules.map((module) => [module.id, "modular-source"]),
    ),
  };
  fs.writeFileSync(
    state.artifactManifestPath,
    `${JSON.stringify(artifactManifest, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Built ${artifactManifest.artifact.path} (${artifactManifest.artifact.bytes} bytes)`,
  );
  console.log(`Source digest: ${state.sourceDigest}`);
  console.log(
    `Artifact manifest: ${path.relative(projectRoot, state.artifactManifestPath)}`,
  );
} catch (error) {
  console.error(`BUILD_FAILED\n${error.message}`);
  process.exit(1);
}
