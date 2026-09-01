      function ensurePermissionDraft(template) {
        if (!permissionDraft || permissionDraft.role !== template.name) {
          permissionDraft = {
            role: template.name,
            permissions: [...template.permissions],
            operations: [...roleOperationPermissions[template.name]],
            fields: [...roleFieldPermissions[template.name]],
            attachments: [...roleAttachmentPermissions[template.name]],
          };
          permissionChangeReason = "";
        }
        return permissionDraft;
      }

      function permissionDraftDirty(template) {
        if (!permissionDraft || permissionDraft.role !== template.name) return false;
        const same = (left, right) =>
          [...left].sort().join("|") === [...right].sort().join("|");
        return !same(permissionDraft.permissions, template.permissions) ||
          !same(permissionDraft.operations, roleOperationPermissions[template.name]) ||
          !same(permissionDraft.fields, roleFieldPermissions[template.name]) ||
          !same(permissionDraft.attachments, roleAttachmentPermissions[template.name]);
      }

      function permissionDiff(template, draft) {
        const labels = Object.fromEntries([...permissionCatalog, adminOnlyPermission]);
        const fieldLabels = Object.fromEntries(fieldPermissionCatalog);
        const operationLabels = Object.fromEntries(
          operationPermissionCatalog.map(([id, , label]) => [id, label]),
        );
        const attachmentLabels = Object.fromEntries(attachmentPermissionCatalog);
        return {
          added: draft.permissions.filter((item) => !template.permissions.includes(item)).map((item) => labels[item]),
          removed: template.permissions.filter((item) => !draft.permissions.includes(item)).map((item) => labels[item]),
          operationAdded: draft.operations.filter((item) => !roleOperationPermissions[template.name].includes(item)).map((item) => operationLabels[item]),
          operationRemoved: roleOperationPermissions[template.name].filter((item) => !draft.operations.includes(item)).map((item) => operationLabels[item]),
          fieldAdded: draft.fields.filter((item) => !roleFieldPermissions[template.name].includes(item)).map((item) => fieldLabels[item]),
          fieldRemoved: roleFieldPermissions[template.name].filter((item) => !draft.fields.includes(item)).map((item) => fieldLabels[item]),
          attachmentAdded: draft.attachments.filter((item) => !roleAttachmentPermissions[template.name].includes(item)).map((item) => attachmentLabels[item]),
          attachmentRemoved: roleAttachmentPermissions[template.name].filter((item) => !draft.attachments.includes(item)).map((item) => attachmentLabels[item]),
        };
      }

      function commitPermissionVersion(template, permissions, operations, fields, attachments, reason) {
        if (template.name === "系统管理员") {
          toast("系统管理员模板固定全权限，不允许修改");
          return false;
        }
        const history = permissionVersions[template.name];
        const currentNumber = Number(history[0].id.split("-").at(-1));
        template.permissions = [...permissions];
        roleOperationPermissions[template.name] = [...operations];
        roleFieldPermissions[template.name] = [...fields];
        roleAttachmentPermissions[template.name] = [...attachments];
        history.unshift({
          id: `PERM-${permissionRoleCodes[template.name]}-${String(currentNumber + 1).padStart(6, "0")}`,
          type: "保存",
          operator: "系统管理员",
          time: "2026-08-17 14:30",
          reason,
          permissions: [...permissions],
          operations: [...operations],
          fields: [...fields],
          attachments: [...attachments],
        });
        permissionDraft = null;
        permissionChangeReason = "";
        return true;
      }

      function renderPermissions() {
        const template =
          systemRoleTemplates.find(
            (item) => item.name === selectedPermissionRole,
          ) || systemRoleTemplates[0];
        const immutable = template.name === "系统管理员";
        const draft = immutable
          ? {
              role: template.name,
              permissions: [...template.permissions],
              operations: [...roleOperationPermissions[template.name]],
              fields: [...roleFieldPermissions[template.name]],
              attachments: [...roleAttachmentPermissions[template.name]],
            }
          : ensurePermissionDraft(template);
        const employeeCount = employees.filter(
          (employee) =>
            employee.status === "在职" &&
            employeeHasRole(employee, template.name),
        ).length;
        const versions = permissionVersions[template.name];
        const currentVersion = versions[0];
        const dirty = !immutable && permissionDraftDirty(template);
        const groups = permissionTreeGroups
          .map((group) => {
            const checkedCount = group.items.filter(([id]) => draft.permissions.includes(id)).length;
            return `<div class="permission-tree-group"><label class="permission-tree-head"><input type="checkbox" data-permission-group="${group.name}" ${checkedCount === group.items.length ? "checked" : ""} ${immutable ? "disabled" : ""}><span>${group.name}</span><span class="spacer"></span><span class="tag ${checkedCount === group.items.length ? "green" : "yellow"}">${checkedCount}/${group.items.length}</span></label>${group.items.map(([id, label, detail]) => `<label class="permission-tree-node"><input type="checkbox" data-role-permission="${id}" ${draft.permissions.includes(id) ? "checked" : ""} ${immutable ? "disabled" : ""}><span>${label}</span><small>${detail}</small></label>`).join("")}</div>`;
          })
          .join("");
        const operations = permissionCatalog
          .map(([page, label]) => {
            const items = operationPermissionCatalog.filter(
              ([, operationPage]) => operationPage === page,
            );
            if (!items.length) return "";
            return `<div class="permission-tree-group"><div class="permission-tree-head"><span>${label}</span><span class="spacer"></span><span class="tag ${draft.permissions.includes(page) ? "blue" : "yellow"}">${draft.permissions.includes(page) ? "页面已授权" : "勾选操作将自动授权页面"}</span></div>${items.map(([id, , operationLabel]) => `<label class="permission-tree-node"><input type="checkbox" data-operation-permission="${id}" data-operation-page="${page}" ${draft.operations.includes(id) ? "checked" : ""} ${immutable ? "disabled" : ""}><span>${operationLabel}</span><small>操作</small></label>`).join("")}</div>`;
          })
          .join("");
        const fields = fieldPermissionCatalog
          .map(([id, label, type, dependsOn]) => `<label class="permission-tree-node"><input type="checkbox" data-field-permission="${id}" data-field-type="${type}" ${dependsOn ? `data-field-depends="${dependsOn}"` : ""} ${draft.fields.includes(id) ? "checked" : ""} ${immutable ? "disabled" : ""}><span>${label}</span><small>${type === "edit" ? "编辑" : "查看"}${dependsOn ? " · 依赖查看" : ""}</small></label>`)
          .join("");
        const attachments = attachmentPermissionCatalog
          .map(([id, label, dependsOn]) => `<label class="permission-tree-node"><input type="checkbox" data-attachment-permission="${id}" ${dependsOn ? `data-attachment-depends="${dependsOn}"` : ""} ${draft.attachments.includes(id) ? "checked" : ""} ${immutable ? "disabled" : ""}><span>${label}</span><small>${dependsOn ? "依赖附件查看" : "附件"}</small></label>`)
          .join("");
        return (
          pageHead(
            "权限授权",
            "仅内置 admin 账号可维护非管理员角色模板；数据范围规则固定只读。",
            `<span class="tag blue">admin 专属</span>`,
          ) +
          `<section class="panel permission-workspace"><aside class="permission-column"><div class="panel-title">角色模板</div><div class="panel-sub">固定 6 个内置角色</div><input class="input" id="permissionRoleSearch" placeholder="搜索角色" style="margin-top:var(--space-3)"><div class="permission-role-list">${systemRoleTemplates.map((item) => `<button class="permission-role-item ${item.name === template.name ? "active" : ""}" data-permission-role="${item.name}" data-role-search="${item.name}${roleTemplateScopeText(item)}"><span class="avatar">${item.name[0]}</span><span><strong>${item.name}</strong><span class="list-sub">${roleTemplateScopeText(item)}</span></span><span>›</span></button>`).join("")}</div><div class="role-note" style="margin-top:var(--space-4)">系统管理员角色固定绑定唯一内置 admin 账号，不进入员工可选系统角色候选。</div></aside><div class="permission-column"><div class="panel-head" style="padding:0"><div><div class="panel-title">${template.name}权限树</div><div class="panel-sub">当前配置记录 ${currentVersion.id} · ${dirty ? `待保存 ${Object.values(permissionDiff(template, draft)).flat().length} 项变更` : "无未保存变更"}</div></div><span class="spacer"></span><span class="tag blue">${immutable ? "固定全权限" : "可编辑"}</span></div><input class="input" id="permissionTreeSearch" placeholder="搜索菜单、操作、字段或附件权限" style="margin:var(--space-3) 0">${immutable ? '<div class="role-note">系统管理员模板始终全选，不允许取消、停用、删除或转移。</div>' : ""}<div class="section-title">菜单 / 页面权限</div>${groups}<div class="section-title">操作权限</div>${operations || '<div class="role-note">先勾选页面后配置对应操作。</div>'}<div class="section-title">字段权限</div><div class="permission-tree-group">${fields}</div><div class="section-title">附件权限</div><div class="permission-tree-group">${attachments}</div>${immutable ? '<div class="role-note" style="margin-top:var(--space-4)">权限授权本身为 admin 专属，不出现在其他角色的可编辑权限树中。</div>' : `<div class="form-group" style="margin-top:var(--space-4)"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>变更原因 <span class="panel-sub">5-500 字</span></label><textarea class="input" id="permissionReason" minlength="5" maxlength="500" placeholder="说明本次调整原因">${permissionChangeReason}</textarea></div><div class="permission-actions"><button class="btn" id="discardPermissionChanges" ${dirty ? "" : "disabled"}>撤销修改</button><button class="btn btn-primary" id="saveRoleTemplate" ${dirty ? "" : "disabled"}>预览影响并保存</button></div>`}</div><aside class="permission-column"><div class="panel-head" style="padding:0"><div class="panel-title">权限详情与影响</div></div><div class="permission-summary" style="margin-top:var(--space-4)"><div class="permission-summary-item"><label>角色编码</label><strong>${permissionRoleCodes[template.name]}</strong></div><div class="permission-summary-item"><label>数据范围类型</label><strong>${roleTemplateScopeText(template)}</strong></div><div class="permission-summary-item"><label>范围计算来源</label><strong>${template.scopeSource}</strong></div><div class="permission-summary-item"><label>数据对象</label><strong>${template.objects.join("、")}</strong></div><div class="permission-summary-item"><label>关联在职员工</label><strong>${employeeCount} 人</strong></div><div class="permission-summary-item"><label>员工单独授权</label><strong>不支持</strong></div></div><div class="section-title">变更日志</div><div class="permission-history">${versions.map((version, index) => `<div class="permission-history-item"><div style="display:flex;align-items:center;gap:var(--space-2)"><strong>${version.id}</strong>${index === 0 ? '<span class="tag blue">当前</span>' : immutable ? '<span class="tag blue">审计快照</span>' : ""}</div><div class="list-sub">${version.type} · ${version.operator} · ${version.time}</div><div class="list-sub">${version.reason}</div><div class="list-sub">页面 ${version.permissions.length} · 操作 ${version.operations?.length || 0} · 字段 ${version.fields.length} · 附件 ${version.attachments?.length || 0}</div></div>`).join("")}</div></aside></section>`
        );
      }
