<div align="center">

<img src="images/repo-card.png" alt="Complexity Analyzer" width="100%" />

# Complexity Analyzer

**Deterministic Big-O static analysis and recurrence solver for C++ and pseudocode.**

No AI. No LLM. No external API. Just parsing, rules and math.

![Node](https://img.shields.io/badge/node-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-4f46e5)
![Parser](https://img.shields.io/badge/parser-tree--sitter-111827)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## What is this?

Complexity Analyzer takes an algorithm, written in **C++** or in a strict **pseudocode** syntax, and works out its asymptotic **time complexity** and **auxiliary space complexity**. It also explains every decision in a step-by-step trace, and solves recurrence relations for recursive algorithms.

Everything is computed with rule-based static analysis. The same input always gives the same output, and every result can be traced back to a rule.

## Screenshots

### Ready state with a template loaded

Pick a template (here, Disjoint Set Union) or paste your own code, then press **Analyze Complexity** or `Cmd/Ctrl + Enter`.

![Ready to analyze](images/Screenshot_2026-10-25_at_3_05_42_PM.png)

### Result with recurrence analysis

Time and auxiliary space badges, the recurrence that was detected, the method that solved it, and a line-by-line trace.

![DSU analysis result](images/Screenshot_2026-10-25_at_3_05_50_PM.png)

### Pseudocode mode: linear queue

Pseudocode mode has its own strict grammar, shown right below the editor. The trace lists the rule applied at every line.

![Queue pseudocode analysis](images/Screenshot_2026-10-25_at_3_06_21_PM.png)

### Pseudocode mode: tree recursion

Recursive functions get a recurrence breakdown, and the space result reflects call-stack depth (`O(h)` for tree height).

![Binary tree traversal analysis](images/Screenshot_2026-10-25_at_3_06_33_PM.png)

---

## Features

- **Two input modes**
  - **C++**, parsed with `tree-sitter` and `tree-sitter-cpp`.
  - **Pseudocode**, parsed by a custom tokenizer and recursive-descent parser with line-numbered error messages.
- **One shared analysis engine.** Both languages are converted into the same Intermediate Representation (IR), so the analysis rules are identical for each.
- **Time complexity rules**
  - Sequential cost accumulation and dominant-term filtering.
  - Nested loops multiply; conditionals take the worst branch.
  - Loop update patterns: linear (`i++`, `i += c`), logarithmic (`i *= c`, `i /= c`), double-logarithmic (`i = i * i`, `i = sqrt(i)`).
  - Dependent loops (`j < i`) and harmonic patterns (`j += i`).
  - Cost table for standard library calls such as `sort`, `binary_search`, `map`, `unordered_map` and `priority_queue`.
- **Auxiliary space rules.** Only extra memory is counted, not the input. This covers 1D and 2D allocations, container growth inside loops, and recursion stack depth times frame size.
- **Recurrence solver**
  - Master Theorem (including the extended Case 2)
  - Subtractive recurrences, single and multi-call
  - Fibonacci-style characteristic equation
  - Akra-Bazzi for unequal splits
  - Square-root recurrences
  - Memoization and DP state counting
- **Minimal UI.** CodeMirror 6 editor, Big-O badges, a recurrence card, a collapsible explanation trace and one-click algorithm templates.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Node.js, Express |
| Frontend | React, Vite, CodeMirror 6, Lucide Icons |
| Parsing | `tree-sitter`, `tree-sitter-cpp`, custom pseudocode parser |
| Testing | Node.js native test runner (`node --test`) |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **18 or newer** (tested on 20 and 24)
- npm 9 or newer

### Quick start

From the project folder, run one command:

```bash
npm start
```

On first run it installs the dependencies, then starts both servers:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:4000 |

Open **http://localhost:5173** in your browser. Press `Ctrl + C` to stop both servers.

Prefer double-clicking? Use `start.command` on macOS or `start.bat` on Windows.

> If you move the project between Windows and macOS, delete the `node_modules` folders (root, `backend/` and `frontend/`) and run `npm start` again. The `tree-sitter` native module has to be rebuilt for each OS.

### Manual setup (two terminals)

```bash
# install dependencies once
npm run setup
```

```bash
# terminal 1: backend API on :4000
npm run backend
```

```bash
# terminal 2: frontend on :5173
npm run frontend
```

### Build the frontend

```bash
npm run build:frontend
```

---

## How to use it

1. Choose **C++** or **Pseudocode** at the top left.
2. Pick a template from the dropdown, or paste your own code.
3. Click **Analyze Complexity** (or press `Cmd/Ctrl + Enter`).
4. Read the **Time** and **Auxiliary Space** results.
5. For recursive code, check the **Recurrence Analysis** card to see which method solved it.
6. Open the **Step-by-Step Static Analysis Trace** to see the rule behind every line.

If a file has several functions, use the **Analyzed Function** dropdown to switch between them.

### Pseudocode syntax

Keywords must be UPPERCASE, and blocks close with a matching `END`. The input size variable must be named `n`, or declared in a comment such as `// n = size of array A`.

| Construct | Syntax |
|---|---|
| Function | `FUNCTION name(param1, param2) ... END FUNCTION` |
| Variable | `DECLARE x = value` |
| 1D array | `DECLARE ARRAY A[n]` |
| 2D matrix | `DECLARE MATRIX M[n][m]` |
| For loop | `FOR i FROM 1 TO n DO ... END FOR` |
| Multiplicative step | `FOR i FROM 1 TO n STEP MULTIPLY BY 2 DO ... END FOR` |
| Divisive step | `FOR i FROM n TO 1 STEP DIVIDE BY 2 DO ... END FOR` |
| While loop | `WHILE condition DO ... END WHILE` |
| Repeat loop | `REPEAT ... UNTIL condition` |
| Conditionals | `IF condition THEN ... ELSE IF condition THEN ... ELSE ... END IF` |
| Function call | `CALL name(arg1, arg2)` |
| Return | `RETURN value` |
| Built-ins | `SORT(A)`, `BINARY_SEARCH(A, x)`, `SEARCH(A, x)`, `REVERSE(A)`, `PUSH(A, x)`, `INSERT(map, k, v)`, `LOOKUP(map, k)` |
| Comment | `// single line comment` |

Example:

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

Result: **Time `O(n²)`**, **Space `O(1)`**.

---

## Running the tests

```bash
npm test
```

or

```bash
cd backend && npm test
```

The suite covers symbolic Big-O algebra, C++ AST conversion, pseudocode syntax and error diagnostics, 13 recurrence classes, and 32 end-to-end algorithm benchmarks.

<details>
<summary>Recurrences verified by the tests</summary>

| Algorithm | Recurrence | Result |
|---|---|---|
| Binary search | `T(n) = T(n/2) + O(1)` | `O(log n)` |
| Merge sort | `T(n) = 2T(n/2) + O(n)` | `O(n log n)` |
| Quicksort (worst case) | `T(n) = T(n-1) + O(n)` | `O(n²)` |
| Factorial | `T(n) = T(n-1) + O(1)` | `O(n)` |
| Fibonacci (naive) | `T(n) = T(n-1) + T(n-2) + O(1)` | `O(φⁿ)` |
| Tower of Hanoi | `T(n) = 2T(n-1) + O(1)` | `O(2ⁿ)` |
| Power by squaring | `T(n) = T(n/2) + O(1)` | `O(log n)` |
| Strassen | `T(n) = 7T(n/2) + O(n²)` | `O(n^2.81)` |
| Akra-Bazzi | `T(n) = T(n/2) + T(n/3) + n` | `O(n)` |
| Square-root | `T(n) = T(√n) + 1` | `O(log log n)` |
| Master Theorem Case 3 | `T(n) = 2T(n/2) + O(n²)` | `O(n²)` |

</details>

---

## Project structure

```
complexity-analyzer/
├── images/                   # README screenshots
├── backend/                  # Express API and rule-based analyzer
│   ├── src/
│   │   ├── index.js          # Express server (POST /api/analyze)
│   │   ├── ir/               # Common IR node definitions
│   │   ├── complexity/       # Symbolic Big-O algebra and formatter
│   │   ├── solver/           # Recurrence solver
│   │   ├── parsers/          # cppParser.js, pseudoParser.js
│   │   └── analyzer/         # timeAnalyzer, spaceAnalyzer, coordinator
│   └── tests/
├── frontend/                 # React + Vite UI
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── presets/          # Ready-made algorithm templates
│       └── components/       # Editor, result cards, trace list, etc.
├── scripts/dev.js            # Starts backend and frontend together
├── start.command             # macOS launcher
├── start.bat                 # Windows launcher
└── package.json
```

## How it works

```
C++ source ──► tree-sitter ─┐
                            ├─► Common IR ─► Time analyzer  ─┐
Pseudocode ──► custom parser ┘               Space analyzer ─┼─► Result + trace
                                             Recurrence solver┘
```

## Limitations

The analyzer is static and rule-based. It gives sound answers for patterns it recognizes, but it cannot prove bounds that depend on runtime data or on mathematical facts hidden inside the code. When an algorithm's bound depends on an assumption (for example, DSU needing path compression and union by rank), the trace says so.

## License

MIT
