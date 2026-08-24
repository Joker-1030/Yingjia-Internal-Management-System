# FLOW-13 M05-deactivation-and-restore

- 原始行：2602
- 原始最近标题：F5 对象停用与恢复
- 迁移方式：Mermaid block mechanical copy
- 当前定位：Current Product Flow 使用下方 Current 分支；原机械迁移块保留为 Historical / Replaced Evidence（DEC-163）

## Current Product Flow

```mermaid
flowchart TD
    A[总裁/市场副总/区域总监/PM/admin<br/>按真实对象范围发起停用] --> B{对象与发起人责任}
    B --> C[按对象责任逐级审批<br/>发起人不得自审]
    C -- 驳回/撤回 --> D[对象保持正常]
    C -- 通过 --> E[停用生效<br/>统一关闭适用未完成任务并留痕]
    E --> F[有权角色按同一范围申请恢复]
    F --> G[按对象责任逐级审批]
    G -- 通过 --> H[恢复正常<br/>不自动取回责任或补造历史任务]
```

HR/人事没有客户侧停用/恢复发起权。Current Rule 不提供通用任务转移、迁移或重新分配能力。

## Historical / Replaced Evidence

以下机械迁移块原样保留；其中“未完成任务按申请中的处理方式转移或关闭”已被 DEC-163 替代，不再作为 Current Rule。

```mermaid
flowchart TD
    A[发起对象停用<br/>客户单位/关键人/集团/客户部门] --> B{对象与发起人}
    B -- PM负责对象:PM或区域总监发起 --> C[所属区域总监审批<br/>总监本人发起时市场副总审]
    B -- 省公司对象:区域总监发起 --> D[市场副总审批]
    B -- 市场副总发起 --> E[总裁审批]
    B -- 系统管理员发起 --> F[按对象责任路由]
    B -- 集团/部门:总裁发起 --> G[直接形成已通过实例]
    C --> H{结果}
    D --> H
    E --> H
    F --> H
    G --> I
    H -- 驳回/撤回 --> J[对象保持正常]
    H -- 通过 --> I[停用生效:退出候选与统计,数据不删除<br/>未完成任务按申请中的处理方式转移或关闭]
    I --> K[申请恢复]
    K --> L[按同一责任路由审批]
    L -- 通过 --> M[恢复正常,责任不自动取回]
```
