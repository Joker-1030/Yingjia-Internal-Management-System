      const notificationMessages = [];

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
