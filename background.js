browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.get('enabled').then((result) => {
    if (result.enabled === undefined) {
      browser.storage.local.set({
        enabled: true,
        domains: []
      });
    }
  });
});