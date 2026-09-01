# 英嘉科技内部管理系统

本仓库面向研发协作，提供当前产品需求、Prototype 和维护中的前端实现。

项目背景、产品体系、模块边界、Prototype 和源码入口见 [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)。

## 先看这里

| 想了解 | 入口 |
| --- | --- |
| 项目有哪些功能、当前做到哪里 | [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) |
| 当前产品需求 | [`prd-workspace/current/PRD.md`](prd-workspace/current/PRD.md) |
| 当前可点击 Demo | [`demo/prototype.html`](demo/prototype.html) |
| 当前源码 | [`src/`](src/) |
| 每类文件的用途 | [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md#8-当前项目主要目录) 的“当前项目主要目录” |
| 历史文件与恢复方式 | Local Workspace 的 `archive/`（GitHub 镜像不包含历史资料） |

日常工作只需要使用上表入口。旧 PRD、旧 Demo、阶段报告、已完成 Task/Result 和快照统一保存在 `archive/`，不再散落在根目录、`docs/`、`demo/` 或 `prd-workspace/current/`。

## 需求状态与研发边界

本仓库的 Current PRD 可以持续演进。`Current PRD` 表示当前最新产品事实，`Product Review Status` 表示模块是否完成正式产品评审，`Engineering Status` 表示该模块的正式研发是否已经开始；三个概念相互独立，不能混为一谈。

| 模块 | 产品评审 | 研发状态 | 当前用途 |
| --- | --- | --- | --- |
| M01 工作台 | 未评审 | 未开始 | 产品规划 |
| M02 客户经营 | 已评审 | 研发中 | 当前研发依据 |
| M03 维系管理 | 已评审 | 研发中 | 当前研发依据 |
| M04 审批中心 | 已评审 | 研发中 | 当前研发依据 |
| M05 停用记录 | 已评审 | 研发中 | 当前研发依据 |
| M06 组织与员工 | 已评审 | 研发中 | 当前研发依据 |
| M07 权限授权 | 已评审 | 研发中 | 当前研发依据 |
| M08 区域中心与地市配置 | 已评审 | 研发中 | 当前研发依据 |
| M09 客户基础配置 | 已评审 | 研发中 | 当前研发依据 |
| M10 数据导入 | 未评审 | 未开始 | 产品规划 |
| M11 项目管理 | 未评审 | 未开始 | 产品规划 |
| M12 销售与商机管理 | 未评审 | 未开始 | 产品规划 |
| P00 登录 | 已评审 | 研发中 | 当前研发依据 |
| P01 消息中心 | 未评审 | 未开始 | 产品规划 |

已评审模块可以作为当前研发依据。研发应结合 Current PRD 与对应 Acceptance、Decision、Flow、Shared 等当前产品来源实施；已评审不表示需求永久冻结，后续 Current PRD 变化仍需判断属于澄清、变更、删除或延期，以及是否影响在研任务。

未评审不等于无效：这些模块已经存在于 Current Product Source，可以阅读、理解、参与讨论和发现问题，但尚未成为已评审研发基线。未经 Product Owner 明确授权，研发不得自行开始实现、拆分研发任务、扩展现有模块能力，或根据 Demo、代码、Git Commit、Implementation Result、CODEX Review 等证据补充产品规则。

研发阅读顺序：

1. 先看 [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)。
2. 再看 [`prd-workspace/current/PRD.md`](prd-workspace/current/PRD.md)。
3. 再看本次涉及模块的 Current Module PRD。
4. 再看对应 Acceptance、Decision、Flow、Shared、Glossary 和 Product Boundary。
5. Demo 仅用于理解当前方案，不作为需求事实源。

## 产品需求

- 当前唯一 PRD 入口：[`prd-workspace/current/PRD.md`](prd-workspace/current/PRD.md)
- 模块需求：[`prd-workspace/current/modules/`](prd-workspace/current/modules/)
- 验收口径：[`prd-workspace/current/acceptance/`](prd-workspace/current/acceptance/)
- 产品决策：[`prd-workspace/decisions/`](prd-workspace/decisions/)

需求变化以 Current PRD、对应模块规则和验收口径为准；实现不得从 Demo 或代码反推新的产品规则。

## 修订记录与变更查看

GitHub 提交说明用于概括本次同步内容并提供阅读入口，不替代 Current PRD 中的正式修订记录。查看需求变化时按以下顺序定位：

| 想了解的内容 | 查看位置 |
| --- | --- |
| 本次跨模块修订摘要 | [`prd-workspace/current/PRD.md`](prd-workspace/current/PRD.md) 底部的“修订记录 / PRD Revision History” |
| 某个模块在同一日期的具体修订 | [`prd-workspace/current/modules/`](prd-workspace/current/modules/) 中对应模块 PRD 底部的“修订记录 / PRD Revision History” |
| 修订后的完整产品规则 | 对应模块 PRD 正文；模块入口见 [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md#5-产品模块说明) |
| 决策原因和新旧规则替代关系 | [`prd-workspace/decisions/`](prd-workspace/decisions/) 中 GitHub 提交说明列出的 Decision |
| 可独立验证的验收结果 | [`prd-workspace/current/acceptance/`](prd-workspace/current/acceptance/) 中对应模块验收文件 |
| 当前可点击展示效果 | [`demo/prototype.html`](demo/prototype.html)；维护源位于 [`src/`](src/) |

阅读某次 GitHub 更新时，先根据提交说明中的“修订日期”和“涉及模块”查看总 PRD 与模块 PRD 的同日修订记录，再沿说明列出的 PRD、Decision、Acceptance 和 Prototype 路径查看完整内容。提交说明没有列出的文件不应被推断为本次修订范围。

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

## 当前目录

```text
prd-workspace/current/  当前产品事实
src/                    Prototype 唯一维护源
demo/                   当前生成产物
docs/                   当前项目说明与有效治理入口
references/             当前 Prototype 维护规范
scripts/                构建、检查与审计
archive/                所有历史产品、Demo、治理记录和快照
```
