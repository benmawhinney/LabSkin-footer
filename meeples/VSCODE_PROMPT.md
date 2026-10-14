# Prompt for VS Code: Meeples footer treatment (LabSkin-footer repo)

Open the `LabSkin-footer` repository in VS Code (pull the latest first), then paste everything below the line into Claude.

---

You are adding a sixth footer treatment, **Meeples**, to the Footer Lab in this repository. It is an animated pixel-art lab strip. The working code and assets are already written and tested in `meeples/` at the root of this repository. Your job is to integrate it into `theme-overlay/inspiro-child/` the same way the existing treatments are integrated, deploy to the M&C dev/staging site (mischiefandcraft.com) following this repository's Staging Deployment Rules in `README.md`, and stop for my sign-off.

## What it is

A strip about 144 px tall that runs the full width of the footer, under the existing footer columns. It has no background of its own: **the footer background is the lab wall**, and a one-pixel floor line runs along the bottom. Inside it, left to right:

- A door labelled **STORE**. Scientists (the 17 people from the Meet the Team page, as 32 px pixel sprites) walk in to fetch reagents and apparatus, and come back out carrying something.
- The **bench**, with a safety cabinet, microscope, sample racks, a computer, an incubator and a centrifuge. Each item is a work station.
- **Windows** above the bench. The sky behind them is one continuous painting, so the sun or moon moves across the strip and each window shows its own slice. Sun position is calculated for Wetherby (53.928, -1.386). Live weather comes from Open-Meteo (free, no API key, CORS enabled): clear, cloudy, overcast, fog, drizzle, rain, snow or thunderstorm, cached in `localStorage` for 20 minutes.
- A **glass-brick partition** at two thirds of the width.
- A **meeting area** behind it: a table with chairs, and a **wall screen** that shows a pixel LABSKIN wordmark, then scrolls through science stills (cells, colonies on a petri dish, an H&E skin section, a DNA helix, skin bacteria, a barrier-function chart).
- A door labelled **BREAK ROOM** on the right.

Behaviour: each person loops through fetching supplies from the store, working at the bench and taking a break when they get tired. Every so often two or three of them go to the table for a meeting. Arrivals and departures go through the break room (coats and lockers). **At least two people are always on screen**: nobody goes into the store or the break room if that would leave fewer than two visible. How many people are in follows UK lab hours in `Europe/London` (filling from 08:15, emptying by 17:45). Outside those hours and at weekends a crew of two keeps going. Hovering a scientist shows their first name, role and what they are doing.

The wordmark on the screen is drawn in a 3x5 pixel font as a placeholder. To use the real Labskin logo, pass a small pixel version of it as `data-logo="…/labskin-logo-pixel.png"` (about 44 px wide works best).

## Files in `meeples/`

| Path | Purpose |
|---|---|
| `src/labskin-footer.js` | The whole runtime. No dependencies, about 37 KB unminified. Exposes `window.LabskinFooter` with `mount(el, options)` and `debug(cfg)`. It also auto-mounts any `.lsf-scene[data-sprites]` on DOMContentLoaded. |
| `src/labskin-footer.css` | Styles for the strip and the hover label. The strip is transparent: the footer background is the wall. |
| `assets/labskin-meeples-32.png` | Sprite sheet the runtime uses: 7 columns by 17 rows of 32 px cells. |
| `assets/labskin-meeples-64.png` | The same sheet at 2x, for design use only. |
| `assets/labskin-meeples.json` | Atlas: cell size, column names, and one entry per person (row, name, first name, role, outfit, glasses). |
| `tools/sprite-gen.js`, `tools/export.py` | Source for the sprites. Edit, then run `python3 tools/export.py` (needs Playwright) to regenerate the three asset files. |
| `demo/index.html` | Standalone demo. Serve `meeples/` over HTTP and open `/demo/`. |
| `preview.html` | Self-contained preview with time, weather and speed controls. |

## Steps

