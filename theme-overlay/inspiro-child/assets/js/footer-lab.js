(function () {
	'use strict';

	const shell = document.querySelector('.footer-lab-shell');

	if (!shell) {
		return;
	}

	const storageKey = 'mcFooterLabVariant';
	const homepageMode = shell.hasAttribute('data-footer-homepage');
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
		github: 'Showing the LabSkin-Dev repo footer with live footer menus and social links.',
		meeples: 'Showing the Meeples lab strip: scientists at the bench with live Wetherby day, night and weather.'
	};

	let previewMounted = false;
	let previewApi = null;
	let fluorescentMounted = false;
	let fluorescentApi = null;
	let meshApi = null;
	let meshImporting = false;
	let meeplesAssets = null;
	let meeplesApi = null;

	function mountMeeplesPanel() {
		const panel = shell.querySelector('[data-footer-panel="meeples"]');
		const root = panel?.querySelector('.lsf-scene');
		if (!root || !currentScriptUrl) return;
		if (meeplesApi) {
			if (meeplesApi.resume) {
				meeplesApi.layout();
				meeplesApi.resume();
			}
			return;
		}
		if (!meeplesAssets) {
			const base = new URL('../meeples/', currentScriptUrl);
			meeplesAssets = Promise.all(['labskin-footer.css', 'labskin-footer.js'].map(function (name) {
				return new Promise(function (resolve, reject) {
					const asset = document.createElement(name.endsWith('.css') ? 'link' : 'script');
					const url = new URL(name, base);
					url.search = currentScriptUrl.search;
					if (name.endsWith('.css')) {
						asset.rel = 'stylesheet';
						asset.href = url.href;
					} else {
						asset.src = url.href;
						asset.async = true;
					}
					asset.onload = resolve;
					asset.onerror = function () { asset.remove(); reject(new Error('Meeple asset failed: ' + name)); };
					document.head.appendChild(asset);
				});
			}));
		}
		meeplesAssets.then(function () {
			if (panel.hidden || meeplesApi) return;
			meeplesApi = window.LabskinFooter.mount(root, {
				spritesUrl: root.dataset.lsfSprites,
				atlasUrl: root.dataset.lsfAtlas,
				logo: root.dataset.lsfLogo
			});
		}).catch(function (error) {
			meeplesAssets = null;
			root.dataset.error = 'assets';
			console.error('Meeple footer could not load.', error);
		});
	}

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
		if (meshApi || meshImporting || !meshModuleUrl) {
			return;
		}

		const root = document.querySelector('.footer-lab-mesh-footer');
		if (!root) {
			return;
		}

		meshImporting = true;
		import(meshModuleUrl.href).then(function (module) {
			meshApi = module.mount(root);
			meshImporting = false;
		}).catch(function (error) {
			meshImporting = false;
			root.dataset.meshState = 'fallback';
			console.error('Footer mesh module failed to load.', error);
			});
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

		const root = shell.querySelector('[data-footer-panel="fluorescent"] .footer-lab-fluorescent');
		if (!root) {
			return;
		}

		const image = root.querySelector('.skin-footer__image');
		if (image) {
			image.loading = 'eager';
		}

		fluorescentApi = window.SkinFooter.mount(root, { duration: 72000 });
		fluorescentMounted = Boolean(fluorescentApi);
	}

	function setVariant(variant) {
		tabs.forEach(function (tab) {
			const active = tab.getAttribute('data-footer-variant') === variant;
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

		if (!homepageMode) {
			window.localStorage.setItem(storageKey, variant);
			updateQuery(variant);
		}

		if ('preview' === variant) {
			mountPreviewPanel();
		}

		if ('github' === variant) {
			const banner = shell.querySelector('[data-footer-panel="github"] .footer-lab-github__banner img');
			if (banner) {
				banner.loading = 'eager';
			}
		}

		if ('mesh' === variant) {
			mountMeshPanel();
		}

		if ('fluorescent' === variant) {
			mountFluorescentPanel();
		}

		if ('meeples' === variant) {
			mountMeeplesPanel();
		}
	}

	tabs.forEach(function (tab) {
		tab.addEventListener('click', function () {
			setVariant(tab.getAttribute('data-footer-variant'));
		});
	});

	const initialVariant = (new URL(window.location.href)).searchParams.get('footer')
		|| (homepageMode ? 'current' : window.localStorage.getItem(storageKey) || 'current');
	setVariant(labels[initialVariant] ? initialVariant : 'current');
})();