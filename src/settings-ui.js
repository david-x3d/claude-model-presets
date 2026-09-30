// Injects a "Model presets" section into the settings dialog/page (General tab), reusing the page's own
// classes so it follows the native look and theme. Markup mirrors rows pasted from that page.
(() => {
  const { S, t, presets } = globalThis.CMP;
  const MARK = 'data-cmp-section';

  const SELECT_CLASS = 'h-control max-w-[13rem] rounded border-0 bg-transparent px-sm font-sans text-body text-primary outline-none hover:bg-fill-ghost-hover focus-visible:shadow-focus';
  const BUTTON_CLASS = 'h-control cursor-pointer rounded border-0 bg-fill-ghost-hover px-md font-sans text-body text-primary outline-none focus-visible:shadow-focus';

  const el = (tag, cls, attrs = {}, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };

  function row(title, desc) {
    const r = el('div', 'flex items-center justify-between gap-lg py-md', { role: 'group', 'data-settings-row': '', 'data-settings-item': '' });
    const left = el('div', 'flex min-w-0 flex-1 flex-col justify-center gap-1');
    const head = el('div', 'text-body text-primary');
    head.append(el('span', 'settings-row-title inline-block align-top', {}, title));
    left.append(head);
    const d = el('div', 'text-body text-muted', { 'data-settings-desc': '' }, desc || '');
    if (!desc) d.hidden = true;
    left.append(d);
    const control = el('div', 'flex shrink-0 items-center gap-md', { 'data-settings-control': '' });
    r.append(left, control);
    return { r, control, desc: d };
  }

  function option(value, label, selected) {
    const o = el('option', '', { value }, label);
    o.style.backgroundColor = 'var(--cds-surface-3, Canvas)';
    o.selected = !!selected;
    return o;
  }

  function makeSwitch(checked, label, onChange) {
    const state = (on) => (on ? 'data-checked' : 'data-unchecked');
    const sw = el('span', 'cds-reset relative inline-flex shrink-0 rounded-full border-0 outline-none focus-visible:outline-hidden bg-[var(--cds-switch-track)] hover:bg-[var(--cds-switch-track-hover)] data-[checked]:bg-fill-accent data-[checked]:hover:bg-fill-accent-hover focus-visible:shadow-focus h-[var(--cds-switch-h)] w-[calc(var(--cds-switch-h,1.25rem)*1.8)] p-[2px] cursor-pointer',
      { role: 'switch', tabindex: '0', 'aria-label': label, 'data-cds': 'Switch' });
    const knob = el('span', 'block rounded-full bg-[var(--cds-switch-knob)] shadow-sm transition-transform duration-snap ease-overshoot motion-reduce:transition-none size-[calc(var(--cds-switch-h,1.25rem)-4px)] data-[checked]:translate-x-[calc(var(--cds-switch-h,1.25rem)*0.8)]');
    sw.append(knob);
    const set = (on) => {
      for (const n of [sw, knob]) { n.removeAttribute('data-checked'); n.removeAttribute('data-unchecked'); n.setAttribute(state(on), ''); }
      sw.setAttribute('aria-checked', String(on));
    };
    set(checked);
    const toggle = () => { const on = sw.getAttribute('aria-checked') !== 'true'; set(on); onChange(on); };
    sw.addEventListener('click', toggle);
    sw.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    return sw;
  }

  // ---------- state ----------
  let config; let catalog;
  const save = () => presets.save(config);

  const effortChoices = (modelId, current) => {
    const known = catalog.efforts[modelId];
    const all = known ?? [...new Set(Object.values(catalog.efforts).flat())];
    const list = current && !all.includes(current) ? [...all, current] : all;
    return { list, guessed: !known };
  };

  function fillEffort(select, descEl, slot) {
    select.replaceChildren(option('', t('unchanged'), !slot.effort));
    const { list, guessed } = slot.modelId ? effortChoices(slot.modelId, slot.effort) : { list: [], guessed: false };
    for (const l of list) select.append(option(l, l, l === slot.effort));
    select.disabled = !slot.modelId;
    return guessed && list.length > 0;
  }

  function slotRow(i) {
    const slot = config.slots[i];
    const shortcut = `${t(config.scheme)}`.replace(/Ziffer|digit/, String(i + 1));
    const { r, control, desc } = row(`${t('slot')} ${i + 1}`, shortcut);
    const missing = slot.modelId && !catalog.models.some((m) => m.id === slot.modelId);

    const model = el('select', SELECT_CLASS, { 'aria-label': `${t('model')} ${i + 1}` });
    model.append(option('', t('none'), !slot.modelId));
    for (const m of catalog.models) model.append(option(m.id, m.name, m.id === slot.modelId));
    if (missing) model.append(option(slot.modelId, `⚠ ${slot.modelId} (${t('missing')})`, true));

    const effort = el('select', SELECT_CLASS, { 'aria-label': `${t('effort')} ${i + 1}` });
    const warn = el('div', 'text-footnote text-warning', { role: 'alert' });
    const refreshHints = () => {
      const guessed = fillEffort(effort, desc, slot);
      const m = slot.modelId && !catalog.models.some((x) => x.id === slot.modelId);
      warn.textContent = m ? t('missingWarn') : guessed ? t('effortGuess') : '';
      warn.hidden = !warn.textContent;
      r.classList.toggle('opacity-50', !slot.active);
    };
    refreshHints();

    model.addEventListener('change', () => { slot.modelId = model.value; slot.effort = ''; refreshHints(); save(); });
    effort.addEventListener('change', () => { slot.effort = effort.value; save(); });
    const sw = makeSwitch(slot.active, `${t('active')} ${i + 1}`, (on) => { slot.active = on; refreshHints(); save(); });

    control.append(model, effort, sw);
    desc.hidden = false;
    desc.after(warn);
    return r;
  }

  function build() {
    const section = el('section', 'mb-xl last:mb-0', { [MARK]: '' });
    const header = el('div', 'mb-md flex items-start justify-between gap-lg', { 'data-settings-group-header': '' });
    const titleWrap = el('div', 'flex min-w-0 flex-col gap-1');
    titleWrap.append(el('h3', 'text-heading-semibold text-primary settings-row-title self-start outline-none', { 'data-settings-group-title': '' }, t('title')));
    header.append(titleWrap);

    const body = el('div', 'settings-group-dividers [&>:not([role=group]):not([data-cds=DataTable]):not([role=treegrid]):not([data-settle-slot])]:py-md');

    const schemeRow = row(t('scheme'), t('schemeDesc'));
    const scheme = el('select', SELECT_CLASS, { 'aria-label': t('scheme') });
    for (const s of ['altshift', 'ctrlalt']) scheme.append(option(s, t(s), s === config.scheme));
    scheme.addEventListener('change', () => { config.scheme = scheme.value; save(); render(true); });
    const reset = el('button', BUTTON_CLASS, { type: 'button' }, t('reset'));
    reset.addEventListener('click', async () => { config = await presets.reset(); render(true); });
    schemeRow.control.append(scheme, reset);
    body.append(schemeRow.r);

    if (!catalog.models.length) {
      const n = row(t('model'), t('noCatalog'));
      n.desc.hidden = false;
      body.append(n.r);
    }
    for (let i = 0; i < presets.SLOTS; i++) body.append(slotRow(i));

    section.append(header, body);
    return section;
  }

  // ---------- injection ----------
  let loaded = false;
  async function loadState() {
    [config, catalog] = await Promise.all([presets.load(), presets.loadCatalog()]);
    loaded = true;
  }

  function render(force) {
    const host = findHost();
    if (!host) return;
    const existing = host.querySelector(`[${MARK}]`);
    if (existing && !force) return;
    const next = build();
    if (existing) existing.replaceWith(next); else host.append(next);
  }

  // Container that holds the native sections; only on the General tab.
  function findHost() {
    if (!document.querySelector(S.settingsActiveTab)) return null;
    const title = document.querySelector(S.settingsGroupTitle);
    return title?.closest('section')?.parentElement ?? null;
  }

  let queued = false;
  function ensure() {
    queued = false;
    if (!findHost()) {
      document.querySelectorAll(`[${MARK}]`).forEach((n) => n.remove());
      return;
    }
    if (!loaded) { loadState().then(() => render(false)); return; }
    render(false);
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(ensure); } };

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  addEventListener('popstate', schedule);
  presets.onChange(async () => {
    if (!loaded) return;
    const before = JSON.stringify([config, catalog]);
    await loadState();
    if (JSON.stringify([config, catalog]) !== before) render(true); // skip echoes of our own writes
  });
  schedule();
})();
