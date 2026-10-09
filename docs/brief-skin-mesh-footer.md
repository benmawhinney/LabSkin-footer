# Brief: "Barrier" - interactive skin-mesh footer

**Client:** LabSkin (human skin equivalents, grown in the lab)
**Component:** Animated, interactive WebGL footer background
**Destination:** Footer-lab (concept presented to end users), then the LabSkin WordPress site
**Status:** Ready to build - v1 prototype

## 1. The idea in one paragraph

A single, floating square lattice of fine vector lines and articulated nodes - a visual metaphor for the *stratum corneum*, the skin's top barrier layer - drifts and slowly turns in the dark footer. It borrows the long, silky wave-flow of LabSkin's marketing animation (teal ribbons on deep navy), but resolves that flow into a connected mesh. Users can **turn**, **prod**, and **flick** it: a gentle press dents the surface and it slowly recovers; a fast swipe can break one node into glowing dots that drift out, gather, and reconnect as the mesh heals. It is never realistic - no pores, no flesh tones, no texture maps. It is a graphic system that behaves like responsive skin.

The metaphor: **the barrier is alive, it responds, and it recovers.** That is what LabSkin grows.

## 2. Reference and visual language

Two stills from LabSkin's marketing animation are stored in `reference/labskin-marketing-flow-01.png` and `reference/labskin-marketing-flow-02.png`. Key traits to carry over:

- Deep navy field, no hard horizon.
- Many fine, parallel teal lines forming ribbons that twist through space - the "flow". Lines get denser and brighter where the ribbon folds toward the viewer.
- Thin hairline strokes, additive-feeling glow where lines overlap, no solid fills.
- White wordmark, teal square accent.

The new direction is a **square grid of vector elements**. Each crossing is a visible articulation node; connecting lines flex between nodes. Preserve the reference's hairline weight, luminous folds, deep-blue negative space, and slow liquid motion. The grid should feel like a ribbon translated into a responsive surface, not a rigid wireframe.

### Colour tokens (sample-confirm against brand files before finalising)

| Token | Value | Use |
|---|---|---|
| `--ls-navy-900` | `#061D33` | Footer background (slightly darker than marketing navy so the mesh pops) |
| `--ls-navy-700` | `#0B2E4F` | Background radial lift behind the mesh |
| `--ls-teal-400` | `#5FC9C4` | Base cell-edge colour |
| `--ls-teal-200` | `#A8E6E0` | Edge colour on crests / facing the viewer |
| `--ls-white` | `#FFFFFF` | Peak highlight at poke contact, footer text |
| `--ls-teal-accent` | `#3DBFB8` | Brand square accent, focus rings, link hover |

Pass these into the shader as uniforms read from CSS custom properties at init, so brand tweaks don't need a shader edit.

## 3. The object

### Geometry: one articulated sheet, two presentation variants

Build both behind a single config flag so Footer-lab can present them side by side. Both use the same square node lattice; the variant changes the sheet silhouette and framing.

- **Variant A - "Insert" (recommended lead):** a near-square sheet with a softly faded perimeter, sitting right of centre in the footer, tilted toward the viewer and turning slowly. Nods to how skin equivalents are grown in round culture inserts without depicting a literal dish.
- **Variant B - "Ribbon":** a wide strip spanning the footer width that twists gently along its length, directly echoing the marketing ribbons. Ends fade to transparent.

Both: one subdivided plane (roughly **160 x 160 segments** desktop, **96 x 96** mobile) with a lower-frequency square lattice drawn as vector lines and nodes in the shader. Underlying vertices are articulation points: wave, poke, and break forces displace the node field and the connecting lines follow. Nothing underneath it. No second layer.

### The grid and nodes

Render the lattice procedurally in the fragment shader rather than creating a draw call per line or node. The surface stays a single mesh and one draw call.

- Grid spacing is tunable; start with about 28-36 visible intervals across the hero sheet so nodes read clearly without looking like graph paper.
- Draw anti-aliased hairline connectors and a small luminous dot at every lattice crossing. Connector lines flex with the surface; nodes brighten subtly at folds and intersections.
- Blend teal-400 toward teal-200 by local height and view angle. Keep cell interiors transparent; the navy background remains dominant.
- Optional: introduce slight, stable node-spacing irregularity so the lattice feels organic without losing its square-grid identity.
- Use additive-feeling glow in the shader, not post-processing. Dim the reverse side if the sheet turns over.

## 4. Motion

### Idle flow (always on, unless reduced motion)

