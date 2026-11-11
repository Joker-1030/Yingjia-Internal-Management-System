      const TEACHER_RECAP_EFFECTIVE_DATE = '2026-11-09';
      const teacherRecaps = [];
      const teacherRecommendations = [
        {id:'TJ2026110001',teacherId:'T009',projectId:'XM2026000001',customerId:2,type:'AI 项目商机',description:'客户希望建设内部知识助手，已表达进一步沟通意向。',status:'待确认',createdAt:'2026-11-10 18:00',version:1,history:[{time:'2026-11-10 18:00',actor:'张伟',action:'提交推荐'}]},
        {id:'TJ2026110002',teacherId:'T009',projectId:'XM2026000060',customerId:2,type:'培训商机',description:'建议面向青年骨干开展管理能力提升培训。',status:'已关闭',reason:'与客户已有年度培训计划重复，后续继续跟进原商机。',createdAt:'2026-11-05 18:00',version:1,history:[{time:'2026-11-05 18:00',actor:'张伟',action:'提交推荐'},{time:'2026-11-06 10:00',actor:'陈经理',action:'关闭推荐'}]}
      ];
      let salesListTab='list';
      let pendingTeacherRecommendationId='';
