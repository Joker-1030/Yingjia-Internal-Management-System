import fs from "node:fs";
import path from "node:path";

import {
  inspectPrototypeSource,
  projectRoot,
  readArtifactManifest,
  sha256,
} from "./prototype-build-lib.mjs";

try {
  const state = inspectPrototypeSource();
  const drift = [];

  if (!fs.existsSync(state.artifactManifestPath)) {
    drift.push(
      `Missing artifact manifest: ${path.relative(projectRoot, state.artifactManifestPath)}`,
    );
  }
  if (!fs.existsSync(state.targetPath)) {
    drift.push(`Missing artifact: ${path.relative(projectRoot, state.targetPath)}`);
  }

  if (!drift.length) {
    const manifest = readArtifactManifest(state.artifactManifestPath);
    const artifact = fs.readFileSync(state.targetPath);
    const artifactHash = sha256(artifact);
    const targetRelative = path.relative(projectRoot, state.targetPath);
    const entryRelative = path.relative(projectRoot, state.entryPath);

    if (manifest.sourceDigest !== state.sourceDigest) {
      drift.push(
        `Source digest changed: built ${manifest.sourceDigest}, current ${state.sourceDigest}`,
      );
    }
    if (manifest.entry !== entryRelative) {
      drift.push(`Entry changed: built ${manifest.entry}, current ${entryRelative}`);
    }
    if (manifest.artifact?.path !== targetRelative) {
      drift.push(
        `Artifact target changed: built ${manifest.artifact?.path}, current ${targetRelative}`,
      );
    }
    if (manifest.artifact?.sha256 !== artifactHash) {
      drift.push(
        `Artifact hash changed: built ${manifest.artifact?.sha256}, current ${artifactHash}`,
      );
    }
    if (manifest.artifact?.bytes !== artifact.byteLength) {
      drift.push(
        `Artifact size changed: built ${manifest.artifact?.bytes}, current ${artifact.byteLength}`,
      );
    }
  }

  if (drift.length) {
    console.error("SOURCE_ARTIFACT_DRIFT");
    drift.forEach((message) => console.error(`- ${message}`));
    console.error("Run: npm run build:prototype");
    process.exit(1);
  }

  console.log(`SOURCE_ARTIFACT_OK ${state.sourceDigest}`);
} catch (error) {
  console.error(`DRIFT_CHECK_FAILED\n${error.message}`);
  process.exit(1);
}
