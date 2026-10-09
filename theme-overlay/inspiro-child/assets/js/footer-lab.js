(function () {
	'use strict';

	const shell = document.querySelector('.footer-lab-shell');

	if (!shell) {
		return;
	}

	const storageKey = 'mcFooterLabVariant';
	const status = document.getElementById('footer-lab-status');
	const currentScriptUrl = document.currentScript ? new URL(document.currentScript.src) : null;
	const meshModuleUrl = window.footerMeshModuleUrl
		? new URL(window.footerMeshModuleUrl, window.location.href)
		: (currentScriptUrl ? new URL('./footer-mesh.js', currentScriptUrl) : null);
	const tabs = Array.from(document.querySelectorAll('[data-footer-variant]'));
	const panels = Array.from(document.querySelectorAll('[data-footer-panel]'));
	const labels = {
		current: 'Showing the live child-theme footer.',
		mesh: 'Showing the enhanced mesh footer built from the live child-theme layout.',
		preview: 'Showing the cleaned Evidence in every layer animated concept.',
		fluorescent: 'Showing the animated fluorescent concept with live footer content and motion controls.',
		github: 'Showing the LabSkin-Dev repo footer with live footer menus and social links.'
	};

	let previewMounted = false;
	let previewApi = null;
	let fluorescentMounted = false;
	let fluorescentApi = null;
	let meshObserver = null;
	let meshApi = null;
	let meshImporting = false;

	function mountPreviewPanel() {
		if (previewMounted || !window.FooterLabPreviewAnimation) {
			return;
		}

		const panel = document.querySelector('[data-footer-panel="preview"]');
		if (!panel) {
			return;
		}

		previewApi = window.FooterLabPreviewAnimation.mount(panel);
		previewMounted = Boolean(previewApi);
	}

	function mountMeshPanel() {
		if (meshApi || meshObserver || meshImporting || !meshModuleUrl) {
			return;
		}

		const root = document.querySelector('.footer-lab-mesh-footer');
		if (!root) {
			return;
		}

		meshObserver = new IntersectionObserver(function (entries) {
			if (!entries[0] || !entries[0].isIntersecting) {
				return;
			}

			meshObserver.disconnect();
			meshObserver = null;
			meshImporting = true;

			import(meshModuleUrl.href).then(function (module) {
				meshApi = module.mount(root);
				meshImporting = false;
				shell.querySelectorAll('[data-mesh-variant]').forEach(function (button) {
					button.addEventListener('click', function () {
						const variant = button.getAttribute('data-mesh-variant');
						meshApi.setVariant(variant);
						shell.querySelectorAll('[data-mesh-variant]').forEach(function (candidate) {
							candidate.setAttribute('aria-pressed', String(candidate === button));
						});
					});
				});
			}).catch(function (error) {
				meshImporting = false;
				root.dataset.meshState = 'fallback';
				console.error('Footer mesh module failed to load.', error);
			});
		}, { rootMargin: '400px 0px 400px 0px', threshold: 0.01 });

		meshObserver.observe(root);
	}

	function updateQuery(variant) {
		const url = new URL(window.location.href);
		url.searchParams.set('footer', variant);
		window.history.replaceState({}, '', url);
	}

	function mountFluorescentPanel() {
		if (fluorescentMounted || !window.SkinFooter) {
			return;
		}

		const root = document.getElementById('footer-lab-fluorescent');
		const range = document.querySelector('[data-skin-range]');
		const statusNode = document.getElementById('footer-lab-motion-status');
		const viewButtons = Array.from(document.querySelectorAll('[data-skin-view]'));
		const stopButtons = Array.from(document.querySelectorAll('[data-skin-position]'));

		if (!root || !range || !statusNode) {
			return;
		}

		fluorescentApi = window.SkinFooter.mount(root, { duration: 72000 });
		fluorescentMounted = true;

		const scrub = function (value) {
			fluorescentApi.seek(value);
			range.value = value * 100;
			range.setAttribute('aria-valuetext', Math.round(value * 100) + ' percent of camera journey');
		};

		viewButtons.forEach(function (button) {
			button.addEventListener('click', function () {
				const view = button.getAttribute('data-skin-view');
				root.dataset.view = view;
				viewButtons.forEach(function (candidate) {
					candidate.setAttribute('aria-pressed', String(candidate === button));
				});
			});
		});

		range.addEventListener('input', function () {
			scrub(Number(range.value) / 100);
		});

		stopButtons.forEach(function (button) {
			button.addEventListener('click', function () {
				scrub(Number(button.getAttribute('data-skin-position')));
			});
		});

		window.setInterval(function () {
			if (!fluorescentApi) {
				return;
			}

			const motionState = fluorescentApi.getState();

			if (motionState.running) {
				range.value = motionState.progress * 100;
				range.setAttribute('aria-valuetext', Math.round(motionState.progress * 100) + ' percent of camera journey');
			}
		}, 500);

		root.addEventListener('skinfooterstate', function (event) {
			const motionState = event.detail;

			if (motionState.failed) {
				statusNode.textContent = 'Image unavailable';
			} else if (motionState.reducedMotion || motionState.saveData) {
				statusNode.textContent = 'Motion preference respected - static view';
			} else if (motionState.paused) {
				statusNode.textContent = 'Journey paused - inspect the section';
			} else {
				statusNode.textContent = '72-second seamless journey';
			}

			range.disabled = motionState.reducedMotion || motionState.saveData || !motionState.ready || motionState.failed;
			stopButtons.forEach(function (button) {
				button.disabled = range.disabled;
			});
		});
	}

	function setVariant(variant) {
		tabs.forEach(function (tab) {
			const active = tab.getAttribute('data-footer-variant') === variant;
			tab.setAttribute('aria-selected', String(active));
			tab.setAttribute('aria-pressed', String(active));
		});

		panels.forEach(function (panel) {
			const active = panel.getAttribute('data-footer-panel') === variant;
			panel.classList.toggle('is-active', active);
			panel.hidden = !active;
			panel.setAttribute('aria-hidden', String(!active));
		});

		if (status) {
			status.textContent = labels[variant] || labels.current;
		}

		window.localStorage.setItem(storageKey, variant);
		updateQuery(variant);

		if ('preview' === variant) {
			mountPreviewPanel();
		}

		if ('mesh' === variant) {
			mountMeshPanel();
		}

		if ('fluorescent' === variant) {
			mountFluorescentPanel();
		}
	}

	tabs.forEach(function (tab) {
		tab.addEventListener('click', function () {
			setVariant(tab.getAttribute('data-footer-variant'));
		});
	});

	const initialVariant = (new URL(window.location.href)).searchParams.get('footer') || window.localStorage.getItem(storageKey) || 'current';
	setVariant(labels[initialVariant] ? initialVariant : 'current');
})();