# 健運動 · 活力長青 — 網站

Static site. No build step, no dependencies, no framework. Open `index.html` and it works.

```
website/
  index.html              ← all markup and copy
  assets/css/site.css     ← design tokens + every style
  assets/js/site.js       ← nav, reveals, lightbox, form (vanilla, ~13 KB)
  assets/fonts/           ← PP Neue Montreal Text 400/500 (self-hosted)
  assets/img/             ← hero, logos, 14 timeline photos, 3 navy textures
  assets/video/           ← the two short clips + poster frames
```

## Run it locally

```bash
python3 serve.py
```

Then open <http://localhost:4173>. **Use this, not `python3 -m http.server`** —
`serve.py` sends `no-store`, so what you see is always what is on disk. Plain
http.server lets the browser cache `index.html`, which repeatedly made finished
edits look like they had never happened. (A server is required either way:
`file://` breaks the Tableau embed and the form.)

## Deploy

Upload the contents of `website/` to any static host — Netlify, Vercel,
Cloudflare Pages, GitHub Pages. Drag-and-drop the folder onto Netlify Drop and
it is live; there is nothing to configure.

---


## Cache-busting — read this before you edit anything

Every local asset URL carries `?v=N`. **Bump it whenever you change that file**,
or browsers will keep serving the old copy and your change will look like it
never happened. This bit us repeatedly: the icon was corrected on disk three
times while the browser kept showing the cached original.

- CSS / JS → bump `?v=` in the two `<link>`/`<script>` tags near the top and bottom.
- A replaced photo → bump `?v=` on that one `<img src>`.
- The favicon set → browsers often ignore query strings on favicons, so those
  files are **renamed** instead (`icon-512/192/180/64.png`). Rename again if you
  ever swap the mark.
- `index.html` itself can't be versioned — that is why `serve.py` sends
  `no-store` locally, and why `website/_headers` tells Netlify/Cloudflare to
  revalidate HTML on every request while caching `/assets/*` hard. Without that
  file, returning visitors keep the old page after a deploy.

## Design system

Built on the neuemontreal reference, applied to your navy + white + photography brief.

**Light and dark alternate**, and every dark section wears the same treatment
as the 合作 screen — that combination is the look Lucas picked. Components read
mode tokens (`--ink`, `--ink-soft`, `--ink-faint`, `--rule`, `--fill`,
`--btn-bg`) which each section re-declares, so **nothing hardcodes a mode**; add
`.sec--navy` to a section and everything inside adapts.

| | |
|---|---|
| `--navy` | `#0d1a50` — dark sections |
| `--navy-900` | `#060b24` — footer |
| `--paper` / `--tint` | `#ffffff` / `#f4f5f8` — light sections |
| Soft blue-grey | `#9099c3` — labels and small accents only |
| Warmth | comes entirely from the photographs |

The hero, the marquee and `#video` run together as one continuous dark stretch,
so the hero takes the **identical** texture + light recipe as `#video`, and the
marquee is set to `#0b1235` — the composited value those two land on once their
texture layer is applied. Raw `--navy` looks conspicuously lighter between them.

Each dark section carries a very dark navy photograph (`.sec__bg[data-bg]`) at
62% plus its own off-axis radial light and the shared film grain. That is what
gives them the depth of the 合作 screen. `site.js` probes each file first, so a
missing image just leaves that section plain navy.

**Those sections must clip.** The layer's `drift` animation scales it to 1.13,
which pushes it outside its own section — unclipped it washed dark blue over the
light sections above and below, and because it animates, by a different amount
each frame. `#collab` and `.foot` use `overflow: hidden`; `#video` uses
`overflow: clip`, which clips without turning the section into a scroll
container. **Any new section with a `.sec__bg` needs one of these.**

**Type pairing.** PP Neue Montreal Text carries the Latin (dates, `01`–`04`,
labels, `LINE`/`Make`/`Notion`); Noto Serif TC carries Chinese display type;
Noto Sans TC carries Chinese body. That split is why the numerals look
different from the headlines — it is deliberate.

