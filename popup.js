const btn = document.getElementById('toggle');

const update = enabled => {
  btn.textContent = enabled ? 'Disable' : 'Enable';
  btn.style.backgroundColor = enabled ? '#4CAF50' : '#f44336';
  btn.style.color = 'white';
};

browser.storage.local.get('enabled').then(({ enabled = true }) => {
  update(enabled);
});

btn.onclick = async () => {
  const { enabled = true } = await browser.storage.local.get('enabled');
  const newState = !enabled;
  
  await browser.storage.local.set({ enabled: newState });
  update(newState);
};