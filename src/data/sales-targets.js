      // Independent monetary Demo fixtures (yuan); null is unallocated, zero is an assigned amount.
      // Keep company/region budgets; enrich their existing director + PM allocation examples.
      const salesTargetPeople = [
        { name: "山东区域", people: [["YJ004","陈经理",45],["YJ005","刘经理",35],["YJ003","赵磊",20]] },
        { name: "江苏区域", people: [["YJ006","周经理",50],["YJ010","徐经理",30],["YJ008","孙倩",20]] },
        { name: "浙江区域", people: [["YJ012","吴经理",50],["YJ013","叶经理",30],["YJ011","钱峰",20]] },
      ];
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
      ].map(([month,companyTarget,...amounts]) => ({
        month,companyTarget,version:1,effectiveAt:`${month}-01 09:00`,
        regions:salesTargetPeople.map((region,index) => ({
          name:region.name,target:amounts[index],
          salespeople:region.people.map(([code,name,share]) => ({code,name,
            target:region.name === "浙江区域" && ["2026-07","2026-10","2026-11","2026-12"].includes(month)
              ? code === "YJ013" ? 0 : amounts[index] * (code === "YJ012" ? 80 : 20) / 100
              : amounts[index] * share / 100,
          })),
        })),
      }));
      const salesTargetYears = [
        {year:"2026",companyTarget:12800000,version:1,effectiveAt:"2026-01-01 09:00",
          regions:salesTargetPeople.map(region => {
            const months=salesTargetMonths.map(month=>month.regions.find(row=>row.name===region.name));
            const quarterSum = getter => [0,1,2,3].map(q=>months.slice(q*3,q*3+3).reduce((sum,row)=>sum+getter(row),0));
            return {name:region.name,target:months.reduce((sum,row)=>sum+row.target,0),
              quarters:quarterSum(row=>row.target),
              salespeople:region.people.map(([code,name])=>({code,name,
                quarters:quarterSum(row=>row.salespeople.find(person=>person.code===code).target),
              })),
            };
          }),
        },
        {year:"2027",companyTarget:null,version:0,
          regions:salesTargetPeople.map(region=>({name:region.name,target:null,quarters:[null,null,null,null],
            salespeople:region.people.map(([code,name])=>({code,name,quarters:[null,null,null,null]})),
          })),
        },
      ];
      // Q4: Shandong has two people allocated and one pending; Jiangsu awaits all personal months.
      // Quarterly amounts remain assigned; published upper levels are not blanked by pending leaves.
      salesTargetMonths.filter(month=>month.month >= "2026-10").forEach(month=> {
        month.regions.forEach(region=>region.salespeople.forEach(person=> {
          if (region.name === "江苏区域" || region.name === "山东区域" && person.code === "YJ005") person.target=null;
        }));
      });
      for(let month=1;month<=12;month++) salesTargetMonths.push({
        month:`2027-${String(month).padStart(2,"0")}`,companyTarget:null,version:0,
        regions:salesTargetPeople.map(region=>({name:region.name,target:null,
          salespeople:region.people.map(([code,name])=>({code,name,target:null})),
        })),
      });

      const salesTargetHistory = [
        {version:"V2026.09-02",month:"2026-09",level:"区域",object:"山东区域",before:600000,after:700000,
          reason:"结合本月成交计划调整",operator:"刘总",effectiveMode:"直接生效",effectiveAt:"2026-09-01 09:30"},
        {version:"V2026.09-01",month:"2026-09",level:"公司",object:"英嘉科技",before:"—",after:1200000,
          reason:"发布九月成交金额目标",operator:"刘总",effectiveMode:"首次发布",effectiveAt:"2026-08-28 16:00"},
        {period:"2026",level:"公司",object:"英嘉科技",before:"未分配",after:12800000,reason:"",operator:"刘总",effectiveMode:"首次分配",effectiveAt:"2026-01-01 09:00",version:1},
      ];
      salesTargetYears[0].regions.forEach(region=> {
        const director=regionsData.find(center=>center.scope===region.name).director;
        salesTargetHistory.push({period:"2026",level:"区域",object:region.name,before:"未分配",after:region.target,
          reason:"",operator:"王静",effectiveMode:"首次分配",effectiveAt:"2026-01-01 10:00",version:1});
        // A full quarter of per-person records exercises yearly history and existing pagination.
        region.salespeople.forEach(person=> {
          salesTargetHistory.push({period:"2026-Q3",level:"PM",object:`${region.name} / ${person.name}`,employeeCode:person.code,
            before:"未分配",after:person.quarters[2],reason:"",operator:director,effectiveMode:"首次分配",effectiveAt:"2026-07-01 09:00",version:1});
          salesTargetMonths.filter(month=>month.month >= "2026-07" && month.month <= "2026-09").forEach(month=> {
            const target=month.regions.find(row=>row.name===region.name).salespeople.find(row=>row.code===person.code).target;
            salesTargetHistory.push({period:month.month,level:"PM",object:`${region.name} / ${person.name}`,employeeCode:person.code,
              before:"未分配",after:target,reason:"",operator:director,effectiveMode:"首次分配",effectiveAt:"2026-07-01 10:00",version:1});
          });
        });
      });
      salesTargetHistory.sort((a,b)=>b.effectiveAt.localeCompare(a.effectiveAt));
