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

### 首次入场

以下顺序用于首次建立项目认知；已经读取且未变化的内容不在同一会话重复全文加载。

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

### 日常局部修改

1. 检查 `git status --short`、当前分支与 HEAD、相关 Task/Result；保护已有修改。请求路由以 `.ai/WORKFLOW.md` §1 为准。
2. 从 `prd-workspace/current/PRD.md` 定位本次 Owner，读取对应模块 PRD、Acceptance 和实际引用的 Decision / Flow / Shared / Glossary / Boundary。首次入场的 README、总览不必每次全文重读；来源有变化时重读相关部分。已有评审范围的优化仍按 `.ai/WORKFLOW.md` §2.4 核对原评审与累计变化。
3. 用 `references/prototype-maintenance-rules.md` §6 的现有模块目录表与目标 `module.json` 定位源码、数据、事件入口。先在目标模块搜索函数、页面或动作；需要共享依赖时沿调用进入 `src/data/`、`_app-shell/` 或 CSS 的相关片段。装配顺序以 `src/app.js` 为准；源码结构只能定位实现，不能定义产品行为。
4. 按 Task 允许范围修改；验证深度只在 `references/prototype-maintenance-rules.md` §9 维护。局部展示调整执行构建、漂移和相关聚焦检查，不默认运行全部 `scripts/check-*.mjs`、全仓审计或浏览器；权限、状态、计算、数据范围与跨模块变化补充对应验证。
5. 一份 Task、一份 Result（含 CODEX Review），用精确路径和检查结果交叉引用，不复制整份 PRD 和规则。必需身份、Git、产品上下文、范围与验收证据仍按 `.ai/TASK_TEMPLATE.md`、`.ai/REVIEW_RULES.md` 保留。

### 检索示例与回退

下列 M12 示例只表示路径选择；实际按本次 Owner 替换，不能据示例推断产品归属。

```bash
# 先定位当前定义、Owner 源码和函数，再读取命中附近片段。
rg -n --max-columns 240 --max-columns-preview '销售指标|目标分配' prd-workspace/current/modules/M12-sales-opportunity.md
rg -n --max-columns 240 --max-columns-preview 'allocation|target' src/modules/m12-sales-opportunity/ src/data/sales-targets.js

# 必要时搜索当前产品链和实现，避免默认混入全部历史证据。
rg -l '待查关键词' prd-workspace/current/ prd-workspace/decisions/ src/ demo-src/

# 追溯评审时按已知 Task ID 或明确主题检索，不隐藏 Task/Result。
rg -l '待查 Task ID' docs/AI_IMPLEMENTATION_TASKS/ docs/AI_IMPLEMENTATION_RESULTS/

# 历史或生成产物必须显式进入；无结果先检查范围和忽略规则。
rg --no-ignore -l '待查关键词' archive/
rg --no-ignore -n --max-columns 240 --max-columns-preview '待查关键词' demo/prototype.html
```

项目根 `.ignore` 让默认 `rg` 搜索跳过 `archive/`、`demo/prototype.html` 和指定 ECharts 压缩库，减少历史与生成内容的重复命中。它不删除文件、不影响 Git 跟踪/构建/发布，也不排除 Current 产品源、Task/Result、评审登记或 `demo/prototype.artifact.json`。该配置只对遵循 `.ignore` 的检索工具生效，不表示 Codex 自动上下文或所有工具都会过滤；其他工具也应主动限定路径。

全仓文件盘点、归档引用检查、发布安全检查和第三方库排障不能依赖过滤后的文件清单，应使用适合该检查的完整枚举方式。`--no-ignore` 会扩大范围，仍须明确目录，避免无关缓存和敏感文件进入输出。源码长行先用 `rg -l` 定位或限制列宽，不全文输出压缩库、生成 HTML、大段样例数据；截断输出不是完整审查证据，需要核验时再读取准确片段。

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
首次接手请阅读 README.md、docs/PROJECT_OVERVIEW.md 和 docs/CODEX_READING_GUIDE.md，
再阅读 prd-workspace/current/PRD.md；日常局部修改走本指南 §2 的局部路径，
已读取且未变化的规则不重复全文加载。

根据本次任务定位涉及模块，继续阅读对应的 Current Module PRD、Acceptance、Decision 和 User Flow。

Current PRD 是产品事实来源；代码和 Demo 只能作为实现证据，不能反推产品规则。
archive/ 是历史资料，不覆盖 Current PRD。
未定义行为标记 PRODUCT DEFINITION GAP，正式来源冲突标记 SOURCE CONFLICT，
未确认的新产品行为标记 PRODUCT CONFIRMATION REQUIRED。
Prototype 维护源是 src/，不要直接修改 demo/。
未经明确授权，不要 Push GitHub。
```
