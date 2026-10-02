```js
/* The Entropy Gate — shell: hero particles ("scatter, then settle"),
   scrollspy, smooth scrolling, and the localStorage progress meter.
   Hero RAF honors prefers-reduced-motion by settling instantly. */
'use strict';
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SECTIONS = document.querySelectorAll('.chapter');
  const LINKS = document.querySelectorAll('.nav-link');
  const STORE_KEY = 'entropy-gate-progress';

  // ---------------- Smooth scroll ----------------
  LINKS.forEach(function (a) {
    a.addEventListener('click', function (e) {
      const href = a.getAttribute('href');
      if (!href || href[0] !== '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });
  const cta = document.querySelector('.hero-cta');
  if (cta) {
    cta.addEventListener('click', function (e) {
      const target = document.querySelector(cta.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
      }
    });
  }

  // ---------------- Scrollspy ----------------
  function onScrollSpy() {
    const mid = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    SECTIONS.forEach(function (sec) {
      if (sec.offsetTop <= mid) current = sec.id;
    });
    LINKS.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-section') === current);
    });
  }
  let spyTick = false;
  window.addEventListener('scroll', function () {
    if (!spyTick) {
      spyTick = true;
      requestAnimationFrame(function () { onScrollSpy(); spyTick = false; });
    }
  }, { passive: true });
  onScrollSpy();

  // ---------------- Progress tracker ----------------
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) { return new Set(); }
  }
  function saveProgress(set) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Array.from(set))); } catch (e) { /* private mode — harmless */ }
  }
  const progress = loadProgress();

  function paintProgress() {
    const meter = $('meter'), railMeter = $('rail-meter');
    if (meter) meter.textContent = progress.size + '/5';
    if (railMeter) railMeter.textContent = String(progress.size);
    const runes = $('meter-runes');
    if (runes) {
      const order = ['ch-foundations', 'ch-distributions', 'ch-theorems', 'ch-gambler', 'ch-advanced'];
      const chars = Array.from(runes.textContent.replace(/\s/g, ''));
      runes.innerHTML = '';
      order.forEach(function (id, i) {
        const sec = document.getElementById(id);
        const rune = sec ? sec.getAttribute('data-rune') : (chars[i] || '·');
        const lit = progress.has(id);
        const span = document.createElement('span');
        span.className = lit ? 'lit' : '';
        span.textContent = rune;
        runes.appendChild(span);
      });
    }
    LINKS.forEach(function (l) {
      l.classList.toggle('measured', progress.has(l.getAttribute('data-section')));
    });
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !progress.has(entry.target.id)) {
          progress.add(entry.target.id);
          saveProgress(progress);
          paintProgress();
        }
      });
    }, { threshold: 0.25 });
    SECTIONS.forEach(function (sec) { obs.observe(sec); });
  }
  paintProgress();

  // ---------------- Hero particles: scatter, then settle ----------------
  const canvas = $('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const N = 200, COLS = 48;
    let W = 0, H = 0, parts = [], targets = null, phase = 'scatter', raf = null, t0 = 0;
    const SETTLE_AT = 5.5; // seconds

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const parent = canvas.parentElement;
      W = parent ? parent.clientWidth : 800;
      H = parent ? parent.clientHeight : 420;
      if (W < 40) W = 800;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function normalSample() { // Box–Muller
      let u = 0; while (u <= 0) u = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
    }

    function buildTargets() {
      const spacing = Math.max(3, (H - 50) / (N / 6 + 8));
      const stack = new Array(COLS).fill(0);
      targets = [];
      for (let i = 0; i < parts.length; i++) {
        let col = Math.floor((normalSample() * 0.16 + 0.5) * COLS);
        col = Math.max(0, Math.min(COLS - 1, col));
        // overflow -> nearest non-full column (bell tails are rare)
        while (stack[col] * spacing > H - 60) col = (col + 1) % COLS;
        stack[col]++;
        targets.push({
          x: ((col + 0.5) / COLS) * W,
          y: H - 14 - stack[col] * spacing
        });
      }
      phase = 'settle';
    }

    function spawn() {
      parts = [];
      for (let i = 0; i < N; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4,
          violet: Math.random() < 0.22
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const settled = phase === 'settle';
        ctx.fillStyle = p.violet ? 'rgba(124,92,255,0.9)' : 'rgba(232,196,100,0.9)';
        const r = settled ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (phase === 'settle') {
        ctx.fillStyle = 'rgba(169,162,140,0.65)';
        ctx.font = '11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('the expected shape of chance — N(μ, σ²)', W / 2, 20);
      }
    }

    function tick(now) {
      const t = (now - t0) / 1000;
      if (phase === 'scatter' && t > SETTLE_AT) buildTargets();
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (phase === 'scatter') {
          p.vx += (Math.random() - 0.5) * 0.3;
          p.vy += (Math.random() - 0.5) * 0.3;
          p.vx = Math.max(-1.8, Math.min(1.8, p.vx));
          p.vy = Math.max(-1.8, Math.min(1.8, p.vy));
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
          if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
        } else {
          const tgt = targets[i];
          p.x += (tgt.x - p.x) * 0.08;
          p.y += (tgt.y - p.y) * 0.08;
          p.x += (Math.random() - 0.5) * 0.35; // equilibrium jitter
          p.y += (Math.random() - 0.5) * 0.35;
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    resize();
    spawn();
    if (REDUCED) {
      buildTargets();
      for (let i = 0; i < parts.length; i++) { parts[i].x = targets[i].x; parts[i].y = targets[i].y; }
      draw();
    } else {
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener('resize', function () {
      resize();
      if (REDUCED) draw();
    });
  }
})();
```