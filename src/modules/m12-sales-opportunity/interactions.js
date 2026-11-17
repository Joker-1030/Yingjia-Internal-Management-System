      function salesNavigate(page) {
        currentPage = page;
        window.history.replaceState(null, "", `#${page}`);
        closeOverlay();
        renderPage();
      }

      function salesNow() {
        return `${DEMO_TODAY} 12:00`;
      }

      function salesSupportNow() {
        const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
          timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
        }).formatToParts(new Date()).map((part) => [part.type, part.value]));
        return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
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
        return [...new Set([...(picker?.querySelectorAll("input[data-sales-support-person]:checked") || [])]
          .map((input) => input.value)
          .filter(Boolean))];
      }

      function validSalesSupportSelection(codes) {
        const eligible = new Set(salesSupportCandidates().map((employee) => employee.code));
        return codes.length > 0 && codes.every((code) => eligible.has(code));
      }

      function renderSalesSupportSelected(picker) {
        const selectedContainer = picker?.querySelector("[data-sales-support-selected]");
        if (!selectedContainer) return;
        selectedContainer.innerHTML = selectedSalesSupportPeople(picker)
          .map(
            (code) => {
              const name = employees.find((employee) => employee.code === code)?.name || "";
              return `<span class="sales-support-selected-item"><span>${escapeHtml(name)}</span><button class="sales-support-selected-remove" type="button" data-sales-support-remove="${escapeHtml(code)}" title="移除${escapeHtml(name)}" aria-label="移除${escapeHtml(name)}">×</button></span>`;
            },
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

      function bindSalesPeriodFields(dimensionId, periodId, getDraft, setDraft, allowed) {
        const dimension = $(`#${dimensionId}`), year = $(`#${dimensionId.replace("Dimension", "Year")}`), unit = $(`#${periodId}`);
        const read = () => {
          if (!["year", "quarter", "month"].includes(dimension?.value) || !year) return null;
          const value = dimension.value === "year" ? year.value : `${year.value}-${unit?.value}`;
          return salesPeriodOptions(dimension.value).some(([period]) => period === value) ? value : null;
        };
        const sync = () => {
          const period = getDraft(), kind = salesPeriodDimension(period);
          if (dimension) dimension.value = kind;
          if (year) year.value = period.slice(0, 4);
          if (unit) { unit.innerHTML = salesPeriodValueOptions(period); unit.value = period.slice(5); unit.disabled = kind === "year"; }
          const group = $(`#${periodId}Unit`), label = $(`#${periodId}Label`);
          if (group) group.hidden = kind === "year";
          if (label) label.textContent = kind === "quarter" ? "季度" : "月份";
        };
        if (dimension) dimension.onchange = () => {
          if (!allowed()) return;
          const next = salesConvertPeriod(getDraft(), dimension.value);
          if (next) { setDraft(next); sync(); }
        };
        const change = () => { if (allowed()) { const next = read(); if (next) setDraft(next); } };
        if (year) year.onchange = change;
        if (unit) unit.onchange = change;
        sync();
        return { read, sync };
      }

      function bindSalesPeriod() {
        const fields = bindSalesPeriodFields("salesPeriodDimension", "salesPeriodDraft", () => salesPeriodDraft, value => salesPeriodDraft = value, salesWorkbenchAllowed);
        const apply = $("#applySalesPeriod");
        if (apply) apply.onclick = () => {
          const next = fields.read();
          if (!salesWorkbenchAllowed() || !next) return;
          salesPeriodDraft = salesPeriodApplied = next;
          renderPage();
        };
        const reset = $("#resetSalesPeriod");
        if (reset) reset.onclick = () => {
          if (!salesWorkbenchAllowed()) return;
          salesPeriodDraft = salesPeriodApplied = DEMO_TODAY.slice(0, 7);
          renderPage();
        };
      }

      function selectSalesTargetPeriod(selectedYear, selectedQuarter) {
        if (!canAccessPage("sales-targets") || !salesTargetYears.some(item => item.year === selectedYear) || ![1,2,3,4].includes(selectedQuarter)) return;
        const todayQuarter = Math.ceil(Number(DEMO_TODAY.slice(5,7))/3);
        salesTargetMonth = selectedYear === DEMO_TODAY.slice(0,4) && selectedQuarter === todayQuarter ? DEMO_TODAY.slice(0,7) : `${selectedYear}-${String((selectedQuarter-1)*3+1).padStart(2,"0")}`;
        renderPage();
      }
      function selectSalesTargetMonth(month) {
        if (!canAccessPage("sales-targets") || !salesPeriodMonths(salesTargetQuarterPeriod()).includes(month)) return;
        salesTargetMonth = month;
        renderPage();
      }
      function bindSalesTargetMonth() {
        const year = $("#salesTargetYear"), quarter = $("#salesTargetQuarter"), month = $("#salesTargetMonth");
        if (year) year.onchange = () => selectSalesTargetPeriod(year.value,salesTargetQuarter());
        if (quarter) quarter.onchange = () => selectSalesTargetPeriod(salesTargetMonth.slice(0,4),Number(quarter.value));
        document.querySelectorAll("[data-sales-target-quarter]").forEach(button => {
          button.onclick = () => selectSalesTargetPeriod(salesTargetMonth.slice(0,4),Number(button.dataset.salesTargetQuarter));
        });
        document.querySelectorAll("[data-sales-target-month]").forEach(button => {
          button.onclick = () => selectSalesTargetMonth(button.dataset.salesTargetMonth);
        });
        if (month) month.onchange = () => selectSalesTargetMonth(month.value);
      }

      function bindOpportunityFilters() {
        const apply = $("#applyOpportunityFilters");
        if (apply)
          apply.onclick = () => {
            appliedOpportunityFilters = {
              code: $("#opportunityCodeFilter")?.value.trim() || "",
              name: $("#opportunityNameFilter")?.value.trim() || "",
              type: $("#opportunityTypeFilter")?.value || "",
              source: $("#opportunitySourceFilter")?.value || "",
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
        const toolbar=apply?.closest('.filter-toolbar');
        if(toolbar)toolbar.onkeydown=event=>{if(event.key==='Enter' && event.target.tagName==='INPUT'){event.preventDefault();apply.click();}};
        const reset = $("#resetOpportunityFilters");
        if (reset)
          reset.onclick = () => {
            appliedOpportunityFilters = {
              code: "",
              name: "",
              type: "",
              source: "",
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
        const type = $("#salesType");
        const ecosystemOwner = $("#salesEcosystemOwner");
        const actor = currentUser;
        const ownerCode = () => currentUser.fullAccess ? ecosystemOwner?.value || "" : currentEcosystemEmployee()?.code || "";
        bindSalesKeyPeoplePickers(form);
        const replaceKeyPeoplePicker = (customerName = "") => {
          if (type.value === SALES_ECOSYSTEM_TYPE) return;
          const currentPicker = $("#salesKeyPeoplePicker");
          if (!currentPicker) return;
          currentPicker.outerHTML = salesKeyPeoplePickerHtml(
            "salesKeyPeoplePicker",
            customerName, [], true,
          );
          bindSalesKeyPeoplePickers(form);
          const createContact = form.querySelector?.("[data-sales-create-contact]");
          if (createContact) createContact.onclick = () => {
            const company = salesVisibleCustomers(type.value).find(item => salesCustomerSelectionValue(item, type.value) === customer.value);
            if (currentUser !== actor || !salesCanCreate() || !canMaintainContactForCompany(company))
              return toast("当前账号无权维护该客户公司的关键人");
            openContactForm(undefined, company.id, () => {
              if (currentUser === actor && form === $("#opportunityCreateForm") && salesCanCreate()) refreshCustomerFacts();
            });
          };
        };
        const refreshCustomerFacts = () => {
          const selectedCustomer = salesVisibleCustomers(type.value).find(
            (item) => salesCustomerSelectionValue(item, type.value) === customer.value,
          );
          if (!selectedCustomer) {
            facts.textContent = "请选择客户单位";
            owner.textContent = type.value === SALES_ECOSYSTEM_TYPE ? currentEcosystemEmployee()?.name || "请选择有效生态合作员作为商机负责人" : "选择客户后自动匹配";
            owner.dataset.owner = "";
            replaceKeyPeoplePicker();
            return;
          }
          const ownerMatch = salesOwnerMatch(selectedCustomer, type.value, ownerCode());
          facts.textContent = type.value === SALES_ECOSYSTEM_TYPE ? selectedCustomer.id : `${selectedCustomer.industry} · ${selectedCustomer.group} · ${customerRegionLabel(selectedCustomer)} · ${adminArea(selectedCustomer)}`;
          owner.textContent = ownerMatch.ok
            ? `${ownerMatch.owner.name} · ${ownerMatch.role}`
            : ownerMatch.message;
          owner.dataset.owner = ownerMatch.ok ? ownerMatch.owner.name : "";
          replaceKeyPeoplePicker(selectedCustomer.name);
        };
        customer.onchange = refreshCustomerFacts;
        const refreshType = () => {
          const oldCustomer = customer.value;
          const candidates = salesVisibleCustomers(type.value);
          customer.innerHTML = '<option value="">请选择客户单位</option>' + candidates.map(item => `<option value="${escapeHtml(salesCustomerSelectionValue(item, type.value))}">${escapeHtml(item.name)}</option>`).join("");
          customer.value = candidates.some(item => salesCustomerSelectionValue(item, type.value) === oldCustomer) ? oldCustomer : "";
          const keyGroup = $("#salesKeyPeopleGroup");
          if (keyGroup) { keyGroup.hidden = type.value === SALES_ECOSYSTEM_TYPE; keyGroup.style.display = keyGroup.hidden ? "none" : "contents"; }
          if (ecosystemOwner) ecosystemOwner.hidden = type.value !== SALES_ECOSYSTEM_TYPE || !currentUser.fullAccess;
          owner.hidden = type.value === SALES_ECOSYSTEM_TYPE && currentUser.fullAccess;
          refreshCustomerFacts();
        };
        type.onchange = refreshType;
        if (ecosystemOwner) ecosystemOwner.onchange = refreshCustomerFacts;
        refreshType();
        const referral = teacherRecommendations.find(x => x.id === pendingTeacherRecommendationId);
        const referralVersion = referral?.version;
        if (referral && teacherCanHandleRecommendation(referral)) {
          type.value = referral.type; refreshType();
          const referralCustomer = teacherRecommendationCustomer(referral);
          customer.value = salesCustomerSelectionValue(referralCustomer, referral.type); refreshCustomerFacts();
          type.disabled = true; customer.disabled = true;
          $("#salesRequirement").value = referral.description;
        }
        $("#cancelOpportunityCreate").onclick = () => { pendingTeacherRecommendationId=''; salesNavigate("opportunities"); };
        let submitted = false;
        form.onsubmit = (event) => {
          event.preventDefault();
          if (submitted) return;
          if (currentUser !== actor || !salesCanCreate() || form !== $("#opportunityCreateForm")) return toast("当前账号没有创建商机权限。");
          if (!salesCreateTypes().includes(type.value)) return toast("当前账号不能创建该类型商机");
          const required = [
            ["salesName", "请填写商机名称"],
            ["salesType", "请选择商机类型"],
            ["salesAmount", "请填写预估金额（含税，万元）"],
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
          const ecosystem = type.value === SALES_ECOSYSTEM_TYPE;
          const people = ecosystem ? [] : selectedSalesKeyPeople(keyPeoplePicker);
          setSalesFormError("salesKeyPeople", ecosystem || people.length ? "" : "请选择至少一名商机关键人");
          if (!ecosystem && !people.length) valid = false;
          const amount = parseWanMoney($("#salesAmount").value.trim());
          if (!Number.isFinite(amount) || amount < 0) {
            setSalesFormError("salesAmount", "预估金额须大于或等于 0，最多6位小数（含税，万元）");
            valid = false;
          }
          if ($("#salesFirstFollow").value < salesNextBusinessDate()) {
            setSalesFormError("salesFirstFollow", "首次跟进日期不得早于下一业务日");
            valid = false;
          }
          const selectedCustomer = salesVisibleCustomers(type.value).find(
            (item) => salesCustomerSelectionValue(item, type.value) === customer.value,
          );
          const ownerMatch = salesOwnerMatch(selectedCustomer, type.value, ownerCode());
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
            type.value !== SALES_ECOSYSTEM_TYPE && salesIsRole("PM") &&
            !canCreateAcrossResponsibilities &&
            ownerMatch.owner.name !== currentUser.name
          ) {
            setSalesFormError("salesOwner", "该客户不再由本人负责");
            valid = false;
          }
          if (
            ownerMatch.ok &&
            type.value !== SALES_ECOSYSTEM_TYPE && salesIsRole("区域总监") &&
            !canCreateAcrossResponsibilities &&
            ownerMatch.owner.name !== currentUser.name
          ) {
            setSalesFormError("salesOwner", "该省级客户不再由本人负责");
            valid = false;
          }
          if ((referral || pendingTeacherRecommendationId) && (!referral || pendingTeacherRecommendationId !== referral.id || !teacherRecommendations.includes(referral) || !teacherCanHandleRecommendation(referral) || referral.version !== referralVersion || referral.type !== type.value || referral.customerId !== selectedCustomer?.id)) return toast('推荐、客户责任或权限已变化，请重新处理');
          if (!valid) return;
          const number = `SJ${DEMO_TODAY.slice(0, 7).replace("-", "")}${String(opportunities.length + 1).padStart(4, "0")}`;
          const item = {
            id: number,
            name: $("#salesName").value.trim(),
            type: $("#salesType").value,
            stage: "商机录入",
            customer: selectedCustomer.name,
            customerCode: ecosystem ? selectedCustomer.id : `CU-${String(selectedCustomer.id).padStart(4, "0")}`,
            group: ecosystem ? "" : selectedCustomer.group,
            industry: ecosystem ? "" : selectedCustomer.industry,
            region: ecosystem ? "" : selectedCustomer.region,
            city: ecosystem ? "" : selectedCustomer.city || "",
            owner: ownerMatch.owner.name,
            ...(type.value === SALES_ECOSYSTEM_TYPE ? {ownerCode: ownerMatch.owner.code} : {}),
            priority: $("#salesPriority").value,
            estimateAmount: amount,
            initialEstimateAmount: amount,
            expectedWinDate: $("#salesExpectedDate").value,
            createdDate: DEMO_TODAY,
            createdBy: currentUser.name,
            stageChangedAt: salesNow(),
            updatedAt: salesNow(),
            requirement: $("#salesRequirement").value.trim(),
            keyPeople: people,
            nextFollowDate: $("#salesFirstFollow").value,
            histories: [{ time: salesNow(), from: "—", to: "商机录入", operator: currentUser.name }],
            editHistories: [],
            reassignments: [],
            followUps: [],
            supports: [],
          };
          if (referral) item.teacherSources = [{ recommendationId: referral.id, teacherId: referral.teacherId, projectId: referral.projectId }];
          opportunities.unshift(item);
          if (referral) {
            Object.assign(referral, { opportunityId: item.id, status: '已转商机', version: referral.version + 1 });
            referral.history.push({ time: salesSupportNow(), actor: currentUser.name, action: '已转商机', opportunityId: item.id });
          }
          pendingTeacherRecommendationId = '';
          submitted = true;
          opportunityDetailContext = "sales";
          selectedOpportunitySupportId = null;
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
          `<div class="modal-head"><div class="modal-title">编辑商机</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesEditForm"><div class="modal-body"><div class="form-grid sales-modal-grid"><div class="form-group"><label class="form-label">客户单位</label><input class="input" value="${escapeHtml(item.customer)}" disabled></div><div class="form-group"><label class="form-label">商机类型</label><input class="input" value="${escapeHtml(item.type)}" disabled></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>商机名称</label><input class="input" id="salesEditName" value="${escapeHtml(item.name)}" maxlength="100"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>优先级</label><select class="input" id="salesEditPriority">${SALES_PRIORITIES.map((value) => `<option ${value === item.priority ? "selected" : ""}>${value}</option>`).join("")}</select></div><div class="form-group"><label class="form-label">预估金额（含税，万元）</label><input class="input" id="salesEditAmount" type="number" min="0" step="0.000001" value="${wanMoneyInput(item.estimateAmount)}" ${estimateDisabled}><div class="list-sub">${estimateDisabled ? "进入中选后只读" : "大于或等于 0"}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>预计成交日期</label><input class="input" id="salesEditExpectedDate" type="date" value="${item.expectedWinDate}"></div>${isEcosystemOpportunity(item) ? "" : `<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>商机关键人</label>${salesKeyPeoplePickerHtml("salesEditKeyPeoplePicker", item.customer, item.keyPeople)}</div>`}<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>商机需求描述</label><textarea class="input" id="salesEditRequirement" rows="4" maxlength="1000">${escapeHtml(item.requirement)}</textarea></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存修改</button></div></form>`,
        );
        bindSalesKeyPeoplePickers($("#salesEditForm"));
        $("#salesEditForm").onsubmit = (event) => {
          event.preventDefault();
          if (!salesCanProgress(item) || item.stage === "落选") return toast("商机或权限已变化，请重新打开操作");
          const next = {
            name: $("#salesEditName").value.trim(),
            priority: $("#salesEditPriority").value,
            estimateAmount: item.stage === "中选" ? item.estimateAmount : parseWanMoney($("#salesEditAmount").value.trim()),
            expectedWinDate: $("#salesEditExpectedDate").value,
            ...(!isEcosystemOpportunity(item) ? {keyPeople: selectedSalesKeyPeople($("#salesEditKeyPeoplePicker"))} : {}),
            requirement: $("#salesEditRequirement").value.trim(),
          };
          if (!next.name || !next.expectedWinDate || (!isEcosystemOpportunity(item) && !next.keyPeople.length) || !next.requirement)
            return toast("请填写全部必填信息");
          const validKeyPeople = new Set(
            contacts
              .filter(
                (person) =>
                  person.company === item.customer && contactIsActive(person),
              )
              .map((person) => person.name),
          );
          if (next.keyPeople?.some((name) => !validKeyPeople.has(name)))
            return toast("关键人范围已变化，请按当前客户有效关键人重新选择");
          if (!Number.isFinite(next.estimateAmount) || next.estimateAmount < 0)
            return toast("预估金额须大于或等于 0，最多6位小数（含税，万元）");
          const labels = {
            name: "商机名称",
            priority: "优先级",
            estimateAmount: "预估金额（含税，万元）",
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
            before: key === "estimateAmount" ? formatWanMoney(item[key]) : display(item[key]),
            after: key === "estimateAmount" ? formatWanMoney(next[key]) : display(next[key]),
            operator: currentUser.name,
          }));
          Object.assign(item, next, { updatedAt: salesNow() });
          closeOverlay();
          renderPage();
          toast("商机信息已更新");
        };
      }

      function salesNextStages(item) {
        const index = SALES_FORWARD_STAGES.indexOf(item.stage);
        if (index < 0 || item.stage === "中选") return [];
        return [...new Set([SALES_FORWARD_STAGES[index+1], item.stage === "需求确认" ? "比选" : "", "落选"].filter(Boolean))];
      }

      function salesStageTransition(item, target) {
        if (!SALES_STAGES.includes(item.stage) || !SALES_STAGES.includes(target) || target === item.stage) return "";
        if (salesNextStages(item).includes(target)) return "advance";
        if (item.stage === "落选" || (item.stage === "中选" && target === "落选") ||
            (SALES_FORWARD_STAGES.includes(target) && SALES_FORWARD_STAGES.indexOf(target) < SALES_FORWARD_STAGES.indexOf(item.stage))) return "correction";
        return "";
      }

      function salesStageTargets(item) {
        return [...salesNextStages(item), ...SALES_STAGES.filter(target => salesStageTransition(item, target) === "correction")];
      }

      function salesCloseSupport(item, support, kind, reason, time = salesSupportNow()) {
        support.status = "已关闭";
        support.closureKind = kind;
        support.closedReason = reason;
        support.histories ||= [];
        support.histories.push({time,action:kind === "withdraw" ? "撤回" : kind === "accepted" ? "确认接收交付" : "停止支撑",description:reason,operator:currentUser.name,owner:item.owner,assignee:support.assignee});
        item.updatedAt = time;
      }

      function salesResultSnapshot(item) {
        return {stage:item.stage, selectedDate:item.selectedDate || "", expectedContractAmount:item.expectedContractAmount ?? null,
          lossReason:item.lossReason || "",competitor:item.competitor || "",review:item.review || ""};
      }

      function salesStageFilesHtml(item, history) {
        return (history.files || []).map((file,index) => `<div>${hasAttachmentPermission("attachment_view") ? `<button class="link" data-stage-file="view" data-stage-opportunity="${item.id}" data-stage-history="${item.histories.indexOf(history)}" data-stage-file-index="${index}">${escapeHtml(file.name)}</button>` : escapeHtml(file.name)} ${hasAttachmentPermission("attachment_download") ? `<button class="link" data-stage-file="download" data-stage-opportunity="${item.id}" data-stage-history="${item.histories.indexOf(history)}" data-stage-file-index="${index}">下载</button>` : ""}</div>`).join("");
      }

      function openSalesStageFile(item, history, index, action, expected) {
        if (!opportunities.includes(item) || !hasPermission("opportunities") || !salesVisibleOpportunities().includes(item) || !salesSupportActorActive() ||
            !item.histories.includes(history) || !["view","download"].includes(action) || !hasAttachmentPermission(action === "download" ? "attachment_download" : "attachment_view")) return toast("当前无法查看该商机材料");
        const file = history.files?.[index];
        if (!Number.isInteger(index) || !file || file !== expected || !file.url?.startsWith("blob:")) return toast("当前无法查看该商机材料");
        const link = document.createElement("a");link.href=file.url;
        if (action === "download") link.download=file.name; else {link.target="_blank";link.rel="noopener";}
        link.click();
      }

      function salesProjectCreationContext(item) {
        if (!salesSupportActorActive() || !hasPermission("projects") || !hasOperationPermission("projects.create") ||
            !opportunities.includes(item) || !salesVisibleOpportunities().includes(item)) return null;
        const customer = salesOpportunityCustomer(item);
        if (!customer) return null;
        const owner = isEcosystemOpportunity(item) ? salesEcosystemOwnerCode(item) : "";
        return projectCustomerOpportunityCandidates(customer.id, owner).includes(item) ? { customerId: String(customer.id), owner } : null;
      }
      function openSalesProjectCreationPrompt(item) {
        const context = salesProjectCreationContext(item);
        if (!context) return;
        const actor = currentUser;
        openModal(`<div class="modal-head"><div class="modal-title">商机已中选</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><p>商机已中选，是否现在去立项？</p><div class="list-sub">${escapeHtml(item.name)}（${escapeHtml(item.id)}）</div></div><div class="modal-foot"><button class="btn" data-close>暂不立项</button><button class="btn btn-primary" id="salesGoCreateProject">去立项</button></div>`);
        const button = $("#salesGoCreateProject"); let used = false;
        button.onclick = () => {
          if (used || button !== $("#salesGoCreateProject")) return;
          const latest = currentUser === actor ? salesProjectCreationContext(item) : null;
          if (!latest || latest.customerId !== context.customerId || latest.owner !== context.owner) {
            used = true; closeOverlay();
            return toast("该商机已不符合立项条件，请从项目管理重新选择");
          }
          used = true;
          salesNavigate("project-create");
          $("#pfCustomer").value = latest.customerId;
          refreshProjectFormDynamics();
          if (latest.owner && currentUser.fullAccess) $("#pfOwner").value = latest.owner;
          refreshProjectFormDynamics();
          $("#pfOpportunity").value = item.id;
          refreshProjectFormDynamics();
        };
      }

      function openSalesStageModal(item) {
        if (!opportunities.includes(item) || !salesSupportActorActive() || !salesCanCorrect(item)) return;
        const actor = currentUser, original = JSON.stringify({owner:item.owner,result:salesResultSnapshot(item)});
        const options = salesStageTargets(item);
        if (!options.length) return;
        openModal(`<div class="modal-head"><div class="modal-title">推进商机阶段</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesStageForm"><div class="modal-body"><div class="form-group"><label class="form-label">当前阶段</label><div>${escapeHtml(salesStageLabel(item.stage))}</div></div><div class="form-group"><label class="form-label">推进至阶段</label><select class="input" id="salesNextStage">${options.map(value=>`<option value="${value}">${salesStageLabel(value)}</option>`).join("")}</select></div><div id="salesStageFields"></div><div id="salesStageEvidence"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" id="salesStageConfirm" type="submit">确认推进</button></div></form><form id="salesStageBatchForm" style="display:none"><div class="modal-body" id="salesStageBatchBody"></div><div class="modal-foot"><button class="btn" type="button" id="salesStageBatchBack">返回调整</button><button class="btn btn-primary" type="submit">统一关闭并推进</button></div></form>`);
        const form = $("#salesStageForm"); let applied=false, renderedStage="", renderRevision=0;
        const batchForm = $("#salesStageBatchForm");
        let batch = null, batchConfirmed = false;
        const openRequests = () => item.supports.filter(request => request.status !== "已关闭");
        const batchUnchanged = () => batch && batch.requests.length === openRequests().length &&
          batch.requests.every((request,index) => request === openRequests()[index]) && JSON.stringify(openRequests()) === batch.snapshot;
        const showBatchClose = requests => {
          batch = {requests:[...requests],snapshot:JSON.stringify(requests)};
          batchConfirmed = false;
          $("#modalLayer .modal-title").textContent = "统一关闭方案支撑";
          $("#modalLayer .modal").classList.add("support-outcome-modal");
          $("#salesStageBatchBody").innerHTML = `<div class="form-group"><label class="form-label">商机名称</label><div>${escapeHtml(item.name)}</div></div><div class="form-group"><label class="form-label">阶段变更</label><div>方案准备 → 比选</div></div><p>以下方案支撑尚未关闭。确认后，方案已提交的请求将验收关闭，其余请求将停止关闭，并推进商机阶段。</p><div class="table-wrap"><table class="support-record-table"><thead><tr><th>请求编号</th><th>支撑人员</th><th>支撑需求</th><th>当前状态</th><th style="width:112px">处理方式</th></tr></thead><tbody>${requests.map(request => `<tr><td>${escapeHtml(request.id)}</td><td>${escapeHtml(request.assignee)}</td><td>${escapeHtml(request.content)}</td><td>${salesSupportStatusTag(request.status)}</td><td>${request.status === "已交付" ? "验收关闭" : "停止关闭"}</td></tr>`).join("")}</tbody></table></div>`;
          form.style.display = "none";
          batchForm.style.display = "";
        };
        $("#salesStageBatchBack").onclick = () => {
          batch = null; batchConfirmed = false;
          batchForm.style.display = "none";
          form.style.display = "";
          $("#modalLayer .modal-title").textContent = "推进商机阶段";
          $("#modalLayer .modal").classList.remove("support-outcome-modal");
        };
        batchForm.onsubmit = event => {
          event.preventDefault();
          if (batchForm !== $("#salesStageBatchForm") || !batch || applied) return;
          batchConfirmed = true;
          form.onsubmit({preventDefault(){}});
        };
        const hasSelectedFields = stage => stage === "中选";
        const valid=correction=> !applied && form === $("#salesStageForm") && currentUser === actor && salesSupportActorActive() && opportunities.includes(item) && (correction ? salesCanCorrect(item) : salesCanProgress(item)) &&
          JSON.stringify({owner:item.owner,result:salesResultSnapshot(item)}) === original;
        const renderFields=()=> {
          const stage=$("#salesNextStage").value;
          const correction = salesStageTransition(item, stage) === "correction";
          renderedStage=stage; renderRevision++;
          $("#salesStageConfirm").textContent=correction ? "确认纠错" : "确认推进";
          $("#salesStageFields").innerHTML=(hasSelectedFields(stage) ? `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>中选日期</label><input class="input" id="salesSelectedDate" aria-required="true" type="date" value="${correction ? escapeHtml(item.selectedDate || "") : ""}"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>成交金额（含税，万元）</label><input class="input" id="salesExpectedContractAmount" aria-required="true" type="number" min="0" step="0.000001" value="${correction ? wanMoneyInput(item.expectedContractAmount) : ""}" aria-describedby="salesInitialAmountReference"><div class="list-sub" id="salesInitialAmountReference">创建时商机金额（含税，万元）：${Number.isFinite(item.initialEstimateAmount) && item.initialEstimateAmount >= 0 ? formatWanMoney(item.initialEstimateAmount) : "未记录"}</div></div>` : "") + (stage === "落选" ? `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>落选原因</label><input class="input" id="salesLossReason" aria-required="true" value="${correction ? escapeHtml(item.lossReason || "") : ""}"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>竞争对手</label><input class="input" id="salesCompetitor" aria-required="true" value="${correction ? escapeHtml(item.competitor || "") : ""}"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>复盘说明</label><textarea class="input" id="salesReview" aria-required="true">${correction ? escapeHtml(item.review || "") : ""}</textarea></div>` : "");
          $("#salesStageEvidence").innerHTML=correction || ["中选","落选"].includes(stage) ? `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>${correction ? "纠错原因与说明" : "说明"}</label><textarea class="input" id="salesStageDescription" aria-required="true" rows="3"></textarea></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>证明材料</label><input class="input" id="salesStageFiles" aria-required="true" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"></div>` : "";
          if (!correction && stage === "需求确认") $("#salesStageEvidence").innerHTML='<div class="form-group"><label class="form-label">需求附件（选填）</label><input class="input" id="salesStageFiles" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"></div>';
          if (!correction && stage === "方案支撑") {
            $("#salesStageFields").innerHTML +=
              `<div class="form-group"><label class="form-label">同时发起方案支撑请求</label><select class="input" id="salesCreateSupport"><option value="否">否</option><option value="是">是</option></select></div>` +
              `<div class="form-group" id="salesSupportPeopleGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label>${salesSupportPeoplePickerHtml("salesSupportPeoplePicker")}</div>` +
              `<div class="form-group" id="salesSupportRequirementGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑需求</label><textarea class="input" id="salesSupportRequirement" rows="3" maxlength="500"></textarea></div>` +
              `<div class="form-group" id="salesSupportDeadlineGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交付截止时间</label><input class="input" id="salesSupportDeadline" type="datetime-local" value=""></div>`;
            bindSalesSupportPickers(form);
            $("#salesCreateSupport").onchange = () => {
              const visible = $("#salesCreateSupport").value === "是";
              ["salesSupportPeopleGroup", "salesSupportRequirementGroup", "salesSupportDeadlineGroup"]
                .forEach(id => $(`#${id}`).hidden = !visible);
            };
          }
          // Loss review is the existing outcome explanation; no second normal-loss explanation.
          if (!correction && stage === "落选") $("#salesStageEvidence").innerHTML='<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>证明材料</label><input class="input" id="salesStageFiles" aria-required="true" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"></div>';
        };
        $("#salesNextStage").onchange=renderFields; renderFields();
        form.onsubmit=event=> {
          event.preventDefault();
          const stage=$("#salesNextStage").value, mode=salesStageTransition(item,stage);
          const correction=mode === "correction", submittedRevision=renderRevision;
          if (!valid(correction)) return toast(batchConfirmed ? "商机或支撑请求已变化，请重新打开操作" : "商机或权限已变化，请重新打开操作");
          if (!mode || !options.includes(stage) || stage !== renderedStage) return toast("当前阶段不允许该操作");
          const withSupport = !correction && stage === "方案支撑" && $("#salesCreateSupport")?.value === "是";
          const people = withSupport ? selectedSalesSupportPeople($("#salesSupportPeoplePicker")) : [];
          const deadline = withSupport ? $("#salesSupportDeadline").value : "";
          const content = withSupport ? $("#salesSupportRequirement").value.trim() : "";
          if (withSupport) {
            if (!people.length || !deadline || !content) return toast("请填写全部必填支撑信息");
            if (!validSalesSupportSelection(people)) return toast("支撑人员已不符合当前候选条件，请重新选择");
            if (people.some(code => salesHasOpenSupport(item, code))) return toast("该商机已有所选人员的未关闭支撑请求，请重新选择");
          }
          const restoredOwner = correction && item.stage === "落选" && stage !== "落选" ? salesOpportunityOwnerMatch(item) : null;
          if (restoredOwner && !restoredOwner.ok) return toast(isEcosystemOpportunity(item) ? "当前商机负责人不符合生态合作员条件，暂不能恢复" : "客户没有唯一有效负责人，请先完成客户责任配置");
          const before=salesResultSnapshot(item), after={...before,stage};
          if (hasSelectedFields(stage)) {
            const date=$("#salesSelectedDate").value, amount=$("#salesExpectedContractAmount").value.trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (!Number.isFinite(Date.parse(date+"T00:00:00Z")) || new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date) || !amount || salesMoneyCents(parseWanMoney(amount)) === null) return toast("请填写中选日期和成交金额（含税，万元）");
            after.selectedDate=date;after.expectedContractAmount=parseWanMoney(amount);
          } else if (correction && stage !== item.stage) {after.selectedDate="";after.expectedContractAmount=null;}
          if (stage === "落选") {
            after.lossReason=$("#salesLossReason").value.trim();after.competitor=$("#salesCompetitor").value.trim();after.review=$("#salesReview").value.trim();
            if (!after.lossReason || !after.competitor || !after.review) return toast("请填写落选原因、竞争对手和复盘说明");
          }
          const evidence=correction || ["中选","落选"].includes(stage);
          const description=evidence ? (!correction && stage === "落选" ? after.review : $("#salesStageDescription").value.trim()) : "";
          const uploads=evidence || (!correction && stage === "需求确认") ? Array.from($("#salesStageFiles").files || []) : [];
          if (evidence && (!description || !uploads.length)) return toast("请填写说明并上传证明材料");
          if (uploads.length && !hasAttachmentPermission("attachment_upload")) return toast("当前无法上传商机材料");
          const error=validateAttachmentFiles(uploads,evidence);
          if (error) return toast(error);
          if (uploads.some(file=>!file.size || file.name.length>200)) return toast("附件为空或文件名过长，请重新选择");
          const closesForStage = !correction && item.stage === "方案支撑" && stage === "比选";
          if (batchConfirmed && (!closesForStage || !batchUnchanged())) return toast("商机或支撑请求已变化，请重新打开操作");
          if (closesForStage) {
            const requests = openRequests();
            if (requests.some(request => !["待响应","进行中","已交付"].includes(request.status) ||
                !salesCanRunSupportAction(item,request,request.status === "已交付" ? "close" : "stop")))
              return toast("商机或支撑请求已变化，请重新打开操作");
            if (requests.length && !batchConfirmed) return showBatchClose(requests);
          }
          const files=[];
          try {for (const file of uploads) files.push({name:file.name,url:URL.createObjectURL(file)});}
          catch {files.forEach(file=>URL.revokeObjectURL(file.url));return toast("文件上传失败，请重新选择");}
          const finalRestoreMatch=restoredOwner ? salesOpportunityOwnerMatch(item) : null;
          if (!valid(correction) || (uploads.length && !hasAttachmentPermission("attachment_upload")) || $("#salesNextStage").value !== stage || renderRevision !== submittedRevision || salesStageTransition(item,stage) !== mode || (restoredOwner && (!finalRestoreMatch.ok || finalRestoreMatch.owner.code!==restoredOwner.owner.code))) {files.forEach(file=>URL.revokeObjectURL(file.url));return toast("商机或权限已变化，请重新打开操作");}
          if (batchConfirmed && !batchUnchanged()) {files.forEach(file=>URL.revokeObjectURL(file.url));return toast("商机或支撑请求已变化，请重新打开操作");}
          const requests = withSupport ? salesBuildSupportRequests(item, people, deadline, content) : [];
          const time=salesSupportNow();
          if (before.selectedDate) salesCapturePerformance(item);
          if (restoredOwner && restoredOwner.owner.name !== item.owner) {
            item.reassignments ||= [];
            item.reassignments.push({before:item.owner,after:restoredOwner.owner.name,reason:description,operator:actor.name,time,source:"落选恢复"});
            item.owner=restoredOwner.owner.name;
          }
          Object.assign(item,after,{updatedAt:time});
          item.supports.push(...requests);
          if (!after.selectedDate) {delete item.performanceOwnerCode;delete item.performanceOwnerName;delete item.performanceRegion;}
          else if (!before.selectedDate) salesCapturePerformance(item);
          if (before.stage !== stage) item.stageChangedAt=time;
          if (stage === "落选") {
            item.nextFollowDate="";
            item.supports.filter(request=>request.status !== "已关闭").forEach(request=>salesCloseSupport(item,request,"stop","商机落选",time));
          }
          if (closesForStage && batchConfirmed) batch.requests.forEach(request => {
            const accepted = request.status === "已交付";
            salesCloseSupport(item,request,accepted ? "accepted" : "stop",accepted ? "商机进入比选，统一验收关闭" : "商机进入比选，停止未完成支撑",time);
          });
          item.histories.push({time,from:before.stage,to:stage,operator:actor.name,action:correction ? "纠错" : "推进阶段",description,files,
            ...(correction ? {before,after:{...after},reason:description} : {result:{...after}})});
          applied=true;closeOverlay();renderPage();toast(correction ? "商机纠错已完成，业绩已重新计算" : `商机已进入${salesStageLabel(stage)}`);
          if (stage === "中选") openSalesProjectCreationPrompt(item);
        };
      }

      function salesFollowupPeople(item) {
        return contacts.filter(person => person.company === item.customer &&
          contactIsActive(person) && item.keyPeople.includes(person.name));
      }

      function salesFollowupRegularTasks(person) {
        return tasks.filter(task => task.personId === person.id && task.company === person.company &&
          task.pm === currentUser.name && task.type === "常规维系" &&
          ["pending", "overdue"].includes(task.status));
      }

      function openSalesFollowupModal(item) {
        if (!salesCanProgress(item) || item.stage === "落选") return;
        const actor = currentUser, actorKey = maintenanceActorSnapshot();
        const original = JSON.stringify([item.customer, item.owner, item.stage, item.keyPeople]);
        const ecosystem = isEcosystemOpportunity(item);
        let applied = false;
        const methods = ["电话", "微信", "线下拜访", "视频会议", "邮件", "其他"];
        const accept = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
        const required = '<span class="required-marker" aria-hidden="true">*</span>';
        const formHtml = [
          '<div class="modal-head"><div class="modal-title">新增商机跟进</div><button class="icon-btn close" data-close title="关闭">×</button></div>',
          `<form id="salesFollowupForm"><div class="modal-body"><div class="sales-followup-layout ${ecosystem ? "sales-followup-without-tasks" : ""}"><div class="form-grid sales-modal-grid">`,
          `<div class="form-group"><label class="form-label" for="followTime">${required}维系时间</label><input class="input" id="followTime" type="datetime-local" max="${DEMO_TODAY}T12:00" value="${DEMO_TODAY}T11:30" required></div>`,
          `<div class="form-group"><label class="form-label" for="followMethod">${required}维系方式</label><select class="input" id="followMethod">${methods.map(method => `<option>${method}</option>`).join("")}</select></div>`,
          `<div class="form-group full" id="followOtherMethodGroup" hidden><label class="form-label" for="followOtherMethod">${required}其他方式说明</label><input class="input" id="followOtherMethod" minlength="2" maxlength="30" placeholder="请填写 2-30 字"></div>`,
          ecosystem ? "" : `<div class="form-group full" id="followPeoplePicker"><label class="form-label" id="followPeopleLabel" for="followPeopleTrigger">${required}参与关键人</label><select id="followPeople" multiple hidden aria-hidden="true" tabindex="-1">${salesFollowupPeople(item).map(person => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join("")}</select><div class="multi-select sales-support-select"><button class="multi-select-trigger" type="button" id="followPeopleTrigger" aria-labelledby="followPeopleLabel" aria-expanded="false" aria-controls="followPeopleMenu"><span>请选择参与关键人</span><span aria-hidden="true">⌄</span></button><div class="multi-select-menu hidden" id="followPeopleMenu"><input class="input" type="search" id="followPeopleSearch" placeholder="搜索关键人" aria-label="搜索参与关键人">${salesFollowupPeople(item).map(person => `<label class="multi-select-option" data-follow-person-option><input type="checkbox" data-follow-person value="${person.id}"><span>${escapeHtml(person.name)}</span></label>`).join("")}</div></div><div class="sales-support-selected-list" id="followPeopleSelected" aria-live="polite"></div></div>`,
          `<div class="form-group"><label class="form-label" for="followSummary">${required}沟通摘要</label><textarea class="input" id="followSummary" minlength="5" maxlength="1000" rows="3" required></textarea></div>`,
          `<div class="form-group"><label class="form-label" for="followFeedback">${required}客户反馈</label><textarea class="input" id="followFeedback" minlength="5" maxlength="1000" rows="3" required></textarea></div>`,
          `<div class="form-group full"><label class="form-label" for="followNextAction">${required}下一步计划</label><textarea class="input" id="followNextAction" maxlength="1000" rows="2" required></textarea></div>`,
          `<div class="form-group"><label class="form-label" for="followRisk">${required}当前风险</label><select class="input" id="followRisk">${SALES_RISKS.map(risk => `<option>${risk}</option>`).join("")}</select></div>`,
          `<div class="form-group"><label class="form-label" for="followNextDate">${required}下次跟进日期</label><input class="input" id="followNextDate" type="date" min="${salesNextBusinessDate()}" required></div>`,
          `<div class="form-group full" id="followRiskOtherGroup" hidden><label class="form-label" for="followRiskOther">${required}其他风险说明</label><input class="input" id="followRiskOther" maxlength="200" placeholder="请说明具体风险"></div>`,
          `<div class="form-group full"><label class="form-label" for="followAttachment">附件</label><input class="input" id="followAttachment" type="file" multiple accept="${accept}"><div class="list-sub">单文件≤20MB，最多9个，总计≤100MB</div></div>`,
          `</div>${ecosystem ? "" : '<aside class="sales-followup-tasks"><label class="checkbox-line"><input type="checkbox" id="followSyncMaintenance" checked>同步新增维系记录</label><div id="followMaintenanceTasks"></div></aside>'}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存跟进</button></div></form>`,
        ].join("");
        openModal(formHtml);
        $("#modalLayer .modal")?.classList.add("sales-followup-modal");
        const form = $("#salesFollowupForm");
        const sync = () => !ecosystem && $("#followSyncMaintenance").checked;
        const selectedPeople = () => ecosystem ? [] : selectedValues($("#followPeople")).map(id => contacts.find(person => String(person.id) === id));
        const valid = () => !applied && form === $("#salesFollowupForm") && actor === currentUser &&
          actorKey === maintenanceActorSnapshot() && salesCanProgress(item) && item.stage !== "落选" &&
          original === JSON.stringify([item.customer, item.owner, item.stage, item.keyPeople]);
        const choices = new Map();
        const personKey = person => JSON.stringify([person, customers.find(company => company.name === person.company), customerOwnerName(customers.find(company => company.name === person.company))]);
        const refreshTasks = () => {
          if (ecosystem) return;
          const people = selectedPeople().filter(Boolean);
          $("#followPeopleSelected").innerHTML = people.map(person => `<span class="sales-support-selected-item"><span>${escapeHtml(person.name)}</span><button class="sales-support-selected-remove" type="button" data-follow-person-remove="${person.id}" aria-label="移除${escapeHtml(person.name)}">×</button></span>`).join("");
          document.querySelectorAll("[data-follow-person]").forEach(input => {
            input.checked = people.some(person => String(person.id) === input.value);
          });
          const area = $("#followMaintenanceTasks");
          area.hidden = !sync();
          area.style.display = sync() ? "" : "none";
          const keep = new Set(people.map(person => person.id));
          for (const id of choices.keys()) if (!keep.has(id)) choices.delete(id);
          if (!sync()) return;
          area.innerHTML = !people.length ? '<div class="list-sub">请选择参与关键人</div>' :
            people.map(person => {
              const matches = salesFollowupRegularTasks(person), task = matches.length === 1 ? matches[0] : null;
              const old = choices.get(person.id), key = JSON.stringify(matches);
              const choice = old && old.taskKey === key ? old : { checked: Boolean(task && taskCanTakeAction(task)), task, taskKey: key, reason: "", files: [] };
              choice.personKey = personKey(person);
              choices.set(person.id, choice);
              const canComplete = task && taskCanTakeAction(task);
              const description = matches.length > 1 ? '存在多条有效常规维系任务，请联系管理员；本次可仅新增记录' :
                task ? `${escapeHtml(task.title)} · 截止 ${escapeHtml(task.due)}${canComplete ? "" : " · 当前无完成权限，本次仅新增记录"}` : '无可关联的常规维系任务，仅新增记录';
              return `<div class="sales-followup-task"><strong>${escapeHtml(person.name)}</strong><div class="list-sub">${description}</div>${canComplete ? `<label class="checkbox-line"><input type="checkbox" id="followTask-${person.id}" ${choice.checked ? "checked" : ""}>关联并完成任务</label><div id="followLateGroup-${person.id}" class="form-grid"><div class="form-group"><label class="form-label" for="followLateReason-${person.id}">${required}延迟登记原因</label><textarea class="input" id="followLateReason-${person.id}" minlength="5" maxlength="500" rows="2">${escapeHtml(choice.reason)}</textarea></div><div class="form-group"><label class="form-label" for="followLateFiles-${person.id}">${required}补录证明材料</label><input class="input" id="followLateFiles-${person.id}" type="file" multiple accept="${accept}"></div></div>` : ""}</div>`;
            }).join("");
          people.forEach(person => {
            const choice = choices.get(person.id), check = $(`#followTask-${person.id}`);
            if (!choice.task || !taskCanTakeAction(choice.task) || !check) return;
            check.checked = choice.checked;
            const updateLate = () => {
              choice.checked = check.checked;
              const late = choice.checked && (choice.task.status === "overdue" || choice.task.everOverdue) && $("#followTime").value.slice(0,10) <= choice.task.due;
              $(`#followLateGroup-${person.id}`).hidden = !late;
              $(`#followLateGroup-${person.id}`).style.display = late ? "" : "none";
              $(`#followLateReason-${person.id}`).required = late;
              $(`#followLateReason-${person.id}`).disabled = !late;
              $(`#followLateFiles-${person.id}`).disabled = !late;
            };
            check.onchange = updateLate;
            $(`#followLateReason-${person.id}`).oninput = () => { choice.reason = $(`#followLateReason-${person.id}`).value; };
            const upload = $(`#followLateFiles-${person.id}`);
            upload.onchange = () => { choice.files = Array.from(upload.files || []); };
            // Keep the selected FileList when only another field changes.
            if (choice.files.length) { const transfer = typeof DataTransfer === "function" ? new DataTransfer() : null;
              if (transfer) { choice.files.forEach(file => transfer.items.add(file)); upload.files = transfer.files; } }
            updateLate();
          });
        };
        if (!ecosystem) {
          $("#followPeople").onchange = refreshTasks;
          const trigger = $("#followPeopleTrigger"), menu = $("#followPeopleMenu"), search = $("#followPeopleSearch");
          const setOpen = open => {
            trigger.setAttribute("aria-expanded", String(open));
            menu.classList.toggle("hidden", !open);
            if (open) search.focus();
            else {
              search.value = "";
              document.querySelectorAll("[data-follow-person-option]").forEach(option => { option.hidden = false; });
            }
          };
          trigger.onclick = () => setOpen(trigger.getAttribute("aria-expanded") !== "true");
          search.oninput = () => {
            const keyword = search.value.trim().toLocaleLowerCase("zh-CN");
            document.querySelectorAll("[data-follow-person-option]").forEach(option => {
              option.hidden = !option.textContent.toLocaleLowerCase("zh-CN").includes(keyword);
            });
          };
          search.onkeydown = event => { if (event.key === "Enter") event.preventDefault(); };
          $("#followPeoplePicker").onkeydown = event => {
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.focus(); }
          };
          const selectPerson = (id, checked) => {
            const option = Array.from($("#followPeople").options).find(option => option.value === id);
            if (option) option.selected = checked;
            refreshTasks();
          };
          document.querySelectorAll("[data-follow-person]").forEach(input => {
            input.onchange = () => selectPerson(input.value, input.checked);
          });
          $("#followPeopleSelected").onclick = event => {
            const remove = event.target.closest("[data-follow-person-remove]");
            if (remove) selectPerson(remove.dataset.followPersonRemove, false);
          };
          form.addEventListener("click", event => { if (!event.target.closest("#followPeoplePicker")) setOpen(false); });
          $("#followSyncMaintenance").onchange = refreshTasks;
          refreshTasks();
        }
        $("#followTime").onchange = refreshTasks;
        $("#followMethod").onchange = () => {
          const other = $("#followMethod").value === "其他";
          $("#followOtherMethodGroup").hidden = !other;
          $("#followOtherMethodGroup").style.display = other ? "" : "none";
          $("#followOtherMethod").required = other;
          $("#followOtherMethod").disabled = !other;
        };
        $("#followMethod").onchange();
        $("#followRisk").onchange = () => {
          const other = $("#followRisk").value === "其他";
          $("#followRiskOtherGroup").hidden = !other;
          $("#followRiskOtherGroup").style.display = other ? "" : "none";
          $("#followRiskOther").required = other;
          $("#followRiskOther").disabled = !other;
        };
        $("#followRisk").onchange();
        form.onsubmit = event => {
          event.preventDefault();
          if (!valid()) return toast("商机或权限已变化，请重新打开操作");
          if (ecosystem && $("#followSyncMaintenance")?.checked) return toast("平台师资合作商机不支持同步维系记录");
          const ids = ecosystem ? [] : selectedValues($("#followPeople"));
          const people = [...new Set(ids)].map(id => salesFollowupPeople(item).find(person => String(person.id) === id));
          const time = $("#followTime").value, date = time.slice(0,10), method = $("#followMethod").value;
          const summary = $("#followSummary").value.trim(), feedback = $("#followFeedback").value.trim();
          const next = $("#followNextAction").value.trim(), nextDate = $("#followNextDate").value;
          const risk = $("#followRisk").value, riskOther = $("#followRiskOther").value.trim(), otherMethod = $("#followOtherMethod").value.trim();
          const now = salesSupportNow();
          if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time) || time.replace("T"," ") > now) return toast("维系时间不得晚于提交时间");
          if (!methods.includes(method)) return toast("请选择有效的维系方式");
          if (method === "其他" && (otherMethod.length < 2 || otherMethod.length > 30)) return toast("请填写 2-30 字其他方式说明");
          const validText = text => text.length >= 5 && text.length <= 1000 && !/^(.)\1+$/u.test(text) && /[\p{L}\p{N}]/u.test(text);
          if (!validText(summary) || !validText(feedback)) return toast("沟通摘要和客户反馈需填写5-1000字有效内容");
          if (!next || next.length > 1000 || !nextDate || nextDate <= date) return toast("请填写下一步计划及晚于本次维系时间的下次跟进日期");
          if (!SALES_RISKS.includes(risk) || (risk === "其他" && (!riskOther || riskOther.length > 200))) return toast("请填写有效的当前风险及说明");
          if (!ecosystem && !people.length) return toast("请选择参与关键人");
          if (!ecosystem && people.some(person => !person)) return toast("关键人范围已变化，请按当前客户有效关键人重新选择");
          const files = Array.from($("#followAttachment").files || []), fileError = validateAttachmentFiles(files);
          if (fileError) return toast(fileError);
          if (files.length && !hasAttachmentPermission("attachment_upload")) return toast("当前无法上传商机材料");
          const plans = [];
          if (sync()) {
            if (!canCreateMaintenanceRecord()) return toast("当前账号无权同步新增维系记录，可取消同步后保存跟进");
            for (const person of people) {
              if (!maintenanceContactCandidates().includes(person) || date < (person.effectiveDate || "1900-01-01")) return toast("关键人责任或维系时间已变化，请检查后提交");
              const choice = choices.get(person.id), matches = salesFollowupRegularTasks(person);
              if (!choice || choice.personKey !== personKey(person) || choice.taskKey !== JSON.stringify(matches)) return toast("客户或任务已变化，请重新选择参与关键人后提交");
              const checked = matches.length === 1 && Boolean($(`#followTask-${person.id}`)?.checked);
              const task = checked ? matches[0] : null;
              if (task && (!taskCanTakeAction(task) || task !== choice.task)) return toast("任务或权限已变化，请重新打开操作");
              const lateEntry = task && (task.status === "overdue" || task.everOverdue) && date <= task.due;
              const reason = lateEntry ? $(`#followLateReason-${person.id}`).value.trim() : "";
              const evidence = lateEntry ? Array.from($(`#followLateFiles-${person.id}`).files || []) : [];
              if (lateEntry && (reason.length < 5 || reason.length > 500)) return toast(`${person.name}：延迟登记原因需填写5-500字`);
              const evidenceError = validateAttachmentFiles(evidence, Boolean(lateEntry));
              if (evidenceError) return toast(`${person.name}：${evidenceError}`);
              if (evidence.length && !hasAttachmentPermission("attachment_upload")) return toast("当前无法上传补录证明材料");
              if (task && lateCompletionBlockReason(task,date)) return toast(lateCompletionBlockReason(task,date));
              plans.push({person, task, lateEntry, reason, evidence});
            }
          }
          // Preflight all participants before mutating either module. Roll back business state if a
          // simulated completion/renewal fails, preserving the original object identities.
          const snapshots = [item, ...tasks, ...plans.map(plan => plan.person)].map(object => [object, structuredClone(object)]);
          const oldTasks = tasks.slice(), oldRecords = maintenanceRecords.slice(), oldThemes = taskThemes.slice();
          const counters = {business: {...businessCodeCounters}, executions: {...taskExecutionCounters}};
          try {
            let id = Math.max(Date.now(), ...maintenanceRecords.map(record => Number(record.id) || 0));
            for (const plan of plans) {
              const record = {id: ++id, personId: plan.person.id, person: plan.person.name, company: plan.person.company,
                opportunityIds: [item.id], method, otherMethod: method === "其他" ? otherMethod : "", date,
                maintenanceAt: time.replace("T"," "), summary, feedback, next, attachments: files.map(file => file.name),
                createdAt: now, updatedAt: now, createdBy: currentUser.name, createdByCode: employeeUsageEmployee()?.code || "",
                pm: currentUser.name, region: plan.person.region, taskId: plan.task?.id};
              record.code = maintenanceRecordCode(record);
              if (plan.lateEntry) acceptLateEntry(plan.task,record,plan.reason,plan.evidence.map(file => file.name));
              else { maintenanceRecords.unshift(record); if (plan.task) finalizeTaskCompletion(plan.task,record,date > plan.task.due ? "late_completion" : "on_time"); }
              plan.person.last = date; plan.person.status = "健康";
            }
            item.followUps.push({time: time.replace("T"," "), method, otherMethod: method === "其他" ? otherMethod : "",
              people: people.map(person => person.name).join("、"), summary, feedback, nextAction: next,
              risk: risk === "其他" ? `其他：${riskOther}` : risk, nextDate, attachments: files.map(file => file.name), operator: currentUser.name});
            item.nextFollowDate = nextDate; item.updatedAt = now;
          } catch {
            snapshots.forEach(([object, snapshot]) => { Object.keys(object).forEach(key => delete object[key]); Object.assign(object,snapshot); });
            tasks.splice(0,tasks.length,...oldTasks); maintenanceRecords.splice(0,maintenanceRecords.length,...oldRecords); taskThemes.splice(0,taskThemes.length,...oldThemes);
            for (const [target, backup] of [[businessCodeCounters,counters.business],[taskExecutionCounters,counters.executions]]) {Object.keys(target).forEach(key => delete target[key]); Object.assign(target,backup);}
            return toast("保存失败，跟进与维系均未保存，请重试");
          }
          const synced = sync();
          applied = true;
          closeOverlay(); renderPage(); toast(synced ? "跟进及维系记录已保存" : "跟进记录已保存");
        };
      }

      function salesBuildSupportRequests(item, people, deadline, content) {
        const count = opportunities.flatMap(row => row.supports).length;
        const time = salesSupportNow();
        return people.map((code, index) => {
          const assignee = employees.find(employee => employee.code === code).name;
          return {
            id: `ZC-${String(count + index + 1).padStart(3, "0")}`,
            assigneeCode: code, assignee, deadline: deadline.replace("T", " "),
            status: "待响应", content, delivery: "",
            histories: [{time, action: "发起请求", description: content,
              operator: currentUser.name, owner: item.owner, assignee}],
          };
        });
      }

      function openSalesSupportModal(item) {
        if (!salesCanInitiateSupport(item)) return toast("当前无法执行该支撑操作");
        const formHtml = [
          '<div class="modal-head"><div class="modal-title">请求支撑</div><button class="icon-btn close" data-close title="关闭">×</button></div>',
          '<form id="salesSupportForm"><div class="modal-body">',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label>${salesSupportPeoplePickerHtml("supportPeoplePicker")}</div>`,
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交付截止时间</label><input class="input" id="supportDeadline" type="datetime-local" value=""></div>`,
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑需求</label><textarea class="input" id="supportContent" rows="3"></textarea></div>',
          '</div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">请求支撑</button></div></form>',
        ].join("");
        openModal(
          formHtml,
        );
        const supportPicker = $("#supportPeoplePicker"), supportActor=currentUser, supportForm=$("#salesSupportForm");
        let supportApplied=false;
        bindSalesSupportPickers(supportForm);
        supportForm.onsubmit = (event) => {
          event.preventDefault();
          if(supportApplied || supportForm!==$("#salesSupportForm") || currentUser!==supportActor) return toast("当前无法执行该支撑操作");
          const people = selectedSalesSupportPeople(supportPicker);
          const deadline = $("#supportDeadline").value;
          const content = $("#supportContent").value.trim();
          if (!people.length || !deadline || !content) return toast("请填写全部必填支撑信息");
          if (!salesCanInitiateSupport(item)) return toast("当前无法执行该支撑操作");
          if (!validSalesSupportSelection(people)) return toast("支撑人员已不符合当前候选条件，请重新选择");
          if (people.some(code=>salesHasOpenSupport(item,code))) return toast("该商机已有所选人员的未关闭支撑请求，请重新选择");
          const requests = salesBuildSupportRequests(item, people, deadline, content);
          item.supports.push(...requests);
          supportApplied=true;
          item.updatedAt = salesNow();
          closeOverlay();
          renderPage();
          toast("方案支撑已发起");
        };
      }

      function handleSupportAction(item, support, action) {
        if (!salesSupportActorActive() || !opportunities.includes(item) || !salesCanRunSupportAction(item, support, action)) return toast("当前无法执行该支撑操作");
        const actionLabel = {
          respond: "确认接收",
          deliver: "提交支撑文件",
          close: "确认接收交付",
          supplement: "要求补充",
        }[action];
        const recordHistory = (details = {}) => {
          support.histories = support.histories || [];
          support.histories.push({
            time: salesSupportNow(),
            action: actionLabel,
            operator: currentUser.name,
            owner: item.owner,
            assignee: support.assignee,
            ...details,
          });
        };
        if (["withdraw","stop"].includes(action)) {
          const actor=currentUser, assigneeCode=support.assigneeCode, status=support.status;
          const title=action === "withdraw" ? "撤回支撑" : "停止支撑";
          openModal(`<div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn close" data-close>×</button></div><form id="supportStopForm"><div class="modal-body"><p>${escapeHtml(item.name)} · ${escapeHtml(support.assignee)}</p>${action === "stop" ? '<div class="form-group"><label class="form-label">关闭原因</label><textarea class="input" id="supportStopReason"></textarea></div>' : ""}<p>确认后本次请求关闭，需要支撑时请新增请求。</p></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-danger" type="submit">确认${title}</button></div></form>`);
          const form=$("#supportStopForm");
          form.onsubmit=event=> {
            event.preventDefault();
            if (form !== $("#supportStopForm") || currentUser !== actor || !salesSupportActorActive() || support.assigneeCode !== assigneeCode || support.status !== status || !opportunities.includes(item) || !salesCanRunSupportAction(item,support,action)) return toast("当前无法执行该支撑操作");
            const reason=action === "withdraw" ? "负责人撤回" : $("#supportStopReason").value.trim();
            if (!reason) return toast("请填写关闭原因");
            salesCloseSupport(item,support,action,reason);closeOverlay();renderPage();toast("方案支撑状态已更新");
          };
          return;
        }
        if (action === "respond") {
          const actor = currentUser;
          const assigneeCode = support.assigneeCode;
          openModal(
            `<div class="modal-head"><div class="modal-title">确认接收支撑需求</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="supportReceiptForm"><div class="modal-body"><div class="form-group"><label class="form-label">商机名称</label><div>${escapeHtml(item.name)}</div></div><div class="form-group"><label class="form-label">支撑需求</label><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(support.content)}</div></div><div class="form-group"><label class="form-label">交付截止时间</label><div>${escapeHtml(support.deadline)}</div></div><p>确认后，该支撑需求将进入进行中。</p></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认接收</button></div></form>`,
          );
          const form = $("#supportReceiptForm");
          form.onsubmit = (event) => {
            event.preventDefault();
            if (form !== $("#supportReceiptForm") || currentUser !== actor || !salesSupportActorActive() || support.assigneeCode !== assigneeCode || !opportunities.includes(item) || !salesCanRunSupportAction(item, support, "respond"))
              return toast("当前无法执行该支撑操作");
            support.status = "进行中";
            recordHistory();
            item.updatedAt = salesSupportNow();
            closeOverlay();
            renderPage();
            toast("已接收，支撑需求已进入进行中。");
          };
          return;
        }
        if (action === "supplement") {
          const actor = currentUser;
          const assigneeCode = support.assigneeCode;
          openModal(`<div class="modal-head"><div class="modal-title">要求补充</div><button class="icon-btn close" type="button" data-close title="关闭">×</button></div><form id="supportSupplementForm"><div class="modal-body"><div class="form-group"><label class="form-label">商机名称</label><div>${escapeHtml(item.name)}</div></div><div class="form-group"><label class="form-label">支撑人员</label><div>${escapeHtml(support.assignee)}</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>补充或修改说明</label><textarea class="input" id="supportSupplementDescription" rows="4"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交补充要求</button></div></form>`);
          const form = $("#supportSupplementForm");
          form.onsubmit = (event) => {
            event.preventDefault();
            if (form !== $("#supportSupplementForm") || currentUser !== actor || !salesSupportActorActive() ||
                support.assigneeCode !== assigneeCode || !opportunities.includes(item) || !salesCanRunSupportAction(item, support, "supplement"))
              return toast("当前无法执行该支撑操作");
            const description = $("#supportSupplementDescription").value.trim();
            if (!description) return toast("请填写补充或修改说明");
            support.status = "进行中";
            recordHistory({ description });
            item.updatedAt = salesSupportNow();
            closeOverlay();
            renderPage();
            toast("补充要求已提交");
          };
          return;
        }
        if (action === "close") {
          const actor = currentUser;
          const assigneeCode = support.assigneeCode;
          const delivery = support.deliveries?.at(-1);
          const deliverySnapshot = JSON.stringify({ description: support.delivery, files: salesSupportDeliveryFiles(support) });
          openModal(`<div class="modal-head"><div class="modal-title">确认接收支撑方案</div><button class="icon-btn close" type="button" data-close title="关闭">×</button></div><form id="supportAcceptanceForm"><div class="modal-body"><div class="form-group"><label class="form-label">商机名称</label><div>${escapeHtml(item.name)}</div></div><div class="form-group"><label class="form-label">支撑人员</label><div>${escapeHtml(support.assignee)}</div></div><p>确认接收该支撑方案并关闭本次支撑请求？</p></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认接收</button></div></form>`);
          const form = $("#supportAcceptanceForm");
          form.onsubmit = (event) => {
            event.preventDefault();
            if (form !== $("#supportAcceptanceForm") || currentUser !== actor || !salesSupportActorActive() ||
                support.assigneeCode !== assigneeCode || !opportunities.includes(item) || !salesCanRunSupportAction(item, support, "close") ||
                support.deliveries?.at(-1) !== delivery ||
                JSON.stringify({ description: support.delivery, files: salesSupportDeliveryFiles(support) }) !== deliverySnapshot)
              return toast("当前无法执行该支撑操作");
            support.status = "已关闭";
            support.closureKind = "accepted";
            recordHistory();
            item.updatedAt = salesSupportNow();
            closeOverlay();
            renderPage();
            toast("方案支撑状态已更新");
          };
          return;
        }
        if (!hasAttachmentPermission("attachment_upload")) return toast("当前无法执行该支撑操作");
        openModal(
          `<div class="modal-head"><div class="modal-title">提交支撑文件</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="supportDeliveryForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>文件说明</label><textarea class="input" id="supportDelivery" rows="3"></textarea></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>文件附件</label><input class="input" id="supportDeliveryFile" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交支撑文件</button></div></form>`,
        );
        const deliveryForm = $("#supportDeliveryForm");
        const deliveryActor = currentUser;
        const deliveryAssignee = support.assigneeCode;
        deliveryForm.onsubmit = (event) => {
          event.preventDefault();
          if (deliveryForm !== $("#supportDeliveryForm") || currentUser !== deliveryActor || !salesSupportActorActive() || support.assigneeCode !== deliveryAssignee || !opportunities.includes(item) || !salesCanRunSupportAction(item, support, "deliver")) return toast("当前无法执行该支撑操作");
          const delivery = $("#supportDelivery").value.trim();
          if (!delivery) return toast("请填写文件说明");
          if (!hasAttachmentPermission("attachment_upload")) return toast("当前无法执行该支撑操作");
          const files = Array.from($("#supportDeliveryFile").files || []);
          if (!files.length) return toast("请至少上传一个支撑文件");
          const error = validateAttachmentFiles(files, true);
          if (error) return toast(error);
          if (files.some((file) => !file.size || file.name.length > 200)) return toast("附件为空或文件名过长，请重新选择");
          const deliveryFiles = [];
          try {
            for (const file of files) deliveryFiles.push({ name: file.name, url: URL.createObjectURL(file) });
          } catch {
            deliveryFiles.forEach((file) => URL.revokeObjectURL(file.url));
            return toast("文件上传失败，请重新选择");
          }
          support.deliveries ||= [];
          const submission = { description: delivery, files: deliveryFiles, operator: currentUser.name, time: salesSupportNow() };
          const repeated = support.deliveries.length > 0;
          support.deliveries.push(submission);
          support.deliveryFiles = deliveryFiles;
          delete support.deliveryFile;
          support.delivery = delivery;
          support.status = "已交付";
          recordHistory({ time: submission.time, action: repeated ? "重新交付" : actionLabel, description: delivery, delivery: submission });
          item.updatedAt = salesSupportNow();
          closeOverlay();
          renderPage();
          toast("方案已提交");
        };
      }

      function openSupportDeliveryDetail(item, support) {
        if (!salesCanViewSupportFile(item, support) || !(support.delivery || salesSupportDeliveryFiles(support).length))
          return toast("当前无法执行该支撑操作");
        openModal(`<div class="modal-head"><div class="modal-title">交付详情</div><button class="icon-btn close" data-close title="关闭">×</button></div><div class="modal-body"><div class="form-group"><label class="form-label">文件说明</label><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(support.delivery || "—")}</div></div><div class="form-group"><label class="form-label">文件附件</label>${supportFileHtml(item, support)}</div></div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button></div>`);
        bindSalesSupportFileEvents();
      }

      function openSupportHistory(item, support) {
        if (!salesCanViewSupportFile(item, support)) return toast("当前无法执行该支撑操作");
        const records = (support.histories || []).map((record, index) => ({ record, index }))
          .sort((a, b) => String(b.record.time || "").localeCompare(String(a.record.time || "")) || b.index - a.index);
        const entries = records.map(({ record }) => {
          const deliveryIndex = record.delivery ? (support.deliveries || []).indexOf(record.delivery) : -1;
          const delivery = deliveryIndex >= 0 ? record.delivery : null;
          return `<li><div class="sales-support-history-heading"><strong>${escapeHtml(record.action || "—")}</strong><span>${escapeHtml(record.time || "—")}</span><span>${escapeHtml(record.operator || "—")}</span></div><div class="sales-support-history-description">${escapeHtml(delivery?.description || record.description || "—")}</div>${delivery ? supportFileHtml(item, support, deliveryIndex) : ""}</li>`;
        }).join("");
        openModal(`<div class="modal-head"><div class="modal-title">支撑历程</div><button class="icon-btn close" type="button" data-close title="关闭">×</button></div><div class="modal-body"><div class="form-group"><label class="form-label">商机名称</label><div>${escapeHtml(item.name)}</div></div><div class="form-group"><label class="form-label">支撑人员</label><div>${escapeHtml(support.assignee)}</div></div>${entries ? `<ol class="sales-support-history">${entries}</ol>` : '<div class="empty">暂无支撑历程</div>'}</div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button></div>`);
        bindSalesSupportFileEvents();
      }

      function bindSalesSupportFileEvents() {
        document.querySelectorAll("[data-support-file]").forEach((button) => {
          const item = opportunities.find((row) => row.id === button.dataset.supportOpportunity);
          const support = item?.supports.find((row) => row.id === button.dataset.supportId);
          const index = Number(button.dataset.supportFileIndex);
          const historyIndex = button.dataset.supportHistoryDelivery;
          const delivery = historyIndex === undefined ? undefined : /^\d+$/.test(historyIndex) ? support?.deliveries?.[Number(historyIndex)] || null : null;
          const file = (delivery === undefined ? salesSupportDeliveryFiles(support) : delivery?.files || [])[index];
          button.onclick = () => openSalesSupportFile(item, support, button.dataset.supportFile, index, file, delivery);
        });
      }

      function openSalesSupportFile(item, support, action, index = 0, expectedFile, delivery) {
        const permission = action === "download" ? "attachment_download" : "attachment_view";
        if (!["view", "download"].includes(action) || !salesCanViewSupportFile(item, support) ||
            !hasAttachmentPermission(permission) || !Number.isInteger(index) || index < 0)
          return toast("当前无法执行该支撑操作");
        if (delivery !== undefined && (!delivery || !support.deliveries?.includes(delivery)))
          return toast("当前无法执行该支撑操作");
        const file = (delivery === undefined ? salesSupportDeliveryFiles(support) : delivery.files || [])[index];
        if (!file?.url || (expectedFile && file !== expectedFile)) return toast("当前无法执行该支撑操作");
        if (!file.url.startsWith("blob:") && !file.url.startsWith("data:application/pdf;base64,"))
          return toast("当前无法执行该支撑操作");
        const link = document.createElement("a");
        link.href = file.url.startsWith("data:")
          ? URL.createObjectURL(new Blob([Uint8Array.from(atob(file.url.split(",")[1]), (char) => char.charCodeAt(0))], { type: "application/pdf" }))
          : file.url;
        if (action === "download") link.download = file.name;
        else { link.target = "_blank"; link.rel = "noopener"; }
        link.click();
      }

      function openSalesReassignModal() { return toast("商机负责人由客户责任关系确定，不支持单独改派"); }

      function selectSalesTargetRegion(name) {
        if (!canAccessPage("sales-targets") || !salesTargetVisibleRegions().some(region => region.name === name)) return;
        salesTargetSelectedRegion = name;
        salesTargetSelectionUser = currentUser;
        renderPage();
      }

      function salesTargetHistoryFilterBody() {
        const state = salesTargetHistoryState, rows = salesTargetHistoryItems(false);
        const centers = [...new Set(rows.map(salesTargetHistoryCenter).filter(Boolean))].map(value => ({value,label:value}));
        const filter = state.filters;
        return `<div class="panel-sub sales-target-history-scope">查询${escapeHtml(state.year)}年目标的变更记录，不随页面所选中心或季度筛选。</div><form id="salesTargetHistoryForm" class="toolbar filter-toolbar sales-target-history-filters">${filterField("运营中心",`<select class="input" id="salesTargetHistoryCenter">${salesTargetHistoryOptions(centers,filter.center,"全部运营中心")}</select>`)}${filterField("人员",`<select class="input" id="salesTargetHistoryPerson">${salesTargetHistoryOptions(salesTargetHistoryPeople(rows,filter.center),filter.person,"全部人员")}</select>`)}${filterField("层级",`<select class="input" id="salesTargetHistoryLevel">${salesTargetHistoryOptions([{value:"公司",label:"公司"},{value:"区域",label:"运营中心"},{value:"PM",label:"个人"}],filter.level,"全部层级")}</select>`)}${filterActions('<button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" id="resetSalesTargetHistory">重置</button>')}</form><div id="salesTargetHistoryContent">${salesTargetHistoryTable()}</div>`;
      }
      function bindSalesTargetHistoryFilters() {
        const state = salesTargetHistoryState, form = $("#salesTargetHistoryForm");
        if (!form) return;
        const valid = () => state === salesTargetHistoryState && state.actor === currentUser && state.year === salesTargetMonth.slice(0,4) && salesTargetHistoryAccess() && !salesTargetPersonalView() && $("#salesTargetHistoryForm") === form;
        const reject = () => { closeOverlay(); toast("目标或权限已变化，请重新操作"); };
        const center = $("#salesTargetHistoryCenter"), person = $("#salesTargetHistoryPerson"), level = $("#salesTargetHistoryLevel");
        center.onchange = () => {
          const rows = salesTargetHistoryItems(false);
          if (!valid() || center.value && !rows.some(item => salesTargetHistoryCenter(item) === center.value)) return reject();
          const people = salesTargetHistoryPeople(rows,center.value);
          const selected = people.some(item => item.value === person.value) ? person.value : "";
          person.innerHTML = salesTargetHistoryOptions(people,selected,"全部人员");
          person.value = selected;
        };
        const refresh = filters => {
          state.filters = filters;
          const key = "m12-sales-target-history";
          if (unifiedTablePaginationStates[key]) unifiedTablePaginationStates[key].page = 1;
          $("#salesTargetHistoryBody").innerHTML = salesTargetHistoryFilterBody();
          bindSalesTargetHistoryFilters(); bindUnifiedTablePagination();
        };
        form.onsubmit = event => {
          event.preventDefault();
          const rows = salesTargetHistoryItems(false), filters = {center:center.value,person:person.value,level:level.value};
          if (!valid() || filters.center && !rows.some(item => salesTargetHistoryCenter(item) === filters.center) || filters.person && !salesTargetHistoryPeople(rows,filters.center).some(item => item.value === filters.person) || !["","公司","区域","PM"].includes(filters.level)) return reject();
          refresh(filters);
        };
        $("#resetSalesTargetHistory").onclick = () => {
          if (!valid()) return reject();
          refresh({center:"",person:"",level:""});
        };
      }
      function openSalesTargetHistoryModal() {
        const personal = salesTargetPersonalView();
        if (!salesTargetHistoryAccess() ||
          !(currentUser.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总") || salesIsRole("区域总监") || personal && salesIsRole("PM"))) return;
        salesTargetHistoryState = {actor:currentUser,year:salesTargetMonth.slice(0,4),filters:{center:"",person:"",level:""}};
        const key = personal ? "m12-personal-target-history" : "m12-sales-target-history";
        if (unifiedTablePaginationStates[key]) unifiedTablePaginationStates[key].page = 1;
        openModal(`<div class="modal-head"><div class="modal-title">目标变更记录 · ${salesTargetHistoryState.year}年</div><button class="icon-btn close" type="button" data-close title="关闭" aria-label="关闭">×</button></div><div class="modal-body sales-target-history-body" id="salesTargetHistoryBody">${personal ? salesTargetHistoryTable() : salesTargetHistoryFilterBody()}</div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button></div>`);
        $("#modalLayer .modal")?.classList.add("sales-target-history-modal");
        if (!personal) bindSalesTargetHistoryFilters();
        bindUnifiedTablePagination();
      }

      function salesCanAdjustTarget(level, object, checkPrerequisites = true) {
        const year = salesTargetEditingYear();
        if (!year || !currentUser || !canAccessPage("sales-targets") || !hasOperationPermission("sales-targets.manage") || year.year < salesTargetToday().slice(0,4)) return false;
        const employee = employees.find(item => item.code === currentUser.employeeCode);
        if (!accounts.includes(currentUser) || currentUser.disabled || !employee || employee.status !== "在职" || employee.accountStatus === "停用") return false;
        const root = currentUser.fullAccess || (salesIsRole("总裁") && employeeHasRole(employee,"总裁"));
        const vp = salesIsRole("市场副总") && employeeHasRole(employee,"市场副总");
        if (level === "company") return Boolean(root);
        if (level === "region-year") return Boolean((root || vp) && year.companyTarget != null && year.regions.length);
        const [name, code] = object.split("|");
        const region = year.regions.find(item => item.name === name);
        if (!region) return false;
        const director = salesIsRole("区域总监") && employeeHasRole(employee,"区域总监") && salesManagedRegions().some(item => regionsMatch(regionScopeName(item), name));
        // Used only to render disabled personal actions; edit plans always check prerequisites.
        if (!checkPrerequisites && ["person-quarter","coordinate-month"].includes(level)) return Boolean(root || vp || director);
        const q = salesTargetQuarter()-1, months = salesPeriodMonths(salesTargetQuarterPeriod());
        if (level === "region-quarter") return Boolean((root || vp || director) && region.target != null);
        if (months.at(-1) < salesTargetToday().slice(0,7) || region.quarters[q] == null) return false;
        if (level === "region-month") return Boolean(root || vp || director);
        if (months.some(month => salesTargetMonthRegion(month,name,salesTargetEditingMonths())?.target == null)) return false;
        if (level === "person-quarter") return Boolean((root || vp || director) && region.salespeople.length);
        if (level === "coordinate-month") return Boolean((root || vp || director) && region.salespeople.length && region.salespeople.every(person => person.quarters[q] != null) && (!code || region.salespeople.some(person => person.code === code)));
        // Personal targets are read-only; management uses coordinate-month for all people.
        return false;
      }

      function salesTargetEditPlan(level, object) {
        if (!salesCanAdjustTarget(level, object)) return null;
        const year = salesTargetEditingYear(), q = salesTargetQuarter()-1;
        const months = salesTargetEditingMonths().filter(item => item.month.startsWith(year.year+"-"));
        const periods = salesPeriodMonths(salesTargetQuarterPeriod());
        const [name, code] = object.split("|");
        const ri = year.regions.findIndex(item => item.name === name), region = year.regions[ri];
        const personCode = level === "coordinate-month" ? code || region.salespeople[0]?.code : code;
        const rows = [];
        const add = (key,label,path,period,scope,objectName,employeeCode) => {
          const value = path.reduce((value,key) => value[key], {year,months});
          const lastMonth = salesPeriodMonths(period).at(-1);
          rows.push({key,label,path,period,level:scope,object:objectName,employeeCode,value,locked:lastMonth < salesTargetToday().slice(0,7)});
        };
        if (level === "company") add("company","公司年度",["year","companyTarget"],year.year,"公司","英嘉科技");
        if (level === "region-year") year.regions.forEach((item,index) => add(`region:${item.name}`,item.name,["year","regions",index,"target"],year.year,"区域",item.name));
        if (level === "region-quarter") [0,1,2,3].forEach(index => add(`quarter:${index}`,`第${index+1}季度`,["year","regions",ri,"quarters",index],`${year.year}-Q${index+1}`,"区域",name));
        if (level === "person-quarter") region.salespeople.forEach((person,index) => {
          add(`person:${person.code}`,person.name+" · 季度",["year","regions",ri,"salespeople",index,"quarters",q],salesTargetQuarterPeriod(),"PM",`${name} / ${person.name}`,person.code);
          periods.forEach(month => {
            const mi=months.findIndex(item=>item.month===month), mr=months[mi]?.regions.findIndex(item=>item.name===name);
            const pi=months[mi]?.regions[mr]?.salespeople.findIndex(item=>item.code===person.code);
            if (pi >= 0) add(`person:${person.code}:${month}`,`${person.name} · ${Number(month.slice(5))}月`,["months",mi,"regions",mr,"salespeople",pi,"target"],month,"PM",`${name} / ${person.name}`,person.code);
          });
        });
        if (["region-month","person-month","coordinate-month"].includes(level)) periods.forEach(month => {
          const mi = months.findIndex(item => item.month === month);
          const mr = months[mi]?.regions.findIndex(item => item.name === name);
          if (mi < 0 || mr < 0) return;
          if (level === "region-month") add(`month:${month}`,`${Number(month.slice(5))}月`,["months",mi,"regions",mr,"target"],month,"区域",name);
          else region.salespeople.filter(person => person.code === personCode).forEach(person => {
            const pi = months[mi].regions[mr].salespeople.findIndex(item => item.code === person.code);
            if (pi >= 0) add(`person:${person.code}:${month}`,`${level === "coordinate-month" ? "" : person.name+" · "}${Number(month.slice(5))}月`,["months",mi,"regions",mr,"salespeople",pi,"target"],month,"PM",`${name} / ${person.name}`,person.code);
          });
        });
        const titles = {company:"设置公司年度目标","region-year":"分配区域年度目标","region-quarter":"拆分区域季度目标","region-month":"拆分区域月度目标","person-quarter":"分配个人季度目标","person-month":"拆分本人月度目标","coordinate-month":"分配个人月度目标"};
        const parent = level === "region-year" ? year.companyTarget : level === "region-quarter" ? region.target : ["person-month","coordinate-month"].includes(level) ? region.salespeople.find(person => person.code === personCode)?.quarters[q] : region?.quarters[q];
        return {year,months,rows,personCode,regionName:name,title:titles[level],parent,period:level === "company" || level === "region-year" || level === "region-quarter" ? year.year : salesTargetQuarterPeriod()};
      }

      function salesTargetValidateAllocation(state, regionName = "", quarter = null, mode = "all") {
        const {year,months} = state;
        const money = value => value == null || salesMoneyCents(value) !== null;
        const check = (parent, values, label) => {
          if (!money(parent) || values.some(value => !money(value))) return `${label}金额须为非负金额，最多6位小数`;
          const assigned = values.filter(value => value != null);
          if (!assigned.length) return "";
          if (parent == null) return `${label}上级目标尚未分配`;
          const cents = assigned.reduce((sum,value) => sum+salesMoneyCents(value),0), budget = salesMoneyCents(parent);
          if (cents > budget || (assigned.length === values.length && cents !== budget))
            return `${label}合计 ${salesTargetWanMoney(cents/100)} 万元，与目标 ${salesTargetWanMoney(parent)} 万元相差 ${salesTargetWanMoney(Math.abs(cents-budget)/100)} 万元`;
          return "";
        };
        let error = regionName ? "" : check(year.companyTarget,year.regions.map(region => region.target),`${year.year}年区域年度`);
        if (error || mode === "company") return error;
        for (const region of year.regions.filter(item => !regionName || item.name === regionName)) {
          error = quarter == null ? check(region.target,region.quarters,`${region.name}年度季度分配`) : "";
          if (error) return error;
          if (mode === "region-year") continue;
          for (let q = 0; q < 4; q++) {
            if (quarter != null && q !== quarter) continue;
            const period = `${year.year}-Q${q+1}`;
            const regionMonths = salesPeriodMonths(period).map(month => salesTargetMonthRegion(month,region.name,months));
            error = ["all","region-quarter","region-month"].includes(mode)
              ? check(region.quarters[q],regionMonths.map(item => item?.target),`${region.name} ${period}月度分配`) : "";
            if (!error && ["all","region-quarter","person-quarter"].includes(mode))
              error = check(region.quarters[q],region.salespeople.map(person => person.quarters[q]),`${region.name} ${period}个人季度分配`);
            if (error) return error;
            if (mode === "region-quarter") continue;
            for (const person of mode === "region-month" ? [] : region.salespeople) {
              error = check(person.quarters[q],regionMonths.map(item => item?.salespeople.find(p => p.code === person.code)?.target),`${person.name} ${period}个人拆月`);
              if (error) return error;
            }
            for (let i = 0; i < 3; i++) {
              error = check(regionMonths[i]?.target,region.salespeople.map(person => regionMonths[i]?.salespeople.find(p => p.code === person.code)?.target),`${region.name} ${salesPeriodMonths(period)[i]}个人月度分配`);
              if (error) return error;
            }
          }
        }
        return "";
      }

      function salesTargetAllocationBalances(plan, level, object, values) {
        const groups = [];
        const add = (label, parent, indices) => groups.push({label,parent,indices});
        if (plan.parent != null) add("",plan.parent,plan.rows.flatMap((row,index) => level !== "person-quarter" || row.period === plan.period ? [index] : []));
        if (level === "person-quarter") salesPeriodMonths(plan.period).forEach(month => {
          add(month+" ",salesTargetMonthRegion(month,plan.regionName,plan.months)?.target,plan.rows.flatMap((row,index)=>row.period===month?[index]:[]));
          groups.at(-1).hidden=true;
        });
        if (level === "coordinate-month") {
          if (groups[0]) groups[0].displayLabel = "季度总金额";
          salesPeriodMonths(plan.period).forEach(month => {
            const regionMonth = salesTargetMonthRegion(month,plan.regionName,plan.months);
            const others = regionMonth?.salespeople.filter(person => person.code !== plan.personCode).map(person => person.target == null ? 0 : salesMoneyCents(person.target));
            const budget = salesMoneyCents(regionMonth?.target);
            const occupied = others && !others.includes(null) ? others.reduce((sum,value) => sum+value,0) : null;
            add("",budget == null || occupied == null ? null : (budget-occupied)/100,plan.rows.flatMap((row,index) => row.period === month ? [index] : []));
            groups.at(-1).hidden = true;
          });
        }
        const cents = values.map(value => value == null ? 0 : salesMoneyCents(value));
        const sum = indices => {
          if (indices.some(index => cents[index] == null)) return null;
          const total = indices.reduce((total,index) => total+cents[index],0);
          return Number.isSafeInteger(total) ? total : null;
        };
        groups.forEach(group => {
          const total = sum(group.indices), budget = salesMoneyCents(group.parent);
          group.remaining = total == null || budget == null ? null : budget-total;
        });
        const limits = plan.rows.map((row,index) => {
          const related = groups.filter(group => group.indices.includes(index));
          const available = related.map(group => {
            const other = sum(group.indices.filter(item => item !== index)), budget = salesMoneyCents(group.parent);
            return other == null || budget == null ? null : budget-other;
          });
          return !available.length || available.some(value => value == null) ? null : Math.min(...available);
        });
        return {groups,limits};
      }
      function salesTargetBalancesHtml(balances) {
        return balances.groups.filter(group => !group.hidden).map(group => `<div class="sales-target-edit-budget"><span>${escapeHtml(group.displayLabel || (group.label ? group.label+"可分配目标" : "可分配目标"))}：${salesTargetWanMoney(group.parent)} 万元</span><span class="sales-target-remaining">剩余未分配：${group.remaining == null ? "不可用" : salesTargetWanMoney(group.remaining/100)+" 万元"}</span></div>`).join("");
      }
      function salesTargetBalanceError(plan, values, balances) {
        const index = values.findIndex((value,index) => !plan.rows[index].locked && value != null && salesMoneyCents(value) != null && balances.limits[index] != null && salesMoneyCents(value) > balances.limits[index]);
        return index < 0 ? "" : "请输入不高于剩余未分配金额";
      }
      function openSalesTargetModal(level, object = "") {
        const plan = salesTargetEditPlan(level, object);
        if (!plan || !plan.rows.some(row => !row.locked)) return;
        const user = currentUser, selectedMonth = salesTargetMonth;
        const snapshot = () => JSON.stringify({year:plan.year,months:plan.months});
        const original = snapshot();
        const pending = salesTargetPending();
        const starting = !pending && level === "company" && plan.year.companyTarget != null;
        const staged = Boolean(pending || starting);
        let applied = false;
        const initialBalances = salesTargetAllocationBalances(plan,level,object,plan.rows.map(row => row.value));
        const people = level === "coordinate-month" ? plan.year.regions.find(region => region.name === plan.regionName).salespeople : [];
        const personSelect = people.length ? `<div class="form-group"><label class="form-label" for="salesTargetPerson">分配人员</label><select class="input" id="salesTargetPerson">${people.map(person => `<option value="${escapeHtml(person.code)}" ${person.code === plan.personCode ? "selected" : ""}>${escapeHtml(person.name)}</option>`).join("")}</select></div>` : "";
        const targetInput = (row,index) => `<input aria-label="${escapeHtml(row.label)}成交金额目标（含税，万元）${row.locked ? " · 历史月份只读" : ""}" class="input" type="number" min="0" step="0.000001" ${initialBalances.limits[index] == null ? "" : `max="${salesTargetWanInput(initialBalances.limits[index]/100)}"`} ${row.locked ? "readonly" : level === "coordinate-month" ? "" : "required"} data-sales-target-key="${escapeHtml(row.key)}" value="${row.value == null ? "" : salesTargetWanInput(row.value)}">`;
        const quarterTable = level === "person-quarter";
        const periods = salesPeriodMonths(plan.period);
        const quarterPeople = quarterTable ? plan.rows.filter(row => row.period === plan.period) : [];
        const editFields = quarterTable
          ? `<div class="sales-target-quarter-unit">金额单位：含税，万元</div><div class="table-wrap sales-target-quarter-scroll"><table class="sales-target-quarter-table"><thead><tr><th scope="col">人员</th><th scope="col">第${salesTargetQuarter()}季度目标</th>${periods.map(period => `<th scope="col">${Number(period.slice(5))}月目标${period < salesTargetToday().slice(0,7) ? '<span class="muted">历史月份只读</span>' : ""}</th>`).join("")}</tr></thead><tbody>${quarterPeople.map(person => `<tr><th scope="row">${escapeHtml(person.label.replace(/ · 季度$/, ""))}</th>${[person,...periods.map(period => plan.rows.find(row => row.employeeCode === person.employeeCode && row.period === period))].map(row => `<td>${row ? targetInput(row,plan.rows.indexOf(row)) : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
          : `<div class="sales-target-edit-list">${plan.rows.map((row,index) => `<label class="sales-target-edit-row"><span>${escapeHtml(row.label)}成交金额目标（含税，万元）${row.locked ? " · 历史月份只读" : ""}</span>${targetInput(row,index)}</label>`).join("")}</div>`;
        openModal(`<div class="modal-head"><div class="modal-title">${plan.title} · ${escapeHtml(plan.period)}</div><button class="icon-btn close" type="button" data-close title="关闭">×</button></div><form id="salesTargetForm" novalidate><div class="modal-body">${personSelect}<div id="salesTargetBalances" aria-live="polite">${salesTargetBalancesHtml(initialBalances)}</div>${editFields}<div class="form-group sales-target-reason" id="salesTargetReasonGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>调整原因</label><textarea class="input" id="salesTargetReason" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">${staged ? "保存本层调整" : "确认分配"}</button></div></form>`);
        if (quarterTable) $("#modalLayer .modal")?.classList.add("sales-target-quarter-modal");
        const form = $("#salesTargetForm");
        form.oninput = () => {
          const inputs = [...document.querySelectorAll("[data-sales-target-key]")];
          const values = plan.rows.map(row => {
            const input = inputs.find(item => item.dataset.salesTargetKey === row.key);
            return !input ? row.value : input.validity?.badInput ? NaN : input.value.trim() === "" ? null : salesTargetParseWan(input.value.trim());
          });
          const balances = salesTargetAllocationBalances(plan,level,object,values);
          $("#salesTargetBalances").innerHTML = salesTargetBalancesHtml(balances);
          plan.rows.forEach((row,index) => {
            const input = inputs.find(item => item.dataset.salesTargetKey === row.key);
            if (!input) return;
            if (balances.limits[index] == null) input.removeAttribute("max");
            else input.max = salesTargetWanInput(balances.limits[index]/100);
          });
          const adjustment = plan.rows.some((row,index) => row.value != null && values[index] !== row.value);
          $("#salesTargetReasonGroup").hidden = !adjustment;
          $("#salesTargetReason").required = adjustment;
        };
        const valid = (checkSelection = true) => !applied && $("#salesTargetForm") === form && currentUser === user && salesTargetMonth === selectedMonth && salesTargetEditingYear() === plan.year && snapshot() === original && salesCanAdjustTarget(level,object) && (!checkSelection || level !== "coordinate-month" || $("#salesTargetPerson")?.value === plan.personCode);
        if (level === "coordinate-month") {
          const select = $("#salesTargetPerson");
          select.value = plan.personCode;
          select.onchange = () => {
            const next = select.value;
            if (!valid(false) || !people.some(person => person.code === next)) {
              select.value = plan.personCode;
              return toast("目标或权限已变化，请重新打开分配");
            }
            openSalesTargetModal(level,`${plan.regionName}|${next}`);
          };
        }
        $("#salesTargetForm").onsubmit = event => {
          event.preventDefault();
          if (!valid()) return toast("目标或权限已变化，请重新打开分配");
          const inputs = [...document.querySelectorAll("[data-sales-target-key]")];
          if (inputs.length !== plan.rows.length || new Set(inputs.map(input => input.dataset.salesTargetKey)).size !== plan.rows.length || inputs.some(input => !plan.rows.some(row => row.key === input.dataset.salesTargetKey))) return toast("目标或权限已变化，请重新打开分配");
          const candidate = structuredClone({year:plan.year,months:plan.months});
          const changes = [];
          for (const row of plan.rows) {
            const input = inputs.find(item => item.dataset.salesTargetKey === row.key), text = input.value.trim();
            if (input.validity?.badInput) return toast("成交金额目标须为非负金额，最多6位小数（含税，万元）");
            const value = text === "" ? null : salesTargetParseWan(text);
            if (row.locked && value !== row.value) return toast("历史月份目标不能修改");
            if ((!row.locked && value === null && level !== "coordinate-month" && !(level === "person-quarter" && row.period !== plan.period)) || (value !== null && salesMoneyCents(value) === null)) return toast("成交金额目标须为非负金额，最多6位小数（含税，万元）");
            // Coordination may leave an entire unallocated person untouched, but never erase an assigned target.
            if (row.value != null && value == null) return toast("已分配目标不能清空");
            const parent = row.path.slice(0,-1).reduce((item,key) => item[key],candidate);
            parent[row.path.at(-1)] = value;
            if (value !== row.value) changes.push({...row,after:value});
          }
          if (!changes.length) return toast("目标未发生变化");
          const values = plan.rows.map(row => row.path.reduce((item,key) => item[key],candidate));
          const balances = salesTargetAllocationBalances(plan,level,object,values);
          const balanceError = salesTargetBalanceError(plan,values,balances);
          if (!staged && balanceError) return toast(balanceError);
          const adjustment = changes.some(change => change.value != null);
          const reason = adjustment ? $("#salesTargetReason").value.trim() : "";
          if (adjustment && !reason) return toast("请填写调整原因");
          if (!staged && ["region-year","region-quarter","region-month","person-quarter","person-month"].includes(level)) {
            const values = plan.rows.filter(row=>level !== "person-quarter" || row.period===plan.period).map(row => row.path.reduce((item,key) => item[key],candidate));
            const total = values.some(value => value == null) ? null : salesSumMoney(values,value => value);
            if (total === null || salesMoneyCents(total) !== salesMoneyCents(plan.parent))
              return toast(`${plan.period} ${plan.title}合计 ${total === null ? "未分配" : salesTargetWanMoney(total)} 万元，须等于目标 ${salesTargetWanMoney(plan.parent)} 万元${total === null ? "" : `，相差 ${salesTargetWanMoney(Math.abs(total-plan.parent))} 万元`}`);
          }
          if (!staged && level === "coordinate-month") {
            const region = candidate.year.regions.find(item => item.name === plan.regionName);
            for (const code of new Set(changes.map(change => change.employeeCode))) {
              const values = salesPeriodMonths(salesTargetQuarterPeriod()).map(month => salesTargetMonthRegion(month,plan.regionName,candidate.months)?.salespeople.find(person => person.code === code)?.target);
              const person = region.salespeople.find(item => item.code === code);
              if (values.some(value => value == null) || salesMoneyCents(salesSumMoney(values,value => value)) !== salesMoneyCents(person.quarters[salesTargetQuarter()-1]))
                return toast(`${person.name}3个月合计须等于个人季度目标，历史月份保持只读`);
            }
          }
          const name = object.split("|")[0];
          let error;
          if (!staged && level === "person-month") {
            // Self-service errors disclose only the month and discrepancy, never another target.
            for (const month of salesPeriodMonths(salesTargetQuarterPeriod())) {
              const region = salesTargetMonthRegion(month,name,candidate.months);
              const assigned = region.salespeople.filter(person => person.target != null);
              const total = assigned.reduce((sum,person) => sum+salesMoneyCents(person.target),0);
              const budget = salesMoneyCents(region.target);
              if (total > budget || (assigned.length === region.salespeople.length && total !== budget)) {
                error = `${month}个人月度分配与可分配额度相差 ${salesTargetWanMoney(Math.abs(total-budget)/100)} 万元，请由区域协调`;
                break;
              }
            }
          } else if (!staged) error = salesTargetValidateAllocation(candidate,
            ["company","region-year"].includes(level) ? "" : name,
            ["company","region-year","region-quarter"].includes(level) ? null : salesTargetQuarter()-1,level);
          if (error) return toast(error);
          if (adjustment && !window.confirm(staged ? "确认保存本层调整？本轮全部完成前，统计继续使用原目标。" : `确认分配 ${changes.length} 项成交金额目标并立即生效？`)) return;
          if (!valid()) return toast("目标或权限已变化，请重新打开分配");
          if (staged) {
            let round = pending;
            if (starting) {
              if (salesTargetPending()) return toast("同年度已有目标调整，请先完成或取消");
              const base=structuredClone({year:plan.year,months:plan.months});
              round={base,candidate,reason,changes:new Map(),baseSnapshot:JSON.stringify(base)};
              salesTargetAdjustments.set(plan.year.year,round);
            } else {
              Object.assign(plan.year,candidate.year);
              plan.months.forEach((month,index)=>Object.assign(month,candidate.months[index]));
            }
            changes.forEach(change=> {
              const key=JSON.stringify(change.path), existing=round.changes.get(key);
              const baseValue=change.path.reduce((node,key)=>node[key],round.base);
              round.changes.set(key,{...change,value:baseValue,operator:user.name,reason:reason || existing?.reason || round.reason});
            });
            applied=true;closeOverlay();renderPage();return toast("本层调整已保存，统计仍使用原目标");
          }
          Object.assign(plan.year,candidate.year,{version:Number(plan.year.version)+1,effectiveAt:salesNow()});
          plan.months.forEach((month,index) => Object.assign(month,candidate.months[index]));
          applied = true;
          changes.slice().reverse().forEach(change => salesTargetHistory.unshift({period:change.period,level:change.level,object:change.object,employeeCode:change.employeeCode,
            before:change.value ?? "未分配",after:change.after,reason:change.value == null ? "" : reason,operator:user.name,effectiveMode:change.value == null ? "首次分配" : "直接生效",effectiveAt:salesNow(),version:plan.year.version}));
          closeOverlay();renderPage();toast("成交金额目标分配已生效");
        };
      }

      function salesTargetPendingError(round) {
        const {year,months}=round.candidate;
        const base=round.base;
        if (year.year !== base.year.year || months.length !== base.months.length || months.some((month,index)=>month.month !== base.months[index].month)) return "目标或权限已变化，请重新操作";
        const exact=(parent,values,label,complete=true)=> {
          if (salesMoneyCents(parent) === null || values.some(value=>value != null && salesMoneyCents(value) === null)) return `${label}金额不可用`;
          if (complete && values.some(value=>value == null)) return `${label}尚未分配完成`;
          const total=values.reduce((sum,value)=>sum+(value == null ? 0 : salesMoneyCents(value)),0);
          const delta=salesMoneyCents(parent)-total;
          return delta ? `${label}剩余未分配 ${salesTargetWanMoney(delta/100)} 万元，须为0` : "";
        };
        let error=exact(year.companyTarget,year.regions.map(region=>region.target),"区域年度分配");
        if (error) return error;
        for (const region of year.regions) {
          const before=base.year.regions.find(item=>item.name===region.name);
          const regionMonths=months.filter(month=>month.regions.some(item=>item.name===region.name));
          const changed=JSON.stringify(region)!==JSON.stringify(before) || regionMonths.some(month=>JSON.stringify(salesTargetMonthRegion(month.month,region.name,months))!==JSON.stringify(salesTargetMonthRegion(month.month,region.name,base.months)));
          if (!changed) continue;
          error=exact(region.target,region.quarters,`${region.name}季度分配`);
          if (error) return error;
          for (let q=0;q<4;q++) {
            const period=`${year.year}-Q${q+1}`, labels=salesPeriodMonths(period);
            const current=labels.map(month=>salesTargetMonthRegion(month,region.name,months));
            const previous=labels.map(month=>salesTargetMonthRegion(month,region.name,base.months));
            const impacted=region.quarters[q]!==before.quarters[q] || region.salespeople.some(person=>person.quarters[q]!==before.salespeople.find(p=>p.code===person.code)?.quarters[q]) || JSON.stringify(current)!==JSON.stringify(previous);
            if (!impacted) continue;
            if (labels.some((month,index)=>month < salesTargetToday().slice(0,7) && JSON.stringify(current[index])!==JSON.stringify(previous[index]))) return "历史月份目标不能修改";
            if (labels.at(-1) < salesTargetToday().slice(0,7)) return "历史季度目标不能修改";
            error=exact(region.quarters[q],current.map(month=>month?.target),`${region.name} ${period}月度分配`) || exact(region.quarters[q],region.salespeople.map(person=>person.quarters[q]),`${region.name} ${period}个人季度分配`);
            if (error) return error;
            const inactiveZero = person => person.quarters[q] === 0 && employees.some(employee => employee.code === person.code && (employee.status === "停用" || employee.accountStatus === "停用"));
            for (const person of region.salespeople) {
              error=exact(person.quarters[q],current.map(month=>month?.salespeople.find(row=>row.code===person.code)?.target),`${person.name} ${period}个人月份`,!inactiveZero(person));
              if (error) return error;
            }
            for (let index=0;index<3;index++) {
              error=exact(current[index]?.target,region.salespeople.map(person=>current[index]?.salespeople.find(row=>row.code===person.code)?.target).filter((value,i)=>value != null || !inactiveZero(region.salespeople[i])),`${region.name} ${labels[index]}个人合计`);
              if (error) return error;
            }
          }
        }
        // Independent preservation check also rejects tampering with past quarter values.
        for (const change of round.changes.values()) {
          if (salesPeriodMonths(change.period).at(-1) < salesTargetToday().slice(0,7)) return "历史月份目标不能修改";
          if (change.employeeCode && change.after !== change.value && !employees.some(employee=>employee.code===change.employeeCode && employee.status==="在职" && employee.accountStatus!=="停用" && (employeeHasRole(employee,"PM") || employeeHasRole(employee,"区域总监")))) return "目标分配人员已失效，请重新调整";
        }
        return "";
      }

      function finishSalesTargetAdjustment(cancel = false) {
        const round=salesTargetPending(), actor=currentUser;
        if (!round || !salesCanAdjustTarget("company","")) return toast("当前无法完成目标调整");
        const year=salesTargetYear(), months=salesTargetMonths.filter(item=>item.month.startsWith(year.year+"-"));
        if (!cancel && JSON.stringify({year,months}) !== round.baseSnapshot) return toast("有效目标已变化，请取消本轮后重新调整");
        const error=cancel ? "" : salesTargetPendingError(round);
        if (error) return toast(error);
        const snapshot=JSON.stringify(round.candidate);
        if (!window.confirm(cancel ? "确认取消本轮全部未生效调整？原目标保持有效。" : "确认完成本轮调整并使公司及下级目标整体生效？")) return;
        if (currentUser !== actor || salesTargetPending() !== round || !salesCanAdjustTarget("company","") || JSON.stringify(round.candidate)!==snapshot || (!cancel && JSON.stringify({year,months})!==round.baseSnapshot)) return toast("目标或权限已变化，请重新操作");
        if (cancel) {salesTargetAdjustments.delete(year.year);renderPage();return toast("本轮调整已取消，原目标保持有效");}
        const finalError=salesTargetPendingError(round);if(finalError)return toast(finalError);
        const time=salesSupportNow(), version=Number(year.version)+1;
        Object.assign(year,structuredClone(round.candidate.year),{version,effectiveAt:time});
        months.forEach((month,index)=>Object.assign(month,structuredClone(round.candidate.months[index]),{version,effectiveAt:time,companyTarget:year.companyTarget}));
        [...round.changes.values()].filter(change=>change.value!==change.after).reverse().forEach(change=>salesTargetHistory.unshift({period:change.period,level:change.level,object:change.object,employeeCode:change.employeeCode,before:change.value ?? "未分配",after:change.after,delta:(salesMoneyCents(change.after)-salesMoneyCents(change.value ?? 0))/100,reason:change.reason,operator:change.operator,effectiveMode:"整体生效",effectiveAt:time,version}));
        salesTargetAdjustments.delete(year.year);renderPage();toast("本轮目标调整已整体生效");
      }

      function bindSalesRegionGoal() {
        const center = $("#salesRegionCenter");
        const fields = bindSalesPeriodFields("salesRegionDimension", "salesRegionPeriod", () => salesRegionPeriodDraft, value => salesRegionPeriodDraft = value, salesRegionTargetsAllowed);
        const validCenter = value => value === "" || salesRegionGoalCenters().some(item => String(item.id) === value);
        if (center) center.onchange = () => {
          if (salesRegionTargetsAllowed() && validCenter(center.value)) salesRegionCenterDraft = center.value;
        };
        const apply = $("#applySalesRegionGoal"), reset = $("#resetSalesRegionGoal");
        if (apply) apply.onclick = () => {
          const next = fields.read();
          if (!salesRegionTargetsAllowed() || !next || !validCenter(center?.value)) return;
          salesRegionPeriodDraft = salesRegionPeriodApplied = next;
          salesRegionCenterDraft = salesRegionCenterApplied = center.value;
          const table = $("#salesRegionGoalTable");
          if (table) table.innerHTML = salesRegionGoalTable();
        };
        if (reset) reset.onclick = () => {
          if (!salesRegionTargetsAllowed()) return;
          resetSalesRegionTargets();
          fields.sync();
          if (center) center.value = "";
          const table = $("#salesRegionGoalTable");
          if (table) table.innerHTML = salesRegionGoalTable();
        };
      }

      function bindSalesSupportFilters() {
        document.querySelectorAll("[data-sales-support-status]").forEach((button) => {
          button.onclick = () => {
            if (!canAccessPage("sales-supports")) return;
            salesSupportStates();const wasProjects=supportProjectsState.selected;supportProjectsState.selected=false;
            const nextStatus=button.dataset.salesSupportStatus || "";
            const changed=appliedSupportFilters.status!==nextStatus;
            appliedSupportFilters = {...appliedSupportFilters,status:nextStatus};
            const state = unifiedTablePaginationStates["m12-supports"];
            if (state && (!wasProjects || changed)) state.page = 1;
            renderPage();
          };
        });
        const apply = $("#applySupportFilters");
        if (apply) apply.onclick = () => {
          const next = {
            requestCode: $('#supportRequestCodeFilter').value.trim(),
            opportunityCode: $('#supportOpportunityCodeFilter').value.trim(),
            employee: $('#supportEmployeeFilter')?.value || '',
            name: $("#supportNameFilter").value.trim(),
            customer: $("#supportCustomerFilter").value,
            status: appliedSupportFilters.status,
            deadlineFrom: $("#supportDeadlineFromFilter").value,
            deadlineTo: $("#supportDeadlineToFilter").value,
          };
          if (next.deadlineFrom && next.deadlineTo && next.deadlineFrom > next.deadlineTo)
            return toast("开始日期不能晚于结束日期");
          appliedSupportFilters = next;
          const state = unifiedTablePaginationStates["m12-supports"];
          if (state) state.page = 1;
          renderPage();
        };
        const toolbar=apply?.closest('.filter-toolbar');
        if(toolbar)toolbar.onkeydown=event=>{if(event.key==='Enter' && event.target.tagName==='INPUT'){event.preventDefault();apply.click();}};
        const reset = $("#resetSupportFilters");
        if (reset) reset.onclick = () => {
          appliedSupportFilters = { name: "", customer: "", status: "", deadlineFrom: "", deadlineTo: "", requestCode: "", opportunityCode: "", employee: "" };
          const state = unifiedTablePaginationStates["m12-supports"];
          if (state) state.page = 1;
          renderPage();
        };
        clearInterval(supportRemainingTimer);
        supportRemainingTimer = null;
        if (currentPage !== "sales-supports" || !canAccessPage("sales-supports")) return;
        supportRemainingTimer = setInterval(() => {
          if (currentPage !== "sales-supports" || !canAccessPage("sales-supports")) {
            clearInterval(supportRemainingTimer);
            supportRemainingTimer = null;
            return;
          }
          const requests = new Map(salesVisibleSupportRequests().map(({ support }) => [support.id, support]));
          const now = Date.now();
          document.querySelectorAll("[data-support-remaining]").forEach((cell) => {
            const support = requests.get(cell.dataset.supportRemaining);
            cell.textContent = support ? salesSupportRemainingText(support, now) : "—";
          });
        }, 60000);
      }

      function bindSalesEvents() {
        document.querySelectorAll("[data-sales-page]").forEach((button) => {
          button.onclick = () => salesNavigate(button.dataset.salesPage);
        });
        bindSupportResultEvents();
        bindSalesPeriod();
        bindSalesRegionGoal();
        bindSalesTargetMonth();
        bindOpportunityFilters();
        bindSalesSupportFilters();
        document.querySelectorAll("[data-sales-trend]").forEach((button) => {
          button.onclick = () => {
            if (!salesWorkbenchAllowed() || !["count", "amount"].includes(button.dataset.salesTrend)) return;
            salesTrendMode = button.dataset.salesTrend;
            renderPage();
          };
        });
        document.querySelectorAll("[data-opportunity-open]").forEach((button) => {
          button.onclick = () => {
            opportunityDetailContext = button.dataset.opportunityContext === "support" ? "support" : "sales";
            selectedOpportunitySupportId = opportunityDetailContext === "support" ? button.dataset.opportunitySupport || null : null;
            selectedOpportunityId = button.dataset.opportunityOpen;
            if (opportunityDetailContext === "sales") {
              const item = opportunities.find((opportunity) => opportunity.id === selectedOpportunityId);
              if (item) markSalesOpportunityRead(item);
            }
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
        if (back) back.onclick = () => {
          const item = opportunitySelected();
          salesNavigate(item && isSupportOpportunityDetail(item) ? "sales-supports" : "opportunities");
        };
        bindOpportunityCreateForm();
        const selected = opportunitySelected();
        const edit = $("[data-sales-edit]");
        if (edit && selected) edit.onclick = () => openSalesEditModal(selected);
        const stage = $("[data-sales-stage-open]");
        if (stage && selected) stage.onclick = () => openSalesStageModal(selected);
        if (selected) document.querySelectorAll("[data-sales-followup-add]").forEach(button => {
          button.onclick = () => openSalesFollowupModal(selected);
        });
        const support = $("[data-sales-support-add]");
        if (support && selected) support.onclick = () => openSalesSupportModal(selected);
        document.querySelectorAll("[data-stage-file]").forEach(button=> {
          const item=opportunities.find(row=>row.id===button.dataset.stageOpportunity);
          const history=item?.histories[Number(button.dataset.stageHistory)];
          const index=Number(button.dataset.stageFileIndex), expected=history?.files?.[index];
          button.onclick=()=>openSalesStageFile(item,history,index,button.dataset.stageFile,expected);
        });
        document.querySelectorAll("[data-support-history]").forEach((button) => {
          button.onclick = () => {
            const item = opportunities.find((row) => row.id === button.dataset.supportOpportunity);
            const support = item?.supports.find((row) => row.id === button.dataset.supportHistory);
            openSupportHistory(item, support);
          };
        });
        document.querySelectorAll("[data-support-delivery]").forEach((button) => {
          button.onclick = () => {
            const item = opportunities.find((row) => row.id === button.dataset.supportOpportunity);
            const support = item?.supports.find((row) => row.id === button.dataset.supportDelivery);
            openSupportDeliveryDetail(item, support);
          };
        });
        document.querySelectorAll("[data-support-action]").forEach((button) => {
          button.onclick = () => {
            const opportunity = button.dataset.supportOpportunity
              ? opportunities.find((item) => item.id === button.dataset.supportOpportunity)
              : selected;
            const request = opportunity?.supports.find((item) => item.id === button.dataset.supportId);
            if (opportunity && request) handleSupportAction(opportunity, request, button.dataset.supportAction);
          };
        });
        document.querySelectorAll("[data-sales-target-region]").forEach(button => {
          button.onclick = () => selectSalesTargetRegion(button.dataset.salesTargetRegion);
        });
        const finish=$("[data-sales-target-finish]");if(finish)finish.onclick=()=>finishSalesTargetAdjustment();
        const cancel=$("[data-sales-target-cancel]");if(cancel)cancel.onclick=()=>finishSalesTargetAdjustment(true);
        const targetHistory = $("[data-sales-target-history]");
        if (targetHistory) targetHistory.onclick = openSalesTargetHistoryModal;
        document.querySelectorAll("[data-sales-target-edit]").forEach((button) => {
          button.onclick = () => openSalesTargetModal(button.dataset.salesTargetEdit, button.dataset.salesTargetObject);
        });
      }

      function salesHasOpenSupport(item, code, except = null) {
        return item.supports.some(request=>request !== except && request.assigneeCode === code && request.status !== "已关闭");
      }

      function salesTargetMutationLists() { return [salesTargetYears,salesTargetMonths,salesTargetHistory]; }

      function salesRetainsRegionResponsibility(employee, region, excludedOwners = [], excludeDirector = false) {
        return cityOwners.some(owner=>owner.pm===employee?.name && !excludedOwners.includes(owner) && regionProvinceList(region).includes(owner.province)) ||
          (!excludeDirector && departmentsManagedBy(employee?.code).some(department=>department.type==="region" && department.regionId===region.id));
      }

      function salesPersonalEarnedCents(code, regionName, month) {
        const rows=opportunities.filter(item=>!isEcosystemOpportunity(item) && item.selectedDate?.startsWith(month) &&
          (item.performanceOwnerCode || employees.find(person=>person.name===item.owner)?.code)===code &&
          regionsMatch(item.performanceRegion || item.region,regionName));
        const amounts=rows.map(item=>salesMoneyCents(item.expectedContractAmount));
        if (amounts.includes(null)) throw new Error("本人已发生成交金额不可用，请先纠正商机结果");
        return amounts.reduce((total,amount)=>total+amount,0);
      }

      function salesEmployeeTargetRegions(code) {
        const today=salesTargetToday().slice(0,7);
        return [...new Set(salesTargetYears.flatMap(year=>year.regions.filter(region=> {
          const person=region.salespeople.find(person=>person.code===code);
          return person && person.quarters.some((value,q)=>value!=null && salesPeriodMonths(`${year.year}-Q${q+1}`).at(-1)>=today && value>0);
        }).map(region=>region.name)))];
      }

      function prepareSalesTargetHandoff(employee, regionName, receiver, today = salesTargetToday()) {
        const base=JSON.stringify([salesTargetYears,salesTargetMonths]);
        const years=structuredClone(salesTargetYears), months=structuredClone(salesTargetMonths), changes=[];
        if (employee && !salesEmployeeTargetRegions(employee.code).some(name=>regionsMatch(name,regionName))) return {ok:true,base,years,months,changes};
        if (!receiver || receiver.code===employee?.code || receiver.status!=="在职" || receiver.accountStatus==="停用" ||
          !(employeeHasRole(receiver,"PM") || employeeHasRole(receiver,"区域总监"))) return {ok:false,error:"请指定有效的个人目标承接人"};
        const current=today.slice(0,7);
        const change=(node,key,value,period,person)=> {
          const before=node[key];
          if (value===before) return;
          node[key]=value;changes.push({period,level:"PM",object:`${regionName} / ${person.name}`,employeeCode:person.code,before:before ?? "未分配",after:value});
        };
        try {
          for (const year of years) {
            const region=year.regions.find(region=>regionsMatch(region.name,regionName));
            const from=region?.salespeople.find(person=>person.code===employee.code);
            if (!from) continue;
            let to=region.salespeople.find(person=>person.code===receiver.code);
            for (let q=0;q<4;q++) {
              const period=`${year.year}-Q${q+1}`, periods=salesPeriodMonths(period);
              if (periods.at(-1)<current || from.quarters[q]==null) continue;
              const sourceMonths=periods.map(month=>months.find(row=>row.month===month)?.regions.find(row=>row.name===region.name));
              const leaves=sourceMonths.map(row=>row?.salespeople.find(person=>person.code===employee.code));
              if (sourceMonths.some(row=>!row)) throw new Error(`${region.name} ${period}月度目标缺失，请先补齐分配`);
              const baseError=salesTargetValidateAllocation({year,months:months.filter(month=>month.month.startsWith(year.year+"-"))},region.name,q,"person-quarter");
              if(baseError)throw new Error(baseError);
              const sourceBudget=salesMoneyCents(from.quarters[q]);
              if (sourceBudget===null) throw new Error("个人季度目标不可用");
              const started=periods[0]<=current;
              if (started && sourceBudget>0 && leaves.some(leaf=>leaf?.target==null)) throw new Error(`${employee.name} ${period}月度目标未分配，请先补齐分配再交接`);
              if (started && sourceBudget>0 && leaves.reduce((sum,leaf)=>sum+salesMoneyCents(leaf.target),0)!==sourceBudget) throw new Error(`${employee.name} ${period}季月目标不一致，请先完成协调`);
              const deltas=periods.map((month,i)=> {
                if (month<current || leaves[i]?.target==null) return null;
                const target=salesMoneyCents(leaves[i].target);
                if (target===null) throw new Error("个人月度目标不可用");
                return month===current ? Math.max(target-salesPersonalEarnedCents(employee.code,region.name,month),0) : target;
              });
              const transfer=started ? deltas.reduce((sum,value)=>sum+(value??0),0) : sourceBudget;
              if (!transfer && !deltas.some(value=>value>0)) continue;
              if (!to) {
                to={code:receiver.code,name:receiver.name,quarters:[null,null,null,null]};region.salespeople.push(to);
                months.filter(month=>month.month.startsWith(year.year+"-")).forEach(month=> {
                  const row=month.regions.find(item=>item.name===region.name);
                  if(row && !row.salespeople.some(person=>person.code===receiver.code))row.salespeople.push({code:receiver.code,name:receiver.name,target:null});
                });
              }
              change(from.quarters,q,(sourceBudget-transfer)/100,period,from);
              change(to.quarters,q,((salesMoneyCents(to.quarters[q])??0)+transfer)/100,period,to);
              periods.forEach((month,i)=> {
                if (deltas[i]==null) return;
                const list=sourceMonths[i].salespeople, fromLeaf=leaves[i];
                let toLeaf=list.find(person=>person.code===receiver.code);
                if (!toLeaf) {toLeaf={code:receiver.code,name:receiver.name,target:null};list.push(toLeaf);}
                change(fromLeaf,"target",(salesMoneyCents(fromLeaf.target)-deltas[i])/100,month,from);
                change(toLeaf,"target",((salesMoneyCents(toLeaf.target)??0)+deltas[i])/100,month,to);
              });
              const error=salesTargetValidateAllocation({year,months:months.filter(month=>month.month.startsWith(year.year+"-"))},region.name,q,"person-quarter");
              if (error) throw new Error(error);
            }
          }
          return {ok:true,employee,receiver,regionName,today,base,years,months,changes};
        } catch(error) {return {ok:false,error:error.message};}
      }

      function applySalesTargetHandoff(plan, reason, effectiveAt, operator = currentUser.name) {
        if (!plan.ok) throw new Error(plan.error);
        if (!plan.changes.length) return;
        if (JSON.stringify([salesTargetYears,salesTargetMonths])!==plan.base || plan.receiver.status!=="在职" || plan.receiver.accountStatus==="停用" ||
          !(employeeHasRole(plan.receiver,"PM") || employeeHasRole(plan.receiver,"区域总监"))) throw new Error("目标或承接人已变化，请重新交接");
        plan.years.forEach((year,index)=> {
          if (plan.changes.some(change=>change.period.startsWith(year.year))) Object.assign(salesTargetYears[index],year,{version:Number(year.version)+1,effectiveAt});
        });
        plan.months.forEach((month,index)=>Object.assign(salesTargetMonths[index],month));
        plan.changes.forEach(change=>salesTargetHistory.unshift({...change,delta:(salesMoneyCents(change.after)-(typeof change.before==="number"?salesMoneyCents(change.before):0))/100,
          fromEmployeeCode:plan.employee.code,toEmployeeCode:plan.receiver.code,region:plan.regionName,
          reason:`${reason}；${plan.employee.name} → ${plan.receiver.name}`,operator,effectiveMode:"责任交接",effectiveAt}));
      }
