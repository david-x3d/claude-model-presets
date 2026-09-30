// All selectors and DOM heuristics live here. Adjust only this file when claude.ai changes.
// [verified] = seen in DOM pasted from a logged-in session. [unverified] = inferred, needs a check.
(() => {
  const CMP = (globalThis.CMP = globalThis.CMP || {});

  CMP.S = {
    // [verified] model selector button; aria-label is "Model: <name> <effort>"
    trigger: '[data-testid="model-selector-dropdown"]',
    // [verified in bundle] composer root
    composer: '[data-testid="chat-input"]',
    menu: '[role="menu"]',
    // [verified] model entries carry a stable model id
    modelItem: '[role="menuitemradio"][data-model-id]',
    // [unverified] effort submenu entries: radio items without a model id
    effortItem: '[role="menuitemradio"]:not([data-model-id])',
    // [verified] "Effort" and "More models" are both role=menuitem + aria-haspopup=menu
    submenuTrigger: '[role="menuitem"][aria-haspopup="menu"]',
    dialog: '[role="dialog"],[role="alertdialog"]',

    // settings page [verified]
    settingsActiveTab: '[data-testid="general-settings"] [aria-current="page"]',
    settingsGroupTitle: '[data-settings-group-title]',
  };

  CMP.paths = {
    chat: (p) => p === '/new' || p.startsWith('/new/') || p.startsWith('/chat/'),
    settings: (p) => p.startsWith('/settings'),
  };

  // First non-empty text node of an element: the visible name without badges that follow it.
  CMP.labelOf = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (t) return t;
    }
    return '';
  };

  // The "Effort" trigger shows name + current value (two text spans); "More models" only a name.
  CMP.isEffortTrigger = (el) => {
    let spans = 0;
    for (const s of el.querySelectorAll('span')) {
      if (s.matches('[data-cds="Icon"],[aria-hidden="true"]') || s.closest('[data-cds="Icon"],[aria-hidden="true"]')) continue; // icon glyphs are text too
      if ([...s.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) spans++;
    }
    return spans >= 2;
  };
})();
