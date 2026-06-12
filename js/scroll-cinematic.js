/* ============================================================
   SGMTS — scroll-cinematic engine
   Sticky canvas frame-sequence scrub sections.
   Each section: outer tall .cine wrapper + .cine-sticky 100vh stage.
   Frame index = scroll progress through the wrapper. Overlay
   .reveal-line elements fade over per-line [data-in, data-out]
   progress windows (values may extend past 0–1 to pin a line
   fully visible at the start or end of the scrub).
   Driven externally: call the returned update() inside one rAF.
   ============================================================ */
(function () {
  function initScrub(cfg) {
    var section = document.querySelector(cfg.section);
    if (!section) return null;
    var canvas = section.querySelector("canvas");
    var ctx = canvas.getContext("2d", { alpha: false });
    var lines = [].slice.call(section.querySelectorAll(".reveal-line"));
    var bgFill = cfg.bg || "#0a0a12";
    var images = [];
    var firstDrawn = false;
    var current = -1;

    for (var i = 0; i < cfg.frameCount; i++) {
      (function (n) {
        var img = new Image();
        img.src = cfg.framePath(n + 1);
        img.onload = function () {
          if (!firstDrawn) { firstDrawn = true; draw(0); }
        };
        images[n] = img;
      })(i);
    }

    function draw(index) {
      var img = images[index];
      if (!img || !img.complete || !img.naturalWidth) return;
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      var ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
      var dw, dh, dx, dy;
      if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
      else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(current < 0 ? 0 : current);
    }

    function update() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      if (rect.bottom < -vh || rect.top > vh) return;
      var scrollable = rect.height - vh;
      var p = Math.min(Math.max(-rect.top / (scrollable || 1), 0), 1);
      var idx = Math.min(cfg.frameCount - 1, Math.floor(p * (cfg.frameCount - 1)));
      if (idx !== current) { current = idx; draw(idx); }
      for (var j = 0; j < lines.length; j++) {
        var el = lines[j];
        var a = parseFloat(el.dataset.in), b = parseFloat(el.dataset.out);
        // trapezoid window: fade in over `fade`, hold at full, fade out
        var fade = Math.min(0.14, (b - a) / 2);
        var o = Math.min((p - a) / fade, (b - p) / fade, 1);
        o = Math.max(0, Math.min(1, o));
        el.style.opacity = o.toFixed(3);
        el.style.transform = "translateY(" + ((1 - o) * 28).toFixed(1) + "px)";
      }
    }

    window.addEventListener("resize", resize);
    resize();
    return { update: update, resize: resize };
  }

  window.__cine = {
    init: function (configs) {
      return (configs || [])
        .map(initScrub)
        .filter(function (s) { return s; });
    }
  };
})();
