/* VySyn demos: shared motion core. Nothing in here is demo-specific.
   Plain features (menu, dead links, form, year) run first and never depend on GSAP.
   Motion setup is guarded: if it throws, the page drops to its static state. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var VS = (window.VS = { reduce: reduce, touch: touch, lenis: null, ready: false });

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Scroll helpers ---------- */
  VS.scrollTo = function (target) {
    if (VS.lenis) {
      VS.lenis.scrollTo(target, { duration: 1.1 });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  };

  /* ---------- 5. Nav ---------- */
  function nav() {
    var header = $('[data-header]');
    var toggle = $('.nav-toggle');
    var menu = $('#menu');

    function onScroll() {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
      root.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!toggle || !menu) return;

    function setOpen(open, returnFocus) {
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var label = $('[data-toggle-label]', toggle);
      if (label) label.textContent = open ? 'CLOSE' : 'MENU';
      if (VS.lenis) { if (open) VS.lenis.stop(); else VS.lenis.start(); }
      if (open) {
        var first = $('a, button', menu);
        if (first) first.focus({ preventScroll: true });
      } else if (returnFocus) {
        toggle.focus({ preventScroll: true });
      }
    }
    VS.closeMenu = function (returnFocus) { if (root.classList.contains('menu-open')) setOpen(false, returnFocus); };

    toggle.addEventListener('click', function () {
      setOpen(!root.classList.contains('menu-open'), true);
    });

    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setOpen(false, true); return; }
      if (e.key !== 'Tab') return;
      /* Keep focus inside the open menu and its button. */
      var items = [toggle].concat($$('a, button', menu));
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false, false);
    });
  }

  /* ---------- 6. Dead links and in-page links ---------- */
  function links() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (href === '#') { e.preventDefault(); return; }
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      if (VS.closeMenu) VS.closeMenu(false);
      VS.scrollTo(href === '#top' ? 0 : target);
      if (href !== '#top') {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- 7. Form and footer year ---------- */
  function form() {
    var f = $('#contact-form');
    if (!f) return;
    var done = $('.form-done');
    var messages = {
      name: { valueMissing: 'Add your name so I know who is writing.' },
      email: { valueMissing: 'Add an email so I can write back.', typeMismatch: 'That email does not look right. Check it?' },
      message: { valueMissing: 'Tell me a little about it first.' }
    };

    function errorEl(field) { return document.getElementById(field.id + '-error'); }

    function check(field) {
      var el = errorEl(field);
      if (!el) return true;
      var v = field.validity;
      var m = messages[field.name] || {};
      var text = '';
      if (field.required && !field.value.trim()) text = m.valueMissing || 'This one is needed.';
      else if (v.typeMismatch) text = m.typeMismatch || 'Check this one.';
      el.textContent = text;
      el.hidden = !text;
      field.setAttribute('aria-invalid', text ? 'true' : 'false');
      return !text;
    }

    var fields = $$('input[required], textarea[required]', f);
    fields.forEach(function (field) {
      field.addEventListener('blur', function () { if (field.value || field.getAttribute('aria-invalid') === 'true') check(field); });
      field.addEventListener('input', function () { if (field.getAttribute('aria-invalid') === 'true') check(field); });
    });

    function finish() {
      f.hidden = true;
      if (done) {
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus({ preventScroll: true });
      }
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (field) { if (!check(field) && !firstBad) firstBad = field; });
      if (firstBad) { firstBad.focus(); return; }

      var trap = f.querySelector('[name="_gotcha"]');
      var action = f.getAttribute('action') || '';
      /* Demo mode: no real endpoint yet, so show the finished state without posting. */
      if ((trap && trap.value) || action.indexOf('FORM_ID') !== -1) { finish(); return; }

      var btn = $('button[type="submit"]', f);
      if (btn) btn.disabled = true;
      fetch(action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (res) { if (!res.ok) throw new Error('send failed'); finish(); })
        .catch(function () {
          if (btn) btn.disabled = false;
          var fail = $('.form-fail', f);
          if (fail) fail.hidden = false;
        });
    });
  }

  function year() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  [nav, links, form, year].forEach(function (fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('VySyn core:', err); }
  });

  /* ---------- 1. Guard ---------- */
  try {
    if (!window.gsap || !window.ScrollTrigger) throw new Error('GSAP is not available');
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- 2. Lenis: wheel only, never on touch or reduced motion ---------- */
    if (window.Lenis && !touch && !reduce) {
      var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      VS.lenis = lenis;
    }

    if (!reduce) {
      /* ---------- 3. Reveal system ---------- */
      var FROM = {
        up: { y: 24 },
        fade: {},
        clip: { clipPath: 'inset(100% 0% 0% 0%)', opacity: 1 },
        wipe: { clipPath: 'inset(0% 100% 0% 0%)', opacity: 1 },
        left: { x: -40 },
        right: { x: 40 }
      };
      var DUR = { up: 0.9, fade: 0.9, clip: 1.0, wipe: 0.9, left: 0.9, right: 0.9 };
      var items = $$('[data-reveal]');

      items.forEach(function (el) {
        var kind = FROM[el.dataset.reveal] ? el.dataset.reveal : 'up';
        el.dataset.reveal = kind;
        gsap.set(el, FROM[kind]);
      });

      ScrollTrigger.batch(items, {
        start: 'top 86%',
        once: true,
        onEnter: function (batch) {
          /* After a jump (an in-page link, a fast flick), anything already above the screen
             just shows. Only what is on screen gets the staggered entrance. */
          var i = 0;
          batch.forEach(function (el) {
            var kind = el.dataset.reveal;
            var done = function () { gsap.set(el, { clearProps: 'transform,clipPath' }); el.classList.add('is-revealed'); };
            if (el.getBoundingClientRect().bottom < 0) {
              gsap.set(el, { opacity: 1 });
              done();
              return;
            }
            var to = { opacity: 1, x: 0, y: 0, duration: DUR[kind], ease: 'power3.out', overwrite: 'auto', onComplete: done };
            to.delay = Math.min(i, 8) * 0.08 + (parseFloat(el.dataset.revealDelay) || 0) / 1000;
            if (kind === 'clip' || kind === 'wipe') { to.clipPath = 'inset(0% 0% 0% 0%)'; to.ease = 'power3.inOut'; }
            gsap.to(el, to);
            i += 1;
          });
        }
      });

      /* ---------- 4. Parallax: photos and shapes only, 768px and up ---------- */
      var mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', function () {
        $$('[data-parallax]').forEach(function (el) {
          var f = parseFloat(el.dataset.parallax) || 0;
          f = Math.max(-0.16, Math.min(0.16, f));
          if (!f) return;
          var top = el.getBoundingClientRect().top + window.scrollY;
          var firstScreen = top < window.innerHeight;
          var dist = function () { return f * window.innerHeight; };
          if (firstScreen) {
            /* Already on screen at load: rest at zero and move away from there. */
            gsap.fromTo(el, { y: 0 }, {
              y: function () { return -dist(); },
              ease: 'none',
              scrollTrigger: { trigger: el, start: 0, end: 'bottom top', scrub: true, invalidateOnRefresh: true }
            });
          } else {
            gsap.fromTo(el, { y: function () { return dist() / 2; } }, {
              y: function () { return -dist() / 2; },
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
            });
          }
        });
      });
    }

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

    VS.ready = true;
    window.__vsReady = true;
  } catch (err) {
    root.classList.add('motion-failed');
    if (window.console) console.warn('VySyn motion is off:', err);
  }
})();
