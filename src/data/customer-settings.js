      const ruleData = [
        {
          id: 901,
          type: "birthday",
          name: "关键人生日关怀",
          levels: "全部职级",
          lead: 7,
          dueBefore: 0,
          reminders: "3,1,0",
          allowLateCompletion: false,
          lateCompletionDays: 7,
          holidayIds: [],
          title: "【生日关怀】{{关键人姓名}}（{{生日月日}}）",
          content: "结合客户偏好准备生日问候，并在生日当天前完成关怀。",
          source: "关键人生日（公历月日）",
          matched: 17,
          nextRun: "每日 01:00",
          status: "启用",
          updatedAt: "2026-08-16 10:20",
        },
        {
          id: 902,
          type: "holiday",
          name: "法定节假日客户关怀",
          levels: "一级、二级",
          lead: 14,
          dueBefore: 1,
          reminders: "7,3,1",
          allowLateCompletion: false,
          lateCompletionDays: 7,
          holidayIds: ["HOL-2026-SPRING", "HOL-2026-LABOR", "HOL-2026-MID-AUTUMN", "HOL-2026-NATIONAL"],
          title: "【{{节日名称}}关怀】{{关键人姓名}}",
          content: "结合节日主题完成重点客户问候，记录客户反馈与后续计划。",
          source: "年度法定节假日日历",
          matched: 9,
          nextRun: "每日 01:10",
          status: "启用",
          updatedAt: "2026-08-16 11:05",
        },
      ];
      const holidayCalendar = {
        year: 2026,
        source: "国务院办公厅年度节假日安排（演示数据）",
        version: "2026.01",
        syncedAt: "2025-11-12 02:10",
        status: "同步成功",
        holidays: [
          { id: "HOL-2026-NEWYEAR", year: 2026, name: "元旦", date: "2026-01-01", startDate: "2026-01-01", endDate: "2026-01-01", status: "正常" },
          { id: "HOL-2026-SPRING", year: 2026, name: "春节", date: "2026-02-17", startDate: "2026-02-15", endDate: "2026-02-23", status: "正常" },
          { id: "HOL-2026-QINGMING", year: 2026, name: "清明节", date: "2026-04-05", startDate: "2026-04-04", endDate: "2026-04-06", status: "正常" },
          { id: "HOL-2026-LABOR", year: 2026, name: "劳动节", date: "2026-05-01", startDate: "2026-05-01", endDate: "2026-05-05", status: "正常" },
          { id: "HOL-2026-DRAGON", year: 2026, name: "端午节", date: "2026-06-19", startDate: "2026-06-19", endDate: "2026-06-21", status: "正常" },
          { id: "HOL-2026-MID-AUTUMN", year: 2026, name: "中秋节", date: "2026-09-25", startDate: "2026-09-25", endDate: "2026-09-27", status: "正常" },
          { id: "HOL-2026-NATIONAL", year: 2026, name: "国庆节", date: "2026-10-01", startDate: "2026-10-01", endDate: "2026-10-07", status: "正常" },
        ],
      };
      let industries = [
        { name: "通信", enabled: true },
        { name: "制造", enabled: true },
        { name: "能源", enabled: true },
        { name: "金融", enabled: true },
      ];
      industries.forEach((industry, index) => {
        industry.code = industry.code || `IND-${String(index + 1).padStart(3, "0")}`;
        industry.sort = industry.sort || (index + 1) * 10;
        industry.updatedAt = industry.updatedAt || "2026-08-17 09:30";
      });
