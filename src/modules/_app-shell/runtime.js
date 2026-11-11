      const $ = (s) => document.querySelector(s);
      function formatWanMoney(value) {
        return Number.isFinite(Number(value)) ? (Number(value) / 10000).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : "不可用";
      }
      function wanMoneyInput(value) {
        return value == null ? "" : (value / 10000).toFixed(6).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
      }
      function parseWanMoney(text) {
        if (!/^(?:\d{1,6}(?:\.\d{0,6})?|\.\d{1,6})$/.test(text)) return NaN;
        const [whole, fraction = ""] = text.split(".");
        const cents = Number(whole || "0") * 1000000 + Number(fraction.padEnd(6, "0"));
        return Number.isSafeInteger(cents) ? cents / 100 : NaN;
      }
      function parseYuanMoney(text) {
        const raw = String(text).trim();
        return /^(?:\d{1,6}(?:\.\d{0,2})?|\.\d{1,2})$/.test(raw) ? Number(raw) : NaN;
      }
      function amountHistoryField(field) {
        return /^(项目金额|结账金额|应结算金额|预估金额)(（含税，元）)?$/.test(field) ? field.replace(/（含税，元）$/, "") + "（含税，万元）" : field;
      }
      function amountHistoryValue(field, value) {
        if (amountHistoryField(field) === field || value == null || value === "" || value === "—") return value;
        const raw = String(value).replace(/[,，¥￥\s]|元$/g, "");
        return raw !== "" && Number.isFinite(Number(raw)) ? formatWanMoney(Number(raw)) : value;
      }

      function filterField(label, control, className = "") {
        return `<label class="filter-field ${className}"><span class="filter-label">${label}</span>${control}</label>`;
      }
      function filterActions(actions) {
        return `<div class="filter-actions">${actions}</div>`;
      }

      const unifiedTablePaginationStates = {};
      function tablePagination(
        key,
        defaultPageSize = 20,
        pageSizeOptions = [20, 50, 100],
      ) {
        const sizeControl = pageSizeOptions.length > 1
          ? `<label class="table-page-size">每页<select class="input" data-page-size>${pageSizeOptions.map((size) => `<option value="${size}" ${defaultPageSize === size ? "selected" : ""}>${size} 条</option>`).join("")}</select></label>`
          : `<input type="hidden" data-page-size value="${defaultPageSize}">`;
        return `<div class="table-pagination" data-table-pagination="${key}"><span data-page-summary></span>${sizeControl}<button class="icon-btn" type="button" data-page-direction="prev" title="上一页" aria-label="上一页">‹</button><button class="icon-btn" type="button" data-page-direction="next" title="下一页" aria-label="下一页">›</button></div>`;
      }
      function refreshUnifiedTablePagination(key, resetPage = false) {
        const table = document.querySelector(`[data-paged-table="${key}"]`);
        const pagination = document.querySelector(
          `[data-table-pagination="${key}"]`,
        );
        if (!table || !pagination) return;
        const sizeControl = pagination.querySelector("[data-page-size]");
        const requestedPageSize = Number(sizeControl?.value || 20);
        const state = unifiedTablePaginationStates[key] || {
          page: 1,
          pageSize: requestedPageSize,
        };
        unifiedTablePaginationStates[key] = state;
        state.pageSize = requestedPageSize;
        if (resetPage) state.page = 1;
        const rows = [...table.querySelectorAll("tbody > tr[data-page-row]")];
        const filtered = rows.filter((row) => !row.classList.contains("hidden"));
        const totalPages = Math.max(Math.ceil(filtered.length / state.pageSize), 1);
        state.page = Math.min(Math.max(state.page, 1), totalPages);
        rows.forEach((row) => (row.style.display = "none"));
        filtered
          .slice((state.page - 1) * state.pageSize, state.page * state.pageSize)
          .forEach((row) => (row.style.display = ""));
        const baseEmpty = table.querySelector("tbody > tr[data-empty-row]");
        const filteredEmpty = table.querySelector("tbody > tr[data-filter-empty]");
        if (baseEmpty) baseEmpty.style.display = rows.length ? "none" : "";
        if (filteredEmpty)
          filteredEmpty.style.display = rows.length && !filtered.length ? "" : "none";
        const summary = pagination.querySelector("[data-page-summary]");
        if (summary)
          summary.textContent = `共 ${filtered.length} 条 · 第 ${state.page}/${totalPages} 页`;
        const previous = pagination.querySelector('[data-page-direction="prev"]');
        const next = pagination.querySelector('[data-page-direction="next"]');
        if (previous) previous.disabled = state.page <= 1;
        if (next) next.disabled = state.page >= totalPages;
      }
      function bindUnifiedTablePagination() {
        document.querySelectorAll("[data-table-pagination]").forEach((pagination) => {
          const key = pagination.dataset.tablePagination;
          const sizeControl = pagination.querySelector("[data-page-size]");
          if (sizeControl.type !== "hidden")
            sizeControl.onchange = () =>
              refreshUnifiedTablePagination(key, true);
          pagination.querySelectorAll("[data-page-direction]").forEach((button) => {
            button.onclick = () => {
              const state = unifiedTablePaginationStates[key] || {
                page: 1,
                pageSize: Number(
                  pagination.querySelector("[data-page-size]")?.value || 20,
                ),
              };
              unifiedTablePaginationStates[key] = state;
              state.page += button.dataset.pageDirection === "next" ? 1 : -1;
              refreshUnifiedTablePagination(key);
            };
          });
          refreshUnifiedTablePagination(key);
        });
      }

      function enhanceUnifiedFilterPresentation() {
        const wrap = (id, label) => {
          const control = $("#" + id);
          if (!control || control.closest(".filter-field")) return;
          control.insertAdjacentHTML(
            "beforebegin",
            `<label class="filter-field" data-filter-host="${id}"><span class="filter-label">${label}</span></label>`,
          );
          control.previousElementSibling.appendChild(control);
        };
        const split = (id, fields) => {
          const control = $("#" + id);
          if (!control) return;
          control.insertAdjacentHTML(
            "beforebegin",
            fields.map(([fieldId, label]) => filterField(label, `<input class="input" id="${fieldId}" maxlength="100">`)).join(""),
          );
          control.remove();
        };

        split("approvalSearch", [["approvalCode", "流程编号"], ["approvalObjectName", "业务对象名称"]]);
        split("archiveSearch", [["archiveObjectName", "对象名称"], ["archiveGroup", "所属集团"]]);
        split("employeeSearch", [["employeeName", "员工姓名"], ["employeeCode", "工号"], ["employeePhoneSuffix", "手机号后四位"]]);
        split("permissionRoleSearch", [["permissionRoleName", "角色名称"], ["permissionRoleCode", "角色编码"]]);
        split("permissionTreeSearch", [["permissionMenuSearch", "菜单/页面权限名称"], ["permissionOperationSearch", "操作权限名称"], ["permissionFieldSearch", "字段权限名称"], ["permissionAttachmentSearch", "附件权限名称"]]);
        split("regionSearch", [["regionName", "区域名称"], ["regionDepartmentCode", "部门编码"], ["regionDirector", "区域总监"]]);
        split("regionCityKeyword", [["regionCityName", "城市"], ["regionCityPmName", "PM 姓名"], ["regionCityPmCode", "PM 工号"]]);
        split("regionPmKeyword", [["regionPmName", "PM 姓名"], ["regionPmCode", "PM 工号"]]);
        split("industryConfigKeyword", [["industryConfigName", "行业名称"], ["industryConfigCode", "行业编码"]]);
        split("importSearch", [["importBatchCode", "批次编号"], ["importFileName", "文件名"]]);

        [
          ["approvalType", "业务类型"], ["approvalApplicant", "申请人"], ["approvalHandler", "当前处理人"], ["approvalStatus", "审批实例状态"], ["approvalStartDate", "发起开始日期"], ["approvalEndDate", "发起结束日期"], ["approvalCompletedStart", "完成开始日期"], ["approvalCompletedEnd", "完成结束日期"],
          ["archiveType", "对象类型"], ["archiveStatus", "业务状态"], ["archiveOperator", "实际操作人"], ["archiveRegion", "所属区域"], ["archiveEffectiveStart", "生效开始日期"], ["archiveEffectiveEnd", "生效结束日期"],
          ["employeeRole", "系统角色"], ["employeeStatus", "员工状态"], ["employeeAccountStatus", "账号状态"],
          ["regionProvinceFilter", "省份"], ["regionCityProvince", "省份"], ["regionCityPmStatus", "PM 分配状态"],
          ["ruleConfigKeyword", "规则名称"], ["ruleConfigType", "规则类型"], ["ruleConfigStatus", "状态"], ["industryConfigStatus", "状态"],
          ["importTemplateType", "模板类型"], ["importStatusSelect", "批次状态"], ["importCreator", "创建人"], ["importStartDate", "创建开始日期"], ["importEndDate", "创建结束日期"], ["importException", "异常情况"],
        ].forEach(([id, label]) => wrap(id, label));
        document.querySelectorAll(".filter-field").forEach((field) =>
          field.closest(".toolbar")?.classList.add("filter-toolbar"),
        );
        document.querySelectorAll(".permission-workspace .section-title").forEach((title) => {
          const section = title.textContent.includes("菜单")
            ? "menu"
            : title.textContent.includes("操作")
              ? "operation"
              : title.textContent.includes("字段")
                ? "field"
                : title.textContent.includes("附件")
                  ? "attachment"
                  : "";
          if (!section) return;
          let sibling = title.nextElementSibling;
          while (sibling && !sibling.classList.contains("section-title")) {
            if (sibling.classList.contains("permission-tree-group"))
              sibling.dataset.permissionSection = section;
            sibling = sibling.nextElementSibling;
          }
        });
      }
      function validateAttachmentFiles(fileList, required = false) {
        const files = Array.from(fileList || []);
        const allowed = new Set([
          "jpg", "jpeg", "png", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        ]);
        if (required && !files.length) return "请至少上传一项证明材料";
        if (files.length > 9) return "单个对象最多上传 9 个附件";
        if (files.some((file) => !allowed.has(file.name.split(".").pop()?.toLowerCase())))
          return "附件格式仅支持 JPG、PNG、PDF 和常用 Office 文档";
        if (files.some((file) => file.size > 20 * 1024 * 1024))
          return "单个附件不能超过 20 MB";
        if (files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024)
          return "附件总大小不能超过 100 MB";
        return "";
      }
      const accountRoleTemplateNames = {
        president: "总裁",
        vp: "市场副总",
        director: "区域总监",
        pm: "PM",
        hr: "HR/人事",
        ecology: "生态合作员",
        finance: "财务",
        teacher: "老师",
        teachingManager: "教学管理人员",
        support: "商机支撑",
        admin: "系统管理员",
      };
      const currentRoleTemplateNames = () => [
        ...(currentUser?.roles || []),
        accountRoleTemplateNames[currentUser?.role],
      ].filter((name, index, all) => name && all.indexOf(name) === index);
      const currentRoleTemplates = () =>
        currentRoleTemplateNames()
          .map((name) =>
            systemRoleTemplates.find((template) => template.name === name),
          )
          .filter(Boolean);
      const currentRoleTemplate = () => currentRoleTemplates()[0];
      const isPmCityManagementUser = () =>
        Boolean(
          currentUser &&
            !currentUser.fullAccess &&
            currentRoleTemplateNames().includes("PM"),
        );
      const isAdminOnlyProjectConfigPage = (page) =>
        ["packages", "platform-companies"].includes(page);
      const isProjectConfigAdmin = () =>
        Boolean(currentUser?.username === "admin" && currentUser?.role === "admin" && currentUser?.fullAccess);
      const templatePagePermissionAllowed = (template, permission) =>
        permission === "employee-usage" ? true :
        template.name === "财务" ? ["dashboard", "projects"].includes(permission) :
        (["老师", "教学管理人员"].includes(template.name) ? permission === "teachers" : template.name !== "生态合作员" || ["dashboard", "projects", "opportunities"].includes(permission));
      const hasPermission = (permission) =>
        permission === "frameworks" ? hasPermission("projects") && currentRoleTemplateNames().some(role => ["系统管理员", "总裁", "市场副总", "区域总监", "PM"].includes(role)) :
        (!isAdminOnlyProjectConfigPage(permission) || isProjectConfigAdmin()) &&
        currentRoleTemplates().some((template) =>
          templatePagePermissionAllowed(template, permission) && template.permissions.includes(permission),
        );
      const hasDataObject = (object) =>
        currentRoleTemplates().some((template) => template.objects.includes(object));
      const currentScopeType = () => {
        // 财务的公司范围仅用于项目读取，不扩张兼任角色的客户、商机或写范围。
        const scopeTypes = currentRoleTemplates().filter(template => template.name !== "财务").map(
          (template) => template.scopeType,
        );
        return [
          "company",
          "market",
          "regions",
          "cities",
          "organization",
          "technical",
        ].find((scopeType) => scopeTypes.includes(scopeType)) || "technical";
      };
      const roleCanSeeBusiness = () => hasDataObject("客户单位");
      const canAccessPage = (page) => {
        if (["approvals", "archive", "sales-dashboard"].includes(page)) return false;
        if (page === "employee-usage") return employeeUsageAccess();
        if (page === "teacher-work") return (hasPermission("teacher-work") || teacherIsFacultySupervisor()) && teacherWorkAccess();
        if (page === "teacher-recommendations") return hasPermission("teacher-recommendations") && Boolean(teacherWorkSelf());
        if (page === "support-results") return salesCanViewSupportResults();
        if (page === "teacher-schedule" && teacherHasMarketSchedule()) return true;
        if (["teachers", "teacher-schedule"].includes(page)) return (typeof teacherIsFacultySupervisor === "function" && teacherIsFacultySupervisor()) || (hasPermission("teachers") && currentRoleTemplateNames().some((role) => ["系统管理员", "总裁", "市场副总", "老师", "教学管理人员"].includes(role)));
        if (page === "operations") return roleCanSeeBusiness();
        if (page === "city-management")
          return isPmCityManagementUser() && hasPermission(page);
        if (page === "regions" && isPmCityManagementUser()) return false;
        if (page === "project-detail") return hasPermission("projects");
        if (page === "project-create") return hasPermission("projects") && hasOperationPermission("projects.create");
        if (page === "project-edit") return hasPermission("projects") && hasOperationPermission("projects.edit");
        if (page === "opportunity-detail") return hasPermission("opportunities") || salesCanViewSupportOpportunity(opportunities.find((item) => item.id === selectedOpportunityId));
        if (page === "opportunity-create") return hasPermission("opportunities");
        if (page === "sales-supports") {
          if (!hasPermission("sales-supports")) return false;
          if (currentUser?.fullAccess) return true;
          return salesCurrentSupportEmployee() !== null;
        }
        return hasPermission(page);
      };
      const hasOperationPermission = (operation) =>
        Boolean(
          (operation !== "opportunities.support" || currentUser?.fullAccess || salesCurrentSupportEmployee() !== null) &&
          (!isAdminOnlyProjectConfigPage(operation.split(".")[0]) || isProjectConfigAdmin()) &&
          ((operation.startsWith("teachers.") && typeof teacherIsFacultySupervisor === "function" && teacherIsFacultySupervisor()) || currentUser?.fullAccess ||
            currentRoleTemplateNames().some((roleName) =>
              (roleName !== "财务" || FINANCE_OPERATIONS.includes(operation)) && (!["老师", "教学管理人员"].includes(roleName) || operation.startsWith("teachers.")) && (roleName !== "生态合作员" || ["dashboard.view", "projects.view", "projects.create", "projects.edit", "opportunities.view", "opportunities.create", "opportunities.progress"].includes(operation)) && roleOperationPermissions?.[roleName]?.includes(operation),
            )),
        );
      const hasFieldPermission = (permission) =>
        Boolean(
          (permission.startsWith("teacher_") && typeof teacherIsFacultySupervisor === "function" && teacherIsFacultySupervisor()) || currentUser?.fullAccess ||
            currentRoleTemplateNames().some((roleName) =>
              roleName !== "财务" && roleFieldPermissions?.[roleName]?.includes(permission),
            ),
        );
      const hasAttachmentPermission = (permission) =>
        Boolean(
          (permission.startsWith("teacher_") && typeof teacherIsFacultySupervisor === "function" && teacherIsFacultySupervisor()) || currentUser?.fullAccess ||
            currentRoleTemplateNames().some((roleName) =>
              (roleName !== "财务" || FINANCE_ATTACHMENTS.includes(permission)) && roleAttachmentPermissions?.[roleName]?.includes(permission),
            ),
        );
      const canEmployeeAction = (operation) =>
        Boolean(currentUser?.fullAccess || hasOperationPermission(operation));
      const assignedCitiesForCurrentUser = () =>
        currentScopeType() === "cities"
          ? [...new Set(customers.filter(company => !company.archived && company.level !== "省公司" &&
              customerOwnerName(company) === currentUser.name).map(company => customerBusinessCity(company)))]
          : [];
      const adminArea = (c) =>
        [
          customerBusinessProvince(c),
          customerBusinessCity(c),
          customerBusinessDistrict(c),
        ]
          .filter(Boolean)
          .join(" / ");
      const regionScopeName = (region) => {
        if (region?.scope) return region.scope;
        const name = String(region?.name || "").trim();
        if (!name) return "待配置区域";
        return name
          .replace(/区域运营中心$/, "区域")
          .replace(/区域中心$/, "区域")
          .replace(/中心$/, "区域");
      };
      const regionForName = (regionName) =>
        regionsData.find(
          (region) =>
            region.name === regionName || regionScopeName(region) === regionName,
        );
      const regionsMatch = (left, right) => {
        const leftRegion = regionForName(left);
        const rightRegion = regionForName(right);
        if (leftRegion && rightRegion) return leftRegion.id === rightRegion.id;
        return String(left || "") === String(right || "");
      };
      const regionForCompany = (company) => operatingCenterForCustomer(company);
      const customerRegionLabel = (company) =>
        regionForCompany(company)?.name || company?.region || "待配置区域";
      const customerRegionScope = (company) =>
        regionScopeName(regionForCompany(company)) ||
        company?.region ||
        "待配置区域";
      const regionDirectorForCustomer = (company) => {
        const region = regionForCompany(company);
        return region?.director || company?.owner || "待配置";
      };
      const customerOwnerName = (company) => responsibilityOwnerForCustomer(customerResponsibilityFacts(company)) || "待分配";
      const contactOwnerName = (person) =>
        customerOwnerName(
          customers.find((company) => company.name === person?.company),
        );
      const accountForEmployeeName = (name) =>
        accounts.find((account) => account.name === name);
      const employeeRoleAccountMap = {
        总裁: "president",
        市场副总: "vp",
        区域总监: "director",
        PM: "pm",
        "HR/人事": "hr",
        生态合作员: "ecology",
        财务: "finance",
        老师: "teacher",
        教学管理人员: "teachingManager",
        商机支撑: "support",
        系统管理员: "admin",
      };
      function calculatedEmployeeScope(employee) {
        if (!employee || employee.status !== "在职") return "已停用";
        if (employeeHasRole(employee, "总裁")) return "公司全局";
        if (employeeHasRole(employee, "市场副总")) return "全国市场";
        if (employeeHasRole(employee, "区域总监")) {
          const regions = regionsData
            .filter((item) => item.director === employee.name)
            .map((item) => regionScopeName(item));
          return regions.join("、") || "待配置区域";
        }
        if (employeeHasRole(employee, "PM")) {
          const cities = [...new Set(customers.filter(company => !company.archived && company.level !== "省公司" && responsibilityOwnerForCustomer(company) === employee.name).map(customerBusinessCity))];
          return cities.join("、") || "待配置负责地市";
        }
        if (employeeHasRole(employee, "生态合作员")) return "本人平台师资合作项目及商机";
        if (employeeHasRole(employee, "财务")) return "公司全部项目";
        if (employeeHasRole(employee, "HR/人事")) return "公司组织";
        const template = systemRoleTemplates.find(
          (item) => item.name === employee.role,
        );
        return roleTemplateScopeText(template) || "待配置";
      }
      function syncEmployeeAccount(employee, credentials = {}) {
        if (!employee) return null;
        employee.scope = calculatedEmployeeScope(employee);
        let account = accountForEmployeeName(employee.name);
        if (!account && credentials.phone) {
          account = {
            username: employee.code.toLowerCase(),
            phone: credentials.phone,
            password: credentials.password || "123456",
            name: employee.name,
          };
          accounts.push(account);
        }
        if (!account) return null;
        account.employeeCode = employee.code;
        account.phone = employee.phone;
        const effectiveRoles = employee.role === "系统管理员"
          ? ["系统管理员"]
          : employeeRoleNames(employee);
        const primaryEffectiveRole = [
          "系统管理员",
          "总裁",
          "市场副总",
          "区域总监",
          "PM",
          "生态合作员",
          "财务",
          "HR/人事",
          "商机支撑",
          "教学管理人员",
          "老师",
        ].find((roleName) => effectiveRoles.includes(roleName));
        account.roles = effectiveRoles;
        account.role = employeeRoleAccountMap[primaryEffectiveRole];
        const managedRegion = regionsData.find(
          (item) => item.director === employee.name,
        );
        account.roleName = effectiveRoles.length > 1
          ? effectiveRoles.join(" / ")
          : primaryEffectiveRole === "PM"
            ? "项目经理（PM）"
            : primaryEffectiveRole === "区域总监" && managedRegion
              ? `${regionScopeName(managedRegion)}总监`
              : primaryEffectiveRole || employee.role;
        account.region = employee.scope;
        account.disabled = employee.status !== "在职";
        return account;
      }
      const regionPmEmployees = (region) => {
        if (!region) return [];
        const department = organizationDepartments.find(
          (item) => item.regionId === region.id,
        );
        const departmentNames = department
          ? organizationDescendantNames(department.id)
          : [region.name];
        return employees.filter(
          (employee) =>
            employee.status === "在职" &&
            employeeHasRole(employee, "PM") &&
            departmentNames.some((name) =>
              employeeDepartmentNames(employee).includes(name),
            ),
        );
      };
      const regionDirectorName = (regionName) =>
        regionForName(regionName)?.director || "待配置区域总监";
      function activeApprovalCollaborationNode(approval) {
        return (approval.collaborationNodes || []).find(
          (node) => node.state === "current",
        );
      }
      function collaborationNodeState(node) {
        if (node.state === "rejected" || node.members?.some((member) => member.state === "rejected"))
          return "rejected";
        if (node.members?.length && node.members.every((member) => member.state === "done"))
          return "done";
        if (node.state === "current" || node.members?.some((member) => member.state === "current"))
          return "current";
        return node.state || "upcoming";
      }
      function approvalCurrentAssignees(approval) {
        if (approval.status === "paused_invalid_handler")
          return approval.currentAssignees?.length
            ? [...approval.currentAssignees]
            : approval.invalidHandler
              ? [approval.invalidHandler]
              : [];
        if (approval.status !== "pending") return [];
        const collaborationNode = activeApprovalCollaborationNode(approval);
        if (collaborationNode)
          return collaborationNode.members
            .filter((member) => member.state === "current")
            .map((member) => member.name);
        if (approval.currentAssignees?.length)
          return [...approval.currentAssignees];
        if (approval.current === "目标PM接收" && approval.targetPm)
          return [approval.targetPm];
        if (approval.current === "区域总监审批")
          return [regionDirectorName(approval.region)];
        if (approval.current?.includes("总裁")) return ["刘总"];
        return [];
      }
      function approvalCcUsers(approval) {
        if (approval.ccUsers?.length) return [...approval.ccUsers];
        if (approval.cc?.length)
          return approval.cc
            .map((name) =>
              name === "市场副总"
                ? "王静"
                : name === "总裁"
                  ? "刘总"
                  : name,
            )
            .filter(Boolean);
        return ["王静", "刘总"].filter(
          (name) => name !== approval.applicant,
        );
      }
      const approvalHandledBy = (approval) =>
        [
          ...(approval.handledBy || []),
          approval.decidedBy,
          approval.acceptedBy,
          approval.rejectedBy,
        ].filter(Boolean);
      function normalizeApprovalRouting() {
        approvals.forEach((approval) => {
          approval.currentAssignees = approvalCurrentAssignees(approval);
          approval.ccUsers = approvalCcUsers(approval);
          approval.handledBy = [...new Set(approvalHandledBy(approval))];
        });
      }
      function approvalVisibleToCurrentUser(approval) {
        if (
          !currentUser ||
          !hasOperationPermission("approvals.view") ||
          (currentUser.role === "admin" && !currentUser.fullAccess)
        )
          return false;
        if (currentUser.fullAccess) return true;
        if (["president", "vp"].includes(currentUser.role))
          return (
            approval.applicant === currentUser.name ||
            approvalCurrentAssignees(approval).includes(currentUser.name) ||
            approvalCcUsers(approval).includes(currentUser.name) ||
            approvalHandledBy(approval).includes(currentUser.name)
          );
        if (currentUser.role === "director")
          return (
            regionsMatch(approval.region, currentUser.region) ||
            approval.applicant === currentUser.name ||
            approvalCurrentAssignees(approval).includes(currentUser.name) ||
            approvalCcUsers(approval).includes(currentUser.name) ||
            approvalHandledBy(approval).includes(currentUser.name)
          );
        return (
          approval.applicant === currentUser.name ||
          approval.targetPm === currentUser.name ||
          approvalCurrentAssignees(approval).includes(currentUser.name) ||
          approvalCcUsers(approval).includes(currentUser.name) ||
          approvalHandledBy(approval).includes(currentUser.name)
        );
      }
      function visibleApprovalsForCurrentUser() {
        normalizeApprovalRouting();
        return approvals.filter(approvalVisibleToCurrentUser);
      }
      function approvalsForView(view = approvalView) {
        const visible = visibleApprovalsForCurrentUser();
        if (view === "pending")
          return visible.filter(
            (approval) =>
              ["pending", "paused_invalid_handler"].includes(approval.status) &&
              (currentUser.fullAccess ||
                approvalCurrentAssignees(approval).includes(currentUser.name)),
          );
        if (view === "mine")
          return visible.filter(
            (approval) => approval.applicant === currentUser.name,
          );
        if (view === "cc")
          return visible.filter((approval) =>
            approvalCcUsers(approval).includes(currentUser.name),
          );
        if (view === "done")
          return visible.filter(
            (approval) =>
              currentUser.fullAccess
                ? !["pending", "paused_invalid_handler"].includes(approval.status)
                : approvalHandledBy(approval).includes(currentUser.name),
          );
        return visible;
      }
      const contactLevelLabels = {
        一级: "一级",
        二级: "二级",
        三级: "三级",
        四级: "四级",
        其他: "其他",
      };
      const contactLevelOptions = (selectedLevel = "") =>
        Object.keys(contactLevelLabels)
          .map(
            (level) =>
              `<option value="${level}" ${level === selectedLevel ? "selected" : ""}>${contactLevelLabels[level]}</option>`,
          )
          .join("");
      const normalizePositionText = (value) =>
        String(value || "").trim().replace(/\s+/g, " ");
      const contactPositionCatalog = [
        {"id": "POS-REL-0001-DEPT-1011","group": "华北云网集团","company": "华北云网集团山东有限公司","departmentId": 1011,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1011","group": "华北云网集团","company": "华北云网集团山东有限公司","departmentId": 1011,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1012","group": "华北云网集团","company": "华北云网集团山东有限公司","departmentId": 1012,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1012","group": "华北云网集团","company": "华北云网集团山东有限公司","departmentId": 1012,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1021","group": "华北云网集团","company": "华北云网集团济南分公司","departmentId": 1021,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1021","group": "华北云网集团","company": "华北云网集团济南分公司","departmentId": 1021,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1022","group": "华北云网集团","company": "华北云网集团济南分公司","departmentId": 1022,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1022","group": "华北云网集团","company": "华北云网集团济南分公司","departmentId": 1022,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1031","group": "华信通信集团","company": "华信通信集团泰安分公司","departmentId": 1031,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1031","group": "华信通信集团","company": "华信通信集团泰安分公司","departmentId": 1031,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1032","group": "华信通信集团","company": "华信通信集团泰安分公司","departmentId": 1032,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1032","group": "华信通信集团","company": "华信通信集团泰安分公司","departmentId": 1032,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1041","group": "国网产业协同集团","company": "国网产业协同集团青岛分公司","departmentId": 1041,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1041","group": "国网产业协同集团","company": "国网产业协同集团青岛分公司","departmentId": 1041,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1042","group": "国网产业协同集团","company": "国网产业协同集团青岛分公司","departmentId": 1042,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1042","group": "国网产业协同集团","company": "国网产业协同集团青岛分公司","departmentId": 1042,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1051","group": "华东能源控股","company": "华东能源控股山东有限公司","departmentId": 1051,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1051","group": "华东能源控股","company": "华东能源控股山东有限公司","departmentId": 1051,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1052","group": "华东能源控股","company": "华东能源控股山东有限公司","departmentId": 1052,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1052","group": "华东能源控股","company": "华东能源控股山东有限公司","departmentId": 1052,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1061","group": "齐鲁数科集团","company": "齐鲁数科集团江苏有限公司","departmentId": 1061,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1061","group": "齐鲁数科集团","company": "齐鲁数科集团江苏有限公司","departmentId": 1061,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1062","group": "齐鲁数科集团","company": "齐鲁数科集团江苏有限公司","departmentId": 1062,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1062","group": "齐鲁数科集团","company": "齐鲁数科集团江苏有限公司","departmentId": 1062,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1071","group": "华北云网集团","company": "华北云网集团南京分公司","departmentId": 1071,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1071","group": "华北云网集团","company": "华北云网集团南京分公司","departmentId": 1071,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1072","group": "华北云网集团","company": "华北云网集团南京分公司","departmentId": 1072,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1072","group": "华北云网集团","company": "华北云网集团南京分公司","departmentId": 1072,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1081","group": "华东能源控股","company": "华东能源控股浙江有限公司","departmentId": 1081,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1081","group": "华东能源控股","company": "华东能源控股浙江有限公司","departmentId": 1081,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1082","group": "华东能源控股","company": "华东能源控股浙江有限公司","departmentId": 1082,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1082","group": "华东能源控股","company": "华东能源控股浙江有限公司","departmentId": 1082,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1091","group": "齐鲁数科集团","company": "齐鲁数科集团历下分公司","departmentId": 1091,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1091","group": "齐鲁数科集团","company": "齐鲁数科集团历下分公司","departmentId": 1091,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1092","group": "齐鲁数科集团","company": "齐鲁数科集团历下分公司","departmentId": 1092,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1092","group": "齐鲁数科集团","company": "齐鲁数科集团历下分公司","departmentId": 1092,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1101","group": "齐鲁数科集团","company": "齐鲁数科集团烟台分公司","departmentId": 1101,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1101","group": "齐鲁数科集团","company": "齐鲁数科集团烟台分公司","departmentId": 1101,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1102","group": "齐鲁数科集团","company": "齐鲁数科集团烟台分公司","departmentId": 1102,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1102","group": "齐鲁数科集团","company": "齐鲁数科集团烟台分公司","departmentId": 1102,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1111","group": "华信通信集团","company": "华信通信集团烟台分公司","departmentId": 1111,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1111","group": "华信通信集团","company": "华信通信集团烟台分公司","departmentId": 1111,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1112","group": "华信通信集团","company": "华信通信集团烟台分公司","departmentId": 1112,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1112","group": "华信通信集团","company": "华信通信集团烟台分公司","departmentId": 1112,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1121","group": "齐鲁数科集团","company": "齐鲁数科集团济南分公司","departmentId": 1121,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1121","group": "齐鲁数科集团","company": "齐鲁数科集团济南分公司","departmentId": 1121,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1122","group": "齐鲁数科集团","company": "齐鲁数科集团济南分公司","departmentId": 1122,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1122","group": "齐鲁数科集团","company": "齐鲁数科集团济南分公司","departmentId": 1122,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1131","group": "华信通信集团","company": "华信通信集团济南分公司","departmentId": 1131,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1131","group": "华信通信集团","company": "华信通信集团济南分公司","departmentId": 1131,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1132","group": "华信通信集团","company": "华信通信集团济南分公司","departmentId": 1132,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1132","group": "华信通信集团","company": "华信通信集团济南分公司","departmentId": 1132,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1141","group": "华信通信集团","company": "华信通信集团市中分公司","departmentId": 1141,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1141","group": "华信通信集团","company": "华信通信集团市中分公司","departmentId": 1141,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1142","group": "华信通信集团","company": "华信通信集团市中分公司","departmentId": 1142,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1142","group": "华信通信集团","company": "华信通信集团市中分公司","departmentId": 1142,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1151","group": "国网产业协同集团","company": "国网产业协同集团福山分公司","departmentId": 1151,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1151","group": "国网产业协同集团","company": "国网产业协同集团福山分公司","departmentId": 1151,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1152","group": "国网产业协同集团","company": "国网产业协同集团福山分公司","departmentId": 1152,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1152","group": "国网产业协同集团","company": "国网产业协同集团福山分公司","departmentId": 1152,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1161","group": "齐鲁数科集团","company": "齐鲁数科集团无锡分公司","departmentId": 1161,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1161","group": "齐鲁数科集团","company": "齐鲁数科集团无锡分公司","departmentId": 1161,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1162","group": "齐鲁数科集团","company": "齐鲁数科集团无锡分公司","departmentId": 1162,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1162","group": "齐鲁数科集团","company": "齐鲁数科集团无锡分公司","departmentId": 1162,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1171","group": "华信通信集团","company": "华信通信集团合肥分公司","departmentId": 1171,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1171","group": "华信通信集团","company": "华信通信集团合肥分公司","departmentId": 1171,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1172","group": "华信通信集团","company": "华信通信集团合肥分公司","departmentId": 1172,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1172","group": "华信通信集团","company": "华信通信集团合肥分公司","departmentId": 1172,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1181","group": "齐鲁数科集团","company": "齐鲁数科集团浙江有限公司","departmentId": 1181,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1181","group": "齐鲁数科集团","company": "齐鲁数科集团浙江有限公司","departmentId": 1181,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1182","group": "齐鲁数科集团","company": "齐鲁数科集团浙江有限公司","departmentId": 1182,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1182","group": "齐鲁数科集团","company": "齐鲁数科集团浙江有限公司","departmentId": 1182,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1191","group": "齐鲁数科集团","company": "齐鲁数科集团杭州分公司","departmentId": 1191,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1191","group": "齐鲁数科集团","company": "齐鲁数科集团杭州分公司","departmentId": 1191,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1192","group": "齐鲁数科集团","company": "齐鲁数科集团杭州分公司","departmentId": 1192,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1192","group": "齐鲁数科集团","company": "齐鲁数科集团杭州分公司","departmentId": 1192,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1201","group": "华北云网集团","company": "华北云网集团宁波分公司","departmentId": 1201,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1201","group": "华北云网集团","company": "华北云网集团宁波分公司","departmentId": 1201,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1202","group": "华北云网集团","company": "华北云网集团宁波分公司","departmentId": 1202,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1202","group": "华北云网集团","company": "华北云网集团宁波分公司","departmentId": 1202,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1211","group": "华东能源控股","company": "华东能源控股温州分公司","departmentId": 1211,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1211","group": "华东能源控股","company": "华东能源控股温州分公司","departmentId": 1211,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1212","group": "华东能源控股","company": "华东能源控股温州分公司","departmentId": 1212,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1212","group": "华东能源控股","company": "华东能源控股温州分公司","departmentId": 1212,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1221","group": "齐鲁数科集团","company": "齐鲁数科集团福建有限公司","departmentId": 1221,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1221","group": "齐鲁数科集团","company": "齐鲁数科集团福建有限公司","departmentId": 1221,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1222","group": "齐鲁数科集团","company": "齐鲁数科集团福建有限公司","departmentId": 1222,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1222","group": "齐鲁数科集团","company": "齐鲁数科集团福建有限公司","departmentId": 1222,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1231","group": "齐鲁数科集团","company": "齐鲁数科集团福州分公司","departmentId": 1231,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1231","group": "齐鲁数科集团","company": "齐鲁数科集团福州分公司","departmentId": 1231,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1232","group": "齐鲁数科集团","company": "齐鲁数科集团福州分公司","departmentId": 1232,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1232","group": "齐鲁数科集团","company": "齐鲁数科集团福州分公司","departmentId": 1232,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1241","group": "华北云网集团","company": "华北云网集团广州分公司","departmentId": 1241,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1241","group": "华北云网集团","company": "华北云网集团广州分公司","departmentId": 1241,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1242","group": "华北云网集团","company": "华北云网集团广州分公司","departmentId": 1242,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1242","group": "华北云网集团","company": "华北云网集团广州分公司","departmentId": 1242,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1251","group": "华信通信集团","company": "华信通信集团南宁分公司","departmentId": 1251,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1251","group": "华信通信集团","company": "华信通信集团南宁分公司","departmentId": 1251,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1252","group": "华信通信集团","company": "华信通信集团南宁分公司","departmentId": 1252,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1252","group": "华信通信集团","company": "华信通信集团南宁分公司","departmentId": 1252,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1261","group": "国网产业协同集团","company": "国网产业协同集团山东省公司","departmentId": 1261,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1261","group": "国网产业协同集团","company": "国网产业协同集团山东省公司","departmentId": 1261,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1262","group": "国网产业协同集团","company": "国网产业协同集团山东省公司","departmentId": 1262,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1262","group": "国网产业协同集团","company": "国网产业协同集团山东省公司","departmentId": 1262,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1271","group": "国网产业协同集团","company": "国网产业协同集团济南市公司","departmentId": 1271,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1271","group": "国网产业协同集团","company": "国网产业协同集团济南市公司","departmentId": 1271,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1272","group": "国网产业协同集团","company": "国网产业协同集团济南市公司","departmentId": 1272,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1272","group": "国网产业协同集团","company": "国网产业协同集团济南市公司","departmentId": 1272,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1281","group": "国网产业协同集团","company": "国网产业协同集团历下区县公司","departmentId": 1281,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1281","group": "国网产业协同集团","company": "国网产业协同集团历下区县公司","departmentId": 1281,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1282","group": "国网产业协同集团","company": "国网产业协同集团历下区县公司","departmentId": 1282,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1282","group": "国网产业协同集团","company": "国网产业协同集团历下区县公司","departmentId": 1282,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1291","group": "华北云网集团","company": "华北云网集团青岛分公司","departmentId": 1291,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1291","group": "华北云网集团","company": "华北云网集团青岛分公司","departmentId": 1291,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1292","group": "华北云网集团","company": "华北云网集团青岛分公司","departmentId": 1292,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1292","group": "华北云网集团","company": "华北云网集团青岛分公司","departmentId": 1292,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1301","group": "华北云网集团","company": "华北云网集团崂山分公司","departmentId": 1301,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1301","group": "华北云网集团","company": "华北云网集团崂山分公司","departmentId": 1301,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1302","group": "华北云网集团","company": "华北云网集团崂山分公司","departmentId": 1302,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1302","group": "华北云网集团","company": "华北云网集团崂山分公司","departmentId": 1302,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1311","group": "齐鲁数科集团","company": "齐鲁数科集团青岛分公司","departmentId": 1311,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1311","group": "齐鲁数科集团","company": "齐鲁数科集团青岛分公司","departmentId": 1311,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1312","group": "齐鲁数科集团","company": "齐鲁数科集团青岛分公司","departmentId": 1312,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1312","group": "齐鲁数科集团","company": "齐鲁数科集团青岛分公司","departmentId": 1312,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1321","group": "","company": "泉城数智服务有限公司","departmentId": 1321,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1321","group": "","company": "泉城数智服务有限公司","departmentId": 1321,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1322","group": "","company": "泉城数智服务有限公司","departmentId": 1322,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1322","group": "","company": "泉城数智服务有限公司","departmentId": 1322,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1331","group": "","company": "鲁能绿色技术有限公司","departmentId": 1331,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1331","group": "","company": "鲁能绿色技术有限公司","departmentId": 1331,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1332","group": "","company": "鲁能绿色技术有限公司","departmentId": 1332,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1332","group": "","company": "鲁能绿色技术有限公司","departmentId": 1332,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1341","group": "华东能源控股","company": "华东能源控股江苏有限公司","departmentId": 1341,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1341","group": "华东能源控股","company": "华东能源控股江苏有限公司","departmentId": 1341,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1342","group": "华东能源控股","company": "华东能源控股江苏有限公司","departmentId": 1342,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1342","group": "华东能源控股","company": "华东能源控股江苏有限公司","departmentId": 1342,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0001-DEPT-1351","group": "华东能源控股","company": "华东能源控股广东有限公司","departmentId": 1351,"code": "POS00000001","name": "人力资源分管领导","aliases": [],"sort": 10,"status": "正常","positionAtomId": "POS-ATOM-0001","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0004-DEPT-1351","group": "华东能源控股","company": "华东能源控股广东有限公司","departmentId": 1351,"code": "POS00000004","name": "关键决策人","aliases": [],"sort": 40,"status": "正常","positionAtomId": "POS-ATOM-0004","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0002-DEPT-1352","group": "华东能源控股","company": "华东能源控股广东有限公司","departmentId": 1352,"code": "POS00000002","name": "培训负责人","aliases": [],"sort": 20,"status": "正常","positionAtomId": "POS-ATOM-0002","updatedAt": "2026-10-27 09:00"},
        {"id": "POS-REL-0003-DEPT-1352","group": "华东能源控股","company": "华东能源控股广东有限公司","departmentId": 1352,"code": "POS00000003","name": "项目经理","aliases": [],"sort": 30,"status": "正常","positionAtomId": "POS-ATOM-0003","updatedAt": "2026-10-27 09:00"},
      ];
      function customerDepartmentPath(department) {
        if (!department) return "待配置部门";
        const names = [department.name];
        const visited = new Set([department.id]);
        let parentName = department.parent;
        while (parentName && parentName !== "—") {
          const parent = customerDepartments.find(
            (item) =>
              item.company === department.company &&
              item.name === parentName &&
              !visited.has(item.id),
          );
          if (!parent) break;
          names.unshift(parent.name);
          visited.add(parent.id);
          parentName = parent.parent;
        }
        return names.join(" / ");
      }
      const customerDepartmentsForCompany = (companyName) =>
        customerDepartments.filter(
          (department) =>
            !department.archived && department.company === companyName,
        );
      const contactPositionsForDepartment = (departmentId) =>
        contactPositionCatalog.filter(
          (position) =>
            position.status === "正常" &&
            String(position.departmentId) === String(departmentId),
        );
      contacts.forEach((person, index) => {
        const company = customers.find((item) => item.name === person.company);
        const candidates = contactPositionCatalog.filter(
          (position) =>
            position.status === "正常" && position.company === company?.name,
        );
        const matched = candidates.find((position) =>
          [position.name, ...position.aliases].some((name) =>
            String(person.title || "").includes(name.replace(/负责人$/, "")),
          ),
        );
        person.positionSource = "standard";
        person.positionId = person.positionId || matched?.id || "";
        person.positionName = person.positionName || matched?.name || candidates[0]?.name || "待维护岗位";
        person.effectiveDate = person.effectiveDate || "2025-11-01";
        person.source = person.source || "manual";
        person.updatedAt = person.updatedAt || person.createdAt || "2026-08-17 09:30";
      });
      const canCreateMaintenanceRecord = () =>
        Boolean(hasOperationPermission("tasks.create_record"));
      const canCreateCustomerGroup = () =>
        Boolean(currentUser?.fullAccess && hasOperationPermission("customers.create_group"));
      const canCreateCustomerUnit = () =>
        Boolean(currentUser?.fullAccess && hasOperationPermission("customers.create_unit"));
      const canMaintainContactForCompany = (
        company,
        operation = "customers.create_contact",
      ) =>
        Boolean(
          company &&
            !company.archived &&
            hasDataObject("客户单位") &&
            hasDataObject("关键人") &&
            hasOperationPermission(operation) &&
            (currentUser?.fullAccess ||
              (currentUser?.role === "pm" && companyIsVisible(company)) ||
              (currentUser?.role === "director" &&
                (operation === "customers.create_contact" || customerOwnerName(company) === currentUser.name) &&
                companyInCurrentManagedRegion(company) &&
                companyIsVisible(company))),
        );
      const canMaintainContact = (person) =>
        canMaintainContactForCompany(
          customers.find((company) => company.name === person?.company),
          "customers.edit_contact",
        );
      const canTransferContact = (person) =>
        canMaintainContactForCompany(
          customers.find((company) => company.name === person?.company),
          "customers.transfer_contact",
        );
      const canCreateMaintenanceForPerson = (person) => {
        if (!person || !canCreateMaintenanceRecord()) return false;
        if (currentUser.role !== "director") return true;
        const company = customers.find((item) => item.name === person.company);
        return Boolean(company && customerOwnerName(company) === currentUser.name);
      };
      const canEditMaintenanceRecord = (record) =>
        Boolean(
          record &&
            hasFieldPermission("record_edit") &&
            (currentUser?.fullAccess ||
              (record.createdBy || record.pm) === currentUser?.name) &&
            scopedRecords().some((item) => item.id === record.id),
        );
      let cityDistrictMapCache = null;
      const cityDistrictMap = () => {
        if (!cityDistrictMapCache) {
          cityDistrictMapCache = {};
          Object.values(administrativeDivisions).forEach((province) =>
            Object.entries(province).forEach(([city, districts]) => {
              (cityDistrictMapCache[city] =
                cityDistrictMapCache[city] || []).push(...districts);
            }),
          );
        }
        return cityDistrictMapCache;
      };
      const recordCreatedAt = () => {
        const n = new Date();
        const p = (x) => String(x).padStart(2, "0");
        return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`;
      };
      function companyInCurrentManagedRegion(company) {
        const employee = employees.find((item) => item.code === currentUser?.employeeCode);
        if (!employee || employee.status !== "在职") return false;
        const region = regionForCompany(company);
        return Boolean(region && departmentsManagedBy(employee.code).some(
          (department) => department.type === "region" && department.regionId === region.id,
        ));
      }
      const companyIsVisible = (c) => {
        c = customerResponsibilityFacts(c);
        if (!c || c.archived || !roleCanSeeBusiness()) return false;
        if (currentScopeType() === "cities")
          return (
            customerOwnerName(c) === currentUser.name &&
            responsibilityReceiverIsValid(c, regionForCompany(c), currentUser.name)
          );
        if (currentScopeType() === "regions") return companyInCurrentManagedRegion(c);
        return ["company", "market"].includes(currentScopeType());
      };
      const contactIsActive = (p) => {
        if (p.archived) return false;
        const company = customers.find((c) => c.name === p.company);
        if (!company || company.archived) return false;
        const department = customerDepartments.find(
          (d) => d.group === company.group && d.name === p.department,
        );
        return !department?.archived;
      };
      function normalizeCustomerResponsibilities() {
        customers.forEach((company) => {
          company.contacts = contacts.filter(
            (person) =>
              person.company === company.name && contactIsActive(person),
          ).length;
        });
        customers.forEach((company) => {
          company.owner = responsibilityOwnerForCustomer(company) || "待分配";
          company.pm = customerPmName(company);
        });
        contacts.forEach((person) => {
          const company = customers.find((item) => item.name === person.company);
          if (!company) return;
          person.pm = customerPmName(company);
        });
        tasks.forEach((task) => {
          const company = customers.find((item) => item.name === task.company);
          if (!company || task.type === "关键人覆盖 KPI") return;
          if (!["done", "cancelled", "expired"].includes(task.status)) {
            task.pm = customerOwnerName(company);
            task.executorRole =
              customerResponsibilityRole(company);
            delete task.closeReason;
            delete task.closedAt;
          }
        });
      }
      function normalizeTaskStates() {
        normalizeCustomerResponsibilities();
        tasks.forEach((t) => {
          if (t.type === "常规维系" && t.status === "expired")
            t.status = "overdue";
          if (isCampaignTask(t)) {
            const campaign = campaigns.find(
              (item) => item.id === t.campaignId,
            );
            if (campaign?.endDate) t.due = campaign.endDate;
            if (
              campaign &&
              ["overdue", "expired"].includes(t.status) &&
              campaign.endDate >= DEMO_TODAY
            ) {
              t.status = "pending";
              t.everOverdue = false;
              delete t.firstOverdueAt;
            }
            if (
              campaign &&
              ["pending", "overdue"].includes(t.status) &&
              campaign.endDate < DEMO_TODAY
            ) {
              const inLateWindow =
                campaign.allowLateCompletion &&
                campaign.lateCompletionEndDate >= DEMO_TODAY;
              t.status = inLateWindow ? "overdue" : "expired";
            }
            if (campaign && t.status === "done" && t.completedAt) {
              const completedLate = t.completedAt > campaign.endDate;
              const incorrectlyMarkedLate =
                !completedLate && t.completionType === "late_completion";
              if (completedLate) {
                t.completionType = "late_completion";
                t.everOverdue = true;
                t.firstOverdueAt =
                  t.firstOverdueAt || addDays(campaign.endDate, 1);
                t.lateDays = dayDiff(campaign.endDate, t.completedAt);
              } else if (incorrectlyMarkedLate) {
                t.completionType = "on_time";
                t.everOverdue = false;
                t.lateDays = 0;
                delete t.firstOverdueAt;
              }
            }
          }
          if (t.status === "paused") {
            t.originalDue = t.originalDue || t.due;
            t.everOverdue = false;
            delete t.firstOverdueAt;
            delete t.lateDays;
            if (
              ["生日关怀", "节假日关怀"].includes(t.type) &&
              t.due < DEMO_TODAY
            ) {
              t.status = "cancelled";
              t.closureSource = "paused_event_deadline";
              t.closedAt = `${addDays(t.due, 1)} 00:00:00`;
              t.closeReason = "暂停期间已越过事件截止，系统自动关闭";
              return;
            }
            if (t.resumeDate && t.resumeDate <= DEMO_TODAY) {
              const previousDue = t.due;
              if (t.type === "常规维系") {
                const person = contacts.find(
                  (item) =>
                    (t.personId && item.id === t.personId) ||
                    (item.name === t.person && item.company === t.company),
                );
                const resumedLevel = person?.level || t.level;
                const cycleDays = maintenanceConfig.cycles[resumedLevel] || 30;
                t.due = addDays(t.resumeDate, cycleDays);
                t.level = resumedLevel;
                t.resumeHistory = [
                  ...(t.resumeHistory || []),
                  {
                    resumedAt: t.resumeDate,
                    previousDue,
                    currentDue: t.due,
                    level: resumedLevel,
                    cycleDays,
                  },
                ];
              }
              t.status = "pending";
              t.resumedAt = t.resumeDate;
            } else {
              return;
            }
          }
          if (t.status === "overdue") {
            t.everOverdue = true;
            t.firstOverdueAt = t.firstOverdueAt || addDays(t.due, 1);
            if (isCampaignTask(t)) {
              const campaign = campaigns.find(
                (item) => item.id === t.campaignId,
              );
              const lateWindowClosed =
                !campaign?.allowLateCompletion ||
                !campaign.lateCompletionEndDate ||
                campaign.lateCompletionEndDate < DEMO_TODAY;
              if (campaign?.endDate < DEMO_TODAY && lateWindowClosed)
                t.status = "expired";
            }
          }
          if (
            t.type === "常规维系" &&
            !["done", "cancelled", "paused"].includes(t.status) &&
            t.due < DEMO_TODAY
          ) {
            t.status = "overdue";
            t.everOverdue = true;
            t.firstOverdueAt = t.firstOverdueAt || addDays(t.due, 1);
          }
          if (
            ["生日关怀", "节假日关怀"].includes(t.type) &&
            !["done", "cancelled", "paused"].includes(t.status)
          ) {
            const policy = taskLateCompletionPolicy(t);
            t.allowLateCompletion = policy.allowed;
            t.lateCompletionEndDate = policy.cutoff || "";
            if (t.due < DEMO_TODAY) {
              t.everOverdue = true;
              t.firstOverdueAt = t.firstOverdueAt || addDays(t.due, 1);
              t.status =
                policy.allowed && policy.cutoff >= DEMO_TODAY
                  ? "overdue"
                  : "expired";
            }
          }
        });
      }
      const scopedCustomers = () => {
        if (!hasDataObject("客户单位")) return [];
        return customers.filter(companyIsVisible);
      };
      const scopedContacts = () => {
        if (!hasDataObject("关键人")) return [];
        return contacts.filter(
          (x) =>
            contactIsActive(x) &&
            companyIsVisible(customers.find((c) => c.name === x.company)),
        );
      };
      const maintenanceContactCandidates = () => {
        if (!canCreateMaintenanceRecord()) return [];
        const visible = scopedContacts();
        if (currentUser.role !== "director") return visible;
        return visible.filter(canCreateMaintenanceForPerson);
      };
      const scopedTasks = () => {
        if (!hasDataObject("维系任务")) return [];
        const visible = tasks.filter((t) => {
          const person = contacts.find((p) => p.name === t.person);
          const company = customers.find((c) => c.name === t.company);
          return (
            (!person || contactIsActive(person)) &&
            (!company || !company.archived)
          );
        });
        if (currentScopeType() === "cities")
          return visible.filter(
            (x) =>
              x.pm === currentUser.name &&
              (x.type === "关键人覆盖 KPI" ? coverageTaskCompanies(x).some(companyIsVisible) : companyIsVisible(customers.find((c) => c.name === x.company))),
          );
        if (currentScopeType() === "regions")
          return visible.filter(x => x.type === "关键人覆盖 KPI" ? coverageTaskCompanies(x).some(companyInCurrentManagedRegion) : companyInCurrentManagedRegion(customers.find(company => company.name === x.company)));
        return ["company", "market"].includes(currentScopeType())
          ? visible
          : [];
      };
      function contactHasOverdue(person) {
        if (!person || !contactIsActive(person)) return false;
        return tasks.some(
          (task) =>
            task.person === person.name &&
            task.company === person.company &&
            taskIsHealthRisk(task),
        );
      }
      function taskIsHealthRisk(task) {
        return Boolean(
          task &&
            ["常规维系", "生日关怀", "节假日关怀"].includes(task.type) &&
            task.status === "overdue",
        );
      }
      function taskCanPause(task) {
        return Boolean(
          task &&
            ["常规维系", "生日关怀", "节假日关怀"].includes(task.type) &&
            task.status === "pending" &&
            task.due >= DEMO_TODAY &&
            task.everOverdue !== true,
        );
      }
      function customerHasOverdue(company) {
        if (!company) return false;
        return contacts.some(
          (person) =>
            person.company === company.name && contactHasOverdue(person),
        );
      }
      function customerHealth(company) {
        if (customerHasOverdue(company)) return "逾期";
        return "健康";
      }
      function healthTag(status) {
        return `<span class="tag ${status === "健康" ? "green" : status === "逾期" ? "red" : "yellow"}">${status}</span>`;
      }

      const captchaAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const loginFailureState = new Map();
      const LOGIN_PASSWORD_FAILURE_LIMIT = 5;
      const LOGIN_LOCK_DURATION_MS = 30 * 60 * 1000;
      let captchaCode = "";
      function nextCaptchaCode() {
        return Array.from(
          { length: 4 },
          () => captchaAlphabet[Math.floor(Math.random() * captchaAlphabet.length)],
        ).join("");
      }
      function initAccounts() {
        employees.forEach((employee) => syncEmployeeAccount(employee));
        $("#accountGrid").innerHTML = accounts
          .map(
            (a) =>
              `<button class="account-chip" type="button" data-phone="${a.phone}" ${a.disabled ? "disabled" : ""}><strong>${a.roleName.replace("（PM）", "")}</strong><span>${a.phone}</span></button>`,
          )
          .join("");
        document.querySelectorAll(".account-chip").forEach(
          (btn) =>
            (btn.onclick = () => {
              const a = accounts.find((x) => x.phone === btn.dataset.phone);
              $("#mobile").value = a.phone;
              $("#password").value = a.password;
              $("#captchaInput").value = captchaCode;
            }),
        );
      }

      function refreshCaptcha() {
        captchaCode = nextCaptchaCode();
        if ($("#captchaImage")) $("#captchaImage").textContent = captchaCode;
        if ($("#captchaInput")) $("#captchaInput").value = captchaCode;
      }

      function activeLoginFailureState(account, now = Date.now()) {
        if (!account) return null;
        const state = loginFailureState.get(account.phone);
        if (!state) return { failures: 0, lockedUntil: 0 };
        if (state.lockedUntil && state.lockedUntil <= now) {
          loginFailureState.delete(account.phone);
          return { failures: 0, lockedUntil: 0 };
        }
        return state;
      }

      function recordPasswordFailure(account, now = Date.now()) {
        const current = activeLoginFailureState(account, now);
        const failures = current.failures + 1;
        const state = {
          failures,
          lockedUntil:
            failures >= LOGIN_PASSWORD_FAILURE_LIMIT
              ? now + LOGIN_LOCK_DURATION_MS
              : 0,
        };
        loginFailureState.set(account.phone, state);
        return state;
      }

      function defaultLandingPage() {
        if (
          currentRoleTemplateNames().includes("HR/人事") &&
          hasPermission("employees")
        )
          return "employees";
        if (hasPermission("dashboard")) return "dashboard";
        if (canAccessPage("teachers")) return teacherPersonalScheduleView() ? "teacher-schedule" : "teachers";
        return currentRoleTemplate()?.permissions.find(canAccessPage) || "employees";
      }



      function normalizedPageHash() {
        const page = window.location.hash.slice(1) || "dashboard";
        return page === "customers" ? "operations" : page;
      }

      $("#passwordToggle").addEventListener("click", () => {
        const passwordInput = $("#password");
        const reveal = passwordInput.type === "password";
        passwordInput.type = reveal ? "text" : "password";
        $("#passwordToggle").textContent = reveal ? "⊘" : "◉";
        $("#passwordToggle").title = reveal ? "隐藏密码" : "显示密码";
        $("#passwordToggle").setAttribute(
          "aria-label",
          reveal ? "隐藏密码" : "显示密码",
        );
      });

      $("#loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const mobile = $("#mobile").value.trim();
        const submittedCaptcha = $("#captchaInput").value.trim().toUpperCase();
        const passwordInput = $("#password");
        passwordInput.type = "password";
        $("#passwordToggle").textContent = "◉";
        $("#passwordToggle").title = "显示密码";
        $("#passwordToggle").setAttribute("aria-label", "显示密码");
        if (submittedCaptcha !== captchaCode) {
          refreshCaptcha();
          return toast("图片验证码错误，请重试");
        }
        const account = accounts.find((a) => a.phone === mobile);
        refreshCaptcha();
        if (account?.disabled)
          return toast("账号不可用，请联系系统管理员");
        const failureState = activeLoginFailureState(account);
        if (failureState?.lockedUntil) {
          passwordInput.value = "";
          return toast("当前无法登录，请稍后重试");
        }
        const passwordMatched = account?.password === passwordInput.value;
        if (!account || !passwordMatched) {
          if (account) recordPasswordFailure(account);
          passwordInput.value = "";
          return toast("手机号或密码错误");
        }
        loginFailureState.delete(account.phone);
        currentUser = account;
        employeeUsageRecordVisit();
        teacherListState = { actor: account, filters: teacherEmptyListFilters() };
        const personalTeacherLanding = defaultLandingPage() === "teacher-schedule";
        if (personalTeacherLanding) teacherScheduleState = { actor: account, month: DEMO_TODAY.slice(0, 7), view: "calendar", selected: null };
        const loginEmployee = employees.find(
          (employee) => employee.name === account.name,
        );
        if (loginEmployee) loginEmployee.lastLogin = recordCreatedAt();
        const requestedExplicitly = Boolean(window.location.hash.slice(1));
        const requestedPage = normalizedPageHash();
        const requestedPageAllowed = canAccessPage(requestedPage);
        currentPage = personalTeacherLanding && canAccessPage("teacher-schedule") ? "teacher-schedule" : requestedPageAllowed
          ? requestedPage
          : requestedExplicitly
            ? requestedPage
          : defaultLandingPage();
        window.history.replaceState(null, "", `#${currentPage}`);
        adminDashboardView = "system";
        taskView = account.role === "pm" ? "mine" : "summary";
        approvalView = "pending";
        dashboardTaskFilter = null;
        dashboardEmployeeStatusFilter = "在职";
        customerFilterExpanded = false;
        selectedCustomerGroup = "";
        customerTreeDimension = "group";
        selectedOperationRegion = "";
        selectedOperationProvince = "";
        selectedOperationRegionGroup = "";
        selectedOperationCustomerId = null;
        selectedOperationContactId = null;
        selectedOpportunityId = null;
        opportunityDetailTab = "overview";
        salesPeriodDraft = DEMO_TODAY.slice(0, 7);
        salesPeriodApplied = DEMO_TODAY.slice(0, 7);
        salesTargetMonth = "2026-09";
        salesTrendMode = "count";
        appliedOpportunityFilters = {
          code: "",
          name: "",
          type: "",
          stage: "",
          customer: "",
          region: "",
          owner: "",
          priority: "",
          expectedFrom: "",
          expectedTo: "",
          createdFrom: "",
          createdTo: "",
          overdue: "",
        };
        selectedCustomerOrgNode = "";
        selectedCustomerOrgInternalNode = "";
        customerOrgCompanyTab = "organization";
        Object.assign(customerOrgNavFilters, {
          industryName: "",
          groupNumber: "",
          groupName: "",
          companyName: "",
          industryCode: "",
          creditCode: "",
          industry: "",
          group: "",
        });
        customerOrgNavFilters.levels.clear();
        customerOrgNavFilters.statuses.clear();
        Object.assign(customerOrgInternalFilters, {
          departmentName: "",
          departmentCode: "",
          positionName: "",
          positionCode: "",
        });
        customerOrgInternalFilters.statuses.clear();
        customerOrgLoadLimits.clear();
        customerAreaFilter.provinces.clear();
        customerAreaFilter.cities.clear();
        customerAreaFilter.districts.clear();
        appliedCustomerFilter = {
          group: "",
          groupNumber: "",
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
        $("#loginView").classList.add("hidden");
        $("#appView").classList.remove("hidden");
        $("#profileAvatar").textContent = account.name.slice(0, 1);
        $("#profileName").textContent = account.name;
        $("#profileRole").textContent = account.roleName;
        renderNav();
        renderPage();
        refreshNoticeIndicator();
        toast(`已进入${account.roleName}视图`);
      });
      function performLogout() {
        currentUser = null;
        $("#password").type = "password";
        $("#passwordToggle").textContent = "◉";
        $("#passwordToggle").title = "显示密码";
        $("#passwordToggle").setAttribute("aria-label", "显示密码");
        selectedOperationCustomerId = null;
        selectedOperationContactId = null;
        selectedCustomerGroup = "";
        customerTreeDimension = "group";
        selectedOperationRegion = "";
        selectedOperationProvince = "";
        selectedOperationRegionGroup = "";
        closeOverlay();
        $("#appView").classList.add("hidden");
        $("#loginView").classList.remove("hidden");
        refreshCaptcha();
      }
      function confirmLogout() {
        closeNoticePanel();
        openModal(
          `<div class="modal-head"><div class="modal-title">确认退出登录</div><button class="icon-btn close" data-close title="取消退出">×</button></div><div class="modal-body"><div class="role-note">退出后将返回登录页面，是否继续？</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-danger" type="button" id="confirmLogoutBtn">确认退出</button></div>`,
        );
        $("#confirmLogoutBtn").onclick = performLogout;
      }
      $("#logoutBtn").onclick = confirmLogout;
      $("#noticeBtn").onclick = toggleNotices;
      $("#profileBtn").onclick = openProfile;
      window.addEventListener("hashchange", () => {
        if (!currentUser) return;
        currentPage = normalizedPageHash();
        closeOverlay();
        renderPage();
      });

      function renderNav() {
        $("#nav").innerHTML = navGroups
          .map((g) => {
            const items = g.items.filter((i) =>
              i.id === "customers"
                ? false
                : i.id === "operations"
                  ? roleCanSeeBusiness()
                  : canAccessPage(i.id),
            );
            if (!items.length) return "";
            if (teacherPersonalScheduleView()) items.sort((a, b) => Number(b.id === "teacher-schedule") - Number(a.id === "teacher-schedule"));
            return `<div class="nav-group"><div class="nav-title">${g.title}</div>${items
              .map((i) => {
                const label =
                  i.id === "teacher-work" && teacherPersonalScheduleView() ? "我的复盘" : i.id === "teachers" && teacherPersonalScheduleView()
                    ? "我的信息"
                    : i.id === "teacher-schedule" && teacherPersonalScheduleView() && !teacherHasCompanyScheduleAccess()
                    ? "我的排期"
                    : i.id === "sales-supports" && currentUser?.fullAccess
                    ? "方案支撑管理"
                    : i.id === "sales-targets" &&
                        currentRoleTemplateNames().includes("PM") &&
                        !currentUser?.fullAccess &&
                        !currentRoleTemplateNames().some((role) =>
                          ["总裁", "市场副总", "区域总监"].includes(role),
                        )
                      ? "我的销售指标"
                      : i.label;
                return `<button class="nav-item ${currentPage === i.id ? "active" : ""}" data-page="${i.id}" title="${label}"><span class="nav-icon">${i.icon}</span><span>${label}</span></button>`;
              })
              .join("")}</div>`;
          })
          .join("");
        document.querySelectorAll(".nav-item").forEach(
          (b) =>
            (b.onclick = () => {
              const enteringOperations =
                b.dataset.page === "operations" && currentPage !== "operations";
              currentPage = b.dataset.page;
              window.history.replaceState(null, "", `#${currentPage}`);
              if (enteringOperations) {
                selectedOperationCustomerId = null;
                selectedOperationContactId = null;
                selectedCustomerGroup = "";
                customerTreeDimension = "group";
                selectedOperationRegion = "";
                selectedOperationProvince = "";
                selectedOperationRegionGroup = "";
              }
              dashboardTaskFilter = null;
              closeOverlay();
              renderNav();
              renderPage();
            }),
        );
      }
      const pageNames = {
        dashboard: "工作台",
        "employee-usage": "员工使用统计",
        operations: "客户经营",
        customers: "客户档案",
        tasks: "维系管理",
        approvals: "审批中心",
        archive: "停用记录",
        employees: "组织与员工",
        permissions: "权限授权",
        regions: "区域中心与地市配置",
        "city-management": "地市管理",
        settings: "客户基础配置",
        imports: "数据导入",
        teachers: "老师管理",
        "teacher-schedule": "老师排期",
        "teacher-work": "授课复盘",
        "teacher-recommendations": "我的推荐",
        "support-results": "支撑结果与月度参考",
        projects: "项目管理",
        "project-detail": "项目详情",
        "project-create": "创建项目",
        "project-edit": "编辑项目",
        frameworks: "框架管理",
        packages: "采购包管理",
        "platform-companies": "平台公司管理",
        opportunities: "商机列表",
        "opportunity-detail": "商机详情",
        "opportunity-create": "新建商机",
        "sales-targets": "销售指标",
        "sales-supports": "我的方案支撑",
      };
      function renderPage() {
        employeeUsageGuard();
        normalizeTaskStates();
        teacherEnsureRecapTasks();
        if(currentPage !== "opportunity-create") pendingTeacherRecommendationId="";
        const canOpenPage = canAccessPage(currentPage);
        if (!canOpenPage) {
          const deniedName = pageNames[currentPage] || "该页面";
          $("#content").classList.remove("customer-page-shell");
          const returnPage = defaultLandingPage();
          const returnName = pageNames[returnPage] || "可访问页面";
          $("#content").innerHTML =
            pageHead("无权访问", "当前账号无法访问此页面。") +
            `<section class="panel"><div class="empty"><div><div class="empty-icon">403</div><strong>${deniedName}</strong><p class="panel-sub">当前账号无此菜单、页面或接口权限。</p><button class="btn btn-primary" id="returnDashboard">返回${returnName}</button></div></div></section>`;
          $("#returnDashboard").onclick = () => {
            currentPage = returnPage;
            window.history.replaceState(null, "", `#${returnPage}`);
            renderPage();
          };
          renderNav();
          return;
        }
        const pageChanged = lastRenderedPage !== currentPage;
        $("#content").classList.toggle(
          "customer-page-shell",
          ["customers", "operations"].includes(currentPage),
        );
        const renderers = {
          dashboard: renderDashboard,
          "employee-usage": employeeUsagePage,
          operations: renderOperations,
          tasks: renderTasks,
          approvals: renderApprovals,
          archive: renderArchive,
          employees: renderEmployees,
          permissions: renderPermissions,
          regions: renderRegions,
          "city-management": renderPmCityManagement,
          settings: renderSettings,
          imports: renderImports,
          teachers: renderTeachers,
          "teacher-schedule": renderTeacherSchedule,
          "teacher-work": renderTeacherWork,
          "teacher-recommendations": () => renderTeacherRecommendations(true),
          "support-results": renderSupportResults,
          projects: renderProjects,
          "project-detail": renderProjectDetail,
          "project-create": renderProjectCreate,
          "project-edit": renderProjectEdit,
          frameworks: renderProjectFrameworks,
          packages: renderProjectPackages,
          "platform-companies": renderPlatformCompanies,
          opportunities: renderOpportunities,
          "opportunity-detail": renderOpportunityDetail,
          "opportunity-create": renderOpportunityCreate,
          "sales-targets": renderSalesTargets,
          "sales-supports": renderSalesSupports,
        };
        $("#content").innerHTML = (renderers[currentPage] || renderDashboard)();
        if (pageChanged) $("#content").scrollTop = 0;
        lastRenderedPage = currentPage;
        bindPageEvents();
        renderNav();
        refreshNoticeIndicator();
      }

      function pageHead(title, desc, actions = "") {
        return `<div class="page-head"><div><h2>${title}</h2><p>${desc}</p></div><div class="page-actions">${actions}</div></div>`;
      }
      function forbiddenPage(title, message) {
        return (
          pageHead(title, "当前账号没有此页面权限。") +
          `<section class="panel"><div class="empty"><div><div class="empty-icon">403</div><strong>无权访问</strong><div class="list-sub" style="margin-top:8px">${message}</div></div></div></section>`
        );
      }
      function metric(label, value, foot, tone = "") {
        return `<div class="metric ${tone}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></div>`;
      }

      function contactCompleteness(person) {
        const values = [
          person.name,
          person.gender,
          person.company,
          person.department,
          person.title,
          person.phone,
          person.wechat,
          person.email,
          person.birthday,
          person.decisionConfirmed === false ? "" : String(person.decision),
        ];
        return Math.round(
          (values.filter((value) => String(value || "").trim()).length /
            values.length) *
            100,
        );
      }

      function completenessHtml(person) {
        const percent = contactCompleteness(person);
        return `<div class="completeness ${percent < 80 ? "low" : ""}"><div class="completeness-head"><span>资料完整度</span><strong>${percent}%</strong></div><div class="completeness-bar"><i style="width:${percent}%"></i></div></div>`;
      }
