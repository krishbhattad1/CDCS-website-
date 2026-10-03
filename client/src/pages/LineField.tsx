import { useEffect, useRef } from "react";

/**
 * Full-page background: every page section is its own colored block,
 * cycling through the themes below (blue, yellow, mint, ...). Blocks meet
 * at clean edges (SEAM can soften them). Each block has its own washes,
 * cursor glow and its own network of dots and lines; dots and lines never
 * cross into the next block. Dots near the cursor swell and light up, and
 * the network fades down around headings, intro text and footer text. The
 * footer block is extra quiet so it stays readable. Fixed behind the page,
 * never blocks clicks, pauses when hidden.
 */

// section ids, top to bottom (blocks cycle through THEMES in this order)
const BLOCK_IDS = [
  "product",
  "what-is-cdcs",
  "features",
  "architecture",
  "performance",
  "dashboard",
  "docs",
  "footer",
];

// how busy each block is (1 = normal, lower = calmer); blocks not listed use 1
const QUIET: Record<string, number> = { footer: 0.35 };

// color themes (blocks cycle through these)
const THEMES = [
  {
    // blue
    base: "226, 235, 250",
    washes: [
      { fx: 0.15, fy: 0.25, r: 0.5, rgb: "0, 170, 255", a: 0.3, ax: 0.06, ay: 0.1, sx: 0.00014, sy: 0.00011, ph: 0 }, // sky blue
      { fx: 0.85, fy: 0.4, r: 0.45, rgb: "120, 90, 240", a: 0.24, ax: 0.05, ay: 0.12, sx: 0.00012, sy: 0.00016, ph: 2 }, // violet
      { fx: 0.5, fy: 0.85, r: 0.5, rgb: "0, 87, 255", a: 0.22, ax: 0.07, ay: 0.08, sx: 0.00016, sy: 0.00012, ph: 4 }, // signal blue
    ],
    glowRgb: "0, 87, 255",
    glowAlpha: 0.16,
    dotColors: ["0, 87, 255", "0, 160, 255", "100, 80, 235"],
    dotAlpha: 0.85,
    lineAlpha: 0.38,
  },
  {
    // yellow
    base: "255, 240, 183",
    washes: [
      { fx: 0.18, fy: 0.3, r: 0.5, rgb: "255, 165, 40", a: 0.42, ax: 0.06, ay: 0.12, sx: 0.00014, sy: 0.00012, ph: 1 }, // amber
      { fx: 0.82, fy: 0.7, r: 0.45, rgb: "255, 115, 90", a: 0.28, ax: 0.05, ay: 0.14, sx: 0.00012, sy: 0.00015, ph: 3 }, // coral
      { fx: 0.5, fy: 0.5, r: 0.42, rgb: "255, 205, 90", a: 0.5, ax: 0.08, ay: 0.1, sx: 0.00016, sy: 0.00011, ph: 5 }, // gold
    ],
    glowRgb: "255, 150, 20",
    glowAlpha: 0.32,
    dotColors: ["120, 72, 20", "205, 100, 10", "190, 60, 50"],
    dotAlpha: 0.78,
    lineAlpha: 0.44,
  },
  {
    // mint
    base: "216, 244, 232",
    washes: [
      { fx: 0.2, fy: 0.3, r: 0.5, rgb: "0, 200, 170", a: 0.3, ax: 0.06, ay: 0.1, sx: 0.00013, sy: 0.00012, ph: 2 }, // teal
      { fx: 0.8, fy: 0.6, r: 0.45, rgb: "90, 210, 140", a: 0.28, ax: 0.05, ay: 0.12, sx: 0.00012, sy: 0.00015, ph: 4 }, // green
      { fx: 0.5, fy: 0.9, r: 0.45, rgb: "0, 170, 255", a: 0.2, ax: 0.07, ay: 0.08, sx: 0.00015, sy: 0.00011, ph: 1 }, // sky
    ],
    glowRgb: "0, 170, 140",
    glowAlpha: 0.18,
    dotColors: ["0, 140, 120", "30, 150, 90", "0, 110, 200"],
    dotAlpha: 0.85,
    lineAlpha: 0.4,
  },
];

