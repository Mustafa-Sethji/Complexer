const test = require('node:test');
const assert = require('node:assert');
const { RecurrenceSolver } = require('../src/solver/recurrenceSolver');
const { O_1, O_N, O_N2, Complexity } = require('../src/complexity/symbolic');

test('1. Binary search: T(n) = T(n/2) + O(1) -> O(log n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 1, type: 'divisive', b: 2 }],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(log n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(log n)');
  assert.match(result.method, /Master Theorem/);
});

test('2. Merge sort: T(n) = 2T(n/2) + O(n) -> O(n log n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 2, type: 'divisive', b: 2 }],
    work: O_N
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n log n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(log n)');
  assert.match(result.method, /Master Theorem/);
});

test('3. Quicksort worst case: T(n) = T(n-1) + O(n) -> O(n^2)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 1, type: 'subtractive', c: 1 }],
    work: O_N
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n^2)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(n)');
  assert.strictEqual(result.method, 'Subtractive Linear');
});

test('4. Factorial: T(n) = T(n-1) + O(1) -> O(n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 1, type: 'subtractive', c: 1 }],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(n)');
  assert.strictEqual(result.method, 'Subtractive Linear');
});

test('5. Fibonacci (naive): T(n) = T(n-1) + T(n-2) + O(1) -> O(phi^n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [
      { a: 1, type: 'subtractive', c: 1 },
      { a: 1, type: 'subtractive', c: 2 }
    ],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(phi^n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(n)');
  assert.match(result.explanation, /phi/);
});

test('6. Fibonacci (memoized): O(n) states * O(1) work -> O(n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [
      { a: 1, type: 'subtractive', c: 1 },
      { a: 1, type: 'subtractive', c: 2 }
    ],
    work: O_1,
    isMemoized: true,
    memoStates: O_N
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(n)');
  assert.match(result.method, /Memoization/);
});

test('7. Tower of Hanoi: T(n) = 2T(n-1) + O(1) -> O(2^n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 2, type: 'subtractive', c: 1 }],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(2^n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(n)');
  assert.strictEqual(result.method, 'Subtractive Multi-Call');
});

test('8. Power by squaring: T(n) = T(n/2) + O(1) -> O(log n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 1, type: 'divisive', b: 2 }],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(log n)');
});

test('9. Strassen matrix multiplication: T(n) = 7T(n/2) + O(n^2) -> O(n^2.81)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 7, type: 'divisive', b: 2 }],
    work: O_N2
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n^2.81)');
  assert.match(result.method, /Master Theorem \(Case 1\)/);
});

test('10. Multi-subtractive: T(n) = 2T(n-1) + 1 -> O(2^n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 2, type: 'subtractive', c: 1 }],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(2^n)');
});

test('11. Akra-Bazzi: T(n) = T(n/2) + T(n/3) + n -> O(n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [
      { a: 1, type: 'divisive', b: 2 },
      { a: 1, type: 'divisive', b: 3 }
    ],
    work: O_N
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n)');
  assert.strictEqual(result.method, 'Akra-Bazzi Method');
});

test('12. Square-root recurrence: T(n) = T(sqrt n) + 1 -> O(log log n)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 1, type: 'sqrt' }],
    work: O_1
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(log log n)');
  assert.strictEqual(result.spaceComplexity.toBigO(), 'O(log log n)');
  assert.strictEqual(result.method, 'Square-root Recurrence');
});

test('13. Master Theorem Case 3: T(n) = 2T(n/2) + O(n^2) -> O(n^2)', () => {
  const result = RecurrenceSolver.solve({
    calls: [{ a: 2, type: 'divisive', b: 2 }],
    work: O_N2
  });
  assert.strictEqual(result.status, 'solved');
  assert.strictEqual(result.timeComplexity.toBigO(), 'O(n^2)');
  assert.match(result.method, /Master Theorem \(Case 3\)/);
});
