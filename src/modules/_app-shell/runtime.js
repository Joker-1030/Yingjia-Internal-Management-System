      const $ = (s) => document.querySelector(s);
      function filterField(label, control, className = "") {
        return `<label class="filter-field ${className}"><span class="filter-label">${label}</span>${control}</label>`;
      }
      function filterActions(actions) {
        return `<div class="filter-actions">${actions}</div>`;
      }

      const unifiedTablePaginationStates = {};
      function tablePagination(key, defaultPageSize = 10) {
        return `<div class="table-pagination" data-table-pagination="${key}"><span data-page-summary></span><label class="table-page-size">每页<select class="input" data-page-size><option value="10" ${defaultPageSize === 10 ? "selected" : ""}>10 条</option><option value="20" ${defaultPageSize === 20 ? "selected" : ""}>20 条</option><option value="50" ${defaultPageSize === 50 ? "selected" : ""}>50 条</option></select></label><button class="icon-btn" type="button" data-page-direction="prev" title="上一页" aria-label="上一页">‹</button><button class="icon-btn" type="button" data-page-direction="next" title="下一页" aria-label="下一页">›</button></div>`;
      }
      function refreshUnifiedTablePagination(key, resetPage = false) {
        const table = document.querySelector(`[data-paged-table="${key}"]`);
        const pagination = document.querySelector(
          `[data-table-pagination="${key}"]`,
        );
        if (!table || !pagination) return;
        const sizeControl = pagination.querySelector("[data-page-size]");
        const requestedPageSize = Number(sizeControl?.value || 10);
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
          pagination.querySelector("[data-page-size]").onchange = () =>
            refreshUnifiedTablePagination(key, true);
          pagination.querySelectorAll("[data-page-direction]").forEach((button) => {
            button.onclick = () => {
              const state = unifiedTablePaginationStates[key] || {
                page: 1,
                pageSize: Number(
                  pagination.querySelector("[data-page-size]")?.value || 10,
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
          ["archiveType", "对象类型"], ["archiveStatus", "业务状态"], ["archiveApprovalStatus", "审批状态"], ["archiveApplicant", "申请人"], ["archiveRegion", "所属区域"], ["archiveApplyStart", "申请开始日期"], ["archiveApplyEnd", "申请结束日期"], ["archiveEffectiveStart", "生效开始日期"], ["archiveEffectiveEnd", "生效结束日期"],
          ["employeeRole", "系统角色"], ["employeeStatus", "员工状态"], ["employeeAccountStatus", "账号状态"],
          ["regionProvinceFilter", "省份"], ["regionCityProvince", "省份"], ["regionCityStatus", "分配状态"],
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
      const hasPermission = (permission) =>
        currentRoleTemplates().some((template) =>
          template.permissions.includes(permission),
        );
      const hasDataObject = (object) =>
        currentRoleTemplates().some((template) => template.objects.includes(object));
      const currentScopeType = () => {
        const scopeTypes = currentRoleTemplates().map(
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
        if (page === "operations") return roleCanSeeBusiness();
        if (page === "city-management")
          return isPmCityManagementUser() && hasPermission(page);
        if (page === "regions" && isPmCityManagementUser()) return false;
        if (page === "project-detail") return hasPermission("projects");
        if (page === "project-create") return hasPermission("projects");
        if (page === "project-edit") return hasPermission("projects");
        if (page === "opportunity-detail") return hasPermission("opportunities");
        if (page === "opportunity-create") return hasPermission("opportunities");
        return hasPermission(page);
      };
      const hasOperationPermission = (operation) =>
        Boolean(
          currentUser?.fullAccess ||
            currentRoleTemplateNames().some((roleName) =>
              roleOperationPermissions?.[roleName]?.includes(operation),
            ),
        );
      const hasFieldPermission = (permission) =>
        Boolean(
          currentUser?.fullAccess ||
            currentRoleTemplateNames().some((roleName) =>
              roleFieldPermissions?.[roleName]?.includes(permission),
            ),
        );
      const hasAttachmentPermission = (permission) =>
        Boolean(
          currentUser?.fullAccess ||
            currentRoleTemplateNames().some((roleName) =>
              roleAttachmentPermissions?.[roleName]?.includes(permission),
            ),
        );
      const canEmployeeAction = (operation) =>
        Boolean(currentUser?.fullAccess || hasOperationPermission(operation));
      const assignedCitiesForCurrentUser = () =>
        currentScopeType() === "cities"
          ? cityOwners
              .filter((x) => x.pm === currentUser.name)
              .map((x) => x.city)
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
      const regionForCompany = (company) =>
        regionsData.find(
          (region) =>
            regionsMatch(region.name, company?.region) ||
            regionProvinceList(region).includes(company?.province),
        );
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
      const customerOwnerName = (company) =>
        company?.level === "省公司"
          ? regionDirectorForCustomer(company)
          : company?.owner || company?.pm || "待分配";
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
          const cities = cityOwners
            .filter((item) => item.pm === employee.name)
            .map((item) => item.city);
          return cities.join("、") || "待配置负责地市";
        }
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
          "HR/人事",
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
      };
      const contactLevelOptions = (selectedLevel = "") =>
        ["一级", "二级", "三级", "四级"]
          .map(
            (level) =>
              `<option value="${level}" ${level === selectedLevel ? "selected" : ""}>${contactLevelLabels[level]}</option>`,
          )
          .join("");
      const normalizePositionText = (value) =>
        String(value || "").trim().replace(/\s+/g, " ");
      const contactPositionCatalog = [
        { id: "POS-CM-001", group: "中国移动", company: "中国移动济南分公司", departmentId: 1001, code: "POS00000001", name: "人力资源分管领导", aliases: ["人力副总"] },
        { id: "POS-CM-002", group: "中国移动", company: "中国移动济南分公司", departmentId: 1002, code: "POS00000002", name: "培训发展负责人", aliases: ["培训负责人", "培训主任"] },
        { id: "POS-CM-003", group: "中国移动", company: "中国移动济南分公司", departmentId: 1003, code: "POS00000003", name: "数字化负责人", aliases: ["信息化负责人"] },
        { id: "POS-CM-004", group: "中国移动", company: "中国移动济南分公司", departmentId: 1001, code: "POS00000004", name: "关键决策人", aliases: ["采购负责人"] },
        { id: "POS-CM-005", group: "中国移动", company: "中国移动济南分公司", departmentId: 1010, code: "POS00000005", name: "原培训管理岗", aliases: [], status: "已停用" },
        { id: "POS-CT-001", group: "中国电信", company: "中国电信青岛分公司", departmentId: 1005, code: "POS00000006", name: "人力资源负责人", aliases: ["人力负责人"] },
        { id: "POS-CT-002", group: "中国电信", company: "中国电信青岛分公司", departmentId: 1005, code: "POS00000007", name: "培训负责人", aliases: ["培训主任"] },
        { id: "POS-CU-001", group: "中国联通", company: "中国联通泰安分公司", departmentId: 1004, code: "POS00000008", name: "组织人事负责人", aliases: ["人力负责人"] },
        { id: "POS-HD-001", group: "华电集团", company: "华电山东新能源有限公司", departmentId: 1006, code: "POS00000009", name: "人力资源负责人", aliases: [] },
        { id: "POS-SG-001", group: "国家电网", company: "国家电网山东省公司", departmentId: 1101, code: "POS00000021", name: "运营总监", aliases: ["运营负责人"] },
        { id: "POS-SG-002", group: "国家电网", company: "国家电网济南市公司", departmentId: 1103, code: "POS00000022", name: "客户运营经理", aliases: [] },
      ];
      contactPositionCatalog.forEach((position, index) => {
        position.status = position.status || "正常";
        position.sort = position.sort || (index + 1) * 10;
        position.updatedAt = position.updatedAt || "2026-08-17 09:30";
      });
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
            hasOperationPermission(operation) &&
            (currentUser?.fullAccess ||
              (currentUser?.role === "pm" &&
                company.level !== "省公司" &&
                companyIsVisible(company)) ||
              (currentUser?.role === "director" &&
                company.level === "省公司" &&
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
        return company?.level === "省公司";
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
      const companyIsVisible = (c) => {
        if (!c || c.archived || !roleCanSeeBusiness()) return false;
        if (currentScopeType() === "cities")
          return (
            Boolean(c.city) && assignedCitiesForCurrentUser().includes(c.city)
          );
        if (currentScopeType() === "regions")
          return regionsMatch(customerRegionScope(c), currentUser.region);
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
          if (company.level === "省公司") {
            company.owner = regionDirectorForCustomer(company);
            company.pm = "";
            return;
          }
          const cityOwner = cityOwners.find(
            (item) =>
              item.province === company.province && item.city === company.city,
          );
          company.owner = cityOwner?.pm || company.owner || company.pm || "待分配";
          company.pm = company.owner;
        });
        contacts.forEach((person) => {
          const company = customers.find((item) => item.name === person.company);
          if (!company) return;
          person.pm = company.level === "省公司" ? "" : customerOwnerName(company);
        });
        tasks.forEach((task) => {
          const company = customers.find((item) => item.name === task.company);
          if (!company) return;
          if (!["done", "cancelled"].includes(task.status)) {
            task.pm = customerOwnerName(company);
            task.executorRole =
              company.level === "省公司" ? "区域总监" : "PM";
            delete task.closeReason;
            delete task.closedAt;
          }
        });
        approvals.forEach((approval) => {
          if (
            approval.type !== "关键人调岗" ||
            approval.status !== "pending" ||
            !approval.targetCompany
          )
            return;
          const target = customers.find(
            (company) => company.name === approval.targetCompany,
          );
          if (target?.level !== "省公司") return;
          const sourcePerson = contacts.find(
            (person) => person.id === approval.transferContactId,
          );
          const sameCompany = sourcePerson?.company === target.name;
          approval.region = customerRegionScope(target);
          approval.current = sameCompany
            ? "市场副总审批"
            : "目标区域总监审批";
          approval.targetOwner = customerOwnerName(target);
          approval.targetPm = "";
          approval.currentAssignees = sameCompany
            ? ["王静"]
            : [regionDirectorForCustomer(target)];
          approval.expectedApprover = approval.currentAssignees.join("、");
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
            !["done", "cancelled", "late_entry_pending", "paused"].includes(t.status) &&
            t.due < DEMO_TODAY
          ) {
            t.status = "overdue";
            t.everOverdue = true;
            t.firstOverdueAt = t.firstOverdueAt || addDays(t.due, 1);
          }
          if (
            ["生日关怀", "节假日关怀"].includes(t.type) &&
            !["done", "cancelled", "late_entry_pending", "paused"].includes(t.status)
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
              companyIsVisible(customers.find((c) => c.name === x.company)),
          );
        if (currentScopeType() === "regions")
          return visible.filter((x) =>
            regionsMatch(
              customerRegionScope(
                customers.find((company) => company.name === x.company),
              ) || x.region,
              currentUser.region,
            ),
          );
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

      const captchaCode = "YJ26";
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
        if ($("#captchaImage")) $("#captchaImage").textContent = captchaCode;
        if ($("#captchaInput")) $("#captchaInput").value = captchaCode;
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
        if (submittedCaptcha !== captchaCode) {
          refreshCaptcha();
          return toast("图片验证码错误，请输入 YJ26");
        }
        const account = accounts.find((a) => a.phone === mobile);
        const passwordMatched = account?.password === $("#password").value;
        $("#password").type = "password";
        $("#passwordToggle").textContent = "◉";
        $("#passwordToggle").title = "显示密码";
        $("#passwordToggle").setAttribute("aria-label", "显示密码");
        refreshCaptcha();
        if (account?.disabled)
          return toast("账号不可用，请联系系统管理员");
        if (!account || !passwordMatched)
          return toast("手机号或密码错误，请重新输入图片验证码");
        currentUser = account;
        const loginEmployee = employees.find(
          (employee) => employee.name === account.name,
        );
        if (loginEmployee) loginEmployee.lastLogin = recordCreatedAt();
        const requestedExplicitly = Boolean(window.location.hash.slice(1));
        const requestedPage = normalizedPageHash();
        const requestedPageAllowed = canAccessPage(requestedPage);
        currentPage = requestedPageAllowed
          ? requestedPage
          : requestedExplicitly
            ? requestedPage
          : account.role === "hr"
            ? "employees"
            : hasPermission("dashboard")
              ? "dashboard"
              : currentRoleTemplate()?.permissions[0] || "employees";
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
            return `<div class="nav-group"><div class="nav-title">${g.title}</div>${items
              .map(
                (i) =>
                  `<button class="nav-item ${currentPage === i.id ? "active" : ""}" data-page="${i.id}" title="${i.label}"><span class="nav-icon">${i.icon}</span><span>${i.label}</span></button>`,
              )
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
        projects: "项目管理",
        "project-detail": "项目详情",
        "project-create": "创建项目",
        "project-edit": "编辑项目",
        packages: "采购包管理",
        "platform-companies": "平台公司管理",
        "sales-dashboard": "销售仪表盘",
        opportunities: "商机列表",
        "opportunity-detail": "商机详情",
        "opportunity-create": "新建商机",
        "sales-targets": "销售指标",
      };
      function renderPage() {
        normalizeTaskStates();
        const canOpenPage = canAccessPage(currentPage);
        if (!canOpenPage) {
          const deniedName = pageNames[currentPage] || "该页面";
          $("#content").classList.remove("customer-page-shell");
          $("#content").innerHTML =
            pageHead("无权访问", "权限校验未通过，未返回任何页面数据。") +
            `<section class="panel"><div class="empty"><div><div class="empty-icon">403</div><strong>${deniedName}</strong><p class="panel-sub">当前账号无此菜单、页面或接口权限。</p><button class="btn btn-primary" id="returnDashboard">返回工作台</button></div></div></section>`;
          $("#returnDashboard").onclick = () => {
            currentPage = "dashboard";
            window.history.replaceState(null, "", "#dashboard");
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
          projects: renderProjects,
          "project-detail": renderProjectDetail,
          "project-create": renderProjectCreate,
          "project-edit": renderProjectEdit,
          packages: renderProjectPackages,
          "platform-companies": renderPlatformCompanies,
          "sales-dashboard": renderSalesDashboard,
          opportunities: renderOpportunities,
          "opportunity-detail": renderOpportunityDetail,
          "opportunity-create": renderOpportunityCreate,
          "sales-targets": renderSalesTargets,
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
