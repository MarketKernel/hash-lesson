// Step 128: one hundred twenty-eight steps x = x² + m — and a "real" modulus: a 16-byte prime.
// A special step: P here is its own (not 786 433 as in the other steps), so everything is computed in BigInt
// (numbers with the n suffix: 2n, 159n).
//
// ⚠ This is NOT a cryptographically secure hash — only a demonstration of the mechanism. Weaknesses:
//   1. Collisions. Two m with the same hash are found by the "birthday paradox" in ~√P = 2⁶⁴ hash
//      evaluations, with no algebra at all. That is within reach: the SHA-1 collision took about 2⁶³.
//      That's why real hashes have a 256-bit output, not 128.
//   2. A quantum computer (Grover's algorithm) finds a preimage in ~√P = 2⁶⁴.
//   3. No safety margin. 128 steps is exactly the point where the degree 2¹²⁸ catches up with P.
//      Real functions of this kind (MiMC, Poseidon) take extra rounds as a margin.
//   4. We haven't checked special attacks (interpolation, Gröbner bases, GCD attacks).
//      Security is acknowledged after years of public analysis — this function has had none.
//   5. This is not a message hash: the input is a single number below P (16 bytes). A real hash needs input
//      of any length and a construction (sponge, Merkle–Damgård) — with attacks of its own.

export const P = 2n ** 128n - 159n; // the largest 16-byte prime

