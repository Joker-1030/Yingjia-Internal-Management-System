      const FULL_IMPORT_TEMPLATE = "客户主数据全量模板";
      const CONTACT_IMPORT_TEMPLATE = "关键人模板";
      const FULL_IMPORT_VERSION = "CUSTOMER_MASTER_IMPORT_V1_5";
      const CONTACT_IMPORT_VERSION = "CONTACT_IMPORT_V1_5";
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
      const importBatches = [];
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
      function canAccessImportBatch(batch, account = currentUser) {
        if (!batch || !account || ![FULL_IMPORT_TEMPLATE, CONTACT_IMPORT_TEMPLATE].includes(batch.templateType)) return false;
        if (account.fullAccess) return true;
        const sameCreator =
          importBatchCreatorKey(batch) === importAccountKey(account);
        if (account.role === "pm") return sameCreator;
        if (account.role !== "director") return false;
        return sameCreator;
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
        return templates;
      }
      function importTemplateVersion(templateType) {
        if (templateType === FULL_IMPORT_TEMPLATE) return FULL_IMPORT_VERSION;
        if (templateType === CONTACT_IMPORT_TEMPLATE)
          return CONTACT_IMPORT_VERSION;
        return "";
      }
      function importScopeText(templateType, account = currentUser) {
        if (account?.fullAccess) return "公司全局";
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
