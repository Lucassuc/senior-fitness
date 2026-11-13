/* 健運動 · v2 shared behaviour (both pages, after site.js)
   Only what the v2 chrome adds: the phone dock, the film player and the
   photo viewer. The EN toggle and both forms stay in site.js. Everything is
   null-guarded, so a page without a given piece simply skips it. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var isEN = function () { return document.documentElement.lang === 'en'; };

  /* dock: on once the first-screen button has scrolled away, off while the
     form itself is on screen (the form has its own submit). Marked by
     data-dock-cta / data-dock-form so both pages use the same code. */
  (function () {
    var dock = $('dock'); if (!dock) return;
    var cta = $('heroCta'), form = document.querySelector(dock.getAttribute('data-form') || '#apply');
    if (!('IntersectionObserver' in window) || !cta) { dock.classList.add('is-on'); return; }
    var out = false, inForm = false;
    function sync() { dock.classList.toggle('is-on', out && !inForm); }
    new IntersectionObserver(function (e) { out = !e[0].isIntersecting; sync(); }).observe(cta);
    if (form) new IntersectionObserver(function (e) { inForm = e[0].isIntersecting; sync(); },
      { rootMargin: '0px 0px -30% 0px' }).observe(form);
  })();

  /* photo grid on the home page: open the rest, then let site.js re-measure
     its masonry (it listens for resize) */
  (function () {
    var btn = $('gridMore'), grid = $('grid'); if (!btn || !grid) return;
    btn.addEventListener('click', function () {
      grid.classList.remove('is-short');
      btn.hidden = true;
      window.dispatchEvent(new Event('resize'));
    });
  })();

  /* dialogs close on the backdrop or any [data-close] */
  Array.prototype.forEach.call(document.querySelectorAll('dialog'), function (d) {
    d.addEventListener('click', function (ev) {
      if (ev.target === d || ev.target.hasAttribute('data-close')) d.close();
    });
  });

  /* film: plays in a dialog on the real site and on localhost. Anywhere that
     cannot embed YouTube, the link's own href opens it instead. */
  (function () {
    var player = $('player'), box = $('playerBox'); if (!player || !box) return;
    var canEmbed = /(^|\.)github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
    player.addEventListener('close', function () { box.innerHTML = ''; });
    Array.prototype.forEach.call(document.querySelectorAll('a[data-yt]'), function (a) {
      a.addEventListener('click', function (ev) {
        if (!canEmbed || !player.showModal) return;
        ev.preventDefault();
        box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + a.getAttribute('data-yt') +
          '?autoplay=1&playsinline=1&rel=0" title="' + (isEN() ? 'Recap film' : '回顧影片') +
          '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
        player.showModal();
      });
    });
  })();

  /* photo viewer: pages through every tile of the list that was tapped.
     Captions are read from the tile at open time, so they follow the EN
     toggle with no second copy of the text. -md.jpg → -lg.jpg for the big
     view. */
  (function () {
    var view = $('view'); if (!view || !view.showModal) return;
    var img = $('viewImg'), tag = $('viewTag'), title = $('viewTitle'), text = $('viewText'), count = $('viewCount');
    var set = [], at = 0;
    function show(i) {
      at = (i + set.length) % set.length;
      var b = set[at], im = b.querySelector('img'), q = function (s) { var n = b.querySelector(s); return n ? n.textContent : ''; };
      img.src = im.getAttribute('src').replace('-md.jpg', '-lg.jpg');
      img.alt = im.alt;
      tag.textContent = q('em'); title.textContent = q('b'); text.textContent = q('i');
      count.textContent = (at + 1) + ' / ' + set.length;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.show'), function (list) {
      list.addEventListener('click', function (ev) {
        var b = ev.target.closest('button'); if (!b) return;
        set = Array.prototype.slice.call(list.querySelectorAll('button'));
        show(set.indexOf(b));
        view.showModal();
      });
    });
    $('viewPrev').addEventListener('click', function () { show(at - 1); });
    $('viewNext').addEventListener('click', function () { show(at + 1); });
    view.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft') show(at - 1);
      if (ev.key === 'ArrowRight') show(at + 1);
    });
  })();
})();
