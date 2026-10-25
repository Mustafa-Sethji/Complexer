/**
 * Symbolic Big-O Complexity Representation and Arithmetic
 *
 * Supports:
 * - Polynomial terms: n, n^2, n^k
 * - Logarithmic terms: log n, n log n
 * - Log-logarithmic terms: log log n
 * - Exponential terms: 2^n, 3^n, phi^n
 * - Factorial terms: n!
 * - Multiple variables: V, E, n, m
 */

class Term {
  constructor(options = {}) {
    const {
      coeff = 1,
      vars = {},
      expBase = null,
      expVar = null,
      expCoeff = 1,
      isFactorial = false,
      factorialVar = null
    } = options;

    this.coeff = coeff;
    this.isFactorial = Boolean(isFactorial);
    this.factorialVar = factorialVar;

    this.vars = {};

    for (const [v, powers] of Object.entries(vars)) {
      const poly = powers.poly || 0;
      const log = powers.log || 0;
      const loglog = powers.loglog || 0;

      if (poly !== 0 || log !== 0 || loglog !== 0) {
        this.vars[v] = { poly, log, loglog };
      }
    }

    this.expBase = expBase;
    this.expVar = expVar;
    this.expCoeff = expCoeff || 1;
  }

  static constant() {
    return new Term();
  }

  static factorial(v = 'n') {
    return new Term({
      isFactorial: true,
      factorialVar: v
    });
  }

  static fromVar(v = 'n', poly = 1, log = 0, loglog = 0) {
    return new Term({
      vars: {
        [v]: { poly, log, loglog }
      }
    });
  }

  static log(v = 'n', power = 1) {
    return new Term({
      vars: {
        [v]: { poly: 0, log: power, loglog: 0 }
      }
    });
  }

  static loglog(v = 'n', power = 1) {
    return new Term({
      vars: {
        [v]: { poly: 0, log: 0, loglog: power }
      }
    });
  }

  static sqrt(v = 'n') {
    return new Term({
      vars: {
        [v]: { poly: 0.5, log: 0, loglog: 0 }
      }
    });
  }

  static exp(base = 2, v = 'n', coeff = 1) {
    return new Term({
      expBase: base,
      expVar: v,
      expCoeff: coeff
    });
  }

  isConstant() {
    return (
      Object.keys(this.vars).length === 0 &&
      !this.expBase &&
      !this.isFactorial
    );
  }

  hasVar(v) {
    return Boolean(this.vars[v] || this.expVar === v);
  }

  clone() {
    const newVars = {};

    for (const [v, powers] of Object.entries(this.vars)) {
      newVars[v] = { ...powers };
    }

    return new Term({
      coeff: this.coeff,
      vars: newVars,
      expBase: this.expBase,
      expVar: this.expVar,
      expCoeff: this.expCoeff,
      isFactorial: this.isFactorial,
      factorialVar: this.factorialVar
    });
  }

  getNumericBase(base) {
    if (base === 'phi') {
      return 1.61803398875;
    }

    return Number(base);
  }

  getExpValue() {
    if (!this.expBase) {
      return 0;
    }

    const base = this.getNumericBase(this.expBase);

    if (!Number.isFinite(base) || base <= 0) {
      return 0;
    }

    return Math.log(base) * this.expCoeff;
  }

