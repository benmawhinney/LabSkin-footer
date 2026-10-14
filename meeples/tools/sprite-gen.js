/* Labskin meeple sprite generator.
   Draws every team member as 32x32 pixel art and packs them into one sheet.
   Columns: walk0 walk1 walk2 walk3 (side view, facing right; flip for left),
            work0 work1 (back view, arms at the bench), idle (front view).
   Same height and body for everyone. Lab coat for scientists, suit for business roles.
   Appearance is deliberately generic: one skin tone, hair style and colour picked from a hash of the name. */
(function (root) {
  "use strict";
  var TEAM = [
    ["Nicola Kingswell", "Scientific Director / Owner", "coat"],
    ["Stewart Sale", "Business Development Director", "suit"],
    ["Bart Cwikla", "Head of Microbiology", "coat"],
    ["Vinay Thoree", "Head of Histology", "coat"],
    ["Holly Lyons", "Client Project Manager", "suit"],
    ["Emma Corbin", "Delivery Project Manager", "suit"],
    ["Matteo Capocefalo", "Scientific Strategy and Operations Director", "suit", { glasses: true }],
    ["Simms Adu", "KTP Associate", "coat"],
    ["Raphael Slip", "Head of Production", "coat"],
    ["Joe Taylor", "Junior Scientist", "coat"],
    ["Nell Richardson", "Junior Scientist", "coat"],
    ["Charlotte Heath", "Junior Scientist", "coat"],
    ["Mariyah Ahmed", "Senior Scientist", "coat"],
    ["Laura Crouch", "Senior Scientist", "coat"],
    ["Jenny White", "Senior Scientist", "coat"],
    ["Silvia Greco", "Scientist", "coat"],
    ["Erin Dela Cruz", "Industrial Placement Student", "coat"]
  ];
  var COLS = ["walk0", "walk1", "walk2", "walk3", "work0", "work1", "idle"];
  var HAIR = ["#3b2a20", "#5a3a24", "#1f1a17", "#8a4b2a", "#c9a15a", "#7d7468", "#6b4a2e"];
  var STYLES = ["short", "side", "long", "bun", "crop", "curly"];
  var SKIN = "#e6b996", SKIN_D = "#c99878", OUT = "#1e2a2e";

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function person(t) {
    var h = hash(t[0]);
    return { name: t[0], first: t[0].split(" ")[0], role: t[1], outfit: t[2], glasses: !!(t[3] && t[3].glasses),
      hair: HAIR[h % HAIR.length], style: STYLES[(h >> 4) % STYLES.length], tie: ["#c0392b", "#2f8f6f", "#b98a24", "#6b5bd2"][(h >> 8) % 4] };
  }

  function drawCell(g, ox, oy, p, col) {
    function R(x, y, w, hh, c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, hh); }
    var coat = p.outfit === "coat";
    var body = coat ? "#f4f7f8" : "#26324a", bodyD = coat ? "#c9d3d8" : "#1a2336";
    var trous = coat ? "#3d4b5c" : "#26324a";
    var HR = function (x, y, w, hh, b) { R(x, y + (b || 0), w, hh, p.hair); };

    if (col.indexOf("walk") === 0) {
      var f = +col.slice(4), bob = (f === 1 || f === 3) ? 1 : 0, st = f === 1 ? 2 : f === 3 ? -2 : 0;
      // back leg, back arm (darker)
      R(14 - st, 25 + bob, 3, 5 - bob, OUT); R(15 - st, 25 + bob, 1, 4 - bob, shade(trous));
      // torso
      R(12, 14 + bob, 9, coat ? 13 : 11, OUT); R(13, 15 + bob, 7, coat ? 11 : 9, body);
      if (coat) { R(13, 15 + bob, 1, 11, bodyD); R(18, 19 + bob, 1, 2, "#2e86de"); }
      else { R(19, 15 + bob, 1, 4, "#eef2f5"); R(19, 16 + bob, 1, 3, p.tie); }
      // front leg
      R(15 + st, 25 + bob, 3, 5 - bob, OUT); R(16 + st, 25 + bob, 1, 4 - bob, trous);
      R(15 + st, 29, 4, 1, "#151b22"); R(14 - st, 29, 4, 1, "#151b22");
      // arm swings opposite to front leg
      var a = -st;
      R(15 + a, 16 + bob, 3, 8, OUT); R(16 + a, 17 + bob, 1, 6, coat ? bodyD : "#1a2336"); R(16 + a, 23 + bob, 2, 2, SKIN);
      // head (profile, facing right)
      R(12, 3 + bob, 11, 12, OUT); R(13, 4 + bob, 9, 10, SKIN); R(22, 9 + bob, 1, 2, SKIN); R(13, 13 + bob, 9, 1, SKIN_D);
      R(19, 8 + bob, 2, 2, OUT);
      if (p.style === "short") { HR(12, 3, 10, 3, bob); HR(12, 5, 4, 5, bob); }
      if (p.style === "side") { HR(12, 3, 11, 3, bob); HR(12, 5, 5, 6, bob); }
      if (p.style === "long") { HR(12, 3, 10, 3, bob); HR(11, 5, 6, 11, bob); }
      if (p.style === "bun") { HR(9, 3, 4, 4, bob); HR(12, 3, 10, 3, bob); HR(12, 5, 4, 5, bob); }
      if (p.style === "crop") { HR(12, 3, 10, 2, bob); HR(12, 4, 4, 3, bob); }
      if (p.style === "curly") { HR(11, 2, 12, 4, bob); HR(11, 5, 6, 7, bob); }
      if (p.glasses) { R(18, 7 + bob, 4, 4, OUT); R(19, 8 + bob, 2, 2, "#cfe6f5"); R(14, 8 + bob, 4, 1, OUT); }
      return;
    }

    var back = col.indexOf("work") === 0, wf = back ? +col.slice(4) : 0;
    // legs
    R(12, 24, 3, 5, OUT); R(17, 24, 3, 5, OUT); R(13, 24, 2, 5, trous); R(17, 24, 2, 5, trous);
    R(12, 29, 3, 1, "#151b22"); R(17, 29, 3, 1, "#151b22");
    // torso
    R(9, 14, 14, coat ? 13 : 11, OUT); R(10, 15, 12, coat ? 11 : 9, body);
    if (!back) {
      if (coat) { R(15, 15, 2, 11, bodyD); R(11, 20, 3, 2, bodyD); R(18, 20, 3, 2, bodyD); R(19, 17, 1, 2, "#2e86de"); R(14, 15, 4, 2, "#9ec9e8"); }
      else { R(14, 15, 4, 5, "#eef2f5"); R(15, 16, 2, 5, p.tie); R(13, 15, 1, 6, bodyD); R(18, 15, 1, 6, bodyD); }
      R(7, 15, 3, 9, OUT); R(22, 15, 3, 9, OUT); R(8, 16, 2, 7, body); R(22, 16, 2, 7, body); R(8, 23, 2, 2, SKIN); R(22, 23, 2, 2, SKIN);
    } else {
      R(15, 15, 2, coat ? 11 : 9, bodyD);
      // arms raised to the bench, alternating
      var l = wf ? 1 : 0, r = wf ? 0 : 1;
      R(7, 13 + l, 3, 7, OUT); R(22, 13 + r, 3, 7, OUT); R(8, 14 + l, 2, 5, body); R(22, 14 + r, 2, 5, body);
      R(8, 12 + l, 2, 2, SKIN); R(22, 12 + r, 2, 2, SKIN);
    }
    // head
    R(10, 3, 12, 12, OUT); R(11, 4, 10, 10, SKIN); R(11, 13, 10, 1, SKIN_D);
    if (!back) {
      if (p.style === "short") { HR(10, 3, 12, 3); HR(10, 5, 2, 3); HR(20, 5, 2, 3); }
      if (p.style === "side") { HR(10, 3, 12, 3); HR(10, 5, 5, 2); HR(10, 6, 2, 3); HR(20, 5, 2, 2); }
      if (p.style === "long") { HR(10, 3, 12, 3); HR(9, 5, 3, 11); HR(20, 5, 3, 11); }
      if (p.style === "bun") { HR(13, 0, 6, 3); HR(10, 3, 12, 3); HR(10, 5, 2, 4); HR(20, 5, 2, 4); }
      if (p.style === "crop") { HR(10, 3, 12, 2); HR(10, 5, 1, 3); HR(21, 5, 1, 3); }
      if (p.style === "curly") { HR(9, 2, 14, 4); HR(9, 5, 3, 6); HR(20, 5, 3, 6); HR(12, 1, 8, 1); }
      R(13, 9, 2, 2, OUT); R(17, 9, 2, 2, OUT); R(14, 12, 4, 1, SKIN_D);
      if (p.glasses) { R(12, 8, 4, 4, OUT); R(16, 9, 1, 1, OUT); R(17, 8, 4, 4, OUT); R(13, 9, 2, 2, "#cfe6f5"); R(18, 9, 2, 2, "#cfe6f5"); R(13, 10, 1, 1, OUT); R(18, 10, 1, 1, OUT); }
    } else {
      HR(10, 3, 12, 10);
      if (p.style === "long") HR(9, 5, 14, 11);
      if (p.style === "bun") HR(13, 0, 6, 3);
      if (p.style === "curly") HR(9, 2, 14, 11);
      if (p.style === "crop") R(11, 9, 10, 4, SKIN);
    }
  }
  function shade(hex) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) * .7, g = (n >> 8 & 255) * .7, b = (n & 255) * .7; return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")"; }

  function makeSheet(scale) {
    scale = scale || 1;
    var people = TEAM.map(person), cell = 32;
    var base = document.createElement("canvas"); base.width = cell * COLS.length; base.height = cell * people.length;
    var g = base.getContext("2d");
    people.forEach(function (p, row) { COLS.forEach(function (c, ci) { drawCell(g, ci * cell, row * cell, p, c); }); });
    if (scale === 1) return { canvas: base, people: people };
    var out = document.createElement("canvas"); out.width = base.width * scale; out.height = base.height * scale;
    var o = out.getContext("2d"); o.imageSmoothingEnabled = false; o.drawImage(base, 0, 0, out.width, out.height);
    return { canvas: out, people: people };
  }
  function atlas() {
    return { cell: 32, columns: COLS, facing: "walk frames face right; mirror horizontally to walk left",
      people: TEAM.map(person).map(function (p, i) { return { row: i, name: p.name, first: p.first, role: p.role, outfit: p.outfit, glasses: p.glasses }; }) };
  }
  root.LabskinSprites = { makeSheet: makeSheet, atlas: atlas, TEAM: TEAM, COLS: COLS };
})(window);
