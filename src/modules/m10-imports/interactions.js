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
      function requestedImportTemplate(requestedType) {
        const aliases = {
          full: FULL_IMPORT_TEMPLATE,
          contact: CONTACT_IMPORT_TEMPLATE,
          project: PROJECT_IMPORT_TEMPLATE,
        };
        return aliases[requestedType] || requestedType || "";
      }
      function importTemplateDownloadText(templateType, employee) {
        const common = `模板类型,${templateType}\n模板版本,${importTemplateVersion(templateType)}\n下载人,${currentUser.name}\n下载员工ID,${employee?.code || "—"}\n下载账号标识,${importAccountKey(currentUser)}\n下载时间,${recordCreatedAt()}\n导入范围,${importScopeText(templateType, currentUser)}`;
        if (templateType === FULL_IMPORT_TEMPLATE)
          return `${common}\n工作表,用途,下拉字段\n集团公司,维护集团主数据,行业\n地市负责人,仅分配,省份/城市/PM工号\n客户单位,维护客户公司,行业/集团/组织上级类型/上级客户公司编码/业务责任层级/业务责任省市区\n客户部门,维护公司下的部门树,行业/集团/客户公司/上级客户部门\n关键人,新增身份与首条任职,行业/集团/客户公司/客户部门/职级/标准岗位`;
        if (templateType === CONTACT_IMPORT_TEMPLATE)
          return `${common}\n工作表,关键人\n下拉字段,客户单位/部门/职级/标准岗位\n说明,仅新增关键人及首条任职；疑似重复默认跳过，任职变更须走关键人调岗审批`;
        return `${common}\n工作表,项目基本信息\n模板字段,项目名称/项目类型/客户编号/原创建时间/开始时间/结束时间/项目天数/资源类型/采购包及课程方向/合作形式/平台公司/AI 软件项目金额/导入阶段\n系统生成,项目编号/地区/当前项目负责人/项目单价/培训项目金额/结账金额\n说明,仅新增项目；不覆盖存量，不接收已取消项目，不包含项目人员、资料和满意度`;
      }
      function downloadTemplate(requestedType) {
        if (!hasOperationPermission("imports.download"))
          return toast("当前角色无数据导入模板权限");
        const templateType = requestedImportTemplate(requestedType);
        if (!importTemplateTypesForAccount(currentUser).includes(templateType)) {
          if (
            templateType === PROJECT_IMPORT_TEMPLATE &&
            !projectImportInitializationOpen
          )
            return toast("项目初始化已结束，项目模板不再提供下载");
          return toast("当前角色无权下载该导入模板");
        }
        const templateVersion = importTemplateVersion(templateType);
        const employee = employees.find((item) => item.name === currentUser.name);
        downloadText(
          `${templateType}_${templateVersion}.xlsx`,
          importTemplateDownloadText(templateType, employee),
        );
        toast(`${templateType}已下载，版本 ${templateVersion}`);
      }
      function projectImportDemoRows(actor, batchId) {
        const eligibleCustomers = customers.filter((customer) => {
          const owner = resolveProjectOwner(customer);
          return (
            !customer.archived &&
            owner &&
            projectImportCustomerInScope(customer, owner, actor)
          );
        });
        const customer = eligibleCustomers[0];
        if (!customer) return [];
        const suffix = batchId.split("-").pop();
        const commonAi = {
          type: "AI软件项目",
          customerCode: customerStableCode(customer),
          resourceType: "AI区域框架",
          cooperation: "直接服务",
          packageId: "",
          directionIntro: "",
          companyId: "",
          aiAmount: 68000,
        };
        return [
          {
            rowNumber: 2,
            name: `${customer.name}历史智能服务迁移项目${suffix}`,
            ...commonAi,
            originalCreatedAt: "2024-03-01 09:00",
            startTime: "2026-06-10 09:00",
            endTime: "2026-06-20 18:00",
            days: 10,
            importStage: "已完成",
          },
          {
            rowNumber: 3,
            name: `${customer.name}管理能力提升项目${suffix}`,
            type: "培训项目",
            customerCode: customerStableCode(customer),
            originalCreatedAt: "2025-11-18 10:00",
            startTime: "2026-08-16 09:00",
            endTime: "2026-08-18 18:00",
            days: 3,
            resourceType: "采购包课程",
            packageId: "CGB2026000001",
            directionIntro: "面向中基层管理者的管理沟通课程",
            cooperation: "直接服务",
            companyId: "",
            aiAmount: "",
            importStage: "进行中",
          },
          {
            rowNumber: 4,
            name: `${customer.name}运营支撑项目${suffix}`,
            ...commonAi,
            originalCreatedAt: "2023-09-12 14:00",
            startTime: "2026-08-15 09:00",
            endTime: "2026-09-15 18:00",
            days: 32,
            importStage: "进行中",
            simulateExecutionFailure: true,
          },
          {
            rowNumber: 5,
            name:
              projects.find((project) => project.stage !== "已取消")?.name ||
              "当前占用项目名称",
            ...commonAi,
            originalCreatedAt: "2025-01-10 09:00",
            startTime: "2026-05-01 09:00",
            endTime: "2026-05-20 18:00",
            days: 20,
            importStage: "已交付",
          },
          {
            rowNumber: 6,
            name: `${customer.name}无效历史项目${suffix}`,
            ...commonAi,
            customerCode: "UNKNOWN-CUSTOMER",
            originalCreatedAt: "2022-04-01 09:00",
            startTime: "2026-03-01 09:00",
            endTime: "2026-03-10 18:00",
            days: 10,
            importStage: "已取消",
          },
        ];
      }
      function projectImportBatchDetails(rows, actor) {
        const projectNameCounts = rows.reduce((counts, row) => {
          const name = String(row?.name || "").trim();
          if (name) counts.set(name, (counts.get(name) || 0) + 1);
          return counts;
        }, new Map());
        const checks = rows.map((row) => {
          const check = prepareProjectImportRow(row, actor);
          const name = String(row?.name || "").trim();
          if ((projectNameCounts.get(name) || 0) < 2) return check;
          return {
            ...check,
            classification: "error",
            adjustment: "",
            issues: [
              ...(check.issues || []),
              projectImportIssue(
                "项目名称",
                "IMP-PROJECT-WORKBOOK-DUP-001",
                "同一项目模板内存在重复项目名称",
                "每个项目名称在模板内仅保留一行后重新上传",
              ),
            ],
          };
        });
        const valid = checks.filter((item) => item.classification === "valid");
        return {
          projectRows: rows.map((row) => ({ ...row })),
          projectPrevalidation: checks,
          sheets: [
            importSheet(
              "项目基本信息",
              valid.length,
              checks.filter((item) => item.classification === "duplicate").length,
              checks.filter((item) => item.classification === "error").length,
              valid.filter((item) => item.adjustment).length,
            ),
          ],
        };
      }
      function openImportUpload() {
        if (!hasOperationPermission("imports.upload"))
          return toast("当前角色无数据导入权限");
        const templateTypes = importTemplateTypesForAccount(currentUser);
        if (!templateTypes.length) return toast("当前角色暂无可上传的导入模板");
        const templateControl =
          templateTypes.length > 1
            ? `<select class="input" id="importUploadType">${templateTypes.map((type) => `<option>${importEscapeHtml(type)}</option>`).join("")}</select>`
            : `<input class="input" id="importUploadType" value="${importEscapeHtml(templateTypes[0])}" disabled>`;
        openModal(
          `<div class="modal-head"><div class="modal-title">上传导入文件</div><button class="icon-btn close" data-close>×</button></div><form id="importForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label">模板类型 *</label>${templateControl}</div><div class="form-group"><label class="form-label">模板版本</label><input class="input" id="importUploadVersion" disabled></div><div class="form-group full"><label class="form-label">导入范围</label><input class="input" id="importUploadScope" disabled></div></div><label class="file-box" style="display:block;padding:var(--space-8)"><span id="importFileName">⇧ 选择 .xlsx 文件</span><input id="importFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required hidden></label><div class="role-note" style="margin-top:var(--space-4)">仅接收单个 `.xlsx`，最大 20 MB，不接收 `.xls`、宏、加密文件。Demo 使用一致的预置行结果演示校验与确认，不读取本地真实业务内容。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">开始预校验</button></div></form>`,
        );
        const refreshUploadMetadata = () => {
          const templateType = $("#importUploadType").value;
          $("#importUploadVersion").value = importTemplateVersion(templateType);
          $("#importUploadScope").value = importScopeText(
            templateType,
            currentUser,
          );
        };
        if ($("#importUploadType").tagName === "SELECT")
          $("#importUploadType").onchange = refreshUploadMetadata;
        refreshUploadMetadata();
        $("#importFile").onchange = () => {
          $("#importFileName").textContent = $("#importFile").files[0]?.name
            ? `已选择：${$("#importFile").files[0].name}`
            : "⇧ 选择 .xlsx 文件";
        };
        $("#importForm").onsubmit = (event) => {
          event.preventDefault();
          const file = $("#importFile").files[0];
          if (!file) return toast("请选择 .xlsx 文件");
          if (!file.name.toLowerCase().endsWith(".xlsx"))
            return toast("仅支持 .xlsx 格式");
          if (
            file.type !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
            return toast("文件类型与 .xlsx 不匹配");
          if (file.size > 20 * 1024 * 1024)
            return toast("文件大小不能超过 20 MB");
          const templateType = $("#importUploadType").value;
          if (!importTemplateTypesForAccount(currentUser).includes(templateType)) {
            if (
              templateType === PROJECT_IMPORT_TEMPLATE &&
              !projectImportInitializationOpen
            )
              return toast("项目初始化已结束，不能再上传项目模板");
            return toast("当前角色无权上传该导入模板");
          }
          if (
            templateType === PROJECT_IMPORT_TEMPLATE &&
            !projectImportActorEligible(currentUser)
          )
            return toast("当前账号不满足项目导入资格");
          const employee = employees.find((item) => item.name === currentUser.name);
          const batchId = nextImportBatchId();
          const projectDetails =
            templateType === PROJECT_IMPORT_TEMPLATE
              ? projectImportBatchDetails(
                  projectImportDemoRows(currentUser, batchId),
                  currentUser,
                )
              : null;
          const batch = {
            id: batchId,
            file: file.name,
            user: currentUser.name,
            userCode: employee?.code || "—",
            createdByAccount: importAccountKey(currentUser),
            createdByRole: currentUser.role,
            regionScope: importCurrentRegionScope(currentUser),
            scope: importScopeText(templateType, currentUser),
            templateType,
            templateVersion: importTemplateVersion(templateType),
            status: "待确认",
            createdAt: `${DEMO_TODAY} ${formatTaskUpdateTime(new Date()).slice(11)}`,
            finishedAt: "",
            ...(projectDetails || {
              sheets:
                templateType === FULL_IMPORT_TEMPLATE
                  ? [
                      importSheet("集团公司", 3, 1, 0, 0),
                      importSheet("地市负责人", 2, 1, 1, 0),
                      importSheet("客户单位", 8, 1, 1, 1),
                      importSheet("客户部门", 6, 0, 0, 0),
                      importSheet("关键人", 19, 1, 1, 1),
                    ]
                  : [importSheet("关键人", 38, 4, 3, 2)],
            }),
          };
          normalizeImportBatch(batch);
          if (!batch.valid) {
            batch.status = "失败";
            batch.finishedAt = recordCreatedAt();
          }
          importBatches.unshift(batch);
          closeOverlay();
          renderPage();
          openImportDetail(batch.id);
        };
      }
      function importSuccessRate(success, valid) {
        if (!valid) return "--";
        return `${((success / valid) * 100).toFixed(1)}%`;
      }
      function projectImportIssueRowsHtml(batch) {
        return (
          (batch.projectPrevalidation || [])
            .flatMap((check) => {
              if (check.classification === "valid" && check.adjustment) {
                return [
                  `<tr><td>项目基本信息 / ${check.rowNumber}</td><td>导入阶段</td><td><span class="tag blue">警告</span></td><td>IMP-PROJECT-STAGE-ADJUST-001 · ${importEscapeHtml(check.adjustment)}</td><td>确认后按已交付建立并保留缺项待办</td></tr>`,
                ];
              }
              const tone =
                check.classification === "duplicate" ? "yellow" : "red";
              const label =
                check.classification === "duplicate" ? "疑似重复" : "阻断错误";
              return (check.issues || []).map(
                (issue) =>
                  `<tr><td>项目基本信息 / ${check.rowNumber}</td><td>${importEscapeHtml(issue.field)}</td><td><span class="tag ${tone}">${label}</span></td><td>${importEscapeHtml(issue.code)} · ${importEscapeHtml(issue.reason)}</td><td>${importEscapeHtml(issue.suggestion)}</td></tr>`,
              );
            })
            .join("") ||
          '<tr><td colspan="5"><div class="empty">当前批次没有阻断错误、疑似重复或警告</div></td></tr>'
        );
      }
      function importIssueRowsHtml(batch) {
        if (isProjectImportBatch(batch)) return projectImportIssueRowsHtml(batch);
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
      function projectImportResultRowsHtml(batch) {
        if (!isProjectImportBatch(batch) || !batch.resultAvailable) return "";
        const rows = (batch.projectResults || [])
          .map((result) => {
            const tone =
              result.status === "成功"
                ? "green"
                : result.status === "跳过"
                  ? "yellow"
                  : "red";
            return `<tr><td>${result.rowNumber}</td><td><span class="tag ${tone}">${result.status}</span></td><td>${importEscapeHtml(result.objectId || "—")}</td><td>${importEscapeHtml(result.code || "—")}</td><td>${importEscapeHtml(result.reason || "—")}</td></tr>`;
          })
          .join("");
        return `<div class="section-title">项目逐行结果</div><div class="table-wrap"><table><thead><tr><th>行号</th><th>处理结果</th><th>项目编号</th><th>错误码</th><th>原因</th></tr></thead><tbody>${rows || '<tr><td colspan="5"><div class="empty">暂无逐行结果</div></td></tr>'}</tbody></table></div>`;
      }
      function openImportDetail(id) {
        if (!hasOperationPermission("imports.view"))
          return toast("当前角色无导入批次查看权限");
        const b = importBatches.find((x) => x.id === id);
        if (!b || !canAccessImportBatch(b, currentUser))
          return toast("无权查看该导入批次或结果报告");
        const finalized = ["全部成功", "部分成功", "失败", "已关闭"].includes(
          b.status,
        );
        const validationReady = !["已上传", "预校验中"].includes(b.status);
        const canConfirm =
          b.status === "待确认" &&
          b.valid > 0 &&
          hasOperationPermission("imports.confirm") &&
          canConfirmImportBatch(b, currentUser);
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
            return `<tr><td><strong>${importEscapeHtml(sheet.name)}</strong></td><td>${sheet.valid}</td><td>${sheet.duplicates}</td><td>${sheet.errors}</td><td>${sheet.warnings}</td><td>${hasResult ? sheetSuccess : "—"}</td><td>${hasResult ? sheetFailed : "—"}</td><td>${hasResult ? importSuccessRate(sheetSuccess, sheet.valid) : "--"}</td></tr>`;
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
          ? `<div class="role-note" style="margin-top:var(--space-4)">最终成功写入 ${success} / ${b.valid} 条确认源业务行，成功率 ${resultRate}；疑似重复与预校验阻断行不进入成功率分母。全批次数字等于下方各业务工作表之和。</div>`
          : progressText
            ? `<div class="role-note ${b.status === "失败" ? "danger-note" : ""}" style="margin-top:var(--space-4)">${progressText}</div>`
            : "";
        const detailTitle = b.status === "待确认"
          ? "预校验结果"
          : ["已上传", "预校验中", "导入中"].includes(b.status)
            ? "导入进度"
            : "导入结果";
        openDrawer(
          `<div class="drawer-head"><div><div class="modal-title">${detailTitle}</div><div class="panel-sub">${importEscapeHtml(b.id)} · ${importEscapeHtml(b.templateType)} · ${importEscapeHtml(b.templateVersion)}</div></div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">导</div><div><div class="detail-name">${importEscapeHtml(b.file)}</div><div class="detail-sub">${importEscapeHtml(b.user)}（${importEscapeHtml(b.userCode)}）· ${importEscapeHtml(b.scope)} · ${importEscapeHtml(b.createdAt)}</div></div><div class="spacer"></div><span class="tag ${importStatusTone(b.status)}">${importEscapeHtml(b.status)}</span></div>${validationReady ? `<div class="metrics" style="grid-template-columns:repeat(5,minmax(0,1fr));margin-top:var(--space-5)">${metric("可导入", b.valid, "格式、权限和引用通过")}${metric("疑似重复", b.duplicates, "默认跳过，不覆盖", "yellow")}${metric("阻断错误", b.errors, "本行不写入", "red")}${metric("警告", b.warnings, "确认后可继续", "blue")}${metric("成功率", resultRate, hasResult ? `${success} 条成功 / ${b.valid} 条确认` : "导入完成后计算", hasResult && failed ? "yellow" : "green")}</div><div class="section-title">分工作表统计</div><div class="table-wrap"><table><thead><tr><th>工作表</th><th>可导入</th><th>疑似重复</th><th>阻断错误</th><th>警告</th><th>成功</th><th>失败</th><th>成功率</th></tr></thead><tbody>${sheetRows}<tr><td><strong>全批次</strong></td><td><strong>${b.valid}</strong></td><td><strong>${b.duplicates}</strong></td><td><strong>${b.errors}</strong></td><td><strong>${b.warnings}</strong></td><td><strong>${hasResult ? success : "—"}</strong></td><td><strong>${hasResult ? failed : "—"}</strong></td><td><strong>${resultRate}</strong></td></tr></tbody></table></div><div class="section-title">错误、重复与警告明细</div><div class="table-wrap"><table><thead><tr><th>工作表 / 行号</th><th>字段</th><th>分类</th><th>错误码 / 原因</th><th>修复建议</th></tr></thead><tbody>${importIssueRowsHtml(b)}</tbody></table></div>${projectImportResultRowsHtml(b)}` : ""}${resultSummary}${canConfirm ? `<label class="choice-item" style="margin-top:var(--space-4)"><input id="importConfirmAck" type="checkbox"><span>已核对预校验结果，仅确认写入 ${b.valid} 条可导入源业务行；疑似重复和阻断错误行全部跳过</span></label>` : ""}</div><div class="drawer-foot">${finalized && hasOperationPermission("imports.download") ? `<button class="btn" data-action="download-report" data-id="${importEscapeHtml(b.id)}">下载结果报告 .xlsx</button>` : ""}<button class="btn" data-close>关闭</button>${canConfirm ? `<button class="btn btn-primary" id="confirmImport" disabled>确认导入 ${b.valid} 行</button>` : ""}</div>`,
        );
        if ($("#importConfirmAck"))
          $("#importConfirmAck").onchange = () =>
            ($("#confirmImport").disabled = !$("#importConfirmAck").checked);
        if ($("#confirmImport"))
          $("#confirmImport").onclick = () => openImportConfirmation(b.id);
      }
      function executeProjectImportBatch(batch, actor) {
        const checks = batch.projectPrevalidation || [];
        const results = checks.map((check) => {
          if (check.classification === "duplicate") {
            const issue = check.issues?.[0] || {};
            return {
              rowNumber: check.rowNumber,
              status: "跳过",
              objectId: "",
              code: issue.code || "IMP-PROJECT-DUP-001",
              reason: issue.reason || "命中当前存量项目",
            };
          }
          if (check.classification === "error") {
            const issue = check.issues?.[0] || {};
            return {
              rowNumber: check.rowNumber,
              status: "阻断",
              objectId: "",
              code: issue.code || "IMP-PROJECT-VALIDATION-001",
              reason: issue.reason || "预校验未通过",
            };
          }
          if (check.sourceRow?.simulateExecutionFailure) {
            return {
              rowNumber: check.rowNumber,
              status: "失败",
              objectId: "",
              code: "IMP-PROJECT-WRITE-001",
              reason: "正式写入失败；本行未建立项目且未占用编号",
            };
          }
          try {
            const outcome = createProjectFromImportRow(
              check.sourceRow,
              actor,
              batch.id,
            );
            if (outcome.success) {
              return {
                rowNumber: check.rowNumber,
                status: "成功",
                objectId: outcome.projectId,
                code: "",
                reason: outcome.adjustment || "写入成功",
              };
            }
            const issue = outcome.issues?.[0] || {};
            return {
              rowNumber: check.rowNumber,
              status: "失败",
              objectId: "",
              code: issue.code || "IMP-PROJECT-RECHECK-001",
              reason: issue.reason || "确认时重新鉴权未通过",
            };
          } catch (error) {
            return {
              rowNumber: check.rowNumber,
              status: "失败",
              objectId: "",
              code: "IMP-PROJECT-WRITE-001",
              reason: "正式写入失败；本行未建立项目且未占用编号",
            };
          }
        });
        batch.projectResults = results;
        const success = results.filter((item) => item.status === "成功").length;
        batch.sheets[0].success = success;
        batch.resultAvailable = true;
        batch.status =
          success === 0
            ? "失败"
            : success === batch.valid && !batch.duplicates && !batch.errors
              ? "全部成功"
              : "部分成功";
      }
      function openImportConfirmation(id) {
        if (!hasOperationPermission("imports.confirm"))
          return toast("当前角色无确认导入权限");
        const batch = importBatches.find((item) => item.id === id);
        if (
          !batch ||
          batch.status !== "待确认" ||
          !batch.valid ||
          !canConfirmImportBatch(batch, currentUser)
        )
          return toast("当前批次不可确认导入");
        openModal(
          `<div class="modal-head"><div class="modal-title">确认导入</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note"><strong>${importEscapeHtml(batch.id)}</strong><br>将写入 ${batch.valid} 条已通过预校验的源业务行；${batch.duplicates} 条疑似重复和 ${batch.errors} 条阻断错误行不会写入。确认后不能再次提交同一批次。</div><label class="choice-item" style="margin-top:var(--space-4)"><input id="importFinalAck" type="checkbox"><span>我已确认模板类型、导入范围和预校验结果</span></label></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="executeImport" disabled>确认并开始导入</button></div>`,
        );
        $("#importFinalAck").onchange = () =>
          ($("#executeImport").disabled = !$("#importFinalAck").checked);
        $("#executeImport").onclick = () => {
          const liveBatch = importBatches.find((item) => item.id === id);
          if (
            !liveBatch ||
            liveBatch.status !== "待确认" ||
            !hasOperationPermission("imports.confirm") ||
            !canConfirmImportBatch(liveBatch, currentUser)
          ) {
            closeOverlay();
            return toast("当前权限或批次状态已变化，请刷新后重试");
          }
          liveBatch.status = "导入中";
          liveBatch.confirmedByAccount = importAccountKey(currentUser);
          liveBatch.confirmedBy = currentUser.name;
          liveBatch.confirmedAt = recordCreatedAt();
          if (isProjectImportBatch(liveBatch)) {
            executeProjectImportBatch(liveBatch, currentUser);
          } else {
            liveBatch.sheets.forEach((sheet) => (sheet.success = sheet.valid));
            if (liveBatch.templateType === FULL_IMPORT_TEMPLATE) {
              const matchedGroups = customerGroupNames.slice(0, 3);
              liveBatch.groupResultRows = matchedGroups.map((group, index) => ({
                row: index + 2,
                result: "成功（匹配存量）",
                success: 1,
                objectId: "",
                businessNumber: customerGroupNumbers[group],
                errorCode: "",
                reason: "匹配存量集团",
                suggestion: "无需处理",
              }));
              liveBatch.groupResultRows.push({
                row: matchedGroups.length + 2,
                result: "跳过",
                success: 0,
                objectId: "",
                businessNumber: "",
                errorCode: "IMP-DUP-001",
                reason: "集团名称或统一社会信用代码疑似重复",
                suggestion: "核对存量集团后重新上传",
              });
            }
            liveBatch.resultAvailable = true;
            liveBatch.status =
              liveBatch.errors || liveBatch.duplicates
                ? "部分成功"
                : "全部成功";
          }
          liveBatch.finishedAt = recordCreatedAt();
          normalizeImportBatch(liveBatch);
          closeOverlay();
          renderPage();
          toast(
            `导入完成：成功 ${liveBatch.success} 条，未成功行未写入`,
          );
        };
      }
      function downloadImportReport(id) {
        if (!hasOperationPermission("imports.download"))
          return toast("当前角色无下载结果报告权限");
        const b = importBatches.find((x) => x.id === id);
        if (!b || !canAccessImportBatch(b, currentUser))
          return toast("无权下载该批次结果报告");
        if (!["全部成功", "部分成功", "失败", "已关闭"].includes(b.status))
          return toast("该批次尚未形成结果报告");
        const csvCell = (value) => {
          let text = String(value ?? "");
          if (/^[=+\-@]/.test(text)) text = `'${text}`;
          return `"${text.replaceAll('"', '""')}"`;
        };
        const csvRow = (...values) => values.map(csvCell).join(",");
        let reportRows;
        if (isProjectImportBatch(b)) {
          const results = b.projectResults || [];
          reportRows = results.length
            ? results
                .map((result) =>
                  csvRow(
                    "项目基本信息",
                    result.rowNumber,
                    result.status,
                    result.status === "成功" ? 1 : 0,
                    result.objectId,
                    "",
                    result.code,
                    result.reason,
                    result.status === "成功" ? "无需处理" : "按原因修正后重新上传",
                  ),
                )
                .join("\n")
            : (b.projectPrevalidation || [])
                .map((check) => {
                  const issue = check.issues?.[0] || {};
                  return csvRow(
                    "项目基本信息",
                    check.rowNumber,
                    check.classification === "duplicate" ? "跳过" : "阻断",
                    0,
                    "",
                    "",
                    issue.code || "",
                    issue.reason || check.adjustment || "",
                    issue.suggestion || "修正后重新上传",
                  );
                })
                .join("\n");
        } else {
          const groupResultRows = b.groupResultRows || [];
          reportRows = (b.sheets || [])
            .flatMap((sheet) =>
              sheet.name === "集团公司" && groupResultRows.length
                ? groupResultRows.map((row) =>
                    csvRow(
                      sheet.name,
                      row.row,
                      row.result,
                      row.success,
                      row.objectId,
                      row.businessNumber,
                      row.errorCode,
                      row.reason,
                      row.suggestion,
                    ),
                  )
                : [
                    csvRow(
                      sheet.name,
                      "汇总",
                      b.resultAvailable ? "成功" : "",
                      b.resultAvailable ? sheet.success : "",
                      "",
                      "",
                      sheet.errors ? "IMP-FIELD-002" : "",
                      `可导入${sheet.valid}条/重复${sheet.duplicates}条/错误${sheet.errors}条/警告${sheet.warnings}条`,
                      sheet.errors ? "修正后重新上传" : "无需处理",
                    ),
                  ],
            )
            .join("\n");
        }
        downloadText(
          `${b.id}_结果报告.xlsx`,
          [
            csvRow("批次编号", b.id),
            csvRow("模板类型", b.templateType),
            csvRow("模板版本", b.templateVersion),
            csvRow(
              "工作表",
              "行号/范围",
              "处理结果",
              "成功数",
              "对象ID",
              "正式业务编号",
              "错误码",
              "原因",
              "修复建议",
            ),
            reportRows,
          ].join("\n"),
        );
        toast("导入报告已下载");
      }
