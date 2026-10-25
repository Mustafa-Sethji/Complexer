/**
 * Complexity Analyzer Orchestrator
 *
 * Connects:
 * - C++ Parser
 * - Pseudocode Parser
 * - Time Complexity Analyzer
 * - Auxiliary Space Analyzer
 * - Recurrence Solver
 *
 * Fixes:
 * - Avoids duplicate recursive-call counting.
 * - Does not assume every unknown argument is n - 1.
 * - Detects recursive calls inside nested statements.
 * - Preserves existing analyzer interfaces.
 */

const { parseCpp } = require('../parsers/cppParser');

const { parsePseudocode } = require('../parsers/pseudoParser');

const { TimeAnalyzer } = require('./timeAnalyzer');

const { SpaceAnalyzer } = require('./spaceAnalyzer');

const { RecurrenceSolver } = require('../solver/recurrenceSolver');

const { NodeType } = require('../ir');

const { Complexity } = require('../complexity/symbolic');


// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================

function analyzeCode(code, mode = 'cpp', targetFunctionName = null) {
  if (typeof code !== 'string' || !code.trim()) {
    return {
      success: false,
      error: 'Please enter code to analyze.'
    };
  }

  try {
    return analyzeCodeInternal(code, mode, targetFunctionName);
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Unable to analyze the provided code.',
      line: err.line || null,
      col: err.col || null
    };
  }
}


// ============================================================
// INTERNAL ANALYSIS
// ============================================================

function analyzeCodeInternal(code, mode, targetFunctionName) {
  let irFunctions;

  if (mode === 'cpp') {
    irFunctions = parseCpp(code);
  } else if (mode === 'pseudo' || mode === 'pseudocode') {
    irFunctions = parsePseudocode(code);
  } else {
    return {
      success: false,
      error: `Unsupported analysis mode: ${mode}`
    };
  }

  if (!Array.isArray(irFunctions) || irFunctions.length === 0) {
    return {
      success: false,
      error: 'No executable functions or statements found.'
    };
  }

  const functionNames = irFunctions.map(fn => fn.name);
  const functionRegistry = new Map();

  for (const fn of irFunctions) {
    functionRegistry.set(fn.name, fn);
  }

  const callGraph = buildCallGraph(irFunctions, functionRegistry);

  // A class (data structure) is analyzed per operation.
  const classResult = analyzeClassMethods(
    irFunctions,
    functionRegistry,
    callGraph,
    mode,
    functionNames
  );

  if (classResult) {
    return classResult;
  }

  const targetFn = selectTargetFunction(
    irFunctions,
    functionRegistry,
    callGraph,
    targetFunctionName
  );

  if (!targetFn) {
    return {
      success: false,
      error: 'Could not select a function for analysis.'
    };
  }

  const recursionInfo = detectRecursion(targetFn);

  // Range recursion (low/high/mid): the problem size is the range, i.e. n.
  const paramName = recursionInfo.isRange
    ? 'n'
    : detectPrimaryParameter(targetFn);

  let timeComplexity = 'O(1)';
  let spaceComplexity = 'O(1)';
  let recurrenceData = null;
  let explanations = [];

  if (!recursionInfo.isRecursive) {
    const timeAnalyzer = new TimeAnalyzer({
      primaryVar: paramName,
      functionRegistry
    });

    const timeResult = timeAnalyzer.analyzeBlock(targetFn.body || []);

    timeComplexity = timeResult.complexity.toBigO();

    const spaceAnalyzer = new SpaceAnalyzer({
      primaryVar: paramName,
      functionRegistry
    });

    const spaceResult = spaceAnalyzer.analyzeFunction(targetFn);

    spaceComplexity = spaceResult.complexity.toBigO();

    explanations = [
      ...(timeResult.explanations || []),
      ...(spaceResult.explanations || [])
    ];
  } else {
    const recursiveResult = analyzeRecursiveFunction(
      targetFn,
      recursionInfo,
      paramName,
      functionRegistry
    );

    timeComplexity = recursiveResult.timeComplexity;
    spaceComplexity = recursiveResult.spaceComplexity;
    recurrenceData = recursiveResult.recurrenceData;
    explanations = recursiveResult.explanations;
  }

  // Present the problem size with conventional names (n, V).
  const naming = chooseSizeVariableRename(targetFn, functionRegistry);

  if (naming) {
    const rename = text => renameVariable(text, naming.from, naming.to);

    timeComplexity = rename(timeComplexity);
    spaceComplexity = rename(spaceComplexity);

    explanations = explanations.map(item => ({
      ...item,
      complexity: rename(item.complexity)
    }));

    if (recurrenceData) {
      recurrenceData = {
        ...recurrenceData,
        solvedResult: rename(recurrenceData.solvedResult)
      };
    }
  }

  explanations = normalizeExplanations(explanations);

  return {
    success: true,
    mode,
    functions: functionNames,
    selectedFunction: targetFn.name,
    functionName: targetFn.name,
    timeComplexity,
    spaceComplexity,
    isRecursive: recursionInfo.isRecursive,
    recurrence: recurrenceData,
    explanations
  };
}


// ============================================================
// CLASS / DATA STRUCTURE ANALYSIS
// ============================================================

const GROWTH_CALLEES =
  /^(push|push_back|push_front|emplace|emplace_back|enqueue|insert)$/i;

