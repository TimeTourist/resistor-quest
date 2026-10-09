import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../ackord.html', import.meta.url), 'utf8');

// Laddar Ackordkartan i jsdom. Utan start öppnas spelkortet direkt för ämnet man var på, utan nycklar och med snabbkollen gjord.
export function load({ storage = {}, url = 'http://localhost/ackord.html', instant = true, audio = null, start = false } = {}) {
  const errors = [];
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
      if (audio) w.AudioContext = audio;
      w.addEventListener('error', e => errors.push(e.error || e.message));
    }
  });
  const w = dom.window, doc = w.document;
  if (instant) w.eval('S.instant = true');
  if (!start) w.eval("if (S.screen === 'grid') { S.keys = []; S.seen = TOPICS.slice(); openTopic(S.topic) }");
  return { w, doc, errors, g: expr => w.eval(expr), $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)] };
}
// Ett ämne på en viss grad, med de två första ämnena klarade upp till Stormästare (inte gyllene)
export const atGrade = (topic, grade, extra = {}) => load({ storage: {
  'ackord1-topic': topic, 'ackord1-done': JSON.stringify({ tangent: 4, treklang: 4 }),
  'ackord1-grade': JSON.stringify({ [topic]: grade }), ...extra } });
// En bestämd frågetyp i förhandsvisningen
export const pinned = (topic, grade, q, opts = {}) => load({ url: `http://localhost/ackord.html?test=true&topic=${topic}&grade=${grade}&q=${q}`, ...opts });

// SVG-element har ingen click(), så klicket skickas som ett event
export const tap = (t, el) => el.dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));
export const cont = t => t.$('#q').click();
const key = (t, m) => t.$(`#q [data-key="${m}"]`);

// Svarar på aktuell fråga som en spelare, rätt eller fel
export function answer(t, correct = true) {
  const kind = t.g('S.Q.kind');
  if (kind === 'mc') {
    const right = t.g('S.Q.right');
    const btn = t.$$('#q [data-c]').find(b => (+b.dataset.c === right) === correct);
    assert.ok(btn, 'inget alternativ');
    return btn.click();
  }
  const need = t.g('S.Q.need'), ans = JSON.parse(t.g('JSON.stringify(S.Q.answer)'));
  if (need === 1) {
    const m = correct ? ans[0] : JSON.parse(t.g('JSON.stringify(KEYS.find(k => !S.Q.check([k])))'));
    return tap(t, key(t, m));
  }
  const ms = correct ? ans : [JSON.parse(t.g(`JSON.stringify(KEYS.find(k => !pcSet(${JSON.stringify(ans)}).includes(k % 12)))`)), ...ans.slice(1)];
  ms.forEach(m => tap(t, key(t, m)));
  t.$('#submit').click();
}
