# DEC-262 关键人停用由业务角色审批、admin直接生效

- 日期：2026-11-26；状态：已确认 / NOT REVIEWED / NOT STARTED。
- Owner：M02 客户经营；关联 M04 审批中心、M03 维系管理、P01 消息中心。
- 类型：CHANGE；影响：HIGH；Product Concept Delta：EXISTING APPROVAL AND PERMISSION RULE CHANGED；Approved Baseline：UNKNOWN。

## 确认来源

Product Owner 明确要求：PM、区域总监、市场副总可以停用关键人，停用需要审批；admin 停用不需要审批。

## 当前决定

1. PM、区域总监和市场副总在各自现有客户数据范围内可发起“停用关键人”审批。区域总监按本人主管区域中心并集，PM按本人最终负责客户，市场副总按全国市场范围；对象、搜索、详情和提交继续执行 M02 原有范围校验。
2. 以上三类角色提交后生成 M04 企业微信审批实例。审批中关键人保持正常状态，不关闭任务、不改变任职和其他业务事实；审批通过后立即停用，按既有规则关闭未完成任务并保留关键人、任职、维系记录和历史；驳回或撤回不改变关键人。
3. admin 可在 M02 直接停用关键人，不生成 M04 审批实例；admin 仍可按现有规则直接恢复关键人。PM、区域总监、市场副总及其他角色不获得恢复权限。
4. 停用原因和影响校验沿 M02 原有规则；停用历史和通知按实际生效结果记录，不为审批中创建已停用业务历史。M05 独立停用记录继续保持 REMOVED。
5. 关键人恢复、集团公司停用/恢复和客户公司停用/恢复不因本决定改变：恢复及客户主数据停用/恢复沿各自 Owner 的直接生效规则处理。

## 精确产品来源与验收

- Owner：`prd-workspace/current/modules/M02-customer.md` → §3.5“关键人停用/恢复表达”、§4.10“停用/恢复入口归属”、§5“业务操作与状态边界”。
- 审批承载：`prd-workspace/current/modules/M04-approval.md` → §1.2“当前业务 Owner”、§1.3“已确认的业务审批事项”。
- Acceptance：`prd-workspace/current/acceptance/M02.md` → `AC-F007-59`、`AC-F007-65`；`prd-workspace/current/acceptance/M04.md` → `AC-F011-37`、`AC-M04-BUSINESS-SCOPE-20261123`。
