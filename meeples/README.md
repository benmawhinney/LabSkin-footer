# Meeples footer kit

Animated pixel-art lab strip for the bottom of the Labskin site footer.

- Start with `VSCODE_PROMPT.md`: paste it into Claude in VS Code with this repository open.
- `preview.html` opens on its own in any browser, with time, weather and speed controls.
- `demo/index.html` shows the real file layout. Serve this folder over HTTP (for example `python3 -m http.server`) and open `/demo/`.
- The runtime is `src/labskin-footer.js` and `src/labskin-footer.css`. The assets are `assets/labskin-meeples-32.png` and `assets/labskin-meeples.json`.
- To change a sprite, edit `tools/sprite-gen.js` and run `python3 tools/export.py`.

Weather comes from Open-Meteo (https://open-meteo.com, free, no key). Sun position is calculated in the browser for Wetherby.
