      function archivedBusinessObject(item) {
        if (item.targetKind === "customer")
          return customers.find((object) => object.id === item.targetId);
        if (item.targetKind === "contact")
          return contacts.find((object) => object.id === item.targetId);
        if (item.targetKind === "department")
          return customerDepartments.find((object) => object.id === item.targetId);
        return null;
      }

      function archiveVisibleToCurrentUser() {
        return Boolean(
          currentUser?.fullAccess && hasOperationPermission("archive.view"),
        );
      }

      function archiveRestoreActionHtml(item) {
        if (
          item.status !== "已停用" ||
          !currentUser?.fullAccess ||
          !hasOperationPermission("archive.restore")
        )
          return "";
        return ` · <button class="link" data-action="restore-object" data-id="${item.id}">恢复</button>`;
      }

      function renderArchive() {
        const visibleItems = archivedItems
          .filter(archiveVisibleToCurrentUser)
          .sort((a, b) =>
            String(b.effectiveAt || "").localeCompare(
              String(a.effectiveAt || ""),
            ),
          );
        const operators = [
          ...new Set(visibleItems.map((item) => item.operator || item.applicant)),
        ];
        const regions = [...new Set(visibleItems.map((item) => item.region))];
        const rows = visibleItems
          .map((item) => {
            const operator = item.operator || item.applicant || "—";
            const recoveryResult =
              item.recoveryResult || (item.recoveredAt ? "已恢复" : "未恢复");
            return `<tr data-page-row data-search="${item.name}${item.type}${item.parent}" data-type="${item.type}" data-status="${item.status}" data-operator="${operator}" data-region="${item.region}" data-effective-date="${(item.effectiveAt || "").slice(0, 10)}"><td><span class="tag blue">${item.type}</span></td><td><strong>${item.name}</strong>${item.type === "集团公司" ? `<div class="list-sub">${item.businessNumber || item.groupSnapshot?.groupNumber || "—"}</div>` : ""}</td><td>${item.parent}</td><td>${item.region}</td><td>${item.reason}</td><td>${operator}</td><td>${item.effectiveAt || "—"}</td><td><span class="tag ${item.status === "已停用" ? "red" : "green"}">${item.status}</span></td><td>${recoveryResult}</td><td><button class="link" data-action="archive-audit" data-id="${item.id}">详情</button>${archiveRestoreActionHtml(item)}</td></tr>`;
          })
          .join("");
        return (
          pageHead(
            "停用记录",
            "统一查看集团、客户单位、关键人和客户部门的停用影响、生效及恢复记录。",
          ) +
          `<section class="panel"><div class="toolbar" style="flex-wrap:wrap"><select class="input" id="archiveType"><option value="">全部对象类型</option><option>集团公司</option><option>客户单位</option><option>关键人</option><option>客户部门</option></select><input class="input" id="archiveSearch" maxlength="100" placeholder="对象名称关键词"><select class="input" id="archiveStatus"><option value="current" selected>当前停用对象（默认）</option><option value="">全部业务状态</option><option>正常</option><option>已停用</option></select><select class="input" id="archiveOperator"><option value="">全部操作人</option>${operators.map((name) => `<option>${name}</option>`).join("")}</select><select class="input" id="archiveRegion"><option value="">全部区域</option>${regions.map((name) => `<option>${name}</option>`).join("")}</select><input class="input" id="archiveEffectiveStart" type="date" title="生效日期起"><input class="input" id="archiveEffectiveEnd" type="date" title="生效日期止">${filterActions('<button class="btn btn-primary" id="applyArchiveFilters" type="button">筛选</button><button class="btn" id="resetArchiveFilters" type="button">重置</button>')}</div><div class="table-wrap"><table data-paged-table="m05-archive" style="min-width:1420px"><thead><tr><th>对象类型</th><th>对象名称</th><th>所属对象</th><th>所属区域</th><th>停用原因</th><th>实际操作人</th><th>停用生效时间</th><th>业务状态</th><th>恢复结果</th><th>操作</th></tr></thead><tbody id="archiveBody">${rows || '<tr data-empty-row><td colspan="10"><div class="empty">暂无停用记录</div></td></tr>'}<tr data-filter-empty style="display:none"><td colspan="10"><div class="empty">未找到符合条件的停用记录，请调整条件或重置筛选</div></td></tr></tbody></table></div>${tablePagination("m05-archive")}</section>`
        );
      }
