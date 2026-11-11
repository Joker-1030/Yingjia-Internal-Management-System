      // Product owner: M01 §6.24 / DEC-247. This page only consumes source facts.
      let employeeUsageState = { actor: "", start: "", end: "" };
      let employeeUsageSort = { key: "", direction: "asc" };
      let employeeUsageSubmission = null;
      let employeeUsageSequence = 0;

      function employeeUsageEmployee() {
        if (!currentUser || currentUser.disabled) return null;
        const employee = employees.find(item => item.code === currentUser.employeeCode) ||
          employees.find(item => item.phone === currentUser.phone);
        return employee?.status === "在职" && employee.accountStatus !== "停用" ? employee : null;
      }
      function employeeUsageRoleNames(employee) {
        return employeeRoleNames(employee);
      }
      function employeeUsageAccess() {
        const actor = employeeUsageEmployee();
        if (!actor) return false;
        const roles = employeeUsageRoleNames(actor);
        const eligible = currentUser.fullAccess || roles.some(role => ["总裁", "市场副总"].includes(role)) || departmentsManagedBy(actor.code).length > 0;
        if (!eligible) return false;
        if (currentUser.fullAccess) return true;
        const templates = roles.map(role => systemRoleTemplates.find(template => template.name === role)).filter(Boolean);
        return !templates.length || templates.some(template => template.permissions.includes("employee-usage"));
      }
      function employeeUsageEmployees() {
        if (!employeeUsageAccess()) return [];
        const actor = employeeUsageEmployee(), roles = employeeUsageRoleNames(actor);
        if (currentUser.fullAccess || roles.includes("总裁")) return employees.slice();
        const names = new Set(departmentsManagedBy(actor.code).flatMap(dept => organizationDescendantNames(dept.id)));
        return employees.filter(employee =>
          (roles.includes("市场副总") && employeeUsageRoleNames(employee).some(role => ["区域总监", "PM"].includes(role))) ||
          employeeDepartmentNames(employee).some(name => names.has(name)));
      }
      function employeeUsageDate(at) {
        const text = String(at || "");
        if (!text) return "";
        if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
          const [year, month, day] = text.slice(0, 10).split("-").map(Number);
          if (new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== text.slice(0, 10)) return "";
        }
        const iso = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(text)
          ? text.replace(" ", "T") + (text.length === 10 ? "T00:00:00+08:00" : "+08:00") : text;
        const date = new Date(iso);
        if (!Number.isFinite(date.getTime())) return "";
        const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(p => [p.type, p.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
      }
      function employeeUsageValidDate(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && employeeUsageDate(value) === value;
      }
      function employeeUsageReset() {
        const yesterday = addDays(DEMO_TODAY, -1);
        employeeUsageState = { actor: employeeUsageEmployee()?.code || "", start: yesterday, end: yesterday };
        employeeUsageSort = { key: "", direction: "asc" };
      }
      function employeeUsageApply(start, end) {
        if (!employeeUsageAccess()) return "无权查看员工使用统计";
        if (!employeeUsageValidDate(start) || !employeeUsageValidDate(end)) return "请选择有效的开始和结束日期";
        if (start > end) return "开始日期不能晚于结束日期";
        employeeUsageState = { actor: employeeUsageEmployee().code, start, end };
        return "";
      }
      function employeeUsageInRange(at, range = employeeUsageState) {
        const day = employeeUsageDate(at);
        return Boolean(day && day >= range.start && day <= range.end);
      }
      function employeeUsageRecordActor(record) {
        // Explicit creator only; never attribute historical records to their current business PM.
        return record.createdByCode || "";
      }
      function employeeUsageOperationsFor(code) {
        if (!employeeUsageEmployees().some(employee => employee.code === code)) return [];
        const seen = new Set();
        return employeeUsageOperations.filter(item => item.success === true && item.employeeCode === code && employeeUsageInRange(item.at) && item.id && !seen.has(item.id) && seen.add(item.id))
          .slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
      }
      function employeeUsageMaintenanceFor(code) {
        if (!employeeUsageEmployees().some(employee => employee.code === code)) return [];
        const seen = new Set();
        return maintenanceRecords.filter(record => employeeUsageRecordActor(record) === code && employeeUsageInRange(record.createdAt) && !seen.has(record.id) && seen.add(record.id))
          .slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      }
      function employeeUsageRows() {
        const rows = employeeUsageEmployees().map(employee => ({ employee,
          days: new Set(employeeUsageVisits.filter(item => item.employeeCode === employee.code && employeeUsageInRange(item.at)).map(item => employeeUsageDate(item.at))).size,
          operations: employeeUsageOperationsFor(employee.code), records: employeeUsageMaintenanceFor(employee.code),
        }));
        if (!["days", "operations", "records"].includes(employeeUsageSort.key)) return rows;
        const value = row => employeeUsageSort.key === "days" ? row.days : row[employeeUsageSort.key].length;
        return rows.sort((a, b) => (value(a) - value(b)) * (employeeUsageSort.direction === "asc" ? 1 : -1));
      }
      function employeeUsageToggleSort(key) {
        if (!employeeUsageAccess() || !["days", "operations", "records"].includes(key)) return false;
        if (employeeUsageState.actor !== employeeUsageEmployee().code) employeeUsageReset();
        employeeUsageSort = { key, direction: employeeUsageSort.key === key && employeeUsageSort.direction === "asc" ? "desc" : "asc" };
        return true;
      }
      function employeeUsageSortHeader(key, label, help) {
        const active = employeeUsageSort.key === key;
        const direction = employeeUsageSort.direction === "asc" ? "升序" : "降序";
        const next = active && employeeUsageSort.direction === "asc" ? "降序" : "升序";
        const action = `${label}：${active ? `当前${direction}，切换${next}` : "升序排序"}`;
        return `<th aria-sort="${active ? (employeeUsageSort.direction === "asc" ? "ascending" : "descending") : "none"}"><span class="employee-usage-column-head">${label}${employeeUsageHelp(help)}<button class="workbench-sort employee-usage-sort" type="button" data-employee-usage-sort="${key}" title="${action}" aria-label="${action}"><span aria-hidden="true">${active ? (employeeUsageSort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></span></th>`;
      }
      function employeeUsageRecordVisit(at = recordCreatedAt(), source = "entry") {
        const employee = employeeUsageEmployee(), day = employeeUsageDate(at);
        if (!employee || !day || source !== "entry") return false;
        if (employeeUsageVisits.some(item => item.employeeCode === employee.code && employeeUsageDate(item.at) === day)) return false;
        employeeUsageVisits.push({ employeeCode: employee.code, at });
        return true;
      }
      function employeeUsageRecordOperation({ id, employeeCode, at = recordCreatedAt(), module, action, objects, success }) {
        if (success !== true || !id || !employeeCode || !employeeUsageValidDate(employeeUsageDate(at)) || !module || !action || !Array.isArray(objects) || !objects.length || employeeUsageOperations.some(item => item.id === id)) return false;
        employeeUsageOperations.push({ id, employeeCode, at, module, action, objects: [...new Set(objects.map(String))], success: true });
        return true;
      }
      function employeeUsagePage() {
        if (!employeeUsageAccess()) return forbiddenPage("员工使用统计", "当前账号无权查看。");
        if (lastRenderedPage !== "employee-usage" || employeeUsageState.actor !== employeeUsageEmployee().code) employeeUsageReset();
        const escape = escapeDashboardHtml;
        const rows = employeeUsageRows();
        return pageHead("员工使用统计", "查看员工的系统使用、业务操作与维系记录新增情况。") +
          `<section class="panel"><form class="toolbar filter-toolbar" id="employeeUsageFilterForm">${filterField("开始日期", `<input class="input" type="date" id="employeeUsageStart" value="${escape(employeeUsageState.start)}" required>`)}${filterField("结束日期", `<input class="input" type="date" id="employeeUsageEnd" value="${escape(employeeUsageState.end)}" required>`)}${filterActions('<button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" id="employeeUsageReset">重置</button>')}</form>` +
          `<div class="panel-head"><div class="panel-title">员工使用情况</div><div class="spacer"></div><span class="panel-sub">${escape(employeeUsageState.start)} 至 ${escape(employeeUsageState.end)}</span></div><div class="table-wrap"><table class="employee-usage-table" data-paged-table="employee-usage"><thead><tr><th>员工</th><th>所属部门</th><th>系统角色</th><th>员工状态</th>${employeeUsageSortHeader("days", "登录使用天数", "同一员工北京时间同一天实际进入系统计1天，重复进入、刷新和后台续期不重复计数。")}${employeeUsageSortHeader("operations", "操作次数", "一次成功业务提交计1次，多字段或批量提交仍计1次；浏览、查询和失败不计。")}${employeeUsageSortHeader("records", "维系新增次数", "按正式维系记录创建时间统计，归实际录入人；追加附件不重复，补录不按维系日期回算。")}</tr></thead><tbody id="employeeUsageBody">${rows.map(({employee, days, operations, records}) => `<tr data-page-row><td><strong>${escape(employee.name)}</strong><div class="list-sub">${escape(employee.code)}</div></td><td>${employeeDepartmentNames(employee).map(name => escape(name)).join("<br>") || "—"}</td><td>${escape(employeeUsageRoleNames(employee).join("、")) || "—"}</td><td><span class="tag ${employee.status === "在职" ? "green" : "yellow"}">${employee.status === "在职" ? "在职" : "已停用"}</span></td><td>${days}</td><td><button type="button" class="link" data-employee-usage-detail="operations" data-employee-code="${escape(employee.code)}" aria-label="查看${escape(employee.name)}的操作明细">${operations.length}</button></td><td><button type="button" class="link" data-employee-usage-detail="maintenance" data-employee-code="${escape(employee.code)}" aria-label="查看${escape(employee.name)}的维系新增明细">${records.length}</button></td></tr>`).join("") || '<tr data-empty-row><td colspan="7" class="panel-sub">暂无可查看的员工</td></tr>'}</tbody></table></div>${tablePagination("employee-usage", unifiedTablePaginationStates["employee-usage"]?.pageSize || 20)}</section>`;
      }
      function employeeUsageHelp(text) {
        return `<span class="workbench-help" tabindex="0" role="img" title="${escapeDashboardHtml(text)}" aria-label="${escapeDashboardHtml(text)}">?</span>`;
      }
      function employeeUsageDetailHtml(code, kind) {
        const employee = employeeUsageEmployees().find(item => item.code === code);
        if (!employee || !["operations", "maintenance"].includes(kind)) return "";
        const escape = escapeDashboardHtml;
        const rows = kind === "operations" ? employeeUsageOperationsFor(code) : employeeUsageMaintenanceFor(code);
        const headers = kind === "operations" ? ["操作时间", "员工", "模块", "具体动作", "业务对象"] : ["创建时间", "录入人", "客户公司", "关键人", "维系方式"];
        const cells = row => kind === "operations" ? [row.at, employee.name, row.module, row.action, row.objects.join("、")] : [row.createdAt, employee.name, row.company, row.person, row.method === "其他" ? `其他（${row.otherMethod || ""}）` : row.method];
        return `<div class="modal-head"><div class="modal-title">${kind === "operations" ? "操作明细" : "维系新增明细"}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body employee-usage-detail" data-employee-usage-owner="${escape(employeeUsageEmployee().code)}" data-employee-usage-target="${escape(code)}"><div class="employee-usage-context"><strong>${escape(employee.name)}</strong><span class="panel-sub">${escape(employeeUsageState.start)} 至 ${escape(employeeUsageState.end)}</span></div><div class="table-wrap"><table data-paged-table="employee-usage-detail"><thead><tr>${headers.map(label => `<th>${label}</th>`).join("")}</tr></thead><tbody id="employeeUsageDetailBody">${rows.map(row => `<tr data-page-row>${cells(row).map(cell => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("") || '<tr data-empty-row><td colspan="5" class="panel-sub">所选时间内暂无记录</td></tr>'}</tbody></table></div>${tablePagination("employee-usage-detail")}</div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button></div>`;
      }
      function openEmployeeUsageDetail(code, kind) {
        const html = employeeUsageDetailHtml(code, kind);
        if (!html) { closeAllOverlays(); return toast("无权查看该统计明细"); }
        openModal(html);
      }
      function bindEmployeeUsageEvents() {
        const form = $("#employeeUsageFilterForm");
        if (form) form.onsubmit = event => {
          event.preventDefault();
          const error = employeeUsageApply($("#employeeUsageStart").value, $("#employeeUsageEnd").value);
          if (error) return toast(error);
          refreshUnifiedTablePagination("employee-usage", true);
          renderPage();
        };
        if ($("#employeeUsageReset")) $("#employeeUsageReset").onclick = () => { employeeUsageReset(); refreshUnifiedTablePagination("employee-usage", true); renderPage(); };
        document.querySelectorAll("[data-employee-usage-detail]").forEach(button => button.onclick = () => openEmployeeUsageDetail(button.dataset.employeeCode, button.dataset.employeeUsageDetail));
        document.querySelectorAll("[data-employee-usage-sort]").forEach(button => button.onclick = () => {
          const key = button.dataset.employeeUsageSort;
          if (!employeeUsageToggleSort(key)) return;
          refreshUnifiedTablePagination("employee-usage", true);
          renderPage();
          document.querySelector(`[data-employee-usage-sort="${key}"]`)?.focus?.({ preventScroll: true });
        });
      }
      function employeeUsageGuard() {
        const detail = $("[data-employee-usage-owner]");
        if (detail && (detail.dataset.employeeUsageOwner !== employeeUsageEmployee()?.code || !employeeUsageEmployees().some(employee => employee.code === detail.dataset.employeeUsageTarget))) closeAllOverlays();
      }

      // Demo-only submission instrumentation: observe actual handler mutations, never count clicks.
      // The source handlers still own validation, permissions and business success/failure.
      function employeeUsageBusinessSnapshot() {
        const sources = [
          ["客户经营", contacts], ["客户基础配置", customers], ["维系管理", tasks],
          ["维系管理", maintenanceRecords], ["维系管理", campaigns],
          ["组织与员工", employees], ["组织与员工", organizationDepartments],
          ["区域中心与地市配置", regionsData], ["区域中心与地市配置", cityOwners], ["区域中心与地市配置", cityResponsibilityRules],
          ["项目管理", projects], ["框架管理", projectFrameworks], ["采购包管理", projectPackages], ["平台公司管理", platformCompanies],
          ["培训老师管理", teachers], ["培训老师管理", teacherDirections],
          ["销售与商机管理", opportunities], ["授课复盘", teacherRecaps], ["老师推荐", teacherRecommendations],
          ["权限授权", systemRoleTemplates], ["客户基础配置", industries],
          ["销售指标", salesTargetMonths.map(item => ({ ...item, id: item.month, name: item.month }))],
          ["销售指标", salesTargetYears.map(item => ({ ...item, id: item.year, name: String(item.year) }))],
          ["教学管理范围", [{ id: "teaching-scopes", name: "教学管理范围", value: teachingManagementAssignments }]],
          ["维系规则", [{ id: "maintenance-rules", name: "维系规则", value: maintenanceConfig }]],
        ];
        const snapshot = new Map();
        sources.forEach(([module, items], index) => items.forEach((item, row) => {
          const key = `${index}:${item.id || item.code || item.name || row}`;
          snapshot.set(key, { value: JSON.stringify(item), module, label: String(item.name || item.person && `${item.company} · ${item.person}` || item.city || item.code || item.id || module) });
        }));
        return snapshot;
      }
      function employeeUsageNoteFeedback(message) {
        if (employeeUsageSubmission) employeeUsageSubmission.feedback = String(message);
      }
      function employeeUsageRunSubmission(handler, metadata = {}) {
        if (employeeUsageSubmission || !employeeUsageEmployee()) return handler();
        const submission = { id: `US-${Date.now()}-${++employeeUsageSequence}`, employeeCode: employeeUsageEmployee().code,
          at: recordCreatedAt(), before: employeeUsageBusinessSnapshot(), ...metadata, feedback: "" };
        employeeUsageSubmission = submission;
        const finish = success => {
          employeeUsageSubmission = null;
          if (!success) return;
          const after = employeeUsageBusinessSnapshot();
          const changed = [...new Set([...submission.before.keys(), ...after.keys()])].filter(key => submission.before.get(key)?.value !== after.get(key)?.value).map(key => after.get(key) || submission.before.get(key));
          // Failed validations sometimes update derived task state; they are still failed submissions.
          const positive = /已(?:保存|更新|新增|创建|发布|启用|停用|恢复|交付|完成|删除|移除|解除|调整|分配|划转|中止|取消|追加|登记|接受|拒绝|撤回|录入|修改|设置|关联|解绑|转为)|成功/.test(submission.feedback);
          if (!changed.length || (submission.feedback && !positive)) return;
          employeeUsageRecordOperation({ ...submission, success: true, module: submission.module || changed[0].module,
            action: submission.action || "保存", objects: changed.map(item => item.label) });
        };
        try {
          const result = handler();
          if (result && typeof result.then === "function") return result.then(value => { finish(true); return value; }, error => { finish(false); throw error; });
          finish(true);
          return result;
        } catch (error) { finish(false); throw error; }
      }
      function installEmployeeUsageTracking() {
        const mutatingLabel = /保存|确认|提交|完成|交付|启用|停用|恢复|删除|移除|新增|发布|分配|划转|撤回|接受|拒绝|转为|追加|上传|登记|调整|重置|补录|中止|取消项目|结账|解除|解绑/;
        ["click", "submit", "change"].forEach(type => document.addEventListener(type, event => {
          if (!employeeUsageEmployee()) return;
          const path = event.composedPath ? event.composedPath() : [event.target];
          path.forEach(element => {
            if (!element || typeof element[`on${type}`] !== "function" || element[`on${type}`].employeeUsageWrapped) return;
            if (element.closest?.("#employeeUsageFilterForm, .employee-usage-detail") || element.dataset?.page || element.dataset?.dashboardNav || element.dataset?.employeeUsageDetail) return;
            const label = (type === "submit" ? element.querySelector?.('[type="submit"]')?.textContent : element.textContent || element.getAttribute?.("aria-label"))?.trim();
            if (!label || !mutatingLabel.test(label) || /查询|重置筛选/.test(label)) return;
            const original = element[`on${type}`];
            const wrapped = function (...args) {
              return employeeUsageRunSubmission(() => original.apply(this, args), { action: label, module: pageNames[currentPage] || "业务操作" });
            };
            wrapped.employeeUsageWrapped = true;
            element[`on${type}`] = wrapped;
          });
        }, true));
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") employeeUsageRecordVisit();
        });
      }
