      const taskTypeMeta = (type) =>
        ({
          常规维系: { tone: "blue", note: "按职级周期自动续期" },
          专项维系: { tone: "orange", note: "公司统一发布" },
          "关键人覆盖 KPI": { tone: "green", note: "按目标部门或岗位覆盖率自动判定" },
          生日关怀: { tone: "green", note: "按生日月日自动生成" },
          节假日关怀: { tone: "yellow", note: "按年度节假日日历自动生成" },
        })[type] || { tone: "blue", note: "" };
      function taskDisplayType(task) {
        if (!isCampaignTask(task)) return task?.type || "任务";
        const campaign = campaigns.find((item) => item.id === task.campaignId);
        return campaign?.category || "专项维系";
      }

      function approvalHasReception(approval) {
        if (approval.type === "地市交接") return false;
        return Boolean(
          approval.targetPm ||
          approval.acceptedBy ||
          approval.rejectedBy ||
          approval.current === "目标PM接收",
        );
      }

      function approvalFinalNodeTitle(approval) {
        const collaborationNode = activeApprovalCollaborationNode(approval);
        if (collaborationNode)
          return (
            collaborationNode.returnNode ||
            collaborationNode.nextNode ||
            "后续审批"
          );
        if (
          approval.current &&
          !["目标PM接收", "已结束"].includes(approval.current)
        )
          return approval.current;
        const role = approval.decidedBy
          ? employees.find((employee) => employee.name === approval.decidedBy)?.role
          : "";
        return role === "总裁" ? "总裁确认" : "区域总监审批";
      }

      function approvalProgressSteps(approval) {
        const hasReception = approvalHasReception(approval);
        const steps = [];
        if (hasReception) {
          const receptionState = approval.rejectedBy
            ? "rejected"
            : approval.acceptedBy
              ? "done"
              : approval.status === "pending" && approval.current === "目标PM接收"
                ? "current"
                : "upcoming";
          steps.push({ title: "目标 PM 接收", state: receptionState });
        }
        (approval.collaborationNodes || []).forEach((node) =>
          steps.push({
            title: node.title,
            state: collaborationNodeState(node),
          }),
        );
        const decisionInvalid = approval.status === "paused_invalid_handler";
        const decisionDone = !decisionInvalid && Boolean(
          approval.decidedBy ||
            (!hasReception &&
              !approval.collaborationNodes?.length &&
              [
                "approved",
                "approved_pending_effective",
                "rejected",
                "processing_failed",
              ].includes(
                approval.status,
              )),
        );
        const decisionState =
          decisionInvalid
            ? "invalid"
            : approval.status === "rejected" && decisionDone
            ? "rejected"
            : decisionDone
              ? "done"
              : approval.status === "pending" &&
                  approval.current !== "目标PM接收" &&
                  !activeApprovalCollaborationNode(approval)
                ? "current"
                : "upcoming";
        steps.push({ title: approvalFinalNodeTitle(approval), state: decisionState });
        return steps;
      }

      function approvalFlow(a) {
        const icons = { done: "✓", current: "•", upcoming: "", rejected: "×", invalid: "!" };
        return `<div class="approval-flow">${approvalProgressSteps(a).map((step, index) => `${index ? '<i class="flow-line"></i>' : ""}<span class="flow-step ${step.state}"><span class="flow-dot">${icons[step.state]}</span>${step.title}</span>`).join("")}</div>`;
      }

