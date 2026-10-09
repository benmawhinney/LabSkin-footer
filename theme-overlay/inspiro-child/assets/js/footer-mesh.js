const vertexSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aUv;

uniform vec2 uResolution;
uniform vec2 uRotation;
uniform float uTime;
uniform float uWaveAmplitude;
uniform float uReducedMotion;
uniform vec4 uPokes[8];
uniform float uPokeRelease[8];
uniform vec3 uHover;

out vec2 vUv;
out float vHeight;

float springValue(float age) {
  float attack = 1.0 - exp(-max(age, 0.0) * 11.0);
  return attack * (1.0 + 0.055 * sin(age * 11.0) * exp(-age * 1.8));
}

void main() {
  vUv = aUv;
  vec3 point = aPosition;
  vec2 local = (aUv - 0.5) * 2.0;
  float time = uReducedMotion > 0.5 ? 0.0 : uTime;
  float flow = sin(local.x * 3.4 + time * 0.72) * 0.48;
  flow += sin(local.y * 4.2 - time * 0.53) * 0.32;
  flow += sin((local.x + local.y * 0.7) * 2.8 + time * 0.38) * 0.2;

  float poke = 0.0;
  for (int pokeIndex = 0; pokeIndex < 8; pokeIndex++) {
    if (uPokes[pokeIndex].w <= 0.0) {
      continue;
    }
    vec2 delta = aUv - uPokes[pokeIndex].xy;
    float radius = max(0.035, uPokes[pokeIndex].w * 0.13);
    float falloff = exp(-dot(delta, delta) / (radius * radius));
    float age = max(0.0, uTime - uPokes[pokeIndex].z);
    float held = uPokeRelease[pokeIndex] < 0.0
      ? 1.0
      : exp(-max(0.0, uTime - uPokeRelease[pokeIndex]) * 1.45);
    poke += falloff * springValue(age) * held * uPokes[pokeIndex].w;
  }

  vec2 hoverDelta = aUv - uHover.xy;
  float hoverFalloff = exp(-dot(hoverDelta, hoverDelta) / 0.045);
  float hoverDent = uReducedMotion > 0.5 ? 0.0 : hoverFalloff * uHover.z * 0.025;
  point.z = (uReducedMotion > 0.5 ? 0.0 : flow * uWaveAmplitude) - poke * 0.14 - hoverDent;

  float yawCos = cos(uRotation.x);
  float yawSin = sin(uRotation.x);
  float pitchCos = cos(uRotation.y);
  float pitchSin = sin(uRotation.y);
  vec3 turned = vec3(
    point.x * yawCos + point.z * yawSin,
    point.y * pitchCos - point.z * pitchSin,
    -point.x * yawSin + point.y * pitchSin + point.z * pitchCos
  );

  float aspectCorrection = uResolution.y / max(1.0, uResolution.x);
  vec2 clipPoint = vec2(turned.x * 0.91 * aspectCorrection, turned.y * 0.86);
  gl_Position = vec4(clipPoint, clamp(turned.z * 0.12, -0.2, 0.2), 1.0);
  vHeight = point.z;
}`;

const fragmentSource = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uGridCount;
uniform float uLineWidth;
uniform float uNodeSize;
uniform float uReducedMotion;
uniform int uVariant;
uniform vec4 uPokes[8];
uniform float uPokeRelease[8];
uniform vec3 uHover;
uniform vec4 uBreaks[4];
uniform vec4 uDamages[8];
uniform vec3 uTeal400;
uniform vec3 uTeal200;
uniform vec3 uWhite;

in vec2 vUv;
in float vHeight;
out vec4 fragColor;

float hashValue(float value) {
  return fract(sin(value * 127.1) * 43758.5453);
}

float springValue(float age) {
  float attack = 1.0 - exp(-max(age, 0.0) * 11.0);
  return attack * (1.0 + 0.055 * sin(age * 11.0) * exp(-age * 1.8));
}

void main() {
  vec2 sheet = (vUv - 0.5) * 2.0;
  float shapeDistance = uVariant == 0
    ? max(abs(sheet.x), abs(sheet.y))
    : max(abs(sheet.x), abs(sheet.y) * 1.75);
  float edgeFade = 1.0 - smoothstep(0.82, 1.0, shapeDistance);
  if (edgeFade <= 0.002) {
    discard;
  }

  vec2 grid = vUv * uGridCount;
  float flowTime = uReducedMotion > 0.5 ? 0.0 : uTime;
  grid.x += sin(vUv.y * 8.0 + flowTime * 0.58) * 0.3;
  grid.x += sin(vUv.y * 3.3 - flowTime * 0.34) * 0.18;
  grid.y += sin(vUv.x * 5.4 - flowTime * 0.46) * 0.16;
  for (int pokeIndex = 0; pokeIndex < 8; pokeIndex++) {
    if (uPokes[pokeIndex].w <= 0.0) {
      continue;
    }
    vec2 delta = (vUv - uPokes[pokeIndex].xy) * uGridCount;
    float radius = max(1.0, uPokes[pokeIndex].w * 5.0);
    float falloff = exp(-dot(delta, delta) / (radius * radius));
    float age = max(0.0, uTime - uPokes[pokeIndex].z);
    float held = uPokeRelease[pokeIndex] < 0.0
      ? 1.0
      : exp(-max(0.0, uTime - uPokeRelease[pokeIndex]) * 1.45);
    vec2 direction = normalize(delta + vec2(0.0001));
    grid -= direction * falloff * springValue(age) * held * 0.32 * uPokes[pokeIndex].w;
  }

  vec2 hoverDelta = (vUv - uHover.xy) * uGridCount;
  float hoverFalloff = exp(-dot(hoverDelta, hoverDelta) * 0.035);
  grid -= normalize(hoverDelta + vec2(0.0001)) * hoverFalloff * uHover.z * 0.2;

  vec2 pixelWidth = max(fwidth(grid), vec2(0.0001));
  vec2 fromLine = min(fract(grid), 1.0 - fract(grid)) / pixelWidth;
  float lineDistance = min(fromLine.x, fromLine.y);
  float line = 1.0 - smoothstep(uLineWidth, uLineWidth + 1.15, lineDistance);

  vec2 nearestNodeOffset = (grid - floor(grid + 0.5)) / pixelWidth;
  float nodeDistance = length(nearestNodeOffset);
  float nodes = 1.0 - smoothstep(uNodeSize, uNodeSize + 1.5, nodeDistance);

  float particleLight = 0.0;
  float breakGap = 0.0;
  for (int breakIndex = 0; breakIndex < 4; breakIndex++) {
    if (uBreaks[breakIndex].w <= 0.0) {
      continue;
    }
    float age = max(0.0, uTime - uBreaks[breakIndex].z);
    float alive = 1.0 - smoothstep(1.28, 1.58, age);
    vec2 breakUv = uBreaks[breakIndex].xy;
    vec2 center = breakUv * uGridCount;
    center.x += sin(breakUv.y * 8.0 + flowTime * 0.58) * 0.3;
    center.x += sin(breakUv.y * 3.3 - flowTime * 0.34) * 0.18;
    center.y += sin(breakUv.x * 5.4 - flowTime * 0.46) * 0.16;
    vec2 fromBreak = (grid - center) / pixelWidth;
    float distanceFromBreak = length(fromBreak);
    float localGap = 1.0 - smoothstep(2.0, 6.5, distanceFromBreak);
    breakGap = max(breakGap, alive * localGap);

    float burst = smoothstep(0.02, 0.24, age) * (1.0 - smoothstep(0.42, 1.38, age));
    float particleVisibility = 1.0 - smoothstep(1.18, 1.5, age);
    for (int particleIndex = 0; particleIndex < 6; particleIndex++) {
      float seed = hashValue(float(particleIndex) + uBreaks[breakIndex].x * 31.0 + uBreaks[breakIndex].y * 17.0);
      float angle = float(particleIndex) * 2.399963 + seed * 6.283185;
      vec2 heading = vec2(cos(angle), sin(angle));
      float radius = burst * (0.22 + seed * 0.12) * uBreaks[breakIndex].w;
      vec2 particlePosition = center + heading * radius;
      float particleDistance = length((grid - particlePosition) / pixelWidth);
      float dotGlow = 1.0 - smoothstep(1.0, 3.2, particleDistance);
      particleLight = max(particleLight, dotGlow * particleVisibility * alive);
    }
  }

  line *= 1.0 - breakGap * 0.98;
  nodes *= 1.0 - breakGap;

  float pokeLight = 0.0;
  for (int lightIndex = 0; lightIndex < 8; lightIndex++) {
    if (uPokes[lightIndex].w <= 0.0) {
      continue;
    }
    float age = max(0.0, uTime - uPokes[lightIndex].z);
    float held = uPokeRelease[lightIndex] < 0.0
      ? 1.0
      : exp(-max(0.0, uTime - uPokeRelease[lightIndex]) * 1.45);
    float distanceToPoke = length((vUv - uPokes[lightIndex].xy) * uGridCount);
    float light = exp(-distanceToPoke * distanceToPoke * 0.65) * springValue(age) * held;
    pokeLight = max(pokeLight, light);
  }

  float hoverLight = exp(-dot(hoverDelta, hoverDelta) * 0.012) * uHover.z;

  float inflammation = 0.0;
  float inflammationParticles = 0.0;
  float repairWhite = 0.0;
  for (int damageIndex = 0; damageIndex < 8; damageIndex++) {
    if (uDamages[damageIndex].w <= 0.0) {
      continue;
    }

    float age = max(0.0, uTime - uDamages[damageIndex].z);
    vec2 damageCenter = uDamages[damageIndex].xy * uGridCount;
    vec2 damageDelta = (grid - damageCenter) / pixelWidth;
    float damageDistance = length(damageDelta);
    float localGlow = exp(-dot(damageDelta, damageDelta) * 0.008);
    float flareIn = smoothstep(0.0, 0.12, age);
    float flareOut = 1.0 - smoothstep(0.72, 1.2, age);
    inflammation = max(inflammation, localGlow * flareIn * flareOut * uDamages[damageIndex].w);

    float particleIn = smoothstep(0.04, 0.16, age);
    float particleOut = 1.0 - smoothstep(0.74, 0.9, age);
    float particleMotion = uReducedMotion > 0.5 ? 0.0 : particleIn * particleOut;
    for (int particleIndex = 0; particleIndex < 8; particleIndex++) {
      float seed = hashValue(float(particleIndex) + uDamages[damageIndex].x * 41.0 + uDamages[damageIndex].y * 23.0);
      float angle = float(particleIndex) * 2.399963 + seed * 6.283185;
      vec2 heading = vec2(cos(angle), sin(angle));
      float travel = smoothstep(0.08, 0.72, age) * (2.5 + seed * 3.0);
      vec2 particlePosition = damageCenter + heading * travel;
      float particleDistance = length((grid - particlePosition) / pixelWidth);
      float markerCore = 1.0 - smoothstep(0.65, 1.7, particleDistance);
      float markerGlow = 1.0 - smoothstep(1.5, 4.2, particleDistance);
      inflammationParticles = max(
        inflammationParticles,
        (markerCore + markerGlow * 0.55) * particleMotion * uDamages[damageIndex].w
      );
    }

    float repairIn = smoothstep(1.02, 1.28, age);
    float repairOut = 1.0 - smoothstep(1.7, 2.18, age);
    float repairRegion = exp(-dot(damageDelta, damageDelta) * 0.0008);
    repairWhite = max(repairWhite, repairRegion * repairIn * repairOut * uDamages[damageIndex].w);
  }

  float heightLight = clamp(abs(vHeight) * 8.0, 0.0, 0.5);
  vec3 edgeColor = mix(uTeal400, uTeal200, clamp(heightLight + nodes * 0.15, 0.0, 1.0));
  vec3 inflammationColor = vec3(1.0, 0.035, 0.17);
  edgeColor = mix(edgeColor, inflammationColor, clamp(inflammation * 0.95, 0.0, 1.0));
  vec3 color = edgeColor * (line * 0.6 + nodes * 0.58);
  color += inflammationColor * (inflammation * 0.38 + inflammationParticles * 1.25);
  color += uWhite * (pokeLight * 0.72 + particleLight * 0.92 + hoverLight * 0.12);
  color = mix(color, uWhite, clamp(repairWhite * 1.2, 0.0, 1.0));
  float alpha = edgeFade * clamp(
    line * 0.62 + nodes * 0.62 + particleLight + pokeLight * 0.42 + hoverLight * 0.12 + inflammation * 0.28 + inflammationParticles + repairWhite * 0.3,
    0.0,
    1.0
  );
  fragColor = vec4(color, alpha);
}`;

