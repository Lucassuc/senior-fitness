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

  /* ── 2 · reveal on scroll ────────────────────────────────── */
  (function () {
    var targets = $$('[data-reveal], .h2, .statement, .hero__title, .foot__me');
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

    /* anything already in view on load fires immediately via the observer,
       but the hero should never wait on a scroll event */
    requestAnimationFrame(function () {
      $$('.hero [data-reveal], .hero__title').forEach(function (el) { el.classList.add('is-in'); });
    });
  })();

  /* ── 3 · scroll progress + nav state ─────────────────────── */
  (function () {
    var bar  = $('#progress i');
    var nav  = $('#nav');
    var hero = $('.hero');
    var media = $('.hero__media');
    var heroBody = $('.hero__body');

    var chip = $('#chapter'), chipNo = $('#chapterNo'), chipName = $('#chapterName');
    var foot = $('.foot'), shownChapter = -1;
    /* keep these numbers in step with the section eyebrows and the menu */
    var CHAPTERS = [
      { sel: '#how',      no: '01', name: '怎麼運作' },
      { sel: '#data',     no: '02', name: '數據發現' },
      { sel: '#findings', no: '02', name: '基線評估' },
      { sel: '#video',    no: '03', name: '每天十分鐘' },
      { sel: '#about',    no: '04', name: '關於這個專案' },
      { sel: '#story',    no: '05', name: '不只是運動' },
      { sel: '#collab',   no: '—',  name: '合作' },
      { sel: '#book',     no: '—',  name: '預約專區' }
    ].map(function (c) { c.el = $(c.sel); return c; });

    /* Photo-grid drift. Applied to the frame, not the card: .shot carries
       data-reveal, whose 0.55s transform transition would smear a per-frame
       parallax. And not to the <img> either — that would need a scale to hide
       the edges, i.e. cropping, which this grid deliberately avoids. */
    var shots = $$('#grid .shot__img');
    var links = $$('.nav__links a');
    var secs = links.map(function (a) { return $(a.getAttribute('href')); });

    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var doc = document.documentElement.scrollHeight - window.innerHeight;

      if (bar) bar.style.width = (doc > 0 ? Math.min(1, y / doc) * 100 : 0) + '%';

      if (nav && hero) {
        var trip = hero.offsetHeight - 72;
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
      links.forEach(function (a, i) { a.classList.toggle('is-here', i === best); });

      /* chapter marker: hidden over the hero and once the footer arrives */
      if (chip) {
        var at = -1;
        CHAPTERS.forEach(function (c, i) {
          if (c.el && c.el.getBoundingClientRect().top <= window.innerHeight * 0.45) at = i;
        });
        var footTop = foot ? foot.getBoundingClientRect().top : Infinity;
        var show = at >= 0 && footTop > window.innerHeight * 0.6;
        if (show && at !== shownChapter) {
          chipNo.textContent = CHAPTERS[at].no;
          chipName.textContent = CHAPTERS[at].name;
          shownChapter = at;
        }
        chip.classList.toggle('is-on', show);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
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

    /* Always scale the whole canvas to fit the container. It used to stay at 62%
       and pan sideways, which turned the dashboard into a scroll trap — and this
       is not where anyone wants to be held up. It is a glanceable panel now; the
       interactive version is one tap away in a new window. */
    function fit() {
      var dz = Math.min(1, box.clientWidth / CANVAS);
      box.style.setProperty('--dz', dz.toFixed(4));
      fig.classList.add('dash--fit');
    }

    function load() {
      if (loaded) return;
      loaded = true;
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-src')
        + '?:embed=y&:showVizHome=no&:tabs=no&:toolbar=bottom&:display_count=n&:origin=viz_share_link';
      f.title = '基線評估儀表板 — 永樂居 Elder Fitness Baseline Assessment（Tableau Public）';
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
      f.title = '健運動一分鐘介紹影片';
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

  /* ── 10 · reservation form ───────────────────────────────── */
  (function () {
    var form = $('#form'); if (!form) return;

    var HOOK = 'https://hook.us2.make.com/n4mpjgv5wvijbfcgd2bj3efpc38n1p1s';

    var date = $('#f-date'), time = $('#f-time'), place = $('#f-place'),
        who = $('#f-who'), note = $('#f-note'),
        trap_ = $('#f-trap'),
        submit = $('#submit'), done = $('#done'), recap = $('#recap'), again = $('#again');

    /* no bookings in the past */
    var t = new Date();
    var iso = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
    date.setAttribute('min', iso);

    /* No showPicker() wiring here on purpose. Both 日期 and 時間 are native
       inputs with appearance:auto restored (see the CSS), so each opens the
       browser's own picker with no JS — which is the point, since showPicker()
       does nothing for a time input on macOS Safari. */

    var RULES = [
      { el: date,  err: '#e-date',  msg: '請選擇日期。',
        ok: function (v) { return !!v && v >= iso; }, late: '日期不能早於今天。' },
      { el: time,  err: '#e-time',  msg: '請填寫時間。', ok: function (v) { return !!v; } },
      { el: place, err: '#e-place', msg: '請填寫地點。', ok: function (v) { return v.trim().length >= 2; } },
      { el: who,   err: '#e-who',   msg: '請填寫邀請人。', ok: function (v) { return v.trim().length >= 1; } }
    ];

    function mark(rule, bad, text) {
      var box = $(rule.err);
      if (box) {
        box.textContent = bad ? (text || rule.msg) : '';
        box.classList.toggle('is-on', !!bad);
      }
      if (bad) rule.el.setAttribute('aria-invalid', 'true');
      else rule.el.removeAttribute('aria-invalid');
    }

    function check(rule, quiet) {
      var v = rule.el.value || '';
      var bad = !rule.ok(v);
      var text = rule.msg;
      if (!bad && rule.late && v && v < iso) { bad = true; text = rule.late; }
      if (!quiet) mark(rule, bad, text);
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
        fail('還有 ' + bad.length + ' 個欄位需要補上。');
        return;
      }

      var fields = {
        '邀請人': who.value.trim(),
        '日期': date.value,
        '時間': time.value,
        '地點': place.value.trim(),
        '備註': note.value.trim()
      };

      var body = new URLSearchParams({
        inviter: who.value.trim(),
        date: date.value,
        time: time.value,
        place: place.value.trim(),
        note: note.value.trim(),
        summary: '邀請人：' + fields['邀請人'] +
                 '／日期：' + fields['日期'] +
                 '／時間：' + fields['時間'] +
                 '／地點：' + fields['地點'] +
                 '／備註：' + (fields['備註'] || '（無）'),
        submitted_at: new Date().toISOString(),
        source: location.href
      });

      submit.disabled = true;
      $('span', submit).textContent = '送出中…';

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
        fail('送出失敗，請檢查網路後再試一次，或直接寄信到 lucychi13450@gmail.com。');
      }).then(function () {
        submit.disabled = false;
        $('span', submit).textContent = '送出預約';
      });
    });

    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        RULES.forEach(function (r) { mark(r, false); });
        done.hidden = true;
        form.hidden = false;
        date.focus();
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

})();
