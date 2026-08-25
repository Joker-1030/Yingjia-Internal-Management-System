# GitHub Publish Rules

## 1. Purpose And Remote Policy

The Product Owner has restored the personal GitHub repository as this project's only active synchronization target:

```text
origin = Primary GitHub Engineering Mirror
git@github.com:Joker-1030/Yingjia-Internal-Management-System.git
target branch = main
```

The Company Git remote remains configured only for historical reference:

```text
company = Disabled / No Sync
ssh://git@code.gaizee.cn:3222/qinyong/Yingjia-Internal-Management-System.git
```

Do not fetch, pull, push, synchronize, or release to `company` unless the Product Owner explicitly changes this policy again. Repository-local `remote.pushDefault` must be `origin`, but that setting never grants Push authorization.

The repository has two distinct content scopes:

- **Local Workspace**: the complete internal record, including current product sources, implementation, governance reports, AI Task/Result records, archives, snapshots, and historical material.
- **GitHub Engineering Mirror**: a deliberately filtered tree containing only the current PRD, current Prototype, maintained source, and minimum engineering files required to inspect and validate them.

The Local Workspace is never published as a directory copy. A Git remote, successful commit, previous Push, or reachable repository does not authorize publication.

## 2. Required Release Gate

```text
PRD -> Task -> Implementation -> CODEX Review = PASS -> accepted commit
-> filtered publish candidate -> Publish Check --all -> sensitive scan
-> Product Owner authorization for this candidate and origin/main -> Push
```

`PASS WITH FIXES`, `FAIL`, and `PRODUCT CONFIRMATION REQUIRED` are not publishable states. Every Push requires a new explicit Product Owner authorization.

## 3. Source Of Publish Scope

`.github/publish-manifest.json` is the machine-readable allowlist and the exact GitHub publication boundary. A future GitHub operation must construct or select a candidate containing only allowlisted paths and run:

```bash
node .github/scripts/build-publish-candidate.mjs --source <reviewed-commit> --target <clean-publish-worktree>
node .github/scripts/check-publish-policy.mjs --all
```

Only a successful full-tree check may qualify the candidate for a separately authorized Push. Staged, range, and explicit-path checks are preflight evidence but do not authorize publication by themselves.

The candidate builder reads committed content from the declared reviewed commit, applies include/exclude/sensitive rules, verifies required files, and materializes the result only into a clean worktree belonging to this repository. It never reads uncommitted Local Workspace files.

## 4. Allowed GitHub Content

The exact list remains in `.github/publish-manifest.json`. Its intended categories are:

### Current product sources

- `prd-workspace/current/PRD.md`
- current module PRDs, Acceptance, Shared facts, and User Flows
- current Decisions, decision index, Glossary, and PRD workspace README
- current Product Boundary source required by the Prototype

Current product directories are not automatically allowed as a whole when they also contain governance or historical material.

### Current Prototype and maintained implementation

- current `demo/prototype.html` and provenance artifact
- maintained `src/`
- required build and drift-check scripts

Generated artifacts must match their maintained source before publication.

### Minimum engineering infrastructure

- `README.md`, `.gitignore`, and `package.json`
- required build/check scripts
- this policy, publish manifest, candidate builder, checker, and read-only workflow

Adding another GitHub path requires a reviewed change to both this policy and the manifest. Directory growth does not automatically expand the mirror.

## 5. Content Never Published Automatically

The following remain excluded from the GitHub candidate even when tracked locally:

- `archive/`, `snapshots/`, `docs/archive/`, history, old Prototype, and internal handoff material;
- internal Governance, Semantic, Completion, Migration, Closure, Revalidation, Remediation, confirmation, and audit reports;
- `docs/AI_IMPLEMENTATION_TASKS/`, `docs/AI_IMPLEMENTATION_RESULTS/`, `docs/AI_AGENT_REGISTRY.md`, and `docs/AI_COLLABORATION_RULES.md`;
- `.env`, local environment variants, secrets, credentials, tokens, passwords, private keys, certificates containing private material, local databases, and credential stores;
- logs, caches, build directories, editor state, temporary files, OS metadata, and other local artifacts;
- pre-existing uncommitted/untracked files and unrelated or unreviewed Task content;
- files larger than the manifest limit unless a reviewed manifest revision explicitly permits the exact file.

Do not use `.gitignore`, `git add .`, or `git add -A` to bypass explicit candidate scope. Do not delete Local Workspace evidence merely because it is excluded from GitHub.

## 6. Publish Check

The dependency-free checker validates:

1. manifest syntax and required fields;
2. required-file existence and allowlist coverage;
3. every candidate path against include, exclude, sensitive, local-artifact, and internal-report rules;
4. file-size limits and basic secret-content signatures;
5. Prototype source/artifact provenance via `npm run check:prototype`.

Failures print `GITHUB_PUBLISH_BLOCKED` followed by each path and reason. The checker never edits files, selects commits, synchronizes a remote, or grants Push permission.

Supported modes:

- `--all`: every tracked file in the filtered candidate; required before publication.
- `--staged`: staged-path preflight.
- `--range <base>..<head>`: commit-range preflight.
- `--paths <path...>`: explicit-path preflight.

## 7. GitHub Actions

`.github/workflows/publish-check.yml` runs the full-tree check on pushes and pull requests in the GitHub Engineering Mirror. It has read-only repository permission, does not use browser automation, does not alter files, and does not deploy.

The workflow is a gate, not a synchronizer. It cannot select files, merge branches, or grant Push authorization.

## 8. Branch And Authorization Policy

Implementation Agents continue to work on `ai/<AI-ID>/<TASK-ID>-<description>` branches and must not write directly to `main`. An AI branch is never pushed directly as the GitHub development line.

The Product Owner has designated GitHub `main` as the filtered Engineering Mirror target. CODEX creates or updates an isolated filtered candidate whose parent is the current remote `main`, commits only the complete reviewed allowlisted tree, and pushes to `origin/main` only when the result is a normal fast-forward.

Before any Push, CODEX must confirm:

- relevant CODEX Review is `PASS`;
- candidate contains only accepted commits and allowlisted paths;
- `check-publish-policy.mjs --all` passes on the complete candidate;
- sensitive scan and Prototype drift checks pass;
- remote remains the authorized personal GitHub repository;
- Product Owner explicitly authorized this candidate and `origin/main` Push.

Without every condition, no Push is permitted. Force Push, automatic merge, rebase, reset, clean, Pull Request creation, Release creation, and remote settings changes require separate explicit authority.
