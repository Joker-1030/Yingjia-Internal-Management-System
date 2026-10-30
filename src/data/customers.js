      const customers = [
        { id: 1, group: "华北云网集团", name: "华北云网集团山东有限公司", level: "省公司", region: "山东区域", province: "山东", city: "", district: "", industry: "数字服务", owner: "赵磊", pm: "刘经理", contacts: 1, health: "健康" },
        { id: 2, group: "华北云网集团", name: "华北云网集团济南分公司", level: "市公司", region: "山东区域", province: "山东", city: "济南", district: "", industry: "能源", owner: "刘经理", pm: "陈经理", contacts: 5, health: "逾期" },
        { id: 3, group: "华信通信集团", name: "华信通信集团泰安分公司", level: "市公司", region: "山东区域", province: "山东", city: "泰安", district: "", industry: "通信", owner: "陈经理", pm: "陈经理", contacts: 3, health: "健康" },
        { id: 4, group: "国网产业协同集团", name: "国网产业协同集团青岛分公司", level: "市公司", region: "山东区域", province: "山东", city: "青岛", district: "", industry: "制造", owner: "刘经理", pm: "刘经理", contacts: 1, health: "健康" },
        { id: 5, group: "华东能源控股", name: "华东能源控股山东有限公司", level: "省公司", region: "山东区域", province: "山东", city: "", district: "", industry: "能源", owner: "赵磊", pm: "刘经理", contacts: 0, health: "健康" },
        { id: 6, group: "齐鲁数科集团", name: "齐鲁数科集团江苏有限公司", level: "省公司", region: "江苏区域", province: "江苏", city: "", district: "", industry: "数字服务", owner: "孙倩", pm: "周经理", contacts: 1, health: "健康" },
        { id: 7, group: "华北云网集团", name: "华北云网集团南京分公司", level: "市公司", region: "江苏区域", province: "江苏", city: "南京", district: "", industry: "能源", owner: "周经理", pm: "周经理", contacts: 1, health: "逾期" },
        { id: 8, group: "华东能源控股", name: "华东能源控股浙江有限公司", level: "省公司", region: "浙江区域", province: "浙江", city: "", district: "", industry: "能源", owner: "钱峰", pm: "吴经理", contacts: 0, health: "待分配" },
        { id: 9, group: "齐鲁数科集团", name: "齐鲁数科集团历下分公司", level: "区县公司", region: "山东区域", province: "山东", city: "济南", district: "历下", industry: "数字服务", owner: "刘经理", pm: "刘经理", contacts: 0, health: "健康" },
        { id: 10, group: "齐鲁数科集团", name: "齐鲁数科集团烟台分公司", level: "市公司", region: "山东区域", province: "山东", city: "烟台", district: "", industry: "数字服务", owner: "刘经理", pm: "刘经理", contacts: 2, health: "健康" },
        { id: 11, group: "华信通信集团", name: "华信通信集团烟台分公司", level: "市公司", region: "山东区域", province: "山东", city: "烟台", district: "", industry: "通信", owner: "刘经理", pm: "刘经理", contacts: 1, health: "逾期" },
        { id: 12, group: "齐鲁数科集团", name: "齐鲁数科集团济南分公司", level: "市公司", region: "山东区域", province: "山东", city: "济南", district: "", industry: "能源", owner: "刘经理", pm: "刘经理", contacts: 2, health: "健康" },
        { id: 13, group: "华信通信集团", name: "华信通信集团济南分公司", level: "市公司", region: "山东区域", province: "山东", city: "济南", district: "", industry: "通信", owner: "陈经理", pm: "陈经理", contacts: 0, health: "健康" },
        { id: 14, group: "华信通信集团", name: "华信通信集团市中分公司", level: "区县公司", region: "山东区域", province: "山东", city: "济南", district: "市中", industry: "通信", owner: "刘经理", pm: "刘经理", contacts: 1, health: "健康" },
        { id: 15, group: "国网产业协同集团", name: "国网产业协同集团福山分公司", level: "区县公司", region: "山东区域", province: "山东", city: "烟台", district: "福山", industry: "制造", owner: "刘经理", pm: "刘经理", contacts: 2, health: "逾期" },
        { id: 16, group: "齐鲁数科集团", name: "齐鲁数科集团无锡分公司", level: "市公司", region: "江苏区域", province: "江苏", city: "无锡", district: "", industry: "数字服务", owner: "徐经理", pm: "徐经理", contacts: 1, health: "健康" },
        { id: 17, group: "华信通信集团", name: "华信通信集团合肥分公司", level: "市公司", region: "江苏区域", province: "安徽", city: "合肥", district: "", industry: "通信", owner: "徐经理", pm: "徐经理", contacts: 1, health: "逾期" },
        { id: 18, group: "齐鲁数科集团", name: "齐鲁数科集团浙江有限公司", level: "省公司", region: "浙江区域", province: "浙江", city: "", district: "", industry: "数字服务", owner: "钱峰", pm: "", contacts: 1, health: "健康" },
        { id: 19, group: "齐鲁数科集团", name: "齐鲁数科集团杭州分公司", level: "市公司", region: "浙江区域", province: "浙江", city: "杭州", district: "", industry: "数字服务", owner: "吴经理", pm: "吴经理", contacts: 1, health: "健康" },
        { id: 20, group: "华北云网集团", name: "华北云网集团宁波分公司", level: "市公司", region: "浙江区域", province: "浙江", city: "宁波", district: "", industry: "能源", owner: "吴经理", pm: "吴经理", contacts: 1, health: "健康" },
        { id: 21, group: "华东能源控股", name: "华东能源控股温州分公司", level: "市公司", region: "浙江区域", province: "浙江", city: "温州", district: "", industry: "能源", owner: "叶经理", pm: "叶经理", contacts: 1, health: "逾期" },
        { id: 22, group: "齐鲁数科集团", name: "齐鲁数科集团福建有限公司", level: "省公司", region: "福建华南区域", province: "福建", city: "", district: "", industry: "数字服务", owner: "林哲", pm: "", contacts: 1, health: "健康" },
        { id: 23, group: "齐鲁数科集团", name: "齐鲁数科集团福州分公司", level: "市公司", region: "福建华南区域", province: "福建", city: "福州", district: "", industry: "数字服务", owner: "林经理", pm: "林经理", contacts: 1, health: "健康" },
        { id: 24, group: "华北云网集团", name: "华北云网集团广州分公司", level: "市公司", region: "福建华南区域", province: "广东", city: "广州", district: "", industry: "能源", owner: "梁经理", pm: "梁经理", contacts: 1, health: "逾期" },
        { id: 25, group: "华信通信集团", name: "华信通信集团南宁分公司", level: "市公司", region: "福建华南区域", province: "广西", city: "南宁", district: "", industry: "通信", owner: "梁经理", pm: "梁经理", contacts: 0, health: "健康" },
        { id: 26, group: "国网产业协同集团", name: "国网产业协同集团山东省公司", level: "省公司", region: "山东区域", province: "山东", city: "", district: "", industry: "制造", owner: "赵磊", pm: "", contacts: 0, health: "健康", companyCode: "CC00000026" },
        { id: 27, group: "国网产业协同集团", name: "国网产业协同集团济南市公司", level: "市公司", region: "山东区域", province: "山东", city: "济南", district: "", industry: "制造", owner: "刘经理", pm: "刘经理", contacts: 0, health: "健康", companyCode: "CC00000027" },
        { id: 28, group: "国网产业协同集团", name: "国网产业协同集团历下区县公司", level: "区县公司", region: "山东区域", province: "山东", city: "济南", district: "历下", industry: "能源", owner: "刘经理", pm: "刘经理", contacts: 0, health: "健康", companyCode: "CC00000028" },
      ];
      const customerOrganizationParentIds = new Map([
        [2, 1],
        [9, 12],
        [14, 13],
        [19, 18],
        [23, 22],
        [27, 26],
        [28, 27],
      ]);
      customers.forEach((company) => {
        company.organizationParentType = customerOrganizationParentIds.has(
          company.id,
        )
          ? "company"
          : "group";
        company.organizationParentCompanyId =
          customerOrganizationParentIds.get(company.id) || null;
        company.businessResponsibilityLevel =
          company.businessResponsibilityLevel ||
          ({ 省公司: "省级", 市公司: "市级", 区县公司: "区县级" }[
            company.level
          ] || company.level);
        company.businessResponsibilityProvince = company.province || "";
        company.businessResponsibilityCity = company.city || "";
        company.businessResponsibilityDistrict = company.district || "";
      });
