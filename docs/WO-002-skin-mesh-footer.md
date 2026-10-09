# WO-002 - Skin Mesh Footer

## Objective

Implement the "Barrier" interactive footer concept as a lazy-loaded WebGL prototype, starting with a Labskin-only proof of concept that can later be adapted for WordPress.

## Scope

In scope:
- Build the footer concept as a standalone, framework-agnostic module.
- Support Insert and Ribbon silhouettes using a square articulated node lattice.
- Implement gentle poke deformation, velocity-triggered node break/burst/rejoin healing, and inflammation-to-repair color/particle feedback.
- Implement lazy loading, reduced-motion fallback, and no-WebGL fallback.
- Add a dev/lab tuning surface for footer-lab only.
- Capture performance, accessibility, and interaction verification.

Out of scope:
- Production WordPress integration.
- Any skin realism, textures, or sound.
- Physics-simulation fidelity beyond the brief's analytic impulse model.

## Inputs and Dependencies

- Source brief: docs/brief-skin-mesh-footer.md
- Previous EOD: docs/eod-reports/EOD-2026-10-08.md
- Existing Labskin environment notes: docs/labskin-dev-environment.md
- Reference stills: reference/labskin-marketing-flow-01.png and reference/labskin-marketing-flow-02.png
- Runtime choice: raw WebGL2 to stay under the module budget

## Implementation Plan

1. Confirm the footer host surface in Footer-lab and identify where a lazy-loaded concept mounts and unmounts.
2. Create the footer-mesh module with a single entry point, config object, and destroy lifecycle.
3. Implement a single subdivided plane with a shader-rendered square node lattice.
4. Add pointer interaction for hover, poke, drag-to-turn, and velocity-triggered node break/heal.
5. Wire reduced-motion, no-WebGL, and context-loss fallbacks.
6. Add dev-only instrumentation for FPS and configuration tuning.
7. Verify bundle weight, deferred loading, and viewport-triggered initialization.
8. Prepare a poster/fallback asset and reference capture workflow once the design is locked.

## Technical Notes

- Keep the draw call count at one.
- Render articulation nodes and connectors procedurally; break events open a local gap and emit dots that return to heal it.
- Cap DPR and throttle idle animation per the brief.
- Read colour tokens from CSS custom properties instead of hardcoding shader colours.
- Keep footer content interactive and ensure the canvas does not block scroll on touch devices.

## Verification Steps

1. Verify the module is not loaded until the footer nears the viewport.
2. Verify both variants can be switched without remounting the page.
3. Tap and drag test on mouse and touch.
4. Verify reduced motion and fallback behavior.
5. Record bundle size and frame timing before sign-off.
6. Complete 20-gesture mouse and touch checks, including ordinary pokes, turns, fast flicks, and mobile vertical scrolling.
7. Keep the implementation in the canonical `LabSkin-footer` feature branch; do not merge to `main` until source mapping and production sign-off are complete.

## Prototype Checkpoint

