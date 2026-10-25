// Polynomials modulo a prime P and root finding — the shared inversion algorithm for steps 2–25.
//
// A polynomial is an array of coefficients from lowest to highest: [c₀, c₁, c₂] = c₀ + c₁·m + c₂·m².
//
// How to find a root of f (the Cantor–Zassenhaus algorithm). It rests on Fermat's little theorem: m^P = m for every m.
//   1. GCD(f, m^P − m) is a polynomial whose roots are exactly the roots of f among the numbers 0 … P−1.
//      m^P itself is never built — only its remainder modulo f (by repeated squaring).
//   2. Split it into parts. Half of the nonzero numbers have a^((P−1)/2) = 1, the other half −1.
//      GCD(g, (m + r)^((P−1)/2) − 1) with a random r takes about half of the roots.
//      Take either part and repeat until a polynomial of the form (m − root) is left.
//
// Almost all the time goes into step 1: ~2·log P multiplications of polynomials of degree deg f and as many divisions,
// then the GCD of two polynomials of degree deg f. Done schoolbook-style, all of this costs (deg f)². Here everything is fast:
//   - multiplication — by Kronecker substitution: pack the polynomial into one huge number (64 bits
//     per coefficient); the numbers are multiplied by the built-in BigInt, which uses fast multiplication inside;
//   - remainder modulo f — via an "inverse" of f, computed once by Newton's method;
//   - GCD — via half-GCD (see hgcd below).
// Total: ~deg f · log² (deg f) instead of (deg f)².

