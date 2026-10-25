const test = require('node:test');
const assert = require('node:assert');
const { analyzeCode } = require('../src/analyzer');

// ==========================================
// 1. Single Loop (C++ and Pseudocode)
// ==========================================
test('C++: Single loop -> O(n) time, O(1) space', () => {
  const code = `
void singleLoop(int n) {
  int sum = 0;
  for (int i = 0; i < n; i++) {
    sum += i;
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n)');
  assert.strictEqual(res.spaceComplexity, 'O(1)');
});

test('Pseudocode: Single loop -> O(n) time, O(1) space', () => {
  const code = `
FUNCTION singleLoop(n)
  DECLARE sum = 0
  FOR i FROM 1 TO n DO
    sum = sum + i
  END FOR
  RETURN sum
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n)');
  assert.strictEqual(res.spaceComplexity, 'O(1)');
});

// ==========================================
// 2. Nested Loops (C++ and Pseudocode)
// ==========================================
test('C++: Nested loops -> O(n^2) time, O(1) space', () => {
  const code = `
void nestedLoops(int n) {
  int count = 0;
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      count++;
    }
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n^2)');
  assert.strictEqual(res.spaceComplexity, 'O(1)');
});

test('Pseudocode: Nested loops -> O(n^2) time, O(1) space', () => {
  const code = `
FUNCTION nestedLoops(n)
  DECLARE count = 0
  FOR i FROM 1 TO n DO
    FOR j FROM 1 TO n DO
      count = count + 1
    END FOR
  END FOR
  RETURN count
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n^2)');
  assert.strictEqual(res.spaceComplexity, 'O(1)');
});

// ==========================================
// 3. Logarithmic Loops (C++ and Pseudocode)
// ==========================================
test('C++: Logarithmic loop (i *= 2) -> O(log n) time', () => {
  const code = `
void logLoop(int n) {
  int count = 0;
  for (int i = 1; i < n; i *= 2) {
    count++;
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(log n)');
});

test('Pseudocode: Logarithmic loop (STEP MULTIPLY BY 2) -> O(log n) time', () => {
  const code = `
FUNCTION logLoop(n)
  DECLARE count = 0
  FOR i FROM 1 TO n STEP MULTIPLY BY 2 DO
    count = count + 1
  END FOR
  RETURN count
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(log n)');
});

test('Pseudocode: Logarithmic loop (STEP DIVIDE BY 2) -> O(log n) time', () => {
  const code = `
FUNCTION logDivLoop(n)
  DECLARE count = 0
  FOR i FROM n TO 1 STEP DIVIDE BY 2 DO
    count = count + 1
  END FOR
  RETURN count
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(log n)');
});

// ==========================================
// 4. Dependent Loops (C++ and Pseudocode)
// ==========================================
test('C++: Dependent loops (j = i; j < n) -> O(n^2) time', () => {
  const code = `
void dependentLoops(int n) {
  int count = 0;
  for (int i = 0; i < n; i++) {
    for (int j = i; j < n; j++) {
      count++;
    }
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n^2)');
});

test('Pseudocode: Dependent loops (FOR j FROM i TO n) -> O(n^2) time', () => {
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
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n^2)');
});

