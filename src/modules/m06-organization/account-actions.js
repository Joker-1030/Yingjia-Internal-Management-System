      function openResetPassword(i) {
        if (!canEmployeeAction("employees.reset_password"))
          return toast("仅系统管理员可重置其他员工密码");
        const e = employees[i];
        if (!e || e.role === "系统管理员")
          return toast("内置 admin 账号不在员工账号维护范围内");
        const account = accounts.find((item) => item.name === e.name);
        if (!account) return toast("员工账号信息不可用，密码未重置");
        const resetPassword = `Yj@${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}Aa!`;
        account.password = resetPassword;
        account.mustChangePassword = false;
        e.initialPasswordVisible = false;
        e.passwordResetAt = recordCreatedAt();
        recordOrganizationChange({
          date: recordCreatedAt(),
          object: `${e.name} · ${e.code}`,
          type: "密码重置",
          detail: "系统生成密码已签发；新密码立即生效且无有效期",
          operator: currentUser.name,
          status: "已生效",
        });
        renderPage();
        openModal(
          `<div class="modal-head"><div class="modal-title">密码重置成功</div></div><div class="modal-body"><div class="role-note">${e.name} 的密码已重置并立即生效。新密码无有效期，也不强制下次登录修改。</div><div class="detail-grid"><div class="detail-item full"><label>已重置的密码</label><div><strong id="resetPasswordResult">${resetPassword}</strong></div></div></div></div><div class="modal-foot"><button class="btn btn-primary" type="button" id="copyResetPasswordAndClose">复制并关闭</button></div>`,
        );
        $("#modalLayer .modal-mask").onclick = null;
        $("#copyResetPasswordAndClose").onclick = async () => {
          try {
            await navigator.clipboard.writeText(resetPassword);
            closeOverlay();
            toast("已复制重置密码");
          } catch {
            toast("复制失败，请重试；密码弹窗已保留");
          }
        };
      }
