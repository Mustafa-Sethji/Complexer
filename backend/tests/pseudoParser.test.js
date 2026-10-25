const test = require('node:test');
const assert = require('node:assert');
const { parsePseudocode, SyntaxErrorWithLine } = require('../src/parsers/pseudoParser');
const { NodeType } = require('../src/ir');

test('Parses countPairs example pseudocode into Common IR', () => {
  const code = `
FUNCTION countPairs(A, n)
  DECLARE count = 0
  FOR i FROM 1 TO n DO
    FOR j FROM i TO n DO
      count = count + 1
    END FOR
  END FOR
  RETURN count
END FUNCTION
  `;

  const ir = parsePseudocode(code);
  assert.strictEqual(ir.length, 1);
  const fn = ir[0];
  assert.strictEqual(fn.type, NodeType.FUNCTION);
  assert.strictEqual(fn.name, 'countPairs');
  assert.deepStrictEqual(fn.params, ['A', 'n']);
  assert.strictEqual(fn.body.length, 3); // DECLARE, FOR, RETURN
  const outerFor = fn.body[1];
  assert.strictEqual(outerFor.type, NodeType.LOOP);
  assert.strictEqual(outerFor.meta.iterator, 'i');
  assert.strictEqual(outerFor.meta.from, '1');
  assert.strictEqual(outerFor.meta.to, 'n');
  assert.strictEqual(outerFor.body.length, 1);
  const innerFor = outerFor.body[0];
  assert.strictEqual(innerFor.type, NodeType.LOOP);
  assert.strictEqual(innerFor.meta.iterator, 'j');
  assert.strictEqual(innerFor.meta.from, 'i');
  assert.strictEqual(innerFor.meta.to, 'n');
});

test('Parses STEP forms: MULTIPLY BY 2 and DIVIDE BY 2', () => {
  const code = `
FUNCTION logLoop(n)
  FOR i FROM 1 TO n STEP MULTIPLY BY 2 DO
    CALL print(i)
  END FOR
  FOR j FROM n TO 1 STEP DIVIDE BY 2 DO
    CALL print(j)
  END FOR
END FUNCTION
  `;

  const ir = parsePseudocode(code);
  const fn = ir[0];
  assert.strictEqual(fn.body[0].meta.step.type, 'multiply');
  assert.strictEqual(fn.body[0].meta.step.value, '2');
  assert.strictEqual(fn.body[1].meta.step.type, 'divide');
  assert.strictEqual(fn.body[1].meta.step.value, '2');
});

test('Parses arrays and matrices', () => {
  const code = `
FUNCTION testStorage(n, m)
  DECLARE ARRAY A[n]
  DECLARE MATRIX M[n][m]
END FUNCTION
  `;

  const ir = parsePseudocode(code);
  const fn = ir[0];
  assert.strictEqual(fn.body[0].kind, 'array');
  assert.deepStrictEqual(fn.body[0].dimensions, ['n']);
  assert.strictEqual(fn.body[1].kind, 'matrix');
  assert.deepStrictEqual(fn.body[1].dimensions, ['n', 'm']);
});

test('Reports line-numbered syntax error on missing END keyword', () => {
  const badCode = `
FUNCTION broken(n)
  FOR i FROM 1 TO n DO
    CALL doSomething(i)
END FUNCTION
  `;

  assert.throws(() => {
    parsePseudocode(badCode);
  }, (err) => {
    return err instanceof SyntaxErrorWithLine && err.message.includes('Line');
  });
});
