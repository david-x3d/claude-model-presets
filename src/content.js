// Chat side: keyboard shortcuts drive the existing model menu; menus are also read passively
// to learn the model list. No network interception, only UI operation.
(() => {
  console.info('[claude-model-presets] content script loaded');
  const { S, t, presets } = globalThis.CMP;
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---------- DOM helpers ----------
  // Base UI menus react to the full pointer sequence, not only click().
  function press(el) {
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(type, {
        bubbles: true, cancelable: true, composed: true, view: window,
        button: 0, pointerType: 'mouse', isPrimary: true,
      }));
    }
  }
  function hover(el) {
    for (const type of ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove']) {
      const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(type, { bubbles: true, composed: true, view: window, pointerType: 'mouse' }));
    }
  }
  function escape() {
    const init = { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true };
    (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', init));
  }

  // Resolves with pred()'s truthy result, or null after timeout. No fixed sleeps.
  function waitFor(pred, timeout = 2000) {
    return new Promise((resolve) => {
      const check = () => { try { return pred(); } catch { return null; } };
      const now = check();
      if (now) return resolve(now);
      const done = (v) => { obs.disconnect(); clearTimeout(timer); resolve(v); };
      const obs = new MutationObserver(() => { const v = check(); if (v) done(v); });
      obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
      const timer = setTimeout(() => done(check() || null), timeout);
    });
  }

  // ---------- menu operations ----------
  const modelMenu = () => $$(S.menu).find((m) => m.querySelector(S.modelItem));
  const modelItem = (id) => $$(S.modelItem).find((el) => el.dataset.modelId === id);

  async function openModelMenu() {
    const trigger = document.querySelector(S.trigger);
    if (!trigger || trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') return null;
    if (trigger.getAttribute('aria-expanded') !== 'true') press(trigger);
    return waitFor(modelMenu);
  }

  async function closeMenus() {
    const trigger = document.querySelector(S.trigger);
    if (trigger?.getAttribute('aria-expanded') === 'true') {
      escape();
      await waitFor(() => trigger.getAttribute('aria-expanded') !== 'true', 800);
    }
  }

  const log = (...a) => console.debug('[claude-model-presets]', ...a);

  // Submenus open on hover, click or ArrowRight depending on the input method; try each in turn.
  async function openSubmenu(trigger, menu, hasItems) {
    const sub = () => $$(S.menu).find((m) => m !== menu && hasItems(m));
    trigger.focus?.({ preventScroll: true });
    hover(trigger);
    let m = await waitFor(sub, 700);
    if (!m) { press(trigger); m = await waitFor(sub, 700); }
    if (!m) {
      const init = { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, bubbles: true, cancelable: true };
      trigger.dispatchEvent(new KeyboardEvent('keydown', init));
      m = await waitFor(sub, 1000);
    }
    log('submenu', m ? 'opened' : 'not opened');
    return m;
  }

  async function selectModel(id) {
    const menu = await openModelMenu();
    if (!menu) return false;
    let item = modelItem(id);
    if (!item) {
      const more = $$(S.submenuTrigger, menu).filter((el) => !globalThis.CMP.isEffortTrigger(el)).pop();
      if (more) { await openSubmenu(more, menu, (m) => m.querySelector(S.modelItem)); item = await waitFor(() => modelItem(id), 1500); }
    }
    if (!item) { log('model not found', id, 'more:', !!item); await closeMenus(); return false; }
    if (item.getAttribute('aria-checked') !== 'true') press(item);
    await waitFor(() => !modelMenu(), 1000);
    await closeMenus();
    return true;
  }

  // Returns 'ok' | 'none' (model has no such effort option) | 'fail'.
  async function selectEffort(label) {
    const menu = await openModelMenu();
    if (!menu) return 'fail';
    const trigger = $$(S.submenuTrigger, menu).find(globalThis.CMP.isEffortTrigger);
    if (!trigger) { await closeMenus(); return 'none'; }
    const sub = await openSubmenu(trigger, menu, (m) => m.querySelector(S.effortItem));
    const item = sub && $$(S.effortItem, sub).find((el) => globalThis.CMP.labelOf(el) === label);
    if (!item) { await closeMenus(); return sub ? 'none' : 'fail'; }
    if (item.getAttribute('aria-checked') !== 'true') press(item);
    await waitFor(() => !document.contains(item), 1000);
    await closeMenus();
    return 'ok';
  }

  // ---------- toast ----------
  let toastEl; let toastTimer;
  function toast(text, isError = false) {
    toastEl?.remove();
    clearTimeout(toastTimer);
    const bar = document.querySelector(S.composer);
    const r = bar?.getBoundingClientRect();
    toastEl = document.createElement('div');
    toastEl.className = 'text-footnote rounded bg-surface-3 shadow-panel px-md py-1 ' + (isError ? 'text-warning' : 'text-secondary');
    toastEl.setAttribute('role', 'status');
    toastEl.textContent = text;
    Object.assign(toastEl.style, {
      position: 'fixed', zIndex: 2147483000, pointerEvents: 'none',
      left: r ? `${r.left + r.width / 2}px` : '50%',
      bottom: r ? `${Math.max(8, innerHeight - r.bottom + 8)}px` : '24px',
      transform: 'translateX(-50%)',
    });
    document.body.append(toastEl);
    toastTimer = setTimeout(() => toastEl?.remove(), 1500);
  }

  // ---------- catalog (passive) ----------
  let harvestTimer;
  function harvest() {
    clearTimeout(harvestTimer);
    harvestTimer = setTimeout(async () => {
      const menus = $$(S.menu);
      const models = menus.flatMap((m) => $$(S.modelItem, m)).map((el) => ({ id: el.dataset.modelId, name: globalThis.CMP.labelOf(el) }));
      const effortMenu = menus.find((m) => !m.querySelector(S.modelItem) && m.querySelector(S.effortItem));
      const current = $$(S.modelItem).find((el) => el.getAttribute('aria-checked') === 'true')?.dataset.modelId;
      if (!models.length && !(effortMenu && current)) return;

      const catalog = await presets.loadCatalog();
      let changed = false;
      for (const m of models) {
        const known = catalog.models.find((x) => x.id === m.id);
        if (!known) { catalog.models.push(m); changed = true; }
        else if (m.name && known.name !== m.name) { known.name = m.name; changed = true; }
      }
      if (effortMenu && current) {
        const labels = $$(S.effortItem, effortMenu).map(globalThis.CMP.labelOf).filter(Boolean);
        if (labels.length && JSON.stringify(catalog.efforts[current]) !== JSON.stringify(labels)) {
          catalog.efforts[current] = labels; changed = true;
        }
      }
      if (changed) { await presets.saveCatalog(catalog); await presets.load(); } // load() seeds defaults once
    }, 150);
  }
  new MutationObserver(harvest).observe(document.documentElement, { childList: true, subtree: true });

  // ---------- shortcuts ----------
  let config = null;
  let busy = false;
  const refresh = () => presets.load().then((c) => { config = c; });
  refresh();
  presets.onChange(refresh);

  const modifiersOk = (e, scheme) => scheme === 'ctrlalt'
    ? e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey
    : e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey;

  function isEditable(el) {
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  async function run(slot) {
    const catalog = await presets.loadCatalog();
    const model = catalog.models.find((m) => m.id === slot.modelId);
    if (!model) return toast(`${t('notFound')}: ${slot.modelId}`, true);
    if (!(await selectModel(slot.modelId))) return toast(`${t('notFound')}: ${model.name}`, true);
    let effortLabel = '';
    if (slot.effort) {
      const r = await selectEffort(slot.effort);
      if (r === 'ok') effortLabel = slot.effort;
      else toast(`${model.name}: ${t('notFound')} (${slot.effort})`, true);
      if (r !== 'ok') return;
    }
    toast([model.name, effortLabel].filter(Boolean).join(' · '));
  }

  addEventListener('keydown', async (e) => {
    if (!config || e.repeat || !globalThis.CMP.paths.chat(location.pathname)) return;
    const m = /^Digit([1-9])$/.exec(e.code);
    if (!m || !modifiersOk(e, config.scheme)) return;
    const slot = config.slots[Number(m[1]) - 1];
    if (!slot?.active || !slot.modelId) return;

    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest(S.dialog)) return;
    if (isEditable(target) && !target.closest(S.composer)) return;

    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    busy = true;
    try { await run(slot); } finally { busy = false; }
  }, true);
})();
