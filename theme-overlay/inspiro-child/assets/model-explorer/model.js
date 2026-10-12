import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { vertexSource, fragmentSource, MAX_POKES, MAX_BREAKS, MAX_DAMAGE_EVENTS, BREAK_HEAL_SECONDS, DAMAGE_RECOVERY_SECONDS } from './footer-mesh.js';

const host = document.getElementById('scene');
const canvas = host.querySelector('canvas');
const motion = document.getElementById('motion');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
motion.checked = !preference.matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
} catch (error) {
  host.classList.add('failed');
  document.querySelectorAll('button,input').forEach(control => { control.disabled = true; });
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
const controls = new OrbitControls(camera, canvas);
canvas.style.touchAction = 'pan-y';
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = 1.45;
controls.autoRotateSpeed = 0.18;
const model = new THREE.Group();
model.rotation.x = -Math.PI / 2;
scene.add(model);
const width = 5.8;
const depth = 3.6;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const drawingSize = new THREE.Vector2();
const pokes = [];
const breaks = [];
const damages = [];
let active = null;
let separated = false;
let focus = 'all';
let lastBreak = -Infinity;
const hover = new THREE.Vector3(0.5, 0.5, 0);
const uniforms = {
  uResolution: { value: new THREE.Vector2() },
  uRotation: { value: new THREE.Vector2(0, 0) },
  uTime: { value: 0 },
  uWaveAmplitude: { value: 0.055 },
  uReducedMotion: { value: 0 },
  uPokes: { value: Array.from({ length: MAX_POKES }, () => new THREE.Vector4()) },
  uPokeRelease: { value: new Float32Array(MAX_POKES).fill(-2) },
  uHover: { value: hover },
  uBreaks: { value: Array.from({ length: MAX_BREAKS }, () => new THREE.Vector4()) },
  uDamages: { value: Array.from({ length: MAX_DAMAGE_EVENTS }, () => new THREE.Vector4()) },
  uGridCount: { value: 34 },
  uLineWidth: { value: 0.38 },
  uNodeSize: { value: 1.05 },
  uVariant: { value: 0 },
  uTeal400: { value: new THREE.Vector3(0.373, 0.788, 0.769) },
  uTeal200: { value: new THREE.Vector3(0.659, 0.902, 0.878) },
  uWhite: { value: new THREE.Vector3(1, 1, 1) },
  uOpacity: { value: 1 }
};
const barrierVertex = vertexSource.replace('#version 300 es\n', '')
  .replace('in vec3 aPosition;', 'uniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nin vec3 aPosition;')
  .replace('gl_Position = vec4(clipPoint, clamp(turned.z * 0.12, -0.2, 0.2), 1.0);', 'gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 1.0);');
const barrierFragment = fragmentSource.replace('#version 300 es\n', '')
  .replace('uniform float uTime;', 'uniform float uOpacity;\nuniform float uTime;')
  .replace('fragColor = vec4(color, alpha);', 'fragColor = vec4(color, alpha * uOpacity);');
const barrierGeometry = new THREE.PlaneGeometry(width, depth, 96, 64);
barrierGeometry.setAttribute('aPosition', barrierGeometry.getAttribute('position'));
barrierGeometry.setAttribute('aUv', barrierGeometry.getAttribute('uv'));
const barrierMaterial = new THREE.RawShaderMaterial({
  vertexShader: barrierVertex, fragmentShader: barrierFragment, uniforms,
  glslVersion: THREE.GLSL3, transparent: true, depthWrite: false,
  side: THREE.DoubleSide, blending: THREE.AdditiveBlending
});
const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
barrier.position.z = 0.65;
barrier.renderOrder = 3;
model.add(barrier);

const layers = [{ key: 'barrier', mesh: barrier, top: 0.65, target: 1 }];
function buildTissue(key, top, color, divisions, opacity, relief) {
  const geometry = new THREE.PlaneGeometry(width, depth, divisions, Math.round(divisions * depth / width));
  const positions = geometry.attributes.position;
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const horizontal = positions.getX(vertex);
    const vertical = positions.getY(vertex);
    const seed = Math.sin(vertex * 127.1 + 19.7) * 43758.5453;
    const noise = seed - Math.floor(seed) - 0.5;
    if (Math.abs(horizontal) < width / 2 - 0.01 && Math.abs(vertical) < depth / 2 - 0.01) {
      positions.setX(vertex, horizontal + noise * width / divisions * 0.65);
      positions.setY(vertex, vertical + Math.sin(vertex * 3.91) * depth / divisions * 0.4);
    }
    positions.setZ(vertex, (Math.sin(horizontal * 2 + vertical) * 0.4 + noise) * relief);
  }
  geometry.computeVertexNormals();
  const tissueUniforms = {
    time: { value: 0 }, alpha: { value: opacity }, tone: { value: new THREE.Color(color) },
    ripple: { value: new THREE.Vector3(0.5, 0.5, 0) }, moving: { value: 1 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms: tissueUniforms, transparent: true, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 surfaceUv; varying float elevation; uniform float time; uniform float moving; uniform vec3 ripple;
      void main(){surfaceUv=uv;vec3 point=position;
        float distanceToImpact=length(uv-ripple.xy);
        point.z+=sin(point.x*1.4+point.y+time*0.65)*0.022*moving;
        point.z-=exp(-distanceToImpact*distanceToImpact*45.0)*ripple.z;
        elevation=point.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.0);}`,
    fragmentShader: `varying vec2 surfaceUv; varying float elevation; uniform vec3 tone; uniform float alpha;
      void main(){vec2 edge=abs(surfaceUv-0.5)*2.0;float fade=1.0-smoothstep(0.66,1.0,max(edge.x,edge.y));
        float facet=0.45+clamp(abs(elevation)*2.5,0.0,0.5);gl_FragColor=vec4(tone,alpha*fade*facet);}`
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = top;
  model.add(mesh);
  const edges = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: key === 'epidermis' ? 0.025 : 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.add(edges);
  layers.push({ key, top, mesh, edges, opacity, target: opacity, edgeOpacity: edges.material.opacity });
}
buildTissue('epidermis', 0.26, 0xabc6ed, 26, 0.24, 0.07);
buildTissue('dermis', -0.54, 0xd49fa5, 13, 0.22, 0.50);

function frameView() {
  const aspect = host.clientWidth / host.clientHeight;
  camera.aspect = aspect;
  const angle = THREE.MathUtils.degToRad(camera.fov / 2);
  const horizontalAngle = Math.atan(Math.tan(angle) * aspect);
  const radius = Math.hypot(width / 2, depth / 2, 1.3);
  const distance = radius / Math.sin(Math.min(angle, horizontalAngle)) * 1.03;
  camera.position.copy(new THREE.Vector3(0.20, 0.52, 0.84).normalize().multiplyScalar(distance));
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
}
function resize() {
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.getDrawingBufferSize(uniforms.uResolution.value);
  uniforms.uGridCount.value = host.clientWidth < 700 ? 24 : 34;
  frameView();
}
new ResizeObserver(resize).observe(host);
document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {
  focus = button.dataset.layer;
  document.querySelectorAll('[data-layer]').forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
  for (const layer of layers) layer.target = focus === 'all' || focus === layer.key ? (layer.opacity ?? 1) : (layer.opacity ?? 1) * 0.15;
  document.getElementById('scene-note').textContent = focus === 'all' ? 'Full-thickness structure' : button.textContent;
}));
document.getElementById('separate').addEventListener('change', event => { separated = event.target.checked; });
document.getElementById('reset').addEventListener('click', frameView);
preference.addEventListener('change', event => { motion.checked = !event.matches; });
function pointerUv(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(barrier)[0];
  if (!hit || Math.max(Math.abs(hit.uv.x - 0.5), Math.abs(hit.uv.y - 0.5)) > 0.47) return null;
  return hit.uv.clone();
}
function addDamage(uv, strength) {
  damages.push({ uv: uv.clone(), start: clock.getElapsedTime(), strength });
  if (damages.length > MAX_DAMAGE_EVENTS) damages.shift();
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 && event.pointerType !== 'touch') return;
  const uv = pointerUv(event);
  if (!uv) return;
  const poke = { uv, start: clock.getElapsedTime(), release: -1, strength: Math.max(0.55, event.pressure || 0.5) };
  pokes.push(poke);
  if (pokes.length > MAX_POKES) pokes.shift();
  addDamage(uv, 0.8);
  active = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, time: performance.now(), poke, broke: false };
});
canvas.addEventListener('pointermove', event => {
  const uv = pointerUv(event);
  hover.set(uv?.x ?? 0.5, uv?.y ?? 0.5, uv && event.pointerType !== 'touch' ? 0.25 : 0);
  if (!active || active.id !== event.pointerId) return;
  const now = performance.now();
  const interval = Math.max(0.008, (now - active.time) / 1000);
  const horizontalSpeed = Math.abs(event.clientX - active.lastX) / interval;
  const verticalSpeed = Math.abs(event.clientY - active.lastY) / interval;
  if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 6 && active.poke.release < 0) active.poke.release = clock.getElapsedTime();
  else if (uv && active.poke.release < 0) active.poke.uv.copy(uv);
  const time = clock.getElapsedTime();
  if (uv && !preference.matches && !active.broke && horizontalSpeed > 1000 && horizontalSpeed > verticalSpeed && time - lastBreak > 0.18) {
    const grid = uniforms.uGridCount.value;
    breaks.push({ uv: new THREE.Vector2(Math.round(uv.x * grid) / grid, Math.round(uv.y * grid) / grid), start: time, strength: 1 });
    if (breaks.length > MAX_BREAKS) breaks.shift();
    addDamage(uv, 1.25);
    lastBreak = time;
    active.broke = true;
  }
  active.lastX = event.clientX;
  active.lastY = event.clientY;
  active.time = now;
});
function release(event) {
  if (!active || active.id !== event.pointerId) return;
  active.poke.release = clock.getElapsedTime();
  active = null;
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('lostpointercapture', release);
canvas.addEventListener('pointerleave', () => { hover.z = 0; });
function pack(events, output, now, lifetime) {
  for (let index = events.length - 1; index >= 0; index--) if (events[index].release !== -1 && now - (events[index].release ?? events[index].start) > lifetime) events.splice(index, 1);
  output.forEach((vector, index) => {
    const event = events[index];
    if (event) vector.set(event.uv.x, event.uv.y, event.start, event.strength);
    else vector.set(0, 0, 0, 0);
  });
}
function draw() {
  const time = clock.getElapsedTime();
  const moving = motion.checked && !preference.matches;
  controls.autoRotate = moving && !document.hidden;
  controls.update();
  uniforms.uTime.value = time;
  uniforms.uReducedMotion.value = moving ? 0 : 1;
  pack(pokes, uniforms.uPokes.value, time, 1.6);
  pack(breaks, uniforms.uBreaks.value, time, BREAK_HEAL_SECONDS);
  pack(damages, uniforms.uDamages.value, time, DAMAGE_RECOVERY_SECONDS);
  uniforms.uPokeRelease.value.fill(-2);
  pokes.forEach((poke, index) => { uniforms.uPokeRelease.value[index] = poke.release; });
  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index];
    const height = layer.top + (separated ? (1 - index) * 0.65 : 0);
    layer.mesh.position.z = THREE.MathUtils.lerp(layer.mesh.position.z, height, 0.08);
    if (index === 0) uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, layer.target, 0.08);
    else {
      layer.mesh.material.uniforms.time.value = time;
      layer.mesh.material.uniforms.moving.value = moving ? 1 : 0;
      layer.mesh.material.uniforms.alpha.value = THREE.MathUtils.lerp(layer.mesh.material.uniforms.alpha.value, layer.target, 0.08);
      layer.edges.material.opacity = layer.edgeOpacity * (focus === 'all' || focus === layer.key ? 1 : 0.15);
      const recent = damages.at(-1);
      const age = recent ? time - recent.start - index * 0.12 : 10;
      const response = age > 0 ? Math.sin(Math.min(age * 6, Math.PI)) * Math.exp(-age * 1.8) * 0.08 / index : 0;
      layer.mesh.material.uniforms.ripple.value.set(recent?.uv.x ?? 0.5, recent?.uv.y ?? 0.5, response);
    }
  }
  canvas.dataset.pokes = String(pokes.length);
  canvas.dataset.breaks = String(breaks.length);
  canvas.dataset.damages = String(damages.length);
  canvas.dataset.barrierSource = 'footer-lab';
  renderer.render(scene, camera);
}
function updateVisibility() {
  const visible = !document.hidden && document.documentElement.dataset.modelVisible !== 'false';
  renderer.setAnimationLoop(visible ? draw : null);
  canvas.dataset.rendering = String(visible);
}
new MutationObserver(updateVisibility).observe(document.documentElement, { attributes: true, attributeFilter: ['data-model-visible'] });
document.addEventListener('visibilitychange', updateVisibility);
resize();
updateVisibility();