      let selectedPermissionRole = "总裁";
      const permissionCatalog = [
        ["dashboard", "经营工作台"],
        ["customers", "客户经营"],
        ["tasks", "维系管理"],
        ["approvals", "审批中心"],
        ["archive", "停用记录"],
        ["employees", "组织与员工"],
        ["regions", "区域中心与地市配置"],
        ["city-management", "地市管理"],
        ["settings", "客户基础配置"],
        ["imports", "数据导入"],
        ["projects", "项目管理"],
        ["packages", "采购包管理"],
        ["platform-companies", "平台公司管理"],
      ];
      const adminOnlyPermission = ["permissions", "权限授权"];
      const allPermissionCatalog = [...permissionCatalog, adminOnlyPermission];
      const systemRoleTemplates = [
        {
          name: "总裁",
          jobs: ["总裁"],
          scopeType: "company",
          scopeSource: "公司组织",
          objects: [
            "客户单位",
            "关键人",
            "维系任务",
            "维系记录",
            "审批",
            "经营看板",
            "项目",
          ],
          permissions: [
            "dashboard",
            "customers",
            "tasks",
            "approvals",
            "archive",
            "employees",
            "regions",
            "settings",
            "projects",
          ],
        },
        {
          name: "市场副总",
          jobs: ["市场副总"],
          scopeType: "market",
          scopeSource: "全国市场业务",
          objects: [
            "客户单位",
            "关键人",
            "维系任务",
            "维系记录",
            "审批",
            "经营看板",
            "项目",
          ],
          permissions: [
            "dashboard",
            "customers",
            "tasks",
            "approvals",
            "archive",
            "employees",
            "regions",
            "settings",
            "projects",
          ],
        },
        {
          name: "区域总监",
          jobs: ["区域总监"],
          scopeType: "regions",
          scopeSource: "员工所属区域中心",
          objects: [
            "客户单位",
            "关键人",
            "维系任务",
            "维系记录",
            "审批",
            "经营看板",
            "项目",
            "采购包",
            "平台公司",
          ],
          permissions: [
            "dashboard",
            "customers",
            "tasks",
            "approvals",
            "archive",
            "employees",
            "regions",
            "imports",
            "projects",
            "packages",
            "platform-companies",
          ],
        },
        {
          name: "PM",
          jobs: ["项目经理"],
          scopeType: "cities",
          scopeSource: "地市负责人配置",
          objects: ["客户单位", "关键人", "维系任务", "维系记录", "项目", "采购包", "平台公司"],
          permissions: [
            "dashboard",
            "customers",
            "tasks",
            "approvals",
            "archive",
            "employees",
            "city-management",
            "imports",
            "projects",
            "packages",
            "platform-companies",
          ],
        },
        {
          name: "HR/人事",
          jobs: ["HR/人事"],
          scopeType: "organization",
          scopeSource: "公司组织",
          objects: ["内部组织", "员工账号", "审批"],
          permissions: ["employees", "approvals"],
        },
        {
          name: "系统管理员",
          jobs: ["内置 admin 账号"],
          scopeType: "company",
          scopeSource: "公司组织",
          objects: [
            "客户单位",
            "关键人",
            "维系任务",
            "维系记录",
            "审批",
            "经营看板",
            "项目",
            "采购包",
            "平台公司",
            "账号",
            "平台参数",
            "运行日志",
          ],
          permissions: allPermissionCatalog.map((item) => item[0]),
        },
      ];
      const employeeRoleNames = (employee) => [
        ...(employee?.manualRoles || employee?.roles || []),
        ...Object.keys(employee?.automaticRoleSources || {}),
      ].filter((role, index, all) => role && all.indexOf(role) === index);
      const employeeHasRole = (employee, role) =>
        employee?.role === role || employeeRoleNames(employee).includes(role);
      const employeeRoleDisplay = (employee) =>
        employeeRoleNames(employee).join("、") || "未关联业务角色";

      function roleTemplateScopeText(template) {
        return {
          company: "公司全局",
          market: "全国市场",
          regions: "员工所属区域",
          cities: "负责地市",
          organization: "公司组织",
        }[template?.scopeType];
      }

      const permissionTreeGroups = [
        { name: "经营概览", items: [["dashboard", "经营工作台", "页面访问"]] },
        { name: "客户经营", items: [["customers", "客户经营", "三栏查看 / 新增 / 维护"], ["tasks", "维系管理", "任务与记录"]] },
        { name: "协同与审批", items: [["approvals", "审批中心", "查看与处理"], ["archive", "停用记录", "查看与恢复"]] },
        { name: "项目管理", items: [["projects", "项目管理", "查看项目列表与详情"], ["packages", "采购包管理", "查看与维护"], ["platform-companies", "平台公司管理", "查看与维护"]] },
        { name: "组织与配置", items: [["employees", "组织与员工", "组织、员工与异动"], ["regions", "区域中心与地市配置", "区域与地市责任"], ["city-management", "地市管理", "PM 本人地市责任"], ["settings", "客户基础配置", "配置项维护"], ["imports", "数据导入", "上传、确认与结果"]] },
      ];
      const operationPermissionCatalog = [
        ["dashboard.view", "dashboard", "查看经营工作台"],
        ["customers.view", "customers", "查看客户与关键人"],
        ["customers.create_group", "settings", "新增集团公司（仅 F005）"],
        ["customers.create_unit", "settings", "新增客户单位（仅 F005）"],
        ["customers.create_contact", "customers", "新增关键人"],
        ["customers.edit_contact", "customers", "编辑关键人身份"],
        ["customers.transfer_contact", "customers", "发起关键人调岗"],
        ["tasks.view", "tasks", "查看任务与记录"],
        ["tasks.publish_campaign", "tasks", "发布或编辑专项"],
        ["tasks.create_record", "tasks", "新增本人维系记录"],
        ["tasks.complete", "tasks", "完成本人执行任务"],
        ["tasks.adjust", "tasks", "发起本人任务异常申请"],
        ["approvals.view", "approvals", "查看本人有权审批"],
        ["approvals.decide", "approvals", "处理本人待办"],
        ["archive.view", "archive", "查看停用记录"],
        ["archive.request_stop", "archive", "发起对象停用"],
        ["archive.restore", "archive", "申请恢复"],
        ["employees.view", "employees", "查看组织与员工目录"],
        ["employees.view_changes", "employees", "查看人员/组织变动记录"],
        ["employees.create_department", "employees", "新增部门"],
        ["employees.set_supervisor", "employees", "设置部门主管"],
        ["employees.create_employee", "employees", "新增员工与账号"],
        ["employees.edit_employee", "employees", "编辑员工档案"],
        ["employees.change_employee", "employees", "维护员工部门与系统角色"],
        ["employees.suspend_employee", "employees", "直接停用员工"],
        ["employees.restore_employee", "employees", "直接恢复员工"],
        ["employees.reset_password", "employees", "重置他人密码（仅 admin）"],
        ["regions.view", "regions", "查看区域配置"],
        ["regions.edit", "regions", "编辑区域业务映射"],
        ["regions.batch_assign", "regions", "批量分配地市"],
        ["regions.handover", "city-management", "发起负责人交接"],
        ["settings.view", "settings", "查看基础配置"],
        ["settings.edit", "settings", "维护基础配置"],
        ["imports.view", "imports", "查看导入批次"],
        ["imports.upload", "imports", "上传并预校验"],
        ["imports.confirm", "imports", "确认写入"],
        ["imports.download", "imports", "下载模板与报告"],
        ["projects.view", "projects", "查看项目列表与详情"],
        ["projects.create", "projects", "创建项目"],
        ["projects.edit", "projects", "按项目阶段编辑项目"],
        ["packages.view", "packages", "查看采购包"],
        ["packages.manage", "packages", "维护采购包（新增/编辑/停用/恢复）"],
        ["platform-companies.view", "platform-companies", "查看平台公司"],
        ["platform-companies.manage", "platform-companies", "维护平台公司（新增/编辑/停用/恢复）"],
      ];
      const roleOperationPermissions = {
        总裁: [
          "dashboard.view", "customers.view",
          "tasks.view", "tasks.publish_campaign", "tasks.create_record",
          "approvals.view", "approvals.decide",
          "archive.view", "archive.request_stop", "archive.restore",
          "employees.view", "employees.view_changes", "regions.view", "settings.view", "projects.view",         ],
        市场副总: [
          "dashboard.view", "customers.view",
          "tasks.view", "tasks.publish_campaign", "tasks.create_record",
          "approvals.view", "approvals.decide",
          "archive.view", "archive.request_stop", "archive.restore",
          "employees.view", "employees.view_changes", "regions.view", "regions.edit", "settings.view", "projects.view",         ],
        区域总监: [
          "dashboard.view", "customers.view", "customers.create_contact", "customers.edit_contact",
          "customers.transfer_contact", "tasks.view", "tasks.create_record", "tasks.complete", "tasks.adjust",
          "approvals.view", "approvals.decide",
          "archive.view", "archive.request_stop", "archive.restore",
          "employees.view", "employees.view_changes", "regions.view", "regions.batch_assign",
          "imports.view", "imports.upload", "imports.confirm", "imports.download",
          "projects.view", "projects.create", "projects.edit", "packages.view", "platform-companies.view",
        ],
        PM: [
          "dashboard.view", "customers.view", "customers.create_contact",
          "customers.edit_contact", "customers.transfer_contact",
          "tasks.view", "tasks.create_record", "tasks.complete", "tasks.adjust",
          "approvals.view", "approvals.decide",
          "archive.view", "archive.request_stop", "archive.restore",
          "employees.view", "employees.view_changes", "regions.handover",
          "imports.view", "imports.upload", "imports.confirm", "imports.download",
          "projects.view", "projects.create", "projects.edit", "packages.view", "platform-companies.view",
        ],
        "HR/人事": [
          "employees.view", "employees.view_changes", "employees.create_department",
          "employees.set_supervisor", "employees.create_employee", "employees.edit_employee",
          "employees.change_employee", "employees.suspend_employee", "employees.restore_employee",
          "approvals.view", "approvals.decide",
        ],
        系统管理员: operationPermissionCatalog.filter((item) => item[0] !== "regions.handover").map((item) => item[0]),
      };
      const fieldPermissionCatalog = [
        ["customer_base_view", "客户基础字段查看", "view"],
        ["customer_base_edit", "客户基础字段编辑", "edit", "customer_base_view"],
        ["contact_sensitive_view", "关键人敏感字段明文查看", "view"],
        ["contact_sensitive_edit", "关键人敏感字段编辑", "edit", "contact_sensitive_view"],
        ["record_view", "维系记录正文查看", "view"],
        ["record_edit", "本人维系记录编辑", "edit", "record_view"],
        ["employee_sensitive_view", "员工手机号明文查看", "view"],
        ["employee_sensitive_edit", "员工敏感字段编辑", "edit", "employee_sensitive_view"],
      ];
      const roleFieldPermissions = {
        总裁: ["customer_base_view", "customer_base_edit", "contact_sensitive_view", "record_view", "record_edit"],
        市场副总: ["customer_base_view", "customer_base_edit", "contact_sensitive_view", "record_view", "record_edit"],
        区域总监: ["customer_base_view", "contact_sensitive_view", "record_view", "record_edit"],
        PM: ["customer_base_view", "customer_base_edit", "contact_sensitive_view", "record_view", "record_edit"],
        "HR/人事": ["employee_sensitive_view", "employee_sensitive_edit"],
        系统管理员: fieldPermissionCatalog.map((item) => item[0]),
      };
      const attachmentPermissionCatalog = [
        ["attachment_view", "附件查看 / 在线预览"],
        ["attachment_download", "附件下载", "attachment_view"],
        ["attachment_upload", "附件上传"],
        ["attachment_delete", "附件删除", "attachment_view|attachment_upload"],
      ];
      const roleAttachmentPermissions = {
        总裁: ["attachment_view", "attachment_download", "attachment_upload", "attachment_delete"],
        市场副总: ["attachment_view", "attachment_download", "attachment_upload", "attachment_delete"],
        区域总监: ["attachment_view", "attachment_download", "attachment_upload", "attachment_delete"],
        PM: ["attachment_view", "attachment_download", "attachment_upload", "attachment_delete"],
        "HR/人事": ["attachment_view", "attachment_upload"],
        系统管理员: attachmentPermissionCatalog.map((item) => item[0]),
      };
      const permissionRoleCodes = {
        总裁: "PRESIDENT",
        市场副总: "MARKET_VP",
        区域总监: "REGIONAL_DIRECTOR",
        PM: "PM",
        "HR/人事": "HR",
        系统管理员: "ADMIN",
      };
      const permissionVersions = Object.fromEntries(
        systemRoleTemplates.map((template, index) => {
          const code = permissionRoleCodes[template.name];
          const isAdmin = template.name === "系统管理员";
          const configPageKeys = ["packages", "platform-companies"];
          const configOperationKeys = [
            "packages.view",
            "packages.manage",
            "platform-companies.view",
            "platform-companies.manage",
          ];
          const projectActionOperationKeys = ["projects.create", "projects.edit"];
          const m11CreatePermissions = [...template.permissions];
          const m11CreateOperations = [...roleOperationPermissions[template.name]];
          const m11ConfigPermissions = [...template.permissions];
          const m11ConfigOperations = roleOperationPermissions[template.name].filter(
            (operation) => !projectActionOperationKeys.includes(operation),
          );
          const m11ProjectPermissions = template.permissions.filter(
            (permission) => !configPageKeys.includes(permission),
          );
          const m11ProjectOperations = roleOperationPermissions[template.name].filter(
            (operation) =>
              ![...configOperationKeys, ...projectActionOperationKeys].includes(
                operation,
              ),
          );
          const baselinePermissions = template.permissions.filter(
            (permission) => !["projects", ...configPageKeys].includes(permission),
          );
          const baselineOperations = roleOperationPermissions[template.name].filter(
            (operation) =>
              !["projects.view", ...configOperationKeys, ...projectActionOperationKeys].includes(
                operation,
              ),
          );
          const legacyPermissions = isAdmin
            ? [...baselinePermissions]
            : baselinePermissions.filter((permission) => permission !== "imports");
          return [
            template.name,
            [
              {
                id: `PERM-${code}-00000${index + 5}`,
                type: "初始化",
                operator: "系统管理员",
                time: "2026-08-27 11:00",
                reason: "同步 M11 项目创建与开始前编辑权限基线",
                permissions: m11CreatePermissions,
                operations: m11CreateOperations,
                fields: [...roleFieldPermissions[template.name]],
                attachments: [...roleAttachmentPermissions[template.name]],
              },
              {
                id: `PERM-${code}-00000${index + 4}`,
                type: "初始化",
                operator: "系统管理员",
                time: "2026-08-27 10:00",
                reason: "同步 M11 采购包与平台公司配置权限基线",
                permissions: m11ConfigPermissions,
                operations: m11ConfigOperations,
                fields: [...roleFieldPermissions[template.name]],
                attachments: [...roleAttachmentPermissions[template.name]],
              },
              {
                id: `PERM-${code}-00000${index + 3}`,
                type: "初始化",
                operator: "系统管理员",
                time: "2026-08-27 09:00",
                reason: "同步 M11 项目管理权限基线",
                permissions: m11ProjectPermissions,
                operations: m11ProjectOperations,
                fields: [...roleFieldPermissions[template.name]],
                attachments: [...roleAttachmentPermissions[template.name]],
              },
              {
                id: `PERM-${code}-00000${index + 2}`,
                type: "初始化",
                operator: "系统管理员",
                time: "2026-08-17 09:30",
                reason: "同步 V1.2.0 客户经营权限基线",
                permissions: baselinePermissions,
                operations: baselineOperations,
                fields: [...roleFieldPermissions[template.name]],
                attachments: [...roleAttachmentPermissions[template.name]],
              },
              {
                id: `PERM-${code}-00000${index + 1}`,
                type: "历史版本",
                operator: "系统管理员",
                time: "2026-08-14 16:20",
                reason: "保留版本升级前权限快照",
                permissions: legacyPermissions,
                operations: baselineOperations,
                fields: [...roleFieldPermissions[template.name]],
                attachments: [...roleAttachmentPermissions[template.name]],
              },
            ],
          ];
        }),
      );
      let permissionDraft = null;
      let permissionChangeReason = "";