export function hash(m: bigint): bigint {
  let x = (m * m + m) % P; // step 1
  x = (x * x + m) % P; // step 2
  x = (x * x + m) % P; // step 3
  x = (x * x + m) % P; // step 4
  x = (x * x + m) % P; // step 5
  x = (x * x + m) % P; // step 6
  x = (x * x + m) % P; // step 7
  x = (x * x + m) % P; // step 8
  x = (x * x + m) % P; // step 9
  x = (x * x + m) % P; // step 10
  x = (x * x + m) % P; // step 11
  x = (x * x + m) % P; // step 12
  x = (x * x + m) % P; // step 13
  x = (x * x + m) % P; // step 14
  x = (x * x + m) % P; // step 15
  x = (x * x + m) % P; // step 16
  x = (x * x + m) % P; // step 17
  x = (x * x + m) % P; // step 18
  x = (x * x + m) % P; // step 19
  x = (x * x + m) % P; // step 20
  x = (x * x + m) % P; // step 21
  x = (x * x + m) % P; // step 22
  x = (x * x + m) % P; // step 23
  x = (x * x + m) % P; // step 24
  x = (x * x + m) % P; // step 25
  x = (x * x + m) % P; // step 26
  x = (x * x + m) % P; // step 27
  x = (x * x + m) % P; // step 28
  x = (x * x + m) % P; // step 29
  x = (x * x + m) % P; // step 30
  x = (x * x + m) % P; // step 31
  x = (x * x + m) % P; // step 32
  x = (x * x + m) % P; // step 33
  x = (x * x + m) % P; // step 34
  x = (x * x + m) % P; // step 35
  x = (x * x + m) % P; // step 36
  x = (x * x + m) % P; // step 37
  x = (x * x + m) % P; // step 38
  x = (x * x + m) % P; // step 39
  x = (x * x + m) % P; // step 40
  x = (x * x + m) % P; // step 41
  x = (x * x + m) % P; // step 42
  x = (x * x + m) % P; // step 43
  x = (x * x + m) % P; // step 44
  x = (x * x + m) % P; // step 45
  x = (x * x + m) % P; // step 46
  x = (x * x + m) % P; // step 47
  x = (x * x + m) % P; // step 48
  x = (x * x + m) % P; // step 49
  x = (x * x + m) % P; // step 50
  x = (x * x + m) % P; // step 51
  x = (x * x + m) % P; // step 52
  x = (x * x + m) % P; // step 53
  x = (x * x + m) % P; // step 54
  x = (x * x + m) % P; // step 55
  x = (x * x + m) % P; // step 56
  x = (x * x + m) % P; // step 57
  x = (x * x + m) % P; // step 58
  x = (x * x + m) % P; // step 59
  x = (x * x + m) % P; // step 60
  x = (x * x + m) % P; // step 61
  x = (x * x + m) % P; // step 62
  x = (x * x + m) % P; // step 63
  x = (x * x + m) % P; // step 64
  x = (x * x + m) % P; // step 65
  x = (x * x + m) % P; // step 66
  x = (x * x + m) % P; // step 67
  x = (x * x + m) % P; // step 68
  x = (x * x + m) % P; // step 69
  x = (x * x + m) % P; // step 70
  x = (x * x + m) % P; // step 71
  x = (x * x + m) % P; // step 72
  x = (x * x + m) % P; // step 73
  x = (x * x + m) % P; // step 74
  x = (x * x + m) % P; // step 75
  x = (x * x + m) % P; // step 76
  x = (x * x + m) % P; // step 77
  x = (x * x + m) % P; // step 78
  x = (x * x + m) % P; // step 79
  x = (x * x + m) % P; // step 80
  x = (x * x + m) % P; // step 81
  x = (x * x + m) % P; // step 82
  x = (x * x + m) % P; // step 83
  x = (x * x + m) % P; // step 84
  x = (x * x + m) % P; // step 85
  x = (x * x + m) % P; // step 86
  x = (x * x + m) % P; // step 87
  x = (x * x + m) % P; // step 88
  x = (x * x + m) % P; // step 89
  x = (x * x + m) % P; // step 90
  x = (x * x + m) % P; // step 91
  x = (x * x + m) % P; // step 92
  x = (x * x + m) % P; // step 93
  x = (x * x + m) % P; // step 94
  x = (x * x + m) % P; // step 95
  x = (x * x + m) % P; // step 96
  x = (x * x + m) % P; // step 97
  x = (x * x + m) % P; // step 98
  x = (x * x + m) % P; // step 99
  x = (x * x + m) % P; // step 100
  x = (x * x + m) % P; // step 101
  x = (x * x + m) % P; // step 102
  x = (x * x + m) % P; // step 103
  x = (x * x + m) % P; // step 104
  x = (x * x + m) % P; // step 105
  x = (x * x + m) % P; // step 106
  x = (x * x + m) % P; // step 107
  x = (x * x + m) % P; // step 108
  x = (x * x + m) % P; // step 109
  x = (x * x + m) % P; // step 110
  x = (x * x + m) % P; // step 111
  x = (x * x + m) % P; // step 112
  x = (x * x + m) % P; // step 113
  x = (x * x + m) % P; // step 114
  x = (x * x + m) % P; // step 115
  x = (x * x + m) % P; // step 116
  x = (x * x + m) % P; // step 117
  x = (x * x + m) % P; // step 118
  x = (x * x + m) % P; // step 119
  x = (x * x + m) % P; // step 120
  x = (x * x + m) % P; // step 121
  x = (x * x + m) % P; // step 122
  x = (x * x + m) % P; // step 123
  x = (x * x + m) % P; // step 124
  x = (x * x + m) % P; // step 125
  x = (x * x + m) % P; // step 126
  x = (x * x + m) % P; // step 127
  x = (x * x + m) % P; // step 128
  //
  // The same as one formula — substitute each step into the next and expand:
  //
  //   x = (m ** 340282366920938463463374607431768211456n                      ← degree 2¹²⁸
  //      + 170141183460469231731687303715884105728n * m ** 340282366920938463463374607431768211455n
  //      + …                     ← ~3.4 · 10³⁸ more terms here
  //      + 5n * m ** 4n
  //      + 2n * m ** 3n
  //      + m ** 2n
  //      + m) % P;
  return x;
}

// The inverse can't be computed in practice, so invert says so right away.
//
// Substituting the steps into each other gives an equation in m of degree 2¹²⁸ ≈ 3.4 · 10³⁸.
// Fermat reduction (m^P = m) brings the degree below P — but here P is also ≈ 3.4 · 10³⁸:
// the polynomial has ~P terms, and there is nowhere to even write it down.
// The algorithm from steps 2–25 (findRoot in algebra.ts) would cost ~P · log² P ≈ 2¹⁴² operations —
// by the estimate in README.md, ~10²⁸ years and ~10²⁹ TB of memory. No other known method is faster than ~P.
export function invert(_h: bigint): bigint | null {
  throw new Error("infeasible: an equation of degree 2¹²⁸ needs ~2¹⁴² operations — about 10²⁸ years");
}