function analyzeClassMethods(
  irFunctions,
  functionRegistry,
  callGraph,
  mode,
  functionNames
) {
  const methods = irFunctions.filter(fn => fn.className);

  if (methods.length === 0 || methods.length !== irFunctions.length) {
    return null;
  }

  // Recursive methods use the normal recursion analysis instead.
  if (methods.some(fn => callGraph.get(fn.name)?.has(fn.name))) {
    return null;
  }

  const className = methods[0].className;
  const memberNames = new Set(
    (methods[0].members || []).map(member => member.name)
  );

  let time = Complexity.of('n', 0);
  let time1 = true;
  let grows = false;
  const explanations = [];

  for (const method of methods) {
    const body = [...(method.members || []), ...(method.body || [])];

    const timeResult = new TimeAnalyzer({
      primaryVar: 'n',
      functionRegistry
    }).analyzeBlock(body);

    if (timeResult.complexity.toBigO() !== 'O(1)') {
      time1 = false;
    }

    time = time1 ? time : (time.toBigO() === 'O(1)' ? timeResult.complexity : time.add(timeResult.complexity));

    const visit = list => {
      for (const stmt of list || []) {
        if (!stmt) continue;

        if (
          stmt.type === NodeType.CALL &&
          memberNames.has(stmt.object) &&
          GROWTH_CALLEES.test(stmt.callee)
        ) {
          grows = true;
        }

        visit(stmt.body);
        visit(stmt.thenBranch);
        visit(stmt.elseBranch);

        for (const branch of stmt.elseIfBranches || []) {
          visit(branch.body);
        }
      }
    };

    visit(method.body);

    explanations.push({
      line: method.loc?.line || 1,
      rule: `Method '${method.name}'`,
      complexity: timeResult.complexity.toBigO(),
      details: `Per-call time of ${className}::${method.name}`
    });

    for (const item of timeResult.explanations || []) {
      explanations.push(item);
    }
  }

  const timeComplexity = time1 ? 'O(1)' : time.toBigO();
  const spaceComplexity = grows ? 'O(n)' : 'O(1)';

  explanations.push({
    line: methods[0].loc?.line || 1,
    rule: `Member storage of ${className}`,
    complexity: spaceComplexity,
    details: grows
      ? 'Member containers gain an element on every insertion, so n stored elements need O(n) space.'
      : 'No member container grows.'
  });

  return {
    success: true,
    mode,
    functions: functionNames,
    selectedFunction: className,
    functionName: className,
    timeComplexity,
    spaceComplexity,
    isRecursive: false,
    recurrence: null,
    explanations: normalizeExplanations(explanations),
    note: 'Time is the worst cost of a single operation; space is for n stored elements.'
  };
}


// ============================================================
// SIZE VARIABLE NAMING
// ============================================================

function getParamNames(fnNode) {
  return (fnNode.params || [])
    .map(param =>
      typeof param === 'string'
        ? param.trim()
        : String(param?.name || '').trim()
    )
    .filter(Boolean);
}

function renameVariable(text, from, to) {
  if (typeof text !== 'string' || !from || from === to) {
    return text;
  }

  return text.replace(
    new RegExp(`(?<![A-Za-z0-9_])${escapeRegex(from)}(?![A-Za-z0-9_(])`, 'g'),
    to
  );
}