  multiply(other) {
    if (!(other instanceof Term)) {
      throw new TypeError('Term.multiply expects another Term.');
    }

    // Preserve factorial representation.
    if (this.isFactorial || other.isFactorial) {
      const factorialTerm = this.isFactorial ? this : other;
      const otherTerm = this.isFactorial ? other : this;

      // n! * polynomial(n) is not simply n!.
      // The current representation cannot express every such product.
      if (
        otherTerm.isConstant() ||
        !otherTerm.expBase
      ) {
        return new Term({
          isFactorial: true,
          factorialVar: factorialTerm.factorialVar || 'n'
        });
      }

      return new Term({
        isFactorial: true,
        factorialVar: factorialTerm.factorialVar || 'n'
      });
    }

    const resultVars = {};

    const allVars = new Set([
      ...Object.keys(this.vars),
      ...Object.keys(other.vars)
    ]);

    for (const v of allVars) {
      const p1 = this.vars[v] || {
        poly: 0,
        log: 0,
        loglog: 0
      };

      const p2 = other.vars[v] || {
        poly: 0,
        log: 0,
        loglog: 0
      };

      const poly = p1.poly + p2.poly;
      const log = p1.log + p2.log;
      const loglog = p1.loglog + p2.loglog;

      if (poly !== 0 || log !== 0 || loglog !== 0) {
        resultVars[v] = { poly, log, loglog };
      }
    }

    let expBase = null;
    let expVar = null;
    let expCoeff = 1;

    if (this.expBase && !other.expBase) {
      expBase = this.expBase;
      expVar = this.expVar;
      expCoeff = this.expCoeff;
    } else if (!this.expBase && other.expBase) {
      expBase = other.expBase;
      expVar = other.expVar;
      expCoeff = other.expCoeff;
    } else if (
      this.expBase &&
      other.expBase &&
      this.expVar === other.expVar
    ) {
      const base1 = this.getNumericBase(this.expBase);
      const base2 = other.getNumericBase(other.expBase);

      // b1^(c1*n) * b2^(c2*n)
      // = (b1^c1 * b2^c2)^n
      const combinedBase =
        Math.pow(base1, this.expCoeff) *
        Math.pow(base2, other.expCoeff);

      expBase = combinedBase;
      expVar = this.expVar;
      expCoeff = 1;
    } else if (this.expBase && other.expBase) {
      // Independent exponential variables cannot be represented
      // exactly by a single exponential term in this model.
      expBase = this.expBase;
      expVar = this.expVar;
      expCoeff = this.expCoeff;
    }

    return new Term({
      coeff: this.coeff * other.coeff,
      vars: resultVars,
      expBase,
      expVar,
      expCoeff
    });
  }

  /**
   * Compare asymptotic growth.
   *
   * Returns:
   *  1    this term dominates other
   * -1    other dominates this
   *  0    equivalent growth
   * null  incomparable using this representation
   */
  compare(other) {
    if (this.isConstant() && other.isConstant()) {
      return 0;
    }

    if (this.isConstant()) {
      return -1;
    }

    if (other.isConstant()) {
      return 1;
    }

    // Factorial growth.
    if (this.isFactorial && !other.isFactorial) {
      return 1;
    }

    if (!this.isFactorial && other.isFactorial) {
      return -1;
    }

    if (this.isFactorial && other.isFactorial) {
      return this.factorialVar === other.factorialVar ? 0 : null;
    }

    // Exponential growth.
    const thisExp = this.getExpValue();
    const otherExp = other.getExpValue();

    if (Math.abs(thisExp - otherExp) > 1e-9) {
      return thisExp > otherExp ? 1 : -1;
    }

    // Compare polynomial and logarithmic factors.
    const thisVars = Object.keys(this.vars);
    const otherVars = Object.keys(other.vars);

    const commonVars = thisVars.filter(v => otherVars.includes(v));

    if (
      commonVars.length === 0 &&
      thisVars.length > 0 &&
      otherVars.length > 0
    ) {
      return null;
    }

    const allVars = new Set([...thisVars, ...otherVars]);

    let thisHigher = false;
    let otherHigher = false;

    for (const v of allVars) {
      const p1 = this.vars[v] || {
        poly: 0,
        log: 0,
        loglog: 0
      };

      const p2 = other.vars[v] || {
        poly: 0,
        log: 0,
        loglog: 0
      };

      // Compare powers lexicographically:
      // polynomial > logarithmic > log-logarithmic.
      let comparison = 0;

      if (Math.abs(p1.poly - p2.poly) > 1e-9) {
        comparison = p1.poly > p2.poly ? 1 : -1;
      } else if (Math.abs(p1.log - p2.log) > 1e-9) {
        comparison = p1.log > p2.log ? 1 : -1;
      } else if (Math.abs(p1.loglog - p2.loglog) > 1e-9) {
        comparison = p1.loglog > p2.loglog ? 1 : -1;
      }

      if (comparison === 1) {
        thisHigher = true;
      } else if (comparison === -1) {
        otherHigher = true;
      }
    }

    if (thisHigher && !otherHigher) {
      return 1;
    }

    if (otherHigher && !thisHigher) {
      return -1;
    }

    if (!thisHigher && !otherHigher) {
      return 0;
    }

    return null;
  }

