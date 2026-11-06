      let regionWorkspaceTab = "cities";

      function regionProvinceList(region) {
        return String(region?.provinces || "")
          .split(/[、,，]/)
          .map((value) => value.trim())
          .filter(Boolean);
      }

      function organizationRegionForEmployee(employee) {
        let department = departmentForEmployee(employee);
        const visited = new Set();
        while (department && !visited.has(department.id)) {
          visited.add(department.id);
          if (department.type === "region")
            return regionsData.find((region) => region.id === department.regionId);
          department = organizationDepartments.find(
            (item) => item.id === department.parentId,
          );
        }
        return null;
      }

      function organizationRegionsForEmployee(employee) {
        const regionIds = new Set();
        departmentsForEmployee(employee).forEach((startingDepartment) => {
          let department = startingDepartment;
          const visited = new Set();
          while (department && !visited.has(department.id)) {
            visited.add(department.id);
            if (department.type === "region") {
              if (department.status === "启用")
                regionIds.add(department.regionId);
              break;
            }
            department = organizationDepartments.find(
              (item) => item.id === department.parentId,
            );
          }
        });
        return regionsData.filter((region) => regionIds.has(region.id));
      }

      function regionRequiredConfigurationIsValid(region) {
        if (region?.type === "industry") return Boolean(region.industry && region.base);
        const provinces = regionProvinceList(region);
        const validProvinces =
          provinces.length > 0 &&
          provinces.every((province) => administrativeDivisions[province]);
        const validResidence =
          Boolean(region?.base) &&
          Object.values(administrativeDivisions).some((cities) =>
            Object.prototype.hasOwnProperty.call(cities, region.base),
          );
        return validProvinces && validResidence;
      }

      function regionConfigurationStatus(region) {
        if (region?.type === "industry" && !region.enabled) return "待配置";
        if (region?.type !== "industry" && !regionProvinceList(region).length) return "待配置";
        const department = organizationDepartments.find(
          (item) => item.regionId === region?.id && item.status === "启用",
        );
        const validRequiredConfiguration =
          regionRequiredConfigurationIsValid(region);
        if (!region?.configuredAt && !validRequiredConfiguration)
          return "待配置";
        const director = departmentSupervisor(department);
        const hasInvalidOwner = region.type === "industry" ? centerUnassignedCustomers(region).length > 0 : regionCityRows(region).some(
          (city) => city.customers > 0 && city.effective && !regionPmEmployees(region).some((employee) => employee.name === city.pm),
        );
        if (
          !department ||
          !director ||
          !employeeHasRole(director, "区域总监") ||
          !validRequiredConfiguration ||
          hasInvalidOwner
        )
          return "配置异常";
        return "已配置";
      }

      function regionConfigurationAnomaly(region) {
        const department = organizationDepartments.find(
          (item) => item.regionId === region?.id && item.status === "启用",
        );
        const director = departmentSupervisor(department);
        const invalidCities = regionCityRows(region).filter(
          (city) =>
            city.customers > 0 &&
            city.effective &&
            !regionPmEmployees(region).some(
              (employee) => employee.name === city.pm,
            ),
        );
        const reasons = [];
        if (!department || !director) {
          reasons.push("区域中心主管缺失或停用");
        } else if (!employeeHasRole(director, "区域总监")) {
          reasons.push("主管不具备区域总监角色");
        }
        if (region?.configuredAt && !regionRequiredConfigurationIsValid(region)) {
          reasons.push("关联省份或驻地失效");
        }
        if (invalidCities.length) {
          reasons.push("有客户的地市缺少有效 PM");
        }
        return reasons;
      }

      function renderPmCityManagement() {
        if (!isPmCityManagementUser())
          return forbiddenPage(
            "地市管理",
            "地市管理仅对当前有效角色包含 PM 的账号开放。",
          );
        const employee = employees.find(
          (item) => item.name === currentUser.name && item.status === "在职",
        );
        const regions = organizationRegionsForEmployee(employee);
        const heading = pageHead(
          "地市管理",
          "查看负责地市，办理地市交接。",
        );
        if (!regions.length)
          return (
            heading +
            '<section class="panel"><div class="empty"><div><div class="empty-icon">⌖</div><strong>暂无所属区域</strong><p class="panel-sub">当前账号尚未关联有效区域中心。</p></div></div></section>'
          );
        const regionSections = regions.map((region) => {
          const department = organizationDepartments.find(
            (item) =>
              item.regionId === region.id &&
              item.type === "region" &&
              item.status === "启用",
          );
          const director = departmentSupervisor(department);
          const isCurrentValidPm = regionPmEmployees(region).some(
            (item) => item.name === currentUser.name,
          );
          const ownCustomers = isCurrentValidPm ? centerCustomers(region, false).filter(customer => customer.level !== "省公司" && customerOwnerName(customer) === currentUser.name) : [];
          const ownCities = isCurrentValidPm ? regionCityRows(region).filter(city => city.pm === currentUser.name || ownCustomers.some(customer => customerBusinessProvince(customer) === city.province && customerBusinessCity(customer) === city.city)).map(city => {
            const owned = ownCustomers.filter(customer => customerBusinessProvince(customer) === city.province && customerBusinessCity(customer) === city.city);
            const names = new Set(owned.map(customer => customer.name));
            return { ...city, canHandover: city.pm === currentUser.name, customers: owned.length, contacts: contacts.filter(person => contactIsActive(person) && names.has(person.company)).length };
          }) : [];
          const customerCount = ownCities.reduce(
            (sum, city) => sum + city.customers,
            0,
          );
          const contactCount = ownCities.reduce(
            (sum, city) => sum + city.contacts,
            0,
          );
          const configurationStatus = regionConfigurationStatus(region);
          const statusTone =
            configurationStatus === "已配置"
              ? "green"
              : configurationStatus === "配置异常"
                ? "red"
                : "yellow";
          const rows = ownCities.map((city) => {
            const pending = pendingCityHandover(city.id);
            const actions = city.canHandover && city.id && !pending && hasOperationPermission("regions.handover")
                ? `<button class="link" type="button" data-action="handover-city" data-id="${city.id}">发起交接</button>`
                : "—";
            return `<tr><td>${city.province}</td><td><strong>${city.city}</strong></td><td>${city.effective || "—"}</td><td>${city.customers}</td><td>${city.contacts}</td><td><span class="tag green">已分配</span></td><td>${actions}</td></tr>`;
          }).join("");
          return `<section class="panel"><div class="panel-head"><div><div class="panel-title">${region.name}</div><div class="panel-sub">部门编码 ${department?.code || "待同步"} · 区域总监 ${director?.name || "待配置"}</div></div><div class="spacer"></div><span class="tag ${statusTone}">${configurationStatus}</span></div><div class="region-detail-summary"><div class="overview-item"><label>${region.type === "industry" ? "经营范围" : "关联省份"}</label><div>${region.type === "industry" ? `全国 · ${escapeHtml(region.industry)}` : regionProvinceList(region).join("、") || "待配置"}</div></div><div class="overview-item"><label>驻地</label><div>${region.base || "待配置"}</div></div><div class="overview-item"><label>本人负责地市</label><div>${ownCities.length}</div></div><div class="overview-item"><label>地市客户</label><div>${customerCount}</div></div><div class="overview-item"><label>关键人</label><div>${contactCount}</div></div></div><div class="panel-head" style="padding:var(--space-4) 0 var(--space-3)"><div><div class="panel-title">本人地市</div><div class="panel-sub">本人负责地市及客户</div></div></div><div class="table-wrap"><table style="min-width:860px"><thead><tr><th>省份</th><th>地市</th><th>负责起始时间</th><th>客户</th><th>关键人</th><th>分配状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="7"><div class="empty">当前区域暂无本人有效负责地市</div></td></tr>'}</tbody></table></div></section>`;
        }).join("");
        return heading + regionSections;
      }

      function renderRegionCityResponsibilities({
        region,
        regionCities,
        provinces,
        canAssignCities,
        canHandoverCities,
        viewSwitch,
        validPmNames,
      }) {
        const pmAssignedCount = regionCities.filter(
          (city) => city.pm && validPmNames.has(city.pm),
        ).length;
        const rows = regionCities
          .map((city) => {
            const pmName = city.pm && validPmNames.has(city.pm) ? city.pm : "";
            const pmEmployee = employees.find(
              (employee) => employee.name === pmName,
            );
            const invalidPriorResponsibility = Boolean(
              city.pm && city.effective && !pmName,
            );
            const pending = city.id ? pendingCityHandover(city.id) : null;
            const pmStatus = pmName ? "assigned" : "pending";
            const canSelfHandover =
              pmName === currentUser.name && canHandoverCities && !pending;
            const pmActions = region.type === "industry" && canAssignCities ? '<button class="link" data-center-city-assign>分配 PM</button>' : invalidPriorResponsibility
              ? canAssignCities
                ? `<button class="link" type="button" data-action="direct-adjust-city" data-id="${city.id}">直接调整</button>`
                : "—"
              : pmName && !pending
                ? `${canSelfHandover ? `<button class="link" type="button" data-action="handover-city" data-id="${city.id}">发起交接</button> · ` : ""}${canAssignCities ? `<button class="link" type="button" data-action="direct-adjust-city" data-id="${city.id}">直接调整</button> · ` : ""}<button class="link" type="button" data-action="city-impact" data-id="${city.id}">查看范围</button>`
                : pending
                  ? "—"
                  : canAssignCities
                    ? `<button class="link" type="button" data-city-quick-assign="${city.city}">分配</button>`
                    : "—";
            const unlinkAction = canAssignCities && pmName && !pending ? ` · <button class="link" type="button" data-city-unlink="${city.id}">取消关联</button>` : "";
            return `<tr data-page-row data-region-city-row data-province="${city.province}" data-pm-status="${pmStatus}"><td>${city.province}</td><td><strong>${city.city}</strong></td><td>${city.customers}</td><td>${city.contacts}</td><td>${pmName || "—"}</td><td>${pmEmployee?.code || "—"}</td><td>${city.effective || "—"}</td><td><span class="tag ${pmName ? "green" : "yellow"}">${pmName ? "已分配" : "待分配"}</span></td><td>${pmActions}${unlinkAction}</td></tr>`;
          })
          .join("");
        return `<div class="panel-head" style="padding:var(--space-3) 0"><div><div class="panel-sub">全部 ${regionCities.length} 个地市 · PM 已分配 ${pmAssignedCount}</div></div><div class="spacer"></div>${viewSwitch}</div><div class="toolbar" style="padding-left:0;padding-right:0"><select class="input" id="regionCityProvince"><option value="">全部省份</option>${provinces.map((province) => `<option>${province}</option>`).join("")}</select><input class="input" id="regionCityKeyword" maxlength="100" placeholder="城市 / PM"><select class="input" id="regionCityPmStatus"><option value="">全部 PM 状态</option><option value="assigned">PM 已分配</option><option value="pending">PM 待分配</option></select>${filterActions('<button class="btn btn-primary" type="button" id="queryRegionCities">筛选</button><button class="btn" type="button" id="resetRegionCities">重置</button>')}<span class="spacer"></span></div><div class="table-wrap"><table data-paged-table="m08-cities" style="min-width:1120px"><thead><tr><th>省份</th><th>城市</th><th>客户</th><th>关键人</th><th>PM 负责人</th><th>PM 工号</th><th>PM 负责起始时间</th><th>PM 状态</th><th>操作</th></tr></thead><tbody id="regionCityBody">${rows || '<tr data-empty-row><td colspan="9"><div class="empty">当前账号没有可查看的地市责任</div></td></tr>'}<tr data-filter-empty style="display:none"><td colspan="9"><div class="empty">未找到符合条件的地市责任，请调整条件或重置筛选</div></td></tr></tbody></table></div>${tablePagination("m08-cities")}`;
      }

      function renderCityResponsibilityRules(region, canEdit) {
        const rules = cityResponsibilityRules.filter(rule => rule.regionId === region.id &&
          (rule.dimension !== "客户公司" || centerCustomers(region).some(customer => String(customer.id) === String(rule.value))));
        const rows = rules.map(rule => {
          const label = rule.dimension === "客户公司" ? customers.find(customer => String(customer.id) === String(rule.value))?.name || "客户已失效" : rule.value;
          return `<tr><td>${escapeHtml(rule.dimension)}</td><td>${escapeHtml(label)}</td><td>${escapeHtml(rule.pm)}</td><td>${escapeHtml(rule.effective || "—")}</td><td><span class="tag ${rule.status === "启用" ? "green" : "yellow"}">${rule.status}</span></td><td>${canEdit ? `<button class="link" data-city-rule-edit="${rule.id}">编辑</button> · <button class="link" data-city-rule-toggle="${rule.id}">${rule.status === "启用" ? "停用" : "启用"}</button>` : "—"}</td></tr>`;
        }).join("");
        const actual = centerCustomers(region).map(customer => `<tr><td>${escapeHtml(customer.name)}</td><td>${escapeHtml(customer.level)}</td><td>${escapeHtml(customerBusinessProvince(customer))} · ${escapeHtml(customerBusinessCity(customer) || "—")}</td><td>${escapeHtml(responsibilityOwnerForCustomer(customer, region) || "未分配")}</td></tr>`).join("");
        return `<div class="region-data-pane" id="region-pane-rules" role="tabpanel" aria-labelledby="region-tab-rules" ${regionWorkspaceTab !== "rules" ? "hidden" : ""}><div class="panel-head"><div class="panel-title">客户与集团分配</div><div class="spacer"></div></div><div class="table-wrap"><table><thead><tr><th>对象</th><th>客户 / 集团</th><th>PM</th><th>生效日期</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="6"><div class="empty">暂无客户或集团分配</div></td></tr>'}</tbody></table></div>${renderGroupProvinceRoutes(region)}</div><div class="region-data-pane" id="region-pane-customers" role="tabpanel" aria-labelledby="region-tab-customers" ${regionWorkspaceTab !== "customers" ? "hidden" : ""}><div class="panel-head"><div class="panel-title">${region.type === "industry" && !region.enabled ? "待接收客户" : "当前责任客户"}</div></div><div class="table-wrap"><table><thead><tr><th>客户公司</th><th>责任层级</th><th>所在地</th><th>负责人</th></tr></thead><tbody>${actual || '<tr><td colspan="4"><div class="empty">暂无责任客户</div></td></tr>'}</tbody></table></div></div>`;
      }

      function renderRegionAssignmentHelp() {
        return `<details class="region-assignment-help">
          <summary><strong>分配说明</strong><span>中心类型、分配优先级与操作方法</span></summary>
          <div class="region-assignment-help-body">
            <section>
              <h3>先确定经营中心</h3>
              <p><strong>地理区域</strong>按关联省份经营；<strong>行业中心</strong>负责对应行业的全国客户。先匹配集团＋业务责任省份分流至当地地理中心，其余客户按启用行业中心、地理区域依次匹配。</p>
              <p>行业中心启用前，通过“编辑区域配置”设置中心类型、负责行业与驻地。</p>
            </section>
            <section>
              <h3>再确定负责人</h3>
              <p>省级业务责任客户<strong>优先由客户公司直接指定的 PM 负责</strong>，未指定时由本中心总监负责；市级、区县级按以下优先级分配唯一 PM：</p>
              <p class="region-assignment-priority">客户公司直接分配 &gt; 集团分配 &gt; 地市匹配</p>
              <p>集团与地市分配只在本中心有效，且不覆盖省级客户。指定省公司只影响该公司，不自动分配其下属公司。同城可以有多个 PM，但最终负责客户不重叠；客户公司已单独分配时，不再归集团或地市默认 PM。</p>
              <p>接收 PM 须为本中心在职、账号有效且具备 PM 角色的员工。</p>
            </section>
            <section>
              <h3>选对操作，核对分配结果</h3>
              <ul>
                <li><strong>分配地市 PM：</strong>为待分配地市设置默认 PM；更换已有负责人时，在对应地市行使用“直接调整”。</li>
                <li><strong>集团按省分流：</strong>在“客户与集团分配”内，由系统管理员或市场副总将集团某省全部客户交给该省地理中心；不改变集团组织树。</li><li><strong>分配客户 / 集团：</strong>为特定客户公司（含省公司）或本中心的集团客户指定 PM。</li>
                <li><strong>地市负责人配置：</strong>查看地市默认分工，可按地市或 PM 查看。</li>
                <li><strong>客户与集团分配：</strong>维护公司、集团的分配规则。无关键人、待办及其他交接事项时可直接取消关联，无需选择接收人；有事项时按原流程交接。</li>
                <li><strong>当前责任客户：</strong>核对最终负责人；待启用行业中心显示“待接收客户”，用于检查接收安排。</li>
              </ul>
            </section>
            <section>
              <h3>何时生效，交接哪些业务</h3>
              <p>客户 / 集团分配新增、修改、启用或停用后，<strong>立即按最终规则交接存量客户</strong>；省公司停用直接分配后回归中心总监，其他客户回退下一层匹配。地市调整不覆盖客户、集团的高优先级分配。</p>
              <p>行业中心先配置、不提前交接。有未分配或无有效接收人的客户时，须补齐后才能启用；成功启用立即交接未按集团省份分流的对应行业客户，失败时原责任保持。</p>
              <p>交接包含适用任务、六阶段普通项目和未落选普通商机。项目终态、历史记录、历史业绩和目标不追溯改写；平台师资合作业务不随地区责任交接。</p>
            </section>
          </div>
        </details>`;
      }

      function renderRegions() {
        if (isPmCityManagementUser())
          return forbiddenPage(
            "区域中心与地市配置",
            "PM 请通过地市管理查看本人所属区域和本人负责地市。",
          );
        const employee = employees.find((item) => item.name === currentUser.name);
        const employeeRegion = organizationRegionForEmployee(employee);
        const rows = ["director", "pm"].includes(currentUser.role)
          ? regionsData.filter(region => departmentsManagedBy(employee?.code).some(department => department.regionId === region.id))
          : regionsData;
        if (!rows.some((region) => region.id === selectedRegionId))
          selectedRegionId = rows[0]?.id;
        const region =
          rows.find((item) => item.id === selectedRegionId) || rows[0];
        if (!region) return pageHead("区域中心与地市配置", "暂无可查看区域中心。") + renderRegionAssignmentHelp();
        const canEditRegion = hasOperationPermission("regions.edit");
        const canEditCityRules = canEditCityResponsibilityRules(region);
        const canAssignCities = hasOperationPermission("regions.batch_assign");
        const canHandoverCities = hasOperationPermission("regions.handover");
        const provinces = region.type === "industry" ? Object.keys(administrativeDivisions) : regionProvinceList(region);
        const allRegionCities = regionCityRows(region);
        const regionCities = currentUser.role === "pm"
          ? allRegionCities.filter((city) => city.pm === currentUser.name)
          : allRegionCities;
        const pms = currentUser.role === "pm"
          ? regionPmEmployees(region).filter((item) => item.name === currentUser.name)
          : regionPmEmployees(region);
        const customerCount = regionCities.reduce(
          (sum, city) => sum + city.customers,
          0,
        );
        const contactCount = regionCities.reduce(
          (sum, city) => sum + city.contacts,
          0,
        );
        const validPmNames = new Set(
          regionPmEmployees(region).map((employee) => employee.name),
        );
        const assignedCount = regionCities.filter(
          (city) => city.pm && validPmNames.has(city.pm),
        ).length;
        const unassignedCount = regionCities.length - assignedCount;
        const regionStatus = regionConfigurationStatus(region);
        const anomaly =
          regionStatus === "配置异常" ? regionConfigurationAnomaly(region) : null;
        const anomalyHtml =
          anomaly && anomaly.length
            ? `<div class="role-note danger-note" style="margin:0 0 var(--space-3)"><strong>配置异常</strong>：${anomaly.join("；")}</div>`
            : "";
        if (currentUser.role === "pm") regionAssignmentView = "city";
        const viewSwitch = `<div class="assignment-view-switch" role="group" aria-label="地市分配查看视角"><button class="tab ${regionAssignmentView === "city" ? "active" : ""}" type="button" data-region-assignment-view="city">按地市</button>${currentUser.role === "pm" ? "" : `<button class="tab ${regionAssignmentView === "pm" ? "active" : ""}" type="button" data-region-assignment-view="pm">按 PM</button>`}</div>`;
        const pmView = `<div class="panel-head" style="padding:var(--space-3) 0"><div><div class="panel-sub">${region.name}组织下 ${pms.length} 名在职 PM</div></div><div class="spacer"></div>${viewSwitch}</div><div class="toolbar" style="padding-left:0;padding-right:0"><input class="input" id="regionPmKeyword" maxlength="100" placeholder="PM 姓名 / 工号">${filterActions('<button class="btn btn-primary" type="button" id="queryRegionPms">筛选</button><button class="btn" type="button" id="resetRegionPms">重置</button>')}</div><div class="table-wrap"><table data-paged-table="m08-pms" style="min-width:980px"><thead><tr><th>PM 姓名</th><th>工号</th><th>负责城市数</th><th>城市标签</th><th>待生效交接数</th><th>操作</th></tr></thead><tbody id="regionPmBody">${pms.map((employee) => {
          const owned = regionCities.filter((city) => city.pm === employee.name);
          const pendingCount = cityResponsibilityChanges.filter(
            (handover) =>
              handover.type === "地市交接" &&
              handover.originalPm === employee.name &&
              handover.status === "pending_effective",
          ).length;
          return `<tr data-page-row data-region-pm-row data-keyword="${employee.name}${employee.code}"><td><div class="person"><div class="avatar">${employee.name[0]}</div><strong>${employee.name}</strong></div></td><td>${employee.code}</td><td>${owned.length}</td><td>${owned.map((city) => `<span class="tag ${pendingCityHandover(city.id) ? "yellow" : "blue"}" title="${city.province}">${city.city}${pendingCityHandover(city.id) ? " · 待生效" : ""}</span>`).join(" ") || '<span class="tag">尚未分配</span>'}</td><td>${pendingCount ? `<span class="tag yellow">${pendingCount}</span>` : "0"}</td><td>${canAssignCities ? `<button class="link" type="button" data-pm-city-assign="${employee.name}" ${unassignedCount ? "" : "disabled"}>分配</button>` : "—"}</td></tr>`;
        }).join("") || '<tr data-empty-row><td colspan="6"><div class="empty">该区域组织下暂无在职 PM</div></td></tr>'}<tr data-filter-empty style="display:none"><td colspan="6"><div class="empty">未找到符合条件的 PM，请调整条件或重置筛选</div></td></tr></tbody></table></div>${tablePagination("m08-pms")}`;
        return (
          pageHead(
            "区域中心与地市配置",
            "查看区域中心与地市责任分工。",
          ) +
          renderRegionAssignmentHelp() +
          `<section class="panel region-workspace"><div class="toolbar region-center-filters" style="border-bottom:1px solid var(--line)"><input class="input" id="regionSearch" maxlength="100" placeholder="区域名称 / 编码 / 区域总监"><select class="input" id="regionProvinceFilter"><option value="">全部省份</option>${[...new Set(rows.flatMap(regionProvinceList))].map((province) => `<option>${province}</option>`).join("")}</select>${filterActions('<button class="btn btn-primary" type="button" id="applyRegionFilters">筛选</button><button class="btn" type="button" id="resetRegionFilters">重置</button>')}<span class="spacer"></span></div><div class="master-detail"><aside class="master-pane"><div class="master-pane-head"><div class="panel-title">区域中心</div><div class="panel-sub">${rows.length} 个可见区域</div></div><div class="master-list" id="regionMasterList">${rows.map((item) => {
            const department = organizationDepartments.find((entry) => entry.regionId === item.id);
            const status = regionConfigurationStatus(item);
            return `<button class="master-item ${item.id === region.id ? "active" : ""}" data-region-select="${item.id}" data-search="${item.name}${department?.code || ""}${item.director}" data-provinces="${regionProvinceList(item).join("|")}"><div class="avatar">区</div><div class="master-item-main"><div class="master-item-title">${item.name}</div><div class="master-item-sub">${department?.code || "待同步编码"} · ${item.director || "主管待配置"}</div><div class="master-item-sub">${item.type === "industry" ? `全国 · ${escapeHtml(item.industry)}` : `${regionProvinceList(item).length} 省`} · 驻地 ${item.base || "待配置"} · <span class="tag ${status === "已配置" ? "green" : status === "配置异常" ? "red" : "yellow"}">${status}</span></div></div><span>›</span></button>`;
          }).join("")}</div></aside><div class="detail-pane">${anomaly ? anomalyHtml : `<div class="region-detail-head"><div class="region-detail-head-main"><div class="region-detail-name">${region.name}</div><div class="region-detail-director">区域总监 ${region.director || "待配置"} · 部门编码 ${organizationDepartments.find((item) => item.regionId === region.id)?.code || "待同步"}</div></div></div><div class="region-detail-actions">${canEditRegion ? `<button class="btn" data-action="edit-region" data-id="${region.id}">编辑区域配置</button>${region.type === "industry" && !region.enabled ? `<button class="btn btn-primary" data-enable-center="${region.id}">启用中心</button>` : ""}` : ""}${canAssignCities ? '<button class="btn btn-primary" type="button" id="openInitialCityAssignment">分配地市 PM</button>' : ""}${canEditCityRules ? '<button class="btn btn-primary" type="button" data-city-rule-add>分配客户 / 集团</button>' : ""}</div>${anomalyHtml}<div class="region-detail-summary"><div class="overview-item"><label>${region.type === "industry" ? "负责行业" : "关联省份"}</label><div>${region.type === "industry" ? escapeHtml(region.industry) : provinces.length}</div></div><div class="overview-item"><label>驻地</label><div>${region.base || "待配置"}</div></div><div class="overview-item"><label>已分配地市</label><div>${currentUser.role === "pm" ? regionCities.length : `${assignedCount}/${regionCities.length}`}</div></div><div class="overview-item"><label>地市客户</label><div>${customerCount}</div></div><div class="overview-item"><label>关键人</label><div>${contactCount}</div></div></div><div class="region-provinces"><span class="region-provinces-label">${region.type === "industry" ? "经营范围" : "关联省份"}</span>${region.type === "industry" ? '<span class="tag blue">全国</span>' : provinces.map(province => `<span class="tag blue">${province}</span>`).join("") || '<span class="tag yellow">待配置</span>'}</div><div class="region-data-tabs" role="tablist" aria-label="中心责任资料">${[["cities", "地市负责人配置"], ["rules", "客户与集团分配"], ["customers", region.type === "industry" && !region.enabled ? "待接收客户" : "当前责任客户"]].map(([key, label]) => `<button class="tab ${regionWorkspaceTab === key ? "active" : ""}" type="button" role="tab" id="region-tab-${key}" aria-selected="${regionWorkspaceTab === key}" aria-controls="region-pane-${key}" data-region-workspace-tab="${key}">${label}</button>`).join("")}</div><div class="region-data-area"><div class="region-data-pane" id="region-pane-cities" role="tabpanel" aria-labelledby="region-tab-cities" ${regionWorkspaceTab !== "cities" ? "hidden" : ""}>${regionAssignmentView === "pm" ? pmView : renderRegionCityResponsibilities({ region, regionCities, provinces, canAssignCities, canHandoverCities, viewSwitch, validPmNames })}</div>${renderCityResponsibilityRules(region, canEditCityRules)}</div>`}</div></div></section>`
        );
      }

      function renderGroupProvinceRoutes(region) {
        const canEdit = canManageGroupProvinceRoutes();
        const rules = groupProvinceRoutes().filter(rule => canEdit ||
          (region.type === "industry" ? (customerGroupIndustries[rule.value] === region.industry || customers.some(customer => customer.group === rule.value && customer.industry === region.industry && customerBusinessProvince(customer) === rule.province)) : geographicCenterForProvince(rule.province)?.id === region.id));
        return `<div class="panel-head"><div class="panel-title">集团按省分流</div><div class="spacer"></div>${canEdit ? '<button class="btn btn-primary" data-group-province-add>新增分流</button>' : ""}</div><div class="table-wrap"><table><thead><tr><th>集团</th><th>业务责任省份</th><th>接收区域中心</th><th>状态</th><th>操作</th></tr></thead><tbody>${rules.map(rule => `<tr><td>${escapeHtml(rule.value)}</td><td>${escapeHtml(rule.province)}</td><td>${escapeHtml(geographicCenterForProvince(rule.province)?.name || "待配置")}</td><td>${escapeHtml(rule.status)}</td><td>${canEdit ? `<button class="link" data-group-province-edit="${rule.id}">编辑</button> · <button class="link" data-group-province-toggle="${rule.id}">${rule.status === "启用" ? "停用" : "启用"}</button>` : "—"}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">暂无集团按省分流</div></td></tr>'}</tbody></table></div>`;
      }
