      function customerOrgCompanyParent(company, groupCompanies) {
        if (company.level === "省公司") return null;
        if (company.level === "市公司")
          return (
            groupCompanies.find(
              (item) =>
                item.level === "省公司" && item.province === company.province,
            ) || null
          );
        return (
          groupCompanies.find(
            (item) =>
              item.level === "市公司" &&
              item.province === company.province &&
              item.city === company.city,
          ) ||
          groupCompanies.find(
            (item) =>
              item.level === "省公司" && item.province === company.province,
          ) ||
          null
        );
      }

      function customerOrgDepartmentsForCompany(company) {
        return customerDepartments.filter(
          (department) =>
            !department.archived &&
            department.company === company.name,
        );
      }

      function customerOrgPositionsForDepartment(department) {
        return contactPositionCatalog.filter(
          (position) =>
            position.status === "正常" &&
            position.departmentId === department.id,
        );
      }

      function customerOrgNodeHtml({ key, type, label, depth, hasChildren, meta = "" }) {
        const expanded = expandedCustomerOrgNodes.has(key);
        const icon = { industry: "▦", group: "◉", company: "▣", department: "▤", position: "●" }[type];
        return `<button class="tree-node customer-org-node ${selectedCustomerOrgNode === key ? "active" : ""}" type="button" data-customer-org-select="${key}" style="padding-left:${9 + depth * 18}px"><span class="tree-toggle" data-customer-org-toggle="${hasChildren ? key : ""}" aria-label="${hasChildren ? expanded ? "收起" : "展开" : "叶节点"}">${hasChildren ? expanded ? "▾" : "▸" : "·"}</span><span class="node-icon">${icon}</span><span class="node-label" title="${label}">${label}</span><span class="node-meta">${meta}</span></button>`;
      }

      function customerOrgDepartmentTreeHtml(company, department, departments, depth) {
        const children = departments.filter((item) => item.parent === department.name);
        const positions = customerOrgPositionsForDepartment(department);
        const hasChildren = children.length > 0 || positions.length > 0;
        const key = `department:${department.id}`;
        let html = customerOrgNodeHtml({
          key,
          type: "department",
          label: department.name,
          depth,
          hasChildren,
        });
        if (!hasChildren || !expandedCustomerOrgNodes.has(key)) return html;
        children
          .slice()
          .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
          .forEach((child) => {
            html += customerOrgDepartmentTreeHtml(
              company,
              child,
              departments,
              depth + 1,
            );
          });
        positions
          .slice()
          .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
          .forEach((position) => {
            html += customerOrgNodeHtml({
              key: `position:${position.id}`,
              type: "position",
              label: position.name,
              depth: depth + 1,
              hasChildren: false,
            });
          });
        return html;
      }

      function customerOrgCompanyTreeHtml(company, groupCompanies, depth = 2) {
        const childCompanies = groupCompanies.filter(
          (item) => customerOrgCompanyParent(item, groupCompanies)?.id === company.id,
        );
        const departments = customerOrgDepartmentsForCompany(company);
        const rootDepartments = departments.filter(
          (item) =>
            !item.parent ||
            ["无", "—"].includes(item.parent) ||
            !departments.some((candidate) => candidate.name === item.parent),
        );
        const hasChildren = childCompanies.length > 0 || rootDepartments.length > 0;
        const key = `company:${company.id}`;
        let html = customerOrgNodeHtml({
          key,
          type: "company",
          label: company.name,
          depth,
          hasChildren,
          meta: `<span class="tag blue">${company.level}</span>`,
        });
        if (!hasChildren || !expandedCustomerOrgNodes.has(key)) return html;
        childCompanies
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
          .forEach((child) => {
            html += customerOrgCompanyTreeHtml(child, groupCompanies, depth + 1);
          });
        rootDepartments
          .slice()
          .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
          .forEach((department) => {
            html += customerOrgDepartmentTreeHtml(
              company,
              department,
              departments,
              depth + 1,
            );
          });
        return html;
      }

      function customerOrgTreeHtml() {
        return industries
          .filter((industry) => industry.enabled)
          .map((industry) => {
            const groups = customerGroupNames.filter(
              (group) => customerGroupIndustries[group] === industry.name,
            );
            const industryKey = `industry:${industry.name}`;
            let html = customerOrgNodeHtml({
              key: industryKey,
              type: "industry",
              label: industry.name,
              depth: 0,
              hasChildren: groups.length > 0,
              meta: `<span class="tag">${industry.code}</span>`,
            });
            if (!expandedCustomerOrgNodes.has(industryKey)) return html;
            groups.forEach((group) => {
              const groupCompanies = customers.filter(
                (company) => !company.archived && company.group === group,
              );
              const roots = groupCompanies.filter(
                (company) => !customerOrgCompanyParent(company, groupCompanies),
              );
              const groupKey = `group:${group}`;
              html += customerOrgNodeHtml({
                key: groupKey,
                type: "group",
                label: group,
                depth: 1,
                hasChildren: roots.length > 0,
                meta: `<span class="tag green">${groupCompanies.length} 家</span>`,
              });
              if (!expandedCustomerOrgNodes.has(groupKey)) return;
              roots
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
                .forEach((company) => {
                  html += customerOrgCompanyTreeHtml(company, groupCompanies);
                });
            });
            return html;
          })
          .join("");
      }

      function customerOrgDetailHtml(canEditSettings) {
        const [type, rawId = ""] = selectedCustomerOrgNode.split(":");
        const field = (label, value) =>
          `<div class="overview-item"><label>${label}</label><div>${value || "—"}</div></div>`;
        if (type === "industry") {
          const industry = industries.find((item) => item.name === rawId);
          if (!industry) return '<div class="empty">请选择左侧节点</div>';
          const groupCount = customerGroupNames.filter(
            (group) => customerGroupIndustries[group] === industry.name,
          ).length;
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${industry.name}</div><div class="customer-org-path">行业</div></div><span class="tag green">正常</span></div><div class="company-overview">${field("行业编码", industry.code)}${field("引用集团", `${groupCount} 个`)}${field("排序", industry.sort)}${field("更新时间", industry.updatedAt)}</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="edit-industry" data-id="${industries.indexOf(industry)}">编辑行业</button><button class="btn btn-primary" data-action="add-group">新增集团</button></div>` : ""}`;
        }
        if (type === "group") {
          const group = rawId;
          const companies = customers.filter(
            (company) => !company.archived && company.group === group,
          );
          const industry = customerGroupIndustries[group];
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${group}</div><div class="customer-org-path">${industry} / ${group}</div></div><span class="tag green">正常</span></div><div class="company-overview">${field("所属行业", industry)}${field("集团编码", `CG${String(customerGroupNames.indexOf(group) + 1).padStart(8, "0")}`)}${field("统一社会信用代码", customerGroupCreditCodes[group] || "未填写")}${field("客户公司数量", `${companies.length} 家`)}</div><div class="role-note">客户公司按公司层级及责任省、市、区县自动形成公司子树；客户部门必须从具体客户公司节点新增。</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn btn-primary" data-action="add-customer">新增客户公司</button></div>` : ""}`;
        }
        if (type === "company") {
          const company = customers.find((item) => item.id === Number(rawId));
          if (!company) return '<div class="empty">客户公司不存在或已失效</div>';
          const departments = customerOrgDepartmentsForCompany(company);
          const groupCompanies = customers.filter((item) => !item.archived && item.group === company.group);
          const parent = customerOrgCompanyParent(company, groupCompanies);
          const organizationPath = `${company.group} / ${parent ? `${parent.name} / ` : ""}${company.name}`;
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${company.name}</div><div class="customer-org-path">${organizationPath}</div></div><span class="tag green">正常</span></div><div class="company-overview">${field("公司编码", company.companyCode || `CC${String(company.id).padStart(8, "0")}`)}${field("所属行业", company.industry)}${field("所属集团", company.group)}${field("公司层级", company.level)}${field("自动归属父级", parent?.name || company.group)}${field("责任省/市/区县", adminArea(company))}${field("统一社会信用代码", company.creditCode || "未填写")}${field("更新时间", company.updatedAt || "2026-08-17 09:30")}</div><div class="role-note">父级由同集团内的公司层级和责任区划自动计算；本页只维护组织主数据，不展示负责人、关键人、任务或 KPI。</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn btn-primary" data-action="add-department-template">新增客户部门</button>${stopObjectActionHtml("customer", company.id)}</div>` : ""}`;
        }
        if (type === "department") {
          const department = customerDepartments.find(
            (item) => item.id === Number(rawId),
          );
          if (!department) return '<div class="empty">客户部门不存在或已失效</div>';
          const company = customers.find((item) => item.name === department.company);
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${department.name}</div><div class="customer-org-path">${department.group} / ${department.company} / ${customerDepartmentPath(department)}</div></div><span class="tag green">${department.status}</span></div><div class="company-overview">${field("部门编码", department.code)}${field("所属行业", company?.industry)}${field("所属集团", department.group)}${field("所属客户公司", department.company)}${field("上级部门", department.parent === "无" ? "公司直属部门" : department.parent)}${field("排序", department.sort)}${field("部门说明", department.duty || "未填写")}${field("更新时间", department.updatedAt)}</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn" data-action="edit-department-template" data-id="${department.id}">编辑部门</button><button class="btn" data-action="add-department-template">新增下级部门</button><button class="btn btn-primary" data-action="add-contact-position">新增标准岗位</button><button class="btn" data-action="stop-department-template" data-id="${department.id}">申请停用</button></div>` : ""}`;
        }
        if (type === "position") {
          const position = contactPositionCatalog.find((item) => item.id === rawId);
          if (!position) return '<div class="empty">标准岗位不存在或已失效</div>';
          const department = customerDepartments.find((item) => item.id === position.departmentId);
          const company = customers.find((item) => item.name === position.company);
          return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${position.name}</div><div class="customer-org-path">${position.group} / ${position.company} / ${department?.name || "待补齐部门"} / ${position.name}</div></div><span class="tag ${position.status === "正常" ? "green" : "red"}">${position.status}</span></div><div class="company-overview">${field("岗位编码", position.code)}${field("所属行业", company?.industry)}${field("所属集团", position.group)}${field("所属客户公司", position.company)}${field("所属部门", department?.name || "待补齐部门归属")}${field("排序", position.sort)}${field("更新时间", position.updatedAt)}</div><div class="section-title">岗位别名</div><div>${position.aliases.map((name) => `<span class="tag" style="margin-right:5px">${name}</span>`).join("") || "无"}</div>${canEditSettings ? `<div class="customer-org-actions"><button class="btn btn-primary" data-action="edit-contact-position" data-id="${position.id}">编辑岗位</button><button class="btn" data-action="toggle-contact-position" data-id="${position.id}">${position.status === "正常" ? "停用" : "恢复"}</button></div>` : ""}`;
        }
        return '<div class="empty">请选择左侧节点查看详情</div>';
      }

      function renderCustomerOrgSettings(canEditSettings) {
        const addMenu = canEditSettings
          ? `<div style="position:relative"><button class="btn btn-primary" type="button" id="treeAddBtn">＋ 新增 ▾</button><div id="treeAddMenu" class="multi-select-menu hidden" style="right:0;top:100%;position:absolute;z-index:20"><button class="link" type="button" data-action="add-industry">新增行业</button><button class="link" type="button" data-action="add-group">新增集团</button><button class="link" type="button" data-action="add-customer">新增客户公司</button><button class="link" type="button" data-action="add-department-template">新增客户部门</button><button class="link" type="button" data-action="add-contact-position">新增标准岗位</button></div></div>`
          : '<span class="tag blue">只读</span>';
        return `<section class="panel"><div class="panel-head"><div><div class="panel-title">客户组织树</div><div class="panel-sub">行业 → 集团 → 客户公司 → 客户部门 → 标准岗位，仅维护组织主数据</div></div><div class="spacer"></div>${addMenu}</div><div class="customer-org-layout"><div class="customer-org-tree">${customerOrgTreeHtml() || '<div class="empty">暂无客户组织数据</div>'}</div><div class="customer-org-detail">${customerOrgDetailHtml(canEditSettings)}</div></div></section>`;
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
            ["\u4e00\u7ea7", "red"], ["\u4e8c\u7ea7", "orange"], ["\u4e09\u7ea7", "blue"], ["\u56db\u7ea7", ""],
          ].map((item) => {
            const lv = item[0];
            const cyc = maintenanceConfig.cycles[lv] || 30;
            const remArr = String(maintenanceConfig.reminders[lv] || "3,1,0").split(",").map(Number);
            const tags = [30, 15, 10, 7, 5, 3, 2, 1, 0].map((d) => {
              const label = d === 0 ? "\u622a\u6b62\u65e5" : d + "\u5929\u524d";
              return "<label class='choice-item' style='padding:2px 8px'><input type='checkbox' data-reminder-day='true' data-level='" + lv + "' id='rd-" + lv + "-" + d + "' value='" + d + "' " + (remArr.includes(d) ? "checked" : "") + " " + readOnlyAttribute + "><span>" + label + "</span></label>";
            }).join("");
            return "<tr><td><span class='tag " + item[1] + "'>" + lv + "</span></td>"
              + "<td><input id='lc-" + lv + "' class='input level-cycle' data-level='" + lv + "' type='number' min='1' max='365' value='" + cyc + "' style='width:88px' " + readOnlyAttribute + "></td>"
              + "<td><div class='choice-grid' style='gap:4px;flex-wrap:wrap'>" + tags + "</div></td>"
              + "<td><input id='lt-" + lv + "' class='input level-title' data-level='" + lv + "' maxlength='100' value='" + (maintenanceConfig.titles[lv] || "") + "' style='min-width:210px' " + readOnlyAttribute + ">"
              + "<textarea id='lr-" + lv + "' class='input level-requirement' data-level='" + lv + "' maxlength='1000' style='min-width:210px;margin-top:6px' " + readOnlyAttribute + ">" + (maintenanceConfig.requirements[lv] || "") + "</textarea></td>"
              + "<td>" + (canEditSettings ? "<button class='btn btn-primary' type='button' style='padding:4px 12px;font-size:12px' data-action='save-level-config' data-id='" + lv + "'>\u4fdd\u5b58</button>" : "\u2014") + "</td></tr>";
          }).join("");
          content = `<section class="panel"><div class="panel-head"><div><div class="panel-title">\u804c\u7ea7\u4e0e\u5e38\u89c4\u7ef4\u7cfb\u5468\u671f</div><div class="panel-sub">\u6bcf\u884c\u72ec\u7acb\u4fdd\u5b58\uff1b\u5df2\u5b58\u5728\u4efb\u52a1\u4e0d\u53d7\u5f71\u54cd\uff0c\u65b0\u4efb\u52a1\u6309\u65b0\u89c4\u5219\u8ba1\u7b97</div></div></div><div class="table-wrap"><table><thead><tr><th>\u804c\u7ea7</th><th>\u5468\u671f\uff08\u5929\uff09</th><th>\u63d0\u9192\u8282\u70b9\uff08\u52fe\u9009\uff09</th><th>\u6807\u9898\u6a21\u677f / \u6267\u884c\u8981\u6c42</th><th>\u64cd\u4f5c</th></tr></thead><tbody>${maintenanceRows}</tbody></table></div></section><section class="panel" style="margin-top:14px"><div class="panel-head"><div><div class="panel-title">\u903e\u671f\u5347\u7ea7\u63d0\u9192</div><div class="panel-sub">\u5e38\u89c4\u4efb\u52a1\u65e0\u8865\u5b8c\u6210\u622a\u6b62\uff0c\u903e\u671f\u540e\u6301\u7eed\u6807\u7ea2\u76f4\u81f3\u8865\u5b8c\u6210\u6216\u53d7\u63a7\u5173\u95ed</div></div></div><div class="panel-body"><div class="form-grid"><div class="form-group"><label class="form-label">\u901a\u77e5\u533a\u57df\u603b\u76d1\uff08\u903e\u671f\u5929\u6570\uff09</label><input class="input" id="directorEscalation" type="number" min="1" max="365" value="${maintenanceConfig.directorEscalation}" ${readOnlyAttribute}></div><div class="form-group"><label class="form-label">\u901a\u77e5\u5e02\u573a\u526f\u603b\uff08\u903e\u671f\u5929\u6570\uff09</label><input class="input" id="vpEscalation" type="number" min="1" max="365" value="${maintenanceConfig.vpEscalation}" ${readOnlyAttribute}></div><div class="form-group full"><div class="role-note">\u4e24\u7ea7\u5347\u7ea7\u90fd\u53ea\u53d1\u9001\u6d88\u606f\u4e2d\u5fc3\u901a\u77e5\uff0c\u4e0d\u4ea7\u751f\u5f85\u529e\u3001\u5ba1\u6279\u6216\u6284\u9001\u5173\u7cfb\u3002</div></div><div class="form-group" style="align-self:end">${canEditSettings ? '<button class="btn btn-primary" type="button" data-action="save-escalation">\u4fdd\u5b58\u5347\u7ea7\u63d0\u9192</button>' : ""}</div></div></div></section>`;
        }

        if (settingsSection === "tree")
          content = renderCustomerOrgSettings(canEditSettings);

        if (settingsSection === "automation")
          content = `<section class="panel"><div class="panel-head"><div><div class="panel-title">生日 / 节日自动任务规则</div><div class="panel-sub">规则集合系统预置，不提供新增；只有规则明确关联的节假日生成任务；省公司关键人由区域总监执行</div></div><div class="spacer"></div>${canEditSettings ? '<span class="tag blue">预置规则 · 仅可编辑与启停</span>' : '<span class="tag blue">只读</span>'}</div><div class="company-overview"><div class="overview-item"><label>年度节假日数据</label><div>${holidayCalendar.year} 年 · ${holidayCalendar.holidays.length} 个节日</div></div><div class="overview-item"><label>最近同步</label><div>${holidayCalendar.syncedAt}</div></div><div class="overview-item"><label>同步状态</label><div><span class="tag green">${holidayCalendar.status}</span>${canEditSettings ? ' <button class="link" type="button" data-action="sync-holidays">立即同步</button>' : ""}</div></div></div><div class="toolbar"><input class="input" id="ruleConfigKeyword" placeholder="搜索规则名称"><select class="input" id="ruleConfigType"><option value="">全部类型</option><option value="birthday">生日关怀</option><option value="holiday">节假日关怀</option></select><select class="input" id="ruleConfigStatus"><option value="">全部状态</option><option>启用</option><option>停用</option></select><span class="spacer"></span><span class="panel-sub" id="ruleConfigCount">共 ${ruleData.length} 条</span></div><div class="role-note">同步失败时继续使用最近成功版本，不删除已生成任务；生日与节假日规则都会校验职级和事件重叠，避免同一关键人同一事件重复生成。</div><div class="table-wrap"><table><thead><tr><th>规则 / 更新时间</th><th>类型 / 关联节假日</th><th>适用职级</th><th>生成 / 截止</th><th>提醒节点</th><th>状态</th><th>操作</th></tr></thead><tbody id="ruleConfigBody">${ruleData
            .map(
              (item) =>
                `<tr data-config-row data-keyword="${item.name}${item.title}" data-type="${item.type}" data-status="${item.status}"><td><strong>${item.name}</strong><div class="list-sub">${item.updatedAt || "—"}</div></td><td><span class="tag ${item.type === "birthday" ? "blue" : "orange"}">${item.type === "birthday" ? "生日关怀" : "节假日关怀"}</span><div class="list-sub">${item.type === "holiday" ? ruleHolidayNames(item) || "未选择" : "关键人公历生日"}</div></td><td>${item.levels}</td><td>提前 ${item.lead} 天<div class="list-sub">事件日当天 23:59:59 截止</div></td><td>${item.reminders
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