// seams
const SEAM = 0; // px of soft blend between blocks (0 = clean edge)

// washes + cursor glow
const WASH_ALPHA = 1; // overall strength of the washes (0 = off)
const CURSOR_GLOW_R = 380; // px
const CURSOR_GLOW_EASE = 0.06; // lower = lazier

// network (per block)
const DOT_R = 2.1; // dot radius
const DENSITY = 8500; // block px² per dot (higher = fewer dots)
const MAX_DOTS = 180; // per block
const LINK_DIST = 230; // dots closer than this get a line (px)
const SPEED = 0.012; // drift speed in px per ms (0 = still)

// dots near the cursor
const DOT_NEAR = 140; // radius where dots swell and light up (px)
const DOT_GROW = 3.4; // extra radius at the cursor
const DOT_LIGHT = 0.55; // extra opacity at the cursor

// cursor
const PARALLAX = 60; // px the network shifts with the cursor (negative = opposite way)
const PARALLAX_EASE = 0.05; // lower = floatier
const CURSOR_LINK = 250; // cursor draws lines to dots within this distance (0 = off)

// calm behind text
const TEXT_SELECTOR =
  "h1, h2, h3, .intro-lede, .section-subtext, .docs-preview, .metric-context, .footer-tagline, .footer-heading, .footer-link-grid a, .footer-link-stack a, .footer-bottom p, .version-tag";
const TEXT_DIM = 0.3; // network strength right behind text (1 = no dimming)
const TEXT_PAD = 40; // px around text where it fades back up
const TEXT_REFRESH = 1000; // ms between re-measuring text positions

type Dot = {
  fx: number; // position inside the padded block (0..1)
  fy: number;
  vx: number; // drift in px per ms
  vy: number;
  depth: number; // how far this dot shifts with the cursor
  c: number; // color index
};

type Rect = { l: number; t: number; r: number; b: number };

