# WO-008 - Events Page: Exhibitions and Webinars

**Status:** Ready to build the structure. Event details are still needed from Ben (see "Events to load").
**Raised:** Monday 19 October 2026, by Ben
**Branch:** `feature/events-page`, created from `feature/meeples-footer` (the state deployed on staging)
**Target:** M&C dev/staging only (https://mischiefandcraft.com). Do not touch Labskin production (https://labskin.co.uk).

## Objective

One place on the website that lists every chance to meet Labskin: exhibitions and conferences where a Labskin representative will be, and upcoming webinars. Each listing makes it easy to act, by booking a meeting at the event or registering for the webinar, and records which event the lead came from.

## Decision: one page, two sections, not a calendar grid

- **One page, `/events/`, titled "Meet Labskin".** People don't care how they meet us, only when. One URL is also easier to put in email signatures, LinkedIn posts and the footer.
- **A chronological list, not a month grid.** With four or five events a year, a calendar grid is mostly empty squares and reads as "not much happening". A dated list reads as busy and is far better on mobile.
- **Each entry carries a type tag** (Exhibition, Conference talk, Webinar). The page has two sections, **In person** and **Online**.
- **Past events are removed by hand** (no code). A past exhibition is deleted from the page. A past webinar moves to an **"On demand"** section with its recording, so webinars keep working as content after they've happened.
- Each entry also has an **"Add to calendar"** link (an .ics file in the Media Library).

## Light-touch build: existing template, core blocks only

Labskin production is not fully under our control yet, so this page must be something Ben can **recreate on labskin.co.uk through the WordPress editor alone**. No theme files, no PHP, no new plugin, no custom post type.

- Use the theme's **existing default page template**. Nothing new is registered.
- Build the page from **core blocks only** (Group, Columns, Heading, Paragraph, Buttons, Separator, Details) plus the theme's existing styles and colours. A little polish is fine, as long as it comes from block settings (spacing, background colour, border radius) and not custom CSS.
- **Each event is a Group block** ("event card") saved as a **synced pattern** called "Event card", so staff copy it, fill it in and drop it into the list. They remove past events by hand. That small manual step is the price of not adding code.
- **Webinars** use the same card with an "Online" tag. When one has happened, move its card to the **On demand** section and change the button to "Watch the recording".
- **Filters** (All / In person / Online) need JavaScript, so leave them out. Two headed sections, **In person** and **Online**, do the same job with no code.
- **Add to calendar:** a link to an .ics file uploaded to the Media Library for each event. VS Code generates the .ics files; on production they are uploaded through Media.
- **Structured data:** leave it out of this version. It can come later through AIOSEO's schema settings, which are configured in the UI.

### Deliverable for production

- `pages/events.html` in this repo: the page's **block markup** (the editor's Code view), with placeholder events.
- `pages/event-card.html`: the pattern's block markup.
- `pages/README-events.md`: the steps to put it live:
  1. On labskin.co.uk, create a new page "Meet Labskin" as a **draft**, slug `events`.
  2. Open the Code editor and paste `events.html`. Switch back to the visual editor and check that **no block shows "This block contains unexpected or invalid content"**.
  3. Preview on desktop and mobile.
  4. Publish.
  5. Add the footer and menu link under Appearance.
  - **Rollback:** switch the page back to Draft and remove the link.

## Each listing shows

- Date (or date range), type tag, title, city or "Online"
- Stand or session details
- Summary
- Primary button:
  - Exhibition: **"Book a meeting at [event]"**, which opens the HubSpot meetings link with `utm_source=website&utm_medium=events&utm_campaign=<event-slug>`
  - Webinar: **"Register"**
  - Past webinar: **"Watch the recording"**
- Secondary links: Add to calendar, Event website

## Lead-source tracking

Every button link carries `utm_source=website&utm_medium=events&utm_campaign=<event-slug>`, typed into the block's link, so HubSpot records **which event a lead came from**. This feeds the lead-source work and, later, the cockpit's enquiries section.

## Page copy (intro)

> # Meet Labskin
>
> Talk to us about your next study in person at an exhibition, or join one of our webinars. Book a meeting in advance and we'll make sure the right person is there to see you.

Empty state, when nothing is scheduled:

> We don't have any events scheduled right now. [Get in touch](contact link) and we'll arrange a call, or check back soon.

## Events to load (Ben to supply)

Four upcoming events. Only one has been found in our notes so far, and it needs confirming:

| # | Event | Dates | Venue | Type | Stand / session | Status |
|---|---|---|---|---|---|---|
| 1 | SCS Formulate 2026 | 10-11 November 2026 | Coventry Building Society Arena | Exhibition | ? | **Confirm Labskin is attending, and the stand** |
| 2 | ? | | | | | |
| 3 | ? | | | | | |
| 4 | ? | | | | | |
| W | Upcoming webinars | | Online | Webinar | | **Dates, titles and registration forms** |

The existing "Labskin-Mel" webinar registration form in HubSpot is a model for the webinar sign-ups.

## Navigation

- Add **Events** to the footer's company links, and to the main menu if Ben agrees. On production, this is done in the UI (Appearance), not in code.

## Constraints

- Staging only, following the Staging Deployment Rules. Never print or commit keys, passwords or tokens.
- No theme code, no custom post type, no new plugin, no custom CSS. Core blocks and existing theme styles only.
- On staging, the HubSpot meetings and registration links go to the live HubSpot account. Use test bookings sparingly and cancel them afterwards.
- Accessibility: headings in order, dates written out in full, buttons with clear text, and the layout works at 390 px.

## Verification

1. Build the page on staging **through the editor**, using only the pasted markup from `pages/events.html`, exactly as Ben will on production. Check that no block reports invalid content, and check the order, the tags and the On demand section.
2. Add to calendar downloads an .ics that opens correctly in Outlook and Google Calendar, with the right time zone.
3. The buttons carry the UTM parameters, and a test booking shows the event in HubSpot.
5. Desktop and 390 px, no horizontal scroll. Footer link works.
6. A non-technical test: add a new event by inserting the "Event card" pattern and filling it in, then remove one.

## Delivery

Commit on `feature/events-page`, push, comment on the GitHub issue with the staging link, add an EOD entry, and stop for sign-off.
