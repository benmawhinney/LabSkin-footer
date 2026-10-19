# Events page ("Meet Labskin") - putting it live

Work order: `docs/WO-008-events-and-webinars.md`. Production tier: **1** (editor only: core blocks, existing template, Media Library, menus).

## Files

| File | What it is |
|---|---|
| `events.html` | The whole page, as block markup. Paste it into the Code editor. |
| `event-card.html` | One blank event card. Save it as the **Event card** pattern. |
| `ics/*.ics` | One "Add to calendar" file per event. Upload through Media. |

These files are generated from `scripts/events/events.json` by `scripts/events/build-events-page.cjs`. To change an event, edit the JSON and rebuild (`cd scripts/events && npm install && npm run build`); don't hand-edit the HTML. The generator checks that every block is valid before writing.

## Before you paste: check these links

The markup uses root-relative links, so it works on any host, but three things depend on the site it is pasted into:

1. **Booking button.** It currently points to the contact page, `/contact-us-2/?utm_source=website&utm_medium=events&utm_campaign=<event-slug>`. When the HubSpot meetings link is ready, set `bookingBaseUrl` in `events.json` to it and rebuild. Check that `/contact-us-2/` is the right contact page on labskin.co.uk.
2. **Add to calendar.** It points to `/wp-content/uploads/2026/10/labskin-<event-slug>.ics`. WordPress files uploads by the month they are uploaded in. If you upload in a different month, set `icsBaseUrl` in `events.json` to match and rebuild, or fix each button's link in the editor.
3. **Year.** The dates assume 2026 (the supplied graphic did not show the year).

## Steps (labskin.co.uk)

1. **Media → Add New**: upload the four files in `ics/`. Open one and copy its URL; check that the folder matches `icsBaseUrl`.
2. **Pages → Add New**: title **Meet Labskin**. In the page settings, set the slug to `events`. Keep it a **draft**.
3. Open the **Code editor** (⋮ menu → Code editor, or Ctrl+Shift+Alt+M). Paste the whole of `events.html`. Switch back to the **Visual editor**.
4. Check that **no block shows "This block contains unexpected or invalid content"**.
5. **Preview** on desktop and on a phone (or the editor's mobile preview). Check the four events are in date order, each "Add to calendar" downloads a file, and each booking button goes to the right place.
6. **Publish**.
7. **Appearance → Menus**: add the Events page to the footer's **About** menu (and to the main menu if agreed).

### Save the Event card pattern (once)

1. **Patterns → Add New Pattern** (or Appearance → Editor → Patterns). Name it **Event card** and set it to **Not synced**.
2. Paste `event-card.html` into its Code editor and save.

"Not synced" matters: a synced pattern edits every copy at once, so changing one event would change all of them.

**Rollback:** set the page back to **Draft** and remove the menu link.

## Day-to-day editing (no code)

- **Add an event:** in the page, click where it should go (events run in date order, next event first), insert the **Event card** pattern, and fill in the type, name, date, venue, description and button links. Write the date out in full, for example "Tuesday 10 November 2026". Put the event's slug in the button link's `utm_campaign=` so HubSpot records which event the lead came from.
- **Remove a past event:** select the card (use the list view if needed) and delete it.
- **Webinars:** use the same card with the tag "Webinar · Online", a **Register** button, and place it under **Online**. After it has happened, move it to an **On demand** section (add an H2 "On demand" the first time) and change the button to **Watch the recording**.
- **Nothing scheduled:** the Online section shows the empty-state sentence. Use the same sentence under In person if all events have passed.
