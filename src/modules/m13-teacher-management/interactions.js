      function teacherValidDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
      function teacherCanSchedule(teacher, item = null) {
        return teacherCanView(teacher) && (teacherIsFacultySupervisor() || hasOperationPermission("teachers.unavailable")) && (teacherCanManage(teacher) || (teacherIsSelf(teacher) && (!item || item.createdBy === teacherEmployee()?.code)));
      }
      function teacherCanCreate() { return teacherIsAdmin() || teacherIsFacultySupervisor() || (hasPermission("teachers") && hasOperationPermission("teachers.manage") && teacherScopes().length > 0); }
      function teacherFeeError(fee, tax) {
        if (fee == null && tax) return "课酬金额与含税／不含税口径须一起填写";
        return fee != null && (!Number.isFinite(Number(fee)) || Number(fee) < 0 || !/^(\d+)(\.\d{1,2})?$/.test(String(fee)) || !["含税", "不含税"].includes(tax)) ? "课酬须为非负金额、最多两位小数，并选择含税或不含税" : "";
      }
      function teacherSaveProfile(id, draft) {
        const existing = id ? teacherById(id) : null;
        if (id ? !teacherCanManage(existing) : !teacherCanCreate()) return { error: "无权维护该老师" };
        if (existing && draft.version !== existing.version) return { error: "资料已更新，请重新打开后编辑" };
        const type = existing?.type || draft.type;
        const scopes = teacherIsAdmin() || teacherIsFacultySupervisor() ? Object.keys(TEACHER_SCOPE_NAMES) : teacherScopes();
        if (!["内部", "外部"].includes(type) || (type === "内部" && !scopes.includes("internal"))) return { error: "请选择有权维护的老师类型" };
        const employeeCode = existing?.employeeCode || draft.employeeCode;
        const employee = employees.find((item) => item.code === employeeCode);
        if (type === "内部" && (!employee || !employeeHasRole(employee, "老师") || teachers.some((teacher) => teacher.id !== id && teacher.employeeCode === employeeCode))) return { error: "请选择尚未建档的老师角色员工" };
        const name = type === "内部" ? employee.name : String(draft.name || "").trim();
        const phone = type === "内部" ? employee.phone : String(draft.phone || "").trim();
        if (!name || !/^1[3-9]\d{9}$/.test(phone)) return { error: "请填写姓名及有效手机号" };
        if (!Array.isArray(draft.directions) || !draft.directions.length || draft.directions.some((direction) => !teacherCourseOptions().some((item) => item.id === direction))) return { error: "请至少选择一门采购包课程作为教学方向" };
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
          channels = [...hidden.map((channel) => ({ ...channel })), ...incoming.map((channel, index) => ({ id: channel.id || `CH-${id || 'new'}-${Date.now()}-${index}`, kind: channel.kind, agencyName: channel.kind === "agency" ? String(channel.agencyName || "").trim() : "", contact: channel.kind === "agency" ? String(channel.contact || "").trim() : "", phone: channel.kind === "agency" ? String(channel.phone || "").trim() : "", wechat: channel.kind === "agency" ? String(channel.wechat || "").trim() : "", email: channel.kind === "agency" ? String(channel.email || "").trim() : "", fee: channel.fee == null || channel.fee === "" ? null : Number(channel.fee), tax: channel.tax || "" }))];
          if (!channels.length || channels.filter((channel) => channel.kind === "personal").length > 1) return { error: "外部老师须至少保留一个渠道，个人渠道不可重复" };
          for (const channel of channels.filter((item) => scopes.includes(item.kind))) {
            if (channel.kind === "agency" && !channel.agencyName) return { error: "请填写机构名称" };
            if (channel.phone && !/^[+\d\s()-]{5,30}$/.test(channel.phone)) return { error: "机构联系电话格式不正确" };
            if (channel.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel.email)) return { error: "机构联系人邮箱格式不正确" };
            const feeError = teacherFeeError(channel.fee, channel.tax); if (feeError) return { error: feeError };
            if (!teacherIsFacultySupervisor() && !hasFieldPermission("teacher_fee_view")) {
              const before = existing?.channels.find((item) => item.id === channel.id);
              if (channel.fee !== (before?.fee ?? null) || channel.tax !== (before?.tax || "")) return { error: "无权修改课酬" };
            }
          }
        }
        const standardFee = draft.standardFee == null || draft.standardFee === "" ? null : Number(draft.standardFee);
        const standardTax = draft.standardTax || "";
        if (type === "内部") {
          const error = teacherFeeError(standardFee, standardTax); if (error) return { error };
          if (!teacherIsFacultySupervisor() && !hasFieldPermission("teacher_fee_view") && (standardFee !== (existing?.standardFee ?? null) || standardTax !== (existing?.standardTax || ""))) return { error: "无权修改课酬" };
        }
        if (existing) {
          const removed = existing.directions.filter((direction) => !draft.directions.includes(direction));
          const blocking = teacherProjectBookings(id).filter((project) => removed.includes(project.teachingDirectionId) && ["已立项", "进行中"].includes(computeProjectStageAndTodos(project).stage) && [...(project.teacherAssignments?.lecturers || []), ...(project.teacherAssignments?.assistantLecturers || [])].includes(id));
          if (blocking.length) return { error: "该方向仍有未开始或进行中项目，请先更换老师或调整项目：" + blocking.map((project) => project.id).join("、") };
        }
        const newId = existing?.id || `T${String(Math.max(0, ...teachers.map((teacher) => Number(teacher.id.slice(1)) || 0)) + 1).padStart(3, "0")}`;
        const payload = { id: newId, type, employeeCode: type === "内部" ? employeeCode : "", name, phone: type === "内部" ? "" : phone, intro: String(draft.intro || "").trim(), gender: String(draft.gender || ""), birthDate: draft.birthDate || "", education: String(draft.education || "").trim(), email: String(draft.email || "").trim(), wechat: String(draft.wechat || "").trim(), directions: [...new Set(draft.directions)], channels, ...(type === "内部" ? { standardFee, standardTax } : {}), version: (existing?.version || 0) + 1 };
        if (existing) Object.assign(existing, payload);
        else teachers.push({ ...payload, status: "启用", resumes: [], unavailable: [] });
        return { teacher: teacherById(newId) };
      }
      function teacherSaveUnavailable(teacherId, itemId, start, end, expectedVersion) {
        const teacher = teacherById(teacherId), old = teacher?.unavailable.find((item) => item.id === itemId);
        if (!teacherCanSchedule(teacher, old) || (itemId && !old)) return { error: "无权维护该不可用日期" };
        if (expectedVersion != null && teacher.version !== expectedVersion) return { error: "排期已更新，请重新打开" };
        if (!teacherValidDate(start) || !teacherValidDate(end) || start > end) return { error: "请填写有效的起止日期，结束不得早于开始" };
        const conflicts = teacherProjectBookings(teacherId).filter((project) => teacherDatesOverlap(start, end, teacherDate(project.startTime), teacherDate(project.endTime)));
        if (conflicts.length) return { error: "与已安排项目冲突，请先调整项目：" + conflicts.map((project) => project.id).join("、") };
        if (old) Object.assign(old, { start, end });
        else teacher.unavailable.push({ id: `U-${Date.now()}-${teacher.version}`, start, end, createdBy: teacherEmployee()?.code || "YJ007" });
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
      function teacherRefresh(id = "") { closeAllOverlays(); renderPage(); if (id && teacherCanView(teacherById(id))) openTeacherDetail(id); }
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
      function teacherFeeInputs(prefix, fee, tax, label) {
        return teacherInput(`${label}（元/天）`, prefix + "Fee", fee ?? "", "number", 'min="0" step="0.01"') + `<label class="form-group"><span class="form-label">${label}税务口径</span><select class="input" id="${prefix}Tax"><option value="">请选择</option>${["含税", "不含税"].map((item) => `<option ${tax === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>`;
      }
      function teacherContactInput(label, key, value, prefix = "tf") {
        return teacherInput(label, prefix + key, "", key === "email" ? "email" : "text", `data-teacher-contact="${key}" data-unchanged="true" placeholder="${escapeHtml(value ? maskTeacherContact(value, key) + '（留空保持原值）' : '选填')}"`);
      }
      function teacherChannelForm(channel = {}, index = 0) {
        const prefix = "tc" + index;
        return `<section class="teacher-channel-card" data-teacher-channel-row data-channel-id="${escapeHtml(channel.id || "")}" data-channel-kind="${channel.kind || "agency"}" data-channel-prefix="${prefix}"><div class="teacher-row-head"><strong>${channel.kind === "personal" ? "个人合作" : "机构合作"}</strong><button type="button" class="btn btn-sm" data-remove-teacher-channel>移除</button></div><div class="form-grid">${channel.kind !== "personal" ? teacherInput("机构名称 *", prefix + "Agency", channel.agencyName || "") + teacherInput("联系人", prefix + "Contact", channel.contact || "") + teacherContactInput("联系电话", "phone", channel.phone, prefix) + teacherContactInput("联系人微信号", "wechat", channel.wechat, prefix) + teacherContactInput("联系人邮箱", "email", channel.email, prefix) : ""}${hasFieldPermission("teacher_fee_view") ? teacherFeeInputs(prefix, channel.fee, channel.tax, "参考课酬") : ""}</div></section>`;
      }
      function openTeacherForm(id = "") {
        const teacher = id ? teacherById(id) : null;
        if (id ? !teacherCanManage(teacher) : !teacherCanCreate()) return toast("无权维护老师");
        const actor = currentUser, expectedVersion = teacher?.version;
        const scopes = teacherIsAdmin() ? Object.keys(TEACHER_SCOPE_NAMES) : teacherScopes();
        const type = teacher?.type || (scopes.includes("internal") ? "内部" : "外部");
        const employeeOptions = employees.filter((employee) => employeeHasRole(employee, "老师") && (!teachers.some((item) => item.employeeCode === employee.code) || employee.code === teacher?.employeeCode));
        openModal(`<div class="modal-head"><div class="modal-title">${teacher ? "编辑老师" : "新增老师"}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherForm" novalidate><div class="modal-body teacher-form"><div class="form-grid"><label class="form-group"><span class="form-label">老师类型 *</span><select class="input" id="tfType" ${teacher ? "disabled" : ""}>${["内部", "外部"].filter((item) => item === "内部" ? scopes.includes("internal") : scopes.some((scope) => scope !== "internal")).map((item) => `<option ${type === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="form-group" id="tfEmployeeGroup"><span class="form-label">关联员工 *</span><select class="input" id="tfEmployee" ${teacher ? "disabled" : ""}><option value="">请选择老师角色员工</option>${employeeOptions.map((employee) => `<option value="${employee.code}" ${teacher?.employeeCode === employee.code ? "selected" : ""}>${escapeHtml(employee.name)}（${employee.code}）</option>`).join("")}</select></label>${teacherInput("老师姓名 *", "tfName", teacher ? teacherName(teacher) : "")}${teacherContactInput("手机号 *", "phone", teacher && teacherRawContact(teacher, "phone"))}${teacherInput("性别", "tfGender", teacher?.gender || "")}${teacherInput("出生日期", "tfBirth", teacher?.birthDate || "", "date")}${teacherInput("学历", "tfEducation", teacher?.education || "")}${teacherContactInput("邮箱", "email", teacher?.email)}${teacherContactInput("微信号", "wechat", teacher?.wechat)}<label class="form-group full"><span class="form-label">简介</span><textarea class="input" id="tfIntro" rows="3">${escapeHtml(teacher?.intro || "")}</textarea></label><div class="form-group full"><span class="form-label">教学方向 *</span><div class="choice-grid">${teacherCourseOptions().map((direction) => `<label class="choice-item"><input type="checkbox" data-teacher-direction value="${direction.id}" ${teacher?.directions.includes(direction.id) ? "checked" : ""}><span>${escapeHtml(teacherDirectionName(direction.id))}</span></label>`).join("")}</div></div><div id="tfInternalFeeGroup" class="teacher-form-section">${teacherIsFacultySupervisor() || hasFieldPermission("teacher_fee_view") ? teacherFeeInputs("tfStandard", teacher?.standardFee, teacher?.standardTax, "标准课酬") : ""}</div><div id="tfChannelsGroup" class="form-group full"><span class="form-label">合作渠道 *</span><div id="tfChannels">${(teacher?.channels || []).filter((channel) => scopes.includes(channel.kind)).map(teacherChannelForm).join("")}</div><div class="teacher-form-actions">${scopes.includes("agency") ? '<button type="button" class="btn btn-sm" id="tfAddAgency">添加机构渠道</button>' : ""}${scopes.includes("personal") ? '<button type="button" class="btn btn-sm" id="tfAddPersonal">添加个人渠道</button>' : ""}</div></div>${(!teacher || teacherCanResume(teacher, "upload")) && (teacherIsAdmin() || teacherIsFacultySupervisor() || currentRoleTemplateNames().includes("教学管理人员")) && (teacherIsFacultySupervisor() || hasAttachmentPermission("teacher_resume_upload")) ? `<label class="form-group full"><span class="form-label">添加简历</span><input class="input" id="tfResumes" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"><span class="list-sub">单个文件不超过20MB，最多9个。</span></label>` : ""}<div class="field-error full" id="tfError" role="alert"></div></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button type="submit" class="btn btn-primary" id="tfSave">保存</button></div></form>`);
        const form = $("#teacherForm");
        let channelIndex = (teacher?.channels.length || 0) + 1;
        const updateType = () => {
          const internal = $("#tfType").value === "内部";
          $("#tfEmployeeGroup").style.display = internal ? "" : "none";
          $("#tfName").disabled = internal; $("#tfphone").disabled = internal;
          $("#tfInternalFeeGroup").style.display = internal ? "contents" : "none";
          $("#tfChannelsGroup").style.display = internal ? "none" : "";
          if (internal) { const employee = employees.find((item) => item.code === $("#tfEmployee").value); $("#tfName").value = employee?.name || ""; $("#tfphone").value = employee ? displayEmployeePhone(employee) : ""; }
          else { $("#tfName").value = teacher?.name || ""; $("#tfphone").value = ""; }
        };
        $("#tfType").onchange = updateType; $("#tfEmployee").onchange = updateType; updateType();
        const bindRows = () => {
          document.querySelectorAll("[data-remove-teacher-channel]").forEach((button) => button.onclick = () => button.closest("[data-teacher-channel-row]").remove());
          document.querySelectorAll("[data-teacher-contact]").forEach((input) => input.oninput = () => input.dataset.unchanged = "false");
        }; bindRows();
        const addChannel = (kind) => { $("#tfChannels").insertAdjacentHTML("beforeend", teacherChannelForm({ kind }, channelIndex++)); bindRows(); };
        if ($("#tfAddAgency")) $("#tfAddAgency").onclick = () => addChannel("agency");
        if ($("#tfAddPersonal")) $("#tfAddPersonal").onclick = () => { if (document.querySelector('[data-channel-kind="personal"]')) return toast("已添加个人渠道"); addChannel("personal"); };
        $("#teacherForm").onsubmit = async (event) => {
          event.preventDefault();
          if ($("#teacherForm") !== form || currentUser !== actor || (teacher ? !teacherCanManage(teacher) : !teacherCanCreate())) return toast("权限已变化，请重新打开");
          const get = (selector) => $(selector)?.value.trim() || "";
          const contactValue = (prefix, key, original) => { const input = $("#" + prefix + key); return input?.dataset.unchanged === "true" ? original || "" : input?.value.trim() || ""; };
          const channels = [...document.querySelectorAll("[data-teacher-channel-row]")].map((row) => {
            const prefix = row.dataset.channelPrefix, before = teacher?.channels.find((item) => item.id === row.dataset.channelId);
            return { id: row.dataset.channelId, kind: row.dataset.channelKind, agencyName: get("#" + prefix + "Agency"), contact: get("#" + prefix + "Contact"), ...Object.fromEntries(["phone", "email", "wechat"].map((key) => [key, contactValue(prefix, key, before?.[key])])), fee: $("#" + prefix + "Fee") ? get("#" + prefix + "Fee") : before?.fee ?? null, tax: $("#" + prefix + "Tax") ? get("#" + prefix + "Tax") : before?.tax || "" };
          });
          const draft = { version: expectedVersion, type: get("#tfType"), employeeCode: get("#tfEmployee"), name: get("#tfName"), phone: contactValue("tf", "phone", teacher && teacherRawContact(teacher, "phone")), email: contactValue("tf", "email", teacher?.email), wechat: contactValue("tf", "wechat", teacher?.wechat), gender: get("#tfGender"), birthDate: get("#tfBirth"), education: get("#tfEducation"), intro: get("#tfIntro"), directions: [...document.querySelectorAll("[data-teacher-direction]:checked")].map((input) => input.value), channels, standardFee: $("#tfStandardFee") ? get("#tfStandardFee") : teacher?.standardFee ?? null, standardTax: $("#tfStandardTax") ? get("#tfStandardTax") : teacher?.standardTax || "" };
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
          const result = teacherSaveProfile(id, draft);
          if (result.error) { $("#tfError").textContent = result.error; $("#tfSave").disabled = false; return; }
          files.forEach((file, index) => { const fileId = `CV-${result.teacher.id}-${Date.now()}-${index}`; teacherResumeFiles.set(fileId, file); result.teacher.resumes.push({ id: fileId, name: file.name, type: file.type, size: file.size, addedBy: actor.name }); });
          teacherRefresh(); toast("老师资料已保存");
        };
      }
      function openTeacherUnavailable(teacherId, itemId = "") {
        const teacher = teacherById(teacherId), item = teacher?.unavailable.find((entry) => entry.id === itemId);
        if (!teacherCanSchedule(teacher, item)) return toast("无权维护该不可用日期");
        const version = teacher.version, actor = currentUser;
        openModal(`<div class="modal-head"><div class="modal-title">${item ? "编辑" : "登记"}不可用日期</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherUnavailableForm"><div class="modal-body"><div class="form-grid">${teacherInput("开始日期 *", "tuStart", item?.start || "", "date", "required")}${teacherInput("结束日期 *", "tuEnd", item?.end || "", "date", "required")}<div class="field-error full" id="tuError" role="alert"></div></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button type="submit" class="btn btn-primary">保存</button></div></form>`);
        $("#teacherUnavailableForm").onsubmit = (event) => { event.preventDefault(); if (currentUser !== actor) return; const result = teacherSaveUnavailable(teacherId, itemId, $("#tuStart").value, $("#tuEnd").value, version); if (result.error) $("#tuError").textContent = result.error; else { teacherRefresh(teacherId); toast("不可用日期已保存"); } };
      }
      function teacherConfirm(title, text, onConfirm) {
        openModal(`<div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><p>${escapeHtml(text)}</p><div class="field-error" id="teacherConfirmError" role="alert"></div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="teacherConfirm">确认</button></div>`);
        $("#teacherConfirm").onclick = onConfirm;
      }
      function teacherSaveScopes(code, scopes) {
        if (!teacherCanConfigureScopes()) return "无权维护教学管理范围";
        const facultyManagers = employees.filter((employee) => employeeHasRole(employee, "教学管理人员") && employeeDepartmentNames(employee).includes("师资管理部"));
        const allowedManagers = teacherIsAdmin() ? employees.filter((employee) => employeeHasRole(employee, "教学管理人员")) : facultyManagers;
        if (!allowedManagers.some((employee) => employee.code === code)) return "请选择师资管理部的教学管理人员";
        if (!Array.isArray(scopes) || scopes.some((scope) => !Object.hasOwn(TEACHER_SCOPE_NAMES, scope))) return "教学管理范围不正确";
        teachingManagementAssignments[code] = [...new Set(scopes)]; return "";
      }
      function openTeacherScopes() {
        if (!teacherCanConfigureScopes()) return;
        const managers = teacherIsAdmin() ? employees.filter((employee) => employeeHasRole(employee, "教学管理人员")) : employees.filter((employee) => employeeHasRole(employee, "教学管理人员") && employeeDepartmentNames(employee).includes("师资管理部"));
        openModal(`<div class="modal-head"><div class="modal-title">教学管理范围</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherScopesForm"><div class="modal-body"><label class="form-group"><span class="form-label">教学管理人员</span><select class="input" id="tsEmployee">${managers.map((employee) => `<option value="${employee.code}">${escapeHtml(employee.name)}</option>`).join("")}</select></label><div id="tsChoices" class="choice-grid"></div><div class="field-error" id="tsError"></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button type="submit" class="btn btn-primary">保存</button></div></form>`);
        const update = () => $("#tsChoices").innerHTML = Object.entries(TEACHER_SCOPE_NAMES).map(([key, name]) => `<label class="choice-item"><input type="checkbox" value="${key}" ${(teachingManagementAssignments[$("#tsEmployee").value] || []).includes(key) ? "checked" : ""}><span>${name}</span></label>`).join("");
        $("#tsEmployee").onchange = update; update();
        $("#teacherScopesForm").onsubmit = (event) => { event.preventDefault(); const error = teacherSaveScopes($("#tsEmployee").value, [...document.querySelectorAll("#tsChoices input:checked")].map((input) => input.value)); if (error) $("#tsError").textContent = error; else { teacherRefresh(); toast("教学管理范围已保存"); } };
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
      function bindTeacherEvents() {
        if ($("#teacherScheduleMonth")) $("#teacherScheduleMonth").onchange = (event) => {
          if (!/^\d{4}-\d{2}$/.test(event.target.value) || !teacherValidDate(event.target.value + "-01")) return;
          teacherScheduleContext(); teacherScheduleState.month = event.target.value; renderPage();
        };
        document.querySelectorAll("[data-teacher-schedule-view]").forEach((button) => button.onclick = () => {
          if (!teacherScheduleContext().managing || !["calendar", "gantt"].includes(button.dataset.teacherScheduleView)) return;
          teacherScheduleState.view = button.dataset.teacherScheduleView; renderPage();
        });
        if ($("#teacherScheduleAll")) $("#teacherScheduleAll").onchange = (event) => {
          if (!teacherScheduleContext().managing) return;
          teacherScheduleState.selected = event.target.checked ? null : []; renderPage();
        };
        document.querySelectorAll("[data-teacher-schedule-filter]").forEach((input) => input.onchange = () => {
          const context = teacherScheduleContext(); if (!context.managing) return;
          const selected = new Set(context.selected.map((teacher) => teacher.id));
          if (input.checked && context.available.some((teacher) => teacher.id === input.dataset.teacherScheduleFilter)) selected.add(input.dataset.teacherScheduleFilter);
          else selected.delete(input.dataset.teacherScheduleFilter);
          teacherScheduleState.selected = [...selected]; renderPage();
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
        document.querySelectorAll("[data-teacher-channel-reveal]").forEach((button) => button.onclick = () => { const teacher = teacherById(button.dataset.teacherChannelReveal), channel = teacher?.channels.find((item) => item.id === button.dataset.channelId); if (!channel || !teacherCanFullContact(teacher) || !teacherCanChannel(teacher, channel)) return toast("无权查看渠道联系方式"); button.previousElementSibling.innerHTML = teacherInfoHtml("联系人", channel.contact) + [["phone", "联系电话"], ["wechat", "联系人微信号"], ["email", "联系人邮箱"]].map(([key, label]) => teacherInfoHtml(label, channel[key])).join("") + (teacherCanFee(teacher, channel) ? teacherFeeHtml(channel.fee, channel.tax, "参考课酬") : ""); button.remove(); });
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
