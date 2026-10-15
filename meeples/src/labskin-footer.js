/*! Labskin Footer Lab — animated pixel-art lab strip for the site footer.
 *  The footer background is the wall; a one-pixel floor line runs along the bottom.
 *  Scientists fetch reagents from the Store, work at the bench, meet at the table behind
 *  the glass-brick wall, and take breaks in the Break room. While open, at least two are always on
 *  screen; the lab fills to a full crew by half an hour after opening, free stations are taken
 *  over promptly, and people rotate in and out on shifts through the day.
 *  Windows show real-time day and night for Wetherby and the live weather (Open-Meteo, no key).
 *  A wall screen shows the Labskin wordmark, then scrolls through science stills.
 *  No dependencies. Mount: <div class="lsf-scene" data-sprites="…/labskin-meeples-32.png" data-atlas="…/labskin-meeples.json"></div>
 */
(function (root) {
  "use strict";

  var DEFAULTS = {
    lat: 53.928, lon: -1.386, tz: "Europe/London",
    scale: 2,              // CSS pixels per art pixel
    height: 72,            // art pixels
    labels: "hover",       // "hover" | "off"
    weather: "live",       // "live" | "off"
    logo: null,            // optional URL of a small pixel logo image for the wall screen
    cacheMinutes: 20,
    maxPeople: 5,          // full working crew, reached rampMinutes after opening
    maxOnScreen: 6,        // hard cap, leaving one slot for shift handovers
    minOnScreen: 2,
    rampMinutes: 30,
    shiftMinutes: [40, 90] // how long each person stays before someone new rotates in
  };
  DEFAULTS.hours = "Mon-Fri 09:00-17:30";
  DEFAULTS.phone = "+447387001146";
  DEFAULTS.contact = "/contact-us-2/";
  DEFAULTS.bot = null;
  var WMO = function (code) {
    if (code === 0) return { kind: "clear", cloud: 0.05 };
    if (code === 1) return { kind: "clear", cloud: 0.25 };
    if (code === 2) return { kind: "cloudy", cloud: 0.55 };
    if (code === 3) return { kind: "overcast", cloud: 0.95 };
    if (code === 45 || code === 48) return { kind: "fog", cloud: 0.9 };
    if (code >= 51 && code <= 57) return { kind: "drizzle", cloud: 0.9, precip: 0.35 };
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { kind: "rain", cloud: 0.95, precip: code === 65 || code === 82 ? 1 : 0.7 };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { kind: "snow", cloud: 0.9, precip: 0.6 };
    if (code >= 95) return { kind: "thunder", cloud: 1, precip: 1 };
    return { kind: "cloudy", cloud: 0.5 };
  };
  var PRESETS = { clear: 0, cloudy: 2, overcast: 3, fog: 45, drizzle: 53, rain: 63, snow: 73, thunder: 95 };

  // 3x5 pixel font for signs and the wordmark
  var FONT = { A: "010101111101101", B: "110101110101110", E: "111100110100111", I: "111010010010111", K: "101101110101101", L: "100100100100111",
    M: "101111111101101", N: "110101101101101", O: "111101101101111", R: "110101110101101", S: "011100010001110", T: "111010010010010", C: "111100100100111", D: "110101101101110", P: "110101110100100", " ": "000000000000000",
    G: "111100101101111", 0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
    5: "111100111001111", 6: "111100111101111", 7: "111001001010010", 8: "111101111101111", 9: "111101111001111" };
  // classic red rotary telephone, 12x9: handset on the cradle, cream dial with finger holes
  var PHONE = [
    ".KKKKKKKKKK.",
    "HHH......HHH",
    "..LLRRRRRR..",
    ".RRDoDoDDRR.",
    ".RRoDDDDoRR.",
    "RRRDDhhDDRRR",
    "RRRoDDDDDRRR",
    "RRRDoDoDDRRR",
    "SSSSSSSSSSSS"
  ];
  var PHONE_COLOURS = { K: "#e0645a", H: "#a5332d", R: "#c4423b", L: "#e0645a", S: "#8e2a25", D: "#f3efe6", o: "#2b3a40", h: "#8e2a25" };
  function text(g, str, x, y, col, px) {
    px = px || 1; g.fillStyle = col;
    for (var i = 0; i < str.length; i++) { var f = FONT[str[i]] || FONT[" "]; for (var k = 0; k < 15; k++) if (f[k] === "1") g.fillRect(x + (i * 4 + k % 3) * px, y + Math.floor(k / 3) * px, px, px); }
    return str.length * 4 * px - px;
  }

  // ---------- helpers ----------
  function seeded(seed) { var s = seed >>> 0; return function () { s = Math.imul(s ^ s >>> 15, 2246822507) + 0x9e3779b9 >>> 0; return s / 4294967296; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hex(c) { if (c.charAt(0) !== "#") return c.match(/\d+/g).map(Number); var n = parseInt(c.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function mix(c1, c2, t) { var a = hex(c1), b = hex(c2); return "rgb(" + Math.round(lerp(a[0], b[0], t)) + "," + Math.round(lerp(a[1], b[1], t)) + "," + Math.round(lerp(a[2], b[2], t)) + ")"; }
  function londonParts(date, tz) {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" });
    var o = {}; f.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return { h: +o.hour, m: +o.minute, wd: o.weekday, ymd: o.year + o.month + o.day };
  }
  // wall clock reading: local time plus its zone; the browser's tz database handles the BST/GMT changeovers
  var zoneFormats = {};
  function clockText(date, tz) {
    var p = londonParts(date, tz), f = zoneFormats[tz] || (zoneFormats[tz] = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "short" }));
    var zone = (f.formatToParts(date).find(function (part) { return part.type === "timeZoneName"; }) || {}).value || "";
    if (!/^[A-Z]{3,4}$/.test(zone)) { // some engines say "GMT+1"; name the UK zones ourselves
      var utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes(), offset = ((p.h * 60 + p.m - utcMinutes) % 1440 + 1440) % 1440;
      zone = tz === "Europe/London" ? (offset === 60 ? "BST" : "GMT") : "";
    }
    return { time: (p.h < 10 ? "0" : "") + p.h + ":" + (p.m < 10 ? "0" : "") + p.m, zone: zone };
  }
  function sun(date, lat, lon) {
    var rad = Math.PI / 180, d = date / 86400000 - 10957.5;
    var g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad, dec = Math.asin(Math.sin(e) * Math.sin(L));
    var gmst = (18.697374558 + 24.06570982441908 * d) % 24 * 15;
    var ha = ((gmst + lon - ra) % 360 + 540) % 360 - 180;
    var alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha * rad)) / rad;
    return { alt: alt, ha: ha };
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function hoursPolicy(value) {
    var match = /^Mon-Fri (\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(value);
    if (!match || +match[1] > 23 || +match[3] > 23 || +match[2] > 59 || +match[4] > 59) throw new Error("Invalid lab hours: use Mon-Fri HH:MM-HH:MM.");
    var start = +match[1] * 60 + +match[2], end = +match[3] * 60 + +match[4];
    if (end <= start) throw new Error("Lab closing time must follow opening time.");
    return { start: start, end: end };
  }
  function isOpen(date, hours, tz) {
    var parts = londonParts(date, tz), minutes = parts.h * 60 + parts.m;
    return parts.wd !== "Sat" && parts.wd !== "Sun" && minutes >= hours.start && minutes < hours.end;
  }
  function moonPhase(date) {
    var cycles = (+date - Date.UTC(2000, 0, 6, 18, 14)) / (29.530588853 * 86400000);
    return cycles - Math.floor(cycles);
  }

  // ---------- science stills for the wall screen (drawn once, 44x24) ----------
  function makeStills() {
    var out = [], r = seeded(42);
    function cv(draw) { var c = document.createElement("canvas"); c.width = 44; c.height = 24; var g = c.getContext("2d"); draw(g); out.push(c); }
    cv(function (g) { // keratinocytes under the microscope
      g.fillStyle = "#e9f3ee"; g.fillRect(0, 0, 44, 24);
      for (var i = 0; i < 16; i++) { var x = r() * 40, y = r() * 20; g.fillStyle = "#9fd9c6"; g.fillRect(x | 0, y | 0, 5, 4); g.fillStyle = "#2f8f6f"; g.fillRect((x + 2) | 0, (y + 1) | 0, 2, 2); }
    });
    cv(function (g) { // petri dish colonies
      g.fillStyle = "#20323a"; g.fillRect(0, 0, 44, 24); g.fillStyle = "#e7d9a8"; g.beginPath(); g.arc(22, 12, 11, 0, 7); g.fill();
      g.strokeStyle = "#c9d3d8"; g.lineWidth = 1; g.beginPath(); g.arc(22, 12, 11.5, 0, 7); g.stroke();
      for (var i = 0; i < 22; i++) { var a = r() * 6.28, d = r() * 9; g.fillStyle = ["#f2b84b", "#ff8a65", "#fff3c4"][i % 3]; g.fillRect((22 + Math.cos(a) * d) | 0, (12 + Math.sin(a) * d) | 0, 2, 2); }
    });
    cv(function (g) { // skin cross-section, H&E
      g.fillStyle = "#f6e6ee"; g.fillRect(0, 0, 44, 24);
      for (var x = 0; x < 44; x++) { var t = 6 + Math.round(Math.sin(x / 4) * 1.5); g.fillStyle = "#c46a9c"; g.fillRect(x, 3, 1, 3); g.fillStyle = "#8e3a7a"; g.fillRect(x, 6, 1, t - 2); g.fillStyle = "#e6a8c8"; g.fillRect(x, 4 + t, 1, 20 - t); }
      for (var i = 0; i < 18; i++) { g.fillStyle = "#6b2b66"; g.fillRect((r() * 44) | 0, (14 + r() * 9) | 0, 1, 1); }
    });
    cv(function (g) { // DNA helix
      g.fillStyle = "#14232a"; g.fillRect(0, 0, 44, 24);
      for (var x = 0; x < 44; x++) { var a = Math.sin(x / 4) * 7; g.fillStyle = "#5fd3b3"; g.fillRect(x, (12 + a) | 0, 1, 2); g.fillStyle = "#f2b84b"; g.fillRect(x, (12 - a) | 0, 1, 2); if (x % 4 === 0) { g.fillStyle = "#56637a"; var y0 = Math.min(12 + a, 12 - a) + 2, y1 = Math.max(12 + a, 12 - a); g.fillRect(x, y0 | 0, 1, Math.max(0, (y1 - y0) | 0)); } }
    });
    cv(function (g) { // skin bacteria (rods and cocci)
      g.fillStyle = "#eef3f7"; g.fillRect(0, 0, 44, 24);
      for (var i = 0; i < 14; i++) { g.fillStyle = "#7b5bd2"; var x = r() * 40, y = r() * 21; if (i % 2) g.fillRect(x | 0, y | 0, 4, 2); else g.fillRect(x | 0, y | 0, 2, 2); }
    });
    cv(function (g) { // barrier function chart
      g.fillStyle = "#14232a"; g.fillRect(0, 0, 44, 24); g.fillStyle = "#2c464d"; g.fillRect(3, 21, 38, 1); g.fillRect(3, 3, 1, 18);
      var hs = [6, 9, 13, 16, 15, 18]; hs.forEach(function (h, i) { g.fillStyle = i < 3 ? "#9fd9c6" : "#5fd3b3"; g.fillRect(6 + i * 6, 21 - h, 4, h); });
    });
    return out;
  }

  // ---------- scene ----------
  function Scene(el, opts) {
    this.el = el; this.o = opts;
    this.hours = hoursPolicy(opts.hours);
    this.cv = document.createElement("canvas"); this.cv.className = "lsf-canvas";
    this.cv.setAttribute("role", "img");
    this.cv.setAttribute("aria-label", "Animated illustration of Labskin scientists fetching supplies from the store, working at the bench, meeting at a table and taking breaks, with today's weather outside the windows");
    this.tip = document.createElement("div"); this.tip.className = "lsf-tip"; this.tip.hidden = true;
    el.appendChild(this.cv); el.appendChild(this.tip);
    this.stage = document.createElement("canvas");
    this.g = this.stage.getContext("2d");
    this.output = this.cv.getContext("2d");
    this.people = []; this.agents = []; this.particles = []; this.clouds = [];
    this.weather = WMO(1); this.flash = 0; this.debugTime = null; this.timeScale = 1;
    this.doors = { store: 0, brk: 0 }; this.meetT = 20; this.meeting = null;
    this.reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.visible = true; this.stills = makeStills();
    this.openState = null; this.signChanged = -Infinity; this.createHotspots();
  }
  Scene.prototype.now = function () { return this.debugTime == null ? new Date() : new Date(this.debugTime); };
  Scene.prototype.isOpen = function (date) { return isOpen(date, this.hours, this.o.tz); };
  Scene.prototype.createHotspots = function () {
    var self = this, phone = String(this.o.phone).replace(/[^+\d]/g, "");
    this.phoneHotspot = document.createElement("div");
    this.phoneHotspot.className = "h-card lsf-hotspot lsf-phone"; this.phoneHotspot.hidden = true;
    var call = document.createElement("a"); call.className = "p-tel u-tel"; call.href = "tel:" + phone;
    var display = phone === "+447387001146" ? "+44 (0) 7387 001 146" : phone;
    call.setAttribute("aria-label", "Call Labskin on " + display);
    var organisation = document.createElement("span"); organisation.className = "p-name p-org lsf-sr"; organisation.textContent = "Labskin";
    var number = document.createElement("span"); number.className = "value lsf-sr"; number.textContent = phone;
    call.appendChild(organisation); call.appendChild(number); this.phoneHotspot.appendChild(call);
    var phoneLabel = document.createElement("span"); phoneLabel.className = "lsf-hotspot-label"; phoneLabel.textContent = "Call the lab: " + display; this.phoneHotspot.appendChild(phoneLabel);
    this.botHotspot = document.createElement("button"); this.botHotspot.type = "button";
    this.botHotspot.className = "lsf-hotspot lsf-assistant"; this.botHotspot.hidden = true;
    this.botHotspot.setAttribute("aria-label", "Ask the Labskin assistant");
    var botLabel = document.createElement("span"); botLabel.className = "lsf-hotspot-label"; botLabel.textContent = "The lab is closed. Ask our assistant."; this.botHotspot.appendChild(botLabel);
    this.botHotspot.addEventListener("click", function () { self.openAssistant(); });
    this.el.appendChild(this.phoneHotspot); this.el.appendChild(this.botHotspot);
  };
  Scene.prototype.openAssistant = function () {
    var self = this, hub = root.HubSpotConversations, widget = hub && hub.widget;
    function fallback() { root.location.assign(self.o.contact); }
    if (!widget || typeof widget.open !== "function") { fallback(); return; }
    if (!widget.status || widget.status().loaded) { widget.open(); return; }
    if (!widget.load || !hub.on) { fallback(); return; }
    this.botHotspot.disabled = true; this.botHotspot.setAttribute("aria-busy", "true");
    var timer, finished = false;
    function cleanup() { clearTimeout(timer); if (hub.off) hub.off("widgetLoaded", ready); self.botHotspot.disabled = false; self.botHotspot.removeAttribute("aria-busy"); }
    function ready() { if (finished) return; finished = true; cleanup(); widget.open(); }
    hub.on("widgetLoaded", ready);
    timer = setTimeout(function () { if (finished) return; finished = true; cleanup(); fallback(); }, 8000);
    try { widget.load(); if (widget.status().loaded) ready(); } catch (error) { finished = true; cleanup(); fallback(); }
  };
  Scene.prototype.placeHotspot = function (element, box) {
    var width = this.el.clientWidth, scaleX = width / this.rowWidth, floor = this.stacked && box.x + box.w / 2 >= this.rowWidth ? 1 : 0;
    var centreX = (box.x + box.w / 2 - floor * this.rowWidth) * scaleX;
    var centreY = (box.y + box.h / 2 + floor * (this.H + 8)) * this.o.scale;
    var sizeX = Math.max(44, box.w * scaleX), sizeY = Math.max(44, box.h * this.o.scale);
    element.style.width = sizeX + "px"; element.style.height = sizeY + "px";
    element.style.left = clamp(centreX - sizeX / 2, 0, width - sizeX) + "px";
    element.style.top = clamp(centreY - sizeY / 2, 0, this.outputHeight * this.o.scale - sizeY) + "px";
  };
  Scene.prototype.load = function () {
    var self = this, o = this.o;
    var atlasP = o.atlas && typeof o.atlas === "object" ? Promise.resolve(o.atlas) : fetch(o.atlasUrl).then(function (r) { return r.json(); });
    var img = function (src) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); };
    var logoP = o.logo ? img(o.logo).catch(function () { return null; }) : Promise.resolve(null);
    var botP = o.bot ? img(o.bot).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([atlasP, img(o.spritesUrl), logoP, botP]).then(function (r) {
      self.cell = r[0].cell || 32; self.people = r[0].people.slice(); self.sheet = r[1]; self.logo = r[2];
      self.bot = r[3];
      self.mirror = document.createElement("canvas"); self.mirror.width = self.sheet.width; self.mirror.height = self.sheet.height;
      var m = self.mirror.getContext("2d"); m.translate(self.sheet.width, 0); m.scale(-1, 1); m.drawImage(self.sheet, 0, 0);
    });
  };
  Scene.prototype.layout = function () {
    var o = this.o, w = this.el.clientWidth;
    if (!w || w === this.layoutWidth) return;
    this.layoutWidth = w;
    this.stacked = w < 700;
    this.rowWidth = Math.max(140, Math.ceil(w / o.scale));
    this.W = this.rowWidth * (this.stacked ? 2 : 1); this.H = o.height;
    this.outputHeight = this.stacked ? this.H * 2 + 8 : this.H;
    this.cv.width = this.rowWidth; this.cv.height = this.outputHeight;
    this.stage.width = this.W; this.stage.height = this.H;
    this.output.imageSmoothingEnabled = false;
    this.el.setAttribute("data-floors", this.stacked ? "2" : "1");
    this.cv.style.width = "100%"; this.cv.style.height = (this.outputHeight * o.scale) + "px";
    this.portal = this.stacked ? { start: this.rowWidth - 26, end: this.rowWidth + 26 } : null;
    var W = this.W, H = this.H, rnd = seeded(7);
    this.floorY = H - 1; this.feetY = H - 2;
    this.storeX = 4; this.breakX = W - 26;                       // door left edges, 22 wide
    this.glassX = Math.round(W * 2 / 3);                        // glass-brick partition
    this.benchX0 = this.storeX + 30; this.benchX1 = this.glassX - 10;
    this.benchTop = H - 16;
    // meeting area: a coffee nook against the glass wall, then the table centred before the break room door
    this.nook = { x: this.glassX + 12, w: 18 };
    var m0 = this.nook.x + this.nook.w + 8, m1 = this.breakX - 8, mc = Math.round((m0 + m1) / 2), tw = clamp(m1 - m0 - 16, 18, 46);
    this.table = { x: mc - Math.round(tw / 2), w: tw };
    this.seats = [this.table.x - 5, this.table.x + this.table.w + 5];
    if (tw >= 36) this.seats.splice(1, 0, this.table.x + 12, this.table.x + tw - 12);
    this.seats = this.seats.map(function (x) { return { x: x, busy: null }; });
    this.screen = { x: mc - 25, y: 6, w: 50, h: 30 };
    // wall clock: over the coffee nook when there's room beside the screen, otherwise over the glass wall
    var c0 = this.glassX + 10, c1 = this.screen.x - 2;
    this.clock = { x: c1 - c0 >= 25 ? Math.round((c0 + c1) / 2) - 10 : this.glassX - 5, y: 6, w: 21, h: 15 };
    // windows above the bench
    this.windows = []; var span = this.benchX1 - this.benchX0, n = Math.max(1, Math.floor(span / 110));
    for (var i = 0; i < n; i++) { var cx = this.benchX0 + (i + 0.5) * span / n; this.windows.push({ x: Math.round(cx - 18), y: 3, w: 36, h: 20 }); }
    // equipment along the bench; each item is a work station
    var kinds = ["hood", "scope", "rack", "pc", "incub", "centri", "rack", "hood", "scope", "pc"];
    this.equip = []; var x = this.benchX0 + 6, k = 0;
    while (x < this.benchX1 - 22) {
      var kind = kinds[k % kinds.length], w2 = { hood: 30, scope: 14, rack: 20, pc: 18, incub: 20, centri: 16 }[kind];
      if (this.portal && x + w2 > this.portal.start - 3 && x < this.portal.end + 3) x = this.portal.end + 3;
      if (x + w2 > this.benchX1 - 4) break;
      this.equip.push({ kind: kind, x: x, w: w2, station: Math.round(x + w2 / 2), busy: null, phase: rnd() * 6 });
      x += w2 + 14 + Math.round(rnd() * 12); k++;
    }
    this.maxPeople = Math.max(o.minOnScreen, Math.min(o.maxPeople, this.people.length, Math.floor(W / 50), this.equip.length + 1));
    this.maxOnScreen = Math.max(this.maxPeople, Math.min(o.maxOnScreen, this.maxPeople + 1));
    var computer = this.equip.find(function (equipment) { return equipment.kind === "pc"; });
    if (!computer) {
      var spare = this.equip[this.equip.length - 1];
      if (spare) this.botComputer = { kind: "pc", x: spare.x, w: 18, station: spare.station, phase: 0 };
    } else this.botComputer = computer;
    this.phoneArt = { x: this.table.x + 2, y: this.floorY - 20, w: 12, h: 9 };
    this.botArt = { x: (this.botComputer ? this.botComputer.station : this.benchX0 + 12) - 16, y: this.feetY - 30, w: 32, h: 32 };
    this.clouds = []; for (var c = 0; c < Math.ceil(W / 50); c++) this.clouds.push({ x: rnd() * W, y: 3 + rnd() * 12, s: 0.6 + rnd() * 0.8 });
    this.stars = []; for (var s2 = 0; s2 < W / 5; s2++) this.stars.push({ x: rnd() * W, y: rnd() * 22, t: rnd() * 6 });
    if (this.agents.length) this.reseed();
  };

  // ---------- staffing ----------
  Scene.prototype.targetCount = function (date) {
    if (!this.isOpen(date)) return 0;
    var ramp = clamp(this.minutesOpen(date) / Math.max(1, this.o.rampMinutes), 0, 1);
    return Math.round(this.o.minOnScreen + (this.maxPeople - this.o.minOnScreen) * ramp);
  };
  Scene.prototype.minutesOpen = function (date) { var p = londonParts(date, this.o.tz); return p.h * 60 + p.m + date.getSeconds() / 60 - this.hours.start; };
  Scene.prototype.minutesToClose = function (date) { var p = londonParts(date, this.o.tz); return this.hours.end - (p.h * 60 + p.m + date.getSeconds() / 60); };
  Scene.prototype.shiftEnd = function (date, fraction) {
    var s = this.o.shiftMinutes, minutes = s[0] + Math.random() * (s[1] - s[0]);
    return +date + minutes * (fraction == null ? 1 : fraction) * 60000;
  };
  // the next person on today's rota who isn't already in; the cursor walks the whole team so everyone gets a turn
  Scene.prototype.nextOnRota = function (date) {
    var rota = this.rota(date);
    for (var i = 0; i < rota.length; i++) {
      var person = rota[(this.rotaCursor + i) % rota.length];
      if (!this.agents.some(function (a) { return a.p === person; })) { this.rotaCursor = (this.rotaCursor + i + 1) % rota.length; return person; }
    }
    return null;
  };
  Scene.prototype.newAgent = function (person, date, extra) {
    var a = { p: person, x: this.doorX("brk"), dir: -1, t: 0, energy: 2 + Math.floor(Math.random() * 3), state: "idle", timer: 0.3, hidden: null, shiftEnd: this.shiftEnd(date) };
    if (extra) Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
    this.agents.push(a); return a;
  };
  Scene.prototype.syncBusiness = function (date) {
    var open = this.isOpen(date), self = this;
    if (open !== this.openState) {
      var previous = this.openState; this.openState = open; this.signChanged = performance.now();
      if (!open) this.agents.forEach(function (agent, index) { agent.closingDelay = 15 + index * 12; });
      else {
        this.agents.forEach(function (agent) { agent.leaving = false; agent.closingDelay = null; });
        if (previous === false) {
          while (this.agents.filter(function (agent) { return !agent.hidden; }).length < this.o.minOnScreen) {
            var person = this.nextOnRota(date);
            if (!person) break;
            this.newAgent(person, date, { x: this.doorX("brk") - this.agents.length * 8, energy: 3, timer: 0.5 });
            this.openDoor("brk");
          }
        }
      }
    }
    this.el.setAttribute("data-open", String(open));
    if (!open && this.reduced && this.agents.length) {
      this.agents.forEach(function (agent) { self.release(agent); });
      this.agents = []; this.meeting = null;
    }
    this.phoneHotspot.hidden = !open;
    this.botHotspot.hidden = open;
    return open;
  };
  Scene.prototype.rota = function (date) {
    var p = londonParts(date, this.o.tz);
    if (this._rotaDay === p.ymd) return this._rota;
    var r = seeded(+p.ymd), list = this.people.slice();
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = list[i]; list[i] = list[j]; list[j] = t; }
    this._rotaDay = p.ymd; this._rota = list; this.rotaCursor = 0; return list;
  };
  Scene.prototype.onScreen = function (except) { return this.agents.filter(function (a) { return a !== except && !a.hidden && !a.hiding; }).length; };
  Scene.prototype.canHide = function (a) { return !this.openState || this.onScreen(a) >= this.o.minOnScreen; };
  // one person on a break and one in the store at a time, so the bench never empties out
  Scene.prototype.away = function (where, except) { return this.agents.some(function (a) { return a !== except && (a.hidden === where || (a.state === "walk" && a.then === (where === "brk" ? "break" : where))); }); };
  Scene.prototype.freeStation = function (near) {
    var f = this.equip.filter(function (e) { return !e.busy; }); if (!f.length) return null;
    return near == null ? pick(f) : f.reduce(function (best, e) { return Math.abs(e.station - near) < Math.abs(best.station - near) ? e : best; });
  };
  Scene.prototype.release = function (a) { if (a.station) { a.station.busy = null; a.station = null; } if (a.seat) { a.seat.busy = null; a.seat = null; } };
  Scene.prototype.doorX = function (which) { return (which === "store" ? this.storeX : this.breakX) + 11; };

  // what to do next: store run, bench work, or a break
  Scene.prototype.decide = function (a) {
    var prev = a.station; this.release(a); a.waiting = false;
    if (!this.openState) {
      if (a.closingDelay > 0) { a.state = "idle"; a.timer = a.closingDelay; a.label = "Finishing for the day"; return; }
      a.leaving = true; return this.walkTo(a, this.doorX("brk"), "exit");
    }
    if (a.leaving && this.canHide(a)) { a.hiding = true; return this.walkTo(a, this.doorX("brk"), "exit"); }
    if (a.leaving) a.leaving = false;
    if (a.energy <= 0 && this.canHide(a) && !this.away("brk", a)) { a.hiding = true; return this.walkTo(a, this.doorX("brk"), "break"); }
    if (!a.carry && Math.random() < 0.3 && this.canHide(a) && !this.away("store", a)) { a.hiding = true; return this.walkTo(a, this.doorX("store"), "store"); }
    var st = this.freeStation();
    if (st) { st.busy = a; a.station = st; return this.walkTo(a, st.station, "work"); }
    a.state = "idle"; a.timer = 3 + Math.random() * 4; a.label = "Waiting for a free bench"; a.waiting = true;
  };
  Scene.prototype.walkTo = function (a, x, then) { a.tx = x; a.then = then; a.state = "walk"; a.label = { store: "Off to the store", work: "Heading to the bench", "break": "Going for a break", exit: "Heading home", meet: "Going to a meeting" }[then]; };
  Scene.prototype.arrive = function (a) {
    var self = this;
    switch (a.then) {
      case "work": a.state = "work"; a.timer = 30 + Math.random() * 30; a.label = this.workLabel(a.station); break;
      case "store": this.openDoor("store"); a.hidden = "store"; a.timer = 3 + Math.random() * 4; a.label = "In the store"; break;
      case "break": this.openDoor("brk"); a.hidden = "brk"; a.timer = 18 + Math.random() * 25; a.label = "On a break"; break;
      case "exit": this.openDoor("brk"); a.gone = true; break;
      case "meet": a.state = "meet"; a.label = "In a meeting"; break;
    }
    if (a.hidden) { a.state = "hidden"; a.hiding = false; }
    void self;
  };
  Scene.prototype.workLabel = function (e) {
    return { hood: "Working in the safety cabinet", scope: "At the microscope", rack: "Preparing samples", pc: "Analysing data", incub: "Checking the incubator", centri: "Running the centrifuge" }[e.kind];
  };
  Scene.prototype.openDoor = function (w) { this["open_" + w] = performance.now() + 1100; };
  Scene.prototype.emerge = function (a, from) {
    this.openDoor(from); a.hidden = null; a.x = this.doorX(from); a.state = "idle"; a.timer = 0.4;
    if (from === "store") { a.carry = pick(["#f2b84b", "#ff8a65", "#5fd3b3", "#9ec9e8", "#c9a15a"]); }
    if (from === "brk") a.energy = 3 + Math.floor(Math.random() * 3);
  };

  // ---------- simulation ----------
  Scene.prototype.step = function (dt, date) {
    var self = this, speed = 20;
    var open = this.syncBusiness(date);
    // staffing: arrivals come in from the break room (coats and lockers), leavers go out the same way
    // arrivals are spaced a few seconds apart and the lab never holds more than maxOnScreen, so a
    // replacement can walk in while the person they're relieving heads home
    var want = this.targetCount(date), present = this.agents.filter(function (a) { return !a.leaving; });
    this.arriveT = (this.arriveT || 0) - dt;
    if (present.length < want && this.agents.length < this.maxOnScreen && this.arriveT <= 0 && !this.agents.some(function (a) { return a.state === "walk" && Math.abs(a.x - self.doorX("brk")) < 14; })) {
      var next = this.nextOnRota(date);
      if (next) { this.newAgent(next, date); this.openDoor("brk"); this.arriveT = 3 + Math.random() * 4; }
    } else if (open && present.length > want) {
      var cand = present.filter(function (a) { return a.state !== "meet"; }).pop(); if (cand) { cand.leaving = true; if (cand.state !== "hidden") this.decide(cand); }
    } else if (open && present.length >= want && this.minutesOpen(date) > this.o.rampMinutes && this.minutesToClose(date) > 20 && !this.agents.some(function (a) { return a.leaving; })) {
      // shift change: one person at a time finishes their current task and goes home; the next on the rota replaces them
      var done = this.agents.find(function (a) { return a.shiftEnd <= +date && a.state !== "meet" && a.hidden !== "store"; });
      if (done) { done.leaving = true; if (done.state === "idle") done.timer = 0; }
    }
    // nobody stands around while a station is free
    if (open && this.equip.some(function (e) { return !e.busy; })) this.agents.forEach(function (a) { if (a.waiting && a.state === "idle") a.timer = 0; });
    // meetings behind the glass wall: two or three people, every so often, never emptying the bench
    this.meetT -= dt;
    if (open && !this.meeting && this.meetT <= 0) {
      var free = this.agents.filter(function (a) { return !a.hidden && !a.hiding && !a.leaving && (a.state === "work" || a.state === "idle"); });
      var n = Math.min(this.seats.length, free.length >= 3 && Math.random() < 0.5 ? 3 : 2);
      if (free.length >= 2 && present.length >= 4) {
        this.meeting = { left: 22 + Math.random() * 15, who: [] };
        for (var i = 0; i < n; i++) { var a = free.splice(Math.floor(Math.random() * free.length), 1)[0], s = this.seats.filter(function (z) { return !z.busy; })[0]; if (!a || !s) break; this.release(a); s.busy = a; a.seat = s; this.walkTo(a, s.x, "meet"); this.meeting.who.push(a); }
      } else this.meetT = 10;
    }
    if (this.meeting) {
      var allSeated = this.meeting.who.every(function (a) { return a.state === "meet"; });
      if (allSeated) this.meeting.left -= dt;
      if (this.meeting.left <= 0 || this.meeting.who.some(function (a) { return a.gone; })) {
        this.meeting.who.forEach(function (a) { if (!a.gone) self.decide(a); });
        this.meeting = null; this.meetT = 90 + Math.random() * 60;
      }
    }
    this.agents.forEach(function (a) {
      a.t += dt;
      if (!open && !a.leaving) {
        a.closingDelay = Math.max(0, (a.closingDelay || 0) - dt);
        if (!a.closingDelay && a.state === "meet") { self.release(a); a.state = "idle"; a.timer = 0; }
        if (!a.closingDelay && (a.state === "idle" || (a.state === "work" && a.timer <= dt))) a.leaving = true;
      }
      if (a.state === "hidden") {
        a.timer -= dt;
        if (a.timer <= 0) { if (a.leaving && a.hidden === "brk") { a.gone = true; return; } self.emerge(a, a.hidden); }
        return;
      }
      if (a.state === "walk") {
        var d = a.tx - a.x; a.dir = d >= 0 ? 1 : -1;
        if (self.portal) {
          var nextX = a.x + a.dir * Math.min(Math.abs(d), speed * dt);
          if (a.x <= self.portal.start && nextX > self.portal.start && a.tx >= self.portal.end) {
            a.x = self.portal.end; self.open_pass = performance.now() + 1100; return;
          }
          if (a.x >= self.portal.end && nextX < self.portal.end && a.tx <= self.portal.start) {
            a.x = self.portal.start; self.open_pass = performance.now() + 1100; return;
          }
        }
        if (Math.abs(d) <= speed * dt) { a.x = a.tx; self.arrive(a); } else a.x += a.dir * speed * dt;
        if (Math.abs(a.x - self.doorX("store")) < 16 && a.then === "store") self.openDoor("store");
        if (Math.abs(a.x - self.doorX("brk")) < 16 && (a.then === "break" || a.then === "exit")) self.openDoor("brk");
        return;
      }
      if (a.state === "work") { a.timer -= dt; if (a.timer <= 0) { a.energy -= 1; if (Math.random() < 0.6) a.carry = null; self.decide(a); } return; }
      if (a.state === "idle") { a.timer -= dt; if (a.timer <= 0) self.decide(a); }
    });
    this.agents = this.agents.filter(function (a) { if (a.gone) self.release(a); return !a.gone; });
    var t = performance.now();
    this.doors.store = clamp(this.doors.store + (t < (this.open_store || 0) ? 4 : -2.5) * dt, 0, 1);
    this.doors.brk = clamp(this.doors.brk + (t < (this.open_brk || 0) ? 4 : -2.5) * dt, 0, 1);
    // weather
    var w = this.weather, W = this.W, wind = (w.wind || 10) / 10;
    this.clouds.forEach(function (c) { c.x += (2 + wind * 3) * dt * c.s; if (c.x > W + 30) c.x = -30; });
    if (w.precip && !this.reduced) {
      var wantP = Math.round(W * 0.3 * w.precip);
      while (this.particles.length < wantP) this.particles.push({ x: Math.random() * W, y: Math.random() * 26, v: w.kind === "snow" ? 6 + Math.random() * 6 : 60 + Math.random() * 30 });
      this.particles.length = Math.min(this.particles.length, wantP);
      this.particles.forEach(function (p) { p.y += p.v * dt; p.x += (w.kind === "snow" ? Math.sin(p.y / 5) * 4 + wind * 3 : wind * 8) * dt; if (p.y > 26) { p.y = -2; p.x = Math.random() * W; } if (p.x > W) p.x -= W; });
    } else this.particles.length = 0;
    if (w.kind === "thunder" && !this.reduced && Math.random() < dt / 9) this.flash = 1;
    this.flash = Math.max(0, this.flash - dt * 2.5);
  };

  // ---------- drawing ----------
  Scene.prototype.draw = function (date, tms) {
    var g = this.g, W = this.W, H = this.H, o = this.o, w = this.weather, self = this;
    var open = this.syncBusiness(date);
    g.clearRect(0, 0, W, H);
    var s = sun(date, o.lat, o.lon), alt = s.alt, day = clamp((alt + 6) / 14, 0, 1), dusk = clamp(1 - Math.abs(alt - 1) / 7, 0, 1), grey = w.cloud || 0;
    // --- windows: the sky is one continuous painting seen through each pane
    g.save(); g.beginPath(); this.windows.forEach(function (wi) { g.rect(wi.x, wi.y, wi.w, wi.h); }); g.clip();
    var top = mix(mix("#0b1430", "#4c9bd6", day), "#8e98a3", grey * 0.7 * day), bot = mix(mix("#1c2a52", "#bfe3f5", day), "#c4c9ce", grey * 0.7 * day);
    bot = mix(bot, "#f0a26a", dusk * (1 - grey) * 0.85);
    var gr = g.createLinearGradient(0, 0, 0, 26); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, 26);
    if (day < 0.5 && grey < 0.7) { g.fillStyle = "rgba(255,255,255," + (0.8 * (1 - day * 2) * (1 - grey)) + ")"; this.stars.forEach(function (st) { if (Math.sin(tms / 700 + st.t) > -0.6) g.fillRect(st.x | 0, st.y | 0, 1, 1); }); }
    var bx = W * (0.5 + s.ha / 240);
    if (alt > -4) { var sy = 22 - clamp(alt, -4, 45) * 0.42; g.globalAlpha = 1 - grey * 0.8; g.fillStyle = mix("#ffd27a", "#fff3c4", clamp(alt / 30, 0, 1)); g.fillRect((bx | 0) - 3, (sy | 0) - 3, 7, 7); g.fillRect((bx | 0) - 4, (sy | 0) - 2, 9, 5); g.globalAlpha = 1; }
    else {
      var phase = moonPhase(date), moonX = this.windows[0] ? this.windows[0].x + 24 : W / 3;
      g.globalAlpha = 1 - grey * 0.7;
      for (var moonY = -4; moonY <= 4; moonY++) for (var moonPixel = -4; moonPixel <= 4; moonPixel++) {
        if (moonPixel * moonPixel + moonY * moonY > 16) continue;
        var edge = Math.sqrt(Math.max(0, 16 - moonY * moonY)), terminator = Math.cos(phase * Math.PI * 2) * edge;
        var lit = phase <= 0.5 ? moonPixel >= terminator : moonPixel <= -terminator;
        g.fillStyle = lit ? "#f2f0e2" : "#26344f"; g.fillRect(Math.round(moonX) + moonPixel, 8 + moonY, 1, 1);
      }
      g.globalAlpha = 1;
    }
    var cc = Math.round(this.clouds.length * grey);
    for (var i = 0; i < cc; i++) { var c = this.clouds[i], cx = c.x | 0, cy = c.y | 0, sc = c.s; g.fillStyle = mix(mix("#3a4560", "#ffffff", day), "#9aa3ab", grey * 0.6); g.fillRect(cx, cy, 22 * sc | 0, 4); g.fillRect(cx + 4, cy - 2, 12 * sc | 0, 3); }
    if (this.particles.length) { g.fillStyle = w.kind === "snow" ? "rgba(255,255,255,.9)" : "rgba(200,220,240,.75)"; this.particles.forEach(function (p) { g.fillRect(p.x | 0, p.y | 0, 1, w.kind === "snow" ? 1 : 3); }); }
    g.fillStyle = mix("#1d3a2c", "#6f9a6a", day * (1 - grey * 0.4)); for (var hx = 0; hx < W; hx += 2) { var hy = 18 + Math.round(Math.sin(hx / 23) * 1.5 + Math.sin(hx / 61) * 2); g.fillRect(hx, hy, 2, 26 - hy); }
    if (w.kind === "fog") { g.fillStyle = "rgba(220,224,228,.55)"; g.fillRect(0, 0, W, 26); }
    if (this.flash > 0) { g.fillStyle = "rgba(255,255,255," + (this.flash * 0.8) + ")"; g.fillRect(0, 0, W, 26); }
    g.restore();
    this.windows.forEach(function (wi) {
      g.fillStyle = "#cfd8db"; g.fillRect(wi.x - 1, wi.y - 1, wi.w + 2, 1); g.fillRect(wi.x - 1, wi.y + wi.h, wi.w + 2, 2); g.fillRect(wi.x - 1, wi.y, 1, wi.h); g.fillRect(wi.x + wi.w, wi.y, 1, wi.h); g.fillRect(wi.x + wi.w / 2, wi.y, 1, wi.h);
      if (w.kind === "snow") { g.fillStyle = "#ffffff"; g.fillRect(wi.x, wi.y + wi.h - 1, wi.w, 1); }
    });
    // --- doors with signs
    this.drawDoor(this.storeX, "STORE", this.doors.store, "store");
    this.drawDoor(this.breakX, "BREAK ROOM", this.doors.brk, "brk");
    if (this.portal) {
      var passageOpen = performance.now() < (this.open_pass || 0) ? 1 : 0;
      this.drawDoor(this.portal.start + 2, "LAB", passageOpen, "brk");
      this.drawDoor(this.portal.end - 24, "LAB", passageOpen, "brk");
    }
    // --- wall screen in the meeting area: wordmark, then scrolling science stills
    this.drawScreen(tms);
    // --- glass-brick partition
    var gx = this.glassX, gy = 24;
    g.fillStyle = "rgba(170,215,230,.16)"; g.fillRect(gx, gy, 10, this.floorY - gy);
    g.fillStyle = "rgba(220,240,248,.35)";
    for (var yy = gy; yy < this.floorY; yy += 5) g.fillRect(gx, yy, 10, 1);
    for (var yy2 = gy; yy2 < this.floorY; yy2 += 5) { g.fillRect(gx + (((yy2 - gy) / 5) & 1 ? 2 : 5), yy2, 1, 5); }
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(gx, gy, 10, 1); g.fillRect(gx + 1, gy + 1, 1, this.floorY - gy - 1);
    // --- bench
    var b0 = this.benchX0, b1 = this.benchX1, bt = this.benchTop;
    var benchSpans = this.portal ? [[b0, Math.min(b1, this.portal.start - 3)], [Math.max(b0, this.portal.end + 3), b1]] : [[b0, b1]];
    benchSpans.forEach(function (span) {
      if (span[1] <= span[0]) return;
      g.fillStyle = "#e9ecee"; g.fillRect(span[0], bt, span[1] - span[0], 2); g.fillStyle = "#7f8f99"; g.fillRect(span[0], bt + 2, span[1] - span[0], self.floorY - bt - 2);
      for (var cx2 = span[0] + 3; cx2 < span[1] - 12; cx2 += 14) { g.fillStyle = "#93a3ad"; g.fillRect(cx2, bt + 4, 12, self.floorY - bt - 6); g.fillStyle = "#6c7c86"; g.fillRect(cx2 + 5, bt + 7, 2, 1); }
    });
    var lights = true;
    this.equip.forEach(function (e) { self.drawEquip(e, tms, lights); });
    // --- wall clock and coffee nook
    this.drawClock(date);
    var brewing = open && this.agents.some(function (a) { return a.state === "walk" && a.then === "meet"; });
    this.drawCoffee(tms, brewing);
    // --- meeting table and chairs (chair backs behind people, table in front)
    var tb = this.table, ty = this.floorY - 13;
    this.seats.forEach(function (z) { g.fillStyle = "#56637a"; g.fillRect(z.x - 4, ty - 6, 8, 2); g.fillRect(z.x - 4, ty - 6, 1, 12); g.fillRect(z.x + 3, ty - 6, 1, 12); });
    // --- people
    var cs = this.cell;
    var vis = this.agents.filter(function (a) { return !a.hidden; }).sort(function (a, b) { return (a.state === "walk") - (b.state === "walk"); });
    vis.forEach(function (a) {
      var col, flip = false, oy = 0;
      if (a.state === "work") col = 4 + (Math.floor(tms / 380 + a.p.row) & 1);
      else if (a.state === "meet") { col = 6; oy = 4; }
      else if (a.state === "idle") col = 6;
      else { col = Math.floor(a.t * 7) % 4; flip = a.dir < 0; }
      if (self.reduced) col = a.state === "work" ? 4 : a.state === "walk" ? 0 : 6;
      var sx = col * cs, sy = a.p.row * cs, X = Math.round(a.x - cs / 2), Y = self.feetY - cs + 2 + oy;
      if (flip) g.drawImage(self.mirror, self.mirror.width - sx - cs, sy, cs, cs, X, Y, cs, cs);
      else g.drawImage(self.sheet, sx, sy, cs, cs, X, Y, cs, cs);
      if (a.carry && a.state === "walk") { // a glass flask of reagent from the store (coffee stays in the meeting room)
        var hx2 = flip ? X + 12 : X + 16; g.fillStyle = "#4f7f92";
        g.fillRect(hx2 + 1, Y + 18, 3, 1); g.fillRect(hx2 + 2, Y + 19, 1, 2); g.fillRect(hx2 + 1, Y + 21, 1, 1); g.fillRect(hx2 + 3, Y + 21, 1, 1);
        g.fillRect(hx2, Y + 22, 1, 2); g.fillRect(hx2 + 4, Y + 22, 1, 2); g.fillRect(hx2, Y + 24, 5, 1);
        g.fillStyle = a.carry; g.fillRect(hx2 + 2, Y + 21, 1, 1); g.fillRect(hx2 + 1, Y + 22, 3, 2);
      }
      a.box = [X + 8, Y, 16, cs - oy];
      if (self.stacked && a.x >= self.rowWidth) { a.box[0] -= self.rowWidth; a.box[1] += self.H + 8; }
    });
    // table top and seat fronts in front of seated people
    g.fillStyle = "#c49a6c"; g.fillRect(tb.x, ty, tb.w, 2); g.fillStyle = "#8a6a48"; g.fillRect(tb.x + 2, ty + 2, 2, this.floorY - ty - 2); g.fillRect(tb.x + tb.w - 4, ty + 2, 2, this.floorY - ty - 2);
    if (this.meeting) { g.fillStyle = "#fbfaf6"; g.fillRect(tb.x + 6, ty - 1, 4, 1); if (tb.w >= 40) { g.fillStyle = "#2a3440"; g.fillRect(tb.x + tb.w - 12, ty - 3, 6, 3); } }
    this.drawCups(tms, ty);
    this.seats.forEach(function (z) { g.fillStyle = "#3c4c53"; g.fillRect(z.x - 4, ty + 3, 8, 2); g.fillRect(z.x - 3, ty + 5, 1, self.floorY - ty - 5); g.fillRect(z.x + 2, ty + 5, 1, self.floorY - ty - 5); });
    // --- one-pixel floor line
    g.fillStyle = "#4d6670"; g.fillRect(0, this.floorY, W, 1);
    if (!open) {
      g.fillStyle = "rgba(3,10,16,.56)"; g.fillRect(0, 26, W, H - 26);
      g.fillStyle = "#ff3b3b"; g.fillRect(this.nook.x + 13, this.floorY - 24, 1, 1); // coffee machine standby
      this.equip.forEach(function (equipment) {
        if (equipment.kind === "pc") { g.fillStyle = "#ff3b3b"; g.fillRect(equipment.x + 13, self.benchTop - 5, 1, 1); }
        if (equipment.kind === "incub" || equipment.kind === "centri") { g.fillStyle = "#5fd3b3"; g.fillRect(equipment.x + equipment.w - 5, self.benchTop - 6, 1, 1); }
      });
      if (this.botComputer) {
        this.drawEquip(this.botComputer, tms, true);
        var idle = this.reduced ? 0 : Math.floor(tms / 900) % 2;
        if (this.bot) {
          g.drawImage(this.bot, this.botArt.x, this.botArt.y - idle, 32, 32);
          g.fillStyle = this.reduced || Math.floor(tms / 1000) % 2 === 0 ? "#77d22d" : "#315b22";
          g.fillRect(this.botArt.x + 18, this.botArt.y + 2 - idle, 1, 1);
        }
      }
    } else {
      var phone = this.phoneArt;
      PHONE.forEach(function (row, py) { for (var px = 0; px < row.length; px++) { var c = PHONE_COLOURS[row[px]]; if (c) { g.fillStyle = c; g.fillRect(phone.x + px, phone.y + py, 1, 1); } } });
    }
    var sign = open ? "OPEN" : "CLOSED", signWidth = sign.length * 4 + 3;
    var signX = clamp(this.breakX + 11 - signWidth / 2, this.stacked ? this.rowWidth + 1 : 1, W - signWidth - 1);
    var swing = !this.reduced && performance.now() - this.signChanged < 250 ? 1 : 0;
    g.fillStyle = open ? "#2f8f6f" : "#a53b42"; g.fillRect(Math.round(signX), this.floorY - 31 + swing, signWidth, 7);
    text(g, sign, Math.round(signX) + 2, this.floorY - 30 + swing, "#ecfbf6");
    this.el.setAttribute("data-sign", sign);
    this.el.setAttribute("data-moon-phase", moonPhase(date).toFixed(3));
    this.el.setAttribute("data-lights", open ? "on" : "standby");
    this.placeHotspot(this.phoneHotspot, this.phoneArt); this.placeHotspot(this.botHotspot, this.botArt);
    this.output.clearRect(0, 0, this.rowWidth, this.outputHeight);
    this.output.drawImage(this.stage, 0, 0, this.rowWidth, H, 0, 0, this.rowWidth, H);
    if (this.stacked) this.output.drawImage(this.stage, this.rowWidth, 0, this.rowWidth, H, 0, H + 8, this.rowWidth, H);
  };
  Scene.prototype.drawDoor = function (x, label, open, which) {
    var g = this.g, y0 = this.floorY - 36, h = 36, w = 22;
    // what is behind the door when it opens
    g.fillStyle = which === "store" ? "#22303a" : "#3a2f26"; g.fillRect(x + 2, y0 + 2, w - 4, h - 2);
    if (which === "store") { g.fillStyle = "#56637a"; g.fillRect(x + 3, y0 + 10, w - 6, 1); g.fillRect(x + 3, y0 + 20, w - 6, 1); ["#f2b84b", "#5fd3b3", "#ff8a65", "#9ec9e8"].forEach(function (c, i) { g.fillStyle = c; g.fillRect(x + 4 + i * 4, y0 + 7, 2, 3); g.fillRect(x + 5 + i * 4, y0 + 17, 2, 3); }); }
    else { g.fillStyle = "#f2b84b"; g.fillRect(x + 6, y0 + 8, 8, 1); g.fillStyle = "#c9a15a"; g.fillRect(x + 4, y0 + 22, 12, 2); g.fillStyle = "#e9e6df"; g.fillRect(x + 8, y0 + 19, 3, 3); }
    // frame
    g.fillStyle = "#8a9aa1"; g.fillRect(x, y0, w, 2); g.fillRect(x, y0, 2, h); g.fillRect(x + w - 2, y0, 2, h);
    // panel swings open towards the viewer (narrows)
    var pw = Math.round((w - 4) * (1 - open));
    if (pw > 0) { g.fillStyle = "#7d9099"; g.fillRect(x + 2, y0 + 2, pw, h - 2); g.fillStyle = "#93a6ae"; g.fillRect(x + 4, y0 + 5, Math.max(0, pw - 4), 10); g.fillStyle = "#2b3a40"; g.fillRect(x + 2 + pw - 3, y0 + 18, 2, 3); }
    // sign
    var tw = label.length * 4 - 1, sx = clamp(Math.round(x + w / 2 - tw / 2) - 2, 1, this.W - tw - 5);
    g.fillStyle = which === "store" ? "#2f6f8f" : "#2f8f6f"; g.fillRect(sx, y0 - 9, tw + 4, 7);
    text(g, label, sx + 2, y0 - 8, "#ecfbf6");
  };
  Scene.prototype.drawScreen = function (tms) {
    var g = this.g, sc = this.screen, x = sc.x, y = sc.y, w = sc.w, h = sc.h;
    g.fillStyle = "#1a2328"; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = "#2b3a40"; g.fillRect(x + w / 2 - 1, y + h + 2, 2, 3);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (!this.openState) { g.fillStyle = "#071014"; g.fillRect(x, y, w, h); g.fillStyle = "#ff3b3b"; g.fillRect(x + w - 2, y + h - 2, 1, 1); g.restore(); return; }
    var slides = 1 + this.stills.length, period = 6000, t = this.reduced ? 0 : tms % (period * slides);
    var idx = Math.floor(t / period), within = t % period, slide = within > period - 600 ? (within - (period - 600)) / 600 : 0;
    var self = this;
    function drawSlide(k, ox) {
      if (k % slides === 0) {
        g.fillStyle = "#0f1a1c"; g.fillRect(x + ox, y, w, h);
        if (self.logo) { var lw = Math.min(w - 6, self.logo.width), lh = Math.round(self.logo.height * lw / self.logo.width); g.drawImage(self.logo, x + ox + Math.round((w - lw) / 2), y + Math.round((h - lh) / 2), lw, lh); }
        else { var tw = text(g, "LABSKIN", 0, -100, "#000"); text(g, "LABSKIN", x + ox + Math.round((w - tw) / 2), y + 10, "#5fd3b3"); g.fillStyle = "#f2b84b"; g.fillRect(x + ox + Math.round((w - tw) / 2), y + 17, tw, 1); }
      } else { var st = self.stills[(k % slides) - 1]; g.drawImage(st, x + ox + 3, y + 3, w - 6, h - 6); g.fillStyle = "#0f1a1c"; g.fillRect(x + ox, y, w, 3); g.fillRect(x + ox, y + h - 3, w, 3); g.fillRect(x + ox, y, 3, h); g.fillRect(x + ox + w - 3, y, 3, h); }
    }
    var off = Math.round(slide * w);
    drawSlide(idx, -off); if (slide > 0) drawSlide(idx + 1, w - off);
    g.restore();
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(x, y, w, 1);
  };
  // digital wall clock: HH:MM with a blinking colon, BST or GMT beneath
  Scene.prototype.drawClock = function (date) {
    var g = this.g, c = this.clock, key = Math.floor(+date / 60000);
    if (this._clockKey !== key) { this._clockKey = key; this._clock = clockText(date, this.o.tz); }
    var r = this._clock, lit = this.openState ? "#5fd3b3" : "#2f8f6f";
    g.fillStyle = "#2b3a40"; g.fillRect(c.x, c.y, c.w, c.h);
    g.fillStyle = "#0f1a1c"; g.fillRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    g.fillStyle = "#56637a"; g.fillRect(c.x + 10, c.y - 2, 1, 2); // hanging hook
    text(g, r.time.slice(0, 2), c.x + 2, c.y + 2, lit);
    text(g, r.time.slice(3), c.x + 12, c.y + 2, lit);
    if (this.reduced || Math.floor(+date / 1000) % 2 === 0) { g.fillStyle = lit; g.fillRect(c.x + 10, c.y + 3, 1, 1); g.fillRect(c.x + 10, c.y + 5, 1, 1); }
    var zw = r.zone.length * 4 - 1;
    if (zw > 0) text(g, r.zone, c.x + Math.round((c.w - zw) / 2), c.y + 8, "#9fb3bb");
    this.el.setAttribute("data-clock", r.time + " " + r.zone);
  };
  // espresso machine on a side table; it brews while people head to a meeting
  Scene.prototype.drawCoffee = function (tms, brewing) {
    var g = this.g, n = this.nook, x = n.x, fy = this.floorY, top = fy - 12, mx = x + 1, by = top;
    // side table with a bag of beans on the shelf
    g.fillStyle = "#c49a6c"; g.fillRect(x, top, n.w, 2);
    g.fillStyle = "#8a6a48"; g.fillRect(x + 1, top + 2, 2, fy - top - 2); g.fillRect(x + n.w - 3, top + 2, 2, fy - top - 2); g.fillRect(x + 1, fy - 3, n.w - 2, 1);
    g.fillStyle = "#7a5230"; g.fillRect(x + 6, fy - 8, 5, 5); g.fillStyle = "#f2b84b"; g.fillRect(x + 7, fy - 6, 3, 1);
    // cup warmer on top with two espresso cups
    g.fillStyle = "#93a3ad"; g.fillRect(mx, by - 14, 16, 1);
    g.fillStyle = "#f3efe6"; g.fillRect(mx + 3, by - 16, 2, 2); g.fillRect(mx + 7, by - 16, 2, 2);
    // brushed steel body with teal side panels
    g.fillStyle = "#e3e7ea"; g.fillRect(mx, by - 13, 16, 7);
    g.fillStyle = "#f6f9fa"; g.fillRect(mx + 3, by - 13, 1, 7);
    g.fillStyle = "#2f8f6f"; g.fillRect(mx, by - 13, 2, 7); g.fillRect(mx + 14, by - 13, 2, 7);
    g.fillStyle = "#5fd3b3"; g.fillRect(mx, by - 13, 2, 1); g.fillRect(mx + 14, by - 13, 2, 1);
    // pressure gauge, its needle lifts while brewing
    g.fillStyle = "#fbfaf6"; g.fillRect(mx + 7, by - 12, 3, 3); g.fillStyle = "#ff3b3b"; g.fillRect(brewing ? mx + 9 : mx + 7, by - 11, 1, 1);
    // two group heads with portafilters and handles
    g.fillStyle = "#56637a"; g.fillRect(mx + 3, by - 6, 3, 1); g.fillRect(mx + 10, by - 6, 3, 1);
    g.fillStyle = "#2b3a40"; g.fillRect(mx + 2, by - 5, 5, 1); g.fillRect(mx + 9, by - 5, 5, 1);
    g.fillStyle = "#1e2a2e"; g.fillRect(mx - 1, by - 5, 3, 1); g.fillRect(mx + 14, by - 5, 3, 1);
    // steam wand
    g.fillStyle = "#cfd8db"; g.fillRect(mx + 16, by - 12, 1, 1); g.fillRect(mx + 17, by - 11, 1, 7);
    // drip tray with grille
    g.fillStyle = "#7f8f99"; g.fillRect(mx, by - 2, 16, 2);
    g.fillStyle = "#56637a"; for (var i = 1; i < 16; i += 2) g.fillRect(mx + i, by - 2, 1, 1);
    // power light
    g.fillStyle = this.openState ? (brewing && Math.floor(tms / 250) % 2 ? "#f2b84b" : "#5fd3b3") : "#ff3b3b"; g.fillRect(mx + 12, by - 12, 1, 1);
    if (brewing) {
      g.fillStyle = "#f3efe6"; g.fillRect(mx + 3, by - 3, 3, 1); g.fillRect(mx + 3, by - 4, 1, 1); g.fillRect(mx + 5, by - 4, 1, 1); g.fillRect(mx + 6, by - 4, 1, 1); // cup on the tray
      if (!this.reduced && Math.floor(tms / 150) % 2) { g.fillStyle = "#5a3a22"; g.fillRect(mx + 4, by - 4, 1, 1); }
      this.drawSteam(mx + 17, by - 4, tms, 0.5, 3);
    }
  };
  // a few pixels of steam drifting up from (x, y); each wisp rises, sways and fades
  Scene.prototype.drawSteam = function (x, y, tms, strength, height) {
    var g = this.g, h = height || 6;
    if (this.reduced) { g.fillStyle = "rgba(255,255,255," + (0.45 * strength) + ")"; g.fillRect(x, y - 2, 1, 1); g.fillRect(x + 1, y - 4, 1, 1); return; }
    for (var k = 0; k < 4; k++) {
      var life = ((tms / 1100 + k / 4 + x * 0.13) % 1), rise = Math.floor(life * h);
      g.fillStyle = "rgba(236,246,250," + (0.95 * strength * (1 - life * 0.8)).toFixed(3) + ")";
      g.fillRect(x + Math.round(Math.sin(life * 6.3 + x) * 0.9), y - 1 - rise, 1, 1);
    }
  };
  // a mug in front of everyone seated at the table, steaming
  Scene.prototype.drawCups = function (tms, ty) {
    var g = this.g, tb = this.table, seats = this.seats, self = this;
    var lo = tb.x + 15, hi = tb.x + tb.w - (tb.w >= 40 ? 17 : 5); if (hi < lo) { lo = tb.x + 2; hi = tb.x + tb.w - 6; } // clear of the phone and laptop
    var mugs = ["#f3efe6", "#5fd3b3", "#f2b84b", "#ff8a65", "#9ec9e8"];
    seats.forEach(function (z, i) {
      var a = z.busy; if (!a || a.state !== "meet") return;
      var cx = seats.length > 1 ? Math.round(lo + (hi - lo) * i / (seats.length - 1)) : Math.round((lo + hi) / 2);
      g.fillStyle = mugs[a.p.row % mugs.length]; g.fillRect(cx, ty - 3, 3, 3); g.fillRect(cx + 3, ty - 2, 1, 1);
      g.fillStyle = "#5a3a22"; g.fillRect(cx, ty - 3, 3, 1);
      self.drawSteam(cx + 1, ty - 3, tms, 1, 6);
    });
  };
  Scene.prototype.drawEquip = function (e, tms, lights) {
    var g = this.g, x = e.x, y = this.benchTop, k = e.kind, on = Math.sin(tms / 400 + e.phase) > 0;
    if (k === "hood") { g.fillStyle = "#d9e0e4"; g.fillRect(x, y - 26, e.w, 26); g.fillStyle = "#b9c6cc"; g.fillRect(x, y - 26, e.w, 4); g.fillStyle = "rgba(150,205,235,.7)"; g.fillRect(x + 3, y - 19, e.w - 6, 15); g.fillStyle = "#f2b84b"; g.fillRect(x + e.w - 6, y - 25, 2, 2); if (e.busy) { g.fillStyle = "#ff8a65"; g.fillRect(x + 9, y - 7, 2, 4); g.fillStyle = "#5fd3b3"; g.fillRect(x + 15, y - 6, 3, 3); } }
    if (k === "scope") { g.fillStyle = "#cfd8db"; g.fillRect(x + 4, y - 4, 8, 4); g.fillRect(x + 7, y - 15, 3, 11); g.fillRect(x + 5, y - 17, 6, 3); g.fillStyle = "#93a3ad"; g.fillRect(x + 2, y - 9, 6, 2); }
    if (k === "rack") { var cols = ["#f2b84b", "#ff8a65", "#5fd3b3", "#9ec9e8"]; g.fillStyle = "#b9c6cc"; g.fillRect(x, y - 3, e.w, 3); for (var i = 0; i < e.w / 4; i++) { g.fillStyle = cols[(i + (x | 0)) % 4]; g.fillRect(x + 1 + i * 4, y - 9, 2, 6); } }
    if (k === "pc") { g.fillStyle = "#cfd8db"; g.fillRect(x + 2, y - 15, 14, 11); g.fillRect(x + 8, y - 4, 2, 4); g.fillStyle = this.openState ? (e.busy ? (on ? "#7fc8e8" : "#9fd9c6") : "#24323a") : (e === this.botComputer ? "#5fd3b3" : "#071014"); g.fillRect(x + 3, y - 14, 12, 8); if (!this.openState) { g.fillStyle = e === this.botComputer ? "#5fd3b3" : "#ff3b3b"; g.fillRect(x + 13, y - 5, 1, 1); } }
    if (k === "incub") { g.fillStyle = "#cfd6db"; g.fillRect(x, y - 22, e.w, 22); g.fillStyle = "#9aa7b0"; g.fillRect(x + 2, y - 19, e.w - 4, 16); g.fillStyle = "#5fd3b3"; g.fillRect(x + e.w - 6, y - 21, 3, 1); g.fillStyle = "#f2b84b"; g.fillRect(x + 4, y - 21, 5, 1); }
    if (k === "centri") { g.fillStyle = "#e3e7ea"; g.fillRect(x, y - 9, e.w, 9); g.fillStyle = "#56637a"; g.fillRect(x + 2, y - 11, e.w - 4, 2); if (e.busy && on) { g.fillStyle = "#5fd3b3"; g.fillRect(x + e.w - 4, y - 6, 2, 2); } }
    void lights;
  };

  // ---------- weather ----------
  Scene.prototype.fetchWeather = function () {
    var self = this, o = this.o, key = "lsf-weather-" + o.lat + "," + o.lon;
    if (o.weather === "off") return;
    try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < o.cacheMinutes * 60000) { self.applyWeather(c.d); return; } } catch (e) {}
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + o.lat + "&longitude=" + o.lon + "&current=weather_code,cloud_cover,precipitation,wind_speed_10m&timezone=" + encodeURIComponent(o.tz);
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var d = { code: j.current.weather_code, cloud: j.current.cloud_cover / 100, wind: j.current.wind_speed_10m };
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
      self.applyWeather(d);
    }).catch(function () { /* keep the default sky */ });
  };
  Scene.prototype.applyWeather = function (d) {
    var w = WMO(d.code); if (d.cloud != null && w.kind !== "fog") w.cloud = Math.max(w.cloud, d.cloud * 0.9);
    w.wind = d.wind || 10; this.weather = w; this.particles.length = 0; this.el.setAttribute("data-weather", w.kind);
  };

  // place people straight into the scene (on load, or after a preview time jump)
  Scene.prototype.reseed = function () {
    var self = this, date0 = this.now(), want = this.targetCount(date0), rota = this.rota(date0);
    this.equip.forEach(function (e) { e.busy = null; }); this.seats.forEach(function (z) { z.busy = null; }); this.agents = []; this.meeting = null; this.meetT = 20; this.arriveT = 0;
    // a later page load meets the shift that would be in by now, not the first few names on the rota
    var shift = (this.o.shiftMinutes[0] + this.o.shiftMinutes[1]) / 2, rotated = Math.max(0, this.minutesOpen(date0) - this.o.rampMinutes) / shift * this.maxPeople;
    this.rotaCursor = rota.length ? Math.floor(rotated) % rota.length : 0;
    for (var i = 0; i < want; i++) {
      var person = this.nextOnRota(date0); if (!person) break;
      var a = { p: person, x: 0, dir: 1, t: Math.random() * 3, energy: 1 + Math.floor(Math.random() * 3), state: "idle", timer: 0, hidden: null, shiftEnd: this.shiftEnd(date0, Math.random()) };
      var st = this.freeStation(), away = i >= 2 && Math.random() < 0.25 ? (Math.random() < 0.5 ? "store" : "brk") : null;
      if (away && !this.away(away)) { a.hidden = away; a.state = "hidden"; a.timer = 2 + Math.random() * 10; }
      else if (st) { st.busy = a; a.station = st; a.x = st.station; a.state = "work"; a.timer = 2 + Math.random() * 20; a.label = self.workLabel(st); }
      else { a.x = this.glassX + 20 + i * 4; a.timer = 1; }
      this.agents.push(a);
    }
    this.syncBusiness(date0);
  };

  // ---------- loop ----------
  Scene.prototype.start = function () {
    var self = this, last = performance.now();
    this.layout(); this.fetchWeather(); this.reseed();
    function tick(t) {
      self.raf = null;
      if (!self.visible || document.hidden) return;
      var dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (self.debugTime != null) self.debugTime += dt * 1000 * self.timeScale;
      var d = self.now();
      if (!self.reduced) self.step(dt, d);
      self.draw(d, t);
      if (self.reduced) {
        var parts = londonParts(d, self.o.tz), minutes = parts.h * 60 + parts.m;
        var boundary = parts.wd === "Sat" || parts.wd === "Sun" ? 1440 : minutes < self.hours.start ? self.hours.start : minutes < self.hours.end ? self.hours.end : 1440;
        var delay = Math.max(20, Math.min(30000, (boundary - minutes) * 60000 - d.getSeconds() * 1000 - d.getMilliseconds()));
        self.timer = setTimeout(function () { self.timer = null; self.resume(); }, delay); return;
      }
      self.raf = requestAnimationFrame(tick);
    }
    this.pause = function () { if (self.raf) cancelAnimationFrame(self.raf); if (self.timer) clearTimeout(self.timer); self.raf = null; self.timer = null; };
    this.resume = function () { if (self.visible && !document.hidden && !self.raf && !self.timer) { last = performance.now(); self.raf = requestAnimationFrame(tick); } };
    this.resume();
    if ("IntersectionObserver" in root) new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.resume(); else self.pause(); }).observe(this.el);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) self.resume(); else self.pause(); });
    if (root.matchMedia) root.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (event) { self.reduced = event.matches; self.pause(); self.resume(); });
    var rt; root.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { self.layout(); }, 150); });
    setInterval(function () { self.fetchWeather(); }, this.o.cacheMinutes * 60000);
    if (this.o.labels === "hover") {
      this.cv.addEventListener("pointermove", function (e) {
        var r = self.cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * self.rowWidth, y = (e.clientY - r.top) / r.height * self.outputHeight;
        var hit = self.agents.find(function (a) { return !a.hidden && a.box && x >= a.box[0] && x <= a.box[0] + a.box[2] && y >= a.box[1] && y <= a.box[1] + a.box[3]; });
        if (hit) { self.tip.hidden = false; self.tip.textContent = hit.p.first + " · " + hit.p.role + (hit.label ? " · " + hit.label : ""); var halfTip = self.tip.offsetWidth / 2; self.tip.style.left = clamp(e.clientX - r.left, halfTip + 8, r.width - halfTip - 8) + "px"; self.tip.style.top = Math.max(0, (hit.box[1] * r.height / self.outputHeight) - self.tip.offsetHeight - 6) + "px"; }
        else self.tip.hidden = true;
      });
      this.cv.addEventListener("pointerleave", function () { self.tip.hidden = true; });
    }
  };

  // ---------- public API ----------
  var scenes = [];
  function mount(el, opts) {
    var o = {}; Object.keys(DEFAULTS).forEach(function (k) { o[k] = DEFAULTS[k]; });
    var ds = el.dataset || {};
    if (ds.lat) o.lat = +ds.lat; if (ds.lon) o.lon = +ds.lon; if (ds.labels) o.labels = ds.labels; if (ds.weather) o.weather = ds.weather;
    if (ds.scale) o.scale = +ds.scale; if (ds.maxPeople) o.maxPeople = +ds.maxPeople; if (ds.logo) o.logo = ds.logo;
    if (ds.lsfHours || ds.hours) o.hours = ds.lsfHours || ds.hours;
    if (ds.lsfPhone || ds.phone) o.phone = ds.lsfPhone || ds.phone;
    if (ds.lsfContact || ds.contact) o.contact = ds.lsfContact || ds.contact;
    if (ds.lsfBot || ds.bot) o.bot = ds.lsfBot || ds.bot;
    o.spritesUrl = ds.sprites; o.atlasUrl = ds.atlas;
    if (opts) Object.keys(opts).forEach(function (k) { o[k] = opts[k]; });
    var s = new Scene(el, o); scenes.push(s);
    s.load().then(function () { s.start(); }).catch(function (e) { el.setAttribute("data-error", "sprites"); if (root.console) console.warn("Labskin footer: could not load sprites", e); });
    return s;
  }
  function auto() { Array.prototype.forEach.call(document.querySelectorAll(".lsf-scene[data-sprites]"), function (el) { if (!el.__lsf) el.__lsf = mount(el); }); }
  root.LabskinFooter = {
    mount: mount,
    isOpen: function (date, hours, tz) { return isOpen(new Date(date), hoursPolicy(hours || DEFAULTS.hours), tz || DEFAULTS.tz); },
    clock: function (date, tz) { return clockText(new Date(date), tz || DEFAULTS.tz); },
    debug: function (cfg) { // previews only: { time: Date|number|null, speed: number, weather: "rain"|…|"live" }
      scenes.forEach(function (s) {
        if ("time" in cfg) { s.debugTime = cfg.time == null ? null : +new Date(cfg.time); if (s.equip) s.reseed(); }
        if (cfg.speed) s.timeScale = cfg.speed;
        if (cfg.weather) { if (cfg.weather === "live") { s.o.weather = "live"; s.fetchWeather(); } else s.applyWeather({ code: PRESETS[cfg.weather], wind: 14 }); }
        if (s.resume) { s.pause(); s.resume(); }
      });
    },
    scenes: scenes
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})(window);
