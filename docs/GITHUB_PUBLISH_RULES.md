# GitHub Publish Rules

## 1. Purpose And Boundary

This repository has two distinct scopes:

- **Local Workspace**: the complete internal record, including current product sources, implementation, governance reports, AI task/result records, archives, snapshots, and historical material.
- **Engineering Public Mirror**: a deliberately filtered tree containing only the current PRD, current Prototype, maintained source, and the minimum engineering files required to inspect and validate them.

The Local Workspace is never published as a directory copy. A Git remote or a successful commit does not authorize publication.

The required release gate is:

```text
PRD -> Task -> Implementation -> CODEX Review = PASS -> Commit
    -> Approved publish candidate tree -> Publish Check --all -> Authorized Push
```

`PASS WITH FIXES`, `FAIL`, and `PRODUCT CONFIRMATION REQUIRED` are not publishable states. Push authorization is a separate Product Owner decision.

## 2. Source Of Publish Scope

`.github/publish-manifest.json` is the machine-readable allowlist. This document explains its policy; the manifest determines the exact paths accepted by the checker.

A future publish operation must construct or select a candidate tree containing only allowlisted paths. It must then run:

```bash
node .github/scripts/build-publish-candidate.mjs --source <reviewed-commit> --target <clean-publish-worktree>
node .github/scripts/check-publish-policy.mjs --all
```

Only a successful full-tree check may authorize the candidate for a separately approved push. Staged, range, and explicit-path checks are useful preflight checks but do not authorize publication by themselves.

The candidate builder reads committed content from the declared source commit, applies the manifest include/exclude/sensitive rules, verifies every required file, and materializes the result only into a clean worktree belonging to this repository. It never reads uncommitted Local Workspace files. The generated candidate must be staged and checked as a complete tree before its release commit is created.

## 3. Allowed Public Content

The current allowlist contains only paths that exist and are needed by engineering:

### Current product sources

- `prd-workspace/current/PRD.md`
- `prd-workspace/current/modules/`
- `prd-workspace/current/acceptance/`
- `prd-workspace/current/shared/`
- `prd-workspace/current/user-flows/`
- `prd-workspace/decisions/`
- `prd-workspace/DECISIONS.md`
- `prd-workspace/GLOSSARY.md`
- `prd-workspace/README.md`
- `demo-src/product-boundary-map.json`

`prd-workspace/current/` is intentionally not allowed as a whole because it also contains historical and governance material.

### Current Prototype and maintained implementation

- `demo/prototype.html`
- `demo/prototype.artifact.json`
- `src/`

`demo/` is intentionally not allowed as a whole because it contains archived and superseded Demo files. The current Prototype is generated from `src/`; its source/artifact consistency must pass before publication.

### Minimum engineering infrastructure

- `README.md`
- `.gitignore`
- `package.json`
- `scripts/build-prototype.mjs`
- `scripts/check-prototype-drift.mjs`
- `scripts/prototype-build-lib.mjs`
- `docs/GITHUB_PUBLISH_RULES.md`
- `.github/publish-manifest.json`
- `.github/scripts/build-publish-candidate.mjs`
- `.github/scripts/check-publish-policy.mjs`
- `.github/workflows/publish-check.yml`

Adding another public path requires a reviewed change to both this policy and the manifest. Directory growth does not automatically expand the mirror.

## 4. Content Never Published Automatically

The following are denied even if a broad future include pattern could otherwise match them:

- `archive/`, `snapshots/`, history, old Prototype, and internal handoff material;
- `docs/archive/`, including archived governance, migration, confirmation, completion, and audit evidence;
- `prd-workspace/current/governance/` and `prd-workspace/current/PRD_customer_management_full.md`;
- `docs/AI_IMPLEMENTATION_TASKS/`, `docs/AI_IMPLEMENTATION_RESULTS/`, `docs/AI_AGENT_REGISTRY.md`, and `docs/AI_COLLABORATION_RULES.md`;
- internal Governance, Semantic, Completion, Migration, Closure, Revalidation, and Remediation reports;
- `.env`, local environment variants, secrets, credentials, tokens, private keys, certificates containing private material, local databases, and credential stores;
- logs, caches, build directories, editor state, temporary files, OS metadata, and other local artifacts;
- files larger than the manifest limit unless a future reviewed manifest revision explicitly permits the exact file.

`.env.example` and `.env.sample` are not currently allowlisted. A future policy change may allow them only after confirming that they contain placeholders and no real credentials.

## 5. Publish Check

The dependency-free Node.js checker validates:

1. manifest syntax and required fields;
2. required-file existence and allowlist coverage;
3. every candidate path against include, exclude, sensitive, local-artifact, and internal-report rules;
4. a conservative file-size limit and basic secret-content signatures;
5. Prototype source/artifact provenance via `npm run check:prototype`.

Failures print:

```text
GITHUB_PUBLISH_BLOCKED
```

followed by each path and reason. The checker never edits files and never pushes.

Supported preflight modes:

- `--all`: validate every tracked file in the candidate tree; required before publication.
- `--staged`: validate staged paths.
- `--range <base>..<head>`: validate paths changed in a commit range.
- `--paths <path...>`: validate an explicit path set for deterministic checks.

With no mode, the checker examines staged paths when present, otherwise the paths in `HEAD`. This default is feedback only, not publication authorization.

## 6. GitHub Actions

`.github/workflows/publish-check.yml` runs the full-tree check on pushes and pull requests in the Engineering Public Mirror. It has read-only repository permission, does not use browser automation, does not alter files, and does not deploy.

The workflow is a gate, not a synchronizer. It cannot make an internal tree public, select files, merge branches, or grant push permission.

## 7. Branch And Authorization Policy

Implementation Agents continue to work on `ai/<AI-ID>/<TASK-ID>-<description>` branches and must not write directly to `main`. This policy does not select or change the eventual GitHub release branch.

The Product Owner has designated GitHub `main` as the Engineering Public Mirror target. A local AI branch is never pushed as that target. CODEX creates a filtered candidate branch whose parent is the current remote `main`, commits the complete allowlisted tree there, and pushes that candidate commit to remote `main` only when the update is a normal fast-forward.

Publishing always uses committed, reviewed content, never an uncommitted working tree. Before the first or any later push, CODEX must confirm:

- the relevant review result is `PASS`;
- the candidate tree contains only approved commits and allowlisted paths;
- `check-publish-policy.mjs --all` passes;
- the Product Owner has authorized that push and its target branch.

Without all four conditions, the result is `GITHUB_PUBLISH_BLOCKED` and no push is permitted.

Repository reachability, SSH authentication, CI success, `PASS`, `READY`, or a previous Push approval does not authorize a new Push. Every Push requires an explicit Product Owner authorization for the candidate and target in question.
