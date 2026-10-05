import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Laddar spelet i jsdom. storage fylls i localStorage innan scriptet körs.
export function load({ storage = {}, url = 'http://localhost/' } = {}) {
  const errors = [];
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
      w.addEventListener('error', e => errors.push(e.error || e.message));
    }
  });
  const w = dom.window, doc = w.document;
  return { w, doc, errors, g: expr => w.eval(expr), $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)] };
}

// Alla nivåer upplåsta
export const ALL_OPEN = { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5, medium: 5, tc: 5, hard: 5 }) };
export const atLevel = (level, extra = {}) => load({ storage: { ...ALL_OPEN, 'fargkoden-level': level, ...extra } });
