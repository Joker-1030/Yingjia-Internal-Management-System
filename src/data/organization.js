      const employees = [
        {
          code: "YJ001",
          name: "刘总",
          dept: "总经办",
          job: "总裁",
          role: "总裁",
          scope: "公司全局",
          status: "在职",
        },
        {
          code: "YJ002",
          name: "王静",
          dept: "市场运营部",
          job: "市场副总",
          role: "市场副总",
          scope: "全国市场",
          status: "在职",
        },
        {
          code: "YJ003",
          name: "赵磊",
          dept: "山东区域运营中心",
          job: "区域总监",
          role: "区域总监",
          scope: "山东区域",
          status: "在职",
        },
        {
          code: "YJ004",
          name: "陈经理",
          dept: "山东区域运营中心",
          job: "项目经理",
          role: "PM",
          scope: "济南、泰安",
          status: "在职",
        },
        {
          code: "YJ005",
          name: "刘经理",
          dept: "山东区域运营中心",
          job: "项目经理",
          role: "PM",
          scope: "青岛、烟台",
          status: "在职",
        },
        {
          code: "YJ006",
          name: "周经理",
          dept: "江苏区域运营中心",
          job: "项目经理",
          role: "PM",
          scope: "江苏区域",
          status: "在职",
        },
        {
          code: "YJ007",
          name: "系统管理员",
          dept: "系统内置账号",
          job: "系统管理员",
          role: "系统管理员",
          scope: "公司全局",
          status: "在职",
        },
      ];
      employees.push(
        { code: "YJ008", name: "孙倩", dept: "江苏区域运营中心", job: "区域总监", role: "区域总监", scope: "江苏区域", status: "在职" },
        { code: "YJ009", name: "高经理", dept: "山东区域运营中心", job: "项目经理", role: "PM", scope: "已停用", status: "停用" },
        { code: "YJ010", name: "徐经理", dept: "江苏区域运营中心", job: "项目经理", role: "PM", scope: "无锡、合肥", status: "在职" },
        { code: "YJ011", name: "钱峰", dept: "浙江区域运营中心", job: "区域总监", role: "区域总监", scope: "浙江区域", status: "在职" },
        { code: "YJ012", name: "吴经理", dept: "浙江区域运营中心", job: "项目经理", role: "PM", scope: "杭州、宁波", status: "在职" },
        { code: "YJ013", name: "叶经理", dept: "浙江区域运营中心", job: "项目经理", role: "PM", scope: "温州", status: "在职" },
        { code: "YJ014", name: "林哲", dept: "华南区域运营中心", job: "区域总监", role: "区域总监", scope: "华南区域", status: "在职" },
        { code: "YJ015", name: "林经理", dept: "华南区域运营中心", job: "项目经理", role: "PM", scope: "福州", status: "在职" },
        { code: "YJ016", name: "梁经理", dept: "华南区域运营中心", job: "项目经理", role: "PM", scope: "广州、南宁", status: "在职" },
        { code: "YJ017", name: "郑敏", dept: "市场运营部", job: "区域总监", role: "区域总监", scope: "待配置区域", status: "在职" },
        { code: "YJ018", name: "李娜", dept: "综合运营部", job: "HR/人事", role: "HR/人事", scope: "公司组织", status: "在职" },
        { code: "YJ019", name: "周琳", dept: "财务部", job: "财务经理", role: "普通员工", status: "在职" },
        { code: "YJ020", name: "唐婧", dept: "咨询产品部", job: "咨询产品总监", role: "普通员工", status: "在职" },
        { code: "YJ021", name: "张伟", dept: "能源事业部", job: "事业部总监", role: "普通员工", status: "在职" },
        { code: "YJ022", name: "何晨", dept: "软件研发部", job: "研发总监", role: "普通员工", status: "在职" },
        { code: "YJ023", name: "韩雪", dept: "师资管理部", job: "师资经理", role: "普通员工", status: "在职" },
        { code: "YJ024", name: "郭凯", dept: "财务部", job: "财务经理", role: "普通员工", scope: "已停用", status: "停用" },
        { code: "YJ025", name: "华北总监", dept: "华北区域运营中心", job: "区域总监", role: "区域总监", scope: "华北区域", status: "停用" },
        { code: "YJ026", name: "华中主管", dept: "华中区域运营中心", job: "项目经理", role: "PM", scope: "华中区域", status: "在职" },
        { code: "YJ027", name: "西南总监", dept: "西南区域运营中心", job: "区域总监", role: "区域总监", scope: "西南区域", status: "在职" },
        { code: "YJ028", name: "东北总监", dept: "东北区域运营中心", job: "区域总监", role: "区域总监", scope: "东北区域", status: "在职" },
        { code: "YJ029", name: "沈阳原PM", dept: "东北区域运营中心", job: "项目经理", role: "PM", scope: "沈阳", status: "停用" },
      );
      const employeeProfiles = {
        YJ001: ["13900000001", "liuzong@yingjia.example", "2021-03-01", "YJ001"],
        YJ002: ["13900000002", "wangjing@yingjia.example", "2021-06-15", "YJ001"],
        YJ003: ["13900000003", "zhaolei@yingjia.example", "2022-02-18", "YJ002"],
        YJ004: ["13900000004", "chenjingli@yingjia.example", "2023-04-10", "YJ003"],
        YJ005: ["13900000105", "liujingli@yingjia.example", "2023-05-08", "YJ003"],
        YJ006: ["13900000106", "zhoujingli@yingjia.example", "2023-07-17", "YJ008"],
        YJ007: ["13900000007", "admin@yingjia.example", "2021-01-01", "YJ001"],
        YJ008: ["13900000108", "sunqian@yingjia.example", "2022-04-06", "YJ002"],
        YJ009: ["13900000109", "gaojingli@yingjia.example", "2022-08-01", "YJ003"],
        YJ010: ["13900000110", "xujingli@yingjia.example", "2024-01-12", "YJ008"],
        YJ011: ["13900000111", "qianfeng@yingjia.example", "2022-07-20", "YJ002"],
        YJ012: ["13900000112", "wujingli@yingjia.example", "2023-11-06", "YJ011"],
        YJ013: ["13900000113", "yejingli@yingjia.example", "2024-03-18", "YJ011"],
        YJ014: ["13900000114", "linzhe@yingjia.example", "2022-10-10", "YJ002"],
        YJ015: ["13900000115", "linjingli@yingjia.example", "2024-02-19", "YJ014"],
        YJ016: ["13900000116", "liangjingli@yingjia.example", "2024-05-13", "YJ014"],
        YJ017: ["13900000117", "zhengmin@yingjia.example", "2023-01-09", "YJ002"],
        YJ018: ["13900000018", "lina@yingjia.example", "2022-03-14", "YJ001"],
        YJ019: ["13900000119", "zhoulin@yingjia.example", "2022-05-09", "YJ001"],
        YJ020: ["13900000120", "tangjing@yingjia.example", "2022-09-05", "YJ001"],
        YJ021: ["13900000121", "zhangwei@yingjia.example", "2021-11-22", "YJ001"],
        YJ022: ["13900000122", "hechen@yingjia.example", "2022-01-17", "YJ001"],
        YJ023: ["13900000123", "hanxue@yingjia.example", "2023-06-12", "YJ018"],
        YJ024: ["13900000124", "guokai@yingjia.example", "2024-01-08", "YJ019"],
        YJ025: ["13900000125", "huabeizongjian@yingjia.example", "2022-01-01", "YJ002"],
        YJ026: ["13900000126", "huazhongzhuguan@yingjia.example", "2023-01-01", "YJ002"],
        YJ027: ["13900000127", "xinanzongjian@yingjia.example", "2022-03-01", "YJ002"],
        YJ028: ["13900000128", "dongbeizongjian@yingjia.example", "2022-05-01", "YJ002"],
        YJ029: ["13900000129", "shenyangyuanpm@yingjia.example", "2021-06-01", "YJ028"],
      };
      employees.forEach((employee, index) => {
        const [phone, email, hireDate] = employeeProfiles[employee.code];
        Object.assign(employee, {
          phone,
          email,
          hireDate,
          accountStatus: employee.status === "在职" ? "启用" : "停用",
          lastLogin: ["YJ001", "YJ002", "YJ003", "YJ004", "YJ007", "YJ018"].includes(employee.code)
            ? `2026-08-${String(17 - index % 5).padStart(2, "0")} ${String(9 + index % 8).padStart(2, "0")}:42`
            : "从未登录",
          passwordResetAt: employee.code === "YJ007" ? "2026-08-01 10:20" : "2026-06-30 09:00",
          createdAt: `${hireDate} 09:00`,
          updatedAt: employee.status === "在职" ? "2026-08-17 09:30" : "2026-07-15 16:20",
        });
      });
      Object.assign(employees.find((employee) => employee.code === "YJ024"), {
        accountStatus: "停用",
        lastLogin: "2026-07-30 16:18",
        updatedAt: "2026-08-05 10:40",
      });
      Object.assign(employees.find((employee) => employee.code === "YJ023"), {
        initialPasswordVisible: true,
        lastLogin: "从未登录",
      });
      const organizationDepartments = [
        {
          id: 801,
          name: "总经办",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ001",
        },
        {
          id: 802,
          name: "综合运营部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ018",
        },
        {
          id: 803,
          name: "财务部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ019",
        },
        {
          id: 804,
          name: "咨询产品部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ020",
        },
        {
          id: 805,
          name: "师资管理部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ018",
        },
        {
          id: 806,
          name: "市场运营部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ002",
        },
        {
          id: 809,
          name: "山东区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 701,
          status: "启用",
          supervisorCode: "YJ003",
        },
        {
          id: 810,
          name: "江苏区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 702,
          status: "启用",
          supervisorCode: "YJ008",
        },
        {
          id: 811,
          name: "华南区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 704,
          status: "启用",
          supervisorCode: "YJ014",
        },
        {
          id: 812,
          name: "浙江区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 703,
          status: "启用",
          supervisorCode: "YJ011",
        },
        {
          id: 813,
          name: "华北区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 705,
          status: "启用",
          supervisorCode: "YJ025",
        },
        {
          id: 814,
          name: "华中区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 706,
          status: "启用",
          supervisorCode: "YJ026",
        },
        {
          id: 815,
          name: "西南区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 707,
          status: "启用",
          supervisorCode: "YJ027",
        },
        {
          id: 816,
          name: "东北区域运营中心",
          parentId: 806,
          type: "region",
          regionId: 708,
          status: "启用",
          supervisorCode: "YJ028",
        },
        {
          id: 807,
          name: "能源事业部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ021",
        },
        {
          id: 808,
          name: "软件研发部",
          parentId: null,
          type: "department",
          status: "启用",
          supervisorCode: "YJ022",
        },
      ];
      organizationDepartments.forEach((department, index) => {
        department.code =
          department.code || `ORG-${String(index + 1).padStart(3, "0")}`;
        department.sort = department.sort || (index + 1) * 10;
        department.updatedAt = department.updatedAt || "2026-08-17 09:30";
      });
      const businessSystemRoles = ["总裁", "市场副总", "区域总监", "PM", "HR/人事"];
      employees.forEach((employee) => {
        employee.roles = businessSystemRoles.includes(employee.role)
          ? [employee.role]
          : [];
        employee.manualRoles = [...employee.roles];
        employee.departments = employee.dept === "系统内置账号" ? [] : [employee.dept];
        employee.automaticRoleSources = {};
      });
      organizationDepartments.forEach((department) => {
        const supervisor = employees.find(
          (employee) => employee.code === department.supervisorCode,
        );
        if (!supervisor) return;
        if (!supervisor.departments.includes(department.name))
          supervisor.departments.push(department.name);
        if (department.type === "region")
          supervisor.automaticRoleSources["区域总监"] = [
            ...(supervisor.automaticRoleSources["区域总监"] || []),
            department.id,
          ];
      });
      // 华中区域中心主管：模拟“主管不具备区域总监角色”（区域总监自动角色被移除）
      const hzSupervisorWithoutDirectorRole = employees.find(
        (employee) => employee.code === "YJ026",
      );
      if (hzSupervisorWithoutDirectorRole)
        delete hzSupervisorWithoutDirectorRole.automaticRoleSources["区域总监"];
