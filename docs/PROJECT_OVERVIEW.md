# 英嘉科技内部管理系统项目总览

- 更新日期：2026-08-31
- 当前产品阶段：立项与需求澄清，尚未完成产品评审或正式生产发布
- 当前产品事实入口：[`prd-workspace/current/PRD.md`](../prd-workspace/current/PRD.md)
- 当前工程镜像：GitHub `origin/main`

本文帮助 Product Owner、新加入项目的 AI、研发和后续维护人员快速建立全局认知。详细行为和执行约束仍以对应的 Current PRD 与项目规则文件为准；本文不替代它们。

## 1. 项目简介

英嘉科技内部管理系统当前聚焦基础权限、客户管理与项目管理，服务客户资产、关键人及任职、维系任务、审批、内部组织员工、角色权限、区域与地市责任、客户基础配置、数据导入和项目交付等业务。本期为 PC Web；当前商机/合同菜单、完整财务回款、正式讲师管理、项目取消审批和项目经营分析不在本期范围内。

项目当前处于立项与需求澄清阶段。M01-M11 已形成模块化 PRD Source of Truth，配套 Acceptance、Decision、User Flow、Shared、Glossary 和 Product Boundary；可点击 Prototype 用于产品方案验证、交互演示和研发理解。

> 本仓库中的 Demo 是产品方案验证和交互演示，不是正式生产系统代码。

`src/` 是当前 Prototype 的维护源，也不是已选定的生产技术架构。GitHub 是经过 Publish Manifest 过滤的当前研发工程镜像；公司 Gaizee Git 由公司侧后续从 GitHub 获取镜像，不是本地项目当前的直接 Push 目标。

## 2. 当前项目状态

截至 2026-08-31，仓库证据确认已经完成：

- 建立 Git Baseline，基线 commit 为 `5aff5210b709c2a5874e9736cf764287cb4d1e2e`。
- 完成 PRD Source of Truth Migration；M01-M11 自 2026-08-27 起共同构成正式模块化需求入口。
- 建立 M01-M11 Current Acceptance Criteria、Decision 索引与拆分记录、Current User Flow、Shared Product Facts、Glossary 和 Product Boundary。
- 建立可维护的模块化 Prototype Source、确定性构建、Artifact provenance 和 source/artifact drift check。
- 建立 Product Owner、CODEX 和 Implementation AI 的 Task、Result、Review、Branch、Commit 与发布门禁。
- 完成一轮历史治理报告归档，保留 36 份历史证据及 Archive Index，没有删除历史文件。
- 建立 GitHub 过滤发布策略、Publish Manifest、候选构建脚本、检查脚本和只读 GitHub Actions gate。
- GitHub `origin/main` 已形成当前研发工程镜像；完整 Local Workspace 仍保留内部 Task、Result、治理和历史资料。

“已完成上述治理与工程基础”不等于产品已评审或系统已上线。当前 PRD 仍标记为“立项与需求澄清 / 待产品评审”。

## 3. 产品需求体系

```text
prd-workspace/current/PRD.md
        ↓
M01-M11 Module PRD
        ↓
Acceptance
        ↓
Decision
        ↓
User Flow
        ↓
Shared
        ↓
Glossary
        ↓
Product Boundary
```

- **PRD**：`current/PRD.md` 是人类阅读入口，M01-M11 模块文件描述当前正式产品需求、页面、字段、权限、状态、规则和边界。
- **Acceptance**：`current/acceptance/` 保存稳定、可独立验证的验收条件，不由 Demo 行为替代。
- **Decision**：`decisions/` 与索引保存 Product Owner 已确认的决策、原因、替代关系和规则演进。
- **User Flow**：`current/user-flows/` 表达关键业务流程及其 Current、Historical 或 Replaced 状态。
- **Shared**：`current/shared/` 唯一维护跨模块共用的范围、角色权限、初始化、统一规则、对象状态、审计和研发评审事实。
- **Glossary**：`GLOSSARY.md` 统一业务术语和含义，避免模块自行解释同一个词。
- **Product Boundary**：`demo-src/product-boundary-map.json` 结构化记录模块职责、核心对象、页面、关系和明确排除项，用于定位业务 Owner，不替代详细 PRD。

