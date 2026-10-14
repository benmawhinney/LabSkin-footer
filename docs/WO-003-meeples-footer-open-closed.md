# WO-003 - Meeples Footer: Opening Hours, Door Sign, Click-to-Call Phone and After-Hours Bot

**Status:** Step 0 complete - awaiting Ben's OK before step 1
**Raised:** Wednesday 14 October 2026, by Ben
**Branch:** `feature/meeples-footer`
**Target:** M&C dev/staging only (https://mischiefandcraft.com). Do not touch Labskin production (https://labskin.co.uk).

## Objective

Make the Meeples footer follow Labskin's real opening hours, and add three small interactive moments for public visitors ("surprise and delight"):

1. A sign on the lab door that reads **CLOSED** outside opening hours and flips to **OPEN** at 09:00.
2. During opening hours, a **desk phone** that visitors can tap to call the lab. It is a real `tel:` link marked up as a microformat, so it works on mobile.
3. After hours, the lights go out and the **Labskin bot** sits at the computer. Clicking it opens the website's chat assistant (the HubSpot Customer Agent).

The footer is the simple, public-facing piece. The internal "Live Lab" digital twin is a separate piece of work and is out of scope here.

## Inputs

- Runtime and assets: `meeples/src/labskin-footer.js`, `meeples/src/labskin-footer.css`, `meeples/assets/`
- Integration notes from the first pass: `meeples/VSCODE_PROMPT.md`
- The Meeples treatment as currently deployed on M&C staging (see step 0)
- Repository rules: `README.md`, especially Staging Deployment Rules

## Facts

| Item | Value |
|---|---|
| Opening hours | Monday to Friday, 09:00 to 17:30, `Europe/London` |
| Closed | Weekends, and before 09:00 and from 17:30 on weekdays. Bank holidays are out of scope for now |
| Phone number (display) | +44 (0) 7387 001 146 |
| Phone number (`tel:` link) | `tel:+447387001146` |
| Chat assistant | HubSpot chat widget (Labskin Customer Agent) |

## Step 0: reconcile first

The Meeples treatment is already live on M&C staging, but `origin/feature/meeples-footer` only holds the kit (commit `d7fe56c`). Before changing anything:

1. Pull `feature/meeples-footer`.
2. Compare the files deployed on M&C staging with `theme-overlay/inspiro-child/` in the repo.
3. Commit whatever is deployed but not yet in the repo ("Record Meeples treatment as deployed on M&C staging"), so this work order starts from the true state.

Report what you found in a few lines and wait for Ben's OK before step 1.

### Step 0 reconciliation - 2026-10-14

- Pulled with a non-rebasing merge (`7ed59fb`) to preserve local deployed-integration commit `a73c4a0` and the two remote work-order/queue commits. The remote-kit-only assumption above described origin before this reconciliation, not the complete local branch.
- Compared all 28 canonical overlay files against staging using read-only SHA-256 checks: 25 exact byte matches, two line-ending-only differences (`footer.php`, `functions.php`), and one comment-only difference (`assets/js/skin-footer.js`). All eight Meeple integration files matched exactly.
- Recorded the deployed Fluorescent comments in the canonical overlay and verified syntax and exact normalized parity. All 28 overlay files now represent the deployed behaviour; no staging files or DNS settings were changed in Step 0.
- The current lab still uses the original 08:15-17:45 staffing ramp and two-person after-hours crew. No 09:00-17:30 schedule, door OPEN/CLOSED sign, click-to-call hotspot or assistant bot has been built yet.
- Await Ben's explicit OK before starting step 1. Keep GitHub issue #1 open until final owner sign-off.

## Behaviour to build

### 1. Opening hours drive the scene

- Add an `hours` option (default `"Mon-Fri 09:00-17:30"`) and a `data-lsf-hours` attribute. Evaluate it in `Europe/London`, as the rest of the runtime already does.
- **Open:** behaviour as now. People arrive through the break room door from 09:00. Keep the rule that at least two people are on screen.
- **Closing:** from 17:30, people finish their task and leave through the break room door over a few minutes, not all at once.
- **Closed:** nobody in the lab, so the "at least two on screen" rule does not apply. Darken the strip slightly, turn computer screens dark, keep only the incubator and equipment LEDs glowing, and switch the wall screen off (or a dim standby glow). Windows still show the real sky and weather.
- **Morning:** at 09:00 the sign flips, the lights come up and the first people arrive.
- Remove the current skeleton-crew behaviour outside hours (two people working at night and at weekends).

### 2. Door sign

- Hang a small pixel sign on the **break room** door (the door people arrive and leave through), using the existing 3x5 pixel font.
- Closed: red sign reading `CLOSED`. Open: green sign reading `OPEN`.
- Flip it at exactly 09:00 and 17:30. A two-frame swing when it flips is enough.

### 3. Click-to-call desk phone (open hours only)

- Draw a small pixel desk phone on the meeting table, or on the bench nearest the meeting area if the table is too small at narrow widths. It appears at 09:00 and disappears at 17:30.
- The canvas cannot hold a link, so place a real HTML link over the phone and reposition it when the strip resizes. Mark it up as an h-card:
  ```html
  <div class="h-card lsf-hotspot lsf-phone" hidden>
    <a class="p-tel u-tel" href="tel:+447387001146"
       aria-label="Call Labskin on +44 (0) 7387 001 146">
      <span class="p-name p-org lsf-sr">Labskin</span>
      <span class="lsf-sr">+44 (0) 7387 001 146</span>
    </a>
  </div>
  ```
  (`lsf-sr` is a visually-hidden class. Add `itemscope itemtype="https://schema.org/Organization"` and `itemprop="telephone"` alongside if that fits the theme's existing markup.)
- The hotspot must be at least 44 x 44 CSS pixels for touch, keyboard-focusable with a visible focus ring, and show a small "Call the lab" label on hover or focus.
- On desktop, `tel:` may open FaceTime, Teams or nothing. That is acceptable. The hover label shows the number so desktop visitors can read it.
- Make the number configurable with `data-lsf-phone`.

### 4. After-hours Labskin bot (closed hours only)

- Add a friendly pixel **robot** sprite (not a person, and clearly not one of the team) sitting at the computer on the bench, with the screen glowing. Draw it in the existing sprite style, 32 x 32, with a gentle idle animation and a blinking light. Add it to `tools/sprite-gen.js` so it is regenerated with the rest and exported in the sheet, or as a separate small sprite.
- Place a real `<button>` over it: "Ask the Labskin assistant". On click:
  1. If `window.HubSpotConversations?.widget` exists, call `widget.open()`. If the widget is not loaded yet, call `widget.load()` and open it once it reports ready.
  2. If HubSpot chat is not on the page, link to the contact page instead (configurable with `data-lsf-contact`, defaulting to the site's Contact Us URL).
- When the lab is open, the bot is not shown and the phone takes over.
- Hover or focus label: "The lab is closed. Ask our assistant."

### 5. Optional small delights (do only if time allows; list them for Ben first)

- Click a scientist: a short speech bubble with what they are doing.
- Click the wall screen: skip to the next science still.
- Keep every interaction optional. The footer links and text must stay fully usable without them.

## Constraints

- Public-facing only. No client names, stock levels, study details or other internal data in the footer.
- Interactive overlays must not block the footer's own links, or vertical scrolling on touch screens.
- Respect `prefers-reduced-motion`: still frame, and the phone and bot hotspots still work.
- Keep the runtime dependency-free and lazy-mounted as it is now.
- Keep the existing debug hook working, and extend it so the open and closed states can be tested: `LabskinFooter.debug({ time: … })`.

## Verification

1. Using `LabskinFooter.debug`, check these times: Wednesday 08:59, 09:00, 12:30, 17:29, 17:30, 17:40, 22:00, and Saturday 11:00. Confirm the sign, lights, people, phone and bot at each.
2. On a real phone (or at 390 px), tap the phone during open hours: the dialler opens with +44 7387 001146.
3. After hours, click the bot: the HubSpot chat opens. Test with the widget missing: it falls back to the contact page.
4. Keyboard only: Tab reaches the phone or bot hotspot, focus is visible, and Enter activates it.
5. Validate the h-card with a microformats parser (for example, paste the HTML into https://microformats.io) and confirm it reads `tel: +447387001146`.
6. Check that the Current, LabSkin-Dev, Evidence, Fluorescent and Mesh treatments still work, and that switching to Meeples and back does not mount a second strip.
7. Run `php -l` and `node --check` on touched files, as listed in the README.

## Delivery

- Deploy to M&C staging only, following the Staging Deployment Rules (one verified Lightsail snapshot, per-file backups, PowerShell SSH/SCP with strict host-key checking). Never print or commit keys, passwords or tokens.
- Commit on `feature/meeples-footer` with clear messages, and push.
- Add a short entry to today's EOD report in `docs/eod-reports/`.
- Send Ben the staging link and a short list of what changed. Stop there for sign-off.

## Open questions for Ben

- Is Labskin closed on bank holidays, and should the sign show a holiday message?
- Should the bot also appear during the day (for example, while everyone is at lunch), or only after hours?
