# FLOW-09 M04 approval lifecycle

## Current Boundary

M04 审批中心为 `NOT REVIEWED / NOT STARTED / DEFERRED`，当前没有可执行的审批生命周期。各来源模块按 DEC-204 直接或按计划日期生效：

```mermaid
flowchart TD
    A[来源模块有权用户提交业务操作] --> B{权限、字段、状态、影响与并发校验}
    B -- 不通过 --> C[来源模块阻止并显示业务错误]
    B -- 通过 --> D[用户确认]
    D --> E{是否有计划生效日期}
    E -- 否 --> F[来源模块直接生效并记录历史]
    E -- 是且未到 --> G[待生效\n原业务事实继续有效]
    G --> H[到期时来源模块重新校验]
    H -- 通过 --> F
    H -- 不通过 --> I[来源模块记录失败\n不形成审批回调失败]
```

本 Flow 不定义未来审批中心的节点、状态、人员或操作。历史版本可通过 Git/Archive 用于追溯，但不是 Current Product Rule。

精确来源：`DEC-204《当前业务操作取消审批并由来源模块生效》`，见 [`prd-workspace/decisions/DEC-204-当前业务操作取消审批并由来源模块生效.md`](../../decisions/DEC-204-当前业务操作取消审批并由来源模块生效.md) → “决策”第 1-12 项。
