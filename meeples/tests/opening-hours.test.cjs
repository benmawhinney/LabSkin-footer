const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {
  window: {},
  document: { readyState: 'loading', addEventListener() {} },
  Intl, Date, Math, performance
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/labskin-footer.js'), 'utf8'), context);
const runtime = context.window.LabskinFooter;

for (const [time, expected] of [
  ['2026-10-14T08:59:00+01:00', false],
  ['2026-10-14T09:00:00+01:00', true],
  ['2026-10-14T12:30:00+01:00', true],
  ['2026-10-14T17:29:00+01:00', true],
  ['2026-10-14T17:30:00+01:00', false],
  ['2026-10-14T17:40:00+01:00', false],
  ['2026-10-14T22:00:00+01:00', false],
  ['2026-10-17T11:00:00+01:00', false],
  ['2026-11-04T08:59:00Z', false],
  ['2026-11-04T09:00:00Z', true],
  ['2026-11-04T17:30:00Z', false]
]) {
  test(time, () => assert.equal(runtime.isOpen(time), expected));
}

test('configurable hours', () => {
  assert.equal(runtime.isOpen('2026-10-14T09:00:00+01:00', 'Mon-Fri 10:00-16:00'), false);
  assert.equal(runtime.isOpen('2026-10-14T10:00:00+01:00', 'Mon-Fri 10:00-16:00'), true);
});

test('reject invalid or reversed schedules', () => {
  assert.throws(() => runtime.isOpen('2026-10-14T12:00:00Z', 'Mon-Fri 24:00-25:00'));
  assert.throws(() => runtime.isOpen('2026-10-14T12:00:00Z', 'Mon-Fri 17:30-09:00'));
});