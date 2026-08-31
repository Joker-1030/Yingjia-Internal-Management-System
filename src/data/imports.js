      const FULL_IMPORT_TEMPLATE = "客户主数据全量模板";
      const CONTACT_IMPORT_TEMPLATE = "关键人模板";
      const PROJECT_IMPORT_TEMPLATE = "项目模板";
      const FULL_IMPORT_VERSION = "CUSTOMER_MASTER_IMPORT_V1_5";
      const CONTACT_IMPORT_VERSION = "CONTACT_IMPORT_V1_5";
      const PROJECT_IMPORT_VERSION = "初始化期当前版本";
      let projectImportInitializationOpen = true;
      const IMPORT_BATCH_STATUSES = [
        "已上传",
        "预校验中",
        "待确认",
        "导入中",
        "部分成功",
        "全部成功",
        "失败",
        "已关闭",
      ];
      const importSheet = (
        name,
        valid = 0,
        duplicates = 0,
        errors = 0,
        warnings = 0,
        success = null,
      ) => ({ name, valid, duplicates, errors, warnings, success });
      const importBatches = [
        {
          id: "IMP-20260817-08",
          file: "全国客户主数据补充.xlsx",
          user: "系统管理员",
          userCode: "YJ007",
          scope: "公司全局",
          templateType: FULL_IMPORT_TEMPLATE,
          templateVersion: FULL_IMPORT_VERSION,
          status: "部分成功",
          createdAt: "2026-08-17 13:40",
          finishedAt: "2026-08-17 14:18",
          resultAvailable: true,
          groupResultRows: [
            {
              row: 2,
              result: "成功（创建）",
              success: 1,
              objectId: "",
              businessNumber: "CG00000006",
              errorCode: "",
              reason: "集团创建成功",
              suggestion: "无需处理",
            },
            {
              row: 3,
              result: "成功（匹配存量）",
              success: 1,
              objectId: "",
              businessNumber: "CG00000001",
              errorCode: "",
              reason: "匹配存量集团",
              suggestion: "无需处理",
            },
            {
              row: 4,
              result: "成功（匹配存量）",
              success: 1,
              objectId: "",
              businessNumber: "CG00000002",
              errorCode: "",
              reason: "匹配存量集团",
              suggestion: "无需处理",
            },
            {
              row: 5,
              result: "跳过",
              success: 0,
              objectId: "",
              businessNumber: "",
              errorCode: "IMP-DUP-001",
              reason: "集团名称或统一社会信用代码疑似重复",
              suggestion: "核对存量集团后重新上传",
            },
          ],
          sheets: [
            importSheet("集团公司", 3, 1, 0, 0, 3),
            importSheet("地市负责人", 2, 1, 1, 0, 2),
            importSheet("客户单位", 8, 1, 1, 1, 8),
            importSheet("客户部门", 6, 0, 0, 0, 6),
            importSheet("关键人", 19, 1, 0, 1, 19),
          ],
        },
        {
          id: "IMP-20260817-07",
          file: "济南泰安关键人盘点.xlsx",
          user: "陈经理",
          userCode: "YJ004",
          scope: "济南、泰安负责客户",
          templateType: CONTACT_IMPORT_TEMPLATE,
          templateVersion: CONTACT_IMPORT_VERSION,
          status: "待确认",
          createdAt: "2026-08-17 10:22",
          finishedAt: "",
          sheets: [importSheet("关键人", 126, 3, 8, 2)],
        },
        {
          id: "IMP-20260816-06",
          file: "浙江移动关键人新增.xlsx",
          user: "吴经理",
          userCode: "YJ012",
          scope: "杭州、宁波负责客户",
          templateType: CONTACT_IMPORT_TEMPLATE,
          templateVersion: CONTACT_IMPORT_VERSION,
          status: "全部成功",
          createdAt: "2026-08-16 16:05",
          finishedAt: "2026-08-16 16:12",
          resultAvailable: true,
          sheets: [importSheet("关键人", 48, 0, 0, 0, 48)],
        },
        {
          id: "IMP-20260815-05",
          file: "华南客户主数据首批.xlsx",
          user: "系统管理员",
          userCode: "YJ007",
          scope: "公司全局",
          templateType: FULL_IMPORT_TEMPLATE,
          templateVersion: FULL_IMPORT_VERSION,
          status: "失败",
          createdAt: "2026-08-15 14:35",
          finishedAt: "2026-08-15 14:37",
          resultAvailable: false,
          sheets: [
            importSheet("集团公司"),
            importSheet("地市负责人"),
            importSheet("客户单位"),
            importSheet("客户部门"),
            importSheet("关键人", 0, 0, 63, 0),
          ],
        },
        {
          id: "IMP-20260814-04",
          file: "山东关键人待校验.xlsx",
          user: "陈经理",
          userCode: "YJ004",
          scope: "济南、泰安负责客户",
          templateType: CONTACT_IMPORT_TEMPLATE,
          templateVersion: CONTACT_IMPORT_VERSION,
          status: "已上传",
          createdAt: "2026-08-14 18:10",
          finishedAt: "",
          sheets: [importSheet("关键人")],
        },
        {
          id: "IMP-20260813-03",
          file: "客户部门主数据更新.xlsx",
          user: "系统管理员",
          userCode: "YJ007",
          scope: "公司全局",
          templateType: FULL_IMPORT_TEMPLATE,
          templateVersion: FULL_IMPORT_VERSION,
          status: "预校验中",
          createdAt: "2026-08-13 11:08",
          finishedAt: "",
          sheets: [
            importSheet("集团公司"),
            importSheet("地市负责人"),
            importSheet("客户单位"),
            importSheet("客户部门"),
            importSheet("关键人"),
          ],
        },
        {
          id: "IMP-20260812-02",
          file: "青岛烟台关键人导入.xlsx",
          user: "刘经理",
          userCode: "YJ005",
          scope: "青岛、烟台负责客户",
          templateType: CONTACT_IMPORT_TEMPLATE,
          templateVersion: CONTACT_IMPORT_VERSION,
          status: "导入中",
          createdAt: "2026-08-12 09:45",
          finishedAt: "",
          sheets: [importSheet("关键人", 64, 2, 1, 0)],
        },
        {
          id: "IMP-20260810-01",
          file: "江苏客户主数据试导.xlsx",
          user: "系统管理员",
          userCode: "YJ007",
          scope: "公司全局",
          templateType: FULL_IMPORT_TEMPLATE,
          templateVersion: FULL_IMPORT_VERSION,
          status: "已关闭",
          createdAt: "2026-08-10 09:15",
          finishedAt: "2026-08-10 09:28",
          resultAvailable: false,
          sheets: [
            importSheet("集团公司", 2, 0, 0, 0),
            importSheet("地市负责人", 1, 1, 0, 0),
            importSheet("客户单位", 4, 0, 1, 0),
            importSheet("客户部门", 2, 0, 0, 1),
            importSheet("关键人", 3, 0, 1, 0),
          ],
        },
      ];
      function normalizeImportBatch(batch) {
        const sheets = batch.sheets || [];
        ["valid", "duplicates", "errors", "warnings"].forEach((field) => {
          batch[field] = sheets.reduce(
            (sum, sheet) => sum + Number(sheet[field] || 0),
            0,
          );
        });
        batch.success = batch.resultAvailable
          ? sheets.reduce((sum, sheet) => sum + Number(sheet.success || 0), 0)
          : null;
        batch.time = batch.createdAt.slice(11, 16);
        return batch;
      }
      importBatches.forEach(normalizeImportBatch);

      function importAccountKey(account) {
        const username = String(account?.username || "").trim();
        if (username) return `username:${username}`;
        const phone = String(account?.phone || "").trim();
        return phone ? `phone:${phone}` : "";
      }
      function importBatchCreatorAccount(batch) {
        if (batch?.createdByAccount) {
          return accounts.find(
            (account) => importAccountKey(account) === batch.createdByAccount,
          );
        }
        return accounts.find((account) => account.name === batch?.user) || null;
      }
      function importBatchCreatorKey(batch) {
        return (
          batch?.createdByAccount ||
          importAccountKey(importBatchCreatorAccount(batch)) ||
          (batch?.userCode ? `employee:${batch.userCode}` : "")
        );
      }
      function importCurrentRegionScope(account = currentUser) {
        if (!account) return "";
        if (account.role === "director") {
          return regionScopeName(regionForName(account.region)) || account.region || "";
        }
        if (account.role === "pm") {
          const owner = cityOwners.find((item) => item.pm === account.name);
          const region = owner
            ? regionsData.find((item) =>
                regionProvinceList(item).includes(owner.province),
              )
            : null;
          return region ? regionScopeName(region) : "";
        }
        return account.fullAccess ? "公司全局" : "";
      }
      function importBatchRegionScope(batch) {
        return (
          batch?.regionScope ||
          importCurrentRegionScope(importBatchCreatorAccount(batch)) ||
          ""
        );
      }
      function isProjectImportBatch(batch) {
        return batch?.templateType === PROJECT_IMPORT_TEMPLATE;
      }
      function canAccessImportBatch(batch, account = currentUser) {
        if (!batch || !account) return false;
        if (account.fullAccess) return true;
        const sameCreator =
          importBatchCreatorKey(batch) === importAccountKey(account);
        if (account.role === "pm") return sameCreator;
        if (account.role !== "director") return false;
        if (!isProjectImportBatch(batch)) return sameCreator;
        return regionsMatch(importBatchRegionScope(batch), account.region);
      }
      function canConfirmImportBatch(batch, account = currentUser) {
        if (!canAccessImportBatch(batch, account)) return false;
        return (
          account.fullAccess ||
          importBatchCreatorKey(batch) === importAccountKey(account)
        );
      }
      function visibleImportBatches(account = currentUser) {
        return importBatches
          .filter((batch) => canAccessImportBatch(batch, account))
          .slice()
          .sort(
            (left, right) =>
              right.createdAt.localeCompare(left.createdAt) ||
              right.id.localeCompare(left.id),
          );
      }
      function importTemplateTypesForAccount(account = currentUser) {
        if (!account) return [];
        const templates = [];
        if (account.fullAccess) templates.push(FULL_IMPORT_TEMPLATE);
        if (account.fullAccess || ["director", "pm"].includes(account.role))
          templates.push(CONTACT_IMPORT_TEMPLATE);
        if (
          projectImportInitializationOpen &&
          (account.fullAccess || ["director", "pm"].includes(account.role))
        )
          templates.push(PROJECT_IMPORT_TEMPLATE);
        return templates;
      }
      function importTemplateVersion(templateType) {
        if (templateType === FULL_IMPORT_TEMPLATE) return FULL_IMPORT_VERSION;
        if (templateType === CONTACT_IMPORT_TEMPLATE)
          return CONTACT_IMPORT_VERSION;
        if (templateType === PROJECT_IMPORT_TEMPLATE)
          return PROJECT_IMPORT_VERSION;
        return "";
      }
      function importScopeText(templateType, account = currentUser) {
        if (account?.fullAccess) return "公司全局";
        if (templateType === PROJECT_IMPORT_TEMPLATE) {
          return account?.role === "director"
            ? `${account.name}负责的省级客户项目`
            : `${account?.name || "当前用户"}负责的市/区县客户项目`;
        }
        return account?.role === "director"
          ? `${account.name}负责的省级客户`
          : `${account?.name || "当前用户"}负责的市/区县客户`;
      }
      function nextImportBatchId() {
        const prefix = `IMP-${DEMO_TODAY.replaceAll("-", "")}-`;
        const sequences = importBatches
          .filter((batch) => batch.id.startsWith(prefix))
          .map((batch) => Number(batch.id.slice(prefix.length)))
          .filter(Number.isFinite);
        const next = (sequences.length ? Math.max(...sequences) : 0) + 1;
        return `${prefix}${String(next).padStart(2, "0")}`;
      }
