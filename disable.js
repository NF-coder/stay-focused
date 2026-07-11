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

browser.storage.local.get([
  'enabled',
  'blockVisibility',
  'blockBlur',
  'whitelistedDomains',
  'pendingReloadTabs'
]).then((result) => {
  const isGloballyEnabled = result.enabled === true;

  const blockVisibility = result.blockVisibility !== false;
  const blockBlur = result.blockBlur !== false;
  const whitelistedDomains = result.whitelistedDomains || [];
  const isDomainWhitelisted = shouldEnableForDomain(whitelistedDomains);
  const isActive = isGloballyEnabled || isDomainWhitelisted;

  if (isActive && (blockVisibility || blockBlur)) {
    const script = document.createElement('script');
    script.textContent = `
      if (${blockVisibility}) {
        Object.defineProperty(document, 'hidden', {
          value: false,
          writable: false,
          configurable: true
        });

        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: false,
          configurable: true
        });

        Object.defineProperty(document, 'webkitHidden', {
          value: false,
          writable: false,
          configurable: true
        });

        ['visibilitychange', 'webkitvisibilitychange'].forEach(name => {
          window.addEventListener(name, event => event.stopImmediatePropagation(), true);
        });
      }

      if (${blockBlur}) {
        window.addEventListener('blur', event => event.stopImmediatePropagation(), true);
      }
    `;

    (document.documentElement || document.head).appendChild(script);
    script.remove();
  }

  if ((result.pendingReloadTabs || []).length > 0) {
    browser.runtime.sendMessage({ type: 'settingsApplied' });
  }
});