export default function LineField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!lctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let lastNow = 0;
    let cgReady = false;
    let textRects: Rect[] = []; // in page coordinates
    const pad = Math.abs(PARALLAX) * 1.6 + 40; // extra field so edges never show gaps
    const blocks: Dot[][] = BLOCK_IDS.map(() => []);
    const mouse = { x: -9999, y: -9999, inside: false };
    const off = { x: 0, y: 0 }; // smoothed cursor offset (-1..1)
    const cg = { x: 0, y: 0 }; // cursor glow position

    const newDot = (): Dot => {
      const a = Math.random() * Math.PI * 2;
      const s = SPEED * (0.4 + Math.random() * 0.9);
      return {
        fx: Math.random(),
        fy: Math.random(),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        depth: 0.4 + Math.random() * 1.0,
        c: Math.floor(Math.random() * 3),
      };
    };

    const refreshText = () => {
      const sy = window.scrollY;
      textRects = Array.from(document.querySelectorAll(TEXT_SELECTOR))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { l: r.left, t: r.top + sy, r: r.right, b: r.bottom + sy };
        })
        .filter((r) => r.r - r.l > 0 && r.b - r.t > 0);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layer.width = canvas.width;
      layer.height = canvas.height;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cgReady = false;
      refreshText();
      draw(performance.now());
    };

    const glow = (c: CanvasRenderingContext2D, x: number, y: number, R: number, rgb: string, a: number) => {
      if (a <= 0) return;
      const g = c.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(${rgb}, ${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      c.fillStyle = g;
      c.fillRect(x - R, y - R, R * 2, R * 2);
    };

    const draw = (now: number) => {
      const dt = Math.min(now - (lastNow || now), 50);
      lastNow = now;

      // base fill so no gap ever shows between blocks
      ctx.fillStyle = `rgb(${THEMES[0].base})`;
      ctx.fillRect(0, 0, w, h);

      // smooth the cursor offset (network drifts back to center when the cursor leaves)
      const tox = mouse.inside ? (mouse.x - w / 2) / (w / 2) : 0;
      const toy = mouse.inside ? (mouse.y - h / 2) / (h / 2) : 0;
      off.x += (tox - off.x) * PARALLAX_EASE;
      off.y += (toy - off.y) * PARALLAX_EASE;

      // cursor glow position (follows the cursor, or drifts on its own when it's away)
      const gx = mouse.inside ? mouse.x : w * (0.5 + 0.28 * Math.sin(now * 0.00031));
      const gy = mouse.inside ? mouse.y : h * (0.45 + 0.22 * Math.cos(now * 0.00023));
      if (!cgReady) {
        cg.x = gx;
        cg.y = gy;
        cgReady = true;
      }
      cg.x += (gx - cg.x) * CURSOR_GLOW_EASE;
      cg.y += (gy - cg.y) * CURSOR_GLOW_EASE;

      // text positions in the viewport right now
      const scy = window.scrollY;
      const vis: Rect[] = [];
      for (const r of textRects) {
        const t = r.t - scy;
        const b = r.b - scy;
        if (b < -TEXT_PAD || t > h + TEXT_PAD) continue;
        vis.push({ l: r.l, r: r.r, t, b });
      }
      // 1 = full strength, TEXT_DIM = right behind text
      const calmAt = (x: number, y: number) => {
        let k = 1;
        for (const r of vis) {
          const dx = Math.max(r.l - x, 0, x - r.r);
          const dy = Math.max(r.t - y, 0, y - r.b);
          const d = Math.hypot(dx, dy);
          if (d < TEXT_PAD) {
            const f = TEXT_DIM + (1 - TEXT_DIM) * (d / TEXT_PAD);
            if (f < k) k = f;
          }
        }
        return k;
      };

      const FW = w + pad * 2;
      const L2 = LINK_DIST * LINK_DIST;

      for (let bi = 0; bi < BLOCK_IDS.length; bi++) {
        const el = document.getElementById(BLOCK_IDS[bi]);
        if (!el) continue;
        const rc = el.getBoundingClientRect();
        const top = rc.top;
        const bot = rc.bottom;
        const H = bot - top;
        if (H <= 0 || bot <= 0 || top >= h) continue;

        const theme = THEMES[bi % THEMES.length];
        const dots = blocks[bi];
        const q = QUIET[BLOCK_IDS[bi]] ?? 1; // 1 = normal, lower = calmer
        const dotA = theme.dotAlpha * (0.5 + 0.5 * q);

        // keep the dot count matched to the block's size
        const target = Math.min(MAX_DOTS, Math.round(((w * H) / DENSITY) * q));
        while (dots.length < target) dots.push(newDot());
        while (dots.length > target) dots.pop();

        // 1) block color, washes, cursor glow (drawn on a layer so the top edge can fade)
        const lt = bi === 0 ? top : top - SEAM / 2;
        lctx.clearRect(0, 0, w, h);
        lctx.save();
        lctx.beginPath();
        lctx.rect(0, lt, w, bot - lt);
        lctx.clip();
        lctx.fillStyle = `rgb(${theme.base})`;
        lctx.fillRect(0, lt, w, bot - lt);
        if (WASH_ALPHA > 0) {
          const big = Math.max(w, H);
          for (const s of theme.washes) {
            const x = (s.fx + Math.sin(now * s.sx + s.ph) * s.ax) * w;
            const y = top + (s.fy + Math.cos(now * s.sy + s.ph) * s.ay) * H;
            glow(lctx, x, y, big * s.r, s.rgb, s.a * WASH_ALPHA * (0.5 + 0.5 * q));
          }
        }
        glow(lctx, cg.x, cg.y, CURSOR_GLOW_R, theme.glowRgb, theme.glowAlpha);
        lctx.restore();
        if (bi > 0 && SEAM > 0) {
          lctx.save();
          lctx.globalCompositeOperation = "destination-in";
          const mg = lctx.createLinearGradient(0, top - SEAM / 2, 0, top + SEAM / 2);
          mg.addColorStop(0, "rgba(0,0,0,0)");
          mg.addColorStop(1, "rgba(0,0,0,1)");
          lctx.fillStyle = mg;
          lctx.fillRect(0, 0, w, h);
          lctx.restore();
        }
        ctx.drawImage(layer, 0, 0, w, h);

        // 2) the network, kept inside this block's rectangle
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, top, w, H);
        ctx.clip();

        // drift + screen positions
        const FH = H + pad * 2;
        const cursorIn = mouse.inside && mouse.y >= top && mouse.y <= bot;
        const sx: number[] = new Array(dots.length);
        const sy: number[] = new Array(dots.length);
        const calm: number[] = new Array(dots.length);
        const nearF: number[] = new Array(dots.length);
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          if (!reduced) {
            d.fx = (((d.fx + (d.vx * dt) / FW) % 1) + 1) % 1;
            d.fy = (((d.fy + (d.vy * dt) / FH) % 1) + 1) % 1;
          }
          sx[i] = d.fx * FW - pad + off.x * PARALLAX * d.depth;
          sy[i] = top + d.fy * FH - pad + off.y * PARALLAX * d.depth;
          calm[i] = vis.length ? calmAt(sx[i], sy[i]) : 1;
          nearF[i] = 0;
          if (cursorIn) {
            const dd = Math.hypot(sx[i] - mouse.x, sy[i] - mouse.y);
            if (dd < DOT_NEAR) nearF[i] = (1 - dd / DOT_NEAR) ** 2;
          }
        }

        // lines between nearby dots (same block only)
        ctx.lineWidth = 1;
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = sx[i] - sx[j];
            const dy = sy[i] - sy[j];
            const d2 = dx * dx + dy * dy;
            if (d2 >= L2) continue;
            const k = 1 - Math.sqrt(d2) / LINK_DIST;
            const cm = vis.length ? calmAt((sx[i] + sx[j]) / 2, (sy[i] + sy[j]) / 2) : 1;
            const a = theme.lineAlpha * q * k * cm;
            if (a < 0.01) continue;
            ctx.strokeStyle = `rgba(${theme.dotColors[dots[i].c]}, ${a.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(sx[i], sy[i]);
            ctx.lineTo(sx[j], sy[j]);
            ctx.stroke();
          }
        }

        // lines from the cursor to dots, only in the block the cursor is over
        if (cursorIn && CURSOR_LINK > 0) {
          for (let i = 0; i < dots.length; i++) {
            const d = Math.hypot(sx[i] - mouse.x, sy[i] - mouse.y);
            if (d >= CURSOR_LINK) continue;
            const k = 1 - d / CURSOR_LINK;
            ctx.strokeStyle = `rgba(${theme.dotColors[dots[i].c]}, ${((theme.lineAlpha * q + 0.25) * k).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(sx[i], sy[i]);
            ctx.stroke();
          }
        }

        // dots (dimmed behind text)
        for (let c = 0; c < 3; c++) {
          const normal = new Path2D();
          const dim = new Path2D();
          for (let i = 0; i < dots.length; i++) {
            if (dots[i].c !== c || nearF[i] > 0.02) continue;
            const p = calm[i] < 0.85 ? dim : normal;
            p.moveTo(sx[i] + DOT_R, sy[i]);
            p.arc(sx[i], sy[i], DOT_R, 0, Math.PI * 2);
          }
          ctx.fillStyle = `rgba(${theme.dotColors[c]}, ${dotA.toFixed(3)})`;
          ctx.fill(normal);
          ctx.fillStyle = `rgba(${theme.dotColors[c]}, ${(dotA * 0.45).toFixed(3)})`;
          ctx.fill(dim);
        }

        // dots near the cursor swell and light up
        for (let i = 0; i < dots.length; i++) {
          const f = nearF[i];
          if (f <= 0.02) continue;
          const rgb = theme.dotColors[dots[i].c];
          const r = DOT_R + f * DOT_GROW;
          ctx.fillStyle = `rgba(${rgb}, ${(0.14 * f).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], r * 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, dotA + f * DOT_LIGHT).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || document.hidden || reduced) return;
      running = true;
      lastNow = 0;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.inside = true;
    };

    const onLeave = () => {
      mouse.inside = false;
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      } else {
        start();
      }
    };

    const textTimer = window.setInterval(refreshText, TEXT_REFRESH);
    window.addEventListener("resize", resize);
    window.addEventListener("load", refreshText);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(textTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("load", refreshText);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}