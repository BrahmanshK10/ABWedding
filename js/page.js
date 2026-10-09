/* ==========================================================================
   THE INVITATION PAGE
   Fills the page from js/content.js and runs everything that happens
   while scrolling: the page colour drifting between events, the layered
   artwork, the gold threads, the event details, calendar links, map,
   scratch card and countdown.
   (The envelope screen lives in js/envelope.js.)
   ========================================================================== */
(function () {
    'use strict';

    const C = window.SITE_CONTENT;
    if (!C) {
        showContentError();
        return;
    }

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const smooth = (t) => t * t * (3 - 2 * t);
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), C);
    const main = document.getElementById('main');

    /* ==========================================================================
       CONTENT
       Elements opt in with:
         data-content="a.b"       text (blank hides the element, \n = new line)
         data-content-img="a.b"   image path
         data-content-alt="a.b"   image description
       A path missing from content.js leaves the element as it is.
       ========================================================================== */
    function setText(el, value) {
        el.replaceChildren();
        String(value).split('\n').forEach((line, i) => {
            if (i > 0) el.appendChild(document.createElement('br'));
            el.appendChild(document.createTextNode(line));
        });
    }

    function isSafeUrl(url, allowImageData = false) {
        if (allowImageData && /^data:image\//i.test(url)) return true;
        if (/^(https?:|mailto:|tel:)/i.test(url)) return true;
        return !/^[a-z][a-z0-9+.-]*:/i.test(url);   // relative path
    }

    function bindContent() {
        if (C.pageTitle) document.title = C.pageTitle;

        $$('[data-content]').forEach((el) => {
            const value = get(el.dataset.content);
            if (typeof value !== 'string') return;
            if (!value.trim()) el.hidden = true;
            else setText(el, value);
        });

        $$('[data-content-img]').forEach((img) => {
            const src = get(img.dataset.contentImg);
            if (typeof src !== 'string') return;
            if (src.trim() && isSafeUrl(src.trim(), true)) {
                img.src = src.trim();
            } else {
                markMissing(img);
            }
        });

        $$('[data-content-alt]').forEach((img) => {
            const alt = get(img.dataset.contentAlt);
            if (typeof alt === 'string') img.alt = alt;
        });

        // Missing or broken decorative images quietly disappear.
        $$('#main img').forEach((img) => {
            img.addEventListener('error', () => markMissing(img));
            if (img.complete && img.getAttribute('src') && img.naturalWidth === 0) markMissing(img);
        });
    }

    function markMissing(img) {
        img.removeAttribute('src');
        img.classList.add('is-missing');
    }

    /* ==========================================================================
       COLOURS — each chapter's text colours, and the page colours used by
       the backdrop below.
       ========================================================================== */
    const palettes = {};
    const passageStops = (C.theme && C.theme.passages) || {};

    function applyPalettes() {
        const chapters = (C.theme && C.theme.chapters) || {};
        Object.keys(chapters).forEach((key) => { palettes[key] = Object.assign({}, chapters[key]); });
        $$('[data-chapter]').forEach((el) => paintChapter(el, palettes[el.dataset.chapter]));
    }

    function paintChapter(el, p) {
        if (!p) return;
        if (p.ink) el.style.setProperty('--ink', p.ink);
        if (p.soft) el.style.setProperty('--soft', p.soft);
        if (p.accent) el.style.setProperty('--accent', p.accent);
    }

    /* ---- colour maths: blends happen in OKLab so a fade from one colour
       to another never passes through a muddy grey ---- */
    function hexToRgb(hex) {
        let h = String(hex).trim().replace('#', '');
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        const n = parseInt(h, 16);
        if (!/^[0-9a-f]{6}$/i.test(h) || isNaN(n)) return null;
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    const toLinear = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const fromLinear = (c) => {
        const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        return Math.round(clamp(v, 0, 1) * 255);
    };

    function rgbToOklab([r, g, b]) {
        r = toLinear(r); g = toLinear(g); b = toLinear(b);
        const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        return [
            0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
        ];
    }

    function oklabToRgb([L, a, b]) {
        const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
        const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
        const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
        return [
            fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
            fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
            fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
        ];
    }

    const lab = (hex, fallback) => rgbToOklab(hexToRgb(hex) || hexToRgb(fallback) || [248, 244, 242]);
    const mixLab = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

    function mixStops(stops, t) {
        if (stops.length === 1) return stops[0];
        const x = clamp(t, 0, 1) * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(x));
        return mixLab(stops[i], stops[i + 1], x - i);
    }

    /* ==========================================================================
       BACKDROP
       The page colour is worked out from whatever sits in the middle of the
       screen: inside a chapter it is that chapter's colour; inside a passage
       it glides through the passage's colours to the next chapter's.
       ========================================================================== */
    const DARK_INK = lab('#3d2a20');
    const LIGHT_INK = lab('#f6ead6');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    let segments = [];
    let lastBg = '';
    let lastInk = '';
    let lastMetaAt = 0;
    const mapBox = document.getElementById('map');
    const floaters = $$('.passage, #scroll-hint, #music-toggle');
    const daylight = $$('[data-daylight]').map((el) => ({ el, night: el.dataset.daylight === 'night', last: '' }));

    function chapterLab(key) {
        const p = palettes[key];
        return lab(p && p.bg, '#f8f4f2');
    }

    function buildSegments() {
        segments = Array.from(main.children)
            .filter((el) => el.dataset.chapter || el.classList.contains('passage'))
            .map((el) => {
                const seg = { el, top: docTop(el), h: el.offsetHeight };
                if (el.classList.contains('passage')) {
                    const via = passageStops[el.dataset.via] || [];
                    seg.stops = [chapterLab(el.dataset.from)]
                        .concat(via.map((hex) => lab(hex)))
                        .concat([chapterLab(el.dataset.to)]);
                } else {
                    seg.colour = chapterLab(el.dataset.chapter);
                }
                return seg;
            });
    }

    function colourAt(y) {
        for (const seg of segments) {
            if (y < seg.top + seg.h) {
                if (seg.colour) return seg.colour;
                // hold briefly at each end so the change happens mid-passage
                const t = clamp(((y - seg.top) / seg.h - 0.08) / 0.84, 0, 1);
                return mixStops(seg.stops, smooth(t));
            }
        }
        const last = segments[segments.length - 1];
        return last ? (last.colour || last.stops[last.stops.length - 1]) : lab('#f8f4f2');
    }

    function paintBackdrop(scrollY, vh) {
        if (!segments.length) return;
        const c = colourAt(scrollY + vh * 0.5);
        const rgb = oklabToRgb(c);
        const css = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        if (css === lastBg) return;
        lastBg = css;

        // The colour goes straight onto the page, and the matching text colours
        // only onto the few things that float over it (the passages' lines, the
        // scroll cue and the music button). Changing a variable on the whole
        // page instead would make the phone restyle everything on every frame.
        document.documentElement.style.backgroundColor = css;
        if (mapBox) mapBox.style.setProperty('--page-bg', css);

        // Text that floats over the changing colour flips smoothly between
        // dark and light, so it's readable on paper, night and morning alike.
        const t = smooth(clamp((c[0] - 0.5) / 0.16, 0, 1));
        const ink = oklabToRgb(mixLab(LIGHT_INK, DARK_INK, t));
        const inkCss = `rgb(${ink[0]}, ${ink[1]}, ${ink[2]})`;
        const surf = oklabToRgb(mixLab(c, t > 0.5 ? lab('#ffffff') : lab('#000000'), 0.35));
        const surfCss = `rgba(${surf[0]}, ${surf[1]}, ${surf[2]}, 0.8)`;
        if (inkCss + surfCss !== lastInk) {
            lastInk = inkCss + surfCss;
            floaters.forEach((el) => {
                el.style.setProperty('--auto-ink', inkCss);
                el.style.setProperty('--auto-surface', surfCss);
            });
        }

        // Night and morning pieces: the Sagan's curtain, disco balls and dance
        // floor (data-daylight="night") show only while the sky is dark, and the
        // Haldi's watercolours (data-daylight="day"), made for light paper, only
        // once it is light. So as the night turns to dawn between them, one set
        // fades away and the other blooms in, and neither sits on the wrong sky.
        const day = smooth(clamp((c[0] - 0.55) / 0.3, 0, 1));
        const night = 1 - smooth(clamp((c[0] - 0.4) / 0.3, 0, 1));
        daylight.forEach((d) => {
            const v = (d.night ? night : day).toFixed(2);
            if (v === d.last) return;
            d.last = v;
            d.el.style.opacity = v === '1.00' ? '' : v;
            d.el.style.visibility = v === '0.00' ? 'hidden' : '';
        });

        // Tints the phone's address bar to match (not every frame).
        const now = performance.now();
        if (themeMeta && now - lastMetaAt > 120) {
            lastMetaAt = now;
            themeMeta.setAttribute('content', '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join(''));
        }
    }

    /* ==========================================================================
       LAYERED MOTION (.fx elements)
         data-depth="0.2"   drifts slower than the page (negative: faster)
         data-rise="60"     slides in from 60px below (negative: from above)
         data-fade          fades in as it arrives
         data-span="0.8"    how much of a screen-height the arrival takes
       ========================================================================== */
    let fxItems = [];
    let passages = [];

    function docTop(el) {
        let top = 0;
        for (let n = el; n; n = n.offsetParent) top += n.offsetTop;
        return top;
    }

    function measure() {
        fxItems = $$('.fx').map((el) => ({
            el,
            top: docTop(el),
            h: el.offsetHeight,
            depth: parseFloat(el.dataset.depth || '0'),
            rise: parseFloat(el.dataset.rise || '0'),
            fade: el.hasAttribute('data-fade'),
            span: parseFloat(el.dataset.span || '0.6'),
        }));
        passages = $$('.passage').map((el) => ({
            el,
            top: docTop(el),
            h: el.offsetHeight,
            a: $('.thread-a path', el),
            b: $('.thread-b path', el),
            last: '',
        }));
        if (vows.track) {
            vows.top = docTop(vows.track);
            vows.h = vows.track.offsetHeight;
            vows.radius = vows.ring ? vows.ring.clientWidth * 0.4 : 0;
            if (vowShown >= 0) placeWalker(vowShown);
        }
        buildSegments();
    }

    function updateFx(y, vh) {
        for (const f of fxItems) {
            if (f.top > y + vh * 1.6 || f.top + f.h < y - vh * 0.8) continue;
            let ty = 0;
            let opacity = null;
            if (f.depth) {
                // measured from where the layer sits naturally: at the top of the
                // page for anything on the first screen, otherwise when it is
                // centred on screen
                const anchor = f.top + f.h / 2 < vh ? 0 : f.top + f.h / 2 - vh / 2;
                ty += clamp((y - anchor) * f.depth, -160, 160);
            }
            if (f.rise || f.fade) {
                const e = easeOut(clamp((y + vh - f.top) / (vh * f.span), 0, 1));
                if (f.rise) ty += (1 - e) * f.rise;
                if (f.fade) opacity = e;
            }
            f.el.style.transform = ty ? `translate3d(0, ${ty.toFixed(1)}px, 0)` : '';
            if (opacity !== null) f.el.style.opacity = opacity.toFixed(3);
        }
    }

    // Gold threads draw themselves as a passage moves up the screen; the
    // line of text fades in halfway.
    function updatePassages(y, vh) {
        for (const p of passages) {
            const t = clamp((y + vh * 0.8 - p.top) / p.h, 0, 1);
            const key = t.toFixed(3);
            if (key === p.last) continue;
            p.last = key;
            if (p.a) p.a.style.strokeDashoffset = String(1 - clamp(t / 0.45, 0, 1));
            if (p.b) p.b.style.strokeDashoffset = String(1 - clamp((t - 0.52) / 0.43, 0, 1));
            p.el.style.setProperty('--cap', smooth(clamp((t - 0.3) / 0.22, 0, 1)).toFixed(3));
            p.el.style.setProperty('--gem', smooth(clamp((t - 0.92) / 0.08, 0, 1)).toFixed(3));
        }
    }

    let ticking = false;
    function frame() {
        ticking = false;
        const y = window.scrollY || window.pageYOffset;
        const vh = window.innerHeight;
        paintBackdrop(y, vh);
        updateVows(y, vh);   // driven by the guest's own scrolling, so always on
        if (!reduceMotion) {
            updateFx(y, vh);
            updatePassages(y, vh);
        }
        updateScrollHint(y);
    }

    function requestFrame() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(frame);
        }
    }

    let lastWidth = window.innerWidth;
    let measureQueued = false;
    function remeasure() {
        if (measureQueued) return;
        measureQueued = true;
        requestAnimationFrame(() => {
            measureQueued = false;
            measure();
            frame();
        });
    }

    function initScrollEngine() {
        measure();
        frame();
        window.addEventListener('scroll', requestFrame, { passive: true });
        window.addEventListener('resize', () => {
            // A phone's address bar sliding in/out only changes the height;
            // the layout itself only moves when the width changes.
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                remeasure();
                drawCurtain();
            } else {
                requestFrame();
            }
        });
        // Images arriving, fonts loading or content changing shift the layout.
        main.addEventListener('load', remeasure, true);
        if (window.ResizeObserver) new ResizeObserver(remeasure).observe(main);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
        window.addEventListener('load', remeasure);
    }

    /* ==========================================================================
       TEXT REVEALS + PAUSING OFF-SCREEN ANIMATIONS
       ========================================================================== */
    function initReveals() {
        const items = $$('.reveal');
        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        items.forEach((el) => io.observe(el));
    }

    function initNearState() {
        const chapters = $$('.chapter');
        if (!('IntersectionObserver' in window)) {
            chapters.forEach((el) => el.classList.add('is-near'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => e.target.classList.toggle('is-near', e.isIntersecting));
        }, { rootMargin: '60% 0px 60% 0px' });
        chapters.forEach((el) => io.observe(el));
    }

    /* ==========================================================================
       EVENTS — dates, venue, calendar, schedule, "Today" badges
       ========================================================================== */
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];
    const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const TZ = Object.assign({ offset: '+05:30', name: 'Asia/Kolkata' }, C.timeZone || {});
    const events = C.events || {};
    const venue = C.venue || {};
    const labels = Object.assign({
        directions: 'Directions', addToCalendar: 'Add to calendar',
        googleCalendar: 'Google Calendar', appleCalendar: 'Apple / Outlook',
        dressCode: 'Dress code', today: 'Today', happeningNow: 'Happening now',
    }, C.labels || {});

    const ICON_PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/></svg>';
    const ICON_SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>';
    const ICON_CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
    const ICON_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';
    const ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5z"/></svg>';

    function eventTimes(ev) {
        const start = new Date(`${ev.date}T${ev.start || '00:00'}:00${TZ.offset}`);
        let end = ev.end ? new Date(`${ev.date}T${ev.end}:00${TZ.offset}`) : new Date(start.getTime() + 3 * 3600e3);
        if (end <= start) end = new Date(end.getTime() + 864e5);   // ends after midnight
        return isNaN(start) || isNaN(end) ? null : { start, end };
    }

    function to12h(hhmm) {
        const [h, m] = String(hhmm || '').split(':').map(Number);
        if (isNaN(h)) return '';
        return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    }

    function el(tag, cls, text) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) setText(node, text);
        return node;
    }

    function renderDateBlock(box, ev) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ev.date || '');
        if (!m || ev.showDate === false) { box.hidden = true; return; }
        const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
        const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
        const time = ev.timeLabel != null && String(ev.timeLabel).trim() ? ev.timeLabel : to12h(ev.start);

        const wrap = el('time', 'date-block-inner');
        wrap.dateTime = `${ev.date}T${ev.start || '00:00'}${TZ.offset}`;
        wrap.style.display = 'contents';
        const row = el('span', 'db-row');
        row.append(el('span', 'db-side', weekday), el('span', 'db-day', String(d).padStart(2, '0')), el('span', 'db-side', time));
        wrap.append(el('span', 'db-month', MONTHS[mo - 1]), row, el('span', 'db-year', String(y)));
        box.replaceChildren(wrap);
    }

    function icsEscape(s) {
        return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    }

    const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const calendarPlace = () => [venue.name, venue.address].filter(Boolean).join(', ');
    const calendarDetails = (ev) =>
        [ev.title, venue.directionsUrl ? `Directions: ${venue.directionsUrl}` : ''].filter(Boolean).join('\n');

    // One event in calendar-file form (with a reminder 3 hours before)
    function vevent(id, ev, times) {
        const title = ev.calendarTitle || ev.title || 'Celebration';
        const place = calendarPlace();
        return [
            'BEGIN:VEVENT',
            `UID:${id}-${ev.date}@invitation`,
            `DTSTAMP:${utcStamp(new Date())}`,
            `DTSTART:${utcStamp(times.start)}`,
            `DTEND:${utcStamp(times.end)}`,
            `SUMMARY:${icsEscape(title)}`,
            place ? `LOCATION:${icsEscape(place)}` : '',
            `DESCRIPTION:${icsEscape(calendarDetails(ev))}`,
            'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(title)}`, 'END:VALARM',
            'END:VEVENT',
        ].filter(Boolean);
    }

    function icsHref(vevents) {
        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
            .concat(...vevents, ['END:VCALENDAR'])
            .join('\r\n');
        return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    }

    function calendarLinks(id, ev, times) {
        const google = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
            action: 'TEMPLATE',
            text: ev.calendarTitle || ev.title || 'Celebration',
            dates: `${utcStamp(times.start)}/${utcStamp(times.end)}`,
            details: calendarDetails(ev),
            location: calendarPlace(),
            ctz: TZ.name,
        }).toString();
        return { google, ics: icsHref([vevent(id, ev, times)]) };
    }

    function linkButton(href, label, icon, small) {
        const a = document.createElement('a');
        a.className = 'btn' + (small ? ' btn-small' : '');
        a.href = href;
        if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
        a.innerHTML = icon || '';
        a.appendChild(document.createTextNode(label));
        return a;
    }

    // "Add to calendar" under an event. (Directions live once, with the
    // venue further down, since every event is at the same place.)
    function renderEventActions(box, id, ev) {
        const times = eventTimes(ev);
        box.replaceChildren();
        const actions = el('div', 'actions');

        if (times) {
            const links = calendarLinks(id, ev, times);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn';
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', `cal-${id}`);
            btn.innerHTML = ICON_CAL;
            btn.appendChild(document.createTextNode(labels.addToCalendar));

            const menu = el('div', 'cal-menu');
            menu.id = `cal-${id}`;
            menu.hidden = true;
            menu.appendChild(linkButton(links.google, labels.googleCalendar, '', true));
            const ics = linkButton(links.ics, labels.appleCalendar, '', true);
            ics.download = `${id}.ics`;
            menu.appendChild(ics);

            btn.addEventListener('click', () => {
                const open = menu.hidden;
                menu.hidden = !open;
                btn.setAttribute('aria-expanded', String(open));
                remeasure();
            });
            actions.appendChild(btn);
            box.append(actions, menu);
        }

        if (!box.children.length) box.hidden = true;
    }

    function renderDress(box, ev) {
        if (!ev.dressCode || !String(ev.dressCode).trim()) { box.hidden = true; return; }
        box.replaceChildren(el('b', null, labels.dressCode), document.createTextNode(ev.dressCode));
    }

    // The wedding's rituals. Each one with an "about" line is a button:
    // tapping it shows what the ritual means below the grid (tap again to
    // close).
    function renderSchedule() {
        const list = document.getElementById('schedule');
        const items = (events.wedding && events.wedding.schedule) || [];
        if (!list) return;
        if (!items.length) { list.closest('.schedule-wrap').hidden = true; return; }
        const panel = document.getElementById('ritual-panel');
        const nameEl = document.getElementById('ritual-name');
        const aboutEl = document.getElementById('ritual-about');
        const buttons = [];
        let open = -1;

        function show(i) {
            buttons.forEach((b, j) => b.setAttribute('aria-expanded', String(j === i)));
            open = i;
            if (i < 0) { panel.hidden = true; remeasure(); return; }
            setText(nameEl, items[i].name || '');
            setText(aboutEl, items[i].about);
            panel.hidden = false;
            panel.classList.remove('is-new');
            void panel.offsetWidth;   // restart the fade-in
            panel.classList.add('is-new');
            remeasure();
        }

        items.forEach((item, i) => {
            const li = el('li', 'sch-item reveal');
            li.style.setProperty('--rd', `${(i % 3) * 0.12}s`);
            const btn = el('button', 'sch-btn');
            btn.type = 'button';
            const hasAbout = !!(item.about && String(item.about).trim());
            if (hasAbout) {
                btn.setAttribute('aria-expanded', 'false');
                btn.setAttribute('aria-controls', 'ritual-panel');
                btn.addEventListener('click', () => show(open === i ? -1 : i));
            } else {
                btn.disabled = true;
            }
            const icon = el('span', 'sch-icon');
            if (item.icon && isSafeUrl(item.icon)) {
                const img = document.createElement('img');
                img.src = item.icon;
                img.alt = '';
                img.loading = 'lazy';
                img.addEventListener('error', () => markMissing(img));
                icon.appendChild(img);
            }
            btn.append(icon, el('span', 'sch-time', item.time || ''), el('span', 'sch-name', item.name || ''));
            li.appendChild(btn);
            list.appendChild(li);
            buttons.push(btn);
        });

        const hint = $('.schedule-hint');
        if (hint && !items.some((it) => it.about && String(it.about).trim())) hint.hidden = true;
    }

    function offsetMinutes() {
        const m = /^([+-])(\d{2}):?(\d{2})$/.exec(TZ.offset);
        return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 330;
    }

    // "Today" / "Happening now" above an event while it applies.
    function updateBadges() {
        const now = new Date();
        const todayThere = new Date(now.getTime() + offsetMinutes() * 60e3).toISOString().slice(0, 10);
        $$('[data-event]').forEach((section) => {
            const ev = events[section.dataset.event];
            const badge = $('.event-badge', section);
            const times = ev && eventTimes(ev);
            if (!badge || !times) return;
            let text = '';
            if (now >= times.start && now < times.end) text = labels.happeningNow;
            else if (ev.date === todayThere && now < times.start) text = labels.today;
            badge.hidden = !text;
            if (text) badge.textContent = text;
        });
    }

    function renderEvents() {
        $$('[data-date-block]').forEach((box) => {
            const ev = events[box.dataset.dateBlock];
            if (ev) renderDateBlock(box, ev); else box.hidden = true;
        });
        $$('[data-event-actions]').forEach((box) => {
            const ev = events[box.dataset.eventActions];
            if (ev) renderEventActions(box, box.dataset.eventActions, ev); else box.hidden = true;
        });
        $$('[data-dress]').forEach((box) => {
            const ev = events[box.dataset.dress];
            if (ev) renderDress(box, ev); else box.hidden = true;
        });
        renderSchedule();
        updateBadges();
        setInterval(updateBadges, 60e3);
    }

    /* ==========================================================================
       VENUE MAP, CONTACTS
       ========================================================================== */
    // Accepts a bare embed URL or the whole <iframe> snippet Google gives you.
    function extractMapSrc(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        const match = value.match(/src\s*=\s*["']([^"']+)["']/i);
        const src = (match ? match[1] : value).trim().replace(/&amp;/g, '&');
        return /^https:\/\//i.test(src) ? src : null;
    }

    function renderVenue() {
        const mapBox = document.getElementById('map');
        const src = extractMapSrc(venue.mapEmbed);
        if (mapBox && src) {
            const clip = el('div', 'map-clip');
            const iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.title = venue.name ? `Map: ${venue.name}` : 'Map';
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            clip.appendChild(iframe);
            mapBox.appendChild(clip);
            mapBox.hidden = false;
        }

        const dir = document.getElementById('venue-directions');
        if (dir && venue.directionsUrl && isSafeUrl(venue.directionsUrl)) {
            dir.href = venue.directionsUrl;
            dir.innerHTML = ICON_PIN;
            dir.appendChild(document.createTextNode(labels.directions));
            dir.hidden = false;
        }


        const people = ((C.contacts && C.contacts.people) || []).filter((p) => p && (p.name || p.phone));
        if (people.length) {
            const list = document.getElementById('contact-list');
            people.forEach((p) => {
                const li = el('li', 'contact');
                if (p.name) li.appendChild(el('span', 'contact-name', p.name));
                if (p.role) li.appendChild(el('span', 'contact-role', p.role));
                const phone = String(p.phone || '').replace(/[^\d+]/g, '');
                if (phone) {
                    const actions = el('div', 'actions');
                    actions.appendChild(linkButton(`tel:${phone}`, 'Call', ICON_PHONE, true));
                    actions.appendChild(linkButton(`https://wa.me/${phone.replace(/\D/g, '')}`, 'WhatsApp', ICON_CHAT, true));
                    li.appendChild(actions);
                }
                list.appendChild(li);
            });
            document.getElementById('contacts').hidden = false;
        }
    }

    /* ==========================================================================
       THE SEVEN VOWS — while the stage is held on screen, scrolling walks the
       marker round the fire, lights the diyas one by one and changes the vow.
       Tapping a diya scrolls to its vow.
       ========================================================================== */
    const vowsText = C.vows || {};
    const vows = {
        section: document.getElementById('vows'),
        track: document.getElementById('vows-track'),
        ring: document.getElementById('vows-ring'),
        walker: document.getElementById('vows-walker'),
        text: document.getElementById('vow-text'),
        stepEl: document.getElementById('vow-step'),
        lineEl: document.getElementById('vow-line'),
        agni: null,
        orbit: null,
        glow: null,
        diyas: [],
        n: 0,
        top: 0,
        h: 0,
        radius: 0,
        heat: '',
        state: '',
        swapTimer: null,
    };

    // Where the scroll says the marker should be (0–1 round the fire), and
    // where it is drawn: it glides towards the target, so the walk stays
    // smooth even when a phone reports the scroll position in jumps.
    let vowTarget = 0;
    let vowShown = -1;
    let vowFrame = 0;

    // a point on the ring, as % of its size (angle 0 = the top)
    function ringPoint(turn) {
        const a = (turn * 360 - 90) * Math.PI / 180;
        return { left: (50 + 40 * Math.cos(a)).toFixed(2) + '%', top: (50 + 40 * Math.sin(a)).toFixed(2) + '%' };
    }

    function initVows() {
        if (!vows.section || !vows.ring) return;
        const steps = Array.isArray(vowsText.steps) ? vowsText.steps.filter(Boolean) : [];
        if (!steps.length) { vows.section.hidden = true; return; }
        vows.n = steps.length;
        vows.agni = $('.agni', vows.ring);
        vows.orbit = $('.orbit-done', vows.ring);
        vows.glow = $('.orbit-glow', vows.ring);
        const names = vowsText.stepNames || [];

        for (let i = 0; i < vows.n; i++) {
            const b = el('button', 'vow-diya');
            b.type = 'button';
            Object.assign(b.style, ringPoint(i / vows.n));
            b.setAttribute('aria-label', names[i] || `Vow ${i + 1}`);
            b.innerHTML = '<span class="diya-flame"></span><span class="diya-bowl"></span>';
            b.addEventListener('click', () => scrollToVow(i));
            vows.ring.appendChild(b);
            vows.diyas.push(b);
        }
        renderVowState(0, 1);
    }

    function scrollToVow(i) {
        const span = vows.h - window.innerHeight;
        if (span <= 0) return;
        window.scrollTo({ top: vows.top + span * ((i + 0.5) / vows.n), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function updateVows(y, vh) {
        if (!vows.n || !vows.h) return;
        if (vows.top > y + vh || vows.top + vows.h < y) return;   // off screen
        const span = vows.h - vh;
        vowTarget = span > 0 ? clamp((y - vows.top) / span, 0, 1) : 0;
        // first sight, or reduced motion: jump straight there
        if (vowShown < 0 || reduceMotion) {
            vowShown = vowTarget;
            drawVows();
            return;
        }
        if (!vowFrame) vowFrame = requestAnimationFrame(glideVows);
    }

    function glideVows() {
        vowFrame = 0;
        const d = vowTarget - vowShown;
        vowShown = Math.abs(d) < 0.0008 ? vowTarget : vowShown + d * 0.2;
        drawVows();
        if (vowShown !== vowTarget) vowFrame = requestAnimationFrame(glideVows);
    }

    // The marker is turned round the centre of the ring (a transform, so the
    // phone does no layout work while scrolling).
    function placeWalker(p) {
        vows.walker.style.transform = `rotate(${(p * 360).toFixed(2)}deg) translateY(${(-vows.radius).toFixed(1)}px)`;
    }

    function drawVows() {
        const p = vowShown;
        placeWalker(p);
        const offset = String(1 - p);
        if (vows.orbit) vows.orbit.style.strokeDashoffset = offset;
        if (vows.glow) vows.glow.style.strokeDashoffset = offset;
        const complete = p >= 0.985;
        const step = Math.min(vows.n - 1, Math.floor(p * vows.n));
        const lit = complete ? vows.n : step + 1;
        const heat = (lit / vows.n).toFixed(3);
        if (vows.agni && heat !== vows.heat) {
            vows.heat = heat;
            vows.agni.style.setProperty('--heat', heat);
        }
        renderVowState(complete ? -1 : step, lit);
    }

    // step -1 = all seven taken (the closing line shows)
    function renderVowState(step, lit) {
        const key = `${step}:${lit}`;
        if (key === vows.state) return;
        const first = vows.state === '';
        vows.state = key;
        vows.diyas.forEach((d, i) => {
            d.classList.toggle('is-lit', i < lit);
            d.classList.toggle('is-current', i === step);
            if (i === step) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
        });
        vows.section.classList.toggle('is-complete', step < 0);

        const names = vowsText.stepNames || [];
        const apply = () => {
            if (step < 0) {
                vows.stepEl.hidden = true;
                setText(vows.lineEl, vowsText.complete || '');
            } else {
                vows.stepEl.hidden = false;
                setText(vows.stepEl, names[step] || `Step ${step + 1}`);
                setText(vows.lineEl, vowsText.steps[step] || '');
            }
            vows.text.classList.remove('is-out');
        };
        clearTimeout(vows.swapTimer);
        if (first || reduceMotion) { apply(); return; }
        vows.text.classList.add('is-out');            // fade out, swap, fade in
        vows.swapTimer = setTimeout(apply, 260);
    }

    /* ==========================================================================
       OUR FAMILIES — one group per family: its name, then each member on a
       line of their own. Groups with no names are left out.
       ========================================================================== */
    function renderFamily() {
        const box = document.getElementById('family-groups');
        if (!box) return;
        const groups = ((C.family && C.family.families) || [])
            .map((f) => ({ name: (f && f.name) || '', members: ((f && f.members) || []).filter((m) => m && String(m).trim()) }))
            .filter((f) => f.members.length);
        if (!groups.length) { box.hidden = true; return; }
        groups.forEach((f, i) => {
            const group = el('div', 'family-group reveal');
            group.style.setProperty('--rd', `${i * 0.15}s`);
            if (f.name) group.appendChild(el('h3', 'family-name', f.name));
            const list = el('ul', 'family-members');
            f.members.forEach((m) => list.appendChild(el('li', null, m)));
            group.appendChild(list);
            box.appendChild(group);
        });
    }

    /* ==========================================================================
       SAVE ALL DATES (one calendar file) + SHARE THE INVITATION
       ========================================================================== */
    function initClosingActions() {
        const all = document.getElementById('save-all-dates');
        const ids = Object.keys(events).filter((id) => eventTimes(events[id]));
        if (all && ids.length) {
            all.href = icsHref(ids.map((id) => vevent(id, events[id], eventTimes(events[id]))));
            all.download = 'wedding-celebrations.ics';
            all.innerHTML = ICON_CAL;
            all.appendChild(document.createTextNode(labels.saveAllDates || 'Save all dates'));
            all.hidden = false;
        }

        const share = document.getElementById('share-invite');
        if (!share) return;
        const label = labels.share || 'Share the invitation';
        const setLabel = (text) => {
            share.innerHTML = ICON_SHARE;
            share.appendChild(document.createTextNode(text));
        };
        setLabel(label);
        share.addEventListener('click', async () => {
            const url = location.href.split('#')[0];
            if (navigator.share) {
                try {
                    await navigator.share({ title: document.title, text: C.shareText || '', url });
                    return;
                } catch (err) {
                    if (err && err.name === 'AbortError') return;   // guest closed the share sheet
                }
            }
            if (await copyText(url)) {
                setLabel(labels.linkCopied || 'Link copied');
                setTimeout(() => setLabel(label), 2200);
            }
        });
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { /* not supported */ }
            ta.remove();
            return ok;
        }
    }

    /* ==========================================================================
       SAGAN — glitter curtain (drawn, so it fills any screen width) and
       twinkling stars
       ========================================================================== */
    const curtain = document.getElementById('curtain');

    function seeded(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function drawCurtain() {
        if (!curtain) return;
        const w = curtain.clientWidth;
        const h = curtain.clientHeight;
        if (!w || !h) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        curtain.width = Math.round(w * dpr);
        curtain.height = Math.round(h * dpr);
        const ctx = curtain.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const rnd = seeded(20261204);

        // Strings of silver beads falling from the top, like the card
        for (let x = 2 + rnd() * 4; x < w; x += 6 + rnd() * 8) {
            const len = h * (0.35 + rnd() * 0.65);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(x - 0.25, 0, 0.5, len);
            for (let y = -rnd() * 8; y < len; y += 4.5 + rnd() * 4.5) {
                const fadeOut = 1 - Math.pow(y / len, 3) * 0.75;
                const r = 0.45 + Math.pow(rnd(), 2.2) * 2.3;
                const g = Math.round(165 + rnd() * 90);
                ctx.fillStyle = `rgba(${g}, ${g}, ${Math.min(255, g + 6)}, ${((0.3 + rnd() * 0.7) * fadeOut).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x + (rnd() - 0.5) * 1.2, y, r, 0, Math.PI * 2);
                ctx.fill();
                // now and then a bead catches the light
                if (rnd() < 0.012) {
                    const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
                    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
                    glow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = glow;
                    ctx.fillRect(x - 9, y - 9, 18, 18);
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(x - 7, y - 0.4, 14, 0.8);
                    ctx.fillRect(x - 0.4, y - 7, 0.8, 14);
                }
            }
        }
    }

    function initSagan() {
        drawCurtain();
        const box = document.getElementById('sagan-twinkles');
        if (!box || reduceMotion) return;
        const count = window.innerWidth > 800 ? 30 : 18;
        for (let i = 0; i < count; i++) {
            const s = el('span', 'twinkle');
            s.style.left = (Math.random() * 100).toFixed(1) + '%';
            s.style.top = (Math.random() * 100).toFixed(1) + '%';
            s.style.setProperty('--s', (6 + Math.random() * 12).toFixed(1) + 'px');
            s.style.setProperty('--t', (2.2 + Math.random() * 2.8).toFixed(2) + 's');
            s.style.setProperty('--delay', (-Math.random() * 5).toFixed(2) + 's');
            box.appendChild(s);
        }
    }

    /* ==========================================================================
       HALDI — marigold and rose petals drifting down from the garlands
       ========================================================================== */
    // absolute, because a url() inside a CSS variable is read relative to the
    // stylesheet that uses it, not to the page
    const cssUrl = (path) => `url("${new URL(path, document.baseURI).href}")`;

    // The Haldi pieces are cut-outs: each picture (name.jpg) is shown through
    // its transparency mask (name-mask.png, made by tools/build-images.ps1).
    // A piece only appears once its mask has loaded, so it never flashes with
    // its paper; if the mask can't load, the picture shows as it is.
    function cutOut(img) {
        const src = img.getAttribute('src');
        if (!src) return;
        const maskSrc = src.replace(/\.(jpe?g|png|webp)$/i, '-mask.png');
        const probe = new Image();
        probe.onload = () => {
            img.style.setProperty('--cut', cssUrl(maskSrc));
            img.classList.add('is-cut');
        };
        probe.onerror = () => img.classList.add('is-cut', 'no-mask');
        probe.src = maskSrc;
    }

    function initHaldi() {
        $$('#haldi [data-cutout]').forEach(cutOut);
        const petals = document.getElementById('haldi-petals');
        if (!petals || reduceMotion) return;
        const colours = ['#f6b42c', '#f08ea4', '#f9d260', '#f5aebd', '#ec8a1c'];
        for (let i = 0; i < 12; i++) {
            makePetal(petals, {
                loop: true,
                left: 6 + Math.random() * 88,
                top: 4 + Math.random() * 16,
                w: 7 + Math.random() * 5,
                colour: colours[i % colours.length],
                opacity: 0.6 + Math.random() * 0.3,
                duration: 12 + Math.random() * 7,
                delay: -Math.random() * 18,
                dx: (Math.random() - 0.5) * 110,
                rot: (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 260),
                fall: '75vh',
            });
        }
    }

    /* ==========================================================================
       PETALS — the soft burst when the invite opens, and Haldi's drift
       ========================================================================== */
    function makePetal(layer, o) {
        const p = el('span', 'petal' + (o.loop ? ' petal-loop' : ''));
        p.style.left = o.left.toFixed(1) + '%';
        if (o.top) p.style.top = o.top.toFixed(1) + '%';
        p.style.setProperty('--w', o.w.toFixed(1) + 'px');
        p.style.setProperty('--c', o.colour);
        p.style.setProperty('--o', o.opacity.toFixed(2));
        p.style.setProperty('--t', o.duration.toFixed(2) + 's');
        p.style.setProperty('--delay', o.delay.toFixed(2) + 's');
        p.style.setProperty('--dx', o.dx.toFixed(0) + 'px');
        p.style.setProperty('--rot', o.rot.toFixed(0) + 'deg');
        if (o.fall) p.style.setProperty('--fall', o.fall);
        layer.appendChild(p);
        return p;
    }

    function petalBurst() {
        const fx = C.effects || {};
        const count = Number(fx.petalCount != null ? fx.petalCount : 12);
        if (!count || reduceMotion) return;
        const colours = fx.petalColours && fx.petalColours.length ? fx.petalColours : ['#f2a541', '#f4b9c2', '#e8c77e'];
        const layer = el('div', 'petal-layer');
        document.body.appendChild(layer);
        let longest = 0;
        for (let i = 0; i < count; i++) {
            const duration = 6.5 + Math.random() * 3.5;
            const delay = Math.random() * 2.4;
            longest = Math.max(longest, duration + delay);
            makePetal(layer, {
                left: 3 + Math.random() * 94,
                w: 8 + Math.random() * 6,
                colour: colours[i % colours.length],
                opacity: 0.55 + Math.random() * 0.3,
                duration, delay,
                dx: (Math.random() - 0.5) * 140,
                rot: (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 300),
            });
        }
        setTimeout(() => layer.remove(), (longest + 0.5) * 1000);
    }

    /* ==========================================================================
       SCRATCH CARD + COUNTDOWN
       ========================================================================== */
    const SCRATCH_THRESHOLD = 0.5;   // share of the foil to clear before it reveals
    const BRUSH = 20;

    function initScratch() {
        const wrapper = document.getElementById('scratch');
        const canvas = document.getElementById('scratch-foil');
        if (!wrapper || !canvas) return;
        const ctx = canvas.getContext('2d');
        let revealed = false;
        let drawing = false;
        let last = null;
        let w = 0, h = 0;

        function paint() {
            const rect = wrapper.getBoundingClientRect();
            if (!rect.width) return;
            w = rect.width; h = rect.height;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalCompositeOperation = 'source-over';

            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#d8b46c');
            grad.addColorStop(0.5, '#c39a55');
            grad.addColorStop(1, '#9a7240');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // fine foil speckle
            for (let i = 0; i < (w * h) / 80; i++) {
                ctx.fillStyle = `rgba(255, 246, 214, ${(0.06 + Math.random() * 0.22).toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.1 + 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            // dashed "ticket" border
            ctx.strokeStyle = 'rgba(255, 248, 225, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(10.5, 10.5, w - 21, h - 21, 9);
            else ctx.rect(10.5, 10.5, w - 21, h - 21);
            ctx.stroke();
            ctx.setLineDash([]);

            const text = (C.saveTheDate && C.saveTheDate.scratchText) || '';
            if (text.trim()) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.font = '500 13px Jost, "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
                ctx.fillText(text.toUpperCase(), w / 2, h / 2);
            }
        }

        function point(evt) {
            const rect = canvas.getBoundingClientRect();
            const src = evt.touches ? evt.touches[0] : evt;
            return { x: src.clientX - rect.left, y: src.clientY - rect.top };
        }

        function scratchLine(a, b) {
            ctx.globalCompositeOperation = 'destination-out';
            const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                ctx.beginPath();
                ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, BRUSH, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function progress() {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let cleared = 0, sampled = 0;
            for (let i = 3; i < data.length; i += 16) { sampled++; if (data[i] < 20) cleared++; }
            return sampled ? cleared / sampled : 0;
        }

        function reveal() {
            if (revealed) return;
            revealed = true;
            canvas.classList.add('is-gone');
            canvas.setAttribute('aria-hidden', 'true');
            canvas.tabIndex = -1;
            wrapper.classList.add('is-revealed');
            spawnConfetti(wrapper);
            document.getElementById('countdown').classList.add('is-visible');
        }

        function start(evt) {
            if (revealed) return;
            drawing = true;
            last = point(evt);
            scratchLine(last, last);
        }

        function move(evt) {
            if (!drawing || revealed) return;
            if (evt.cancelable) evt.preventDefault();
            const p = point(evt);
            scratchLine(last, p);
            last = p;
        }

        function end() {
            if (!drawing) return;
            drawing = false;
            if (progress() >= SCRATCH_THRESHOLD) reveal();
        }

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        canvas.addEventListener('touchstart', start, { passive: true });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);
        canvas.addEventListener('touchcancel', end);
        canvas.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
        });

        let lastW = 0;
        const repaint = () => {
            const rw = wrapper.getBoundingClientRect().width;
            if (!revealed && rw && rw !== lastW) { lastW = rw; paint(); }
        };
        repaint();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastW = 0; repaint(); });
        window.addEventListener('resize', repaint);
    }

    function initCountdown() {
        const box = document.getElementById('countdown');
        if (!box) return;
        const std = C.saveTheDate || {};
        const all = Object.keys(events).map((k) => eventTimes(events[k])).filter(Boolean);
        if (!all.length) { box.remove(); return; }
        const firstStart = new Date(Math.min(...all.map((t) => t.start)));
        const lastEnd = new Date(Math.max(...all.map((t) => t.end)));
        const chosen = events[std.countdownTo] && eventTimes(events[std.countdownTo]);
        const target = chosen ? chosen.start : firstStart;

        const fields = {};
        $$('[data-unit]', box).forEach((n) => { fields[n.dataset.unit] = n; });
        const status = $('.countdown-status', box);
        let timer = null;

        function showStatus(text) {
            box.classList.add('is-status');
            status.hidden = !text;
            if (text) setText(status, text);
        }

        function tick() {
            const now = Date.now();
            if (now >= lastEnd) { showStatus(std.afterText || ''); clearInterval(timer); return; }
            if (now >= target) { showStatus(std.duringText || ''); return; }
            const left = Math.floor((target - now) / 1000);
            const parts = {
                days: Math.floor(left / 86400),
                hours: Math.floor((left % 86400) / 3600),
                minutes: Math.floor((left % 3600) / 60),
                seconds: left % 60,
            };
            Object.keys(parts).forEach((u) => { if (fields[u]) fields[u].textContent = String(parts[u]).padStart(2, '0'); });
        }

        tick();
        timer = setInterval(tick, 1000);
    }

    // Paper confetti bursting up from the scratch card
    function spawnConfetti(origin, count = 80) {
        if (reduceMotion) return;
        const rect = origin.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const colours = ['#e8c874', '#eba77a', '#f4b9c2', '#a9b78f', '#f6d6c2', '#c9a352', '#ffffff'];
        const layer = el('div', 'confetti-layer');
        document.body.appendChild(layer);
        let longest = 0;
        for (let i = 0; i < count; i++) {
            const piece = el('span', 'confetti-piece');
            const w = 5 + Math.random() * 4;
            const dot = Math.random() < 0.25;
            Object.assign(piece.style, {
                left: cx + 'px', top: cy + 'px', width: w + 'px', height: (dot ? w : w * 1.6) + 'px',
                borderRadius: dot ? '50%' : '2px', background: colours[Math.floor(Math.random() * colours.length)],
            });
            layer.appendChild(piece);
            const angle = (-90 + (Math.random() - 0.5) * 140) * Math.PI / 180;
            const speed = 160 + Math.random() * 260;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            const fall = 320 + Math.random() * 360;
            const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720);
            const duration = 2200 + Math.random() * 1400;
            longest = Math.max(longest, duration);
            piece.animate([
                { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1, easing: 'cubic-bezier(.15, .8, .35, 1)' },
                { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spin / 3}deg)`, opacity: 1, offset: 0.3, easing: 'cubic-bezier(.5, 0, .9, .6)' },
                { transform: `translate(calc(-50% + ${dx * 1.4}px), calc(-50% + ${dy + fall}px)) rotate(${spin}deg)`, opacity: 0 },
            ], { duration, fill: 'forwards' });
        }
        setTimeout(() => layer.remove(), longest + 200);
    }

    /* ==========================================================================
       SCROLL HINT, LINKS TO ONE EVENT, START-UP
       ========================================================================== */
    const hint = document.getElementById('scroll-hint');
    let hintArmed = false;

    function updateScrollHint(y) {
        if (!hint) return;
        hint.classList.toggle('is-shown', hintArmed && y < 40);
        if (y >= 40) hintArmed = false;
    }

    // A link like …/#wedding: the envelope still plays, then the page
    // glides down to that event.
    let deepLink = null;
    try {
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target && main.contains(target)) deepLink = target;
    } catch (err) { /* malformed link: just start at the top */ }
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    function onRevealed() {
        main.inert = false;
        initReveals();
        petalBurst();
        requestFrame();
        if (deepLink) {
            setTimeout(() => deepLink.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 1400);
        } else {
            setTimeout(() => { hintArmed = true; requestFrame(); }, 3200);
        }
    }

    bindContent();
    applyPalettes();
    renderEvents();
    renderVenue();
    initHaldi();
    initSagan();
    initVows();
    renderFamily();
    initClosingActions();
    initScratch();
    initCountdown();
    initNearState();
    initScrollEngine();
    window.scrollTo(0, 0);
    window.addEventListener('load', () => { if (!document.body.classList.contains('is-revealed')) window.scrollTo(0, 0); });
    document.addEventListener('invite:revealed', onRevealed, { once: true });

    /* ---- shown if js/content.js has a typo and couldn't be read ---- */
    function showContentError() {
        const box = document.createElement('div');
        box.setAttribute('role', 'alert');
        box.style.cssText = 'position:fixed;inset:auto 16px 16px;z-index:9999;padding:16px 18px;border-radius:12px;' +
            'background:#5c0b11;color:#fff;font:15px/1.5 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)';
        box.textContent = 'js/content.js could not be read — usually a missing comma or quote. ' +
            'Press F12 and open the Console to see the line number.';
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(box));
        if (document.body) document.body.appendChild(box);
    }
})();