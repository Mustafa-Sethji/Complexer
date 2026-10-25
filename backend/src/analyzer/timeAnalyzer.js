/**
 * Time Complexity Analyzer - Common IR
 *
 * Supports:
 * - FOR / WHILE / REPEAT loops
 * - Nested and dependent loops
 * - Logarithmic and square-root loops
 * - Built-in operations
 * - Stack, Queue, Map, Set, Priority Queue
 * - Helper functions
 * - Common graph algorithms
 */

const { NodeType } = require('../ir');

const {
    Complexity,
    O_1,
    O_LOG_N,
    O_N,
    O_N_LOG_N,
    O_V_PLUS_E,
    O_V2,
    O_E_LOG_V
} = require('../complexity/symbolic');


// ============================================================
// BUILT-IN OPERATIONS
// ============================================================

const BUILTIN_COSTS = {
    sort: {
        complexity: O_N_LOG_N,
        desc: 'sort -> O(n log n)'
    },

    stable_sort: {
        complexity: O_N_LOG_N,
        desc: 'stable_sort -> O(n log n)'
    },

    SORT: {
        complexity: O_N_LOG_N,
        desc: 'SORT -> O(n log n)'
    },

    binary_search: {
        complexity: O_LOG_N,
        desc: 'binary_search -> O(log n)'
    },

    lower_bound: {
        complexity: O_LOG_N,
        desc: 'lower_bound -> O(log n)'
    },

    upper_bound: {
        complexity: O_LOG_N,
        desc: 'upper_bound -> O(log n)'
    },

    BINARY_SEARCH: {
        complexity: O_LOG_N,
        desc: 'BINARY_SEARCH -> O(log n)'
    },

    find: {
        complexity: O_N,
        desc: 'find -> O(n)'
    },

    count: {
        complexity: O_N,
        desc: 'count -> O(n)'
    },

    accumulate: {
        complexity: O_N,
        desc: 'accumulate -> O(n)'
    },

    reverse: {
        complexity: O_N,
        desc: 'reverse -> O(n)'
    },

    SEARCH: {
        complexity: O_N,
        desc: 'SEARCH -> O(n)'
    },

    REVERSE: {
        complexity: O_N,
        desc: 'REVERSE -> O(n)'
    },

    push_back: {
        complexity: O_1,
        desc: 'push_back -> O(1) amortized'
    },

    PUSH: {
        complexity: O_1,
        desc: 'PUSH -> O(1)'
    },

    POP: {
        complexity: O_1,
        desc: 'POP -> O(1)'
    },

    TOP: {
        complexity: O_1,
        desc: 'TOP -> O(1)'
    },

    ENQUEUE: {
        complexity: O_1,
        desc: 'ENQUEUE -> O(1)'
    },

    DEQUEUE: {
        complexity: O_1,
        desc: 'DEQUEUE -> O(1)'
    },

    FRONT: {
        complexity: O_1,
        desc: 'FRONT -> O(1)'
    },

    EMPTY: {
        complexity: O_1,
        desc: 'EMPTY -> O(1)'
    },

    SIZE: {
        complexity: O_1,
        desc: 'SIZE -> O(1)'
    },

    map_insert: {
        complexity: O_LOG_N,
        desc: 'map insert -> O(log n)'
    },

    map_find: {
        complexity: O_LOG_N,
        desc: 'map find -> O(log n)'
    },

    map_erase: {
        complexity: O_LOG_N,
        desc: 'map erase -> O(log n)'
    },

    INSERT: {
        complexity: O_LOG_N,
        desc: 'INSERT -> O(log n)'
    },

    LOOKUP: {
        complexity: O_LOG_N,
        desc: 'LOOKUP -> O(log n)'
    },

    unordered_map_insert: {
        complexity: O_1,
        desc: 'unordered_map insert -> O(1) average'
    },

    unordered_map_find: {
        complexity: O_1,
        desc: 'unordered_map find -> O(1) average'
    },

    priority_queue_push: {
        complexity: O_LOG_N,
        desc: 'priority_queue push -> O(log n)'
    },

    priority_queue_pop: {
        complexity: O_LOG_N,
        desc: 'priority_queue pop -> O(log n)'
    },

    substr: {
        complexity: O_N,
        desc: 'substr -> O(n)'
    }
};


const RANGE_VARIABLES = new Set([
    'low', 'high', 'lo', 'hi', 'left', 'right',
    'l', 'r', 'start', 'end', 'mid', 'begin'
]);


