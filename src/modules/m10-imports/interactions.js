      function downloadText(name, text) {
        const blob = new Blob(["\ufeff" + text], {
          type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }
      function downloadTemplate(requestedType) {
        if (!hasOperationPermission("imports.download"))
          return toast("当前角色无数据导入模板权限");
        const type =
          requestedType || (currentUser.fullAccess ? "full" : "contact");
        if (type === "full" && !currentUser.fullAccess)
          return toast("PM 仅可下载关键人模板");
        const full = type === "full";
        const templateName = full ? FULL_IMPORT_TEMPLATE : CONTACT_IMPORT_TEMPLATE;
        const templateVersion = full
          ? FULL_IMPORT_VERSION
          : CONTACT_IMPORT_VERSION;
        const employee = employees.find((item) => item.name === currentUser.name);
        downloadText(
          `${templateName}_${templateVersion}.xlsx`,
          full
            ? `模板类型,${templateName}\n模板版本,${templateVersion}\n下载员工ID,YJ007\n下载时间,${recordCreatedAt()}\n工作表,用途,下拉字段\n集团公司,维护集团主数据,行业\n地市负责人,仅分配,省份/城市/PM工号\n客户单位,维护客户公司,行业/集团/公司层级/省市区\n客户部门,维护公司下的部门树,行业/集团/客户公司/上级客户部门\n关键人,新增身份与首条任职,行业/集团/客户公司/客户部门/职级/标准岗位`
            : `模板类型,${templateName}\n模板版本,${templateVersion}\n下载人,${currentUser.name}\n下载员工ID,${employee?.code || "—"}\n下载时间,${recordCreatedAt()}\n工作表,关键人\n可导入范围,${currentUser.region}\n下拉字段,客户单位/部门/职级/标准岗位\n说明,仅新增关键人及首条任职；疑似重复默认跳过，任职变更须走关键人调岗审批`,
        );
        toast(`${templateName}已下载，版本 ${templateVersion}`);
      }
      function openImportUpload() {
        if (!hasOperationPermission("imports.upload"))
          return toast("当前角色无数据导入权限");
        openModal(
          `<div class="modal-head"><div class="modal-title">上传导入文件</div><button class="icon-btn close" data-close>×</button></div><form id="importForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">模板类型 *</label>${currentUser.fullAccess ? `<select class="input" id="importUploadType"><option>${FULL_IMPORT_TEMPLATE}</option><option>${CONTACT_IMPORT_TEMPLATE}</option></select>` : `<input class="input" id="importUploadType" value="${CONTACT_IMPORT_TEMPLATE}" disabled>`}</div><div class="form-group"><label class="form-label">模板版本</label><input class="input" id="importUploadVersion" value="${currentUser.fullAccess ? FULL_IMPORT_VERSION : CONTACT_IMPORT_VERSION}" disabled></div><div class="form-group full"><label class="form-label">导入范围</label><input class="input" value="${currentUser.fullAccess ? "公司全局" : `${currentUser.name}当前负责客户`}" disabled></div></div><label class="file-box" style="display:block;padding:32px"><span id="importFileName">⇧ 选择 .xlsx 文件</span><input id="importFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required hidden></label><div class="role-note" style="margin-top:14px">仅接收单个 `.xlsx`，最大 20 MB，不接收 `.xls`、宏、加密文件。Demo 使用一致的预置行结果演示校验与确认，不读取本地真实业务内容。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">开始预校验</button></div></form>`,
        );
        const refreshUploadVersion = () => {
          $("#importUploadVersion").value =
            $("#importUploadType").value === FULL_IMPORT_TEMPLATE
              ? FULL_IMPORT_VERSION
              : CONTACT_IMPORT_VERSION;
        };
        if ($("#importUploadType").tagName === "SELECT")
          $("#importUploadType").onchange = refreshUploadVersion;
        $("#importFile").onchange = () => {
          $("#importFileName").textContent = $("#importFile").files[0]?.name
            ? `已选择：${$("#importFile").files[0].name}`
            : "⇧ 选择 .xlsx 文件";
        };
        $("#importForm").onsubmit = (e) => {
          e.preventDefault();
          const file = $("#importFile").files[0];
          if (!file) return toast("请选择 .xlsx 文件");
          if (!file.name.toLowerCase().endsWith(".xlsx"))
            return toast("仅支持 .xlsx 格式");
          if (file.size > 20 * 1024 * 1024)
            return toast("文件大小不能超过 20 MB");
          const templateType = $("#importUploadType").value;
          const isFullTemplate = templateType === FULL_IMPORT_TEMPLATE;
          const employee = employees.find((item) => item.name === currentUser.name);
          const b = {
            id: `IMP-${DEMO_TODAY.replaceAll("-", "")}-${String(importBatches.length + 1).padStart(2, "0")}`,
            file: file.name,
            user: currentUser.name,
            userCode: employee?.code || "YJ007",
            scope: currentUser.fullAccess
              ? "公司全局"
              : `${currentUser.name}当前负责客户`,
            templateType,
            templateVersion: isFullTemplate
              ? FULL_IMPORT_VERSION
              : CONTACT_IMPORT_VERSION,
            status: "待确认",
            createdAt: `${DEMO_TODAY} ${formatTaskUpdateTime(new Date()).slice(11)}`,
            finishedAt: "",
            sheets: isFullTemplate
              ? [
                  importSheet("集团公司", 3, 1, 0, 0),
                  importSheet("地市负责人", 2, 1, 1, 0),
                  importSheet("客户单位", 8, 1, 1, 1),
                  importSheet("客户部门", 6, 0, 0, 0),
                  importSheet("关键人", 19, 1, 1, 1),
                ]
              : [importSheet("关键人", 38, 4, 3, 2)],
          };
          normalizeImportBatch(b);
          importBatches.unshift(b);
          closeOverlay();
          renderPage();
          openImportDetail(b.id);
        };
      }
      function importSuccessRate(success, valid) {
        if (!valid) return "--";
        return `${((success / valid) * 100).toFixed(1)}%`;
      }
      function importIssueRowsHtml(batch) {
        const rows = [];
        if (batch.errors)
          rows.push(
            `<tr><td>关键人 / 12</td><td>手机号</td><td><span class="tag red">阻断错误</span></td><td>IMP-FIELD-002 · 手机号格式或必填校验失败</td><td>填写 11 位中国大陆手机号后重新上传</td></tr>`,
          );
        if (batch.duplicates)
          rows.push(
            `<tr><td>关键人 / 21</td><td>手机号</td><td><span class="tag yellow">疑似重复</span></td><td>IMP-DUP-001 · 命中存量关键人唯一手机号</td><td>默认跳过；任职变化请走调岗审批</td></tr>`,
          );
        if (batch.errors && batch.templateType === FULL_IMPORT_TEMPLATE)
          rows.push(
            `<tr><td>地市负责人 / 36</td><td>PM工号</td><td><span class="tag red">阻断错误</span></td><td>IMP-SCOPE-001 · 已有负责人或引用不存在</td><td>已有负责人须走地市交接；不存在时核对当前候选</td></tr>`,
          );
        if (batch.warnings)
          rows.push(
            `<tr><td>关键人 / 42</td><td>附加列</td><td><span class="tag blue">警告</span></td><td>IMP-COLUMN-001 · 未知列“内部备注”将被忽略</td><td>可确认继续，该列不会写入</td></tr>`,
          );
        return (
          rows.join("") ||
          '<tr><td colspan="5"><div class="empty">当前批次没有阻断错误、疑似重复或警告</div></td></tr>'
        );
      }
      function openImportDetail(id) {
        if (!hasOperationPermission("imports.view"))
          return toast("当前角色无导入批次查看权限");
        const b = importBatches.find((x) => x.id === id);
        if (
          !b ||
          (!currentUser.fullAccess &&
            (currentUser.role !== "pm" || b.user !== currentUser.name))
        )
          return toast("无权查看该导入批次或结果报告");
        const finalized = ["全部成功", "部分成功", "失败", "已关闭"].includes(
          b.status,
        );
        const validationReady = !["已上传", "预校验中"].includes(b.status);
        const hasResult = Boolean(b.resultAvailable);
        const success = hasResult ? b.success : null;
        const failed = hasResult ? Math.max(b.valid - success, 0) : null;
        const resultRate = hasResult
          ? importSuccessRate(success, b.valid)
          : "--";
        const sheetRows = (b.sheets || [])
          .map((sheet) => {
            const sheetSuccess = hasResult ? Number(sheet.success || 0) : null;
            const sheetFailed = hasResult
              ? Math.max(sheet.valid - sheetSuccess, 0)
              : null;
            return `<tr><td><strong>${sheet.name}</strong></td><td>${sheet.valid}</td><td>${sheet.duplicates}</td><td>${sheet.errors}</td><td>${sheet.warnings}</td><td>${hasResult ? sheetSuccess : "—"}</td><td>${hasResult ? sheetFailed : "—"}</td><td>${hasResult ? importSuccessRate(sheetSuccess, sheet.valid) : "--"}</td></tr>`;
          })
          .join("");
        const progressText = {
          已上传: "文件已接收，正在等待预校验任务；此阶段尚无行级统计。",
          预校验中: "正在校验模板结构、字段格式、唯一性、引用对象和当前账号数据范围。",
          导入中: `已确认 ${b.valid} 条可导入源业务行，系统正按依赖顺序写入，不能重复确认。`,
          已关闭: "该批次已人工关闭，预校验快照保留，未写入正式业务数据。",
          失败: b.valid
            ? "导入执行失败，业务写入已回滚，请按结果报告处理后重新上传。"
            : "模板结构或必需字段校验失败，批次未进入确认导入。",
        }[b.status];
        const resultSummary = hasResult
          ? `<div class="role-note" style="margin-top:14px">最终成功写入 ${success} / ${b.valid} 条确认源业务行，成功率 ${resultRate}；疑似重复与预校验阻断行不进入成功率分母。全批次数字等于下方各业务工作表之和。</div>`
          : progressText
            ? `<div class="role-note ${b.status === "失败" ? "danger-note" : ""}" style="margin-top:14px">${progressText}</div>`
            : "";
        const detailTitle = b.status === "待确认"
          ? "预校验结果"
          : ["已上传", "预校验中", "导入中"].includes(b.status)
            ? "导入进度"
            : "导入结果";
        openDrawer(
          `<div class="drawer-head"><div><div class="modal-title">${detailTitle}</div><div class="panel-sub">${b.id} · ${b.templateType} · ${b.templateVersion}</div></div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">导</div><div><div class="detail-name">${b.file}</div><div class="detail-sub">${b.user}（${b.userCode}）· ${b.scope} · ${b.createdAt}</div></div><div class="spacer"></div><span class="tag ${importStatusTone(b.status)}">${b.status}</span></div>${validationReady ? `<div class="metrics" style="grid-template-columns:repeat(5,minmax(0,1fr));margin-top:18px">${metric("可导入", b.valid, "格式、权限和引用通过")}${metric("疑似重复", b.duplicates, "默认跳过，不覆盖", "yellow")}${metric("阻断错误", b.errors, "本行不写入", "red")}${metric("警告", b.warnings, "确认后可继续", "blue")}${metric("成功率", resultRate, hasResult ? `${success} 条成功 / ${b.valid} 条确认` : "导入完成后计算", hasResult && failed ? "yellow" : "green")}</div><div class="section-title">分工作表统计</div><div class="table-wrap"><table><thead><tr><th>工作表</th><th>可导入</th><th>疑似重复</th><th>阻断错误</th><th>警告</th><th>成功</th><th>失败</th><th>成功率</th></tr></thead><tbody>${sheetRows}<tr><td><strong>全批次</strong></td><td><strong>${b.valid}</strong></td><td><strong>${b.duplicates}</strong></td><td><strong>${b.errors}</strong></td><td><strong>${b.warnings}</strong></td><td><strong>${hasResult ? success : "—"}</strong></td><td><strong>${hasResult ? failed : "—"}</strong></td><td><strong>${resultRate}</strong></td></tr></tbody></table></div><div class="section-title">错误、重复与警告明细</div><div class="table-wrap"><table><thead><tr><th>工作表 / 行号</th><th>字段</th><th>分类</th><th>错误码 / 原因</th><th>修复建议</th></tr></thead><tbody>${importIssueRowsHtml(b)}</tbody></table></div>` : ""}${resultSummary}${b.status === "待确认" && hasOperationPermission("imports.confirm") ? `<label class="choice-item" style="margin-top:14px"><input id="importConfirmAck" type="checkbox"><span>已核对预校验结果，仅确认写入 ${b.valid} 条可导入源业务行；疑似重复和阻断错误行全部跳过</span></label>` : ""}</div><div class="drawer-foot">${finalized && hasOperationPermission("imports.download") ? `<button class="btn" data-action="download-report" data-id="${b.id}">下载结果报告 .xlsx</button>` : ""}<button class="btn" data-close>关闭</button>${b.status === "待确认" && hasOperationPermission("imports.confirm") ? `<button class="btn btn-primary" id="confirmImport" disabled>确认导入 ${b.valid} 行</button>` : ""}</div>`,
        );
        if ($("#importConfirmAck"))
          $("#importConfirmAck").onchange = () =>
            ($("#confirmImport").disabled = !$("#importConfirmAck").checked);
        if ($("#confirmImport"))
          $("#confirmImport").onclick = () => openImportConfirmation(b.id);
      }
      function openImportConfirmation(id) {
        if (!hasOperationPermission("imports.confirm"))
          return toast("当前角色无确认导入权限");
        const batch = importBatches.find((item) => item.id === id);
        if (
          !batch ||
          batch.status !== "待确认" ||
          (!currentUser.fullAccess &&
            (currentUser.role !== "pm" || batch.user !== currentUser.name))
        )
          return toast("当前批次不可确认导入");
        openModal(
          `<div class="modal-head"><div class="modal-title">确认导入</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note"><strong>${batch.id}</strong><br>将写入 ${batch.valid} 条已通过预校验的源业务行；${batch.duplicates} 条疑似重复和 ${batch.errors} 条阻断错误行不会写入。确认后不能再次提交同一批次。</div><label class="choice-item" style="margin-top:14px"><input id="importFinalAck" type="checkbox"><span>我已确认模板类型、导入范围和预校验结果</span></label></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="executeImport" disabled>确认并开始导入</button></div>`,
        );
        $("#importFinalAck").onchange = () =>
          ($("#executeImport").disabled = !$("#importFinalAck").checked);
        $("#executeImport").onclick = () => {
          batch.sheets.forEach((sheet) => (sheet.success = sheet.valid));
          batch.resultAvailable = true;
          batch.status = batch.errors || batch.duplicates
            ? "部分成功"
            : "全部成功";
          batch.finishedAt = recordCreatedAt();
          normalizeImportBatch(batch);
          closeOverlay();
          renderPage();
          toast(
            `导入完成：成功 ${batch.success} 条，疑似重复和阻断错误行未写入`,
          );
        };
      }
      function downloadImportReport(id) {
        if (!hasOperationPermission("imports.download"))
          return toast("当前角色无下载结果报告权限");
        const b = importBatches.find((x) => x.id === id);
        if (
          !b ||
          (!currentUser.fullAccess &&
            (currentUser.role !== "pm" || b.user !== currentUser.name))
        )
          return toast("无权下载该批次结果报告");
        if (!["全部成功", "部分成功", "失败", "已关闭"].includes(b.status))
          return toast("该批次尚未形成结果报告");
        const sheetReport = (b.sheets || [])
          .map(
            (sheet) =>
              `${sheet.name},汇总,${b.resultAvailable ? sheet.success : ""},,${sheet.errors ? "IMP-FIELD-002" : ""},可导入${sheet.valid}条/重复${sheet.duplicates}条/错误${sheet.errors}条/警告${sheet.warnings}条,${sheet.errors ? "修正后重新上传" : "无需处理"}`,
          )
          .join("\n");
        downloadText(
          `${b.id}_结果报告.xlsx`,
          `批次编号,${b.id}\n模板类型,${b.templateType}\n模板版本,${b.templateVersion}\n工作表,行号/范围,成功数,对象ID,错误码,原因,修复建议\n${sheetReport}`,
        );
        toast("导入报告已下载");
      }

