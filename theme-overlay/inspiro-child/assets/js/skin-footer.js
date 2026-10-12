/* Fluorescent Skin Footer v1.0. Dependency-free; camera movement only.
 * A 2D source cannot support a true 3D orbit or recovered optical sections.
 * This implementation preserves every structure's relationship to the others.
 */
(function (global) {
  'use strict';
  const instances = new WeakMap();
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function cameraAt(progress) {
    const a = progress * TAU;
    return {
      x: .50 + .15 * Math.sin(a),
      y: .47 - .16 * Math.cos(a),
      zoom: 1.06 + .46 * (1 - Math.cos(a)) / 2,
      roll: .048 * Math.sin(a)
    };
  }

  function mount(root, options = {}) {
    if (!root) throw new Error('SkinFooter.mount requires a footer element.');
    if (instances.has(root)) return instances.get(root);
    const image = root.querySelector('.skin-footer__image');
    const scene = root.querySelector('.skin-footer__scene');
    const button = root.querySelector('.skin-footer__motion');
    if (!image || !scene) throw new Error('SkinFooter: image and scene are required.');
    const requestedDuration = Number(options.duration);
    const duration = Number.isFinite(requestedDuration) && requestedDuration > 0
      ? Math.max(30000, requestedDuration) : 72000;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const originalStyle = image.getAttribute('style');
    let animation = null, elapsed = 0, visible = false, destroyed = false;
    let ready = false, failed = false, paused = false;
    const supported = typeof image.animate === 'function';
    const restricted = () => reduced.matches || Boolean(connection && connection.saveData);
    const isRunning = () => ready && supported && !failed && !paused &&
      !restricted() && visible && !document.hidden;

    function announce() {
      if (button) {
        button.hidden = false;
        button.disabled = !ready || restricted() || !supported || failed;
        button.textContent = failed ? 'Background unavailable' : !ready ? 'Loading background' :
          restricted() || !supported ? 'Static background' : paused ? 'Play background' : 'Pause background';
      }
      root.dispatchEvent(new CustomEvent('skinfooterstate', {detail: {
        paused, running: isRunning(), reducedMotion: reduced.matches,
        saveData: Boolean(connection && connection.saveData), ready, failed
      }}));
    }

    function sync() {
      if (animation) {
        if (isRunning()) animation.play();
        else animation.pause();
      }
      announce();
    }

    function matrix(progress, width, height) {
      const p = cameraAt(progress);
      const iw = image.naturalWidth, ih = image.naturalHeight;
      const cs = Math.cos(p.roll), sn = Math.sin(p.roll);
      const rw = Math.abs(cs) * width + Math.abs(sn) * height;
      const rh = Math.abs(sn) * width + Math.abs(cs) * height;
      const scale = Math.max(rw / iw, rh / ih) * p.zoom * 1.025;
      const hx = rw / (2 * scale), hy = rh / (2 * scale);
      const cx = clamp(p.x * iw, hx, iw - hx);
      const cy = clamp(p.y * ih, hy, ih - hy);
      const a = cs * scale, b = sn * scale, c = -b, d = a;
      const tx = width / 2 - a * cx - c * cy;
      const ty = height / 2 - b * cx - d * cy;
      return `matrix(${a},${b},${c},${d},${tx},${ty})`;
    }

    function rebuild() {
      if (!ready || destroyed) return;
      if (animation) {
        elapsed = Number(animation.currentTime) || elapsed;
        animation.cancel();
        animation = null;
      }
      const width = scene.clientWidth, height = scene.clientHeight;
      if (!width || !height) return;
      image.style.width = image.naturalWidth + 'px';
      image.style.height = image.naturalHeight + 'px';
      image.style.objectFit = 'fill';
      image.style.transform = matrix(0, width, height);
      if (supported && !restricted()) {
        const keyframes = Array.from({length: 181}, (_, i) => ({
          offset: i / 180, transform: matrix(i / 180, width, height)
        }));
        animation = image.animate(keyframes, {duration, iterations: Infinity, easing: 'linear'});
        animation.pause();
        animation.currentTime = elapsed;
      }
      sync();
    }

    async function loaded() {
      if (ready || destroyed || !image.naturalWidth) return;
      try { if (image.decode) await image.decode(); } catch (_) { /* onload already validated */ }
      if (destroyed) return;
      ready = true;
      image.setAttribute('data-ready', '');
      rebuild();
    }
    function error() { failed = true; if (animation) animation.cancel(); announce(); }
    function toggle() { paused = !paused; sync(); }
    image.addEventListener('load', loaded);
    image.addEventListener('error', error);
    button?.addEventListener('click', toggle);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', rebuild);
    connection?.addEventListener('change', rebuild);
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(rebuild) : null;
    resize?.observe(scene);
    if (!resize) global.addEventListener('resize', rebuild);
    const rootBounds = root.getBoundingClientRect();
    visible = rootBounds.bottom > 0 && rootBounds.top < global.innerHeight;
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, {threshold: 0}) : null;
    if (observer) observer.observe(root);
    else visible = true;

    const api = {
      play() { paused = false; sync(); },
      pause() { paused = true; sync(); },
      seek(progress) {
        paused = true;
        elapsed = clamp(Number(progress) || 0, 0, 1) * duration;
        if (animation) animation.currentTime = elapsed;
        sync();
      },
      getState() { return {ready, failed, paused, running: isRunning(),
        progress: ((Number(animation?.currentTime) || elapsed) % duration) / duration}; },
      destroy() {
        destroyed = true;
        animation?.cancel(); resize?.disconnect(); observer?.disconnect();
        image.removeEventListener('load', loaded); image.removeEventListener('error', error);
        button?.removeEventListener('click', toggle);
        document.removeEventListener('visibilitychange', sync);
        reduced.removeEventListener('change', rebuild);
        connection?.removeEventListener('change', rebuild);
        global.removeEventListener('resize', rebuild);
        image.removeAttribute('data-ready');
        if (originalStyle === null) image.removeAttribute('style');
        else image.setAttribute('style', originalStyle);
        if (button) button.hidden = true;
        instances.delete(root);
      }
    };
    instances.set(root, api);
    announce();
    if (image.complete && image.naturalWidth) loaded();
    else if (image.complete && image.getAttribute('src')) error();
    return api;
  }
  global.SkinFooter = Object.freeze({mount});
})(window);