  format() {
    if (this.isFactorial) {
      return `${this.factorialVar || 'n'}!`;
    }

    if (this.isConstant()) {
      return '1';
    }

    const parts = [];

    if (this.expBase) {
      const base = this.expBase === 'phi'
        ? 'phi'
        : String(Number(this.expBase.toFixed
          ? this.expBase.toFixed(6)
          : this.expBase));

      const exponent = this.expCoeff === 1
        ? this.expVar
        : `${this.expCoeff}${this.expVar}`;

      parts.push(`${base}^${exponent}`);
    }

    const polynomialParts = [];
    const logParts = [];
    const loglogParts = [];

    const order = {
      n: 1,
      m: 2,
      k: 3,
      W: 4,
      E: 5,
      e: 5,
      V: 6,
      v: 6
    };

    const varNames = Object.keys(this.vars).sort((a, b) => {
      const oa = order[a] || 99;
      const ob = order[b] || 99;

      if (oa !== ob) {
        return oa - ob;
      }

      return a.localeCompare(b);
    });

    for (const v of varNames) {
      const { poly, log, loglog } = this.vars[v];

      if (poly !== 0) {
        if (poly === 1) {
          polynomialParts.push(v);
        } else if (poly === 0.5) {
          polynomialParts.push(`sqrt(${v})`);
        } else {
          const power = Number.isInteger(poly)
            ? poly
            : Number(poly.toFixed(3));

          polynomialParts.push(`${v}^${power}`);
        }
      }

      if (loglog !== 0) {
        if (loglog === 1) {
          loglogParts.push(`log log ${v}`);
        } else {
          loglogParts.push(`(log log ${v})^${loglog}`);
        }
      }

      if (log !== 0) {
        if (log === 1) {
          logParts.push(`log ${v}`);
        } else {
          logParts.push(`(log ${v})^${log}`);
        }
      }
    }

    parts.push(...polynomialParts, ...loglogParts, ...logParts);

    if (parts.length === 0) {
      return '1';
    }

    return parts.reduce((result, part) => {
      if (!result) {
        return part;
      }

      if (
        part.startsWith('log') ||
        part.startsWith('(log') ||
        part.startsWith('sqrt')
      ) {
        return `${result} ${part}`;
      }

      // Multi-letter variables (amount, target, ...) need the explicit
      // '*' too, otherwise "n amount" reads like one odd expression.
      if (
        /^[A-Za-z_]\w*(?:\^[\w.]+)?$/.test(part) &&
        /(?:^|[*\s])[A-Za-z_]\w*(?:\^[\w.]+)?$/.test(result) &&
        !/\blog\b/.test(result)
      ) {
        return `${result}*${part}`;
      }

      return `${result} ${part}`;
    }, '');
  }
}

class Complexity {
  constructor(terms = []) {
    if (terms instanceof Term) {
      this.terms = [terms.clone()];
    } else if (!Array.isArray(terms) || terms.length === 0) {
      this.terms = [Term.constant()];
    } else {
      this.terms = terms.map(term => term.clone());
    }

    this.simplify();
  }

  static constant() {
    return new Complexity([Term.constant()]);
  }

  static factorial(v = 'n') {
    return new Complexity([Term.factorial(v)]);
  }

  isConstant() {
    return this.terms.every(term => term.isConstant());
  }

  static of(v = 'n', poly = 1, log = 0, loglog = 0) {
    return new Complexity([
      Term.fromVar(v, poly, log, loglog)
    ]);
  }

  static log(v = 'n', power = 1) {
    return new Complexity([Term.log(v, power)]);
  }

  static loglog(v = 'n', power = 1) {
    return new Complexity([Term.loglog(v, power)]);
  }

  static sqrt(v = 'n') {
    return new Complexity([Term.sqrt(v)]);
  }

  static exp(base = 2, v = 'n', coeff = 1) {
    return new Complexity([Term.exp(base, v, coeff)]);
  }