阅读顺序和冲突治理见 [`prd-workspace/README.md`](../prd-workspace/README.md)。

## 4. Source of Truth 原则

当前产品事实以 [`prd-workspace/current/PRD.md`](../prd-workspace/current/PRD.md) 及其链接的当前模块化产品体系为准。

- `archive/`、`snapshots/`、`docs/archive/`、旧 PRD 和历史报告是 Historical Evidence，不是 Current Rule。
- 代码只表达当前实现状态，不能反推新产品需求。
- Demo 只表达当前产品方案，不是最终产品需求来源。
- Demo 与 PRD 不一致时，以 Current PRD 链为准，并由 Product Owner/CODEX 确认是否需要产品治理或工程修复。
- Product Owner 在聊天中的确认必须正式写入适当的 PRD、Decision、Acceptance、Flow、Shared、Glossary 或 Product Boundary，才能成为可持续维护的 Current Rule。
- Current 产品来源无法得出唯一答案时，停止相关业务修改并返回 `PRODUCT CONFIRMATION REQUIRED`。

## 5. 产品模块说明

| 模块 | 主要职责 | 重要对象 | 主要流程 | 主要关系 |
| --- | --- | --- | --- | --- |
| [M01 工作台](../prd-workspace/current/modules/M01-dashboard.md) | 按角色聚合经营指标、趋势、待办和重点动态，并按同一口径下钻 | 指标、经营对比、趋势、待办、重点动态、角色视图 | 登录后进入角色默认入口；周期切换、聚合查看和来源模块下钻 | 消费 M02-M11/P01 事实，不拥有来源业务生命周期 |
| [M02 客户经营](../prd-workspace/current/modules/M02-customer.md) | 浏览和使用客户资产，维护关键人身份及任职变化 | 集团、客户公司、关键人、任职、客户责任和健康 | 客户三栏浏览、关键人新增/编辑、关键人调岗及生效 | 消费 M08 责任、M09 主数据；对接 M03 任务、M04 审批、M05 停用 |
| [M03 维系管理](../prd-workspace/current/modules/M03-maintenance.md) | 将规则转为维系任务，管理专项/KPI 并沉淀维系记录 | 父任务、执行记录、专项、覆盖 KPI、维系记录、附件 | 规则生成、任务完成/补录、专项发布执行、异常审批 | 消费 M02/M08/M09 事实，由 M04 承载审批并向 M01 输出聚合 |
| [M04 审批中心](../prd-workspace/current/modules/M04-approval.md) | 统一承载跨业务审批实例、节点、动作、抄送和回调结果 | 审批实例、节点、处理动作、抄送、流程记录 | 发起后按路由处理、撤回/驳回/通过、来源业务生效与失败重试 | 审批容器归 M04；申请字段和业务生效仍归 M02/M03/M05/M08 等来源模块 |
| [M05 停用记录](../prd-workspace/current/modules/M05-archive.md) | 管理客户侧对象停用、恢复、影响和历史查询 | 停用/恢复申请、对象快照、影响摘要、停用记录 | 从业务对象发起、影响确认、审批、生效、恢复 | M02/M09 拥有对象，M04 拥有审批，M05 拥有停用恢复记录和历史 |
| [M06 组织与员工](../prd-workspace/current/modules/M06-organization.md) | 维护内部部门、主管、员工、账号、角色关联和人员变化 | 内部部门、成员关系、主管、员工、账号、系统角色关联 | 部门/员工维护，多部门与角色编辑，员工直接停用/恢复 | 向 M07/M08 等提供组织与人员资格；不维护权限模板或区域责任 |
| [M07 权限授权](../prd-workspace/current/modules/M07-permission.md) | 由 admin 维护非管理员角色模板的四层权限、版本和审计 | 角色模板、权限树、权限版本、影响预览、版本历史 | 修改权限、影响确认、保存、历史查看和回滚 | 只能收紧业务模块固定能力上限，不维护员工角色或数据范围事实 |
| [M08 区域中心与地市配置](../prd-workspace/current/modules/M08-region.md) | 维护区域与省份/驻地映射、地市负责人以及交接/直接调整 | 区域配置、省份映射、驻地、地市责任、地市交接 | 区域配置、地市分配/直接调整、PM 地市管理与交接 | 消费 M06 组织人员，向 M01/M02/M03 提供责任范围，审批容器归 M04 |
| [M09 客户基础配置](../prd-workspace/current/modules/M09-settings.md) | 唯一维护客户主数据树、职级周期提醒和生日/节假日规则 | 周期/提醒规则、行业、集团、客户公司、客户部门、标准岗位 | 规则保存、主数据维护及停用恢复、节假日日历同步 | 向 M02/M03/M10 提供稳定主数据和规则，不拥有日常经营或任务生命周期 |
| [M10 数据导入](../prd-workspace/current/modules/M10-import.md) | 通过模板、预校验、确认和报告完成受控批量录入 | 模板、文件、批次、预校验结果、错误/重复行、结果报告 | 下载模板、上传、预校验、确认导入、查看结果 | 写入时复用 M02/M08/M09 当前规则，不覆盖既有责任或任职事实 |
| [M11 项目管理](../prd-workspace/current/modules/M11-project-management.md) | 管理培训与 AI 软件项目的立项、执行、交付、资料、评价、商业配置和责任历史 | 项目、项目责任、商业快照、采购包、平台公司、项目人员、项目资料、满意度 | 项目创建、开始、交付、完成或取消，维护资料与评价，并随地区责任交接迁移项目责任 | 消费 M02/M06/M08 客户与责任事实，向 M01/M10/P01 输出项目待办、导入和提醒约束 |

