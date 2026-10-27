      function regionProvinceTransferOwners(province) {
        return cityOwners.filter((owner) => owner.province === province && owner.pm);
      }

      function openRegionProvinceHandover({ region, removed, provinces, base, remark, onConfirm }) {
        const candidates = regionsData.filter((item) => item.id !== region.id && item.status !== "停用");
        if (!candidates.length) return toast("没有可接收省份的其他区域");
        openModal(`<div class="modal-head"><div><div class="modal-title">省份迁移与地市交接</div><div class="modal-subtitle">先选目标区域，再为每个地市选择接收 PM</div></div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="regionProvinceHandoverForm"><div class="modal-body"><div class="role-note province-handover-note"><strong>操作说明</strong><span>移出的省份会加入目标区域；已有责任的地市需要逐个指定接收 PM。未分配地市无需选择 PM。</span></div><div class="province-handover-list">${removed.map((province) => { const owners = regionProvinceTransferOwners(province); const cityRows = owners.length ? `<div class="province-handover-city-head"><span>地市</span><span>当前 PM</span><span>接收 PM</span></div><div class="province-handover-city-list">${owners.map((owner) => `<div class="province-city-transfer-row" data-city-transfer-row="${owner.id}"><span class="province-city-name">${escapeHtml(owner.city)}</span><span class="panel-sub">${escapeHtml(owner.pm)}</span><select class="input" data-transfer-city-pm data-city-id="${owner.id}" required disabled><option value="">先选择目标区域</option></select></div>`).join("")}</div>` : `<div class="province-handover-empty">暂无已分配地市，无需交接</div>`; return `<section class="province-handover-card" data-province-transfer-row="${escapeHtml(province)}"><div class="province-handover-card-head"><div><div class="province-handover-province">${escapeHtml(province)}</div><div class="panel-sub">${owners.length ? `已有 ${owners.length} 个地市责任` : "暂无地市责任"}</div></div><div class="province-handover-target"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标区域</label><select class="input" data-transfer-region required><option value="">请选择目标区域</option>${candidates.filter((item) => !regionProvinceList(item).includes(province)).map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}</select></div></div>${cityRows}</section>`; }).join("")}</div><div class="field-error" id="regionProvinceHandoverError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">下一步：确认迁移</button></div></form>`);
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

      function confirmRegionConfigurationSave({ region, department, provinces, base, remark, transferPlans }) {
        const transferSummary = (transferPlans || []).map((plan) => {
          const target = regionsData.find((item) => Number(item.id) === Number(plan.targetRegionId));
          const citySummary = (plan.cityTransfers || []).map((transfer) => {
            const owner = cityOwners.find((item) => Number(item.id) === Number(transfer.cityId));
            return `${owner?.city || "地市"}→${transfer.targetPm}`;
          }).join("、");
          return `${plan.province} → ${target?.name || "目标区域"}${citySummary ? `，地市接收 PM：${citySummary}` : "，无已分配地市"}`;
        });
        openModal(`<div class="modal-head"><div class="modal-title">确认保存区域配置</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对后再确认</strong><br>区域：${escapeHtml(region.name)}<br>关联省份：${provinces.join("、")}<br>驻地城市：${escapeHtml(base)}<br>备注：${escapeHtml(remark || "无")}${transferSummary.length ? `<br><br><strong>省份迁移与地市交接</strong><br>${transferSummary.map(escapeHtml).join("<br>")}` : ""}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmRegionSave">确认保存</button></div>`);
        $("#confirmRegionSave").onclick = () => {
          const mutationState = captureResponsibilityMutationState([regionsData, cityResponsibilityChanges, notificationMessages, cityOwners, customers, contacts, tasks, projects, opportunities, employees, accounts, ...salesTargetMutationLists()]);
          try {
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
            normalizeCustomerResponsibilities();
            selectedRegionId = region.id;
            closeOverlay();
            renderPage();
            toast("区域配置及省份地市交接已保存");
          } catch (error) {
            restoreResponsibilityMutationState(mutationState);
            toast(error?.message || "区域配置保存失败，原数据保持不变");
          }
        };
      }

      function openRegionForm(id) {
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
        const supervisor = departmentSupervisor(department);
        const selected = new Set(regionProvinceList(region));
        const original = new Set(selected);
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
          if (!provinces.length) return toast("请至少选择一个关联省份");
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
          const proceed = (transferPlans = []) => confirmRegionConfigurationSave({ region, department, provinces, base, remark, transferPlans });
          if (removed.length) return openRegionProvinceHandover({ region, removed, provinces, base, remark, onConfirm: proceed });
          proceed();
        };
      }
