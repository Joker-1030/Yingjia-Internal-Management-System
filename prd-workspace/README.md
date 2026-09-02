# PRD Workspace Reading Guide

- 更新日期：2026-09-01
- 当前产品入口：`current/PRD.md`
- 当前模块范围：M01-M12；P00/P01 为 Supporting Product Facts
- 生命周期：Current PRD 持续演进，Approved Baseline 通过 Registry 和 Git Commit 定位

## 当前真相层级

按以下顺序读取：

1. `current/PRD.md`：Current 产品地图与总入口。
2. `current/modules/`：模块 Owner 的当前产品规则。
3. `current/shared/`：跨模块共享事实。
4. `current/acceptance/`：可独立验证的验收条件。
5. `decisions/index.md` 与 `decisions/`：当前 Decision 状态、结论和替代关系。
6. `current/user-flows/`：Current / Historical / Replaced 流程证据。
7. `GLOSSARY.md`：当前术语。
8. `../demo-src/product-boundary-map.json`：模块职责和关系。
9. `../archive/product/`：历史 PRD、评审、增量和迁移证据，仅用于追溯。

`decisions/index.md` 和对应拆分文件是当前 Decision 入口；`DECISIONS.md` 只提供导航，旧追加式总表已归档。代码、Demo、Task、Result 和历史报告不能创建产品规则。

## 当前状态

| 范围 | Product Review | Engineering |
| --- | --- | --- |
| M02-M09、P00 | `REVIEWED` | `IN PROGRESS` |
| M01、M10、M11、P01 | `NOT REVIEWED` | `NOT STARTED` |
| M12 | `NOT REVIEWED` | `NOT STARTED` |

准确基线与证据见 `../docs/AI_IMPLEMENTATION_RESULTS/PRD-REVIEW-BASELINE-REGISTRY-001.md`。已评审不冻结 Current PRD；后续变化仍需分类并判断研发影响。

## 维护规则

- Current 产品变化写入 Owner 模块及必要的 Acceptance、Decision、Flow、Shared、Glossary 或 Product Boundary。
- Owner PRD 是本模块完整的产品入口，必须直接说明核心产品语义、对象、状态、操作、业务规则、指标、权限、流程和模块关系。复杂细节可以由 Shared、Decision、Acceptance 或 Flow 唯一维护，但 Owner PRD 必须保留足以理解业务的核心结论，并提供一次跳转即可定位的精确引用；不得只写“详见 Decision / Shared / Flow”来替代本模块的核心说明。
- Owner PRD 引用外部 Current Source 时，首次核心引用至少同时写明稳定 ID（如有）、仓库实际路径与文件名、文档标题，以及目标章节/标题或 AC 编号。只写编号、只写文件名、只链接目录或使用“相关文档”等模糊表述均不构成完整引用。
- 会改变用户看到的数据、排除项、排序、同序规则、展示字段、Top N、默认筛选/时间/展开、状态组合、指标结果或操作后结果的规则均属于 Product Behavior。Current 已确认但 Owner 缺失时标记 `DISCOVERABILITY GAP` 并补齐；仅在 Code/Prototype 存在时标记 `PRODUCT DEFINITION GAP` 并等待产品确认；不同 Current Source 冲突时标记 `SOURCE CONFLICT / PRODUCT DECISION REQUIRED`，不得自行选择。
- 独立 Decision 只用于需要长期单独追溯的重要产品选择；普通文案、字段说明、单模块交互、列表列和一般 UI 调整直接维护在 Owner 模块 PRD 及必要的 Acceptance/修订记录中，不为留痕额外创建 DEC。
- Shared 只维护多个模块真正共用且必须唯一维护的事实；单模块规则、页面细节、UI 文案、普通交互、单模块验收、AI 建议和技术实现说明留在各自 Owner。疑似过度 Shared 只记录为后续问题，不在普通结构任务中搬迁。
- 总 PRD 与直接受影响模块维护同日修订记录；同一天一行，按功能板块分组。
- 历史 Task、Result、Decision 和 Baseline 不因后续规则变化而改写。
- 新模块只从 Product Owner 明确授权进入 Current，并独立记录 Review 与 Engineering 状态。
- 历史文件统一进入顶层 `archive/`，不得在 `current/`、`demo/` 或项目根目录继续维护。

## 历史与恢复

- 历史产品：`../archive/product/`
- 历史 Demo：`../archive/demo/`
- 历史治理与执行记录：`../archive/governance/`
- 快照：`../archive/snapshots/`
- 移动索引：`../archive/ARCHIVE_INDEX.md`

归档不是删除。需要恢复时先查 Archive Index 和 Git 历史，不得覆盖当前同名文件。
