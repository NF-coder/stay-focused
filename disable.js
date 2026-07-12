const findMatchingRule = (rules) => {
  try {
    const currentDomain = new URL(window.location.href).hostname;
    return rules
      .filter(rule =>
        currentDomain === rule.domain || currentDomain.endsWith('.' + rule.domain)
      )
      .sort((a, b) => b.domain.length - a.domain.length)[0] || null;
  } catch {
    return null;
  }
};

const resolveRule = (globalValue, ruleValue) => {
  if (ruleValue === 'block') return true;
  if (ruleValue === 'allow') return false;
  return globalValue;
};

browser.storage.local.get([
  'enabled',
  'blockVisibility',
  'blockBlur',
  'domainRules',
  'pendingReloadTabs'
]).then((result) => {
  const isGloballyEnabled = result.enabled === true;
  const matchingRule = findMatchingRule(result.domainRules || []);
  const blockVisibility = resolveRule(
    isGloballyEnabled && result.blockVisibility !== false,
    matchingRule?.visibility
  );
  const blockBlur = resolveRule(
    isGloballyEnabled && result.blockBlur !== false,
    matchingRule?.blur
  );

  if (blockVisibility || blockBlur) {
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