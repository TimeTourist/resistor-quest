import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer, until } from './answer.mjs';

const esc = t => t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

test('Glödlampan sitter före Nästa, och tipset ligger inte i kortet', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  assert.ok(t.$('.qtop .bulb[data-hint] + #main'));
  assert.equal(t.$('.hints'), null);
  assert.equal(t.$('#hintOut'), null);
  assert.equal(t.$('#hintDlg'), null);
});

test('Lampan öppnar tipset i en dialog över kortet, med vad det kostar', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  t.$('.bulb').click();
  const dlg = t.$('#q #hintDlg');
  assert.ok(dlg);
  assert.match(dlg.textContent, /Toleransen säger/);
  assert.match(dlg.textContent, /Tipset kostar/);
  assert.equal(t.g('S.usedHint'), true);
  assert.ok(t.g('S.mark && S.mark.length'), 'banden markeras');
  assert.equal(t.doc.activeElement, t.$('[data-hintclose]'));
});

test('Stäng, och lampan lyser och öppnar samma tips igen', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  t.$('.bulb').click();
  const txt = t.$('#hintDlg').textContent;
  t.$('[data-hintclose]').click();
  assert.equal(t.$('#hintDlg'), null);
  assert.ok(t.$('.bulb.lit'));
  assert.equal(t.doc.activeElement, t.$('.bulb'));
  t.$('.bulb').click();
  assert.equal(t.$('#hintDlg').textContent, txt);
});

test('Escape och tryck utanför stänger dialogen', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  t.$('.bulb').click(); esc(t);
  assert.equal(t.$('#hintDlg'), null);
  t.$('.bulb').click();
  t.$('#hintDlg').dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));
  assert.equal(t.$('#hintDlg'), null);
});

test('Nykomlings förklaring kostar inget', () => {
  const t = atLevel('intro');
  t.g('next()');
  t.$('.bulb').click();
  assert.doesNotMatch(t.$('#hintDlg').textContent, /Tipset kostar/);
  assert.equal(t.g('S.usedHint'), false);
});

test('Ingen lampa på frågor utan tips eller efter svar', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 'v');
  assert.equal(t.$('.bulb'), null);
  until(t, p => p.skill === 't');
  answer(t, true);
  assert.equal(t.$('.bulb'), null);
});
