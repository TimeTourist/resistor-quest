import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Laddar spelet i jsdom. storage fylls i localStorage innan scriptet körs.
// start: sidan står kvar på startsidan. Utan start öppnas spelkortet direkt (se nedan).
export function load({ storage = {}, url = 'http://localhost/', instant = true, audio = null, start = false } = {}) {
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
  // De flesta tester vill börja på en fråga: utan start öppnas spelkortet för ämnet man var på,
  // utan nycklar och med snabbkollen gjord. Med start står man på startsidan som en spelare gör.
  if (!start) w.eval("if (S.screen === 'grid' && S.topic !== 'ultra') { S.keys = []; S.seen = TOPICS.slice(); openTopic(S.topic) }");
  return { w, doc, errors, g: expr => w.eval(expr), $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)] };
}

// Alla ämnen klara upp till Mästare, så att allt är öppet
export const ALL_OPEN = { 'fargkoden2-done': JSON.stringify({ body: 3, ohm: 3, tol: 3, tc: 3, e: 3 }) };
// Ett ämne på en viss grad (0 Nykomling – 4 Stormästare). Fyra klarade grader överallt: allt är öppet men inget är gyllene.
export const atGrade = (topic, grade, extra = {}) => load({ storage: {
  ...ALL_OPEN, 'fargkoden2-topic': topic,
  'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }),
  'fargkoden2-grade': JSON.stringify({ [topic]: grade }), ...extra } });
// Ett gyllene ämne (Stormästare klar), som spelas blandat
export const golden = (topic, extra = {}) => load({ storage: {
  'fargkoden2-topic': topic, 'fargkoden2-done': JSON.stringify({ body: 5, ohm: 5, tol: 5, tc: 5, e: 5 }),
  'fargkoden2-grade': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }), ...extra } });