// Returns { from, to } when the analysis used an unconventional name for the
// input size, e.g. O(s) for isValid(string s) or O(n) for a vertex count.
function chooseSizeVariableRename(targetFn, functionRegistry) {
  const names = getParamNames(targetFn);

  const hasSize = names.some(name => ['n', 'N'].includes(name));

  // Vertex count called `n` in a graph driver (countComponents(n, adj)).
  const graphText = [targetFn, ...functionRegistry.values()]
    .map(fn => JSON.stringify(fn.body || []))
    .join(' ');

  const isGraph =
    /\badj\w*\s*\[|\bgraph\s*\[|\bmatrix\s*\[/i.test(graphText) &&
    /\bvisited\b|\bvis\b|inDegree|\bcolor\b/i.test(graphText);

  if (
    isGraph &&
    names.includes('n') &&
    !names.includes('V') &&
    !names.includes('v')
  ) {
    return { from: 'n', to: 'V' };
  }

  if (!hasSize) {
    const sequenceNames = [
      's', 'str', 'word', 'text', 'arr', 'nums',
      'root', 'node', 'head', 'tree'
    ];

    const found = names.find(name => sequenceNames.includes(name));

    if (found) {
      return { from: found, to: 'n' };
    }
  }

  return null;
}


// ============================================================
// SELECT TARGET FUNCTION
// ============================================================

function selectTargetFunction(
  irFunctions,
  functionRegistry,
  callGraph,
  targetFunctionName
) {
  if (targetFunctionName) {
    return functionRegistry.get(targetFunctionName) || null;
  }

  // Prefer actual recursive functions over main when possible.
  const recursiveFunctions = irFunctions.filter(fn => {
    const callees = callGraph.get(fn.name);
    return callees && callees.has(fn.name);
  });

  if (recursiveFunctions.length === 1) {
    const recursive = recursiveFunctions[0];

    // A recursive DFS helper (uses a visited array) is normally driven by
    // a caller that loops over all start vertices, e.g. countComponents.
    // The caller is the function whose cost the person actually wants.
    if (/\bvisited\b|\bvis\b/i.test(JSON.stringify(recursive.body || []))) {
      const callers = irFunctions.filter(fn => {
        if (fn === recursive || fn.name === 'main') return false;

        const callees = callGraph.get(fn.name);

        return callees && callees.has(recursive.name);
      });

      const rootCallers = callers.filter(fn =>
        !irFunctions.some(other => {
          if (other === fn) return false;

          const callees = callGraph.get(other.name);

          return callees && callees.has(fn.name);
        })
      );

      if (rootCallers.length === 1) {
        return rootCallers[0];
      }
    }

    return recursive;
  }

  // Prefer common algorithm function names.
  const preferredNames = ['solve', 'solution', 'algorithm', 'run'];

  for (const name of preferredNames) {
    const match = irFunctions.find(
      fn => fn.name.toLowerCase() === name
    );

    if (match) {
      return match;
    }
  }

  // Use main if no better target exists.
  if (functionRegistry.has('main')) {
    return functionRegistry.get('main');
  }

  const indegree = new Map();

  for (const fn of irFunctions) {
    indegree.set(fn.name, 0);
  }

  for (const callees of callGraph.values()) {
    for (const callee of callees) {
      indegree.set(callee, (indegree.get(callee) || 0) + 1);
    }
  }

  const roots = irFunctions.filter(
    fn => indegree.get(fn.name) === 0
  );

  if (roots.length > 0) {
    return roots[roots.length - 1];
  }

  return irFunctions[0];
}


// ============================================================
// DETECT PRIMARY PARAMETER
// ============================================================

function detectPrimaryParameter(fnNode) {
  const params = fnNode.params || [];

  const names = params.map(param => {
    if (typeof param === 'string') {
      return param.trim();
    }

    return String(param?.name || '').trim();
  }).filter(Boolean);

  const preferred = [
    'n', 'N', 'V', 'v', 'm', 'M', 'k', 'K', 'E', 'e', 'W',
    'board', 'grid', 'arr', 'nums', 's', 'str', 'word'
  ];

  for (const name of preferred) {
    if (names.includes(name)) {
      if (name === 'v') return 'V';
      if (name === 'e') return 'E';
      return name;
    }
  }

  const nodeLike = ['root', 'node', 'head', 'tree', 'curr', 'cur'];

  if (names.some(name => nodeLike.includes(name))) {
    return 'n';
  }

  return names[0] || 'n';
}


// ============================================================
// BUILD CALL GRAPH
// ============================================================

function buildCallGraph(irFunctions, functionRegistry) {
  const callGraph = new Map();

  for (const fn of irFunctions) {
    const callees = new Set();

    walkStatements(fn.body || [], node => {
      if (
        node.type === NodeType.CALL &&
        !(node.isMethod && node.object) &&
        functionRegistry.has(node.callee)
      ) {
        callees.add(node.callee);
      }

      const text = getNodeExpressionText(node);

      if (!text) return;

      for (const name of functionRegistry.keys()) {
        if (expressionContainsCall(text, name)) {
          callees.add(name);
        }
      }
    });

    callGraph.set(fn.name, callees);
  }

  return callGraph;
}


// ============================================================
// WALK NESTED STATEMENTS
// ============================================================

function walkStatements(statements, callback) {
  for (const node of statements || []) {
    if (!node) continue;

    callback(node);

    if (Array.isArray(node.body)) {
      walkStatements(node.body, callback);
    }

    if (Array.isArray(node.thenBranch)) {
      walkStatements(node.thenBranch, callback);
    }

    if (Array.isArray(node.elseBranch)) {
      walkStatements(node.elseBranch, callback);
    }

    for (const branch of node.elseIfBranches || []) {
      walkStatements(branch.body || [], callback);
    }
  }
}


// ============================================================
// GET EXPRESSION TEXT
// ============================================================

function getNodeExpressionText(node) {
  if (!node) return '';

  switch (node.type) {
    case NodeType.RETURN:
      return String(node.value || '');

    case NodeType.ASSIGN:
      return String(node.value || '');

    case NodeType.EXPRESSION:
      return String(node.expr || '');

    case NodeType.DECLARE:
      return String(node.initialValue || '');

    case NodeType.IF_ELSE:
      return String(node.condition || '');

    case NodeType.LOOP:
      return [
        node.init,
        node.condition,
        node.update
      ].filter(Boolean).join(' ');

    case NodeType.CALL:
      return '';

    default:
      return '';
  }
}


// ============================================================
// REGEX HELPERS
// ============================================================

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expressionContainsCall(text, fnName) {
  const regex = new RegExp(
    `(?<![.>\\w])${escapeRegex(fnName)}\\s*\\(`,
    'i'
  );

  return regex.test(String(text || ''));
}


// ============================================================
// EXTRACT CALL ARGUMENTS
// ============================================================

function extractCallArguments(text, fnName) {
  const source = String(text || '');

  const regex = new RegExp(
    `(?<![.>\\w])${escapeRegex(fnName)}\\s*\\(`,
    'g'
  );

  const result = [];
  let match;

  while ((match = regex.exec(source)) !== null) {
    const start = regex.lastIndex;

    let depth = 1;
    let end = start;

    while (end < source.length && depth > 0) {
      if (source[end] === '(') depth++;
      else if (source[end] === ')') depth--;

      end++;
    }

    if (depth === 0) {
      result.push(source.substring(start, end - 1));
    }

    regex.lastIndex = Math.max(end, regex.lastIndex);
  }

  return result;
}


// ============================================================
// SPLIT TOP-LEVEL ARGUMENTS
// ============================================================

function splitTopLevelArguments(text) {
  const source = String(text || '');
  const result = [];

  let depth = 0;
  let start = 0;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      result.push(source.slice(start, i).trim());
      start = i + 1;
    }
  }

  result.push(source.slice(start).trim());

  return result;
}


// ============================================================
// DETECT RECURSION
// ============================================================

function detectRecursion(fnNode) {
  const fnName = fnNode.name;
  const calls = [];
  const rawCallArgs = [];
  let isMemoized = false;
  let callInLoop = false;
  const assignedValues = new Map();

  walkStatements(fnNode.body || [], node => {
    if (node.type === NodeType.LOOP) {
      const loopText = JSON.stringify(node.body || []);

      if (expressionContainsCall(loopText, fnName) ||
          new RegExp(`"callee":"${escapeRegex(fnName)}"`).test(loopText)) {
        callInLoop = true;
      }
    }

    if (node.type === NodeType.ASSIGN) {
      const key = String(node.target || '').replace(/\s+/g, '');
      const value = String(node.value || '').replace(/\s+/g, '');

      if (!assignedValues.has(key)) assignedValues.set(key, new Set());
      assignedValues.get(key).add(value);
    }

    if (node.type === NodeType.IF_ELSE) {
      const condition = String(node.condition || '');

      if (/memo|dp|cache/i.test(condition)) {
        isMemoized = true;
      }
    }

    // Extract direct CALL nodes once.
    if (
      node.type === NodeType.CALL &&
      node.callee === fnName &&
      !(node.isMethod && node.object)
    ) {
      const args = node.args || [];

      rawCallArgs.push(args.map(a => String(a).replace(/\s+/g, '')));

      calls.push(
        parseRecursiveCall(args, fnNode.params || [])
      );
    }

    // Do not process CALL nodes again as expression text.
    if (node.type === NodeType.CALL) return;

    const text = getNodeExpressionText(node);

    if (!text) return;

    const recursiveArgs = extractCallArguments(text, fnName);

    for (const args of recursiveArgs) {
      const splitArgs = splitTopLevelArguments(args);

      rawCallArgs.push(splitArgs.map(a => a.replace(/\s+/g, '')));

      const parsed = parseRecursiveCall(splitArgs, fnNode.params || []);

      // A single recursive call inside its own `return` can never run
      // together with another such call, so branches are alternatives (max), not a sum.
      if (node.type === NodeType.RETURN && recursiveArgs.length === 1) {
        parsed.exclusive = true;
      }

      calls.push(parsed);
    }
  });

  const isRecursive = calls.length > 0;

  if (!isRecursive) {
    return {
      isRecursive: false,
      calls: [],
      isMemoized: false,
      isGraphAdjListDFS: false,
      isGraphMatrixDFS: false,
      isGridDFS: false,
      isPermutations: false,
      isNQueens: false,
      isSubsets: false,
      isDSUFind: false,
      isTreeDFS: false,
      isCombinationSum: false,
      isSudoku: false,
      isMazeBacktracking: false
    };
  }

  const fnText = JSON.stringify(fnNode.body || []);

  const hasAdjList = /(?:adj|graph|edges|g)\s*\[/i.test(fnText);
  const hasVisited = /\bvisited\b|\bvis\b/i.test(fnText);
  const hasMatrix = /matrix\s*\[/i.test(fnText);

  const isGraphAdjListDFS = hasAdjList && hasVisited;
  const isGraphMatrixDFS = hasMatrix && hasVisited && !hasAdjList;

  const hasGrid = /\bgrid\b/i.test(fnText);
  const hasPositiveStep = /\+\s*1/.test(fnText);
  const hasNegativeStep = /-\s*1/.test(fnText);

  // Backtracking on a grid: a cell is marked, explored, then UNMARKED.
  const movingCalls = rawCallArgs.filter(
    args => args.some(a => /^[A-Za-z_]\w*[+-]1$/.test(a))
  );

  let cellUnmarked = false;

  for (const [target, values] of assignedValues) {
    if (!/\]/.test(target)) continue;

    const marks = [...values].some(v => /^(1|true|'[^.]')$/i.test(v));
    const clears = [...values].some(v => /^(0|false|'\.')$/i.test(v));

    if (marks && clears) cellUnmarked = true;
  }

  const isMazeBacktracking =
    movingCalls.length >= 2 && cellUnmarked && !callInLoop;

  const isGridDFS =
    hasGrid && hasPositiveStep && hasNegativeStep && !isMazeBacktracking;

  const isSudoku =
    callInLoop &&
    /board\s*\[/i.test(fnText) &&
    /'9'|"9"|\b9\b/.test(fnText);

  const isCombinationSum =
    callInLoop &&
    !isSudoku &&
    /push_back|PUSH/i.test(fnText) &&
    /pop_back|POP/i.test(fnText) &&
    rawCallArgs.some(args =>
      args.some(a => /^[A-Za-z_]\w*-[A-Za-z_]\w*/.test(a))
    );

  const isTreeDFS =
    calls.length > 0 && calls.every(c => c.type === 'treeChild');

  const treeLinear =
    isTreeDFS && calls.every(c => c.child === 'next');

  const isDSUFind =
    /find/i.test(fnName) &&
    /parent/i.test(fnText) &&
    /parent.*find|find.*parent/i.test(fnText);

  const isNQueens =
    /queen|isSafe/i.test(fnName + ' ' + fnText) &&
    /row\s*\+\s*1/i.test(fnText);

  const hasUsed = /\bused\b/i.test(fnText);
  const hasUnmark = /false|\b0\b/i.test(fnText);

  const isPermutations =
    !isNQueens &&
    !isGraphAdjListDFS &&
    !isGraphMatrixDFS &&
    (
      /permut/i.test(fnName) ||
      (hasUsed && hasUnmark)
    );

  const hasPush = /push_back|PUSH/i.test(fnText);
  const hasPop = /pop_back|POP/i.test(fnText);

  const isSubsets =
    !isPermutations &&
    !isNQueens &&
    !isCombinationSum &&
    !isSudoku &&
    !isMazeBacktracking &&
    (
      /subset/i.test(fnName) ||
      (hasPush && hasPop && hasPositiveStep)
    );

  return {
    isRecursive: true,
    isRange: calls.some(c => c.range),
    calls: groupCalls(calls),
    isMemoized,
    isGraphAdjListDFS,
    isGraphMatrixDFS,
    isGridDFS,
    isPermutations,
    isNQueens,
    isSubsets,
    isDSUFind,
    isTreeDFS,
    treeLinear,
    isCombinationSum,
    isSudoku,
    isMazeBacktracking,
    mazeMoves: movingCalls.length
  };
}


// ============================================================
// PARSE RECURSIVE ARGUMENT
// ============================================================

function parseRecursiveCall(args = [], params = []) {
  const list = args.map(a => String(a || '').replace(/\s+/g, ''));

  // Range shrinking via a midpoint, e.g. (arr, low, mid - 1) or (arr, mid + 1, high)
  if (list.some(a => /\bmid(dle)?\b/i.test(a) || /\(.+[+]\w+\)\/2/.test(a))) {
    return { type: 'divisive', a: 1, b: 2, range: true };
  }

  // Otherwise use the first argument whose transformation we can classify.
  let firstUnknown = null;
  for (const arg of list) {
    const parsed = parseRecursiveArgument(arg, params);
    if (parsed.type !== 'unknown') return parsed;
    if (!firstUnknown) firstUnknown = parsed;
  }
  return firstUnknown || parseRecursiveArgument('', params);
}

function parseRecursiveArgument(arg, params = []) {
  const clean = String(arg || '').replace(/\s+/g, '');

  if (!clean) {
    return { type: 'unknown', shrink: 'unknown' };
  }

  // n / 2, n / 3, etc.
  const divMatch = clean.match(/\/([0-9]+)$/);

  if (divMatch) {
    const divisor = Number(divMatch[1]);

    if (divisor > 1) {
      return {
        type: 'divisive',
        a: 1,
        b: divisor
      };
    }
  }

  // n >> 1, n >> 2, etc.
  const shiftMatch = clean.match(/>>([0-9]+)$/);

  if (shiftMatch) {
    return {
      type: 'divisive',
      a: 1,
      b: Math.pow(2, Number(shiftMatch[1]))
    };
  }

  if (/sqrt\(/i.test(clean)) {
    return {
      type: 'sqrt',
      a: 1
    };
  }

  // n - 1, n - 2, board - 1, row - 1, etc.
  const subMatch = clean.match(/-\(?([0-9]+)\)?$/);

  if (subMatch) {
    return {
      type: 'subtractive',
      a: 1,
      c: Number(subMatch[1])
    };
  }

  // Tree / linked-list child: root->left, node.right, head->next ...
  const childMatch = clean.match(
    /(?:->|\.)(left|right|next|child|children|first|second)\b/i
  );

  if (childMatch) {
    return {
      type: 'treeChild',
      a: 1,
      child: childMatch[1].toLowerCase()
    };
  }

  // midpoint calls
  if (/mid/i.test(clean)) {
    return {
      type: 'divisive',
      a: 1,
      b: 2
    };
  }

  // An unchanged parameter is not equivalent to n - 1.
  // Do not silently invent a recurrence for it.
  const paramNames = params.map(param => {
    if (typeof param === 'string') return param.trim();
    return String(param?.name || '').trim();
  });

  if (paramNames.includes(clean)) {
    return {
      type: 'unknown',
      shrink: clean
    };
  }

  return {
    type: 'unknown',
    shrink: clean
  };
}


// ============================================================
// GROUP RECURSIVE CALLS
// ============================================================

function groupCalls(calls) {
  const groups = new Map();

  for (const call of calls) {
    if (call.type === 'unknown') {
      // Keep unknown transformations visible. Never pretend they
      // are subtractive calls.
      const key = `unknown:${call.shrink}`;

      if (!groups.has(key)) {
        groups.set(key, {
          type: 'unknown',
          shrink: call.shrink,
          count: 0
        });
      }

      groups.get(key).count++;
      continue;
    }

    const key = call.type === 'divisive'
      ? `divisive:${call.b}`
      : call.type === 'subtractive'
        ? `subtractive:${call.c}`
        : call.type === 'treeChild'
          ? `treeChild:${call.child}`
          : `sqrt:${call.a || 1}`;

    if (!groups.has(key)) {
      groups.set(key, { ...call, a: 0 });
    }

    const group = groups.get(key);

    if (call.exclusive) {
      if (group.exclusiveSeen) continue;
      group.exclusiveSeen = true;
    }

    group.a += call.a || 1;
  }

  return Array.from(groups.values()).map(call => {
    if (call.type === 'unknown') return call;
    return call;
  });
}


// ============================================================
// FILTER RECURSIVE STATEMENTS
// ============================================================

function filterNonRecursiveStatements(statements, fnName) {
  const result = [];

  for (const stmt of statements || []) {
    if (!stmt) continue;

    if (
      stmt.type === NodeType.CALL &&
      stmt.callee === fnName
    ) {
      continue;
    }

    const text = getNodeExpressionText(stmt);

    if (expressionContainsCall(text, fnName)) {
      continue;
    }

    const copy = { ...stmt };

    if (Array.isArray(stmt.body)) {
      copy.body = filterNonRecursiveStatements(stmt.body, fnName);
    }

    if (Array.isArray(stmt.thenBranch)) {
      copy.thenBranch = filterNonRecursiveStatements(
        stmt.thenBranch,
        fnName
      );
    }

    if (Array.isArray(stmt.elseBranch)) {
      copy.elseBranch = filterNonRecursiveStatements(
        stmt.elseBranch,
        fnName
      );
    }

    if (Array.isArray(stmt.elseIfBranches)) {
      copy.elseIfBranches = stmt.elseIfBranches.map(branch => ({
        ...branch,
        body: filterNonRecursiveStatements(branch.body || [], fnName)
      }));
    }

    result.push(copy);
  }

  return result;
}


// ============================================================
// RECURSIVE FUNCTION ANALYSIS
// ============================================================

function analyzeRecursiveFunction(
  targetFn,
  recursionInfo,
  paramName,
  functionRegistry
) {
  const line = targetFn.loc?.line || 1;

  let timeComplexity = 'Could not determine';
  let spaceComplexity = 'Could not determine';
  let recurrenceData = null;
  const explanations = [];

  // ----------------------------------------------------------
  // Graph DFS: adjacency list
  // ----------------------------------------------------------

  if (recursionInfo.isGraphAdjListDFS) {
    timeComplexity = 'O(V + E)';
    spaceComplexity = 'O(V)';

    recurrenceData = {
      recurrenceString: 'T(V, E) = O(V + E)',
      method: 'Depth-First Search (Adjacency List)',
      solvedResult: timeComplexity,
      explanation: 'Each vertex is visited once and each edge is inspected.'
    };

    explanations.push({
      line,
      rule: 'Graph DFS (Adjacency List)',
      complexity: timeComplexity,
      details: 'Each vertex and edge is processed at most a constant number of times.'
    });

    explanations.push({
      line,
      rule: 'DFS Recursion Stack',
      complexity: spaceComplexity,
      details: 'Worst-case recursion depth is O(V).'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Graph DFS: adjacency matrix
  // ----------------------------------------------------------

  if (recursionInfo.isGraphMatrixDFS) {
    timeComplexity = 'O(V^2)';
    spaceComplexity = 'O(V)';

    recurrenceData = {
      recurrenceString: 'T(V) = O(V^2)',
      method: 'Depth-First Search (Adjacency Matrix)',
      solvedResult: timeComplexity,
      explanation: 'Each visited vertex scans a row of the adjacency matrix.'
    };

    explanations.push({
      line,
      rule: 'Graph DFS (Adjacency Matrix)',
      complexity: timeComplexity,
      details: 'Scanning a row for each vertex gives O(V^2).'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Grid DFS
  // ----------------------------------------------------------

  if (recursionInfo.isGridDFS) {
    timeComplexity = 'O(n*m)';
    spaceComplexity = 'O(n*m)';

    recurrenceData = {
      recurrenceString: 'T(n, m) = O(n*m)',
      method: '2D Grid DFS',
      solvedResult: timeComplexity,
      explanation: 'Each grid cell is processed at most once when visited cells are tracked.'
    };

    explanations.push({
      line,
      rule: 'Grid DFS Traversal',
      complexity: timeComplexity,
      details: 'Visiting each cell once gives O(n*m).'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // DSU Find
  // ----------------------------------------------------------

  if (recursionInfo.isDSUFind) {
    // With union by rank/size the tree height (and so the recursion
    // depth of find) is O(log n); without it a chain can reach O(n).
    const hasRankOrSize = [...functionRegistry.values()].some(fn =>
      /\brank\b|\bsize\b|\bsz\b/i.test(JSON.stringify(fn.body || []))
    );

    timeComplexity = 'O(α(n))';
    spaceComplexity = hasRankOrSize ? 'O(log n)' : 'O(n)';

    recurrenceData = {
      recurrenceString: 'Amortized find cost O(α(n))',
      method: 'Disjoint Set Union (Path Compression)',
      solvedResult: timeComplexity,
      explanation: 'Near-constant amortized find cost requires path compression and union by rank or size.'
    };

    explanations.push({
      line,
      rule: 'DSU Find',
      complexity: timeComplexity,
      details: 'The amortized bound assumes path compression and union by rank or size.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Permutations
  // ----------------------------------------------------------

  if (recursionInfo.isPermutations) {
    timeComplexity = 'O(n!)';
    spaceComplexity = 'O(n)';

    recurrenceData = {
      recurrenceString: 'T(n) = n*T(n-1) + O(1)',
      method: 'Backtracking (Permutations)',
      solvedResult: timeComplexity,
      explanation: 'Permutation search explores factorially many arrangements.'
    };

    explanations.push({
      line,
      rule: 'Permutation Backtracking',
      complexity: timeComplexity,
      details: 'The search tree has factorial growth.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // N-Queens
  // ----------------------------------------------------------

  if (recursionInfo.isNQueens) {
    timeComplexity = 'O(n!)';
    spaceComplexity = 'O(n)';

    recurrenceData = {
      recurrenceString: 'T(n) <= n*T(n-1) + O(n)',
      method: 'Backtracking (N-Queens)',
      solvedResult: timeComplexity,
      explanation: 'The search places queens row by row with pruning.'
    };

    explanations.push({
      line,
      rule: 'N-Queens Backtracking',
      complexity: timeComplexity,
      details: 'O(n!) is a common upper bound for the search tree.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Subsets
  // ----------------------------------------------------------

  if (recursionInfo.isSubsets) {
    timeComplexity = 'O(2^n)';
    spaceComplexity = 'O(n)';

    recurrenceData = {
      recurrenceString: 'T(n) = 2*T(n-1) + O(1)',
      method: 'Backtracking (Subsets)',
      solvedResult: timeComplexity,
      explanation: 'Each element can be included or excluded.'
    };

    explanations.push({
      line,
      rule: 'Subsets Backtracking',
      complexity: timeComplexity,
      details: 'The binary decision tree contains 2^n leaves.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Combination sum / loop-based backtracking
  // ----------------------------------------------------------

  if (recursionInfo.isCombinationSum) {
    timeComplexity = 'O(n^target)';
    spaceComplexity = 'O(target)';

    recurrenceData = {
      recurrenceString: 'T(target) = n*T(target - c) + O(1)',
      method: 'Backtracking (Combination Sum)',
      solvedResult: timeComplexity,
      explanation: 'Each level tries all n candidates and the target shrinks by at least 1, so the search tree has up to n^target nodes.'
    };

    explanations.push({
      line,
      rule: 'Combination Sum Backtracking',
      complexity: timeComplexity,
      details: 'Upper bound: n candidates per level, depth up to target (smallest candidate = 1).'
    });

    explanations.push({
      line,
      rule: 'Recursion Stack + current path',
      complexity: spaceComplexity,
      details: 'Depth is at most target / smallest candidate <= target.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Sudoku (cell by cell, 9 digits per cell)
  // ----------------------------------------------------------

  if (recursionInfo.isSudoku) {
    timeComplexity = 'O(9^(n*n))';
    spaceComplexity = 'O(n*n)';

    recurrenceData = {
      recurrenceString: 'T(cells) = 9*T(cells - 1) + O(1)',
      method: 'Backtracking (Sudoku)',
      solvedResult: timeComplexity,
      explanation: 'Each empty cell tries 9 digits; there are n*n cells (n = 9).'
    };

    explanations.push({
      line,
      rule: 'Sudoku Backtracking',
      complexity: timeComplexity,
      details: 'Worst case tries 9 digits in each of the n*n cells (n = 9, so both bounds are constants for a fixed board).'
    });

    explanations.push({
      line,
      rule: 'Recursion Stack',
      complexity: spaceComplexity,
      details: 'Recursion depth is at most the number of cells, n*n.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Grid path backtracking (rat in a maze)
  // ----------------------------------------------------------

  if (recursionInfo.isMazeBacktracking) {
    const moves = recursionInfo.mazeMoves;

    timeComplexity = `O(${moves}^(n^2))`;
    spaceComplexity = 'O(n^2)';

    recurrenceData = {
      recurrenceString: `T(cells) = ${moves}*T(cells - 1) + O(1)`,
      method: 'Backtracking (Grid Path Search)',
      solvedResult: timeComplexity,
      explanation: `Each cell branches into up to ${moves} moves, and a path can visit up to n^2 cells.`
    };

    explanations.push({
      line,
      rule: 'Grid Path Backtracking',
      complexity: timeComplexity,
      details: `Upper bound: ${moves} moves per cell over a path of up to n^2 cells.`
    });

    explanations.push({
      line,
      rule: 'Recursion Stack + path matrix',
      complexity: spaceComplexity,
      details: 'Depth is at most n^2 and the path matrix stores n^2 cells.'
    });

    return {
      timeComplexity,
      spaceComplexity,
      recurrenceData,
      explanations
    };
  }

  // ----------------------------------------------------------
  // Tree / linked-list recursion
  // ----------------------------------------------------------

  if (recursionInfo.isTreeDFS) {
    const stmts = filterNonRecursiveStatements(
      targetFn.body || [],
      targetFn.name
    );

    const perNode = new TimeAnalyzer({
      primaryVar: 'n',
      functionRegistry
    }).analyzeBlock(stmts);

    const work = perNode.complexity;

    if (work.toBigO() === 'O(1)') {
      timeComplexity = 'O(n)';
      spaceComplexity = recursionInfo.treeLinear ? 'O(n)' : 'O(h)';

      recurrenceData = {
        recurrenceString: recursionInfo.treeLinear
          ? 'T(n) = T(n - 1) + O(1)'
          : 'T(n) = T(left) + T(right) + O(1)',
        method: recursionInfo.treeLinear
          ? 'Linear Recursion (Linked List)'
          : 'Tree Traversal (visit each node once)',
        solvedResult: timeComplexity,
        explanation: 'Each node is visited once with constant work, so the total is O(n) where n is the number of nodes.'
      };

      explanations.push({
        line,
        rule: 'Tree Recursion',
        complexity: timeComplexity,
        details: 'Every node is visited exactly once with O(1) work.'
      });

      explanations.push({
        line,
        rule: 'Recursion Stack',
        complexity: spaceComplexity,
        details: recursionInfo.treeLinear
          ? 'Recursion depth equals the list length.'
          : 'Recursion depth equals the tree height h (h = n in the worst case, log n when balanced).'
      });

      return {
        timeComplexity,
        spaceComplexity,
        recurrenceData,
        explanations
      };
    }
  }

  // ----------------------------------------------------------
  // General recurrence solver
  // ----------------------------------------------------------

  const unknownCalls = recursionInfo.calls.some(
    call => call.type === 'unknown'
  );

  if (unknownCalls) {
    const unknown = recursionInfo.calls
      .filter(call => call.type === 'unknown')
      .map(call => call.shrink)
      .join(', ');

    recurrenceData = {
      recurrenceString: `T(${paramName}) = Unknown recursive argument (${unknown})`,
      method: 'Could not determine',
      solvedResult: 'Unsolved',
      explanation: 'The recursive argument transformation could not be safely classified. No complexity was guessed.'
    };

    explanations.push({
      line,
      rule: 'Unknown Recursive Argument',
      complexity: 'Could not determine',
      details: 'Please inspect the recursive argument transformation.'
    });

    return {
      timeComplexity: 'Could not determine',
      spaceComplexity: 'Could not determine',
      recurrenceData,
      explanations
    };
  }

  const nonRecursiveStmts = filterNonRecursiveStatements(
    targetFn.body || [],
    targetFn.name
  );

  const timeAnalyzer = new TimeAnalyzer({
    primaryVar: paramName,
    functionRegistry
  });

  const workResult = timeAnalyzer.analyzeBlock(nonRecursiveStmts);

  const recurrenceInput = {
    calls: recursionInfo.calls,
    work: workResult.complexity,
    isMemoized: recursionInfo.isMemoized,
    memoStates: Complexity.of(paramName, 1),
    varName: paramName
  };

  const solved = RecurrenceSolver.solve(recurrenceInput);

  if (solved.status !== 'solved' || !solved.timeComplexity) {
    recurrenceData = {
      recurrenceString: solved.recurrenceString || 'Unknown',
      method: solved.method || 'Unknown',
      solvedResult: 'Unsolved',
      explanation: solved.explanation || 'The recurrence could not be solved.'
    };

    return {
      timeComplexity: 'Could not determine',
      spaceComplexity: 'Could not determine',
      recurrenceData,
      explanations: [{
        line,
        rule: 'Recurrence Analysis',
        complexity: 'Could not determine',
        details: solved.explanation || 'The recurrence could not be solved.'
      }]
    };
  }

  timeComplexity = solved.timeComplexity.toBigO();

  const spaceAnalyzer = new SpaceAnalyzer({
    primaryVar: paramName,
    functionRegistry
  });

  const localSpace = spaceAnalyzer.analyzeFunction({
    ...targetFn,
    body: nonRecursiveStmts
  });

  let combinedSpace = solved.spaceComplexity;

  if (localSpace && localSpace.complexity) {
    combinedSpace = combinedSpace
      ? combinedSpace.add(localSpace.complexity)
      : localSpace.complexity;
  }

  spaceComplexity = combinedSpace
    ? combinedSpace.toBigO()
    : 'Could not determine';

  recurrenceData = {
    recurrenceString: solved.recurrenceString,
    method: solved.method,
    solvedResult: timeComplexity,
    explanation: solved.explanation
  };

  explanations.push({
    line,
    rule: `Recurrence: ${solved.recurrenceString}`,
    complexity: timeComplexity,
    details: `${solved.method} -> ${solved.explanation}`
  });

  explanations.push(...(workResult.explanations || []));
  explanations.push(...(localSpace.explanations || []));

  return {
    timeComplexity,
    spaceComplexity,
    recurrenceData,
    explanations
  };
}


// ============================================================
// NORMALIZE EXPLANATIONS
// ============================================================

function normalizeExplanations(explanations) {
  const sorted = [...(explanations || [])];

  sorted.sort((a, b) => {
    const lineA = typeof a.line === 'number'
      ? a.line
      : Number.MAX_SAFE_INTEGER;

    const lineB = typeof b.line === 'number'
      ? b.line
      : Number.MAX_SAFE_INTEGER;

    return lineA - lineB;
  });

  const seen = new Set();
  const result = [];

  for (const item of sorted) {
    const key = [
      item.line,
      item.rule,
      item.complexity,
      item.details
    ].join('|');

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(item);
  }

  return result;
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  analyzeCode
};