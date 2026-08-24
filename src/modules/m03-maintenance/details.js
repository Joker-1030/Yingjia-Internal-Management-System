      function openTaskDetail(id) {
        const t = tasks.find((x) => x.id === id);
        if (!t || !scopedTasks().some((x) => x.id === id))
          return toast("无权查看该任务");
        const canExecute = taskCanTakeAction(t);
        const canChange = taskCanRequestChange(t);
        const hasPendingChange = approvals.some(
          (approval) =>
            approval.status === "pending" && approval.targetTaskId === t.id,
        );
        const record = taskRecord(t);
        const pendingRecord = pendingMaintenanceRecords.find(
          (item) => item.taskId === t.id && item.reviewStatus === "pending",
        );
        const completionPolicy = taskLateCompletionPolicy(t);
        const campaign = campaigns.find((item) => item.id === t.campaignId);
        const completionAudit =
          t.status === "done" || t.status === "late_entry_pending"
            ? `<div class="section-title">完成认定</div><div class="detail-grid"><div class="detail-item"><label>认定结果</label><div>${t.status === "late_entry_pending" ? "补录审核中" : completionTypeName(t.completionType)}</div></div><div class="detail-item"><label>曾经逾期</label><div>${t.everOverdue ? "是（审计事实保留）" : "否"}</div></div><div class="detail-item"><label>实际维系日期</label><div>${record?.date || pendingRecord?.date || t.completedAt || "待审核"}</div></div><div class="detail-item"><label>创建时间</label><div>${record?.createdAt || pendingRecord?.createdAt || "待审核"}</div></div><div class="detail-item"><label>执行逾期天数</label><div>${t.lateDays || 0} 天</div></div><div class="detail-item"><label>登记延迟天数</label><div>${t.entryDelayDays || pendingRecord?.entryDelayDays || 0} 天</div></div>${record?.proxyOperator ? `<div class="detail-item"><label>管理员代办</label><div>${record.proxyOperator}</div></div><div class="detail-item"><label>代办原因</label><div>${record.proxyReason}</div></div>` : ""}</div>`
            : "";
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">任务详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">任</div><div><div class="detail-name">${t.title}</div><div class="detail-sub">${taskDisplayType(t)} · ${taskStatusName(t.status, t)}</div></div></div><div class="detail-grid"><div class="detail-item"><label>任务编号</label><div>${t.parentTaskCode}</div></div><div class="detail-item"><label>任务执行记录编号</label><div>${t.executionCode}</div></div><div class="detail-item"><label>关键人 / 覆盖目标</label><div>${t.person}</div></div><div class="detail-item"><label>执行人</label><div>${t.pm} · ${t.executorRole || (t.company?.includes("有限公司") ? "区域总监" : "PM")}</div></div><div class="detail-item"><label>客户单位 / 集合</label><div>${t.company}</div></div><div class="detail-item"><label>任务类型</label><div>${t.type}</div></div><div class="detail-item"><label>生成时间</label><div>${t.createdAt || "2026-08-01 09:00"}</div></div><div class="detail-item"><label>更新时间</label><div>${t.updatedAt || t.createdAt || taskDataUpdatedAt}</div></div><div class="detail-item"><label>原截止时间</label><div>${t.originalDue || t.due} 23:59:59</div></div><div class="detail-item"><label>当前截止时间</label><div>${t.due} 23:59:59</div></div><div class="detail-item full"><label>执行要求</label><div>${t.requirement || campaign?.description || maintenanceConfig.requirements[t.level] || "完成客户沟通并记录反馈与下一步行动。"}</div></div><div class="detail-item full"><label>补完成策略</label><div>${completionPolicy.allowed ? completionPolicy.cutoff ? `允许补完成至 ${completionPolicy.cutoff} 23:59:59` : "允许逾期补完成且无截止日期" : "不允许逾期补完成"}</div></div>${t.type === "常规维系" ? '<div class="detail-item full"><label>逾期规则</label><div>超过当前截止后持续保持“当前逾期”，无补完成截止；直至逾期补完成或受控关闭</div></div>' : ""}${t.resumeDate ? `<div class="detail-item"><label>暂停至</label><div>${t.resumeDate}</div></div>` : ""}${taskIsHealthRisk(t) && t.status === "paused" ? '<div class="detail-item"><label>健康影响</label><div><span class="tag red">暂停中已超当前截止，仍计入健康风险</span></div></div>' : ""}${hasPendingChange ? '<div class="detail-item full"><label>任务变更</label><div><span class="tag yellow">存在审批中的延期、暂停或取消申请，不能重复发起</span></div></div>' : ""}${t.closeReason ? `<div class="detail-item"><label>关闭原因</label><div>${t.closeReason}</div></div>` : ""}</div>${completionAudit}<div class="section-title">流程记录</div><div class="timeline"><div class="timeline-item"><div class="timeline-title">${t.createdAt || "2026-08-01 09:00"} · 任务已生成</div><div class="timeline-content">系统根据${taskDisplayType(t)}规则生成并分配给${t.pm}</div></div>${t.everOverdue ? `<div class="timeline-item"><div class="timeline-title">${t.firstOverdueAt || addDays(t.due, 1)} · 首次转为当前逾期</div><div class="timeline-content">原截止日期 ${t.originalDue || t.due} 保留，后续完成不清除曾经逾期事实</div></div>` : ""}${t.status === "late_entry_pending" ? `<div class="timeline-item"><div class="timeline-title">${pendingRecord?.createdAt || recordCreatedAt()} · 已提交逾期补录审批</div><div class="timeline-content">实际维系日期 ${pendingRecord?.date || "待核对"}，按当前截止时间核验，等待${taskApprovalRoute(t).current}</div></div>` : ""}${t.status === "paused" ? `<div class="timeline-item"><div class="timeline-title">${t.pausedAt || "2026-08-10 10:00"} · 暂停审批已通过</div><div class="timeline-content">${t.resumeDate} 自动恢复；暂停期间超过当前截止仍计入健康风险</div></div>` : ""}${t.status === "done" ? `<div class="timeline-item"><div class="timeline-title">${record?.createdAt || t.completedAt || DEMO_TODAY} · 任务已完成</div><div class="timeline-content">${completionTypeName(t.completionType)}；已生成维系记录${t.type === "常规维系" ? "并按实际维系日续期" : ""}</div></div>` : ""}${t.status === "cancelled" ? `<div class="timeline-item"><div class="timeline-title">${t.closedAt || DEMO_TODAY} 16:00 · 任务已关闭</div><div class="timeline-content">${t.closeReason || "系统关闭"}</div></div>` : ""}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭详情链</button>${canChange && !hasPendingChange ? `<button class="btn" data-action="change-task" data-id="${t.id}">延期/取消/暂停</button>` : ""}${canExecute ? `<button class="btn btn-primary" data-complete="${t.id}">${currentUser.fullAccess ? "管理员代办完成" : "提交维系结果"}</button>` : ""}</div>`,
        );
      }

      function openTaskChange(id) {
        const t = tasks.find((x) => x.id === id);
        if (!t || !taskCanRequestChange(t))
          return toast("当前账号或任务状态不允许发起变更");
        if (
          approvals.some(
            (approval) =>
              approval.status === "pending" && approval.targetTaskId === t.id,
          )
        )
          return toast("该任务已有审批中的变更申请，请勿重复提交");
        const route = taskApprovalRoute(t);
        const changeOptions =
          t.type === "专项维系"
            ? "<option>取消</option><option>暂停维系至某日</option>"
            : "<option>延期</option><option>取消</option><option>暂停维系至某日</option>";
        openModal(
          `<div class="modal-head"><div class="modal-title">申请任务变更</div><button class="icon-btn close" data-close>×</button></div><form id="taskChangeForm"><div class="modal-body"><div class="role-note">${t.title}<br>${t.type === "专项维系" ? "专项执行项统一以专项结束日为截止日，不支持单独延期；" : ""}审批节点：${route.current}（${route.assignees.join("、") || "总裁兜底"}）；抄送：${route.ccUsers.join("、") || "无"}。</div><div class="form-group"><label class="form-label">变更类型 *</label><select class="input" id="changeType">${changeOptions}</select></div><div class="form-group" id="changeDateGroup"><label class="form-label" id="changeDateLabel">新截止日期 *</label><input class="input" id="changeDate" type="date" value="${addDays(DEMO_TODAY, 1)}" min="${addDays(DEMO_TODAY, 1)}" required><div class="list-sub" id="changeDateHint"></div></div><div class="form-group"><label class="form-label">申请原因 *</label><textarea class="input" id="changeReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交审批</button></div></form>`,
        );
        const refreshChangeFields = () => {
          const changeType = $("#changeType").value;
          const isCancel = changeType === "取消";
          const isDelay = changeType === "延期";
          $("#changeDateGroup").style.display = isCancel ? "none" : "block";
          $("#changeDate").required = !isCancel;
          $("#changeDateLabel").textContent = isDelay
            ? "新截止日期 *"
            : "暂停至 *";
          $("#changeDateHint").textContent = isDelay
            ? `须晚于当前截止 ${t.due}，最多延后 90 日`
            : "须晚于当前日期，最长暂停 365 日；暂停不改变当前截止";
          $("#changeDate").min = isDelay ? addDays(t.due, 1) : addDays(DEMO_TODAY, 1);
          $("#changeDate").max = isDelay ? addDays(t.due, 90) : addDays(DEMO_TODAY, 365);
          if (isCancel) {
            $("#changeDate").value = "";
          } else if (
            !$("#changeDate").value ||
            $("#changeDate").value < $("#changeDate").min ||
            $("#changeDate").value > $("#changeDate").max
          ) {
            $("#changeDate").value = $("#changeDate").min;
          }
        };
        $("#changeType").onchange = refreshChangeFields;
        refreshChangeFields();
        $("#taskChangeForm").onsubmit = (e) => {
          e.preventDefault();
          const changeType = $("#changeType").value;
          const changeDate = $("#changeDate").value;
          if (
            changeType !== "取消" &&
            (changeDate < $("#changeDate").min || changeDate > $("#changeDate").max)
          )
            return toast($("#changeDateHint").textContent);
          const typeLabel =
            changeType === "暂停维系至某日" ? "暂停" : changeType;
          approvals.unshift({
            id: Date.now(),
            code: nextBusinessCode("WF"),
            source: "manual",
            type: "任务" + typeLabel,
            title: `${t.person}${typeLabel}申请`,
            applicant: currentUser.name,
            region: t.region,
            current: route.current,
            status: "pending",
            date: recordCreatedAt(),
            reason: $("#changeReason").value,
            targetTaskId: t.id,
            changeType,
            changeDate:
              changeType === "取消" ? "" : changeDate,
            currentAssignees: route.assignees,
            expectedApprover: route.assignees[0] || "刘总",
            ccUsers: route.ccUsers,
            handledBy: [],
          });
          closeOverlay();
          toast("任务变更申请已提交");
        };
      }

      function openCampaignDetail(id) {
        const c = campaigns.find((x) => x.id === id);
        if (!c || !visibleCampaignsForCurrentUser().some((item) => item.id === id))
          return toast("专项不存在或无权查看");
        const children = (
          currentUser.fullAccess || ["president", "vp"].includes(currentUser.role)
            ? tasks
            : scopedTasks()
        ).filter((t) => t.campaignId === c.id);
        const local = taskSummaryNumbers(children);
        const status = taskThemeStatus({
          total: local.total,
          done: local.done,
          startDate: c.startDate,
          endDate: c.endDate,
        });
        const theme = taskThemes.find((item) => item.key === `campaign:${c.id}`);
        const isCoverage = c.category === "关键人覆盖 KPI";
        const coverageRows = c.coverageExecutions || [];
        const denominator = coverageRows.reduce(
          (sum, item) => sum + item.denominator,
          0,
        );
        const numerator = coverageRows.reduce(
          (sum, item) => sum + item.numerator,
          0,
        );
        const coverageRate = denominator
          ? Math.round((numerator / denominator) * 1000) / 10
          : 0;
        const reached = coverageRows.filter(
          (item) => item.status === "已达标",
        ).length;
        const targetLabel = isCoverage
          ? c.coverageDimension === "部门覆盖"
            ? `部门：${c.targetDepartment}`
            : `${c.positionSource || "标准岗位"}：${c.targetPosition}`
          : "—";
        const detailContent = `<div class="detail-grid"><div class="detail-item"><label>专项编号</label><div>${c.code}</div></div><div class="detail-item"><label>父任务编号</label><div>${theme?.code || "待生成"}</div></div><div class="detail-item"><label>专项分类</label><div>${c.category}</div></div><div class="detail-item"><label>发布人</label><div>${c.owner}</div></div><div class="detail-item"><label>有效期</label><div>${c.startDate} 至 ${c.endDate}</div></div><div class="detail-item"><label>目标范围</label><div>${c.scope}</div></div>${isCoverage ? `<div class="detail-item"><label>覆盖维度 / 目标</label><div>${c.coverageDimension} · ${targetLabel}</div></div><div class="detail-item"><label>目标覆盖率</label><div>${c.targetCoverageRate}%</div></div><div class="detail-item"><label>完成截止日期</label><div>${c.endDate}</div></div>` : `<div class="detail-item"><label>关键决策人</label><div>${c.decisionFilter || "全部"}</div></div><div class="detail-item"><label>任务标题模板</label><div>${c.taskTitleTemplate || "{{专项标题}} - {{关键人姓名}}"}</div></div><div class="detail-item"><label>逾期补完成</label><div>${c.allowLateCompletion ? `允许，最晚至 ${c.lateCompletionEndDate}` : "不允许"}</div></div>`}<div class="detail-item full"><label>执行说明</label><div>${c.description || "按发布条件完成专项要求"}</div></div><div class="detail-item"><label>更新时间</label><div>${c.updatedAt || "—"}</div></div></div>`;
        const dashboardContent = isCoverage
          ? `<div class="role-note"><strong>${c.coverageDimension} · ${targetLabel}</strong><br>目标岗位按标准岗位稳定 ID 精确匹配（不支持自定义口径）；省公司执行人是所属区域中心主管。</div><div class="metrics compact-metrics" style="grid-template-columns:repeat(4,1fr)">${metric("应覆盖单位", denominator, "当前有效分母")}${metric("已覆盖单位", numerator, `未覆盖 ${Math.max(denominator - numerator, 0)}`, "blue")}${metric("当前覆盖率", `${coverageRate}%`, `目标 ${c.targetCoverageRate}%`, coverageRate >= c.targetCoverageRate ? "green" : "red")}${metric("达标责任人", `${reached}/${coverageRows.length}`, `未达标 ${coverageRows.length - reached}`, "yellow")}</div><div class="table-wrap"><table><thead><tr><th>区域 / 责任人</th><th>应覆盖</th><th>已覆盖</th><th>未覆盖</th><th>当前覆盖率</th><th>目标覆盖率</th><th>差额</th><th>操作</th></tr></thead><tbody>${coverageRows.map((row) => `<tr><td>${row.region}<div class="list-sub">${row.owner}</div></td><td>${row.denominator}</td><td>${row.numerator}</td><td>${Math.max(row.denominator - row.numerator, 0)}</td><td><strong>${row.currentRate}%</strong></td><td>${row.targetRate}%</td><td>${Math.max(row.required - row.numerator, 0)} 家</td><td><button class="link" type="button" data-coverage-row="${row.owner}">查看客户单位</button></td></tr>`).join("") || '<tr><td colspan="8">当前范围没有可考核单位</td></tr>'}</tbody></table></div>`
          : `<div class="metrics compact-metrics" style="grid-template-columns:repeat(4,1fr)">${metric("有效总数", local.total, "当前有效执行项")}${metric("总完成率", local.total ? Math.round((local.done / local.total) * 100) + "%" : "--", `${local.done}/${local.total}`)}${metric("按期完成率", local.total ? Math.round((local.onTimeDone / local.total) * 100) + "%" : "--", `${local.onTimeDone}/${local.total}`, "blue")}${metric("逾期补录", local.lateEntryDone, `审核中 ${local.lateEntryPending}`, "yellow")}${metric("逾期补完成", local.lateCompletionDone, "不计入按期", "red")}${metric("补录审核中", local.lateEntryPending, "等待审批", "yellow")}${metric("已过期未完成", local.expired, "终态风险", "red")}</div>`;
        const executionContent = isCoverage
          ? `<div class="table-wrap"><table><thead><tr><th>执行人</th><th>分子 / 分母</th><th>目标需覆盖数</th><th>当前 / 目标覆盖率</th><th>首次达标时间</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${coverageRows.map((row) => `<tr><td><strong>${row.owner}</strong><div class="list-sub">${row.region}</div></td><td>${row.numerator} / ${row.denominator}</td><td>${row.required}</td><td>${row.currentRate}% / ${row.targetRate}%</td><td>${row.firstReachedAt}</td><td><span class="tag ${row.status === "已达标" ? "green" : "yellow"}">${row.status}</span></td><td>${row.updatedAt}</td><td><button class="link" type="button" data-coverage-row="${row.owner}">明细</button></td></tr>`).join("")}</tbody></table></div><div class="role-note">覆盖 KPI 由系统检测达标后自动完成，不提供人工“完成”按钮；有效期内覆盖下降会重新打开待办。</div>`
          : `${taskExecutionHeader("refresh-campaign-data", c.id)}${pmExecutionTable(children, `campaign-${c.id}`)}`;
        openDrawer(
          `<div class="drawer-head"><div><div class="modal-title">专项详情</div><div class="panel-sub">${c.code} · ${c.category}</div></div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">专</div><div><div class="detail-name">${c.name}</div><div class="detail-sub">${c.scope} · ${c.period}</div></div><div class="spacer"></div>${taskThemeStatusTag(status)}</div><div class="tabs"><button class="tab active" type="button" data-campaign-detail-tab="detail">专项详情</button><button class="tab" type="button" data-campaign-detail-tab="dashboard">数据看板</button><button class="tab" type="button" data-campaign-detail-tab="executions">执行明细</button></div><div data-campaign-detail-panel="detail">${detailContent}</div><div class="hidden" data-campaign-detail-panel="dashboard">${dashboardContent}</div><div class="hidden" data-campaign-detail-panel="executions">${executionContent}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${hasOperationPermission("tasks.publish_campaign") ? `<button class="btn btn-primary" data-action="edit-campaign" data-id="${c.id}">编辑专项</button>` : ""}</div>`,
        );
        document.querySelectorAll("[data-campaign-detail-tab]").forEach(
          (button) =>
            (button.onclick = () => {
              document
                .querySelectorAll("[data-campaign-detail-tab]")
                .forEach((item) => item.classList.toggle("active", item === button));
              document
                .querySelectorAll("[data-campaign-detail-panel]")
                .forEach((panel) =>
                  panel.classList.toggle(
                    "hidden",
                    panel.dataset.campaignDetailPanel !==
                      button.dataset.campaignDetailTab,
                  ),
                );
            }),
        );
        document.querySelectorAll("[data-coverage-row]").forEach(
          (button) =>
            (button.onclick = () => {
              const row = coverageRows.find(
                (item) => item.owner === button.dataset.coverageRow,
              );
              if (!row) return;
              openModal(
                `<div class="modal-head"><div class="modal-title">覆盖客户单位明细</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="detail-grid"><div class="detail-item"><label>责任人</label><div>${row.owner} · ${row.region}</div></div><div class="detail-item"><label>覆盖口径</label><div>${targetLabel}</div></div><div class="detail-item"><label>当前符合关键人数</label><div>${row.numerator}</div></div><div class="detail-item"><label>待办状态</label><div>${row.status}</div></div></div><div class="section-title">未覆盖单位</div><div class="role-note">${row.uncovered === "—" ? "当前责任范围已达到目标覆盖率" : `${row.uncovered} · 当前符合关键人数 0 · 需新增符合口径的关键人`}</div></div><div class="modal-foot"><button class="btn" data-close>关闭</button></div>`,
              );
            }),
        );
      }

      function openCampaign(id) {
        if (!hasOperationPermission("tasks.publish_campaign"))
          return toast("当前账号无发布或编辑专项权限");
        const c = campaigns.find((x) => x.id === id);
        openModal(
          `<div class="modal-head"><div class="modal-title">${c ? "编辑专项" : "发布专项"}</div><button class="icon-btn close" data-close>×</button></div><form id="campaignForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">专项分类 *</label><select class="input" id="camCategory" ${c ? "disabled" : ""} required><option ${c?.category !== "关键人覆盖 KPI" ? "selected" : ""}>专项维系</option><option ${c?.category === "关键人覆盖 KPI" ? "selected" : ""}>关键人覆盖 KPI</option></select><div class="list-sub">创建后不可修改</div></div><div class="form-group"><label class="form-label">专项编号</label><input class="input" value="${c?.code || "发布后自动生成"}" disabled></div><div class="form-group full"><label class="form-label">专项标题 *</label><input class="input" id="camName" minlength="2" maxlength="100" value="${c?.name || "AI数字员工产品专项推广"}" required></div><div class="section-title" style="grid-column:1/-1;margin:4px 0 0">目标条件</div><div class="form-group" data-maintenance-field><label class="form-label">目标行业</label><select class="input" id="camIndustry"><option value="">全部行业</option>${industries
            .filter((x) => x.enabled)
            .map(
              (x) =>
                `<option ${c?.targets?.industries?.includes(x.name) ? "selected" : ""}>${x.name}</option>`,
            )
            .join(
              "",
            )}</select></div><div class="form-group"><label class="form-label">目标集团 <span id="camGroupRequired"></span></label><select class="input" id="camGroup"><option value="">全部集团</option>${customerGroupNames.map((x) => `<option ${c?.targets?.groups?.includes(x) ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">目标区域</label><select class="input" id="camRegion"><option value="">全部区域</option>${regionsData.map((x) => `<option ${c?.targets?.regions?.includes(x.name) ? "selected" : ""}>${x.name}</option>`).join("")}</select></div><div class="form-group" data-maintenance-field><label class="form-label">关键人职级</label><select class="input" id="camLevel"><option>全部职级</option><option ${c?.targets?.levels?.includes("一级") ? "selected" : ""}>一级</option><option ${c?.targets?.levels?.includes("二级") ? "selected" : ""}>二级</option><option ${c?.targets?.levels?.includes("三级") ? "selected" : ""}>三级</option><option ${c?.targets?.levels?.includes("四级") ? "selected" : ""}>四级</option></select></div><div class="form-group" data-maintenance-field><label class="form-label">关键决策人</label><select class="input" id="camDecision"><option ${c?.decisionFilter === "全部" ? "selected" : ""}>全部</option><option ${c?.decisionFilter === "仅关键决策人" ? "selected" : ""}>仅关键决策人</option><option ${c?.decisionFilter === "排除关键决策人" ? "selected" : ""}>排除关键决策人</option></select></div><div class="form-group" data-maintenance-field><label class="form-label">关键人岗位</label><select class="input" id="camMaintenancePosition"><option value="">不限</option>${contactPositionCatalog.filter((item) => item.status === "正常").map((item) => `<option ${c?.targetPosition === item.name ? "selected" : ""}>${item.name}</option>`).join("")}</select><div class="list-sub">仅可选择标准岗位</div></div><div class="form-group" data-maintenance-field><label class="form-label">任务标题模板 *</label><input class="input" id="camTaskTemplate" maxlength="100" value="${c?.taskTitleTemplate || "{{专项标题}} - {{关键人姓名}}"}"><div class="list-sub">支持关键人姓名、客户单位、专项标题占位符</div></div><div class="form-group" data-kpi-field><label class="form-label">目标公司层级 *</label><select class="input" id="camCompanyLevel"><option ${c?.targets?.companyLevels?.includes("省公司") ? "selected" : ""}>省公司</option><option ${c?.targets?.companyLevels?.includes("市公司") ? "selected" : ""}>市公司</option><option ${c?.targets?.companyLevels?.includes("区县公司") ? "selected" : ""}>区县公司</option></select></div><div class="form-group" data-kpi-field><label class="form-label">覆盖维度 *</label><select class="input" id="camCoverageDimension"><option value="">请选择</option><option ${c?.coverageDimension === "部门覆盖" ? "selected" : ""}>部门覆盖</option><option ${c?.coverageDimension === "岗位覆盖" ? "selected" : ""}>岗位覆盖</option></select></div><div class="form-group" data-kpi-field id="camDepartmentGroup"><label class="form-label">目标部门 *</label><select class="input" id="camTargetDepartment" data-initial-value="${c?.targetDepartmentId || ""}"><option value="">请先选择集团</option></select></div><div class="form-group" data-kpi-field id="camPositionSourceGroup"><label class="form-label">岗位口径</label><input class="input" value="标准岗位（固定）" disabled><select class="input hidden" id="camPositionSource"><option value="标准岗位" selected>标准岗位</option></select><div class="list-sub">覆盖 KPI 仅支持标准岗位口径，按稳定岗位 ID 精确匹配</div></div><div class="form-group" data-kpi-field id="camTargetPositionGroup"><label class="form-label">目标岗位 *</label><select class="input" id="camTargetPositionStandard" data-initial-value="${c?.targetPositionId || ""}"><option value="">请先选择集团与公司层级</option></select><div class="list-sub" id="camPositionMatchNote">标准岗位按稳定 ID 精确匹配；覆盖 KPI 仅支持标准岗位</div></div><div class="form-group" data-kpi-field><label class="form-label">目标覆盖率 *</label><input class="input" id="camTargetRate" type="number" min="0.1" max="100" step="0.1" value="${c?.targetCoverageRate || 100}" required><div class="list-sub">按每名责任人分别达标，保留 1 位小数</div></div><div class="section-title" style="grid-column:1/-1;margin:4px 0 0">有效期与规则</div><div class="form-group"><label class="form-label">开始日期 *</label><input class="input" id="camStart" type="date" value="${c?.startDate || "2026-08-20"}" required></div><div class="form-group"><label class="form-label">结束日期 *</label><input class="input" id="camEnd" type="date" value="${c?.endDate || "2026-09-30"}" required></div><div class="form-group" data-maintenance-field><label class="form-label">逾期后允许补完成 *</label><select class="input" id="camAllowLate"><option value="false" ${!c?.allowLateCompletion ? "selected" : ""}>不允许</option><option value="true" ${c?.allowLateCompletion ? "selected" : ""}>允许</option></select></div><div class="form-group" data-maintenance-field id="camLateEndGroup"><label class="form-label">补完成截止日期 *</label><input class="input" id="camLateEnd" type="date" value="${c?.lateCompletionEndDate || ""}"><div class="list-sub">必须晚于专项结束日期</div></div><div class="form-group full"><label class="form-label">执行说明 *</label><textarea class="input" id="camDesc" minlength="5" maxlength="2000" required>${c?.description || "面向目标关键人完成专项要求，并按时提交执行结果。"}</textarea></div><div class="form-group full"><label class="form-label">发布前责任人预览</label><div class="role-note" id="camPreview"></div></div></div><div class="role-note">专项维系按关键人生成执行项；覆盖 KPI 按责任人生成唯一待办，由系统根据目标覆盖率自动判定完成。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">${c ? "预览影响并保存" : "确认发布"}</button></div></form>`,
        );
        const campaignCategory = () => c?.category || $("#camCategory").value;
        const selectedCampaignPosition = () => {
          const source = $("#camPositionSource").value;
          if (source === "标准岗位") {
            const position = contactPositionCatalog.find(
              (item) => item.id === $("#camTargetPositionStandard").value,
            );
            return {
              source,
              id: position?.id || "",
              name: position?.name || "",
            };
          }
          return { source, id: "", name: "" };
        };
        const campaignPreview = () => {
          const category = campaignCategory();
          const industry = $("#camIndustry").value;
          const group = $("#camGroup").value;
          const region = $("#camRegion").value;
          if (category === "专项维系") {
            const level = $("#camLevel").value;
            const decision = $("#camDecision").value;
            const position = $("#camMaintenancePosition").value.trim();
            const people = contacts.filter((person) => {
              const company = customers.find(
                (item) => item.name === person.company,
              );
              return (
                company &&
                contactIsActive(person) &&
                (!industry || company.industry === industry) &&
                (!group || company.group === group) &&
                (!region || regionsMatch(person.region, region)) &&
                (level === "全部职级" || person.level === level) &&
                (decision === "全部" ||
                  (decision === "仅关键决策人" && person.decision) ||
                  (decision === "排除关键决策人" && !person.decision)) &&
                (!position || person.positionName === position || person.title === position)
              );
            });
            const owners = [...new Set(people.map(contactOwnerName).filter(Boolean))];
            return { category, people, owners, companies: [], coverageRows: [] };
          }
          const companyLevel = $("#camCompanyLevel").value;
          const dimension = $("#camCoverageDimension").value;
          const targetDepartment = customerDepartments.find(
            (item) => String(item.id) === $("#camTargetDepartment").value,
          );
          const targetPosition = selectedCampaignPosition();
          const companies = customers.filter(
            (company) =>
              company.group === group &&
              company.level === companyLevel &&
              (!region || regionsMatch(company.region, region)),
          );
          const targetRate = Number($("#camTargetRate").value || 0);
          const ownerGroups = companies.reduce((groups, company) => {
            const owner = customerOwnerName(company) || "责任待配置";
            if (!groups[owner]) groups[owner] = [];
            groups[owner].push(company);
            return groups;
          }, {});
          const coverageRows = Object.entries(ownerGroups).map(
            ([owner, ownerCompanies]) => {
              const coveredCompanies = ownerCompanies.filter((company) =>
                contacts.some(
                  (person) =>
                    contactIsActive(person) &&
                    person.company === company.name &&
                    (dimension === "部门覆盖"
                      ? person.department === targetDepartment?.name
                      : targetPosition.source === "标准岗位"
                        ? person.positionSource === "standard" &&
                          person.positionId === targetPosition.id
                        : person.positionSource === "custom" &&
                          normalizePositionText(person.positionName).toLowerCase() ===
                            targetPosition.name.toLowerCase()),
                ),
              );
              const denominator = ownerCompanies.length;
              const numerator = coveredCompanies.length;
              const required = Math.ceil((denominator * targetRate) / 100);
              return {
                owner,
                region: ownerCompanies[0]?.region || "待配置",
                numerator,
                denominator,
                required,
                currentRate: denominator
                  ? Math.round((numerator / denominator) * 1000) / 10
                  : 0,
                targetRate,
                status: numerator >= required ? "已达标" : "待完成",
                uncovered: ownerCompanies
                  .filter((company) => !coveredCompanies.includes(company))
                  .map((company) => company.name)
                  .join("、") || "—",
              };
            },
          );
          return {
            category,
            people: [],
            owners: Object.keys(ownerGroups),
            companies,
            coverageRows,
          };
        };
        const refreshLateCompletionFields = () => {
          const allowed =
            campaignCategory() === "专项维系" &&
            $("#camAllowLate").value === "true";
          $("#camLateEndGroup").style.display = allowed ? "block" : "none";
          $("#camLateEnd").required = allowed;
          if (!allowed) $("#camLateEnd").value = "";
        };
        const refreshCampaignTargetCandidates = () => {
          const group = $("#camGroup").value;
          const companyLevel = $("#camCompanyLevel").value;
          const departmentSelect = $("#camTargetDepartment");
          const previousDepartment =
            departmentSelect.value ||
            departmentSelect.dataset.initialValue ||
            String(
              customerDepartments.find(
                (item) =>
                  item.group === group && item.name === c?.targetDepartment,
              )?.id || "",
            );
          const departments = customerDepartments.filter(
            (item) => !item.archived && item.group === group,
          );
          departmentSelect.innerHTML = group
            ? `<option value="">请选择${group}部门</option>${departments
                .map(
                  (item) =>
                    `<option value="${item.id}" ${String(item.id) === previousDepartment ? "selected" : ""}>${customerDepartmentPath(item)} · ${item.code}</option>`,
                )
                .join("")}`
            : '<option value="">请先选择集团</option>';
          departmentSelect.dataset.initialValue = "";

          const standardSelect = $("#camTargetPositionStandard");
          const previousPosition =
            standardSelect.value ||
            standardSelect.dataset.initialValue ||
            c?.targetPositionId ||
            contactPositionCatalog.find(
              (item) =>
                item.group === group && item.name === c?.targetPosition,
            )?.id ||
            "";
          const positions = contactPositionCatalog.filter(
            (item) =>
              item.status === "正常" &&
              item.group === group &&
              item.levels.includes(companyLevel),
          );
          standardSelect.innerHTML = group
            ? `<option value="">请选择${group}${companyLevel}标准岗位</option>${positions
                .map(
                  (item) =>
                    `<option value="${item.id}" ${item.id === previousPosition ? "selected" : ""}>${item.name} · ${item.code}</option>`,
                )
                .join("")}`
            : '<option value="">请先选择集团与公司层级</option>';
          standardSelect.dataset.initialValue = "";
          standardSelect.classList.remove("hidden");
          $("#camPositionMatchNote").textContent =
            "按稳定标准岗位 ID 精确匹配";
        };
        const refreshCampaignFields = () => {
          const isCoverage = campaignCategory() === "关键人覆盖 KPI";
          document.querySelectorAll("[data-maintenance-field]").forEach(
            (element) => element.classList.toggle("hidden", isCoverage),
          );
          document.querySelectorAll("[data-kpi-field]").forEach(
            (element) => element.classList.toggle("hidden", !isCoverage),
          );
          $("#camGroup").required = isCoverage;
          $("#camGroupRequired").textContent = isCoverage ? "*" : "";
          const departmentCoverage =
            $("#camCoverageDimension").value === "部门覆盖";
          $("#camDepartmentGroup").classList.toggle(
            "hidden",
            !isCoverage || !departmentCoverage,
          );
          $("#camPositionSourceGroup").classList.toggle(
            "hidden",
            !isCoverage || departmentCoverage,
          );
          $("#camTargetPositionGroup").classList.toggle(
            "hidden",
            !isCoverage || departmentCoverage,
          );
          refreshCampaignTargetCandidates();
          $("#camTargetDepartment").required = isCoverage && departmentCoverage;
          $("#camTargetPositionStandard").required =
            isCoverage &&
            !departmentCoverage &&
            $("#camPositionSource").value === "标准岗位";
          $("#camCoverageDimension").required = isCoverage;
          $("#camTaskTemplate").required = !isCoverage;
          refreshLateCompletionFields();
          const preview = campaignPreview();
          if (isCoverage) {
            $("#camPreview").innerHTML = preview.companies.length
              ? `预计考核 ${preview.companies.length} 家客户单位、生成 ${preview.coverageRows.filter((row) => row.status !== "已达标").length} 条责任人待办。${preview.coverageRows.map((row) => `<br>${row.region} · ${row.owner}：${row.numerator}/${row.denominator}，目标需覆盖 ${row.required} 家，${row.status}`).join("")}`
              : "当前条件下没有可考核的客户单位，不能发布。";
          } else {
            $("#camPreview").innerHTML = `预计匹配 ${preview.people.length} 名有效关键人，涉及 ${preview.owners.length} 名执行人；省公司关键人自动分配给所属区域总监。`;
          }
        };
        $("#camCategory").onchange = refreshCampaignFields;
        $("#camAllowLate").onchange = refreshLateCompletionFields;
        [
          "#camIndustry",
          "#camGroup",
          "#camRegion",
          "#camLevel",
          "#camDecision",
          "#camMaintenancePosition",
          "#camCompanyLevel",
          "#camCoverageDimension",
          "#camTargetDepartment",
          "#camPositionSource",
          "#camTargetPositionStandard",
          "#camTargetRate",
        ].forEach((selector) => {
          const element = $(selector);
          if (element)
            element.oninput = element.onchange = refreshCampaignFields;
        });
        refreshCampaignFields();
        $("#campaignForm").onsubmit = (e) => {
          e.preventDefault();
          const category = campaignCategory();
          const preview = campaignPreview();
          const industry = $("#camIndustry").value,
            group = $("#camGroup").value,
            region = $("#camRegion").value,
            level = $("#camLevel").value;
          const isCoverage = category === "关键人覆盖 KPI";
          const startDate = $("#camStart").value;
          const endDate = $("#camEnd").value;
          const duration = Math.round(
            (new Date(`${endDate}T00:00:00`) -
              new Date(`${startDate}T00:00:00`)) /
              86400000,
          );
          if (duration < 0) return toast("结束日期不能早于开始日期");
          if (duration > 365) return toast("专项有效期最长 366 日");
          const allowLateCompletion =
            !isCoverage && $("#camAllowLate").value === "true";
          const lateCompletionEndDate = isCoverage
            ? ""
            : $("#camLateEnd").value;
          if (
            allowLateCompletion &&
            lateCompletionEndDate <= endDate
          )
            return toast("补完成截止日期必须晚于专项结束日期");
          const coverageDimension = $("#camCoverageDimension").value;
          const targetDepartmentId = $("#camTargetDepartment").value;
          const targetDepartmentRecord = customerDepartments.find(
            (item) => String(item.id) === targetDepartmentId,
          );
          const targetDepartment = targetDepartmentRecord?.name || "";
          const selectedPosition = selectedCampaignPosition();
          const targetPosition = isCoverage
            ? selectedPosition.name
            : $("#camMaintenancePosition").value.trim();
          const targetCoverageRate = Number($("#camTargetRate").value || 0);
          if (isCoverage && !group) return toast("覆盖 KPI 必须选择一个集团公司");
          if (isCoverage && !coverageDimension)
            return toast("请选择部门覆盖或岗位覆盖");
          if (isCoverage && coverageDimension === "部门覆盖" && !targetDepartment)
            return toast("请选择目标部门");
          if (isCoverage && coverageDimension === "岗位覆盖" && !targetPosition)
            return toast("请选择目标标准岗位");
          if (
            isCoverage &&
            (!Number.isFinite(targetCoverageRate) ||
              targetCoverageRate < 0.1 ||
              targetCoverageRate > 100)
          )
            return toast("目标覆盖率须为 0.1%-100.0%");
          if (isCoverage && !preview.companies.length)
            return toast("当前范围没有可考核的客户单位");
          if (
            isCoverage &&
            !c &&
            preview.coverageRows.every((row) => row.status === "已达标")
          )
            return toast("全部责任人已达到目标，请提高目标或调整范围");
          const taskTitleTemplate = $("#camTaskTemplate").value.trim();
          const allowedTokens = new Set([
            "关键人姓名",
            "客户单位",
            "专项标题",
          ]);
          const unknownToken = [...taskTitleTemplate.matchAll(/\{\{([^}]+)\}\}/g)].find(
            (match) => !allowedTokens.has(match[1]),
          );
          if (!isCoverage && unknownToken)
            return toast(`任务标题模板不支持 {{${unknownToken[1]}} 占位符`);
          const companyLevel = $("#camCompanyLevel").value;
          const scope = isCoverage
            ? [group, companyLevel, region || "全部行政范围", coverageDimension].join(" · ")
            : [
                industry || "全部行业",
                group || "全部集团",
                region || "全部区域",
                level === "全部职级" ? "全部职级" : "职级" + level,
              ].join(" · ");
          const targets = {
            industries: industry ? [industry] : [],
            groups: group ? [group] : [],
            regions: region ? [region] : [],
            levels: level === "全部职级" ? [] : [level],
            companyLevels: isCoverage ? [companyLevel] : [],
          };
          const period = `${startDate.slice(5).replace("-", "/")} 至 ${endDate.slice(5).replace("-", "/")}`;
          const commonData = {
            category,
            name: $("#camName").value.trim(),
            scope,
            targets,
            period,
            startDate,
            endDate,
            description: $("#camDesc").value.trim(),
            allowLateCompletion,
            lateCompletionEndDate,
            decisionFilter: $("#camDecision").value,
            taskTitleTemplate,
            coverageDimension: isCoverage ? coverageDimension : "",
            targetDepartment:
              isCoverage && coverageDimension === "部门覆盖"
                ? targetDepartment
                : "",
            targetDepartmentId:
              isCoverage && coverageDimension === "部门覆盖"
                ? targetDepartmentId
                : "",
            targetPosition:
              isCoverage && coverageDimension === "岗位覆盖"
                ? targetPosition
                : !isCoverage
                  ? targetPosition
                  : "",
            positionSource:
              isCoverage && coverageDimension === "岗位覆盖"
                ? positionSource
                : "",
            targetPositionId:
              isCoverage &&
              coverageDimension === "岗位覆盖" &&
              positionSource === "标准岗位"
                ? selectedPosition.id
                : "",
            targetCoverageRate: isCoverage ? targetCoverageRate : 0,
            updatedAt: recordCreatedAt(),
          };
          if (c) {
            Object.assign(c, commonData);
            if (isCoverage)
              c.coverageExecutions = preview.coverageRows.map((row) => ({
                ...row,
                firstReachedAt:
                  row.status === "已达标" ? recordCreatedAt() : "—",
                updatedAt: recordCreatedAt(),
              }));
            tasks
              .filter(
                (task) =>
                  task.campaignId === c.id &&
                  !["cancelled"].includes(task.status),
              )
              .forEach((task) => {
                task.due = c.endDate;
                task.type = category;
                if (["pending", "overdue", "expired"].includes(task.status)) {
                  if (c.endDate >= DEMO_TODAY) {
                    task.status = "pending";
                    task.everOverdue = false;
                    delete task.firstOverdueAt;
                  } else {
                    const inLateWindow =
                      c.allowLateCompletion &&
                      c.lateCompletionEndDate >= DEMO_TODAY;
                    task.status = inLateWindow ? "overdue" : "expired";
                    task.everOverdue = true;
                    task.firstOverdueAt = addDays(c.endDate, 1);
                  }
                }
              });
          } else {
            const year = startDate.slice(0, 4);
            const nextSequence =
              Math.max(
                0,
                ...campaigns
                  .map((campaign) =>
                    String(campaign.code || "").match(
                      new RegExp(`^ZX-${year}-([0-9]{4})$`),
                    ),
                  )
                  .filter(Boolean)
                  .map((match) => Number(match[1])),
              ) + 1;
            const newCampaign = {
              id: Date.now(),
              code: `ZX-${year}-${String(nextSequence).padStart(4, "0")}`,
              owner: currentUser.name,
              ...commonData,
              customers: isCoverage
                ? preview.companies.length
                : new Set(preview.people.map((person) => person.company)).size,
              total: isCoverage
                ? preview.coverageRows.length
                : preview.people.length,
              done: isCoverage
                ? preview.coverageRows.filter((row) => row.status === "已达标").length
                : 0,
              overdue: 0,
              onTimeDone: 0,
              lateEntryDone: 0,
              lateCompletionDone: 0,
              lateEntryPending: 0,
              expired: 0,
              status: startDate > DEMO_TODAY ? "待开始" : "执行中",
              coverageExecutions: isCoverage
                ? preview.coverageRows.map((row) => ({
                    ...row,
                    firstReachedAt:
                      row.status === "已达标" ? recordCreatedAt() : "—",
                    updatedAt: recordCreatedAt(),
                  }))
                : [],
            };
            campaigns.unshift(newCampaign);
            const theme = ensureTaskTheme({
              key: `campaign:${newCampaign.id}`,
              type: category,
              name: newCampaign.name,
              campaignId: newCampaign.id,
              source: "manual",
            });
            const taskRows = isCoverage
              ? newCampaign.coverageExecutions.map((row) => ({
                  type: category,
                  title: `${newCampaign.name} - ${row.owner}`,
                  person: `${coverageDimension}待办`,
                  company: `${group}${companyLevel}`,
                  pm: row.owner,
                  region: row.region,
                  level: companyLevel,
                  status: row.status === "已达标" ? "done" : "pending",
                  completionType:
                    row.status === "已达标" ? "on_time" : "",
                  completedAt:
                    row.status === "已达标" ? recordCreatedAt() : "",
                  coverageNumerator: row.numerator,
                  coverageDenominator: row.denominator,
                  targetCoverageRate,
                }))
              : preview.people.map((person) => ({
                  type: category,
                  title: taskTitleTemplate
                    .replaceAll("{{关键人姓名}}", person.name)
                    .replaceAll("{{客户单位}}", person.company)
                    .replaceAll("{{专项标题}}", newCampaign.name),
                  personId: person.id,
                  person: person.name,
                  company: person.company,
                  pm: contactOwnerName(person),
                  region: person.region,
                  level: person.level,
                  status: "pending",
                }));
            taskRows.forEach((task, index) => {
              tasks.unshift({
                id: Date.now() + index + 1,
                campaignId: newCampaign.id,
                due: endDate,
                parentTaskCode: theme.code,
                executionCode: nextTaskExecutionCode(theme.code),
                source: "manual",
                ...task,
              });
            });
          }
          closeOverlay();
          renderPage();
          toast(c ? "专项已更新并完成影响重算" : "专项已发布并生成责任人执行项");
        };
      }

