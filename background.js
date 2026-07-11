browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.get([
    'enabled',
    'blockVisibility',
    'blockBlur',
    'whitelistedDomains'
  ]).then((result) => {
    const defaults = {};

    if (result.enabled === undefined) defaults.enabled = true;
    if (result.blockVisibility === undefined) defaults.blockVisibility = true;
    if (result.blockBlur === undefined) defaults.blockBlur = true;
    if (result.whitelistedDomains === undefined) defaults.whitelistedDomains = [];
    defaults.pendingReloadTabs = [];

    if (Object.keys(defaults).length > 0) {
      browser.storage.local.set(defaults);
    }
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