      function openRejectTransfer(id) {
        const a = approvals.find((x) => x.id === id);
        if (
          !a ||
          a.current !== "目标PM接收" ||
          !hasOperationPermission("approvals.decide") ||
          (!currentUser.fullAccess &&
            !approvalCurrentAssignees(a).includes(currentUser.name))
        )
          return toast("当前账号无权处理该接收待办");
        openModal(
          `<div class="modal-head"><div class="modal-title">拒绝接收关键人</div><button class="icon-btn close" data-close>×</button></div><form id="rejectTransferForm"><div class="modal-body"><div class="role-note">${a.title}<br>拒绝后关键人仍由原PM负责，发起人可修改后重新提交。</div><div class="form-group"><label class="form-label">拒绝原因 *</label><textarea class="input" id="rejectTransferReason" required placeholder="例如：目标单位或任职信息有误"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-danger" type="submit">确认拒绝</button></div></form>`,
        );
        $("#rejectTransferForm").onsubmit = (e) => {
          e.preventDefault();
          a.status = "rejected";
          a.decisionComment = $("#rejectTransferReason").value;
          a.rejectedBy = currentUser.name;
          a.rejectedAt = recordCreatedAt();
          a.handledBy = [...new Set([...(a.handledBy || []), currentUser.name])];
          a.currentAssignees = [];
          closeOverlay();
          renderPage();
          toast("已拒绝接收并通知原PM");
        };
      }
      function openArchiveAudit(id) {
        const x = archivedItems.find((x) => x.id === id);
        if (!x || !archiveVisibleToCurrentUser(x))
          return toast("停用记录不存在或无权查看");
        const stopApproval = approvals.find(
          (approval) => approval.code === x.flowCode,
        );
        const recoveryApproval = approvals.find(
          (approval) => approval.code === x.recoveryFlowCode,
        );
        const stopTimeline =
          ["pending", "paused_invalid_handler"].includes(stopApproval?.status)
            ? `<div class="timeline-item is-current"><div class="timeline-title">${stopApproval?.current || "审批处理中"}</div><div class="timeline-content">当前处理人：${approvalCurrentAssignees(stopApproval || {}).join("、") || "待系统计算"}；审批通过前对象仍按正常状态参与业务。</div></div>`
            : stopApproval?.status === "processing_failed"
              ? `<div class="timeline-item is-current"><div class="timeline-title">已通过-业务处理失败</div><div class="timeline-content">对象保持正常；${stopApproval.businessError || "等待系统管理员受控重试"}</div></div>`
            : `<div class="timeline-item is-done"><div class="timeline-title">${x.effectiveAt || "—"} · 审批通过并生效</div><div class="timeline-content">对象从正常列表、候选和实时经营统计中剔除；历史编号、任职、任务和记录保留。</div></div>`;
        const recoveryTimeline =
          ["pending", "paused_invalid_handler"].includes(recoveryApproval?.status)
            ? `<div class="timeline-item is-current"><div class="timeline-title">恢复审批中</div><div class="timeline-content">${x.recoveryStatus}；当前处理人 ${approvalCurrentAssignees(recoveryApproval || {}).join("、") || "待系统计算"}；对象业务状态保持已停用。</div></div>`
            : recoveryApproval?.status === "processing_failed"
              ? `<div class="timeline-item is-current"><div class="timeline-title">恢复已通过-业务处理失败</div><div class="timeline-content">对象保持已停用；${recoveryApproval.businessError || "等待系统管理员受控重试"}</div></div>`
            : x.recoveredAt
              ? `<div class="timeline-item is-done"><div class="timeline-title">${x.recoveredAt} · 恢复已生效</div><div class="timeline-content">集团编号 ${x.businessNumber || x.groupSnapshot?.groupNumber || "—"} 保持不变，停用与恢复历史继续保留。</div></div>`
              : "";
        openDrawer(
          `<div class="drawer-head"><div><div class="modal-title">停用记录详情</div><div class="panel-sub">${x.flowCode} · ${x.type}</div></div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">停</div><div><div class="detail-name">${x.name}</div><div class="detail-sub">${x.parent} · ${x.region}</div></div><div class="spacer"></div><span class="tag ${x.status === "已停用" ? "red" : "green"}">${x.status}</span></div><div class="detail-grid"><div class="detail-item"><label>对象快照</label><div>${x.type} · ${x.name}</div></div>${x.type === "集团公司" ? `<div class="detail-item"><label>集团编号</label><div>${x.businessNumber || x.groupSnapshot?.groupNumber || "—"}</div></div>` : ""}<div class="detail-item"><label>停用前状态</label><div>正常</div></div><div class="detail-item"><label>停用原因</label><div>${x.reason}</div></div><div class="detail-item"><label>任务处理方式</label><div>${x.taskHandle}</div></div><div class="detail-item"><label>影响摘要</label><div>${x.impact}</div></div><div class="detail-item"><label>停用生效时间</label><div>${x.effectiveAt || "—（审批通过后生成）"}</div></div><div class="detail-item"><label>停用审批状态</label><div>${stopApproval ? approvalStatusName(stopApproval.status) : x.approvalStatus || "已通过"}</div></div><div class="detail-item"><label>恢复审批</label><div>${recoveryApproval ? `${approvalStatusName(recoveryApproval.status)} · ${recoveryApproval.code}` : x.recoveryStatus || "未申请"}</div></div></div>${x.upperDisabled ? `<div class="role-note danger-note">恢复阻断：${x.upperDisabledReason}</div>` : ""}<div class="section-title">审批与生效记录</div><div class="timeline"><div class="timeline-item is-done"><div class="timeline-title">${x.date} · ${x.applicant} 发起停用申请</div><div class="timeline-content">流程 ${x.flowCode}；原因：${x.reason}</div></div>${stopTimeline}${recoveryTimeline}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${stopApproval ? `<button class="btn" data-action="approval-detail" data-id="${stopApproval.id}">查看停用审批</button>` : ""}${recoveryApproval ? `<button class="btn" data-action="approval-detail" data-id="${recoveryApproval.id}">查看恢复审批</button>` : ""}${x.status === "已停用" && hasOperationPermission("archive.restore") && !archiveRecoveryLock(x) ? `<button class="btn btn-primary" data-action="restore-object" data-id="${x.id}">申请恢复</button>` : ""}</div>`,
        );
      }
      function openRestore(id) {
        if (!hasOperationPermission("archive.restore"))
          return toast("当前账号无申请恢复权限");
        const x = archivedItems.find((x) => x.id === id);
        if (!x || !archiveVisibleToCurrentUser(x))
          return toast("停用记录不存在或无权查看");
        if (x.status !== "已停用" || archiveRecoveryLock(x))
          return toast("该对象已有恢复审批，不能重复提交");
        const targetObject =
          archivedBusinessObject(x) || {
            id: x.targetId,
            name: x.name,
            group: x.parent,
            region: x.region,
          };
        const route = objectApprovalRoute(x.targetKind, targetObject);
        openModal(
          `<div class="modal-head"><div class="modal-title">申请恢复${x.type}</div><button class="icon-btn close" data-close>×</button></div><form id="restoreForm"><div class="modal-body"><div class="detail-grid"><div class="detail-item"><label>恢复对象</label><div>${x.name}</div></div>${x.type === "集团公司" ? `<div class="detail-item"><label>集团编号</label><div>${x.businessNumber || x.groupSnapshot?.groupNumber || "—"}</div></div>` : ""}<div class="detail-item"><label>停用流程</label><div>${x.flowCode}</div></div><div class="detail-item"><label>恢复顺序校验</label><div>${x.upperDisabled ? "不通过" : "通过"}</div></div><div class="detail-item"><label>任务生成影响</label><div>不补造停用期间历史任务</div></div></div>${x.upperDisabled ? `<div class="role-note danger-note">${x.upperDisabledReason}</div>` : `<div class="role-note">审批路由：${route.direct ? "总裁直接确认并形成已通过审计实例" : `${route.current}（${route.assignees.join("、")}）`}。通过后对象重新进入正常列表和候选；关键人从恢复时间重建常规任务，覆盖 KPI 按当前责任重新计算。</div>`}<div class="form-group"><label class="form-label">恢复原因 *</label><textarea class="input" id="restoreReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字恢复原因"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit" ${x.upperDisabled ? "disabled" : ""}>${route.direct ? "确认恢复并记录审计" : "提交恢复审批"}</button></div></form>`,
        );
        $("#restoreForm").onsubmit = (e) => {
          e.preventDefault();
          if (x.upperDisabled) return toast(x.upperDisabledReason);
          const flowCode = nextBusinessCode("WF");
          x.recoveryStatus = `审批中 · ${flowCode}`;
          x.recoveryFlowCode = flowCode;
          const approval = {
            id: Date.now(),
            code: flowCode,
            source: "manual",
            type: "恢复审批",
            title: `恢复${x.name}`,
            applicant: currentUser.name,
            region: x.region,
            current: route.current,
            currentAssignees: [...route.assignees],
            ccUsers: [...route.ccUsers],
            status: "pending",
            date: recordCreatedAt(),
            reason: $("#restoreReason").value.trim(),
            targetArchiveId: x.id,
            archiveSnapshot: {
              type: x.type,
              name: x.name,
              flowCode: x.flowCode,
              impact: x.impact,
              businessNumber:
                x.businessNumber || x.groupSnapshot?.groupNumber || "",
            },
            businessNumber:
              x.type === "集团公司"
                ? x.businessNumber || x.groupSnapshot?.groupNumber || ""
                : "",
          };
          approvals.unshift(approval);
          if (route.direct) {
            approval.decisionComment = "总裁确认恢复并按当前业务责任重新启用。";
            handleApproval(approval.id, true);
          }
          closeOverlay();
          renderPage();
          toast(
            route.direct
              ? "恢复已直接生效并生成完整审计记录"
              : `恢复申请已提交${route.current}`,
          );
        };
      }
