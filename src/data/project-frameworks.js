      // DEC-243 当前框架样例；直接声明完整新对象，不做历史数据迁移。
      const projectFrameworks = [
        { id: "FW001", code: "KJ2026000001", name: "济南公司2026年度培训与数智服务框架", customerId: 2, amount: 1000000, validFrom: "2026-01-01", validTo: "2026-12-31", status: "启用" },
        { id: "FW002", code: "KJ2026000002", name: "南京公司2026年度能力提升框架", customerId: 7, amount: 600000, validFrom: "2026-01-01", validTo: "2026-12-31", status: "停用" },
        { id: "FW003", code: "KJ2026000003", name: "山东能源2026年专项服务框架", customerId: 5, amount: 300000, validFrom: "2026-01-01", validTo: "2026-10-31", status: "已到期" },
      ];
      const frameworkDemoProjects = [
        { id: "XM2026000021", name: "济南公司框架管理能力培训", type: "培训项目", startTime: "2026-12-10 09:00", endTime: "2026-12-11 17:00", days: 2, amount: 200000, stage: "已立项", lecturers: ["张伟"], teacherAssignments: { lecturers: ["T009"], assistantLecturers: [], teachingAssistants: [] } },
        { id: "XM2026000022", name: "济南公司框架知识库一期", type: "AI软件项目", startTime: "2026-10-12 09:00", endTime: "2026-10-15 17:00", days: 4, amount: 300000, stage: "已交付", deliveryConfirmed: true, actualDeliveryTime: "2026-10-15 17:00" },
        { id: "XM2026000023", name: "济南公司框架智能检索建设", type: "AI软件项目", startTime: "2026-11-01 09:00", endTime: "2026-11-20 17:00", days: 20, amount: 100000, stage: "进行中" },
        { id: "XM2026000024", name: "济南公司框架取消示例", type: "AI软件项目", startTime: "2026-11-25 09:00", endTime: "2026-11-26 17:00", days: 2, amount: 60000, stage: "已取消", cancelledAt: "2026-11-02 10:00:00", cancelReason: "客户取消本次实施计划" },
        { id: "XM2026000025", name: "济南公司框架分期中止示例", type: "AI软件项目", startTime: "2026-10-20 09:00", endTime: "2026-10-30 17:00", days: 11, amount: 80000, stage: "已中止", terminationInvolvesSettlement: true, terminationSettlementAmount: 30000, terminationReason: "客户调整实施范围，中止后续交付", terminatedAt: "2026-10-25 10:00:00", terminatedBy: "陈经理", terminatedOwner: "陈经理" },
      ];
      frameworkDemoProjects.forEach((item) => projects.push({
        customerId: 2, customerSnapshot: { customerCode: "CC00000002", name: "华北云网集团济南分公司", level: "市公司", province: "山东", city: "济南", district: "" },
        resourceType: "框架服务", frameworkId: "FW001", frameworkSnapshot: { code: "KJ2026000001", name: "济南公司2026年度培训与数智服务框架", customerName: "华北云网集团济南分公司", amount: 1000000, validFrom: "2026-01-01", validTo: "2026-12-31" },
        cooperation: "直接服务", packageId: "", directionIntro: "", teachingDirectionId: "", companyId: "", companyName: "", unitPrice: null,
        snapshot: { unitPrice: null, untaxedPrice: null, taxedPrice: null, taxRate: null, cooperationPay: null, managementFeeRate: null },
        createdBy: "陈经理", createdAt: "2026-10-01 09:00:00", ownerSnapshot: "陈经理", currentOwner: "陈经理", opportunityId: "",
        lecturers: [], assistantLecturers: [], teachingAssistants: [], teacherAssignments: { lecturers: [], assistantLecturers: [], teachingAssistants: [] },
        materials: [], satisfaction: { projectScore: null, staffScores: {} }, completionPrerequisitesCompletedAt: null, todos: [], responsibilityHistory: [], changeHistory: [],
        ...item, settlementAmount: item.amount,
      }));
