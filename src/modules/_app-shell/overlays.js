      function filterRows(selector, value) {
        document
          .querySelectorAll(selector)
          .forEach(
            (r) =>
              (r.style.display =
                !value || r.dataset.search?.includes(value) ? "" : "none"),
          );
      }

      let drawerStack = [];
      function renderDrawerLayer(html) {
        const depth = drawerStack.length;
        const back = depth
          ? `<button class="icon-btn drawer-back" data-back title="返回上一层">←</button><span class="drawer-depth">第 ${depth + 1} 层</span>`
          : "";
        const enhanced = html.replace(
          '<div class="drawer-head">',
          `<div class="drawer-head">${back}`,
        );
        $("#overlay").innerHTML =
          `<div class="drawer-mask"></div><aside class="drawer">${enhanced}</aside>`;
        bindOverlay();
      }
      function openDrawer(html) {
        const current = $("#overlay .drawer");
        if (current)
          drawerStack.push({
            html: current.dataset.rawHtml || current.innerHTML,
            scrollTop: current.scrollTop,
          });
        else drawerStack = [];
        renderDrawerLayer(html);
        const drawer = $("#overlay .drawer");
        if (drawer) drawer.dataset.rawHtml = html;
      }
      function backDrawer() {
        const previous = drawerStack.pop();
        if (!previous) return closeOverlay();
        renderDrawerLayer(previous.html);
        const drawer = $("#overlay .drawer");
        if (drawer) {
          drawer.dataset.rawHtml = previous.html;
          drawer.scrollTop = previous.scrollTop || 0;
        }
      }
      function openModal(html) {
        $("#modalLayer").innerHTML =
          `<div class="modal-mask"></div><section class="modal">${html}</section>`;
        bindOverlay();
      }
      function closeOverlay() {
        const modalLayer = $("#modalLayer");
        if (modalLayer && modalLayer.innerHTML.trim()) {
          modalLayer.innerHTML = "";
          return;
        }
        drawerStack = [];
        $("#overlay").innerHTML = "";
        const n = $(".notice-panel");
        if (n) n.remove();
      }
      function closeAllOverlays() {
        $("#modalLayer").innerHTML = "";
        drawerStack = [];
        $("#overlay").innerHTML = "";
        const n = $(".notice-panel");
        if (n) n.remove();
      }
      function toast(msg) {
        const t = $("#toast");
        t.textContent = msg;
        t.classList.remove("hidden");
        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
      }

      /* Complete interaction layer: all primary page controls update in-memory Demo data. */
