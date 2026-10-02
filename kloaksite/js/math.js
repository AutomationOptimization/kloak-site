/* The Entropy Gate — math utilities.
   All PMFs/CDFs computed with log-space accumulation to stay exact-ish for
   the parameter ranges the UI permits. BigInt is used everywhere the
   combinatorics panel reaches, so n ≤ 60 stays exact. */
'use strict';
window.MATH = (function () {
  const SQRT = Math.sqrt, EXP = Math.exp, LOG = Math.log, PI = Math.PI;

  function fmt(x, digits = 4) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!Number.isFinite(x)) return x > 0 ? '∞' : (x < 0 ? '−∞' : '—');
    const a = Math.abs(x);
    if (a >= 1e9 || (a !== 0 && a < 1e-4)) return x.toExponential(3);
    return x.toLocaleString('en-US', { maximumFractionDigits: digits });
  }

  function logFactorial(n) {
    let s = 0;
    for (let i = 2; i <= n; i++) s += LOG(i);
    return s;
  }

  /* Exact binomial coefficient via stepwise exact division — intermediate
     values remain integers, so BigInt never strains. */
  function combBig(n, r) {
    n = BigInt(n); r = BigInt(r);
    if (r < 0n || r > n) return 0n;
    r = n - r < r ? n - r : r;
    let out = 1n;
    for (let i = 1n; i <= r; i++) out = (out * (n - i + 1n)) / i;
    return out;
  }

  function permBig(n, r) {
    n = BigInt(n); r = BigInt(r);
    if (r < 0n || r > n) return 0n;
    let out = 1n;
    for (let i = 0n; i < r; i++) out *= n - i;
    return out;
  }

  function bigFmt(b) {
    return b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ---------------- Discrete distributions ----------------

  function binomialPMF(n, p, k) {
    if (k < 0 || k > n) return 0;
    if (p <= 0) return k === 0 ? 1 : 0;
    if (p >= 1) return k === n ? 1 : 0;
    return EXP(logFactorial(n) - logFactorial(k) - logFactorial(n - k)
      + k * LOG(p) + (n - k) * LOG(1 - p));
  }

  function binomialCDF(n, p, k) {
    let s = 0;
    const up = Math.min(k, n);
    for (let i = 0; i <= up; i++) s += binomialPMF(n, p, i);
    return Math.min(1, s);
  }

  function poissonPMF(lambda, k) {
    if (k < 0) return 0;
    if (lambda <= 0) return k === 0 ? 1 : 0;
    return EXP(-lambda + k * LOG(lambda) - logFactorial(k));
  }

  function poissonCDF(lambda, k) {
    let s = 0;
    for (let i = 0; i <= k; i++) s += poissonPMF(lambda, i);
    return Math.min(1, s);
  }

  /* Geometric on support {1, 2, ...}: waiting time to first success. */
  function geometricPMF(p, k) {
    if (k < 1 || p <= 0) return 0;
    if (p >= 1) return k === 1 ? 1 : 0;
    return Math.pow(1 - p, k - 1) * p;
  }

  function geometricCDF(p, k) {
    if (k < 1) return 0;
    if (p >= 1) return 1;
    return 1 - Math.pow(1 - p, k);
  }

  // ---------------- Normal distribution ----------------

  /* Abramowitz–Stegun 7.1.26 erf approximation, |error| ≤ 1.5e-7. */
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
      - 0.284496736) * t + 0.254829592) * t) * EXP(-x * x);
    return sign * y;
  }

  function normalPDF(x, mu = 0, sigma = 1) {
    return EXP(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * SQRT(2 * PI));
  }

  function normalCDF(x, mu = 0, sigma = 1) {
    return 0.5 * (1 + erf((x - mu) / (sigma * SQRT(2))));
  }

  /* Inverse normal CDF by bisection on Φ — dependency-free and accurate to
     ~1e-14 after 80 halvings of a 24-unit bracket. */
  function normInv(q) {
    if (q <= 0) return -Infinity;
    if (q >= 1) return Infinity;
    let lo = -12, hi = 12;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (normalCDF(mid) < q) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ---------------- Moments & entropy ----------------

  /* Compute mean, variance, sd, skewness, kurtosis from a discrete
     (value, probability) listing. */
  function moments(xs, ps) {
    let m = 0;
    for (let i = 0; i < xs.length; i++) m += xs[i] * ps[i];
    let v = 0, s3 = 0, s4 = 0;
    for (let i = 0; i < xs.length; i++) {
      const d = xs[i] - m;
      const p = ps[i];
      v += d * d * p;
      s3 += d * d * d * p;
      s4 += d * d * d * d * p;
    }
    const sd = SQRT(v);
    const skew = sd > 0 ? s3 / (sd * sd * sd) : 0;
    const kurt = sd > 0 ? s4 / (sd * sd * sd * sd) : NaN;
    return { mean: m, variance: v, sd, skew, kurtosis: kurt, excessKurtosis: kurt - 3 };
  }

  function entropy(probs) {
    let h = 0;
    for (const p of probs) {
      if (p > 0) h -= p * Math.log2(p);
    }
    return h;
  }

  return {
    fmt,
    logFactorial,
    combBig, permBig, bigFmt,
    binomialPMF, binomialCDF,
    poissonPMF, poissonCDF,
    geometricPMF, geometricCDF,
    erf, normalPDF, normalCDF, normInv,
    moments, entropy
  };
})();
