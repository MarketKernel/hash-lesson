// Многочлены по модулю простого P и поиск корня — общий алгоритм обращения для шагов 2–25.
//
// Многочлен — массив коэффициентов от младшего к старшему: [c₀, c₁, c₂] = c₀ + c₁·m + c₂·m².
//
// Как найти корень f (алгоритм Кантора–Цассенхауса). Держится на малой теореме Ферма: m^P = m для любого m.
//   1. НОД(f, m^P − m) — многочлен, корни которого ровно корни f среди чисел 0 … P−1.
//      Сам m^P не строим — только остаток от деления на f (через возведение в квадрат).
//   2. Его делим на части. У половины ненулевых чисел a^((P−1)/2) = 1, у другой половины −1.
//      НОД(g, (m + r)^((P−1)/2) − 1) со случайным r забирает примерно половину корней.
//      Берём любую часть и повторяем, пока не останется многочлен вида (m − корень).
//
// Почти всё время уходит в шаг 1: ~2·log P умножений многочленов степени deg f и столько же делений,
// потом НОД двух многочленов степени deg f. «В столбик» всё это стоит (deg f)². Здесь всё быстрое:
//   - умножение — подстановкой Кронекера: многочлен упаковываем в одно огромное число (по 64 бита
//     на коэффициент), числа умножает встроенный BigInt — у него внутри быстрое умножение;
//   - остаток от деления на f — через «обратный» к f, посчитанный один раз методом Ньютона;
//   - НОД — через half-GCD (см. hgcd ниже).
// Итого ~deg f · log² (deg f) вместо (deg f)².

