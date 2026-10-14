# Meeples footer kit

Animated pixel-art lab strip for the bottom of the Labskin site footer.

- Start with `VSCODE_PROMPT.md`: paste it into Claude in VS Code with this repository open.
- `preview.html` opens on its own in any browser, with time, weather and speed controls.
- `demo/index.html` shows the real file layout. Serve this folder over HTTP (for example `python3 -m http.server`) and open `/demo/`.
- The runtime is `src/labskin-footer.js` and `src/labskin-footer.css`. The assets are `assets/labskin-meeples-32.png` and `assets/labskin-meeples.json`.
- To change a sprite, edit `tools/sprite-gen.js` and run `python3 tools/export.py`.
- The exporter also writes the separately generated orange `assets/labskin-bot-32.png`; it is not an extra team member or row in the team atlas.
- Opening hours default to Monday-Friday 09:00-17:30, Europe/London. Closed states use standby lighting and the assistant bot; there is no after-hours human crew.
- Hours, phone and contact are configured with `data-lsf-hours`, `data-lsf-phone` and `data-lsf-contact`. Phone and assistant hotspots are real accessible HTML elements over the pixel drawing.
- Run the dependency-free hours regression suite with `node --test meeples/tests/opening-hours.test.cjs` from the repository root.

Weather comes from Open-Meteo (https://open-meteo.com, free, no key). Sun position is calculated in the browser for Wetherby.
