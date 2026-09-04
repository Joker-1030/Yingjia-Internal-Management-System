      function openEmployeeEditForm(index) {
        if (!canEmployeeAction("employees.edit_employee"))
          return toast("当前角色对员工档案仅有只读权限");
        const employee = employees[index];
        if (!employee || employee.role === "系统管理员")
          return toast("该账号不在员工档案编辑范围内");
        const currentDepartments = employeeDepartmentNames(employee);
        const currentManualRoles = employee.manualRoles || employee.roles || [];
        openModal(
          `<div class="modal-head"><div class="modal-title">编辑员工</div><button class="icon-btn close" data-close>×</button></div><form id="employeeEditForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>姓名</label><input class="input" id="eeName" value="${employee.name}" minlength="2" maxlength="50" required></div><div class="form-group"><label class="form-label">工号</label><input class="input" value="${employee.code}" disabled><div class="list-sub">永久唯一，不可修改</div></div><div class="form-group"><label class="form-label">当前手机号</label><input class="input" value="${displayEmployeePhone(employee)}" disabled></div><div class="form-group"><label class="form-label">新手机号</label><input class="input" id="eeNewPhone" inputmode="numeric" pattern="1[3-9][0-9]{9}" maxlength="11" placeholder="不修改请留空"></div><div class="form-group"><label class="form-label">企业邮箱</label><input class="input" id="eeEmail" type="email" maxlength="254" value="${employee.email || ""}"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>入职日期</label><input class="input" id="eeHireDate" type="date" max="${DEMO_TODAY}" value="${employee.hireDate}" required></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>所属部门 <span class="panel-sub">可多选，不设主部门</span></label><div class="choice-grid">${organizationDepartments.filter((item) => item.status === "启用").map((department) => `<label class="choice-item"><input type="checkbox" data-edit-department value="${department.name}" ${currentDepartments.includes(department.name) ? "checked" : ""}><span>${department.name}</span></label>`).join("")}</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>系统角色 <span class="panel-sub">1-5 个</span></label><div class="choice-grid">${["总裁", "市场副总", "区域总监", "PM", "HR/人事"].map((role) => `<label class="choice-item"><input type="checkbox" data-edit-role value="${role}" ${currentManualRoles.includes(role) ? "checked" : ""}><span>${role}</span></label>`).join("")}</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>更正原因</label><textarea class="input" id="eeReason" minlength="5" maxlength="500" required></textarea></div></div><div class="role-note">部门关系平级；保存后立即生效并记录前后值，不创建调岗流程、审批、待办或抄送。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存并立即生效</button></div></form>`,
        );
        document.querySelectorAll("[data-edit-role]").forEach(
          (input) =>
            (input.onchange = (event) => {
              if (document.querySelectorAll("[data-edit-role]:checked").length > 5) {
                event.target.checked = false;
                toast("系统角色最多选择 5 个");
              }
            }),
        );
        $("#employeeEditForm").onsubmit = (event) => {
          event.preventDefault();
          const departments = [...document.querySelectorAll("[data-edit-department]:checked")].map((input) => input.value);
          const manualRoles = [...document.querySelectorAll("[data-edit-role]:checked")].map((input) => input.value);
          if (!departments.length) return toast("请至少选择一个所属部门");
          if (!manualRoles.length) return toast("请至少选择一个系统角色");
          const newPhone = $("#eeNewPhone").value.trim();
          const phone = newPhone || employee.phone;
          const email = $("#eeEmail").value.trim().toLowerCase();
          if (newPhone && !/^1[3-9][0-9]{9}$/.test(newPhone))
            return toast("请输入 11 位新手机号，或留空保持不变");
          if (employees.some((item) => item.code !== employee.code && item.phone === phone))
            return toast("手机号已被其他员工或历史账号使用");
          if (email && employees.some((item) => item.code !== employee.code && item.email?.toLowerCase() === email))
            return toast("企业邮箱已被其他员工使用");
          const before = `${employee.name}；部门 ${currentDepartments.join("、")}；系统角色 ${currentManualRoles.join("、") || "无"}`;
          Object.assign(employee, {
            name: $("#eeName").value.trim(),
            phone,
            email,
            hireDate: $("#eeHireDate").value,
            manualRoles,
            roles: manualRoles,
            role: manualRoles[0] || "普通员工",
            updatedAt: recordCreatedAt(),
          });
          setEmployeeDepartments(employee, departments);
          syncEmployeeAccount(employee);
          recordOrganizationChange({
            date: recordCreatedAt(),
            object: `${employee.name} · ${employee.code}`,
            type: "员工档案与组织关系编辑",
            detail: `${before} → ${employee.name}；部门 ${departments.join("、")}；系统角色 ${manualRoles.join("、")}；原因：${$("#eeReason").value.trim()}`,
            operator: currentUser.name,
            status: "已生效",
          });
          closeOverlay();
          renderPage();
          toast("员工档案、部门和系统角色已立即生效");
        };
      }

      function openEmployeeForm() {
        if (!canEmployeeAction("employees.create_employee"))
          return toast("当前角色对组织与员工仅有只读权限");
        openModal(
          `<div class="modal-head"><div class="modal-title">新增员工</div><button class="icon-btn close" data-close>×</button></div><form id="employeeForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>姓名</label><input class="input" id="efName" required minlength="2" maxlength="50"></div><div class="form-group"><label class="form-label">工号</label><input class="input" value="保存后自动生成" disabled><div class="list-sub">YJ + 4 位公司流水，不可修改</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>手机号（登录账号）</label><input class="input" id="efPhone" required inputmode="numeric" autocomplete="tel" pattern="1[3-9][0-9]{9}" maxlength="11" placeholder="11 位手机号"></div><div class="form-group"><label class="form-label">企业邮箱</label><input class="input" id="efEmail" type="email" maxlength="254" placeholder="name@company.com"></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>入职日期</label><input class="input" id="efHireDate" type="date" max="${DEMO_TODAY}" value="${DEMO_TODAY}" required></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>所属部门 <span class="panel-sub">可多选，不设主部门</span></label><div class="choice-grid">${organizationDepartments.filter((item) => item.status === "启用").map((department) => `<label class="choice-item"><input type="checkbox" data-employee-department value="${department.name}"><span>${department.name}</span></label>`).join("")}</div></div><div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>系统角色 <span class="panel-sub">1-5 个</span></label><div class="choice-grid">${["总裁", "市场副总", "区域总监", "PM", "HR/人事"].map((role) => `<label class="choice-item"><input type="checkbox" data-employee-role value="${role}"><span>${role}</span></label>`).join("")}</div></div></div><div class="role-note">一个员工使用一个稳定身份和账号，可属于多个平级部门。创建成功后展示系统生成的初始密码。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">创建员工与账号</button></div></form>`,
        );
        document.querySelectorAll("[data-employee-role]").forEach(
          (input) =>
            (input.onchange = (event) => {
              if (document.querySelectorAll("[data-employee-role]:checked").length > 5) {
                event.target.checked = false;
                return toast("系统角色最多选择 5 个");
              }
            }),
        );
        $("#employeeForm").onsubmit = (event) => {
          event.preventDefault();
          const name = $("#efName").value.trim();
          const phone = $("#efPhone").value.trim();
          const email = $("#efEmail").value.trim().toLowerCase();
          if (employees.some((employee) => employee.name === name))
            return toast("已存在同名员工，请核对人员档案");
          if (employees.some((employee) => employee.phone === phone))
            return toast("手机号已被其他员工或历史账号使用");
          if (employees.some((employee) => employee.email?.toLowerCase() === email))
            return toast("企业邮箱已被其他员工使用");
          const departments = [...document.querySelectorAll("[data-employee-department]:checked")].map((input) => input.value);
          const roles = [...document.querySelectorAll("[data-employee-role]:checked")].map((input) => input.value);
          if (!departments.length) return toast("请至少选择一个所属部门");
          if (!roles.length) return toast("请至少选择一个系统角色");
          if (roles.length > 5) return toast("系统角色最多选择 5 个");
          const role = roles[0];
          const employee = {
            code: `YJ${String(101 + employees.length).padStart(3, "0")}`,
            name,
            phone,
            email,
            hireDate: $("#efHireDate").value,
            dept: departments[0],
            departments,
            roles,
            manualRoles: roles,
            automaticRoleSources: {},
            role,
            status: "在职",
            accountStatus: "启用",
            initialPasswordVisible: true,
            lastLogin: "从未登录",
            passwordResetAt: recordCreatedAt(),
            createdAt: recordCreatedAt(),
            updatedAt: recordCreatedAt(),
          };
          employees.push(employee);
          syncEmployeeAccount(employee, {
            phone,
            password: "Yj@2026Demo!",
          });
          closeOverlay();
          initAccounts();
          renderPage();
          const copyText = `姓名：${name}\n账号：${phone}\n初始密码：Yj@2026Demo!\n说明：密码无有效期，不强制首次修改`;
          openModal(`<div class="modal-head"><div class="modal-title">员工与账号创建成功</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="role-note">初始密码无有效期且不强制首次修改；本人主动修改前 HR/人事可查看，修改后任何角色不可见。</div><div class="detail-grid"><div class="detail-item"><label>登录手机号</label><div>${phone.slice(0, 3)}****${phone.slice(-4)}</div></div><div class="detail-item"><label>初始密码</label><div><strong>Yj@2026Demo!</strong></div></div><div class="detail-item full"><label>密码限制</label><div>无有效期；不强制首次修改</div></div></div></div><div class="modal-foot"><button class="btn" data-close>关闭</button><button class="btn btn-primary" id="copyEmployeeResult">复制全部</button></div>`);
          $("#copyEmployeeResult").onclick = async () => {
            try {
              await navigator.clipboard.writeText(copyText);
              toast("姓名、账号和初始密码已复制");
            } catch (error) {
              toast("浏览器未授权剪贴板，请手动记录创建结果");
            }
          };
        };
      }

      function captureOrganizationMutationState() {
        const lists = [
          employees,
          accounts,
          organizationDepartments,
          regionsData,
          cityOwners,
          customers,
          contacts,
          tasks,
          maintenanceRecords,
          approvals,
          projects,
          organizationChanges,
        ];
        return {
          lists: lists.map((list) => [list, [...list]]),
          objects: [...new Set(lists.flat())]
            .filter(Boolean)
            .map((item) => [item, JSON.parse(JSON.stringify(item))]),
        };
      }

      function restoreOrganizationMutationState(state) {
        state.objects.forEach(([item, snapshot]) => {
          Object.keys(item).forEach((key) => delete item[key]);
          Object.assign(item, snapshot);
        });
        state.lists.forEach(([list, snapshot]) => {
          list.splice(0, list.length, ...snapshot);
        });
      }

      function openOrganizationDepartmentForm(id) {
        if (
          !canEmployeeAction(
            id ? "employees.set_supervisor" : "employees.create_department",
          )
        )
          return toast("当前角色对组织架构仅有只读权限");
        const department = organizationDepartments.find(
          (item) => item.id === id,
        );
        const excludedIds = department
          ? new Set(
              organizationDepartments
                .filter((item) =>
                  organizationDescendantNames(department.id).includes(item.name),
                )
                .map((item) => item.id),
            )
          : new Set();
        const parents = organizationDepartments.filter(
          (item) =>
            item.status === "启用" &&
            !excludedIds.has(item.id),
        );
        const supervisorCandidates = employees.filter(
          (employee) =>
            employee.status === "在职" && employee.role !== "系统管理员",
        );
        openModal(
          `<div class="modal-head"><div class="modal-title">${department ? "管理" : "新增"}部门</div><button class="icon-btn close" data-close>×</button></div><form id="organizationDepartmentForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>部门名称</label><input class="input" id="odName" value="${department?.name || ""}" minlength="2" maxlength="100" required></div>${department ? `<div class="form-group"><label class="form-label">部门编码</label><input class="input" value="${department.code}" disabled></div>` : `<div class="form-group"><label class="form-label">部门编码</label><input class="input" value="保存后自动生成" disabled></div>`}<div class="form-group"><label class="form-label">上级部门</label><select class="input" id="odParent"><option value="">英嘉科技（一级部门）</option>${parents.map((item) => `<option value="${item.id}" ${department?.parentId === item.id ? "selected" : ""}>${departmentPath(item)}</option>`).join("")}</select></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>排序</label><input class="input" id="odSort" type="number" min="1" max="9999" value="${department?.sort || 100}" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>是否区域中心</label><select class="input" id="odIsRegion"><option value="false" ${department?.type !== "region" ? "selected" : ""}>否</option><option value="true" ${department?.type === "region" ? "selected" : ""}>是</option></select></div><div class="form-group"><label class="form-label">部门主管</label><select class="input" id="odSupervisor"><option value="">暂不设置主管（待设置）</option>${supervisorCandidates.map((employee) => `<option value="${employee.code}" ${department?.supervisorCode === employee.code ? "selected" : ""}>${employee.name} · ${employee.code} · ${employeeDepartmentNames(employee).join("、") || "未归属部门"} · ${employeeRoleDisplay(employee)}</option>`).join("")}</select><div class="list-sub">每部门最多一名主管；可选部门外员工，保存后自动增加成员关系且解除主管不自动移除。</div></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">保存部门</button></div></form>`,
        );
        $("#organizationDepartmentForm").onsubmit = (event) => {
          event.preventDefault();
          const name = $("#odName").value.trim(),
            parentId = $("#odParent").value
              ? Number($("#odParent").value)
              : null,
            supervisorCode = $("#odSupervisor").value,
            isRegion = $("#odIsRegion").value === "true",
            code = department?.code || `DEPT${String(90000001 + organizationDepartments.length).padStart(3, "0")}`,
            sort = Number($("#odSort").value);
          if (
            organizationDepartments.some(
              (item) => item.id !== department?.id && item.code === code,
            )
          )
            return toast("部门编码已存在且永久不可复用");
          if (
            organizationDepartments.some(
              (item) =>
                item.status === "启用" &&
                item.id !== department?.id &&
                item.parentId === parentId &&
                item.name === name,
            )
          )
            return toast("同一上级下已存在同名部门");
          const supervisor = employees.find(
            (employee) => employee.code === supervisorCode,
          );
          if (department) {
            const linkedRegion = regionsData.find(
              (region) => region.id === department.regionId,
            );
            if (
              department.type === "region" &&
              !isRegion &&
              (regionProvinceList(linkedRegion).length ||
                cityOwners.some((city) =>
                  regionProvinceList(linkedRegion).includes(city.province),
                ) ||
                customers.some(
                  (customer) => regionForCompany(customer)?.id === linkedRegion?.id,
                ))
            )
              return toast("该区域中心仍有关联省份、地市责任或客户，请先由 admin 在区域配置中清理");
            const oldName = department.name;
            const oldParent = department.parentId;
            const oldSupervisorCode = department.supervisorCode;
            const oldType = department.type;
            const oldSupervisor = employeeByCode(oldSupervisorCode);
            const oldSupervisorName = oldSupervisor?.name || "";
            const newSupervisorName = supervisor?.name || "";
            const organizationChangeId = `OC-${Date.now()}`;
            const effectiveAt = recordCreatedAt();
            const shouldTransferDirectorProjects =
              oldType === "region" &&
              isRegion &&
              department.status === "启用" &&
              oldSupervisorCode !== supervisorCode &&
              Boolean(linkedRegion);
            const projectTransferPlan = shouldTransferDirectorProjects
              ? prepareProjectResponsibilityTransfer({
                  kind: "region_director",
                  region: linkedRegion,
                  fromOwner: oldSupervisorName,
                  toOwner: newSupervisorName,
                })
              : null;
            if (projectTransferPlan && !projectTransferPlan.ok)
              return toast(projectTransferPlan.error);
            const mutationState = captureOrganizationMutationState();
            let projectTransferResult = null;
            try {
              Object.assign(department, {
                name,
                code,
                parentId,
                supervisorCode,
                sort,
                type: isRegion ? "region" : "department",
                updatedAt: effectiveAt,
              });
              if (oldName !== name)
                employees
                  .filter((employee) => employeeDepartmentNames(employee).includes(oldName))
                  .forEach((employee) =>
                    setEmployeeDepartments(
                      employee,
                      employeeDepartmentNames(employee).map((item) =>
                        item === oldName ? name : item,
                      ),
                    ),
                  );
              if (projectTransferPlan) {
                projectTransferResult = applyProjectResponsibilityTransfer(
                  projectTransferPlan,
                  {
                    effectiveAt,
                    operator: currentUser.name,
                    referenceId: organizationChangeId,
                    referenceType: "区域中心主管变更",
                    reason: "区域中心主管变更",
                  },
                );
                if (!projectTransferResult.ok)
                  throw new Error(projectTransferResult.error);
              }
              if (
                oldSupervisor &&
                oldType === "region" &&
                (!isRegion || oldSupervisorCode !== supervisorCode)
              ) {
                removeAutomaticRegionDirectorRole(oldSupervisor, department.id);
                oldSupervisor.updatedAt = effectiveAt;
                syncEmployeeAccount(oldSupervisor);
              }
              if (supervisor) {
                ensureEmployeeDepartment(supervisor, name);
                if (isRegion)
                  addAutomaticRegionDirectorRole(supervisor, department.id);
                supervisor.updatedAt = effectiveAt;
                syncEmployeeAccount(supervisor);
              }
              if (isRegion) {
                syncOrganizationRegions();
                const region = regionsData.find(
                  (item) => item.id === department.regionId,
                );
                if (region)
                  syncRegionDirectorChange(
                    region,
                    oldSupervisorName,
                    oldName,
                  );
              } else if (oldType === "region" && linkedRegion) {
                const index = regionsData.indexOf(linkedRegion);
                if (index >= 0) regionsData.splice(index, 1);
                delete department.regionId;
              }
              recordOrganizationChange({
                id: organizationChangeId,
                date: projectTransferPlan ? effectiveAt : DEMO_TODAY,
                actualEffectiveAt: effectiveAt,
                object: name,
                type:
                  oldParent !== parentId
                    ? "部门移动"
                    : oldSupervisorCode !== supervisorCode
                      ? "主管变更"
                      : oldType !== department.type
                        ? "区域中心标记变更"
                        : oldName !== name
                          ? "部门改名"
                          : "组织编辑",
                detail: `${oldName} → ${name}；主管：${newSupervisorName || "待设置"}`,
                operator: currentUser.name,
                status: "已生效",
                migratedProjectIds: projectTransferResult?.projectIds || [],
              });
            } catch (error) {
              restoreOrganizationMutationState(mutationState);
              renderPage();
              return toast(
                projectTransferPlan
                  ? "区域总监及项目责任迁移失败，原组织与项目责任保持不变"
                  : "组织架构更新失败，未产生部分结果",
              );
            }
          } else {
            const newDepartment = {
              id: Date.now(),
              name,
              code,
              parentId,
              type: isRegion ? "region" : "department",
              status: "启用",
              supervisorCode,
              sort,
              updatedAt: recordCreatedAt(),
            };
            organizationDepartments.push(newDepartment);
            if (supervisor) {
              ensureEmployeeDepartment(supervisor, name);
              if (isRegion)
                addAutomaticRegionDirectorRole(supervisor, newDepartment.id);
              supervisor.updatedAt = recordCreatedAt();
              syncEmployeeAccount(supervisor);
            }
            if (isRegion) syncOrganizationRegions();
            recordOrganizationChange({
              date: DEMO_TODAY,
              object: name,
              type: "新增部门",
              detail: `上级：${parents.find((item) => item.id === parentId)?.name || "英嘉科技"}；主管：${employees.find((item) => item.code === supervisorCode)?.name}`,
              operator: currentUser.name,
              status: "已生效",
            });
          }
          closeOverlay();
          renderPage();
          toast("组织架构已更新并记录审计");
        };
      }

      function openEmployeeStatusChange(index, mode) {
        const permission =
          mode === "恢复"
            ? "employees.restore_employee"
            : "employees.suspend_employee";
        if (!canEmployeeAction(permission))
          return toast(`当前角色无权执行员工${mode}`);
        const employee = employees[index];
        if (
          !employee ||
          employee.role === "系统管理员" ||
          employee.name === currentUser.name ||
          (mode === "停用" && employee.status !== "在职") ||
          (mode === "恢复" && employee.status !== "停用")
        )
          return toast(`当前员工状态不允许${mode}`);
        const ownedCities = cityOwners.filter(
          (item) => item.pm === employee.name,
        );
        const managedDepartments = departmentsManagedBy(employee.code);
        const openTasks = tasks.filter(
          (task) =>
            task.pm === employee.name &&
            !["done", "cancelled"].includes(task.status),
        );
        const activeApprovals = approvals.filter(
          (approval) =>
            ["pending", "paused_invalid_handler"].includes(approval.status) &&
            approvalCurrentAssignees(approval).includes(employee.name),
        );
        const blockingProjectsForEmployee = () =>
          projects.filter(
            (project) =>
              ["已立项", "进行中", "已交付"].includes(project.stage) &&
              projectCurrentOwner(project) === employee.name,
          );
        const projectMigrationRequired = () =>
          toast(
            "该员工仍负责已立项、进行中或已交付项目，请先在“区域中心与地市配置”通过地区责任直接调整完成项目迁移，再重新停用。",
          );
        if (mode === "停用" && blockingProjectsForEmployee().length)
          return projectMigrationRequired();
        openModal(
          `<div class="modal-head"><div class="modal-title">确认员工${mode}</div><button class="icon-btn close" data-close>×</button></div><form id="employeeStatusForm"><div class="modal-body"><div class="role-note ${mode === "停用" ? "danger-note" : ""}"><strong>${employee.name} · ${employee.code}</strong><br>本操作由 HR/admin 直接生效，不创建审批、WF 编号、待办或抄送。</div>${mode === "停用" ? `<div class="impact-summary"><div class="impact-grid"><div><label>将清空主管部门</label><strong>${managedDepartments.length}</strong></div><div><label>将清空地市责任</label><strong>${ownedCities.length}</strong></div><div><label>将取消未完成任务</label><strong>${openTasks.length}</strong></div></div></div><div class="role-note">停用前已确认不存在未迁移的已立项、进行中或已交付项目。部门成员、系统角色、当前审批实例及已迁移/历史项目保留；已取消和已中止项目不迁移且不阻断停用；处理人失效节点按既有规则暂停，全部未完成任务直接取消，项目不自动取消或中止。</div>` : `<div class="role-note">恢复后继续保留原部门成员和系统角色；已取消任务不恢复，此前清空的主管、区域/地市及客户当前责任不会自动恢复。</div>`}<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>${mode}原因</label><textarea class="input" id="esReason" minlength="5" maxlength="500" required></textarea></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn ${mode === "停用" ? "btn-danger" : "btn-primary"}" type="submit">确认并立即${mode}</button></div></form>`,
        );
        $("#employeeStatusForm").onsubmit = (event) => {
          event.preventDefault();
          const reason = $("#esReason").value.trim();
          if (reason.length < 5 || reason.length > 500)
            return toast(`${mode}原因需填写 5-500 字`);
          if (mode === "停用" && blockingProjectsForEmployee().length)
            return projectMigrationRequired();
          const changedAt = recordCreatedAt();
          const changeId = `PC-${Date.now()}`;
          const tasksToCancel =
            mode === "停用"
              ? tasks.filter(
                  (task) =>
                    task.pm === employee.name &&
                    !["done", "cancelled"].includes(task.status),
                )
              : [];
          const mutationTargets = [
            ...new Set([
              ...employees,
              ...accounts,
              ...organizationDepartments,
              ...regionsData,
              ...cityOwners,
              ...customers,
              ...approvals,
              ...tasksToCancel,
            ]),
          ].filter(Boolean);
          const mutationSnapshots = mutationTargets.map((target) => [
            target,
            JSON.parse(JSON.stringify(target)),
          ]);
          const accountCount = accounts.length;
          const regionCount = regionsData.length;
          try {
            if (mode === "停用") {
              managedDepartments.forEach((department) => {
                department.supervisorCode = "";
              });
              ownedCities.forEach((item) => (item.pm = ""));
              customers
                .filter(
                  (customer) =>
                    customer.owner === employee.name ||
                    customer.pm === employee.name,
                )
                .forEach((customer) => {
                  if (customer.owner === employee.name) customer.owner = "";
                  if (customer.pm === employee.name) customer.pm = "";
                });
              tasksToCancel.forEach((task) => {
                task.statusBeforeCancellation = task.status;
                task.status = "cancelled";
                task.closeReason = reason;
                task.closedAt = changedAt;
                task.updatedAt = changedAt;
                task.cancelledBy = currentUser.name;
                task.cancellationSource = "employee_deactivation";
                task.employeeStopRecordId = changeId;
                task.employeeStopEmployeeCode = employee.code;
                task.employeeStopEmployeeName = employee.name;
              });
              activeApprovals.forEach((approval) => {
                approval.status = "paused_invalid_handler";
                approval.invalidHandler = employee.name;
                approval.invalidatedAt = changedAt;
                approval.invalidReason =
                  "当前处理人已被 HR/admin 直接停用，账号与会话立即失效。";
                approval.replacementRule =
                  "由 admin 按原节点操作权限和对象范围受控选择替换人。";
              });
              employee.status = "停用";
              employee.accountStatus = "停用";
              employee.scope = "已停用";
              employee.suspendedAt = changedAt;
            } else {
              employee.status = "在职";
              employee.accountStatus = "启用";
            }
            employee.updatedAt = changedAt;
            syncEmployeeAccount(employee);
            syncOrganizationRegions();
            syncPmEmployeeScopes();
            initAccounts();
          } catch (error) {
            mutationSnapshots.forEach(([target, snapshot]) => {
              Object.keys(target).forEach((key) => delete target[key]);
              Object.assign(target, snapshot);
            });
            accounts.splice(accountCount);
            regionsData.splice(regionCount);
            renderPage();
            return toast(`员工${mode}失败，未产生部分结果`);
          }
          const change = {
            id: changeId,
            employeeCode: employee.code,
            employeeName: employee.name,
            type: mode,
            fromDept: employee.dept,
            toDept: employee.dept,
            fromJob: employee.job || "",
            toRoles: employeeRoleNames(employee),
            applyDate: changedAt,
            effectiveDate: DEMO_TODAY,
            operator: currentUser.name,
            reason,
            status: "已生效",
            approvalId: null,
            approver: "无需审批",
            appliedAt: changedAt,
            handover: [],
            impactSummary:
              mode === "停用"
                ? `已立项、进行中和已交付项目迁移校验通过；清空主管 ${managedDepartments.length} 个、地市责任 ${ownedCities.length} 个；取消未完成任务 ${tasksToCancel.length} 条；保留当前审批节点 ${activeApprovals.length} 个`
                : "恢复账号；已取消任务和已清空责任不自动恢复",
          };
          personnelChanges.unshift(change);
          closeOverlay();
          employeeView = "changes";
          renderPage();
          toast(
            mode === "停用"
              ? `员工停用已立即生效，已取消 ${tasksToCancel.length} 条未完成任务`
              : "员工恢复已立即生效，已取消任务不恢复",
          );
        };
      }

      function openEmployeeDetail(index) {
        if (!canViewEmployeeDetail()) {
          toast("当前角色无权查看员工详情");
          return false;
        }
        const employee = employees[index];
        const department = departmentForEmployee(employee);
        const departments = departmentsForEmployee(employee);
        const supervisors = departments
          .map((item) => departmentSupervisor(item)?.name || `${item.name}待设置`)
          .filter((name, itemIndex, all) => all.indexOf(name) === itemIndex);
        const managedDepartments = departmentsManagedBy(employee.code);
        const accountEvents = [
          {
            time: employee.createdAt,
            title: "账号创建",
            content: `员工账号已创建，账号状态为${employee.accountStatus}`,
          },
          {
            time: employee.hireDate + " 09:00",
            title: "系统角色初始化",
            content: `关联角色：${employeeRoleDisplay(employee)}`,
          },
          ...personnelChanges
            .filter((item) => item.employeeCode === employee.code)
            .map((item) => ({
              time: item.appliedAt || item.applyDate,
              title: `员工${item.type}`,
              content: item.impactSummary || `员工与账号状态按${item.type}结果直接同步`,
            })),
          ...organizationChanges
            .filter(
              (item) =>
                item.object?.includes(employee.code) &&
                ["密码重置", "本人修改密码", "员工档案更正", "员工档案与组织关系编辑"].includes(
                  item.type,
                ),
            )
            .map((item) => ({
              time: item.date,
              title: item.type,
              content:
                item.type === "员工档案更正"
                  ? "员工基础档案已更新"
                  : "仅记录密码已变更，不保存或展示密码内容",
            })),
        ];
        if (currentUser.fullAccess)
          accountEvents.push({
            time: employee.lastLogin,
            title: "最近登录摘要",
            content: "仅展示最近成功登录时间；不展示设备、IP、会话或失败次数",
          });
        accountEvents.sort((a, b) => String(b.time).localeCompare(String(a.time)));
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">员工详情</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">${employee.name[0]}</div><div><div class="detail-name">${employee.name} <span class="tag ${employee.status === "在职" ? "green" : "yellow"}">${employee.status}</span></div></div></div><div class="tabs"><button class="tab active" type="button" data-employee-detail-tab="basic">基础信息</button><button class="tab" type="button" data-employee-detail-tab="account">角色与账号记录</button></div><section data-employee-detail-panel="basic"><div class="detail-grid"><div class="detail-item"><label>手机号（登录账号）</label><div>${displayEmployeePhone(employee)}</div></div><div class="detail-item"><label>企业邮箱</label><div>${displayEmployeeEmail(employee)}</div></div><div class="detail-item"><label>工号</label><div>${employee.code}</div></div><div class="detail-item"><label>入职日期</label><div>${employee.hireDate}</div></div><div class="detail-item full"><label>所属部门</label><div>${departments.map((item) => `<span class="tag">${departmentPath(item)}</span>`).join(" ") || "—"}</div></div><div class="detail-item full"><label>各部门主管</label><div>${supervisors.join("、") || "待设置"}</div></div><div class="detail-item"><label>本人主管部门</label><div>${managedDepartments.map((item) => item.name).join("、") || "无"}</div></div><div class="detail-item full"><label>系统角色</label><div>${employeeRoleNames(employee).map((role) => `<span class="tag blue">${role}</span>`).join(" ") || "未关联"}</div></div>${currentUser.fullAccess ? `<div class="detail-item"><label>账号状态</label><div>${employee.accountStatus}</div></div><div class="detail-item"><label>最近登录</label><div>${employee.lastLogin}</div></div>` : ""}${currentUser.role === "hr" ? `<div class="detail-item full"><label>系统生成初始密码</label><div>${employee.initialPasswordVisible ? '<strong>Yj@2026Demo!</strong><div class="list-sub">无有效期，不强制首次修改；本人修改后立即不可见</div>' : "密码已由本人修改，任何角色不可见"}</div></div>` : ""}<div class="detail-item"><label>档案创建时间</label><div>${employee.createdAt}</div></div><div class="detail-item"><label>最后更新时间</label><div>${employee.updatedAt}</div></div></div><div class="role-note">全部部门关系平级，不设主部门。</div></section><section class="hidden" data-employee-detail-panel="account"><div class="role-note">本页记录账号、部门成员、系统角色及员工状态变化，不展示密码、验证码、会话或完整手机号。</div><div class="timeline">${accountEvents.map((item) => `<div class="timeline-item"><div class="timeline-title">${item.time} · ${item.title}</div><div class="timeline-content">${item.content}</div></div>`).join("")}</div></section></div><div class="drawer-foot"><button class="btn" data-close>关闭</button>${employee.role !== "系统管理员" && canEmployeeAction("employees.edit_employee") && employee.name !== currentUser.name ? `<button class="btn" data-action="employee-edit" data-id="${index}">编辑员工</button>` : ""}${employee.role !== "系统管理员" && canEmployeeAction("employees.reset_password") && employee.name !== currentUser.name ? `<button class="btn" data-action="reset-password" data-id="${index}">重置密码</button>` : ""}</div>`,
        );
        document.querySelectorAll("[data-employee-detail-tab]").forEach(
          (button) =>
            (button.onclick = () => {
              document
                .querySelectorAll("[data-employee-detail-tab]")
                .forEach((item) =>
                  item.classList.toggle(
                    "active",
                    item === button,
                  ),
                );
              document
                .querySelectorAll("[data-employee-detail-panel]")
                .forEach((panel) =>
                  panel.classList.toggle(
                    "hidden",
                    panel.dataset.employeeDetailPanel !==
                      button.dataset.employeeDetailTab,
                  ),
                );
            }),
        );
      }
