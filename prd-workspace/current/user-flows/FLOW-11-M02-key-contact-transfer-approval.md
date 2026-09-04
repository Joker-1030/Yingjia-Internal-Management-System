# FLOW-11 M02-key-contact-transfer-approval

- 原始行：2568
- 原始最近标题：F3 关键人调岗
- 迁移方式：Mermaid block mechanical copy
- 当前定位：Current Product Flow；文件名为历史兼容标识。DEC-204 已取消关键人调岗的目标 PM 接收和所有上级审批，当前只表达直接/待生效业务流程。

```mermaid
flowchart TD
    A[发起关键人调岗] --> B{变更范围}
    B -- 同单位变更 --> C[校验权限、目标路径、影响、日期和版本]
    B -- 跨单位调岗 --> C
    C -- 不通过 --> D[阻止提交并保持原任职]
    C -- 通过 --> E[用户确认影响]
    E --> J{计划调岗日是否为当日?}
    J -- 否 --> K[待生效<br/>原任职继续有效]
    K --> J
    J -- 是或到期 --> L{重新校验后任职/责任/岗位仍合法吗?}
    L -- 失效 --> M[M02记录业务失败<br/>原任职保持,可对原记录幂等重试]
    L -- 合法 --> N[关闭原任职,建立新任职<br/>责任与覆盖KPI按新任职重算]
```

> Historical / Replaced：本文件旧机械块曾包含目标 PM 接收、上级审批、驳回和`已通过-业务处理失败`。这些语义已被 DEC-204 替代；旧表达只用于 Git/Archive 追溯，不再作为 Current Rule。
