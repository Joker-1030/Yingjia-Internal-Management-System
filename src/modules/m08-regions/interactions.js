      const cityResponsibilityChanges = [];

      function regionCityRows(region) {
        const provinces = region?.type === "industry" ? Object.keys(administrativeDivisions) : regionProvinceList(region);
        return provinces.flatMap(province => Object.keys(administrativeDivisions[province] || {}).map(city => {
          const owner = cityDefaultOwner(province, city, region);
          const cityCustomers = centerCustomers(region).filter(customer => customer.level !== "省公司" && customerBusinessProvince(customer) === province && customerBusinessCity(customer) === city);
          const names = new Set(cityCustomers.map(customer => customer.name));
          return { id: owner?.id || "", province, city, pm: owner?.pm || "", effective: owner?.effective || "", customers: cityCustomers.length, contacts: contacts.filter(person => contactIsActive(person) && names.has(person.company)).length };
        }));
      }

      function cityResponsibilityOpportunities(owners) {
        return opportunities.filter((opportunity) => {
          if (opportunity.stage === "落选" || isEcosystemOpportunity(opportunity)) return false;
          const customer = salesOpportunityCustomer(opportunity);
          return customer && customer.level !== "省公司" && owners.some(
            (owner) => customerUsesCityOwner(customer, owner),
          );
        });
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
                customerUsesCityOwner(company, owner),
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
          opportunities: cityResponsibilityOpportunities(owners).length,
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
        const region = handover.sourceRegionId
          ? regionsData.find((item) => Number(item.id) === Number(handover.sourceRegionId))
          : regionForName(handover.region);
        const targetRegion = handover.targetRegionId
          ? regionsData.find((item) => Number(item.id) === Number(handover.targetRegionId))
          : region;
        const targetValid = targetRegion && targetRegion.status !== "停用" && regionPmEmployees(targetRegion).some(
          (employee) => employee.name === handover.targetPm && employee.accountStatus !== "停用",
        );
        if (
          !region ||
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
        const affectedOpportunities = cityResponsibilityOpportunities(owners);
        const mutationState = captureResponsibilityMutationState([
          cityOwners,
          customers,
          contacts,
          tasks,
          projects,
          opportunities,
          employees,
          accounts,
          ...salesTargetMutationLists(),
        ]);
        const effectiveAt = salesSupportNow();
        try {
          const originalEmployee=employees.find(person=>person.name===handover.originalPm);
          const receiver=employees.find(person=>person.name===handover.targetPm);
          const targetPlan=originalEmployee && !salesRetainsRegionResponsibility(originalEmployee,region,owners) ? prepareSalesTargetHandoff(originalEmployee,regionScopeName(region),receiver) : null;
          if(targetPlan && !targetPlan.ok)throw new Error(targetPlan.error);
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
                    customerUsesCityOwner(company, owner),
                )
                .map((company) => company.name),
            );
            owner.pm = handover.targetPm;
            if (owner.regionId || region.id !== targetRegion.id) owner.regionId = targetRegion.id;
            owner.effective = handover.plannedEffectiveDate || DEMO_TODAY;
            customers
              .filter((company) => companyNames.has(company.name))
              .forEach((company) => {
                company.pm = handover.targetPm;
                if (company.level !== "省公司") company.owner = handover.targetPm;
                if (targetRegion !== region) company.region = regionScopeName(targetRegion);
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
          affectedOpportunities.forEach((opportunity) => {
            const previousOwner = opportunity.owner;
            if (previousOwner === handover.targetPm) return;
            salesCapturePerformance(opportunity);
            opportunity.owner = handover.targetPm;
            opportunity.updatedAt = effectiveAt;
            opportunity.reassignments ||= [];
            opportunity.reassignments.push({
              before: previousOwner,
              after: handover.targetPm,
              reason: `PM 地市责任交接：${handover.reason}`,
              operator: handover.operator || currentUser.name,
              time: effectiveAt,
              sourceResponsibilityChangeCode: handover.code,
            });
          });
          normalizeCustomerResponsibilities();
          syncPmEmployeeScopes();
          handover.migratedProjectIds = projectResult.projectIds;
          if(targetPlan)applySalesTargetHandoff(targetPlan,`PM地市责任交接：${handover.reason}`,effectiveAt,handover.operator || currentUser.name);
        } catch (error) {
          restoreResponsibilityMutationState(mutationState);
          handover.status = "processing_failed";
          handover.businessError = error?.message || "地区责任、项目、商机或目标迁移失败，全部业务对象保持原值";
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

      function applyProvinceResponsibilityTransfer(sourceRegion, targetRegion, province, cityTransfers, reason) {
        if (
          !sourceRegion ||
          !targetRegion ||
          sourceRegion.id === targetRegion.id ||
          sourceRegion.status === "停用" ||
          targetRegion.status === "停用" ||
          !regionProvinceList(sourceRegion).includes(province) ||
          regionProvinceList(targetRegion).includes(province)
        ) {
          return { ok: false, error: `${province} 的区域归属已变化，请刷新后重试` };
        }
        const owners = cityOwners.filter(owner => owner.province === province && owner.pm && centerForCityOwner(owner)?.id === sourceRegion.id);
        if (!owners.length) return { ok: true, handovers: [] };
        const assignments = (cityTransfers || []).map((transfer) => ({ cityId: Number(transfer.cityId), targetPm: transfer.targetPm }));
        const assignmentIds = assignments.map((assignment) => assignment.cityId);
        if (assignmentIds.length !== owners.length || new Set(assignmentIds).size !== owners.length || owners.some((owner) => !assignmentIds.includes(Number(owner.id))) || assignments.some((assignment) => !assignment.targetPm)) {
          return { ok: false, error: `${province} 的地市交接信息不完整，请重新选择` };
        }
        const groups = [...new Set(assignments.map((assignment) => {
          const owner = owners.find((item) => Number(item.id) === assignment.cityId);
          return `${owner.pm}::${assignment.targetPm}`;
        }))].map((groupKey) => {
          const [originalPm, targetPm] = groupKey.split("::");
          return {
            originalPm,
            targetPm,
            owners: assignments.filter((assignment) => {
              const owner = owners.find((item) => Number(item.id) === assignment.cityId);
              return owner?.pm === originalPm && assignment.targetPm === targetPm;
            }).map((assignment) => owners.find((item) => Number(item.id) === assignment.cityId)),
          };
        });
        const mutationState = captureResponsibilityMutationState([
          cityResponsibilityChanges,
          notificationMessages,
          cityOwners,
          customers,
          contacts,
          tasks,
          projects,
          opportunities,
          employees,
          accounts,
          ...salesTargetMutationLists(),
        ]);
        const handovers = [];
        try {
          groups.forEach((group) => {
            const handover = {
              id: Date.now() + handovers.length,
              code: nextBusinessCode("RC"),
              source: "province_transfer",
              type: "省份迁移地市交接",
              title: `${province}地市由${group.originalPm}转交${group.targetPm}`,
              operator: currentUser.name,
              region: regionScopeName(sourceRegion),
              regionDirector: sourceRegion.director,
              sourceRegionId: sourceRegion.id,
              targetRegionId: targetRegion.id,
              status: "effective",
              createdAt: recordCreatedAt(),
              updatedAt: recordCreatedAt(),
              reason,
              originalPm: group.originalPm,
              targetPm: group.targetPm,
              targetCityIds: group.owners.map((owner) => owner.id),
              targetCitySnapshots: group.owners.map((owner) => ({ id: owner.id, province: owner.province, city: owner.city, originalPm: owner.pm })),
              plannedEffectiveDate: DEMO_TODAY,
              impactSnapshot: cityHandoverImpact(group.owners.map((owner) => owner.id)),
            };
            if (!applyCityResponsibilityTransfer(handover)) throw new Error(handover.businessError || "地市责任迁移失败");
            cityResponsibilityChanges.unshift(handover);
            handovers.push(handover);
          });
        } catch (error) {
          restoreResponsibilityMutationState(mutationState);
          return { ok: false, error: error?.message || "省份地市交接失败，原责任保持不变" };
        }
        return { ok: true, handovers };
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
        toast(
          `已为${pm}分配 ${assigned} 个地市`,
        );
      }

      function openDirectAdjust(cityId) {
        if (!hasOperationPermission("regions.batch_assign"))
          return toast("当前角色无权调整地市负责人");
        const c = cityOwners.find((x) => x.id === cityId);
        if (!c || !c.pm) return toast("该地市当前没有负责人，请使用分配");
        const region = centerForCityOwner(c);
        const invalidPriorResponsibility = Boolean(
          c.effective &&
            !regionPmEmployees(region).some((employee) => employee.name === c.pm),
        );
        const pending = pendingCityHandover(c.id);
        if (pending) return toast("该地市存在未结束交接，请先处理");
        const pms = regionPmEmployees(region).filter((item) => item.name !== c.pm);
        if (!pms.length) return toast("该区域中心没有其他在职 PM 可接任");
        openModal(
          `<div class="modal-head"><div class="modal-title">直接调整地市负责人</div><button class="icon-btn close" data-close>×</button></div><form id="directAdjustForm"><div class="modal-body"><div class="role-note">${c.province} · <strong>${c.city}</strong> · ${invalidPriorResponsibility ? `原负责人 ${c.pm} 的责任已失效，负责起始时间：${c.effective}。` : `当前负责人 ${c.pm}。`}确认后立即生效，并通知原任和新任 PM。</div><div class="form-group full"><label class="form-label">影响摘要</label><div class="impact-summary"><div class="impact-grid"><div><label>受影响客户</label><strong>${cityHandoverImpact([c.id]).customers}</strong></div><div><label>关键人</label><strong>${cityHandoverImpact([c.id]).people}</strong></div><div><label>未完成任务</label><strong>${cityHandoverImpact([c.id]).tasks}</strong></div><div><label>覆盖 KPI 待办</label><strong>${cityHandoverImpact([c.id]).coverageKpis}</strong></div><div><label>未落选商机</label><strong>${cityResponsibilityOpportunities([c]).length}</strong></div></div></div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标 PM</label><select class="input" id="daPm" required>${pms.map((item) => `<option value="${item.name}">${item.name} · ${item.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>调整原因</label><textarea class="input" id="daReason" minlength="5" maxlength="500" required placeholder="说明直接调整原因"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认调整</button></div></form>`,
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
              ? `${c.city}负责人已调整为${targetPm}`
              : "直接调整业务迁移失败，原负责人和项目责任保持不变",
          );
        };
      }

      function assignCitiesToPm(region, cities, pm, effective = DEMO_TODAY) {
        if (!canEditCityResponsibilityRules(region) || !regionPmEmployees(region).some(employee => employee.name === pm && employee.accountStatus !== "停用")) return false;
        const rows = regionCityRows(region);
        const selected = cities.map(city => rows.find(row => row.city === city));
        if (!cities.length || cities.length > 50 || selected.some(row => !row || row.pm || row.effective)) return false;
        const result = applyCenterResponsibilityMutation(region, () => selected.forEach(row => {
          let owner = cityDefaultOwner(row.province, row.city, region);
          if (!owner) { owner = { id: Date.now() + cityOwners.length, regionId: region.id, province: row.province, city: row.city }; cityOwners.push(owner); }
          Object.assign(owner, { pm, effective });
        }), "地市分配");
        return result.ok ? selected.length : false;
      }

      function syncPmEmployeeScopes() {
        employees
          .filter((employee) => employeeHasRole(employee, "PM"))
          .forEach((employee) => syncEmployeeAccount(employee));
      }

      function openCityForm(pmName = "", preferredCity = "") {
        if (regionsData.find(region => region.id === selectedRegionId)?.type === "industry") return openCenterCityAssignment();
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
          `<div class="modal-head"><div class="modal-title">地市分配</div><button class="icon-btn close" data-close>×</button></div><form id="cityForm"><div class="modal-body"><div class="role-note">区域：${escapeHtml(region.name)}</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>省份 <span class="panel-sub">可多选</span></label><div class="choice-grid" id="cityAssignProvinceGrid">${regionProvinceList(region).map((province) => `<label class="choice-item"><input type="checkbox" data-assign-province value="${province}" ${province === defaultProvince ? "checked" : ""}><span>${province}</span></label>`).join("")}</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>未分配城市</label><div class="choice-grid" id="cityChoices"></div><div class="list-sub">最多选择 50 个地市</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标 PM</label><select class="input" id="cityPm">${pms.map((employee) => `<option ${employee.name === pmName ? "selected" : ""} value="${employee.name}">${employee.name} · ${employee.code}</option>`).join("")}</select></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="cityAssignRemark" maxlength="500" placeholder="选填，最多 500 字"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit" ${available.length ? "" : "disabled"}>下一步：二次确认</button></div></form>`,
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
          const selectedProvinces = [...document.querySelectorAll("[data-assign-province]:checked")].map(
            (input) => input.value,
          );
          openModal(
            `<div class="modal-head"><div class="modal-title">确认分配</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对后再确认</strong><br>${region.name} · ${selectedProvinces.join("、")}<br>地市：${cities.join("、")}<br>目标 PM：${selectedPm}<br>确认后立即生效。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmCityAssignment">确认分配并生效</button></div>`,
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
              ? "地市责任交接已生效"
              : "交接业务处理失败，原责任保持不变",
        );
      }

      function openCityHandover(id) {
        if (!isPmCityManagementUser())
          return toast("地市交接仅当前负责 PM 本人可发起；区域总监和管理员请使用直接调整");
        const city = cityOwners.find((x) => x.id === id);
        if (city && city.pm !== currentUser.name)
          return toast("地市交接仅当前负责 PM 本人可发起；区域总监和管理员请使用直接调整");
        if (!hasOperationPermission("regions.handover"))
          return toast("当前角色无权发起地市负责人交接");
        const c = cityOwners.find((x) => x.id === id);
        if (!c) return toast("该地市尚未配置负责人");
        const region = centerForCityOwner(c);
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
          `<div class="modal-head"><div class="modal-title">发起地市责任交接</div><button class="icon-btn close" data-close>×</button></div><form id="cityHandover"><div class="modal-body"><div class="role-note">原 PM：${c.pm}<br>每次可交接 1-50 个本人负责地市；计划生效日前仍由原 PM 负责。</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交接地市</label><div class="choice-grid" id="handoverCityChoices">${sameOwnerCities.map((owner) => { const pending = pendingCityHandover(owner.id); return `<label class="choice-item ${pending ? "is-disabled" : ""}"><input class="assignment-check" type="checkbox" value="${owner.id}" ${owner.id === c.id ? "checked" : ""} ${pending ? "disabled" : ""}><span>${owner.province} · ${owner.city}${pending ? ` · 待生效（${pending.code}）` : ""}</span></label>`; }).join("")}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标 PM</label><select class="input" id="targetCityPm">${pms.map((employee) => `<option value="${employee.name}">${employee.name} · ${employee.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>计划生效日期</label><input class="input" id="cityHandoverDate" type="date" min="${DEMO_TODAY}" max="${addDays(DEMO_TODAY, 90)}" value="${DEMO_TODAY}" required></div><div class="form-group full"><label class="form-label">影响摘要</label><div class="detail-grid" id="cityHandoverImpact"></div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交接原因 <span class="panel-sub">5-500 字</span></label><textarea class="input" id="cityReason" minlength="5" maxlength="500" required placeholder="说明交接原因"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">下一步：确认交接</button></div></form>`,
        );
        const selectedOwnerIds = () =>
          [...document.querySelectorAll("#handoverCityChoices input:checked")].map(
            (input) => Number(input.value),
          );
        const refreshImpact = () => {
          const selected = selectedOwnerIds();
          const impact = cityHandoverImpact(selected);
          $("#cityHandoverImpact").innerHTML = `<div class="detail-item"><label>客户单位</label><div>${impact.customers} 家</div></div><div class="detail-item"><label>关键人</label><div>${impact.people} 人</div></div><div class="detail-item"><label>未完成任务</label><div>${impact.tasks} 条</div></div><div class="detail-item"><label>覆盖 KPI 待办</label><div>${impact.coverageKpis} 条</div></div><div class="detail-item"><label>未落选商机</label><div>${impact.opportunities} 条</div></div><div class="detail-item"><label>已选地市</label><div>${selected.length} 个</div></div>`;
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
            `<div class="modal-head"><div class="modal-title">确认地市责任交接</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请核对交接范围</strong><br>地市：${owners.map((owner) => owner.city).join("、")}<br>${c.pm} → ${targetPm}<br>计划生效：${plannedEffectiveDate}<br>${plannedEffectiveDate === DEMO_TODAY ? "确认后立即生效。" : "确认后进入待生效，计划日前原 PM 继续负责。"}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmCityHandover">确认交接</button></div>`,
          );
          $("#confirmCityHandover").onclick = () => commitCityHandover(payload);
        };
      }
      function openCityImpact(id) {
        const c = cityOwners.find((x) => x.id === id);
        if (!c) return toast("该地市尚未配置负责人");
        const region = centerForCityOwner(c);
        const live = regionCityRows(region).find(
          (item) => item.province === c.province && item.city === c.city,
        );
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">${c.city}责任范围</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${metric("客户单位", live?.customers || 0, "")}${metric("关键人", live?.contacts || 0, "")}</div><div class="section-title">客户单位</div>${
            scopedCustomers()
              .filter(x => customerBelongsToCenter(x, region) && x.province === c.province && x.city === c.city)
              .map(
                (x) =>
                  `<div class="list-row"><div class="avatar">企</div><div class="list-main"><div class="list-title">${x.name}</div><div class="list-sub">${x.group} · ${x.contacts}名关键人</div></div><span class="link" data-customer-region="${x.id}">详情</span></div>`,
              )
              .join("") || '<div class="role-note">暂无客户</div>'
          }</div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${hasOperationPermission("regions.handover") && !pendingCityHandover(c.id) ? `<button class="btn btn-primary" data-action="handover-city" data-id="${c.id}">发起交接</button>` : ""}</div>`,
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
          `<div class="drawer-head"><div class="modal-title">地市责任交接</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">交</div><div><div class="detail-name">${cityNames || handover.title}</div><div class="detail-sub">${handover.code}</div></div><div class="spacer"></div><span class="tag ${statusTone}">${statusName}</span></div><div class="detail-grid"><div class="detail-item"><label>原负责人</label><div>${handover.originalPm}</div></div><div class="detail-item"><label>目标负责人</label><div>${handover.targetPm}</div></div><div class="detail-item"><label>计划生效日期</label><div>${handover.plannedEffectiveDate}</div></div><div class="detail-item"><label>确认人</label><div>${handover.operator}</div></div><div class="detail-item"><label>确认时间</label><div>${handover.createdAt}</div></div><div class="detail-item"><label>实际生效时间</label><div>${handover.effectiveAt || "—"}</div></div><div class="detail-item full"><label>交接原因</label><div>${handover.reason}</div></div>${handover.businessError ? `<div class="detail-item full"><label>失败结果</label><div>${handover.businessError}</div></div>` : ""}</div><div class="section-title">影响快照</div><div class="metrics compact-metrics">${metric("客户单位", impact.customers || 0, "交接确认时")}${metric("关键人", impact.people || 0, "交接确认时", "blue")}${metric("未完成任务", impact.tasks || 0, "交接确认时", "yellow")}${metric("覆盖 KPI 待办", impact.coverageKpis || 0, "交接确认时", "orange")}${impact.opportunities !== undefined ? metric("未落选商机", impact.opportunities, "交接确认时") : ""}</div>${handover.status === "pending_effective" ? '<div class="role-note">计划生效日前仍由原 PM 负责。</div>' : ""}</div><div class="drawer-foot"><button class="btn" data-close>关闭</button></div>`,
        );
      }

      function centerCustomers(region, preview = true) {
        return customers.filter(customer => !customer.archived && customerBelongsToCenter(customer, region, preview));
      }
      function centerForCityOwner(owner) {
        return owner?.regionId ? regionsData.find(region => region.id === owner.regionId) :
          regionsData.find(region => region.type !== "industry" && regionProvinceList(region).includes(owner?.province));
      }
      function customerUsesCityOwner(customer, owner) {
        return customer && !customer.archived && customer.level !== "省公司" &&
          regionForCompany(customer)?.id === centerForCityOwner(owner)?.id &&
          !centerResponsibilityRuleForCustomer(customer) &&
          customerBusinessProvince(customer) === owner.province && customerBusinessCity(customer) === owner.city;
      }
      function centerUnassignedCustomers(region) {
        return centerCustomers(region).filter(customer => !responsibilityReceiverIsValid(customer, region, responsibilityOwnerForCustomer(customer, region)));
      }
      function centerDirectorIsValid(region) {
        return responsibilityReceiverIsValid({ level: "省公司" }, region, region.director);
      }
      function responsibilityConfigurationVersion() {
        return JSON.stringify([regionsData, cityOwners, cityResponsibilityRules]);
      }
      function responsibilityUnlinkCheck(companies, owners = []) {
        const names = new Set(companies.map(customer => customer.name));
        const ids = new Set(companies.map(customer => String(customer.id)));
        const reasons = [];
        if (contacts.some(person => names.has(person.company))) reasons.push("关联关键人");
        const openTasks = tasks.filter(task => !["done", "cancelled", "expired"].includes(task.status));
        if (openTasks.some(task => names.has(task.company) ||
          (task.type === "关键人覆盖 KPI" && coverageTaskCompanies(task).some(customer => ids.has(String(customer.id)))))) reasons.push("未完成待办");
        if (campaigns.some(campaign => campaign.category === "关键人覆盖 KPI" && campaign.endDate >= DEMO_TODAY && coverageCampaignCompanies(campaign).some(customer => ids.has(String(customer.id))))) reasons.push("适用覆盖 KPI");
        if (projects.some(project => !isEcosystemProject(project) && ids.has(String(project.customerId)) && PROJECT_RESPONSIBILITY_TRANSFER_STAGES.has(project.stage))) reasons.push("需交接项目");
        if (opportunities.some(opportunity => !isEcosystemOpportunity(opportunity) && opportunity.stage !== "落选" && ids.has(String(salesOpportunityCustomer(opportunity)?.id)))) reasons.push("需交接商机");
        if (owners.some(owner => pendingCityHandover(owner.id))) reasons.push("未结束地市交接");
        return { ok: !reasons.length, error: reasons.length ? `仍有${reasons.join("、")}，请先完成交接` : "" };
      }
      function provinceUnlinkScope(region, province) {
        return {
          companies: centerCustomers(region).filter(customer => customerBusinessProvince(customer) === province),
          owners: cityOwners.filter(owner => owner.province === province && centerForCityOwner(owner)?.id === region.id),
        };
      }
      function provinceUnlinkCheck(region, province) {
        const scope = provinceUnlinkScope(region, province);
        return responsibilityUnlinkCheck(scope.companies, scope.owners);
      }
      function clearProvinceResponsibilityConfiguration(region, province, remainingProvinces) {
        const scope = provinceUnlinkScope(region, province);
        cityOwners.splice(0, cityOwners.length, ...cityOwners.filter(owner => !scope.owners.includes(owner)));
        cityResponsibilityRules.forEach(rule => {
          const company = rule.dimension === "客户公司" ? customers.find(customer => String(customer.id) === String(rule.value)) : null;
          const clear = (rule.dimension === "集团省份分流" && rule.province === province && geographicCenterForProvince(province)?.id === region.id) ||
            (rule.regionId === region.id && ((company && customerBusinessProvince(company) === province) ||
              (rule.dimension === "集团" && (!remainingProvinces.length || scope.companies.some(customer => customer.group === rule.value)) && !centerCustomers(region).some(customer => customer.group === rule.value && customer.level !== "省公司" && remainingProvinces.includes(customerBusinessProvince(customer))))));
          if (clear) { rule.status = "停用"; rule.updatedAt = recordCreatedAt(); rule.updatedBy = currentUser.name; }
        });
      }
      function cancelCityResponsibility(ownerId, expectedVersion) {
        const owner = cityOwners.find(item => String(item.id) === String(ownerId));
        const region = centerForCityOwner(owner);
        if (!owner?.pm || !canEditCityResponsibilityRules(region)) return { ok: false, error: "无权取消该地市关联" };
        if (expectedVersion !== responsibilityConfigurationVersion()) return { ok: false, error: "责任配置已变化，请刷新后重试" };
        const companies = centerCustomers(region).filter(customer => customerUsesCityOwner(customer, owner));
        const check = responsibilityUnlinkCheck(companies, [owner]);
        if (!check.ok) return check;
        return applyCenterResponsibilityMutation(region, () => { owner.pm = ""; owner.effective = ""; }, "取消地市关联", { emptyUnlinkCustomerIds: companies.map(customer => customer.id), emptyUnlink: true });
      }
      function openCancelCityResponsibility(ownerId) {
        const owner = cityOwners.find(item => String(item.id) === String(ownerId));
        const region = centerForCityOwner(owner);
        if (!owner?.pm || !canEditCityResponsibilityRules(region)) return toast("无权取消该地市关联");
        const check = responsibilityUnlinkCheck(centerCustomers(region).filter(customer => customerUsesCityOwner(customer, owner)), [owner]);
        if (!check.ok) return toast(check.error);
        const expectedVersion = responsibilityConfigurationVersion();
        openModal(`<div class="modal-head"><div class="modal-title">确认取消地市关联</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body">${escapeHtml(owner.province)} · ${escapeHtml(owner.city)} · ${escapeHtml(owner.pm)}<br>无需要交接的事项，取消后地市待分配，无需选择接收人。</div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="confirmCityUnlink">确认取消关联</button></div>`);
        $("#confirmCityUnlink").onclick = () => {
          const result = cancelCityResponsibility(ownerId, expectedVersion);
          if (!result.ok) return toast(result.error);
          closeAllOverlays(); renderPage(); toast("地市关联已取消");
        };
      }
      function applyCenterResponsibilityMutation(region, mutate, reason, { activate = false, allCenters = false, emptyUnlinkCustomerIds = [], emptyUnlink = false } = {}) {
        if (!canEditCityResponsibilityRules(region) || (allCenters && !canManageGroupProvinceRoutes()) || (activate && !hasOperationPermission("regions.edit")))
          return { ok: false, error: "当前账号无权维护该中心" };
        const state = captureResponsibilityMutationState([regionsData, cityOwners, cityResponsibilityRules, customers, contacts, tasks, campaigns, projects, opportunities, employees, accounts, cityResponsibilityChanges]);
        const before = new Map(customers.map(customer => [customer.id, { center: regionForCompany(customer)?.id, owner: customerOwnerName(customer), resolved: responsibilityOwnerForCustomer(customer) }]));
        const projectOwners = new Map(projects.map(project => [project.id, projectCurrentOwner(project)]));
        const projectHistoryCounts = new Map(projects.map(project => [project.id, Array.isArray(project.responsibilityHistory) ? project.responsibilityHistory.length : 0]));
        const effectiveAt = recordCreatedAt();
        try {
          const emptyCustomers = customers.filter(customer => emptyUnlinkCustomerIds.includes(customer.id));
          const emptyCheck = responsibilityUnlinkCheck(emptyCustomers);
          if (emptyUnlink && !emptyCheck.ok) throw new Error(emptyCheck.error);
          mutate();
          if (!emptyUnlink && !centerDirectorIsValid(region)) throw new Error("中心缺少有效总监，请先完善组织主管配置");
          if (region.type === "industry" && region.enabled && regionsData.some(other => other !== region && other.type === "industry" && other.enabled && other.industry === region.industry))
            throw new Error("该行业已有启用的运营中心，不能重复启用");
          const unassigned = centerUnassignedCustomers(region);
          if (activate && unassigned.length)
            throw new Error(`未分配客户：${unassigned.map(customer => customer.name).join("、")}。请先补齐有效接收人`);
          // Pending assignments configure receivers without changing current business responsibility.
          if (!allCenters && region.type === "industry" && !region.enabled) return { ok: true, count: 0 };
          const changed = customers.filter(customer => !customer.archived &&
            (allCenters || before.get(customer.id)?.center === region.id || regionForCompany(customer)?.id === region.id) &&
            (before.get(customer.id)?.center !== regionForCompany(customer)?.id || before.get(customer.id)?.resolved !== responsibilityOwnerForCustomer(customer)));
          const referenceId = nextBusinessCode("RC");
          changed.forEach(customer => {
            const center = regionForCompany(customer), nextOwner = responsibilityOwnerForCustomer(customer, center);
            if (allCenters && (!center || regionConfigurationStatus(center) !== "已配置")) throw new Error(`${customer.name} 的接收中心配置异常`);
            const directUnlink = emptyUnlink && emptyUnlinkCustomerIds.includes(customer.id);
            if (!responsibilityReceiverIsValid(customer, center, nextOwner) && !directUnlink) throw new Error(`${customer.name} 无有效接收人`);
            const relatedProjects = projects.filter(project => !isEcosystemProject(project) && String(project.customerId) === String(customer.id) && PROJECT_RESPONSIBILITY_TRANSFER_STAGES.has(project.stage));
            relatedProjects.forEach(project => {
              if (project.responsibilityHistory != null && !Array.isArray(project.responsibilityHistory)) throw new Error(`项目 ${project.id} 责任历史异常`);
              const previousOwner = projectOwners.get(project.id);
              project.currentOwner = nextOwner;
              project.responsibilityHistory ||= [];
              if (project.responsibilityHistory.length === projectHistoryCounts.get(project.id)) project.responsibilityHistory.push({ type: "customer_responsibility_transfer", fromOwner: previousOwner, toOwner: nextOwner, area: projectArea(project), effectiveAt, operator: currentUser.name, referenceId, referenceType: reason, reason });
            });
            opportunities.filter(opportunity => !isEcosystemOpportunity(opportunity) && opportunity.stage !== "落选" && salesOpportunityCustomer(opportunity)?.id === customer.id).forEach(opportunity => {
              salesCapturePerformance(opportunity);
              const previousOwner = opportunity.owner;
              opportunity.owner = nextOwner;
              opportunity.region = regionScopeName(center);
              opportunity.updatedAt = effectiveAt;
              opportunity.reassignments ||= [];
              opportunity.reassignments.push({ before: previousOwner, after: nextOwner, reason, operator: currentUser.name, time: effectiveAt, sourceResponsibilityChangeCode: referenceId });
            });
            customer.owner = nextOwner;
            customer.pm = customerPmName(customer, nextOwner);
            customer.region = regionScopeName(center);
            contacts.filter(person => person.company === customer.name).forEach(person => { person.pm = customer.pm; });
            tasks.filter(task => task.type !== "关键人覆盖 KPI" && task.company === customer.name && !["done", "cancelled", "expired"].includes(task.status)).forEach(task => {
              task.pm = nextOwner;
              task.region = regionScopeName(center);
              task.executorRole = customerResponsibilityRole(customer);
            });
          });
          regroupCoverageForResponsibilityChange(changed.filter(customer => !emptyUnlinkCustomerIds.includes(customer.id)), effectiveAt);
          cityResponsibilityChanges.unshift({ id: Date.now(), code: referenceId, type: reason, title: `${region.name}：${reason}`, region: regionScopeName(region), operator: currentUser.name, status: "effective", effectiveAt, createdAt: effectiveAt, reason, customerIds: changed.map(customer => customer.id) });
          syncPmEmployeeScopes();
          return { ok: true, count: changed.length };
        } catch (error) {
          restoreResponsibilityMutationState(state);
          return { ok: false, error: error.message || "交接失败，原责任保持不变" };
        }
      }
      function cityResponsibilityRuleRegion(rule) {
        return regionsData.find(region => region.id === rule?.regionId);
      }
      function canEditCityResponsibilityRules(region) {
        if (!region) return false;
        const employee = employees.find(item => item.code === currentUser?.employeeCode || item.name === currentUser?.name);
        if (!employee || employee.status !== "在职" || employee.accountStatus === "停用" || currentUser?.disabled) return false;
        if (currentUser?.fullAccess) return true;
        if (employeeHasRole(employee, "市场副总")) return hasOperationPermission("regions.edit");
        return employeeHasRole(employee, "区域总监") && departmentsManagedBy(employee.code).some(department => department.regionId === region.id && department.status === "启用");
      }
      function centerRuleValueOptions(region, dimension) {
        const eligible = centerCustomers(region).filter(customer => dimension === "客户公司" || customer.level !== "省公司");
        return dimension === "客户公司" ? eligible.map(customer => ({ value: String(customer.id), label: customer.name })) :
          [...new Set(eligible.map(customer => customer.group).filter(Boolean))].map(group => ({ value: group, label: group }));
      }
      function saveCenterResponsibilityRule(region, existing, values) {
        if (!canEditCityResponsibilityRules(region) || (existing && existing.regionId !== region.id)) return { ok: false, error: "无权维护该中心责任分配" };
        if (!["客户公司", "集团"].includes(values.dimension) || !centerRuleValueOptions(region, values.dimension).some(option => option.value === String(values.value)))
          return { ok: false, error: "请选择本中心有效的客户公司或集团" };
        if (!regionPmEmployees(region).some(employee => employee.name === values.pm && employee.accountStatus !== "停用")) return { ok: false, error: "请选择本中心在职且账号有效的 PM" };
        if (cityResponsibilityRules.some(rule => rule !== existing && rule.status === "启用" && rule.regionId === region.id && rule.dimension === values.dimension && String(rule.value) === String(values.value)))
          return { ok: false, error: "已有相同客户或集团的启用分配，请编辑原分配" };
        return applyCenterResponsibilityMutation(region, () => {
          const rule = existing || { id: Math.max(900, ...cityResponsibilityRules.map(item => Number(item.id) || 0)) + 1, regionId: region.id };
          Object.assign(rule, values, { status: "启用", effective: DEMO_TODAY, updatedAt: recordCreatedAt(), updatedBy: currentUser.name });
          if (!existing) cityResponsibilityRules.push(rule);
        }, "客户责任分配变更");
      }
      function openCityResponsibilityRuleForm(ruleId = null) {
        const region = regionsData.find(item => item.id === selectedRegionId);
        if (!canEditCityResponsibilityRules(region)) return toast("当前账号无权维护该中心责任分配");
        const existing = ruleId == null ? null : cityResponsibilityRules.find(item => Number(item.id) === Number(ruleId));
        if (ruleId != null && (!existing || existing.regionId !== region.id)) return toast("无权维护该责任分配");
        const pms = regionPmEmployees(region).filter(employee => employee.accountStatus !== "停用");
        const dimension = existing?.dimension || "客户公司";
        openModal(`<div class="modal-head"><div class="modal-title">${existing ? "编辑" : "新增"}客户 / 集团分配</div><button class="icon-btn close" data-close>×</button></div><form id="cityResponsibilityRuleForm"><div class="modal-body"><div class="role-note">${escapeHtml(region.name)}${region.type === "industry" && !region.enabled ? " · 启用中心后交接客户" : " · 保存后立即交接存量客户"}</div><div class="form-grid"><div class="form-group"><label class="form-label" for="cityRuleDimension">分配对象</label><select class="input" id="cityRuleDimension"><option ${dimension === "客户公司" ? "selected" : ""}>客户公司</option><option ${dimension === "集团" ? "selected" : ""}>集团</option></select></div><div class="form-group"><label class="form-label" for="cityRuleValue">客户 / 集团</label><select class="input" id="cityRuleValue" required></select></div><div class="form-group full"><label class="form-label" for="cityRulePm">负责 PM</label><select class="input" id="cityRulePm" required><option value="">请选择 PM</option>${pms.map(employee => `<option value="${escapeHtml(employee.name)}" ${employee.name === existing?.pm ? "selected" : ""}>${escapeHtml(employee.name)} · ${employee.code}</option>`).join("")}</select></div></div><div class="field-error" id="cityRuleError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认保存</button></div></form>`);
        const refresh = () => { $("#cityRuleValue").innerHTML = '<option value="">请选择</option>' + centerRuleValueOptions(region, $("#cityRuleDimension").value).map(option => `<option value="${escapeHtml(option.value)}" ${String(existing?.value) === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join(""); };
        $("#cityRuleDimension").onchange = refresh; refresh();
        $("#cityResponsibilityRuleForm").onsubmit = event => {
          event.preventDefault();
          const result = saveCenterResponsibilityRule(region, existing, { dimension: $("#cityRuleDimension").value, value: $("#cityRuleValue").value, pm: $("#cityRulePm").value });
          if (!result.ok) return $("#cityRuleError").textContent = result.error;
          closeAllOverlays(); renderPage(); toast("分配已保存" + (result.count ? `，已交接 ${result.count} 家客户` : ""));
        };
      }
      function toggleCityResponsibilityRule(ruleId) {
        const rule = cityResponsibilityRules.find(item => Number(item.id) === Number(ruleId));
        const region = cityResponsibilityRuleRegion(rule);
        if (!rule || !canEditCityResponsibilityRules(region)) return toast("无权维护该责任分配");
        const next = rule.status === "启用" ? "停用" : "启用";
        const expectedVersion = responsibilityConfigurationVersion();
        const actual = () => centerCustomers(region).filter(customer => centerResponsibilityRuleForCustomer(customer, region) === rule);
        const empty = next === "停用" && responsibilityUnlinkCheck(actual()).ok;
        openModal(`<div class="modal-head"><div class="modal-title">确认${next}分配</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body">${empty ? "无需要交接的事项，可直接取消关联，无需选择接收人。" : region.type === "industry" && !region.enabled ? "启用中心后按有效分配交接客户。" : "确认后立即按有效分配交接存量客户。"}</div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="confirmRuleToggle">确认${next}</button></div>`);
        $("#confirmRuleToggle").onclick = () => {
          if (rule.status === next || expectedVersion !== responsibilityConfigurationVersion() || !canEditCityResponsibilityRules(region)) return toast("分配或权限已变化，请刷新后重试");
          if (next === "启用") {
            const result = saveCenterResponsibilityRule(region, rule, rule);
            if (!result.ok) return toast(result.error);
          } else {
            if (empty && !responsibilityUnlinkCheck(actual()).ok) return toast(responsibilityUnlinkCheck(actual()).error);
            const result = applyCenterResponsibilityMutation(region, () => { rule.status = next; }, "客户责任分配变更", { emptyUnlink: empty, emptyUnlinkCustomerIds: empty ? actual().map(customer => customer.id) : [] });
            if (!result.ok) return toast(result.error);
          }
          closeAllOverlays(); renderPage(); toast(`分配已${next}`);
        };
      }
      function openCenterCityAssignment() {
        const region = regionsData.find(item => item.id === selectedRegionId);
        if (!canEditCityResponsibilityRules(region)) return toast("无权维护该中心地市分配");
        const pms = regionPmEmployees(region).filter(employee => employee.accountStatus !== "停用");
        const pairs = regionCityRows(region);
        openModal(`<div class="modal-head"><div class="modal-title">地市 PM 分配</div><button class="icon-btn close" data-close>×</button></div><form id="centerCityForm"><div class="modal-body"><div class="role-note">${escapeHtml(region.name)}${region.enabled ? " · 保存后立即交接存量客户" : " · 启用中心后生效"}</div><div class="form-grid"><div class="form-group full"><label class="form-label" for="centerCity">地市</label><select class="input" id="centerCity">${pairs.map(row => `<option value="${escapeHtml(row.province)}|${escapeHtml(row.city)}">${escapeHtml(row.province)} · ${escapeHtml(row.city)}${row.pm ? ` · ${escapeHtml(row.pm)}` : ""}</option>`).join("")}</select></div><div class="form-group full"><label class="form-label" for="centerCityPm">负责 PM</label><select class="input" id="centerCityPm" required><option value="">请选择 PM</option>${pms.map(employee => `<option>${escapeHtml(employee.name)}</option>`).join("")}</select></div></div><div class="field-error" id="centerCityError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认分配</button></div></form>`);
        $("#centerCityForm").onsubmit = event => {
          event.preventDefault();
          const [province, city] = $("#centerCity").value.split("|"), pm = $("#centerCityPm").value;
          if (!pairs.some(row => row.province === province && row.city === city) || !regionPmEmployees(region).some(employee => employee.name === pm && employee.accountStatus !== "停用")) return $("#centerCityError").textContent = "地市或 PM 已失效，请重新选择";
          const result = applyCenterResponsibilityMutation(region, () => {
            let owner = cityDefaultOwner(province, city, region);
            if (!owner) { owner = { id: Date.now(), regionId: region.id, province, city }; cityOwners.push(owner); }
            Object.assign(owner, { pm, effective: DEMO_TODAY });
          }, "地市责任分配");
          if (!result.ok) return $("#centerCityError").textContent = result.error;
          closeAllOverlays(); renderPage(); toast("地市分配已保存");
        };
      }
      function enableIndustryCenter(regionId) {
        const region = regionsData.find(item => item.id === Number(regionId));
        if (!region || region.type !== "industry" || region.enabled || !hasOperationPermission("regions.edit") || !canEditCityResponsibilityRules(region)) return toast("当前无法启用该中心");
        openModal(`<div class="modal-head"><div class="modal-title">启用${escapeHtml(region.name)}</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><p>启用后立即交接全国${escapeHtml(region.industry)}行业中未按集团省份分流的现有客户。</p><div class="field-error" id="enableCenterError" role="alert"></div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="confirmEnableCenter">确认启用并交接</button></div>`);
        $("#confirmEnableCenter").onclick = () => {
          if (region.enabled) return $("#enableCenterError").textContent = "中心状态已变化，请刷新后重试";
          const result = applyCenterResponsibilityMutation(region, () => { region.enabled = true; region.configuredAt = recordCreatedAt(); }, "行业中心启用", { activate: true });
          if (!result.ok) return $("#enableCenterError").textContent = result.error;
          closeAllOverlays(); renderPage(); toast(`中心已启用，已交接 ${result.count} 家客户`);
        };
      }

      function canManageGroupProvinceRoutes() {
        const employee = employees.find(item => item.code === currentUser?.employeeCode || item.name === currentUser?.name);
        return !!employee && employee.status === "在职" && employee.accountStatus !== "停用" && !currentUser?.disabled &&
          (currentUser.fullAccess || (employeeHasRole(employee, "市场副总") && hasOperationPermission("regions.edit")));
      }
      function saveGroupProvinceRoute(existing, values) {
        if (!canManageGroupProvinceRoutes()) return { ok: false, error: "当前账号无权维护集团按省分流" };
        if (existing && !groupProvinceRoutes().includes(existing)) return { ok: false, error: "分流配置已失效，请刷新后重试" };
        const target = geographicCenterForProvince(values.province);
        if (!customerGroupNames.includes(values.value) || customerOrgArchivedGroup(values.value) ||
            !target || regionConfigurationStatus(target) !== "已配置")
          return { ok: false, error: "请选择正常集团及已配置地理中心的业务责任省份" };
        if (!["启用", "停用"].includes(values.status)) return { ok: false, error: "分流状态无效" };
        if (values.status === "启用" && groupProvinceRoutes().some(rule => rule !== existing && rule.status === "启用" && rule.value === values.value && rule.province === values.province))
          return { ok: false, error: "该集团及省份已有启用分流，请编辑原配置" };
        const scopes = [{ value: values.value, province: values.province }, ...(existing ? [{ value: existing.value, province: existing.province }] : [])];
        return applyCenterResponsibilityMutation(target, () => {
          const rule = existing || { id: Math.max(900, ...cityResponsibilityRules.map(item => Number(item.id) || 0)) + 1, dimension: "集团省份分流" };
          Object.assign(rule, { value: values.value, province: values.province, status: values.status, effective: DEMO_TODAY, updatedAt: recordCreatedAt(), updatedBy: currentUser.name });
          if (!existing) cityResponsibilityRules.push(rule);
          customers.filter(customer => !customer.archived && scopes.some(scope => customer.group === scope.value && customerBusinessProvince(customer) === scope.province)).forEach(customer => {
            const center = regionForCompany(customer);
            if (!center || regionConfigurationStatus(center) !== "已配置" || !responsibilityReceiverIsValid(customer, center, responsibilityOwnerForCustomer(customer, center)))
              throw new Error(`${customer.name} 无有效接收中心或负责人`);
          });
        }, "集团按省分流", { allCenters: true });
      }
      function openGroupProvinceRouteForm(ruleId = null) {
        if (!canManageGroupProvinceRoutes()) return toast("当前账号无权维护集团按省分流");
        const existing = ruleId == null ? null : groupProvinceRoutes().find(rule => rule.id === Number(ruleId));
        if (ruleId != null && !existing) return toast("分流配置不存在");
        const groups = customerGroupNames.filter(group => !customerOrgArchivedGroup(group));
        const provinces = Object.keys(administrativeDivisions).filter(province => geographicCenterForProvince(province));
        openModal(`<div class="modal-head"><div class="modal-title">${existing ? "编辑" : "新增"}集团按省分流</div><button class="icon-btn close" data-close>×</button></div><form id="groupProvinceRouteForm"><div class="modal-body"><div class="role-note">保存后立即交接该集团在所选业务责任省份的全部客户。未分配或交接失败时，全部保持原值。</div><div class="form-grid"><div class="form-group"><label class="form-label" for="routeGroup">集团</label><select class="input" id="routeGroup" required><option value="">请选择集团</option>${groups.map(group => `<option ${group === existing?.value ? "selected" : ""}>${escapeHtml(group)}</option>`).join("")}</select></div><div class="form-group"><label class="form-label" for="routeProvince">业务责任省份</label><select class="input" id="routeProvince" required><option value="">请选择省份</option>${provinces.map(province => `<option ${province === existing?.province ? "selected" : ""}>${escapeHtml(province)}</option>`).join("")}</select></div><div class="form-group full"><label class="form-label">接收区域中心</label><div id="routeTarget">请选择业务责任省份</div></div></div><div class="field-error" id="routeError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认保存并交接</button></div></form>`);
        const refresh = () => { $("#routeTarget").textContent = geographicCenterForProvince($("#routeProvince").value)?.name || "请选择业务责任省份"; };
        $("#routeProvince").onchange = refresh; refresh();
        $("#groupProvinceRouteForm").onsubmit = event => {
          event.preventDefault();
          const result = saveGroupProvinceRoute(existing, { value: $("#routeGroup").value, province: $("#routeProvince").value, status: existing?.status || "启用" });
          if (!result.ok) return $("#routeError").textContent = result.error;
          closeAllOverlays(); renderPage(); toast(`分流已保存，已交接 ${result.count} 家客户`);
        };
      }
      function toggleGroupProvinceRoute(ruleId) {
        const rule = groupProvinceRoutes().find(item => item.id === Number(ruleId));
        if (!rule || !canManageGroupProvinceRoutes()) return toast("无权维护该分流");
        const next = rule.status === "启用" ? "停用" : "启用";
        openModal(`<div class="modal-head"><div class="modal-title">确认${next}集团按省分流</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body">${escapeHtml(rule.value)} · ${escapeHtml(rule.province)}。确认后立即交接存量客户；停用后回归行业中心或地理默认。</div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="confirmRouteToggle">确认${next}并交接</button></div>`);
        $("#confirmRouteToggle").onclick = () => {
          if (rule.status === next) return toast("分流已变化，请刷新后重试");
          const result = saveGroupProvinceRoute(rule, { ...rule, status: next });
          if (!result.ok) return toast(result.error);
          closeAllOverlays(); renderPage(); toast(`分流已${next}，已交接 ${result.count} 家客户`);
        };
      }
