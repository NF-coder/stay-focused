const btn = document.getElementById('toggle');
const domainInput = document.getElementById('domainInput');
const addDomainBtn = document.getElementById('addDomain');
const domainList = document.getElementById('domainList');
const featureSettings = document.getElementById('featureSettings');
const blockVisibilityInput = document.getElementById('blockVisibility');
const blockBlurInput = document.getElementById('blockBlur');

const update = enabled => {
  btn.textContent = enabled ? 'Enabled' : 'Disabled';
  btn.style.backgroundColor = enabled ? '#2e7d32' : '#777b80';
  btn.style.color = 'white';
  featureSettings.classList.toggle('disabled', !enabled);
  blockVisibilityInput.disabled = !enabled;
  blockBlurInput.disabled = !enabled;
};

const getCurrentDomain = async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    try {
      const url = new URL(tabs[0].url);
      return url.hostname;
    } catch {
      return '';
    }
  }
  return '';
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

btn.onclick = async () => {
  const { enabled = true } = await browser.storage.local.get('enabled');
  const newState = !enabled;
  
  await browser.storage.local.set({ enabled: newState });
  update(newState);
};

blockVisibilityInput.onchange = () => {
  browser.storage.local.set({ blockVisibility: blockVisibilityInput.checked });
};

blockBlurInput.onchange = () => {
  browser.storage.local.set({ blockBlur: blockBlurInput.checked });
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
  
  domainInput.value = '';
  renderDomainList();
};

domainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomainBtn.click();
  }
});
