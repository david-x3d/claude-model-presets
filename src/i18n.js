// Strings of the extension itself (not of claude.ai).
(() => {
  const CMP = (globalThis.CMP = globalThis.CMP || {});

  const de = {
    title: 'Modell-Presets',
    scheme: 'Tastenkürzel-Schema',
    schemeDesc: 'Modifier für die Slots 1 bis 9.',
    altshift: 'Alt+Shift+Ziffer',
    ctrlalt: 'Strg+Alt+Ziffer',
    slot: 'Slot',
    model: 'Modell',
    effort: 'Reasoning-Stufe',
    unchanged: 'Unverändert',
    active: 'aktiv',
    reset: 'Zurücksetzen',
    none: 'Kein Modell',
    missing: 'nicht verfügbar',
    missingWarn: 'Dieses Modell gibt es in deiner Modellliste nicht. Der Slot tut nichts.',
    noCatalog: 'Noch keine Modelle bekannt. Öffne claude.ai/new und klicke einmal auf den Modellwähler.',
    effortGuess: 'Stufen für dieses Modell noch nicht gesehen: zeigt alle bekannten.',
    notFound: 'Nicht gefunden',
  };
  const en = {
    title: 'Model presets',
    scheme: 'Shortcut scheme',
    schemeDesc: 'Modifier for slots 1 to 9.',
    altshift: 'Alt+Shift+digit',
    ctrlalt: 'Ctrl+Alt+digit',
    slot: 'Slot',
    model: 'Model',
    effort: 'Effort',
    unchanged: 'Unchanged',
    active: 'active',
    reset: 'Reset',
    none: 'No model',
    missing: 'unavailable',
    missingWarn: 'This model is not in your model list. The slot does nothing.',
    noCatalog: 'No models known yet. Open claude.ai/new and click the model selector once.',
    effortGuess: 'Levels for this model not seen yet: showing all known ones.',
    notFound: 'Not found',
  };

  const strings = /^de/i.test(navigator.language) ? de : en;
  CMP.t = (k) => strings[k] ?? k;
})();
