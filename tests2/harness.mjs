import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index2.html', import.meta.url), 'utf8');

// Laddar spelet i jsdom. storage fylls i localStorage innan scriptet körs.
export function load({ storage = {}, url = 'http://localhost/', instant = true, audio = null } = {}) {
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
  // Utan animeringar och väntan: svaret visas direkt och rätt svar väntar på Nästa
  if (instant) w.eval('S.instant = true');
  return { w, doc, errors, g: expr => w.eval(expr), $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)] };
}

// Alla ämnen klara upp till Mästare, så att allt är öppet
export const ALL_OPEN = { 'fargkoden2-done': JSON.stringify({ body: 3, ohm: 3, tol: 3, tc: 3, e: 3 }) };
// Ett ämne på en viss grad (0 Nykomling – 4 Stormästare)
export const atGrade = (topic, grade, extra = {}) => load({ storage: {
  ...ALL_OPEN, 'fargkoden2-topic': topic,
  'fargkoden2-done': JSON.stringify({ body: 5, ohm: 5, tol: 5, tc: 5, e: 5 }),
  'fargkoden2-grade': JSON.stringify({ [topic]: grade }), ...extra } });
