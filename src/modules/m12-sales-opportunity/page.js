      const SALES_STAGES = ["商机录入", "需求确认", "方案支撑", "比选", "中选", "落选"];
      const SALES_FORWARD_STAGES = ["商机录入", "需求确认", "方案支撑", "比选", "中选"];
      const SALES_TYPES = ["培训商机", "AI 项目商机"];
      const SALES_PRIORITIES = ["高", "中", "低"];

      function salesRoleNames() {
        return currentRoleTemplateNames();
      }

      function salesIsRole(name) {
        return currentUser?.fullAccess || salesRoleNames().includes(name);
      }

      function salesCanCreate() {
        return hasOperationPermission("opportunities.create");
      }

      function salesCanProgress(opportunity) {
        return Boolean(
          currentUser?.fullAccess ||
            (hasOperationPermission("opportunities.progress") &&
              opportunity.owner === currentUser?.name),
        );
      }

      function salesCanReassign(opportunity) {
        if (currentUser?.fullAccess) return true;
        return (
          hasOperationPermission("opportunities.reassign") &&
          opportunity.region === currentUser?.region
        );
      }

      function salesVisibleOpportunities() {
        if (!currentUser) return [];
        if (
          currentUser.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return opportunities;
        if (salesIsRole("区域总监"))
          return opportunities.filter((item) => item.region === currentUser.region);
        if (salesIsRole("PM"))
          return opportunities.filter((item) => item.owner === currentUser.name);
        return [];
      }

      function salesVisibleCustomers() {
        if (!currentUser) return [];
        if (
          currentUser.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return customers;
        if (salesIsRole("区域总监"))
          return customers.filter((item) => item.region === currentUser.region);
        if (salesIsRole("PM"))
          return customers.filter((item) => item.pm === currentUser.name);
        return [];
      }

      function salesMoney(value) {
        return `${Number(value || 0).toLocaleString("zh-CN", {
          maximumFractionDigits: 0,
        })} 元`;
      }

      function salesAmountValue(opportunity) {
        return opportunity.stage === "中选"
          ? opportunity.expectedContractAmount || opportunity.estimateAmount
          : opportunity.estimateAmount;
      }

      function salesStageTone(stage) {
        return {
          商机录入: "",
          需求确认: "blue",
          方案支撑: "yellow",
          比选: "orange",
          中选: "green",
          落选: "red",
        }[stage] || "";
      }

      function salesStageTag(stage) {
        return `<span class="tag ${salesStageTone(stage)}">${stage}</span>`;
      }

      function salesPriorityTag(priority) {
        return `<span class="tag ${priority === "高" ? "red" : priority === "中" ? "yellow" : ""}">${priority}</span>`;
      }

      function salesCurrentTarget() {
        return (
          salesTargetMonths.find((item) => item.month === salesPeriodApplied) ||
          salesTargetMonths[0]
        );
      }

      function salesTargetForCurrentScope(target) {
        if (currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总"))
          return target.companyTarget;
        const region = salesIsRole("PM")
          ? target.regions.find((item) =>
              item.pms.some((pm) => pm.name === currentUser?.name),
            )
          : target.regions.find((item) => item.name === currentUser?.region);
        if (salesIsRole("区域总监")) return region?.target || 0;
        if (salesIsRole("PM"))
          return region?.pms.find((item) => item.name === currentUser?.name)?.target || 0;
        return 0;
      }

      function salesDashboardMetric(label, value, foot, stage = "") {
        const attrs = stage
          ? ` type="button" data-sales-drill-stage="${stage}" title="查看同口径商机"`
          : "";
        const tag = stage ? "button" : "div";
        return `<${tag} class="metric sales-metric"${attrs}><span class="metric-label">${label}</span><span class="metric-value">${value}</span><span class="metric-foot">${foot}</span></${tag}>`;
      }

      function salesPeriodFilter() {
        return `<div class="toolbar filter-toolbar sales-period-toolbar">${filterField(
          "统计月份",
          `<select class="input" id="salesPeriodDraft">${salesTargetMonths
            .map(
              (item) =>
                `<option value="${item.month}" ${item.month === salesPeriodDraft ? "selected" : ""}>${item.month}</option>`,
            )
            .join("")}</select>`,
          "filter-field-medium",
        )}${filterActions(
          '<button class="btn btn-primary" id="applySalesPeriod" type="button">筛选</button><button class="btn" id="resetSalesPeriod" type="button">重置</button>',
        )}</div>`;
      }

      function renderSalesDashboard() {
        const rows = salesVisibleOpportunities();
        const target = salesCurrentTarget();
        const periodRows = rows.filter((item) => item.createdDate.startsWith(salesPeriodApplied));
        const scopeTarget = salesTargetForCurrentScope(target);
        const active = rows.filter((item) => item.stage !== "落选");
        const selected = rows.filter((item) => item.stage === "中选");
        const lost = rows.filter((item) => item.stage === "落选");
        const activeAmount = active.reduce((sum, item) => sum + salesAmountValue(item), 0);
        const results = selected.length + lost.length;
        const selectedRate = results ? Math.round((selected.length / results) * 100) : 0;
        const stageRows = SALES_STAGES.map((stage) => ({
          stage,
          count: rows.filter((item) => item.stage === stage).length,
        }));
        const maxStageCount = Math.max(...stageRows.map((item) => item.count), 1);
        const regionRows = [...new Set(rows.map((item) => item.region))].map((region) => {
          const regionItems = rows.filter((item) => item.region === region);
          return {
            region,
            active: regionItems.filter((item) => item.stage !== "落选").length,
            amount: regionItems
              .filter((item) => item.stage !== "落选")
              .reduce((sum, item) => sum + salesAmountValue(item), 0),
            selected: regionItems.filter((item) => item.stage === "中选").length,
          };
        });
        const trendRows = salesTargetMonths.map((period) => {
          const createdItems = rows.filter((item) => item.createdDate.startsWith(period.month));
          const wonItems = rows.filter(
            (item) => item.stage === "中选" && item.selectedDate?.startsWith(period.month),
          );
          return {
            period: period.month,
            created: salesTrendMode === "amount"
              ? createdItems.reduce((sum, item) => sum + item.estimateAmount, 0)
              : createdItems.length,
            won: salesTrendMode === "amount"
              ? wonItems.reduce((sum, item) => sum + (item.expectedContractAmount || 0), 0)
              : wonItems.length,
          };
        });
        return (
          pageHead(
            "销售仪表盘",
            "所选周期目标与当前商机快照分开统计。",
            '<button class="btn" data-sales-page="opportunities">商机列表</button><button class="btn btn-primary" data-sales-page="sales-targets">销售指标</button>',
          ) +
          `<section class="panel sales-filter-panel">${salesPeriodFilter()}</section>` +
          `<div class="metrics sales-metrics">${salesDashboardMetric("商机数量目标", scopeTarget, `${salesPeriodApplied} · 当前权限范围`)}${salesDashboardMetric("周期新建商机", periodRows.length, `${salesPeriodApplied} 按创建日期`, "period")}${salesDashboardMetric("当前活跃商机", active.length, "排除落选", "active")}${salesDashboardMetric("当前活跃金额", salesMoney(activeAmount), "中选使用预计签约金额", "active")}${salesDashboardMetric("当前中选结果", selected.length, "当前快照", "中选")}${salesDashboardMetric("当前中选率", `${selectedRate}%`, "中选 /（中选 + 落选）", "result")}</div>` +
          `<div class="sales-dashboard-grid"><section class="panel"><div class="panel-head"><div><div class="panel-title">当前阶段漏斗</div><div class="panel-sub">点击阶段查看同口径商机</div></div></div><div class="panel-body sales-funnel">${stageRows
            .map(
              (item) =>
                `<button class="sales-funnel-row" type="button" data-sales-drill-stage="${item.stage}"><span>${item.stage}</span><span class="sales-funnel-track"><i style="width:${Math.max((item.count / maxStageCount) * 100, item.count ? 12 : 0)}%"></i></span><strong>${item.count}</strong></button>`,
            )
            .join("")}</div></section><section class="panel"><div class="panel-head"><div><div class="panel-title">当前区域对比</div><div class="panel-sub">按当前有效责任范围</div></div></div><div class="table-wrap"><table><thead><tr><th>区域</th><th>活跃商机</th><th>活跃金额</th><th>中选结果</th></tr></thead><tbody>${regionRows
            .map(
              (item) =>
                `<tr><td>${item.region}</td><td>${item.active}</td><td>${salesMoney(item.amount)}</td><td>${item.selected}</td></tr>`,
            )
            .join("") || '<tr><td colspan="4"><div class="empty">暂无数据</div></td></tr>'}</tbody></table></div></section></div>` +
          `<section class="panel sales-trend-panel"><div class="panel-head"><div><div class="panel-title">商机趋势</div><div class="panel-sub">新建与中选事件</div></div><div class="spacer"></div><div class="tabs assignment-view-switch"><button class="tab ${salesTrendMode === "count" ? "active" : ""}" type="button" data-sales-trend="count">数量</button><button class="tab ${salesTrendMode === "amount" ? "active" : ""}" type="button" data-sales-trend="amount">金额</button></div></div><div class="table-wrap"><table><thead><tr><th>月份</th><th>新建商机</th><th>中选结果</th></tr></thead><tbody>${trendRows
            .map(
              (item) =>
                `<tr><td>${item.period}</td><td>${salesTrendMode === "amount" ? salesMoney(item.created) : item.created}</td><td>${salesTrendMode === "amount" ? salesMoney(item.won) : item.won}</td></tr>`,
            )
            .join("")}</tbody></table></div></section>`
        );
      }

      function salesTargetRows(target) {
        const regions = salesIsRole("PM")
          ? target.regions.filter((item) => item.pms.some((pm) => pm.name === currentUser.name))
          : salesIsRole("区域总监")
            ? target.regions.filter((item) => item.name === currentUser.region)
            : target.regions;
        return regions
          .flatMap((region) => [
            `<tr><td>区域</td><td>${region.name}</td><td>${region.target}</td><td>${salesTargetAction("region", region.name, region.target)}</td></tr>`,
            ...region.pms
              .filter((pm) => !salesIsRole("PM") || pm.name === currentUser.name)
              .map(
                (pm) =>
                  `<tr><td>PM</td><td>${pm.name}</td><td>${pm.target}</td><td>${salesTargetAction("pm", `${region.name}|${pm.name}`, pm.target)}</td></tr>`,
              ),
          ])
          .join("");
      }

      function salesTargetAction(level, object, value) {
        if (salesCurrentTarget().month < "2026-09") return "查看";
        const canEdit =
          currentUser?.fullAccess ||
          salesIsRole("总裁") ||
          (salesIsRole("市场副总") && level === "region") ||
          (salesIsRole("区域总监") && level === "pm" && object.startsWith(currentUser.region));
        return canEdit
          ? `<button class="link" type="button" data-sales-target-edit="${level}" data-sales-target-object="${object}" data-sales-target-value="${value}">调整</button>`
          : "查看";
      }

      function renderSalesTargets() {
        const target = salesCurrentTarget();
        const historyRows = salesTargetHistory
          .filter((item) => item.month === target.month)
          .map(
            (item) =>
              `<tr><td>${item.version}</td><td>${item.level}</td><td>${item.object}</td><td>${item.before}</td><td>${item.after}</td><td>${item.reason}</td><td>${item.operator}</td><td>${item.approval}</td><td>${item.effectiveAt}</td></tr>`,
          )
          .join("");
        return (
          pageHead(
            "销售指标",
            "按自然月维护商机数量目标，调整后保留版本。",
            '<button class="btn" data-sales-page="sales-dashboard">返回仪表盘</button>',
          ) +
          `<section class="panel sales-filter-panel">${salesPeriodFilter()}</section>` +
          `<section class="panel"><div class="panel-head"><div><div class="panel-title">当前生效版本</div><div class="panel-sub">${target.version} · ${target.effectiveAt}</div></div></div><div class="table-wrap"><table><thead><tr><th>层级</th><th>对象</th><th>商机数量目标</th><th>操作</th></tr></thead><tbody><tr><td>公司</td><td>英嘉科技</td><td>${target.companyTarget}</td><td>${salesTargetAction("company", "英嘉科技", target.companyTarget)}</td></tr>${salesTargetRows(target)}</tbody></table></div></section>` +
          `<section class="panel sales-history-panel"><div class="panel-head"><div><div class="panel-title">版本记录</div><div class="panel-sub">只追加，不覆盖</div></div></div><div class="table-wrap"><table style="min-width:1100px"><thead><tr><th>版本</th><th>层级</th><th>对象</th><th>调整前</th><th>调整后</th><th>原因</th><th>操作人</th><th>生效方式</th><th>生效时间</th></tr></thead><tbody>${historyRows || '<tr><td colspan="9"><div class="empty">暂无版本记录</div></td></tr>'}</tbody></table></div></section>`
        );
      }

      function opportunityMatchesFilters(item) {
        const filter = appliedOpportunityFilters;
        return (
          (!filter.code || item.id === filter.code) &&
          (!filter.name || item.name.toLowerCase().includes(filter.name.toLowerCase())) &&
          (!filter.type || item.type === filter.type) &&
          (!filter.stage || item.stage === filter.stage) &&
          (!filter.customer || item.customer === filter.customer) &&
          (!filter.region || item.region === filter.region) &&
          (!filter.owner || item.owner === filter.owner) &&
          (!filter.priority || item.priority === filter.priority) &&
          (!filter.expectedDate || item.expectedWinDate === filter.expectedDate) &&
          (!filter.createdDate || item.createdDate === filter.createdDate) &&
          (!filter.overdue ||
            (filter.overdue === "是") === Boolean(item.nextFollowDate && item.nextFollowDate <= "2026-09-01" && item.stage !== "落选")) &&
          (!salesOpportunityDrill ||
            (salesOpportunityDrill === "period" && item.createdDate.startsWith(salesPeriodApplied)) ||
            (salesOpportunityDrill === "active" && item.stage !== "落选") ||
            (salesOpportunityDrill === "result" && ["中选", "落选"].includes(item.stage)))
        );
      }

      function opportunityFiltersHtml() {
        const rows = salesVisibleOpportunities();
        const option = (value, current) => `${value === current ? "selected" : ""}`;
        return `<div class="toolbar filter-toolbar sales-opportunity-filters">${filterField(
          "商机编号",
          `<input class="input" id="opportunityCodeFilter" value="${escapeHtml(appliedOpportunityFilters.code)}" placeholder="请输入完整商机编号">`,
        )}${filterField(
          "商机名称",
          `<input class="input" id="opportunityNameFilter" value="${escapeHtml(appliedOpportunityFilters.name)}" placeholder="请输入商机名称">`,
        )}${filterField(
          "商机类型",
          `<select class="input" id="opportunityTypeFilter"><option value="">全部类型</option>${SALES_TYPES.map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.type)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "阶段",
          `<select class="input" id="opportunityStageFilter"><option value="">全部阶段</option>${SALES_STAGES.map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.stage)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "客户单位",
          `<select class="input" id="opportunityCustomerFilter"><option value="">全部客户</option>${[...new Set(rows.map((item) => item.customer))].map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.customer)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "业务责任区域",
          `<select class="input" id="opportunityRegionFilter"><option value="">全部区域</option>${[...new Set(rows.map((item) => item.region))].map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.region)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "负责人",
          `<select class="input" id="opportunityOwnerFilter"><option value="">全部负责人</option>${[...new Set(rows.map((item) => item.owner))].map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.owner)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "优先级",
          `<select class="input" id="opportunityPriorityFilter"><option value="">全部优先级</option>${SALES_PRIORITIES.map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.priority)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "预计成交日期",
          `<input class="input" id="opportunityExpectedDateFilter" type="date" value="${appliedOpportunityFilters.expectedDate}">`,
        )}${filterField(
          "创建日期",
          `<input class="input" id="opportunityCreatedDateFilter" type="date" value="${appliedOpportunityFilters.createdDate}">`,
        )}${filterField(
          "跟进是否逾期",
          `<select class="input" id="opportunityOverdueFilter"><option value="">全部</option><option value="是" ${option("是", appliedOpportunityFilters.overdue)}>是</option><option value="否" ${option("否", appliedOpportunityFilters.overdue)}>否</option></select>`,
        )}${filterActions(
          '<button class="btn btn-primary" id="applyOpportunityFilters" type="button">筛选</button><button class="btn" id="resetOpportunityFilters" type="button">重置</button>',
        )}</div>`;
      }

      function renderOpportunities() {
        const rows = salesVisibleOpportunities().filter(opportunityMatchesFilters);
        const body = rows
          .sort((left, right) => right.stageChangedAt.localeCompare(left.stageChangedAt))
          .map(
            (item) =>
              `<tr data-page-row><td><button class="link" type="button" data-opportunity-open="${item.id}">${item.id}</button></td><td>${item.name}</td><td>${item.type}</td><td>${salesStageTag(item.stage)}</td><td>${item.customer}</td><td>${salesMoney(salesAmountValue(item))}</td><td>${salesPriorityTag(item.priority)}</td><td>${salesStageDays(item)} 天</td><td>${item.owner}</td><td>${item.createdDate}</td><td>${item.createdBy}</td></tr>`,
          )
          .join("");
        const drillText = salesOpportunityDrill === "period"
          ? `${salesPeriodApplied} 新建商机`
          : salesOpportunityDrill === "active"
            ? "当前活跃商机"
            : "当前中选与落选结果";
        const drillHtml = salesOpportunityDrill
          ? `<div class="sales-drill-strip"><span>当前下钻条件：${drillText}</span><button class="btn" type="button" id="clearSalesDrill">清除</button></div>`
          : "";
        const emptyRow = '<tr data-empty-row><td colspan="11"><div class="empty">暂无数据</div></td></tr>';
        const tableHtml = [
          '<section class="panel">',
          opportunityFiltersHtml(),
          '<div class="table-wrap"><table style="min-width:1420px" data-paged-table="m12-opportunities">',
          '<thead><tr><th>商机编号</th><th>商机名称</th><th>商机类型</th><th>阶段</th><th>客户单位</th><th>当前有效金额</th><th>优先级</th><th>当前阶段停留时间</th><th>负责人</th><th>创建时间</th><th>创建人</th></tr></thead>',
          `<tbody>${body || emptyRow}<tr data-filter-empty style="display:none"><td colspan="11"><div class="empty">暂无数据</div></td></tr></tbody>`,
          `</table></div>${tablePagination("m12-opportunities")}</section>`,
        ].join("");
        return (
          pageHead(
            "商机列表",
            "按当前账号数据范围查看和推进商机。",
            `${salesCanCreate() ? '<button class="btn btn-primary" data-sales-page="opportunity-create">新建商机</button>' : ""}`,
          ) +
          drillHtml +
          tableHtml
        );
      }

      function salesStageDays(opportunity) {
        const changed = new Date(opportunity.stageChangedAt.replace(" ", "T"));
        const now = new Date("2026-09-01T12:00:00");
        return Math.max(Math.floor((now - changed) / 86400000), 0);
      }

      function salesField(label, value, className = "") {
        return `<div class="detail-item ${className}"><label>${label}</label><div>${value || "—"}</div></div>`;
      }

      function opportunitySelected() {
        return salesVisibleOpportunities().find((item) => item.id === selectedOpportunityId);
      }

      function opportunityOverviewHtml(item) {
        const fields = [
          salesField("商机编号", item.id),
          salesField("商机名称", item.name),
          salesField("商机类型", item.type),
          salesField("阶段", salesStageTag(item.stage)),
          salesField("客户单位", item.customer),
          salesField("客户编号", item.customerCode),
          salesField("所属集团", item.group),
          salesField("行业", item.industry),
          salesField("业务责任区域", item.region),
          salesField("地区", item.city || "—"),
          salesField("负责人", item.owner),
          salesField("优先级", salesPriorityTag(item.priority)),
          salesField("预估金额", salesMoney(item.estimateAmount)),
          salesField("预计成交日期", item.expectedWinDate),
          item.stage === "中选" ? salesField("中选日期", item.selectedDate) : "",
          item.stage === "中选" ? salesField("预计签约金额", salesMoney(item.expectedContractAmount)) : "",
          salesField("商机关键人", item.keyPeople.join("、") || "—", "full"),
          salesField("商机需求描述", item.requirement, "full"),
          salesField("下次跟进日期", item.nextFollowDate || "—"),
          salesField("创建信息", `${item.createdDate} · ${item.createdBy}`),
        ];
        return `<div class="detail-grid sales-detail-grid">${fields.join("")}</div>`;
      }

      function opportunityFollowupsHtml(item) {
        const rows = item.followUps
          .map(
            (record) =>
              `<tr><td>${record.time}</td><td>${record.method}</td><td>${record.people}</td><td>${record.result}</td><td>${record.risk}</td><td>${record.nextAction}</td><td>${record.nextDate}</td><td>${record.attachment || "—"}</td><td>${record.operator}</td></tr>`,
          )
          .join("");
        return `<div class="panel-head sales-inner-head"><div><div class="panel-title">商机跟进</div><div class="panel-sub">新记录形成下一次跟进承诺</div></div><div class="spacer"></div>${salesCanProgress(item) && item.stage !== "落选" ? '<button class="btn btn-primary" type="button" data-sales-followup-add>新增跟进</button>' : ""}</div><div class="table-wrap"><table style="min-width:1280px"><thead><tr><th>跟进时间</th><th>跟进方式</th><th>参与关键人</th><th>内容与结果</th><th>当前风险</th><th>下一步行动</th><th>下次跟进日期</th><th>附件</th><th>操作人</th></tr></thead><tbody>${rows || '<tr><td colspan="9"><div class="empty">暂无跟进记录</div></td></tr>'}</tbody></table></div>`;
      }

      function supportStatusAction(item, support) {
        const canHandle = support.assignee === currentUser?.name || currentUser?.fullAccess;
        const canOwnerClose = salesCanProgress(item) && support.status === "已交付";
        if (canOwnerClose)
          return `<button class="link" type="button" data-support-action="close" data-support-id="${support.id}">确认接收</button> <button class="link" type="button" data-support-action="supplement" data-support-id="${support.id}">要求补充</button>`;
        if (!canHandle) return "查看";
        const next = { 待响应: "respond", 已响应: "work", 支撑中: "deliver" }[support.status];
        const text = { respond: "确认接收", work: "提交过程内容", deliver: "提交交付" }[next];
        return next
          ? `<button class="link" type="button" data-support-action="${next}" data-support-id="${support.id}">${text}</button>`
          : "查看";
      }

      function opportunitySupportsHtml(item) {
        const rows = item.supports
          .map(
            (support) =>
              `<tr><td>${support.id}</td><td>${support.assignee}</td><td>${support.deadline}</td><td>${support.content}</td><td>${salesStageTag(support.status)}</td><td>${support.delivery || "—"}</td><td>${supportStatusAction(item, support)}</td></tr>`,
          )
          .join("");
        return `<div class="panel-head sales-inner-head"><div><div class="panel-title">方案支撑</div><div class="panel-sub">每名支撑人员独立流转和计时</div></div><div class="spacer"></div>${salesCanProgress(item) && item.stage !== "落选" ? '<button class="btn btn-primary" type="button" data-sales-support-add>发起支撑</button>' : ""}</div><div class="table-wrap"><table style="min-width:1020px"><thead><tr><th>请求编号</th><th>支撑人员</th><th>回应时限</th><th>支撑内容</th><th>状态</th><th>交付说明/附件</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="7"><div class="empty">暂无方案支撑请求</div></td></tr>'}</tbody></table></div>`;
      }

      function opportunityHistoryHtml(item) {
        const reassignments = item.reassignments || [];
        return `<div class="section-title">阶段历史</div><div class="table-wrap"><table><thead><tr><th>生效时间</th><th>原阶段</th><th>新阶段</th><th>操作人</th></tr></thead><tbody>${item.histories
          .slice()
          .reverse()
          .map((record) => `<tr><td>${record.time}</td><td>${record.from}</td><td>${record.to}</td><td>${record.operator}</td></tr>`)
          .join("")}</tbody></table></div><div class="section-title sales-history-subtitle">负责人改派历史</div><div class="table-wrap"><table><thead><tr><th>生效时间</th><th>原负责人</th><th>新负责人</th><th>改派原因</th><th>操作人</th></tr></thead><tbody>${reassignments
          .slice()
          .reverse()
          .map((record) => `<tr><td>${record.time}</td><td>${record.before}</td><td>${record.after}</td><td>${record.reason}</td><td>${record.operator}</td></tr>`)
          .join("") || '<tr><td colspan="5"><div class="empty">暂无改派记录</div></td></tr>'}</tbody></table></div>`;
      }

      function renderOpportunityDetail() {
        const item = opportunitySelected();
        if (!item)
          return forbiddenPage("商机详情", "当前账号无权查看该商机，或商机不存在。");
        const tabs = [
          ["overview", "基本信息"],
          ["followup", "跟进记录"],
          ["support", "方案支撑"],
          ["history", "阶段历史"],
        ];
        const body = {
          overview: opportunityOverviewHtml(item),
          followup: opportunityFollowupsHtml(item),
          support: opportunitySupportsHtml(item),
          history: opportunityHistoryHtml(item),
        }[opportunityDetailTab];
        const canOperate = salesCanProgress(item) && item.stage !== "落选";
        return (
          pageHead(
            item.name,
            `${item.id} · ${item.customer}`,
            `<button class="btn" id="backToOpportunities">返回列表</button>${salesCanReassign(item) && item.stage !== "落选" ? '<button class="btn" data-sales-reassign>改派负责人</button>' : ""}${canOperate ? '<button class="btn btn-primary" data-sales-stage-open>推进阶段</button>' : ""}`,
          ) +
          `<section class="panel sales-detail-panel"><div class="sales-detail-identity"><div><span class="list-sub">当前阶段</span><div class="sales-detail-stage">${salesStageTag(item.stage)}</div></div><div><span class="list-sub">负责人</span><strong>${item.owner}</strong></div><div><span class="list-sub">下次跟进日期</span><strong>${item.nextFollowDate || "—"}</strong></div></div><div class="tabs detail-tabs">${tabs
            .map(
              ([id, label]) =>
                `<button class="tab ${opportunityDetailTab === id ? "active" : ""}" type="button" data-opportunity-tab="${id}">${label}</button>`,
            )
            .join("")}</div><div class="panel-body sales-detail-body">${body}</div></section>`
        );
      }

      function salesFormField(id, label, control, required = false, full = false) {
        return `<div class="form-group ${full ? "full" : ""}"><label class="form-label">${required ? '<span class="required-marker" aria-hidden="true">*</span>' : ""}${label}</label>${control}<div class="field-error" id="err-${id}"></div></div>`;
      }

      function renderOpportunityCreate() {
        if (!salesCanCreate()) return forbiddenPage("新建商机", "当前账号没有创建商机权限。");
        const customerOptions = salesVisibleCustomers()
          .map(
            (item) =>
              `<option value="${item.name}" data-region="${item.region}" data-group="${item.group}" data-industry="${item.industry}" data-city="${item.city || ""}" data-owner="${item.pm || item.owner}">${item.name}</option>`,
          )
          .join("");
        const ownerOptions = salesIsRole("PM")
          ? `<option value="${currentUser.name}">${currentUser.name}</option>`
          : [...new Set(customers.map((item) => item.pm).filter(Boolean))]
              .map((name) => `<option value="${name}">${name}</option>`)
              .join("");
        const typeOptions = SALES_TYPES.map(
          (item) => `<option value="${item}">${item}</option>`,
        ).join("");
        const priorityOptions = SALES_PRIORITIES.map(
          (item) => `<option value="${item}">${item}</option>`,
        ).join("");
        const employeeOptions = employees
          .filter((item) => item.status === "在职")
          .map((item) => `<option value="${item.name}">${item.name}</option>`)
          .join("");
        const formFields = [
          salesFormField("salesName", "商机名称", '<input class="input" id="salesName" maxlength="100">', true),
          salesFormField("salesType", "商机类型", `<select class="input" id="salesType"><option value="">请选择商机类型</option>${typeOptions}</select>`, true),
          salesFormField("salesAmount", "预估金额", '<input class="input" id="salesAmount" type="number" min="0" step="0.01">', true),
          salesFormField("salesPriority", "优先级", `<select class="input" id="salesPriority"><option value="">请选择优先级</option>${priorityOptions}</select>`, true),
          salesFormField("salesCustomer", "客户单位", `<select class="input" id="salesCustomer"><option value="">请选择客户单位</option>${customerOptions}</select>`, true),
          salesFormField("salesCustomerFacts", "客户关联信息", '<div class="input sales-readonly" id="salesCustomerFacts">请选择客户单位</div>'),
          salesFormField("salesKeyPeople", "商机关键人", '<select class="input" id="salesKeyPeople" multiple size="4" disabled><option value="">请先选择客户单位</option></select>', true),
          salesFormField("salesExpectedDate", "预计成交日期", '<input class="input" id="salesExpectedDate" type="date">', true),
          salesFormField("salesOwner", "商机负责人", `<select class="input" id="salesOwner"><option value="">请选择负责人</option>${ownerOptions}</select>`, true),
          salesFormField("salesFirstFollow", "首次跟进日期", '<input class="input" id="salesFirstFollow" type="date" min="2026-09-02">', true),
          salesFormField("salesRequirement", "商机需求描述", '<textarea class="textarea" id="salesRequirement" rows="4" maxlength="1000"></textarea>', true, true),
          salesFormField("salesCreateSupport", "同时创建方案支撑", '<select class="input" id="salesCreateSupport"><option value="否">否</option><option value="是">是</option></select>', true),
          `<div class="form-group" id="salesSupportPeopleGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label><select class="input" id="salesSupportPeople" multiple size="4">${employeeOptions}</select><div class="field-error" id="err-salesSupportPeople"></div></div>`,
          '<div class="form-group" id="salesSupportDeadlineGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>回应时限</label><input class="input" id="salesSupportDeadline" type="datetime-local" value="2026-09-03T12:00"><div class="field-error" id="err-salesSupportDeadline"></div></div>',
        ].join("");
        return (
          pageHead("新建商机", "保存后生成永久商机编号和首条阶段记录。") +
          `<section class="panel sales-form-panel"><form id="opportunityCreateForm"><div class="panel-body sales-form-grid">${formFields}</div><div class="panel-foot sales-form-footer"><button class="btn" type="button" id="cancelOpportunityCreate">取消</button><button class="btn btn-primary" type="submit">保存商机</button></div></form></section>`
        );
      }
