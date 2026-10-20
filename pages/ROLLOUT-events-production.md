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

## Hosting (public lookups, 2026-10-19)

- **OVHcloud shared web hosting**, `cluster023.hosting.ovh.net` (Gravelines), Apache, PHP 8.5. DNS on OVHcloud (`dns105`/`ns105.ovh.net`); mail on Microsoft 365 (unaffected by this work).
- Shared hosting means no root and no server config to break, but also: SSH only exists on some plans, it is a restricted shell, and the plan has storage and database quotas. What OVHcloud documents: a database over its quota switches to **read-only** (pages still display, but nothing can be saved or published), and the one-click web-space restore needs **at least half the storage free**. Current usage is unknown until checked (Phase 1, or Hosting plans → General information → Disk space). Either way, nothing large is written to the webspace.
- OVHcloud web hosting has automatic backups (panel: Web Hosting → FTP-SSH → Restore a backup); **never tested**. The M&C staging copy is the fallback, but it has drifted, so it is not a ready blue/green target.

## Ground rules

1. **Never take the site down.** When in doubt, don't.
2. **Publishing is done through the WordPress UI by Ben.** No scripted writes to production.
3. Over SSH, Claude only reads, and only with light commands.
4. Nothing is written to the webspace: backups stream straight to Ben's machine.
5. No change to `.htaccess`, `wp-config.php`, `.ovhconfig` (PHP version), plugins, themes, the OVHcloud panel settings or DNS.

## Access and credentials

- Credentials never go in the repo, chat, a work order, an EOD report, `infrastructure.json` or anywhere in `C:\workspaces\`.
- The OVHcloud SSH/FTP password lives in Ben's password manager. Ben types it himself, once, in his own terminal; Claude never sees it.
- For Claude: an **SSH key** in `C:\Users\User\.ssh\labskin-ovh` (passphrase-protected, loaded into the Windows ssh-agent), and a `labskin-prod` entry in `C:\Users\User\.ssh\config` with host, port, user and key file only. Strict host-key checking stays on.
- If key login is not available on this plan: Claude prepares each read-only command, Ben runs it and pastes the output (never credentials).

## Phase 1: Light-touch investigation (read-only)

Goal: find out what we can and can't do safely. Each step is a single read; stop at the first surprise.

| # | Check | Command (read-only) | Why |
|---|---|---|---|
| 1 | SSH works with the key, no password | `ssh -o PasswordAuthentication=no labskin-prod 'echo ok'` | Proves key access |
| 2 | Where we are | `pwd; ls -la` | Find the webroot (often `www/`) |
| 3 | Disk quota and usage | `quota -s` or `du -sh ~` (only if `quota` is absent) | Is there room; is the site near its limit |
| 4 | PHP and WP-CLI present | `php -v; wp --info` | Whether read-only WP queries are possible |
| 5 | WordPress basics | `wp core version; wp theme list; wp plugin list --status=active` | Matches the public checks |
| 6 | Slug is free | `wp post list --post_type=any --post_status=any --name=events --fields=ID,post_type,post_status` | No clash |
| 7 | Footer menu | `wp menu list` | Where Events will go |
| 8 | Database size | `wp db size --tables=false` | Size of the backup |
| 9 | Uploads size | `du -sh www/wp-content/uploads` | Whether a full files copy is practical |

Not run, even read-only: anything that loops over every post or file on a busy site, `wp db check`/`optimize`, cron runs, cache flushes.

## Phase 2: Backup (must pass before Phase 3)

1. **Database:** streamed to Ben's machine, never written on the server: `ssh labskin-prod 'wp db export - | gzip' > backup.sql.gz` (or `mysqldump` if WP-CLI is unavailable). Run off-peak.
2. **Files:** at minimum `wp-content/themes/` and `wp-content/uploads/2026/`, pulled with `scp -r`/`rsync` (read-only on the server). A full uploads copy only if Phase 1 shows it is a sensible size.
3. Store in `C:\workspaces\Labskin-backups\2026-10-<day>\` (outside the repo, never pushed).
4. Verify: `gzip -t` passes, the SQL contains `wp_posts` and `wp_options`, record sizes and SHA-256 checksums in the EOD report.
5. Also note the date of the latest OVHcloud automatic backup in the panel.

## Phase 3: The change (about 15 minutes), Ben in WordPress admin

Ben follows `pages/README-events.md` in the browser; Claude checks each step from the outside (page loads, links, files).

Steps (Ben, in WordPress admin):
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

## Decisions (Ben, 2026-10-19)

- Publishing through the WordPress UI; avoiding downtime above everything else.
- Footer link only, not the main menu.
- No one else is editing the site, so no change notice is needed.
- Claude does a light-touch, read-only investigation first (Phase 1) to establish what is safe.

## Later (not part of this change)

- Test an OVHcloud backup restore (into a throwaway location, not over production).
- Bring the M&C staging copy back in line with production so blue/green with a DNS switch is a real option.
