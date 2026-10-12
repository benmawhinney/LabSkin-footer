(function () {
  'use strict';
  if (window.parent === window) return;
  document.documentElement.dataset.modelVisible = 'false';
  let previousHeight = 0;
  function reportSize() {
    const height = Math.ceil(document.querySelector('.explorer').getBoundingClientRect().height);
    if (height === previousHeight) return;
    previousHeight = height;
    window.parent.postMessage({ type: 'labskin-model-size', height }, window.location.origin);
  }
  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== 'labskin-model-visibility') return;
    document.documentElement.dataset.modelVisible = String(event.data.visible === true);
  });
  new ResizeObserver(reportSize).observe(document.querySelector('.explorer'));
  window.addEventListener('load', reportSize);
  reportSize();
})();