**Three rules the whole page obeys**

1. *One idea per section.* Each scroll stop makes a single point. The data
   finding gets a screen of its own; the dashboard is a separate beat; the four
   themes are one 2×2 block rather than four stops.
2. *Restrained palette.* Navy, white, off-white. Nothing else is coloured.
3. *Generous scale and space.* Display type up to `27vw`, 96px section padding
   on phones and 150px on desktop.

**One exception to "generous", and it is deliberate: the hero wordmark on
desktop.** On a phone 健運動 rises out of the bottom edge of the photo and covers
nobody. On desktop the photo is full-bleed behind it, and at the shared `15rem`
cap the wordmark reached up across the group's faces — which are the entire
argument this page makes. `--t-hero` is therefore re-declared inside the 810px
query as `clamp(4.5rem, min(27vw, 15.5svh), 13rem)`: bounded by viewport *height*
as well as width, so it stays in the band below the yellow railing on short
laptop windows too. `.hero__body` and `.hero__by` also give up some bottom
padding there for the same reason. Verified clear of the faces at 1440×760,
1440×900 and 1920×1200. If you enlarge it again, check those three.

Display headlines are split into explicit `<span class="mask">` lines so they
rise line-by-line and never break mid-phrase. **If you edit headline copy, keep
each line under ~10 Chinese characters** or it will wrap and lose the effect.

**The hero is art-directed per breakpoint.** `hero.jpeg` is 3:2 and the four
people span nearly its full width, so cropping it into a phone viewport always
lost two of them. On phones the photo therefore keeps its own aspect as a plate
below the bar; its lower edge dissolves into the navy and `健運動` is pulled up
80px so the wordmark rises out of the photograph — photo and type are one
composition, not two stacked blocks. From 810px up it returns to the full-bleed
overlay, where the wide crop already shows everyone. Two files:
`hero-mobile-1200.jpg` (centred 3:2 crop) and `hero-2000.jpg`.

The hero also carries the 支持單位 line, because that is the first thing a
prospective partner looks for and the footer is a long way down.

**The photo grid never crops.** These are group photos, and a uniform 4:5 cell
was slicing people off the edges, so every frame keeps its own aspect ratio
(intrinsic `width`/`height` on each `<img>`). One column on a phone — faces need
to be big enough to read, and that matters more than a tidy grid. From 810px up
`site.js` computes `grid-row-end` spans for a masonry layout; below that it does
nothing. **Don't reintroduce a fixed `aspect-ratio` on `.shot__img`.**

**The navy is not flat.** Grain plus a per-section light is what stops it
feeling 單調. This is the one place the build departs from the reference
system's "no gradients" rule.

**The icon is a filled navy square.** `logo_favicon.png` is a navy disc
surrounded by *opaque* white, and the white figure touches that surround — so
neither pasting over navy nor a flood fill can separate them. `build-assets.sh`
masks to the disc and snaps every non-white pixel to the exact brand navy, so
the disc edge vanishes into the tile. Keep that step if you swap the file.

A filled square is the right call over leaving the white: the nav bar flips
between white and navy as you scroll, and a filled navy tile reads correctly on
both — white corners would look like a sticker on the dark sections, and the
mark would vanish entirely on the light ones.

## Motion

Everything is CSS transitions driven by `IntersectionObserver` — no animation
library. Reveal is `opacity + translateY(24px)` at `0.55s`, staggered via a
`--d` custom property. All of it collapses under `prefers-reduced-motion`.

The four pieces borrowed from the reference site:

- **Turning mark.** SVG `textPath` on a circle, rotating on a linear loop. It
  opens the page as the loading curtain (`.curtain .ring`, 18s) and closes it as
  a footer seal (`.seal`, 26s) — same mark, bookending the scroll.
- **Loading curtain.** Navy, the turning mark centred, lifts by `clip-path`
  after 1.15s. Shown once per session (`sessionStorage`), skipped entirely under
  reduced motion, and self-completing in CSS so a JS failure can't trap anyone
  behind it.
