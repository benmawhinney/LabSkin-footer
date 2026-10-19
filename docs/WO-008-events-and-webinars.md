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
- **Each entry carries a type tag** (Exhibition, Conference talk, Webinar), with filter buttons at the top: All, In person, Online.
- **Past events drop off automatically.** A past exhibition disappears. A past webinar moves to an **"On demand"** section with its recording, so webinars keep working as content after they've happened.
- Each entry also has an **"Add to calendar"** link (an .ics file), so the page still gives people the calendar convenience.

## How events are stored

Staff must be able to add an event without a developer.

- Add a lightweight **`event` custom post type** in the child theme (no events plugin). Edit it under **Events** in wp-admin.
- Fields (native meta boxes, no ACF dependency):

| Field | Notes |
|---|---|
| Title | e.g. "SCS Formulate 2026" |
| Type | Exhibition / Conference talk / Webinar |
| Start date and time, End date and time | Europe/London; show the time zone for webinars |
| Venue, City, Country | Blank for webinars |
| Stand or session | e.g. "Stand 42" or "Talk, Hall 2, 14:00" |
| Who will be there | Free text, optional, e.g. "Our business development team". No names unless Ben agrees |
| Summary | Two or three sentences |
| Book a meeting URL | HubSpot meetings link (exhibitions) |
| Register URL | HubSpot webinar registration form or landing page (webinars) |
| Recording URL | Added after a webinar; moves it to On demand |
| External event page | Organiser's page |

- Templates: `archive-event.php` (or a page template for `/events/`) and `single-event.php`, so each event also has its own shareable URL.

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

Every button carries the event slug, so HubSpot records **which event a lead came from**. This feeds the lead-source work and, later, the cockpit's enquiries section. If the meeting booking or registration form has a hidden "Event" field, set it from the URL too.

## Search and structured data

- Output **schema.org `Event`** JSON-LD for each upcoming event (`eventAttendanceMode` Offline or Online, `location` Place or VirtualLocation, `organizer` Labskin), so Google can show events in search.
- Include `/events/` and single events in the AIOSEO sitemap. This ties in with WO-004.

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

- Add **Events** to the footer's company links, and to the main menu if Ben agrees.
- Optional, later: a small "Next event" line on the homepage.

## Constraints

- Staging only, following the Staging Deployment Rules. Never print or commit keys, passwords or tokens.
- No events plugin. Keep the custom post type small, and keep it in the child theme so it survives theme updates.
- On staging, the HubSpot meetings and registration links go to the live HubSpot account. Use test bookings sparingly and cancel them afterwards.
- Accessibility: filter buttons are real buttons with `aria-pressed`, the dates are readable by screen readers, and the layout works at 390 px.

## Verification

1. Add the four events plus one past webinar with a recording. Check the list order, the type tags, the filters, and the past exhibition being hidden.
2. Add to calendar downloads an .ics that opens correctly in Outlook and Google Calendar, with the right time zone.
3. The buttons carry the UTM parameters, and a test booking shows the event in HubSpot.
4. The structured data validates in Google's Rich Results Test (paste the staging HTML).
5. Desktop and 390 px, no horizontal scroll. Footer link works.
6. A non-technical test: add an event in wp-admin using only the field labels, and it appears correctly.

## Delivery

Commit on `feature/events-page`, push, comment on the GitHub issue with the staging link, add an EOD entry, and stop for sign-off.
