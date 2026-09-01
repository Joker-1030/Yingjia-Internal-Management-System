# 英嘉科技内部管理系统项目总览

- 更新日期：2026-09-01
- 当前产品阶段：Current PRD 持续演进；M02-M09 与 P00 已完成产品评审并进入研发，M01、M10-M12 与 P01 尚未评审且尚未开始研发；尚未正式生产发布
- 当前产品事实入口：[`prd-workspace/current/PRD.md`](../prd-workspace/current/PRD.md)
- 当前仓库用途：研发需求阅读、Prototype 演示与前端维护

本文帮助研发和后续维护人员快速建立全局认知。详细产品行为仍以对应的 Current PRD、Decision、Acceptance、Flow、Shared、Glossary 和 Product Boundary 为准；本文不替代它们。

## 1. 项目简介

英嘉科技内部管理系统当前聚焦基础权限、客户管理、项目管理与销售商机管理，服务客户资产、关键人及任职、维系任务、审批、内部组织员工、角色权限、区域与地市责任、客户基础配置、数据导入、项目交付、销售指标、商机跟进和方案支撑等业务。本期为 PC Web；独立线索对象、合同管理、财务角色、回款、开票、成本、毛利、正式讲师管理、项目取消审批和项目经营分析不在本期范围内。

项目当前采用 Current PRD 持续演进、模块评审与研发并行的管理方式。M01-M12 已形成模块化 PRD Source of Truth，配套 Acceptance、Decision、User Flow、Shared、Glossary 和 Product Boundary；可点击 Prototype 用于产品方案验证、交互演示和研发理解。

> 本仓库中的 Demo 是产品方案验证和交互演示，不是正式生产系统代码。

`src/` 是当前 Prototype 的维护源，也不是已选定的生产技术架构。

## 2. 当前项目状态

截至 2026-08-31，仓库证据确认已经完成：

- M01-M11 自 2026-08-27 起、M12 自 2026-09-01 起共同构成正式模块化需求入口。
- 建立 M01-M12 Current Acceptance Criteria、Decision 索引与拆分记录、Current User Flow、Shared Product Facts、Glossary 和 Product Boundary。
- 建立可维护的模块化 Prototype Source、确定性构建、Artifact provenance 和 source/artifact drift check。
- 建立可点击的 M01-M12 Prototype，并保持维护源与生成产物可校验；M12 已合入销售仪表盘、销售指标、商机列表/新建/详情、跟进和方案支撑的 Current 核心演示。

“已完成上述治理与工程基础”不等于全项目已评审或系统已上线。当前模块状态为：M02-M09 与 P00 已完成产品评审并进入研发；M01、M10、M11、M12 与 P01 尚未完成产品评审且研发未开始。模块已评审不冻结 Current PRD，后续产品变化仍需判断对在研 Task 的影响。

## 3. 产品需求体系

