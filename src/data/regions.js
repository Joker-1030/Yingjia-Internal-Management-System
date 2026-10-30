      const regionsData = [
        {
          id: 701,
          name: "山东区域运营中心",
          scope: "山东区域",
          director: "赵磊",
          provinces: "山东",
          base: "济南",
          configuredAt: "2026-01-01 09:00",
        },
        {
          id: 702,
          name: "江苏区域运营中心",
          scope: "江苏区域",
          director: "孙倩",
          provinces: "江苏、安徽",
          base: "南京",
          configuredAt: "2026-01-01 09:00",
        },
        {
          id: 703,
          name: "浙江区域运营中心",
          scope: "浙江区域",
          director: "钱峰",
          provinces: "浙江",
          base: "杭州",
          configuredAt: "2026-02-15 09:00",
        },
        {
          id: 704,
          name: "华南区域运营中心",
          scope: "华南区域",
          director: "林哲",
          provinces: "福建、广东、广西",
          base: "福州",
          configuredAt: "2026-03-01 09:00",
        },
        {
          id: 705,
          name: "华北区域运营中心",
          scope: "华北区域",
          director: "",
          provinces: "河北",
          base: "石家庄",
          configuredAt: "2026-01-01 09:00",
        },
        {
          id: 706,
          name: "华中区域运营中心",
          scope: "华中区域",
          director: "华中主管",
          provinces: "湖北",
          base: "武汉",
          configuredAt: "2026-01-01 09:00",
        },
        {
          id: 707,
          name: "西南区域运营中心",
          scope: "西南区域",
          director: "西南总监",
          provinces: "四川",
          base: "已失效驻地",
          configuredAt: "2026-02-15 09:00",
        },
        {
          id: 708,
          name: "东北区域运营中心",
          scope: "东北区域",
          director: "东北总监",
          provinces: "辽宁",
          base: "沈阳",
          configuredAt: "2026-03-01 09:00",
        },
      ];
      const cityOwners = [
        {
          id: 801,
          province: "山东",
          city: "济南",
          pm: "刘经理",
          customers: 7,
          contacts: 8,
          effective: "2026-01-01",
        },
        {
          id: 802,
          province: "山东",
          city: "泰安",
          pm: "陈经理",
          customers: 1,
          contacts: 3,
          effective: "2026-03-15",
        },
        {
          id: 803,
          province: "山东",
          city: "青岛",
          pm: "刘经理",
          customers: 1,
          contacts: 1,
          effective: "2026-01-01",
        },
        {
          id: 804,
          province: "山东",
          city: "烟台",
          pm: "刘经理",
          customers: 3,
          contacts: 5,
          effective: "2026-02-01",
        },
        {
          id: 815,
          province: "山东",
          city: "临沂",
          pm: "",
          customers: 0,
          contacts: 0,
        },
        {
          id: 805,
          province: "江苏",
          city: "南京",
          pm: "周经理",
          customers: 1,
          contacts: 1,
          effective: "2026-01-01",
        },
        { id: 806, province: "江苏", city: "无锡", pm: "徐经理", customers: 1, contacts: 1, effective: "2026-04-01" },
        { id: 807, province: "安徽", city: "合肥", pm: "徐经理", customers: 1, contacts: 1, effective: "2026-04-01" },
        { id: 808, province: "浙江", city: "杭州", pm: "吴经理", customers: 1, contacts: 1, effective: "2026-02-15" },
        { id: 809, province: "浙江", city: "宁波", pm: "吴经理", customers: 1, contacts: 1, effective: "2026-02-15" },
        { id: 810, province: "浙江", city: "温州", pm: "叶经理", customers: 1, contacts: 1, effective: "2026-05-01" },
        { id: 811, province: "福建", city: "福州", pm: "林经理", customers: 1, contacts: 1, effective: "2026-03-01" },
        { id: 812, province: "广东", city: "广州", pm: "梁经理", customers: 1, contacts: 1, effective: "2026-03-01" },
        { id: 813, province: "广西", city: "南宁", pm: "梁经理", customers: 1, contacts: 0, effective: "2026-06-01" },
        { id: 814, province: "辽宁", city: "沈阳", pm: "沈阳经理", customers: 0, contacts: 0, effective: "2026-02-01" },
      ];

      // A city keeps one default PM, while optional group/industry rules can
      // route newly created customer companies to another PM in the same region.
      // Existing customer responsibility remains stored on the customer until an
      // authorized administrator explicitly adjusts it.
      const cityResponsibilityRules = [
        {
          id: 901,
          province: "山东",
          city: "济南",
          dimension: "集团",
          value: "华北云网集团",
          pm: "陈经理",
          effective: "2026-10-28",
          status: "启用",
        },
        {
          id: 902,
          province: "山东",
          city: "济南",
          dimension: "行业",
          value: "能源",
          pm: "刘经理",
          effective: "2026-10-28",
          status: "启用",
        },
        {
          id: 903,
          province: "浙江",
          city: "宁波",
          dimension: "集团",
          value: "国网产业协同集团",
          pm: "叶经理",
          effective: "2026-10-28",
          status: "启用",
        },
      ];

      function cityDefaultOwner(province, city) {
        return cityOwners.find((item) => item.province === province && item.city === city) || null;
      }

      function cityResponsibilityRulesFor(province, city) {
        return cityResponsibilityRules.filter(
          (rule) => rule.status !== "停用" && rule.province === province && rule.city === city,
        );
      }

      function cityResponsibilityRuleForCustomer(customer) {
        if (!customer) return null;
        const rules = cityResponsibilityRulesFor(
          customerBusinessProvince(customer),
          customerBusinessCity(customer),
        );
        return rules.find((rule) => rule.dimension === "集团" && rule.value === customer.group) ||
          rules.find((rule) => rule.dimension === "行业" && rule.value === customer.industry) ||
          null;
      }

      function cityPmForNewCustomer({ province, city, group, industry } = {}) {
        const rules = cityResponsibilityRulesFor(province, city);
        return (
          rules.find((rule) => rule.dimension === "集团" && rule.value === group)?.pm ||
          rules.find((rule) => rule.dimension === "行业" && rule.value === industry)?.pm ||
          cityDefaultOwner(province, city)?.pm ||
          ""
        );
      }