export function polynomials(P: number) {
  // --- Числа по модулю P ---------------------------------------------------
  // Все числа < P < 2²⁶, поэтому произведения < 2⁵² — обычные числа JS считают их точно.
  // (Кроме умножения многочленов — там BigInt, см. mul.)

  const mod = (a: number): number => ((a % P) + P) % P;

  /** a · b по модулю P без медленного %: частное оцениваем умножением на 1/P и поправляем на ±1. */
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

  /** 1/a по модулю P: по теореме Ферма a^(P−2) · a = a^(P−1) = 1. */
  const inv = (a: number): number => powMod(a, P - 2);

  // --- Простые операции ----------------------------------------------------

  /** Убирает нулевые старшие коэффициенты. У нулевого многочлена — пустой массив. */
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

  /** Умножение «в столбик»: (deg)² операций. */
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
   * Умножение: короткие — в столбик, длинные — подстановкой Кронекера.
   * Подставим вместо m число 2⁶⁴: многочлен станет числом, где каждый коэффициент занимает свои 64 бита
   * (16 hex-цифр). Произведение чисел — это произведение многочленов: коэффициенты произведения
   * меньше n·P² < 2⁶⁴ и не залезают друг на друга. Огромные числа быстро умножает встроенный BigInt.
   */
  const TWO32 = 2 ** 32 % P;
  function mul(a: number[], b: number[]): number[] {
    if (!a.length || !b.length) return [];
    if (Math.min(a.length, b.length) < 32) return mulSlow(a, b);
    if (Math.min(a.length, b.length) * (P - 1) ** 2 >= 2 ** 64) throw new Error("коэффициенты не влезут в 64 бита");
    const pack = (p: number[]) => BigInt("0x" + p.map((c) => c.toString(16).padStart(16, "0")).reverse().join(""));
    const n = a.length + b.length - 1;
    const hex = (pack(a) * pack(b)).toString(16).padStart(16 * n, "0");
    const r = new Array(n);
    for (let i = 0; i < n; i++) {
      const at = hex.length - 16 * (i + 1); // i-й коэффициент — i-я с конца группа из 16 hex-цифр
      const hi = parseInt(hex.slice(at, at + 8), 16) % P;
      const lo = parseInt(hex.slice(at + 8, at + 16), 16) % P;
      const v = mulMod(hi, TWO32) + lo; // hi·2³² + lo по модулю P
      r[i] = v >= P ? v - P : v;
    }
    return trim(r);
  }

  /** Урезает по теореме Ферма: m^P = m, поэтому m^k при k ≥ P заменяем на m^(k−P+1). Корни те же. */
  function fermat(f: number[]): number[] {
    if (f.length <= P) return f;
    const r = f.slice();
    for (let k = r.length - 1; k >= P; k--) {
      // сверху вниз: если m^(k−P+1) снова не меньше P, его перенесём, когда дойдём до него
      const s = r[k - P + 1] + r[k];
      r[k - P + 1] = s >= P ? s - P : s;
    }
    return trim(r.slice(0, P));
  }

  /** Деление в столбик: a = q·b + остаток. Нужно для НОД, где делитель каждый раз новый. */
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
   * Быстрый остаток от деления на фиксированный f. Приём: «переворачиваем» многочлены (rev),
   * тогда частное — это начало ряда rev(a) / rev(f). Ряд 1 / rev(f) считаем один раз методом Ньютона:
   * g ← g·(2 − rev(f)·g), и каждый раз число верных коэффициентов удваивается.
   * Дальше каждый остаток — два умножения.
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
      const n = a.length - d; // столько коэффициентов у частного
      const rq = mul(a.slice().reverse().slice(0, n), g.slice(0, n)).slice(0, n);
      const q = rq.concat(new Array(n - rq.length).fill(0)).reverse();
      return trim(sub(a, mul(q, f)).slice(0, d));
    };
  }

  /** base^e по модулю f — через возведение в квадрат. progress получает долю пройденных бит e. */
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

  /** Старший коэффициент — 1. */
  function monic(a: number[]): number[] {
    const lead = inv(a[deg(a)]);
    return a.map((c) => (c * lead) % P);
  }

  /** НОД «в столбик» (алгоритм Евклида): ~(deg)² операций. */
  function gcdSlow(a: number[], b: number[]): number[] {
    while (b.length) [a, b] = [b, divmod(a, b)[1]];
    return monic(a);
  }

  // --- Быстрый НОД (half-GCD) ----------------------------------------------
  // Шаг Евклида (a, b) → (b, a − q·b) — это умножение пары на матрицу [[0, 1], [1, −q]].
  // Первые шаги Евклида зависят только от старших коэффициентов a и b. Поэтому hgcd рекурсивно
  // решает задачу для старших половин и возвращает матрицу, которая делает сразу все эти шаги:
  // степень уменьшается вдвое за ~deg · log deg операций. Весь НОД — ~deg · log² deg вместо deg².

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

  /** То же, что hgcd, но шагами Евклида по одному — для коротких многочленов это быстрее рекурсии. */
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
   * Матрица M, после которой M · (a, b) = (c, d) и deg d < ⌈deg a / 2⌉ ≤ deg c. Нужно deg a > deg b.
   * progress — доля сделанного: каждый из двух рекурсивных вызовов — примерно 45% времени.
   */
  function hgcd(a: number[], b: number[], progress?: (done: number) => void): Matrix {
    if (a.length < 64) return hgcdSlow(a, b);
    const m = Math.ceil(deg(a) / 2);
    if (deg(b) < m) return I;
    const part = (from: number) => progress && ((done: number) => progress(from + 0.45 * done));
    const R = hgcd(a.slice(m), b.slice(m), part(0)); // старшие половины
    const [c, d] = apply(R, a, b);
    if (deg(d) < m) return R;
    const [q, e] = divmod(c, d); //                      один шаг Евклида вручную
    const k = 2 * m - deg(d);
    const S = hgcd(d.slice(k), e.slice(k), part(0.5)); // и ещё раз — для старших частей нового остатка
    const M = times(S, times([[], [1], [1], sub([], q)], R));
    progress?.(1);
    return M;
  }

  /**
   * НОД многочленов со старшим коэффициентом 1. Короткие — Евклидом, длинные — через hgcd.
   * progress — какая доля степени уже «съедена»: каждый hgcd съедает примерно половину оставшейся.
   */
  function gcd(a: number[], b: number[], progress?: (done: number) => void): number[] {
    if (deg(a) < deg(b)) [a, b] = [b, a];
    const start = deg(a);
    const eaten = () => 1 - Math.max(deg(b), 0) / start;
    while (b.length) {
      [a, b] = [b, divmod(a, b)[1]]; // шаг Евклида: теперь deg a > deg b — это нужно hgcd
      if (b.length && a.length > 256) {
        const from = eaten();
        [a, b] = apply(hgcd(a, b, progress && ((done) => progress(from + ((1 - from) / 2) * done))), a, b);
      }
      progress?.(eaten());
    }
    return monic(a);
  }

  /** Делим g случайными «пополам», пока не останется (m − корень). */
  function split(g: number[]): number | null {
    if (g.length < 2) return null; // степень 0 — корней нет
    if (g.length === 2) return mod(-g[0] * inv(g[1])); // g = g₁·m + g₀  →  m = −g₀ / g₁
    for (;;) {
      const r = Math.floor(Math.random() * P);
      const d = gcd(g, sub(powPoly([r, 1], (P - 1) / 2, g), [1]));
      if (d.length > 1 && d.length < g.length) return split(d);
    }
  }

  /**
   * Какой-нибудь корень f по модулю P (или null, если корней нет).
   * progress (необязательно) получает долю сделанной работы от 0 до 1 — для показа процентов.
   */
  function findRoot(f: number[], progress?: (done: number) => void): number | null {
    f = trim(f.map(mod));
    const X = [0, 1]; // многочлен «m»
    // Для процентов: m^P — примерно десятая часть работы, НОД — остальное.
    // Сообщаем не чаще, чем раз в 0,1% — иначе сообщений будут десятки тысяч.
    let last = -1;
    const report = (done: number) => {
      if (done - last >= 0.001) progress?.((last = done));
    };
    // Шаг 1: НОД(f, m^P − m).
    const xp = powPoly(X, P, f, (done) => report(0.1 * done));
    const g = gcd(f, sub(xp, X), (done) => report(0.1 + 0.9 * done));
    return split(g); // шаг 2: делим, пока не останется (m − корень)
  }

  return { add, mul, mulSlow, fermat, gcd, gcdSlow, findRoot };
}
