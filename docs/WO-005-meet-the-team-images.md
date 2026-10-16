# WO-005 - Meet the Team: Square, Rounded Headshots to Match LinkedIn

**Status:** Ready to execute (staging only)
**Raised:** Friday 16 October 2026, by Ben
**Branch:** `feature/team-page-images`, created from `feature/meeples-footer`
**Target:** M&C dev/staging only (https://mischiefandcraft.com/index.php/meet-the-team/ or its clean URL after WO-004). Do not touch Labskin production.

## Objective

The team posts on LinkedIn with square photos and rounded corners. The Meet the Team page should look the same, so the brand reads consistently across both.

## What we know (from the live page, 16 Oct 2026)

- 17 people, shown as one vertical sequence: photo, then name as a heading, then role in bold.
- The photos are a mix of formats and sources: PNGs exported from Canva (`Untitled-Design-1.png`, `Labskin-Meet-the-team-1.png`), large JPEGs (`*-scaled.jpg`) and an unnamed LinkedIn download (`1761244676560.jpeg`).
- **Every image has empty alt text.**
- **Mariyah Ahmed has no photo.** Her slot uses `2026/08/Labskin-Meet-the-team-1.png`, which is a 1080 x 1080 image that is 100% white (checked pixel by pixel in the browser on 16 Oct 2026), so the page shows a blank square. The same blank file is used again in the "Talk to a Labskin expert" section after Erin's bio. Matteo's similarly named `Labskin-Meet-the-team-1-1.png` is a real photo. Most likely the Canva export for Mariyah failed. Ben is sourcing the correct headshot; until it arrives, do not invent or substitute one.
- Every image is a core `wp-block-image size-full` block shown at 340 x 340, whatever the source shape. The sources range from square (Stewart, 800 x 800) to tall portrait (Nicola and Bart, 740 x 940; Holly and Emma, 3:4). WordPress crops or squashes the portraits from the centre with no thought for where the face is. Ben confirmed Nicola's is visibly off. In Step 0, report the computed `object-fit` for each image, so we know whether they are cropped or distorted.
- No page-builder classes were found; the photos are core blocks.

## Step 0: audit and report (no changes)

1. How the page is built: block editor, a page builder or the theme. List the image blocks and their classes.
2. The pixel size, aspect ratio and file size of each of the 17 photos.
3. Whether the blank image in the "Talk to a Labskin expert" section is meant to show something (for example a team photo) or can be removed.
4. Ben will drop one or two LinkedIn post images into `reference/linkedin/`. Measure the corner radius as a percentage of the image width, and note any border, background colour or shadow. If no reference arrives, use 8% of the width as a placeholder and say so.

Report and wait for Ben's OK.

## Step 1: one consistent treatment, in CSS

- Scope it to the Meet the Team page only (a body class or a wrapper class), in the child theme's stylesheet. Do not edit the images to bake in the corners.
- Use a CSS variable for the radius so it can be tuned in one place:

  ```css
  .lsk-team { --lsk-team-radius: 8%; }
  .lsk-team img {
    aspect-ratio: 1 / 1;
    width: 100%;
    max-width: 320px;
    height: auto;
    object-fit: cover;
    object-position: 50% 25%; /* keep faces in frame */
    border-radius: var(--lsk-team-radius);
  }
  ```

- Where a face is cropped badly, set a per-image `object-position` as a quick fix. Better still, make a proper square crop from the original upload for each portrait, centred on the face with the eyes about a third of the way down, matching the LinkedIn framing. Show Ben the crops before replacing anything.
- Optional and only with Ben's OK: lay the team out as a grid (3 columns on desktop, 2 on tablet, 1 on mobile), keeping the current order.

## Step 2: images and accessibility

- Give every photo alt text in the form "Photo of Dr Nicola Kingswell, Scientific Director". Set it in the Media Library, so it is reused wherever the image appears.
- Produce square WebP versions (for example 640 x 640) with the existing optimiser in `scripts/` (dry run first), and give them sensible file names (`nicola-kingswell.webp`). Keep the originals.
- Replace Mariyah's blank image with her real headshot once Ben supplies it, and deal with the blank image in the call-to-action section as agreed in Step 0.

## Constraints

- Do not change anyone's name, title or role text. Those come from the team.
- Keep the Meeples sprite atlas in step with this page. If the team list or roles change, note it, but do not regenerate sprites in this work order.

## Verification

1. Desktop, tablet and 390 px: every photo is square, with the same corner radius, faces in frame and no horizontal scroll.
2. Put a screenshot side by side with a LinkedIn reference post in the EOD report.
3. Lighthouse Accessibility shows no "image elements do not have alt attributes" findings for this page.
4. Total image bytes on the page before and after.

## Delivery

Staging only, following the Staging Deployment Rules. Commit on `feature/team-page-images`, push, comment on the GitHub issue with the staging link, add an EOD entry and stop for sign-off.
