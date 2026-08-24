      function addDays(dateString, days) {
        const [year, month, day] = dateString.split("-").map(Number);
        const d = new Date(Date.UTC(year, month - 1, day));
        d.setUTCDate(d.getUTCDate() + Number(days));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      }
      function ensureRegularTask(person, baseDate = DEMO_TODAY, first = false) {
        const company = customers.find((item) => item.name === person.company);
        if (!company) return false;
        const duplicate = tasks.some(
          (t) =>
            (t.personId ? t.personId === person.id : t.person === person.name) &&
            t.company === person.company &&
            t.type === "常规维系" &&
            !["done", "cancelled"].includes(t.status),
        );
        if (duplicate) return false;
        const theme = ensureTaskTheme({
          key: "regular:global",
          type: "常规维系",
          name: "关键人定期维系计划",
          source: "system",
        });
        tasks.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          parentTaskCode: theme.code,
          executionCode: nextTaskExecutionCode(theme.code),
          source: "system",
          type: "常规维系",
          title: `联系${person.name}，开展${first ? "首次" : "周期"}维系`,
          personId: person.id,
          person: person.name,
          company: person.company,
          pm: customerOwnerName(company),
          executorRole: company.level === "省公司" ? "区域总监" : "PM",
          region: person.region,
          due: addDays(baseDate, maintenanceConfig.cycles[person.level] || 30),
          status: "pending",
          level: person.level,
        });
        return true;
      }

      function datePart(value) {
        return String(value || "").slice(0, 10);
      }

      function dayDiff(from, to) {
        if (!from || !to || to <= from) return 0;
        return Math.ceil(
          (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) /
            86400000,
        );
      }

      function taskLateCompletionPolicy(task) {
        if (!task) return { allowed: false, cutoff: "" };
        if (task.type === "常规维系")
          return { allowed: true, cutoff: "" };
        if (task.type === "专项维系") {
          const campaign = campaigns.find((item) => item.id === task.campaignId);
          return {
            allowed: Boolean(campaign?.allowLateCompletion),
            cutoff: campaign?.lateCompletionEndDate || "",
          };
        }
        if (["生日关怀", "节假日关怀"].includes(task.type)) {
          const ruleType = task.type === "生日关怀" ? "birthday" : "holiday";
          const rule = ruleData.find(
            (item) =>
              item.type === ruleType &&
              item.status === "启用" &&
              (item.levels === "全部职级" ||
                String(item.levels).split(/[、,，]/).includes(task.level)),
          );
          const allowed = false;
          const days = 0;
          return {
            allowed,
            cutoff:
              task.lateCompletionEndDate ||
              (allowed && days > 0 ? addDays(task.due, days) : ""),
          };
        }
        return { allowed: false, cutoff: "" };
      }

      function lateCompletionBlockReason(task, actualDate) {
        if (!task || actualDate <= task.due) return "";
        const policy = taskLateCompletionPolicy(task);
        if (!policy.allowed) return `${task.type}不允许逾期补完成`;
        if (policy.cutoff && actualDate > policy.cutoff)
          return `已超过补完成截止日期 ${policy.cutoff}`;
        return "";
      }

      function taskApprovalRoute(task) {
        const company = customers.find((item) => item.name === task.company);
        if (company?.level === "省公司") {
          return {
            current: "市场副总审批",
            assignees: ["王静"],
            ccUsers: ["刘总"],
          };
        }
        const director = company
          ? regionDirectorForCustomer(company)
          : regionDirectorName(task.region);
        return {
          current: "区域总监审批",
          assignees: [director].filter(Boolean),
          ccUsers: ["王静", "刘总"].filter(
            (name) => name !== director,
          ),
        };
      }

      function finalizeTaskCompletion(task, record, completionType) {
        const person = contacts.find((item) =>
          task.personId
            ? item.id === task.personId
            : item.name === task.person && item.company === task.company,
        );
        task.status = "done";
        task.completedAt = record.date;
        task.completionType = completionType;
        task.recordId = record.id;
        task.everOverdue = task.everOverdue || completionType !== "on_time";
        if (task.everOverdue && !task.firstOverdueAt)
          task.firstOverdueAt = addDays(task.due, 1);
        task.lateDays = dayDiff(task.due, record.date);
        task.entryDelayDays = dayDiff(record.date, datePart(record.createdAt));
        if (task.type === "常规维系" && person)
          ensureRegularTask(person, record.date);
        if (person) {
          person.last = record.date;
          person.status = "健康";
        }
      }

      function submitLateEntryApproval(task, record, reason, evidenceFiles) {
        const route = taskApprovalRoute(task);
        record.reviewStatus = "pending";
        record.entryDelayDays = dayDiff(record.date, datePart(record.createdAt));
        pendingMaintenanceRecords.unshift(record);
        const approvalId = Date.now() + 1;
        approvals.unshift({
          id: approvalId,
          code: nextBusinessCode("WF"),
          source: "manual",
          type: "逾期补录",
          title: `${task.person}${task.type}逾期补录申请`,
          applicant: currentUser.name,
          region: task.region,
          current: route.current,
          status: "pending",
          date: record.createdAt,
          reason,
          targetTaskId: task.id,
          taskTitle: task.title,
          taskDue: task.due,
          actualDate: record.date,
          entryDelayDays: record.entryDelayDays,
          pendingRecordId: record.id,
          evidenceFiles,
          currentAssignees: route.assignees,
          expectedApprover: route.assignees[0] || "刘总",
          ccUsers: route.ccUsers,
          handledBy: [],
        });
        task.status = "late_entry_pending";
        task.everOverdue = true;
        task.firstOverdueAt = task.firstOverdueAt || addDays(task.due, 1);
        task.entryDelayDays = record.entryDelayDays;
        task.lateEntryApprovalId = approvalId;
      }

      function openCompleteTask(id) {
        const t = tasks.find((x) => x.id === id);
        if (!t || !taskCanTakeAction(t))
          return toast("无权完成该任务");
        const approvalRoute = taskApprovalRoute(t);
        openModal(
          `<div class="modal-head"><div class="modal-title">${currentUser.fullAccess ? "管理员代办完成" : "提交维系结果"}</div><button class="icon-btn close" data-close>×</button></div><form id="completeForm"><div class="modal-body"><div class="role-note">${t.title}<br>${t.company} · ${t.person} · 业务执行人 ${t.pm} · 截止 ${t.due}</div>${currentUser.fullAccess ? '<div class="form-group" style="margin-top:14px"><label class="form-label">代办原因 * <span class="panel-sub">5-500 字</span></label><textarea class="input" id="completeProxyReason" minlength="5" maxlength="500" required placeholder="说明管理员代办原因；不会改变业务执行人和 KPI 归属"></textarea></div>' : ""}<div class="form-grid"><div class="form-group"><label class="form-label">维系方式 *</label><select class="input" id="completeMethod"><option>电话</option><option>微信</option><option>线下拜访</option><option>视频会议</option><option>邮件</option></select></div><div class="form-group"><label class="form-label">实际维系日期 *</label><input class="input" id="completeDate" type="date" max="${DEMO_TODAY}" value="${DEMO_TODAY}" required></div><div class="form-group full"><div class="role-note" id="completionRecognition"></div></div><div class="form-group full" id="lateEntryReasonGroup"><label class="form-label">延迟登记原因 *</label><textarea class="input" id="lateEntryReason" minlength="5" maxlength="500" placeholder="说明为何未在任务截止前完成系统登记"></textarea></div><div class="form-group full" id="lateEntryEvidenceGroup"><label class="form-label">补录证明材料 *</label><label class="file-box">＋ 上传能证明实际维系日期的材料<input id="lateEntryEvidence" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" hidden multiple></label><div class="list-sub" id="lateEntryEvidenceNames">至少上传一项，审批节点：${approvalRoute.current}（${approvalRoute.assignees.join("、") || "总裁兜底"}）</div></div><div class="form-group full"><label class="form-label">沟通摘要 *</label><textarea class="input" id="completeSummary" minlength="5" maxlength="1000" required placeholder="记录本次沟通的重点内容"></textarea></div><div class="form-group full"><label class="form-label">客户反馈 *</label><textarea class="input" id="completeFeedback" minlength="5" maxlength="1000" required placeholder="记录客户的明确反馈"></textarea></div><div class="form-group full"><label class="form-label">下一步计划</label><textarea class="input" id="completeNext" maxlength="1000" placeholder="例如：8月18日前提交课程方案"></textarea></div><div class="form-group full"><label class="form-label">维系记录附件</label><label class="file-box">＋ 上传图片或办公文件（单文件≤20MB，最多9个，总计≤100MB）<input id="completeFiles" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" hidden multiple></label></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" id="completeSubmit" type="submit">${currentUser.fullAccess ? "确认代办并完成" : "提交并完成任务"}</button></div></form>`,
        );
        const refreshRecognition = () => {
          const actualDate = $("#completeDate").value;
          const wasOverdue = t.status === "overdue" || t.everOverdue;
          const lateEntry = wasOverdue && actualDate <= t.due;
          const lateCompletion = actualDate > t.due;
          $("#lateEntryReasonGroup").style.display = lateEntry ? "block" : "none";
          $("#lateEntryEvidenceGroup").style.display = lateEntry ? "block" : "none";
          $("#lateEntryReason").required = lateEntry;
          $("#completeSubmit").textContent = lateEntry
            ? currentUser.fullAccess
              ? "确认代办并提交补录审批"
              : "提交补录审批"
            : currentUser.fullAccess
              ? "确认代办并完成"
              : "提交并完成任务";
          if (lateEntry) {
            $("#completionRecognition").innerHTML = `<strong>认定：按期执行、逾期补录。</strong>任务不会立即完成，需${approvalRoute.current}；曾经逾期事实永久保留。`;
          } else if (lateCompletion) {
            const blockedReason = lateCompletionBlockReason(t, actualDate);
            $("#completionRecognition").innerHTML = blockedReason
              ? `<strong>${blockedReason}。</strong>可另行新增普通维系记录，但不能完成当前任务。`
              : `<strong>认定：逾期补完成。</strong>计入总完成率，不计入按期完成率，并保留执行逾期天数。`;
          } else {
            $("#completionRecognition").innerHTML = `<strong>认定：按期完成。</strong>提交后直接完成任务。`;
          }
        };
        $("#completeDate").onchange = refreshRecognition;
        $("#lateEntryEvidence").onchange = () => {
          const names = Array.from($("#lateEntryEvidence").files).map(
            (file) => file.name,
          );
          $("#lateEntryEvidenceNames").textContent = names.length
            ? names.join("、")
            : `至少上传一项，审批节点：${approvalRoute.current}（${approvalRoute.assignees.join("、") || "总裁兜底"}）`;
        };
        refreshRecognition();
        $("#completeForm").onsubmit = (e) => {
          e.preventDefault();
          const proxyReason = $("#completeProxyReason")?.value.trim() || "";
          if (currentUser.fullAccess && (proxyReason.length < 5 || proxyReason.length > 500))
            return toast("管理员代办原因需填写 5-500 字");
          const date = $("#completeDate").value,
            person = contacts.find((p) =>
              t.personId
                ? p.id === t.personId
                : p.name === t.person && p.company === t.company,
            );
          const completionFiles = Array.from($("#completeFiles").files);
          const completionFileError = validateAttachmentFiles(completionFiles);
          if (completionFileError) return toast(completionFileError);
          const createdAt = recordCreatedAt();
          const record = {
            id: Date.now(),
            taskId: t.id,
            personId: person?.id,
            person: t.person,
            company: t.company,
            method: $("#completeMethod").value,
            date,
            createdAt,
            summary: $("#completeSummary").value,
            feedback: $("#completeFeedback").value,
            next: $("#completeNext").value,
            pm: t.pm,
            region: t.region,
            createdBy: currentUser.name,
            proxyOperator: currentUser.fullAccess ? currentUser.name : "",
            proxyReason,
            attachments: completionFiles.map((file) => file.name),
          };
          const wasOverdue = t.status === "overdue" || t.everOverdue;
          const lateEntry = wasOverdue && date <= t.due;
          if (lateEntry) {
            const evidenceUploads = Array.from($("#lateEntryEvidence").files);
            const evidenceError = validateAttachmentFiles(evidenceUploads, true);
            if (evidenceError) return toast(evidenceError);
            const evidenceFiles = evidenceUploads.map((file) => file.name);
            submitLateEntryApproval(
              t,
              record,
              $("#lateEntryReason").value,
              evidenceFiles,
            );
            closeAllOverlays();
            renderPage();
            return toast(`逾期补录申请已提交${approvalRoute.current}`);
          }
          const lateCompletion = date > t.due;
          const blockedReason = lateCompletionBlockReason(t, date);
          if (lateCompletion && blockedReason) {
            if (t.type !== "常规维系") t.status = "expired";
            t.everOverdue = true;
            t.firstOverdueAt = t.firstOverdueAt || addDays(t.due, 1);
            closeAllOverlays();
            renderPage();
            return toast(`${blockedReason}，任务保留为已过期未完成`);
          }
          maintenanceRecords.unshift(record);
          finalizeTaskCompletion(
            t,
            record,
            lateCompletion ? "late_completion" : "on_time",
          );
          closeAllOverlays();
          renderPage();
          toast(
            lateCompletion
              ? "维系记录已保存，任务认定为逾期补完成"
              : t.type === "常规维系"
              ? "维系记录已保存，下一期任务已按实际完成日生成"
              : "维系记录已保存，任务已完成",
          );
        };
      }

      /* V1.1.0 product-review overrides: structured scopes and master-detail views. */


