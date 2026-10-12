# LabSkin Footer

Source overlay for the LabSkin homepage model explainer, Footer Lab, and interactive Barrier mesh prototype.

The WordPress child theme mirror used for the M&C staging deployment is not a complete theme checkout. `theme-overlay/` contains only the files changed for Footer Lab; integrate them into the matching `inspiro-child` theme rather than installing this repository as a standalone WordPress theme.

## Contents

- `theme-overlay/inspiro-child/page-footer-lab.php` - Footer Lab view and menu grouping.
- `theme-overlay/inspiro-child/footer.php` - Homepage-only switcher integration; other pages retain the standard footer.
- `theme-overlay/inspiro-child/functions.php` - M&C staging-only noindex response and robots directives.
- `theme-overlay/inspiro-child/template-parts/footer/footer-treatment-switcher.php` - Footer treatments and prototype-control label.
- `theme-overlay/inspiro-child/template-parts/model-explorer.php` - Homepage-only, lazy model explainer embed.
- `theme-overlay/inspiro-child/assets/model-explorer/` - Full-thickness scene, original footer shader source, frame bridge, and pinned local Three.js 0.180.0 dependencies with license.
- `theme-overlay/inspiro-child/assets/js/model-explorer-host.js` - Origin-checked iframe sizing and offscreen visibility control.
- `theme-overlay/inspiro-child/assets/css/footer-lab.css` - Mesh layout and responsive styles.
- `theme-overlay/inspiro-child/assets/images/` - LabSkin logo, fluorescent background, and SCS Formulate banner.
- `theme-overlay/inspiro-child/assets/js/footer-lab.js` - Footer variant switcher and lazy module loader.
- `theme-overlay/inspiro-child/assets/js/footer-lab-preview-animation.js` - Evidence treatment animation.
- `theme-overlay/inspiro-child/assets/js/skin-footer.js` - Fluorescent treatment camera animation.
- `theme-overlay/inspiro-child/assets/js/footer-mesh.js` - Raw WebGL2 mesh renderer and interactions.
- `scripts/optimize-homepage-images.php` - Dry-run-first WebP encoder for homepage assets and responsive derivatives.
- `scripts/migrate-homepage-images-to-webp.php` - Dry-run-first WordPress reference/attachment metadata migration with a targeted rollback JSON.
- `reference/` - supplied LabSkin marketing-flow stills.
- `docs/` - design brief and implementation work order.

## Prototype

The Mesh concept is available on the M&C dev/staging Footer Lab at:

https://mischiefandcraft.com/footer-lab/?footer=mesh

The homepage footer now offers the Current, LabSkin-Dev, Evidence, Fluorescent, and Mesh treatments. Its blueprint-backed selector is explicitly marked as prototype-only; non-homepage routes retain the standard footer. The LabSkin-Dev treatment includes the SCS Formulate banner between its content and legal row. The Fluorescent camera runs automatically without the scrubber/view controls. Mesh defaults to Insert with its shape controls commented out. The separate Footer Lab route remains available for review.

## Checks

```powershell
php -l theme-overlay/inspiro-child/page-footer-lab.php
php -l theme-overlay/inspiro-child/template-parts/footer/footer-treatment-switcher.php
node --check theme-overlay/inspiro-child/assets/js/footer-lab.js
node --check theme-overlay/inspiro-child/assets/js/skin-footer.js
node --check theme-overlay/inspiro-child/assets/js/footer-mesh.js
node --check theme-overlay/inspiro-child/assets/js/footer-lab-preview-animation.js
```

The footer Mesh module loads when the Mesh treatment is selected. It uses WebGL2, one draw call, and a CSS fallback. The supplied brief and work order record current limitations and outstanding physical-device checks.

## Homepage Model Explainer

The staging homepage embeds a content-width full-thickness model explainer above the footer. The barrier reuses the actual Footer Lab lattice and response shaders; the epidermis is a translucent veil and the dermis an open triangular field. Layer focus, separation, motion and reset controls remain outside the scene. The representation is schematic and not to scale: facets are not individual cells and interaction effects are not measured tissue responses.

The self-contained document is a native lazy iframe to isolate its styles and controls from WordPress. Parent/frame messages verify origin and source; frame height follows its content, and rendering pauses offscreen. Three.js and OrbitControls are pinned, minified, licensed, and served locally rather than fetched from a CDN. The static document includes its own noindex meta directive because WordPress response filters do not cover static theme assets.

Verified on staging at desktop and 390px mobile widths: rendered canvas pixels and framing, layer controls, poke response, reduced-motion startup, no-WebGL fallback, automatic height, no nested/horizontal scrolling, and offscreen pause/resume. Physical-device touch testing and final scientific sign-off remain outstanding.

Final single-run Lighthouse 13.5.0 scores on 2026-10-12: mobile 53 Performance / 96 Accessibility / 100 Best Practices / 61 SEO; desktop 95 / 96 / 100 / 61. The mobile LCP result needs follow-up; noindex intentionally lowers staging SEO. The initial audits requested only the small host script, not the deferred 3D package. See the EOD report for metrics and comparison caveats.

## Homepage Image Optimization

On M&C dev/staging, eight homepage image families and 26 responsive derivatives were converted to quality-90 WebP siblings (34 outputs total). Across all 34 originals and their WebP outputs, total bytes dropped from 9,454,141 to 1,204,402 (8,249,739 bytes, 87.3%). The eight full-size assets alone went from 5,018,756 bytes to 513,872 bytes, saving 4,504,884 bytes (89.8%). Original PNG/JPEG uploads remain untouched. WordPress attachment metadata, responsive `srcset` entries, the custom header setting, and homepage block URLs now point to WebP; legacy HTTP image references were upgraded to HTTPS.

After securely placing the scripts on the staging host, the optimizer defaults to a no-write dry run:

```sh
sudo -u www-data php /home/ubuntu/optimize-homepage-images.php /var/www/mischiefandcraft.com/wp-content/uploads
```

Run with `--write` only after reviewing the listed files and confirming no output collisions. The migration script also defaults to dry-run; apply it only with a unique rollback path:

```sh
sudo LABSKIN_WEBP_APPLY=1 LABSKIN_WEBP_BACKUP=/home/ubuntu/homepage-webp-rollback.json \
	wp --allow-root --path=/var/www/mischiefandcraft.com \
	eval-file /home/ubuntu/migrate-homepage-images-to-webp.php
```

## Search Indexing

The child theme emits `X-Robots-Tag: noindex, nofollow` and WordPress robots directives only when the home host is `mischiefandcraft.com` or `www.mischiefandcraft.com`. Staging `robots.txt` intentionally remains crawlable so search engines can fetch the noindex directive. Do not apply this host guard to Labskin production.

## Staging Deployment Rules

- Use one verified Lightsail snapshot at the beginning of a deployment work session; use unique per-file backups for subsequent iterations in that session.
- Run SSH/SCP from PowerShell with strict host-key checking.
- Deploy only to the M&C dev/staging host. Production Labskin requires a confirmed source mapping, stakeholder sign-off, and a separate release plan.
- The child theme sends `X-Robots-Tag: noindex, nofollow` only when the WordPress home host is `mischiefandcraft.com` (or `www.mischiefandcraft.com`). Keep `robots.txt` crawlable so search engines can read this directive; do not carry the staging host guard onto Labskin production.
- Never commit credentials, private keys, server backups, or local environment files.