/**
 * Recurrence Solver Module
 * 
 * Deterministic, rule-based recurrence solver for recursive algorithms.
 * Supported methods (evaluated in order):
 * 1. Master Theorem (Cases 1, 2, 3 + Extended Case 2)
 * 2. Subtractive linear: T(n) = T(n-c) + f(n)
 * 3. Subtractive multi-call: T(n) = a*T(n-c) + f(n), a > 1
 * 4. Fibonacci-like: T(n) = T(n-1) + T(n-2) + f(n)
 * 5. Akra-Bazzi: T(n) = sum(a_i * T(n/b_i)) + g(n)
 * 6. Square-root recurrence: T(n) = a*T(sqrt n) + f(n)
 * 7. Memoization / Dynamic Programming
 */

const { Complexity, Term, O_1, O_LOG_N, O_LOG_LOG_N, O_N, O_N_LOG_N, O_N2, O_2N, O_PHI_N } = require('../complexity/symbolic');

class RecurrenceSolver {
  /**
   * Solves a recurrence relation.
   * 
   * @param {Object} recurrence
   *   - calls: array of call descriptors, e.g.:
   *       [{ a: 2, type: 'divisive', b: 2 }] -> 2 * T(n/2)
   *       [{ a: 1, type: 'subtractive', c: 1 }] -> T(n-1)
   *       [{ a: 1, type: 'subtractive', c: 1 }, { a: 1, type: 'subtractive', c: 2 }] -> T(n-1) + T(n-2)
   *       [{ a: 1, type: 'sqrt' }] -> T(sqrt(n))
   *   - work: Complexity instance or string (e.g., O_N, O_1)
   *   - isMemoized: boolean
   *   - memoStates: Complexity instance (defaults to O_N)
   *   - varName: string (defaults to 'n')
   * 
   * @returns {Object} result
   *   - timeComplexity: Complexity
   *   - spaceComplexity: Complexity
   *   - recurrenceString: string (e.g. "T(n) = 2T(n/2) + O(n)")
   *   - method: string
   *   - explanation: string
   *   - status: 'solved' | 'unsolved'
   */
  static solve(recurrence) {
    const varName = recurrence.varName || 'n';
    const work = recurrence.work instanceof Complexity ? recurrence.work : (recurrence.work ? Complexity.fromString(recurrence.work) : O_1);
    const calls = recurrence.calls || [];
    const recurrenceStr = RecurrenceSolver.formatRecurrence(calls, work, varName);

    // 0. Check for Memoization / DP
    if (recurrence.isMemoized) {
      const states = recurrence.memoStates || Complexity.of(varName, 1);
      const totalTime = states.multiply(work);
      const space = states; // DP table + call stack
      return {
        status: 'solved',
        timeComplexity: totalTime,
        spaceComplexity: space,
        recurrenceString: recurrenceStr,
        method: 'Memoization / Dynamic Programming',
        explanation: `Memoization table caches ${states.toBigO()} subproblem states with ${work.toBigO()} non-recursive work per state -> ${totalTime.toBigO()}`
      };
    }

    if (calls.length === 0) {
      return {
        status: 'solved',
        timeComplexity: work,
        spaceComplexity: O_1,
        recurrenceString: recurrenceStr,
        method: 'Non-recursive base',
        explanation: `No recursive calls detected. Work per invocation is ${work.toBigO()}.`
      };
    }

    // 1. Master Theorem: T(n) = a*T(n/b) + f(n)
    if (calls.length === 1 && calls[0].type === 'divisive') {
      const { a, b } = calls[0];
      if (a >= 1 && b > 1) {
        const mtResult = RecurrenceSolver.solveMasterTheorem(a, b, work, varName);
        if (mtResult) {
          // Recursion space depth is O(log n)
          const depth = Complexity.log(varName);
          const auxPerFrame = recurrence.auxPerCall || O_1;
          const spaceComplexity = depth.multiply(auxPerFrame);

          return {
            status: 'solved',
            timeComplexity: mtResult.complexity,
            spaceComplexity: spaceComplexity,
            recurrenceString: recurrenceStr,
            method: mtResult.method,
            explanation: mtResult.explanation
          };
        }
      }
    }

    // 2 & 3. Subtractive: T(n) = a*T(n-c) + f(n)
    if (calls.length === 1 && calls[0].type === 'subtractive') {
      const { a = 1, c = 1 } = calls[0];

      if (a === 'n' || calls[0].isFactorial) {
        const facResult = {
          complexity: Complexity.factorial(varName),
          explanation: `Recurrence branches ${varName} ways at level ${varName}, yielding T(${varName}) = ${varName} * T(${varName}-1) -> O(${varName}!)`
        };
        const depth = Complexity.of(varName, 1);
        const auxPerFrame = recurrence.auxPerCall || O_1;
        const spaceComplexity = depth.multiply(auxPerFrame);

        return {
          status: 'solved',
          timeComplexity: facResult.complexity,
          spaceComplexity: spaceComplexity,
          recurrenceString: recurrenceStr,
          method: 'Factorial Branching Recurrence',
          explanation: facResult.explanation
        };
      }

      if (a === 1) {
        // Subtractive Linear: T(n) = T(n-c) + f(n)
        const subResult = RecurrenceSolver.solveSubtractiveLinear(c, work, varName);
        const depth = Complexity.of(varName, 1);
        const auxPerFrame = recurrence.auxPerCall || O_1;
        const spaceComplexity = depth.multiply(auxPerFrame);

        return {
          status: 'solved',
          timeComplexity: subResult.complexity,
          spaceComplexity: spaceComplexity,
          recurrenceString: recurrenceStr,
          method: 'Subtractive Linear',
          explanation: subResult.explanation
        };
      } else if (a > 1) {
        // Subtractive Multi-Call: T(n) = a*T(n-c) + f(n) -> O(a^(n/c) * f(n))
        const subMultiResult = RecurrenceSolver.solveSubtractiveMulti(a, c, work, varName);
        const depth = Complexity.of(varName, 1); // Depth is still n/c
        const auxPerFrame = recurrence.auxPerCall || O_1;
        const spaceComplexity = depth.multiply(auxPerFrame);

        return {
          status: 'solved',
          timeComplexity: subMultiResult.complexity,
          spaceComplexity: spaceComplexity,
          recurrenceString: recurrenceStr,
          method: 'Subtractive Multi-Call',
          explanation: subMultiResult.explanation
        };
      }
    }

    // 4. Fibonacci-like: T(n) = T(n-1) + T(n-2) + f(n)
    if (calls.length === 2 &&
        calls.some(c => c.type === 'subtractive' && c.c === 1) &&
        calls.some(c => c.type === 'subtractive' && c.c === 2)) {
      const fibResult = RecurrenceSolver.solveFibonacciLike(work, varName);
      const depth = Complexity.of(varName, 1);
      const auxPerFrame = recurrence.auxPerCall || O_1;
      const spaceComplexity = depth.multiply(auxPerFrame);

      return {
        status: 'solved',
        timeComplexity: fibResult.complexity,
        spaceComplexity: spaceComplexity,
        recurrenceString: recurrenceStr,
        method: 'Fibonacci Characteristic Equation',
        explanation: fibResult.explanation
      };
    }

    // 5. Akra-Bazzi for unequal divisive splits: sum(a_i * T(n/b_i)) + g(n)
    const allDivisive = calls.every(c => c.type === 'divisive');
    if (allDivisive && calls.length >= 2) {
      const abResult = RecurrenceSolver.solveAkraBazzi(calls, work, varName);
      if (abResult) {
        // Recursion stack depth is log_min(b) n
        const depth = Complexity.log(varName);
        const auxPerFrame = recurrence.auxPerCall || O_1;
        const spaceComplexity = depth.multiply(auxPerFrame);

        return {
          status: 'solved',
          timeComplexity: abResult.complexity,
          spaceComplexity: spaceComplexity,
          recurrenceString: recurrenceStr,
          method: 'Akra-Bazzi Method',
          explanation: abResult.explanation
        };
      }
    }

    // 6. Square-root recurrence: T(n) = a*T(sqrt n) + f(n)
    if (calls.length === 1 && calls[0].type === 'sqrt') {
      const a = calls[0].a || 1;
      const sqrtResult = RecurrenceSolver.solveSqrtRecurrence(a, work, varName);
      const depth = Complexity.loglog(varName);
      const auxPerFrame = recurrence.auxPerCall || O_1;
      const spaceComplexity = depth.multiply(auxPerFrame);

      return {
        status: 'solved',
        timeComplexity: sqrtResult.complexity,
        spaceComplexity: spaceComplexity,
        recurrenceString: recurrenceStr,
        method: 'Square-root Recurrence',
        explanation: sqrtResult.explanation
      };
    }

    // Unsolved fallback - strictly deterministic, never guess!
    return {
      status: 'unsolved',
      timeComplexity: null,
      spaceComplexity: null,
      recurrenceString: recurrenceStr,
      method: 'Could not determine',
      explanation: 'No known deterministic recurrence rule matched this pattern.'
    };
  }

