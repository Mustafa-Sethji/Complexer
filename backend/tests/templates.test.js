const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { analyzeCode } = require('../src/analyzer');

// Every preset template must analyze to the complexity it documents.
const EXPECTED = {
  cpp: {
    rec_factorial: ['O(n)', 'O(n)'],
    rec_fibonacci: ['O(phi^n)', 'O(n)'],
    rec_binary_search: ['O(log n)', 'O(log n)'],
    rec_merge_sort: ['O(n log n)', 'O(n)'],
    rec_quick_sort: ['O(n^2)', 'O(n)'],
    dp_fib_memo: ['O(n)', 'O(n)'],
    dp_fib_tab: ['O(n)', 'O(n)'],
    dp_knapsack: ['O(n*W)', 'O(n*W)'],
    dp_lcs: ['O(n*m)', 'O(n*m)'],
    dp_lis: ['O(n^2)', 'O(n)'],
    dp_coin_change: ['O(n*amount)', 'O(amount)'],
    dp_house_robber: ['O(n)', 'O(n)'],
    dp_climbing_stairs: ['O(n)', 'O(n)'],
    graph_dfs: ['O(V + E)', 'O(V)'],
    graph_bfs: ['O(V + E)', 'O(V)'],
    graph_connected_components: ['O(V + E)', 'O(V)'],
    graph_cycle_detection: ['O(V + E)', 'O(V)'],
    graph_bipartite: ['O(V + E)', 'O(V)'],
    graph_num_islands: ['O(n*m)', 'O(n*m)'],
    graph_topo_sort: ['O(V + E)', 'O(V)'],
    graph_dijkstra: ['O(E log V)', 'O(V + E)'],
    graph_dsu: ['O(α(n))', 'O(log n)'],
    graph_kruskal: ['O(E log V)', 'O(V)'],
    graph_prim: ['O(E log V)', 'O(V + E)'],
    bt_subsets: ['O(2^n)', 'O(n)'],
    bt_permutations: ['O(n!)', 'O(n)'],
    bt_comb_sum: ['O(n^target)', 'O(target)'],
    bt_nqueens: ['O(n!)', 'O(n)'],
    bt_sudoku: ['O(9^(n*n))', 'O(n*n)'],
    bt_rat_maze: ['O(4^(n^2))', 'O(n^2)'],
    sort_linear_search: ['O(n)', 'O(1)'],
    sort_binary_search: ['O(log n)', 'O(1)'],
    sort_heap_sort: ['O(n log n)', 'O(n)'],
    sort_counting_sort: ['O(n + k)', 'O(k)'],
    sq_valid_parentheses: ['O(n)', 'O(n)'],
    sq_min_stack: ['O(1)', 'O(n)'],
    sq_sliding_window: ['O(n)', 'O(n)'],
    tree_inorder: ['O(n)', 'O(h)'],
    tree_max_depth: ['O(n)', 'O(h)'],
    tree_level_order: ['O(n)', 'O(n)']
  },
  pseudocode: {
    pseudo_factorial: ['O(n)', 'O(n)'],
    pseudo_fibonacci: ['O(phi^n)', 'O(n)'],
    pseudo_merge_sort: ['O(n log n)', 'O(n)'],
    pseudo_dp_fib: ['O(n)', 'O(n)'],
    pseudo_dp_knapsack: ['O(n*W)', 'O(n*W)'],
    pseudo_dp_lcs: ['O(n*m)', 'O(n*m)'],
    pseudo_graph_dfs: ['O(V + E)', 'O(V)'],
    pseudo_graph_connected_components: ['O(V + E)', 'O(V)'],
    pseudo_topo_sort: ['O(V + E)', 'O(V)'],
    pseudo_binary_search: ['O(log n)', 'O(1)'],
    pseudo_nested_loops: ['O(n^2)', 'O(1)'],
    pseudo_queue_fifo: ['O(n)', 'O(n)'],
    pseudo_tree_traversal: ['O(n)', 'O(h)']
  }
};

test('Preset templates analyze to their documented complexity', async () => {
  const file = path.join(__dirname, '../../frontend/src/presets/index.js');
  const { PRESETS } = await import(pathToFileURL(file).href);

  for (const mode of Object.keys(EXPECTED)) {
    const ids = new Set(PRESETS[mode].map(p => p.id));

    // Every template must be covered by an expectation.
    for (const id of ids) {
      assert.ok(EXPECTED[mode][id], `missing expectation for ${mode}/${id}`);
    }

    for (const preset of PRESETS[mode]) {
      const result = analyzeCode(preset.code, mode);
      const [time, space] = EXPECTED[mode][preset.id];

      assert.ok(result.success, `${preset.id}: ${result.error}`);
      assert.strictEqual(result.timeComplexity, time, `${preset.id} time`);
      assert.strictEqual(result.spaceComplexity, space, `${preset.id} space`);
    }
  }
});

test('Pseudocode method calls: CALL q.push(x) / CALL q.pop() parse', () => {
  const code = `
  FUNCTION processQueue(n)
    DECLARE QUEUE q
    FOR i FROM 1 TO n DO
      CALL q.push(i)
    END FOR
    WHILE !q.empty() DO
      CALL q.pop()
    END WHILE
  END FUNCTION`;

  const result = analyzeCode(code, 'pseudocode');

  assert.ok(result.success, result.error);
  assert.strictEqual(result.timeComplexity, 'O(n)');
  assert.strictEqual(result.spaceComplexity, 'O(n)');
});

test('Recursive binary search over low/high -> O(log n) time, O(log n) space', () => {
  const code = `
  int bs(int arr[], int low, int high, int target) {
    if (low > high) return -1;
    int mid = (low + high) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] > target) return bs(arr, low, mid - 1, target);
    return bs(arr, mid + 1, high, target);
  }`;

  const result = analyzeCode(code, 'cpp');

  assert.strictEqual(result.timeComplexity, 'O(log n)');
  assert.strictEqual(result.spaceComplexity, 'O(log n)');
});
