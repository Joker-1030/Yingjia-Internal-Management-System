# PRD Workspace Reading Guide

- 更新日期：2026-08-24
- 当前阶段：Modular PRD Source of Truth Active
- 当前状态：M01-M10 Source of Truth Migration 已执行；旧完整 PRD 保留为 Historical / Migration Baseline

## 当前真相层级

迁移完成后，按以下优先级读取：

1. `current/PRD.md`：模块化 PRD 人类入口和产品地图。
2. `current/modules/M01-dashboard.md` 至 `M10-import.md`：客户管理唯一 PRD Source of Truth。
3. `current/shared/`：跨模块唯一产品事实。
4. `current/acceptance/`：260 条稳定 Acceptance Criteria。
5. `decisions/index.md`、`decisions/` 和 `DECISIONS.md`：166 个 Decision 的可解析入口、拆分记录和追加式原始替代链。
6. `current/user-flows/`：已分类的 Current / Historical / Replaced Flow 证据。
7. `GLOSSARY.md`：当前唯一术语表。
8. `demo-src/product-boundary-map.json`：模块职责、核心对象、排除项、状态层次和关系。
9. `current/PRD_customer_management_full.md`：Historical / Migration Baseline，只用于迁移前事实和旧行号追溯。

模块、Acceptance、Decision、Flow 或 Shared 出现新冲突时，遵循 Product Owner 明确 Current Rule、有效 Decision、Owner 模块、Acceptance、Flow、Shared、Historical Evidence 的治理顺序；不得从旧完整 PRD 恢复已替代规则。

## AI 阅读顺序

收到产品需求时：

1. 阅读本文件，确认迁移状态和 Source of Truth。
2. 阅读 `current/PRD.md`，了解产品范围、角色、原则和模块地图。
3. 根据 Product Boundary 定位 M01-M10 主模块。
4. 阅读对应的 `current/modules/Mxx-*.md`。
5. 阅读模块列出的相关 Decision；以 `decisions/index.md` 定位当前状态，并用根级 `DECISIONS.md` 追溯原始记录。
6. 阅读对应的 `current/acceptance/Mxx.md`。
7. 阅读 `GLOSSARY.md` 和 `demo-src/product-boundary-map.json` 的相关条目。
8. 对模块未覆盖的字段、权限、状态、流程或提示语，报告 `unknown` 或 Governance Needed；旧完整 PRD只能作为历史证据，不自动恢复为 Current Rule。
9. 完成 Feature Classification 和 Impact Analysis，获得确认后才修改产品或 Prototype。

## 日常入口

| 内容 | 路径 |
| --- | --- |
| 模块化产品入口（Active） | `current/PRD.md` |
| M01-M10 PRD Source of Truth | `current/modules/` |
| Acceptance（Active） | `current/acceptance/` |
| User Flows（Active governed evidence） | `current/user-flows/` |
| Shared Product Facts（Active） | `current/shared/` |
| Decision 原始追加式记录 | `DECISIONS.md` |
| Decision 可解析入口与拆分记录 | `decisions/index.md`、`decisions/` |
| Glossary（Active） | `GLOSSARY.md` |
| 旧完整 PRD（Historical / Migration Baseline） | `current/PRD_customer_management_full.md` |
| 历史修订 | `history/` |
| Product Boundary | `../demo-src/product-boundary-map.json` |

## 禁止事项

- 不从候选摘要推导旧 PRD 未定义的业务规则。
- 不修改 Decision 的结论、状态或替代关系。
- 不修改 Acceptance Criteria 的 ID、文字或优先级。
- 不在 PRD 中写入 API、数据库、服务拆分或前端实现。
- 不直接根据文件位置扩大模块边界。
- 不删除旧完整 PRD、原始 Decision、Glossary 或历史证据。

## Source of Truth Migration 状态

以下迁移条件已于 2026-08-24 满足：

- 旧 PRD 全部二级章节均有唯一迁移归属；
- Decision、AC、Glossary 和 Mermaid 机械校验通过；
- M01-M10 产品经理语义验收完成；
- 字段、权限、状态、流程和提示语覆盖无缺失；
- AI 维护规则、Handoff 和文件索引同步完成；
- Product Owner 明确批准将 M01-M10 作为正式 PRD Source of Truth 并执行迁移。

迁移后不得把旧完整 PRD重新解释为并行 Current Source of Truth，也不得删除它或任何 Historical / Replaced Evidence。后续 Source of Truth 结构变更需要新的明确批准。
