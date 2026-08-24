      function importStatusTone(status) {
        if (status === "全部成功") return "green";
        if (status === "失败") return "red";
        if (["部分成功", "已关闭"].includes(status)) return "orange";
        if (["预校验中", "导入中"].includes(status)) return "blue";
        return "yellow";
      }
      function importActionLabel(status) {
        if (status === "待确认") return "查看预校验";
        if (["已上传", "预校验中", "导入中"].includes(status))
          return "查看进度";
        return "查看结果";
      }
      function renderImports() {
        if (!hasOperationPermission("imports.view"))
          return forbiddenPage(
            "数据导入",
            "仅 PM 可使用关键人模板，系统管理员可使用全量及关键人模板。",
          );
        const canDownload = hasOperationPermission("imports.download");
        const canUpload = hasOperationPermission("imports.upload");
        const importPageActions = `${canDownload && currentUser.fullAccess ? `<button class="btn" data-action="download-full-import-template">⇩ ${FULL_IMPORT_TEMPLATE}</button>` : ""}${canDownload ? `<button class="btn" data-action="download-contact-import-template">⇩ ${CONTACT_IMPORT_TEMPLATE}</button>` : ""}${canUpload ? '<button class="btn btn-primary" data-action="upload-import">⇧ 上传文件</button>' : ""}`;
        const visible = (currentUser.fullAccess
          ? importBatches
          : importBatches.filter((batch) => batch.user === currentUser.name)
        )
          .slice()
          .sort(
            (left, right) =>
              right.createdAt.localeCompare(left.createdAt) ||
              right.id.localeCompare(left.id),
          );
        const creators = [...new Set(importBatches.map((batch) => batch.user))]
          .map((name) => {
            const batch = importBatches.find((item) => item.user === name);
            const employee = employees.find((item) => item.name === name);
            return {
              name,
              code: batch?.userCode || employee?.code || "—",
              disabled: employee?.status === "停用",
            };
          })
          .sort((left, right) => left.code.localeCompare(right.code));
        const statusFilter = `<details class="multi-select" id="importStatusSelect" style="width:176px"><summary class="multi-select-trigger" style="list-style:none"><span id="importStatusText">全部批次状态</span><span aria-hidden="true">⌄</span></summary><div class="multi-select-menu" style="display:block;top:40px"><div>${IMPORT_BATCH_STATUSES.map((status) => `<label class="multi-select-option"><input type="checkbox" data-import-status value="${status}"><span>${status}</span></label>`).join("")}</div></div></details>`;
        return (
          pageHead(
            "数据导入",
            "下载当前权限模板，上传后依次完成预校验、确认写入和结果报告。",
            importPageActions,
          ) +
          `<section class="panel"><div class="toolbar" style="flex-wrap:wrap"><input class="input" id="importSearch" maxlength="100" placeholder="批次编号前缀 / 文件名"><select class="input" id="importTemplateType"><option value="">全部模板类型</option><option>${FULL_IMPORT_TEMPLATE}</option><option>${CONTACT_IMPORT_TEMPLATE}</option></select>${statusFilter}${currentUser.fullAccess ? `<select class="input" id="importCreator"><option value="">全部创建人</option>${creators.map((creator) => `<option value="${creator.name}">${creator.name} · ${creator.code}${creator.disabled ? "（已停用）" : ""}</option>`).join("")}</select>` : ""}<input class="input" id="importStartDate" type="date" title="创建日期起"><input class="input" id="importEndDate" type="date" title="创建日期止"><select class="input" id="importException"><option value="">全部异常情况</option><option value="errors">含阻断错误</option><option value="duplicates">含疑似重复</option><option value="warnings">含警告</option><option value="none">无异常</option></select><button class="btn btn-primary" id="queryImportFilters" type="button">查询</button><button class="btn" id="resetImportFilters" type="button">重置</button><span class="spacer"></span><span class="panel-sub" id="importFilterCount">共 ${visible.length} 个批次</span></div><div class="table-wrap"><table style="min-width:1740px"><thead><tr><th>批次编号 / 文件名</th><th>模板类型 / 版本</th><th>创建人</th><th>导入范围</th><th>可导入数</th><th>疑似重复数</th><th>阻断错误数</th><th>警告数</th><th>状态</th><th>创建时间</th><th>完成时间</th><th>结果报告</th><th>操作</th></tr></thead><tbody id="importBody">${visible.map((batch) => { const reportReady = ["部分成功", "全部成功", "失败", "已关闭"].includes(batch.status); const validationReady = !["已上传", "预校验中"].includes(batch.status); return `<tr data-import-row data-batch-id="${batch.id}" data-file="${batch.file}" data-template="${batch.templateType}" data-status="${batch.status}" data-creator="${batch.user}" data-date="${batch.createdAt.slice(0, 10)}" data-errors="${batch.errors}" data-duplicates="${batch.duplicates}" data-warnings="${batch.warnings}"><td><strong>${batch.id}</strong><div class="list-sub">${batch.file}</div></td><td>${batch.templateType}<div class="list-sub">${batch.templateVersion}</div></td><td>${batch.user}<div class="list-sub">${batch.userCode}</div></td><td>${batch.scope}</td><td><span class="tag ${validationReady ? "green" : ""}">${validationReady ? batch.valid : "—"}</span></td><td><span class="tag ${batch.duplicates ? "yellow" : "green"}">${validationReady ? batch.duplicates : "—"}</span></td><td><span class="tag ${batch.errors ? "red" : "green"}">${validationReady ? batch.errors : "—"}</span></td><td><span class="tag ${batch.warnings ? "blue" : "green"}">${validationReady ? batch.warnings : "—"}</span></td><td><span class="tag ${importStatusTone(batch.status)}">${batch.status}</span></td><td>${batch.createdAt}</td><td>${batch.finishedAt || "—"}</td><td>${reportReady && canDownload ? `<button class="link" data-action="download-report" data-id="${batch.id}">下载 .xlsx</button>` : "—"}</td><td><button class="link" data-action="import-detail" data-id="${batch.id}">${importActionLabel(batch.status)}</button></td></tr>`; }).join("") || '<tr data-empty-row><td colspan="13"><div class="empty">暂无导入批次</div></td></tr>'}<tr id="importFilteredEmpty" style="display:none"><td colspan="13"><div class="empty">未找到符合条件的批次，请调整条件或重置筛选</div></td></tr></tbody></table></div></section><div class="role-note" style="margin-top:14px">PM 仅可查看本人创建的关键人导入批次；系统管理员可查看公司全部批次。客户主数据全量模板含集团公司、地市负责人、客户单位、客户部门、关键人 5 个业务工作表。</div>`
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
        const search = $("#employeeSearch")?.value.trim() || "";
        const role = $("#employeeRole")?.value || "";
        const status = $("#employeeStatus")?.value || "";
        const accountStatus = $("#employeeAccountStatus")?.value || "";
        let visibleCount = 0;
        body.querySelectorAll("tr").forEach((row) => {
          const visible =
            (!departmentNames.length ||
              departmentNames.includes(row.dataset.deptName)) &&
            (!search || row.dataset.search.includes(search)) &&
            (!role || row.dataset.role.split("|").includes(role)) &&
            (!status || row.dataset.status === status) &&
            (!accountStatus || row.dataset.accountStatus === accountStatus);
          row.style.display = visible ? "" : "none";
          if (visible) visibleCount += 1;
        });
        const count = $(".employee-count");
        if (count) count.textContent = `当前 ${visibleCount} / 全部 ${employees.length} 名员工`;
      }