const CONTAINER_OPS = new Set([
    'PUSH',
    'POP',
    'TOP',
    'ENQUEUE',
    'DEQUEUE',
    'FRONT',
    'EMPTY',
    'SIZE'
]);


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function escapeRegex(text) {
    return String(text).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}


function containsVariable(text, variable) {
    if (!variable) {
        return false;
    }

    const regex = new RegExp(
        `\\b${escapeRegex(variable)}\\b`
    );

    return regex.test(String(text || ''));
}


function extractIdentifiers(text) {
    return String(text || '').match(
        /\b[A-Za-z_][A-Za-z_0-9]*\b/g
    ) || [];
}


function normalizeVariable(name) {
    if (name === 'v') return 'V';
    if (name === 'e') return 'E';

    return name;
}


function getFirstBoundVariable(
    expression,
    iterator,
    fallback = 'n'
) {
    const ignored = new Set([
        'AND',
        'OR',
        'NOT',
        'TRUE',
        'FALSE',
        'DO',
        'THEN',
        'TO',
        'FROM',
        'STEP',
        'SQRT',
        'LOG',
        'MIN',
        'MAX',
        'INT',
        'LONG',
        'RETURN'
    ]);

    const identifiers = extractIdentifiers(expression);

    for (const name of identifiers) {
        if (name === iterator) {
            continue;
        }

        if (ignored.has(name.toUpperCase())) {
            continue;
        }

        return normalizeVariable(name);
    }

    return fallback;
}


// ============================================================
// TIME ANALYZER
// ============================================================

class TimeAnalyzer {

