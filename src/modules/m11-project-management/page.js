      const PROJECT_STAGES = ["已立项", "进行中", "已交付", "已完成", "已取消"];
      const PROJECT_TODO_LABELS = ["资料待上传", "待评价", "待回款"];
      const PROJECT_ACTION_TODO_LABELS = [
        "确认 AI 项目交付",
        "资料待上传",
        "待评价",
      ];
      const PROJECT_TYPES = ["培训项目", "AI软件项目"];
      const DEMO_NOW = `${DEMO_TODAY} 12:00`;
      const PROJECT_MATERIAL_CATEGORIES = {
        "培训项目": [
          { name: "授课视频", required: true, kinds: ["video"] },
          { name: "项目照片", required: true, kinds: ["image"] },
          { name: "项目验收报告", required: true, kinds: ["document"] },
          { name: "课程实例", required: false, kinds: ["image", "video", "document"] },
          { name: "教材或讲义", required: true, kinds: ["document"] },
          { name: "操作手册", required: false, kinds: ["document"] },
          { name: "复盘 PPT", required: false, kinds: ["document"] },
          { name: "总结长图或回顾视频", required: false, kinds: ["image", "video"] },
          { name: "其他", required: false, kinds: ["image", "video", "document"] },
        ],
        "AI软件项目": [
          { name: "项目验收报告", required: true, kinds: ["document"] },
          { name: "操作手册", required: true, kinds: ["document"] },
          { name: "交付版本或成果说明", required: true, kinds: ["document"] },
          { name: "部署或开通证明", required: true, kinds: ["image", "document"] },
          { name: "项目实施总结", required: true, kinds: ["document"] },
        ],
      };
      const PROJECT_FILE_EXTENSION_RULES = {
        ".mp4": { mime: "video/mp4", kind: "video" },
        ".mov": { mime: "video/quicktime", kind: "video" },
        ".jpg": { mime: "image/jpeg", kind: "image" },
        ".jpeg": { mime: "image/jpeg", kind: "image" },
        ".png": { mime: "image/png", kind: "image" },
        ".pdf": { mime: "application/pdf", kind: "document" },
        ".doc": { mime: "application/msword", kind: "document" },
        ".docx": {
          mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          kind: "document",
        },
        ".xls": { mime: "application/vnd.ms-excel", kind: "document" },
        ".xlsx": {
          mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          kind: "document",
        },
        ".ppt": { mime: "application/vnd.ms-powerpoint", kind: "document" },
        ".pptx": {
          mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          kind: "document",
        },
      };
      const PROJECT_FILE_KIND_RULES = {
        video: { maxBytes: 2 * 1024 * 1024 * 1024, maxCount: 20, label: "视频" },
        image: { maxBytes: 20 * 1024 * 1024, maxCount: 100, label: "图片" },
        document: { maxBytes: 100 * 1024 * 1024, maxCount: 20, label: "文档" },
      };
      const DANGEROUS_FILE_EXTENSIONS = [
        ".exe", ".bat", ".cmd", ".com", ".scr", ".sh", ".js", ".vbs", ".ps1",
        ".msi", ".apk", ".jar", ".zip", ".rar", ".7z", ".tar", ".gz",
        ".docm", ".xlsm", ".pptm", ".enc", ".lock",
      ];
      let projectMaterialResults = { accountKey: "", projectId: "", items: [] };

      function projectCustomerFacts(project) {
        return project?.customerSnapshot || null;
      }
      function customerStableCode(customer) {
        if (!customer) return "—";
        return customer.companyCode || String(customer.id);
      }
      function projectCurrentOwner(project) {
        if (project.stage === "已取消")
          return project.cancelledOwner || project.ownerSnapshot || "—";
        const facts = projectCustomerFacts(project);
        const resolvedOwner = facts ? resolveProjectOwner(facts) : "";
        return resolvedOwner || project.currentOwner || "待配置";
      }
      function projectRegionScope(project) {
        const facts = projectCustomerFacts(project);
        if (!facts) return "待配置区域";
        const region = regionsData.find((item) =>
          regionProvinceList(item).includes(facts.province),
        );
        return region ? regionScopeName(region) : facts.region || "待配置区域";
      }
      function projectArea(project) {
        const facts = projectCustomerFacts(project);
        return facts ? adminArea(facts) : "—";
      }
      function projectIsVisibleToCurrentUser(project) {
        if (!currentUser || !project) return false;
        const facts = projectCustomerFacts(project);
        if (!facts) return false;
        if (currentUser.fullAccess || ["president", "vp"].includes(currentUser.role))
          return true;
        if (currentUser.role === "director")
          return regionsMatch(projectRegionScope(project), currentUser.region);
        if (currentUser.role === "pm")
          return projectCurrentOwner(project) === currentUser.name;
        return false;
      }
      function scopedProjects() {
        if (!currentUser) return [];
        return projects.filter(projectIsVisibleToCurrentUser);
      }
      function projectById(id) {
        return projects.find((project) => project.id === id);
      }
      function projectEditMode(project) {
        if (!project || !hasOperationPermission("projects.edit")) return null;
        const isOwner = projectCurrentOwner(project) === currentUser.name;
        if (!isOwner && !currentUser.fullAccess) return null;
        if (project.stage === "已立项" && project.startTime > DEMO_NOW)
          return "pre-start";
        if (project.stage === "进行中") return "in-progress";
        if (project.stage === "已交付") return "delivered";
        return null;
      }
      function canEditProject(project) {
        return Boolean(projectEditMode(project));
      }
      function projectChangeHistory(project) {
        return Array.isArray(project?.changeHistory) ? project.changeHistory : [];
      }
      function projectResponsibilityHistory(project) {
        return Array.isArray(project?.responsibilityHistory)
          ? project.responsibilityHistory
          : [];
      }
      const PROJECT_RESPONSIBILITY_TRANSFER_STAGES = new Set([
        "已立项",
        "进行中",
        "已交付",
        "已完成",
      ]);
      function projectResponsibilityTransferCandidates(spec) {
        const provinceNames = new Set(
          spec.kind === "region_director"
            ? regionProvinceList(spec.region)
            : [],
        );
        const cityKeys = new Set(
          spec.kind === "city_pm"
            ? (spec.owners || []).map(
                (owner) => `${owner.province}\u0000${owner.city}`,
              )
            : [],
        );
        return projects.filter((project) => {
          if (!PROJECT_RESPONSIBILITY_TRANSFER_STAGES.has(project.stage))
            return false;
          const facts = projectCustomerFacts(project);
          if (!facts) return false;
          if (spec.kind === "region_director")
            return facts.level === "省公司" && provinceNames.has(facts.province);
          return cityKeys.has(`${facts.province}\u0000${facts.city}`);
        });
      }
      function prepareProjectResponsibilityTransfer(spec) {
        const candidates = projectResponsibilityTransferCandidates(spec);
        const target = employees.find(
          (employee) =>
            employee.name === spec.toOwner &&
            employee.status === "在职" &&
            employee.accountStatus !== "停用",
        );
        if (candidates.length && (!spec.fromOwner || !target))
          return {
            ok: false,
            error: "项目原负责人或目标负责人已失效，地区责任保持不变",
          };
        if (
          candidates.length &&
          spec.kind === "city_pm" &&
          !employeeHasRole(target, "PM")
        )
          return {
            ok: false,
            error: "目标员工不具备当前地区 PM 资格，地区责任保持不变",
          };
        if (candidates.length && spec.fromOwner === spec.toOwner)
          return {
            ok: false,
            error: "项目原负责人和目标负责人相同，地区责任未变更",
          };
        const invalidProject = candidates.find(
          (project) =>
            projectCurrentOwner(project) !== spec.fromOwner ||
            (project.responsibilityHistory != null &&
              !Array.isArray(project.responsibilityHistory)),
        );
        if (invalidProject)
          return {
            ok: false,
            error: `项目 ${invalidProject.id} 当前负责人或责任历史已变化，地区责任保持不变`,
          };
        return {
          ok: true,
          spec,
          projectIds: candidates.map((project) => project.id).sort(),
          projects: candidates,
        };
      }
      function applyProjectResponsibilityTransfer(plan, audit) {
        if (!plan?.ok) return plan || { ok: false, error: "项目责任迁移计划无效" };
        const refreshed = prepareProjectResponsibilityTransfer(plan.spec);
        if (!refreshed.ok) return refreshed;
        if (
          refreshed.projectIds.length !== plan.projectIds.length ||
          refreshed.projectIds.some((id, index) => id !== plan.projectIds[index])
        )
          return {
            ok: false,
            error: "适用项目集合已变化，地区责任保持不变",
          };
        const snapshots = refreshed.projects.map((project) => [
          project,
          JSON.parse(JSON.stringify(project)),
        ]);
        try {
          refreshed.projects.forEach((project) => {
            project.currentOwner = plan.spec.toOwner;
            project.responsibilityHistory = [
              ...(project.responsibilityHistory || []),
              {
                type:
                  plan.spec.kind === "region_director"
                    ? "region_director_transfer"
                    : "city_responsibility_transfer",
                fromOwner: plan.spec.fromOwner,
                toOwner: plan.spec.toOwner,
                area: projectArea(project),
                effectiveAt: audit.effectiveAt,
                operator: audit.operator,
                referenceId: audit.referenceId,
                referenceType: audit.referenceType,
                reason: audit.reason,
              },
            ];
          });
        } catch (error) {
          snapshots.forEach(([project, snapshot]) => {
            Object.keys(project).forEach((key) => delete project[key]);
            Object.assign(project, snapshot);
          });
          return {
            ok: false,
            error: "项目责任迁移失败，地区责任和项目负责人均保持不变",
          };
        }
        return {
          ok: true,
          projectIds: [...refreshed.projectIds],
          count: refreshed.projectIds.length,
        };
      }
      function staffSet(names) {
        return [...(names || [])].slice().sort((left, right) =>
          left.localeCompare(right, "zh-CN"),
        );
      }
      function staffSetsEqual(left, right) {
        const a = staffSet(left);
        const b = staffSet(right);
        return (
          a.length === b.length && a.every((name, index) => name === b[index])
        );
      }
      function staffDisplay(names) {
        return (names || []).join("、") || "—";
      }
      function escapeHtml(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }
      function projectPackageLabel(packageId) {
        if (!packageId) return "—";
        const pkg = projectPackages.find((item) => item.id === packageId);
        return pkg ? `${pkg.name}（${pkg.id}）` : packageId;
      }
      function projectCompanyLabel(companyId) {
        if (!companyId) return "—";
        const company = platformCompanies.find((item) => item.id === companyId);
        return company ? `${company.name}（${company.id}）` : companyId;
      }
      function projectMaterialCategories(project) {
        return PROJECT_MATERIAL_CATEGORIES[project?.type] || [];
      }
      function projectMaterials(project) {
        return Array.isArray(project?.materials) ? project.materials : [];
      }
      function projectSatisfaction(project) {
        return project?.satisfaction || null;
      }
      function projectMaterialRequiredCategories(project) {
        return projectMaterialCategories(project)
          .filter((category) => category.required)
          .map((category) => category.name);
      }
      function projectMaterialsComplete(project) {
        const materials = projectMaterials(project);
        return projectMaterialRequiredCategories(project).every((category) =>
          materials.some((material) => material.category === category),
        );
      }
      function projectCurrentStaffNames(project) {
        return [
          ...(project?.lecturers || []),
          ...(project?.assistantLecturers || []),
          ...(project?.teachingAssistants || []),
        ];
      }
      function validProjectScore(value) {
        if (value === null || value === undefined || value === "") return false;
        const n = Number(value);
        return Number.isFinite(n) && n >= 1 && n <= 100;
      }
      function projectSatisfactionComplete(project) {
        const satisfaction = projectSatisfaction(project);
        if (!satisfaction || !validProjectScore(satisfaction.projectScore)) return false;
        if (project.type === "AI软件项目") return true;
        if (!(project.lecturers || []).length) return false;
        return projectCurrentStaffNames(project).every((name) =>
          validProjectScore(satisfaction.staffScores?.[name]),
        );
      }
      function projectTodosForStage(project, stage) {
        if (stage === "已交付") {
          const todos = [];
          if (!projectMaterialsComplete(project)) todos.push("资料待上传");
          if (!projectSatisfactionComplete(project)) todos.push("待评价");
          todos.push("待回款");
          return todos;
        }
        if (stage === "已完成") return ["待回款"];
        return [];
      }
      function computeProjectStageAndTodos(project) {
        if (project.stage === "已取消") return { stage: "已取消", todos: [] };
        if (project.stage === "已完成") return { stage: "已完成", todos: ["待回款"] };
        let stage;
        if (project.startTime > DEMO_NOW) {
          stage = "已立项";
        } else if (project.type === "培训项目") {
          stage = project.endTime > DEMO_NOW ? "进行中" : "已交付";
        } else {
          stage = project.deliveryConfirmed ? "已交付" : "进行中";
        }
        if (
          stage === "已交付" &&
          projectMaterialsComplete(project) &&
          projectSatisfactionComplete(project)
        ) {
          stage = "已完成";
        }
        return { stage, todos: projectTodosForStage(project, stage) };
      }
      function projectTodosEqual(left, right) {
        const a = left || [];
        const b = right || [];
        return a.length === b.length && a.every((item, index) => item === b[index]);
      }
      function normalizeProjectLifecycle(project) {
        if (!project) return;
        const target = computeProjectStageAndTodos(project);
        if (target.stage !== project.stage) {
          recordProjectChange(project, "主阶段", project.stage, target.stage, "", "系统");
          project.stage = target.stage;
        }
        if (!projectTodosEqual(project.todos, target.todos)) {
          project.todos = target.todos;
        }
      }
      function normalizeAllProjectLifecycles() {
        projects.forEach(normalizeProjectLifecycle);
      }
      function projectActionTodoLabels(project) {
        if (!project || ["已完成", "已取消"].includes(project.stage)) return [];
        const labels = [];
        if (
          project.type === "AI软件项目" &&
          project.stage === "进行中" &&
          project.endTime <= DEMO_NOW &&
          !project.deliveryConfirmed
        )
          labels.push("确认 AI 项目交付");
        if (project.stage === "已交付")
          labels.push(
            ...(project.todos || []).filter((todo) =>
              PROJECT_ACTION_TODO_LABELS.includes(todo),
            ),
          );
        return labels;
      }
      function projectRegion(project) {
        const province = projectCustomerFacts(project)?.province;
        return regionsData.find((region) =>
          regionProvinceList(region).includes(province),
        );
      }
      function projectMomentValue(value) {
        const [datePart, timePart = "00:00"] = String(value).split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);
        return Date.UTC(year, month - 1, day, hour, minute);
      }
      function projectMomentAfterDays(value, days) {
        const moment = new Date(projectMomentValue(value) + days * 86400000);
        const pad = (number) => String(number).padStart(2, "0");
        return `${moment.getUTCFullYear()}-${pad(moment.getUTCMonth() + 1)}-${pad(moment.getUTCDate())} ${pad(moment.getUTCHours())}:${pad(moment.getUTCMinutes())}`;
      }
      function projectReminderTrigger(project, moment) {
        if (!project || ["已完成", "已取消"].includes(project.stage)) return null;
        if (
          project.type === "AI软件项目" &&
          !project.deliveryConfirmed &&
          project.endTime <= moment
        )
          return {
            kind: "ai-delivery",
            triggerAt: project.endTime,
            actionLabels: ["确认 AI 项目交付"],
          };
        if (
          project.type === "培训项目" &&
          project.endTime <= moment &&
          (!projectMaterialsComplete(project) ||
            !projectSatisfactionComplete(project))
        ) {
          const actionLabels = [];
          if (!projectMaterialsComplete(project)) actionLabels.push("资料待上传");
          if (!projectSatisfactionComplete(project)) actionLabels.push("待评价");
          return {
            kind: "training-completion",
            triggerAt: project.endTime,
            actionLabels,
          };
        }
        return null;
      }
      function projectReminderCandidatesForMoment(moment = DEMO_NOW) {
        return projects.flatMap((project) => {
          const trigger = projectReminderTrigger(project, moment);
          if (!trigger) return [];
          const elapsedDays = Math.floor(
            (projectMomentValue(moment) - projectMomentValue(trigger.triggerAt)) /
              86400000,
          );
          if (elapsedDays < 0) return [];
          const sentAt = projectMomentAfterDays(trigger.triggerAt, elapsedDays);
          const businessDate = sentAt.slice(0, 10);
          const owner = projectCurrentOwner(project);
          if (!owner || owner === "待配置") return [];
          const region = projectRegion(project);
          const missingText = trigger.actionLabels.join("、");
          const ownerTitle =
            trigger.kind === "ai-delivery"
              ? "AI 软件项目确认交付提醒"
              : "培训项目资料与评价提醒";
          const ownerContent =
            trigger.kind === "ai-delivery"
              ? `${project.id} · ${project.name}已到结束时间，待项目负责人确认交付。`
              : `${project.id} · ${project.name}当前${missingText}。`;
          const candidates = [
            {
              projectId: project.id,
              projectName: project.name,
              projectOwner: owner,
              projectRegion: region ? regionScopeName(region) : "待配置区域",
              reminderKind: trigger.kind,
              recipientKind: "owner",
              recipientName: owner,
              recipientRoles: ["pm", "director"],
              title: ownerTitle,
              content: ownerContent,
              sentAt,
              businessDate,
              elapsedDays,
              actionLabels: [...trigger.actionLabels],
            },
          ];
          if (
            elapsedDays >= 3 &&
            region?.director &&
            region.director !== owner
          )
            candidates.push({
              projectId: project.id,
              projectName: project.name,
              projectOwner: owner,
              projectRegion: regionScopeName(region),
              reminderKind: trigger.kind,
              recipientKind: "director",
              recipientName: region.director,
              recipientRoles: ["director"],
              title: "区域项目逾期监督提醒",
              content:
                trigger.kind === "ai-delivery"
                  ? `${project.id} · ${project.name}仍待负责人${owner}确认交付。`
                  : `${project.id} · ${project.name}由${owner}负责，当前${missingText}。`,
              sentAt,
              businessDate,
              elapsedDays,
              actionLabels: [...trigger.actionLabels],
            });
          return candidates;
        });
      }
      function projectActionTodoItemsForCurrentUser() {
        if (
          !currentUser ||
          ["president", "vp", "hr"].includes(currentUser.role) ||
          !hasPermission("projects") ||
          !hasOperationPermission("projects.edit")
        )
          return [];
        normalizeAllProjectLifecycles();
        const visibleProjects = currentUser.fullAccess
          ? projects
          : projects.filter(
              (project) =>
                projectIsVisibleToCurrentUser(project) &&
                projectCurrentOwner(project) === currentUser.name,
            );
        return visibleProjects.flatMap((project) =>
          projectActionTodoLabels(project)
            .filter((label) => {
              if (label === "确认 AI 项目交付")
                return canConfirmProjectDelivery(project);
              if (label === "资料待上传")
                return (
                  projectMaterialMaintenanceMode(project) === "full" &&
                  canUploadProjectMaterials()
                );
              if (label === "待评价")
                return canEditProjectSatisfaction(project);
              return false;
            })
            .map((label) => ({
              icon: "项",
              title: label,
              detail: `${project.id} · ${project.name} · ${projectCurrentOwner(project)}`,
              tone: label === "确认 AI 项目交付" ? "red" : "yellow",
              projectId: project.id,
              command: "处理",
            })),
        );
      }
      function projectReminderSummaryItemsForCurrentUser() {
        if (
          !currentUser ||
          currentUser.role === "hr" ||
          !hasPermission("projects")
        )
          return [];
        normalizeAllProjectLifecycles();
        const visibleProjects = projects.filter((project) => {
          if (currentUser.fullAccess) return true;
          if (["president", "vp"].includes(currentUser.role)) return true;
          return projectIsVisibleToCurrentUser(project);
        });
        const items = [];
        if (["president", "vp"].includes(currentUser.role))
          visibleProjects.forEach((project) => {
            projectActionTodoLabels(project).forEach((label) =>
              items.push({
                icon: "项",
                title: label,
                detail: `${project.id} · ${project.name} · 负责人 ${projectCurrentOwner(project)}`,
                tone: label === "确认 AI 项目交付" ? "red" : "yellow",
                projectId: project.id,
                command: "查看",
                order: 1,
              }),
            );
          });
        if (currentUser.role === "director")
          projectReminderCandidatesForMoment()
            .filter(
              (candidate) =>
                candidate.recipientKind === "director" &&
                candidate.recipientName === currentUser.name,
            )
            .forEach((candidate) =>
              items.push({
                icon: "监",
                title: candidate.title,
                detail: candidate.content,
                tone: "red",
                projectId: candidate.projectId,
                command: "查看",
                order: 0,
              }),
            );
        visibleProjects
          .filter((project) => (project.todos || []).includes("待回款"))
          .forEach((project) =>
            items.push({
              icon: "款",
              title: "待回款提醒",
              detail: `${project.id} · ${project.name} · 负责人 ${projectCurrentOwner(project)}`,
              tone: "blue",
              projectId: project.id,
              command: "查看",
              order: 2,
            }),
          );
        return items.sort(
          (left, right) =>
            left.order - right.order ||
            String(left.projectId).localeCompare(String(right.projectId)),
        );
      }
      function projectOperableByCurrentUser(project) {
        if (!project || !hasOperationPermission("projects.edit")) return false;
        return currentUser.fullAccess || projectCurrentOwner(project) === currentUser.name;
      }
      function canConfirmProjectDelivery(project) {
        if (!project || project.type !== "AI软件项目") return false;
        if (project.stage !== "进行中") return false;
        if (project.endTime > DEMO_NOW) return false;
        return projectOperableByCurrentUser(project);
      }
      function canCancelProject(project) {
        if (!project || !["已立项", "进行中", "已交付"].includes(project.stage))
          return false;
        return projectOperableByCurrentUser(project);
      }
      function canSupplementProjectMaterial(project) {
        if (!project || project.stage !== "已完成") return false;
        return projectOperableByCurrentUser(project) && canUploadProjectMaterials();
      }
      function projectMaterialMaintenanceMode(project) {
        if (!projectOperableByCurrentUser(project)) return "none";
        if (project.stage === "已交付") return "full";
        if (project.stage === "已完成") return "optional-add";
        return "none";
      }
      function canEditProjectSatisfaction(project) {
        return project.stage === "已交付" && projectOperableByCurrentUser(project);
      }
      function formatFileSize(bytes) {
        if (bytes == null) return "—";
        if (bytes >= 1024 * 1024 * 1024)
          return `${round2(bytes / (1024 * 1024 * 1024))} GB`;
        if (bytes >= 1024 * 1024) return `${round2(bytes / (1024 * 1024))} MB`;
        if (bytes >= 1024) return `${round2(bytes / 1024)} KB`;
        return `${bytes} B`;
      }
      function fileExtension(name) {
        const index = String(name || "").lastIndexOf(".");
        if (index <= 0) return "";
        return String(name).slice(index).toLowerCase();
      }
      function categoryAllowedExtensions(category) {
        return Object.keys(PROJECT_FILE_EXTENSION_RULES).filter((ext) =>
          category.kinds.includes(PROJECT_FILE_EXTENSION_RULES[ext].kind),
        );
      }
      function materialHistoryDisplay(material) {
        if (!material) return "—";
        return [
          material.id,
          material.category,
          material.name,
          material.kind,
          formatFileSize(material.size),
          material.addedBy,
          material.addedAt,
        ].join("｜");
      }
      function currentAccountKey() {
        const username = String(currentUser?.username || "").trim();
        if (username) return `username:${username}`;
        const phone = String(currentUser?.phone || "").trim();
        return phone ? `phone:${phone}` : "";
      }
      function setProjectMaterialResults(items, context = null) {
        projectMaterialResults = {
          accountKey: context?.accountKey || currentAccountKey(),
          projectId: context?.projectId || selectedProjectId || "",
          items: items || [],
        };
      }
      function currentProjectMaterialResults() {
        if (
          projectMaterialResults.accountKey !== currentAccountKey() ||
          projectMaterialResults.projectId !== (selectedProjectId || "")
        )
          return [];
        return projectMaterialResults.items || [];
      }
      function clearProjectMaterialResults() {
        projectMaterialResults = { accountKey: "", projectId: "", items: [] };
      }
      function fileHeaderMatches(ext, header) {
        const bytes = header || new Uint8Array(0);
        if (ext === ".pdf")
          return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 &&
            bytes[2] === 0x44 && bytes[3] === 0x46;
        if (ext === ".jpg" || ext === ".jpeg")
          return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 &&
            bytes[2] === 0xff;
        if (ext === ".png")
          return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
            bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d &&
            bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
        if (ext === ".mp4" || ext === ".mov")
          return bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 &&
            bytes[6] === 0x79 && bytes[7] === 0x70;
        if (ext === ".docx" || ext === ".xlsx" || ext === ".pptx")
          return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
            bytes[2] === 0x03 && bytes[3] === 0x04;
        if (ext === ".doc" || ext === ".xls" || ext === ".ppt")
          return bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf &&
            bytes[2] === 0x11 && bytes[3] === 0xe0 && bytes[4] === 0xa1 &&
            bytes[5] === 0xb1 && bytes[6] === 0x1a && bytes[7] === 0xe1;
        return false;
      }
      async function readFileHeader(file) {
        try {
          const buffer = await file.slice(0, 16).arrayBuffer();
          return new Uint8Array(buffer);
        } catch (error) {
          return new Uint8Array(0);
        }
      }
      function canViewProjectMaterials() {
        return hasAttachmentPermission("attachment_view");
      }
      function canUploadProjectMaterials() {
        return hasAttachmentPermission("attachment_upload");
      }
      function canDeleteProjectMaterials() {
        return (
          canViewProjectMaterials() &&
          canUploadProjectMaterials() &&
          hasAttachmentPermission("attachment_delete")
        );
      }
      function resolveProjectOwner(facts) {
        if (!facts) return "";
        if (facts.level === "省公司") {
          const regions = regionsData.filter(
            (region) =>
              region.director &&
              regionProvinceList(region).includes(facts.province),
          );
          if (regions.length !== 1) return "";
          const matches = employees.filter(
            (employee) =>
              employee.name === regions[0].director &&
              employee.status === "在职" &&
              employeeHasRole(employee, "区域总监"),
          );
          if (matches.length !== 1) return "";
          return regions[0].director;
        }
        const cityMatches = cityOwners.filter(
          (item) =>
            item.province === facts.province &&
            item.city === facts.city &&
            item.pm,
        );
        if (cityMatches.length !== 1) return "";
        const matches = employees.filter(
          (employee) =>
            employee.name === cityMatches[0].pm &&
            employee.status === "在职" &&
            employeeHasRole(employee, "PM"),
        );
        if (matches.length !== 1) return "";
        return cityMatches[0].pm;
      }
      function formatProjectMoney(value) {
        if (value === null || value === undefined) return "—";
        return Number(value).toLocaleString("zh-CN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      function projectStageTone(stage) {
        if (stage === "已立项") return "blue";
        if (["进行中", "已交付"].includes(stage)) return "blue";
        if (stage === "已完成") return "green";
        return "";
      }
      function projectTodoTone(todo) {
        if (todo === "资料待上传") return "orange";
        if (todo === "待评价") return "blue";
        return "yellow";
      }
      function projectStageTag(stage) {
        return `<span class="tag ${projectStageTone(stage)}">${stage}</span>`;
      }
      function projectTodoTags(todos) {
        if (!todos || !todos.length) return '<span class="panel-sub">—</span>';
        return todos
          .map((todo) => `<span class="tag ${projectTodoTone(todo)}">${todo}</span>`)
          .join(" ");
      }
      function projectEmptyState(message) {
        return `<tr data-empty-row><td colspan="13"><div class="empty"><div class="empty-icon">○</div><strong>暂无项目</strong><p class="panel-sub">${message}</p></div></td></tr>`;
      }
      function projectRowHtml(project) {
        const customerName = projectCustomerFacts(project)?.name || "—";
        const area = projectArea(project);
        const owner = projectCurrentOwner(project);
        const projectId = escapeHtml(project.id);
        const projectName = escapeHtml(project.name);
        const projectNameFilter = escapeHtml(project.name.toLowerCase());
        const customerNameText = escapeHtml(customerName);
        const areaText = escapeHtml(area);
        const ownerText = escapeHtml(owner);
        return (
          `<tr data-page-row data-project-row data-id="${projectId}" ` +
          `data-name="${projectNameFilter}" ` +
          `data-type="${project.type}" data-stage="${project.stage}" ` +
          `data-todos="${project.todos.join("|")}" data-customer="${customerNameText}" ` +
          `data-area="${areaText}" data-owner="${ownerText}" ` +
          `data-start="${project.startTime.slice(0, 10)}" ` +
          `data-end="${project.endTime.slice(0, 10)}">` +
          `<td>${projectId}</td>` +
          `<td><button class="link" data-project-open="${projectId}">${projectName}</button></td>` +
          `<td>${project.type}</td><td>${customerNameText}</td><td>${areaText}</td><td>${ownerText}</td>` +
          `<td>${project.startTime}</td><td>${project.endTime}</td>` +
          `<td>${project.days}</td><td>¥${formatProjectMoney(project.amount)}</td>` +
          `<td>${projectStageTag(project.stage)}</td>` +
          `<td>${projectTodoTags(project.todos)}</td><td>—</td></tr>`
        );
      }
      function renderProjects() {
        if (!currentUser) return "";
        normalizeAllProjectLifecycles();
        const visible = scopedProjects()
          .slice()
          .sort(
            (left, right) =>
              String(right.createdAt || "").localeCompare(
                String(left.createdAt || ""),
              ) || right.id.localeCompare(left.id),
          );
        const customerOptions = [
          ...new Set(
            visible.map((project) => projectCustomerFacts(project)?.name).filter(Boolean),
          ),
        ].sort((left, right) => left.localeCompare(right, "zh-CN"));
        const areaOptions = [...new Set(visible.map(projectArea))].sort((left, right) =>
          left.localeCompare(right, "zh-CN"),
        );
        const ownerOptions = [
          ...new Set(visible.map(projectCurrentOwner)),
        ].sort((left, right) => left.localeCompare(right, "zh-CN"));
        const selectOptions = (options, emptyLabel) =>
          `<option value="">${emptyLabel}</option>${options
            .map((option) => `<option value="${option}">${option}</option>`)
            .join("")}`;
        const projectFilterField = (label, controlHtml) =>
          `<label class="project-filter-field"><span class="project-filter-label">${label}</span>${controlHtml}</label>`;
        const filterFields = [
          projectFilterField(
            "项目编号",
            '<input class="input" id="projectId" maxlength="100" placeholder="项目编号">',
          ),
          projectFilterField(
            "项目名称",
            '<input class="input" id="projectName" maxlength="100" placeholder="项目名称">',
          ),
          projectFilterField(
            "项目类型",
            `<select class="input" id="projectType">${selectOptions(PROJECT_TYPES, "全部")}</select>`,
          ),
          projectFilterField(
            "主阶段",
            `<select class="input" id="projectStage">${selectOptions(PROJECT_STAGES, "全部")}</select>`,
          ),
          projectFilterField(
            "待办标识",
            `<select class="input" id="projectTodo">${selectOptions(PROJECT_TODO_LABELS, "全部")}</select>`,
          ),
          projectFilterField(
            "客户",
            `<select class="input" id="projectCustomer">${selectOptions(customerOptions, "全部")}</select>`,
          ),
          projectFilterField(
            "地区",
            `<select class="input" id="projectArea">${selectOptions(areaOptions, "全部")}</select>`,
          ),
          projectFilterField(
            "当前负责人",
            `<select class="input" id="projectOwner">${selectOptions(ownerOptions, "全部")}</select>`,
          ),
          projectFilterField(
            "项目开始时间",
            '<input class="input" id="projectStartFrom" type="date">',
          ),
          projectFilterField(
            "项目结束时间",
            '<input class="input" id="projectEndTo" type="date">',
          ),
        ].join("");
        const toolbar =
          '<div class="project-list-toolbar">' +
          `<div class="project-filter-grid">${filterFields}</div>` +
          '<div class="project-filter-footer"><div class="project-filter-actions">' +
          '<button class="btn btn-primary" id="queryProjectFilters" type="button">筛选</button>' +
          '<button class="btn" id="resetProjectFilters" type="button">重置</button>' +
          "</div></div></div>";
        const headerCells = [
          "项目编号",
          "项目名称",
          "项目类型",
          "客户公司",
          "地区",
          "当前负责人",
          "开始时间",
          "结束时间",
          "项目确认天数",
          "项目金额",
          "主阶段",
          "并行待办标识",
          "当前可用操作",
        ]
          .map((header) => `<th>${header}</th>`)
          .join("");
        const bodyRows = visible.length
          ? visible.map(projectRowHtml).join("")
          : projectEmptyState("当前账号数据范围内没有可查看的项目。");
        const filteredEmpty =
          '<tr data-filter-empty style="display:none">' +
          '<td colspan="13"><div class="empty">未找到符合条件的项目，请调整筛选条件或重置。</div></td></tr>';
        const table =
          '<div class="table-wrap project-table-wrap"><table class="project-table" data-paged-table="m11-projects">' +
          `<thead><tr>${headerCells}</tr></thead>` +
          `<tbody id="projectBody">${bodyRows}${filteredEmpty}</tbody></table></div>${tablePagination("m11-projects")}`;
        const createActions = hasOperationPermission("projects.create")
          ? '<button class="btn btn-primary" data-project-create>创建项目</button>'
          : "";
        return (
          '<div class="project-page project-list-page">' +
          pageHead(
            "项目管理",
            "按当前账号数据范围查看项目列表与筛选，结果不返回数据范围之外的项目。",
            createActions,
          ) +
          `<section class="panel project-list-panel">${toolbar}${table}</section>` +
          "</div>"
        );
      }
      function projectBasicTab(project) {
        const facts = projectCustomerFacts(project);
        const packageName = project.packageId
          ? projectPackages.find((item) => item.id === project.packageId)?.name
          : "";
        const items = [
          ["项目编号", project.id],
          ["项目类型", project.type],
          ["所属商机编号", project.opportunityId || "—"],
          ["客户编号", facts?.customerCode || "—"],
          ["客户公司", facts?.name || "—"],
          ["地区", projectArea(project)],
          ["当前项目负责人", projectCurrentOwner(project)],
          ["创建负责人快照", project.ownerSnapshot],
          ["创建时间", project.createdAt],
          ["创建操作人", project.createdBy],
          ["开始时间", project.startTime],
          ["结束时间", project.endTime],
          ["系统计算天数", `${projectCalculatedDays(project)} 天`],
          ["项目确认天数", `${project.days} 天`],
          ["资源类型", project.resourceType],
          ["合作形式", project.cooperation],
          ...(project.packageId
            ? [["采购包", `${packageName}（${project.packageId}）`]]
            : []),
          ...(project.directionIntro
            ? [["课程方向", project.directionIntro]]
            : []),
          ...(project.companyId
            ? [["平台公司", `${project.companyName}（${project.companyId}）`]]
            : []),
          ...(project.snapshot?.untaxedPrice != null
            ? [["课程不含税报价", `${formatProjectMoney(project.snapshot.untaxedPrice)} 元/天`]]
            : []),
          ...(project.snapshot?.taxedPrice != null
            ? [["课程含税报价", `${formatProjectMoney(project.snapshot.taxedPrice)} 元/天`]]
            : []),
          ...(project.snapshot?.taxRate != null
            ? [["税率", formatConfigPercent(project.snapshot.taxRate)]]
            : []),
          ...(project.snapshot?.cooperationPay != null
            ? [["平台合作课酬", `${formatProjectMoney(project.snapshot.cooperationPay)} 元/天`]]
            : []),
          ...(project.snapshot?.managementFeeRate != null
            ? [["管理费比例", formatConfigPercent(project.snapshot.managementFeeRate)]]
            : []),
          [
            "项目单价",
            project.type === "培训项目"
              ? `${formatProjectMoney(project.unitPrice)} 元/天`
              : "—",
          ],
          ["项目金额（含税）", `${formatProjectMoney(project.amount)} 元`],
          ["结账金额", `${formatProjectMoney(project.settlementAmount)} 元`],
        ];
        return `<div class="project-detail-section"><div class="section-title">项目基本信息</div><div class="detail-grid">${items
          .map(
            ([label, value]) =>
              `<div class="detail-item"><label>${escapeHtml(label)}</label><div>${escapeHtml(value)}</div></div>`,
          )
          .join("")}</div></div>`;
      }
      function projectStaffTab(project) {
        if (project.type === "AI软件项目") return "";
        const items = [
          ["主讲师", project.lecturers.join("、") || "—"],
          ["辅讲师", project.assistantLecturers.join("、") || "—"],
          ["项目助教", project.teachingAssistants.join("、") || "—"],
        ];
        return `<div class="project-detail-section"><div class="section-title">项目人员安排</div><div class="detail-grid">${items
          .map(
            ([label, value]) =>
              `<div class="detail-item"><label>${escapeHtml(label)}</label><div>${escapeHtml(value)}</div></div>`,
          )
          .join("")}</div></div>`;
      }
      function projectSatisfactionHtml(project) {
        const satisfaction = projectSatisfaction(project);
        const isTraining = project.type === "培训项目";
        const editSatisfaction = canEditProjectSatisfaction(project);
        const staffNames = isTraining ? projectCurrentStaffNames(project) : [];
        const staffLabel = (name) =>
          project.lecturers.includes(name)
            ? "主讲师满意度"
            : project.assistantLecturers.includes(name)
              ? "辅讲师满意度"
              : "项目助教满意度";
        if (editSatisfaction) {
          const staffInputs = staffNames
            .map((name, index) => {
              const value = satisfaction?.staffScores?.[name];
              return `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>${staffLabel(name)}（${escapeHtml(name)}）</label><input class="input" type="number" min="1" max="100" step="0.01" id="sat-staff-${index}" value="${value ?? ""}"></div>`;
            })
            .join("");
          return (
            `<div class="form-grid">` +
            `<div class="form-group"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>项目满意度</label><input class="input" type="number" min="1" max="100" step="0.01" id="satProjectScore" value="${satisfaction?.projectScore ?? ""}"></div>` +
            staffInputs +
            `</div>` +
            `<div class="field-error" id="satErrors"></div>` +
            '<div class="project-satisfaction-actions"><button class="btn btn-primary" type="button" data-satisfaction-save>保存满意度</button></div>'
          );
        }
        const rows = [
          ["项目满意度", satisfaction?.projectScore ?? "—"],
          ...(isTraining
            ? staffNames.map((name) => [
                `${staffLabel(name)}（${name}）`,
                satisfaction?.staffScores?.[name] ?? "—",
              ])
            : []),
        ];
        if (rows.every(([, value]) => value === "—"))
          return '<div class="empty">暂无满意度评分</div>';
        return `<div class="table-wrap"><table><thead><tr><th>满意度对象</th><th>评分</th></tr></thead><tbody>${rows
          .map(
            ([label, value]) =>
              `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`;
      }
      function projectMaterialsTab(project) {
        const categories = projectMaterialCategories(project);
        const materials = projectMaterials(project);
        const maintenanceMode = projectMaterialMaintenanceMode(project);
        const canView = canViewProjectMaterials();
        const canUpload = canUploadProjectMaterials();
        const canDelete = canDeleteProjectMaterials();
        const materialRows = categories
          .map((category) => {
            const files = materials.filter(
              (material) => material.category === category.name,
            );
            const filesHtml = !canView
              ? '<span class="panel-sub">—</span>'
              : files.length
                ? files
                    .map((file) => {
                      const deleteBtn =
                        maintenanceMode === "full" && canDelete
                          ? `<button class="link" data-material-delete="${file.id}">删除</button>`
                          : "";
                      const replaceBtn =
                        maintenanceMode === "full" && canUpload && canDelete
                          ? `<button class="link" data-material-replace="${file.id}">替换</button>`
                          : "";
                      return `<div class="material-file"><div class="material-file-main"><span class="material-file-name">${escapeHtml(file.name)}</span><span class="list-sub">${formatFileSize(file.size)} · ${escapeHtml(file.addedBy)} · ${escapeHtml(file.addedAt)}</span></div><div class="material-file-actions">${deleteBtn}${replaceBtn}</div></div>`;
                    })
                    .join("")
                : '<span class="panel-sub">暂无</span>';
            const canAdd =
              canUpload &&
              (maintenanceMode === "full" ||
                (maintenanceMode === "optional-add" && !category.required));
            const addBtn = canAdd
              ? `<button class="link" data-material-add="${category.name}">添加文件</button>`
              : "";
            return `<tr><td>${category.name}</td><td>${category.required ? "必填" : "可选"}</td><td>${filesHtml}</td><td>${addBtn}</td></tr>`;
          })
          .join("");
        const results = currentProjectMaterialResults();
        const resultsHtml = results.length
          ? `<div class="project-detail-section project-material-results"><div class="section-title">文件处理结果</div><div>${results
              .map(
                (result) =>
                  `<div class="material-result ${result.ok ? "ok" : "fail"}">${escapeHtml(result.name)}：${result.ok ? "已建立关联" : escapeHtml(result.reason)}</div>`,
              )
              .join("")}</div></div>`
          : "";
        return (
          `<div class="project-detail-section"><div class="section-title">项目资料</div><div class="table-wrap project-material-table-wrap"><table class="project-material-table"><thead><tr><th>资料分类</th><th>是否必填</th><th>已有文件</th><th>操作</th></tr></thead><tbody>${materialRows || '<tr data-empty-row><td colspan="4"><div class="empty">暂无资料分类</div></td></tr>'}</tbody></table></div></div>` +
          '<input type="file" id="materialAddInput" multiple style="display:none">' +
          '<input type="file" id="materialReplaceInput" style="display:none">' +
          resultsHtml
        );
      }
      function projectSatisfactionTab(project) {
        return `<div class="project-detail-section"><div class="section-title">满意度（1-100 分）</div>${projectSatisfactionHtml(project)}</div>`;
      }
      function projectHistoryTab(project) {
        const currentOwner = projectCurrentOwner(project);
        const responsibilityHistory = projectResponsibilityHistory(project);
        const responsibilityHtml = responsibilityHistory.length
          ? responsibilityHistory
              .map((item) => {
                const ownerChange =
                  item.fromOwner === item.toOwner
                    ? `员工停用，项目保留原负责人 ${escapeHtml(item.toOwner)}`
                    : `项目负责人 ${escapeHtml(item.fromOwner)} → ${escapeHtml(item.toOwner)}`;
                return `<div class="timeline-item"><div>${ownerChange}</div><div class="detail-sub">${escapeHtml(item.area || "—")} · ${escapeHtml(item.effectiveAt || "—")} · 操作人 ${escapeHtml(item.operator || "—")}${item.referenceId ? ` · 关联 ${escapeHtml(item.referenceId)}` : ""}${item.reason ? ` · 原因 ${escapeHtml(item.reason)}` : ""}</div></div>`;
              })
              .join("")
          : "";
        const changes = projectChangeHistory(project);
        const changeHtml = changes.length
          ? `<div class="timeline">${changes
              .map(
                (change) =>
                  `<div class="timeline-item"><div>${escapeHtml(change.field)}：${escapeHtml(change.before)} → ${escapeHtml(change.after)}</div><div class="detail-sub">${escapeHtml(change.operator)} · ${escapeHtml(change.time)}${change.reason ? ` · ${escapeHtml(change.reason)}` : ""}</div></div>`,
              )
              .join("")}</div>`
          : '<div class="empty">暂无字段变更记录</div>';
        return `<div class="project-detail-section"><div class="section-title">项目责任</div><div class="detail-grid"><div class="detail-item"><label>创建负责人快照</label><div>${escapeHtml(project.ownerSnapshot)}</div></div><div class="detail-item"><label>当前项目负责人</label><div>${escapeHtml(currentOwner)}</div></div></div></div><div class="project-detail-section"><div class="section-title">责任历史</div><div class="timeline"><div class="timeline-item"><div>创建立项，按客户地区责任匹配项目负责人 ${escapeHtml(project.ownerSnapshot)}</div><div class="detail-sub">${escapeHtml(project.createdAt)}</div></div>${responsibilityHtml}</div></div><div class="project-detail-section"><div class="section-title">变更历史</div>${changeHtml}</div>`;
      }
      function renderProjectDetail() {
        if (!currentUser) return "";
        const project = projectById(selectedProjectId);
        normalizeProjectLifecycle(project);
        if (!project || !projectIsVisibleToCurrentUser(project)) {
          return (
            '<div class="project-page project-detail-page">' +
            pageHead("项目详情", "当前账号没有查看该项目的权限。") +
            `<section class="panel project-detail-panel"><div class="empty"><div class="empty-icon">403</div><strong>无权访问</strong><p class="panel-sub">该账号无权查看此项目，未返回项目是否存在或任何项目信息。</p></div></section>` +
            "</div>"
          );
        }
        const tabs = [
          ["basic", "基本信息"],
          ["staff", "人员安排"],
          ["materials", "资料"],
          ["satisfaction", "满意度"],
          ["history", "变更与责任历史"],
        ];
        const tabContent = {
          basic: projectBasicTab(project),
          staff: projectStaffTab(project),
          materials: projectMaterialsTab(project),
          satisfaction: projectSatisfactionTab(project),
          history: projectHistoryTab(project),
        }[projectDetailTab];
        const detailActions = [
          canEditProject(project)
            ? `<button class="btn btn-primary" data-project-edit>编辑</button>`
            : "",
          canConfirmProjectDelivery(project)
            ? `<button class="btn btn-primary" data-project-confirm-delivery>确认 AI 软件项目交付</button>`
            : "",
          canCancelProject(project)
            ? `<button class="btn" data-project-cancel-open>取消</button>`
            : "",
          canSupplementProjectMaterial(project)
            ? `<button class="btn" data-project-supplement>补充资料</button>`
            : "",
          '<button class="btn" id="backToProjects">返回项目列表</button>',
        ].join(" ");
        return (
          '<div class="project-page project-detail-page">' +
          pageHead(
            "项目详情",
            "",
            detailActions,
          ) +
          `<section class="panel project-detail-panel"><div class="detail-hero project-detail-hero"><div class="avatar">项</div><div class="project-detail-identity"><div class="detail-name">${escapeHtml(project.name)}</div></div><div class="spacer"></div>${projectStageTag(project.stage)}</div><div class="tabs detail-tabs">${tabs
            .map(
              ([key, label]) =>
                `<button class="tab ${projectDetailTab === key ? "active" : ""}" data-project-tab="${key}">${label}</button>`,
            )
            .join("")}</div><div class="panel-body project-detail-body">${tabContent}</div></section>` +
          "</div>"
        );
      }
      function projectDirectionTaxRate(direction) {
        const untaxed = Number(direction?.untaxedPrice);
        const taxed = Number(direction?.taxedPrice);
        if (!untaxed) return null;
        return ((taxed - untaxed) / untaxed) * 100;
      }
      function formatConfigPercent(value) {
        if (value === null || value === undefined) return "—";
        return `${Number(value).toFixed(2)}%`;
      }
      function configStatusTag(status) {
        return `<span class="tag ${status === "正常" ? "green" : ""}">${status}</span>`;
      }
      function isProjectPackageValid(pkg) {
        return (
          pkg.status === "正常" &&
          pkg.validFrom <= DEMO_TODAY &&
          pkg.validTo >= DEMO_TODAY
        );
      }
      function scopedProjectPackages() {
        if (!currentUser || !hasOperationPermission("packages.view")) return [];
        if (hasOperationPermission("packages.manage")) return projectPackages;
        return projectPackages.filter(isProjectPackageValid);
      }
      function scopedPlatformCompanies() {
        if (!currentUser || !hasOperationPermission("platform-companies.view"))
          return [];
        if (hasOperationPermission("platform-companies.manage"))
          return platformCompanies;
        return platformCompanies.filter((company) => company.status === "正常");
      }
      function projectPackageDirectionsHtml(pkg) {
        return pkg.directions
          .map((direction) => {
            const rate = projectDirectionTaxRate(direction);
            const rateText = rate === null ? "—" : formatConfigPercent(rate);
            return `<div class="project-package-direction"><div class="project-package-direction-name">${direction.intro}</div><div class="list-sub">不含税 ${formatProjectMoney(direction.untaxedPrice)} 元/天 · 含税 ${formatProjectMoney(direction.taxedPrice)} 元/天 · 税率 ${rateText}</div></div>`;
          })
          .join("");
      }
      function renderProjectPackages() {
        if (!currentUser) return "";
        if (!hasOperationPermission("packages.view"))
          return forbiddenPage("采购包管理", "当前账号无采购包查看权限。");
        const canManage = hasOperationPermission("packages.manage");
        const visible = scopedProjectPackages()
          .slice()
          .sort((left, right) => left.id.localeCompare(right.id));
        const actions = canManage
          ? '<button class="btn btn-primary" data-config-action="add-package">新增采购包</button>'
          : "";
        const rows = visible
          .map((pkg) => {
            const ops = canManage
              ? `<span class="project-config-actions"><button class="link" data-config-action="edit-package" data-config-id="${pkg.id}">编辑</button><button class="link" data-config-action="${pkg.status === "正常" ? "stop-package" : "restore-package"}" data-config-id="${pkg.id}">${pkg.status === "正常" ? "停用" : "恢复"}</button></span>`
              : "—";
            return `<tr><td>${pkg.id}</td><td>${pkg.name}</td><td>${configStatusTag(pkg.status)}</td><td>${pkg.validFrom} ~ ${pkg.validTo}</td><td>${projectPackageDirectionsHtml(pkg)}</td><td>${ops}</td></tr>`;
          })
          .join("");
        return (
          '<div class="project-page project-config-page">' +
          pageHead(
            "采购包管理",
            "查看采购包编号、名称、状态、有效期与课程方向。",
            actions,
          ) +
          `<section class="panel project-config-panel"><div class="table-wrap project-config-table-wrap"><table class="project-config-table project-package-table"><thead><tr><th>采购包编号</th><th>采购包名称</th><th>状态</th><th>有效期</th><th>课程方向</th><th>操作</th></tr></thead><tbody>${rows || '<tr data-empty-row><td colspan="6"><div class="empty">暂无采购包</div></td></tr>'}</tbody></table></div></section>` +
          "</div>"
        );
      }
      const PROJECT_RESOURCE_COOPERATION = {
        "采购包课程": ["直接服务", "走账合作"],
        "平台师资合作": ["师资合作"],
        "AI区域框架": ["直接服务", "走账合作"],
      };
      function projectResourceTypes(type) {
        if (type === "培训项目") return ["采购包课程", "平台师资合作"];
        if (type === "AI软件项目") return ["AI区域框架"];
        return [];
      }
      function projectCreatableCustomers() {
        if (!currentUser) return [];
        if (currentUser.fullAccess)
          return customers.filter((customer) => !customer.archived);
        if (currentUser.role === "pm") {
          const cities = assignedCitiesForCurrentUser();
          return customers.filter(
            (customer) =>
              !customer.archived &&
              customer.level !== "省公司" &&
              cities.includes(customer.city),
          );
        }
        if (currentUser.role === "director") {
          return customers.filter(
            (customer) =>
              !customer.archived &&
              customer.level === "省公司" &&
              regionsMatch(customerRegionScope(customer), currentUser.region),
          );
        }
        return [];
      }
      function projectClockParts(time) {
        const [hour, minute] = time.split(":").map(Number);
        return { hour, minute };
      }
      function projectTimeNotAfterNoon(time) {
        const { hour, minute } = projectClockParts(time);
        return hour < 12 || (hour === 12 && minute === 0);
      }
      function projectTimeAtOrAfterNoon(time) {
        return projectClockParts(time).hour >= 12;
      }
      function naturalDayCount(startTime, endTime) {
        const startDate = startTime.slice(0, 10);
        const endDate = endTime.slice(0, 10);
        const startClock = startTime.slice(11);
        const endClock = endTime.slice(11);
        if (startDate === endDate) {
          if (projectTimeAtOrAfterNoon(startClock)) return 0.5;
          return projectTimeNotAfterNoon(endClock) ? 0.5 : 1;
        }
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T00:00:00`);
        const middleDays = Math.round((end - start) / 86400000) - 1;
        const startPart = projectTimeAtOrAfterNoon(startClock) ? 0.5 : 1;
        const endPart = projectTimeNotAfterNoon(endClock) ? 0.5 : 1;
        return startPart + middleDays + endPart;
      }
      function projectCalculatedDays(project) {
        if (!project?.startTime || !project?.endTime) return project?.days || "";
        return naturalDayCount(project.startTime, project.endTime);
      }
      function round2(value) {
        return Math.round(value * 100) / 100;
      }
      function projectFormFieldHtml(id, label, innerHtml, requiredLabel) {
        return `<div class="form-group"><label class="form-label">${requiredLabel ? '<span class="required-marker" aria-hidden="true">*</span>' : ""}${label}</label>${innerHtml}<div class="field-error" id="err-${id}"></div></div>`;
      }
      function instructorCheckboxGrid(id, selectedNames) {
        return `<div class="choice-grid" id="${id}">${projectInstructors
          .map(
            (name) =>
              `<label class="choice-item"><input type="checkbox" data-instructor value="${name}" ${selectedNames.includes(name) ? "checked" : ""}><span>${name}</span></label>`,
          )
          .join("")}</div>`;
      }
      function projectFormHtml(project) {
        const editing = Boolean(project);
        const type = project?.type || "";
        const daysHelpText =
          type === "培训项目"
            ? "项目费用按此天数计算"
            : type === "AI软件项目"
              ? "仅用于记录项目周期，不参与项目金额计算"
              : "";
        const calculatedDays = project ? projectCalculatedDays(project) : "";
        const confirmationDaysEdited = Boolean(
          project && project.days !== calculatedDays,
        );
        const resourceType = project?.resourceType || "";
        const cooperation = project?.cooperation || "";
        const validPackages = projectPackages.filter(isProjectPackageValid);
        const validCompanies = platformCompanies.filter(
          (company) => company.status === "正常",
        );
        const referencedPackage = project?.packageId
          ? projectPackages.find((pkg) => pkg.id === project.packageId)
          : null;
        const referencedCompany = project?.companyId
          ? platformCompanies.find((company) => company.id === project.companyId)
          : null;
        const packageCandidates = [];
        if (referencedPackage) packageCandidates.push(referencedPackage);
        validPackages.forEach((pkg) => {
          if (!packageCandidates.some((item) => item.id === pkg.id))
            packageCandidates.push(pkg);
        });
        const companyCandidates = [];
        if (referencedCompany) companyCandidates.push(referencedCompany);
        validCompanies.forEach((company) => {
          if (!companyCandidates.some((item) => item.id === company.id))
            companyCandidates.push(company);
        });
        const customerOptions = editing
          ? `<option value="${project.customerId}" selected>${project.customerSnapshot?.name || "—"}（${project.customerSnapshot?.level || "—"}）</option>`
          : projectCreatableCustomers()
              .map(
                (customer) =>
                  `<option value="${customer.id}" ${project?.customerId === customer.id ? "selected" : ""}>${customer.name}（${customer.level}）</option>`,
              )
              .join("");
        const resourceOptions = `<option value="">请选择资源类型</option>${projectResourceTypes(type)
          .map(
            (item) =>
              `<option value="${item}" ${resourceType === item ? "selected" : ""}>${item}</option>`,
          )
          .join("")}`;
        const cooperationOptions = `<option value="">请选择合作形式</option>${(
          PROJECT_RESOURCE_COOPERATION[resourceType] || []
        )
          .map(
            (item) =>
              `<option value="${item}" ${cooperation === item ? "selected" : ""}>${item}</option>`,
          )
          .join("")}`;
        const packageOptions = `<option value="">请选择采购包</option>${packageCandidates
          .map(
            (pkg) =>
              `<option value="${pkg.id}" ${project?.packageId === pkg.id ? "selected" : ""}>${pkg.name}（${pkg.id}）</option>`,
          )
          .join("")}`;
        const referencedDirections =
          packageCandidates.find((pkg) => pkg.id === (project?.packageId || ""))
            ?.directions || [];
        const directionList = [...referencedDirections];
        if (
          editing &&
          project?.directionIntro &&
          !directionList.some((direction) => direction.intro === project.directionIntro)
        ) {
          directionList.push({ intro: project.directionIntro });
        }
        const directionOptions = `<option value="">请选择课程方向</option>${directionList
          .map(
            (direction) =>
              `<option value="${direction.intro}" ${project?.directionIntro === direction.intro ? "selected" : ""}>${direction.intro}</option>`,
          )
          .join("")}`;
        const companyOptions = `<option value="">请选择平台公司</option>${companyCandidates
          .map(
            (company) =>
              `<option value="${company.id}" ${project?.companyId === company.id ? "selected" : ""}>${company.name}（${company.id}）</option>`,
          )
          .join("")}`;
        const isTraining = type === "培训项目";
        const amountField = isTraining
          ? `<input class="input" id="pfAmount" value="${project ? round2(project.amount) : ""}" disabled>`
          : `<input class="input" id="pfAmount" type="number" step="0.01" value="${project ? round2(project.amount) : ""}">`;
        const personnelHtml =
          `<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>主讲师</label>${instructorCheckboxGrid("pfLecturers", project?.lecturers || [])}<div class="field-error" id="err-pfLecturers"></div></div>` +
          `<div class="form-group full"><label class="form-label">辅讲师</label>${instructorCheckboxGrid("pfAssistants", project?.assistantLecturers || [])}</div>` +
          `<div class="form-group full"><label class="form-label">项目助教</label>${instructorCheckboxGrid("pfHelpers", project?.teachingAssistants || [])}</div>`;
        return (
          `<div class="form-grid">` +
          projectFormFieldHtml(
            "pfName",
            "项目名称",
            `<input class="input" id="pfName" value="${escapeHtml(project?.name || "")}">`,
            true,
          ) +
          projectFormFieldHtml(
            "pfType",
            "项目类型",
            `<select class="input" id="pfType" ${editing ? "disabled" : ""}><option value="">请选择项目类型</option>${PROJECT_TYPES.map((item) => `<option value="${item}" ${type === item ? "selected" : ""}>${item}</option>`).join("")}</select>`,
            true,
          ) +
          projectFormFieldHtml(
            "pfCustomer",
            "客户公司",
            `<select class="input" id="pfCustomer" ${editing ? "disabled" : ""}><option value="">请选择客户公司</option>${customerOptions}</select>`,
            true,
          ) +
          `<div class="form-group"><label class="form-label">客户编号</label><div class="input" id="pfCustomerCode">${project ? project.customerSnapshot?.customerCode || "—" : "—"}</div></div>` +
          `<div class="form-group"><label class="form-label">所属商机编号</label><input class="input" value="—" disabled></div>` +
          `<div class="form-group"><label class="form-label">地区</label><div class="input" id="pfArea">${project ? projectArea(project) : "—"}</div></div>` +
          `<div class="form-group"><label class="form-label">项目负责人</label><div class="input" id="pfOwner">${project ? projectCurrentOwner(project) : "—"}</div></div>` +
          `</div>` +
          `<div class="section-title">时间与天数</div><div class="form-grid">` +
          projectFormFieldHtml(
            "pfStart",
            "开始时间",
            `<input class="input" id="pfStart" type="datetime-local" value="${project ? project.startTime.replace(" ", "T") : ""}">`,
            true,
          ) +
          projectFormFieldHtml(
            "pfEnd",
            "结束时间",
            `<input class="input" id="pfEnd" type="datetime-local" value="${project ? project.endTime.replace(" ", "T") : ""}">`,
            true,
          ) +
          projectFormFieldHtml(
            "pfCalculatedDays",
            "系统计算天数",
            `<input class="input" id="pfCalculatedDays" value="${calculatedDays}" disabled>`,
          ) +
          projectFormFieldHtml(
            "pfDays",
            "项目确认天数",
            `<input class="input" id="pfDays" type="number" step="0.5" min="0.5" value="${project ? project.days : ""}" data-user-edited="${confirmationDaysEdited}"><div class="list-sub" id="pfDaysHelp" ${daysHelpText ? "" : 'style="display:none"'}>${daysHelpText}</div>`,
          ) +
          `</div>` +
          `<div class="section-title">资源与金额</div><div class="form-grid">` +
          projectFormFieldHtml(
            "pfResource",
            "资源类型",
            `<select class="input" id="pfResource">${resourceOptions}</select>`,
            true,
          ) +
          projectFormFieldHtml(
            "pfCooperation",
            "合作形式",
            `<select class="input" id="pfCooperation">${cooperationOptions}</select>`,
            true,
          ) +
          projectFormFieldHtml(
            "pfPackage",
            "采购包",
            `<select class="input" id="pfPackage">${packageOptions}</select>`,
          ) +
          projectFormFieldHtml(
            "pfDirection",
            "课程方向",
            `<select class="input" id="pfDirection">${directionOptions}</select>`,
          ) +
          projectFormFieldHtml(
            "pfCompany",
            "平台公司",
            `<select class="input" id="pfCompany">${companyOptions}</select>`,
          ) +
          projectFormFieldHtml(
            "pfUnitPrice",
            "项目单价",
            `<input class="input" id="pfUnitPrice" value="${project?.unitPrice != null ? formatProjectMoney(project.unitPrice) : "—"}" disabled>`,
          ) +
          projectFormFieldHtml(
            "pfAmount",
            "项目金额（含税）",
            amountField,
            !isTraining,
          ) +
          projectFormFieldHtml(
            "pfSettlement",
            "结账金额",
            `<input class="input" id="pfSettlement" value="${project ? formatProjectMoney(project.settlementAmount) : "—"}" disabled>`,
          ) +
          `</div>` +
          `<div id="pfPersonnelSection" ${isTraining ? "" : 'style="display:none"'}>` +
          `<div class="section-title">项目人员</div>${personnelHtml}` +
          `</div>` +
          `<div class="field-error" id="err-pfConflicts"></div>`
        );
      }
      function projectStageEditFormHtml(project, mode) {
        const isTraining = project.type === "培训项目";
        const calculatedDays = projectCalculatedDays(project);
        const confirmationDaysEdited = project.days !== calculatedDays;
        const endField =
          mode === "in-progress"
            ? projectFormFieldHtml(
                "pfStageEnd",
                "结束时间",
                `<input class="input" id="pfStageEnd" type="datetime-local" value="${project.endTime.replace(" ", "T")}">`,
                true,
              )
            : `<div class="form-group"><label class="form-label">结束时间</label><div class="input">${project.endTime}</div></div>`;
        const personnelHtml = isTraining
          ? `<div class="section-title">项目人员</div>` +
            `<div class="form-group full"><label class="form-label"><span class="required-marker" aria-hidden="true">*</span>主讲师</label>${instructorCheckboxGrid("pfStageLecturers", project.lecturers)}<div class="field-error" id="err-pfStageLecturers"></div></div>` +
            `<div class="form-group full"><label class="form-label">辅讲师</label>${instructorCheckboxGrid("pfStageAssistants", project.assistantLecturers)}</div>` +
            `<div class="form-group full"><label class="form-label">项目助教</label>${instructorCheckboxGrid("pfStageHelpers", project.teachingAssistants)}</div>` +
            projectFormFieldHtml(
              "pfChangeReason",
              "人员调整原因",
              '<input class="input" id="pfChangeReason">',
            ) +
            `<div class="field-error" id="err-pfConflicts"></div>`
          : "";
        return (
          `<div class="form-grid">` +
          projectFormFieldHtml(
            "pfStageName",
            "项目名称",
            `<input class="input" id="pfStageName" value="${escapeHtml(project.name)}">`,
            true,
          ) +
          `<div class="form-group"><label class="form-label">项目类型</label><div class="input">${project.type}</div></div>` +
          `<div class="form-group"><label class="form-label">开始时间</label><div class="input">${project.startTime}</div></div>` +
          endField +
          (mode === "in-progress"
            ? projectFormFieldHtml(
                "pfCalculatedDays",
                "系统计算天数",
                `<input class="input" id="pfCalculatedDays" value="${calculatedDays}" disabled>`,
              ) +
              projectFormFieldHtml(
                "pfDays",
                "项目确认天数",
                `<input class="input" id="pfDays" type="number" step="0.5" min="0.5" value="${project.days}" data-user-edited="${confirmationDaysEdited}"><div class="list-sub" id="pfDaysHelp">${isTraining ? "项目费用按此天数计算" : "仅用于记录项目周期，不参与项目金额计算"}</div>`,
              )
            : "") +
          `</div>` +
          personnelHtml
        );
      }
      function renderProjectFormPage(mode) {
        if (!currentUser) return "";
        const editing = mode === "edit";
        const project = editing ? projectById(selectedProjectId) : null;
        if (editing) {
          normalizeProjectLifecycle(project);
          if (!project || !canEditProject(project))
            return forbiddenPage("编辑项目", "当前账号无编辑该项目的权限。");
        } else if (!hasOperationPermission("projects.create")) {
          return forbiddenPage("创建项目", "当前账号无创建项目权限。");
        }
        const editMode = editing ? projectEditMode(project) : null;
        const stageEdit =
          editMode === "in-progress" || editMode === "delivered";
        const title = editing ? "编辑项目" : "创建项目";
        const submitLabel = editing ? "保存" : "创建项目";
        const formBody = stageEdit
          ? projectStageEditFormHtml(project, editMode)
          : projectFormHtml(project);
        return (
          '<div class="project-page project-form-page">' +
          pageHead(
            title,
            "",
          ) +
          `<section class="panel project-form-panel"><form id="projectForm" class="project-form"><div class="panel-body project-form-body">${formBody}</div><div class="panel-foot project-form-footer"><button class="btn" type="button" data-project-cancel>取消</button><button class="btn btn-primary" type="submit" id="pfSubmit">${submitLabel}</button></div></form></section>` +
          "</div>"
        );
      }
      function renderProjectCreate() {
        return renderProjectFormPage("create");
      }
      function renderProjectEdit() {
        return renderProjectFormPage("edit");
      }
      function renderPlatformCompanies() {
        if (!currentUser) return "";
        if (!hasOperationPermission("platform-companies.view"))
          return forbiddenPage("平台公司管理", "当前账号无平台公司查看权限。");
        const canManage = hasOperationPermission("platform-companies.manage");
        const visible = scopedPlatformCompanies()
          .slice()
          .sort((left, right) => left.id.localeCompare(right.id));
        const actions = canManage
          ? '<button class="btn btn-primary" data-config-action="add-company">新增平台公司</button>'
          : "";
        const filters =
          '<div class="toolbar filter-toolbar">' +
          filterField(
            "平台公司编号",
            '<input class="input" id="platformCompanyIdFilter" maxlength="8" placeholder="平台公司编号">',
          ) +
          filterField(
            "平台公司名称",
            '<input class="input" id="platformCompanyNameFilter" maxlength="100" placeholder="平台公司名称">',
          ) +
          filterField(
            "统一社会信用代码",
            '<input class="input" id="platformCompanyCreditFilter" maxlength="18" placeholder="统一社会信用代码">',
          ) +
          filterField(
            "状态",
            '<select class="input" id="platformCompanyStatusFilter"><option value="">全部状态</option><option value="正常">正常</option><option value="停用">停用</option></select>',
          ) +
          filterActions(
            '<button class="btn btn-primary" id="applyPlatformCompanyFilters" type="button">筛选</button><button class="btn" id="resetPlatformCompanyFilters" type="button">重置</button>',
          ) +
          "</div>";
        const rows = visible
          .map((company) => {
            const companyId = escapeHtml(company.id);
            const companyName = escapeHtml(company.name);
            const companyNameFilter = escapeHtml(company.name.toLowerCase());
            const creditCode = escapeHtml(company.creditCode || "");
            const status = escapeHtml(company.status);
            const ops = canManage
              ? `<span class="project-config-actions"><button class="link" data-config-action="edit-company" data-config-id="${company.id}">编辑</button><button class="link" data-config-action="${company.status === "正常" ? "stop-company" : "restore-company"}" data-config-id="${company.id}">${company.status === "正常" ? "停用" : "恢复"}</button></span>`
              : "—";
            return `<tr data-platform-company-row data-company-id="${companyId}" data-company-name="${companyNameFilter}" data-company-credit="${creditCode}" data-company-status="${status}"><td>${companyId}</td><td>${companyName}</td><td>${creditCode || "—"}</td><td>${formatConfigPercent(company.managementFeeRate)}</td><td>${formatProjectMoney(company.cooperationPay)} 元/天</td><td>${configStatusTag(company.status)}</td><td>${ops}</td></tr>`;
          })
          .join("");
        return (
          '<div class="project-page project-config-page">' +
          pageHead(
            "平台公司管理",
            "查看平台公司编号、名称、统一社会信用代码、管理费比例、合作课酬与状态。",
            actions,
          ) +
          `<section class="panel project-config-panel">${filters}<div class="table-wrap project-config-table-wrap"><table class="project-config-table project-company-table" style="min-width:1120px"><thead><tr><th>平台公司编号</th><th>平台公司名称</th><th>统一社会信用代码</th><th>管理费比例</th><th>合作课酬</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows || '<tr data-empty-row id="platformCompanyDefaultEmpty"><td colspan="7"><div class="empty">暂无平台公司</div></td></tr>'}<tr id="platformCompanyFilterEmpty" style="display:none"><td colspan="7"><div class="empty">未找到符合条件的平台公司，请调整条件或重置筛选</div></td></tr></tbody></table></div></section>` +
          "</div>"
        );
      }
