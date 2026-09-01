      function openProfile() {
        const account = currentUser;
        const employee = employees.find((item) => item.name === account.name);
        openDrawer(
          `<div class="drawer-head"><div class="modal-title">个人信息</div><button class="icon-btn close" data-close>×</button></div><div class="drawer-body"><div class="detail-hero"><div class="avatar">${account.name[0]}</div><div><div class="detail-name">${account.name}</div><div class="detail-sub">${account.roleName} · ${employee ? employeeDepartmentNames(employee).join("、") : "内部员工"}</div></div></div><div class="detail-grid"><div class="detail-item"><label>手机号（登录账号）</label><div>${employee ? displayEmployeePhone(employee) : `${String(account.phone).slice(0, 3)}****${String(account.phone).slice(-4)}`}</div></div><div class="detail-item"><label>企业邮箱</label><div>${employee ? displayEmployeeEmail(employee) : "待配置"}</div></div><div class="detail-item"><label>工号</label><div>${employee?.code || "待配置"}</div></div><div class="detail-item full"><label>所属部门（平级）</label><div>${employee ? departmentsForEmployee(employee).map((department) => `<span class="tag">${departmentPath(department)}</span>`).join(" ") : "系统内置账号"}</div></div><div class="detail-item full"><label>系统角色</label><div>${employee ? employeeRoleNames(employee).map((role) => `<span class="tag blue">${role}</span>`).join(" ") : account.roleName}</div></div>${currentUser.fullAccess ? `<div class="detail-item"><label>账号状态</label><div>${account.disabled || employee?.status !== "在职" ? "停用" : "启用"}</div></div>` : ""}<div class="detail-item"><label>最近登录</label><div>${employee?.lastLogin || "从未登录"}</div></div></div><div class="role-note">手机号统一脱敏；员工可属于多个平级部门，不设主部门。</div></div><div class="drawer-foot"><button class="btn" data-close>关闭</button><button class="btn btn-primary" data-action="change-own-password">修改密码</button></div>`,
        );
      }

      function openChangeOwnPassword() {
        openModal(
          `<div class="modal-head"><div class="modal-title">修改密码</div><button class="icon-btn close" data-close>×</button></div><form id="ownPasswordForm"><div class="modal-body"><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>当前密码</label><input class="input" id="oldPassword" type="password" autocomplete="current-password" minlength="12" maxlength="64" required></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>新密码</label><input class="input" id="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="64" required><div class="list-sub">12-64 位；大写字母、小写字母、数字、特殊字符至少包含三类</div></div><div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>确认新密码</label><input class="input" id="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="64" required></div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认修改</button></div></form>`,
        );
        $("#ownPasswordForm").onsubmit = (event) => {
          event.preventDefault();
          const newPassword = $("#newPassword").value;
          if ($("#oldPassword").value !== currentUser.password)
            return toast("当前密码不正确");
          if (newPassword.length < 12 || newPassword.length > 64)
            return toast("新密码需填写 12-64 位");
          const passwordClasses = [
            /[A-Z]/.test(newPassword),
            /[a-z]/.test(newPassword),
            /[0-9]/.test(newPassword),
            /[^A-Za-z0-9]/.test(newPassword),
          ].filter(Boolean).length;
          if (passwordClasses < 3)
            return toast(
              "新密码需包含大写字母、小写字母、数字、特殊字符中的至少三类",
            );
          if (
            currentUser.phone &&
            newPassword.includes(currentUser.phone.slice(0, 6))
          )
            return toast("新密码不能包含手机号连续 6 位");
          const employee = employees.find(
            (item) => item.name === currentUser.name,
          );
          if (
            employee?.code &&
            newPassword.toLowerCase().includes(employee.code.toLowerCase())
          )
            return toast("新密码不能包含完整工号");
          if (newPassword !== $("#confirmPassword").value)
            return toast("两次输入的新密码不一致");
          if (newPassword === currentUser.password)
            return toast("新密码不能与当前密码相同");
          currentUser.password = newPassword;
          if (employee) {
            employee.initialPasswordVisible = false;
            employee.passwordResetAt = recordCreatedAt();
            recordOrganizationChange({
              date: recordCreatedAt(),
              object: `${employee.name} · ${employee.code}`,
              type: "本人修改密码",
              detail: "员工本人完成密码修改；不保存密码内容",
              operator: employee.name,
              status: "已生效",
            });
          }
          closeOverlay();
          toast("密码已修改，请使用新密码登录");
        };
      }