```text
prd-workspace/current/PRD.md
        ↓
M01-M12 Module PRD
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

- **PRD**：`current/PRD.md` 是人类阅读入口，M01-M12 模块文件描述当前正式产品需求、页面、字段、权限、状态、规则和边界。
- **Acceptance**：`current/acceptance/` 保存稳定、可独立验证的验收条件，不由 Demo 行为替代。
- **Decision**：`decisions/` 与索引保存产品负责人已确认的决策、原因、替代关系和规则演进。
- **User Flow**：`current/user-flows/` 表达关键业务流程及其 Current、Historical 或 Replaced 状态。
- **Shared**：`current/shared/` 唯一维护跨模块共用的范围、角色权限、初始化、统一规则、对象状态、审计和研发评审事实。
- **Glossary**：`GLOSSARY.md` 统一业务术语和含义，避免模块自行解释同一个词。
- **Product Boundary**：`demo-src/product-boundary-map.json` 结构化记录模块职责、核心对象、页面、关系和明确排除项，用于定位业务 Owner，不替代详细 PRD。

阅读顺序和冲突治理见 [`prd-workspace/README.md`](../prd-workspace/README.md)。

## 4. Source of Truth 原则

当前产品事实以 [`prd-workspace/current/PRD.md`](../prd-workspace/current/PRD.md) 及其链接的当前模块化产品体系为准。

- 所有历史 PRD、旧 Demo、阶段报告、已完成 Task/Result 和快照统一位于 `archive/`；它们是 Historical Evidence，不是 Current Rule。
- 代码只表达当前实现状态，不能反推新产品需求。
- Demo 只表达当前产品方案，不是最终产品需求来源。
- Demo 与 PRD 不一致时，以 Current PRD 链为准。
- 需求确认应正式写入适当的 PRD、Decision、Acceptance、Flow、Shared、Glossary 或 Product Boundary，不能只存在于临时沟通中。
- Current 产品来源无法得出唯一答案时，不应从代码或 Demo 补猜业务规则。

## 5. 产品模块说明

| 模块 | 主要职责 | 重要对象 | 主要流程 | 主要关系 |
| --- | --- | --- | --- | --- |
| [M01 工作台](../prd-workspace/current/modules/M01-dashboard.md) | 按角色聚合经营指标、趋势、待办和重点动态，并按同一口径下钻 | 指标、经营对比、趋势、待办、重点动态、角色视图 | 登录后进入角色默认入口；周期切换、聚合查看和来源模块下钻 | 消费 M02-M11/P01 事实，不拥有来源业务生命周期 |
| [M02 客户经营](../prd-workspace/current/modules/M02-customer.md) | 浏览和使用客户资产，维护关键人身份及任职变化 | 集团、客户公司、关键人、任职、客户责任和健康 | 客户三栏浏览、关键人新增/编辑、关键人调岗及生效 | 消费 M08 责任、M09 主数据；对接 M03 任务、M04 审批、M05 停用 |
| [M03 维系管理](../prd-workspace/current/modules/M03-maintenance.md) | 将规则转为维系任务，管理专项/KPI 并沉淀维系记录 | 父任务、执行记录、专项、覆盖 KPI、维系记录、附件 | 规则生成、任务完成/补录、专项发布执行、异常审批 | 消费 M02/M08/M09 事实，由 M04 承载审批并向 M01 输出聚合 |
| [M04 审批中心](../prd-workspace/current/modules/M04-approval.md) | 统一承载跨业务审批实例、节点、动作、抄送和回调结果 | 审批实例、节点、处理动作、抄送、流程记录 | 发起后按路由处理、撤回/驳回/通过、来源业务生效与失败重试 | 审批容器归 M04；申请字段和业务生效仍归 M02/M03/M05/M08 等来源模块 |
| [M05 停用记录](../prd-workspace/current/modules/M05-archive.md) | 管理客户侧对象停用、恢复、影响和历史查询 | 停用/恢复申请、对象快照、影响摘要、停用记录 | 从业务对象发起、影响确认、审批、生效、恢复 | M02/M09 拥有对象，M04 拥有审批，M05 拥有停用恢复记录和历史 |
| [M06 组织与员工](../prd-workspace/current/modules/M06-organization.md) | 维护内部部门、主管、员工、账号、角色关联和人员变化 | 内部部门、成员关系、主管、员工、账号、系统角色关联 | 部门/员工维护，多部门与角色编辑，员工直接停用/恢复 | 向 M07/M08 等提供组织与人员资格；不维护权限模板或区域责任 |
| [M07 权限授权](../prd-workspace/current/modules/M07-permission.md) | 由 admin 维护非管理员角色模板的四层权限、版本和审计 | 角色模板、权限树、当前配置、影响预览、只读变更日志 | 修改权限、影响确认、保存和历史查看；新配置直接生效，不提供一键回滚 | 只能收紧业务模块固定能力上限，不维护员工角色或数据范围事实 |
| [M08 区域中心与地市配置](../prd-workspace/current/modules/M08-region.md) | 维护区域与省份/驻地映射、地市负责人以及交接/直接调整 | 区域配置、省份映射、驻地、地市责任、地市交接 | 区域配置、地市分配/直接调整、PM 地市管理与交接 | 消费 M06 组织人员，向 M01/M02/M03 提供责任范围，审批容器归 M04 |
| [M09 客户基础配置](../prd-workspace/current/modules/M09-settings.md) | 唯一维护客户主数据树、职级周期提醒和生日/节假日规则 | 周期/提醒规则、行业、集团、客户公司、客户部门、标准岗位 | 规则保存、主数据维护及停用恢复、节假日日历同步 | 向 M02/M03/M10 提供稳定主数据和规则，不拥有日常经营或任务生命周期 |
| [M10 数据导入](../prd-workspace/current/modules/M10-import.md) | 通过模板、预校验、确认和报告完成受控批量录入 | 模板、文件、批次、预校验结果、错误/重复行、结果报告 | 下载模板、上传、预校验、确认导入、查看结果 | 写入时复用 M02/M08/M09 当前规则，不覆盖既有责任或任职事实 |
| [M11 项目管理](../prd-workspace/current/modules/M11-project-management.md) | 管理培训与 AI 软件项目的立项、执行、交付、资料、评价、商业配置和责任历史 | 项目、项目责任、商业快照、采购包、平台公司、项目人员、项目资料、满意度 | 项目创建、开始、交付、完成或取消，维护资料与评价，并随地区责任交接迁移项目责任 | 消费 M02/M06/M08 客户与责任事实，向 M01/M10/P01 输出项目待办、导入和提醒约束 |
| [M12 销售与商机管理](../prd-workspace/current/modules/M12-sales-opportunity.md) | 管理商机数量指标、销售仪表盘、商机推进、跟进和方案支撑；线索复用商机早期阶段 | 销售指标版本、商机、阶段记录、跟进记录、方案支撑请求 | 指标分配与调整、商机创建和顺序推进、改派、跟进和支撑响应交付 | 消费 M02/M06/M08/M09 事实，由 M04 承载指标调整审批并由 P01 发送跟进/支撑消息；不包含合同和财务 |

P00 登录与 P01 消息中心是 Supporting capabilities；完整入口见 Current PRD 的产品地图和 User Flow Index。

## 6. Prototype / Demo 说明

- 当前 Demo：[`demo/prototype.html`](../demo/prototype.html)
- 维护源：[`src/`](../src/)，入口为 `src/prototype.html`，应用启动为 `src/app.js`
- 结构化模块：`src/modules/`；样例数据：`src/data/`；样式：`src/styles/`
- 构建：`npm run build:prototype`
- 漂移检查：`npm run check:prototype`
- Artifact provenance：[`demo/prototype.artifact.json`](../demo/prototype.artifact.json)，记录生成器、命令、源文件和 SHA-256 digest
- Product Boundary：[`demo-src/product-boundary-map.json`](../demo-src/product-boundary-map.json)
- Current Prototype / Current Demo：当前 Canonical Git 状态中由 `src/` 正式构建出的上述 Demo，不使用复制文件维护版本
- Demo Revision：只为有意义的日期或阶段性变化记录，不要求每次修改增加版本号
- Demo Baseline：仅通过明确登记的正式展示/验收 Git Commit 定位；当前治理证据未建立符合该条件的 Demo Baseline
- 当前项目级 Product Alignment：`PARTIAL`；M01-M11 已有 Demo 范围与 Source/Artifact 有验证证据，M12 核心页面与主流程已实现，但 M12 指标调整在 M04 的审批实例展示、P01 跟进/支撑提醒消息及全部异常状态尚未纳入本次 Demo 验证；未执行 M01-M12/P00/P01 全量 PRD-to-Demo 审计

Prototype 用于展示角色入口、页面结构、主要控件、典型状态、关键交互和代表性校验。它可以使用内存状态和 Mock 数据，不模拟正式数据库、服务端并发、会话、真实上传扫描或完整生产架构。

> Demo 可能存在功能缺失或与 PRD 不一致，不可反过来作为需求事实源。

维护时只能修改 `src/` 等正式 source，再通过官方构建生成 `demo/prototype.html` 与 artifact；不得直接把生成产物当作维护入口。

Demo 历史以 Git 为准，不创建 `prototype-v1/v2/v3` 或 `final` 副本。Demo Baseline 必须同时记录对应 Product Baseline、PRD Revision/Decision（如存在）、对齐范围与 `ALIGNED / PARTIAL / BEHIND / NOT IMPLEMENTED` 状态以及 Artifact provenance；Demo Baseline 与 Product Baseline 相互关联但不等同。

## 7. 研发入口

- 产品总入口：[`prd-workspace/current/PRD.md`](../prd-workspace/current/PRD.md)
- 模块需求：[`prd-workspace/current/modules/`](../prd-workspace/current/modules/)
- 验收口径：[`prd-workspace/current/acceptance/`](../prd-workspace/current/acceptance/)
- 产品决策：[`prd-workspace/decisions/`](../prd-workspace/decisions/)
- 可点击 Prototype：[`demo/prototype.html`](../demo/prototype.html)
- Prototype 维护源：[`src/`](../src/)
- 修订查看方式：[`README.md`](../README.md#修订记录与变更查看)

## 8. 当前项目主要目录

```text
prd-workspace/   当前 PRD、模块、验收、决策、流程和共享产品事实
docs/            面向研发的项目总览
src/             当前 Prototype 的可维护源码、模块、数据和样式
demo/            生成的当前 Prototype 与 Artifact provenance
demo-src/        Product Boundary 等 Prototype 结构化产品输入
scripts/         Prototype 构建与漂移检查脚本
archive/         产品、Demo、治理、Task/Result 与快照的统一历史入口
```

## 9. 当前项目维护原则

- 产品需求先确认并写入正式产品来源，再进入工程实现。
- PRD 是产品事实入口；代码和 Demo 不能创建产品规则。
- 多解的产品行为必须回到 Current 产品来源确认，不能由实现自行选择。
- 需求变化应能从总 PRD、模块 PRD、Decision 和 Acceptance 中定位。
- Prototype 只能从 `src/` 维护并通过正式构建生成，不直接编辑生成产物。
- 修改 Prototype 后必须验证 Source / Artifact 无漂移。
- Demo 用于方案验证，不是最终产品事实或生产代码。
- Current Demo 持续迭代；重要阶段才建立 Demo Baseline，普通修改由 Git 和 Task/Result 保留历史。

## 10. 研发入场指南

第一次接手项目时按以下顺序阅读：

1. `docs/PROJECT_OVERVIEW.md`
2. `prd-workspace/current/PRD.md`
3. 本次涉及的模块 PRD
4. 对应 Acceptance、Decision、Flow、Shared、Glossary 和 Product Boundary
5. 对应 `src/` 模块、数据与样式

遇到文档与实现差异时，以 Current 产品来源为准，不要用历史内容或代码补猜产品规则。
