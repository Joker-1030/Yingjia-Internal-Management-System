# M04 审批中心

- 文档状态：Current deferred module boundary
- Product Status：`DEFERRED`
- Product Review Status：`NOT REVIEWED`
- Engineering Status：`NOT STARTED`
- Source of Truth：本文件（M04）；模块集合入口为 `prd-workspace/current/PRD.md`
- 当前收口依据：DEC-204

## Quick Overview

M04 审批中心尚未完成产品评审，也未进入正式研发。当前不提供审批中心菜单、页面、流程实例、处理节点、审批待办、抄送或审批通知。

当前已经定义的业务操作由各来源模块在原权限、校验、影响确认、生效时点、事务边界和历史规则下直接或按计划日期生效。具体边界见 `DEC-204《当前业务操作取消审批并由来源模块生效》`：[`prd-workspace/decisions/DEC-204-当前业务操作取消审批并由来源模块生效.md`](../../decisions/DEC-204-当前业务操作取消审批并由来源模块生效.md) → “决策”第 1-12 项。

## 1. Current Boundary

### 1.1 当前不提供

- 审批中心菜单、列表、详情 Drawer 和数量入口；
- 审批流程编号、实例、节点、审批人、意见和进度；
- 目标责任人接收、会签、加签、转交、撤回和代办；
- 审批抄送、审批待办、审批结果通知；
- 审批回调、`已通过-业务处理失败`、回调重试和处理人失效替换；
- 从业务详情或历史记录下钻审批详情。

### 1.2 当前业务 Owner

| 业务 | Owner | 当前结果 |
| --- | --- | --- |
| 关键人调岗 | M02 客户经营 | 校验后直接生效或待生效；无接收和审批 |
| 任务延期、暂停、取消 | M03 维系管理 | 校验及二次确认后直接生效 |
| 逾期补录 | M03 维系管理 | 日期、原因和证明校验后直接形成正式记录并认定按期 |
| 地市责任交接 | M08 区域中心与地市配置 | 直接生效或待生效；无区域总监审批 |
| 已发布销售指标调整 | M12 销售与商机管理 | 守恒与范围校验后直接形成新生效版本 |
| 停用/恢复 | 各对象 Owner | 按 DEC-203 继续直接生效，不进入 M04 |

## 2. 历史边界

已经存在的历史审批记录是不可改写的只读证据，但当前不建设审批历史页面或对外入口。历史证据不能恢复为 Current Product Rule，也不能用来推导未来审批中心的页面、字段、状态或流程。

## 3. 未来审批中心

未来统一审批中心为 `DEFERRED`。后续专项至少需重新评审：业务类型、发起人、路由、节点、审批人、接收人、状态、操作、生效时点、失败处理、抄送、通知和历史入口。在专项形成新的 Current Product Rule 前，实现不得根据历史 Git 内容、Demo 或 Archive 恢复任何审批能力。

## 4. 关联治理

- Decision：[`DEC-204`](../../decisions/DEC-204-当前业务操作取消审批并由来源模块生效.md) → “决策”第 1-12 项。
- 停用边界：[`DEC-203`](../../decisions/DEC-203-当前全部停用操作直接生效并暂不进入审批中心.md) → “决策”第 1-7 项。
- Acceptance：[`prd-workspace/current/acceptance/M04.md`](../acceptance/M04.md) → `AC-F011-37`。
- Flow：[`prd-workspace/current/user-flows/FLOW-09-M04-approval-lifecycle.md`](../user-flows/FLOW-09-M04-approval-lifecycle.md) → “Current Boundary”。
- 评审/研发状态证据：[`docs/AI_IMPLEMENTATION_RESULTS/PRD-REVIEW-BASELINE-REGISTRY-001.md`](../../../docs/AI_IMPLEMENTATION_RESULTS/PRD-REVIEW-BASELINE-REGISTRY-001.md) → “1. Review Status Registry”的 M04/M05 行。

## 5. 修订记录 / PRD Revision History

| 日期 | 修订内容 |
| --- | --- |
| 2026-09-04 | • M04 明确为未评审、未研发的延期能力，当前不提供菜单、页面或新审批事实；M02/M03/M08/M12 现有业务操作取消审批，保留业务边界并由各 Owner 直接或按计划日期生效；历史审批证据保留但当前无入口。 |
