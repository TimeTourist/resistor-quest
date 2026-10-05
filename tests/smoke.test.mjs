import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';

for (const lv of ['intro', 'easy', 'medium', 'tc', 'hard']) {
  test(`${lv}: 40 frågor ritas utan fel`, () => {
    const t = atLevel(lv);
    for (let i = 0; i < 40; i++) { t.g('next()'); assert.ok(t.$('#q button'), 'kortet har knappar'); }
    assert.deepEqual(t.errors, []);
  });
}

test('Eldprovet: startkortet visas', () => {
  const t = atLevel('ultra');
  assert.ok(t.$('#examStart'));
});
