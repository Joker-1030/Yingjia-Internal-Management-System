      const navGroups = [
        {
          title: "经营概览",
          items: [{ id: "dashboard", icon: "▦", label: "工作台" }],
        },
        {
          title: "客户经营",
          items: [
            { id: "operations", icon: "◉", label: "客户经营" },
            { id: "tasks", icon: "✓", label: "维系管理" },
          ],
        },
        {
          title: "项目管理",
          items: [
            { id: "projects", icon: "▤", label: "项目列表" },
            { id: "packages", icon: "▥", label: "采购包管理" },
            { id: "platform-companies", icon: "▧", label: "平台公司管理" },
          ],
        },
        {
          title: "协同与审批",
          items: [
            { id: "approvals", icon: "◇", label: "审批中心" },
            { id: "archive", icon: "□", label: "停用记录" },
          ],
        },
        {
          title: "系统管理",
          items: [
            { id: "employees", icon: "♧", label: "组织与员工" },
            { id: "permissions", icon: "⌘", label: "权限授权" },
            { id: "regions", icon: "⌖", label: "区域中心与地市配置" },
            { id: "city-management", icon: "⌖", label: "地市管理" },
            { id: "settings", icon: "⚙", label: "客户基础配置" },
            { id: "imports", icon: "⇧", label: "数据导入" },
          ],
        },
      ];

      let currentUser = null;
      let currentPage = "dashboard";
      let adminDashboardView = "system";
      let selectedOperationCustomerId = null;
      let selectedOperationContactId = null;
      let lastRenderedPage = "";
      let taskView = "summary";
      let approvalView = "pending";
      let employeeView = "directory";
      let dashboardTaskFilter = null;
      let dashboardEmployeeStatusFilter = "在职";
      let dashboardComparisonPeriod = "month";
      let regionAssignmentView = "city";
      let selectedCustomerGroup = "";
      let customerTreeDimension = "group";
      let selectedOperationRegion = "";
      let selectedOperationProvince = "";
      let selectedOperationRegionGroup = "";
      let selectedCustomerId = null;
      let selectedRegionId = 701;
      let selectedOrganizationDepartmentId = null;
      let settingsSection = "maintenance";
      let selectedCustomerOrgNode = "";
      let selectedCustomerOrgInternalNode = "";
      let customerOrgCompanyTab = "organization";
      const customerOrgNavFilters = {
        industryName: "",
        groupNumber: "",
        groupName: "",
        companyName: "",
        industryCode: "",
        creditCode: "",
        industry: "",
        group: "",
        levels: new Set(),
        statuses: new Set(),
      };
      const customerOrgInternalFilters = {
        departmentName: "",
        departmentCode: "",
        positionName: "",
        positionCode: "",
        statuses: new Set(),
      };
      let selectedProjectId = null;
      let projectDetailTab = "basic";
      const expandedCustomerOrgNodes = new Set([
        "industry:通信",
        "industry:能源",
        "industry:制造",
      ]);
      const customerOrgLoadLimits = new Map();
      let taskDataUpdatedAt = formatTaskUpdateTime(new Date());
      const executionTableStates = {};
