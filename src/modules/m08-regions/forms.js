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
          `<div class="modal-head"><div class="modal-title">编辑区域配置</div><button class="icon-btn close" data-close>×</button></div><form id="regionForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">区域中心名称 / 编码</label><input class="input" value="${department.name} / ${department.code}" disabled><div class="list-sub">组织基础信息须在“组织与员工”中修改</div></div><div class="form-group"><label class="form-label">区域总监</label><input class="input" value="${supervisor ? `${supervisor.name} / ${supervisor.code}` : "主管待配置"}" disabled><div class="list-sub">区域中心主管即区域总监</div></div><div class="form-group full"><label class="form-label">关联省份 *</label><div class="multi-select" id="regionProvinceSelect"><button class="multi-select-trigger" id="regionProvinceTrigger" type="button"><span id="regionProvinceText"></span><span>⌄</span></button><div class="multi-select-menu hidden" id="regionProvinceMenu"><input class="input" id="regionProvinceSearch" placeholder="搜索省份"><div id="regionProvinceOptions">${allProvinces
            .map((province) => {
              const owner = regionsData.find(
                (item) =>
                  item.id !== region.id &&
                  regionProvinceList(item).includes(province),
              );
              return `<label class="multi-select-option" data-province-option="${province}"><input type="checkbox" value="${province}" ${selected.has(province) ? "checked" : ""} ${owner ? "disabled" : ""}><span>${province}${owner ? ` · 已归属${owner.name}` : ""}</span></label>`;
            })
            .join(
              "",
            )}</div></div></div></div><div class="form-group"><label class="form-label">驻地城市 *</label><select class="input" id="regBase" required></select><div class="list-sub">系统管理员与市场副总可修改</div></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="regRemark" maxlength="500" placeholder="选填，最多 500 字">${region.remark || ""}</textarea></div></div><div class="role-note">这里只维护区域业务映射。部门名称、编码、区域中心标记和主管统一在“组织与员工”维护，保存后按组织主管重新计算省公司负责人和数据范围。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存区域配置</button></div></form>`,
        );
        const provinceChecks = () =>
          Array.from(
            document.querySelectorAll("#regionProvinceOptions input:checked"),
          );
        const refreshRegionFields = () => {
          const values = provinceChecks().map((input) => input.value);
          $("#regionProvinceText").textContent = values.length
            ? values.join("、")
            : "请选择关联省份";
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
        $("#regionProvinceTrigger").onclick = () =>
          $("#regionProvinceMenu").classList.toggle("hidden");
        document
          .querySelectorAll("#regionProvinceOptions input")
          .forEach((input) => (input.onchange = refreshRegionFields));
        $("#regionProvinceSearch").oninput = () =>
          document
            .querySelectorAll("[data-province-option]")
            .forEach((option) =>
              option.classList.toggle(
                "hidden",
                !option.dataset.provinceOption.includes(
                  $("#regionProvinceSearch").value.trim(),
                ),
              ),
            );
        refreshRegionFields();
        $("#regionForm").onsubmit = (event) => {
          event.preventDefault();
          const provinces = provinceChecks().map((input) => input.value);
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
          const blockingCities = cityOwners.filter((item) =>
            removed.includes(item.province),
          );
          const blockingCustomers = customers.filter((item) =>
            removed.includes(item.province),
          );
          if (blockingCities.length || blockingCustomers.length)
            return toast(
              `不能移除：仍有 ${blockingCities.length} 条地市责任和 ${blockingCustomers.length} 家客户，请先迁移`,
            );
          const base = $("#regBase")?.value || region.base;
          const remark = $("#regRemark").value.trim();
          openModal(
            `<div class="modal-head"><div class="modal-title">确认保存区域配置</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对后再确认</strong><br>关联省份：${provinces.join("、")}<br>驻地城市：${base}<br>备注：${remark || "无"}<br>保存后按组织主管重新计算省公司负责人和数据范围。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmRegionSave">确认保存</button></div>`,
          );
          $("#confirmRegionSave").onclick = () => {
            Object.assign(region, {
              name: department.name,
              scope: department.name.replace(/区域运营中心$/, "区域"),
              director: supervisor?.name || "",
              provinces: provinces.join("、"),
              base,
              remark,
              updatedAt: recordCreatedAt(),
            });
            selectedRegionId = region.id;
            closeOverlay();
            renderPage();
            toast("区域配置已保存，业务责任将按组织主管重新计算");
          };
        };
      }

