      function openRecord(personId, recordId) {
        const r = maintenanceRecords.find((x) => x.id === recordId);
        if (!r && !canCreateMaintenanceRecord())
          return toast("当前角色无新增维系记录权限");
        if (r && !canEditMaintenanceRecord(r))
          return toast("当前账号无权编辑该维系记录");
        const selectedPerson = personId
          ? contacts.find((x) => x.id === personId)
          : r
            ? contacts.find(
                (x) => x.name === r.person && x.company === r.company,
              )
            : null;
        const lockedPerson = r || personId ? selectedPerson : null;
        const visibleContacts = maintenanceContactCandidates();
        if (
          !r &&
          selectedPerson &&
          !visibleContacts.some((person) => person.id === selectedPerson.id)
        )
          return toast(
            currentUser.role === "director"
              ? "区域总监仅可为本区域省公司关键人新增维系记录"
              : "当前关键人不在可维系数据范围内",
          );
        openModal(
          `<div class="modal-head"><div class="modal-title">${r ? "编辑" : "新增"}维系记录</div><button class="icon-btn close" data-close>×</button></div><form id="recordForm"><div class="modal-body"><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>关键人</label>${
            lockedPerson
              ? `<input class="input" value="${lockedPerson.name}" disabled><input type="hidden" id="rfPerson" value="${lockedPerson.id}"><div class="list-sub">${r ? "维系记录关键人不可变更" : "关键人已锁定为当前关键人，如需调整请先切换关键人"}</div>`
              : `<select class="input" id="rfPerson" required><option value="" selected disabled>请选择关键人</option>${visibleContacts
                  .map(
                    (p) =>
                      `<option value="${p.id}">${p.name || "未填写"}-${p.company || "未填写"}-${p.title || "未填写"}</option>`,
                  )
                  .join("")}</select>`
          }</div>${r ? `<div class="form-group full"><label class="form-label">客户单位</label><input class="input" value="${lockedPerson?.company || ""}" disabled><div class="list-sub">维系记录关联的客户单位不可变更</div></div>` : '<div class="form-group full"><div class="role-note" id="recordTaskHint">请先选择关键人，系统将检查其日常维系任务。</div></div>'}<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>维系方式</label><select class="input" id="rfMethod">${["线下拜访", "电话", "微信", "视频会议", "邮件", "其他"].map((x) => `<option ${r?.method === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="form-group" id="rfOtherMethodGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>其他方式说明</label><input class="input" id="rfOtherMethod" minlength="2" maxlength="30" value="${r?.otherMethod || ""}" placeholder="请填写 2-30 字"></div>${r ? `<div class="form-group"><label class="form-label">记录编号</label><input class="input" value="${maintenanceRecordCode(r)}" disabled></div><div class="form-group"><label class="form-label">创建时间</label><input class="input" value="${r.createdAt || r.date}" disabled><div class="list-sub">系统自动记录，不可编辑</div></div>` : ""}<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>维系时间</label><input class="input" id="rfDate" type="datetime-local" max="${DEMO_TODAY}T23:59" value="${r?.maintenanceAt ? r.maintenanceAt.replace(" ", "T").slice(0, 16) : `${r?.date || DEMO_TODAY}T09:30`}" ${r?.taskId ? "disabled" : ""} required><div class="list-sub">${r?.taskId ? "已用于任务完成认定，不可直接修改" : "默认当前业务日，不得晚于当前时间或早于当前任职生效时间"}</div></div>${r ? "" : '<div class="form-group full" id="recordLateReasonGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>延迟登记原因</label><textarea class="input" id="recordLateReason" minlength="5" maxlength="500" placeholder="说明为何未在任务截止前完成系统登记"></textarea></div><div class="form-group full" id="recordLateEvidenceGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>补录证明材料</label><label class="file-box">＋ 上传能证明实际维系日期的材料<input id="recordLateEvidence" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" hidden multiple></label><div class="list-sub">至少一项；系统按客户层级和任务责任自动路由审批并抄送相关管理人</div></div>'}<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>沟通摘要</label><textarea class="input" id="rfSummary" minlength="5" maxlength="1000" required>${r?.summary || ""}</textarea></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户反馈</label><textarea class="input" id="rfFeedback" minlength="5" maxlength="1000" required>${r?.feedback || ""}</textarea></div><div class="form-group full"><label class="form-label">下一步计划</label><textarea class="input" id="rfNext" maxlength="1000">${r?.next || ""}</textarea></div><div class="form-group full"><label class="form-label">附件</label><label class="file-box">＋ 上传图片或办公文件（单文件≤20MB，最多9个，总计≤100MB）<input id="rfFiles" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" hidden multiple></label>${r?.attachments?.length ? `<div class="list-sub">已保留：${r.attachments.join("、")}</div>` : ""}</div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" id="recordSubmit" type="submit">保存记录</button></div></form>`,
        );
        if (r) {
          const title = document.querySelector(".modal-head .modal-title");
          if (title) title.textContent = "追加附件";
          [
            "#rfMethod",
            "#rfOtherMethod",
            "#rfDate",
            "#rfSummary",
            "#rfFeedback",
            "#rfNext",
          ].forEach((selector) => {
            const field = $(selector);
            if (field) field.disabled = true;
          });
          const submit = $("#recordSubmit");
          if (submit) submit.textContent = "追加附件";
        }
        const activeRegularTasks = (person) =>
          tasks.filter(
            (task) =>
              (task.personId
                ? task.personId === person.id
                : task.person === person.name) &&
              task.company === person.company &&
              task.pm === currentUser.name &&
              task.type === "常规维系" &&
              ["pending", "overdue"].includes(task.status),
          );
        const syncOtherMethod = () => {
          const isOther = $("#rfMethod").value === "其他";
          $("#rfOtherMethodGroup").style.display = isOther ? "block" : "none";
          $("#rfOtherMethod").required = isOther;
        };
        $("#rfMethod").onchange = syncOtherMethod;
        syncOtherMethod();
        const refreshTaskHint = () => {
          const hint = $("#recordTaskHint");
          if (!hint) return;
          const person = contacts.find(
            (item) => item.id === Number($("#rfPerson").value),
          );
          if (!person) {
            hint.textContent = "请先选择关键人，系统将检查其日常维系任务。";
            $("#recordLateReasonGroup").style.display = "none";
            $("#recordLateEvidenceGroup").style.display = "none";
            $("#recordLateReason").required = false;
            $("#recordSubmit").textContent = "保存记录";
            return;
          }
          const matches = activeRegularTasks(person),
            task = matches[0];
          hint.innerHTML = matches.length > 1
            ? `<strong>数据异常：</strong>当前关键人存在 ${matches.length} 条有效日常维系任务，请联系系统管理员处理后再提交。`
            : task
            ? `检测到当前关键人的日常维系任务：<strong>${task.title}</strong>（截止 ${task.due}）。保存本次记录将同时完成该任务，并按实际维系日生成下一期。`
            : "当前关键人没有待执行或逾期的日常维系任务，本次记录将作为主动维系独立保存。";
          const actualDate = $("#rfDate").value.slice(0, 10);
          const lateEntry =
            task?.status === "overdue" && actualDate <= task.due;
          $("#recordLateReasonGroup").style.display = lateEntry ? "block" : "none";
          $("#recordLateEvidenceGroup").style.display = lateEntry ? "block" : "none";
          $("#recordLateReason").required = lateEntry;
          $("#recordSubmit").textContent = lateEntry
            ? "提交补录审批"
            : "保存记录";
        };
        if (!r) {
          $("#rfPerson").onchange = refreshTaskHint;
          $("#rfDate").onchange = refreshTaskHint;
          refreshTaskHint();
        }
        $("#recordForm").onsubmit = (e) => {
          e.preventDefault();
          const p = contacts.find(
            (x) => x.id === Number($("#rfPerson").value),
          );
          if (!p) return toast("请选择关键人");
          if (r) {
            const recordFiles = Array.from($("#rfFiles").files);
            if (!recordFiles.length) return toast("请选择要追加的附件");
            const attachmentError = validateAttachmentFiles(recordFiles);
            if (attachmentError) return toast(attachmentError);
            if ((r.attachments?.length || 0) + recordFiles.length > 9)
              return toast("单条维系记录最多保留 9 个附件");
            r.attachments = [
              ...(r.attachments || []),
              ...recordFiles.map((file) => file.name),
            ];
            r.updatedAt = recordCreatedAt();
            closeOverlay();
            renderPage();
            return toast("附件已追加");
          }
          const matchingTasks = r ? [] : activeRegularTasks(p),
            linkedTask = matchingTasks[0];
          const maintenanceAt = $("#rfDate").value.replace("T", " ");
          const maintenanceDate = maintenanceAt.slice(0, 10);
          if (!maintenanceDate) return toast("请选择维系时间");
          if (
            maintenanceDate < (p.effectiveDate || "1900-01-01") ||
            maintenanceDate > DEMO_TODAY
          )
            return toast("维系时间不得早于当前任职生效日或晚于当前业务日");
          const otherMethod = $("#rfOtherMethod").value.trim();
          if ($("#rfMethod").value === "其他" && otherMethod.length < 2)
            return toast("请填写 2-30 字其他方式说明");
          const recordFiles = Array.from($("#rfFiles").files);
          const attachmentError = validateAttachmentFiles(recordFiles);
          if (attachmentError) return toast(attachmentError);
          if ((r?.attachments?.length || 0) + recordFiles.length > 9)
            return toast("单条维系记录最多保留 9 个附件");
          const data = {
              personId: p.id,
              person: p.name,
              company: p.company,
              method: $("#rfMethod").value,
              otherMethod:
                $("#rfMethod").value === "其他" ? otherMethod : "",
              date: maintenanceDate,
              maintenanceAt,
              createdAt: r?.createdAt || recordCreatedAt(),
              updatedAt: recordCreatedAt(),
              summary: $("#rfSummary").value,
              feedback: $("#rfFeedback").value,
              next: $("#rfNext").value,
              pm: r?.pm || currentUser.name,
              createdBy: r?.createdBy || currentUser.name,
              proxyOperator: r?.proxyOperator || "",
              proxyReason: r?.proxyReason || "",
              region: p.region,
              attachments: [
                ...(r?.attachments || []),
                ...recordFiles.map((file) => file.name),
              ],
              taskId: r?.taskId || linkedTask?.id,
            };
          if (matchingTasks.length > 1)
            return toast("当前关键人存在多条有效日常维系任务，请联系系统管理员");
          if (linkedTask?.status === "overdue" && data.date <= linkedTask.due) {
            const evidenceUploads = Array.from($("#recordLateEvidence").files);
            const evidenceError = validateAttachmentFiles(evidenceUploads, true);
            if (evidenceError) return toast(evidenceError);
            const evidenceFiles = evidenceUploads.map((file) => file.name);
            submitLateEntryApproval(
              linkedTask,
              { id: Date.now(), ...data },
              $("#recordLateReason").value,
              evidenceFiles,
            );
            closeOverlay();
            renderPage();
            return toast("维系记录已暂存，逾期补录申请已按责任路由提交审批");
          } else {
            const newRecord = { id: Date.now(), ...data };
            newRecord.code = maintenanceRecordCode(newRecord);
            maintenanceRecords.unshift(newRecord);
          }
          if (linkedTask) {
            const record = maintenanceRecords[0];
            finalizeTaskCompletion(
              linkedTask,
              record,
              data.date > linkedTask.due ? "late_completion" : "on_time",
            );
          }
          p.last = data.date;
          p.status = "健康";
          closeOverlay();
          renderPage();
          toast(
            r
              ? "维系记录已更新"
              : linkedTask
                ? "维系记录已保存，日常维系任务已完成并生成下一期"
                : "维系记录已保存",
          );
        };
      }

      function openRecordDetail(id) {
        const r = maintenanceRecords.find((x) => x.id === id);
        if (!r || !scopedRecords().some((x) => x.id === id))
          return toast("无权查看该维系记录");
        const linkedTask = tasks.find((task) => task.id === r.taskId);
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">维系记录详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">${r.person[0]}</div><div><div class="detail-name">${r.person}</div><div class="detail-sub">${r.company} · ${r.method}${r.method === "其他" ? `（${r.otherMethod || "未说明"}）` : ""}</div></div></div><div class="detail-grid"><div class="detail-item"><label>记录编号</label><div>${maintenanceRecordCode(r)}</div></div><div class="detail-item"><label>记录状态</label><div><span class="tag green">正式生效</span></div></div><div class="detail-item"><label>维系时间</label><div>${r.maintenanceAt || r.date}</div></div><div class="detail-item"><label>创建时间</label><div>${r.createdAt || "—"}</div></div><div class="detail-item"><label>更新时间</label><div>${r.updatedAt || r.createdAt || "—"}</div></div><div class="detail-item"><label>业务维系人</label><div>${r.pm}</div></div><div class="detail-item"><label>实际录入人</label><div>${r.createdBy || r.pm}${r.proxyOperator ? ' <span class="tag orange">管理员代办</span>' : ""}</div></div><div class="detail-item"><label>关联任务</label><div>${linkedTask ? linkedTask.executionCode : "未关联任务"}</div></div>${r.proxyOperator ? `<div class="detail-item full"><label>代办原因</label><div>${r.proxyReason}</div></div>` : ""}</div>${linkedTask ? '<div class="role-note">该记录已用于任务完成认定；关键人、任职、维系时间、关联任务和业务维系人均已锁定。</div>' : '<div class="role-note">该记录未关联任务；允许创建人在权限范围内修改维系方式、维系时间和内容，编辑不会再次自动匹配任务。</div>'}<div class="section-title">沟通摘要</div><p style="font-size:var(--font-size-body);line-height:var(--line-height-body)">${r.summary}</p><div class="section-title">客户反馈</div><p style="font-size:var(--font-size-body);line-height:var(--line-height-body)">${r.feedback}</p><div class="section-title">下一步计划</div><p style="font-size:var(--font-size-body);line-height:var(--line-height-body)">${r.next || "暂无"}</p><div class="section-title">附件</div>${r.attachments.map((x) => `<div class="list-row"><div class="avatar">附</div><div class="list-main"><div class="list-title">${x}</div><div class="list-sub">点击预览或下载将记录操作日志</div></div><button class="btn" data-action="preview-file">预览</button><button class="btn" data-action="download-file">下载</button></div>`).join("") || '<div class="role-note">无附件</div>'}</div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${canEditMaintenanceRecord(r) ? `<button class="btn btn-primary" data-action="edit-record" data-id="${r.id}">编辑记录</button>` : ""}</div>`,
        );
        const recordLockNote = [
          ...document.querySelectorAll(".drawer-body .role-note"),
        ].find((item) => item.textContent.includes("该记录"));
        if (recordLockNote)
          recordLockNote.textContent =
            "该记录保存后仅可追加附件；业务字段及已有附件均不可修改、删除或替换，追加附件不改变任务完成认定或关联关系。";
        const appendButton = document.querySelector(
          '[data-action="edit-record"]',
        );
        if (appendButton) appendButton.textContent = "追加附件";
      }

      function openPersonRecords(personId) {
        const person = scopedContacts().find((item) => item.id === personId);
        if (!person) return toast("无权查看该关键人的维系记录");
        const records = scopedRecords()
          .filter((record) => record.person === person.name)
          .sort((a, b) =>
            `${b.date} ${b.createdAt || ""}`.localeCompare(
              `${a.date} ${a.createdAt || ""}`,
            ),
          );
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">全部客户动态</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">${person.name[0]}</div><div><div class="detail-name">${person.name}</div><div class="detail-sub">${person.company} · 共 ${records.length} 条维系记录</div></div></div><div class="section-title">维系记录</div><div class="recent-records">${records.map((record) => `<button class="recent-record-item" type="button" data-action="record-detail" data-id="${record.id}"><span class="recent-record-date">${record.date}</span><span class="recent-record-summary">${record.summary}</span><span class="tag blue">${record.method}</span></button>`).join("") || '<div class="role-note">暂无维系记录</div>'}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${canCreateMaintenanceForPerson(person) ? `<button class="btn btn-primary" data-action="new-record" data-id="${person.id}">新增记录</button>` : ""}</div>`,
        );
      }
