      function saveLevelConfig(level) {
        if (!hasOperationPermission("settings.edit"))
          return toast("\u5f53\u524d\u89d2\u8272\u4ec5\u53ef\u67e5\u770b\u5ba2\u6237\u57fa\u7840\u914d\u7f6e");
        const cycle = Number(document.getElementById("lc-" + level)?.value) || maintenanceConfig.cycles[level] || 30;
        const title = document.getElementById("lt-" + level)?.value?.trim() || maintenanceConfig.titles[level] || "";
        const requirement = document.getElementById("lr-" + level)?.value?.trim() || maintenanceConfig.requirements[level] || "";
        const reminderDays = [...document.querySelectorAll("[data-reminder-day]")].filter((input) => input.id.startsWith("rd-" + level + "-") && input.checked).map((input) => Number(input.value));
        openModal(`<div class="modal-head"><div class="modal-title">\u786e\u5b9a\u4fee\u6539 ${level}\uff1f</div><button class="icon-btn close" data-close>\u00d7</button></div><div class="modal-body"><div class="role-note danger-note"><strong>\u4fee\u6539\u540e\u5df2\u5b58\u5728\u4efb\u52a1\u4e0d\u53d7\u5f71\u54cd\uff0c\u65b0\u4efb\u52a1\u5c06\u6309\u4fee\u6539\u540e\u7684\u89c4\u5219\u8ba1\u7b97\u3002</strong></div></div><div class="modal-foot"><button class="btn" data-close>\u53d6\u6d88</button><button class="btn btn-primary" id="confirmLevelSave">\u786e\u5b9a\u4fee\u6539</button></div>`);
        $("#confirmLevelSave").onclick = () => {
          maintenanceConfig.cycles[level] = cycle;
          maintenanceConfig.reminders[level] = [...new Set(reminderDays)].sort((a, b) => b - a).join(",");
          maintenanceConfig.titles[level] = title;
          maintenanceConfig.requirements[level] = requirement;
          maintenanceConfig.version = `LV-${DEMO_TODAY.replaceAll("-", "")}-${String(Number(maintenanceConfig.version.split("-").pop()) + 1).padStart(2, "0")}`;
          maintenanceConfig.updatedAt = recordCreatedAt();
          recordOrganizationChange({ date: DEMO_TODAY, object: `\u804c\u7ea7\u914d\u7f6e\uff08${level}\uff09`, type: "\u914d\u7f6e\u4fee\u6539", detail: `\u5468\u671f${cycle}\u5929\uff1b\u63d0\u9192${maintenanceConfig.reminders[level]}\uff1b\u7248\u672c${maintenanceConfig.version}`, operator: currentUser.name, status: "\u5df2\u751f\u6548" });
          closeOverlay();
          renderPage();
          toast(`${level}\u914d\u7f6e\u5df2\u4fdd\u5b58\uff0c\u5df2\u5b58\u5728\u4efb\u52a1\u4e0d\u53d7\u5f71\u54cd`);
        };
      }

      function saveEscalationConfig() {
        if (!hasOperationPermission("settings.edit"))
          return toast("\u5f53\u524d\u89d2\u8272\u4ec5\u53ef\u67e5\u770b\u5ba2\u6237\u57fa\u7840\u914d\u7f6e");
        const director = Number($("#directorEscalation")?.value);
        const vp = Number($("#vpEscalation")?.value);
        if (!Number.isInteger(director) || director < 1 || director > 365)
          return toast("\u533a\u57df\u603b\u76d1\u903e\u671f\u5929\u6570\u987b\u4e3a 1-365");
        if (!Number.isInteger(vp) || vp < 1 || vp > 365)
          return toast("\u5e02\u573a\u526f\u603b\u903e\u671f\u5929\u6570\u987b\u4e3a 1-365");
        maintenanceConfig.directorEscalation = director;
        maintenanceConfig.vpEscalation = vp;
        maintenanceConfig.updatedAt = recordCreatedAt();
        recordOrganizationChange({ date: DEMO_TODAY, object: "\u903e\u671f\u5347\u7ea7\u63d0\u9192", type: "\u914d\u7f6e\u4fee\u6539", detail: `\u533a\u57df\u603b\u76d1 ${director} \u5929\uff1b\u5e02\u573a\u526f\u603b ${vp} \u5929`, operator: currentUser.name, status: "\u5df2\u751f\u6548" });
        renderPage();
        toast("\u5347\u7ea7\u63d0\u9192\u914d\u7f6e\u5df2\u4fdd\u5b58");
      }




      function ruleLevelValues(rule) {
        if (!rule) return ["一级", "二级", "三级", "四级"];
        if (rule.levels === "全部职级")
          return ["一级", "二级", "三级", "四级"];
        return String(rule.levels || "")
          .split(/[、,，]/)
          .filter((value) => ["一级", "二级", "三级", "四级"].includes(value));
      }

      function ruleHolidayNames(rule) {
        return (rule.holidayIds || [])
          .map((id) => holidayCalendar.holidays.find((item) => item.id === id)?.name)
          .filter(Boolean)
          .join("、");
      }

      function openRuleForm(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const r = ruleData.find((x) => x.id === id);
        if (!r) return toast("规则集合为系统预置，不支持新增，仅可编辑既有规则");
        const selectedLevels = new Set(ruleLevelValues(r));
        const selectedHolidayIds = new Set(r?.holidayIds || []);
        openModal(
          `<div class="modal-head"><div class="modal-title">编辑自动任务规则（预置）</div><button class="icon-btn close" data-close>×</button></div><form id="ruleForm"><div class="modal-body"><div class="section-title">触发来源</div><div class="form-grid"><div class="form-group"><label class="form-label">规则类型 *</label><select class="input" id="ruleType" disabled><option value="birthday" ${r?.type !== "holiday" ? "selected" : ""}>生日关怀</option><option value="holiday" ${r?.type === "holiday" ? "selected" : ""}>节假日关怀</option></select></div><div class="form-group"><label class="form-label">规则名称 *</label><input class="input" id="ruleName" minlength="2" maxlength="100" value="${r?.name || ""}" required></div><div class="form-group full" id="ruleHolidayGroup"><label class="form-label">关联节假日 * <span class="panel-sub">下拉多选；只有选中的节假日生成任务</span></label><select class="input" id="ruleHolidaySelect"><option value="">从下拉中选择节假日添加…</option>${holidayCalendar.holidays.filter((holiday) => !selectedHolidayIds.has(holiday.id)).map((holiday) => `<option value="${holiday.id}">${holiday.name} · ${holiday.year} · ${holiday.startDate} 至 ${holiday.endDate}</option>`).join("")}</select><div id="ruleHolidayTags" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px"></div></div></div><div class="section-title">目标与时点</div><div class="form-grid"><div class="form-group full"><label class="form-label">适用职级 *</label><div class="checkbox-grid">${["一级", "二级", "三级", "四级"].map((level) => `<label class="check-row"><input type="checkbox" data-rule-level value="${level}" ${selectedLevels.has(level) ? "checked" : ""}><span>${level}</span></label>`).join("")}</div></div><div class="form-group"><label class="form-label">提前生成（天） *</label><input class="input" id="ruleLead" type="number" min="0" max="60" value="${r?.lead ?? 7}" required></div><div class="form-group"><label class="form-label">截止时间</label><input class="input" value="事件日当天 23:59:59（固定）" disabled></div><div class="form-group full"><label class="form-label">站内提醒节点 * <span class="panel-sub">至少选择 1 项</span></label><div class="choice-grid" id="ruleReminderChoices"></div></div><div class="form-group"><label class="form-label">允许逾期补完成</label><input class="input" value="否（固定）" disabled><div class="list-sub">生日/节假日任务越过截止即记录曾经逾期并进入已过期未完成，不可开启</div></div></div><div class="section-title">任务内容</div><div class="form-grid"><div class="form-group full"><label class="form-label">任务标题模板 *</label><input class="input" id="ruleTitle" minlength="2" maxlength="100" value="${r?.title || "【{{事件名称}}关怀】{{关键人姓名}}"}" required></div><div class="form-group full"><label class="form-label">执行要求 *</label><textarea class="input" id="ruleContent" minlength="5" maxlength="1000" required>${r?.content || "完成客户关怀并记录沟通结果。"}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存并启用</button></div></form>`,
        );
        const refresh = () => {
          const birthday = $("#ruleType").value === "birthday";
          $("#ruleHolidayGroup").classList.toggle("hidden", birthday);
        };
        $("#ruleType").onchange = refresh;
        const renderHolidayTags = () => {
          const select = $("#ruleHolidaySelect");
          const box = $("#ruleHolidayTags");
          if (box)
            box.innerHTML =
              [...selectedHolidayIds]
                .map((holidayId) => {
                  const holiday = holidayCalendar.holidays.find(
                    (item) => item.id === holidayId,
                  );
                  return holiday
                    ? `<span class="tag blue" style="display:inline-flex;align-items:center;gap:4px">${holiday.name} · ${holiday.year} · ${holiday.startDate}<button type="button" class="link" data-rule-holiday-remove value="${holiday.id}" style="padding:0 2px">×</button></span>`
                    : "";
                })
                .join("") || '<span class="list-sub">尚未选择节假日</span>';
          if (select) {
            const previous = select.value;
            select.innerHTML =
              `<option value="">从下拉中选择节假日添加…</option>` +
              holidayCalendar.holidays
                .filter((holiday) => !selectedHolidayIds.has(holiday.id))
                .map(
                  (holiday) =>
                    `<option value="${holiday.id}">${holiday.name} · ${holiday.year} · ${holiday.startDate} 至 ${holiday.endDate}</option>`,
                )
                .join("");
            select.value = selectedHolidayIds.has(previous) ? "" : previous;
          }
        };
        $("#ruleHolidaySelect").onchange = () => {
          const value = $("#ruleHolidaySelect").value;
          if (value) {
            selectedHolidayIds.add(value);
            renderHolidayTags();
          }
        };
        $("#ruleHolidayTags").onclick = (event) => {
          const button = event.target.closest("[data-rule-holiday-remove]");
          if (button) {
            selectedHolidayIds.delete(button.value);
            renderHolidayTags();
          }
        };
        renderHolidayTags();
        refresh();
        const reminderCandidates = [0, 1, 2, 3, 5, 7, 10, 15, 30];
        const reminderSet = new Set(
          String(r?.reminders || "3,1,0")
            .split(",")
            .map((value) => Number(value))
            .filter((value) => reminderCandidates.includes(value)),
        );
        const renderReminders = () => {
          const lead = Number($("#ruleLead")?.value ?? r?.lead ?? 7);
          [...reminderSet].forEach((day) => {
            if (day > lead) reminderSet.delete(day);
          });
          const box = $("#ruleReminderChoices");
          if (!box) return;
          box.innerHTML = reminderCandidates
            .filter((day) => day <= lead)
            .map((day) => {
              const label = day === 0 ? "截止日" : `提前 ${day} 天`;
              return `<label class="choice-item"><input type="checkbox" data-rule-reminder value="${day}" ${reminderSet.has(day) ? "checked" : ""}><span>${label}</span></label>`;
            })
            .join("");
        };
        $("#ruleLead").oninput = renderReminders;
        $("#ruleReminderChoices").onchange = (event) => {
          const input = event.target.closest("[data-rule-reminder]");
          if (!input) return;
          if (input.checked) reminderSet.add(Number(input.value));
          else reminderSet.delete(Number(input.value));
        };
        renderReminders();
        $("#ruleForm").onsubmit = (e) => {
          e.preventDefault();
          const reminders = [...document.querySelectorAll("[data-rule-reminder]:checked")].map(
            (input) => input.value,
          );
          const type = $("#ruleType").value;
          const lead = Number($("#ruleLead").value);
          const levels = [...document.querySelectorAll("[data-rule-level]:checked")].map(
            (input) => input.value,
          );
          const holidayIds = [...selectedHolidayIds];
          const allowLateCompletion = false;
          const lateCompletionDays = null;
          const name = $("#ruleName").value.trim();
          const title = $("#ruleTitle").value.trim();
          const content = $("#ruleContent").value.trim();
          if (name.length < 2 || name.length > 100)
            return toast("规则名称须为 2-100 字");
          if (
            ruleData.some(
              (item) => item.id !== r?.id && item.name.toLowerCase() === name.toLowerCase(),
            )
          )
            return toast("规则名称已存在");
          if (!levels.length) return toast("请至少选择一个适用职级");
          if (type === "holiday" && !holidayIds.length)
            return toast("节假日规则必须选择至少一个关联节假日");
          if (!Number.isInteger(lead) || lead < 0 || lead > 60)
            return toast("提前生成天数须为 0-60 天");
          if (reminders.length < 1)
            return toast("请至少选择一个站内提醒节点");
          if (reminders.some((value) => !reminderCandidates.includes(Number(value)) || Number(value) > lead))
            return toast(`站内提醒节点不能超过提前生成天数 ${lead}`);
          const allowedVariables = [
            "{{关键人姓名}}",
            "{{客户单位}}",
            "{{事件名称}}",
            "{{事件日期}}",
          ];
          if (
            title.length < 2 ||
            title.length > 100 ||
            (title.match(/{{[^}]+}}/g) || []).some(
              (value) => !allowedVariables.includes(value),
            )
          )
            return toast("任务标题长度或变量不符合要求");
          if (content.length < 5 || content.length > 1000)
            return toast("执行要求须为 5-1000 字");
          const conflictingRule = ruleData.find((item) => {
            if (
              item.id === r?.id ||
              item.status !== "启用" ||
              item.type !== type
            )
              return false;
            const overlappingLevels = ruleLevelValues(item).filter((level) =>
              levels.includes(level),
            );
            if (!overlappingLevels.length) return false;
            if (type === "birthday") return true;
            return (item.holidayIds || []).some((holidayId) =>
              holidayIds.includes(holidayId),
            );
          });
          if (conflictingRule) {
            const duplicateLevels = ruleLevelValues(conflictingRule).filter(
              (level) => levels.includes(level),
            );
            const duplicateHolidays = (conflictingRule.holidayIds || [])
              .filter((holidayId) => holidayIds.includes(holidayId))
              .map((holidayId) => holidayCalendar.holidays.find((item) => item.id === holidayId)?.name)
              .filter(Boolean);
            return toast(
              `与“${conflictingRule.name}”冲突：${duplicateLevels.join("、")}${duplicateHolidays.length ? ` · ${duplicateHolidays.join("、")}` : ""}`,
            );
          }
          const data = {
            type,
            name,
            levels: levels.length === 4 ? "全部职级" : levels.join("、"),
            lead,
            dueBefore: 0,
            reminders: [...new Set(reminders.map(Number))]
              .sort((a, b) => b - a)
              .join(","),
            allowLateCompletion,
            lateCompletionDays,
            holidayIds: type === "holiday" ? holidayIds : [],
            title,
            content,
            source:
              type === "birthday"
                ? "关键人生日（公历月日）"
                : "年度法定节假日日历",
            matched: r?.matched || 0,
            nextRun: type === "birthday" ? "每日 01:00" : "每日 01:10",
            status: r?.status || "启用",
            updatedAt: recordCreatedAt(),
          };
          if (r) Object.assign(r, data);
          else ruleData.push({ id: Date.now(), ...data });
          closeOverlay();
          renderPage();
          toast("自动任务规则已保存，下一调度周期生效");
        };
      }
      function toggleRule(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const r = ruleData.find((x) => x.id === id);
        r.status = r.status === "启用" ? "停用" : "启用";
        renderPage();
        toast(`规则已${r.status}`);
      }
      function syncHolidayCalendar() {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色无权同步节假日日历");
        holidayCalendar.syncedAt = "2026-08-12 09:30";
        holidayCalendar.status = "同步成功";
        holidayCalendar.version = "2026.02";
        renderPage();
        toast("已同步 2026 年法定节假日日历并完成规则重算");
      }
      function contactPositionReferences(position) {
        const people = contacts.filter(
          (person) =>
            contactIsActive(person) &&
            person.positionSource === "standard" &&
            person.positionId === position.id,
        );
        const kpis = campaigns.filter(
          (campaign) =>
            campaign.category === "关键人覆盖 KPI" &&
            ["待开始", "执行中"].includes(campaign.status) &&
            campaign.positionSource === "标准岗位" &&
            (campaign.targetPositionId === position.id ||
              (!campaign.targetPositionId &&
                campaign.targetPosition === position.name)),
        );
        return { people, kpis };
      }

      function openContactPositionForm(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const position = contactPositionCatalog.find((item) => item.id === id);
        const [selectedType, selectedId] = selectedCustomerOrgNode.split(":");
        const contextDepartment =
          position
            ? customerDepartments.find(
                (item) => item.id === position.departmentId,
              )
            : selectedType === "department"
              ? customerDepartments.find(
                  (item) => String(item.id) === selectedId,
                )
              : null;
        const contextCompany =
          position?.company ||
          contextDepartment?.company ||
          (selectedType === "company"
            ? customers.find((item) => String(item.id) === selectedId)?.name
            : "");
        const selectedCompany = customers.find(
          (item) => item.name === contextCompany,
        );
        const industries = [...new Set(customers.map((item) => item.industry))];
        openModal(
          `<div class="modal-head"><div class="modal-title">${position ? "编辑" : "新增"}标准岗位</div><button class="icon-btn close" data-close>×</button></div><form id="contactPositionForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">行业 *</label><select class="input" id="contactPositionIndustry" ${position ? "disabled" : ""}><option value="">请选择行业</option>${industries.map((item) => `<option ${item === selectedCompany?.industry ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">集团 *</label><select class="input" id="contactPositionGroup" ${position ? "disabled" : ""}><option value="">请先选择行业</option></select></div><div class="form-group"><label class="form-label">客户公司 *</label><select class="input" id="contactPositionCompany" ${position ? "disabled" : ""}><option value="">请先选择集团</option></select></div><div class="form-group"><label class="form-label">客户部门 *</label><select class="input" id="contactPositionDepartment" ${position ? "disabled" : ""}><option value="">请先选择客户公司</option></select></div><div class="form-group"><label class="form-label">岗位编码</label><input class="input" value="${position?.code || "保存后自动生成"}" disabled><div class="list-sub">POS + 8 位公司级流水，系统生成且不可修改</div></div><div class="form-group"><label class="form-label">岗位名称 *</label><input class="input" id="contactPositionName" minlength="2" maxlength="100" value="${position?.name || ""}" required></div><div class="form-group"><label class="form-label">排序 *</label><input class="input" id="contactPositionSort" type="number" min="1" max="9999" value="${position?.sort || 100}" required></div><div class="form-group full"><label class="form-label">岗位别名</label><input class="input" id="contactPositionAliases" value="${position?.aliases.join("、") || ""}" placeholder="使用顿号或逗号分隔，最多 20 项"><div class="list-sub">每项 1-50 字，仅用于搜索提示</div></div></div><div class="role-note">标准岗位必须属于唯一客户部门；岗位不能直接挂在公司或集团下，也不能跨部门复用。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`,
        );
        const refreshPositionCascade = (source = "initial") => {
          const industry = $("#contactPositionIndustry").value;
          const groups = [...new Set(
            customers
              .filter((item) => item.industry === industry)
              .map((item) => item.group),
          )];
          const desiredGroup =
            source === "industry"
              ? ""
              : $("#contactPositionGroup").value ||
                position?.group ||
                selectedCompany?.group ||
                "";
          $("#contactPositionGroup").innerHTML =
            '<option value="">请选择集团</option>' +
            groups
              .map(
                (item) =>
                  `<option ${item === desiredGroup ? "selected" : ""}>${item}</option>`,
              )
              .join("");
          const companies = customers.filter(
            (item) =>
              !item.archived &&
              item.industry === industry &&
              item.group === $("#contactPositionGroup").value,
          );
          const desiredCompany =
            ["industry", "group"].includes(source)
              ? ""
              : $("#contactPositionCompany").value || contextCompany;
          $("#contactPositionCompany").innerHTML =
            '<option value="">请选择客户公司</option>' +
            companies
              .map(
                (item) =>
                  `<option ${item.name === desiredCompany ? "selected" : ""}>${item.name}</option>`,
              )
              .join("");
          const departments = customerDepartmentsForCompany(
            $("#contactPositionCompany").value,
          );
          const desiredDepartment =
            ["industry", "group", "company"].includes(source)
              ? ""
              : $("#contactPositionDepartment").value ||
                String(contextDepartment?.id || "");
          $("#contactPositionDepartment").innerHTML =
            '<option value="">请选择客户部门</option>' +
            departments
              .map(
                (item) =>
                  `<option value="${item.id}" ${String(item.id) === desiredDepartment ? "selected" : ""}>${customerDepartmentPath(item)}</option>`,
              )
              .join("");
          $("#contactPositionGroup").disabled = Boolean(position) || !industry;
          $("#contactPositionCompany").disabled =
            Boolean(position) || !$("#contactPositionGroup").value;
          $("#contactPositionDepartment").disabled =
            Boolean(position) || !$("#contactPositionCompany").value;
        };
        $("#contactPositionIndustry").onchange = () =>
          refreshPositionCascade("industry");
        $("#contactPositionGroup").onchange = () =>
          refreshPositionCascade("group");
        $("#contactPositionCompany").onchange = () =>
          refreshPositionCascade("company");
        refreshPositionCascade();

        $("#contactPositionForm").onsubmit = (event) => {
          event.preventDefault();
          const companyName = $("#contactPositionCompany").value;
          const company = customers.find((item) => item.name === companyName);
          const department = customerDepartments.find(
            (item) =>
              String(item.id) === $("#contactPositionDepartment").value &&
              item.company === companyName &&
              !item.archived,
          );
          if (!company || !department)
            return toast("请按行业、集团、客户公司、客户部门逐级选择");
          const name = $("#contactPositionName").value.trim();
          const aliases = [
            ...new Set(
              $("#contactPositionAliases")
                .value.split(/[、,，]/)
                .map((item) => item.trim())
                .filter(Boolean),
            ),
          ];
          if (name.length < 2 || name.length > 100)
            return toast("岗位名称须为 2-100 字");
          if (aliases.length > 20 || aliases.some((item) => item.length > 50))
            return toast("岗位别名最多 20 项，每项不超过 50 字");
          if (
            contactPositionCatalog.some(
              (item) =>
                item.id !== position?.id &&
                item.departmentId === department.id &&
                item.name.toLowerCase() === name.toLowerCase(),
            )
          )
            return toast("该客户部门下已存在同名岗位");
          if (position) {
            Object.assign(position, {
              group: company.group,
              company: company.name,
              departmentId: department.id,
              name,
              aliases,
              sort: Number($("#contactPositionSort").value),
              updatedAt: recordCreatedAt(),
            });
            contacts
              .filter((item) => item.positionId === position.id)
              .forEach((item) => {
                item.positionName = name;
                item.title = name;
              });
          } else {
            const sequence =
              Math.max(
                0,
                ...contactPositionCatalog.map(
                  (item) => Number(String(item.code).match(/(\d+)$/)?.[1]) || 0,
                ),
              ) + 1;
            contactPositionCatalog.push({
              id: `POS-${Date.now()}`,
              group: company.group,
              company: company.name,
              departmentId: department.id,
              code: `POS${String(sequence).padStart(8, "0")}`,
              name,
              aliases,
              sort: Number($("#contactPositionSort").value),
              status: "正常",
              updatedAt: recordCreatedAt(),
            });
          }
          closeOverlay();
          renderPage();
          toast(`标准岗位“${name}”已保存`);
        };
      }
      function toggleContactPosition(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const position = contactPositionCatalog.find((item) => item.id === id);
        if (!position) return;
        if (position.status === "已停用") {
          position.status = "正常";
          position.updatedAt = recordCreatedAt();
          renderPage();
          return toast(`标准岗位“${position.name}”已恢复`);
        }
        const references = contactPositionReferences(position);
        if (references.people.length || references.kpis.length) {
          openModal(
            `<div class="modal-head"><div class="modal-title">无法停用标准岗位</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note" style="border-color:#fecaca;background:#fff7f7"><strong>${position.group} / ${position.name}</strong> 仍有有效引用，不能通过替代岗位批量改写。</div><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${metric("当前关键人任职", references.people.length, "须逐人调岗审批", references.people.length ? "red" : "")}${metric("进行中覆盖 KPI", references.kpis.length, "须等待或结束专项", references.kpis.length ? "red" : "")}</div><div class="section-title">阻断明细</div>${references.people.map((person) => `<div class="list-row"><div class="avatar">${person.name[0]}</div><div class="list-main"><div class="list-title">${person.name}</div><div class="list-sub">${person.company} · ${person.department}</div></div><span class="tag red">任职引用</span></div>`).join("")}${references.kpis.map((campaign) => `<div class="list-row"><div class="avatar">KPI</div><div class="list-main"><div class="list-title">${campaign.code} · ${campaign.name}</div><div class="list-sub">${campaign.startDate} 至 ${campaign.endDate}</div></div><span class="tag red">${campaign.status}</span></div>`).join("")}</div><div class="modal-foot"><button class="btn btn-primary" data-close>知道了</button></div>`,
          );
          return;
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">确认停用标准岗位</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note">停用“${position.group} / ${position.name}”后不再进入新增关键人、调岗和覆盖 KPI 候选；历史引用保留。</div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-danger" id="confirmStopContactPosition">确认停用</button></div>`,
        );
        $("#confirmStopContactPosition").onclick = () => {
          position.status = "已停用";
          position.updatedAt = recordCreatedAt();
          closeOverlay();
          renderPage();
          toast(`标准岗位“${position.name}”已停用`);
        };
      }

      function openIndustryForm(index) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const industry = Number.isInteger(index) ? industries[index] : null;
        openModal(
          `<div class="modal-head"><div class="modal-title">${industry ? "编辑" : "新增"}行业</div><button class="icon-btn close" data-close>×</button></div><form id="industryForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">行业名称 *</label><input class="input" id="industryName" minlength="2" maxlength="50" value="${industry?.name || ""}" required placeholder="例如：电力"></div><div class="form-group"><label class="form-label">行业编码</label><input class="input" value="${industry ? industry.code : "保存后自动生成"}" disabled><div class="list-sub">${industry ? "系统自动生成，不可修改" : "IND + 6 位流水，不可人工填写"}</div></div><div class="form-group"><label class="form-label">排序 *</label><input class="input" id="industrySort" type="number" min="1" max="9999" value="${industry?.sort || 100}" required></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="industryRemark" maxlength="500">${industry?.remark || ""}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存行业</button></div></form>`,
        );
        $("#industryForm").onsubmit = (e) => {
          e.preventDefault();
          const name = $("#industryName").value.trim();
          const code = industry?.code || `IND${String(100001 + industries.filter((x) => x.enabled !== false).length).padStart(3, "0")}`;
          if (name.length < 2 || name.length > 50)
            return toast("行业名称须为 2-50 字");
          if (industries.some((x) => x !== industry && x.name.toLowerCase() === name.toLowerCase()))
            return toast("行业已存在");
          const data = {
            name,
            code,
            sort: Number($("#industrySort").value),
            remark: $("#industryRemark").value.trim(),
            updatedAt: recordCreatedAt(),
          };
          if (industry) Object.assign(industry, data);
          else industries.push({ ...data, enabled: true });
          closeOverlay();
          renderPage();
          toast(`行业“${name}”已保存`);
        };
      }
      function toggleIndustry(i) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const x = industries[i];
        if (!x) return;
        x.enabled = !x.enabled;
        x.updatedAt = recordCreatedAt();
        renderPage();
        toast(`行业“${x.name}”已${x.enabled ? "恢复" : "停用"}`);
      }

