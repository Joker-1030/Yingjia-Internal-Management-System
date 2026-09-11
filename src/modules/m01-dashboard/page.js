      function dashboardMetric(label, value, foot, tone) {
        return `<div class="metric dashboard-metric ${tone || ""}"><span class="metric-label">${label}</span><span class="metric-value">${value}</span><span class="metric-foot">${foot}</span></div>`;
      }

      function dashboardPercent(value) {
        return value == null || !Number.isFinite(Number(value))
          ? "--"
          : `${Number(value).toFixed(1)}%`;
      }

      function escapeDashboardHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function dashboardTaskNumbers(rows = scopedTasks()) {
        return taskSummaryNumbers(
          rows.filter(
            (task) =>
              task.status !== "cancelled" &&
              task.type !== "关键人覆盖 KPI",
          ),
        );
      }

      function dashboardPeriodMeta(period = dashboardComparisonPeriod) {
        const [year, month] = DEMO_TODAY.split("-").map(Number);
        const startMonth =
          period === "year"
            ? 1
            : period === "quarter"
              ? Math.floor((month - 1) / 3) * 3 + 1
              : month;
        return {
          key: period,
          label: { month: "本月", quarter: "本季度", year: "本年" }[period],
          start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
          end: DEMO_TODAY,
        };
      }

      function dashboardDuePeriodRows(
        rows,
        period = dashboardComparisonPeriod,
      ) {
        const { start, end } = dashboardPeriodMeta(period);
        return rows.filter(
          (task) =>
            task.status !== "cancelled" &&
            task.due >= start &&
            task.due <= end,
        );
      }

      function dashboardPeriodControl() {
        return `<div class="tabs dashboard-period-tabs" aria-label="执行统计周期">${[
          ["month", "本月"],
          ["quarter", "本季度"],
          ["year", "本年"],
        ]
          .map(
            ([value, label]) =>
              `<button class="tab ${dashboardComparisonPeriod === value ? "active" : ""}" type="button" data-dashboard-period="${value}">${label}</button>`,
          )
          .join("")}</div>`;
      }

      function dashboardHealthRate(people = scopedContacts(), rows = scopedTasks()) {
        if (!people.length) return null;
        const overdueContacts = new Set(
          rows
            .filter(taskIsHealthRisk)
            .map((task) => `${task.company}:${task.person}`),
        );
        return Number(
          (
            (people.filter(
              (person) => !overdueContacts.has(`${person.company}:${person.name}`),
            ).length /
              people.length) *
            100
          ).toFixed(1),
        );
      }

      function dashboardCoverageRate(companies, people) {
        if (!companies.length) return null;
        return Number(
          (
            (companies.filter((company) =>
              people.some((person) => person.company === company.name),
            ).length /
              companies.length) *
            100
          ).toFixed(1),
        );
      }



      function taskBusinessMonth(task, kind) {
        if (kind === "done") {
          const record = taskRecord(task);
          return (task.completedAt || record?.date || task.due || "").slice(0, 7);
        }
        return (task.firstOverdueAt || task.due || "").slice(0, 7);
      }

      function dashboardTrend(rows) {
        const [year, currentMonth] = DEMO_TODAY.split("-").map(Number);
        return Array.from({ length: 6 }, (_, index) => {
          const date = new Date(year, currentMonth - 1 - (5 - index), 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          return {
            key,
            label: `${date.getMonth() + 1}月`,
            done: rows.filter(
              (task) => task.status === "done" && taskBusinessMonth(task, "done") === key,
            ).length,
            overdue: rows.filter(
              (task) =>
                task.everOverdue && taskBusinessMonth(task, "overdue") === key,
            ).length,
          };
        });
      }

      function dashboardTrendHtml(rows) {
        const data = dashboardTrend(rows);
        const maxValue = Math.max(...data.flatMap((item) => [item.done, item.overdue]), 1);
        return `<div class="chart">${data
          .map(
            (item) =>
              `<div class="dashboard-chart-month"><div class="dashboard-chart-bars"><div class="dashboard-chart-bar" style="--bar-height:${Math.max((item.done / maxValue) * 100, item.done ? 8 : 2)}%"><span class="dashboard-chart-value">${item.done}</span><span class="bar" style="height:var(--bar-height)"></span></div><div class="dashboard-chart-bar" style="--bar-height:${Math.max((item.overdue / maxValue) * 100, item.overdue ? 8 : 2)}%"><span class="dashboard-chart-value">${item.overdue}</span><span class="bar alt" style="height:var(--bar-height)"></span></div></div><span class="bar-label">${item.label}</span></div>`,
          )
          .join("")}</div><div class="legend"><span><i></i>完成事件</span><span><i class="alt"></i>首次逾期事件</span></div>`;
      }

      function dashboardScopeRows() {
        const companies = scopedCustomers();
        const people = scopedContacts();
        const rows = scopedTasks();
        let groups;
        if (currentUser.role === "pm") {
          groups = assignedCitiesForCurrentUser().map((city) => ({
            name: city,
            type: "city",
            value: city,
          }));
        } else if (currentUser.role === "director") {
          groups = [...new Set(companies.map((company) => company.city || "省公司"))]
            .sort()
            .map((city) => ({ name: city, type: "city", value: city }));
        } else {
          groups = [...new Set(companies.map(customerRegionScope))]
            .sort()
            .map((region) => ({ name: region, type: "region", value: region }));
        }
        return groups.map((group) => {
          const localCompanies = companies.filter((company) =>
            group.type === "region"
              ? regionsMatch(customerRegionScope(company), group.value)
              : group.value === "省公司"
                ? !company.city
                : company.city === group.value,
          );
          const companyNames = new Set(localCompanies.map((company) => company.name));
          const localPeople = people.filter((person) => companyNames.has(person.company));
          const localTasks = rows.filter((task) => companyNames.has(task.company));
          const periodNumbers = dashboardTaskNumbers(
            dashboardDuePeriodRows(localTasks),
          );
          const currentNumbers = dashboardTaskNumbers(localTasks);
          return {
            ...group,
            companies: localCompanies.length,
            people: localPeople.length,
            coverage: dashboardCoverageRate(localCompanies, localPeople),
            health: dashboardHealthRate(localPeople, localTasks),
            onTimeRate: periodNumbers.onTimeRate,
            overdue: currentNumbers.overdue,
          };
        });
      }

      function dashboardScopeTable() {
        const rows = dashboardScopeRows();
        const period = dashboardPeriodMeta();
        const title = currentUser.role === "pm" ? "我的地市分布" : currentUser.role === "director" ? "地市客户经营对比" : "区域客户经营对比";
        return `<section class="panel"><div class="panel-head"><div><div class="panel-title">${title}</div><div class="panel-sub">资产指标为当前快照；完成率统计 ${period.start} 至 ${period.end} 已到期任务</div></div><div class="spacer"></div>${dashboardPeriodControl()}</div><div class="table-wrap"><table class="dashboard-scope-table"><thead><tr><th>范围</th><th>当前客户</th><th>当前关键人</th><th>当前覆盖率</th><th>当前健康率</th><th>${period.label}按期完成率</th><th>当前逾期</th></tr></thead><tbody>${rows
          .map(
            (row) =>
              `<tr><td><strong>${row.name}</strong></td><td>${row.companies}</td><td>${row.people}</td><td>${dashboardPercent(row.coverage)}</td><td>${dashboardPercent(row.health)}</td><td><strong>${dashboardPercent(row.onTimeRate)}</strong><div class="progress"><i style="width:${row.onTimeRate || 0}%"></i></div></td><td><span class="tag ${row.overdue ? "red" : "green"}">${row.overdue}</span></td></tr>`,
          )
          .join("") || '<tr><td colspan="7"><div class="empty">当前范围暂无经营数据</div></td></tr>'}</tbody></table></div></section>`;
      }

      function dashboardPmTable() {
        const rows = scopedTasks();
        const period = dashboardPeriodMeta();
        const pmNames = [...new Set(rows.map((task) => task.pm).filter(Boolean))].sort();
        return `<section class="panel"><div class="panel-head"><div><div class="panel-title">责任人执行对比</div><div class="panel-sub">PM 执行市/区县任务，区域总监执行省公司任务；${period.start} 至 ${period.end} 已到期</div></div><div class="spacer"></div>${dashboardPeriodControl()}</div><div class="table-wrap"><table><thead><tr><th>责任人（PM / 区域总监）</th><th>${period.label}应到期</th><th>${period.label}已完成</th><th>${period.label}总完成率</th><th>${period.label}按期完成率</th><th>当前逾期</th></tr></thead><tbody>${pmNames
          .map((pm) => {
            const pmRows = rows.filter((task) => task.pm === pm);
            const periodNumbers = dashboardTaskNumbers(
              dashboardDuePeriodRows(pmRows),
            );
            const currentNumbers = dashboardTaskNumbers(pmRows);
            return `<tr><td><strong>${pm}</strong></td><td>${periodNumbers.total}</td><td>${periodNumbers.done}</td><td>${dashboardPercent(periodNumbers.rate)}</td><td><strong>${dashboardPercent(periodNumbers.onTimeRate)}</strong></td><td><span class="tag ${currentNumbers.overdue ? "red" : "green"}">${currentNumbers.overdue}</span></td></tr>`;
          })
          .join("") || '<tr><td colspan="6"><div class="empty">当前范围暂无责任人执行数据</div></td></tr>'}</tbody></table></div></section>`;
      }

      function dashboardTodoItems() {
        const rows = scopedTasks();
        const canOwnTaskTodo = ["pm", "director"].includes(currentUser.role);
        const taskItems = (canOwnTaskTodo ? rows : [])
          .filter(
            (task) =>
              task.pm === currentUser.name &&
              ["overdue", "pending"].includes(task.status),
          )
          .sort((a, b) => {
            const priority = (task) =>
              ["overdue", "expired"].includes(task.status)
                ? 0
                : task.due === DEMO_TODAY
                  ? 1
                  : 2;
            return priority(a) - priority(b) || a.due.localeCompare(b.due);
          })
          .slice(0, currentUser.role === "pm" ? 5 : 3)
          .map((task) => ({
            icon: "任",
            title: taskStatusName(task.status, task),
            detail: `${task.title} · ${task.company} · 截止 ${task.due}`,
            tone: ["overdue", "expired"].includes(task.status) ? "red" : "yellow",
            action: "task-detail",
            id: task.id,
            command: currentUser.role === "pm" && task.status !== "expired" ? "处理" : "查看",
          }));
        const projectItems = projectActionTodoItemsForCurrentUser();
        const items =
          currentUser.role === "pm"
            ? [...projectItems, ...taskItems]
            : [...projectItems, ...taskItems];
        return items;
      }

      function dashboardDynamicItems() {
        const rows = scopedTasks();
        const items = [];
        const visibleCampaigns = campaigns
          .map((campaign) => {
            const campaignRows = rows.filter(
              (task) =>
                task.campaignId === campaign.id && task.status !== "cancelled",
            );
            const isCoverage = campaign.category === "关键人覆盖 KPI";
            const total = campaignRows.length;
            const done = campaignRows.filter(
              (task) => task.status === "done",
            ).length;
            return {
              campaign,
              isCoverage,
              total,
              done,
              rate: total ? Number(((done / total) * 100).toFixed(1)) : null,
              numbers: isCoverage
                ? null
                : dashboardTaskNumbers(campaignRows),
            };
          })
          .filter((item) => {
            if (!item.total || item.campaign.startDate > DEMO_TODAY)
              return false;
            const totalDays = Math.max(
              dayDiff(item.campaign.startDate, item.campaign.endDate),
              1,
            );
            const elapsed = Math.min(
              dayDiff(item.campaign.startDate, DEMO_TODAY) / totalDays,
              1,
            );
            const rate = item.done / item.total;
            const daysLeft = dayDiff(DEMO_TODAY, item.campaign.endDate);
            return (elapsed > 0.5 && rate < 0.5) || (daysLeft <= 3 && rate < 0.8);
          })
          .slice(0, 2);
        visibleCampaigns.forEach((item) =>
          items.push({
            icon: "专",
            title: "专项动态",
            detail: item.isCoverage
              ? `${item.campaign.name} · 覆盖 KPI 达标率 ${dashboardPercent(item.rate)} · ${item.done}/${item.total} 名有效责任人已达标`
              : `${item.campaign.name} · 专项维系总完成率 ${dashboardPercent(item.numbers.rate)} · ${item.numbers.done}/${item.numbers.total} 条有效执行项已完成`,
            tone: "red",
            action: "campaign-detail",
            id: item.campaign.id,
          }),
        );
        const riskCompanies = scopedCustomers().filter((company) => customerHealth(company) === "逾期").length;
        if (riskCompanies)
          items.push({ icon: "险", title: "客户风险", detail: `当前 ${riskCompanies} 家客户存在三类维系逾期风险，不含暂停任务`, tone: "red", nav: "tasks", group: "risk" });
        return items.slice(0, 10);
      }

      function dashboardList(items, emptyText) {
        return items.length
          ? items
              .map((item) => {
                const attrs = item.projectId
                  ? `data-project-open="${escapeDashboardHtml(item.projectId)}"`
                  : item.nav
                    ? `data-dashboard-nav="${escapeDashboardHtml(item.nav)}" data-task-view="mine" data-task-group="${escapeDashboardHtml(item.group || "")}"`
                    : `data-action="${escapeDashboardHtml(item.action)}" data-id="${escapeDashboardHtml(item.id)}"`;
                return `<button class="list-row action-row" type="button" ${attrs}><div class="avatar">${escapeDashboardHtml(item.icon)}</div><div class="list-main"><div class="list-title">${escapeDashboardHtml(item.title)}</div><div class="list-sub">${escapeDashboardHtml(item.detail)}</div></div><span class="tag ${escapeDashboardHtml(item.tone)}">${escapeDashboardHtml(item.command || "查看")}</span></button>`;
              })
              .join("")
          : `<div class="empty">${emptyText}</div>`;
      }

      function dashboardPmActionGroups(rows) {
        const groups = [
          { title: "当前逾期", tone: "red", filter: (task) => task.status === "overdue", group: "overdue" },
          { title: "已过期未完成", tone: "red", filter: (task) => task.status === "expired", group: "expired" },
          { title: "今日到期", tone: "orange", filter: (task) => task.status === "pending" && task.due === DEMO_TODAY, group: "today" },
          { title: "未来 7 天", tone: "yellow", filter: (task) => task.status === "pending" && task.due > DEMO_TODAY && task.due <= addDays(DEMO_TODAY, 7), group: "next7" },
          { title: "生日 / 节日", tone: "green", filter: (task) => ["生日关怀", "节假日关怀"].includes(task.type) && !["done", "cancelled"].includes(task.status), type: "care" },
          { title: "专项维系", tone: "blue", filter: (task) => task.type === "专项维系" && !["done", "cancelled"].includes(task.status), type: "专项维系" },
          { title: "覆盖 KPI", tone: "orange", filter: (task) => task.type === "关键人覆盖 KPI" && !["done", "cancelled"].includes(task.status), type: "关键人覆盖 KPI" },
        ];
        return `<section class="panel"><div class="panel-head"><div class="panel-title">行动分类</div><div class="panel-sub">按处理优先级进入对应执行明细</div></div><div class="panel-body list dashboard-list">${groups
          .map((group) => {
            const count = rows.filter(group.filter).length;
            return `<button class="list-row action-row" type="button" data-dashboard-nav="tasks" data-task-view="mine" ${group.group ? `data-task-group="${group.group}"` : ""} ${group.type ? `data-task-type="${group.type}"` : ""}><div class="avatar">${count}</div><div class="list-main"><div class="list-title">${group.title}</div><div class="list-sub">${count ? `有 ${count} 项需要查看或处理` : "当前没有相关事项"}</div></div><span class="tag ${group.tone}">进入</span></button>`;
          })
          .join("")}</div></section>`;
      }

      // M01 consumes current responsibility; it does not widen source-page access.
      function dashboardManagedRegions() {
        const employee = employees.find((item) => item.code === currentUser?.employeeCode);
        if (!employee || employee.status !== "在职") return [];
        const ids = new Set(departmentsManagedBy(employee.code)
          .filter((department) => department.type === "region")
          .map((department) => department.regionId));
        return regionsData.filter((region) => ids.has(region.id));
      }

      function dashboardBusinessRows() {
        if (currentScopeType() !== "regions")
          return { companies: scopedCustomers(), people: scopedContacts(), rows: scopedTasks() };
        const regions = dashboardManagedRegions();
        const inRegion = (company) => company && regions.some((region) =>
          regionsMatch(customerRegionScope(company), regionScopeName(region)));
        const companies = hasDataObject("客户单位")
          ? customers.filter((company) => !company.archived && inRegion(company)) : [];
        const visibleCompanyNames = new Set(companies.map((company) => company.name));
        const people = hasDataObject("关键人")
          ? contacts.filter((person) => contactIsActive(person) && visibleCompanyNames.has(person.company)) : [];
        const rows = hasDataObject("维系任务") ? tasks.filter((task) => {
          const company = customers.find((item) => item.name === task.company);
          const person = contacts.find((item) => item.name === task.person && item.company === task.company);
          return company && !company.archived && inRegion(company) && (!person || contactIsActive(person));
        }) : [];
        return { companies, people, rows };
      }

      function dashboardProjectSummary() {
        if (!hasPermission("projects")) return null;
        normalizeAllProjectLifecycles();
        const regions = currentUser.role === "director" ? dashboardManagedRegions() : [];
        const visible = projects.filter((project) => {
          if (!projectCustomerFacts(project)) return false;
          if (currentUser.role === "director" && !currentUser.fullAccess)
            return regions.some((region) => regionsMatch(projectRegionScope(project), regionScopeName(region)));
          return projectIsVisibleToCurrentUser(project);
        });
        if (visible.some((project) => !PROJECT_STAGES.includes(project.stage))) return null;
        return { projects: visible, total: visible.length, stages: PROJECT_STAGES.map((stage) => ({
          stage, count: visible.filter((project) => project.stage === stage).length,
        })) };
      }

      let dashboardProjectDimension = "stage";
      let dashboardProjectMeasure = "count";
      let dashboardProjectTypeFilter = "";

      function dashboardProjectAnalysis(summary, dimension = dashboardProjectDimension, measure = dashboardProjectMeasure, typeFilter = dashboardProjectTypeFilter) {
        if (!["", ...PROJECT_TYPES].includes(typeFilter)) return null;
        if (!summary || !["stage", "type"].includes(dimension) || !["count", "amount"].includes(measure)) return null;
        const selected = summary.projects.filter((project) => !typeFilter || project.type === typeFilter);
        const labels = dimension === "stage" ? PROJECT_STAGES : PROJECT_TYPES;
        if (selected.some((project) => !labels.includes(project[dimension]))) return null;
        const values = selected.map((project) => {
          if (measure === "count") return 1;
          if (project.amount == null || String(project.amount).trim() === "") return NaN;
          const amount = Number(project.amount);
          return Number.isFinite(amount) && amount >= 0 && Number.isSafeInteger(Math.round(amount * 100)) ? Math.round(amount * 100) : NaN;
        });
        const total = values.reduce((sum, value) => sum + value, 0);
        if (!Number.isSafeInteger(total)) return null;
        return { total, measure, projectCount: selected.length, groups: labels.map((label) => {
          const value = values.reduce((sum, amount, index) => sum + (selected[index][dimension] === label ? amount : 0), 0);
          return { label, value, share: total ? value / total * 100 : null };
        }) };
      }

      function dashboardProjectChart(summary) {
        const analysis = dashboardProjectAnalysis(summary);
        if (!analysis) return '<div class="empty">项目数据暂不可用</div>';
        const money = analysis.measure === "amount";
        const format = (value) => money ? formatProjectMoney(value / 100) : String(value);
        const colors = ["#7596b5", "#366895", "#68a6a0", "#457c68", "#c3ccd6", "#b69b89"];
        // Render a disposable SVG snapshot; no hidden selection, drilldown or canvas lifecycle.
        const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width: 220, height: 220 });
        let svg;
        try {
          chart.setOption({
            animation: false,
            color: colors,
            series: [{
              type: "pie", radius: ["76%", "94%"], center: ["50%", "50%"],
              silent: true, selectedMode: false, stillShowZeroSum: false,
              label: { show: false }, labelLine: { show: false },
              emphasis: { disabled: true },
              itemStyle: { borderRadius: 4, borderWidth: 3, borderColor: "#ffffff" },
              data: analysis.total ? analysis.groups.map((item) => ({ name: item.label, value: item.value })) : [],
              emptyCircleStyle: { color: "#edf1f5", borderWidth: 0 },
            }],
          });
          svg = chart.renderToSVGString();
        } finally { chart.dispose(); }
        return `<div class="workbench-project-chart"><div class="workbench-donut"><div class="workbench-chart-svg" aria-hidden="true">${svg}</div><div class="workbench-donut-center${money ? " workbench-money" : ""}"><span>${money ? "项目金额合计" : "项目总数（个）"}</span><strong data-dashboard-value="projects">${format(analysis.total)}</strong>${money ? "<small>含税，元</small>" : ""}${analysis.projectCount ? "" : "<small>暂无项目</small>"}</div></div><div class="workbench-project-detail" tabindex="0" role="region" aria-label="项目分组明细"><div class="workbench-legend-head"><span>${dashboardProjectDimension === "type" ? "类型" : "阶段"}</span><span>${money ? "金额（含税，元）" : "数量（个）"}</span><span>占比</span></div><ul class="workbench-stage-legend">${analysis.groups.map((item, index) => `<li><span class="workbench-group-name"><i aria-hidden="true" style="background:${colors[index]}"></i>${escapeDashboardHtml(item.label)}</span><strong>${format(item.value)}</strong><span class="workbench-share">${dashboardPercent(item.share)}</span></li>`).join("")}</ul></div></div>`;
      }

      function dashboardProjectControls() {
        const select = (key, value, label, options) => '<label>' + label + '<select class="input" aria-label="' + label + '" data-workbench-project="' + key + '">' + options.map(([id, name]) => '<option value="' + id + '"' + (value === id ? ' selected' : '') + '>' + name + '</option>').join('') + '</select></label>';
        return '<div class="workbench-analysis-controls">' + select('typeFilter', dashboardProjectTypeFilter, '项目类型', [['','全部'], ...PROJECT_TYPES.map((type) => [type, type])]) + select('dimension', dashboardProjectDimension, '分析维度', [['stage','项目阶段'],['type','项目类型']]) + select('measure', dashboardProjectMeasure, '统计指标', [['count','项目数量'],['amount','项目金额（含税，元）']]) + '</div>';
      }

      function handleWorkbenchProjectChange(target) {
        if (!currentUser || currentPage !== "dashboard" || !canAccessPage("dashboard") || !hasPermission("projects")) return;
        if (target.dataset.workbenchProject === "dimension" && ["stage", "type"].includes(target.value)) dashboardProjectDimension = target.value;
        else if (target.dataset.workbenchProject === "measure" && ["count", "amount"].includes(target.value)) dashboardProjectMeasure = target.value;
        else if (target.dataset.workbenchProject === "typeFilter" && ["", ...PROJECT_TYPES].includes(target.value)) dashboardProjectTypeFilter = target.value;
        else return;
        const host = document.querySelector("#workbenchProjectVisualization");
        if (host) host.innerHTML = dashboardProjectChart(dashboardProjectSummary());
      }
      document.addEventListener("change", (event) => {
        if (event.target?.matches?.("[data-workbench-project]")) handleWorkbenchProjectChange(event.target);
      });

      function dashboardCoverageGroups(companies, people) {
        const group = (label, selected) => {
          const names = new Set(selected.map((company) => company.name));
          const contactsInGroup = people.filter((person) => names.has(person.company));
          return { label, people: contactsInGroup.length, rate: dashboardCoverageRate(selected, contactsInGroup) };
        };
        if (currentUser.role === "director") return employees
          .filter((employee) => employee.status === "在职" && employeeHasRole(employee, "PM"))
          .slice().sort((a, b) => a.name.localeCompare(b.name, "zh-CN") || a.code.localeCompare(b.code))
          .map((employee) => ({ employee, selected: companies.filter((company) => company.level !== "省公司" && customerOwnerName(company) === employee.name) }))
          .filter((item) => item.selected.length)
          .map((item) => group(item.employee.name, item.selected));
        if (!["president", "vp", "admin"].includes(currentUser.role)) return [];
        return organizationDepartments.filter((department) => department.type === "region" && department.status === "启用")
          .slice().sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN") || String(a.id).localeCompare(String(b.id)))
          .map((department) => regionsData.find((region) => region.id === department.regionId)).filter(Boolean)
          .map((region) => group(regionScopeName(region), companies.filter((company) => regionsMatch(customerRegionScope(company), regionScopeName(region)))));
      }

      function dashboardCoverageTable(companies, people) {
        if (currentUser.role === "pm") {
          const covered = new Set(people.map((person) => person.company));
          const uncovered = companies.filter((company) => !covered.has(company.name));
          const emptyText = companies.length ? "当前客户公司均已覆盖" : "暂无客户公司";
          return `<div class="workbench-breakdown" tabindex="0" role="region" aria-label="未覆盖客户公司"><table><thead><tr><th>未覆盖客户公司</th></tr></thead><tbody>${uncovered.map((company) => `<tr><td>${escapeDashboardHtml(company.name)}</td></tr>`).join("")}</tbody></table>${uncovered.length ? "" : `<div class="empty">${emptyText}</div>`}</div>`;
        }
        if (!["president", "vp", "director", "admin"].includes(currentUser.role)) return "";
        const groups = dashboardCoverageGroups(companies, people);
        return '<div class="workbench-breakdown" tabindex="0" role="region" aria-label="关键人覆盖明细"><table><thead><tr><th>' + (currentUser.role === "director" ? 'PM' : '区域运营中心') + '</th><th>关键人</th><th>覆盖率</th></tr></thead><tbody>' + groups.map((item) => '<tr><td>' + escapeDashboardHtml(item.label) + '</td><td>' + item.people + '</td><td>' + dashboardPercent(item.rate) + '</td></tr>').join('') + '</tbody></table>' + (groups.length ? '' : '<div class="empty">暂无PM客户覆盖数据</div>') + '</div>';
      }

      function dashboardCampaignProgress(rows) {
        return campaigns.filter((campaign) => ["专项维系", "关键人覆盖 KPI"].includes(campaign.category) && rows.some((task) => task.campaignId === campaign.id))
          .map((campaign) => {
            const valid = rows.filter((task) => task.campaignId === campaign.id && ["pending", "paused", "overdue", "expired", "done"].includes(task.status));
            const done = valid.filter((task) => task.status === "done").length;
            return { name: campaign.name, state: taskThemeStatus(campaign), done, total: valid.length, rate: valid.length ? done / valid.length * 100 : null };
          });
      }

      function dashboardCampaignTable(rows) {
        const progress = dashboardCampaignProgress(rows);
        return '<div class="workbench-breakdown" tabindex="0" role="region" aria-label="专项任务进度"><table><thead><tr><th>专项任务</th><th>状态</th><th>完成进度</th></tr></thead><tbody>' + progress.map((item) => '<tr><td>' + escapeDashboardHtml(item.name) + '</td><td>' + escapeDashboardHtml(item.state) + '</td><td><div class="workbench-progress"><strong>' + dashboardPercent(item.rate) + '</strong><progress max="100" value="' + (item.rate || 0) + '" aria-label="' + escapeDashboardHtml(item.name) + '完成进度"></progress></div></td></tr>').join('') + '</tbody></table>' + (progress.length ? '' : '<div class="empty">暂无专项任务</div>') + '</div>';
      }

      function dashboardOverviewValue(label, value, key, suffix = "") {
        return `<div class="workbench-value"><span>${label}</span><strong data-dashboard-value="${key}">${value}${suffix ? `<small>${suffix}</small>` : ""}</strong></div>`;
      }

      function dashboardOverviewTodos() {
        // Keep existing collection/ordering; this task only simplifies presentation.
        const items = dashboardTodoItems().filter((item) =>
          item.projectId ? hasPermission("projects") : hasPermission("tasks"));
        return items.map((item) => {
          if (item.projectId) {
            const project = projectById(item.projectId);
            return { ...item, title: project?.name || item.title, detail: item.title, command: "查看" };
          }
          const task = tasks.find((row) => row.id === item.id);
          return task ? { ...item, title: `${task.company} · ${task.person}`,
            detail: `${task.title} · ${taskStatusName(task.status, task)} · 截止 ${task.due}` } : item;
        });
      }

      function renderDashboard() {
        if (!currentUser || !canAccessPage("dashboard") || ["hr", "support"].includes(currentUser.role)) return "";
        if (currentUser.role === "admin" && adminDashboardView === "system")
          return renderAdminDashboard();
        const { companies, people, rows } = dashboardBusinessRows();
        const coverage = dashboardCoverageRate(companies, people);
        const regular = rows.filter((task) => task.type === "常规维系");
        const pending = regular.filter((task) => ["pending", "paused"].includes(task.status)).length;
        const overdue = regular.filter((task) => task.status === "overdue").length;
        const canSeePeople = hasDataObject("客户单位") && hasDataObject("关键人");
        const canSeeTasks = hasPermission("tasks") && hasDataObject("维系任务");
        const peopleCard = canSeePeople ? `<section class="panel workbench-card workbench-people"><div class="panel-head"><div class="panel-title" id="workbenchPeopleTitle">关键人概况</div><div class="spacer"></div><span class="workbench-updated">更新于 ${escapeDashboardHtml(DEMO_TODAY)}</span></div><div class="workbench-split" role="region" aria-labelledby="workbenchPeopleTitle"><div class="workbench-values">${dashboardOverviewValue("有效关键人", people.length, "people", "人")}${dashboardOverviewValue("关键人覆盖率", dashboardPercent(coverage), "coverage")}${coverage == null ? '<div class="workbench-empty-note">暂无客户单位</div>' : ""}</div>${dashboardCoverageTable(companies, people)}</div></section>` : "";
        const taskCard = canSeeTasks ? `<section class="panel workbench-card workbench-tasks"><div class="panel-head"><div class="panel-title" id="workbenchTasksTitle">任务概况</div></div><div class="workbench-split" role="region" aria-labelledby="workbenchTasksTitle"><div class="workbench-values">${dashboardOverviewValue("常规任务待完成", pending, "pending", "项")}${dashboardOverviewValue("常规任务逾期", overdue, "overdue", "项")}</div>${dashboardCampaignTable(rows)}</div></section>` : "";
        const projectCard = hasPermission("projects") ? `<section class="panel workbench-card workbench-projects"><div class="panel-head"><div class="panel-title" id="workbenchProjectsTitle">项目概况</div></div><div class="workbench-project-body" role="region" aria-labelledby="workbenchProjectsTitle">${dashboardProjectControls()}<div class="workbench-project-visualization" id="workbenchProjectVisualization">${dashboardProjectChart(dashboardProjectSummary())}</div></div></section>` : "";
        const todoCard = `<section class="panel workbench-card workbench-todos"><div class="panel-head"><div class="panel-title" id="workbenchTodosTitle">我的待办</div></div><div class="workbench-scroll list dashboard-list" tabindex="0" role="region" aria-labelledby="workbenchTodosTitle">${dashboardList(dashboardOverviewTodos(), "当前没有需要本人处理的事项")}</div></section>`;
        return pageHead("工作台", "查看关键人、任务与项目概况，安排待办事项。",
          currentUser.role === "admin" ? '<button class="btn" type="button" data-admin-dashboard-view="system">系统运行</button>' : "") +
          `<div class="workbench">${peopleCard}${taskCard}<div class="workbench-bottom">${projectCard}${todoCard}</div></div>`;
      }

      function renderAdminDashboard() {
        const activeEmployees = employees.filter((employee) => employee.status === "在职");
        const currentMonth = DEMO_TODAY.slice(0, 7);
        const monthlyImports = importBatches.filter((batch) =>
          batch.createdAt?.startsWith(currentMonth),
        );
        const failedImports = importBatches.filter(
          (batch) => batch.errors > 0 && !["全部成功", "部分成功"].includes(batch.status),
        );
        const retryJobs = platformJobs.filter((job) => job.status !== "成功");
        const adminTodos = [
          ...failedImports.map((batch) => ({ icon: "导", title: "导入数据待处理", detail: `${batch.file} · ${batch.errors} 行错误 · ${batch.status}`, tone: "red", action: "import-detail", id: batch.id, command: "处理" })),
          ...retryJobs.map((job) => ({ icon: "作", title: "作业需要复核", detail: `${job.name} · ${job.status} · ${job.lastRun}`, tone: "yellow", nav: job.target, command: "查看" })),
        ];
        const adminDynamics = securityEvents.map((event) => ({
          icon: "安",
          title: event.title,
          detail: `${event.detail} · ${event.time}`,
          tone: "blue",
          action: event.employeeCode ? "employee-detail" : null,
          id: event.employeeCode ? employees.findIndex((employee) => employee.code === event.employeeCode) : null,
          nav: event.target,
        }));
        return (
          pageHead(
            "系统运行工作台",
            "查看账号、数据导入与通知运行情况。",
            '<button class="btn" type="button" data-dashboard-nav="employees">组织与员工</button><button class="btn" type="button" data-dashboard-nav="imports">数据导入</button><button class="btn btn-primary" type="button" data-admin-dashboard-view="business">全国客户经营</button>',
          ) +
          `<div class="role-note">当前为系统运行视图；admin 同时拥有公司全局客户、关键人、维系、项目和配置操作权限，业务操作均保留“系统管理员”真实身份。</div><div class="metrics dashboard-metrics">${dashboardMetric("在职账号", activeEmployees.length, "来自员工测试数据", "", "employees")}${dashboardMetric("停用账号", employees.filter((employee) => employee.status !== "在职").length, "按员工状态统计", "red", "employees", { "employee-status": "停用" })}${dashboardMetric("任务调度", `${platformJobs.filter((job) => job.status === "成功").length}/${platformJobs.length}`, "最近一次执行结果", "blue", "dashboard")}${dashboardMetric("待重试作业", retryJobs.length, "需要运维复核", "yellow", "dashboard")}${dashboardMetric("本月导入批次", monthlyImports.length, `${currentMonth} 创建`, "", "imports")}${dashboardMetric("当前待处理错误行", failedImports.reduce((sum, batch) => sum + batch.errors, 0), "仅未完成批次", "red", "imports")}</div><div class="dashboard-primary-grid"><section class="panel dashboard-todo-panel"><div class="panel-head"><div class="panel-title">运维待办</div><span class="tag red dashboard-panel-count">${adminTodos.length}</span></div><div class="panel-body list dashboard-list">${dashboardList(adminTodos, "当前没有运维待办")}</div></section><section class="panel dashboard-dynamic-panel"><div class="panel-head"><div class="panel-title">系统动态</div><span class="tag blue dashboard-panel-count">${adminDynamics.length}</span></div><div class="panel-body list dashboard-list">${dashboardList(adminDynamics, "当前没有系统动态")}</div></section></div><div class="dashboard-secondary-grid"><section class="panel"><div class="panel-head"><div class="panel-title">系统作业状态</div><div class="panel-sub">最近一次执行</div></div><div class="table-wrap"><table><thead><tr><th>作业</th><th>最近执行</th><th>耗时</th><th>结果</th></tr></thead><tbody>${platformJobs.map((job) => `<tr><td><strong>${job.name}</strong></td><td>${job.lastRun}</td><td>${job.duration}</td><td><span class="tag ${job.status === "成功" ? "green" : "yellow"}">${job.status}</span></td></tr>`).join("")}</tbody></table></div></section><section class="panel"><div class="panel-head"><div class="panel-title">最近导入</div><div class="spacer"></div><button class="btn" type="button" data-dashboard-nav="imports">全部批次</button></div><div class="panel-body list dashboard-list">${dashboardList(importBatches.map((batch) => ({ icon: "导", title: batch.file, detail: `${batch.scope} · 可导入 ${batch.valid} 行 · 错误 ${batch.errors} 行`, tone: batch.errors && !["全部成功", "部分成功"].includes(batch.status) ? "red" : "green", action: "import-detail", id: batch.id })), "暂无导入批次")}</div></section></div>`
        );
      }

      function handleDashboardNavigation(button) {
        const targetPage = button.dataset.dashboardNav;
        if (targetPage === "dashboard") {
          toast("当前模块数据已是最新测试对象汇总");
          return;
        }
        dashboardTaskFilter = null;
        if (targetPage === "tasks") {
          taskView =
            button.dataset.taskView ||
            (currentUser.role === "pm" ? "mine" : "summary");
          dashboardTaskFilter = {
            group: button.dataset.taskGroup || "",
            type: button.dataset.taskType || "",
            month: button.dataset.taskMonth || "",
            event: button.dataset.taskEvent || "",
            dueStart: button.dataset.taskDueStart || "",
            dueEnd: button.dataset.taskDueEnd || "",
            region: button.dataset.taskRegion || "",
            city: button.dataset.taskCity || "",
            pm: button.dataset.taskPm || "",
          };
          if (dashboardTaskFilter.group === "today") {
            dashboardTaskFilter.dueStart = DEMO_TODAY;
            dashboardTaskFilter.dueEnd = DEMO_TODAY;
          }
          if (dashboardTaskFilter.group === "next7") {
            dashboardTaskFilter.dueStart = addDays(DEMO_TODAY, 1);
            dashboardTaskFilter.dueEnd = addDays(DEMO_TODAY, 7);
          }
          if (!Object.values(dashboardTaskFilter).some(Boolean))
            dashboardTaskFilter = null;
        }
        if (targetPage === "operations" && button.dataset.scopeType) {
          const scopeType = button.dataset.scopeType;
          const scopeValue = button.dataset.scopeValue;
          customerAreaFilter.provinces.clear();
          customerAreaFilter.cities.clear();
          customerAreaFilter.districts.clear();
          appliedCustomerFilter.provinces = new Set();
          appliedCustomerFilter.cities = new Set();
          appliedCustomerFilter.districts = new Set();
          appliedCustomerFilter = {
            group: "",
            groupName: "",
            companyName: "",
            personCode: "",
            personName: "",
            personWechat: "",
            industries: new Set(),
            levels: new Set(),
            personPhone: "",
            pms: new Set(),
            coverage: "",
            departments: new Set(),
            positions: new Set(),
            customPosition: "",
            departmentCoverage: "",
            positionCoverage: "",
            provinces: new Set(),
            cities: new Set(),
            districts: new Set(),
          };
          customerTreeDimension = "region";
          selectedCustomerGroup = "";
          selectedOperationCustomerId = null;
          selectedOperationContactId = null;
          selectedOperationRegionGroup = "";
          if (scopeType === "region") {
            const region = regionsData.find(
              (item) =>
                regionsMatch(item.name, scopeValue),
            );
            selectedOperationRegion = region?.name || scopeValue;
            selectedOperationProvince = "";
            [...expandedCustomerNodes]
              .filter((key) => key.startsWith("operation-"))
              .forEach((key) => expandedCustomerNodes.delete(key));
            if (region) {
              expandedCustomerNodes.add(`operation-region:${region.name}`);
              regionProvinceList(region).forEach((province) => {
                expandedCustomerNodes.add(
                  `operation-province:${region.name}:${province}`,
                );
                scopedCustomers()
                  .filter(
                    (company) =>
                      customerRegionLabel(company) === region.name &&
                      company.province === province,
                  )
                  .forEach((company) =>
                    expandedCustomerNodes.add(
                      `operation-region-group:${region.name}:${province}:${company.group}`,
                    ),
                  );
              });
            }
          } else if (scopeValue === "省公司") {
            appliedCustomerFilter.levels = new Set(["省公司"]);
            selectedOperationRegion = "";
            selectedOperationProvince = "";
          } else {
            customerAreaFilter.cities.add(scopeValue);
            appliedCustomerFilter.cities = new Set([scopeValue]);
            const company = scopedCustomers().find(
              (item) => item.city === scopeValue,
            );
            selectedOperationRegion = company
              ? customerRegionLabel(company)
              : "";
            selectedOperationProvince = company?.province || "";
          }
        }
        if (targetPage === "operations" && button.dataset.coverage)
          appliedCustomerFilter.coverage = button.dataset.coverage;
        if (targetPage === "employees")
          dashboardEmployeeStatusFilter = button.dataset.employeeStatus || "";
        currentPage = targetPage;
        closeOverlay();
        renderNav();
        renderPage();
      }
