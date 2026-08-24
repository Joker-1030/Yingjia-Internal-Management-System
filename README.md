# 英嘉科技内部管理系统

> 产品需求（PRD）与 Demo 仓库
> 面向产品、设计与研发团队，用于持续同步当前产品需求、版本迭代与可运行 Demo。

## 项目说明

本仓库用于维护当前版本的产品需求与 Demo。

产品需求已经完成从单体 PRD 到模块化 PRD 的迁移。当前 GitHub 仓库以模块化 PRD 作为研发侧唯一阅读入口，研发可以直接通过 Git diff 查看需求变化，不再需要通过内部沟通群反复接收文件。

## 当前产品需求

### PRD 入口

[`prd/PRD.md`](./prd/PRD.md)

该文件是整个产品需求的总入口，包含产品模块地图、模块关系和研发阅读导航。

### 模块 PRD

当前产品按 M01-M10 拆分：

| 模块  | 名称     | PRD                                                        |
| --- | ------ | ---------------------------------------------------------- |
| M01 | 工作台    | [`M01-dashboard.md`](./prd/modules/M01-dashboard.md)       |
| M02 | 客户经营   | [`M02-customer.md`](./prd/modules/M02-customer.md)         |
| M03 | 维系管理   | [`M03-maintenance.md`](./prd/modules/M03-maintenance.md)   |
| M04 | 审批中心   | [`M04-approval.md`](./prd/modules/M04-approval.md)         |
| M05 | 停用记录   | [`M05-archive.md`](./prd/modules/M05-archive.md)           |
| M06 | 组织与员工  | [`M06-organization.md`](./prd/modules/M06-organization.md) |
| M07 | 权限授权   | [`M07-permission.md`](./prd/modules/M07-permission.md)     |
| M08 | 区域配置   | [`M08-region.md`](./prd/modules/M08-region.md)             |
| M09 | 客户基础配置 | [`M09-settings.md`](./prd/modules/M09-settings.md)         |
| M10 | 数据导入   | [`M10-import.md`](./prd/modules/M10-import.md)             |

## Demo

最终 Demo 位于：

[`demo/`](./demo/)

Demo 用于帮助研发理解页面结构、交互和产品行为。

**PRD 定义产品需求，Demo 用于辅助理解和验证，不以 Demo 实现反推未定义的产品规则。**

## 研发如何阅读

推荐阅读顺序：

**第一步：** 阅读 [`prd/PRD.md`](./prd/PRD.md)，了解整体产品结构。

**第二步：** 根据当前开发任务进入对应 M01-M10 模块 PRD。

**第三步：** 对照 `demo/` 查看页面和交互表现。

**第四步：** 通过 Git history / diff 查看本次需求相对于上一版本的变化。

当不同文件存在理解冲突时，优先依据当前模块 PRD中的明确产品规则；对于未明确的内容，不应自行推导为新的产品需求，应由产品侧确认。

## 需求变更

产品需求会持续迭代。

每次需求调整原则上：

1. 修改对应模块 PRD。
2. 保持跨模块所有权和边界一致。
3. 对影响其他模块的变更同步更新相关模块。
4. 通过 Git commit / Pull Request 保留变更记录。
5. 研发以当前分支最新版本为当前需求阅读依据。

因此，**GitHub 中最新版本的模块 PRD，就是研发查看需求的主要入口。**

## 版本与变更记录

建议使用 Git commit / Pull Request 记录需求变化，例如：

```text
feat(M02): 新增关键人调岗规则
change(M08): 调整地市责任分配规则
update(M03): 修改专项任务规则
docs: 更新 PRD 导航
```

对于较大的产品变更，建议在 PR 描述中说明：

* 变更模块
* 变更背景
* 主要产品规则
* 是否影响其他模块
* Demo 是否同步
* 研发需要关注的行为变化

## 仓库内容边界

本仓库主要面向研发协作，因此只保留研发需要持续查看的内容：

```text
README.md
prd/
  PRD.md
  modules/
    M01-M10
demo/
```

内部产品治理过程、历史审查材料、语义治理报告、迁移审计记录和其他内部工作文件不作为研发侧日常阅读材料。

## 当前状态

* PRD：模块化 PRD
* 模块：M01-M10
* Demo：持续维护
* 需求状态：持续迭代
* GitHub 用途：研发需求同步与版本追踪

## 重要说明

### PRD 与 Demo 的关系

PRD 是产品需求定义。

Demo 是产品行为的可视化与交互参考。

当 Demo 与 PRD 表达存在差异时，不应直接将 Demo 行为视为新的产品规则，应先确认产品意图后再修改。

### 未定义需求

对于 PRD 没有明确规定的行为：

> **不要自行补充产品规则。**

研发可以提出实现建议，但最终产品行为以产品确认结果为准。

## 联系与协作

需求问题、跨模块影响或规则冲突，建议通过 Issue / Pull Request / 产品评审进行确认，并将最终确认结果同步到对应模块 PRD。

---

**Current Product PRD**

[`prd/PRD.md`](./prd/PRD.md)

**Modules**

[`prd/modules/`](./prd/modules/)

**Demo**

[`demo/`](./demo/)
