const test = require('node:test');
const assert = require('node:assert');
const { analyzeCode } = require('../src/analyzer');

test('Requirement 1: Multiple functions detection and selection', () => {
  const code = `
  void helper(int n) {
    for (int i = 0; i < n; i++) {}
  }
  void mainAlgorithm(int n) {
    helper(n);
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.success, true);
  assert.deepStrictEqual(result.functions, ['helper', 'mainAlgorithm']);
  assert.strictEqual(result.selectedFunction, 'mainAlgorithm');
  assert.strictEqual(result.timeComplexity, 'O(n)');

  // Test selecting helper explicitly
  const helperResult = analyzeCode(code, 'cpp', 'helper');
  assert.strictEqual(helperResult.selectedFunction, 'helper');
  assert.strictEqual(helperResult.timeComplexity, 'O(n)');
});

test('Requirement 1 & Helper Functions: Helper function complexity is included in caller', () => {
  const code = `
  void linearHelper(int n) {
    for (int i = 0; i < n; i++) {}
  }
  void outerQuadratic(int n) {
    for (int i = 0; i < n; i++) {
      linearHelper(n);
    }
  }
  `;
  const result = analyzeCode(code, 'cpp', 'outerQuadratic');
  assert.strictEqual(result.timeComplexity, 'O(n^2)');
});

test('Requirement 2: Graph DFS on Adjacency List -> O(V + E) time, O(V) space', () => {
  const code = `
  void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited) {
    visited[u] = true;
    for (int v : adj[u]) {
      if (!visited[v]) {
        dfs(v, adj, visited);
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(V + E)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});

test('Requirement 2: Graph DFS on Adjacency Matrix -> O(V^2) time, O(V) space', () => {
  const code = `
  void dfsMatrix(int u, int n, vector<vector<int>>& matrix, vector<bool>& visited) {
    visited[u] = true;
    for (int v = 0; v < n; v++) {
      if (matrix[u][v] && !visited[v]) {
        dfsMatrix(v, n, matrix, visited);
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(V^2)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});

test('Requirement 2: Connected Components Example (DFS + visited loop) -> O(V + E) time, O(V) space', () => {
  const code = `
  void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited) {
    visited[u] = true;
    for (int v : adj[u]) {
      if (!visited[v]) {
        dfs(v, adj, visited);
      }
    }
  }

  int countComponents(int n, vector<vector<int>>& adj) {
    vector<bool> visited(n, false);
    int count = 0;
    for (int i = 0; i < n; i++) {
      if (!visited[i]) {
        dfs(i, adj, visited);
        count++;
      }
    }
    return count;
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.selectedFunction, 'countComponents');
  assert.strictEqual(result.timeComplexity, 'O(V + E)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});

test('Requirement 2: Connected Components with Adjacency Matrix -> O(V^2) time, O(V) space', () => {
  const code = `
  void dfs(int u, int n, vector<vector<int>>& matrix, vector<bool>& visited) {
    visited[u] = true;
    for (int v = 0; v < n; v++) {
      if (matrix[u][v] && !visited[v]) {
        dfs(v, n, matrix, visited);
      }
    }
  }

  int countComponents(int n, vector<vector<int>>& matrix) {
    vector<bool> visited(n, false);
    int count = 0;
    for (int i = 0; i < n; i++) {
      if (!visited[i]) {
        dfs(i, n, matrix, visited);
        count++;
      }
    }
    return count;
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(V^2)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});

test('Requirement 2: Graph BFS on Adjacency List -> O(V + E) time, O(V) space', () => {
  const code = `
  void bfs(int start, int V, vector<vector<int>>& adj) {
    vector<bool> visited(V, false);
    queue<int> q;
    visited[start] = true;
    q.push(start);
    while (!q.empty()) {
      int u = q.front();
      q.pop();
      for (int v : adj[u]) {
        if (!visited[v]) {
          visited[v] = true;
          q.push(v);
        }
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(V + E)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});

test('Requirement 2: Number of Islands (2D Grid DFS) -> O(n*m) time, O(n*m) space', () => {
  const code = `
  void dfs(vector<vector<char>>& grid, int r, int c, int n, int m) {
    if (r < 0 || r >= n || c < 0 || c >= m || grid[r][c] != '1') return;
    grid[r][c] = '0';
    dfs(grid, r + 1, c, n, m);
    dfs(grid, r - 1, c, n, m);
    dfs(grid, r, c + 1, n, m);
    dfs(grid, r, c - 1, n, m);
  }

  int numIslands(vector<vector<char>>& grid) {
    int n = grid.size(), m = grid[0].size();
    int count = 0;
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < m; j++) {
        if (grid[i][j] == '1') {
          count++;
          dfs(grid, i, j, n, m);
        }
      }
    }
    return count;
  }
  `;
  const result = analyzeCode(code, 'cpp', 'numIslands');
  assert.strictEqual(result.timeComplexity, 'O(n*m)');
});

test('Requirement 2: Topological Sort (Kahn\'s algorithm) -> O(V + E) time, O(V) space', () => {
  const code = `
  void topoSort(int V, vector<vector<int>>& adj) {
    vector<int> indegree(V, 0);
    for (int u = 0; u < V; u++) {
      for (int v : adj[u]) {
        indegree[v]++;
      }
    }
    queue<int> q;
    for (int i = 0; i < V; i++) {
      if (indegree[i] == 0) q.push(i);
    }
    while (!q.empty()) {
      int u = q.front();
      q.pop();
      for (int v : adj[u]) {
        indegree[v]--;
        if (indegree[v] == 0) q.push(v);
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(V + E)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});

test('Requirement 2: Dijkstra Algorithm (lazy priority queue) -> O(E log V) time, O(V + E) space', () => {
  const code = `
  void dijkstra(int src, int V, vector<vector<pair<int, int>>>& adj) {
    priority_queue<pair<int, int>> pq;
    vector<int> dist(V, 1000000);
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
      auto top = pq.top();
      pq.pop();
      int u = top.second;
      for (auto& edge : adj[u]) {
        int v = edge.first;
        int weight = edge.second;
        if (dist[u] + weight < dist[v]) {
          dist[v] = dist[u] + weight;
          pq.push({dist[v], v});
        }
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(E log V)');
  assert.strictEqual(result.spaceComplexity, 'O(V + E)');
});

test('Requirement 2: Kruskal MST with DSU -> O(E log V) time, O(V) space', () => {
  const code = `
  int kruskal(int V, vector<Edge>& edges) {
    sort(edges.begin(), edges.end());
    DSU dsu(V);
    int total = 0;
    for (auto& edge : edges) {
      if (dsu.find(edge.u) != dsu.find(edge.v)) {
        dsu.unite(edge.u, edge.v);
        total += edge.w;
      }
    }
    return total;
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(E log V)');
});

test('Requirement 2: DSU Find operation with path compression -> O(alpha(n)) amortized', () => {
  const code = `
  int find(int i, vector<int>& parent) {
    if (parent[i] == i) return i;
    return parent[i] = find(parent[i], parent);
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(α(n))');
});

test('Requirement 3: Square root loop i * i <= n -> O(sqrt(n))', () => {
  const code = `
  int countSqrt(int n) {
    int count = 0;
    for (int i = 1; i * i <= n; i++) {
      count++;
    }
    return count;
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(sqrt(n))');
});

test('Requirement 3: Square root loop i <= sqrt(n) -> O(sqrt(n))', () => {
  const code = `
  int checkPrime(int n) {
    for (int i = 2; i <= sqrt(n); i++) {
      if (n % i == 0) return 0;
    }
    return 1;
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(sqrt(n))');
});

test('Requirement 3: Log-log loop i *= i -> O(log log n)', () => {
  const code = `
  void doubleLog(int n) {
    for (int i = 2; i < n; i *= i) {
      // log log steps
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(log log n)');
});

test('Requirement 3: Reverse logarithmic loop i /= 2 -> O(log n)', () => {
  const code = `
  void revLog(int n) {
    for (int i = n; i > 0; i /= 2) {
      // steps
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(log n)');
});

test('Requirement 4 & 9: Backtracking Subsets -> O(2^n) time, O(n) space', () => {
  const code = `
  void subsets(int i, int n, vector<int>& current) {
    if (i == n) return;
    current.push_back(i);
    subsets(i + 1, n, current);
    current.pop_back();
    subsets(i + 1, n, current);
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(2^n)');
  assert.strictEqual(result.spaceComplexity, 'O(n)');
});

test('Requirement 4 & 9: Backtracking Permutations -> O(n!) time, O(n) space', () => {
  const code = `
  void permutations(int n, vector<bool>& used, vector<int>& curr) {
    if (curr.size() == n) return;
    for (int i = 0; i < n; i++) {
      if (!used[i]) {
        used[i] = true;
        curr.push_back(i);
        permutations(n, used, curr);
        curr.pop_back();
        used[i] = false;
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(n!)');
  assert.strictEqual(result.spaceComplexity, 'O(n)');
});

test('Requirement 4 & 9: Backtracking N-Queens -> O(n!) time, O(n) space', () => {
  const code = `
  void solveNQueens(int row, int n) {
    if (row == n) return;
    for (int col = 0; col < n; col++) {
      if (isSafe(row, col)) {
        solveNQueens(row + 1, n);
      }
    }
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(n!)');
  assert.strictEqual(result.spaceComplexity, 'O(n)');
});

test('Requirement 5 & 9: 0/1 Knapsack DP -> O(n*W) time, O(n*W) space', () => {
  const code = `
  int knapsack(int W, int n, vector<int>& wt, vector<int>& val) {
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++) {
      for (int w = 1; w <= W; w++) {
        if (wt[i - 1] <= w) {
          dp[i][w] = dp[i - 1][w];
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    return dp[n][W];
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(n*W)');
  assert.strictEqual(result.spaceComplexity, 'O(n*W)');
});

test('Requirement 5 & 9: LCS DP -> O(n*m) time, O(n*m) space', () => {
  const code = `
  int lcs(int n, int m) {
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
      for (int j = 1; j <= m; j++) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      }
    }
    return dp[n][m];
  }
  `;
  const result = analyzeCode(code, 'cpp');
  assert.strictEqual(result.timeComplexity, 'O(n*m)');
  assert.strictEqual(result.spaceComplexity, 'O(n*m)');
});

test('Requirement 6: Pseudocode Connected Components on Adjacency List -> O(V + E)', () => {
  const code = `
  FUNCTION dfs(u)
    visited[u] = 1
    FOR EACH v IN adj[u] DO
      IF !visited[v] THEN
        CALL dfs(v)
      END IF
    END FOR
  END FUNCTION

  FUNCTION countComponents(n)
    DECLARE ARRAY visited[n]
    DECLARE count = 0
    FOR i FROM 1 TO n DO
      IF !visited[i] THEN
        CALL dfs(i)
        count = count + 1
      END IF
    END FOR
    RETURN count
  END FUNCTION
  `;
  const result = analyzeCode(code, 'pseudocode');
  assert.strictEqual(result.selectedFunction, 'countComponents');
  assert.strictEqual(result.timeComplexity, 'O(V + E)');
  assert.strictEqual(result.spaceComplexity, 'O(V)');
});
