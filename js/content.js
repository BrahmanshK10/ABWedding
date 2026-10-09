/* ==========================================================================
   SITE CONTENT — every piece of text, every image, link, date and colour.
   Edit the values on the right of each colon; keep the quotes and commas.
     • Leave any text as "" to hide it on the page.
     • Use \n inside a text to start a new line.
     • Image paths are relative to index.html, e.g. "assets/images/card.jpg".
   After an edit, refresh the page. If it shows a "content.js" error box,
   a quote or comma is missing near the line it mentions.
   ========================================================================== */
window.SITE_CONTENT = {

    /* Browser-tab title. (The WhatsApp link preview is set in the <head> of
       index.html — WhatsApp can't read this file.) */
    pageTitle: "Aarushika & Brahmansh · Wedding Invitation",

    /* ---------- Screen 1: the envelope ---------------------------------- */
    envelope: {
        pretext: "You are invited to the Wedding of",
        caption: "Aarushika & Brahmansh",
        hint: "Tap the envelope to open",
        // Round photo on the card inside the envelope (square photos suit best).
        // Until this file exists the monogram below is shown instead.
        cardImage: "assets/images/logo.webp",
        cardMonogram: "A & B",
    },

    /* ---------- Opening page (the Title card's words in the Intro frame) - */
    hero: {
        ganeshImage: "assets/images/title/ganesh.png",
        ganeshAlt: "Shri Ganeshaya Namah",
        // The temple frame cut from Intro.jfif: banana leaves and the brass lamp
        // (top left), leaves and the jasmine garland (top right), the temple
        // and lotuses along the bottom.
        introLeftImage: "assets/images/intro/corner-left.jpg",
        introRightImage: "assets/images/intro/corner-right.jpg",
        templeImage: "assets/images/intro/temple.jpg",
        invite: "We cordially invite you to witness the beginning of our forever and celebrate the wedding ceremony of",
        bride: "Aarushika",
        brideParents: "(Grand D/O Mrs. Rajni Lingwal and Late Shri K.S. Lingwal\nD/O Mrs. Renuka and Mr. Ajay Lingwal)",
        ampersand: "&",
        groom: "Brahmansh",
        groomParents: "(Grand S/O Late Mrs. Savitri Devi and Late Shri B.L. Kaushal\nS/O Mrs. Garima Kaushal and Mr. Rakesh Kaushal)",
        scrollHint: "Scroll",
    },

    /* ---------- Save the dates (scratch card + countdown) ---------------- */
    saveTheDate: {
        label: "Save the Date",
        dates: "5th December 2026",
        scratchText: "Scratch to reveal",
        countdownTo: "wedding",                     // which event to count down to
        countdownLabel: "until the big day",
        days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
        duringText: "The celebrations have begun!",  // from the first event until the last one ends
        afterText: "Thank you for celebrating with us",
    },

    /* ---------- Lines shown while the colours change between events ----- */
    passages: {
        toSagan: "It all begins as the evening falls",
        toHaldi: "…and the morning arrives in shades of haldi",
        toWedding: "…until two families become one",
        toVows: "As the sacred fire is lit…",
        toClosing: "…and a lifetime together begins",
    },

    /* All event times are in this time zone, wherever the guest opens the
       invite (India Standard Time). */
    timeZone: { offset: "+05:30", name: "Asia/Kolkata" },

    /* ---------- Venue (same for every event) ----------------------------- */
    venue: {
        label: "The Venue",
        name: "The Country Touch Resort",
        address: "",            // e.g. "Sector 00, Gurugram, Haryana" — blank hides it
        // Google Maps → Share → Embed a map → Copy HTML (the whole <iframe> is fine)
        mapEmbed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3510.602776114441!2d77.05527167613046!3d28.370856595914518!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d235814d4dca9%3A0xa094058415330148!2sThe%20Country%20Touch%20Resort!5e0!3m2!1sen!2sin!4v1791109044147!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
        // Opens the resort in Google Maps (where guests tap "Directions")
        directionsUrl: "https://maps.google.com/?cid=11570879407471133000",
    },

    /* ---------- The events, in the order they appear --------------------
       date: "YYYY-MM-DD"   start / end: 24-hour "HH:MM" (an end earlier than
       the start means after midnight). timeLabel is the time as printed on
       the page (blank = worked out from start). Weekday, month and year are
       worked out from the date. note / dressCode: blank hides them.
       The venue is the same for all, so it is shown once (see venue above). */
    events: {
        sagan: {
            title: "Sagan",
            subtitleLead: "followed by",     // small line under the title…
            subtitle: "Ring Ceremony",       // …and the line under that
            date: "2026-12-04", start: "19:00", end: "23:30",
            timeLabel: "At 7 PM",
            note: "",
            dressCode: "",
            calendarTitle: "Sagan (Ring Ceremony) · Aarushika & Brahmansh",
            ballSmallImage: "assets/images/sagan/ball-small.png",
            ballLargeImage: "assets/images/sagan/ball-large.png",
            sceneImage: "assets/images/sagan/scene.jpg",
        },

        haldi: {
            invite: "Join us for",
            title: "Haldi",
            date: "2026-12-05", start: "08:00", end: "11:00",
            timeLabel: "8:00 AM",
            note: "Let's get soaked in love & haldi!",
            dressCode: "",
            calendarTitle: "Haldi · Aarushika & Brahmansh",
            monogram: "A & B",             // written on the little pink arch
            // The pink-and-marigold Haldi card taken apart (tools/build-images.ps1):
            // garland, umbrella and bunting; lantern and bells; and the arch,
            // bowls of haldi, sweets and dholak along the bottom
            cornerLeftImage: "assets/images/haldi/corner-left.jpg",
            cornerRightImage: "assets/images/haldi/corner-right.jpg",
            tableauImage: "assets/images/haldi/tableau.jpg",
        },

        wedding: {
            title: "Wedding Ceremony",
            date: "2026-12-05", start: "17:00", end: "23:30",
            timeLabel: "5:00 PM",
            note: "",
            dressCode: "",
            calendarTitle: "Wedding · Aarushika & Brahmansh",
            deityImage: "assets/images/wedding/shrinathji.png",
            deityAlt: "Shrinathji",
            // The Wedding card's banana plant and the kalash, brass lamp, urli and
            // cow, shown at the very end with the sign-off
            plantImage: "assets/images/wedding/plant.jpg",
            stillLifeImage: "assets/images/wedding/still-life.jpg",
            scheduleTitle: "The Day",
            scheduleHint: "Tap a ritual to know more",
            // Add, remove or reorder rows freely; icon can be "" for none.
            // "about" is shown when a guest taps the ritual ("" = not tappable).
            schedule: [
                {
                    time: "4:00 PM", name: "Baraat", icon: "assets/images/wedding/icon-baraat.png",
                    about: "The groom arrives with family and friends in a joyful procession of music and dancing."
                },
                {
                    time: "4:30 PM", name: "Milni", icon: "assets/images/wedding/icon-milni.png",
                    about: "The elders of both families meet, embrace and exchange garlands — two families becoming one."
                },
                {
                    time: "5:00 PM", name: "Varmaala", icon: "assets/images/wedding/icon-varmaala.png",
                    about: "The bride and groom exchange flower garlands, choosing each other in front of everyone they love."
                },
                {
                    time: "7:30 PM", name: "Mangal Phere", icon: "assets/images/wedding/icon-phere.png",
                    about: "The couple walk around the sacred fire, taking a vow with every round."
                },
                {
                    time: "8:00 PM", name: "Dinner", icon: "assets/images/wedding/icon-dinner.png",
                    about: "Good food, laughter and celebration, all together."
                },
                {
                    time: "11:00 PM", name: "Vidai", icon: "assets/images/wedding/icon-vidai.png",
                    about: "A tender farewell as the bride leaves her parents' home, showered with blessings for her new life."
                },
            ],
        },
    },

    /* ---------- The Seven Vows (scroll through them, or tap a diya) ------ */
    vows: {
        label: "Saptapadi",
        title: "The Seven Vows",
        hint: "Scroll, or tap a diya",
        // One line per step, in order (keep seven)
        stepNames: ["The first step", "The second step", "The third step", "The fourth step",
            "The fifth step", "The sixth step", "The seventh step"],
        steps: [
            "To nourish and provide for each other, sharing every meal and every blessing.",
            "To grow strong together — in body, mind and spirit.",
            "To build our home with honesty, and share all that we are given.",
            "To fill our life with love, respect and joy, and honour each other's families.",
            "To cherish and care for the family we create.",
            "To stand by each other through every season of life.",
            "To be friends and companions, in this life and all the lives to come.",
        ],
        complete: "Seven steps, seven vows — bound together for seven lifetimes.",
    },

    /* ---------- Button and small labels --------------------------------- */
    labels: {
        directions: "Directions",
        addToCalendar: "Add to calendar",
        googleCalendar: "Google Calendar",
        appleCalendar: "Apple / Outlook",
        dressCode: "Dress code",
        today: "Today",
        happeningNow: "Happening now",
        saveAllDates: "Save all dates",
        share: "Share the invitation",
        linkCopied: "Link copied",
    },

    /* What the "Share the invitation" button sends along with the link */
    shareText: "You're invited to the wedding of Aarushika & Brahmansh · 4th & 5th December 2026",

    /* ---------- Our families (after the venue) ---------------------------
       The family members welcoming your guests, one group per family, shown
       side by side. Add, remove or reorder names freely: each name is one
       line, and a group with no names is hidden. Replace every
       "Family member's name" before sharing the invitation. */
    family: {
        label: "Swagatakankshi",
        title: "Our Families",
        families: [
            {
                name: "The Lingwal Family",
                members: [
                    "Mrs. Rajani & Lt. Shri K.S. Lingwal",
                    "Mrs. Jaya & Mr. V.C.S Nair",
                    "Mrs. Akanksha & Mr. Srijit Nair",
                ],
            },
            {
                name: "The Kaushal Family",
                members: [
                    "Lt. Mrs. Savitri Devi & Lt. Shri B.L. Kaushal",
                    "Mrs. Garima & Mr. Rakesh Kaushal",
                    "Ms. Jigyasa Kaushal",
                ],
            },
        ],
        note: "Your presence would make our celebration complete — we would love to have you with us.",
    },

    /* ---------- Contacts (hidden while the list is empty) ---------------
       e.g. { name: "Rakesh Kaushal", role: "Groom's father", phone: "+91 98123 45678" } */
    contacts: {
        title: "For any help, reach out to",
        people: [],
    },

    /* ---------- Sign-off at the very end --------------------------------- */
    closing: {
        signoff: "With love",
        families: "The Lingwal & Kaushal Families",
        names: "Aarushika & Brahmansh",
    },

    /* ---------- Background music ----------------------------------------
       Put an .mp3 in assets/audio/ and give its path. It starts when the
       envelope is tapped, with a pause button in the corner. Blank = none. */
    musicUrl: "assets/audio/music.mp3",

    /* ---------- Colours -------------------------------------------------- */
    theme: {
        // The envelope (same as your last version)
        envelope: {
            "--color-envelope": "#ffd3ac",
            "--color-envelope-shade": "#f3bb8e",
            "--color-envelope-inner": "#d9956a",
            "--color-thread": "#b8845a",
            // the opening's cream, so the envelope fades straight into it
            "--color-envelope-screen": "#fcefd3",
        },
        // While you are inside an event the whole page takes on its "bg".
        // ink: headings, soft: smaller text, accent: lines and buttons.
        chapters: {
            // the cream paper of the Intro artwork
            hero: { bg: "#fcefd3", ink: "#4b291b", soft: "#6b4c3f", accent: "#b48a52" },
            sagan: { bg: "#0d0d0f", ink: "#f7ce95", soft: "#d9cfc1", accent: "#e3b878" },
            // the Haldi card's own paper, its rose-pink lettering and marigold
            haldi: { bg: "#fdf2e6", ink: "#c24a60", soft: "#8a5a4a", accent: "#e8a33d" },
            // sundown: the warm apricot of golden hour (the sun, glow and clouds
            // are drawn over it in the section itself)
            wedding: { bg: "#f6c9a3", ink: "#66300a", soft: "#7a4530", accent: "#b0603e" },
            // the seven vows, around the sacred fire at night
            vows: { bg: "#1e0f0c", ink: "#f3d29c", soft: "#dcc6a6", accent: "#e0a95e" },
            // venue, families and the closing (the Wedding card's beige, so its
            // plant and still life melt into the page at the very end)
            closing: { bg: "#e5d7c3", ink: "#7a4900", soft: "#7a5a3c", accent: "#9a7259" },
        },
        // Colours the page passes through between chapters
        passages: {
            toSagan: ["#f1ddd4", "#c99995", "#5a3446", "#1d1520"],   // evening falls
            toHaldi: ["#141a35", "#3b2f5c", "#a8668a", "#f0b3a4"],   // sunrise
            toWedding: ["#f7dcc0"],                                  // into the golden hour
            toVows: ["#e4a58f", "#a2504a", "#4a1c19"],               // sunset to the fire
            toClosing: ["#3d2018", "#9a6a4c", "#d6b897"],            // a new dawn
        },
    },

    /* ---------- Little effects ------------------------------------------- */
    effects: {
        petalCount: 12,     // petals that drift down when the invite opens (0 = none)
        petalColours: ["#f2a541", "#f4b9c2", "#e8c77e", "#f7d9a8"],
    },
};