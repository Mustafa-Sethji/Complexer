import React from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';

export default function PseudocodeRules({ onLoadExample }) {
  const [copied, setCopied] = React.useState(false);

  const exampleCode = `FUNCTION countPairs(A, n)
  DECLARE count = 0
  FOR i FROM 1 TO n DO
    FOR j FROM i TO n DO
      count = count + 1
    END FOR
  END FOR
  RETURN count
END FUNCTION`;

  const copyExample = () => {
    navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pseudocode-rules-panel">
      <div className="rules-header">
        <div className="rules-title">
          <BookOpen size={16} />
          <span>Pseudocode Syntax Rules</span>
        </div>
        <span className="rules-tag">Strict Grammar</span>
      </div>

      <div className="rules-content">
        <div className="rules-section">
          <div className="rules-section-title">Program Structure & Variables</div>
          <ul className="rules-list">
            <li><strong>Keywords:</strong> Must be in <code>UPPERCASE</code> (blocks close with matching <code>END</code>).</li>
            <li><strong>Functions:</strong> <code>FUNCTION name(param1, param2)</code> ... <code>END FUNCTION</code></li>
            <li><strong>Scalar Variables:</strong> <code>DECLARE x = value</code></li>
            <li><strong>Input Size Variable:</strong> Must be named <code>n</code> (or specified via comment: <code>// n = size of array A</code>).</li>
            <li><strong>Comments:</strong> <code>// your comment here</code></li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Data Structures & Declarations</div>
          <ul className="rules-list">
            <li><strong>1D Array:</strong> <code>DECLARE ARRAY A[n]</code></li>
            <li><strong>2D Matrix:</strong> <code>DECLARE MATRIX M[n][m]</code></li>
            <li><strong>Stack:</strong> <code>DECLARE STACK s</code></li>
            <li><strong>Queue:</strong> <code>DECLARE QUEUE q</code></li>
            <li><strong>Priority Queue:</strong> <code>DECLARE PRIORITY_QUEUE pq</code></li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Stack Operations</div>
          <ul className="rules-list rules-sublist">
            <li><strong>Push (O(1)):</strong> <code>PUSH(s, x)</code> &nbsp;or&nbsp; <code>CALL s.push(x)</code></li>
            <li><strong>Pop (O(1)):</strong> <code>POP(s)</code> &nbsp;or&nbsp; <code>CALL s.pop()</code></li>
            <li><strong>Top / Peek (O(1)):</strong> <code>TOP(s)</code> &nbsp;or&nbsp; <code>CALL s.top()</code></li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Queue Operations</div>
          <ul className="rules-list rules-sublist">
            <li><strong>Enqueue / Push (O(1)):</strong> <code>ENQUEUE(q, x)</code>, <code>PUSH(q, x)</code>, or <code>CALL q.push(x)</code></li>
            <li><strong>Dequeue / Pop (O(1)):</strong> <code>DEQUEUE(q)</code>, <code>POP(q)</code>, or <code>CALL q.pop()</code></li>
            <li><strong>Front / Peek (O(1)):</strong> <code>FRONT(q)</code> &nbsp;or&nbsp; <code>CALL q.front()</code></li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Priority Queue Operations</div>
          <ul className="rules-list rules-sublist">
            <li><strong>Insert / Push (O(log n)):</strong> <code>PUSH(pq, x)</code> &nbsp;or&nbsp; <code>CALL pq.push(x)</code></li>
            <li><strong>Extract Min/Max (O(log n)):</strong> <code>POP(pq)</code> &nbsp;or&nbsp; <code>CALL pq.pop()</code></li>
            <li><strong>Top / Peek (O(1)):</strong> <code>TOP(pq)</code> &nbsp;or&nbsp; <code>CALL pq.top()</code></li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Container State & Checks</div>
          <ul className="rules-list rules-sublist">
            <li><strong>Check Empty (O(1)):</strong> <code>EMPTY(c)</code> &nbsp;or&nbsp; <code>CALL c.empty()</code></li>
            <li><strong>Get Size (O(1)):</strong> <code>SIZE(c)</code> &nbsp;or&nbsp; <code>CALL c.size()</code></li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Control Flow & Loops</div>
          <ul className="rules-list">
            <li>
              <strong>Standard For Loop:</strong> <code>FOR i FROM 1 TO n DO</code> ... <code>END FOR</code>
            </li>
            <li>
              <strong>Logarithmic Steps:</strong> <code>STEP MULTIPLY BY 2</code> &nbsp;or&nbsp; <code>STEP DIVIDE BY 2</code>
            </li>
            <li>
              <strong>Square Root Bound:</strong> <code>FOR i FROM 1 TO SQRT(n) DO</code> ... <code>END FOR</code>
            </li>
            <li>
              <strong>For Each Loop:</strong> <code>FOR EACH v IN adj[u] DO</code> ... <code>END FOR</code>
            </li>
            <li>
              <strong>While Loop:</strong> <code>WHILE condition DO</code> ... <code>END WHILE</code>
            </li>
            <li>
              <strong>Repeat Loop:</strong> <code>REPEAT</code> ... <code>UNTIL condition</code>
            </li>
            <li>
              <strong>Conditionals:</strong> <code>IF cond THEN</code> ... <code>ELSE IF cond THEN</code> ... <code>ELSE</code> ... <code>END IF</code>
            </li>
          </ul>
        </div>

        <div className="rules-section">
          <div className="rules-section-title">Function Calls, Returns & Built-in Algorithms</div>
          <ul className="rules-list">
            <li><strong>Function Call:</strong> <code>CALL name(args)</code></li>
            <li><strong>Recursion:</strong> <code>CALL name(n / 2)</code> &nbsp;or&nbsp; <code>CALL name(n - 1)</code></li>
            <li><strong>Return:</strong> <code>RETURN value</code></li>
            <li><strong>Sorting (O(n log n)):</strong> <code>SORT(A)</code></li>
            <li><strong>Binary Search (O(log n)):</strong> <code>BINARY_SEARCH(A, x)</code></li>
            <li><strong>Linear Search (O(n)):</strong> <code>SEARCH(A, x)</code></li>
            <li><strong>Array Reverse (O(n)):</strong> <code>REVERSE(A)</code></li>
            <li><strong>Map Insert (O(log n)):</strong> <code>INSERT(map, key, value)</code></li>
            <li><strong>Map Lookup (O(log n)):</strong> <code>LOOKUP(map, key)</code></li>
            <li><strong>Assignments:</strong> <code>x = x + 1</code>, <code>A[i] = value</code></li>
          </ul>
        </div>

        <div className="rules-example-container">
          <div className="example-header">
            <span>Standard Example</span>
            <div className="example-actions">
              {onLoadExample && (
                <button
                  type="button"
                  className="example-btn"
                  onClick={() => onLoadExample(exampleCode)}
                >
                  Load into Editor
                </button>
              )}
              <button
                type="button"
                className="example-btn"
                onClick={copyExample}
                title="Copy to clipboard"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <pre className="example-pre"><code>{exampleCode}</code></pre>
        </div>
      </div>
    </div>
  );
}
