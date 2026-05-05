const btn = document.getElementById('toggle');
const domainInput = document.getElementById('domainInput');
const addDomainBtn = document.getElementById('addDomain');
const domainList = document.getElementById('domainList');

const update = enabled => {
  btn.textContent = enabled ? 'Disable Globally' : 'Enable Globally';
  btn.style.backgroundColor = enabled ? '#4CAF50' : '#f44336';
  btn.style.color = 'white';
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

browser.storage.local.get('enabled').then(({ enabled = true }) => {
  update(enabled);
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
