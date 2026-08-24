      function scopedRecords() {
        if (!hasDataObject("维系记录")) return [];
        if (currentScopeType() === "cities")
          return maintenanceRecords.filter(
            (x) =>
              x.pm === currentUser.name &&
              companyIsVisible(customers.find((c) => c.name === x.company)),
          );
        if (currentScopeType() === "regions")
          return maintenanceRecords.filter((x) =>
            regionsMatch(
              customerRegionScope(
                customers.find((company) => company.name === x.company),
              ) || x.region,
              currentUser.region,
            ),
          );
        return ["company", "market"].includes(currentScopeType())
          ? maintenanceRecords
          : [];
      }


