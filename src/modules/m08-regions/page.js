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
        const department = organizationDepartments.find(
          (item) => item.regionId === region?.id && item.status === "启用",
        );
        const validRequiredConfiguration =
          regionRequiredConfigurationIsValid(region);
        if (!region?.configuredAt && !validRequiredConfiguration)
          return "待配置";
        const director = departmentSupervisor(department);
        const hasInvalidOwner = regionCityRows(region).some(
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
          "查看本人所属区域和当前负责地市，并处理本人发起的地市交接。",
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
          const ownCities = isCurrentValidPm
            ? regionCityRows(region).filter(
                (city) => city.id && city.pm === currentUser.name,
              )
            : [];
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
            const actions = pending
              ? `<button class="link" type="button" data-action="approval-detail" data-id="${pending.id}">查看交接</button>`
              : hasOperationPermission("regions.handover")
                ? `<button class="link" type="button" data-action="handover-city" data-id="${city.id}">发起交接</button>`
                : "—";
            return `<tr><td>${city.province}</td><td><strong>${city.city}</strong></td><td>${city.effective || "—"}</td><td>${city.customers}</td><td>${city.contacts}</td><td><span class="tag green">已分配</span></td><td>${actions}</td></tr>`;
          }).join("");
          return `<section class="panel"><div class="panel-head"><div><div class="panel-title">${region.name}</div><div class="panel-sub">部门编码 ${department?.code || "待同步"} · 区域总监 ${director?.name || "待配置"}</div></div><div class="spacer"></div><span class="tag ${statusTone}">${configurationStatus}</span></div><div class="region-detail-summary"><div class="overview-item"><label>关联省份</label><div>${regionProvinceList(region).join("、") || "待配置"}</div></div><div class="overview-item"><label>驻地</label><div>${region.base || "待配置"}</div></div><div class="overview-item"><label>本人负责地市</label><div>${ownCities.length}</div></div><div class="overview-item"><label>地市客户</label><div>${customerCount}</div></div><div class="overview-item"><label>关键人</label><div>${contactCount}</div></div></div><div class="panel-head" style="padding:var(--space-4) 0 var(--space-3)"><div><div class="panel-title">本人地市</div><div class="panel-sub">仅展示本人当前有效负责地市</div></div></div><div class="table-wrap"><table style="min-width:860px"><thead><tr><th>省份</th><th>地市</th><th>负责起始时间</th><th>客户</th><th>关键人</th><th>分配状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="7"><div class="empty">当前区域暂无本人有效负责地市</div></td></tr>'}</tbody></table></div></section>`;
        }).join("");
        return heading + regionSections;
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
          ? regionsData.filter((region) => region.id === employeeRegion?.id)
          : regionsData;
        if (!rows.some((region) => region.id === selectedRegionId))
          selectedRegionId = rows[0]?.id;
        const region =
          rows.find((item) => item.id === selectedRegionId) || rows[0];
        if (!region) return pageHead("区域中心与地市配置", "暂无可查看区域中心。");
        const canEditRegion = hasOperationPermission("regions.edit");
        const canAssignCities = hasOperationPermission("regions.batch_assign");
        const canHandoverCities = hasOperationPermission("regions.handover");
        const provinces = regionProvinceList(region);
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
        const cityView = `<div class="panel-head" style="padding:var(--space-3) 0"><div><div class="panel-title">${currentUser.role === "pm" ? "本人地市责任" : "地市负责人配置"}</div><div class="panel-sub">${currentUser.role === "pm" ? `本人负责 ${regionCities.length} 个地市` : `全部 ${regionCities.length} 个地市 · 已分配 ${assignedCount} · 待分配 ${unassignedCount}`}</div></div><div class="spacer"></div>${viewSwitch}${canAssignCities ? '<button class="btn btn-primary" type="button" id="openInitialCityAssignment">分配</button>' : ""}</div><div class="toolbar" style="padding-left:0;padding-right:0"><select class="input" id="regionCityProvince"><option value="">全部省份</option>${provinces.map((province) => `<option>${province}</option>`).join("")}</select><input class="input" id="regionCityKeyword" maxlength="100" placeholder="城市 / PM 姓名 / 工号"><select class="input" id="regionCityStatus"><option value="">全部分配状态</option><option value="assigned">已分配</option><option value="pending">待分配</option></select><button class="btn" type="button" id="queryRegionCities">查询</button><button class="btn" type="button" id="resetRegionCities">重置</button><span class="spacer"></span><span class="panel-sub">目标 PM 不审批、不接收，仅在交接生效后收到通知</span></div>${canAssignCities ? "" : '<div class="role-note">当前角色按权限范围只读查看；地市交接仅原负责 PM 本人可发起，区域总监和 admin 使用直接调整。</div>'}<div class="table-wrap"><table style="min-width:1120px"><thead><tr><th>省份</th><th>城市</th><th>当前负责人</th><th>工号</th><th>部门</th><th>负责起始时间</th><th>状态</th><th>操作</th></tr></thead><tbody id="regionCityBody">${regionCities.map((city) => {
          const pmName = city.pm && validPmNames.has(city.pm) ? city.pm : "";
          const invalidPriorResponsibility = Boolean(
            city.pm && city.effective && !pmName,
          );
          const pmEmployee = employees.find((employee) => employee.name === pmName);
          const pending = city.id ? pendingCityHandover(city.id) : null;
          const status = pmName ? "assigned" : "pending";
          const statusName = pmName ? "已分配" : "待分配";
          const statusTone = pmName ? "green" : "yellow";
          const pendingWarning = !pmName && city.customers > 0;
          const canSelfHandover = pmName === currentUser.name && canHandoverCities && !pending;
          const handoverAction = invalidPriorResponsibility
            ? canAssignCities
              ? `<button class="link" type="button" data-action="direct-adjust-city" data-id="${city.id}">直接调整</button>`
              : ""
            : pmName && !pending
              ? `${canSelfHandover ? `<button class="link" type="button" data-action="handover-city" data-id="${city.id}">发起交接</button> · ` : ""}${canAssignCities ? `<button class="link" type="button" data-action="direct-adjust-city" data-id="${city.id}">直接调整</button> · ` : ""}`
              : pending
                ? `<button class="link" type="button" data-action="approval-detail" data-id="${pending.id}">查看交接</button> · `
                : "";
          const scopeAction = invalidPriorResponsibility
            ? canAssignCities
              ? ""
              : "—"
            : pmName
              ? `<button class="link" type="button" data-action="city-impact" data-id="${city.id}">查看范围</button>`
              : canAssignCities
                ? `<button class="link" type="button" data-city-quick-assign="${city.city}">分配</button>`
                : "—";
          return `<tr data-region-city-row data-province="${city.province}" data-keyword="${city.city}${pmName || ""}${pmEmployee?.code || ""}" data-status="${status}"${pendingWarning ? ' data-pending-warning="true"' : ""}><td>${city.province}</td><td><strong>${city.city}</strong><div class="list-sub">客户 ${city.customers} · 关键人 ${city.contacts}</div></td><td>${pmName || "—"}</td><td>${pmEmployee?.code || "—"}</td><td>${pmEmployee?.dept || "—"}</td><td>${city.effective || "—"}</td><td><span class="tag ${statusTone}">${statusName}</span></td><td>${handoverAction}${scopeAction}</td></tr>`;
        }).join("") || '<tr><td colspan="8"><div class="empty">当前账号没有可查看的地市责任</div></td></tr>'}</tbody></table></div>`;
        const pmView = `<div class="panel-head" style="padding:var(--space-3) 0"><div><div class="panel-title">按 PM 查看</div><div class="panel-sub">${region.name}组织下 ${pms.length} 名在职 PM</div></div><div class="spacer"></div>${viewSwitch}${canAssignCities ? '<button class="btn btn-primary" type="button" id="openInitialCityAssignment">分配</button>' : ""}</div><div class="toolbar" style="padding-left:0;padding-right:0"><input class="input" id="regionPmKeyword" maxlength="100" placeholder="PM 姓名 / 工号"><button class="btn" type="button" id="queryRegionPms">查询</button><button class="btn" type="button" id="resetRegionPms">重置</button><span class="spacer"></span><span class="panel-sub">当前还有 ${unassignedCount} 个待分配地市</span></div><div class="table-wrap"><table style="min-width:980px"><thead><tr><th>PM 姓名</th><th>工号</th><th>所属区域中心</th><th>负责城市数</th><th>城市标签</th><th>待审批交接数</th><th>操作</th></tr></thead><tbody id="regionPmBody">${pms.map((employee) => {
          const owned = regionCities.filter((city) => city.pm === employee.name);
          const pendingCount = approvals.filter(
            (approval) =>
              approval.type === "地市交接" &&
              approval.originalPm === employee.name &&
              ["pending", "approved_pending_effective", "processing_failed"].includes(approval.status),
          ).length;
          return `<tr data-region-pm-row data-keyword="${employee.name}${employee.code}"><td><div class="person"><div class="avatar">${employee.name[0]}</div><strong>${employee.name}</strong></div></td><td>${employee.code}</td><td>${region.name}</td><td>${owned.length}</td><td>${owned.map((city) => `<span class="tag ${pendingCityHandover(city.id) ? "yellow" : "blue"}" title="${city.province}">${city.city}${pendingCityHandover(city.id) ? " · 交接中" : ""}</span>`).join(" ") || '<span class="tag">尚未分配</span>'}</td><td>${pendingCount ? `<span class="tag yellow">${pendingCount}</span>` : "0"}</td><td>${canAssignCities ? `<button class="link" type="button" data-pm-city-assign="${employee.name}" ${unassignedCount ? "" : "disabled"}>分配</button>` : "—"}</td></tr>`;
        }).join("") || '<tr><td colspan="7"><div class="empty">该区域组织下暂无在职 PM</div></td></tr>'}</tbody></table></div>`;
        return (
          pageHead(
            "区域中心与地市配置",
            "左侧切换区域中心，右侧完整查看省份归属和地市 PM 责任。",
            currentUser.role === "director"
              ? '<span class="tag blue">仅本区域可见 · 可分配/直接调整</span>'
              : currentUser.role === "vp"
                ? '<span class="tag blue">可编辑关联省份与驻地城市</span>'
                : "",
          ) +
          `<section class="panel"><div class="toolbar" style="border-bottom:1px solid var(--line)"><input class="input" id="regionSearch" maxlength="100" placeholder="区域名称 / 编码 / 区域总监"><select class="input" id="regionProvinceFilter"><option value="">全部省份</option>${[...new Set(rows.flatMap(regionProvinceList))].map((province) => `<option>${province}</option>`).join("")}</select><span class="spacer"></span><span class="panel-sub">区域中心和主管来自“组织与员工”</span></div><div class="master-detail"><aside class="master-pane"><div class="master-pane-head"><div class="panel-title">区域中心</div><div class="panel-sub">${rows.length} 个可见区域</div></div><div class="master-list" id="regionMasterList">${rows.map((item) => {
            const department = organizationDepartments.find((entry) => entry.regionId === item.id);
            const status = regionConfigurationStatus(item);
            return `<button class="master-item ${item.id === region.id ? "active" : ""}" data-region-select="${item.id}" data-search="${item.name}${department?.code || ""}${item.director}" data-provinces="${regionProvinceList(item).join("|")}"><div class="avatar">区</div><div class="master-item-main"><div class="master-item-title">${item.name}</div><div class="master-item-sub">${department?.code || "待同步编码"} · ${item.director || "主管待配置"}</div><div class="master-item-sub">${regionProvinceList(item).length} 省 · 驻地 ${item.base || "待配置"} · <span class="tag ${status === "已配置" ? "green" : status === "配置异常" ? "red" : "yellow"}">${status}</span></div></div><span>›</span></button>`;
          }).join("")}</div></aside><div class="detail-pane"><div class="region-detail-head"><div class="region-detail-head-main"><div class="region-detail-name">${region.name}</div><div class="region-detail-director">区域总监 ${region.director || "待配置"} · 部门编码 ${organizationDepartments.find((item) => item.regionId === region.id)?.code || "待同步"}</div></div><div class="region-detail-actions">${canEditRegion ? `<button class="btn${canAssignCities ? "" : " btn-primary"}" data-action="edit-region" data-id="${region.id}">编辑区域配置</button>` : ""}</div></div>${anomalyHtml}<div class="region-detail-summary"><div class="overview-item"><label>关联省份</label><div>${provinces.length}</div></div><div class="overview-item"><label>驻地</label><div>${region.base || "待配置"}</div></div><div class="overview-item"><label>已分配地市</label><div>${currentUser.role === "pm" ? regionCities.length : `${assignedCount}/${regionCities.length}`}</div></div><div class="overview-item"><label>地市客户</label><div>${customerCount}</div></div><div class="overview-item"><label>关键人</label><div>${contactCount}</div></div></div><div class="region-provinces"><span class="region-provinces-label">关联省份</span>${provinces.map((province) => `<span class="tag blue">${province}</span>`).join("") || '<span class="tag yellow">待配置</span>'}</div>${regionAssignmentView === "pm" ? pmView : cityView}</div></div></section>`
        );
      }
