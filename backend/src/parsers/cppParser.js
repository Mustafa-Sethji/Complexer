/**
 * C++ Parser using tree-sitter
 *
 * Converts C++ code into Common IR.
 * Handles:
 * - Functions and parameters
 * - For, while and do-while loops
 * - Nested loop metadata (i, j, k, etc.)
 * - Range-based loops
 * - Arrays, vectors and matrices
 * - Stack, queue, priority_queue, maps and sets
 * - Function calls and assignments
 * - If-else statements and returns
 */

const Parser = require('tree-sitter');
const Cpp = require('tree-sitter-cpp');

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

class CppParser {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Cpp);
  }

  // =========================================================
  // MAIN PARSER
  // =========================================================

  parse(code) {
    const tree = this.parser.parse(code);
    const root = tree.rootNode;

    // Report C++ syntax errors with line and column information.
    const errors = this.findErrors(root);

    if (errors.length > 0) {
      const firstErr = errors[0];

      const line = firstErr.startPosition.row + 1;
      const col = firstErr.startPosition.column + 1;

      const errorText = firstErr.text
        ? firstErr.text.slice(0, 40)
        : 'unexpected or missing token';

      const err = new Error(
        `Line ${line}, Column ${col}: C++ syntax error near '${errorText}'`
      );

      err.line = line;
      err.col = col;

      throw err;
    }

    const functions = [];
    const topLevelStatements = [];

    for (let i = 0; i < root.childCount; i++) {
      const child = root.child(i);

      if (child.type === 'function_definition') {
        functions.push(this.convertFunction(child));
      } else if (
        child.type === 'class_specifier' ||
        child.type === 'struct_specifier'
      ) {
        // class / struct with member functions (e.g. MinStack).
        // A plain struct with only fields has no methods and falls
        // through to the previous (ignored) behaviour.
        const methods = this.convertClass(child);

        if (methods.length > 0) {
          functions.push(...methods);
        } else {
          const stmt = this.convertStatement(child);

          if (Array.isArray(stmt)) {
            topLevelStatements.push(...stmt);
          } else if (stmt) {
            topLevelStatements.push(stmt);
          }
        }
      } else {
        const stmt = this.convertStatement(child);

        if (Array.isArray(stmt)) {
          topLevelStatements.push(...stmt);
        } else if (stmt) {
          topLevelStatements.push(stmt);
        }
      }
    }

    // Support code snippets without an explicit function.
    if (functions.length === 0 && topLevelStatements.length > 0) {
      return [
        createFunction(
          'main',
          this.inferTopLevelParameters(topLevelStatements),
          topLevelStatements,
          { line: 1 }
        )
      ];
    }

    return functions;
  }

  // Infer likely input-size parameters for a standalone snippet.
  // This is only a fallback; explicit function parameters are preferred.
  inferTopLevelParameters(statements) {
    const names = new Set();

    const visit = (stmt) => {
      if (!stmt || typeof stmt !== 'object') {
        return;
      }

      if (stmt.type === 'declare' && stmt.initialValue) {
        // The IR format may vary; this is only a conservative fallback.
      }

      if (Array.isArray(stmt.body)) {
        stmt.body.forEach(visit);
      }

      if (Array.isArray(stmt.thenBranch)) {
        stmt.thenBranch.forEach(visit);
      }

      if (Array.isArray(stmt.elseBranch)) {
        stmt.elseBranch.forEach(visit);
      }
    };

    statements.forEach(visit);

    return Array.from(names);
  }

  // =========================================================
  // SYNTAX ERRORS
  // =========================================================

  findErrors(node) {
    const errors = [];

    if (node.type === 'ERROR' || node.isMissing) {
      errors.push(node);
    }

    for (let i = 0; i < node.childCount; i++) {
      errors.push(...this.findErrors(node.child(i)));
    }

    return errors;
  }

  // =========================================================
  // GENERAL HELPERS
  // =========================================================

  findDescendant(node, type) {
    if (!node) {
      return null;
    }

    if (node.type === type) {
      return node;
    }

    for (let i = 0; i < node.childCount; i++) {
      const result = this.findDescendant(node.child(i), type);

      if (result) {
        return result;
      }
    }

    return null;
  }

  escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  stripOuterParentheses(value) {
    let text = String(value || '').trim();

    while (
      text.startsWith('(') &&
      text.endsWith(')')
    ) {
      let depth = 0;
      let valid = true;

      for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') {
          depth++;
        } else if (text[i] === ')') {
          depth--;
        }

        if (depth === 0 && i < text.length - 1) {
          valid = false;
          break;
        }
      }

      if (!valid || depth !== 0) {
        break;
      }

      text = text.slice(1, -1).trim();
    }

    return text;
  }

  // Extract an identifier from a declarator node.
  // Works with identifiers inside pointer/array declarators too.
  getDeclaratorName(node) {
    if (!node) {
      return null;
    }

    if (
      node.type === 'identifier' ||
      node.type === 'field_identifier'
    ) {
      return node.text;
    }

    // Prefer the declarator field if the grammar exposes it.
    const nestedDeclarator = node.childForFieldName('declarator');

    if (nestedDeclarator && nestedDeclarator !== node) {
      const result = this.getDeclaratorName(nestedDeclarator);

      if (result) {
        return result;
      }
    }

    // Otherwise search inside the declarator.
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const result = this.getDeclaratorName(child);

      if (result) {
        return result;
      }
    }

    return null;
  }

  getBodyStatements(bodyNode) {
    if (!bodyNode) {
      return [];
    }

    if (bodyNode.type === 'compound_statement') {
      return this.convertCompoundStatement(bodyNode);
    }

    const stmt = this.convertStatement(bodyNode);

    if (!stmt) {
      return [];
    }

    return Array.isArray(stmt) ? stmt : [stmt];
  }

  // =========================================================
  // FUNCTIONS
  // =========================================================

  // Extracts member functions and member containers of a class/struct.
  convertClass(node) {
    const bodyNode =
      node.childForFieldName('body') ||
      this.findDescendant(node, 'field_declaration_list');

    if (!bodyNode) {
      return [];
    }

    const nameNode = node.childForFieldName('name');
    const className = nameNode ? nameNode.text : 'Class';

    const methods = [];
    const members = [];

    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);

      if (child.type === 'function_definition') {
        const fn = this.convertFunction(child);

        fn.className = className;
        methods.push(fn);
      } else if (child.type === 'field_declaration') {
        let decl = null;

        try {
          decl = this.convertDeclaration(child);
        } catch (err) {
          decl = null;
        }

        if (decl && decl.name) {
          members.push(decl);
        }
      }
    }

    for (const method of methods) {
      method.members = members;
    }

    return methods;
  }

  convertFunction(node) {
    const line = node.startPosition.row + 1;

    let name = 'anonymous';
    const params = [];

    const declarator = this.findDescendant(
      node,
      'function_declarator'
    );

    if (declarator) {
      const nameNode =
        declarator.childForFieldName('declarator') ||
        this.findDescendant(declarator, 'identifier');

      const extractedName = this.getDeclaratorName(nameNode);

      if (extractedName) {
        name = extractedName;
      }

      const paramList =
        declarator.childForFieldName('parameters') ||
        this.findDescendant(declarator, 'parameter_list');

      if (paramList) {
        for (let i = 0; i < paramList.childCount; i++) {
          const param = paramList.child(i);

          if (param.type !== 'parameter_declaration') {
            continue;
          }

          const paramDeclarator =
            param.childForFieldName('declarator');

          const paramName = this.getDeclaratorName(
            paramDeclarator ||
            this.findDescendant(param, 'identifier')
          );

          if (paramName) {
            params.push(paramName);
          }
        }
      }
    }

    const bodyNode =
      node.childForFieldName('body') ||
      this.findDescendant(node, 'compound_statement');

    const body = bodyNode
      ? this.convertCompoundStatement(bodyNode)
      : [];

    return createFunction(name, params, body, { line });
  }

  // =========================================================
  // COMPOUND STATEMENTS
  // =========================================================

  convertCompoundStatement(node) {
    const statements = [];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);

      if (child.type === '{' || child.type === '}') {
        continue;
      }

      const stmt = this.convertStatement(child);

      if (!stmt) {
        continue;
      }

      if (Array.isArray(stmt)) {
        statements.push(...stmt);
      } else {
        statements.push(stmt);
      }
    }

    return statements;
  }

  // =========================================================
  // STATEMENT DISPATCH
  // =========================================================

  convertStatement(node) {
    if (!node) {
      return null;
    }

    const line = node.startPosition.row + 1;

    switch (node.type) {
      case 'compound_statement':
        return this.convertCompoundStatement(node);

      case 'for_statement':
        return this.convertForStatement(node);

      case 'for_range_loop':
        return this.convertForRangeLoop(node);

      case 'while_statement':
        return this.convertWhileStatement(node);

      case 'do_statement':
        return this.convertDoStatement(node);

      case 'if_statement':
        return this.convertIfStatement(node);

      case 'declaration':
        return this.convertDeclaration(node);

      case 'return_statement': {
        const valueNode = this.findDescendant(
          node,
          'expression'
        );

        // Handle returns whose expression has another node type.
        let value = valueNode ? valueNode.text : null;

        if (!value) {
          const raw = node.text
            .replace(/^return\b/, '')
            .replace(/;\s*$/, '')
            .trim();

          value = raw || null;
        }

        return createReturn({
          value,
          loc: { line }
        });
      }

      case 'expression_statement': {
        const expr = node.namedChildCount > 0
          ? node.namedChild(0)
          : node.child(0);

        if (!expr) {
          return null;
        }

        if (expr.type === 'call_expression') {
          return this.convertCallExpression(expr);
        }

        if (expr.type === 'assignment_expression') {
          return this.convertAssignmentExpression(expr);
        }

        // Preserve increments, decrements and other expressions.
        return createExpression({
          expr: expr.text,
          loc: { line }
        });
      }

      default:
        return null;
    }
  }

  // =========================================================
  // FOR LOOP
  // =========================================================

  convertForStatement(node) {
    const line = node.startPosition.row + 1;

    const initNode = node.childForFieldName('initializer');
    const condNode = node.childForFieldName('condition');
    const updateNode = node.childForFieldName('update');
    const bodyNode = node.childForFieldName('body');

    const initText = initNode
      ? initNode.text.replace(/;\s*$/, '').trim()
      : '';

    const condText = condNode
      ? condNode.text.replace(/;\s*$/, '').trim()
      : '';

    const updateText = updateNode
      ? updateNode.text.replace(/;\s*$/, '').trim()
      : '';

    const body = this.getBodyStatements(bodyNode);

    const meta = this.analyzeForLoopMeta(
      initText,
      condText,
      updateText
    );

    return createLoop({
      loopType: 'for',
      init: initText,
      condition: condText,
      update: updateText,
      body,
      loc: { line },
      meta
    });
  }

  // Analyze common loop patterns without treating iterator names
  // such as i, j and k as independent input sizes.
  analyzeForLoopMeta(init, cond, update) {
    let iterator = 'i';
    let from = '0';
    let to = 'n';

    let step = {
      type: 'increment',
      value: 1
    };

    let boundType = 'linear';

    // -------------------------------------------------------
    // 1. Find iterator and initial value.
    // Examples:
    // int i = 0
    // int j = i
    // size_t k = 1
    // i = n
    // -------------------------------------------------------

    const initMatch = init.match(
      /(?:^|,)\s*(?:(?:const\s+)?(?:unsigned\s+)?(?:long\s+long|long|short|int|char|size_t|auto|signed|unsigned)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*$/
    );

    if (initMatch) {
      iterator = initMatch[1];
      from = initMatch[2].trim();
    }

    const escapedIterator = this.escapeRegExp(iterator);

    // -------------------------------------------------------
    // 2. Find loop bound.
    // Examples:
    // i < n
    // i <= n
    // j < i
    // i > 0
    // i * i <= n
    // i <= sqrt(n)
    // -------------------------------------------------------

    if (cond) {
      const squareRegex = new RegExp(
        `\\b${escapedIterator}\\s*\\*\\s*${escapedIterator}\\s*(<=|<)\\s*(.+)`
      );

      const sqrtRegex = new RegExp(
        `\\b${escapedIterator}\\s*(<=|<)\\s*sqrt\\s*\\((.+)\\)`
      );

      const squareMatch = cond.match(squareRegex);
      const sqrtMatch = cond.match(sqrtRegex);

      if (squareMatch) {
        boundType = 'sqrt';
        to = squareMatch[2].trim();
      } else if (sqrtMatch) {
        boundType = 'sqrt';
        to = sqrtMatch[2].trim();
      } else {
        const directMatch = cond.match(
          new RegExp(
            `\\b${escapedIterator}\\s*(<|<=|>|>=)\\s*(.+)`
          )
        );

        if (directMatch) {
          to = directMatch[2].trim();
        } else {
          const reverseMatch = cond.match(
            new RegExp(
              `(.+)\\s*(<|<=|>|>=)\\s*${escapedIterator}\\b`
            )
          );

          if (reverseMatch) {
            to = reverseMatch[1].trim();
          }
        }
      }
    }

    // -------------------------------------------------------
    // 3. Analyze update expression.
    // -------------------------------------------------------

    if (update) {
      const squareUpdate =
        new RegExp(
          `\\b${escapedIterator}\\s*\\*=\\s*${escapedIterator}\\b`
        ).test(update) ||
        new RegExp(
          `\\b${escapedIterator}\\s*=\\s*${escapedIterator}\\s*\\*\\s*${escapedIterator}\\b`
        ).test(update) ||
        new RegExp(
          `\\b${escapedIterator}\\s*=\\s*pow\\s*\\(\\s*${escapedIterator}\\s*,\\s*2\\s*\\)`
        ).test(update);

      if (squareUpdate) {
        step = {
          type: 'square',
          value: 2
        };
      } else if (
        new RegExp(
          `(?:\\b${escapedIterator}\\s*(\\+\\+|--)|(?:\\+\\+|--)\\s*${escapedIterator}\\b)`
        ).test(update)
      ) {
        step = {
          type: update.includes('--') ? 'decrement' : 'increment',
          value: 1
        };
      } else {
        const multiplyMatch = update.match(
          new RegExp(
            `\\b${escapedIterator}\\s*(\\*=|<<=)\\s*(.+)`
          )
        );

        const divideMatch = update.match(
          new RegExp(
            `\\b${escapedIterator}\\s*(/=|>>=)\\s*(.+)`
          )
        );

        const multiplyAssignmentMatch = update.match(
          new RegExp(
            `\\b${escapedIterator}\\s*=\\s*${escapedIterator}\\s*\\*\\s*(.+)`
          )
        );

        const divideAssignmentMatch = update.match(
          new RegExp(
            `\\b${escapedIterator}\\s*=\\s*${escapedIterator}\\s*\\/\\s*(.+)`
          )
        );

        const addMatch = update.match(
          new RegExp(
            `\\b${escapedIterator}\\s*(\\+=|-=)\\s*(.+)`
          )
        );

        if (multiplyMatch) {
          step = {
            type: 'multiply',
            value: multiplyMatch[2].trim()
          };
        } else if (divideMatch) {
          step = {
            type: 'divide',
            value: divideMatch[2].trim()
          };
        } else if (multiplyAssignmentMatch) {
          step = {
            type: 'multiply',
            value: multiplyAssignmentMatch[1].trim()
          };
        } else if (divideAssignmentMatch) {
          step = {
            type: 'divide',
            value: divideAssignmentMatch[1].trim()
          };
        } else if (addMatch) {
          const operator = addMatch[1];
          const value = addMatch[2].trim();

          if (/^[0-9]+$/.test(value)) {
            step = {
              type: operator === '+=' ? 'increment' : 'decrement',
              value: Number(value)
            };
          } else {
            // Example: j += i
            // This is a variable-dependent step.
            step = {
              type: 'harmonic',
              value
            };
          }
        } else {
          const simpleAssignment = update.match(
            new RegExp(
              `\\b${escapedIterator}\\s*=\\s*(.+)`
            )
          );

          if (simpleAssignment) {
            const expression = simpleAssignment[1].trim();

            if (/sqrt\s*\(/.test(expression)) {
              step = {
                type: 'sqrt',
                value: 2
              };
            } else if (
              new RegExp(
                `\\b${escapedIterator}\\s*\\*`
              ).test(expression)
            ) {
              step = {
                type: 'multiply',
                value: expression
              };
            }
          }
        }
      }
    }

    // -------------------------------------------------------
    // 4. Detect common graph adjacency loops.
    // Examples:
    // adj[u].size()
    // graph[u].size()
    // -------------------------------------------------------

    const isGraphEdgeLoop =
      /(?:adj|graph|edges)\s*\[[^\]]+\]\s*\.?\s*size\s*\(/i.test(to) ||
      /(?:adj|graph|edges)\s*\[[^\]]+\]/i.test(to);

    return {
      iterator,
      from,
      to,
      step,
      boundType,
      isGraphEdgeLoop
    };
  }

  // =========================================================
  // RANGE-BASED FOR LOOP
  // =========================================================

  convertForRangeLoop(node) {
    const line = node.startPosition.row + 1;

    // Example:
    // for (auto x : vec)
    // for (int v : adj[u])

    let containerNode = node.childForFieldName('right');

    if (!containerNode) {
      containerNode = this.findDescendant(
        node,
        'initializer_list'
      );
    }

    let container = containerNode
      ? containerNode.text.trim()
      : '';

    // Fallback for tree-sitter grammar versions where the
    // right-side field is not exposed.
    if (!container) {
      const match = node.text.match(
        /for\s*\([^:]+:\s*([^)]+)\)/
      );

      if (match) {
        container = match[1].trim();
      }
    }

    if (!container) {
      container = 'n';
    }

    const bodyNode = node.childForFieldName('body');
    const body = this.getBodyStatements(bodyNode);

    const isGraphEdgeLoop =
      /(?:adj|graph|edges|g)\s*\[/i.test(container);

    return createLoop({
      loopType: 'for',
      init: '0',
      condition: container,
      update: '++it',
      body,
      loc: { line },
      meta: {
        iterator: 'item',
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

  // =========================================================
  // WHILE LOOP
  // =========================================================

  convertWhileStatement(node) {
    const line = node.startPosition.row + 1;

    const condNode = node.childForFieldName('condition');
    const bodyNode = node.childForFieldName('body');

    const condition = condNode
      ? this.stripOuterParentheses(condNode.text)
      : '';

    const body = this.getBodyStatements(bodyNode);

    return createLoop({
      loopType: 'while',
      condition,
      body,
      loc: { line }
    });
  }

  // =========================================================
  // DO-WHILE LOOP
  // =========================================================

  convertDoStatement(node) {
    const line = node.startPosition.row + 1;

    const condNode = node.childForFieldName('condition');
    const bodyNode = node.childForFieldName('body');

    const condition = condNode
      ? this.stripOuterParentheses(condNode.text)
      : '';

    const body = this.getBodyStatements(bodyNode);

    return createLoop({
      loopType: 'do_while',
      condition,
      body,
      loc: { line }
    });
  }

  // =========================================================
  // IF / ELSE
  // =========================================================

  convertIfStatement(node) {
    const line = node.startPosition.row + 1;

    const condNode = node.childForFieldName('condition');
    const thenNode = node.childForFieldName('consequence');
    const elseNode = node.childForFieldName('alternative');

    const condition = condNode
      ? this.stripOuterParentheses(condNode.text)
      : '';

    const thenBranch = this.getBodyStatements(thenNode);

    const elseIfBranches = [];
    let elseBranch = [];

    if (elseNode) {
      let actualElse = elseNode;

      if (elseNode.type === 'else_clause') {
        for (let i = 0; i < elseNode.childCount; i++) {
          const child = elseNode.child(i);

          if (
            child.type !== 'else' &&
            child.type !== '{' &&
            child.type !== '}'
          ) {
            actualElse = child;
            break;
          }
        }
      }

      if (actualElse.type === 'if_statement') {
        const nestedIf = this.convertIfStatement(actualElse);

        elseIfBranches.push({
          condition: nestedIf.condition,
          body: nestedIf.thenBranch
        });

        elseIfBranches.push(...nestedIf.elseIfBranches);

        elseBranch = nestedIf.elseBranch;
      } else {
        elseBranch = this.getBodyStatements(actualElse);
      }
    }

    return createIfElse({
      condition,
      thenBranch,
      elseIfBranches,
      elseBranch,
      loc: { line }
    });
  }

  // =========================================================
  // DECLARATIONS
  // =========================================================

  convertDeclaration(node) {
    const line = node.startPosition.row + 1;
    const text = node.text.trim();

    // -------------------------------------------------------
    // 1. Two-dimensional vector
    //
    // vector<vector<int>> matrix(n, vector<int>(m));
    // -------------------------------------------------------

    let match = text.match(
      /^(?:const\s+)?(?:std::)?vector\s*<\s*vector\s*<.+>\s*>\s*([a-zA-Z_]\w*)\s*\(\s*([^,]+)\s*,\s*vector\s*<.+>\s*\(\s*([^)]+)\s*\)\s*\)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'matrix',
        dimensions: [
          match[2].trim(),
          match[3].trim()
        ],
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 2. One-dimensional vector
    //
    // vector<int> v(n);
    // vector<bool> visited(n, false);
    // vector<int> v;
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?vector\s*<.+>\s*([a-zA-Z_]\w*)\s*(?:\(\s*([^)]*)\s*\))?\s*(?:=\s*\{[^}]*\})?\s*;?$/
    );

    if (match) {
      const name = match[1];
      const constructorArgs = match[2] || '';

      const dimension = constructorArgs
        ? constructorArgs.split(',')[0].trim()
        : null;

      return createDeclare({
        name,
        kind: 'vector',
        dimensions: dimension ? [dimension] : [],
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 3. Two-dimensional arrays
    //
    // int arr[n][m];
    // int arr[10][20];
    // -------------------------------------------------------

    match = text.match(
      /(?:[\w:]+\s*[*&]?\s+)+([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]\s*\[\s*([^\]]+)\s*\]/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'matrix',
        dimensions: [
          match[2].trim(),
          match[3].trim()
        ],
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 4. One-dimensional arrays
    //
    // int arr[n];
    // int arr[100];
    // -------------------------------------------------------

    match = text.match(
      /(?:[\w:]+\s*[*&]?\s+)+([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'array',
        dimensions: [match[2].trim()],
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 5. Priority queue
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?priority_queue\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'priority_queue',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 6. Queue
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?queue\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'queue',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 6b. Deque (treated as a queue-like container)
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?deque\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'queue',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 7. Stack
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?stack\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'stack',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 8. Unordered map
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?unordered_map\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'unordered_map',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 9. Ordered map
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?map\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'map',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 10. Unordered set
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?unordered_set\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'unordered_set',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 11. Ordered set
    // -------------------------------------------------------

    match = text.match(
      /^(?:const\s+)?(?:std::)?set\s*<[\s\S]+>\s*([a-zA-Z_]\w*)\s*(?:;|$)/
    );

    if (match) {
      return createDeclare({
        name: match[1],
        kind: 'set',
        loc: { line }
      });
    }

    // -------------------------------------------------------
    // 12. Generic scalar declaration
    //
    // int sum = 0;
    // long long ans = 0;
    // bool found = false;
    // -------------------------------------------------------

    const initDeclarator = this.findDescendant(
      node,
      'init_declarator'
    );

    if (initDeclarator) {
      const nameNode =
        initDeclarator.childForFieldName('declarator');

      const valueNode =
        initDeclarator.childForFieldName('value');

      const name = this.getDeclaratorName(nameNode);

      if (name) {
        return createDeclare({
          name,
          kind: 'scalar',
          initialValue: valueNode ? valueNode.text : null,
          loc: { line }
        });
      }
    }

    // -------------------------------------------------------
    // 13. Scalar without initialization
    //
    // int i;
    // long long ans;
    // -------------------------------------------------------

    const declarator = this.findDescendant(
      node,
      'declarator'
    );

    const name = this.getDeclaratorName(declarator);

    if (name) {
      return createDeclare({
        name,
        kind: 'scalar',
        initialValue: null,
        loc: { line }
      });
    }

    return null;
  }

  // =========================================================
  // FUNCTION CALLS
  // =========================================================

  convertCallExpression(node) {
    const line = node.startPosition.row + 1;

    const fnNode = node.childForFieldName('function');
    const argsNode = node.childForFieldName('arguments');

    let callee = fnNode ? fnNode.text : '';
    let isMethod = false;
    let object = null;

    // Examples:
    // q.push(x)
    // st.pop()
    // pq.top()
    // adj[u].push_back(v)
    if (fnNode && fnNode.type === 'field_expression') {
      isMethod = true;

      const objectNode =
        fnNode.childForFieldName('argument');

      const fieldNode =
        fnNode.childForFieldName('field');

      object = objectNode ? objectNode.text : null;
      callee = fieldNode ? fieldNode.text : callee;
    } else {
      // Normalize common standard-library names.
      callee = callee.replace(/^std::/, '');
    }

    const args = [];

    if (argsNode) {
      for (let i = 0; i < argsNode.childCount; i++) {
        const child = argsNode.child(i);

        if (
          child.type === '(' ||
          child.type === ')' ||
          child.type === ','
        ) {
          continue;
        }

        if (child.isNamed) {
          args.push(child.text);
        }
      }
    }

    return createCall({
      callee,
      args,
      isMethod,
      object,
      loc: { line }
    });
  }

  // =========================================================
  // ASSIGNMENT EXPRESSIONS
  // =========================================================

  convertAssignmentExpression(node) {
    const line = node.startPosition.row + 1;

    const left = node.childForFieldName('left');
    const right = node.childForFieldName('right');

    const opNode = node.child(1);
    const operator = opNode ? opNode.text : '=';

    return createAssign({
      target: left ? left.text : '',
      value: right ? right.text : '',
      operator,
      loc: { line }
    });
  }
}

// ===========================================================
// PUBLIC API
// ===========================================================

function parseCpp(code) {
  const parser = new CppParser();
  return parser.parse(code);
}

module.exports = {
  CppParser,
  parseCpp
};