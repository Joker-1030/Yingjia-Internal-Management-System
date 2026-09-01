      function importStatusTone(status) {
        if (status === "全部成功") return "green";
        if (status === "失败") return "red";
        if (status === "部分成功") return "orange";
        if (status === "已关闭") return "";
        if (["预校验中", "导入中"].includes(status)) return "blue";
        return "yellow";
      }
      function importActionLabel(status) {
        if (status === "待确认") return "查看预校验";
        if (["已上传", "预校验中", "导入中"].includes(status))
          return "查看进度";
        return "查看结果";
      }
      function importEscapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function renderImports() {
        if (!hasOperationPermission("imports.view"))
          return forbiddenPage(
            "数据导入",
            "仅系统管理员、区域总监和 PM 可按当前数据范围使用导入能力。",
          );
        const canDownload = hasOperationPermission("imports.download");
        const canUpload = hasOperationPermission("imports.upload");
        const templateAction = {
          [FULL_IMPORT_TEMPLATE]: "download-full-import-template",
          [CONTACT_IMPORT_TEMPLATE]: "download-contact-import-template",
          [PROJECT_IMPORT_TEMPLATE]: "download-project-import-template",
        };
        const availableTemplates = importTemplateTypesForAccount(currentUser);
        const downloadActions = canDownload
          ? availableTemplates
              .map(
                (type) =>
                  `<button class="btn" data-action="${templateAction[type]}">⇩ ${importEscapeHtml(type)}</button>`,
              )
              .join("")
          : "";
        const importPageActions = `${downloadActions}${canUpload && availableTemplates.length ? '<button class="btn btn-primary" data-action="upload-import">⇧ 上传文件</button>' : ""}`;
        const visible = visibleImportBatches(currentUser);
        const creators = [...new Set(visible.map((batch) => batch.user))]
          .map((name) => {
            const batch = visible.find((item) => item.user === name);
            const employee = employees.find((item) => item.name === name);
            return {
              name,
              code: batch?.userCode || employee?.code || "—",
              disabled: employee?.status === "停用",
            };
          })
          .sort((left, right) => left.code.localeCompare(right.code));
        const statusFilter = `<details class="multi-select" id="importStatusSelect" style="width:176px"><summary class="multi-select-trigger" style="list-style:none"><span id="importStatusText">全部批次状态</span><span aria-hidden="true">⌄</span></summary><div class="multi-select-menu" style="display:block;top:var(--control-height-large)"><div>${IMPORT_BATCH_STATUSES.map((status) => `<label class="multi-select-option"><input type="checkbox" data-import-status value="${status}"><span>${status}</span></label>`).join("")}</div></div></details>`;
        const batchRows = visible
          .map((batch) => {
            const reportReady = [
              "部分成功",
              "全部成功",
              "失败",
              "已关闭",
            ].includes(batch.status);
            const validationReady = !["已上传", "预校验中"].includes(
              batch.status,
            );
            const batchId = importEscapeHtml(batch.id);
            const file = importEscapeHtml(batch.file);
            const templateType = importEscapeHtml(batch.templateType);
            const status = importEscapeHtml(batch.status);
            const creator = importEscapeHtml(batch.user);
            return `<tr data-page-row data-import-row data-batch-id="${batchId}" data-file="${file}" data-template="${templateType}" data-status="${status}" data-creator="${creator}" data-date="${importEscapeHtml(batch.createdAt.slice(0, 10))}" data-errors="${batch.errors}" data-duplicates="${batch.duplicates}" data-warnings="${batch.warnings}"><td><strong>${batchId}</strong></td><td>${file}</td><td>${templateType}</td><td>${importEscapeHtml(batch.templateVersion)}</td><td>${creator}</td><td>${importEscapeHtml(batch.userCode)}</td><td>${importEscapeHtml(batch.scope)}</td><td><span class="tag ${validationReady ? "green" : ""}">${validationReady ? batch.valid : "—"}</span></td><td><span class="tag ${batch.duplicates ? "yellow" : "green"}">${validationReady ? batch.duplicates : "—"}</span></td><td><span class="tag ${batch.errors ? "red" : "green"}">${validationReady ? batch.errors : "—"}</span></td><td><span class="tag ${batch.warnings ? "blue" : "green"}">${validationReady ? batch.warnings : "—"}</span></td><td><span class="tag ${importStatusTone(batch.status)}">${status}</span></td><td>${importEscapeHtml(batch.createdAt)}</td><td>${importEscapeHtml(batch.finishedAt || "—")}</td><td>${reportReady && canDownload ? `<button class="link" data-action="download-report" data-id="${batchId}">下载 .xlsx</button>` : "—"}</td><td><button class="link" data-action="import-detail" data-id="${batchId}">${importActionLabel(batch.status)}</button></td></tr>`;
          })
          .join("");
        const scopeNote = currentUser.fullAccess
          ? "系统管理员可查看公司全部批次，并按公司范围使用当前开放模板。"
          : currentUser.role === "director"
            ? "区域总监可查看本区域项目导入批次；关键人批次仅限本人创建，且只可导入本人负责的省级客户关键人。"
            : "PM 仅可查看本人创建的批次，并按本人负责的市/区县客户范围导入。";
        return (
          pageHead(
            "数据导入",
            "下载当前权限模板，上传后依次完成预校验、确认写入和结果报告。",
            importPageActions,
          ) +
          `<section class="panel"><div class="toolbar filter-toolbar" style="flex-wrap:wrap">${filterField("批次编号", '<input class="input" id="importBatchCode" maxlength="100" placeholder="批次编号前缀">')}${filterField("文件名", '<input class="input" id="importFileName" maxlength="100" placeholder="文件名">')}${filterField("模板类型", `<select class="input" id="importTemplateType"><option value="">全部模板类型</option><option>${FULL_IMPORT_TEMPLATE}</option><option>${CONTACT_IMPORT_TEMPLATE}</option><option>${PROJECT_IMPORT_TEMPLATE}</option></select>`)}${filterField("批次状态", statusFilter)}${currentUser.fullAccess ? filterField("创建人", `<select class="input" id="importCreator"><option value="">全部创建人</option>${creators.map((creator) => `<option value="${importEscapeHtml(creator.name)}">${importEscapeHtml(creator.name)} · ${importEscapeHtml(creator.code)}${creator.disabled ? "（已停用）" : ""}</option>`).join("")}</select>`) : ""}${filterField("创建日期起", '<input class="input" id="importStartDate" type="date">')}${filterField("创建日期止", '<input class="input" id="importEndDate" type="date">')}${filterField("异常情况", '<select class="input" id="importException"><option value="">全部异常情况</option><option value="errors">含阻断错误</option><option value="duplicates">含疑似重复</option><option value="warnings">含警告</option><option value="none">无异常</option></select>')}${filterActions('<button class="btn btn-primary" id="queryImportFilters" type="button">筛选</button><button class="btn" id="resetImportFilters" type="button">重置</button>')}</div><div class="table-wrap"><table data-paged-table="m10-imports" style="min-width:2080px"><thead><tr><th>批次编号</th><th>文件名</th><th>模板类型</th><th>模板版本</th><th>创建人</th><th>创建人工号</th><th>导入范围</th><th>可导入数</th><th>疑似重复数</th><th>阻断错误数</th><th>警告数</th><th>状态</th><th>创建时间</th><th>完成时间</th><th>结果报告</th><th>操作</th></tr></thead><tbody id="importBody">${batchRows || '<tr data-empty-row><td colspan="16"><div class="empty">暂无导入批次</div></td></tr>'}<tr data-filter-empty style="display:none"><td colspan="16"><div class="empty">未找到符合条件的批次，请调整条件或重置筛选</div></td></tr></tbody></table></div>${tablePagination("m10-imports")}</section><div class="role-note" style="margin-top:var(--space-4)">${scopeNote} 项目模板只在初始化期提供新下载和上传；历史批次及报告继续按数据范围保留。</div>`
        );
      }

      function bindFilter(selector, rows) {
        const el = $(selector);
        if (el) el.oninput = el.onchange = () => filterRows(rows, el.value);
      }

      function applyEmployeeFilters() {
        const body = $("#employeeBody");
        if (!body) return;
        const departmentNames = selectedOrganizationDepartmentId
          ? organizationDescendantNames(selectedOrganizationDepartmentId)
          : [];
        const name = $("#employeeName")?.value.trim() || "";
        const code = $("#employeeCode")?.value.trim() || "";
        const phoneSuffix = $("#employeePhoneSuffix")?.value.trim() || "";
        const role = $("#employeeRole")?.value || "";
        const status = $("#employeeStatus")?.value || "";
        const accountStatus = $("#employeeAccountStatus")?.value || "";
        body.querySelectorAll("tr[data-page-row]").forEach((row) => {
          const visible =
            (!departmentNames.length ||
              departmentNames.includes(row.dataset.deptName)) &&
            (!name || row.children[0]?.textContent.includes(name)) &&
            (!code || row.children[1]?.textContent.includes(code)) &&
            (!phoneSuffix || row.dataset.search.endsWith(phoneSuffix)) &&
            (!role || row.dataset.role.split("|").includes(role)) &&
            (!status || row.dataset.status === status) &&
            (!accountStatus || row.dataset.accountStatus === accountStatus);
          row.classList.toggle("hidden", !visible);
        });
        refreshUnifiedTablePagination("m06-employees", true);
      }
