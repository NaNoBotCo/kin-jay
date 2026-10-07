/* app.js — every drawing and toy on the page. Words come in window.UI, written in tools/copy_text.py. */
(function () {
  "use strict";
  var U = window.UI || {}, TAU = Math.PI * 2, DPR = Math.min(2, window.devicePixelRatio || 1);
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CARD = document.documentElement.classList.contains("card");
  var TH = U.lang === "th";
  var $ = function (id) { return document.getElementById(id); };
  var YEL = "#ffd21f", YEL2 = "#f5b800", RED = "#c8102e", DEEP = "#5c0a14", INK = "#2a1206";
  var THAI = '"Noto Sans Thai","Thonburi",sans-serif';
  var GLYPH = '"Noto Serif TC","Noto Serif SC","PingFang TC","Hiragino Mincho ProN","Songti TC",serif';

  function fit(cv, h) {
    var w = cv.clientWidth || 600;
    if (typeof h === "function") h = h(w);
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); cv.style.height = h + "px";
    var c = cv.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { c: c, w: w, h: h };
  }
  function onVisible(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, { rootMargin: "120px" }).observe(el);
  }
  function loop(el, draw) {
    var on = false, raf = 0, last = 0;
    function tick(t) { var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; draw(t / 1000, dt); if (on && !reduce) raf = requestAnimationFrame(tick); }
    onVisible(el, function (v) { on = v; cancelAnimationFrame(raf); last = 0; if (v) raf = requestAnimationFrame(tick); });
    return function () { if (!on || reduce) draw(performance.now() / 1000, 0); };
  }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }

  /* ---------- the flag: yellow cloth, red 齋 ---------- */
  function mark(c, ch, size) {                    // the red letters: 齋, or เจ in Thai script
    c.font = ch === "齋" ? "900 " + Math.round(size) + "px " + GLYPH : "700 " + Math.round(size * 0.8) + "px " + THAI;
  }
  // เจ as shop signs paint it: blocky, no loops. Traced from Pawyilee's photograph of a sign (Commons, public domain).
  var JE = [[[100,55],[190,62],[182,80],[180,190],[190,240],[195,282],[240,282],[225,302],[165,340],[75,312],[112,295],[118,240],[118,150],[110,80]],
            [[290,58],[530,72],[500,95],[488,140],[482,160],[522,157],[497,180],[475,210],[462,342],[365,350],[378,250],[300,248],[293,222],[380,212],[387,140],[265,135],[272,112],[291,105]]];
  function je(c, x, y, size) {                    // centred on (x,y), size = width
    var k = size / 465;
    c.beginPath();
    JE.forEach(function (poly) { poly.forEach(function (p, i) { var px = x + (p[0] - 302) * k, py = y + (p[1] - 202) * k; if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath(); });
    c.fill();
  }
  function letter(c, ch, x, y, size) {            // draw the red mark centred at (x,y)
    if (ch === "เจ") { je(c, x, y, size * 1.05); return; }
    mark(c, ch, size); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ch, x, y);
  }
  function pennant(c, x, y, w, h, ang, glow, ch) {   // hangs from (x,y); a swallow-tail pennant
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w / 2, h); c.lineTo(0, h * 0.8); c.lineTo(-w / 2, h); c.closePath();
    c.fillStyle = YEL; c.fill();
    if (glow) { c.fillStyle = "rgba(255,255,255," + 0.18 * glow + ")"; c.fill(); }
    c.strokeStyle = RED; c.lineWidth = Math.max(1, w / 14); c.stroke();
    if (w > 9) {
      c.fillStyle = RED; letter(c, ch || "齋", 0, h * 0.4, w * 0.72);
    }
    c.restore();
  }
  function banner(c, x, y, w, h, sway, ch) {          // a tall cloth hung from a shopfront
    c.save(); c.translate(x, y);
    var k = sway || 0;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
    c.quadraticCurveTo(w + k * 0.6, h * 0.5, w + k, h); c.lineTo(k, h);
    c.quadraticCurveTo(k * 0.6, h * 0.5, 0, 0); c.closePath();
    c.fillStyle = YEL; c.fill(); c.strokeStyle = RED; c.lineWidth = Math.max(1.5, w / 16); c.stroke();
    c.fillStyle = RED; letter(c, ch || "齋", w / 2 + k * 0.35, h * 0.36, w * 0.78);
    c.restore();
  }

  window.JAYKIT = { pennant: pennant, banner: banner, letter: letter, je: je };   // the reel draws with these

  /* ---------- hero: a street strung with jay flags ---------- */
  (function hero() {
    var cv = $("scene"); if (!cv) return;
    var S, R = rnd(9), lines = [], steam = [], houses = [], gust = 0, gustX = -1;
    function build() {
      S = fit(cv, function (w) { return CARD ? 630 : Math.max(460, Math.min(720, window.innerHeight * 0.78)); });
      var w = S.w, h = S.h, n = w < 600 ? 3 : 4;
      lines = []; houses = []; R = rnd(9);
      for (var i = 0; i < n; i++) {
        var y0 = h * ((CARD ? 0.56 : 0.45) + i * 0.085) + (R() - 0.5) * 20, y1 = y0 + (R() - 0.5) * 50, sag = 26 + R() * 30;
        var gap = w < 600 ? 30 : 36, flags = [];
        for (var x = 10 + R() * 14; x < w - 6; x += gap) flags.push({ x: x, ph: R() * TAU, s: 0.85 + R() * 0.3 });
        lines.push({ y0: y0, y1: y1, sag: sag, flags: flags, pw: w < 600 ? 20 : 24 });
      }
      var x2 = 0;
      while (x2 < w) { var hw = 70 + R() * 90; houses.push({ x: x2, w: hw, h: h * (0.16 + R() * 0.12), b: R() < 0.55, lit: R() }); x2 += hw + 2; }
    }
    function ly(L, x, w) { var t = x / w; return L.y0 + (L.y1 - L.y0) * t + L.sag * 4 * t * (1 - t); }
    function draw(t, dt) {
      var c = S.c, w = S.w, h = S.h;
      var g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#3a0710"); g.addColorStop(0.55, "#7d1420"); g.addColorStop(1, "#d8641c");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      // shophouses
      houses.forEach(function (H, i) {
        var y = h - H.h - 40;
        c.fillStyle = "#2a0509"; c.fillRect(H.x, y, H.w, H.h + 40);
        for (var k = 0; k < 3; k++) {
          var on = ((H.lit * 7 + k) % 3) > 0.9;
          c.fillStyle = on ? "rgba(255,206,120,.85)" : "rgba(255,206,120,.18)";
          c.fillRect(H.x + 10 + k * (H.w - 20) / 3, y + 14, (H.w - 20) / 3 - 8, 16);
        }
        if (H.b && H.w > 90) banner(c, H.x + H.w * 0.5 - 13, y + 40, 26, Math.min(86, H.h * 0.75), Math.sin(t * 1.3 + i) * 3 + (gust > 0 ? gust * 6 : 0), i % 2 ? "เจ" : "齋");
      });
      // stalls and steam
      c.fillStyle = "#1c0306"; c.fillRect(0, h - 40, w, 40);
      var pots = w < 600 ? [0.2, 0.62] : [0.14, 0.42, 0.7, 0.9];
      pots.forEach(function (p, i) {
        var x = w * p, y = h - 40;
        c.fillStyle = "#3d3a38"; c.beginPath(); c.ellipse(x, y, 30, 9, 0, 0, TAU); c.fill();
        c.fillStyle = "#ff8a2a"; c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 9 + i); c.fillRect(x - 16, y + 8, 32, 5); c.globalAlpha = 1;
        if (!reduce && R() < 0.5) steam.push({ x: x + (R() - 0.5) * 30, y: y - 6, vx: (R() - 0.5) * 6, life: 0, max: 2.4 + R() * 1.5, r: 6 + R() * 6 });
      });
      for (var s = steam.length - 1; s >= 0; s--) {
        var P = steam[s]; P.life += dt; P.y -= 26 * dt; P.x += (P.vx + gust * 40) * dt; P.r += 4 * dt;
        if (P.life > P.max) { steam.splice(s, 1); continue; }
        c.fillStyle = "rgba(255,240,225," + (0.11 * (1 - P.life / P.max)) + ")";
        c.beginPath(); c.arc(P.x, P.y, P.r, 0, TAU); c.fill();
      }
      if (steam.length > 260) steam.splice(0, steam.length - 260);
      // bunting
      if (gust > 0) { gust = Math.max(0, gust - dt * 0.6); gustX += dt * w * 0.9; }
      lines.forEach(function (L, li) {
        c.strokeStyle = "rgba(255,230,190,.55)"; c.lineWidth = 1.2; c.beginPath();
        for (var x = 0; x <= w; x += 12) { var yy = ly(L, x, w); if (x) c.lineTo(x, yy); else c.moveTo(x, yy); }
        c.stroke();
        L.flags.forEach(function (F, fi) {
          var near = gust > 0 ? Math.exp(-Math.pow((F.x - gustX) / 140, 2)) * gust : 0;
          var a = 0.12 * Math.sin(t * 2.1 + F.ph + li) + 0.05 * Math.sin(t * 5.3 + F.ph * 2) + near * 0.9 * Math.sin(t * 14 + F.ph);
          pennant(c, F.x, ly(L, F.x, w), L.pw * F.s, L.pw * F.s * 1.25, a, near, (fi + li) % 2 ? "เจ" : "齋");
        });
      });
    }
    build();
    var kick = loop(cv, draw);
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("900 40px \"Noto Serif TC\"", "齋"), document.fonts.load("700 40px \"Noto Sans Thai\"", "เจ")]).then(kick, kick);
    cv.addEventListener("pointerdown", function (e) { var r = cv.getBoundingClientRect(); gust = 1; gustX = e.clientX - r.left - 200; kick(); });
    addEventListener("resize", function () { build(); kick(); });
    kick();
  })();

  /* ---------- today, against the nine days ---------- */
  var DAYS = (U.days || []).map(function (d) { return d[0]; });
  function todayISO() { var d = new Date(); var o = d.getTimezoneOffset(); d = new Date(d.getTime() + (o + 420) * 60000); return d.toISOString().slice(0, 10); }
  function dayIndex(iso) { return DAYS.indexOf(iso); }
  function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
  (function now() {
    var el = $("nowline"); if (!el || !DAYS.length) return;
    var t = todayISO(), i = dayIndex(t), s;
    if (i >= 0) s = U.now_in.replace("{n}", i + 1);
    else if (t < DAYS[0]) { var k = daysBetween(t, DAYS[0]); s = k === 1 ? U.now_tomorrow : U.now_before.replace("{n}", k); }
    else s = U.now_after;
    el.textContent = s;
  })();

  /* ---------- nine lamps ---------- */
  (function lamps() {
    var cv = $("lampcv"); if (!cv || !DAYS.length) return;
    var S, sel = Math.max(0, dayIndex(todayISO())), today = dayIndex(todayISO()), boxes = [];
    var past = todayISO() > DAYS[DAYS.length - 1];
    function build() { S = fit(cv, function (w) { return w < 560 ? 230 : 260; }); }
    function lit(i) { return past || (today >= 0 && i <= today) || (today < 0 && i === sel); }
    function draw(t) {
      var c = S.c, w = S.w, h = S.h, n = 9, gap = w / n;
      c.clearRect(0, 0, w, h); boxes = [];
      for (var i = 0; i < n; i++) {
        var x = gap * (i + 0.5), y = h * 0.62, r = Math.min(26, gap * 0.36), L = lit(i) || i === sel;
        if (L) {
          var g = c.createRadialGradient(x, y - r * 1.3, 0, x, y - r * 1.3, r * 3.2);
          g.addColorStop(0, "rgba(255,200,80,.55)"); g.addColorStop(1, "rgba(255,160,40,0)");
          c.fillStyle = g; c.fillRect(x - r * 3.2, y - r * 4.5, r * 6.4, r * 6.4);
          var f = 1 + 0.12 * Math.sin(t * 11 + i * 1.7) + 0.06 * Math.sin(t * 23 + i);
          c.fillStyle = "#ffcf4a"; c.beginPath();
          c.moveTo(x, y - r * 0.55 - r * 1.25 * f);
          c.quadraticCurveTo(x + r * 0.42, y - r * 0.9, x, y - r * 0.45);
          c.quadraticCurveTo(x - r * 0.42, y - r * 0.9, x, y - r * 0.55 - r * 1.25 * f); c.fill();
          c.fillStyle = "#fff4c8"; c.beginPath(); c.ellipse(x, y - r * 0.75, r * 0.12, r * 0.3, 0, 0, TAU); c.fill();
        }
        c.fillStyle = i === sel ? RED : "#8a5a2a";            // the cup
        c.beginPath(); c.moveTo(x - r, y - r * 0.4); c.quadraticCurveTo(x, y + r * 0.9, x + r, y - r * 0.4); c.closePath(); c.fill();
        c.fillStyle = i === sel ? "#ff5a6e" : "#b07a40"; c.beginPath(); c.ellipse(x, y - r * 0.4, r, r * 0.22, 0, 0, TAU); c.fill();
        c.fillStyle = "#f8e7c4"; c.font = "700 " + (w < 560 ? 12 : 14) + "px system-ui,sans-serif"; c.textAlign = "center";
        c.fillText(U.day_short[i], x, y + r * 1.25 + 8);
        c.fillStyle = "rgba(248,231,196,.7)"; c.font = (w < 560 ? 10 : 12) + "px system-ui,sans-serif";
        c.fillText(U.day_dates[i], x, y + r * 1.25 + 26);
        boxes.push([x - gap / 2, x + gap / 2]);
      }
    }
    function show() {
      var d = U.days[sel]; $("lampday").textContent = U.day_dates_long[sel];
      $("lamptext").innerHTML = d[1];
      window.JAYDAY = sel; document.dispatchEvent(new CustomEvent("jayday", { detail: sel }));
      document.querySelectorAll("#lampbtns .pill").forEach(function (b, i) { b.setAttribute("aria-pressed", i === sel ? "true" : "false"); });
    }
    build(); var kick = loop(cv, draw);
    cv.addEventListener("click", function (e) {
      var x = e.clientX - cv.getBoundingClientRect().left;
      boxes.forEach(function (b, i) { if (x >= b[0] && x < b[1]) sel = i; }); show(); kick();
    });
    document.querySelectorAll("#lampbtns .pill").forEach(function (b, i) { b.addEventListener("click", function () { sel = i; show(); kick(); }); });
    addEventListener("resize", function () { build(); kick(); });
    show(); kick();
  })();

  /* ---------- the character: 齊 + 示 → 齋 ---------- */
  (function glyph() {
    var cv = $("glyphcv"); if (!cv) return;
    var S, t0 = -1;
    function build() { S = fit(cv, function (w) { return Math.min(300, Math.max(150, w * 0.42)); }); }
    function flag(c, x, cy, fs, e, ch) {          // a yellow flag whose red letter fills in from the top
      var fw = fs * 1.05, fh = fs * 1.3, fx = x - fw / 2, fy = cy - fh / 2;
      c.save(); c.globalAlpha = 0.3 + 0.7 * e;
      c.fillStyle = YEL; c.fillRect(fx, fy, fw, fh); c.strokeStyle = RED; c.lineWidth = 3; c.strokeRect(fx, fy, fw, fh);
      c.beginPath(); c.rect(fx, fy, fw, fh * e); c.clip();
      c.fillStyle = RED; letter(c, ch, x, cy + fs * 0.03, fs * 0.9);
      c.restore();
      return fh;
    }
    function draw(t) {
      var c = S.c, w = S.w, h = S.h; c.clearRect(0, 0, w, h);
      if (t0 < 0) t0 = t;
      var k = reduce ? 1 : Math.min(1, ((t - t0) % 8) / 3), e = k * k * (3 - 2 * k);
      var e2 = reduce ? 1 : Math.max(0, Math.min(1, (((t - t0) % 8) - 2.4) / 2));
      var fs = Math.min(h * 0.42, w * 0.12), cy = h * 0.42;
      var xL = w * 0.09, xR = w * 0.29, xF = w * 0.55, xT = w * 0.84;
      c.textAlign = "center"; c.textBaseline = "middle"; c.font = "900 " + fs + "px " + GLYPH;
      c.fillStyle = "rgba(42,18,6," + (1 - e * 0.5) + ")"; c.fillText("齊", xL, cy); c.fillText("示", xR, cy);
      c.font = "700 " + fs * 0.36 + "px system-ui,sans-serif"; c.fillStyle = "#8a6a4a";
      c.fillText("+", (xL + xR) / 2, cy); c.fillText("→", (xR + xF) / 2 - fs * 0.15, cy); c.fillText("=", (xF + xT) / 2, cy);
      var fh = flag(c, xF, cy, fs, e, "齋");
      flag(c, xT, cy, fs, e2, "เจ");
      c.fillStyle = "#6b4a2a"; c.font = (w < 520 ? 11 : 14) + "px system-ui,sans-serif";
      var ly = cy + fh / 2 + 18;
      c.fillText(U.g_l1, xL, ly); c.fillText(U.g_l2, xR, ly); c.fillText(U.g_l3, xF, ly); c.fillText(U.g_l4, xT, ly);
    }
    build(); var kick = loop(cv, draw);
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("900 40px \"Noto Serif TC\"", "齊示齋"), document.fonts.load("700 40px \"Noto Sans Thai\"", "เจ")]).then(kick, kick);
    cv.addEventListener("click", function () { t0 = -1; kick(); });
    addEventListener("resize", function () { build(); kick(); });
    kick();
  })();

  /* ---------- the wok: jay or not ---------- */
  (function wok() {
    var cv = $("wokcv"); if (!cv || !U.foods) return;
    var S, inPan = [], falling = [], R = rnd(4), out = $("wokout");
    function build() { S = fit(cv, function (w) { return w < 520 ? 230 : 270; }); }
    function verdict() {
      if (!inPan.length) { out.className = "wokout"; out.innerHTML = U.wok_empty; return; }
      var bad = inPan.filter(function (i) { return !U.foods[i][2]; });
      if (!bad.length) { out.className = "wokout ok"; out.innerHTML = U.wok_ok; return; }
      out.className = "wokout no";
      out.innerHTML = U.wok_no + "<ul>" + bad.map(function (i) { return "<li><b>" + esc(U.foods[i][0]) + "</b> — " + esc(U.foods[i][3]) + "</li>"; }).join("") + "</ul>";
    }
    function draw(t, dt) {
      var c = S.c, w = S.w, h = S.h; c.clearRect(0, 0, w, h);
      var cx = w / 2, rw = Math.min(w * 0.34, 190), rh = Math.min(rw * 0.42, h * 0.28), cy = h - 44 - rh;
      var bad = inPan.some(function (i) { return !U.foods[i][2]; });
      for (var k = 0; k < 7; k++) {                                   // fire
        var fx = cx - rw * 0.5 + k * rw / 6, fl = 18 + 10 * Math.sin(t * 13 + k * 2.1);
        c.fillStyle = "rgba(255," + (120 + k * 12) + ",40,.8)"; c.beginPath();
        c.moveTo(fx - 9, h - 6); c.quadraticCurveTo(fx, h - 6 - fl * 2.4, fx + 9, h - 6); c.fill();
      }
      c.fillStyle = "#2b2a2a"; c.beginPath(); c.ellipse(cx, cy, rw, rh, 0, 0, Math.PI); c.fill();
      c.fillStyle = "#4a4746"; c.beginPath(); c.ellipse(cx, cy, rw, rh * 0.35, 0, 0, TAU); c.fill();
      c.strokeStyle = "#2b2a2a"; c.lineWidth = 6; c.beginPath(); c.moveTo(cx + rw - 4, cy); c.lineTo(cx + rw + 46, cy - 18); c.stroke();
      inPan.forEach(function (i, n) {
        var a = n * 2.4 + t * 0.6, rr = rw * 0.55 * ((n % 3) + 1) / 3;
        dot(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rh * 0.22, U.foods[i][1], 9);
      });
      for (var f = falling.length - 1; f >= 0; f--) {
        var F = falling[f]; F.vy += 900 * dt; F.y += F.vy * dt;
        if (F.y >= cy || reduce) { falling.splice(f, 1); continue; }
        dot(c, F.x, F.y, U.foods[F.i][1], 10);
      }
      // the flag on the cart: up while it is jay
      var px = w * 0.1 + 6, py = h * 0.12, up = !bad;
      c.strokeStyle = "#6b4a2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(px, py); c.lineTo(px, h * 0.92); c.stroke();
      if (up) pennant(c, px + 22, py + 4, 34, 48, -Math.PI / 2 + 0.08 * Math.sin(t * 3), 0, "เจ");
      else { c.globalAlpha = 0.45; pennant(c, px + 4, h * 0.62, 30, 40, 0.1, 0, "เจ"); c.globalAlpha = 1; }
    }
    function dot(c, x, y, col, r) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1; c.stroke(); }
    build(); var kick = loop(cv, draw);
    document.querySelectorAll("#chips .chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.dataset.i, at = inPan.indexOf(i);
        if (at >= 0) { inPan.splice(at, 1); b.setAttribute("aria-pressed", "false"); }
        else { inPan.push(i); b.setAttribute("aria-pressed", "true"); falling.push({ i: i, x: S.w / 2 + (R() - 0.5) * 80, y: -10, vy: 0 }); }
        verdict(); kick();
      });
    });
    var clr = $("wokclear"); if (clr) clr.addEventListener("click", function () {
      inPan = []; document.querySelectorAll("#chips .chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); verdict(); kick();
    });
    addEventListener("resize", function () { build(); kick(); });
    verdict(); kick();
  })();

  /* ---------- menu filter ---------- */
  (function menu() {
    var seg = $("menuseg"); if (!seg) return;
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var k = b.dataset.k;
      seg.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      document.querySelectorAll("#dishes .dish").forEach(function (d) { d.hidden = k !== "all" && d.dataset.k !== k; });
    });
  })();

  /* ---------- the Dipper: seven stars and two more ---------- */
  (function dipper() {
    var cv = $("dipcv"); if (!cv) return;
    // Ursa Major's seven, by right ascension and declination (J2000, rounded), then the two the story adds
    var STARS = [[165.93, 61.75], [165.46, 56.38], [178.46, 53.69], [183.86, 57.03], [193.51, 55.96], [200.98, 54.93], [206.89, 49.31]];
    var S, joined = 0, R = rnd(3), bg = [], t0 = -1, done = false, msg = $("diptext");
    function build() {
      S = fit(cv, function (w) { return Math.min(380, Math.max(260, w * 0.55)); });
      bg = []; R = rnd(3); for (var i = 0; i < 140; i++) bg.push([R() * S.w, R() * S.h, R() * 1.3 + 0.2, R() * TAU]);
    }
    function pos(i) {
      var ra = STARS[i][0], de = STARS[i][1], w = S.w, h = S.h;
      var x = (1 - (ra - 160) / 52) * w * 0.82 + w * 0.06, y = (64 - de) / 18 * h * 0.8 + h * 0.08;
      return [x, y];
    }
    function extra() {                         // two more, drawn beside Mizar and beyond the handle
      var a = pos(5), b = pos(6);
      return [[a[0] - 10, a[1] - 16], [b[0] + (b[0] - a[0]) * 0.55, b[1] + (b[1] - a[1]) * 0.55]];
    }
    function draw(t) {
      var c = S.c, w = S.w, h = S.h;
      c.fillStyle = "#12051a"; c.fillRect(0, 0, w, h);
      bg.forEach(function (s) { c.fillStyle = "rgba(255,245,220," + (0.3 + 0.3 * Math.sin(t * 1.3 + s[3])) + ")"; c.fillRect(s[0], s[1], s[2], s[2]); });
      c.strokeStyle = "rgba(255,210,31,.75)"; c.lineWidth = 2; c.beginPath();
      for (var i = 0; i < joined; i++) { var p = pos(i); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
      if (joined === 7) { var p3 = pos(3), p0 = pos(0); c.moveTo(p3[0], p3[1]); c.lineTo(pos(2)[0], pos(2)[1]); c.moveTo(p0[0], p0[1]); c.lineTo(p3[0], p3[1]); }
      c.stroke();
      for (var k = 0; k < 7; k++) {
        var q = pos(k), on = k < joined, nxt = k === joined;
        c.fillStyle = on ? YEL : "#fff6e0"; c.beginPath(); c.arc(q[0], q[1], on ? 5 : 3.6, 0, TAU); c.fill();
        if (nxt && !reduce) { c.strokeStyle = "rgba(255,210,31," + (0.4 + 0.4 * Math.sin(t * 5)) + ")"; c.lineWidth = 1.5; c.beginPath(); c.arc(q[0], q[1], 12, 0, TAU); c.stroke(); }
      }
      if (done) {
        if (t0 < 0) t0 = t;
        var e = reduce ? 1 : Math.min(1, (t - t0) / 1.6);
        extra().forEach(function (q) {
          var g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], 22); g.addColorStop(0, "rgba(255,120,140," + 0.7 * e + ")"); g.addColorStop(1, "rgba(255,120,140,0)");
          c.fillStyle = g; c.fillRect(q[0] - 22, q[1] - 22, 44, 44);
          c.fillStyle = "rgba(255,200,210," + e + ")"; c.beginPath(); c.arc(q[0], q[1], 4, 0, TAU); c.fill();
        });
      }
    }
    build(); var kick = loop(cv, draw);
    function step() {
      if (joined < 7) joined++;
      if (joined === 7 && !done) { done = true; t0 = -1; msg.innerHTML = U.dip_done; }
      else if (!done) msg.textContent = U.dip_n.replace("{n}", joined).replace("{m}", 7 - joined);
      kick();
    }
    cv.addEventListener("click", function (e) {
      if (done) return;
      var r = cv.getBoundingClientRect(), q = pos(joined), dx = e.clientX - r.left - q[0], dy = e.clientY - r.top - q[1];
      if (dx * dx + dy * dy < 34 * 34) step();
    });
    var go = $("dipgo"); if (go) go.addEventListener("click", function () {
      if (done) { joined = 0; done = false; msg.textContent = U.dip_start; kick(); return; }
      var iv = setInterval(function () { step(); if (done) clearInterval(iv); }, reduce ? 0 : 280);
    });
    addEventListener("resize", function () { build(); kick(); });
    msg.textContent = U.dip_start; kick();
  })();

  /* ---------- tofu: the five steps ---------- */
  (function tofu() {
    var cv = $("tofucv"); if (!cv) return;
    var S, st = 0, t0 = 0;
    function build() { S = fit(cv, function (w) { return w < 520 ? 210 : 240; }); }
    function draw(t) {
      var c = S.c, w = S.w, h = S.h, e = reduce ? 1 : Math.min(1, (t - t0) / 1.2), cx = w / 2, by = h * 0.8;
      c.clearRect(0, 0, w, h);
      var R = rnd(5);
      if (st === 0) {                                   // beans soaking
        c.fillStyle = "#cfe7f2"; c.fillRect(cx - 90, by - 70, 180, 70);
        for (var i = 0; i < 40; i++) { var s = 7 + 3 * e; c.fillStyle = "#e9c46a"; c.beginPath(); c.ellipse(cx - 80 + R() * 160, by - 8 - R() * 50, s, s * 0.72, R() * 3, 0, TAU); c.fill(); }
      } else if (st === 1) {                            // ground, milk runs
        c.fillStyle = "#8a8580"; c.beginPath(); c.arc(cx - 60, by - 60, 40, 0, TAU); c.fill();
        c.fillStyle = "#fffaf0"; c.fillRect(cx - 62, by - 20, 6, 20 * e); c.fillRect(cx + 10, by - 40 * e, 120, 40 * e);
        c.strokeStyle = "#6b4a2a"; c.strokeRect(cx + 10, by - 40, 120, 40);
      } else if (st === 2) {                            // boiling
        c.fillStyle = "#3d3a38"; c.fillRect(cx - 80, by - 60, 160, 60);
        c.fillStyle = "#fffaf0"; c.fillRect(cx - 74, by - 54, 148, 10);
        for (var j = 0; j < 6; j++) { c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(cx - 60 + j * 24, by - 66 - ((t * 30 + j * 13) % 40), 6, 0, TAU); c.fill(); }
      } else if (st === 3) {                            // curds
        c.fillStyle = "#e5e0d0"; c.fillRect(cx - 80, by - 60, 160, 60);
        for (var k = 0; k < 30; k++) { c.fillStyle = "#fffef6"; c.beginPath(); c.arc(cx - 70 + R() * 140, by - 6 - R() * 48 * e, 5 + R() * 6, 0, TAU); c.fill(); }
        c.fillStyle = "#6b4a2a"; c.fillRect(cx + 60, by - 110 + 30 * e, 6, 40);
      } else {                                          // pressed
        var ph = 50 - 18 * e;
        c.fillStyle = "#a07a50"; c.fillRect(cx - 86, by - 6, 172, 6); c.fillRect(cx - 86, by - ph - 30, 172, 10);
        c.fillStyle = "#fffef6"; c.fillRect(cx - 76, by - ph - 6, 152, ph);
        c.strokeStyle = "#e0d8c0"; for (var m = 1; m < 4; m++) { c.beginPath(); c.moveTo(cx - 76 + m * 38, by - ph - 6); c.lineTo(cx - 76 + m * 38, by - 6); c.stroke(); }
      }
    }
    build(); var kick = loop(cv, draw);
    function set(i) {
      st = i; t0 = performance.now() / 1000; $("tofutext").textContent = U.tofu_steps[i];
      document.querySelectorAll("#tofubtns .pill").forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); }); kick();
    }
    document.querySelectorAll("#tofubtns .pill").forEach(function (b, i) { b.addEventListener("click", function () { set(i); }); });
    addEventListener("resize", function () { build(); kick(); });
    set(0);
  })();
})();
