# 英嘉科技内部管理系统

本仓库的 GitHub 版本定位为研发协作镜像，提供当前产品需求、Prototype 和维护中的前端实现。完整内部工作区中的治理报告、AI 执行记录、历史快照和归档不属于公开镜像。

## 产品需求

- 当前唯一 PRD 入口：[`prd-workspace/current/PRD.md`](prd-workspace/current/PRD.md)
- 模块需求：[`prd-workspace/current/modules/`](prd-workspace/current/modules/)
- 验收口径：[`prd-workspace/current/acceptance/`](prd-workspace/current/acceptance/)
- 产品决策：[`prd-workspace/decisions/`](prd-workspace/decisions/)

需求变化应先更新并确认当前产品来源，再创建独立实施任务。实现通过 CODEX Review 后，才可进入发布检查。

## Prototype

当前可查看产物为 [`demo/prototype.html`](demo/prototype.html)，维护源位于 [`src/`](src/)。本项目当前构建脚本无第三方运行时依赖，需使用支持 ES modules 的 Node.js 20 或兼容版本。

```bash
npm run build:prototype
npm run check:prototype
```

`build:prototype` 从 `src/` 生成 Prototype 和 artifact manifest；`check:prototype` 只读验证 source/artifact digest 是否一致。

## 代码入口

- Prototype 入口：[`src/prototype.html`](src/prototype.html)
- 应用启动：[`src/app.js`](src/app.js)
- 业务模块：[`src/modules/`](src/modules/)
- 数据与样例状态：[`src/data/`](src/data/)

## 变更与 Review

研发变更使用独立任务和分支，分支格式为：

```text
ai/<AI-ID>/<TASK-ID>-<description>
```

每次提交必须保留 AI ID、Task ID 和任务依据。未经 CODEX Review `PASS` 的实现不得进入发布候选。

GitHub 发布范围由 [`docs/GITHUB_PUBLISH_RULES.md`](docs/GITHUB_PUBLISH_RULES.md) 和 [`.github/publish-manifest.json`](.github/publish-manifest.json) 共同约束。发布候选在 Push 前必须通过：

```bash
node .github/scripts/check-publish-policy.mjs --all
```

通过检查不等于获得 Push 授权；首次及后续发布仍需 Product Owner 明确批准。
