      const employees = [
        {"code": "YJ001","name": "刘总","dept": "总经办","job": "总裁","role": "总裁","scope": "公司全局","status": "在职","phone": "13900000001","email": "liuzong@yingjia.example","hireDate": "2021-03-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2021-03-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["总裁"],"manualRoles": ["总裁"],"departments": ["总经办"],"automaticRoleSources": {}},
        {"code": "YJ002","name": "王静","dept": "市场运营部","job": "市场副总","role": "市场副总","scope": "全国市场","status": "在职","phone": "13900000002","email": "wangjing@yingjia.example","hireDate": "2021-06-15","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2021-06-15 09:00","updatedAt": "2026-11-01 09:00","roles": ["市场副总"],"manualRoles": ["市场副总"],"departments": ["市场运营部"],"automaticRoleSources": {}},
        {"code": "YJ003","name": "赵磊","dept": "山东区域运营中心","job": "区域总监","role": "区域总监","scope": "山东区域","status": "在职","phone": "13900000003","email": "zhaolei@yingjia.example","hireDate": "2022-02-18","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-02-18 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["山东区域运营中心"],"automaticRoleSources": {"区域总监": [809]}},
        {"code": "YJ004","name": "陈经理","dept": "山东区域运营中心","job": "项目经理","role": "PM","scope": "济南、泰安、青岛","status": "在职","phone": "13900000004","email": "chenjingli@yingjia.example","hireDate": "2023-04-10","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-04-10 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["山东区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ005","name": "刘经理","dept": "山东区域运营中心","job": "项目经理","role": "PM","scope": "青岛、济南、烟台","status": "在职","phone": "13900000105","email": "liujingli@yingjia.example","hireDate": "2023-05-08","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-05-08 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM","商机支撑"],"manualRoles": ["PM","商机支撑"],"departments": ["山东区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ006","name": "周经理","dept": "江苏区域运营中心","job": "项目经理","role": "PM","scope": "南京","status": "在职","phone": "13900000106","email": "zhoujingli@yingjia.example","hireDate": "2023-07-17","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-07-17 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM","商机支撑"],"manualRoles": ["PM","商机支撑"],"departments": ["江苏区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ007","name": "系统管理员","dept": "系统内置账号","job": "系统管理员","role": "系统管理员","scope": "公司全局","status": "在职","phone": "13900000007","email": "admin@yingjia.example","hireDate": "2021-01-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2021-01-01 09:00","updatedAt": "2026-11-01 09:00","roles": [],"manualRoles": [],"departments": [],"automaticRoleSources": {}},
        {"code": "YJ008","name": "孙倩","dept": "江苏区域运营中心","job": "区域总监","role": "区域总监","scope": "江苏区域","status": "在职","phone": "13900000108","email": "sunqian@yingjia.example","hireDate": "2022-04-06","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-04-06 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["江苏区域运营中心"],"automaticRoleSources": {"区域总监": [810]}},
        {"code": "YJ009","name": "高经理","dept": "山东区域运营中心","job": "项目经理","role": "PM","scope": "已停用","status": "在职","phone": "13900000109","email": "gaojingli@yingjia.example","hireDate": "2022-08-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-08-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["山东区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ010","name": "徐经理","dept": "江苏区域运营中心","job": "项目经理","role": "PM","scope": "无锡、合肥","status": "在职","phone": "13900000110","email": "xujingli@yingjia.example","hireDate": "2024-01-12","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2024-01-12 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM","商机支撑"],"manualRoles": ["PM","商机支撑"],"departments": ["江苏区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ011","name": "钱峰","dept": "浙江区域运营中心","job": "区域总监","role": "区域总监","scope": "浙江区域","status": "在职","phone": "13900000111","email": "qianfeng@yingjia.example","hireDate": "2022-07-20","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-07-20 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["浙江区域运营中心"],"automaticRoleSources": {"区域总监": [812]}},
        {"code": "YJ012","name": "吴经理","dept": "浙江区域运营中心","job": "项目经理","role": "PM","scope": "杭州、宁波","status": "在职","phone": "13900000112","email": "wujingli@yingjia.example","hireDate": "2023-11-06","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-11-06 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM","商机支撑"],"manualRoles": ["PM","商机支撑"],"departments": ["浙江区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ013","name": "叶经理","dept": "浙江区域运营中心","job": "项目经理","role": "PM","scope": "温州","status": "在职","phone": "13900000113","email": "yejingli@yingjia.example","hireDate": "2024-03-18","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2024-03-18 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["浙江区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ014","name": "林哲","dept": "华南区域运营中心","job": "区域总监","role": "区域总监","scope": "华南区域","status": "在职","phone": "13900000114","email": "linzhe@yingjia.example","hireDate": "2022-10-10","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-10-10 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["华南区域运营中心"],"automaticRoleSources": {"区域总监": [811]}},
        {"code": "YJ015","name": "林经理","dept": "华南区域运营中心","job": "项目经理","role": "PM","scope": "福州","status": "在职","phone": "13900000115","email": "linjingli@yingjia.example","hireDate": "2024-02-19","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2024-02-19 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["华南区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ016","name": "梁经理","dept": "华南区域运营中心","job": "项目经理","role": "PM","scope": "广州、南宁","status": "在职","phone": "13900000116","email": "liangjingli@yingjia.example","hireDate": "2024-05-13","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2024-05-13 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["华南区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ017","name": "郑敏","dept": "市场运营部","job": "区域总监","role": "区域总监","scope": "新设运营中心","status": "在职","phone": "13900000117","email": "zhengmin@yingjia.example","hireDate": "2023-01-09","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-01-09 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["市场运营部","新设运营中心"],"automaticRoleSources": {"区域总监": [819]}},
        {"code": "YJ018","name": "李娜","dept": "综合运营部","job": "HR/人事","role": "HR/人事","scope": "公司组织","status": "在职","phone": "13900000018","email": "lina@yingjia.example","hireDate": "2022-03-14","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-03-14 09:00","updatedAt": "2026-11-01 09:00","roles": ["HR/人事"],"manualRoles": ["HR/人事"],"departments": ["综合运营部","师资管理部"],"automaticRoleSources": {}},
        {"code": "YJ019","name": "周琳","dept": "财务部","job": "财务经理","role": "普通员工","status": "在职","phone": "13900000119","email": "zhoulin@yingjia.example","hireDate": "2022-05-09","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-05-09 09:00","updatedAt": "2026-11-01 09:00","roles": [],"manualRoles": [],"departments": ["财务部"],"automaticRoleSources": {},"scope": "待配置"},
        {"code": "YJ020","name": "唐婧","dept": "咨询产品部","job": "咨询产品总监","role": "普通员工","status": "在职","phone": "13900000120","email": "tangjing@yingjia.example","hireDate": "2022-09-05","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-09-05 09:00","updatedAt": "2026-11-01 09:00","roles": [],"manualRoles": [],"departments": ["咨询产品部"],"automaticRoleSources": {},"scope": "待配置"},
        {"code": "YJ021","name": "张伟","dept": "能源事业部","job": "事业部总监","role": "老师","status": "在职","phone": "13900000121","email": "zhangwei@yingjia.example","hireDate": "2021-11-22","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2021-11-22 09:00","updatedAt": "2026-11-01 09:00","roles": ["老师"],"manualRoles": ["老师"],"departments": ["能源事业部"],"automaticRoleSources": {},"scope": "本人老师档案与排期"},
        {"code": "YJ022","name": "何晨","dept": "软件研发部","job": "研发总监","role": "普通员工","status": "在职","phone": "13900000122","email": "hechen@yingjia.example","hireDate": "2022-01-17","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-01-17 09:00","updatedAt": "2026-11-01 09:00","roles": [],"manualRoles": [],"departments": ["软件研发部"],"automaticRoleSources": {},"scope": "待配置"},
        {"code": "YJ023","name": "韩雪","dept": "师资管理部","job": "师资经理","role": "教学管理人员","status": "在职","phone": "13900000123","email": "hanxue@yingjia.example","hireDate": "2023-06-12","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-06-12 09:00","updatedAt": "2026-11-01 09:00","initialPasswordVisible": true,"roles": ["教学管理人员"],"manualRoles": ["教学管理人员"],"departments": ["师资管理部"],"automaticRoleSources": {},"scope": "分配的教学管理范围"},
        {"code": "YJ024","name": "郭凯","dept": "财务部","job": "财务经理","role": "普通员工","scope": "已停用","status": "在职","phone": "13900000124","email": "guokai@yingjia.example","hireDate": "2024-01-08","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2024-01-08 09:00","updatedAt": "2026-11-01 09:00","roles": [],"manualRoles": [],"departments": ["财务部"],"automaticRoleSources": {}},
        {"code": "YJ025","name": "华北总监","dept": "华北区域运营中心","job": "区域总监","role": "区域总监","scope": "已停用","status": "在职","phone": "13900000125","email": "huabeizongjian@yingjia.example","hireDate": "2022-01-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-01-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["华北区域运营中心"],"automaticRoleSources": {"区域总监": [813]}},
        {"code": "YJ026","name": "华中主管","dept": "华中区域运营中心","job": "项目经理","role": "区域总监","scope": "待配置负责地市","status": "在职","phone": "13900000126","email": "huazhongzhuguan@yingjia.example","hireDate": "2023-01-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2023-01-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["华中区域运营中心"],"automaticRoleSources": {"区域总监": [814]}},
        {"code": "YJ027","name": "西南总监","dept": "西南区域运营中心","job": "区域总监","role": "区域总监","scope": "西南区域","status": "在职","phone": "13900000127","email": "xinanzongjian@yingjia.example","hireDate": "2022-03-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-03-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["西南区域运营中心"],"automaticRoleSources": {"区域总监": [815]}},
        {"code": "YJ028","name": "东北总监","dept": "东北区域运营中心","job": "区域总监","role": "区域总监","scope": "东北区域","status": "在职","phone": "13900000128","email": "dongbeizongjian@yingjia.example","hireDate": "2022-05-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2022-05-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["东北区域运营中心"],"automaticRoleSources": {"区域总监": [816]}},
        {"code": "YJ029","name": "沈阳原PM","dept": "东北区域运营中心","job": "项目经理","role": "PM","scope": "已停用","status": "在职","phone": "13900000129","email": "shenyangyuanpm@yingjia.example","hireDate": "2021-06-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2021-06-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["东北区域运营中心"],"automaticRoleSources": {}},
        {"code": "YJ030","name": "支撑专员","dept": "咨询产品部","job": "方案顾问","role": "商机支撑","status": "在职","phone": "13900000030","email": "support@yingjia.example","hireDate": "2026-08-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2026-08-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["商机支撑"],"manualRoles": ["商机支撑"],"departments": ["咨询产品部"],"automaticRoleSources": {},"scope": "本人被指派方案支撑"},
        {"code": "YJ031","name": "生态专员甲","dept": "师资管理部","role": "生态合作员","status": "在职","phone": "13900000031","email": "ecology@yingjia.example","hireDate": "2026-08-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2026-08-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["生态合作员"],"manualRoles": ["生态合作员"],"departments": ["师资管理部"],"automaticRoleSources": {},"scope": "本人平台师资合作项目及商机"},
        {"code": "YJ032","name": "生态专员乙","dept": "师资管理部","role": "生态合作员","status": "在职","phone": "13900000032","email": "ecology2@yingjia.example","hireDate": "2026-08-01","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2026-08-01 09:00","updatedAt": "2026-11-01 09:00","roles": ["生态合作员"],"manualRoles": ["生态合作员"],"departments": ["师资管理部"],"automaticRoleSources": {},"scope": "本人平台师资合作项目及商机"},
        {"code": "YJ033","name": "能源总监","dept": "能源运营中心","role": "区域总监","job": "运营总监","status": "在职","phone": "13900000033","email": "energy-director@yingjia.example","hireDate": "2026-10-30","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2026-10-30 09:00","updatedAt": "2026-11-01 09:00","roles": ["区域总监"],"manualRoles": ["区域总监"],"departments": ["能源运营中心"],"automaticRoleSources": {"区域总监": [818]},"scope": "能源运营中心"},
        {"code": "YJ034","name": "能源PM甲","dept": "能源运营中心","role": "PM","job": "项目经理","status": "在职","phone": "13900000034","email": "energy-pm-a@yingjia.example","hireDate": "2026-10-30","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2026-10-30 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["能源运营中心"],"automaticRoleSources": {},"scope": "待配置负责地市"},
        {"code": "YJ035","name": "能源PM乙","dept": "能源运营中心","role": "PM","job": "项目经理","status": "在职","phone": "13900000035","email": "energy-pm-b@yingjia.example","hireDate": "2026-10-30","accountStatus": "启用","lastLogin": "2026-11-02 09:00","passwordResetAt": "2026-10-24 09:00","createdAt": "2026-10-30 09:00","updatedAt": "2026-11-01 09:00","roles": ["PM"],"manualRoles": ["PM"],"departments": ["能源运营中心"],"automaticRoleSources": {},"scope": "待配置负责地市"},
      ];
      const employeeProfiles = {
  "YJ033": [
    "13900000033",
    "energy-director@yingjia.example",
    "2026-10-30",
    "YJ002"
  ],
  "YJ034": [
    "13900000034",
    "energy-pm-a@yingjia.example",
    "2026-10-30",
    "YJ033"
  ],
  "YJ035": [
    "13900000035",
    "energy-pm-b@yingjia.example",
    "2026-10-30",
    "YJ033"
  ],
  "YJ031": [
    "13900000031",
    "ecology@yingjia.example",
    "2026-08-01",
    "YJ023"
  ],
  "YJ032": [
    "13900000032",
    "ecology2@yingjia.example",
    "2026-08-01",
    "YJ023"
  ],
  "YJ030": [
    "13900000030",
    "support@yingjia.example",
    "2026-08-01",
    "YJ020"
  ],
  "YJ001": [
    "13900000001",
    "liuzong@yingjia.example",
    "2021-03-01",
    "YJ001"
  ],
  "YJ002": [
    "13900000002",
    "wangjing@yingjia.example",
    "2021-06-15",
    "YJ001"
  ],
  "YJ003": [
    "13900000003",
    "zhaolei@yingjia.example",
    "2022-02-18",
    "YJ002"
  ],
  "YJ004": [
    "13900000004",
    "chenjingli@yingjia.example",
    "2023-04-10",
    "YJ003"
  ],
  "YJ005": [
    "13900000105",
    "liujingli@yingjia.example",
    "2023-05-08",
    "YJ003"
  ],
  "YJ006": [
    "13900000106",
    "zhoujingli@yingjia.example",
    "2023-07-17",
    "YJ008"
  ],
  "YJ007": [
    "13900000007",
    "admin@yingjia.example",
    "2021-01-01",
    "YJ001"
  ],
  "YJ008": [
    "13900000108",
    "sunqian@yingjia.example",
    "2022-04-06",
    "YJ002"
  ],
  "YJ009": [
    "13900000109",
    "gaojingli@yingjia.example",
    "2022-08-01",
    "YJ003"
  ],
  "YJ010": [
    "13900000110",
    "xujingli@yingjia.example",
    "2024-01-12",
    "YJ008"
  ],
  "YJ011": [
    "13900000111",
    "qianfeng@yingjia.example",
    "2022-07-20",
    "YJ002"
  ],
  "YJ012": [
    "13900000112",
    "wujingli@yingjia.example",
    "2023-11-06",
    "YJ011"
  ],
  "YJ013": [
    "13900000113",
    "yejingli@yingjia.example",
    "2024-03-18",
    "YJ011"
  ],
  "YJ014": [
    "13900000114",
    "linzhe@yingjia.example",
    "2022-10-10",
    "YJ002"
  ],
  "YJ015": [
    "13900000115",
    "linjingli@yingjia.example",
    "2024-02-19",
    "YJ014"
  ],
  "YJ016": [
    "13900000116",
    "liangjingli@yingjia.example",
    "2024-05-13",
    "YJ014"
  ],
  "YJ017": [
    "13900000117",
    "zhengmin@yingjia.example",
    "2023-01-09",
    "YJ002"
  ],
  "YJ018": [
    "13900000018",
    "lina@yingjia.example",
    "2022-03-14",
    "YJ001"
  ],
  "YJ019": [
    "13900000119",
    "zhoulin@yingjia.example",
    "2022-05-09",
    "YJ001"
  ],
  "YJ020": [
    "13900000120",
    "tangjing@yingjia.example",
    "2022-09-05",
    "YJ001"
  ],
  "YJ021": [
    "13900000121",
    "zhangwei@yingjia.example",
    "2021-11-22",
    "YJ001"
  ],
  "YJ022": [
    "13900000122",
    "hechen@yingjia.example",
    "2022-01-17",
    "YJ001"
  ],
  "YJ023": [
    "13900000123",
    "hanxue@yingjia.example",
    "2023-06-12",
    "YJ018"
  ],
  "YJ024": [
    "13900000124",
    "guokai@yingjia.example",
    "2024-01-08",
    "YJ019"
  ],
  "YJ025": [
    "13900000125",
    "huabeizongjian@yingjia.example",
    "2022-01-01",
    "YJ002"
  ],
  "YJ026": [
    "13900000126",
    "huazhongzhuguan@yingjia.example",
    "2023-01-01",
    "YJ002"
  ],
  "YJ027": [
    "13900000127",
    "xinanzongjian@yingjia.example",
    "2022-03-01",
    "YJ002"
  ],
  "YJ028": [
    "13900000128",
    "dongbeizongjian@yingjia.example",
    "2022-05-01",
    "YJ002"
  ],
  "YJ029": [
    "13900000129",
    "shenyangyuanpm@yingjia.example",
    "2021-06-01",
    "YJ028"
  ]
};
      const organizationDepartments = [
        {"id": 801,"name": "总经办","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ001","code": "ORG-001","sort": 10,"updatedAt": "2026-11-01 09:00"},
        {"id": 802,"name": "综合运营部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ018","code": "ORG-002","sort": 20,"updatedAt": "2026-11-01 09:00"},
        {"id": 803,"name": "财务部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ019","code": "ORG-003","sort": 30,"updatedAt": "2026-11-01 09:00"},
        {"id": 804,"name": "咨询产品部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ020","code": "ORG-004","sort": 40,"updatedAt": "2026-11-01 09:00"},
        {"id": 805,"name": "师资管理部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ018","code": "ORG-005","sort": 50,"updatedAt": "2026-11-01 09:00"},
        {"id": 806,"name": "市场运营部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ002","code": "ORG-006","sort": 60,"updatedAt": "2026-11-01 09:00"},
        {"id": 809,"name": "山东区域运营中心","parentId": 806,"type": "region","regionId": 701,"status": "启用","supervisorCode": "YJ003","code": "ORG-007","sort": 70,"updatedAt": "2026-11-01 09:00"},
        {"id": 810,"name": "江苏区域运营中心","parentId": 806,"type": "region","regionId": 702,"status": "启用","supervisorCode": "YJ008","code": "ORG-008","sort": 80,"updatedAt": "2026-11-01 09:00"},
        {"id": 811,"name": "华南区域运营中心","parentId": 806,"type": "region","regionId": 704,"status": "启用","supervisorCode": "YJ014","code": "ORG-009","sort": 90,"updatedAt": "2026-11-01 09:00"},
        {"id": 812,"name": "浙江区域运营中心","parentId": 806,"type": "region","regionId": 703,"status": "启用","supervisorCode": "YJ011","code": "ORG-010","sort": 100,"updatedAt": "2026-11-01 09:00"},
        {"id": 813,"name": "华北区域运营中心","parentId": 806,"type": "region","regionId": 705,"status": "启用","supervisorCode": "YJ025","code": "ORG-011","sort": 110,"updatedAt": "2026-11-01 09:00"},
        {"id": 814,"name": "华中区域运营中心","parentId": 806,"type": "region","regionId": 706,"status": "启用","supervisorCode": "YJ026","code": "ORG-012","sort": 120,"updatedAt": "2026-11-01 09:00"},
        {"id": 815,"name": "西南区域运营中心","parentId": 806,"type": "region","regionId": 707,"status": "启用","supervisorCode": "YJ027","code": "ORG-013","sort": 130,"updatedAt": "2026-11-01 09:00"},
        {"id": 816,"name": "东北区域运营中心","parentId": 806,"type": "region","regionId": 708,"status": "启用","supervisorCode": "YJ028","code": "ORG-014","sort": 140,"updatedAt": "2026-11-01 09:00"},
        {"id": 807,"name": "能源事业部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ021","code": "ORG-015","sort": 150,"updatedAt": "2026-11-01 09:00"},
        {"id": 808,"name": "软件研发部","parentId": null,"type": "department","status": "启用","supervisorCode": "YJ022","code": "ORG-016","sort": 160,"updatedAt": "2026-11-01 09:00"},
        {"id": 818,"name": "能源运营中心","parentId": 806,"type": "region","regionId": 709,"status": "启用","supervisorCode": "YJ033","code": "ORG-017","sort": 170,"updatedAt": "2026-11-01 09:00"},
        {"id": 819,"name": "新设运营中心","parentId": 806,"type": "region","regionId": 710,"status": "启用","supervisorCode": "YJ017","updatedAt": "2026-11-01 09:00","code": "ORG-018","sort": 180},
      ];
      const businessSystemRoles = [
        "总裁",
        "市场副总",
        "区域总监",
        "PM",
        "生态合作员",
        "HR/人事",
        "商机支撑",
        "老师",
        "教学管理人员",
      ];
