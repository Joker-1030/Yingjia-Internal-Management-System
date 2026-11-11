      // Synthetic demonstration events; never derive historical usage from lastLogin/updatedAt.
      const employeeUsageVisits = [
        { employeeCode: "YJ004", at: "2026-11-10 08:45:00" },
        { employeeCode: "YJ004", at: "2026-11-10 13:10:00" },
        { employeeCode: "YJ004", at: "2026-11-09 09:00:00" },
        { employeeCode: "YJ005", at: "2026-11-10 09:05:00" },
        { employeeCode: "YJ003", at: "2026-11-10 08:30:00" },
        { employeeCode: "YJ007", at: "2026-11-10 09:20:00" },
        { employeeCode: "YJ018", at: "2026-11-10 09:10:00" },
        { employeeCode: "YJ030", at: "2026-11-10 09:30:00" },
        { employeeCode: "YJ036", at: "2026-11-10 10:00:00" },
      ];
      const employeeUsageOperations = [
        { id: "US-DEMO-01", employeeCode: "YJ004", at: "2026-11-10 15:30:00", module: "维系管理", action: "新增维系记录", objects: ["华北云网集团济南分公司 · 王建国"], success: true },
        { id: "US-DEMO-02", employeeCode: "YJ004", at: "2026-11-10 14:20:00", module: "维系管理", action: "新增维系记录（补录）", objects: ["华北云网集团济南分公司 · 林静"], success: true },
        { id: "US-DEMO-03", employeeCode: "YJ004", at: "2026-11-10 10:10:00", module: "销售与商机管理", action: "新增跟进", objects: ["济南分公司培训商机"], success: true },
        { id: "US-DEMO-04", employeeCode: "YJ003", at: "2026-11-10 11:00:00", module: "区域中心与地市配置", action: "批量分配地市负责人", objects: ["济南市", "泰安市"], success: true },
        { id: "US-DEMO-05", employeeCode: "YJ005", at: "2026-11-10 11:30:00", module: "维系管理", action: "新增维系记录", objects: ["国网产业协同集团青岛分公司 · 周明远"], success: true },
        { id: "US-DEMO-06", employeeCode: "YJ007", at: "2026-11-10 16:20:00", module: "维系管理", action: "代录维系记录", objects: ["华北云网集团济南分公司 · 王建国"], success: true },
        { id: "US-DEMO-07", employeeCode: "YJ018", at: "2026-11-10 10:40:00", module: "培训老师管理", action: "更新老师资料", objects: ["张讲师"], success: true },
        { id: "US-DEMO-08", employeeCode: "YJ030", at: "2026-11-10 14:10:00", module: "销售与商机管理", action: "提交方案支撑", objects: ["山东培训方案支撑"], success: true },
        { id: "US-DEMO-09", employeeCode: "YJ036", at: "2026-11-10 10:30:00", module: "销售与商机管理", action: "新增跟进", objects: ["客户培训需求沟通"], success: true },
        { id: "US-DEMO-10", employeeCode: "YJ004", at: "2026-11-09 11:00:00", module: "维系管理", action: "新增维系记录", objects: ["华北云网集团济南分公司 · 王建国"], success: true },
      ];
