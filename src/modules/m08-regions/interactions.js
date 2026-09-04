      const cityResponsibilityChanges = [
        {
          id: 80303,
          code: "RC-20260810-001",
          type: "地市交接",
          title: "泰安市客户责任由陈经理转交刘经理",
          operator: "陈经理",
          region: "山东区域",
          status: "pending_effective",
          createdAt: "2026-08-10 11:18",
          updatedAt: "2026-08-10 11:18",
          reason: "区域内客户数量调整，重新平衡 PM 工作负荷。",
          originalPm: "陈经理",
          targetPm: "刘经理",
          targetCityIds: [802],
          plannedEffectiveDate: "2026-08-20",
          impactSnapshot: { customers: 1, people: 2, tasks: 3, coverageKpis: 1 },
        },
        {
          id: 80307,
          code: "RC-20260806-001",
          type: "地市交接",
          title: "宁波客户责任由吴经理转交叶经理",
          operator: "吴经理",
          region: "浙江区域",
          status: "pending_effective",
          createdAt: "2026-08-06 13:20",
          updatedAt: "2026-08-06 13:20",
          reason: "区域内工作量重新平衡。",
          originalPm: "吴经理",
          targetPm: "叶经理",
          targetCityIds: [809],
          plannedEffectiveDate: "2026-08-25",
          impactSnapshot: { customers: 1, people: 2, tasks: 2, coverageKpis: 0 },
        },
      ];

      function regionCityRows(region) {
        return regionProvinceList(region).flatMap((province) =>
          Object.keys(administrativeDivisions[province] || {}).map((city) => {
            const owner = cityOwners.find(
              (item) => item.province === province && item.city === city,
            );
            const cityCustomers = customers.filter(
              (customer) =>
                !customer.archived &&
                customer.province === province &&
                customer.city === city,
            );
            const companyNames = new Set(
              cityCustomers.map((customer) => customer.name),
            );
            return {
              id: owner?.id || "",
              province,
              city,
              pm: owner?.pm || "",
              effective: owner?.effective || "",
              customers: cityCustomers.length || (owner?.customers || 0),
              contacts:
                contacts.filter(
                  (person) =>
                    contactIsActive(person) && companyNames.has(person.company),
                ).length || (owner?.contacts || 0),
            };
          }),
        );
      }

      const cityIdsForHandover = (handover) =>
        (handover?.targetCityIds?.length
          ? handover.targetCityIds
          : handover?.targetCityId
            ? [handover.targetCityId]
            : []
        ).map(Number);

      const pendingCityHandover = (cityId) =>
        cityResponsibilityChanges.find(
          (handover) =>
            handover.type === "地市交接" &&
            ["pending_effective", "processing_failed"].includes(
              handover.status,
            ) &&
            cityIdsForHandover(handover).includes(Number(cityId)),
        );

      function cityHandoverImpact(cityIds) {
        const owners = cityOwners.filter((owner) =>
          cityIds.map(Number).includes(Number(owner.id)),
        );
        const companies = customers.filter(
          (company) =>
            !company.archived &&
            owners.some(
              (owner) =>
                owner.province === company.province && owner.city === company.city,
            ),
        );
        const companyNames = new Set(companies.map((company) => company.name));
        const people = contacts.filter(
          (person) => contactIsActive(person) && companyNames.has(person.company),
        );
        const openTasks = tasks.filter(
          (task) =>
            companyNames.has(task.company) &&
            !["done", "cancelled", "expired"].includes(task.status),
        );
        return {
          customers: companies.length,
          people: people.length,
          tasks: openTasks.filter((task) => task.type !== "关键人覆盖 KPI").length,
          coverageKpis: openTasks.filter((task) => task.type === "关键人覆盖 KPI").length,
        };
      }

      function pushCityTransferNotice(handover, owners) {
        const cityNames = owners.map((owner) => owner.city).join("、");
        notificationMessages.unshift({
          id: Date.now(),
          roles: ["pm", "director", "vp"],
          users: [handover.originalPm, handover.targetPm, handover.regionDirector, "王静"].filter(
            Boolean,
          ),
          category: "地市责任",
          title: `${cityNames}责任已交接给${handover.targetPm}`,
          content: `原负责人${handover.originalPm}；${handover.effectiveAt}生效；迁移待办 ${
            (handover.impactSnapshot?.tasks || 0) +
            (handover.impactSnapshot?.coverageKpis || 0)
          } 条。`,
          date: handover.effectiveAt,
          read: false,
        });
      }

      function captureResponsibilityMutationState(lists) {
        const listSnapshots = lists.map((list) => [list, [...list]]);
        const objectSnapshots = [...new Set(lists.flat())]
          .filter(Boolean)
          .map((item) => [item, JSON.parse(JSON.stringify(item))]);
        return { listSnapshots, objectSnapshots };
      }

      function restoreResponsibilityMutationState(state) {
        state.objectSnapshots.forEach(([item, snapshot]) => {
          Object.keys(item).forEach((key) => delete item[key]);
          Object.assign(item, snapshot);
        });
        state.listSnapshots.forEach(([list, snapshot]) => {
          list.splice(0, list.length, ...snapshot);
        });
      }

      function applyCityResponsibilityTransfer(handover) {
        const cityIds = cityIdsForHandover(handover);
        const owners = cityOwners.filter((owner) => cityIds.includes(Number(owner.id)));
        const region = regionForName(handover.region);
        const targetValid = regionPmEmployees(region).some(
          (employee) => employee.name === handover.targetPm,
        );
        if (
          !owners.length ||
          owners.length !== cityIds.length ||
          !targetValid ||
          owners.some((owner) => owner.pm !== handover.originalPm)
        ) {
          handover.status = "processing_failed";
          handover.businessError =
            "地市当前负责人、目标 PM 任职或区域映射已变化，原责任保持不变";
          return false;
        }
        const projectPlan = prepareProjectResponsibilityTransfer({
          kind: "city_pm",
          region,
          owners,
          fromOwner: handover.originalPm,
          toOwner: handover.targetPm,
        });
        if (!projectPlan.ok) {
          handover.status = "processing_failed";
          handover.businessError = projectPlan.error;
          return false;
        }
        const mutationState = captureResponsibilityMutationState([
          cityOwners,
          customers,
          contacts,
          tasks,
          projects,
          employees,
          accounts,
        ]);
        const effectiveAt = `${handover.plannedEffectiveDate || DEMO_TODAY} 00:00`;
        try {
          const projectResult = applyProjectResponsibilityTransfer(projectPlan, {
            effectiveAt,
            operator: handover.operator || currentUser.name,
            referenceId: handover.code,
            referenceType: handover.type,
            reason: handover.reason,
          });
          if (!projectResult.ok) throw new Error(projectResult.error);
          owners.forEach((owner) => {
            const companyNames = new Set(
              customers
                .filter(
                  (company) =>
                    !company.archived &&
                    company.province === owner.province &&
                    company.city === owner.city,
                )
                .map((company) => company.name),
            );
            owner.pm = handover.targetPm;
            owner.effective = handover.plannedEffectiveDate || DEMO_TODAY;
            customers
              .filter((company) => companyNames.has(company.name))
              .forEach((company) => {
                company.pm = handover.targetPm;
                if (company.level !== "省公司") company.owner = handover.targetPm;
              });
            contacts
              .filter((person) => companyNames.has(person.company))
              .forEach((person) => (person.pm = handover.targetPm));
            tasks
              .filter(
                (task) =>
                  companyNames.has(task.company) &&
                  task.pm === handover.originalPm &&
                  !["done", "cancelled", "expired"].includes(task.status),
              )
              .forEach((task) => (task.pm = handover.targetPm));
          });
          normalizeCustomerResponsibilities();
          syncPmEmployeeScopes();
          handover.migratedProjectIds = projectResult.projectIds;
        } catch (error) {
          restoreResponsibilityMutationState(mutationState);
          handover.status = "processing_failed";
          handover.businessError =
            error?.message?.includes("保持不变")
              ? error.message
              : "地区责任或项目负责人迁移失败，全部业务对象保持原值";
          return false;
        }
        handover.status = "effective";
        handover.effectiveAt = effectiveAt;
        handover.updatedAt = handover.effectiveAt;
        handover.businessError = "";
        try {
          pushCityTransferNotice(handover, owners);
          handover.notificationStatus = "sent";
        } catch (error) {
          handover.notificationStatus = "retry_pending";
          handover.notificationError = "责任已生效，交接消息待重试";
        }
        return true;
      }

      function createDirectCityAssignment(region, cities, pm, remark) {
        const assigned = assignCitiesToPm(region, cities, pm, DEMO_TODAY);
        if (!assigned) return toast("所选地市已被分配，请刷新后重试");
        const owners = cityOwners.filter(
          (owner) =>
            owner.pm === pm &&
            cities.includes(owner.city) &&
            regionProvinceList(region).includes(owner.province),
        );
        cityResponsibilityChanges.unshift({
          id: Date.now(),
          code: nextBusinessCode("RC"),
          source: "manual",
          type: "地市分配",
          title: `${owners.map((owner) => owner.city).join("、")}分配给${pm}`,
          operator: currentUser.name,
          region: regionScopeName(region),
          status: "effective",
          createdAt: recordCreatedAt(),
          updatedAt: recordCreatedAt(),
          reason: remark || "系统管理员完成地市负责人初次配置。",
          targetPm: pm,
          targetCityIds: owners.map((owner) => owner.id),
          originalPm: "未分配",
          plannedEffectiveDate: DEMO_TODAY,
          effectiveAt: `${DEMO_TODAY} 00:00`,
        });
        closeAllOverlays();
        renderPage();
        toast(`已为${pm}分配 ${assigned} 个地市，并记录责任变更`);
      }

      function openDirectAdjust(cityId) {
        if (!hasOperationPermission("regions.batch_assign"))
          return toast("当前角色无权调整地市负责人");
        const c = cityOwners.find((x) => x.id === cityId);
        if (!c || !c.pm) return toast("该地市当前没有负责人，请使用分配");
        const region = regionsData.find((item) =>
          regionProvinceList(item).includes(c.province),
        );
        const invalidPriorResponsibility = Boolean(
          c.effective &&
            !regionPmEmployees(region).some((employee) => employee.name === c.pm),
        );
        const pending = pendingCityHandover(c.id);
        if (pending) return toast("该地市存在未结束交接，请先处理");
        const pms = regionPmEmployees(region).filter((item) => item.name !== c.pm);
        if (!pms.length) return toast("该区域中心没有其他在职 PM 可接任");
        openModal(
          `<div class="modal-head"><div class="modal-title">直接调整地市负责人</div><button class="icon-btn close" data-close>×</button></div><form id="directAdjustForm"><div class="modal-body"><div class="role-note">${c.province} · <strong>${c.city}</strong> · ${invalidPriorResponsibility ? `原负责人 ${c.pm} 的责任已失效，原生效时间 ${c.effective} 将随历史保留。` : `当前负责人 ${c.pm}。`}直接调整确认后立即生效并记录责任变更，同时通知原任和新任 PM。</div><div class="form-group full"><label class="form-label">影响摘要</label><div class="impact-summary"><div class="impact-grid"><div><label>受影响客户</label><strong>${scopedCustomers().filter((x) => x.province === c.province && x.city === c.city).length}</strong></div><div><label>关键人</label><strong>${scopedContacts().filter((x) => x.company && customers.find((cu) => cu.name === x.company && cu.province === c.province && cu.city === c.city)).length}</strong></div><div><label>未完成任务</label><strong>${tasks.filter((t) => t.pm === c.pm && !["done", "cancelled", "expired"].includes(t.status)).length}</strong></div><div><label>覆盖 KPI 待办</label><strong>${campaigns.filter((cp) => cp.category === "关键人覆盖 KPI" && cp.status === "执行中").length}</strong></div></div></div><div class="list-sub">与交接影响摘要同口径，实时计算</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标 PM</label><select class="input" id="daPm" required>${pms.map((item) => `<option value="${item.name}">${item.name} · ${item.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>调整原因</label><textarea class="input" id="daReason" minlength="5" maxlength="500" required placeholder="说明直接调整原因"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认调整</button></div></form>`,
        );
        $("#directAdjustForm").onsubmit = (event) => {
          event.preventDefault();
          const targetPm = $("#daPm").value;
          const reason = $("#daReason").value.trim();
          if (reason.length < 5 || reason.length > 500)
            return toast("调整原因须为 5-500 字");
          const previousPm = c.pm;
          const change = {
            id: Date.now(),
            code: nextBusinessCode("RC"),
            source: "manual",
            type: "地市直接调整",
            title: `${c.city}负责人由${previousPm}调整为${targetPm}`,
            operator: currentUser.name,
            region: regionScopeName(region),
            status: "effective",
            createdAt: recordCreatedAt(),
            updatedAt: recordCreatedAt(),
            reason: reason,
            targetPm,
            targetCityIds: [c.id],
            originalPm: previousPm,
            ...(invalidPriorResponsibility
              ? {
                  targetCitySnapshots: [
                    {
                      id: c.id,
                      province: c.province,
                      city: c.city,
                      originalPm: previousPm,
                      effective: c.effective,
                    },
                  ],
                }
              : {}),
            plannedEffectiveDate: DEMO_TODAY,
            impactSnapshot: cityHandoverImpact([c.id]),
          };
          const applied = applyCityResponsibilityTransfer(change);
          cityResponsibilityChanges.unshift(change);
          closeAllOverlays();
          renderPage();
          toast(
            applied
              ? `${c.city}负责人已调整为${targetPm}，并记录责任变更`
              : "直接调整业务迁移失败，原负责人和项目责任保持不变",
          );
        };
      }

      function assignCitiesToPm(region, cities, pm, effective = DEMO_TODAY) {
        const validPmNames = new Set(
          regionPmEmployees(region).map((employee) => employee.name),
        );
        if (!validPmNames.has(pm)) return false;
        const owners = cities.map((city) => {
          const province = regionProvinceList(region).find(
            (item) => (administrativeDivisions[item] || {})[city],
          );
          return province
            ? cityOwners.find(
                (item) => item.province === province && item.city === city,
              )
            : null;
        });
        const hasInvalidPriorResponsibility = owners.some(
          (owner) =>
            owner &&
            owner.effective &&
            !(owner.pm && validPmNames.has(owner.pm)),
        );
        if (hasInvalidPriorResponsibility) return false;
        let assigned = 0;
        cities.forEach((city) => {
          const province = regionProvinceList(region).find(
            (item) => (administrativeDivisions[item] || {})[city],
          );
          if (!province) return;
          let owner = cityOwners.find(
            (item) => item.province === province && item.city === city,
          );
          if (owner?.pm && validPmNames.has(owner.pm)) return;
          if (!owner) {
            owner = { id: Date.now() + assigned, province, city };
            cityOwners.push(owner);
          }
          Object.assign(owner, { pm, effective });
          assigned += 1;
        });
        normalizeCustomerResponsibilities();
        syncPmEmployeeScopes();
        return assigned;
      }

      function syncPmEmployeeScopes() {
        employees
          .filter((employee) => employeeHasRole(employee, "PM"))
          .forEach((employee) => syncEmployeeAccount(employee));
      }

      function openCityForm(pmName = "", preferredCity = "") {
        if (!hasOperationPermission("regions.batch_assign"))
          return toast("当前角色无权分配地市负责人");
        const region =
          regionsData.find((x) => x.id === selectedRegionId) || regionsData[0];
        const pms = regionPmEmployees(region);
        const validPmNames = new Set(pms.map((employee) => employee.name));
        const available = regionCityRows(region).filter(
          (city) => !(city.pm && validPmNames.has(city.pm)) && !city.effective,
        );
        if (!pms.length) return toast("该区域中心暂无在职 PM，请先在组织中配置");
        const defaultProvince =
          available.find((item) => item.city === preferredCity)?.province ||
          available[0]?.province ||
          regionProvinceList(region)[0] ||
          "";
        openModal(
          `<div class="modal-head"><div class="modal-title">地市分配</div><button class="icon-btn close" data-close>×</button></div><form id="cityForm"><div class="modal-body"><div class="role-note">区域：${region.name} · 系统管理员（公司全局）或本区域区域总监可操作。省份多选，城市选项实时联动。保存后立即生效。</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>省份 <span class="panel-sub">多选，城市选项实时联动</span></label><div class="choice-grid" id="cityAssignProvinceGrid">${regionProvinceList(region).map((province) => `<label class="choice-item"><input type="checkbox" data-assign-province value="${province}" ${province === defaultProvince ? "checked" : ""}><span>${province}</span></label>`).join("")}</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>未分配城市</label><div class="choice-grid" id="cityChoices"></div><div class="list-sub">只展示所选省份下尚未配置负责人的城市</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标 PM</label><select class="input" id="cityPm">${pms.map((employee) => `<option ${employee.name === pmName ? "selected" : ""} value="${employee.name}">${employee.name} · ${employee.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">生效时间</label><input class="input" value="立即生效" disabled></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="cityAssignRemark" maxlength="500" placeholder="选填，最多 500 字"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit" ${available.length ? "" : "disabled"}>下一步：二次确认</button></div></form>`,
        );
        const renderChoices = () => {
          const provinces = [...document.querySelectorAll("[data-assign-province]:checked")].map((input) => input.value);
          const rows = available.filter((item) => provinces.includes(item.province));
          $("#cityChoices").innerHTML =
            rows
              .map(
                (item) =>
                  `<label class="choice-item"><input class="assignment-check" type="checkbox" name="cityAssignment" value="${item.city}" ${item.city === preferredCity ? "checked" : ""}><span>${item.city}</span></label>`,
              )
              .join("") || '<div class="role-note">所选省份当前没有未分配地市</div>';
        };
        document.querySelectorAll("[data-assign-province]").forEach((input) => (input.onchange = renderChoices));
        renderChoices();
        $("#cityForm").onsubmit = (e) => {
          e.preventDefault();
          const cities = [...document.querySelectorAll("#cityChoices input:checked")].map(
            (input) => input.value,
          );
          if (!cities.length) return toast("请至少选择一个未分配地市");
          if (cities.length > 50) return toast("一次最多分配 50 个地市");
          const selectedPm = $("#cityPm").value;
          const remark = $("#cityAssignRemark").value.trim();
          openModal(
            `<div class="modal-head"><div class="modal-title">确认分配</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对后再确认</strong><br>${region.name} · ${$("#cityAssignProvince").value}<br>地市：${cities.join("、")}<br>目标 PM：${selectedPm}<br>确认后立即生效，已分配关系后续只能通过交接流程变更。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmCityAssignment">确认分配并生效</button></div>`,
          );
          $("#confirmCityAssignment").onclick = () =>
            createDirectCityAssignment(region, cities, selectedPm, remark);
        };
      }

      function commitCityHandover(payload) {
        const {
          region,
          owners,
          targetPm,
          plannedEffectiveDate,
          reason,
          impactSnapshot,
        } = payload;
        const handover = {
          id: Date.now(),
          code: nextBusinessCode("RC"),
          source: "manual",
          type: "地市交接",
          title: `${owners.map((owner) => owner.city).join("、")}由${owners[0].pm}转交${targetPm}`,
          operator: currentUser.name,
          region: regionScopeName(region),
          regionDirector: region.director,
          status: plannedEffectiveDate > DEMO_TODAY ? "pending_effective" : "effective",
          createdAt: recordCreatedAt(),
          updatedAt: recordCreatedAt(),
          reason,
          originalPm: owners[0].pm,
          targetPm,
          targetCityIds: owners.map((owner) => owner.id),
          targetCitySnapshots: owners.map((owner) => ({
            id: owner.id,
            province: owner.province,
            city: owner.city,
            originalPm: owner.pm,
          })),
          plannedEffectiveDate,
          impactSnapshot,
        };
        if (plannedEffectiveDate <= DEMO_TODAY)
          applyCityResponsibilityTransfer(handover);
        cityResponsibilityChanges.unshift(handover);
        closeAllOverlays();
        renderPage();
        toast(
          handover.status === "pending_effective"
            ? `已确认交接，将于 ${plannedEffectiveDate} 自动生效`
            : handover.status === "effective"
              ? "地市责任交接已生效，目标 PM 已收到通知"
              : "交接业务处理失败，原责任保持不变",
        );
      }

      function openCityHandover(id) {
        if (!isPmCityManagementUser())
          return toast("地市交接仅原负责 PM 本人可发起（DEC-143）；区域总监和 admin 请使用直接调整");
        const city = cityOwners.find((x) => x.id === id);
        if (city && city.pm !== currentUser.name)
          return toast("地市交接仅原负责 PM 本人可发起（DEC-143）；区域总监和 admin 请使用直接调整");
        if (!hasOperationPermission("regions.handover"))
          return toast("当前角色无权发起地市负责人交接");
        const c = cityOwners.find((x) => x.id === id);
        if (!c) return toast("该地市尚未配置负责人");
        const region = regionsData.find((item) =>
          regionProvinceList(item).includes(c.province),
        );
        if (c.pm !== currentUser.name)
          return toast("PM 只能发起本人当前负责地市的交接");
        const existing = pendingCityHandover(c.id);
        if (existing)
          return toast(`该地市已有未结束交接 ${existing.code}，不能重复发起`);
        const pms = regionPmEmployees(region).filter(
          (employee) => employee.name !== c.pm,
        );
        const sameOwnerCities = cityOwners.filter(
          (owner) =>
            owner.pm === c.pm && regionProvinceList(region).includes(owner.province),
        );
        if (!pms.length) return toast("该区域暂无其他在职 PM 可接收交接");
        openModal(
          `<div class="modal-head"><div class="modal-title">发起地市责任交接</div><button class="icon-btn close" data-close>×</button></div><form id="cityHandover"><div class="modal-body"><div class="role-note">原 PM：${c.pm}<br>只能同时选择同一原 PM 的 1-50 个地市；计划日期前原 PM 继续负责，确认后不再进入审批。</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交接地市</label><div class="choice-grid" id="handoverCityChoices">${sameOwnerCities.map((owner) => { const pending = pendingCityHandover(owner.id); return `<label class="choice-item ${pending ? "is-disabled" : ""}"><input class="assignment-check" type="checkbox" value="${owner.id}" ${owner.id === c.id ? "checked" : ""} ${pending ? "disabled" : ""}><span>${owner.province} · ${owner.city}${pending ? ` · 待生效（${pending.code}）` : ""}</span></label>`; }).join("")}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标 PM</label><select class="input" id="targetCityPm">${pms.map((employee) => `<option value="${employee.name}">${employee.name} · ${employee.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>计划生效日期</label><input class="input" id="cityHandoverDate" type="date" min="${DEMO_TODAY}" max="${addDays(DEMO_TODAY, 90)}" value="${DEMO_TODAY}" required></div><div class="form-group full"><label class="form-label">影响摘要</label><div class="detail-grid" id="cityHandoverImpact"></div><div class="list-sub">确认和生效时都会重新校验负责人、目标 PM、区域映射和对象版本。</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交接原因 <span class="panel-sub">5-500 字</span></label><textarea class="input" id="cityReason" minlength="5" maxlength="500" required placeholder="说明交接原因"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">下一步：确认交接</button></div></form>`,
        );
        const selectedOwnerIds = () =>
          [...document.querySelectorAll("#handoverCityChoices input:checked")].map(
            (input) => Number(input.value),
          );
        const refreshImpact = () => {
          const selected = selectedOwnerIds();
          const impact = cityHandoverImpact(selected);
          $("#cityHandoverImpact").innerHTML = `<div class="detail-item"><label>客户单位</label><div>${impact.customers} 家</div></div><div class="detail-item"><label>关键人</label><div>${impact.people} 人</div></div><div class="detail-item"><label>未完成任务</label><div>${impact.tasks} 条</div></div><div class="detail-item"><label>覆盖 KPI 待办</label><div>${impact.coverageKpis} 条</div></div><div class="detail-item"><label>已选地市</label><div>${selected.length} 个</div></div>`;
        };
        $("#handoverCityChoices").onchange = (changeEvent) => {
          const selected = selectedOwnerIds();
          if (selected.length > 50) {
            if (changeEvent.target) changeEvent.target.checked = false;
            toast("一次最多交接 50 个地市");
          }
          refreshImpact();
        };
        refreshImpact();
        $("#cityHandover").onsubmit = (e) => {
          e.preventDefault();
          const cityIds = selectedOwnerIds();
          const owners = cityOwners.filter((owner) => cityIds.includes(owner.id));
          const targetPm = $("#targetCityPm").value;
          const plannedEffectiveDate = $("#cityHandoverDate").value;
          const reason = $("#cityReason").value.trim();
          if (!cityIds.length || cityIds.length > 50)
            return toast("请选择 1-50 个同一原 PM 的地市");
          if (owners.some((owner) => owner.pm !== c.pm))
            return toast("所选地市负责人已变化，请刷新后重新选择");
          const conflicting = cityIds.map(pendingCityHandover).find(Boolean);
          if (conflicting)
            return toast(`所选地市已有未结束交接 ${conflicting.code}`);
          if (!plannedEffectiveDate || plannedEffectiveDate < DEMO_TODAY || plannedEffectiveDate > addDays(DEMO_TODAY, 90))
            return toast("计划生效日期须为当前业务日至未来 90 日");
          if (reason.length < 5 || reason.length > 500)
            return toast("交接原因须为 5-500 字");
          const payload = {
            region,
            owners,
            targetPm,
            plannedEffectiveDate,
            reason,
            impactSnapshot: cityHandoverImpact(cityIds),
          };
          openModal(
            `<div class="modal-head"><div class="modal-title">确认地市责任交接</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对交接范围</strong><br>地市：${owners.map((owner) => owner.city).join("、")}<br>${c.pm} → ${targetPm}<br>计划生效：${plannedEffectiveDate}<br>${plannedEffectiveDate === DEMO_TODAY ? "确认后重新校验并立即整体生效。" : "确认后进入待生效，计划日前原 PM 继续负责。"}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmCityHandover">确认交接</button></div>`,
          );
          $("#confirmCityHandover").onclick = () => commitCityHandover(payload);
        };
      }
      function openCityImpact(id) {
        const c = cityOwners.find((x) => x.id === id);
        if (!c) return toast("该地市尚未配置负责人");
        const region = regionsData.find((item) =>
          regionProvinceList(item).includes(c.province),
        );
        const live = regionCityRows(region).find(
          (item) => item.province === c.province && item.city === c.city,
        );
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">${c.city}责任范围</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${metric("客户单位", live?.customers || 0, "实时聚合")}${metric("关键人", live?.contacts || 0, "实时聚合")}</div><div class="section-title">客户单位</div>${
            scopedCustomers()
              .filter((x) => x.province === c.province && x.city === c.city)
              .map(
                (x) =>
                  `<div class="list-row"><div class="avatar">企</div><div class="list-main"><div class="list-title">${x.name}</div><div class="list-sub">${x.group} · ${x.contacts}名关键人</div></div><span class="link" data-customer-region="${x.id}">详情</span></div>`,
              )
              .join("") || '<div class="role-note">暂无演示客户</div>'
          }</div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${hasOperationPermission("regions.handover") && !pendingCityHandover(c.id) ? `<button class="btn btn-primary" data-action="handover-city" data-id="${c.id}">发起交接</button>` : pendingCityHandover(c.id) ? `<button class="btn" data-action="city-handover-detail" data-id="${pendingCityHandover(c.id).id}">查看交接</button>` : ""}</div>`,
        );
      }

      function openCityHandoverDetail(id) {
        const handover = cityResponsibilityChanges.find(
          (item) => Number(item.id) === Number(id) && item.type === "地市交接",
        );
        if (!handover) return toast("交接记录不存在");
        const canView =
          currentUser.fullAccess ||
          ["president", "vp"].includes(currentUser.role) ||
          currentUser.name === handover.originalPm ||
          currentUser.name === handover.targetPm ||
          (currentUser.role === "director" &&
            regionsMatch(handover.region, currentUser.region));
        if (!canView) return toast("当前账号无权查看该交接记录");
        const statusName =
          handover.status === "pending_effective"
            ? "待生效"
            : handover.status === "effective"
              ? "已生效"
              : "生效失败";
        const statusTone =
          handover.status === "effective"
            ? "green"
            : handover.status === "processing_failed"
              ? "red"
              : "yellow";
        const cityNames = cityIdsForHandover(handover)
          .map((cityId) => cityOwners.find((owner) => Number(owner.id) === cityId)?.city)
          .filter(Boolean)
          .join("、");
        const impact = handover.impactSnapshot || {};
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">地市责任交接</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">交</div><div><div class="detail-name">${cityNames || handover.title}</div><div class="detail-sub">${handover.code}</div></div><div class="spacer"></div><span class="tag ${statusTone}">${statusName}</span></div><div class="detail-grid"><div class="detail-item"><label>原负责人</label><div>${handover.originalPm}</div></div><div class="detail-item"><label>目标负责人</label><div>${handover.targetPm}</div></div><div class="detail-item"><label>计划生效日期</label><div>${handover.plannedEffectiveDate}</div></div><div class="detail-item"><label>确认人</label><div>${handover.operator}</div></div><div class="detail-item"><label>确认时间</label><div>${handover.createdAt}</div></div><div class="detail-item"><label>实际生效时间</label><div>${handover.effectiveAt || "—"}</div></div><div class="detail-item full"><label>交接原因</label><div>${handover.reason}</div></div>${handover.businessError ? `<div class="detail-item full"><label>失败结果</label><div>${handover.businessError}</div></div>` : ""}</div><div class="section-title">影响快照</div><div class="metrics compact-metrics">${metric("客户单位", impact.customers || 0, "交接确认时")}${metric("关键人", impact.people || 0, "交接确认时", "blue")}${metric("未完成任务", impact.tasks || 0, "交接确认时", "yellow")}${metric("覆盖 KPI 待办", impact.coverageKpis || 0, "交接确认时", "orange")}</div>${handover.status === "pending_effective" ? '<div class="role-note">计划生效日前原 PM 继续负责；到期时重新校验并一次性迁移责任。</div>' : ""}</div><div class="drawer-foot"><button class="btn" data-close>关闭</button></div>`,
        );
      }
