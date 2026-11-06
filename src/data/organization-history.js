      const personnelChanges = [];
      const organizationChanges = [];
      function recordOrganizationChange(change) {
        const date = change.date || recordCreatedAt();
        organizationChanges.unshift({
          id: change.id || `OC-${Date.now()}`,
          actualEffectiveAt: change.actualEffectiveAt || date,
          ...change,
          date,
        });
      }