Vertex shader displacement along the sheet normal:

- Sum of 2-3 low-frequency travelling sine waves at different angles and speeds (periods ~8-14 s) -> the long "flow" from the marketing piece. Amplitude ~4-6% of sheet width.
- A very low-amplitude simplex noise term for organic irregularity.
- **Breathing:** node spacing oscillates +/-2% over ~6 s. Barely perceptible; makes it feel alive.
- **Auto-rotate:** ~6deg/s around the sheet's normal (Variant A) or a slow twist travel along the length (Variant B).
- **Node articulation:** each lattice crossing moves with the travelling wave field; connectors bend continuously between nodes.

### Turn (drag)

- Pointer drag rotates the object (yaw from horizontal drag, limited pitch +/-20deg from vertical drag).
- Release with **inertia**: angular velocity decays with damping ~0.94 per frame (frame-rate independent - use `Math.pow(damping, dt*60)`).
- After ~2.5 s with no input, ease back into auto-rotate and default tilt over ~1.5 s.

### Prod (press / tap)

This is the hero interaction. It must feel soft and viscoelastic - skin dents easily and comes back slowly.

- Raycast the pointer against the sheet in its local space to get the contact UV + position.
- Store each poke in a ring buffer of **8 active impulses** passed as uniforms: `vec4(u, v, startTime, strength)`.
- Per impulse, displacement at distance `r` from contact:
  `d = -A · exp(-r² / σ²) · spring(t)  +  ripple(r, t)`
  - `spring(t)`: fast in (~120 ms ease-out), slow out (~700-900 ms) with one small overshoot - critically-damped-ish, not bouncy.
  - `ripple`: a faint outward ring, `A_r · exp(-k·t) · cos(ω·t − κ·r)` with `A_r` ≈ 15% of `A`. One visible ring, not a pond.
  - `σ` ≈ 8-10% of sheet width.
- **Grid compression:** displace nearby nodes toward the contact point and bend their connectors, so the lattice visibly compresses at the finger and stretches gently around the dent rim. This is what sells "skin" over "trampoline".
- **Highlight:** edges at the contact point flash toward white and fade with the spring.
- **Press and hold:** dent deepens a little (up to 1.4x strength) and holds while pressed; recovery starts on release.

### Break and heal (fast flick)

- A fast pointer flick across the sheet can break the nearest node. Use measured pointer velocity and a tunable threshold, not distance alone, so a slow drag or ordinary poke cannot break the surface accidentally.
- At the break point, briefly open a small gap in the node and its adjoining connectors. Emit a compact burst of luminous dots from that node; particles arc outward, decelerate, then flow back and rejoin the lattice.
- Heal the gap as the dots return, with a short luminous reconnection pulse. Keep the effect local: one broken node per fast flick, no debris or lingering damage.
- Support a small ring buffer of simultaneous break events. Each event is analytic and time-based, keeping the effect lightweight without a full physics simulation.
- Reduced-motion mode disables idle flow and the outward particle burst. Pokes still deform and recover; break/heal is shown as a static, brief node gap and reconnection.

### Hover (desktop only)

A gentle, shallow pressure dimple (~25% of a poke) follows the cursor across the sheet, smoothed with lerp. Signals "this is touchable" before anyone clicks.

### Gesture disambiguation

- Pointer down + up within ~180 ms and under 6 px movement -> **poke**.
- Pointer down + move over 6 px -> **turn** (the initial dent eases out as turning begins).
- A turn gesture becomes a **break** only when measured pointer velocity exceeds a tunable flick threshold; begin near 1,000 CSS px/s and tune on mouse and touch.
- Use Pointer Events throughout (`pointerdown/move/up/cancel`, `setPointerCapture`).

## 5. Footer layout

- Footer is a full-width dark band (`--ls-navy-900`), suggested height `clamp(420px, 55vh, 640px)` desktop.
- `<canvas>` sits absolutely positioned behind footer content, `aria-hidden="true"`.
- Footer content (logo, nav, contact, legal) sits left-aligned in a column that never overlaps the mesh's interactive centre on desktop. Mesh occupies the right ~55%.
- Subtle radial gradient (`--ls-navy-700` -> `--ls-navy-900`) behind the mesh for depth.
- Footer links stay fully clickable: the canvas only receives pointer events in its own region; content layer has `pointer-events: auto`.
- **Mobile (<768 px):** mesh sits above the footer content as a ~260 px tall banner, smaller cell count, Variant A only.
- Optional micro-label near the mesh, very low contrast: "Barrier layer - touch to test" - present as an option in Footer-lab, not a default.