const MAX_POKES = 8;
const MAX_BREAKS = 4;
const MAX_DAMAGE_EVENTS = 8;
const BREAK_HEAL_SECONDS = 1.6;
const DAMAGE_RECOVERY_SECONDS = 2.25;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Could not create WebGL shader.');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function makeGeometry(gl, segments) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const rowLength = segments + 1;

  for (let row = 0; row <= segments; row += 1) {
    for (let column = 0; column <= segments; column += 1) {
      const u = column / segments;
      const v = row / segments;
      positions.push((u - 0.5) * 2, (0.5 - v) * 2, 0);
      uvs.push(u, v);
    }
  }

  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const upperLeft = row * rowLength + column;
      const upperRight = upperLeft + 1;
      const lowerLeft = upperLeft + rowLength;
      const lowerRight = lowerLeft + 1;
      indices.push(upperLeft, lowerLeft, upperRight, upperRight, lowerLeft, lowerRight);
    }
  }

  const vao = gl.createVertexArray();
  const positionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  return {
    vao,
    indexBuffer,
    indexCount: indices.length,
    positionBuffer,
    uvBuffer
  };
}

function parseCssColor(value, fallback, context) {
  const colorContext = context || document.createElement('canvas').getContext('2d');
  if (!colorContext) {
    return [0.37, 0.79, 0.77];
  }
  colorContext.fillStyle = fallback;
  colorContext.fillStyle = value || fallback;
  const color = colorContext.fillStyle;
  const channels = color.match(/[0-9.]+/g);
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const expanded = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
    const packed = Number.parseInt(expanded, 16);
    return [((packed >> 16) & 255) / 255, ((packed >> 8) & 255) / 255, (packed & 255) / 255];
  }
  if (channels && channels.length >= 3) {
    return channels.slice(0, 3).map((channel) => Number(channel) / 255);
  }
  return [0.37, 0.79, 0.77];
}

