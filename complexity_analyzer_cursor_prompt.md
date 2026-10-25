# Cursor Prompt: Complexity Analyzer

Build a minimalistic web app called **"Complexity Analyzer"** that computes the asymptotic **time** and **space** complexity (Big-O) of an algorithm.

**IMPORTANT:** Do NOT use any AI, LLM, ML model or external API for the analysis. Everything must be done with deterministic, rule-based static analysis (parsing, pattern rules and a recurrence solver).

---

## 1. Tech Stack

- **Frontend:** React + Vite, with CodeMirror 6 (or Monaco) as the code editor.
- **Backend:** Node.js + Express, exposing `POST /api/analyze`.
- **Parsing:**
  - C++ is parsed with tree-sitter (`tree-sitter-cpp` or `web-tree-sitter`).
  - Pseudocode is parsed by my own tokenizer and parser.
- Keep the code clean and modular.
- Include a README with run instructions (frontend and backend) and unit tests for the analyzer.

---

## 2. Input Modes

The user can choose one of two modes:

1. **C++ mode:** the user pastes C++ code and the app detects the complexity from it.
2. **Pseudocode mode:** the user writes pseudocode following strict rules (see Section 7). The app shows those rules on the page so the user knows exactly how to write the pseudocode in the editor.

---

## 3. Page Layout

Single page. Very minimalistic: white background, one accent color, lots of whitespace, no heavy styling.

### Left half
- A mode toggle at the top: **C++** | **Pseudocode**.
- A code editor below the toggle (syntax highlighting for C++, plain monospace for pseudocode).
- Below the editor, when **Pseudocode** is selected, a **"Pseudocode Rules"** panel with the exact syntax rules and a small example. Hide this panel in C++ mode.

### Right half
- An **"Analyze Complexity"** button at the top.
- Two result cards: **Time Complexity** and **Space Complexity** (for example `O(n log n)`).
- Below them, a collapsible **"Step-by-step explanation"** listing which rule was applied to which line. For example:
  - `Line 5: loop with i *= 2 -> O(log n)`
  - `Lines 4-9: nested loops -> O(n) * O(log n)`
- A **"Recurrence"** block (shown only for recursive code) with the recurrence, the method used and the solved result.
- Friendly error or warning messages when parsing fails or a pattern is unsupported (`Could not determine`). Never guess silently.

---

## 4. Analysis Pipeline

1. Parse the input into an AST (C++ via tree-sitter, pseudocode via my own parser).
2. Convert both into **one common intermediate representation (IR)** with these node types: `Function`, `Loop(init, condition, update, body)`, `If/Else`, `Call`, `Declare(array/vector/matrix with size)`, `Return`, `Assign`.
3. A single analyzer runs on the IR, so both modes share the same logic.
4. If a function calls itself, hand it to the Recurrence Solver (Section 6).
5. Return the time complexity, space complexity and the explanation steps to the frontend.

### Complexity representation

Represent complexity symbolically as a sum of terms: `c * n^a * (log n)^b * k^n`, supporting multiple variables (`n`, `m`).

Implement:
- **add:** keep the dominant term
- **multiply:** add the exponents
- **max**
- a formatter that prints Big-O: `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n^2)`, `O(2^n)`, `O(n*m)`, and so on.

---

## 5. Time and Space Rules

### Time complexity rules

- **Sequential statements:** add costs, keep the dominant term.
- **Nested loops:** multiply costs.
- **If/else:** take the worst case (max) of the branches. Ignore early `break`/`return` (worst case).
- **Loop iteration count from the update pattern:**
  - `i++`, `i += c`, `i--`, `i -= c` -> `n`
  - `i *= c`, `i /= c`, `i <<= 1`, `i >>= 1` -> `log n`
  - `i = i * i` or `i = sqrt(i)` -> `log log n`
- **Dependent loops:** inner bound depends on the outer variable (`j < i`, or `j` from `i` to `n`) -> the sum gives `n^2`. The harmonic pattern (`j += i`) -> `n log n`.
- **Identify what `n` is:** a function parameter, an array/vector size, or the loop bound variable.
- **Library/builtin cost table (C++):**

| Operation | Cost |
|---|---|
| `sort`, `stable_sort` | `n log n` |
| `binary_search`, `lower_bound`, `upper_bound` | `log n` |
| `find`, `count`, `accumulate`, `reverse` on a vector | `n` |
| `push_back` | amortized `O(1)` |
| `map`/`set` insert, find, erase | `log n` |
| `unordered_map`/`unordered_set` | `O(1)` average |
| string length, copy, concat, substr | `n` |
| `priority_queue` push, pop | `log n` |

### Space complexity rules

- Count only **auxiliary** space (exclude the input).
- Add the sizes of declared arrays, vectors and matrices (1D -> `n`, 2D -> `n*m`).
- Containers growing inside loops (`push_back`, `insert`) -> multiply by the loop count.
- Recursion: depth * per-call frame space.
- Count string and map/set growth the same way.

---

## 6. Recurrence Solver Module (rule-based, no AI)

Create a separate module `recurrenceSolver`, used whenever a function calls itself (directly or mutually).

### Step 1: Extract the recurrence from the IR

