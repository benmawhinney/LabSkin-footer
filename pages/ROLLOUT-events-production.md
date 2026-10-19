# Rollout plan: Events page to labskin.co.uk

Work order: WO-008 (issue #5). Staging signed off by Ben on 2026-10-19. Production tier: **1** (content through WordPress only: a new page, media files, a pattern and one menu link). No theme files, PHP, CSS, plugins or database scripts.

## The one thing we must be certain of

**We can put production back exactly as it was.** Production has no agreed backup or release procedure yet, so before anything is changed we take our own backup, download it off the server, and check it is complete. No backup, no change.

## What we already know (public, read-only checks on 2026-10-19)

| Check | Production | Staging | Effect |
|---|---|---|---|
| WordPress | 7.1.3 | 7.1.3 | Same block editor, so the pasted markup is valid on both. |
| Theme | Inspiro 1.8.7 + inspiro-child | Same | Same palette (`primary`, `secondary`, `tertiary`), same button styles. |
| Page URLs | Only `/index.php/<slug>/` works | Only `/<slug>/` works | Production has its own build: `pages/events.html`. Staging uses `pages/staging/events.html`. |
| Contact page | `/index.php/contact-us/` (same HubSpot form) | `/contact-us-2/` | `/index.php/contact-us-2/` redirects, but returns 404 when it carries the pre-fill parameters, so production links go straight to `/index.php/contact-us/`. |
| Form pre-fill | Message and lead source fill from the link | Same | Checked by loading the form only; nothing submitted. |
| Events page | `/index.php/events/` is free (404) | `/events/` | |
| Uploads folder | `/wp-content/uploads/2026/10/` exists | Same | Markup points here. If files are uploaded in November, change the month in `events.json` and rebuild first. |

## Access and credentials

- **SSH key only.** Ben adds a public key in the OVHcloud panel; the private key stays in `C:\Users\User\.ssh\`. Never in the repo, chat, a work order or an EOD report.
- Ben gives Claude only: host, port, username and the key's file name. Add a host entry to `~/.ssh/config`.
- **Verify the host fingerprint** against the one shown in the OVHcloud panel on first connection, then keep strict host-key checking on.
- If the plan only allows password SFTP, stop: Ben does the backup download and the editor steps himself (Option A below).

## Phase 1: Read-only checks over SSH (no changes)

Ben's go-ahead needed to connect. Commands only read.

1. `wp core version`, active theme and child theme versions.
2. Palette slugs exist: `primary`, `secondary`, `tertiary`.
3. No page, draft or trashed post already has the slug `events`.
4. Footer "About" menu exists and which location it is in.
5. Uploads folder is writable; free disk space for the backup.
6. Whether OVHcloud also keeps automatic backups, and how far back.

## Phase 2: Backup (must pass before Phase 3)

1. Database export (`wp db export`), compressed.
2. Archive of `wp-content/` (themes, plugins, uploads), or at minimum `wp-content/uploads/2026/` plus the theme folders if space is tight.
3. Download both to `C:\workspaces\Labskin-backups\2026-10-<day>\` (outside the repo, git-ignored, never pushed).
4. Verify: `gzip -t` passes, the SQL file contains `wp_posts` and `wp_options`, record sizes and SHA-256 checksums in the EOD report.
5. Delete the server-side copies once downloaded, so no backup is left in a web-readable place.

## Phase 3: The change (about 15 minutes)

Two ways to do the same steps. Option A matches the Tier 1 rule as written ("through the WordPress editor").

**Option A (recommended): Ben in WordPress admin, following `pages/README-events.md`.** Claude stays on the call to check each step.

**Option B: Claude over SSH with WP-CLI**, exactly as on staging. Faster, but it is a scripted write to production, so Ben must say "go" at that moment, and Ben still opens the page in the editor for step 4.

Steps:
1. Upload 4 `.ics` files and 3 logo `.webp` files to Media. Check they land in `/wp-content/uploads/2026/10/`.
2. Create the **Event card** pattern, set to **Not synced**, from `pages/event-card.html`.
3. Create page **Meet Labskin**, slug `events`, as a **draft**; paste `pages/events.html` into the Code editor.
4. Switch to the visual editor: **no block may show "unexpected or invalid content"**.
5. Preview on desktop and phone. Publish.
6. Appearance → Menus: add **Events** to the footer About menu (custom link `/index.php/events/`).

## Phase 4: Verify on production

- `/index.php/events/` returns 200; four cards in date order (Lab Innovations, SCS Formulate, melanoma webinar, Skin@Bath); PAVE absent.
- Each "Book a meeting" opens the contact form with Message and lead source filled in.
- Each "Register" opens the organiser's page in a new tab; outline buttons turn dark with white text on hover.
- Each "Add to calendar" downloads; the webinar shows 3pm UK time.
- Logos load (WebP, about 28 KB in total). No horizontal scroll at 390 px.
- Footer Events link works from another page.
- Note: real enquiries now go into HubSpot. Do not send test submissions from production; if one is needed, delete the contact afterwards (playbook Procedure 5).

## Rollback

- **Normal:** set the page back to **Draft** and remove the menu link. The page disappears; nothing else on the site was changed. Media files and the pattern can stay or be deleted.
- **If anything else on the site looks wrong:** restore from the Phase 2 backup (database first), then check the home page, contact form and menus.

## Timing

Lab Innovations starts **Wednesday 4 November 2026**, so go live by the end of October. Avoid Fridays and the hour before a known event or campaign send.

## After go-live

- EOD report: time, who did each step, backup file names and checksums, verification results.
- Comment on issue #5 with the live link; close it.
- Open a PR from `feature/events-page` so the deliverable is on the main line.
- Remove each event's card the day after it ends (or move the webinar to "On demand" with its recording).

## Open questions for Ben

1. Which OVHcloud product hosts the site, and does it offer SSH with key login?
2. Does OVHcloud keep automatic backups for it, and has a restore ever been tested?
3. Who else has WordPress admin access, so they know a change is happening?
4. Should Events also go in the main menu?
5. Option A or B for Phase 3?
