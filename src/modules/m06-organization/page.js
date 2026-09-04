      function organizationChildren(parentId) {
        return organizationDepartments.filter(
          (item) => item.status === "启用" && item.parentId === parentId,
        );
      }
      function organizationDescendantNames(id) {
        const item = organizationDepartments.find((dept) => dept.id === id);
        return item
          ? [
              item.name,
              ...organizationChildren(id).flatMap((child) =>
                organizationDescendantNames(child.id),
              ),
            ]
          : [];
      }
      function departmentSupervisor(department) {
        return employees.find(
          (employee) =>
            employee.code === department?.supervisorCode &&
            employee.status === "在职",
        );
      }
      function departmentsManagedBy(employeeCode) {
        return organizationDepartments.filter(
          (department) =>
            department.status === "启用" &&
            department.supervisorCode === employeeCode,
        );
      }
      function employeeDepartmentNames(employee) {
        const names = Array.isArray(employee?.departments)
          ? employee.departments
          : employee?.dept && employee.dept !== "系统内置账号"
            ? [employee.dept]
            : [];
        return names.filter((name, index, all) => name && all.indexOf(name) === index);
      }
      function departmentsForEmployee(employee) {
        return employeeDepartmentNames(employee)
          .map((name) =>
            organizationDepartments.find((department) => department.name === name),
          )
          .filter(Boolean);
      }
      function setEmployeeDepartments(employee, names) {
        employee.departments = [...new Set(names.filter(Boolean))];
        employee.dept = employee.departments[0] || employee.dept;
      }
      function ensureEmployeeDepartment(employee, name) {
        if (!employee || !name) return false;
        const before = employeeDepartmentNames(employee);
        if (before.includes(name)) return false;
        setEmployeeDepartments(employee, [...before, name]);
        return true;
      }
      function addAutomaticRegionDirectorRole(employee, departmentId) {
        if (!employee) return false;
        employee.automaticRoleSources ||= {};
        const sources = employee.automaticRoleSources["区域总监"] || [];
        if (!sources.includes(departmentId))
          employee.automaticRoleSources["区域总监"] = [...sources, departmentId];
        return !sources.includes(departmentId);
      }
      function removeAutomaticRegionDirectorRole(employee, departmentId) {
        const sources = employee?.automaticRoleSources?.["区域总监"] || [];
        const next = sources.filter((id) => id !== departmentId);
        if (next.length) employee.automaticRoleSources["区域总监"] = next;
        else if (employee?.automaticRoleSources)
          delete employee.automaticRoleSources["区域总监"];
      }
      function departmentForEmployee(employee) {
        return departmentsForEmployee(employee)[0];
      }
      function departmentPath(department) {
        if (!department) return "系统内置账号";
        const names = [];
        const visited = new Set();
        let current = department;
        while (current && !visited.has(current.id)) {
          visited.add(current.id);
          names.unshift(current.name);
          current = organizationDepartments.find(
            (item) => item.id === current.parentId,
          );
        }
        return ["英嘉科技", ...names].join(" / ");
      }
      const employeeByCode = (code) =>
        employees.find((employee) => employee.code === code);
      const canViewEmployeeDetail = () =>
        Boolean(
          currentUser?.fullAccess ||
            currentRoleTemplateNames().includes("HR/人事"),
        );
      const canViewEmployeeSensitive = (employee) =>
        Boolean(
          currentUser?.fullAccess ||
            (currentUser?.role === "hr" &&
              hasFieldPermission("employee_sensitive_view")) ||
            currentUser?.name === employee?.name,
        );
      function displayEmployeePhone(employee) {
        const phone = String(employee?.phone || "");
        if (!phone) return "待补录";
        return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
      }
      function displayEmployeeEmail(employee) {
        const email = String(employee?.email || "");
        if (!email) return "待补录";
        if (canViewEmployeeSensitive(employee)) return email;
        const [local, domain] = email.split("@");
        return `${local.slice(0, 2)}***@${domain || "***"}`;
      }
      function syncOrganizationRegions() {
        organizationDepartments
          .filter((item) => item.type === "region" && item.status === "启用")
          .forEach((item) => {
            let region = regionsData.find(
              (candidate) => candidate.id === item.regionId,
            );
            if (!region) {
              region = {
                id: Date.now() + item.id,
                name: item.name,
                scope: item.name.replace(/区域运营中心$/, "区域"),
                director: "",
                provinces: "",
                base: "待配置",
              };
              regionsData.push(region);
              item.regionId = region.id;
            }
            const supervisor = departmentSupervisor(item);
            region.name = item.name;
            region.scope = item.name.replace(/区域运营中心$/, "区域");
            region.director = supervisor?.name || "";
          });
      }
      function syncRegionDirectorChange(region, oldDirectorName, oldRegionName) {
        const oldScope = oldRegionName
          ? String(oldRegionName)
              .replace(/区域中心$/, "区域")
              .replace(/中心$/, "区域")
          : "";
        const newDirector = employees.find(
          (employee) => employee.name === region.director,
        );
        const oldDirector = employees.find(
          (employee) => employee.name === oldDirectorName,
        );
        if (oldRegionName && oldRegionName !== region.name) {
          employees
            .filter((employee) => employeeDepartmentNames(employee).includes(oldRegionName))
            .forEach((employee) =>
              setEmployeeDepartments(
                employee,
                employeeDepartmentNames(employee).map((name) =>
                  name === oldRegionName ? region.name : name,
                ),
              ),
            );
        }
        if (newDirector) syncEmployeeAccount(newDirector);
        if (oldDirector && oldDirector.name !== newDirector?.name) {
          oldDirector.updatedAt = recordCreatedAt();
          syncEmployeeAccount(oldDirector);
        }
        customers
          .filter((company) => regionForCompany(company)?.id === region.id)
          .forEach((company) => {
            company.region = regionScopeName(region);
            if (company.level === "省公司") company.owner = region.director;
          });
        contacts
          .filter((person) => {
            const company = customers.find((item) => item.name === person.company);
            return company && regionForCompany(company)?.id === region.id;
          })
          .forEach((person) => (person.region = regionScopeName(region)));
        tasks
          .filter((task) => {
            const company = customers.find((item) => item.name === task.company);
            return company && regionForCompany(company)?.id === region.id;
          })
          .forEach((task) => (task.region = regionScopeName(region)));
        maintenanceRecords
          .filter((record) => {
            const company = customers.find((item) => item.name === record.company);
            return company && regionForCompany(company)?.id === region.id;
          })
          .forEach((record) => (record.region = regionScopeName(region)));
        normalizeCustomerResponsibilities();
        syncPmEmployeeScopes();
        initAccounts();
      }
      function organizationTreeRows(parentId = null, level = 2) {
        return organizationChildren(parentId)
          .map((item) => {
            return `<div class="tree-node level-${Math.min(level, 3)} ${selectedOrganizationDepartmentId === item.id ? "active" : ""}" data-dept-id="${item.id}" data-dept="${item.name}"><span>${item.type === "region" ? "⌖" : "▦"}</span><span><strong>${item.name}</strong></span>${item.type === "region" ? '<span class="tag blue">区域中心</span>' : ""}${canEmployeeAction("employees.set_supervisor") ? `<span class="organization-node-actions"><button class="link" type="button" data-action="edit-org-department" data-id="${item.id}">管理</button></span>` : ""}</div>${organizationTreeRows(item.id, level + 1)}`;
          })
          .join("");
      }
      function organizationOptions(parentId = null, prefix = "") {
        return organizationChildren(parentId)
          .map(
            (item) =>
              `<option value="${item.name}">${prefix}${item.name}${item.type === "region" ? "（区域中心）" : ""}</option>${organizationOptions(item.id, prefix + "　")}`,
          )
          .join("");
      }
      function personnelChangeStatusTone(status) {
        if (status === "已生效") return "green";
        if (["已驳回", "生效失败"].includes(status)) return "red";
        if (status === "已通过待生效") return "blue";
        return "yellow";
      }
      function openOrganizationChangeAudit(id) {
        if (!canEmployeeAction("employees.view_changes"))
          return toast("当前角色无权查看人员或组织变动记录");
        const personnelItem = personnelChanges.find((change) => change.id === id);
        const item =
          organizationChanges.find((change) => change.id === id) ||
          (personnelItem
            ? {
                ...personnelItem,
                object: `${personnelItem.employeeName} · ${personnelItem.employeeCode}`,
                date: personnelItem.applyDate,
                detail: `部门：${escapeHtml(employeeDepartmentNames(employeeByCode(personnelItem.employeeCode)).join("、") || personnelItem.toDept)}；系统角色：${escapeHtml((personnelItem.toRoles || []).join("、"))}；${escapeHtml(personnelItem.impactSummary || "直接生效，无审批或交接")}；原因：${escapeHtml(personnelItem.reason)}`,
                actualEffectiveAt: personnelItem.appliedAt,
              }
            : null);
        if (!item) return toast("直接生效审计记录不存在");
        openDrawer(
          `<div class="drawer-head"><div><div class="modal-title">直接生效审计</div><div class="panel-sub">${item.id}</div></div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">审</div><div><div class="detail-name">${item.object}</div><div class="detail-sub">${item.type} · ${item.status}</div></div><div class="spacer"></div><span class="tag green">已生效</span></div><div class="detail-grid"><div class="detail-item"><label>生效方式</label><div>HR/admin 直接生效</div></div><div class="detail-item"><label>操作人</label><div>${item.operator}</div></div><div class="detail-item"><label>操作时间</label><div>${item.date}</div></div><div class="detail-item"><label>实际生效时间</label><div>${item.actualEffectiveAt || item.date}</div></div><div class="detail-item full"><label>变更及影响</label><div>${item.detail}</div></div></div><div class="section-title">审计说明</div><div class="role-note">系统保留操作人、操作时间及变更前后值；普通编辑与停用/恢复不创建审批、待办或抄送。</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button></div>`,
        );
      }
      function renderEmployees() {
        syncOrganizationRegions();
        const visibleEmployees = currentUser.fullAccess || currentUser.role === "hr"
          ? employees
          : employees.filter((item) => item.status === "在职");
        const rows = visibleEmployees.flatMap((employee) => {
          const memberships = employeeDepartmentNames(employee);
          return (memberships.length ? memberships : ["系统内置账号"]).map(
            (departmentName) => ({ employee, departmentName }),
          );
        });
        const canViewDirectory = canEmployeeAction("employees.view");
        const canViewChanges = canEmployeeAction("employees.view_changes");
        if (employeeView === "directory" && !canViewDirectory)
          employeeView = canViewChanges ? "changes" : "directory";
        if (employeeView === "changes" && !canViewChanges)
          employeeView = canViewDirectory ? "directory" : "changes";
        const tabs = `<section class="panel"><div class="tabs">${canViewDirectory ? `<button class="tab ${employeeView === "directory" ? "active" : ""}" data-employee-view="directory">组织与员工详情</button>` : ""}${canViewChanges ? `<button class="tab ${employeeView === "changes" ? "active" : ""}" data-employee-view="changes">人员/组织变动记录</button>` : ""}</div></section>`;
        const selectedDepartment = organizationDepartments.find(
          (department) => department.id === selectedOrganizationDepartmentId,
        );
        const selectedSupervisor = departmentSupervisor(selectedDepartment);
        const departmentSummary = selectedDepartment
          ? `<div class="company-overview" style="margin:0 0 var(--space-3)"><div class="overview-item"><label>当前部门</label><div>${departmentPath(selectedDepartment)}</div></div><div class="overview-item"><label>部门编码</label><div>${selectedDepartment.code}</div></div><div class="overview-item"><label>部门主管</label><div>${selectedSupervisor?.name || "待设置"}${selectedSupervisor ? ` · ${selectedSupervisor.code}` : ""}</div></div><div class="overview-item"><label>组织类型</label><div>${selectedDepartment.type === "region" ? "区域中心" : "普通部门"}</div></div></div>`
          : "";
        const directory = `<section class="panel" style="margin-top:var(--space-4)"><div class="toolbar employee-toolbar"><input class="input" id="employeeSearch" maxlength="100" placeholder="搜索姓名、工号或手机号后四位"><select class="input" id="employeeRole"><option value="">全部系统角色</option>${["总裁", "市场副总", "区域总监", "PM", "HR/人事"].map((role) => `<option>${role}</option>`).join("")}</select><select class="input" id="employeeStatus"><option value="">全部员工状态</option><option ${dashboardEmployeeStatusFilter === "在职" ? "selected" : ""}>在职</option>${currentUser.fullAccess || currentUser.role === "hr" ? `<option ${dashboardEmployeeStatusFilter === "停用" ? "selected" : ""}>停用</option>` : ""}</select>${currentUser.fullAccess ? `<select class="input" id="employeeAccountStatus"><option value="">全部账号状态</option><option>启用</option><option>停用</option></select>` : ""}${filterActions('<button class="btn btn-primary" id="applyEmployeeFilters" type="button">筛选</button><button class="btn" id="resetEmployeeFilters" type="button">重置</button>')}</div><div class="split-view"><div class="tree"><div class="tree-node active" data-dept-id="" data-dept="">▦ 英嘉科技</div>${organizationTreeRows()}</div><div>${departmentSummary}<div class="table-wrap"><table data-paged-table="m06-employees" style="min-width:980px"><thead><tr><th>员工</th><th>工号</th><th>当前部门行</th><th>全部部门</th><th>系统角色</th><th>手机号</th><th>员工状态</th>${currentUser.fullAccess ? "<th>账号状态</th><th>最近登录</th>" : ""}<th>操作</th></tr></thead><tbody id="employeeBody">${rows
          .map(({ employee: e, departmentName }) => {
            const i = employees.indexOf(e);
            const phone = displayEmployeePhone(e);
            const roleNames = employeeRoleNames(e);
            const department = organizationDepartments.find((item) => item.name === departmentName);
            return `<tr data-page-row data-dept-name="${departmentName}" data-role="${roleNames.join("|") || "未关联业务角色"}" data-status="${e.status}" data-account-status="${e.accountStatus}" data-search="${e.name}${e.code}${phone.slice(-4)}"><td><div class="person"><div class="avatar">${e.name[0]}</div><strong>${e.name}</strong>${department?.supervisorCode === e.code ? ' <span class="tag">主管</span>' : ""}</div></td><td><span class="tag">${e.code}</span></td><td>${departmentPath(department)}</td><td>${employeeDepartmentNames(e).map((name) => `<span class="tag">${name}</span>`).join(" ") || "—"}</td><td>${roleNames.map((role) => `<span class="tag blue">${role}</span>`).join(" ") || '<span class="tag">未关联</span>'}</td><td>${phone}</td><td><span class="tag ${e.status === "在职" ? "green" : "yellow"}">${e.status}</span></td>${currentUser.fullAccess ? `<td><span class="tag ${e.accountStatus === "启用" ? "green" : "red"}">${e.accountStatus}</span></td>` : ""}${currentUser.fullAccess ? `<td>${e.lastLogin}</td>` : ""}<td>${canViewEmployeeDetail() ? `<button class="link" data-action="employee-detail" data-id="${i}">详情</button>` : ""}${e.role !== "系统管理员" && canEmployeeAction("employees.edit_employee") && e.name !== currentUser.name ? ` · <button class="link" data-action="employee-edit" data-id="${i}">编辑员工</button>` : ""}${e.role !== "系统管理员" && canEmployeeAction("employees.suspend_employee") && e.name !== currentUser.name && e.status === "在职" ? ` · <button class="link" data-action="employee-suspend" data-id="${i}">停用</button>` : ""}${e.role !== "系统管理员" && canEmployeeAction("employees.restore_employee") && e.status === "停用" ? ` · <button class="link" data-action="employee-restore" data-id="${i}">恢复</button>` : ""}${e.role !== "系统管理员" && canEmployeeAction("employees.reset_password") && e.name !== currentUser.name ? ` · <button class="link" data-action="reset-password" data-id="${i}">重置密码</button>` : ""}</td></tr>`;
          })
          .join("") || `<tr data-empty-row><td colspan="${currentUser.fullAccess ? 10 : 8}"><div class="empty">暂无员工记录</div></td></tr>`}<tr data-filter-empty style="display:none"><td colspan="${currentUser.fullAccess ? 10 : 8}"><div class="empty">未找到符合条件的员工，请调整条件或重置筛选</div></td></tr></tbody></table></div>${tablePagination("m06-employees")}</div></div></section>`;
        const changes = [
          ...personnelChanges.map((item) => {
            return {
              date: item.applyDate || item.effectiveDate,
              object: `${item.employeeName} · ${item.employeeCode}`,
              type: item.type,
              detail: `${item.fromDept}${item.fromJob ? ` / ${item.fromJob}` : ""} → ${item.toDept || "—"}${item.toJob ? ` / ${item.toJob}` : ""}`,
              operator: item.operator,
              status: item.status,
              approver: item.approver || "—",
              actualEffectiveAt:
                item.status === "已生效"
                  ? item.appliedAt || `${item.effectiveDate} 00:00`
                  : "—",
            };
          }),
          ...organizationChanges.map((item) => ({
            ...item,
            approver: "无需审批",
            actualEffectiveAt: item.actualEffectiveAt || item.date,
          })),
        ]
          .sort((a, b) => b.date.localeCompare(a.date));
        const changePanel = `<section class="panel" style="margin-top:var(--space-4)"><div class="panel-head"><div><div class="panel-title">人员/组织变动记录</div><div class="panel-sub">员工部门/系统角色编辑及停用/恢复均由 HR/admin 直接生效</div></div></div><div class="table-wrap"><table data-paged-table="m06-changes" style="min-width:1320px"><thead><tr><th>操作时间</th><th>对象</th><th>变动类型</th><th>变更与影响</th><th>操作人</th><th>生效方式</th><th>状态</th><th>实际生效时间</th><th>操作</th></tr></thead><tbody>${changes.map((item) => `<tr data-page-row><td>${item.date}</td><td><strong>${item.object}</strong></td><td><span class="tag blue">${item.type}</span></td><td>${item.detail}</td><td>${item.operator}</td><td>${item.approver}</td><td><span class="tag ${personnelChangeStatusTone(item.status)}">${item.status}</span></td><td>${item.actualEffectiveAt}</td><td><button type="button" class="link" data-change-audit="${item.id}">查看审计</button></td></tr>`).join("") || '<tr data-empty-row><td colspan="9"><div class="empty">暂无变动记录</div></td></tr>'}</tbody></table></div>${tablePagination("m06-changes")}</section>`;
        return (
          pageHead(
            "组织与员工",
            "员工可属于多个平级部门；HR/admin 直接维护部门、角色及停用/恢复，不进入审批中心。",
            `${employeeView === "directory" && canEmployeeAction("employees.create_department") ? '<button class="btn" data-action="add-org-department">＋ 新增部门</button>' : ""}${employeeView === "directory" && canEmployeeAction("employees.create_employee") ? '<button class="btn btn-primary" data-action="add-employee">＋ 新增员工</button>' : ""}`,
          ) +
          tabs +
          (!canViewDirectory && !canViewChanges
            ? '<section class="panel" style="margin-top:var(--space-4)"><div class="empty">当前角色没有组织明细或变动记录操作权限</div></section>'
            : employeeView === "directory"
              ? directory
              : changePanel)
        );
      }
