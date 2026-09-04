      function customerMatchesAppliedFilter(company) {
        const {
          group,
          groupNumber,
          groupName,
          companyName,
          personCode,
          personName,
          personWechat,
          industries,
          levels,
          personPhone,
          pms,
          coverage,
          departments,
          positions,
          departmentCoverage,
          positionCoverage,
          provinces,
          cities,
          districts,
        } = appliedCustomerFilter;
        const people = scopedContacts().filter(
          (person) => person.company === company.name,
        );
        const phoneKey = String(personPhone || "").replace(/\D/g, "");
        const contactCriteriaActive = Boolean(
          personCode ||
            personName ||
            personWechat ||
            phoneKey ||
            departments.size ||
            positions.size,
        );
        const matchingPeople = people.filter((person) => {
          const normalizedPhone = String(person.phone || "").replace(/\D/g, "");
          const personDepartmentId = String(
            customerDepartments.find(
              (department) =>
                department.company === company.name &&
                department.name === person.department,
            )?.id || "",
          );
          const phoneMatches =
            !phoneKey ||
            (phoneKey.length === 11
              ? normalizedPhone === phoneKey
              : normalizedPhone.endsWith(phoneKey));
          const positionMatches =
            !positions.size || positions.has(person.positionId);
          return (
            (!personCode || String(person.code || "").includes(personCode)) &&
            (!personName || person.name.includes(personName)) &&
            (!personWechat || String(person.wechat || "").includes(personWechat)) &&
            phoneMatches &&
            (!departments.size || departments.has(personDepartmentId)) &&
            positionMatches
          );
        });
        const departmentCovered = matchingPeople.length > 0;
        const positionCovered = matchingPeople.length > 0;
        const missingDimensionRequested =
          (departmentCoverage === "none" && departments.size === 1) ||
          (positionCoverage === "none" && positions.size === 1);
        return (
          (!group || company.group === group) &&
          (!groupNumber ||
            String(customerGroupNumbers[company.group] || "")
              .toUpperCase()
              .includes(String(groupNumber).toUpperCase())) &&
          (!groupName || company.group.includes(groupName)) &&
          (!companyName || company.name.includes(companyName)) &&
          (!industries.size || industries.has(company.industry)) &&
          (!levels.size ||
            levels.has(customerBusinessResponsibilityLevel(company))) &&
          (!pms.size || pms.has(customerOwnerName(company))) &&
          (!contactCriteriaActive ||
            matchingPeople.length > 0 ||
            missingDimensionRequested) &&
          (!coverage ||
            (coverage === "none" ? people.length === 0 : people.length > 0)) &&
          (!departmentCoverage ||
            departments.size !== 1 ||
            (departmentCoverage === "none" ? !departmentCovered : departmentCovered)) &&
          (!positionCoverage ||
            positions.size !== 1 ||
            (positionCoverage === "none" ? !positionCovered : positionCovered)) &&
          (!provinces.size || provinces.has(customerBusinessProvince(company))) &&
          (!cities.size || cities.has(customerBusinessCity(company))) &&
          (!districts.size || districts.has(customerBusinessDistrict(company)))
        );
      }
      let customerFilterExpanded = false;

      function contactMatchesAppliedFilter(person) {
        const code = appliedCustomerFilter.personCode || "";
        const name = appliedCustomerFilter.personName || "";
        const wechat = appliedCustomerFilter.personWechat || "";
        const phoneKey = String(appliedCustomerFilter.personPhone || "").replace(
          /\D/g,
          "",
        );
        const normalizedPhone = String(person.phone || "").replace(/\D/g, "");
        const company = customers.find((item) => item.name === person.company);
        const personDepartmentId = String(
          customerDepartments.find(
            (department) =>
              department.company === company?.name &&
              department.name === person.department,
          )?.id || "",
        );
        const positionMatches =
          !appliedCustomerFilter.positions.size ||
          appliedCustomerFilter.positions.has(person.positionId);
        return (
          (!code || person.code.includes(code)) &&
          (!name || person.name.includes(name)) &&
          (!wechat || person.wechat.includes(wechat)) &&
          (!phoneKey ||
            (phoneKey.length === 11
              ? normalizedPhone === phoneKey
              : normalizedPhone.endsWith(phoneKey))) &&
          (!appliedCustomerFilter.departments.size ||
            appliedCustomerFilter.departments.has(personDepartmentId)) &&
          positionMatches
        );
      }

      function renderOperations() {
        if (lastRenderedPage !== "operations") customerFilterExpanded = false;
        const customersInScope = scopedCustomers().filter(
          customerMatchesAppliedFilter,
        );
        const operationTasks = scopedTasks();
        if (
          selectedOperationCustomerId !== null &&
          !customersInScope.some(
            (item) => item.id === selectedOperationCustomerId,
          )
        ) {
          selectedOperationCustomerId = null;
          selectedOperationContactId = null;
        }
        if (
          selectedCustomerGroup &&
          !customersInScope.some(
            (company) => company.group === selectedCustomerGroup,
          )
        ) {
          selectedCustomerGroup = "";
          selectedOperationContactId = null;
        }
        if (
          selectedOperationRegion &&
          !customersInScope.some(
            (company) => customerRegionLabel(company) === selectedOperationRegion,
          )
        ) {
          selectedOperationRegion = "";
          selectedOperationProvince = "";
          selectedOperationRegionGroup = "";
          selectedOperationContactId = null;
        }
        if (
          selectedOperationProvince &&
          !customersInScope.some(
            (company) =>
              customerRegionLabel(company) === selectedOperationRegion &&
              customerBusinessProvince(company) === selectedOperationProvince,
          )
        ) {
          selectedOperationProvince = "";
          selectedOperationRegionGroup = "";
          selectedOperationContactId = null;
        }
        if (
          selectedOperationRegionGroup &&
          !customersInScope.some(
            (company) =>
              customerRegionLabel(company) === selectedOperationRegion &&
              customerBusinessProvince(company) === selectedOperationProvince &&
              company.group === selectedOperationRegionGroup,
          )
        ) {
          selectedOperationRegionGroup = "";
          selectedOperationContactId = null;
        }
        const selectedCustomer = customersInScope.find(
          (item) => item.id === selectedOperationCustomerId,
        );
        const contextCustomers = selectedCustomer
          ? [selectedCustomer]
          : customerTreeDimension === "group" && selectedCustomerGroup
            ? customersInScope.filter(
                (company) => company.group === selectedCustomerGroup,
              )
            : customerTreeDimension === "region" && selectedOperationRegion
              ? customersInScope.filter(
                  (company) =>
                    customerRegionLabel(company) === selectedOperationRegion &&
                    (!selectedOperationProvince ||
                      customerBusinessProvince(company) === selectedOperationProvince) &&
                    (!selectedOperationRegionGroup ||
                      company.group === selectedOperationRegionGroup),
                )
              : [];
        const personHasOverdueTask = (person) => contactHasOverdue(person);
        const people = scopedContacts()
          .filter((person) =>
            contextCustomers.some((company) => company.name === person.company),
          )
          .filter(contactMatchesAppliedFilter)
          .sort((a, b) => {
            const overdueOrder =
              Number(personHasOverdueTask(b)) -
              Number(personHasOverdueTask(a));
            if (overdueOrder) return overdueOrder;
            const decisionOrder = Number(b.decision) - Number(a.decision);
            if (decisionOrder) return decisionOrder;
            const leftLast = a.last === "从未" ? "0000-00-00" : a.last || "0000-00-00";
            const rightLast = b.last === "从未" ? "0000-00-00" : b.last || "0000-00-00";
            return (
              leftLast.localeCompare(rightLast) ||
              String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
              a.id - b.id
            );
          });
        if (!people.some((person) => person.id === selectedOperationContactId))
          selectedOperationContactId = null;
        const selectedPerson = people.find(
          (person) => person.id === selectedOperationContactId,
        );
        const activeTasks = selectedPerson
          ? operationTasks.filter(
            (task) =>
                task.person === selectedPerson.name &&
                task.company === selectedPerson.company &&
                !["done", "cancelled"].includes(task.status),
            )
          : [];
        const nextTask = activeTasks
          .filter(taskCanTakeAction)
          .slice()
          .sort(
            (a, b) =>
              personTaskOrder(a) - personTaskOrder(b) ||
              a.due.localeCompare(b.due) ||
              a.executionCode.localeCompare(b.executionCode),
          )[0];
        const allPersonRecords = selectedPerson
          ? scopedRecords()
              .filter(
                (record) =>
                  record.person === selectedPerson.name &&
                  record.company === selectedPerson.company,
              )
              .sort(
                (a, b) =>
                  String(b.maintenanceAt || b.date || "").localeCompare(
                    String(a.maintenanceAt || a.date || ""),
                  ) || String(b.id).localeCompare(String(a.id)),
              )
          : [];
        const records = allPersonRecords.slice(0, 3);
        const baseScopeLabel =
          currentUser.role === "pm"
            ? `负责地市：${assignedCitiesForCurrentUser().join("、") || "未配置"}`
            : currentUser.role === "director"
              ? currentUser.region
              : "全国市场";
        const scopeLabel = baseScopeLabel;
        selectedCustomerId = selectedOperationCustomerId;
        const customerItems =
          customerTreeDimension === "region"
            ? customerRegionTreeRows(customersInScope)
            : customerTreeRows(customersInScope);
        let personItems = people
          .map(
            (person) =>
              `<button class="operations-item ${person.id === selectedOperationContactId ? "active" : ""}" data-operation-contact="${person.id}"><div class="avatar">${person.name[0]}</div><div class="operations-item-main"><div class="operations-item-title">${person.name} ${person.decision ? '<span class="tag blue">关键决策人</span>' : ""} ${personHasOverdueTask(person) ? '<span class="tag red">已逾期</span>' : ""}</div><div class="operations-item-sub">${person.title || "职务待完善"} · ${person.department || "部门待完善"} · ${person.gender || "性别待完善"}</div></div>${completenessHtml(person)}</button>`,
          )
          .join("");
        const personItemsHost = document.createElement("div");
        personItemsHost.innerHTML = personItems;
        personItemsHost
          .querySelectorAll("[data-operation-contact]")
          .forEach((item, index) => {
            const subtitle = item.querySelector(".operations-item-sub");
            const person = people[index];
            if (subtitle && person)
              subtitle.textContent = `${person.code} · ${person.company} · ${person.department} / ${person.positionName} · ${person.level} · 最近联系 ${person.last || "从未"}`;
            const title = item.querySelector(".operations-item-title");
            if (title && person && !personHasOverdueTask(person))
              title.insertAdjacentHTML(
                "beforeend",
                ' <span class="tag green">健康</span>',
              );
          });
        personItems = personItemsHost.innerHTML;
        const selectedGroupCustomers = selectedCustomerGroup
          ? customersInScope.filter(
              (company) => company.group === selectedCustomerGroup,
            )
          : [];
        const groupIndustry =
          customerGroupIndustries[selectedCustomerGroup] ||
          selectedGroupCustomers[0]?.industry ||
          "待配置";
        const groupDetail = selectedCustomerGroup
          ? `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${selectedCustomerGroup}</div><div class="customer-company-path">集团公司详情 · ${groupIndustry}</div></div><span class="tag green">正常</span></div><div class="customer-company-summary"><div class="overview-item"><label>集团编号</label><div>${customerGroupNumbers[selectedCustomerGroup]}</div></div><div class="overview-item"><label>集团名称</label><div>${selectedCustomerGroup}</div></div><div class="overview-item"><label>行业</label><div>${groupIndustry}</div></div><div class="overview-item"><label>统一社会信用代码</label><div>${customerGroupCreditCodes[selectedCustomerGroup] || "未填写"}</div></div><div class="overview-item"><label>客户单位</label><div>${selectedGroupCustomers.length} 家</div></div><div class="overview-item"><label>有效关键人</label><div>${people.length} 人</div></div></div><div class="operations-next"><h4>集团客户结构</h4><p>中栏展示当前筛选范围内该集团全部关键人；集团与客户公司主数据统一在“客户基础配置”维护。</p><div class="operations-company-actions">${currentUser.fullAccess ? `<button class="btn" data-action="go-customer-settings" data-kind="group" data-id="${selectedCustomerGroup}">前往客户基础配置</button>` : ""}</div></div>`
          : '<div class="empty"><div><div class="empty-icon">□</div>请选择客户公司或关键人</div></div>';
        const companyDetail = selectedCustomer
          ? `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${selectedCustomer.name}</div><div class="customer-company-path">${customerOrganizationPath(selectedCustomer)} · 业务责任 ${customerBusinessResponsibilityLevel(selectedCustomer)} / ${adminArea(selectedCustomer)}</div></div>${healthTag(customerHealth(selectedCustomer))}${selectedCustomer.responsibilityAnomaly ? '<span class="tag red">责任配置异常</span>' : ""}</div><div class="customer-company-summary"><div class="overview-item"><label>集团公司</label><div>${selectedCustomer.group}</div></div><div class="overview-item"><label>行业</label><div>${selectedCustomer.industry}</div></div><div class="overview-item"><label>组织上级</label><div>${customerOrganizationParent(selectedCustomer)?.name || selectedCustomer.group}</div></div><div class="overview-item"><label>业务责任层级</label><div>${customerBusinessResponsibilityLevel(selectedCustomer)}</div></div><div class="overview-item"><label>业务责任省/市/区县</label><div>${adminArea(selectedCustomer)}</div></div><div class="overview-item"><label>区域中心</label><div>${customerRegionLabel(selectedCustomer)}</div></div><div class="overview-item"><label>客户负责人</label><div>${customerOwnerName(selectedCustomer)}</div></div><div class="overview-item"><label>有效关键人</label><div>${people.length} 人</div></div></div>${selectedCustomer.responsibilityAnomaly ? `<div class="role-note danger-note">客户健康仍按维系任务显示为${customerHealth(selectedCustomer)}；责任异常独立展示。${selectedCustomer.responsibilityAnomalyReason}</div>` : ""}<div class="operations-next"><h4>${people.length ? `已维护 ${people.length} 名关键人` : "尚未维护关键人"}</h4><p>从中间选择关键人可查看待办任务与维系动态；集团与客户公司主数据统一在“客户基础配置”维护。</p><div class="operations-company-actions">${canMaintainContactForCompany(selectedCustomer) ? '<button class="btn btn-primary" data-operation-add-contact>＋ 新增关键人</button>' : ""}<button class="btn" data-customer="${selectedCustomer.id}">查看完整档案</button>${currentUser.fullAccess ? `<button class="btn" data-action="go-customer-settings" data-kind="company" data-id="${selectedCustomer.id}">前往客户基础配置</button>` : ""}</div></div>`
          : groupDetail;
        const personDetail = selectedPerson
          ? `<div class="detail-hero"><div class="avatar">${selectedPerson.name[0]}</div><div><div class="detail-name">${selectedPerson.name} <span class="tag blue">${selectedPerson.level}</span>${personHasOverdueTask(selectedPerson) ? ' <span class="tag red">当前逾期</span>' : ""}</div><div class="detail-sub">${selectedPerson.positionName} · ${selectedPerson.department}</div></div><div class="spacer"></div>${canMaintainContact(selectedPerson) ? `<button class="btn" data-action="edit-contact" data-id="${selectedPerson.id}">编辑</button>` : ""}</div><div class="detail-grid"><div class="detail-item"><label>客户公司</label><div>${selectedPerson.company}</div></div><div class="detail-item"><label>客户部门</label><div>${selectedPerson.department}</div></div><div class="detail-item"><label>关键人岗位</label><div>${selectedPerson.positionName}</div></div><div class="detail-item"><label>关键决策人</label><div>${selectedPerson.decision ? "是" : "否"}</div></div><div class="detail-item"><label>手机号</label><div>${selectedPerson.phone}</div></div><div class="detail-item"><label>生日</label><div>${selectedPerson.birthday ? selectedPerson.birthday.replace("-", "月") + "日" : "待完善"}</div></div><div class="detail-item"><label>最近维系</label><div>${selectedPerson.last}</div></div><div class="detail-item"><label>未结束任务</label><div>${activeTasks.length} 条${activeTasks.filter((task) => task.status === "overdue").length ? `，当前逾期 ${activeTasks.filter((task) => task.status === "overdue").length} 条` : ""}</div></div><div class="detail-item"><label>创建时间</label><div>${selectedPerson.createdAt || "待补录"}</div></div></div><div class="operations-next"><h4>${nextTask ? `${taskDisplayType(nextTask)} · ${nextTask.title}` : "当前没有待办任务"}</h4><p>${nextTask ? `截止 ${nextTask.due}，这里展示最高优先级任务；全部 ${activeTasks.length} 条任务可在完整详情逐条查看。` : "可以主动新增维系记录，系统将同步更新最近维系时间。"}</p><div class="operations-quick-actions">${canCreateMaintenanceForPerson(selectedPerson) ? `<button class="btn btn-primary" data-operation-maintain="${selectedPerson.id}" ${nextTask ? `data-task-id="${nextTask.id}"` : ""}>去维系</button>` : ""}${nextTask ? `<button class="btn" data-action="task-detail" data-id="${nextTask.id}">任务详情</button>` : ""}<button class="btn" data-person="${selectedPerson.id}">完整详情 / 全部任务</button></div></div><div class="recent-records-head"><div class="section-title">最近客户动态</div><span class="panel-sub">最近 ${Math.min(3, allPersonRecords.length)} 条</span>${allPersonRecords.length > 3 ? `<button class="link" type="button" data-action="all-person-records" data-id="${selectedPerson.id}">查看全部 ${allPersonRecords.length} 条</button>` : ""}</div><div class="recent-records">${records.map((record) => `<button class="recent-record-item" type="button" data-action="record-detail" data-id="${record.id}" title="查看维系记录详情"><span class="recent-record-date">${record.date}</span><span class="recent-record-summary">${record.summary}</span><span class="tag blue">${record.method}</span></button>`).join("") || '<div class="role-note">暂无维系记录</div>'}</div>`
          : companyDetail;
        const personDetailHost = document.createElement("div");
        personDetailHost.innerHTML = personDetail;
        if (selectedPerson) {
          const hero = personDetailHost.querySelector(".detail-hero");
          const editButton = hero?.querySelector(
            '[data-action="edit-contact"]',
          );
          if (hero && editButton)
            editButton.insertAdjacentHTML(
              "beforebegin",
              completenessHtml(selectedPerson),
            );
          const subtitle = hero?.querySelector(".detail-sub");
          if (subtitle) subtitle.remove();
          personDetailHost
            .querySelectorAll(".recent-record-date")
            .forEach((item, index) => {
              item.textContent =
                records[index]?.maintenanceAt || records[index]?.date || "—";
            });
          const detailGrid = personDetailHost.querySelector(".detail-grid");
          if (detailGrid) {
            const codeItem = document.createElement("div");
            codeItem.className = "detail-item";
            codeItem.innerHTML = `<label>关键人编号</label><div>${selectedPerson.code}</div>`;
            detailGrid.prepend(codeItem);
          }
          [...personDetailHost.querySelectorAll(".detail-item")].forEach(
            (item) => {
              const label = item.querySelector("label")?.textContent;
              const value = item.querySelector("div");
              if (label === "关键决策人" && value)
                value.textContent =
                  selectedPerson.decisionConfirmed === false
                    ? "待完善"
                    : selectedPerson.decision
                      ? "是"
                      : "否";
              if (label === "手机号" && value && !selectedPerson.phone)
                value.textContent = "待完善";
            },
          );
          if (nextTask?.status === "overdue")
            personDetailHost
              .querySelector(".operations-next")
              ?.classList.add("overdue");
        }
        const operationDetailHtml = personDetailHost.innerHTML;
        const filterOptions = customerFilterOptions();
        const pmOptions = [
          ...new Set(
            customersInScope.map(customerOwnerName).filter(Boolean),
          ),
        ];
        const pageActions = `${hasOperationPermission("customers.create_contact") ? '<button class="btn" data-operation-add-contact-global>＋ 新增关键人</button>' : ""}${canCreateMaintenanceRecord() ? '<button class="btn" data-action="new-record">＋ 新增维系</button>' : ""}`;
        const operationPageHead = pageHead(
          "客户经营",
          "按客户层级浏览档案，选择关键人后直接完成日常维系。",
          pageActions,
        );
        const contactScopeLabel = selectedCustomer
          ? selectedCustomer.name
          : customerTreeDimension === "group"
            ? selectedCustomerGroup || "当前筛选范围"
            : selectedOperationRegionGroup ||
              selectedOperationProvince ||
              selectedOperationRegion ||
              "当前筛选范围";
        const filterToolbar = [
          filterField("集团编号", `<input class="input" id="customerTreeGroupNumber" maxlength="100" value="${appliedCustomerFilter.groupNumber || ""}" placeholder="请输入集团编号">`),
          filterField("集团名称", `<input class="input" id="customerTreeGroupName" maxlength="100" value="${appliedCustomerFilter.groupName}" placeholder="请输入集团名称">`),
          filterField("客户公司名称", `<input class="input" id="customerTreeCompanyName" maxlength="100" value="${appliedCustomerFilter.companyName}" placeholder="请输入客户公司名称">`),
          filterField("关键人编号", `<input class="input" id="customerTreePersonCode" maxlength="100" value="${appliedCustomerFilter.personCode}" placeholder="请输入关键人编号">`),
          filterField("关键人名称", `<input class="input" id="customerTreePersonName" maxlength="50" value="${appliedCustomerFilter.personName}" placeholder="请输入关键人名称">`),
          filterField("关键人手机号", `<input class="input" id="customerTreePersonPhone" value="${appliedCustomerFilter.personPhone}" placeholder="请输入完整手机号或后 4 位">`),
          filterField("关键人微信号", `<input class="input" id="customerTreePersonWechat" maxlength="64" value="${appliedCustomerFilter.personWechat}" placeholder="请输入关键人微信号">`),
          filterField("关键人覆盖状态", `<select class="input" id="customerTreeCoverage"><option value="">全部关键人覆盖状态</option><option value="none" ${appliedCustomerFilter.coverage === "none" ? "selected" : ""}>未覆盖（0人）</option><option value="covered" ${appliedCustomerFilter.coverage === "covered" ? "selected" : ""}>已覆盖（≥1人）</option></select>`),
          filterField("业务责任省份", areaMultiSelectHtml("customerAreaProvince", "业务责任省份", filterOptions.provinces, customerAreaFilter.provinces)),
          filterField("业务责任城市", areaMultiSelectHtml("customerAreaCity", "业务责任城市", filterOptions.cities, customerAreaFilter.cities, customerAreaFilter.provinces.size ? "" : "请先选择业务责任省份")),
          filterField("业务责任区县", areaMultiSelectHtml("customerAreaDistrict", "业务责任区县", filterOptions.districts, customerAreaFilter.districts, customerAreaFilter.cities.size ? "" : "请先选择业务责任城市")),
          filterActions('<button class="btn btn-primary" id="applyCustomerFilter" type="button">筛选</button><button class="btn" id="clearAreaFilter" type="button">重置</button>'),
        ].join("");
        return `<div class="operations-shell">${operationPageHead}<section class="panel operation-filter-panel"><div class="operation-filter-head"><span>筛选客户与关键人</span><span class="tag blue">${scopeLabel}</span><button class="icon-btn operation-filter-toggle" id="customerFilterToggle" type="button" title="${customerFilterExpanded ? "收起筛选条件" : "展开筛选条件"}" aria-label="${customerFilterExpanded ? "收起筛选条件" : "展开筛选条件"}" aria-expanded="${customerFilterExpanded}"><span aria-hidden="true">${customerFilterExpanded ? "▾" : "▸"}</span></button></div><div class="toolbar filter-toolbar ${customerFilterExpanded ? "" : "hidden"}" id="customerFilterToolbar">${filterToolbar}</div></section><section class="operations-grid"><div class="operations-pane"><div class="operations-pane-head">客户公司<span class="spacer"></span><div class="customer-dimension-switch" role="group" aria-label="客户公司查看维度"><button class="customer-dimension-option ${customerTreeDimension === "group" ? "active" : ""}" type="button" data-customer-dimension="group" aria-pressed="${customerTreeDimension === "group"}">按集团</button><button class="customer-dimension-option ${customerTreeDimension === "region" ? "active" : ""}" type="button" data-customer-dimension="region" aria-pressed="${customerTreeDimension === "region"}">按业务责任区域</button></div><span class="tag">${customersInScope.length}</span></div><div class="operations-pane-body operations-tree" id="customerTree">${customerItems || '<div class="empty">暂无演示客户</div>'}</div></div><div class="operations-pane"><div class="operations-pane-head">关键人<span class="panel-sub">${contactScopeLabel} · ${people.length} 人</span>${selectedCustomer && canMaintainContactForCompany(selectedCustomer) ? '<button class="btn operations-add-contact" data-operation-add-contact>＋ 新增</button>' : ""}</div><div class="operations-pane-body" id="operationContactList">${personItems || `<div class="empty">${selectedCustomer || selectedCustomerGroup || selectedOperationRegion ? "当前范围暂无关键人" : "请先选择客户公司"}</div>`}</div></div><div class="operations-pane"><div class="operations-pane-head">${selectedPerson ? "关键人详情 / 下一步行动" : selectedCustomerGroup && !selectedCustomer ? "集团公司详情" : "公司详情"}</div><div class="operations-action">${operationDetailHtml}</div></div></section></div>`;
      }
