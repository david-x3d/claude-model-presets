# claude-model-presets

Keyboard shortcuts on claude.ai that switch model and effort in one step. Presets are configured in a
section this extension adds to claude.ai/settings (General tab).

**Unofficial. Not affiliated with or endorsed by Anthropic.**

## How it works
- Shortcuts (`Alt+Shift+1..9` by default, or `Ctrl+Alt+1..9`) operate the existing model menu:
  open it, wait via MutationObserver, pick the model (`data-model-id`), pick the effort, close.
  No network requests are intercepted.
- The model list and effort levels are learned from menus you open; nothing is hard-coded.
- Settings: `browser.storage.sync` (fallback `local`). Only permissions: storage + `https://claude.ai/*`.
- Every selector lives in `src/selectors.js`.

**Why Alt+Shift as default:** Alt alone opens the menu bar in Firefox; Alt+Shift+digit has no
browser binding. `Ctrl+Alt+digit` is offered as alternative, but it equals AltGr on many layouts
(e.g. German) and then types characters in the input field.

## Install from source
```
npm install
npm run build          # -> dist/firefox, dist/chrome
npm run start:firefox  # run with web-ext
```
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/firefox/manifest.json`.
- Chrome: `chrome://extensions` → Developer mode → Load unpacked → `dist/chrome`.

## Known limitations
- Model list starts empty: click the model selector once on claude.ai/new (also "More models") so it can be learned.
  Models that disappear later stay in the list until storage is cleared.
- Effort levels per model are only known after you opened that model's Effort submenu once; before that the
  settings show all levels seen so far.
- Effort is matched by its visible label, so presets store the label in the language you saw it in.
- The section is added to the General settings tab, not as its own tab.
- Depends on claude.ai's current markup (see `[unverified]` marks in `src/selectors.js`).
- No Anthropic CSS or bundles are included; the section reuses classes the page already loads.
