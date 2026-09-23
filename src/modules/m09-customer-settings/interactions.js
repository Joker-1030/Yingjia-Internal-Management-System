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
          `<div class="modal-head"><div class="modal-title">编辑自动任务规则</div><button class="icon-btn close" data-close>×</button></div><form id="ruleForm"><div class="modal-body"><div class="section-title">触发来源</div><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>规则类型</label><select class="input" id="ruleType" disabled><option value="birthday" ${r?.type !== "holiday" ? "selected" : ""}>生日关怀</option><option value="holiday" ${r?.type === "holiday" ? "selected" : ""}>节假日关怀</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>规则名称</label><input class="input" id="ruleName" minlength="2" maxlength="100" value="${r?.name || ""}" required></div><div class="form-group full" id="ruleHolidayGroup"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>关联节假日 <span class="panel-sub">可多选</span></label><select class="input" id="ruleHolidaySelect"><option value="">从下拉中选择节假日添加…</option>${holidayCalendar.holidays.filter((holiday) => !selectedHolidayIds.has(holiday.id)).map((holiday) => `<option value="${holiday.id}">${holiday.name} · ${holiday.year} · ${holiday.startDate} 至 ${holiday.endDate}</option>`).join("")}</select><div id="ruleHolidayTags" style="margin-top:var(--space-2);display:flex;flex-wrap:wrap;gap:var(--space-2)"></div></div></div><div class="section-title">目标与时点</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>适用职级</label><div class="checkbox-grid">${["一级", "二级", "三级", "四级"].map((level) => `<label class="check-row"><input type="checkbox" data-rule-level value="${level}" ${selectedLevels.has(level) ? "checked" : ""}><span>${level}</span></label>`).join("")}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>提前生成（天）</label><input class="input" id="ruleLead" type="number" min="0" max="60" value="${r?.lead ?? 7}" required></div><div class="form-group"><div class="form-label">截止时间</div><div>${r.type === "birthday" ? "生日当天" : "法定假期最后一天"} 23:59:59</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>站内提醒节点 <span class="panel-sub">至少选择 1 项</span></label><div class="choice-grid" id="ruleReminderChoices"></div></div></div><div class="section-title">任务内容</div><div class="form-grid"><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>任务标题模板</label><input class="input" id="ruleTitle" minlength="2" maxlength="100" value="${r?.title || "【{{事件名称}}关怀】{{关键人姓名}}"}" required></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>执行要求</label><textarea class="input" id="ruleContent" minlength="5" maxlength="1000" required>${r?.content || "完成客户关怀并记录沟通结果。"}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存并启用</button></div></form>`,
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
                    ? `<span class="tag blue" style="display:inline-flex;align-items:center;gap:var(--space-1)">${holiday.name} · ${holiday.year} · ${holiday.startDate}<button type="button" class="link" data-rule-holiday-remove value="${holiday.id}" style="padding:0 var(--space-1)">×</button></span>`
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
            .map((day) => {
              const label = day === 0 ? "截止日" : `提前 ${day} 天`;
              const disabled = day > lead;
              return `<label class="choice-item" ${disabled ? 'style="background:var(--color-disabled);color:var(--color-text-disabled);border-color:var(--color-border);cursor:not-allowed" title="超过当前提前生成天数，不可选择"' : ""}><input type="checkbox" data-rule-reminder value="${day}" ${reminderSet.has(day) ? "checked" : ""} ${disabled ? "disabled" : ""}><span>${label}</span></label>`;
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

      function showBulkAssociationResult(title, successes, failures) {
        const successHtml = successes.length
          ? `<div class="role-note" style="border-color:var(--color-success-border);background:var(--color-success-soft)"><strong>成功 ${successes.length} 项</strong><div>${successes.map((item) => `<div>${item}</div>`).join("")}</div></div>`
          : "";
        const failureHtml = failures.length
          ? `<div class="role-note" style="border-color:var(--color-error-border);background:var(--color-error-soft)"><strong>失败 ${failures.length} 项</strong><div>${failures.map((item) => `<div>${item}</div>`).join("")}</div></div>`
          : "";
        openModal(`<div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body">${successHtml}${failureHtml}</div><div class="modal-foot"><button class="btn btn-primary" data-close>关闭</button></div>`);
      }

      function legacyDepartmentRelation(department) {
        const atom = customerDepartmentAtoms.find(
          (item) =>
            item.id === department?.departmentAtomId ||
            item.code === department?.code ||
            item.name === department?.name,
        );
        const relation = customerDepartmentRelations.find(
          (item) =>
            item.company === department?.company &&
            item.departmentAtomId === atom?.id,
        );
        return { atom, relation };
      }

      function refreshDepartmentRelationPaths(companyName) {
        const relations = customerDepartmentRelations.filter(
          (item) => item.company === companyName,
        );
        const byId = new Map(relations.map((item) => [item.id, item]));
        const resolving = new Set();
        const pathFor = (relation) => {
          if (!relation) return "";
          if (resolving.has(relation.id))
            return departmentAtomForId(relation.departmentAtomId)?.name || "";
          resolving.add(relation.id);
          const atomName =
            departmentAtomForId(relation.departmentAtomId)?.name || "未命名部门";
          const parent = byId.get(relation.parentDepartmentRelationId);
          const path = parent ? `${pathFor(parent)} / ${atomName}` : atomName;
          resolving.delete(relation.id);
          return path;
        };
        relations.forEach((relation) => {
          const parent = byId.get(relation.parentDepartmentRelationId);
          relation.parent = parent
            ? departmentAtomForId(parent.departmentAtomId)?.name || "未命名部门"
            : "无";
          relation.path = pathFor(relation);
          const legacy = customerDepartments.find(
            (item) =>
              item.company === companyName &&
              legacyDepartmentRelation(item).relation?.id === relation.id,
          );
          if (legacy) {
            legacy.parent = relation.parent;
            legacy.sort = relation.sort;
            legacy.updatedAt = relation.updatedAt;
          }
        });
      }

      function departmentRelationDescendsFrom(candidateId, ancestorId, byId) {
        let current = byId.get(candidateId);
        const visited = new Set();
        while (current?.parentDepartmentRelationId && !visited.has(current.id)) {
          if (current.parentDepartmentRelationId === ancestorId) return true;
          visited.add(current.id);
          current = byId.get(current.parentDepartmentRelationId);
        }
        return false;
      }

      function openCustomerDepartmentRelationForm(departmentId, companyName) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const department = customerDepartments.find(
          (item) => item.id === departmentId && item.company === companyName,
        );
        const { atom, relation } = legacyDepartmentRelation(department);
        if (!department || !atom || !relation)
          return toast("部门关系不存在或已失效");
        const companyRelations = customerDepartmentRelations.filter(
          (item) => item.company === companyName && item.status === "正常",
        );
        const byId = new Map(companyRelations.map((item) => [item.id, item]));
        const parentOptions = companyRelations
          .filter(
            (item) =>
              item.id !== relation.id &&
              !departmentRelationDescendsFrom(item.id, relation.id, byId),
          )
          .sort((a, b) => a.sort - b.sort || a.path.localeCompare(b.path, "zh-CN"));
        openModal(`<div class="modal-head"><div class="modal-title">调整部门层级</div><button class="icon-btn close" data-close>×</button></div><form id="customerDepartmentRelationForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">部门名称</label><div>${atom.name}</div></div><div class="form-group"><label class="form-label">客户公司</label><div>${companyName}</div></div><div class="form-group"><label class="form-label">上级部门</label><select class="input" id="customerDepartmentRelationParent"><option value="">公司直属</option>${parentOptions.map((item) => `<option value="${item.id}" ${item.id === relation.parentDepartmentRelationId ? "selected" : ""}>${item.path}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>排序</label><input class="input" id="customerDepartmentRelationSort" type="number" min="1" max="9999" value="${relation.sort || 100}" required></div></div><div class="list-sub">部门名称、编码、说明和状态请在“部门”页签维护；保存后路径按上级部门自动更新。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存关系</button></div></form>`);
        $("#customerDepartmentRelationForm").onsubmit = (event) => {
          event.preventDefault();
          const parentId = $("#customerDepartmentRelationParent").value;
          const sort = Number($("#customerDepartmentRelationSort").value);
          const parent = parentId ? byId.get(parentId) : null;
          if (!Number.isInteger(sort) || sort < 1 || sort > 9999)
            return toast("排序须为 1-9999 的整数");
          if (
            parentId &&
            (!parent ||
              parent.id === relation.id ||
              departmentRelationDescendsFrom(parent.id, relation.id, byId))
          )
            return toast("上级部门不能选择自身或下级部门");
          relation.parentDepartmentRelationId = parent?.id || "";
          relation.sort = sort;
          relation.updatedAt = recordCreatedAt();
          refreshDepartmentRelationPaths(companyName);
          selectedCustomerOrgInternalNode = `department:${department.id}`;
          closeOverlay();
          renderPage();
          toast(`部门“${atom.name}”层级已更新`);
        };
      }

      function openCustomerPositionRelationForm(positionId, companyName) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const position = contactPositionCatalog.find(
          (item) => item.id === positionId && item.company === companyName,
        );
        const legacyDepartment = customerDepartments.find(
          (item) => item.id === position?.departmentId && item.company === companyName,
        );
        const { atom: departmentAtom, relation: currentDepartmentRelation } =
          legacyDepartmentRelation(legacyDepartment);
        const positionAtom =
          positionAtomForId(position?.positionAtomId) ||
          customerPositionAtoms.find(
            (item) => item.name === position?.name || item.code === position?.code,
          );
        const positionRelation = customerPositionRelations.find(
          (item) =>
            item.positionAtomId === positionAtom?.id &&
            item.departmentAtomId === currentDepartmentRelation?.departmentAtomId,
        );
        if (!position || !positionAtom || !currentDepartmentRelation || !positionRelation)
          return toast("岗位关系不存在或已失效");
        const departmentOptions = customerDepartmentRelations
          .filter(
            (item) =>
              item.company === companyName &&
              item.status === "正常" &&
              item.id !== currentDepartmentRelation.id,
          )
          .sort((a, b) => a.sort - b.sort || a.path.localeCompare(b.path, "zh-CN"));
        openModal(`<div class="modal-head"><div class="modal-title">调整岗位所属部门</div><button class="icon-btn close" data-close>×</button></div><form id="customerPositionRelationForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">岗位名称</label><div>${positionAtom.name}</div></div><div class="form-group"><label class="form-label">岗位编码</label><div>${positionAtom.code}</div></div><div class="form-group"><label class="form-label">客户公司</label><div>${companyName}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>所属部门</label><select class="input" id="customerPositionRelationDepartment" required><option value="">请选择部门</option>${departmentOptions.map((item) => { const departmentAtom = departmentAtomForId(item.departmentAtomId); return `<option value="${item.id}">${departmentAtom?.name || item.path} · ${departmentAtom?.code || ""}</option>`; }).join("")}</select></div></div><div class="list-sub">岗位关系挂在部门原子下；岗位名称、编码、排序和状态请在“岗位”页签维护。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存关系</button></div></form>`);
        $("#customerPositionRelationForm").onsubmit = (event) => {
          event.preventDefault();
          const targetDepartmentRelation = customerDepartmentRelations.find(
            (item) => item.id === $("#customerPositionRelationDepartment").value,
          );
          if (!targetDepartmentRelation)
            return toast("请选择正常的所属部门");
          if (targetDepartmentRelation.id === currentDepartmentRelation.id)
            return toast("岗位所属部门未变化");
          const duplicate = customerPositionRelations.some(
            (item) =>
              item.id !== positionRelation.id &&
              item.positionAtomId === positionAtom.id &&
              item.departmentAtomId === targetDepartmentRelation.departmentAtomId,
          );
          if (duplicate) return toast("目标部门已存在该岗位关系");
          positionRelation.departmentAtomId = targetDepartmentRelation.departmentAtomId;
          const targetDepartment = customerDepartments.find(
            (item) =>
              item.company === companyName &&
              legacyDepartmentRelation(item).relation?.id === targetDepartmentRelation.id,
          );
          position.departmentId = targetDepartment?.id || position.departmentId;
          position.updatedAt = recordCreatedAt();
          contacts
            .filter(
              (person) =>
                person.positionId === position.id ||
                person.positionRelationId === positionRelation.id,
            )
            .forEach((person) => {
              person.department = targetDepartment?.name || person.department;
              person.departmentAtomId = targetDepartmentRelation.departmentAtomId;
              person.departmentRelationId = targetDepartmentRelation.id;
              person.positionRelationId = positionRelation.id;
            });
          selectedCustomerOrgInternalNode = `position:${position.id}`;
          closeOverlay();
          renderPage();
          toast(`岗位“${positionAtom.name}”所属部门已更新`);
        };
      }

      function openDepartmentAtomForm(id) {
        if (!hasOperationPermission("settings.edit")) return toast("当前角色仅可查看客户基础配置");
        const atom = customerDepartmentAtoms.find((item) => item.id === id);
        openModal(`<div class="modal-head"><div class="modal-title">${atom ? "编辑" : "新增"}部门原子</div><button class="icon-btn close" data-close>×</button></div><form id="departmentAtomForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>部门名称</label><input class="input" id="departmentAtomName" minlength="2" maxlength="100" value="${atom?.name || ""}" required></div><div class="form-group"><label class="form-label">部门说明</label><textarea class="input" id="departmentAtomDuty" maxlength="500">${atom?.duty || ""}</textarea></div><div class="list-sub">部门名称全局唯一；不提供部门别称。保存后可在“关联到客户公司”中一次关联多个公司。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`);
        $("#departmentAtomForm").onsubmit = (event) => {
          event.preventDefault();
          const name = $("#departmentAtomName").value.trim();
          if (name.length < 2 || name.length > 100) return toast("部门名称须为 2-100 字");
          if (customerDepartmentAtoms.some((item) => item !== atom && item.name.toLowerCase() === name.toLowerCase())) return toast("部门名称已存在");
          if (atom) Object.assign(atom, { name, duty: $("#departmentAtomDuty").value.trim(), updatedAt: recordCreatedAt() });
          else {
            const next = { id: `DEPT-ATOM-${String(customerDepartmentAtoms.length + 1).padStart(4, "0")}`, name, code: `CDEPT${String(customerDepartmentAtoms.length + 1).padStart(8, "0")}`, duty: $("#departmentAtomDuty").value.trim(), status: "正常", sort: 100, updatedAt: recordCreatedAt() };
            customerDepartmentAtoms.push(next);
          }
          closeOverlay();
          renderPage();
          toast(`部门“${name}”已保存`);
        };
      }

      function openDepartmentAssociationDetails(atomId) {
        const atom = customerDepartmentAtoms.find((item) => item.id === atomId);
        if (!atom) return toast("部门原子不存在");
        const canUnlink = hasOperationPermission("settings.edit");
        const relations = customerDepartmentRelations
          .filter((item) => item.departmentAtomId === atomId)
          .sort(
            (left, right) =>
              (left.group || "").localeCompare(right.group || "", "zh-CN") ||
              left.company.localeCompare(right.company, "zh-CN"),
          );
        const rows = relations
          .map(
            (relation) =>
              `<tr><td><strong>${relation.company}</strong><div class="list-sub">${relation.group || "未分组"}</div></td><td>${relation.path || atom.name}</td><td>${relation.parent && !["无", "—"].includes(relation.parent) ? relation.parent : "公司直属"}</td><td>${relation.sort}</td><td>${canUnlink ? `<button class="link association-remove" type="button" data-unlink-department-relation="${relation.id}">解除关联</button>` : "—"}</td></tr>`,
          )
          .join("");
        openModal(`<div class="modal-head"><div class="modal-title">“${atom.name}”的关联详情</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="table-wrap"><table><thead><tr><th>客户公司</th><th>关系路径</th><th>上级部门</th><th>排序</th><th>操作</th></tr></thead><tbody id="departmentAssociationDetailBody">${rows || '<tr><td colspan="5"><div class="empty">暂无关联客户公司</div></td></tr>'}</tbody></table></div></div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button></div>`);
        const body = $("#departmentAssociationDetailBody");
        if (!body || !canUnlink) return;
        body.onclick = (event) => {
          const button = event.target.closest("[data-unlink-department-relation]");
          if (!button) return;
          confirmDepartmentRelationUnlink(atomId, button.dataset.unlinkDepartmentRelation);
        };
      }

      function confirmDepartmentRelationUnlink(atomId, relationId) {
        if (!hasOperationPermission("settings.edit")) return toast("当前角色仅可查看客户基础配置");
        const atom = customerDepartmentAtoms.find((item) => item.id === atomId);
        const relation = customerDepartmentRelations.find(
          (item) => item.id === relationId && item.departmentAtomId === atomId,
        );
        if (!atom || !relation) return toast("部门关联关系不存在");
        openModal(`<div class="modal-head"><div class="modal-title">确认解除关联</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note">解除“${atom.name}”与“${relation.company}”的关联？</div></div><div class="modal-foot"><button class="btn" type="button" id="cancelDepartmentRelationUnlink">取消</button><button class="btn btn-danger" type="button" id="confirmDepartmentRelationUnlink">解除关联</button></div>`);
        $("#cancelDepartmentRelationUnlink").onclick = () =>
          openDepartmentAssociationDetails(atomId);
        $("#confirmDepartmentRelationUnlink").onclick = () => {
          const current = customerDepartmentRelations.find(
            (item) => item.id === relationId && item.departmentAtomId === atomId,
          );
          if (!current) {
            openDepartmentAssociationDetails(atomId);
            return toast("部门关联关系不存在");
          }
          const people = contacts.filter(
            (person) =>
              contactIsActive(person) &&
              person.company === current.company &&
              (person.departmentAtomId === atomId || person.department === atom.name),
          );
          if (people.length) {
            openDepartmentAssociationDetails(atomId);
            return toast(`${current.company}：该部门仍有 ${people.length} 名关键人，不能解除关联`);
          }
          const childRelations = customerDepartmentRelations.filter(
            (item) => item.parentDepartmentRelationId === current.id,
          );
          if (childRelations.length) {
            openDepartmentAssociationDetails(atomId);
            return toast(`${current.company}：仍有 ${childRelations.length} 个下级部门，不能解除关联`);
          }
          const legacyDepartmentIds = new Set(
            customerDepartments
              .filter(
                (item) => item.company === current.company && item.name === atom.name,
              )
              .map((item) => item.id),
          );
          const relationIndex = customerDepartmentRelations.indexOf(current);
          if (relationIndex >= 0) customerDepartmentRelations.splice(relationIndex, 1);
          for (let index = customerDepartments.length - 1; index >= 0; index -= 1) {
            if (legacyDepartmentIds.has(customerDepartments[index].id))
              customerDepartments.splice(index, 1);
          }
          for (let index = contactPositionCatalog.length - 1; index >= 0; index -= 1) {
            if (legacyDepartmentIds.has(contactPositionCatalog[index].departmentId))
              contactPositionCatalog.splice(index, 1);
          }
          renderPage();
          openDepartmentAssociationDetails(atomId);
          toast(`${current.company}：已解除关联`);
        };
      }

      function openDepartmentCompanyAssociation(atomId) {
        if (!hasOperationPermission("settings.edit")) return toast("当前角色仅可查看客户基础配置");
        const atom = customerDepartmentAtoms.find((item) => item.id === atomId);
        if (!atom) return toast("部门原子不存在");
        const companies = customers.filter((item) => !item.archived);
        const existing = new Map(customerDepartmentRelations.filter((item) => item.departmentAtomId === atomId).map((item) => [item.company, item]));
        const selectedCompanies = new Set();
        const drafts = new Map();
        const captureDrafts = () => {
          document.querySelectorAll("[data-assoc-company-row]").forEach((row) => {
            const company = companies.find((item) => String(item.id) === row.dataset.assocCompanyRow);
            if (!company) return;
            const parentAtomId = row.querySelector("[data-assoc-parent]")?.value || "";
            const sort = row.querySelector("[data-assoc-sort]")?.value || "";
            drafts.set(company.name, { parentAtomId, sort });
          });
        };
        const renderCompanyOptions = () => {
          const input = document.querySelector("#departmentCompanySearch");
          const optionsBox = document.querySelector("#departmentCompanyOptions");
          if (!input || !optionsBox) return;
          const search = input.value.trim().toLowerCase();
          const options = companies.filter(
            (company) =>
              !existing.has(company.name) &&
              !selectedCompanies.has(company.name) &&
              `${company.name}${company.group || ""}`.toLowerCase().includes(search),
          );
          optionsBox.innerHTML = options.length
            ? options.map((company) => `<button class="association-option" type="button" data-assoc-company-option="${company.id}"><strong>${company.name}</strong><span>${company.group || "未分组"}</span></button>`).join("")
            : '<div class="association-option-empty">未找到符合条件的公司</div>';
          optionsBox.hidden = false;
        };
        const renderPendingCompanies = () => {
          captureDrafts();
          const container = document.querySelector("#departmentCompanyPendingList");
          if (!container) return;
          const pending = companies.filter((company) => selectedCompanies.has(company.name));
          container.innerHTML = pending.length
            ? pending
                .map((company) => {
                  const companyRelations = customerDepartmentRelations.filter((item) => item.company === company.name);
                  const parents = companyRelations
                    .filter((item) => item.departmentAtomId !== atomId)
                    .sort((a, b) => a.sort - b.sort || a.path.localeCompare(b.path, "zh-CN"));
                  const draft = drafts.get(company.name) || { parentAtomId: "", sort: 100 };
                  return `<article class="association-pending-card" data-assoc-company-row="${company.id}"><div class="association-pending-head"><div><strong>${company.name}</strong><div class="list-sub">${company.group || "未分组"}</div></div><button class="link association-remove" type="button" data-remove-assoc-company="${company.id}">取消选择</button></div><div class="association-pending-fields"><label class="form-group"><span class="form-label">上级部门</span><select class="input" data-assoc-parent><option value="">公司直属</option>${parents.map((parent) => `<option value="${parent.departmentAtomId}" ${draft.parentAtomId === parent.departmentAtomId ? "selected" : ""}>${parent.path}</option>`).join("")}</select></label><label class="form-group"><span class="form-label">排序</span><input class="input" type="number" min="1" max="9999" data-assoc-sort value="${draft.sort || 100}"></label></div></article>`;
                })
                .join("")
            : '<div class="association-empty"><strong>暂未选择公司</strong></div>';
          renderCompanyOptions();
        };
        openModal(`<div class="modal-head"><div class="modal-title">关联“${atom.name}”到客户公司</div><button class="icon-btn close" data-close>×</button></div><form id="departmentCompanyAssociationForm"><div class="modal-body association-modal-body"><div class="association-layout"><section class="association-picker"><div class="association-section-head"><div class="section-title">可选客户公司</div></div><div class="association-picker-fields"><div class="form-group association-combobox"><label class="form-label" for="departmentCompanySearch">搜索公司</label><input class="input" id="departmentCompanySearch" type="search" autocomplete="off" placeholder="输入公司名称或集团名称"><div class="association-options" id="departmentCompanyOptions" role="listbox" hidden></div></div></div></section><section class="association-pending"><div class="association-section-head"><div class="section-title">本次待配置公司</div></div><div class="association-pending-list" id="departmentCompanyPendingList"></div></section></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存关联</button></div></form>`);
        $("#modalLayer .modal")?.classList.add("association-modal");
        renderPendingCompanies();
        $("#departmentCompanySearch").oninput = renderCompanyOptions;
        $("#departmentCompanySearch").onfocus = renderCompanyOptions;
        $("#departmentCompanyOptions").onclick = (event) => {
          const option = event.target.closest("[data-assoc-company-option]");
          if (!option) return;
          const companyId = option.dataset.assocCompanyOption;
          const company = companies.find((item) => String(item.id) === String(companyId));
          if (!company) return toast("请选择要添加的客户公司");
          captureDrafts();
          selectedCompanies.add(company.name);
          drafts.set(company.name, { parentAtomId: "", sort: 100 });
          $("#departmentCompanySearch").value = "";
          renderPendingCompanies();
        };
        $("#departmentCompanyPendingList").onclick = (event) => {
          const button = event.target.closest("[data-remove-assoc-company]");
          if (!button) return;
          captureDrafts();
          const company = companies.find((item) => String(item.id) === button.dataset.removeAssocCompany);
          if (!company) return;
          selectedCompanies.delete(company.name);
          drafts.delete(company.name);
          renderPendingCompanies();
        };
        $("#departmentCompanyAssociationForm").onsubmit = (event) => {
          event.preventDefault();
          captureDrafts();
          const successes = [];
          const failures = [];
          selectedCompanies.forEach((companyName) => {
            const company = customers.find((item) => item.name === companyName);
            const draft = drafts.get(companyName) || {};
            const parentAtomId = draft.parentAtomId || "";
            const sort = Number(draft.sort || 0);
            const relation = customerDepartmentRelations.find(
              (item) =>
                item.departmentAtomId === atomId && item.company === company?.name,
            );
            const parent = customerDepartmentRelations.find((item) => item.company === company?.name && item.departmentAtomId === parentAtomId);
            if (!company) return failures.push(`${companyName}：客户公司不存在`);
            if (!Number.isInteger(sort) || sort < 1) return failures.push(`${companyName}：排序须为正整数`);
            if (parentAtomId && !parent) return failures.push(`${companyName}：上级部门不属于当前公司`);
            if (relation) return failures.push(`${company.name}：已存在`);
            const nextRelationNumber = customerDepartmentRelations.reduce((max, item) => Math.max(max, Number(String(item.id).replace("DEPT-REL-", "")) || 0), 0) + 1;
            const newRelation = { id: `DEPT-REL-${String(nextRelationNumber).padStart(4, "0")}`, departmentAtomId: atom.id, company: company.name, group: company.group, parentDepartmentRelationId: parent?.id || "", parent: parent?.path?.split(" / ").pop() || "无", sort, path: parent ? `${parent.path} / ${atom.name}` : atom.name, status: atom.status, updatedAt: recordCreatedAt() };
            customerDepartmentRelations.push(newRelation);
            customerDepartments.push({ id: 3000 + customerDepartments.length, group: company.group, company: company.name, name: atom.name, parent: newRelation.parent, duty: atom.duty, code: atom.code, sort, status: atom.status, updatedAt: newRelation.updatedAt });
            successes.push(`${company.name}：已新增关系`);
          });
          closeOverlay();
          renderPage();
          showBulkAssociationResult("部门关联结果", successes, failures);
        };
      }

      function openPositionAtomForm(id) {
        if (!hasOperationPermission("settings.edit")) return toast("当前角色仅可查看客户基础配置");
        const atom = customerPositionAtoms.find((item) => item.id === id);
        openModal(`<div class="modal-head"><div class="modal-title">${atom ? "编辑" : "新增"}岗位原子</div><button class="icon-btn close" data-close>×</button></div><form id="positionAtomForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>岗位名称</label><input class="input" id="positionAtomName" minlength="2" maxlength="100" value="${atom?.name || ""}" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>全局排序</label><input class="input" id="positionAtomSort" type="number" min="1" max="9999" value="${atom?.sort || 100}" required></div><div class="list-sub">岗位名称全局唯一；不提供岗位别称。岗位名称、编码、排序和停用状态在所有部门关系中共用。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`);
        $("#positionAtomForm").onsubmit = (event) => {
          event.preventDefault();
          const name = $("#positionAtomName").value.trim();
          const sort = Number($("#positionAtomSort").value);
          if (name.length < 2 || name.length > 100) return toast("岗位名称须为 2-100 字");
          if (!Number.isInteger(sort) || sort < 1) return toast("排序须为正整数");
          if (customerPositionAtoms.some((item) => item !== atom && item.name.toLowerCase() === name.toLowerCase())) return toast("岗位名称已存在");
          if (atom) {
            Object.assign(atom, { name, sort, updatedAt: recordCreatedAt() });
            contactPositionCatalog.filter((item) => item.positionAtomId === atom.id).forEach((item) => { item.name = name; item.sort = sort; item.updatedAt = atom.updatedAt; });
            contacts.filter((item) => item.positionAtomId === atom.id).forEach((item) => { item.positionName = name; item.title = name; });
          }
          else customerPositionAtoms.push({ id: `POS-ATOM-${String(customerPositionAtoms.length + 1).padStart(4, "0")}`, name, code: `POS${String(customerPositionAtoms.length + 1).padStart(8, "0")}`, sort, status: "正常", updatedAt: recordCreatedAt() });
          closeOverlay();
          renderPage();
          toast(`岗位“${name}”已保存`);
        };
      }

      function toggleDepartmentAtom(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const atom = customerDepartmentAtoms.find((item) => item.id === id);
        if (!atom) return toast("部门原子不存在");
        const relations = customerDepartmentRelations.filter(
          (item) => item.departmentAtomId === atom.id,
        );
        if (atom.status === "已停用") {
          atom.status = "正常";
          atom.updatedAt = recordCreatedAt();
          relations.forEach((item) => {
            item.status = "正常";
          });
          customerDepartments
            .filter((item) => legacyDepartmentRelation(item).atom?.id === atom.id)
            .forEach((item) => {
              item.status = "正常";
              item.archived = false;
              item.updatedAt = atom.updatedAt;
            });
          renderPage();
          return toast(`部门“${atom.name}”已恢复`);
        }
        const people = contacts.filter(
          (person) => contactIsActive(person) && person.departmentAtomId === atom.id,
        );
        const kpis = campaigns.filter(
          (campaign) =>
            campaign.category === "关键人覆盖 KPI" &&
            ["待开始", "进行中", "执行中"].includes(campaign.status) &&
            campaign.targetDepartmentId === atom.id,
        );
        if (people.length || kpis.length) {
          return openModal(
            `<div class="modal-head"><div class="modal-title">无法停用部门</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note" style="border-color:var(--color-error-border);background:var(--color-error-soft)">“${atom.name}”仍存在有效关键人任职或进行中覆盖 KPI 引用，不能停用。</div><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${metric("当前关键人任职", people.length, "须逐人完成调岗", people.length ? "red" : "")}${metric("进行中覆盖 KPI", kpis.length, "须等待或结束专项", kpis.length ? "red" : "")}</div></div><div class="modal-foot"><button class="btn btn-primary" data-close>知道了</button></div>`
          );
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">确认停用部门</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note">停用“${atom.name}”后不再进入新增关键人、调岗和覆盖 KPI 候选；历史引用保留。</div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-danger" id="confirmStopDepartmentAtom">确认停用</button></div>`,
        );
        $("#confirmStopDepartmentAtom").onclick = () => {
          atom.status = "已停用";
          atom.updatedAt = recordCreatedAt();
          relations.forEach((item) => {
            item.status = "已停用";
          });
          customerDepartments
            .filter((item) => legacyDepartmentRelation(item).atom?.id === atom.id)
            .forEach((item) => {
              item.status = "已停用";
              item.archived = true;
              item.updatedAt = atom.updatedAt;
            });
          closeOverlay();
          renderPage();
          toast(`部门“${atom.name}”已停用`);
        };
      }

      function togglePositionAtom(id) {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色仅可查看客户基础配置");
        const atom = customerPositionAtoms.find((item) => item.id === id);
        if (!atom) return toast("岗位原子不存在");
        const relations = customerPositionRelations.filter(
          (item) => item.positionAtomId === atom.id,
        );
        const legacyPositions = contactPositionCatalog.filter(
          (item) => item.positionAtomId === atom.id,
        );
        if (atom.status === "已停用") {
          atom.status = "正常";
          atom.updatedAt = recordCreatedAt();
          relations.forEach((item) => {
            item.status = "正常";
          });
          legacyPositions.forEach((item) => {
            item.status = "正常";
            item.updatedAt = atom.updatedAt;
          });
          renderPage();
          return toast(`岗位“${atom.name}”已恢复`);
        }
        const people = contacts.filter(
          (person) => contactIsActive(person) && person.positionAtomId === atom.id,
        );
        const kpis = campaigns.filter(
          (campaign) =>
            campaign.category === "关键人覆盖 KPI" &&
            ["待开始", "进行中", "执行中"].includes(campaign.status) &&
            campaign.targetPositionId === atom.id,
        );
        if (people.length || kpis.length) {
          return openModal(
            `<div class="modal-head"><div class="modal-title">无法停用岗位</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note" style="border-color:var(--color-error-border);background:var(--color-error-soft)">“${atom.name}”仍存在有效关键人任职或进行中覆盖 KPI 引用，不能停用。</div><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${metric("当前关键人任职", people.length, "须逐人完成调岗", people.length ? "red" : "")}${metric("进行中覆盖 KPI", kpis.length, "须等待或结束专项", kpis.length ? "red" : "")}</div></div><div class="modal-foot"><button class="btn btn-primary" data-close>知道了</button></div>`,
          );
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">确认停用岗位</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note">停用“${atom.name}”后不再进入新增关键人、调岗和覆盖 KPI 候选；历史引用保留。</div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-danger" id="confirmStopPositionAtom">确认停用</button></div>`,
        );
        $("#confirmStopPositionAtom").onclick = () => {
          atom.status = "已停用";
          atom.updatedAt = recordCreatedAt();
          relations.forEach((item) => {
            item.status = "已停用";
          });
          legacyPositions.forEach((item) => {
            item.status = "已停用";
            item.updatedAt = atom.updatedAt;
          });
          closeOverlay();
          renderPage();
          toast(`岗位“${atom.name}”已停用`);
        };
      }

      function openPositionAssociationDetails(atomId) {
        const atom = customerPositionAtoms.find((item) => item.id === atomId);
        if (!atom) return toast("岗位原子不存在");
        const canUnlink = hasOperationPermission("settings.edit");
        const relations = customerPositionRelations
          .filter((item) => item.positionAtomId === atomId)
          .map((relation) => ({
            relation,
            department: customerDepartmentAtoms.find(
              (item) => item.id === relation.departmentAtomId,
            ),
          }))
          .filter((item) => item.department)
          .sort((left, right) =>
            left.department.name.localeCompare(right.department.name, "zh-CN"),
          );
        const rows = relations
          .map(
            ({ relation, department }) =>
              `<tr><td><strong>${department.name}</strong></td><td>${department.code}</td><td>${department.duty || "—"}</td><td>${canUnlink ? `<button class="link association-remove" type="button" data-unlink-position-relation="${relation.id}">解除关联</button>` : "—"}</td></tr>`,
          )
          .join("");
        openModal(`<div class="modal-head"><div class="modal-title">“${atom.name}”的关联详情</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="table-wrap"><table><thead><tr><th>部门名称</th><th>部门编码</th><th>部门说明</th><th>操作</th></tr></thead><tbody id="positionAssociationDetailBody">${rows || '<tr><td colspan="4"><div class="empty">暂无关联部门</div></td></tr>'}</tbody></table></div></div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button></div>`);
        const body = $("#positionAssociationDetailBody");
        if (!body || !canUnlink) return;
        body.onclick = (event) => {
          const button = event.target.closest("[data-unlink-position-relation]");
          if (!button) return;
          confirmPositionRelationUnlink(atomId, button.dataset.unlinkPositionRelation);
        };
      }

      function confirmPositionRelationUnlink(atomId, relationId) {
        if (!hasOperationPermission("settings.edit")) return toast("当前角色仅可查看客户基础配置");
        const atom = customerPositionAtoms.find((item) => item.id === atomId);
        const relation = customerPositionRelations.find(
          (item) => item.id === relationId && item.positionAtomId === atomId,
        );
        const department = customerDepartmentAtoms.find(
          (item) => item.id === relation?.departmentAtomId,
        );
        if (!atom || !relation || !department) return toast("岗位关联关系不存在");
        openModal(`<div class="modal-head"><div class="modal-title">确认解除关联</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note">解除“${atom.name}”与“${department.name}”的关联？</div></div><div class="modal-foot"><button class="btn" type="button" id="cancelPositionRelationUnlink">取消</button><button class="btn btn-danger" type="button" id="confirmPositionRelationUnlink">解除关联</button></div>`);
        $("#cancelPositionRelationUnlink").onclick = () =>
          openPositionAssociationDetails(atomId);
        $("#confirmPositionRelationUnlink").onclick = () => {
          const current = customerPositionRelations.find(
            (item) => item.id === relationId && item.positionAtomId === atomId,
          );
          if (!current) {
            openPositionAssociationDetails(atomId);
            return toast("岗位关联关系不存在");
          }
          const people = contacts.filter(
            (person) =>
              contactIsActive(person) &&
              (person.positionRelationId === current.id ||
                (person.positionAtomId === atomId &&
                  person.departmentAtomId === current.departmentAtomId) ||
                (person.positionName === atom.name &&
                  person.department === department.name)),
          );
          if (people.length) {
            openPositionAssociationDetails(atomId);
            return toast(`${department.name}：该岗位仍有 ${people.length} 名关键人，不能解除关联`);
          }
          const legacyDepartmentIds = new Set(
            customerDepartmentRelations
              .filter(
                (departmentRelation) =>
                  departmentRelation.departmentAtomId === current.departmentAtomId,
              )
              .map((departmentRelation) =>
                customerDepartments.find(
                  (item) =>
                    item.company === departmentRelation.company &&
                    item.name === department.name,
                )?.id,
              )
              .filter(Boolean),
          );
          const relationIndex = customerPositionRelations.indexOf(current);
          if (relationIndex >= 0) customerPositionRelations.splice(relationIndex, 1);
          for (let index = contactPositionCatalog.length - 1; index >= 0; index -= 1) {
            const position = contactPositionCatalog[index];
            if (
              position.positionAtomId === atomId &&
              legacyDepartmentIds.has(position.departmentId)
            )
              contactPositionCatalog.splice(index, 1);
          }
          renderPage();
          openPositionAssociationDetails(atomId);
          toast(`${department.name}：已解除关联`);
        };
      }

      function openPositionDepartmentAssociation(atomId) {
        if (!hasOperationPermission("settings.edit")) return toast("当前角色仅可查看客户基础配置");
        const atom = customerPositionAtoms.find((item) => item.id === atomId);
        if (!atom) return toast("岗位原子不存在");
        const departments = customerDepartmentAtoms
          .filter((item) => item.status === "正常")
          .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
        const existing = new Set(customerPositionRelations.filter((item) => item.positionAtomId === atomId).map((item) => item.departmentAtomId));
        const selectedDepartments = new Set();
        const renderDepartmentOptions = () => {
          const input = document.querySelector("#positionDepartmentSearch");
          const optionsBox = document.querySelector("#positionDepartmentOptions");
          if (!input || !optionsBox) return;
          const search = input.value.trim().toLowerCase();
          const options = departments.filter(
            (department) =>
              !existing.has(department.id) &&
              !selectedDepartments.has(department.id) &&
              `${department.name}${department.code}${department.duty || ""}`
                .toLowerCase()
                .includes(search),
          );
          optionsBox.innerHTML = options.length
            ? options.map((department) => `<button class="association-option" type="button" data-assoc-department-option="${department.id}"><strong>${department.name}</strong><span>${department.code}${department.duty ? ` · ${department.duty}` : ""}</span></button>`).join("")
            : '<div class="association-option-empty">未找到符合条件的部门</div>';
          optionsBox.hidden = false;
        };
        const renderPendingDepartments = () => {
          const container = document.querySelector("#positionDepartmentPendingList");
          if (!container) return;
          const pending = departments.filter((department) => selectedDepartments.has(department.id));
          container.innerHTML = pending.length
            ? pending
                .map((department) => `<article class="association-pending-card" data-assoc-department-row="${department.id}"><div class="association-pending-head"><div><strong>${department.name}</strong><div class="list-sub">${department.code}</div></div><button class="link association-remove" type="button" data-remove-assoc-department="${department.id}">取消选择</button></div></article>`)
                .join("")
            : '<div class="association-empty"><strong>暂未选择部门</strong></div>';
          renderDepartmentOptions();
        };
        openModal(`<div class="modal-head"><div class="modal-title">关联“${atom.name}”到部门</div><button class="icon-btn close" data-close>×</button></div><form id="positionDepartmentAssociationForm"><div class="modal-body association-modal-body"><div class="association-layout"><section class="association-picker"><div class="association-section-head"><div class="section-title">可选部门</div></div><div class="association-picker-fields"><div class="form-group association-combobox"><label class="form-label" for="positionDepartmentSearch">搜索部门</label><input class="input" id="positionDepartmentSearch" type="search" autocomplete="off" placeholder="输入部门名称、编码或说明"><div class="association-options" id="positionDepartmentOptions" role="listbox" hidden></div></div></div></section><section class="association-pending"><div class="association-section-head"><div class="section-title">本次已选部门</div></div><div class="association-pending-list" id="positionDepartmentPendingList"></div></section></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存关联</button></div></form>`);
        $("#modalLayer .modal")?.classList.add("association-modal");
        renderPendingDepartments();
        $("#positionDepartmentSearch").oninput = renderDepartmentOptions;
        $("#positionDepartmentSearch").onfocus = renderDepartmentOptions;
        $("#positionDepartmentOptions").onclick = (event) => {
          const option = event.target.closest("[data-assoc-department-option]");
          if (!option) return;
          const departmentAtomId = option.dataset.assocDepartmentOption;
          if (!departments.some((department) => department.id === departmentAtomId)) return toast("请选择要添加的部门");
          selectedDepartments.add(departmentAtomId);
          $("#positionDepartmentSearch").value = "";
          renderPendingDepartments();
        };
        $("#positionDepartmentPendingList").onclick = (event) => {
          const button = event.target.closest("[data-remove-assoc-department]");
          if (!button) return;
          selectedDepartments.delete(button.dataset.removeAssocDepartment);
          renderPendingDepartments();
        };
        $("#positionDepartmentAssociationForm").onsubmit = (event) => {
          event.preventDefault();
          const successes = [];
          const failures = [];
          selectedDepartments.forEach((departmentAtomId) => {
            const department = customerDepartmentAtoms.find((item) => item.id === departmentAtomId);
            if (!department || department.status !== "正常") return failures.push(`${departmentAtomId}：部门不存在或已停用`);
            const current = customerPositionRelations.find((item) => item.positionAtomId === atomId && item.departmentAtomId === department.id);
            if (current) return failures.push(`${department.name}：已存在`);
            const nextRelationNumber = customerPositionRelations.reduce((max, item) => Math.max(max, Number(String(item.id).replace("POS-REL-", "")) || 0), 0) + 1;
            const newRelationId = `POS-REL-${String(nextRelationNumber).padStart(4, "0")}`;
            customerPositionRelations.push({ id: newRelationId, positionAtomId: atom.id, departmentAtomId: department.id, status: atom.status });
            customerDepartmentRelations
              .filter((relation) => relation.departmentAtomId === department.id && relation.status === "正常")
              .forEach((relation, index) => {
                const legacyDepartment = customerDepartments.find((item) => item.company === relation.company && item.name === department.name);
                if (!legacyDepartment || contactPositionCatalog.some((item) => item.positionAtomId === atom.id && item.departmentId === legacyDepartment.id)) return;
                contactPositionCatalog.push({ id: `${newRelationId}-${index + 1}`, group: relation.group, company: relation.company, departmentId: legacyDepartment.id, code: atom.code, name: atom.name, aliases: [], sort: atom.sort, status: atom.status, positionAtomId: atom.id, updatedAt: recordCreatedAt() });
              });
            successes.push(`${department.name}：已新增关系`);
          });
          closeOverlay();
          renderPage();
          showBulkAssociationResult("岗位关联结果", successes, failures);
        };
      }
      function syncHolidayCalendar() {
        if (!hasOperationPermission("settings.edit"))
          return toast("当前角色无权同步节假日日历");
        holidayCalendar.syncedAt = "2026-08-12 09:30";
        holidayCalendar.status = "同步成功";
        holidayCalendar.version = "2026.02";
        renderPage();
        toast("节假日日历已同步");
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
        const [selectedType, selectedId] = (
          selectedCustomerOrgInternalNode || selectedCustomerOrgNode
        ).split(":");
        const contextPosition =
          !position && selectedType === "position"
            ? contactPositionCatalog.find((item) => item.id === selectedId)
            : null;
        const contextDepartment =
          position
            ? customerDepartments.find(
                (item) => item.id === position.departmentId,
              )
            : contextPosition
              ? customerDepartments.find(
                  (item) => item.id === contextPosition.departmentId,
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
          `<div class="modal-head"><div class="modal-title">${position ? "编辑" : "新增"}标准岗位关系</div><button class="icon-btn close" data-close>×</button></div><form id="contactPositionForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>行业</label><select class="input" id="contactPositionIndustry" ${position ? "disabled" : ""}><option value="">请选择行业</option>${industries.map((item) => `<option ${item === selectedCompany?.industry ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>集团</label><select class="input" id="contactPositionGroup" ${position ? "disabled" : ""}><option value="">请先选择行业</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户公司</label><select class="input" id="contactPositionCompany" ${position ? "disabled" : ""}><option value="">请先选择集团</option></select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>客户部门</label><select class="input" id="contactPositionDepartment" ${position ? "disabled" : ""}><option value="">请先选择客户公司</option></select></div><div class="form-group"><label class="form-label">岗位编码</label><input class="input" value="${position?.code || "保存后自动生成"}" disabled></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>岗位名称</label><input class="input" id="contactPositionName" minlength="2" maxlength="100" value="${position?.name || ""}" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>全局排序</label><input class="input" id="contactPositionSort" type="number" min="1" max="9999" value="${position?.sort || 100}" required></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存</button></div></form>`,
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
          if (name.length < 2 || name.length > 100)
            return toast("岗位名称须为 2-100 字");
          if (
            contactPositionCatalog.some(
              (item) =>
                item.id !== position?.id &&
                item.departmentId === department.id &&
                item.name.toLowerCase() === name.toLowerCase(),
            )
          )
            return toast("该客户部门下已存在同名岗位");
          let savedPosition = position;
          if (position) {
            Object.assign(position, {
              group: company.group,
              company: company.name,
              departmentId: department.id,
              name,
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
            savedPosition = {
              id: `POS-${Date.now()}`,
              group: company.group,
              company: company.name,
              departmentId: department.id,
              code: `POS${String(sequence).padStart(8, "0")}`,
              name,
              sort: Number($("#contactPositionSort").value),
              status: "正常",
              updatedAt: recordCreatedAt(),
            };
            contactPositionCatalog.push(savedPosition);
          }
          selectedCustomerOrgInternalNode = `position:${savedPosition.id}`;
          expandedCustomerOrgNodes.add(`department:${department.id}`);
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
            `<div class="modal-head"><div class="modal-title">无法停用标准岗位</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note" style="border-color:var(--color-error-border);background:var(--color-error-soft)"><strong>${position.group} / ${position.name}</strong> 仍有有效引用，不能通过替代岗位批量改写。</div><div class="metrics" style="grid-template-columns:repeat(2,1fr)">${metric("当前关键人任职", references.people.length, "须逐人完成调岗", references.people.length ? "red" : "")}${metric("进行中覆盖 KPI", references.kpis.length, "须等待或结束专项", references.kpis.length ? "red" : "")}</div><div class="section-title">阻断明细</div>${references.people.map((person) => `<div class="list-row"><div class="avatar">${person.name[0]}</div><div class="list-main"><div class="list-title">${person.name}</div><div class="list-sub">${person.company} · ${person.department}</div></div><span class="tag red">任职引用</span></div>`).join("")}${references.kpis.map((campaign) => `<div class="list-row"><div class="avatar">KPI</div><div class="list-main"><div class="list-title">${campaign.code} · ${campaign.name}</div><div class="list-sub">${campaign.startDate} 至 ${campaign.endDate}</div></div><span class="tag red">${campaign.status}</span></div>`).join("")}</div><div class="modal-foot"><button class="btn btn-primary" data-close>知道了</button></div>`,
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
          `<div class="modal-head"><div class="modal-title">${industry ? "编辑" : "新增"}行业</div><button class="icon-btn close" data-close>×</button></div><form id="industryForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>行业名称</label><input class="input" id="industryName" minlength="2" maxlength="50" value="${industry?.name || ""}" required placeholder="例如：电力"></div><div class="form-group"><label class="form-label">行业编码</label><input class="input" value="${industry ? industry.code : "保存后自动生成"}" disabled></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>排序</label><input class="input" id="industrySort" type="number" min="1" max="9999" value="${industry?.sort || 100}" required></div><div class="form-group full"><label class="form-label">备注</label><textarea class="input" id="industryRemark" maxlength="500">${industry?.remark || ""}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存行业</button></div></form>`,
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
