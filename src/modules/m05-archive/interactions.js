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
          `<div class="modal-head"><div class="modal-title">拒绝接收关键人</div><button class="icon-btn close" data-close>×</button></div><form id="rejectTransferForm"><div class="modal-body"><div class="role-note">${a.title}<br>拒绝后关键人仍由原PM负责，发起人可修改后重新提交。</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>拒绝原因</label><textarea class="input" id="rejectTransferReason" required placeholder="例如：目标单位或任职信息有误"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-danger" type="submit">确认拒绝</button></div></form>`,
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
        const item = archivedItems.find((candidate) => candidate.id === id);
        if (!item || !archiveVisibleToCurrentUser(item))
          return toast("停用记录不存在或无权查看");
        const operator = item.operator || item.applicant || "—";
        const recoveryResult =
          item.recoveryResult || (item.recoveredAt ? "已恢复" : "未恢复");
        const recoveryTimeline = item.recoveredAt
          ? `<div class="timeline-item is-done"><div class="timeline-title">${item.recoveredAt} · 恢复已直接生效</div><div class="timeline-content">操作人：${item.recoveryOperator || operator}；原因：${item.recoveryReason || "—"}。停用与恢复历史继续保留。</div></div>`
          : "";
        openDrawer(
          `<div class="drawer-head"><div><div class="modal-title">停用记录详情</div><div class="panel-sub">${item.type}</div></div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">停</div><div><div class="detail-name">${item.name}</div><div class="detail-sub">${item.parent} · ${item.region}</div></div><div class="spacer"></div><span class="tag ${item.status === "已停用" ? "red" : "green"}">${item.status}</span></div><div class="detail-grid"><div class="detail-item"><label>对象快照</label><div>${item.type} · ${item.name}</div></div>${item.type === "集团公司" ? `<div class="detail-item"><label>集团编号</label><div>${item.businessNumber || item.groupSnapshot?.groupNumber || "—"}</div></div>` : ""}<div class="detail-item"><label>停用前状态</label><div>正常</div></div><div class="detail-item"><label>停用原因</label><div>${item.reason}</div></div><div class="detail-item"><label>实际操作人</label><div>${operator}</div></div><div class="detail-item"><label>确认结果</label><div>${item.confirmationResult || "已确认"}</div></div><div class="detail-item"><label>任务处理方式</label><div>${item.taskHandle}</div></div><div class="detail-item"><label>影响摘要</label><div>${item.impact}</div></div><div class="detail-item"><label>停用生效时间</label><div>${item.effectiveAt || "—"}</div></div><div class="detail-item"><label>恢复结果</label><div>${recoveryResult}</div></div></div>${item.upperDisabled ? `<div class="role-note danger-note">恢复阻断：${item.upperDisabledReason}</div>` : ""}<div class="section-title">生效记录</div><div class="timeline"><div class="timeline-item is-done"><div class="timeline-title">${item.effectiveAt || item.date} · 停用已直接生效</div><div class="timeline-content">操作人：${operator}；原因：${item.reason}。对象从正常列表、候选和实时经营统计中剔除，历史编号、任职、任务和记录保留。</div></div>${recoveryTimeline}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${item.status === "已停用" && currentUser.fullAccess && hasOperationPermission("archive.restore") ? `<button class="btn btn-primary" data-action="restore-object" data-id="${item.id}">恢复</button>` : ""}</div>`,
        );
      }

      function openRestore(id) {
        if (!currentUser?.fullAccess || !hasOperationPermission("archive.restore"))
          return toast("当前账号无恢复权限");
        const item = archivedItems.find((candidate) => candidate.id === id);
        if (!item || !archiveVisibleToCurrentUser(item))
          return toast("停用记录不存在或无权查看");
        if (item.status !== "已停用") return toast("该对象当前不是已停用状态");
        if (item.upperDisabled) return toast(item.upperDisabledReason);
        const targetObject = archivedBusinessObject(item);
        if (item.targetKind !== "group" && !targetObject)
          return toast("恢复对象已不存在，业务状态未改变");
        openModal(
          `<div class="modal-head"><div class="modal-title">恢复${item.type}</div><button class="icon-btn close" data-close>×</button></div><form id="restoreForm"><div class="modal-body"><div class="detail-grid"><div class="detail-item"><label>恢复对象</label><div>${item.name}</div></div>${item.type === "集团公司" ? `<div class="detail-item"><label>集团编号</label><div>${item.businessNumber || item.groupSnapshot?.groupNumber || "—"}</div></div>` : ""}<div class="detail-item"><label>当前状态</label><div>已停用</div></div><div class="detail-item"><label>恢复顺序校验</label><div>通过</div></div><div class="detail-item"><label>任务生成影响</label><div>不补造停用期间历史任务</div></div></div><div class="role-note">确认后恢复操作立即生效且不生成审批流程。对象重新进入正常列表和候选；关键人仅从恢复时间起生成仍适用的未来任务。</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>恢复原因</label><textarea class="input" id="restoreReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字恢复原因"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认恢复</button></div></form>`,
        );
        $("#restoreForm").onsubmit = (e) => {
          e.preventDefault();
          const actionAt = recordCreatedAt();
          if (item.targetKind === "group") {
            if (!customerGroupNames.includes(item.name))
              customerGroupNames.push(item.name);
            customerGroupIndustries[item.name] =
              item.groupSnapshot?.industry || customerGroupIndustries[item.name] || "";
            customerGroupCreditCodes[item.name] =
              item.groupSnapshot?.creditCode ||
              customerGroupCreditCodes[item.name] ||
              "";
            customerGroupNumbers[item.name] =
              item.groupSnapshot?.groupNumber ||
              item.businessNumber ||
              customerGroupNumbers[item.name];
            pendingGroupStops.delete(item.name);
          } else {
            targetObject.archived = false;
            targetObject.pendingStop = false;
          }
          if (item.targetKind === "contact")
            ensureRegularTask(targetObject, DEMO_TODAY);
          Object.assign(item, {
            status: "正常",
            recoveryResult: "已恢复",
            recoveryReason: $("#restoreReason").value.trim(),
            recoveryOperator: currentUser.name,
            recoveredAt: actionAt,
          });
          closeOverlay();
          renderPage();
          toast("恢复已直接生效并记录操作历史");
        };
      }
