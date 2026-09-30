// Preset storage (sync, falling back to local) and the model catalog (local only).
// The catalog is learned passively from menus the user opens; nothing is hard-coded.
(() => {
  const CMP = (globalThis.CMP = globalThis.CMP || {});
  const api = globalThis.browser ?? globalThis.chrome;
  const SLOTS = 9;

  const area = async (name) => {
    try {
      await api.storage[name].get('__probe');
      return api.storage[name];
    } catch {
      return api.storage.local;
    }
  };
  const getArea = (name) => area(name);

  const emptySlot = () => ({ active: false, modelId: '', effort: '' });

  // Default: slot n -> n-th known model, effort unchanged.
  CMP.defaults = (catalog) => ({
    scheme: 'altshift',
    slots: Array.from({ length: SLOTS }, (_, i) => {
      const m = catalog?.models?.[i];
      return m ? { active: true, modelId: m.id, effort: '' } : emptySlot();
    }),
  });

  CMP.presets = {
    SLOTS,
    async loadCatalog() {
      const s = await getArea('local');
      return (await s.get('catalog')).catalog ?? { models: [], efforts: {} };
    },
    async saveCatalog(catalog) {
      await (await getArea('local')).set({ catalog });
    },
    // Returns stored config, creating defaults from the catalog on first use (once models are known).
    async load() {
      const s = await getArea('sync');
      const { config } = await s.get('config');
      if (config?.slots?.length === SLOTS) return config;
      const catalog = await this.loadCatalog();
      const fresh = CMP.defaults(catalog);
      if (catalog.models.length) await s.set({ config: fresh });
      return fresh;
    },
    async save(config) {
      await (await getArea('sync')).set({ config });
    },
    async reset() {
      const fresh = CMP.defaults(await this.loadCatalog());
      await this.save(fresh);
      return fresh;
    },
    // cb() after any change to config or catalog (any tab).
    onChange(cb) {
      api.storage.onChanged.addListener((changes) => {
        if (changes.config || changes.catalog) cb();
      });
    },
  };
})();
