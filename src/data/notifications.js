      const notificationMessages = [
        {
          id: 1001,
          roles: ["president", "vp", "director"],
          category: "关键人变动",
          title: "张海调任江苏移动省公司副总经理",
          content: "调岗已生效，关联专项维系正在按目标规则自动重算。",
          date: "2026-08-11 10:32",
          read: false,
        },
        {
          id: 1003,
          roles: ["pm"],
          category: "任务提醒",
          title: "王建国常规维系将于明日到期",
          content: "请完成维系并提交结果，系统将按实际完成日期续期。",
          date: "2026-08-11 08:30",
          read: false,
        },
        {
          id: 1004,
          roles: ["pm"],
          category: "专项维系",
          title: "AI数字员工产品专项推广已生成任务",
          content: "请在任务有效期内完成济南、泰安客户的推广维系。",
          date: "2026-08-10 16:18",
          read: false,
        },
        {
          id: 1005,
          roles: ["president", "vp", "director", "pm"],
          category: "系统提醒",
          title: "2026 年节假日日历同步完成",
          content: "节假日关怀任务将按已启用规则和提前时间自动生成。",
          date: "2026-08-10 09:05",
          read: true,
        },
        {
          id: 1006,
          roles: ["admin"],
          category: "系统告警",
          title: "节假日数据同步任务已恢复",
          content: "上游短暂失败后已使用最近成功版本完成重试。",
          date: "2026-08-10 09:20",
          read: false,
        },
        {
          id: 1007,
          roles: ["president", "vp"],
          category: "数据质量",
          title: "浙江省公司客户负责人已同步",
          content: "省公司客户负责人已按所属区域同步为钱峰，全部维系任务由区域总监直接执行。",
          date: "2026-08-09 15:40",
          read: true,
        },
      ];

      const projectReminderDeliveries = new Map();

      function projectReminderDeliveryKey(candidate) {
        return [
          candidate.projectId,
          candidate.reminderKind,
          candidate.recipientKind,
          candidate.recipientName,
          candidate.businessDate,
        ].join("|");
      }

      function deliverProjectReminderCandidate(candidate, shouldFail = false) {
        const key = projectReminderDeliveryKey(candidate);
        const existing = projectReminderDeliveries.get(key);
        if (existing) return existing;
        if (shouldFail) {
          const failure = {
            key,
            status: "failed",
            retryable: true,
            candidate: { ...candidate },
          };
          projectReminderDeliveries.set(key, failure);
          return failure;
        }
        const message = {
          id: `project-reminder:${key}`,
          deliveryKey: key,
          roles: [...candidate.recipientRoles],
          users: [candidate.recipientName],
          category: "项目提醒",
          title: candidate.title,
          content: candidate.content,
          date: candidate.sentAt,
          read: false,
          projectId: candidate.projectId,
        };
        notificationMessages.push(message);
        const delivered = {
          key,
          status: "delivered",
          retryable: false,
          candidate: { ...candidate },
          messageId: message.id,
        };
        projectReminderDeliveries.set(key, delivered);
        return delivered;
      }

      function dispatchProjectReminderNotifications(moment = DEMO_NOW, options = {}) {
        const retried = options.retryFailed
          ? [...projectReminderDeliveries.values()]
              .filter((delivery) => delivery.status === "failed")
              .map((delivery) => retryProjectReminderDelivery(delivery.key))
              .filter(Boolean)
          : [];
        const dispatched = projectReminderCandidatesForMoment(moment).map((candidate) => {
          const key = projectReminderDeliveryKey(candidate);
          const shouldFail =
            typeof options.shouldFail === "function" &&
            options.shouldFail(candidate, key);
          return deliverProjectReminderCandidate(candidate, shouldFail);
        });
        return [...retried, ...dispatched];
      }

      function retryProjectReminderDelivery(key) {
        const failure = projectReminderDeliveries.get(key);
        if (!failure || failure.status !== "failed" || !failure.retryable)
          return failure || null;
        const currentCandidate = projectReminderCandidatesForMoment(
          `${failure.candidate.businessDate} 23:59`,
        ).find(
          (candidate) => projectReminderDeliveryKey(candidate) === key,
        );
        projectReminderDeliveries.delete(key);
        if (!currentCandidate) return { key, status: "stopped", retryable: false };
        return deliverProjectReminderCandidate(currentCandidate);
      }

      function currentProjectReminderFailures() {
        if (!currentUser) return [];
        return [...projectReminderDeliveries.values()].filter(
          (delivery) =>
            delivery.status === "failed" &&
            delivery.candidate.recipientName === currentUser.name &&
            delivery.candidate.recipientRoles.includes(currentUser.role),
        );
      }
