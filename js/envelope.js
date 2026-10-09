/* ==========================================================================
   THE ENVELOPE (screen 1) — carried over from the first version.
   Tap: the seal presses, the flap lifts, the card slides out, its round
   photo grows to the middle of the screen, holds, and then everything
   fades straight into the opening page, which sits underneath in the
   same paper colour. Music (if any) starts with the tap.
   ========================================================================== */
(function () {
  'use strict';

  const SITE_CONTENT = window.SITE_CONTENT || {};

  const SITE_CONFIG = {
    ambientEmojis: ['🌻', '🍃'],   // drifting down behind the envelope
    ambientCount: 20,
    butterflyCount: 9,
    // Wing colours: apricot, terracotta, gold, sage
    butterflyColors: ['#eba77a', '#d68a67', '#c9a352', '#a9b78f'],
  };

  // Timings. OPEN_MS must match the open-sequence timings in
  // css/envelope.css (see the "Open sequence" comment above .envelope-float).
  const OPEN_MS = 4600;       // card has settled in front of the envelope
  const ZOOM_MS = 1100;       // round photo grows to the middle
  const ZOOM_HOLD_MS = 2000;  // pause on the enlarged photo
  const ZOOM_FADE_MS = 900;   // photo fades as the page appears

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // (start-up calls are at the very bottom, after every constant is defined)

  /* ==========================================================================
     ENVELOPE OPEN SEQUENCE
     ========================================================================== */
  function initEnvelope() {
    const envelopeBtn = document.getElementById('envelope');
    const screen = document.getElementById('envelope-screen');
    const main = document.getElementById('main');
    if (!envelopeBtn || !screen) return;
    let opened = false;

    function revealMain() {
      window.scrollTo(0, 0);
      document.documentElement.classList.remove('lock-scroll');
      document.body.classList.remove('lock-scroll');
      document.body.classList.add('is-revealed');
      if (main) main.inert = false;
      screen.classList.add('envelope-hidden');
      // Once faded, take the envelope screen out completely so its
      // butterflies stop using the phone's battery.
      const done = () => {
        screen.hidden = true;
        const layer = document.getElementById('ambient-decor');
        if (layer) layer.replaceChildren();
      };
      screen.addEventListener('transitionend', (e) => { if (e.target === screen) done(); }, { once: true });
      setTimeout(done, 1600);
      document.dispatchEvent(new Event('invite:revealed'));
    }

    envelopeBtn.addEventListener('click', () => {
      if (opened) return;
      opened = true;

      if (reduceMotion) {
        revealMain();
        return;
      }

      screen.classList.add('is-opening');

      setTimeout(async () => {
        screen.classList.add('is-zooming');
        const zoom = await zoomCardPhoto(screen.querySelector('.letter-photo'), ZOOM_MS);
        await new Promise((resolve) => setTimeout(resolve, ZOOM_HOLD_MS));
        revealMain();
        if (!zoom) return;
        await zoom.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.04)' }], {
          duration: ZOOM_FADE_MS, easing: 'ease', fill: 'forwards',
        }).finished;
        zoom.remove();
      }, OPEN_MS);
    });
  }

  /* Grows the round card photo from its spot on the card to a large circle
     in the middle of the screen (80% of the shorter side, never stretched).
     Works on a fixed-position copy laid exactly over the original, since
     the original is inside the transformed envelope. Resolves with the copy
     (still showing) so the caller can fade it out. */
  async function zoomCardPhoto(photo, duration) {
    if (!photo) return null;

    const rect = photo.getBoundingClientRect();
    const zoom = photo.cloneNode(true);
    zoom.classList.add('letter-zoom');
    zoom.setAttribute('aria-hidden', 'true');
    Object.assign(zoom.style, {
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
    });
    document.body.appendChild(zoom);
    photo.style.visibility = 'hidden';

    const size = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.8);
    const top = (window.innerHeight - size) / 2;
    const left = (window.innerWidth - size) / 2;
    const timing = { duration, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' };

    // The monogram is sized for the card; grow it with the circle.
    const label = zoom.querySelector('.letter-photo-fallback');
    const original = photo.querySelector('.letter-photo-fallback');
    if (label && original) {
      const startSize = getComputedStyle(original).fontSize;
      label.style.fontSize = startSize;
      label.animate([{ fontSize: startSize }, { fontSize: Math.round(size * 0.24) + 'px' }], timing);
    }

    await zoom.animate([
      { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', height: rect.height + 'px' },
      { top: top + 'px', left: left + 'px', width: size + 'px', height: size + 'px' },
    ], timing).finished;

    return zoom;
  }

  /* The card's round photo: shows the monogram until envelope.cardImage
     points at a real photo. */
  function initCardPhoto() {
    const frame = document.querySelector('.letter-photo');
    const img = frame && frame.querySelector('img');
    if (!img) return;
    const broken = () => frame.classList.add('image-broken');
    img.addEventListener('error', broken);
    img.addEventListener('load', () => frame.classList.add('is-loaded'));
    if (!img.getAttribute('src')) broken();
    else if (img.complete && img.naturalWidth === 0) broken();
  }

  /* ==========================================================================
     DRIFTING FLOWERS behind the envelope
     ========================================================================== */
  function initAmbientDecor(count = SITE_CONFIG.ambientCount) {
    const layer = document.getElementById('ambient-decor');
    if (!layer) return;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'ambient-piece';
      piece.textContent = SITE_CONFIG.ambientEmojis[Math.floor(Math.random() * SITE_CONFIG.ambientEmojis.length)];
      const duration = 10 + Math.random() * 8;
      piece.style.left = Math.random() * 100 + '%';
      piece.style.fontSize = 12 + Math.random() * 12 + 'px';
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = '-' + Math.random() * duration + 's';
      layer.appendChild(piece);
    }
  }

  /* ==========================================================================
     BUTTERFLIES
     A few butterflies wander around the envelope page on random looping
     paths, staying upright and leaning into their direction of travel,
     with an uneven up-and-down flutter on top. Wing flapping is CSS
     (see .butterfly in style.css); the flight path uses the Web Animations
     API so every butterfly gets its own route. Skipped for reduced motion.
     ========================================================================== */
  // One wing (the right one; the left is mirrored in CSS). The body axis is
  // x=0; the wing and body share the same 60-unit height.
  const BUTTERFLY_WING_SVG =
    '<svg viewBox="0 0 50 60">' +
      // hindwing first so the forewing overlaps it
      '<path class="wing-lower" d="M1 29 C12 28 26 30 32 36 C35.5 42 32.5 52 24.5 57 C16 60.5 7.5 56 3 48 C1 42 0.5 35 1 29 Z"/>' +
      '<path class="wing-upper" d="M1 19 C6 10 22 3 44 1.5 C49 1.2 50.5 4.5 48.5 9 C45.5 16 42.5 23.5 38 28 C28 29.5 14 30 1 31 Z"/>' +
      '<path class="wing-veins" d="M2 21 C14 14 28 8 44 4 M2 24.5 C14 20.5 28 17 41 16 M2 28 C14 26.5 26 25.5 37 26.5' +
        ' M3 33 C12 37 20 44 24.5 55 M2 35 C7 41 10 48 11.5 57"/>' +
      '<circle class="wing-spot" cx="43" cy="6.5" r="1.5"/>' +
      '<circle class="wing-spot" cx="39" cy="12" r="1.1"/>' +
    '</svg>';

  // Head, thorax, segmented abdomen and clubbed antennae.
  const BUTTERFLY_BODY_SVG =
    '<svg class="butterfly-body" viewBox="0 0 12 60">' +
      '<path class="antenna" d="M5 14 C3.5 7 1.5 1 -2.5 -7 M7 14 C8.5 7 10.5 1 14.5 -7"/>' +
      '<circle class="body-part" cx="-2.5" cy="-7" r="1"/>' +
      '<circle class="body-part" cx="14.5" cy="-7" r="1"/>' +
      '<circle class="body-part" cx="6" cy="15.5" r="2.7"/>' +
      '<ellipse class="body-part" cx="6" cy="23" rx="2.9" ry="5"/>' +
      '<ellipse class="body-part" cx="6" cy="30.5" rx="2.4" ry="2.6"/>' +
      '<ellipse class="body-part" cx="6" cy="35" rx="2.2" ry="2.5"/>' +
      '<ellipse class="body-part" cx="6" cy="39.3" rx="2" ry="2.4"/>' +
      '<ellipse class="body-part" cx="6" cy="43.4" rx="1.8" ry="2.3"/>' +
      '<ellipse class="body-part" cx="6" cy="47.3" rx="1.5" ry="2.1"/>' +
    '</svg>';

  function initButterflies() {
    const layer = document.getElementById('ambient-decor');
    if (!layer || !layer.animate) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    for (let i = 0; i < SITE_CONFIG.butterflyCount; i++) {
      const butterfly = document.createElement('span');
      butterfly.className = 'butterfly';
      butterfly.style.setProperty('--wing', SITE_CONFIG.butterflyColors[i % SITE_CONFIG.butterflyColors.length]);
      // Roughly the same size as the ambient emojis (12–24px) — a touch wider
      // since a butterfly is wider than it is tall.
      butterfly.style.setProperty('--size', (14 + Math.random() * 12) + 'px');
      butterfly.style.setProperty('--flap', (0.18 + Math.random() * 0.12) + 's');
      butterfly.innerHTML =
        '<span class="butterfly-inner">' +
          '<span class="wing wing-left">' + BUTTERFLY_WING_SVG + '</span>' +
          BUTTERFLY_BODY_SVG +
          '<span class="wing wing-right">' + BUTTERFLY_WING_SVG + '</span>' +
        '</span>';
      // Offset the flutter so they don't all bob in unison.
      butterfly.firstChild.style.animationDelay = '-' + (Math.random() * 1.7).toFixed(2) + 's';
      layer.appendChild(butterfly);
      flyButterfly(butterfly);
    }
  }

  function flyButterfly(butterfly) {
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;

    // Random waypoints (in vw/vh so the route scales with the screen).
    // Butterflies mostly drift sideways, so each hop can go anywhere
    // across but only a little up or down. The route returns to its start
    // so the loop is seamless.
    const points = [{ x: 4 + Math.random() * 88, y: 10 + Math.random() * 70 }];
    for (let i = 1; i < 6; i++) {
      const prev = points[i - 1];
      points.push({
        x: 4 + Math.random() * 88,
        y: Math.min(82, Math.max(8, prev.y + (Math.random() - 0.5) * 30)),
      });
    }
    points.push(points[0]);

    // Stay upright and just lean into the direction of travel (up to ~22deg)
    // rather than rotating to face it — no flying upside down.
    const MAX_LEAN = 22;
    const segLengths = [];
    const leans = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = (points[i + 1].x - points[i].x) * vw;
      const dy = (points[i + 1].y - points[i].y) * vh;
      const len = Math.hypot(dx, dy);
      segLengths.push(len);
      leans.push(len ? (dx / len) * MAX_LEAN : 0);
    }
    // Finish with the first lean again so the loop doesn't snap.
    leans.push(leans[0]);

    const total = segLengths.reduce((a, b) => a + b, 0);
    let travelled = 0;
    const keyframes = points.map((p, i) => {
      const frame = {
        transform: `translate(${p.x}vw, ${p.y}vh) rotate(${leans[i]}deg)`,
        offset: total ? travelled / total : i / (points.length - 1),
        easing: 'ease-in-out',   // drifts to a slow turn at each waypoint
      };
      if (i < segLengths.length) travelled += segLengths[i];
      return frame;
    });
    keyframes[keyframes.length - 1].offset = 1;

    const pxPerSecond = 45 + Math.random() * 30;
    const duration = Math.max(12000, (total / pxPerSecond) * 1000);
    const anim = butterfly.animate(keyframes, { duration, iterations: Infinity });
    anim.currentTime = Math.random() * duration;   // start mid-route
  }

  /* ==========================================================================
     BACKGROUND MUSIC
     Plays musicUrl from js/content.js on a loop. Browsers only allow sound
     after a tap, so it starts when the envelope is tapped, fading in. The
     round button pauses/resumes it; it also pauses while the tab or app is
     in the background. Missing file or blank musicUrl: no music, no button.
     ========================================================================== */
  function initMusic() {
    const btn = document.getElementById('music-toggle');
    if (!btn) return;

    const src = SITE_CONTENT.musicUrl;
    if (typeof src !== 'string' || !src.trim() || /^(javascript|data):/i.test(src.trim())) {
      btn.remove();
      return;
    }

    const VOLUME = 0.6;
    const audio = new Audio(src.trim());
    audio.loop = true;
    audio.preload = 'auto';

    let wanted = false;   // whether the guest wants music on
    let fadeTimer = null;

    function setState(playing) {
      btn.classList.toggle('is-paused', !playing);
      btn.setAttribute('aria-pressed', String(playing));
      btn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    }

    function play() {
      clearInterval(fadeTimer);
      audio.volume = 0;
      audio.play().then(() => {
        setState(true);
        fadeTimer = setInterval(() => {
          audio.volume = Math.min(VOLUME, audio.volume + 0.03);
          if (audio.volume >= VOLUME) clearInterval(fadeTimer);
        }, 80);
      }).catch(() => setState(false));
    }

    function pause() {
      clearInterval(fadeTimer);
      audio.pause();
      setState(false);
    }

    audio.addEventListener('error', () => {
      wanted = false;
      btn.remove();
    });

    // play() must run inside the tap itself for browsers to allow sound.
    document.getElementById('envelope').addEventListener('click', () => {
      wanted = true;
      btn.hidden = false;
      play();
    }, { once: true });

    btn.addEventListener('click', () => {
      wanted = audio.paused;
      if (wanted) play();
      else pause();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) audio.pause();
      else if (wanted) play();
    });
  }

  /* ---- start-up ---- */
  initCardPhoto();
  initAmbientDecor();
  initButterflies();
  initEnvelope();
  initMusic();
})();