1. **Read first.** Read `README.md` (especially Staging Deployment Rules), `template-parts/footer/footer-treatment-switcher.php`, `assets/js/footer-lab.js`, `assets/css/footer-lab.css`, `footer.php` and `functions.php` in `theme-overlay/inspiro-child/`, and `meeples/src/labskin-footer.js`. Tell me in a few lines how you will add the treatment before you edit anything.
2. **Copy assets** into `theme-overlay/inspiro-child/assets/meeples/`: `labskin-footer.js`, `labskin-footer.css`, `labskin-meeples-32.png`, `labskin-meeples.json`. Leave the 64 px sheet, tools and demo in `meeples/` only.
3. **Add the treatment to the switcher**, following the pattern of the existing ones:
   - A button `<button type="button" aria-pressed="false" data-footer-variant="meeples">Meeples</button>` after Mesh.
   - A panel `data-footer-panel="meeples"` (hidden by default) that renders the live footer content the same way the Current footer panel does, with the lab strip as the last element, full width, under the footer columns:
     ```php
     <div class="lsf-scene" data-lsf-sprites="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/labskin-meeples-32.png' ); ?>"
          data-lsf-atlas="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/labskin-meeples.json' ); ?>"></div>
     ```
     Use `data-lsf-*` names (not `data-sprites`) so the script does not auto-mount while the panel is hidden; a hidden panel has no width.
   - A label for the status line in `footer-lab.js`: "Showing the Meeples lab strip: scientists at the bench with live Wetherby day, night and weather."
4. **Lazy mount** in `footer-lab.js`, like `mountMeshPanel`: the first time the Meeples panel is shown, load `labskin-footer.js` and `labskin-footer.css` (inject them, or enqueue them only on the homepage with `defer`, whichever matches the current approach), then call
   ```js
   window.LabskinFooter.mount(el, { spritesUrl: el.dataset.lsfSprites, atlasUrl: el.dataset.lsfAtlas });
   ```
   Mount only after the panel is visible so the strip measures its real width. The runtime already pauses when off screen or when the tab is hidden.
5. **Respect what is already there:** reduced motion is handled inside the script (one still frame every 30 seconds). The canvas has `role="img"` and an `aria-label`. Weather requests go from the visitor's browser to `https://api.open-meteo.com`; if a Content-Security-Policy is in place, add that host to `connect-src`, or set `weather: "off"` in the mount options and tell me.
6. **Logo on the wall screen:** the screen shows a placeholder pixel wordmark. Make a small pixel version (about 44 px wide) of `assets/images/labskin-logo-white.png`, save it as `assets/meeples/labskin-logo-pixel.png`, and pass it as `logo` in the mount options. Show me the result before deploying.
7. **Checks:** `php -l` on every PHP file you touched and `node --check` on every JS file, as listed in the README. Check the homepage at desktop and 390 px: no horizontal scroll, the strip sits flush on the footer background, the other treatments still work, and switching away and back does not mount a second strip.
8. **Deploy to M&C dev/staging only**, following the Staging Deployment Rules: one verified Lightsail snapshot at the start, unique per-file backups, SSH/SCP from PowerShell with strict host-key checking, using the access already set up on this machine. Never print, copy or commit keys, passwords or tokens. If you need a credential you do not have, stop and ask me.
9. **Stop for sign-off.** Send me https://mischiefandcraft.com/?footer=meeples (or the right homepage URL for the switcher), plus a short list of files added and edited. Nothing goes near Labskin production.
10. **Commit** on a branch named `feature/meeples-footer`, update the Contents list in `README.md`, and add a line to today's EOD report in `docs/eod-reports/`. Do not push to `main` without asking.

## Testing in the browser console

```js
LabskinFooter.debug({ time: new Date().setHours(21, 0, 0, 0), weather: "snow", speed: 60 }); // night, snowing, fast
LabskinFooter.debug({ time: null, weather: "live", speed: 1 });                            // back to real time and live weather
```

Weather names: clear, cloudy, overcast, fog, drizzle, rain, snow, thunder.

## Things not to change without asking me

- The pixel style, colours or sprite sheet.
- The rule that at least two people are always on screen.
- The team list or anyone's role text (it comes from the Meet the Team page).
- Adding any analytics, tracking or third-party script.
- Labskin production.

## Open decisions for me (Ben)

- Whether hover labels with first names and roles stay on (`labels: "hover"`, the default) or go off (`labels: "off"`) if this treatment is ever chosen for the real site.
- Whether Meeples should eventually be a footer in its own right on every page, rather than one option in the homepage switcher.
