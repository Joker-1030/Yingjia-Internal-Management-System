      function renderTasks() {
        const ts = scopedTasks();
        const tabs = `<section class="panel"><div class="tabs"><button class="tab ${taskView === "summary" ? "active" : ""}" data-task-view="summary">任务总览</button><button class="tab ${taskView === "mine" ? "active" : ""}" data-task-view="mine">${currentUser.role === "pm" ? "我的任务" : "执行明细"}</button><button class="tab ${taskView === "records" ? "active" : ""}" data-task-view="records">维系记录</button></div>${taskView === "summary" ? renderTaskSummary(ts) : taskView === "records" ? renderTaskRecords() : renderTaskExecutions(ts)}</section>`;
        const html = (
          pageHead(
            "维系管理",
            "按任务查看整体进度，需要执行时再下钻到客户与关键人。",
            `${hasOperationPermission("tasks.publish_campaign") ? '<button class="btn" data-action="new-campaign">＋ 发布专项任务</button>' : ""}${canCreateMaintenanceRecord() ? '<button class="btn btn-primary" data-action="new-record">＋ 新增维系记录</button>' : ""}`,
          ) + tabs
        );
        return html;
      }

      function taskSummaryNumbers(items) {
        const active = items.filter((task) => task.status !== "cancelled");
        const done = active.filter((task) => task.status === "done").length;
        const pending = active.filter((task) =>
          ["pending", "paused"].includes(task.status),
        ).length;
        const overdue = active.filter((task) => task.status === "overdue").length;
        const lateEntryPending = active.filter(
          (task) => task.status === "late_entry_pending",
        ).length;
        const expired = active.filter((task) => task.status === "expired").length;
        const onTimeDone = active.filter(
          (task) =>
            task.status === "done" &&
            ["on_time", "late_entry_approved"].includes(
              task.completionType || "on_time",
            ),
        ).length;
        const lateEntryDone = active.filter(
          (task) => task.completionType === "late_entry_approved",
        ).length;
        const lateCompletionDone = active.filter(
          (task) => task.completionType === "late_completion",
        ).length;
        return {
          customers: new Set(active.map((task) => task.company)).size,
          contacts: new Set(active.map((task) => `${task.company}:${task.person}`)).size,
          done,
          pending,
          running: pending,
          overdue,
          onTimeDone,
          lateEntryDone,
          lateCompletionDone,
          lateEntryPending,
          expired,
          total: active.length,
          rate: active.length ? Math.round((done / active.length) * 100) : 0,
          onTimeRate: active.length
            ? Math.round((onTimeDone / active.length) * 100)
            : 0,
        };
      }

      function formatTaskUpdateTime(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }

      function taskThemeStatus(row) {
        if (row.total > 0 && row.done === row.total) return "已完成";
        if (row.startDate && row.startDate > DEMO_TODAY) return "待开始";
        if (row.endDate && row.endDate < DEMO_TODAY) return "已过期";
        return "进行中";
      }

      function taskThemeStatusTag(status) {
        const tone =
          status === "已完成"
            ? "green"
            : status === "已过期"
              ? "red"
              : "blue";
        return `<span class="tag ${tone}">${status}</span>`;
      }

      function taskUpdateFooter(refreshAction, refreshId) {
        return `<div class="task-data-update"><span>数据更新时间：<span data-task-updated-at>${taskDataUpdatedAt}</span></span><span>· 每小时自动更新</span><button class="icon-btn" type="button" data-action="${refreshAction}" data-id="${refreshId}" title="立即更新任务数据" aria-label="立即更新任务数据">↻</button></div>`;
      }

      function taskExecutionHeader(refreshAction, refreshId) {
        return `<div class="task-execution-head"><div class="section-title">执行明细</div>${taskUpdateFooter(refreshAction, refreshId)}</div>`;
      }

      function refreshTaskThemeData(type) {
        taskDataUpdatedAt = formatTaskUpdateTime(new Date());
        closeOverlay();
        openTaskThemeDetail(type);
        toast("任务数据已更新");
      }

      function refreshCampaignData(id) {
        taskDataUpdatedAt = formatTaskUpdateTime(new Date());
        closeOverlay();
        openCampaignDetail(id);
        toast("任务数据已更新");
      }

      function executionStatusGroup(status) {
        if (status === "done") return "done";
        if (status === "overdue") return "overdue";
        if (status === "late_entry_pending") return "late-entry";
        if (status === "expired") return "expired";
        return "pending";
      }

      const executionStatusTabs = [
        { key: "done", label: "已完成" },
        { key: "pending", label: "待执行/暂停" },
        { key: "overdue", label: "当前逾期" },
        { key: "late-entry", label: "补录审核中" },
        { key: "expired", label: "已过期未完成" },
      ];

      function executionStatusCounts(rows) {
        return Object.fromEntries(
          executionStatusTabs.map(({ key }) => [
            key,
            rows.filter((task) => executionStatusGroup(task.status) === key)
              .length,
          ]),
        );
      }

      function executionStatusTabsHtml(counts, activeStatus) {
        return executionStatusTabs
          .map(
            ({ key, label }) =>
              `<button class="tab ${activeStatus === key ? "active" : ""}" type="button" data-execution-status="${key}" data-execution-label="${label}">${label} <span class="tab-count" data-execution-count>${counts[key]}</span></button>`,
          )
          .join("");
      }

      function completionTypeName(type) {
        return (
          {
            on_time: "按期完成",
            late_entry_approved: "按期执行、逾期补录",
            late_completion: "逾期补完成",
            kpi_achieved: "系统达标",
          }[type] || "待认定"
        );
      }

      function taskCity(task) {
        const company = customers.find((item) => item.name === task.company);
        if (!company) return "待配置";
        return company.city || "省级";
      }

      function taskStatusTone(task) {
        if (task.status === "done")
          return task.completionType === "late_completion" ? "orange" : "green";
        if (["overdue", "expired"].includes(task.status)) return "red";
        if (task.status === "paused" && task.due < DEMO_TODAY) return "red";
        if (["paused", "late_entry_pending"].includes(task.status)) return "blue";
        return "yellow";
      }

      function taskRecord(task) {
        return maintenanceRecords.find(
          (record) =>
            record.taskId === task.id || record.id === task.recordId,
        );
      }

      function taskMatchesDashboardFilter(task, filter) {
        if (!filter) return true;
        const completionType =
          task.completionType || (task.status === "done" ? "on_time" : "");
        if (
          filter.type &&
          (filter.type === "care"
            ? !["生日关怀", "节假日关怀"].includes(task.type)
            : task.type !== filter.type)
        )
          return false;
        if (filter.pm && task.pm !== filter.pm) return false;
        if (filter.region && !regionsMatch(task.region, filter.region)) return false;
        if (
          filter.city &&
          taskCity(task) !== (filter.city === "省公司" ? "省级" : filter.city)
        )
          return false;
        if (filter.dueStart && task.due < filter.dueStart) return false;
        if (filter.dueEnd && task.due > filter.dueEnd) return false;
        if (
          filter.event === "done" &&
          taskBusinessMonth(task, "done") !== filter.month
        )
          return false;
        if (
          filter.event === "overdue" &&
          (!task.everOverdue ||
            taskBusinessMonth(task, "overdue") !== filter.month)
        )
          return false;
        if (
          filter.group === "risk" &&
          !taskIsHealthRisk(task) &&
          !["late-entry", "expired"].includes(executionStatusGroup(task.status))
        )
          return false;
        if (
          filter.group === "on-time" &&
          !(
            task.status === "done" &&
            ["on_time", "late_entry_approved"].includes(completionType)
          )
        )
          return false;
        if (filter.group === "period-done" && task.status !== "done")
          return false;
        if (filter.group === "done" && task.status !== "done") return false;
        if (filter.group === "today" && task.due !== DEMO_TODAY) return false;
        if (
          filter.group === "next7" &&
          !(task.due > DEMO_TODAY && task.due <= addDays(DEMO_TODAY, 7))
        )
          return false;
        return true;
      }

      function pmExecutionTable(rows, tableKey) {
        const key = String(tableKey).replace(/[^\w\u4e00-\u9fa5-]/g, "-");
        const activeRows = rows.filter((task) => task.status !== "cancelled");
        const counts = executionStatusCounts(activeRows);
        if (!executionTableStates[key])
          executionTableStates[key] = { status: "pending", page: 1 };
        const state = executionTableStates[key];
        return `<div class="execution-table" data-execution-table="${key}"><div class="tabs execution-tabs">${executionStatusTabsHtml(counts, state.status)}</div><div class="table-wrap"><table><thead><tr><th>客户 / 关键人</th><th>区域</th><th>城市</th><th>执行人</th><th>截止日</th><th>执行状态</th><th>操作</th></tr></thead><tbody>${activeRows.map((task) => {
          const record = taskRecord(task);
          const action =
            task.status === "done" && record
              ? `<span class="link" data-action="record-detail" data-id="${record.id}">维系记录</span>`
              : `<span class="link" data-action="task-detail" data-id="${task.id}">任务详情</span>`;
          return `<tr data-execution-group="${executionStatusGroup(task.status)}"><td><strong>${task.company}</strong><div class="list-sub">执行编号 ${task.executionCode}</div><div class="list-sub">任务编号 ${task.parentTaskCode} · ${task.person} · ${task.title}</div></td><td>${task.region || "待配置"}</td><td>${taskCity(task)}</td><td>${task.pm}</td><td>${task.due}</td><td><span class="tag ${taskStatusTone(task)}">${taskStatusName(task.status, task)}</span></td><td>${action}</td></tr>`;
        }).join("") || '<tr data-empty-row><td colspan="7">当前范围暂无执行明细</td></tr>'}</tbody></table></div><div class="table-pagination"><span data-page-summary></span><button class="icon-btn" type="button" data-page-direction="prev" title="上一页" aria-label="上一页">‹</button><button class="icon-btn" type="button" data-page-direction="next" title="下一页" aria-label="下一页">›</button></div></div>`;
      }

      function bindExecutionTables() {
        document.querySelectorAll("[data-execution-table]").forEach((table) => {
          const key = table.dataset.executionTable;
          const state = executionTableStates[key] || { status: "pending", page: 1 };
          executionTableStates[key] = state;
          const apply = () => {
            const pageSize = 5;
            const rows = [...table.querySelectorAll("tbody tr[data-execution-group]")];
            const filteredByControls = rows.filter(
              (row) => row.dataset.filterMatch !== "false",
            );
            const liveCounts = Object.fromEntries(
              executionStatusTabs.map(({ key: statusKey }) => [
                statusKey,
                filteredByControls.filter(
                  (row) => row.dataset.executionGroup === statusKey,
                ).length,
              ]),
            );
            const filtered = rows.filter(
              (row) =>
                row.dataset.executionGroup === state.status &&
                row.dataset.filterMatch !== "false",
            );
            const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
            state.page = Math.min(Math.max(state.page, 1), totalPages);
            rows.forEach((row) => (row.style.display = "none"));
            filtered
              .slice((state.page - 1) * pageSize, state.page * pageSize)
              .forEach((row) => (row.style.display = ""));
            table.querySelectorAll("[data-execution-status]").forEach((tab) =>
              {
                tab.classList.toggle(
                  "active",
                  tab.dataset.executionStatus === state.status,
                );
                const count = tab.querySelector("[data-execution-count]");
                if (count)
                  count.textContent = liveCounts[tab.dataset.executionStatus] || 0;
              },
            );
            const summary = table.querySelector("[data-page-summary]");
            if (summary)
              summary.textContent = filtered.length
                ? `共 ${filtered.length} 条 · 第 ${state.page}/${totalPages} 页`
                : "当前状态暂无执行明细";
            const previous = table.querySelector('[data-page-direction="prev"]');
            const next = table.querySelector('[data-page-direction="next"]');
            if (previous) previous.disabled = state.page <= 1;
            if (next) next.disabled = state.page >= totalPages;
          };
          table.applyExecutionState = apply;
          table.querySelectorAll("[data-execution-status]").forEach((tab) => {
            tab.onclick = () => {
              state.status = tab.dataset.executionStatus;
              state.page = 1;
              apply();
            };
          });
          table.querySelectorAll("[data-page-direction]").forEach((button) => {
            button.onclick = () => {
              state.page += button.dataset.pageDirection === "next" ? 1 : -1;
              apply();
            };
          });
          apply();
        });
      }

      function renderTaskSummary(ts) {
        const summaryOwnerOptions = [
          ...new Set(ts.map((task) => task.pm).filter(Boolean)),
        ].sort();
        const regularItems = ts.filter((task) => task.type === "常规维系");
        const regularRows = [{
          key: "常规维系",
          themeKey: "regular:global",
          taskCode: taskThemes.find((theme) => theme.key === "regular:global")?.code,
          name: "关键人定期维系计划",
          type: "常规维系",
          scope: currentUser.role === "pm" ? "本人负责客户" : currentUser.region,
          period: "按职级周期持续执行",
          ...taskSummaryNumbers(regularItems),
        }];
        const birthdayRows = [
          ...new Set(
            ts
              .filter((task) => task.type === "生日关怀")
              .map((task) => task.birthdayMonth)
              .filter(Boolean),
          ),
        ].sort().map((monthKey) => {
          const items = ts.filter(
            (task) =>
              task.type === "生日关怀" &&
              task.birthdayMonth === monthKey,
          );
          const [year, month] = monthKey.split("-");
          return {
            key: `生日关怀:${monthKey}`,
            themeKey: `birthday:${monthKey}`,
            taskCode: taskThemes.find((theme) => theme.key === `birthday:${monthKey}`)?.code,
            name: `${year}年${Number(month)}月生日关怀`,
            type: "生日关怀",
            scope: currentUser.role === "pm" ? "本人负责客户" : currentUser.region,
            period: `${year}年${Number(month)}月 · 按生日规则自动生成`,
            birthdayMonth: monthKey,
            ...taskSummaryNumbers(items),
          };
        });
        const holidayRows = [
          ...new Set(
            ts
              .filter((task) => task.type === "节假日关怀")
              .map((task) => task.holidayName || task.title.replace("客户关怀", "")),
          ),
        ].map((holidayName) => {
          const items = ts.filter(
            (task) =>
              task.type === "节假日关怀" &&
              (task.holidayName || task.title.replace("客户关怀", "")) ===
                holidayName,
          );
          const numbers = taskSummaryNumbers(items);
          const dueDates = items.map((task) => task.due).filter(Boolean);
          return {
            key: `节假日关怀:${holidayName}`,
            themeKey: `holiday:${holidayName}`,
            taskCode: taskThemes.find((theme) => theme.key === `holiday:${holidayName}`)?.code,
            name: `${holidayName}客户关怀`,
            type: "节假日关怀",
            scope: currentUser.role === "pm" ? "本人负责客户" : currentUser.region,
            period: `节日任务 · 截止 ${dueDates.sort().at(-1) || "待同步"}`,
            endDate: dueDates.sort().at(-1),
            holidayName,
            ...numbers,
          };
        });
        const visibleCampaigns = campaigns.filter((campaign) =>
          ts.some((task) => task.campaignId === campaign.id),
        );
        const campaignRows = visibleCampaigns.map((campaign) => {
          const local = taskSummaryNumbers(ts.filter((task) => task.campaignId === campaign.id));
          return { key: campaign.id, themeKey: `campaign:${campaign.id}`, taskCode: campaign.code || taskThemes.find((theme) => theme.key === `campaign:${campaign.id}`)?.code, name: campaign.name, type: campaign.category, scope: campaign.scope, period: campaign.period, startDate: campaign.startDate, endDate: campaign.endDate, updatedAt: campaign.updatedAt, ...local, campaignId: campaign.id };
        });
        const rows = [...campaignRows, ...regularRows, ...birthdayRows, ...holidayRows]
          .map((row) => ({ ...row, themeStatus: taskThemeStatus(row) }));
        return `<div class="toolbar filter-toolbar" id="taskSummaryFilters">${filterField("父任务编号", '<input class="input" id="summaryCode">')}${filterField("任务名称", '<input class="input" id="summaryName">')}${filterField("目标范围", '<input class="input" id="summaryScope">')}${filterField("任务类型", `<select class="input" id="summaryType"><option value="">全部任务类型</option><option>常规维系</option><option>专项维系</option><option>关键人覆盖 KPI</option><option>生日关怀</option><option>节假日关怀</option><option value="care">生日/节日关怀</option></select>`)}${filterField("父任务状态", '<select class="input" id="summaryStatus"><option value="">全部主题状态</option><option>进行中</option><option>待开始</option><option>已过期</option><option>已完成</option></select>')}${filterField("执行人", `<select class="input" id="summaryOwner"><option value="">全部执行人</option>${summaryOwnerOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterActions('<button class="btn" id="resetSummaryFilters" type="button">重置</button>')}<span class="panel-sub" id="summaryFilterCount">共 ${rows.length} 项任务</span></div><div class="table-wrap"><table style="min-width:1540px"><thead><tr><th>任务 / 编号</th><th>任务类型</th><th>任务状态</th><th>目标范围 / 执行周期</th><th>覆盖客户</th><th>覆盖关键人</th><th>已完成</th><th>待执行/暂停</th><th>当前逾期</th><th>补录审核中</th><th>已过期未完成</th><th>任务完成进度</th><th>更新时间</th><th>操作</th></tr></thead><tbody id="taskSummaryBody">${rows.map((row) => {
          const owners = [...new Set(ts.filter((task) => row.campaignId ? task.campaignId === row.campaignId : task.type === row.type).map((task) => task.pm).filter(Boolean))].join("|");
          return `<tr data-summary-code="${row.taskCode || ""}" data-summary-name="${row.name}" data-summary-scope="${row.scope}" data-summary-type="${row.type}" data-summary-status="${row.themeStatus}" data-summary-owner="${owners}"><td><strong>${row.name}</strong><div class="list-sub">任务编号 ${row.taskCode || "待生成"}</div></td><td><span class="tag ${taskTypeMeta(row.type).tone}">${row.type}</span></td><td>${taskThemeStatusTag(row.themeStatus)}</td><td>${row.scope}<div class="list-sub">${row.period}</div></td><td>${row.customers}</td><td><strong>${row.contacts}</strong></td><td><span class="tag green">${row.done}</span></td><td>${row.pending}</td><td><span class="tag ${row.overdue ? "red" : "green"}">${row.overdue}</span></td><td>${row.lateEntryPending}</td><td>${row.expired}</td><td style="min-width:150px"><div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1)"><span>${row.done}/${row.total}</span><strong>${row.rate}%</strong></div><div class="progress"><i style="width:${row.rate}%"></i></div></td><td>${row.updatedAt || taskDataUpdatedAt}</td><td><span class="link" data-action="${row.campaignId ? "campaign-detail" : "task-theme-detail"}" data-id="${row.campaignId || row.key}">详情</span></td></tr>`;
        }).join("")}</tbody></table></div>`;
      }

      function renderTaskExecutions(ts) {
        const active = ts.filter((task) => task.status !== "cancelled");
        const ownerOptions = [...new Set(active.map((task) => task.pm).filter(Boolean))].sort();
        const regionOptions = [...new Set(active.map((task) => task.region).filter(Boolean))].sort();
        const cityOptions = [...new Set(active.map(taskCity).filter(Boolean))].sort();
        const initialRows = active.filter((task) =>
          taskMatchesDashboardFilter(task, dashboardTaskFilter),
        );
        const counts = executionStatusCounts(initialRows);
        const firstStatusWithRows =
          executionStatusTabs.find(({ key }) => counts[key] > 0)?.key ||
          "pending";
        const preferredStatus = dashboardTaskFilter?.event === "done"
          ? "done"
          : dashboardTaskFilter?.event === "overdue"
            ? firstStatusWithRows
          : dashboardTaskFilter?.group === "risk"
            ? firstStatusWithRows
            : ["done", "period-done", "on-time"].includes(
                  dashboardTaskFilter?.group,
                )
              ? "done"
              : ["overdue", "late-entry", "expired"].includes(
                    dashboardTaskFilter?.group,
                  )
                ? dashboardTaskFilter.group
                : dashboardTaskFilter?.group === "due-period" && !counts.pending
                  ? firstStatusWithRows
                  : "pending";
        if (!executionTableStates["main-executions"])
          executionTableStates["main-executions"] = {
            status: preferredStatus,
            page: 1,
          };
        else if (dashboardTaskFilter)
          executionTableStates["main-executions"] = {
            status: preferredStatus,
            page: 1,
          };
        return `<div class="toolbar filter-toolbar" id="taskExecutionFilters">${filterField("父任务编号", '<input class="input" id="taskParentCode">')}${filterField("任务执行编号", '<input class="input" id="taskExecutionCode">')}${filterField("任务名称", '<input class="input" id="taskTitle">')}${filterField("关键人编号", '<input class="input" id="taskPersonCode">')}${filterField("关键人名称", '<input class="input" id="taskPersonName">')}${filterField("客户公司", '<input class="input" id="taskCompany">')}${filterField("任务类型", `<select class="input" id="taskType"><option value="">全部类型</option><option>常规维系</option><option>专项维系</option><option>关键人覆盖 KPI</option><option>生日关怀</option><option>节假日关怀</option><option value="care">生日/节日关怀</option></select>`)}${filterField("执行人", `<select class="input" id="taskOwner"><option value="">全部执行人</option>${ownerOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterField("区域", `<select class="input" id="taskRegion"><option value="">全部区域</option>${regionOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterField("城市", `<select class="input" id="taskCityFilter"><option value="">全部城市</option>${cityOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterField("风险范围", '<select class="input" id="taskRiskScope"><option value="">全部风险范围</option><option value="risk">风险任务</option></select>')}${filterField("业务事件", '<select class="input" id="taskEventType"><option value="">全部业务事件</option><option value="done">完成事件</option><option value="overdue">首次逾期事件</option></select>')}${filterField("业务事件月份", '<input class="input" id="taskEventMonth" type="month">')}${filterField("完成认定", '<select class="input" id="taskCompletionType"><option value="">全部完成认定</option><option value="on-time">按期完成</option><option value="late-entry">逾期补录</option><option value="late-completion">逾期补完成</option></select>')}${filterField("截止开始日期", '<input class="input" id="taskDueStart" type="date">')}${filterField("截止结束日期", '<input class="input" id="taskDueEnd" type="date">')}${filterActions('<button class="btn" id="resetTaskFilters" type="button">重置</button>')}<span class="panel-sub" id="taskFilterCount">共 ${active.length} 条执行明细</span></div>${taskUpdateFooter("refresh-execution-list", "main")}<div class="execution-table" data-execution-table="main-executions"><div class="tabs execution-tabs">${executionStatusTabsHtml(counts, preferredStatus)}</div><div class="table-wrap"><table><thead><tr><th>执行任务</th><th>类型</th><th>关键人</th><th>区域</th><th>城市</th><th>执行人</th><th>截止日</th><th>状态</th><th>操作</th></tr></thead><tbody id="taskBody">${active.map((t) => {
          const record = taskRecord(t);
          const detail =
            t.status === "done" && record
              ? `<span class="link" data-action="record-detail" data-id="${record.id}">维系记录</span>`
              : `<span class="link" data-action="task-detail" data-id="${t.id}">任务详情</span>`;
          return `<tr data-execution-group="${executionStatusGroup(t.status)}" data-search="${t.parentTaskCode}${t.executionCode}${t.title}${t.person}${t.company}${t.type}${t.status}${taskCity(t)}" data-task-type="${t.type}" data-task-owner="${t.pm}" data-task-region="${t.region || "待配置"}" data-task-city="${taskCity(t)}" data-task-due="${t.due}" data-task-risk="${taskIsHealthRisk(t) ? "true" : "false"}" data-task-done-month="${t.status === "done" ? taskBusinessMonth(t, "done") : ""}" data-task-overdue-month="${t.everOverdue ? taskBusinessMonth(t, "overdue") : ""}" data-task-completion-type="${t.completionType || (t.status === "done" ? "on_time" : "")}"><td><strong>${t.title}</strong><div class="list-sub">执行编号 ${t.executionCode} · 任务编号 ${t.parentTaskCode}</div><div class="list-sub">${t.company}${t.status === "paused" ? ` · 至${t.resumeDate}恢复${taskIsHealthRisk(t) ? " · 暂停期间仍计入健康风险" : ""}` : ""}</div></td><td><span class="tag ${taskTypeMeta(t.type).tone}">${t.type}</span></td><td>${t.person}</td><td>${t.region || "待配置"}</td><td>${taskCity(t)}</td><td>${t.pm}</td><td>${t.due}</td><td><span class="tag ${taskStatusTone(t)}">${taskStatusName(t.status, t)}</span></td><td>${detail}${taskCanTakeAction(t) ? ` · <span class="link" data-complete="${t.id}">${currentUser.fullAccess ? "代办完成" : "完成"}</span>` : ""}</td></tr>`;
        }).join("") || '<tr data-empty-row><td colspan="9">当前范围暂无执行明细</td></tr>'}</tbody></table></div><div class="table-pagination"><span data-page-summary></span><button class="icon-btn" type="button" data-page-direction="prev" title="上一页" aria-label="上一页">‹</button><button class="icon-btn" type="button" data-page-direction="next" title="下一页" aria-label="下一页">›</button></div></div>`;
      }

      function maintenanceRecordCode(record) {
        const day = String(record.date || record.createdAt || DEMO_TODAY)
          .slice(0, 10)
          .replaceAll("-", "");
        return record.code || `WH-${day}-${String(record.id).padStart(6, "0").slice(-6)}`;
      }

      function recordCity(record) {
        const company = customers.find((item) => item.name === record.company);
        return company?.city || (company?.level === "省公司" ? "省级" : "待配置");
      }

      function renderTaskRecords() {
        const records = scopedRecords();
        const executorOptions = [...new Set(records.map((record) => record.pm).filter(Boolean))].sort();
        const regionOptions = [...new Set(records.map((record) => record.region).filter(Boolean))].sort();
        const cityOptions = [...new Set(records.map(recordCity).filter(Boolean))].sort();
        return `<div class="toolbar filter-toolbar" id="recordFilters">${filterField("记录编号", '<input class="input" id="recordCode">')}${filterField("关键人编号", '<input class="input" id="recordPersonCode">')}${filterField("关键人名称", '<input class="input" id="recordPersonName">')}${filterField("客户公司", '<input class="input" id="recordCompany">')}${filterField("沟通摘要", '<input class="input" id="recordSummary">', "filter-field-wide")}${filterField("维系方式", '<select class="input" id="recordMethod"><option value="">全部方式</option><option>电话</option><option>微信</option><option>线下拜访</option><option>视频会议</option><option>邮件</option><option>其他</option></select>')}${filterField("维系人", `<select class="input" id="recordExecutor"><option value="">全部维系人</option>${executorOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterField("区域", `<select class="input" id="recordRegion"><option value="">全部区域</option>${regionOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterField("城市", `<select class="input" id="recordCity"><option value="">全部城市</option>${cityOptions.map((name) => `<option>${name}</option>`).join("")}</select>`)}${filterField("关联任务", '<select class="input" id="recordLinkedTask"><option value="">全部关联情况</option><option value="yes">已关联任务</option><option value="no">未关联任务</option></select>')}${filterField("附件", '<select class="input" id="recordAttachment"><option value="">全部附件情况</option><option value="yes">有附件</option><option value="no">无附件</option></select>')}${filterField("维系开始日期", '<input class="input" id="recordDateStart" type="date">')}${filterField("维系结束日期", '<input class="input" id="recordDateEnd" type="date">')}${filterField("创建开始日期", '<input class="input" id="recordCreatedStart" type="date">')}${filterField("创建结束日期", '<input class="input" id="recordCreatedEnd" type="date">')}${filterActions('<button class="btn" id="resetRecordFilters" type="button">重置</button>')}<span class="panel-sub" id="recordFilterCount">共 ${records.length} 条 · 数据范围：${currentUser.region}</span></div><div class="table-wrap"><table style="min-width:1740px"><thead><tr><th>记录编号</th><th>维系时间</th><th>关键人</th><th>客户单位</th><th>维系方式</th><th>沟通摘要</th><th>维系人</th><th>录入人</th><th>关联任务</th><th>附件数</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead><tbody id="recordBody">${records.map((r) => { const linkedTask = tasks.find((task) => task.id === r.taskId); const code = maintenanceRecordCode(r); return `<tr data-record-code="${code}" data-record-person="${r.person}" data-record-company="${r.company}" data-record-summary="${r.summary}" data-record-method="${r.method}" data-record-executor="${r.pm}" data-record-region="${r.region}" data-record-city="${recordCity(r)}" data-record-date="${r.date}" data-record-created="${(r.createdAt || r.date).slice(0, 10)}" data-record-linked="${r.taskId ? "yes" : "no"}" data-record-attachment="${r.attachments.length ? "yes" : "no"}"><td><strong>${code}</strong></td><td>${r.maintenanceAt || r.date}</td><td><strong>${r.person}</strong></td><td>${r.company}</td><td><span class="tag blue">${r.method}</span>${r.method === "其他" ? `<div class="list-sub">${r.otherMethod || "未说明"}</div>` : ""}</td><td style="max-width:320px">${r.summary}</td><td>${r.pm}</td><td>${r.createdBy || r.pm}${r.proxyOperator ? ' <span class="tag orange">代办</span>' : ""}</td><td>${linkedTask ? `<button class="link" data-action="task-detail" data-id="${linkedTask.id}">${linkedTask.executionCode}</button>` : "未关联任务"}</td><td>${r.attachments.length ? `<button class="link" data-action="preview-file" title="点击预览附件">${r.attachments.length}</button>` : "0"}</td><td>${r.createdAt || r.date}</td><td>${r.updatedAt || r.createdAt || r.date}</td><td><button class="link" data-action="record-detail" data-id="${r.id}">详情</button>${canEditMaintenanceRecord(r) ? ` · <button class="link" data-action="edit-record" data-id="${r.id}">编辑</button>` : ""}</td></tr>`; }).join("") || '<tr data-empty-row><td colspan="13">当前范围暂无维系记录</td></tr>'}</tbody></table></div>`;
      }

      function enhanceTaskExecutionTable() {
        const body = $("#taskBody");
        if (!body) return;
        const table = body.closest("table");
        table.style.minWidth = "1880px";
        table.querySelector("thead tr").innerHTML =
          "<th>任务执行记录编号</th><th>任务编号</th><th>任务标题</th><th>类型</th><th>关键人 / 覆盖目标</th><th>客户单位 / 集合</th><th>区域</th><th>城市</th><th>执行人</th><th>截止时间</th><th>当前状态</th><th>完成认定</th><th>首次逾期时间</th><th>更新时间</th><th>操作</th>";
        const emptyCell = body.querySelector("tr[data-empty-row] td");
        if (emptyCell) emptyCell.colSpan = 15;
        body.querySelectorAll("tr[data-execution-group]").forEach((row) => {
          const directTaskId =
            row.querySelector("[data-complete]")?.dataset.complete ||
            row.querySelector('[data-action="task-detail"]')?.dataset.id;
          const recordId = row.querySelector('[data-action="record-detail"]')?.dataset.id;
          const linkedRecord = recordId
            ? maintenanceRecords.find((record) => String(record.id) === String(recordId))
            : null;
          const task = tasks.find(
            (item) =>
              String(item.id) === String(directTaskId || linkedRecord?.taskId),
          );
          if (!task) return;
          const isCoverage = task.type === "关键人覆盖 KPI";
          const campaign = campaigns.find((item) => item.id === task.campaignId);
          const targetLabel = isCoverage
            ? campaign?.coverageDimension === "部门覆盖"
              ? `待补齐目标部门：${campaign.targetDepartment || "目标部门"}`
              : `待补齐目标岗位：${campaign?.targetPosition || "目标岗位"}`
            : task.person;
          const customerLabel = isCoverage
            ? `<button class="link" type="button" data-action="campaign-detail" data-id="${task.campaignId}">共 ${task.coverageDenominator || 0} 个客户</button>`
            : task.company;
          const record = taskRecord(task);
          const actions = `<button class="link" type="button" data-action="task-detail" data-id="${task.id}">任务详情</button>${record ? ` · <button class="link" type="button" data-action="record-detail" data-id="${record.id}">维系记录</button>` : ""}${taskCanTakeAction(task) ? ` · <button class="link" type="button" data-complete="${task.id}">${currentUser.fullAccess ? "代办完成" : "完成"}</button>` : ""}`;
          row.innerHTML = `<td><strong>${task.executionCode}</strong></td><td>${task.parentTaskCode}</td><td><strong>${task.title}</strong></td><td><span class="tag ${taskTypeMeta(task.type).tone}">${task.type}</span></td><td>${targetLabel}</td><td>${customerLabel}</td><td>${task.region || "待配置"}</td><td>${taskCity(task)}</td><td>${task.pm}</td><td>${task.due} 23:59:59</td><td><span class="tag ${taskStatusTone(task)}">${taskStatusName(task.status, task)}</span>${task.status === "paused" && taskIsHealthRisk(task) ? '<div class="list-sub" style="color:var(--color-error)">暂停中仍属健康风险</div>' : ""}</td><td>${task.status === "done" ? completionTypeName(task.completionType) : task.type === "关键人覆盖 KPI" ? "待系统达标" : "—"}</td><td>${task.firstOverdueAt || "—"}</td><td>${task.updatedAt || task.createdAt || taskDataUpdatedAt}</td><td>${actions}</td>`;
        });
      }

      function enhanceTaskExecutionFilters() {
        const risk = $("#taskRiskScope");
        const eventType = $("#taskEventType");
        const eventMonth = $("#taskEventMonth");
        if (!risk || !eventType || !eventMonth) return;
        risk.innerHTML = '<option value="">全部风险范围</option><option value="current">当前逾期风险</option><option value="ever">曾经逾期</option><option value="next7">未来 7 日到期</option><option value="none">无当前风险</option>';
        const syncEventMonth = () => {
          eventMonth.disabled = !eventType.value;
          if (eventMonth.disabled) eventMonth.value = "";
          eventMonth.title = eventType.value
            ? "按所选业务事件的发生月份筛选"
            : "请先选择完成事件或首次逾期事件";
        };
        eventType.addEventListener("change", syncEventMonth);
        syncEventMonth();
      }

      function openTaskThemeDetail(themeKey) {
        const [type, themeValue] = themeKey.split(":");
        const rows = scopedTasks().filter(
          (task) =>
            task.type === type &&
            (!themeValue ||
              (type === "生日关怀"
                ? task.birthdayMonth === themeValue
                : (task.holidayName || task.title.replace("客户关怀", "")) ===
                  themeValue)),
        );
        const numbers = taskSummaryNumbers(rows);
        const title = type === "生日关怀" && themeValue
          ? `${themeValue.slice(0, 4)}年${Number(themeValue.slice(5))}月生日关怀`
          : themeValue
          ? `${themeValue}客户关怀`
          : type === "常规维系"
            ? "关键人定期维系计划"
            : `${type}自动任务`;
        const registryKey = type === "常规维系"
          ? "regular:global"
          : type === "生日关怀"
            ? `birthday:${themeValue}`
            : `holiday:${themeValue}`;
        const theme = taskThemes.find((item) => item.key === registryKey);
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">${title}详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">任</div><div><div class="detail-name">${title}</div><div class="detail-sub">任务编号 ${theme?.code || "待生成"} · ${taskTypeMeta(type).note}</div></div><div class="spacer"></div>${taskThemeStatusTag(taskThemeStatus({ ...numbers, endDate: type === "节假日关怀" && themeValue ? rows.map((task) => task.due).sort().at(-1) : undefined }))}</div><div class="metrics compact-metrics" style="grid-template-columns:repeat(4,1fr)">${metric("覆盖客户", numbers.customers, "去重统计")}${metric("覆盖关键人", numbers.contacts, "去重统计", "blue")}${metric("任务完成进度", `${numbers.rate}%`, `${numbers.done}/${numbers.total}`)}${metric("已完成", numbers.done, "执行明细")}${metric("待执行/暂停", numbers.pending, "当前待处理", "yellow")}${metric("当前逾期", numbers.overdue, "需优先处理", "red")}${metric("补录审核中", numbers.lateEntryPending, "等待审核", "blue")}${metric("已过期未完成", numbers.expired, "不再执行", "red")}</div>${taskExecutionHeader("refresh-task-theme", themeKey)}${pmExecutionTable(rows, `theme-${themeKey}`)}</div><div class="drawer-foot"><button class="btn" data-close>关闭</button></div>`,
        );
      }


      function taskStatusName(status, task) {
        if (status === "done" && task?.completionType === "late_entry_approved")
          return "已完成 · 逾期补录";
        if (status === "done" && task?.completionType === "late_completion")
          return "已完成 · 逾期补完成";
        if (status === "paused" && task?.due < DEMO_TODAY)
          return "已暂停 · 健康风险";
        return (
          {
            pending: "待执行",
            overdue: "当前逾期",
            paused: "已暂停",
            late_entry_pending: "补录审核中",
            expired: "已过期未完成",
            done: "已完成",
            cancelled: "已取消",
          }[status] || status
        );
      }

      function taskCanBeManuallyCompleted(task) {
        return Boolean(
          task &&
            task.type !== "关键人覆盖 KPI" &&
            hasOperationPermission("tasks.complete") &&
            (currentUser.fullAccess ||
              (["pm", "director"].includes(currentUser.role) &&
                task.pm === currentUser.name)),
        );
      }

      function taskCanRequestChange(task) {
        return Boolean(
          task &&
            hasOperationPermission("tasks.adjust") &&
            !["专项维系", "关键人覆盖 KPI"].includes(task.type) &&
            (currentUser.fullAccess ||
              (["pm", "director"].includes(currentUser.role) &&
                task.pm === currentUser.name)) &&
            !["done", "cancelled", "paused", "late_entry_pending", "expired"].includes(
              task.status,
            ),
        );
      }

      function taskCanTakeAction(task) {
        return Boolean(
          taskCanBeManuallyCompleted(task) &&
            !["done", "cancelled", "paused", "late_entry_pending", "expired"].includes(
              task.status,
            ),
        );
      }

      function visibleCampaignsForCurrentUser() {
        if (
          currentUser.fullAccess ||
          ["president", "vp"].includes(currentUser.role)
        )
          return campaigns;
        const visibleCampaignIds = new Set(
          scopedTasks()
            .filter((task) => task.campaignId)
            .map((task) => task.campaignId),
        );
        return campaigns.filter((campaign) => visibleCampaignIds.has(campaign.id));
      }
