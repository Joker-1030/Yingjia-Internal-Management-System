# DEC-210 商机支撑角色独立于 PM

- 状态：已确认（Current）；Product Review：NOT REVIEWED
- 日期：2026-09-11
- 决策人：Product Owner
- Owner：M12 销售与商机管理；影响 M06 组织与员工、M07 权限授权

## 背景与确认上下文

Product Owner 要求“新增一个商机支撑的角色，用来接收商机的支撑，商机的方案支撑只能选有该角色的员工”，随后明确“正式加入PRD”，公司存在员工兼任多个角色，需要区分职能；当前尚未评审、研发未做，不存在生产历史数据，Demo 历史数据可调整。

## 决策

1. 正式新增商机支撑角色，稳定编码 `OPPORTUNITY_SUPPORT`；M06 通过既有员工角色关联维护，可单独关联或与 PM 等兼任，沿用人工 1-5 个角色上限，不自动给全部 PM 添加新角色，不设自动到期。
2. M12 新建商机附带方案支撑、已有商机发起方案支撑只可选在职、账号有效且具有商机支撑角色的员工；按员工 ID 去重，提交时重新校验。PM 身份本身不再提供接收资格；商机负责人/销售/地市责任仍按 DEC-209。
3. 新角色默认复用`我的方案支撑`查看与处理本人指派请求及最小必要商机、客户信息；无请求时沿用空态，单角色登录进入该页面。不自动授予其他商机、销售指标、客户经营或组织管理。多角色权限取并集，指派与有效性仍必须校验；admin 原全量管理与真实身份代操作保留，admin 不进入普通候选。
4. 支撑生命周期、负责人验收、超时消息、停用后负责人关闭并重新发起规则保持；移除角色立即失去本人接收与处理资格，不因旧指派继承。不存在上线历史兼容或迁移例外；Demo 请求按本次新资格调整示例。
5. 替代 DEC-209 §决策第 1/5 项的 PM 支撑接收部分，其他事实及历史记录不改写。本次产品确认不是产品评审，未获得 GitHub 同步资格或 Push 授权。

## Current 落点

- `prd-workspace/current/modules/M12-sales-opportunity.md` → §4、§5、§10；`prd-workspace/current/acceptance/M12.md` → AC-M12-27/28/30。
- `prd-workspace/current/modules/M06-organization.md` → 系统角色字段；`prd-workspace/current/acceptance/M06.md` → AC-F001-59。
- `prd-workspace/current/modules/M07-permission.md` → 商机支撑模板；`prd-workspace/current/acceptance/M07.md` → AC-F002-33/34/37。
- `prd-workspace/current/shared/01-roles-permissions-and-data-scope.md` → 角色数据范围；`prd-workspace/current/shared/02-built-in-data-and-initialization.md` → 系统内置数据；`prd-workspace/current/user-flows/FLOW-17-M12-sales-opportunity.md` → 方案支撑。
