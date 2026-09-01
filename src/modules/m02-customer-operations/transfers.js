      function openTransfer(id) {
        const person = contacts.find((item) => item.id === id);
        if (!person || !scopedContacts().some((item) => item.id === person.id))
          return toast("无权操作该关键人");
        if (!canTransferContact(person))
          return toast("当前角色无权发起关键人调岗");
        const sourceCompany = customers.find(
          (item) => item.name === person.company,
        );
        const selectable = scopedCustomers().filter(
          (company) => !company.archived && company.name !== person.company,
        );
        openModal(
          `<div class="modal-head"><div class="modal-title">发起关键人调岗</div><button class="icon-btn close" data-close>×</button></div><form id="transferForm"><div class="modal-body"><div class="role-note"><strong>${person.name}</strong> 当前任职：${person.company} / ${person.department} / ${person.positionName} / ${person.level}</div><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>变更类型</label><select class="input" id="tfChangeMode"><option value="same">同单位任职变更</option><option value="cross" selected>跨单位调岗</option></select></div><div class="form-group" id="tfLocateModeGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标单位定位方式</label><select class="input" id="tfLocateMode"><option value="select">权限内选择</option><option value="exact" ${currentUser.role === "pm" ? "selected" : ""}>精确信息查找</option></select></div><div class="form-group full" id="tfSelectCompanyGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标客户公司</label><select class="input" id="tfCompany"><option value="">请选择目标客户公司</option>${selectable.map((company) => `<option value="${company.name}">${company.name} · ${company.level} · ${adminArea(company)}</option>`).join("")}</select></div><div class="form-group full" id="tfExactCompanyGroup"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标公司完整名称</label><input class="input" id="tfExactName" minlength="2" maxlength="100"></div><div class="form-group"><label class="form-label">统一社会信用代码</label><input class="input" id="tfCreditCode" maxlength="18"></div><div class="form-group"><label class="form-label">所属集团</label><select class="input" id="tfExactGroup"><option value="">未填信用代码时请选择</option>${customerGroupNames.map((group) => `<option>${group}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">完整区划</label><input class="input" id="tfExactArea" maxlength="100" placeholder="例如：江苏省 / 南京市"></div></div><div class="list-sub">Demo 使用预置客户档案精确匹配，不返回无权客户候选。</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新客户部门</label><select class="input" id="tfDepartment"><option value="">请先选择目标公司</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新关键人岗位</label><select class="input" id="tfStandardPosition"><option value="">请先选择目标部门</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新职级</label><select class="input" id="tfLevel">${contactLevelOptions(person.level)}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新任职生效日</label><input class="input" id="tfEffectiveDate" type="date" min="${DEMO_TODAY}" value="${DEMO_TODAY}" required></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>调岗原因</label><textarea class="input" id="tfReason" minlength="5" maxlength="500" required>客户本人确认任职发生变化，申请按最新信息调整。</textarea></div><div class="form-group full"><label class="form-label">影响摘要</label><div id="transferImpact" class="impact-summary"></div></div></div><div class="role-note" id="transferFlowNote"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交调岗审批</button></div></form>`,
        );
        const resolveTarget = () => {
          if ($("#tfChangeMode").value === "same") return sourceCompany;
          if ($("#tfLocateMode").value === "select")
            return customers.find(
              (company) => company.name === $("#tfCompany").value,
            );
          const exactName = $("#tfExactName").value.trim();
          const creditCode = $("#tfCreditCode").value.trim().toUpperCase();
          const exactGroup = $("#tfExactGroup").value;
          const exactArea = $("#tfExactArea").value.replace(
            /[省市区县\s/]/g,
            "",
          );
          return customers.find((company) => {
            if (company.archived || company.name !== exactName) return false;
            if (creditCode) return company.creditCode === creditCode;
            return (
              company.group === exactGroup &&
              adminArea(company).replace(/[省市区县\s/]/g, "") === exactArea
            );
          });
        };
        const refreshTransfer = (source = "initial") => {
          const same = $("#tfChangeMode").value === "same";
          $("#tfLocateModeGroup").classList.toggle("hidden", same);
          const locateMode = same ? "same" : $("#tfLocateMode").value;
          $("#tfSelectCompanyGroup").classList.toggle(
            "hidden",
            locateMode !== "select",
          );
          $("#tfExactCompanyGroup").classList.toggle(
            "hidden",
            locateMode !== "exact",
          );
          const target = resolveTarget();
          const departments = target
            ? customerDepartmentsForCompany(target.name)
            : [];
          const desiredDepartment =
            ["company", "exact"].includes(source)
              ? ""
              : $("#tfDepartment").value ||
                String(
                  departments.find(
                    (item) => same && item.name === person.department,
                  )?.id || "",
                );
          $("#tfDepartment").innerHTML =
            '<option value="">请选择客户部门</option>' +
            departments
              .map(
                (item) =>
                  `<option value="${item.id}" ${String(item.id) === desiredDepartment ? "selected" : ""}>${customerDepartmentPath(item)}</option>`,
              )
              .join("");
          const positions = contactPositionsForDepartment(
            $("#tfDepartment").value,
          );
          const desiredPosition =
            source === "department"
              ? ""
              : $("#tfStandardPosition").value ||
                (same ? person.positionId : "");
          $("#tfStandardPosition").innerHTML =
            '<option value="">请选择关键人岗位</option>' +
            positions
              .map(
                (item) =>
                  `<option value="${item.id}" ${item.id === desiredPosition ? "selected" : ""}>${item.name} · ${item.code}</option>`,
              )
              .join("");
          const targetDepartment = customerDepartments.find(
            (item) => String(item.id) === $("#tfDepartment").value,
          );
          const targetPosition = contactPositionCatalog.find(
            (item) => item.id === $("#tfStandardPosition").value,
          );
          const unfinished = tasks.filter(
            (task) =>
              task.person === person.name &&
              !["done", "cancelled"].includes(task.status),
          );
          $("#transferImpact").innerHTML = `<div class="impact-grid"><div><label>责任变化</label><strong>${customerOwnerName(sourceCompany)} → ${target ? customerOwnerName(target) : "待匹配"}</strong></div><div><label>任职变化</label><strong>${person.department} / ${person.positionName} → ${targetDepartment?.name || "待选择"} / ${targetPosition?.name || "待选择"}</strong></div><div><label>未结束任务</label><strong>${unfinished.length} 条</strong></div><div><label>覆盖影响</label><strong>部门 / 岗位覆盖重新计算</strong></div></div>`;
          if (!target)
            $("#transferFlowNote").textContent =
              locateMode === "exact"
                ? "请完成目标公司精确匹配后再提交。"
                : "请选择目标客户公司。";
          else if (same)
            $("#transferFlowNote").textContent =
              target.level === "省公司"
                ? "同一省公司任职变更由市场副总审批。"
                : "同一市/区县公司任职变更由所属区域总监审批。";
          else if (target.level === "省公司")
            $("#transferFlowNote").textContent =
              `调至省公司，由目标区域总监 ${customerOwnerName(target)} 审批。`;
          else
            $("#transferFlowNote").textContent =
              `先由目标 PM ${customerOwnerName(target)} 接收，再由目标区域总监审批。`;
        };
        ["#tfChangeMode", "#tfLocateMode", "#tfCompany", "#tfExactGroup"].forEach(
          (selector) => {
            if ($(selector))
              $(selector).onchange = () => refreshTransfer("company");
          },
        );
        $("#tfDepartment").onchange = () => refreshTransfer("department");
        $("#tfStandardPosition").onchange = () => refreshTransfer();
        ["#tfExactName", "#tfCreditCode", "#tfExactArea"].forEach((selector) => {
          if ($(selector))
            $(selector).oninput = () => refreshTransfer("exact");
        });
        if (currentUser.role === "pm") $("#tfLocateMode").value = "exact";
        refreshTransfer();

        $("#transferForm").onsubmit = (event) => {
          event.preventDefault();
          const same = $("#tfChangeMode").value === "same";
          const target = resolveTarget();
          if (!target)
            return toast("未精确匹配到有效目标公司，请核对名称、信用代码或集团与区划");
          if (!same && target.name === person.company)
            return toast("跨单位调岗的目标公司不能等于当前公司");
          const department = customerDepartments.find(
            (item) =>
              String(item.id) === $("#tfDepartment").value &&
              item.company === target.name &&
              !item.archived,
          );
          const position = contactPositionCatalog.find(
            (item) =>
              item.id === $("#tfStandardPosition").value &&
              item.departmentId === department?.id &&
              item.status === "正常",
          );
          if (!department || !position)
            return toast("请选择目标公司直属路径下的客户部门和标准岗位");
          if (
            same &&
            department.name === person.department &&
            position.id === person.positionId
          )
            return toast("新客户部门或新关键人岗位至少一项不同");
          const sameCompany = target.name === person.company;
          const currentAssignees = sameCompany
            ? [
                target.level === "省公司"
                  ? "王静"
                  : regionDirectorForCustomer(target),
              ]
            : target.level === "省公司"
              ? [regionDirectorForCustomer(target)]
              : [customerOwnerName(target)];
          approvals.unshift({
            id: Date.now(),
            code: nextBusinessCode("WF"),
            source: "manual",
            type: "关键人调岗",
            title: sameCompany
              ? `${person.name}同单位任职变更`
              : `${person.name}调任${target.name}`,
            applicant: currentUser.name,
            region: customerRegionScope(target),
            current: sameCompany
              ? target.level === "省公司"
                ? "市场副总审批"
                : "区域总监审批"
              : target.level === "省公司"
                ? "目标区域总监审批"
                : "目标PM接收",
            status: "pending",
            date: recordCreatedAt(),
            reason: $("#tfReason").value.trim(),
            transferContactId: person.id,
            changeMode: same ? "同单位任职变更" : "跨单位调岗",
            targetCompany: target.name,
            targetDepartment: department.name,
            targetTitle: position.name,
            targetLevel: $("#tfLevel").value,
            targetPositionSource: "standard",
            targetPositionId: position.id,
            targetPositionName: position.name,
            effectiveDate: $("#tfEffectiveDate").value,
            targetPm:
              target.level === "省公司" || sameCompany
                ? ""
                : customerOwnerName(target),
            targetOwner: customerOwnerName(target),
            currentAssignees,
            expectedApprover: currentAssignees.join("、"),
            ccUsers: [
              regionDirectorForCustomer(sourceCompany),
              "王静",
              "刘总",
            ].filter(
              (name, index, list) =>
                name &&
                list.indexOf(name) === index &&
                !currentAssignees.includes(name),
            ),
            handledBy: [],
            impactSnapshot: $("#transferImpact").textContent.trim(),
          });
          closeOverlay();
          renderPage();
          toast(
            sameCompany
              ? "同单位任职变更已提交上级审批"
              : target.level === "省公司"
                ? `调岗流程已发起，目标区域总监 ${customerOwnerName(target)} 收到审批待办`
                : `调岗流程已发起，目标 PM ${customerOwnerName(target)} 收到接收待办`,
          );
        };
      }
