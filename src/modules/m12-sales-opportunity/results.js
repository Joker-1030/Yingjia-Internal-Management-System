      // M12 §14: support references use real opportunity/project relations, never sales KPI allocation.
      let supportResultsState = { actor:null, month:'2026-11', employee:'' };
      function salesSupportResultsCompany() { return salesSupportActorActive() && (currentUser?.fullAccess || ['总裁','市场副总'].some(salesIsRole)); }
      function salesCanViewSupportResults() { return hasPermission('support-results') && (salesSupportResultsCompany() || Boolean(salesSupportActorActive() && hasPermission('sales-supports') && salesCurrentSupportEmployee())); }
      function salesCanViewSupportOutcome(o) {
        if(!salesSupportActorActive()||!o)return false;
        return salesSupportResultsCompany() || (hasPermission('opportunities') && ((salesIsRole('区域总监')&&companyInCurrentManagedRegion(salesOpportunityCustomer(o))) || (salesIsRole('PM')&&o.owner===currentUser.name))) || Boolean(salesCurrentSupportEmployee() && (o.supports||[]).some(s=>s.assigneeCode===salesCurrentSupportEmployee().code));
      }
      function salesSupportValid(s) { return !['withdraw','stop'].includes(s.closureKind); }
      function salesOutcomeProjects(o) { return projects.filter(p=>p.opportunityId===o.id); }
      function salesOutcomeRows(employee='') {
        return opportunities.filter(salesCanViewSupportOutcome).map(o=>({o,supports:(o.supports||[]).filter(s=>salesSupportValid(s)&&(!employee||s.assigneeCode===employee)),projects:salesOutcomeProjects(o)})).filter(x=>x.supports.length);
      }
      function salesSupportMonthMetrics(month,employee='') {
        const rows=salesOutcomeRows(employee),won=new Set(),delivered=new Map();let amount=0,submissions=0;
        for(const {o,supports,projects:ps} of rows){
          for(const s of supports)submissions+=(s.deliveries||[]).filter(d=>d.time?.slice(0,7)===month).length;
          if(o.stage==='中选'&&o.selectedDate?.slice(0,7)===month&&!won.has(o.id)){won.add(o.id);amount+=Number(o.expectedContractAmount)||0;}
          for(const p of ps)if(['已交付','已完成'].includes(computeProjectStageAndTodos(p).stage)&&p.deliveredAt?.slice(0,7)===month)delivered.set(p.id,p);
        }
        return {requests:submissions,won:won.size,amount,delivered:delivered.size,days:[...delivered.values()].reduce((n,p)=>n+(Number(p.days)||0),0)};
      }
      function salesOutcomeProjectsHtml(ps) {
        return ps.length?`<div class="table-wrap"><table><thead><tr><th>项目编号</th><th>项目名称</th><th>确认天数</th><th>当前阶段</th><th>实际交付日期</th><th>操作</th></tr></thead><tbody>${ps.map(p=>`<tr><td>${p.id}</td><td>${escapeHtml(p.name)}</td><td>${Number(p.days)||0}</td><td>${computeProjectStageAndTodos(p).stage}</td><td>${p.deliveredAt?.slice(0,10)||'—'}</td><td>${projectIsVisibleToCurrentUser(p)?`<button class="link" data-project-open="${p.id}">项目详情</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">尚未关联项目</div>';
      }
      function openSalesSupportOutcome(id) {
        const o=opportunities.find(o=>o.id===id);if(!salesCanViewSupportOutcome(o))return toast('无权查看支撑结果');
        const all=salesSupportResultsCompany()||salesVisibleOpportunities().includes(o),code=salesCurrentSupportEmployee()?.code;
        const supports=(o.supports||[]).filter(s=>all||s.assigneeCode===code);
        openModal(`<div class="modal-head"><div class="modal-title">支撑业务结果</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="detail-grid">${salesField('商机名称',escapeHtml(o.name))}${salesField('商机阶段',salesStageLabel(o.stage))}${salesField('中选日期',o.selectedDate)}${salesField('成交金额（含税，万元）',o.stage==='中选'?salesMoney(o.expectedContractAmount):'—')}</div><div class="section-title">支撑请求</div>${supports.map(s=>`<div class="teacher-channel-card">${escapeHtml(s.assignee)} · ${s.status}${!salesSupportValid(s)?'（已撤回／停止，不计统计）':''}<div class="list-sub">交付记录：${(s.deliveries||[]).map(d=>escapeHtml(d.time)).join('、')||'尚未交付'}</div></div>`).join('')}<div class="section-title">关联项目</div>${salesOutcomeProjectsHtml(salesOutcomeProjects(o))}<p class="support-results-note">执行结束以“已交付”为准；取消、中止单独展示，不计正常交付。关联金额和天数仅作支撑结果参考。</p></div><div class="modal-foot"><button class="btn" data-close>关闭</button></div>`);$('#modalLayer .modal').classList.add('teacher-profile-modal');bindProjectEvents();
      }
      function renderSupportResults() {
        if(!salesCanViewSupportResults())return forbiddenPage('支撑结果与月度参考','无权查看月度统计');
        const company=salesSupportResultsCompany(),self=salesCurrentSupportEmployee();
        if(supportResultsState.actor!==currentUser)supportResultsState={actor:currentUser,month:DEMO_TODAY.slice(0,7),employee:''};
        const state=supportResultsState,employee=company?state.employee:self.code,rows=salesOutcomeRows(employee),m=salesSupportMonthMetrics(state.month,employee);
        const people=[...new Map(opportunities.flatMap(o=>(o.supports||[]).map(s=>[s.assigneeCode,s.assignee]))).entries()];
        return pageHead('支撑结果与月度参考',company?'查看公司支撑业务结果与各月事件。':'查看本人支撑业务结果与各月事件。')+`<section class="panel"><form class="toolbar filter-toolbar" id="supportResultsFilters">${filterField('统计月份',`<input class="input" type="month" id="supportResultsMonth" value="${state.month}" required>`)}${company?filterField('支撑人员',`<select class="input" id="supportResultsEmployee"><option value="">公司汇总（按对象去重）</option>${people.map(([code,name])=>`<option value="${code}" ${code===employee?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select>`):''}${filterActions('<button class="btn btn-primary">查询</button><button class="btn" type="button" id="supportResultsReset">重置</button>')}</form></section><div class="metrics support-results-metrics">${metric('支撑提交次数',m.requests,'按每次实际提交月份计次')}${metric('关联中选商机',m.won,'按中选日期与商机去重')}${metric('关联成交金额（万元）',salesMoney(m.amount),'完整关联金额，非销售KPI')}${metric('已交付项目',m.delivered,'按实际交付日期去重')}${metric('已交付确认天数',m.days,'只汇总当月交付项目')}</div><section class="panel"><div class="panel-head"><div class="panel-title">支撑业务完整链路</div><div class="panel-sub">下表展示完整关联结果，月度指标按上方所选月份计算</div></div><div class="table-wrap"><table class="support-results-table" data-paged-table="support-results"><thead><tr><th>商机编号 / 名称</th><th>支撑人员</th><th>商机阶段</th><th>中选日期</th><th>成交金额（万元）</th><th>关联项目数</th><th>项目阶段</th><th>操作</th></tr></thead><tbody>${rows.map(({o,supports,projects:ps})=>`<tr data-page-row><td>${o.id}<br>${escapeHtml(o.name)}</td><td>${[...new Set(supports.map(s=>escapeHtml(s.assignee)))].join('、')}</td><td>${salesStageLabel(o.stage)}</td><td>${o.selectedDate||'—'}</td><td>${o.stage==='中选'?salesMoney(o.expectedContractAmount):'—'}</td><td>${ps.length}</td><td>${ps.map(p=>computeProjectStageAndTodos(p).stage).join('、')||'未立项'}</td><td><button class="link" data-support-outcome="${o.id}">结果详情</button></td></tr>`).join('')||'<tr data-empty-row><td colspan="8"><div class="empty">暂无支撑结果</div></td></tr>'}</tbody></table></div>${tablePagination('support-results')}<p class="support-results-note">支撑交付、商机中选、项目交付分别计入事件发生月份。同一请求每次提交均计一次，同月多次提交分别累计，跨月按各次提交时间计入。公司金额、项目和天数按对象去重，不累计个人关联结果，不计算工资或个人销售KPI。</p></section>`;
      }
      function bindSupportResultEvents() {
        document.querySelectorAll('[data-support-outcome]').forEach(b=>b.onclick=()=>openSalesSupportOutcome(b.dataset.supportOutcome));
        const form=$('#supportResultsFilters');if(form){form.onsubmit=e=>{e.preventDefault();if(!salesCanViewSupportResults())return;supportResultsState.month=$('#supportResultsMonth').value;supportResultsState.employee=salesSupportResultsCompany()?$('#supportResultsEmployee').value:'';renderPage();};$('#supportResultsReset').onclick=()=>{supportResultsState={actor:currentUser,month:DEMO_TODAY.slice(0,7),employee:''};renderPage();};}
      }
