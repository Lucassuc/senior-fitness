/* ═══════════════════════════════════════════════════════════════
   健運動 — interactions
   No dependencies. Everything is progressive enhancement:
   if this file fails to load, the page still reads top to bottom.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Don't push ~9 MB of video at someone who has asked their browser to save
     data — they get the poster frame and an explicit tap-to-play instead. Only
     saveData, never an effectiveType guess: see the note in section 7. */
  var net = navigator.connection || {};

  /* ── 1 · opening curtain ─────────────────────────────────── */
  (function () {
    var curtain = $('#curtain');
    if (!curtain) return;
    var seen = false;
    try { seen = sessionStorage.getItem('jyd-seen') === '1'; } catch (e) {}
    if (seen || calm) {
      curtain.classList.add('curtain--skip');
    } else {
      try { sessionStorage.setItem('jyd-seen', '1'); } catch (e) {}
    }
    setTimeout(function () { curtain.classList.add('curtain--skip'); }, 2600);
  })();

  /* ── 1b · live month counters ────────────────────────────────
     The proof strip used to carry hardcoded month figures, which meant the
     page quietly started lying every 1st of the month. Each .stat__n[data-since]
     now recomputes elapsed WHOLE months from its start date, so 17/6 become
     18/7 on their own. Whole months only — a day short of the anniversary does
     not count, because the number sits next to a claim a 承辦人 could check. */
  (function () {
    var now = new Date();

    $$('.stat__n[data-since]').forEach(function (el) {
      var parts = (el.getAttribute('data-since') || '').split('-');
      if (parts.length !== 3) return;
      var y = +parts[0], m = +parts[1] - 1, d = +parts[2];
      if (isNaN(y) || isNaN(m) || isNaN(d)) return;

      var months = (now.getFullYear() - y) * 12 + (now.getMonth() - m);
      if (now.getDate() < d) months--;          /* anniversary not reached yet */
      if (months < 1) months = 1;

      /* first child is the digits; the 個月 unit lives in a sibling span */
      if (el.firstChild && el.firstChild.nodeType === 3) {
        el.firstChild.nodeValue = String(months);
      }
    });

    var stamp = $('#dataStamp');
    function paintStamp() {
      if (!stamp) return;
      var y = now.getFullYear(), m = now.getMonth();
      var MON = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
      stamp.textContent = document.documentElement.getAttribute('data-lang') === 'en'
        ? 'data as of ' + MON[m] + ' ' + y
        : '資料截至 ' + y + ' 年 ' + (m + 1) + ' 月';
    }
    paintStamp();
    document.addEventListener('jyd:lang', paintStamp);
  })();


  /* ── i18n helper for strings that only exist in JS ───────────
     Validation copy, button states and the submitted-summary labels are built
     here, not in the DOM, so the data-en sweep cannot reach them. */
  function isEN() { return document.documentElement.getAttribute('data-lang') === 'en'; }
  function t(zh, en) { return isEN() ? en : zh; }

  /* ── 1c · language toggle ────────────────────────────────────
     Translations live on the elements themselves as data-en, not in a keyed
     dictionary: a key map silently rots the moment someone edits copy, and this
     site's copy changes constantly. The Chinese original is stashed into
     data-zh on first switch, so the markup stays the single source of truth.
     Masked headlines carry data-en on the inner <i>, never on the heading —
     replacing the heading's innerHTML would destroy the .mask spans the reveal
     animation depends on. */
  (function () {
    var btn = $('#langBtn'); if (!btn) return;
    var KEY = 'jyd-lang';
    var title = document.querySelector('title');

    function apply(lang) {
      var en = lang === 'en';
      document.documentElement.lang = en ? 'en' : 'zh-Hant';

      $$('[data-en]').forEach(function (el) {
        if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML;
        el.innerHTML = en ? el.dataset.en : el.dataset.zh;
      });

      /* Attributes are not innerHTML and were being missed: placeholders and
         aria-labels stayed Chinese while every visible label around them had
         switched. */
      $$('[data-en-ph]').forEach(function (el) {
        if (el.dataset.zhPh === undefined) el.dataset.zhPh = el.getAttribute('placeholder') || '';
        el.setAttribute('placeholder', en ? el.dataset.enPh : el.dataset.zhPh);
      });
      $$('[data-en-aria]').forEach(function (el) {
        if (el.dataset.zhAria === undefined) el.dataset.zhAria = el.getAttribute('aria-label') || '';
        el.setAttribute('aria-label', en ? el.dataset.enAria : el.dataset.zhAria);
      });
      /* alt text is what a blind visitor is read instead of the photograph —
         leaving 15 Chinese descriptions in an English page fails exactly the
         reader who has no other way in. */
      $$('[data-en-alt]').forEach(function (el) {
        if (el.dataset.zhAlt === undefined) el.dataset.zhAlt = el.getAttribute('alt') || '';
        el.setAttribute('alt', en ? el.dataset.enAlt : el.dataset.zhAlt);
      });

      if (title && title.dataset.en) {
        if (title.dataset.zh === undefined) title.dataset.zh = title.textContent;
        title.textContent = en ? title.dataset.en : title.dataset.zh;
      }

      /* The chapter chip is painted from a JS array, not from the DOM, so it
         would otherwise stay Chinese in English mode. Flag the language and let
         the scroll handler repaint on the next frame. */
      document.documentElement.setAttribute('data-lang', en ? 'en' : 'zh');

      /* Swap the embedded dashboard, if an English workbook is provided. The
         iframe may already exist, so update both the pending src and the live
         one. */
      var box = $('#dashFrame');
      if (box && box.getAttribute('data-src-en')) {
        var want = en ? box.getAttribute('data-src-en') : box.getAttribute('data-src-zh');
        if (want) {
          box.setAttribute('data-src', want);
          var live = box.querySelector('iframe');
          if (live) {
            live.src = want + '?:embed=y&:showVizHome=no&:tabs=no&:toolbar=bottom&:display_count=n&:origin=viz_share_link&:device=desktop';
          }
        }
      }
      /* Some links are a different URL per language rather than a different
         label: the dashboard workbook, and the contact links, whose prefilled
         subject and body have to be written in the language the reader is
         reading. Generic sweep so any link can carry one. */
      $$('[data-href-en]').forEach(function (el) {
        if (el.dataset.zhHref === undefined) {
          el.dataset.zhHref = el.getAttribute('data-href-zh') || el.getAttribute('href') || '';
        }
        el.setAttribute('href', en ? el.dataset.hrefEn : el.dataset.zhHref);
      });

      btn.textContent = en ? '中' : 'EN';
      btn.setAttribute('aria-label', en ? 'Switch to Chinese' : '切換為英文');
      btn.setAttribute('lang', en ? 'zh-Hant' : 'en');

      try { localStorage.setItem(KEY, en ? 'en' : 'zh'); } catch (e) {}

      /* Anything painted from JS rather than from the DOM has to be told. The
         chapter chip listens for this; without it the chip kept the language it
         had when its section was entered and only corrected itself on the next
         scroll frame. */
      document.dispatchEvent(new CustomEvent('jyd:lang', { detail: { en: en } }));
    }

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved === 'en' ? 'en' : 'zh');

    btn.addEventListener('click', function () {
      apply(document.documentElement.lang === 'en' ? 'zh' : 'en');
    });
  })();

  /* ── 2 · reveal on scroll ────────────────────────────────── */
  (function () {
    /* .hero--type__title (course.html) belongs here for the same reason
       .hero__title does: it wraps its lines in .mask, and a mask stays
       translated out of view until its parent gets .is-in. Leave it out and the
       headline renders as blank space at full height. */
    var targets = $$('[data-reveal], .h2, .statement, .hero__title, .hero--type__title, .foot__me');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });

    /* Anything already in view on load fires immediately via the observer, but
       the hero should never wait on a scroll event.
       The rAF is deliberate — it lets one frame paint in the pre-animation
       state so the entrance actually animates instead of snapping. The catch:
       a document that loads while hidden (background tab, restored session)
       never gets that frame, and a masked headline left un-revealed renders as
       blank space at full height. So repeat it on visibilitychange: a missing
       hero is far worse than a skipped animation. */
    function revealHero() {
      $$('.hero [data-reveal], .hero__title, .hero--type [data-reveal], .hero--type__title')
        .forEach(function (el) { el.classList.add('is-in'); });
    }
    requestAnimationFrame(revealHero);
    if (document.hidden) {
      document.addEventListener('visibilitychange', function once() {
        if (document.hidden) return;
        revealHero();
        document.removeEventListener('visibilitychange', once);
      });
    }
  })();

  /* ── 3 · scroll progress + nav state ─────────────────────── */
  (function () {
    var bar  = $('#progress i');
    var nav  = $('#nav');
    var hero = $('.hero');
    var media = $('.hero__media');
    var heroBody = $('.hero__body');

    /* The bar is transparent over the hero and only turns solid once a section
       has arrived under it. That switch was keyed to .hero, which exists on the
       index page and not on course.html — its hero is .hero--type — so on the
       course page the bar never went solid and the white brand, links and
       burger sat invisibly on top of the white 為什麼有這個計畫 section. Both
       heroes trip it now. The parallax blocks below stay keyed to .hero via
       their own null-guarded media/heroBody lookups. */
    var navTrip = $('.hero, .hero--type');

    /* The type hero is pinned (see the CSS note), so without this it would just
       sit frozen while the page slid over it. Same easing-out the index hero
       gets, so the overlap reads as depth rather than a stuck element. The
       collision fix is the sticky positioning itself, not this — so a reader on
       prefers-reduced-motion loses the fade and keeps the fix. */
    var typeHero = $('.hero--type');
    var typeHeroBody = typeHero && typeHero.querySelector('.wrap');

    var chip = $('#chapter'), chipNo = $('#chapterNo'), chipName = $('#chapterName');
    var foot = $('.foot'), shownChapter = -1, shownLang = null;
    /* Keep these numbers in step with the section eyebrows and the menu — and
       keep the array in document order, since the loop below takes the last
       entry whose top has passed the threshold. */
    /* en names alongside: this chip is painted from JS, so without them it
       stayed Chinese while the rest of the page was English. */
    var CHAPTERS = [
      { sel: '#gap',      no: '01', name: '問題',       en: 'The problem' },
      { sel: '#how',      no: '02', name: '怎麼運作',   en: 'How it works' },
      { sel: '#video',    no: '03', name: '每天十分鐘', en: 'Ten minutes a day' },
      { sel: '#story',    no: '04', name: '不只是運動', en: 'More than exercise' },
      { sel: '#data',     no: '05', name: '成效',       en: 'Results' },
      { sel: '#findings', no: '05', name: '前後測',     en: 'Pre & post' },
      { sel: '#about',    no: '06', name: '關於這個專案', en: 'About' },
      { sel: '#offer',    no: '07', name: '合作內容',   en: 'What you get' },
      { sel: '#book',     no: '—',  name: '合作洽詢',   en: 'Partner with us' }
    ].map(function (c) { c.el = $(c.sel); return c; });

    /* Photo-grid drift. Applied to the frame, not the card: .shot carries
       data-reveal, whose 0.55s transform transition would smear a per-frame
       parallax. And not to the <img> either — that would need a scale to hide
       the edges, i.e. cropping, which this grid deliberately avoids. */
    var shots = $$('#grid .shot__img');
    var links = $$('.nav__links a');
    /* Only in-page anchors have a section to track. course.html's bar points at
       index.html#how and at course.html itself, and "index.html#how" is a legal
       CSS selector (element index, class html, id how) that quietly matches
       nothing — so this used to hand back a list of nulls. */
    var secs = links.map(function (a) {
      var href = a.getAttribute('href') || '';
      return href.charAt(0) === '#' ? $(href) : null;
    });

    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var doc = document.documentElement.scrollHeight - window.innerHeight;

      if (bar) bar.style.width = (doc > 0 ? Math.min(1, y / doc) * 100 : 0) + '%';

      if (nav && navTrip) {
        var trip = navTrip.offsetHeight - 72;
        nav.classList.toggle('is-solid', y > trip);
      }

      /* The hero is pinned, so the next section slides up over it. Without this
         the wordmark just gets guillotined — fading and easing it back makes the
         overlap read as depth instead of a clipping bug. */
      if (heroBody && hero && !calm) {
        var hp = Math.max(0, Math.min(1, y / (hero.offsetHeight || 1)));
        heroBody.style.opacity = (1 - hp * 0.9).toFixed(3);
        heroBody.style.transform = 'scale(' + (1 - hp * 0.05).toFixed(4) + ')';
      }

      if (typeHeroBody && typeHero && !calm) {
        var tp = Math.max(0, Math.min(1, y / (typeHero.offsetHeight || 1)));
        typeHeroBody.style.opacity = (1 - tp * 0.9).toFixed(3);
        typeHeroBody.style.transform = 'scale(' + (1 - tp * 0.05).toFixed(4) + ')';
      }

      /* hero parallax — desktop only: on phones the photo sits in normal flow,
         so shifting it would just tear a gap above the type. */
      if (media && hero && !calm) {
        if (window.innerWidth >= 810) {
          var p = Math.max(0, Math.min(1, y / hero.offsetHeight));
          media.style.transform = 'translate3d(0,' + (-p * 12).toFixed(2) + '%,0)';
        } else if (media.style.transform) {
          media.style.transform = '';
        }
      }

      /* gentle drift on the timeline cards — depth without cropping anyone */
      if (!calm && shots.length) {
        var vh = window.innerHeight;
        for (var i = 0; i < shots.length; i++) {
          var sr = shots[i].getBoundingClientRect();
          if (sr.bottom < -80 || sr.top > vh + 80) continue;
          var t = (sr.top + sr.height / 2 - vh / 2) / vh;      /* -0.5 … 0.5 */
          shots[i].style.transform =
            'translate3d(0,' + (t * -14).toFixed(1) + 'px,0)';
        }
      }

      /* active section in the desktop nav */
      var mid = y + window.innerHeight * 0.35;
      var best = -1;
      secs.forEach(function (s, i) {
        if (s && s.offsetTop <= mid) best = i;
      });
      /* aria-current marks a whole page, not a scroll position. course.html
         ships is-here on 青年培訓 in the markup and this loop was stripping it
         on the first frame, which left that link with no underline at all. */
      links.forEach(function (a, i) {
        if (a.getAttribute('aria-current') === 'page') return;
        a.classList.toggle('is-here', i === best);
      });

      /* chapter marker: hidden over the hero and once the footer arrives */
      if (chip) {
        var at = -1;
        CHAPTERS.forEach(function (c, i) {
          if (c.el && c.el.getBoundingClientRect().top <= window.innerHeight * 0.45) at = i;
        });
        var footTop = foot ? foot.getBoundingClientRect().top : Infinity;
        var show = at >= 0 && footTop > window.innerHeight * 0.6;
        /* compare language too, so toggling repaints the chip instead of
           leaving whichever language was current when the section was entered */
        var lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
        if (at >= 0 && (at !== shownChapter || lang !== shownLang)) {
          chipNo.textContent = CHAPTERS[at].no;
          chipName.textContent = lang === 'en' ? (CHAPTERS[at].en || CHAPTERS[at].name) : CHAPTERS[at].name;
          shownChapter = at;
          shownLang = lang;
        }
        chip.classList.toggle('is-on', show);
      }
    }

    /* The marker is fixed to the bottom-left, so on a phone it sits permanently
       on top of whatever is written there — it was covering the .stats__note
       under the proof strip and the LINE panel's fine print. It is only useful
       while the reader is travelling, so it now fades out once they stop and
       comes back on the next scroll. */
    var idleTimer = null;
    function wake() {
      if (!chip) return;
      chip.classList.remove('is-idle');
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { chip.classList.add('is-idle'); }, 1100);
    }

    function onScroll() {
      wake();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Repaint the chapter chip the moment the language changes, rather than
       waiting for the next scroll frame. frame() is called directly here on
       purpose — routing through rAF would leave the chip stale in a background
       tab, which is exactly where the language is often set. */
    document.addEventListener('jyd:lang', function () {
      shownChapter = -1;
      shownLang = null;
      frame();
    });
    window.addEventListener('resize', onScroll, { passive: true });
    frame();
  })();

  /* ── 4 · focus trap helper ───────────────────────────────── */
  function trap(box) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', box)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    box.addEventListener('keydown', onKey);
    return function () { box.removeEventListener('keydown', onKey); };
  }

  /* ── 5 · fullscreen menu ─────────────────────────────────── */
  (function () {
    var menu = $('#menu'), burger = $('#burger'), nav = $('#nav');
    if (!menu || !burger) return;
    var items = $$('.menu__list a', menu);
    var untrap = null, back = null;

    items.forEach(function (a, i) { a.style.setProperty('--d', (80 + i * 60) + 'ms'); });

    function open() {
      back = document.activeElement;
      menu.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      if (nav) nav.classList.add('is-menu');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', '關閉選單');
      untrap = trap(menu);
      setTimeout(function () { if (items[0]) items[0].focus(); }, 220);
    }
    function close() {
      menu.classList.remove('is-open');
      if (nav) nav.classList.remove('is-menu');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', '開啟選單');
      document.body.classList.remove('is-locked');
      if (untrap) { untrap(); untrap = null; }
      setTimeout(function () { menu.hidden = true; }, calm ? 0 : 600);
      if (back && back.focus) back.focus();
    }
    function isOpen() { return burger.getAttribute('aria-expanded') === 'true'; }

    burger.addEventListener('click', function () { isOpen() ? close() : open(); });
    items.forEach(function (a) { a.addEventListener('click', close); });
    $$('.menu__foot a', menu).forEach(function (a) { a.addEventListener('click', close); });
    /* the 預約 pill lives in the bar, above the menu — it must dismiss it too */
    $$('.nav__right .btn, .nav__brand, .nav__links a').forEach(function (a) {
      a.addEventListener('click', function () { if (isOpen()) close(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close();
    });
  })();

  /* ── 6 · Tableau dashboard, loaded when it comes near ────── */
  (function () {
    var box = $('#dashFrame'), zoom = $('#dashZoom'), fig = $('.dash');
    if (!box || !zoom) return;
    var loaded = false;
    var CANVAS = 1654;   /* the dashboard's authored width */

    /* Two states, split at the site's own 810px breakpoint. Wide: scale the canvas
       down to fit the column, as before. Narrow: leave it at 1:1 and let the panel
       pan sideways, so a phone gets the same dashboard a desktop does rather than a
       shrunken or re-laid-out one. Neither state scrolls vertically inside the
       frame, so an up/down swipe always belongs to the page. */
    var narrow = window.matchMedia('(max-width: 809px)');

    function fit() {
      if (narrow.matches) {
        fig.classList.remove('dash--fit');
        fig.classList.add('dash--pan');
        box.style.setProperty('--dz', '1');
        return;
      }
      fig.classList.remove('dash--pan');
      var dz = Math.min(1, box.clientWidth / CANVAS);
      box.style.setProperty('--dz', dz.toFixed(4));
      fig.classList.add('dash--fit');
    }

    function load() {
      if (loaded) return;
      loaded = true;
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-src')
        + '?:embed=y&:showVizHome=no&:tabs=no&:toolbar=bottom&:display_count=n&:origin=viz_share_link&:device=desktop';
      f.title = t('前後測儀表板（Tableau Public）', 'Pre- and post-test dashboard (Tableau Public)');
      f.loading = 'lazy';
      f.setAttribute('allowfullscreen', '');
      f.addEventListener('load', function () {
        var l = $('.dash__load', box);
        if (l) l.style.display = 'none';
      });
      zoom.appendChild(f);
    }

    fit();
    window.addEventListener('resize', fit, { passive: true });
    /* A rotation fires resize, but the breakpoint itself is the thing that has to
       be caught, and a coalesced resize can miss it. addListener is the old
       spelling, still the only one on iOS before 14. */
    if (narrow.addEventListener) narrow.addEventListener('change', fit);
    else if (narrow.addListener) narrow.addListener(fit);

    if (!('IntersectionObserver' in window)) { load(); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { load(); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(box);
  })();

  /* ── 7 · the two short clips ─────────────────────────────── */
  (function () {
    var figs = $$('.short');
    if (!figs.length) return;

    /* Autoplay is the whole point of this section, so the only thing that holds
       it back is Save-Data — an explicit request from the reader rather than a
       guess about them. This used to gate on effectiveType too, but that reports
       3g on plenty of usable connections and nothing at all in Safari or
       Firefox, so it silently suppressed the one thing the section exists to do.
       prefers-reduced-motion deliberately does not suppress it either: these are
       muted content clips the reader scrolled to on purpose, not decorative UI
       motion. The tap control is always there either way. */
    var auto = !net.saveData;

    var pending = [];   /* plays a browser refused without a user gesture */
    function queue(fn) { if (pending.indexOf(fn) === -1) pending.push(fn); }
    function flush() {
      if (!pending.length) return;
      var q = pending.slice();
      pending.length = 0;
      q.forEach(function (fn) { fn(); });
    }

    /* Deliberately NOT { once: true }, which is how this used to be wired and
       why it could fail outright: on iOS in Low Power Mode the reader's first
       touch *is* the scroll that brings the clips into view, so a one-shot
       listener was already spent before anything had been queued, and the retry
       then never ran at all. */
    ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, flush, { passive: true });
    });

    figs.forEach(function (fig) {
      var v = $('video', fig), tap = $('.short__tap', fig);
      if (!v) return;
      var wired = false;
      var want = false;   /* in view and meant to be running */

      /* Both clips fade to black before they end — short-1 is dark for its last
         seven seconds of twenty. Looping the whole file means the tile sits
         black for a third of the cycle, so we loop the live part only. Adjust
         data-end in the markup if the clips are re-cut. */
      var stop = parseFloat(v.getAttribute('data-end'));
      if (stop > 0) {
        v.addEventListener('timeupdate', function () {
          if (v.currentTime >= stop) v.currentTime = 0;
        });
      }

      function source() {
        if (wired) return;
        wired = true;
        v.src = v.getAttribute('data-src');
      }

      function play() {
        want = true;
        source();
        var p = v.play();
        if (p && p.catch) p.catch(function () {
          /* Autoplay refused. The poster is gone the moment a frame decodes, and
             both clips open on a dark title card — so park on a live frame
             rather than leaving an empty navy box under the play button, and
             queue a retry for the reader's first interaction. */
          fig.classList.remove('is-playing');
          if (v.currentTime < 0.1) { try { v.currentTime = 3; } catch (e) {} }
          queue(play);
        });
        fig.classList.add('is-playing');
      }
      /* want goes false before the pause, so nothing below tries to undo it */
      function pause() { want = false; v.pause(); fig.classList.remove('is-playing'); }

      /* preload="none" means the first play() can land before there is a single
         frame to work with. Try again the moment the element is really playable. */
      ['loadeddata', 'canplay'].forEach(function (ev) {
        v.addEventListener(ev, function () { if (want && v.paused) play(); });
      });

      /* A tab that loaded in the background can have autoplay refused outright,
         and some browsers pause video while hidden. Pick it back up on return. */
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && want && v.paused) play();
      });

      if (tap) {
        tap.addEventListener('click', function () {
          v.paused ? play() : pause();
        });
      }

      /* no observer (very old browser) — just run, the clips are the content */
      if (!('IntersectionObserver' in window)) { if (auto) play(); return; }
      /* rootMargin starts them a little before they arrive, so the clip is
         already moving by the time it is actually on screen */
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (auto) play(); }
        else pause();
      }, { threshold: 0.15, rootMargin: '20% 0px' });
      io.observe(fig);
    });
  })();

  /* ── 8 · 1-minute film — click to load YouTube ───────────── */
  (function () {
    var box = $('#filmBox');
    if (!box) return;
    var poster = box.innerHTML;          /* keep, so closing can restore it */
    var id = box.getAttribute('data-yt');

    function open() {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id +
              '?autoplay=1&rel=0&modestbranding=1&playsinline=1&hl=zh-TW';
      f.title = t('健運動一分鐘介紹影片', 'JianYunDong — one-minute introduction');
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.setAttribute('allowfullscreen', '');
      f.referrerPolicy = 'strict-origin-when-cross-origin';

      /* YouTube's own controls sit inside the iframe and are easy to miss on a
         phone. This is an unambiguous way out: removing the iframe stops
         playback outright and puts the poster back. */
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'film__close';
      x.setAttribute('aria-label', '關閉影片');
      x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M6 6l12 12M18 6 6 18"/></svg>';
      x.addEventListener('click', close);

      box.innerHTML = '';
      box.appendChild(f);
      box.appendChild(x);
      box.classList.add('is-live');
      x.focus();
    }

    function close() {
      box.innerHTML = poster;            /* tearing out the iframe stops it */
      box.classList.remove('is-live');
      bind();
      var p = box.querySelector('.film__play');
      if (p) p.focus();
    }

    function bind() {
      var p = box.querySelector('.film__play');
      if (p) p.addEventListener('click', open);
    }

    bind();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-live')) close();
    });
  })();

  /* ── 8b · masonry for the photo grid (≥810px only) ────────
     Photos keep their own aspect ratios, so rows would otherwise be ragged.
     Below 810px it is a single column and this does nothing. */
  (function () {
    var grid = $('#grid');
    if (!grid) return;
    var items = $$('.shot', grid);
    var ROW = 8;

    function layout() {
      if (window.innerWidth < 810) {
        items.forEach(function (it) { it.style.removeProperty('--span'); });
        return;
      }
      var gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      items.forEach(function (it) {
        it.style.setProperty('--span', '1');           /* measure unconstrained */
        var h = it.getBoundingClientRect().height;
        it.style.setProperty('--span', Math.ceil((h + 40) / (ROW + gap)));
      });
    }

    var t;
    function debounced() { clearTimeout(t); t = setTimeout(layout, 120); }

    layout();
    window.addEventListener('resize', debounced, { passive: true });
    /* images arrive late and change the height they occupy */
    $$('img', grid).forEach(function (im) {
      if (!im.complete) im.addEventListener('load', debounced, { once: true });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  })();

  /* ── 9 · photo lightbox ──────────────────────────────────── */
  (function () {
    var lb = $('#lb'); if (!lb) return;
    var btns  = $$('.shot button');
    var img   = $('#lbImg'), date = $('#lbDate'), title = $('#lbTitle'), count = $('#lbCount');
    var prev  = $('#lbPrev'), next = $('#lbNext'), x = $('#lbClose');
    if (!btns.length) return;

    var shots = btns.map(function (b) {
      var im = $('img', b);
      return {
        src: im.getAttribute('src').replace('-md.jpg', '-lg.jpg'),
        alt: im.getAttribute('alt'),
        date: $('em', b).textContent.trim(),
        title: $('b', b).textContent.trim()
      };
    });
    /* Captions are snapshotted from the DOM at load, so a language switch left
       the lightbox showing the previous language. Rebuild on the event. */
    function rebuild() {
      shots = btns.map(function (b) {
        var im = $('img', b);
        return {
          src: im.getAttribute('src').replace('-md.jpg', '-lg.jpg'),
          alt: im.getAttribute('alt'),
          date: $('em', b).textContent.trim(),
          title: $('b', b).textContent.trim()
        };
      });
    }
    document.addEventListener('jyd:lang', rebuild);

    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var i = 0, untrap = null, back = null;

    function show(n) {
      i = (n + shots.length) % shots.length;
      var s = shots[i];
      img.setAttribute('src', s.src);
      img.setAttribute('alt', s.alt);
      date.textContent = s.date;
      title.textContent = s.title;
      count.textContent = pad(i + 1) + ' / ' + pad(shots.length);
      /* re-run the entry animation */
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = '';
    }
    function open(n) {
      back = document.activeElement;
      lb.hidden = false;
      document.body.classList.add('is-locked');
      show(n);
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      untrap = trap(lb);
      x.focus();
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (untrap) { untrap(); untrap = null; }
      setTimeout(function () { lb.hidden = true; }, calm ? 0 : 350);
      if (back && back.focus) back.focus();
    }

    btns.forEach(function (b, n) {
      b.addEventListener('click', function () { open(n); });
    });
    x.addEventListener('click', close);
    prev.addEventListener('click', function () { show(i - 1); });
    next.addEventListener('click', function () { show(i + 1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb__fig')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });

    /* swipe */
    var x0 = null, y0 = null;
    lb.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
      x0 = y0 = null;
    }, { passive: true });
  })();

  /* ── 10 · 合作洽詢 form ───────────────────────────────────────
     Was a date/time/place booking form. A 據點 does not commit to a slot before
     anyone has spoken, so this collects who they are and what they need; the
     scheduling itself happens afterwards on LINE. The Make webhook is unchanged
     but the field set is not — the scenario has to be re-mapped to match the
     names posted below. */
  (function () {
    var form = $('#form'); if (!form) return;

    var HOOK = 'https://hook.us2.make.com/n4mpjgv5wvijbfcgd2bj3efpc38n1p1s';

    var org = $('#f-org'), who = $('#f-who'), phone = $('#f-phone'),
        contact = $('#f-contact'), place = $('#f-place'), count = $('#f-count'),
        cond = $('#f-cond'), need = $('#f-need'), when = $('#f-when'), note = $('#f-note'),
        trap_ = $('#f-trap'),
        submit = $('#submit'), done = $('#done'), recap = $('#recap'), again = $('#again');

    var RULES = [
      { el: org,     err: '#e-org',     msg: '請填寫單位或據點名稱。', en: 'Please enter your organisation or care station name.',
        ok: function (v) { return v.trim().length >= 2; } },
      { el: who,     err: '#e-who',     msg: '請填寫承辦人姓名與職稱。', en: 'Please enter your name and role.',
        ok: function (v) { return v.trim().length >= 1; } },
      { el: phone,   err: '#e-phone',   msg: '請填寫聯絡電話。', en: 'Please enter a phone number.',
        ok: function (v) { return v.replace(/[^0-9]/g, '').length >= 8; } },
      { el: contact, err: '#e-contact', msg: '請留一個 Email —— 我的回覆會寄到那裡。', en: 'Please leave an email — my reply goes there.',
        ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { el: place,   err: '#e-place',   msg: '請填寫據點地點。', en: 'Please tell us where you are.',
        ok: function (v) { return v.trim().length >= 2; } }
    ];

    function mark(rule, bad, text) {
      var box = $(rule.err);
      if (box) {
        box.textContent = bad ? (text || t(rule.msg, rule.en || rule.msg)) : '';
        box.classList.toggle('is-on', !!bad);
      }
      if (bad) rule.el.setAttribute('aria-invalid', 'true');
      else rule.el.removeAttribute('aria-invalid');
    }

    function check(rule, quiet) {
      var v = rule.el.value || '';
      var bad = !rule.ok(v);
      if (!quiet) mark(rule, bad, rule.msg);
      return !bad;
    }

    RULES.forEach(function (r) {
      r.el.addEventListener('blur', function () { check(r); });
      r.el.addEventListener('input', function () {
        if (r.el.getAttribute('aria-invalid')) check(r);
      });
      r.el.addEventListener('change', function () {
        if (r.el.getAttribute('aria-invalid')) check(r);
      });
    });

    function fail(msg) {
      var box = $('#e-form');
      box.textContent = msg;
      box.classList.add('is-on');
    }

    function send(body) {
      /* Try a normal request first so real errors surface. Make's webhook may not
         send CORS headers, in which case retry opaquely — the POST still lands. */
      return fetch(HOOK, { method: 'POST', body: body })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return true;
        })
        .catch(function () {
          return fetch(HOOK, { method: 'POST', mode: 'no-cors', body: body }).then(function () { return true; });
        });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $('#e-form').classList.remove('is-on');

      if (trap_ && trap_.value) return;           /* bot */

      var bad = RULES.filter(function (r) { return !check(r); });
      if (bad.length) {
        bad[0].el.focus();
        fail(t('還有 ' + bad.length + ' 個欄位需要補上。', bad.length + ' field' + (bad.length>1?'s':'') + ' still needed.'));
        return;
      }

      /* The recap below is built from this map, so the order here is the order
         the reader sees it played back in. */
      var L = isEN()
        ? ['Organisation','Contact person','Phone','Email / LINE','Location',
           'Number of elders','General condition','Most interested in','Ideal start','Notes']
        : ['單位／據點','承辦人','聯絡電話','Email／LINE','據點地點',
           '長輩人數','長輩健康情形','想先了解','期望開始時間','其他需求'];
      var V = [org.value.trim(), who.value.trim(), phone.value.trim(), contact.value.trim(),
               place.value.trim(), count.value.trim(), cond.value, need.value,
               when.value.trim(), note.value.trim()];
      var fields = {};
      L.forEach(function (k, i) { fields[k] = V[i]; });

      var summary = Object.keys(fields).map(function (k) {
        return k + '：' + (fields[k] || '（未填）');
      }).join('／');

      var body = new URLSearchParams({
        form_type: '據點合作洽詢',
        org: org.value.trim(),
        inviter: who.value.trim(),
        phone: phone.value.trim(),
        contact: contact.value.trim(),
        place: place.value.trim(),
        count: count.value.trim(),
        condition: cond.value,
        need: need.value,
        start: when.value.trim(),
        note: note.value.trim(),
        summary: summary,
        submitted_at: new Date().toISOString(),
        source: location.href
      });

      submit.disabled = true;
      $('span', submit).textContent = t('送出中…', 'Sending…');

      send(body).then(function () {
        recap.innerHTML = '';
        Object.keys(fields).forEach(function (k) {
          if (!fields[k]) return;
          var row = document.createElement('div');
          var dt = document.createElement('dt'); dt.textContent = k;
          var dd = document.createElement('dd'); dd.textContent = fields[k];
          row.appendChild(dt); row.appendChild(dd); recap.appendChild(row);
        });
        form.hidden = true;
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
        done.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
      }).catch(function () {
        fail(t('送出失敗，請檢查網路後再試一次，或直接寄信到 lucychi13450@gmail.com。', 'Could not send. Please check your connection and try again, or email lucychi13450@gmail.com.'));
      }).then(function () {
        submit.disabled = false;
        $('span', submit).textContent = t('送出洽詢', 'Send enquiry');
      });
    });

    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        RULES.forEach(function (r) { mark(r, false); });
        done.hidden = true;
        form.hidden = false;
        org.focus();
      });
    }
  })();

  /* ── 10 · 額滿的梯次 ──────────────────────────────────────────
     To close a cohort, put data-full on its <option> in course.html and
     nothing else. The （已額滿）suffix and the disabling both happen here, so
     the two labels can never disagree and the mark survives a language switch
     — the sweep above repaints options from data-en / dataset.zh, so a suffix
     typed straight into the markup would vanish the moment anyone pressed EN. */
  (function () {
    var sel = $('#a-batch'); if (!sel) return;
    Array.prototype.forEach.call(sel.options, function (o) {
      if (!o.hasAttribute('data-full')) return;
      o.disabled = true;
      if (o.dataset.zh === undefined) o.dataset.zh = o.innerHTML;
      o.dataset.zh += '（已額滿）';
      if (o.dataset.en) o.dataset.en += ' (full)';
      o.innerHTML = isEN() && o.dataset.en ? o.dataset.en : o.dataset.zh;
    });
  })();

  /* ── 10a · 青年培訓報名表 (course.html) ────────────────────────
     Deliberately bound to #applyForm, not #form. The 據點 handler above binds
     to #form and reads 單位名稱 / 承辦人 / 地點, so if both forms shared an id
     it would throw on whichever page it was not built for. Posts to the same
     Make webhook with form_type set, so one scenario can route both. */
  (function () {
    var form = $('#applyForm'); if (!form) return;

    var HOOK = 'https://hook.us2.make.com/n4mpjgv5wvijbfcgd2bj3efpc38n1p1s';

    var name_ = $('#a-name'), age = $('#a-age'), school = $('#a-school'), batch = $('#a-batch'),
        sMail = $('#a-contact'), parent_ = $('#a-parent'),
        pMail = $('#a-pmail'), phone = $('#a-phone'),
        why = $('#a-why'), exp = $('#a-exp'), work = $('#a-work'), trap = $('#a-trap'),
        submit = $('#applySubmit'), done = $('#applyDone'),
        recap = $('#applyRecap'), again = $('#applyAgain');

    /* Deliberately permissive: it only has to catch an empty or mistyped
       address, not adjudicate RFC 5322. A false rejection here costs an
       application, and there is a phone number as the fallback route. */
    function MAIL(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

    var RULES = [
      { el: name_,  err: '#ea-name',   msg: '請填寫學生姓名。', en: 'Please enter the student\'s name.',
        ok: function (v) { return v.trim().length >= 1; } },
      { el: age,    err: '#ea-age',    msg: '請填寫年齡（本計畫招收 16–18 歲）。', en: 'Please enter an age (this programme is for 16–18).',
        ok: function (v) { var n = parseInt(v, 10); return !isNaN(n) && n >= 14 && n <= 20; } },
      { el: school, err: '#ea-school', msg: '請填寫就讀學校與年級。', en: 'Please enter your school and year.',
        ok: function (v) { return v.trim().length >= 2; } },
      { el: sMail,  err: '#ea-contact', msg: '這個 Email 看起來不太對，再確認一下。', en: 'That email does not look right — worth a second look.',
        ok: function (v) { return v.trim() === '' || MAIL(v); } },
      /* Both addresses are optional and only shape-checked when something was
         typed. A guessed address is worse than an empty one: it misdelivers a
         letter carrying an account number. The pair is enforced at submit. */
      { el: sMail,  err: '#ea-contact', msg: '這個 Email 看起來不太對，再確認一下。', en: 'That email does not look right — worth a second look.',
        ok: function (v) { return v.trim() === '' || MAIL(v); } },
      { el: pMail,  err: '#ea-pmail',  msg: '這個 Email 看起來不太對，再確認一下。', en: 'That email does not look right — worth a second look.',
        ok: function (v) { return v.trim() === '' || MAIL(v); } },
      { el: batch,  err: '#ea-batch',  msg: '請選擇想報名的梯次。', en: 'Please choose a cohort.',
        ok: function (v) { return v.trim() !== ''; } },
      { el: work,   err: '#ea-work',   msg: '這個連結看起來不太對，要以 http:// 或 https:// 開頭。', en: 'That link does not look right — it should start with http:// or https://.',
        ok: function (v) { return v.trim() === '' || /^https?:\/\/\S+$/i.test(v.trim()); } },
      { el: phone,  err: '#ea-phone',  msg: '請填寫家長／監護人聯絡電話。', en: 'Please enter a parent or guardian phone number.',
        ok: function (v) { return v.replace(/[^0-9]/g, '').length >= 8; } },
      /* The hint suggests 100–300 字; this floor is deliberately far below it.
         The number is guidance so an applicant knows when they are done — the
         validator only has to stop an empty or one-word submission, because
         rejecting a short honest answer costs more than reading one. */
      { el: why,    err: '#ea-why',    msg: '請多寫幾句，這是書面甄選主要看的部分。', en: 'Please write a little more — this is what the selection reads.',
        ok: function (v) { return v.trim().length >= 30; } }
    ];

    function mark(rule, bad) {
      var box = $(rule.err);
      if (box) {
        box.textContent = bad ? t(rule.msg, rule.en || rule.msg) : '';
        box.classList.toggle('is-on', !!bad);
      }
      if (bad) rule.el.setAttribute('aria-invalid', 'true');
      else rule.el.removeAttribute('aria-invalid');
    }
    function check(rule, quiet) {
      var bad = !rule.ok(rule.el.value || '');
      if (!quiet) mark(rule, bad);
      return !bad;
    }
    RULES.forEach(function (r) {
      r.el.addEventListener('blur', function () { check(r); });
      r.el.addEventListener('input', function () {
        if (r.el.getAttribute('aria-invalid')) check(r);
      });
    });

    function send(body) {
      return fetch(HOOK, { method: 'POST', body: body })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; })
        .catch(function () {
          return fetch(HOOK, { method: 'POST', mode: 'no-cors', body: body }).then(function () { return true; });
        });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $('#ea-form').classList.remove('is-on');
      if (trap && trap.value) return;                    /* bot */

      var bad = RULES.filter(function (r) { return !check(r); });
      if (bad.length) {
        bad[0].el.focus();
        $('#ea-form').textContent = t('還有 ' + bad.length + ' 個欄位需要補上。', bad.length + ' field' + (bad.length>1?'s':'') + ' still needed.');
        $('#ea-form').classList.add('is-on');
        return;
      }

      /* Neither inbox is prescribed: the family decides which one handles this,
         and the letter goes to whichever addresses exist. But it carries an
         amount and an account number, so one of them has to be real. */
      if (!MAIL(sMail.value) && !MAIL(pMail.value)) {
        $('#ea-form').textContent = t('請至少留一個 Email —— 錄取通知信要寄到那裡。',
                                      'Please leave at least one email — the acceptance letter has to go somewhere.');
        $('#ea-form').classList.add('is-on');
        (sMail.value.trim() ? sMail : pMail).focus();
        return;
      }

      var L = isEN()
        ? ['Student name','Age','School and year','Cohort','Student email',
           'Parent name','Parent email','Parent phone','Why they want to join','Sport / volunteering experience','CV / portfolio link']
        : ['學生姓名','年齡','學校年級','報名梯次','學生 Email',
           '家長姓名','家長 Email','家長電話','為什麼想參加','運動或志工經驗','履歷／學習歷程連結'];
      var V = [name_.value.trim(), age.value.trim(), school.value.trim(), batch.value.trim(), sMail.value.trim(),
               parent_.value.trim(), pMail.value.trim(), phone.value.trim(), why.value.trim(), exp.value.trim(),
               work.value.trim()];
      var fields = {};
      L.forEach(function (k, i) { fields[k] = V[i]; });
      var summary = Object.keys(fields).map(function (k) {
        return k + '：' + (fields[k] || '（未填）');
      }).join('／');

      var body = new URLSearchParams({
        form_type: '青年志工報名',
        student: name_.value.trim(),
        age: age.value.trim(),
        school: school.value.trim(),
        batch: batch.value.trim(),
        student_email: sMail.value.trim(),
        parent: parent_.value.trim(),
        parent_email: pMail.value.trim(),
        parent_phone: phone.value.trim(),
        why: why.value.trim(),
        experience: exp.value.trim(),
        portfolio: work.value.trim(),
        summary: summary,
        submitted_at: new Date().toISOString(),
        source: location.href
      });

      submit.disabled = true;
      $('span', submit).textContent = t('送出中…', 'Sending…');

      send(body).then(function () {
        recap.innerHTML = '';
        Object.keys(fields).forEach(function (k) {
          if (!fields[k]) return;
          var row = document.createElement('div');
          var dt = document.createElement('dt'); dt.textContent = k;
          var dd = document.createElement('dd'); dd.textContent = fields[k];
          row.appendChild(dt); row.appendChild(dd); recap.appendChild(row);
        });
        form.hidden = true;
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
        done.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
      }).catch(function () {
        $('#ea-form').textContent = t('送出失敗，請檢查網路後再試一次，或直接寄信到 lucychi13450@gmail.com。', 'Could not send. Please check your connection and try again, or email lucychi13450@gmail.com.');
        $('#ea-form').classList.add('is-on');
      }).then(function () {
        submit.disabled = false;
        $('span', submit).textContent = t('送出報名', 'Submit application');
      });
    });

    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        RULES.forEach(function (r) { mark(r, false); });
        done.hidden = true;
        form.hidden = false;
        name_.focus();
      });
    }
  })();

  /* ── 10b · our own date & time pickers ───────────────────────
     Browsers disagree too much to rely on theirs. macOS Safari draws no picker
     control for either type and showPicker() opens nothing for a time input
     there, so the fields looked like plain boxes with nothing to click. These
     panels are identical everywhere and on every device. The inputs stay native
     underneath: typing still works, and the submitted values are unchanged
     (YYYY-MM-DD and HH:MM), so the Make scenario needs no changes. */
  (function () {
    var dateEl = $('#f-date'), timeEl = $('#f-time');
    if (!dateEl || !timeEl) return;

    var CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';
    var CLK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
    var WD = ['日', '一', '二', '三', '四', '五', '六'];

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    var live = null;   /* the panel currently open, if any */

    function shut() {
      if (!live) return;
      if (live.pop.parentNode) live.pop.parentNode.removeChild(live.pop);
      live.btn.setAttribute('aria-expanded', 'false');
      live = null;
      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onKey, true);
    }
    function onOutside(e) {
      if (!live) return;
      if (live.pop.contains(e.target) || live.btn.contains(e.target)) return;
      shut();
    }
    function onKey(e) {
      if (e.key === 'Escape' && live) { var b = live.btn; shut(); b.focus(); }
    }

    /* write through the input so the existing validation sees a real change */
    function set(el, val) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function commit(el, val) { set(el, val); shut(); }

    function buildDate() {
      var pop = document.createElement('div');
      pop.className = 'pop pop--date';
      var min = dateEl.getAttribute('min') || '';
      var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateEl.value);
      var view = parts
        ? new Date(+parts[1], +parts[2] - 1, 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      function render() {
        var y = view.getFullYear(), m = view.getMonth();
        var head = '<div class="pop__head">' +
          '<button type="button" class="pop__nav" data-step="-1" aria-label="上個月">&lsaquo;</button>' +
          '<span class="pop__title">' + y + ' 年 ' + (m + 1) + ' 月</span>' +
          '<button type="button" class="pop__nav" data-step="1" aria-label="下個月">&rsaquo;</button></div>';
        var wd = '<div class="pop__wd">' + WD.map(function (w) {
          return '<span>' + w + '</span>'; }).join('') + '</div>';
        var cells = '';
        for (var i = 0, lead = new Date(y, m, 1).getDay(); i < lead; i++) cells += '<span></span>';
        var last = new Date(y, m + 1, 0).getDate();
        for (var d = 1; d <= last; d++) {
          var v = y + '-' + pad(m + 1) + '-' + pad(d);
          cells += '<button type="button" class="pop__d' + (v === dateEl.value ? ' is-on' : '') +
                   '"' + (min && v < min ? ' disabled' : '') +
                   ' data-v="' + esc(v) + '">' + d + '</button>';
        }
        pop.innerHTML = head + wd + '<div class="pop__grid">' + cells + '</div>';
      }
      render();

      pop.addEventListener('click', function (e) {
        var nav = e.target.closest ? e.target.closest('.pop__nav') : null;
        if (nav) { view.setMonth(view.getMonth() + parseInt(nav.getAttribute('data-step'), 10)); render(); return; }
        var cell = e.target.closest ? e.target.closest('.pop__d') : null;
        if (cell && !cell.disabled) commit(dateEl, cell.getAttribute('data-v'));
      });
      return pop;
    }

    function buildTime() {
      var pop = document.createElement('div');
      pop.className = 'pop pop--time';
      /* two columns, 00–23 and 00–59: every one of the 1440 minutes in a day is
         two taps away, and both scales are readable at a glance */
      var now = /^(\d{1,2}):(\d{2})$/.exec(timeEl.value);
      var hh = now ? pad(+now[1]) : null, mm = now ? now[2] : null;
      var tookH = false, tookM = false;

      function col(head, count, cur, key) {
        var s = '<div class="pop__col"><p class="pop__colh">' + head + '</p><div class="pop__scroll">';
        for (var i = 0; i < count; i++) {
          var v = pad(i);
          s += '<button type="button" class="pop__u' + (v === cur ? ' is-on' : '') +
               '" data-k="' + key + '" data-v="' + v + '">' + v + '</button>';
        }
        return s + '</div></div>';
      }
      pop.innerHTML = '<div class="pop__cols">' +
        col('時', 24, hh, 'h') + col('分', 60, mm, 'm') + '</div>';

      pop.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.pop__u') : null;
        if (!b) return;
        /* move the highlight inside this column only — no re-render, so the
           other column keeps the scroll position the reader left it at */
        var sibs = b.parentNode.querySelectorAll('.pop__u');
        for (var i = 0; i < sibs.length; i++) sibs[i].classList.remove('is-on');
        b.classList.add('is-on');

        if (b.getAttribute('data-k') === 'h') { hh = b.getAttribute('data-v'); tookH = true; }
        else { mm = b.getAttribute('data-v'); tookM = true; }

        set(timeEl, (hh || '00') + ':' + (mm || '00'));
        /* close once they have actually chosen both, not on the implied 00 */
        if (tookH && tookM) shut();
      });
      return pop;
    }

    function wire(el, label, icon, build) {
      /* the input needs a positioned parent of its own — .field also holds the
         label, hint and error line, so anchoring to it would misplace things */
      var ctl = document.createElement('span');
      ctl.className = 'ctl';
      el.parentNode.insertBefore(ctl, el);
      ctl.appendChild(el);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pick';
      btn.innerHTML = icon;
      btn.setAttribute('aria-label', label);
      btn.setAttribute('aria-expanded', 'false');
      ctl.appendChild(btn);

      btn.addEventListener('click', function () {
        if (live && live.btn === btn) { shut(); return; }
        shut();
        var pop = build();
        ctl.appendChild(pop);
        btn.setAttribute('aria-expanded', 'true');
        live = { pop: pop, btn: btn };
        /* both time columns can carry a selection, so scroll each into view */
        var on = pop.querySelectorAll('.is-on');
        for (var i = 0; i < on.length; i++) {
          if (on[i].scrollIntoView) on[i].scrollIntoView({ block: 'center' });
        }
        setTimeout(function () {
          document.addEventListener('pointerdown', onOutside, true);
          document.addEventListener('keydown', onKey, true);
        }, 0);
      });
    }

    wire(dateEl, '選擇日期', CAL, buildDate);
    wire(timeEl, '選擇時間', CLK, buildTime);
  })();

  /* ── 11 · atmosphere on dark sections ────────────────────────
     Probes each file before touching the DOM: a missing image leaves its
     section as plain navy and nothing 404s into view. */
  (function () {
    $$('.sec__bg[data-bg]').forEach(function (layer) {
      var sec = layer.parentNode;
      var url = layer.getAttribute('data-bg');
      if (!sec || !url) return;

      function load() {
        var probe = new Image();
        probe.onload = function () {
          layer.style.backgroundImage = 'url("' + url + '")';
          requestAnimationFrame(function () { sec.classList.add('bg-in'); });
        };
        probe.src = url;
      }

      if (!('IntersectionObserver' in window)) { load(); return; }
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { load(); io.disconnect(); }
      }, { rootMargin: '400px' });
      io.observe(sec);
    });
  })();

  /* ── 11b · copy the address ──────────────────────────────────
     mailto: opens a mail client, which silently does nothing on a desktop with
     none configured. The address beside the button is a copy fallback so the
     contact route never dead-ends. */
  (function () {
    var btn = $('#copyMail'), label = $('#copyMailText');
    if (!btn || !label) return;
    var mail = btn.getAttribute('data-mail'), original = label.textContent, busy;

    function flash(msg) {
      clearTimeout(busy);
      label.textContent = msg;
      btn.classList.add('is-copied');
      busy = setTimeout(function () {
        label.textContent = original;
        btn.classList.remove('is-copied');
      }, 2000);
    }

    /* if the clipboard is unavailable or refused, select the address so it can
       be copied by hand — never leave the tap with no visible result */
    function selectInstead() {
      try {
        var r = document.createRange();
        r.selectNodeContents(label);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      } catch (e) {}
      flash('請長按或按 Ctrl/⌘+C 複製');
    }

    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail)
          .then(function () { flash('已複製到剪貼簿'); }, selectInstead);
        return;
      }
      selectInstead();
    });
  })();

  /* ── 12 · footer year ────────────────────────────────────── */
  (function () {
    var y = $('#yr');
    if (y) y.textContent = new Date().getFullYear();
  })();

  /* ── 13 · come back to where you left the other page ─────────
     The pill moves a reader between two long pages. Landing at the top of
     whichever one they return to means scrolling all of it again — index is
     ~27,000px, and the crosslink that sends them to the course page sits two
     thirds of the way down it.

     So each page records its own scroll position, and restores it when it is
     re-entered FROM its sibling. Every other way in — a direct link, a search
     result, a #hash, a fresh tab — still lands at the top, because restoring a
     position someone never set is more confusing than not.

     Position is re-applied once on load: images above the restore point settle
     late and would otherwise leave the reader a few hundred pixels off. A real
     scroll or keypress cancels that second pass, so it can never fight someone
     who has already started reading. */
  (function () {
    var PAGES = ['index.html', 'course.html'];
    function name(path) {
      var f = (path.split('/').pop() || '').toLowerCase();
      return f === '' ? 'index.html' : f;
    }
    var here = name(location.pathname);
    if (PAGES.indexOf(here) < 0) return;
    var KEY = 'jyd-scroll:' + here;

    function store() {
      try { sessionStorage.setItem(KEY, String(Math.round(window.pageYOffset))); } catch (e) {}
    }

    /* passive + rAF-gated: this runs on every scroll frame of a very long page */
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; store(); });
    }, { passive: true });
    /* bfcache and tab-close do not always fire scroll again */
    window.addEventListener('pagehide', store);

    var from = '';
    try { from = document.referrer ? name(new URL(document.referrer).pathname) : ''; } catch (e) {}
    /* only from the sibling page, and never over an explicit anchor */
    if (from === here || PAGES.indexOf(from) < 0 || location.hash) return;

    var y = 0;
    try { y = parseInt(sessionStorage.getItem(KEY) || '0', 10); } catch (e) {}
    if (!y || y < 200) return;                 /* nothing worth restoring */

    /* the page sets scroll-behavior:smooth, which would animate a 20,000px
       jump; put it back immediately so anchors still glide */
    function jump(to) {
      var html = document.documentElement, prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, to);
      html.style.scrollBehavior = prev;
    }

    jump(y);

    var touched = false;
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true });
    });
    window.addEventListener('load', function () {
      if (touched) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      jump(Math.min(y, Math.max(0, max)));
    });
  })();

})();
