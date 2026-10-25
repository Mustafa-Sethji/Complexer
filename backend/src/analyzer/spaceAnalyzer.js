/**
 * Auxiliary Space Complexity Analyzer
 *
 * Supports:
 * - Scalar variables
 * - Arrays and matrices
 * - C++ vectors and dynamic containers
 * - Stack / Queue / Priority Queue
 * - Maps / Sets
 * - Nested loops
 * - Conditional branches
 * - Helper function calls
 * - Recursion stack supplied by recursion analyzer
 *
 * Important:
 * 1. Auxiliary space excludes input data structures.
 * 2. Nested loops do not automatically increase space.
 * 3. Container growth depends on the number of stored elements.
 * 4. Sequential allocations are combined asymptotically.
 */

const { NodeType } = require('../ir');

const {
    Complexity,
    O_1
} = require('../complexity/symbolic');


// ============================================================
// CONSTANTS
// ============================================================

const CONTAINER_KINDS = new Set([
    'stack',
    'queue',
    'priority_queue',
    'vector',
    'deque',
    'list',
    'set',
    'map',
    'unordered_set',
    'unordered_map'
]);

const GROWTH_OPERATIONS = new Set([
    'PUSH',
    'PUSH_BACK',
    'ENQUEUE',
    'INSERT',
    'EMPLACE',
    'EMPLACE_BACK'
]);

const CONSTANT_OPERATIONS = new Set([
    'POP',
    'POP_BACK',
    'TOP',
    'FRONT',
    'BACK',
    'EMPTY',
    'SIZE',
    'DEQUEUE',
    'CLEAR'
]);

const IGNORED_IDENTIFIERS = new Set([
    'INT',
    'LONG',
    'SHORT',
    'FLOAT',
    'DOUBLE',
    'CHAR',
    'BOOL',
    'STRING',
    'CONST',
    'AUTO',
    'SIGNED',
    'UNSIGNED',
    'TRUE',
    'FALSE',
    'NULL',
    'NULLPTR',
    'NEW',
    'VECTOR',
    'ARRAY',
    'MATRIX',
    'STACK',
    'QUEUE',
    'PRIORITY_QUEUE',
    'MAP',
    'SET',
    'UNORDERED_MAP',
    'UNORDERED_SET',
    'RETURN',
    'SIZE',
    'SQRT',
    'LOG',
    'MIN',
    'MAX',
    'NOT',
    'EMPTY'
]);


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function normalizeName(name) {

    const value = String(name || '').trim();

    if (value === 'v' || value === 'e') {
        return value.toUpperCase();
    }

    return value;
}


function extractIdentifiers(expression) {

    return String(expression || '').match(
        /\b[A-Za-z_][A-Za-z_0-9]*\b/g
    ) || [];
}


function containsVariable(expression, variable) {

    if (!expression || !variable) {
        return false;
    }

    const escaped = String(variable).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );

    return new RegExp(`\\b${escaped}\\b`).test(
        String(expression)
    );
}


function isConstantExpression(expression) {

    const text = String(expression || '').trim();

    if (!text) {
        return true;
    }

    return /^[\d\s.+\-*/()%]+$/.test(text);
}


function combineDimensions(expressions, combine = 'multiply') {

    const dimensions = (expressions || [])
        .map(value => String(value || '').trim())
        .filter(Boolean);

    if (dimensions.length === 0) {
        return O_1;
    }

    let result = O_1;

    for (const dimension of dimensions) {

        const current = estimateExpressionComplexity(
            dimension
        );

        if (combine === 'max') {
            result = result.max(current);
        } else {
            result = result.multiply(current);
        }
    }

    return result;
}


/**
 * Estimates the asymptotic complexity of a simple expression.
 *
 * Examples:
 * n       -> O(n)
 * V       -> O(V)
 * n * m   -> O(n*m)
 * n + m   -> O(max(n,m))
 * 100     -> O(1)
 */
