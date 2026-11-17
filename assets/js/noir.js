/* Demo 1: GALLERY NOIR. Prints develop, color follows your eye. */
(function () {
  'use strict';
  var VS = window.VS || {};
  var gsap = window.gsap;
  var motion = !!(VS.ready && gsap && !VS.reduce);

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Signature: the hero prints develop, like paper in the tray. */
  if (motion) {
    gsap.fromTo('.develop',
      { opacity: 0, filter: 'blur(8px) brightness(1.7)' },
      { opacity: 1, filter: 'blur(0px) brightness(1)', duration: 1.3, stagger: 0.14, delay: 0.15, ease: 'power2.out', clearProps: 'filter' });
  }

  /* The black and white rule: a photo is in color while it sits in the middle 30% of the screen. */
  if ('IntersectionObserver' in window) {
    var lit = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-lit', e.isIntersecting); });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
    $$('.bw').forEach(function (el) { lit.observe(el); });

    /* The editor's pick gets circled when the contact sheet arrives. */
    var sheet = document.querySelector('[data-sheet]');
    if (sheet) {
      var draw = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          setTimeout(function () { sheet.classList.add('is-drawn'); }, 350);
          draw.disconnect();
        });
      }, { threshold: 0.5 });
      draw.observe(sheet);
    }
  } else {
    $$('[data-sheet]').forEach(function (el) { el.classList.add('is-drawn'); });
  }

  /* Filmstrip: drifts left by the amount it overflows. Scrubbed, never pinned. Touch keeps plain scrolling. */
  var film = document.querySelector('[data-film]');
  if (film && motion && !VS.touch) {
    var track = film.querySelector('.film-track');
    film.classList.add('is-scrub');
    film.removeAttribute('tabindex');
    gsap.to(track, {
      x: function () { return -Math.max(0, track.scrollWidth - film.clientWidth); },
      ease: 'none',
      scrollTrigger: { trigger: film, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
    });
  }

  /* Selected work: three sets, crossfade, arrow keys, no autoplay. */
  var slider = document.querySelector('[data-slider]');
  if (slider) {
    var sets = $$('[data-set]', slider);
    var prev = slider.querySelector('[data-prev]');
    var next = slider.querySelector('[data-next]');
    var bar = slider.querySelector('[data-progress]');
    var count = slider.querySelector('[data-count]');
    var index = 0;

    function show(i, dir) {
      index = (i + sets.length) % sets.length;
      sets.forEach(function (set, k) {
        var on = k === index;
        set.classList.toggle('is-active', on);
        set.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (bar) bar.style.transform = 'scaleX(' + (index + 1) / sets.length + ')';
      if (count) count.textContent = '0' + (index + 1);
      if (prev && next) {
        prev.classList.toggle('is-active', dir < 0);
        next.classList.toggle('is-active', dir >= 0);
      }
    }
    show(0, 1);
    if (prev) prev.addEventListener('click', function () { show(index - 1, -1); });
    if (next) next.addEventListener('click', function () { show(index + 1, 1); });
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 1); }
    });
  }
})();
