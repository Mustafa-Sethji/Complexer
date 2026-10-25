/**
 * Common Intermediate Representation (IR)
 * for Complexity Analysis.
 *
 * Supported Node Types:
 *
 * Function:
 *   name, params, body, loc
 *
 * Loop:
 *   loopType, init, condition, update, body, loc, meta
 *
 * IfElse:
 *   condition, thenBranch, elseIfBranches, elseBranch, loc
 *
 * Call:
 *   callee, args, isMethod, object, loc
 *
 * Declare:
 *   name, kind, dimensions, initialValue, loc
 *
 * Supported declaration kinds:
 *   scalar, array, matrix, vector, string,
 *   stack, queue, priority_queue,
 *   map, set, unordered_map, unordered_set
 *
 * Return:
 *   value, loc
 *
 * Assign:
 *   target, value, operator, loc
 *
 * Expression:
 *   expr, loc
 */

const NodeType = {
  FUNCTION: 'Function',
  LOOP: 'Loop',
  IF_ELSE: 'IfElse',
  CALL: 'Call',
  DECLARE: 'Declare',
  RETURN: 'Return',
  ASSIGN: 'Assign',
  EXPRESSION: 'Expression'
};


// ============================================================
// FUNCTION
// ============================================================

function createFunction(
  name,
  params = [],
  body = [],
  loc = null
) {
  return {
    type: NodeType.FUNCTION,
    name,
    params,
    body,
    loc
  };
}


// ============================================================
// LOOP
// ============================================================

function createLoop({
  loopType = 'for',
  init = null,
  condition = null,
  update = null,
  body = [],
  loc = null,
  meta = {}
}) {
  return {
    type: NodeType.LOOP,
    loopType,
    init,
    condition,
    update,
    body,
    loc,
    meta
  };
}


// ============================================================
// IF / ELSE
// ============================================================

function createIfElse({
  condition = null,
  thenBranch = [],
  elseIfBranches = [],
  elseBranch = [],
  loc = null
}) {
  return {
    type: NodeType.IF_ELSE,
    condition,
    thenBranch,
    elseIfBranches,
    elseBranch,
    loc
  };
}


// ============================================================
// FUNCTION CALL
// ============================================================

function createCall({
  callee,
  args = [],
  isMethod = false,
  object = null,
  loc = null
}) {
  return {
    type: NodeType.CALL,
    callee,
    args,
    isMethod,
    object,
    loc
  };
}


// ============================================================
// DECLARATION
// ============================================================

function createDeclare({
  name,
  kind = 'scalar',
  dimensions = [],
  initialValue = null,
  loc = null
}) {
  return {
    type: NodeType.DECLARE,
    name,
    kind,
    dimensions,
    initialValue,
    loc
  };
}


// ============================================================
// RETURN
// ============================================================

function createReturn({
  value = null,
  loc = null
}) {
  return {
    type: NodeType.RETURN,
    value,
    loc
  };
}


// ============================================================
// ASSIGNMENT
// ============================================================

function createAssign({
  target,
  value,
  operator = '=',
  loc = null
}) {
  return {
    type: NodeType.ASSIGN,
    target,
    value,
    operator,
    loc
  };
}


// ============================================================
// EXPRESSION
// ============================================================

function createExpression({
  expr,
  loc = null
}) {
  return {
    type: NodeType.EXPRESSION,
    expr,
    loc
  };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  NodeType,
  createFunction,
  createLoop,
  createIfElse,
  createCall,
  createDeclare,
  createReturn,
  createAssign,
  createExpression
};