  /**
   * Master Theorem implementation
   */
  static solveMasterTheorem(a, b, work, varName = 'n') {
    const cCrit = Math.log(a) / Math.log(b);
    const dominantTerm = work.terms[0] || Term.constant();
    const varPowers = dominantTerm.vars[varName] || { poly: 0, log: 0, loglog: 0 };
    const k = varPowers.poly;
    const p = varPowers.log;

    const diff = k - cCrit;
    const eps = 1e-5;

    // Case 1: f(n) = O(n^(c_crit - eps)) => T(n) = Theta(n^(log_b a))
    if (diff < -eps) {
      let complexity;
      if (Math.abs(cCrit - Math.round(cCrit)) < eps) {
        complexity = Complexity.of(varName, Math.round(cCrit));
      } else {
        complexity = new Complexity([new Term({ vars: { [varName]: { poly: Number(cCrit.toFixed(2)) } } })]);
      }
      return {
        method: 'Master Theorem (Case 1)',
        complexity,
        explanation: `Since f(n) = ${work.toBigO()} is asymptotically smaller than n^(log_${b} ${a}) = n^${cCrit.toFixed(2)}, Case 1 applies -> ${complexity.toBigO()}`
      };
    }

    // Case 2: f(n) = Theta(n^(c_crit) * log^p n)
    if (Math.abs(diff) <= eps) {
      let complexity;
      const polyPower = Math.abs(k - Math.round(k)) < eps ? Math.round(k) : Number(k.toFixed(2));

      if (p > -1) {
        complexity = Complexity.of(varName, polyPower, p + 1);
        return {
          method: 'Master Theorem (Case 2)',
          complexity,
          explanation: `Since f(n) = ${work.toBigO()} matches n^(log_${b} ${a}), Case 2 applies -> ${complexity.toBigO()}`
        };
      } else if (p === -1) {
        const t = new Term({ vars: { [varName]: { poly: polyPower, log: 0, loglog: 1 } } });
        complexity = new Complexity([t]);
        return {
          method: 'Master Theorem (Extended Case 2, p = -1)',
          complexity,
          explanation: `Since f(n) = Theta(n^(log_${b} ${a}) / log n), Extended Case 2 applies -> ${complexity.toBigO()}`
        };
      } else {
        // p < -1
        complexity = Complexity.of(varName, polyPower, 0);
        return {
          method: 'Master Theorem (Extended Case 2, p < -1)',
          complexity,
          explanation: `Since f(n) = Theta(n^(log_${b} ${a}) * log^${p} n) with p < -1, Case 2 applies -> ${complexity.toBigO()}`
        };
      }
    }

    // Case 3: f(n) = Omega(n^(c_crit + eps))
    if (diff > eps) {
      // Regularity check: a * f(n/b) <= c * f(n) for some c < 1
      // For f(n) = n^k, a * (n/b)^k = (a / b^k) * n^k.
      // Since k > log_b a, b^k > a, so a/b^k < 1. Regularity holds!
      return {
        method: 'Master Theorem (Case 3)',
        complexity: work,
        explanation: `Since f(n) = ${work.toBigO()} dominates n^(log_${b} ${a}) = n^${cCrit.toFixed(2)} and regularity condition holds (a/b^${k} < 1), Case 3 applies -> ${work.toBigO()}`
      };
    }

    return null;
  }

