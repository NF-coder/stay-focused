const btn = document.getElementById('toggle');
const domainInput = document.getElementById('domainInput');
const addDomainBtn = document.getElementById('addDomain');
const domainList = document.getElementById('domainList');
const featureSettings = document.getElementById('featureSettings');
const blockVisibilityInput = document.getElementById('blockVisibility');
const blockBlurInput = document.getElementById('blockBlur');
const reloadNotice = document.getElementById('reloadNotice');
const reloadPageBtn = document.getElementById('reloadPage');

const update = enabled => {
  btn.textContent = enabled ? 'Enabled' : 'Disabled';
  btn.style.backgroundColor = enabled ? '#2e7d32' : '#777b80';
  btn.style.color = 'white';
  featureSettings.classList.toggle('disabled', !enabled);
  blockVisibilityInput.disabled = !enabled;
  blockBlurInput.disabled = !enabled;
};

const getActiveTab = async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
};

const getCurrentDomain = async () => {
  const tab = await getActiveTab();
  if (tab) {
    try {
      const url = new URL(tab.url);
      return url.hostname;
    } catch {
      return '';
    }
  }
  return '';
};

const markPendingReload = async (tabId) => {
  const { pendingReloadTabs = [] } = await browser.storage.local.get('pendingReloadTabs');
  if (pendingReloadTabs.includes(tabId)) return;

  await browser.storage.local.set({ pendingReloadTabs: [...pendingReloadTabs, tabId] });
};

const markCurrentTabForReload = async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  await markPendingReload(tab.id);
  reloadNotice.classList.add('visible');
};

const updateReloadNotice = async () => {
  const tab = await getActiveTab();
  if (!tab?.id) {
    reloadNotice.classList.remove('visible');
    return;
  }

  const { pendingReloadTabs = [] } = await browser.storage.local.get('pendingReloadTabs');
  reloadNotice.classList.toggle('visible', pendingReloadTabs.includes(tab.id));
};

const renderDomainList = async () => {
  const { whitelistedDomains = [] } = await browser.storage.local.get('whitelistedDomains');
  domainList.innerHTML = '';
  
  whitelistedDomains.forEach(domain => {
    const item = document.createElement('div');
    item.className = 'domain-item';
    item.innerHTML = `
      <span>${domain}</span>
      <button class="remove-btn" data-domain="${domain}">✕</button>
    `;
    item.querySelector('button').onclick = async () => {
      const updated = whitelistedDomains.filter(d => d !== domain);
      await browser.storage.local.set({ whitelistedDomains: updated });
      await markCurrentTabForReload();
      renderDomainList();
    };
    domainList.appendChild(item);
  });
};

browser.storage.local.get(['enabled', 'blockVisibility', 'blockBlur']).then((result) => {
  const enabled = result.enabled !== false;
  update(enabled);
  blockVisibilityInput.checked = result.blockVisibility !== false;
  blockBlurInput.checked = result.blockBlur !== false;
});

getCurrentDomain().then(domain => {
  if (domain) {
    domainInput.placeholder = `e.g., ${domain}`;
  }
});

renderDomainList();
updateReloadNotice();

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.pendingReloadTabs) {
    updateReloadNotice();
  }
});

btn.onclick = async () => {
  const { enabled = true } = await browser.storage.local.get('enabled');
  const newState = !enabled;
  
  await browser.storage.local.set({ enabled: newState });
  await markCurrentTabForReload();
  update(newState);
};

blockVisibilityInput.onchange = async () => {
  await browser.storage.local.set({ blockVisibility: blockVisibilityInput.checked });
  await markCurrentTabForReload();
};

blockBlurInput.onchange = async () => {
  await browser.storage.local.set({ blockBlur: blockBlurInput.checked });
  await markCurrentTabForReload();
};

reloadPageBtn.onclick = async () => {
  const tab = await getActiveTab();
  if (tab?.id) await browser.tabs.reload(tab.id);
  window.close();
};

addDomainBtn.onclick = async () => {
  const domain = domainInput.value.trim().toLowerCase();
  
  if (!domain) {
    alert('Please enter a domain');
    return;
  }
  
  const { whitelistedDomains = [] } = await browser.storage.local.get('whitelistedDomains');
  
  if (whitelistedDomains.includes(domain)) {
    alert('Domain already whitelisted');
    return;
  }
  
  whitelistedDomains.push(domain);
  await browser.storage.local.set({ whitelistedDomains });
  await markCurrentTabForReload();
  
  domainInput.value = '';
  renderDomainList();
};

domainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomainBtn.click();
  }
});