function estimateExpressionComplexity(expression) {

    const text = String(expression || '').trim();

    if (!text || isConstantExpression(text)) {
        return O_1;
    }

    // sqrt(n)
    const sqrtMatch = text.match(
        /sqrt\s*\(\s*([A-Za-z_]\w*)\s*\)/i
    );

    if (sqrtMatch) {
        return Complexity.sqrt(
            normalizeName(sqrtMatch[1])
        );
    }

    // log(n)
    const logMatch = text.match(
        /log\s*\(\s*([A-Za-z_]\w*)\s*\)/i
    );

    if (logMatch) {
        return Complexity.log(
            normalizeName(logMatch[1])
        );
    }

    // Handle multiplication such as n * m.
    if (text.includes('*')) {

        const parts = text.split('*');

        if (parts.length > 1) {

            return combineDimensions(
                parts,
                'multiply'
            );
        }
    }

    // Handle addition/subtraction such as n + m.
    if (/[+-]/.test(text)) {

        const identifiers = extractIdentifiers(text)
            .filter(name => {
                return !IGNORED_IDENTIFIERS.has(
                    name.toUpperCase()
                );
            })
            .map(normalizeName);

        const unique = [...new Set(identifiers)];

        if (unique.length === 0) {
            return O_1;
        }

        return combineDimensions(unique, 'max');
    }

    const identifiers = extractIdentifiers(text)
        .filter(name => {
            return !IGNORED_IDENTIFIERS.has(
                name.toUpperCase()
            );
        })
        .map(normalizeName);

    if (identifiers.length === 0) {
        return O_1;
    }

    return Complexity.of(identifiers[0], 1);
}


// ============================================================
// SPACE ANALYZER
// ============================================================

class SpaceAnalyzer {

    constructor(options = {}) {

        this.primaryVar = options.primaryVar || 'n';

        this.functionRegistry =
            options.functionRegistry || new Map();

        this.callStack =
            options.callStack || new Set();

        this.declarations = new Map();

        this.explanations = [];

        // Tracks estimated maximum storage for each container.
        this.containerGrowth = new Map();
    }


    // ========================================================
    // EXPLANATIONS
    // ========================================================

    addExplanation(
        line,
        rule,
        complexity,
        details
    ) {

        this.explanations.push({
            line,
            rule,
            complexity: complexity.toBigO(),
            details
        });
    }


    // ========================================================
    // ANALYZE FUNCTION
    // ========================================================

    analyzeFunction(fnNode, recursionSpace = null) {

        this.declarations.clear();

        this.containerGrowth.clear();

        this.explanations = [];

        let totalSpace = O_1;

        // Recursion stack is supplied by the recursion analyzer.
        if (recursionSpace) {

            totalSpace = totalSpace.add(
                recursionSpace
            );

            this.addExplanation(
                fnNode.loc?.line || 1,
                'Recursive call stack',
                recursionSpace,
                `Maximum recursion depth uses ${recursionSpace.toBigO()} auxiliary space`
            );
        }

        const bodySpace = this.analyzeBlock(
            fnNode.body || [],
            O_1
        );

        totalSpace = totalSpace.add(bodySpace);

        return {
            complexity: totalSpace,
            explanations: this.explanations
        };
    }


    // ========================================================
    // ANALYZE BLOCK
    // ========================================================

    analyzeBlock(statements, loopMultiplier = O_1) {

        let blockSpace = O_1;

        for (const stmt of statements || []) {

            const stmtSpace = this.analyzeStatement(
                stmt,
                loopMultiplier
            );

            if (stmtSpace) {
                blockSpace = blockSpace.add(stmtSpace);
            }
        }

        return blockSpace;
    }


    // ========================================================
    // ANALYZE STATEMENT
    // ========================================================

    analyzeStatement(stmt, loopMultiplier = O_1) {

        if (!stmt) {
            return O_1;
        }

        const line = stmt.loc?.line || 'unknown';

        switch (stmt.type) {

            case NodeType.DECLARE: {

                return this.analyzeDeclaration(stmt);
            }

            case NodeType.CALL: {

                return this.analyzeCall(
                    stmt,
                    loopMultiplier
                );
            }

            case NodeType.ASSIGN: {

                return this.checkContainerGrowthInExpression(
                    stmt.value || '',
                    line,
                    loopMultiplier
                );
            }

            case NodeType.EXPRESSION: {

                return this.checkContainerGrowthInExpression(
                    stmt.expr || '',
                    line,
                    loopMultiplier
                );
            }

            case NodeType.RETURN: {

                return O_1;
            }

            case NodeType.IF_ELSE: {

                return this.analyzeIfElse(
                    stmt,
                    loopMultiplier
                );
            }

            case NodeType.LOOP: {

                return this.analyzeLoop(
                    stmt,
                    loopMultiplier
                );
            }

            default: {

                return O_1;
            }
        }
    }