  /**
   * Subtractive Linear: T(n) = T(n-c) + f(n)
   */
  static solveSubtractiveLinear(c, work, varName = 'n') {
    const dominantTerm = work.terms[0] || Term.constant();
    if (dominantTerm.isConstant()) {
      return {
        complexity: Complexity.of(varName, 1),
        explanation: `Sum of O(1) work over ${varName}/${c} levels -> O(${varName})`
      };
    }

    const varPowers = dominantTerm.vars[varName] || { poly: 0, log: 0, loglog: 0 };
    if (varPowers.poly > 0) {
      const newPoly = varPowers.poly + 1;
      const complexity = Complexity.of(varName, newPoly, varPowers.log);
      return {
        complexity,
        explanation: `Summing ${work.toBigO()} over ${varName}/${c} levels (arithmetic series) -> ${complexity.toBigO()}`
      };
    }

    if (varPowers.log > 0) {
      const complexity = Complexity.of(varName, 1, varPowers.log);
      return {
        complexity,
        explanation: `Summing log(${varName}) over ${varName}/${c} levels -> ${complexity.toBigO()}`
      };
    }

    // Fallback: multiply by n
    const complexity = work.multiply(Complexity.of(varName, 1));
    return {
      complexity,
      explanation: `Summing ${work.toBigO()} over ${varName}/${c} steps -> ${complexity.toBigO()}`
    };
  }

  /**
   * Subtractive Multi-Call: T(n) = a*T(n-c) + f(n), a > 1
   */
  static solveSubtractiveMulti(a, c, work, varName = 'n') {
    // Tree has a^(n/c) leaves.
    // Time complexity is O(a^(n/c) * f(n))
    let expBase = a;
    let expCoeff = c === 1 ? 1 : Number((1 / c).toFixed(2));

    const expTerm = Term.exp(expBase, varName, expCoeff);
    let complexity = new Complexity([expTerm]);
    if (!work.terms[0].isConstant()) {
      complexity = complexity.multiply(work);
    }

    return {
      complexity,
      explanation: `Recursion tree branches ${a} ways with depth ${varName}/${c} -> ${complexity.toBigO()}`
    };
  }

