/* Demo 2: EDITORIAL. The page turns color between spreads. */
(function () {
  'use strict';
  var VS = window.VS || {};
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var ready = !!(VS.ready && gsap && ScrollTrigger);
  var motion = ready && !VS.reduce;

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Signature: when a spread's top crosses 55% of the screen, the whole page takes its color. */
  if (ready) {
    $$('section[data-theme], footer[data-theme]').forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: function (self) { if (self.isActive) document.body.dataset.theme = sec.dataset.theme; }
      });
    });
  }

  /* Top bar: hides on the way down, returns on the way up. */
  var bar = document.querySelector('.topbar');
  if (bar) {
    var lastY = window.scrollY;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (Math.abs(y - lastY) > 6) {
          bar.classList.toggle('is-away', y > lastY && y > 240);
          lastY = y;
        }
        ticking = false;
      });
    }, { passive: true });
  }

  if (motion) {
    var mm = gsap.matchMedia();

    /* Hero: the name opens like curtains as you leave it. */
    mm.add('(min-width: 900px)', function () {
      var st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.name-1', { x: function () { return -0.06 * window.innerWidth; }, ease: 'none', scrollTrigger: st });
      gsap.to('.name-2', { x: function () { return 0.06 * window.innerWidth; }, ease: 'none', scrollTrigger: st });
      gsap.to('.hero-photo', { yPercent: 8, scale: 1.04, ease: 'none', scrollTrigger: st });
    });

    /* Pull quote: lines rise out of a mask, one at a time. */
    var lines = $$('[data-lines] .line-in');
    if (lines.length) {
      gsap.set(lines, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: '[data-lines]',
        start: 'top 78%',
        once: true,
        onEnter: function () { gsap.to(lines, { yPercent: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }); }
      });
    }

    /* How it works: the line draws as the section arrives. */
    var fill = document.querySelector('.timeline-fill');
    if (fill) {
      mm.add('(min-width: 900px)', function () {
        gsap.fromTo(fill, { scaleX: 0, scaleY: 1 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-timeline]', start: 'top 82%', end: 'top 38%', scrub: true } });
      });
      mm.add('(max-width: 899.98px)', function () {
        gsap.fromTo(fill, { scaleY: 0, scaleX: 1 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '[data-timeline]', start: 'top 78%', end: 'bottom 60%', scrub: true } });
      });
    }
  }

  /* Portfolio tabs: a real tablist with arrow keys. */
  var tablist = document.querySelector('[data-tabs]');
  if (tablist) {
    var tabs = $$('[role="tab"]', tablist);
    var line = tablist.querySelector('.tab-line');
    var busy = false;

    function panelOf(tab) { return document.getElementById(tab.getAttribute('aria-controls')); }
    function moveLine(tab) {
      if (!line) return;
      line.style.width = tab.offsetWidth + 'px';
      line.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function select(tab, focus) {
      var current = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
      if (focus) tab.focus();
      if (tab === current || busy) return;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      moveLine(tab);
      var from = panelOf(current);
      var to = panelOf(tab);
      var swap = function () {
        from.classList.remove('is-active', 'is-leaving');
        to.classList.add('is-active', 'is-entering');
        void to.offsetWidth;
        requestAnimationFrame(function () {
          to.classList.remove('is-entering');
          busy = false;
          if (ScrollTrigger) ScrollTrigger.refresh();
        });
      };
      if (VS.reduce) { swap(); return; }
      busy = true;
      from.classList.add('is-leaving');
      setTimeout(swap, 250);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    var place = function () { moveLine(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]); };
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  /* Headshots row: drag with a mouse. Touch keeps its own momentum. */
  var row = document.querySelector('[data-drag]');
  if (row) {
    var startX = 0;
    var startLeft = 0;
    var down = false;
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true;
      startX = e.clientX;
      startLeft = row.scrollLeft;
      row.classList.add('is-dragging');
      row.setPointerCapture(e.pointerId);
    });
    row.addEventListener('pointermove', function (e) {
      if (!down) return;
      row.scrollLeft = startLeft - (e.clientX - startX);
    });
    var end = function () { down = false; row.classList.remove('is-dragging'); };
    row.addEventListener('pointerup', end);
    row.addEventListener('pointercancel', end);
  }
})();
