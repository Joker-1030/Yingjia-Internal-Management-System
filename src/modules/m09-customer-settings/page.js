      function clearCustomerOrgInternalContext() {
        selectedCustomerOrgInternalNode = "";
        customerOrgCompanyTab = "organization";
        Object.assign(customerOrgInternalFilters, {
          departmentName: "",
          departmentCode: "",
          positionName: "",
          positionCode: "",
        });
        customerOrgInternalFilters.statuses.clear();
        [...expandedCustomerOrgNodes]
          .filter(
            (key) =>
              key.startsWith("department:") || key.startsWith("position:"),
          )
          .forEach((key) => expandedCustomerOrgNodes.delete(key));
        [...customerOrgLoadLimits.keys()]
          .filter((key) => key.startsWith("internal:"))
          .forEach((key) => customerOrgLoadLimits.delete(key));
      }

      function customerOrgCompanyParent(company, groupCompanies) {
        return customerOrganizationParent(company);
      }

      function customerOrgDepartmentsForCompany(company) {
        return customerDepartments.filter(
          (department) => department.company === company.name,
        );
      }

      function customerOrgPositionsForDepartment(department) {
        return contactPositionCatalog.filter(
          (position) => position.departmentId === department.id,
        );
      }

      function customerOrgStatus(type, value) {
        if (type === "industry") return value.enabled ? "正常" : "已停用";
        if (type === "group") {
          return (
            archivedItems.find(
              (item) => item.targetKind === "group" && item.name === value,
            )?.status || "正常"
          );
        }
        if (type === "company") {
          return (
            archivedItems.find(
              (item) =>
                item.targetKind === "customer" &&
                (String(item.targetId) === String(value.id) ||
                  item.name === value.name),
            )?.status || (value.archived ? "已停用" : "正常")
          );
        }
        if (type === "department") {
          return (
            archivedItems.find(
              (item) =>
                item.targetKind === "department" &&
                String(item.targetId) === String(value.id),
            )?.status || value.status || (value.archived ? "已停用" : "正常")
          );
        }
        return value.status || "正常";
      }

      function customerOrgStatusTone(status) {
        if (status === "正常") return "green";
        if (status === "已停用") return "red";
        return "yellow";
      }

      function customerOrgNodeHtml({
        key,
        type,
        label,
        depth,
        hasChildren,
        meta = "",
        selectedKey = selectedCustomerOrgNode,
        selectAttribute = "data-customer-org-select",
      }) {
        const expanded = expandedCustomerOrgNodes.has(key);
        const icon = { industry: "▦", group: "◉", company: "▣", department: "▤", position: "●" }[type];
        return `<button class="tree-node customer-org-node ${selectedKey === key ? "active" : ""}" type="button" ${selectAttribute}="${key}" style="padding-left:${9 + depth * 18}px"><span class="tree-toggle" data-customer-org-toggle="${hasChildren ? key : ""}" aria-label="${hasChildren ? expanded ? "收起" : "展开" : "叶节点"}">${hasChildren ? expanded ? "▾" : "▸" : "·"}</span><span class="node-icon">${icon}</span><span class="node-label" title="${label}">${label}</span><span class="node-meta">${meta}</span></button>`;
      }

      function customerOrgIncludes(value, keyword) {
        return !keyword || String(value || "").toLowerCase().includes(keyword.toLowerCase());
      }

      function customerOrgNavFiltering() {
        const filters = customerOrgNavFilters;
        return Boolean(
          filters.industryName ||
            filters.groupNumber ||
            filters.groupName ||
            filters.companyName ||
            filters.industryCode ||
            filters.creditCode ||
            filters.industry ||
            filters.group ||
            filters.levels.size ||
            filters.statuses.size,
        );
      }

      function customerOrgLimitedChildren(key, items, filtering) {
        if (filtering) return { visible: items, more: "" };
        const limit = customerOrgLoadLimits.get(key) || 50;
        return {
          visible: items.slice(0, limit),
          more:
            items.length > limit
              ? `<button class="link customer-org-load-more" type="button" data-customer-org-load-more="${key}">加载更多</button>`
              : "",
        };
      }

      function customerOrgSelectedCompany() {
        if (!selectedCustomerOrgNode.startsWith("company:")) return null;
        return customers.find(
          (item) => String(item.id) === selectedCustomerOrgNode.slice(8),
        );
      }

      function customerOrgCompanyTreeHtml(
        company,
        groupCompanies,
        includedCompanyIds,
        depth = 2,
      ) {
        const childCompanies = groupCompanies.filter(
          (item) => customerOrgCompanyParent(item, groupCompanies)?.id === company.id,
        );
        const matchingChildren = childCompanies
          .filter((item) => includedCompanyIds.has(item.id))
          .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
        const childPage = customerOrgLimitedChildren(
          `nav:company:${company.id}`,
          matchingChildren,
          customerOrgNavFiltering(),
        );
        const hasChildren = matchingChildren.length > 0;
        const key = `company:${company.id}`;
        const status = customerOrgStatus("company", company);
        let html = customerOrgNodeHtml({
          key,
          type: "company",
          label: company.name,
          depth,
          hasChildren,
          meta: `<span class="tag blue">${customerBusinessResponsibilityLevel(company)}</span><span class="tag ${customerOrgStatusTone(status)}">${status}</span>`,
        });
        if (!hasChildren || !expandedCustomerOrgNodes.has(key)) return html;
        childPage.visible.forEach((child) => {
            html += customerOrgCompanyTreeHtml(
              child,
              groupCompanies,
              includedCompanyIds,
              depth + 1,
            );
          });
        html += childPage.more;
        return html;
      }

      function customerOrgCompanyMatchSet(groupCompanies, applyStatus) {
        const filters = customerOrgNavFilters;
        const hasCompanyCriteria = Boolean(
          filters.companyName || filters.levels.size,
        );
        if (!hasCompanyCriteria && !applyStatus)
          return new Set(groupCompanies.map((item) => item.id));
        const matched = groupCompanies.filter(
          (company) =>
            customerOrgIncludes(company.name, filters.companyName) &&
            (!filters.levels.size ||
              filters.levels.has(customerBusinessResponsibilityLevel(company))) &&
            (!applyStatus ||
              !filters.statuses.size ||
              filters.statuses.has(customerOrgStatus("company", company))),
        );
        const included = new Set();
        matched.forEach((company) => {
          let current = company;
          while (current) {
            included.add(current.id);
            current = customerOrgCompanyParent(current, groupCompanies);
          }
        });
        return included;
      }

      function customerOrgTreeHtml() {
        const filters = customerOrgNavFilters;
        const hasIndustryCriteria = Boolean(
          filters.industryName || filters.industryCode || filters.industry,
        );
        const hasGroupCriteria = Boolean(
          filters.groupNumber ||
            filters.groupName ||
            filters.creditCode ||
            filters.group,
        );
        const hasCompanyCriteria = Boolean(filters.companyName || filters.levels.size);
        const statusTarget = hasCompanyCriteria
          ? "company"
          : hasGroupCriteria
            ? "group"
            : hasIndustryCriteria
              ? "industry"
              : filters.statuses.size
                ? "any"
                : "none";
        return industries
          .filter(
            (industry) =>
              customerOrgIncludes(industry.name, filters.industryName) &&
              customerOrgIncludes(industry.code, filters.industryCode) &&
              (!filters.industry || filters.industry === industry.name) &&
              (!filters.statuses.size ||
                statusTarget !== "industry" ||
                filters.statuses.has(customerOrgStatus("industry", industry))),
          )
          .map((industry) => {
            const groups = customerGroupNames.filter(
              (group) =>
                customerGroupIndustries[group] === industry.name &&
                customerOrgIncludes(customerGroupNumbers[group], filters.groupNumber) &&
                customerOrgIncludes(group, filters.groupName) &&
                customerOrgIncludes(customerGroupCreditCodes[group], filters.creditCode) &&
                (!filters.group || filters.group === group) &&
                (!filters.statuses.size ||
                  statusTarget !== "group" ||
                  filters.statuses.has(customerOrgStatus("group", group))),
            );
            const groupEntries = groups
              .map((group) => {
                const groupCompanies = customers.filter(
                  (company) => company.group === group,
                );
                const includedCompanyIds = customerOrgCompanyMatchSet(
                  groupCompanies,
                  ["company", "any"].includes(statusTarget),
                );
                const groupStatusMatched =
                  !filters.statuses.size ||
                  filters.statuses.has(customerOrgStatus("group", group));
                if (statusTarget === "company" && !includedCompanyIds.size)
                  return null;
                if (
                  statusTarget === "any" &&
                  !groupStatusMatched &&
                  !includedCompanyIds.size
                )
                  return null;
                return { group, groupCompanies, includedCompanyIds };
              })
              .filter(Boolean);
            if (!groupEntries.length && (hasGroupCriteria || hasCompanyCriteria)) return "";
            const industryStatusMatched =
              !filters.statuses.size ||
              filters.statuses.has(customerOrgStatus("industry", industry));
            if (
              statusTarget === "any" &&
              !industryStatusMatched &&
              !groupEntries.length
            )
              return "";
            const industryKey = `industry:${industry.name}`;
            const industryStatus = customerOrgStatus("industry", industry);
            let html = customerOrgNodeHtml({
              key: industryKey,
              type: "industry",
              label: industry.name,
              depth: 0,
              hasChildren: groupEntries.length > 0,
              meta: `<span class="tag ${customerOrgStatusTone(industryStatus)}">${industryStatus}</span>`,
            });
            if (!expandedCustomerOrgNodes.has(industryKey)) return html;
            const groupPage = customerOrgLimitedChildren(
              `nav:industry:${industry.name}`,
              groupEntries,
              customerOrgNavFiltering(),
            );
            groupPage.visible.forEach(({ group, groupCompanies, includedCompanyIds }) => {
              const matchingRoots = groupCompanies
                .filter(
                (company) =>
                  includedCompanyIds.has(company.id) &&
                  !customerOrgCompanyParent(company, groupCompanies),
                )
                .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
              const rootPage = customerOrgLimitedChildren(
                `nav:group:${group}`,
                matchingRoots,
                customerOrgNavFiltering(),
              );
              const groupKey = `group:${group}`;
              const groupStatus = customerOrgStatus("group", group);
              html += customerOrgNodeHtml({
                key: groupKey,
                type: "group",
                label: group,
                depth: 1,
                hasChildren: matchingRoots.length > 0,
                meta: `<span class="tag ${customerOrgStatusTone(groupStatus)}">${groupStatus}</span>`,
              });
              if (!expandedCustomerOrgNodes.has(groupKey)) return;
              rootPage.visible.forEach((company) => {
                  html += customerOrgCompanyTreeHtml(
                    company,
                    groupCompanies,
                    includedCompanyIds,
                  );
                });
              html += rootPage.more;
            });
            html += groupPage.more;
            return html;
          })
          .join("");
      }

      function customerOrgDetailField(label, value) {
        return `<div class="overview-item"><label>${label}</label><div>${value || "—"}</div></div>`;
      }

      function customerOrgDepartmentDetailHtml(company, canEditSettings) {
        const [type, rawId = ""] = selectedCustomerOrgInternalNode.split(":");
        if (type === "department") {
          const department = customerDepartments.find(
            (item) =>
              String(item.id) === rawId && item.company === company.name,
          );
          if (!department) return '<div class="empty">请选择左侧部门或岗位查看详情</div>';
          const status = customerOrgStatus("department", department);
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${department.name}</div><div class="customer-org-path">${company.group} / ${company.name} / ${customerDepartmentPath(department)}</div></div><span class="tag ${customerOrgStatusTone(status)}">${status}</span></div><div class="company-overview">${customerOrgDetailField("部门编码", department.code)}${customerOrgDetailField("所属客户公司", department.company)}${customerOrgDetailField("上级部门", department.parent === "无" ? "公司直属部门" : department.parent)}${customerOrgDetailField("排序", department.sort)}${customerOrgDetailField("部门说明", department.duty || "未填写")}${customerOrgDetailField("更新时间", department.updatedAt)}</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="edit-department-template" data-id="${department.id}">编辑部门</button><button class="btn" data-action="add-department-template">新增下级部门</button><button class="btn" data-action="add-contact-position">新增标准岗位</button><button class="btn" data-action="stop-department-template" data-id="${department.id}">申请停用</button></div>` : ""}`;
        }
        if (type === "position") {
          const position = contactPositionCatalog.find(
            (item) => item.id === rawId && item.company === company.name,
          );
          if (!position) return '<div class="empty">请选择左侧部门或岗位查看详情</div>';
          const department = customerDepartments.find(
            (item) => item.id === position.departmentId,
          );
          const status = customerOrgStatus("position", position);
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${position.name}</div><div class="customer-org-path">${position.group} / ${position.company} / ${department?.name || "待补齐部门"} / ${position.name}</div></div><span class="tag ${customerOrgStatusTone(status)}">${status}</span></div><div class="company-overview">${customerOrgDetailField("岗位编码", position.code)}${customerOrgDetailField("所属客户公司", position.company)}${customerOrgDetailField("所属部门", department?.name || "待补齐部门归属")}${customerOrgDetailField("排序", position.sort)}${customerOrgDetailField("更新时间", position.updatedAt)}</div><div class="section-title">岗位别名</div><div>${position.aliases.map((name) => `<span class="tag" style="margin-right:var(--space-1)">${name}</span>`).join("") || "无"}</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="edit-contact-position" data-id="${position.id}">编辑岗位</button><button class="btn" data-action="toggle-contact-position" data-id="${position.id}">${position.status === "正常" ? "停用" : "恢复"}</button></div>` : ""}`;
        }
        return '<div class="empty">请选择左侧部门或岗位查看详情</div>';
      }

      function customerOrgInternalMatchSets(company) {
        const departments = customerOrgDepartmentsForCompany(company);
        const matchedDepartments = new Set(
          departments.map((department) => department.id),
        );
        const matchedPositions = new Set();
        departments.forEach((department) => {
          customerOrgPositionsForDepartment(department).forEach((position) =>
            matchedPositions.add(position.id),
          );
        });
        return { departments, matchedDepartments, matchedPositions };
      }

      function customerOrgDepartmentTreeHtml(
        department,
        departments,
        matchedDepartments,
        matchedPositions,
        depth,
      ) {
        const children = departments
          .filter(
          (item) =>
            item.parent === department.name && matchedDepartments.has(item.id),
          )
          .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"));
        const positions = customerOrgPositionsForDepartment(department)
          .filter((position) => matchedPositions.has(position.id))
          .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"));
        const directChildren = [
          ...children.map((item) => ({ type: "department", item })),
          ...positions.map((item) => ({ type: "position", item })),
        ];
        const childPage = customerOrgLimitedChildren(
          `internal:department:${department.id}`,
          directChildren,
          false,
        );
        const key = `department:${department.id}`;
        const hasChildren = children.length > 0 || positions.length > 0;
        const status = customerOrgStatus("department", department);
        let html = customerOrgNodeHtml({
          key,
          type: "department",
          label: department.name,
          depth,
          hasChildren,
          meta: `<span class="tag ${customerOrgStatusTone(status)}">${status}</span>`,
          selectedKey: selectedCustomerOrgInternalNode,
          selectAttribute: "data-customer-org-internal-select",
        });
        if (!hasChildren || !expandedCustomerOrgNodes.has(key)) return html;
        childPage.visible.forEach(({ type, item }) => {
          if (type === "department") {
            html += customerOrgDepartmentTreeHtml(
              item,
              departments,
              matchedDepartments,
              matchedPositions,
              depth + 1,
            );
          } else {
            const position = item;
            const positionStatus = customerOrgStatus("position", position);
            html += customerOrgNodeHtml({
              key: `position:${position.id}`,
              type: "position",
              label: position.name,
              depth: depth + 1,
              hasChildren: false,
              meta: `<span class="tag ${customerOrgStatusTone(positionStatus)}">${positionStatus}</span>`,
              selectedKey: selectedCustomerOrgInternalNode,
              selectAttribute: "data-customer-org-internal-select",
            });
          }
        });
        html += childPage.more;
        return html;
      }

      function customerOrgInternalTreeHtml(company) {
        const { departments, matchedDepartments, matchedPositions } =
          customerOrgInternalMatchSets(company);
        const roots = departments.filter(
          (department) =>
            matchedDepartments.has(department.id) &&
            (!department.parent ||
              ["无", "—"].includes(department.parent) ||
              !departments.some((candidate) => candidate.name === department.parent)),
        );
        const rootPage = customerOrgLimitedChildren(
          `internal:company:${company.id}`,
          roots.sort(
            (a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"),
          ),
          false,
        );
        return (
          rootPage.visible
          .map((department) =>
            customerOrgDepartmentTreeHtml(
              department,
              departments,
              matchedDepartments,
              matchedPositions,
              0,
            ),
          )
          .join("") + rootPage.more
        );
      }

      function customerOrgCompanyInfoHtml(company, canEditSettings) {
        const parent = customerOrganizationParent(company);
        const organizationPath = customerOrganizationPath(company);
        const status = customerOrgStatus("company", company);
        return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${company.name}</div><div class="customer-org-path">${organizationPath}</div></div><span class="tag ${customerOrgStatusTone(status)}">${status}</span></div><div class="company-overview">${customerOrgDetailField("公司编码", company.companyCode || `CC${String(company.id).padStart(8, "0")}`)}${customerOrgDetailField("所属行业", company.industry)}${customerOrgDetailField("所属集团", company.group)}${customerOrgDetailField("组织上级", parent?.name || company.group)}${customerOrgDetailField("业务责任层级", customerBusinessResponsibilityLevel(company))}${customerOrgDetailField("业务责任省/市/区县", adminArea(company))}${customerOrgDetailField("统一社会信用代码", company.creditCode || "未填写")}${customerOrgDetailField("更新时间", company.updatedAt || "2026-08-17 09:30")}</div><div class="role-note">组织上级唯一决定公司树路径；业务责任层级和业务责任省/市/区县只用于区域、负责人、权限和任务责任。</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="edit-customer-parent" data-id="${company.id}">调整组织上级</button>${stopObjectActionHtml("customer", company.id)}</div>` : ""}`;
      }

      function customerOrgFilterMultiSelect(id, options, selectedValues) {
        const summary = selectedValues.size
          ? `已选 ${selectedValues.size} 项`
          : "全部";
        return `<details class="multi-select customer-org-filter-menu" id="${id}"><summary class="input">${summary}</summary><div class="multi-select-menu">${options
          .map(
            (option) =>
              `<label class="check-row"><input type="checkbox" value="${option}" ${selectedValues.has(option) ? "checked" : ""}><span>${option}</span></label>`,
          )
          .join("")}</div></details>`;
      }

      function customerOrgNavFiltersHtml() {
        const filters = customerOrgNavFilters;
        const industryOptions = industries.map((item) => item.name);
        const groupOptions = customerGroupNames.filter(
          (group) => !filters.industry || customerGroupIndustries[group] === filters.industry,
        );
        return `<div class="toolbar filter-toolbar customer-org-filter-toolbar">${filterField("行业名称", `<input class="input" id="customerOrgIndustryName" maxlength="100" value="${filters.industryName}">`)}${filterField("集团编号", `<input class="input" id="customerOrgGroupNumber" maxlength="100" value="${filters.groupNumber}">`)}${filterField("集团名称", `<input class="input" id="customerOrgGroupName" maxlength="100" value="${filters.groupName}">`)}${filterField("客户公司名称", `<input class="input" id="customerOrgCompanyName" maxlength="100" value="${filters.companyName}">`)}${filterField("行业编码", `<input class="input" id="customerOrgIndustryCode" maxlength="100" value="${filters.industryCode}">`)}${filterField("统一社会信用代码", `<input class="input" id="customerOrgCreditCode" maxlength="100" value="${filters.creditCode}">`)}${filterField("行业", `<select class="input" id="customerOrgIndustry"><option value="">全部</option>${industryOptions.map((item) => `<option ${item === filters.industry ? "selected" : ""}>${item}</option>`).join("")}</select>`)}${filterField("集团", `<select class="input" id="customerOrgGroup"><option value="">全部</option>${groupOptions.map((item) => `<option ${item === filters.group ? "selected" : ""}>${item}</option>`).join("")}</select>`)}${filterField("业务责任层级", customerOrgFilterMultiSelect("customerOrgLevels", ["省级", "市级", "区县级"], filters.levels))}${filterField("状态", customerOrgFilterMultiSelect("customerOrgStatuses", ["正常", "已停用"], filters.statuses))}${filterActions('<button class="btn" id="queryCustomerOrgNav" type="button">查询</button><button class="btn" id="resetCustomerOrgNav" type="button">重置</button>')}</div>`;
      }

      function customerOrgCompanyWorkspaceHtml(company, canEditSettings) {
        const tabs = `<div class="config-nav customer-org-company-tabs"><button class="tab ${customerOrgCompanyTab === "info" ? "active" : ""}" type="button" data-customer-org-company-tab="info">公司信息</button><button class="tab ${customerOrgCompanyTab === "organization" ? "active" : ""}" type="button" data-customer-org-company-tab="organization">部门与岗位</button></div>`;
        if (customerOrgCompanyTab === "info")
          return `${tabs}<div class="customer-org-company-info">${customerOrgCompanyInfoHtml(company, canEditSettings)}</div>`;
        const treeHtml = customerOrgInternalTreeHtml(company);
        const actions = canEditSettings
          ? '<button class="btn" data-action="add-department-template">新增客户部门</button><button class="btn" data-action="add-contact-position">新增标准岗位</button>'
          : '<span class="tag blue">只读</span>';
        return `${tabs}<div class="customer-org-internal-head"><div><div class="panel-title">${company.name}</div><div class="panel-sub">当前公司部门与岗位</div></div><div class="spacer"></div>${actions}</div><div class="customer-org-internal-layout"><div class="customer-org-internal-tree">${treeHtml || '<div class="empty">当前公司暂无部门或岗位</div>'}</div><div class="customer-org-internal-detail">${customerOrgDepartmentDetailHtml(company, canEditSettings)}</div></div>`;
      }

      function customerOrgDetailHtml(canEditSettings) {
        const [type, rawId = ""] = selectedCustomerOrgNode.split(":");
        if (type === "industry") {
          const industry = industries.find((item) => item.name === rawId);
          if (!industry) return '<div class="empty">请选择左侧节点</div>';
          const status = customerOrgStatus("industry", industry);
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${industry.name}</div><div class="customer-org-path">行业</div></div><span class="tag ${customerOrgStatusTone(status)}">${status}</span></div><div class="company-overview">${customerOrgDetailField("行业编码", industry.code)}${customerOrgDetailField("排序", industry.sort)}${customerOrgDetailField("更新时间", industry.updatedAt)}</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="edit-industry" data-id="${industries.indexOf(industry)}">编辑行业</button><button class="btn" data-action="add-group">新增集团</button></div>` : ""}`;
        }
        if (type === "group") {
          const group = rawId;
          const industry = customerGroupIndustries[group];
          const status = customerOrgStatus("group", group);
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${group}</div><div class="customer-org-path">${industry} / ${group}</div></div><span class="tag ${customerOrgStatusTone(status)}">${status}</span></div><div class="company-overview">${customerOrgDetailField("集团编号", customerGroupNumbers[group])}${customerOrgDetailField("所属行业", industry)}${customerOrgDetailField("统一社会信用代码", customerGroupCreditCodes[group] || "未填写")}</div><div class="role-note">客户公司按显式选择的组织上级形成公司子树；客户部门必须从具体客户公司节点新增。</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="add-customer">新增客户公司</button></div>` : ""}`;
        }
        if (type === "company") {
          const company = customers.find((item) => item.id === Number(rawId));
          if (!company) return '<div class="empty">客户公司不存在或已失效</div>';
          return customerOrgCompanyWorkspaceHtml(company, canEditSettings);
        }
        return '<div class="empty">请选择左侧节点查看详情</div>';
      }

      function renderCustomerOrgSettings(canEditSettings) {
        const addMenu = canEditSettings
          ? `<div style="position:relative"><button class="btn btn-primary" type="button" id="treeAddBtn">＋ 新增 ▾</button><div id="treeAddMenu" class="multi-select-menu hidden" style="right:0;top:100%;position:absolute;z-index:20"><button class="link" type="button" data-action="add-industry">新增行业</button><button class="link" type="button" data-action="add-group">新增集团</button><button class="link" type="button" data-action="add-customer">新增客户公司</button><button class="link" type="button" data-action="add-department-template">新增客户部门</button><button class="link" type="button" data-action="add-contact-position">新增标准岗位</button></div></div>`
          : '<span class="tag blue">只读</span>';
        return `<section class="panel"><div class="panel-head"><div><div class="panel-title">客户组织树</div><div class="panel-sub">先按行业、集团和客户公司定位主体，再维护当前公司的部门与岗位</div></div><div class="spacer"></div>${addMenu}</div>${customerOrgNavFiltersHtml()}<div class="customer-org-layout"><div class="customer-org-navigation"><div class="customer-org-pane-title">公司导航</div><div class="customer-org-tree">${customerOrgTreeHtml() || '<div class="empty">未找到符合条件的客户组织数据</div>'}</div></div><div class="customer-org-detail">${customerOrgDetailHtml(canEditSettings)}</div></div></section>`;
      }

      function renderSettings() {
        const canEditSettings = hasOperationPermission("settings.edit");
        const readOnlyAttribute = canEditSettings ? "" : "disabled";
        const tabs = `<div class="config-nav"><button class="tab ${settingsSection === "maintenance" ? "active" : ""}" data-settings-section="maintenance">职级周期与提醒</button><button class="tab ${settingsSection === "tree" ? "active" : ""}" data-settings-section="tree">客户组织树</button><button class="tab ${settingsSection === "automation" ? "active" : ""}" data-settings-section="automation">生日/节日规则</button></div>`;
        let content = "";
        let actions = "";
        if (settingsSection === "maintenance") {
          actions = '<span class="tag blue">每行独立保存</span>';
          const maintenanceRows = [
            ["\u4e00\u7ea7", "blue"], ["\u4e8c\u7ea7", "blue"], ["\u4e09\u7ea7", "blue"], ["\u56db\u7ea7", "blue"],
          ].map((item) => {
            const lv = item[0];
            const cyc = maintenanceConfig.cycles[lv] || 30;
            const remArr = String(maintenanceConfig.reminders[lv] || "3,1,0").split(",").map(Number);
            const tags = [30, 15, 10, 7, 5, 3, 2, 1, 0].map((d) => {
              const label = d === 0 ? "\u622a\u6b62\u65e5" : d + "\u5929\u524d";
              return "<label class='choice-item' style='padding:var(--space-1) var(--space-2)'><input type='checkbox' data-reminder-day='true' data-level='" + lv + "' id='rd-" + lv + "-" + d + "' value='" + d + "' " + (remArr.includes(d) ? "checked" : "") + " " + readOnlyAttribute + "><span>" + label + "</span></label>";
            }).join("");
            return "<tr><td><span class='tag " + item[1] + "'>" + lv + "</span></td>"
              + "<td><input id='lc-" + lv + "' class='input level-cycle' data-level='" + lv + "' type='number' min='1' max='365' value='" + cyc + "' style='width:88px' " + readOnlyAttribute + "></td>"
              + "<td><div class='choice-grid' style='gap:var(--space-1);flex-wrap:wrap'>" + tags + "</div></td>"
              + "<td><input id='lt-" + lv + "' class='input level-title' data-level='" + lv + "' maxlength='100' value='" + (maintenanceConfig.titles[lv] || "") + "' style='min-width:210px' " + readOnlyAttribute + ">"
              + "<textarea id='lr-" + lv + "' class='input level-requirement' data-level='" + lv + "' maxlength='1000' style='min-width:210px;margin-top:var(--space-2)' " + readOnlyAttribute + ">" + (maintenanceConfig.requirements[lv] || "") + "</textarea></td>"
              + "<td>" + (canEditSettings ? "<button class='btn' type='button' data-action='save-level-config' data-id='" + lv + "'>\u4fdd\u5b58</button>" : "\u2014") + "</td></tr>";
          }).join("");
          content = `<section class="panel"><div class="panel-head"><div><div class="panel-title">\u804c\u7ea7\u4e0e\u5e38\u89c4\u7ef4\u7cfb\u5468\u671f</div><div class="panel-sub">\u6bcf\u884c\u72ec\u7acb\u4fdd\u5b58\uff1b\u5df2\u5b58\u5728\u4efb\u52a1\u4e0d\u53d7\u5f71\u54cd\uff0c\u65b0\u4efb\u52a1\u6309\u65b0\u89c4\u5219\u8ba1\u7b97</div></div></div><div class="table-wrap"><table><thead><tr><th>\u804c\u7ea7</th><th>\u5468\u671f\uff08\u5929\uff09</th><th>\u63d0\u9192\u8282\u70b9\uff08\u52fe\u9009\uff09</th><th>\u6807\u9898\u6a21\u677f / \u6267\u884c\u8981\u6c42</th><th>\u64cd\u4f5c</th></tr></thead><tbody>${maintenanceRows}</tbody></table></div></section><section class="panel" style="margin-top:var(--space-4)"><div class="panel-head"><div><div class="panel-title">\u903e\u671f\u5347\u7ea7\u63d0\u9192</div><div class="panel-sub">\u5e38\u89c4\u4efb\u52a1\u65e0\u8865\u5b8c\u6210\u622a\u6b62\uff0c\u903e\u671f\u540e\u6301\u7eed\u6807\u7ea2\u76f4\u81f3\u8865\u5b8c\u6210\u6216\u53d7\u63a7\u5173\u95ed</div></div></div><div class="panel-body"><div class="form-grid"><div class="form-group"><label class="form-label">\u901a\u77e5\u533a\u57df\u603b\u76d1\uff08\u903e\u671f\u5929\u6570\uff09</label><input class="input" id="directorEscalation" type="number" min="1" max="365" value="${maintenanceConfig.directorEscalation}" ${readOnlyAttribute}></div><div class="form-group"><label class="form-label">\u901a\u77e5\u5e02\u573a\u526f\u603b\uff08\u903e\u671f\u5929\u6570\uff09</label><input class="input" id="vpEscalation" type="number" min="1" max="365" value="${maintenanceConfig.vpEscalation}" ${readOnlyAttribute}></div><div class="form-group full"><div class="role-note">\u4e24\u7ea7\u5347\u7ea7\u90fd\u53ea\u53d1\u9001\u6d88\u606f\u4e2d\u5fc3\u901a\u77e5\uff0c\u4e0d\u4ea7\u751f\u5f85\u529e\u3001\u5ba1\u6279\u6216\u6284\u9001\u5173\u7cfb\u3002</div></div><div class="form-group" style="align-self:end">${canEditSettings ? '<button class="btn" type="button" data-action="save-escalation">\u4fdd\u5b58\u5347\u7ea7\u63d0\u9192</button>' : ""}</div></div></div></section>`;
        }

        if (settingsSection === "tree")
          content = renderCustomerOrgSettings(canEditSettings);

        if (settingsSection === "automation")
          content = `<section class="panel"><div class="panel-head"><div><div class="panel-title">生日 / 节日自动任务规则</div><div class="panel-sub">规则集合系统预置，不提供新增；只有规则明确关联的节假日生成任务；省公司关键人由区域总监执行</div></div><div class="spacer"></div>${canEditSettings ? '<span class="tag blue">预置规则 · 仅可编辑与启停</span>' : '<span class="tag blue">只读</span>'}</div><div class="company-overview"><div class="overview-item"><label>年度节假日数据</label><div>${holidayCalendar.year} 年 · ${holidayCalendar.holidays.length} 个节日</div></div><div class="overview-item"><label>最近同步</label><div>${holidayCalendar.syncedAt}</div></div><div class="overview-item"><label>同步状态</label><div><span class="tag green">${holidayCalendar.status}</span>${canEditSettings ? ' <button class="link" type="button" data-action="sync-holidays">立即同步</button>' : ""}</div></div></div><div class="toolbar"><input class="input" id="ruleConfigKeyword" placeholder="搜索规则名称"><select class="input" id="ruleConfigType"><option value="">全部类型</option><option value="birthday">生日关怀</option><option value="holiday">节假日关怀</option></select><select class="input" id="ruleConfigStatus"><option value="">全部状态</option><option>启用</option><option>停用</option></select><span class="spacer"></span><span class="panel-sub" id="ruleConfigCount">共 ${ruleData.length} 条</span></div><div class="role-note">同步失败时继续使用最近成功版本，不删除已生成任务；生日与节假日规则都会校验职级和事件重叠，避免同一关键人同一事件重复生成。</div><div class="table-wrap"><table><thead><tr><th>规则 / 更新时间</th><th>类型 / 关联节假日</th><th>适用职级</th><th>生成 / 截止</th><th>提醒节点</th><th>状态</th><th>操作</th></tr></thead><tbody id="ruleConfigBody">${ruleData
            .map(
              (item) =>
                `<tr data-config-row data-keyword="${item.name}${item.title}" data-type="${item.type}" data-status="${item.status}"><td><strong>${item.name}</strong><div class="list-sub">${item.updatedAt || "—"}</div></td><td><span class="tag blue">${item.type === "birthday" ? "生日关怀" : "节假日关怀"}</span><div class="list-sub">${item.type === "holiday" ? ruleHolidayNames(item) || "未选择" : "关键人公历生日"}</div></td><td>${item.levels}</td><td>提前 ${item.lead} 天<div class="list-sub">事件日当天 23:59:59 截止</div></td><td>${item.reminders
                  .split(",")
                  .map((day) => (day === "0" ? "截止当天" : `提前${day}天`))
                  .join(
                    "、",
                  )}</td><td><span class="tag ${item.status === "启用" ? "green" : "red"}">${item.status}</span></td><td>${canEditSettings ? `<button class="link" type="button" data-action="edit-rule" data-id="${item.id}">编辑</button> · <button class="link" type="button" data-action="toggle-rule" data-id="${item.id}">${item.status === "启用" ? "停用" : "启用"}</button>` : "—"}</td></tr>`,
            )
            .join("")}</tbody></table></div></section>`;
        if (settingsSection === "industries")
          content = `<section class="panel"><div class="panel-head"><div><div class="panel-title">行业配置</div><div class="panel-sub">停用后不再进入新增与筛选候选，存量集团引用保留</div></div><div class="spacer"></div>${canEditSettings ? '<button class="btn btn-primary" data-action="add-industry">＋ 新增行业</button>' : '<span class="tag blue">只读</span>'}</div><div class="toolbar"><input class="input" id="industryConfigKeyword" placeholder="搜索名称或编码"><select class="input" id="industryConfigStatus"><option value="">全部状态</option><option value="正常">正常</option><option value="已停用">已停用</option></select><span class="spacer"></span><span class="panel-sub" id="industryConfigCount">共 ${industries.length} 条</span></div><div class="table-wrap"><table><thead><tr><th>行业名称 / 编码</th><th>引用集团数</th><th>状态</th><th>排序</th><th>更新时间</th><th>操作</th></tr></thead><tbody id="industryConfigBody">${industries.map((item, index) => `<tr data-config-row data-keyword="${item.name}${item.code}" data-status="${item.enabled ? "正常" : "已停用"}"><td><strong>${item.name}</strong><div class="list-sub">${item.code}</div></td><td>${new Set(customers.filter((customer) => customer.industry === item.name).map((customer) => customer.group)).size}</td><td><span class="tag ${item.enabled ? "green" : "red"}">${item.enabled ? "正常" : "已停用"}</span></td><td>${item.sort}</td><td>${item.updatedAt}</td><td>${canEditSettings ? `<button class="link" type="button" data-action="edit-industry" data-id="${index}">编辑</button> · <button class="link" type="button" data-action="toggle-industry" data-id="${index}">${item.enabled ? "停用" : "恢复"}</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
        return (
          pageHead(
            "客户基础配置",
            canEditSettings
              ? "配置按业务对象分类维护，切换分类时仅展示当前配置。"
              : "当前账号仅可查看配置和筛选结果，不能新增、编辑、停用或同步。",
            actions,
          ) +
          tabs +
          content
        );
      }
