# WO-004 - Clean URLs, Redirects and Sitemap Hygiene

**Status:** Ready to execute (staging only)
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