- `a` = number of recursive calls in one execution path (take the worst case across if/else branches).
- Argument transformation for each call: `n-c` (subtractive), `n/b` (divisive), `sqrt(n)`, `n*c`, or unknown.
- `f(n)` = non-recursive work per call, computed with the existing loop/statement/library rules.
- Output a structured recurrence object, for example `{ calls: [{a: 2, shrink: "n/2"}], work: "n" }`, and print it as `T(n) = 2T(n/2) + O(n)`.

### Step 2: Solve with these methods, in order

1. **Master Theorem** for `T(n) = aT(n/b) + f(n)`, `a >= 1`, `b > 1`. Compare `f(n)` with `n^(log_b a)`. Implement cases 1, 2 and 3, plus the extended case 2 for `f(n) = n^k * log^p(n)`. If the regularity condition fails or `f(n)` is not polynomial-like, report that the Master Theorem does not apply.
2. **Subtractive linear:** `T(n) = T(n-c) + f(n)` -> sum `f` over `n/c` steps (`f = O(1)` -> `O(n)`, `f = n` -> `O(n^2)`, `f = log n` -> `O(n log n)`).
3. **Subtractive multi-call:** `T(n) = aT(n-c) + f(n)`, `a > 1` -> `O(a^(n/c) * f(n))`.
4. **Fibonacci-like:** `T(n) = T(n-1) + T(n-2) + f(n)` -> solve the characteristic equation, report `O(phi^n)` and mention `O(2^n)` as the upper bound.
5. **Akra-Bazzi** for unequal splits such as `T(n) = T(n/2) + T(n/3) + n` (solve for `p` with the sum of `a_i / b_i^p = 1`, then integrate).
6. **Square-root recurrence:** `T(n) = T(sqrt n) + O(1)` -> `O(log log n)`.
7. **Memoization/DP:** if a memo/dp array or map is checked before the recursive call, the complexity is (number of distinct states) * (work per state), not the raw recurrence.

If no method matches, return status `"unsolved"` with the recurrence shown. Never guess.

### Recursion space

Depth * frame space, where depth comes from the recurrence (`n-1` -> `n`, `n/2` -> `log n`, `sqrt` -> `log log n`), plus any auxiliary containers allocated per call.

### UI for recursion

The "Recurrence" block in the explanation panel shows, for example:
`T(n) = 2T(n/2) + O(n) -> Master Theorem Case 2 -> O(n log n)`

---

## 7. Pseudocode Rules

This is the strict syntax my parser must support. The same text is shown in the "Pseudocode Rules" panel below the editor.

- Keywords are in UPPERCASE. Each block ends with its own `END` keyword.
- `FUNCTION name(param1, param2)` ... `END FUNCTION`
- `DECLARE x = value`
- `DECLARE ARRAY A[n]` and `DECLARE MATRIX M[n][m]`
- `FOR i FROM a TO b STEP c DO` ... `END FOR`
  - `STEP` is optional; the default is +1.
  - Multiply/divide steps are written as `STEP MULTIPLY BY 2` or `STEP DIVIDE BY 2`.
- `WHILE condition DO` ... `END WHILE`
- `REPEAT` ... `UNTIL condition`
- `IF condition THEN` ... `ELSE IF condition THEN` ... `ELSE` ... `END IF`
- `CALL name(args)` and `RETURN value`
  - Recursion is written by calling the function itself, for example `CALL name(n / 2)` or `CALL name(n - 1)`.
- Assignment: `x = x * 2`, `A[i] = value`
- Builtin operations: `SORT(A)`, `BINARY_SEARCH(A, x)`, `SEARCH(A, x)`, `REVERSE(A)`, `PUSH(A, x)`, `INSERT(map, k, v)`, `LOOKUP(map, k)`
- Comments start with `//`
- The input size must be named `n` (or declared via a comment, for example `// n = size of array A`).

Validate the pseudocode and show **line-numbered syntax errors** that tell the user which rule was broken.

### Example pseudocode (show in the rules panel)

```
FUNCTION countPairs(A, n)
  DECLARE count = 0
  FOR i FROM 1 TO n DO
    FOR j FROM i TO n DO
      count = count + 1
    END FOR
  END FOR
  RETURN count
END FUNCTION
```

---

## 8. Tests

Write a test suite with **at least 25 cases** covering, in BOTH C++ and pseudocode:

- single loop, nested loops, logarithmic loops, dependent loops, harmonic loops
- binary search, merge sort
- fibonacci (recursive and memoized)
- matrix traversal
- builtin calls (sort, map, unordered_map, string ops)
- array space and recursion space

Plus **at least 12 recurrence tests**:

- binary search
- merge sort
- quick sort worst case
- factorial
- fibonacci (naive and memoized)
- tower of hanoi
- power by squaring
- Strassen
- `T(n) = 2T(n-1) + 1`
- `T(n) = T(n/2) + T(n/3) + n`
- `T(n) = T(sqrt n) + 1`

---

## 9. Deliverables

- The full project (frontend + backend) with a clear folder structure.
- A README with setup and run steps.
- The test suite from Section 8.

### Build order

Explain the folder structure first, then build step by step:

1. Common IR and the symbolic complexity representation
2. Analyzer core (time and space rules)
3. Recurrence solver
4. C++ parser and pseudocode parser
5. Express API
6. React UI
7. Tests and README
