**English** · [Русский](README.ru.md)

# How reversible operations add up to an irreversible problem

The hash is the step `x = x² + m`, repeated several times (everything modulo the prime `P = 786,433`, just below 2²⁰).
The task: given a hash, find some `m`. Steps live in separate files `src/stepN.ts` (N = number of repetitions).
The shared inversion algorithm (finding a root of a polynomial) is in `src/algebra.ts`.

| Step | Equation in m | How we solve it | Time |
| --- | --- | --- | --- |
| 1 | degree 2 | school formula | instant |
| 2 | degree 4 | the `findRoot` algorithm | instant |
| 17 | degree 131,072 | the same algorithm | ~16 s |
| 25 | degree 2²⁵ ≈ 33 million → reduced by Fermat to < P | the same algorithm | ~2 min |
| 128 | degree 2¹²⁸, **P is 16 bytes** (see below) | infeasible | ~10²⁸ years (estimate) |

## How we compute: algorithms step by step

**Hash step 1** — the quadratic equation `m² + m − h = 0`: the school formula `m = (−1 + √D) / 2`.
Square root modulo `P` — **Cipolla's algorithm** (`src/step1.ts`).

**Hash steps 2, 17, 25** — `invert(h)` looks for a root of the polynomial `f(m) − h` modulo `P` (`src/algebra.ts`):

1. **Build the polynomial.** The same steps as in `hash`, only over a polynomial: `f = f² + m`.
   - polynomial multiplication — **Kronecker substitution**: polynomial → huge number (64 bits per
     coefficient) → **BigInt** multiplication (it uses fast multiplication internally) → back to coefficients;
   - once the degree reaches `P` — **reduction by Fermat's little theorem**: `m^P = m`, so `m^k` with `k ≥ P`
     is replaced by `m^(k−P+1)`. The polynomial's values don't change — and neither do its roots.
