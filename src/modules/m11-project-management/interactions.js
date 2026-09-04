      function bindProjectEvents() {
        document.querySelectorAll("[data-project-open]").forEach((button) => {
          button.onclick = () => {
            clearProjectMaterialResults();
            selectedProjectId = button.dataset.projectOpen;
            projectDetailTab = "basic";
            currentPage = "project-detail";
            window.history.replaceState(null, "", "#project-detail");
            renderPage();
          };
        });
        const backToProjects = $("#backToProjects");
        if (backToProjects)
          backToProjects.onclick = () => {
            clearProjectMaterialResults();
            currentPage = "projects";
            window.history.replaceState(null, "", "#projects");
            renderPage();
          };
        document.querySelectorAll("[data-project-tab]").forEach((button) => {
          button.onclick = () => {
            projectDetailTab = button.dataset.projectTab;
            renderPage();
          };
        });
        document
          .querySelectorAll("[data-project-confirm-delivery]")
          .forEach((button) => {
            button.onclick = () => handleProjectConfirmDelivery();
          });
        document.querySelectorAll("[data-project-cancel-open]").forEach((button) => {
          button.onclick = () => openProjectCancelModal();
        });
        document.querySelectorAll("[data-project-terminate-open]").forEach((button) => {
          button.onclick = () => openProjectTerminationModal();
        });
        document.querySelectorAll("[data-project-supplement]").forEach((button) => {
          button.onclick = () => {
            projectDetailTab = "materials";
            renderPage();
            const target = document.querySelector(
              "[data-material-supplement-target]",
            );
            if (target) {
              target.focus({ preventScroll: true });
              target.scrollIntoView({ block: "center", behavior: "smooth" });
            }
          };
        });
        document.querySelectorAll("[data-material-add]").forEach((button) => {
          button.onclick = () => {
            const input = $("#materialAddInput");
            if (!input) return;
            input.dataset.category = button.dataset.materialAdd;
            input.value = "";
            input.click();
          };
        });
        document.querySelectorAll("[data-material-delete]").forEach((button) => {
          button.onclick = () =>
            openProjectMaterialDeleteModal(button.dataset.materialDelete);
        });
        document.querySelectorAll("[data-material-replace]").forEach((button) => {
          button.onclick = () => {
            const input = $("#materialReplaceInput");
            if (!input) return;
            input.dataset.fileId = button.dataset.materialReplace;
            input.value = "";
            input.click();
          };
        });
        const materialAddInput = $("#materialAddInput");
        if (materialAddInput)
          materialAddInput.onchange = () => {
            const category = materialAddInput.dataset.category;
            if (!category) return;
            handleMaterialAdd(category, materialAddInput.files);
          };
        const materialReplaceInput = $("#materialReplaceInput");
        if (materialReplaceInput)
          materialReplaceInput.onchange = () => {
            const fileId = materialReplaceInput.dataset.fileId;
            if (!fileId || !materialReplaceInput.files?.length) return;
            handleMaterialReplace(fileId, materialReplaceInput.files[0]);
          };
        document.querySelectorAll("[data-satisfaction-save]").forEach((button) => {
          button.onclick = () => handleSatisfactionSave();
        });
        const applyProjectFilters = () => {
          const idKeyword = $("#projectId")?.value.trim().toLowerCase() || "";
          const nameKeyword = $("#projectName")?.value.trim().toLowerCase() || "";
          const type = $("#projectType")?.value || "";
          const stage = $("#projectStage")?.value || "";
          const todo = $("#projectTodo")?.value || "";
          const customer = $("#projectCustomer")?.value || "";
          const area = $("#projectArea")?.value || "";
          const owner = $("#projectOwner")?.value || "";
          const startFrom = $("#projectStartFrom")?.value || "";
          const endTo = $("#projectEndTo")?.value || "";
          document
            .querySelectorAll("#projectBody tr[data-project-row]")
            .forEach((row) => {
              const todos = row.dataset.todos
                ? row.dataset.todos.split("|")
                : [];
              const visible =
                (!idKeyword ||
                  row.dataset.id.toLowerCase().includes(idKeyword)) &&
                (!nameKeyword || row.dataset.name.includes(nameKeyword)) &&
                (!type || row.dataset.type === type) &&
                (!stage || row.dataset.stage === stage) &&
                (!todo || todos.includes(todo)) &&
                (!customer || row.dataset.customer === customer) &&
                (!area || row.dataset.area === area) &&
                (!owner || row.dataset.owner === owner) &&
                (!startFrom || row.dataset.start >= startFrom) &&
                (!endTo || row.dataset.end <= endTo);
              row.classList.toggle("hidden", !visible);
            });
          refreshUnifiedTablePagination("m11-projects", true);
        };
        if ($("#queryProjectFilters"))
          $("#queryProjectFilters").onclick = applyProjectFilters;
        ["#projectId", "#projectName"].forEach((selector) => {
          const el = $(selector);
          if (el)
            el.onkeydown = (event) => {
              if (event.key === "Enter") applyProjectFilters();
            };
        });
        if ($("#resetProjectFilters"))
          $("#resetProjectFilters").onclick = () => {
            [
              "#projectId",
              "#projectName",
              "#projectType",
              "#projectStage",
              "#projectTodo",
              "#projectCustomer",
              "#projectArea",
              "#projectOwner",
              "#projectStartFrom",
              "#projectEndTo",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            applyProjectFilters();
          };
      }
      function nextProjectPackageId() {
        const year = DEMO_TODAY.slice(0, 4);
        const prefix = `CGB${year}`;
        const seqs = projectPackages
          .filter((pkg) => pkg.id.startsWith(prefix))
          .map((pkg) => Number(pkg.id.slice(prefix.length)));
        return `${prefix}${String((seqs.length ? Math.max(...seqs) : 0) + 1).padStart(6, "0")}`;
      }
      function nextPlatformCompanyId() {
        const seqs = platformCompanies.map((company) =>
          Number(company.id.replace(/^PT/, "")),
        );
        return `PT${String((seqs.length ? Math.max(...seqs) : 0) + 1).padStart(6, "0")}`;
      }
      function packageDirectionInputValue(value) {
        if (value === null || value === undefined || value === "") return "";
        return Number(value).toFixed(2);
      }
      function packageDirectionRowHtml(direction = {}) {
        const taxRate = projectDirectionTaxRate(direction);
        return (
          '<div class="package-direction-row" data-price-basis="untaxed">' +
          '<label class="package-direction-field package-direction-name-field"><span class="form-label"><span class="required-marker" aria-hidden="true">*</span>课程方向一句话介绍</span>' +
          `<input class="input package-direction-name" data-pkg-dir-intro value="${direction.intro || ""}" placeholder="一句话课程介绍" required></label>` +
          '<label class="package-direction-field package-direction-untaxed-field"><span class="form-label"><span class="required-marker" aria-hidden="true">*</span>不含税报价（元/天）</span>' +
          `<input class="input package-direction-price" type="number" min="0.01" step="0.01" data-pkg-dir-untaxed value="${packageDirectionInputValue(direction.untaxedPrice)}" placeholder="请输入不含税报价" required></label>` +
          '<label class="package-direction-field package-direction-tax-rate-field"><span class="form-label"><span class="required-marker" aria-hidden="true">*</span>税率（%）</span>' +
          `<input class="input package-direction-price" type="number" min="0" max="100" step="0.01" data-pkg-dir-tax-rate value="${packageDirectionInputValue(taxRate)}" placeholder="请输入税率" required></label>` +
          '<label class="package-direction-field package-direction-taxed-field"><span class="form-label"><span class="required-marker" aria-hidden="true">*</span>含税报价（元/天）</span>' +
          `<input class="input package-direction-price" type="number" min="0.01" step="0.01" data-pkg-dir-taxed value="${packageDirectionInputValue(direction.taxedPrice)}" placeholder="请输入含税报价" required></label>` +
          '<button class="icon-btn package-direction-remove" type="button" data-pkg-dir-remove title="移除该课程方向" aria-label="移除该课程方向">×</button></div>'
        );
      }
      function packageDirectionNumber(input) {
        if (!input || input.value.trim() === "") return null;
        const value = Number(input.value);
        return Number.isFinite(value) ? value : null;
      }
      function recalculatePackageDirection(row, source) {
        const untaxedInput = row.querySelector("[data-pkg-dir-untaxed]");
        const taxRateInput = row.querySelector("[data-pkg-dir-tax-rate]");
        const taxedInput = row.querySelector("[data-pkg-dir-taxed]");
        if (source === "untaxed" || source === "taxed")
          row.dataset.priceBasis = source;
        const taxRate = packageDirectionNumber(taxRateInput);
        if (taxRate === null || taxRate < 0 || taxRate > 100) return;
        const basis = row.dataset.priceBasis || "untaxed";
        if (basis === "taxed") {
          const taxed = packageDirectionNumber(taxedInput);
          if (taxed === null || taxed <= 0) return;
          untaxedInput.value = round2(taxed / (1 + taxRate / 100)).toFixed(2);
          return;
        }
        const untaxed = packageDirectionNumber(untaxedInput);
        if (untaxed === null || untaxed <= 0) return;
        taxedInput.value = round2(untaxed * (1 + taxRate / 100)).toFixed(2);
      }
      function normalizePackageDirectionInput(row, input, source) {
        const value = packageDirectionNumber(input);
        if (value !== null) input.value = round2(value).toFixed(2);
        recalculatePackageDirection(row, source === "taxRate" ? source : null);
      }
      function bindPackageDirectionInputs(row) {
        const fields = [
          [row.querySelector("[data-pkg-dir-untaxed]"), "untaxed"],
          [row.querySelector("[data-pkg-dir-tax-rate]"), "taxRate"],
          [row.querySelector("[data-pkg-dir-taxed]"), "taxed"],
        ];
        fields.forEach(([input, source]) => {
          input.oninput = () => recalculatePackageDirection(row, source);
          input.onblur = () => normalizePackageDirectionInput(row, input, source);
        });
      }
      function packageDirectionData(row) {
        const untaxedInput = row.querySelector("[data-pkg-dir-untaxed]");
        const taxRateInput = row.querySelector("[data-pkg-dir-tax-rate]");
        const taxedInput = row.querySelector("[data-pkg-dir-taxed]");
        const rawUntaxedPrice = packageDirectionNumber(untaxedInput);
        const rawTaxRate = packageDirectionNumber(taxRateInput);
        const rawTaxedPrice = packageDirectionNumber(taxedInput);
        if (rawUntaxedPrice === null || rawUntaxedPrice <= 0) {
          untaxedInput.reportValidity();
          return null;
        }
        if (rawTaxRate === null || rawTaxRate < 0 || rawTaxRate > 100) {
          taxRateInput.reportValidity();
          return null;
        }
        if (rawTaxedPrice === null || rawTaxedPrice <= 0) {
          taxedInput.reportValidity();
          return null;
        }
        const untaxedPrice = round2(rawUntaxedPrice);
        const taxRate = round2(rawTaxRate);
        const taxedPrice = round2(rawTaxedPrice);
        const basis = row.dataset.priceBasis || "untaxed";
        const expected =
          basis === "taxed"
            ? round2(taxedPrice / (1 + taxRate / 100))
            : round2(untaxedPrice * (1 + taxRate / 100));
        const actual = basis === "taxed" ? untaxedPrice : taxedPrice;
        if (actual !== expected) {
          return null;
        }
        return {
          intro: row.querySelector("[data-pkg-dir-intro]").value.trim(),
          untaxedPrice,
          taxRate,
          taxedPrice,
        };
      }
      function openPackageForm(packageId) {
        if (!hasOperationPermission("packages.manage")) return;
        const editing = packageId
          ? projectPackages.find((pkg) => pkg.id === packageId)
          : null;
        const title = editing ? "编辑采购包" : "新增采购包";
        const directionsHtml = (editing
          ? editing.directions
          : [{ intro: "", untaxedPrice: "", taxedPrice: "" }]
        )
          .map(packageDirectionRowHtml)
          .join("");
        openModal(
          `<div class="modal-head project-modal-head"><div class="modal-title">${title}</div>` +
            '<button class="icon-btn close" data-close>×</button></div>' +
            '<form id="packageForm" class="project-config-form"><div class="modal-body project-modal-body"><div class="form-grid">' +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>采购包名称</label><input class="input" id="pkgName" value="${editing?.name || ""}" required></div>` +
            `<div class="form-group"><label class="form-label">采购包编号</label><input class="input" value="${editing ? editing.id : "保存后自动生成"}" disabled></div>` +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>有效期起</label><input class="input" id="pkgValidFrom" type="date" value="${editing?.validFrom || ""}" required></div>` +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>有效期止</label><input class="input" id="pkgValidTo" type="date" value="${editing?.validTo || ""}" required></div>` +
            '</div><div class="section-title">课程方向</div>' +
            `<div id="packageDirections">${directionsHtml}</div>` +
            '<button class="btn project-direction-add" type="button" id="addPackageDirection">添加课程方向</button>' +
            '</div><div class="modal-foot project-modal-foot">' +
            '<button class="btn" type="button" data-close>取消</button>' +
            '<button class="btn btn-primary" type="submit">保存</button>' +
            '</div></form>',
        );
        const bindDirectionRemove = () => {
          document
            .querySelectorAll("#packageDirections .package-direction-row")
            .forEach((row) => {
              bindPackageDirectionInputs(row);
              const button = row.querySelector("[data-pkg-dir-remove]");
              button.onclick = () => {
                const rows = document.querySelectorAll(
                  "#packageDirections .package-direction-row",
                );
                if (rows.length <= 1) return;
                button.closest(".package-direction-row").remove();
              };
            });
        };
        bindDirectionRemove();
        $("#addPackageDirection").onclick = () => {
          $("#packageDirections").insertAdjacentHTML(
            "beforeend",
            packageDirectionRowHtml(),
          );
          bindDirectionRemove();
        };
        $("#packageForm").onsubmit = (event) => {
          event.preventDefault();
          const directions = [
            ...document.querySelectorAll(
              "#packageDirections .package-direction-row",
            ),
          ].map(packageDirectionData);
          if (directions.some((direction) => direction === null)) return;
          const data = {
            name: $("#pkgName").value.trim(),
            validFrom: $("#pkgValidFrom").value,
            validTo: $("#pkgValidTo").value,
            directions,
          };
          if (editing) {
            Object.assign(editing, data);
          } else {
            projectPackages.push({
              id: nextProjectPackageId(),
              status: "正常",
              ...data,
            });
          }
          closeOverlay();
          renderPage();
        };
      }
      function openCompanyForm(companyId) {
        if (!hasOperationPermission("platform-companies.manage")) return;
        const editing = companyId
          ? platformCompanies.find((company) => company.id === companyId)
          : null;
        const title = editing ? "编辑平台公司" : "新增平台公司";
        openModal(
          `<div class="modal-head project-modal-head"><div class="modal-title">${title}</div>` +
            '<button class="icon-btn close" data-close>×</button></div>' +
            '<form id="companyForm" class="project-config-form"><div class="modal-body project-modal-body"><div class="form-grid">' +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>平台公司名称</label><input class="input" id="companyName" value="${editing?.name || ""}" required></div>` +
            `<div class="form-group"><label class="form-label">平台公司编号</label><input class="input" value="${editing ? editing.id : "保存后自动生成"}" disabled></div>` +
            `<div class="form-group full"><label class="form-label">统一社会信用代码</label><input class="input" id="companyCreditCode" maxlength="18" pattern="[0-9A-HJ-NPQRTUWXY]{18}" value="${editing?.creditCode || ""}"></div>` +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>管理费比例（%）</label><input class="input" id="companyFeeRate" type="number" step="0.01" value="${editing?.managementFeeRate ?? ""}" required></div>` +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>合作课酬（元/天）</label><input class="input" id="companyPay" type="number" step="0.01" value="${editing?.cooperationPay ?? ""}" required></div>` +
            '</div></div><div class="modal-foot project-modal-foot">' +
            '<button class="btn" type="button" data-close>取消</button>' +
            '<button class="btn btn-primary" type="submit">保存</button>' +
            '</div></form>',
        );
        const creditInput = $("#companyCreditCode");
        creditInput.oninput = () => {
          creditInput.value = creditInput.value.toUpperCase();
          creditInput.setCustomValidity("");
        };
        creditInput.oninvalid = () => {
          if (creditInput.validity.patternMismatch)
            creditInput.setCustomValidity(
              "统一社会信用代码需为 18 位标准格式",
            );
        };
        $("#companyForm").onsubmit = (event) => {
          event.preventDefault();
          const creditCode = creditInput.value.trim().toUpperCase();
          creditInput.value = creditCode;
          creditInput.setCustomValidity("");
          if (
            creditCode &&
            !/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(creditCode)
          ) {
            creditInput.setCustomValidity(
              "统一社会信用代码需为 18 位标准格式",
            );
            creditInput.reportValidity();
            return;
          }
          const duplicate = platformCompanies.some(
            (company) =>
              company !== editing &&
              company.creditCode &&
              company.creditCode.toUpperCase() === creditCode,
          );
          if (creditCode && duplicate) {
            creditInput.setCustomValidity(
              "统一社会信用代码已存在，请核对后重试",
            );
            creditInput.reportValidity();
            return;
          }
          const data = {
            name: $("#companyName").value.trim(),
            creditCode,
            managementFeeRate: Number($("#companyFeeRate").value),
            cooperationPay: Number($("#companyPay").value),
          };
          if (editing) {
            Object.assign(editing, data);
          } else {
            platformCompanies.push({
              id: nextPlatformCompanyId(),
              status: "正常",
              ...data,
            });
          }
          closeOverlay();
          renderPage();
        };
      }
      function openPackageDetail(packageId) {
        if (!hasOperationPermission("packages.view")) return;
        const pkg = scopedProjectPackages().find((item) => item.id === packageId);
        if (!pkg) return;
        openDrawer(projectPackageDetailHtml(pkg));
      }
      function openConfigStatusConfirm(kind, id, action) {
        if (!hasOperationPermission(`${kind}.manage`)) return;
        const isPackage = kind === "packages";
        const collection = isPackage ? projectPackages : platformCompanies;
        const item = collection.find((entry) => entry.id === id);
        if (!item) return;
        const label = isPackage ? "采购包" : "平台公司";
        const isStop = action === "stop";
        const title = isStop ? `确认停用${label}` : `确认恢复${label}`;
        const body = isStop
          ? "停用后将退出新项目候选，已有项目继续使用已保存快照。"
          : "恢复后将按当前状态和有效期重新进入项目候选。";
        openModal(
          `<div class="modal-head project-modal-head"><div class="modal-title">${title}</div>` +
            '<button class="icon-btn close" data-close>×</button></div>' +
            `<div class="modal-body project-modal-body"><div class="role-note">${body}</div></div>` +
            '<div class="modal-foot project-modal-foot">' +
            '<button class="btn" type="button" data-close>取消</button>' +
            '<button class="btn btn-primary" id="confirmConfigStatus">确认</button>' +
            "</div>",
        );
        $("#confirmConfigStatus").onclick = () => {
          item.status = isStop ? "停用" : "正常";
          closeOverlay();
          renderPage();
        };
      }
      function dispatchConfigAction(action, id) {
        const handlers = {
          "add-package": () => openPackageForm(null),
          "view-package": () => openPackageDetail(id),
          "edit-package": () => openPackageForm(id),
          "stop-package": () => openConfigStatusConfirm("packages", id, "stop"),
          "restore-package": () => openConfigStatusConfirm("packages", id, "restore"),
          "add-company": () => openCompanyForm(null),
          "edit-company": () => openCompanyForm(id),
          "stop-company": () => openConfigStatusConfirm("platform-companies", id, "stop"),
          "restore-company": () => openConfigStatusConfirm("platform-companies", id, "restore"),
        };
        if (handlers[action]) handlers[action]();
      }
      function bindProjectConfigEvents() {
        document.querySelectorAll("[data-config-action]").forEach((button) => {
          button.onclick = () =>
            dispatchConfigAction(button.dataset.configAction, button.dataset.configId);
        });
        const applyPlatformCompanyFilters = () => {
          const id =
            $("#platformCompanyIdFilter")?.value.trim().toUpperCase() || "";
          const name =
            $("#platformCompanyNameFilter")?.value.trim().toLowerCase() || "";
          const creditCode =
            $("#platformCompanyCreditFilter")?.value.trim().toUpperCase() || "";
          const status = $("#platformCompanyStatusFilter")?.value || "";
          const rows = [
            ...document.querySelectorAll("[data-platform-company-row]"),
          ];
          let matched = 0;
          rows.forEach((row) => {
            const visible =
              (!id || row.dataset.companyId === id) &&
              (!name || row.dataset.companyName.includes(name)) &&
              (!creditCode || row.dataset.companyCredit === creditCode) &&
              (!status || row.dataset.companyStatus === status);
            row.classList.toggle("hidden", !visible);
            if (visible) matched += 1;
          });
          const empty = $("#platformCompanyFilterEmpty");
          if (empty) empty.style.display = rows.length && !matched ? "" : "none";
        };
        const applyButton = $("#applyPlatformCompanyFilters");
        if (applyButton) applyButton.onclick = applyPlatformCompanyFilters;
        const resetButton = $("#resetPlatformCompanyFilters");
        if (resetButton)
          resetButton.onclick = () => {
            [
              "#platformCompanyIdFilter",
              "#platformCompanyNameFilter",
              "#platformCompanyCreditFilter",
              "#platformCompanyStatusFilter",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            applyPlatformCompanyFilters();
          };
      }
      function nextProjectIdForYear(year) {
        const prefix = `XM${year}`;
        const seqs = projects
          .filter((project) => project.id.startsWith(prefix))
          .map((project) => Number(project.id.slice(prefix.length)))
          .filter(Number.isFinite);
        return `${prefix}${String((seqs.length ? Math.max(...seqs) : 0) + 1).padStart(6, "0")}`;
      }
      function nextProjectId() {
        return nextProjectIdForYear(DEMO_TODAY.slice(0, 4));
      }
      function projectImportIssue(field, code, reason, suggestion) {
        return { field, code, reason, suggestion };
      }
      function projectImportDateTimeValid(value) {
        const text = String(value || "");
        const match = text.match(
          /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/,
        );
        if (!match) return false;
        const [, year, month, day, hour, minute, second = "0"] = match;
        const parsed = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
        );
        return (
          parsed.getFullYear() === Number(year) &&
          parsed.getMonth() === Number(month) - 1 &&
          parsed.getDate() === Number(day) &&
          parsed.getHours() === Number(hour) &&
          parsed.getMinutes() === Number(minute) &&
          parsed.getSeconds() === Number(second)
        );
      }
      function projectImportTimeValue(value) {
        return new Date(String(value).replace(" ", "T")).getTime();
      }
      function projectImportActorEligible(actor) {
        if (!actor || !["admin", "director", "pm"].includes(actor.role))
          return false;
        if (actor.fullAccess) return actor.role === "admin";
        const employee = employees.find((item) => item.name === actor.name);
        const expectedRole = actor.role === "director" ? "区域总监" : "PM";
        return Boolean(
          employee &&
            employee.status === "在职" &&
            employeeHasRole(employee, expectedRole),
        );
      }
      function projectImportCustomer(row) {
        const code = String(row?.customerCode || "").trim();
        const matches = customers.filter(
          (customer) => customerStableCode(customer) === code,
        );
        return matches.length === 1 ? matches[0] : null;
      }
      function projectImportCustomerInScope(customer, owner, actor) {
        if (!customer || !owner || !projectImportActorEligible(actor)) return false;
        if (actor.fullAccess) return true;
        if (actor.role === "director") {
          return (
            customer.level === "省公司" &&
            owner === actor.name &&
            regionsMatch(customerRegionScope(customer), actor.region)
          );
        }
        return (
          actor.role === "pm" &&
          ["市公司", "区县公司"].includes(customer.level) &&
          owner === actor.name
        );
      }
      function projectImportStageMatchesTime(type, stage, startTime, endTime) {
        const startValue = projectImportTimeValue(startTime);
        const endValue = projectImportTimeValue(endTime);
        const nowValue = projectImportTimeValue(DEMO_NOW);
        if (startValue > nowValue) return false;
        if (type === "培训项目") {
          if (stage === "进行中") return endValue > nowValue;
          return ["已交付", "已完成"].includes(stage) && endValue <= nowValue;
        }
        if (stage === "进行中") return true;
        return ["已交付", "已完成"].includes(stage) && endValue <= nowValue;
      }
      function prepareProjectImportRow(row, actor) {
        const rowNumber = Number(row?.rowNumber || 0) || 0;
        const name = String(row?.name || "").trim();
        const type = String(row?.type || "").trim();
        const startTime = String(row?.startTime || "").trim();
        const endTime = String(row?.endTime || "").trim();
        const originalCreatedAt = String(row?.originalCreatedAt || "").trim();
        const importStage = String(row?.importStage || "").trim();
        const resourceType = String(row?.resourceType || "").trim();
        const cooperation = String(row?.cooperation || "").trim();
        const packageId =
          resourceType === "采购包课程" ? String(row?.packageId || "").trim() : "";
        const directionIntro =
          resourceType === "采购包课程"
            ? String(row?.directionIntro || "").trim()
            : "";
        const companyId = ["师资合作", "走账合作"].includes(cooperation)
          ? String(row?.companyId || "").trim()
          : "";
        const days = Number(row?.days);
        const issues = [];
        const addIssue = (field, code, reason, suggestion) =>
          issues.push(projectImportIssue(field, code, reason, suggestion));

        if (name.length < 2 || name.length > 100 || /<[^>]*>/.test(name))
          addIssue(
            "项目名称",
            "IMP-PROJECT-FIELD-001",
            "项目名称需为 2-100 字且不得包含 HTML 标签",
            "修正项目名称后重新上传",
          );
        if (!PROJECT_TYPES.includes(type))
          addIssue(
            "项目类型",
            "IMP-PROJECT-FIELD-002",
            "项目类型不在当前候选范围",
            "使用培训项目或 AI软件项目",
          );
        if (!projectImportDateTimeValid(originalCreatedAt))
          addIssue(
            "原创建时间",
            "IMP-PROJECT-TIME-001",
            "原创建时间格式无效",
            "使用 YYYY-MM-DD HH:mm 格式",
          );
        if (!projectImportDateTimeValid(startTime))
          addIssue(
            "开始时间",
            "IMP-PROJECT-TIME-002",
            "开始时间格式无效",
            "使用 YYYY-MM-DD HH:mm 格式",
          );
        if (!projectImportDateTimeValid(endTime))
          addIssue(
            "结束时间",
            "IMP-PROJECT-TIME-003",
            "结束时间格式无效",
            "使用 YYYY-MM-DD HH:mm 格式",
          );
        if (
          projectImportDateTimeValid(startTime) &&
          projectImportDateTimeValid(endTime) &&
          projectImportTimeValue(startTime) > projectImportTimeValue(endTime)
        )
          addIssue(
            "结束时间",
            "IMP-PROJECT-TIME-004",
            "项目开始时间不得晚于结束时间",
            "修正项目时间后重新上传",
          );
        if (!["进行中", "已交付", "已完成"].includes(importStage))
          addIssue(
            "导入阶段",
            "IMP-PROJECT-STAGE-001",
            "当前初始化项目不支持该导入阶段",
            "使用进行中、已交付或已完成",
          );
        if (
          PROJECT_TYPES.includes(type) &&
          ["进行中", "已交付", "已完成"].includes(importStage) &&
          projectImportDateTimeValid(startTime) &&
          projectImportDateTimeValid(endTime) &&
          projectImportTimeValue(startTime) <= projectImportTimeValue(endTime) &&
          !projectImportStageMatchesTime(type, importStage, startTime, endTime)
        )
          addIssue(
            "导入阶段",
            "IMP-PROJECT-STAGE-002",
            "导入阶段与项目类型及开始/结束时间不一致",
            "修正阶段或时间后重新上传",
          );
        if (!Number.isFinite(days) || days < 0.5 || days % 0.5 !== 0)
          addIssue(
            "项目确认天数",
            "IMP-PROJECT-FIELD-003",
            "项目确认天数最小为 0.5 天且必须为 0.5 的整数倍",
            "修正项目确认天数后重新上传",
          );

        const customer = projectImportCustomer(row);
        if (!customer || customer.archived)
          addIssue(
            "客户编号",
            "IMP-PROJECT-CUSTOMER-001",
            "客户编号无法匹配当前有效客户",
            "核对当前客户编号后重新上传",
          );
        const owner = customer ? resolveProjectOwner(customer) : "";
        if (customer && !owner)
          addIssue(
            "客户编号",
            "IMP-PROJECT-OWNER-001",
            "客户地区无法匹配唯一有效项目负责人",
            "完成地区责任配置后重新上传",
          );
        if (customer && owner && !projectImportCustomerInScope(customer, owner, actor))
          addIssue(
            "客户编号",
            "IMP-PROJECT-SCOPE-001",
            "超出当前导入范围",
            "使用当前账号有权客户的项目模板行",
          );

        if (!projectResourceTypes(type).includes(resourceType))
          addIssue(
            "资源类型",
            "IMP-PROJECT-RESOURCE-001",
            "项目类型与资源类型不匹配",
            "按当前项目类型选择资源",
          );
        if (!(PROJECT_RESOURCE_COOPERATION[resourceType] || []).includes(cooperation))
          addIssue(
            "合作形式",
            "IMP-PROJECT-RESOURCE-002",
            "资源类型与合作形式不匹配",
            "按当前资源类型选择合作形式",
          );
        const pkg = packageId
          ? projectPackages.find((item) => item.id === packageId)
          : null;
        const direction = pkg
          ? pkg.directions.find((item) => item.intro === directionIntro)
          : null;
        const company = companyId
          ? platformCompanies.find((item) => item.id === companyId)
          : null;
        if (resourceType === "采购包课程" && (!pkg || !direction || !isProjectPackageValid(pkg)))
          addIssue(
            "采购包及课程方向",
            "IMP-PROJECT-RESOURCE-003",
            "采购包或课程方向当前不可用",
            "使用当前正常且有效的采购包与方向",
          );
        if (["师资合作", "走账合作"].includes(cooperation) && (!company || company.status !== "正常"))
          addIssue(
            "平台公司",
            "IMP-PROJECT-RESOURCE-004",
            "平台公司当前不可用",
            "使用当前正常的平台公司",
          );
        const aiAmount = Number(row?.aiAmount);
        if (type === "AI软件项目" && (!Number.isFinite(aiAmount) || aiAmount <= 0))
          addIssue(
            "AI 软件项目金额",
            "IMP-PROJECT-AMOUNT-001",
            "AI 软件项目金额必须大于 0",
            "填写有效项目金额后重新上传",
          );

        if (issues.length) {
          return {
            rowNumber,
            sourceRow: { ...row },
            classification: "error",
            issues,
          };
        }
        if (
          projects.some(
            (project) => project.name === name && project.stage !== "已取消",
          )
        ) {
          return {
            rowNumber,
            sourceRow: { ...row },
            classification: "duplicate",
            issues: [
              projectImportIssue(
                "项目名称",
                "IMP-PROJECT-DUP-001",
                "项目名称命中当前存量项目",
                "默认跳过，不覆盖或更新存量项目",
              ),
            ],
          };
        }

        let unitPrice = null;
        let snapshot;
        if (type === "培训项目") {
          unitPrice =
            resourceType === "采购包课程"
              ? direction.taxedPrice
              : company.cooperationPay;
          snapshot = {
            untaxedPrice: direction ? direction.untaxedPrice : null,
            taxedPrice: direction ? direction.taxedPrice : null,
            taxRate: direction ? projectDirectionTaxRate(direction) : null,
            cooperationPay:
              resourceType === "平台师资合作" ? company.cooperationPay : null,
            managementFeeRate:
              cooperation === "走账合作" ? company.managementFeeRate : null,
            unitPrice,
          };
        } else {
          snapshot = {
            untaxedPrice: null,
            taxedPrice: null,
            taxRate: null,
            cooperationPay: null,
            managementFeeRate:
              cooperation === "走账合作" ? company.managementFeeRate : null,
            unitPrice: null,
          };
        }
        const amount =
          type === "培训项目" ? round2(unitPrice * days) : round2(aiAmount);
        const settlementAmount =
          cooperation === "走账合作"
            ? round2(amount * (1 - company.managementFeeRate / 100))
            : amount;
        const stage = importStage === "已完成" ? "已交付" : importStage;
        const deliveryConfirmed =
          type === "AI软件项目" && stage === "已交付";
        const prepared = {
          name,
          type,
          customerId: customer.id,
          customerSnapshot: {
            customerCode: customerStableCode(customer),
            name: customer.name,
            level: customer.level,
            province: customer.province,
            city: customer.city,
            district: customer.district,
          },
          originalCreatedAt,
          ownerSnapshot: owner,
          startTime,
          endTime,
          days,
          resourceType,
          cooperation,
          packageId,
          directionIntro,
          companyId,
          companyName: companyId ? company.name : "",
          unitPrice,
          amount,
          settlementAmount,
          snapshot,
          stage,
          deliveryConfirmed,
          lecturers: [],
          assistantLecturers: [],
          teachingAssistants: [],
          materials: [],
          satisfaction: null,
        };
        prepared.todos = projectTodosForStage(prepared, stage);
        return {
          rowNumber,
          sourceRow: { ...row },
          classification: "valid",
          issues: [],
          adjustment:
            importStage === "已完成"
              ? "当前完成条件未齐，将按已交付建立并显示待办"
              : "",
          prepared,
        };
      }
      function createProjectFromImportRow(row, actor, batchId) {
        const checked = prepareProjectImportRow(row, actor);
        if (checked.classification !== "valid") {
          return {
            success: false,
            rowNumber: checked.rowNumber,
            issues: checked.issues,
          };
        }
        const year = checked.prepared.originalCreatedAt.slice(0, 4);
        const projectId = nextProjectIdForYear(year);
        const project = {
          ...checked.prepared,
          id: projectId,
          opportunityId: "",
          createdBy: actor.name,
          createdAt: checked.prepared.originalCreatedAt,
          source: "import",
          importBatchId: batchId,
          importedBy: actor.name,
          importedByAccount: importAccountKey(actor),
          importedAt: projectNow(),
        };
        const insertAt = projects.length;
        try {
          projects.push(project);
          normalizeProjectLifecycle(project);
        } catch (error) {
          projects.splice(insertAt, 1);
          return {
            success: false,
            rowNumber: checked.rowNumber,
            issues: [
              projectImportIssue(
                "项目",
                "IMP-PROJECT-WRITE-001",
                "正式写入失败；本行未建立项目且未占用编号",
                "按结果报告修正后重新上传",
              ),
            ],
          };
        }
        return {
          success: true,
          rowNumber: checked.rowNumber,
          project,
          projectId,
          adjustment: checked.adjustment,
        };
      }
      function projectNow() {
        const n = new Date();
        const p = (x) => String(x).padStart(2, "0");
        return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
      }
      function recordProjectChange(
        project,
        field,
        before,
        after,
        reason = "",
        operator = currentUser?.name || "—",
      ) {
        if (!project || before === after) return;
        if (!Array.isArray(project.changeHistory)) project.changeHistory = [];
        project.changeHistory.push({
          field,
          before,
          after,
          operator,
          time: projectNow(),
          reason: reason || "",
        });
      }
      function pruneProjectStaffScores(project) {
        if (!project?.satisfaction?.staffScores) return;
        const current = new Set([
          ...(project.lecturers || []),
          ...(project.assistantLecturers || []),
          ...(project.teachingAssistants || []),
        ]);
        Object.keys(project.satisfaction.staffScores).forEach((name) => {
          if (!current.has(name)) delete project.satisfaction.staffScores[name];
        });
      }
      function nextMaterialId() {
        const seqs = projects
          .flatMap((project) => projectMaterials(project))
          .map((material) => Number(String(material.id).replace(/^MAT/, "")))
          .filter((n) => Number.isFinite(n));
        return `MAT${String((seqs.length ? Math.max(...seqs) : 0) + 1).padStart(6, "0")}`;
      }
      function selectedInstructorNames(containerId) {
        const names = [
          ...document.querySelectorAll(`#${containerId} input[data-instructor]:checked`),
        ].map((input) => input.value);
        return [...new Set(names)].filter((name) =>
          projectInstructors.includes(name),
        );
      }
      let projectInstructorOutsideClickBound = false;
      function setInstructorSelectOpen(picker, open) {
        const trigger = picker.querySelector("[data-instructor-trigger]");
        const menu = picker.querySelector("[data-instructor-menu]");
        const search = picker.querySelector("[data-instructor-search]");
        if (!trigger || !menu) return;
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        menu.classList.toggle("hidden", !open);
        if (open) {
          search?.focus();
          return;
        }
        if (search) search.value = "";
        picker
          .querySelectorAll("[data-instructor-option]")
          .forEach((option) => (option.hidden = false));
      }
      function renderInstructorSelected(picker) {
        const selectedContainer = picker.querySelector(
          "[data-instructor-selected]",
        );
        if (!selectedContainer) return;
        const names = [
          ...picker.querySelectorAll("input[data-instructor]:checked"),
        ].map((input) => input.value);
        selectedContainer.innerHTML = names
          .map(
            (name) =>
              `<span class="instructor-selected-item"><span>${escapeHtml(name)}</span><button class="instructor-selected-remove" type="button" data-instructor-remove="${escapeHtml(name)}" title="移除${escapeHtml(name)}" aria-label="移除${escapeHtml(name)}">×</button></span>`,
          )
          .join("");
      }
      function bindInstructorSelects(form) {
        const pickers = [...form.querySelectorAll("[data-instructor-picker]")];
        pickers.forEach((picker) => {
          const trigger = picker.querySelector("[data-instructor-trigger]");
          const search = picker.querySelector("[data-instructor-search]");
          const selectedContainer = picker.querySelector(
            "[data-instructor-selected]",
          );
          trigger.onclick = () => {
            const open = trigger.getAttribute("aria-expanded") !== "true";
            document
              .querySelectorAll("[data-instructor-picker]")
              .forEach((other) => setInstructorSelectOpen(other, false));
            setInstructorSelectOpen(picker, open);
          };
          search.oninput = () => {
            const keyword = search.value.trim().toLocaleLowerCase("zh-CN");
            picker
              .querySelectorAll("[data-instructor-option]")
              .forEach((option) => {
                option.hidden = !option.textContent
                  .toLocaleLowerCase("zh-CN")
                  .includes(keyword);
              });
          };
          search.onkeydown = (event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape") {
              event.preventDefault();
              setInstructorSelectOpen(picker, false);
              trigger.focus();
            }
          };
          picker
            .querySelectorAll("input[data-instructor]")
            .forEach((input) => {
              input.onchange = () => renderInstructorSelected(picker);
            });
          selectedContainer.onclick = (event) => {
            const removeButton = event.target.closest(
              "[data-instructor-remove]",
            );
            if (!removeButton) return;
            const input = [
              ...picker.querySelectorAll("input[data-instructor]"),
            ].find(
              (candidate) =>
                candidate.value === removeButton.dataset.instructorRemove,
            );
            if (input) input.checked = false;
            renderInstructorSelected(picker);
          };
        });
        if (!projectInstructorOutsideClickBound) {
          document.addEventListener("click", (event) => {
            document
              .querySelectorAll("[data-instructor-picker]")
              .forEach((picker) => {
                if (!picker.contains(event.target))
                  setInstructorSelectOpen(picker, false);
              });
          });
          projectInstructorOutsideClickBound = true;
        }
      }
      function clearProjectFormErrors() {
        document
          .querySelectorAll("#projectForm .field-error")
          .forEach((el) => (el.textContent = ""));
      }
      function showProjectFormError(id, message) {
        const el = document.getElementById(`err-${id}`);
        if (el) el.textContent = message;
      }
      function setProjectFieldVisible(id, visible) {
        const group = document.getElementById(id)?.closest(".form-group");
        if (group) group.style.display = visible ? "" : "none";
      }
      function projectScheduleConflicts(personnel, startTime, endTime, excludeId) {
        const conflicts = [];
        const names = new Set([
          ...personnel.lecturers,
          ...personnel.assistantLecturers,
          ...personnel.teachingAssistants,
        ]);
        if (!names.size || !startTime || !endTime) return conflicts;
        projects.forEach((other) => {
          if (other.id === excludeId) return;
          if (["已取消", "已中止"].includes(other.stage)) return;
          const otherNames = [
            ...(other.lecturers || []),
            ...(other.assistantLecturers || []),
            ...(other.teachingAssistants || []),
          ];
          const overlapNames = [...names].filter((name) =>
            otherNames.includes(name),
          );
          if (!overlapNames.length) return;
          if (!(startTime < other.endTime && other.startTime < endTime)) return;
          overlapNames.forEach((name) =>
            conflicts.push({
              name,
              projectId: other.id,
              startTime: other.startTime,
              endTime: other.endTime,
            }),
          );
        });
        return conflicts;
      }
      function refreshProjectFormDays(fallbackStartTime) {
        const startValue =
          $("#pfStart")?.value || fallbackStartTime?.replace(" ", "T") || "";
        const endValue = $("#pfEnd")?.value || $("#pfStageEnd")?.value || "";
        const calculatedInput = $("#pfCalculatedDays");
        const confirmedInput = $("#pfDays");
        if (!startValue || !endValue) {
          if (calculatedInput) calculatedInput.value = "";
          if (confirmedInput?.dataset.userEdited !== "true")
            confirmedInput.value = "";
          return null;
        }
        const startTime = startValue.replace("T", " ");
        const endTime = endValue.replace("T", " ");
        if (startTime > endTime) {
          if (calculatedInput) calculatedInput.value = "";
          return null;
        }
        const calculatedDays = naturalDayCount(startTime, endTime);
        if (calculatedInput) calculatedInput.value = calculatedDays;
        if (confirmedInput?.dataset.userEdited !== "true")
          confirmedInput.value = calculatedDays;
        return calculatedDays;
      }
      function openProjectDaysConfirm(calculatedDays, confirmedDays, onConfirm) {
        openModal(
          '<div class="modal-head project-modal-head"><div class="modal-title">确认使用不同的项目天数</div><button class="icon-btn close" data-close title="返回修改">×</button></div>' +
            '<div class="modal-body project-modal-body">' +
            `<div>系统计算天数：${calculatedDays}天；</div>` +
            `<div>项目确认天数：${confirmedDays}天；</div>` +
            '</div><div class="modal-foot project-modal-foot">' +
            '<button class="btn" type="button" data-close>返回修改</button>' +
            '<button class="btn btn-primary" type="button" id="confirmProjectDaysSave">确认保存</button>' +
            "</div>",
        );
        $("#confirmProjectDaysSave").onclick = () => {
          closeOverlay();
          onConfirm();
        };
      }
      function projectFormResourceChanged(project) {
        if (!project) return false;
        const resourceType = $("#pfResource").value;
        const cooperation = $("#pfCooperation").value;
        const packageId =
          resourceType === "采购包课程" ? $("#pfPackage").value : "";
        const directionIntro =
          resourceType === "采购包课程" ? $("#pfDirection").value : "";
        const companyId = ["师资合作", "走账合作"].includes(cooperation)
          ? $("#pfCompany").value
          : "";
        return (
          resourceType !== project.resourceType ||
          cooperation !== project.cooperation ||
          packageId !== (project.packageId || "") ||
          directionIntro !== (project.directionIntro || "") ||
          companyId !== (project.companyId || "")
        );
      }
      function refreshProjectFormAmounts() {
        const type = $("#pfType").value;
        const resourceType = $("#pfResource").value;
        const cooperation = $("#pfCooperation").value;
        const packageId = $("#pfPackage").value;
        const directionIntro = $("#pfDirection").value;
        const companyId = $("#pfCompany").value;
        const days = Number($("#pfDays").value);
        const editingProject =
          currentPage === "project-edit" ? projectById(selectedProjectId) : null;
        const resourceChanged = projectFormResourceChanged(editingProject);
        const company = platformCompanies.find((item) => item.id === companyId);
        const feeRate =
          cooperation === "走账合作"
            ? editingProject &&
              !resourceChanged &&
              editingProject.snapshot?.managementFeeRate != null
              ? editingProject.snapshot.managementFeeRate
              : company?.managementFeeRate
            : null;
        const feeRateInput = $("#pfManagementFeeRate");
        if (feeRateInput)
          feeRateInput.value =
            feeRate === null || feeRate === undefined
              ? "—"
              : Number(feeRate).toFixed(2);
        let unitPrice = null;
        if (editingProject && !resourceChanged && editingProject.snapshot) {
          unitPrice = editingProject.snapshot.unitPrice;
        } else if (type === "培训项目") {
          if (resourceType === "采购包课程" && packageId && directionIntro) {
            const pkg = projectPackages.find((item) => item.id === packageId);
            const direction = pkg?.directions.find(
              (item) => item.intro === directionIntro,
            );
            if (direction) unitPrice = direction.taxedPrice;
          } else if (resourceType === "平台师资合作" && company) {
            unitPrice = company.cooperationPay;
          }
        }
        if (type === "培训项目") {
          $("#pfUnitPrice").value =
            unitPrice != null ? formatProjectMoney(unitPrice) : "—";
          if (unitPrice != null && days) {
            $("#pfAmount").value = round2(unitPrice * days);
          }
        }
        const amount = Number($("#pfAmount").value);
        if (amount) {
          let settlement = amount;
          if (cooperation === "走账合作" && feeRate != null) {
            settlement = round2(amount * (1 - feeRate / 100));
          }
          $("#pfSettlement").value = formatProjectMoney(settlement);
        }
      }
      function refreshProjectFormulaText(id, text) {
        const formula = $(id);
        if (!formula) return;
        formula.textContent = text;
        formula.style.display = text ? "" : "none";
      }
      function refreshStageProjectAmounts(project) {
        const amountInput = $("#pfAmount");
        const settlementInput = $("#pfSettlement");
        if (!amountInput || !settlementInput) return;
        const days = Number($("#pfDays")?.value);
        let amount = Number(project.amount);
        if (project.type === "培训项目") {
          amount =
            Number.isFinite(days) && days > 0 && project.snapshot?.unitPrice != null
              ? round2(project.snapshot.unitPrice * days)
              : null;
        }
        if (!Number.isFinite(amount)) {
          amountInput.value = "—";
          settlementInput.value = "—";
          return;
        }
        const feeRate = project.snapshot?.managementFeeRate;
        const settlement =
          project.cooperation === "走账合作" && feeRate != null
            ? round2(amount * (1 - feeRate / 100))
            : amount;
        amountInput.value = formatProjectMoney(amount);
        settlementInput.value = formatProjectMoney(settlement);
      }
      function refreshProjectFormDynamics() {
        const type = $("#pfType").value;
        const resourceType = $("#pfResource").value;
        const cooperation = $("#pfCooperation").value;
        const showPersonnel = type === "培训项目";
        const showPackage = resourceType === "采购包课程";
        const showCompany = ["师资合作", "走账合作"].includes(cooperation);
        const showUnitPrice = type === "培训项目";
        const personnelSection = $("#pfPersonnelSection");
        const daysHelp = $("#pfDaysHelp");
        if (personnelSection)
          personnelSection.style.display = showPersonnel ? "" : "none";
        if (daysHelp) {
          daysHelp.textContent = type
            ? showPersonnel
              ? "项目费用按此天数计算"
              : "仅用于记录项目周期，不参与项目金额计算"
            : "";
          daysHelp.style.display = type ? "" : "none";
        }
        setProjectFieldVisible("pfPackage", showPackage);
        setProjectFieldVisible("pfDirection", showPackage);
        setProjectFieldVisible("pfCompany", showCompany);
        setProjectFieldVisible(
          "pfManagementFeeRate",
          cooperation === "走账合作",
        );
        setProjectFieldVisible("pfUnitPrice", showUnitPrice);
        refreshProjectFormulaText(
          "#pfAmountFormula",
          projectAmountFormulaText(type),
        );
        refreshProjectFormulaText(
          "#pfSettlementFormula",
          projectSettlementFormulaText(cooperation),
        );
        refreshProjectFormAmounts();
      }
      function writePreStartEditHistory(project, payload) {
        const previousCalculatedDays = projectCalculatedDays(project);
        const nextCalculatedDays = naturalDayCount(
          payload.startTime,
          payload.endTime,
        );
        if (project.name !== payload.name)
          recordProjectChange(project, "项目名称", project.name, payload.name);
        if (project.startTime !== payload.startTime)
          recordProjectChange(
            project,
            "开始时间",
            project.startTime,
            payload.startTime,
          );
        if (project.endTime !== payload.endTime)
          recordProjectChange(
            project,
            "结束时间",
            project.endTime,
            payload.endTime,
          );
        if (project.resourceType !== payload.resourceType)
          recordProjectChange(
            project,
            "资源类型",
            project.resourceType || "—",
            payload.resourceType || "—",
          );
        if (project.cooperation !== payload.cooperation)
          recordProjectChange(
            project,
            "合作形式",
            project.cooperation || "—",
            payload.cooperation || "—",
          );
        if ((project.packageId || "") !== (payload.packageId || ""))
          recordProjectChange(
            project,
            "采购包",
            projectPackageLabel(project.packageId),
            projectPackageLabel(payload.packageId),
          );
        if ((project.directionIntro || "") !== (payload.directionIntro || ""))
          recordProjectChange(
            project,
            "课程方向",
            project.directionIntro || "—",
            payload.directionIntro || "—",
          );
        if ((project.companyId || "") !== (payload.companyId || ""))
          recordProjectChange(
            project,
            "平台公司",
            projectCompanyLabel(project.companyId),
            projectCompanyLabel(payload.companyId),
          );
        if (previousCalculatedDays !== nextCalculatedDays)
          recordProjectChange(
            project,
            "系统计算天数",
            `${previousCalculatedDays} 天`,
            `${nextCalculatedDays} 天`,
          );
        if (project.days !== payload.days)
          recordProjectChange(
            project,
            "项目确认天数",
            `${project.days} 天`,
            `${payload.days} 天`,
          );
        if (project.amount !== payload.amount)
          recordProjectChange(
            project,
            "项目金额",
            `¥${formatProjectMoney(project.amount)}`,
            `¥${formatProjectMoney(payload.amount)}`,
          );
        if (project.settlementAmount !== payload.settlementAmount)
          recordProjectChange(
            project,
            "结账金额",
            `¥${formatProjectMoney(project.settlementAmount)}`,
            `¥${formatProjectMoney(payload.settlementAmount)}`,
          );
        if (!staffSetsEqual(project.lecturers, payload.lecturers))
          recordProjectChange(
            project,
            "主讲师",
            staffDisplay(project.lecturers),
            staffDisplay(payload.lecturers),
          );
        if (!staffSetsEqual(project.assistantLecturers, payload.assistantLecturers))
          recordProjectChange(
            project,
            "辅讲师",
            staffDisplay(project.assistantLecturers),
            staffDisplay(payload.assistantLecturers),
          );
        if (!staffSetsEqual(project.teachingAssistants, payload.teachingAssistants))
          recordProjectChange(
            project,
            "项目助教",
            staffDisplay(project.teachingAssistants),
            staffDisplay(payload.teachingAssistants),
          );
      }
      function handleStageProjectEditSubmit(project, mode, daysConfirmed = false) {
        clearProjectFormErrors();
        const isTraining = project.type === "培训项目";
        const name = $("#pfStageName").value.trim();
        const lecturers = isTraining
          ? selectedInstructorNames("pfStageLecturers")
          : [];
        const assistants = isTraining
          ? selectedInstructorNames("pfStageAssistants")
          : [];
        const helpers = isTraining
          ? selectedInstructorNames("pfStageHelpers")
          : [];
        const reason = $("#pfChangeReason")
          ? $("#pfChangeReason").value.trim()
          : "";

        const errors = {};
        if (!name) errors.pfStageName = "请填写项目名称";
        if (
          name &&
          projects.some(
            (item) =>
              item.name === name &&
              item.stage !== "已取消" &&
              item.id !== project.id,
          )
        )
          errors.pfStageName = "项目名称已存在，请修改后重试";

        let endTime = project.endTime;
        if (mode === "in-progress") {
          endTime = $("#pfStageEnd").value.replace("T", " ");
          if (!endTime) errors.pfStageEnd = "请填写结束时间";
          if (endTime && endTime < project.startTime)
            errors.pfStageEnd = "项目开始时间不得晚于项目结束时间";
        }

        if (isTraining && !lecturers.length)
          errors.pfStageLecturers = "培训项目至少需要选择一名主讲师";

        const staffChanged =
          !staffSetsEqual(project.lecturers, lecturers) ||
          !staffSetsEqual(project.assistantLecturers, assistants) ||
          !staffSetsEqual(project.teachingAssistants, helpers);
        if (staffChanged && !reason)
          errors.pfChangeReason = "请填写人员调整原因";

        const endChanged = mode === "in-progress" && endTime !== project.endTime;

        const previousCalculatedDays = projectCalculatedDays(project);
        let calculatedDays = previousCalculatedDays;
        let days = project.days;
        let amount = project.amount;
        let settlementAmount = project.settlementAmount;
        if (mode === "in-progress" && endTime && endTime >= project.startTime) {
          calculatedDays = naturalDayCount(project.startTime, endTime);
          const daysValue = $("#pfDays").value.trim();
          if (daysValue === "") {
            errors.pfDays = "请填写项目确认天数";
          } else {
            days = Number(daysValue);
            if (!Number.isFinite(days) || days <= 0)
              errors.pfDays = "请填写项目确认天数";
            else if (days < 0.5 || days % 0.5 !== 0)
              errors.pfDays =
                "项目确认天数最小为0.5天，且必须为0.5天的整数倍";
          }
          if (isTraining && project.snapshot?.unitPrice != null) {
            amount = round2(project.snapshot.unitPrice * days);
            const feeRate =
              project.cooperation === "走账合作"
                ? project.snapshot.managementFeeRate
                : null;
            settlementAmount =
              project.cooperation === "走账合作" && feeRate != null
                ? round2(amount * (1 - feeRate / 100))
                : amount;
          }
        }

        const shouldCheckConflicts = isTraining && (staffChanged || endChanged);
        const conflicts = shouldCheckConflicts
          ? projectScheduleConflicts(
              {
                lecturers,
                assistantLecturers: assistants,
                teachingAssistants: helpers,
              },
              project.startTime,
              mode === "in-progress" ? endTime : project.endTime,
              project.id,
            )
          : [];

        if (Object.keys(errors).length || conflicts.length) {
          Object.entries(errors).forEach(([field, message]) =>
            showProjectFormError(field, message),
          );
          if (conflicts.length) {
            const conflictHtml = conflicts
              .map(
                (conflict) =>
                  `${conflict.name}：与 ${conflict.projectId}（${conflict.startTime} ~ ${conflict.endTime}）时间重叠`,
              )
              .join("<br>");
            showProjectFormError("pfConflicts", conflictHtml);
          }
          return;
        }

        if (
          mode === "in-progress" &&
          !daysConfirmed &&
          days !== calculatedDays
        ) {
          openProjectDaysConfirm(calculatedDays, days, () =>
            handleStageProjectEditSubmit(project, mode, true),
          );
          return;
        }

        if (name !== project.name)
          recordProjectChange(project, "项目名称", project.name, name);
        if (endChanged) {
          recordProjectChange(project, "结束时间", project.endTime, endTime);
          if (calculatedDays !== previousCalculatedDays)
            recordProjectChange(
              project,
              "系统计算天数",
              `${previousCalculatedDays} 天`,
              `${calculatedDays} 天`,
            );
        }
        if (isTraining && amount !== project.amount)
          recordProjectChange(
            project,
            "项目金额",
            `¥${formatProjectMoney(project.amount)}`,
            `¥${formatProjectMoney(amount)}`,
          );
        if (isTraining && settlementAmount !== project.settlementAmount)
          recordProjectChange(
            project,
            "结账金额",
            `¥${formatProjectMoney(project.settlementAmount)}`,
            `¥${formatProjectMoney(settlementAmount)}`,
          );
        if (days !== project.days)
          recordProjectChange(
            project,
            "项目确认天数",
            `${project.days} 天`,
            `${days} 天`,
          );
        if (!staffSetsEqual(project.lecturers, lecturers))
          recordProjectChange(
            project,
            "主讲师",
            staffDisplay(project.lecturers),
            staffDisplay(lecturers),
            reason,
          );
        if (!staffSetsEqual(project.assistantLecturers, assistants))
          recordProjectChange(
            project,
            "辅讲师",
            staffDisplay(project.assistantLecturers),
            staffDisplay(assistants),
            reason,
          );
        if (!staffSetsEqual(project.teachingAssistants, helpers))
          recordProjectChange(
            project,
            "项目助教",
            staffDisplay(project.teachingAssistants),
            staffDisplay(helpers),
            reason,
          );

        project.name = name;
        if (mode === "in-progress") {
          project.endTime = endTime;
          project.days = days;
          if (isTraining) {
            project.amount = amount;
            project.settlementAmount = settlementAmount;
          }
        }
        if (isTraining) {
          project.lecturers = lecturers;
          project.assistantLecturers = assistants;
          project.teachingAssistants = helpers;
          pruneProjectStaffScores(project);
        }
        normalizeProjectLifecycle(project);

        currentPage = "project-detail";
        window.history.replaceState(null, "", "#project-detail");
        renderPage();
        toast("保存成功");
      }
      function handleProjectFormSubmit(editing, daysConfirmed = false) {
        const project = editing ? projectById(selectedProjectId) : null;
        if (editing) {
          normalizeProjectLifecycle(project);
          const mode = projectEditMode(project);
          if (!mode) {
            currentPage = "project-detail";
            window.history.replaceState(null, "", "#project-detail");
            renderPage();
            return;
          }
          if (mode === "in-progress" || mode === "delivered") {
            handleStageProjectEditSubmit(project, mode);
            return;
          }
        }
        clearProjectFormErrors();
        const name = $("#pfName").value.trim();
        const type = editing ? project.type : $("#pfType").value;
        const customerId = editing
          ? project.customerId
          : Number($("#pfCustomer").value);
        const startTime = $("#pfStart").value.replace("T", " ");
        const endTime = $("#pfEnd").value.replace("T", " ");
        const daysValue = $("#pfDays").value.trim();
        const resourceType = $("#pfResource").value;
        const cooperation = $("#pfCooperation").value;
        const packageId = $("#pfPackage").value;
        const directionIntro = $("#pfDirection").value;
        const companyId = $("#pfCompany").value;
        const amount = Number($("#pfAmount").value);
        const lecturers =
          type === "培训项目" ? selectedInstructorNames("pfLecturers") : [];
        const assistants =
          type === "培训项目" ? selectedInstructorNames("pfAssistants") : [];
        const helpers =
          type === "培训项目" ? selectedInstructorNames("pfHelpers") : [];

        const errors = {};
        if (!name) errors.pfName = "请填写项目名称";
        if (!editing && !type) errors.pfType = "请选择项目类型";
        if (!editing && !customerId) errors.pfCustomer = "请选择客户公司";
        if (!startTime) errors.pfStart = "请填写开始时间";
        if (!endTime) errors.pfEnd = "请填写结束时间";
        if (startTime && endTime && startTime > endTime)
          errors.pfEnd = "项目开始时间不得晚于项目结束时间";
        if (name && projects.some((item) => item.name === name && item.stage !== "已取消" && item.id !== project?.id))
          errors.pfName = "项目名称已存在，请修改后重试";

        let owner = "";
        let liveCustomer = null;
        if (!editing) {
          liveCustomer = customers.find((item) => item.id === customerId);
          if (customerId && !projectCreatableCustomers().some((item) => item.id === customerId)) {
            return;
          }
          owner = liveCustomer ? resolveProjectOwner(liveCustomer) : "";
          if (liveCustomer && !owner)
            errors.pfCustomer = "该客户未匹配到唯一有效项目负责人，无法创建项目";
        }

        const effPackageId = resourceType === "采购包课程" ? packageId : "";
        const effDirectionIntro =
          resourceType === "采购包课程" ? directionIntro : "";
        const effCompanyId = ["师资合作", "走账合作"].includes(cooperation)
          ? companyId
          : "";

        if (!resourceType) errors.pfResource = "请选择资源类型";
        else if (type && !projectResourceTypes(type).includes(resourceType))
          errors.pfResource = "当前项目类型、资源类型与合作形式不匹配，请重新选择";
        if (!cooperation) errors.pfCooperation = "请选择合作形式";
        else if (resourceType && !(PROJECT_RESOURCE_COOPERATION[resourceType] || []).includes(cooperation))
          errors.pfCooperation = "当前项目类型、资源类型与合作形式不匹配，请重新选择";

        const resourceChanged =
          editing &&
          (resourceType !== project.resourceType ||
            cooperation !== project.cooperation ||
            effPackageId !== (project.packageId || "") ||
            effDirectionIntro !== (project.directionIntro || "") ||
            effCompanyId !== (project.companyId || ""));
        const preserveExistingSnapshot = editing && !resourceChanged;

        if (resourceType === "采购包课程") {
          if (!effPackageId) errors.pfPackage = "请选择采购包";
          else {
            const pkg = projectPackages.find((item) => item.id === effPackageId);
            if (!pkg) errors.pfPackage = "所选采购包或平台公司当前不可用，请重新选择";
            else if (!effDirectionIntro) errors.pfDirection = "请选择课程方向";
            else if (!preserveExistingSnapshot) {
              if (!pkg.directions.some((item) => item.intro === effDirectionIntro))
                errors.pfDirection = "请选择课程方向";
              if (!isProjectPackageValid(pkg))
                errors.pfPackage = "所选采购包或平台公司当前不可用，请重新选择";
            }
          }
        }
        if (["师资合作", "走账合作"].includes(cooperation)) {
          if (!effCompanyId) errors.pfCompany = "请选择平台公司";
          else {
            const company = platformCompanies.find((item) => item.id === effCompanyId);
            if (!company) errors.pfCompany = "所选采购包或平台公司当前不可用，请重新选择";
            else if (!preserveExistingSnapshot && company.status !== "正常")
              errors.pfCompany = "所选采购包或平台公司当前不可用，请重新选择";
          }
        }
        if (daysValue === "") {
          errors.pfDays = "请填写项目确认天数";
        } else {
          const daysNum = Number(daysValue);
          if (!Number.isFinite(daysNum) || daysNum <= 0)
            errors.pfDays = "请填写项目确认天数";
          else if (daysNum < 0.5 || daysNum % 0.5 !== 0)
            errors.pfDays =
              "项目确认天数最小为0.5天，且必须为0.5天的整数倍";
        }
        if (type === "AI软件项目" && !amount)
          errors.pfAmount = "请填写项目金额";
        if (type === "培训项目" && !lecturers.length)
          errors.pfLecturers = "培训项目至少需要选择一名主讲师";

        const conflictPersonnel = {
          lecturers,
          assistantLecturers: assistants,
          teachingAssistants: helpers,
        };
        const scheduleChanged =
          !editing ||
          !staffSetsEqual(project.lecturers, lecturers) ||
          !staffSetsEqual(project.assistantLecturers, assistants) ||
          !staffSetsEqual(project.teachingAssistants, helpers) ||
          startTime !== project.startTime ||
          endTime !== project.endTime;
        const conflicts = scheduleChanged
          ? projectScheduleConflicts(
              conflictPersonnel,
              startTime,
              endTime,
              project?.id,
            )
          : [];

        if (Object.keys(errors).length || conflicts.length) {
          Object.entries(errors).forEach(([field, message]) =>
            showProjectFormError(field, message),
          );
          if (conflicts.length) {
            const conflictHtml = conflicts
              .map(
                (conflict) =>
                  `${conflict.name}：与 ${conflict.projectId}（${conflict.startTime} ~ ${conflict.endTime}）时间重叠`,
              )
              .join("<br>");
            showProjectFormError("pfConflicts", conflictHtml);
          }
          return;
        }

        const pkg = effPackageId
          ? projectPackages.find((item) => item.id === effPackageId)
          : null;
        const direction = pkg
          ? pkg.directions.find((item) => item.intro === effDirectionIntro)
          : null;
        const company = effCompanyId
          ? platformCompanies.find((item) => item.id === effCompanyId)
          : null;

        let unitPrice = null;
        let snapshot;
        if (preserveExistingSnapshot && project.snapshot) {
          snapshot = { ...project.snapshot };
          unitPrice = snapshot.unitPrice;
        } else if (type === "培训项目") {
          if (resourceType === "采购包课程" && direction)
            unitPrice = direction.taxedPrice;
          else if (resourceType === "平台师资合作" && company)
            unitPrice = company.cooperationPay;
          snapshot = {
            untaxedPrice: direction ? direction.untaxedPrice : null,
            taxedPrice: direction ? direction.taxedPrice : null,
            taxRate: direction ? projectDirectionTaxRate(direction) : null,
            cooperationPay: company && resourceType === "平台师资合作" ? company.cooperationPay : null,
            managementFeeRate: company && cooperation === "走账合作" ? company.managementFeeRate : null,
            unitPrice,
          };
        } else {
          snapshot = {
            untaxedPrice: null,
            taxedPrice: null,
            taxRate: null,
            cooperationPay: null,
            managementFeeRate: company && cooperation === "走账合作" ? company.managementFeeRate : null,
            unitPrice: null,
          };
        }

        if (type === "培训项目" && unitPrice == null) {
          showProjectFormError(
            "pfResource",
            "当前项目类型、资源类型与合作形式不匹配，请重新选择",
          );
          return;
        }
        const days = Number(daysValue);
        const calculatedDays = naturalDayCount(startTime, endTime);
        const projectAmount =
          type === "培训项目" ? round2(unitPrice * days) : round2(amount);
        const feeRate =
          cooperation === "走账合作"
            ? preserveExistingSnapshot && project.snapshot?.managementFeeRate != null
              ? project.snapshot.managementFeeRate
              : company?.managementFeeRate
            : null;
        const settlementAmount =
          cooperation === "走账合作" && feeRate != null
            ? round2(projectAmount * (1 - feeRate / 100))
            : projectAmount;

        const payload = {
          name,
          type,
          customerId,
          startTime,
          endTime,
          days,
          resourceType,
          cooperation,
          packageId: effPackageId,
          directionIntro: effDirectionIntro,
          companyId: effCompanyId,
          companyName: effCompanyId ? company?.name || "" : "",
          unitPrice,
          amount: projectAmount,
          settlementAmount,
          snapshot,
          lecturers,
          assistantLecturers: assistants,
          teachingAssistants: helpers,
        };
        if (!daysConfirmed && days !== calculatedDays) {
          openProjectDaysConfirm(calculatedDays, days, () =>
            handleProjectFormSubmit(editing, true),
          );
          return;
        }
        if (editing) {
          writePreStartEditHistory(project, payload);
          Object.assign(project, payload);
          pruneProjectStaffScores(project);
          normalizeProjectLifecycle(project);
          currentPage = "project-detail";
          window.history.replaceState(null, "", "#project-detail");
          renderPage();
          toast("保存成功");
        } else {
          const newProject = {
            ...payload,
            id: nextProjectId(),
            opportunityId: "",
            createdBy: currentUser.name,
            createdAt: projectNow(),
            ownerSnapshot: owner,
            customerSnapshot: liveCustomer
              ? {
                  customerCode: customerStableCode(liveCustomer),
                  name: liveCustomer.name,
                  level: liveCustomer.level,
                  province: liveCustomer.province,
                  city: liveCustomer.city,
                  district: liveCustomer.district,
                }
              : null,
            stage: "已立项",
            todos: [],
          };
          projects.push(newProject);
          normalizeProjectLifecycle(newProject);
          selectedProjectId = newProject.id;
          currentPage = "project-detail";
          window.history.replaceState(null, "", "#project-detail");
          renderPage();
        }
      }
      function projectMaterialOperationContext(project) {
        return {
          account: currentUser,
          accountKey: currentAccountKey(),
          operatorName: currentUser?.name || "—",
          project,
          projectId: selectedProjectId || "",
        };
      }
      function projectMaterialOperationContextIsCurrent(context) {
        return Boolean(
          context?.project &&
          currentUser === context.account &&
          currentAccountKey() === context.accountKey &&
          selectedProjectId === context.projectId &&
          projectById(context.projectId) === context.project
        );
      }
      function projectMaterialCountError(
        project,
        categoryName,
        kind,
        excludeMaterialId,
      ) {
        const kindRule = PROJECT_FILE_KIND_RULES[kind];
        if (!kindRule) return "文件类型不支持";
        const kindCount = projectMaterials(project).filter(
          (material) =>
            material.category === categoryName &&
            material.kind === kind &&
            material.id !== excludeMaterialId,
        ).length;
        return kindCount >= kindRule.maxCount
          ? `${kindRule.label}每分类最多 ${kindRule.maxCount} 个`
          : "";
      }
      function canContinueMaterialAdd(context, categoryName) {
        if (!projectMaterialOperationContextIsCurrent(context)) return false;
        normalizeProjectLifecycle(context.project);
        if (!canUploadProjectMaterials()) return false;
        const category = projectMaterialCategories(context.project).find(
          (item) => item.name === categoryName,
        );
        if (!category) return false;
        const mode = projectMaterialMaintenanceMode(context.project);
        return mode === "full" || mode === "completed-add";
      }
      async function validateProjectMaterialFile(file, categoryName, project, excludeMaterialId) {
        const category = projectMaterialCategories(project).find(
          (item) => item.name === categoryName,
        );
        if (!category) return { ok: false, reason: "资料分类无效" };
        const name = file?.name || "";
        if (name.length < 1 || name.length > 200)
          return { ok: false, reason: "文件名长度需为 1-200 字" };
        if (!file?.size) return { ok: false, reason: "禁止零字节文件" };
        const ext = fileExtension(name);
        if (!ext || DANGEROUS_FILE_EXTENSIONS.includes(ext))
          return { ok: false, reason: "禁止可执行、脚本、压缩、加密或伪装扩展名" };
        const extRule = PROJECT_FILE_EXTENSION_RULES[ext];
        if (!extRule || !category.kinds.includes(extRule.kind))
          return {
            ok: false,
            reason: `文件类型不支持（仅支持 ${categoryAllowedExtensions(category).join("、")}）`,
          };
        const kindRule = PROJECT_FILE_KIND_RULES[extRule.kind];
        if (file.size > kindRule.maxBytes)
          return {
            ok: false,
            reason: `单文件超过 ${formatFileSize(kindRule.maxBytes)} 上限`,
          };
        const mime = String(file.type || "").toLowerCase();
        if (!mime) return { ok: false, reason: "文件缺少声明类型" };
        if (mime !== extRule.mime)
          return { ok: false, reason: "文件扩展名与声明类型不匹配" };
        const innerExt = fileExtension(name.slice(0, name.lastIndexOf(".")));
        if (innerExt && DANGEROUS_FILE_EXTENSIONS.includes(innerExt))
          return { ok: false, reason: "禁止双扩展名伪装" };
        const header = await readFileHeader(file);
        if (!fileHeaderMatches(ext, header))
          return { ok: false, reason: "文件头与声明类型不匹配" };
        const countError = projectMaterialCountError(
          project,
          categoryName,
          extRule.kind,
          excludeMaterialId,
        );
        if (countError) return { ok: false, reason: countError };
        return { ok: true, kind: extRule.kind };
      }
      async function handleMaterialAdd(categoryName, files) {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canUploadProjectMaterials()) return;
        const mode = projectMaterialMaintenanceMode(project);
        const category = projectMaterialCategories(project).find(
          (item) => item.name === categoryName,
        );
        if (!category) return;
        const canAdd = mode === "full" || mode === "completed-add";
        if (!canAdd) return;
        const context = projectMaterialOperationContext(project);
        const validations = [];
        for (const file of [...files]) {
          const check = await validateProjectMaterialFile(
            file,
            categoryName,
            project,
          );
          if (!projectMaterialOperationContextIsCurrent(context)) return;
          validations.push({ file, check });
        }
        if (!canContinueMaterialAdd(context, categoryName)) return;
        const results = [];
        for (const { file, check } of validations) {
          if (!check.ok) {
            results.push({ name: file.name, ok: false, reason: check.reason });
            continue;
          }
          const countError = projectMaterialCountError(
            project,
            categoryName,
            check.kind,
          );
          if (countError) {
            results.push({ name: file.name, ok: false, reason: countError });
            continue;
          }
          if (!Array.isArray(project.materials)) project.materials = [];
          const material = {
            id: nextMaterialId(),
            category: categoryName,
            name: file.name,
            size: file.size,
            kind: check.kind,
            addedBy: context.operatorName,
            addedAt: projectNow(),
          };
          project.materials.push(material);
          recordProjectChange(
            project,
            "项目资料",
            "—",
            materialHistoryDisplay(material),
          );
          results.push({ name: file.name, ok: true });
        }
        setProjectMaterialResults(results, context);
        normalizeProjectLifecycle(project);
        renderPage();
      }
      function handleMaterialDelete(fileId) {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canDeleteProjectMaterials()) return;
        if (projectMaterialMaintenanceMode(project) !== "full") return;
        const index = projectMaterials(project).findIndex(
          (material) => material.id === fileId,
        );
        if (index < 0) return;
        const material = project.materials[index];
        project.materials.splice(index, 1);
        recordProjectChange(
          project,
          "项目资料",
          materialHistoryDisplay(material),
          "已删除",
        );
        setProjectMaterialResults([]);
        normalizeProjectLifecycle(project);
        renderPage();
      }
      function openProjectMaterialDeleteModal(fileId) {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canDeleteProjectMaterials()) return;
        if (projectMaterialMaintenanceMode(project) !== "full") return;
        if (!projectMaterials(project).some((material) => material.id === fileId))
          return;
        openModal(
          '<div class="modal-head project-modal-head"><div class="modal-title">确认删除文件</div><button class="icon-btn close" data-close>×</button></div>' +
            '<div class="modal-body project-modal-body"><div class="role-note danger-note">删除后不可恢复，确认删除？</div></div>' +
            '<div class="modal-foot project-modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-danger" type="button" id="confirmProjectMaterialDelete">确认删除</button></div>',
        );
        $("#confirmProjectMaterialDelete").onclick = () => {
          closeOverlay();
          handleMaterialDelete(fileId);
        };
      }
      async function handleMaterialReplace(fileId, file) {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (
          !canViewProjectMaterials() ||
          !canUploadProjectMaterials() ||
          !canDeleteProjectMaterials()
        )
          return;
        if (projectMaterialMaintenanceMode(project) !== "full") return;
        const material = projectMaterials(project).find(
          (item) => item.id === fileId,
        );
        if (!material) return;
        const context = projectMaterialOperationContext(project);
        const check = await validateProjectMaterialFile(
          file,
          material.category,
          project,
          material.id,
        );
        if (!projectMaterialOperationContextIsCurrent(context)) return;
        normalizeProjectLifecycle(project);
        if (
          !canViewProjectMaterials() ||
          !canUploadProjectMaterials() ||
          !canDeleteProjectMaterials() ||
          projectMaterialMaintenanceMode(project) !== "full"
        )
          return;
        const currentMaterial = projectMaterials(project).find(
          (item) => item.id === fileId,
        );
        if (currentMaterial !== material) return;
        if (!check.ok) {
          setProjectMaterialResults([
            { name: file.name, ok: false, reason: check.reason },
          ], context);
          renderPage();
          return;
        }
        const countError = projectMaterialCountError(
          project,
          material.category,
          check.kind,
          material.id,
        );
        if (countError) {
          setProjectMaterialResults([
            { name: file.name, ok: false, reason: countError },
          ], context);
          renderPage();
          return;
        }
        const index = project.materials.indexOf(material);
        const replacement = {
          id: nextMaterialId(),
          category: material.category,
          name: file.name,
          size: file.size,
          kind: check.kind,
          addedBy: context.operatorName,
          addedAt: projectNow(),
        };
        project.materials.splice(index, 1, replacement);
        recordProjectChange(
          project,
          "项目资料",
          materialHistoryDisplay(material),
          materialHistoryDisplay(replacement),
        );
        setProjectMaterialResults([{ name: file.name, ok: true }], context);
        normalizeProjectLifecycle(project);
        renderPage();
      }
      function handleSatisfactionSave() {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canEditProjectSatisfaction(project)) return;
        const isTraining = project.type === "培训项目";
        const projectScoreRaw = $("#satProjectScore")?.value.trim() ?? "";
        const projectScore = Number(projectScoreRaw);
        const errors = [];
        if (projectScoreRaw === "" || !Number.isFinite(projectScore))
          errors.push("项目满意度：请填写 1-100 分");
        else if (projectScore < 1 || projectScore > 100)
          errors.push("项目满意度：范围为 1-100 分");
        const staffScores = {};
        if (isTraining) {
          projectCurrentStaffNames(project).forEach((name, index) => {
            const raw = $(`#sat-staff-${index}`)?.value.trim() ?? "";
            const score = Number(raw);
            if (raw === "" || !Number.isFinite(score))
              errors.push(`${name}满意度：请填写 1-100 分`);
            else if (score < 1 || score > 100)
              errors.push(`${name}满意度：范围为 1-100 分`);
            else staffScores[name] = score;
          });
        }
        if (errors.length) {
          const el = $("#satErrors");
          if (el)
            el.innerHTML = errors
              .map((error) => `<div>${escapeHtml(error)}</div>`)
              .join("");
          return;
        }
        const before = project.satisfaction || {
          projectScore: null,
          staffScores: {},
        };
        if (before.projectScore !== projectScore)
          recordProjectChange(
            project,
            "项目满意度",
            before.projectScore ?? "—",
            String(projectScore),
          );
        if (isTraining) {
          projectCurrentStaffNames(project).forEach((name) => {
            const prev = before.staffScores?.[name];
            const next = staffScores[name];
            if (prev !== next)
              recordProjectChange(
                project,
                "人员满意度",
                `${name}：${prev ?? "—"}`,
                `${name}：${next}`,
              );
          });
        }
        project.satisfaction = { projectScore, staffScores };
        pruneProjectStaffScores(project);
        normalizeProjectLifecycle(project);
        renderPage();
      }
      function handleProjectConfirmDelivery() {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canConfirmProjectDelivery(project) || project.deliveryConfirmed)
          return;
        project.deliveryConfirmed = true;
        project.deliveryConfirmedBy = currentUser.name;
        project.deliveryConfirmedAt = projectNow();
        recordProjectChange(project, "AI 确认交付", "未确认", "已确认");
        normalizeProjectLifecycle(project);
        renderPage();
      }
      function submitProjectCancel() {
        const project = projectById(selectedProjectId);
        if (!project) {
          closeOverlay();
          return;
        }
        normalizeProjectLifecycle(project);
        if (!canCancelProject(project)) {
          closeOverlay();
          renderPage();
          return;
        }
        const reason = ($("#projectCancelReason")?.value || "").trim();
        if (reason.length < 5 || reason.length > 500) {
          const el = $("#err-cancelReason");
          if (el) el.textContent = "取消原因需填写 5-500 字";
          return;
        }
        const oldStage = project.stage;
        project.cancelReason = reason;
        project.cancelledOwner = projectCurrentOwner(project);
        project.cancelledBy = currentUser.name;
        project.cancelledAt = projectNow();
        project.stage = "已取消";
        project.todos = [];
        recordProjectChange(project, "主阶段", oldStage, "已取消", reason);
        closeOverlay();
        renderPage();
      }
      function openProjectCancelModal() {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canCancelProject(project)) return;
        openModal(
          `<div class="modal-head project-modal-head"><div class="modal-title">确认取消项目</div><button class="icon-btn close" data-close>×</button></div>` +
            '<form id="projectCancelForm" class="project-config-form"><div class="modal-body project-modal-body">' +
            '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>取消原因</label><textarea class="input" id="projectCancelReason" rows="3" maxlength="500"></textarea><div class="field-error" id="err-cancelReason"></div></div>' +
            '</div><div class="modal-foot project-modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认</button></div></form>',
        );
        $("#projectCancelForm").onsubmit = (event) => {
          event.preventDefault();
          submitProjectCancel();
        };
      }
      function submitProjectTermination() {
        const project = projectById(selectedProjectId);
        if (!project) {
          closeOverlay();
          return;
        }
        normalizeProjectLifecycle(project);
        if (!canTerminateProject(project)) {
          closeOverlay();
          renderPage();
          return;
        }
        const settlementChoice = document.querySelector(
          'input[name="projectTerminationSettlement"]:checked',
        )?.value;
        const amountRaw = ($("#projectTerminationAmount")?.value || "").trim();
        const reason = ($("#projectTerminationReason")?.value || "").trim();
        const settlementError = $("#err-terminationSettlement");
        const amountError = $("#err-terminationAmount");
        const reasonError = $("#err-terminationReason");
        if (settlementError) settlementError.textContent = "";
        if (amountError) amountError.textContent = "";
        if (reasonError) reasonError.textContent = "";
        let invalid = false;
        if (!settlementChoice) {
          if (settlementError)
            settlementError.textContent = "请选择是否涉及金额结算";
          invalid = true;
        }
        const involvesSettlement = settlementChoice === "yes";
        const amountFormatValid = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(
          amountRaw,
        );
        const amount = Number(amountRaw);
        if (
          involvesSettlement &&
          (!amountRaw || !amountFormatValid || !Number.isFinite(amount) || amount <= 0)
        ) {
          if (amountError)
            amountError.textContent = "请填写大于 0 且最多两位小数的应结算金额";
          invalid = true;
        }
        if (reason.length < 5 || reason.length > 500) {
          if (reasonError) reasonError.textContent = "中止原因需填写 5-500 字";
          invalid = true;
        }
        if (invalid) return;

        const oldStage = project.stage;
        const terminatedOwner = projectCurrentOwner(project);
        project.terminationInvolvesSettlement = involvesSettlement;
        if (involvesSettlement) project.terminationSettlementAmount = amount;
        else delete project.terminationSettlementAmount;
        project.terminationReason = reason;
        project.terminatedOwner = terminatedOwner;
        project.terminatedBy = currentUser.name;
        project.terminatedAt = projectNow();
        project.stage = "已中止";
        project.todos = involvesSettlement ? ["待回款"] : [];
        recordProjectChange(
          project,
          "是否涉及金额结算",
          "—",
          involvesSettlement ? "是" : "否",
        );
        if (involvesSettlement)
          recordProjectChange(
            project,
            "应结算金额（含税，元）",
            "—",
            formatProjectMoney(amount),
          );
        recordProjectChange(project, "主阶段", oldStage, "已中止", reason);
        closeOverlay();
        renderPage();
      }
      function openProjectTerminationModal() {
        const project = projectById(selectedProjectId);
        if (!project) return;
        normalizeProjectLifecycle(project);
        if (!canTerminateProject(project)) return;
        openModal(
          '<div class="modal-head project-modal-head"><div class="modal-title">中止项目</div><button class="icon-btn close" data-close>×</button></div>' +
            '<form id="projectTerminationForm" class="project-config-form" novalidate><div class="modal-body project-modal-body">' +
            '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>是否涉及金额结算</label><div class="choice-grid"><label class="check-row"><input type="radio" name="projectTerminationSettlement" value="yes"><span>是</span></label><label class="check-row"><input type="radio" name="projectTerminationSettlement" value="no"><span>否</span></label></div><div class="field-error" id="err-terminationSettlement"></div></div>' +
            '<div class="form-group" id="projectTerminationAmountGroup" style="display:none"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>应结算金额（含税，元）</label><input class="input" id="projectTerminationAmount" type="number" min="0.01" step="0.01" value=""><div class="field-error" id="err-terminationAmount"></div></div>' +
            '<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>中止原因</label><textarea class="input" id="projectTerminationReason" rows="3" maxlength="500"></textarea><div class="field-error" id="err-terminationReason"></div></div>' +
            '</div><div class="modal-foot project-modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认中止</button></div></form>',
        );
        const updateSettlementFields = () => {
          const choice = document.querySelector(
            'input[name="projectTerminationSettlement"]:checked',
          )?.value;
          const group = $("#projectTerminationAmountGroup");
          const amountInput = $("#projectTerminationAmount");
          if (group) group.style.display = choice === "yes" ? "" : "none";
          if (choice !== "yes" && amountInput) amountInput.value = "";
          const settlementError = $("#err-terminationSettlement");
          const amountError = $("#err-terminationAmount");
          if (settlementError) settlementError.textContent = "";
          if (amountError) amountError.textContent = "";
        };
        document
          .querySelectorAll('input[name="projectTerminationSettlement"]')
          .forEach((input) => (input.onchange = updateSettlementFields));
        $("#projectTerminationForm").onsubmit = (event) => {
          event.preventDefault();
          submitProjectTermination();
        };
      }
      function bindProjectFormEvents() {
        document.querySelectorAll("[data-project-create]").forEach((button) => {
          button.onclick = () => {
            currentPage = "project-create";
            window.history.replaceState(null, "", "#project-create");
            renderPage();
          };
        });
        document.querySelectorAll("[data-project-edit]").forEach((button) => {
          button.onclick = () => {
            currentPage = "project-edit";
            window.history.replaceState(null, "", "#project-edit");
            renderPage();
          };
        });
        document.querySelectorAll("[data-project-cancel]").forEach((button) => {
          button.onclick = () => {
            if (currentPage === "project-edit") {
              currentPage = "project-detail";
              window.history.replaceState(null, "", "#project-detail");
            } else {
              currentPage = "projects";
              window.history.replaceState(null, "", "#projects");
            }
            renderPage();
          };
        });
        const form = $("#projectForm");
        if (!form) return;
        bindInstructorSelects(form);
        const editing = currentPage === "project-edit";
        const editingProject = editing ? projectById(selectedProjectId) : null;
        if (editingProject) normalizeProjectLifecycle(editingProject);
        const editMode = editing ? projectEditMode(editingProject) : null;
        const stageEdit =
          editMode === "in-progress" || editMode === "delivered";
        if (stageEdit) {
          if (editMode === "in-progress") {
            const stageEnd = $("#pfStageEnd");
            const confirmedDays = $("#pfDays");
            if (stageEnd)
              stageEnd.onchange = () => {
                refreshProjectFormDays(editingProject.startTime);
                refreshStageProjectAmounts(editingProject);
              };
            if (confirmedDays)
              confirmedDays.oninput = () => {
                confirmedDays.dataset.userEdited = "true";
                refreshStageProjectAmounts(editingProject);
              };
            refreshStageProjectAmounts(editingProject);
          }
          form.onsubmit = (event) => {
            event.preventDefault();
            handleProjectFormSubmit(editing);
          };
          return;
        }
        const typeSelect = $("#pfType");
        if (typeSelect && !editing) {
          typeSelect.onchange = () => {
            const type = typeSelect.value;
            const resourceSelect = $("#pfResource");
            resourceSelect.innerHTML =
              '<option value="">请选择资源类型</option>' +
              projectResourceTypes(type)
                .map((item) => `<option value="${item}">${item}</option>`)
                .join("");
            resourceSelect.value = "";
            $("#pfCooperation").innerHTML = '<option value="">请选择合作形式</option>';
            $("#pfCooperation").value = "";
            const amountInput = $("#pfAmount");
            if (amountInput) {
              amountInput.disabled = type === "培训项目";
              amountInput.value = "";
            }
            $("#pfUnitPrice").value = "—";
            $("#pfSettlement").value = "—";
            refreshProjectFormDynamics();
          };
        }
        const resourceSelect = $("#pfResource");
        if (resourceSelect) {
          resourceSelect.onchange = () => {
            const resourceType = resourceSelect.value;
            $("#pfCooperation").innerHTML =
              '<option value="">请选择合作形式</option>' +
              (PROJECT_RESOURCE_COOPERATION[resourceType] || [])
                .map((item) => `<option value="${item}">${item}</option>`)
                .join("");
            $("#pfCooperation").value = "";
            refreshProjectFormDynamics();
          };
        }
        const packageSelect = $("#pfPackage");
        if (packageSelect) {
          packageSelect.onchange = () => {
            const pkg = projectPackages.find(
              (item) => item.id === packageSelect.value,
            );
            $("#pfDirection").innerHTML =
              '<option value="">请选择课程方向</option>' +
              (pkg?.directions || [])
                .map((item) => `<option value="${item.intro}">${item.intro}</option>`)
                .join("");
            $("#pfDirection").value = "";
            refreshProjectFormAmounts();
          };
        }
        const cooperationSelect = $("#pfCooperation");
        if (cooperationSelect)
          cooperationSelect.onchange = refreshProjectFormDynamics;
        ["#pfDirection", "#pfCompany"].forEach((selector) => {
          const el = $(selector);
          if (el) el.onchange = refreshProjectFormAmounts;
        });
        const confirmedDays = $("#pfDays");
        if (confirmedDays)
          confirmedDays.onchange = () => {
            confirmedDays.dataset.userEdited = "true";
            refreshProjectFormAmounts();
          };
        const startEl = $("#pfStart");
        const endEl = $("#pfEnd");
        if (startEl)
          startEl.onchange = () => {
            refreshProjectFormDays();
            refreshProjectFormAmounts();
          };
        if (endEl)
          endEl.onchange = () => {
            refreshProjectFormDays();
            refreshProjectFormAmounts();
          };
        const customerSelect = $("#pfCustomer");
        if (customerSelect && !editing) {
          customerSelect.onchange = () => {
            const customer = customers.find(
              (item) => item.id === Number(customerSelect.value),
            );
            $("#pfCustomerCode").textContent = customerStableCode(customer);
            $("#pfArea").textContent = customer ? adminArea(customer) : "—";
            $("#pfOwner").textContent = customer
              ? resolveProjectOwner(customer) || "—"
              : "—";
          };
        }
        refreshProjectFormDynamics();
        form.onsubmit = (event) => {
          event.preventDefault();
          handleProjectFormSubmit(editing);
        };
      }
