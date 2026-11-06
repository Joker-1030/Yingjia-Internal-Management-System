      function regionProvinceTransferOwners(province) {
        return cityOwners.filter(owner => owner.province === province && owner.pm && centerForCityOwner(owner)?.type !== "industry");
      }

      function openRegionProvinceHandover({ region, removed, provinces, base, remark, onConfirm }) {
        const candidates = regionsData.filter(item => item.id !== region.id && item.type !== "industry" && item.status !== "停用");
        if (!candidates.length) return toast("没有可接收省份的其他区域");
        openModal(`<div class="modal-head"><div><div class="modal-title">省份迁移与地市交接</div><div class="modal-subtitle">先选目标区域，再为每个地市选择接收 PM</div></div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="regionProvinceHandoverForm"><div class="modal-body"><div class="role-note province-handover-note"><strong>操作说明</strong><span>移出的省份会加入目标区域；已有责任的地市需要逐个指定接收 PM。未分配地市无需选择 PM。</span></div><div class="province-handover-list">${removed.map((province) => { const owners = regionProvinceTransferOwners(province); const cityRows = owners.length ? `<div class="province-handover-city-head"><span>地市</span><span>交接客户数</span><span>交接关键人数</span><span>当前 PM</span><span>接收 PM</span></div><div class="province-handover-city-list">${owners.map((owner) => { const impact = cityHandoverImpact([owner.id]); return `<div class="province-city-transfer-row" data-city-transfer-row="${owner.id}"><span class="province-city-name">${escapeHtml(owner.city)}</span><span class="province-transfer-count province-transfer-customers"><span class="province-transfer-count-label">交接客户数：</span>${impact.customers}</span><span class="province-transfer-count province-transfer-people"><span class="province-transfer-count-label">交接关键人数：</span>${impact.people}</span><span class="panel-sub province-transfer-current-pm">${escapeHtml(owner.pm)}</span><select class="input" data-transfer-city-pm data-city-id="${owner.id}" required disabled><option value="">先选择目标区域</option></select></div>`; }).join("")}</div>` : `<div class="province-handover-empty">暂无已分配地市，无需交接</div>`; return `<section class="province-handover-card" data-province-transfer-row="${escapeHtml(province)}"><div class="province-handover-card-head"><div><div class="province-handover-province">${escapeHtml(province)}</div><div class="panel-sub">${owners.length ? `已有 ${owners.length} 个地市责任` : "暂无地市责任"}</div></div><div class="province-handover-target"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标区域</label><select class="input" data-transfer-region required><option value="">请选择目标区域</option>${candidates.filter((item) => !regionProvinceList(item).includes(province)).map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}</select></div></div>${cityRows}</section>`; }).join("")}</div><div class="field-error" id="regionProvinceHandoverError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">下一步：确认迁移</button></div></form>`);
        $("#modalLayer .modal").classList.add("province-handover-modal");
        const rows = [...document.querySelectorAll("[data-province-transfer-row]")];
        rows.forEach((row) => {
          const regionSelect = row.querySelector("[data-transfer-region]"), cityPmSelects = [...row.querySelectorAll("[data-transfer-city-pm]")], province = row.dataset.provinceTransferRow;
          regionSelect.onchange = () => {
            const target = regionsData.find((item) => Number(item.id) === Number(regionSelect.value));
            const pms = target ? regionPmEmployees(target) : [];
            cityPmSelects.forEach((pmSelect) => {
              pmSelect.innerHTML = `<option value="">${pms.length ? "请选择接收 PM" : "该区域暂无在职 PM"}</option>${pms.map((employee) => `<option value="${escapeHtml(employee.name)}">${escapeHtml(employee.name)} · ${escapeHtml(employee.code)}</option>`).join("")}`;
              pmSelect.disabled = !regionSelect.value;
            });
          };
        });
        $("#regionProvinceHandoverForm").onsubmit = (event) => {
          event.preventDefault();
          const plans = rows.map((row) => ({ province: row.dataset.provinceTransferRow, targetRegionId: Number(row.querySelector("[data-transfer-region]").value), cityTransfers: [...row.querySelectorAll("[data-transfer-city-pm]")].map((select) => ({ cityId: Number(select.dataset.cityId), targetPm: select.value })) }));
          const error = plans.find((plan) => !plan.targetRegionId || plan.cityTransfers.some((transfer) => !transfer.targetPm));
          if (error) return $("#regionProvinceHandoverError").textContent = "请为每个移出省份选择目标区域，并为每个已有地市选择接收 PM";
          onConfirm(plans);
        };
      }

      function confirmRegionConfigurationSave({ region, department, provinces, base, remark, transferPlans, unlinkProvinces = [], expectedVersion = responsibilityConfigurationVersion() }) {
        const transferSummary = (transferPlans || []).map((plan) => {
          const target = regionsData.find((item) => Number(item.id) === Number(plan.targetRegionId));
          const citySummary = (plan.cityTransfers || []).map((transfer) => {
            const owner = cityOwners.find((item) => Number(item.id) === Number(transfer.cityId));
            return `${owner?.city || "地市"}→${transfer.targetPm}`;
          }).join("、");
          return `${plan.province} → ${target?.name || "目标区域"}${citySummary ? `，地市接收 PM：${citySummary}` : "，无已分配地市"}`;
        });
        transferSummary.push(...unlinkProvinces.map(province => `${province}：直接解除关联，同时取消本中心该省的地市 PM、客户公司及适用集团/分流配置；无交接事项，无需接收人`));
        openModal(`<div class="modal-head"><div class="modal-title">确认保存区域配置</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对后再确认</strong><br>区域：${escapeHtml(region.name)}<br>关联省份：${provinces.join("、") || "无（保存后待配置）"}<br>驻地城市：${escapeHtml(base)}<br>备注：${escapeHtml(remark || "无")}${transferSummary.length ? `<br><br><strong>${unlinkProvinces.length ? "省份关联变更" : "省份迁移与地市交接"}</strong><br>${transferSummary.map(escapeHtml).join("<br>")}` : ""}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmRegionSave">确认保存</button></div>`);
        $("#confirmRegionSave").onclick = () => {
          if (!hasOperationPermission("regions.edit") || !canEditCityResponsibilityRules(region)) return toast("当前账号无权维护区域基础配置");
          if (expectedVersion !== responsibilityConfigurationVersion()) return toast("责任配置已变化，请刷新后重试");
          const removed = regionProvinceList(region).filter(province => !provinces.includes(province));
          if (removed.some(province => !unlinkProvinces.includes(province) && !(transferPlans || []).some(plan => plan.province === province)) ||
            unlinkProvinces.some(province => !removed.includes(province)) ||
            (transferPlans || []).some(plan => !removed.includes(plan.province) || unlinkProvinces.includes(plan.province))) return toast("移出省份处理信息已失效，请重新选择");
          const emptyUnlinkCustomerIds = unlinkProvinces.flatMap(province => provinceUnlinkScope(region, province).companies.map(customer => customer.id));
          const mutationState = captureResponsibilityMutationState([regionsData, cityResponsibilityRules, campaigns, cityResponsibilityChanges, notificationMessages, cityOwners, customers, contacts, tasks, projects, opportunities, employees, accounts, ...salesTargetMutationLists()]);
          try {
            const applyConfiguration = () => {
            unlinkProvinces.forEach(province => {
              const check = provinceUnlinkCheck(region, province);
              if (!check.ok) throw new Error(`${province}：${check.error}`);
            });
            unlinkProvinces.forEach(province => clearProvinceResponsibilityConfiguration(region, province, provinces));
            const reason = `区域省份迁移：${region.name}；${remark || "区域配置调整"}`;
            (transferPlans || []).forEach((plan) => {
              const target = regionsData.find((item) => Number(item.id) === Number(plan.targetRegionId));
              if (!target || regionProvinceList(target).includes(plan.province)) throw new Error(`${plan.province} 已归属其他区域，请刷新后重试`);
              const result = applyProvinceResponsibilityTransfer(region, target, plan.province, plan.cityTransfers, reason);
              if (!result.ok) throw new Error(result.error);
              target.provinces = [...new Set([...regionProvinceList(target), plan.province])].join("、");
              target.updatedAt = recordCreatedAt();
            });
            region.provinces = provinces.join("、");
            Object.assign(region, { name: department.name, scope: department.name.replace(/区域运营中心$/, "区域"), director: departmentSupervisor(department)?.name || "", base, remark, configuredAt: region.configuredAt || recordCreatedAt(), updatedAt: recordCreatedAt() });
            if (!unlinkProvinces.length) normalizeCustomerResponsibilities();
            };
            if ((transferPlans || []).length || unlinkProvinces.length) {
              const result = applyCenterResponsibilityMutation(region, applyConfiguration, "区域省份配置变更", { emptyUnlink: unlinkProvinces.length > 0, emptyUnlinkCustomerIds });
              if (!result.ok) throw new Error(result.error);
            } else applyConfiguration();
            selectedRegionId = region.id;
            closeOverlay();
            renderPage();
            toast(unlinkProvinces.length ? "区域配置及关联解除已保存" : "区域配置及省份地市交接已保存");
          } catch (error) {
            restoreResponsibilityMutationState(mutationState);
            toast(error?.message || "区域配置保存失败，原数据保持不变");
          }
        };
      }

      function openRegionForm(id, chooseType = true) {
        if (!hasOperationPermission("regions.edit"))
          return toast("当前角色无权维护区域基础配置");
        syncOrganizationRegions();
        const region = regionsData.find((item) => item.id === id);
        const department = organizationDepartments.find(
          (item) =>
            item.type === "region" &&
            item.status === "启用" &&
            item.regionId === region?.id,
        );
        if (!region || !department)
          return toast("区域中心必须先在“组织与员工”中创建并启用");
        if (region.type === "industry") return openIndustryCenterForm(region);
        if (chooseType && !region.configuredAt && !region.provinces) {
          openModal(`<div class="modal-head"><div class="modal-title">配置运营中心</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><label class="form-label" for="centerType">责任类型</label><select class="input" id="centerType"><option value="geographic">地理区域</option><option value="industry">全国行业</option></select></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="confirmCenterType">下一步</button></div>`);
          $("#confirmCenterType").onclick = () => {
            if (!hasOperationPermission("regions.edit") || !canEditCityResponsibilityRules(region)) return toast("当前账号无权维护该中心");
            if ($("#centerType").value === "industry") openIndustryCenterForm(region, true);
            else openRegionForm(id, false);
          };
          return;
        }
        const supervisor = departmentSupervisor(department);
        const selected = new Set(regionProvinceList(region));
        const original = new Set(selected);
        const expectedVersion = responsibilityConfigurationVersion();
        const allProvinces = Object.keys(administrativeDivisions);
        const allCities = Object.values(administrativeDivisions).flatMap(
          (cities) => Object.keys(cities),
        );
        openModal(
          `<div class="modal-head"><div class="modal-title">编辑区域配置</div><button class="icon-btn close" data-close>×</button></div><form id="regionForm"><div class="modal-body"><div class="role-note">${escapeHtml(department.name)}</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>关联省份</label><div class="province-assignment" id="regionProvinceAssignment"><section class="province-assignment-panel"><div class="province-assignment-head"><strong>已关联省份</strong><span class="panel-sub" id="regionProvinceAssociatedCount"></span></div><div class="province-assignment-list" id="regionProvinceAssociated"></div></section><section class="province-assignment-panel"><div class="province-assignment-head"><strong>可新增省份</strong><span class="panel-sub">未被其他区域关联</span></div><input class="input" id="regionProvinceSearch" placeholder="搜索省份"><div class="province-assignment-list" id="regionProvinceAvailable"></div></section></div><div class="field-error" id="regionProvinceError" role="alert"></div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>驻地城市</label><select class="input" id="regBase" required></select></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="regRemark" maxlength="500" placeholder="选填，最多 500 字">${region.remark || ""}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存区域配置</button></div></form>`,
        );
        const provinceChecks = () => [...selected];
        const renderProvinceLists = () => {
          const associated = $("#regionProvinceAssociated");
          const available = $("#regionProvinceAvailable");
          const query = $("#regionProvinceSearch")?.value.trim();
          if (!associated || !available) return;
          $("#regionProvinceAssociatedCount").textContent = `${selected.size} 个`;
          associated.innerHTML = [...selected].map((province) => `<div class="province-assignment-row"><span>${escapeHtml(province)}</span><button class="link province-assignment-remove" type="button" data-remove-province="${escapeHtml(province)}">解除关联</button></div>`).join("") || '<div class="province-assignment-empty">暂无已关联省份</div>';
          const availableRows = allProvinces
            .filter((province) => !selected.has(province) && (!query || province.includes(query)))
            .map((province) => {
              const owner = regionsData.find((item) => item.id !== region.id && regionProvinceList(item).includes(province));
              return `<div class="province-assignment-row"><span>${escapeHtml(province)}</span>${owner ? `<span class="panel-sub">已关联于${escapeHtml(owner.name)}</span>` : `<button class="btn btn-sm" type="button" data-add-province="${escapeHtml(province)}">新增</button>`}</div>`;
            }).join("");
          available.innerHTML = availableRows || '<div class="province-assignment-empty">没有可新增的省份</div>';
          document.querySelectorAll("[data-remove-province]").forEach((button) => {
            button.onclick = () => {
              selected.delete(button.dataset.removeProvince);
              renderProvinceLists();
              refreshRegionFields();
            };
          });
          document.querySelectorAll("[data-add-province]").forEach((button) => {
            button.onclick = () => {
              selected.add(button.dataset.addProvince);
              renderProvinceLists();
              refreshRegionFields();
            };
          });
        };
        const refreshRegionFields = () => {
          const baseSelect = $("#regBase");
          if (baseSelect) {
            const current = baseSelect.value;
            const existingMatch = allCities.find(
              (city) =>
                city === region.base || city.replace(/市$/, "") === region.base,
            );
            baseSelect.innerHTML =
              `<option value="">请选择驻地城市</option>${allCities.map((city) => `<option ${city === (current || existingMatch) ? "selected" : ""}>${city}</option>`).join("")}`;
          }
        };
        $("#regionProvinceSearch").oninput = renderProvinceLists;
        renderProvinceLists();
        refreshRegionFields();
        $("#regionForm").onsubmit = (event) => {
          event.preventDefault();
          const provinces = provinceChecks();
          if (!provinces.length && !original.size) return toast("请至少选择一个关联省份");
          if ($("#regBase") && !$("#regBase").value) return toast("请选择驻地城市");
          const conflict = regionsData.find(
            (item) =>
              item.id !== region.id &&
              regionProvinceList(item).some((province) =>
                provinces.includes(province),
              ),
          );
          if (conflict)
            return toast(`省份与“${conflict.name}”冲突，请先调整原归属`);
          const removed = [...original].filter(
            (province) => !provinces.includes(province),
          );
          const base = $("#regBase")?.value || region.base;
          const remark = $("#regRemark").value.trim();
          const unlinkProvinces = removed.filter(province => provinceUnlinkCheck(region, province).ok);
          const needsHandover = removed.filter(province => !unlinkProvinces.includes(province));
          const proceed = (transferPlans = []) => confirmRegionConfigurationSave({ region, department, provinces, base, remark, transferPlans, unlinkProvinces, expectedVersion });
          if (needsHandover.length) return openRegionProvinceHandover({ region, removed: needsHandover, provinces, base, remark, onConfirm: proceed });
          proceed();
        };
      }

      function openIndustryCenterForm(region, createIndustry = false) {
        if (!hasOperationPermission("regions.edit")) return toast("当前账号无权维护中心配置");
        const industries = [...new Set(Object.values(customerGroupIndustries))];
        const allCities = [...new Set(Object.values(administrativeDivisions).flatMap(cities => Object.keys(cities)))];
        openModal(`<div class="modal-head"><div class="modal-title">编辑行业中心配置</div><button class="icon-btn close" data-close>×</button></div><form id="industryCenterForm"><div class="modal-body"><div class="role-note">${escapeHtml(region.name)}</div><div class="form-grid"><div class="form-group"><label class="form-label" for="centerIndustry">负责行业</label><select class="input" id="centerIndustry" required ${region.enabled ? "disabled" : ""}>${industries.map(industry => `<option ${industry === region.industry ? "selected" : ""}>${escapeHtml(industry)}</option>`).join("")}</select></div><div class="form-group"><label class="form-label" for="centerBase">驻地</label><select class="input" id="centerBase" required>${allCities.map(city => `<option ${city === region.base ? "selected" : ""}>${escapeHtml(city)}</option>`).join("")}</select></div></div><div class="field-error" id="industryCenterError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存配置</button></div></form>`);
        $("#industryCenterForm").onsubmit = event => {
          event.preventDefault();
          if (!hasOperationPermission("regions.edit") || !canEditCityResponsibilityRules(region)) return $("#industryCenterError").textContent = "当前账号已无权维护该中心";
          const industry = $("#centerIndustry").value, base = $("#centerBase").value;
          if (!industries.includes(industry) || !allCities.includes(base) || region.enabled && industry !== region.industry) return $("#industryCenterError").textContent = "行业或驻地已失效，请重新选择";
          if (!region.enabled && industry !== region.industry && cityResponsibilityRules.some(rule => rule.regionId === region.id && rule.status === "启用")) return $("#industryCenterError").textContent = "请先解除原行业客户和集团分配，再更换行业";
          Object.assign(region, { ...(createIndustry ? { type: "industry", enabled: false } : {}), industry, base, updatedAt: recordCreatedAt() });
          closeAllOverlays(); renderPage(); toast("中心配置已保存");
        };
      }
