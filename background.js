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

    if (Object.keys(defaults).length > 0) {
      browser.storage.local.set(defaults);
    }
  });
});