    // ========================================================
    // IF / ELSE
    // ========================================================

    analyzeIfElse(stmt, loopMultiplier) {

        let branchSpace = this.analyzeBlock(
            stmt.thenBranch || [],
            loopMultiplier
        );

        for (const branch of stmt.elseIfBranches || []) {

            const current = this.analyzeBlock(
                branch.body || [],
                loopMultiplier
            );

            branchSpace = branchSpace.max(current);
        }

        if (
            stmt.elseBranch &&
            stmt.elseBranch.length > 0
        ) {

            const elseSpace = this.analyzeBlock(
                stmt.elseBranch,
                loopMultiplier
            );

            branchSpace = branchSpace.max(elseSpace);
        }

        return branchSpace;
    }


    // ========================================================
    // LOOP
    // ========================================================

    analyzeLoop(stmt, loopMultiplier) {

        const worklist = this.detectWorklist(stmt);

        const loopCount = worklist
            ? worklist.bound
            : this.estimateLoopCount(stmt);

        const newMultiplier = loopMultiplier.multiply(
            loopCount
        );

        if (worklist) {
            this.worklistDepth = (this.worklistDepth || 0) + 1;
        }

        const bodySpace = this.analyzeBlock(
            stmt.body || [],
            newMultiplier
        );

        if (worklist) {
            this.worklistDepth--;
        }

        /*
         * Important:
         *
         * We do NOT multiply every local allocation by the
         * iteration count.
         *
         * Example:
         *
         * for (...) {
         *     int temp[n];
         * }
         *
         * If temp is released at the end of each iteration,
         * peak auxiliary space is O(n), not O(n*n).
         *
         * Container insertions are handled separately because
         * elements may accumulate across iterations.
         */

        return bodySpace;
    }


    // ========================================================
    // ANALYZE DECLARATION
    // ========================================================

    analyzeDeclaration(decl) {

        const line = decl.loc?.line || 'unknown';

        const name = String(decl.name || '');

        const kind = String(
            decl.kind || 'scalar'
        ).toLowerCase();

        const dims = Array.isArray(decl.dimensions)
            ? decl.dimensions
            : [];

        const initialValue = String(
            decl.initialValue || ''
        );

        this.declarations.set(name, decl);


        // ----------------------------------------------------
        // Scalar
        // ----------------------------------------------------

        if (
            kind === 'scalar' &&
            dims.length === 0
        ) {

            return O_1;
        }


        // ----------------------------------------------------
        // Stack / Queue / Priority Queue
        // ----------------------------------------------------

        if ([
            'stack',
            'queue',
            'priority_queue'
        ].includes(kind)) {

            this.containerGrowth.set(
                name,
                O_1
            );

            this.addExplanation(
                line,
                `${kind} declaration '${name}'`,
                O_1,
                `Empty ${kind} declaration requires O(1) auxiliary space`
            );

            return O_1;
        }


        // ----------------------------------------------------
        // Array / Vector / Container with explicit dimensions
        // ----------------------------------------------------

        if (dims.length === 1) {

            const size = this.estimateDimension(
                String(dims[0]),
                name
            );

            this.addExplanation(
                line,
                `1D ${kind} allocation '${name}'`,
                size,
                `Auxiliary allocation [${dims[0]}] -> ${size.toBigO()}`
            );

            return size;
        }


        // ----------------------------------------------------
        // 2D Matrix
        // ----------------------------------------------------

        if (dims.length >= 2) {

            const space = combineDimensions(
                dims.map(value => String(value)),
                'multiply'
            );

            this.addExplanation(
                line,
                `Multidimensional ${kind} allocation '${name}'`,
                space,
                `Auxiliary allocation dimensions [${dims.join('][')}] -> ${space.toBigO()}`
            );

            return space;
        }


        // ----------------------------------------------------
        // Infer vector/array allocation from initializer
        // ----------------------------------------------------

        if ([
            'vector',
            'array',
            'matrix',
            'deque',
            'list'
        ].includes(kind)) {

            const allocation = this.inferAllocationSize(
                initialValue,
                name
            );

            if (allocation) {

                this.addExplanation(
                    line,
                    `${kind} allocation '${name}'`,
                    allocation,
                    `Inferred from initializer '${initialValue}' -> ${allocation.toBigO()}`
                );

                return allocation;
            }
        }


        // ----------------------------------------------------
        // Generic declaration
        // ----------------------------------------------------

        return O_1;
    }


