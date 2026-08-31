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
            customerBusinessCity(company) &&
              assignedCitiesForCurrentUser().includes(customerBusinessCity(company)),
          );
        return false;
      }

      function archiveStopApproval(item) {
        return approvals.find((approval) => approval.code === item.flowCode);
      }

      function archiveRecoveryApproval(item) {
        return approvals.find(
          (approval) => approval.code === item.recoveryFlowCode,
        );
      }

      function archiveRecoveryLock(item) {
        const approval = archiveRecoveryApproval(item);
        return approval &&
          ["pending", "paused_invalid_handler", "processing_failed"].includes(
            approval.status,
          )
          ? approval
          : null;
      }

      function archiveRestoreActionHtml(item) {
        if (
          item.status !== "已停用" ||
          !hasOperationPermission("archive.restore")
        )
          return "";
        const lock = archiveRecoveryLock(item);
        return lock
          ? ` · <button class="link" data-action="approval-detail" data-id="${lock.id}">查看恢复审批</button>`
          : ` · <button class="link" data-action="restore-object" data-id="${item.id}">申请恢复</button>`;
      }

      function renderArchive() {
        const visibleItems = archivedItems.filter(archiveVisibleToCurrentUser);
        const applicants = [...new Set(visibleItems.map((item) => item.applicant))];
        const regions = [...new Set(visibleItems.map((item) => item.region))];
        const rows = visibleItems
          .map((item) => {
            const stopApproval = archiveStopApproval(item);
            const recoveryApproval = archiveRecoveryApproval(item);
            const approvalStatus = recoveryApproval
              ? approvalStatusName(recoveryApproval.status)
              : stopApproval
                ? approvalStatusName(stopApproval.status)
                : item.approvalStatus || "已通过";
            const stopStatus = stopApproval
              ? approvalStatusName(stopApproval.status)
              : item.approvalStatus || "已通过";
            const recoveryStatus = recoveryApproval
              ? `${approvalStatusName(recoveryApproval.status)} · ${recoveryApproval.code}`
              : item.recoveryStatus || "未申请";
            return `<tr data-search="${item.name}${item.type}${item.parent}" data-type="${item.type}" data-status="${item.status}" data-approval-status="${approvalStatus}" data-applicant="${item.applicant}" data-region="${item.region}" data-apply-date="${item.date}" data-effective-date="${(item.effectiveAt || "").slice(0, 10)}"><td><span class="tag blue">${item.type}</span><div><strong>${item.name}</strong></div>${item.type === "集团公司" ? `<div class="list-sub">${item.businessNumber || item.groupSnapshot?.groupNumber || "—"}</div>` : ""}</td><td>${item.parent}<div class="list-sub">${item.region}</div></td><td>${item.reason}</td><td>${item.applicant}</td><td><button class="link" data-action="archive-audit" data-id="${item.id}">${item.flowCode}</button><div class="list-sub">${stopStatus}</div></td><td>${item.effectiveAt || "—"}</td><td><span class="tag ${item.status === "已停用" ? "red" : "green"}">${item.status}</span></td><td>${recoveryStatus}</td><td><button class="link" data-action="archive-audit" data-id="${item.id}">详情</button>${archiveRestoreActionHtml(item)}</td></tr>`;
          })
          .join("");
        return (
          pageHead(
            "停用记录",
            "统一查看集团、客户单位、关键人和客户部门的停用影响、审批及恢复记录。",
          ) +
          `<section class="panel"><div class="toolbar" style="flex-wrap:wrap"><select class="input" id="archiveType"><option value="">全部对象类型</option><option>集团公司</option><option>客户单位</option><option>关键人</option><option>客户部门</option></select><input class="input" id="archiveSearch" maxlength="100" placeholder="对象名称关键词"><select class="input" id="archiveStatus"><option value="current" selected>当前停用对象（默认）</option><option value="">全部业务状态</option><option>正常</option><option>已停用</option></select><select class="input" id="archiveApprovalStatus"><option value="">全部审批状态</option><option>审批中</option><option>已通过</option><option>已驳回</option><option>已撤回</option><option>已通过-业务处理失败</option></select><select class="input" id="archiveApplicant"><option value="">全部申请人</option>${applicants.map((name) => `<option>${name}</option>`).join("")}</select><select class="input" id="archiveRegion"><option value="">全部区域</option>${regions.map((name) => `<option>${name}</option>`).join("")}</select><input class="input" id="archiveApplyStart" type="date" title="申请日期起"><input class="input" id="archiveApplyEnd" type="date" title="申请日期止"><input class="input" id="archiveEffectiveStart" type="date" title="生效日期起"><input class="input" id="archiveEffectiveEnd" type="date" title="生效日期止"><button class="btn" id="resetArchiveFilters" type="button">重置</button><span class="spacer"></span><span class="panel-sub" id="archiveFilterCount">共 ${visibleItems.filter((item) => item.status === "已停用").length} 条</span></div><div class="table-wrap"><table style="min-width:1500px"><thead><tr><th>对象类型 / 名称</th><th>所属范围</th><th>停用原因</th><th>申请人</th><th>停用流程 / 审批状态</th><th>停用生效时间</th><th>业务状态</th><th>恢复审批状态</th><th>操作</th></tr></thead><tbody id="archiveBody">${rows || '<tr data-empty-row><td colspan="9"><div class="empty">暂无停用记录</div></td></tr>'}</tbody></table></div></section>`
        );
      }