export function polynomials(P: number) {
  // --- Numbers modulo P ----------------------------------------------------
  // All numbers are < P < 2²⁶, so products are < 2⁵² — plain JS numbers compute them exactly.
  // (Except polynomial multiplication — that uses BigInt, see mul.)

  const mod = (a: number): number => ((a % P) + P) % P;

  /** a · b modulo P without the slow %: estimate the quotient by multiplying by 1/P and correct it by ±1. */
  const invP = 1 / P;
  function mulMod(a: number, b: number): number {
    const t = a * b;
    const r = t - Math.floor(t * invP) * P;
    return r < 0 ? r + P : r >= P ? r - P : r;
  }

  function powMod(b: number, e: number): number {
    let r = 1;
    for (b = mod(b); e > 0; e = Math.floor(e / 2)) {
      if (e % 2) r = (r * b) % P;
      b = (b * b) % P;
    }
    return r;
  }

  /** 1/a modulo P: by Fermat's theorem a^(P−2) · a = a^(P−1) = 1. */
  const inv = (a: number): number => powMod(a, P - 2);

  // --- Simple operations ---------------------------------------------------

  /** Removes zero leading coefficients. The zero polynomial is an empty array. */
  function trim(a: number[]): number[] {
    let n = a.length;
    while (n > 0 && a[n - 1] === 0) n--;
    return a.length === n ? a : a.slice(0, n);
  }

  const deg = (a: number[]): number => a.length - 1;

  function add(a: number[], b: number[]): number[] {
    const n = Math.max(a.length, b.length);
    return trim(Array.from({ length: n }, (_, i) => mod((a[i] ?? 0) + (b[i] ?? 0))));
  }

  function sub(a: number[], b: number[]): number[] {
    const n = Math.max(a.length, b.length);
    return trim(Array.from({ length: n }, (_, i) => mod((a[i] ?? 0) - (b[i] ?? 0))));
  }

  /** Schoolbook multiplication: (deg)² operations. */
  function mulSlow(a: number[], b: number[]): number[] {
    const r = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      if (a[i] === 0) continue;
      for (let j = 0; j < b.length; j++) {
        const s = r[i + j] + mulMod(a[i], b[j]);
        r[i + j] = s >= P ? s - P : s;
      }
    }
    return trim(r);
  }

  /**
   * Multiplication: short ones schoolbook, long ones by Kronecker substitution.
   * Substitute the number 2⁶⁴ for m: the polynomial becomes a number in which each coefficient takes its own 64 bits
   * (16 hex digits). The product of the numbers is the product of the polynomials: the product's coefficients
   * are below n·P² < 2⁶⁴ and don't overlap. The built-in BigInt multiplies huge numbers fast.
   */
  const TWO32 = 2 ** 32 % P;
  function mul(a: number[], b: number[]): number[] {
    if (!a.length || !b.length) return [];
    if (Math.min(a.length, b.length) < 32) return mulSlow(a, b);
    if (Math.min(a.length, b.length) * (P - 1) ** 2 >= 2 ** 64) throw new Error("coefficients won't fit in 64 bits");
    const pack = (p: number[]) => BigInt("0x" + p.map((c) => c.toString(16).padStart(16, "0")).reverse().join(""));
    const n = a.length + b.length - 1;
    const hex = (pack(a) * pack(b)).toString(16).padStart(16 * n, "0");
    const r = new Array(n);
    for (let i = 0; i < n; i++) {
      const at = hex.length - 16 * (i + 1); // coefficient i is the i-th group of 16 hex digits from the end
      const hi = parseInt(hex.slice(at, at + 8), 16) % P;
      const lo = parseInt(hex.slice(at + 8, at + 16), 16) % P;
      const v = mulMod(hi, TWO32) + lo; // hi·2³² + lo modulo P
      r[i] = v >= P ? v - P : v;
    }
    return trim(r);
  }

  /** Reduces by Fermat's theorem: m^P = m, so m^k with k ≥ P is replaced by m^(k−P+1). The roots stay the same. */
  function fermat(f: number[]): number[] {
    if (f.length <= P) return f;
    const r = f.slice();
    for (let k = r.length - 1; k >= P; k--) {
      // top down: if m^(k−P+1) is again not below P, it gets moved when we reach it
      const s = r[k - P + 1] + r[k];
      r[k - P + 1] = s >= P ? s - P : s;
    }
    return trim(r.slice(0, P));
  }

  /** Long division: a = q·b + remainder. Needed for the GCD, where the divisor is new every time. */
  function divmod(a: number[], b: number[]): [number[], number[]] {
    const r = a.slice();
    const q = new Array(Math.max(0, a.length - b.length + 1)).fill(0);
    const lead = inv(b[deg(b)]);
    for (let i = a.length - b.length; i >= 0; i--) {
      const c = (r[i + deg(b)] * lead) % P;
      q[i] = c;
      if (c !== 0) for (let j = 0; j < b.length; j++) r[i + j] = mod(r[i + j] - c * b[j]);
    }
    return [trim(q), trim(r)];
  }

  /**
   * Fast remainder modulo a fixed f. The trick: "reverse" the polynomials (rev),
   * then the quotient is the beginning of the series rev(a) / rev(f). The series 1 / rev(f) is computed once by Newton's method:
   * g ← g·(2 − rev(f)·g), and each time the number of correct coefficients doubles.
   * After that, every remainder costs two multiplications.
   */
  function reducer(f: number[]): (a: number[]) => number[] {
    const d = deg(f);
    const rf = f.slice().reverse();
    let g = [inv(rf[0])];
    for (let t = 1; t < d; t *= 2) {
      const t2 = Math.min(2 * t, d);
      const e = sub([2], mul(rf.slice(0, t2), g).slice(0, t2));
      g = mul(g, e).slice(0, t2);
    }
    return (a) => {
      if (a.length <= d) return a;
      const n = a.length - d; // the quotient has this many coefficients
      const rq = mul(a.slice().reverse().slice(0, n), g.slice(0, n)).slice(0, n);
      const q = rq.concat(new Array(n - rq.length).fill(0)).reverse();
      return trim(sub(a, mul(q, f)).slice(0, d));
    };
  }

  /** base^e modulo f — by repeated squaring. progress receives the fraction of the bits of e done. */
  function powPoly(base: number[], e: number, f: number[], progress?: (done: number) => void): number[] {
    const rem = reducer(f);
    const bits = Math.floor(Math.log2(e)) + 1;
    let r = [1];
    base = rem(base);
    for (let i = 1; e > 0; e = Math.floor(e / 2), i++) {
      if (e % 2) r = rem(mul(r, base));
      base = rem(mul(base, base));
      progress?.(i / bits);
    }
    return r;
  }

  /** Makes the leading coefficient 1. */
  function monic(a: number[]): number[] {
    const lead = inv(a[deg(a)]);
    return a.map((c) => (c * lead) % P);
  }

  /** Schoolbook GCD (Euclid's algorithm): ~(deg)² operations. */
  function gcdSlow(a: number[], b: number[]): number[] {
    while (b.length) [a, b] = [b, divmod(a, b)[1]];
    return monic(a);
  }

  // --- Fast GCD (half-GCD) -------------------------------------------------
  // A Euclid step (a, b) → (b, a − q·b) is multiplying the pair by the matrix [[0, 1], [1, −q]].
  // The first Euclid steps depend only on the leading coefficients of a and b. So hgcd recursively
  // solves the problem for the upper halves and returns a matrix that does all those steps at once:
  // the degree is halved in ~deg · log deg operations. The whole GCD is ~deg · log² deg instead of deg².

  type Matrix = [number[], number[], number[], number[]]; // [[m₀, m₁], [m₂, m₃]]
  const I: Matrix = [[1], [], [], [1]];

  /** M · (a, b). */
  function apply(M: Matrix, a: number[], b: number[]): [number[], number[]] {
    return [add(mul(M[0], a), mul(M[1], b)), add(mul(M[2], a), mul(M[3], b))];
  }

  /** A · B. */
  function times(A: Matrix, B: Matrix): Matrix {
    return [
      add(mul(A[0], B[0]), mul(A[1], B[2])),
      add(mul(A[0], B[1]), mul(A[1], B[3])),
      add(mul(A[2], B[0]), mul(A[3], B[2])),
      add(mul(A[2], B[1]), mul(A[3], B[3])),
    ];
  }

  /** Same as hgcd, but one Euclid step at a time — for short polynomials this is faster than recursion. */
  function hgcdSlow(a: number[], b: number[]): Matrix {
    const m = Math.ceil(deg(a) / 2);
    let M = I;
    while (deg(b) >= m) {
      const [q, r] = divmod(a, b);
      M = times([[], [1], [1], sub([], q)], M);
      [a, b] = [b, r];
    }
    return M;
  }

  /**
   * The matrix M such that M · (a, b) = (c, d) and deg d < ⌈deg a / 2⌉ ≤ deg c. Requires deg a > deg b.
   * progress — the fraction done: each of the two recursive calls takes about 45% of the time.
   */
  function hgcd(a: number[], b: number[], progress?: (done: number) => void): Matrix {
    if (a.length < 64) return hgcdSlow(a, b);
    const m = Math.ceil(deg(a) / 2);
    if (deg(b) < m) return I;
    const part = (from: number) => progress && ((done: number) => progress(from + 0.45 * done));
    const R = hgcd(a.slice(m), b.slice(m), part(0)); // upper halves
    const [c, d] = apply(R, a, b);
    if (deg(d) < m) return R;
    const [q, e] = divmod(c, d); //                      one Euclid step by hand
    const k = 2 * m - deg(d);
    const S = hgcd(d.slice(k), e.slice(k), part(0.5)); // and once more — for the upper parts of the new remainder
    const M = times(S, times([[], [1], [1], sub([], q)], R));
    progress?.(1);
    return M;
  }

  /**
   * GCD of polynomials, with leading coefficient 1. Short ones by Euclid, long ones via hgcd.
   * progress — what fraction of the degree is already "eaten": each hgcd eats about half of what is left.
   */
  function gcd(a: number[], b: number[], progress?: (done: number) => void): number[] {
    if (deg(a) < deg(b)) [a, b] = [b, a];
    const start = deg(a);
    const eaten = () => 1 - Math.max(deg(b), 0) / start;
    while (b.length) {
      [a, b] = [b, divmod(a, b)[1]]; // Euclid step: now deg a > deg b — hgcd needs this
      if (b.length && a.length > 256) {
        const from = eaten();
        [a, b] = apply(hgcd(a, b, progress && ((done) => progress(from + ((1 - from) / 2) * done))), a, b);
      }
      progress?.(eaten());
    }
    return monic(a);
  }

  /** Splits g into random "halves" until (m − root) is left. */
  function split(g: number[]): number | null {
    if (g.length < 2) return null; // degree 0 — no roots
    if (g.length === 2) return mod(-g[0] * inv(g[1])); // g = g₁·m + g₀  →  m = −g₀ / g₁
    for (;;) {
      const r = Math.floor(Math.random() * P);
      const d = gcd(g, sub(powPoly([r, 1], (P - 1) / 2, g), [1]));
      if (d.length > 1 && d.length < g.length) return split(d);
    }
  }

  /**
   * Some root of f modulo P (or null if there are no roots).
   * progress (optional) receives the fraction of work done, from 0 to 1 — for showing percentages.
   */
  function findRoot(f: number[], progress?: (done: number) => void): number | null {
    f = trim(f.map(mod));
    const X = [0, 1]; // the polynomial "m"
    // For percentages: m^P is about a tenth of the work, the GCD is the rest.
    // Report at most once per 0.1% — otherwise there would be tens of thousands of messages.
    let last = -1;
    const report = (done: number) => {
      if (done - last >= 0.001) progress?.((last = done));
    };
    // Step 1: GCD(f, m^P − m).
    const xp = powPoly(X, P, f, (done) => report(0.1 * done));
    const g = gcd(f, sub(xp, X), (done) => report(0.1 + 0.9 * done));
    return split(g); // step 2: split until (m − root) is left
  }

  return { add, mul, mulSlow, fermat, gcd, gcdSlow, findRoot };
}