2. **Raise `m` to the power `P` modulo `f`** — **binary exponentiation** (by squaring, ~log₂ P ≈ 20 times).
   Remainder modulo `f` — **division via a Newton inverse series** (Barrett's trick for polynomials):
   the inverse of the "reversed" `f` is computed once, after that each division is two multiplications.
3. **`GCD(f, m^P − m)`** — the roots of `m^P − m` are all the numbers `0 … P−1`, so the GCD keeps exactly those roots of `f`
   that actually exist. **Euclid's algorithm**, sped up by **half-GCD** (Knuth–Schönhage):
   the first Euclid steps depend only on the leading coefficients, so they are done by recursion
   on the upper halves — many steps in one matrix.
4. **Split the roots** — **Cantor–Zassenhaus splitting**: `GCD(g, (m + r)^((P−1)/2) − 1)` with a random `r`
   takes about half of the roots (half of the numbers have `a^((P−1)/2) = 1` — **Euler's criterion**).
   Repeat until a single root is left.

Steps 2–4 together are the **Cantor–Zassenhaus algorithm** for finding roots of a polynomial over a finite field.
Each part costs ~`degree · log(degree)` or ~`degree · log²(degree)` operations (without the fast algorithms it would be
~`degree²`).

## Why it grows like this

Each step doubles the degree of the equation. The algorithm costs ~`degree · log²(degree)`:
polynomial multiplication — by Kronecker substitution via BigInt, division — via the Newton inverse,
GCD — via half-GCD. So the time roughly doubles per step.

Measured (Node):

| Step | Degree | Time |
| --- | --- | --- |
| 17 | 131,072 | 16 s |
| 20 | 786,432 (2²⁰, reduced by Fermat) | 113 s |
| 25 | 786,432 (2²⁵, reduced by Fermat) | 121 s |

From step 20 on, the degree `2ʳ` is larger than `P`. By Fermat's theorem `m^P = m`, so the polynomial is reduced to
a degree below `P` — and from there the time barely grows: it hits the ceiling of `P`. It can't be reduced further — the
polynomial has ~`P` terms. So the cost is ~`P · log² P`, no matter how many steps.

With `P ≈ 2²⁰` that's minutes. With `P ≈ 2²⁵⁶` it's ~2²⁵⁶ operations: that can never be done.

## Where the time and memory go (step 25, measured)

| Part | Algorithm | Time | Share | Peak process memory |
| --- | --- | --- | --- | --- |
| 1. build the polynomial (24 times `f = f² + m`) | Kronecker + Fermat reduction | 7.6 s | 6% | ~850 MB |
| 2. `m^P mod f` | binary exponentiation + Newton division | 6.3 s | 5% | ~830 MB |
| 3. `GCD(f, m^P − m)` | half-GCD | 106 s | **88%** | ~910 MB |
| 4. split the roots | Cantor–Zassenhaus | < 0.1 s | 0% | — |
| **total** | | **120 s** | | **~1 GB** |

Why the GCD is the most expensive part: exponentiation is ~70 polynomial multiplications (20 squarings,
each with its own Newton division — two more multiplications), while half-GCD, on each of its ~20 recursion levels,
multiplies 2×2 matrices of polynomials — 8 multiplications per matrix product.

Inside every part, nearly all the time is polynomial multiplication (~90% by the profile).
One multiplication of polynomials of length ~786 thousand takes about 1 s:

| Inside a multiplication | Share |
| --- | --- |
| multiplying huge BigInt numbers (~50 million bits) | ~50% |
| packing coefficients into a number (hex string → BigInt) | ~25% |
| unpacking the result back into coefficients | ~25% |

**Memory.** The polynomial itself is 786 thousand numbers, ~6 MB. But on every multiplication it turns into a string
of 12.6 million hex digits and a 50-million-bit BigInt; most of the peak is such temporary strings and numbers
that the garbage collector hasn't cleaned up yet. That's why the peak is nearly the same in all heavy parts
(and at steps 25 and 50). It grows in proportion to `P`. Before the computation starts, the process takes ~50 MB.

## The limit

**The number of steps by itself sets no limit.** From step 20 on, the degree is reduced by Fermat to below `P`,
and each further step adds just one squaring — about 1 s:

| Steps (our P) | Time |
| --- | --- |
| 25 | 2 min (measured) |
| 50 | 2.4 min (measured) |
| 1000 | ~19 min (estimate) |

**The limit is set by the size of P.** The cost is ~`P · log² P`, memory ~`P`, and for the degree to catch up with `P`
you need at least `log₂ P` steps. The estimate is the measurement at `P ≈ 2²⁰` scaled up, same computer, Node:

| P | Steps for the degree to reach P | Time | Memory |
| --- | --- | --- | --- |
| 2²⁰ (ours) | 20 | 2–3 min | ~1 GB |
| 2²⁴ | 24 | ~1 h | ~20 GB |
| 2²⁵ | 25 | ~2.3 h | ~40 GB |
| 2³⁰ | 30 | ~4 days | ~1 TB |
| 2⁴⁰ | 40 | ~20 years | ~1 PB |
| 2⁶⁴ | 64 | ~10⁸ years | ~10¹⁰ TB |
| 2¹²⁸ | 128 | ~10²⁸ years | ~10²⁹ TB |
| 2²⁵⁶ | 256 | ~10⁶⁷ years | ~10⁶⁸ TB |

Waiting becomes pointless at roughly `P ≈ 2⁴⁰` and 40 steps: decades and petabytes of memory.
At `P ≈ 2²⁵⁶` the time exceeds the age of the Universe (~10¹⁰ years) by a factor of 10⁵⁷.

Everything above `2²⁰` is only an estimate: our code is built for `P` up to ~2²¹ (64 bits per coefficient
in Kronecker multiplication, the precision of plain JS numbers). A larger `P` needs BigInt coefficients.

## Can it be faster?

**The same algorithm, better written — yes, several times over. But the law doesn't change.**

- We use JS: half of the multiplication time goes into packing to strings and back. C libraries
  (FLINT, NTL) multiply polynomials via NTT over several prime moduli, their half-GCD is polished,
  plus multithreading — expected to be tens of times faster (an estimate, not a measurement).
- That changes only the constant. The cost stays ~`P · log² P`: for `P ≈ 2²⁵⁶` it is still impossible.

**Asymptotically better root-finding algorithms exist, but they win only in the logarithms.**
In theory ~`degree^(1+ε) · log P` (Kedlaya–Umans modular composition); in practice such algorithms
are slower than ours. A polynomial with ~`P` terms still has to be at least read — that's ~`P`.

**Can it be much faster — not ~`P` but, say, ~`√P` or ~`log P`? Unknown.**

- If you treat the hash as a "black box" (we can only evaluate it), it's proven that ~`P` evaluations are needed.
  A quantum computer (Grover's algorithm) needs ~`√P`; for `P ≈ 2²⁵⁶` that's 2¹²⁸ — still impossible.
- Our hash isn't a black box — its formula is known. But no way is known to exploit the structure "`x² + m`, repeated
  `r` times" better than through a polynomial with ~`P` terms.
- Instead of substituting the steps into each other, one can solve a system of equations with intermediate unknowns
  `x₁ … xᵣ` (Gröbner bases) — but its complexity is of the same order: it also grows as `2ʳ`.
- Nobody knows how to prove that no fast way exists. It's exactly the same for SHA-256: its security is
  not a proven theorem, but the fact that over decades nobody has found a faster way.

## Step 128: a "real" size — and why it's still not a secure hash

A special step: `P = 2¹²⁸ − 159` — the largest 16-byte prime, 128 steps, everything in BigInt.
Here the inverse immediately reports "infeasible": an equation of degree 2¹²⁸, after Fermat reduction —
~`P` ≈ 3.4·10³⁸ terms, work ~`P · log² P` ≈ 2¹⁴² — ~10²⁸ years.

Finding a preimage really is ~2¹²⁸. But that doesn't make it a cryptographically secure hash:

| Property | Here | Required |
| --- | --- | --- |
| find a preimage | ~2¹²⁸ | ≥ 2¹²⁸ |
| find a collision (two m with the same hash) | ~2⁶⁴ — the "birthday paradox", no algebra | ≥ 2¹²⁸ → 256-bit output |
| quantum computer (Grover) | ~2⁶⁴ | ≥ 2¹²⁸ |
| round margin | none: 128 is exactly the point where the degree catches up with P | extra rounds as a margin |
| special attacks (interpolation, Gröbner, GCD) | not checked | years of public analysis |
| input of any length | no — a single number < P | a construction (sponge, Merkle–Damgård) |

**Why P is prime.** The hash could be computed modulo any `N`, but:

- `N = 2¹²⁸` is a disaster: the low bits of the result depend only on the low bits of `m`, and `m`
  is recovered bit by bit (Hensel's lemma: the derivative of our polynomial is always odd).
  Checked at `2¹⁶`: 16 checks instead of 65,536. With an even number of steps, like 128, the hash modulo 2ᵏ
  is even a bijection;
- `N = p · q` with known factors — the problem splits into two, modulo `p` and modulo `q`; the security is that of the smaller one;
- `N = p · q` with secret factors — that's a different hardness altogether (factoring, as in Rabin),
  and someone has to generate `N` and "forget" `p`, `q`.

With a prime `P` everything fits: Fermat's theorem, Euler's criterion and division modulo `P` all work — and both
the inversion algorithm and our analysis of its cost rest on them.

## The page

```bash
node server.ts
```

Open <http://localhost:8000>: pick a step and `m` → `hash(m)` → `invert(h)` with progress
and "elapsed / remaining" time → `hash` of the found value again.

## Build

```bash
./build.sh
```

Bundles everything into a single file `dist/index.html` — it opens on double-click, no server needed.
All the code is inlined into the page, types are stripped from the .ts files, there are no dependencies.

On push to `main`, GitHub Actions (`.github/workflows/pages.yml`) does the same:
runs the tests, builds, and publishes `dist/index.html` to GitHub Pages.

## Tests

```bash
node --test            # ~20 s, without step 25
SLOW=1 node --test     # including step 25 — another ~2 min
```
