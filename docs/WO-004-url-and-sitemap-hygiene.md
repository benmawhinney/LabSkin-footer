# WO-004 - Clean URLs, Redirects and Sitemap Hygiene

**Status:** Not started. Planned as the next change after WO-008 (events page) is live. Ben is briefing the Labskin IT contacts; do not begin any step until Ben says so.
**Raised:** Friday 16 October 2026, by Ben
**Branch:** `feature/url-hygiene`, created from `feature/meeples-footer` (the state deployed on staging, so nothing deployed gets reverted)
**Target:** M&C dev/staging only (https://mischiefandcraft.com). Do not touch Labskin production (https://labskin.co.uk). Production needs its own release plan after sign-off, because production is on different hosting (OVHcloud) from staging (Lightsail).

## Objective

Remove `/index.php/` from every URL, keep every old URL working with a single 301 redirect, fix the dead links that still get traffic, and tidy the XML sitemap so it lists what Labskin actually wants found.

## What we know (from HubSpot analytics and the live sitemap, 16 Oct 2026)

- Every page and post URL contains `/index.php/` (WordPress "PATHINFO" permalinks). Example: `https://labskin.co.uk/index.php/contact-us-2/`.
- Sitemap is **All in One SEO v4.7.7.2** (`/sitemap.xml` is an index of `page-sitemap.xml`, `post-sitemap.xml`, `category-sitemap.xml`). It lists 16 pages and 6 posts.
- Pages in the sitemap that look wrong:
  - `/index.php/home-page-draft/` (last modified May 2024) is a published draft and is indexable.
  - `/index.php/competition/` (January 2025) is likely finished.
  - `/index.php/contact-us/` and `/index.php/contact-us-2/` are two Contact Us pages. Both receive form submissions (18 and 7 in the last 30 days).
- URLs that return "Oops! That page can't be found." but still get visits:

  | URL | Views, last 30 days |
  |---|---|
  | `/index.php/431-2/` | 57 (5-18 a week since July) |
  | `/about` | 3 |
  | `/privacy` | 3 |
  | `/terms-of-service` | 2 |

- `/an-introduction-to-the-skin-microbiome-a-whitepaper-by-labskin/` is tracked by HubSpot without `/index.php/` and is not in the sitemap. Find out what serves it.

## Diagnosis: why `/index.php/` is in every URL (19-20 Oct 2026)

From public, read-only checks of labskin.co.uk and the staging copy (which was made from a production backup):

- **It is a WordPress setting, not a server fault.** The stored permalink structure is `/index.php/%year%/%monthnum%/%day%/%postname%/` ("almost pretty" or PATHINFO permalinks), so WordPress generates every link with `/index.php/` and only recognises URLs in that form.
- **The server already supports clean URLs.** On production, `/about-us/` returns WordPress's own "Page not found - Labskin" page (not a bare Apache error), and `/wp-json/` works with and without `/index.php/`. So Apache rewriting and the WordPress `.htaccess` rules are already working; only the setting needs to change. This answers the Step 0 production question below.
- **Likely cause:** WordPress adds `/index.php/` when the permalink style is chosen on a server where it cannot confirm URL rewriting, typically during an install or migration (All-in-One WP Migration and Duplicator are installed, which suggests the site was moved). It was never changed back after the move to OVHcloud. Not proven, but consistent with the evidence.
- **Staging is the mirror image:** its web server does not pass the path after `index.php`, so `/index.php/...` URLs 404 there and clean URLs work. Until this WO is done, production and staging need different links (see `scripts/events/events.json`, `sites`, on `feature/events-page`).
- **Hosting:** production is OVHcloud shared web hosting, `cluster023.hosting.ovh.net` (Gravelines), Apache, PHP 8.5, WordPress 7.1.3, Inspiro 1.8.7.

### The production change, in outline (not to be run yet)

1. Take and verify our own backup (database and `wp-content`), as in `pages/ROLLOUT-events-production.md` Phase 2 (on `feature/events-page`).
2. Record the exact current value of Settings → Permalinks (the custom structure above) in the EOD report before changing anything.
3. Settings → Permalinks → the agreed structure (default: keep dates, drop `/index.php`). This is a Tier 2 UI change.
4. Straight away, add the Redirection plugin rule `^/index\.php/(.*)` → `/$1` (301), so old links keep working.
5. Run the verification table below against production.

## Recovery procedure (if a production change goes wrong)

Use the lightest step that fixes the problem. Each level is only needed if the one before did not work.

| Level | When | What to do | Time |
|---|---|---|---|
| 1. Undo the setting | Links or pages break after the permalink switch | Settings → Permalinks → paste back the exact old structure (recorded in step 2) and save; disable the Redirection rule. The site returns to its previous URLs. Nothing else has changed. | Minutes |
| 2. Restore a single file | One file damaged (for example `.htaccess`) | Connect by FTP as `<ftp-user>-snap0` (today 00:01), `-snap1` (yesterday) ... `-snap4` (two Sundays ago). This is a read-only copy; download the file, then upload it to the live space with the normal login. | Minutes |
| 3. Restore the database | Content or settings damaged | Import our own pre-change database export (preferred: it is from minutes before the change). OVHcloud also keeps daily database backups for 30 days: Hosting plans → Databases → `...` → Restore a backup, which lets you **download** a backup; importing it is a separate step. | 15-60 minutes |
| 4. Restore the whole web space | Many files damaged | Hosting plans → FTP-SSH → **Restore backup** → choose D-1, D-2, D-3, 1 week or 2 weeks → Confirm. **This replaces the entire web space**: anything added since that backup is lost. It needs at least **half the plan's storage free**, and does not restore the database. | Minutes to hours |
| 5. Blue/green | Production cannot be recovered in place | Repoint DNS to a copy of the site. The M&C staging copy has drifted, so it is not ready for this today. | Hours |

**Before the change, check:**
- Disk space used vs plan limit (Hosting plans → General information → Disk space). If more than half is used, level 4 is not available until space is freed.
- Who holds Control Panel access, and that they are reachable during the change window.
- The date and time of the latest OVHcloud backups, so we know which restore point is pre-change.

OVHcloud states its backups are non-contractual and recommends keeping your own, which is why our own backup is taken first.

Sources: OVHcloud docs, [Restoring your Web Hosting plan's storage space](https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ftp-save-and-backup), [Retrieving the backup of a Web Hosting plan's database](https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/sql-database-export), [My database is full, what should I do?](https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/sql-overquota-database).

## Step 0: audit and report (no changes)

On staging, report in a few lines:

1. Web server and version (Apache, LiteSpeed or nginx), whether `mod_rewrite` is on, and whether `.htaccess` is present, writable and honoured.
2. The current permalink structure (`wp option get permalink_structure` if WP-CLI is available).
3. The AIOSEO version, and whether any other SEO or redirect plugin is active (Yoast, Rank Math, Redirection).
4. What `431-2` was: check the Bin, drafts, revisions and attachments for ID 431 or slug `431`, and the Wayback Machine.
5. What serves the whitepaper URL.
6. Every hard-coded `/index.php/` link in post content, menus, widgets and theme files (`wp search-replace ... --dry-run` gives counts; do not run it for real yet).

Then propose a redirect map (old URL, new URL) for the dead links, the two Contact Us pages, `home-page-draft` and `competition`. **Stop and wait for Ben to confirm the map.**

## Step 1: clean permalinks

- Set the permalink structure to `/%postname%/` for pages, and decide with Ben whether posts keep the date (`/%year%/%monthnum%/%day%/%postname%/`) or use `/%postname%/`. Default: keep dates, so only `/index.php` is dropped.
- Make sure the standard WordPress rewrite block is in `.htaccess`.

## Step 2: redirect every old URL

> **Production constraint (16 Oct):** Ben has no access to `.htaccess` on the OVHcloud production server. The production plan must work entirely from inside WordPress, using the **Redirection** plugin (regex rule `^/index\.php/(.*)` to `/$1`, added only *after* the permalinks have been switched, or it loops), plus its 404 log. The `.htaccess` rule below is for staging, or for production if access is granted later. In Step 0, also test on production whether WordPress already receives non-`index.php` URLs: `/about` rendered the theme's 404 page with HubSpot tracking, which suggests it does.

- Add a single rule above the WordPress block that 301s any client request for `/index.php/<path>` to `/<path>`, preserving the query string. Match on `THE_REQUEST`, so WordPress's own internal rewrite to `index.php` never loops:

  ```apache
  RewriteEngine On
  RewriteCond %{THE_REQUEST} \s/index\.php/([^\s?]*) [NC]
  RewriteRule ^ /%1 [R=301,L,NE]
  ```

- Put the per-URL redirects from the confirmed map in the **Redirection** plugin (or AIOSEO's redirects, if it is the Pro version), so staff can see and edit them later. Every redirect is one hop to a page that returns 200.
- Do not break `/index.php` itself, `/wp-admin/`, `/wp-login.php`, `/wp-json/` or `?rest_route=`.

## Step 3: internal links

After Ben confirms the dry-run counts, replace `/index.php/` links in content and menus with `wp search-replace` (staging URLs only, `--precise`, take a database backup first). The redirects cover anything missed.

## Step 4: sitemap

- Update AIOSEO to the current release (staging first; note the before and after versions).
- Exclude from the sitemap, and set to `noindex` or unpublish (Ben decides which): `home-page-draft`, `competition`, and whichever Contact Us page is retired.
- Make sure the sitemap regenerates with clean URLs.
- Keep AIOSEO's default XSL stylesheet unless Ben asks otherwise. It only affects how the file looks in a browser; search engines ignore it. A branded stylesheet is optional and can be a later piece of work.
- Studies and PDFs are not in the sitemap. That is a content gap, covered separately in `docs/WO-006-publications-library.md`. Do not add raw PDFs here.

## Verification

1. For every URL in both sitemaps and every row of the redirect map: `curl -sI` the old URL, confirm a single `301` to the right clean URL, and a `200` there. Paste the table into the EOD report.
2. Forms on Contact Us still submit on staging (HubSpot is disconnected on staging, so check the WordPress side only).
3. wp-admin, login, REST API, search, category and pagination URLs still work.
4. Footer Lab and the `?footer=` switcher still work at their new URLs.
5. `php -l` and `node --check` on anything touched, as listed in the README.

## Delivery

- Staging only, following the Staging Deployment Rules. Never print or commit keys, passwords or tokens.
- Commit on `feature/url-hygiene` and push. Comment on the GitHub issue with the staging link and the redirect table.
- Add an EOD report entry, and record the **date the URLs changed**, because HubSpot and GA4 page history will split into old and new rows from that day.
- Stop for sign-off. Then draft (do not run) the production release plan for the OVHcloud server.

## Open questions for Ben

- Which Contact Us page is the keeper?
- `home-page-draft` and `competition`: unpublish, or keep but `noindex`?
- Posts: keep dates in the URL?