- **Pinned hero.** `.hero` is `position: sticky; top: 0` and everything after it
  is opaque with a higher stacking order, so the page slides up over a hero that
  stays put. `site.js` fades and eases the hero content back as it gets covered —
  without that the wordmark just looks guillotined.
- **Clip playback.** The two shorts autoplay muted when 25% in view and pause
  when they leave. Only Save-Data suppresses this — `prefers-reduced-motion`
  deliberately does not, because these are small muted *content* clips the
  reader scrolled to, not decorative UI motion, and the section exists to show
  people moving. If a browser refuses autoplay before any gesture, the clip is
  queued and started on the first tap/click/keypress anywhere on the page.
- **The film can always be stopped.** YouTube's own controls live inside the
  iframe and are easy to miss on a phone, so the embed carries its own × button
  (and Esc). Closing removes the iframe outright, which stops playback and
  restores the poster; it can be reopened.
- **The clips pin, side by side from 700px up, one runway each.** They originally
  shared a single sticky `.shorts-pin` that held them high with a hole underneath,
  and side by side at 375px left each frame 162px wide — short-2 is a three-panel
  montage, so at that size there was nothing to see. Now each clip is its own
  `.clip` runway. Below 700px they stack, one large frame per runway; from 700px
  up `.clips` becomes a two-column `auto` grid with `justify-content: center`, so
  the pair sits shoulder to shoulder in the middle rather than marooned at
  opposite edges of a wide screen. Both runways are the same height, so the pair
  pins and releases together.

  **No captions, deliberately.** They went through a heading-plus-paragraph, then
  a one-line label, then nothing. Both clips are from the same session and each
  carries its own burnt-in title (`拉伸十分鐘`, `運動十分鐘`, `運動後回報就有機會抽大獎哦！`),
  so any label under the frame restated text already visible inside it — and
  naming them separately split one session into two topics it doesn't have. The
  eyebrow, headline and `跟著一起動 —— 走到哪，動到哪。` directly above are the
  framing. If a caption is ever added it must go *inside* `<figure class="short">`;
  anything outside the pinned element scrolls up underneath the held frame.

  Sizing derives from **`--clip-w`**. `--clip-top` computes from the frame's real
  height, `var(--clip-w) * 16 / 9` — never from an intended height: the width caps
  (the grid column on tablet, `68svh × 9/16` on desktop) make the real height
  smaller than the svh figure suggests, and computing off the intention is what
  left the clip sitting high on an iPad. `min-height` is the length of the hold,
  not padding — the pair holds still for roughly `min-height` minus the frame's
  height.

  Measured: phone 375×812 → 320×568, pins at 146px for ~375px of scroll; tablet
  768×1024 → two 352×626 side by side, pins at 215px for ~375px; desktop 1280×800
  → two 306×544 centred with a 24px gap, pins at 138px for ~275px. The dashboard
  still does *not* pin — pinning it used to trap sideways swipes.
- **Chapter marker** (`.chapter`). A fixed pill, bottom-left, naming the section
  you are in — taken from the deso reference, which uses the same device on a
  102,000px page. It reuses the 01–04 numbering the sections already carry,
  fades in past the hero and out at the footer.
- **Photo drift.** Timeline frames translate ±14px against the scroll. Applied
  to `.shot__img`, not `.shot` (whose `data-reveal` transform transition would
  smear it) and not the `<img>` (which would need a scale to hide the edges —
  i.e. cropping, which this grid exists to avoid).
- **Marquee band** and the line-mask headline reveals, as before.

**Both clips fade to black before they end** — short-1 is dark for its last
seven seconds of twenty, which left the tile black for a third of every loop.
`data-end` on each `<video>` loops the live part only. Re-cut the clips and
those numbers can go.

`.hero` must stay `position: sticky` — an earlier `position: relative` rule for
the grain overlay silently killed the pin once already.

## Accessibility

