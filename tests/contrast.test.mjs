import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from './harness.mjs';

// Färgerna läses ur index.html: :root för ljust läge och [data-theme="dark"] för mörkt
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const block = re => Object.fromEntries([...html.match(re)[1].matchAll(/--([\w-]+):(#[0-9a-f]{3,6})/gi)].map(m => [m[1], m[2]]));
const light = block(/:root\{([^}]*)\}/), dark = block(/:root\[data-theme="dark"\]\{([^}]*)\}/);
const rgb = h => { h = h.slice(1); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const lum = c => rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

test('Taggarna på frågekorten och märkena efter svaret går att läsa i båda lägena', () => {
  for (const [mode, v] of [['ljust', light], ['mörkt', dark]]) {
    for (const k of ['k-point-tag', 'k-entry-tag', 'k-order-tag', 'ok', 'bad'])
      assert.ok(ratio(v.surface, v[k]) >= 4.5, `${mode}: --surface på --${k} ${ratio(v.surface, v[k]).toFixed(2)}`);
  }
});

test('Ämnenas rubrikrad: texten går att läsa mot ämnets färg', () => {
  const t = load();
  const look = JSON.parse(t.g('JSON.stringify(TOPIC_LOOK)'));
  for (const [k, { c, ci }] of Object.entries(look))
    assert.ok(ratio(c, ci) >= 4.5, `${k}: ${ci} på ${c} ${ratio(c, ci).toFixed(2)}`);
});

test('Eldprovet: frågorna har vanlig mörk text, inte eldens ljusa', () => {
  assert.match(html, /\.examplay #q\{color:var\(--ink\)\}/);
});