P00 登录与 P01 消息中心是 Supporting capabilities；完整入口见 Current PRD 的产品地图和 User Flow Index。

## 6. Prototype / Demo 说明

- 当前 Demo：[`demo/prototype.html`](../demo/prototype.html)
- 维护源：[`src/`](../src/)，入口为 `src/prototype.html`，应用启动为 `src/app.js`
- 结构化模块：`src/modules/`；样例数据：`src/data/`；样式：`src/styles/`
- 构建：`npm run build:prototype`
- 漂移检查：`npm run check:prototype`
- Artifact provenance：[`demo/prototype.artifact.json`](../demo/prototype.artifact.json)，记录生成器、命令、源文件和 SHA-256 digest
- Product Boundary：[`demo-src/product-boundary-map.json`](../demo-src/product-boundary-map.json)

Prototype 用于展示角色入口、页面结构、主要控件、典型状态、关键交互和代表性校验。它可以使用内存状态和 Mock 数据，不模拟正式数据库、服务端并发、会话、真实上传扫描或完整生产架构。

> Demo 可能存在功能缺失或与 PRD 不一致，不可反过来作为需求事实源。

维护时只能修改 `src/` 等正式 source，再通过官方构建生成 `demo/prototype.html` 与 artifact；不得直接把生成产物当作维护入口。

## 7. AI 协作体系

```text
Product Owner
    ↓
CODEX / Orchestrator
    ↓
Implementation Task
    ↓
Implementation AI
    ↓
CODEX Review
    ↓
PASS
    ↓
Commit
    ↓
Publish Check
    ↓
GitHub（每次 Push 均需明确授权）
```

- **Product Owner**：确认产品规则和发布授权，是产品与发布最终决策者。
- **CODEX**：负责需求路由、PRD 协调、Task 拆分、文件边界、Review、Git 和发布门禁；不能自行猜产品规则。
- **Implementation AI**：只执行指定 Task 和 Allowed Files，发现范围外问题只报告。
- **Task**：记录 AI ID、Task ID、Base Commit、Branch、Allowed/Protected Files、Acceptance Criteria 和 Validation。
- **Branch**：默认 `ai/<AI-ID>/<TASK-ID>-<description>`；AI 不直接修改 `main`。
- **Result**：记录实际修改、验证、异常、产品/PRD/UI 变化和 commit provenance。
- **Review**：CODEX 只能给出 `PASS`、`PASS WITH FIXES`、`FAIL` 或 `PRODUCT CONFIRMATION REQUIRED`；只有 `PASS` 才表示接受。
- **Commit**：必须基于实际 Diff，并保留 AI、Task、Role 可追溯信息；面向研发的标题和正文默认使用中文。
- **Push**：Review PASS 和 Publish Check PASS 仍不等于授权，每次 Push 都需要 Product Owner 针对目标和候选明确授权。

