      function salesNavigate(page) {
        currentPage = page;
        window.history.replaceState(null, "", `#${page}`);
        closeOverlay();
        renderPage();
      }

      function salesNow() {
        return "2026-09-01 12:00";
      }

      function setSalesFormError(id, message) {
        const node = $(`#err-${id}`);
        if (node) node.textContent = message || "";
      }

      function selectedValues(control) {
        return [...(control?.selectedOptions || [])].map((option) => option.value).filter(Boolean);
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
              expectedDate: $("#opportunityExpectedDateFilter")?.value || "",
              createdDate: $("#opportunityCreatedDateFilter")?.value || "",
              overdue: $("#opportunityOverdueFilter")?.value || "",
            };
            salesOpportunityDrill = "";
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
              expectedDate: "",
              createdDate: "",
              overdue: "",
            };
            salesOpportunityDrill = "";
            const state = unifiedTablePaginationStates["m12-opportunities"];
            if (state) state.page = 1;
            renderPage();
          };
      }

      function bindOpportunityCreateForm() {
        const form = $("#opportunityCreateForm");
        if (!form) return;
        const customer = $("#salesCustomer");
        const keyPeople = $("#salesKeyPeople");
        const facts = $("#salesCustomerFacts");
        const owner = $("#salesOwner");
        const refreshCustomerFacts = () => {
          const selectedCustomer = customers.find((item) => item.name === customer.value);
          if (!selectedCustomer) {
            facts.textContent = "请选择客户单位";
            keyPeople.innerHTML = '<option value="">请先选择客户单位</option>';
            keyPeople.disabled = true;
            return;
          }
          facts.textContent = `${selectedCustomer.group} · ${selectedCustomer.industry} · ${selectedCustomer.region}${selectedCustomer.city ? ` · ${selectedCustomer.city}` : ""} · 客户负责人 ${selectedCustomer.owner}`;
          const people = contacts.filter(
            (item) => item.company === selectedCustomer.name && item.status !== "停用",
          );
          keyPeople.innerHTML = people
            .map((item) => `<option value="${item.name}">${item.name} · ${item.department}</option>`)
            .join("");
          keyPeople.disabled = !people.length;
          if (!salesIsRole("PM") && owner && selectedCustomer.pm)
            owner.value = selectedCustomer.pm;
        };
        customer.onchange = refreshCustomerFacts;
        const createSupport = $("#salesCreateSupport");
        createSupport.onchange = () => {
          const visible = createSupport.value === "是";
          $("#salesSupportPeopleGroup").hidden = !visible;
          $("#salesSupportDeadlineGroup").hidden = !visible;
        };
        $("#cancelOpportunityCreate").onclick = () => salesNavigate("opportunities");
        form.onsubmit = (event) => {
          event.preventDefault();
          const required = [
            ["salesName", "请填写商机名称"],
            ["salesType", "请选择商机类型"],
            ["salesAmount", "请填写预估金额"],
            ["salesPriority", "请选择优先级"],
            ["salesCustomer", "请选择客户单位"],
            ["salesExpectedDate", "请选择预计成交日期"],
            ["salesOwner", "请选择商机负责人"],
            ["salesFirstFollow", "请选择首次跟进日期"],
            ["salesRequirement", "请填写商机需求描述"],
          ];
          let valid = true;
          required.forEach(([id, message]) => {
            const value = $(`#${id}`)?.value.trim();
            setSalesFormError(id, value ? "" : message);
            if (!value) valid = false;
          });
          const people = selectedValues(keyPeople);
          setSalesFormError("salesKeyPeople", people.length ? "" : "请选择至少一名商机关键人");
          if (!people.length) valid = false;
          const amount = Number($("#salesAmount").value);
          if (Number.isNaN(amount) || amount < 0) {
            setSalesFormError("salesAmount", "预估金额必须大于或等于 0");
            valid = false;
          }
          if ($("#salesFirstFollow").value < "2026-09-02") {
            setSalesFormError("salesFirstFollow", "首次跟进日期不得早于下一业务日");
            valid = false;
          }
          const supportPeople = selectedValues($("#salesSupportPeople"));
          if (createSupport.value === "是") {
            setSalesFormError("salesSupportPeople", supportPeople.length ? "" : "请选择至少一名支撑人员");
            setSalesFormError("salesSupportDeadline", $("#salesSupportDeadline").value ? "" : "请选择回应时限");
            if (!supportPeople.length || !$("#salesSupportDeadline").value) valid = false;
          }
          if (!valid) return;
          const selectedCustomer = customers.find((item) => item.name === customer.value);
          const number = `SJ202609${String(opportunities.length + 1).padStart(4, "0")}`;
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
            owner: $("#salesOwner").value,
            priority: $("#salesPriority").value,
            estimateAmount: amount,
            expectedWinDate: $("#salesExpectedDate").value,
            createdDate: "2026-09-01",
            createdBy: currentUser.name,
            stageChangedAt: salesNow(),
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
              content: "商机创建时发起方案支撑",
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
            ? '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>中选日期</label><input class="input" id="salesSelectedDate" type="date"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>预计签约金额</label><input class="input" id="salesExpectedContractAmount" type="number" min="0" step="0.01"></div>'
            : stage === "落选"
              ? '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>落选原因</label><input class="input" id="salesLossReason"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>竞争对手</label><input class="input" id="salesCompetitor"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>复盘说明</label><textarea class="textarea" id="salesReview" rows="3"></textarea></div>'
              : "";
        };
        $("#salesNextStage").onchange = renderFields;
        renderFields();
        $("#salesStageForm").onsubmit = (event) => {
          event.preventDefault();
          const stage = $("#salesNextStage").value;
          if (stage === "中选") {
            if (!$("#salesSelectedDate").value || $("#salesExpectedContractAmount").value === "")
              return toast("请填写中选日期和预计签约金额");
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
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>跟进时间</label><input class="input" id="followTime" type="datetime-local" value="2026-09-01T11:30"></div>',
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>跟进方式</label><select class="input" id="followMethod"><option value="现场拜访">现场拜访</option><option value="电话">电话</option><option value="企业微信">企业微信</option></select></div>',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>参与关键人</label><select class="input" id="followPeople" multiple size="3">${keyPeopleOptions}</select></div>`,
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>当前风险</label><input class="input" id="followRisk" value="暂无风险"></div>',
          '<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>跟进内容与结果</label><textarea class="textarea" id="followResult" rows="3"></textarea></div>',
          '<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>下一步行动</label><input class="input" id="followNextAction"></div>',
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>下次跟进日期</label><input class="input" id="followNextDate" type="date" min="2026-09-02"></div>',
          '<div class="form-group"><label class="form-label">附件</label><input class="input" id="followAttachment" type="file"></div>',
          '</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存跟进</button></div></form>',
        ].join("");
        openModal(
          formHtml,
        );
        $("#salesFollowupForm").onsubmit = (event) => {
          event.preventDefault();
          const people = selectedValues($("#followPeople"));
          const result = $("#followResult").value.trim();
          const risk = $("#followRisk").value.trim();
          const action = $("#followNextAction").value.trim();
          const nextDate = $("#followNextDate").value;
          const time = $("#followTime").value;
          if (!time || time > "2026-09-01T12:00") return toast("跟进时间不得晚于提交时间");
          if (!people.length || !result || !risk || !action || !nextDate)
            return toast("请填写全部必填跟进信息");
          if (nextDate <= time.slice(0, 10)) return toast("下次跟进日期必须晚于本次跟进时间");
          item.followUps.push({
            time: time.replace("T", " "),
            method: $("#followMethod").value,
            people: people.join("、"),
            result,
            risk,
            nextAction: action,
            nextDate,
            attachment: $("#followAttachment").files[0]?.name || "",
            operator: currentUser.name,
          });
          item.nextFollowDate = nextDate;
          closeOverlay();
          renderPage();
          toast("跟进记录已保存");
        };
      }

      function openSalesSupportModal(item) {
        const employeeOptions = employees
          .filter((employee) => employee.status === "在职")
          .map((employee) => `<option value="${employee.name}">${employee.name}</option>`)
          .join("");
        const formHtml = [
          '<div class="modal-head"><div class="modal-title">发起方案支撑</div><button class="icon-btn close" data-close title="关闭">×</button></div>',
          '<form id="salesSupportForm"><div class="modal-body">',
          `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label><select class="input" id="supportPeople" multiple size="5">${employeeOptions}</select></div>`,
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>回应时限</label><input class="input" id="supportDeadline" type="datetime-local" value="2026-09-03T12:00"></div>',
          '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑内容</label><textarea class="textarea" id="supportContent" rows="3"></textarea></div>',
          '</div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">发起支撑</button></div></form>',
        ].join("");
        openModal(
          formHtml,
        );
        $("#salesSupportForm").onsubmit = (event) => {
          event.preventDefault();
          const people = selectedValues($("#supportPeople"));
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
            }),
          );
          closeOverlay();
          renderPage();
          toast("方案支撑已发起");
        };
      }

      function handleSupportAction(item, support, action) {
        if (action === "respond") support.status = "已响应";
        if (action === "work") {
          support.status = "支撑中";
          support.delivery = support.delivery || "已提交过程内容";
        }
        if (action === "close") support.status = "已关闭";
        if (action === "supplement") support.status = "支撑中";
        if (action !== "deliver") {
          renderPage();
          toast("方案支撑状态已更新");
          return;
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">提交方案支撑交付</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="supportDeliveryForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交付说明或附件名称</label><textarea class="textarea" id="supportDelivery" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交交付</button></div></form>`,
        );
        $("#supportDeliveryForm").onsubmit = (event) => {
          event.preventDefault();
          const delivery = $("#supportDelivery").value.trim();
          if (!delivery) return toast("请填写交付说明或附件名称");
          support.delivery = delivery;
          support.status = "已交付";
          closeOverlay();
          renderPage();
          toast("方案支撑已交付");
        };
      }

      function openSalesReassignModal(item) {
        const candidates = [...new Set(customers.filter((customer) => customer.region === item.region).map((customer) => customer.pm).filter(Boolean))]
          .filter((name) => name !== item.owner);
        openModal(
          `<div class="modal-head"><div class="modal-title">改派商机负责人</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesReassignForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新负责人</label><select class="input" id="salesNewOwner"><option value="">请选择本区域有效 PM</option>${candidates.map((name) => `<option value="${name}">${name}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>改派原因</label><textarea class="textarea" id="salesReassignReason" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认改派</button></div></form>`,
        );
        $("#salesReassignForm").onsubmit = (event) => {
          event.preventDefault();
          const newOwner = $("#salesNewOwner").value;
          const reason = $("#salesReassignReason").value.trim();
          if (!newOwner || !reason) return toast("请选择新负责人并填写改派原因");
          const oldOwner = item.owner;
          item.owner = newOwner;
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
          title = `调整${regionName} PM 商机数量目标`;
          rows = region.pms.map((pm) => ({ key: `pm:${regionName}:${pm.name}`, label: pm.name, value: pm.target }));
        }
        openModal(
          `<div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn close" data-close title="关闭">×</button></div><form id="salesTargetForm"><div class="modal-body"><div class="sales-target-edit-list">${rows.map((row) => `<label class="sales-target-edit-row"><span>${row.label}</span><input class="input" type="number" min="0" step="1" data-sales-target-key="${row.key}" value="${row.value}"></label>`).join("")}</div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>调整原因</label><textarea class="textarea" id="salesTargetReason" rows="3"></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">提交调整</button></div></form>`,
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
          if (level === "pm") {
            const regionName = object.split("|")[0];
            const region = target.regions.find((item) => item.name === regionName);
            const pmTotal = region.pms.reduce(
              (sum, pm) => sum + (values[`pm:${regionName}:${pm.name}`] ?? pm.target),
              0,
            );
            if (pmTotal !== region.target)
              return toast(`PM 目标合计 ${pmTotal}，与${regionName}目标 ${region.target} 不一致`);
          }
          const changedItems = [];
          if (values.company != null && values.company !== target.companyTarget)
            changedItems.push({ level: "公司", object: "英嘉科技", before: target.companyTarget, after: values.company });
          target.regions.forEach((region) => {
            const regionValue = values[`region:${region.name}`];
            if (regionValue != null && regionValue !== region.target)
              changedItems.push({ level: "区域", object: region.name, before: region.target, after: regionValue });
            region.pms.forEach((pm) => {
              const pmValue = values[`pm:${region.name}:${pm.name}`];
              if (pmValue != null && pmValue !== pm.target)
                changedItems.push({ level: "PM", object: `${region.name} / ${pm.name}`, before: pm.target, after: pmValue });
            });
          });
          if (!changedItems.length) return toast("目标未发生变化");
          if (values.company != null) target.companyTarget = values.company;
          target.regions.forEach((region) => {
            if (values[`region:${region.name}`] != null) region.target = values[`region:${region.name}`];
            region.pms.forEach((pm) => {
              if (values[`pm:${region.name}:${pm.name}`] != null)
                pm.target = values[`pm:${region.name}:${pm.name}`];
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
        bindOpportunityFilters();
        document.querySelectorAll("[data-sales-trend]").forEach((button) => {
          button.onclick = () => {
            salesTrendMode = button.dataset.salesTrend;
            renderPage();
          };
        });
        const clearDrill = $("#clearSalesDrill");
        if (clearDrill)
          clearDrill.onclick = () => {
            salesOpportunityDrill = "";
            renderPage();
          };
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
            const request = selected?.supports.find((item) => item.id === button.dataset.supportId);
            if (selected && request) handleSupportAction(selected, request, button.dataset.supportAction);
          };
        });
        document.querySelectorAll("[data-sales-target-edit]").forEach((button) => {
          button.onclick = () => openSalesTargetModal(button.dataset.salesTargetEdit, button.dataset.salesTargetObject);
        });
        document.querySelectorAll("[data-sales-drill-stage]").forEach((button) => {
          button.onclick = () => {
            const stageValue = button.dataset.salesDrillStage;
            appliedOpportunityFilters = {
              code: "",
              name: "",
              type: "",
              stage: SALES_STAGES.includes(stageValue) ? stageValue : "",
              customer: "",
              region: "",
              owner: "",
              priority: "",
              expectedDate: "",
              createdDate: "",
              overdue: "",
            };
            salesOpportunityDrill = SALES_STAGES.includes(stageValue) ? "" : stageValue;
            salesNavigate("opportunities");
          };
        });
      }
