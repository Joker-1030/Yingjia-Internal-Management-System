      function bindPageEvents() {
        bindProjectEvents();
        bindProjectConfigEvents();
        bindProjectFormEvents();
        enhanceCustomerFilterToolbar();
        enhanceTaskExecutionTable();
        enhanceTaskExecutionFilters();
        enhanceUnifiedFilterPresentation();
        bindExecutionTables();
        document.querySelectorAll("[data-admin-dashboard-view]").forEach(
          (button) =>
            (button.onclick = () => {
              if (currentUser.role !== "admin") return;
              adminDashboardView = button.dataset.adminDashboardView;
              renderPage();
            }),
        );

        document.querySelectorAll("[data-operation-contact]").forEach(
          (button) =>
            (button.onclick = (event) => {
              event.preventDefault();
              event.stopPropagation();
              selectedOperationContactId = Number(
                button.dataset.operationContact,
              );
              renderPage();
            }),
        );
        document
          .querySelectorAll("[data-operation-add-contact-global]")
          .forEach((button) => (button.onclick = () => openContactForm()));
        document.querySelectorAll("[data-operation-customer]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedOperationCustomerId = Number(
                button.dataset.operationCustomer,
              );
              selectedOperationContactId = null;
              renderPage();
            }),
        );
        document.querySelectorAll("[data-operation-group]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedCustomerGroup = button.dataset.operationGroup;
              selectedOperationCustomerId = null;
              selectedCustomerId = null;
              selectedOperationContactId = null;
              renderPage();
            }),
        );
        document.querySelectorAll("[data-customer-dimension]").forEach(
          (button) =>
            (button.onclick = () => {
              customerTreeDimension = button.dataset.customerDimension;
              selectedOperationCustomerId = null;
              selectedOperationContactId = null;
              selectedCustomerId = null;
              selectedCustomerGroup = "";
              selectedOperationRegion = "";
              selectedOperationProvince = "";
              selectedOperationRegionGroup = "";
              renderPage();
            }),
        );
        document.querySelectorAll("[data-operation-region]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedOperationRegion = button.dataset.operationRegion;
              selectedOperationProvince = button.dataset.operationProvince || "";
              selectedOperationRegionGroup =
                button.dataset.operationRegionGroup || "";
              selectedOperationCustomerId = null;
              selectedOperationContactId = null;
              selectedCustomerId = null;
              selectedCustomerGroup = "";
              renderPage();
            }),
        );
        document
          .querySelectorAll("[data-operation-add-contact]")
          .forEach(
            (button) =>
              (button.onclick = () =>
                openContactForm(null, selectedOperationCustomerId)),
          );
        document.querySelectorAll("[data-operation-maintain]").forEach(
          (button) =>
            (button.onclick = () => {
              const taskId = Number(button.dataset.taskId);
              if (taskId) openCompleteTask(taskId);
              else openRecord(Number(button.dataset.operationMaintain));
            }),
        );
        const applyOperationFilter = $("#applyOperationFilter");
        if (applyOperationFilter)
          applyOperationFilter.onclick = () => {
            const keyword = $("#operationSearch").value.trim();
            const health = $("#operationHealth").value;
            document
              .querySelectorAll("#operationCustomerList .operations-item")
              .forEach((item) => {
                const customer = customers.find(
                  (entry) =>
                    entry.id === Number(item.dataset.operationCustomer),
                );
                const peopleText = contacts
                  .filter((person) => person.company === customer?.name)
                  .map((person) => person.name)
                  .join("");
                item.classList.toggle(
                  "hidden",
                  Boolean(
                    (keyword &&
                      !`${customer?.name}${customer?.group}${peopleText}`.includes(
                        keyword,
                      )) ||
                    (health && customerHealth(customer) !== health),
                  ),
                );
              });
            toast("筛选条件已生效");
          };
        const resetOperationFilter = $("#resetOperationFilter");
        if (resetOperationFilter)
          resetOperationFilter.onclick = () => renderPage();
        document.querySelectorAll("[data-page-jump]").forEach(
          (button) =>
            (button.onclick = () => {
              const targetPage = button.dataset.pageJump;
              currentPage = targetPage === "customers" ? "operations" : targetPage === "records" ? "tasks" : targetPage;
              if (currentPage === "tasks")
                taskView = targetPage === "records" ? "records" : currentUser.role === "pm" ? "mine" : "summary";
              renderNav();
              renderPage();
            }),
        );
        document
          .querySelectorAll("[data-person]")
          .forEach(
            (button) =>
              (button.onclick = () =>
                openPerson(Number(button.dataset.person))),
          );
        document
          .querySelectorAll("[data-customer]")
          .forEach(
            (button) =>
              (button.onclick = () =>
                openCustomer(Number(button.dataset.customer))),
          );
        document
          .querySelectorAll("[data-complete]")
          .forEach(
            (button) =>
              (button.onclick = () =>
                openCompleteTask(Number(button.dataset.complete))),
          );
        document
          .querySelectorAll("[data-approve]")
          .forEach(
            (button) =>
              (button.onclick = () =>
                openApprovalDecision(Number(button.dataset.approve), true)),
          );
        document
          .querySelectorAll("[data-reject]")
          .forEach(
            (button) =>
              (button.onclick = () =>
                openApprovalDecision(Number(button.dataset.reject), false)),
          );
        document
          .querySelectorAll("[data-action]")
          .forEach(
            (button) =>
              (button.onclick = () => {
                if (button.dataset.action === "download-project-import-template")
                  return downloadTemplate("project");
                return genericAction(
                  button.dataset.action,
                  button.dataset.id,
                  button.dataset.kind,
                );
              }),
          );
        document.querySelectorAll("[data-task-view]").forEach(
          (button) =>
            (button.onclick = () => {
              taskView = button.dataset.taskView;
              renderPage();
            }),
        );
        document.querySelectorAll("[data-approval-view]").forEach(
          (button) =>
            (button.onclick = () => {
              approvalView = button.dataset.approvalView;
              renderPage();
            }),
        );
        bindApprovalFilters();
        document.querySelectorAll("[data-employee-view]").forEach(
          (button) =>
            (button.onclick = () => {
              employeeView = button.dataset.employeeView;
              selectedOrganizationDepartmentId = null;
              renderPage();
            }),
        );
        document.querySelectorAll("[data-change-approval]").forEach(
          (button) =>
            (button.onclick = () =>
              openApprovalDetail(Number(button.dataset.changeApproval))),
        );
        document.querySelectorAll("[data-change-audit]").forEach(
          (button) =>
            (button.onclick = () =>
              openOrganizationChangeAudit(button.dataset.changeAudit)),
        );
        document.querySelectorAll("[data-customer-toggle]").forEach(
          (button) =>
            (button.onclick = () => {
              const key = button.dataset.customerToggle;
              expandedCustomerNodes.has(key)
                ? expandedCustomerNodes.delete(key)
                : expandedCustomerNodes.add(key);
              renderPage();
            }),
        );
        document.querySelectorAll("[data-customer-select]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedCustomerId = Number(button.dataset.customerSelect);
              if (currentPage === "operations") {
                selectedOperationCustomerId = selectedCustomerId;
                selectedOperationContactId = null;
                selectedCustomerGroup = "";
                selectedOperationRegion = "";
                selectedOperationProvince = "";
                selectedOperationRegionGroup = "";
              }
              renderPage();
            }),
        );
        document.querySelectorAll("[data-region-select]").forEach(
          (button) =>
            (button.onclick = () => {
              selectedRegionId = Number(button.dataset.regionSelect);
              renderPage();
            }),
        );
        const filterRegionMasterList = () => {
          const name = $("#regionName")?.value.trim() || "";
          const departmentCode = $("#regionDepartmentCode")?.value.trim() || "";
          const director = $("#regionDirector")?.value.trim() || "";
          const province = $("#regionProvinceFilter")?.value || "";
          let matched = 0;
          document
            .querySelectorAll("#regionMasterList [data-region-select]")
            .forEach((item) => {
              const region = regionsData.find(
                (candidate) => String(candidate.id) === String(item.dataset.regionSelect),
              );
              const department = organizationDepartments.find(
                (candidate) => candidate.regionId === region?.id,
              );
              const visible =
                (!name || String(region?.name || "").includes(name)) &&
                (!departmentCode || String(department?.code || "").includes(departmentCode)) &&
                (!director || String(region?.director || "").includes(director)) &&
                (!province ||
                  (item.dataset.provinces || "").split("|").includes(province));
              item.classList.toggle("hidden", !visible);
              if (visible) matched += 1;
            });
          const empty = $("#regionMasterEmpty");
          if (empty) empty.remove();
          if (!matched && $("#regionMasterList"))
            $("#regionMasterList").insertAdjacentHTML(
              "beforeend",
              '<div class="empty" id="regionMasterEmpty">未找到符合条件的区域中心</div>',
            );
        };
        ["#regionName", "#regionDepartmentCode", "#regionDirector", "#regionProvinceFilter"].forEach((selector) => {
          const element = $(selector);
          if (element)
            element.oninput = element.onchange = filterRegionMasterList;
        });
        document.querySelectorAll("[data-region-assignment-view]").forEach(
          (button) =>
            (button.onclick = () => {
              regionAssignmentView = button.dataset.regionAssignmentView;
              renderPage();
            }),
        );
        const openInitialCityAssignment = $("#openInitialCityAssignment");
        if (openInitialCityAssignment)
          openInitialCityAssignment.onclick = () => openCityForm();
        const filterRegionCities = () => {
          const province = $("#regionCityProvince")?.value || "";
          const city = $("#regionCityName")?.value.trim() || "";
          const pmName = $("#regionCityPmName")?.value.trim() || "";
          const pmCode = $("#regionCityPmCode")?.value.trim() || "";
          const status = $("#regionCityStatus")?.value || "";
          document.querySelectorAll("[data-region-city-row]").forEach((row) => {
            row.style.display =
              (!province || row.dataset.province === province) &&
              (!city || row.children[1]?.textContent.includes(city)) &&
              (!pmName || row.children[2]?.textContent.includes(pmName)) &&
              (!pmCode || row.children[3]?.textContent.includes(pmCode)) &&
              (!status || row.dataset.status === status)
                ? ""
                : "none";
          });
        };
        if ($("#queryRegionCities")) $("#queryRegionCities").onclick = filterRegionCities;
        if ($("#resetRegionCities"))
          $("#resetRegionCities").onclick = () => {
            $("#regionCityProvince").value = "";
            $("#regionCityName").value = "";
            $("#regionCityPmName").value = "";
            $("#regionCityPmCode").value = "";
            $("#regionCityStatus").value = "";
            filterRegionCities();
          };
        const filterRegionPms = () => {
          const name = $("#regionPmName")?.value.trim() || "";
          const code = $("#regionPmCode")?.value.trim() || "";
          document.querySelectorAll("[data-region-pm-row]").forEach((row) => {
            row.style.display =
              (!name || row.children[0]?.textContent.includes(name)) &&
              (!code || row.children[1]?.textContent.includes(code)) ? "" : "none";
          });
        };
        if ($("#queryRegionPms")) $("#queryRegionPms").onclick = filterRegionPms;
        if ($("#resetRegionPms"))
          $("#resetRegionPms").onclick = () => {
            $("#regionPmName").value = "";
            $("#regionPmCode").value = "";
            filterRegionPms();
          };
        document.querySelectorAll("[data-city-quick-assign]").forEach(
          (button) =>
            (button.onclick = () =>
              openCityForm("", button.dataset.cityQuickAssign)),
        );
        document.querySelectorAll("[data-pm-city-assign]").forEach(
          (button) =>
            (button.onclick = () => openCityForm(button.dataset.pmCityAssign)),
        );
        document.querySelectorAll("[data-permission-role]").forEach(
          (button) =>
            (button.onclick = () => {
              const currentTemplate = systemRoleTemplates.find(
                (item) => item.name === selectedPermissionRole,
              );
              if (
                button.dataset.permissionRole !== selectedPermissionRole &&
                permissionDraftDirty(currentTemplate)
              )
                return toast("当前角色存在未保存修改，请先保存或撤销");
              selectedPermissionRole = button.dataset.permissionRole;
              permissionDraft = null;
              permissionChangeReason = "";
              renderPage();
            }),
        );
        document.querySelectorAll("[data-permission-group]").forEach(
          (checkbox) => {
            const group = permissionTreeGroups.find(
              (item) => item.name === checkbox.dataset.permissionGroup,
            );
            const template = systemRoleTemplates.find(
              (item) => item.name === selectedPermissionRole,
            );
            const activePermissions =
              permissionDraft?.permissions || template?.permissions || [];
            const selected = group.items.filter(([id]) =>
              activePermissions.includes(id),
            ).length;
            checkbox.indeterminate = selected > 0 && selected < group.items.length;
            checkbox.onchange = () => {
              if (!permissionDraft || checkbox.disabled) return;
              group.items.forEach(([id]) => {
                permissionDraft.permissions = permissionDraft.permissions.filter(
                  (permission) => permission !== id,
                );
                if (checkbox.checked) permissionDraft.permissions.push(id);
                else
                  permissionDraft.operations = permissionDraft.operations.filter(
                    (operation) =>
                      operationPermissionCatalog.find(
                        ([operationId]) => operationId === operation,
                      )?.[1] !== id,
                  );
              });
              renderPage();
            };
          },
        );
        const permissionRoleName = $("#permissionRoleName");
        const permissionRoleCode = $("#permissionRoleCode");
        if (permissionRoleName && permissionRoleCode) {
          const filterPermissionRoles = () => {
            const name = permissionRoleName.value.trim();
            const code = permissionRoleCode.value.trim();
            document
              .querySelectorAll("[data-permission-role]")
              .forEach((item) => {
                const roleName = item.dataset.permissionRole;
                item.classList.toggle(
                  "hidden",
                  Boolean(
                    (name && !roleName.includes(name)) ||
                    (code && !String(permissionRoleCodes[roleName] || "").includes(code)),
                  ),
                );
              });
          };
          permissionRoleName.oninput = permissionRoleCode.oninput = filterPermissionRoles;
        }
        const permissionSearches = {
          menu: $("#permissionMenuSearch"),
          operation: $("#permissionOperationSearch"),
          field: $("#permissionFieldSearch"),
          attachment: $("#permissionAttachmentSearch"),
        };
        Object.entries(permissionSearches).forEach(([section, control]) => {
          if (!control) return;
          control.oninput = () => {
            const keyword = control.value.trim();
            document.querySelectorAll(`[data-permission-section="${section}"]`).forEach((group) => {
                const nodes = [...group.querySelectorAll(".permission-tree-node")];
                nodes.forEach((node) => node.classList.toggle("hidden", Boolean(keyword && !node.textContent.includes(keyword))));
                group.classList.toggle(
                  "hidden",
                  Boolean(
                    keyword &&
                      nodes.length &&
                      nodes.every((node) => node.classList.contains("hidden")),
                  ),
                );
              });
          };
        });
        document.querySelectorAll("[data-role-permission]").forEach(
          (checkbox) =>
            (checkbox.onchange = () => {
              if (!permissionDraft || checkbox.disabled) return;
              permissionDraft.permissions = permissionDraft.permissions.filter(
                (permission) => permission !== checkbox.dataset.rolePermission,
              );
              if (checkbox.checked)
                permissionDraft.permissions.push(checkbox.dataset.rolePermission);
              else
                permissionDraft.operations = permissionDraft.operations.filter(
                  (operation) =>
                    operationPermissionCatalog.find(
                      ([operationId]) => operationId === operation,
                    )?.[1] !== checkbox.dataset.rolePermission,
                );
              renderPage();
            }),
        );
        document.querySelectorAll("[data-operation-permission]").forEach(
          (checkbox) =>
            (checkbox.onchange = () => {
              if (!permissionDraft || checkbox.disabled) return;
              const operation = checkbox.dataset.operationPermission;
              const page = checkbox.dataset.operationPage;
              permissionDraft.operations = permissionDraft.operations.filter(
                (item) => item !== operation,
              );
              if (checkbox.checked) {
                permissionDraft.operations.push(operation);
                if (!permissionDraft.permissions.includes(page))
                  permissionDraft.permissions.push(page);
              }
              renderPage();
            }),
        );
        document.querySelectorAll("[data-field-permission]").forEach(
          (checkbox) =>
            (checkbox.onchange = () => {
              if (!permissionDraft || checkbox.disabled) return;
              permissionDraft.fields = permissionDraft.fields.filter(
                (permission) => permission !== checkbox.dataset.fieldPermission,
              );
              if (checkbox.checked) {
                permissionDraft.fields.push(checkbox.dataset.fieldPermission);
                const dependsOn = checkbox.dataset.fieldDepends;
                if (dependsOn && !permissionDraft.fields.includes(dependsOn))
                  permissionDraft.fields.push(dependsOn);
              } else {
                fieldPermissionCatalog
                  .filter(([, , , dependsOn]) => dependsOn === checkbox.dataset.fieldPermission)
                  .forEach(([id]) => {
                    permissionDraft.fields = permissionDraft.fields.filter(
                      (permission) => permission !== id,
                    );
                  });
              }
              renderPage();
            }),
        );
        document.querySelectorAll("[data-attachment-permission]").forEach(
          (checkbox) =>
            (checkbox.onchange = () => {
              if (!permissionDraft || checkbox.disabled) return;
              const permission = checkbox.dataset.attachmentPermission;
              permissionDraft.attachments = permissionDraft.attachments.filter(
                (item) => item !== permission,
              );
              if (checkbox.checked) {
                permissionDraft.attachments.push(permission);
                const dependencies = (
                  checkbox.dataset.attachmentDepends || ""
                )
                  .split("|")
                  .filter(Boolean);
                dependencies.forEach((dependsOn) => {
                  if (!permissionDraft.attachments.includes(dependsOn))
                    permissionDraft.attachments.push(dependsOn);
                });
              } else {
                attachmentPermissionCatalog
                  .filter(([, , dependsOn = ""]) =>
                    dependsOn.split("|").includes(permission),
                  )
                  .forEach(([id]) => {
                    permissionDraft.attachments =
                      permissionDraft.attachments.filter(
                        (item) => item !== id,
                      );
                  });
              }
              renderPage();
            }),
        );
        const permissionReason = $("#permissionReason");
        if (permissionReason)
          permissionReason.oninput = () =>
            (permissionChangeReason = permissionReason.value);
        const discardPermissionChanges = $("#discardPermissionChanges");
        if (discardPermissionChanges)
          discardPermissionChanges.onclick = () => {
            permissionDraft = null;
            permissionChangeReason = "";
            renderPage();
            toast("未保存修改已撤销");
          };
        document.querySelectorAll("[data-settings-section]").forEach(
          (button) =>
            (button.onclick = () => {
              settingsSection = button.dataset.settingsSection;
              renderPage();
            }),
        );
        const bindConfigurationFilters = (config) => {
          const apply = () => {
            const keyword = $(config.keyword)?.value.trim() || "";
            const name = $(config.name)?.value.trim() || "";
            const code = $(config.code)?.value.trim() || "";
            const group = $(config.group)?.value || "";
            const level = $(config.level)?.value || "";
            const type = $(config.type)?.value || "";
            const status = $(config.status)?.value || "";
            let visible = 0;
            document.querySelectorAll(`${config.body} [data-config-row]`).forEach(
              (row) => {
                const matched =
                  (!keyword || (row.dataset.keyword || "").includes(keyword)) &&
                  (!name || row.querySelector("strong")?.textContent.includes(name)) &&
                  (!code || row.querySelector(".list-sub")?.textContent.includes(code)) &&
                  (!group || row.dataset.group === group) &&
                  (!level || (row.dataset.levels || "").split("|").includes(level)) &&
                  (!type || row.dataset.type === type) &&
                  (!status || row.dataset.status === status);
                row.classList.toggle("hidden", !matched);
                if (matched) visible += 1;
              },
            );
            const count = $(config.count);
            if (count) count.textContent = `共 ${visible} 条`;
          };
          [config.keyword, config.name, config.code, config.group, config.level, config.type, config.status]
            .filter(Boolean)
            .forEach((selector) => {
              const control = $(selector);
              if (control) control.oninput = control.onchange = apply;
            });
        };

        if (settingsSection === "tree") {
          const selectedValues = (selector) =>
            new Set(
              [...document.querySelectorAll(`${selector} input:checked`)].map(
                (input) => input.value,
              ),
            );
          const applyCustomerOrgNavFilters = () => {
            Object.assign(customerOrgNavFilters, {
              industryName: $("#customerOrgIndustryName")?.value.trim() || "",
              groupNumber: $("#customerOrgGroupNumber")?.value.trim() || "",
              groupName: $("#customerOrgGroupName")?.value.trim() || "",
              companyName: $("#customerOrgCompanyName")?.value.trim() || "",
              industryCode: $("#customerOrgIndustryCode")?.value.trim() || "",
              creditCode: $("#customerOrgCreditCode")?.value.trim() || "",
              industry: $("#customerOrgIndustry")?.value || "",
              group: $("#customerOrgGroup")?.value || "",
            });
            if (
              customerOrgNavFilters.group &&
              customerOrgNavFilters.industry &&
              customerGroupIndustries[customerOrgNavFilters.group] !==
                customerOrgNavFilters.industry
            )
              customerOrgNavFilters.group = "";
            customerOrgNavFilters.levels = selectedValues("#customerOrgLevels");
            customerOrgNavFilters.statuses = selectedValues("#customerOrgStatuses");
            industries.forEach((industry) =>
              expandedCustomerOrgNodes.add(`industry:${industry.name}`),
            );
            customerGroupNames.forEach((group) =>
              expandedCustomerOrgNodes.add(`group:${group}`),
            );
            customers.forEach((company) =>
              expandedCustomerOrgNodes.add(`company:${company.id}`),
            );
            if (
              selectedCustomerOrgNode &&
              !customerOrgTreeHtml().includes(
                `data-customer-org-select="${selectedCustomerOrgNode}"`,
              )
            ) {
              selectedCustomerOrgNode = "";
              clearCustomerOrgInternalContext();
            }
            renderPage();
          };
          if ($("#queryCustomerOrgNav"))
            $("#queryCustomerOrgNav").onclick = applyCustomerOrgNavFilters;
          if ($("#resetCustomerOrgNav"))
            $("#resetCustomerOrgNav").onclick = () => {
              Object.assign(customerOrgNavFilters, {
                industryName: "",
                groupNumber: "",
                groupName: "",
                companyName: "",
                industryCode: "",
                creditCode: "",
                industry: "",
                group: "",
              });
              customerOrgNavFilters.levels.clear();
              customerOrgNavFilters.statuses.clear();
              renderPage();
            };
          [
            "#customerOrgIndustryName",
            "#customerOrgGroupNumber",
            "#customerOrgGroupName",
            "#customerOrgCompanyName",
            "#customerOrgIndustryCode",
            "#customerOrgCreditCode",
          ].forEach((selector) => {
            const input = $(selector);
            if (input)
              input.onkeydown = (event) => {
                if (event.key === "Enter") applyCustomerOrgNavFilters();
              };
          });
          const treeAddButton = $("#treeAddBtn");
          const treeAddMenu = $("#treeAddMenu");
          if (treeAddButton && treeAddMenu)
            treeAddButton.onclick = (event) => {
              event.stopPropagation();
              treeAddMenu.classList.toggle("hidden");
            };
          document.querySelectorAll("[data-customer-org-select]").forEach(
            (button) =>
              (button.onclick = (event) => {
                const toggle = event.target.closest("[data-customer-org-toggle]");
                const key = toggle?.dataset.customerOrgToggle;
                if (key) {
                  if (expandedCustomerOrgNodes.has(key))
                    expandedCustomerOrgNodes.delete(key);
                  else expandedCustomerOrgNodes.add(key);
                } else {
                  const nextNode = button.dataset.customerOrgSelect;
                  if (
                    nextNode.startsWith("company:") &&
                    nextNode !== selectedCustomerOrgNode
                  )
                    clearCustomerOrgInternalContext();
                  if (!nextNode.startsWith("company:"))
                    clearCustomerOrgInternalContext();
                  selectedCustomerOrgNode = nextNode;
                }
                renderPage();
              }),
          );
          document
            .querySelectorAll("[data-customer-org-company-tab]")
            .forEach(
              (button) =>
                (button.onclick = () => {
                  customerOrgCompanyTab =
                    button.dataset.customerOrgCompanyTab;
                  renderPage();
                }),
            );
          document
            .querySelectorAll("[data-customer-org-internal-select]")
            .forEach(
              (button) =>
                (button.onclick = (event) => {
                  const toggle = event.target.closest(
                    "[data-customer-org-toggle]",
                  );
                  const key = toggle?.dataset.customerOrgToggle;
                  if (key) {
                    if (expandedCustomerOrgNodes.has(key))
                      expandedCustomerOrgNodes.delete(key);
                    else expandedCustomerOrgNodes.add(key);
                  } else {
                    selectedCustomerOrgInternalNode =
                      button.dataset.customerOrgInternalSelect;
                  }
                  renderPage();
                }),
            );
          document
            .querySelectorAll("[data-customer-org-load-more]")
            .forEach(
              (button) =>
                (button.onclick = () => {
                  const key = button.dataset.customerOrgLoadMore;
                  customerOrgLoadLimits.set(
                    key,
                    (customerOrgLoadLimits.get(key) || 50) + 50,
                  );
                  renderPage();
                }),
            );
          const applyCustomerOrgInternalFilters = () => {
            Object.assign(customerOrgInternalFilters, {
              departmentName:
                $("#customerOrgDepartmentName")?.value.trim() || "",
              departmentCode:
                $("#customerOrgDepartmentCode")?.value.trim() || "",
              positionName:
                $("#customerOrgPositionName")?.value.trim() || "",
              positionCode:
                $("#customerOrgPositionCode")?.value.trim() || "",
            });
            customerOrgInternalFilters.statuses = selectedValues(
              "#customerOrgInternalStatuses",
            );
            const selectedCompany = customerOrgSelectedCompany();
            if (selectedCompany)
              customerOrgDepartmentsForCompany(selectedCompany).forEach(
                (department) =>
                  expandedCustomerOrgNodes.add(`department:${department.id}`),
              );
            if (
              selectedCustomerOrgInternalNode &&
              selectedCompany &&
              !customerOrgInternalTreeHtml(selectedCompany).includes(
                `data-customer-org-internal-select="${selectedCustomerOrgInternalNode}"`,
              )
            )
              selectedCustomerOrgInternalNode = "";
            renderPage();
          };
          if ($("#queryCustomerOrgInternal"))
            $("#queryCustomerOrgInternal").onclick =
              applyCustomerOrgInternalFilters;
          if ($("#resetCustomerOrgInternal"))
            $("#resetCustomerOrgInternal").onclick = () => {
              Object.assign(customerOrgInternalFilters, {
                departmentName: "",
                departmentCode: "",
                positionName: "",
                positionCode: "",
              });
              customerOrgInternalFilters.statuses.clear();
              renderPage();
            };
          [
            "#customerOrgDepartmentName",
            "#customerOrgDepartmentCode",
            "#customerOrgPositionName",
            "#customerOrgPositionCode",
          ].forEach((selector) => {
            const input = $(selector);
            if (input)
              input.onkeydown = (event) => {
                if (event.key === "Enter")
                  applyCustomerOrgInternalFilters();
              };
          });
        }

        if (settingsSection === "automation")
          bindConfigurationFilters({
            keyword: "#ruleConfigKeyword",
            type: "#ruleConfigType",
            status: "#ruleConfigStatus",
            body: "#ruleConfigBody",
            count: "#ruleConfigCount",
          });
        if (settingsSection === "industries")
          bindConfigurationFilters({
            name: "#industryConfigName",
            code: "#industryConfigCode",
            status: "#industryConfigStatus",
            body: "#industryConfigBody",
            count: "#industryConfigCount",
          });
        document.querySelectorAll("[data-dept]").forEach(
          (button) =>
            (button.onclick = (event) => {
              if (event.target.closest("[data-action]")) return;
              const id = Number(button.dataset.deptId);
              selectedOrganizationDepartmentId = id || null;
              renderPage();
            }),
        );
        const saveRoleTemplate = $("#saveRoleTemplate");
        if (saveRoleTemplate)
          saveRoleTemplate.onclick = () => {
            const template = systemRoleTemplates.find(
              (item) => item.name === selectedPermissionRole,
            );
            const reason = permissionChangeReason.trim();
            if (reason.length < 5 || reason.length > 500)
              return toast("变更原因需填写 5-500 字");
            const diff = permissionDiff(template, permissionDraft);
            const changed = Object.values(diff).flat();
            if (!changed.length) return toast("当前没有需要保存的权限变化");
            const employeeCount = employees.filter(
              (employee) =>
                employee.role === template.name && employee.status === "在职",
            ).length;
            const diffRows = [
              ["新增功能", diff.added],
              ["移除功能", diff.removed],
              ["新增操作", diff.operationAdded],
              ["移除操作", diff.operationRemoved],
              ["新增字段", diff.fieldAdded],
              ["移除字段", diff.fieldRemoved],
              ["新增附件权限", diff.attachmentAdded],
              ["移除附件权限", diff.attachmentRemoved],
            ]
              .filter(([, values]) => values.length)
              .map(([label, values]) => `<div class="permission-summary-item"><label>${label}</label><strong>${values.join("、")}</strong></div>`)
              .join("");
            openModal(
              `<div class="modal-head"><div class="modal-title">确认权限调整</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="permission-summary"><div class="permission-summary-item"><label>目标角色 / 当前版本</label><strong>${template.name} / ${permissionVersions[template.name][0].id}</strong></div><div class="permission-summary-item"><label>影响岗位 / 在职员工</label><strong>${template.jobs.join("、")} / ${employeeCount} 人</strong></div>${diffRows}<div class="permission-summary-item"><label>变更原因</label><strong>${reason}</strong></div></div><div class="role-note" style="margin-top:var(--space-4)">保存后生成不可覆盖的新版本；新请求立即按新权限校验。</div></div><div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="confirmRoleTemplateSave">确认并生效</button></div>`,
            );
            $("#confirmRoleTemplateSave").onclick = () => {
              commitPermissionVersion(
                template,
                permissionDraft.permissions,
                permissionDraft.operations,
                permissionDraft.fields,
                permissionDraft.attachments,
                reason,
              );
              closeOverlay();
              renderPage();
              toast("权限版本已生成并生效");
            };
          };
        document.querySelectorAll("[data-permission-rollback]").forEach(
          (button) =>
            (button.onclick = () => {
              const template = systemRoleTemplates.find(
                (item) => item.name === selectedPermissionRole,
              );
              const version = permissionVersions[template.name].find(
                (item) => item.id === button.dataset.permissionRollback,
              );
              openModal(
                `<div class="modal-head"><div class="modal-title">回滚权限版本</div><button class="icon-btn close" data-close>×</button></div><form id="permissionRollbackForm"><div class="modal-body"><div class="permission-summary-item"><label>目标角色 / 历史版本</label><strong>${template.name} / ${version.id}</strong></div><div class="form-group" style="margin-top:var(--space-4)"><label class="form-label">回滚原因 *</label><textarea class="input" id="permissionRollbackReason" minlength="5" maxlength="500" required placeholder="请填写 5-500 字回滚原因"></textarea></div><div class="role-note">回滚会生成一个新版本，不覆盖或删除历史记录。</div></div><div class="modal-foot"><button class="btn" type="button" data-close>取消</button><button class="btn btn-primary" type="submit">确认回滚</button></div></form>`,
              );
              $("#permissionRollbackForm").onsubmit = (event) => {
                event.preventDefault();
                const reason = $("#permissionRollbackReason").value.trim();
                if (reason.length < 5 || reason.length > 500)
                  return toast("回滚原因需填写 5-500 字");
                commitPermissionVersion(
                  template,
                  version.permissions,
                  version.operations || [],
                  version.fields,
                  version.attachments || [],
                  reason,
                  `回滚自 ${version.id}`,
                );
                closeOverlay();
                renderPage();
                toast("已生成新的回滚版本");
              };
            }),
        );
        const filterCustomerTree = () => {
          const {
            name: companyName,
            personName,
            industry,
            personPhone,
            pm: pmFilter,
            coverage,
            provinces,
            cities,
            districts,
          } = appliedCustomerFilter;
          const phoneKey = personPhone.replace(/\D/g, "");
          const selP = [...provinces],
            selC = [...cities],
            selD = [...districts];
          const districtMap = cityDistrictMap();
          const items = [
            ...document.querySelectorAll("#customerTree [data-search]"),
          ];
          items.forEach((item) => item.classList.remove("hidden"));
          items.forEach((item) => {
            const text = item.dataset.search;
            const areaParts = (item.dataset.area || "")
              .split(" ")
              .filter(Boolean);
            const province = areaParts[0],
              city = areaParts[1],
              district = areaParts[2];
            let areaMatch = true;
            if (selP.length && !selP.includes(province)) areaMatch = false;
            if (areaMatch && selC.length && !selC.includes(city))
              areaMatch = false;
            if (areaMatch && selD.length) {
              if (district) areaMatch = selD.includes(district);
              else if (city)
                areaMatch = (districtMap[city] || []).some((d) =>
                  selD.includes(d),
                );
              else areaMatch = false;
            }
            const people = item.dataset.people || "",
              peoplePhoneKey = (item.dataset.peoplePhone || "").replace(
                /\D/g,
                "",
              ),
              peopleCount = Number(item.dataset.peopleCount || 0),
              coverageMismatch =
                (coverage === "none" && peopleCount !== 0) ||
                (coverage === "covered" && peopleCount === 0);
            const isHidden = Boolean(
              (companyName &&
                !item.dataset.companyName.includes(companyName)) ||
              (personName && !people.includes(personName)) ||
              (phoneKey && !peoplePhoneKey.includes(phoneKey)) ||
              (pmFilter && item.dataset.pm !== pmFilter) ||
              coverageMismatch ||
              (industry && !text.includes(industry)) ||
              !areaMatch,
            );
            item.classList.toggle("hidden", isHidden);
            if (!isHidden && !coverage) {
              const group = item.dataset.group;
              if (item.classList.contains("level-district")) {
                if (city)
                  document
                    .querySelector(
                      `#customerTree .level-city[data-group="${group}"][data-area="${province} ${city}"]`,
                    )
                    ?.classList.remove("hidden");
                if (province)
                  document
                    .querySelector(
                      `#customerTree .level-province[data-group="${group}"][data-area="${province}"]`,
                    )
                    ?.classList.remove("hidden");
              } else if (item.classList.contains("level-city") && province) {
                document
                  .querySelector(
                    `#customerTree .level-province[data-group="${group}"][data-area="${province}"]`,
                  )
                  ?.classList.remove("hidden");
              }
            }
          });
          document
            .querySelectorAll("#customerTree .level-group")
            .forEach((groupRow) => {
              const group = groupRow.querySelector(
                ".customer-tree-label",
              )?.textContent;
              groupRow.classList.toggle(
                "hidden",
                !items.some(
                  (item) =>
                    item.dataset.group === group &&
                    !item.classList.contains("hidden"),
                ),
              );
            });
        };
        const applyCustomerFilters = () => {
          const phone = $("#customerTreePersonPhone")?.value.trim() || "";
          const phoneKey = phone.replace(/\D/g, "");
          if (phone && ![4, 11].includes(phoneKey.length))
            return toast("关键人手机号请输入完整 11 位或后 4 位");
          const departments = checkedFilterValues("customerDepartmentMulti");
          const positions = checkedFilterValues("customerPositionMulti");
          const departmentCoverage =
            $("#customerDepartmentCoverage")?.value || "";
          const positionCoverage =
            $("#customerPositionCoverage")?.value || "";
          if (departmentCoverage && departments.size !== 1)
            return toast("部门覆盖状态只能配合一个部门口径使用");
          if (positionCoverage && positions.size !== 1)
            return toast("岗位覆盖状态只能配合一个岗位口径使用");
          appliedCustomerFilter = {
            group: $("#customerTreeGroup")?.value || "",
            groupNumber: $("#customerTreeGroupNumber")?.value.trim() || "",
            groupName: $("#customerTreeGroupName")?.value.trim() || "",
            companyName: $("#customerTreeCompanyName")?.value.trim() || "",
            personCode: $("#customerTreePersonCode")?.value.trim() || "",
            personName: $("#customerTreePersonName")?.value.trim() || "",
            personWechat: $("#customerTreePersonWechat")?.value.trim() || "",
            industries: checkedFilterValues("customerIndustryMulti"),
            levels: checkedFilterValues("customerLevelMulti"),
            personPhone: phoneKey,
            pms: checkedFilterValues("customerPmMulti"),
            coverage: $("#customerTreeCoverage")?.value || "",
            departments,
            positions,
            customPosition: "",
            departmentCoverage,
            positionCoverage,
            provinces: new Set(customerAreaFilter.provinces),
            cities: new Set(customerAreaFilter.cities),
            districts: new Set(customerAreaFilter.districts),
          };
          selectedOperationCustomerId = null;
          selectedOperationContactId = null;
          selectedCustomerGroup = "";
          selectedOperationRegion = "";
          selectedOperationProvince = "";
          selectedOperationRegionGroup = "";
          renderPage();
          toast("筛选条件已生效");
        };
        [
          ["customerAreaProvince", "provinces"],
          ["customerAreaCity", "cities"],
          ["customerAreaDistrict", "districts"],
        ].forEach(([prefix, key]) => {
          const trigger = $("#" + prefix + "Trigger"),
            menu = $("#" + prefix + "Menu"),
            search = $("#" + prefix + "Search"),
            options = $("#" + prefix + "Options");
          if (!trigger) return;
          trigger.onclick = (event) => {
            event.stopPropagation();
            [
              "customerAreaProvince",
              "customerAreaCity",
              "customerAreaDistrict",
            ].forEach((other) => {
              if (other !== prefix) {
                $("#" + other + "Menu")?.classList.add("hidden");
                $("#" + other + "Trigger")?.setAttribute(
                  "aria-expanded",
                  "false",
                );
              }
            });
            const willOpen = menu.classList.contains("hidden");
            menu.classList.toggle("hidden");
            trigger.setAttribute("aria-expanded", String(willOpen));
          };
          if (search)
            search.oninput = () =>
              document
                .querySelectorAll("#" + prefix + "Options [data-option-label]")
                .forEach((el) =>
                  el.classList.toggle(
                    "hidden",
                    !el.dataset.optionLabel.includes(search.value.trim()),
                  ),
                );
          if (options)
            options.onchange = (e) => {
              const input = e.target;
              if (!input.matches('input[type="checkbox"]')) return;
              if (input.checked) customerAreaFilter[key].add(input.value);
              else customerAreaFilter[key].delete(input.value);
              if (key === "provinces") {
                const opts = customerFilterOptions();
                Array.from(customerAreaFilter.cities).forEach((city) => {
                  if (!opts.cities.includes(city))
                    customerAreaFilter.cities.delete(city);
                });
                Array.from(customerAreaFilter.districts).forEach((district) => {
                  if (!opts.districts.includes(district))
                    customerAreaFilter.districts.delete(district);
                });
              }
              if (key === "cities") {
                const opts = customerFilterOptions();
                Array.from(customerAreaFilter.districts).forEach((district) => {
                  if (!opts.districts.includes(district))
                    customerAreaFilter.districts.delete(district);
                });
              }
              refreshAreaFilterUI();
            };
        });
        if (customerAreaOutsideClickHandler)
          document.removeEventListener(
            "click",
            customerAreaOutsideClickHandler,
          );
        customerAreaOutsideClickHandler = (event) => {
          if (!event.target.closest("#customerFilterToolbar .multi-select")) {
            document
              .querySelectorAll("#customerFilterToolbar .multi-select-menu")
              .forEach((menu) => menu.classList.add("hidden"));
            document
              .querySelectorAll("#customerFilterToolbar .multi-select-trigger")
              .forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
          }
        };
        document.addEventListener("click", customerAreaOutsideClickHandler);
        const applyCustomerFilter = $("#applyCustomerFilter");
        if (applyCustomerFilter)
          applyCustomerFilter.onclick = applyCustomerFilters;
        const clearAreaFilter = $("#clearAreaFilter");
        if (clearAreaFilter)
          clearAreaFilter.onclick = () => {
            customerAreaFilter.provinces.clear();
            customerAreaFilter.cities.clear();
            customerAreaFilter.districts.clear();
            appliedCustomerFilter = {
              group: "",
              groupNumber: "",
              groupName: "",
              companyName: "",
              personCode: "",
              personName: "",
              personWechat: "",
              industries: new Set(),
              levels: new Set(),
              personPhone: "",
              pms: new Set(),
              coverage: "",
              departments: new Set(),
              positions: new Set(),
              customPosition: "",
              departmentCoverage: "",
              positionCoverage: "",
              provinces: new Set(),
              cities: new Set(),
              districts: new Set(),
            };
            [
              "#customerTreeGroupName",
              "#customerTreeGroupNumber",
              "#customerTreeCompanyName",
              "#customerTreePersonCode",
              "#customerTreePersonName",
              "#customerTreePersonWechat",
              "#customerTreePersonPhone",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            [
              "#customerTreeGroup",
              "#customerDepartmentCoverage",
              "#customerPositionCoverage",
              "#customerTreeCoverage",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            refreshAreaFilterUI();
            selectedOperationCustomerId = null;
            selectedOperationContactId = null;
            selectedCustomerGroup = "";
            selectedOperationRegion = "";
            selectedOperationProvince = "";
            selectedOperationRegionGroup = "";
            renderPage();
            toast("筛选条件已重置");
          };
        if (currentPage === "customers")
          filterCustomerTree();
        bindFilter("#customerSearch", "#customerBody tr");
        bindFilter("#industryFilter", "#customerBody tr");
        bindFilter("#contactSearch", "#contactBody tr");
        bindFilter("#contactLevel", "#contactBody tr");
        const filterTasks = () => {
          const parentCode = $("#taskParentCode")?.value.trim() || "",
            executionCode = $("#taskExecutionCode")?.value.trim() || "",
            title = $("#taskTitle")?.value.trim() || "",
            personCode = $("#taskPersonCode")?.value.trim() || "",
            personName = $("#taskPersonName")?.value.trim() || "",
            company = $("#taskCompany")?.value.trim() || "",
            type = $("#taskType")?.value || "",
            owner = $("#taskOwner")?.value || "",
            region = $("#taskRegion")?.value || "",
            city = $("#taskCityFilter")?.value || "",
            riskScope = $("#taskRiskScope")?.value || "",
            eventType = $("#taskEventType")?.value || "",
            eventMonth = $("#taskEventMonth")?.value || "",
            completionType = $("#taskCompletionType")?.value || "",
            dueStart = $("#taskDueStart")?.value || "",
            dueEnd = $("#taskDueEnd")?.value || "";
          const invalidDueRange = dueStart && dueEnd && dueStart > dueEnd;
          $("#taskDueEnd")?.setCustomValidity(
            invalidDueRange ? "截止日期止不能早于截止日期起" : "",
          );
          const rows = [
            ...document.querySelectorAll("#taskBody tr[data-execution-group]"),
          ];
          let matched = 0;
          rows.forEach((row) => {
            const id = row.querySelector('[data-action="task-detail"]')?.dataset.id ||
              row.querySelector("[data-complete]")?.dataset.complete;
            const task = tasks.find((item) => String(item.id) === String(id));
            const contact = contacts.find(
              (item) => item.name === task?.person && item.company === task?.company,
            );
            const isMatch = !invalidDueRange &&
              (!parentCode || String(task?.parentTaskCode || "").includes(parentCode)) &&
              (!executionCode || String(task?.executionCode || "").includes(executionCode)) &&
              (!title || String(task?.title || "").includes(title)) &&
              (!personCode || String(contact?.code || "").includes(personCode)) &&
              (!personName || String(task?.person || "").includes(personName)) &&
              (!company || String(task?.company || "").includes(company)) &&
              (!type ||
                (type === "care"
                  ? ["生日关怀", "节假日关怀"].includes(
                      row.dataset.taskType,
                    )
                  : row.dataset.taskType === type)) &&
              (!owner || row.dataset.taskOwner === owner) &&
              (!region || regionsMatch(row.dataset.taskRegion, region)) &&
              (!city || row.dataset.taskCity === city) &&
              (!riskScope ||
                (riskScope === "current" && row.dataset.taskRisk === "true") ||
                (riskScope === "ever" && Boolean(row.dataset.taskOverdueMonth)) ||
                (riskScope === "next7" &&
                  row.dataset.executionGroup === "pending" &&
                  row.dataset.taskDue > DEMO_TODAY &&
                  row.dataset.taskDue <= addDays(DEMO_TODAY, 7)) ||
                (riskScope === "none" && row.dataset.taskRisk !== "true")) &&
              (!eventType ||
                (eventType === "done"
                  ? Boolean(row.dataset.taskDoneMonth) &&
                    (!eventMonth || row.dataset.taskDoneMonth === eventMonth)
                  : Boolean(row.dataset.taskOverdueMonth) &&
                    (!eventMonth || row.dataset.taskOverdueMonth === eventMonth))) &&
              (!completionType ||
                (completionType === "on-time"
                  ? ["on_time", "late_entry_approved"].includes(
                      row.dataset.taskCompletionType,
                    )
                  : completionType === "late-entry"
                    ? row.dataset.taskCompletionType === "late_entry_approved"
                    : row.dataset.taskCompletionType === "late_completion")) &&
              (!dueStart || row.dataset.taskDue >= dueStart) &&
              (!dueEnd || row.dataset.taskDue <= dueEnd);
            row.dataset.filterMatch = String(isMatch);
            if (isMatch) matched += 1;
          });
          if ($("#taskFilterCount"))
            $("#taskFilterCount").textContent = `筛选结果 ${matched} 条`;
          document
            .querySelector('[data-execution-table="main-executions"]')
            ?.applyExecutionState?.();
        };
        [
          "#taskParentCode",
          "#taskExecutionCode",
          "#taskTitle",
          "#taskPersonCode",
          "#taskPersonName",
          "#taskCompany",
          "#taskType",
          "#taskOwner",
          "#taskRegion",
          "#taskCityFilter",
          "#taskRiskScope",
          "#taskEventType",
          "#taskEventMonth",
          "#taskCompletionType",
          "#taskDueStart",
          "#taskDueEnd",
        ].forEach((selector) => {
          const element = $(selector);
          if (element) element.oninput = element.onchange = filterTasks;
        });
        if ($("#resetTaskFilters"))
          $("#resetTaskFilters").onclick = () => {
            [
              "#taskParentCode",
              "#taskExecutionCode",
              "#taskTitle",
              "#taskPersonCode",
              "#taskPersonName",
              "#taskCompany",
              "#taskType",
              "#taskOwner",
              "#taskRegion",
              "#taskCityFilter",
              "#taskRiskScope",
              "#taskEventType",
              "#taskEventMonth",
              "#taskCompletionType",
              "#taskDueStart",
              "#taskDueEnd",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            dashboardTaskFilter = null;
            executionTableStates["main-executions"].status = "pending";
            executionTableStates["main-executions"].page = 1;
            filterTasks();
          };
        if ($("#taskBody") && dashboardTaskFilter) {
          const filter = dashboardTaskFilter;
          if ($("#taskType")) $("#taskType").value = filter.type || "";
          if ($("#taskOwner")) $("#taskOwner").value = filter.pm || "";
          if ($("#taskRegion")) $("#taskRegion").value = filter.region || "";
          if ($("#taskCityFilter"))
            $("#taskCityFilter").value =
              filter.city === "省公司" ? "省级" : filter.city || "";
          if ($("#taskRiskScope"))
            $("#taskRiskScope").value =
              filter.group === "risk" ? "current" : "";
          if ($("#taskEventType"))
            $("#taskEventType").value = filter.event || "";
          if ($("#taskEventMonth"))
            $("#taskEventMonth").value = filter.month || "";
          if ($("#taskCompletionType"))
            $("#taskCompletionType").value =
              filter.group === "on-time" ? "on-time" : "";
          if ($("#taskDueStart"))
            $("#taskDueStart").value = filter.dueStart || "";
          if ($("#taskDueEnd"))
            $("#taskDueEnd").value = filter.dueEnd || "";
        }
        if ($("#taskBody")) {
          filterTasks();
          dashboardTaskFilter = null;
        }
        const filterTaskSummary = () => {
          const code = $("#summaryCode")?.value.trim() || "",
            name = $("#summaryName")?.value.trim() || "",
            scope = $("#summaryScope")?.value.trim() || "",
            type = $("#summaryType")?.value || "",
            status = $("#summaryStatus")?.value || "",
            owner = $("#summaryOwner")?.value || "";
          let matched = 0;
          document.querySelectorAll("#taskSummaryBody tr").forEach((row) => {
            const isMatch =
              (!code || row.dataset.summaryCode.includes(code)) &&
              (!name || row.dataset.summaryName.includes(name)) &&
              (!scope || row.dataset.summaryScope.includes(scope)) &&
              (!type ||
                (type === "care"
                  ? ["生日关怀", "节假日关怀"].includes(
                      row.dataset.summaryType,
                    )
                  : row.dataset.summaryType === type)) &&
              (!status || row.dataset.summaryStatus === status) &&
              (!owner ||
                (row.dataset.summaryOwner || "").split("|").includes(owner));
            row.style.display = isMatch ? "" : "none";
            if (isMatch) matched += 1;
          });
          if ($("#summaryFilterCount"))
            $("#summaryFilterCount").textContent = `筛选结果 ${matched} 项任务`;
        };
        ["#summaryCode", "#summaryName", "#summaryScope", "#summaryType", "#summaryStatus", "#summaryOwner"].forEach(
          (selector) => {
            const element = $(selector);
            if (element)
              element.oninput = element.onchange = filterTaskSummary;
          },
        );
        if ($("#resetSummaryFilters"))
          $("#resetSummaryFilters").onclick = () => {
            [
              "#summaryCode",
              "#summaryName",
              "#summaryScope",
              "#summaryType",
              "#summaryStatus",
              "#summaryOwner",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            dashboardTaskFilter = null;
            filterTaskSummary();
          };
        if ($("#taskSummaryBody") && dashboardTaskFilter?.type)
          $("#summaryType").value = dashboardTaskFilter.type;
        if ($("#taskSummaryBody")) {
          filterTaskSummary();
          dashboardTaskFilter = null;
        }
        const filterRecords = () => {
          const code = $("#recordCode")?.value.trim() || "",
            personCode = $("#recordPersonCode")?.value.trim() || "",
            personName = $("#recordPersonName")?.value.trim() || "",
            company = $("#recordCompany")?.value.trim() || "",
            summary = $("#recordSummary")?.value.trim() || "",
            method = $("#recordMethod")?.value || "",
            executor = $("#recordExecutor")?.value || "",
            region = $("#recordRegion")?.value || "",
            city = $("#recordCity")?.value || "",
            linkedTask = $("#recordLinkedTask")?.value || "",
            attachment = $("#recordAttachment")?.value || "",
            dateStart = $("#recordDateStart")?.value || "",
            dateEnd = $("#recordDateEnd")?.value || "",
            createdStart = $("#recordCreatedStart")?.value || "",
            createdEnd = $("#recordCreatedEnd")?.value || "";
          const invalidDateRange = dateStart && dateEnd && dateStart > dateEnd;
          const invalidCreatedRange =
            createdStart && createdEnd && createdStart > createdEnd;
          $("#recordDateEnd")?.setCustomValidity(
            invalidDateRange ? "维系日期止不能早于维系日期起" : "",
          );
          $("#recordCreatedEnd")?.setCustomValidity(
            invalidCreatedRange ? "创建日期止不能早于创建日期起" : "",
          );
          let matched = 0;
          document.querySelectorAll("#recordBody tr:not([data-empty-row])").forEach(
            (row) => {
              const recordId = row.querySelector('[data-action="record-detail"]')?.dataset.id;
              const record = maintenanceRecords.find(
                (item) => String(item.id) === String(recordId),
              );
              const contact = contacts.find(
                (item) => item.name === record?.person && item.company === record?.company,
              );
              const isMatch = !invalidDateRange && !invalidCreatedRange &&
                (!code || row.dataset.recordCode.includes(code)) &&
                (!personCode || String(contact?.code || "").includes(personCode)) &&
                (!personName || row.dataset.recordPerson.includes(personName)) &&
                (!company || row.dataset.recordCompany.includes(company)) &&
                (!summary || row.dataset.recordSummary.includes(summary)) &&
                (!method || row.dataset.recordMethod === method) &&
                (!executor || row.dataset.recordExecutor === executor) &&
                (!region || regionsMatch(row.dataset.recordRegion, region)) &&
                (!city || row.dataset.recordCity === city) &&
                (!linkedTask || row.dataset.recordLinked === linkedTask) &&
                (!attachment || row.dataset.recordAttachment === attachment) &&
                (!dateStart || row.dataset.recordDate >= dateStart) &&
                (!dateEnd || row.dataset.recordDate <= dateEnd) &&
                (!createdStart || row.dataset.recordCreated >= createdStart) &&
                (!createdEnd || row.dataset.recordCreated <= createdEnd);
              row.style.display = isMatch ? "" : "none";
              if (isMatch) matched += 1;
            },
          );
          if ($("#recordFilterCount"))
            $("#recordFilterCount").textContent =
              `筛选结果 ${matched} 条 · 数据范围：${currentUser.region}`;
        };
        [
          "#recordCode",
          "#recordPersonCode",
          "#recordPersonName",
          "#recordCompany",
          "#recordSummary",
          "#recordMethod",
          "#recordExecutor",
          "#recordRegion",
          "#recordCity",
          "#recordLinkedTask",
          "#recordAttachment",
          "#recordDateStart",
          "#recordDateEnd",
          "#recordCreatedStart",
          "#recordCreatedEnd",
        ].forEach((selector) => {
          const element = $(selector);
          if (element) element.oninput = element.onchange = filterRecords;
        });
        if ($("#resetRecordFilters"))
          $("#resetRecordFilters").onclick = () => {
            [
              "#recordCode",
              "#recordPersonCode",
              "#recordPersonName",
              "#recordCompany",
              "#recordSummary",
              "#recordMethod",
              "#recordExecutor",
              "#recordRegion",
              "#recordCity",
              "#recordLinkedTask",
              "#recordAttachment",
              "#recordDateStart",
              "#recordDateEnd",
              "#recordCreatedStart",
              "#recordCreatedEnd",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            filterRecords();
          };
        if ($("#recordBody") && $("#recordExecutor")) filterRecords();
        const selectedImportStatuses = () => [
          ...document.querySelectorAll("[data-import-status]:checked"),
        ].map((input) => input.value);
        const updateImportStatusText = () => {
          const statuses = selectedImportStatuses();
          if ($("#importStatusText"))
            $("#importStatusText").textContent = statuses.length
              ? `批次状态（${statuses.length}）`
              : "全部批次状态";
        };
        const applyImportFilters = () => {
          const batchCode = $("#importBatchCode")?.value.trim() || "";
          const fileName = $("#importFileName")?.value.trim() || "";
          const template = $("#importTemplateType")?.value || "";
          const statuses = selectedImportStatuses();
          const creator = $("#importCreator")?.value || "";
          const start = $("#importStartDate")?.value || "";
          const end = $("#importEndDate")?.value || "";
          const exception = $("#importException")?.value || "";
          if (start && end && start > end) {
            toast("创建日期开始日不能晚于结束日");
            return;
          }
          let matched = 0;
          document
            .querySelectorAll("#importBody tr[data-import-row]")
            .forEach((row) => {
              const errors = Number(row.dataset.errors || 0);
              const duplicates = Number(row.dataset.duplicates || 0);
              const warnings = Number(row.dataset.warnings || 0);
              const exceptionMatched =
                !exception ||
                (exception === "errors" && errors > 0) ||
                (exception === "duplicates" && duplicates > 0) ||
                  (exception === "warnings" && warnings > 0) ||
                  (exception === "none" && !errors && !duplicates && !warnings);
              const visible =
                (!batchCode || row.dataset.batchId.startsWith(batchCode)) &&
                (!fileName || row.dataset.file.includes(fileName)) &&
                (!template || row.dataset.template === template) &&
                (!statuses.length || statuses.includes(row.dataset.status)) &&
                (!creator || row.dataset.creator === creator) &&
                (!start || row.dataset.date >= start) &&
                (!end || row.dataset.date <= end) &&
                exceptionMatched;
              row.style.display = visible ? "" : "none";
              if (visible) matched += 1;
            });
          if ($("#importFilteredEmpty"))
            $("#importFilteredEmpty").style.display = matched ? "none" : "";
          if ($("#importFilterCount"))
            $("#importFilterCount").textContent = `筛选结果 ${matched} 个批次`;
          if ($("#importStatusSelect")) $("#importStatusSelect").open = false;
        };
        document.querySelectorAll("[data-import-status]").forEach(
          (input) => (input.onchange = updateImportStatusText),
        );
        if ($("#queryImportFilters"))
          $("#queryImportFilters").onclick = applyImportFilters;
        ["#importBatchCode", "#importFileName"].forEach((selector) => {
          const control = $(selector);
          if (control) control.onkeydown = (event) => {
            if (event.key === "Enter") applyImportFilters();
          };
        });
        if ($("#resetImportFilters"))
          $("#resetImportFilters").onclick = () => {
            [
              "#importBatchCode",
              "#importFileName",
              "#importTemplateType",
              "#importCreator",
              "#importStartDate",
              "#importEndDate",
              "#importException",
            ].forEach((selector) => {
              const element = $(selector);
              if (element) element.value = "";
            });
            document.querySelectorAll("[data-import-status]").forEach(
              (input) => (input.checked = false),
            );
            updateImportStatusText();
            applyImportFilters();
          };
        const applyArchiveFilters = () => {
          const objectName = $("#archiveObjectName")?.value.trim() || "";
          const group = $("#archiveGroup")?.value.trim() || "";
          const type = $("#archiveType")?.value || "";
          const status = $("#archiveStatus")?.value || "";
          const approvalStatus = $("#archiveApprovalStatus")?.value || "";
          const applicant = $("#archiveApplicant")?.value || "";
          const region = $("#archiveRegion")?.value || "";
          const applyStart = $("#archiveApplyStart")?.value || "";
          const applyEnd = $("#archiveApplyEnd")?.value || "";
          const effectiveStart = $("#archiveEffectiveStart")?.value || "";
          const effectiveEnd = $("#archiveEffectiveEnd")?.value || "";
          let matched = 0;
          document
            .querySelectorAll("#archiveBody tr:not([data-empty-row])")
            .forEach((row) => {
              const archiveId = row.querySelector('[data-action="archive-audit"]')?.dataset.id;
              const archived = archivedItems.find(
                (item) => String(item.id) === String(archiveId),
              );
              const object = archivedBusinessObject(archived || {});
              const company = archived?.targetKind === "contact"
                ? customers.find((item) => item.name === object?.company)
                : object;
              const archivedGroup = archived?.targetKind === "group"
                ? archived.name
                : company?.group || object?.group || "";
              const visible =
                (!objectName || String(archived?.name || "").includes(objectName)) &&
                (!group || String(archivedGroup).includes(group)) &&
                (!type || row.dataset.type === type) &&
                (!status ||
                  (status === "current"
                    ? row.dataset.status === "已停用"
                    : row.dataset.status === status)) &&
                (!approvalStatus ||
                  row.dataset.approvalStatus === approvalStatus) &&
                (!applicant || row.dataset.applicant === applicant) &&
                (!region || row.dataset.region === region) &&
                (!applyStart || row.dataset.applyDate >= applyStart) &&
                (!applyEnd || row.dataset.applyDate <= applyEnd) &&
                (!effectiveStart ||
                  row.dataset.effectiveDate >= effectiveStart) &&
                (!effectiveEnd || row.dataset.effectiveDate <= effectiveEnd);
              row.style.display = visible ? "" : "none";
              if (visible) matched += 1;
            });
          if ($("#archiveFilterCount"))
            $("#archiveFilterCount").textContent = `筛选结果 ${matched} 条`;
        };
        [
          "#archiveObjectName",
          "#archiveGroup",
          "#archiveType",
          "#archiveStatus",
          "#archiveApprovalStatus",
          "#archiveApplicant",
          "#archiveRegion",
          "#archiveApplyStart",
          "#archiveApplyEnd",
          "#archiveEffectiveStart",
          "#archiveEffectiveEnd",
        ].forEach((selector) => {
          const element = $(selector);
          if (element)
            element.oninput = element.onchange = applyArchiveFilters;
        });
        if ($("#resetArchiveFilters"))
          $("#resetArchiveFilters").onclick = () => {
            [
              "#archiveObjectName",
              "#archiveGroup",
              "#archiveType",
              "#archiveStatus",
              "#archiveApprovalStatus",
              "#archiveApplicant",
              "#archiveRegion",
              "#archiveApplyStart",
              "#archiveApplyEnd",
              "#archiveEffectiveStart",
              "#archiveEffectiveEnd",
            ].forEach((selector) => {
              const element = $(selector);
              if (element)
                element.value =
                  selector === "#archiveStatus" ? "current" : "";
            });
            applyArchiveFilters();
          };
        if ($("#archiveBody")) applyArchiveFilters();
        [
          "#employeeName",
          "#employeeCode",
          "#employeePhoneSuffix",
          "#employeeRole",
          "#employeeStatus",
          "#employeeAccountStatus",
        ].forEach((selector) => {
          const control = $(selector);
          if (control)
            control.oninput = control.onchange = applyEmployeeFilters;
        });
        if (dashboardEmployeeStatusFilter && $("#employeeStatus")) {
          $("#employeeStatus").value = dashboardEmployeeStatusFilter;
          dashboardEmployeeStatusFilter = "";
        }
        applyEmployeeFilters();
      }

      function openFilePreview() {
        openModal(
          `<div class="modal-head"><div class="modal-title">附件预览</div><button class="icon-btn close" data-close>×</button></div><div class="modal-body"><div class="file-box" style="min-height:260px;display:grid;place-items:center"><div><div style="font-size:var(--icon-size-empty);margin-bottom:var(--space-3)">▧</div>Demo附件预览区<br><span class="list-sub">正式系统将按文件类型展示图片或文档预览</span></div></div></div><div class="modal-foot"><button class="btn" data-close>关闭</button><button class="btn btn-primary" data-action="download-file">下载附件</button></div>`,
        );
      }

      function bindOverlay() {
        bindExecutionTables();
        document
          .querySelectorAll("[data-close],.drawer-mask,.modal-mask")
          .forEach((x) => (x.onclick = closeOverlay));
        document
          .querySelectorAll("[data-back]")
          .forEach((x) => (x.onclick = backDrawer));
        document
          .querySelectorAll("#overlay [data-action], #modalLayer [data-action]")
          .forEach(
            (b) =>
              (b.onclick = () =>
                genericAction(b.dataset.action, b.dataset.id, b.dataset.kind)),
          );
        document
          .querySelectorAll("#overlay [data-person], #modalLayer [data-person]")
          .forEach(
            (b) => (b.onclick = () => openPerson(Number(b.dataset.person))),
          );
        document
          .querySelectorAll(
            "#overlay [data-customer], #modalLayer [data-customer]",
          )
          .forEach(
            (b) => (b.onclick = () => openCustomer(Number(b.dataset.customer))),
          );
        document
          .querySelectorAll(
            "#overlay [data-customer-region], #modalLayer [data-customer-region]",
          )
          .forEach(
            (b) =>
              (b.onclick = () =>
                openCustomer(Number(b.dataset.customerRegion), {
                  limitContacts: true,
                })),
          );
        document
          .querySelectorAll(
            "#overlay [data-complete], #modalLayer [data-complete]",
          )
          .forEach(
            (b) =>
              (b.onclick = () => openCompleteTask(Number(b.dataset.complete))),
          );
        document
          .querySelectorAll(
            "#overlay [data-approve], #modalLayer [data-approve]",
          )
          .forEach(
            (b) =>
              (b.onclick = () =>
                openApprovalDecision(Number(b.dataset.approve), true)),
          );
        document
          .querySelectorAll("#overlay [data-reject], #modalLayer [data-reject]")
          .forEach(
            (b) =>
              (b.onclick = () =>
                openApprovalDecision(Number(b.dataset.reject), false)),
          );
      }
