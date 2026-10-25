export const PRESET_CATEGORIES = [
  'Recursion',
  'Dynamic Programming',
  'Graph',
  'Backtracking',
  'Searching & Sorting',
  'Stack & Queue',
  'Tree'
];

export const PRESETS = {
  cpp: [
    // ---------------- RECURSION ----------------
    {
      id: 'rec_factorial',
      title: 'Factorial',
      category: 'Recursion',
      code: `// T(n) = T(n-1) + O(1) -> O(n) Time, O(n) Stack Space
long long factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`
    },
    {
      id: 'rec_fibonacci',
      title: 'Fibonacci (Naive)',
      category: 'Recursion',
      code: `// T(n) = T(n-1) + T(n-2) + O(1) -> O(phi^n) ~ O(1.618^n) Time (upper bound O(2^n)), O(n) Space
int fib(int n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`
    },
    {
      id: 'rec_binary_search',
      title: 'Binary Search (Recursive)',
      category: 'Recursion',
      code: `// T(n) = T(n/2) + O(1) -> O(log n) Time, O(log n) Stack Space
int binarySearch(int arr[], int low, int high, int target) {
  if (low > high) return -1;
  int mid = (low + high) / 2;
  if (arr[mid] == target) return mid;
  if (arr[mid] > target) return binarySearch(arr, low, mid - 1, target);
  return binarySearch(arr, mid + 1, high, target);
}`
    },
    {
      id: 'rec_merge_sort',
      title: 'Merge Sort',
      category: 'Recursion',
      code: `// T(n) = 2T(n/2) + O(n) -> O(n log n) Time, O(n) Space
void mergeSort(int n) {
  if (n <= 1) return;
  mergeSort(n / 2);
  mergeSort(n / 2);
  vector<int> temp(n);
  for (int i = 0; i < n; i++) {
    temp[i] = i; // linear merge work into the temp buffer
  }
}`
    },
    {
      id: 'rec_quick_sort',
      title: 'Quick Sort (Worst Case)',
      category: 'Recursion',
      code: `// T(n) = T(n-1) + O(n) -> O(n^2) Time, O(n) Stack Space
void quickSort(int n) {
  if (n <= 1) return;
  quickSort(n - 1);
  for (int i = 0; i < n; i++) {
    // linear partition step
  }
}`
    },

    // ---------------- DYNAMIC PROGRAMMING ----------------
    {
      id: 'dp_fib_memo',
      title: 'Fibonacci Memoization',
      category: 'Dynamic Programming',
      code: `// Top-Down Memoized DP -> O(n) Time, O(n) Space
int fibMemo(int n, vector<int>& memo) {
  if (n <= 1) return n;
  if (memo[n] != -1) return memo[n];
  return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}`
    },
    {
      id: 'dp_fib_tab',
      title: 'Fibonacci Tabulation',
      category: 'Dynamic Programming',
      code: `// Bottom-up Tabulation -> O(n) Time, O(n) Space
int fibTab(int n) {
  vector<int> dp(n + 1, 0);
  dp[1] = 1;
  for (int i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`
    },
    {
      id: 'dp_knapsack',
      title: '0/1 Knapsack',
      category: 'Dynamic Programming',
      code: `// 2D DP Table -> O(n*W) Time, O(n*W) Space
int knapsack(int n, int W, vector<int>& wt, vector<int>& val) {
  vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
  for (int i = 1; i <= n; i++) {
    for (int w = 1; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
    }
  }
  return dp[n][W];
}`
    },
    {
      id: 'dp_lcs',
      title: 'Longest Common Subsequence (LCS)',
      category: 'Dynamic Programming',
      code: `// 2D DP Matrix -> O(n*m) Time, O(n*m) Space
int lcs(int n, int m, string s1, string s2) {
  vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      dp[i][j] = dp[i - 1][j - 1] + 1;
    }
  }
  return dp[n][m];
}`
    },
    {
      id: 'dp_lis',
      title: 'Longest Increasing Subsequence (LIS)',
      category: 'Dynamic Programming',
      code: `// Nested loops -> O(n^2) Time, O(n) Space
int lis(vector<int>& arr, int n) {
  vector<int> dp(n, 1);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) {
      if (arr[i] > arr[j]) dp[i] = max(dp[i], dp[j] + 1);
    }
  }
  return dp[n - 1];
}`
    },
    {
      id: 'dp_coin_change',
      title: 'Coin Change',
      category: 'Dynamic Programming',
      code: `// 1D DP Array -> O(n*amount) Time, O(amount) Space
int coinChange(int n, int amount) {
  vector<int> dp(amount + 1, 0);
  for (int i = 1; i <= amount; i++) {
    for (int j = 0; j < n; j++) {
      dp[i]++;
    }
  }
  return dp[amount];
}`
    },
    {
      id: 'dp_house_robber',
      title: 'House Robber',
      category: 'Dynamic Programming',
      code: `// 1D Linear Scan -> O(n) Time, O(n) Space
int rob(vector<int>& nums, int n) {
  vector<int> dp(n, 0);
  dp[0] = nums[0];
  for (int i = 1; i < n; i++) {
    dp[i] = max(dp[i - 1], nums[i]);
  }
  return dp[n - 1];
}`
    },
    {
      id: 'dp_climbing_stairs',
      title: 'Climbing Stairs',
      category: 'Dynamic Programming',
      code: `// Linear DP -> O(n) Time, O(n) Space
int climbStairs(int n) {
  vector<int> dp(n + 1, 0);
  dp[0] = 1;
  dp[1] = 1;
  for (int i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`
    },

    // ---------------- GRAPH ----------------
    {
      id: 'graph_dfs',
      title: 'Depth-First Search (DFS)',
      category: 'Graph',
      code: `// Adjacency List Traversal -> O(V + E) Time, O(V) Space
void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited) {
  visited[u] = true;
  for (int v : adj[u]) {
    if (!visited[v]) {
      dfs(v, adj, visited);
    }
  }
}`
    },
    {
      id: 'graph_bfs',
      title: 'Breadth-First Search (BFS)',
      category: 'Graph',
      code: `// Adjacency List Traversal with Queue -> O(V + E) Time, O(V) Space
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
}`
    },
    {
      id: 'graph_connected_components',
      title: 'Connected Components',
      category: 'Graph',
      code: `// Call graph tracking: countComponents calls dfs helper -> O(V + E) Time, O(V) Space
void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited) {
  visited[u] = true;
  for (int v : adj[u]) {
    if (!visited[v]) dfs(v, adj, visited);
  }
}

int countComponents(int V, vector<vector<int>>& adj) {
  vector<bool> visited(V, false);
  int count = 0;
  for (int i = 0; i < V; i++) {
    if (!visited[i]) {
      dfs(i, adj, visited);
      count++;
    }
  }
  return count;
}`
    },
    {
      id: 'graph_cycle_detection',
      title: 'Cycle Detection',
      category: 'Graph',
      code: `// Directed Graph Cycle Detection -> O(V + E) Time, O(V) Space
bool isCyclic(int u, vector<vector<int>>& adj, vector<bool>& visited, vector<bool>& recStack) {
  visited[u] = true;
  recStack[u] = true;
  for (int v : adj[u]) {
    if (!visited[v] && isCyclic(v, adj, visited, recStack)) return true;
    else if (recStack[v]) return true;
  }
  recStack[u] = false;
  return false;
}`
    },
    {
      id: 'graph_bipartite',
      title: 'Bipartite Graph Check',
      category: 'Graph',
      code: `// BFS 2-coloring check -> O(V + E) Time, O(V) Space
bool isBipartite(int V, vector<vector<int>>& adj) {
  vector<int> color(V, -1);
  queue<int> q;
  color[0] = 1;
  q.push(0);
  while (!q.empty()) {
    int u = q.front();
    q.pop();
    for (int v : adj[u]) {
      if (color[v] == -1) {
        color[v] = 1 - color[u];
        q.push(v);
      }
    }
  }
  return true;
}`
    },
    {
      id: 'graph_num_islands',
      title: 'Number of Islands',
      category: 'Graph',
      code: `// 2D Grid DFS -> O(n*m) Time, O(n*m) Space
void dfs(vector<vector<char>>& grid, int r, int c, int n, int m) {
  if (r < 0 || c < 0 || r >= n || c >= m || grid[r][c] != '1') return;
  grid[r][c] = '0';
  dfs(grid, r + 1, c, n, m);
  dfs(grid, r - 1, c, n, m);
  dfs(grid, r, c + 1, n, m);
  dfs(grid, r, c - 1, n, m);
}

int numIslands(vector<vector<char>>& grid, int n, int m) {
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
}`
    },
    {
      id: 'graph_topo_sort',
      title: 'Topological Sort (Kahn)',
      category: 'Graph',
      code: `// In-degree queue-based traversal -> O(V + E) Time, O(V) Space
void topologicalSort(int V, vector<vector<int>>& adj) {
  vector<int> inDegree(V, 0);
  for (int u = 0; u < V; u++) {
    for (int v : adj[u]) inDegree[v]++;
  }
  queue<int> q;
  for (int i = 0; i < V; i++) {
    if (inDegree[i] == 0) q.push(i);
  }
  while (!q.empty()) {
    int u = q.front();
    q.pop();
    for (int v : adj[u]) {
      inDegree[v]--;
      if (inDegree[v] == 0) q.push(v);
    }
  }
}`
    },
    {
      id: 'graph_dijkstra',
      title: 'Dijkstra Shortest Path',
      category: 'Graph',
      code: `// Priority Queue relaxation -> O(E log V) Time, O(V + E) Space (lazy queue holds up to E entries)
void dijkstra(int src, int V, vector<vector<pair<int, int>>>& adj) {
  vector<int> dist(V, 1e9);
  priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
  dist[src] = 0;
  pq.push({0, src});
  while (!pq.empty()) {
    int u = pq.top().second;
    pq.pop();
    for (auto edge : adj[u]) {
      int v = edge.first;
      int weight = edge.second;
      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        pq.push({dist[v], v});
      }
    }
  }
}`
    },
    {
      id: 'graph_dsu',
      title: 'Disjoint Set Union (DSU)',
      category: 'Graph',
      code: `// DSU with Path Compression + Union by Rank -> O(alpha(n)) amortized Time, O(log n) recursion Space
int find(int i, vector<int>& parent) {
  if (parent[i] == i) return i;
  return parent[i] = find(parent[i], parent);
}

void unite(int x, int y, vector<int>& parent, vector<int>& rank) {
  int rootX = find(x, parent);
  int rootY = find(y, parent);
  if (rootX != rootY) {
    if (rank[rootX] < rank[rootY]) parent[rootX] = rootY;
    else if (rank[rootX] > rank[rootY]) parent[rootY] = rootX;
    else { parent[rootY] = rootX; rank[rootX]++; }
  }
}`
    },
    {
      id: 'graph_kruskal',
      title: 'Kruskal Minimum Spanning Tree',
      category: 'Graph',
      code: `// Edge sort + DSU -> O(E log V) Time, O(V) Space
int kruskalMST(int V, vector<pair<int, pair<int, int>>>& edges) {
  vector<int> parent(V);
  for (int i = 0; i < V; i++) parent[i] = i;
  sort(edges.begin(), edges.end());
  int total = 0;
  for (auto edge : edges) {
    int u = edge.second.first;
    int v = edge.second.second;
    int rootU = find(u, parent);
    int rootV = find(v, parent);
    if (rootU != rootV) {
      total += edge.first;
      parent[rootU] = rootV;
    }
  }
  return total;
}`
    },
    {
      id: 'graph_prim',
      title: 'Prim Minimum Spanning Tree',
      category: 'Graph',
      code: `// Priority Queue MST -> O(E log V) Time, O(V + E) Space (lazy queue holds up to E entries)
int primMST(int V, vector<vector<pair<int, int>>>& adj) {
  priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
  vector<int> key(V, 1e9);
  vector<bool> inMST(V, false);
  pq.push({0, 0});
  key[0] = 0;
  while (!pq.empty()) {
    int u = pq.top().second;
    pq.pop();
    inMST[u] = true;
    for (auto edge : adj[u]) {
      int v = edge.first;
      int weight = edge.second;
      if (!inMST[v] && key[v] > weight) {
        key[v] = weight;
        pq.push({key[v], v});
      }
    }
  }
  return 0;
}`
    },

    // ---------------- BACKTRACKING ----------------
    {
      id: 'bt_subsets',
      title: 'Subsets (Power Set)',
      category: 'Backtracking',
      code: `// Binary inclusion branch -> O(2^n) Time, O(n) Space
void subsets(int idx, int n, vector<int>& current) {
  if (idx == n) return;
  current.push_back(idx);
  subsets(idx + 1, n, current);
  current.pop_back();
  subsets(idx + 1, n, current);
}`
    },
    {
      id: 'bt_permutations',
      title: 'Permutations',
      category: 'Backtracking',
      code: `// Generates all n! permutations -> O(n!) Time, O(n) Space
void permute(int n, vector<int>& current, vector<bool>& used) {
  if (current.size() == n) return;
  for (int i = 0; i < n; i++) {
    if (!used[i]) {
      used[i] = true;
      current.push_back(i);
      permute(n, current, used);
      current.pop_back();
      used[i] = false;
    }
  }
}`
    },
    {
      id: 'bt_comb_sum',
      title: 'Combination Sum',
      category: 'Backtracking',
      code: `// Choose-or-extend search -> O(n^target) Time (n = candidates), O(target) Space
void combinationSum(int idx, int target, vector<int>& candidates, vector<int>& current) {
  if (target == 0) return;
  for (int i = idx; i < candidates.size(); i++) {
    if (candidates[i] <= target) {
      current.push_back(candidates[i]);
      combinationSum(i, target - candidates[i], candidates, current);
      current.pop_back();
    }
  }
}`
    },
    {
      id: 'bt_nqueens',
      title: 'N-Queens',
      category: 'Backtracking',
      code: `// Backtracking row placement -> O(n!) Time, O(n) Space
bool isSafe(int row, int col, int n, vector<string>& board) {
  return true;
}

void solveNQueens(int row, int n, vector<string>& board) {
  if (row == n) return;
  for (int col = 0; col < n; col++) {
    if (isSafe(row, col, n, board)) {
      board[row][col] = 'Q';
      solveNQueens(row + 1, n, board);
      board[row][col] = '.';
    }
  }
}`
    },
    {
      id: 'bt_sudoku',
      title: 'Sudoku Solver',
      category: 'Backtracking',
      code: `// 9x9 grid search -> O(9^(n*n)) Worst Case Time, O(n*n) recursion Space (n = 9)
bool solveSudoku(vector<vector<char>>& board, int row, int col) {
  if (row == 9) return true;
  if (col == 9) return solveSudoku(board, row + 1, 0);
  for (char c = '1'; c <= '9'; c++) {
    board[row][col] = c;
    if (solveSudoku(board, row, col + 1)) return true;
    board[row][col] = '.';
  }
  return false;
}`
    },
    {
      id: 'bt_rat_maze',
      title: 'Rat in a Maze',
      category: 'Backtracking',
      code: `// 4-direction path finding with backtracking -> O(4^(n^2)) Time, O(n^2) Space
void solveMaze(int x, int y, int n, vector<vector<int>>& maze, vector<vector<int>>& sol) {
  if (x < 0 || y < 0 || x >= n || y >= n || maze[x][y] == 0 || sol[x][y] == 1) return;
  sol[x][y] = 1;
  if (x == n - 1 && y == n - 1) return;
  solveMaze(x + 1, y, n, maze, sol);
  solveMaze(x - 1, y, n, maze, sol);
  solveMaze(x, y + 1, n, maze, sol);
  solveMaze(x, y - 1, n, maze, sol);
  sol[x][y] = 0;
}`
    },

    // ---------------- SEARCHING & SORTING ----------------
    {
      id: 'sort_linear_search',
      title: 'Linear Search',
      category: 'Searching & Sorting',
      code: `// Single loop scan -> O(n) Time, O(1) Space
int linearSearch(int arr[], int n, int target) {
  for (int i = 0; i < n; i++) {
    if (arr[i] == target) return i;
  }
  return -1;
}`
    },
    {
      id: 'sort_binary_search',
      title: 'Binary Search (Iterative)',
      category: 'Searching & Sorting',
      code: `// Halving search space -> O(log n) Time, O(1) Space
int binarySearch(int arr[], int n, int target) {
  int low = 0, high = n - 1;
  while (low <= high) {
    int mid = (low + high) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`
    },
    {
      id: 'sort_heap_sort',
      title: 'Heap Sort',
      category: 'Searching & Sorting',
      code: `// Priority Queue insertion & extraction -> O(n log n) Time, O(n) Space
void heapSort(vector<int>& arr, int n) {
  priority_queue<int, vector<int>, greater<int>> pq;
  for (int i = 0; i < n; i++) {
    pq.push(arr[i]);
  }
  for (int i = 0; i < n; i++) {
    arr[i] = pq.top();
    pq.pop();
  }
}`
    },
    {
      id: 'sort_counting_sort',
      title: 'Counting Sort',
      category: 'Searching & Sorting',
      code: `// Frequency count array -> O(n + k) Time, O(k) Space
void countingSort(vector<int>& arr, int n, int k) {
  vector<int> count(k + 1, 0);
  for (int i = 0; i < n; i++) {
    count[arr[i]]++;
  }
  int idx = 0;
  for (int i = 0; i <= k; i++) {
    for (int j = 0; j < count[i]; j++) {
      arr[idx++] = i;
    }
  }
}`
    },

    // ---------------- STACK & QUEUE ----------------
    {
      id: 'sq_valid_parentheses',
      title: 'Valid Parentheses (Stack)',
      category: 'Stack & Queue',
      code: `// Stack bracket matching -> O(n) Time, O(n) Auxiliary Space
bool isValid(string s) {
  stack<char> st;
  for (int i = 0; i < s.length(); i++) {
    char c = s[i];
    if (c == '(' || c == '{' || c == '[') {
      st.push(c);
    } else {
      if (st.empty()) return false;
      st.pop();
    }
  }
  return st.empty();
}`
    },
    {
      id: 'sq_min_stack',
      title: 'Min Stack',
      category: 'Stack & Queue',
      code: `// Constant time push and getMin -> O(1) per operation, O(n) Space for n stored elements
class MinStack {
  stack<int> s;
  stack<int> minS;
public:
  void push(int val) {
    s.push(val);
    if (minS.empty() || val <= minS.top()) minS.push(val);
  }
  void pop() {
    if (s.top() == minS.top()) minS.pop();
    s.pop();
  }
  int top() { return s.top(); }
  int getMin() { return minS.top(); }
};`
    },
    {
      id: 'sq_sliding_window',
      title: 'Sliding Window Maximum',
      category: 'Stack & Queue',
      code: `// Monotonic deque amortized scan -> O(n) Time, O(n) Space as an upper bound (the deque holds at most k indices, so O(k) is tight)
vector<int> maxSlidingWindow(vector<int>& nums, int n, int k) {
  deque<int> dq;
  vector<int> res;
  for (int i = 0; i < n; i++) {
    if (!dq.empty() && dq.front() <= i - k) dq.pop_front();
    while (!dq.empty() && nums[dq.back()] <= nums[i]) {
      dq.pop_back();
    }
    dq.push_back(i);
    if (i >= k - 1) res.push_back(nums[dq.front()]);
  }
  return res;
}`
    },

    // ---------------- TREE ----------------
    {
      id: 'tree_inorder',
      title: 'Tree Inorder Traversal',
      category: 'Tree',
      code: `// Binary Tree DFS -> O(n) Time, O(h) Recursion Stack Space
struct TreeNode {
  int val;
  TreeNode *left;
  TreeNode *right;
};

void inorder(TreeNode* root) {
  if (root == nullptr) return;
  inorder(root->left);
  // process node
  inorder(root->right);
}`
    },
    {
      id: 'tree_max_depth',
      title: 'Max Depth of Binary Tree',
      category: 'Tree',
      code: `// Tree depth divide-and-conquer -> O(n) Time, O(h) Space
struct TreeNode {
  int val;
  TreeNode *left;
  TreeNode *right;
};

int maxDepth(TreeNode* root) {
  if (root == nullptr) return 0;
  int leftDepth = maxDepth(root->left);
  int rightDepth = maxDepth(root->right);
  return max(leftDepth, rightDepth) + 1;
}`
    },
    {
      id: 'tree_level_order',
      title: 'Level Order Traversal (BFS)',
      category: 'Tree',
      code: `// Queue-based Tree BFS -> O(n) Time, O(n) Space (queue holds one level, width w <= n)
struct TreeNode {
  int val;
  TreeNode *left;
  TreeNode *right;
};

void levelOrder(TreeNode* root) {
  if (root == nullptr) return;
  queue<TreeNode*> q;
  q.push(root);
  while (!q.empty()) {
    TreeNode* curr = q.front();
    q.pop();
    if (curr->left) q.push(curr->left);
    if (curr->right) q.push(curr->right);
  }
}`
    }
  ],

  pseudocode: [
    // ---------------- RECURSION ----------------
    {
      id: 'pseudo_factorial',
      title: 'Factorial',
      category: 'Recursion',
      code: `// Recurrence: T(n) = T(n-1) + O(1) -> O(n) Time, O(n) Space
FUNCTION factorial(n)
  IF n <= 1 THEN
    RETURN 1
  END IF
  RETURN n * factorial(n - 1)
END FUNCTION`
    },
    {
      id: 'pseudo_fibonacci',
      title: 'Fibonacci (Naive)',
      category: 'Recursion',
      code: `// Recurrence: T(n) = T(n-1) + T(n-2) + O(1) -> O(phi^n) ~ O(1.618^n) Time (upper bound O(2^n)), O(n) Space
FUNCTION fib(n)
  IF n <= 1 THEN
    RETURN n
  END IF
  RETURN fib(n - 1) + fib(n - 2)
END FUNCTION`
    },
    {
      id: 'pseudo_merge_sort',
      title: 'Merge Sort',
      category: 'Recursion',
      code: `// Recurrence: T(n) = 2T(n/2) + O(n) -> O(n log n) Time, O(n) Space
FUNCTION mergeSort(n)
  IF n <= 1 THEN
    RETURN 0
  END IF
  CALL mergeSort(n / 2)
  CALL mergeSort(n / 2)
  DECLARE ARRAY temp[n]
  FOR i FROM 1 TO n DO
    temp[i] = i
  END FOR
  RETURN 0
END FUNCTION`
    },

    // ---------------- DYNAMIC PROGRAMMING ----------------
    {
      id: 'pseudo_dp_fib',
      title: 'Fibonacci Tabulation',
      category: 'Dynamic Programming',
      code: `// Tabulation -> O(n) Time, O(n) Space
FUNCTION fibTab(n)
  DECLARE ARRAY dp[n]
  dp[1] = 1
  FOR i FROM 2 TO n DO
    dp[i] = dp[i - 1] + dp[i - 2]
  END FOR
  RETURN dp[n]
END FUNCTION`
    },
    {
      id: 'pseudo_dp_knapsack',
      title: '0/1 Knapsack',
      category: 'Dynamic Programming',
      code: `// 2D DP Table -> O(n*W) Time, O(n*W) Space
FUNCTION knapsack(n, W)
  DECLARE MATRIX dp[n][W]
  FOR i FROM 1 TO n DO
    FOR w FROM 1 TO W DO
      dp[i][w] = dp[i - 1][w]
    END FOR
  END FOR
  RETURN dp[n][W]
END FUNCTION`
    },
    {
      id: 'pseudo_dp_lcs',
      title: 'Longest Common Subsequence (LCS)',
      category: 'Dynamic Programming',
      code: `// 2D Matrix -> O(n*m) Time, O(n*m) Space
FUNCTION lcs(n, m)
  DECLARE MATRIX dp[n][m]
  FOR i FROM 1 TO n DO
    FOR j FROM 1 TO m DO
      dp[i][j] = dp[i - 1][j - 1] + 1
    END FOR
  END FOR
  RETURN dp[n][m]
END FUNCTION`
    },

    // ---------------- GRAPH ----------------
    {
      id: 'pseudo_graph_dfs',
      title: 'Depth-First Search (DFS)',
      category: 'Graph',
      code: `// Adjacency List Traversal -> O(V + E) Time, O(V) Space
FUNCTION dfs(u)
  visited[u] = 1
  FOR EACH v IN adj[u] DO
    IF !visited[v] THEN
      CALL dfs(v)
    END IF
  END FOR
END FUNCTION`
    },
    {
      id: 'pseudo_graph_connected_components',
      title: 'Connected Components',
      category: 'Graph',
      code: `// Call graph tracking -> O(V + E) Time, O(V) Space
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
END FUNCTION`
    },
    {
      id: 'pseudo_topo_sort',
      title: 'Topological Sort',
      category: 'Graph',
      code: `// Queue BFS Kahn -> O(V + E) Time, O(V) Space
FUNCTION topoSort(V)
  DECLARE ARRAY inDegree[V]
  DECLARE QUEUE q
  FOR i FROM 1 TO V DO
    IF inDegree[i] == 0 THEN
      CALL q.push(i)
    END IF
  END FOR
  WHILE !q.empty() DO
    DECLARE u = q.front()
    CALL q.pop()
    FOR EACH v IN adj[u] DO
      inDegree[v] = inDegree[v] - 1
      IF inDegree[v] == 0 THEN
        CALL q.push(v)
      END IF
    END FOR
  END WHILE
END FUNCTION`
    },

    // ---------------- SEARCHING & SORTING ----------------
    {
      id: 'pseudo_binary_search',
      title: 'Binary Search',
      category: 'Searching & Sorting',
      code: `// Halving while loop -> O(log n) Time, O(1) Space
FUNCTION binarySearch(n)
  DECLARE low = 0
  DECLARE high = n - 1
  WHILE low <= high DO
    DECLARE mid = (low + high) / 2
    IF arr[mid] == target THEN
      RETURN mid
    END IF
    IF arr[mid] < target THEN
      low = mid + 1
    ELSE
      high = mid - 1
    END IF
  END WHILE
  RETURN -1
END FUNCTION`
    },
    {
      id: 'pseudo_nested_loops',
      title: 'Dependent Nested Loops',
      category: 'Searching & Sorting',
      code: `// Nested loops -> O(n^2) Time, O(1) Space
FUNCTION countPairs(n)
  DECLARE count = 0
  FOR i FROM 0 TO n DO
    FOR j FROM i TO n DO
      count = count + 1
    END FOR
  END FOR
  RETURN count
END FUNCTION`
    },

    // ---------------- STACK & QUEUE ----------------
    {
      id: 'pseudo_queue_fifo',
      title: 'Queue FIFO Processing',
      category: 'Stack & Queue',
      code: `// Linear queue operations -> O(n) Time, O(n) Space
FUNCTION processQueue(n)
  DECLARE QUEUE q
  FOR i FROM 1 TO n DO
    CALL q.push(i)
  END FOR
  WHILE !q.empty() DO
    CALL q.pop()
  END WHILE
END FUNCTION`
    },

    // ---------------- TREE ----------------
    {
      id: 'pseudo_tree_traversal',
      title: 'Binary Tree Traversal',
      category: 'Tree',
      code: `// Tree DFS -> O(n) Time, O(h) Stack Space
FUNCTION traverseTree(node)
  IF node == 0 THEN
    RETURN 0
  END IF
  CALL traverseTree(node.left)
  CALL traverseTree(node.right)
END FUNCTION`
    }
  ]
};
