      function currentNotifications() {
        try {
          dispatchProjectReminderNotifications();
        } catch (error) {
          // Project state remains authoritative when notification delivery is unavailable.
        }
        return notificationMessages
          .filter(
            (message) =>
              currentUser &&
              message.roles.includes(currentUser.role) &&
              (!message.users?.length || message.users.includes(currentUser.name)),
          )
          .sort((left, right) => String(right.date).localeCompare(String(left.date)));
      }
      function escapeNotificationHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }
      function noticeCard(message, full = false) {
        const title = escapeNotificationHtml(message.title);
        const content = escapeNotificationHtml(message.content);
        const category = escapeNotificationHtml(message.category);
        const date = escapeNotificationHtml(message.date);
        return `<button type="button" class="notice-item ${message.read ? "read" : ""}" data-notice-id="${escapeNotificationHtml(message.id)}" data-notice-category="${category}" data-notice-read="${message.read ? "read" : "unread"}" title="${title}\n${content}\n${date}"><span class="notice-unread"></span><span><span class="notice-title">${category} · ${title}</span><span class="notice-content">${content}</span><span class="notice-date">${date} · ${message.read ? "已读" : "未读"}</span></span></button>`;
      }
      function notificationFailureHtml() {
        return currentProjectReminderFailures().length
          ? '<div class="notice-delivery-error"><strong>项目提醒暂未送达</strong><span>系统已保留可重试记录，项目状态和待办不受影响。</span></div>'
          : "";
      }
      function formatUnreadNotificationCount(count) {
        if (count <= 0) return "";
        return count > 99 ? "99+" : String(count);
      }
      function refreshNoticeIndicator() {
        const indicator = $("#noticeBtn .notice-count");
        if (!indicator) return;
        const count = currentNotifications().filter(
          (message) => !message.read,
        ).length;
        indicator.textContent = formatUnreadNotificationCount(count);
        indicator.classList.toggle("hidden", count === 0);
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
          (item) => String(item.id) === String(id),
        );
        if (message) message.read = true;
        refreshNoticeIndicator();
        return message || null;
      }
      function openProjectReminderMessage(message) {
        if (!message?.projectId) return false;
        const project = projectById(message.projectId);
        if (
          !project ||
          !hasPermission("projects") ||
          !projectIsVisibleToCurrentUser(project)
        ) {
          toast("对象不可用或无权访问");
          return true;
        }
        selectedProjectId = project.id;
        projectDetailTab = "basic";
        currentPage = "project-detail";
        window.history.replaceState(null, "", "#project-detail");
        closeNoticePanel();
        closeAllOverlays();
        renderNav();
        renderPage();
        return true;
      }
      function selectNotification(id, fallback) {
        const message = markNoticeRead(id);
        if (openProjectReminderMessage(message)) return;
        fallback();
      }
      function notificationCenterHtml() {
        const messages = currentNotifications();
        const categories = [...new Set(messages.map((message) => message.category))];
        const messageList = messages.length
          ? `${messages.map((message) => noticeCard(message, true)).join("")}<div class="empty hidden" data-notification-filter-empty>未找到符合条件的消息，请调整条件或重置筛选</div>`
          : '<div class="empty">暂无消息</div>';
        return `<div class="drawer-head"><div class="modal-title">全部消息</div><button class="icon-btn close" data-close title="关闭消息中心">×</button></div><div class="drawer-body"><div class="panel-head" style="padding:0 0 12px"><div class="panel-sub">展示全部已读与未读消息</div><div class="spacer"></div><button class="btn" id="drawerMarkAllRead" type="button">全部已读</button></div>${notificationFailureHtml()}<div class="toolbar filter-toolbar">${filterField("分类", `<select class="input" id="notificationCategory"><option value="">全部分类</option>${categories.map((category) => `<option>${escapeNotificationHtml(category)}</option>`).join("")}</select>`)}${filterField("未读状态", '<select class="input" id="notificationReadStatus"><option value="">全部状态</option><option value="unread">未读</option><option value="read">已读</option></select>')}${filterActions('<button class="btn btn-primary" id="applyNotificationFilters" type="button">筛选</button><button class="btn" id="resetNotificationFilters" type="button">重置</button>')}</div><div class="list" id="notificationCenterList">${messageList}</div></div>`;
      }
      function bindNotificationCenter() {
        const applyFilters = () => {
          const category = $("#notificationCategory")?.value || "";
          const readStatus = $("#notificationReadStatus")?.value || "";
          let visible = 0;
          document.querySelectorAll("#notificationCenterList [data-notice-id]").forEach((item) => {
            const hidden = Boolean(
              (category && item.dataset.noticeCategory !== category) ||
              (readStatus && item.dataset.noticeRead !== readStatus),
            );
            item.classList.toggle("hidden", hidden);
            if (!hidden) visible += 1;
          });
          $("[data-notification-filter-empty]")?.classList.toggle("hidden", visible > 0);
        };
        if ($("#applyNotificationFilters"))
          $("#applyNotificationFilters").onclick = applyFilters;
        if ($("#resetNotificationFilters"))
          $("#resetNotificationFilters").onclick = () => {
            ["#notificationCategory", "#notificationReadStatus"].forEach((selector) => {
              const control = $(selector);
              if (control) control.value = "";
            });
            applyFilters();
          };
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
                selectNotification(button.dataset.noticeId, () => {
                  renderDrawerLayer(notificationCenterHtml());
                  bindNotificationCenter();
                });
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
        p.innerHTML = `<div class="panel-head"><div class="panel-title">消息通知</div><div class="spacer"></div><button class="btn" id="markAllRead" type="button">全部已读</button></div>${notificationFailureHtml()}<div>${
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
              selectNotification(button.dataset.noticeId, closeNoticePanel);
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
