      const regionsData = [
        {"id": 701,"name": "山东区域运营中心","scope": "山东区域","director": "赵磊","provinces": "山东","base": "济南","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 702,"name": "江苏区域运营中心","scope": "江苏区域","director": "孙倩","provinces": "江苏、安徽","base": "南京","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 703,"name": "浙江区域运营中心","scope": "浙江区域","director": "钱峰","provinces": "浙江","base": "杭州","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 704,"name": "华南区域运营中心","scope": "华南区域","director": "林哲","provinces": "福建、广东、广西","base": "福州","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 705,"name": "华北区域运营中心","scope": "华北区域","director": "华北总监","provinces": "河北","base": "石家庄","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 706,"name": "华中区域运营中心","scope": "华中区域","director": "华中主管","provinces": "湖北","base": "武汉","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 707,"name": "西南区域运营中心","scope": "西南区域","director": "西南总监","provinces": "四川","base": "成都","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 708,"name": "东北区域运营中心","scope": "东北区域","director": "东北总监","provinces": "辽宁","base": "沈阳","configuredAt": "2026-10-24 09:00","type": "geographic"},
        {"id": 709,"name": "能源运营中心","scope": "能源运营中心","type": "industry","industry": "能源","enabled": true,"director": "能源总监","provinces": "","base": "济南","configuredAt": "2026-10-24 09:00"},
        {"id": 710,"name": "新设运营中心","scope": "新设运营中心","director": "郑敏","provinces": "","base": "待配置","type": "geographic"},
      ];
      const cityOwners = [
        {"id": 801,"province": "山东","city": "济南","pm": "刘经理","effective": "2026-10-24","regionId": 701},
        {"id": 802,"province": "山东","city": "泰安","pm": "陈经理","effective": "2026-10-24","regionId": 701},
        {"id": 803,"province": "山东","city": "青岛","pm": "刘经理","effective": "2026-10-24","regionId": 701},
        {"id": 804,"province": "山东","city": "烟台","pm": "刘经理","effective": "2026-10-24","regionId": 701},
        {"id": 815,"province": "山东","city": "临沂","pm": "","effective": "2026-10-24","regionId": 701},
        {"id": 805,"province": "江苏","city": "南京","pm": "周经理","effective": "2026-10-24","regionId": 702},
        {"id": 806,"province": "江苏","city": "无锡","pm": "徐经理","effective": "2026-10-24","regionId": 702},
        {"id": 807,"province": "安徽","city": "合肥","pm": "徐经理","effective": "2026-10-24","regionId": 702},
        {"id": 808,"province": "浙江","city": "杭州","pm": "吴经理","effective": "2026-10-24","regionId": 703},
        {"id": 809,"province": "浙江","city": "宁波","pm": "吴经理","effective": "2026-10-24","regionId": 703},
        {"id": 810,"province": "浙江","city": "温州","pm": "叶经理","effective": "2026-10-24","regionId": 703},
        {"id": 811,"province": "福建","city": "福州","pm": "林经理","effective": "2026-10-24","regionId": 704},
        {"id": 812,"province": "广东","city": "广州","pm": "梁经理","effective": "2026-10-24","regionId": 704},
        {"id": 813,"province": "广西","city": "南宁","pm": "梁经理","effective": "2026-10-24","regionId": 704},
        {"id": 814,"province": "辽宁","city": "沈阳","pm": "沈阳经理","effective": "2026-10-24","regionId": 708},
        {"id": 816,"regionId": 709,"province": "山东","city": "济南","pm": "能源PM甲","effective": "2026-10-24"},
      ];
      const cityResponsibilityRules = [
        {"id": 901,"regionId": 701,"dimension": "集团","value": "华北云网集团","pm": "陈经理","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 903,"regionId": 703,"dimension": "集团","value": "华东能源控股","pm": "叶经理","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 911,"regionId": 701,"dimension": "客户公司","value": "30","pm": "刘经理","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 912,"regionId": 709,"dimension": "集团","value": "华北云网集团","pm": "能源PM甲","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 913,"regionId": 709,"dimension": "集团","value": "华东能源控股","pm": "能源PM甲","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 914,"regionId": 709,"dimension": "客户公司","value": "7","pm": "能源PM乙","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 915,"regionId": 701,"dimension": "客户公司","value": "26","pm": "刘经理","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 916,"regionId": 709,"dimension": "客户公司","value": "34","pm": "能源PM乙","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 917,"dimension": "集团省份分流","value": "华北云网集团","province": "山东","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
        {"id": 918,"dimension": "集团省份分流","value": "华东能源控股","province": "浙江","status": "启用","effective": "2026-10-31","updatedAt": "2026-10-31 10:00","updatedBy": "王静"},
      ];
      function customerResponsibilityFacts(customer) {
        return customers.find(item => item === customer || String(item.id) === String(customer?.customerCode) || item.name === customer?.name) || customer;
      }
      function geographicCenterForProvince(province) {
        if (!province) return null;
        const matches = regionsData.filter(region => region.type !== "industry" && region.status !== "停用" &&
          String(region.provinces || "").split(/[、,，]/).includes(province));
        return matches.length === 1 ? matches[0] : null;
      }
      function groupProvinceRoutes() {
        return cityResponsibilityRules.filter(rule => rule.dimension === "集团省份分流");
      }
      function customerCenterRoutes() {
        return cityResponsibilityRules.filter(rule => rule.dimension === "客户中心划转");
      }
      function operatingCenterForCustomer(customer, pendingCenter = null) {
        if (!customer) return null;
        customer = customerResponsibilityFacts(customer);
        const explicit = customerCenterRoutes().filter(rule => rule.status === "启用" && String(rule.value) === String(customer.id));
        if (explicit.length) {
          const target = regionsData.find(region => region.id === explicit[0].targetRegionId && region.type !== "industry" && region.status !== "停用");
          return explicit.length === 1 ? target || null : null;
        }
        const routes = customer.group ? groupProvinceRoutes().filter(rule => rule.status === "启用" &&
          rule.value === customer.group && rule.province === customerBusinessProvince(customer)) : [];
        if (routes.length) return routes.length === 1 ? geographicCenterForProvince(customerBusinessProvince(customer)) : null;
        const industryCenters = regionsData.filter(region =>
          region.type === "industry" && region.status !== "停用" &&
          (region.enabled === true || region === pendingCenter) && region.industry === customer.industry);
        if (industryCenters.length) return industryCenters.length === 1 ? industryCenters[0] : null;
        return geographicCenterForProvince(customerBusinessProvince(customer));
      }

      function customerBelongsToCenter(customer, region, preview = false) {
        return operatingCenterForCustomer(customer, preview && region?.type === "industry" && !region.enabled ? region : null)?.id === region?.id;
      }

      function cityDefaultOwner(province, city, region = null) {
        const center = region || regionsData.find(item => item.type !== "industry" && String(item.provinces || "").split(/[、,，]/).includes(province));
        return cityOwners.find(item => item.province === province && item.city === city &&
          (item.regionId ? item.regionId === center?.id : center?.type !== "industry")) || null;
      }

      function centerResponsibilityRuleForCustomer(customer, region = operatingCenterForCustomer(customer)) {
        if (!customer || !region) return null;
        customer = customerResponsibilityFacts(customer);
        const rules = cityResponsibilityRules.filter(rule => rule.regionId === region.id && rule.status === "启用");
        return rules.find(rule => rule.dimension === "客户公司" && String(rule.value) === String(customer.id)) ||
          (customer.level !== "省公司" ? rules.find(rule => rule.dimension === "集团" && rule.value === customer.group) : null) || null;
      }
      function cityResponsibilityRuleForCustomer(customer) { return centerResponsibilityRuleForCustomer(customer); }
      function cityResponsibilityRulesFor(province, city) {
        const region = operatingCenterForCustomer({ province, city });
        return cityResponsibilityRules.filter(rule => rule.status === "启用" && rule.regionId === region?.id);
      }
      function responsibilityOwnerForCustomer(customer, region = operatingCenterForCustomer(customer)) {
        if (!customer || !region) return "";
        customer = customerResponsibilityFacts(customer);
        return centerResponsibilityRuleForCustomer(customer, region)?.pm ||
          (customer.level === "省公司" ? region.director || "" :
            cityDefaultOwner(customerBusinessProvince(customer), customerBusinessCity(customer), region)?.pm || "");
      }
      function customerResponsibilityRole(customer, region = operatingCenterForCustomer(customer)) {
        customer = customerResponsibilityFacts(customer);
        return customer?.level === "省公司" && !centerResponsibilityRuleForCustomer(customer, region) ? "区域总监" : "PM";
      }
      function customerPmName(customer, owner = responsibilityOwnerForCustomer(customer)) {
        return customerResponsibilityRole(customer) === "PM" ? owner : "";
      }
      function responsibilityReceiverIsValid(customer, region, owner) {
        const employee = employees.find(item => item.name === owner && item.status === "在职" && item.accountStatus !== "停用");
        if (!employee || !region) return false;
        const department = organizationDepartments.find(item => item.regionId === region.id && item.status === "启用");
        if (!department) return false;
        return customerResponsibilityRole(customer, region) === "区域总监" ? employeeHasRole(employee, "区域总监") && department.supervisorCode === employee.code :
          regionPmEmployees(region).includes(employee);
      }
      function cityPmForNewCustomer(customer = {}) { return responsibilityOwnerForCustomer(customer); }
