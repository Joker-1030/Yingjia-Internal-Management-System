      const DEMO_TODAY = "2026-11-03";
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
        {"id": 501,"taskId": 2400,"person": "李雪","personId": 101,"company": "华北云网集团山东有限公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "赵磊","region": "山东区域","attachments": []},
        {"id": 502,"taskId": 2401,"person": "王建国","personId": 102,"company": "华北云网集团济南分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "陈经理","region": "山东区域","attachments": []},
        {"id": 503,"taskId": 2402,"person": "林静","personId": 103,"company": "华北云网集团济南分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "陈经理","region": "山东区域","attachments": []},
        {"id": 504,"taskId": 2403,"person": "马骏","personId": 104,"company": "华信通信集团泰安分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "陈经理","region": "山东区域","attachments": []},
        {"id": 505,"taskId": 2404,"person": "周明远","personId": 105,"company": "国网产业协同集团青岛分公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "刘经理","region": "山东区域","attachments": []},
        {"id": 506,"taskId": 2405,"person": "许航","personId": 106,"company": "齐鲁数科集团江苏有限公司","method": "电话","date": "2026-10-30","createdAt": "2026-10-30 10:00","summary": "确认近期培训与数字化需求，核对参与人员和时间。","feedback": "已确认需求沟通安排。","next": "提交课程方案并确认预算。","pm": "孙倩","region": "江苏区域","attachments": []},
      ];
      const pendingMaintenanceRecords = [];