    // ========================================================
    // INFER ALLOCATION FROM INITIALIZER
    // ========================================================

    inferAllocationSize(initialValue, declName = '') {

        const text = String(initialValue || '').trim();

        if (!text) {
            return null;
        }

        /*
         * Examples:
         *
         * vector<int>(n)
         * vector<int> visited(V, false)
         * vector<vector<int>>(n, vector<int>(m))
         *
         * The parser may supply the initializer with or without
         * the declared type. We handle common textual forms.
         */

        // Nested vector/matrix with two symbolic dimensions.
        const nested = text.match(
            /\(\s*([A-Za-z_]\w*)\s*,\s*vector\s*<[^>]+>\s*\(\s*([A-Za-z_]\w*)/i
        );

        if (nested) {

            return combineDimensions(
                [nested[1], nested[2]],
                'multiply'
            );
        }

        // Constructor first argument: (n) or (n, false).
        const constructor = text.match(
            /\(\s*([A-Za-z_]\w*|\d+)\s*(?:,|\))/ 
        );

        if (constructor) {

            return this.estimateDimension(
                constructor[1],
                declName
            );
        }

        // new int[n]
        const newArray = text.match(
            /\[\s*([A-Za-z_]\w*|\d+)\s*\]/
        );

        if (newArray) {

            return this.estimateDimension(
                newArray[1],
                declName
            );
        }

        return null;
    }


    // ========================================================
    // ANALYZE FUNCTION CALL
    // ========================================================

    analyzeCall(callNode, loopMultiplier = O_1) {

        const line = callNode.loc?.line || 'unknown';

        const callee = String(
            callNode.callee || ''
        );

        const operation = callee.toUpperCase();

        const args = callNode.args || [];

        const containerName = callNode.object
            ? String(callNode.object)
            : String(args[0] || '').trim();


        // ----------------------------------------------------
        // Container growth
        // ----------------------------------------------------

        if (GROWTH_OPERATIONS.has(operation)) {

            const growth = this.analyzeContainerGrowth(
                containerName,
                operation,
                loopMultiplier,
                line
            );

            if (growth) {
                return growth;
            }
        }


        // ----------------------------------------------------
        // Non-growing container operations
        // ----------------------------------------------------

        if (CONSTANT_OPERATIONS.has(operation)) {
            return O_1;
        }


        // ----------------------------------------------------
        // Helper function
        // ----------------------------------------------------

        if (
            this.functionRegistry &&
            this.functionRegistry.has(callee)
        ) {

            if (this.callStack.has(callee)) {
                return O_1;
            }

            const helperFn = this.functionRegistry.get(
                callee
            );

            const childAnalyzer = new SpaceAnalyzer({

                primaryVar: this.primaryVar,

                functionRegistry: this.functionRegistry,

                callStack: new Set([
                    ...this.callStack,
                    callee
                ])
            });

            const helperResult = childAnalyzer.analyzeFunction(
                helperFn
            );

            this.explanations.push(
                ...helperResult.explanations
            );

            /*
             * A normal helper call does not multiply its
             * temporary local space by the number of calls
             * in a loop. Calls execute sequentially.
             *
             * Recursive stack space should be supplied by
             * the recursion analyzer.
             */

            return helperResult.complexity;
        }


        return O_1;
    }


    // ========================================================
    // CONTAINER GROWTH
    // ========================================================

    analyzeContainerGrowth(
        containerName,
        operation,
        loopMultiplier,
        line
    ) {

        const declaration = this.declarations.get(
            containerName
        );

        /*
         * If the container was not declared in this function,
         * do not automatically count it as a new allocation.
         */
        if (!declaration) {
            return null;
        }

        const kind = String(
            declaration.kind || ''
        ).toLowerCase();

        if (!CONTAINER_KINDS.has(kind)) {
            return null;
        }

        const growth = loopMultiplier || O_1;

        const previous = this.containerGrowth.get(
            containerName
        ) || O_1;

        /*
         * Keep the maximum estimated size for this container.
         * For example, n insertions produce O(n) storage,
         * not O(n) new storage for every insertion.
         */
        const updated = previous.max(growth);

        this.containerGrowth.set(
            containerName,
            updated
        );

        this.addExplanation(
            line,
            `${kind} growth '${operation}'`,
            growth,
            `${operation} on '${containerName}' may accumulate ${growth.toBigO()} auxiliary storage`
        );

        return growth;
    }


    // ========================================================
    // CONTAINER GROWTH INSIDE EXPRESSIONS
    // ========================================================

    checkContainerGrowthInExpression(
        text,
        line,
        loopMultiplier = O_1
    ) {

        const source = String(text || '');

        let totalSpace = O_1;

        // ----------------------------------------------------
        // Pseudocode:
        // PUSH(st, i)
        // ENQUEUE(q, i)
        // ----------------------------------------------------

        const pseudoRegex =
            /\b(PUSH|ENQUEUE|INSERT)\s*\(\s*([A-Za-z_]\w*)/gi;

        let match;

        while (
            (match = pseudoRegex.exec(source)) !== null
        ) {

            const operation = match[1].toUpperCase();

            const containerName = match[2];

            const growth = this.analyzeContainerGrowth(
                containerName,
                operation,
                loopMultiplier,
                line
            );

            if (growth) {
                totalSpace = totalSpace.add(growth);
            }
        }


        // ----------------------------------------------------
        // C++:
        // st.push(i)
        // q.emplace(i)
        // v.push_back(i)
        // ----------------------------------------------------

        const cppRegex =
            /\b([A-Za-z_]\w*)\s*(?:\.|->)\s*(push|push_back|emplace|emplace_back|insert)\s*\(/gi;

        while (
            (match = cppRegex.exec(source)) !== null
        ) {

            const containerName = match[1];

            const operation = match[2].toUpperCase();

            const growth = this.analyzeContainerGrowth(
                containerName,
                operation,
                loopMultiplier,
                line
            );

            if (growth) {
                totalSpace = totalSpace.add(growth);
            }
        }

        return totalSpace;
    }


    // ========================================================
    // WORKLIST LOOPS
    //
    // while (!q.empty()) { ... q.push(v) ... }
    //
    // Every element enters the container a bounded number of times, so
    // the container can never hold more than the number of distinct
    // elements (V for a graph, n otherwise) -- NOT iterations x edges.
    // A lazy-insertion priority queue may hold one entry per edge
    // relaxation, so it is bounded by V + E.
    // ========================================================

    detectWorklist(loopNode) {

        if (loopNode.loopType !== 'while') {
            return null;
        }

        const cond = String(loopNode.condition || '')
            .replace(/\s+/g, '');

        const match =
            cond.match(/^!([A-Za-z_]\w*)(?:\.|->)empty\(\)$/i) ||
            cond.match(/^([A-Za-z_]\w*)(?:\.|->)size\(\)>0$/i);

        if (!match) {
            return null;
        }

        const name = match[1];

        const kind = String(
            this.declarations.get(name)?.kind || ''
        ).toLowerCase();

        if (!['queue', 'stack', 'priority_queue'].includes(kind)) {
            return null;
        }

        let hasEdgeLoop = false;
        let lazyPush = false;

        const visit = (list, insideEdge) => {
            for (const node of list || []) {
                if (!node) continue;

                const isEdge =
                    node.type === NodeType.LOOP &&
                    node.meta?.isGraphEdgeLoop;

                if (isEdge) {
                    hasEdgeLoop = true;
                }

                if (
                    insideEdge &&
                    node.type === NodeType.CALL &&
                    node.object === name &&
                    /^(push|push_back|emplace|emplace_back|enqueue|insert)$/i.test(
                        node.callee
                    )
                ) {
                    lazyPush = true;
                }

                const nested = insideEdge || isEdge;

                visit(node.body, nested);
                visit(node.thenBranch, nested);
                visit(node.elseBranch, nested);

                for (const branch of node.elseIfBranches || []) {
                    visit(branch.body, nested);
                }
            }
        };

        visit(loopNode.body, false);

        let bound = Complexity.of(
            hasEdgeLoop ? 'V' : this.primaryVar,
            1
        );

        if (kind === 'priority_queue' && lazyPush) {
            bound = bound.add(Complexity.of('E', 1));
        }

        return { name, kind, bound };
    }


    // ========================================================
    // ESTIMATE LOOP ITERATIONS
    // ========================================================

    estimateLoopCount(loopNode) {

        const meta = loopNode.meta || {};

        const to = String(meta.to || '');

        const step = meta.step || {};

        const condition = String(
            loopNode.condition || ''
        );

        const update = String(
            loopNode.update || ''
        );

        const iterator = String(
            meta.iterator || 'i'
        );

        const bound = to || condition;

        const variable = this.extractVarName(bound);


        // ----------------------------------------------------
        // Graph edge traversal
        // ----------------------------------------------------

        if (meta.isGraphEdgeLoop) {
            if (this.worklistDepth > 0) {
                return O_1;
            }

            return Complexity.of('E', 1);
        }


        // ----------------------------------------------------
        // Square-root loop
        // ----------------------------------------------------

        if (
            meta.boundType === 'sqrt' ||
            /sqrt\s*\(/i.test(condition) ||
            /sqrt\s*\(/i.test(to) ||
            new RegExp(
                `${iterator}\\s*\\*\\s*${iterator}`
            ).test(condition)
        ) {

            return Complexity.sqrt(variable);
        }


        // ----------------------------------------------------
        // Repeated squaring
        // ----------------------------------------------------

        if (
            step.type === 'square' ||
            step.type === 'sqrt'
        ) {

            return Complexity.loglog(variable);
        }


        // ----------------------------------------------------
        // Multiplicative / divisive loop
        // ----------------------------------------------------

        if (
            step.type === 'multiply' ||
            step.type === 'divide' ||
            /\*=|\/=|<<=|>>=/.test(update)
        ) {

            return Complexity.log(variable);
        }


        // ----------------------------------------------------
        // Binary search / halving
        // ----------------------------------------------------

        if (
            loopNode.loopType === 'while' &&
            (
                /low\s*<=\s*high/i.test(condition) ||
                /left\s*<=\s*right/i.test(condition) ||
                /\/=\s*2|>>=\s*1/.test(update)
            )
        ) {

            return Complexity.log(variable);
        }


        // ----------------------------------------------------
        // Default linear loop
        // ----------------------------------------------------

        return Complexity.of(variable, 1);
    }


    // ========================================================
    // ESTIMATE ARRAY DIMENSION
    // ========================================================

    estimateDimension(expression, declName = '') {

        const text = String(
            expression || ''
        ).trim();

        if (!text) {
            return O_1;
        }

        // Fixed-size dimension.
        if (/^\d+$/.test(text)) {
            return O_1;
        }

        // sqrt(n), log(n), n*m, and n+m.
        return estimateExpressionComplexity(text);
    }


    // ========================================================
    // EXTRACT VARIABLE NAME
    // ========================================================

    extractVarName(expression) {

        const text = String(
            expression || ''
        ).trim();

        if (!text) {
            return this.primaryVar;
        }

        const identifiers = extractIdentifiers(text)
            .filter(name => {
                return !IGNORED_IDENTIFIERS.has(
                    name.toUpperCase()
                );
            })
            .map(normalizeName);

        if (identifiers.length === 0) {
            return this.primaryVar;
        }

        // Prefer graph-related variables if present.
        if (identifiers.includes('V')) {
            return 'V';
        }

        if (identifiers.includes('E')) {
            return 'E';
        }

        if (identifiers.includes('W')) {
            return 'W';
        }

        // Prefer a variable other than the loop iterator
        // when the expression contains multiple identifiers.
        const unique = [...new Set(identifiers)];

        return unique[0] || this.primaryVar;
    }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    SpaceAnalyzer
};