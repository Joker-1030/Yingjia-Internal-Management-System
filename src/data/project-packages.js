      // Demo 示例采购包数据（M11 项目管理）。
      // 字段仅包含 PRD 8.2 已确认的：采购包编号、采购包名称、状态（正常/停用）、有效期、课程方向。
      // 每个课程方向维护一句话课程介绍、不含税报价、税率和含税报价（M11 PRD 8.2）。
      // 编号格式 CGB + 4 位年份 + 6 位年度流水；停用不回收、不物理删除。
      const projectPackages = [
        {
          id: "CGB2026000001",
          name: "管理类通用课程包",
          status: "正常",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          directions: [
            { intro: "面向中基层管理者的管理沟通课程", untaxedPrice: 800, taxRate: 6, taxedPrice: 848 },
            { intro: "面向新任管理者的领导力课程", untaxedPrice: 1200, taxRate: 7.5, taxedPrice: 1290 },
          ],
        },
        {
          id: "CGB2026000002",
          name: "数字化与 AI 课程包",
          status: "正常",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          directions: [
            { intro: "面向业务骨干的 AI 应用课程", untaxedPrice: 1500, taxRate: 6, taxedPrice: 1590 },
            { intro: "面向运营人员的数据分析课程", untaxedPrice: 1600, taxRate: 9, taxedPrice: 1744 },
          ],
        },
        {
          id: "CGB2026000003",
          name: "服务礼仪课程包",
          status: "正常",
          validFrom: "2026-01-01",
          validTo: "2026-06-30",
          directions: [
            { intro: "面向一线服务人员的服务礼仪课程", untaxedPrice: 900, taxRate: 7, taxedPrice: 963 },
          ],
        },
        {
          id: "CGB2026000004",
          name: "新员工培养课程包",
          status: "停用",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          directions: [
            { intro: "面向新入职员工的企业文化课程", untaxedPrice: 700, taxRate: 5, taxedPrice: 735 },
          ],
        },
      ];
