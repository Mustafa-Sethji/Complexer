const test = require('node:test');
const assert = require('node:assert');
const {
  Complexity,
  O_1,
  O_LOG_N,
  O_LOG_LOG_N,
  O_SQRT_N,
  O_N,
  O_N_LOG_N,
  O_N2,
  O_N3,
  O_2N,
  O_PHI_N
} = require('../src/complexity/symbolic');

test('Symbolic Big-O representation and formatting', () => {
  assert.strictEqual(O_1.toBigO(), 'O(1)');
  assert.strictEqual(O_LOG_N.toBigO(), 'O(log n)');
  assert.strictEqual(O_LOG_LOG_N.toBigO(), 'O(log log n)');
  assert.strictEqual(O_SQRT_N.toBigO(), 'O(sqrt(n))');
  assert.strictEqual(O_N.toBigO(), 'O(n)');
  assert.strictEqual(O_N_LOG_N.toBigO(), 'O(n log n)');
  assert.strictEqual(O_N2.toBigO(), 'O(n^2)');
  assert.strictEqual(O_N3.toBigO(), 'O(n^3)');
  assert.strictEqual(O_2N.toBigO(), 'O(2^n)');
  assert.strictEqual(O_PHI_N.toBigO(), 'O(phi^n)');
});

test('Symbolic multiplication', () => {
  assert.strictEqual(O_N.multiply(O_1).toBigO(), 'O(n)');
  assert.strictEqual(O_N.multiply(O_N).toBigO(), 'O(n^2)');
  assert.strictEqual(O_N.multiply(O_LOG_N).toBigO(), 'O(n log n)');
  assert.strictEqual(O_N2.multiply(O_N).toBigO(), 'O(n^3)');
  assert.strictEqual(Complexity.of('n', 1).multiply(Complexity.of('m', 1)).toBigO(), 'O(n*m)');
});

test('Symbolic addition & dominance', () => {
  assert.strictEqual(O_N2.add(O_N).toBigO(), 'O(n^2)');
  assert.strictEqual(O_N.add(O_LOG_N).toBigO(), 'O(n)');
  assert.strictEqual(O_N_LOG_N.add(O_N).toBigO(), 'O(n log n)');
  assert.strictEqual(O_2N.add(O_N3).toBigO(), 'O(2^n)');
  assert.strictEqual(O_N.add(O_1).toBigO(), 'O(n)');
  // Multivariable independent sum
  assert.strictEqual(Complexity.of('n', 1).add(Complexity.of('m', 1)).toBigO(), 'O(n + m)');
});

test('Symbolic max', () => {
  assert.strictEqual(O_N.max(O_N2).toBigO(), 'O(n^2)');
  assert.strictEqual(O_LOG_N.max(O_1).toBigO(), 'O(log n)');
});
