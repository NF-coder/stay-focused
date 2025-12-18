const script = document.createElement('script');
script.textContent = `
  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: false,
    configurable: true
  });

  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true,
    configurable: true
  });

  Object.defineProperty(document, 'webkitHidden', {
    value: false,
    writable: false,
    configurable: true
  });

  ['visibilitychange', 'webkitvisibilitychange', 'blur'].forEach(name => {
    window.addEventListener(
      name,
      e => e.stopImmediatePropagation(),
      true
    );
  });
`;

browser.storage.local.get('enabled').then((result) => {
  if (result.enabled === true) {
    (document.documentElement || document.head).appendChild(script);
    script.remove();
  }
});