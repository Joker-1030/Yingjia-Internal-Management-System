      // M12 §14: support references use real opportunity/project relations, never sales KPI allocation.
      let supportResultsState = { actor:null, month:'2026-11', employee:'' };
      let supportProjectsState = { actor:null, selected:false, employee:'' };
      function salesSupportResultsCompany() { return salesSupportActorActive() && (currentUser?.fullAccess || ['总裁','市场副总'].some(salesIsRole)); }
      function salesSupportReferenceScope() {
        if (!salesSupportActorActive() || !hasPermission('support-results')) return { allowed:false, company:false, department:false, codes:new Set() };
        const company=salesSupportResultsCompany(), managed=departmentsManagedBy(currentUser.employeeCode);
        const names=new Set(managed.flatMap(d=>organizationDescendantNames(d.id)));
        const codes=new Set(employees.filter(e=>employeeDepartmentNames(e).some(name=>names.has(name))).map(e=>e.code));
        const self=salesCurrentSupportEmployee();if(self)codes.add(self.code);
        if(company)opportunities.forEach(o=>(o.supports||[]).forEach(s=>codes.add(s.assigneeCode)));
        return {allowed:company||managed.length>0||Boolean(self),company,department:managed.length>0,codes};
      }
      function salesCanViewSupportResults() { return salesSupportReferenceScope().allowed; }
      function salesCanProcessSupportRequests() { return salesSupportActorActive() && hasPermission('sales-supports') && Boolean(currentUser.fullAccess || salesCurrentSupportEmployee()); }
      function salesCanReadSupportRequest(o,s) {
        if(!salesSupportActorActive() || !opportunities.includes(o) || !o.supports?.includes(s))return false;
        const scope=salesSupportReferenceScope();
        return Boolean(scope.allowed&&scope.codes.has(s.assigneeCode) || salesCanProcessSupportRequests()&&(currentUser.fullAccess||s.assigneeCode===salesCurrentSupportEmployee()?.code));
      }
      function salesCanProcessSupportListRow(s) {
        return salesCanProcessSupportRequests() && Boolean(currentUser.fullAccess||s.assigneeCode===salesCurrentSupportEmployee()?.code);
      }
      function salesSupportValid(s) { return !['withdraw','stop'].includes(s.closureKind); }
      function salesSupportReferences(o, employee='') {
        const scope=salesSupportReferenceScope();
        if(!scope.allowed || employee&&!scope.codes.has(employee))return [];
        return (o?.supports||[]).filter(s=>salesSupportValid(s)&&scope.codes.has(s.assigneeCode)&&(!employee||s.assigneeCode===employee));
      }
      function salesCanViewSupportOutcome(o) { return Boolean(opportunities.includes(o)&&salesSupportReferences(o).length); }
      function salesOutcomeProjects(o) { return projects.filter(p=>p.opportunityId===o.id); }
      function salesOutcomeRows(employee='') {
        return opportunities.map(o=>({o,supports:salesSupportReferences(o,employee),projects:salesOutcomeProjects(o)})).filter(x=>x.supports.length);
      }
      function salesSupportPeople() {
        return [...new Map(salesOutcomeRows().flatMap(({supports})=>supports.map(s=>[s.assigneeCode,s.assignee]))).entries()];
      }
      function salesSupportStates() {
        if(supportResultsState.actor!==currentUser)supportResultsState={actor:currentUser,month:DEMO_TODAY.slice(0,7),employee:''};
        if(supportProjectsState.actor!==currentUser){
          supportProjectsState={actor:currentUser,selected:false,employee:''};
          appliedSupportFilters={name:'',customer:'',status:'',deadlineFrom:'',deadlineTo:'',requestCode:'',opportunityCode:'',employee:''};
          for(const key of ['m12-supports','support-results'])if(unifiedTablePaginationStates[key])unifiedTablePaginationStates[key].page=1;
        }
        if(!salesCanViewSupportResults())supportProjectsState.selected=false;
      }
      function salesSupportEmployeeFilter(id,value) {
        const scope=salesSupportReferenceScope();
        return scope.company||scope.department ? filterField('支撑人员',`<select class="input" id="${id}"><option value="">全部支撑人员</option>${salesSupportPeople().map(([code,name])=>`<option value="${escapeHtml(code)}" ${code===value?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select>`) : '';
      }
      function salesSupportProjectRows(employee='') {
        return salesOutcomeRows(employee).flatMap(({o,supports,projects:ps})=>ps.map(project=>({o,supports,project})));
      }
      function salesSupportMonthMetrics(month,employee='') {
        const rows=salesOutcomeRows(employee),supported=new Set(),won=new Set(),delivered=new Map();let amount=0,submissions=0;
        for(const {o,supports,projects:ps} of rows){
          for(const s of supports){
            const count=(s.deliveries||[]).filter(d=>d.time?.slice(0,7)===month).length;
            submissions+=count;if(count)supported.add(o.id);
          }
          if(o.stage==='中选'&&o.selectedDate?.slice(0,7)===month&&!won.has(o.id)){won.add(o.id);amount+=Number(o.expectedContractAmount)||0;}
          for(const p of ps)if(['已交付','已完成'].includes(computeProjectStageAndTodos(p).stage)&&p.deliveredAt?.slice(0,7)===month)delivered.set(p.id,p);
        }
        return {supported:supported.size,requests:submissions,won:won.size,amount,delivered:delivered.size,days:[...delivered.values()].reduce((n,p)=>n+(Number(p.days)||0),0)};
      }
      function salesOutcomeProjectsHtml(ps) {
        return ps.length?`<div class="table-wrap"><table><thead><tr><th>项目编号</th><th>项目名称</th><th>项目总金额（含税，万元）</th><th>确认天数</th><th>当前阶段</th><th>实际交付日期</th><th>操作</th></tr></thead><tbody>${ps.map(p=>`<tr><td>${p.id}</td><td>${escapeHtml(p.name)}</td><td>${formatProjectAmount(p.amount)}</td><td>${Number(p.days)||0}</td><td>${computeProjectStageAndTodos(p).stage}</td><td>${p.deliveredAt?.slice(0,10)||'—'}</td><td>${projectIsVisibleToCurrentUser(p)?`<button class="link" data-project-open="${p.id}">项目详情</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">尚未关联项目</div>';
      }
      function salesSupportOutcomeRequestsHtml(o, supports) {
        return `<div class="table-wrap"><table class="support-record-table"><thead><tr><th>请求编号</th><th>支撑人员</th><th>支撑需求</th><th>支撑状态</th><th>操作</th></tr></thead><tbody>${supports.map(s=>`<tr><td>${escapeHtml(s.id)}</td><td>${escapeHtml(s.assignee || '—')}</td><td>${escapeHtml(s.content || '—')}</td><td>${salesSupportStatusTag(s.status || '—')}</td><td><button class="link" type="button" data-support-record="${escapeHtml(s.id)}" data-support-opportunity="${escapeHtml(o.id)}">详情</button></td></tr>`).join('')}</tbody></table></div>`;
      }
      function salesCanReadOutcomeRequest(o, s) {
        return Boolean(opportunities.includes(o) && o.supports.includes(s) && salesSupportReferences(o).includes(s));
      }
      function openSupportOutcomeRequestDetail(opportunityId, supportId, resultScrollTop = 0) {
        const o=opportunities.find(item=>item.id===opportunityId),s=o?.supports.find(item=>item.id===supportId);
        if(!o || !salesCanReadOutcomeRequest(o,s))return toast('当前无法执行该支撑操作');
        const deliveries=(s.deliveries || []).map((delivery,index)=>({delivery,index})).sort((a,b)=>String(b.delivery.time || '').localeCompare(String(a.delivery.time || '')) || b.index-a.index);
        const rows=deliveries.map(({delivery,index})=>`<tr><td>${escapeHtml(delivery.time || '—')}</td><td>${escapeHtml(delivery.operator || '—')}</td><td>${escapeHtml(delivery.description || '—')}</td><td>${supportFileHtml(o,s,index) || '—'}</td></tr>`).join('');
        openModal(`<div class="modal-head"><div class="modal-title">支撑记录详情</div><button class="icon-btn close" type="button" data-support-result-back aria-label="返回支撑业务结果">×</button></div><div class="modal-body"><div class="detail-grid">${salesField('请求编号',escapeHtml(s.id))}${salesField('支撑人员',escapeHtml(s.assignee || '—'))}${salesField('支撑状态',salesSupportStatusTag(s.status || '—'))}${salesField('支撑需求',escapeHtml(s.content || '—'),'full')}</div><div class="section-title">交付记录</div><div class="table-wrap"><table class="support-deliveries-table"><thead><tr><th>提交时间</th><th>提交人</th><th>文件说明</th><th>文件附件</th></tr></thead><tbody>${rows || '<tr><td colspan="4"><div class="empty">暂无交付记录</div></td></tr>'}</tbody></table></div></div><div class="modal-foot"><button class="btn" type="button" data-support-result-back>返回支撑业务结果</button></div>`);
        $('#modalLayer .modal').classList.add('support-outcome-modal');
        const back=()=>{
          if(!salesCanViewSupportOutcome(o)){closeOverlay();return toast('当前无法执行该支撑操作');}
          openSalesSupportOutcome(o.id);
          const body=$('#modalLayer .modal-body');if(body)body.scrollTop=resultScrollTop;
        };
        document.querySelectorAll('#modalLayer [data-support-result-back], #modalLayer .modal-mask').forEach(button=>button.onclick=back);
        bindSalesSupportFileEvents();
        document.querySelectorAll('#modalLayer [data-support-file]').forEach(button=>{
          const openFile=button.onclick;
          button.onclick=event=>{
            if(!salesCanReadOutcomeRequest(o,s))return toast('当前无法执行该支撑操作');
            openFile?.(event);
          };
        });
      }
      function openSalesSupportOutcome(id) {
        const o=opportunities.find(o=>o.id===id);if(!salesCanViewSupportOutcome(o))return toast('无权查看支撑结果');
        const supports=salesSupportReferences(o);
        openModal(`<div class="modal-head"><div class="modal-title">支撑业务结果</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="detail-grid">${salesField('商机名称',escapeHtml(o.name))}${salesField('商机阶段',salesStageLabel(o.stage))}${salesField('中选日期',o.selectedDate)}</div><div class="section-title">支撑请求</div>${salesSupportOutcomeRequestsHtml(o,supports)}<div class="section-title">关联项目</div>${salesOutcomeProjectsHtml(salesOutcomeProjects(o))}<p class="support-results-note">执行结束以“已交付”为准；取消、中止单独展示，不计正常交付。关联金额和天数仅作支撑结果参考。</p></div><div class="modal-foot"><button class="btn" data-close>关闭</button></div>`);$('#modalLayer .modal').classList.add('support-outcome-modal');bindProjectEvents();
        document.querySelectorAll('#modalLayer [data-support-record]').forEach(button=>button.onclick=()=>openSupportOutcomeRequestDetail(button.dataset.supportOpportunity,button.dataset.supportRecord,$('#modalLayer .modal-body')?.scrollTop || 0));
        document.querySelectorAll('#modalLayer [data-project-open]').forEach(button=>{
          const openProject=button.onclick;
          button.onclick=event=>{closeOverlay();openProject?.(event);};
        });
      }
      function salesSupportResultMetric(label,value,help) {
        const hint=`<span class="workbench-help" tabindex="0" role="img" title="${escapeHtml(help)}" aria-label="${escapeHtml(label+'说明：'+help)}">?</span>`;
        return metric(label+hint,value,'');
      }
      function renderWorkbenchSupport() {
        if(!salesCanViewSupportResults())return '';
        salesSupportStates();
        const state=supportResultsState,m=salesSupportMonthMetrics(state.month,state.employee);
        return `<section class="panel workbench-card workbench-support"><div class="panel-head"><div class="panel-title">方案支撑概览</div></div><form class="toolbar filter-toolbar" id="supportResultsFilters">${filterField('统计月份',`<input class="input" type="month" id="supportResultsMonth" value="${state.month}" required>`)}${salesSupportEmployeeFilter('supportResultsEmployee',state.employee)}${filterActions('<button class="btn btn-primary">查询</button><button class="btn" type="button" id="supportResultsReset">重置</button>')}</form><div class="metrics support-results-metrics">${salesSupportResultMetric('本周期支持商机数',m.supported,'所选月份内有实际支撑提交的商机，按商机去重。同一商机多次提交、多请求或多人支撑，公司汇总只计1个；个人或选定人员仅取本人有效提交。各月独立；无当月提交、已撤回或停止的支撑不计。')}${salesSupportResultMetric('支撑提交次数',m.requests,'按每次实际提交时间归月。同一请求同月多次提交分别累计，补充及重新提交也各计一次，跨月按各次提交时间计入；已撤回或停止的支撑不计。')}${salesSupportResultMetric('关联中选商机',m.won,'按商机中选日期计入所选月份，按商机去重；支撑提交月份不代替中选月份。')}${salesSupportResultMetric('关联商机成交金额（含税，万元）',salesMoney(m.amount),'汇总所选月份中选商机的完整关联成交金额。公司按商机去重，不相加个人关联结果；不是个人销售KPI，不计算工资或奖金。')}${salesSupportResultMetric('已交付项目数',m.delivered,'按项目实际进入已交付日期计入所选月份，按项目去重；已完成不重复计，取消或中止不计正常交付。')}${salesSupportResultMetric('项目交付确认天数',m.days,'仅汇总所选月份实际交付项目的确认天数，按项目去重；公司不相加个人关联结果，非个人销售KPI，不计算工资或奖金。')}</div></section>`;
      }
      function salesSupportTabsHtml() {
        salesSupportStates();
        const selected=supportProjectsState.selected;
        const tabs=SALES_SUPPORT_STATUS_TABS.map(status=>{
          const value=status==='全部'?'':status,active=!selected&&appliedSupportFilters.status===value;
          return `<button class="tab${active?' active':''}" type="button" role="tab" aria-selected="${active}" data-sales-support-status="${escapeHtml(value)}">${salesSupportStatusLabel(status)}</button>`;
        }).join('');
        return `<div class="tabs sales-support-status-tabs" role="tablist" aria-label="方案支撑">${tabs}${salesCanViewSupportResults()?`<button class="tab${selected?' active':''}" type="button" role="tab" aria-selected="${selected}" id="supportProjectsTab">已立项</button>`:''}</div>`;
      }
      function supportProjectMatchesListFilters({o,project:p},f){
        return (!f.opportunityCode || o.id===f.opportunityCode) && listFilterContains(o.name,f.opportunityName) &&
          (!f.projectCode || p.id===f.projectCode) && listFilterContains(p.name,f.projectName) && (!f.stage || computeProjectStageAndTodos(p).stage===f.stage);
      }
      function renderSupportProjectResults() {
        if(!salesCanViewSupportResults())return '';
        salesSupportStates();const all=salesSupportProjectRows(supportProjectsState.employee),f=supportProjectsState.filters || {};
        const rows=all.filter(row=>supportProjectMatchesListFilters(row,f)),scope=salesSupportReferenceScope();
        const fields=[['opportunityCode','商机编号'],['opportunityName','商机名称'],['projectCode','项目编号'],['projectName','项目名称'],['stage','项目阶段',listFilterOptions(PROJECT_STAGES)]];
        if(scope.company || scope.department)fields.push(['employee','支撑人员',salesSupportPeople()]);
        const filters=listFilterFormHtml('supportProjectsFilters',{...f,employee:supportProjectsState.employee},fields);
        return `${filters}<div class="table-wrap"><table class="support-results-table" data-paged-table="support-results"><thead><tr><th>商机编号 / 名称</th><th>支撑人员</th><th>项目编号 / 名称</th><th>项目总金额（含税，万元）</th><th>项目阶段</th><th>操作</th></tr></thead><tbody>${rows.map(({o,supports,project:p})=>`<tr data-page-row><td>${o.id}<br>${escapeHtml(o.name)}</td><td>${[...new Set(supports.map(s=>escapeHtml(s.assignee)))].join('、')}</td><td>${p.id}<br>${escapeHtml(p.name)}</td><td>${formatProjectAmount(p.amount)}</td><td>${computeProjectStageAndTodos(p).stage}</td><td><button class="link" data-support-outcome="${o.id}">结果详情</button></td></tr>`).join('')||`<tr data-empty-row><td colspan="6"><div class="empty">${salesSupportProjectRows().length?'未找到符合条件的已立项项目':'暂无已立项关联项目'}</div></td></tr>`}</tbody></table></div>${tablePagination('support-results')}`;
      }
      function bindSupportResultEvents() {
        document.querySelectorAll('[data-support-outcome]').forEach(b=>b.onclick=()=>openSalesSupportOutcome(b.dataset.supportOutcome));
        const form=$('#supportResultsFilters');if(form){form.onsubmit=e=>{e.preventDefault();if(!salesCanViewSupportResults())return;supportResultsState.month=$('#supportResultsMonth').value;supportResultsState.employee=$('#supportResultsEmployee')?.value||'';renderPage();};$('#supportResultsReset').onclick=()=>{supportResultsState={actor:currentUser,month:DEMO_TODAY.slice(0,7),employee:''};renderPage();};}
        const tab=$('#supportProjectsTab');if(tab)tab.onclick=()=>{if(!salesCanViewSupportResults())return;salesSupportStates();supportProjectsState.selected=true;renderPage();};
        const setProjects=values=>{if(!salesCanViewSupportResults())return;supportProjectsState.employee=values.employee || '';supportProjectsState.filters=values;const state=unifiedTablePaginationStates['support-results'];if(state)state.page=1;};
        bindListFilterForm('supportProjectsFilters',setProjects,()=>setProjects({}));
      }
