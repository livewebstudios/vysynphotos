/* Demo 3: COLOR STORY. The runway speeds up with your scroll. */
(function () {
  'use strict';
  var VS = window.VS || {};
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var ready = !!(VS.ready && gsap && ScrollTrigger);
  var motion = ready && !VS.reduce;

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Hero: the two lines rise out of a mask, one after the other. */
  if (motion) {
    gsap.fromTo('.hero-title .rise', { yPercent: 105, opacity: 1 }, { yPercent: 0, duration: 0.9, stagger: 0.14, delay: 0.1, ease: 'power3.out' });
  }

  /* Signature: the runway. Loops at a calm 40px a second. Page scroll adds speed, up to three
     times, and scrolling up reverses it. Hover or focus eases it to a stop. */
  var runway = document.querySelector('[data-runway]');
  if (runway && motion && !VS.touch) {
    var track = runway.querySelector('.runway-track');
    var set = runway.querySelector('.runway-set');
    var BASE = 40;
    var x = 0;
    var rate = 1;        /* current multiplier, eased */
    var held = false;
    var visible = true;
    var lastY = window.scrollY;
    var setW = 0;

    runway.classList.add('is-live');
    runway.removeAttribute('role');
    runway.setAttribute('aria-label', 'Twelve looks, moving. Hover or focus to hold.');
    var measure = function () { setW = set.getBoundingClientRect().width; };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    runway.addEventListener('mouseenter', function () { held = true; });
    runway.addEventListener('mouseleave', function () { held = false; });
    runway.addEventListener('focusin', function () { held = true; });
    runway.addEventListener('focusout', function () { held = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(runway);
    }

    gsap.ticker.add(function (time, deltaTime) {
      var dt = Math.min(deltaTime, 100) / 1000;
      var y = window.scrollY;
      var v = dt > 0 ? (y - lastY) / dt : 0;   /* page scroll, px per second */
      lastY = y;
      if (!visible || !setW) return;
      var target = 1;
      if (held) target = 0;
      else if (Math.abs(v) > 20) target = (v < 0 ? -1 : 1) * (1 + Math.min(Math.abs(v) / 700, 2));
      rate += (target - rate) * Math.min(1, dt * 3.2);
      x -= BASE * rate * dt;
      if (x <= -setW) x += setW;
      if (x > 0) x -= setW;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
  }

  if (motion) {
    /* Statement: words turn from grey to ink as the block crosses the middle of the screen. */
    var quote = document.querySelector('[data-words]');
    if (quote) {
      var wordEls = $$('.w', quote);
      var styles = getComputedStyle(document.documentElement);
      var dim = styles.getPropertyValue('--word-dim').trim() || '#C9C5CE';
      var ink = styles.getPropertyValue('--text-on-light').trim() || '#111014';
      var purple = styles.getPropertyValue('--vs-purple').trim() || '#7A10BA';
      gsap.set(wordEls, { color: dim });
      var tl = gsap.timeline({ scrollTrigger: { trigger: quote, start: 'top 72%', end: 'bottom 42%', scrub: 0.4 } });
      wordEls.forEach(function (w, i) {
        tl.to(w, { color: w.classList.contains('w-key') ? purple : ink, duration: 1, ease: 'none' }, i * 0.7);
      });
    }

    /* The one cinematic moment: the wide photo drifts inside its frame. */
    var drift = document.querySelector('[data-drift]');
    if (drift) {
      gsap.fromTo(drift, { yPercent: -6.5 }, { yPercent: 6.5, ease: 'none', scrollTrigger: { trigger: drift.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    /* How it works: the purple line draws from left to right. */
    var fill = document.querySelector('.steps-fill');
    if (fill) {
      gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-steps]', start: 'top 80%', end: 'bottom 45%', scrub: true } });
    }
  }

  /* Color stories: the series in the middle of the screen is the live one. */
  if (ready) {
    var stories = $$('[data-story]');
    stories.forEach(function (story) {
      ScrollTrigger.create({
        trigger: story,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: function (self) {
          if (!self.isActive) return;
          stories.forEach(function (s) { s.classList.toggle('is-active', s === story); });
        }
      });
    });
  }

  /* Case studies: horizontal accordion. Hover, focus or tap opens a panel. */
  var acc = document.querySelector('[data-acc]');
  if (acc) {
    var panels = $$('.acc-panel', acc);
    var open = function (panel) {
      panels.forEach(function (p) {
        var on = p === panel;
        p.classList.toggle('is-open', on);
        p.querySelector('.acc-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    };
    var wide = window.matchMedia('(min-width: 900px)');
    var sync = function () {
      /* Stacked on small screens: every card is open, and says so. */
      if (!wide.matches) panels.forEach(function (p) { p.querySelector('.acc-btn').setAttribute('aria-expanded', 'true'); });
      else open(panels.filter(function (p) { return p.classList.contains('is-open'); })[0] || panels[0]);
    };
    panels.forEach(function (panel) {
      var btn = panel.querySelector('.acc-btn');
      btn.addEventListener('click', function () { if (wide.matches) open(panel); });
      btn.addEventListener('focus', function () { if (wide.matches) open(panel); });
      panel.addEventListener('mouseenter', function () { if (wide.matches) open(panel); });
    });
    wide.addEventListener('change', sync);
    sync();
  }
})();
