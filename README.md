# claude-model-presets

Keyboard shortcuts for [claude.ai](https://claude.ai) that switch **model and effort in one step**.
What each shortcut does is configured in a "Model presets" section the extension adds to the
claude.ai settings (General tab).

> **Unofficial. Not affiliated with or endorsed by Anthropic.**

## Features
- `Alt+Shift+1..9` (or `Ctrl+Alt+1..9`) selects a model and an effort level, then shows a short notice
  above the composer ("Sonnet 5.5 · Medium").
- Works by operating the existing UI (model menu). No network requests are intercepted or modified.
- The model list is learned from the menus you open, nothing is hard-coded.
- Settings sync via `storage.sync` (falls back to `storage.local`) and apply instantly, no reload.
- Only permissions: `storage` and `https://claude.ai/*`. No background script, no analytics, no dependencies at runtime.

**Why Alt+Shift as default:** Alt alone opens the menu bar in Firefox, and Alt+Shift+digit has no browser
binding. `Ctrl+Alt+digit` is available as an alternative, but on many layouts (e.g. German) it equals
AltGr and would type characters.

## Install

There is no store listing yet; install from source. Requires Node.js 18+.

```bash
git clone https://github.com/david-x3d/claude-model-presets.git
cd claude-model-presets
npm install
npm run build        # creates dist/firefox and dist/chrome
```

### Firefox (and forks such as Floorp, LibreWolf)
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select `dist/firefox/manifest.json`.
3. Open `about:addons` → *claude-model-presets* → **Permissions** and allow access to `claude.ai`
   (Firefox does not always grant host permissions automatically for Manifest V3).
4. Reload claude.ai.

Temporary add-ons are removed when the browser closes. For development use
`npm run start:firefox` (web-ext, with auto-reload). For a Firefox fork, run
`npx web-ext run --firefox=/path/to/browser --source-dir dist/firefox`.

### Chrome / Chromium / Edge / Brave
1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `dist/chrome` folder.
3. Reload claude.ai.

### Signed Firefox build (permanent install)
Release Firefox only keeps add-ons that Mozilla has signed. Self-distribution ("unlisted") signing is free:
create API keys at <https://addons.mozilla.org/developers/addon/api/key/>, then

```bash
export WEB_EXT_API_KEY=user:xxxx WEB_EXT_API_SECRET=xxxx
npm run sign:firefox      # writes web-ext-artifacts/*.xpi
```
Install the `.xpi` via `about:addons` → gear icon → *Install Add-on From File…*.

## First use
1. On claude.ai/new open the model selector once, expand **More models**, and open the **Effort**
   submenu (per model). That is how the extension learns the model list and effort levels.
2. Open claude.ai settings → General → scroll to **Model presets** and assign models and levels to slots 1 to 9.
3. On claude.ai/new or in a chat, press the shortcut.

## Known limitations
- The model list starts empty and only contains models you have seen in the menu. Models that disappear later
  stay listed until extension storage is cleared.
- Effort levels are known per model only after you opened that model's Effort submenu once. Effort is stored
  and matched by its visible label, so it is language dependent.
- The section is added to the General settings tab, not as its own tab.
- Depends on claude.ai's current markup. All selectors live in `src/selectors.js` (unverified ones are marked).
- Chrome support is built but less tested than Firefox.
- Nothing from Anthropic (CSS, bundles) is included; the settings section reuses classes the page already loads.

## Development
```
src/         content scripts (selectors.js, i18n.js, presets.js, settings-ui.js, content.js)
manifests/   base.json + per-browser overrides
tools/       build script
```
`npm run build` merges manifests and copies `src/` to `dist/<browser>`.

## License
MIT
