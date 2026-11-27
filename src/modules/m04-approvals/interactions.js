      function approvalPlannedApprover(approval) {
        const targetRegion = approval.targetCompany
          ? customers.find((company) => company.name === approval.targetCompany)?.region
          : "";
        return regionDirectorName(targetRegion || approval.region);
      }

      function approvalNodeHtml(node) {
        const statusMeta = {
          done: ["green", "已完成"],
          current: ["yellow", "正在审批"],
          upcoming: ["", "待审批"],
          rejected: ["red", "已驳回"],
          invalid: ["red", "处理人失效"],
        }[node.state];
        const actualOperator = ["待处理", "—", "无法继续处理"].includes(node.actualOperator) ? "" : node.actualOperator;
        const operator = node.operator || actualOperator || node.expectedOperator || "—";
        const hasTime = node.time && !["待处理", "未到达", "资格校验时发现", "—"].includes(node.time);
        const hasOpinion = node.opinion && !["待审批人填写", "流程已在前置环节结束", "—"].includes(node.opinion);
        return `<div class="timeline-item is-${node.state}"><div class="approval-node-head"><div class="timeline-title">${escapeHtml(node.title)}</div><span class="tag ${statusMeta[0]}">${statusMeta[1]}</span></div><dl class="approval-node-meta"><div><dt>处理人</dt><dd>${escapeHtml(operator)}</dd></div>${hasTime ? `<div><dt>处理时间</dt><dd>${escapeHtml(node.time)}</dd></div>` : ""}${hasOpinion ? `<div><dt>${escapeHtml(node.opinionLabel || "审批意见")}</dt><dd>${escapeHtml(node.opinion)}</dd></div>` : ""}</dl></div>`;
      }

      function approvalDetailHandler(approval) {
        const names = approvalCurrentAssignees(approval).filter((name) => name && !name.startsWith("按"));
        if (names.length) return names.join("、");
        if (approval.status === "pending")
          return (approval.flowNodes || []).filter((node) => node.state === "current").map((node) => node.expectedOperator).filter(Boolean).join("、") || "—";
        return approval.decidedBy || approval.rejectedBy || approval.withdrawnBy ||
          [...(approval.flowNodes || [])].reverse().find((node) => node.actualOperator)?.actualOperator || "—";
      }

      function approvalTimelineHtml(approval) {
        if (approval.flowNodes?.length)
          return `<div class="timeline approval-timeline">${approval.flowNodes.map(approvalNodeHtml).join("")}</div>`;
        const progressSteps = approvalProgressSteps(approval);
        const nodes = [];
        const hasReception = approvalHasReception(approval);
        if (hasReception) {
          const receptionCurrent =
            approval.status === "pending" && approval.current === "目标PM接收";
          nodes.push({
            title: "目标 PM 接收",
            state:
              progressSteps.find((step) => step.title === "目标 PM 接收")
                ?.state || "upcoming",
            expectedOperator: approval.targetPm || approvalCurrentAssignees(approval)[0] || "待确定",
            actualOperator: approval.acceptedBy || approval.rejectedBy || (receptionCurrent ? "待处理" : "—"),
            time: approval.acceptedAt || approval.rejectedAt || (receptionCurrent ? "待处理" : "未到达"),
            opinion: approval.acceptedBy
              ? approval.acceptComment || "确认接收，流程转目标区域总监审批。"
              : approval.rejectedBy
                ? approval.decisionComment || "已拒绝接收。"
                : receptionCurrent
                  ? "待审批人填写"
                  : "—",
          });
        }
        (approval.collaborationNodes || []).forEach((node) => {
          const nodeState = collaborationNodeState(node);
          node.members.forEach((member) => {
            const memberState =
              member.state === "done"
                ? "done"
                : member.state === "rejected"
                  ? "rejected"
                  : nodeState === "upcoming"
                    ? "upcoming"
                    : "current";
            nodes.push({
              title: `${node.title} · ${member.name}`,
              state: memberState,
              expectedOperator: member.name,
              actualOperator:
                memberState === "done" || memberState === "rejected"
                  ? member.actualOperator || member.name
                  : memberState === "current"
                    ? "待处理"
                    : "—",
              time:
                member.time ||
                (memberState === "current" ? "待处理" : "未到达"),
              opinion:
                member.opinion ||
                (memberState === "current" ? "待审批人填写" : "—"),
            });
          });
        });
        const decisionInvalid = approval.status === "paused_invalid_handler";
        const decisionDone = !decisionInvalid && Boolean(
          approval.decidedBy ||
            (!hasReception &&
              !approval.collaborationNodes?.length &&
              [
                "approved",
                "approved_pending_effective",
                "rejected",
                "processing_failed",
                "withdrawn",
              ].includes(
                approval.status,
              )),
        );
        const decisionCurrent =
          !decisionInvalid &&
          approval.status === "pending" &&
          approval.current !== "目标PM接收" &&
          !activeApprovalCollaborationNode(approval);
        const decisionRole = approval.decidedBy
          ? employees.find((employee) => employee.name === approval.decidedBy)?.role
          : "区域总监";
        const expectedDecisionOperator = approval.expectedApprover ||
          (decisionRole === "总裁" ? approval.decidedBy || "刘总" : approvalPlannedApprover(approval));
        nodes.push({
          title: approvalFinalNodeTitle(approval),
          state: progressSteps.at(-1).state,
          expectedOperator: decisionInvalid
            ? approval.invalidHandler || approval.expectedApprover || "原处理人"
            : decisionCurrent
            ? approvalCurrentAssignees(approval).join("、") || expectedDecisionOperator
            : expectedDecisionOperator,
          actualOperator: decisionInvalid
            ? "无法继续处理"
            : approval.decidedBy || (decisionCurrent ? "待处理" : "—"),
          time: decisionInvalid
            ? approval.invalidatedAt || "资格校验时发现"
            : approval.decidedAt || approval.rejectedAt || (decisionCurrent ? "待处理" : "未到达"),
          opinion: decisionInvalid
            ? approval.invalidReason || "处理人资格失效，流程已暂停。"
            : decisionDone
            ? approval.decisionComment || (approval.status === "approved" ? "同意，按申请内容执行。" : "已驳回。")
            : decisionCurrent
              ? "待审批人填写"
              : approval.status === "rejected"
                ? "流程已在前置环节结束"
                : "—",
        });
        return `<div class="timeline approval-timeline">${nodes.map(approvalNodeHtml).join("")}</div>`;
      }

      function approvalCurrentEmployee() {
        return employees.find((employee) => employee.name === currentUser?.name);
      }

      function approvalCurrentBinding() {
        const employee = approvalCurrentEmployee();
        return employee ? wecomBindings.find((binding) => binding.employeeCode === employee.code) : null;
      }

      function getApprovalTemplates() {
        const activeContacts = contacts.filter((item) => contactIsActive(item));
        const activeTasks = tasks.filter((item) => !["done", "cancelled"].includes(item.status));
        const activeProjects = projects.filter((item) => ["进行中", "已交付"].includes(item.stage));
        const ownCities = typeof cityOwners !== "undefined"
          ? cityOwners.filter((item) => item.pm === currentUser?.name && !pendingCityHandover(item.id))
          : [];
        const pms = employees.filter((item) => item.role === "PM" && item.status === "在职");
        const people = employees.filter((item) => item.status === "在职" && item.role !== "系统管理员");
        return [
          {
            key: "project-expense",
            label: "项目费用申请",
            approver: "刘庆俊",
            ccUsers: ["陈少安"],
            fields: [
              { key: "projectId", label: "关联项目", type: "select", required: true, options: projects.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` })) },
              { key: "expenseType", label: "费用类型", type: "select", required: true, options: ["差旅费", "住宿费", "交通费", "茶歇/物料", "其他"].map((value) => ({ value, label: value })) },
              { key: "amount", label: "申请金额（元）", type: "number", required: true, min: "0", step: "0.01" },
              { key: "reason", label: "费用说明", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "invoice",
            label: "开票申请",
            approver: "刘庆俊",
            ccUsers: ["陈少安"],
            fields: [
              { key: "projectId", label: "关联项目", type: "select", required: true, options: projects.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` })) },
              { key: "customerId", label: "客户公司", type: "select", required: true, options: customers.map((item) => ({ value: String(item.id), label: item.name })) },
              { key: "amount", label: "开票金额（元）", type: "number", required: true, min: "0", step: "0.01" },
              { key: "reason", label: "开票说明", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "payment",
            label: "付款申请",
            approver: "刘庆俊",
            ccUsers: ["陈少安"],
            fields: [
              { key: "projectId", label: "关联项目", type: "select", required: true, options: projects.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` })) },
              { key: "payee", label: "收款方", type: "text", required: true, maxLength: 100 },
              { key: "amount", label: "付款金额（元）", type: "number", required: true, min: "0", step: "0.01" },
              { key: "reason", label: "付款说明", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "contact-disable",
            label: "停用关键人",
            approver: "刘庆俊",
            fields: [
              { key: "contactId", label: "关键人", type: "select", required: true, options: activeContacts.map((item) => ({ value: item.id, label: `${item.name} · ${item.company}` })) },
              { key: "reason", label: "停用原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "maintenance-postpone",
            label: "维系任务延期",
            approver: "刘庆俊",
            fields: [
              { key: "taskId", label: "维系任务", type: "select", required: true, options: activeTasks.map((item) => ({ value: item.id, label: `${item.executionCode || `#${item.id}`} · ${item.title}` })) },
              { key: "due", label: "新截止日期", type: "date", required: true },
              { key: "reason", label: "延期原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "maintenance-pause",
            label: "维系任务暂停",
            approver: "刘庆俊",
            fields: [
              { key: "taskId", label: "维系任务", type: "select", required: true, options: activeTasks.map((item) => ({ value: item.id, label: `${item.executionCode || `#${item.id}`} · ${item.title}` })) },
              { key: "resumeDate", label: "暂停至", type: "date", required: true },
              { key: "reason", label: "暂停原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "maintenance-cancel",
            label: "维系任务取消",
            approver: "刘庆俊",
            fields: [
              { key: "taskId", label: "维系任务", type: "select", required: true, options: activeTasks.map((item) => ({ value: item.id, label: `${item.executionCode || `#${item.id}`} · ${item.title}` })) },
              { key: "reason", label: "取消原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "project-terminate",
            label: "中止已开始项目",
            approver: "刘庆俊",
            fields: [
              { key: "projectId", label: "项目", type: "select", required: true, options: activeProjects.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` })) },
              { key: "settlement", label: "是否涉及金额结算", type: "select", required: true, options: ["是", "否"].map((value) => ({ value, label: value })) },
              { key: "settlementAmount", label: "应结算金额（万元）", type: "number", min: "0", step: "0.000001" },
              { key: "reason", label: "中止原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "city-handover",
            label: "地市责任交接",
            // Mock template response, matching the existing city-handover fixture;
            // the platform does not derive or let applicants select approvers.
            approver: "赵磊",
            fields: [
              { key: "cityIds", label: "交接地市", type: "select", multiple: true, required: true, options: ownCities.map((item) => ({ value: item.id, label: `${item.province} · ${item.city}` })) },
              { key: "targetPm", label: "目标 PM", type: "select", required: true, options: [] },
              { key: "plannedEffectiveDate", label: "计划生效日期", type: "date", required: true },
              { key: "reason", label: "交接原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
          {
            key: "sales-target-adjustment",
            label: "销售指标调整",
            approver: "按企微模板",
            fields: [
              { key: "adjustmentScope", label: "调整范围", type: "select", required: true, options: ["区域年度", "区域季度", "区域月度", "PM个人季度", "PM个人月度", "区域总监个人季度", "区域总监个人月度"].map((value) => ({ value, label: value })) },
              { key: "targetEmployee", label: "调整对象", type: "select", required: true, options: people.filter((item) => ["PM", "区域总监"].includes(item.role)).map((item) => ({ value: item.name, label: `${item.name} · ${item.role}` })) },
              { key: "reason", label: "调整原因", type: "textarea", required: true, minLength: 5, maxLength: 500 },
            ],
          },
        ];
      }

      function submitBusinessApproval({ templateKey, title, formData, reason, targetObject = "", targetKind = "", targetId = null, extra = {} }) {
        if (templateKey === "city-handover" && !extra.targetCityIds) {
          const values = Array.isArray(formData.cityIds) ? formData.cityIds : String(formData.cityIds || "").split(",");
          const ids = [...new Set(values.filter(Boolean).map(Number))];
          const owners = ids.map((id) => cityOwners.find((owner) => Number(owner.id) === id));
          if (!owners.length || owners.some((owner) => !owner)) return toast("请选择有效的交接地市");
          return commitCityHandover({
            region: centerForCityOwner(owners[0]), owners, targetPm: formData.targetPm,
            plannedEffectiveDate: formData.plannedEffectiveDate, reason,
            impactSnapshot: cityHandoverImpact(ids),
          });
        }
        const employee = approvalCurrentEmployee();
        const binding = approvalCurrentBinding();
        if (!employee || !binding) return toast("当前员工尚未绑定企业微信，请先完成绑定");
        const template = getApprovalTemplates().find((item) => item.key === templateKey);
        if (!template) return toast("审批事项暂不可用");
        const now = recordCreatedAt();
        const id = Math.max(0, ...approvals.map((item) => Number(item.id) || 0)) + 1;
        approvals.unshift({
          id,
          code: `WECOM-${now.slice(0, 10).replaceAll("-", "")}-${String(id).padStart(3, "0")}`,
          type: template.label,
          templateKey,
          formData,
          title: title || `${template.label} · ${targetObject || "待处理事项"}`,
          applicant: employee.name,
          date: now,
          region: currentUser.region || employeeDepartmentNames(employee).join("、"),
          status: "pending",
          current: template.approver === "按企微模板" ? "按企微模板路由" : "区域总监审批",
          currentAssignees: [template.approver],
          expectedApprover: template.approver,
          ccUsers: template.ccUsers || [],
          targetObject,
          targetKind,
          targetId,
          reason: reason || title || template.label,
          updatedAt: now,
          ...extra,
        });
        closeAllOverlays();
        approvalView = "mine";
        currentPage = "approvals";
        window.history.replaceState(null, "", "#approvals");
        renderNav();
        renderPage();
        toast("已提交企业微信审批，业务状态将在审批通过后生效");
        return true;
      }

      function applyApprovedCityHandover(approval, businessDate = DEMO_TODAY) {
        if (approval.effectiveAt) { approval.status = "approved"; return true; }
        if (approval.plannedEffectiveDate > businessDate) {
          approval.status = "approved_pending_effective";
          return true;
        }
        const applied = applyCityResponsibilityTransfer(approval);
        if (applied) approval.status = "approved";
        return applied;
      }

      function syncWecomCityHandoverResult({ code, status, operator, time, comment = "" }) {
        const approval = approvals.find((item) => item.code === code && item.templateKey === "city-handover");
        if (!approval || !["approved", "rejected", "withdrawn"].includes(status)) return false;
        if (!["pending", "paused_invalid_handler"].includes(approval.status)) return approval.status === status || (status === "approved" && ["approved_pending_effective", "processing_failed"].includes(approval.status));
        approval.expectedApprover = approvalCurrentAssignees(approval).join("、") || approval.expectedApprover;
        approval.status = status;
        approval.currentAssignees = [];
        approval.decidedBy = operator;
        approval.operator = operator;
        approval.decidedAt = time;
        approval.updatedAt = time;
        approval.decisionComment = comment;
        if (operator) approval.handledBy = [...new Set([...(approval.handledBy || []), operator])];
        if (status === "approved") return applyApprovedCityHandover(approval);
        return true;
      }

      function applyDueCityHandoverApprovals(businessDate = DEMO_TODAY) {
        approvals.filter((approval) => approval.templateKey === "city-handover" && approval.status === "approved_pending_effective" && approval.plannedEffectiveDate <= businessDate)
          .forEach((approval) => applyApprovedCityHandover(approval, businessDate));
      }

      function openApprovalCreate() {
        if (!currentUser) return toast("请先登录后发起审批");
        const employee = approvalCurrentEmployee();
        const binding = approvalCurrentBinding();
        if (!employee || !binding) {
          return toast("当前员工尚未绑定企业微信，请由 HR/人事或 admin 完成绑定后再发起审批");
        }
        const wecom = wecomEmployees.find((item) => item.id === binding.wecomId);
        const approvalTemplates = getApprovalTemplates();
        const templateByKey = (key) => approvalTemplates.find((template) => template.key === key) || approvalTemplates[0];
        const renderTemplateFields = (templateKey) => {
          const template = templateByKey(templateKey);
          return template.fields.map((field) => {
            const required = field.required ? '<span class="required-marker" aria-hidden="true">*</span>' : "";
            if (field.type === "select") {
              return `<div class="form-group"><label class="form-label">${required}${escapeHtml(field.label)}</label><select class="input" data-approval-field="${field.key}"${field.multiple ? " multiple size=4" : ""}${field.required ? " required" : ""}>${field.multiple ? "" : `<option value=\"\">请选择${escapeHtml(field.label)}</option>`}${field.options.map((option) => `<option value="${escapeHtml(String(option.value))}">${escapeHtml(option.label)}</option>`).join("")}</select></div>`;
            }
            if (field.type === "textarea") {
              return `<div class="form-group full"><label class="form-label">${required}${escapeHtml(field.label)}</label><textarea class="input" data-approval-field="${field.key}"${field.required ? " required" : ""}${field.minLength ? ` minlength="${field.minLength}"` : ""}${field.maxLength ? ` maxlength="${field.maxLength}"` : ""} placeholder="填写${escapeHtml(field.label)}"></textarea></div>`;
            }
            return `<div class="form-group"><label class="form-label">${required}${escapeHtml(field.label)}</label><input class="input" data-approval-field="${field.key}" type="${field.type}"${field.required ? " required" : ""}${field.min !== undefined ? ` min="${field.min}"` : ""}${field.step ? ` step="${field.step}"` : ""}${field.maxLength ? ` maxlength="${field.maxLength}"` : ""} placeholder="填写${escapeHtml(field.label)}"></div>`;
          }).join("");
        };
        openModal(
          `<div class="modal-head"><div class="modal-title">发起审批</div><button class="icon-btn close" data-close>×</button></div><form id="approvalCreateForm"><div class="modal-body"><div class="detail-grid"><div class="detail-item"><label>申请人</label><div>${escapeHtml(employee.name)} · ${escapeHtml(employee.code)}</div></div><div class="detail-item"><label>企业微信</label><div>${escapeHtml(wecom?.name || binding.wecomId)} · ${escapeHtml(wecom?.department || "—")}</div></div></div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>审批事项</label><select class="input" id="approvalCreateType" required>${approvalTemplates.map((template) => `<option value="${template.key}">${escapeHtml(template.label)}</option>`).join("")}</select></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>审批标题</label><input class="input" id="approvalCreateTitle" maxlength="100" placeholder="填写审批标题" required></div></div><div id="approvalCreateFields" class="form-grid">${renderTemplateFields(approvalTemplates[0].key)}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交审批</button></div></form>`,
        );
        const refreshCityRecipients = () => {
          const citySelect = document.querySelector('[data-approval-field="cityIds"]');
          const pmSelect = document.querySelector('[data-approval-field="targetPm"]');
          if (!citySelect || !pmSelect) return;
          const first = cityOwners.find((owner) => Number(owner.id) === Number(citySelect.selectedOptions[0]?.value));
          const region = first && centerForCityOwner(first);
          [...citySelect.options].forEach((option) => {
            const owner = cityOwners.find((item) => Number(item.id) === Number(option.value));
            option.disabled = !owner || Boolean(pendingCityHandover(owner.id)) || Boolean(region && centerForCityOwner(owner)?.id !== region.id);
            if (option.disabled) option.selected = false;
          });
          const previous = pmSelect.value;
          const pms = region ? regionPmEmployees(region).filter((employee) => employee.name !== currentUser.name) : [];
          pmSelect.innerHTML = '<option value="">请选择目标 PM</option>' + pms.map((employee) => `<option value="${escapeHtml(employee.name)}">${escapeHtml(employee.name)} · ${escapeHtml(employee.code)}</option>`).join("");
          if (pms.some((employee) => employee.name === previous)) pmSelect.value = previous;
          citySelect.onchange = refreshCityRecipients;
        };
        const refreshTemplateState = () => {
          const isCity = $("#approvalCreateType").value === "city-handover";
          const noCities = isCity && !templateByKey("city-handover").fields.find((field) => field.key === "cityIds").options.length;
          $("#approvalCreateForm button[type=submit]").disabled = noCities;
          if (noCities) $("#approvalCreateFields").innerHTML = '<div class="form-group full"><div class="empty">暂无可交接地市</div></div>';
          else if (isCity) refreshCityRecipients();
        };
        $("#approvalCreateType").onchange = (event) => {
          $("#approvalCreateFields").innerHTML = renderTemplateFields(event.target.value);
          refreshTemplateState();
        };
        refreshTemplateState();
        $("#approvalCreateForm").onsubmit = (event) => {
          event.preventDefault();
          const title = $("#approvalCreateTitle").value.trim();
          const templateKey = $("#approvalCreateType").value;
          const template = templateByKey(templateKey);
          const formData = Object.fromEntries([...document.querySelectorAll("#approvalCreateFields [data-approval-field]")].map((field) => [field.dataset.approvalField, field.multiple ? [...field.selectedOptions].map((option) => option.value) : field.value.trim()]));
          const missingField = template.fields.find((field) => field.required && (!formData[field.key] || (Array.isArray(formData[field.key]) && !formData[field.key].length)));
          if (!title || missingField) return toast(`请填写${missingField ? missingField.label : "审批标题"}`);
          const reason = formData.reason || title;
          const targetProject = formData.projectId ? projects.find((item) => item.id === formData.projectId) : null;
          const targetCustomer = formData.customerId ? customers.find((item) => String(item.id) === String(formData.customerId)) : null;
          const targetContact = formData.contactId ? contacts.find((item) => String(item.id) === String(formData.contactId)) : null;
          const targetTask = formData.taskId ? tasks.find((item) => String(item.id) === String(formData.taskId)) : null;
          const targetObject = targetProject
            ? `项目 · ${targetProject.name}`
            : targetCustomer
              ? `客户公司 · ${targetCustomer.name}`
              : targetContact
                ? `关键人 · ${targetContact.name}`
                : targetTask
                  ? `维系任务 · ${targetTask.title}`
              : "";
          submitBusinessApproval({
            templateKey,
            title,
            formData,
            reason,
            targetObject,
            targetKind: targetContact ? "contact" : targetTask ? "task" : targetProject ? "project" : "",
            targetId: targetContact?.id || targetTask?.id || targetProject?.id || null,
          });
        };
      }

      function openApprovalDetail(id) {
        const a = approvals.find((x) => x.id === id);
        const canView = a && approvalVisibleToCurrentUser(a);
        if (!canView) return toast("无权查看该审批流程");
        const canDecisionAct =
          canActOnApproval(a) && a.current !== "目标PM接收";
        const canTargetAct =
          canActOnApproval(a) && a.current === "目标PM接收";
        const canReplaceInvalidHandler =
          a.status === "paused_invalid_handler" && currentUser.fullAccess;
        const canRetryBusiness =
          a.status === "processing_failed" &&
          currentUser.fullAccess &&
          Boolean(a.targetKind || a.targetArchiveId || a.targetTaskId);
        const transferPerson = a.transferContactId
          ? contacts.find((x) => x.id === a.transferContactId)
          : null;
        const targetCompany = a.targetCompany
          ? customers.find((company) => company.name === a.targetCompany)
          : null;
        const campaignImpact = a.transferContactId
          ? `<div class="section-title">专项任务自动处理</div><div class="role-note">调岗生效时，系统逐条按专项发布版本重新匹配。仍符合时保留执行记录编号、截止时间和历史，并迁移给目标责任人；不符合时受控关闭。省公司执行项由所属区域总监承接，不经过 PM。</div>${a.campaignTaskResults?.length ? `<div class="table-wrap"><table><thead><tr><th>专项活动</th><th>处理结果</th><th>判定依据</th></tr></thead><tbody>${a.campaignTaskResults.map((result) => `<tr><td>${result.campaign}</td><td><span class="tag ${result.decision === "自动转移" ? "green" : "red"}">${result.decision}</span></td><td>${result.reason}</td></tr>`).join("")}</tbody></table></div>` : '<div class="list-sub">审批通过后生成逐条判定结果；当前无需人工选择。</div>'}`
          : "";
        const lateEntryImpact = a.type === "逾期补录"
          ? `<div class="section-title">补录核验</div><div class="detail-grid"><div class="detail-item"><label>关联任务</label><div>#${a.targetTaskId} ${a.taskTitle}</div></div><div class="detail-item"><label>任务截止日期</label><div>${a.taskDue}</div></div><div class="detail-item"><label>实际维系日期</label><div>${a.actualDate}</div></div><div class="detail-item"><label>创建时间</label><div>${a.date}</div></div><div class="detail-item"><label>登记延迟</label><div>${a.entryDelayDays} 天</div></div><div class="detail-item"><label>证明材料</label><div>${a.evidenceFiles?.join("、") || "未上传"}</div></div></div>`
          : "";
        const businessFailure =
          a.status === "processing_failed" && a.businessError
          ? `<div class="section-title">业务回写结果</div><div class="role-note danger-note"><strong>审批已通过，但业务处理失败</strong><br>${a.businessError}<br>业务对象保持审批前状态，由系统管理员复核后受控重试；重试成功前不改变原业务状态。</div>`
          : "";
        const businessFailureHistory = a.businessFailureHistory?.length
          ? `<div class="section-title">业务处理失败记录</div><div class="timeline">${a.businessFailureHistory.map((entry) => `<div class="timeline-item is-current"><div class="timeline-title">${entry.time} · 业务处理失败</div><div class="timeline-content">${entry.error}</div></div>`).join("")}</div>`
          : "";
        const businessRetryHistory = a.businessRetryHistory?.length
          ? `<div class="section-title">受控重试记录</div><div class="timeline">${a.businessRetryHistory.map((entry) => `<div class="timeline-item is-${entry.result === "成功" ? "done" : "current"}"><div class="timeline-title">${entry.startedAt} · ${entry.operator} · ${entry.result}</div><div class="timeline-content">${entry.error || "业务状态已按原审批生效"}</div></div>`).join("")}</div>`
          : "";
        const invalidHandlerImpact =
          a.status === "paused_invalid_handler"
            ? `<div class="section-title">流程异常</div><div class="role-note danger-note"><strong>处理人失效，流程已暂停</strong><br>原处理人：${a.invalidHandler || a.expectedApprover || "待确认"}<br>发现时间：${a.invalidatedAt || "—"}<br>原因：${a.invalidReason || "账号、任职或数据范围已失效"}<br>替换规则：${a.replacementRule || "按原节点资格规则选择合法替换人"}<br>业务对象保持审批前状态，不自动通过或静默改派。</div>`
            : "";
        const handlerReplacementAudit = a.handlerReplacementHistory?.length
          ? `<div class="section-title">处理人替换记录</div><div class="timeline">${a.handlerReplacementHistory.map((entry) => `<div class="timeline-item is-done"><div class="timeline-title">${entry.time} · ${entry.from} → ${entry.to}</div><div class="timeline-content">操作人：${entry.operator}；原因：${entry.reason}<br>资格依据：${entry.qualification || "复用原节点资格规则"}</div></div>`).join("")}</div>`
          : "";
        const stopImpact = ["group", "customer", "department", "contact"].includes(a.targetKind) && Boolean(a.taskHandle || a.impactSnapshot)
          ? `<div class="section-title">停用影响摘要</div><div class="detail-grid">${a.targetKind !== "contact" ? `<div class="detail-item"><label>对象类型</label><div>${a.type.replace(/停用$/, "")}</div></div>${a.businessNumber ? `<div class="detail-item"><label>集团编号</label><div>${a.businessNumber}</div></div>` : ""}<div class="detail-item"><label>客户单位</label><div>${a.impactSnapshot?.customers || 0} 家</div></div><div class="detail-item"><label>关键人 / 任职</label><div>${a.impactSnapshot?.people || 0}</div></div><div class="detail-item"><label>进行中审批</label><div>${a.impactSnapshot?.approvals || 0}</div></div>` : ""}<div class="detail-item"><label>任务处理方式</label><div>${a.taskHandle || "—"}</div></div><div class="detail-item"><label>未完成任务</label><div>${a.impactSnapshot?.tasks || 0}</div></div></div>`
          : "";
        const recoveryArchive = a.targetArchiveId
          ? archivedItems.find((item) => item.id === a.targetArchiveId) ||
            a.archiveSnapshot
          : null;
        const recoveryImpact = recoveryArchive
          ? `<div class="section-title">恢复影响摘要</div><div class="detail-grid"><div class="detail-item"><label>恢复对象</label><div>${recoveryArchive.type} · ${recoveryArchive.name}</div></div>${recoveryArchive.businessNumber ? `<div class="detail-item"><label>集团编号</label><div>${recoveryArchive.businessNumber}</div></div>` : ""}<div class="detail-item"><label>停用流程</label><div>${recoveryArchive.flowCode}</div></div><div class="detail-item"><label>原停用影响</label><div>${recoveryArchive.impact}</div></div><div class="detail-item"><label>任务处理</label><div>不补造停用期间历史任务</div></div></div>`
          : "";
        const impact = (lateEntryImpact || stopImpact || recoveryImpact || (a.transferContactId
          ? `<div class="section-title">调岗影响</div><div class="detail-grid">${transferPerson ? `<div class="detail-item"><label>原单位</label><div>${transferPerson.company}</div></div><div class="detail-item"><label>原部门 / 关键人岗位</label><div>${transferPerson.department} / ${transferPerson.positionName}</div></div><div class="detail-item"><label>原职级</label><div>${transferPerson.level}</div></div><div class="detail-item"><label>原客户负责人</label><div>${contactOwnerName(transferPerson)}</div></div>` : ""}<div class="detail-item"><label>目标单位</label><div>${a.targetCompany}</div></div><div class="detail-item"><label>目标客户负责人</label><div>${a.targetOwner || a.targetPm || "待配置"}</div></div><div class="detail-item"><label>执行安排</label><div>${targetCompany?.level === "省公司" ? "所属区域总监直接执行五类任务" : "地市负责人 PM 直接执行"}</div></div><div class="detail-item"><label>新部门 / 关键人岗位</label><div>${a.targetDepartment} / ${a.targetPositionName || a.targetTitle}</div></div><div class="detail-item"><label>未完成常规任务</label><div>原执行项受控关闭，在目标责任下重建并保留流程关联</div></div><div class="detail-item"><label>新任职生效日</label><div>${a.effectiveDate || "审批通过日"}</div></div></div>${campaignImpact}`
            : !a.formData && cityIdsForHandover(a).length
            ? `<div class="section-title">地市交接影响</div><div class="detail-grid"><div class="detail-item"><label>交接地市</label><div>${cityIdsForHandover(a).map((cityId) => cityOwners.find((owner) => owner.id === cityId)?.city || a.targetCitySnapshots?.find((snapshot) => snapshot.id === cityId)?.city || `#${cityId}`).join("、")}</div></div><div class="detail-item"><label>负责人变化</label><div>${a.originalPm || "原 PM"} → ${a.targetPm}</div></div><div class="detail-item"><label>计划生效日期</label><div>${a.plannedEffectiveDate || "审批通过日"}</div></div><div class="detail-item"><label>实际生效时间</label><div>${a.effectiveAt || "—"}</div></div><div class="detail-item"><label>客户 / 关键人</label><div>${a.impactSnapshot?.customers || 0} 家 / ${a.impactSnapshot?.people || 0} 人</div></div><div class="detail-item"><label>任务 / 覆盖 KPI</label><div>${a.impactSnapshot?.tasks || 0} 条 / ${a.impactSnapshot?.coverageKpis || 0} 条</div></div><div class="detail-item"><label>待审批流程</label><div>${a.impactSnapshot?.approvals || 0} 条</div></div><div class="detail-item"><label>目标 PM 处理</label><div>不审批、不接收，生效成功后收到通知</div></div></div><div class="role-note">生效时一次性迁移客户负责人、关键人责任、未完成任务、覆盖 KPI 待办和责任型审批；任一写入失败则全部保持原负责人。</div>`
            : "")) + invalidHandlerImpact + handlerReplacementAudit + businessFailure + businessFailureHistory + businessRetryHistory;
        const approvalFieldLabels = {
          projectId: "关联项目",
          customerId: "客户公司",
          expenseType: "费用类型",
          amount: "金额（元）",
          payee: "收款方",
          contactId: "关键人",
          taskId: "维系任务",
          due: "新截止日期",
          resumeDate: "暂停至",
          settlement: "是否涉及金额结算",
          settlementAmount: "应结算金额（万元）",
          cityIds: "交接地市",
          targetPm: "目标 PM",
          plannedEffectiveDate: "计划生效日期",
          adjustmentScope: "调整范围",
          targetEmployee: "调整对象",
          period: "目标周期",
          changeCount: "调整项数",
          reason: "申请原因",
        };
        const approvalFormDataHtml = a.formData && Object.keys(a.formData).length
          ? `<div class="section-title">申请内容</div><div class="detail-grid">${Object.entries(a.formData).map(([key, value]) => {
              let displayValue = value || "—";
              if (key === "projectId") {
                const project = projects.find((item) => item.id === value);
                displayValue = project ? `${project.id} · ${project.name}` : displayValue;
              }
              if (key === "customerId") {
                const customer = customers.find((item) => String(item.id) === String(value));
                displayValue = customer?.name || displayValue;
              }
              if (key === "contactId") {
                const contact = contacts.find((item) => String(item.id) === String(value));
                displayValue = contact ? `${contact.name} · ${contact.company}` : displayValue;
              }
              if (key === "taskId") {
                const task = tasks.find((item) => String(item.id) === String(value));
                displayValue = task ? `${task.executionCode || `#${task.id}`} · ${task.title}` : displayValue;
              }
              if (key === "cityIds") {
                const ids = Array.isArray(value) ? value : String(value).split(",");
                displayValue = ids.map((cityId) => cityOwners.find((item) => String(item.id) === String(cityId))?.city || cityId).join("、");
              }
              return `<div class="detail-item"><label>${escapeHtml(approvalFieldLabels[key] || key)}</label><div>${escapeHtml(String(displayValue))}</div></div>`;
            }).join("")}</div>`
          : "";
        const approvalTimeline = approvalTimelineHtml(a);
        const approvalReasonHtml = a.formData?.reason
          ? ""
          : `<div class="section-title">申请原因</div><p style="font-size:var(--font-size-body);line-height:var(--line-height-body)">${escapeHtml(a.reason || "—")}</p>`;
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">审批详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">审</div><div><div class="detail-name">${a.title}</div></div></div><div class="detail-grid"><div class="detail-item"><label>发起人</label><div>${a.applicant}</div></div><div class="detail-item"><label>发起时间</label><div>${a.date}</div></div><div class="detail-item"><label>流程进度</label><div>${approvalFlow(a)}</div></div><div class="detail-item"><label>当前处理人</label><div>${a.status === "paused_invalid_handler" ? `<span class="tag red">${approvalCurrentAssignees(a).join("、") || "原处理人"} · 已失效</span>` : approvalDetailHandler(a)}</div></div><div class="detail-item"><label>抄送人</label><div>${approvalCcUsers(a).join("、") || "无"}</div></div>${a.decidedAt || a.rejectedAt ? `<div class="detail-item"><label>完成时间</label><div>${a.decidedAt || a.rejectedAt}</div></div>` : ""}</div>${impact}${approvalFormDataHtml}${approvalReasonHtml}<div class="section-title">流程节点</div>${approvalTimeline}</div><div class="drawer-foot"><button class="btn" data-close>关闭</button></div>`,
        );
        const approvalDetailGrid = document.querySelector(
          "#overlay .detail-grid",
        );
        if (approvalDetailGrid) {
          const codeItem = document.createElement("div");
          codeItem.className = "detail-item";
          codeItem.innerHTML = `<label>流程编号</label><div>${a.code}</div>`;
          approvalDetailGrid.prepend(codeItem);
        }
      }

      function openApprovalDecision(id, pass) {
        const a = approvals.find((x) => x.id === id);
        if (!a || !canActOnApproval(a))
          return toast("当前账号不是该流程的处理人");
        openModal(
          `<div class="modal-head"><div class="modal-title">${pass ? "通过" : "驳回"}审批</div><button class="icon-btn close" data-close>×</button></div><form id="decisionForm"><div class="modal-body"><div class="role-note">${a.title}</div><div class="form-group"><label class="form-label">${pass ? "" : '<span class="required-marker" aria-hidden="true">*</span>'}审批意见</label><textarea class="input" id="decisionComment" minlength="${pass ? 0 : 5}" maxlength="500" required>${pass ? "同意，按申请内容执行。" : "请补充完整原因后重新提交。"}</textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn ${pass ? "btn-primary" : "btn-danger"}" type="submit">确认${pass ? "通过" : "驳回"}</button></div></form>`,
        );
        $("#decisionForm").onsubmit = (e) => {
          e.preventDefault();
          a.decisionComment = $("#decisionComment").value;
          handleApproval(id, pass);
          closeOverlay();
          renderPage();
        };
      }

      function openReplaceInvalidHandler(id) {
        const approval = approvals.find((item) => item.id === id);
        if (
          !approval ||
          approval.status !== "paused_invalid_handler" ||
          !currentUser.fullAccess
        )
          return toast("仅系统管理员可替换当前失效处理人");
        const invalidEmployee = employees.find(
          (employee) => employee.name === approval.invalidHandler,
        );
        let candidates = employees.filter(
          (employee) =>
            employee.status === "在职" &&
            employee.accountStatus !== "停用" &&
            employee.name !== approval.invalidHandler &&
            employee.role !== "系统管理员",
        );
        if (approval.current === "部门主管审批")
          candidates = candidates.filter(
            (employee) =>
              departmentsManagedBy(employee.code).length ||
              employee.role === "总裁",
          );
        else if (invalidEmployee?.role)
          candidates = candidates.filter(
            (employee) =>
              employee.role === invalidEmployee.role ||
              ["市场副总", "总裁"].includes(employee.role),
          );
        openModal(
          `<div class="modal-head"><div class="modal-title">替换失效处理人</div><button class="icon-btn close" data-close>×</button></div><form id="replaceInvalidHandlerForm"><div class="modal-body"><div class="role-note danger-note"><strong>${approval.code} · ${approval.current}</strong><br>原处理人：${approval.invalidHandler || approval.expectedApprover}<br>${approval.invalidReason}<br>流程和业务对象保持暂停，直到合法替换成功。</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>合法替换人</label><select class="input" id="replacementHandler" required><option value="">请选择</option>${candidates.map((employee) => `<option value="${employee.name}">${employee.name} · ${employeeRoleDisplay(employee)} · ${departmentsManagedBy(employee.code).map((department) => department.name).join("、") || employee.dept}</option>`).join("")}</select><div class="list-sub">候选按原节点角色、组织主管链和在职账号资格过滤</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>替换原因</label><textarea class="input" id="replacementHandlerReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字替换原因"></textarea></div><div class="form-group"><label class="form-label">资格校验依据</label><div class="role-note">${approval.replacementRule || "复用原节点资格和数据范围规则"}</div></div>${candidates.length ? "" : '<div class="role-note danger-note">当前没有合法候选，流程将继续暂停并向发起人、业务上级和系统管理员告警。</div>'}</div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit" ${candidates.length ? "" : "disabled"}>确认替换并恢复流程</button></div></form>`,
        );
        $("#replaceInvalidHandlerForm").onsubmit = (event) => {
          event.preventDefault();
          const target = $("#replacementHandler").value;
          const reason = $("#replacementHandlerReason").value.trim();
          if (!target) return toast("请选择合法替换人");
          if (reason.length < 5 || reason.length > 500)
            return toast("替换原因须为 5-500 字");
          const replacement = candidates.find(
            (employee) => employee.name === target,
          );
          if (!replacement) return toast("替换人资格已变化，请刷新后重试");
          approval.handlerReplacementHistory =
            approval.handlerReplacementHistory || [];
          approval.handlerReplacementHistory.push({
            from: approval.invalidHandler || approval.expectedApprover,
            to: target,
            operator: currentUser.name,
            reason,
            qualification: approval.replacementRule,
            time: recordCreatedAt(),
          });
          approval.status = "pending";
          approval.currentAssignees = [target];
          approval.expectedApprover = target;
          approval.updatedAt = recordCreatedAt();
          closeAllOverlays();
          renderPage();
          approvalView = "pending";
          toast(`已由${target}接续处理，流程恢复审批中`);
        };
      }

      function evaluateCampaignTarget(campaign, person, company) {
        if (!campaign?.targets)
          return {
            matched: false,
            reason: "专项活动缺少结构化目标规则，已转人工异常处理",
          };
        const checks = [
          ["行业", campaign.targets.industries, company?.industry],
          ["集团", campaign.targets.groups, company?.group],
          ["区域", campaign.targets.regions, company?.region],
          ["职级", campaign.targets.levels, person?.level],
        ];
        const failed = checks
          .filter(
            ([, values, value]) => values?.length && !values.includes(value),
          )
          .map(
            ([label, values, value]) =>
              `${label}要求${values.join("、")}，调岗后为${value || "未配置"}`,
          );
        return failed.length
          ? {
              matched: false,
              reason: `调岗后不再符合专项目标：${failed.join("；")}`,
            }
          : { matched: true, reason: "调岗后仍符合专项活动全部目标条件" };
      }

      function reconcileCampaignTasksAfterTransfer(person, targetCompany) {
        const results = [];
        tasks
          .filter(
            (task) =>
              task.person === person.name &&
              task.type === "专项维系" &&
              !["done", "cancelled"].includes(task.status),
          )
          .forEach((task) => {
            const campaign = campaigns.find(
              (item) => item.id === task.campaignId,
            );
            const evaluation = evaluateCampaignTarget(
              campaign,
              person,
              targetCompany,
            );
            if (evaluation.matched) {
              task.company = person.company;
              task.pm = customerOwnerName(targetCompany);
              task.executorRole =
                targetCompany?.level === "省公司" ? "区域总监" : "PM";
              task.region = person.region;
              task.level = person.level;
              task.transferDecision = "自动转移";
              task.transferReason = `${evaluation.reason}；执行人调整为${task.pm}`;
              task.transferredAt = DEMO_TODAY;
              task.updatedAt = recordCreatedAt();
            } else {
              task.status = "cancelled";
              task.closeReason = evaluation.reason;
              task.closedAt = DEMO_TODAY;
              task.transferDecision = campaign?.targets
                ? "自动关闭"
                : "规则异常待人工复核";
            }
            results.push({
              taskId: task.id,
              campaign: campaign?.name || "未知专项活动",
              decision: task.transferDecision,
              reason: evaluation.reason,
            });
          });
        return results;
      }

      function rebuildContactEventTasksAfterTransfer(
        person,
        targetCompany,
        approval,
      ) {
        const eventTypes = new Set(["常规维系", "生日关怀", "节假日关怀"]);
        const affected = tasks.filter(
          (task) =>
            task.person === person.name &&
            eventTypes.has(task.type) &&
            !["done", "cancelled"].includes(task.status),
        );
        const effectiveDate = approval.effectiveDate || DEMO_TODAY;
        affected.forEach((task) => {
          task.status = "cancelled";
          task.closeReason = `关键人任职变更（${approval.code}）生效，原任职执行项受控关闭`;
          task.closedAt = effectiveDate;
          task.updatedAt = recordCreatedAt();
          if (task.type === "常规维系") return;
          const replacement = {
            ...task,
            id: Date.now() + tasks.length + Math.floor(Math.random() * 1000),
            executionCode: nextTaskExecutionCode(task.parentTaskCode),
            company: person.company,
            pm: customerOwnerName(targetCompany),
            executorRole:
              targetCompany.level === "省公司" ? "区域总监" : "PM",
            region: person.region,
            level: person.level,
            status: task.due < DEMO_TODAY ? "overdue" : "pending",
            closeReason: undefined,
            closedAt: undefined,
            transferredFromExecutionCode: task.executionCode,
            transferApprovalCode: approval.code,
            createdAt: recordCreatedAt(),
            updatedAt: recordCreatedAt(),
          };
          tasks.push(replacement);
        });
        ensureRegularTask(person, effectiveDate, true);
        const regular = tasks
          .filter(
            (task) =>
              task.person === person.name &&
              task.company === person.company &&
              task.type === "常规维系" &&
              !["done", "cancelled"].includes(task.status),
          )
          .at(-1);
        if (regular) {
          regular.transferApprovalCode = approval.code;
          regular.updatedAt = recordCreatedAt();
        }
      }

      function rollbackApprovalBusinessState(approval) {
        if (approval.targetKind) {
          const obj =
            approval.targetKind === "group"
              ? null
              : approval.targetKind === "contact"
                ? contacts.find((item) => item.id === approval.targetId)
                : approval.targetKind === "department"
                  ? customerDepartments.find(
                      (item) => item.id === approval.targetId,
                    )
                  : customers.find((item) => item.id === approval.targetId);
          if (obj) obj.pendingStop = false;
          if (approval.targetKind === "group")
            pendingGroupStops.delete(String(approval.targetId));
          const pendingIndex = archivedItems.findIndex(
            (item) =>
              item.flowCode === approval.code &&
              item.approvalStatus === "审批中",
          );
          if (pendingIndex >= 0) archivedItems.splice(pendingIndex, 1);
        }
        if (approval.targetArchiveId) {
          const archived = archivedItems.find(
            (item) => item.id === approval.targetArchiveId,
          );
          if (archived) {
            archived.status = "已停用";
            archived.approvalStatus = "已驳回/撤回";
            archived.recoveryStatus = "未申请";
            archived.recoveryFlowCode = "";
          }
        }
      }

      function recordApprovalBusinessFailure(approval, error, message) {
        const failedAt = recordCreatedAt();
        approval.status = "processing_failed";
        approval.businessError = error;
        approval.updatedAt = failedAt;
        approval.businessFailureHistory = [
          ...(approval.businessFailureHistory || []),
          { time: failedAt, error },
        ];
        const pendingArchive = archivedItems.find(
          (item) => item.flowCode === approval.code,
        );
        if (pendingArchive)
          pendingArchive.approvalStatus = "已通过-业务处理失败";
        const recoveryArchive = approval.targetArchiveId
          ? archivedItems.find((item) => item.id === approval.targetArchiveId)
          : null;
        if (recoveryArchive)
          recoveryArchive.recoveryStatus = `已通过-业务处理失败 · ${approval.code}`;
        if (
          !notificationMessages.some(
            (notification) =>
              notification.approvalId === approval.id &&
              notification.category === "系统告警",
          )
        )
          notificationMessages.push({
            id: `approval-failure:${approval.id}`,
            approvalId: approval.id,
            roles: ["admin"],
            category: "系统告警",
            title: `${approval.code} 业务处理失败`,
            content: `${approval.title}：${error}`,
            date: approval.updatedAt,
            read: false,
          });
        refreshNoticeIndicator();
        toast(message);
      }

      function retryApprovalBusiness(id) {
        const approval = approvals.find((item) => item.id === id);
        if (!currentUser?.fullAccess)
          return toast("仅系统管理员可执行受控重试");
        if (
          !approval ||
          approval.status !== "processing_failed" ||
          !(approval.targetKind || approval.targetArchiveId || approval.targetTaskId)
        )
          return toast("当前流程无需受控重试");
        const decisionSnapshot = {
          decidedAt: approval.decidedAt,
          decidedBy: approval.decidedBy,
          decisionComment: approval.decisionComment,
          expectedApprover: approval.expectedApprover,
          handledBy: [...(approval.handledBy || [])],
        };
        const previousBusinessError = approval.businessError;
        const retryStartedAt = recordCreatedAt();
        approval.status = "pending";
        approval.currentAssignees = [currentUser.name];
        approval.businessError = "";
        handleApproval(approval.id, true);
        Object.assign(approval, decisionSnapshot, { currentAssignees: [] });
        approval.businessRetryHistory = [
          ...(approval.businessRetryHistory || []),
          {
            operator: currentUser.name,
            startedAt: retryStartedAt,
            result:
              approval.status === "processing_failed" ? "失败" : "成功",
            error: approval.businessError || previousBusinessError,
          },
        ];
        approval.updatedAt = recordCreatedAt();
        renderPage();
        if (approval.status === "processing_failed")
          return toast("受控重试未成功，原业务状态和流程锁保持不变");
        toast("受控重试成功，业务状态已按原审批生效");
      }

      function handleApproval(id, pass) {
        const a = approvals.find((x) => x.id === id);
        if (!a || !canActOnApproval(a))
          return toast("当前账号不是该流程的处理人");
        const targetTask = a.targetTaskId
          ? tasks.find((task) => task.id === a.targetTaskId)
          : null;
        if (targetTask?.status === "cancelled")
          return toast("关联任务已取消，当前申请已不适用");
        const collaborationNode = activeApprovalCollaborationNode(a);
        if (collaborationNode) {
          const member = collaborationNode.members.find(
            (item) =>
              item.state === "current" && item.name === currentUser.name,
          );
          if (!member) return toast("当前账号不是该会签节点成员");
          member.state = pass ? "done" : "rejected";
          member.actualOperator = currentUser.name;
          member.time = recordCreatedAt();
          member.opinion = a.decisionComment;
          a.handledBy = [...new Set([...(a.handledBy || []), currentUser.name])];
          a.updatedAt = member.time;
          if (!pass) {
            collaborationNode.state = "rejected";
            a.status = "rejected";
            a.rejectedBy = currentUser.name;
            a.rejectedAt = member.time;
            a.currentAssignees = [];
            rollbackApprovalBusinessState(a);
            return toast(`${collaborationNode.title}已驳回，流程结束`);
          }
          const remaining = collaborationNode.members.filter(
            (item) => item.state === "current",
          );
          if (remaining.length) {
            a.currentAssignees = remaining.map((item) => item.name);
            return toast(
              `${collaborationNode.title}已记录，仍有 ${remaining.length} 人待处理`,
            );
          }
          collaborationNode.state = "done";
          a.current = collaborationNode.nextNode;
          a.currentAssignees = [...(collaborationNode.nextAssignees || [])];
          return toast(`会签已全部通过，流程进入${collaborationNode.nextNode}`);
        }
        a.expectedApprover = approvalCurrentAssignees(a).join("、") || a.expectedApprover;
        a.handledBy = [...new Set([...(a.handledBy || []), currentUser.name])];
        a.decidedBy = currentUser.name;
        a.status = pass ? "approved" : "rejected";
        a.currentAssignees = [];
        a.decidedAt = recordCreatedAt();
        if (a.type === "逾期补录") {
          const task = tasks.find((item) => item.id === a.targetTaskId);
          const pendingIndex = pendingMaintenanceRecords.findIndex(
            (item) => item.id === a.pendingRecordId,
          );
          const pendingRecord = pendingMaintenanceRecords[pendingIndex];
          if (task && pendingRecord && pass) {
            pendingRecord.reviewStatus = "approved";
            pendingRecord.approvedAt = a.decidedAt;
            pendingRecord.approvalId = a.id;
            maintenanceRecords.unshift(pendingRecord);
            pendingMaintenanceRecords.splice(pendingIndex, 1);
            finalizeTaskCompletion(task, pendingRecord, "late_entry_approved");
            task.lateEntryApprovalId = a.id;
          } else if (task && pendingRecord) {
            pendingRecord.reviewStatus = "rejected";
            pendingRecord.rejectedAt = a.decidedAt;
            pendingRecord.rejectionComment = a.decisionComment;
            task.status = "overdue";
            task.lateEntryApprovalId = a.id;
          }
          return;
        }
        if ((a.type === "地市交接" || a.templateKey === "city-handover") && cityIdsForHandover(a).length) {
          if (!pass) {
            rollbackApprovalBusinessState(a);
            toast("地市交接已驳回，原负责人和全部业务责任保持不变");
            return;
          }
          if ((a.plannedEffectiveDate || DEMO_TODAY) > DEMO_TODAY) {
            a.status = "approved_pending_effective";
            a.updatedAt = a.decidedAt;
            toast(`地市交接已通过，将于 ${a.plannedEffectiveDate} 自动生效`);
            return;
          }
          const applied = applyCityResponsibilityTransfer(a);
          if (applied) a.status = "approved";
          toast(
            applied
              ? "地市责任交接已生效，目标 PM 已收到交接结果和待办数量"
              : "审批已通过但业务迁移失败，原负责人保持不变",
          );
          return;
        }
        if (!pass) rollbackApprovalBusinessState(a);
        if (pass && a.targetKind) {
          const obj =
            a.targetKind === "group"
              ? {
                  id: String(a.targetId),
                  name: String(a.targetId),
                  group: String(a.targetId),
                }
              : a.targetKind === "contact"
              ? contacts.find((x) => x.id === a.targetId)
              : a.targetKind === "department"
                ? customerDepartments.find((x) => x.id === a.targetId)
                : customers.find((x) => x.id === a.targetId);
          if (
            !obj ||
            (a.targetKind === "group" &&
              !customerGroupNames.includes(String(a.targetId)))
          ) {
            return recordApprovalBusinessFailure(
              a,
              "停用对象已不存在，业务状态未改变",
              "审批已通过，但停用对象不存在，已进入业务处理失败",
            );
          }
          const affectedPeople =
            a.targetKind === "group"
              ? contacts.filter((person) => {
                  const company = customers.find(
                    (item) => item.name === person.company,
                  );
                  return (
                    contactIsActive(person) && company?.group === obj.name
                  );
                })
              : a.targetKind === "contact"
              ? [obj]
              : a.targetKind === "department"
                ? contacts.filter((p) => {
                    const c = customers.find((x) => x.name === p.company);
                    return c?.group === obj.group && p.department === obj.name;
                  })
                : contacts.filter((p) => p.company === obj.name);
          const outstandingTasks = tasks.filter(
            (task) =>
              affectedPeople.some((person) => person.name === task.person) &&
              !["done", "cancelled"].includes(task.status),
          );
          if (
            a.taskHandle === "先处理任务后再停用" &&
            outstandingTasks.length
          ) {
            return recordApprovalBusinessFailure(
              a,
              `审批期间仍有 ${outstandingTasks.length} 条未完成任务，停用未生效`,
              "审批已通过，但仍有未完成任务，已进入业务处理失败",
            );
          }
          const replacement =
            a.targetKind === "department" && a.replacementDepartmentId
              ? customerDepartments.find(
                  (department) =>
                    department.id === a.replacementDepartmentId &&
                    !department.archived,
                )
              : null;
          if (
            a.targetKind === "department" &&
            affectedPeople.length &&
            !replacement
          ) {
            return recordApprovalBusinessFailure(
              a,
              "替代客户部门在审批期间失效，停用未生效",
              "替代部门已失效，停用未生效",
            );
          }
          if (a.targetKind === "group") {
            customers
              .filter((company) => company.group === obj.name)
              .forEach((company) => {
                company.archived = true;
                company.pendingStop = false;
              });
            affectedPeople.forEach((person) => {
              person.archived = true;
              person.pendingStop = false;
            });
            const groupIndex = customerGroupNames.indexOf(obj.name);
            if (groupIndex >= 0) customerGroupNames.splice(groupIndex, 1);
            pendingGroupStops.delete(obj.name);
          } else {
            obj.archived = true;
            obj.pendingStop = false;
          }
          const closeUnfinished =
            !a.taskHandle || a.taskHandle === "关闭未完成任务并记录原因";
          affectedPeople.forEach((p) =>
            tasks
              .filter(
                (t) =>
                  t.person === p.name &&
                  !["done", "cancelled"].includes(t.status),
              )
              .forEach((t) => {
                if (closeUnfinished) {
                  t.status = "cancelled";
                  t.closeReason = `${obj.name}已停用：${a.reason}`;
                }
              }),
          );
          if (a.targetKind === "customer" && a.cascadeContactIds?.length)
            affectedPeople.forEach((person) => {
              person.archived = true;
              person.pendingStop = false;
            });
          if (a.targetKind === "department" && replacement) {
            affectedPeople.forEach((person) => {
              person.department = replacement.name;
              person.updatedAt = a.decidedAt;
            });
          }
          const pendingArchive = archivedItems.find(
            (item) =>
              item.flowCode === a.code && item.approvalStatus === "审批中",
          );
          const archiveData = {
            id: pendingArchive?.id || Date.now(),
            name: obj.name,
            type:
              a.targetKind === "group"
                ? "集团公司"
                : a.targetKind === "contact"
                  ? "关键人"
                  : a.targetKind === "department"
                    ? "客户部门"
                    : "客户单位",
            parent:
              a.targetKind === "group"
                ? "客户组织"
                : obj.company || obj.group || "客户组织",
            reason: a.reason,
            date: a.date.slice(0, 10),
            applicant: a.applicant,
            status: "已停用",
            approvalStatus: "已通过",
            targetKind: a.targetKind,
            targetId: a.targetId,
            region: a.region,
            flowCode: a.code,
            effectiveAt: a.decidedAt,
            recoveryStatus: "未申请",
            taskHandle: a.taskHandle,
            impact: `${a.impactSnapshot?.customers ? `客户单位 ${a.impactSnapshot.customers} 家，` : ""}关键人/任职 ${affectedPeople.length}，未完成任务 ${a.impactSnapshot?.tasks || 0}`,
            businessNumber:
              pendingArchive?.businessNumber ||
              (a.targetKind === "group"
                ? customerGroupNumbers[obj.name]
                : ""),
            groupSnapshot: pendingArchive?.groupSnapshot || null,
          };
          if (pendingArchive) Object.assign(pendingArchive, archiveData);
          else archivedItems.unshift(archiveData);
        }
        if (pass && a.targetTaskId) {
          const t = tasks.find((x) => x.id === a.targetTaskId);
          if (!t)
            return recordApprovalBusinessFailure(
              a,
              "关联任务已不存在，任务变更未生效",
              "审批已通过，但关联任务不存在，已进入业务处理失败",
            );
          if (
            a.changeType === "暂停维系至某日" &&
            !taskCanPause(t)
          ) {
            if (
              t.status === "pending" &&
              t.due < DEMO_TODAY &&
              !t.everOverdue
            ) {
              t.status = "overdue";
              t.everOverdue = true;
              t.firstOverdueAt = addDays(t.due, 1);
            }
            return recordApprovalBusinessFailure(
              a,
              "暂停生效时任务已不满足未逾期且从未逾期条件，原任务状态保持不变",
              "审批已通过，但任务已不满足暂停条件，已进入业务处理失败",
            );
          }
          if (a.changeType === "取消") {
            t.status = "cancelled";
            t.closeReason = a.reason;
          }
          if (a.changeType === "延期") {
            t.originalDue = t.originalDue || t.due;
            t.due = a.changeDate;
            t.status = t.due < DEMO_TODAY ? "overdue" : "pending";
          }
          if (a.changeType === "暂停维系至某日") {
            t.originalDue = t.originalDue || t.due;
            t.status = "paused";
            t.resumeDate = a.changeDate;
            t.pausedAt = a.decidedAt;
            t.pauseApprovalId = a.id;
            t.everOverdue = false;
            delete t.firstOverdueAt;
            delete t.lateDays;
          }
        }
        if (pass && a.transferContactId) {
          const p = contacts.find((x) => x.id === a.transferContactId);
          const target = customers.find((x) => x.name === a.targetCompany);
          p.employmentHistory = p.employmentHistory || [];
          p.employmentHistory.unshift({
            company: p.company,
            department: p.department,
            title: p.title,
            positionSource: p.positionSource,
            positionId: p.positionId,
            positionName: p.positionName,
            level: p.level,
            pm: p.pm,
            startDate: p.effectiveDate,
            endDate: a.effectiveDate || DEMO_TODAY,
            approvalCode: a.code,
          });
          Object.assign(p, {
            company: a.targetCompany,
            department: a.targetDepartment,
            title: a.targetTitle,
            positionSource: a.targetPositionSource || "custom",
            positionId: a.targetPositionId || "",
            positionName: a.targetPositionName || a.targetTitle,
            level: a.targetLevel,
            pm: target?.level === "省公司" ? "" : a.targetPm,
            region: target?.region || p.region,
            city: target?.city || p.city,
            effectiveDate: a.effectiveDate || DEMO_TODAY,
            updatedAt: recordCreatedAt(),
          });
          rebuildContactEventTasksAfterTransfer(p, target, a);
          a.campaignTaskResults = reconcileCampaignTasksAfterTransfer(
            p,
            target,
          );
        }
        if (pass && a.targetArchiveId) {
          const index = archivedItems.findIndex(
            (x) => x.id === a.targetArchiveId,
          );
          if (index < 0)
            return recordApprovalBusinessFailure(
              a,
              "恢复记录已不存在，业务状态未改变",
              "审批已通过，但恢复记录不存在，已进入业务处理失败",
            );
          const x = archivedItems[index];
          const obj =
            x.targetKind === "group"
              ? null
              : x.targetKind === "contact"
                ? contacts.find((o) => o.id === x.targetId)
                : x.targetKind === "customer"
                  ? customers.find((o) => o.id === x.targetId)
                  : x.targetKind === "department"
                    ? customerDepartments.find((o) => o.id === x.targetId)
                    : contacts.find((o) => o.name === x.name) ||
                      customers.find((o) => o.name === x.name) ||
                      customerDepartments.find((o) => o.name === x.name);
          if (x.targetKind !== "group" && !obj)
            return recordApprovalBusinessFailure(
              a,
              "恢复对象已不存在，业务状态未改变",
              "审批已通过，但恢复对象不存在，已进入业务处理失败",
            );
          if (x.targetKind === "group") {
            if (!customerGroupNames.includes(x.name))
              customerGroupNames.push(x.name);
            customerGroupIndustries[x.name] =
              x.groupSnapshot?.industry || customerGroupIndustries[x.name] || "";
            customerGroupCreditCodes[x.name] =
              x.groupSnapshot?.creditCode || customerGroupCreditCodes[x.name] || "";
            customerGroupNumbers[x.name] =
              x.groupSnapshot?.groupNumber ||
              x.businessNumber ||
              customerGroupNumbers[x.name];
            pendingGroupStops.delete(x.name);
          }
          if (obj) {
            obj.archived = false;
            obj.pendingStop = false;
          }
          const restoredPeople = x.targetKind === "contact" ? [obj] : [];
          restoredPeople
            .filter(Boolean)
            .forEach((p) => ensureRegularTask(p, DEMO_TODAY));
          if (x.targetKind === "group") {
            x.status = "正常";
            x.recoveryStatus = `已通过 · ${a.code}`;
            x.recoveredAt = a.decidedAt;
          } else {
            archivedItems.splice(index, 1);
          }
        }
        toast(pass ? "审批已通过，业务状态已回写" : "审批已驳回并通知发起人");
      }

      function acceptTransfer(id) {
        const a = approvals.find((x) => x.id === id);
        if (
          !a ||
          a.current !== "目标PM接收" ||
          !hasOperationPermission("approvals.decide") ||
          (!currentUser.fullAccess &&
            !approvalCurrentAssignees(a).includes(currentUser.name))
        )
          return toast("当前账号无权处理该接收待办");
        a.current = "区域总监审批";
        a.acceptedBy = currentUser.name;
        a.acceptedAt = "2026-08-11 14:20";
        a.acceptComment = "确认接收，流程转目标区域总监审批。";
        a.handledBy = [...new Set([...(a.handledBy || []), currentUser.name])];
        const targetRegion = a.targetCompany
          ? customers.find((company) => company.name === a.targetCompany)?.region
          : "";
        a.currentAssignees = [regionDirectorName(targetRegion || a.region)];
        closeOverlay();
        toast("已接收关键人，流程转区域总监审批");
        renderPage();
      }
