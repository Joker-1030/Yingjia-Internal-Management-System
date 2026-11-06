      // Product authority: M13 §§2-9, DEC-229. No client-side claim of production at-rest encryption.
      function teacherById(id) { return teachers.find((teacher) => teacher.id === id); }
      function teacherEmployee() { return employees.find((employee) => employee.code === currentUser?.employeeCode || employee.name === currentUser?.name); }
      function teacherIsAdmin() { return isProjectConfigAdmin(); }
      function teacherHasExecutiveScope() {
        const employee = teacherEmployee();
        return Boolean(employee && employee.status === "在职" && employee.accountStatus !== "停用" && !currentUser?.disabled &&
          currentRoleTemplates().some(template => ["总裁", "市场副总"].includes(template.name) && template.permissions.includes("teachers") && roleOperationPermissions[template.name]?.includes("teachers.view")));
      }
      function teacherHasGlobalScope() { return teacherIsAdmin() || teacherHasExecutiveScope(); }

      function teacherIsFacultySupervisor() {
        const employee = teacherEmployee();
        return Boolean(employee && employee.status === "在职" && organizationDepartments.some((department) => department.name === "师资管理部" && department.supervisorCode === employee.code));
      }
      function teacherCanConfigureScopes() { return teacherIsAdmin() || teacherIsFacultySupervisor() || (teacherHasExecutiveScope() && hasOperationPermission("teachers.manage")); }
      function teacherScopes() {
        if (teacherHasGlobalScope() || teacherIsFacultySupervisor()) return Object.keys(TEACHER_SCOPE_NAMES);
        return currentRoleTemplateNames().includes("教学管理人员")
          ? teachingManagementAssignments[teacherEmployee()?.code] || [] : [];
      }
      function teacherName(teacher) {
        return teacher?.type === "内部" ? employees.find((employee) => employee.code === teacher.employeeCode)?.name || teacher.name : teacher?.name || "—";
      }
      function teacherMatchesScope(teacher) {
        const scopes = teacherScopes();
        return Boolean(teacher && (teacher.type === "内部" ? scopes.includes("internal") : teacher.channels.some((channel) => scopes.includes(channel.kind))));
      }
      function teacherIsSelf(teacher) {
        return Boolean(teacher?.type === "内部" && currentRoleTemplateNames().includes("老师") && teacher.employeeCode === teacherEmployee()?.code);
      }
      function teacherCanManage(teacher) {
        return Boolean(teacher && (teacherIsAdmin() || teacherIsFacultySupervisor() || (teacherMatchesScope(teacher) && hasPermission("teachers") && hasOperationPermission("teachers.view") && hasOperationPermission("teachers.manage"))));
      }
      function teacherCanView(teacher) {
        return Boolean(teacher && (teacherIsAdmin() || teacherIsFacultySupervisor() || (hasPermission("teachers") && hasOperationPermission("teachers.view") && (teacherMatchesScope(teacher) || teacherIsSelf(teacher)))));
      }
      function teacherCanChannel(teacher, channel) {
        return teacherCanView(teacher) && (teacherIsAdmin() || teacherIsFacultySupervisor() || (teacherMatchesScope(teacher) && teacherScopes().includes(channel.kind)));
      }
      function teacherCanResume(teacher, action = "view") {
        return teacherCanView(teacher) && (teacherIsAdmin() || teacherIsFacultySupervisor() || teacherMatchesScope(teacher)) && (teacherIsFacultySupervisor() || hasAttachmentPermission(`teacher_resume_${action}`));
      }
      function teacherCanFullContact(teacher) {
        return teacherCanView(teacher) && (teacherIsFacultySupervisor() || hasFieldPermission("teacher_contact_view")) && (teacherIsAdmin() || teacherIsFacultySupervisor() || teacherMatchesScope(teacher) || teacherIsSelf(teacher));
      }
      function teacherCanFee(teacher, channel = null) {
        return teacherCanView(teacher) && (teacherIsFacultySupervisor() || hasFieldPermission("teacher_fee_view")) && (teacherIsAdmin() || teacherIsFacultySupervisor() || (teacherMatchesScope(teacher) && (!channel || teacherCanChannel(teacher, channel))));
      }
      function teacherRawContact(teacher, key) {
        if (key === "phone" && teacher.type === "内部") return employees.find((employee) => employee.code === teacher.employeeCode)?.phone || "";
        return teacher[key] || "";
      }
      function maskTeacherContact(value, key) {
        if (!value) return "—";
        const text = String(value);
        if (key === "phone") return text.length >= 7 ? text.slice(0, 3) + "****" + text.slice(-4) : "***";
        if (key === "email") { const at = text.indexOf("@"); return at > 0 ? text.slice(0, 1) + "***" + text.slice(at) : "***"; }
        return text.slice(0, 1) + "***";
      }
      function teacherCourseOptions() {
        return projectPackages.flatMap((pkg) => pkg.directions.map((course) => ({ id: course.directionId, name: course.intro, packageId: pkg.id, packageName: pkg.name })));
      }
      function teacherDirectionName(id) {
        const course = teacherCourseOptions().find((item) => item.id === id);
        return course ? `${course.packageName} · ${course.name}` : "—";
      }
      function teacherAge(birthDate) {
        if (!birthDate) return "—";
        const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(new Date());
        return Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4)) - (today.slice(5) < birthDate.slice(5) ? 1 : 0);
      }
      function teacherProjectIds(project) { return [...new Set(Object.values(project.teacherAssignments || {}).flat())]; }
      function teacherDate(value) { return String(value || "").slice(0, 10); }
      function teacherDatesOverlap(start, end, otherStart, otherEnd) { return Boolean(start && end && otherStart && otherEnd && start <= otherEnd && otherStart <= end); }
      function teacherProjectBookings(teacherId, excludeProjectId = "") {
        return projects.filter((project) => project.id !== excludeProjectId && project.type === "培训项目" && !["已取消", "已中止"].includes(project.stage) && teacherProjectIds(project).includes(teacherId));
      }
      function teacherConflicts(teacherId, start, end, excludeProjectId = "") {
        const from = teacherDate(start), to = teacherDate(end);
        const teacher = teacherById(teacherId);
        if (!teacher || !from || !to) return [];
        return [
          ...teacherProjectBookings(teacherId, excludeProjectId).filter((project) => teacherDatesOverlap(from, to, teacherDate(project.startTime), teacherDate(project.endTime))).map((project) => ({ name: teacherName(teacher), projectId: project.id, startTime: teacherDate(project.startTime), endTime: teacherDate(project.endTime) })),
          ...teacher.unavailable.filter((item) => teacherDatesOverlap(from, to, item.start, item.end)).map((item) => ({ name: teacherName(teacher), projectId: "人工不可用", startTime: item.start, endTime: item.end })),
        ];
      }
      function teacherEligibility(teacherId, directionId, start, end, role = "lecturers", excludeProjectId = "", resourceType = "") {
        const teacher = teacherById(teacherId);
        if (!teacher) return "请选择已建档老师";
        const originalAssignment = projects.find((project) => project.id === excludeProjectId)?.teacherAssignments?.[role]?.includes(teacherId);
        if (!TEACHER_ROLE_TYPES[role] || (!originalAssignment && !teacher.teachingTypes.includes(TEACHER_ROLE_TYPES[role]))) return "老师不具备对应授课类型，请重新选择";
        if (!teacherValidResidence(teacher.residenceProvince, teacher.residenceCity)) return "老师常驻省市未完善，请先补录";
        if (teacher.status !== "启用") return "老师已停用，请重新选择";
        if (teacher.type === "内部") {
          const employee = employees.find((item) => item.code === teacher.employeeCode);
          if (!employee || employee.status !== "在职" || !employeeHasRole(employee, "老师")) return "关联员工已停用或不再具有老师角色，请重新选择";
        }
        if (!start || !end || teacherDate(start) > teacherDate(end)) return "请先填写有效的项目日期";
        if (resourceType !== "框架服务" && role !== "teachingAssistants" && !teacherCourseOptions().some((item) => item.id === directionId)) return "请先选择采购包及课程";
        if (resourceType !== "框架服务" && role !== "teachingAssistants" && !teacher.directions.includes(directionId)) return "老师教学方向不包含所选课程，请重新选择";
        if (teacherConflicts(teacherId, start, end, excludeProjectId).length) return "该日期已有安排，请重新选择";
        return "";
      }
      function teacherSelectionCandidates(directionId, start, end, role = "lecturers", excludeProjectId = "", resourceType = "") {
        if ((!directionId && resourceType !== "框架服务") || !start || !end) return [];
        return teachers.filter((teacher) => !teacherEligibility(teacher.id, directionId, start, end, role, excludeProjectId, resourceType));
      }
      function teacherValidResidence(province, city) { return Boolean(province && city && Object.hasOwn(administrativeDivisions, province) && Object.hasOwn(administrativeDivisions[province], city)); }
      function teacherResidence(teacher) { return [teacher.residenceProvince, teacher.residenceCity].filter(Boolean).join(" · "); }
      function teacherFeeKinds(internal) { return internal ? [["standard", "对外标准课酬"], ["settlement", "内部结算课酬"]] : [["reference", "参考课酬"]]; }
      function teacherRoleFeesHtml(fees, internal, teachingTypes) {
        return TEACHER_TEACHING_TYPES.filter((type) => teachingTypes.includes(type)).map((type) => teacherFeeKinds(internal).map(([key, label]) => teacherFeeHtml(fees?.[type]?.[key]?.fee, fees?.[type]?.[key]?.tax, `${type} · ${label}`)).join("")).join("");
      }
      function teacherPublicProfile(teacher) {
        return { name: teacherName(teacher), type: teacher.type, teachingTypes: teacher.teachingTypes.join("、"), residence: teacherResidence(teacher), intro: teacher.intro, gender: teacher.gender, birthDate: teacher.birthDate, age: teacherAge(teacher.birthDate), education: teacher.education, directions: teacher.directions.map(teacherDirectionName).join("、"), phone: maskTeacherContact(teacherRawContact(teacher, "phone"), "phone"), email: maskTeacherContact(teacher.email, "email"), wechat: maskTeacherContact(teacher.wechat, "wechat") };
      }
      function teacherInfoHtml(label, value) { return `<div class="detail-item"><label>${label}</label><div>${escapeHtml(value ?? "—") || "—"}</div></div>`; }
      function teacherFeeHtml(fee, tax, label) { return teacherInfoHtml(`${label}（${tax || "税务口径待补"}，元/天）`, fee == null ? "—" : Number(fee).toFixed(2)); }
      function teacherPublicHtml(teacher) {
        const profile = teacherPublicProfile(teacher);
        return `<div class="detail-grid">${teacherInfoHtml("授课类型", profile.teachingTypes)}${teacherInfoHtml("常驻地", profile.residence)}${teacherInfoHtml("简介", profile.intro)}${teacherInfoHtml("教学方向", profile.directions)}${teacherInfoHtml("性别", profile.gender)}${teacherInfoHtml("出生日期", profile.birthDate)}${teacherInfoHtml("年龄", profile.age === "—" ? "—" : profile.age + "岁")}${teacherInfoHtml("学历", profile.education)}</div>`;
      }
      function teacherContactsHtml(teacher, projectOnly = false) {
        const canReveal = !projectOnly && teacherCanFullContact(teacher);
        return `<div class="section-title">联系方式</div><div class="detail-grid" data-teacher-contacts>${[ ["phone", "手机号"], ["email", "邮箱"], ["wechat", "微信号"] ].map(([key, label]) => teacherInfoHtml(label, maskTeacherContact(teacherRawContact(teacher, key), key))).join("")}</div>${canReveal ? `<button class="btn btn-sm" data-teacher-reveal="${teacher.id}">查看完整联系方式</button>` : ""}`;
      }
      function teacherScheduleHtml(teacher, allowAdd = true) {
        const canAdd = allowAdd && teacherCanSchedule(teacher);
        const bookingRows = teacherProjectBookings(teacher.id).map((project) => `<tr><td>项目授课</td><td>${teacherDate(project.startTime)}</td><td>${teacherDate(project.endTime)}</td><td>${escapeHtml(project.id)}<div class="list-sub">${escapeHtml(project.name)}</div></td><td>—</td><td>—</td></tr>`);
        const unavailableRows = teacher.unavailable.map((item) => {
          const canEdit = teacherCanSchedule(teacher, item);
          return `<tr><td>人工不可用</td><td>${escapeHtml(item.start)}</td><td>${escapeHtml(item.end)}</td><td>${escapeHtml(employees.find((employee) => employee.code === item.createdBy)?.name || "管理员")}</td><td class="teacher-unavailable-reason">${escapeHtml(item.reason)}</td><td>${canEdit ? `<button class="btn btn-sm" data-teacher-unavailable="${teacher.id}" data-unavailable-id="${item.id}">编辑</button> <button class="btn btn-sm" data-teacher-remove-unavailable="${teacher.id}" data-unavailable-id="${item.id}">删除</button>` : "—"}</td></tr>`;
        });
        return `<div class="panel-head teacher-section-head"><div class="section-title">排期</div>${canAdd ? `<button class="btn btn-sm" data-teacher-unavailable="${teacher.id}">登记不可用日期</button>` : ""}</div><div class="table-wrap"><table class="teacher-schedule-table"><thead><tr><th>安排类型</th><th>开始日期</th><th>结束日期</th><th>项目 / 登记人</th><th>备注/原因</th><th>操作</th></tr></thead><tbody>${[...bookingRows, ...unavailableRows].join("") || '<tr><td colspan="6"><div class="empty">暂无排期</div></td></tr>'}</tbody></table></div>`;
      }
      function teacherChannelsHtml(teacher) {
        const channels = teacher.channels.filter((channel) => teacherCanChannel(teacher, channel));
        if (teacher.type === "内部") return teacherCanFee(teacher) ? `<div class="section-title">课酬</div><div class="detail-grid">${teacherRoleFeesHtml(teacher.roleFees, true, teacher.teachingTypes)}</div>` : "";
        return channels.length ? `<div class="section-title">合作渠道</div><div class="teacher-channel-list">${channels.map((channel) => `<section class="teacher-channel-card"><h4>${channel.kind === "personal" ? "个人合作" : escapeHtml(channel.agencyName)}</h4><div class="detail-grid">${channel.kind === "agency" ? teacherInfoHtml("联系人", channel.contact) + [ ["phone", "联系电话"], ["wechat", "联系人微信号"], ["email", "联系人邮箱"] ].map(([key, label]) => teacherInfoHtml(label, maskTeacherContact(channel[key], key))).join("") : ""}${teacherCanFee(teacher, channel) ? teacherRoleFeesHtml(channel.roleFees, false, teacher.teachingTypes) : ""}</div>${channel.kind === "agency" && teacherCanFullContact(teacher) ? `<button class="btn btn-sm" data-teacher-channel-reveal="${teacher.id}" data-channel-id="${channel.id}">查看完整渠道联系方式</button>` : ""}</section>`).join("")}</div>` : "";
      }
      function teacherResumesHtml(teacher) {
        if (!teacherCanResume(teacher)) return "";
        return `<div class="section-title">简历</div><div class="teacher-resume-list">${teacher.resumes.map((file) => `<div class="teacher-resume-row"><span>${escapeHtml(file.name)}<span class="list-sub"> · ${formatFileSize(file.size)}</span></span><span><button class="btn btn-sm" data-teacher-resume="${teacher.id}" data-resume-id="${file.id}">预览</button>${teacherCanResume(teacher, "delete") ? ` <button class="btn btn-sm" data-teacher-resume-delete="${teacher.id}" data-resume-id="${file.id}">删除</button>` : ""}${teacherCanResume(teacher, "download") ? ` <button class="btn btn-sm" data-teacher-resume="${teacher.id}" data-resume-id="${file.id}" data-resume-download>下载</button>` : ""}</span></div>`).join("") || '<div class="list-sub">暂未上传简历</div>'}</div>`;
      }
      function teacherDetailHtml(teacher, projectOnly = false) {
        return `<div class="drawer-head"><div class="modal-title">老师详情</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="drawer-body teacher-detail"><div class="detail-hero"><div class="avatar">${escapeHtml(teacherName(teacher).slice(0, 1))}</div><div><div class="detail-name">${escapeHtml(teacherName(teacher))}</div><div class="detail-sub">${teacher.type}老师 · ${teacher.status}</div></div></div>${teacherPublicHtml(teacher)}${!projectOnly && teacher.type === "外部" ? `<div class="detail-grid">${teacherInfoHtml("合作属性", teacher.cooperationType)}</div>` : ""}${teacherContactsHtml(teacher, projectOnly)}${projectOnly ? "" : teacherChannelsHtml(teacher) + teacherResumesHtml(teacher) + teacherScheduleHtml(teacher, !teacherManagementScheduleEntry())}</div><div class="drawer-foot"><button class="btn" data-close>关闭</button></div>`;
      }
      function teacherHasCompanyScheduleAccess() {
        return teacherHasExecutiveScope();
      }
      function teacherScheduleContext() {
        if (teacherScheduleState.actor !== currentUser) teacherScheduleState = { actor: currentUser, month: DEMO_TODAY.slice(0, 7), view: "calendar", selected: null };
        const companyViewer = teacherHasCompanyScheduleAccess();
        const allowed = canAccessPage("teacher-schedule") && hasOperationPermission("teachers.view");
        const managing = allowed && (companyViewer || teacherIsAdmin() || teacherIsFacultySupervisor() || currentRoleTemplateNames().includes("教学管理人员"));
        const available = allowed ? teachers.filter((teacher) => companyViewer || (teacherCanView(teacher) && (managing ? teacherIsAdmin() || teacherIsFacultySupervisor() || teacherMatchesScope(teacher) : teacherIsSelf(teacher)))) : [];
        const ids = new Set(available.map((teacher) => teacher.id));
        if (teacherScheduleState.selected !== null) teacherScheduleState.selected = teacherScheduleState.selected.filter((id) => ids.has(id));
        if (!managing) teacherScheduleState.view = "calendar";
        return { managing, available, selected: available.filter((teacher) => teacherScheduleState.selected === null || teacherScheduleState.selected.includes(teacher.id)) };
      }
      function teacherShiftDate(date, days) { const value = new Date(date + "T00:00:00Z"); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
      function teacherMonthRange(month) {
        const start = month + "-01", value = new Date(start + "T00:00:00Z");
        value.setUTCMonth(value.getUTCMonth() + 1); value.setUTCDate(0);
        return { start, end: value.toISOString().slice(0, 10), days: value.getUTCDate() };
      }
      function teacherScheduleEvents(selected, month) {
        const range = teacherMonthRange(month);
        return selected.flatMap((teacher) => [
          ...teacherProjectBookings(teacher.id).map((project) => ({ teacherId: teacher.id, id: project.id, kind: "project", start: teacherDate(project.startTime), end: teacherDate(project.endTime), label: teacherName(teacher) + " · " + project.name })),
          ...teacher.unavailable.map((item) => ({ teacherId: teacher.id, id: item.id, kind: "unavailable", start: item.start, end: item.end, label: teacherName(teacher) + " · 人工不可用" })),
        ]).filter((event) => teacherDatesOverlap(event.start, event.end, range.start, range.end));
      }
      function teacherScheduleSegments(events, start, end) {
        const lanes = [];
        return events.filter((event) => teacherDatesOverlap(event.start, event.end, start, end)).map((event) => {
          const from = event.start < start ? start : event.start, to = event.end > end ? end : event.end;
          const left = Math.round((Date.parse(from) - Date.parse(start)) / 86400000), right = Math.round((Date.parse(to) - Date.parse(start)) / 86400000);
          let lane = lanes.findIndex((last) => last < left);
          if (lane < 0) lane = lanes.length;
          lanes[lane] = right;
          return { ...event, left, span: right - left + 1, lane };
        });
      }
      function teacherScheduleBar(event, gridOffset = 0) {
        return `<button type="button" class="teacher-event teacher-event-${event.kind}" style="grid-column:${event.left + 1 + gridOffset} / span ${event.span};grid-row:${event.lane + 2}" data-teacher-schedule-item="${escapeHtml(event.id)}" data-teacher-id="${event.teacherId}" data-schedule-kind="${event.kind}" title="${escapeHtml(event.label + ' · ' + event.start + ' 至 ' + event.end)}">${escapeHtml(event.label)}</button>`;
      }
      function teacherCalendarHtml(events, month) {
        const range = teacherMonthRange(month), weekday = (new Date(range.start + "T00:00:00Z").getUTCDay() + 6) % 7;
        const first = teacherShiftDate(range.start, -weekday), weeks = Math.ceil((weekday + range.days) / 7);
        return `<div class="teacher-calendar" aria-label="老师月历"><div class="teacher-calendar-weekdays">${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<span>周${day}</span>`).join("")}</div>${Array.from({ length: weeks }, (_, week) => {
          const start = teacherShiftDate(first, week * 7), end = teacherShiftDate(start, 6);
          const visibleStart = start < range.start ? range.start : start, visibleEnd = end > range.end ? range.end : end;
          const segments = teacherScheduleSegments(events.map((event) => ({ ...event, start: event.start < range.start ? range.start : event.start, end: event.end > range.end ? range.end : event.end })), start, end).filter((event) => teacherDatesOverlap(event.start, event.end, visibleStart, visibleEnd));
          const lanes = Math.max(1, ...segments.map((event) => event.lane + 1));
          return `<div class="teacher-calendar-week" style="grid-template-rows:28px repeat(${lanes},28px) 12px">${Array.from({ length: 7 }, (_, index) => { const date = teacherShiftDate(start, index); return `<div class="teacher-calendar-day ${date.slice(0, 7) !== month ? 'outside' : ''} ${date === DEMO_TODAY ? 'today' : ''}" style="grid-column:${index + 1};grid-row:1 / -1"><time datetime="${date}">${Number(date.slice(-2))}</time></div>`; }).join("")}${segments.map((event) => teacherScheduleBar(event)).join("")}</div>`;
        }).join("")}</div>`;
      }
      function teacherGanttHtml(events, selected, month) {
        const range = teacherMonthRange(month);
        return `<div class="teacher-gantt" aria-label="老师排期甘特图"><div class="teacher-gantt-head" style="--teacher-days:${range.days}"><strong>老师</strong>${Array.from({ length: range.days }, (_, index) => `<time datetime="${teacherShiftDate(range.start, index)}">${index + 1}</time>`).join("")}</div>${selected.map((teacher) => {
          const segments = teacherScheduleSegments(events.filter((event) => event.teacherId === teacher.id), range.start, range.end), lanes = Math.max(1, ...segments.map((event) => event.lane + 1));
          return `<div class="teacher-gantt-row" style="--teacher-days:${range.days};grid-template-rows:8px repeat(${lanes},28px) 8px"><strong class="teacher-gantt-name" style="grid-row:1 / -1">${escapeHtml(teacherName(teacher))}</strong>${Array.from({ length: range.days }, (_, index) => `<span class="teacher-gantt-day" style="grid-column:${index + 2};grid-row:1 / -1"></span>`).join("")}${segments.map((event) => teacherScheduleBar(event, 1)).join("")}</div>`;
        }).join("")}</div>`;
      }
      function teacherSchedulePanelHtml() {
        const { managing, available, selected } = teacherScheduleContext(), state = teacherScheduleState, events = teacherScheduleEvents(selected, state.month);
        return `<section class="panel teacher-schedule-panel"><div class="panel-head"><div class="teacher-schedule-controls"><label>月份 <input class="input" type="month" id="teacherScheduleMonth" value="${state.month}" aria-label="排期月份"></label>${managing ? `<details class="teacher-schedule-filter" id="teacherSchedulePicker"><summary class="btn teacher-schedule-select">选择老师</summary><div id="teacherScheduleOptions"><label><input type="checkbox" id="teacherScheduleAll" ${selected.length === available.length ? "checked" : ""}>${teacherHasCompanyScheduleAccess() ? "全部老师" : "全部负责老师"}</label>${available.map((teacher) => `<label><input type="checkbox" data-teacher-schedule-filter="${teacher.id}" ${selected.includes(teacher) ? "checked" : ""}>${escapeHtml(teacherName(teacher))}</label>`).join("")}</div></details><div class="teacher-view-switch" role="group" aria-label="排期视图">${[["calendar", "日历"], ["gantt", "甘特图"]].map(([view, label]) => `<button type="button" class="btn ${state.view === view ? 'btn-primary' : ''}" data-teacher-schedule-view="${view}" aria-pressed="${state.view === view}">${label}</button>`).join("")}</div>` : ""}</div></div><div class="teacher-schedule-legend"><span>项目授课</span><span>人工不可用</span></div>${selected.length ? state.view === "gantt" ? teacherGanttHtml(events, selected, state.month) : teacherCalendarHtml(events, state.month) : '<div class="empty">暂无选中的可查看老师</div>'}</section>`;
      }
      function openTeacherScheduleItem(teacherId, kind, id) {
        const { selected } = teacherScheduleContext();
        const teacher = selected.find((item) => item.id === teacherId);
        if (!teacher) return toast("无权查看该安排");
        const event = teacherScheduleEvents([teacher], teacherScheduleState.month).find((item) => item.id === id && item.kind === kind);
        if (!event) return toast("安排已更新，请刷新");
        const project = kind === "project" ? projectById(id) : null;
        const item = teacher.unavailable.find((entry) => entry.id === id);
        openModal(`<div class="modal-head"><div class="modal-title">排期详情</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="detail-grid">${teacherInfoHtml("老师", teacherName(teacher))}${teacherInfoHtml("安排类型", project ? "项目授课" : "人工不可用")}${teacherInfoHtml("开始日期", event.start)}${teacherInfoHtml("结束日期", event.end)}${project ? teacherInfoHtml("项目编号", project.id) + teacherInfoHtml("项目名称", project.name) : (teacherInfoHtml("登记人", employees.find((employee) => employee.code === item?.createdBy)?.name || "管理员") + `<div class="teacher-unavailable-reason">${teacherInfoHtml("备注/原因", item.reason)}</div>`)}</div></div><div class="modal-foot"><button class="btn" data-close>关闭</button></div>`);
      }
      function teacherPersonalScheduleView() {
        return !teacherHasGlobalScope() && !teacherIsFacultySupervisor() && currentRoleTemplateNames().includes("老师") && !currentRoleTemplateNames().includes("教学管理人员");
      }
      function teacherManagementScheduleEntry() {
        return currentRoleTemplateNames().includes("教学管理人员") && !teacherHasGlobalScope() && !teacherIsFacultySupervisor();
      }
      function teacherScheduleCreateCandidates() {
        return teacherManagementScheduleEntry() ? teacherScheduleContext().available.filter((teacher) => teacherCanSchedule(teacher)) : [];
      }
      function renderTeacherSchedule() {
        const title = teacherPersonalScheduleView() && !teacherHasCompanyScheduleAccess() ? "我的排期" : "老师排期";
        if (!canAccessPage("teacher-schedule") || !hasOperationPermission("teachers.view")) return forbiddenPage(title, "当前账号无老师查看权限。");
        const self = teacherPersonalScheduleView() ? teacherScheduleContext().available.find(teacherIsSelf) : null;
        const actions = teacherScheduleCreateCandidates().length ? '<button class="btn btn-primary" id="teacherScheduleCreate">登记不可用日期</button>' : "";
        return `<div class="teacher-page">${pageHead(title, "查看授课与不可用日期。", actions)}${teacherSchedulePanelHtml()}${self ? `<section class="panel teacher-personal-schedule">${teacherScheduleHtml(self)}</section>` : ""}</div>`;
      }
      function teacherEmptyListFilters() { return { name: "", source: "", cooperationType: "", teachingType: "", province: "", city: "", direction: "", status: "" }; }
      function teacherListFilters() {
        if (teacherListState.actor !== currentUser) teacherListState = { actor: currentUser, filters: teacherEmptyListFilters() };
        return teacherListState.filters;
      }
      function teacherListRows() {
        const f = teacherListFilters();
        return teachers.filter(teacherCanView).filter((teacher) =>
          (!f.name || teacherName(teacher).toLowerCase().includes(f.name.trim().toLowerCase())) &&
          (!f.source || teacher.type === f.source) && (!f.teachingType || teacher.teachingTypes.includes(f.teachingType)) &&
          (!f.cooperationType || (teacher.type === "外部" && teacher.cooperationType === f.cooperationType)) &&
          (!f.province || teacher.residenceProvince === f.province) && (!f.city || teacher.residenceCity === f.city) &&
          (!f.direction || teacher.directions.includes(f.direction)) && (!f.status || teacher.status === f.status));
      }
      function teacherListCityOptions(province, city = "") {
        return '<option value="">全部城市</option>' + Object.keys(administrativeDivisions[province] || {}).map((value) => `<option value="${escapeHtml(value)}" ${value === city ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
      }
      function teacherListFiltersHtml() {
        const f = teacherListFilters();
        const select = (key, values, all) => `<select class="input" data-teacher-list-filter="${key}"><option value="">${all}</option>${values.map((value) => `<option value="${escapeHtml(value)}" ${f[key] === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>`;
        return `<form id="teacherListFilterForm" class="toolbar filter-toolbar">${filterField("老师姓名", `<input class="input" data-teacher-list-filter="name" value="${escapeHtml(f.name)}" placeholder="请输入老师姓名">`)}${filterField("老师来源", select("source", ["内部", "外部"], "全部来源"))}${filterField("合作属性", select("cooperationType", TEACHER_COOPERATION_TYPES, "全部合作属性"))}${filterField("授课类型", select("teachingType", TEACHER_TEACHING_TYPES, "全部类型"))}${filterField("常驻省份", select("province", Object.keys(administrativeDivisions), "全部省份"))}${filterField("常驻城市", `<select class="input" data-teacher-list-filter="city">${teacherListCityOptions(f.province, f.city)}</select>`)}${filterField("教学方向", `<select class="input" data-teacher-list-filter="direction"><option value="">全部教学方向</option>${teacherCourseOptions().map((course) => `<option value="${course.id}" ${f.direction === course.id ? "selected" : ""}>${escapeHtml(teacherDirectionName(course.id))}</option>`).join("")}</select>`, "filter-field-wide")}${filterField("状态", select("status", ["启用", "停用"], "全部状态"))}${filterActions('<button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" id="teacherListReset">重置</button>')}</form>`;
      }
      function renderTeachers() {
        const title = teacherPersonalScheduleView() ? "我的信息" : "老师管理";
        if (!canAccessPage("teachers") || !hasOperationPermission("teachers.view")) return forbiddenPage(title, "当前账号无老师查看权限。");
        if (teacherPersonalScheduleView()) {
          const teacher = teachers.find((item) => teacherIsSelf(item) && teacherCanView(item));
          return `<div class="teacher-page">${pageHead(title, "查看个人资料。")}<section class="panel teacher-personal-info">${teacher ? `<div class="detail-hero"><div class="avatar">${escapeHtml(teacherName(teacher).slice(0, 1))}</div><div><div class="detail-name">${escapeHtml(teacherName(teacher))}</div><div class="detail-sub">${teacher.type}老师 · ${teacher.status}</div></div></div>${teacherPublicHtml(teacher)}${teacherContactsHtml(teacher)}` : '<div class="empty">暂无可查看的老师</div>'}</section></div>`;
        }
        const rows = teacherListRows();
        const manager = teacherHasGlobalScope() || teacherIsFacultySupervisor() || (currentRoleTemplateNames().includes("教学管理人员") && hasOperationPermission("teachers.manage") && teacherScopes().length);
        const actions = `${teacherCanConfigureScopes() ? '<button class="btn" id="teacherScopeManage">教学管理范围</button>' : ""}${teacherCanCreate() ? '<button class="btn btn-primary" id="teacherCreate">新增老师</button>' : ""}`;
        return `<div class="teacher-page">${pageHead(title, manager ? "维护老师资料。" : "查看个人资料。", actions)}${teacherListFiltersHtml()}<section class="panel"><div class="table-wrap"><table data-paged-table="m13-teachers"><thead><tr><th>老师姓名</th><th>老师来源</th><th>授课类型</th><th>常驻地</th><th>教学方向</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map((teacher) => `<tr data-page-row><td><strong>${escapeHtml(teacherName(teacher))}</strong></td><td>${teacher.type}${teacher.type === "外部" ? `<div>${teacher.cooperationType ? `<span class="tag">${escapeHtml(teacher.cooperationType)}</span>` : "—"}</div>` : ""}</td><td>${escapeHtml(teacher.teachingTypes.join("、"))}</td><td>${escapeHtml(teacherResidence(teacher))}</td><td>${teacher.directions.map(teacherDirectionName).map(escapeHtml).join("、")}</td><td><span class="tag ${teacher.status === "启用" ? "green" : ""}">${teacher.status}</span></td><td class="teacher-actions"><button class="btn btn-sm" data-teacher-detail="${teacher.id}">详情</button>${teacherCanManage(teacher) ? ` <button class="btn btn-sm" data-teacher-edit="${teacher.id}">编辑</button>${hasOperationPermission("teachers.status") ? ` <button class="btn btn-sm" data-teacher-status="${teacher.id}">${teacher.status === "启用" ? "停用" : "恢复"}</button>` : ""}` : ""}</td></tr>`).join("") || '<tr data-empty-row><td colspan="7"><div class="empty">暂无可查看的老师</div></td></tr>'}</tbody></table></div>${tablePagination("m13-teachers")}</section></div>`;
      }
