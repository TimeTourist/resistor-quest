import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { load } from './harness.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const page = () => new JSDOM(html, { url: 'http://localhost/index.html', runScripts: 'dangerously', pretendToBeVisual: true }).window.document;

test('Startsidan: två spel, Ackordkartan och Färgkoden, med länkar till sina filer', () => {
  const d = page();
  const links = [...d.querySelectorAll('a.game')].map(a => a.getAttribute('href'));
  assert.deepEqual(links, ['ackord.html', 'fargkoden.html']);
  assert.match(d.querySelector('a[href="ackord.html"]').textContent, /Ackordkartan/);
  assert.match(d.querySelector('a[href="fargkoden.html"]').textContent, /Färgkoden/);
});

test('Testläget följer med till spelen', () => {
  const d = new JSDOM(html.replace('<html lang="sv">', '<html lang="sv" data-test="true">'), { url: 'http://localhost/index.html', runScripts: 'dangerously', pretendToBeVisual: true }).window.document;
  assert.deepEqual([...d.querySelectorAll('a.game')].map(a => a.getAttribute('href')), ['ackord.html?test=true', 'fargkoden.html?test=true']);
});

test('Färgkoden har en länk tillbaka till alla spel', () => {
  const t = load();
  assert.equal(t.$('a.home').getAttribute('href'), 'index.html');
});
