      function dashboardMetric(label, value, foot, tone) {
        return `<div class="metric dashboard-metric ${tone || ""}"><span class="metric-label">${label}</span><span class="metric-value">${value}</span><span class="metric-foot">${foot}</span></div>`;
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
        if (!people.length) return 0;
        const overdueContacts = new Set(
          rows
            .filter(taskIsHealthRisk)
            .map((task) => `${task.company}:${task.person}`),
        );
        return Math.round(
          (people.filter(
            (person) => !overdueContacts.has(`${person.company}:${person.name}`),
          ).length /
            people.length) *
            100,
        );
      }

      function dashboardCoverageRate(companies, people) {
        if (!companies.length) return 0;
        return Math.round(
          (companies.filter((company) =>
            people.some((person) => person.company === company.name),
          ).length /
            companies.length) *
            100,
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
              `<tr><td><strong>${row.name}</strong></td><td>${row.companies}</td><td>${row.people}</td><td>${row.coverage}%</td><td>${row.health}%</td><td><strong>${row.onTimeRate}%</strong><div class="progress"><i style="width:${row.onTimeRate}%"></i></div></td><td><span class="tag ${row.overdue ? "red" : "green"}">${row.overdue}</span></td></tr>`,
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
            return `<tr><td><strong>${pm}</strong></td><td>${periodNumbers.total}</td><td>${periodNumbers.done}</td><td>${periodNumbers.rate}%</td><td><strong>${periodNumbers.onTimeRate}%</strong></td><td><span class="tag ${currentNumbers.overdue ? "red" : "green"}">${currentNumbers.overdue}</span></td></tr>`;
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
            command: currentUser.role === "pm" && !["late_entry_pending", "expired"].includes(task.status) ? "处理" : "查看",
          }));
        let approvalItems = [];
        if (hasPermission("approvals")) {
          approvalItems = approvalsForView("pending")
            .slice(0, 3)
            .map((approval) => ({
              icon: "审",
              title: approval.current,
              detail: `${approval.title} · ${approval.applicant}`,
              tone: "yellow",
              action: "approval-detail",
              id: approval.id,
              command: "处理",
            }));
        }
        const projectItems = projectActionTodoItemsForCurrentUser();
        const items =
          currentUser.role === "pm"
            ? [...projectItems, ...taskItems, ...approvalItems]
            : [...projectItems, ...approvalItems, ...taskItems];
        return items;
      }

      function dashboardDynamicItems() {
        const rows = scopedTasks();
        const items = [];
        visibleApprovalsForCurrentUser()
          .filter((approval) => approval.status === "rejected")
          .slice(0, 2)
          .forEach((approval) =>
            items.push({
              icon: "审",
              title: "审批与业务异常",
              detail: `${approval.title}已驳回 · ${approval.decidedAt || approval.date} · ${approval.decisionComment || "查看审批意见"}`,
              tone: "red",
              action: "approval-detail",
              id: approval.id,
            }),
          );
        const latestEffectiveChange = visibleApprovalsForCurrentUser()
          .filter(
            (approval) =>
              approval.status === "approved" &&
              ["关键人调岗", "地市交接", "任务延期", "任务暂停", "任务取消"].includes(
                approval.type,
              ),
          )
          .sort((left, right) =>
            String(right.decidedAt || right.date).localeCompare(
              String(left.decidedAt || left.date),
            ),
          )[0];
        if (latestEffectiveChange)
          items.push({
            icon: "变",
            title: latestEffectiveChange.type.startsWith("任务")
              ? "任务执行偏差"
              : "客户与关键人变动",
            detail: `${latestEffectiveChange.title}已生效 · ${latestEffectiveChange.decidedAt || latestEffectiveChange.date} · ${latestEffectiveChange.decidedBy || "系统"}`,
            tone: "blue",
            action: "approval-detail",
            id: latestEffectiveChange.id,
          });
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
              rate: total ? Math.round((done / total) * 100) : null,
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
              ? `${item.campaign.name} · 覆盖 KPI 达标率 ${item.rate}% · ${item.done}/${item.total} 名有效责任人已达标`
              : `${item.campaign.name} · 专项维系总完成率 ${item.numbers.rate}% · ${item.numbers.done}/${item.numbers.total} 条有效执行项已完成`,
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
          { title: "补录审核中", tone: "blue", filter: (task) => task.status === "late_entry_pending", group: "late-entry" },
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

      function renderDashboard() {
        if (currentUser.role === "admin" && adminDashboardView === "system")
          return renderAdminDashboard();
        const companies = scopedCustomers();
        const people = scopedContacts();
        const rows = scopedTasks();
        const numbers = dashboardTaskNumbers(rows);
        const coverage = dashboardCoverageRate(companies, people);
        const health = dashboardHealthRate(people, rows);
        const currentMonth = DEMO_TODAY.slice(0, 7);
        const selectedPeriod = dashboardPeriodMeta();
        const selectedPeriodRows = dashboardDuePeriodRows(rows);
        const selectedPeriodNumbers = dashboardTaskNumbers(selectedPeriodRows);
        const completedThisMonth = rows.filter(
          (task) =>
            task.status === "done" &&
            taskBusinessMonth(task, "done") === currentMonth,
        ).length;
        const pending = rows.filter((task) => executionStatusGroup(task.status) === "pending").length;
        const overdue = rows.filter((task) => task.status === "overdue").length;
        const activeCampaigns = campaigns.filter(
          (campaign) =>
            campaign.startDate <= DEMO_TODAY &&
            campaign.endDate >= DEMO_TODAY &&
            rows.some(
              (task) =>
                task.campaignId === campaign.id && task.status !== "cancelled",
            ),
        ).length;
        const careTodos = rows.filter(
          (task) =>
            ["生日关怀", "节假日关怀"].includes(task.type) &&
            !["done", "cancelled", "expired"].includes(task.status),
        ).length;
        const campaignTodos = rows.filter(
          (task) =>
            task.type === "专项维系" &&
            !["done", "cancelled", "expired"].includes(task.status),
        ).length;
        const coverageKpiTodos = rows.filter(
          (task) =>
            task.type === "关键人覆盖 KPI" &&
            !["done", "cancelled", "expired"].includes(task.status),
        ).length;
        const todoItems = dashboardTodoItems();
        const projectReminderItems = projectReminderSummaryItemsForCurrentUser();
        const dynamicItems = dashboardDynamicItems();
        const isPm = currentUser.role === "pm";
        const title = isPm
          ? "今日行动工作台"
          : currentUser.role === "director"
            ? `${currentUser.region}监管工作台`
            : currentUser.role === "vp"
              ? "全国市场执行驾驶舱"
              : "全国经营驾驶舱";
        const description = isPm
          ? `${currentUser.name}，优先处理逾期和临近到期事项，统计范围为${assignedCitiesForCurrentUser().join("、") || "未配置地市"}。`
          : `${currentUser.name}，以下统计均由当前权限范围内的客户、关键人、任务和维系记录实时聚合。`;
        const metrics = isPm
          ? `${dashboardMetric("当前逾期", overdue, "不含审核中及已过期", "red", "tasks", { "task-view": "mine", "task-group": "overdue" })}${dashboardMetric("今日到期", rows.filter((task) => task.status === "pending" && task.due === DEMO_TODAY).length, "今日必须处理", "orange", "tasks", { "task-view": "mine", "task-group": "today" })}${dashboardMetric("未来 7 天", rows.filter((task) => task.status === "pending" && task.due > DEMO_TODAY && task.due <= addDays(DEMO_TODAY, 7)).length, "按截止日期计算", "yellow", "tasks", { "task-view": "mine", "task-group": "next7" })}${dashboardMetric("生日 / 节日", careTodos, "未结束关怀任务", "green", "tasks", { "task-view": "mine", "task-type": "care" })}${dashboardMetric("专项维系", campaignTodos, "本人待执行项", "blue", "tasks", { "task-view": "mine", "task-type": "专项维系" })}${dashboardMetric("覆盖 KPI", coverageKpiTodos, "系统按覆盖率判定", "orange", "tasks", { "task-view": "mine", "task-type": "关键人覆盖 KPI" })}${dashboardMetric("本月已完成", completedThisMonth, "按实际完成月统计", "", "tasks", { "task-view": "mine", "task-group": "done", "task-month": currentMonth, "task-event": "done" })}${dashboardMetric("我的申请", approvals.filter((approval) => approval.applicant === currentUser.name && approval.status === "pending").length, "审批中流程", "blue", "approvals", { "approval-view": "mine" })}`
          : `${dashboardMetric("客户单位", companies.length, "当前正常状态", "", "operations")}${dashboardMetric("有效关键人", people.length, "当前有效任职", "blue", "operations")}${dashboardMetric("关键人覆盖率", `${coverage}%`, "全部关键人当前快照", "blue", "operations", { coverage: "none" })}${dashboardMetric("维系健康率", `${health}%`, "常规、生日、节假日风险", "", "tasks", { "task-view": "mine", "task-group": "risk" })}${dashboardMetric(`${selectedPeriod.label}总完成率`, `${selectedPeriodNumbers.rate}%`, `${selectedPeriodNumbers.done}/${selectedPeriodNumbers.total} 条已到期维系任务`, "orange", "tasks", { "task-view": "mine", "task-group": "period-done", "task-due-start": selectedPeriod.start, "task-due-end": selectedPeriod.end })}${dashboardMetric(`${selectedPeriod.label}按期完成率`, `${selectedPeriodNumbers.onTimeRate}%`, `${selectedPeriodNumbers.onTimeDone}/${selectedPeriodNumbers.total} 条已到期维系任务`, "blue", "tasks", { "task-view": "mine", "task-group": "on-time", "task-due-start": selectedPeriod.start, "task-due-end": selectedPeriod.end })}${dashboardMetric("当前逾期", overdue, "不含暂停风险、审核中及已过期", "red", "tasks", { "task-view": "mine", "task-group": "overdue" })}${dashboardMetric("进行中专项", activeCampaigns, "专项维系 + 覆盖 KPI", "yellow", "tasks", { "task-view": "summary" })}`;
        const primary = isPm
          ? `<div class="dashboard-primary-grid">${dashboardPmActionGroups(rows)}<section class="panel dashboard-todo-panel"><div class="panel-head"><div class="panel-title">我的待办</div><span class="tag red dashboard-panel-count">${todoItems.length}</span><div class="spacer"></div><button class="btn" type="button" data-dashboard-nav="tasks" data-task-view="mine">全部任务</button></div><div class="panel-body list dashboard-list">${dashboardList(todoItems, "当前没有待处理事项")}</div></section></div>`
          : `<div class="dashboard-primary-grid">${dashboardScopeTable()}<section class="panel dashboard-todo-panel"><div class="panel-head"><div class="panel-title">待办</div><span class="tag red dashboard-panel-count">${todoItems.length}</span><div class="spacer"></div>${hasPermission("approvals") ? '<button class="btn" type="button" data-dashboard-nav="approvals" data-approval-view="pending">审批中心</button>' : ""}</div><div class="panel-body list dashboard-list">${dashboardList(todoItems, "当前没有需要本人处理的事项")}</div></section></div>`;
        const secondaryLeft = isPm
          ? dashboardScopeTable()
          : `${dashboardPmTable()}<section class="panel" style="margin-top:var(--space-4)"><div class="panel-head"><div class="panel-title">近六个月执行趋势</div><div class="panel-sub">按实际完成月与首次逾期月统计</div><div class="spacer"></div><span class="tag green">完成事件</span><span class="tag yellow">首次逾期事件</span></div><div class="panel-body">${dashboardTrendHtml(rows)}</div></section>`;
        const projectReminderPanel = hasPermission("projects")
          ? `<section class="panel dashboard-project-reminder-panel"><div class="panel-head"><div><div class="panel-title">项目提醒</div><div class="panel-sub">监督与待回款只读提醒不进入我的待办</div></div><div class="spacer"></div><button class="btn" type="button" data-dashboard-nav="projects">项目管理</button></div><div class="panel-body list dashboard-list">${dashboardList(projectReminderItems, "当前没有项目提醒")}</div></section>`
          : "";
        const secondaryRight = `<div class="dashboard-side-stack">${projectReminderPanel}<section class="panel dashboard-dynamic-panel"><div class="panel-head"><div class="panel-title">重点动态</div><span class="tag blue dashboard-panel-count">${dynamicItems.length}</span><div class="spacer"></div><button class="btn" type="button" data-action="notification-center">消息中心</button></div><div class="panel-body list dashboard-list">${dashboardList(dynamicItems, "当前没有重点动态")}</div></section></div>`;
        return (
          pageHead(
            title,
            description,
            `${currentUser.role === "admin" ? '<button class="btn" type="button" data-admin-dashboard-view="system">系统运行</button>' : ""}<button class="btn" type="button" data-dashboard-nav="operations">客户经营</button><button class="btn btn-primary" type="button" data-dashboard-nav="tasks" data-task-view="${isPm ? "mine" : "summary"}">${isPm ? "处理任务" : "查看执行"}</button>`,
          ) +
          `<div class="metrics dashboard-metrics">${metrics}</div>${primary}<div class="dashboard-secondary-grid">${secondaryLeft}${secondaryRight}</div>`
        );
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
            "账号、导入、通知与平台作业数据统一汇总，可切换全国客户经营视图。",
            '<button class="btn" type="button" data-dashboard-nav="employees">组织与员工</button><button class="btn" type="button" data-dashboard-nav="imports">数据导入</button><button class="btn btn-primary" type="button" data-admin-dashboard-view="business">全国客户经营</button>',
          ) +
          `<div class="role-note">当前为系统运行视图；admin 同时拥有公司全局客户、关键人、维系、审批和配置操作权限，业务操作均保留“系统管理员”真实身份。</div><div class="metrics dashboard-metrics">${dashboardMetric("在职账号", activeEmployees.length, "来自员工测试数据", "", "employees")}${dashboardMetric("停用账号", employees.filter((employee) => employee.status !== "在职").length, "按员工状态统计", "red", "employees", { "employee-status": "停用" })}${dashboardMetric("任务调度", `${platformJobs.filter((job) => job.status === "成功").length}/${platformJobs.length}`, "最近一次执行结果", "blue", "dashboard")}${dashboardMetric("待重试作业", retryJobs.length, "需要运维复核", "yellow", "dashboard")}${dashboardMetric("本月导入批次", monthlyImports.length, `${currentMonth} 创建`, "", "imports")}${dashboardMetric("当前待处理错误行", failedImports.reduce((sum, batch) => sum + batch.errors, 0), "仅未完成批次", "red", "imports")}</div><div class="dashboard-primary-grid"><section class="panel dashboard-todo-panel"><div class="panel-head"><div class="panel-title">运维待办</div><span class="tag red dashboard-panel-count">${adminTodos.length}</span></div><div class="panel-body list dashboard-list">${dashboardList(adminTodos, "当前没有运维待办")}</div></section><section class="panel dashboard-dynamic-panel"><div class="panel-head"><div class="panel-title">系统动态</div><span class="tag blue dashboard-panel-count">${adminDynamics.length}</span></div><div class="panel-body list dashboard-list">${dashboardList(adminDynamics, "当前没有系统动态")}</div></section></div><div class="dashboard-secondary-grid"><section class="panel"><div class="panel-head"><div class="panel-title">系统作业状态</div><div class="panel-sub">最近一次执行</div></div><div class="table-wrap"><table><thead><tr><th>作业</th><th>最近执行</th><th>耗时</th><th>结果</th></tr></thead><tbody>${platformJobs.map((job) => `<tr><td><strong>${job.name}</strong></td><td>${job.lastRun}</td><td>${job.duration}</td><td><span class="tag ${job.status === "成功" ? "green" : "yellow"}">${job.status}</span></td></tr>`).join("")}</tbody></table></div></section><section class="panel"><div class="panel-head"><div class="panel-title">最近导入</div><div class="spacer"></div><button class="btn" type="button" data-dashboard-nav="imports">全部批次</button></div><div class="panel-body list dashboard-list">${dashboardList(importBatches.map((batch) => ({ icon: "导", title: batch.file, detail: `${batch.scope} · 可导入 ${batch.valid} 行 · 错误 ${batch.errors} 行`, tone: batch.errors && !["全部成功", "部分成功"].includes(batch.status) ? "red" : "green", action: "import-detail", id: batch.id })), "暂无导入批次")}</div></section></div>`
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
        if (targetPage === "approvals")
          approvalView = button.dataset.approvalView || "pending";
        if (targetPage === "employees")
          dashboardEmployeeStatusFilter = button.dataset.employeeStatus || "";
        currentPage = targetPage;
        closeOverlay();
        renderNav();
        renderPage();
      }