- Added a separate Mesh concept tab and panel to Footer Lab, based on the live child-theme footer and its existing WordPress links; the Current variant remains unchanged.
- Footer selector order is Current, LabSkin-Dev, Evidence, Fluorescent, Mesh; the existing variant keys and panel mappings are unchanged.
- Selector description text has been removed. Tabs use equal-width, fixed-height grid cells and do not move when selected.
- Current and Evidence menu links use the plain white underline on hover and keyboard focus without changing their resting text colors. The LabSkin-Dev underline remains unchanged.
- Placed the Mesh label and Insert/Ribbon selector inside the footer as an overlay toolbar; the WebGL mesh remains a positioned canvas layer, not a separate footer component.
- The Mesh intro block is commented out for future testimonial/client-logo content.
- Deployed to the M&C dev/staging site: https://mischiefandcraft.com/footer-lab/?footer=mesh
- Pre-deploy Lightsail snapshot: `labskin-dev-pre-footer-mesh-20261009` (state: available).
- WebGL work-session baseline snapshot: `labskin-dev-pre-articulated-mesh-20261009` (state: available). Use one full-instance snapshot per work session; retain unique per-file backups for each deployment iteration.
- Earlier snapshots (`labskin-dev-pre-footer-mesh-20261009` and `labskin-dev-pre-mesh-flow-tune-20261009`) were also created before the one-per-session cadence was clarified; they were left intact.
- Server has unique per-file backups for each deployment iteration; never overwrite them. Reuse the session baseline snapshot rather than taking another full snapshot for small staging changes.
- Verified staged hashes, PHP syntax, `www-data` ownership, and both public selector states.
- The Mesh panel now loads a raw WebGL2 articulated square lattice lazily, with Insert/Ribbon shapes, CSS-token colors, idle flow, drag rotation, poke deformation, velocity-triggered node breaks, returning particles, healing, FPS output, adaptive DPR/segments, and context-loss cleanup.
- The default pitch is now -1.18 radians for a shallow horizontal-surface view; yaw spins in-plane so the sheet remains flat during slow auto-rotation. A still preview is expected when `prefers-reduced-motion` is enabled.
- Desktop and touch impact UVs are inverse-projected through the current in-plane rotation and tilt, then clipped to the visible Insert/Ribbon outline.
- Pokes and breaks trigger a local red/coral flare, transition to a white repair highlight, then release smaller node-sized markers that drift outward and dissolve by about 3 seconds as the mesh settles back to teal by about 3.5 seconds. Reduced motion suppresses particle travel while preserving the recovery cue.
- Footer links are arranged in four Mesh-only groups: About (including Contact Us), Services, Resources, and Connect. Legal and Privacy are linked from the copyright line. Other Footer Lab variants remain unchanged.
- Evidence concept menu links now use the LabSkin-Dev panel's plain white underline on hover and keyboard focus; Evidence link text color is unchanged and the LabSkin-Dev panel retains its existing effect.
- Renderer size: 33,434 bytes raw, 8,317 bytes gzip.
- Verified in-browser: no module request while the mesh was beyond the 400px observer margin; module loaded when approached; Insert/Ribbon control states; 10 mouse taps, 10 slow turns, and 3 fast flicks without browser errors; cursor-aligned off-center hit after rotation; normal-mode slow rotation in the flatter pose; reduced-motion still and poke recovery; forced no-WebGL CSS fallback; desktop FPS up to 144 and mobile emulation up to 131; mobile banner, no horizontal overflow, and `touch-action: pan-y`.
- Damage/repair sequence verified in timestamped browser captures: red/coral flare transitions to white, then node-sized markers drift/dissolve as the local grid returns to teal by 3.5 seconds. Reduced-motion shows the static flare/repair sequence without moving markers. WebGL shader compiled without console or GL errors.
- Remaining prototype work: client-facing tuning controls for grid/wave/poke/flick/heal values; physical-device touch gesture and scroll tests; context-restoration test; target-device performance measurements; final client visual tuning. Production WordPress integration remains out of scope.
- Canonical prototype source: `https://github.com/benmawhinney/LabSkin-footer`, branch `feature/interactive-skin-mesh-footer`. Mesh implementation commit: `36a8e5e` (`Add inflammation and repair mesh response`); follow-up commits on the same branch record verification and status. `LabSkin-Dev` remains a separate static-site repo; this repository tracks the WordPress Footer Lab overlay, not a full child-theme checkout.

## Risks and Mitigations

- Risk: visual complexity causes the module to exceed the size budget.
- Mitigation: keep to raw WebGL or a minimal helper library and avoid extra passes.

- Risk: gesture detection misclassifies taps and drags.
- Mitigation: keep thresholds conservative and test on both mouse and touch.

- Risk: the footer steals scroll on mobile.
- Mitigation: preserve `touch-action: pan-y` and limit canvas hit regions.

## Deliverables

- Brief copy: docs/brief-skin-mesh-footer.md
- EOD copy: docs/eod-reports/EOD-2026-10-08.md
- Prototype module skeleton and shader files
- Fallback and poster assets
- Measurement notes for load timing, bundle size, and FPS

## Status Log

- 2026-10-09: Work order created from the Barrier brief and yesterday's EOD.
- 2026-10-09: Mesh concept scaffold deployed to M&C dev/staging; Current and Mesh public states verified. WebGL implementation remains pending.
- 2026-10-09: Design direction refined from Voronoi cells to an articulated square node grid with velocity-triggered break and heal behavior.
- 2026-10-09: Raw WebGL2 mesh deployed to M&C dev/staging. Four-column navigation and legal links integrated; lazy load, mouse gestures, reduced-motion, no-WebGL fallback, mobile layout, and gzip size verified. Tuning controls, physical-device tests, context restoration, target-device performance, and canonical GitHub source mapping remain open.
- 2026-10-09: Created and pushed the canonical `LabSkin-footer` prototype source on `feature/interactive-skin-mesh-footer`; initial commit `b44f5fe`.
- 2026-10-09: Added and deployed inflammation/repair marker feedback; verified particle dissipation precedes the white recovery phase.
- 2026-10-09: Changed the default pose to a shallow horizontal surface while preserving slow rotation in normal-motion mode; reset the shared preview from reduced-motion emulation.

## Sign-off

- Owner: Labskin project
- Reviewer: Pending
- Completion date: Pending