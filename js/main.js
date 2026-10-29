/* =============================================================================
   PREY: THE ESCAPE — site behaviour
   Progressive enhancement only: every link, section and the APK download work
   without JavaScript. Nothing here ever autoplays audio.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- helpers ---------- */
  function hasFx() {
    return root.getAttribute('data-fx') !== 'off';
  }
  function hasReducedMotion() {
    return reduceMotion.matches;
  }
  function scrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  /* =======================================================================
     TERMINAL INTRO
     ======================================================================= */
  var terminal = document.getElementById('terminal');
  var terminalText = document.getElementById('terminalText');
  var terminalSkip = document.getElementById('terminalSkip');

  if (terminal && terminalText) {
    var introLines = [
      'PREY: THE ESCAPE',
      'Build 1.0.0 / testing',
      'Architecture: ARM64',
      'Minimum: Android 7.0 (API 24)',
      'Enumerator: F. S. I. Initiated.',
      'Scanning the district...',
      'Street lights: nominal',
      'Patrol routes: active',
      'Lock status: 4 of 4 sealed',
      'You woke up in the wrong place.',
      '',
      'Press SKIP INTRO to take control.',
      'Or wait — the crawl will begin on its own.',
      '',
      '',
      '',
    ];

    var idx = 0;
    var termTimer = null;
    var isReduced = hasReducedMotion();

    if (!isReduced) {
      function writeNext() {
        if (idx < introLines.length) {
          terminalText.textContent = introLines.slice(0, idx + 1).join('\n');
          idx += 1;
          var pause = 1100 + Math.random() * 500;
          if (idx === introLines.length - 1) {
            pause = 0;
          }
          termTimer = setTimeout(writeNext, pause);
        }
      }
      writeNext();
    } else {
      terminalText.textContent = introLines.join('\n');
    }

    function dismissTerminal() {
      if (terminal) terminal.hidden = true;
      if (document.body) document.body.classList.remove('is-locked');
      if (termTimer) { clearTimeout(termTimer); termTimer = null; }
    }

    if (terminalSkip) {
      terminalSkip.addEventListener('click', dismissTerminal);
    }
    if (!isReduced) {
      terminal.addEventListener('click', function (e) {
        if (e.target === terminal || e.target === terminalText) {
          dismissTerminal();
        }
      });
    }
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && terminal && !terminal.hidden) {
        dismissTerminal();
      }
    });
  }

  /* =======================================================================
     PAGE LOCK RELEASE — once the intro is gone, body scroll resumes
     ======================================================================= */
  function releasePageLock() {
    if (document.body) document.body.classList.remove('is-locked');
  }
  if (terminal) {
    var intCheck = setInterval(function () {
      if (terminal && terminal.hidden) {
        releasePageLock();
        clearInterval(intCheck);
      }
    }, 50);
  } else {
    releasePageLock();
  }

  /* =======================================================================
     REDUCED MOTION — honour the OS preference for the whole page
     ======================================================================= */
  if (hasReducedMotion()) {
    root.setAttribute('data-fx', 'off');
  }

  /* =======================================================================
     SCROLLSPY — highlight the nav link for the section in view
     ======================================================================= */
  var navAnchors = (function () {
    var list = [];
    var nav = document.getElementById('nav');
    if (nav) {
      var links = nav.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        if (href.charAt(0) === '#') {
          list.push({
            el: links[i],
            id: href.slice(1),
            matched: false
          });
        }
      }
    }
    return list;
  })();

  function updateScrollspy() {
    if (!navAnchors.length) return;
    var sections = [];
    for (var i = 0; i < navAnchors.length; i++) {
      var section = document.getElementById(navAnchors[i].id);
      if (section) sections.push({ id: navAnchors[i].id, el: section, anchor: navAnchors[i].el });
    }
    if (!sections.length) return;

    var offset = 120;
    var current = sections[0].id;
    for (var j = 0; j < sections.length; j++) {
      var rect = sections[j].el.getBoundingClientRect();
      if (rect.top - offset <= 0) {
        current = sections[j].id;
      }
    }
    for (var k = 0; k < navAnchors.length; k++) {
      var isActive = navAnchors[k].id === current;
      if (isActive !== navAnchors[k].matched) {
        navAnchors[k].matched = isActive;
        navAnchors[k].el.classList.toggle('is-active', isActive);
      }
    }
  }
  window.addEventListener('scroll', updateScrollspy, { passive: true });
  window.addEventListener('resize', updateScrollspy);
  updateScrollspy();

  /* =======================================================================
     MOBILE NAV
     ======================================================================= */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var navScrim = document.getElementById('navScrim');

  function closeMobileNav() {
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (nav) nav.classList.remove('is-open');
    if (navScrim) { navScrim.hidden = true; document.body.classList.remove('is-locked'); }
  }
  function openMobileNav() {
    if (burger) burger.setAttribute('aria-expanded', 'true');
    if (nav) nav.classList.add('is-open');
    if (navScrim) {
      navScrim.hidden = false;
      document.body.classList.add('is-locked');
    }
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var expanded = burger.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMobileNav(); else openMobileNav();
    });
  }
  if (navScrim) {
    navScrim.addEventListener('click', closeMobileNav);
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (href && href.charAt(0) === '#' && nav.classList.contains('is-open')) {
        closeMobileNav();
      }
    });
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) closeMobileNav();
  });

  /* =======================================================================
     SMOOTH SCROLL FOR IN-PAGE ANCHORS (fallback for older browsers)
     ======================================================================= */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (!href || href.charAt(0) !== '#') return;
    var target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + scrollY() - 70;
    window.scrollTo({ top: top, behavior: hasReducedMotion() ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', href);
  });

  /* =======================================================================
     FX TOGGLE (CRT / static layers)
     ======================================================================= */
  var fxToggle = document.getElementById('fxToggle');
  function syncFxChip() {
    if (!fxToggle) return;
    var on = hasFx();
    fxToggle.setAttribute('aria-pressed', String(on));
    root.setAttribute('data-crt', on ? 'on' : 'off');
  }
  if (fxToggle) {
    fxToggle.addEventListener('click', function () {
      var newOn = !hasFx();
      root.setAttribute('data-fx', newOn ? 'on' : 'off');
      syncFxChip();
    });
    syncFxChip();
  }

  /* =======================================================================
     SOUND TOGGLE — never autoplays; only starts after an explicit user click
     ======================================================================= */
  var soundToggle = document.getElementById('soundToggle');
  var audioEl = null;
  var soundStarted = false;

  function ensureAudio() {
    if (audioEl) return audioEl;
    try {
      audioEl = document.createElement('audio');
      audioEl.setAttribute('preload', 'none');
      audioEl.setAttribute('playsinline', '');
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
    } catch (e) {
      audioEl = null;
    }
    return audioEl;
  }

  function syncSoundChip() {
    if (!soundToggle) return;
    var wantedOn = root.getAttribute('data-sound') === 'on';
    soundToggle.setAttribute('aria-pressed', String(wantedOn));
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', function () {
      var wantedOn = root.getAttribute('data-sound') !== 'on';
      if (wantedOn) {
        var audio = ensureAudio();
        if (audio) {
          audio.volume = 0.5;
          var started = audio.play();
          if (started !== undefined) {
            started.catch(function () {
              // audio playback denied — leave it off, no error UX
            });
          }
          soundStarted = true;
        }
        root.setAttribute('data-sound', 'on');
      } else {
        if (audioEl) audioEl.pause();
        root.removeAttribute('data-sound');
      }
      syncSoundChip();
    });
    syncSoundChip();
  }

  /* =======================================================================
     CURSOR GLOW — desktop only, opt-in via hasFx()
     ======================================================================= */
  var cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow) {
    function shouldShowGlow() {
      return hasFx() && !hasReducedMotion() &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }
    function showGlow() {
      if (shouldShowGlow()) cursorGlow.classList.add('is-on');
    }
    function hideGlow() {
      cursorGlow.classList.remove('is-on');
    }
    document.addEventListener('mousemove', function (e) {
      var x = e.clientX;
      var y = e.clientY;
      cursorGlow.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      if (shouldShowGlow()) cursorGlow.classList.add('is-on');
    }, { passive: true });
    showGlow();
    window.addEventListener('blur', hideGlow);
  }

  /* =======================================================================
     GALLERY LIGHTBOX
     ======================================================================= */
  var gallery = document.getElementById('gallery');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCap = document.getElementById('lightboxCap');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var lbClose = document.getElementById('lbClose');

  var items = [];
  if (gallery) {
    var buttons = gallery.querySelectorAll('.shot');
    for (var i = 0; i < buttons.length; i++) {
      items.push({
        btn: buttons[i],
        src: buttons[i].getAttribute('data-full') || '',
        caption: buttons[i].getAttribute('data-caption') || '',
        index: i
      });
    }
  }

  function openLightbox(index) {
    if (!lightbox || !items.length) return;
    var item = items[index];
    if (!item) return;
    if (lightboxImg) lightboxImg.setAttribute('src', item.src);
    if (lightboxImg) lightboxImg.setAttribute('alt', item.caption);
    if (lightboxCap) lightboxCap.textContent = item.caption;
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    if (lbPrev) lbPrev.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    if (gallery) {
      var first = gallery.querySelector('.shot');
      if (first) first.focus();
    }
  }
  function moveLightbox(delta) {
    if (!items.length) return;
    var focused = -1;
    if (lightbox && document.activeElement) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].btn === document.activeElement) { focused = i; break; }
      }
    }
    var next = (focused + delta + items.length) % items.length;
    openLightbox(next);
  }

  if (gallery) {
    var shots = gallery.querySelectorAll('.shot');
    for (var s = 0; s < shots.length; s++) {
      (function (btn, idx) {
        btn.addEventListener('click', function () { openLightbox(idx); });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(idx);
          }
        });
      })(shots[s], s);
    }
  }
  if (lbPrev) lbPrev.addEventListener('click', function () { moveLightbox(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { moveLightbox(1); });
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  var closeTargets = [lightbox];
  if (lightbox) closeTargets.push(lightbox.querySelector('[data-close]'));
  for (var c = 0; c < closeTargets.length; c++) {
    (function (t) {
      t.addEventListener('click', function (e) {
        if (e.target === t || t.hasAttribute('data-close')) closeLightbox();
      });
    })(closeTargets[c]);
  }
  document.addEventListener('keydown', function (e) {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') moveLightbox(-1);
      else if (e.key === 'ArrowRight') moveLightbox(1);
    }
  });
  window.addEventListener('resize', function () {
    if (lightbox && !lightbox.hidden) {
      lightboxImg.style.maxHeight = Math.min(window.innerHeight * 0.78, 900) + 'px';
    }
  });

  /* =======================================================================
     FAQ ACCORDION
     ======================================================================= */
  var faqList = document.getElementById('faqList');
  if (faqList) {
    var faqItems = faqList.querySelectorAll('.faq__item');
    for (var f = 0; f < faqItems.length; f++) {
      (function (item) {
        var btn = item.querySelector('.faq__q');
        var panel = item.querySelector('.faq__a');
        if (!btn || !panel) return;
        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            btn.setAttribute('aria-expanded', 'false');
            panel.hidden = true;
          } else {
            btn.setAttribute('aria-expanded', 'true');
            panel.hidden = false;
          }
        });
      })(faqItems[f]);
    }
  }

  /* =======================================================================
     DOWNLOAD BUTTON FEEDBACK
     ======================================================================= */
  var downloadButtons = document.querySelectorAll('[data-download]');
  for (var d = 0; d < downloadButtons.length; d++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        // A real download is triggered by the browser when the link has an
        // href + download attribute. We only add a brief visual cue here.
        if (btn.classList) btn.classList.add('is-loading');
        window.setTimeout(function () {
          if (btn.classList) btn.classList.remove('is-loading');
        }, 900);
      });
    })(downloadButtons[d]);
  }

  /* =======================================================================
     TERMINAL/int ROSE — SKIP also works from keyboard focus on the page
     ======================================================================= */
  var fxOffBtn = document.getElementById('fxOffBtn');
  if (fxOffBtn) {
    fxOffBtn.addEventListener('click', function () {
      root.setAttribute('data-fx', 'off');
      if (fxToggle) {
        fxToggle.setAttribute('aria-pressed', 'false');
        root.removeAttribute('data-crt');
      }
    });
  }

})();
