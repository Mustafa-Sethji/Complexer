# Complexity Analyzer

## Quick Start (recommended)

Requires Node.js 18+. From this folder, run ONE command:

```bash
npm start
```

(or double-click `start.command` on macOS / `start.bat` on Windows)

It installs dependencies on first run and starts both the Express backend (port 4000) and Vite frontend (port 5173). Open http://localhost:5173. Press Ctrl+C to stop both.

If you move the project between Windows and macOS, delete the `node_modules` folders and run `npm start` again.

---


**Complexity Analyzer** is a minimalistic web application that computes the asymptotic **time** and **auxiliary space** complexity (Big-O) of an algorithm.

> **CRITICAL ARCHITECTURAL GUARANTEE:** Everything is computed using deterministic, rule-based static analysis, abstract syntax tree parsing into a unified Intermediate Representation (IR), pattern inference rules, and a mathematical recurrence solver. **No AI, LLM, machine learning model, or external API is used.**

---

## 1. Features & Architecture

- **Dual Input Modes:**
  - **C++ Mode:** Parsed with `tree-sitter` and `tree-sitter-cpp`.
  - **Pseudocode Mode:** Parsed with a custom-built tokenizer and recursive descent parser enforcing a strict syntax grammar with line-numbered error diagnostics.
- **Common Intermediate Representation (IR):**
  - Both C++ and Pseudocode are transformed into unified IR nodes (`Function`, `Loop`, `IfElse`, `Call`, `Declare`, `Return`, `Assign`, `Expression`).
  - Analysis logic is 100% shared across both input modes.
- **Rule-Based Time Complexity Engine:**
  - Sequential statement cost accumulation and dominant term filtering.
  - Multiplicative nested loop analysis.
  - Worst-case (max) branch selection for conditionals.
  - Loop update pattern deduction:
    - Linear: `i++`, `i--`, `i += c`, `i -= c` $\to O(n)$
    - Logarithmic: `i *= c`, `i /= c`, `i <<= 1`, `i >>= 1` $\to O(\log n)$
    - Double Logarithmic: `i = i * i`, `i = sqrt(i)` $\to O(\log\log n)$
  - Dependent loop deduction: inner bounds depending on outer variables (e.g. `j < i` or `j` from `i` to `n`) $\to O(n^2)$.
  - Harmonic series patterns: `j += i` $\to O(n \log n)$.
  - Standard library cost table (`std::sort`, `binary_search`, `find`, `reverse`, `push_back`, `map`/`set`, `unordered_map`/`set`, `substr`, `priority_queue`).
- **Auxiliary Space Complexity Engine:**
  - Tracks auxiliary memory only (excluding inputs).
  - 1D array/vector allocations $\to O(n)$.
  - 2D matrix allocations $\to O(n \cdot m)$.
  - Container dynamic growth inside loops (`push_back`, `insert`) multiplied by loop iterations.
  - Recursion call-stack depth $\times$ per-frame auxiliary memory.
- **Rule-Based Recurrence Solver Module:**
  1. **Master Theorem:** $T(n) = aT(n/b) + f(n)$ (Cases 1, 2, 3, and Extended Case 2 for $f(n) = \Theta(n^k \log^p n)$).
  2. **Subtractive Linear:** $T(n) = T(n-c) + f(n) \to$ arithmetic series over $n/c$.
  3. **Subtractive Multi-Call:** $T(n) = aT(n-c) + f(n), a > 1 \to O(a^{n/c} \cdot f(n))$.
  4. **Fibonacci Characteristic Solver:** $T(n) = T(n-1) + T(n-2) + f(n) \to O(\phi^n)$ (bounded above by $O(2^n)$).
  5. **Akra-Bazzi Numerical Solver:** for unequal splits (e.g. $T(n) = T(n/2) + T(n/3) + n$).
  6. **Square-Root Recurrence:** $T(n) = T(\sqrt{n}) + O(1) \to O(\log\log n)$.
  7. **Memoization / Dynamic Programming:** detects cache checks and computes (distinct states) $\times$ (work per state).
