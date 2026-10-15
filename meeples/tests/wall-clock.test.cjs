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
  ['2026-10-15T08:30:00Z', '09:30 BST'],
  ['2026-10-25T00:59:00Z', '01:59 BST'], // last minute of BST
  ['2026-10-25T01:00:00Z', '01:00 GMT'], // clocks go back
  ['2026-10-26T09:00:00Z', '09:00 GMT'],
  ['2026-12-25T23:05:00Z', '23:05 GMT'],
  ['2027-03-28T00:59:00Z', '00:59 GMT'],
  ['2027-03-28T01:00:00Z', '02:00 BST']  // clocks go forward
]) {
  test(time, () => {
    const reading = runtime.clock(time);
    assert.equal(reading.time + ' ' + reading.zone, expected);
  });
}
