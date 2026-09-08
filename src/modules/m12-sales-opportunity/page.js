      const SALES_STAGES = ["商机录入", "需求确认", "方案支撑", "比选", "中选", "落选"];
      const SALES_FORWARD_STAGES = ["商机录入", "需求确认", "方案支撑", "比选", "中选"];
      const SALES_TYPES = ["培训商机", "AI 项目商机"];
      const SALES_PRIORITIES = ["高", "中", "低"];
      const SALES_RISKS = [
        "暂无风险",
        "需求不明确或发生变化",
        "预算风险",
        "决策推进风险",
        "竞争风险",
        "方案或交付风险",
        "商务条件风险",
        "预计成交延期",
        "其他",
      ];

      function salesRoleNames() {
        return currentRoleTemplateNames();
      }

      function salesIsRole(name) {
        return salesRoleNames().includes(name);
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
          salesManagedRegions().some((region) =>
            regionsMatch(regionScopeName(region), opportunity.region),
          )
        );
      }

      function salesCurrentEmployee() {
        return employees.find(
          (employee) =>
            employee.name === currentUser?.name && employee.status === "在职",
        );
      }

      function salesManagedRegions() {
        const employee = salesCurrentEmployee();
        if (!employee) return [];
        return regionsData.filter(
          (region) =>
            region.director === employee.name &&
            departmentsManagedBy(employee.code).some(
              (department) => department.regionId === region.id,
            ),
        );
      }

      function salesOpportunityCustomer(opportunity) {
        return customers.find((customer) =>
          opportunity.customerCode === `CU-${String(customer.id).padStart(4, "0")}`,
        );
      }

      function salesOwnerMatchForCustomer(customer) {
        if (!customer || customer.archived)
          return { ok: false, message: "客户单位已停用或不存在" };
        if (customer.level === "省公司") {
          const region = regionForCompany(customer);
          const department = organizationDepartments.find(
            (item) =>
              item.type === "region" &&
              item.status === "启用" &&
              item.regionId === region?.id,
          );
          const candidates = employees.filter(
            (employee) =>
              employee.code === department?.supervisorCode &&
              employee.name === region?.director &&
              employee.status === "在职" &&
              employee.accountStatus !== "停用" &&
              employeeHasRole(employee, "区域总监"),
          );
          return candidates.length === 1
            ? { ok: true, owner: candidates[0], role: "区域总监" }
            : { ok: false, message: "该省级客户没有唯一有效区域总监，暂不能创建商机" };
        }
        const responsibilities = cityOwners.filter(
          (item) =>
            item.province === customer.province && item.city === customer.city,
        );
        if (responsibilities.length !== 1)
          return { ok: false, message: "该客户责任地市没有唯一有效 PM 负责人，暂不能创建商机" };
        const responsibility = responsibilities[0];
        const candidates = employees.filter(
          (employee) =>
            employee.name === responsibility?.pm &&
            employee.status === "在职" &&
            employee.accountStatus !== "停用" &&
            employeeHasRole(employee, "PM") &&
            regionPmEmployees(regionForCompany(customer)).includes(employee),
        );
        return candidates.length === 1
          ? { ok: true, owner: candidates[0], role: "PM" }
          : { ok: false, message: "该客户责任地市没有唯一有效 PM 负责人，暂不能创建商机" };
      }

      function salesCustomerIsInCreateScope(customer) {
        if (!customer || customer.archived) return false;
        if (
          currentUser?.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return true;
        const inDirectorScope =
          salesIsRole("区域总监") &&
          customer.level === "省公司" &&
          salesManagedRegions().some(
            (region) => regionForCompany(customer)?.id === region.id,
          );
        const ownerMatch = salesOwnerMatchForCustomer(customer);
        const inSalesScope =
          salesIsRole("PM") && customer.level !== "省公司" &&
          ownerMatch.ok && ownerMatch.owner.name === currentUser.name;
        return inDirectorScope || inSalesScope;
      }

      function salesVisibleOpportunities() {
        if (!currentUser) return [];
        if (
          currentUser.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return opportunities;
        if (salesIsRole("区域总监") || salesIsRole("PM"))
          return opportunities.filter(
            (item) =>
              (salesIsRole("区域总监") &&
                salesManagedRegions().some((region) =>
                  regionsMatch(regionScopeName(region), item.region),
                )) ||
              (salesIsRole("PM") && item.owner === currentUser.name),
          );
        return [];
      }

      function salesVisibleCustomers() {
        if (!currentUser) return [];
        if (
          currentUser.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return customers.filter((item) => !item.archived);
        if (salesIsRole("区域总监"))
          return customers.filter(salesCustomerIsInCreateScope);
        if (salesIsRole("PM"))
          return customers.filter(salesCustomerIsInCreateScope);
        return [];
      }

      function salesPmEmployees(region = "") {
        return employees.filter(
          (employee) =>
            employee.status === "在职" &&
            employee.accountStatus !== "停用" &&
            employeeHasRole(employee, "PM") &&
            (!region ||
              organizationRegionsForEmployee(employee).some(
                (employeeRegion) => employeeRegion.scope === region,
              )),
        );
      }

      function salesSupportCandidates() {
        return employees.filter(
          (employee) =>
            employee.status === "在职" &&
            employee.role !== "系统管理员" &&
            employeeHasRole(employee, "PM"),
        );
      }

      function salesMoney(value) {
        return `${Number(value || 0).toLocaleString("zh-CN", {
          maximumFractionDigits: 0,
        })} 元`;
      }

      function salesNextBusinessDate(date = DEMO_TODAY) {
        let next = addDays(date, 1);
        while ([0, 6].includes(new Date(`${next}T12:00:00`).getDay()))
          next = addDays(next, 1);
        return next;
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
        const month = salesTargetMonth;
        return (
          salesTargetMonths.find((item) => item.month === month) ||
          salesTargetMonths[0]
        );
      }

      function salesPeriodMonths(period = salesPeriodApplied) {
        if (/^\d{4}-\d{2}$/.test(period)) return [period];
        if (/^\d{4}-Q\d$/.test(period)) {
          const [year, quarterText] = period.split("-Q");
          const start = (Number(quarterText) - 1) * 3 + 1;
          return [0, 1, 2].map((offset) => `${year}-${String(start + offset).padStart(2, "0")}`);
        }
        return salesTargetMonths.filter((item) => item.month.startsWith(period)).map((item) => item.month);
      }

      function salesTargetForCurrentScope(target) {
        if (currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总"))
          return target.companyTarget;
        if (salesIsRole("区域总监")) {
          const managedRegions = salesManagedRegions();
          return target.regions
            .filter((targetRegion) =>
              managedRegions.some((region) =>
                regionsMatch(regionScopeName(region), targetRegion.name),
              ),
            )
            .reduce((sum, region) => sum + region.target, 0);
        }
        if (salesIsRole("PM")) {
          const assignments = target.regions.flatMap((region) =>
            region.salespeople.filter(
              (person) => person.name === currentUser?.name,
            ),
          );
          if (!assignments.length || assignments.some((item) => item.target == null))
            return null;
          return assignments.reduce((sum, item) => sum + item.target, 0);
        }
        return 0;
      }

      function salesDashboardMetric(label, value, foot) {
        return `<div class="metric sales-metric"><span class="metric-label">${label}</span><span class="metric-value">${value}</span><span class="metric-foot">${foot}</span></div>`;
      }

      function salesPeriodFilter() {
        return `<div class="toolbar filter-toolbar sales-period-toolbar">${filterField(
          "时间范围",
          `<select class="input" id="salesPeriodDraft"><option value="2026-09" ${salesPeriodDraft === "2026-09" ? "selected" : ""}>2026年9月</option><option value="2026-Q3" ${salesPeriodDraft === "2026-Q3" ? "selected" : ""}>2026年第3季度</option><option value="2026" ${salesPeriodDraft === "2026" ? "selected" : ""}>2026年</option></select>`,
          "filter-field-medium",
        )}${filterActions(
          '<button class="btn btn-primary" id="applySalesPeriod" type="button">筛选</button><button class="btn" id="resetSalesPeriod" type="button">重置</button>',
        )}</div>`;
      }

      function renderSalesDashboard() {
        const rows = salesVisibleOpportunities();
        const periodMonths = salesPeriodMonths();
        const periodRows = rows.filter((item) => periodMonths.some((month) => item.createdDate.startsWith(month)));
        const scopeTargets = salesTargetMonths
          .filter((item) => periodMonths.includes(item.month))
          .map(salesTargetForCurrentScope);
        const scopeTarget = scopeTargets.some((value) => value == null)
          ? null
          : scopeTargets.reduce((sum, value) => sum + value, 0);
        const targetDisplay = scopeTarget == null ? "未分配" : scopeTarget;
        const completionRate = scopeTarget === 0 || scopeTarget == null
          ? "—"
          : `${((periodRows.length / scopeTarget) * 100).toFixed(1)}%`;
        const difference = scopeTarget == null ? "—" : periodRows.length - scopeTarget;
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
        const trendKeys = /^\d{4}-\d{2}$/.test(salesPeriodApplied)
          ? [...new Set(rows.flatMap((item) => [item.createdDate, item.selectedDate].filter((date) => date?.startsWith(salesPeriodApplied))))].sort()
          : periodMonths;
        const trendRows = trendKeys.map((period) => {
          const createdItems = rows.filter((item) => item.createdDate.startsWith(period));
          const wonItems = rows.filter(
            (item) => item.stage === "中选" && item.selectedDate?.startsWith(period),
          );
          return {
            period,
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
            `<button class="btn" data-sales-page="opportunities">商机列表</button>${canAccessPage("sales-supports") ? `<button class="btn" data-sales-page="sales-supports">${currentUser?.fullAccess ? "方案支撑管理" : "我的方案支撑"}</button>` : ""}<button class="btn btn-primary" data-sales-page="sales-targets">${salesIsRole("PM") && !currentUser?.fullAccess && !salesRoleNames().some((role) => ["总裁", "市场副总", "区域总监"].includes(role)) ? "我的销售指标" : "销售指标"}</button>`,
          ) +
          `<section class="panel sales-filter-panel">${salesPeriodFilter()}</section>` +
          `<div class="metrics sales-metrics">${salesDashboardMetric("商机数量目标", targetDisplay, `${salesPeriodApplied} · 当前权限范围`)}${salesDashboardMetric("周期新建商机", periodRows.length, "按创建日期")}${salesDashboardMetric("差额", difference > 0 ? `+${difference}` : difference, "完成数 - 目标数")}${salesDashboardMetric("目标完成率", completionRate, "周期有效新建 / 目标")}${salesDashboardMetric("当前活跃商机", active.length, "排除落选")}${salesDashboardMetric("当前活跃金额（含税，元）", salesMoney(activeAmount), "中选使用预计签约金额")}${salesDashboardMetric("当前中选结果", selected.length, "当前快照")}${salesDashboardMetric("当前中选率", `${selectedRate}%`, "中选 /（中选 + 落选）")}</div>` +
          `<div class="sales-dashboard-grid"><section class="panel"><div class="panel-head"><div><div class="panel-title">当前阶段漏斗</div><div class="panel-sub">按当前商机阶段统计</div></div></div><div class="panel-body sales-funnel">${stageRows
            .map(
              (item) =>
                `<div class="sales-funnel-row"><span>${item.stage}</span><span class="sales-funnel-track"><i style="width:${Math.max((item.count / maxStageCount) * 100, item.count ? 12 : 0)}%"></i></span><strong>${item.count}</strong></div>`,
            )
            .join("")}</div></section><section class="panel"><div class="panel-head"><div><div class="panel-title">当前区域对比</div><div class="panel-sub">按当前有效责任范围</div></div></div><div class="table-wrap"><table><thead><tr><th>区域</th><th>活跃商机</th><th>活跃金额（含税，元）</th><th>中选结果</th></tr></thead><tbody>${regionRows
            .map(
              (item) =>
                `<tr><td>${item.region}</td><td>${item.active}</td><td>${salesMoney(item.amount)}</td><td>${item.selected}</td></tr>`,
            )
            .join("") || '<tr><td colspan="4"><div class="empty">暂无数据</div></td></tr>'}</tbody></table></div></section></div>` +
          `<section class="panel sales-trend-panel"><div class="panel-head"><div><div class="panel-title">商机趋势</div><div class="panel-sub">新建与中选事件${salesTrendMode === "amount" ? " · 含税人民币" : ""}</div></div><div class="spacer"></div><div class="tabs assignment-view-switch"><button class="tab ${salesTrendMode === "count" ? "active" : ""}" type="button" data-sales-trend="count">数量</button><button class="tab ${salesTrendMode === "amount" ? "active" : ""}" type="button" data-sales-trend="amount">金额</button></div></div><div class="table-wrap"><table><thead><tr><th>${/^\d{4}-\d{2}$/.test(salesPeriodApplied) ? "日期" : "月份"}</th><th>新建商机</th><th>中选结果</th></tr></thead><tbody>${trendRows
            .map(
              (item) =>
                `<tr><td>${item.period}</td><td>${salesTrendMode === "amount" ? salesMoney(item.created) : item.created}</td><td>${salesTrendMode === "amount" ? salesMoney(item.won) : item.won}</td></tr>`,
            )
            .join("")}</tbody></table></div></section>`
        );
      }

      function salesTargetRows(target) {
        const managedRegions = salesManagedRegions();
        const canSeeAllRegions =
          currentUser?.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总");
        const regions = salesIsRole("区域总监") && !canSeeAllRegions
          ? target.regions.filter((targetRegion) =>
              managedRegions.some((region) =>
                regionsMatch(regionScopeName(region), targetRegion.name),
              ),
            )
          : target.regions;
        return regions
          .flatMap((region) => [
            `<tr><td>区域</td><td>${region.name}</td><td>${region.target}</td><td>${salesTargetAction("region", region.name, region.target)}</td></tr>`,
            ...(currentUser?.fullAccess ||
            salesIsRole("总裁") ||
            (salesIsRole("区域总监") &&
              managedRegions.some((managedRegion) =>
                regionsMatch(regionScopeName(managedRegion), region.name),
              ))
              ? region.salespeople.map(
                  (person) =>
                    `<tr><td>PM</td><td>${person.name}</td><td>${person.target ?? "未分配"}</td><td>${salesTargetAction("sales", `${region.name}|${person.name}`, person.target ?? 0)}</td></tr>`,
                )
              : []),
          ])
          .join("");
      }

      function salesTargetAction(level, object, value) {
        if (salesCurrentTarget().month < "2026-09") return "查看";
        const targetRegion = object.split("|")[0];
        const canEdit =
          currentUser?.fullAccess ||
          salesIsRole("总裁") ||
          (salesIsRole("市场副总") && level === "region") ||
          (salesIsRole("区域总监") &&
            level === "sales" &&
            salesManagedRegions().some((region) =>
              regionsMatch(regionScopeName(region), targetRegion),
            ));
        return canEdit
          ? `<button class="link" type="button" data-sales-target-edit="${level}" data-sales-target-object="${object}" data-sales-target-value="${value}">调整</button>`
          : "查看";
      }

      function salesTargetHistoryIsVisible(item) {
        if (currentUser?.fullAccess || salesIsRole("总裁")) return true;
        if (
          salesIsRole("市场副总") &&
          ["公司", "区域"].includes(item.level)
        )
          return true;
        if (!salesIsRole("区域总监")) return false;
        return salesManagedRegions().some((region) => {
          const name = regionScopeName(region);
          return item.level === "区域"
            ? regionsMatch(name, item.object)
            : item.level === "PM" && item.object.startsWith(`${name} / `);
        });
      }

      function renderSalesTargets() {
        const hasTargetManagementRole =
          currentUser?.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总") ||
          salesIsRole("区域总监");
        if (salesIsRole("PM") && !hasTargetManagementRole)
          return renderPersonalSalesTargets();
        const target = salesCurrentTarget();
        const historyRows = salesTargetHistory
          .filter(
            (item) =>
              item.month === target.month && salesTargetHistoryIsVisible(item),
          )
          .map(
            (item) =>
              `<tr><td>${item.version}</td><td>${item.level}</td><td>${item.object}</td><td>${item.before}</td><td>${item.after}</td><td>${item.reason}</td><td>${item.operator}</td><td>${item.effectiveMode}</td><td>${item.effectiveAt}</td></tr>`,
          )
          .join("");
        return (
          pageHead(
            "销售指标",
            "按自然月维护商机数量目标，调整后保留版本。",
            '<button class="btn" data-sales-page="sales-dashboard">返回仪表盘</button>',
          ) +
          `<section class="panel sales-filter-panel"><div class="toolbar filter-toolbar sales-period-toolbar">${filterField(
            "目标月份",
            `<select class="input" id="salesTargetMonth">${salesTargetMonths.map((item) => `<option value="${item.month}" ${item.month === salesTargetMonth ? "selected" : ""}>${item.month}</option>`).join("")}</select>`,
            "filter-field-medium",
          )}</div></section>` +
          `<section class="panel"><div class="panel-head"><div><div class="panel-title">当前生效版本</div><div class="panel-sub">${target.version} · ${target.effectiveAt}</div></div></div><div class="table-wrap"><table data-paged-table="m12-sales-targets"><thead><tr><th>层级</th><th>对象</th><th>商机数量目标</th><th>操作</th></tr></thead><tbody>${currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总") ? `<tr data-page-row><td>公司</td><td>英嘉科技</td><td>${target.companyTarget}</td><td>${salesTargetAction("company", "英嘉科技", target.companyTarget)}</td></tr>` : ""}${salesTargetRows(target).replaceAll("<tr>", "<tr data-page-row>")}</tbody></table></div>${tablePagination("m12-sales-targets")}</section>` +
          `<section class="panel sales-history-panel"><div class="panel-head"><div><div class="panel-title">版本记录</div><div class="panel-sub">只追加，不覆盖</div></div></div><div class="table-wrap"><table style="min-width:1100px" data-paged-table="m12-sales-target-history"><thead><tr><th>版本</th><th>层级</th><th>对象</th><th>调整前</th><th>调整后</th><th>原因</th><th>操作人</th><th>生效方式</th><th>生效时间</th></tr></thead><tbody>${historyRows.replaceAll("<tr>", "<tr data-page-row>") || '<tr data-empty-row><td colspan="9"><div class="empty">暂无版本记录</div></td></tr>'}</tbody></table></div>${tablePagination("m12-sales-target-history")}</section>`
        );
      }

      function renderPersonalSalesTargets() {
        const target = salesCurrentTarget();
        const region = target.regions.find((item) =>
          item.salespeople.some((person) => person.name === currentUser.name),
        );
        const person = region?.salespeople.find(
          (item) => item.name === currentUser.name,
        );
        const assignedTarget = person?.target ?? null;
        const completed = opportunities.filter(
          (item) =>
            item.owner === currentUser.name &&
            item.createdDate.startsWith(target.month),
        ).length;
        const difference = assignedTarget == null ? "—" : completed - assignedTarget;
        const completionRate =
          assignedTarget == null
            ? "—"
            : assignedTarget === 0
              ? "—"
              : `${((completed / assignedTarget) * 100).toFixed(1)}%`;
        const historyRows = salesTargetHistory
          .filter(
            (item) =>
              item.month === target.month && item.object.includes(currentUser.name),
          )
          .map(
            (item) =>
              `<tr data-page-row><td>${item.version}</td><td>${item.month}</td><td>${item.before}</td><td>${item.after}</td><td>${item.reason}</td><td>${item.operator}</td><td>${item.effectiveAt}</td></tr>`,
          )
          .join("");
        return (
          pageHead(
            "我的销售指标",
            "仅展示本人月度商机数量目标、完成结果和本人目标调整历史。",
            '<button class="btn" data-sales-page="sales-dashboard">返回仪表盘</button>',
          ) +
          `<section class="panel sales-filter-panel"><div class="toolbar filter-toolbar sales-period-toolbar">${filterField(
            "目标月份",
            `<select class="input" id="salesTargetMonth">${salesTargetMonths.map((item) => `<option value="${item.month}" ${item.month === salesTargetMonth ? "selected" : ""}>${item.month}</option>`).join("")}</select>`,
            "filter-field-medium",
          )}</div></section>` +
          `<div class="metrics sales-metrics">${salesDashboardMetric("本人月度目标", assignedTarget ?? "未分配", target.month)}${salesDashboardMetric("本人周期新建商机", completed, "按当前负责人和创建日期")}${salesDashboardMetric("差额", typeof difference === "number" && difference > 0 ? `+${difference}` : difference, "完成数 - 目标数")}${salesDashboardMetric("完成率", completionRate, assignedTarget == null ? "目标未分配" : "周期有效新建 / 目标")}</div>` +
          `<section class="panel sales-history-panel"><div class="panel-head"><div><div class="panel-title">本人目标调整历史</div><div class="panel-sub">不展示公司、其他区域或其他PM目标</div></div></div><div class="table-wrap"><table data-paged-table="m12-personal-target-history"><thead><tr><th>版本</th><th>月份</th><th>调整前</th><th>调整后</th><th>原因</th><th>操作人</th><th>生效时间</th></tr></thead><tbody>${historyRows || '<tr data-empty-row><td colspan="7"><div class="empty">暂无本人目标调整记录</div></td></tr>'}</tbody></table></div>${tablePagination("m12-personal-target-history")}</section>`
        );
      }

      function renderSalesSupports() {
        const isAdminManagement = Boolean(currentUser?.fullAccess);
        const requests = opportunities.flatMap((opportunity) =>
          opportunity.supports
            .filter((support) => currentUser?.fullAccess || support.assignee === currentUser?.name)
            .map((support) => ({ opportunity, support })),
        );
        const rows = requests
          .map(({ opportunity, support }) =>
            `<tr data-page-row><td>${support.id}</td><td>${opportunity.id}</td><td>${opportunity.name}</td><td>${opportunity.customer}</td><td>${support.content}</td><td>${support.deadline}</td><td>${salesStageTag(support.status)}</td><td>${support.overdue ? '<span class="tag red">已超时</span>' : "—"}</td><td>${support.delivery || "—"}</td><td>${supportHistoryHtml(support)}</td><td>${supportStatusAction(opportunity, support).replaceAll("data-support-id", `data-support-opportunity=\"${opportunity.id}\" data-support-id`)}</td></tr>`,
          )
          .join("");
        return (
          pageHead(
            isAdminManagement ? "方案支撑管理" : "我的方案支撑",
            isAdminManagement
              ? "查看公司全部方案支撑请求，并以系统管理员真实身份代操作。"
              : "仅展示本人被指派请求及完成支撑所需信息。",
            hasPermission("opportunities") ? '<button class="btn" data-sales-page="opportunities">商机列表</button>' : "",
          ) +
          `<section class="panel"><div class="table-wrap"><table style="min-width:1660px" data-paged-table="m12-supports"><thead><tr><th>请求编号</th><th>商机编号</th><th>商机名称</th><th>客户单位</th><th>支撑需求</th><th>回应时限</th><th>状态</th><th>首次回应超时</th><th>交付内容</th><th>操作历史</th><th>操作</th></tr></thead><tbody>${rows || '<tr data-empty-row><td colspan="11"><div class="empty">当前没有方案支撑请求</div></td></tr>'}</tbody></table></div>${tablePagination("m12-supports")}</section>`
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
          (!filter.expectedFrom || item.expectedWinDate >= filter.expectedFrom) &&
          (!filter.expectedTo || item.expectedWinDate <= filter.expectedTo) &&
          (!filter.createdFrom || item.createdDate >= filter.createdFrom) &&
          (!filter.createdTo || item.createdDate <= filter.createdTo) &&
          (!filter.overdue ||
            (filter.overdue === "是") === Boolean(item.nextFollowDate && item.nextFollowDate < DEMO_TODAY && item.stage !== "落选"))
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
          `<span class="date-range"><input class="input" id="opportunityExpectedFromFilter" type="date" value="${appliedOpportunityFilters.expectedFrom}"><span>至</span><input class="input" id="opportunityExpectedToFilter" type="date" value="${appliedOpportunityFilters.expectedTo}"></span>`,
        )}${filterField(
          "创建日期",
          `<span class="date-range"><input class="input" id="opportunityCreatedFromFilter" type="date" value="${appliedOpportunityFilters.createdFrom}"><span>至</span><input class="input" id="opportunityCreatedToFilter" type="date" value="${appliedOpportunityFilters.createdTo}"></span>`,
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
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id))
          .map(
            (item) =>
              `<tr data-page-row><td>${item.id}</td><td>${item.name}</td><td>${item.type}</td><td>${salesStageTag(item.stage)}</td><td>${item.customer}</td><td>${salesMoney(salesAmountValue(item))}</td><td>${salesPriorityTag(item.priority)}</td><td>${salesStageDays(item)} 天</td><td>${item.owner}</td><td>${item.createdDate}</td><td>${item.updatedAt}</td><td>${item.createdBy}</td><td><button class="link" type="button" data-opportunity-open="${item.id}">详情</button></td></tr>`,
          )
          .join("");
        const emptyRow = '<tr data-empty-row><td colspan="13"><div class="empty">暂无数据</div></td></tr>';
        const tableHtml = [
          '<section class="panel">',
          opportunityFiltersHtml(),
          '<div class="table-wrap"><table style="min-width:1500px" data-paged-table="m12-opportunities">',
          '<thead><tr><th>商机编号</th><th>商机名称</th><th>商机类型</th><th>阶段</th><th>客户单位</th><th>当前有效金额（含税，元）</th><th>优先级</th><th>当前阶段停留时间</th><th>负责人</th><th>创建时间</th><th>最近更新时间</th><th>创建人</th><th>操作</th></tr></thead>',
          `<tbody>${body || emptyRow}<tr data-filter-empty style="display:none"><td colspan="13"><div class="empty">暂无数据</div></td></tr></tbody>`,
          `</table></div>${tablePagination("m12-opportunities")}</section>`,
        ].join("");
        return (
          pageHead(
            "商机列表",
            "按当前账号数据范围查看和推进商机。",
            `${salesCanCreate() ? '<button class="btn btn-primary" data-sales-page="opportunity-create">新建商机</button>' : ""}`,
          ) +
          tableHtml
        );
      }

      function salesStageDays(opportunity) {
        const changed = new Date(opportunity.stageChangedAt.replace(" ", "T"));
        const now = new Date(`${DEMO_TODAY}T12:00:00`);
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
          salesField("商机类型", item.type),
          salesField("客户单位", item.customer),
          salesField("客户编号", item.customerCode),
          salesField("所属集团", item.group),
          salesField("行业", item.industry),
          salesField("业务责任区域", item.region),
          salesField("地区", item.city || "—"),
          salesField("优先级", salesPriorityTag(item.priority)),
          salesField("预估金额（含税，元）", salesMoney(item.estimateAmount)),
          salesField("预计成交日期", item.expectedWinDate),
          item.stage === "中选" ? salesField("中选日期", item.selectedDate) : "",
          item.stage === "中选" ? salesField("预计签约金额（含税，元）", salesMoney(item.expectedContractAmount)) : "",
          salesField("商机关键人", item.keyPeople.join("、") || "—", "full"),
          salesField("商机需求描述", item.requirement, "full"),
          salesField("创建信息", `${item.createdDate} · ${item.createdBy}`),
          salesField("最近更新时间", item.updatedAt),
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
        const action =
          salesCanProgress(item) && item.stage !== "落选"
            ? '<div class="sales-tab-toolbar"><button class="btn btn-primary" type="button" data-sales-followup-add>新增跟进</button></div>'
            : "";
        return `${action}<div class="table-wrap"><table style="min-width:1280px"><thead><tr><th>跟进时间</th><th>跟进方式</th><th>参与关键人</th><th>内容与结果</th><th>当前风险</th><th>下一步行动</th><th>下次跟进日期</th><th>附件</th><th>操作人</th></tr></thead><tbody>${rows || '<tr><td colspan="9"><div class="empty">暂无跟进记录</div></td></tr>'}</tbody></table></div>`;
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

      function supportHistoryHtml(support) {
        const records = support.histories || [];
        return records.length
          ? `<div class="support-history-list">${records
              .slice()
              .reverse()
              .map(
                (record) =>
                  `<div><strong>${record.action}</strong><span>${record.time} · 操作人 ${record.operator}</span><span>当时负责人 ${record.owner} · 支撑人员 ${record.assignee}</span></div>`,
              )
              .join("")}</div>`
          : "—";
      }

      function opportunitySupportsHtml(item) {
        const rows = item.supports
          .map(
            (support) =>
              `<tr><td>${support.id}</td><td>${support.assignee}</td><td>${support.deadline}</td><td>${support.content}</td><td>${salesStageTag(support.status)}</td><td>${support.overdue ? '<span class="tag red">已超时</span>' : "—"}</td><td>${support.delivery || "—"}</td><td>${supportHistoryHtml(support)}</td><td>${supportStatusAction(item, support)}</td></tr>`,
          )
          .join("");
        const action =
          salesCanProgress(item) && item.stage !== "落选"
            ? '<div class="sales-tab-toolbar"><button class="btn btn-primary" type="button" data-sales-support-add>发起支撑</button></div>'
            : "";
        return `${action}<div class="table-wrap"><table style="min-width:1420px"><thead><tr><th>请求编号</th><th>支撑人员</th><th>回应时限</th><th>支撑需求</th><th>状态</th><th>首次回应超时</th><th>交付说明/附件</th><th>操作历史</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="9"><div class="empty">暂无方案支撑请求</div></td></tr>'}</tbody></table></div>`;
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
          .join("") || '<tr><td colspan="5"><div class="empty">暂无改派记录</div></td></tr>'}</tbody></table></div><div class="section-title sales-history-subtitle">基本信息变更历史</div><div class="table-wrap"><table><thead><tr><th>变更时间</th><th>字段</th><th>变更前</th><th>变更后</th><th>操作人</th></tr></thead><tbody>${item.editHistories.slice().reverse().map((record) => `<tr><td>${record.time}</td><td>${record.field}</td><td>${record.before}</td><td>${record.after}</td><td>${record.operator}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">暂无编辑记录</div></td></tr>'}</tbody></table></div>`;
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
            "",
            `<button class="btn" id="backToOpportunities">返回列表</button>${canOperate ? '<button class="btn" data-sales-edit>编辑</button>' : ""}${salesCanReassign(item) && item.stage !== "落选" ? '<button class="btn" data-sales-reassign>改派负责人</button>' : ""}${canOperate ? '<button class="btn btn-primary" data-sales-stage-open>推进阶段</button>' : ""}`,
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

      function salesSupportPeoplePickerHtml(id) {
        const options = salesSupportCandidates()
          .map(
            (employee) =>
              `<label class="multi-select-option" data-sales-support-option><input type="checkbox" data-sales-support-person value="${escapeHtml(employee.name)}"><span>${escapeHtml(employee.name)}</span></label>`,
          )
          .join("");
        return (
          `<div class="sales-support-picker" id="${id}" data-sales-support-picker>` +
          '<div class="multi-select sales-support-select">' +
          '<button class="multi-select-trigger" type="button" data-sales-support-trigger aria-haspopup="listbox" aria-expanded="false"><span>搜索并选择支撑人员</span><span aria-hidden="true">⌄</span></button>' +
          '<div class="multi-select-menu hidden" data-sales-support-menu><input class="input" type="search" data-sales-support-search placeholder="搜索支撑人员" aria-label="搜索支撑人员"><div data-sales-support-options>' +
          options +
          '</div></div></div><div class="sales-support-selected-list" data-sales-support-selected aria-live="polite"></div></div>'
        );
      }

      function salesKeyPeoplePickerHtml(id, customerName = "", selected = []) {
        const people = customerName
          ? contacts.filter(
              (person) =>
                person.company === customerName && contactIsActive(person),
            )
          : [];
        const options = people
          .map(
            (person) =>
              `<label class="multi-select-option" data-sales-key-option><input type="checkbox" data-sales-key-person value="${escapeHtml(person.name)}" ${selected.includes(person.name) ? "checked" : ""}><span>${escapeHtml(person.name)} · ${escapeHtml(person.department || "部门未维护")}</span></label>`,
          )
          .join("");
        return (
          `<div class="sales-support-picker sales-key-people-picker" id="${id}" data-sales-key-picker data-customer="${escapeHtml(customerName)}">` +
          '<div class="multi-select sales-support-select">' +
          `<button class="multi-select-trigger" type="button" data-sales-key-trigger aria-haspopup="listbox" aria-expanded="false" ${people.length ? "" : "disabled"}><span>${customerName ? people.length ? "搜索并选择商机关键人" : "该客户暂无有效关键人" : "请先选择客户单位"}</span><span aria-hidden="true">⌄</span></button>` +
          `<div class="multi-select-menu hidden" data-sales-key-menu><input class="input" type="search" data-sales-key-search placeholder="搜索商机关键人" aria-label="搜索商机关键人"><div data-sales-key-options>${options}</div></div></div>` +
          '<div class="sales-support-selected-list" data-sales-key-selected aria-live="polite"></div></div>'
        );
      }

      function renderOpportunityCreate() {
        if (!salesCanCreate()) return forbiddenPage("新建商机", "当前账号没有创建商机权限。");
        const customerOptions = salesVisibleCustomers()
          .map(
            (item) =>
              `<option value="${item.name}">${item.name}</option>`,
          )
          .join("");
        const typeOptions = SALES_TYPES.map(
          (item) => `<option value="${item}">${item}</option>`,
        ).join("");
        const priorityOptions = SALES_PRIORITIES.map(
          (item) => `<option value="${item}">${item}</option>`,
        ).join("");
        const formFields = [
          salesFormField("salesName", "商机名称", '<input class="input" id="salesName" maxlength="100">', true),
          salesFormField("salesType", "商机类型", `<select class="input" id="salesType"><option value="">请选择商机类型</option>${typeOptions}</select>`, true),
          salesFormField("salesAmount", "预估金额（含税，元）", '<input class="input" id="salesAmount" type="number" min="0" step="0.01">', true),
          salesFormField("salesPriority", "优先级", `<select class="input" id="salesPriority"><option value="">请选择优先级</option>${priorityOptions}</select>`, true),
          salesFormField("salesCustomer", "客户单位", `<select class="input" id="salesCustomer"><option value="">请选择客户单位</option>${customerOptions}</select>`, true),
          salesFormField("salesCustomerFacts", "客户关联信息", '<div class="input sales-readonly" id="salesCustomerFacts">请选择客户单位</div>'),
          salesFormField("salesKeyPeople", "商机关键人", salesKeyPeoplePickerHtml("salesKeyPeoplePicker"), true),
          salesFormField("salesExpectedDate", "预计成交日期", '<input class="input" id="salesExpectedDate" type="date">', true),
          salesFormField("salesOwner", "商机负责人", '<div class="input sales-readonly" id="salesOwner" data-owner="">选择客户后自动匹配</div>', true),
          salesFormField("salesFirstFollow", "首次跟进日期", `<input class="input" id="salesFirstFollow" type="date" min="${salesNextBusinessDate()}">`, true),
          salesFormField("salesRequirement", "商机需求描述", '<textarea class="input" id="salesRequirement" rows="4" maxlength="1000"></textarea>', true, true),
          salesFormField("salesCreateSupport", "同时创建方案支撑", '<select class="input" id="salesCreateSupport"><option value="否">否</option><option value="是">是</option></select>', true),
          `<div class="form-group" id="salesSupportPeopleGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label>${salesSupportPeoplePickerHtml("salesSupportPeoplePicker")}<div class="field-error" id="err-salesSupportPeople"></div></div>`,
          '<div class="form-group full" id="salesSupportRequirementGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑需求</label><textarea class="input" id="salesSupportRequirement" rows="3" maxlength="500"></textarea><div class="field-error" id="err-salesSupportRequirement"></div></div>',
          `<div class="form-group" id="salesSupportDeadlineGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>回应时限</label><input class="input" id="salesSupportDeadline" type="datetime-local" value="${addDays(DEMO_TODAY, 2)}T12:00"><div class="field-error" id="err-salesSupportDeadline"></div></div>`,
        ].join("");
        return (
          pageHead("新建商机", "保存后生成永久商机编号和首条阶段记录。") +
          `<section class="panel sales-form-panel"><form id="opportunityCreateForm"><div class="panel-body sales-form-grid">${formFields}</div><div class="panel-foot sales-form-footer"><button class="btn" type="button" id="cancelOpportunityCreate">取消</button><button class="btn btn-primary" type="submit">保存商机</button></div></form></section>`
        );
      }