完整 Local Workspace 中的具体流程见 `AGENTS.md`、`docs/AI_COLLABORATION_RULES.md` 和 `.ai/WORKFLOW.md`；这些内部协作文件默认不进入 GitHub 过滤镜像。

## 8. Git / 远程仓库说明

```text
本地完整项目
    ↓ 过滤发布候选
个人 GitHub（origin/main）
    ↓ 公司侧镜像获取
公司 Gaizee Git
```

### GitHub

- Remote：`origin`
- 地址：`git@github.com:Joker-1030/Yingjia-Internal-Management-System.git`
- 目标分支：`main`
- 定位：当前实际工程同步和研发镜像目标。
- 内容：只包含 Publish Manifest 允许的 Current PRD、Prototype、维护源和必要工程文件，不等同于完整 Local Workspace。

### Gaizee Git

- Remote 配置名：`company`
- 地址：`ssh://git@code.gaizee.cn:3222/qinyong/Yingjia-Internal-Management-System.git`
- 定位：公司内部镜像，由公司侧后续从 GitHub 获取内容。
- 当前本地策略：不直接 fetch、pull、push、同步或发布到 `company`；除非 Product Owner 再次明确改变远程策略。

两个远程仓库不是“由本地同时自动同步”。发布范围和授权规则见 [`docs/GITHUB_PUBLISH_RULES.md`](./GITHUB_PUBLISH_RULES.md)。

## 9. 文档生命周期

```text
Current
    当前日常使用的产品与工程事实

Archive
    已完成阶段使命的历史证据

Pending / Review
    尚未闭合、仍可能影响治理判断的资料
```

归档不等于删除。历史资料只有经过只读审计、引用检查、Product Owner 确认和独立归档实施 Task 才能移动；原文件名、来源、内容、日期、Git 历史和恢复方式必须保留。完整 Local Workspace 的归档索引为 `docs/archive/ARCHIVE_INDEX.md`，默认不进入 GitHub 过滤镜像。

## 10. 当前项目主要目录

```text
prd-workspace/   当前 PRD、模块、验收、决策、流程、共享事实和历史资料
docs/            项目总览、协作/发布规则、内部 Task/Result 与文档归档
src/             当前 Prototype 的可维护源码、模块、数据和样式
demo/            生成的当前 Prototype、Artifact 及 Demo 历史材料
demo-src/        Product Boundary 等 Prototype 结构化产品输入
.ai/             请求路由、Task 模板和 CODEX Review 规则
.github/         GitHub Publish Manifest、候选构建、检查脚本和只读工作流
archive/         项目级历史与人工恢复证据
snapshots/       明确阶段前的快照证据
scripts/         Prototype 构建、漂移检查与静态审计脚本
```

## 11. 当前项目维护原则

- 产品需求先确认并写入正式产品来源，再进入工程实现。
- PRD 是产品事实入口；代码和 Demo 不能创建产品规则。
- AI 不自行选择多解的产品行为。
- 每个 Task 必须有明确身份、分支、范围和验收标准。
- 同一文件不由多个 AI 并行修改；范围外发现只报告或另建 Task。
- CODEX Review `PASS` 后实现才可接受；`PASS WITH FIXES` 仍需修复并复审。
- Git Commit 必须基于实际 Diff、可追溯，并默认使用中文说明。
- GitHub 是过滤后的研发镜像，不是完整内部工作区。
- Publish Check 通过不代表允许 Push；每次 Push 都需 Product Owner 授权。
- 历史资料进入 Archive 而不是删除，且不能重新解释为 Current Rule。
- Demo 用于方案验证，不是最终产品事实或生产代码。

## 12. 新 AI 入场指南

第一次接手项目时按以下顺序阅读，通常可在 5-10 分钟内建立全局认知：

1. `docs/PROJECT_OVERVIEW.md`
2. `AGENTS.md`
3. `prd-workspace/current/PRD.md`
4. `.ai/WORKFLOW.md`
5. 当前 Task Record：`docs/AI_IMPLEMENTATION_TASKS/<TASK-ID>.md`

随后只读取该 Task 涉及的模块 PRD、Acceptance、Decision、Flow、Shared/Glossary、Product Boundary 和实现文件，不要用历史报告或代码补猜产品规则。
