      // Independent monetary Demo fixtures; these are not converted historical quantity targets.
      const salesTargetMonths = [
        ["2026-01", 800000, 400000, 240000, 160000],
        ["2026-02", 800000, 400000, 240000, 160000],
        ["2026-03", 900000, 450000, 270000, 180000],
        ["2026-04", 900000, 450000, 270000, 180000],
        ["2026-05", 1000000, 500000, 300000, 200000],
        ["2026-06", 1000000, 500000, 300000, 200000],
        ["2026-07", 1000000, 500000, 300000, 200000],
        ["2026-08", 1000000, 600000, 300000, 100000],
        ["2026-09", 1200000, 700000, 300000, 200000],
        ["2026-10", 1400000, 800000, 400000, 200000],
        ["2026-11", 1400000, 700000, 420000, 280000],
        ["2026-12", 1400000, 700000, 420000, 280000],
      ].map(([month, companyTarget, shandong, jiangsu, zhejiang]) => ({
        month, companyTarget,
        version: `V${month.replace("-", ".")}-${month === "2026-09" ? "02" : "01"}`,
        effectiveAt: `${month}-01 ${month === "2026-09" ? "09:30" : "09:00"}`,
        regions: [
          { name: "山东区域", target: shandong, salespeople: [
            { name: "陈经理", target: month === "2026-08" ? 300000 : month === "2026-09" || month === "2026-10" ? 400000 : null },
            { name: "刘经理", target: month === "2026-08" ? 300000 : month === "2026-09" ? 300000 : month === "2026-10" ? 400000 : null },
          ] },
          { name: "江苏区域", target: jiangsu, salespeople: [{ name: "周经理", target: month === "2026-08" || month === "2026-09" ? 300000 : null }] },
          { name: "浙江区域", target: zhejiang, salespeople: [{ name: "吴经理", target: month === "2026-08" ? 100000 : month === "2026-09" || month === "2026-10" ? 200000 : null }] },
        ],
      }));

      const salesTargetHistory = [
        { version: "V2026.09-02", month: "2026-09", level: "区域", object: "山东区域", before: 600000, after: 700000,
          reason: "结合本月成交计划调整", operator: "刘总", effectiveMode: "直接生效", effectiveAt: "2026-09-01 09:30" },
        { version: "V2026.09-01", month: "2026-09", level: "公司", object: "英嘉科技", before: "—", after: 1200000,
          reason: "发布九月成交金额目标", operator: "刘总", effectiveMode: "首次发布", effectiveAt: "2026-08-28 16:00" },
      ];

      // Explicit annual/quarter examples for DEC-224; no conversion of old target history.
      const salesTargetYears = [
        { year: "2026", companyTarget: 12800000, version: 1, regions: [
          { name: "山东区域", target: 6700000, quarters: [1250000,1450000,1800000,2200000], salespeople: [
            { code: "YJ004", name: "陈经理", quarters: [625000,725000,900000,1100000] },
            { code: "YJ005", name: "刘经理", quarters: [625000,725000,900000,1100000] },
          ] },
          { name: "江苏区域", target: 3760000, quarters: [750000,870000,900000,1240000], salespeople: [
            { code: "YJ006", name: "周经理", quarters: [750000,870000,900000,1240000] },
          ] },
          { name: "浙江区域", target: 2340000, quarters: [500000,580000,500000,760000], salespeople: [
            { code: "YJ012", name: "吴经理", quarters: [500000,580000,500000,760000] },
          ] },
        ] },
        { year: "2027", companyTarget: null, version: 0, regions: [
          { name: "山东区域", target: null, quarters: [null,null,null,null], salespeople: [
            { code: "YJ004", name: "陈经理", quarters: [null,null,null,null] },
            { code: "YJ005", name: "刘经理", quarters: [null,null,null,null] },
          ] },
          { name: "江苏区域", target: null, quarters: [null,null,null,null], salespeople: [
            { code: "YJ006", name: "周经理", quarters: [null,null,null,null] },
          ] },
          { name: "浙江区域", target: null, quarters: [null,null,null,null], salespeople: [
            { code: "YJ012", name: "吴经理", quarters: [null,null,null,null] },
          ] },
        ] },
      ];
      // Monthly leaves share the same stable employee identity as quarterly allocations.
      salesTargetMonths.forEach(target => target.regions.forEach(region => region.salespeople.forEach(person => {
        person.code = salesTargetYears[0].regions.find(item => item.name === region.name)?.salespeople.find(item => item.name === person.name)?.code;
      })));
      for (let month = 1; month <= 12; month++) salesTargetMonths.push({
        month: `2027-${String(month).padStart(2, "0")}`, version: 0,
        regions: salesTargetYears[1].regions.map(region => ({ name: region.name, target: null,
          salespeople: region.salespeople.map(person => ({ code: person.code, name: person.name, target: null })) })),
      });

      salesTargetYears.forEach(year=>year.regions.forEach(region=> {
        const center=regionsData.find(item=>item.scope===region.name);
        const director=employees.find(employee=>employee.name===center?.director && employee.status==="在职" && employee.accountStatus!=="停用" && employee.role==="区域总监");
        if (!director || region.salespeople.some(person=>person.code===director.code)) return;
        region.salespeople.push({code:director.code,name:director.name,quarters:[null,null,null,null]});
        salesTargetMonths.filter(month=>month.month.startsWith(year.year+"-")).forEach(month=> {
          const row=month.regions.find(item=>item.name===region.name);
          if(row && !row.salespeople.some(person=>person.code===director.code))row.salespeople.push({code:director.code,name:director.name,target:null});
        });
      }));