Single `<h1>`, ordered headings, labelled inputs, `role="alert"` errors, focus
trap and `Esc` on the menu and lightbox, visible focus rings, every tap target
≥44px, alt text on every image.

---

## Two different audiences, two different actions

The 合作 section is for organisations that have **not** worked with you yet — its
only call to action is email.

**Every email link opens Gmail's web compose, not `mailto:`.** `mailto:` does
nothing at all — silently, with no error — on a machine with no default mail
client, which is common in Chrome on desktop. That was quietly dead-ending the
contact route. All three entry points (the 合作 button, the footer address, the
menu address) now use the same Gmail compose URL, pre-filled with subject
`健運動 · 合作洽詢` and a short template for unit, location, phone and headcount.
The address beside the button is a copy button, which covers anyone who uses
something other than Gmail.

## The reservation form

Posts to the Make webhook in `assets/js/site.js` (`HOOK`, near the bottom).

It sends **form-encoded** fields — `inviter`, `date`, `time`, `place`, `note`,
`summary`, `submitted_at`, `source`. Map those to your Notion database and your
email notification. `summary` is a single pre-formatted line
(`邀請人：… ／日期：… ／時間：…`) if you would rather drop one value into the
email body.

`inviter` is free text, not a fixed list, so it covers any kind of partner rather
than only 督導. Five fields total, four of them required — the form is short
enough to finish on a phone in under a minute, which matters more here than
capturing every detail up front. Anything else goes in 備註.

It tries a normal CORS request first so genuine failures surface, then retries
opaquely (`mode: 'no-cors'`) because Make's webhooks do not always send CORS
headers. Either way the POST lands. **The Make scenario ends with a Webhook
response module sending `Access-Control-Allow-Origin: *`** — without that header
the first request fails at the CORS layer *after* Make has already processed it,
the retry fires, and every booking lands twice: two Notion rows, two emails.

**日期 and 時間 took three attempts. Don't undo the third one.**

`appearance: none` on `.field input` is what makes every field match, but it also
strips the browser's own date/time picker button, leaving a box that looks
type-only and does nothing when clicked. Attempt two drew an SVG calendar/clock
and called `showPicker()` on click — which fails on **macOS Safari**, where
`showPicker()` opens nothing for these types and a time input has no popup picker
at all, only a segmented spinner you have to type into. So there was still
nothing to click.

Four approaches were tried and each failed on macOS Safari, which is the browser
this gets tested in:

1. `appearance: none` alone — strips the native control. A bare box, nothing to
   click.
2. A drawn SVG icon plus `showPicker()` on click — `showPicker()` opens nothing
   for a **time** input on macOS Safari, so the icon was decorative.
3. A `<select>` of time slots — capped the range at 19:00 and put a dropdown
   chevron on one field but not the other.
4. `appearance: auto` — Chromium draws its own picker button, **macOS Safari
   draws nothing at all**. Confirmed in Safari: no calendar, no clock, no
   control on either field.

**So the site now builds its own panels** (section 10b in `site.js`), opened by a
real `<button>` inside each field. Identical in every browser and on every
device, because nothing about it is native.

- **日期** — a month calendar with `‹ ›` navigation; days before `min` are
  disabled. Picking a day closes the panel.
- **時間** — two columns, 時 `00`–`23` and 分 `00`–`59`, so all 1440 minutes of
  the day are two taps away. It closes only once the reader has picked from
  *both* columns, never on the implied `00`, and clicking a column moves the
  highlight without re-rendering so the other column keeps its scroll position.

The inputs stay `type="date"` / `type="time"` underneath, so typing still works,
and the submitted values are unchanged: `YYYY-MM-DD` and `HH:MM`. **The Make
scenario and the Notion mapping need no changes.**

Rules if you touch this: keep `appearance: none` on both (`auto` makes Chromium
double-draw its indicator next to ours), keep `::-webkit-calendar-picker-indicator`
hidden, and keep the `.ctl` wrapper — the panel anchors to it, not to `.field`,
which also holds the label, hint and error line.

