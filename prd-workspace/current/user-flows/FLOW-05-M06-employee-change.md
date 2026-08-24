# FLOW-05 M06-employee-change

- 原始行：1320
- 原始最近标题：关键字段通俗释义
- 迁移方式：Mermaid block mechanical copy
- 当前定位：Current Mechanical Evidence；DEC-165 已将旧调岗/移动容器及员工停用/恢复审批分支替代为 M06 普通编辑和直接状态操作

```mermaid
flowchart TD
    A[HR/系统管理员打开员工新增或普通编辑] --> B[多选平级部门并维护人工系统角色]
    B --> C{字段与版本校验}
    C -- 失败 --> D[保持全部原值并提示修正或刷新]
    C -- 通过 --> E[部门集合与人工角色立即生效]
    E --> F[写入直接生效审计,无审批与交接]
    G[HR/系统管理员选择停用或恢复] --> H[填写原因并确认]
    H --> I[员工与账号状态立即生效,不创建审批]
```

> Historical / Replaced Evidence：原机械迁移图中的“员工调岗/移动 -> 责任交接 -> 影响摘要 -> 二次确认”和“员工停用/恢复 -> 部门主管链审批”已由 DEC-165 替代，不再作为 Current Rule。
