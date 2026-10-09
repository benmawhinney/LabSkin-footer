# LabSkin Footer

Source overlay for the LabSkin Footer Lab and the interactive Barrier mesh prototype.

The WordPress child theme mirror used for the M&C staging deployment is not a complete theme checkout. `theme-overlay/` contains only the files changed for Footer Lab; integrate them into the matching `inspiro-child` theme rather than installing this repository as a standalone WordPress theme.

## Contents

- `theme-overlay/inspiro-child/page-footer-lab.php` - Footer Lab view and menu grouping.
- `theme-overlay/inspiro-child/assets/css/footer-lab.css` - Mesh layout and responsive styles.
- `theme-overlay/inspiro-child/assets/js/footer-lab.js` - Footer variant switcher and lazy module loader.
- `theme-overlay/inspiro-child/assets/js/footer-mesh.js` - Raw WebGL2 mesh renderer and interactions.
- `reference/` - supplied LabSkin marketing-flow stills.
- `docs/` - design brief and implementation work order.

## Prototype

The Mesh concept is available on the M&C dev/staging Footer Lab at:

https://mischiefandcraft.com/footer-lab/?footer=mesh

It is a dev/staging prototype, not production. The Current footer and other Footer Lab variants remain separate and unchanged.

## Checks

```powershell
php -l theme-overlay/inspiro-child/page-footer-lab.php
node --check theme-overlay/inspiro-child/assets/js/footer-lab.js
node --check theme-overlay/inspiro-child/assets/js/footer-mesh.js
```

The renderer is lazy-loaded when the Mesh footer is within 400 px of the viewport. It uses WebGL2, one draw call, and a CSS fallback. The supplied brief and work order record current limitations and outstanding physical-device checks.

## Staging Deployment Rules

- Use one verified Lightsail snapshot at the beginning of a deployment work session; use unique per-file backups for subsequent iterations in that session.
- Run SSH/SCP from PowerShell with strict host-key checking.
- Deploy only to the M&C dev/staging host. Production Labskin requires a confirmed source mapping, stakeholder sign-off, and a separate release plan.
- Never commit credentials, private keys, server backups, or local environment files.