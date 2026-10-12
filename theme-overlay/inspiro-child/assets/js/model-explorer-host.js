(function () {
	'use strict';
	const frame = document.querySelector('[data-model-explorer-frame]');
	if (!frame) return;
	const origin = new URL(frame.src, window.location.href).origin;
	let visible = false;
	function announceVisibility() {
		frame.contentWindow?.postMessage({ type: 'labskin-model-visibility', visible: visible && !document.hidden }, origin);
	}
	window.addEventListener('message', function (event) {
		if (event.origin !== origin || event.source !== frame.contentWindow || event.data?.type !== 'labskin-model-size') return;
		const height = event.data.height;
		if (Number.isFinite(height) && height >= 400 && height <= 5000) frame.style.height = Math.ceil(height) + 'px';
		announceVisibility();
	});
	const observer = new IntersectionObserver(function (entries) {
		visible = entries.some(entry => entry.isIntersecting);
		announceVisibility();
	}, { rootMargin: '150px' });
	observer.observe(frame);
	frame.addEventListener('load', announceVisibility);
	document.addEventListener('visibilitychange', announceVisibility);
})();