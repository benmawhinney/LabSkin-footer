(function (global) {
	'use strict';

	const instances = new WeakMap();

	function mount(root) {
		if (!root) {
			return null;
		}

		if (instances.has(root)) {
			return instances.get(root);
		}

		const canvas = root.querySelector('[data-footer-preview-canvas]');

		if (!canvas) {
			return null;
		}

		const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
		if (!ctx) {
			return null;
		}

		const reduceMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const colors = {
			magenta: '255, 30, 189',
			green: '109, 255, 60',
			blue: '21, 77, 255',
			amber: '255, 140, 53',
			cyan: '36, 245, 255',
			white: '248, 251, 255'
		};

		let width = 0;
		let height = 0;
		let dpr = 1;
		let seed = 9;
		let layerPoints = [];
		let rafId = 0;
		let isVisible = true;
		let destroyed = false;
		let lastFrame = 0;
		let staticLayer;
		let markerLayer;
		let nucleiLayer;
		let scanLayer;
		let backgroundLayer;

		const targetFps = reduceMotion ? 1 : 30;
		const frameInterval = 1000 / targetFps;

		const rand = function () {
			seed = (seed * 16807) % 2147483647;
			return (seed - 1) / 2147483646;
		};

		const lerp = function (a, b, t) {
			return a + (b - a) * t;
		};

		function makeLayer() {
			const buffer = document.createElement('canvas');
			buffer.width = Math.max(1, Math.floor(width * dpr));
			buffer.height = Math.max(1, Math.floor(height * dpr));
			const bufferCtx = buffer.getContext('2d', { alpha: true });
			bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
			return { canvas: buffer, ctx: bufferCtx };
		}

		function waveY(x, base, amp, phase, scale) {
			return base
				+ Math.sin(x * scale + phase) * amp
				+ Math.sin(x * scale * 2.1 + phase * 0.47) * amp * 0.34
				+ Math.sin(x * scale * 4.3 + phase * 1.7) * amp * 0.12;
		}

		function buildLayer(base, amp, phase, scale, samples) {
			const sampleCount = samples || 130;
			const pts = [];
			for (let i = -8; i <= sampleCount + 8; i += 1) {
				const x = (i / sampleCount) * width;
				pts.push({ x: x, y: waveY(x, base, amp, phase, scale) });
			}
			return pts;
		}

		function traceLayer(target, points) {
			points.forEach(function (p, index) {
				if (index === 0) {
					target.moveTo(p.x, p.y);
				} else {
					target.lineTo(p.x, p.y);
				}
			});
		}

		function strokeLayer(bufferCtx, points, rgba, lineWidth, glow, offsetY) {
			const yOffset = offsetY || 0;
			bufferCtx.save();
			bufferCtx.translate(0, yOffset);
			bufferCtx.beginPath();
			traceLayer(bufferCtx, points);
			bufferCtx.lineCap = 'round';
			bufferCtx.lineJoin = 'round';
			bufferCtx.shadowBlur = glow;
			bufferCtx.shadowColor = 'rgba(' + rgba + ', 0.72)';
			bufferCtx.strokeStyle = 'rgba(' + rgba + ', 0.84)';
			bufferCtx.lineWidth = lineWidth;
			bufferCtx.stroke();
			bufferCtx.restore();
		}

		function fillBetween(bufferCtx, top, bottom, rgba, alpha) {
			bufferCtx.save();
			bufferCtx.beginPath();
			traceLayer(bufferCtx, top);
			for (let i = bottom.length - 1; i >= 0; i -= 1) {
				const p = bottom[i];
				bufferCtx.lineTo(p.x, p.y);
			}
			bufferCtx.closePath();
			const gradient = bufferCtx.createLinearGradient(0, top[0].y, 0, bottom[0].y);
			gradient.addColorStop(0, 'rgba(' + rgba + ', ' + (alpha * 0.9) + ')');
			gradient.addColorStop(0.48, 'rgba(' + rgba + ', ' + (alpha * 0.42) + ')');
			gradient.addColorStop(1, 'rgba(' + rgba + ', ' + (alpha * 0.12) + ')');
			bufferCtx.fillStyle = gradient;
			bufferCtx.fill();
			bufferCtx.restore();
		}

		function paintStaticLayer(bufferCtx) {
			bufferCtx.clearRect(0, 0, width, height);
			fillBetween(bufferCtx, layerPoints[0], layerPoints[1], colors.amber, 0.22);
			fillBetween(bufferCtx, layerPoints[1], layerPoints[2], colors.magenta, 0.20);
			fillBetween(bufferCtx, layerPoints[2], layerPoints[3], colors.green, 0.12);
			strokeLayer(bufferCtx, layerPoints[0], colors.magenta, 4.2, 20, 0);
			strokeLayer(bufferCtx, layerPoints[0], colors.amber, 2.8, 18, 9);
			strokeLayer(bufferCtx, layerPoints[1], colors.magenta, 5.8, 28, 0);
			strokeLayer(bufferCtx, layerPoints[2], colors.green, 7.2, 34, 0);
			strokeLayer(bufferCtx, layerPoints[3], colors.green, 1.6, 14, 0);
		}

		function paintBackgroundLayer(bufferCtx) {
			bufferCtx.clearRect(0, 0, width, height);
			bufferCtx.fillStyle = 'rgba(0, 0, 0, 0.42)';
			bufferCtx.fillRect(0, 0, width, height);
			const vignette = bufferCtx.createRadialGradient(width * 0.52, height * 0.4, 0, width * 0.52, height * 0.4, Math.max(width, height) * 0.78);
			vignette.addColorStop(0, 'rgba(6, 11, 18, 0.2)');
			vignette.addColorStop(0.58, 'rgba(5, 8, 13, 0.5)');
			vignette.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
			bufferCtx.fillStyle = vignette;
			bufferCtx.fillRect(0, 0, width, height);
		}

		function paintMarkerLayer(bufferCtx) {
			const count = Math.round(width / 12);
			bufferCtx.clearRect(0, 0, width, height);
			bufferCtx.globalCompositeOperation = 'lighter';
			for (let i = 0; i < count; i += 1) {
				const x = rand() * width;
				const y = lerp(height * 0.13, height * 0.62, rand());
				const z = rand();
				const r = lerp(0.8, 3.6, rand()) * (0.75 + z * 1.1);
				const hue = rand() > 0.50 ? colors.green : rand() > 0.45 ? colors.amber : colors.magenta;
				const alpha = 0.14 + z * 0.52;
				bufferCtx.shadowBlur = 12 + r * 3;
				bufferCtx.shadowColor = 'rgba(' + hue + ', ' + alpha + ')';
				bufferCtx.fillStyle = 'rgba(' + hue + ', ' + alpha + ')';
				bufferCtx.beginPath();
				bufferCtx.arc(x, y, r, 0, Math.PI * 2);
				bufferCtx.fill();
			}
			bufferCtx.globalCompositeOperation = 'source-over';
		}

		function paintNucleiLayer(bufferCtx) {
			const count = Math.round(width / 26);
			bufferCtx.clearRect(0, 0, width, height);
			bufferCtx.globalCompositeOperation = 'lighter';
			for (let i = 0; i < count; i += 1) {
				const band = rand();
				const x = rand() * width;
				const y = lerp(height * 0.50, height * 0.92, band) + Math.sin(rand() * 8) * height * 0.035;
				const rx = lerp(4, 12, rand());
				const ry = lerp(2.4, 7, rand());
				const rot = lerp(-0.8, 0.8, rand());
				const alpha = lerp(0.42, 0.9, rand());
				bufferCtx.save();
				bufferCtx.translate(x, y);
				bufferCtx.rotate(rot);
				bufferCtx.shadowBlur = 18;
				bufferCtx.shadowColor = 'rgba(' + colors.blue + ', ' + alpha + ')';
				const gradient = bufferCtx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
				gradient.addColorStop(0, 'rgba(150, 180, 255, ' + alpha + ')');
				gradient.addColorStop(0.32, 'rgba(' + colors.blue + ', ' + (alpha * 0.86) + ')');
				gradient.addColorStop(1, 'rgba(' + colors.blue + ', 0)');
				bufferCtx.fillStyle = gradient;
				bufferCtx.beginPath();
				bufferCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
				bufferCtx.fill();
				bufferCtx.restore();
			}
			bufferCtx.globalCompositeOperation = 'source-over';
		}

		function paintScanLayer(bufferCtx) {
			bufferCtx.clearRect(0, 0, width, height);
			bufferCtx.strokeStyle = 'rgba(' + colors.cyan + ', 0.07)';
			bufferCtx.lineWidth = 1;
			for (let y = height * 0.08; y < height; y += height * 0.22) {
				bufferCtx.beginPath();
				bufferCtx.moveTo(0, y);
				bufferCtx.lineTo(width, y);
				bufferCtx.stroke();
			}
		}

		function drawCameraLayer(source, panX, panY, zoom, alpha) {
			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.translate(width * 0.5 + panX, height * 0.5 + panY);
			ctx.scale(zoom, zoom);
			ctx.drawImage(source.canvas, -width * 0.5, -height * 0.5, width, height);
			ctx.restore();
		}

		function drawScaleBar(t) {
			const x = 28;
			const y = height - 36;
			const pulse = reduceMotion ? 0.5 : 0.5 + Math.sin(t * 1.4) * 0.5;
			ctx.save();
			ctx.globalAlpha = 0.35 + pulse * 0.16;
			ctx.strokeStyle = 'rgba(' + colors.white + ', 0.7)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + 92, y);
			ctx.moveTo(x, y - 6);
			ctx.lineTo(x, y + 6);
			ctx.moveTo(x + 92, y - 6);
			ctx.lineTo(x + 92, y + 6);
			ctx.stroke();
			ctx.fillStyle = 'rgba(' + colors.white + ', 0.58)';
			ctx.font = '11px ui-sans-serif, system-ui';
			ctx.fillText('50 um', x + 30, y - 10);
			ctx.restore();
		}

		function drawFrame(time, force) {
			if (!force && time - lastFrame < frameInterval) {
				return;
			}

			lastFrame = time;
			const t = reduceMotion ? 12 : time * 0.001;
			const orbit = reduceMotion ? 0.24 : t * 0.18;
			const zoom = 1 + Math.sin(t * 0.21) * 0.075 + Math.sin(t * 0.07) * 0.045;
			const panX = Math.sin(orbit) * width * 0.055 + Math.sin(t * 0.043) * width * 0.035;
			const panY = Math.cos(orbit * 1.37) * height * 0.045;

			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(backgroundLayer.canvas, 0, 0, width, height);
			drawCameraLayer(staticLayer, panX * 0.6, panY * 0.5, zoom, 1);
			drawCameraLayer(markerLayer, panX * 1.08, panY * 0.9, zoom * 1.035, 0.82 + Math.sin(t * 0.9) * 0.08);
			drawCameraLayer(nucleiLayer, panX * 1.3, panY * 1.16, zoom * 1.075, 0.88);
			drawCameraLayer(scanLayer, 0, (t * 18) % (height * 0.22), 1, 0.72);
			drawScaleBar(t);
		}

		function animate(time) {
			if (destroyed || !isVisible) {
				return;
			}

			drawFrame(time, false);
			if (!reduceMotion) {
				rafId = global.requestAnimationFrame(animate);
			}
		}

		function resize() {
			dpr = Math.min(global.devicePixelRatio || 1, 1.35);
			width = canvas.clientWidth;
			height = canvas.clientHeight;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			seed = 12;
			layerPoints = [
				buildLayer(height * 0.18, height * 0.035, 0.2, 0.011),
				buildLayer(height * 0.30, height * 0.044, 1.1, 0.009),
				buildLayer(height * 0.43, height * 0.035, 2.8, 0.008),
				buildLayer(height * 0.58, height * 0.05, 4.2, 0.006),
				buildLayer(height * 0.78, height * 0.04, 2.2, 0.007)
			];

			staticLayer = makeLayer();
			markerLayer = makeLayer();
			nucleiLayer = makeLayer();
			scanLayer = makeLayer();
			backgroundLayer = makeLayer();
			paintBackgroundLayer(backgroundLayer.ctx);
			paintStaticLayer(staticLayer.ctx);
			paintMarkerLayer(markerLayer.ctx);
			paintNucleiLayer(nucleiLayer.ctx);
			paintScanLayer(scanLayer.ctx);
			drawFrame(global.performance.now(), true);
		}

		function start() {
			global.cancelAnimationFrame(rafId);
			lastFrame = 0;
			if (reduceMotion) {
				drawFrame(global.performance.now(), true);
				return;
			}
			rafId = global.requestAnimationFrame(animate);
		}

		function stop() {
			global.cancelAnimationFrame(rafId);
		}

		const handleVisibility = function () {
			isVisible = !document.hidden;
			if (isVisible) {
				start();
			} else {
				stop();
			}
		};

		const handleResize = function () {
			resize();
			if (isVisible) {
				start();
			}
		};

		const observer = 'IntersectionObserver' in global
			? new IntersectionObserver(function (entries) {
				isVisible = entries[0] && entries[0].isIntersecting;
				if (isVisible) {
					start();
				} else {
					stop();
				}
			}, { threshold: 0.02 })
			: null;

		document.addEventListener('visibilitychange', handleVisibility);
		global.addEventListener('resize', handleResize, { passive: true });
		if (observer) {
			observer.observe(canvas);
		}

		resize();
		start();

		const api = {
			destroy: function () {
				if (destroyed) {
					return;
				}
				destroyed = true;
				stop();
				document.removeEventListener('visibilitychange', handleVisibility);
				global.removeEventListener('resize', handleResize);
				if (observer) {
					observer.disconnect();
				}
			}
		};

		instances.set(root, api);
		return api;
	}

	global.FooterLabPreviewAnimation = {
		mount: mount
	};
})(window);
