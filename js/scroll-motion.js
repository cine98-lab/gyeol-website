// 결 GYEOL — motion layer for the original design (pairs with css/scroll-motion.css).
// Lenis smooth scroll · IntersectionObserver entrances · in-page link glide ·
// JS fallback for browsers without CSS scroll-driven animations.
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = root.classList.contains('motion');   // set in <head>; absent under reduced motion
  var noSda = root.classList.contains('no-sda');
  var HEADER = 68;                                   // .top .wrap height in style.css
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ── Lenis: inertial smooth scroll ───────────────────────────────────── */
  var lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ── In-page links (#story, #book …) glide and stop below the sticky header ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var toTop = id === '#top';
    if (lenis) lenis.scrollTo(toTop ? 0 : target, { offset: toTop ? 0 : -HEADER });
    else if (toTop) window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    else target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    history.replaceState(null, '', id);
  });

  /* ── Image load fade ─────────────────────────────────────────────────── */
  $$('img').forEach(function (img) {
    var done = function () { img.classList.add('is-loaded'); };
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done); img.addEventListener('error', done); }
  });

  /* ── One-time entrances: same selector list as css/scroll-motion.css ─── */
  var REVEAL = [
    '.hero h1', '.story-head h2', '.benefits-title', '#collTitle', '#procTitle', '#houseTitle', '#bookTitle',
    '.hero-kicker', '.hero-lead', '.hero .cta', '.hero-feats li', '.tag',
    '.story-head p', '.circles h3', '.circles p', '.center-cta', '.benefits li', '.slider-foot',
    '#process .lead', '.proc-figs figcaption', '.steps li', '#house .lead', '#house dl', '#book .muted', '.form', '.foot > div',
    '.hero-visual .shape', '.circle', '.slide-img', '.proc-figs .ph', '.house-fig',
    '.hero-cats li'
  ].join(',');
  var revealEls = $$(REVEAL);
  if (motion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      // Items that come into view together play one after another (document order)
      var batch = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { return en.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.setProperty('--d', Math.min(i * 0.08, 0.6) + 's');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Fallback: same scroll-linked effects without animation-timeline ─── */
  if (motion && noSda) {
    var heroImg = document.querySelector('.hero-visual img');
    var framed = $$('.circle img, .slide-img img, .proc-figs .ph img, .house-fig img');
    var steps = $$('.steps li');
    var stepsList = document.querySelector('.steps');
    var stepRanges = [[0.4, 1.3], [0.55, 1.34], [0.7, 1.38], [0.85, 1.42], [1.0, 1.46]]; // entry→cover, as in CSS

    var update = function () {
      var vh = window.innerHeight;
      // hero: 0 → 100vh of page scroll
      if (heroImg && heroImg.classList.contains('is-loaded')) {
        var hp = clamp01(window.scrollY / vh);
        heroImg.style.transform = 'translateY(' + (6 * hp) + '%) scale(' + (1 + 0.12 * hp) + ')';
      }
      // framed photos: cover 0% (frame top at viewport bottom) → cover 100% (frame bottom at viewport top)
      framed.forEach(function (img) {
        if (!img.classList.contains('is-loaded')) return;
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        var p = clamp01((vh - r.top) / (vh + r.height));
        img.style.transform = 'translateY(' + (-5 + 10 * p) + '%) scale(1.12)';
      });
      // step rules: progress through the list's entry/cover phases (approximation of the CSS ranges)
      if (stepsList) {
        var s = stepsList.getBoundingClientRect();
        var t = (vh - s.top) / Math.min(s.height, vh);   // 0 = list top at viewport bottom
        steps.forEach(function (li, i) {
          var a = stepRanges[i][0], b = stepRanges[i][1];
          li.style.setProperty('--line', clamp01((t - a) / (b - a)));
        });
      }
    };
    if (lenis) lenis.on('scroll', update); else window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  }
})();
