      let selectedPersonDetailTab = "base";
      let selectedPersonTaskScope = "unfinished";
      function personDetailCanMaintain(person) {
        return canMaintainContact(person);
      }
      function bindPersonDetailInteractions(person) {
        document.querySelectorAll("#overlay [data-person-detail-tab]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedPersonDetailTab = button.dataset.personDetailTab;
              renderPersonDetail(person);
            }),
        );
        document.querySelectorAll("#overlay [data-person-task-scope]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedPersonTaskScope = button.dataset.personTaskScope;
              renderPersonDetail(person);
            }),
        );
      }
      function personTaskOrder(task) {
        if (task.status === "overdue") return 1;
        if (task.status === "pending" && task.due === DEMO_TODAY) return 2;
        if (
          task.status === "pending" &&
          task.due > DEMO_TODAY &&
          task.due <= addDays(DEMO_TODAY, 7)
        )
          return 3;
        if (task.status === "pending") return 4;
        if (task.status === "paused") return 5;
        if (task.status === "late_entry_pending") return 6;
        return 7;
      }
      function personTaskEndTime(task) {
        return task.completedAt || task.closedAt || task.updatedAt || task.due || "";
      }
      function sortPersonTasks(left, right) {
        const orderDifference = personTaskOrder(left) - personTaskOrder(right);
        if (orderDifference) return orderDifference;
        if (personTaskOrder(left) === 7)
          return (
            personTaskEndTime(right).localeCompare(personTaskEndTime(left)) ||
            right.executionCode.localeCompare(left.executionCode)
          );
        return (
          left.due.localeCompare(right.due) ||
          left.executionCode.localeCompare(right.executionCode)
        );
      }
      function taskMatchesPersonIdentity(task, person) {
        if (task.personId != null)
          return String(task.personId) === String(person.id);
        if (task.person !== person.name) return false;
        const employmentCompanies = new Set([
          person.company,
          ...(person.employmentHistory || []).map((history) => history.company),
        ]);
        return employmentCompanies.has(task.company);
      }
      function renderPersonDetail(person, initial = false) {
        const personTasks = scopedTasks()
          .filter((task) => taskMatchesPersonIdentity(task, person))
          .sort(sortPersonTasks);
        const currentEmploymentTasks = personTasks.filter(
          (task) => task.company === person.company,
        );
        const activeTasks = currentEmploymentTasks.filter(
          (task) => !["done", "cancelled", "expired"].includes(task.status),
        );
        const records = scopedRecords()
          .filter(
            (record) =>
              record.person === person.name && record.company === person.company,
          )
          .sort((left, right) => right.date.localeCompare(left.date));
        const relatedApprovals = visibleApprovalsForCurrentUser().filter(
          (approval) =>
            approval.transferContactId === person.id ||
            approval.title.includes(person.name),
        );
        const taskCounts = {
          overdue: activeTasks.filter((task) => task.status === "overdue").length,
          today: activeTasks.filter((task) => task.status === "pending" && task.due === DEMO_TODAY).length,
          next7: activeTasks.filter((task) => task.status === "pending" && task.due > DEMO_TODAY && task.due <= addDays(DEMO_TODAY, 7)).length,
          pending: activeTasks.filter((task) => task.status === "pending" && task.due > addDays(DEMO_TODAY, 7)).length,
          paused: activeTasks.filter((task) => task.status === "paused").length,
          review: activeTasks.filter((task) => task.status === "late_entry_pending").length,
        };
        const taskRows = (rows) =>
          rows.map((task) => `<tr><td><strong>${task.executionCode}</strong></td><td>${task.company}</td><td>${taskDisplayType(task)}</td><td>${task.title}</td><td><span class="tag ${taskStatusTone(task)}">${taskStatusName(task.status, task)}</span></td><td>${task.due} 23:59:59</td><td>${task.status === "overdue" || (task.status === "paused" && task.due < DEMO_TODAY) ? Math.max(dayDiff(task.due, DEMO_TODAY), 1) + (task.status === "paused" ? " 天（健康风险）" : " 天") : "—"}</td><td>${task.pm}</td><td>${task.status === "done" ? completionTypeName(task.completionType) : "待完成"}</td><td><button class="link" data-action="task-detail" data-id="${task.id}">详情</button></td></tr>`).join("");
        const tabs = [
          ["base", "基本信息"],
          ["employment", "当前任职"],
          ["history", "任职历史"],
          ["tasks", `维系任务 ${activeTasks.length}`],
          ["records", `维系记录 ${records.length}`],
          ["approvals", `相关审批 ${relatedApprovals.length}`],
          ["logs", "操作日志"],
        ];
        let content = "";
        if (selectedPersonDetailTab === "base") {
          content = `<div class="detail-grid"><div class="detail-item"><label>关键人编号</label><div>${person.code}</div></div><div class="detail-item"><label>状态</label><div><span class="tag green">正常</span></div></div><div class="detail-item"><label>手机号</label><div>${person.phone}</div></div><div class="detail-item"><label>微信号</label><div>${person.wechat || "未填写"}</div></div><div class="detail-item"><label>邮箱</label><div>${person.email || "未填写"}</div></div><div class="detail-item"><label>性别</label><div>${person.gender || "未说明"}</div></div><div class="detail-item"><label>生日</label><div>${person.birthday || "未填写"}</div></div><div class="detail-item"><label>关键决策人</label><div>${person.decision ? "是" : "否"}</div></div><div class="detail-item"><label>最近维系</label><div>${person.last || "从未"}</div></div><div class="detail-item"><label>写入来源</label><div>${person.source === "import" ? "批量导入" : person.source === "system" ? "系统生成" : "手工录入"}</div></div><div class="detail-item"><label>创建时间</label><div>${person.createdAt || "待补录"}</div></div><div class="detail-item"><label>更新时间</label><div>${person.updatedAt}</div></div></div><div class="section-title">当前任务摘要</div><div class="metrics compact-metrics">${metric("当前逾期", taskCounts.overdue, "持续标红直至闭环", "red")}${metric("今日到期", taskCounts.today, "当前业务日", "orange")}${metric("未来 7 天", taskCounts.next7, "待执行", "yellow")}${metric("暂停 / 审核", taskCounts.paused + taskCounts.review, `暂停 ${taskCounts.paused} · 补录审核 ${taskCounts.review}`, "blue")}</div><button class="btn" type="button" data-person-detail-tab="tasks">查看全部任务</button>`;
        }
        if (selectedPersonDetailTab === "employment")
          content = `<div class="detail-grid"><div class="detail-item full"><label>客户公司</label><div>${person.company}</div></div><div class="detail-item"><label>客户部门</label><div>${person.department}</div></div><div class="detail-item"><label>关键人岗位</label><div>${person.positionName}${person.positionId ? ` · ${person.positionId}` : ""}</div></div><div class="detail-item"><label>职级</label><div>${person.level}</div></div><div class="detail-item"><label>任职生效日</label><div>${person.effectiveDate}</div></div><div class="detail-item"><label>当前负责人</label><div>${contactOwnerName(person)}</div></div></div><div class="role-note">客户公司、部门和关键人岗位不能普通编辑。任一变化必须发起关键人调岗审批，审批生效后才进入覆盖率与覆盖 KPI。</div>`;
        if (selectedPersonDetailTab === "history")
          content = `<div class="timeline">${(person.employmentHistory || []).map((history) => `<div class="timeline-item is-done"><div class="timeline-title">${history.startDate || "历史"} 至 ${history.endDate}</div><div class="timeline-content">${history.company} / ${history.department} / ${history.positionName || history.title} / ${history.level || "职级快照"}<br>原负责人 ${history.pm}</div></div>`).join("")}<div class="timeline-item is-current"><div class="timeline-title">${person.effectiveDate} 至今 · 当前任职</div><div class="timeline-content">${person.company} / ${person.department} / ${person.positionName} / ${person.level}</div></div></div>`;
        if (selectedPersonDetailTab === "tasks") {
          const finishedTasks = personTasks.filter((task) => task.status === "done");
          const scopedTaskRows =
            selectedPersonTaskScope === "all"
              ? personTasks
              : selectedPersonTaskScope === "done"
                ? finishedTasks
                : activeTasks;
          content = `<div class="metrics compact-metrics">${metric("当前逾期", taskCounts.overdue, "按截止时间升序", "red")}${metric("今日到期", taskCounts.today, "待执行", "orange")}${metric("未来 7 天", taskCounts.next7, "待执行", "yellow")}${metric("其他待执行", taskCounts.pending, "七天以后")}${metric("暂停中", taskCounts.paused, "超截止仍影响健康", "blue")}${metric("补录审核中", taskCounts.review, "不计当前逾期", "blue")}</div><div class="tabs execution-tabs"><button class="tab ${selectedPersonTaskScope === "unfinished" ? "active" : ""}" type="button" data-person-task-scope="unfinished">未结束 <span class="tab-count">${activeTasks.length}</span></button><button class="tab ${selectedPersonTaskScope === "all" ? "active" : ""}" type="button" data-person-task-scope="all">全部 <span class="tab-count">${personTasks.length}</span></button><button class="tab ${selectedPersonTaskScope === "done" ? "active" : ""}" type="button" data-person-task-scope="done">已完成 <span class="tab-count">${finishedTasks.length}</span></button></div><div class="table-wrap"><table style="min-width:1200px"><thead><tr><th>任务执行记录编号</th><th>客户公司</th><th>任务类型</th><th>任务标题</th><th>状态</th><th>截止时间</th><th>逾期天数</th><th>执行人</th><th>完成认定</th><th>操作</th></tr></thead><tbody>${taskRows(scopedTaskRows) || '<tr><td colspan="10">当前范围暂无任务</td></tr>'}</tbody></table></div>`;
        }
        if (selectedPersonDetailTab === "records")
          content = `<div class="table-wrap"><table><thead><tr><th>记录编号</th><th>维系时间</th><th>方式</th><th>沟通摘要</th><th>维系人</th><th>关联任务</th><th>创建 / 更新时间</th><th>操作</th></tr></thead><tbody>${records.map((record) => { const linkedTask = tasks.find((task) => task.id === record.taskId); return `<tr><td>${maintenanceRecordCode(record)}</td><td>${record.maintenanceAt || record.date}</td><td>${record.method}${record.method === "其他" ? ` · ${record.otherMethod || "未说明"}` : ""}</td><td>${record.summary}</td><td>${record.pm}</td><td>${linkedTask?.executionCode || "未关联"}</td><td>${record.createdAt || record.date}<div class="list-sub">更新 ${record.updatedAt || record.createdAt || record.date}</div></td><td><button class="link" data-action="record-detail" data-id="${record.id}">详情</button></td></tr>`; }).join("") || '<tr><td colspan="8">暂无维系记录</td></tr>'}</tbody></table></div>`;
        if (selectedPersonDetailTab === "approvals")
          content = `<div class="table-wrap"><table><thead><tr><th>流程编号</th><th>类型</th><th>申请事项</th><th>当前环节</th><th>状态</th><th>发起时间</th><th>操作</th></tr></thead><tbody>${relatedApprovals.map((approval) => `<tr><td>${approval.code}</td><td>${approval.type}</td><td>${approval.title}</td><td>${approval.status === "pending" ? approval.current : approvalFinalNodeTitle(approval)}</td><td><span class="tag ${approval.status === "approved" ? "green" : approval.status === "rejected" ? "red" : "yellow"}">${approvalStatusName(approval.status)}</span></td><td>${approval.date}</td><td><button class="link" data-action="approval-detail" data-id="${approval.id}">详情</button></td></tr>`).join("") || '<tr><td colspan="7">暂无相关审批</td></tr>'}</tbody></table></div>`;
        if (selectedPersonDetailTab === "logs")
          content = `<div class="timeline"><div class="timeline-item is-done"><div class="timeline-title">${person.updatedAt} · 信息更新</div><div class="timeline-content">更新手机号、关键决策人或展示字段；任职字段未变更。</div></div><div class="timeline-item is-done"><div class="timeline-title">${person.createdAt || person.effectiveDate} · 关键人创建</div><div class="timeline-content">${person.source === "import" ? "批量导入" : "手工录入"}，生成编号 ${person.code}。</div></div></div>`;
        const html = `<div class="drawer-head"><div class="modal-title">关键人详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">${person.name[0]}</div><div><div class="detail-name">${person.name} ${contactHasOverdue(person) ? '<span class="tag red">当前逾期</span>' : '<span class="tag green">健康</span>'}</div></div></div><div class="tabs detail-tabs">${tabs.map(([key, label]) => `<button class="tab ${selectedPersonDetailTab === key ? "active" : ""}" type="button" data-person-detail-tab="${key}">${label}</button>`).join("")}</div><div class="person-detail-content">${content}</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${stopObjectActionHtml("contact", person.id)}${personDetailCanMaintain(person) && !pendingStopApproval("contact", person.id) ? `<button class="btn" data-action="edit-contact" data-id="${person.id}">编辑身份</button>` : ""}${canTransferContact(person) && !pendingStopApproval("contact", person.id) ? `<button class="btn" data-action="transfer" data-id="${person.id}">发起调岗</button>` : ""}${canCreateMaintenanceForPerson(person) && !pendingStopApproval("contact", person.id) ? `<button class="btn btn-primary" data-action="new-record" data-id="${person.id}">新增记录</button>` : ""}</div>`;
        if (initial)
          openDrawer(html, () => bindPersonDetailInteractions(person));
        else renderDrawerLayer(html);
        bindPersonDetailInteractions(person);
      }
      function openPerson(id) {
        const person = contacts.find((item) => item.id === id);
        if (!person || !scopedContacts().some((item) => item.id === id))
          return toast("无权查看该关键人");
        selectedPersonDetailTab = "base";
        selectedPersonTaskScope = "unfinished";
        renderPersonDetail(person, true);
      }

      function genericAction(action, id, kind) {
        const actions = {
          "notification-center": openNotificationCenter,
          "go-imports": () => {
            currentPage = "imports";
            closeOverlay();
            renderNav();
            renderPage();
          },
          "go-archive": () => {
            currentPage = "archive";
            closeOverlay();
            renderNav();
            renderPage();
          },
          "download-template": downloadTemplate,
          "download-full-import-template": () => downloadTemplate("full"),
          "download-contact-import-template": () => downloadTemplate("contact"),
          "add-group": openGroupForm,
          "add-customer": () => openCustomerForm(),
          "edit-customer-parent": () => openCustomerForm(Number(id)),
          "go-customer-settings": () => {
            if (!hasPermission("settings"))
              return toast("当前账号无客户基础配置访问权限");
            currentPage = "settings";
            settingsSection = "tree";
            if (kind && id) {
              clearCustomerOrgInternalContext();
              selectedCustomerOrgNode = `${kind}:${id}`;
            }
            window.history.replaceState(null, "", "#settings");
            closeAllOverlays();
            renderNav();
            renderPage();
          },
          "add-department-template": () => openDepartmentTemplateForm(),
          "edit-department-template": () =>
            openDepartmentTemplateForm(Number(id)),
          "stop-department-template": () => stopDepartmentTemplate(Number(id)),
          "add-contact": () => openContactForm(null, Number(id)),
          "edit-contact": () => openContactForm(Number(id)),
          transfer: () => openTransfer(Number(id)),
          "new-record": () => openRecord(Number(id)),
          "stop-object": () =>
            openStopObject(kind, kind === "group" ? String(id) : Number(id)),
          "task-detail": () => openTaskDetail(Number(id)),
          "task-theme-detail": () => openTaskThemeDetail(String(id)),
          "refresh-task-theme": () => refreshTaskThemeData(String(id)),
          "refresh-campaign-data": () => refreshCampaignData(Number(id)),
          "refresh-execution-list": () => {
            taskDataUpdatedAt = formatTaskUpdateTime(new Date());
            renderPage();
            toast("任务数据已更新");
          },
          "change-task": () => openTaskChange(Number(id)),
          "new-campaign": () => openCampaign(),
          "edit-campaign": () => openCampaign(Number(id)),
          "campaign-detail": () => openCampaignDetail(Number(id)),
          "record-detail": () => openRecordDetail(Number(id)),
          "all-person-records": () => openPersonRecords(Number(id)),
          "edit-record": () => openRecord(null, Number(id)),
          "approval-detail": () => openApprovalDetail(Number(id)),
          "retry-approval-business": () => retryApprovalBusiness(Number(id)),
          "replace-invalid-handler": () =>
            openReplaceInvalidHandler(Number(id)),
          "accept-transfer": () => acceptTransfer(Number(id)),
          "reject-transfer": () => openRejectTransfer(Number(id)),
          "archive-audit": () => openArchiveAudit(Number(id)),
          "restore-object": () => openRestore(Number(id)),
          "add-org-department": () => openOrganizationDepartmentForm(),
          "edit-org-department": () => openOrganizationDepartmentForm(Number(id)),
          "add-employee": () => openEmployeeForm(),
          "employee-detail": () => openEmployeeDetail(Number(id)),
          "employee-edit": () => openEmployeeEditForm(Number(id)),
          "employee-suspend": () => openEmployeeStatusChange(Number(id), "停用"),
          "employee-restore": () => openEmployeeStatusChange(Number(id), "恢复"),
          "reset-password": () => openResetPassword(Number(id)),
          "change-own-password": openChangeOwnPassword,
          "edit-region": () => openRegionForm(Number(id)),
          "region-detail": () => openRegionDetail(Number(id)),
          "assign-city": () => openCityForm(),
          "handover-city": () => openCityHandover(Number(id)),
          "city-impact": () => openCityImpact(Number(id)),
          "direct-adjust-city": () => openDirectAdjust(Number(id)),
                    "save-level-config": () => saveLevelConfig(String(id)),
          "save-escalation": saveEscalationConfig,
          "toggle-add-menu": () => { const m = document.getElementById("addMenu"); if (m) m.classList.toggle("hidden"); },
                    "edit-rule": () => openRuleForm(Number(id)),
          "toggle-rule": () => toggleRule(Number(id)),
          "sync-holidays": syncHolidayCalendar,
          "add-contact-position": () => openContactPositionForm(),
          "edit-contact-position": () => openContactPositionForm(String(id)),
          "toggle-contact-position": () => toggleContactPosition(String(id)),
          "add-industry": () => openIndustryForm(),
          "edit-industry": () => openIndustryForm(Number(id)),
          "toggle-industry": () => toggleIndustry(Number(id)),
          "upload-import": openImportUpload,
          "import-detail": () => openImportDetail(String(id)),
          "download-report": () => downloadImportReport(String(id)),
          "preview-file": () =>
            hasAttachmentPermission("attachment_view")
              ? openFilePreview()
              : toast("当前账号无附件查看权限"),
          "download-file": () => {
            if (!hasAttachmentPermission("attachment_download"))
              return toast("当前账号无附件下载权限");
            downloadText(
              "附件预览说明.txt",
              "Demo附件下载成功。正式系统中将通过受控地址下载并记录日志。",
            );
            toast("附件已下载并记录操作日志");
          },
        };
        (actions[action] || (() => toast("该操作已完成演示响应")))();
      }

      function openCustomerForm(id) {
        const c = customers.find((x) => x.id === id);
        if (c && !hasOperationPermission("settings.edit"))
          return toast("当前账号无权调整客户公司组织上级");
        if (!c && !canCreateCustomerUnit())
          return toast("当前账号无新增客户单位权限");
        const levels =
          currentUser.role === "pm"
            ? ["市公司", "区县公司"]
            : ["省公司", "市公司", "区县公司"];
        openModal(
          `<div class="modal-head"><div class="modal-title">新增客户单位</div><button class="icon-btn close" data-close>×</button></div><form id="customerForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>行业</label><select class="input" id="cfIndustry" required>${industries
            .filter((x) => x.enabled)
            .map((x) => `<option>${x.name}</option>`)
            .join(
              "",
            )}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>集团公司</label><select class="input" id="cfGroup">${customerGroupNames.map((x) => `<option>${x}</option>`).join("")}</select></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户公司名称</label><input class="input" id="cfName" minlength="2" maxlength="100" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户公司层级</label><select class="input" id="cfLevel"><option value="">请选择层级</option>${levels.map((x) => `<option>${x}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>责任省份</label><select class="input" id="cfProvince" required></select></div><div class="form-group" id="cfCityGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>责任城市</label><select class="input" id="cfCity" required></select></div><div class="form-group" id="cfDistrictGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>责任区县</label><select class="input" id="cfDistrict" required></select></div><div class="form-group full"><label class="form-label">统一社会信用代码</label><input class="input" id="cfCredit" maxlength="18" pattern="[0-9A-HJ-NPQRTUWXY]{18}" placeholder="18 位；未填写可留空"></div></div><div class="role-note">系统按客户公司层级和责任省/市/区县自动计算公司父级、区域中心、客户负责人、数据范围和任务执行人。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存客户公司</button></div></form>`,
        );
        const levelGroup = $("#cfLevel").closest(".form-group");
        levelGroup.querySelector(".form-label").textContent =
          "业务责任层级 *";
        $("#cfProvince").closest(".form-group").querySelector(".form-label").textContent =
          "业务责任省份 *";
        $("#cfCity").closest(".form-group").querySelector(".form-label").textContent =
          "业务责任城市 *";
        $("#cfDistrict").closest(".form-group").querySelector(".form-label").textContent =
          "业务责任区县 *";
        $("#cfLevel").innerHTML =
          '<option value="">请选择业务责任层级</option><option>省级</option><option>市级</option><option>区县级</option>';
        $("#cfGroup").closest(".form-group").insertAdjacentHTML(
          "afterend",
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>组织上级</label><select class="input" id="cfOrganizationParent" required></select></div>',
        );
        $("#customerForm .role-note").textContent =
          "组织上级唯一决定公司树路径；业务责任层级和业务责任省/市/区县只用于区域中心、客户负责人、数据范围和任务执行人。";
        $("#customerForm").parentElement.querySelector(".modal-title").textContent = c
          ? "调整客户公司组织上级"
          : "新增客户公司";
        $("#customerForm .btn-primary").textContent = c ? "保存" : "保存客户公司";
        const refreshOrganizationParents = () => {
          const group = $("#cfGroup").value;
          const excludedIds = c
            ? new Set([c.id, ...customerOrganizationDescendantIds(c.id)])
            : new Set();
          const candidates = customers.filter(
            (company) =>
              company.group === group &&
              !company.archived &&
              customerOrgStatus("company", company) === "正常" &&
              !excludedIds.has(company.id),
          );
          $("#cfOrganizationParent").innerHTML =
            `<option value="group">${group}</option>` +
            candidates
              .map(
                (company) =>
                  `<option value="company:${company.id}">${customerOrganizationPath(company)}</option>`,
              )
              .join("");
          if (c) {
            const currentValue =
              c.organizationParentType === "company"
                ? `company:${c.organizationParentCompanyId}`
                : "group";
            $("#cfOrganizationParent").value = currentValue;
          }
        };
        // 先选行业，集团按行业过滤（DEC-152）
        const refreshGroupByIndustry = () => {
          const selectedIndustry = $("#cfIndustry").value;
          const eligibleGroups = customerGroupNames.filter(
            (g) => customerGroupIndustries[g] === selectedIndustry,
          );
          $("#cfGroup").innerHTML =
            (eligibleGroups.length
              ? eligibleGroups
              : customerGroupNames
            ).map((g) => `<option>${g}</option>`).join("");
          refreshOrganizationParents();
        };
        $("#cfIndustry").onchange = refreshGroupByIndustry;
        refreshGroupByIndustry();
        const selectedTreeGroup = selectedCustomerOrgNode.startsWith("group:")
          ? selectedCustomerOrgNode.slice(6)
          : selectedCustomerOrgNode.startsWith("company:")
            ? customers.find((item) => item.id === Number(selectedCustomerOrgNode.slice(8)))?.group
            : "";
        if (selectedTreeGroup && customerGroupNames.includes(selectedTreeGroup)) {
          $("#cfIndustry").value = customerGroupIndustries[selectedTreeGroup];
          refreshGroupByIndustry();
          $("#cfGroup").value = selectedTreeGroup;
        }
        if (c) {
          $("#cfIndustry").value = c.industry;
          refreshGroupByIndustry();
          $("#cfGroup").value = c.group;
          $("#cfName").value = c.name;
          $("#cfLevel").value = customerBusinessResponsibilityLevel(c);
          $("#cfCredit").value = c.creditCode || "";
          ["#cfIndustry", "#cfGroup", "#cfName", "#cfLevel", "#cfCredit"].forEach(
            (selector) => {
              $(selector).disabled = true;
            },
          );
          refreshOrganizationParents();
        }
        $("#cfGroup").onchange = refreshOrganizationParents;
        const refreshAreas = () => {
          const provinces =
            currentUser.role === "pm"
              ? [
                  ...new Set(
                    cityOwners
                      .filter((x) => x.pm === currentUser.name)
                      .map((x) => x.province),
                  ),
                ]
              : Object.keys(administrativeDivisions);
          const prevProv = $("#cfProvince").value;
          if (!$("#cfProvince").options.length) {
            $("#cfProvince").innerHTML =
              '<option value="">请选择省份</option>' +
              provinces.map((x) => `<option>${x}</option>`).join("");
            $("#cfProvince").value = provinces.includes(prevProv)
              ? prevProv
              : "";
          } else if (!provinces.includes(prevProv)) {
            $("#cfProvince").innerHTML =
              '<option value="">请选择省份</option>' +
              provinces.map((x) => `<option>${x}</option>`).join("");
            $("#cfProvince").value = "";
          }
          const province = $("#cfProvince").value;
          const allowedCities =
            currentUser.role === "pm"
              ? assignedCitiesForCurrentUser()
              : Object.keys(administrativeDivisions[province] || {});
          const prevCity = $("#cfCity").value;
          $("#cfCity").innerHTML =
            '<option value="">请选择城市</option>' +
            allowedCities.map((x) => `<option>${x}</option>`).join("");
          $("#cfCity").value = allowedCities.includes(prevCity) ? prevCity : "";
          const districts =
            administrativeDivisions[province]?.[$("#cfCity").value] || [];
          const prevDistrict = $("#cfDistrict").value;
          $("#cfDistrict").innerHTML =
            '<option value="">请选择区县</option>' +
            districts.map((x) => `<option>${x}</option>`).join("");
          $("#cfDistrict").value = districts.includes(prevDistrict)
            ? prevDistrict
            : "";
          const level = $("#cfLevel").value;
          const hasLevel = Boolean(level);
          const needsCity = ["市级", "区县级"].includes(level);
          const needsDistrict = level === "区县级";
          $("#cfProvince").required = hasLevel;
          $("#cfProvince").disabled = !hasLevel;
          $("#cfCity").required = needsCity;
          $("#cfCity").disabled = !needsCity;
          $("#cfDistrict").required = needsDistrict;
          $("#cfDistrict").disabled = !needsDistrict;
          if (!hasLevel) {
            $("#cfProvince").value = "";
            $("#cfCity").value = "";
            $("#cfDistrict").value = "";
          } else if (level === "省级") {
            $("#cfCity").value = "";
            $("#cfDistrict").value = "";
          } else if (level === "市级") {
            $("#cfDistrict").value = "";
          }
        };
        $("#cfLevel").onchange = refreshAreas;
        $("#cfProvince").onchange = refreshAreas;
        $("#cfCity").onchange = refreshAreas;
        refreshAreas();
        if (c) {
          $("#cfProvince").value = customerBusinessProvince(c);
          refreshAreas();
          $("#cfCity").value = customerBusinessCity(c);
          refreshAreas();
          $("#cfDistrict").value = customerBusinessDistrict(c);
          ["#cfProvince", "#cfCity", "#cfDistrict"].forEach((selector) => {
            $(selector).disabled = true;
          });
        }
        $("#customerForm").onsubmit = (e) => {
          e.preventDefault();
          const parentValue = $("#cfOrganizationParent").value;
          const selectedParentId = parentValue.startsWith("company:")
            ? Number(parentValue.slice(8))
            : null;
          const selectedParent = selectedParentId
            ? customers.find((company) => company.id === selectedParentId)
            : null;
          const selectedGroup = c?.group || $("#cfGroup").value;
          if (
            parentValue !== "group" &&
            (!selectedParent ||
              selectedParent.group !== selectedGroup ||
              selectedParent.archived ||
              (c &&
                (selectedParent.id === c.id ||
                  customerOrganizationDescendantIds(c.id).has(selectedParent.id))))
          )
            return toast("请选择所属集团或同集团正常客户公司作为组织上级");
          if (c) {
            c.organizationParentType = selectedParent ? "company" : "group";
            c.organizationParentCompanyId = selectedParent?.id || null;
            c.updatedAt = recordCreatedAt();
            clearCustomerOrgInternalContext();
            selectedCustomerOrgNode = `company:${c.id}`;
            closeOverlay();
            renderPage();
            return toast("修改已保存");
          }
          const level = $("#cfLevel").value,
            province = $("#cfProvince").value,
            city = $("#cfCity").value,
            district = $("#cfDistrict").value,
            name = $("#cfName").value.trim(),
            creditCode = $("#cfCredit").value.trim().toUpperCase();
          if (!level) return toast("请选择业务责任层级");
          if (name.length < 2 || name.length > 100)
            return toast("单位名称需填写 2-100 字");
          if (creditCode && !/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(creditCode))
            return toast("统一社会信用代码需为 18 位标准格式");
          if (
            creditCode &&
            (customers.some((item) => item.creditCode === creditCode) ||
              Object.values(customerGroupCreditCodes).includes(creditCode))
          )
            return toast("统一社会信用代码已存在，请联系管理员核对");
          const provinces = Object.keys(administrativeDivisions),
            cities = Object.keys(administrativeDivisions[province] || {}),
            districts = administrativeDivisions[province]?.[city] || [];
          if (!provinces.includes(province)) return toast("请选择标准省份");
          if (
            level !== "省级" &&
            (!cities.includes(city) ||
              (currentUser.role === "pm" &&
                !assignedCitiesForCurrentUser().includes(city)))
          )
            return toast("请选择授权范围内的标准城市");
          if (level === "区县级" && !districts.includes(district))
            return toast("请选择标准区县");
          const regionMatch = regionsData.find((r) =>
            regionProvinceList(r).includes(province),
          );
          if (!regionMatch || regionConfigurationStatus(regionMatch) !== "已配置")
            return toast("该省份无法唯一解析正常区域中心，请先完成区域配置");
          const region = regionScopeName(regionMatch);
          const director = regionMatch.director;
          if (!director) return toast("所属区域中心未设置区域总监，不能创建客户");
          const ownerInfo = cityOwners.find(
            (item) => item.province === province && item.city === city,
          );
          if (level !== "省级" && !ownerInfo?.pm)
            return toast("该城市尚未配置地市负责人，不能创建客户");
          const owner = level === "省级" ? director : ownerInfo.pm;
          const pm = level === "省级" ? "" : ownerInfo.pm;
          const group = $("#cfGroup").value;
          const industry = customerGroupIndustries[group];
          if (!industry) return toast("所属集团行业未配置，不能创建客户");
          const data = {
            group,
            industry,
            name,
            level: { 省级: "省公司", 市级: "市公司", 区县级: "区县公司" }[
              level
            ],
            businessResponsibilityLevel: level,
            province,
            businessResponsibilityProvince: province,
            city: level === "省级" ? "" : city,
            businessResponsibilityCity: level === "省级" ? "" : city,
            district: level === "区县级" ? district : "",
            businessResponsibilityDistrict: level === "区县级" ? district : "",
            organizationParentType: selectedParent ? "company" : "group",
            organizationParentCompanyId: selectedParent?.id || null,
            region,
            owner,
            pm,
            creditCode,
            source: "manual",
            createdAt: recordCreatedAt(),
          };
          const duplicate = customers.some(
            (item) =>
              !item.archived &&
              item.group === data.group &&
              item.organizationParentType === data.organizationParentType &&
              item.organizationParentCompanyId ===
                data.organizationParentCompanyId &&
              item.name.toLocaleLowerCase("zh-CN") ===
                name.toLocaleLowerCase("zh-CN"),
          );
          if (duplicate)
            return toast("同一组织上级下已存在同名客户公司");
          const unit = {
            id: Date.now(),
            ...data,
            contacts: 0,
            health: "健康",
          };
          customers.push(unit);
          expandedCustomerNodes.add(`group:${data.group}`);
          if (selectedParent)
            expandedCustomerNodes.add(`company-org:${selectedParent.id}`);
          if (data.level === "省公司")
            expandedCustomerNodes.add(
              `province:${data.group}:${data.province}`,
            );
          if (data.city) {
            expandedCustomerNodes.add(`city:${data.group}:${data.city}`);
            if (
              customers.some(
                (x) =>
                  !x.archived &&
                  x.group === data.group &&
                  x.province === data.province &&
                  x.level === "省公司",
              )
            )
              expandedCustomerNodes.add(
                `province:${data.group}:${data.province}`,
              );
          }
          selectedCustomerId = unit.id;
          selectedOperationCustomerId = unit.id;
          selectedOperationContactId = null;
          selectedCustomerGroup = data.group;
          clearCustomerOrgInternalContext();
          selectedCustomerOrgNode = `company:${unit.id}`;
          expandedCustomerOrgNodes.add(`industry:${data.industry}`);
          expandedCustomerOrgNodes.add(`group:${data.group}`);
          expandedCustomerOrgNodes.add(`company:${unit.id}`);
          customerTreeDimension = "group";
          closeOverlay();
          renderPage();
          toast("客户公司已创建");
        };
      }

      function openGroupForm() {
        if (!canCreateCustomerGroup())
          return toast("当前账号无新增集团公司权限");
        openModal(
          `<div class="modal-head"><div class="modal-title">新增集团公司</div><button class="icon-btn close" data-close>×</button></div><form id="groupForm"><div class="modal-body"><div class="form-grid"><div class="form-group full"><label class="form-label">集团编号</label><input class="input" id="gfNumber" value="保存后自动生成" disabled></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>集团公司名称</label><input class="input" id="gfName" minlength="2" maxlength="100" required placeholder="例如：中国华能集团"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>行业</label><select class="input" id="gfIndustry" required><option value="">请选择行业</option>${industries
            .filter((x) => x.enabled)
            .map((x) => `<option>${x.name}</option>`)
            .join(
              "",
            )}</select></div><div class="form-group full"><label class="form-label">统一社会信用代码</label><input class="input" id="gfCredit" maxlength="18" pattern="[0-9A-HJ-NPQRTUWXY]{18}" placeholder="18 位；未填写可留空"></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">创建集团公司</button></div></form>`,
        );
        $("#groupForm").onsubmit = (e) => {
          e.preventDefault();
          const name = $("#gfName").value.trim();
          const creditCode = $("#gfCredit").value.trim().toUpperCase();
          if (name.length < 2 || name.length > 100)
            return toast("集团公司名称需填写 2-100 字");
          const existingGroup = Object.keys(customerGroupNumbers).find(
              (item) =>
                item.toLocaleLowerCase("zh-CN") ===
                name.toLocaleLowerCase("zh-CN"),
            );
          if (existingGroup) {
            $("#gfNumber").value = customerGroupNumbers[existingGroup];
            toast("集团公司名称已存在");
            return;
          }
          if (creditCode && !/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(creditCode))
            return toast("统一社会信用代码需为 18 位标准格式");
          if (
            creditCode &&
            (customers.some((item) => item.creditCode === creditCode) ||
              Object.values(customerGroupCreditCodes).includes(creditCode))
          )
            return toast("统一社会信用代码已存在，请联系管理员核对");
          const groupNumber = nextCustomerGroupNumber();
          customerGroupNames.push(name);
          customerGroupNumbers[name] = groupNumber;
          customerGroupIndustries[name] = $("#gfIndustry").value;
          customerGroupCreditCodes[name] = creditCode;
          clearCustomerOrgInternalContext();
          selectedCustomerOrgNode = `group:${name}`;
          expandedCustomerOrgNodes.add(
            `industry:${customerGroupIndustries[name]}`,
          );
          expandedCustomerOrgNodes.add(`group:${name}`);
          closeOverlay();
          renderPage();
          toast(`集团公司已创建，行业为${customerGroupIndustries[name]}`);
        };
      }

      function openDepartmentTemplateForm(departmentId) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const department = customerDepartments.find(
          (item) => item.id === departmentId,
        );
        const [selectedType, selectedId] = (
          selectedCustomerOrgInternalNode || selectedCustomerOrgNode
        ).split(":");
        const contextDepartment =
          selectedType === "department"
            ? customerDepartments.find((item) => String(item.id) === selectedId)
            : null;
        const contextCompany =
          department?.company ||
          contextDepartment?.company ||
          (selectedType === "company"
            ? customers.find((item) => String(item.id) === selectedId)?.name
            : "");
        const selectedCompany = customers.find(
          (item) => item.name === contextCompany,
        );
        const selectedIndustry = selectedCompany?.industry || "";
        const selectedGroup = department?.group || selectedCompany?.group || "";
        const industries = [...new Set(customers.map((item) => item.industry))];
        openModal(
          `<div class="modal-head"><div class="modal-title">${department ? "编辑" : "新增"}客户部门</div><button class="icon-btn close" data-close>×</button></div><form id="deptForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>行业</label><select class="input" id="dfIndustry" ${department ? "disabled" : ""}><option value="">请选择行业</option>${industries.map((item) => `<option ${item === selectedIndustry ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>集团</label><select class="input" id="dfGroup" ${department ? "disabled" : ""}><option value="">请先选择行业</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户公司</label><select class="input" id="dfCompany" ${department ? "disabled" : ""}><option value="">请先选择集团</option></select></div><div class="form-group"><label class="form-label">部门编码</label><input class="input" value="${department?.code || "保存后自动生成"}" disabled><div class="list-sub">CDEPT + 8 位公司级流水，系统生成且不可修改</div></div><div class="form-group"><label class="form-label">上级部门</label><select class="input" id="dfParent"><option value="无">无（公司直属部门）</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>部门名称</label><input class="input" id="dfName" minlength="2" maxlength="100" value="${department?.name || ""}" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>排序</label><input class="input" id="dfSort" type="number" min="1" max="9999" value="${department?.sort || 100}" required></div><div class="form-group full"><label class="form-label">部门说明</label><textarea class="input" id="dfDuty" maxlength="500">${department?.duty || ""}</textarea></div></div><div class="role-note">客户部门必须属于唯一客户公司；上级部门只能选择同一公司内的部门，不允许直接挂在集团下或跨公司复用。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`,
        );
        const refreshDepartmentCascade = (source) => {
          const industry = $("#dfIndustry").value;
          const groups = [...new Set(customers.filter((item) => item.industry === industry).map((item) => item.group))];
          const group = source === "industry" ? "" : $("#dfGroup").value || selectedGroup;
          $("#dfGroup").innerHTML = '<option value="">请选择集团</option>' + groups.map((item) => `<option ${item === group ? "selected" : ""}>${item}</option>`).join("");
          const companies = customers.filter((item) => !item.archived && item.industry === industry && item.group === $("#dfGroup").value);
          const company = source === "group" || source === "industry" ? "" : $("#dfCompany").value || contextCompany;
          $("#dfCompany").innerHTML = '<option value="">请选择客户公司</option>' + companies.map((item) => `<option ${item.name === company ? "selected" : ""}>${item.name}</option>`).join("");
          const companyName = $("#dfCompany").value;
          $("#dfParent").innerHTML = '<option value="无">无（公司直属部门）</option>' + customerDepartments.filter((item) => !item.archived && item.id !== department?.id && item.company === companyName).map((item) => `<option ${department?.parent === item.name || (!department && contextDepartment?.name === item.name) ? "selected" : ""}>${item.name}</option>`).join("");
        };
        $("#dfIndustry").onchange = () => refreshDepartmentCascade("industry");
        $("#dfGroup").onchange = () => refreshDepartmentCascade("group");
        $("#dfCompany").onchange = () => refreshDepartmentCascade("company");
        refreshDepartmentCascade("initial");
        $("#deptForm").onsubmit = (event) => {
          event.preventDefault();
          const company = $("#dfCompany").value;
          const companyRecord = customers.find((item) => item.name === company);
          if (!companyRecord) return toast("请按行业、集团、客户公司逐级选择");
          const data = {
            group: companyRecord.group,
            company,
            code: department?.code || `CDEPT${String(customerDepartments.length + 1).padStart(8, "0")}`,
            name: $("#dfName").value.trim(),
            parent: $("#dfParent").value,
            duty: $("#dfDuty").value.trim(),
            sort: Number($("#dfSort").value),
            status: department?.status || "正常",
            updatedAt: recordCreatedAt(),
          };
          if (data.name.length < 2 || data.name.length > 100)
            return toast("部门名称须为 2-100 字");
          if (customerDepartments.some((item) => !item.archived && item.id !== department?.id && item.company === company && item.parent === data.parent && item.name.toLowerCase() === data.name.toLowerCase()))
            return toast("该客户公司同一上级下已存在同名部门");
          let savedDepartment = department;
          if (department) Object.assign(department, data);
          else {
            savedDepartment = { id: Date.now(), ...data };
            customerDepartments.push(savedDepartment);
          }
          selectedCustomerOrgInternalNode = `department:${savedDepartment.id}`;
          expandedCustomerOrgNodes.add(`department:${savedDepartment.id}`);
          closeOverlay();
          renderPage();
          toast(`客户部门已保存，归属 ${company}`);
        };
      }

      function stopDepartmentTemplate(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        openStopObject("department", id);
      }

      function openContactForm(id, customerId) {
        const person = contacts.find((item) => item.id === id);
        if (person && !canMaintainContact(person))
          return toast("当前账号无权编辑该关键人");
        const requestedCompany = customers.find((item) => item.id === customerId);
        if (requestedCompany && !canMaintainContactForCompany(requestedCompany))
          return toast("当前账号无权维护该客户公司的关键人");
        const choices = scopedCustomers().filter((company) =>
          canMaintainContactForCompany(company),
        );
        const initialCompanyName =
          person?.company || requestedCompany?.name || choices[0]?.name || "";
        const initialCompany = customers.find(
          (item) => item.name === initialCompanyName,
        );
        if (!initialCompany)
          return toast("当前授权范围内暂无可选客户公司");
        const lockedProfession = Boolean(person || customerId);
        const initialDepartment = customerDepartments.find(
          (item) =>
            item.company === initialCompanyName &&
            item.name === person?.department &&
            !item.archived,
        );
        const initialPosition = contactPositionCatalog.find(
          (item) =>
            item.id === person?.positionId &&
            item.departmentId === initialDepartment?.id &&
            item.status === "正常",
        );
        const [birthdayMonth = "", birthdayDay = ""] = (
          person?.birthday || ""
        ).split("-");
        const industries = [...new Set(choices.map((item) => item.industry))];
        openModal(
          `<div class="modal-head"><div class="modal-title">${person ? "编辑关键人" : "新增关键人"}</div><button class="icon-btn close" data-close>×</button></div><form id="contactForm"><div class="modal-body"><div class="section-title">职业信息</div><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>行业</label><select class="input" id="pfIndustry" ${lockedProfession ? "disabled" : ""}><option value="">请选择行业</option>${industries.map((item) => `<option ${item === initialCompany.industry ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>集团</label><select class="input" id="pfGroup" ${lockedProfession ? "disabled" : ""}><option value="">请先选择行业</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户公司</label><select class="input" id="pfCompany" ${lockedProfession ? "disabled" : ""}><option value="">请先选择集团</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户部门</label><select class="input" id="pfDept" ${person ? "disabled" : ""}><option value="">请先选择客户公司</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>关键人岗位</label><select class="input" id="pfPosition" ${person ? "disabled" : ""}><option value="">请先选择客户部门</option></select></div></div><div class="role-note">${person ? "职业信息普通编辑只读；公司、部门或岗位变化请使用“发起调岗”。" : "五项均为普通单选；切换上级会清空下级选择。"}</div><div class="section-title">个人信息</div><div class="form-grid"><div class="form-group"><label class="form-label">关键人编号</label><input class="input" value="${person?.code || "保存后自动生成"}" disabled><div class="list-sub">KP + 8 位公司级流水</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>姓名</label><input class="input" id="pfName" value="${person?.name || ""}" minlength="2" maxlength="50" required></div><div class="form-group"><label class="form-label">性别</label><select class="input" id="pfGender"><option value="未说明" ${!person?.gender || person?.gender === "未说明" ? "selected" : ""}>未说明</option><option value="男" ${person?.gender === "男" ? "selected" : ""}>男</option><option value="女" ${person?.gender === "女" ? "selected" : ""}>女</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>职级</label><select class="input" id="pfLevel" required><option value="">请选择职级</option>${contactLevelOptions(person?.level || "")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>手机号</label><input class="input" id="pfPhone" value="${String(person?.phone || "").replace(/\D/g, "")}" inputmode="numeric" maxlength="11" pattern="1[3-9][0-9]{9}" required><div class="list-sub">11 位手机号，公司全局唯一</div></div><div class="form-group"><label class="form-label">微信号</label><input class="input" id="pfWechat" value="${person?.wechat || ""}" maxlength="64"></div><div class="form-group"><label class="form-label">邮箱</label><input class="input" id="pfEmail" type="email" maxlength="254" value="${person?.email || ""}"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>任职生效日</label><input class="input" id="pfEffectiveDate" type="date" max="${DEMO_TODAY}" value="${person?.effectiveDate || DEMO_TODAY}" ${person ? "disabled" : "required"}></div><div class="form-group"><label class="form-label">生日（公历月日）</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2)"><select class="input" id="pfBirthdayMonth"><option value="">月</option>${Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((month) => `<option value="${month}" ${month === birthdayMonth ? "selected" : ""}>${Number(month)}月</option>`).join("")}</select><select class="input" id="pfBirthdayDay"><option value="">日</option></select></div></div><div class="form-group"><label class="form-label">关键决策人</label><select class="input" id="pfDecision"><option value="true" ${person?.decision === true ? "selected" : ""}>是</option><option value="false" ${person?.decision !== true ? "selected" : ""}>否</option></select></div></div></div><div class="modal-foot">${person ? `<button class="btn" type="button" data-action="transfer" data-id="${person.id}">发起调岗</button>` : ""}<button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存关键人</button></div></form>`,
        );

        const fillContactCascade = (source = "initial") => {
          const industry = $("#pfIndustry").value;
          const groupCandidates = [...new Set(
            choices
              .filter((item) => item.industry === industry)
              .map((item) => item.group),
          )];
          const desiredGroup =
            source === "industry"
              ? ""
              : $("#pfGroup").value || initialCompany.group;
          $("#pfGroup").innerHTML =
            '<option value="">请选择集团</option>' +
            groupCandidates
              .map(
                (item) =>
                  `<option ${item === desiredGroup ? "selected" : ""}>${item}</option>`,
              )
              .join("");
          const companyCandidates = choices.filter(
            (item) =>
              item.industry === industry && item.group === $("#pfGroup").value,
          );
          const desiredCompany =
            ["industry", "group"].includes(source)
              ? ""
              : $("#pfCompany").value || initialCompanyName;
          $("#pfCompany").innerHTML =
            '<option value="">请选择客户公司</option>' +
            companyCandidates
              .map(
                (item) =>
                  `<option ${item.name === desiredCompany ? "selected" : ""}>${item.name}</option>`,
              )
              .join("");
          const departmentCandidates = customerDepartmentsForCompany(
            $("#pfCompany").value,
          );
          const desiredDepartment =
            ["industry", "group", "company"].includes(source)
              ? ""
              : $("#pfDept").value || String(initialDepartment?.id || "");
          $("#pfDept").innerHTML =
            '<option value="">请选择客户部门</option>' +
            departmentCandidates
              .map(
                (item) =>
                  `<option value="${item.id}" ${String(item.id) === desiredDepartment ? "selected" : ""}>${customerDepartmentPath(item)}</option>`,
              )
              .join("");
          const positionCandidates = contactPositionsForDepartment(
            $("#pfDept").value,
          );
          const desiredPosition =
            ["industry", "group", "company", "department"].includes(source)
              ? ""
              : $("#pfPosition").value || initialPosition?.id || "";
          $("#pfPosition").innerHTML =
            '<option value="">请选择关键人岗位</option>' +
            positionCandidates
              .map(
                (item) =>
                  `<option value="${item.id}" ${item.id === desiredPosition ? "selected" : ""}>${item.name} · ${item.code}</option>`,
              )
              .join("");
          $("#pfGroup").disabled = lockedProfession || !industry;
          $("#pfCompany").disabled =
            lockedProfession || !$("#pfGroup").value;
          $("#pfDept").disabled =
            Boolean(person) || !$("#pfCompany").value;
          $("#pfPosition").disabled =
            Boolean(person) || !$("#pfDept").value;
        };
        $("#pfIndustry").onchange = () => fillContactCascade("industry");
        $("#pfGroup").onchange = () => fillContactCascade("group");
        $("#pfCompany").onchange = () => fillContactCascade("company");
        $("#pfDept").onchange = () => fillContactCascade("department");
        fillContactCascade();

        const refreshBirthdayDays = () => {
          const month = Number($("#pfBirthdayMonth").value);
          const current = $("#pfBirthdayDay").value || birthdayDay;
          const days = month ? new Date(2024, month, 0).getDate() : 0;
          $("#pfBirthdayDay").innerHTML =
            '<option value="">日</option>' +
            Array.from({ length: days }, (_, index) =>
              String(index + 1).padStart(2, "0"),
            )
              .map(
                (day) =>
                  `<option value="${day}" ${day === current ? "selected" : ""}>${Number(day)}日</option>`,
              )
              .join("");
        };
        $("#pfBirthdayMonth").onchange = refreshBirthdayDays;
        refreshBirthdayDays();

        $("#contactForm").onsubmit = (event) => {
          event.preventDefault();
          const company = customers.find(
            (item) => item.name === $("#pfCompany").value,
          );
          const contactOperation = person
            ? "customers.edit_contact"
            : "customers.create_contact";
          if (
            !company ||
            !canMaintainContactForCompany(company, contactOperation)
          )
            return toast("当前选择不可用于新增关键人，请重新选择");
          const department = customerDepartments.find(
            (item) =>
              String(item.id) === String($("#pfDept").value) &&
              item.company === company?.name &&
              !item.archived,
          );
          const position = contactPositionCatalog.find(
            (item) =>
              item.id === $("#pfPosition").value &&
              item.departmentId === department?.id &&
              item.status === "正常",
          );
          if (!department || !position)
            return toast("请按行业、集团、客户公司、部门、岗位逐级完成选择");
          const name = $("#pfName").value.trim();
          const phone = $("#pfPhone").value.trim();
          const wechat = $("#pfWechat").value.trim();
          const month = $("#pfBirthdayMonth").value;
          const day = $("#pfBirthdayDay").value;
          if (name.length < 2 || name.length > 50)
            return toast("姓名需填写 2-50 字");
          if (!/^1[3-9][0-9]{9}$/.test(phone))
            return toast("请输入 11 位关键人手机号");
          if (Boolean(month) !== Boolean(day))
            return toast("生日月和生日日必须同时填写或同时留空");
          const duplicatePerson = contacts.find(
            (item) =>
              item.id !== person?.id &&
              ((phone && String(item.phone || "").replace(/\D/g, "") === phone) ||
                (wechat && item.wechat === wechat)),
          );
          if (duplicatePerson) {
            const visible = scopedContacts().some(
              (item) => item.id === duplicatePerson.id,
            );
            return toast(
              visible
                ? `联系方式已属于${duplicatePerson.name}，请打开既有关键人处理`
                : "联系方式已存在，请联系管理员核对",
            );
          }
          const data = {
            name,
            gender: $("#pfGender").value,
            title: position.name,
            company: company.name,
            department: department.name,
            positionSource: "standard",
            positionId: position.id,
            positionName: position.name,
            level: $("#pfLevel").value,
            phone,
            wechat,
            email: $("#pfEmail").value.trim(),
            birthday: month && day ? `${month}-${day}` : "",
            decision: $("#pfDecision").value === "true",
            decisionConfirmed: true,
            effectiveDate: person?.effectiveDate || $("#pfEffectiveDate").value,
            pm: company.level === "省公司" ? "" : customerOwnerName(company),
            region: company.region,
            city: company.city,
            last: person?.last || "从未",
            status: person?.status || "健康",
            createdAt: person?.createdAt || `${DEMO_TODAY} 11:30`,
            updatedAt: recordCreatedAt(),
            source: person?.source || "manual",
          };
          if (person) Object.assign(person, data);
          else {
            const created = {
              id: Date.now(),
              code: nextBusinessCode("KP"),
              ...data,
            };
            contacts.push(created);
            company.contacts += 1;
            ensureRegularTask(created, DEMO_TODAY, true);
          }
          closeOverlay();
          renderPage();
          toast(
            person
              ? "关键人信息已更新并保留修改日志"
              : `关键人 ${contacts[contacts.length - 1].code} 已创建`,
          );
        };
      }
      function pendingStopApproval(kind, id) {
        return approvals.find(
          (approval) =>
            ["pending", "paused_invalid_handler"].includes(approval.status) &&
            approval.targetKind === kind &&
            String(approval.targetId) === String(id),
        );
      }

      function stopRequestLockApproval(kind, id) {
        return approvals.find(
          (approval) =>
            ["pending", "paused_invalid_handler", "processing_failed"].includes(
              approval.status,
            ) &&
            approval.targetKind === kind &&
            String(approval.targetId) === String(id),
        );
      }

      function canRequestObjectStop(kind, obj) {
        if (!currentUser || !obj) return false;
        if (!hasOperationPermission("archive.request_stop")) return false;
        if (currentUser.fullAccess) return true;
        if (["group", "department"].includes(kind))
          return ["president", "vp"].includes(currentUser.role);
        if (["president", "vp"].includes(currentUser.role)) return true;
        if (kind === "customer") return companyIsVisible(obj);
        if (kind === "contact") {
          const company = customers.find((item) => item.name === obj.company);
          return Boolean(company && companyIsVisible(company));
        }
        return false;
      }

      function stopObjectActionHtml(kind, id) {
        const approval = stopRequestLockApproval(kind, id);
        if (approval)
          return `<button class="btn" data-action="approval-detail" data-id="${approval.id}">查看停用审批 ${approval.code}</button>`;
        const obj =
          kind === "group"
            ? { name: String(id) }
            : kind === "contact"
              ? contacts.find((item) => item.id === Number(id))
              : kind === "department"
                ? customerDepartments.find((item) => item.id === Number(id))
                : customers.find((item) => item.id === Number(id));
        return canRequestObjectStop(kind, obj)
          ? `<button class="btn btn-danger" data-action="stop-object" data-kind="${kind}" data-id="${id}">申请停用</button>`
          : "";
      }

      function objectApprovalRoute(kind, obj) {
        if (currentUser.role === "president")
          return {
            current: "总裁直接确认",
            assignees: [currentUser.name],
            ccUsers: [],
            direct: true,
          };
        if (["group", "department"].includes(kind)) {
          if (currentUser.role === "vp")
            return {
              current: "总裁审批",
              assignees: ["刘总"],
              ccUsers: [],
              direct: false,
            };
          return {
            current: "市场副总审批",
            assignees: ["王静"],
            ccUsers: ["刘总"],
            direct: false,
          };
        }
        const company =
          kind === "customer"
            ? obj
            : customers.find((item) => item.name === obj.company);
        const isProvinceCompany = company?.level === "省公司";
        if (isProvinceCompany) {
          if (currentUser.role === "director")
            return {
              current: "市场副总审批",
              assignees: ["王静"],
              ccUsers: ["刘总"],
              direct: false,
            };
          if (currentUser.role === "vp")
            return {
              current: "总裁审批",
              assignees: ["刘总"],
              ccUsers: [],
              direct: false,
            };
        }
        const director = regionDirectorName(company?.region || obj.region);
        if (currentUser.role === "director")
          return {
            current: "市场副总审批",
            assignees: ["王静"],
            ccUsers: ["刘总"],
            direct: false,
          };
        return {
          current: "区域总监审批",
          assignees: [director],
          ccUsers: ["王静"],
          direct: false,
        };
      }

      function openStopObject(kind, id) {
        const normalizedId = kind === "group" ? String(id) : Number(id);
        const obj =
          kind === "group"
            ? customerGroupNames.includes(normalizedId)
              ? { id: normalizedId, name: normalizedId, group: normalizedId }
              : null
            : kind === "contact"
              ? contacts.find((x) => x.id === normalizedId)
              : kind === "department"
                ? customerDepartments.find((x) => x.id === normalizedId)
                : customers.find((x) => x.id === normalizedId);
        if (!obj) return;
        if (!canRequestObjectStop(kind, obj))
          return toast("当前账号无权发起该对象的停用申请");
        const kindName =
          kind === "group"
            ? "集团公司"
            : kind === "contact"
            ? "关键人"
            : kind === "department"
            ? "客户部门"
              : "客户单位";
        if (stopRequestLockApproval(kind, normalizedId) || obj.pendingStop)
          return toast("该对象已有停用审批，不能重复提交");
        const affectedCustomers =
          kind === "group"
            ? customers.filter(
                (company) => !company.archived && company.group === obj.name,
              )
            : kind === "customer"
              ? [obj]
              : [];
        const affectedPeople =
          kind === "group"
            ? contacts.filter((person) => {
                const company = customers.find(
                  (item) => item.name === person.company,
                );
                return (
                  contactIsActive(person) && company?.group === obj.name
                );
              })
            : kind === "contact"
            ? [obj]
            : kind === "department"
              ? contacts.filter((person) => {
                  return (
                    contactIsActive(person) &&
                    person.company === obj.company &&
                    person.department === obj.name
                  );
                })
              : contacts.filter(
                  (person) =>
                    contactIsActive(person) && person.company === obj.name,
                );
        const affectedNames = new Set(affectedPeople.map((person) => person.name));
        const unfinishedTasks = tasks.filter(
          (task) =>
            affectedNames.has(task.person) &&
            !["done", "cancelled"].includes(task.status),
        );
        const pendingApprovals = approvals.filter(
          (approval) =>
            approval.status === "pending" &&
            (affectedPeople.some((person) => approval.title.includes(person.name)) ||
              affectedCustomers.some((company) =>
                approval.title.includes(company.name),
              )),
        );
        const replacementDepartments =
          kind === "department"
            ? customerDepartments.filter(
                (department) =>
                  !department.archived &&
                  department.company === obj.company &&
                  department.id !== obj.id,
                )
            : [];
        const route = objectApprovalRoute(kind, obj);
        openModal(
          `<div class="modal-head"><div class="modal-title">申请停用${kindName}</div><button class="icon-btn close" data-close>×</button></div><form id="stopForm"><div class="modal-body"><div class="detail-grid"><div class="detail-item"><label>对象</label><div>${obj.name}</div></div>${kind === "group" ? `<div class="detail-item"><label>集团编号</label><div>${customerGroupNumbers[obj.name]}</div></div>` : ""}<div class="detail-item"><label>当前状态</label><div>正常</div></div>${kind === "group" ? `<div class="detail-item"><label>正常客户单位</label><div>${affectedCustomers.length}</div></div><div class="detail-item"><label>正常客户部门</label><div>${customerDepartments.filter((item) => !item.archived && item.group === obj.name).length}</div></div>` : ""}<div class="detail-item"><label>有效关键人 / 任职</label><div>${affectedPeople.length}</div></div><div class="detail-item"><label>未完成任务</label><div>${unfinishedTasks.length}</div></div><div class="detail-item"><label>进行中审批</label><div>${pendingApprovals.length}</div></div><div class="detail-item"><label>覆盖 KPI 影响</label><div>${affectedPeople.length ? "将实时重算" : "无"}</div></div></div>${pendingApprovals.length ? `<div class="role-note danger-note">存在进行中流程 ${pendingApprovals.map((approval) => approval.code).join("、")}，必须先处理后才能提交停用。</div>` : ""}${kind === "group" && affectedCustomers.length ? `<label class="choice-item" style="margin-top:var(--space-4)"><input id="stopCascadeGroup" type="checkbox"><span>完整级联停用全部 ${affectedCustomers.length} 家客户单位及 ${affectedPeople.length} 名有效关键人</span></label>` : ""}${kind === "customer" && affectedPeople.length ? `<label class="choice-item" style="margin-top:var(--space-4)"><input id="stopCascade" type="checkbox"><span>完整级联停用该单位全部 ${affectedPeople.length} 名有效关键人</span></label>` : ""}${kind === "department" && affectedPeople.length ? `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>替代客户部门</label><select class="input" id="stopReplacementDepartment"><option value="">请选择同一客户公司内的正常部门</option>${replacementDepartments.map((department) => `<option value="${department.id}">${department.name}</option>`).join("")}</select><div class="list-sub">仅迁移当前任职，历史任职保留原部门名称</div></div>` : ""}<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>影响处理</label><select class="input" id="stopTaskHandle"><option>关闭未完成任务并记录原因</option><option>先处理任务后再停用</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>停用原因</label><textarea class="input" id="stopReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字停用原因"></textarea></div><div class="role-note">审批路由：${route.direct ? "总裁直接确认并形成已通过审计实例" : `${route.current}（${route.assignees.join("、")}）`}。审批通过前对象仍按正常状态参与业务，审批进度在原流程中查看；生效后从正常列表、候选和实时统计中剔除。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">${route.direct ? "确认停用并记录审计" : "提交停用审批"}</button></div></form>`,
        );
        $("#stopForm").onsubmit = (e) => {
          e.preventDefault();
          if (pendingApprovals.length)
            return toast("请先处理对象关联的进行中审批");
          if (kind === "customer" && affectedPeople.length && !$("#stopCascade").checked)
            return toast("客户单位存在有效关键人，必须完整级联停用或先完成调岗");
          if (
            kind === "group" &&
            affectedCustomers.length &&
            !$("#stopCascadeGroup").checked
          )
            return toast("集团存在正常客户单位，必须选择完整级联停用");
          if (
            kind === "department" &&
            affectedPeople.length &&
            !$("#stopReplacementDepartment").value
          )
            return toast("客户部门仍有当前任职引用，请选择同一客户公司内的替代部门");
          if (
            $("#stopTaskHandle").value === "先处理任务后再停用" &&
            unfinishedTasks.length
          )
            return toast(`仍有 ${unfinishedTasks.length} 条未完成任务，请先处理后再提交`);
          const flowCode = nextBusinessCode("WF");
          const approval = {
            id: Date.now(),
            code: flowCode,
            source: "manual",
            type: kindName + "停用",
            title: `停用${obj.name}`,
            applicant: currentUser.name,
            region: obj.region || (kind === "group" ? "公司全局" : "山东区域"),
            current: route.current,
            currentAssignees: [...route.assignees],
            ccUsers: [...route.ccUsers],
            status: "pending",
            date: recordCreatedAt(),
            reason: $("#stopReason").value.trim(),
            taskHandle: $("#stopTaskHandle").value,
            cascadeContactIds:
              ["customer", "group"].includes(kind)
                ? affectedPeople.map((person) => person.id)
                : [],
            cascadeCustomerIds:
              kind === "group"
                ? affectedCustomers.map((company) => company.id)
                : [],
            replacementDepartmentId:
              kind === "department"
                ? Number($("#stopReplacementDepartment")?.value || 0)
                : 0,
            impactSnapshot: {
              people: affectedPeople.length,
              tasks: unfinishedTasks.length,
              approvals: pendingApprovals.length,
              customers: affectedCustomers.length,
            },
            targetKind: kind,
            targetId: normalizedId,
            businessNumber:
              kind === "group" ? customerGroupNumbers[obj.name] : "",
          };
          approvals.unshift(approval);
          archivedItems.unshift({
            id: Date.now() + 1,
            name: obj.name,
            type: kindName,
            parent:
              kind === "group"
                ? "客户组织"
                : obj.company || obj.group || "客户组织",
            reason: approval.reason,
            date: approval.date.slice(0, 10),
            applicant: currentUser.name,
            status: "正常",
            approvalStatus: "审批中",
            targetKind: kind,
            targetId: normalizedId,
            region: approval.region,
            flowCode,
            effectiveAt: "",
            recoveryStatus: "未申请",
            taskHandle: approval.taskHandle,
            impact: `${affectedCustomers.length ? `客户单位 ${affectedCustomers.length} 家，` : ""}关键人/任职 ${affectedPeople.length}，未完成任务 ${unfinishedTasks.length}`,
            businessNumber:
              kind === "group" ? customerGroupNumbers[obj.name] : "",
            groupSnapshot:
              kind === "group"
                ? {
                    groupNumber: customerGroupNumbers[obj.name],
                    industry: customerGroupIndustries[obj.name] || "",
                    creditCode: customerGroupCreditCodes[obj.name] || "",
                  }
                : null,
          });
          if (kind === "group") pendingGroupStops.add(obj.name);
          else obj.pendingStop = true;
          if (route.direct) {
            approval.decisionComment = "总裁确认停用并按影响摘要执行。";
            handleApproval(approval.id, true);
          }
          closeOverlay();
          renderPage();
          toast(
            route.direct
              ? "停用已直接生效并生成完整审计记录"
              : `停用申请已提交${route.current}`,
          );
        };
      }
