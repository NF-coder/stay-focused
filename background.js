browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.get([
    'enabled',
    'blockVisibility',
    'blockBlur',
    'domainRules',
    'whitelistedDomains'
  ]).then((result) => {
    const defaults = {};

    if (result.enabled === undefined) defaults.enabled = true;
    if (result.blockVisibility === undefined) defaults.blockVisibility = true;
    if (result.blockBlur === undefined) defaults.blockBlur = true;
    if (result.domainRules === undefined) {
      defaults.domainRules = (result.whitelistedDomains || []).map(domain => ({
        domain,
        visibility: 'block',
        blur: 'block'
      }));
    }
    defaults.pendingReloadTabs = [];

    browser.storage.local.set(defaults).then(() => {
      browser.storage.local.remove('whitelistedDomains');
    });
  });
});

browser.runtime.onStartup.addListener(() => {
  browser.storage.local.set({ pendingReloadTabs: [] });
});

const clearPendingReload = (tabId) => {
  browser.storage.local.get('pendingReloadTabs').then(({ pendingReloadTabs = [] }) => {
    if (pendingReloadTabs.includes(tabId)) {
      browser.storage.local.set({
        pendingReloadTabs: pendingReloadTabs.filter(id => id !== tabId)
      });
    }
  });
};

browser.runtime.onMessage.addListener((request, sender) => {
  if (request.type !== 'settingsApplied' || !sender.tab?.id) return;
  clearPendingReload(sender.tab.id);
});