  static fromString(str) {
    if (typeof str !== 'string') {
      return Complexity.constant();
    }

    let value = str.trim();

    value = value.replace(/^O\((.*)\)$/i, '$1').trim();
    value = value.replace(/²/g, '^2').replace(/³/g, '^3');

    const normalized = value.toLowerCase();

    if (normalized === '1' || normalized === 'constant') {
      return Complexity.constant();
    }

    if (normalized === 'log n') {
      return Complexity.log('n');
    }

    if (normalized === 'log log n') {
      return Complexity.loglog('n');
    }

    if (normalized === 'sqrt(n)' || normalized === 'sqrt n') {
      return Complexity.sqrt('n');
    }

    if (normalized === 'n') {
      return Complexity.of('n', 1);
    }

    if (normalized === 'n log n' || normalized === 'n*log n') {
      return Complexity.of('n', 1, 1);
    }

    if (normalized === 'n^2') {
      return Complexity.of('n', 2);
    }

    if (normalized === 'n^3') {
      return Complexity.of('n', 3);
    }

    if (normalized === '2^n') {
      return Complexity.exp(2, 'n');
    }

    if (normalized === '3^n') {
      return Complexity.exp(3, 'n');
    }

    if (normalized === 'phi^n') {
      return Complexity.exp('phi', 'n');
    }

    if (normalized === 'n!' || normalized === 'n !') {
      return Complexity.factorial('n');
    }

    if (
      normalized === 'v + e' ||
      normalized === 'v+e'
    ) {
      return O_V_PLUS_E.clone();
    }

    if (
      normalized === 'v^2' ||
      normalized === 'v²'
    ) {
      return O_V2.clone();
    }

    if (
      normalized === 'e log v' ||
      normalized === 'e*log v'
    ) {
      return O_E_LOG_V.clone();
    }

    if (normalized === 'v') {
      return Complexity.of('V', 1);
    }

    if (normalized === 'e') {
      return Complexity.of('E', 1);
    }

    if (normalized === 'n*m' || normalized === 'n m') {
      return new Complexity([
        new Term({
          vars: {
            n: { poly: 1 },
            m: { poly: 1 }
          }
        })
      ]);
    }

    // Do not silently classify an unknown string as O(n).
    throw new Error(`Unsupported complexity expression: ${str}`);
  }

  clone() {
    return new Complexity(this.terms);
  }

  simplify() {
    if (this.terms.length <= 1) {
      return;
    }

    const hasNonConstant = this.terms.some(
      term => !term.isConstant()
    );

    const activeTerms = hasNonConstant
      ? this.terms.filter(term => !term.isConstant())
      : this.terms;

    const kept = [];

    for (const term of activeTerms) {
      let dominated = false;

      for (let i = 0; i < kept.length; i++) {
        const comparison = term.compare(kept[i]);

        if (comparison === -1 || comparison === 0) {
          dominated = true;
          break;
        }

        if (comparison === 1) {
          kept.splice(i, 1);
          i--;
        }
      }

      if (!dominated) {
        kept.push(term);
      }
    }

    this.terms = kept.length > 0
      ? kept
      : [Term.constant()];
  }

  add(other) {
    if (!(other instanceof Complexity)) {
      throw new TypeError('Complexity.add expects a Complexity.');
    }

    return new Complexity([
      ...this.terms,
      ...other.terms
    ]);
  }

  multiply(other) {
    if (!(other instanceof Complexity)) {
      throw new TypeError('Complexity.multiply expects a Complexity.');
    }

    const multiplied = [];

    for (const first of this.terms) {
      for (const second of other.terms) {
        multiplied.push(first.multiply(second));
      }
    }

    return new Complexity(multiplied);
  }

  max(other) {
    return this.add(other);
  }

  toBigO() {
    if (this.terms.length === 0) {
      return 'O(1)';
    }

    const formatted = this.terms
      .map(term => term.format())
      .join(' + ');

    return `O(${formatted})`;
  }

  toString() {
    return this.toBigO();
  }

  equals(other) {
    if (!(other instanceof Complexity)) {
      return false;
    }

    const normalize = value =>
      value
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/\s+/g, ' ')
        .trim();

    return normalize(this.toBigO()) === normalize(other.toBigO());
  }
}

// --------------------------------------------------
// Preset complexities
// --------------------------------------------------

const O_1 = Complexity.constant();

const O_LOG_N = Complexity.log('n');
const O_LOG_LOG_N = Complexity.loglog('n');
const O_SQRT_N = Complexity.sqrt('n');

const O_N = Complexity.of('n', 1);
const O_N_LOG_N = Complexity.of('n', 1, 1);
const O_N2 = Complexity.of('n', 2);
const O_N3 = Complexity.of('n', 3);

const O_2N = Complexity.exp(2, 'n');
const O_PHI_N = Complexity.exp('phi', 'n');

const O_N_FAC = Complexity.factorial('n');

const O_V_PLUS_E = Complexity
  .of('V', 1)
  .add(Complexity.of('E', 1));

const O_V2 = Complexity.of('V', 2);

const O_E_LOG_V = Complexity
  .of('E', 1)
  .multiply(Complexity.log('V'));

// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
  Term,
  Complexity,
  O_1,
  O_LOG_N,
  O_LOG_LOG_N,
  O_SQRT_N,
  O_N,
  O_N_LOG_N,
  O_N2,
  O_N3,
  O_2N,
  O_PHI_N,
  O_N_FAC,
  O_V_PLUS_E,
  O_V2,
  O_E_LOG_V
};