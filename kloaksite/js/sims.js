```js
/* The Entropy Gate — all simulators. One initializer per interactive,
   dispatched on DOMContentLoaded. Long runs stay performant by batching
   frames, decimating stored points, and keeping running aggregates. */
'use strict';
window.SIMS = (function () {
  const M = window.MATH, C = window.CHARTS;
  const COLORS = C.COLORS;
  const $ = function (id) { return document.getElementById(id); };
  const MARGIN = { left: 46, right: 14, top: 14, bottom: 30 };

  function bindRange(input, out, onChange, fmtFn) {
    function render() {
      const v = parseFloat(input.value);
      if (out) out.textContent = fmtFn ? fmtFn(v) : M.fmt(v);
      onChange(v);
    }
    input.addEventListener('input', render);
    render();
  }

  function pct(v, digits) {
    return (v * 100).toLocaleString('en-US', { maximumFractionDigits: digits == null ? 1 : digits }) + '%';
  }

  /* =========================================================
     CH 1.1 — Sample-space explorer
     ========================================================= */
  function initSampleSpace() {
    const kind = $('ss-kind'), nRange = $('ss-n'), nVal = $('ss-n-val'),
      eventSel = $('ss-event'), cards = $('ss-cards'),
      favOut = $('ss-fav'), totalOut = $('ss-total'), probOut = $('ss-prob'),
      coinsCtl = $('ss-coins-ctl');
    if (!kind || !eventSel || !cards) return;

    const EVENTS = {
      coins: [
        { id: 'allHeads', label: 'all heads', test: (s) => s.split('').every((c) => c === 'H') },
        { id: 'anyHead', label: 'at least one head', test: (s) => s.includes('H') },
        { id: 'oneHead', label: 'exactly one head', test: (s) => s.split('').filter((c) => c === 'H').length === 1 },
        { id: 'allSame', label: 'all outcomes equal', test: (s) => s.split('').every((c) => c === s[0]) },
        { id: 'firstTail', label: 'first flip is tails', test: (s) => s[0] === 'T' },
        { id: 'halfHeads', label: 'at least half heads', test: (s) => s.split('').filter((c) => c === 'H').length >= Math.ceil(s.length / 2) }
      ],
      dice: [
        { id: 'sum7', label: 'sum = 7', test: (p) => p[0] + p[1] === 7 },
        { id: 'sumLe4', label: 'sum ≤ 4', test: (p) => p[0] + p[1] <= 4 },
        { id: 'doubles', label: 'doubles', test: (p) => p[0] === p[1] },
        { id: 'sumGe10', label: 'sum ≥ 10', test: (p) => p[0] + p[1] >= 10 },
        { id: 'firstEven', label: 'first die even', test: (p) => p[0] % 2 === 0 },
        { id: 'prodGe20', label: 'product ≥ 20', test: (p) => p[0] * p[1] >= 20 }
      ]
    };

    function outcomes() {
      if (kind.value === 'coins') {
        const n = parseInt(nRange.value, 10);
        const out = [];
        for (let i = 0; i < Math.pow(2, n); i++) {
          out.push(i.toString(2).padStart(n, '0').replace(/0/g, 'T').replace(/1/g, 'H'));
        }
        return out;
      }
      const out = [];
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) out.push([a, b]);
      return out;
    }

    function rebuildEvents() {
      const list = EVENTS[kind.value];
      coinsCtl.style.display = kind.value === 'coins' ? '' : 'none';
      eventSel.innerHTML = '';
      for (const e of list) {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.label;
        eventSel.appendChild(opt);
      }
      render();
    }

    function render() {
      const all = outcomes();
      const ev = EVENTS[kind.value].find((e) => e.id === eventSel.value) || EVENTS[kind.value][0];
      let fav = 0;
      cards.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (const o of all) {
        const hit = ev.test(o);
        if (hit) fav++;
        const d = document.createElement('div');
        d.className = 'card' + (hit ? ' hit' : '');
        d.textContent = kind.value === 'coins' ? o : o[0] + ',' + o[1];
        frag.appendChild(d);
      }
      cards.appendChild(frag);
      totalOut.textContent = String(all.length);
      favOut.textContent = String(fav);
      const p = all.length ? fav / all.length : 0;
      probOut.textContent = M.fmt(p) + '  ≈ ' + fav + ' ⁄ ' + all.length;
      if (kind.value === 'coins') nVal.textContent = nRange.value;
    }

    kind.addEventListener('change', rebuildEvents);
    nRange.addEventListener('input', render);
    eventSel.addEventListener('change', render);
    rebuildEvents();
  }

  /* =========================================================
     CH 1.2 — Combinatorics calculator (BigInt-exact)
     ========================================================= */
  function initCombinatorics() {
    const nR = $('cb-n'), rR = $('cb-r'), nV = $('cb-n-val'), rV = $('cb-r-val');
    if (!nR || !rR) return;
    const outs = { perm: $('cb-perm'), comb: $('cb-comb'), permrep: $('cb-permrep'), combrep: $('cb-combrep') };

    function render() {
      let n = parseInt(nR.value, 10);
      let r = parseInt(rR.value, 10);
      rR.max = n;
      if (r > n) { r = n; rR.value = String(r); }
      nV.textContent = n; rV.textContent = r;
      let perm, comb, permrep, combrep;
      try {
        perm = M.permBig(n, r);
        comb = M.combBig(n, r);
        permrep = BigInt(n) ** BigInt(r);
        combrep = M.combBig(n + r - 1, r);
        outs.perm.textContent = M.bigFmt(perm);
        outs.comb.textContent = M.bigFmt(comb);
        outs.permrep.textContent = r === 0 ? '1' : M.bigFmt(permrep);
        outs.combrep.textContent = M.bigFmt(combrep);
      } catch (e) {
        for (const k in outs) outs[k].textContent = 'overflow';
      }
    }
    nR.addEventListener('input', render);
    rR.addEventListener('input', render);
    render();
  }

  /* =========================================================
     CH 1.3 — Conditional probability table
     ========================================================= */
  function initConditional() {
    const ids = ['cp-ab', 'cp-aNb', 'cp-Nab', 'cp-NaNb'];
    const ins = ids.map($);
    const pAb = $('cp-pAb'), pBa = $('cp-pBa'), joint = $('cp-joint'),
      product = $('cp-product'), check = $('cp-check');
    if (!ins[0] || !pAb) return;

    function read(el) { const v = parseFloat(el.value); return Number.isFinite(v) && v >= 0 ? v : 0; }

    function render() {
      const a = read(ins[0]), c = read(ins[1]), b = read(ins[2]), d = read(ins[3]);
      const T = a + b + c + d;
      if (T <= 0) {
        pAb.textContent = pBa.textContent = joint.textContent = product.textContent = '—';
        check.textContent = 'Total count is zero — enter the table.';
        check.className = 'verdict';
        return;
      }
      const PA = (a + c) / T, PB = (a + b) / T, PAB = a / T;
      pAb.textContent = (a + b) > 0 ? M.fmt(a / (a + b)) : 'undefined';
      pBa.textContent = (a + c) > 0 ? M.fmt(a / (a + c)) : 'undefined';
      joint.textContent = M.fmt(PAB);
      product.textContent = M.fmt(PA * PB);
      const independent = Math.abs(PAB - PA * PB) < 1e-9;
      if (independent) {
        check.textContent = 'Independent: P(A∩B) = P(A)P(B) exactly.';
        check.className = 'verdict ok';
      } else {
        const dir = PAB > PA * PB ? 'positively' : 'negatively';
        check.textContent = 'Dependent — events ' + dir + ' associated (difference ' + M.fmt(PAB - PA * PB, 6) + ').';
        check.className = 'verdict bad';
      }
    }
    ins.forEach((el) => el.addEventListener('input', render));
    render();
  }

  /* =========================================================
     CH 2 — Distribution playground
     ========================================================= */
  function initDistribution() {
    const kind = $('dp-kind'), aR = $('dp-a'), bR = $('dp-b'),
      aLab = $('dp-a-label'), bLab = $('dp-b-label'),
      aVal = $('dp-a-val'), bVal = $('dp-b-val'), bWrap = $('dp-b-wrap'),
      chart = $('dp-chart'), hist = $('dp-hist'),
      drawBtn = $('dp-draw'), clearBtn = $('dp-clear'), sampleN = $('dp-sample-n');
    if (!kind || !chart) return;
    const fc = C.frame(chart), fh = C.frame(hist);

    const DEFS = {
      binomial: {
        params: [
          { lab: 'n', min: 2, max: 100, step: 1, val: 20 },
          { lab: 'p', min: 0.01, max: 0.99, step: 0.01, val: 0.5 }
        ],
        support: (a) => { const xs = []; for (let k = 0; k <= a; k++) xs.push(k); return xs; },
        pmf: (a, b, k) => M.binomialPMF(a, b, k),
        discrete: true,
        sample: (a, b) => { let s = 0; for (let i = 0; i < a; i++) if (Math.random() < b) s++; return s; }
      },
      poisson: {
        params: [{ lab: 'λ', min: 0.1, max: 20, step: 0.1, val: 4 }],
        support: (a) => {
          const cap = Math.ceil(a + 8 * Math.sqrt(a + 1));
          const xs = []; for (let k = 0; k <= Math.min(cap, 220); k++) xs.push(k);
          return xs;
        },
        pmf: (a, b, k) => M.poissonPMF(a, k),
        discrete: true,
        sample: (a) => { // Knuth
          const L = Math.exp(-a); let k = 0, p = 1;
          do { k++; p *= Math.random(); } while (p > L && k < 500);
          return k - 1;
        }
      },
      geometric: {
        params: [{ lab: 'p', min: 0.01, max: 1, step: 0.01, val: 0.2 }],
        support: (a) => {
          let cap = 1;
          if (a >= 1) cap = 1; else cap = Math.min(400, Math.ceil(Math.log(1e-6) / Math.log(1 - a)) + 1);
          const xs = []; for (let k = 1; k <= cap; k++) xs.push(k);
          return xs;
        },
        pmf: (a, b, k) => M.geometricPMF(a, k),
        discrete: true,
        sample: (a) => Math.ceil(Math.log(1 - Math.random()) / Math.log(1 - a))
      },
      normal: {
        params: [
          { lab: 'μ', min: -5, max: 5, step: 0.1, val: 0 },
          { lab: 'σ', min: 0.1, max: 5, step: 0.05, val: 1 }
        ],
        discrete: false,
        sample: (a, b) => { // Box–Muller; no cached spare to keep calls independent
          let u = 0; while (u <= 0) u = Math.random();
          return a + b * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
        }
      }
    };

    let samples = {}; // key -> count; keys are support values (discrete) or bin centers (normal)
    let total = 0;
    let cur = null; // {xs, ys, cdf, edges, delta}

    function paramsOf(def) { return [parseFloat(aR.value), def.params[1] ? parseFloat(bR.value) : undefined]; }

    function compute() {
      const def = DEFS[kind.value];
      const [a, b] = paramsOf(def);
      const two = def.params.length === 2;

      let xs, ys, cdf, edges = null, delta = null, ytmax;
      if (def.discrete) {
        xs = def.support(a, b);
        ys = xs.map((k) => def.pmf(a, b, k));
        let acc = 0;
        cdf = ys.map((p) => (acc += p));
        ytmax = Math.max.apply(null, ys);
      } else {
        const [mu, sigma] = [a, b];
        const N = 121;
        delta = (9 * sigma) / N;
        const lo = mu - 4.5 * sigma;
        xs = []; ys = [];
        for (let i = 0; i < N; i++) {
          const mid = lo + (i + 0.5) * delta;
          xs.push(mid);
          ys.push(M.normalPDF(mid, mu, sigma));
        }
        cdf = []; let acc = 0;
        for (let i = 0; i < N; i++) { acc += ys[i] * delta; cdf.push(Math.min(1, acc)); }
        ytmax = M.normalPDF(mu, mu, sigma);
        edges = [lo]; for (let i = 1; i <= N; i++) edges.push(lo + i * delta);
      }

      let stats;
      if (kind.value === 'normal') {
        stats = { mean: a, variance: b * b, sd: b, skew: 0, kurtosis: 3, excessKurtosis: 0 };
      } else {
        stats = M.moments(xs, ys);
      }

      cur = { xs, ys, cdf, edges, delta, ytmax, stats, def };
      $('dp-mean').textContent = M.fmt(stats.mean, 5);
      $('dp-var').textContent = M.fmt(stats.variance, 5);
      $('dp-sd').textContent = M.fmt(stats.sd, 5);
      $('dp-skew').textContent = M.fmt(stats.skew, 4);
      $('dp-kurt').textContent = M.fmt(stats.excessKurtosis, 4);
      renderTheory();
      renderHist();
    }

    function renderTheory() {
      const d = cur;
      fc.render(function (ctx, W, H) {
        const ymaxY = d.ytmax > 0 ? d.ytmax * 1.15 : 0.1;
        const S = C.scale(W, H, { left: 42, right: 40, top: 22, bottom: 28 },
          d.xs[0] - (d.delta ? d.delta : 1) / 2, d.xs[d.xs.length - 1] + (d.delta ? d.delta : 1) / 2,
          0, ymaxY);
        const S2 = C.scale(W, H, { left: 42, right: 40, top: 22, bottom: 28 }, S.xmin, S.xmax, 0, 1);
        C.axes(ctx, S, {});
        // CDF on right axis
        C.line(ctx, S2, d.xs, d.cdf, { color: COLORS.goldBright, width: 2 });
        // right-side axis labels
        ctx.save();
        ctx.font = '11px Georgia, serif';
        ctx.fillStyle = COLORS.gold;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        [0, 0.5, 1].forEach(function (v) { ctx.fillText(String(v), S2.x1 + 5, S2.Y(v)); });
        ctx.restore();
        C.bars(ctx, S, d.xs, d.ys, { color: COLORS.violet, alpha: 0.65 });
        C.legend(ctx, [
          { color: COLORS.violet, label: d.def.discrete ? 'PMF' : 'PDF' },
          { color: COLORS.goldBright, label: 'CDF (right axis)' }
        ], S.x0 + 8, S.y0 + 8);
      });
    }

    function renderHist() {
      const d = cur;
      fh.render(function (ctx, W, H) {
        let xs, ys;
        if (d.edges) {
          xs = d.xs;
          ys = d.xs.map(function (v) { return samples[v] || 0; });
        } else {
          xs = d.xs;
          ys = d.xs.map(function (v) { return samples[v] || 0; });
        }
        const theoryScaled = d.edges
          ? d.ys.map(function (y) { return y * total * d.delta; })
          : d.ys.map(function (y) { return y * total; });
        const ymax = Math.max(
          theoryScaled.length ? Math.max.apply(null, theoryScaled) : 0,
          ys.length ? Math.max.apply(null, ys) : 0
        ) * 1.2 || 1;
        const S = C.scale(W, H, MARGIN,
          d.xs[0] - (d.delta || 1) / 2, d.xs[d.xs.length - 1] + (d.delta || 1) / 2, 0, ymax);
        C.axes(ctx, S, {});
        C.bars(ctx, S, xs, ys, { color: COLORS.gold, alpha: 0.6 });
        C.line(ctx, S, d.xs, theoryScaled, { color: COLORS.violet, width: 2 });
        C.legend(ctx, [
          { color: COLORS.gold, label: 'samples (' + total + ')' },
          { color: COLORS.violet, label: 'theory' }
        ], S.x0 + 8, S.y0 + 8);
      });
    }

    function keyFor(def, v) {
      if (def.discrete) return v;
      const lo = cur.edges[0], d = cur.delta;
      let idx = Math.floor((v - lo) / d);
      idx = Math.max(0, Math.min(cur.xs.length - 1, idx));
      return cur.xs[idx];
    }

    function configureSliders() {
      const def = DEFS[kind.value];
      aLab.textContent = def.params[0].lab;
      aR.min = def.params[0].min; aR.max = def.params[0].max;
      aR.step = def.params[0].step; aR.value = def.params[0].val;
      aVal.textContent = M.fmt(parseFloat(aR.value));
      if (def.params[1]) {
        bWrap.style.display = '';
        bLab.textContent = def.params[1].lab;
        bR.min = def.params[1].min; bR.max = def.params[1].max;
        bR.step = def.params[1].step; bR.value = def.params[1].val;
        bVal.textContent = M.fmt(parseFloat(bR.value));
      } else {
        bWrap.style.display = 'none';
      }
    }

    function resetSamples() { samples = {}; total = 0; sampleN.textContent = '0'; }

    kind.addEventListener('change', function () { configureSliders(); resetSamples(); compute(); });
    aR.addEventListener('input', function () { aVal.textContent = M.fmt(parseFloat(aR.value)); compute(); });
    bR.addEventListener('input', function () { bVal.textContent = M.fmt(parseFloat(bR.value)); compute(); });
    drawBtn.addEventListener('click', function () {
      const def = DEFS[kind.value];
      const [a, b] = paramsOf(def);
      for (let i = 0; i < 1000; i++) {
        const k = keyFor(def, def.sample(a, b));
        samples[k] = (samples[k] || 0) + 1;
      }
      total += 1000;
      sampleN.textContent = total.toLocaleString('en-US');
      renderHist();
    });
    clearBtn.addEventListener('click', function () { resetSamples(); renderHist(); });

    configureSliders();
    compute();
  }

  /* =========================================================
     CH 3.1 — Law of Large Numbers
     ========================================================= */
  function initLLN() {
    const pR = $('lln-p'), pV = $('lln-p-val'), speed = $('lln-speed'), speedV = $('lln-speed-val'),
      toggle = $('lln-toggle'), reset = $('lln-reset'), chart = $('lln-chart'),
      nOut = $('lln-n'), propOut = $('lln-prop');
    if (!chart) return;
    const fc = C.frame(chart);

    let p = 0.5, n = 0, heads = 0, raf = null, stride = 1;
    let pts = []; // [log10(n), phat]
    const MAXPTS = 1200;

    function record(k, h) { // k = n after batch, h = heads
      if (k % stride === 0) pts.push([Math.log10(k), h / k]);
      if (pts.length > MAXPTS) { // decimate: double stride, keep every second point
        stride *= 2;
        const next = [];
        for (let i = 0; i < pts.length; i += 2) next.push(pts[i]);
        pts = next;
      }
    }

    function draw() {
      fc.render(function (ctx, W, H) {
        const xmax = Math.max(1, Math.log10(Math.max(n, 10)));
        const S = C.scale(W, H, { left: 44, right: 16, top: 16, bottom: 30 }, 0, xmax, 0, 1);
        const xTicks = [];
        for (let e = 0; e <= Math.ceil(xmax); e++) xTicks.push(e);
        C.axes(ctx, S, {
          xTicks,
          xFmt: function (v) { return '10' + '⁰¹²³⁴⁵⁶'[Math.round(v)] || ('10^' + v); }
        });
        // true-bias line
        C.line(ctx, S, [0, xmax], [p, p], { color: COLORS.parchment, width: 1.2, dash: [5, 4], alpha: 0.8 });
        // ±3σ convergence band shrinking as 1/√n
        if (n > 0) {
          const up = [], lo = [];
          const m = Math.min(n, 600);
          for (let k = 1; k <= m; k++) {
            const t = k / m, kx = Math.max(1, Math.round(Math.pow(10, t * Math.log10(Math.max(n, 1)))));
            const s = 3 * Math.sqrt(p * (1 - p) / kx);
            up.push([Math.log10(kx), Math.min(1, p + s)]);
            lo.push([Math.log10(kx), Math.max(0, p - s)]);
          }
          C.line(ctx, S, up.map((q) => q[0]), up.map((q) => q[1]), { color: COLORS.violet, width: 1, dash: [3, 4], alpha: 0.7 });
          C.line(ctx, S, lo.map((q) => q[0]), lo.map((q) => q[1]), { color: COLORS.violet, width: 1, dash: [3, 4], alpha: 0.7 });
        }
        if (pts.length > 1) {
          C.line(ctx, S, pts.map((q) => q[0]), pts.map((q) => q[1]), { color: COLORS.goldBright, width: 2 });
        }
        C.legend(ctx, [
          { color: COLORS.goldBright, label: 'running p̂' },
          { color: COLORS.parchment, label: 'true p' },
          { color: COLORS.violet, label: '±3σ band' }
        ], S.x0 + 8, S.y0 + 8);
      });
    }

    function step() {
      const batch = parseInt(speed.value, 10);
      let h = 0;
      for (let i = 0; i < batch; i++) if (Math.random() < p) h++;
      const from = n + 1;
      heads += h; n += batch;
      // record endpoints of each sub-batch cheaply: record one point per frame batch window
      record(Math.max(from, n) === n ? n : n, heads);
      if (stride > 1) record(n, heads);
      nOut.textContent = n.toLocaleString('en-US');
      propOut.textContent = n ? M.fmt(heads / n, 6) : '—';
      draw();
      raf = requestAnimationFrame(step);
    }

    function setRunning(on) {
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      toggle.textContent = on ? 'Pause' : 'Start';
      if (on) { raf = requestAnimationFrame(step); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    bindRange(pR, pV, function (v) {
      if (raf) { setRunning(false); }
      p = v; heads = 0; n = 0; pts = []; stride = 1;
      nOut.textContent = '0'; propOut.textContent = '—';
      draw();
    }, function (v) { return v.toFixed(2); });
    bindRange(speed, speedV, function () { }, function (v) { return String(Math.round(v)); });
    toggle.addEventListener('click', function () { setRunning(!raf); });
    reset.addEventListener('click', function () {
      setRunning(false);
      heads = 0; n = 0; pts = []; stride = 1;
      nOut.textContent = '0'; propOut.textContent = '—';
      draw();
    });
    draw();
  }

  /* =========================================================
     CH 3.2 — Central Limit laboratory
     ========================================================= */
  function initCLT() {
    const kind = $('clt-kind'), nR = $('clt-n'), nV = $('clt-n-val'),
      run = $('clt-run'), reset = $('clt-reset'), totalOut = $('clt-total'), chart = $('clt-chart');
    if (!chart) return;
    const fc = C.frame(chart);

    const POPS = {
      fairDie: {
        label: 'fair die', values: [1, 2, 3, 4, 5, 6], weights: [1, 1, 1, 1, 1, 1]
      },
      biasedDie: {
        label: 'biased die', values: [1, 2, 3, 4, 5, 6], weights: [1, 1, 2, 3, 4, 6]
      },
      fairCoin: { label: 'fair coin', values: [0, 1], weights: [1, 1] },
      loadedCoin: { label: 'loaded coin', values: [0, 1], weights: [3, 17] }
    };

    // precompute population mean, sd, and a cdf table
    for (const k in POPS) {
      const P = POPS[k];
      const tot = P.weights.reduce((a, b) => a + b, 0);
      P.probs = P.weights.map((w) => w / tot);
      const st = M.moments(P.values, P.probs);
      P.mu = st.mean; P.sd = st.sd;
      P.cum = []; let acc = 0;
      P.probs.forEach(function (q, i) { acc += q; P.cum.push([acc, P.values[i]]); });
    }

    let bins = null, counts = null, total = 0, edges = null, mu = 0, sdM = 1;

    function rebuild() {
      const P = POPS[kind.value];
      const n = parseInt(nR.value, 10);
      mu = P.mu; sdM = P.sd / Math.sqrt(n);
      const NB = 42;
      edges = [];
      const lo = mu - 4 * sdM, hi = mu + 4 * sdM;
      for (let i = 0; i <= NB; i++) edges.push(lo + (hi - lo) * i / NB);
      bins = []; for (let i = 0; i < NB; i++) bins.push((edges[i] + edges[i + 1]) / 2);
      counts = new Array(NB).fill(0);
    }

    function sampleMean(P, n) {
      let s = 0;
      for (let i = 0; i < n; i++) {
        const u = Math.random();
        for (let j = 0; j < P.cum.length; j++) {
          if (u <= P.cum[j][0]) { s += P.cum[j][1]; break; }
        }
      }
      return s / n;
    }

    function draw() {
      fc.render(function (ctx, W, H) {
        const bw = edges[1] - edges[0];
        const fitted = bins.map(function (x) { return M.normalPDF(x, mu, sdM) * total * bw; });
        const ymax = Math.max(
          counts.length ? Math.max.apply(null, counts) : 0,
          fitted.length ? Math.max.apply(null, fitted) : 0,
          1) * 1.15;
        const S = C.scale(W, H, MARGIN, edges[0], edges[edges.length - 1], 0, ymax);
        C.axes(ctx, S, {});
        C.bars(ctx, S, bins, counts, { color: COLORS.violet, alpha: 0.65, widthPx: Math.abs(S.X(bins[1]) - S.X(bins[0])) * 0.9 });
        if (total > 0) {
          const normXs = []; const normYs = [];
          for (let i = 0; i <= 200; i++) {
            const x = S.xmin + (S.xmax - S.xmin) * i / 200;
            normXs.push(x);
            normYs.push(M.normalPDF(x, mu, sdM) * total * bw);
          }
          C.line(ctx, S, normXs, normYs, { color: COLORS.goldBright, width: 2 });
        }
        C.legend(ctx, [
          { color: COLORS.violet, label: 'sample means (n=' + nR.value + ')' },
          { color: COLORS.goldBright, label: 'N(μ, σ²⁄n)' }
        ], S.x0 + 8, S.y0 + 8);
        ctx.save();
        ctx.font = '11px Georgia, serif';
        ctx.fillStyle = COLORS.text; ctx.textAlign = 'right';
        ctx.fillText('μ=' + M.fmt(mu, 3) + '   σ_mean=' + M.fmt(sdM, 3), S.x1, S.y0 + 8);
        ctx.restore();
      });
    }

    run.addEventListener('click', function () {
      const P = POPS[kind.value];
      const n = parseInt(nR.value, 10);
      const NB = bins.length, lo = edges[0], bw = edges[1] - edges[0];
      for (let i = 0; i < 500; i++) {
        const m = sampleMean(P, n);
        let idx = Math.floor((m - lo) / bw);
        idx = Math.max(0, Math.min(NB - 1, idx));
        counts[idx]++;
      }
      total += 500;
      totalOut.textContent = total.toLocaleString('en-US');
      draw();
    });
    reset.addEventListener('click', function () {
      rebuild(); total = 0; totalOut.textContent = '0'; draw();
    });
    kind.addEventListener('change', function () { rebuild(); total = 0; totalOut.textContent = '0'; draw(); });
    nR.addEventListener('input', function () {
      nV.textContent = nR.value;
      rebuild(); total = 0; totalOut.textContent = '0'; draw();
    });
    rebuild();
    draw();
  }

  /* =========================================================
     CH 3.3 — Bayes: base-rate trap
     ========================================================= */
  function initBayes() {
    const prev = $('by-prev'), sens = $('by-sens'), spec = $('by-spec'),
      prevV = $('by-prev-val'), sensV = $('by-sens-val'), specV = $('by-spec-val'),
      grid = $('by-grid');
    if (!grid) return;
    const fc = C.frame(grid);

    function draw() {
      const p = parseFloat(prev.value), se = parseFloat(sens.value), sp = parseFloat(spec.value);
      prevV.textContent = pct(p, 1);
      sensV.textContent = pct(se, 0);
      specV.textContent = pct(sp, 0);
      fc.render(function (ctx, W, H) {
        const COLS2 = 50, ROWS2 = 20, N = 1000;
        const cell = Math.min((W - 30) / COLS2, (H - 30) / ROWS2);
        const ox = (W - cell * COLS2) / 2, oy = (H - cell * ROWS2) / 2;
        for (let i = 0; i < N; i++) {
          const diseased = Math.random() < p;
          let color;
          if (diseased) color = Math.random() < se ? COLORS.goldBright : COLORS.red; // TP / FN
          else color = Math.random() < sp ? '#4a4a5e' : COLORS.violet;               // TN / FP
          const cx = i % COLS2, cy = Math.floor(i / COLS2);
          ctx.fillStyle = color;
          ctx.globalAlpha = color === '#4a4a5e' ? 0.55 : 0.95;
          ctx.fillRect(ox + cx * cell + 1, oy + cy * cell + 1, cell - 2, cell - 2);
        }
        ctx.globalAlpha = 1;
      });

      const pop = 100000;
      const tp = Math.round(pop * p * se);
      const fn = Math.round(pop * p * (1 - se));
      const tn = Math.round(pop * (1 - p) * sp);
      const fp = Math.round(pop * (1 - p) * (1 - sp));
      $('by-tp').textContent = tp.toLocaleString('en-US');
      $('by-fp').textContent = fp.toLocaleString('en-US');
      $('by-tn').textContent = tn.toLocaleString('en-US');
      $('by-fn').textContent = fn.toLocaleString('en-US');
      const denom = se * p + (1 - sp) * (1 - p);
      const post = denom > 0 ? (se * p) / denom : 0;
      $('by-post').textContent = pct(post, 2);
      $('by-note').textContent =
        'At prevalence ' + pct(p, 2) + ', sensitivity ' + pct(se, 0) + ', specificity ' + pct(spec ? parseFloat(spec.value) : 0, 0) +
        ', a positive test means disease only ' + pct(post, 1) + ' of the time — ' +
        fp.toLocaleString('en-US') + ' false positives against ' + tp.toLocaleString('en-US') +
        ' true positives per 100k tested. Intuition read the sensitivity; Bayes read the base rate.';
    }

    [prev, sens, spec].forEach(function (el) { el.addEventListener('input', draw); });
    draw();
  }

  /* =========================================================
     CH 4.1 — Expected value & house edge
     ========================================================= */
  function initEV() {
    const pR = $('ev-p'), payR = $('ev-pay'), pV = $('ev-p-val'), payV = $('ev-pay-val'),
      out = $('ev-out'), verdict = $('ev-verdict'), tbody = $('ev-table');
    if (!pR || !tbody) return;

    function render() {
      const p = parseFloat(pR.value), b = parseFloat(payR.value);
      pV.textContent = M.fmt(p, 4); payV.textContent = M.fmt(b, 2);
      const ev = p * b - (1 - p);
      out.textContent = M.fmt(ev, 4) + ' units  (' + pct(ev, 2) + ')';
      if (Math.abs(ev) < 1e-9) {
        verdict.textContent = 'Fair bet: EV = 0. No edge on either side.'; verdict.className = 'ctl verdict gold';
      } else if (ev > 0) {
        verdict.textContent = 'Player edge ' + pct(ev, 2) + ' — casinos do not offer this game.'; verdict.className = 'ctl verdict ok';
      } else {
        verdict.textContent = 'House edge ' + pct(-ev, 2) + ' — every unit wagered leaks ' + M.fmt(-ev, 4) + ' to the house.'; verdict.className = 'ctl verdict bad';
      }
    }
    pR.addEventListener('input', render);
    payR.addEventListener('input', render);
    render();

    const ROWS = [
      { name: 'European roulette — single number', p: 1 / 37, b: 35 },
      { name: 'American roulette — single number', p: 1 / 38, b: 35 },
      { name: 'European roulette — even-money (red/black)', p: 18 / 37, b: 1 },
      { name: 'American roulette — even-money', p: 18 / 38, b: 1 },
      { name: 'European roulette — dozen (12 numbers)', p: 12 / 37, b: 2 },
      { name: 'Coin flip — fair payout 1:1', p: 0.5, b: 1 }
    ];
    ROWS.forEach(function (r) {
      const ev = r.p * r.b - (1 - r.p);
      const tr = document.createElement('tr');
      const cells = [r.name, M.fmt(r.p, 4), r.b + ' : 1', M.fmt(ev, 4), pct(ev, 2)];
      cells.forEach(function (val, i) {
        const td = document.createElement('td');
        td.textContent = val;
        if (i >= 3 && ev < 0) td.className = 'neg';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  /* =========================================================
     CH 4.2 — Gambler's ruin
     ========================================================= */
  function initRuin() {
    const pR = $('gr-p'), iR = $('gr-i'), nR = $('gr-N'),
      pV = $('gr-p-val'), iV = $('gr-i-val'), nV = $('gr-N-val'),
      run = $('gr-run'), reset = $('gr-reset'), chart = $('gr-chart'),
      theoryOut = $('gr-theory'), simOut = $('gr-sim'), nOut = $('gr-n');
    if (!chart) return;
    const fc = C.frame(chart);

    let walks = [], wins = 0, losses = 0, paths = [];
    const MAXPATHS = 18;

    function ruinProbTheory(p, i, N) {
      if (i <= 0) return 1;
      if (i >= N) return 0;
      if (p <= 0) return 1;
      if (p >= 1) return 0;
      const q = 1 - p;
      if (Math.abs(p - 0.5) < 1e-12) return 1 - i / N;
      const r = q / p;
      const up = (1 - Math.pow(r, i)) / (1 - Math.pow(r, N));
      return 1 - up;
    }

    function oneWalk(p, i, N) {
      let x = i;
      const path = [x];
      let steps = 0;
      while (x > 0 && x < N && steps < 200000) {
        x += Math.random() < p ? 1 : -1;
        path.push(x);
        steps++;
      }
      return { path, ruined: x === 0, steps };
    }

    function state() {
      return { p: parseFloat(pR.value), i: parseInt(iR.value, 10), N: parseInt(nR.value, 10) };
    }

    function draw() {
      const s = state();
      fc.render(function (ctx, W, H) {
        const maxSteps = Math.max(10, walks.reduce(function (m, w) { return Math.max(m, w.steps); }, 0));
        const S = C.scale(W, H, MARGIN, 0, maxSteps, 0, s.N);
        C.axes(ctx, S, {});
        // boundaries
        C.line(ctx, S, [0, maxSteps], [s.N, s.N], { color: COLORS.goldBright, width: 1.2, dash: [5, 4] });
        C.line(ctx, S, [0, maxSteps], [0, 0], { color: COLORS.red, width: 1.2, dash: [5, 4] });
        C.line(ctx, S, [0, maxSteps], [s.i, s.i], { color: COLORS.parchment, width: 0.8, dash: [2, 4], alpha: 0.5 });
        paths.forEach(function (w, idx) {
          const isLast = idx === paths.length - 1;
          C.line(ctx, S, w.path.map(function (_, k) { return k; }), w.path, {
            color: w.ruined ? COLORS.red : COLORS.gold,
            width: isLast ? 1.8 : 1,
            alpha: isLast ? 0.95 : 0.28
          });
        });
        C.legend(ctx, [
          { color: COLORS.gold, label: 'reached N' },
          { color: COLORS.red, label: 'ruined' }
        ], S.x0 + 8, S.y0 + 8);
      });
      const { p, i, N } = s;
      theoryOut.textContent = pct(ruinProbTheory(p, i, N), 3);
      const total = wins + losses;
      simOut.textContent = total ? pct(losses / total, 3) : '—';
      nOut.textContent = total.toLocaleString('en-US');
    }

    function changed() {
      const s = state();
      iR.max = String(s.N - 1);
      if (s.i >= s.N) { iR.value = String(s.N - 1); }
      pV.textContent = M.fmt(s.p, 2); iV.textContent = iR.value; nV.textContent = String(s.N);
      walks = []; paths = []; wins = 0; losses = 0;
      draw();
    }

    run.addEventListener('click', function () {
      const { p, i, N } = state();
      for (let k = 0; k < 100; k++) {
        const w = oneWalk(p, i, N);
        walks.push(w);
        if (w.ruined) losses++; else wins++;
        paths.push(w);
        if (paths.length > MAXPATHS) paths.shift();
      }
      draw();
    });
    reset.addEventListener('click', changed);
    [pR, iR, nR].forEach(function (el) { el.addEventListener('input', changed); });
    changed();
  }

  /* =========================================================
     CH 4.3 — Martingale under finite bankroll
     ========================================================= */
  function initMartingale() {
    const base = $('mt-base'), bank = $('mt-bank'), pR = $('mt-p'),
      baseV = $('mt-base-val'), bankV = $('mt-bank-val'), pV = $('mt-p-val'),
      run = $('mt-run'), reset = $('mt-reset'), chart = $('mt-chart'),
      profitOut = $('mt-profit'), bustOut = $('mt-bust'), evNote = $('mt-evnote');
    if (!chart) return;
    const fc = C.frame(chart);

    let profits = 0, busts = 0, paths = [];
    const MAXPATHS = 16;

    function state() {
      return {
        base: parseInt(base.value, 10),
        bank: parseInt(bank.value, 10),
        p: parseFloat(pR.value)
      };
    }

    function oneSession(s) {
      let B = s.bank, bet = s.base;
      const path = [B];
      let spins = 0;
      while (spins < 100000) {
        if (B < bet) return { bust: true, spins, path };
        spins++;
        if (Math.random() < s.p) {
          B += bet;
          path.push(B);
          return { bust: false, spins, path }; // one cycle complete: profit of one base bet
        }
        B -= bet;
        path.push(B);
        bet *= 2;
      }
      return { bust: B < bet, spins, path };
    }

    function draw() {
      const s = state();
      fc.render(function (ctx, W, H) {
        const maxSpins = Math.max(10, paths.reduce(function (m, w) { return Math.max(m, w.spins); }, 0));
        const yMax = Math.max(s.bank * 1.05, paths.reduce(function (m, w) { return Math.max(m, Math.max.apply(null, w.path)); }, s.bank));
        const S = C.scale(W, H, MARGIN, 0, maxSpins, 0, yMax * 1.05);
        C.axes(ctx, S, {});
        C.line(ctx, S, [0, maxSpins], [s.bank, s.bank], { color: COLORS.parchment, width: 0.8, dash: [2, 4], alpha: 0.5 });
        paths.forEach(function (w, idx) {
          const isLast = idx === paths.length - 1;
          const xs = w.path.map(function (_, k) { return k; });
          C.line(ctx, S, xs, w.path, {
            color: w.bust ? COLORS.red : COLORS.gold,
            width: isLast ? 1.8 : 1,
            alpha: isLast ? 0.95 : 0.3
          });
        });
        C.legend(ctx, [
          { color: COLORS.gold, label: 'cycle won (+' + s.base + ')' },
          { color: COLORS.red, label: 'bust' }
        ], S.x0 + 8, S.y0 + 8);
      });
      profitOut.textContent = profits.toLocaleString('en-US');
      bustOut.textContent = busts.toLocaleString('en-US');
      const sessions = profits + busts;
      const q = 1 - s.p;
      const depth = Math.floor(Math.log(s.bank / s.base) / Math.log(2)) + 1; // consecutive losses the bankroll survives
      evNote.textContent = sessions === 0
        ? 'Per-spin EV = ' + M.fmt(2 * s.p - 1, 4) + ' per unit bet — negative. Staking cannot cure it.'
        : sessions.toLocaleString('en-US') + ' sessions: ' + profits.toLocaleString('en-US') +
          ' won (+' + s.base + ' each), ' + busts.toLocaleString('en-US') + ' busted (≈ −' + s.bank.toLocaleString('en-US') +
          ' each). The bankroll absorbs only ' + depth + ' straight losses; bust risk per cycle ≈ ' + pct(Math.pow(q, depth + 1), 4) + '.';
      evNote.className = 'ctl verdict bad';
    }

    run.addEventListener('click', function () {
      const s = state();
      for (let k = 0; k < 100; k++) {
        const r = oneSession(s);
        if (r.bust) busts++; else profits++;
        paths.push(r);
        if (paths.length > MAXPATHS) paths.shift();
      }
      draw();
    });
    reset.addEventListener('click', function () { profits = 0; busts = 0; paths = []; draw(); });
    [base, bank, pR].forEach(function (el) {
      el.addEventListener('input', function () {
        baseV.textContent = base.value; bankV.textContent = bank.value; pV.textContent = M.fmt(parseFloat(pR.value), 4);
        profits = 0; busts = 0; paths = [];
        draw();
      });
    });
    baseV.textContent = base.value; bankV.textContent = bank.value; pV.textContent = M.fmt(parseFloat(pR.value), 4);
    draw();
  }

  /* =========================================================
     CH 4.4 — Gambler's fallacy
     ========================================================= */
  function initFallacy() {
    const flip = $('fa-flip'), flip100 = $('fa-flip100'), strip = $('fa-streak'),
      nOut = $('fa-n'), runOut = $('fa-run'), quizOut = $('fa-quiz-out');
    if (!strip) return;

    let n = 0, runSide = null, runLen = 0;
    const MAXSHOWN = 160;

    function render() {
      nOut.textContent = n.toLocaleString('en-US');
      runOut.textContent = runLen === 0 ? '—' : runLen + ' × ' + (runSide === 'H' ? 'heads' : 'tails');
    }

    function addFlips(k) {
      for (let i = 0; i < k; i++) {
        const h = Math.random() < 0.5;
        n++;
        const side = h ? 'H' : 'T';
        if (side === runSide) runLen++; else { runSide = side; runLen = 1; }
        const s = document.createElement('span');
        s.className = h ? 'h' : 't';
        s.title = h ? 'heads' : 'tails';
        strip.appendChild(s);
      }
      while (strip.children.length > MAXSHOWN) strip.removeChild(strip.firstChild);
      render();
    }

    flip.addEventListener('click', function () { addFlips(1); });
    flip100.addEventListener('click', function () { addFlips(100); });

    document.querySelectorAll('.fa-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const v = btn.getAttribute('data-val');
        if (v === 'eq') {
          quizOut.textContent = 'Correct. P(tails) = 0.5 exactly — the coin has no memory of its streak. Independence means P(T | HHHHH) = P(T).';
          quizOut.className = 'quiz-out right';
        } else {
          quizOut.textContent = 'That is the gambler’s fallacy. Streaks feel like debts, but independent trials settle nothing. P(tails) stays 0.5.';
          quizOut.className = 'quiz-out wrong';
        }
      });
    });
  }

  /* =========================================================
     CH 5.1 — Monte Carlo π
     ========================================================= */
  function initPi() {
    const batch = $('pi-batch'), batchV = $('pi-batch-val'),
      toggle = $('pi-toggle'), reset = $('pi-reset'),
      darts = $('pi-darts'), err = $('pi-err'),
      nOut = $('pi-n'), estOut = $('pi-est'), diffOut = $('pi-diff'), statusOut = $('pi-note');
    if (!darts || !err) return;
    const fd = C.frame(darts), fe = C.frame(err);

    let n = 0, inside = 0, raf = null;
    let errPts = []; // [log10(n), error]
    let stride = 1;
    const NCAP = 300000, MAXPTS = 700;

    function recordErr() {
      if (n <= 0) return;
      if (Math.log10(n) % stride < 1 || errPts.length === 0) {
        errPts.push([Math.log10(n), Math.abs(4 * inside / n - Math.PI)]);
      }
      if (errPts.length > MAXPTS) {
        stride *= 2;
        const next = [];
        for (let i = 0; i < errPts.length; i += 2) next.push(errPts[i]);
        errPts = next;
      }
    }

    function drawErr() {
      fe.render(function (ctx, W, H) {
        const xs = errPts.map(function (q) { return q[0]; });
        const ys = errPts.map(function (q) { return Math.log10(Math.max(q[1], 1e-6)); });
        const xmax = Math.max(1.5, xs.length ? xs[xs.length - 1] : 1.5);
        const S = C.scale(W, H, { left: 48, right: 16, top: 16, bottom: 30 },
          0, xmax, -4.5, 1);
        const xticks = []; for (let e = 0; e <= Math.ceil(xmax); e++) xticks.push(e);
        C.axes(ctx, S, {
          xTicks: xticks,
          yTicks: [-4, -3, -2, -1, 0, 1],
          xFmt: function (v) { return '10^' + Math.round(v); },
          yFmt: function (v) { return '10^' + v; }
        });
        // reference slope: error ∝ 1/√N ⇒ on log-log, slope −1/2
        if (errPts.length > 1) {
          const x0 = errPts[0][0], y0 = Math.log10(Math.max(errPts[0][1], 1e-6));
          const rx = [x0, xmax];
          const ry = [y0, y0 - 0.5 * (xmax - x0)];
          C.line(ctx, S, rx, ry, { color: COLORS.violet, width: 1, dash: [4, 4], alpha: 0.8 });
        }
        if (xs.length > 1) C.line(ctx, S, xs, ys, { color: COLORS.goldBright, width: 2 });
        C.legend(ctx, [
          { color: COLORS.goldBright, label: '|π̂ − π|' },
          { color: COLORS.violet, label: '∝ 1/√N reference' }
        ], S.x0 + 8, S.y0 + 8);
      });
    }

    function drawBoardBase(ctx, W, H) {
      const side = Math.min(W, H) - 20;
      const ox = (W - side) / 2, oy = (H - side) / 2;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, side, side);
      ctx.beginPath();
      ctx.arc(ox, oy + side, side, -Math.PI / 2, 0);
      ctx.stroke();
      return { ox, oy, side };
    }

    function throwBatch() {
      const k = parseInt(batch.value, 10);
      const ctx = fd.ctx;
      const W = fd.canvas.width / (Math.min(window.devicePixelRatio || 1, 2.5));
      const H = fd.canvas.height / (Math.min(window.devicePixelRatio || 1, 2.5));
      // recompute board frame in css pixels
      const side = Math.min(W, H) - 20;
      const ox = (W - side) / 2, oy = (H - side) / 2;
      for (let i = 0; i < k; i++) {
        const x = Math.random(), y = Math.random();
        const inC = x * x + y * y <= 1;
        inside += inC ? 1 : 0;
        ctx.fillStyle = inC ? COLORS.goldBright : COLORS.violet;
        ctx.globalAlpha = inC ? 0.7 : 0.4;
        ctx.fillRect(ox + x * side - 1, oy + (1 - y) * side - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
      n += k;
      recordErr();
      nOut.textContent = n.toLocaleString('en-US');
      const est = 4 * inside / n;
      estOut.textContent = M.fmt(est, 7);
      diffOut.textContent = M.fmt(Math.abs(est - Math.PI), 7);
      drawErr();
      if (n >= NCAP) {
        setRunning(false);
        setStatus('capped at ' + NCAP.toLocaleString('en-US') + ' darts — reset to continue');
        return;
      }
      raf = requestAnimationFrame(throwBatch);
    }

    function setStatus(t) { statusOut.querySelector('output').textContent = t; }

    function setRunning(on) {
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      toggle.textContent = on ? 'Pause' : 'Start throwing';
      if (on) { setStatus('throwing'); raf = requestAnimationFrame(throwBatch); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; setStatus('paused'); }
    }

    bindRange(batch, batchV, function () { }, function (v) { return String(Math.round(v)); });
    toggle.addEventListener('click', function () { setRunning(!raf); });
    reset.addEventListener('click', function () {
      setRunning(false);
      n = 0; inside = 0; errPts = []; stride = 1;
      nOut.textContent = '0'; estOut.textContent = '—'; diffOut.textContent = '—';
      fd.render(function (ctx, W, H) { drawBoardBase(ctx, W, H); });
      drawErr();
      setStatus('idle');
    });
    fd.render(function (ctx, W, H) { drawBoardBase(ctx, W, H); });
    drawErr();
  }

  /* =========================================================
     CH 5.2 — Hypothesis testing
     ========================================================= */
  function initHTest() {
    const pR = $('hx-p'), pV = $('hx-p-val'), mystery = $('hx-mystery'),
      reveal = $('hx-reveal'), flip = $('hx-flip'), flip100 = $('hx-flip100'), reset = $('hx-reset'),
      nOut = $('hx-n'), hOut = $('hx-h'), zOut = $('hx-z'), pvOut = $('hx-pv'),
      verdict = $('hx-verdict'), truth = $('hx-truth');
    if (!pR) return;

    let trueP = parseFloat(pR.value), hiddenP = null;
    let n = 0, heads = 0, revealed = true;

    const P0 = 0.5, ALPHA = 0.05;

    function activeP() {
      return (mystery.checked && hiddenP !== null) ? hiddenP : trueP;
    }

    function compute() {
      nOut.textContent = String(n); hOut.textContent = String(heads);
      if (n === 0) {
        zOut.textContent = '—'; pvOut.textContent = '—';
        verdict.textContent = 'No data yet — H₀ lives unchallenged.';
        verdict.className = 'ctl verdict';
        return;
      }
      const sd = Math.sqrt(n * P0 * (1 - P0));
      const z = (heads - n * P0) / sd;
      const pv = 2 * (1 - M.normalCDF(Math.abs(z)));
      zOut.textContent = M.fmt(z, 3);
      pvOut.textContent = pv < 1e-6 ? pv.toExponential(2) : M.fmt(pv, 5);
      if (pv < ALPHA) {
        verdict.textContent = 'p = ' + (pv < 1e-6 ? pv.toExponential(2) : M.fmt(pv, 4)) + ' < 0.05 → reject H₀: significant evidence the coin is unfair.';
        verdict.className = 'ctl verdict bad';
      } else {
        verdict.textContent = 'p = ' + M.fmt(pv, 4) + ' ≥ 0.05 → fail to reject H₀: data consistent with a fair coin (so far).';
        verdict.className = 'ctl verdict ok';
      }
    }

    function addFlips(k) {
      const p = activeP();
      for (let i = 0; i < k; i++) if (Math.random() < p) heads++;
      n += k;
      compute();
    }

    function newMystery() {
      hiddenP = 0.15 + 0.7 * Math.random();
      revealed = false;
      truth.querySelector('output').textContent = 'hidden — flip and infer';
      n = 0; heads = 0; compute();
    }

    function onTruthChange() {
      trueP = parseFloat(pR.value);
      pV.textContent = M.fmt(trueP, 2);
      n = 0; heads = 0; compute();
    }

    pR.addEventListener('input', onTruthChange);
    flip.addEventListener('click', function () { addFlips(1); });
    flip100.addEventListener('click', function () { addFlips(100); });
    reset.addEventListener('click', function () {
      n = 0; heads = 0;
      if (mystery.checked) newMystery();
      compute();
    });
    mystery.addEventListener('change', function () {
      if (mystery.checked) newMystery();
      else {
        revealed = true;
        truth.querySelector('output').textContent = 'visible above';
        n = 0; heads = 0; compute();
      }
    });
    reveal.addEventListener('click', function () {
      if (!mystery.checked) { truth.querySelector('output').textContent = 'visible above'; return; }
      revealed = true;
      truth.querySelector('output').textContent =
        'true p was ' + M.fmt(hiddenP !== null ? hiddenP : trueP, 4) +
        (activeTailsOk() ? '' : '');
    });
    function activeTailsOk() { return true; }

    pV.textContent = M.fmt(trueP, 2);
    compute();
  }

  /* =========================================================
     CH 5.3 — Bayesian updating
     ========================================================= */
  function initBayesUp() {
    const prior = $('bu-prior'), priorV = $('bu-prior-val'), truth = $('bu-truth'),
      flip = $('bu-flip'), flip10 = $('bu-flip10'), reset = $('bu-reset'), chart = $('bu-bar'),
      p1Out = $('bu-p1'), p2Out = $('bu-p2'), logOut = $('bu-log');
    if (!chart) return;
    const fc = C.frame(chart);

    const THETA = [0.5, 0.7];
    let trueTheta = 0.7, unknown = true;
    let logBF = 0, n = 0, heads = 0;

    function posterior() {
      // P(fair | data) = 1 / (1 + odds_biased_vs_fair)
      const pi0 = parseFloat(prior.value);
      const priorOddsBvsF = (1 - pi0) / pi0;
      const odds = priorOddsBvsF * Math.exp(logBF);
      const pFair = 1 / (1 + odds);
      return pFair;
    }

    function draw() {
      const pf = posterior();
      p1Out.textContent = pct(pf, 2);
      p2Out.textContent = pct(1 - pf, 2);
      logOut.textContent = M.fmt(logBF, 3);
      fc.render(function (ctx, W, H) {
        const S = C.scale(W, H, { left: 130, right: 60, top: 18, bottom: 18 }, 0, 1, 0, 1);
        const rows = [
          { label: 'P(fair | data)', v: pf, color: COLORS.goldBright },
          { label: 'P(p=0.7 | data)', v: 1 - pf, color: COLORS.violet }
        ];
        ctx.save();
        ctx.font = '12px Georgia, serif';
        rows.forEach(function (r, i) {
          const y = S.y0 + 20 + i * 42;
          ctx.fillStyle = COLORS.text; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(r.label, S.x0 - 8, y + 8);
          ctx.fillStyle = r.color; ctx.globalAlpha = 0.85;
          ctx.fillRect(S.x0, y, Math.max(0, S.X(r.v) - S.x0), 16);
          ctx.globalAlpha = 1;
          ctx.fillStyle = COLORS.parchment; ctx.textAlign = 'left';
          ctx.fillText(pct(r.v, 2), S.X(r.v) + 6, y + 8);
        });
        ctx.strokeStyle = COLORS.axis;
        ctx.strokeRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
        ctx.restore();
      });
    }

    function modelP() { return trueTheta; }

    function doFlip() {
      const heads_ = Math.random() < modelP();
      n++;
      if (heads_) heads++;
      // log Bayes factor for biased vs fair: log[(θ/0.5)] on heads, log[((1-θ)/(1-0.5))] on tails
      logBF += heads_ ? Math.log(THETA[1] / THETA[0]) : Math.log((1 - THETA[1]) / (1 - THETA[0]));
      draw();
      return heads_;
    }

    function configureTruth() {
      const v = truth.value;
      if (v === 'random') { trueTheta = Math.random() < 0.5 ? 0.5 : 0.7; unknown = true; }
      else { trueTheta = v === 'fair' ? 0.5 : 0.7; unknown = false; }
    }

    function resetAll() {
      logBF = 0; n = 0; heads = 0;
      configureTruth();
      draw();
    }

    prior.addEventListener('input', function () { priorV.textContent = pct(parseFloat(prior.value), 0); draw(); });
    truth.addEventListener('change', resetAll);
    flip.addEventListener('click', function () { doFlip(); });
    flip10.addEventListener('click', function () { for (let i = 0; i < 10; i++) doFlip(); });
    reset.addEventListener('click', resetAll);
    priorV.textContent = pct(parseFloat(prior.value), 0);
    resetAll();
  }

  /* =========================================================
     CH 5.4 — Entropy laboratory
     ========================================================= */
  function initEntropy() {
    const kind = $('en-kind'), param = $('en-param'), lab = $('en-param-label'),
      val = $('en-param-val'), chart = $('en-bars'),
      hOut = $('en-h'), maxOut = $('en-max'), note = $('en-k');
    if (!chart) return;
    const fc = C.frame(chart);

    const MODES = {
      fairdie: { fixed: true, probs: () => [1, 1, 1, 1, 1, 1].map(function () { return 1 / 6; }), labels: ['⚄','⚁','⚂','⚃','⚄','⚅'] },
      loaded: {
        fixed: false, lab: 'P(⚅)', min: 0, max: 1, step: 0.01, val: 1 / 6,
        probs: (a) => {
          const rest = (1 - a) / 5;
          return [rest, rest, rest, rest, rest, a];
        },
        labels: ['⚄','⚁','⚂','⚃','⚄','⚅']
      },
      coin: {
        fixed: false, lab: 'P(heads)', min: 0, max: 1, step: 0.01, val: 0.5,
        probs: (a) => [a, 1 - a],
        labels: ['heads', 'tails']
      },
      uniform: {
        fixed: false, lab: 'k symbols', min: 2, max: 16, step: 1, val: 6,
        probs: (a) => { const k = Math.round(a); const p = 1 / k; const out = []; for (let i = 0; i < k; i++) out.push(p); return out; },
        labels: null
      }
    };

    function compute() {
      const mode = MODES[kind.value];
      let probs;
      if (mode.fixed) {
        param.disabled = true;
        val.textContent = '—';
        lab.textContent = '(no parameter)';
        probs = mode.probs();
      } else {
        param.disabled = false;
        param.min = mode.min; param.max = mode.max; param.step = mode.step;
        if (mode.prevKind !== kind.value) { param.value = mode.val; mode.prevKind = kind.value; }
        lab.textContent = mode.lab;
        const a = parseFloat(param.value);
        val.textContent = mode.step >= 1 ? String(Math.round(a)) : M.fmt(a, 3);
        probs = mode.probs(a);
      }
      const H = M.entropy(probs);
      const k = probs.length;
      const Hmax = Math.log2(k);
      hOut.textContent = M.fmt(H, 4) + ' bits';
      maxOut.textContent = M.fmt(Hmax, 4) + ' bits';
      const deficit = Hmax - H;
      note.textContent = deficit < 1e-12
        ? 'Maximum entropy: ' + k + ' equiprobable outcomes, H = log₂(' + k + ').'
        : 'Skew cost: ' + M.fmt(deficit, 4) + ' bits below the uniform ceiling.';
      note.className = 'ctl verdict ' + (deficit < 1e-12 ? 'gold' : 'bad');

      fc.render(function (ctx, W, Hh) {
        const vmax = Math.max(Hmax, Math.max.apply(null, probs)) * 1.15;
        const S = C.scale(W, Hh, { left: 44, right: 14, top: 22, bottom: 34 }, -0.5, probs.length - 0.5, 0, vmax);
        C.axes(ctx, S, {
          xTicks: probs.map(function (_, i) { return i; }),
          xFmt: function (i) {
            const labels = mode.labels;
            return labels ? labels[Math.round(i)] : 'x' + (Math.round(i) + 1);
          }
        });
        C.bars(ctx, S, probs.map(function (_, i) { return i; }), probs, { color: COLORS.violet, alpha: 0.75 });
        // max-entropy reference line at uniform level 1/k
        C.line(ctx, S, [-0.5, probs.length - 0.5], [1 / k, 1 / k], { color: COLORS.goldBright, width: 1.4, dash: [5, 4] });
        C.legend(ctx, [
          { color: COLORS.violet, label: 'p(x)' },
          { color: COLORS.goldBright, label: 'uniform ceiling 1/k' }
        ], S.x0 + 8, S.y0 + 8);
      });
    }

    kind.addEventListener('change', compute);
    param.addEventListener('input', compute);
    compute();
  }

  /* =========================================================
     Dispatch
     ========================================================= */
  const INITS = [
    initSampleSpace, initCombinatorics, initConditional,
    initDistribution,
    initLLN, initCLT, initBayes,
    initEV, initRuin, initMartingale, initFallacy,
    initPi, initHTest, initBayesUp, initEntropy
  ];

  function initAll() {
    for (const fn of INITS) {
      try { fn(); } catch (e) { console.error('[entropy-gate] simulator failed:', fn.name, e); }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  return { initAll };
})();
```