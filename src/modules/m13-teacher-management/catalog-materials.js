      // M13 §§11.1-11.3 / DEC-246. Reuse existing dialog, attachment and table presentation.
      function teacherCanManageDirections() { return teacherIsAdmin() || teacherIsFacultySupervisor() || (teacherHasExecutiveScope() && hasOperationPermission('teachers.manage')); }
      function teacherHasMarketSchedule() { return ['PM','区域总监'].some(role => currentRoleTemplateNames().includes(role)) && hasPermission('teacher-schedule') && hasOperationPermission('teachers.schedule.read'); }
      function teacherCanStandardFee(teacher) { return teacher?.type === '内部' && teacherHasMarketSchedule() && hasFieldPermission('teacher_standard_fee_view'); }
      function teacherStandardFeesHtml(teacher) { return teacherCanStandardFee(teacher) ? `<div class="section-title">对外标准课酬</div><div class="detail-grid">${teacher.teachingTypes.map(type => teacherFeeHtml(teacher.roleFees?.[type]?.standard?.fee, teacher.roleFees?.[type]?.standard?.tax, type)).join('')}</div>` : ''; }
      function openTeacherDirections() {
        if (!teacherCanManageDirections()) return toast('无权维护教学方向');
        openModal(`<div class="modal-head"><div class="modal-title">教学方向管理</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body"><div class="toolbar"><label class="form-group"><span class="form-label">新方向名称</span><input class="input" id="newTeacherDirection"></label><button class="btn btn-primary" id="addTeacherDirection">新增方向</button></div><div class="table-wrap"><table><thead><tr><th>教学方向</th><th>状态</th><th>操作</th></tr></thead><tbody>${teacherDirections.map(d=>`<tr><td>${escapeHtml(d.name)}</td><td>${d.status}</td><td><button class="btn btn-sm" data-direction-rename="${d.id}">改名</button> <button class="btn btn-sm" data-direction-toggle="${d.id}">${d.status==='启用'?'停用':'启用'}</button></td></tr>`).join('')}</tbody></table></div><div class="field-error" id="directionError"></div></div><div class="modal-foot"><button class="btn" data-close>关闭</button></div>`);
        $('#addTeacherDirection').onclick=()=>{ if(!teacherCanManageDirections())return;const name=$('#newTeacherDirection').value.trim();if(!name)return $('#directionError').textContent='请填写教学方向名称';teacherDirections.push({id:`TD${Date.now()}`,name,status:'启用'});openTeacherDirections(); };
        document.querySelectorAll('[data-direction-rename]').forEach(b=>b.onclick=()=>{const d=teacherDirections.find(x=>x.id===b.dataset.directionRename);const actor=currentUser;openModal(`<div class="modal-head"><div class="modal-title">修改方向名称</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="renameDirectionForm"><div class="modal-body">${teacherInput('教学方向 *','directionName',d.name)}<div class="field-error" id="directionError"></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary">保存</button></div></form>`);$('#renameDirectionForm').onsubmit=e=>{e.preventDefault();if(currentUser!==actor||!teacherCanManageDirections())return;const name=$('#directionName').value.trim();if(!name)return $('#directionError').textContent='请填写名称';d.name=name;renderPage();openTeacherDirections();};});
        document.querySelectorAll('[data-direction-toggle]').forEach(b=>b.onclick=()=>{const d=teacherDirections.find(x=>x.id===b.dataset.directionToggle);if(!teacherCanManageDirections())return;if(d.status==='停用'){d.status='启用';renderPage();openTeacherDirections();}else openTeacherDirectionDisable(d);});
      }
      function teacherDisableDirection(id, replacements, snapshot) {
        if(!teacherCanManageDirections())return '无权维护教学方向';
        const d=teacherDirections.find(x=>x.id===id), affected=teachers.filter(t=>t.directions.includes(id));
        if(!d||d.status!=='启用'||snapshot!==JSON.stringify(affected.map(t=>[t.id,t.version,t.directions])))return '关联资料已变化，请重新打开';
        const updates=affected.map(t=>({t,dirs:[...new Set([...t.directions.filter(x=>x!==id),...(replacements[t.id]||[])])]}));
        if(updates.some(({dirs})=>!dirs.length||dirs.some(x=>x===id||!teacherDirections.some(d=>d.id===x&&d.status==='启用'))))return '请为每位关联老师保留至少一项有效方向';
        updates.forEach(({t,dirs})=>{t.directions=dirs;t.version++;});d.status='停用';return '';
      }
      function openTeacherDirectionDisable(d) {
        if(!teacherCanManageDirections())return;
        const actor=currentUser, affected=teachers.filter(t=>t.directions.includes(d.id)), snapshot=JSON.stringify(affected.map(t=>[t.id,t.version,t.directions]));
        const options=teacherDirections.filter(x=>x.id!==d.id&&x.status==='启用');
        const choices=(key)=>options.map(x=>`<label class="choice-item"><input type="checkbox" data-direction-replacement="${key}" value="${x.id}"><span>${escapeHtml(x.name)}</span></label>`).join('');
        openModal(`<div class="modal-head"><div class="modal-title">停用教学方向</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="disableDirectionForm"><div class="modal-body"><p>停用“${escapeHtml(d.name)}”，已有项目人员安排保持。请完成关联老师的新方向分配。</p>${affected.length?`<div class="section-title">统一替代方向</div><div class="choice-grid">${choices('all')}</div><button class="btn btn-sm" type="button" id="applyDirectionAll">应用到全部老师</button><div class="table-wrap"><table><thead><tr><th>关联老师</th><th>保留方向</th><th>新增替代方向</th></tr></thead><tbody>${affected.map(t=>`<tr><td>${escapeHtml(teacherName(t))}</td><td>${t.directions.filter(x=>x!==d.id).map(teacherDirectionName).map(escapeHtml).join('、')||'无'}</td><td><div class="choice-grid">${choices(t.id)}</div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">暂无关联老师</div>'}<div class="field-error" id="directionError"></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button class="btn btn-primary">确认停用并保存</button></div></form>`);
        $('#modalLayer .modal').classList.add('teacher-profile-modal');
        if($('#applyDirectionAll'))$('#applyDirectionAll').onclick=()=>{const values=[...document.querySelectorAll('[data-direction-replacement="all"]:checked')].map(x=>x.value);document.querySelectorAll('[data-direction-replacement]').forEach(x=>{if(x.dataset.directionReplacement!=='all')x.checked=values.includes(x.value);});};
        $('#disableDirectionForm').onsubmit=e=>{e.preventDefault();if(currentUser!==actor)return;const replacements=Object.fromEntries(affected.map(t=>[t.id,[...document.querySelectorAll(`[data-direction-replacement="${t.id}"]:checked`)].map(x=>x.value)]));const err=teacherDisableDirection(d.id,replacements,snapshot);if(err)return $('#directionError').textContent=err;renderPage();openTeacherDirections();toast('教学方向已停用');};
      }
      const TEACHER_MATERIAL_CATEGORIES=['简历','身份证明','学历证明','资格证书','以往授课视频','合作协议'];
      function teacherMaterialList(t,category) { return category==='简历'?t.resumes:t.materials.filter(f=>f.category===category); }
      function teacherMissingMaterials(t) { return TEACHER_MATERIAL_CATEGORIES.filter(c=>(c!=='合作协议'||t.type==='外部')&&!teacherMaterialList(t,c).length); }
      function teacherHasAgreement(t) { return t.type==='内部'||teacherMaterialList(t,'合作协议').length>0; }
      function teacherMaterialsHtml(t, showHeading=true) {
        if(!teacherCanResume(t))return '';
        return `${showHeading?'<div class="section-title">老师资料</div>':''}<div class="teacher-material-grid">${TEACHER_MATERIAL_CATEGORIES.map(c=>`<section class="teacher-channel-card"><div class="panel-head"><strong>${c}${c==='合作协议'&&t.type==='外部'?' *':''}</strong>${teacherCanManage(t)&&teacherCanResume(t,'upload')?`<button class="btn btn-sm" data-material-upload="${t.id}" data-material-category="${c}">上传</button>`:''}</div>${teacherMaterialList(t,c).map(f=>`<div class="teacher-resume-row"><span>${escapeHtml(f.name)}<span class="list-sub"> · ${formatFileSize(f.size)}</span></span><span><button class="btn btn-sm" data-material-open="${t.id}" data-material-id="${f.id}">预览</button>${teacherCanResume(t,'download')?` <button class="btn btn-sm" data-material-download="${t.id}" data-material-id="${f.id}">下载</button>`:''}${teacherCanManage(t)&&teacherCanResume(t,'delete')?` <button class="btn btn-sm" data-material-delete="${t.id}" data-material-id="${f.id}">删除</button>`:''}</span></div>`).join('')||`<div class="list-sub">${c==='合作协议'&&t.type==='内部'?'选填，暂未上传':c==='合作协议'?'缺少合作协议，补齐后方可启用':'暂未上传'}</div>`}</section>`).join('')}</div>`;
      }
      function openTeacherMaterials(id) {
        const t=teacherById(id);
        if(!t||!teacherCanResume(t))return toast('无权访问该老师资料');
        openModal(`<div class="modal-head"><div class="modal-title">${escapeHtml(teacherName(t))} · 老师资料</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body" id="teacherMaterialsPanel">${teacherMaterialsHtml(t,false)}</div><div class="modal-foot"><button class="btn" data-close>关闭</button></div>`);
        $("#modalLayer .modal").classList.add("teacher-material-modal");
        bindTeacherCatalogMaterials();
      }
      function teacherReturnMaterials(id, fromList) { closeAllOverlays(); renderPage(); if(fromList)openTeacherMaterials(id);else openTeacherDetail(id); }
      function teacherProfileMaterialsEditor(t) {
        const canView=t?teacherCanResume(t):teacherCanCreate(),canUpload=t?teacherCanResume(t,'upload'):(teacherIsFacultySupervisor()||hasAttachmentPermission('teacher_resume_upload'));
        if(!canView)return '<div class="empty">无资料访问权限</div>';
        return `<div class="list-sub teacher-material-note">按类别添加资料，点击保存后统一上传。外部老师启用前须补齐合作协议。</div><div class="teacher-profile-materials">${TEACHER_MATERIAL_CATEGORIES.map(category=>`<section class="teacher-profile-material-row"><div class="teacher-profile-material-head"><strong>${category}</strong>${canUpload?`<label class="btn btn-sm teacher-upload-label">选择文件<input type="file" data-profile-upload="${category}" aria-label="上传${category}" multiple accept="${category==='以往授课视频'?'.mp4,.mov':'.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'}"></label>`:''}</div><div class="teacher-profile-material-files">${t?teacherMaterialList(t,category).map(file=>`<div class="teacher-profile-file" data-profile-file><span>${escapeHtml(file.name)}<span class="list-sub"> · ${formatFileSize(file.size)}</span></span><span><button type="button" class="link" data-profile-preview="${file.id}">预览</button>${teacherCanResume(t,'download')?` <button type="button" class="link" data-profile-download="${file.id}">下载</button>`:''}${teacherCanResume(t,'delete')?` <button type="button" class="link" data-profile-remove-file="${file.id}">移除</button>`:''}</span></div>`).join(''):''}<div data-profile-pending="${category}"></div></div></section>`).join('')}</div>`;
      }
      function teacherProfileMaterialAccessError(t,uploads,removed) {
        if(uploads.length && !(t?teacherCanManage(t)&&teacherCanResume(t,'upload'):teacherCanCreate()&&(teacherIsFacultySupervisor()||hasAttachmentPermission('teacher_resume_upload'))))return '无权上传老师资料';
        if(removed.size&&(!t||!teacherCanManage(t)||!teacherCanResume(t,'delete')))return '无权删除老师资料';
        if(t?.type==='外部'&&t.status==='启用'&&!teacherMaterialList(t,'合作协议').some(f=>!removed.has(f.id))&&!uploads.some(item=>item.category==='合作协议'))return '启用中的外部老师须保留至少一份合作协议，请先上传新协议';
        return '';
      }
      async function teacherValidateProfileMaterials(t,uploads,removed) {
        const accessError=teacherProfileMaterialAccessError(t,uploads,removed);if(accessError)return accessError;
        const existing=t?[...t.resumes,...t.materials].filter(file=>!removed.has(file.id)):[];
        const ordinary=uploads.filter(item=>item.category!=='以往授课视频'),videos=uploads.filter(item=>item.category==='以往授课视频');
        if(existing.filter(file=>file.category!=='以往授课视频').length+ordinary.length>9||ordinary.reduce((sum,item)=>sum+item.file.size,0)>100*1024*1024)return '普通资料合计最多9个，单次总大小不超过100MB';
        if(existing.filter(file=>file.category==='以往授课视频').length+videos.length>PROJECT_FILE_KIND_RULES.video.maxCount)return '视频最多20个';
        for(const {category,file} of uploads){
          if(!TEACHER_MATERIAL_CATEGORIES.includes(category))return '请选择有效资料类别';
          if(category!=='以往授课视频'&&file.size>20*1024*1024)return '单个文件不超过20MB';
          try{const check=await validateProjectFile(file,{kinds:category==='以往授课视频'?['video']:['image','document']});if(!check.ok)return `${category}：${check.reason}`;}catch{return '文件读取失败，请重试';}
        }
        return '';
      }
      function teacherFindMaterial(t,id) { return [...t.resumes,...t.materials].find(f=>f.id===id); }
      function teacherMaterialBlob(t,f) { return teacherResumeFiles.get(f.id)||(f.sample?teacherSampleResumeBlob():teacherResumeBlob(t,f)); }
      function teacherDownload(blob,name) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
      function openTeacherMaterial(id,fid,download=false,fromList=false,returnProfile=null) {
        const t=teacherById(id), f=t&&teacherFindMaterial(t,fid);if(!f||!teacherCanResume(t,download?'download':'view'))return toast('无权访问该资料');
        const blob=teacherMaterialBlob(t,f);if(!blob)return toast('文件暂不可用，请重新上传');if(download)return teacherDownload(blob,f.name);
        const url=URL.createObjectURL(blob),ext=fileExtension(f.name);
        openModal(`<div class="modal-head"><div class="modal-title">资料预览</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><div class="modal-body teacher-resume-preview">${ext==='.pdf'?`<iframe id="teacherMaterialContent" title="${escapeHtml(f.name)}"></iframe>`:['.jpg','.jpeg','.png'].includes(ext)?`<img id="teacherMaterialContent" alt="${escapeHtml(f.name)}">`:['.mp4','.webm','.mov'].includes(ext)?`<video id="teacherMaterialContent" controls></video>`:`<div class="detail-grid">${teacherInfoHtml('文件名称',f.name)}${teacherInfoHtml('文件大小',formatFileSize(f.size))}</div>`}</div><div class="modal-foot"><button class="btn" id="materialBack">${returnProfile?'返回编辑':fromList?'返回老师资料':'返回老师详情'}</button></div>`);
        if ($('#teacherMaterialContent')) $('#teacherMaterialContent').src=url;
        document.querySelectorAll('#modalLayer [data-close], #modalLayer .modal-mask').forEach(b=>b.addEventListener('click',()=>URL.revokeObjectURL(url),{once:true}));
        const back=()=>{URL.revokeObjectURL(url);if(returnProfile)return returnProfile();closeAllOverlays();fromList?openTeacherMaterials(id):openTeacherDetail(id);};
        $('#materialBack').onclick=back; if(returnProfile)document.querySelectorAll('#modalLayer [data-close], #modalLayer .modal-mask').forEach(button=>button.onclick=back);
      }
      function openTeacherMaterialUpload(id,category,fromList=false) {
        const t=teacherById(id);if(!TEACHER_MATERIAL_CATEGORIES.includes(category)||!teacherCanManage(t)||!teacherCanResume(t,'upload'))return;
        const actor=currentUser,version=t.version;
        openModal(`<div class="modal-head"><div class="modal-title">上传${category}</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="materialUploadForm"><div class="modal-body"><label class="form-group"><span class="form-label">${category}文件 *</span><input class="input" type="file" id="materialFiles" multiple ${category==='以往授课视频'?'accept=".mp4,.mov"':'accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"'}></label><div class="field-error" id="materialError"></div></div><div class="modal-foot"><button type="button" class="btn" id="materialCancel">取消</button><button class="btn btn-primary" id="materialSave">上传</button></div></form>`);
        $('#materialCancel').onclick=()=>{closeAllOverlays();fromList?openTeacherMaterials(id):openTeacherDetail(id);};
        $('#materialUploadForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,files=[...$('#materialFiles').files];const error=$('#materialError');if(!files.length)return error.textContent='请选择文件';$('#materialSave').disabled=true;let err='';if(category==='以往授课视频'){if(teacherMaterialList(t,category).length+files.length>PROJECT_FILE_KIND_RULES.video.maxCount)err='视频最多20个';}else if(t.resumes.length+t.materials.filter(f=>f.category!=='以往授课视频').length+files.length>9||files.reduce((n,f)=>n+f.size,0)>100*1024*1024)err='普通资料合计最多9个，单次总大小不超过100MB';
          for(const f of files){if(err)break;if(category!=='以往授课视频'&&f.size>20*1024*1024)err='单个文件不超过20MB';else {const v=await validateProjectFile(f,{kinds:category==='以往授课视频'?['video']:['image','document']});if(!v.ok)err=v.reason;}}
          if(currentUser!==actor||form!==$('#materialUploadForm'))return;if(!teacherCanManage(t)||!teacherCanResume(t,'upload')||version!==t.version)err='权限或资料已变化，请重新打开';if(err){error.textContent=err;$('#materialSave').disabled=false;return;}
          files.forEach((f,i)=>{const fid=`TM-${id}-${Date.now()}-${i}`;teacherResumeFiles.set(fid,f);(category==='简历'?t.resumes:t.materials).push({id:fid,category,name:f.name,type:f.type,size:f.size,addedBy:actor.name});});t.version++;teacherReturnMaterials(id,fromList);toast('资料已上传');};
      }
      function teacherDeleteMaterial(id,fid,version) {
        const t=teacherById(id),f=t&&teacherFindMaterial(t,fid);if(!f||!teacherCanManage(t)||!teacherCanResume(t,'delete'))return '无权删除资料';if(t.version!==version)return '资料已变化，请重新打开';
        if(f.category==='合作协议'&&t.type==='外部'&&t.status==='启用'&&teacherMaterialList(t,'合作协议').length===1)return '启用中的外部老师须保留至少一份合作协议，请先上传新协议';
        t.resumes=t.resumes.filter(x=>x!==f);t.materials=t.materials.filter(x=>x!==f);teacherResumeFiles.delete(fid);t.version++;return '';
      }
      async function teacherZip(entries) {
        const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
        const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
        for(const {name,blob} of entries){const bytes=new Uint8Array(await blob.arrayBuffer()),n=encoder.encode(name),sum=crc(bytes),h=new Uint8Array(30+n.length),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,sum,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,n.length,true);h.set(n,30);parts.push(h,bytes);const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,sum,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);c.set(n,46);central.push(c);offset+=h.length+bytes.length;}
        const size=central.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'});
      }
      function openTeacherBulkDownload() {
        const candidates=teacherListRows().filter(t=>teacherCanResume(t,'download')),actor=currentUser;
        openModal(`<div class="modal-head"><div class="modal-title">批量下载老师资料</div><button class="icon-btn close" data-close aria-label="关闭">×</button></div><form id="teacherBulkForm"><div class="modal-body"><div class="section-title">选择老师</div><div class="choice-grid">${candidates.map(t=>`<label class="choice-item"><input type="checkbox" data-bulk-teacher value="${t.id}">${escapeHtml(teacherName(t))}</label>`).join('')}</div><div class="section-title">资料类别</div><div class="choice-grid">${TEACHER_MATERIAL_CATEGORIES.map(c=>`<label class="choice-item"><input type="checkbox" data-bulk-category value="${c}" checked>${c}</label>`).join('')}</div><div id="teacherBulkMissing"></div><div class="field-error" id="teacherBulkError"></div></div><div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button class="btn btn-primary" id="teacherBulkSubmit">检查资料</button></div></form>`);
        let checked='';$('#teacherBulkForm').onsubmit=async e=>{e.preventDefault();const ids=[...document.querySelectorAll('[data-bulk-teacher]:checked')].map(x=>x.value),cats=[...document.querySelectorAll('[data-bulk-category]:checked')].map(x=>x.value),key=JSON.stringify([ids,cats]);const err=$('#teacherBulkError');if(!ids.length||!cats.length)return err.textContent='请选择老师和资料类别';const selected=ids.map(teacherById);if(currentUser!==actor||selected.some(t=>!teacherCanResume(t,'download')))return err.textContent='权限已变化，请重新选择';const missing=selected.flatMap(t=>cats.filter(c=>!teacherMaterialList(t,c).length).map(c=>`${teacherName(t)}：${c}`));
          if(checked!==key){checked=key;$('#teacherBulkMissing').innerHTML=`<div class="section-title">缺少资料</div>${missing.length?`<ul>${missing.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'<p>所选资料已齐全</p>'}`;$('#teacherBulkSubmit').textContent='下载已有资料';return;}
          const entries=selected.flatMap(t=>cats.flatMap(c=>teacherMaterialList(t,c).map(f=>({name:`${teacherName(t)}-${t.id}/${c}/${f.id}-${f.name}`.replaceAll('..','_'),blob:teacherMaterialBlob(t,f)}))));if(!entries.length)return err.textContent='没有可下载的资料';if(entries.some(x=>!x.blob))return err.textContent='部分文件不可用，请重新上传后重试';$('#teacherBulkSubmit').disabled=true;const zip=await teacherZip(entries);if(currentUser!==actor||selected.some(t=>!teacherCanResume(t,'download')))return;teacherDownload(zip,'老师投标资料.zip');closeAllOverlays();toast('资料已打包下载');};
      }
      function bindTeacherCatalogMaterials() {
        document.querySelectorAll('[data-market-teacher]').forEach(b=>b.onclick=e=>{e.preventDefault();const t=teacherScheduleContext().available.find(t=>t.id===b.dataset.marketTeacher);if(!t||!teacherHasMarketSchedule())return;openDrawer(teacherDetailHtml(t,true));});
        if($('#teacherDirectionsManage'))$('#teacherDirectionsManage').onclick=openTeacherDirections;
        if($('#teacherBulkDownload'))$('#teacherBulkDownload').onclick=openTeacherBulkDownload;
        document.querySelectorAll('[data-teacher-materials]').forEach(b=>b.onclick=()=>openTeacherMaterials(b.dataset.teacherMaterials));
        document.querySelectorAll('[data-material-upload]').forEach(b=>b.onclick=()=>openTeacherMaterialUpload(b.dataset.materialUpload,b.dataset.materialCategory,!!b.closest('#teacherMaterialsPanel')));
        document.querySelectorAll('[data-material-open]').forEach(b=>b.onclick=()=>openTeacherMaterial(b.dataset.materialOpen,b.dataset.materialId,false,!!b.closest('#teacherMaterialsPanel')));
        document.querySelectorAll('[data-material-download]').forEach(b=>b.onclick=()=>openTeacherMaterial(b.dataset.materialDownload,b.dataset.materialId,true));
        document.querySelectorAll('[data-material-delete]').forEach(b=>b.onclick=()=>{const t=teacherById(b.dataset.materialDelete),version=t?.version,actor=currentUser,fromList=!!b.closest('#teacherMaterialsPanel');teacherConfirm('删除老师资料','确认删除该资料？',()=>{if(currentUser!==actor)return;const err=teacherDeleteMaterial(t.id,b.dataset.materialId,version);if(err)$('#teacherConfirmError').textContent=err;else teacherReturnMaterials(t.id,fromList);});});
      }
