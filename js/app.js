/* SGMTS scroll-cinematic landing — Lenis smooth scroll + canvas scrubs + GSAP.
   Gated like the original: without GSAP or with reduced motion the page stays
   fully readable; the canvas scrubs still track native scroll. */
(function () {
  function start() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      new URLSearchParams(location.search).has("static");

    /* ---------- canvas scrub sections ---------- */
    var scrubs = (window.__cine && window.__cine.init(window.SCRUB_SECTIONS)) || [];
    function updateScrubs() { for (var i = 0; i < scrubs.length; i++) scrubs[i].update(); }

    /* ---------- smooth scroll ---------- */
    var lenis = null;
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      window.__lenis = lenis;
    }

    /* anchor links ride the smooth scroller */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: 0 });
        else target.scrollIntoView();
      });
    });

    /* hero scroll hint fades once the journey starts */
    function hintFade(scrollY) {
      var hint = document.querySelector(".hero-scroll");
      if (hint) hint.style.opacity = scrollY > 80 ? "0" : "1";
    }

    if (!window.gsap) {
      // No GSAP: plain rAF keeps scrubs + smooth scroll alive.
      (function raf(t) {
        if (lenis) lenis.raf(t);
        updateScrubs();
        hintFade(window.scrollY);
        requestAnimationFrame(raf);
      })(performance.now());
      return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);
    document.documentElement.classList.add("is-ready");

    if (lenis) {
      lenis.on("scroll", function () {
        ScrollTrigger.update();
        hintFade(lenis.scroll);
      });
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
        updateScrubs();
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      gsap.ticker.add(updateScrubs);
      window.addEventListener("scroll", function () { hintFade(window.scrollY); }, { passive: true });
    }

    /* ---------- nav state ---------- */
    ScrollTrigger.create({
      start: "top -80",
      onUpdate: function (self) {
        document.getElementById("nav").classList.toggle("scrolled", self.scroll() > 80);
      }
    });

    if (reduce) return; // static choreography below this line

    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(init);
    } else {
      init();
    }

    function init() {
      var EASE = "expo.out";

      /* ---------- generic section reveals ---------- */
      gsap.utils.toArray([".statement .eyebrow", ".features-head .eyebrow"]).forEach(function (el) {
        gsap.from(el, {
          y: 20, autoAlpha: 0, duration: 0.9, ease: EASE,
          scrollTrigger: { trigger: el, start: "top 88%" }
        });
      });

      gsap.utils.toArray(".display:not(.hero-title):not(.news-cine-title)").forEach(function (el) {
        gsap.from(el, {
          y: 44, autoAlpha: 0, duration: 1.1, ease: EASE,
          scrollTrigger: { trigger: el, start: "top 86%" }
        });
      });

      // statement builds word by word as you scroll through it
      var stSplit = new SplitText("#statementText", { type: "words" });
      gsap.from(stSplit.words, {
        autoAlpha: 0.12, y: 6, stagger: 0.02, duration: 0.4, ease: "power2.out",
        scrollTrigger: { trigger: "#statementText", start: "top 80%", end: "top 35%", scrub: 0.6 }
      });

      /* ---------- ledger counters ---------- */
      gsap.utils.toArray(".ledger-row").forEach(function (row, i) {
        gsap.from(row, {
          y: 36, autoAlpha: 0, duration: 0.9, delay: i * 0.05, ease: EASE,
          scrollTrigger: { trigger: row, start: "top 90%" }
        });
        var num = row.querySelector(".count");
        if (!num) return;
        var target = parseFloat(num.dataset.count);
        var decimals = parseInt(num.dataset.decimals || "0", 10);
        var proxy = { v: 0 };
        num.textContent = (0).toLocaleString("en-US", { minimumFractionDigits: decimals });
        gsap.to(proxy, {
          v: target, duration: 1.8, ease: "power4.out",
          scrollTrigger: { trigger: row, start: "top 85%" },
          onUpdate: function () {
            num.textContent = proxy.v.toLocaleString("en-US", {
              minimumFractionDigits: decimals, maximumFractionDigits: decimals
            });
          }
        });
      });

      /* ---------- route schematic: scrubbed draw ----------
         The draw + dot ride occupy the FIRST HALF of the scrub range,
         then a padding beat holds the finished diagram, so the vehicle
         dot arrives at the terminus around the middle of the scroll —
         while the whole map is still comfortably in frame. */
      var routePath = document.getElementById("routePath");
      if (routePath) {
        var rLen = routePath.getTotalLength();
        gsap.set(routePath, { strokeDasharray: rLen, strokeDashoffset: rLen });
        gsap.set("#routeDot", { autoAlpha: 0 });

        var routeTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".route-map",
            start: "top 78%",
            end: "bottom 30%",
            scrub: 0.8
          }
        });

        routeTl
          .from(".r-lr, .r-linename-lr", { autoAlpha: 0, duration: 0.06 }, 0)
          .from(".r-tml, .r-linename-tml", { autoAlpha: 0, duration: 0.08 }, 0.18)
          .to("#routeDot", { autoAlpha: 1, duration: 0.02 }, 0)
          .to(routePath, { strokeDashoffset: 0, duration: 1 }, 0)
          .to("#routeDot", {
            motionPath: { path: "#routePath", align: "#routePath", alignOrigin: [0.5, 0.5] },
            duration: 1
          }, 0);

        // stations pop as the line passes (bottom → top order in DOM)
        gsap.utils.toArray(".r-stop").forEach(function (stop, i) {
          routeTl.from(stop, { scale: 0, transformOrigin: "center", duration: 0.05, ease: "back.out(3)" }, i * 0.14);
        });

        // walkway interchanges appear as the line reaches them
        routeTl
          .from(".r-link-lr, .r-xstop-lr", { autoAlpha: 0, scale: 0.5, transformOrigin: "center", duration: 0.06, ease: "back.out(2)" }, 0.04)
          .from(".r-link-tml, .r-xstop-tml", { autoAlpha: 0, scale: 0.5, transformOrigin: "center", duration: 0.06, ease: "back.out(2)" }, 0.28)
          .from(".r-depot", { autoAlpha: 0, scale: 0.6, transformOrigin: "center", duration: 0.08 }, 0.68);

        // labels fade in at their position along the line
        gsap.utils.toArray(".r-label").forEach(function (label) {
          var pos = parseFloat(label.dataset.pos || 0) * 0.9;
          routeTl.from(label, { autoAlpha: 0, x: 14, duration: 0.08, ease: "power2.out" }, pos);
        });

        // padding beat: doubles the timeline so everything above lands at 50%
        routeTl.to({}, { duration: 1 }, 1);
      }

      // route copy reveal
      gsap.from(".route-sticky > *", {
        y: 30, autoAlpha: 0, duration: 1, stagger: 0.08, ease: EASE,
        scrollTrigger: { trigger: ".route", start: "top 75%" }
      });

      /* ---------- news rows ---------- */
      gsap.from(".news-list li", {
        y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: EASE,
        scrollTrigger: { trigger: ".news-list", start: "top 85%" }
      });
      gsap.from(".news-aside > *", {
        y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: EASE,
        scrollTrigger: { trigger: ".news-aside", start: "top 85%" }
      });

      /* ---------- footer ---------- */
      gsap.from(".footer-grid > *", {
        y: 30, autoAlpha: 0, duration: 1, stagger: 0.1, ease: EASE,
        scrollTrigger: { trigger: ".footer", start: "top 88%" }
      });

      ScrollTrigger.refresh();
    } // end init
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
