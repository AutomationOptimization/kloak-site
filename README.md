# ⟡ The Entropy Gate ⟡

An arcane, interactive codex of **probability theory and statistics** — the mathematics
behind luck. A pure HTML/CSS/vanilla-JS static site: no dependencies, no CDN, no build
step, no secrets. Every simulation is computed locally in the browser.

## Chapters

1. **Foundations (ᚠ)** — sample spaces, the Kolmogorov axioms, combinatorics (BigInt-exact),
   conditional probability, independence, total probability.
2. **Distributions (ᚱ)** — random variables, expectation, variance, PMF/PDF/CDF, binomial,
   Poisson, geometric, normal, and moments (skew / excess kurtosis), with a sampler that
   converges to theory.
3. **Core Theorems (ᚦ)** — Law of Large Numbers (with shrinking ±3σ band), Central Limit
   Theorem laboratory, and a Bayes base-rate icon grid (1,000 people).
4. **The Gambler's Path (ᛋ)** — expected value & house-edge tables, gambler's ruin
   (exact closed-form vs. simulation), Martingale under finite bankroll, and the
   gambler's fallacy quiz.
5. **Advanced Methods (ᛝ)** — Monte Carlo π with ∝1/√N error reference, z-test
   hypothesis testing (mystery mode included), sequential Bayesian updating with
   Bayes factors, and a Shannon entropy laboratory.

## Run it

Open `index.html` directly in a browser, or serve the folder with any static file server:

```
npx serve .
# or
python3 -m http.server 8000
```

Everything is a static asset; file:// works too.

## Deploy

Drop the folder onto any static host (GitHub Pages, Netlify, S3, nginx). No runtime
configuration is required — there are **no environment variables and no secrets**.

## File map

```
index.html      all codex content and simulation markup
css/style.css   obsidian/gold/violet design system, fractions, theorem boxes, responsive rail
js/math.js      PMFs/CDFs, erf-based normal CDF, bisection quantile, moments, entropy, BigInt combinatorics
js/charts.js    dependency-free canvas primitives: DPR scaling, axes/ticks, bars, lines, scatter
js/sims.js      one initializer per interactive; batched RAF loops, decimated sample paths
js/app.js       hero "scatter, then settle" particles, scrollspy, localStorage progress meter
README.md       this file
```

## Notes on the math

- Normal CDF uses the Abramowitz–Stegun 7.1.26 `erf` rational approximation (|ε| ≲ 1.5e-7);
  the quantile Φ⁻¹ is found by 80-step bisection on Φ — deterministic and dependency-free.
- Combinatorics uses exact BigInt arithmetic (stepwise exact division), so 60-choose-30
  is computed literally, not approximated.
- Long-running simulators cap stored rendering data: LLN and Monte Carlo decimate their
  plotted points by doubling stride, and random-walk/Martingale panels retain only the
  latest N paths at reduced opacity.
- `prefers-reduced-motion` is honored: the hero settles instantly and all RAF loops
  require explicit user start.

The codex teaches the arithmetic of chance; the house-edge chapter exists so the reader
can see exactly why the edge belongs to the house.
