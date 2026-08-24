      function archivedBusinessObject(item) {
        if (item.targetKind === "customer")
          return customers.find((object) => object.id === item.targetId);
        if (item.targetKind === "contact")
          return contacts.find((object) => object.id === item.targetId);
        if (item.targetKind === "department")
          return customerDepartments.find((object) => object.id === item.targetId);
        return null;
      }

      function archiveVisibleToCurrentUser(item) {
        if (
          !currentUser ||
          currentUser.role === "hr" ||
          !hasOperationPermission("archive.view")
        )
          return false;
        if (
          currentUser.fullAccess ||
          ["president", "vp"].includes(currentUser.role)
        )
          return true;
        if (["group", "department"].includes(item.targetKind)) return false;
        const object = archivedBusinessObject(item);
        const company =
          item.targetKind === "contact"
            ? customers.find((candidate) => candidate.name === object?.company)
            : object;
        if (currentUser.role === "director")
          return regionsMatch(company?.region || item.region, currentUser.region);
        if (currentUser.role === "pm")
          return Boolean(
            company?.city && assignedCitiesForCurrentUser().includes(company.city),
          );
        return false;
      }

      function renderArchive() {
        const visibleItems = archivedItems.filter(archiveVisibleToCurrentUser);
        const applicants = [...new Set(visibleItems.map((item) => item.applicant))];
        const regions = [...new Set(visibleItems.map((item) => item.region))];
        return (
          pageHead(
            "停用记录",
            "统一查看集团、客户单位、关键人和客户部门的停用影响、审批及恢复记录。",
          ) +
          `<section class="panel"><div class="toolbar" style="flex-wrap:wrap"><select class="input" id="archiveType"><option value="">全部对象类型</option><option>集团公司</option><option>客户单位</option><option>关键人</option><option>客户部门</option></select><input class="input" id="archiveSearch" maxlength="100" placeholder="对象名称关键词"><select class="input" id="archiveStatus"><option value="current" selected>当前停用对象（默认）</option><option value="">全部业务状态</option><option>停用审批中</option><option>已停用</option><option>恢复审批中</option></select><select class="input" id="archiveApprovalStatus"><option value="">全部审批状态</option><option>审批中</option><option>已通过</option><option>已驳回/撤回</option></select><select class="input" id="archiveApplicant"><option value="">全部申请人</option>${applicants.map((name) => `<option>${name}</option>`).join("")}</select><select class="input" id="archiveRegion"><option value="">全部区域</option>${regions.map((name) => `<option>${name}</option>`).join("")}</select><input class="input" id="archiveApplyStart" type="date" title="申请日期起"><input class="input" id="archiveApplyEnd" type="date" title="申请日期止"><input class="input" id="archiveEffectiveStart" type="date" title="生效日期起"><input class="input" id="archiveEffectiveEnd" type="date" title="生效日期止"><button class="btn" id="resetArchiveFilters" type="button">重置</button><span class="spacer"></span><span class="panel-sub" id="archiveFilterCount">共 ${visibleItems.filter((item) => item.status !== "停用审批中").length} 条</span></div><div class="table-wrap"><table style="min-width:1500px"><thead><tr><th>对象类型 / 名称</th><th>所属范围</th><th>停用原因</th><th>申请人</th><th>流程编号</th><th>停用生效时间</th><th>当前状态</th><th>恢复审批状态</th><th>操作</th></tr></thead><tbody id="archiveBody">${visibleItems.map((x) => `<tr data-search="${x.name}${x.type}${x.parent}" data-type="${x.type}" data-status="${x.status}" data-approval-status="${x.approvalStatus || (x.status === "恢复审批中" ? "审批中" : "已通过")}" data-applicant="${x.applicant}" data-region="${x.region}" data-apply-date="${x.date}" data-effective-date="${(x.effectiveAt || "").slice(0, 10)}"><td><span class="tag blue">${x.type}</span><div><strong>${x.name}</strong></div></td><td>${x.parent}<div class="list-sub">${x.region}</div></td><td>${x.reason}</td><td>${x.applicant}</td><td><button class="link" data-action="archive-audit" data-id="${x.id}">${x.flowCode}</button></td><td>${x.effectiveAt || "—"}</td><td><span class="tag ${x.status === "已停用" ? "red" : "yellow"}">${x.status}</span></td><td>${x.recoveryStatus || "未申请"}</td><td><button class="link" data-action="archive-audit" data-id="${x.id}">详情</button>${x.status === "已停用" && hasOperationPermission("archive.restore") ? ` · <button class="link" data-action="restore-object" data-id="${x.id}">申请恢复</button>` : ""}</td></tr>`).join("") || '<tr data-empty-row><td colspan="9"><div class="empty">暂无停用记录</div></td></tr>'}</tbody></table></div></section>`
        );
      }

