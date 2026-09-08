      function salesNavigate(page) {
        currentPage = page;
        window.history.replaceState(null, "", `#${page}`);
        closeOverlay();
        renderPage();
      }

      function salesNow() {
        return `${DEMO_TODAY} 12:00`;
      }

      function setSalesFormError(id, message) {
        const node = $(`#err-${id}`);
        if (node) node.textContent = message || "";
      }

      function selectedValues(control) {
        return [...(control?.selectedOptions || [])].map((option) => option.value).filter(Boolean);
      }

      let salesSupportPickerOutsideClickBound = false;
      function setSalesSupportPickerOpen(picker, open) {
        const trigger = picker?.querySelector("[data-sales-support-trigger]");
        const menu = picker?.querySelector("[data-sales-support-menu]");
        const search = picker?.querySelector("[data-sales-support-search]");
        if (!trigger || !menu) return;
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        menu.classList.toggle("hidden", !open);
        if (open) {
          search?.focus();
          return;
        }
        if (search) search.value = "";
        picker
          .querySelectorAll("[data-sales-support-option]")
          .forEach((option) => (option.hidden = false));
      }

      function selectedSalesSupportPeople(picker) {
        return [...(picker?.querySelectorAll("input[data-sales-support-person]:checked") || [])]
          .map((input) => input.value)
          .filter(Boolean);
      }

      function renderSalesSupportSelected(picker) {
        const selectedContainer = picker?.querySelector("[data-sales-support-selected]");
        if (!selectedContainer) return;
        selectedContainer.innerHTML = selectedSalesSupportPeople(picker)
          .map(
            (name) =>
              `<span class="sales-support-selected-item"><span>${escapeHtml(name)}</span><button class="sales-support-selected-remove" type="button" data-sales-support-remove="${escapeHtml(name)}" title="移除${escapeHtml(name)}" aria-label="移除${escapeHtml(name)}">×</button></span>`,
          )
          .join("");
      }

      function bindSalesSupportPickers(root = document) {
        root.querySelectorAll("[data-sales-support-picker]").forEach((picker) => {
          const trigger = picker.querySelector("[data-sales-support-trigger]");
          const search = picker.querySelector("[data-sales-support-search]");
          const selectedContainer = picker.querySelector("[data-sales-support-selected]");
          trigger.onclick = () => {
            const open = trigger.getAttribute("aria-expanded") !== "true";
            document
              .querySelectorAll("[data-sales-support-picker]")
              .forEach((other) => setSalesSupportPickerOpen(other, false));
            setSalesSupportPickerOpen(picker, open);
          };
          search.oninput = () => {
            const keyword = search.value.trim().toLocaleLowerCase("zh-CN");
            picker.querySelectorAll("[data-sales-support-option]").forEach((option) => {
              option.hidden = !option.textContent
                .toLocaleLowerCase("zh-CN")
                .includes(keyword);
            });
          };
          search.onkeydown = (event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape") {
              event.preventDefault();
              setSalesSupportPickerOpen(picker, false);
              trigger.focus();
            }
          };
          picker.querySelectorAll("input[data-sales-support-person]").forEach((input) => {
            input.onchange = () => renderSalesSupportSelected(picker);
          });
          selectedContainer.onclick = (event) => {
            const removeButton = event.target.closest("[data-sales-support-remove]");
            if (!removeButton) return;
            const input = [...picker.querySelectorAll("input[data-sales-support-person]")].find(
              (candidate) => candidate.value === removeButton.dataset.salesSupportRemove,
            );
            if (input) input.checked = false;
            renderSalesSupportSelected(picker);
          };
        });
        if (!salesSupportPickerOutsideClickBound) {
          document.addEventListener("click", (event) => {
            document.querySelectorAll("[data-sales-support-picker]").forEach((picker) => {
              if (!picker.contains(event.target)) setSalesSupportPickerOpen(picker, false);
            });
          });
          salesSupportPickerOutsideClickBound = true;
        }
      }

      let salesKeyPickerOutsideClickBound = false;
      function setSalesKeyPickerOpen(picker, open) {
        const trigger = picker?.querySelector("[data-sales-key-trigger]");
        const menu = picker?.querySelector("[data-sales-key-menu]");
        const search = picker?.querySelector("[data-sales-key-search]");
        if (!trigger || !menu || trigger.disabled) return;
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        menu.classList.toggle("hidden", !open);
        if (open) {
          search?.focus();
          return;
        }
        if (search) search.value = "";
        picker
          .querySelectorAll("[data-sales-key-option]")
          .forEach((option) => (option.hidden = false));
      }

      function selectedSalesKeyPeople(picker) {
        return [
          ...(picker?.querySelectorAll("input[data-sales-key-person]:checked") || []),
        ]
          .map((input) => input.value)
          .filter(Boolean);
      }

      function renderSalesKeyPeopleSelected(picker) {
        const selectedContainer = picker?.querySelector(
          "[data-sales-key-selected]",
        );
        if (!selectedContainer) return;
        selectedContainer.innerHTML = selectedSalesKeyPeople(picker)
          .map(
            (name) =>
              `<span class="sales-support-selected-item"><span>${escapeHtml(name)}</span><button class="sales-support-selected-remove" type="button" data-sales-key-remove="${escapeHtml(name)}" title="移除${escapeHtml(name)}" aria-label="移除${escapeHtml(name)}">×</button></span>`,
          )
          .join("");
      }

      function bindSalesKeyPeoplePickers(root = document) {
        root.querySelectorAll("[data-sales-key-picker]").forEach((picker) => {
          const trigger = picker.querySelector("[data-sales-key-trigger]");
          const search = picker.querySelector("[data-sales-key-search]");
          const selectedContainer = picker.querySelector(
            "[data-sales-key-selected]",
          );
          trigger.onclick = () => {
            const open = trigger.getAttribute("aria-expanded") !== "true";
            document
              .querySelectorAll("[data-sales-key-picker]")
              .forEach((other) => setSalesKeyPickerOpen(other, false));
            setSalesKeyPickerOpen(picker, open);
          };
          search.oninput = () => {
            const keyword = search.value.trim().toLocaleLowerCase("zh-CN");
            picker.querySelectorAll("[data-sales-key-option]").forEach((option) => {
              option.hidden = !option.textContent
                .toLocaleLowerCase("zh-CN")
                .includes(keyword);
            });
          };
          search.onkeydown = (event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape") {
              event.preventDefault();
              setSalesKeyPickerOpen(picker, false);
              trigger.focus();
            }
          };
          picker.querySelectorAll("input[data-sales-key-person]").forEach((input) => {
            input.onchange = () => renderSalesKeyPeopleSelected(picker);
          });
          selectedContainer.onclick = (event) => {
            const removeButton = event.target.closest("[data-sales-key-remove]");
            if (!removeButton) return;
            const input = [
              ...picker.querySelectorAll("input[data-sales-key-person]"),
            ].find(
              (candidate) =>
                candidate.value === removeButton.dataset.salesKeyRemove,
            );
            if (input) input.checked = false;
            renderSalesKeyPeopleSelected(picker);
          };
          renderSalesKeyPeopleSelected(picker);
        });
        if (!salesKeyPickerOutsideClickBound) {
          document.addEventListener("click", (event) => {
            document.querySelectorAll("[data-sales-key-picker]").forEach((picker) => {
              if (!picker.contains(event.target))
                setSalesKeyPickerOpen(picker, false);
            });
          });
          salesKeyPickerOutsideClickBound = true;
        }
      }

      function bindSalesPeriod() {
        const control = $("#salesPeriodDraft");
        if (control) control.onchange = () => (salesPeriodDraft = control.value);
        const apply = $("#applySalesPeriod");
        if (apply)
          apply.onclick = () => {
            salesPeriodDraft = $("#salesPeriodDraft")?.value || "2026-09";
            salesPeriodApplied = salesPeriodDraft;
            renderPage();
          };
        const reset = $("#resetSalesPeriod");
        if (reset)
          reset.onclick = () => {
            salesPeriodDraft = "2026-09";
            salesPeriodApplied = "2026-09";
            renderPage();
          };
      }

      function bindSalesTargetMonth() {
        const control = $("#salesTargetMonth");
        if (!control) return;
        control.onchange = () => {
          salesTargetMonth = control.value;
          renderPage();
        };
      }

      function bindOpportunityFilters() {
        const apply = $("#applyOpportunityFilters");
        if (apply)
          apply.onclick = () => {
            appliedOpportunityFilters = {
              code: $("#opportunityCodeFilter")?.value.trim() || "",
              name: $("#opportunityNameFilter")?.value.trim() || "",
              type: $("#opportunityTypeFilter")?.value || "",
              stage: $("#opportunityStageFilter")?.value || "",
              customer: $("#opportunityCustomerFilter")?.value || "",
              region: $("#opportunityRegionFilter")?.value || "",
              owner: $("#opportunityOwnerFilter")?.value || "",
              priority: $("#opportunityPriorityFilter")?.value || "",
              expectedFrom: $("#opportunityExpectedFromFilter")?.value || "",
              expectedTo: $("#opportunityExpectedToFilter")?.value || "",
              createdFrom: $("#opportunityCreatedFromFilter")?.value || "",
              createdTo: $("#opportunityCreatedToFilter")?.value || "",
              overdue: $("#opportunityOverdueFilter")?.value || "",
            };
            const state = unifiedTablePaginationStates["m12-opportunities"];
            if (state) state.page = 1;
            renderPage();
          };
        const reset = $("#resetOpportunityFilters");
        if (reset)
          reset.onclick = () => {
            appliedOpportunityFilters = {
              code: "",
              name: "",
              type: "",
              stage: "",
              customer: "",
              region: "",
              owner: "",
              priority: "",
              expectedFrom: "",
              expectedTo: "",
              createdFrom: "",
              createdTo: "",
              overdue: "",
            };
            const state = unifiedTablePaginationStates["m12-opportunities"];
            if (state) state.page = 1;
            renderPage();
          };
      }

      function bindOpportunityCreateForm() {
        const form = $("#opportunityCreateForm");
        if (!form) return;
        const customer = $("#salesCustomer");
        const facts = $("#salesCustomerFacts");
        const owner = $("#salesOwner");
        const supportPicker = $("#salesSupportPeoplePicker");
        bindSalesSupportPickers(form);
        bindSalesKeyPeoplePickers(form);
        const replaceKeyPeoplePicker = (customerName = "") => {
          const currentPicker = $("#salesKeyPeoplePicker");
          if (!currentPicker) return;
          currentPicker.outerHTML = salesKeyPeoplePickerHtml(
            "salesKeyPeoplePicker",
            customerName,
          );
          bindSalesKeyPeoplePickers(form);
        };
        const refreshCustomerFacts = () => {
          const selectedCustomer = salesVisibleCustomers().find(
            (item) => item.name === customer.value,
          );
          if (!selectedCustomer) {
            facts.textContent = "请选择客户单位";
            owner.textContent = "选择客户后自动匹配";
            owner.dataset.owner = "";
            replaceKeyPeoplePicker();
            return;
          }
          const ownerMatch = salesOwnerMatchForCustomer(selectedCustomer);
          facts.textContent = `${selectedCustomer.group} · ${selectedCustomer.industry} · ${customerRegionScope(selectedCustomer)}${selectedCustomer.city ? ` · ${selectedCustomer.city}` : ""}`;
          owner.textContent = ownerMatch.ok
            ? `${ownerMatch.owner.name} · ${ownerMatch.role}`
            : ownerMatch.message;
          owner.dataset.owner = ownerMatch.ok ? ownerMatch.owner.name : "";
          replaceKeyPeoplePicker(selectedCustomer.name);
        };
        customer.onchange = refreshCustomerFacts;
        const createSupport = $("#salesCreateSupport");
        createSupport.onchange = () => {
          const visible = createSupport.value === "是";
          $("#salesSupportPeopleGroup").hidden = !visible;
          $("#salesSupportRequirementGroup").hidden = !visible;
          $("#salesSupportDeadlineGroup").hidden = !visible;
        };
        $("#cancelOpportunityCreate").onclick = () => salesNavigate("opportunities");
        form.onsubmit = (event) => {
          event.preventDefault();
          const required = [
            ["salesName", "请填写商机名称"],
            ["salesType", "请选择商机类型"],
            ["salesAmount", "请填写预估金额（含税，元）"],
            ["salesPriority", "请选择优先级"],
            ["salesCustomer", "请选择客户单位"],
            ["salesExpectedDate", "请选择预计成交日期"],
            ["salesFirstFollow", "请选择首次跟进日期"],
            ["salesRequirement", "请填写商机需求描述"],
          ];
          let valid = true;
          required.forEach(([id, message]) => {
            const value = $(`#${id}`)?.value.trim();
            setSalesFormError(id, value ? "" : message);
            if (!value) valid = false;
          });
          const keyPeoplePicker = $("#salesKeyPeoplePicker");
          const people = selectedSalesKeyPeople(keyPeoplePicker);
          setSalesFormError("salesKeyPeople", people.length ? "" : "请选择至少一名商机关键人");
          if (!people.length) valid = false;
          const amount = Number($("#salesAmount").value);
          if (Number.isNaN(amount) || amount < 0) {
            setSalesFormError("salesAmount", "预估金额必须大于或等于 0");
            valid = false;
          }
          if ($("#salesFirstFollow").value < salesNextBusinessDate()) {
            setSalesFormError("salesFirstFollow", "首次跟进日期不得早于下一业务日");
            valid = false;
          }
          const supportPeople = selectedSalesSupportPeople(supportPicker);
          if (createSupport.value === "是") {
            setSalesFormError("salesSupportPeople", supportPeople.length ? "" : "请选择至少一名支撑人员");
            setSalesFormError("salesSupportRequirement", $("#salesSupportRequirement").value.trim() ? "" : "请填写支撑需求");
            setSalesFormError("salesSupportDeadline", $("#salesSupportDeadline").value ? "" : "请选择回应时限");
            if (!supportPeople.length || !$("#salesSupportRequirement").value.trim() || !$("#salesSupportDeadline").value) valid = false;
          }
          const selectedCustomer = salesVisibleCustomers().find(
            (item) => item.name === customer.value,
          );
          const ownerMatch = salesOwnerMatchForCustomer(selectedCustomer);
          setSalesFormError("salesOwner", ownerMatch.ok ? "" : ownerMatch.message);
          if (!ownerMatch.ok) valid = false;
          const canCreateAcrossResponsibilities =
            currentUser.fullAccess ||
            salesRoleNames().some((role) => ["总裁", "市场副总"].includes(role));
          const currentValidPeople = new Set(
            contacts
              .filter(
                (person) =>
                  person.company === selectedCustomer?.name &&
                  contactIsActive(person),
              )
              .map((person) => person.name),
          );
          if (people.some((name) => !currentValidPeople.has(name))) {
            setSalesFormError(
              "salesKeyPeople",
              "关键人范围已变化，请按当前客户有效关键人重新选择",
            );
            valid = false;
          }
          if (
            ownerMatch.ok &&
            salesIsRole("PM") &&
            !canCreateAcrossResponsibilities &&
            ownerMatch.owner.name !== currentUser.name
          ) {
            setSalesFormError("salesOwner", "该客户不再属于本人 PM 地市责任范围");
            valid = false;
          }
          if (
            ownerMatch.ok &&
            salesIsRole("区域总监") &&
            !canCreateAcrossResponsibilities &&
            ownerMatch.owner.name !== currentUser.name
          ) {
            setSalesFormError("salesOwner", "该省级客户不再属于本人主管区域");
            valid = false;
          }
          if (!valid) return;
          const number = `SJ${DEMO_TODAY.slice(0, 7).replace("-", "")}${String(opportunities.length + 1).padStart(4, "0")}`;
          const item = {
            id: number,
            name: $("#salesName").value.trim(),
            type: $("#salesType").value,
            stage: "商机录入",
            customer: selectedCustomer.name,
            customerCode: `CU-${String(selectedCustomer.id).padStart(4, "0")}`,
            group: selectedCustomer.group,
            industry: selectedCustomer.industry,
            region: selectedCustomer.region,
            city: selectedCustomer.city || "",
            owner: ownerMatch.owner.name,
            priority: $("#salesPriority").value,
            estimateAmount: amount,
            expectedWinDate: $("#salesExpectedDate").value,
            createdDate: DEMO_TODAY,
            createdBy: currentUser.name,
            stageChangedAt: salesNow(),
            updatedAt: salesNow(),
            requirement: $("#salesRequirement").value.trim(),
            keyPeople: people,
            nextFollowDate: $("#salesFirstFollow").value,
            histories: [{ time: salesNow(), from: "—", to: "商机录入", operator: currentUser.name }],
            reassignments: [],
            followUps: [],
            supports: supportPeople.map((name, index) => ({
              id: `ZC-${String(opportunities.flatMap((row) => row.supports).length + index + 1).padStart(3, "0")}`,
              assignee: name,
              deadline: $("#salesSupportDeadline").value.replace("T", " "),
              status: "待响应",
              content: $("#salesSupportRequirement").value.trim(),
              delivery: "",
              overdue: false,
            })),
          };
          opportunities.unshift(item);
          selectedOpportunityId = item.id;
          opportunityDetailTab = "overview";
          salesNavigate("opportunity-detail");
          toast("商机已创建");
        };
      }

      function openSalesEditModal(item) {
        if (!salesCanProgress(item) || item.stage === "落选") return;
        const estimateDisabled = item.stage === "中选" ? "disabled" : "";
        openModal(
          `<div class="modal-head"><div class="modal-title">编辑商机</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesEditForm"><div class="modal-body"><div class="form-grid sales-modal-grid"><div class="form-group"><label class="form-label">客户单位</label><input class="input" value="${escapeHtml(item.customer)}" disabled></div><div class="form-group"><label class="form-label">商机类型</label><input class="input" value="${escapeHtml(item.type)}" disabled></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>商机名称</label><input class="input" id="salesEditName" value="${escapeHtml(item.name)}" maxlength="100"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>优先级</label><select class="input" id="salesEditPriority">${SALES_PRIORITIES.map((value) => `<option ${value === item.priority ? "selected" : ""}>${value}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">预估金额（含税，元）</label><input class="input" id="salesEditAmount" type="number" min="0" step="0.01" value="${item.estimateAmount}" ${estimateDisabled}><div class="list-sub">${estimateDisabled ? "进入中选后只读" : "大于或等于 0"}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>预计成交日期</label><input class="input" id="salesEditExpectedDate" type="date" value="${item.expectedWinDate}"></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>商机关键人</label>${salesKeyPeoplePickerHtml("salesEditKeyPeoplePicker", item.customer, item.keyPeople)}</div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>商机需求描述</label><textarea class="input" id="salesEditRequirement" rows="4" maxlength="1000">${escapeHtml(item.requirement)}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存修改</button></div></form>`,
        );
        bindSalesKeyPeoplePickers($("#salesEditForm"));
        $("#salesEditForm").onsubmit = (event) => {
          event.preventDefault();
          const next = {
            name: $("#salesEditName").value.trim(),
            priority: $("#salesEditPriority").value,
            estimateAmount: item.stage === "中选" ? item.estimateAmount : Number($("#salesEditAmount").value),
            expectedWinDate: $("#salesEditExpectedDate").value,
            keyPeople: selectedSalesKeyPeople($("#salesEditKeyPeoplePicker")),
            requirement: $("#salesEditRequirement").value.trim(),
          };
          if (!next.name || !next.expectedWinDate || !next.keyPeople.length || !next.requirement)
            return toast("请填写全部必填信息");
          const validKeyPeople = new Set(
            contacts
              .filter(
                (person) =>
                  person.company === item.customer && contactIsActive(person),
              )
              .map((person) => person.name),
          );
          if (next.keyPeople.some((name) => !validKeyPeople.has(name)))
            return toast("关键人范围已变化，请按当前客户有效关键人重新选择");
          if (!Number.isFinite(next.estimateAmount) || next.estimateAmount < 0)
            return toast("预估金额必须大于或等于 0");
          const labels = {
            name: "商机名称",
            priority: "优先级",
            estimateAmount: "预估金额（含税，元）",
            expectedWinDate: "预计成交日期",
            keyPeople: "商机关键人",
            requirement: "商机需求描述",
          };
          const display = (value) => Array.isArray(value) ? value.join("、") : String(value);
          const changes = Object.keys(next).filter((key) => display(item[key]) !== display(next[key]));
          if (!changes.length) return toast("商机信息未发生变化");
          changes.forEach((key) => item.editHistories.push({
            time: salesNow(),
            field: labels[key],
            before: display(item[key]),
            after: display(next[key]),
            operator: currentUser.name,
          }));
          Object.assign(item, next, { updatedAt: salesNow() });
          closeOverlay();
          renderPage();
          toast("商机信息已更新");
        };
      }

      function openSalesStageModal(item) {
        if (!salesCanProgress(item) || item.stage === "落选") return;
        const index = SALES_FORWARD_STAGES.indexOf(item.stage);
        const next = index >= 0 && index < SALES_FORWARD_STAGES.length - 1
          ? SALES_FORWARD_STAGES[index + 1]
          : "";
        const options = [next, "落选"].filter(Boolean);
        openModal(
          `<div class="modal-head"><div class="modal-title">推进商机阶段</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesStageForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新阶段</label><select class="input" id="salesNextStage">${options.map((value) => `<option value="${value}">${value}</option>`).join("")}</select></div><div id="salesStageFields"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认推进</button></div></form>`,
        );
        const renderFields = () => {
          const stage = $("#salesNextStage").value;
          $("#salesStageFields").innerHTML = stage === "中选"
            ? '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>中选日期</label><input class="input" id="salesSelectedDate" type="date"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>预计签约金额（含税，元）</label><input class="input" id="salesExpectedContractAmount" type="number" min="0" step="0.01"></div>'
            : stage === "落选"
              ? '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>落选原因</label><input class="input" id="salesLossReason"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>竞争对手</label><input class="input" id="salesCompetitor"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>复盘说明</label><textarea class="input" id="salesReview" rows="3"></textarea></div>'
              : "";
        };
        $("#salesNextStage").onchange = renderFields;
        renderFields();
        $("#salesStageForm").onsubmit = (event) => {
          event.preventDefault();
          const stage = $("#salesNextStage").value;
          if (stage === "中选") {
            if (!$("#salesSelectedDate").value || $("#salesExpectedContractAmount").value === "")
              return toast("请填写中选日期和预计签约金额（含税，元）");
            item.selectedDate = $("#salesSelectedDate").value;
            item.expectedContractAmount = Number($("#salesExpectedContractAmount").value);
          }
          if (stage === "落选") {
            if (!$("#salesLossReason").value.trim() || !$("#salesCompetitor").value.trim() || !$("#salesReview").value.trim())
              return toast("请填写落选原因、竞争对手和复盘说明");
            item.lossReason = $("#salesLossReason").value.trim();
            item.competitor = $("#salesCompetitor").value.trim();
            item.review = $("#salesReview").value.trim();
            item.nextFollowDate = "";
          }
          const from = item.stage;
          item.stage = stage;
          item.stageChangedAt = salesNow();
          item.updatedAt = salesNow();
          item.histories.push({ time: salesNow(), from, to: stage, operator: currentUser.name });
          closeOverlay();
          renderPage();
          toast(`商机已进入${stage}`);
        };
      }

      function openSalesFollowupModal(item) {
        const keyPeopleOptions = item.keyPeople
          .map((name) => `<option value="${name}">${name}</option>`)
          .join("");
        const formHtml = [
          '<div class="modal-head"><div class="modal-title">新增商机跟进</div><button class="icon-btn close" data-close title="关闭">×</button></div>',
          '<form id="salesFollowupForm"><div class="modal-body"><div class="form-grid sales-modal-grid">',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>跟进时间</label><input class="input" id="followTime" type="datetime-local" value="${DEMO_TODAY}T11:30"></div>`,
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>跟进方式</label><select class="input" id="followMethod"><option value="现场拜访">现场拜访</option><option value="电话">电话</option><option value="企业微信">企业微信</option></select></div>',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>参与关键人</label><select class="input" id="followPeople" multiple size="3">${keyPeopleOptions}</select></div>`,
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>当前风险</label><select class="input" id="followRisk">${SALES_RISKS.map((risk) => `<option value="${risk}">${risk}</option>`).join("")}</select></div>`,
          '<div class="form-group" id="followRiskOtherGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>其他风险说明</label><input class="input" id="followRiskOther" maxlength="200" placeholder="请说明具体风险"></div>',
          '<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>跟进内容与结果</label><textarea class="input" id="followResult" rows="3"></textarea></div>',
          '<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>下一步行动</label><input class="input" id="followNextAction"></div>',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>下次跟进日期</label><input class="input" id="followNextDate" type="date" min="${salesNextBusinessDate()}"></div>`,
          '<div class="form-group"><label class="form-label">附件</label><input class="input" id="followAttachment" type="file"></div>',
          '</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存跟进</button></div></form>',
        ].join("");
        openModal(
          formHtml,
        );
        const riskControl = $("#followRisk");
        const syncRiskOther = () => {
          $("#followRiskOtherGroup").hidden = riskControl.value !== "其他";
        };
        riskControl.onchange = syncRiskOther;
        syncRiskOther();
        $("#salesFollowupForm").onsubmit = (event) => {
          event.preventDefault();
          const people = selectedValues($("#followPeople"));
          const result = $("#followResult").value.trim();
          const risk = $("#followRisk").value;
          const riskOther = $("#followRiskOther").value.trim();
          const action = $("#followNextAction").value.trim();
          const nextDate = $("#followNextDate").value;
          const time = $("#followTime").value;
          if (!time || time > `${DEMO_TODAY}T12:00`) return toast("跟进时间不得晚于提交时间");
          if (!people.length || !result || !risk || !action || !nextDate)
            return toast("请填写全部必填跟进信息");
          if (!SALES_RISKS.includes(risk)) return toast("请选择有效的当前风险");
          if (risk === "其他" && !riskOther)
            return toast("选择其他风险时，请填写具体风险说明");
          if (nextDate <= time.slice(0, 10)) return toast("下次跟进日期必须晚于本次跟进时间");
          item.followUps.push({
            time: time.replace("T", " "),
            method: $("#followMethod").value,
            people: people.join("、"),
            result,
            risk: risk === "其他" ? `其他：${riskOther}` : risk,
            nextAction: action,
            nextDate,
            attachment: $("#followAttachment").files[0]?.name || "",
            operator: currentUser.name,
          });
          item.nextFollowDate = nextDate;
          item.updatedAt = salesNow();
          closeOverlay();
          renderPage();
          toast("跟进记录已保存");
        };
      }

      function openSalesSupportModal(item) {
        const formHtml = [
          '<div class="modal-head"><div class="modal-title">发起方案支撑</div><button class="icon-btn close" data-close title="关闭">×</button></div>',
          '<form id="salesSupportForm"><div class="modal-body">',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label>${salesSupportPeoplePickerHtml("supportPeoplePicker")}</div>`,
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>回应时限</label><input class="input" id="supportDeadline" type="datetime-local" value="${addDays(DEMO_TODAY, 2)}T12:00"></div>`,
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑需求</label><textarea class="input" id="supportContent" rows="3"></textarea></div>',
          '</div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">发起支撑</button></div></form>',
        ].join("");
        openModal(
          formHtml,
        );
        const supportPicker = $("#supportPeoplePicker");
        bindSalesSupportPickers($("#salesSupportForm"));
        $("#salesSupportForm").onsubmit = (event) => {
          event.preventDefault();
          const people = selectedSalesSupportPeople(supportPicker);
          const deadline = $("#supportDeadline").value;
          const content = $("#supportContent").value.trim();
          if (!people.length || !deadline || !content) return toast("请填写全部必填支撑信息");
          people.forEach((name, index) =>
            item.supports.push({
              id: `ZC-${String(opportunities.flatMap((row) => row.supports).length + index + 1).padStart(3, "0")}`,
              assignee: name,
              deadline: deadline.replace("T", " "),
              status: "待响应",
              content,
              delivery: "",
              overdue: false,
              histories: [
                {
                  time: salesNow(),
                  action: "发起请求",
                  operator: currentUser.name,
                  owner: item.owner,
                  assignee: name,
                },
              ],
            }),
          );
          item.updatedAt = salesNow();
          closeOverlay();
          renderPage();
          toast("方案支撑已发起");
        };
      }

      function handleSupportAction(item, support, action) {
        const actionLabel = {
          respond: "确认接收",
          work: "提交过程内容",
          deliver: "提交交付",
          close: "确认接收交付",
          supplement: "要求补充",
        }[action];
        const recordHistory = () => {
          support.histories = support.histories || [];
          support.histories.push({
            time: salesNow(),
            action: actionLabel,
            operator: currentUser.name,
            owner: item.owner,
            assignee: support.assignee,
          });
        };
        if (action === "respond") support.status = "已响应";
        if (action === "work") {
          support.status = "支撑中";
          support.delivery = support.delivery || "已提交过程内容";
        }
        if (action === "close") support.status = "已关闭";
        if (action === "supplement") support.status = "支撑中";
        if (action !== "deliver") {
          recordHistory();
          item.updatedAt = salesNow();
          renderPage();
          toast("方案支撑状态已更新");
          return;
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">提交方案支撑交付</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="supportDeliveryForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交付说明或附件名称</label><textarea class="input" id="supportDelivery" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交交付</button></div></form>`,
        );
        $("#supportDeliveryForm").onsubmit = (event) => {
          event.preventDefault();
          const delivery = $("#supportDelivery").value.trim();
          if (!delivery) return toast("请填写交付说明或附件名称");
          support.delivery = delivery;
          support.status = "已交付";
          recordHistory();
          item.updatedAt = salesNow();
          closeOverlay();
          renderPage();
          toast("方案支撑已交付");
        };
      }

      function openSalesReassignModal(item) {
        if (!item || !salesCanReassign(item)) return toast("当前角色无权改派该商机");
        const candidates = salesPmEmployees(item.region)
          .map((employee) => employee.name)
          .filter((name) => name !== item.owner);
        openModal(
          `<div class="modal-head"><div class="modal-title">改派商机负责人</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesReassignForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新负责人</label><select class="input" id="salesNewOwner"><option value="">请选择本区域在职 PM</option>${candidates.map((name) => `<option value="${name}">${name}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>改派原因</label><textarea class="input" id="salesReassignReason" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认改派</button></div></form>`,
        );
        $("#salesReassignForm").onsubmit = (event) => {
          event.preventDefault();
          const newOwner = $("#salesNewOwner").value;
          const reason = $("#salesReassignReason").value.trim();
          if (!newOwner || !reason) return toast("请选择新负责人并填写改派原因");
          if (!salesCanReassign(item) || !salesPmEmployees(item.region).some(
            (employee) => employee.name === newOwner && employee.name !== item.owner,
          )) return toast("新负责人已不符合当前候选条件，请重新选择");
          const oldOwner = item.owner;
          item.owner = newOwner;
          item.updatedAt = salesNow();
          item.reassignments ||= [];
          item.reassignments.push({ before: oldOwner, after: newOwner, reason, operator: currentUser.name, time: salesNow() });
          closeOverlay();
          renderPage();
          toast("商机负责人已改派");
        };
      }

      function openSalesTargetModal(level, object) {
        const target = salesCurrentTarget();
        let rows;
        let title;
        if (level === "company") {
          title = "调整公司与区域商机数量目标";
          rows = [
            { key: "company", label: "公司目标", value: target.companyTarget },
            ...target.regions.map((region) => ({ key: `region:${region.name}`, label: region.name, value: region.target })),
          ];
        } else if (level === "region") {
          title = "调整区域商机数量目标";
          rows = target.regions.map((region) => ({ key: `region:${region.name}`, label: region.name, value: region.target }));
        } else {
          const regionName = object.split("|")[0];
          const region = target.regions.find((item) => item.name === regionName);
          title = `调整${regionName}PM商机数量目标`;
          rows = region.salespeople.map((person) => ({ key: `sales:${regionName}:${person.name}`, label: person.name, value: person.target ?? 0 }));
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesTargetForm"><div class="modal-body"><div class="sales-target-edit-list">${rows.map((row) => `<label class="sales-target-edit-row"><span>${row.label}</span><input class="input" type="number" min="0" step="1" data-sales-target-key="${row.key}" value="${row.value}"></label>`).join("")}</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>调整原因</label><textarea class="input" id="salesTargetReason" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交调整</button></div></form>`,
        );
        $("#salesTargetForm").onsubmit = (event) => {
          event.preventDefault();
          const reason = $("#salesTargetReason").value.trim();
          const values = Object.fromEntries(
            [...document.querySelectorAll("[data-sales-target-key]")].map((input) => [input.dataset.salesTargetKey, Number(input.value)]),
          );
          if (!reason) return toast("请填写调整原因");
          if (Object.values(values).some((value) => !Number.isInteger(value) || value < 0))
            return toast("商机数量目标必须为大于或等于 0 的整数");
          const company = values.company ?? target.companyTarget;
          const regionTotal = target.regions.reduce(
            (sum, region) => sum + (values[`region:${region.name}`] ?? region.target),
            0,
          );
          if ((level === "company" || level === "region") && regionTotal !== company)
            return toast(`区域目标合计 ${regionTotal}，与公司目标 ${company} 不一致`);
          if (level === "sales") {
            const regionName = object.split("|")[0];
            const region = target.regions.find((item) => item.name === regionName);
            const salesTotal = region.salespeople.reduce(
              (sum, person) => sum + (values[`sales:${regionName}:${person.name}`] ?? person.target ?? 0),
              0,
            );
            if (salesTotal !== region.target)
              return toast(`PM目标合计 ${salesTotal}，与${regionName}目标 ${region.target} 不一致`);
          }
          const changedItems = [];
          if (values.company != null && values.company !== target.companyTarget)
            changedItems.push({ level: "公司", object: "英嘉科技", before: target.companyTarget, after: values.company });
          target.regions.forEach((region) => {
            const regionValue = values[`region:${region.name}`];
            if (regionValue != null && regionValue !== region.target)
              changedItems.push({ level: "区域", object: region.name, before: region.target, after: regionValue });
            region.salespeople.forEach((person) => {
              const salesValue = values[`sales:${region.name}:${person.name}`];
              if (salesValue != null && salesValue !== person.target)
                changedItems.push({ level: "PM", object: `${region.name} / ${person.name}`, before: person.target ?? "未分配", after: salesValue });
            });
          });
          if (!changedItems.length) return toast("目标未发生变化");
          if (!window.confirm(`确认调整 ${changedItems.length} 项商机数量目标并立即生效？`)) return;
          if (values.company != null) target.companyTarget = values.company;
          target.regions.forEach((region) => {
            if (values[`region:${region.name}`] != null) region.target = values[`region:${region.name}`];
            region.salespeople.forEach((person) => {
              if (values[`sales:${region.name}:${person.name}`] != null)
                person.target = values[`sales:${region.name}:${person.name}`];
            });
          });
          target.version = `${target.version.split("-")[0]}-${String(Number(target.version.split("-")[1]) + 1).padStart(2, "0")}`;
          target.effectiveAt = salesNow();
          changedItems
            .slice()
            .reverse()
            .forEach((change) =>
              salesTargetHistory.unshift({
                version: target.version,
                month: target.month,
                level: change.level,
                object: change.object,
                before: change.before,
                after: change.after,
                reason,
                operator: currentUser.name,
                effectiveMode: "直接生效",
                effectiveAt: salesNow(),
              }),
            );
          closeOverlay();
          renderPage();
          toast("销售指标新版本已生效");
        };
      }

      function bindSalesEvents() {
        document.querySelectorAll("[data-sales-page]").forEach((button) => {
          button.onclick = () => salesNavigate(button.dataset.salesPage);
        });
        bindSalesPeriod();
        bindSalesTargetMonth();
        bindOpportunityFilters();
        document.querySelectorAll("[data-sales-trend]").forEach((button) => {
          button.onclick = () => {
            salesTrendMode = button.dataset.salesTrend;
            renderPage();
          };
        });
        document.querySelectorAll("[data-opportunity-open]").forEach((button) => {
          button.onclick = () => {
            selectedOpportunityId = button.dataset.opportunityOpen;
            opportunityDetailTab = "overview";
            salesNavigate("opportunity-detail");
          };
        });
        document.querySelectorAll("[data-opportunity-tab]").forEach((button) => {
          button.onclick = () => {
            opportunityDetailTab = button.dataset.opportunityTab;
            renderPage();
          };
        });
        const back = $("#backToOpportunities");
        if (back) back.onclick = () => salesNavigate("opportunities");
        bindOpportunityCreateForm();
        const selected = opportunitySelected();
        const edit = $("[data-sales-edit]");
        if (edit && selected) edit.onclick = () => openSalesEditModal(selected);
        const stage = $("[data-sales-stage-open]");
        if (stage && selected) stage.onclick = () => openSalesStageModal(selected);
        const followup = $("[data-sales-followup-add]");
        if (followup && selected) followup.onclick = () => openSalesFollowupModal(selected);
        const support = $("[data-sales-support-add]");
        if (support && selected) support.onclick = () => openSalesSupportModal(selected);
        const reassign = $("[data-sales-reassign]");
        if (reassign && selected) reassign.onclick = () => openSalesReassignModal(selected);
        document.querySelectorAll("[data-support-action]").forEach((button) => {
          button.onclick = () => {
            const opportunity = button.dataset.supportOpportunity
              ? opportunities.find((item) => item.id === button.dataset.supportOpportunity)
              : selected;
            const request = opportunity?.supports.find((item) => item.id === button.dataset.supportId);
            if (opportunity && request) handleSupportAction(opportunity, request, button.dataset.supportAction);
          };
        });
        document.querySelectorAll("[data-sales-target-edit]").forEach((button) => {
          button.onclick = () => openSalesTargetModal(button.dataset.salesTargetEdit, button.dataset.salesTargetObject);
        });
      }
