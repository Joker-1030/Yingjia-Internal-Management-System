      // Demo 示例平台公司数据（M11 项目管理）。
      // 字段仅包含 PRD 8.3 已确认的：平台公司编号、平台公司名称、统一社会信用代码、管理费比例、合作课酬、备注、状态（正常/停用）。
      // 编号格式 PT + 6 位全局流水（不按年份重置）；停用不回收、不物理删除。
      // 管理费比例保留两位百分比小数，合作课酬保留两位小数（M11 PRD 7.2）。
      const platformCompanies = [
        {
          id: "PT000001",
          name: "济南教育科技有限公司",
          creditCode: "91370100MA3C5X7N2P",
          managementFeeRate: 10,
          cooperationPay: 1500,
          remarks: "可提供走账合作及师资合作服务",
          status: "正常",
        },
        {
          id: "PT000002",
          name: "青岛师资服务有限公司",
          creditCode: "91370200MA3D6Y8R4T",
          managementFeeRate: 12,
          cooperationPay: 1800,
          remarks: "",
          status: "正常",
        },
        {
          id: "PT000003",
          name: "泰安培训服务有限公司",
          creditCode: "",
          managementFeeRate: 8,
          cooperationPay: 1200,
          remarks: "暂停合作",
          status: "停用",
        },
        {
          id: "PT000004",
          name: "山东汇智商务服务有限公司",
          creditCode: "",
          managementFeeRate: 6.5,
          cooperationPay: null,
          remarks: "仅开展走账合作",
          status: "正常",
        },
        {
          id: "PT000005",
          name: "江苏知行师资服务有限公司",
          creditCode: "",
          managementFeeRate: null,
          cooperationPay: 2000,
          remarks: "仅开展师资合作",
          status: "正常",
        },
        {
          id: "PT000006",
          name: "浙江共创教育服务有限公司",
          creditCode: "",
          managementFeeRate: 0,
          cooperationPay: 0,
          remarks: "本期合作免管理费、免课酬",
          status: "正常",
        },
      ];
