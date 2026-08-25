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

      const cityIdsForApproval = (approval) =>
        (approval?.targetCityIds?.length
          ? approval.targetCityIds
          : approval?.targetCityId
            ? [approval.targetCityId]
            : []
        ).map(Number);

      const pendingCityHandover = (cityId) =>
        approvals.find(
          (approval) =>
            approval.type === "地市交接" &&
            ["pending", "approved_pending_effective", "processing_failed"].includes(
              approval.status,
            ) &&
            cityIdsForApproval(approval).includes(Number(cityId)),
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
        const relatedApprovals = approvals.filter((approval) => {
          if (!["pending", "paused_invalid_handler"].includes(approval.status))
            return false;
          if (cityIdsForApproval(approval).some((id) => cityIds.map(Number).includes(id)))
            return true;
          const contact = approval.transferContactId
            ? contacts.find((person) => person.id === approval.transferContactId)
            : null;
          return (
            companyNames.has(approval.targetCompany) ||
            (contact && companyNames.has(contact.company))
          );
        });
        return {
          customers: companies.length,
          people: people.length,
          tasks: openTasks.filter((task) => task.type !== "关键人覆盖 KPI").length,
          coverageKpis: openTasks.filter((task) => task.type === "关键人覆盖 KPI").length,
          approvals: relatedApprovals.length,
        };
      }

      function cityHandoverRoute(region) {
        if (currentUser.fullAccess)
          return {
            direct: true,
            current: "系统管理员直接调整",
            assignees: [],
            note: "二次确认后直接形成已通过流程，不生成本人审批节点",
          };
        if (isPmCityManagementUser())
          return {
            direct: false,
            current: "区域总监审批",
            assignees: [region?.director].filter(Boolean),
            note: `由${region?.director || "所属区域总监"}审批，目标 PM 不参与审批或接收`,
          };
        if (currentUser.role === "director") {
          const marketVp = employees.find(
            (employee) =>
              employee.status === "在职" && employeeHasRole(employee, "市场副总"),
          );
          return {
            direct: false,
            current: marketVp ? "市场副总审批" : "总裁审批",
            assignees: [marketVp?.name || "刘总"],
            note: marketVp
              ? `由市场副总${marketVp.name}审批，目标 PM 不参与审批或接收`
              : "市场副总岗位缺位，转总裁审批",
          };
        }
        return null;
      }

      function pushCityTransferNotice(approval, owners) {
        const cityNames = owners.map((owner) => owner.city).join("、");
        notificationMessages.unshift({
          id: Date.now(),
          roles: ["pm", "director", "vp"],
          users: [approval.originalPm, approval.targetPm, approval.regionDirector, "王静"].filter(
            Boolean,
          ),
          category: "地市责任",
          title: `${cityNames}责任已交接给${approval.targetPm}`,
          content: `原负责人${approval.originalPm}；${approval.effectiveAt}生效；迁移待办 ${
            (approval.impactSnapshot?.tasks || 0) +
            (approval.impactSnapshot?.coverageKpis || 0)
          } 条。`,
          date: approval.effectiveAt,
          read: false,
        });
      }

      function applyCityResponsibilityTransfer(approval) {
        const cityIds = cityIdsForApproval(approval);
        const owners = cityOwners.filter((owner) => cityIds.includes(Number(owner.id)));
        const region = regionForName(approval.region);
        const targetValid = regionPmEmployees(region).some(
          (employee) => employee.name === approval.targetPm,
        );
        if (
          !owners.length ||
          owners.length !== cityIds.length ||
          !targetValid ||
          owners.some((owner) => owner.pm !== approval.originalPm)
        ) {
          approval.status = "processing_failed";
          approval.businessError =
            "地市当前负责人、目标 PM 任职或区域映射已变化，原责任保持不变";
          return false;
        }
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
          owner.pm = approval.targetPm;
          owner.effective = approval.plannedEffectiveDate || DEMO_TODAY;
          customers
            .filter((company) => companyNames.has(company.name))
            .forEach((company) => {
              company.pm = approval.targetPm;
              if (company.level !== "省公司") company.owner = approval.targetPm;
            });
          contacts
            .filter((person) => companyNames.has(person.company))
            .forEach((person) => (person.pm = approval.targetPm));
          tasks
            .filter(
              (task) =>
                companyNames.has(task.company) &&
                task.pm === approval.originalPm &&
                !["done", "cancelled", "expired"].includes(task.status),
            )
            .forEach((task) => (task.pm = approval.targetPm));
        });
        approval.status = "approved";
        approval.effectiveAt = `${approval.plannedEffectiveDate || DEMO_TODAY} 00:00`;
        approval.updatedAt = approval.effectiveAt;
        approval.businessError = "";
        pushCityTransferNotice(approval, owners);
        normalizeCustomerResponsibilities();
        syncPmEmployeeScopes();
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
        approvals.unshift({
          id: Date.now(),
          code: nextBusinessCode("WF"),
          source: "manual",
          type: "地市分配",
          title: `${owners.map((owner) => owner.city).join("、")}分配给${pm}`,
          applicant: currentUser.name,
          region: regionScopeName(region),
          current: "系统管理员直接调整",
          status: "approved",
          date: recordCreatedAt(),
          reason: remark || "系统管理员完成地市负责人初次配置。",
          targetPm: pm,
          targetCityIds: owners.map((owner) => owner.id),
          originalPm: "未分配",
          plannedEffectiveDate: DEMO_TODAY,
          currentAssignees: [],
          ccUsers: [region.director, pm, "王静"].filter(Boolean),
          handledBy: [currentUser.name],
          expectedApprover: currentUser.name,
          decidedBy: currentUser.name,
          decidedAt: recordCreatedAt(),
          effectiveAt: `${DEMO_TODAY} 00:00`,
          decisionComment: "已完成二次确认，分配直接生效。",
        });
        closeAllOverlays();
        renderPage();
        toast(`已为${pm}分配 ${assigned} 个地市，并生成已通过流程`);
      }

      function openDirectAdjust(cityId) {
        if (!hasOperationPermission("regions.batch_assign"))
          return toast("当前角色无权调整地市负责人");
        const c = cityOwners.find((x) => x.id === cityId);
        if (!c || !c.pm) return toast("该地市当前没有负责人，请使用分配");
        const region = regionsData.find((item) =>
          regionProvinceList(item).includes(c.province),
        );
        const pending = pendingCityHandover(c.id);
        if (pending) return toast("该地市存在交接中的流程，请先处理");
        const pms = regionPmEmployees(region).filter((item) => item.name !== c.pm);
        if (!pms.length) return toast("该区域中心没有其他在职 PM 可接任");
        openModal(
          `<div class="modal-head"><div class="modal-title">直接调整地市负责人</div><button class="icon-btn close" data-close>×</button></div><form id="directAdjustForm"><div class="modal-body"><div class="role-note">${c.province} · <strong>${c.city}</strong> · 当前负责人 ${c.pm}。直接调整立即生效并生成已通过流程记录、通知原任和新任 PM；需要审批留痕或计划生效日期时请改用地市交接。</div><div class="form-group full"><label class="form-label">影响摘要</label><div class="impact-summary"><div class="impact-grid"><div><label>受影响客户</label><strong>${scopedCustomers().filter((x) => x.province === c.province && x.city === c.city).length}</strong></div><div><label>关键人</label><strong>${scopedContacts().filter((x) => x.company && customers.find((cu) => cu.name === x.company && cu.province === c.province && cu.city === c.city)).length}</strong></div><div><label>未完成任务</label><strong>${tasks.filter((t) => t.pm === c.pm && !["done", "cancelled", "expired"].includes(t.status)).length}</strong></div><div><label>覆盖 KPI 待办</label><strong>${campaigns.filter((cp) => cp.category === "关键人覆盖 KPI" && cp.status === "执行中").length}</strong></div><div><label>待审批</label><strong>${approvals.filter((a) => a.status === "pending").length}</strong></div></div></div><div class="list-sub">与交接影响摘要同口径，实时计算</div></div><div class="form-group"><label class="form-label">目标 PM *</label><select class="input" id="daPm" required>${pms.map((item) => `<option value="${item.name}">${item.name} · ${item.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">调整原因 *</label><textarea class="input" id="daReason" minlength="5" maxlength="500" required placeholder="说明直接调整原因"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认调整</button></div></form>`,
        );
        $("#directAdjustForm").onsubmit = (event) => {
          event.preventDefault();
          const targetPm = $("#daPm").value;
          const reason = $("#daReason").value.trim();
          const previousPm = c.pm;
          c.pm = targetPm;
          c.since = DEMO_TODAY;
          approvals.unshift({
            id: Date.now(),
            code: nextBusinessCode("WF"),
            source: "manual",
            type: "地市直接调整",
            title: `${c.city}负责人由${previousPm}调整为${targetPm}`,
            applicant: currentUser.name,
            region: regionScopeName(region),
            current: "直接调整（即时生效）",
            status: "approved",
            date: recordCreatedAt(),
            reason: reason,
            targetPm,
            targetCityIds: [c.id],
            originalPm: previousPm,
            plannedEffectiveDate: DEMO_TODAY,
            currentAssignees: [],
            ccUsers: [region.director, previousPm, targetPm].filter(Boolean),
            handledBy: [currentUser.name],
            expectedApprover: currentUser.name,
            decidedBy: currentUser.name,
            decidedAt: recordCreatedAt(),
            effectiveAt: `${DEMO_TODAY} 00:00`,
            decisionComment: "已完成二次确认，直接调整生效。",
          });
          normalizeCustomerResponsibilities();
          syncPmEmployeeScopes();
          closeAllOverlays();
          renderPage();
          toast(`${c.city}负责人已调整为${targetPm}，并生成已通过流程记录`);
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
          `<div class="modal-head"><div class="modal-title">地市分配</div><button class="icon-btn close" data-close>×</button></div><form id="cityForm"><div class="modal-body"><div class="role-note">区域：${region.name} · 系统管理员（公司全局）或本区域区域总监可操作。省份多选，城市选项实时联动。保存后立即生效。</div><div class="form-grid"><div class="form-group full"><label class="form-label">省份 * <span class="panel-sub">多选，城市选项实时联动</span></label><div class="choice-grid" id="cityAssignProvinceGrid">${regionProvinceList(region).map((province) => `<label class="choice-item"><input type="checkbox" data-assign-province value="${province}" ${province === defaultProvince ? "checked" : ""}><span>${province}</span></label>`).join("")}</div></div><div class="form-group full"><label class="form-label">未分配城市 *</label><div class="choice-grid" id="cityChoices"></div><div class="list-sub">只展示所选省份下尚未配置负责人的城市</div></div><div class="form-group"><label class="form-label">目标 PM *</label><select class="input" id="cityPm">${pms.map((employee) => `<option ${employee.name === pmName ? "selected" : ""} value="${employee.name}">${employee.name} · ${employee.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">生效时间</label><input class="input" value="立即生效" disabled></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="cityAssignRemark" maxlength="500" placeholder="选填，最多 500 字"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit" ${available.length ? "" : "disabled"}>下一步：二次确认</button></div></form>`,
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
          route,
        } = payload;
        const approval = {
          id: Date.now(),
          code: nextBusinessCode("WF"),
          source: "manual",
          type: "地市交接",
          title: `${owners.map((owner) => owner.city).join("、")}由${owners[0].pm}转交${targetPm}`,
          applicant: currentUser.name,
          region: regionScopeName(region),
          regionDirector: region.director,
          current: route.current,
          status: route.direct ? "approved" : "pending",
          date: recordCreatedAt(),
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
          currentAssignees: [...route.assignees],
          expectedApprover: route.assignees.join("、") || currentUser.name,
          ccUsers: [owners[0].pm, targetPm, region.director, "王静", "刘总"].filter(
            (name, index, all) => name && name !== currentUser.name && all.indexOf(name) === index,
          ),
          handledBy: route.direct ? [currentUser.name] : [],
        };
        if (route.direct) {
          approval.decidedBy = currentUser.name;
          approval.decidedAt = recordCreatedAt();
          approval.decisionComment = "系统管理员已完成二次确认，直接执行地市责任交接。";
          if (plannedEffectiveDate > DEMO_TODAY) {
            approval.status = "approved_pending_effective";
            approval.updatedAt = approval.decidedAt;
          } else {
            applyCityResponsibilityTransfer(approval);
          }
        }
        approvals.unshift(approval);
        closeAllOverlays();
        renderPage();
        toast(
          route.direct
            ? approval.status === "approved_pending_effective"
              ? `已确认交接，将于 ${plannedEffectiveDate} 自动生效`
              : approval.status === "approved"
                ? "地市责任交接已生效，目标 PM 已收到通知"
                : "交接业务处理失败，原责任保持不变"
            : `交接流程已发起，等待${route.current}；目标 PM 仅在生效后收到通知`,
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
        const route = cityHandoverRoute(region);
        if (!route) return toast("当前角色不在地市交接可发起人范围内");
        const existing = pendingCityHandover(c.id);
        if (existing)
          return toast(`该地市已有未结束交接流程 ${existing.code}，不能重复发起`);
        const pms = regionPmEmployees(region).filter(
          (employee) => employee.name !== c.pm,
        );
        const sameOwnerCities = cityOwners.filter(
          (owner) =>
            owner.pm === c.pm && regionProvinceList(region).includes(owner.province),
        );
        if (!pms.length) return toast("该区域暂无其他在职 PM 可接收交接");
        openModal(
          `<div class="modal-head"><div class="modal-title">发起地市责任交接</div><button class="icon-btn close" data-close>×</button></div><form id="cityHandover"><div class="modal-body"><div class="role-note">原 PM：${c.pm} · ${route.note}<br>只能同时选择同一原 PM 的 1-50 个地市；审批通过前原 PM 继续负责。</div><div class="form-grid"><div class="form-group full"><label class="form-label">交接地市 *</label><div class="choice-grid" id="handoverCityChoices">${sameOwnerCities.map((owner) => { const pending = pendingCityHandover(owner.id); return `<label class="choice-item ${pending ? "is-disabled" : ""}"><input class="assignment-check" type="checkbox" value="${owner.id}" ${owner.id === c.id ? "checked" : ""} ${pending ? "disabled" : ""}><span>${owner.province} · ${owner.city}${pending ? ` · 交接中（${pending.code}）` : ""}</span></label>`; }).join("")}</div></div><div class="form-group"><label class="form-label">目标 PM *</label><select class="input" id="targetCityPm">${pms.map((employee) => `<option value="${employee.name}">${employee.name} · ${employee.code}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">计划生效日期 *</label><input class="input" id="cityHandoverDate" type="date" min="${DEMO_TODAY}" max="${addDays(DEMO_TODAY, 90)}" value="${DEMO_TODAY}" required></div><div class="form-group full"><label class="form-label">影响摘要</label><div class="detail-grid" id="cityHandoverImpact"></div><div class="list-sub">提交和生效时都会重新校验负责人、目标 PM、区域映射和对象版本。</div></div><div class="form-group full"><label class="form-label">交接原因 * <span class="panel-sub">5-500 字</span></label><textarea class="input" id="cityReason" minlength="5" maxlength="500" required placeholder="说明交接原因"></textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">${route.direct ? "下一步：二次确认" : "提交交接审批"}</button></div></form>`,
        );
        const selectedOwnerIds = () =>
          [...document.querySelectorAll("#handoverCityChoices input:checked")].map(
            (input) => Number(input.value),
          );
        const refreshImpact = () => {
          const selected = selectedOwnerIds();
          const impact = cityHandoverImpact(selected);
          $("#cityHandoverImpact").innerHTML = `<div class="detail-item"><label>客户单位</label><div>${impact.customers} 家</div></div><div class="detail-item"><label>关键人</label><div>${impact.people} 人</div></div><div class="detail-item"><label>未完成任务</label><div>${impact.tasks} 条</div></div><div class="detail-item"><label>覆盖 KPI 待办</label><div>${impact.coverageKpis} 条</div></div><div class="detail-item"><label>待审批流程</label><div>${impact.approvals} 条</div></div><div class="detail-item"><label>已选地市</label><div>${selected.length} 个</div></div>`;
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
            return toast(`所选地市已有未结束流程 ${conflicting.code}`);
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
            route,
          };
          if (route.direct) {
            openModal(
              `<div class="modal-head"><div class="modal-title">确认直接交接</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note danger-note"><strong>请确认直接执行</strong><br>地市：${owners.map((owner) => owner.city).join("、")}<br>${c.pm} → ${targetPm}<br>计划生效：${plannedEffectiveDate}<br>确认后形成已通过流程，不生成 admin 本人审批节点。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="button" id="confirmDirectCityHandover">确认直接交接</button></div>`,
            );
            $("#confirmDirectCityHandover").onclick = () => commitCityHandover(payload);
          } else {
            commitCityHandover(payload);
          }
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
          }</div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${hasOperationPermission("regions.handover") && !pendingCityHandover(c.id) ? `<button class="btn btn-primary" data-action="handover-city" data-id="${c.id}">发起交接</button>` : pendingCityHandover(c.id) ? `<button class="btn" data-action="approval-detail" data-id="${pendingCityHandover(c.id).id}">查看交接流程</button>` : ""}</div>`,
        );
      }