  /**
   * Fibonacci-like: T(n) = T(n-1) + T(n-2) + f(n)
   */
  static solveFibonacciLike(work, varName = 'n') {
    return {
      complexity: O_PHI_N,
      explanation: `Characteristic equation r^2 - r - 1 = 0 yields root phi = (1 + sqrt(5))/2 ≈ 1.618 -> O(phi^${varName}) (bounded above by O(2^${varName}))`
    };
  }

  /**
   * Akra-Bazzi method for sum(a_i * T(n/b_i)) + g(n)
   */
  static solveAkraBazzi(calls, work, varName = 'n') {
    // Equation: sum_{i=1}^k (a_i / b_i^p) = 1
    // Objective function: h(p) = sum(a_i / b_i^p) - 1
    const h = (p) => {
      let sum = 0;
      for (const call of calls) {
        sum += call.a / Math.pow(call.b, p);
      }
      return sum - 1;
    };

    // Bisection search for root p in [-10, 20]
    let low = -10, high = 20;
    if (h(low) * h(high) > 0) return null; // Can't bracket

    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      const val = h(mid);
      if (Math.abs(val) < 1e-7) {
        low = mid;
        high = mid;
        break;
      }
      // Since b_i > 1, h(p) is strictly decreasing in p
      if (val > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }

    const p = (low + high) / 2;

    // Compare with g(n) = work = n^k
    const dominantTerm = work.terms[0] || Term.constant();
    const k = dominantTerm.vars[varName]?.poly || 0;
    const eps = 0.01;

    let complexity;
    let explanation;

    if (k > p + eps) {
      // Integral gives Theta(n^k)
      complexity = work;
      explanation = `Akra-Bazzi root p ≈ ${p.toFixed(3)}. Non-recursive work ${work.toBigO()} has degree ${k} > p, so integral is dominated by work -> ${complexity.toBigO()}`;
    } else if (Math.abs(k - p) <= eps) {
      // Integral gives Theta(n^p * log n)
      const roundedP = Math.round(p);
      const poly = Math.abs(p - roundedP) < 0.05 ? roundedP : Number(p.toFixed(2));
      complexity = Complexity.of(varName, poly, 1);
      explanation = `Akra-Bazzi root p ≈ ${p.toFixed(3)} equals degree of work, yielding ${complexity.toBigO()}`;
    } else {
      // Integral converges, T(n) = Theta(n^p)
      const roundedP = Math.round(p);
      const poly = Math.abs(p - roundedP) < 0.05 ? roundedP : Number(p.toFixed(2));
      complexity = Complexity.of(varName, poly);
      explanation = `Akra-Bazzi root p ≈ ${p.toFixed(3)}. Growth is dominated by recursive splitting -> ${complexity.toBigO()}`;
    }

    return {
      complexity,
      explanation
    };
  }

  /**
   * Square-root recurrence: T(n) = a * T(sqrt n) + f(n)
   */
  static solveSqrtRecurrence(a, work, varName = 'n') {
    if (a === 1 && work.terms[0].isConstant()) {
      return {
        complexity: O_LOG_LOG_N,
        explanation: `Repeated square root reduces ${varName} to 2 in log log ${varName} steps with O(1) work per step -> O(log log ${varName})`
      };
    }

    if (a === 2 && work.terms[0].isConstant()) {
      return {
        complexity: O_LOG_N,
        explanation: `Substitute m = log ${varName}, S(m) = 2S(m/2) + O(1) -> O(m) = O(log ${varName})`
      };
    }

    return {
      complexity: O_LOG_LOG_N,
      explanation: `Square root recurrence reduces ${varName} in log log ${varName} steps -> O(log log ${varName})`
    };
  }

  static formatRecurrence(calls, work, varName = 'n') {
    if (calls.length === 0) return `T(${varName}) = ${work.toBigO()}`;

    const callParts = calls.map(c => {
      let shrink;
      if (c.type === 'divisive') shrink = `${varName}/${c.b}`;
      else if (c.type === 'subtractive') shrink = `${varName}-${c.c}`;
      else if (c.type === 'sqrt') shrink = `sqrt(${varName})`;
      else shrink = c.shrink || `${varName}-1`;

      const coeff = (c.a && c.a !== 1) ? `${c.a}` : '';
      return `${coeff}T(${shrink})`;
    });

    const callsStr = callParts.join(' + ');
    const workStr = work.toBigO();
    return `T(${varName}) = ${callsStr} + ${workStr}`;
  }
}

module.exports = {
  RecurrenceSolver
};
