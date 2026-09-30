// Builds dist/firefox and dist/chrome from src/ + manifests/.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

for (const target of ['firefox', 'chrome']) {
  const out = path.join(root, 'dist', target);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(path.join(root, 'src'))) {
    fs.copyFileSync(path.join(root, 'src', f), path.join(out, f));
  }
  const manifest = { ...read('manifests/base.json'), ...read(`manifests/${target}.json`) };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`built dist/${target}`);
}
