/**
 * Pseudocode Tokenizer and Parser
 * Supports Arrays, Matrix, Stack, Queue and Priority Queue
 */

const {
  createFunction,
  createLoop,
  createIfElse,
  createCall,
  createDeclare,
  createReturn,
  createAssign,
  createExpression
} = require('../ir');

class SyntaxErrorWithLine extends Error {
  constructor(message, line, col = 1) {
    super(`Line ${line}: ${message}`);
    this.name = 'SyntaxErrorWithLine';
    this.line = line;
    this.col = col;
  }
}

const KEYWORDS = new Set([
  'FUNCTION', 'END', 'DECLARE', 'ARRAY', 'MATRIX',
  'FOR', 'FROM', 'TO', 'STEP', 'MULTIPLY', 'BY',
  'DIVIDE', 'DO', 'EACH', 'IN',
  'WHILE', 'REPEAT', 'UNTIL',
  'IF', 'THEN', 'ELSE',
  'CALL', 'RETURN',
  'SORT', 'BINARY_SEARCH', 'SEARCH', 'REVERSE',
  'PUSH', 'POP', 'TOP', 'FRONT', 'EMPTY', 'SIZE',
  'ENQUEUE', 'DEQUEUE',
  'INSERT', 'LOOKUP',
  'STACK', 'QUEUE', 'PRIORITY_QUEUE'
]);

class Tokenizer {
  constructor(code) {
    this.code = code;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.tokens = [];
  }

  tokenize() {
    while (this.pos < this.code.length) {
      const ch = this.code[this.pos];

      if (ch === '\n') {
        this.pos++;
        this.line++;
        this.col = 1;
        continue;
      }

      if (/\s/.test(ch)) {
        this.pos++;
        this.col++;
        continue;
      }

      if (ch === '/' && this.code[this.pos + 1] === '/') {
        while (
          this.pos < this.code.length &&
          this.code[this.pos] !== '\n'
        ) {
          this.pos++;
        }
        continue;
      }

      const startLine = this.line;
      const startCol = this.col;

      const two = this.code.slice(this.pos, this.pos + 2);

      if (
        ['<=', '>=', '==', '!=', '+=', '-=', '*=', '/=']
          .includes(two)
      ) {
        this.tokens.push({
          type: 'OP',
          value: two,
          line: startLine,
          col: startCol
        });

        this.pos += 2;
        this.col += 2;
        continue;
      }

      if ('=+-*/<>()[],.!'.includes(ch)) {
        this.tokens.push({
          type: 'PUNCT',
          value: ch,
          line: startLine,
          col: startCol
        });

        this.pos++;
        this.col++;
        continue;
      }

      if (/[0-9]/.test(ch)) {
        let numStr = '';

        while (
          this.pos < this.code.length &&
          /[0-9.]/.test(this.code[this.pos])
        ) {
          numStr += this.code[this.pos++];
          this.col++;
        }

        this.tokens.push({
          type: 'NUMBER',
          value: numStr,
          line: startLine,
          col: startCol
        });

        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';

        while (
          this.pos < this.code.length &&
          /[a-zA-Z0-9_]/.test(this.code[this.pos])
        ) {
          ident += this.code[this.pos++];
          this.col++;
        }

        const upper = ident.toUpperCase();

        if (KEYWORDS.has(upper)) {
          this.tokens.push({
            type: 'KEYWORD',
            value: upper,
            raw: ident,
            line: startLine,
            col: startCol
          });
        } else {
          this.tokens.push({
            type: 'IDENT',
            value: ident,
            line: startLine,
            col: startCol
          });
        }

        continue;
      }

      throw new SyntaxErrorWithLine(
        `Unexpected character '${ch}'`,
        this.line,
        this.col
      );
    }

    this.tokens.push({
      type: 'EOF',
      value: '',
      line: this.line,
      col: this.col
    });

    return this.tokens;
  }
}

class PseudoParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.idx = 0;
  }

  peek() {
    return this.tokens[this.idx] || {
      type: 'EOF',
      value: '',
      line: 0
    };
  }

  consume() {
    return this.tokens[this.idx++];
  }

  matchKeyword(kw) {
    const t = this.peek();
    return t.type === 'KEYWORD' && t.value === kw;
  }

  matchPunct(p) {
    const t = this.peek();

    return (
      (t.type === 'PUNCT' || t.type === 'OP') &&
      t.value === p
    );
  }

  expectKeyword(kw, ruleHint = '') {
    const t = this.peek();

    if (t.type === 'KEYWORD' && t.value === kw) {
      return this.consume();
    }

    const hint = ruleHint ? ` (Rule: ${ruleHint})` : '';

    throw new SyntaxErrorWithLine(
      `Expected keyword '${kw}', got '${t.value || t.type}'${hint}`,
      t.line,
      t.col
    );
  }

  expectPunct(p, ruleHint = '') {
    const t = this.peek();

    if (
      (t.type === 'PUNCT' || t.type === 'OP') &&
      t.value === p
    ) {
      return this.consume();
    }

    const hint = ruleHint ? ` (Rule: ${ruleHint})` : '';

    throw new SyntaxErrorWithLine(
      `Expected '${p}', got '${t.value || t.type}'${hint}`,
      t.line,
      t.col
    );
  }

  expectIdent(ruleHint = '') {
    const t = this.peek();

    if (t.type === 'IDENT') {
      return this.consume().value;
    }

    const hint = ruleHint ? ` (Rule: ${ruleHint})` : '';

    throw new SyntaxErrorWithLine(
      `Expected identifier, got '${t.value || t.type}'${hint}`,
      t.line,
      t.col
    );
  }

  parse() {
    const functions = [];
    const statements = [];

    while (this.peek().type !== 'EOF') {
      if (this.matchKeyword('FUNCTION')) {
        functions.push(this.parseFunction());
      } else {
        statements.push(this.parseStatement());
      }
    }

    if (functions.length === 0 && statements.length > 0) {
      const firstLoc = statements[0]?.loc || { line: 1 };

      return [
        createFunction('main', ['n'], statements, firstLoc)
      ];
    }

    return functions;
  }

  parseFunction() {
    const startTok = this.expectKeyword(
      'FUNCTION',
      "'FUNCTION name(params)'"
    );

    const name = this.expectIdent(
      "'FUNCTION name(params)'"
    );

    this.expectPunct('(');

    const params = [];

    if (!this.matchPunct(')')) {
      params.push(this.expectIdent('parameter list'));

      while (this.matchPunct(',')) {
        this.consume();
        params.push(this.expectIdent('parameter list'));
      }
    }

    this.expectPunct(')');

    const body = [];

    while (this.peek().type !== 'EOF') {
      if (this.matchKeyword('END')) {
        const nextTok = this.tokens[this.idx + 1];

        if (
          nextTok &&
          nextTok.type === 'KEYWORD' &&
          nextTok.value === 'FUNCTION'
        ) {
          break;
        }
      }

      body.push(this.parseStatement());
    }

    this.expectKeyword('END');
    this.expectKeyword('FUNCTION');

    return createFunction(
      name,
      params,
      body,
      { line: startTok.line }
    );
  }

  parseStatement() {
    const t = this.peek();

    if (t.type === 'KEYWORD') {
      switch (t.value) {
        case 'DECLARE':
          return this.parseDeclare();

        case 'FOR':
          return this.parseFor();

        case 'WHILE':
          return this.parseWhile();

        case 'REPEAT':
          return this.parseRepeat();

        case 'IF':
          return this.parseIf();

        case 'CALL':
          return this.parseCallStatement();

        case 'RETURN':
          return this.parseReturn();

        case 'SORT':
        case 'BINARY_SEARCH':
        case 'SEARCH':
        case 'REVERSE':

        // Stack
        case 'PUSH':
        case 'POP':
        case 'TOP':

        // Queue
        case 'ENQUEUE':
        case 'DEQUEUE':
        case 'FRONT':

        // Common
        case 'EMPTY':
        case 'SIZE':

        case 'INSERT':
        case 'LOOKUP':
          return this.parseBuiltinStatement();
      }
    }

    if (t.type === 'IDENT') {
      return this.parseAssignOrCall();
    }

    throw new SyntaxErrorWithLine(
      `Unexpected token '${t.value || t.type}' at start of statement`,
      t.line,
      t.col
    );
  }

  parseDeclare() {
    const startTok = this.expectKeyword('DECLARE');

    // Array declaration
    if (this.matchKeyword('ARRAY')) {
      this.consume();

      const name = this.expectIdent();

      this.expectPunct('[');

      const sizeExpr = this.parseExpressionString([']']);

      this.expectPunct(']');

      return createDeclare({
        name,
        kind: 'array',
        dimensions: [sizeExpr],
        loc: { line: startTok.line }
      });
    }

    // Matrix declaration
    if (this.matchKeyword('MATRIX')) {
      this.consume();

      const name = this.expectIdent();

      this.expectPunct('[');
      const d1 = this.parseExpressionString([']']);
      this.expectPunct(']');

      this.expectPunct('[');
      const d2 = this.parseExpressionString([']']);
      this.expectPunct(']');

      return createDeclare({
        name,
        kind: 'matrix',
        dimensions: [d1, d2],
        loc: { line: startTok.line }
      });
    }

    // Stack declaration
    if (this.matchKeyword('STACK')) {
      this.consume();

      const name = this.expectIdent();

      return createDeclare({
        name,
        kind: 'stack',
        loc: { line: startTok.line }
      });
    }

    // Queue declaration
    if (this.matchKeyword('QUEUE')) {
      this.consume();

      const name = this.expectIdent();

      return createDeclare({
        name,
        kind: 'queue',
        loc: { line: startTok.line }
      });
    }

    // Priority queue declaration
    if (this.matchKeyword('PRIORITY_QUEUE')) {
      this.consume();

      const name = this.expectIdent();

      return createDeclare({
        name,
        kind: 'priority_queue',
        loc: { line: startTok.line }
      });
    }

    // Scalar declaration
    const name = this.expectIdent();

    let initialValue = null;

    if (this.matchPunct('=')) {
      this.consume();
      initialValue = this.parseExpressionString();
    }

    return createDeclare({
      name,
      kind: 'scalar',
      initialValue,
      loc: { line: startTok.line }
    });
  }

  parseFor() {
    const startTok = this.expectKeyword('FOR');

    // FOR EACH item IN container DO
    if (
      this.matchKeyword('EACH') ||
      (
        this.peek().type === 'IDENT' &&
        this.tokens[this.idx + 1]?.value === 'IN'
      )
    ) {
      if (this.matchKeyword('EACH')) {
        this.consume();
      }

      const iterator = this.expectIdent();

      this.expectKeyword('IN');

      const container = this.parseExpressionString(['DO']).trim();

      this.expectKeyword('DO');

      const body = [];

      while (this.peek().type !== 'EOF') {
        if (this.matchKeyword('END')) {
          const nextTok = this.tokens[this.idx + 1];

          if (
            nextTok &&
            nextTok.type === 'KEYWORD' &&
            nextTok.value === 'FOR'
          ) {
            break;
          }
        }

        body.push(this.parseStatement());
      }

      this.expectKeyword('END');
      this.expectKeyword('FOR');

      const isGraphEdgeLoop =
        /(?:adj|graph|edges|g)\s*\[/i.test(container) ||
        /adj|graph/i.test(container);

      return createLoop({
        loopType: 'for',
        init: '0',
        condition: container,
        update: '++it',
        body,
        loc: { line: startTok.line },
        meta: {
          iterator,
          from: '0',
          to: container,
          isGraphEdgeLoop,
          step: {
            type: 'increment',
            value: 1
          }
        }
      });
    }

    const iterator = this.expectIdent();

    this.expectKeyword('FROM');

    const fromExpr = this.parseExpressionString(['TO']);

    this.expectKeyword('TO');

    let stepInfo = {
      type: 'increment',
      value: 1
    };

    let toExpr = this.parseExpressionString([
      'STEP',
      'DO'
    ]).trim();

    let boundType = 'linear';

    const sqrtMatch = toExpr.match(/SQRT\s*\((.+)\)/i);

    if (sqrtMatch) {
      toExpr = sqrtMatch[1].trim();
      boundType = 'sqrt';
    }

    if (this.matchKeyword('STEP')) {
      this.consume();

      if (this.matchKeyword('MULTIPLY')) {
        this.consume();

        this.expectKeyword('BY');

        const val = this.parseExpressionString(['DO']).trim();

        if (val === iterator) {
          stepInfo = {
            type: 'square',
            value: 2
          };
        } else {
          stepInfo = {
            type: 'multiply',
            value: val
          };
        }
      } else if (this.matchKeyword('DIVIDE')) {
        this.consume();

        this.expectKeyword('BY');

        const val = this.parseExpressionString(['DO']).trim();

        stepInfo = {
          type: 'divide',
          value: val
        };
      } else {
        const stepVal = this.parseExpressionString(['DO']).trim();

        if (
          stepVal === iterator ||
          stepVal === 'SQUARE'
        ) {
          stepInfo = {
            type: 'square',
            value: 2
          };
        } else {
          stepInfo = {
            type: 'step',
            value: stepVal
          };
        }
      }
    }

    this.expectKeyword('DO');

    const body = [];

    while (this.peek().type !== 'EOF') {
      if (this.matchKeyword('END')) {
        const nextTok = this.tokens[this.idx + 1];

        if (
          nextTok &&
          nextTok.type === 'KEYWORD' &&
          nextTok.value === 'FOR'
        ) {
          break;
        }
      }

      body.push(this.parseStatement());
    }

    this.expectKeyword('END');
    this.expectKeyword('FOR');

    return createLoop({
      loopType: 'for',
      init: `${iterator} = ${fromExpr}`,
      condition: `${iterator} <= ${toExpr}`,
      update:
        stepInfo.type === 'multiply'
          ? `${iterator} *= ${stepInfo.value}`
          : stepInfo.type === 'divide'
          ? `${iterator} /= ${stepInfo.value}`
          : `${iterator} += ${stepInfo.value}`,
      body,
      loc: { line: startTok.line },
      meta: {
        iterator,
        from: fromExpr.trim(),
        to: toExpr.trim(),
        step: stepInfo,
        boundType
      }
    });
  }

  parseWhile() {
    const startTok = this.expectKeyword('WHILE');

    const condition = this.parseExpressionString(['DO']);

    this.expectKeyword('DO');

    const body = [];

    while (this.peek().type !== 'EOF') {
      if (this.matchKeyword('END')) {
        const nextTok = this.tokens[this.idx + 1];

        if (
          nextTok &&
          nextTok.type === 'KEYWORD' &&
          nextTok.value === 'WHILE'
        ) {
          break;
        }
      }

      body.push(this.parseStatement());
    }

    this.expectKeyword('END');
    this.expectKeyword('WHILE');

    return createLoop({
      loopType: 'while',
      condition: condition.trim(),
      body,
      loc: { line: startTok.line }
    });
  }

  parseRepeat() {
    const startTok = this.expectKeyword('REPEAT');

    const body = [];

    while (this.peek().type !== 'EOF') {
      if (this.matchKeyword('UNTIL')) {
        break;
      }

      body.push(this.parseStatement());
    }

    this.expectKeyword('UNTIL');

    const condition = this.parseExpressionString();

    return createLoop({
      loopType: 'repeat',
      condition: condition.trim(),
      body,
      loc: { line: startTok.line }
    });
  }

  parseIf() {
    const startTok = this.expectKeyword('IF');

    const condition = this.parseExpressionString(['THEN']);

    this.expectKeyword('THEN');

    const thenBranch = [];
    const elseIfBranches = [];
    let elseBranch = [];

    while (this.peek().type !== 'EOF') {
      if (this.matchKeyword('ELSE')) {
        const nextTok = this.tokens[this.idx + 1];

        if (
          nextTok &&
          nextTok.type === 'KEYWORD' &&
          nextTok.value === 'IF'
        ) {
          this.consume();
          this.consume();

          const elseIfCond =
            this.parseExpressionString(['THEN']);

          this.expectKeyword('THEN');

          const elseIfBody = [];

          while (
            this.peek().type !== 'EOF' &&
            !this.matchKeyword('ELSE') &&
            !this.matchKeyword('END')
          ) {
            elseIfBody.push(this.parseStatement());
          }

          elseIfBranches.push({
            condition: elseIfCond.trim(),
            body: elseIfBody
          });

          continue;
        } else {
          this.consume();

          while (this.peek().type !== 'EOF') {
            if (this.matchKeyword('END')) {
              break;
            }

            elseBranch.push(this.parseStatement());
          }

          break;
        }
      }

      if (this.matchKeyword('END')) {
        const nextTok = this.tokens[this.idx + 1];

        if (
          nextTok &&
          nextTok.type === 'KEYWORD' &&
          nextTok.value === 'IF'
        ) {
          break;
        }
      }

      thenBranch.push(this.parseStatement());
    }

    this.expectKeyword('END');
    this.expectKeyword('IF');

    return createIfElse({
      condition: condition.trim(),
      thenBranch,
      elseIfBranches,
      elseBranch,
      loc: { line: startTok.line }
    });
  }

  parseCallStatement() {
    const startTok = this.expectKeyword('CALL');

    let callee = this.expectIdent();
    let isMethod = false;
    let object = null;

    // Method-style call: CALL q.push(x), CALL st.pop(), CALL pq.push(x)
    // Keywords like push/pop/empty are case-insensitive keywords in the
    // tokenizer, so accept either an identifier or a keyword after the dot.
    while (this.matchPunct('.')) {
      this.consume();

      const methodTok = this.consume();

      if (!methodTok || (methodTok.type !== 'IDENT' && methodTok.type !== 'KEYWORD')) {
        throw new SyntaxErrorWithLine(
          "Expected method name after '.'",
          startTok.line,
          methodTok ? methodTok.col : 0
        );
      }

      object = object ? `${object}.${callee}` : callee;
      callee = String(methodTok.raw || methodTok.value).toLowerCase();
      isMethod = true;
    }

    this.expectPunct('(');

    const args = [];

    if (!this.matchPunct(')')) {
      args.push(this.parseExpressionString([',', ')']));

      while (this.matchPunct(',')) {
        this.consume();
        args.push(this.parseExpressionString([',', ')']));
      }
    }

    this.expectPunct(')');

    return createCall({
      callee,
      args: args.map(a => a.trim()),
      isMethod,
      object,
      loc: { line: startTok.line }
    });
  }

  parseBuiltinStatement() {
    const builtinTok = this.consume();

    this.expectPunct('(');

    const args = [];

    if (!this.matchPunct(')')) {
      args.push(this.parseExpressionString([',', ')']));

      while (this.matchPunct(',')) {
        this.consume();
        args.push(this.parseExpressionString([',', ')']));
      }
    }

    this.expectPunct(')');

    return createCall({
      callee: builtinTok.value,
      args: args.map(a => a.trim()),
      loc: { line: builtinTok.line }
    });
  }

  parseReturn() {
    const startTok = this.expectKeyword('RETURN');

    const val = this.parseExpressionString();

    return createReturn({
      value: val.trim(),
      loc: { line: startTok.line }
    });
  }

  parseAssignOrCall() {
    const startTok = this.peek();

    let target = this.consume().value;

    // Array indexing
    while (this.matchPunct('[')) {
      this.consume();

      const idx = this.parseExpressionString([']']);

      this.expectPunct(']');

      target += `[${idx.trim()}]`;
    }

    // Assignment
    if (this.matchPunct('=')) {
      this.consume();

      const val = this.parseExpressionString();

      return createAssign({
        target,
        value: val.trim(),
        loc: { line: startTok.line }
      });
    }

    // Function call
    if (this.matchPunct('(')) {
      this.consume();

      const args = [];

      if (!this.matchPunct(')')) {
        args.push(this.parseExpressionString([',', ')']));

        while (this.matchPunct(',')) {
          this.consume();
          args.push(this.parseExpressionString([',', ')']));
        }
      }

      this.expectPunct(')');

      return createCall({
        callee: target,
        args: args.map(a => a.trim()),
        loc: { line: startTok.line }
      });
    }

    return createExpression({
      expr: target,
      loc: { line: startTok.line }
    });
  }

  parseExpressionString(stopTokens = []) {
    let expr = '';

    const stopSet = new Set(stopTokens);

    const statementStarters = new Set([
      'FUNCTION',
      'DECLARE',
      'FOR',
      'WHILE',
      'REPEAT',
      'IF',
      'ELSE',
      'END',
      'RETURN',
      'UNTIL',
      'CALL',
      'SORT',
      'BINARY_SEARCH',
      'SEARCH',
      'REVERSE',
      'PUSH',
      'POP',
      'TOP',
      'FRONT',
      'EMPTY',
      'SIZE',
      'ENQUEUE',
      'DEQUEUE',
      'INSERT',
      'LOOKUP'
    ]);

    let depth = 0;
    let previousLine = null;

    while (this.peek().type !== 'EOF') {
      const t = this.peek();

      // Stop at required delimiter
      if (depth === 0 && stopSet.has(t.value)) {
        break;
      }

      // Stop at next statement on a new line
      if (
        depth === 0 &&
        previousLine !== null &&
        t.line > previousLine &&
        t.type === 'KEYWORD' &&
        statementStarters.has(t.value)
      ) {
        break;
      }

      // Stop at block terminators
      if (
        depth === 0 &&
        t.type === 'KEYWORD' &&
        ['END', 'ELSE', 'UNTIL'].includes(t.value)
      ) {
        break;
      }

      if (t.value === '(' || t.value === '[') {
        depth++;
      }

      if (t.value === ')' || t.value === ']') {
        if (depth === 0) {
          break;
        }

        depth--;
      }

      this.consume();

      expr += (expr ? ' ' : '') + (t.raw || t.value);

      previousLine = t.line;
    }

    return expr;
  }
}

function parsePseudocode(code) {
  const tokenizer = new Tokenizer(code);
  const tokens = tokenizer.tokenize();
  const parser = new PseudoParser(tokens);

  return parser.parse();
}

module.exports = {
  parsePseudocode,
  SyntaxErrorWithLine
};