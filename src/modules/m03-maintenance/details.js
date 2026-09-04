      function openTaskDetail(id) {
        const t = tasks.find((x) => x.id === id);
        if (!t || !scopedTasks().some((x) => x.id === id))
          return toast("无权查看该任务");
        const canExecute = taskCanTakeAction(t);
        const canChange = taskCanRequestChange(t);
        const record = taskRecord(t);
        const completionPolicy = taskLateCompletionPolicy(t);
        const campaign = campaigns.find((item) => item.id === t.campaignId);
        const completionAudit =
          t.status === "done"
            ? `<div class="section-title">完成认定</div><div class="detail-grid"><div class="detail-item"><label>认定结果</label><div>${completionTypeName(t.completionType)}</div></div><div class="detail-item"><label>曾经逾期</label><div>${t.everOverdue ? "是（审计事实保留）" : "否"}</div></div><div class="detail-item"><label>实际维系日期</label><div>${record?.date || t.completedAt || "—"}</div></div><div class="detail-item"><label>创建时间</label><div>${record?.createdAt || "—"}</div></div><div class="detail-item"><label>执行逾期天数</label><div>${t.lateDays || 0} 天</div></div><div class="detail-item"><label>登记延迟天数</label><div>${t.entryDelayDays || 0} 天</div></div>${record?.proxyOperator ? `<div class="detail-item"><label>管理员代办</label><div>${record.proxyOperator}</div></div><div class="detail-item"><label>代办原因</label><div>${record.proxyReason}</div></div>` : ""}</div>`
            : "";
        const employeeStopClosure =
          t.status === "cancelled" &&
          ["employee_deactivation", "employee_deactivation_handoff"].includes(
            t.cancellationSource || t.closureSource,
          )
            ? `<div class="detail-item"><label>${t.closureSource === "employee_deactivation_handoff" ? "关闭前状态" : "取消前状态"}</label><div>${escapeHtml(taskStatusName(t.statusBeforeClosure || t.statusBeforeCancellation, t))}</div></div><div class="detail-item"><label>实际操作人</label><div>${escapeHtml(t.closedBy || t.cancelledBy || "—")}</div></div><div class="detail-item full"><label>关联员工停用</label><div>${escapeHtml(t.employeeStopEmployeeName || t.pm)} · ${escapeHtml(t.employeeStopRecordId || "—")}</div></div>`
            : "";
        const autoClosed = [
          "paused_event_deadline",
          "employee_deactivation_handoff",
        ].includes(t.closureSource);
        const resumeTimeline = (t.resumeHistory || [])
          .map(
            (item) =>
              `<div class="timeline-item"><div class="timeline-title">${item.resumedAt} · 常规维系已恢复</div><div class="timeline-content">恢复前当前截止 ${item.previousDue}；按恢复时${item.level}、${item.cycleDays} 个自然日周期重算为 ${item.currentDue} 23:59:59</div></div>`,
          )
          .join("");
        const changeActionLabel = taskCanPause(t)
          ? "延期/取消/暂停"
          : "延期/取消";
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">任务详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">任</div><div><div class="detail-name">${t.title}</div><div class="detail-sub">${taskStatusName(t.status, t)}</div></div></div><div class="detail-grid"><div class="detail-item"><label>任务编号</label><div>${t.parentTaskCode}</div></div><div class="detail-item"><label>任务执行记录编号</label><div>${t.executionCode}</div></div><div class="detail-item"><label>关键人 / 覆盖目标</label><div>${t.person}</div></div><div class="detail-item"><label>执行人</label><div>${t.pm} · ${t.executorRole || (t.company?.includes("有限公司") ? "区域总监" : "PM")}</div></div><div class="detail-item"><label>客户单位 / 集合</label><div>${t.company}</div></div><div class="detail-item"><label>任务类型</label><div>${t.type}</div></div><div class="detail-item"><label>生成时间</label><div>${t.createdAt || "2026-08-01 09:00"}</div></div><div class="detail-item"><label>更新时间</label><div>${t.updatedAt || t.createdAt || "-"}</div></div><div class="detail-item"><label>原截止时间</label><div>${t.originalDue || t.due} 23:59:59</div></div><div class="detail-item"><label>当前截止时间</label><div>${t.due} 23:59:59</div></div><div class="detail-item full"><label>执行要求</label><div>${taskRequirementText(t)}</div></div><div class="detail-item full"><label>补完成策略</label><div>${completionPolicy.allowed ? completionPolicy.cutoff ? `允许补完成至 ${completionPolicy.cutoff} 23:59:59` : "允许逾期补完成且无截止日期" : "不允许逾期补完成"}</div></div>${t.type === "常规维系" ? '<div class="detail-item full"><label>逾期规则</label><div>超过当前截止后持续保持“当前逾期”，无补完成截止；直至逾期补完成或受控关闭</div></div>' : ""}${t.resumeDate ? `<div class="detail-item"><label>暂停至</label><div>${t.resumeDate}</div></div>` : ""}${t.status === "paused" ? '<div class="detail-item"><label>健康影响</label><div><span class="tag blue">暂停期间不计逾期与健康风险</span></div></div>' : ""}${t.closeReason ? `<div class="detail-item"><label>${autoClosed ? "关闭原因" : "取消原因"}</label><div>${escapeHtml(t.closeReason)}</div></div>` : ""}${employeeStopClosure}</div>${completionAudit}<div class="section-title">流程记录</div><div class="timeline"><div class="timeline-item"><div class="timeline-title">${t.createdAt || "2026-08-01 09:00"} · 任务已生成</div><div class="timeline-content">系统根据${taskDisplayType(t)}规则生成并分配给${t.pm}</div></div>${t.everOverdue ? `<div class="timeline-item"><div class="timeline-title">${t.firstOverdueAt || addDays(t.due, 1)} · 首次转为当前逾期</div><div class="timeline-content">原截止日期 ${t.originalDue || t.due} 保留，后续完成不清除曾经逾期事实</div></div>` : ""}${t.status === "paused" ? `<div class="timeline-item"><div class="timeline-title">${t.pausedAt || "2026-08-10 10:00"} · 暂停已确认</div><div class="timeline-content">计划 ${t.resumeDate} 恢复；暂停期间不形成当前逾期、曾经逾期或健康风险</div></div>` : ""}${resumeTimeline}${t.status === "done" ? `<div class="timeline-item"><div class="timeline-title">${record?.createdAt || t.completedAt || DEMO_TODAY} · 任务已完成</div><div class="timeline-content">${completionTypeName(t.completionType)}；已生成维系记录${t.type === "常规维系" ? "并按实际维系日续期" : ""}</div></div>` : ""}${t.status === "cancelled" ? `<div class="timeline-item"><div class="timeline-title">${escapeHtml(t.closedAt || DEMO_TODAY)} · ${autoClosed ? "任务已关闭" : "任务已取消"}</div><div class="timeline-content">${escapeHtml(t.closeReason || (autoClosed ? "系统自动关闭" : "系统取消"))}${t.employeeStopRecordId ? `；关联员工停用 ${escapeHtml(t.employeeStopRecordId)}` : ""}</div></div>` : ""}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭详情链</button>${canChange ? `<button class="btn" data-action="change-task" data-id="${t.id}">${changeActionLabel}</button>` : ""}${canExecute ? `<button class="btn btn-primary" data-complete="${t.id}">${currentUser.fullAccess ? "管理员代办完成" : "提交维系结果"}</button>` : ""}</div>`,
        );
      }

      function openTaskChange(id) {
        const t = tasks.find((x) => x.id === id);
        if (!t || !taskCanRequestChange(t))
          return toast("当前账号或任务状态不允许发起变更");
        const changeOptions = `<option>延期</option><option>取消</option>${
          taskCanPause(t) ? "<option>暂停维系至某日</option>" : ""
        }`;
        openModal(
          `<div class="modal-head"><div class="modal-title">任务变更</div><button class="icon-btn close" data-close>×</button></div><form id="taskChangeForm"><div class="modal-body"><div class="role-note">${t.title}<br>${t.type === "专项维系" ? "专项执行项统一以专项结束日为截止日，不支持单独延期；" : ""}确认前将再次校验当前任务状态，校验通过后直接生效。</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>变更类型</label><select class="input" id="changeType">${changeOptions}</select></div><div class="form-group" id="changeDateGroup"><label class="form-label" id="changeDateLabel"><span class="required-marker" aria-hidden="true">*</span>新截止日期</label><input class="input" id="changeDate" type="date" value="${addDays(DEMO_TODAY, 1)}" min="${addDays(DEMO_TODAY, 1)}" required><div class="list-sub" id="changeDateHint"></div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>变更原因</label><textarea class="input" id="changeReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认并生效</button></div></form>`,
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
            : "须晚于当前日期，最长暂停 365 日；暂停期间不形成逾期或健康风险";
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
          if (changeType === "暂停维系至某日" && !taskCanPause(t))
            return toast("仅当前未逾期且从未逾期的常规、生日或节假日任务可暂停");
          if (
            changeType !== "取消" &&
            (changeDate < $("#changeDate").min || changeDate > $("#changeDate").max)
          )
            return toast($("#changeDateHint").textContent);
          const typeLabel =
            changeType === "暂停维系至某日" ? "暂停" : changeType;
          const reason = $("#changeReason").value.trim();
          if (reason.length < 5 || reason.length > 500)
            return toast("变更原因须为 5-500 字");
          if (changeType === "取消") {
            t.status = "cancelled";
            t.closeReason = reason;
            t.closedAt = DEMO_TODAY;
          } else if (changeType === "延期") {
            t.originalDue = t.originalDue || t.due;
            t.due = changeDate;
            t.status = changeDate < DEMO_TODAY ? "overdue" : "pending";
          } else {
            if (!taskCanPause(t))
              return toast("任务状态已变化，不再满足暂停条件");
            t.originalDue = t.originalDue || t.due;
            t.status = "paused";
            t.resumeDate = changeDate;
            t.pausedAt = recordCreatedAt();
            t.everOverdue = false;
            delete t.firstOverdueAt;
            delete t.lateDays;
          }
          t.updatedAt = recordCreatedAt();
          closeOverlay();
          renderPage();
          toast(`任务${typeLabel}已生效`);
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
        const targetValue = (values, fallback = "全部") =>
          values?.length ? values.join("、") : fallback;
        const rangeDetails = isCoverage
          ? `<div class="detail-item"><label>目标集团</label><div>${targetValue(c.targets?.groups)}</div></div><div class="detail-item"><label>业务责任层级</label><div>${targetValue(c.targets?.companyLevels)}</div></div><div class="detail-item"><label>业务责任区域</label><div>${targetValue(c.targets?.regions)}</div></div><div class="detail-item"><label>覆盖维度</label><div>${c.coverageDimension}</div></div><div class="detail-item"><label>${c.coverageDimension === "部门覆盖" ? "目标部门" : "目标岗位"}</label><div>${targetLabel.replace(/^部门：|^标准岗位：/, "")}</div></div><div class="detail-item"><label>目标覆盖率</label><div>${c.targetCoverageRate}%</div></div>`
          : `<div class="detail-item"><label>目标行业</label><div>${targetValue(c.targets?.industries)}</div></div><div class="detail-item"><label>目标集团</label><div>${targetValue(c.targets?.groups)}</div></div><div class="detail-item"><label>目标区域</label><div>${targetValue(c.targets?.regions)}</div></div><div class="detail-item"><label>关键人职级</label><div>${targetValue(c.targets?.levels, "全部职级")}</div></div><div class="detail-item"><label>关键决策人</label><div>${c.decisionFilter || "全部"}</div></div><div class="detail-item"><label>关键人岗位</label><div>${c.targetPosition || "不限"}</div></div>`;
        const detailContent = `<div class="detail-grid"><div class="detail-item"><label>任务编号</label><div>${c.code || theme?.code || "待生成"}</div></div><div class="detail-item"><label>任务类型</label><div>${c.category}</div></div><div class="detail-item"><label>开始时间</label><div>${c.startDate}</div></div><div class="detail-item"><label>结束时间</label><div>${c.endDate}</div></div><div class="detail-item"><label>更新时间</label><div>${c.updatedAt || "-"}</div></div><div class="detail-item"><label>发布人</label><div>${c.owner}</div></div>${rangeDetails}${isCoverage ? "" : `<div class="detail-item full"><label>任务标题模板</label><div>${c.taskTitleTemplate || "{{专项标题}} - {{关键人姓名}}"}</div></div><div class="detail-item"><label>逾期补完成</label><div>${c.allowLateCompletion ? `允许，最晚至 ${c.lateCompletionEndDate}` : "不允许"}</div></div>`}<div class="detail-item full"><label>执行说明</label><div>${c.description || "按发布条件完成专项要求"}</div></div></div>`;
        const dashboardContent = isCoverage
          ? `<div class="role-note"><strong>${c.coverageDimension} · ${targetLabel}</strong><br>目标岗位按标准岗位稳定 ID 精确匹配（不支持自定义口径）；省公司执行人是所属区域中心主管。</div><div class="metrics compact-metrics" style="grid-template-columns:repeat(4,1fr)">${metric("应覆盖单位", denominator, "当前有效分母")}${metric("已覆盖单位", numerator, `未覆盖 ${Math.max(denominator - numerator, 0)}`, "blue")}${metric("当前覆盖率", `${coverageRate}%`, `目标 ${c.targetCoverageRate}%`, coverageRate >= c.targetCoverageRate ? "green" : "red")}${metric("达标责任人", `${reached}/${coverageRows.length}`, `未达标 ${coverageRows.length - reached}`, "yellow")}</div><div class="table-wrap"><table><thead><tr><th>区域 / 责任人</th><th>应覆盖</th><th>已覆盖</th><th>未覆盖</th><th>当前覆盖率</th><th>目标覆盖率</th><th>差额</th><th>操作</th></tr></thead><tbody>${coverageRows.map((row) => `<tr><td>${row.region}<div class="list-sub">${row.owner}</div></td><td>${row.denominator}</td><td>${row.numerator}</td><td>${Math.max(row.denominator - row.numerator, 0)}</td><td><strong>${row.currentRate}%</strong></td><td>${row.targetRate}%</td><td>${Math.max(row.required - row.numerator, 0)} 家</td><td><button class="link" type="button" data-coverage-row="${row.owner}">查看客户单位</button></td></tr>`).join("") || '<tr><td colspan="8">当前范围没有可考核单位</td></tr>'}</tbody></table></div>`
          : `<div class="metrics compact-metrics" style="grid-template-columns:repeat(4,1fr)">${metric("有效总数", local.total, "当前有效执行项")}${metric("总完成率", local.total ? Math.round((local.done / local.total) * 100) + "%" : "--", `${local.done}/${local.total}`)}${metric("按期完成率", local.total ? Math.round((local.onTimeDone / local.total) * 100) + "%" : "--", `${local.onTimeDone}/${local.total}`, "blue")}${metric("逾期补录", local.lateEntryDone, "校验后直接认定按期", "yellow")}${metric("逾期补完成", local.lateCompletionDone, "不计入按期", "red")}${metric("已过期未完成", local.expired, "终态风险", "red")}</div>`;
        const executionContent = isCoverage
          ? `${taskExecutionHeader("refresh-campaign-data", c.id)}<div class="table-wrap"><table><thead><tr><th>执行人</th><th>分子 / 分母</th><th>目标需覆盖数</th><th>当前 / 目标覆盖率</th><th>首次达标时间</th><th>状态</th></tr></thead><tbody>${coverageRows.map((row) => `<tr><td><strong>${row.owner}</strong><div class="list-sub">${row.region}</div></td><td>${row.numerator} / ${row.denominator}</td><td>${row.required}</td><td>${row.currentRate}% / ${row.targetRate}%</td><td>${row.firstReachedAt}</td><td><span class="tag ${row.status === "已达标" ? "green" : "yellow"}">${row.status}</span></td></tr>`).join("")}</tbody></table></div><div class="role-note">覆盖 KPI 由系统检测达标后自动完成，不提供人工“完成”按钮；有效期内覆盖下降会重新打开待办。</div>`
          : `${taskExecutionHeader("refresh-campaign-data", c.id)}${pmExecutionTable(children, `campaign-${c.id}`)}`;
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">任务详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">专</div><div class="detail-name">${c.name}</div><div class="spacer"></div>${taskThemeStatusTag(status)}</div><div class="tabs"><button class="tab active" type="button" data-campaign-detail-tab="detail">任务详情</button><button class="tab" type="button" data-campaign-detail-tab="dashboard">数据看板</button><button class="tab" type="button" data-campaign-detail-tab="executions">执行明细</button></div><div data-campaign-detail-panel="detail">${detailContent}</div><div class="hidden" data-campaign-detail-panel="dashboard">${dashboardContent}</div><div class="hidden" data-campaign-detail-panel="executions">${executionContent}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${hasOperationPermission("tasks.publish_campaign") ? `<button class="btn btn-primary" data-action="edit-campaign" data-id="${c.id}">编辑专项</button>` : ""}</div>`,
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
          `<div class="modal-head"><div class="modal-title">${c ? "编辑专项" : "发布专项"}</div><button class="icon-btn close" data-close>×</button></div><form id="campaignForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>专项分类</label><select class="input" id="camCategory" ${c ? "disabled" : ""} required><option ${c?.category !== "关键人覆盖 KPI" ? "selected" : ""}>专项维系</option><option ${c?.category === "关键人覆盖 KPI" ? "selected" : ""}>关键人覆盖 KPI</option></select><div class="list-sub">创建后不可修改</div></div><div class="form-group"><label class="form-label">任务编号</label><input class="input" value="${c?.code || "发布后自动生成"}" disabled></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>专项标题</label><input class="input" id="camName" minlength="2" maxlength="100" value="${c?.name || "AI数字员工产品专项推广"}" required></div><div class="section-title" style="grid-column:1/-1;margin:4px 0 0">目标条件</div><div class="form-group" data-maintenance-field><label class="form-label">目标行业</label><select class="input" id="camIndustry"><option value="">全部行业</option>${industries
            .filter((x) => x.enabled)
            .map(
              (x) =>
                `<option ${c?.targets?.industries?.includes(x.name) ? "selected" : ""}>${x.name}</option>`,
            )
            .join(
              "",
            )}</select></div><div class="form-group"><label class="form-label"><span id="camGroupRequired"></span>目标集团</label><select class="input" id="camGroup"><option value="">全部集团</option>${customerGroupNames.map((x) => `<option ${c?.targets?.groups?.includes(x) ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">目标区域</label><select class="input" id="camRegion"><option value="">全部区域</option>${regionsData.map((x) => `<option ${c?.targets?.regions?.includes(x.name) ? "selected" : ""}>${x.name}</option>`).join("")}</select></div><div class="form-group" data-maintenance-field><label class="form-label">关键人职级</label><select class="input" id="camLevel"><option>全部职级</option><option ${c?.targets?.levels?.includes("一级") ? "selected" : ""}>一级</option><option ${c?.targets?.levels?.includes("二级") ? "selected" : ""}>二级</option><option ${c?.targets?.levels?.includes("三级") ? "selected" : ""}>三级</option><option ${c?.targets?.levels?.includes("四级") ? "selected" : ""}>四级</option></select></div><div class="form-group" data-maintenance-field><label class="form-label">关键决策人</label><select class="input" id="camDecision"><option ${c?.decisionFilter === "全部" ? "selected" : ""}>全部</option><option ${c?.decisionFilter === "仅关键决策人" ? "selected" : ""}>仅关键决策人</option><option ${c?.decisionFilter === "排除关键决策人" ? "selected" : ""}>排除关键决策人</option></select></div><div class="form-group" data-maintenance-field><label class="form-label">关键人岗位</label><select class="input" id="camMaintenancePosition"><option value="">不限</option>${contactPositionCatalog.filter((item) => item.status === "正常").map((item) => `<option ${c?.targetPosition === item.name ? "selected" : ""}>${item.name}</option>`).join("")}</select><div class="list-sub">仅可选择标准岗位</div></div><div class="form-group" data-maintenance-field><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>任务标题模板</label><input class="input" id="camTaskTemplate" maxlength="100" value="${c?.taskTitleTemplate || "{{专项标题}} - {{关键人姓名}}"}"><div class="list-sub">支持关键人姓名、客户单位、专项标题占位符</div></div><div class="form-group" data-kpi-field><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标公司层级</label><select class="input" id="camCompanyLevel"><option ${c?.targets?.companyLevels?.includes("省公司") ? "selected" : ""}>省公司</option><option ${c?.targets?.companyLevels?.includes("市公司") ? "selected" : ""}>市公司</option><option ${c?.targets?.companyLevels?.includes("区县公司") ? "selected" : ""}>区县公司</option></select></div><div class="form-group" data-kpi-field><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>覆盖维度</label><select class="input" id="camCoverageDimension"><option value="">请选择</option><option ${c?.coverageDimension === "部门覆盖" ? "selected" : ""}>部门覆盖</option><option ${c?.coverageDimension === "岗位覆盖" ? "selected" : ""}>岗位覆盖</option></select></div><div class="form-group" data-kpi-field id="camDepartmentGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标部门</label><select class="input" id="camTargetDepartment" data-initial-value="${c?.targetDepartmentId || ""}"><option value="">请先选择集团</option></select></div><div class="form-group" data-kpi-field id="camPositionSourceGroup"><label class="form-label">岗位口径</label><input class="input" value="标准岗位（固定）" disabled><select class="input hidden" id="camPositionSource"><option value="标准岗位" selected>标准岗位</option></select><div class="list-sub">覆盖 KPI 仅支持标准岗位口径，按稳定岗位 ID 精确匹配</div></div><div class="form-group" data-kpi-field id="camTargetPositionGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标岗位</label><select class="input" id="camTargetPositionStandard" data-initial-value="${c?.targetPositionId || ""}"><option value="">请先选择集团与公司层级</option></select><div class="list-sub" id="camPositionMatchNote">标准岗位按稳定 ID 精确匹配；覆盖 KPI 仅支持标准岗位</div></div><div class="form-group" data-kpi-field><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>目标覆盖率</label><input class="input" id="camTargetRate" type="number" min="0.1" max="100" step="0.1" value="${c?.targetCoverageRate || 100}" required><div class="list-sub">按每名责任人分别达标，保留 1 位小数</div></div><div class="section-title" style="grid-column:1/-1;margin:4px 0 0">有效期与规则</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>开始日期</label><input class="input" id="camStart" type="date" value="${c?.startDate || "2026-08-20"}" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>结束日期</label><input class="input" id="camEnd" type="date" value="${c?.endDate || "2026-09-30"}" required></div><div class="form-group" data-maintenance-field><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>逾期后允许补完成</label><select class="input" id="camAllowLate"><option value="false" ${!c?.allowLateCompletion ? "selected" : ""}>不允许</option><option value="true" ${c?.allowLateCompletion ? "selected" : ""}>允许</option></select></div><div class="form-group" data-maintenance-field id="camLateEndGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>补完成截止日期</label><input class="input" id="camLateEnd" type="date" value="${c?.lateCompletionEndDate || ""}"><div class="list-sub">必须晚于专项结束日期</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>执行说明</label><textarea class="input" id="camDesc" minlength="5" maxlength="2000" required>${c?.description || "面向目标关键人完成专项要求，并按时提交执行结果。"}</textarea></div><div class="form-group full"><label class="form-label">发布前责任人预览</label><div class="role-note" id="camPreview"></div></div></div><div class="role-note">专项维系按关键人生成执行项；覆盖 KPI 按责任人生成唯一待办，由系统根据目标覆盖率自动判定完成。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">${c ? "预览影响并保存" : "确认发布"}</button></div></form>`,
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
          $("#camGroupRequired").innerHTML = isCoverage
            ? '<span class="required-marker" aria-hidden="true">*</span>'
            : "";
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
            const newCampaign = {
              id: Date.now(),
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
            newCampaign.code = theme.code;
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
                requirement: newCampaign.description,
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
