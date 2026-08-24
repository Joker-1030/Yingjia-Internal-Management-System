      const businessCodeCounters = { KP: 0, MT: 0, WF: 0 };
      const taskExecutionCounters = {};
      function seedBusinessCodes(items, prefix, defaultSource) {
        items.forEach((item) => {
          const match = String(item.code || "").match(
            new RegExp(`^${prefix}([0-9]{8})$`),
          );
          if (match) {
            businessCodeCounters[prefix] = Math.max(
              businessCodeCounters[prefix],
              Number(match[1]),
            );
          }
        });
        items.forEach((item) => {
          if (!item.code) item.code = nextBusinessCode(prefix);
          if (!item.source) item.source = defaultSource;
        });
      }
      function nextBusinessCode(prefix) {
        businessCodeCounters[prefix] += 1;
        return `${prefix}${String(businessCodeCounters[prefix]).padStart(8, "0")}`;
      }
      const isCampaignTask = (task) =>
        ["专项维系", "关键人覆盖 KPI"].includes(task?.type);
      function taskThemeKey(task) {
        if (isCampaignTask(task)) return `campaign:${task.campaignId}`;
        if (task.type === "生日关怀")
          return `birthday:${task.birthdayMonth || task.due?.slice(0, 7)}`;
        if (task.type === "节假日关怀")
          return `holiday:${task.holidayName || task.title.replace("客户关怀", "")}`;
        return "regular:global";
      }
      function taskThemeDescriptor(task) {
        const key = taskThemeKey(task);
        if (isCampaignTask(task)) {
          const campaign = campaigns.find((item) => item.id === task.campaignId);
          return {
            key,
            type: task.type,
            name: campaign?.name || task.title,
            campaignId: task.campaignId,
          };
        }
        if (task.type === "生日关怀") {
          const monthKey = task.birthdayMonth || task.due?.slice(0, 7);
          const [year, month] = monthKey.split("-");
          return {
            key,
            type: task.type,
            name: `${year}年${Number(month)}月生日关怀`,
            birthdayMonth: monthKey,
          };
        }
        if (task.type === "节假日关怀") {
          const holidayName = task.holidayName || task.title.replace("客户关怀", "");
          return {
            key,
            type: task.type,
            name: `${holidayName}客户关怀`,
            holidayName,
          };
        }
        return {
          key,
          type: "常规维系",
          name: "关键人定期维系计划",
        };
      }
      let taskThemes = [];
      function ensureTaskTheme(taskOrDescriptor) {
        const descriptor = taskOrDescriptor.key
          ? taskOrDescriptor
          : taskThemeDescriptor(taskOrDescriptor);
        let theme = taskThemes.find((item) => item.key === descriptor.key);
        if (!theme) {
          theme = {
            id: `theme-${descriptor.key}`,
            code: nextBusinessCode("MT"),
            source: descriptor.source || "system",
            ...descriptor,
          };
          taskThemes.push(theme);
          taskExecutionCounters[theme.code] = 0;
        }
        return theme;
      }
      function nextTaskExecutionCode(parentTaskCode) {
        taskExecutionCounters[parentTaskCode] =
          (taskExecutionCounters[parentTaskCode] || 0) + 1;
        return `${parentTaskCode}-${String(taskExecutionCounters[parentTaskCode]).padStart(6, "0")}`;
      }
      function seedTaskHierarchy() {
        const descriptors = [
          { key: "regular:global", type: "常规维系", name: "关键人定期维系计划" },
          ...campaigns.map((campaign) => ({
            key: `campaign:${campaign.id}`,
            type: campaign.category,
            name: campaign.name,
            campaignId: campaign.id,
          })),
          ...[...new Set(tasks.filter((task) => task.type === "生日关怀").map((task) => task.birthdayMonth || task.due?.slice(0, 7)))].filter(Boolean).sort().map((monthKey) => {
            const [year, month] = monthKey.split("-");
            return { key: `birthday:${monthKey}`, type: "生日关怀", name: `${year}年${Number(month)}月生日关怀`, birthdayMonth: monthKey };
          }),
          ...[...new Set(tasks.filter((task) => task.type === "节假日关怀").map((task) => task.holidayName || task.title.replace("客户关怀", "")))].filter(Boolean).sort().map((holidayName) => ({
            key: `holiday:${holidayName}`,
            type: "节假日关怀",
            name: `${holidayName}客户关怀`,
            holidayName,
          })),
        ];
        descriptors.forEach(ensureTaskTheme);
        tasks.forEach((task) => {
          const theme = ensureTaskTheme(task);
          task.parentTaskCode = theme.code;
          task.executionCode = nextTaskExecutionCode(theme.code);
          delete task.code;
          if (!task.source) task.source = "system";
        });
      }
      seedBusinessCodes(contacts, "KP", "manual");
      seedTaskHierarchy();
      seedBusinessCodes(approvals, "WF", "manual");
      const expandedCustomerNodes = new Set([
        "group:中国移动",
        "province:中国移动:山东",
        "city:中国移动:济南",
        "group:中国电信",
        "group:中国联通",
        "city:中国移动:烟台",
        "city:中国移动:泰安",
      ]);
      const customerAreaFilter = {
        provinces: new Set(),
        cities: new Set(),
        districts: new Set(),
      };
      let appliedCustomerFilter = {
        group: "",
        name: "",
        personName: "",
        industries: new Set(),
        levels: new Set(),
        personPhone: "",
        pms: new Set(),
        coverage: "",
        departments: new Set(),
        positions: new Set(),
        customPosition: "",
        dimensionCoverage: "",
        provinces: new Set(),
        cities: new Set(),
        districts: new Set(),
      };
      let customerAreaOutsideClickHandler = null;
      let noticeOutsideClickHandler = null;