    constructor(options = {}) {
        this.primaryVar = options.primaryVar || 'n';

        this.functionRegistry =
            options.functionRegistry || new Map();

        this.callStack =
            options.callStack || new Set();

        this.knownVariables = new Set([
            this.primaryVar,
            'n',
            'm',
            'k',
            'V',
            'E',
            'W'
        ]);

        this.declarations = new Map();

        this.explanations = [];
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
    // ANALYZE BLOCK
    // ========================================================

    analyzeBlock(
        statements,
        outerContext = {}
    ) {
        const graphResult =
            this.detectBlockGraphAlgorithms(
                statements || []
            );

        if (graphResult) {
            return graphResult;
        }

        const result =
            this.analyzeBlockInternal(
                statements || [],
                outerContext
            );

        return {
            complexity: result.complexity,
            explanations: this.explanations
        };
    }


    // ========================================================
    // GRAPH ALGORITHMS
    // ========================================================

    detectBlockGraphAlgorithms(statements) {
        const text = JSON.stringify(statements || []);

        const adj = /(?:adj|graph)\s*\[/i.test(text);
        const matrix = /matrix\s*\[/i.test(text);
        const hasPQ = /priority_queue/i.test(text);

        const hasQueue =
            /\bqueue\b/i.test(text) && !hasPQ;

        const hasWhile =
            /"loopType":"(?:while|do_while)"/i.test(text);

        const hasVisited =
            /visited|\bvis\b/i.test(text);

        let complexity = null;
        let rule = '';
        let details = '';

        // Dijkstra / Prim
        if (hasPQ && adj && hasWhile) {
            complexity = O_E_LOG_V;

            rule = 'Dijkstra / Prim Algorithm';

            details =
                'Priority queue with adjacency traversal -> O(E log V)';
        }

        // Kruskal
        else if (
            /sort/i.test(text) &&
            /edges?/i.test(text) &&
            /find|unite|union|parent|dsu/i.test(text)
        ) {
            complexity = O_E_LOG_V;

            rule = "Kruskal's Algorithm";

            details =
                'Sorting edges with DSU -> O(E log V)';
        }

        // Kahn's algorithm
        else if (
            /indegree|in_degree/i.test(text) &&
            hasQueue &&
            adj
        ) {
            complexity = O_V_PLUS_E;

            rule = "Topological Sort (Kahn's Algorithm)";

            details =
                'Vertices and edges processed -> O(V + E)';
        }

        // BFS adjacency list
        else if (
            hasQueue &&
            hasVisited &&
            adj &&
            hasWhile
        ) {
            complexity = O_V_PLUS_E;

            rule = 'BFS (Adjacency List)';

            details =
                'Each vertex and edge processed -> O(V + E)';
        }

        // BFS adjacency matrix
        else if (
            hasQueue &&
            hasVisited &&
            matrix &&
            hasWhile
        ) {
            complexity = O_V2;

            rule = 'BFS (Adjacency Matrix)';

            details =
                'Matrix traversal -> O(V^2)';
        }

        if (!complexity) {
            return null;
        }

        this.addExplanation(
            statements[0]?.loc?.line || 1,
            rule,
            complexity,
            details
        );

        return {
            complexity,
            explanations: this.explanations
        };
    }


    // ========================================================
    // ANALYZE STATEMENT
    // ========================================================

    analyzeStatement(
        stmt,
        outerContext = {}
    ) {
        if (!stmt) {
            return {
                complexity: O_1
            };
        }

        const line = stmt.loc?.line || 'unknown';

        switch (stmt.type) {

            case NodeType.DECLARE: {
                this.declarations.set(
                    stmt.name,
                    stmt
                );

                return {
                    complexity: this.checkEmbeddedCalls(
                        stmt.initialValue || '',
                        line
                    )
                };
            }

            case NodeType.ASSIGN: {
                return {
                    complexity: this.checkEmbeddedCalls(
                        stmt.value || '',
                        line
                    )
                };
            }

            case NodeType.RETURN: {
                return {
                    complexity: this.checkEmbeddedCalls(
                        stmt.value || '',
                        line
                    )
                };
            }

            case NodeType.EXPRESSION: {
                return {
                    complexity: this.checkEmbeddedCalls(
                        stmt.expr || '',
                        line
                    )
                };
            }

            case NodeType.CALL: {
                return this.analyzeCall(stmt);
            }

            case NodeType.IF_ELSE: {
                return this.analyzeIfElse(
                    stmt,
                    outerContext
                );
            }

            case NodeType.LOOP: {
                return this.analyzeLoop(
                    stmt,
                    outerContext
                );
            }

            default: {
                return {
                    complexity: O_1
                };
            }
        }
    }


    // ========================================================
    // CONTAINER COST
    // ========================================================

    containerCost(
        operation,
        containerName
    ) {
        const decl = this.declarations.get(containerName);

        const op = String(operation || '').toUpperCase();

        if (
            !decl ||
            !CONTAINER_OPS.has(op)
        ) {
            return null;
        }

        const kind = String(
            decl.kind || ''
        ).toLowerCase();

        if (kind === 'priority_queue') {
            if (
                ['PUSH', 'POP', 'ENQUEUE', 'DEQUEUE'].includes(op)
            ) {
                return Complexity.log(this.primaryVar);
            }

            return O_1;
        }

        if (
            kind === 'stack' ||
            kind === 'queue'
        ) {
            return O_1;
        }

        return null;
    }


    // ========================================================
    // ANALYZE FUNCTION CALL
    // ========================================================

    analyzeCall(callNode) {
        const line = callNode.loc?.line || 'unknown';

        const callee = String(
            callNode.callee || ''
        );

        const obj = callNode.object;
        const args = callNode.args || [];

        const upper = callee.toUpperCase();

        const containerName =
            obj || String(args[0] || '').trim();

        // Container operation
        const containerComplexity =
            this.containerCost(
                upper,
                containerName
            );

        if (containerComplexity) {
            const kind =
                this.declarations.get(containerName)?.kind ||
                'container';

            this.addExplanation(
                line,
                `Container operation '${upper}'`,
                containerComplexity,
                `${kind} ${upper} -> ${containerComplexity.toBigO()}`
            );

            return {
                complexity: containerComplexity
            };
        }

        // Helper function
        if (this.functionRegistry.has(callee)) {

            // Avoid infinite helper-function recursion.
            if (this.callStack.has(callee)) {
                return {
                    complexity: O_1,
                    isRecursiveCall: true
                };
            }

            const helperFn =
                this.functionRegistry.get(callee);

            const helperAnalyzer = new TimeAnalyzer({
                primaryVar: this.primaryVar,

                functionRegistry:
                    this.functionRegistry,

                callStack: new Set([
                    ...this.callStack,
                    callee
                ])
            });

            const helperResult =
                helperAnalyzer.analyzeBlock(
                    helperFn.body || []
                );

            this.addExplanation(
                line,
                `Call to helper '${callee}'`,
                helperResult.complexity,
                `Helper function -> ${helperResult.complexity.toBigO()}`
            );

            this.explanations.push(
                ...helperResult.explanations
            );

            return {
                complexity: helperResult.complexity
            };
        }

        let matched = null;

        // Map / Set / Priority Queue
        if (obj) {
            const decl = this.declarations.get(obj);

            if (decl) {
                const kind = String(
                    decl.kind || ''
                ).toLowerCase();

                if (
                    kind === 'map' ||
                    kind === 'set'
                ) {
                    if (
                        ['insert', 'find', 'erase', 'count'].includes(callee)
                    ) {
                        matched =
                            BUILTIN_COSTS['map_' + callee] ||
                            BUILTIN_COSTS.map_insert;
                    }
                }

                else if (
                    kind === 'unordered_map' ||
                    kind === 'unordered_set'
                ) {
                    if (
                        ['insert', 'find', 'erase', 'count'].includes(callee)
                    ) {
                        matched = callee === 'find'
                            ? BUILTIN_COSTS.unordered_map_find
                            : BUILTIN_COSTS.unordered_map_insert;
                    }
                }

                else if (
                    kind === 'priority_queue'
                ) {
                    if (
                        ['push', 'pop'].includes(callee)
                    ) {
                        matched =
                            BUILTIN_COSTS[
                                'priority_queue_' + callee
                            ];
                    }
                }
            }
        }

        // Memoization lookup
        if (
            upper === 'LOOKUP' &&
            /memo|dp/i.test(
                String(args[0] || '')
            )
        ) {
            return {
                complexity: O_1
            };
        }

        // Built-in operation
        if (!matched) {
            matched =
                BUILTIN_COSTS[callee] ||
                BUILTIN_COSTS[upper] ||
                null;
        }

        if (matched) {
            this.addExplanation(
                line,
                `Builtin call '${callee}'`,
                matched.complexity,
                matched.desc
            );

            return {
                complexity: matched.complexity
            };
        }

        // Unknown calls are assumed O(1).
        // Their real complexity cannot be determined here.
        return {
            complexity: O_1
        };
    }


    // ========================================================
    // BUILT-IN CALLS INSIDE EXPRESSIONS
    // ========================================================

    checkEmbeddedCalls(text, line) {
        const source = String(text || '');

        let cost = O_1;

        const regex =
            /\b([A-Za-z_][A-Za-z_0-9]*)\s*\(\s*([A-Za-z_][A-Za-z_0-9]*)?/g;

        let match;

        while (
            (match = regex.exec(source)) !== null
        ) {
            const name = match[1];

            const upper = name.toUpperCase();

            const containerName = match[2] || '';

            if (
                upper === 'LOOKUP' &&
                /^(memo|dp)$/i.test(containerName)
            ) {
                continue;
            }

            const special = this.containerCost(
                upper,
                containerName
            );

            const info =
                BUILTIN_COSTS[name] ||
                BUILTIN_COSTS[upper];

            const current =
                special || info?.complexity;

            if (!current) {
                continue;
            }

            this.addExplanation(
                line,
                `Built-in operation '${name}'`,
                current,
                special
                    ? `${containerName}: ${upper} -> ${current.toBigO()}`
                    : info.desc
            );

            cost = cost.add(current);
        }

        return cost;
    }


    // ========================================================
    // IF / ELSE
    // ========================================================

    analyzeIfElse(
        ifNode,
        outerContext
    ) {
        const line = ifNode.loc?.line || 'unknown';

        let conditionCost = this.checkEmbeddedCalls(
            ifNode.condition || '',
            line
        );

        let maxBranch =
            this.analyzeBlockInternal(
                ifNode.thenBranch || [],
                outerContext
            ).complexity;

        for (
            const branch of ifNode.elseIfBranches || []
        ) {
            conditionCost = conditionCost.add(
                this.checkEmbeddedCalls(
                    branch.condition || '',
                    line
                )
            );

            const branchCost =
                this.analyzeBlockInternal(
                    branch.body || [],
                    outerContext
                ).complexity;

            maxBranch = maxBranch.max(branchCost);
        }

        if (ifNode.elseBranch?.length) {
            const elseCost =
                this.analyzeBlockInternal(
                    ifNode.elseBranch,
                    outerContext
                ).complexity;

            maxBranch = maxBranch.max(elseCost);
        }

        const total = conditionCost.add(maxBranch);

        this.addExplanation(
            line,
            'If/else conditional branching',
            total,
            `Worst-case branch -> ${total.toBigO()}`
        );

        return {
            complexity: total
        };
    }


    // ========================================================
    // LOOP ANALYSIS
    // ========================================================

    analyzeLoop(
        loopNode,
        outerContext = {}
    ) {
        const line = loopNode.loc?.line || 'unknown';

        const components =
            this.checkConnectedComponentsPattern(
                loopNode
            );

        if (components) {
            this.addExplanation(
                line,
                components.rule,
                components.complexity,
                components.details
            );

            return {
                complexity: components.complexity
            };
        }

        const worklist =
            this.checkWorklistPattern(
                loopNode,
                outerContext
            );

        if (worklist) {
            this.addExplanation(
                line,
                worklist.rule,
                worklist.complexity,
                worklist.details
            );

            return {
                complexity: worklist.complexity
            };
        }

        const amortized =
            this.checkAmortizedPopLoop(
                loopNode,
                outerContext
            );

        if (amortized) {
            this.addExplanation(
                line,
                amortized.rule,
                amortized.complexity,
                amortized.details
            );

            return {
                complexity: amortized.complexity
            };
        }

        const iter =
            this.determineLoopIterations(
                loopNode,
                outerContext
            );

        const context = {
            ...outerContext,

            parentLoop: {
                iterator: iter.iterator,
                bound: iter.boundVar,
                line
            }
        };

        const body =
            this.analyzeBlockInternal(
                loopNode.body || [],
                context
            );

        const condCost =
            this.checkEmbeddedCalls(
                loopNode.condition || '',
                line
            );

        let complexity;
        let rule;
        let details;
        let extra = null;

        if (iter.isGraphEdge) {
            complexity = O_V_PLUS_E;

            rule = 'Adjacency list edge traversal';

            details =
                'All graph edges traversed -> O(V + E)';
        }

        else if (
            outerContext.parentLoop &&
            /matrix\s*\[|graph\s*\[.*\]\s*\[/i.test(
                JSON.stringify(loopNode.body || [])
            )
        ) {
            complexity = O_V2;

            rule = 'Adjacency matrix traversal';

            details =
                'Nested matrix traversal -> O(V^2)';
        }

        else if (
            outerContext.parentLoop &&
            /^[A-Za-z_]\w*\s*\[.+\]$/.test(
                this.getLoopBoundText(loopNode)
            )
        ) {
            // Inner loop bounded by an array element, e.g. count[i].
            // The element values add up to at most the input size over
            // ALL outer iterations, so it contributes O(n) once in total.
            complexity = body.complexity.add(condCost);

            extra = Complexity.of(this.primaryVar, 1).multiply(
                body.complexity
            );

            rule = 'Data-dependent inner loop (amortized)';

            details =
                `Bound '${this.getLoopBoundText(loopNode)}' sums to at most ` +
                `O(${this.primaryVar}) across all outer iterations`;
        }

        else {
            complexity = iter.iterations.multiply(
                body.complexity.add(condCost)
            );

            rule = iter.isHarmonic
                ? 'Harmonic loop pattern'
                : iter.isDependent
                    ? 'Dependent nested loop'
                    : `${String(
                        loopNode.loopType || 'for'
                    ).toUpperCase()} loop`;

            details =
                `${iter.ruleDetails} ` +
                `(${iter.iterations.toBigO()}) * ` +
                `body (${body.complexity.toBigO()}) ` +
                `-> ${complexity.toBigO()}`;
        }

        // An amortized child loop contributes its total once.
        if (body.extra) {
            complexity = complexity.add(body.extra);
        }

        this.addExplanation(
            line,
            rule,
            complexity,
            details
        );

        return extra
            ? { complexity, extra }
            : { complexity };
    }


    // ========================================================
    // LOOP HELPERS
    // ========================================================

    getLoopBoundText(loopNode) {
        const meta = loopNode.meta || {};

        if (meta.to != null && String(meta.to).trim()) {
            return String(meta.to).trim();
        }

        const match = String(loopNode.condition || '').match(
            /(?:<=|<)\s*(.+)$/
        );

        return match ? match[1].trim() : '';
    }

    // Splits a loop body into (statements without graph-edge loops)
    // and the graph-edge loops that were removed.
    splitEdgeLoops(statements, edgeLoops) {
        const rest = [];

        for (const stmt of statements || []) {
            if (!stmt) continue;

            if (
                stmt.type === NodeType.LOOP &&
                stmt.meta?.isGraphEdgeLoop
            ) {
                edgeLoops.push(stmt);
                continue;
            }

            if (stmt.type === NodeType.IF_ELSE) {
                rest.push({
                    ...stmt,
                    thenBranch: this.splitEdgeLoops(
                        stmt.thenBranch || [],
                        edgeLoops
                    ),
                    elseBranch: this.splitEdgeLoops(
                        stmt.elseBranch || [],
                        edgeLoops
                    ),
                    elseIfBranches: (stmt.elseIfBranches || []).map(
                        branch => ({
                            ...branch,
                            body: this.splitEdgeLoops(
                                branch.body || [],
                                edgeLoops
                            )
                        })
                    )
                });
                continue;
            }

            rest.push(stmt);
        }

        return rest;
    }

    bodyPushes(statements, containerName) {
        let found = false;

        const visit = list => {
            for (const stmt of list || []) {
                if (!stmt || found) continue;

                if (
                    stmt.type === NodeType.CALL &&
                    stmt.object === containerName &&
                    /^(push|push_back|push_front|emplace|emplace_back|enqueue|insert)$/i.test(
                        stmt.callee
                    )
                ) {
                    found = true;
                }

                visit(stmt.body);
                visit(stmt.thenBranch);
                visit(stmt.elseBranch);

                for (const branch of stmt.elseIfBranches || []) {
                    visit(branch.body);
                }
            }
        };

        visit(statements);

        return found;
    }

    // ========================================================
    // WORKLIST LOOPS:  while (!q.empty()) { pop; push neighbours }
    //
    // Every element is pushed (and therefore popped) a bounded number
    // of times, so the loop does NOT run "V times" with the whole
    // adjacency scan inside. Total cost is
    //     (#pops) * (per-pop work)  +  E * (per-edge work)
    // ========================================================

    checkWorklistPattern(loopNode, outerContext = {}) {
        if (loopNode.loopType !== 'while') {
            return null;
        }

        const cond = String(loopNode.condition || '').replace(/\s+/g, '');

        const match =
            cond.match(/^!([A-Za-z_]\w*)(?:\.|->)empty\(\)$/i) ||
            cond.match(/^([A-Za-z_]\w*)(?:\.|->)size\(\)>0$/i);

        if (!match) {
            return null;
        }

        const name = match[1];
        const decl = this.declarations.get(name);

        const kind = String(decl?.kind || '').toLowerCase();

        if (!['queue', 'stack', 'priority_queue'].includes(kind)) {
            return null;
        }

        const line = loopNode.loc?.line || 'unknown';

        const edgeLoops = [];

        const rest = this.splitEdgeLoops(
            loopNode.body || [],
            edgeLoops
        );

        const sizeVar = edgeLoops.length
            ? 'V'
            : this.primaryVar;

        const context = {
            ...outerContext,
            parentLoop: {
                iterator: '',
                bound: sizeVar,
                line
            }
        };

        // Number of pops = number of pushes.
        let pops = Complexity.of(sizeVar, 1);

        const lazyPush =
            kind === 'priority_queue' &&
            edgeLoops.some(loop => this.bodyPushes(loop.body, name));

        if (lazyPush) {
            // Lazy-insertion priority queue: one entry per successful
            // relaxation, so up to E extra entries.
            pops = pops.add(Complexity.of('E', 1));
        }

        const perPop = this.analyzeBlockInternal(rest, context).complexity;

        let total = pops.multiply(perPop);

        for (const edgeLoop of edgeLoops) {
            const perEdge = this.analyzeBlockInternal(
                edgeLoop.body || [],
                context
            ).complexity;

            total = total.add(
                Complexity.of('E', 1).multiply(perEdge)
            );
        }

        return {
            rule: `Worklist loop over '${name}'`,
            complexity: total,
            details:
                `Each element of '${name}' is processed once: ` +
                `${pops.toBigO()} pops x per-pop work ` +
                `(${perPop.toBigO()})` +
                (edgeLoops.length
                    ? ' + E edge relaxations'
                    : '') +
                ` -> ${total.toBigO()}`
        };
    }

    // ========================================================
    // AMORTIZED POP LOOPS (monotonic stack / deque)
    //
    // for (...) { while (!dq.empty() && cond) dq.pop_back(); dq.push_back(i); }
    // Total pops can never exceed total pushes, so the inner while is
    // amortized O(1) per outer iteration.
    // ========================================================

    checkAmortizedPopLoop(loopNode, outerContext = {}) {
        if (
            loopNode.loopType !== 'while' ||
            !outerContext.parentLoop
        ) {
            return null;
        }

        const cond = String(loopNode.condition || '').replace(/\s+/g, '');

        const match = cond.match(
            /!([A-Za-z_]\w*)(?:\.|->)empty\(\)/i
        );

        if (!match) {
            return null;
        }

        const name = match[1];
        const kind = String(
            this.declarations.get(name)?.kind || ''
        ).toLowerCase();

        if (!['queue', 'stack'].includes(kind)) {
            return null;
        }

        const pops = (loopNode.body || []).some(
            stmt =>
                stmt.type === NodeType.CALL &&
                stmt.object === name &&
                /^(pop|pop_back|pop_front|dequeue)$/i.test(stmt.callee)
        );

        if (!pops) {
            return null;
        }

        const perIteration = this.analyzeBlockInternal(
            loopNode.body || [],
            outerContext
        ).complexity;

        return {
            rule: `Amortized pop loop on '${name}'`,
            complexity: perIteration,
            details:
                `Pops from '${name}' never exceed its pushes, so the ` +
                `inner loop is amortized O(1) per outer iteration`
        };
    }


    // ========================================================
    // CONNECTED COMPONENTS
    // ========================================================

    checkConnectedComponentsPattern(loopNode) {
        if (!Array.isArray(loopNode.body)) {
            return null;
        }

        for (const stmt of loopNode.body) {
            if (stmt.type !== NodeType.IF_ELSE) {
                continue;
            }

            const cond = stmt.condition || '';

            const visitedRegex =
                /!\s*(?:visited|vis)\b|\b(?:visited|vis)\b\s*==\s*(?:false|0)/i;

            if (!visitedRegex.test(cond)) {
                continue;
            }

            for (
                const inner of stmt.thenBranch || []
            ) {
                if (
                    inner.type !== NodeType.CALL ||
                    !this.functionRegistry.has(inner.callee)
                ) {
                    continue;
                }

                const helper =
                    this.functionRegistry.get(
                        inner.callee
                    );

                const text = JSON.stringify(
                    helper.body || []
                );

                if (
                    /matrix\s*\[/i.test(text) &&
                    !/adj\s*\[/i.test(text)
                ) {
                    return {
                        rule: 'Connected Components (Adjacency Matrix)',

                        complexity: O_V2,

                        details:
                            'DFS matrix traversal -> O(V^2)'
                    };
                }

                if (/grid\s*\[/i.test(text)) {
                    return {
                        rule: 'Grid Connected Components',

                        complexity: Complexity.of('n', 1).multiply(
                            Complexity.of('m', 1)
                        ),

                        details:
                            'Grid traversal -> O(n*m)'
                    };
                }

                return {
                    rule: 'Connected Components (Adjacency List)',

                    complexity: O_V_PLUS_E,

                    details:
                        'DFS traversal -> O(V + E)'
                };
            }
        }

        return null;
    }


    // ========================================================
    // DETERMINE LOOP ITERATIONS
    // ========================================================

    determineLoopIterations(
        loopNode,
        outerContext = {}
    ) {
        const meta = loopNode.meta || {};

        const cond = String(
            loopNode.condition || ''
        );

        const update = String(
            loopNode.update || ''
        );

        const init = String(
            loopNode.init || ''
        );

        // 1. Find the iterator.

        let iterator = String(
            meta.iterator || ''
        ).trim();

        if (!iterator && init) {
            const match = init.match(
                /\b([A-Za-z_]\w*)\s*=/
            );

            if (match) {
                iterator = match[1];
            }
        }

        if (!iterator && cond) {
            const match = cond.match(
                /^\s*([A-Za-z_]\w*)\s*(?:<=|<|>=|>|!=)/
            );

            if (match) {
                iterator = match[1];
            }
        }

        if (!iterator) {
            iterator = 'i';
        }


        // 2. Find loop start and bound.

        let from = meta.from != null
            ? String(meta.from)
            : '';

        let to = meta.to != null
            ? String(meta.to)
            : '';

        if (!from && init) {
            const match = init.match(
                /=\s*(.+)$/
            );

            if (match) {
                from = match[1].trim();
            }
        }

        if (!to && cond) {
            const match = cond.match(
                /(?:<=|<|>=|>)\s*(.+)$/
            );

            if (match) {
                to = match[1].trim();
            }
        }

        if (!from) {
            from = '0';
        }

        if (!to) {
            to = this.primaryVar;
        }


        // 3. Find step.

        const step = meta.step || {
            type: 'increment',
            value: 1
        };


        // 4. Identify the input-size variable.
        // The iterator itself must not be treated as input size.

        let boundVar = getFirstBoundVariable(
            to,
            iterator,
            ''
        );

        if (!boundVar) {
            boundVar = getFirstBoundVariable(
                cond,
                iterator,
                this.primaryVar
            );
        }

        if (!boundVar) {
            boundVar = this.primaryVar;
        }

        // A bound that is the outer loop's iterator (for j < i inside
        // for i < n) is bounded by the outer loop's own bound.
        if (
            outerContext.parentLoop &&
            boundVar === outerContext.parentLoop.iterator &&
            outerContext.parentLoop.bound
        ) {
            boundVar = outerContext.parentLoop.bound;
        }

        // Search-range variables (low/high/left/right...) are positions
        // inside the input, so the problem size is the input size.
        if (RANGE_VARIABLES.has(String(boundVar).toLowerCase())) {
            boundVar = this.primaryVar;
        }


        // 5. Detect dependent / harmonic loops.

        let isDependent = false;
        let isHarmonic = false;

        const parent =
            outerContext.parentLoop?.iterator;

        if (parent) {
            isDependent =
                containsVariable(from, parent) ||
                containsVariable(to, parent) ||
                containsVariable(cond, parent);

            isHarmonic =
                step.type === 'harmonic' ||
                containsVariable(
                    step.value || '',
                    parent
                ) ||
                containsVariable(update, parent);
        }


        // Result helper.

        const result = (
            iterations,
            ruleDetails,
            extras = {}
        ) => ({
            iterator,
            boundVar,
            iterations,
            isDependent,
            isHarmonic,
            isGraphEdge: false,
            stepExpr: update,
            ruleDetails,
            ...extras
        });


        // 6. Graph edge loop.

        if (meta.isGraphEdgeLoop) {
            return result(
                Complexity.of('E', 1),
                'Traversing adjacency edges',
                {
                    boundVar: 'E',
                    isGraphEdge: true,
                    isDependent: false,
                    isHarmonic: false
                }
            );
        }


        // 7. Harmonic loop.

        if (
            isHarmonic ||
            step.type === 'harmonic'
        ) {
            return result(
                Complexity.log(
                    outerContext.parentLoop?.bound ||
                    boundVar
                ),
                'Harmonic inner-loop step'
            );
        }


        // 8. Square-root loop.

        if (
            meta.boundType === 'sqrt' ||
            /sqrt\s*\(/i.test(cond) ||
            new RegExp(
                `${escapeRegex(iterator)}\\s*\\*\\s*${escapeRegex(iterator)}\\s*(?:<=|<)`
            ).test(cond)
        ) {
            return result(
                Complexity.sqrt(boundVar),
                'Square-root bound'
            );
        }


        // 9. Repeated squaring.

        if (
            step.type === 'square' ||
            new RegExp(
                `${escapeRegex(iterator)}\\s*\\*=\\s*${escapeRegex(iterator)}`
            ).test(update) ||
            new RegExp(
                `${escapeRegex(iterator)}\\s*=\\s*${escapeRegex(iterator)}\\s*\\*\\s*${escapeRegex(iterator)}`
            ).test(update)
        ) {
            return result(
                Complexity.loglog(boundVar),
                'Repeated squaring'
            );
        }


        // 10. Multiplication / division loops.

        if (
            ['multiply', 'divide'].includes(step.type) ||
            /\*=|\/=|<<=|>>=/.test(update)
        ) {
            return result(
                Complexity.log(boundVar),
                'Multiplicative/divisive step'
            );
        }


        // 11. Common binary-search / halving loops.

        if (
            ['while', 'do_while'].includes(
                loopNode.loopType
            )
        ) {
            const bodyText = JSON.stringify(
                loopNode.body || []
            );

            if (
                /mid\s*=|\/=\s*2|>>=\s*1|n\s*\/\s*2/i.test(bodyText) ||
                /low\s*<=\s*high|left\s*<=\s*right/i.test(cond)
            ) {
                return result(
                    Complexity.log(boundVar),
                    'Binary search / halving'
                );
            }
        }


        // 12. Default linear loop.

        return result(
            Complexity.of(boundVar, 1),
            `Linear loop over '${boundVar}'`
        );
    }


    // ========================================================
    // INTERNAL BLOCK ANALYSIS
    // ========================================================

    analyzeBlockInternal(
        statements,
        outerContext = {}
    ) {
        let complexity = O_1;
        let extra = null;

        for (const stmt of statements || []) {
            const result = this.analyzeStatement(
                stmt,
                outerContext
            );

            if (result?.complexity) {
                complexity = complexity.add(
                    result.complexity
                );
            }

            if (result?.extra) {
                extra = extra
                    ? extra.add(result.extra)
                    : result.extra;
            }
        }

        return extra
            ? { complexity, extra }
            : { complexity };
    }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    TimeAnalyzer,
    BUILTIN_COSTS
};