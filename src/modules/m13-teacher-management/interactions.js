      function teacherValidDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
      function teacherCanSchedule(teacher, item = null) {
        return teacherCanView(teacher) && (teacherIsFacultySupervisor() || hasOperationPermission("teachers.unavailable")) && (teacherCanManage(teacher) || (teacherIsSelf(teacher) && (!item || item.createdBy === teacherEmployee()?.code)));
      }
      function teacherCanCreate() { return teacherIsAdmin() || teacherIsFacultySupervisor() || (hasPermission("teachers") && hasOperationPermission("teachers.manage") && teacherScopes().length > 0); }
      function teacherFeeError(fee, tax) {
        if (fee != null && !["number", "string"].includes(typeof fee)) return "课酬须为有效金额";
        if (fee == null && tax) return "课酬金额与含税／不含税口径须一起填写";
        return fee != null && (!Number.isFinite(Number(fee)) || Number(fee) < 0 || !/^(\d{1,6})(\.\d{1,2})?$/.test(String(fee)) || !["含税", "不含税"].includes(tax)) ? "课酬须为非负金额、最多6位整数、最多两位小数，并选择含税或不含税" : "";
      }
      function teacherNormalizeRoleFees(input, internal) {
        if (input != null && (typeof input !== "object" || Array.isArray(input))) return { error: "课酬格式不正确" };
        const fees = {};
        for (const type of TEACHER_TEACHING_TYPES) {
          const row = input?.[type];
          if (row != null && (typeof row !== "object" || Array.isArray(row))) return { error: "课酬格式不正确" };
          fees[type] = {};
          for (const [key] of teacherFeeKinds(internal)) {
            const value = row?.[key];
            if (value != null && (typeof value !== "object" || Array.isArray(value))) return { error: "课酬格式不正确" };
            const amount = value?.fee == null || value.fee === "" ? null : value.fee;
            const tax = value?.tax || "";
            const error = teacherFeeError(amount, tax);
            if (error) return { error: `${type}：${error}` };
            fees[type][key] = { fee: amount == null ? null : Number(amount), tax };
          }
        }
        return { fees };
      }
      function teacherTypeRemovalImpact(teacher, draft) {
        const removedTypes = teacher.teachingTypes.filter((type) => !draft.teachingTypes.includes(type));
        if (!removedTypes.length) return null;
        const linked = projects.filter((project) => project.type === "培训项目" && teacherProjectIds(project).includes(teacher.id)).map((project) => ({ id: project.id, name: project.name, stage: computeProjectStageAndTodos(project).stage, owner: projectCurrentOwner(project), ecosystem: isEcosystemProject(project) }));
        return { removedTypes, projects: linked, key: JSON.stringify({ teacherId: teacher.id, version: teacher.version, removedTypes, projects: linked }) };
      }
      function teacherTypeRemovalConfirmHtml(impact) {
        return `<div class="modal-head"><div class="modal-title">确认取消授课类型</div><button class="icon-btn close" data-close aria-label="返回修改">×</button></div><div class="modal-body"><p>即将取消：${impact.removedTypes.map(escapeHtml).join("、")}。</p><p>已创建项目保留原已选人员并继续执行；后续新项目及新增、替换人员按更新后的授课类型筛选。</p><div class="section-title">已关联项目</div><div class="table-wrap"><table class="teacher-type-projects"><thead><tr><th>项目名称</th><th>当前阶段</th><th>项目负责人</th></tr></thead><tbody>${impact.projects.map((project) => `<tr><td>${escapeHtml(project.name)}</td><td>${escapeHtml(project.stage)}</td><td>${escapeHtml(project.owner)}${project.ecosystem ? "（生态负责人）" : ""}</td></tr>`).join("") || '<tr><td colspan="3"><div class="empty">暂无关联项目</div></td></tr>'}</tbody></table></div></div><div class="modal-foot"><button class="btn" type="button" data-close>返回修改</button><button class="btn btn-primary" type="button" id="teacherTypeConfirmSave">确认保存</button></div>`;
      }
      function openTeacherTypeRemovalConfirm(impact, onConfirm, onCancel) {
        openModal(teacherTypeRemovalConfirmHtml(impact));
        document.querySelectorAll("#modalLayer [data-close], #modalLayer .modal-mask").forEach((button) => button.onclick = onCancel);
        $("#teacherTypeConfirmSave").onclick = () => onConfirm(impact.key);
      }
      function teacherSaveProfile(id, draft, typeRemovalKey = "") {
        const existing = id ? teacherById(id) : null;
        if (id ? !teacherCanManage(existing) : !teacherCanCreate()) return { error: "无权维护该老师" };
        if (existing && draft.version !== existing.version) return { error: "资料已更新，请重新打开后编辑" };
        const type = existing?.type || draft.type;
        const scopes = teacherIsAdmin() || teacherIsFacultySupervisor() ? Object.keys(TEACHER_SCOPE_NAMES) : teacherScopes();
        if (!["内部", "外部"].includes(type) || (type === "内部" && !scopes.includes("internal"))) return { error: "请选择有权维护的老师来源" };
        const cooperationType = type === "外部" ? draft.cooperationType ?? "" : "";
        if ((type === "外部" && cooperationType !== "" && !TEACHER_COOPERATION_TYPES.includes(cooperationType)) || (type === "内部" && draft.cooperationType)) return { error: "请选择有效的合作属性", field: "tfCooperationType" };
        const employeeCode = existing?.employeeCode || draft.employeeCode;
        const employee = employees.find((item) => item.code === employeeCode);
        if (type === "内部" && (!employee || !employeeHasRole(employee, "老师") || teachers.some((teacher) => teacher.id !== id && teacher.employeeCode === employeeCode))) return { error: "请选择尚未建档的老师角色员工" };
        const name = type === "内部" ? employee.name : String(draft.name || "").trim();
        const phone = type === "内部" ? employee.phone : String(draft.phone || "").trim();
        const wechat = String(draft.wechat || "").trim();
        if (!name) return { error: "请填写老师姓名", field: "tfName" };
        if (!phone && !wechat) return { error: "手机号、微信号至少填写一项", field: "tfphone" };
        if (phone && !/^1[3-9]\d{9}$/.test(phone)) return { error: "请填写有效手机号", field: "tfphone" };
        if (wechat && (wechat.length > 64 || /[\u0000-\u001f\u007f]/.test(wechat))) return { error: "微信号须为1-64字且不能包含控制字符", field: "tfwechat" };
        if (draft.gender && !TEACHER_GENDERS.includes(draft.gender)) return { error: "请选择有效性别", field: "tfGender" };
        if (draft.education && !TEACHER_EDUCATIONS.includes(draft.education)) return { error: "请选择有效学历", field: "tfEducation" };
        if (!Array.isArray(draft.directions) || !draft.directions.length || draft.directions.some((direction) => !teacherCourseOptions().some((item) => item.id === direction))) return { error: "请至少选择一门采购包课程作为教学方向", field: "tfDirectionPicker" };
        if (!Array.isArray(draft.teachingTypes) || !draft.teachingTypes.length || draft.teachingTypes.some((item) => !TEACHER_TEACHING_TYPES.includes(item))) return { error: "请至少选择一项有效授课类型" };
        if (!teacherValidResidence(draft.residenceProvince, draft.residenceCity)) return { error: "请选择有效的常驻省份和城市" };
        if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) return { error: "邮箱格式不正确" };
        const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(new Date());
        if (draft.birthDate && (!teacherValidDate(draft.birthDate) || draft.birthDate > today)) return { error: "请填写有效且不晚于今天的出生日期" };
        let channels = [];
        if (type === "外部") {
          const incoming = draft.channels || [];
          if (!Array.isArray(incoming) || incoming.some((channel) => !["agency", "personal"].includes(channel.kind) || !scopes.includes(channel.kind))) return { error: "无权修改该合作渠道" };
          const hidden = (existing?.channels || []).filter((channel) => !scopes.includes(channel.kind));
          const protectedIds = new Set(hidden.map((channel) => channel.id));
          const ids = incoming.map((channel) => channel.id).filter(Boolean);
          if (ids.length !== new Set(ids).size || ids.some((channelId) => protectedIds.has(channelId))) return { error: "渠道关联不正确" };
          channels = [...hidden.map((channel) => ({ ...channel })), ...incoming.map((channel, index) => ({ id: channel.id || `CH-${id || 'new'}-${Date.now()}-${index}`, kind: channel.kind, agencyName: channel.kind === "agency" ? String(channel.agencyName || "").trim() : "", contact: channel.kind === "agency" ? String(channel.contact || "").trim() : "", phone: channel.kind === "agency" ? String(channel.phone || "").trim() : "", wechat: channel.kind === "agency" ? String(channel.wechat || "").trim() : "", email: channel.kind === "agency" ? String(channel.email || "").trim() : "", roleFees: channel.roleFees }))];
          if (!channels.length || channels.filter((channel) => channel.kind === "personal").length > 1) return { error: "外部老师须至少保留一个渠道，个人渠道不可重复" };
          for (const [channelIndex, channel] of channels.filter((item) => scopes.includes(item.kind)).entries()) {
            if (channel.kind === "agency" && !channel.agencyName) return { error: "请填写机构名称", channelIndex };
            if (channel.phone && !/^[+\d\s()-]{5,30}$/.test(channel.phone)) return { error: "机构联系电话格式不正确", channelIndex };
            if (channel.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel.email)) return { error: "机构联系人邮箱格式不正确", channelIndex };
            const normalized = teacherNormalizeRoleFees(channel.roleFees, false); if (normalized.error) return { error: normalized.error, channelIndex };
            channel.roleFees = normalized.fees;
            if (!teacherIsFacultySupervisor() && !hasFieldPermission("teacher_fee_view")) {
              const before = existing?.channels.find((item) => item.id === channel.id);
              if (JSON.stringify(channel.roleFees) !== JSON.stringify(teacherNormalizeRoleFees(before?.roleFees, false).fees)) return { error: "无权修改课酬" };
            }
          }
        }
        if (existing && !teacherIsFacultySupervisor() && !hasFieldPermission("teacher_contact_view")) {
          const changedContact = ["email", "wechat", ...(type === "外部" ? ["phone"] : [])].some(key => String(draft[key] || "") !== String(existing[key] || ""));
          const changedChannelContact = channels.some(channel => {
            const before = existing.channels.find(item => item.id === channel.id);
            return ["contact", "phone", "email", "wechat"].some(key => String(channel[key] || "") !== String(before?.[key] || ""));
          });
          if (changedContact || changedChannelContact) return { error: "无权修改完整联系方式" };
        }
        let roleFees;
        if (type === "内部") {
          const normalized = teacherNormalizeRoleFees(draft.roleFees, true); if (normalized.error) return { error: normalized.error };
          roleFees = normalized.fees;
          if (!teacherIsFacultySupervisor() && !hasFieldPermission("teacher_fee_view") && JSON.stringify(roleFees) !== JSON.stringify(teacherNormalizeRoleFees(existing?.roleFees, true).fees)) return { error: "无权修改课酬" };
        }
        if (existing) {
          const removed = existing.directions.filter((direction) => !draft.directions.includes(direction));
          const blocking = teacherProjectBookings(id).filter((project) => removed.includes(project.teachingDirectionId) && ["已立项", "进行中"].includes(computeProjectStageAndTodos(project).stage) && [...(project.teacherAssignments?.lecturers || []), ...(project.teacherAssignments?.assistantLecturers || [])].includes(id));
          if (blocking.length) return { error: "该方向仍有未开始或进行中项目，请先更换老师或调整项目：" + blocking.map((project) => project.id).join("、"), field: "tfDirectionPicker" };
        }
        const confirmation = existing ? teacherTypeRemovalImpact(existing, draft) : null;
        if (confirmation && confirmation.key !== typeRemovalKey) return { typeRemovalConfirmation: confirmation };
        const newId = existing?.id || `T${String(Math.max(0, ...teachers.map((teacher) => Number(teacher.id.slice(1)) || 0)) + 1).padStart(3, "0")}`;
        const payload = { id: newId, type, employeeCode: type === "内部" ? employeeCode : "", name, phone: type === "内部" ? "" : phone, intro: String(draft.intro || "").trim(), gender: String(draft.gender || ""), birthDate: draft.birthDate || "", education: String(draft.education || "").trim(), email: String(draft.email || "").trim(), wechat, directions: [...new Set(draft.directions)], teachingTypes: [...new Set(draft.teachingTypes)], residenceProvince: draft.residenceProvince, residenceCity: draft.residenceCity, channels, ...(type === "内部" ? { roleFees } : { cooperationType }), version: (existing?.version || 0) + 1 };
        if (existing) Object.assign(existing, payload);
        else teachers.push({ ...payload, status: "启用", resumes: [], unavailable: [] });
        return { teacher: teacherById(newId) };
      }
      function teacherSaveUnavailable(teacherId, itemId, start, end, reason, expectedVersion) {
        const teacher = teacherById(teacherId), old = teacher?.unavailable.find((item) => item.id === itemId);
        if (!teacherCanSchedule(teacher, old) || (itemId && !old)) return { error: "无权维护该不可用日期" };
        if (expectedVersion != null && teacher.version !== expectedVersion) return { error: "排期已更新，请重新打开" };
        if (!teacherValidDate(start) || !teacherValidDate(end) || start > end) return { error: "请填写有效的起止日期，结束不得早于开始" };
        if (typeof reason !== "string" || !reason.trim()) return { error: "请填写备注/原因" };
        reason = reason.trim();
        const conflicts = teacherProjectBookings(teacherId).filter((project) => teacherDatesOverlap(start, end, teacherDate(project.startTime), teacherDate(project.endTime)));
        if (conflicts.length) return { error: "与已安排项目冲突，请先调整项目：" + conflicts.map((project) => project.id).join("、") };
        if (old) Object.assign(old, { start, end, reason });
        else teacher.unavailable.push({ id: `U-${Date.now()}-${teacher.version}`, start, end, reason, createdBy: teacherEmployee()?.code || "YJ007" });
        teacher.version++; return { teacher };
      }
      function teacherDeleteUnavailable(teacherId, itemId) {
        const teacher = teacherById(teacherId), item = teacher?.unavailable.find((entry) => entry.id === itemId);
        if (!item || !teacherCanSchedule(teacher, item)) return { error: "无权删除该不可用日期" };
        teacher.unavailable = teacher.unavailable.filter((entry) => entry !== item); teacher.version++; return { teacher };
      }
      function teacherSetStatus(id, expectedStatus) {
        const teacher = teacherById(id);
        if (!teacherCanManage(teacher) || !hasOperationPermission("teachers.status")) return { error: "无权变更老师状态" };
        if (teacher.status !== expectedStatus) return { error: "老师状态已更新，请刷新" };
        const blocking = teacherProjectBookings(id).filter((project) => ["已立项", "进行中"].includes(computeProjectStageAndTodos(project).stage));
        if (teacher.status === "启用" && blocking.length) return { error: "请先替换未开始或进行中项目的老师：" + blocking.map((project) => project.id).join("、") };
        teacher.status = teacher.status === "启用" ? "停用" : "启用"; teacher.version++; return { teacher };
      }
      function teacherRefresh(id = "") { closeAllOverlays(); renderPage(); if (id && !teacherPersonalScheduleView() && currentPage !== "teacher-schedule" && teacherCanView(teacherById(id))) openTeacherDetail(id); }
      function openTeacherDetail(id) {
        const teacher = teacherById(id); if (!teacherCanView(teacher)) return toast("无权查看该老师");
        openDrawer(teacherDetailHtml(teacher)); bindTeacherEvents();
      }
      function teacherProjectProfileContext() {
        const project = currentPage === "project-edit" ? projectById(selectedProjectId) : null;
        if (project) return canEditProject(project) ? project : null;
        return currentPage === "project-create" && hasOperationPermission("projects.create") ? { creating: true } : null;
      }
      function openProjectTeacherProfile(id) {
        const teacher = teacherById(id), context = teacherProjectProfileContext();
        if (!context || !teacher || teacher.status !== "启用") return toast("无权查看该老师");
        openDrawer(teacherDetailHtml(teacher, true));
      }
      function teacherInput(label, id, value = "", type = "text", extra = "") {
        return `<label class="form-group"><span class="form-label">${label}</span><input class="input" id="${id}" type="${type}" value="${escapeHtml(value)}" ${extra}></label>`;
      }
      function teacherSelect(label, id, value, options) {
        return `<label class="form-group"><span class="form-label">${label}</span><select class="input" id="${id}"><option value="">请选择（可留空）</option>${options.map((item) => `<option ${value === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>`;
      }
      function teacherDirectionPicker(teacher) {
        return `<div class="form-group full"><span class="form-label">教学方向 *</span><details class="teacher-direction-picker" id="tfDirectionPicker"><summary>选择教学方向</summary><div class="teacher-direction-panel"><input class="input" id="tfDirectionSearch" type="search" placeholder="搜索采购包或课程" aria-label="搜索教学方向"><div class="teacher-direction-options">${teacherCourseOptions().map((direction) => `<label class="choice-item" data-teacher-direction-option><input type="checkbox" data-teacher-direction value="${direction.id}" ${teacher?.directions.includes(direction.id) ? "checked" : ""}><span>${escapeHtml(teacherDirectionName(direction.id))}</span></label>`).join("")}<div class="empty" id="tfDirectionEmpty" hidden>无匹配课程</div></div></div></details><div class="teacher-direction-selected" id="tfDirectionSelected" aria-live="polite"></div></div>`;
      }
      function teacherRoleFeeForm(prefix, fees, internal) {
        const kinds = teacherFeeKinds(internal);
        return `<div class="form-group full"><span class="form-label">课酬（元/天）</span><div class="table-wrap"><table class="teacher-fee-table"><thead><tr><th>授课类型</th>${kinds.map(([, label]) => `<th>${label}</th><th>税务口径</th>`).join("")}</tr></thead><tbody>${TEACHER_TEACHING_TYPES.map((type, index) => `<tr data-teacher-fee-type="${type}" hidden><th>${type}</th>${kinds.map(([key, label]) => { const value = fees?.[type]?.[key]; const id = prefix + index + key; return `<td><input class="input" id="${id}Fee" type="number" min="0" step="0.01" aria-label="${type}${label}（元/天）" value="${escapeHtml(value?.fee ?? "")}"></td><td><select class="input" id="${id}Tax" aria-label="${type}${label}税务口径"><option value="">请选择</option>${["含税", "不含税"].map((tax) => `<option ${value?.tax === tax ? "selected" : ""}>${tax}</option>`).join("")}</select></td>`; }).join("")}</tr>`).join("")}</tbody></table></div></div>`;
      }
      function teacherSyncFeeTypes(form) {
        const selected = new Set([...form.querySelectorAll("[data-teacher-type]:checked")].map((input) => input.value));
        form.querySelectorAll("[data-teacher-fee-type]").forEach((row) => row.hidden = !selected.has(row.dataset.teacherFeeType));
      }
      function teacherReadRoleFees(prefix, internal, before) {
        return Object.fromEntries(TEACHER_TEACHING_TYPES.map((type, index) => [type, Object.fromEntries(teacherFeeKinds(internal).map(([key]) => {
          const id = prefix + index + key, fee = $("#" + id + "Fee"), tax = $("#" + id + "Tax");
          return [key, fee && tax ? { fee: fee.value.trim(), tax: tax.value } : before?.[type]?.[key] || { fee: null, tax: "" }];
        }))]));
      }
      function teacherContactInput(label, key, value, prefix = "tf") {
        return teacherInput(label, prefix + key, "", key === "email" ? "email" : "text", `data-teacher-contact="${key}" data-unchanged="true" placeholder="${escapeHtml(value ? maskTeacherContact(value, key) + '（留空保持原值）' : '选填')}"`);
      }
      function teacherChannelForm(channel = {}, index = 0) {
        const prefix = "tc" + index;
        return `<details class="teacher-channel-card teacher-channel-editor" ${channel.id ? "" : "open"} data-teacher-channel-row data-channel-id="${escapeHtml(channel.id || "")}" data-channel-kind="${channel.kind || "agency"}" data-channel-prefix="${prefix}"><summary><strong data-channel-title>${channel.kind === "personal" ? "个人合作" : escapeHtml(channel.agencyName || "机构合作")}</strong><button type="button" class="btn btn-sm" data-remove-teacher-channel>移除</button></summary><div class="form-grid teacher-channel-body">${channel.kind !== "personal" ? teacherInput("机构名称 *", prefix + "Agency", channel.agencyName || "") + teacherInput("联系人", prefix + "Contact", channel.contact || "") + teacherContactInput("联系电话", "phone", channel.phone, prefix) + teacherContactInput("联系人微信号", "wechat", channel.wechat, prefix) + teacherContactInput("联系人邮箱", "email", channel.email, prefix) : ""}${(teacherIsFacultySupervisor() || hasFieldPermission("teacher_fee_view")) ? teacherRoleFeeForm(prefix, channel.roleFees, false) : ""}</div></details>`;
      }
      function openTeacherForm(id = "") {
        const teacher = id ? teacherById(id) : null;
        if (id ? !teacherCanManage(teacher) : !teacherCanCreate()) return toast("无权维护老师");
        const actor = currentUser, expectedVersion = teacher?.version;
        const scopes = teacherHasGlobalScope() ? Object.keys(TEACHER_SCOPE_NAMES) : teacherScopes();
        const type = teacher?.type || (scopes.includes("internal") ? "内部" : "外部");
        const employeeOptions = employees.filter((employee) => employeeHasRole(employee, "老师") && (!teachers.some((item) => item.employeeCode === employee.code) || employee.code === teacher?.employeeCode));
        openModal(`<div class="modal-head"><div class="modal-title">${teacher ? "编辑老师" : "新增老师"}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherForm" novalidate><div class="modal-body teacher-form"><div class="form-grid"><label class="form-group"><span class="form-label">老师来源 *</span><select class="input" id="tfType" ${teacher ? "disabled" : ""}>${["内部", "外部"].filter((item) => item === "内部" ? scopes.includes("internal") : scopes.some((scope) => scope !== "internal")).map((item) => `<option ${type === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><div id="tfCooperationGroup">${teacherSelect("合作属性", "tfCooperationType", teacher?.cooperationType || "", TEACHER_COOPERATION_TYPES)}</div><label class="form-group" id="tfEmployeeGroup"><span class="form-label">关联员工 *</span><select class="input" id="tfEmployee" ${teacher ? "disabled" : ""}><option value="">请选择老师角色员工</option>${employeeOptions.map((employee) => `<option value="${employee.code}" ${teacher?.employeeCode === employee.code ? "selected" : ""}>${escapeHtml(employee.name)}（${employee.code}）</option>`).join("")}</select></label>${teacherInput("老师姓名 *", "tfName", teacher ? teacherName(teacher) : "")}<div class="form-group full teacher-contact-heading">手机号、微信号至少填写一项</div>${teacherContactInput("手机号", "phone", teacher && teacherRawContact(teacher, "phone"))}${teacherContactInput("微信号", "wechat", teacher?.wechat)}${teacherSelect("性别", "tfGender", teacher?.gender || "", TEACHER_GENDERS)}${teacherSelect("学历", "tfEducation", teacher?.education || "", TEACHER_EDUCATIONS)}${teacherInput("出生日期", "tfBirth", teacher?.birthDate || "", "date")}${teacherContactInput("邮箱", "email", teacher?.email)}<div class="form-group full"><span class="form-label">授课类型 *</span><div class="choice-grid">${TEACHER_TEACHING_TYPES.map((item) => `<label class="choice-item"><input type="checkbox" data-teacher-type value="${item}" ${teacher?.teachingTypes.includes(item) ? "checked" : ""}><span>${item}</span></label>`).join("")}</div></div><label class="form-group"><span class="form-label">常驻省份 *</span><select class="input" id="tfResidenceProvince"><option value="">请选择省份</option>${Object.keys(administrativeDivisions).map((province) => `<option ${teacher?.residenceProvince === province ? "selected" : ""}>${escapeHtml(province)}</option>`).join("")}</select></label><label class="form-group"><span class="form-label">常驻城市 *</span><select class="input" id="tfResidenceCity"></select></label><label class="form-group full"><span class="form-label">简介</span><textarea class="input" id="tfIntro" rows="3">${escapeHtml(teacher?.intro || "")}</textarea></label>${teacherDirectionPicker(teacher)}<div id="tfInternalFeeGroup" class="teacher-form-section">${teacherIsFacultySupervisor() || hasFieldPermission("teacher_fee_view") ? teacherRoleFeeForm("tfInternal", teacher?.roleFees, true) : ""}</div><div id="tfChannelsGroup" class="form-group full"><span class="form-label">合作渠道 *</span><div class="teacher-form-actions">${scopes.includes("agency") ? '<button type="button" class="btn btn-sm" id="tfAddAgency">添加机构渠道</button>' : ""}${scopes.includes("personal") ? '<button type="button" class="btn btn-sm" id="tfAddPersonal">添加个人渠道</button>' : ""}</div><div id="tfChannels">${(teacher?.channels || []).filter((channel) => scopes.includes(channel.kind)).map(teacherChannelForm).join("")}</div></div>${(!teacher || teacherCanResume(teacher, "upload")) && (teacherHasGlobalScope() || teacherIsFacultySupervisor() || currentRoleTemplateNames().includes("教学管理人员")) && (teacherIsFacultySupervisor() || hasAttachmentPermission("teacher_resume_upload")) ? `<label class="form-group full"><span class="form-label">添加简历</span><input class="input" id="tfResumes" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"><span class="list-sub">单个文件不超过20MB，最多9个。</span></label>` : ""}</div></div><div class="modal-foot"><div class="field-error teacher-form-error" id="tfError" role="alert"></div><button type="button" class="btn" data-close>取消</button><button type="submit" class="btn btn-primary" id="tfSave">保存</button></div></form>`);
        $("#modalLayer .modal").classList.add("teacher-profile-modal");
        const form = $("#teacherForm");
        form.querySelectorAll("[data-teacher-type]").forEach((input) => input.onchange = () => teacherSyncFeeTypes(form));
        const updateDirections = () => {
          const selected = [...form.querySelectorAll("[data-teacher-direction]:checked")];
          $("#tfDirectionSelected").innerHTML = selected.map((input) => `<span class="teacher-direction-token"><span>${escapeHtml(teacherDirectionName(input.value))}</span><button type="button" data-remove-teacher-direction="${input.value}" aria-label="移除${escapeHtml(teacherDirectionName(input.value))}">×</button></span>`).join("");
          form.querySelectorAll("[data-remove-teacher-direction]").forEach((button) => button.onclick = () => { form.querySelector(`[data-teacher-direction][value="${button.dataset.removeTeacherDirection}"]`).checked = false; updateDirections(); });
        };
        form.querySelectorAll("[data-teacher-direction]").forEach((input) => input.onchange = updateDirections);
        $("#tfDirectionSearch").oninput = () => {
          const query = $("#tfDirectionSearch").value.trim().toLowerCase();
          const rows = [...form.querySelectorAll("[data-teacher-direction-option]")];
          rows.forEach((row) => row.hidden = !row.textContent.toLowerCase().includes(query));
          $("#tfDirectionEmpty").hidden = rows.some((row) => !row.hidden);
        };
        updateDirections();
        const updateResidence = (city = "") => { $("#tfResidenceCity").innerHTML = '<option value="">请选择城市</option>' + Object.keys(administrativeDivisions[$("#tfResidenceProvince").value] || {}).map((item) => `<option ${item === city ? "selected" : ""}>${escapeHtml(item)}</option>`).join(""); };
        $("#tfResidenceProvince").onchange = () => updateResidence(); updateResidence(teacher?.residenceCity);
        let channelIndex = (teacher?.channels.length || 0) + 1;
        const updateType = () => {
          const internal = $("#tfType").value === "内部";
          $("#tfEmployeeGroup").style.display = internal ? "" : "none";
          $("#tfCooperationGroup").style.display = internal ? "none" : "";
          $("#tfCooperationType").disabled = internal;
          $("#tfName").disabled = internal; $("#tfphone").disabled = internal;
          $("#tfInternalFeeGroup").style.display = internal ? "contents" : "none";
          $("#tfChannelsGroup").style.display = internal ? "none" : "";
          if (internal) { const employee = employees.find((item) => item.code === $("#tfEmployee").value); $("#tfName").value = employee?.name || ""; $("#tfphone").value = employee ? displayEmployeePhone(employee) : ""; }
          else { $("#tfName").value = teacher?.name || ""; $("#tfphone").value = ""; }
        };
        $("#tfType").onchange = updateType; $("#tfEmployee").onchange = updateType; updateType();
        const bindRows = () => {
          document.querySelectorAll("[data-remove-teacher-channel]").forEach((button) => button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); button.closest("[data-teacher-channel-row]").remove(); });
          document.querySelectorAll("[data-teacher-channel-row]").forEach((row) => {
            row.ontoggle = () => { if (row.open) form.querySelectorAll("[data-teacher-channel-row]").forEach((other) => { if (other !== row) other.open = false; }); };
            const agency = row.querySelector("#" + row.dataset.channelPrefix + "Agency");
            if (agency) agency.oninput = () => row.querySelector("[data-channel-title]").textContent = agency.value.trim() || "机构合作";
          });
          document.querySelectorAll("[data-teacher-contact]").forEach((input) => input.oninput = () => input.dataset.unchanged = "false");
          teacherSyncFeeTypes(form);
        }; bindRows();
        const addChannel = (kind) => { form.querySelectorAll("[data-teacher-channel-row]").forEach((row) => row.open = false); $("#tfChannels").insertAdjacentHTML("beforeend", teacherChannelForm({ kind }, channelIndex++)); bindRows(); };
        if ($("#tfAddAgency")) $("#tfAddAgency").onclick = () => addChannel("agency");
        if ($("#tfAddPersonal")) $("#tfAddPersonal").onclick = () => { if (document.querySelector('[data-channel-kind="personal"]')) return toast("已添加个人渠道"); addChannel("personal"); };
        $("#teacherForm").onsubmit = async (event) => {
          event.preventDefault();
          if ($("#teacherForm") !== form || currentUser !== actor || (teacher ? !teacherCanManage(teacher) : !teacherCanCreate())) return toast("权限已变化，请重新打开");
          const get = (selector) => $(selector)?.value.trim() || "";
          const contactValue = (prefix, key, original) => { const input = $("#" + prefix + key); return input?.dataset.unchanged === "true" ? original || "" : input?.value.trim() || ""; };
          const channels = [...document.querySelectorAll("[data-teacher-channel-row]")].map((row) => {
            const prefix = row.dataset.channelPrefix, before = teacher?.channels.find((item) => item.id === row.dataset.channelId);
            return { id: row.dataset.channelId, kind: row.dataset.channelKind, agencyName: get("#" + prefix + "Agency"), contact: get("#" + prefix + "Contact"), ...Object.fromEntries(["phone", "email", "wechat"].map((key) => [key, contactValue(prefix, key, before?.[key])])), roleFees: teacherReadRoleFees(prefix, false, before?.roleFees) };
          });
          const draft = { version: expectedVersion, type: get("#tfType"), cooperationType: get("#tfType") === "外部" ? get("#tfCooperationType") : "", employeeCode: get("#tfEmployee"), name: get("#tfName"), phone: contactValue("tf", "phone", teacher && teacherRawContact(teacher, "phone")), email: contactValue("tf", "email", teacher?.email), wechat: contactValue("tf", "wechat", teacher?.wechat), gender: get("#tfGender"), birthDate: get("#tfBirth"), education: get("#tfEducation"), intro: get("#tfIntro"), directions: [...document.querySelectorAll("[data-teacher-direction]:checked")].map((input) => input.value), channels, teachingTypes: [...document.querySelectorAll("[data-teacher-type]:checked")].map((input) => input.value), residenceProvince: get("#tfResidenceProvince"), residenceCity: get("#tfResidenceCity"), roleFees: teacherReadRoleFees("tfInternal", true, teacher?.roleFees) };
          const files = [...($("#tfResumes")?.files || [])];
          $("#tfSave").disabled = true;
          let fileError = "";
          if (files.length + (teacher?.resumes.length || 0) > 9 || files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) fileError = "简历最多9个，单次总大小不超过100MB";
          for (const file of files) {
            if (fileError) break;
            if (file.size > 20 * 1024 * 1024 || ![".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(fileExtension(file.name))) fileError = "简历仅支持图片、PDF和Office，单个不超过20MB";
            else { try { const check = await validateProjectFile(file, { kinds: ["image", "document"] }); if (!check.ok) fileError = check.reason; } catch { fileError = "文件读取失败，请重试"; } }
          }
          if ($("#teacherForm") !== form || currentUser !== actor || (teacher ? !teacherCanManage(teacher) : !teacherCanCreate())) return;
          if (files.length && (!hasAttachmentPermission("teacher_resume_upload") || (teacher && !teacherCanResume(teacher, "upload")))) fileError = "无权上传简历";
          if (fileError) { $("#tfError").textContent = fileError; $("#tfSave").disabled = false; return; }
          const editorLayer = $("#modalLayer"), editorNodes = [...editorLayer.childNodes];
          const restoreEditor = () => { editorLayer.replaceChildren(...editorNodes); bindOverlay(); $("#tfSave").disabled = false; };
          const save = (confirmationKey = "") => {
            if (currentUser !== actor || (teacher ? !teacherCanManage(teacher) : !teacherCanCreate())) { restoreEditor(); $("#tfError").textContent = "权限已变化，请重新打开"; return; }
            if (files.length && (!hasAttachmentPermission("teacher_resume_upload") || (teacher && !teacherCanResume(teacher, "upload")))) { restoreEditor(); $("#tfError").textContent = "无权上传简历"; return; }
            const result = teacherSaveProfile(id, draft, confirmationKey);
            if (result.error) {
              restoreEditor(); $("#tfError").textContent = result.error;
              const target = Number.isInteger(result.channelIndex) ? [...form.querySelectorAll("[data-teacher-channel-row]")][result.channelIndex] : result.field ? $("#" + result.field) : null;
              if (target) { if (target.matches?.("details")) target.open = true; target.scrollIntoView?.({ block: "nearest" }); if (target.matches?.("input, select")) target.focus(); }
              return;
            }
            if (result.typeRemovalConfirmation) { openTeacherTypeRemovalConfirm(result.typeRemovalConfirmation, save, restoreEditor); return; }
            files.forEach((file, index) => { const fileId = `CV-${result.teacher.id}-${Date.now()}-${index}`; teacherResumeFiles.set(fileId, file); result.teacher.resumes.push({ id: fileId, name: file.name, type: file.type, size: file.size, addedBy: actor.name }); });
            teacherRefresh(); toast("老师资料已保存");
          };
          save();
        };
      }
      function openTeacherUnavailable(teacherId = "", itemId = "") {
        const teacher = teacherById(teacherId), item = teacher?.unavailable.find((entry) => entry.id === itemId);
        const choosing = !teacherId && teacherManagementScheduleEntry();
        const candidates = choosing ? teacherScheduleCreateCandidates() : [];
        if (choosing ? !candidates.length : !teacherCanSchedule(teacher, item)) return toast("无权维护该不可用日期");
        const version = teacher?.version, actor = currentUser;
        const versions = new Map(candidates.map((candidate) => [candidate.id, candidate.version]));
        const picker = choosing ? `<label class="form-group full"><span class="form-label">老师 *</span><select class="input" id="tuTeacher" required><option value="">请选择老师</option>${candidates.map((candidate) => `<option value="${candidate.id}">${escapeHtml(teacherName(candidate))}</option>`).join("")}</select></label>` : "";
        openModal(`<div class="modal-head"><div class="modal-title">${item ? "编辑" : "登记"}不可用日期</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherUnavailableForm" novalidate><div class="modal-body"><div class="form-grid">${picker}${teacherInput("开始日期 *", "tuStart", item?.start || "", "date", "required")}${teacherInput("结束日期 *", "tuEnd", item?.end || "", "date", "required")}<label class="form-group full"><span class="form-label">备注/原因 *</span><textarea class="input" id="tuReason" rows="3" required>${escapeHtml(item ? item.reason : "")}</textarea></label><div class="field-error full" id="tuError" role="alert"></div></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button type="submit" class="btn btn-primary">保存</button></div></form>`);
        $("#teacherUnavailableForm").onsubmit = (event) => {
          event.preventDefault(); if (currentUser !== actor) return;
          const selectedId = choosing ? $("#tuTeacher").value : teacherId;
          if (choosing && !selectedId) { $("#tuError").textContent = "请选择老师"; return; }
          if (choosing && (!versions.has(selectedId) || !teacherScheduleCreateCandidates().some((candidate) => candidate.id === selectedId))) { $("#tuError").textContent = "无权维护该不可用日期"; return; }
          const result = teacherSaveUnavailable(selectedId, itemId, $("#tuStart").value, $("#tuEnd").value, $("#tuReason").value, choosing ? versions.get(selectedId) : version);
          if (result.error) $("#tuError").textContent = result.error;
          else { teacherRefresh(selectedId); toast("不可用日期已保存"); }
        };
      }
      function teacherConfirm(title, text, onConfirm) {
        openModal(`<div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><p>${escapeHtml(text)}</p><div class="field-error" id="teacherConfirmError" role="alert"></div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="teacherConfirm">确认</button></div>`);
        $("#teacherConfirm").onclick = onConfirm;
      }
      function teacherSaveScopes(code, scopes) {
        if (!teacherCanConfigureScopes()) return "无权维护教学管理范围";
        const facultyManagers = employees.filter((employee) => employeeHasRole(employee, "教学管理人员") && employeeDepartmentNames(employee).includes("师资管理部"));
        const allowedManagers = teacherHasGlobalScope() ? employees.filter((employee) => employeeHasRole(employee, "教学管理人员")) : facultyManagers;
        if (!allowedManagers.some((employee) => employee.code === code)) return teacherHasGlobalScope() ? "请选择教学管理人员" : "请选择师资管理部的教学管理人员";
        if (!Array.isArray(scopes) || scopes.some((scope) => !Object.hasOwn(TEACHER_SCOPE_NAMES, scope))) return "教学管理范围不正确";
        teachingManagementAssignments[code] = [...new Set(scopes)]; return "";
      }
      function openTeacherScopes() {
        if (!teacherCanConfigureScopes()) return;
        const actor = currentUser;
        const managers = teacherHasGlobalScope() ? employees.filter((employee) => employeeHasRole(employee, "教学管理人员")) : employees.filter((employee) => employeeHasRole(employee, "教学管理人员") && employeeDepartmentNames(employee).includes("师资管理部"));
        openModal(`<div class="modal-head"><div class="modal-title">教学管理范围</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherScopesForm"><div class="modal-body"><label class="form-group"><span class="form-label">教学管理人员</span><select class="input" id="tsEmployee">${managers.map((employee) => `<option value="${employee.code}">${escapeHtml(employee.name)}</option>`).join("")}</select></label><div id="tsChoices" class="choice-grid"></div><div class="field-error" id="tsError"></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button type="submit" class="btn btn-primary">保存</button></div></form>`);
        const update = () => $("#tsChoices").innerHTML = Object.entries(TEACHER_SCOPE_NAMES).map(([key, name]) => `<label class="choice-item"><input type="checkbox" value="${key}" ${(teachingManagementAssignments[$("#tsEmployee").value] || []).includes(key) ? "checked" : ""}><span>${name}</span></label>`).join("");
        $("#tsEmployee").onchange = update; update();
        $("#teacherScopesForm").onsubmit = (event) => { event.preventDefault(); if (currentUser !== actor) return toast("权限已变化，请重新打开"); const error = teacherSaveScopes($("#tsEmployee").value, [...document.querySelectorAll("#tsChoices input:checked")].map((input) => input.value)); if (error) $("#tsError").textContent = error; else { teacherRefresh(); toast("教学管理范围已保存"); } };
      }
      function teacherSampleResumeBlob() {
        const stream = "BT /F1 18 Tf 50 760 Td (Training teacher resume) Tj ET";
        const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
        let pdf = "%PDF-1.4\n", offsets = [0];
        objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
        const xref = pdf.length; pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
        return new Blob([pdf], { type: "application/pdf" });
      }
      function teacherResumeBlob(teacher, file) { return teacherResumeFiles.get(file.id) || (file.id === "CV001" ? teacherSampleResumeBlob() : null); }
      function openTeacherResume(teacherId, fileId, download = false) {
        const teacher = teacherById(teacherId), file = teacher?.resumes.find((item) => item.id === fileId);
        if (!file || !teacherCanResume(teacher, download ? "download" : "view")) return toast("无权访问该简历");
        const blob = teacherResumeBlob(teacher, file); if (!blob) return toast("简历文件暂不可用，请重试");
        const url = URL.createObjectURL(blob);
        if (download) { const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return; }
        const ext = fileExtension(file.name), canPreview = [".jpg", ".jpeg", ".png", ".pdf"].includes(ext);
        openModal(`<div class="modal-head"><div class="modal-title">简历预览</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body teacher-resume-preview">${canPreview ? ext === ".pdf" ? `<iframe id="teacherResumeContent" title="${escapeHtml(file.name)}"></iframe>` : `<img id="teacherResumeContent" alt="${escapeHtml(file.name)}">` : `<div class="detail-grid">${teacherInfoHtml("文件名", file.name)}${teacherInfoHtml("类型", ext)}${teacherInfoHtml("大小", formatFileSize(file.size))}${teacherInfoHtml("上传人", file.addedBy)}</div>`}</div><div class="modal-foot"><button class="btn" data-close>关闭</button>${teacherCanResume(teacher, "download") ? '<button class="btn btn-primary" id="trDownload">下载</button>' : ""}</div>`);
        if (canPreview) $("#teacherResumeContent").src = url;
        const button = $("#trDownload"); if (button) button.onclick = () => openTeacherResume(teacherId, fileId, true);
        document.querySelectorAll("#modalLayer [data-close], #modalLayer .modal-mask").forEach((node) => node.addEventListener("click", () => URL.revokeObjectURL(url), { once: true }));
      }
      function teacherDeleteResume(teacherId, fileId, expectedVersion) {
        const teacher = teacherById(teacherId);
        if (!teacherCanManage(teacher) || !teacherCanResume(teacher, "delete")) return { error: "无权删除该简历" };
        if (teacher.version !== expectedVersion || !teacher.resumes.some((file) => file.id === fileId)) return { error: "简历已更新，请重新打开" };
        teacher.resumes = teacher.resumes.filter((file) => file.id !== fileId); teacherResumeFiles.delete(fileId); teacher.version++;
        return { teacher };
      }
      document.addEventListener("click", (event) => {
        const picker = $("#teacherSchedulePicker");
        if (picker?.open && !picker.contains(event.target)) picker.open = false;
      }, true);
      function bindTeacherEvents() {
        if ($("#teacherScheduleCreate")) $("#teacherScheduleCreate").onclick = () => openTeacherUnavailable();
        const filters = $("#teacherListFilterForm");
        if (filters) {
          const province = filters.querySelector('[data-teacher-list-filter="province"]');
          const city = filters.querySelector('[data-teacher-list-filter="city"]');
          province.onchange = () => city.innerHTML = teacherListCityOptions(province.value);
          const apply = (next) => {
            if (!canAccessPage("teachers") || !hasOperationPermission("teachers.view") || teacherPersonalScheduleView()) return;
            teacherListState = { actor: currentUser, filters: next };
            const pagination = unifiedTablePaginationStates["m13-teachers"]; if (pagination) pagination.page = 1;
            renderPage();
          };
          filters.onsubmit = (event) => {
            event.preventDefault();
            if (!canAccessPage("teachers") || !hasOperationPermission("teachers.view") || teacherPersonalScheduleView()) return;
            apply(Object.fromEntries([...filters.querySelectorAll("[data-teacher-list-filter]")].map((input) => [input.dataset.teacherListFilter, input.value.trim()])));
          };
          $("#teacherListReset").onclick = () => apply(teacherEmptyListFilters());
        }
        if ($("#teacherScheduleMonth")) $("#teacherScheduleMonth").onchange = (event) => {
          if (!/^\d{4}-\d{2}$/.test(event.target.value) || !teacherValidDate(event.target.value + "-01")) return;
          teacherScheduleContext(); teacherScheduleState.month = event.target.value; renderPage();
        };
        document.querySelectorAll("[data-teacher-schedule-view]").forEach((button) => button.onclick = () => {
          if (!teacherScheduleContext().managing || !["calendar", "gantt"].includes(button.dataset.teacherScheduleView)) return;
          teacherScheduleState.view = button.dataset.teacherScheduleView; renderPage();
        });
        const refreshTeacherScheduleFilter = () => {
          const scrollTop = $("#teacherScheduleOptions")?.scrollTop || 0;
          renderPage();
          const picker = $("#teacherSchedulePicker");
          if (picker) { picker.open = true; $("#teacherScheduleOptions").scrollTop = scrollTop; }
        };
        if ($("#teacherScheduleAll")) $("#teacherScheduleAll").onchange = (event) => {
          if (!teacherScheduleContext().managing) return;
          teacherScheduleState.selected = event.target.checked ? null : []; refreshTeacherScheduleFilter();
        };
        document.querySelectorAll("[data-teacher-schedule-filter]").forEach((input) => input.onchange = () => {
          const context = teacherScheduleContext(); if (!context.managing) return;
          const selected = new Set(context.selected.map((teacher) => teacher.id));
          if (input.checked && context.available.some((teacher) => teacher.id === input.dataset.teacherScheduleFilter)) selected.add(input.dataset.teacherScheduleFilter);
          else selected.delete(input.dataset.teacherScheduleFilter);
          teacherScheduleState.selected = [...selected]; refreshTeacherScheduleFilter();
        });
        document.querySelectorAll("[data-teacher-schedule-item]").forEach((button) => button.onclick = () => openTeacherScheduleItem(button.dataset.teacherId, button.dataset.scheduleKind, button.dataset.teacherScheduleItem));
        if ($("#teacherCreate")) $("#teacherCreate").onclick = () => openTeacherForm();
        if ($("#teacherScopeManage")) $("#teacherScopeManage").onclick = openTeacherScopes;
        document.querySelectorAll("[data-teacher-detail]").forEach((button) => button.onclick = () => openTeacherDetail(button.dataset.teacherDetail));
        document.querySelectorAll("[data-project-teacher-profile]").forEach((button) => button.onclick = () => openProjectTeacherProfile(button.dataset.projectTeacherProfile));
        document.querySelectorAll("[data-teacher-edit]").forEach((button) => button.onclick = () => openTeacherForm(button.dataset.teacherEdit));
        document.querySelectorAll("[data-teacher-unavailable]").forEach((button) => button.onclick = () => openTeacherUnavailable(button.dataset.teacherUnavailable, button.dataset.unavailableId || ""));
        document.querySelectorAll("[data-teacher-remove-unavailable]").forEach((button) => button.onclick = () => { const actor = currentUser; teacherConfirm("删除不可用日期", "确认删除该不可用日期？", () => { if (currentUser !== actor) return; const result = teacherDeleteUnavailable(button.dataset.teacherRemoveUnavailable, button.dataset.unavailableId); if (result.error) $("#teacherConfirmError").textContent = result.error; else { teacherRefresh(result.teacher.id); toast("不可用日期已删除"); } }); });
        document.querySelectorAll("[data-teacher-status]").forEach((button) => button.onclick = () => { const teacher = teacherById(button.dataset.teacherStatus), expected = teacher?.status, actor = currentUser; if (!teacherCanManage(teacher)) return; teacherConfirm(expected === "启用" ? "停用老师" : "恢复老师", `${expected === "启用" ? "停用" : "恢复"}${teacherName(teacher)}？`, () => { if (currentUser !== actor) return; const result = teacherSetStatus(teacher.id, expected); if (result.error) $("#teacherConfirmError").textContent = result.error; else { teacherRefresh(); toast(expected === "启用" ? "老师已停用" : "老师已恢复"); } }); });
        document.querySelectorAll("[data-teacher-reveal]").forEach((button) => button.onclick = () => { const teacher = teacherById(button.dataset.teacherReveal); if (!teacherCanFullContact(teacher)) return toast("无权查看完整联系方式"); const target = button.previousElementSibling; target.innerHTML = [["phone", "手机号"], ["email", "邮箱"], ["wechat", "微信号"]].map(([key, label]) => teacherInfoHtml(label, teacherRawContact(teacher, key))).join(""); button.remove(); });
        document.querySelectorAll("[data-teacher-channel-reveal]").forEach((button) => button.onclick = () => { const teacher = teacherById(button.dataset.teacherChannelReveal), channel = teacher?.channels.find((item) => item.id === button.dataset.channelId); if (!channel || !teacherCanFullContact(teacher) || !teacherCanChannel(teacher, channel)) return toast("无权查看渠道联系方式"); button.previousElementSibling.innerHTML = teacherInfoHtml("联系人", channel.contact) + [["phone", "联系电话"], ["wechat", "联系人微信号"], ["email", "联系人邮箱"]].map(([key, label]) => teacherInfoHtml(label, channel[key])).join("") + (teacherCanFee(teacher, channel) ? teacherRoleFeesHtml(channel.roleFees, false, teacher.teachingTypes) : ""); button.remove(); });
        document.querySelectorAll("[data-teacher-resume-delete]").forEach((button) => button.onclick = () => {
          const teacher = teacherById(button.dataset.teacherResumeDelete), actor = currentUser, version = teacher?.version;
          if (!teacherCanManage(teacher) || !teacherCanResume(teacher, "delete")) return;
          teacherConfirm("删除简历", "确认删除该简历？", () => {
            if (currentUser !== actor) return;
            const result = teacherDeleteResume(teacher.id, button.dataset.resumeId, version);
            if (result.error) $("#teacherConfirmError").textContent = result.error;
            else { teacherRefresh(teacher.id); toast("简历已删除"); }
          });
        });
        document.querySelectorAll("[data-teacher-resume]").forEach((button) => button.onclick = () => openTeacherResume(button.dataset.teacherResume, button.dataset.resumeId, button.hasAttribute("data-resume-download")));
      }
