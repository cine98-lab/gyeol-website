// 결 GYEOL — motion: GSAP ScrollSmoother (smooth scroll) + ScrollTrigger parallax and reveals.
// Everything here is skipped when the visitor has "reduce motion" turned on.
(function () {
  'use strict';

  var HEADER = 68; // fixed header height (px), matches .top .wrap in style.css
  var smoother = null;
  var skipFocusScroll = null; // section we just moved focus to after an in-page link
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // In-page links (#story, #book …): glide with ScrollSmoother, stop below the fixed header.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();

    if (id === '#top') {
      if (smoother) smoother.scrollTo(0, true);
      else window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    } else if (smoother) {
      smoother.scrollTo(target, true, 'top ' + HEADER + 'px');
    } else {
      target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    history.replaceState(null, '', id);
    if (id !== '#top') {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      skipFocusScroll = target; // see onFocusIn below
      target.focus({ preventScroll: true });
    }
  });

  if (!window.gsap || !window.ScrollTrigger || !window.ScrollSmoother) return; // CDN failed: page still works
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  var $ = function (sel) { return gsap.utils.toArray(sel); };

  // Image moves inside its (overflow:hidden) frame while the frame crosses the screen.
  function imageParallax(frame, img, amount) {
    if (!frame || !img) return;
    gsap.set(img, { scale: 1.2 });
    gsap.fromTo(img, { yPercent: -amount }, {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  var mm = gsap.matchMedia();

  // ── All motion (any screen size) ────────────────────────────────────────────
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.2,        // seconds to catch up with the native scroll position
      smoothTouch: 0.1,   // light smoothing on phones
      effects: true,
      // ScrollSmoother re-centres any newly focused element that is off-screen. That would fight
      // the link glide above (focus moves to the section before the glide arrives), so skip it
      // just for that case; keyboard Tab focus still gets scrolled into view.
      onFocusIn: function (self, e) {
        if (e.target === skipFocusScroll) { skipFocusScroll = null; return false; }
      }
    });

    // 1. Hero intro on load
    var heroImg = document.querySelector('.hero-visual img');
    gsap.set(heroImg, { scale: 1.2 });
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } })
      .from('.hero-card', { y: 40, opacity: 0, duration: 1.1 }, 0)
      .from(heroImg, { scale: 1.45, duration: 2, ease: 'power2.out' }, 0)
      .from('.hero h1 .ln > span', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.25)
      .from(['.hero-kicker', '.hero-lead', '.hero .cta', '.hero-feats li'], { y: 24, opacity: 0, stagger: 0.08 }, 0.45)
      .from('.badge', { scale: 0, rotate: -90, duration: 0.9, ease: 'back.out(1.6)' }, 0.8)
      .from('.tag', { y: 30, opacity: 0 }, 0.9)
      .from('.hero-cats li', { y: 60, opacity: 0, stagger: 0.1 }, 0.6);

    // 2. Hero parallax while scrolling away: photo sinks, copy and badge rise at different speeds
    var heroScroll = { trigger: '.hero-card', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(heroImg, { yPercent: 9, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.hero-copy', { y: -90, ease: 'none', scrollTrigger: heroScroll });
    // (yPercent, not y/rotate: the intro above already animates y/rotate on these)
    gsap.to('.badge', { yPercent: -120, ease: 'none', scrollTrigger: heroScroll });
    gsap.to('.tag', { yPercent: -40, ease: 'none', scrollTrigger: heroScroll });

    // 3. Wood-grain band: lines drift sideways in opposite directions, like grain flowing
    $('.grain path').forEach(function (p, i) {
      gsap.to(p, {
        x: (i % 2 ? 1 : -1) * (24 + i * 6),
        ease: 'none',
        scrollTrigger: { trigger: '.grain', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    gsap.to('.grain .knot', {
      x: -60, ease: 'none',
      scrollTrigger: { trigger: '.grain', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // 4. Photos drifting inside their frames
    $('.circle').forEach(function (f) { imageParallax(f, f.querySelector('img'), 7); });
    $('.slide-img').forEach(function (f) { imageParallax(f, f.querySelector('img'), 6); });
    $('.proc-figs .ph').forEach(function (f) { imageParallax(f, f.querySelector('img'), 7); });
    imageParallax(document.querySelector('.house-fig'), document.querySelector('.house-fig img'), 8);

    // Big slide numbers float against the photos
    gsap.fromTo('.slide-num', { y: 60 }, {
      y: -60, ease: 'none',
      scrollTrigger: { trigger: '.slider', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // 5. Process timeline: the rule under each step draws in as you scroll
    var steps = $('.steps li');
    gsap.fromTo(steps, { '--line': 0 }, {
      '--line': 1, ease: 'none', stagger: 0.2,
      scrollTrigger: { trigger: '.steps', start: 'top 85%', end: 'top 40%', scrub: true }
    });

    // 6. Fade-up reveals, batched so items that enter together stagger
    var reveal = [
      '.story-head h2', '.story-head p', '.circles li > *', '.center-cta',
      '.benefits-title', '.benefits li > *',
      '.coll-head', '.slider', '.slider-foot',
      '#process .split > *', '.proc-figs .ph', '.proc-figs figcaption', '.steps li > *',
      '#house h2', '.house-fig', '#house .lead', '#house dl',
      '#book h2', '#book .muted', '.form > *',
      '.foot > *'
    ].join(',');
    gsap.set(reveal, { opacity: 0, y: 40 });
    ScrollTrigger.batch(reveal, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true });
      }
    });

    return function () { smoother = null; }; // matchMedia reverts everything above
  });

  // Items in a row (circles, process photos, promises) deliberately share one scroll speed:
  // staggered per-item speeds looked like single items drifting out of line.
  // Depth comes from the photos drifting inside their frames instead.

  // Layout settles after web fonts and images load: recalculate trigger positions.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