// ==========================================
// 5. Harmonic Loops (C++)
// ==========================================
test('C++: Harmonic loop (j += i) -> O(n log n) time', () => {
  const code = `
void harmonicSieve(int n) {
  int count = 0;
  for (int i = 1; i <= n; i++) {
    for (int j = i; j <= n; j += i) {
      count++;
    }
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
});

// ==========================================
// 6. Double Logarithmic Loop (C++)
// ==========================================
test('C++: Double logarithmic loop (i = i * i) -> O(log log n) time', () => {
  const code = `
void loglogLoop(int n) {
  int count = 0;
  for (int i = 2; i < n; i = i * i) {
    count++;
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(log log n)');
});

// ==========================================
// 7. Binary Search (Iterative & Recursive)
// ==========================================
test('C++: Iterative binary search -> O(log n) time, O(1) space', () => {
  const code = `
int binarySearch(int arr[], int n, int target) {
  int low = 0, high = n - 1;
  while (low <= high) {
    int mid = (low + high) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(log n)');
  assert.strictEqual(res.spaceComplexity, 'O(1)');
});

test('Pseudocode: Recursive binary search -> O(log n) time, O(log n) space', () => {
  const code = `
FUNCTION binarySearchRec(n)
  IF n <= 1 THEN
    RETURN 1
  ELSE
    RETURN CALL binarySearchRec(n / 2)
  END IF
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(log n)');
  assert.strictEqual(res.spaceComplexity, 'O(log n)');
  assert.strictEqual(res.isRecursive, true);
});

// ==========================================
// 8. Merge Sort (Recursive)
// ==========================================
test('C++: Recursive merge sort -> O(n log n) time, O(log n) space', () => {
  const code = `
void mergeSort(int n) {
  if (n <= 1) return;
  mergeSort(n / 2);
  mergeSort(n / 2);
  for (int i = 0; i < n; i++) {
    // linear merge work
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
  assert.strictEqual(res.spaceComplexity, 'O(log n)');
  assert.strictEqual(res.isRecursive, true);
});

test('Pseudocode: Recursive merge sort -> O(n log n) time', () => {
  const code = `
FUNCTION mergeSort(n)
  IF n <= 1 THEN
    RETURN 0
  END IF
  CALL mergeSort(n / 2)
  CALL mergeSort(n / 2)
  FOR i FROM 1 TO n DO
    DECLARE x = 0
  END FOR
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
  assert.strictEqual(res.spaceComplexity, 'O(log n)');
});

// ==========================================
// 9. Fibonacci (Recursive & Memoized)
// ==========================================
test('C++: Naive recursive Fibonacci -> O(phi^n) time, O(n) space', () => {
  const code = `
int fib(int n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(phi^n)');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
  assert.strictEqual(res.isRecursive, true);
});

test('C++: Memoized Fibonacci -> O(n) time, O(n) space', () => {
  const code = `
int fibMemo(int n) {
  if (n <= 1) return n;
  if (memo[n] != -1) return memo[n];
  memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
  return memo[n];
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n)');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
});

test('Pseudocode: Memoized Fibonacci -> O(n) time, O(n) space', () => {
  const code = `
FUNCTION fibMemo(n)
  IF n <= 1 THEN
    RETURN n
  END IF
  IF LOOKUP(memo, n) THEN
    RETURN LOOKUP(memo, n)
  END IF
  RETURN CALL fibMemo(n - 1) + CALL fibMemo(n - 2)
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n)');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
});

// ==========================================
// 10. Matrix Traversal (C++ and Pseudocode)
// ==========================================
test('C++: Matrix traversal (n x m) -> O(n*m) time', () => {
  const code = `
void traverseMatrix(int n, int m) {
  int total = 0;
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
      total++;
    }
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n*m)');
});

test('Pseudocode: Matrix traversal (n x m) -> O(n*m) time', () => {
  const code = `
FUNCTION traverse(n, m)
  DECLARE count = 0
  FOR i FROM 1 TO n DO
    FOR j FROM 1 TO m DO
      count = count + 1
    END FOR
  END FOR
  RETURN count
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n*m)');
});

// ==========================================
// 11. Builtin Calls (sort, map, unordered_map, string)
// ==========================================
test('C++: Builtin std::sort -> O(n log n) time', () => {
  const code = `
void sortArray(int n) {
  std::vector<int> a(n);
  std::sort(a.begin(), a.end());
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
});

test('Pseudocode: Builtin SORT(A) -> O(n log n) time', () => {
  const code = `
FUNCTION sortData(A, n)
  SORT(A)
END FUNCTION
  `;
  const res = analyzeCode(code, 'pseudocode');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
});

test('C++: Builtin std::map insert in loop -> O(n log n) time', () => {
  const code = `
void mapLoop(int n) {
  std::map<int, int> mp;
  for (int i = 0; i < n; i++) {
    mp.insert({i, i});
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
});

test('C++: Builtin unordered_map insert in loop -> O(n) time', () => {
  const code = `
void hashLoop(int n) {
  std::unordered_map<int, int> mp;
  for (int i = 0; i < n; i++) {
    mp.insert({i, i});
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n)');
});

test('C++: String operations in loop (substr) -> O(n^2) time', () => {
  const code = `
void stringOps(int n, std::string s) {
  for (int i = 0; i < n; i++) {
    std::string sub = s.substr(0, n);
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n^2)');
});

// ==========================================
// 12. Array Space and Recursion Space
// ==========================================
test('C++: 1D array space -> O(n) space', () => {
  const code = `
void allocArray(int n) {
  int arr[n];
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
});

test('Pseudocode: 1D and 2D arrays -> O(n) and O(n*m) space', () => {
  const code1 = `
FUNCTION alloc1D(n)
  DECLARE ARRAY A[n]
END FUNCTION
  `;
  const res1 = analyzeCode(code1, 'pseudocode');
  assert.strictEqual(res1.spaceComplexity, 'O(n)');

  const code2 = `
FUNCTION alloc2D(n, m)
  DECLARE MATRIX M[n][m]
END FUNCTION
  `;
  const res2 = analyzeCode(code2, 'pseudocode');
  assert.strictEqual(res2.spaceComplexity, 'O(n*m)');
});

test('C++: Vector push_back growing inside loop -> O(n) space', () => {
  const code = `
void growVector(int n) {
  std::vector<int> res;
  for (int i = 0; i < n; i++) {
    res.push_back(i);
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
});

test('C++: Priority queue push in loop -> O(n log n) time', () => {
  const code = `
void pqOps(int n) {
  std::priority_queue<int> pq;
  for (int i = 0; i < n; i++) {
    pq.push(i);
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n log n)');
});

// ==========================================
// 13. Factorial and Tower of Hanoi
// ==========================================
test('C++: Factorial -> O(n) time, O(n) space', () => {
  const code = `
int factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n)');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
  assert.strictEqual(res.isRecursive, true);
});

test('C++: Tower of Hanoi -> O(2^n) time, O(n) space', () => {
  const code = `
void hanoi(int n) {
  if (n <= 0) return;
  hanoi(n - 1);
  hanoi(n - 1);
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(2^n)');
  assert.strictEqual(res.spaceComplexity, 'O(n)');
  assert.strictEqual(res.isRecursive, true);
});

// ==========================================
// 14. If-Else Worst Case
// ==========================================
test('C++: If-Else branches take max -> O(n) time', () => {
  const code = `
void branchTest(int n, bool flag) {
  if (flag) {
    int x = 1;
  } else {
    for (int i = 0; i < n; i++) {}
  }
}
  `;
  const res = analyzeCode(code, 'cpp');
  assert.strictEqual(res.timeComplexity, 'O(n)');
});
