(() => {
  const enhanceInteractiveAnchors = (root = document) => {
    root.querySelectorAll?.("a[onclick]:not([href])").forEach((anchor) => {
      const handler = anchor.getAttribute("onclick")?.trim();
      if (handler && !/\breturn\s+false\b/.test(handler)) {
        anchor.setAttribute("onclick", `${handler.replace(/;?$/, ";")} return false;`);
      }
      anchor.setAttribute("href", "#");
      anchor.setAttribute("role", "button");
      if (!anchor.hasAttribute("tabindex")) anchor.tabIndex = 0;
    });
  };

  enhanceInteractiveAnchors();

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.("a[onclick]:not([href])")) {
          const handler = node.getAttribute("onclick")?.trim();
          if (handler && !/\breturn\s+false\b/.test(handler)) {
            node.setAttribute("onclick", `${handler.replace(/;?$/, ";")} return false;`);
          }
          node.setAttribute("href", "#");
          node.setAttribute("role", "button");
          if (!node.hasAttribute("tabindex")) node.tabIndex = 0;
        }
        enhanceInteractiveAnchors(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
