'use strict';
const { createRunner } = require('./luaRunner');
const printed = [];

const runner = createRunner(null);

const script = `
  deck.print("hello from lua", 42, true)
  local total = 0
  for i=1,5 do total = total + i end
  deck.print("sum = " .. total)
  deck.print("string upper:", string.upper("ok"))
  deck.print(_ENV ~= nil and "env present" or "no env")
`;

const t0 = Date.now();
const result = runner.run(script, { onPrint: (l) => printed.push(l) });
console.log('elapsed ms:', Date.now() - t0);
console.log('output:', JSON.stringify(result.output));
console.log('error:', result.error);

if (result.error) {
  console.error('FAILED: script produced an error');
  process.exit(1);
}
if (!printed.some((l) => l.includes('hello from lua'))) {
  console.error('FAILED: expected print captured');
  process.exit(1);
}
if (!printed.some((l) => l.includes('sum = 15'))) {
  console.error('FAILED: expected sum=15');
  process.exit(1);
}
console.log('PASSED');
process.exit(0);