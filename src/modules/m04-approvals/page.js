      function approvalRowsForRole() {
        return approvalsForView(approvalView);
      }

      function canActOnApproval(approval) {
        return (
          approval.status === "pending" &&
          canEmployeeAction("approvals.decide") &&
          approvalCurrentAssignees(approval).includes(currentUser.name)
        );
      }

      function approvalDisplayNode(approval) {
        const collaborationNode = activeApprovalCollaborationNode(approval);
        if (collaborationNode) return collaborationNode.title;
        if (approval.status === "pending") return approval.current;
        if (approval.rejectedBy && !approval.decidedBy) return "目标 PM 接收";
        const rejectedCollaboration = (approval.collaborationNodes || []).find(
          (node) => collaborationNodeState(node) === "rejected",
        );
        return rejectedCollaboration?.title || approvalFinalNodeTitle(approval);
      }

      function approvalStatusTone(status) {
        if (status === "approved") return "green";
        if (status === "approved_pending_effective") return "yellow";
        if (["rejected", "processing_failed", "paused_invalid_handler"].includes(status))
          return "red";
        if (status === "withdrawn") return "blue";
        return "yellow";
      }

      function renderApprovals() {
        applyDueCityHandoverApprovals();
        const rows = approvalRowsForRole();
        const counts = Object.fromEntries(
          ["pending", "done", "mine", "cc"].map((view) => [
            view,
            approvalsForView(view).length,
          ]),
        );
        const types = [...new Set(visibleApprovalsForCurrentUser().map((item) => item.type))];
        const applicants = [...new Set(visibleApprovalsForCurrentUser().map((item) => item.applicant))];
        const handlers = [
          ...new Set(
            visibleApprovalsForCurrentUser().flatMap((item) =>
              approvalCurrentAssignees(item),
            ),
          ),
        ].filter(Boolean);
        const html = (
          pageHead(
            "审批中心",
            "查看和发起审批",
            '<button class="btn btn-primary" type="button" data-action="approval-create">＋ 发起审批</button>',
          ) +
          `<section class="panel"><div class="tabs"><button class="tab ${approvalView === "pending" ? "active" : ""}" data-approval-view="pending">待我处理 <span class="tab-count">${counts.pending}</span></button><button class="tab ${approvalView === "done" ? "active" : ""}" data-approval-view="done">我已处理 <span class="tab-count">${counts.done}</span></button><button class="tab ${approvalView === "mine" ? "active" : ""}" data-approval-view="mine">我发起的 <span class="tab-count">${counts.mine}</span></button><button class="tab ${approvalView === "cc" ? "active" : ""}" data-approval-view="cc">抄送我的 <span class="tab-count">${counts.cc}</span></button></div><div class="toolbar" style="flex-wrap:wrap"><input class="input" id="approvalSearch" maxlength="100" placeholder="流程编号 / 业务对象关键词"><select aria-label="审批事项" class="input" id="approvalType"><option value="">全部审批事项</option>${types.map((type) => `<option>${type}</option>`).join("")}</select><select class="input" id="approvalApplicant"><option value="">全部申请人</option>${applicants.map((name) => `<option>${name}</option>`).join("")}</select><select class="input" id="approvalHandler"><option value="">全部当前处理人</option>${handlers.map((name) => `<option>${name}</option>`).join("")}</select><select class="input" id="approvalStatus"><option value="">全部状态</option><option value="pending">审批中</option><option value="paused_invalid_handler">处理人失效</option><option value="approved_pending_effective">已通过待生效</option><option value="approved">已通过</option><option value="rejected">已驳回</option><option value="withdrawn">已撤回</option><option value="processing_failed">已通过-业务处理失败</option></select><input class="input" id="approvalStartDate" type="date" title="发起日期起"><input class="input" id="approvalEndDate" type="date" title="发起日期止"><input class="input" id="approvalCompletedStart" type="date" title="完成日期起"><input class="input" id="approvalCompletedEnd" type="date" title="完成日期止">${filterActions('<button class="btn btn-primary" type="button" id="applyApprovalFilters">筛选</button><button class="btn" type="button" id="resetApprovalFilters">重置</button>')}</div><div class="table-wrap"><table data-paged-table="m04-approvals" style="min-width:1480px"><thead><tr><th>流程编号</th><th>审批事项</th><th>业务对象</th><th>申请人</th><th>发起时间</th><th>当前处理人</th><th>流程进度</th><th>完成时间</th><th>更新时间</th><th>操作</th></tr></thead><tbody id="approvalBody">${rows.map((a) => { const completedAt = a.decidedAt || a.rejectedAt || ""; const assignees = approvalCurrentAssignees(a); const handlerText = assignees.join("、") || a.decidedBy || a.expectedApprover || "—"; return `<tr data-page-row data-search="${a.code}${a.type}${a.title}${a.applicant}${approvalDisplayNode(a)}" data-type="${a.type}" data-applicant="${a.applicant}" data-handler="${assignees.join("|")}" data-status="${a.status}" data-date="${a.date.slice(0, 10)}" data-completed="${completedAt ? completedAt.slice(0, 10) : ""}"><td><strong>${a.code}</strong></td><td><span class="tag blue">${a.type}</span></td><td>${a.title}</td><td>${a.applicant}</td><td>${a.date}</td><td>${a.status === "paused_invalid_handler" ? `<span class="tag red">${assignees.join("、") || a.invalidHandler || "原处理人"} · 已失效</span>` : handlerText}</td><td>${approvalFlow(a)}</td><td>${completedAt || "—"}</td><td>${a.updatedAt || a.invalidatedAt || a.decidedAt || a.rejectedAt || a.date}</td><td><button class="link" data-action="approval-detail" data-id="${a.id}">查看</button></td></tr>`; }).join("") || `<tr data-empty-row><td colspan="10"><div class="empty"><div><div class="empty-icon">◇</div>当前分类暂无流程</div></div></td></tr>`}<tr data-filter-empty style="display:none"><td colspan="10"><div class="empty">未找到符合条件的审批，请调整条件或重置筛选</div></td></tr></tbody></table></div>${tablePagination("m04-approvals")}</section>`
        );
        return html;
      }
      function approvalStatusName(s) {
        return (
          {
            pending: "审批中",
            approved_pending_effective: "已通过待生效",
            approved: "已通过",
            rejected: "已驳回",
            withdrawn: "已撤回",
            processing_failed: "已通过-业务处理失败",
            paused_invalid_handler: "处理人失效",
          }[s] || s
        );
      }

      function bindApprovalFilters() {
        const controls = [
          "#approvalCode",
          "#approvalObjectName",
          "#approvalType",
          "#approvalApplicant",
          "#approvalHandler",
          "#approvalStatus",
          "#approvalStartDate",
          "#approvalEndDate",
          "#approvalCompletedStart",
          "#approvalCompletedEnd",
        ].map((selector) => $(selector));
        if (!controls[0]) return;
        const apply = () => {
          const [
            code,
            objectName,
            type,
            applicant,
            handler,
            status,
            start,
            end,
            completedStart,
            completedEnd,
          ] = controls.map((control) => control.value.trim());
          document.querySelectorAll("#approvalBody tr[data-search]").forEach(
            (row) => {
              const approvalId = row.querySelector('[data-action="approval-detail"]')?.dataset.id;
              const approval = approvals.find((item) => String(item.id) === String(approvalId));
              const visible =
                (!code || String(approval?.code || "").includes(code)) &&
                (!objectName || String(approval?.title || "").includes(objectName)) &&
                (!type || row.dataset.type === type) &&
                (!applicant || row.dataset.applicant === applicant) &&
                (!handler ||
                  (row.dataset.handler || "").split("|").includes(handler)) &&
                (!status || row.dataset.status === status) &&
                (!start || row.dataset.date >= start) &&
                (!end || row.dataset.date <= end) &&
                (!completedStart ||
                  (row.dataset.completed &&
                    row.dataset.completed >= completedStart)) &&
                (!completedEnd ||
                  (row.dataset.completed && row.dataset.completed <= completedEnd));
              row.classList.toggle("hidden", !visible);
            },
          );
          refreshUnifiedTablePagination("m04-approvals", true);
        };
        $("#applyApprovalFilters").onclick = apply;
        $("#resetApprovalFilters").onclick = () => {
          controls.forEach((control) => (control.value = ""));
          apply();
        };
      }
