/* doodle.js — the hand-drawn maps and the day scenes. A pen that wobbles, ink gone over
   twice, watercolour past its line, lettering by hand. Ground from map.json; places and
   words from window.UI (tools/copy_text.py, tools/copy_more.py). */
(function () {
  "use strict";
  var U = window.UI || {}, TAU = Math.PI * 2, DPR = Math.min(2, window.devicePixelRatio || 1);
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TH = U.lang === "th", $ = function (id) { return document.getElementById(id); };
  var INK = "#2b1a10", RED = "#c8102e", YEL = "#ffd21f", HAND = '"Sriracha","Noto Sans Thai",cursive';
  var M = null, waiting = [];
  function ground(fn) { if (M) fn(); else waiting.push(fn); }
  (function load() {
    var el = document.querySelector("[data-map]"); if (!el) return;
    var x = new XMLHttpRequest(); x.open("GET", el.dataset.map);
    x.onload = function () { try { M = JSON.parse(x.responseText); } catch (e) { M = {}; } waiting.forEach(function (f) { f(); }); waiting = []; };
    x.send();
  })();

  function fit(cv, h) {
    var w = cv.clientWidth || 600; if (typeof h === "function") h = h(w);
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); cv.style.height = h + "px";
    var c = cv.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0); return { c: c, w: w, h: h };
  }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function onVisible(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, { rootMargin: "100px" }).observe(el);
  }
  function loop(el, draw) {
    var on = false, raf = 0;
    function tick(t) { draw(t / 1000); if (on && !reduce) raf = requestAnimationFrame(tick); }
    onVisible(el, function (v) { on = v; cancelAnimationFrame(raf); if (v) raf = requestAnimationFrame(tick); });
    return function () { if (!on || reduce) draw(performance.now() / 1000); };
  }

  /* ---------------- the pen ---------------- */
  function wob(pts, seed, amp, step) {           // a hand's wobble along a polyline (px points)
    var R = rnd(seed), out = [], a = amp == null ? 1.2 : amp, st = step || 9;
    for (var i = 0; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, n = Math.max(1, Math.round(L / st));
      for (var k = 0; k < n; k++) { var u = k / n, j = (R() - 0.5) * a; out.push([p[0] + dx * u - dy / L * j, p[1] + dy * u + dx / L * j]); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function path(c, pts, close) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); if (close) c.closePath(); }
  function ink(c, pts, o) {                       // ink twice, the second pass lighter and off by a hair
    o = o || {}; var seed = o.seed || 7, w = o.w || 1.6, col = o.col || INK;
    c.save(); c.lineCap = c.lineJoin = "round"; c.strokeStyle = col;
    c.globalAlpha = o.a == null ? 0.9 : o.a; c.lineWidth = w; path(c, wob(pts, seed, o.amp), o.close); c.stroke();
    c.globalAlpha *= 0.4; c.lineWidth = w * 0.7; path(c, wob(pts, seed + 31, o.amp == null ? 1.6 : o.amp * 1.3), o.close); c.stroke();
    c.restore();
  }
  function wash(c, pts, col, a, seed) {           // watercolour that runs past its line
    c.save(); c.fillStyle = col; c.globalAlpha = a == null ? 0.42 : a;
    path(c, wob(pts, seed || 3, 2.4, 14), true); c.fill();
    c.globalAlpha *= 0.45; c.translate(1.5, 1); path(c, wob(pts, (seed || 3) + 9, 3, 14), true); c.fill();
    c.restore();
  }
  function shape(c, pts, col, seed, w) { wash(c, pts, col, 0.5, seed); ink(c, pts, { seed: seed, close: true, w: w || 1.4 }); }
  function circle(cx, cy, r, n) { var p = []; n = n || 18; for (var i = 0; i < n; i++) { var a = i / n * TAU; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
  function hand(c, s, x, y, size, col, al, bg) {
    c.save(); c.font = (size || 14) + "px " + HAND; c.textAlign = al || "center"; c.textBaseline = "middle";
    if (bg) { c.lineWidth = 4; c.strokeStyle = bg; c.lineJoin = "round"; c.strokeText(s, x, y); }
    c.fillStyle = col || INK; c.fillText(s, x, y); c.restore();
  }
  function paper(c, w, h, seed) {
    c.fillStyle = "#fbf2d9"; c.fillRect(0, 0, w, h);
    var R = rnd(seed || 5); c.fillStyle = "rgba(120,90,40,.06)";
    for (var i = 0; i < w * h / 900; i++) c.fillRect(R() * w, R() * h, 1 + R() * 2, 1);
    var g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(120,80,20,.12)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  }

  /* ---------------- the landmarks, drawn at (x, y) = the foot, s = height ---------------- */
  var ICON = {
    chedi: function (c, x, y, s, sd) {
      var b = s * 0.32;
      shape(c, [[x - b, y], [x + b, y], [x + b * 0.8, y - s * 0.14], [x - b * 0.8, y - s * 0.14]], "#e2b54a", sd);
      shape(c, [[x - b * 0.75, y - s * 0.14], [x - b * 0.6, y - s * 0.42], [x, y - s * 0.56], [x + b * 0.6, y - s * 0.42], [x + b * 0.75, y - s * 0.14]], "#f0c64e", sd + 1);
      ink(c, [[x, y - s * 0.56], [x, y - s]], { seed: sd + 2, w: 1.6 });
      for (var i = 1; i < 4; i++) ink(c, [[x - 3 + i, y - s * (0.6 + i * 0.09)], [x + 3 - i, y - s * (0.6 + i * 0.09)]], { seed: sd + i, w: 1 });
    },
    mountain: function (c, x, y, s, sd) {
      shape(c, [[x - s * 1.1, y], [x - s * 0.4, y - s * 0.62], [x - s * 0.1, y - s * 0.5], [x + s * 0.25, y - s * 0.78], [x + s * 1.1, y]], "#7fae5b", sd);
      for (var i = 0; i < 5; i++) ink(c, [[x - s * 0.6 + i * s * 0.28, y - s * 0.08], [x - s * 0.55 + i * s * 0.28, y - s * 0.2]], { seed: sd + i, w: 1, a: 0.5 });
      ICON.chedi(c, x + s * 0.25, y - s * 0.76, s * 0.42, sd + 7);
    },
    peak: function (c, x, y, s, sd) {
      shape(c, [[x - s, y], [x - s * 0.2, y - s * 0.9], [x + s * 0.1, y - s * 0.7], [x + s * 0.4, y - s], [x + s, y]], "#6f9e52", sd);
      wash(c, [[x + s * 0.28, y - s * 0.86], [x + s * 0.4, y - s], [x + s * 0.52, y - s * 0.86]], "#ffffff", 0.8, sd + 2);
    },
    gate: function (c, x, y, s, sd) {
      var w = s * 1.3, top = y - s * 0.62;
      shape(c, [[x - w / 2, y], [x - w / 2, top], [x + w / 2, top], [x + w / 2, y]], "#b5523a", sd);
      for (var i = 0; i < 5; i++) ink(c, [[x - w / 2 + i * w / 4.6, top], [x - w / 2 + i * w / 4.6, top - s * 0.14], [x - w / 2 + i * w / 4.6 + w / 10, top - s * 0.14], [x - w / 2 + i * w / 4.6 + w / 10, top]], { seed: sd + i, w: 1.2 });
      shape(c, [[x - s * 0.16, y], [x - s * 0.16, y - s * 0.3], [x, y - s * 0.4], [x + s * 0.16, y - s * 0.3], [x + s * 0.16, y]], "#5a2a18", sd + 9);
    },
    market: function (c, x, y, s, sd) {
      var w = s * 1.4;
      shape(c, [[x - w / 2, y], [x - w / 2, y - s * 0.45], [x + w / 2, y - s * 0.45], [x + w / 2, y]], "#e8d7b0", sd);
      shape(c, [[x - w / 2 - 4, y - s * 0.45], [x, y - s * 0.9], [x + w / 2 + 4, y - s * 0.45]], "#c8452f", sd + 1);
      for (var i = 0; i < 6; i++) wash(c, [[x - w / 2 + i * w / 6, y - s * 0.45], [x - w / 2 + (i + 0.5) * w / 6, y - s * 0.45], [x - w / 2 + (i + 0.5) * w / 6, y - s * 0.32], [x - w / 2 + i * w / 6, y - s * 0.32]], i % 2 ? YEL : "#ffffff", 0.8, sd + i);
    },
    bridge: function (c, x, y, s, sd) {
      var w = s * 1.6;
      ink(c, [[x - w / 2, y], [x - w / 4, y - s * 0.35], [x + w / 4, y - s * 0.35], [x + w / 2, y]], { seed: sd, w: 2.2, col: "#4a5a66" });
      for (var i = 0; i < 7; i++) { var u = -w / 2 + w * (i + 0.5) / 7, yy = y - s * 0.35 * Math.min(1, (w / 2 - Math.abs(u)) / (w / 4)); ink(c, [[x + u, yy], [x + u, yy - s * 0.25]], { seed: sd + i, w: 1, col: "#4a5a66" }); }
      ink(c, [[x - w / 2, y - s * 0.25], [x - w / 4, y - s * 0.6], [x + w / 4, y - s * 0.6], [x + w / 2, y - s * 0.25]], { seed: sd + 9, w: 1.2, col: "#4a5a66" });
    },
    figures: function (c, x, y, s, sd, n) {           // a monument: n figures on a plinth
      n = n || 1; var w = s * (0.5 + n * 0.3);
      shape(c, [[x - w / 2, y], [x - w / 2, y - s * 0.3], [x + w / 2, y - s * 0.3], [x + w / 2, y]], "#cfc3a8", sd);
      for (var i = 0; i < n; i++) {
        var fx = x - (n - 1) * s * 0.18 + i * s * 0.36;
        shape(c, [[fx - s * 0.12, y - s * 0.3], [fx - s * 0.1, y - s * 0.78], [fx + s * 0.1, y - s * 0.78], [fx + s * 0.12, y - s * 0.3]], "#3e4a3a", sd + i);
        shape(c, circle(fx, y - s * 0.87, s * 0.09, 10), "#3e4a3a", sd + i + 5);
      }
    },
    clock: function (c, x, y, s, sd) {
      shape(c, [[x - s * 0.22, y], [x - s * 0.16, y - s * 0.62], [x + s * 0.16, y - s * 0.62], [x + s * 0.22, y]], "#e2b54a", sd);
      shape(c, [[x - s * 0.2, y - s * 0.62], [x, y - s * 0.98], [x + s * 0.2, y - s * 0.62]], "#f2cf5c", sd + 1);
      shape(c, circle(x, y - s * 0.44, s * 0.1, 12), "#ffffff", sd + 2);
      ink(c, [[x, y - s * 0.44], [x, y - s * 0.5]], { seed: sd + 3, w: 1 }); ink(c, [[x, y - s * 0.44], [x + s * 0.05, y - s * 0.44]], { seed: sd + 4, w: 1 });
    },
    white: function (c, x, y, s, sd) {
      var w = s * 1.2;
      shape(c, [[x - w / 2, y], [x - w / 2, y - s * 0.35], [x + w / 2, y - s * 0.35], [x + w / 2, y]], "#ffffff", sd);
      shape(c, [[x - w / 2 - 3, y - s * 0.35], [x - w / 4, y - s * 0.7], [x, y - s * 0.6], [x + w / 4, y - s * 0.9], [x + w / 2 + 3, y - s * 0.35]], "#eef3f7", sd + 1);
      for (var i = 0; i < 4; i++) ink(c, [[x - w / 2 + i * w / 3, y - s * 0.35], [x - w / 2 + i * w / 3 + 2, y - s * (0.5 + 0.12 * (i % 2))]], { seed: sd + i, w: 1, col: "#7a8fa0" });
    },
    arch: function (c, x, y, s, sd) {
      var w = s * 1.3;
      shape(c, [[x - w / 2, y], [x - w / 2, y - s * 0.6], [x - w / 2 + s * 0.16, y - s * 0.6], [x - w / 2 + s * 0.16, y]], "#c8102e", sd);
      shape(c, [[x + w / 2, y], [x + w / 2, y - s * 0.6], [x + w / 2 - s * 0.16, y - s * 0.6], [x + w / 2 - s * 0.16, y]], "#c8102e", sd + 1);
      shape(c, [[x - w / 2 - 8, y - s * 0.6], [x - w / 2 - 12, y - s * 0.74], [x, y - s * 0.86], [x + w / 2 + 12, y - s * 0.74], [x + w / 2 + 8, y - s * 0.6]], "#e7a21f", sd + 2);
      wash(c, [[x - s * 0.2, y - s * 0.56], [x + s * 0.2, y - s * 0.56], [x + s * 0.2, y - s * 0.44], [x - s * 0.2, y - s * 0.44]], YEL, 0.9, sd + 3);
    },
    shrine: function (c, x, y, s, sd) {
      var w = s * 1.1;
      shape(c, [[x - w / 2, y], [x - w / 2, y - s * 0.42], [x + w / 2, y - s * 0.42], [x + w / 2, y]], "#c8102e", sd);
      shape(c, [[x - w / 2 - s * 0.24, y - s * 0.38], [x - w / 2 - s * 0.1, y - s * 0.44], [x - w / 2 + 2, y - s * 0.66], [x + w / 2 - 2, y - s * 0.66], [x + w / 2 + s * 0.1, y - s * 0.44], [x + w / 2 + s * 0.24, y - s * 0.38]], "#2f8a63", sd + 1);
      shape(c, [[x - s * 0.14, y], [x - s * 0.14, y - s * 0.26], [x + s * 0.14, y - s * 0.26], [x + s * 0.14, y]], "#3a0a0a", sd + 2);
      ink(c, [[x + w / 2 + 6, y], [x + w / 2 + 6, y - s * 1.05]], { seed: sd + 3, w: 1.3 });
      shape(c, [[x + w / 2 + 6, y - s * 1.05], [x + w / 2 + 6 + s * 0.4, y - s * 1.0], [x + w / 2 + 6, y - s * 0.82]], YEL, sd + 4, 1);
    },
    karst: function (c, x, y, s, sd) {
      shape(c, [[x - s * 0.8, y], [x - s * 0.75, y - s * 0.7], [x - s * 0.5, y - s * 0.95], [x - s * 0.25, y - s * 0.7], [x - s * 0.2, y]], "#8e9a7a", sd);
      shape(c, [[x - s * 0.1, y], [x - s * 0.05, y - s * 0.5], [x + s * 0.2, y - s * 0.68], [x + s * 0.45, y - s * 0.5], [x + s * 0.5, y]], "#7f8e6c", sd + 1);
      wash(c, [[x - s * 0.7, y - s * 0.75], [x - s * 0.5, y - s * 0.97], [x - s * 0.3, y - s * 0.75]], "#4f8a3a", 0.6, sd + 2);
      ink(c, [[x - s, y + 3], [x - s * 0.6, y + 1], [x - s * 0.2, y + 4], [x + s * 0.3, y + 1], [x + s * 0.7, y + 3]], { seed: sd + 3, w: 1.2, col: "#2f6fa0" });
    },
    fire: function (c, x, y, s, sd, t) {
      t = t || 0;
      for (var i = 0; i < 5; i++) {
        var fx = x - s * 0.5 + i * s * 0.25, fh = s * (0.45 + 0.25 * Math.sin(t * 9 + i * 1.7));
        wash(c, [[fx - s * 0.12, y], [fx, y - fh], [fx + s * 0.12, y]], i % 2 ? "#ff8a1f" : "#ffcb2e", 0.85, sd + i);
      }
      ink(c, [[x - s * 0.7, y], [x + s * 0.7, y]], { seed: sd + 9, w: 1.4 });
    },
    lion: function (c, x, y, s, sd, t) {           // a lion-dance head: big eyes, a horn, a jaw that snaps
      t = t || 0; var b = Math.sin(t * 6) * s * 0.06, cx = x, cy = y - s * 0.62 + b, r = s * 0.36, jaw = Math.max(0, Math.sin(t * 5)) * s * 0.1;
      ink(c, [[x - s * 0.18, y - s * 0.3], [x - s * 0.2, y]], { seed: sd + 3, w: 2 }); ink(c, [[x + s * 0.18, y - s * 0.3], [x + s * 0.2, y]], { seed: sd + 4, w: 2 });
      shape(c, [[cx - r * 1.3, cy + r * 0.2], [cx - r * 1.6, cy + r * 1.1], [cx + r * 1.6, cy + r * 1.1], [cx + r * 1.3, cy + r * 0.2]], "#e7a21f", sd + 5);
      shape(c, [[cx - r * 0.8, cy + r * 0.55 + jaw], [cx + r * 0.8, cy + r * 0.55 + jaw], [cx + r * 0.6, cy + r * 0.95 + jaw], [cx - r * 0.6, cy + r * 0.95 + jaw]], "#c8102e", sd + 6);
      shape(c, circle(cx, cy, r, 20), "#e33b2e", sd);
      shape(c, [[cx - 4, cy - r * 0.9], [cx, cy - r * 1.5], [cx + 4, cy - r * 0.9]], YEL, sd + 7, 1.2);
      shape(c, circle(cx, cy - r * 0.45, r * 0.16, 10), "#dfe8ee", sd + 8, 1);
      [-1, 1].forEach(function (k) {
        shape(c, circle(cx + k * r * 0.42, cy - r * 0.05, r * 0.24, 12), "#ffffff", sd + 9 + k);
        c.fillStyle = INK; c.beginPath(); c.arc(cx + k * r * 0.42 + Math.sin(t * 2) * 2, cy - r * 0.02, r * 0.1, 0, TAU); c.fill();
        wash(c, [[cx + k * r * 0.15, cy - r * 0.4], [cx + k * r * 0.75, cy - r * 0.55], [cx + k * r * 0.7, cy - r * 0.3]], "#ffffff", 0.9, sd + 12 + k);
      });
      for (var i = 0; i < 7; i++) ink(c, [[cx - r * 0.6 + i * r * 0.2, cy + r * 0.45], [cx - r * 0.62 + i * r * 0.2, cy + r * 0.75]], { seed: sd + 20 + i, w: 1.4, col: "#ffffff", a: 0.9 });
    },
    triangle: function (c, x, y, s, sd) {
      shape(c, [[x - s * 0.4, y], [x, y - s * 0.7], [x + s * 0.4, y]], "#e6b53a", sd);
      ink(c, [[x - s * 1.1, y - s * 0.1], [x - s * 0.3, y + 2], [x + s * 0.5, y + 4], [x + s * 1.1, y - s * 0.2]], { seed: sd + 1, w: 2, col: "#2f6fa0" });
    }
  };

  /* ---------------- pins ---------------- */
  function pin(c, x, y, k, sd, big) {
    var s = big ? 1.35 : 1;
    if (k === "hall") {
      shape(c, [[x - 6 * s, y], [x - 6 * s, y - 7 * s], [x + 6 * s, y - 7 * s], [x + 6 * s, y]], RED, sd, 1.1);
      shape(c, [[x - 10 * s, y - 6 * s], [x - 7 * s, y - 9 * s], [x + 7 * s, y - 9 * s], [x + 10 * s, y - 6 * s]], "#2f8a63", sd + 1, 1.1);
    } else if (k === "kitchen") {
      shape(c, [[x - 8 * s, y - 7 * s], [x + 8 * s, y - 7 * s], [x + 5 * s, y], [x - 5 * s, y]], "#f2a531", sd, 1.1);
      ink(c, [[x - 3 * s, y - 9 * s], [x - 1 * s, y - 14 * s], [x - 3 * s, y - 18 * s]], { seed: sd + 2, w: 1, a: 0.6 });
      ink(c, [[x + 2 * s, y - 9 * s], [x + 4 * s, y - 14 * s], [x + 2 * s, y - 18 * s]], { seed: sd + 3, w: 1, a: 0.6 });
    } else {
      shape(c, circle(x, y - 5 * s, 5 * s, 10), "#2f6f8f", sd, 1.1);
    }
  }
  function flagpin(c, x, y, s, t, sd) {          // a jay flag stuck in the map
    var f = Math.sin(t * 4 + sd) * 2;
    ink(c, [[x, y], [x, y - s]], { seed: sd, w: 1.6 });
    shape(c, [[x, y - s], [x + s * 0.62 + f, y - s * 0.9], [x + s * 0.5 + f, y - s * 0.72], [x, y - s * 0.6]], YEL, sd + 1, 1.2);
    c.fillStyle = RED; c.font = "900 " + Math.round(s * 0.26) + 'px "Noto Serif TC",serif'; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("齋", x + s * 0.24 + f * 0.5, y - s * 0.8);
  }

  /* ---------------- projection ---------------- */
  function proj(b, w, h, pad) {
    var S0 = b[0], W = b[1], N = b[2], E = b[3], kx = Math.cos((S0 + N) / 2 * Math.PI / 180);
    var s = Math.min(w / ((E - W) * kx), h / (N - S0)) * (pad || 0.94);
    var ox = (w - (E - W) * kx * s) / 2, oy = (h - (N - S0) * s) / 2;
    return function (la, ln) { return [ox + (ln - W) * kx * s, oy + (N - la) * s]; };
  }
  function pts(P, ring) { return ring.map(function (p) { return P(p[0], p[1]); }); }

  /* ---------------- Thailand, with the day's places ---------------- */
  var TOWNS = U.towns || {};
  function drawThailand(c, w, h) {
    var b = M.thailand.bbox, P = proj(b, w, h, 0.98);
    c.fillStyle = "#cfe6ee"; c.fillRect(0, 0, w, h);
    var R = rnd(4); c.strokeStyle = "rgba(47,111,160,.25)"; c.lineWidth = 1;
    for (var i = 0; i < 26; i++) { var y = R() * h, x = R() * w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - 4, x + 12, y); c.quadraticCurveTo(x + 18, y + 4, x + 24, y); c.stroke(); }
    Object.keys(M.thailand.land).forEach(function (a3, n) {
      M.thailand.land[a3].forEach(function (r, k) {
        var p = pts(P, r);
        if (a3 === "THA") shape(c, p, "#f6e3a6", 11 + k, 1.6);
        else { wash(c, p, "#ece4cc", 0.8, 40 + n * 7 + k); ink(c, p, { seed: 40 + n, close: true, w: 0.8, a: 0.4 }); }
      });
    });
    (U.seas || []).forEach(function (s, i) { var q = P(s[0], s[1]); hand(c, s[2], q[0], q[1], 13, "#2f6fa0", "center"); });
    return P;
  }
  (function days() {
    var cv = $("thcv"), sc = $("scenecv"); if (!cv || !sc) return;
    var S, base = document.createElement("canvas"), P = null, PI = null, BOX = null, sel = window.JAYDAY || 0;
    var SOUTH = [6.75, 97.95, 8.85, 100.75];           // the inset: Phuket to Hat Yai, drawn larger
    function south(T) { return T.lat < 9.5; }
    function at(k) { var T = TOWNS[k]; return south(T) ? PI(T.lat, T.lng) : P(T.lat, T.lng); }
    function build() {
      S = fit(cv, function (w) { return Math.round(Math.min(620, w * 1.45)); });
      base.width = cv.width; base.height = cv.height;
      var bc = base.getContext("2d"); bc.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (!M || !M.thailand) return;
      P = drawThailand(bc, S.w, S.h);
      var bw = S.w * 0.5, bh = bw * 0.78, bx = S.w - bw - 8, by = S.h - bh - 8; BOX = [bx, by, bw, bh];
      var q0 = P(SOUTH[2], SOUTH[1]), q1 = P(SOUTH[0], SOUTH[3]);
      ink(bc, [[q0[0], q0[1]], [q1[0], q0[1]], [q1[0], q1[1]], [q0[0], q1[1]]], { seed: 70, close: true, w: 1, col: RED, a: 0.7 });
      ink(bc, [[q1[0], q1[1]], [bx, by]], { seed: 71, w: 1, col: RED, a: 0.5 });
      bc.save(); bc.beginPath(); bc.rect(bx, by, bw, bh); bc.clip();
      var Pi = proj(SOUTH, bw, bh, 1.0); PI = function (la, ln) { var q = Pi(la, ln); return [bx + q[0], by + q[1]]; };
      bc.fillStyle = "#cfe6ee"; bc.fillRect(bx, by, bw, bh);
      Object.keys(M.thailand.land).forEach(function (a3, n) {
        M.thailand.land[a3].forEach(function (r, k) { var p = r.map(function (x) { return PI(x[0], x[1]); }); if (a3 === "THA") shape(bc, p, "#f6e3a6", 80 + k, 1.4); else wash(bc, p, "#ece4cc", 0.8, 90 + n); });
      });
      bc.restore();
      ink(bc, [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], { seed: 72, close: true, w: 1.8, col: RED });
      Object.keys(TOWNS).forEach(function (k, i) {
        var T = TOWNS[k], q = at(k), s = S.w < 420 ? 18 : 24;
        if (ICON[T.icon]) ICON[T.icon](bc, q[0], q[1], s, 60 + i * 5, 0);
      });
    }
    function draw(t) {
      var c = S.c; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(base, 0, 0); c.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (!P) return;
      var d = (U.dayplan || [])[sel] || { at: [] }, small = S.w < 420;
      Object.keys(TOWNS).forEach(function (k) {
        var T = TOWNS[k], q = at(k), on = d.at.some(function (a) { return a[0] === k; });
        hand(c, T.name, q[0] + (T.dx || 0) * (small ? 0.7 : 1), q[1] + (T.dy || 14), on ? (small ? 13 : 15) : (small ? 10 : 12), on ? RED : "#6b4a2a", T.al || "center", "#fbf2d9");
      });
      d.at.forEach(function (a, i) {
        if (!TOWNS[a[0]]) return; var q = at(a[0]);
        var bob = reduce ? 0 : Math.abs(Math.sin(t * 3 + i)) * 4;
        flagpin(c, q[0] + 4, q[1] - 8 - bob, small ? 24 : 32, t, i + 1);
      });
    }
    var kick = loop(cv, draw);
    document.addEventListener("jayday", function (e) { sel = e.detail; kick(); });
    ground(function () { build(); kick(); });
    addEventListener("resize", function () { build(); kick(); });
    if (document.fonts && document.fonts.load) document.fonts.load('16px "Sriracha"', "กินเจ Kin").then(kick);
    build(); kick();
  })();

  /* ---------------- the day scenes ---------------- */
  var SCENE = {};
  function sky(c, w, h, top, bot) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function person(c, x, y, s, col, sd, t, walk) {
    var k = walk ? Math.sin(t * 6 + sd) * s * 0.12 : 0;
    ink(c, [[x, y - s * 0.55], [x - s * 0.12 + k, y]], { seed: sd, w: 1.6 }); ink(c, [[x, y - s * 0.55], [x + s * 0.12 - k, y]], { seed: sd + 1, w: 1.6 });
    shape(c, [[x - s * 0.17, y - s * 0.5], [x - s * 0.13, y - s * 0.95], [x + s * 0.13, y - s * 0.95], [x + s * 0.17, y - s * 0.5]], col || "#ffffff", sd + 2, 1.2);
    shape(c, circle(x, y - s * 1.08, s * 0.12, 10), "#e9c39a", sd + 3, 1.1);
  }
  function ground0(c, w, h, col) { wash(c, [[0, h * 0.8], [w, h * 0.78], [w, h], [0, h]], col || "#d9c08a", 0.7, 5); ink(c, [[0, h * 0.8], [w * 0.5, h * 0.79], [w, h * 0.78]], { seed: 6, w: 1.2, a: 0.6 }); }
  function pennants(c, w, y, t, n) {
    ink(c, [[0, y], [w * 0.5, y + 14], [w, y]], { seed: 8, w: 1, a: 0.6 });
    for (var i = 0; i < n; i++) { var x = (i + 0.5) * w / n, yy = y + 14 * (1 - Math.pow((x - w / 2) / (w / 2), 2)), f = Math.sin(t * 3 + i) * 0.15;
      c.save(); c.translate(x, yy); c.rotate(f); shape(c, [[-7, 0], [7, 0], [7, 14], [0, 11], [-7, 14]], YEL, 20 + i, 1); c.restore(); }
  }
  SCENE.pole = function (c, w, h, t) {
    sky(c, w, h, "#2a1440", "#e9875a"); ground0(c, w, h);
    var x = w * 0.42, top = h * 0.08, foot = h * 0.8;
    ICON.shrine(c, w * 0.18, foot, h * 0.36, 3);
    ink(c, [[x, foot], [x + 2, top]], { seed: 4, w: 3.4, col: "#7a5a2a" });
    shape(c, [[x + 2, top], [x + 36, top + 7], [x + 2, top + 20]], YEL, 9, 1);
    var lit = reduce ? 9 : Math.min(9, Math.floor((t % 12) / 1.1) + 1), ex = w * 0.95, ey = foot - 4;
    ink(c, [[x + 2, top + 22], [ex, ey]], { seed: 12, w: 1, a: 0.7 });
    for (var i = 0; i < 9; i++) {
      var u = (i + 0.7) / 9.6, lx = x + 2 + (ex - x - 2) * u, ly = top + 22 + (ey - top - 22) * u + 8, on = i < lit;
      if (on) { var g = c.createRadialGradient(lx, ly + 6, 0, lx, ly + 6, 22); g.addColorStop(0, "rgba(255,200,80,.6)"); g.addColorStop(1, "rgba(255,160,40,0)"); c.fillStyle = g; c.fillRect(lx - 22, ly - 16, 44, 44); }
      ink(c, [[lx, ly - 8], [lx, ly - 2]], { seed: 30 + i, w: 0.8, a: 0.7 });
      shape(c, [[lx - 6, ly - 2], [lx + 6, ly - 2], [lx + 7, ly + 10], [lx - 7, ly + 10]], on ? "#ffcf4a" : "#6a4a2a", 40 + i, 1);
    }
    hand(c, lit + " / 9", w * 0.1, h * 0.12, 18, "#fff6e0", "left");
  };
  SCENE.sedan = function (c, w, h, t) {
    sky(c, w, h, "#bfe0f0", "#fff4d6"); pennants(c, w, h * 0.12, t, 9); ground0(c, w, h);
    var off = reduce ? 0 : ((t * 30) % (w + 200)) - 160, y = h * 0.8;
    for (var i = 0; i < 4; i++) person(c, off + i * 34, y, h * 0.3, "#ffffff", i * 5, t, true);
    var bx = off + 52, by = y - h * 0.3;
    ink(c, [[off - 10, by + 6], [off + 120, by + 6]], { seed: 3, w: 3, col: "#7a3a1a" });
    shape(c, [[bx - 26, by + 4], [bx - 22, by - 36], [bx + 22, by - 36], [bx + 26, by + 4]], RED, 4, 1.4);
    shape(c, [[bx - 34, by - 34], [bx, by - 56], [bx + 34, by - 34]], "#f2b72b", 5, 1.4);
    for (var k = 0; k < 3; k++) { var px = w * (0.15 + k * 0.33), py = h * 0.4 + Math.sin(t * 2 + k) * 6; c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(px, py, 14 + 4 * Math.sin(t * 3 + k), 0, TAU); c.fill(); }
  };
  SCENE.armies = function (c, w, h, t) {
    sky(c, w, h, "#2c1a40", "#d77748"); ground0(c, w, h, "#b89a6a");
    var cols = ["#222222", "#c8102e", "#2f8a3a", "#ffffff", YEL];
    cols.forEach(function (col, i) {
      var x = w * (0.12 + i * 0.19), y = h * 0.8, f = Math.sin(t * 3 + i) * 5;
      ink(c, [[x, y], [x, h * 0.25]], { seed: i, w: 2.2, col: "#6b4a2a" });
      shape(c, [[x, h * 0.25], [x + 30 + f, h * 0.27], [x + 26 + f, h * 0.36], [x, h * 0.38]], col, 10 + i, 1.2);
      shape(c, [[x - 14, y - 2], [x + 14, y - 2], [x + 10, y - 14], [x - 10, y - 14]], "#f6efd8", 20 + i, 1);
    });
  };
  SCENE.procession = function (c, w, h, t) {
    sky(c, w, h, "#d6ecf5", "#fff6dc"); pennants(c, w, h * 0.1, t, 11); ground0(c, w, h);
    var off = reduce ? 0 : (t * 22) % 60;
    for (var i = -1; i < 8; i++) {
      var x = i * 60 + off, y = h * 0.8; person(c, x, y, h * 0.28, "#ffffff", i * 3 + 50, t, true);
      if (i % 2) { ink(c, [[x + 8, y - h * 0.2], [x + 10, y - h * 0.5]], { seed: i, w: 1.4 }); shape(c, [[x + 10, y - h * 0.5], [x + 30, y - h * 0.47], [x + 10, y - h * 0.42]], YEL, i + 70, 1); }
    }
  };
  SCENE.gather = function (c, w, h, t) {
    sky(c, w, h, "#bfe0f0", "#fff4d6");
    ICON.karst(c, w * 0.3, h * 0.62, h * 0.5, 3); ICON.karst(c, w * 0.8, h * 0.6, h * 0.42, 9);
    ground0(c, w, h);
    for (var i = 0; i < 3; i++) {
      var x = w * (0.2 + i * 0.3), y = h * 0.82;
      shape(c, [[x - 26, y - 14], [x + 26, y - 14], [x + 18, y], [x - 18, y]], "#3a3634", 30 + i, 1.2);
      for (var k = 0; k < 3; k++) { var sy = y - 22 - ((t * 16 + k * 12) % 36); c.fillStyle = "rgba(255,255,255," + (0.5 - ((t * 16 + k * 12) % 36) / 80) + ")"; c.beginPath(); c.arc(x - 8 + k * 8, sy, 6, 0, TAU); c.fill(); }
    }
    pennants(c, w, h * 0.1, t, 8);
  };
  SCENE.lion = function (c, w, h, t) {           // the lion leaps for the hanging greens every four seconds; the jaw snaps on the beat
    var u = Math.min(w / 540, h / 400), beat = t * 2, cyc = (t % 4) / 4, gy = h * 0.8, i, k;
    sky(c, w, h, "#ff9f4a", "#ffe6b0");
    c.save(); c.translate(w * 0.3, h * 0.42); c.rotate(t * 0.15); c.fillStyle = "rgba(255,240,180,.32)";
    for (i = 0; i < 14; i++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 1.2, -w * 0.12); c.lineTo(w * 1.2, w * 0.12); c.closePath(); c.fill(); }
    c.restore();
    pennants(c, w, h * 0.05, t, 11); ground0(c, w, h, "#d9a85a");
    var lp = cyc > 0.5 && cyc < 0.85 ? Math.sin((cyc - 0.5) / 0.35 * Math.PI) : 0;        // the leap, 0 → 1 → 0
    var bob = Math.abs(Math.sin(beat * Math.PI)) * 7 * u;
    var R = 68 * u, hx0 = w * 0.32, hy0 = gy - 150 * u;
    var hx = hx0 + Math.sin(t * 1.1) * 8 * u - lp * R * 1.25, hy = hy0 - bob - lp * 70 * u;           // the leap lunges forward and up
    var tx = w * 0.8, ty = gy - 135 * u - bob * 0.6 - lp * 14 * u;
    var bit = cyc > 0.67, bite = bit ? (cyc - 0.67) * 4 : -1;                               // seconds since the bite
    function leg(x0, y0, x1, y1, bend, sd) {                                                  // a dancer's leg in lion trousers
      var kx = (x0 + x1) / 2 + bend, ky = (y0 + y1) / 2;
      c.save(); c.lineCap = c.lineJoin = "round";
      c.strokeStyle = "#f2b72b"; c.lineWidth = 22 * u; c.beginPath(); c.moveTo(x0, y0); c.lineTo(kx, ky); c.lineTo(x1, y1 - 8 * u); c.stroke();
      c.strokeStyle = RED; c.lineWidth = 3 * u; c.setLineDash([3 * u, 7 * u]); c.stroke(); c.restore();
      for (var f = 0; f < 5; f++) wash(c, circle(x1 - 10 * u + f * 5 * u, y1 - 10 * u, 6 * u, 7), "#ffffff", 0.95, sd + f);
      shape(c, [[x1 - 13 * u, y1 - 5 * u], [x1 + 15 * u, y1 - 5 * u], [x1 + 17 * u, y1], [x1 - 13 * u, y1]], "#1c1410", sd + 6, 1);
    }
    // the body cloth: a scaled hump from behind the head to the tail, fringe swinging
    var top = [], bot = [], N = 12;
    for (i = 0; i <= N; i++) {
      var q = i / N, x = hx + R * 0.4 + (tx - hx - R * 0.4) * q, yT = (hy - R * 0.55) * (1 - q) + (ty - 30 * u) * q - Math.sin(q * Math.PI) * 26 * u + Math.sin(t * 5 - q * 6) * 6 * u;
      top.push([x, yT]); bot.push([x, yT + (R * 1.25) * (1 - q) + 118 * u * q + Math.sin(t * 6 - q * 5) * 4 * u]);
    }
    // legs: the rear dancer in a horse stance, the front one lifted on the leap
    var st = Math.sin(beat * Math.PI) * 6 * u;
    leg(tx - 50 * u, bot[N - 2][1] - 30 * u, tx - 78 * u, gy, -14 * u - st, 100);
    leg(tx - 10 * u, bot[N][1] - 30 * u, tx + 18 * u, gy, 14 * u + st, 110);
    var fx = hx + R * 0.55, fy = hy + R * 0.6, foot = lp > 0.05 ? Math.min(gy, fy + 70 * u) : gy;
    leg(fx - 6 * u, fy, fx - 26 * u, foot, -18 * u + st, 120);
    leg(fx + 16 * u, fy, fx + 36 * u + st, foot, 16 * u, 130);
    shape(c, top.concat(bot.slice().reverse()), "#d4202a", 61, 1.6);
    for (i = 1; i < N; i++) for (k = 1; k < 4; k++) {                                         // gold scales
      var sx = top[i][0], sy = top[i][1] + (bot[i][1] - top[i][1]) * k / 4.2;
      c.strokeStyle = "rgba(255,210,31,.85)"; c.lineWidth = 2 * u; c.beginPath(); c.arc(sx, sy, 7 * u, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    }
    for (i = 1; i < N; i += 1) wash(c, circle(top[i][0], top[i][1], 7 * u, 8), i % 2 ? YEL : "#ff8a1f", 0.95, 70 + i);   // spine tufts
    for (i = 0; i <= N; i++) ink(c, [[bot[i][0], bot[i][1]], [bot[i][0] + Math.sin(t * 7 + i) * 4 * u, bot[i][1] + 14 * u]], { seed: 80 + i, w: 3 * u, col: "#ffffff", a: 0.95 });
    for (i = 0; i < 6; i++) wash(c, circle(tx + 22 * u + Math.cos(i) * 10 * u + Math.sin(t * 9) * 8 * u, ty - 6 * u + Math.sin(i * 2) * 10 * u, 11 * u, 8), i % 2 ? "#ffffff" : YEL, 0.95, 90 + i);   // the tail, wagging
    // the head
    var tilt = Math.sin(t * 2.3) * 0.12 - lp * 0.18, open = bit && bite < 0.25 ? 0 : Math.pow(Math.abs(Math.sin(beat * Math.PI)), 1.5) * 0.6 + lp * 0.7;
    var blink = cyc > 0.3 && cyc < 0.36 ? Math.sin((cyc - 0.3) / 0.06 * Math.PI) : 0;
    c.save(); c.translate(hx, hy); c.rotate(tilt);
    for (i = 0; i < 16; i++) { var a = i / 16 * TAU; wash(c, circle(Math.cos(a) * R * 1.02, Math.sin(a) * R * 1.02, R * 0.2, 8), i % 2 ? "#ffffff" : YEL, 0.95, 140 + i); }
    [-1, 1].forEach(function (s2) {                                                           // ears
      c.save(); c.translate(s2 * R * 0.92, -R * 0.55); c.rotate(s2 * (0.5 + Math.sin(t * 9 + s2) * 0.25));
      shape(c, [[-10 * u, 0], [0, -26 * u], [10 * u, 0]], YEL, 160 + s2, 1.2); c.restore();
    });
    shape(c, circle(0, 0, R, 24), "#e8302a", 170, 1.8);
    var band = []; for (i = 0; i <= 10; i++) { var b = Math.PI * (1.12 + 0.76 * i / 10); band.push([Math.cos(b) * R * 0.95, Math.sin(b) * R * 0.95]); }
    for (i = 10; i >= 0; i--) { var b2 = Math.PI * (1.12 + 0.76 * i / 10); band.push([Math.cos(b2) * R * 0.62, Math.sin(b2) * R * 0.62 + R * 0.1]); }
    shape(c, band, YEL, 171, 1.2);
    shape(c, [[-R * 0.1, -R * 0.88], [0, -R * 1.45], [R * 0.1, -R * 0.88]], "#2f9a4a", 172, 1.2);   // the horn
    shape(c, circle(0, -R * 0.56, R * 0.16, 12), "#dfe8ee", 173, 1.2);                                // the mirror
    c.strokeStyle = "rgba(255,255,255," + (0.5 + 0.5 * Math.sin(t * 4)) + ")"; c.lineWidth = 2 * u; c.beginPath(); c.moveTo(-R * 0.08, -R * 0.62); c.lineTo(R * 0.04, -R * 0.5); c.stroke();
    [-1, 1].forEach(function (s2) {
      var ex = s2 * R * 0.42, ey = -R * 0.12, er = R * 0.25;
      shape(c, circle(ex, ey, er, 14), "#ffffff", 180 + s2, 1.6);
      var look = Math.sin(t * 1.7) * er * 0.35;
      c.fillStyle = "#1c1410"; c.beginPath(); c.arc(ex + look, ey + er * 0.1, er * 0.45, 0, TAU); c.fill();
      c.fillStyle = "#ffffff"; c.beginPath(); c.arc(ex + look - er * 0.15, ey - er * 0.08, er * 0.13, 0, TAU); c.fill();
      if (blink > 0) { c.save(); c.beginPath(); c.arc(ex, ey, er + 1, 0, TAU); c.clip(); c.fillStyle = "#f2b72b"; c.fillRect(ex - er - 2, ey - er - 2, er * 2 + 4, (er * 2 + 4) * blink); c.restore(); }
      for (var f = 0; f < 4; f++) ink(c, [[ex - s2 * er * 0.9 + s2 * f * er * 0.5, ey - er * 1.05 - f * 2 * u], [ex - s2 * er * 0.6 + s2 * f * er * 0.5, ey - er * 1.5 - f * 3 * u]], { seed: 190 + f + s2 * 9, w: 3.2 * u, col: "#ffffff", a: 0.95 });   // fierce brows
    });
    var my = R * 0.38, jo = open * R * 0.55;
    shape(c, [[-R * 0.55, my], [R * 0.55, my], [R * 0.45, my + jo + 4 * u], [-R * 0.45, my + jo + 4 * u]], "#5c0a14", 200, 1.2);
    if (jo > 6 * u) wash(c, [[-R * 0.25, my + jo], [R * 0.25, my + jo], [0, my + jo * 0.5]], "#ff7a9a", 0.95, 201);
    for (i = 0; i < 6; i++) { var tx2 = -R * 0.45 + i * R * 0.18; c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(tx2, my); c.lineTo(tx2 + R * 0.09, my + 9 * u); c.lineTo(tx2 + R * 0.18, my); c.fill(); }
    shape(c, [[-R * 0.5, my + jo + 4 * u], [R * 0.5, my + jo + 4 * u], [R * 0.35, my + jo + R * 0.3], [-R * 0.35, my + jo + R * 0.3]], "#e8302a", 202, 1.4);   // the jaw
    for (i = 0; i < 7; i++) { var bx = -R * 0.33 + i * R * 0.11; ink(c, [[bx, my + jo + R * 0.3], [bx + Math.sin(t * 8 + i) * 4 * u, my + jo + R * 0.52]], { seed: 210 + i, w: 3.2 * u, col: "#ffffff", a: 0.95 }); }   // the beard
    shape(c, circle(0, R * 0.16, R * 0.15, 10), YEL, 220, 1.2);                                     // the nose
    c.restore();
    // the greens on a string, lowered again each round
    var lx = hx0 - R * 1.25, lyy = hy0 - 70 * u + R * 0.3, drop = Math.min(1, cyc / 0.12);
    if (!bit) {
      var ly0 = lyy - (1 - drop) * h * 0.5;
      ink(c, [[lx, 0], [lx, ly0 - 14 * u]], { seed: 41, w: 1, a: 0.8 });
      for (i = 0; i < 5; i++) wash(c, circle(lx + Math.cos(i * 1.3) * 9 * u, ly0 + Math.sin(i * 1.3) * 7 * u, 11 * u, 9), i % 2 ? "#3f9a3a" : "#7cc24a", 0.9, 50 + i);
      shape(c, [[lx - 6 * u, ly0 + 12 * u], [lx + 6 * u, ly0 + 12 * u], [lx + 6 * u, ly0 + 28 * u], [lx - 6 * u, ly0 + 28 * u]], RED, 57, 1);
    } else if (bite < 1.3) {                                                                 // leaves fly
      var Rr = rnd(Math.floor(t / 4) + 3);
      for (i = 0; i < 20; i++) {
        var vx = (Rr() - 0.5) * 420 * u, vy = -(80 + Rr() * 220) * u, ph = Rr() * TAU;
        var px = lx + vx * bite, py = lyy + 20 * u + vy * bite + 420 * u * bite * bite;
        c.save(); c.translate(px, py); c.rotate(ph + bite * 8); c.globalAlpha = Math.max(0, 1 - bite / 1.3);
        c.fillStyle = i % 2 ? "#3f9a3a" : "#8fd04f"; c.beginPath(); c.ellipse(0, 0, 14 * u, 7 * u, 0, 0, TAU); c.fill(); c.restore();
      }
    }
    if (lp > 0.6) for (i = 0; i < 6; i++) {                                                          // sparkle at the top of the leap
      var sa = i / 6 * TAU + t * 3, sr = R * (1.5 + 0.2 * Math.sin(t * 10 + i)), spx = hx + Math.cos(sa) * sr, spy = hy + Math.sin(sa) * sr, ss = 7 * u * lp;
      c.fillStyle = "#fff6c0"; c.beginPath(); c.moveTo(spx, spy - ss * 2); c.lineTo(spx + ss * 0.5, spy); c.lineTo(spx, spy + ss * 2); c.lineTo(spx - ss * 0.5, spy); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(spx - ss * 2, spy); c.lineTo(spx, spy + ss * 0.5); c.lineTo(spx + ss * 2, spy); c.lineTo(spx, spy - ss * 0.5); c.closePath(); c.fill();
    }
    // the drum, bottom right, struck on the beat
    var dx = w * 0.93, dy = gy + 14 * u, hit = Math.pow(1 - (beat % 1), 6);
    shape(c, [[dx - 26 * u, dy - 22 * u], [dx + 26 * u, dy - 22 * u], [dx + 22 * u, dy + 12 * u], [dx - 22 * u, dy + 12 * u]], RED, 230, 1.4);
    shape(c, [[dx - 26 * u, dy - 26 * u], [dx + 26 * u, dy - 26 * u], [dx + 26 * u, dy - 18 * u], [dx - 26 * u, dy - 18 * u]], "#f6efd8", 231, 1.2);
    ink(c, [[dx - 30 * u, dy - 60 * u + hit * 30 * u], [dx - 6 * u, dy - 26 * u - (1 - hit) * 14 * u]], { seed: 232, w: 3 * u, col: "#6b3a1a" });
    if (hit > 0.3) { c.strokeStyle = "rgba(255,255,255," + hit + ")"; c.lineWidth = 2 * u; c.beginPath(); c.ellipse(dx, dy - 22 * u, 34 * u * (1.6 - hit), 10 * u * (1.6 - hit), 0, 0, TAU); c.stroke(); }
  };
  SCENE.stars = function (c, w, h, t) {
    sky(c, w, h, "#0d0820", "#2a1840");
    var D = [[0.78, 0.2], [0.77, 0.38], [0.6, 0.42], [0.55, 0.3], [0.42, 0.33], [0.3, 0.36], [0.18, 0.5]];
    ink(c, D.map(function (p) { return [p[0] * w, p[1] * h]; }), { seed: 3, w: 1, col: YEL, a: 0.6 });
    ink(c, [[D[3][0] * w, D[3][1] * h], [D[0][0] * w, D[0][1] * h]], { seed: 4, w: 1, col: YEL, a: 0.6 });
    D.forEach(function (p, i) { c.fillStyle = "#fff6d8"; c.beginPath(); c.arc(p[0] * w, p[1] * h, 3 + Math.sin(t * 3 + i) * 0.8, 0, TAU); c.fill(); });
    [[0.28, 0.28], [0.08, 0.6]].forEach(function (p, i) { c.fillStyle = "rgba(255,150,170," + (0.4 + 0.3 * Math.sin(t * 2 + i)) + ")"; c.beginPath(); c.arc(p[0] * w, p[1] * h, 4, 0, TAU); c.fill(); });
    shape(c, [[w * 0.25, h * 0.86], [w * 0.75, h * 0.86], [w * 0.72, h * 0.74], [w * 0.28, h * 0.74]], RED, 8, 1.2);
    for (var i = 0; i < 5; i++) { var x = w * (0.33 + i * 0.085); ink(c, [[x, h * 0.74], [x, h * 0.66]], { seed: i, w: 3, col: "#fff" }); wash(c, [[x - 3, h * 0.66], [x, h * 0.6 - Math.sin(t * 8 + i) * 2], [x + 3, h * 0.66]], "#ffcf4a", 0.95, i + 20); }
  };
  SCENE.firecrackers = function (c, w, h, t) {
    sky(c, w, h, "#e9eef0", "#fff6dc"); ground0(c, w, h);
    var x = w * 0.5; ink(c, [[x, 0], [x, h * 0.62]], { seed: 2, w: 1.4 });
    var n = 12, popped = reduce ? 3 : Math.max(0, Math.floor((t * 3) % (n + 10)) - 6);
    for (var i = 0; i < n; i++) {
      var y = h * 0.62 - i * h * 0.045, side = i % 2 ? 1 : -1;
      if (n - 1 - i < popped) continue;
      c.save(); c.translate(x + side * 8, y); c.rotate(side * 0.5); shape(c, [[-3, -9], [3, -9], [3, 9], [-3, 9]], RED, 30 + i, 1); c.restore();
    }
    var R = rnd(Math.floor(t * 8));
    for (var k = 0; k < 14; k++) { var a = R() * TAU, r = 10 + R() * 40; c.fillStyle = k % 2 ? "#ffcb2e" : "#ff5a2e"; c.fillRect(x + Math.cos(a) * r, h * 0.66 + Math.sin(a) * r * 0.6, 3, 3); }
    for (var s = 0; s < 4; s++) { c.fillStyle = "rgba(200,200,200,.35)"; c.beginPath(); c.arc(x + (s - 1.5) * 26, h * 0.7 - ((t * 20 + s * 15) % 50), 18, 0, TAU); c.fill(); }
    for (var p = 0; p < 3; p++) person(c, w * (0.12 + p * 0.1), h * 0.82, h * 0.26, "#ffffff", p * 7, t);
  };
  SCENE.sea = function (c, w, h, t) {
    sky(c, w, h, "#060a24", "#1d2a5a");
    c.fillStyle = "#fff6d8"; c.beginPath(); c.arc(w * 0.8, h * 0.18, 14, 0, TAU); c.fill();
    wash(c, [[0, h * 0.55], [w, h * 0.52], [w, h], [0, h]], "#1f4f8a", 0.9, 3);
    for (var i = 0; i < 6; i++) { var y = h * 0.6 + i * 12, o = (t * 12 + i * 20) % 40; ink(c, [[o - 40, y], [o, y - 3], [o + 40, y], [o + 80, y - 3], [o + 120, y], [o + 160, y - 3], [o + 200, y], [o + 240, y - 3], [o + 280, y], [o + 320, y - 3], [o + 360, y]], { seed: i, w: 1, col: "#9cc9e6", a: 0.6 }); }
    wash(c, [[0, h * 0.82], [w * 0.55, h * 0.78], [w * 0.6, h], [0, h]], "#c9b48a", 0.95, 8);
    for (var p = 0; p < 6; p++) person(c, w * (0.06 + p * 0.08), h * 0.95, h * 0.24, "#ffffff", p * 9, t);
    var lamps = reduce ? 0 : Math.max(0, 9 - Math.floor((t % 14)));
    for (var k = 0; k < 9; k++) { var lx = w * 0.62 + k * 9, on = k < lamps; c.fillStyle = on ? "#ffcf4a" : "#3a3a4a"; c.beginPath(); c.arc(lx, h * 0.3, 3.5, 0, TAU); c.fill(); }
    hand(c, lamps + " / 9", w * 0.62, h * 0.38, 14, "#fff6d8", "left");
  };
  window.JAYDOODLE = { ICON: ICON, SCENE: SCENE, ink: ink, wash: wash, shape: shape, hand: hand, paper: paper, flagpin: flagpin, pin: pin,
    proj: proj, circle: circle, person: person, drawThailand: drawThailand, setMap: function (m) { M = m; } };   // the reel draws with these
  (function scenes() {
    var cv = $("scenecv"); if (!cv) return;
    var S, sel = window.JAYDAY || 0;
    function build() { S = fit(cv, function (w) { return Math.round(Math.min(300, Math.max(200, w * 0.6))); }); }
    function draw(t) {
      var c = S.c, d = (U.dayplan || [])[sel] || {}, f = SCENE[d.scene] || SCENE.procession;
      c.save(); f(c, S.w, S.h, t); c.restore();
    }
    var kick = loop(cv, draw);
    document.addEventListener("jayday", function (e) { sel = e.detail; kick(); });
    addEventListener("resize", function () { build(); kick(); });
    build(); kick();
  })();

  /* ---------------- the north, doodled, with the halls and kitchens ---------------- */
  (function north() {
    var cv = $("mapcv"); if (!cv || !U.places) return;
    var S, base = document.createElement("canvas"), P = null, view = "city", hits = [], pick = -1, info = $("mapinfo");
    var VIEWS = {
      city: { prov: "cm", bbox: [18.763, 98.962, 18.807, 99.017] },
      cm: { prov: "cm", bbox: [17.2, 97.3, 20.2, 99.6] },
      cr: { prov: "cr", bbox: [19.0, 99.2, 20.5, 100.7] },
      crtown: { prov: "cr", bbox: [19.888, 99.808, 19.928, 99.858] }
    };
    function build() {
      S = fit(cv, function (w) { return Math.round(Math.min(620, Math.max(360, w * 0.85))); });
      base.width = cv.width; base.height = cv.height;
      var c = base.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0);
      var V = VIEWS[view]; P = proj(V.bbox, S.w, S.h, view === "city" || view === "crtown" ? 1.15 : 0.96);
      paper(c, S.w, S.h, view.length);
      if (!M || !M.amphoe) return;
      var T = view === "city" ? M.city : view === "crtown" ? M.crtown : null;
      if (T) {
        T.roads.major.forEach(function (r, i) { ink(c, pts(P, r), { seed: i, w: 2.2, col: "#d9b98a", a: 0.9, amp: 0.6 }); });
        T.rivers.forEach(function (r, i) { var p = pts(P, r[1]); ink(c, p, { seed: 300 + i, w: Math.max(2, Math.min(14, r[0] / 6)), col: "#7fb7d8", a: 0.8, amp: 0.8 }); });
        T.water.forEach(function (poly, i) { poly.forEach(function (r, k) { var p = pts(P, r); wash(c, p, "#8fc3e0", 0.8, 200 + i + k); ink(c, p, { seed: 200 + i, close: true, w: 0.9, col: "#2f6fa0", a: 0.7 }); }); });
      } else {
        M.amphoe[V.prov].forEach(function (a, i) { a.rings.forEach(function (r) { var p = pts(P, r); wash(c, p, i % 2 ? "#f3e2b0" : "#efdca2", 0.7, i); ink(c, p, { seed: i, close: true, w: 0.9, a: 0.55 }); }); });
      }
      (U.landmarks[view] || []).forEach(function (L, i) {
        var q = P(L.lat, L.lng), s = (L.s || 1) * (S.w < 420 ? 26 : 34);
        if (q[0] < -40 || q[0] > S.w + 40) return;
        ICON[L.icon](c, q[0], q[1], s, 500 + i * 3, 0);
        hand(c, L.name, q[0] + (L.dx || 0), q[1] + 12 + (L.dy || 0), S.w < 420 ? 11 : 13, "#5a3a1a", L.al || "center", "#fbf2d9");
      });
      (U.mapnotes[view] || []).forEach(function (n) { var q = P(n[0], n[1]); hand(c, n[2], q[0], q[1], S.w < 420 ? 12 : 15, n[3] || "#2f6fa0", n[4] || "center"); });
    }
    function draw(t) {
      var c = S.c, V = VIEWS[view]; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(base, 0, 0); c.setTransform(DPR, 0, 0, DPR, 0, 0);
      hits = [];
      U.places.forEach(function (p, i) {
        if (p.prov !== V.prov || !P) return;
        var q = P(p.lat, p.lng); if (q[0] < -10 || q[0] > S.w + 10 || q[1] < -10 || q[1] > S.h + 10) return;
        pin(c, q[0], q[1], p.k, i * 3 + 1, i === pick); hits.push([q[0], q[1] - 6, i]);
      });
      if (pick >= 0 && P) {
        var p = U.places[pick], q = P(p.lat, p.lng);
        flagpin(c, q[0], q[1] - 10, 30, t, 2);
        hand(c, TH ? p.th : p.en, q[0] + (q[0] > S.w * 0.6 ? -14 : 14), q[1] - 30, 14, RED, q[0] > S.w * 0.6 ? "right" : "left", "#fbf2d9");
      }
      c.fillStyle = "rgba(42,18,6,.5)"; c.font = "10px system-ui,sans-serif"; c.textAlign = "right";
      c.fillText(view === "city" || view === "crtown" ? "© OpenStreetMap contributors" : "OCHA COD-AB · RTSD", S.w - 6, S.h - 6);
    }
    function show(i) {
      pick = i; var p = U.places[i];
      var first = TH ? p.th : p.en, second = TH ? (p.en !== p.th ? p.en : p.ro) : (p.en !== p.th ? p.th : p.ro);
      info.innerHTML = '<b>' + esc(first) + '</b>' + (second ? ' <span class="roman">' + esc(second) + '</span>' : "") +
        '<br><span>' + esc(TH ? p.note_th : p.note_en) + '</span><br><a href="' + esc(p.url) + '">' + esc(U.map_open) + '</a>';
      kick();
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }
    var kick = loop(cv, draw);
    cv.addEventListener("click", function (e) {
      var r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, best = -1, bd = 22 * 22;
      hits.forEach(function (hh) { var d = (hh[0] - mx) * (hh[0] - mx) + (hh[1] - my) * (hh[1] - my); if (d < bd) { bd = d; best = hh[2]; } });
      if (best >= 0) show(best);
    });
    document.querySelectorAll("#mapseg .pill").forEach(function (b) {
      b.addEventListener("click", function () {
        view = b.dataset.v; pick = -1; info.innerHTML = U.map_hint;
        document.querySelectorAll("#mapseg .pill").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        build(); kick();
      });
    });
    ground(function () { build(); kick(); });
    addEventListener("resize", function () { build(); kick(); });
    if (document.fonts && document.fonts.load) document.fonts.load('16px "Sriracha"', "กินเจ Kin").then(function () { build(); kick(); });
    build(); kick();
  })();
})();
