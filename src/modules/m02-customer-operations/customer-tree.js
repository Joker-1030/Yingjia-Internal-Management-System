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
      function areaMultiSelectHtml(
        id,
        label,
        values,
        selectedSet,
        disabledHint = "",
      ) {
        return `<div class="multi-select" style="width:170px"><button class="multi-select-trigger" id="${id}Trigger" type="button" aria-haspopup="listbox" aria-expanded="false" ${disabledHint ? "disabled" : ""} title="${disabledHint || label}"><span id="${id}Text">${disabledHint || areaSelectionLabel(selectedSet, label)}</span><span aria-hidden="true">⌄</span></button><div class="multi-select-menu hidden" id="${id}Menu"><input class="input" id="${id}Search" placeholder="搜索${label}" style="margin-bottom:var(--space-2)"><div id="${id}Options">${areaOptionList(values, selectedSet)}</div></div></div>`;
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
        const syncTrigger = (id, label, selectedSet, disabledHint = "") => {
          const trigger = $("#" + id + "Trigger");
          const text = $("#" + id + "Text");
          const menu = $("#" + id + "Menu");
          if (!trigger || !text) return;
          trigger.disabled = Boolean(disabledHint);
          trigger.title = disabledHint || label;
          text.textContent = disabledHint || areaSelectionLabel(selectedSet, label);
          if (disabledHint) {
            menu?.classList.add("hidden");
            trigger.setAttribute("aria-expanded", "false");
          }
        };
        syncTrigger("customerAreaProvince", "业务责任省份", customerAreaFilter.provinces);
        syncTrigger(
          "customerAreaCity",
          "业务责任城市",
          customerAreaFilter.cities,
          customerAreaFilter.provinces.size ? "" : "请先选择业务责任省份",
        );
        syncTrigger(
          "customerAreaDistrict",
          "业务责任区县",
          customerAreaFilter.districts,
          customerAreaFilter.cities.size ? "" : "请先选择业务责任城市",
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
        const disabledText = "请先选择集团公司";
        return `<div class="multi-select" style="width:170px"><button class="multi-select-trigger" id="${id}Trigger" type="button" aria-haspopup="listbox" aria-expanded="false" ${disabled ? "disabled" : ""} title="${disabled ? disabledText : label}"><span id="${id}Text">${disabled ? disabledText : summary}</span><span aria-hidden="true">⌄</span></button><div class="multi-select-menu hidden" id="${id}Menu"><input class="input" id="${id}Search" placeholder="搜索${label}" style="margin-bottom:var(--space-2)"><div id="${id}Options">${normalized.map((option) => `<label class="multi-select-option" data-option-label="${option.label}"><input type="checkbox" value="${option.value}" ${selectedSet.has(String(option.value)) ? "checked" : ""}><span>${option.label}</span></label>`).join("") || '<div class="list-sub">暂无可选项</div>'}</div></div></div>`;
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
        const controls = `${filterField("集团公司", `<select class="input" id="customerTreeGroup"><option value="">全部集团公司</option>${groups.map((item) => `<option ${item === group ? "selected" : ""}>${item}</option>`).join("")}</select>`)}${filterField("客户部门", customerFilterMultiSelectHtml("customerDepartmentMulti", "客户部门", groupDepartments, appliedCustomerFilter.departments, !group))}${filterField("部门覆盖状态", `<select class="input" id="customerDepartmentCoverage"><option value="">全部部门覆盖状态</option><option value="covered" ${appliedCustomerFilter.departmentCoverage === "covered" ? "selected" : ""}>已覆盖</option><option value="none" ${appliedCustomerFilter.departmentCoverage === "none" ? "selected" : ""}>未覆盖</option></select>`)}${filterField("标准岗位", customerFilterMultiSelectHtml("customerPositionMulti", "标准岗位", groupPositions, appliedCustomerFilter.positions, !group))}${filterField("岗位覆盖状态", `<select class="input" id="customerPositionCoverage"><option value="">全部岗位覆盖状态</option><option value="covered" ${appliedCustomerFilter.positionCoverage === "covered" ? "selected" : ""}>已覆盖</option><option value="none" ${appliedCustomerFilter.positionCoverage === "none" ? "selected" : ""}>未覆盖</option></select>`)}${filterField("行业", customerFilterMultiSelectHtml("customerIndustryMulti", "行业", [...new Set(authorizedCustomers.map((item) => item.industry))].sort(), appliedCustomerFilter.industries))}${filterField("业务责任层级", customerFilterMultiSelectHtml("customerLevelMulti", "业务责任层级", ["省级", "市级", "区县级"], appliedCustomerFilter.levels))}${filterField("客户负责人", customerFilterMultiSelectHtml("customerPmMulti", "客户负责人", [...new Set(authorizedCustomers.map(customerOwnerName).filter(Boolean))].sort(), appliedCustomerFilter.pms))}`;
        toolbar.insertAdjacentHTML("afterbegin", controls);
        [
          ["customerIndustryMulti", "行业"],
          ["customerLevelMulti", "业务责任层级"],
          ["customerPmMulti", "客户负责人"],
          ["customerDepartmentMulti", "客户部门"],
          ["customerPositionMulti", "标准岗位"],
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
            const trigger = $("#" + id + "Trigger");
            $("#" + id + "Text").textContent = selectedGroup
              ? `全部${label}`
              : "请先选择集团公司";
            trigger.disabled = !selectedGroup;
            trigger.title = selectedGroup ? label : "请先选择集团公司";
            if (!selectedGroup) {
              $("#" + id + "Menu")?.classList.add("hidden");
              trigger.setAttribute("aria-expanded", "false");
            }
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
            "客户部门",
          );
          rebuild(
            "customerPositionMulti",
            contactPositionCatalog
              .filter(
                (position) =>
                  position.status === "正常" && position.group === selectedGroup,
              )
              .map((position) => ({ value: position.id, label: `${position.company} · ${position.name}` })),
            "标准岗位",
          );
          $("#customerDepartmentCoverage").value = "";
          $("#customerPositionCoverage").value = "";
          updateDimensionCoverageState();
          toast(
            selectedGroup
              ? "集团公司已切换，请重新选择客户部门或标准岗位"
              : "未选择集团公司，客户部门和标准岗位筛选已清空",
          );
        };
        groupSelect.onchange = rebuildScopedOptions;
        updateDimensionCoverageState();
      }

      function updateDimensionCoverageState() {
        [
          ["customerDepartmentCoverage", "customerDepartmentMulti", "客户部门"],
          ["customerPositionCoverage", "customerPositionMulti", "标准岗位"],
        ].forEach(([controlId, multiId, label]) => {
          const control = $("#" + controlId);
          if (!control) return;
          const hasGroup = Boolean($("#customerTreeGroup")?.value);
          const targetCount = checkedFilterValues(multiId).size;
          control.disabled = targetCount !== 1;
          if (control.disabled) control.value = "";
          const hint = !hasGroup
            ? "请先选择集团公司"
            : targetCount === 1
              ? `按所选${label}判断覆盖`
              : `请只选择一个${label}`;
          control.title = hint;
          if (control.options[0])
            control.options[0].textContent = control.disabled
              ? hint
              : `全部${label}覆盖状态`;
        });
      }

      function customerOrganizationTreeRows(all) {
        const peopleByCompany = new Map(
          all.map((company) => [
            company.id,
            scopedContacts().filter(
              (person) =>
                contactIsActive(person) && person.company === company.name,
            ),
          ]),
        );
        const companyRow = (company, groupCompanies, depth = 1) => {
          const children = groupCompanies
            .filter(
              (candidate) =>
                candidate.organizationParentType === "company" &&
                candidate.organizationParentCompanyId === company.id,
            )
            .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
          const key = `company-org:${company.id}`;
          const expanded = expandedCustomerNodes.has(key);
          const people = peopleByCompany.get(company.id) || [];
          let html = `<div class="customer-tree-row level-company ${selectedCustomerId === company.id ? "active" : ""}" style="padding-left:${10 + depth * 18}px" data-search="${company.name}${adminArea(company)}${company.industry}" data-area="${adminArea(company)}" data-group="${company.group}" data-company-name="${company.name}" data-pm="${customerOwnerName(company)}" data-people="${people.map((person) => person.name).join(" ")}" data-people-phone="${people.map((person) => person.phone).join(" ")}" data-people-count="${people.length}" data-overdue="${customerHasOverdue(company)}"><button class="tree-toggle" data-customer-toggle="${key}" ${children.length ? "" : "disabled"}>${children.length ? (expanded ? "▾" : "▸") : "·"}</button><button class="tree-action customer-tree-label" data-customer-select="${company.id}" title="${company.name}">${company.name}</button><span class="customer-contact-count" title="${people.length} 名有效关键人">${people.length}</span><span class="tag blue">${customerBusinessResponsibilityLevel(company)}</span></div>`;
          if (expanded)
            children.forEach((child) => {
              html += companyRow(child, groupCompanies, depth + 1);
            });
          return html;
        };
        const groups = [...new Set(all.map((customer) => customer.group))];
        return groups
          .map((group) => {
            const groupCompanies = all.filter(
              (customer) => customer.group === group,
            );
            const roots = groupCompanies.filter(
              (company) =>
                company.organizationParentType !== "company" ||
                !groupCompanies.some(
                  (candidate) =>
                    candidate.id === company.organizationParentCompanyId,
                ),
            );
            const groupKey = `group:${group}`;
            const expanded = expandedCustomerNodes.has(groupKey);
            let html = `<div class="customer-tree-row level-group ${selectedCustomerGroup === group && !selectedCustomerId ? "active" : ""}"><button class="tree-toggle" data-customer-toggle="${groupKey}">${expanded ? "▾" : "▸"}</button><button class="tree-action customer-tree-label" data-operation-group="${group}" title="查看${group}全部关键人">${group}</button><span class="tree-count">${groupCompanies.length}</span></div>`;
            if (expanded)
              roots
                .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
                .forEach((company) => {
                  html += companyRow(company, groupCompanies);
                });
            return html;
          })
          .join("");
      }

      function customerTreeRows(all) {
        return customerOrganizationTreeRows(all);
        /* Historical area-derived renderer retained below only as fixture
           compatibility evidence; the active group view returns above. */
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
        const levelOrder = { 省级: 0, 市级: 1, 区县级: 2 };
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
              ...new Set(regionCustomers.map(customerBusinessProvince)),
            ].filter(Boolean);
            provinces.forEach((province) => {
              const provinceCustomers = regionCustomers.filter(
                (company) => customerBusinessProvince(company) === province,
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
                      (levelOrder[customerBusinessResponsibilityLevel(a)] ?? 9) -
                        (levelOrder[customerBusinessResponsibilityLevel(b)] ?? 9) ||
                      a.name.localeCompare(b.name, "zh-CN"),
                  )
                  .forEach((company) => {
                    html += `<div class="customer-tree-row level-company ${selectedCustomerId === company.id ? "active" : ""}"><span class="tree-toggle">·</span><button class="tree-action customer-tree-label" data-customer-select="${company.id}" title="${company.name}">${company.name}</button><span class="tag ${customerBusinessResponsibilityLevel(company) === "省级" ? "blue" : ""}">${customerBusinessResponsibilityLevel(company)}</span></div>`;
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
        return `<div class="customer-company-head"><div class="customer-company-head-main"><div class="customer-company-name">${customer.name}</div><div class="customer-company-path">${customerOrganizationPath(customer)} · 业务责任 ${customerBusinessResponsibilityLevel(customer)} / ${adminArea(customer)}</div></div>${healthTag(customerHealth(customer))}</div><div class="customer-company-summary"><div class="overview-item"><label>行业</label><div>${customer.industry}</div></div><div class="overview-item"><label>客户负责人</label><div>${customerOwnerName(customer)}</div></div><div class="overview-item"><label>执行安排</label><div>${customerBusinessResponsibilityLevel(customer) === "省级" ? "区域总监直接执行全部任务" : "地市负责人 PM 直接执行"}</div></div></div><div class="panel-head" style="padding:var(--space-3) 0"><div><div class="panel-title">关键人</div><div class="panel-sub">部门与关键人岗位属于当前任职，变更需调岗审批</div></div><div class="spacer"></div>${canMaintainContactForCompany(customer) ? `<button class="btn btn-primary" data-action="add-contact" data-id="${customer.id}">＋ 新增关键人</button>` : ""}</div><div class="table-wrap"><table><thead><tr><th>关键人</th><th>关键人岗位 / 部门</th><th>职级</th><th>采购决策</th><th>联系方式</th><th>状态</th><th>操作</th></tr></thead><tbody>${people.map((person) => `<tr><td><div class="person"><div class="avatar">${person.name[0]}</div><strong>${person.name}</strong></div><div class="list-sub">${person.code}</div></td><td>${person.positionName}<div class="list-sub">${person.department} · ${person.title}</div></td><td><span class="tag blue">${person.level}</span></td><td>${person.decision ? '<span class="tag blue">是</span>' : "否"}</td><td>${person.phone}<div class="list-sub">微信 ${person.wechat || "未填写"}</div></td><td>${healthTag(contactHasOverdue(person) ? "逾期" : "健康")}</td><td><span class="link" data-person="${person.id}">查看</span>${canMaintainContact(person) ? ` · <span class="link" data-action="edit-contact" data-id="${person.id}">编辑</span>` : ""}${canTransferContact(person) ? ` · <span class="link" data-action="transfer" data-id="${person.id}">调岗</span>` : ""}</td></tr>`).join("") || '<tr><td colspan="7"><div class="empty">该公司尚未维护关键人</div></td></tr>'}</tbody></table></div>`;
      }

      function openCustomer(id, options = {}) {
        const customer = customers.find((item) => item.id === id);
        if (!customer || !companyIsVisible(customer))
          return toast("无权查看该客户单位");
        const people = scopedContacts().filter(
          (person) => person.company === customer.name,
        );
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">客户单位详情</div><button class="icon-btn close" data-close title="关闭详情链">×</button></div><div class="drawer-body"><div class="detail-hero customer-drawer-hero"><div class="avatar">企</div><div><div class="detail-name">${customer.name}</div><div class="detail-sub">${customer.group} · ${customer.level} · ${adminArea(customer)}</div></div><div class="spacer"></div>${healthTag(customerHealth(customer))}${customer.responsibilityAnomaly ? '<span class="tag red">责任配置异常</span>' : ""}</div><div class="company-overview customer-drawer-overview"><div class="overview-item"><label>集团公司</label><div>${customer.group}</div></div><div class="overview-item"><label>行业</label><div>${customer.industry}</div></div><div class="overview-item"><label>公司层级</label><div>${customer.level}</div></div><div class="overview-item"><label>完整行政区划</label><div>${adminArea(customer)}</div></div><div class="overview-item"><label>区域中心</label><div>${customerRegionLabel(customer)}</div></div><div class="overview-item"><label>客户负责人</label><div>${customerOwnerName(customer)}</div></div><div class="overview-item"><label>有效关键人</label><div>${people.length} 人</div></div><div class="overview-item"><label>写入来源 / 创建时间</label><div>${customer.source === "import" ? "批量导入" : "手工录入"} · ${customer.createdAt || "2026-01-01 09:00"}</div></div></div>${customer.responsibilityAnomaly ? `<div class="role-note danger-note">${customer.responsibilityAnomalyReason || "当前负责人无法按区域或地市责任解析，系统已停止生成无执行人的新任务。"}</div>` : ""}<div class="customer-drawer-section-head"><div class="section-title">关键人</div><span class="tag blue">${people.length} 人</span></div><div class="customer-drawer-contacts">${people.map((person) => `<div class="customer-drawer-contact"><div class="avatar">${person.name[0]}</div><div class="list-main"><div class="list-title">${person.name} · ${person.title}${person.decision ? ' <span class="tag blue">关键决策人</span>' : ""}${contactHasOverdue(person) ? ' <span class="tag red">当前逾期</span>' : ""}</div><div class="list-sub">${person.department} · ${person.positionName} · ${person.level}</div></div>${options.limitContacts ? '<span class="list-sub">下钻止于客户单位详情，查看关键人请返回客户经营</span>' : `<button class="link" data-person="${person.id}">查看详情</button>`}</div>`).join("") || '<div class="role-note">暂无关键人。</div>'}</div></div><div class="drawer-foot">${stopObjectActionHtml("customer", customer.id)}${canMaintainContactForCompany(customer) && !pendingStopApproval("customer", customer.id) ? `<button class="btn btn-primary" data-action="add-contact" data-id="${customer.id}">新增关键人</button>` : ""}</div>`,
        );
        const drawer = $("#drawer");
        const subtitle = drawer?.querySelector(".customer-drawer-hero .detail-sub");
        if (subtitle)
          subtitle.textContent = `${customerOrganizationPath(customer)} · 业务责任 ${customerBusinessResponsibilityLevel(customer)} / ${adminArea(customer)}`;
        const overview = drawer?.querySelector(".customer-drawer-overview");
        const fields = [...(overview?.querySelectorAll(".overview-item") || [])];
        const levelField = fields.find(
          (field) => field.querySelector("label")?.textContent === "公司层级",
        );
        if (levelField) {
          levelField.querySelector("label").textContent = "组织上级";
          levelField.querySelector("div").textContent =
            customerOrganizationParent(customer)?.name || customer.group;
        }
        const areaField = fields.find(
          (field) => field.querySelector("label")?.textContent === "完整行政区划",
        );
        if (areaField) {
          areaField.querySelector("label").textContent = "业务责任省/市/区县";
          areaField.insertAdjacentHTML(
            "beforebegin",
            `<div class="overview-item"><label>业务责任层级</label><div>${customerBusinessResponsibilityLevel(customer)}</div></div>`,
          );
        }
      }
