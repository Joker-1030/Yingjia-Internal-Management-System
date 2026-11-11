      const DEMO_TODAY = "2026-11-11";
      const maintenanceConfig = {
        cycles: { 一级: 7, 二级: 15, 三级: 30, 四级: 45, 其他: 45 },
        reminders: {
          一级: "3,1,0",
          二级: "3,1,0",
          三级: "3,1,0",
          四级: "3,1,0",
          其他: "3,1,0",
        },
        titles: {
          一级: "{{关键人姓名}}常规维系",
          二级: "{{关键人姓名}}常规维系",
          三级: "{{关键人姓名}}常规维系",
          四级: "{{关键人姓名}}常规维系",
          其他: "{{关键人姓名}}常规维系",
        },
        requirements: {
          一级: "完成客户沟通并记录反馈与下一步行动。",
          二级: "完成客户沟通并记录反馈与下一步行动。",
          三级: "完成客户沟通并记录反馈与下一步行动。",
          四级: "完成客户沟通并记录反馈与下一步行动。",
          其他: "完成客户沟通并记录反馈与下一步行动。",
        },
        version: "LV-20261103-01",
        updatedAt: "2026-11-02 09:30",
        directorEscalation: 3,
        vpEscalation: 7,
      };
      const maintenanceRecords = [
        { id: 7010, person: "王建国", personId: 102, company: "华北云网集团济南分公司", method: "电话", date: "2026-11-10", createdAt: "2026-11-10 15:30:00", createdBy: "陈经理", createdByCode: "YJ004", pm: "陈经理", region: "山东区域", summary: "确认年度培训安排", feedback: "客户确认沟通计划", next: "准备方案", attachments: [] },
        { id: 7011, person: "林静", personId: 103, company: "华北云网集团济南分公司", method: "微信", date: "2026-11-08", createdAt: "2026-11-10 14:20:00", createdBy: "陈经理", createdByCode: "YJ004", pm: "陈经理", region: "山东区域", summary: "补记此前的客户需求沟通", feedback: "客户希望补充课程案例", next: "更新方案", attachments: [] },
        { id: 7012, person: "周明远", personId: 105, company: "国网产业协同集团青岛分公司", method: "电话", date: "2026-11-10", createdAt: "2026-11-10 11:30:00", createdBy: "刘经理", createdByCode: "YJ005", pm: "刘经理", region: "山东区域", summary: "确认能源客户培训意向", feedback: "等待预算反馈", next: "跟进预算", attachments: [] },
        { id: 7013, person: "王建国", personId: 102, company: "华北云网集团济南分公司", method: "邮件", date: "2026-11-09", createdAt: "2026-11-10 16:20:00", createdBy: "系统管理员", createdByCode: "YJ007", pm: "陈经理", proxyOperator: "系统管理员", proxyReason: "演示管理员按授权代录", region: "山东区域", summary: "代录客户需求确认", feedback: "客户确认需求范围", next: "安排沟通", attachments: [] },
        { id: 7014, person: "王建国", personId: 102, company: "华北云网集团济南分公司", method: "电话", date: "2026-11-09", createdAt: "2026-11-09 11:00:00", createdBy: "陈经理", createdByCode: "YJ004", pm: "陈经理", region: "山东区域", summary: "沟通培训需求", feedback: "客户要求进一步细化", next: "准备细化方案", attachments: [] },
        {"id": 501,"createdBy": "赵磊","createdByCode": "YJ003","taskId": 2400,"person": "李雪","personId": 101,"company": "华北云网集团山东有限公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "赵磊","region": "山东区域","attachments": []},
        {"id": 502,"createdBy": "陈经理","createdByCode": "YJ004","taskId": 2401,"person": "王建国","personId": 102,"company": "华北云网集团济南分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "陈经理","region": "山东区域","attachments": []},
        {"id": 503,"createdBy": "陈经理","createdByCode": "YJ004","taskId": 2402,"person": "林静","personId": 103,"company": "华北云网集团济南分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "陈经理","region": "山东区域","attachments": []},
        {"id": 504,"createdBy": "陈经理","createdByCode": "YJ004","taskId": 2403,"person": "马骏","personId": 104,"company": "华信通信集团泰安分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "陈经理","region": "山东区域","attachments": []},
        {"id": 505,"createdBy": "刘经理","createdByCode": "YJ005","taskId": 2404,"person": "周明远","personId": 105,"company": "国网产业协同集团青岛分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "刘经理","region": "山东区域","attachments": []},
        {"id": 506,"createdBy": "孙倩","createdByCode": "YJ008","taskId": 2405,"person": "许航","personId": 106,"company": "齐鲁数科集团江苏有限公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "孙倩","region": "江苏区域","attachments": []},
      ];
      const pendingMaintenanceRecords = [];
