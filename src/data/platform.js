      const platformJobs = [
        {
          id: "JOB-OVERDUE",
          name: "任务逾期扫描",
          lastRun: "2026-08-11 10:00:02",
          duration: "1.2s",
          status: "成功",
          target: "tasks",
        },
        {
          id: "JOB-MATCH",
          name: "动态专项匹配",
          lastRun: "2026-08-11 09:30:01",
          duration: "2.8s",
          status: "成功",
          target: "tasks",
        },
        {
          id: "JOB-NOTICE",
          name: "系统通知重试",
          lastRun: "2026-08-11 09:25:11",
          duration: "4.1s",
          status: "部分重试",
          target: "dashboard",
        },
      ];
      const securityEvents = [
        {
          id: "SEC-001",
          title: "账号连续登录失败",
          detail: "刘经理连续 5 次密码校验失败，已触发安全提醒",
          time: "2026-08-11 09:18",
          employeeCode: "YJ005",
        },
        {
          id: "SEC-002",
          title: "高权限角色配置已复核",
          detail: "市场副总完成角色模板例行复核",
          time: "2026-08-10 17:40",
          target: "permissions",
        },
      ];