- **Minimalist Aesthetic UI:**
  - Single page with generous whitespace and clear typography (Plus Jakarta Sans + Geist Mono).
  - CodeMirror 6 code editor with C++ syntax highlighting and pseudocode support.
  - Big-O badges for Time and Space complexity.
  - Collapsible line-by-line static analysis explanation trace.
  - Recurrence breakdown card for recursive algorithms.
  - Instant preset selector for classic algorithms.

---

## 2. Tech Stack

- **Backend:** Node.js (v18+) + Express
- **Frontend:** React + Vite + CodeMirror 6 (`@uiw/react-codemirror`) + Lucide Icons
- **Parsing:** `tree-sitter`, `tree-sitter-cpp`, and custom tokenizer/parser
- **Testing:** Node.js native test runner (`node --test`)

---

## 3. Folder Structure

```
complexer/
├── complexity_analyzer_cursor_prompt.md  # Original prompt spec
├── package.json                          # Workspace root script orchestration
├── README.md                             # Documentation & setup guide
│
├── backend/                              # Express API & Rule-Based Analyzer
│   ├── package.json
│   ├── src/
│   │   ├── index.js                      # Express server (POST /api/analyze)
│   │   ├── ir/
│   │   │   └── index.js                  # Common IR node definitions
│   │   ├── complexity/
│   │   │   └── symbolic.js               # Symbolic Big-O algebra & formatter
│   │   ├── solver/
│   │   │   └── recurrenceSolver.js       # Master Theorem, Subtractive, Akra-Bazzi, etc.
│   │   ├── parsers/
│   │   │   ├── cppParser.js              # C++ Tree-sitter -> Common IR
│   │   │   └── pseudoParser.js           # Pseudocode Tokenizer & Parser -> Common IR
│   │   └── analyzer/
│   │       ├── timeAnalyzer.js           # Time rules & cost table
│   │       ├── spaceAnalyzer.js          # Auxiliary space rules
│   │       └── index.js                  # Main analysis coordinator
│   └── tests/
│       ├── symbolic.test.js              # Symbolic Big-O algebra tests
│       ├── recurrence.test.js            # 13 Recurrence solver tests
│       ├── pseudoParser.test.js          # Pseudocode syntax & IR tests
│       ├── cppParser.test.js             # C++ AST conversion tests
│       └── analyzer.test.js              # 32 End-to-end algorithmic tests
│
└── frontend/                             # React + Vite UI
    ├── package.json
    ├── vite.config.js                    # Vite config with backend proxy
    ├── index.html                        # HTML shell
    └── src/
        ├── main.jsx                      # React entrypoint
        ├── App.jsx                       # Main single-page application
        ├── App.css                       # Minimalist stylesheet
        ├── presets/
        │   └── index.js                  # Ready-to-test algorithm snippets
        └── components/
            ├── Header.jsx                # App title and rule-based badge
            ├── ModeToggle.jsx            # C++ | Pseudocode toggle
            ├── CodeEditor.jsx            # CodeMirror 6 editor
            ├── PseudocodeRules.jsx       # Pseudocode grammar & rules panel
            ├── ResultCard.jsx            # Big-O result card
            ├── RecurrenceBlock.jsx       # Recurrence equation and solution card
            └── ExplanationList.jsx       # Collapsible line-by-line rule trace
```

---

## 4. Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher (tested on Node v20/v24).
- npm v9 or higher.

### Installation

Clone the repository and install dependencies in both the backend and frontend:

```bash
# From the repository root:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

## 5. Running the Application

### Option 1: Run Backend & Frontend in Two Terminals

**Terminal 1 (Backend API):**
```bash
npm run backend
# Server runs on http://localhost:4000
```

**Terminal 2 (Frontend App):**
```bash
npm run frontend
# Vite development server runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 6. Running Tests

