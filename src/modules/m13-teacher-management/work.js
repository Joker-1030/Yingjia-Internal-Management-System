      // M13 §12, M11 §23, M12 §14, DEC-246.
      function teacherWorkActorActive() {const e=teacherEmployee();return Boolean(currentUser&&!currentUser.disabled&&e?.status==='在职'&&e.accountStatus!=='停用');}
      function teacherWorkSelf() {return teacherWorkActorActive()?teachers.find(t=>teacherIsSelf(t)):null;}
      function teacherWorkRoleAllowed(role) {
        return currentRoleTemplates().some(template=>template.name===role&&template.permissions.includes('teacher-work'));
      }
      function teacherWorkGlobalScope() {
        return teacherIsAdmin()||(teacherWorkRoleAllowed('总裁')&&teacherHasExecutiveScope());
      }
      function teacherWorkAccess() {
        return teacherWorkActorActive()&&(teacherWorkGlobalScope()||teacherIsFacultySupervisor()||
          (teacherWorkRoleAllowed('老师')&&Boolean(teacherWorkSelf()))||teacherWorkRoleAllowed('教学管理人员'));
      }
      function teacherWorkCanView(project,t) {
        if(!teacherWorkAccess()||!project||!t||!teacherProjectIds(project).includes(t.id))return false;
        if(teacherWorkGlobalScope()||teacherIsFacultySupervisor()||(teacherWorkRoleAllowed('老师')&&teacherIsSelf(t)))return true;
        const scopes=teachingManagementAssignments[teacherEmployee()?.code]||[];
        return teacherWorkRoleAllowed('教学管理人员')&&teacherCanView(t)&&
          (t.type==='内部'?scopes.includes('internal'):t.channels.some(channel=>scopes.includes(channel.kind)));
      }
      function teacherEnsureRecapTasks() {
        for(const p of projects){const stage=computeProjectStageAndTodos(p).stage;if(!['已交付','已完成'].includes(stage))continue;const deliveredAt=p.deliveredAt||(p.type==='培训项目'?p.endTime:'');if(!deliveredAt||deliveredAt.slice(0,10)<TEACHER_RECAP_EFFECTIVE_DATE)continue;
          for(const id of teacherProjectIds(p)){if(teacherById(id)?.type!=='内部'||teacherRecaps.some(x=>x.projectId===p.id&&x.teacherId===id))continue;teacherRecaps.push({id:`FP-${p.id}-${id}`,projectId:p.id,teacherId:id,status:'待填写',content:'',suggestion:'',files:[],history:[],generated:true,version:1,createdAt:deliveredAt});}}
      }
      function teacherRecapRows() {
        if(!teacherWorkAccess())return [];
        teacherEnsureRecapTasks();const self=teacherWorkSelf(),result=teacherRecaps.filter(x=>teacherWorkCanView(projectById(x.projectId),teacherById(x.teacherId)));
        if(self&&teacherWorkRoleAllowed('老师'))for(const p of projects.filter(p=>['已交付','已完成'].includes(computeProjectStageAndTodos(p).stage)&&teacherProjectIds(p).includes(self.id))){if(!result.some(x=>x.projectId===p.id&&x.teacherId===self.id))result.push({id:'',projectId:p.id,teacherId:self.id,status:'可补写',history:[],files:[],version:0});}
        return result;
      }
      let teacherWorkFilterState = { actor: null, recaps: {}, recommendations: {} };
      function teacherWorkListFilters(key) {
        if(teacherWorkFilterState.actor!==currentUser)teacherWorkFilterState={actor:currentUser,recaps:{},recommendations:{}};
        return teacherWorkFilterState[key];
      }
      function teacherRecapMatchesFilters(x,f) {
        const p=projectById(x.projectId);
        return (!f.projectCode || p.id===f.projectCode) && listFilterContains(p.name,f.projectName) &&
          (!f.customer || String(p.customerId)===f.customer) && (!f.teacher || x.teacherId===f.teacher) && (!f.status || x.status===f.status) &&
          (!f.start || Boolean(p.startTime && p.startTime.slice(0,10)>=f.start)) && (!f.end || Boolean(p.endTime && p.endTime.slice(0,10)<=f.end));
      }
      function teacherRecommendationMatchesFilters(x,f) {
        const day=String(x.createdAt || '').slice(0,10);
        return (!f.code || x.id===f.code) && listFilterContains(projectById(x.projectId)?.name,f.projectName) &&
          (!f.customer || String(x.customerId)===f.customer) && (!f.teacher || x.teacherId===f.teacher) && (!f.type || x.type===f.type) &&
          (!f.receiver || teacherRecommendationOwner(x).owner?.name===f.receiver) && (!f.status || x.status===f.status) &&
          (!f.from || Boolean(day && day>=f.from)) && (!f.to || Boolean(day && day<=f.to));
      }
      function renderTeacherWork() {
        if(!teacherWorkAccess())return forbiddenPage('授课复盘','无权查看授课复盘');
        const all=teacherRecapRows(), f=teacherWorkListFilters('recaps'), rows=all.filter(x=>teacherRecapMatchesFilters(x,f));
        const filters=listFilterFormHtml('recapListFilters',f,[['projectCode','项目编号'],['projectName','项目名称'],
          ['customer','客户公司', [...new Map(all.map(x=>[String(projectById(x.projectId).customerId),projectCustomerFacts(projectById(x.projectId))?.name || '—'])).entries()]],
          ['teacher','复盘老师',[...new Map(all.map(x=>[x.teacherId,teacherName(teacherById(x.teacherId))])).entries()]],
          ['status','状态',listFilterOptions(all.map(x=>x.status))],['start','执行开始日期','date'],['end','执行结束日期','date']]);
        return pageHead(teacherWorkSelf()?'我的复盘':'授课复盘','查看授课反馈与改进建议。')+`<section class="panel">${filters}<div class="table-wrap"><table class="teacher-recap-table" data-paged-table="m13-recaps"><colgroup><col style="width:26%"><col style="width:19%"><col style="width:17%"><col style="width:8%"><col style="width:7%"><col style="width:8%"><col style="width:15%"></colgroup><thead><tr><th>项目</th><th>客户公司</th><th>执行时间</th><th>当前阶段</th><th>复盘老师</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map(x=>{const p=projectById(x.projectId),t=teacherById(x.teacherId);return `<tr data-page-row><td><strong>${escapeHtml(p.name)}</strong><div class="list-sub">${escapeHtml(p.id)}</div></td><td>${escapeHtml(projectCustomerFacts(p)?.name||"—")}</td><td><div class="teacher-recap-time">${escapeHtml(p.startTime||"—")}</div><div class="list-sub teacher-recap-time">至 ${escapeHtml(p.endTime||"—")}</div></td><td>${computeProjectStageAndTodos(p).stage}</td><td>${escapeHtml(teacherName(t))}</td><td><span class="tag ${x.status==='已提交'?'green':'yellow'}">${x.status}</span></td><td><div class="teacher-recap-actions"><button class="btn btn-sm" data-recap-open="${p.id}" data-recap-teacher="${t.id}">${teacherIsSelf(t)?x.status==='已提交'?'查看／修改':'填写复盘':'查看'}</button>${teacherIsSelf(t)?` <button class="btn btn-sm" data-recommend-create="${p.id}">推荐商机</button>`:''}</div></td></tr>`;}).join('')||`<tr data-empty-row><td colspan="7"><div class="empty">${all.length?'未找到符合条件的复盘':'暂无可查看的复盘'}</div></td></tr>`}</tbody></table></div>${tablePagination('m13-recaps')}</section>`;
      }
      function teacherSaveRecap(projectId,teacherId,draft,version) {
        const p=projectById(projectId),t=teacherById(teacherId),before=teacherRecaps.find(x=>x.projectId===projectId&&x.teacherId===teacherId);
        if(!teacherWorkActorActive()||!teacherWorkRoleAllowed('老师')||!teacherIsSelf(t)||!teacherWorkCanView(p,t)||!['已交付','已完成'].includes(computeProjectStageAndTodos(p).stage))return {error:'当前无权提交该项目复盘'};
        if((before?.version||0)!==version)return {error:'复盘已更新，请重新打开'};
        if(!draft.content.trim())return {error:'请填写授课复盘'};
        const payload={content:draft.content.trim(),suggestion:draft.suggestion.trim(),files:draft.files};const time=salesSupportNow();
        const rec=before||{id:`FP-${projectId}-${teacherId}`,projectId,teacherId,history:[],createdAt:time,version:0};
        rec.history.push({...payload,time,actor:currentUser.name,action:before?.status==='已提交'?'修改复盘':'提交复盘'});Object.assign(rec,payload,{status:'已提交',version:rec.version+1,updatedAt:time});if(!before)teacherRecaps.push(rec);return {rec};
      }
      function openTeacherRecap(projectId,teacherId) {
        const p=projectById(projectId),t=teacherById(teacherId);if(!teacherWorkCanView(p,t))return toast('无权查看该复盘');
        teacherEnsureRecapTasks();
        const rec=teacherRecaps.find(x=>x.projectId===projectId&&x.teacherId===teacherId),own=teacherWorkRoleAllowed('老师')&&teacherIsSelf(t),actor=currentUser,version=rec?.version||0;
        openModal(`<div class="modal-head"><div class="modal-title">授课复盘</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherRecapForm"><div class="modal-body"><div class="detail-grid">${teacherInfoHtml('项目编号',p.id)}${teacherInfoHtml('项目名称',p.name)}${teacherInfoHtml('客户公司',projectCustomerFacts(p)?.name)}${teacherInfoHtml('复盘老师',teacherName(t))}${teacherInfoHtml('开始时间',p.startTime)}${teacherInfoHtml('结束时间',p.endTime)}</div>${own?`<label class="form-group"><span class="form-label">授课复盘 *</span><textarea class="input" rows="5" id="recapContent">${escapeHtml(rec?.content||'')}</textarea></label><label class="form-group"><span class="form-label">问题与改进建议</span><textarea class="input" rows="3" id="recapSuggestion">${escapeHtml(rec?.suggestion||'')}</textarea></label><label class="form-group"><span class="form-label">补充附件</span><input class="input" type="file" id="recapFiles" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"></label>`:`<div class="detail-grid">${teacherInfoHtml('授课复盘',rec?.content)}${teacherInfoHtml('问题与改进建议',rec?.suggestion)}</div>`}${(rec?.files||[]).map((f,i)=>`<button class="btn btn-sm" type="button" data-recap-file="${i}">${escapeHtml(f.name)}</button>`).join('')}<section class="teacher-work-history"><h3>修改记录</h3><div class="teacher-work-history-list" tabindex="0" role="region" aria-label="修改记录">${(rec?.history||[]).slice().reverse().map(h=>`<article class="teacher-channel-card"><strong>${escapeHtml(h.action)} · ${escapeHtml(h.actor)} · ${escapeHtml(h.time)}</strong><p>${escapeHtml(h.content)}</p><p>${escapeHtml(h.suggestion)}</p><div class="list-sub">${(h.files||[]).map(f=>escapeHtml(f.name)).join('、')}</div></article>`).join('')||'<p class="list-sub">暂无记录</p>'}</div></section><div class="field-error" id="recapError"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>关闭</button>${own?'<button class="btn btn-primary" id="recapSubmit">提交复盘</button>':''}</div></form>`);
        $('#modalLayer .modal').classList.add('teacher-profile-modal');
        document.querySelectorAll('[data-recap-file]').forEach(b=>b.onclick=()=>{if(!teacherWorkCanView(p,t))return;const f=rec.files[Number(b.dataset.recapFile)],blob=teacherResumeFiles.get(f.id);if(blob)teacherDownload(blob,f.name);});
        $('#teacherRecapForm').onsubmit=async e=>{e.preventDefault();if(!own||currentUser!==actor)return;const form=e.currentTarget,files=[...$('#recapFiles').files],button=$('#recapSubmit');button.disabled=true;let err='';if(files.length+(rec?.files?.length||0)>9||files.reduce((n,f)=>n+f.size,0)>100*1024*1024)err='附件最多9个，单次不超过100MB';for(const f of files){if(err)break;if(f.size>20*1024*1024)err='单个文件不超过20MB';else{const v=await validateProjectFile(f,{kinds:['image','document']});if(!v.ok)err=v.reason;}}if(form!==$('#teacherRecapForm')||currentUser!==actor)return;if(err){$('#recapError').textContent=err;button.disabled=false;return;}
          const newFiles=files.map((f,i)=>({id:`RF-${Date.now()}-${i}`,name:f.name,size:f.size,type:f.type})),result=teacherSaveRecap(projectId,teacherId,{content:$('#recapContent').value,suggestion:$('#recapSuggestion').value,files:[...(rec?.files||[]),...newFiles]},version);if(result.error){$('#recapError').textContent=result.error;button.disabled=false;return;}newFiles.forEach((f,i)=>teacherResumeFiles.set(f.id,files[i]));closeAllOverlays();renderPage();toast('复盘已提交');};
      }
      function teacherRecommendationCustomer(x){return customers.find(c=>c.id===x.customerId);}
      function teacherRecommendationOwner(x){const c=teacherRecommendationCustomer(x);return c?salesOwnerMatchForCustomer(c):{ok:false};}
      function teacherCanViewRecommendation(x){
        if(!teacherWorkActorActive()||!x)return false;if(teacherIsSelf(teacherById(x.teacherId)))return true;
        const c=teacherRecommendationCustomer(x);return Boolean(c&&hasPermission('opportunities')&&(currentUser.fullAccess||['总裁','市场副总'].some(r=>salesIsRole(r))||(salesIsRole('区域总监')&&companyInCurrentManagedRegion(c))||(salesIsRole('PM')&&responsibilityOwnerForCustomer(c)===currentUser.name)));
      }
      function teacherCanHandleRecommendation(x){
        if(!teacherCanViewRecommendation(x)||x.status!=='待确认'||!teacherRecommendationOwner(x).ok)return false;const c=teacherRecommendationCustomer(x);return Boolean(currentUser.fullAccess||(hasOperationPermission('opportunities.progress')&&((salesIsRole('区域总监')&&companyInCurrentManagedRegion(c))||(salesIsRole('PM')&&responsibilityOwnerForCustomer(c)===currentUser.name))));
      }
      function teacherRecommendationTabs(){return `<div class="tabs"><button class="tab ${salesListTab==='list'?'active':''}" data-sales-list-tab="list">商机列表</button><button class="tab ${salesListTab==='recommendations'?'active':''}" data-sales-list-tab="recommendations">老师推荐</button></div>`;}
      function renderTeacherRecommendations(personal=true){
        if(!teacherWorkActorActive()||(personal?!teacherWorkSelf():!hasPermission('opportunities')))return forbiddenPage('老师推荐','当前无权查看');
        const all=teacherRecommendations.filter(x=>teacherCanViewRecommendation(x)&&(!personal||teacherIsSelf(teacherById(x.teacherId))));
        const f=teacherWorkListFilters('recommendations'),rows=all.filter(x=>teacherRecommendationMatchesFilters(x,f));
        const filters=listFilterFormHtml('recommendationListFilters',f,[['code','推荐编号'],['projectName','来源项目'],
          ['customer','客户公司',[...new Map(all.map(x=>[String(x.customerId),teacherRecommendationCustomer(x)?.name || '—'])).entries()]],
          ['teacher','推荐老师',[...new Map(all.map(x=>[x.teacherId,teacherName(teacherById(x.teacherId))])).entries()]],
          ['type','类型',listFilterOptions(all.map(x=>x.type))],['receiver','当前接收人',listFilterOptions(all.map(x=>teacherRecommendationOwner(x).owner?.name))],
          ['status','状态',listFilterOptions(all.map(x=>x.status))],['from','创建日期起','date'],['to','创建日期止','date']]);
        return pageHead(personal?'我的推荐':'老师推荐','跟踪推荐需求及处理进展。')+(!personal?teacherRecommendationTabs():'')+`<section class="panel">${filters}<div class="table-wrap"><table data-paged-table="teacher-recommendations"><thead><tr><th>推荐编号</th><th>来源项目</th><th>客户公司</th><th>推荐老师</th><th>类型</th><th>当前接收人</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr data-page-row><td>${x.id}</td><td>${escapeHtml(projectById(x.projectId)?.name)}</td><td>${escapeHtml(teacherRecommendationCustomer(x)?.name)}</td><td>${escapeHtml(teacherName(teacherById(x.teacherId)))}</td><td>${escapeHtml(x.type)}</td><td>${escapeHtml(teacherRecommendationOwner(x).owner?.name||'待配置负责人')}</td><td><span class="tag ${x.status==='已转商机'?'green':x.status==='待确认'?'yellow':''}">${x.status}</span></td><td><button class="btn btn-sm" data-recommend-open="${x.id}">${teacherCanHandleRecommendation(x)?'处理':'查看'}</button>${teacherIsSelf(teacherById(x.teacherId))&&x.status==='待确认'?` <button class="btn btn-sm" data-recommend-edit="${x.id}">修改</button>`:''}</td></tr>`).join('')||`<tr data-empty-row><td colspan="8"><div class="empty">${all.length?'未找到符合条件的推荐':'暂无推荐记录'}</div></td></tr>`}</tbody></table></div>${tablePagination('teacher-recommendations')}</section>`;
      }
      function teacherSaveRecommendation(projectId,draft,id='',version=0){
        const before=id?teacherRecommendations.find(x=>x.id===id):null,p=projectById(projectId),t=teacherWorkSelf();
        if(!t||!p||!teacherProjectIds(p).includes(t.id)||!['已交付','已完成'].includes(computeProjectStageAndTodos(p).stage))return {error:'仅可推荐本人参与的已交付或已完成项目客户需求'};
        if(id&&(!before||before.teacherId!==t.id||before.projectId!==projectId||before.status!=='待确认'||before.version!==version))return {error:'推荐状态已变化，请重新打开'};
        if(!['培训商机','AI 项目商机'].includes(draft.type)||!draft.description.trim())return {error:'请选择商机类型并填写需求描述'};
        const c=customers.find(c=>c.id===p.customerId);if(!c||!salesOwnerMatchForCustomer(c).ok)return {error:'当前客户责任未配置，暂不能提交推荐'};
        const now=salesSupportNow(),x=before||{id:`TJ202611${String(teacherRecommendations.length+1).padStart(4,'0')}`,teacherId:t.id,projectId,customerId:c.id,status:'待确认',history:[],createdAt:now,version:0};
        Object.assign(x,{type:draft.type,description:draft.description.trim(),version:x.version+1});x.history.push({time:now,actor:currentUser.name,action:before?'修改推荐':'提交推荐',type:x.type,description:x.description});if(!before)teacherRecommendations.push(x);return {recommendation:x};
      }
      function openTeacherRecommendationForm(projectId,id=''){
        const t=teacherWorkSelf(),p=projectById(projectId),x=id?teacherRecommendations.find(x=>x.id===id):null;
        if(!t||!p||!teacherProjectIds(p).includes(t.id)||!['已交付','已完成'].includes(computeProjectStageAndTodos(p).stage)||x&&(x.teacherId!==t.id||x.status!=='待确认'))return toast('无权维护推荐');
        const actor=currentUser,version=x?.version||0;openModal(`<div class="modal-head"><div class="modal-title">${x?'修改推荐':'推荐商机'}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="recommendForm"><div class="modal-body"><div class="detail-grid">${teacherInfoHtml('来源项目',p.name)}${teacherInfoHtml('客户公司',customers.find(c=>c.id===p.customerId)?.name)}</div><label class="form-group"><span class="form-label">商机类型 *</span><select class="input" id="recommendType"><option value="">请选择</option>${['培训商机','AI 项目商机'].map(type=>`<option ${x?.type===type?'selected':''}>${type}</option>`).join('')}</select></label><label class="form-group"><span class="form-label">需求描述 *</span><textarea class="input" id="recommendDescription" rows="5">${escapeHtml(x?.description||'')}</textarea></label><div class="field-error" id="recommendError"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary">提交推荐</button></div></form>`);
        $('#recommendForm').onsubmit=e=>{e.preventDefault();if(currentUser!==actor)return;const result=teacherSaveRecommendation(projectId,{type:$('#recommendType').value,description:$('#recommendDescription').value},id,version);if(result.error)return $('#recommendError').textContent=result.error;closeAllOverlays();renderPage();toast('推荐已提交');};
      }
      function openTeacherRecommendation(id) {
        const x = teacherRecommendations.find(item => item.id === id);
        if (!teacherCanViewRecommendation(x)) return toast('无权查看该推荐');
        const o = opportunities.find(item => item.id === x.opportunityId), p = projectById(x.projectId);
        const version = x.version, actor = currentUser, handle = teacherCanHandleRecommendation(x);
        openModal(`<div class="modal-head"><div class="modal-title">老师推荐详情</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="detail-grid">${teacherInfoHtml('来源项目',p?.name)}${teacherInfoHtml('推荐老师',teacherName(teacherById(x.teacherId)))}${teacherInfoHtml('客户公司',teacherRecommendationCustomer(x)?.name)}${teacherInfoHtml('类型',x.type)}${teacherInfoHtml('状态',x.status)}${teacherInfoHtml('当前接收人',teacherRecommendationOwner(x).owner?.name)}${teacherInfoHtml('需求描述',x.description)}${teacherInfoHtml('创建时间',x.createdAt)}${x.reason?teacherInfoHtml('关闭原因',x.reason):''}${o?teacherInfoHtml('创建的商机',`${o.id} · ${o.name}`)+teacherInfoHtml('商机阶段',salesStageLabel(o.stage))+teacherInfoHtml('中选金额（含税，万元）',o.stage==='中选'?salesMoney(o.expectedContractAmount):'—'):''}</div>${o?`<div class="section-title">关联项目执行情况</div>${projects.filter(p=>p.opportunityId===o.id).map(p=>`<div class="teacher-channel-card">${escapeHtml(p.name)} · ${computeProjectStageAndTodos(p).stage}${projectIsVisibleToCurrentUser(p)?` <button class="btn btn-sm" data-project-open="${p.id}">项目详情</button>`:''}</div>`).join('')||'<p class="list-sub">尚未立项</p>'}`:''}<div class="field-error" id="recommendDetailError"></div></div>${handle?`<div class="modal-foot"><button class="btn" id="recommendClose">关闭推荐</button><button class="btn btn-primary" id="recommendConvert">创建商机</button></div>`:''}`);
        $('#modalLayer .modal').classList.add('teacher-profile-modal');
        bindProjectEvents();
        const check = () => currentUser === actor && teacherCanHandleRecommendation(x) && version === x.version;
        if (handle) {
          $('#recommendClose').onclick = () => {
            if (!check()) return $('#recommendDetailError').textContent = '权限或状态已变化';
            openTeacherRecommendationClose(id);
          };
          $('#recommendConvert').onclick = () => {
            if (!check() || !salesCanCreate()) return $('#recommendDetailError').textContent = '当前无新建商机权限';
            pendingTeacherRecommendationId = x.id;
            closeAllOverlays();
            salesNavigate('opportunity-create');
          };
        }
      }
      function openTeacherRecommendationClose(id) {
        const x = teacherRecommendations.find(item => item.id === id);
        if (!teacherCanHandleRecommendation(x)) return toast('权限或状态已变化');
        const actor = currentUser, version = x.version;
        openModal(`<div class="modal-head"><div class="modal-title">关闭推荐</div><button class="icon-btn close" id="recommendActionBack" aria-label="关闭">×</button></div><form id="recommendActionForm"><div class="modal-body"><div class="form-group"><label class="form-label" for="recommendCloseReason"><span class="required-marker" aria-hidden="true">*</span>关闭原因</label><textarea class="input" id="recommendCloseReason" rows="3" aria-required="true"></textarea></div><div class="field-error" id="recommendActionError" role="alert"></div></div><div class="modal-foot"><button class="btn" type="button" id="recommendActionCancel">取消</button><button class="btn btn-danger" type="submit">确认关闭推荐</button></div></form>`);
        const form = $('#recommendActionForm');
        let applied = false;
        const back = () => { closeOverlay(); openTeacherRecommendation(id); };
        $('#recommendActionBack').onclick = back;
        $('#recommendActionCancel').onclick = back;
        form.onsubmit = event => {
          event.preventDefault();
          if (applied || form !== $('#recommendActionForm')) return;
          if (currentUser !== actor || !teacherCanHandleRecommendation(x) || x.version !== version)
            return $('#recommendActionError').textContent = '推荐或权限已变化，请重新处理';
          const reason = $('#recommendCloseReason').value.trim();
          if (!reason) return $('#recommendActionError').textContent = '请填写关闭原因';
          Object.assign(x, { status: '已关闭', reason, version: x.version + 1 });
          x.history.push({ time: salesSupportNow(), actor: currentUser.name, action: '关闭推荐', reason });
          applied = true;
          closeAllOverlays(); renderPage();
          toast('推荐已关闭');
        };
      }
      function teacherWorkTodoItems(){teacherEnsureRecapTasks();if(!teacherWorkActorActive())return [];return [
        ...teacherRecaps.filter(x=>x.status==='待填写'&&teacherIsSelf(teacherById(x.teacherId))).map(x=>({icon:'复',title:'授课复盘待填写',detail:projectById(x.projectId)?.name||'',recapProjectId:x.projectId,teacherId:x.teacherId,category:'teacher-work',due:'',createdAt:x.createdAt||'',sortId:x.id,tone:'yellow',command:'填写'})),
        ...teacherRecommendations.filter(x=>x.status==='待确认'&&teacherRecommendationOwner(x).owner?.name===currentUser.name&&teacherCanHandleRecommendation(x)).map(x=>({icon:'荐',title:'老师推荐待确认',detail:teacherName(teacherById(x.teacherId))+' · '+teacherRecommendationCustomer(x)?.name,recommendationId:x.id,category:'teacher-work',due:'',createdAt:x.createdAt,sortId:x.id,tone:'yellow',command:'处理'}))];}
      function bindTeacherWorkEvents(){
        for(const [id,key,table,pairs] of [['recapListFilters','recaps','m13-recaps',[['start','end']]],['recommendationListFilters','recommendations','teacher-recommendations',[['from','to']]]]){
          const set=values=>{teacherWorkListFilters(key);teacherWorkFilterState[key]=values;if(unifiedTablePaginationStates[table])unifiedTablePaginationStates[table].page=1;};
          bindListFilterForm(id,set,()=>set({}),pairs);
        }
        document.querySelectorAll('[data-recap-open]').forEach(b=>b.onclick=()=>openTeacherRecap(b.dataset.recapOpen,b.dataset.recapTeacher));
        document.querySelectorAll('[data-recommend-create]').forEach(b=>b.onclick=()=>openTeacherRecommendationForm(b.dataset.recommendCreate));
        document.querySelectorAll('[data-recommend-open]').forEach(b=>b.onclick=()=>openTeacherRecommendation(b.dataset.recommendOpen));
        document.querySelectorAll('[data-recommend-edit]').forEach(b=>b.onclick=()=>{const x=teacherRecommendations.find(x=>x.id===b.dataset.recommendEdit);if(x)openTeacherRecommendationForm(x.projectId,x.id);});
        document.querySelectorAll('[data-teacher-todo-recap]').forEach(b=>b.onclick=()=>openTeacherRecap(b.dataset.teacherTodoRecap,b.dataset.teacherId));
        document.querySelectorAll('[data-teacher-todo-recommend]').forEach(b=>b.onclick=()=>openTeacherRecommendation(b.dataset.teacherTodoRecommend));
        document.querySelectorAll('[data-sales-list-tab]').forEach(b=>b.onclick=()=>{salesListTab=b.dataset.salesListTab;renderPage();});
      }
