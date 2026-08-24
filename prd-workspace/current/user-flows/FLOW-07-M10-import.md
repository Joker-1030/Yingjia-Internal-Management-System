# FLOW-07 M10-import

- 原始行：1997
- 原始最近标题：按钮与交互说明
- 迁移方式：Mermaid block mechanical copy
- 当前定位：Current Product Flow 使用下方 Current 分支；原机械迁移块保留为 Historical / Replaced Evidence（DEC-163）

## Current Product Flow

```mermaid
flowchart LR
    A[下载模板] --> B[上传文件]
    B --> C{单工作表业务行 <= 5,000?}
    C -- 否 --> D[批次级拒绝并明确提示]
    C -- 是 --> E[解析与预校验]
    E --> F[确认可导入行]
    F --> G[每一业务行独立原子处理]
    G --> H[成功行生效]
    G --> I[失败行保留错误结果]
    H --> J[生成批次结果报告]
    I --> J
```

100 行允许形成 80 行成功、20 行失败；失败行不回滚其他成功行。一行内对应业务对象不得形成产品事实半成品。

## Historical / Replaced Evidence

以下机械迁移块原样保留；“按工作表顺序原子写入”不得再解释为工作表整体原子。

```mermaid
flowchart LR
    A[下载模板] --> B[上传文件]
    B --> C[解析与预校验]
    C --> D{存在错误行?}
    D -- 是 --> E[查看错误明细/疑似重复<br/>修正后重新上传]
    E --> B
    D -- 否 --> F[确认导入]
    F --> G[按工作表顺序原子写入]
    G --> H[生成批次结果报告]
```
