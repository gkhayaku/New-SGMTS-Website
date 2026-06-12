# 3D Scroll SGMTS Site — Plan

Source: `../SGMTS Website` (teal-ink brand, Archivo, GSAP route schematic)
Output: this folder. Videos already provided in `Videos/`.

## Video → section mapping
- [x] `Front Page.mp4` (97f) → hero scrub (white turntable composition)
- [x] `Green and Flexible.mp4` (97f) → chapter 01 scrub
- [x] `Dedicated Roads.mp4` (122f) → chapter 02 scrub (grade separation aerial)
- [x] `Dedicated Roads 2.mp4` (79f) → chapter 03 scrub (smart traffic / V2X)
- [x] `Passenger Friendly.mp4` (145f) → chapter 04 scrub (platform, mascot)
- [x] `Latest News.mp4` (121f) → news intro scrub (mascot at the wheel)

## Steps
- [x] ffmpeg ready (system /opt/homebrew/bin/ffmpeg)
- [x] Extract all native frames per video into `frames/<name>/` (~1600px, q5 ≈ 75MB total)
- [x] Build `index.html` + `css/style.css` + `js/scroll-cinematic.js` + `js/app.js`
- [x] Route schematic kept; retimed — timeline padded to 2× so draw + dot
      complete at 50% scrub; trigger range start "top 78%" → end "bottom 30%"
- [x] Brand assets copied (logo, favicon, og)
- [x] `Launch Demo.command` (port 8094) + localhost verified

## Review
- All resources serve 200; zero console errors/warnings.
- All 6 canvases verified painting real frame pixels (sampled center px per section).
- Route timing verified numerically: at ScrollTrigger progress 0.50 the timeline
  is at full state — vehicle dot sits on the terminus at viewport y≈113px with the
  whole schematic in frame (svg spans 68–700px of a 720px viewport). Previously
  this state was only reached at progress 1.0 with the map top 425px above frame.
- Overlay choreography verified via the trapezoid window function: hero title
  full at p=0 → fades by ~0.45; sub-copy peaks mid; facts hold 0.86→1;
  chapter cards fade in by 0.26 and hold to section end.
- Engine upgraded from the skill template's triangular opacity window to a
  trapezoid (fade-in / hold / fade-out) so cards hold 100% rather than peaking.
- Hero is light (white footage) → nav defaults to ink; soft white scrim added
  behind the headline zone for contrast over the tram.
- Note: headless screenshots blank the sticky canvas when scrolled (known skill
  gotcha) — verified with pixel sampling + live browser instead.
