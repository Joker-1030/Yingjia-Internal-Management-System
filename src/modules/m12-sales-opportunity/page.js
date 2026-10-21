      const SALES_STAGES = ["商机录入", "需求确认", "方案支撑", "比选", "中选", "落选"];
      const SALES_FORWARD_STAGES = ["商机录入", "需求确认", "方案支撑", "比选", "中选"];
      const SALES_ECOSYSTEM_TYPE = "平台师资合作商机";
      const SALES_TYPES = ["培训商机", "AI 项目商机", SALES_ECOSYSTEM_TYPE];
      function isEcosystemOpportunity(item) { return item?.type === SALES_ECOSYSTEM_TYPE; }
      function salesEcosystemOwnerCode(item) {
        return item.ownerCode || employees.find(employee => employee.name === item.owner)?.code || "";
      }
      function salesOpportunityOwnerName(item) {
        return isEcosystemOpportunity(item) ? employees.find(employee => employee.code === salesEcosystemOwnerCode(item))?.name || item.owner : item.owner;
      }
      function salesCreateTypes() {
        if (!salesCanCreate() || !salesSupportActorActive()) return [];
        if (currentUser.fullAccess) return SALES_TYPES;
        return [
          ...(salesRoleNames().some(role => ["总裁", "市场副总", "区域总监", "PM"].includes(role)) ? SALES_TYPES.filter(type => type !== SALES_ECOSYSTEM_TYPE) : []),
          ...(currentEcosystemEmployee() ? [SALES_ECOSYSTEM_TYPE] : []),
        ];
      }
      function salesOwnerMatch(customer, type, ownerCode = "") {
        if (type !== SALES_ECOSYSTEM_TYPE) return salesOwnerMatchForCustomer(customer);
        if (!customer || !platformCompanies.includes(customer)) return {ok:false, message:"平台公司不存在"};
        const owner = employees.find(employee => employee.code === ownerCode);
        return validEcosystemEmployee(owner) ? {ok:true,owner,role:"生态合作员"} :
          {ok:false,message:"请选择有效生态合作员作为商机负责人"};
      }
      function salesOpportunityOwnerMatch(item) {
        return salesOwnerMatch(salesOpportunityCustomer(item), item.type, salesEcosystemOwnerCode(item));
      }
      function ecosystemEmployeeOpportunityCandidates(code) {
        return opportunities.filter(item => isEcosystemOpportunity(item) && item.stage !== "落选" && salesEcosystemOwnerCode(item) === code);
      }
      const SALES_PRIORITIES = ["高", "中", "低"];
      const SALES_RISKS = [
        "暂无风险",
        "需求不明确或发生变化",
        "预算风险",
        "决策推进风险",
        "竞争风险",
        "方案或交付风险",
        "商务条件风险",
        "预计成交延期",
        "其他",
      ];

      function salesRoleNames() {
        return currentRoleTemplateNames();
      }

      function salesIsRole(name) {
        return salesRoleNames().includes(name);
      }

      function salesCanCreate() {
        return salesSupportActorActive() && hasPermission("opportunities") && hasOperationPermission("opportunities.create");
      }

      function salesCanProgress(opportunity) {
        if (!salesSupportActorActive() || !opportunities.includes(opportunity)) return false;
        const match = salesOpportunityOwnerMatch(opportunity);
        if (!match.ok || (!isEcosystemOpportunity(opportunity) && match.owner.name !== opportunity.owner)) return false;
        if (isEcosystemOpportunity(opportunity)) return Boolean(currentUser.fullAccess ||
          (currentEcosystemEmployee()?.code === salesEcosystemOwnerCode(opportunity) && hasPermission("opportunities") &&
           hasOperationPermission("opportunities.progress") && salesVisibleOpportunities().includes(opportunity)));
        return Boolean(currentUser.fullAccess ||
          (hasPermission("opportunities") && hasOperationPermission("opportunities.progress") &&
            opportunity.owner === currentUser.name && salesVisibleOpportunities().includes(opportunity)));
      }

      function salesCanCorrect(item) {
        if (salesCanProgress(item)) return true;
        return Boolean(currentUser?.fullAccess && salesSupportActorActive() && opportunities.includes(item) && item.stage === "落选");
      }

      // An event keeps its earning identity even when its opportunity is handed over.
      function salesCapturePerformance(item) {
        if (!item.selectedDate || item.performanceOwnerCode) return;
        const employee = employees.find(person => isEcosystemOpportunity(item) ? person.code === salesEcosystemOwnerCode(item) : person.name === item.owner);
        item.performanceOwnerCode = employee?.code || "";
        item.performanceOwnerName = salesOpportunityOwnerName(item);
        item.performanceRegion = isEcosystemOpportunity(item) ? "" : item.region;
      }

      function salesPerformanceRows(rows = opportunities, personal = false) {
        if (!salesSupportActorActive()) return [];
        return rows.filter(item => item.selectedDate).filter(item => {
          const code = item.performanceOwnerCode || employees.find(person => person.name === item.owner)?.code;
          if (isEcosystemOpportunity(item)) return !personal && Boolean(currentUser.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总"));
          if(personal)return code===currentUser.employeeCode && (currentUser.fullAccess || salesIsRole("PM") || salesIsRole("区域总监"));
          if (currentUser.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总")) return true;
          const region = item.performanceRegion || item.region;
          return (salesIsRole("PM") && code === currentUser.employeeCode) ||
            (salesIsRole("区域总监") && salesManagedRegions().some(center => regionsMatch(regionScopeName(center),region)));
        });
      }

      function salesCanReassign() { return false; }

      function salesCurrentEmployee() {
        return employees.find(
          (employee) =>
            employee.name === currentUser?.name && employee.status === "在职",
        );
      }

      function salesManagedRegions() {
        const employee = salesCurrentEmployee();
        if (!employee) return [];
        return regionsData.filter(
          (region) =>
            region.director === employee.name &&
            departmentsManagedBy(employee.code).some(
              (department) => department.regionId === region.id,
            ),
        );
      }

      function salesOpportunityCustomer(opportunity) {
        if (isEcosystemOpportunity(opportunity)) return platformCompanies.find(company => company.id === opportunity.customerCode);
        return customers.find((customer) =>
          opportunity.customerCode === `CU-${String(customer.id).padStart(4, "0")}`,
        );
      }

      function salesOwnerMatchForCustomer(customer) {
        if (!customer || customer.archived)
          return { ok: false, message: "客户单位已停用或不存在" };
        if (customer.level === "省公司") {
          const region = regionForCompany(customer);
          const department = organizationDepartments.find(
            (item) =>
              item.type === "region" &&
              item.status === "启用" &&
              item.regionId === region?.id,
          );
          const candidates = employees.filter(
            (employee) =>
              employee.code === department?.supervisorCode &&
              employee.name === region?.director &&
              employee.status === "在职" &&
              employee.accountStatus !== "停用" &&
              employeeHasRole(employee, "区域总监"),
          );
          return candidates.length === 1
            ? { ok: true, owner: candidates[0], role: "区域总监" }
            : { ok: false, message: "该省级客户没有唯一有效区域总监，暂不能创建商机" };
        }
        const responsibilities = cityOwners.filter(
          (item) =>
            item.province === customer.province && item.city === customer.city,
        );
        if (responsibilities.length !== 1)
          return { ok: false, message: "该客户责任地市没有唯一有效 PM 负责人，暂不能创建商机" };
        const responsibility = responsibilities[0];
        const candidates = employees.filter(
          (employee) =>
            employee.name === responsibility?.pm &&
            employee.status === "在职" &&
            employee.accountStatus !== "停用" &&
            employeeHasRole(employee, "PM") &&
            regionPmEmployees(regionForCompany(customer)).includes(employee),
        );
        return candidates.length === 1
          ? { ok: true, owner: candidates[0], role: "PM" }
          : { ok: false, message: "该客户责任地市没有唯一有效 PM 负责人，暂不能创建商机" };
      }

      function salesCustomerIsInCreateScope(customer, type = "") {
        if (type === SALES_ECOSYSTEM_TYPE) return platformCompanies.includes(customer) && customer.status === "正常" && salesCreateTypes().includes(type);
        if (!customer || customer.archived || !customers.includes(customer)) return false;
        if (!salesCreateTypes().some(value => value !== SALES_ECOSYSTEM_TYPE)) return false;
        if (
          currentUser?.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return true;
        const inDirectorScope =
          salesIsRole("区域总监") &&
          customer.level === "省公司" &&
          salesManagedRegions().some(
            (region) => regionForCompany(customer)?.id === region.id,
          );
        const ownerMatch = salesOwnerMatchForCustomer(customer);
        const inSalesScope =
          salesIsRole("PM") && customer.level !== "省公司" &&
          ownerMatch.ok && ownerMatch.owner.name === currentUser.name;
        return inDirectorScope || inSalesScope;
      }

      function salesVisibleOpportunities() {
        if (!salesSupportActorActive() || !hasPermission("opportunities")) return [];
        if (
          currentUser.fullAccess ||
          salesIsRole("总裁") ||
          salesIsRole("市场副总")
        )
          return opportunities;
        if (salesIsRole("区域总监") || salesIsRole("PM") || salesIsRole("生态合作员"))
          return opportunities.filter(
            (item) => isEcosystemOpportunity(item) ?
              Boolean(currentEcosystemEmployee()?.code === salesEcosystemOwnerCode(item)) :
              (salesIsRole("区域总监") &&
                salesManagedRegions().some((region) =>
                  regionsMatch(regionScopeName(region), item.region),
                )) ||
              (salesIsRole("PM") && item.owner === currentUser.name),
          );
        return [];
      }

      function salesCustomerSelectionValue(customer, type) {
        return type === SALES_ECOSYSTEM_TYPE ? customer.id : customer.name;
      }

      function salesVisibleCustomers(type = "") {
        if (!currentUser) return [];
        return (type === SALES_ECOSYSTEM_TYPE ? platformCompanies : customers).filter(customer => salesCustomerIsInCreateScope(customer, type));
      }

      function salesPmEmployees(region = "") {
        return employees.filter(
          (employee) =>
            employee.status === "在职" &&
            employee.accountStatus !== "停用" &&
            employeeHasRole(employee, "PM") &&
            (!region ||
              organizationRegionsForEmployee(employee).some(
                (employeeRegion) => employeeRegion.scope === region,
              )),
        );
      }

      function salesSupportCandidates() {
        return employees.filter(
          (employee, index, all) =>
            employee.status === "在职" &&
            employee.accountStatus !== "停用" &&
            employee.role !== "系统管理员" &&
            employeeRoleNames(employee).includes("商机支撑") &&
            all.findIndex((other) => other.code === employee.code) === index,
        );
      }

      function salesCurrentSupportEmployee() {
        return salesSupportCandidates().find((employee) =>
          employee.code === currentUser?.employeeCode,
        ) || null;
      }

      function salesCanViewSupportOpportunity(item) {
        const employee = salesCurrentSupportEmployee();
        return Boolean(employee && hasPermission("sales-supports") &&
          item?.supports.some((support) => support.assigneeCode === employee.code));
      }

      function salesSupportActorActive() {
        if (!currentUser || currentUser.disabled || !accounts.includes(currentUser)) return false;
        const employee = employees.find((person) => person.code === currentUser.employeeCode);
        return Boolean(employee && employee.status === "在职" && employee.accountStatus !== "停用");
      }

      function salesCanViewSupportFile(item, support) {
        return Boolean(salesSupportActorActive() && opportunities.includes(item) && item?.supports.includes(support) &&
          (hasPermission("opportunities") && salesVisibleOpportunities().includes(item) ||
           (salesCanViewSupportOpportunity(item) && support.assigneeCode === salesCurrentSupportEmployee()?.code)));
      }

      function salesSupportDeliveryFiles(support) {
        return support?.deliveryFiles || (support?.deliveryFile ? [support.deliveryFile] : []);
      }

      function supportDeliveryAction(item, support) {
        return salesCanViewSupportFile(item, support) && (support.delivery || salesSupportDeliveryFiles(support).length)
          ? `<button class="link" type="button" data-support-delivery="${support.id}" data-support-opportunity="${item.id}">查看交付</button>` : "";
      }

      function supportHistoryAction(item, support) {
        return salesCanViewSupportFile(item, support)
          ? `<button class="link" type="button" data-support-history="${support.id}" data-support-opportunity="${item.id}">历程</button>` : "";
      }

      function supportFileHtml(item, support, deliveryIndex) {
        const files = deliveryIndex === undefined ? salesSupportDeliveryFiles(support) : support.deliveries?.[deliveryIndex]?.files || [];
        return files.map((file, index) => {
          const attrs = `data-support-opportunity="${item.id}" data-support-id="${support.id}" data-support-file-index="${index}"${deliveryIndex === undefined ? "" : ` data-support-history-delivery="${deliveryIndex}"`}`;
          const view = hasAttachmentPermission("attachment_view")
            ? `<button class="link" type="button" data-support-file="view" ${attrs}>${escapeHtml(file.name)}</button>`
            : escapeHtml(file.name);
          const download = hasAttachmentPermission("attachment_download")
            ? ` <button class="link" type="button" data-support-file="download" ${attrs}>下载</button>` : "";
          return `<div style="overflow-wrap:anywhere">${view}${download}</div>`;
        }).join("");
      }

      function salesCanHandleSupport(support) {
        if (currentUser?.fullAccess) return true;
        const employee = salesCurrentSupportEmployee();
        return Boolean(employee && employee.code === support?.assigneeCode &&
          hasPermission("sales-supports") && hasOperationPermission("opportunities.support"));
      }

      function salesCanRunSupportAction(item, support, action) {
        if (!item?.supports.includes(support)) return false;
        if (action === "withdraw") return support.status === "待响应" && salesCanProgress(item);
        if (action === "stop") return support.status !== "已关闭" && salesCanProgress(item);
        if (["close", "supplement"].includes(action))
          return support.status === "已交付" && salesCanProgress(item);
        const expected = { respond: "待响应", deliver: "进行中" }[action];
        return Boolean(expected && support.status === expected && salesCanHandleSupport(support));
      }

      function salesMoney(value) {
        return `${formatWanMoney(value || 0)} 万元`;
      }

      function salesNextBusinessDate(date = DEMO_TODAY) {
        let next = addDays(date, 1);
        while ([0, 6].includes(new Date(`${next}T12:00:00`).getDay()))
          next = addDays(next, 1);
        return next;
      }

      function salesAmountValue(opportunity) {
        return opportunity.stage === "中选"
          ? opportunity.expectedContractAmount
          : opportunity.estimateAmount;
      }

      function salesStageTone(stage) {
        return {
          商机录入: "",
          需求确认: "blue",
          方案支撑: "yellow",
          比选: "orange",
          中选: "green",
          落选: "red",
        }[stage] || "";
      }

      function salesStageTag(stage) {
        return `<span class="tag ${salesStageTone(stage)}">${stage}</span>`;
      }

      function salesPriorityTag(priority) {
        return `<span class="tag ${priority === "高" ? "red" : priority === "中" ? "yellow" : ""}">${priority}</span>`;
      }

      function salesPeriodMonths(period = salesPeriodApplied) {
        if (/^\d{4}-\d{2}$/.test(period)) return [period];
        if (/^\d{4}-Q\d$/.test(period)) {
          const [year, quarterText] = period.split("-Q");
          const start = (Number(quarterText) - 1) * 3 + 1;
          return [0, 1, 2].map((offset) => `${year}-${String(start + offset).padStart(2, "0")}`);
        }
        return Array.from({ length: 12 }, (_, index) => `${period}-${String(index + 1).padStart(2, "0")}`);
      }

      let salesOverviewRegion = "";
      let salesOverviewDimension = "stage";
      let salesOverviewFilter = "";
      let salesOverviewMeasure = "count";

      function resetSalesOverview() {
        salesOverviewRegion = "";
        salesOverviewDimension = "stage";
        salesOverviewFilter = "";
        salesOverviewMeasure = "count";
      }

      function salesWorkbenchAllowed() {
        return Boolean(currentUser && canAccessPage("dashboard") &&
          hasOperationPermission("sales.view") && hasDataObject("商机") &&
          (currentUser.fullAccess || ["总裁", "市场副总", "区域总监", "PM"].some(salesIsRole)) &&
          !(currentUser.role === "admin" && adminDashboardView === "system"));
      }

      function salesWorkbenchOpportunities() {
        const companyScope = currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总");
        return salesVisibleOpportunities().filter(item => companyScope || !isEcosystemOpportunity(item));
      }

      function salesStatsAmount(item) {
        const value = item.stage === "中选" ? item.expectedContractAmount : item.estimateAmount;
        return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
      }

      function salesStatsSum(rows, valueOf = salesStatsAmount) {
        const values = rows.map(valueOf);
        if (values.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
        return values.reduce((sum, value) => sum + value, 0);
      }

      function salesMoneyCents(value) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
        const cents = Math.round(value * 100);
        return Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) < 0.000001 ? cents : null;
      }

      function salesSumMoney(rows, valueOf) {
        const values = rows.map(item => salesMoneyCents(valueOf(item)));
        return values.some(value => value === null) ? null : values.reduce((sum, value) => sum + value, 0) / 100;
      }

      function salesGoalMetrics(target, completed) {
        target = salesMoneyCents(target) === null ? null : target;
        completed = salesMoneyCents(completed) === null ? null : completed;
        const difference = target === null || completed === null ? null : (Math.round(completed * 100) - Math.round(target * 100)) / 100;
        return { target, completed, difference,
          rate: target === null || completed === null || target === 0 ? "—" : `${(completed / target * 100).toFixed(1)}%` };
      }

      function salesGoalMetricCards(goal) {
        return [
          salesDashboardMetric("成交金额目标（含税，万元）", goal.target === null ? "未分配" : salesStatsMoney(goal.target), "target"),
          salesDashboardMetric("周期成交金额（含税，万元）", salesStatsMoney(goal.completed), "periodWonAmount"),
          salesDashboardMetric("差额（含税，万元）", goal.difference === null ? "—" : `${goal.difference > 0 ? "+" : ""}${salesStatsMoney(goal.difference)}`, "difference"),
          salesDashboardMetric("目标完成率", goal.rate, "rate"),
        ];
      }

      function salesStatsMoney(value) {
        return value === null ? "不可用" : formatWanMoney(value);
      }

      function salesStatisticsHelp(key, label) {
        const descriptions = {
          overviewScope: "培训商机不包含平台师资合作商机，两者独立统计。“全部类型”按当前权限统计：公司范围的“全部运营中心”包含平台师资合作商机；指定运营中心及PM、区域总监的地区范围不包含。",
          target: "当前有权范围所选周期的成交金额目标（含税，万元）；按各层已分配的年、季、月目标读取，未分配时不计算完成率。",
          created: "创建日期在所选周期内的商机数量，后来落选仍计入该周期。",
          difference: "周期成交金额－目标金额（含税，万元）；正数超额，负数尚差；金额不可用或目标未分配时不计算。",
          rate: "周期成交金额÷成交金额目标×100%，保留1位小数；目标0、未分配或成交金额不可用时显示—。",
          active: "当前处于商机录入、需求确认、方案支撑、比选或中选阶段的商机数量，不包含落选；不受年/季/月筛选影响。",
          activeAmount: "当前活跃商机的含税金额合计：中选取成交金额，其他活跃阶段取预估金额。不受周期筛选影响，不代表签约或回款金额。",
          selected: "当前处于中选阶段的商机数量，不受年/季/月筛选影响。",
          selectedRate: "当前中选数÷（当前中选数＋当前落选数）×100%；其他阶段不计入分母，无结果时为0%。",
          count: "本卡当前筛选后有权商机数量，包含落选；分组数量为该集合中本阶段或类型的数量。",
          amount: "本卡当前筛选后商机的含税金额合计；中选用成交金额，其他阶段（含落选）用预估金额。不代表收入或回款。",
          countShare: "本组商机数量÷本卡筛选后同一批商机总数×100%。合计为0显示—，保留1位小数。",
          amountShare: "本组商机含税金额÷本卡筛选后同一批商机金额合计×100%。合计为0显示—，保留1位小数。",
          staffTarget: "本行员工在本运营中心所选周期的成交金额目标（含税，万元）；尚未分配时显示未分配。",
          staffCompleted: "本行员工在本运营中心所选周期的成交金额（含税，万元），按中选日期统计；交接保留原业绩归属，纠错后重算。",
          regionTarget: "本行运营中心在本卡所选周期的成交金额目标（含税，万元）；按区域已分配的年、季、月目标读取，尚未分配显示未分配。",
          regionCompleted: "本行运营中心当前有权商机中，按本卡所选周期的中选日期汇总成交金额（含税，万元）；后来落选不冲销，不代表财务收入或回款。",
          regionDifference: "本行运营中心的周期成交金额－目标金额（含税，万元）；正数超额，负数尚差；金额不可用或目标未分配时不计算。",
          regionRate: "本行运营中心的周期成交金额÷目标金额×100%，保留1位小数；目标0、未分配或成交金额不可用时显示—。",
          regionActive: "本行运营中心当前有权商机中，商机录入至中选阶段的商机数，不包含落选。",
          regionAmount: "本行运营中心当前有权活跃商机含税金额；中选取成交金额，其他活跃阶段取预估金额。",
          regionSelected: "本行运营中心当前有权商机中，处于中选阶段的商机数。",
          pipeline: "当前处于商机录入、需求确认、方案支撑、比选阶段的商机数量，排除中选和落选；当前快照，不受周期筛选影响。",
          pipelineAmount: "当前推进中四个阶段商机的预估金额合计（含税，万元）；排除中选和落选，不受周期筛选影响，不代表合同收入。",
          periodWon: "中选日期在所选周期内的商机数量；后来落选不冲销该中选事件。",
          periodWonAmount: "中选日期在所选周期内的商机成交金额合计（含税，万元）；0是有效金额，不代表财务收入或回款。",
          trendCreated: "按创建日期统计所选周期的新建商机；金额模式汇总其预估金额（含税，万元）。",
          trendSelected: "按中选日期统计所选周期的中选事件；金额模式汇总其成交金额（含税，万元）。",
        };
        return `<span class="workbench-help" tabindex="0" role="img" title="${escapeHtml(descriptions[key])}" aria-label="${escapeHtml(label + '说明：' + descriptions[key])}">?</span>`;
      }

      function salesDashboardMetric(label, value, helpKey) {
        return `<div class="metric sales-metric"><span class="metric-label">${label}${salesStatisticsHelp(helpKey, label)}</span><span class="metric-value">${value}</span></div>`;
      }

      function salesPeriodOptions(dimension) {
        const years = [...new Set([DEMO_TODAY.slice(0, 4), ...salesTargetMonths.map(item => item.month.slice(0, 4)),
          ...salesWorkbenchOpportunities().map(item => item.createdDate.slice(0, 4))])].sort().reverse();
        return years.flatMap(year => [[year, `${year}年`],
          ...[1, 2, 3, 4].map(q => [`${year}-Q${q}`, `${year}年第${q}季度`]),
          ...Array.from({ length: 12 }, (_, i) => [`${year}-${String(i + 1).padStart(2, "0")}`, `${year}年${i + 1}月`])]).filter(([value]) => dimension === undefined || salesPeriodDimension(value) === dimension);
      }

      function salesPeriodDimension(period) {
        return /^\d{4}$/.test(period) ? "year" : /^\d{4}-Q[1-4]$/.test(period) ? "quarter" : "month";
      }

      function salesConvertPeriod(period, dimension) {
        if (!["year", "quarter", "month"].includes(dimension) || !salesPeriodOptions().some(([value]) => value === period)) return null;
        const year = period.slice(0, 4);
        const month = salesPeriodDimension(period) === "year" ? Number(DEMO_TODAY.slice(5, 7)) :
          salesPeriodDimension(period) === "quarter" ? (Number(period.at(-1)) - 1) * 3 + 1 : Number(period.slice(5, 7));
        return dimension === "year" ? year : dimension === "quarter" ? `${year}-Q${Math.ceil(month / 3)}` : `${year}-${String(month).padStart(2, "0")}`;
      }

      function salesPeriodValueOptions(period) {
        const quarter = salesPeriodDimension(period) === "quarter";
        return Array.from({ length: quarter ? 4 : 12 }, (_, i) => {
          const value = quarter ? `Q${i + 1}` : String(i + 1).padStart(2, "0");
          return `<option value="${value}" ${period.slice(5) === value ? "selected" : ""}>${quarter ? `第${i + 1}季度` : `${i + 1}月`}</option>`;
        }).join("");
      }

      function salesPeriodFields(period, dimensionId, periodId) {
        const dimension = salesPeriodDimension(period), yearId = dimensionId.replace("Dimension", "Year");
        return filterField("时间维度", `<select class="input sales-time-dimension" id="${dimensionId}">${[["year", "年"], ["quarter", "季"], ["month", "月"]].map(([value, label]) => `<option value="${value}" ${dimension === value ? "selected" : ""}>${label}</option>`).join("")}</select>`) +
          filterField("年份", `<select class="input sales-time-year" id="${yearId}">${salesPeriodOptions("year").map(([value, label]) => `<option value="${value}" ${period.slice(0, 4) === value ? "selected" : ""}>${label}</option>`).join("")}</select>`) +
          `<div class="filter-field sales-time-unit" id="${periodId}Unit" ${dimension === "year" ? "hidden" : ""}><label for="${periodId}" id="${periodId}Label">${dimension === "quarter" ? "季度" : "月份"}</label><select class="input" id="${periodId}" ${dimension === "year" ? "disabled" : ""}>${salesPeriodValueOptions(period)}</select></div>`;
      }

      function salesPeriodFilter() {
        return `<div class="sales-period-controls">${salesPeriodFields(salesPeriodDraft, "salesPeriodDimension", "salesPeriodDraft")}<div class="sales-period-actions"><button class="btn btn-primary" id="applySalesPeriod" type="button">筛选</button><button class="btn" id="resetSalesPeriod" type="button">重置</button></div></div>`;
      }

      function salesStatisticsRegion(item) {
        return isEcosystemOpportunity(item) ? null : regionForCompany(salesOpportunityCustomer(item));
      }

      function salesOverviewCenters() {
        if (!salesWorkbenchAllowed()) return [];
        if (currentUser.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总")) return regionsData;
        const managed = salesIsRole("区域总监") ? salesManagedRegions() : [];
        const owned = salesIsRole("PM") ? salesWorkbenchOpportunities().filter(item => item.owner === currentUser.name) : [];
        return regionsData.filter(region => managed.includes(region) ||
          owned.some(item => salesStatisticsRegion(item)?.id === region.id) ||
          (salesIsRole("PM") && cityOwners.some(city => city.pm === currentUser.name && regionProvinceList(region).includes(city.province))));
      }

      function salesOverviewAnalysis() {
        if (!salesWorkbenchAllowed()) return null;
        const center = salesOverviewRegion ? salesOverviewCenters().find(region => String(region.id) === salesOverviewRegion) : null;
        if (salesOverviewRegion && !center) return null; // Never widen a stale or forged center selection.
        if (!["stage", "type"].includes(salesOverviewDimension) || !["count", "amount"].includes(salesOverviewMeasure)) return null;
        const byStage = salesOverviewDimension === "stage";
        if (salesOverviewFilter && !(byStage ? SALES_TYPES : SALES_STAGES).includes(salesOverviewFilter)) return null;
        const rows = salesWorkbenchOpportunities().filter(item =>
          (!center || salesStatisticsRegion(item)?.id === center.id) &&
          (!salesOverviewFilter || item[byStage ? "type" : "stage"] === salesOverviewFilter));
        if (rows.some(item => !SALES_STAGES.includes(item.stage) || !SALES_TYPES.includes(item.type))) return null;
        const money = salesOverviewMeasure === "amount";
        const total = money ? salesStatsSum(rows) : rows.length;
        if (total === null) return null;
        const groups = (byStage ? SALES_STAGES : SALES_TYPES).map(label => {
          const members = rows.filter(item => item[salesOverviewDimension] === label);
          const value = money ? salesStatsSum(members) : members.length;
          return { label, value, share: total ? value / total * 100 : null };
        });
        return { total, groups, count: rows.length, money, dimension: salesOverviewDimension };
      }

      function salesOverviewControls() {
        if (!salesWorkbenchAllowed()) return "";
        const select = (key, value, label, options) => `<label>${label}<select class="input" aria-label="${label}" data-sales-overview="${key}">${options.map(([id, name]) => `<option value="${escapeHtml(id)}" ${String(value) === String(id) ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label>`;
        const byStage = salesOverviewDimension === "stage";
        return '<div class="workbench-analysis-controls" id="salesOverviewControls">' +
          select("region", salesOverviewRegion, "运营中心", [["", "全部运营中心"], ...salesOverviewCenters().map(region => [String(region.id), region.name])]) +
          select("dimension", salesOverviewDimension, "分析方式", [["stage", "按商机阶段"], ["type", "按商机类型"]]) +
          select("filter", salesOverviewFilter, byStage ? "商机类型" : "商机阶段", [["", byStage ? "全部类型" : "全部阶段"], ...(byStage ? SALES_TYPES : SALES_STAGES).map(label => [label, label])]) +
          select("measure", salesOverviewMeasure, "统计指标", [["count", "商机数量"], ["amount", "商机金额（含税，万元）"]]) + '</div>';
      }

      function salesOverviewChart() {
        if (!salesWorkbenchAllowed()) return "";
        const analysis = salesOverviewAnalysis();
        if (!analysis) return '<div class="empty">商机数据暂不可用</div>';
        const colors = ["#7596b5", "#366895", "#68a6a0", "#457c68", "#c3ccd6", "#b69b89"];
        const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width: 220, height: 220 });
        let svg;
        try {
          chart.setOption({ animation: false, color: colors, series: [{
            type: "pie", radius: ["76%", "94%"], center: ["50%", "50%"], silent: true,
            selectedMode: false, stillShowZeroSum: false, label: { show: false }, labelLine: { show: false },
            emphasis: { disabled: true }, itemStyle: { borderRadius: 4, borderWidth: 3, borderColor: "#fff" },
            data: analysis.total ? analysis.groups.map((group, i) => ({ name: group.label, value: group.value, itemStyle: { color: colors[i] } })) : [],
            emptyCircleStyle: { color: "#edf1f5", borderWidth: 0 },
          }] });
          svg = chart.renderToSVGString();
        } finally { chart.dispose(); }
        const totalLabel = analysis.money ? "商机金额合计" : "商机总数";
        const valueLabel = analysis.money ? "金额（含税，万元）" : "数量（个）";
        const key = analysis.money ? "amount" : "count";
        const format = value => analysis.money ? salesStatsMoney(value) : String(value);
        const rows = analysis.groups.map((group, i) => `<li><span class="workbench-group-name"><i aria-hidden="true" style="background:${colors[i]}"></i>${escapeHtml(group.label)}</span><strong>${format(group.value)}</strong><span class="workbench-share">${group.share === null ? "—" : group.share.toFixed(1) + "%"}</span></li>`).join("");
        return `<div class="workbench-project-chart"><div class="workbench-donut"><div class="workbench-chart-svg" aria-hidden="true">${svg}</div><div class="workbench-donut-center${analysis.money ? " workbench-money" : ""}"><span>${totalLabel}${salesStatisticsHelp(key, totalLabel)}</span><strong data-sales-overview-total>${format(analysis.total)}</strong><small>${analysis.money ? "含税，万元" : "个"}</small>${analysis.count ? "" : "<small>暂无商机</small>"}</div></div><div class="workbench-project-detail sales-overview-detail" tabindex="0" role="region" aria-label="商机分组明细"><div class="workbench-legend-head"><span>${analysis.dimension === "stage" ? "商机阶段" : "商机类型"}</span><span>${valueLabel}${salesStatisticsHelp(key, valueLabel)}</span><span>占比${salesStatisticsHelp(key + "Share", "占比")}</span></div><ul class="workbench-stage-legend">${rows}</ul></div></div>`;
      }

      function handleSalesOverviewChange(target) {
        if (currentPage !== "dashboard" || !salesWorkbenchAllowed()) return;
        const key = target.dataset.salesOverview;
        const value = target.value;
        if (key === "region" && (value === "" || salesOverviewCenters().some(region => String(region.id) === value))) salesOverviewRegion = value;
        else if (key === "dimension" && ["stage", "type"].includes(value)) {
          salesOverviewDimension = value;
          salesOverviewFilter = "";
        } else if (key === "filter" && ["", ...(salesOverviewDimension === "stage" ? SALES_TYPES : SALES_STAGES)].includes(value)) salesOverviewFilter = value;
        else if (key === "measure" && ["count", "amount"].includes(value)) salesOverviewMeasure = value;
        else return;
        const controls = document.querySelector("#salesOverviewControls");
        if (controls) controls.outerHTML = salesOverviewControls();
        const chart = document.querySelector("#salesOverviewVisualization");
        if (chart) chart.innerHTML = salesOverviewChart();
        document.querySelector(`[data-sales-overview="${key}"]`)?.focus?.({ preventScroll: true });
      }
      document.addEventListener("change", event => {
        if (event.target?.matches?.("[data-sales-overview]")) handleSalesOverviewChange(event.target);
      });

      function salesIsPresidentView() {
        return salesIsRole("总裁") && !currentUser?.fullAccess;
      }

      function salesWorkbenchRole() {
        if (currentUser?.fullAccess) return "admin";
        return [["总裁", "president"], ["市场副总", "vp"], ["区域总监", "director"], ["PM", "pm"]]
          .find(([name]) => salesIsRole(name))?.[1] || "";
      }

      function salesWorkbenchStaffRows() {
        if (!salesWorkbenchAllowed() || salesWorkbenchRole() !== "director") return [];
        const period = salesPeriodApplied;
        const year = salesTargetYears.find(item => item.year === period.slice(0, 4));
        const months = salesPeriodMonths(period);
        const events = salesPerformanceRows().filter(item => months.includes(item.selectedDate?.slice(0, 7)));
        const managed = salesManagedRegions();
        return (year?.regions || []).filter(region => managed.some(center => regionsMatch(region.name, regionScopeName(center)))).flatMap(region => {
          const center = managed.find(item => regionsMatch(region.name, regionScopeName(item)));
          const people = region.salespeople;
          return people.filter((person, i) => person.code && people.findIndex(other => other.code === person.code) === i).map(person => {
            const completed = salesSumMoney(events.filter(item =>
              (item.performanceOwnerCode || employees.find(employee => employee.name === item.owner)?.code) === person.code &&
              regionsMatch(item.performanceRegion || item.region, region.name)), item => item.expectedContractAmount);
            const target = salesPersonalTargetValue(period, { ...year, regions: [region] }, salesTargetMonths, person.code);
            return { region: center.name, name: person.name, code: person.code, ...salesGoalMetrics(target, completed) };
          });
        });
      }

      function salesWorkbenchPersonalSection() {
        if (!salesWorkbenchAllowed() || salesWorkbenchRole() !== "director") return "";
        const months = salesPeriodMonths();
        const events = salesPerformanceRows(opportunities, true).filter(item => months.includes(item.selectedDate?.slice(0, 7)));
        const goal = salesGoalMetrics(salesPersonalTargetValue(salesPeriodApplied), salesSumMoney(events, item => item.expectedContractAmount));
        const rows = salesWorkbenchStaffRows();
        return `<div class="sales-workbench-personal"><div class="panel-head"><div class="panel-title">我的业绩</div></div><div class="metrics sales-metrics">${salesGoalMetricCards(goal).join("")}</div><div class="panel-head"><div class="panel-title">个人目标完成</div></div><div class="table-wrap sales-staff-table" tabindex="0" role="region" aria-label="个人目标完成"><table><thead><tr><th>运营中心</th><th>员工</th><th>成交金额目标（含税，万元）${salesStatisticsHelp("staffTarget", "成交金额目标")}</th><th>周期成交金额（含税，万元）${salesStatisticsHelp("staffCompleted", "周期成交金额")}</th><th>差额（含税，万元）${salesStatisticsHelp("difference", "差额")}</th><th>完成率${salesStatisticsHelp("rate", "完成率")}</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.region)}</td><td>${escapeHtml(row.name)}<div class="cell-sub">${escapeHtml(row.code)}</div></td><td>${row.target === null ? "未分配" : salesStatsMoney(row.target)}</td><td>${salesStatsMoney(row.completed)}</td><td>${row.difference === null ? "—" : `${row.difference > 0 ? "+" : ""}${salesStatsMoney(row.difference)}`}</td><td>${row.rate}</td></tr>`).join("") || '<tr><td colspan="6"><div class="empty">暂无个人目标数据</div></td></tr>'}</tbody></table></div></div>`;
      }

      function salesPresidentMetrics(rows, months) {
        const pipeline = rows.filter(item => ["商机录入", "需求确认", "方案支撑", "比选"].includes(item.stage));
        const won = salesPerformanceRows(rows).filter(item => months.includes(item.selectedDate?.slice(0, 7)));
        return {
          pipelineCount: pipeline.length,
          pipelineAmount: salesStatsSum(pipeline, item => item.estimateAmount),
          wonCount: won.length,
          wonAmount: salesSumMoney(won, item => item.expectedContractAmount),
        };
      }

      function salesTrendData(rows = salesWorkbenchOpportunities(), events = salesPerformanceRows()) {
        if (!salesWorkbenchAllowed()) return [];
        const keys = /^\d{4}-\d{2}$/.test(salesPeriodApplied)
          ? Array.from({ length: new Date(Number(salesPeriodApplied.slice(0, 4)), Number(salesPeriodApplied.slice(5, 7)), 0).getDate() }, (_, i) => `${salesPeriodApplied}-${String(i + 1).padStart(2, "0")}`)
          : salesPeriodMonths();
        return keys.map(period => {
          const created = rows.filter(item => item.createdDate.startsWith(period));
          const won = events.filter(item => item.selectedDate?.startsWith(period));
          return { period,
            created: salesTrendMode === "amount" ? salesStatsSum(created, item => item.estimateAmount) : created.length,
            selected: salesTrendMode === "amount" ? salesSumMoney(won, item => item.expectedContractAmount) : won.length,
          };
        });
      }

      function salesTrendChart(data) {
        if (!salesWorkbenchAllowed()) return "";
        const money = salesTrendMode === "amount";
        const unit = money ? "金额（含税，万元）" : "数量（个）";
        const width = 960, height = 280, left = money ? 120 : 58, right = 28;
        const values = data.flatMap(item => [item.created, item.selected]).filter(value => value !== null);
        const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width, height });
        let svg;
        try {
          chart.setOption({ animation: false, color: ["#366895", "#68a6a0"],
            grid: { left, right, top: 32, bottom: 38 },
            xAxis: { type: "category", boundaryGap: false, data: data.map(item => item.period),
              axisLine: { lineStyle: { color: "#dce3eb" } }, axisTick: { show: false },
              axisLabel: { color: "#687787", fontSize: 12, hideOverlap: true,
                formatter: value => value.length === 10 ? value.slice(5) : value } },
            yAxis: { type: "value", name: unit, min: 0, max: values.some(value => value > 0) ? undefined : 1,
              minInterval: money ? undefined : 1, splitNumber: 4,
              nameTextStyle: { color: "#687787", align: "left", fontSize: 12 },
              axisLabel: { color: "#687787", fontSize: 11, formatter: value => money ? salesStatsMoney(value) : String(value) },
              splitLine: { lineStyle: { color: "#edf1f5" } } },
            series: [
              { name: "新建商机", data: data.map(item => item.created), symbol: "circle" },
              { name: "中选结果", data: data.map(item => item.selected), symbol: "diamond", lineStyle: { type: "dashed", width: 2 } },
            ].map(series => ({ type: "line", smooth: false, connectNulls: false, showSymbol: true,
              symbolSize: 6, lineStyle: { width: 2 }, silent: true, emphasis: { disabled: true }, ...series })),
          });
          svg = chart.renderToSVGString();
        } finally { chart.dispose(); }
        // Native SVG titles expose exact values without adding business actions or a second visible table.
        const step = (width - left - right) / Math.max(1, data.length - 1);
        const format = value => value === null ? "不可用" : money ? `${salesStatsMoney(value)} 万元` : `${value} 个`;
        const points = data.map((item, i) => {
          const x = left + i * step;
          const label = `${item.period}；新建商机：${format(item.created)}；中选结果：${format(item.selected)}`;
          return `<rect data-sales-trend-point="${item.period}" x="${Math.max(left, x - step / 2)}" y="24" width="${i === 0 || i === data.length - 1 ? step / 2 : step}" height="224" fill="transparent" tabindex="0" role="img" aria-label="${escapeHtml(label)}"><title>${escapeHtml(label)}</title></rect>`;
        }).join("");
        svg = svg.replace("</svg>", points + "</svg>");
        const unavailable = data.some(item => item.created === null || item.selected === null);
        return `<div class="sales-trend-legend"><span><i class="sales-trend-created"></i>新建商机${salesStatisticsHelp("trendCreated", "新建商机")}</span><span><i class="sales-trend-selected"></i>中选结果${salesStatisticsHelp("trendSelected", "中选结果")}</span>${unavailable ? '<span class="sales-trend-unavailable">部分金额不可用</span>' : ""}</div><div class="sales-trend-chart" role="region" aria-label="商机趋势折线图，${unit}" tabindex="0">${svg}</div>`;
      }

      let salesRegionPeriodDraft = DEMO_TODAY.slice(0, 7);
      let salesRegionPeriodApplied = DEMO_TODAY.slice(0, 7);
      let salesRegionCenterDraft = "";
      let salesRegionCenterApplied = "";

      function resetSalesRegionTargets() {
        salesRegionPeriodDraft = salesRegionPeriodApplied = DEMO_TODAY.slice(0, 7);
        salesRegionCenterDraft = salesRegionCenterApplied = "";
      }

      function salesRegionTargetsAllowed() {
        return salesWorkbenchAllowed() && ["president", "vp", "director"].includes(salesWorkbenchRole());
      }

      function salesRegionGoalCenters() {
        if (!salesRegionTargetsAllowed()) return [];
        return salesWorkbenchRole() === "director" ? salesManagedRegions() : salesOverviewCenters();
      }

      function salesRegionGoalRows() {
        if (!salesRegionTargetsAllowed()) return [];
        const centers = salesRegionGoalCenters();
        if (salesRegionCenterApplied && !centers.some(center => String(center.id) === salesRegionCenterApplied)) return [];
        const months = salesPeriodMonths(salesRegionPeriodApplied);
        const rows = salesWorkbenchOpportunities();
        return centers.filter(center => !salesRegionCenterApplied || String(center.id) === salesRegionCenterApplied).map(center => {
          const target = salesTargetRegionValue(regionScopeName(center), salesRegionPeriodApplied);
          const events = salesPerformanceRows().filter(item => !isEcosystemOpportunity(item) && regionsMatch(item.performanceRegion || item.region,regionScopeName(center)) && months.includes(item.selectedDate?.slice(0, 7)));
          return { id: center.id, name: center.name, ...salesGoalMetrics(target, salesSumMoney(events, item => item.expectedContractAmount)) };
        });
      }

      function salesRegionGoalTable() {
        if (!salesRegionTargetsAllowed()) return "";
        return `<table><thead><tr><th>运营中心</th><th>成交金额目标（含税，万元）${salesStatisticsHelp("regionTarget", "成交金额目标")}</th><th>成交金额（含税，万元）${salesStatisticsHelp("regionCompleted", "成交金额")}</th><th>差额（含税，万元）${salesStatisticsHelp("regionDifference", "差额")}</th><th>完成率${salesStatisticsHelp("regionRate", "完成率")}</th></tr></thead><tbody>${salesRegionGoalRows().map(row => `<tr><td>${escapeHtml(row.name)}</td><td>${row.target === null ? "未分配" : salesStatsMoney(row.target)}</td><td>${salesStatsMoney(row.completed)}</td><td>${row.difference === null ? "—" : `${row.difference > 0 ? "+" : ""}${salesStatsMoney(row.difference)}`}</td><td>${row.rate}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">暂无数据</div></td></tr>'}</tbody></table>`;
      }

      function salesRegionGoalCard() {
        if (!salesRegionTargetsAllowed()) return "";
        return `<section class="panel sales-region-panel sales-region-goal-panel"><div class="panel-head"><div class="panel-title">区域完成目标对比</div></div><div class="sales-region-goal-controls">${salesPeriodFields(salesRegionPeriodDraft, "salesRegionDimension", "salesRegionPeriod")}${filterField("运营中心", `<select class="input" id="salesRegionCenter"><option value="">全部运营中心</option>${salesRegionGoalCenters().map(center => `<option value="${center.id}" ${String(center.id) === salesRegionCenterDraft ? "selected" : ""}>${escapeHtml(center.name)}</option>`).join("")}</select>`)}<div class="sales-region-goal-actions"><button class="btn btn-primary" type="button" id="applySalesRegionGoal">筛选</button><button class="btn" type="button" id="resetSalesRegionGoal">重置</button></div></div><div class="table-wrap" id="salesRegionGoalTable" tabindex="0" role="region" aria-label="区域完成目标对比">${salesRegionGoalTable()}</div></section>`;
      }

      function renderWorkbenchSales() {
        if (!salesWorkbenchAllowed()) return "";
        const rows = salesWorkbenchOpportunities();
        const periodMonths = salesPeriodMonths();
        const periodRows = rows.filter(item => periodMonths.includes(item.createdDate.slice(0, 7)));
        const scopeTarget = salesWorkbenchRole() === "pm" ? salesPersonalTargetValue(salesPeriodApplied) : salesTargetScopePeriod();
        const won = salesPerformanceRows().filter(item => periodMonths.includes(item.selectedDate?.slice(0, 7)));
        const goal = salesGoalMetrics(scopeTarget, salesSumMoney(won, item => item.expectedContractAmount));
        const active = rows.filter(item => item.stage !== "落选");
        const selected = rows.filter(item => item.stage === "中选");
        const lost = rows.filter(item => item.stage === "落选");
        const results = selected.length + lost.length;
        const metrics = [
          ...salesGoalMetricCards(goal),
          salesDashboardMetric("当前活跃商机", active.length, "active"),
          salesDashboardMetric("当前活跃金额（含税，万元）", salesStatsMoney(salesStatsSum(active)), "activeAmount"),
          salesDashboardMetric("当前中选结果", selected.length, "selected"),
          salesDashboardMetric("当前中选率", (results ? Math.round(selected.length / results * 100) : 0) + "%", "selectedRate"),
        ];
        const regionRows = [...new Set(rows.filter(item => !isEcosystemOpportunity(item)).map(item => salesStatisticsRegion(item)?.id ?? "待配置区域"))].map(id => {
          const region = regionsData.find(item => item.id === id);
          const name = region?.name || String(id);
          const members = rows.filter(item => !isEcosystemOpportunity(item) && (salesStatisticsRegion(item)?.id ?? "待配置区域") === id);
          const activeRows = members.filter(item => item.stage !== "落选");
          return `<tr><td>${escapeHtml(name)}</td><td>${activeRows.length}</td><td>${salesStatsMoney(salesStatsSum(activeRows))}</td><td>${members.filter(item => item.stage === "中选").length}</td></tr>`;
        }).join("");
        const money = salesTrendMode === "amount";
        const trendData = salesTrendData(rows);
        const role = salesWorkbenchRole();
        const president = role === "president";
        const summary = president ? salesPresidentMetrics(rows, periodMonths) : null;
        const currentMetrics = president ? [
          salesDashboardMetric("当前推进中商机", summary.pipelineCount, "pipeline"),
          salesDashboardMetric("当前推进中金额（含税，万元）", salesStatsMoney(summary.pipelineAmount), "pipelineAmount"),
        ] : metrics.slice(4);
        const periodMetrics = metrics.slice(0, 4);
        const appliedPeriodLabel = salesPeriodOptions().find(([value]) => value === salesPeriodApplied)?.[1] || salesPeriodApplied;
        const trend = `<div class="sales-trend-panel"><div class="panel-head"><div class="panel-title" id="salesTrendTitle">商机趋势</div><div class="spacer"></div><div class="sales-trend-mode"><span>类别</span><div class="tabs assignment-view-switch"><button class="tab ${!money ? "active" : ""}" aria-pressed="${!money}" type="button" data-sales-trend="count">数量</button><button class="tab ${money ? "active" : ""}" aria-pressed="${money}" type="button" data-sales-trend="amount">金额</button></div></div></div>${salesTrendChart(trendData)}</div>`;
        const currentCard = `<section class="panel sales-snapshot-panel" aria-labelledby="salesSnapshotTitle"><div class="panel-head"><div class="panel-title" id="salesSnapshotTitle">${president ? "当前商机推进" : "当前销售快照"}</div></div><div class="metrics sales-metrics${president ? " sales-primary-metrics" : ""}">${currentMetrics.join("")}</div></section>`;
        const periodCard = `<section class="panel sales-period-panel" aria-labelledby="salesPeriodTitle"><div class="panel-head sales-period-head"><div class="sales-period-heading"><div class="panel-title" id="salesPeriodTitle">${role === "director" ? "区域周期销售" : role === "pm" ? "我的周期销售" : "周期销售"}</div><div class="panel-sub">${escapeHtml(appliedPeriodLabel)}</div></div>${salesPeriodFilter()}</div><div class="metrics sales-metrics sales-primary-metrics">${periodMetrics.join("")}</div>${trend}${president ? `<div class="metrics sales-metrics sales-secondary-metrics sales-primary-metrics">${salesDashboardMetric("周期新建商机", periodRows.length, "created")}${salesDashboardMetric("周期中选商机", won.length, "periodWon")}</div>` : ""}${salesWorkbenchPersonalSection()}</section>`;
        return `<section class="sales-workbench" aria-label="销售概况">${president ? currentCard + periodCard : periodCard + currentCard}` +
          `<div class="sales-dashboard-grid"><section class="panel sales-overview-panel"><div class="panel-head"><div class="panel-title">商机概况${salesStatisticsHelp("overviewScope", "商机概况")}</div></div><div class="sales-overview-body">${salesOverviewControls()}<div id="salesOverviewVisualization">${salesOverviewChart()}</div></div></section>` +
          (salesRegionTargetsAllowed() ? salesRegionGoalCard() : role === "pm" ? "" : `<section class="panel sales-region-panel"><div class="panel-head"><div class="panel-title">当前区域对比</div></div><div class="table-wrap" tabindex="0" role="region" aria-label="当前区域对比"><table><thead><tr><th>运营中心</th><th>活跃商机${salesStatisticsHelp("regionActive", "活跃商机")}</th><th>活跃金额（含税，万元）${salesStatisticsHelp("regionAmount", "活跃金额")}</th><th>中选结果${salesStatisticsHelp("regionSelected", "中选结果")}</th></tr></thead><tbody>${regionRows || '<tr><td colspan="4"><div class="empty">暂无数据</div></td></tr>'}</tbody></table></div></section>` ) + "</div></section>";
      }

      let salesTargetSelectedRegion = "";
      let salesTargetSelectionUser = null;

      function salesTargetToday() { return salesSupportNow().slice(0,10); }
      const salesTargetAdjustments = new Map();
      let salesTargetPersonalContext = false;
      let salesTargetPersonalActor = null;
      function salesTargetPending() { return salesTargetAdjustments.get(salesTargetMonth.slice(0,4)); }
      function salesTargetEditingYear() { return salesTargetPending()?.candidate.year || salesTargetYear(); }
      function salesTargetEditingMonths() { return salesTargetPending()?.candidate.months || salesTargetMonths; }
      function salesPersonalTargetValue(period, year = salesTargetYears.find(item=>item.year === period.slice(0,4)), months = salesTargetMonths, code = salesTargetEmployeeCode()) {
        const people=year?.regions.flatMap(region=>region.salespeople.filter(person=>person.code===code)) || [];
        if (!people.length) return null;
        if (/^\d{4}$/.test(period)) return salesSumMoney(people,person=>salesSumMoney(person.quarters,value=>value));
        if (/^\d{4}-Q[1-4]$/.test(period)) return salesSumMoney(people,person=>person.quarters[Number(period.at(-1))-1]);
        const row=months.find(item=>item.month===period);
        const values=year.regions.filter(region=>region.salespeople.some(person=>person.code===code)).map(region=>row?.regions.find(item=>item.name===region.name)?.salespeople.find(person=>person.code===code)?.target);
        return salesSumMoney(values,value=>value);
      }
      function salesTargetPendingNotice() {
        const pending=salesTargetPending();
        if (!pending) return "";
        const root=salesCanAdjustTarget("company","");
        const company=currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总");
        return `<div class="role-note">调整尚未完成，统计仍使用原目标。${company ? `<div>原有效目标：${salesTargetAmount(pending.base.year.companyTarget)} 万元；调整后目标：${salesTargetAmount(pending.candidate.year.companyTarget)} 万元；差额：${salesTargetWanMoney(pending.candidate.year.companyTarget-pending.base.year.companyTarget)} 万元</div>` : ""}${root ? '<button class="btn btn-primary" data-sales-target-finish>完成调整</button> <button class="btn" data-sales-target-cancel>取消本轮调整</button>' : ""}</div>`;
      }

      function salesTargetYear() {
        return salesTargetYears.find(item => item.year === salesTargetMonth.slice(0, 4));
      }
      function salesTargetQuarter() { return Math.ceil(Number(salesTargetMonth.slice(5, 7)) / 3); }
      function salesTargetQuarterPeriod() { return `${salesTargetMonth.slice(0, 4)}-Q${salesTargetQuarter()}`; }
      function salesTargetEmployeeCode() {
        return currentUser?.employeeCode;
      }
      function salesTargetMonthRegion(month, name, months = salesTargetMonths) {
        return months.find(item => item.month === month)?.regions.find(item => item.name === name);
      }
      function salesTargetRegionValue(name, period) {
        const region = salesTargetYears.find(item => item.year === period.slice(0, 4))?.regions.find(item => regionsMatch(item.name, name));
        if (/^\d{4}$/.test(period)) return region?.target ?? null;
        if (/^\d{4}-Q[1-4]$/.test(period)) return region?.quarters[Number(period.at(-1)) - 1] ?? null;
        return salesTargetMonths.find(item => item.month === period)?.regions.find(item => regionsMatch(item.name, name))?.target ?? null;
      }
      function salesTargetScopePeriod(period = salesPeriodApplied) {
        const year = salesTargetYears.find(item => item.year === period.slice(0, 4));
        if (!year) return null;
        if (currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总")) {
          if (/^\d{4}$/.test(period)) return year?.companyTarget ?? null;
          return year.regions.length ? salesSumMoney(year.regions, item => salesTargetRegionValue(item.name, period)) : null;
        }
        if (salesIsRole("区域总监")) {
          const managed = salesManagedRegions();
          return managed.length ? salesSumMoney(managed, item => salesTargetRegionValue(regionScopeName(item), period)) : null;
        }
        if (salesIsRole("PM")) {
          const code = salesTargetEmployeeCode();
          const person = year?.regions.flatMap(item => item.salespeople).find(item => item.code === code);
          if (/^\d{4}$/.test(period)) return person ? salesSumMoney(person.quarters, value => value) : null;
          if (/^\d{4}-Q[1-4]$/.test(period)) return person?.quarters[Number(period.at(-1)) - 1] ?? null;
          return salesTargetMonths.find(item => item.month === period)?.regions.flatMap(item => item.salespeople).find(item => item.code === code)?.target ?? null;
        }
        return null;
      }
      function salesTargetVisibleRegions(target = salesTargetYear()) {
        if (!target) return [];
        if (currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总")) return target.regions;
        if (!salesIsRole("区域总监")) return [];
        return target.regions.filter(region => salesManagedRegions().some(item => regionsMatch(regionScopeName(item), region.name)));
      }
      function salesTargetCanSeePm(region) {
        return Boolean(currentUser?.fullAccess || salesIsRole("总裁") ||
          (salesIsRole("区域总监") && salesManagedRegions().some(item => regionsMatch(regionScopeName(item), region.name))));
      }
      function salesTargetCurrentRegion(target = salesTargetYear()) {
        const regions = salesTargetVisibleRegions(target);
        if (salesTargetSelectionUser !== currentUser) {
          salesTargetSelectedRegion = "";
          salesTargetSelectionUser = currentUser;
        }
        if (!regions.some(region => region.name === salesTargetSelectedRegion)) salesTargetSelectedRegion = regions[0]?.name || "";
        return regions.find(region => region.name === salesTargetSelectedRegion);
      }
      function salesTargetHistoryIsVisible(item) {
        if (currentUser?.fullAccess || salesIsRole("总裁")) return true;
        if (salesIsRole("市场副总")) return ["公司", "区域"].includes(item.level);
        if (salesIsRole("区域总监")) return salesManagedRegions().some(region => {
          const name = regionScopeName(region);
          return item.level === "区域" ? regionsMatch(name, item.object) : item.level === "PM" && item.object.startsWith(`${name} / `);
        });
        if (salesIsRole("PM") && item.level === "PM") return item.employeeCode
          ? item.employeeCode === salesTargetEmployeeCode() : item.object.split(" / ")[1] === currentUser.name;
        return false;
      }
      function salesTargetWanMoney(value) { return formatWanMoney(value); }
      function salesTargetWanInput(value) { return wanMoneyInput(value); }
      function salesTargetParseWan(text) { return parseWanMoney(text); }
      function salesTargetHistoryTable() {
        const personal = salesTargetPersonalContext || salesIsRole("PM") && !(currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("区域总监") || salesIsRole("市场副总"));
        const key = personal ? "m12-personal-target-history" : "m12-sales-target-history";
        const rows = salesTargetHistory.filter(item => (item.period || item.month || "").slice(0, 4) === salesTargetMonth.slice(0, 4) && (personal ? (item.employeeCode ? item.employeeCode === salesTargetEmployeeCode() : item.level === "PM" && item.object.split(" / ")[1] === currentUser.name) : salesTargetHistoryIsVisible(item)))
          .map(item => `<tr data-page-row><td>${escapeHtml(item.period || item.month)}</td>${personal ? "" : `<td>${item.level === "区域" ? "运营中心" : escapeHtml(item.level)}</td><td>${escapeHtml(item.object)}</td>`}<td>${typeof item.before === "number" ? salesTargetWanMoney(item.before) : escapeHtml(item.before ?? "未分配")}</td><td>${typeof item.after === "number" ? salesTargetWanMoney(item.after) : escapeHtml(item.after ?? "未分配")}</td><td>${escapeHtml(item.reason || "—")}</td><td>${escapeHtml(item.operator)}</td>${personal ? "" : `<td>${escapeHtml(item.effectiveMode)}</td>`}<td>${escapeHtml(item.effectiveAt)}</td></tr>`).join("");
        return `<div class="table-wrap"><table class="sales-target-history-table" data-paged-table="${key}"><thead><tr><th>目标周期</th>${personal ? "" : "<th>层级</th><th>对象</th>"}<th>调整前目标（含税，万元）</th><th>调整后目标（含税，万元）</th><th>原因</th><th>操作人</th>${personal ? "" : "<th>生效方式</th>"}<th>生效时间</th></tr></thead><tbody>${rows || `<tr data-empty-row><td colspan="${personal ? 6 : 9}"><div class="empty">暂无调整记录</div></td></tr>`}</tbody></table></div>${tablePagination(key)}`;
      }
      function salesTargetAction(level, object, label = "分配") {
        return salesCanAdjustTarget(level, object) ? `<button class="link" type="button" data-sales-target-edit="${level}" data-sales-target-object="${escapeHtml(object)}">${label}</button>` : "";
      }
      function salesTargetPersonalAction(level, name, label) {
        if (salesCanAdjustTarget(level,name)) return salesTargetAction(level,name,label);
        if (!salesCanAdjustTarget(level,name,false)) return "";
        const region = salesTargetEditingYear().regions.find(item => item.name === name);
        const months = salesPeriodMonths(salesTargetQuarterPeriod());
        const reason = months.at(-1) < salesTargetToday().slice(0,7) ? "历史季度不能分配" : region.quarters[salesTargetQuarter()-1] == null ? "请先分配区域季度目标" : months.some(month => salesTargetMonthRegion(month,name,salesTargetEditingMonths())?.target == null) ? "请先分配区域月度目标" : !region.salespeople.length ? "暂无可分配个人" : "请先分配个人季度目标";
        return `<button class="link" type="button" disabled title="${reason}">${label}</button>`;
      }
      function salesTargetAmount(value) { return value == null ? "未分配" : salesTargetWanMoney(value); }
      function salesTargetMonthCard(month, value) {
        return `<button type="button" data-sales-target-month="${month}" aria-pressed="${month === salesTargetMonth}" class="sales-target-period-cell ${month === salesTargetMonth ? "selected" : ""}"><span>${Number(month.slice(5))}月</span><strong>${salesTargetAmount(value)}</strong></button>`;
      }
      function salesTargetPeriodControls() {
        return `<section class="panel sales-filter-panel"><div class="toolbar filter-toolbar sales-period-toolbar">${filterField("目标年度", `<select class="input" id="salesTargetYear">${salesTargetYears.map(item => `<option value="${item.year}" ${item.year === salesTargetMonth.slice(0,4) ? "selected" : ""}>${item.year}年</option>`).join("")}</select>`)}${filterField("季度", `<select class="input" id="salesTargetQuarter">${[1,2,3,4].map(q => `<option value="${q}" ${q === salesTargetQuarter() ? "selected" : ""}>第${q}季度</option>`).join("")}</select>`)}</div></section>`;
      }
      function salesTargetRegionAllocated(region, year) {
        const assigned = value => value != null && salesMoneyCents(value) != null;
        if (!region || !assigned(region.target) || region.quarters.length !== 4 || !region.quarters.every(assigned)) return false;
        if (region.salespeople.some(person => person.quarters.length !== 4 || !person.quarters.every(assigned))) return false;
        return Array.from({length:12},(_,index) => `${year}-${String(index+1).padStart(2,"0")}`).every(month => {
          const target = salesTargetMonthRegion(month,region.name);
          return target && assigned(target.target) && region.salespeople.every(person => assigned(target.salespeople.find(item => item.code === person.code)?.target));
        });
      }
      function renderSalesTargets() {
        if (salesTargetPersonalActor !== currentUser) {salesTargetPersonalActor=currentUser;salesTargetPersonalContext=false;}
        if (salesIsRole("PM") && !(currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总") || salesIsRole("区域总监"))) return renderPersonalSalesTargets();
        if (salesTargetPersonalContext && salesIsRole("区域总监")) return renderPersonalSalesTargets();
        const target = salesTargetEditingYear(), region = salesTargetCurrentRegion(target);
        const q = salesTargetQuarter() - 1, months = salesPeriodMonths(salesTargetQuarterPeriod());
        const showPm = region && salesTargetCanSeePm(region);
        const company = currentUser?.fullAccess || salesIsRole("总裁") || salesIsRole("市场副总")
          ? `<div class="sales-target-company-summary"><div><span>公司年度目标 · ${target.year}年</span><strong>${salesTargetAmount(target.companyTarget)}</strong><span>成交金额目标（含税，万元）</span></div><div>${salesTargetAction("company", "英嘉科技", "设置年度目标")}${salesTargetAction("region-year", "", "分配区域年度")}</div></div>` : "";
        const navigation = salesTargetVisibleRegions(target).map(item => {
          const allocated = salesTargetRegionAllocated(salesTargetYear().regions.find(region=>region.name===item.name),target.year);
          return `<button class="sales-target-region" type="button" data-sales-target-region="${escapeHtml(item.name)}" aria-pressed="${item.name === region?.name}"><span class="sales-target-region-heading"><span>${escapeHtml(item.name)}</span><span class="tag ${allocated ? "green" : "orange"} sales-target-region-status">${allocated ? "已分配" : "待分配"}</span></span><span class="sales-target-region-amount">${salesTargetAmount(item.target)}</span></button>`;
        }).join("");
        const quarters = region ? `<div class="sales-target-section-head"><strong>区域季度目标</strong>${salesTargetAction("region-quarter", region.name, "拆分4个季度")}</div><div class="sales-target-quarter-grid">${region.quarters.map((value,index) => `<button type="button" data-sales-target-quarter="${index+1}" aria-pressed="${index === q}" class="sales-target-period-cell ${index === q ? "selected" : ""}"><span>第${index+1}季度</span><strong>${salesTargetAmount(value)}</strong></button>`).join("")}</div>` : "";
        const monthTargets = region ? `<div class="sales-target-section-head"><strong>第${q+1}季度 · 区域月度目标</strong>${salesTargetAction("region-month", region.name, "拆分到月份")}</div><div class="sales-target-month-grid">${months.map(month => salesTargetMonthCard(month,salesTargetMonthRegion(month,region.name,salesTargetEditingMonths())?.target)).join("")}</div>` : "";
        const people = showPm ? `<div class="sales-target-section-head"><strong>个人目标 · 第${q+1}季度</strong><div>${salesTargetPersonalAction("person-quarter",region.name,"分配个人季度")}${salesTargetPersonalAction("coordinate-month",region.name,"分配个人月度")}</div></div><div class="table-wrap sales-target-pm-scroll"><table><thead><tr><th>人员</th><th>第${q+1}季度目标</th>${months.map(month => `<th class="${month === salesTargetMonth ? "sales-target-selected-month" : ""}">${Number(month.slice(5))}月目标</th>`).join("")}</tr></thead><tbody>${region.salespeople.map(person => `<tr class="sales-target-person"><td>${escapeHtml(person.name)}</td><td>${salesTargetAmount(person.quarters[q])}</td>${months.map(month => `<td class="${month === salesTargetMonth ? "sales-target-selected-month" : ""}">${salesTargetAmount(salesTargetMonthRegion(month,region.name,salesTargetEditingMonths())?.salespeople.find(item => item.code === person.code)?.target)}</td>`).join("")}</tr>`).join("") || '<tr><td colspan="5"><div class="empty">暂无数据</div></td></tr>'}</tbody></table></div>` : "";
        return pageHead("销售指标", "按年度逐级分配成交金额目标。", `<button class="btn" type="button" data-sales-target-history>调整记录</button>${salesIsRole("区域总监") ? '<button class="btn" data-sales-personal-targets>我的销售指标</button>' : ""}`) + salesTargetPeriodControls() + salesTargetPendingNotice() +
          `<section class="panel sales-target-allocation"><div class="panel-head"><div class="panel-title">目标分配</div><span class="panel-sub">成交金额目标（含税，万元）</span></div>${company}<div class="sales-target-columns"><nav class="sales-target-navigation" aria-label="运营中心年度目标"><div class="sales-target-navigation-head">运营中心<span>${target.year}年目标</span></div><div class="sales-target-region-list">${navigation || '<div class="empty">暂无数据</div>'}</div></nav><div class="sales-target-detail"><div class="sales-target-detail-head"><div class="panel-title">${escapeHtml(region?.name || "运营中心目标")}</div></div>${quarters}${monthTargets}${people}${region ? "" : '<div class="empty">暂无数据</div>'}</div></div></section>`;
      }
      function renderPersonalSalesTargets() {
        const region = salesTargetEditingYear()?.regions.find(item => item.salespeople.some(person => person.code === salesTargetEmployeeCode()));
        const person = region?.salespeople.find(item => item.code === salesTargetEmployeeCode());
        const months = salesPeriodMonths(salesTargetQuarterPeriod());
        const won = salesPerformanceRows(opportunities,true).filter(item => (item.performanceOwnerCode || employees.find(person => person.name === item.owner)?.code) === currentUser.employeeCode && item.selectedDate?.startsWith(salesTargetMonth));
        const goal = salesGoalMetrics(salesPersonalTargetValue(salesTargetMonth), salesSumMoney(won, item => item.expectedContractAmount));
        return pageHead("我的销售指标", "查看本人的销售目标与完成情况。", salesIsRole("区域总监") ? '<button class="btn" data-sales-management-targets>目标分配</button>' : canAccessPage("dashboard") ? '<button class="btn" data-sales-page="dashboard">返回工作台</button>' : "") + salesTargetPeriodControls() + salesTargetPendingNotice() +
          `<section class="panel"><div class="panel-head"><div class="panel-title">${salesTargetQuarterPeriod()} · 本人季度目标</div><div class="spacer"></div></div><div class="sales-target-personal-quarter"><strong>${salesTargetAmount(salesPersonalTargetValue(salesTargetQuarterPeriod(),salesTargetEditingYear(),salesTargetEditingMonths()))}</strong><span>成交金额目标（含税，万元）</span></div><div class="sales-target-month-grid">${months.map(month => salesTargetMonthCard(month,salesPersonalTargetValue(month,salesTargetEditingYear(),salesTargetEditingMonths()))).join("")}</div></section>` +
          `<section class="panel sales-filter-panel"><div class="toolbar">${filterField("业绩月份", `<select class="input" id="salesTargetMonth">${months.map(month => `<option value="${month}" ${month === salesTargetMonth ? "selected" : ""}>${month}</option>`).join("")}</select>`)}</div></section><div class="metrics sales-metrics">${salesGoalMetricCards(goal).join("")}</div>` +
          `<section class="panel sales-history-panel"><div class="panel-head"><div class="panel-title">调整记录</div></div>${salesTargetHistoryTable()}</section>`;
      }

      function salesSupportDeadlineTime(support) {
        const value = String(support.deadline || "").replace(" ", "T");
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return NaN;
        const normalized = value.length === 16 ? value + ":00" : value;
        const time = Date.parse(normalized + "+08:00");
        return Number.isFinite(time) && new Date(time + 8 * 3600000).toISOString().slice(0, 19) === normalized ? time : NaN;
      }

      function salesSupportRemainingText(support, now = Date.now()) {
        if (!["待响应", "进行中"].includes(support.status)) return "—";
        const deadline = salesSupportDeadlineTime(support);
        if (!Number.isFinite(deadline)) return "—";
        const remaining = deadline - Math.floor(now / 1000) * 1000;
        if (remaining === 0) return "已到截止时间";
        const hours = Math.floor(Math.abs(remaining) / 3600000);
        const duration = hours === 0 ? "不足1小时" : `${hours >= 24 ? Math.floor(hours / 24) + "天" : ""}${hours % 24}小时`;
        return (remaining > 0 ? "剩余" : "已超时") + duration;
      }

      function salesVisibleSupportRequests() {
        if (!canAccessPage("sales-supports")) return [];
        const employeeCode = salesCurrentSupportEmployee()?.code;
        return opportunities.flatMap((opportunity) => opportunity.supports
          .filter((support) => currentUser?.fullAccess || support.assigneeCode === employeeCode)
          .map((support) => ({ opportunity, support })));
      }

      function salesSupportMatchesFilters({ opportunity, support }) {
        const filter = appliedSupportFilters;
        const validDeadline = Number.isFinite(salesSupportDeadlineTime(support));
        const day = String(support.deadline || "").slice(0, 10);
        return (!filter.name || opportunity.name.toLowerCase().includes(filter.name.toLowerCase())) &&
          (!filter.customer || opportunity.customer === filter.customer) &&
          (!filter.status || support.status === filter.status) &&
          (!filter.deadlineFrom || (validDeadline && day >= filter.deadlineFrom)) &&
          (!filter.deadlineTo || (validDeadline && day <= filter.deadlineTo));
      }

      function salesCompareSupportRequests(left, right) {
        const group = (support) => !Number.isFinite(salesSupportDeadlineTime(support)) ? 2 : ["待响应", "进行中"].includes(support.status) ? 0 : 1;
        const leftGroup = group(left.support), rightGroup = group(right.support);
        return leftGroup - rightGroup || (leftGroup === 0 ? salesSupportDeadlineTime(left.support) - salesSupportDeadlineTime(right.support) : 0);
      }

      function salesSupportFiltersHtml(requests) {
        const filter = appliedSupportFilters;
        const options = (values, selected) => values.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
        return `<div class="toolbar filter-toolbar sales-opportunity-filters">${filterField("商机名称",
          `<input class="input" id="supportNameFilter" value="${escapeHtml(filter.name)}" placeholder="请输入商机名称">`)}${filterField("客户单位",
          `<select class="input" id="supportCustomerFilter"><option value="">全部客户</option>${options([...new Set(requests.map(({ opportunity }) => opportunity.customer))], filter.customer)}</select>`)}${filterField("状态",
          `<select class="input" id="supportStatusFilter"><option value="">全部状态</option>${options(["待响应", "进行中", "已交付", "已关闭"], filter.status)}</select>`)}${filterField("交付截止日期",
          `<span class="date-range"><input class="input" id="supportDeadlineFromFilter" type="date" value="${escapeHtml(filter.deadlineFrom)}"><span>至</span><input class="input" id="supportDeadlineToFilter" type="date" value="${escapeHtml(filter.deadlineTo)}"></span>`)}${filterActions(
          '<button class="btn btn-primary" id="applySupportFilters" type="button">筛选</button><button class="btn" id="resetSupportFilters" type="button">重置</button>')}</div>`;
      }

      function renderSalesSupports() {
        if (!canAccessPage("sales-supports")) return "";
        const isAdminManagement = Boolean(currentUser?.fullAccess);
        const requests = salesVisibleSupportRequests();
        const now = Date.now();
        const rows = requests.filter(salesSupportMatchesFilters).sort(salesCompareSupportRequests)
          .map(({ opportunity, support }) =>
            `<tr data-page-row><td>${support.id}</td><td>${opportunity.id}</td><td>${opportunity.name}</td><td>${opportunity.customer}</td><td>${support.content}</td><td>${support.deadline}</td><td data-support-remaining="${support.id}">${salesSupportRemainingText(support, now)}</td><td>${salesStageTag(support.status)}</td><td><button class="link" data-opportunity-open="${opportunity.id}" data-opportunity-context="support" data-opportunity-support="${support.id}">商机详情</button> ${supportDeliveryAction(opportunity, support)} ${supportHistoryAction(opportunity, support)} ${supportStatusAction(opportunity, support).replaceAll("data-support-id", `data-support-opportunity=\"${opportunity.id}\" data-support-id`)}</td></tr>`,
          )
          .join("");
        return (
          pageHead(
            isAdminManagement ? "方案支撑管理" : "我的方案支撑",
            isAdminManagement
              ? "查看方案支撑需求，跟进协作进展。"
              : "处理方案支撑请求，提交支撑成果。",
            hasPermission("opportunities") ? '<button class="btn" data-sales-page="opportunities">商机列表</button>' : "",
          ) +
          `<section class="panel">${salesSupportFiltersHtml(requests)}<div class="table-wrap"><table style="min-width:1420px" data-paged-table="m12-supports"><thead><tr><th>请求编号</th><th>商机编号</th><th>商机名称</th><th>客户单位</th><th>支撑需求</th><th>交付截止时间</th><th>剩余时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr data-empty-row><td colspan="9"><div class="empty">当前没有方案支撑请求</div></td></tr>'}</tbody></table></div>${tablePagination("m12-supports")}</section>`
        );
      }

      function opportunityMatchesFilters(item) {
        const filter = appliedOpportunityFilters;
        return (
          (!filter.code || item.id === filter.code) &&
          (!filter.name || item.name.toLowerCase().includes(filter.name.toLowerCase())) &&
          (!filter.type || item.type === filter.type) &&
          (!filter.stage || item.stage === filter.stage) &&
          (!filter.customer || item.customer === filter.customer) &&
          (!filter.region || item.region === filter.region) &&
          (!filter.owner || salesOpportunityOwnerName(item) === filter.owner) &&
          (!filter.priority || item.priority === filter.priority) &&
          (!filter.expectedFrom || item.expectedWinDate >= filter.expectedFrom) &&
          (!filter.expectedTo || item.expectedWinDate <= filter.expectedTo) &&
          (!filter.createdFrom || item.createdDate >= filter.createdFrom) &&
          (!filter.createdTo || item.createdDate <= filter.createdTo) &&
          (!filter.overdue ||
            (filter.overdue === "是") === Boolean(item.nextFollowDate && item.nextFollowDate < DEMO_TODAY && item.stage !== "落选"))
        );
      }

      function opportunityFiltersHtml() {
        const rows = salesVisibleOpportunities();
        const option = (value, current) => `${value === current ? "selected" : ""}`;
        return `<div class="toolbar filter-toolbar sales-opportunity-filters">${filterField(
          "商机编号",
          `<input class="input" id="opportunityCodeFilter" value="${escapeHtml(appliedOpportunityFilters.code)}" placeholder="请输入完整商机编号">`,
        )}${filterField(
          "商机名称",
          `<input class="input" id="opportunityNameFilter" value="${escapeHtml(appliedOpportunityFilters.name)}" placeholder="请输入商机名称">`,
        )}${filterField(
          "商机类型",
          `<select class="input" id="opportunityTypeFilter"><option value="">全部类型</option>${SALES_TYPES.map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.type)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "阶段",
          `<select class="input" id="opportunityStageFilter"><option value="">全部阶段</option>${SALES_STAGES.map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.stage)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "客户单位",
          `<select class="input" id="opportunityCustomerFilter"><option value="">全部客户</option>${[...new Set(rows.map((item) => item.customer))].map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.customer)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "业务责任区域",
          `<select class="input" id="opportunityRegionFilter"><option value="">全部区域</option>${[...new Set(rows.map((item) => item.region).filter(Boolean))].map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.region)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "负责人",
          `<select class="input" id="opportunityOwnerFilter"><option value="">全部负责人</option>${[...new Set(rows.map((item) => salesOpportunityOwnerName(item)))].map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.owner)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "优先级",
          `<select class="input" id="opportunityPriorityFilter"><option value="">全部优先级</option>${SALES_PRIORITIES.map((value) => `<option value="${value}" ${option(value, appliedOpportunityFilters.priority)}>${value}</option>`).join("")}</select>`,
        )}${filterField(
          "预计成交日期",
          `<span class="date-range"><input class="input" id="opportunityExpectedFromFilter" type="date" value="${appliedOpportunityFilters.expectedFrom}"><span>至</span><input class="input" id="opportunityExpectedToFilter" type="date" value="${appliedOpportunityFilters.expectedTo}"></span>`,
        )}${filterField(
          "创建日期",
          `<span class="date-range"><input class="input" id="opportunityCreatedFromFilter" type="date" value="${appliedOpportunityFilters.createdFrom}"><span>至</span><input class="input" id="opportunityCreatedToFilter" type="date" value="${appliedOpportunityFilters.createdTo}"></span>`,
        )}${filterField(
          "跟进是否逾期",
          `<select class="input" id="opportunityOverdueFilter"><option value="">全部</option><option value="是" ${option("是", appliedOpportunityFilters.overdue)}>是</option><option value="否" ${option("否", appliedOpportunityFilters.overdue)}>否</option></select>`,
        )}${filterActions(
          '<button class="btn btn-primary" id="applyOpportunityFilters" type="button">筛选</button><button class="btn" id="resetOpportunityFilters" type="button">重置</button>',
        )}</div>`;
      }

      function salesOpportunitySupportProgress(item) {
        const requests = (item.supports || []).filter(support => !["withdraw","stop"].includes(support.closureKind));
        if (!requests.length) return "—";
        const delivered = requests.filter((support) => ["已交付", "已关闭"].includes(support.status)).length;
        return `${delivered}/${requests.length}`;
      }

      function renderOpportunities() {
        const rows = salesVisibleOpportunities().filter(opportunityMatchesFilters);
        const body = rows
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id))
          .map(
            (item) =>
              `<tr data-page-row><td>${item.id}</td><td>${item.name}</td><td>${item.type}</td><td>${salesStageTag(item.stage)}</td><td>${item.supports?.length ? "是" : "否"}</td><td>${salesOpportunitySupportProgress(item)}</td><td>${item.customer}</td><td>${salesMoney(item.estimateAmount)}</td><td>${salesPriorityTag(item.priority)}</td><td>${salesStageDays(item)} 天</td><td>${escapeHtml(salesOpportunityOwnerName(item))}</td><td>${item.createdDate}</td><td>${item.updatedAt}</td><td>${item.createdBy}</td><td><button class="link" type="button" data-opportunity-open="${item.id}">详情</button></td></tr>`,
          )
          .join("");
        const emptyRow = '<tr data-empty-row><td colspan="15"><div class="empty">暂无数据</div></td></tr>';
        const tableHtml = [
          '<section class="panel">',
          opportunityFiltersHtml(),
          '<div class="table-wrap"><table style="min-width:1740px" data-paged-table="m12-opportunities">',
          '<thead><tr><th>商机编号</th><th>商机名称</th><th>商机类型</th><th>阶段</th><th>是否方案支撑</th><th>交付进度</th><th>客户单位</th><th>当前预估金额（含税，万元）</th><th>优先级</th><th>当前阶段停留时间</th><th>负责人</th><th>创建时间</th><th>最近更新时间</th><th>创建人</th><th>操作</th></tr></thead>',
          `<tbody>${body || emptyRow}<tr data-filter-empty style="display:none"><td colspan="15"><div class="empty">暂无数据</div></td></tr></tbody>`,
          `</table></div>${tablePagination("m12-opportunities")}</section>`,
        ].join("");
        return (
          pageHead(
            "商机列表",
            "查看商机信息，跟进销售进展。",
            `${salesCanCreate() ? '<button class="btn btn-primary" data-sales-page="opportunity-create">新建商机</button>' : ""}`,
          ) +
          tableHtml
        );
      }

      function salesStageDays(opportunity) {
        const changed = new Date(opportunity.stageChangedAt.replace(" ", "T"));
        const now = new Date(`${DEMO_TODAY}T12:00:00`);
        return Math.max(Math.floor((now - changed) / 86400000), 0);
      }

      function salesField(label, value, className = "") {
        return `<div class="detail-item ${className}"><label>${label}</label><div>${value || "—"}</div></div>`;
      }

      function opportunitySelected() {
        return opportunities.find((item) => item.id === selectedOpportunityId &&
          (salesVisibleOpportunities().includes(item) || salesCanViewSupportOpportunity(item)));
      }

      function isSupportOpportunityDetail(item) {
        return opportunityDetailContext === "support" || !salesVisibleOpportunities().includes(item);
      }

      function opportunityOverviewHtml(item, supportContext = false) {
        const fields = [
          salesField("商机编号", item.id),
          salesField("商机类型", item.type),
          salesField("客户单位", item.customer),
          supportContext ? "" : salesField("客户编号", item.customerCode),
          isEcosystemOpportunity(item) ? "" : salesField("所属集团", item.group),
          isEcosystemOpportunity(item) ? "" : salesField("行业", item.industry),
          isEcosystemOpportunity(item) ? "" : salesField("业务责任区域", item.region),
          isEcosystemOpportunity(item) ? "" : salesField("地区", item.city || "—"),
          salesField("优先级", salesPriorityTag(item.priority)),
          salesField("预估金额（含税，万元）", salesMoney(item.estimateAmount)),
          salesField("预计成交日期", item.expectedWinDate),
          item.stage === "中选" ? salesField("中选日期", item.selectedDate) : "",
          item.stage === "中选" ? salesField("成交金额（含税，万元）", salesMoney(item.expectedContractAmount)) : "",
          isEcosystemOpportunity(item) ? "" : salesField("商机关键人", item.keyPeople.join("、") || "—", "full"),
          salesField("商机需求描述", item.requirement, "full"),
          supportContext ? "" : salesField("创建信息", `${item.createdDate} · ${item.createdBy}`),
          supportContext ? "" : salesField("最近更新时间", item.updatedAt),
        ];
        return `<div class="detail-grid sales-detail-grid">${fields.join("")}</div>`;
      }

      function opportunityFollowupsHtml(item) {
        const rows = item.followUps
          .map(
            (record) =>
              `<tr><td>${record.time}</td><td>${record.method}</td>${isEcosystemOpportunity(item) ? "" : `<td>${record.people}</td>`}<td>${record.result}</td><td>${record.risk}</td><td>${record.nextAction}</td><td>${record.nextDate}</td><td>${record.attachment || "—"}</td><td>${record.operator}</td></tr>`,
          )
          .join("");
        const action =
          salesCanProgress(item) && item.stage !== "落选"
            ? '<div class="sales-tab-toolbar"><button class="btn btn-primary" type="button" data-sales-followup-add>新增跟进</button></div>'
            : "";
        return `${action}<div class="table-wrap"><table style="min-width:1280px"><thead><tr><th>跟进时间</th><th>跟进方式</th>${isEcosystemOpportunity(item) ? "" : "<th>参与关键人</th>"}<th>内容与结果</th><th>当前风险</th><th>下一步行动</th><th>下次跟进日期</th><th>附件</th><th>操作人</th></tr></thead><tbody>${rows || `<tr><td colspan="${isEcosystemOpportunity(item) ? 8 : 9}"><div class="empty">暂无跟进记录</div></td></tr>`}</tbody></table></div>`;
      }

      function supportStatusAction(item, support) {
        const button=(action,text)=>`<button class="link" type="button" data-support-action="${action}" data-support-id="${support.id}">${text}</button>`;
        return [["respond","确认接收"],["deliver","提交支撑文件"],["close","确认接收"],["supplement","要求补充"],["withdraw","撤回"],["stop","关闭停止"]]
          .filter(([action])=>salesCanRunSupportAction(item,support,action)).map(([action,text])=>button(action,text)).join(" ");
      }

      function opportunitySupportsHtml(item) {
        const rows = item.supports
          .filter((support) => salesVisibleOpportunities().includes(item) || support.assigneeCode === salesCurrentSupportEmployee()?.code)
          .map(
            (support) =>
              `<tr><td>${support.id}</td><td>${support.assignee}</td><td>${support.deadline}</td><td>${support.content}</td><td>${salesStageTag(support.status)}</td><td>${supportDeliveryAction(item, support)} ${supportHistoryAction(item, support)} ${supportStatusAction(item, support)}</td></tr>`,
          )
          .join("");
        const action =
          salesCanProgress(item) && item.stage !== "落选"
            ? '<div class="sales-tab-toolbar"><button class="btn btn-primary" type="button" data-sales-support-add>发起支撑</button></div>'
            : "";
        return `${action}<div class="table-wrap"><table style="min-width:1180px"><thead><tr><th>请求编号</th><th>支撑人员</th><th>交付截止时间</th><th>支撑需求</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr><td colspan="6"><div class="empty">暂无方案支撑请求</div></td></tr>'}</tbody></table></div>`;
      }

      function opportunityHistoryHtml(item) {
        const resultText=value=>value ? `${value.stage}；中选日期：${value.selectedDate || "—"}；成交金额（含税，万元）：${value.expectedContractAmount == null ? "—" : salesStatsMoney(value.expectedContractAmount)}${value.lossReason ? `；落选原因：${value.lossReason}；竞争对手：${value.competitor}；复盘说明：${value.review}` : ""}` : "";
        return `<div class="section-title">阶段历史</div><div class="table-wrap"><table><thead><tr><th>生效时间</th><th>原阶段</th><th>新阶段</th><th>操作人</th><th>说明与材料</th></tr></thead><tbody>${item.histories.slice().reverse().map(record=>`<tr><td>${escapeHtml(record.time)}</td><td>${escapeHtml(record.from)}</td><td>${escapeHtml(record.to)}${record.action === "纠错" ? " · 纠错" : ""}</td><td>${escapeHtml(record.operator)}</td><td>${escapeHtml(record.description || record.reason || "—")}${record.before ? `<div>纠错前：${escapeHtml(resultText(record.before))}</div><div>纠错后：${escapeHtml(resultText(record.after))}</div>` : ""}${record.result ? `<div>${escapeHtml(resultText(record.result))}</div>` : ""}${salesStageFilesHtml(item,record)}</td></tr>`).join("")}</tbody></table></div><div class="section-title sales-history-subtitle">负责人责任交接历史</div><div class="table-wrap"><table><thead><tr><th>生效时间</th><th>原负责人</th><th>新负责人</th><th>原因</th><th>操作人</th></tr></thead><tbody>${(item.reassignments || []).slice().reverse().map(record=>`<tr><td>${escapeHtml(record.time)}</td><td>${escapeHtml(record.before)}</td><td>${escapeHtml(record.after)}</td><td>${escapeHtml(record.reason)}</td><td>${escapeHtml(record.operator)}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">暂无改派记录</div></td></tr>'}</tbody></table></div><div class="section-title sales-history-subtitle">基本信息变更历史</div><div class="table-wrap"><table><thead><tr><th>变更时间</th><th>字段</th><th>变更前</th><th>变更后</th><th>操作人</th></tr></thead><tbody>${(item.editHistories || []).slice().reverse().map(record=>`<tr><td>${escapeHtml(record.time)}</td><td>${escapeHtml(amountHistoryField(record.field))}</td><td>${escapeHtml(amountHistoryValue(record.field,record.before))}</td><td>${escapeHtml(amountHistoryValue(record.field,record.after))}</td><td>${escapeHtml(record.operator)}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">暂无编辑记录</div></td></tr>'}</tbody></table></div>`;
      }

      function renderOpportunityDetail() {
        const item = opportunitySelected();
        if (!item)
          return forbiddenPage("商机详情", "当前账号无权查看该商机，或商机不存在。");
        if (isSupportOpportunityDetail(item)) {
          const support = item.supports.find((request) => request.id === selectedOpportunitySupportId);
          const receiveButton = support && salesCanRunSupportAction(item, support, "respond")
            ? `<button class="btn btn-primary" data-support-action="respond" data-support-opportunity="${item.id}" data-support-id="${support.id}">确认接收</button>`
            : "";
          return pageHead(
            item.name,
            "查看商机背景与需求。",
            '<button class="btn" id="backToOpportunities">返回我的方案支撑</button>' + receiveButton,
          ) + `<section class="panel sales-detail-panel"><div class="sales-detail-identity"><div><span class="list-sub">当前阶段</span><div class="sales-detail-stage">${salesStageTag(item.stage)}</div></div><div><span class="list-sub">负责人</span><strong>${escapeHtml(salesOpportunityOwnerName(item))}</strong></div></div><div class="panel-body sales-detail-body">${opportunityOverviewHtml(item, true)}</div></section>`;
        }
        const tabs = [
          ["overview", "基本信息"],
          ["followup", "跟进记录"],
          ["support", "方案支撑"],
          ["history", "阶段历史"],
        ];
        const body = {
          overview: opportunityOverviewHtml(item),
          followup: opportunityFollowupsHtml(item),
          support: opportunitySupportsHtml(item),
          history: opportunityHistoryHtml(item),
        }[opportunityDetailTab];
        const canOperate = salesCanProgress(item) && item.stage !== "落选";
        return (
          pageHead(
            item.name,
            "查看商机信息、跟进记录与方案支撑。",
            `<button class="btn" id="backToOpportunities">返回列表</button>${canOperate ? '<button class="btn" data-sales-edit>编辑</button>' : ""}${canOperate ? '<button class="btn btn-primary" data-sales-stage-open>推进阶段</button>' : ""}${salesCanCorrect(item) ? '<button class="btn" data-sales-correct>纠错</button>' : ""}`,
          ) +
          `<section class="panel sales-detail-panel"><div class="sales-detail-identity"><div><span class="list-sub">当前阶段</span><div class="sales-detail-stage">${salesStageTag(item.stage)}</div></div><div><span class="list-sub">负责人</span><strong>${escapeHtml(salesOpportunityOwnerName(item))}</strong></div><div><span class="list-sub">下次跟进日期</span><strong>${item.nextFollowDate || "—"}</strong></div></div><div class="tabs detail-tabs">${tabs
            .map(
              ([id, label]) =>
                `<button class="tab ${opportunityDetailTab === id ? "active" : ""}" type="button" data-opportunity-tab="${id}">${label}</button>`,
            )
            .join("")}</div><div class="panel-body sales-detail-body">${body}</div></section>`
        );
      }

      function salesFormField(id, label, control, required = false, full = false) {
        return `<div class="form-group ${full ? "full" : ""}"><label class="form-label">${required ? '<span class="required-marker" aria-hidden="true">*</span>' : ""}${label}</label>${control}<div class="field-error" id="err-${id}"></div></div>`;
      }

      function salesSupportPeoplePickerHtml(id) {
        const options = salesSupportCandidates()
          .map(
            (employee) =>
              `<label class="multi-select-option" data-sales-support-option><input type="checkbox" data-sales-support-person value="${escapeHtml(employee.code)}"><span>${escapeHtml(employee.name)}</span></label>`,
          )
          .join("");
        return (
          `<div class="sales-support-picker" id="${id}" data-sales-support-picker>` +
          '<div class="multi-select sales-support-select">' +
          '<button class="multi-select-trigger" type="button" data-sales-support-trigger aria-haspopup="listbox" aria-expanded="false"><span>搜索并选择支撑人员</span><span aria-hidden="true">⌄</span></button>' +
          '<div class="multi-select-menu hidden" data-sales-support-menu><input class="input" type="search" data-sales-support-search placeholder="搜索支撑人员" aria-label="搜索支撑人员"><div data-sales-support-options>' +
          options +
          '</div></div></div><div class="sales-support-selected-list" data-sales-support-selected aria-live="polite"></div></div>'
        );
      }

      function salesKeyPeoplePickerHtml(id, customerName = "", selected = [], guide = false) {
        const people = customerName
          ? contacts.filter(
              (person) =>
                person.company === customerName && contactIsActive(person),
            )
          : [];
        const company = customers.find(item => item.name === customerName);
        const emptyGuide = guide && company && !people.length ? (canMaintainContactForCompany(company) ? '<div class="list-sub">该客户暂无有效关键人，请先<button class="link" type="button" data-sales-create-contact>创建关键人</button></div>' : '<div class="list-sub">该客户暂无有效关键人，请联系客户负责人或管理员补充后再创建商机。</div>') : "";
        const options = people
          .map(
            (person) =>
              `<label class="multi-select-option" data-sales-key-option><input type="checkbox" data-sales-key-person value="${escapeHtml(person.name)}" ${selected.includes(person.name) ? "checked" : ""}><span>${escapeHtml(person.name)} · ${escapeHtml(person.department || "部门未维护")}</span></label>`,
          )
          .join("");
        return (
          `<div class="sales-support-picker sales-key-people-picker" id="${id}" data-sales-key-picker data-customer="${escapeHtml(customerName)}">` +
          '<div class="multi-select sales-support-select">' +
          `<button class="multi-select-trigger" type="button" data-sales-key-trigger aria-haspopup="listbox" aria-expanded="false" ${people.length ? "" : "disabled"}><span>${customerName ? people.length ? "搜索并选择商机关键人" : "该客户暂无有效关键人" : "请先选择客户单位"}</span><span aria-hidden="true">⌄</span></button>` +
          `<div class="multi-select-menu hidden" data-sales-key-menu><input class="input" type="search" data-sales-key-search placeholder="搜索商机关键人" aria-label="搜索商机关键人"><div data-sales-key-options>${options}</div></div></div>` +
          `<div class="sales-support-selected-list" data-sales-key-selected aria-live="polite"></div>${emptyGuide}</div>`
        );
      }

      function renderOpportunityCreate() {
        if (!salesCanCreate()) return forbiddenPage("新建商机", "当前账号没有创建商机权限。");
        const types = salesCreateTypes();
        const fixedType = types.length === 1 ? types[0] : "";
        const customerOptions = salesVisibleCustomers(fixedType)
          .map(
            (item) =>
              `<option value="${escapeHtml(salesCustomerSelectionValue(item, fixedType))}">${escapeHtml(item.name)}</option>`,
          )
          .join("");
        const typeOptions = types.map(
          (item) => `<option value="${item}" ${item === fixedType ? "selected" : ""}>${item}</option>`,
        ).join("");
        const priorityOptions = SALES_PRIORITIES.map(
          (item) => `<option value="${item}">${item}</option>`,
        ).join("");
        const formFields = [
          salesFormField("salesName", "商机名称", '<input class="input" id="salesName" maxlength="100">', true),
          salesFormField("salesType", "商机类型", `<select class="input" id="salesType" ${fixedType ? "disabled" : ""}>${fixedType ? "" : '<option value="">请选择商机类型</option>'}${typeOptions}</select>`, true),
          salesFormField("salesAmount", "预估金额（含税，万元）", '<input class="input" id="salesAmount" type="number" min="0" step="0.000001">', true),
          salesFormField("salesPriority", "优先级", `<select class="input" id="salesPriority"><option value="">请选择优先级</option>${priorityOptions}</select>`, true),
          salesFormField("salesCustomer", "客户单位", `<select class="input" id="salesCustomer"><option value="">请选择客户单位</option>${customerOptions}</select>`, true),
          salesFormField("salesCustomerFacts", "客户关联信息", '<div class="input sales-readonly" id="salesCustomerFacts">请选择客户单位</div>'),
          `<div id="salesKeyPeopleGroup" style="display:contents" ${fixedType === SALES_ECOSYSTEM_TYPE ? "hidden" : ""}>${fixedType === SALES_ECOSYSTEM_TYPE ? "" : salesFormField("salesKeyPeople", "商机关键人", salesKeyPeoplePickerHtml("salesKeyPeoplePicker", "", [], true), true)}</div>`,
          salesFormField("salesExpectedDate", "预计成交日期", '<input class="input" id="salesExpectedDate" type="date">', true),
          salesFormField("salesOwner", "商机负责人", `<div class="input sales-readonly" id="salesOwner" data-owner="">${fixedType === SALES_ECOSYSTEM_TYPE ? escapeHtml(currentUser.name) : "选择客户后自动匹配"}</div>${currentUser.fullAccess ? `<select class="input" id="salesEcosystemOwner" hidden><option value="">请选择生态合作员</option>${employees.filter(validEcosystemEmployee).map(employee => `<option value="${employee.code}">${escapeHtml(employee.name)} · ${employee.code}</option>`).join("")}</select>` : ""}`, true),
          salesFormField("salesFirstFollow", "首次跟进日期", `<input class="input" id="salesFirstFollow" type="date" min="${salesNextBusinessDate()}">`, true),
          salesFormField("salesRequirement", "商机需求描述", '<textarea class="input" id="salesRequirement" rows="4" maxlength="1000"></textarea>', true, true),
          salesFormField("salesCreateSupport", "同时创建方案支撑", '<select class="input" id="salesCreateSupport"><option value="否">否</option><option value="是">是</option></select>', true),
          `<div class="form-group" id="salesSupportPeopleGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑人员</label>${salesSupportPeoplePickerHtml("salesSupportPeoplePicker")}<div class="field-error" id="err-salesSupportPeople"></div></div>`,
          '<div class="form-group full" id="salesSupportRequirementGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>支撑需求</label><textarea class="input" id="salesSupportRequirement" rows="3" maxlength="500"></textarea><div class="field-error" id="err-salesSupportRequirement"></div></div>',
          `<div class="form-group" id="salesSupportDeadlineGroup" hidden><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>交付截止时间</label><input class="input" id="salesSupportDeadline" type="datetime-local" value=""><div class="field-error" id="err-salesSupportDeadline"></div></div>`,
        ].join("");
        return (
          pageHead("新建商机", "填写客户与需求信息，建立商机档案。") +
          `<section class="panel sales-form-panel"><form id="opportunityCreateForm"><div class="panel-body sales-form-grid">${formFields}</div><div class="panel-foot sales-form-footer"><button class="btn" type="button" id="cancelOpportunityCreate">取消</button><button class="btn btn-primary" type="submit">保存商机</button></div></form></section>`
        );
      }