Client-side: required-field checks on blur and submit, no dates in the past,
`長輩姓名` appears and becomes required only when 邀請人 is `代長輩詢問`, plus a
hidden honeypot (`_gotcha`) that silently drops bots.

**Send one real test booking yourself** and confirm the Notion row and the email
both arrive — that end of the pipe was never fired during the build.

## The Tableau dashboard

Your dashboard is authored on a fixed **1654 × 1169** canvas, so it can never
reflow to a phone. The page renders it at native size and scales it with a CSS
transform instead: on screens ≥810px it scales to fit exactly; on phones it
stays at 62% (readable) inside a horizontally pannable frame. Vertical swipes
still scroll the page. The iframe only loads when you scroll near it.

If you ever republish the dashboard at a different size, update `CANVAS` in
`site.js` and `--dw` / `--dh` in `site.css`.

It is also the only English content on a Chinese site. Translating the titles and
field labels in Tableau is the real fix. Until then the Chinese findings above
the frame carry the meaning, so a Chinese-only reader gets the whole argument
without reading the dashboard at all — it functions as the evidence rather than
the explanation.

The findings block runs in three steps and the order is the point: the numbers
(`.finding__lead`), then the insight they support (`.finding__turn`), then what
changed in the programme because of it (`.pullout`). It is also the one place
where numbers appear on the site outside the dashboard.

**It sits before the dashboard deliberately, not after.** The reader is
Chinese-speaking and the workbook is English, so text-first turns the dashboard
into recognisable evidence instead of a wall to get past. It also matches the
argument the section is making — claim, then proof — rather than asking the
reader to interpret raw charts on their own. And on a phone the dashboard is a
tall interactive block; anything placed after it loses most of its readers.

## Rebuilding the images

Source photos live in the parent folder. `../build-assets.sh` regenerates
everything in `assets/` (resize, compress, video posters). Uses only macOS
built-ins (`sips`, `qlmanage`) — no ImageMagick or ffmpeg needed.

Note: `association_logo.jpg` is CMYK, which browsers render unreliably. The
script converts it to sRGB PNG. Keep that conversion if you swap the file.

## The atmosphere behind 合作

`assets/img/collab-bg.jpg` — night foliage in deep navy, generated with Flux.2
Klein 9B on Comfy Cloud. The palm fronds deliberately echo the ones in the hero
photograph. 80 KB. It fades in at 62% over the navy with a 52-second drift, and
`site.js` probes the file before touching the DOM, so deleting it simply returns
the section to plain navy.

To swap it, keep to this spec:

| | |
|---|---|
| Size | ~1536 × 1024, JPEG, under ~200 KB |
| Brightness | **Must already be dark.** The one hard requirement |
| Colour | Deep navy/blue only — nothing that fights `#0d1a50` |
| Subject | Abstract or textural, no focal point, quiet in the left third where the type sits |

The brightness rule is real: the layer uses plain opacity, so a bright image
reads as a photograph behind the type rather than atmosphere. (`mix-blend-mode:
soft-light` would make it tolerant of any brightness, but it forces a stacking
context that broke compositing here — so the constraint lives in the asset.)

Prompt used, if you want variations:

> Dense tropical foliage photographed at night in deep navy blue moonlight, soft
> atmospheric haze drifting between the leaves, very dark and low contrast, no
> subject and no focal point, shadows falling to near-black in the left third,
> fine natural film grain, monochromatic midnight blue, cinematic and quiet,
> wide establishing shot

## Known trade-offs

- **The two clips total ~8.6 MB.** They load only when you scroll near them,
  pause off-screen, and fall back to tap-to-play on slow or metered
  connections. Re-exporting them at a lower bitrate is the single biggest
  remaining performance win.
- **The dashboard is English-only and its red palette** sits outside the
  navy/white system. Both live in your Tableau workbook, not the site.
- The 60-second intro plays from YouTube (`youtube-nocookie`) rather than the
  local 126 MB `intro_video.mp4`, which is far too heavy to serve.
