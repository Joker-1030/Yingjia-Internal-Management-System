      function customerFilterOptions() {
        const provinces =
          currentUser.role === "pm"
            ? [
                ...new Set(
                  cityOwners
                    .filter((x) => x.pm === currentUser.name)
                    .map((x) => x.province),
                ),
              ]
            : currentUser.role === "director"
              ? regionProvinceList(regionForName(currentUser.region))
              : Object.keys(administrativeDivisions);
        const cityPool =
          currentUser.role === "pm"
            ? assignedCitiesForCurrentUser()
            : [
                ...new Set(
                  provinces.flatMap((p) =>
                    Object.keys(administrativeDivisions[p] || {}),
                  ),
                ),
              ];
        const activeProvinces = customerAreaFilter.provinces.size
          ? [...customerAreaFilter.provinces]
          : provinces;
        const cities = [
          ...new Set(
            cityPool.filter((city) =>
              activeProvinces.some(
                (p) => (administrativeDivisions[p] || {})[city],
              ),
            ),
          ),
        ];
        const activeCities = customerAreaFilter.cities.size
          ? [...customerAreaFilter.cities].filter((city) =>
              cities.includes(city),
            )
          : cities;
        const districts = [
          ...new Set(
            activeCities.flatMap((city) => cityDistrictMap()[city] || []),
          ),
        ];
        return { provinces, cities, districts };
      }
      function areaSelectionLabel(selectedSet, label) {
        const selected = [...selectedSet];
        if (!selected.length) return `全部${label}`;
        return selected.length <= 2
          ? selected.join("、")
          : `${selected.slice(0, 2).join("、")}等${selected.length}项`;
      }
      function areaOptionList(values, selectedSet) {
        return values
          .map(
            (value) =>
              `<label class="multi-select-option" data-option-label="${value}"><input type="checkbox" value="${value}" ${selectedSet.has(value) ? "checked" : ""}><span>${value}</span></label>`,
          )
          .join("");
      }
      function areaMultiSelectHtml(id, label, values, selectedSet) {
        return `<div class="multi-select" style="width:170px"><button class="multi-select-trigger" id="${id}Trigger" type="button" aria-haspopup="listbox" aria-expanded="false"><span id="${id}Text">${areaSelectionLabel(selectedSet, label)}</span><span aria-hidden="true">⌄</span></button><div class="multi-select-menu hidden" id="${id}Menu"><input class="input" id="${id}Search" placeholder="搜索${label}" style="margin-bottom:6px"><div id="${id}Options">${areaOptionList(values, selectedSet)}</div></div></div>`;
      }
      function refreshAreaFilterUI() {
        const opts = customerFilterOptions();
        const provinceOptions = $("#customerAreaProvinceOptions");
        if (!provinceOptions) return;
        provinceOptions.innerHTML = areaOptionList(
          opts.provinces,
          customerAreaFilter.provinces,
        );
        $("#customerAreaCityOptions").innerHTML = areaOptionList(
          opts.cities,
          customerAreaFilter.cities,
        );
        $("#customerAreaDistrictOptions").innerHTML = areaOptionList(
          opts.districts,
          customerAreaFilter.districts,
        );
        $("#customerAreaProvinceText").textContent = areaSelectionLabel(
          customerAreaFilter.provinces,
          "省份",
        );
        $("#customerAreaCityText").textContent = areaSelectionLabel(
          customerAreaFilter.cities,
          "城市",
        );
        $("#customerAreaDistrictText").textContent = areaSelectionLabel(
          customerAreaFilter.districts,
          "区县",
        );
      }

      function customerFilterMultiSelectHtml(
        id,
        label,
        options,
        selectedSet = new Set(),
        disabled = false,
      ) {
        const normalized = options.map((option) =>
          typeof option === "string"
            ? { value: option, label: option }
            : option,
        );
        const selectedLabels = normalized
          .filter((option) => selectedSet.has(String(option.value)))
          .map((option) => option.label);
        const summary = !selectedLabels.length
          ? `全部${label}`
          : selectedLabels.length <= 2
            ? selectedLabels.join("、")
            : `${selectedLabels.slice(0, 2).join("、")}等${selectedLabels.length}项`;
        return `<div class="multi-select" style="width:170px"><button class="multi-select-trigger" id="${id}Trigger" type="button" aria-haspopup="listbox" aria-expanded="false" ${disabled ? "disabled" : ""} title="${disabled ? "请先选择集团公司" : label}"><span id="${id}Text">${disabled ? `请先选择${label === "关键人部门" || label === "关键人岗位" ? "集团公司" : label}` : summary}</span><span aria-hidden="true">⌄</span></button><div class="multi-select-menu hidden" id="${id}Menu"><input class="input" id="${id}Search" placeholder="搜索${label}" style="margin-bottom:6px"><div id="${id}Options">${normalized.map((option) => `<label class="multi-select-option" data-option-label="${option.label}"><input type="checkbox" value="${option.value}" ${selectedSet.has(String(option.value)) ? "checked" : ""}><span>${option.label}</span></label>`).join("") || '<div class="list-sub">暂无可选项</div>'}</div></div></div>`;
      }

      function checkedFilterValues(id) {
        return new Set(
          [...document.querySelectorAll(`#${id}Options input:checked`)].map(
            (input) => String(input.value),
          ),
        );
      }

      function bindCustomerFilterMultiSelect(id, label, onChange) {
        const trigger = $("#" + id + "Trigger");
        const menu = $("#" + id + "Menu");
        const options = $("#" + id + "Options");
        const search = $("#" + id + "Search");
        if (!trigger || !menu) return;
        trigger.onclick = (event) => {
          event.stopPropagation();
          document
            .querySelectorAll("#customerFilterToolbar .multi-select-menu")
            .forEach((other) => {
              if (other !== menu) other.classList.add("hidden");
            });
          const opening = menu.classList.contains("hidden");
          menu.classList.toggle("hidden");
          trigger.setAttribute("aria-expanded", String(opening));
        };
        if (search)
          search.oninput = () =>
            options
              .querySelectorAll("[data-option-label]")
              .forEach((option) =>
                option.classList.toggle(
                  "hidden",
                  !option.dataset.optionLabel.includes(search.value.trim()),
                ),
              );
        options.onchange = () => {
          const checked = [
            ...options.querySelectorAll('input[type="checkbox"]:checked'),
          ];
          const labels = checked.map(
            (input) => input.closest("label")?.dataset.optionLabel || input.value,
          );
          $("#" + id + "Text").textContent = !labels.length
            ? `全部${label}`
            : labels.length <= 2
              ? labels.join("、")
              : `${labels.slice(0, 2).join("、")}等${labels.length}项`;
          onChange?.();
        };
      }

      function enhanceCustomerFilterToolbar() {
        const toolbar = $("#customerFilterToolbar");
        const applyButton = $("#applyCustomerFilter");
        if (!toolbar || !applyButton || currentPage !== "operations") return;
        ["#customerTreeIndustry", "#customerTreeLevel", "#customerTreePm"].forEach(
          (selector) => $(selector)?.remove(),
        );
        const authorizedCustomers = scopedCustomers();
        const groups = [...new Set(authorizedCustomers.map((item) => item.group))].sort(
          (left, right) => left.localeCompare(right, "zh-CN"),
        );
        const group = appliedCustomerFilter.group || "";
        const groupDepartments = customerDepartments
          .filter(
            (department) =>
              !department.archived && (!group || department.group === group),
          )
          .map((department) => ({
            value: String(department.id),
            label: `${department.company} · ${customerDepartmentPath(department)}`,
          }));
        const groupPositions = contactPositionCatalog
          .filter(
            (position) =>
              position.status === "正常" && (!group || position.group === group),
          )
          .map((position) => ({
            value: position.id,
            label: `${position.company} · ${customerDepartments.find((item) => item.id === position.departmentId)?.name || "待配置部门"} · ${position.name}`,
          }));
        const controls = `<select class="input" id="customerTreeGroup" title="集团公司"><option value="">全部集团公司</option>${groups.map((item) => `<option ${item === group ? "selected" : ""}>${item}</option>`).join("")}</select>${customerFilterMultiSelectHtml("customerIndustryMulti", "行业", [...new Set(authorizedCustomers.map((item) => item.industry))].sort(), appliedCustomerFilter.industries)}${customerFilterMultiSelectHtml("customerLevelMulti", "公司层级", ["省公司", "市公司", "区县公司"], appliedCustomerFilter.levels)}${customerFilterMultiSelectHtml("customerPmMulti", "客户负责人", [...new Set(authorizedCustomers.map(customerOwnerName).filter(Boolean))].sort(), appliedCustomerFilter.pms)}${customerFilterMultiSelectHtml("customerDepartmentMulti", "关键人部门", groupDepartments, appliedCustomerFilter.departments, !group)}${customerFilterMultiSelectHtml("customerPositionMulti", "关键人岗位", groupPositions, appliedCustomerFilter.positions, !group)}<select class="input" id="customerDimensionCoverage" title="仅选择一个部门或岗位口径时可用"><option value="">部门/岗位覆盖</option><option value="covered" ${appliedCustomerFilter.dimensionCoverage === "covered" ? "selected" : ""}>已覆盖</option><option value="none" ${appliedCustomerFilter.dimensionCoverage === "none" ? "selected" : ""}>未覆盖</option></select>`;
        applyButton.insertAdjacentHTML("beforebegin", controls);
        [
          ["customerIndustryMulti", "行业"],
          ["customerLevelMulti", "公司层级"],
          ["customerPmMulti", "客户负责人"],
          ["customerDepartmentMulti", "关键人部门"],
          ["customerPositionMulti", "关键人岗位"],
        ].forEach(([id, label]) =>
          bindCustomerFilterMultiSelect(id, label, updateDimensionCoverageState),
        );
        const groupSelect = $("#customerTreeGroup");
        const rebuildScopedOptions = () => {
          const selectedGroup = groupSelect.value;
          const rebuild = (id, options, label) => {
            const host = $("#" + id + "Options");
            host.innerHTML =
              options
                .map(
                  (option) =>
                    `<label class="multi-select-option" data-option-label="${option.label}"><input type="checkbox" value="${option.value}"><span>${option.label}</span></label>`,
                )
                .join("") || '<div class="list-sub">暂无可选项</div>';
            $("#" + id + "Text").textContent = `全部${label}`;
            $("#" + id + "Trigger").disabled = !selectedGroup;
            $("#" + id + "Trigger").title = selectedGroup
              ? label
              : "请先选择集团公司";
          };
          rebuild(
            "customerDepartmentMulti",
            customerDepartments
              .filter(
                (department) =>
                  !department.archived && department.group === selectedGroup,
              )
              .map((department) => ({
                value: String(department.id),
                label: `${department.company} · ${customerDepartmentPath(department)}`,
              })),
            "关键人部门",
          );
          rebuild(
            "customerPositionMulti",
            contactPositionCatalog
              .filter(
                (position) =>
                  position.status === "正常" && position.group === selectedGroup,
              )
              .map((position) => ({ value: position.id, label: `${position.company} · ${position.name}` })),
            "关键人岗位",
          );
          $("#customerDimensionCoverage").value = "";
          updateDimensionCoverageState();
          toast(
            selectedGroup
              ? "集团已切换，请重新选择部门或岗位"
              : "未选择集团，关键人部门和岗位筛选已清空",
          );
        };
        groupSelect.onchange = rebuildScopedOptions;
        updateDimensionCoverageState();
      }

      function updateDimensionCoverageState() {
        const control = $("#customerDimensionCoverage");
        if (!control) return;
        const targetCount =
          checkedFilterValues("customerDepartmentMulti").size +
          checkedFilterValues("customerPositionMulti").size;
        control.disabled = targetCount !== 1;
        if (control.disabled) control.value = "";
        control.title =
          targetCount === 1
            ? "按所选唯一部门或岗位判断覆盖"
            : "请只选择一个部门或一个岗位口径";
      }

      function customerTreeRows(all) {
        const hasOverdueTask = (company) => customerHasOverdue(company);
        const groups = [...new Set(all.map((customer) => customer.group))];
        return groups
          .map((group) => {
            const groupCustomers = all.filter(
              (customer) => customer.group === group,
            );
            const groupKey = `group:${group}`;
            const groupExpanded = expandedCustomerNodes.has(groupKey);
            let html = `<div class="customer-tree-row level-group ${selectedCustomerGroup === group && !selectedCustomerId ? "active" : ""}"><button class="tree-toggle" data-customer-toggle="${groupKey}">${groupExpanded ? "▾" : "▸"}</button><button class="tree-action customer-tree-label" data-operation-group="${group}" title="查看${group}全部关键人">${group}</button><span class="tree-count">${groupCustomers.length}</span></div>`;
            if (!groupExpanded) return html;
            const provinceCompanies = groupCustomers.filter(
              (customer) => customer.level === "省公司",
            );
            const cityCompanies = groupCustomers.filter(
              (customer) => customer.level === "市公司",
            );
            const districtCompanies = groupCustomers.filter(
              (customer) => customer.level === "区县公司",
            );
            const provincesWithCompany = new Set(
              provinceCompanies.map((company) => company.province),
            );
            const citiesWithCompany = new Set(
              cityCompanies.map((company) => company.city),
            );
            const peopleByCompany = new Map(
              all.map((customer) => [
                customer.id,
                scopedContacts().filter(
                  (person) =>
                    contactIsActive(person) && person.company === customer.name,
                ),
              ]),
            );
            const peopleAttrs = (company) => {
              const ps = peopleByCompany.get(company.id) || [];
              return `data-people="${ps.map((p) => p.name).join(" ")}" data-people-phone="${ps.map((p) => p.phone).join(" ")}" data-people-count="${ps.length}"`;
            };
            const peopleCount = (company) =>
              `<span class="customer-contact-count" title="${(peopleByCompany.get(company.id) || []).length} 名有效关键人">${(peopleByCompany.get(company.id) || []).length}</span>`;
            provinceCompanies.forEach((company) => {
              const provinceKey = `province:${group}:${company.province}`;
              const provinceExpanded = expandedCustomerNodes.has(provinceKey);
              const childCities = cityCompanies.filter(
                (item) => item.province === company.province,
              );
              const childDistricts = districtCompanies.filter(
                (item) =>
                  item.province === company.province &&
                  !citiesWithCompany.has(item.city),
              );
              const hasChildren = childCities.length || childDistricts.length;
              html += `<div class="customer-tree-row level-province ${selectedCustomerId === company.id ? "active" : ""}" data-search="${company.name}${adminArea(company)}${company.industry}" data-area="${company.province}" data-group="${group}" data-company-name="${company.name}" data-pm="${customerOwnerName(company)}" ${peopleAttrs(company)}><button class="tree-toggle" data-customer-toggle="${provinceKey}" ${hasChildren ? "" : "disabled"}>${hasChildren ? (provinceExpanded ? "▾" : "▸") : "·"}</button><button class="tree-action customer-tree-label" data-customer-select="${company.id}" title="${company.name}">${company.name}</button>${peopleCount(company)}<span class="tag blue">${company.province}</span></div>`;
              if (!provinceExpanded) return;
              childCities.forEach((cityCompany) => {
                const cityKey = `city:${group}:${cityCompany.city}`;
                const cityExpanded = expandedCustomerNodes.has(cityKey);
                const childDistrictsOfCity = districtCompanies.filter(
                  (item) => item.city === cityCompany.city,
                );
                html += `<div class="customer-tree-row level-city ${selectedCustomerId === cityCompany.id ? "active" : ""}" data-search="${cityCompany.name}${adminArea(cityCompany)}${cityCompany.industry}" data-area="${cityCompany.province} ${cityCompany.city}" data-group="${group}" data-company-name="${cityCompany.name}" data-pm="${customerOwnerName(cityCompany)}" ${peopleAttrs(cityCompany)}><button class="tree-toggle" data-customer-toggle="${cityKey}" ${childDistrictsOfCity.length ? "" : "disabled"}>${childDistrictsOfCity.length ? (cityExpanded ? "▾" : "▸") : "·"}</button><button class="tree-action customer-tree-label" data-customer-select="${cityCompany.id}" title="${cityCompany.name}">${cityCompany.name}</button>${peopleCount(cityCompany)}<span class="tag blue">${cityCompany.city}</span></div>`;
                if (cityExpanded)
                  childDistrictsOfCity.forEach((item) => {
                    html += `<div class="customer-tree-row level-district ${selectedCustomerId === item.id ? "active" : ""}" data-search="${item.name}${adminArea(item)}${item.industry}" data-area="${item.province} ${item.city} ${item.district}" data-group="${group}" data-company-name="${item.name}" data-pm="${customerOwnerName(item)}" ${peopleAttrs(item)}><span class="tree-toggle">·</span><button class="tree-action customer-tree-label" data-customer-select="${item.id}" title="${item.name}">${item.name}</button>${peopleCount(item)}<span class="tag">${item.district}</span></div>`;
                  });
              });
              childDistricts.forEach((item) => {
                html += `<div class="customer-tree-row level-district ${selectedCustomerId === item.id ? "active" : ""}" data-search="${item.name}${adminArea(item)}${item.industry}" data-area="${item.province} ${item.city} ${item.district}" data-group="${group}" data-company-name="${item.name}" data-pm="${customerOwnerName(item)}" ${peopleAttrs(item)}><span class="tree-toggle">·</span><button class="tree-action customer-tree-label" data-customer-select="${item.id}" title="${item.name}">${item.name}</button>${peopleCount(item)}<span class="tag">${item.district}</span></div>`;
              });
            });
            cityCompanies
              .filter((item) => !provincesWithCompany.has(item.province))
              .forEach((cityCompany) => {
                const cityKey = `city:${group}:${cityCompany.city}`;
                const cityExpanded = expandedCustomerNodes.has(cityKey);
                const childDistricts = districtCompanies.filter(
                  (item) => item.city === cityCompany.city,
                );
                html += `<div class="customer-tree-row level-city ${selectedCustomerId === cityCompany.id ? "active" : ""}" data-search="${cityCompany.name}${adminArea(cityCompany)}${cityCompany.industry}" data-area="${cityCompany.province} ${cityCompany.city}" data-group="${group}" data-company-name="${cityCompany.name}" data-pm="${customerOwnerName(cityCompany)}" ${peopleAttrs(cityCompany)}><button class="tree-toggle" data-customer-toggle="${cityKey}" ${childDistricts.length ? "" : "disabled"}>${childDistricts.length ? (cityExpanded ? "▾" : "▸") : "·"}</button><button class="tree-action customer-tree-label" data-customer-select="${cityCompany.id}" title="${cityCompany.name}">${cityCompany.name}</button>${peopleCount(cityCompany)}<span class="tag blue">${cityCompany.city}</span></div>`;
                if (cityExpanded)
                  childDistricts.forEach((item) => {
                    html += `<div class="customer-tree-row level-district ${selectedCustomerId === item.id ? "active" : ""}" data-search="${item.name}${adminArea(item)}${item.industry}" data-area="${item.province} ${item.city} ${item.district}" data-group="${group}" data-company-name="${item.name}" data-pm="${customerOwnerName(item)}" ${peopleAttrs(item)}><span class="tree-toggle">·</span><button class="tree-action customer-tree-label" data-customer-select="${item.id}" title="${item.name}">${item.name}</button>${peopleCount(item)}<span class="tag">${item.district}</span></div>`;
                  });
              });
            districtCompanies
              .filter(
                (item) =>
                  !provincesWithCompany.has(item.province) &&
                  !citiesWithCompany.has(item.city),
              )
              .forEach((item) => {
                html += `<div class="customer-tree-row level-district ${selectedCustomerId === item.id ? "active" : ""}" data-search="${item.name}${adminArea(item)}${item.industry}" data-area="${item.province} ${item.city} ${item.district}" data-group="${group}" data-company-name="${item.name}" data-pm="${customerOwnerName(item)}" ${peopleAttrs(item)}><span class="tree-toggle">·</span><button class="tree-action customer-tree-label" data-customer-select="${item.id}" title="${item.name}">${item.name}</button>${peopleCount(item)}<span class="tag">${item.district}</span></div>`;
              });
            const host = document.createElement("div");
            host.innerHTML = html;
            host
              .querySelectorAll(".customer-tree-row[data-company-name]")
              .forEach((row) => {
                const company = customers.find(
                  (item) => item.name === row.dataset.companyName,
                );
                row.dataset.overdue = String(
                  Boolean(company && hasOverdueTask(company)),
                );
              });
            return host.innerHTML;
          })
          .join("");
      }

      function customerRegionTreeRows(all) {
        const levelOrder = { 省公司: 0, 市公司: 1, 区县公司: 2 };
        const regions = [...new Set(all.map(customerRegionLabel))];
        return regions
          .map((regionName) => {
            const regionCustomers = all.filter(
              (company) => customerRegionLabel(company) === regionName,
            );
            const regionKey = `operation-region:${regionName}`;
            const regionExpanded = expandedCustomerNodes.has(regionKey);
            const regionActive =
              selectedOperationRegion === regionName &&
              !selectedOperationProvince;
            let html = `<div class="customer-tree-row level-group ${regionActive ? "active" : ""}"><button class="tree-toggle" data-customer-toggle="${regionKey}">${regionExpanded ? "▾" : "▸"}</button><button class="tree-action customer-tree-label" data-operation-region="${regionName}" title="查看${regionName}全部关键人">${regionName}</button><span class="tree-count">${regionCustomers.length}</span></div>`;
            if (!regionExpanded) return html;
            const provinces = [
              ...new Set(regionCustomers.map((company) => company.province)),
            ].filter(Boolean);
            provinces.forEach((province) => {
              const provinceCustomers = regionCustomers.filter(
                (company) => company.province === province,
              );
              const provinceKey = `operation-province:${regionName}:${province}`;
              const provinceExpanded = expandedCustomerNodes.has(provinceKey);
              const groups = [
                ...new Set(provinceCustomers.map((company) => company.group)),
              ].sort((a, b) => a.localeCompare(b, "zh-CN"));
              const provinceActive =
                selectedOperationRegion === regionName &&
                selectedOperationProvince === province &&
                !selectedOperationRegionGroup;
              html += `<div class="customer-tree-row level-province ${provinceActive ? "active" : ""}"><button class="tree-toggle" data-customer-toggle="${provinceKey}" ${groups.length ? "" : "disabled"}>${groups.length ? (provinceExpanded ? "▾" : "▸") : "·"}</button><button class="tree-action customer-tree-label" data-operation-province="${province}" data-operation-region="${regionName}" title="查看${province}省全部关键人">${province}省</button><span class="tree-count">${provinceCustomers.length}</span></div>`;
              if (!provinceExpanded) return;
              groups.forEach((group) => {
                const groupCustomers = provinceCustomers.filter(
                  (company) => company.group === group,
                );
                const groupKey = `operation-region-group:${regionName}:${province}:${group}`;
                const groupExpanded = expandedCustomerNodes.has(groupKey);
                const groupActive =
                  selectedOperationRegion === regionName &&
                  selectedOperationProvince === province &&
                  selectedOperationRegionGroup === group;
                html += `<div class="customer-tree-row level-region-group ${groupActive ? "active" : ""}"><button class="tree-toggle" data-customer-toggle="${groupKey}">${groupExpanded ? "▾" : "▸"}</button><button class="tree-action customer-tree-label" data-operation-region-group="${group}" data-operation-province="${province}" data-operation-region="${regionName}" title="查看${province}省${group}全部关键人">${group}</button><span class="tree-count">${groupCustomers.length}</span></div>`;
                if (!groupExpanded) return;
                groupCustomers
                  .slice()
                  .sort(
                    (a, b) =>
                      (levelOrder[a.level] ?? 9) -
                        (levelOrder[b.level] ?? 9) ||
                      a.name.localeCompare(b.name, "zh-CN"),
                  )
                  .forEach((company) => {
                    html += `<div class="customer-tree-row level-company ${selectedCustomerId === company.id ? "active" : ""}"><span class="tree-toggle">·</span><button class="tree-action customer-tree-label" data-customer-select="${company.id}" title="${company.name}">${company.name}</button><span class="tag ${company.level === "省公司" ? "blue" : ""}">${company.level}</span></div>`;
                  });
              });
            });
            return html;
          })
          .join("");
      }

      function customerMasterDetail(customer) {
        if (!customer)
          return `<div class="empty"><div><div class="empty-icon">□</div>请选择左侧客户公司</div></div>`;
        const people = scopedContacts().filter(
          (person) => person.company === customer.name,
        );
        return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${customer.name}</div><div class="customer-company-path">${customer.group} · ${customer.level} · ${adminArea(customer)}</div></div>${healthTag(customerHealth(customer))}</div><div class="customer-company-summary"><div class="overview-item"><label>行业</label><div>${customer.industry}</div></div><div class="overview-item"><label>客户负责人</label><div>${customerOwnerName(customer)}</div></div><div class="overview-item"><label>执行安排</label><div>${customer.level === "省公司" ? "区域总监直接执行全部任务" : "地市负责人 PM 直接执行"}</div></div></div><div class="panel-head" style="padding:10px 0"><div><div class="panel-title">关键人</div><div class="panel-sub">部门与关键人岗位属于当前任职，变更需调岗审批</div></div><div class="spacer"></div>${canMaintainContactForCompany(customer) ? `<button class="btn btn-primary" data-action="add-contact" data-id="${customer.id}">＋ 新增关键人</button>` : ""}</div><div class="table-wrap"><table><thead><tr><th>关键人</th><th>关键人岗位 / 部门</th><th>职级</th><th>采购决策</th><th>联系方式</th><th>状态</th><th>操作</th></tr></thead><tbody>${people.map((person) => `<tr><td><div class="person"><div class="avatar">${person.name[0]}</div><strong>${person.name}</strong></div><div class="list-sub">${person.code}</div></td><td>${person.positionName}<div class="list-sub">${person.department} · ${person.title}</div></td><td><span class="tag blue">${person.level}</span></td><td>${person.decision ? '<span class="tag orange">是</span>' : "否"}</td><td>${person.phone}<div class="list-sub">微信 ${person.wechat || "未填写"}</div></td><td>${healthTag(contactHasOverdue(person) ? "逾期" : "健康")}</td><td><span class="link" data-person="${person.id}">查看</span>${canMaintainContact(person) ? ` · <span class="link" data-action="edit-contact" data-id="${person.id}">编辑</span>` : ""}${canTransferContact(person) ? ` · <span class="link" data-action="transfer" data-id="${person.id}">调岗</span>` : ""}</td></tr>`).join("") || '<tr><td colspan="7"><div class="empty">该公司尚未维护关键人</div></td></tr>'}</tbody></table></div>`;
      }

      function renderCustomers() {
        const all = scopedCustomers();
        if (!all.some((customer) => customer.id === selectedCustomerId))
          selectedCustomerId = all[0]?.id || null;
        const selected = all.find(
          (customer) => customer.id === selectedCustomerId,
        );
        const scopeLabel =
          currentUser.role === "pm"
            ? `数据范围：负责地市 ${assignedCitiesForCurrentUser().join("、") || "未配置"}`
            : currentUser.role === "president" || currentUser.fullAccess
              ? "数据范围：公司全局"
              : currentUser.role === "vp"
                ? "数据范围：全国市场"
              : currentUser.role === "director"
                  ? `数据范围：${currentUser.region}`
                  : "数据范围：公司全局";
        const filterOptions = customerFilterOptions();
        const pmOptions = [
          ...new Set(all.map(customerOwnerName).filter(Boolean)),
        ];
        return (
          pageHead(
            "客户档案",
            "按集团、省公司、市公司和区县公司折叠浏览，选中公司后直接查看档案与关键人。",
            `<button class="btn" data-action="add-contact">＋ 新增关键人</button>`,
          ) +
          `<section class="panel customer-workspace"><div class="toolbar" id="customerFilterToolbar" style="flex-wrap:wrap"><input class="input" id="customerTreeName" placeholder="客户名称" style="width:150px"><input class="input" id="customerTreePersonName" placeholder="关键人名称" style="width:150px"><select class="input" id="customerTreeIndustry"><option value="">全部行业</option>${industries
            .filter((x) => x.enabled)
            .map((x) => `<option>${x.name}</option>`)
            .join(
              "",
            )}</select><input class="input" id="customerTreePersonPhone" placeholder="关键人手机号" style="width:170px"><select class="input" id="customerTreePm"><option value="">全部客户负责人</option>${pmOptions.map((pm) => `<option>${pm}</option>`).join("")}</select>${areaMultiSelectHtml("customerAreaProvince", "省份", filterOptions.provinces, customerAreaFilter.provinces)}${areaMultiSelectHtml("customerAreaCity", "城市", filterOptions.cities, customerAreaFilter.cities)}${areaMultiSelectHtml("customerAreaDistrict", "区县", filterOptions.districts, customerAreaFilter.districts)}<button class="btn btn-primary" id="applyCustomerFilter" type="button">筛选</button><button class="btn" id="clearAreaFilter" type="button">重置</button><span class="spacer"></span><span class="tag blue">${scopeLabel}</span></div><div class="master-detail"><aside class="master-pane"><div class="master-pane-head"><div class="panel-title">客户公司层级</div></div><div class="master-list" id="customerTree">${customerTreeRows(all) || '<div class="empty">当前范围暂无演示客户</div>'}</div></aside><div class="detail-pane customer-detail-pane">${selected ? `<div class="customer-detail-body">${customerMasterDetail(selected)}</div><div class="customer-detail-foot">${stopObjectActionHtml("customer", selected.id)}</div>` : `<div class="customer-detail-body">${customerMasterDetail(selected)}</div>`}</div></div></section>`
        );
      }

      function openCustomer(id, options = {}) {
        const customer = customers.find((item) => item.id === id);
        if (!customer || !companyIsVisible(customer))
          return toast("无权查看该客户单位");
        const people = scopedContacts().filter(
          (person) => person.company === customer.name,
        );
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">客户单位详情</div><button class="icon-btn close" data-close title="关闭详情链">×</button></div><div class="drawer-body"><div class="detail-hero customer-drawer-hero"><div class="avatar">企</div><div><div class="detail-name">${customer.name}</div><div class="detail-sub">${customer.group} · ${customer.level} · ${adminArea(customer)}</div></div><div class="spacer"></div>${pendingStopApproval("customer", customer.id) ? '<span class="tag yellow">停用审批中</span>' : healthTag(customerHealth(customer))}${customer.responsibilityAnomaly ? '<span class="tag red">责任配置异常</span>' : ""}</div><div class="company-overview customer-drawer-overview"><div class="overview-item"><label>集团公司</label><div>${customer.group}</div></div><div class="overview-item"><label>行业</label><div>${customer.industry}</div></div><div class="overview-item"><label>公司层级</label><div>${customer.level}</div></div><div class="overview-item"><label>完整行政区划</label><div>${adminArea(customer)}</div></div><div class="overview-item"><label>区域中心</label><div>${customerRegionLabel(customer)}</div></div><div class="overview-item"><label>客户负责人</label><div>${customerOwnerName(customer)}</div></div><div class="overview-item"><label>有效关键人</label><div>${people.length} 人</div></div><div class="overview-item"><label>写入来源 / 创建时间</label><div>${customer.source === "import" ? "批量导入" : "手工录入"} · ${customer.createdAt || "2026-01-01 09:00"}</div></div></div>${customer.responsibilityAnomaly ? `<div class="role-note danger-note">${customer.responsibilityAnomalyReason || "当前负责人无法按区域或地市责任解析，系统已停止生成无执行人的新任务。"}</div>` : ""}<div class="customer-drawer-section-head"><div class="section-title">关键人</div><span class="tag blue">${people.length} 人</span></div><div class="customer-drawer-contacts">${people.map((person) => `<div class="customer-drawer-contact"><div class="avatar">${person.name[0]}</div><div class="list-main"><div class="list-title">${person.name} · ${person.title}${person.decision ? ' <span class="tag orange">关键决策人</span>' : ""}${contactHasOverdue(person) ? ' <span class="tag red">当前逾期</span>' : ""}</div><div class="list-sub">${person.department} · ${person.positionName} · ${person.level}</div></div>${options.limitContacts ? '<span class="list-sub">下钻止于客户单位详情，查看关键人请返回客户经营</span>' : `<button class="link" data-person="${person.id}">查看详情</button>`}</div>`).join("") || '<div class="role-note">暂无关键人。</div>'}</div></div><div class="drawer-foot">${stopObjectActionHtml("customer", customer.id)}${canMaintainContactForCompany(customer) && !pendingStopApproval("customer", customer.id) ? `<button class="btn btn-primary" data-action="add-contact" data-id="${customer.id}">新增关键人</button>` : ""}</div>`,
        );
      }

