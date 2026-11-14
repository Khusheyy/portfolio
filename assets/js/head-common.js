(function () {
  // Prevent double-injection
  if (document.head.dataset.commonInjected) return;
  document.head.dataset.commonInjected = '1';

  function addIfMissing(selector, createFn) {
    try {
      if (!document.head.querySelector(selector)) {
        document.head.appendChild(createFn());
      }
    } catch (e) {
      // selector may be complex; fallback to always append
      document.head.appendChild(createFn());
    }
  }

  addIfMissing('meta[charset]', function () {
    var m = document.createElement('meta');
    m.setAttribute('charset', 'UTF-8');
    return m;
  });

  addIfMissing('meta[name="viewport"]', function () {
    var m = document.createElement('meta');
    m.setAttribute('name', 'viewport');
    m.setAttribute('content', 'width=device-width, initial-scale=1.0');
    return m;
  });

  // Only add default favicon if no favicon exists on the page
  (function () {
    try {
      if (!document.head.querySelector('link[rel="icon"]')) {
        var l = document.createElement('link');
        l.rel = 'icon';
        l.href = 'assets/images/galaxy.jpg';
        l.type = 'image/png';
        document.head.appendChild(l);
      }
    } catch (e) {
      // fallback: add the default favicon
      var l2 = document.createElement('link');
      l2.rel = 'icon';
      l2.href = 'assets/images/galaxy.jpg';
      l2.type = 'image/png';
      document.head.appendChild(l2);
    }
  })();

  addIfMissing('link[href="assets/css/styles.css"]', function () {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'assets/css/styles.css';
    return l;
  });

  addIfMissing('link[href*="font-awesome"]', function () {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    l.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
    l.crossOrigin = 'anonymous';
    l.referrerPolicy = 'no-referrer';
    return l;
  });

  // Theme initialization (same logic as existing pages)
  (function () {
    var key = 'theme';
    var stored;
    try { stored = localStorage.getItem(key); } catch (e) { }
    if (stored !== 'theme-light' && stored !== 'theme-dark') {
      try { stored = window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : 'theme-dark'; } catch (e) { stored = 'theme-dark'; }
    }
    // Only set if not already set by other scripts
    if (!document.documentElement.className) document.documentElement.className = stored;
  })();
})();
