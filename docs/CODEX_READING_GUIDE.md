# 研发 / 测试 Codex 读取说明

本文是研发和测试使用 Codex 阅读本项目时的最小操作指南。它不替代当前 PRD、Acceptance、Decision 或项目治理规则。

## 1. 项目结构

```text
prd-workspace/current/  当前产品事实
  PRD.md                当前产品总入口
  modules/              模块 PRD
  acceptance/           验收条件
  user-flows/           当前业务流程
  shared/               跨模块共用事实
prd-workspace/decisions/ 已确认产品决策
src/                    Prototype 唯一维护源
demo/                   由 src/ 构建出的 Prototype 产物
docs/                   项目说明与治理入口
scripts/                构建、检查和审计脚本
archive/                历史资料，不覆盖当前规则
```

## 2. 推荐读取顺序

```text
README.md
→ docs/PROJECT_OVERVIEW.md
→ prd-workspace/current/PRD.md
→ 涉及模块的 Current Module PRD
→ 对应 Acceptance
→ 对应 Decision / User Flow / Shared / Glossary
→ src/ 中的实现
→ demo/ 中的生成结果
```

只处理单个模块时，可以跳过无关模块，但不能跳过该模块的 Current PRD 和 Acceptance。

## 3. 哪些内容可以定义产品规则

当前 PRD 和当前产品来源链是产品事实来源。Decision 用于记录已确认的关键决定，Acceptance 用于验证结果，User Flow、Shared、Glossary 和 Product Boundary 用于补充当前定义。

代码、Prototype、Demo、测试结果、Git Commit、历史 PRD 和 `archive/` 都是证据，不能单独产生新的产品规则。发现当前来源没有定义的用户可观察行为时，标记：

```text
PRODUCT DEFINITION GAP
```

发现正式来源互相冲突时，标记：

```text
SOURCE CONFLICT / PRODUCT DECISION REQUIRED
```

发现未确认的新字段、状态、权限、通知、流程或业务概念时，标记：

```text
PRODUCT CONFIRMATION REQUIRED
```

## 4. 研发 Codex 的边界

研发 Codex 开始实现前，应确认任务对应的模块、Requirement、Acceptance 和当前研发范围。不要从代码或 Demo 反推业务规则，不要自行增加权限、角色、状态、通知或业务概念，也不要通过修改 Product Truth 来适配代码。

当前产品评审、研发状态、Demo 状态、Acceptance 状态、同步资格和 Push 授权是不同概念。代码存在、Demo 可运行、测试通过或 CODEX Review PASS，都不能单独证明产品已经评审。

## 5. 测试 Codex 的边界

测试应以 Acceptance 和 Current PRD 为主要依据，并检查：

- 入口、页面、字段、默认值和权限；
- 数据范围、状态、操作和操作结果；
- 成功、失败、空状态和无权限状态；
- 页面是否出现 PRD 未定义的字段、按钮、Badge、通知或后台规则；
- 实际实现与当前产品定义是否一致。

实现与 PRD 不一致时，区分 `IMPLEMENTATION BUG` 和 `PRODUCT DEFINITION GAP`，不要直接以代码行为作为正确答案。

## 6. Prototype 与 Demo

本项目只有一个 Prototype 维护源：`src/`。`demo/prototype.html` 是构建产物，不能直接作为维护入口，也不能从 Demo 反推新的产品规则。

```text
Current Product
→ User-visible behavior
→ src/ Prototype Source
→ build
→ demo/prototype.html
```

Working Demo 可以包含尚未进入研发范围的研究内容，但研究内容不会自动成为 Product Truth、已评审范围或 GitHub 同步范围。

## 7. 同步边界

GitHub / 研发同步按本次具体 Requirement、Change 或 Refinement 判断，不要求整个 Working Demo 全部已评审。每次同步仍需检查实际代码差异、必要依赖、是否混入未评审行为、Publish Gate 和本次 Push Authorization。

未经明确授权，不要 Push GitHub。历史内容不通过回滚、重写或删除处理。

## 8. 发现问题时的输出

```text
问题类型：
影响模块：
当前来源：
实际表现：
预期表现：
是否属于产品规则问题：
是否阻断研发：
是否需要 Product Owner 确认：
建议下一步：
```

可使用的问题类型：

```text
IMPLEMENTATION BUG
PRD / CODE DRIFT
PRODUCT DEFINITION GAP
SOURCE CONFLICT
PRODUCT CONFIRMATION REQUIRED
DEMO FEATURE MISSING
OUT-OF-SCOPE FINDING
```

## 9. 可直接发送给 Codex 的启动指令

```text
请先阅读 README.md、docs/PROJECT_OVERVIEW.md 和 docs/CODEX_READING_GUIDE.md，
再阅读 prd-workspace/current/PRD.md。

根据本次任务定位涉及模块，继续阅读对应的 Current Module PRD、Acceptance、Decision 和 User Flow。

Current PRD 是产品事实来源；代码和 Demo 只能作为实现证据，不能反推产品规则。
archive/ 是历史资料，不覆盖 Current PRD。
未定义行为标记 PRODUCT DEFINITION GAP，正式来源冲突标记 SOURCE CONFLICT，
未确认的新产品行为标记 PRODUCT CONFIRMATION REQUIRED。
Prototype 维护源是 src/，不要直接修改 demo/。
未经明确授权，不要 Push GitHub。
```
