      function currentNotifications() {
        return notificationMessages.filter(
          (message) =>
            currentUser &&
            message.roles.includes(currentUser.role) &&
            (!message.users?.length || message.users.includes(currentUser.name)),
        );
      }
      function noticeCard(message, full = false) {
        return `<button type="button" class="notice-item ${message.read ? "read" : ""}" data-notice-id="${message.id}" title="${message.title}\n${message.content}\n${message.date}"><span class="notice-unread"></span><span><span class="notice-title">${message.category} · ${message.title}</span><span class="notice-content">${message.content}</span><span class="notice-date">${message.date} · ${message.read ? "已读" : "未读"}</span></span></button>`;
      }
      function refreshNoticeIndicator() {
        const dot = $("#noticeBtn .dot");
        if (dot)
          dot.classList.toggle(
            "hidden",
            !currentNotifications().some((message) => !message.read),
          );
      }
      function closeNoticePanel() {
        $(".notice-panel")?.remove();
        if (noticeOutsideClickHandler) {
          document.removeEventListener("click", noticeOutsideClickHandler);
          noticeOutsideClickHandler = null;
        }
      }
      function markAllNotificationsRead() {
        currentNotifications().forEach((message) => (message.read = true));
        refreshNoticeIndicator();
        closeNoticePanel();
        toast("全部消息已标记为已读");
      }
      function markNoticeRead(id) {
        const message = notificationMessages.find(
          (item) => item.id === Number(id),
        );
        if (message) message.read = true;
        refreshNoticeIndicator();
      }
      function notificationCenterHtml() {
        const messages = currentNotifications();
        return `<div class="drawer-head"><div class="modal-title">全部消息</div><button class="icon-btn close" data-close title="关闭消息中心">×</button></div><div class="drawer-body"><div class="panel-head" style="padding:0 0 12px"><div class="panel-sub">展示全部已读与未读消息</div><div class="spacer"></div><button class="btn" id="drawerMarkAllRead" type="button">全部已读</button></div><div class="list" id="notificationCenterList">${messages.map((message) => noticeCard(message, true)).join("") || '<div class="empty">暂无消息</div>'}</div></div>`;
      }
      function bindNotificationCenter() {
        const button = $("#drawerMarkAllRead");
        if (button)
          button.onclick = () => {
            currentNotifications().forEach((message) => (message.read = true));
            refreshNoticeIndicator();
            renderDrawerLayer(notificationCenterHtml());
            bindNotificationCenter();
            toast("全部消息已标记为已读");
          };
        $("#notificationCenterList")
          ?.querySelectorAll("[data-notice-id]")
          .forEach(
            (button) =>
              (button.onclick = () => {
                markNoticeRead(button.dataset.noticeId);
                renderDrawerLayer(notificationCenterHtml());
                bindNotificationCenter();
              }),
          );
      }
      function openNotificationCenter() {
        closeNoticePanel();
        openDrawer(notificationCenterHtml());
        bindNotificationCenter();
      }
      function toggleNotices() {
        const old = $(".notice-panel");
        if (old) return closeNoticePanel();
        const messages = currentNotifications();
        const p = document.createElement("div");
        p.className = "notice-panel";
        p.innerHTML = `<div class="panel-head"><div class="panel-title">消息通知</div><div class="spacer"></div><button class="btn" id="markAllRead" type="button">全部已读</button></div><div>${
          messages
            .slice(0, 3)
            .map((message) => noticeCard(message))
            .join("") || '<div class="empty">暂无消息</div>'
        }</div><div class="notice-foot"><button class="btn btn-primary" id="viewAllNotices" type="button" style="width:100%">查看全部</button></div>`;
        document.body.appendChild(p);
        $("#markAllRead").onclick = markAllNotificationsRead;
        $("#viewAllNotices").onclick = openNotificationCenter;
        p.querySelectorAll("[data-notice-id]").forEach(
          (button) =>
            (button.onclick = () => {
              markNoticeRead(button.dataset.noticeId);
              closeNoticePanel();
            }),
        );
        noticeOutsideClickHandler = (event) => {
          if (
            !event.target.closest(".notice-panel") &&
            !event.target.closest("#noticeBtn")
          )
            closeNoticePanel();
        };
        setTimeout(() => {
          if (noticeOutsideClickHandler)
            document.addEventListener("click", noticeOutsideClickHandler);
        }, 0);
      }

      setInterval(() => {
        taskDataUpdatedAt = formatTaskUpdateTime(new Date());
        document
          .querySelectorAll("[data-task-updated-at]")
          .forEach((element) => (element.textContent = taskDataUpdatedAt));
      }, 60 * 60 * 1000);

      $("#content").addEventListener("click", (event) => {
        const operationContact = event.target.closest(
          "[data-operation-contact]",
        );
        if (operationContact) {
          event.preventDefault();
          event.stopPropagation();
          selectedOperationContactId = Number(
            operationContact.dataset.operationContact,
          );
          renderPage();
          return;
        }
        const periodButton = event.target.closest("[data-dashboard-period]");
        if (periodButton) {
          event.preventDefault();
          event.stopPropagation();
          dashboardComparisonPeriod = periodButton.dataset.dashboardPeriod;
          renderPage();
          return;
        }
        const navigation = event.target.closest("[data-dashboard-nav]");
        if (navigation) {
          event.preventDefault();
          event.stopPropagation();
          handleDashboardNavigation(navigation);
          return;
        }
      });

