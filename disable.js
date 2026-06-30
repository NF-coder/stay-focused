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

const shouldEnableForDomain = (whitelistedDomains) => {
  try {
    const currentDomain = new URL(window.location.href).hostname;
    return whitelistedDomains.some(domain => 
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

browser.storage.local.get(['enabled', 'whitelistedDomains']).then((result) => {
  const isGloballyEnabled = result.enabled === true;
  const whitelistedDomains = result.whitelistedDomains || [];
  const isDomainWhitelisted = shouldEnableForDomain(whitelistedDomains);
  
  if (isGloballyEnabled || isDomainWhitelisted) {
    (document.documentElement || document.head).appendChild(script);
    script.remove();
  }
});