The test suite contains **56 unit and end-to-end test cases** covering symbolic math, C++ Tree-Sitter AST conversion, pseudocode syntax and line diagnostics, all 13 required recurrence classes, and 32 full algorithm benchmarks.

Run all tests from the repository root:

```bash
npm test
```

Or from the `backend/` directory:

```bash
cd backend && npm test
```

### Test Suite Coverage

- **Recurrence Relations:**
  - Binary search ($T(n) = T(n/2) + O(1) \to O(\log n)$)
  - Merge sort ($T(n) = 2T(n/2) + O(n) \to O(n \log n)$)
  - Quicksort worst-case ($T(n) = T(n-1) + O(n) \to O(n^2)$)
  - Factorial ($T(n) = T(n-1) + O(1) \to O(n)$)
  - Fibonacci naive ($T(n) = T(n-1) + T(n-2) + O(1) \to O(\phi^n)$)
  - Fibonacci memoized ($O(n)$ time, $O(n)$ space)
  - Tower of Hanoi ($T(n) = 2T(n-1) + O(1) \to O(2^n)$)
  - Power by squaring ($T(n) = T(n/2) + O(1) \to O(\log n)$)
  - Strassen ($T(n) = 7T(n/2) + O(n^2) \to O(n^{2.81})$)
  - Multi-subtractive ($T(n) = 2T(n-1) + 1 \to O(2^n)$)
  - Akra-Bazzi ($T(n) = T(n/2) + T(n/3) + n \to O(n)$)
  - Square-root recurrence ($T(n) = T(\sqrt{n}) + 1 \to O(\log\log n)$)
  - Master Theorem Case 3 ($T(n) = 2T(n/2) + O(n^2) \to O(n^2)$)
- **Time & Space Analyzer Benchmarks (C++ & Pseudocode):**
  - Single loop ($O(n)$)
  - Nested loops ($O(n^2)$)
  - Logarithmic loops ($i *= 2$, $i /= 2 \to O(\log n)$)
  - Dependent loops ($j$ from $i$ to $n \to O(n^2)$)
  - Harmonic loops ($j += i \to O(n \log n)$)
  - Double logarithmic loop ($i = i * i \to O(\log\log n)$)
  - Matrix traversal ($n \times m \to O(n \cdot m)$)
  - Built-in operations (`sort`, `map`, `unordered_map`, `priority_queue`, `substr`)
  - Space allocations (1D vector, 2D matrix, dynamic container growth in loops)

---

## 7. Pseudocode Syntax Reference

When in **Pseudocode mode**, write code adhering to the following strict grammar:

| Construct | Syntax |
|---|---|
| Function | `FUNCTION name(param1, param2) ... END FUNCTION` |
| Variable | `DECLARE x = value` |
| 1D Array | `DECLARE ARRAY A[n]` |
| 2D Matrix | `DECLARE MATRIX M[n][m]` |
| For Loop | `FOR i FROM 1 TO n DO ... END FOR` |
| Multiplicative Step | `FOR i FROM 1 TO n STEP MULTIPLY BY 2 DO ... END FOR` |
| Divisive Step | `FOR i FROM n TO 1 STEP DIVIDE BY 2 DO ... END FOR` |
| While Loop | `WHILE condition DO ... END WHILE` |
| Repeat Loop | `REPEAT ... UNTIL condition` |
| Conditionals | `IF condition THEN ... ELSE IF condition THEN ... ELSE ... END IF` |
| Function Calls | `CALL name(arg1, arg2)` |
| Return | `RETURN value` |
| Built-in Operations | `SORT(A)`, `BINARY_SEARCH(A, x)`, `SEARCH(A, x)`, `REVERSE(A)`, `PUSH(A, x)`, `INSERT(map, k, v)`, `LOOKUP(map, k)` |
| Comments | `// Single line comment` |

### Example Pseudocode

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
# Complexer