## 6. Performance budget (non-negotiable)

This is a footer. It must cost almost nothing until someone reaches it.

- **Lazy init:** do not load the WebGL library or create the context until the footer is within ~400 px of the viewport (`IntersectionObserver`). Dynamic `import()`.
- **JS weight:** target **<= 60 KB gz** for the module. Prefer **OGL** (~10-25 KB) or raw WebGL. If Three.js is used, import only what's needed and confirm the bundle size in the PR description; flag it if over budget.
- **One mesh, one material, one draw call.** No post-processing passes. Glow is faked in the shader.
- **DPR capped** at 1.75 desktop, 1.5 mobile.
- **Pause** the render loop when the footer is off-screen and on `visibilitychange` hidden. Throttle idle animation to 30 fps after 20 s without interaction; full rate on interaction.
- **Target:** steady 60 fps on a mid-range 2022 laptop and recent iPhone/Android mid-tier. Ship with a dev-only FPS readout.
- **Adaptive quality:** if average frame time > 22 ms over 2 s, step down segments and DPR once.
- Zero layout shift: canvas sized via CSS, `ResizeObserver` drives renderer size.

## 7. Accessibility and fallbacks

- `prefers-reduced-motion: reduce` -> no idle flow, no auto-rotate, no inertia. Render a still frame. Pokes still work but recover without ripple.
- **No WebGL / context lost** -> swap to a static poster (`footer-mesh-poster.webp`, rendered from the live component, plus an inline SVG fallback of the cell pattern). Handle `webglcontextlost` / `restored`.
- Canvas is decorative (`aria-hidden`). All footer information exists as real HTML text.
- Touch: `touch-action: pan-y` on the canvas so vertical swipes still scroll the page; only horizontal drags spin.
- Text contrast on `--ls-navy-900` must meet WCAG AA.

## 8. Build shape

Framework-agnostic so it drops into Footer-lab now and WordPress later.

```
/footer-mesh/
  index.js          // init(container, options) -> { destroy(), setVariant(), setConfig() }
  mesh.vert.glsl
  mesh.frag.glsl
  interaction.js    // pointer, raycast, gesture disambiguation, impulse ring buffer
  config.js         // all tunables + defaults, documented
  poster.webp
  README.md
```

- Plain ES module, no framework dependency. Follow existing Footer-lab conventions for how concepts are registered and presented.
- `destroy()` must release the GL context, observers and listeners cleanly (Footer-lab will swap concepts in and out).
- In Footer-lab only: a **lil-gui** panel (dev/lab flag) exposing: variant, grid spacing, node size, line width, wave amplitude/speed, auto-rotate speed, poke strength/radius/recovery, flick threshold, burst spread, heal time, colours. This is how we tune it live with the client. Strip from production build.

## 9. Acceptance criteria

1. Both variants render and can be switched in Footer-lab.
2. Idle motion reads as the same "family" as the marketing animation when viewed side by side with the reference stills.
3. Nodes and connectors read as a flexible square lattice, not a rigid grid or generic wireframe.
4. A tap visibly deforms nearby nodes and the mesh slowly recovers; a fast flick breaks one node and its adjoining lines, then the dots return and heal it.
5. Drag turns the sheet with inertia and returns to idle on its own.
6. Tap, turn, and break gestures do not misfire in 20 test interactions on mouse and touch.
7. Vertical scrolling on mobile is never trapped by the canvas.
8. No WebGL code or library is downloaded until the footer approaches the viewport (verify in Network tab).
9. Reduced-motion and no-WebGL fallbacks both verified.
10. Module bundle size and measured fps reported in the PR.

## 10. Out of scope (v1)

- Any layers beneath the barrier sheet.
- Realistic skin textures, pores, hair, or skin tones.
- Sound.
- A true physics simulation (mass-spring or GPU wave equation). Analytic impulses are deliberate for v1. If the client wants more "give", a CPU height-field at 128^2 is the v2 upgrade path.

## 11. Design notes for whoever tunes it

- Restraint wins. If in doubt, slower, thinner, dimmer. The reference animation is calm; the mesh should be something you notice after the footer content, then can't stop playing with.
- Visible node articulation on poke and the break/heal response make this LabSkin and not a generic WebGL demo. Spend tuning time there.
- Recovery speed is the emotional dial: too fast feels like jelly, too slow feels broken. Start at ~800 ms and test with people.