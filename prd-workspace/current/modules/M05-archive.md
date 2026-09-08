# M05 停用记录（已移除）

> 文档状态：Current Product removal boundary
>
> Product Status：`REMOVED`
>
> Product Review Status：`NOT REVIEWED`
>
> Engineering Status：`NOT STARTED`
>
> 当前交付边界：M05 不提供菜单、页面、列表、详情、直接路由、权限节点、操作或独立历史中心；`M05` 编号保留，不分配给其他模块。
>
> 正式依据：`DEC-207《取消独立停用记录并由业务所有者保留历史》`

## REMOVED Current Boundary

M05 独立“停用记录”能力已取消。当前产品不得根据旧 M05 PRD、Acceptance、Flow、Demo 容器、代码、Git 历史或 Archive 恢复下列内容：

- 独立停用记录菜单、列表、详情、恢复页或直接访问路由；
- M05 菜单、页面、操作、字段或附件权限节点；
- 独立停用编号、统一历史中心或跨模块停用详情下钻；
- 由 M05 拥有的停用/恢复状态机、审批流程或业务对象生命周期。

直接访问旧 M05 路由按不存在的当前能力处理，不返回业务数据。M07 权限树不得显示、保存或恢复任何 M05 权限。

## 当前替代关系

取消 M05 不取消任何已经确认的停用/恢复业务能力，也不放宽权限、影响校验、二次确认、直接生效、失败保护、恢复顺序或历史要求：

| 业务事实 | 当前 Owner | 历史位置 |
| --- | --- | --- |
| 关键人停用/恢复及任职影响 | M02 客户经营 | M02 关键人详情与对象历史 |
| 员工、账号停用/恢复及责任交接 | M06 组织与员工 | M06 员工详情与人员/组织变动记录 |
| 集团公司、客户公司、客户部门、行业、标准关键人岗位及生日/节假日规则的停用/恢复或启停 | M09 客户基础配置 | M09 对象详情与对象历史 |
| 停用引发的任务关闭/重建 | M03 维系管理 | 对应任务与执行记录历史 |
| 停用引发的项目负责人变化 | M11 项目管理 | 项目责任历史 |
| 停用引发的商机负责人变化 | M12 销售与商机管理 | 商机改派历史 |

当前正式停用/恢复均由对象所属模块按已确认边界直接生效，不进入 M04。未来审批中心是否接入某一对象，必须由该对象 Owner 另行评审。

## 历史证据边界

- 原 `AC-F012-06` 至 `AC-F012-18`、原 `FLOW-04`、原 `FLOW-13` 及旧 M05 详细页面设计均为 `Historical / Replaced Evidence`，不得作为当前实现范围。
- 已有 Git 历史、Archive、Decision、Task/Result 和审计报告继续保留，不因本次移除而改写。
- 停用替代物理删除、稳定 ID 与历史不回收等仍有效原则，由实际业务对象 Owner 继续维护；它们不构成恢复 M05 的依据。

## 精确引用

- 决策：[`prd-workspace/decisions/DEC-207-取消独立停用记录并由业务所有者保留历史.md`](../../decisions/DEC-207-取消独立停用记录并由业务所有者保留历史.md) -> “决策”。
- Acceptance：[`prd-workspace/current/acceptance/M05.md`](../acceptance/M05.md) -> `AC-M05-REMOVED-01` 至 `AC-M05-REMOVED-04`。
- Flow：[`prd-workspace/current/user-flows/FLOW-04-M05-deactivation-lifecycle.md`](../user-flows/FLOW-04-M05-deactivation-lifecycle.md) 与 [`FLOW-13-M05-deactivation-and-restore.md`](../user-flows/FLOW-13-M05-deactivation-and-restore.md) -> “REMOVED Current Boundary”。

## 不包含

- 新建替代模块、统一停用中心、统一审计中心或跨模块下钻；
- 改变 M02、M03、M06、M09、M11、M12 已确认的对象级业务规则；
- 删除历史文件、历史记录、稳定 ID、业务编号或对象快照；
- 当前接入 M04 审批中心。

## 修订记录 / PRD Revision History

本表只记录直接影响 M05 的已确认产品变更；总 PRD 维护跨模块摘要。同日变更合并在一个单元格内，无法从正式记录可靠还原的历史不补造。

| 日期 | 修订内容 |
| --- | --- |
| 2026-09-07 | • 取消独立 M05“停用记录”能力，Product Status 改为`REMOVED`；不提供菜单、页面、路由、权限节点、操作或统一历史中心，编号保留。停用/恢复及其历史回归 M02、M06、M09 等业务对象 Owner，任务、项目和商机只在自身历史中记录受影响结果。 |
| 2026-09-04 | • 当时确认当前全部停用操作不进入审批中心；该规则继续由各业务对象 Owner 维护。 |
| 2026-09-03 | • 当时确认客户侧停用/恢复仅唯一内置 `admin` 操作并直接生效；M05 集中留痕语义已被 2026-09-07 的 DEC-207 替代。 |
| 2026-08-31 | • Historical / Replaced：旧业务状态与处理失败表达曾在 M05 规划中治理。 |
| 2026-08-28 | • Historical / Replaced：旧 M05 规划曾补充筛选标签、集团编号快照及组织上级影响。 |
| 2026-08-27 | • Historical / Replaced：旧 M05 规划曾统一列表筛选字段标签。 |
