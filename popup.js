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

const markMatchingTabForReload = async (ruleDomain) => {
  const currentDomain = await getCurrentDomain();
  if (currentDomain === ruleDomain || currentDomain.endsWith('.' + ruleDomain)) {
    await markCurrentTabForReload();
  }
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

const RULE_STATES = ['block', 'inherit', 'allow'];
const RULE_LABELS = { block: 'Deny', inherit: 'Global', allow: 'Allow' };

const nextRuleState = (current) => {
  const index = RULE_STATES.indexOf(current);
  return RULE_STATES[(index + 1) % RULE_STATES.length];
};

const renderDomainList = async () => {
  const { domainRules = [] } = await browser.storage.local.get('domainRules');
  domainList.innerHTML = '';

  domainRules.forEach(rule => {
    const item = document.createElement('div');
    item.className = 'domain-item';

    const domain = document.createElement('span');
    domain.className = 'rule-domain';
    domain.textContent = rule.domain;

    const createRuleToggle = (api, label) => {
      const state = rule[api] || 'inherit';
      const toggle = document.createElement('button');
      toggle.className = 'rule-toggle';
      toggle.type = 'button';
      toggle.title = `${label}: ${RULE_LABELS[state]}`;
      toggle.setAttribute('aria-label', `${label}: ${RULE_LABELS[state]}`);

      const dot = document.createElement('span');
      dot.className = `rule-dot ${state}`;
      toggle.appendChild(dot);

      toggle.onclick = async () => {
        const updated = domainRules.map(item =>
          item.domain === rule.domain
            ? { ...item, [api]: nextRuleState(state) }
            : item
        );
        await browser.storage.local.set({ domainRules: updated });
        await markMatchingTabForReload(rule.domain);
        renderDomainList();
      };

      return toggle;
    };

    const blurToggle = createRuleToggle('blur', 'Blur');
    const visibilityToggle = createRuleToggle('visibility', 'Visibility API');

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.type = 'button';
    removeBtn.setAttribute('aria-label', `Remove rule for ${rule.domain}`);

    const removeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    removeIcon.setAttribute('viewBox', '0 0 24 24');
    removeIcon.setAttribute('aria-hidden', 'true');

    const removePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    removePath.setAttribute('d', 'M6 6l12 12M18 6L6 18');
    removeIcon.appendChild(removePath);
    removeBtn.appendChild(removeIcon);

    removeBtn.onclick = async (event) => {
      event.stopPropagation();
      const updated = domainRules.filter(item => item.domain !== rule.domain);
      await browser.storage.local.set({ domainRules: updated });
      await markMatchingTabForReload(rule.domain);
      renderDomainList();
    };

    item.append(domain, blurToggle, visibilityToggle, removeBtn);
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
    domainInput.value = domain;
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
  const rawDomain = domainInput.value.trim().toLowerCase();
  let domain;

  try {
    const value = rawDomain.includes('://') ? rawDomain : `http://${rawDomain}`;
    domain = new URL(value).hostname;
  } catch {
    domain = '';
  }

  if (!domain || domain.includes(' ')) {
    alert('Please enter a valid domain');
    return;
  }

  const { domainRules = [] } = await browser.storage.local.get('domainRules');
  if (domainRules.some(item => item.domain === domain)) {
    alert('A rule for this domain already exists');
    return;
  }

  const updated = [
    ...domainRules,
    { domain, visibility: 'allow', blur: 'allow' }
  ];

  await browser.storage.local.set({ domainRules: updated });

  domainInput.value = '';
  renderDomainList();
};

domainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomainBtn.click();
  }
});