export function mount(root) {
  const canvas = root.querySelector('[data-footer-mesh-canvas]');
  if (!canvas) {
    return { destroy() {}, setVariant() {} };
  }

  let gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    powerPreference: 'low-power'
  });
  if (!gl) {
    root.dataset.meshState = 'fallback';
    return { destroy() {}, setVariant() {} };
  }

  const state = {
    visible: false,
    lost: false,
    destroyed: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    yaw: 0,
    pitch: -0.32,
    velocityYaw: 0,
    velocityPitch: 0,
    lastInputAt: performance.now(),
    lastFrameAt: 0,
    animationFrame: 0,
    dprCap: 1.75,
    qualityReduced: false,
    frameTimes: [],
    fpsFrames: 0,
    lastFpsUpdate: performance.now(),
    variant: 'insert',
    pokes: [],
    breaks: [],
    damages: [],
    hoverUv: [0.5, 0.5],
    hoverTargetUv: [0.5, 0.5],
    hoverStrength: 0,
    hoverTargetStrength: 0,
    activePointer: null,
    lastBreakAt: -Infinity
  };

  let resources = null;
  let resizeObserver = null;
  let visibilityObserver = null;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scratchColor = document.createElement('canvas').getContext('2d');
  const clockStart = performance.now();
  const colors = {
    teal400: readColor('--ls-teal-400', '#5FC9C4'),
    teal200: readColor('--ls-teal-200', '#A8E6E0'),
    white: readColor('--ls-white', '#FFFFFF')
  };
  const fpsOutput = root.querySelector('[data-footer-mesh-fps]');

  function secondsNow() {
    return (performance.now() - clockStart) / 1000;
  }

  function cleanupGeometry(geometry) {
    if (!geometry) {
      return;
    }
    gl.deleteVertexArray(geometry.vao);
    gl.deleteBuffer(geometry.positionBuffer);
    gl.deleteBuffer(geometry.uvBuffer);
    gl.deleteBuffer(geometry.indexBuffer);
  }

  function buildResources() {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.bindAttribLocation(program, 1, 'aUv');
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'WebGL program linking failed.';
      gl.deleteProgram(program);
      throw new Error(message);
    }

    const names = [
      'uResolution', 'uRotation', 'uTime', 'uWaveAmplitude', 'uReducedMotion',
      'uPokes[0]', 'uPokeRelease[0]', 'uGridCount', 'uLineWidth', 'uNodeSize',
      'uHover', 'uVariant', 'uBreaks[0]', 'uDamages[0]', 'uTeal400', 'uTeal200', 'uWhite'
    ];
    const uniforms = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const geometry = makeGeometry(gl, mobile ? 96 : 160);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    return { program, uniforms, geometry };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, state.dprCap, mobile ? 1.5 : 1.75);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function addPoke(uv, strength, held) {
    const poke = {
      uv,
      start: secondsNow(),
      strength,
      release: held ? -1 : secondsNow()
    };
    state.pokes.push(poke);
    if (state.pokes.length > MAX_POKES) {
      state.pokes.shift();
    }
    return poke;
  }

  function addBreak(uv) {
    const gridCount = window.matchMedia('(max-width: 767px)').matches ? 24 : 34;
    const nodeUv = [Math.round(uv[0] * gridCount) / gridCount, Math.round(uv[1] * gridCount) / gridCount];
    const duplicate = state.breaks.some((entry) => {
      const age = secondsNow() - entry.start;
      return age < BREAK_HEAL_SECONDS && Math.hypot(entry.uv[0] - nodeUv[0], entry.uv[1] - nodeUv[1]) < 0.035;
    });
    if (duplicate) {
      return;
    }
    state.breaks.push({ uv: nodeUv, start: secondsNow(), strength: 1 });
    if (state.breaks.length > MAX_BREAKS) {
      state.breaks.shift();
    }
    state.lastBreakAt = performance.now();
  }

  function addDamage(uv, strength = 1) {
    const damage = { uv: [uv[0], uv[1]], start: secondsNow(), strength };
    state.damages.push(damage);
    if (state.damages.length > MAX_DAMAGE_EVENTS) {
      state.damages.shift();
    }
    return damage;
  }

  function pointerUv(event) {
    const rect = canvas.getBoundingClientRect();
    const u = (event.clientX - rect.left) / rect.width;
    const v = 1 - (event.clientY - rect.top) / rect.height;
    if (u < 0.08 || u > 0.92 || v < 0.08 || v > 0.92) {
      return null;
    }
    return [u, v];
  }

  function releaseActivePoke() {
    if (state.activePointer?.poke && state.activePointer.poke.release < 0) {
      state.activePointer.poke.release = secondsNow();
    }
  }

  function pointerDown(event) {
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }
    const uv = pointerUv(event);
    if (!uv) {
      return;
    }
    canvas.setPointerCapture?.(event.pointerId);
    const now = performance.now();
    state.activePointer = {
      id: event.pointerId,
      type: event.pointerType || 'mouse',
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: now,
      dragging: false,
      broke: false,
      poke: addPoke(uv, Math.max(0.55, event.pressure || 0.5), true),
      damage: addDamage(uv, Math.max(0.8, event.pressure || 0.5))
    };
    state.lastInputAt = now;
    startRendering();
  }

  function pointerMove(event) {
    const uv = pointerUv(event);
    const active = state.activePointer;
    if (!active || active.id !== event.pointerId) {
      if (!state.reducedMotion && event.pointerType !== 'touch') {
        state.hoverTargetStrength = uv ? 0.25 : 0;
        if (uv) {
          state.hoverTargetUv = uv;
        }
        startRendering();
      }
      return;
    }
    const now = performance.now();
    const deltaX = event.clientX - active.lastX;
    const deltaY = event.clientY - active.lastY;
    const deltaTime = Math.max(0.008, (now - active.lastAt) / 1000);
    const totalDistance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY);

    if (!active.dragging && totalDistance > 6) {
      active.dragging = true;
      releaseActivePoke();
    }

    if (active.dragging) {
      const horizontalSpeed = Math.abs(deltaX) / deltaTime;
      const dragScale = 0.004;
      state.yaw += deltaX * dragScale;
      state.pitch = Math.max(-0.72, Math.min(0.28, state.pitch + deltaY * dragScale));
      state.velocityYaw = deltaX * dragScale / deltaTime;
      state.velocityPitch = deltaY * dragScale / deltaTime;

      if (
        !state.reducedMotion &&
        !active.broke &&
        uv &&
        horizontalSpeed > 1000 &&
        horizontalSpeed > Math.abs(deltaY) / deltaTime &&
        now - state.lastBreakAt > 180
      ) {
        addBreak(uv);
        addDamage(uv, 1.25);
        active.broke = true;
      }
    } else if (active.poke && uv) {
      active.poke.uv = uv;
      active.poke.strength = Math.min(1.4, Math.max(0.55, event.pressure || 0.5));
    }

    active.lastX = event.clientX;
    active.lastY = event.clientY;
    active.lastAt = now;
    state.lastInputAt = now;
    startRendering();
  }

  function pointerLeave(event) {
    if (event.pointerType === 'touch') {
      return;
    }
    state.hoverTargetStrength = 0;
    startRendering();
  }

  function pointerUp(event) {
    if (!state.activePointer || state.activePointer.id !== event.pointerId) {
      return;
    }
    releaseActivePoke();
    canvas.releasePointerCapture?.(event.pointerId);
    state.activePointer = null;
    state.lastInputAt = performance.now();
    startRendering();
  }

  function pointerCancel(event) {
    if (!state.activePointer || state.activePointer.id !== event.pointerId) {
      return;
    }
    releaseActivePoke();
    state.activePointer = null;
    state.lastInputAt = performance.now();
    startRendering();
  }

  function packUniforms() {
    const now = secondsNow();
    state.pokes = state.pokes.filter((poke) => poke.release < 0 || now - poke.release < 1.6);
    state.breaks = state.breaks.filter((entry) => now - entry.start < BREAK_HEAL_SECONDS);
    state.damages = state.damages.filter((damage) => now - damage.start < DAMAGE_RECOVERY_SECONDS);
    const pokeData = new Float32Array(MAX_POKES * 4);
    const releaseData = new Float32Array(MAX_POKES);
    releaseData.fill(-2);
    state.pokes.forEach((poke, index) => {
      const offset = index * 4;
      pokeData[offset] = poke.uv[0];
      pokeData[offset + 1] = poke.uv[1];
      pokeData[offset + 2] = poke.start;
      pokeData[offset + 3] = poke.strength;
      releaseData[index] = poke.release;
    });
    const breakData = new Float32Array(MAX_BREAKS * 4);
    state.breaks.forEach((entry, index) => {
      const offset = index * 4;
      breakData[offset] = entry.uv[0];
      breakData[offset + 1] = entry.uv[1];
      breakData[offset + 2] = entry.start;
      breakData[offset + 3] = entry.strength;
    });
    const damageData = new Float32Array(MAX_DAMAGE_EVENTS * 4);
    state.damages.forEach((damage, index) => {
      const offset = index * 4;
      damageData[offset] = damage.uv[0];
      damageData[offset + 1] = damage.uv[1];
      damageData[offset + 2] = damage.start;
      damageData[offset + 3] = damage.strength;
    });
    return { pokeData, releaseData, breakData, damageData };
  }

  function hasRecoveringPoke() {
    const now = secondsNow();
    return state.pokes.some((poke) => poke.release < 0 || now - poke.release < 1.6)
      || state.damages.some((damage) => now - damage.start < DAMAGE_RECOVERY_SECONDS);
  }

  function renderFrame(timestamp) {
    state.animationFrame = 0;
    if (state.destroyed || state.lost || !state.visible || document.hidden) {
      return;
    }
    const idleFor = timestamp - state.lastInputAt;
    const frameInterval = state.reducedMotion ? 1000 / 24 : (idleFor > 20000 ? 1000 / 30 : 0);
    if (frameInterval && timestamp - state.lastFrameAt < frameInterval) {
      state.animationFrame = requestAnimationFrame(renderFrame);
      return;
    }

    const previousFrameAt = state.lastFrameAt;
    const deltaTime = Math.min(0.05, Math.max(0.001, (timestamp - (previousFrameAt || timestamp)) / 1000));
    state.lastFrameAt = timestamp;
    const hoverEase = Math.min(1, deltaTime * 8.0);
    state.hoverUv[0] += (state.hoverTargetUv[0] - state.hoverUv[0]) * hoverEase;
    state.hoverUv[1] += (state.hoverTargetUv[1] - state.hoverUv[1]) * hoverEase;
    state.hoverStrength += (state.hoverTargetStrength - state.hoverStrength) * hoverEase;
    if (!state.reducedMotion) {
      if (!state.activePointer?.dragging) {
        state.yaw += deltaTime * 0.105 + state.velocityYaw * deltaTime;
        state.pitch += state.velocityPitch * deltaTime;
        state.velocityYaw *= Math.pow(0.94, deltaTime * 60);
        state.velocityPitch *= Math.pow(0.94, deltaTime * 60);
        if (idleFor > 2500) {
          state.pitch += (-0.32 - state.pitch) * Math.min(1, deltaTime * 0.9);
        }
      }
    } else {
      state.velocityYaw = 0;
      state.velocityPitch = 0;
    }

    resize();
    const { program, uniforms, geometry } = resources;
    const packed = packUniforms();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(geometry.vao);
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.uRotation, state.yaw, state.pitch);
    gl.uniform1f(uniforms.uTime, secondsNow());
    gl.uniform1f(uniforms.uWaveAmplitude, state.reducedMotion ? 0 : 0.055);
    gl.uniform1f(uniforms.uReducedMotion, state.reducedMotion ? 1 : 0);
    gl.uniform4fv(uniforms['uPokes[0]'], packed.pokeData);
    gl.uniform1fv(uniforms['uPokeRelease[0]'], packed.releaseData);
    gl.uniform3f(uniforms.uHover, state.hoverUv[0], state.hoverUv[1], state.hoverStrength);
    gl.uniform1f(uniforms.uGridCount, window.matchMedia('(max-width: 767px)').matches ? 24 : 34);
    gl.uniform1f(uniforms.uLineWidth, 0.38);
    gl.uniform1f(uniforms.uNodeSize, 1.05);
    gl.uniform1i(uniforms.uVariant, state.variant === 'ribbon' ? 1 : 0);
    gl.uniform4fv(uniforms['uBreaks[0]'], packed.breakData);
    gl.uniform4fv(uniforms['uDamages[0]'], packed.damageData);
    gl.uniform3fv(uniforms.uTeal400, colors.teal400);
    gl.uniform3fv(uniforms.uTeal200, colors.teal200);
    gl.uniform3fv(uniforms.uWhite, colors.white);
    gl.drawElements(gl.TRIANGLES, geometry.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    state.fpsFrames += 1;
    if (fpsOutput && timestamp - state.lastFpsUpdate >= 1000) {
      fpsOutput.value = Math.round(state.fpsFrames * 1000 / (timestamp - state.lastFpsUpdate)) + ' FPS';
      fpsOutput.textContent = fpsOutput.value;
      state.fpsFrames = 0;
      state.lastFpsUpdate = timestamp;
    }

    const frameTime = previousFrameAt ? timestamp - previousFrameAt : deltaTime * 1000;
    state.frameTimes.push(frameTime);
    if (state.frameTimes.length > 120) {
      state.frameTimes.shift();
    }
    if (!state.qualityReduced && state.frameTimes.length === 120) {
      const average = state.frameTimes.reduce((sum, sample) => sum + sample, 0) / state.frameTimes.length;
      if (average > 22) {
        state.qualityReduced = true;
        state.dprCap = 1.25;
        const mobile = window.matchMedia('(max-width: 767px)').matches;
        const replacement = makeGeometry(gl, mobile ? 72 : 128);
        cleanupGeometry(geometry);
        resources.geometry = replacement;
        state.frameTimes.length = 0;
      }
    }
    if (!state.reducedMotion || hasRecoveringPoke()) {
      state.animationFrame = requestAnimationFrame(renderFrame);
    } else if (fpsOutput) {
      fpsOutput.value = 'STILL';
      fpsOutput.textContent = 'STILL';
    }
  }

  function startRendering() {
    if (state.visible && !document.hidden && !state.lost && !state.animationFrame) {
      state.lastFrameAt = 0;
      state.animationFrame = requestAnimationFrame(renderFrame);
    }
  }

  function pauseRendering() {
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = 0;
    }
  }

  function readColor(name, fallback) {
    if (!scratchColor) {
      return parseCssColor(fallback, fallback);
    }
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return parseCssColor(value, fallback, scratchColor);
  }

  function setReducedMotion(event) {
    state.reducedMotion = event.matches;
    state.lastInputAt = performance.now();
    if (event.matches) {
      state.hoverTargetStrength = 0;
      state.hoverStrength = 0;
    }
    startRendering();
  }

  function setVariant(variant) {
    state.variant = variant === 'ribbon' ? 'ribbon' : 'insert';
    state.lastInputAt = performance.now();
    startRendering();
  }

  function handleContextLost(event) {
    event.preventDefault();
    state.lost = true;
    pauseRendering();
    root.dataset.meshState = 'fallback';
  }

  function handleContextRestored() {
    try {
      gl = canvas.getContext('webgl2');
      resources = buildResources();
      state.lost = false;
      root.dataset.meshState = 'ready';
      startRendering();
    } catch (error) {
      root.dataset.meshState = 'fallback';
      console.error('Footer mesh could not restore WebGL.', error);
    }
  }

  try {
    resources = buildResources();
    root.dataset.meshState = 'ready';
  } catch (error) {
    root.dataset.meshState = 'fallback';
    console.error('Footer mesh initialization failed.', error);
    return { destroy() {}, setVariant() {} };
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerleave', pointerLeave);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerCancel);
  canvas.addEventListener('lostpointercapture', pointerCancel);
  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
  document.addEventListener('visibilitychange', startRendering);
  motionQuery.addEventListener?.('change', setReducedMotion);
  window.addEventListener('resize', resize);
  resizeObserver = new ResizeObserver(() => {
    resize();
    startRendering();
  });
  resizeObserver.observe(root);
  visibilityObserver = new IntersectionObserver((entries) => {
    state.visible = Boolean(entries[0]?.isIntersecting);
    if (state.visible) {
      startRendering();
    } else {
      pauseRendering();
    }
  }, { rootMargin: '100px' });
  visibilityObserver.observe(root);

  return {
    setVariant,
    destroy() {
      state.destroyed = true;
      pauseRendering();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerCancel);
      canvas.removeEventListener('lostpointercapture', pointerCancel);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      document.removeEventListener('visibilitychange', startRendering);
      motionQuery.removeEventListener?.('change', setReducedMotion);
      window.removeEventListener('resize', resize);
      cleanupGeometry(resources?.geometry);
      if (resources?.program) {
        gl.deleteProgram(resources.program);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      root.dataset.meshState = 'idle';
    }
  };
}