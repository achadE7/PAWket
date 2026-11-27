function switchTab(tabId) {
  activeTab = tabId;
  ['dashboard', 'saldo', 'catat', 'hutang', 'rekap'].forEach(id => {
    document.getElementById(`tab-${id}`).classList.toggle('is-active', id === tabId);
    const navBtn = document.getElementById(`nav-${id}`);
    if (id === tabId) navBtn.setAttribute('aria-current', 'page');
    else navBtn.removeAttribute('aria-current');
  });

  if (nekoLife.loggedIn) {
    const wasPeekingSameTab = (getEffectiveNekoPlacement() === 'peek') && (nekoLife.peekTabId === `nav-${tabId}`);
    placeNeko();
    if (wasPeekingSameTab) sneakNekoToAnotherTab();
  }

  if (activeToken && ['dashboard', 'saldo', 'hutang'].includes(tabId)) {
    if (!lastDashboardFetchAt || (Date.now() - lastDashboardFetchAt) > DASHBOARD_STALE_MS) loadDataDashboard(false);
  }
  if (tabId === 'rekap') {
    const inputBulan = document.getElementById('inputBulan');
    if (!inputBulan.value) {
      const now = new Date();
      inputBulan.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    loadRekap();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener("DOMContentLoaded", async () => {
  localStorage.removeItem('pawketPassword');
  localStorage.removeItem('pawketUsername');
  injectPwaManifest();
  applyRoomThemeAndTime();
  applyMotionPref();
  setInterval(() => {
    if ((localStorage.getItem('pawketTime') || 'auto') === 'auto') applyRoomThemeAndTime();
  }, 60000);

  document.getElementById('btnConfirmAction').addEventListener('click', async () => {
    const fn = pendingConfirmAction;
    closeConfirmModal();
    if (typeof fn === 'function') await fn();
  });

  // Geser input aktif ke tengah layar agar tidak tertutup keyboard virtual di ponsel.
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
    setTimeout(() => {
      try {
        const reduced = document.documentElement.dataset.motion === 'off';
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      } catch (_) {}
    }, 180);
  }, { passive: true });

  document.getElementById('inputTanggal').value = todayIso();
  renderKategori();
  renderMetodePembayaran();
  initNeko3DSystem();
  ensureNekoModalMascot('santai');

  const savedToken = localStorage.getItem('pawketToken');
  const savedUser = localStorage.getItem('pawketActiveUser');
  if (savedToken && savedUser) {
    activeToken = savedToken.trim();
    activeUser = savedUser.trim();
    applyActiveUserBadge(activeUser);
    setLoggedInView(true);
    setFloatingNekoLoggedIn(true);

    const localWejangan = localStorage.getItem(`pawketNekoData_${activeUser}`);
    if (localWejangan) {
      try {
        wejanganState = JSON.parse(localWejangan);
        renderWejanganNekoUI();
      } catch (_) {}
    }
    const ok = await loadDataDashboard(false);
    if (ok && activeToken) mintaWejanganAuto(false, false);
  }
});
