// Prepares event logos for the light event cards: recolour, trim, fit, export WebP at 2x.
// Originals are in logo-sources/. Run: node prepare-logos.cjs
const sharp = require('sharp');
const path = require('path');
const SRC = path.join(__dirname, 'logo-sources') + '/';
const OUT = path.join(__dirname, '..', '..', 'pages', 'logos') + '/';
const DARK = [0x10, 0x10, 0x10];
const BOX = { w: 168, h: 56 }; // display box in CSS px; files are 2x

const jobs = [
  // White outline + white panel with black text: swap black and white.
  { slug: 'lab-innovations-2026', src: 'LABlogo-white-temp.png', out: 'logo-lab-innovations-2026.webp', mode: 'swap' },
  // White wordmark, coloured symbol: white -> dark.
  { slug: 'scs-formulate-2026', src: 'SCSF26_final_logo_white_text.png', out: 'logo-scs-formulate-2026.webp', mode: 'white-to-dark' },
  // Solid white background: unmix white into transparency.
  { slug: 'skin-at-bath-2026', src: 'cropped-Skin-logo-white-background1500px-1.png', out: 'logo-skin-at-bath-2026.webp', mode: 'white-to-alpha' },
];

(async () => {
  const sizes = {};
  for (const j of jobs) {
    const { data, info } = await sharp(SRC + j.src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      const grey = Math.max(r, g, b) - Math.min(r, g, b) < 24; // neutral pixel
      if (j.mode === 'white-to-alpha') {
        const na = Math.max(255 - r, 255 - g, 255 - b) / 255;
        if (na === 0) { data[i + 3] = 0; continue; }
        data[i] = Math.round((r - 255 * (1 - na)) / na);
        data[i + 1] = Math.round((g - 255 * (1 - na)) / na);
        data[i + 2] = Math.round((b - 255 * (1 - na)) / na);
        data[i + 3] = Math.round(na * a);
      } else if (grey && a > 0) {
        const lum = (r + g + b) / 3 / 255; // 1 = white, 0 = black
        const t = j.mode === 'swap' ? lum : (lum > 0.5 ? 1 : 0);
        if (j.mode === 'swap') {
          // white -> DARK, black -> white, greys interpolate (anti-aliasing).
          for (let k = 0; k < 3; k++) data[i + k] = Math.round(DARK[k] * t + 255 * (1 - t));
        } else if (t) {
          for (let k = 0; k < 3; k++) data[i + k] = DARK[k];
        }
      }
    }
    // Trim to the opaque bounding box (sharp's trim clipped thin edges), plus 2px.
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const pad = 2; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(info.width - 1, x1 + pad); y1 = Math.min(info.height - 1, y1 + pad);
    const trimmed = await sharp(data, { raw: info }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer({ resolveWithObject: true });
    const { width, height } = trimmed.info;
    const scale = Math.min(BOX.w / width, BOX.h / height);
    const dw = Math.round(width * scale), dh = Math.round(height * scale);
    const img = sharp(trimmed.data).resize(dw * 2, dh * 2, { kernel: 'lanczos3', fit: 'fill' }) // fill: rounding must not crop an edge;
    const lossless = await img.clone().webp({ lossless: true, effort: 6 }).toBuffer();
    const lossy = await img.clone().webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
    const best = lossless.length <= lossy.length ? lossless : lossy;
    require('fs').writeFileSync(OUT + j.out, best);
    sizes[j.slug] = { file: j.out, width: dw, height: dh, bytes: best.length, encoding: best === lossless ? 'lossless' : 'q90' };
  }
  // Display size in CSS px (files are 2x), read by build-events-page.cjs.
  require('fs').writeFileSync(OUT + 'logos.json', JSON.stringify(sizes, null, 2) + '\n');
  console.log(JSON.stringify(sizes));

  // Map pin: Ben's SVG, recoloured to the brand teal and cropped to the pin
  // (viewBox), rendered 48px tall (3x a 16px line) as lossless WebP. WordPress
  // won't accept SVG uploads, so a raster is used; it is shown at 1em.
  const pinSvg = require('fs').readFileSync(SRC + 'labskin-teal-map-pin.svg', 'utf8');
  const pinPath = pinSvg.match(/<path[\s\S]*?\/>/)[0].replace(/fill="#[0-9a-fA-F]+"/, 'fill="#0bb4aa"');
  const pin = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="96 26 320 446">${pinPath}</svg>`), { density: 600 })
    .resize({ height: 48 }).webp({ lossless: true, effort: 6 }).toBuffer();
  require('fs').writeFileSync(OUT + 'map-pin-brand.webp', pin);
  console.log(`map-pin-brand.webp: ${pin.length} bytes`);
})();
