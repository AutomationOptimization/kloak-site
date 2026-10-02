/* The Entropy Gate — dependency-free canvas chart primitives.
   frame() handles DPR scaling + container resize (ResizeObserver when
   available); scale()/axes()/bars()/line()/points() are the drawing kit.
   Colors are pulled from the codex palette. */
'use strict';
window.CHARTS = (function () {
  const COLORS = {
    grid: 'rgba(201,162,39,0.10)',
    axis: 'rgba(201,162,39,0.35)',
    text: '#a9a28c',
    parchment: '#e7dfc8',
    gold: '#c9a227',
    goldBright: '#e8c464',
    violet: '#7c5cff',
    red: '#e05555',
    ok: '#6fd08c'
  };

  /* Bind a canvas to auto-resize; each render call clears and redraws.
     The stored render fn is re-run on container resize. */
  function frame(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const state = { fn: null, W: 0, H: 0 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const parent = canvas.parentElement;
      let cssW = parent ? parent.clientWidth : canvas.clientWidth;
      if (!cssW || cssW < 40) cssW = 320;
      const cssH = opts.height || parseInt(canvas.dataset.height, 10) || 280;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = '100%';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.W = cssW;
      state.H = cssH;
      draw();
    }

    function draw() {
      if (!state.fn) return;
      ctx.clearRect(0, 0, state.W, state.H);
      state.fn(ctx, state.W, state.H);
    }

    function render(fn) { state.fn = fn; resize(); }
    function redraw() { draw(); }

    if (window.ResizeObserver && canvas.parentElement) {
      try { new ResizeObserver(function () { resize(); }).observe(canvas.parentElement); }
      catch (e) { window.addEventListener('resize', resize); }
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    return { render, redraw, resize, ctx, canvas };
  }

  /* Data→pixel mapping with margins record. */
  function scale(W, H, margin, xmin, xmax, ymin, ymax) {
    const x0 = margin.left, x1 = W - margin.right;
    const y0 = margin.top, y1 = H - margin.bottom;
    if (xmax === xmin) xmax = xmin + 1;
    if (ymax === ymin) ymax = ymin + 1;
    return {
      xmin, xmax, ymin, ymax, x0, x1, y0, y1,
      X: function (v) { return x0 + ((v - xmin) / (xmax - xmin)) * (x1 - x0); },
      Y: function (v) { return y1 - ((v - ymin) / (ymax - ymin)) * (y1 - y0); }
    };
  }

  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    const s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
    return s * mag;
  }

  /* Loose tick list inside [min, max]. */
  function ticks(min, max, count) {
    const step = niceStep((max - min) / Math.max(1, count));
    const start = Math.ceil(min / step - 1e-12) * step;
    const out = [];
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    for (let v = start; v <= max + step * 1e-9 && out.length < 200; v += step) {
      out.push(Number(v.toFixed(Math.min(10, decimals + 2))));
    }
    return out;
  }

  function defaultFmt(v) {
    if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (Math.abs(v) >= 1) return String(Number(v.toFixed(1)));
    return String(Number(v.toFixed(2)));
  }

  function axes(ctx, S, opts) {
    opts = opts || {};
    const xt = opts.xTicks || ticks(S.xmin, S.xmax, 6);
    const yt = opts.yTicks || ticks(S.ymin, S.ymax, 5);
    const xFmt = opts.xFmt || defaultFmt;
    const yFmt = opts.yFmt || defaultFmt;
    ctx.save();
    ctx.font = '11px Georgia, serif';
    ctx.lineWidth = 1;

    // grid + tick labels for y
    for (const v of yt) {
      const y = S.Y(v);
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath(); ctx.moveTo(S.x0, y); ctx.lineTo(S.x1, y); ctx.stroke();
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(yFmt(v), S.x0 - 6, y);
    }
    for (const v of xt) {
      const x = S.X(v);
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath(); ctx.moveTo(x, S.y0); ctx.lineTo(x, S.y1); ctx.stroke();
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(xFmt(v), x, S.y1 + 5);
    }
    // spines
    ctx.strokeStyle = COLORS.axis;
    ctx.beginPath(); ctx.moveTo(S.x0, S.y0); ctx.lineTo(S.x0, S.y1); ctx.lineTo(S.x1, S.y1); ctx.stroke();
    ctx.restore();
  }

  function bars(ctx, S, xs, ys, opts) {
    opts = opts || {};
    const color = opts.color || COLORS.violet;
    const alpha = opts.alpha == null ? 0.7 : opts.alpha;
    let bw;
    if (opts.widthPx != null) bw = opts.widthPx;
    else {
      let minGap = Infinity;
      for (let i = 1; i < xs.length; i++) {
        minGap = Math.min(minGap, Math.abs(xs[i] - xs[i - 1]));
      }
      const gap = minGap === Infinity ? 1 : minGap;
      bw = Math.max(1, Math.abs(S.X(S.xmin + gap) - S.X(S.xmin)) * 0.82);
    }
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const base = S.Y(Math.max(S.ymin, 0));
    for (let i = 0; i < xs.length; i++) {
      const yv = ys[i];
      if (yv <= 0) continue;
      const x = S.X(xs[i]);
      const top = S.Y(yv);
      ctx.fillRect(x - bw / 2, top, bw, Math.max(1, base - top));
    }
    ctx.restore();
  }

  function line(ctx, S, xs, ys, opts) {
    opts = opts || {};
    ctx.save();
    ctx.strokeStyle = opts.color || COLORS.gold;
    ctx.lineWidth = opts.width || 2;
    ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    if (opts.dash) ctx.setLineDash(opts.dash);
    ctx.beginPath();
    for (let i = 0; i < xs.length; i++) {
      const x = S.X(xs[i]), y = S.Y(ys[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function points(ctx, S, xs, ys, opts) {
    opts = opts || {};
    ctx.save();
    ctx.fillStyle = opts.color || COLORS.goldBright;
    ctx.globalAlpha = opts.alpha == null ? 0.8 : opts.alpha;
    const r = opts.r || 2;
    for (let i = 0; i < xs.length; i++) {
      ctx.beginPath();
      ctx.arc(S.X(xs[i]), S.Y(ys[i]), r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function legend(ctx, items, x, y) {
    ctx.save();
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let cx = x;
    for (const item of items) {
      ctx.fillStyle = item.color;
      ctx.fillRect(cx, y - 4, 9, 9);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(item.label, cx + 13, y);
      cx += 13 + ctx.measureText(item.label).width + 12;
    }
    ctx.restore();
  }

  return { COLORS, frame, scale, ticks, axes, bars, line, points, legend };
})();
