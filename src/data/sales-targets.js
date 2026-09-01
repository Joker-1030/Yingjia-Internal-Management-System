      const salesTargetMonths = [
        {
          month: "2026-08",
          companyTarget: 10,
          version: "V2026.08-01",
          effectiveAt: "2026-08-01 09:00",
          regions: [
            { name: "山东区域", target: 6, pms: [{ name: "陈经理", target: 3 }, { name: "刘经理", target: 3 }] },
            { name: "江苏区域", target: 3, pms: [{ name: "周经理", target: 3 }] },
            { name: "浙江区域", target: 1, pms: [{ name: "吴经理", target: 1 }] },
          ],
        },
        {
          month: "2026-09",
          companyTarget: 12,
          version: "V2026.09-02",
          effectiveAt: "2026-09-01 09:30",
          regions: [
            { name: "山东区域", target: 7, pms: [{ name: "陈经理", target: 4 }, { name: "刘经理", target: 3 }] },
            { name: "江苏区域", target: 3, pms: [{ name: "周经理", target: 3 }] },
            { name: "浙江区域", target: 2, pms: [{ name: "吴经理", target: 2 }] },
          ],
        },
        {
          month: "2026-10",
          companyTarget: 14,
          version: "V2026.10-01",
          effectiveAt: "2026-09-01 10:10",
          regions: [
            { name: "山东区域", target: 8, pms: [{ name: "陈经理", target: 4 }, { name: "刘经理", target: 4 }] },
            { name: "江苏区域", target: 4, pms: [{ name: "周经理", target: 4 }] },
            { name: "浙江区域", target: 2, pms: [{ name: "吴经理", target: 2 }] },
          ],
        },
      ];

      const salesTargetHistory = [
        {
          version: "V2026.09-02",
          month: "2026-09",
          level: "区域",
          object: "山东区域",
          before: 6,
          after: 7,
          reason: "结合当前月新增商机计划调整",
          operator: "刘总",
          approval: "直接生效",
          effectiveAt: "2026-09-01 09:30",
        },
        {
          version: "V2026.09-01",
          month: "2026-09",
          level: "公司",
          object: "英嘉科技",
          before: "—",
          after: 12,
          reason: "发布九月商机数量目标",
          operator: "刘总",
          approval: "首次发布",
          effectiveAt: "2026-08-28 16:00",
        },
      ];
