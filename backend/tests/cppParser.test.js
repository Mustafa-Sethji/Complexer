const test = require('node:test');
const assert = require('node:assert');
const { parseCpp } = require('../src/parsers/cppParser');
const { NodeType } = require('../src/ir');

test('Parses nested C++ for loops', () => {
  const code = `
void countPairs(int n) {
  int count = 0;
  for (int i = 0; i < n; i++) {
    for (int j = i; j < n; j++) {
      count++;
    }
  }
}
  `;

  const ir = parseCpp(code);
  assert.strictEqual(ir.length, 1);
  const fn = ir[0];
  assert.strictEqual(fn.name, 'countPairs');
  assert.deepStrictEqual(fn.params, ['n']);
  const outerLoop = fn.body.find(s => s.type === NodeType.LOOP);
  assert.ok(outerLoop);
  assert.strictEqual(outerLoop.meta.iterator, 'i');
  assert.strictEqual(outerLoop.meta.to, 'n');
  const innerLoop = outerLoop.body.find(s => s.type === NodeType.LOOP);
  assert.ok(innerLoop);
  assert.strictEqual(innerLoop.meta.iterator, 'j');
  assert.strictEqual(innerLoop.meta.from, 'i');
  assert.strictEqual(innerLoop.meta.to, 'n');
});

test('Parses C++ std::sort and vector allocations', () => {
  const code = `
void process(int n) {
  std::vector<int> a(n);
  std::sort(a.begin(), a.end());
}
  `;

  const ir = parseCpp(code);
  const fn = ir[0];
  const decl = fn.body.find(s => s.type === NodeType.DECLARE);
  assert.ok(decl);
  assert.strictEqual(decl.name, 'a');
  assert.deepStrictEqual(decl.dimensions, ['n']);

  const call = fn.body.find(s => s.type === NodeType.CALL);
  assert.ok(call);
  assert.strictEqual(call.callee, 'sort');
});

test('Parses logarithmic updates: i *= 2 and i /= 2', () => {
  const code = `
void logOps(int n) {
  for (int i = 1; i < n; i *= 2) {}
  for (int j = n; j > 0; j /= 2) {}
}
  `;

  const ir = parseCpp(code);
  const fn = ir[0];
  const loop1 = fn.body[0];
  const loop2 = fn.body[1];
  assert.strictEqual(loop1.meta.step.type, 'multiply');
  assert.strictEqual(loop2.meta.step.type, 'divide');
});
