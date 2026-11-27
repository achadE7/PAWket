function applyActiveUserBadge(nama) {
  const el = document.getElementById('namaUser');
  if (!el) return;
  el.innerText = nama || '';
  const isPartnerColor = /naghiya/i.test(String(nama || ''));
  el.classList.toggle('pen-naghiya', isPartnerColor);
  el.classList.toggle('pen-reza', !isPartnerColor);
}

function setLoggedInView(isLoggedIn) {
  const loginEl = document.getElementById('loginScreen');
  const appEl = document.getElementById('appScreen');
  loginEl.classList.toggle('hide', isLoggedIn);
  loginEl.hidden = isLoggedIn;
  appEl.classList.toggle('hide', !isLoggedIn);
  appEl.hidden = !isLoggedIn;
}

async function prosesLogin(event) {
  if (event) event.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const errEl = document.getElementById('loginErrorText');
  errEl.classList.add('hide');
  if (!u || !p) {
    errEl.innerText = 'Username dan password wajib diisi.';
    errEl.classList.remove('hide');
    return;
  }
  const btn = document.getElementById('btnLogin');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Membuka meja...</span>`;
  const res = await callAPI('login', { username: u, password: p });
  btn.disabled = false;
  btn.innerHTML = 'Masuk ke meja';

  if (res?.sukses && res.token) {
    activeToken = String(res.token).trim();
    activeUser = String(res.nama || '').trim();
    activeSaldoOwner = "me";
    activeHutangOwner = "me";
    localStorage.setItem('pawketToken', activeToken);
    localStorage.setItem('pawketActiveUser', activeUser);

    applyActiveUserBadge(activeUser);
    setLoggedInView(true);
    switchTab('dashboard');
    setFloatingNekoLoggedIn(true);

    if (res.dashboard?.sukses) {
      lastDashboardFetchAt = Date.now();
      terapkanDataDashboardKeUI(res.dashboard);
    } else {
      await loadDataDashboard(false);
    }
    mintaWejanganAuto(false, false);
  } else {
    errEl.innerText = res?.pesan || 'Login gagal. Periksa username/password.';
    errEl.classList.remove('hide');
  }
}

function prosesLogout(skipServerCall = false) {
  const tokenToRevoke = activeToken;
  if (!skipServerCall && tokenToRevoke) callAPI('logout', { token: tokenToRevoke });
  stopNekoSpeech();
  setFloatingNekoLoggedIn(false);
  nekoAudioCache.clear();
  activeUser = "";
  activeToken = "";
  isNekoCalled = false;
  latestDompetPerUser = {};
  latestDaftarHutang = [];
  latestBudgetPerUser = {};
  latestBulananPerUser = {};
  latestPengeluaranKategori = {};
  latestRiwayatTrx = [];
  dataRekapBulanIni = [];
  rekapPerUserBulanIni = {};
  activeRekapOwner = "me";
  rekapVisibleCount = REKAP_BATCH_SIZE;
  rekapSearchQuery = "";
  rekapFilterTipe = "all";
  currentFinanceSignature = "";
  lastDashboardFetchAt = 0;

  localStorage.removeItem('pawketToken');
  localStorage.removeItem('pawketActiveUser');
  localStorage.removeItem('pawketUsername');
  localStorage.removeItem('pawketPassword');

  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginErrorText').classList.add('hide');
  document.getElementById('inputCariRekap').value = '';
  document.getElementById('filterRekapTipe').value = 'all';
  document.getElementById('dueSoonBanner').classList.add('hide');
  document.getElementById('dashboardErrorBox').classList.add('hide');
  setLoggedInView(false);
  switchTab('dashboard');
}

async function refreshSemuaData() {
  const btn = document.getElementById('btnManualRefresh');
  const svg = btn.querySelector('svg');
  btn.disabled = true;
  if (svg) svg.classList.add('spin');
  const ok = await loadDataDashboard(true);
  if (activeTab === 'rekap') await loadRekap();
  btn.disabled = false;
  if (svg) svg.classList.remove('spin');
  if (ok) showToast('Data berhasil diperbarui.', 'success');
}

function openSettingsModal() {
  if (!activeUser || !activeToken) return;
  const partnerShort = partnerFullName && partnerFullName !== 'Pasangan' ? partnerFullName : 'Pasangan';
  document.getElementById('settingsUserSummary').innerText = `${activeUser} & ${partnerShort}`;
  applyRoomThemeAndTime();
  applyMotionPref();
  openModalDialog('settingsModal', closeSettingsModal);
}
function closeSettingsModal() { closeModalDialog('settingsModal'); }

function openChangePasswordModal() {
  document.getElementById('inputPassLama').value = '';
  document.getElementById('inputPassBaru').value = '';
  document.getElementById('inputPassKonfirm').value = '';
  openModalDialog('changePassModal', closeChangePasswordModal, document.getElementById('inputPassLama'));
}
function closeChangePasswordModal() { closeModalDialog('changePassModal'); }

async function simpanGantiPassword(event) {
  event.preventDefault();
  const lama = document.getElementById('inputPassLama').value.trim();
  const baru = document.getElementById('inputPassBaru').value.trim();
  const konfirm = document.getElementById('inputPassKonfirm').value.trim();
  if (!lama || !baru) return showToast('Password lama dan baru wajib diisi.', 'error');
  if (baru.length < 6) return showToast('Password baru minimal 6 karakter.', 'error');
  if (baru !== konfirm) return showToast('Konfirmasi password baru tidak cocok.', 'error');
  const btn = document.getElementById('btnSimpanPass');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  const res = await callAPI('gantiPassword', { passwordLama: lama, passwordBaru: baru });
  btn.disabled = false;
  btn.innerHTML = 'Simpan Password Baru';
  if (res?.sukses) { showToast(res.pesan || 'Password berhasil diperbarui.', 'success'); closeChangePasswordModal(); }
  else if (!res?.authError) showToast(res?.pesan || 'Gagal mengganti password.', 'error');
}

function openResetUserModal() {
  if (!activeUser || !activeToken) return;
  const partnerShort = (partnerFullName || 'Pasangan').split(' ')[0];
  document.getElementById('resetUserNamaText').innerText = activeUser;
  document.getElementById('resetPartnerNamaText').innerText = partnerShort === 'Pasangan' ? 'pasanganmu' : partnerFullName;
  const inp = document.getElementById('inputKonfirmasiReset');
  inp.value = '';
  document.getElementById('btnKonfirmasiResetUser').disabled = true;
  openModalDialog('resetUserModal', closeResetUserModal, inp);
}
function closeResetUserModal() { closeModalDialog('resetUserModal'); }

function cekInputKonfirmasiReset() {
  const val = String(document.getElementById('inputKonfirmasiReset').value || '').trim().toUpperCase();
  document.getElementById('btnKonfirmasiResetUser').disabled = (val !== 'RESET');
}

async function konfirmasiResetUser(event) {
  event.preventDefault();
  if (String(document.getElementById('inputKonfirmasiReset').value || '').trim().toUpperCase() !== 'RESET') {
    return showToast('Ketik RESET untuk konfirmasi.', 'error');
  }
  const btn = document.getElementById('btnKonfirmasiResetUser');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Mereset...</span>`;
  const res = await callAPI('resetDataUser', {});
  btn.innerHTML = 'Reset Sekarang';
  btn.disabled = false;
  if (res?.sukses) {
    closeResetUserModal();
    stopNekoSpeech();
    localStorage.removeItem(`pawketNekoSig_${activeUser}`);
    localStorage.removeItem(`pawketNekoData_${activeUser}`);
    localStorage.removeItem(`pawketPinnedWallets_${activeUser}`);
    isNekoCalled = false;
    showToast(res.pesan || 'Catatan keuanganmu berhasil direset dari awal.', 'success');
    await loadDataDashboard(true);
    if (activeTab === 'rekap') await loadRekap();
  } else if (!res?.authError) {
    showToast(res?.pesan || 'Gagal mereset catatan keuangan.', 'error');
  }
}

function getMyBudgets() { return (latestBudgetPerUser && latestBudgetPerUser[activeUser]) ? latestBudgetPerUser[activeUser] : {}; }

function openBudgetModal(prefillKat = '') {
  const sel = document.getElementById('budgetKategoriSelect');
  const keluarOpts = (listKategori.keluar && listKategori.keluar.length > 0)
    ? listKategori.keluar
    : ['Makan & Minum', 'Belanja Bulanan', 'Transportasi', 'Hiburan & Kencan', 'Keperluan Anabul'];
  const myBudgets = getMyBudgets();
  const allOpts = [...new Set([...keluarOpts, ...Object.keys(myBudgets)])];
  sel.innerHTML = allOpts.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
  if (prefillKat) {
    const matched = allOpts.find(k => cleanPosName(k).toLowerCase() === cleanPosName(prefillKat).toLowerCase());
    if (matched) sel.value = matched;
  }
  isiNominalBudgetTerpilih();
  renderBudgetAktifList();
  openModalDialog('budgetModal', closeBudgetModal, document.getElementById('budgetNominalInput'));
}
function closeBudgetModal() { closeModalDialog('budgetModal'); }

function isiNominalBudgetTerpilih() {
  const kat = document.getElementById('budgetKategoriSelect').value;
  const existing = getMyBudgets()[kat] ?? 0;
  setRupiahInputValue('budgetNominalInput', existing > 0 ? existing : '');
}

function renderBudgetAktifList() {
  const listEl = document.getElementById('budgetAktifList');
  const entries = Object.entries(getMyBudgets()).filter(([, v]) => Number(v) > 0);
  if (entries.length === 0) {
    listEl.innerHTML = '<p class="small muted">Belum ada budget bulanan yang diatur.</p>';
    return;
  }
  listEl.innerHTML = entries.map(([kat, nom]) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--paper-2);border:1px solid var(--line);border-radius:10px;padding:8px 10px">
      <div style="min-width:0">
        <p style="font-weight:800;font-size:.86rem;word-break:break-word">${escapeHtml(kat)}</p>
        <p class="money small pen-reza">${formatRp(nom)} / bln</p>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button type="button" data-kat="${escapeHtml(kat)}" onclick="pilihEditBudget(this.dataset.kat)" aria-label="Edit budget ${escapeHtml(kat)}" class="icon-btn icon-btn-sm">${svgIcon('i-pen', 'ico ico-sm')}</button>
        <button type="button" data-kat="${escapeHtml(kat)}" onclick="hapusBudgetKategori(this.dataset.kat)" aria-label="Hapus budget ${escapeHtml(kat)}" class="icon-btn icon-btn-sm txt-err">${svgIcon('i-trash', 'ico ico-sm')}</button>
      </div>
    </div>
  `).join('');
}

function pilihEditBudget(kat) {
  document.getElementById('budgetKategoriSelect').value = kat;
  isiNominalBudgetTerpilih();
  document.getElementById('budgetNominalInput').focus();
}

async function simpanBudgetKategori(event) {
  event.preventDefault();
  const kategori = document.getElementById('budgetKategoriSelect').value;
  const nominal = parseRupiahInput(document.getElementById('budgetNominalInput').value);
  if (!kategori) return showToast('Pilih kategori pengeluaran terlebih dahulu.', 'error');
  if (!Number.isFinite(nominal) || nominal < 0) return showToast('Masukkan nominal budget minimal 0.', 'error');
  const btn = document.getElementById('btnSimpanBudget');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  const res = await callAPI('setBudget', { kategori, nominal });
  btn.disabled = false;
  btn.innerHTML = 'Simpan Budget';
  if (res?.sukses) {
    if (!latestBudgetPerUser) latestBudgetPerUser = {};
    latestBudgetPerUser[activeUser] = res.budgets || res.budgetMap || {};
    renderBudgetAktifList();
    renderKategoriDanBudget();
    showToast(nominal === 0 ? `Budget "${kategori}" dihapus.` : `Budget "${kategori}" disimpan.`, 'success');
    loadDataDashboard(true);
  } else if (!res?.authError) showToast(res?.pesan || 'Gagal menyimpan budget.', 'error');
}

async function hapusBudgetKategori(kat) {
  const res = await callAPI('setBudget', { kategori: kat, nominal: 0 });
  if (res?.sukses) {
    if (!latestBudgetPerUser) latestBudgetPerUser = {};
    latestBudgetPerUser[activeUser] = res.budgets || res.budgetMap || {};
    isiNominalBudgetTerpilih();
    renderBudgetAktifList();
    renderKategoriDanBudget();
    showToast(`Budget "${kat}" dihapus.`, 'success');
    loadDataDashboard(true);
  } else if (!res?.authError) showToast(res?.pesan || 'Gagal menghapus budget.', 'error');
}

async function loadDataDashboard(forceRefresh = false) {
  if (!activeToken) return false;
  const errBox = document.getElementById('dashboardErrorBox');
  const res = await callAPI('getDashboard', { forceRefresh });
  if (res?.sukses) {
    errBox.classList.add('hide');
    lastDashboardFetchAt = Date.now();
    terapkanDataDashboardKeUI(res);
    return true;
  } else if (!res?.authError) {
    document.getElementById('dashboardErrorText').innerText = res?.pesan || 'Gagal memuat data dashboard.';
    errBox.classList.remove('hide');
    return false;
  }
  return false;
}

function terapkanDataDashboardKeUI(res) {
  currentFinanceSignature = res.stateSignature || `${res.saldoUtama}_${res.totalMasuk}_${res.totalKeluar}_${res.totalSisaHutang}_${res.totalTrxBulanIniCount || 0}`;
  if (res.kategoriData?.sukses) {
    listKategori = res.kategoriData;
    if (tipeAktif === 'Tabungan') renderKategoriTabungan();
    else renderKategori();
    renderMetodePembayaran();
  }

  const bulanLabel = res.bulanIniLabel || `${BULAN_INDO[new Date().getMonth()]} ${new Date().getFullYear()}`;
  document.getElementById('dashBulanLabel').innerText = bulanLabel;
  document.getElementById('katBulanLabel').innerText = bulanLabel;
  document.getElementById('saldoUtama').innerText = formatRp(res.saldoUtama);
  document.getElementById('totalMasuk').innerText = formatRp(res.totalMasukBulanIni ?? res.totalMasuk);
  document.getElementById('totalKeluar').innerText = formatRp(res.totalKeluarBulanIni ?? res.totalKeluar);

  const uStats = res.userStats || {};
  const usernames = Object.keys(uStats);
  const myStats = uStats[activeUser] || { masuk: 0, keluar: 0 };
  partnerFullName = usernames.find(u => u !== activeUser) || 'Pasangan';
  const partnerShortName = partnerFullName.split(' ')[0];
  const partnerStats = uStats[partnerFullName] || { masuk: 0, keluar: 0 };
  const myShortName = (activeUser || 'Aku').split(' ')[0];

  document.getElementById('namaPasanganDompet').innerText = partnerShortName;
  document.getElementById('tabNamaPasanganSaldo').innerText = partnerShortName;
  document.getElementById('tabNamaPasanganHutang').innerText = partnerShortName;
  document.getElementById('rekapMasukAkuLabel').innerText = myShortName;
  document.getElementById('rekapMasukPasanganLabel').innerText = partnerShortName;
  document.getElementById('rekapKeluarAkuLabel').innerText = myShortName;
  document.getElementById('rekapKeluarPasanganLabel').innerText = partnerShortName;
  document.getElementById('rekapTabNamaAku').innerText = myShortName;
  document.getElementById('rekapTabNamaPasangan').innerText = partnerShortName;

  const saldoPerUser = res.saldoPerUser || {};
  document.getElementById('saldoAku').innerText = formatRp(saldoPerUser[activeUser] ?? (myStats.masuk - myStats.keluar));
  document.getElementById('saldoPasangan').innerText = formatRp(saldoPerUser[partnerFullName] ?? (partnerStats.masuk - partnerStats.keluar));

  latestDompetPerUser = res.dompetPerUser || {};
  latestBudgetPerUser = res.budgetPerUser || {};
  latestBulananPerUser = res.bulananPerUser || {};
  latestPengeluaranKategori = res.pengeluaranPerKategori || {};
  renderMenuSaldo();
  renderMetodePembayaran();

  const tabObj = res.tabungan || {};
  const labelTabObj = res.labelTabungan || {};
  const tabKeys = Object.keys(tabObj);
  const sumTabungan = res.totalTabungan !== undefined
    ? Number(res.totalTabungan) || 0
    : tabKeys.reduce((acc, k) => acc + (Number(tabObj[k]) || 0), 0);
  const totalHutang = Number(res.totalSisaHutang) || 0;
  const netWorthVal = res.netWorth !== undefined
    ? Number(res.netWorth) || 0
    : ((Number(res.saldoUtama) || 0) + sumTabungan - totalHutang);

  document.getElementById('dashTotalTabungan').innerText = formatRp(sumTabungan);
  document.getElementById('dashTotalHutang').innerText = totalHutang > 0 ? `-${formatRp(totalHutang)}` : formatRp(0);
  document.getElementById('dashNetWorth').innerText = formatRp(netWorthVal);

  const tabContainer = document.getElementById('kantongTabunganContainer');
  if (tabKeys.length > 0) {
    tabContainer.innerHTML = tabKeys.map(key => `
      <div class="kantong-chip">
        <p class="kname">${escapeHtml(labelTabObj[key] || key)}</p>
        <span class="kval money">${formatRp(tabObj[key] || 0)}</span>
      </div>
    `).join('');
  } else {
    tabContainer.innerHTML = '';
  }

  latestTargetTabungan = {
    pos: res.targetTabungan?.pos || "Semua",
    nominal: Number(res.targetTabungan?.nominal) || 0
  };
  const terkumpul = latestTargetTabungan.pos === "Semua"
    ? sumTabungan
    : (tabObj[cleanPosName(latestTargetTabungan.pos)] ?? tabObj[latestTargetTabungan.pos] ?? 0);
  const persen = latestTargetTabungan.nominal > 0 ? Math.min(100, Math.max(0, Math.round((terkumpul / latestTargetTabungan.nominal) * 100))) : 0;
  document.getElementById('targetPosText').innerText = latestTargetTabungan.pos;
  document.getElementById('targetTerkumpul').innerText = formatRp(terkumpul);
  document.getElementById('targetNominal').innerText = formatRp(latestTargetTabungan.nominal);
  document.getElementById('targetPersen').innerText = persen;
  document.getElementById('targetBar').style.height = `${persen}%`;
  document.getElementById('targetHintText').innerText = terkumpul === 0
    ? 'Belum ada yang masuk. Isi lewat Catat, pilih Tabungan.'
    : (terkumpul >= latestTargetTabungan.nominal ? 'Target tercapai!' : `Kurang ${formatRp(latestTargetTabungan.nominal - terkumpul)} lagi.`);

  latestDaftarHutang = Array.isArray(res.daftarHutang) ? res.daftarHutang : [];
  renderHutang();
  renderDueSoonBanner();
  renderKategoriDanBudget();

  latestRiwayatTrx = Array.isArray(res.riwayatTrx) ? res.riwayatTrx : [];
  const listTrx = document.getElementById('listTrxTerbaru');
  listTrx.setAttribute('aria-busy', 'false');
  if (latestRiwayatTrx.length > 0) {
    listTrx.innerHTML = latestRiwayatTrx.slice(0, 5).map(d => {
      const isOwner = String(d.oleh).trim() === activeUser && Boolean(d.id);
      const isMasuk = d.tipe === 'Pemasukan';
      const isTrf = d.tipe === 'Transfer';
      const isAdj = d.tipe === 'Penyesuaian';
      const iconId = isAdj ? 'i-sliders' : (isTrf ? 'i-transfer' : (isMasuk ? 'i-arrow-down' : 'i-arrow-up'));
      const color = isAdj ? 'txt-warn' : (isTrf ? 'txt-purple' : (isMasuk ? 'pen-reza' : 'pen-naghiya'));
      const badgeMetode = d.metode ? `<span class="trx-pill">${escapeHtml(d.metode)}</span>` : '';
      const nominalLabel = isAdj && Number(d.nominal) > 0 ? `+${formatRp(d.nominal)}` : formatRp(d.nominal);

      const body = `
        <span class="trx-dir ${color}" aria-hidden="true">${svgIcon(iconId, 'ico ico-sm')}</span>
        <div style="min-width:0">
          <p style="font-weight:800;font-size:.88rem;word-break:break-word">${escapeHtml(d.kategori)}${badgeMetode}</p>
          <p class="small muted">${escapeHtml(d.tanggal)} &bull; ${escapeHtml(d.oleh)}</p>
        </div>
        <div style="text-align:right">
          <p class="money small ${color}">${nominalLabel}</p>
          ${isOwner ? `<span class="muted" style="display:inline-block;margin-top:4px">${svgIcon('i-pen', 'ico ico-sm')}</span>` : ''}
        </div>
      `;
      return isOwner
        ? `<button type="button" data-id="${escapeHtml(d.id)}" onclick="bukaEditDariBeranda(this.dataset.id)" class="trx-item" title="Ketuk untuk edit transaksi">${body}</button>`
        : `<div class="trx-item">${body}</div>`;
    }).join('');
  } else {
    listTrx.innerHTML = `
      <div class="empty">
        <p class="hand">Belum ada transaksi. Ketuk laptop di meja untuk mulai mencatat.</p>
        <button type="button" onclick="switchTab('catat')" class="btn btn-primary btn-sm">Catat sekarang</button>
      </div>
    `;
  }
}

function switchKategoriScope(scope) {
  activeKategoriScope = scope === 'all' ? 'all' : 'me';
  document.getElementById('btnKatAku').setAttribute('aria-pressed', String(activeKategoriScope === 'me'));
  document.getElementById('btnKatSemua').setAttribute('aria-pressed', String(activeKategoriScope === 'all'));
  renderKategoriDanBudget();
}

function renderKategoriDanBudget() {
  const container = document.getElementById('listKategoriPengeluaran');
  if (!container) return;
  container.setAttribute('aria-busy', 'false');
  const isMe = activeKategoriScope === 'me';
  const rawSpendMap = isMe ? (latestBulananPerUser?.[activeUser]?.katMap || {}) : (latestPengeluaranKategori || {});
  const spendByNorm = new Map();
  Object.entries(rawSpendMap).forEach(([rawKat, val]) => {
    const baseKat = String(rawKat || '').replace(/\s*\(via\s+[^)]+\)\s*$/i, '').trim() || rawKat;
    const norm = cleanPosName(baseKat).toLowerCase();
    const prev = spendByNorm.get(norm);
    const amt = Number(val) || 0;
    if (prev) prev.spent += amt;
    else spendByNorm.set(norm, { kategori: baseKat, spent: amt, budget: 0 });
  });

  const budgetSources = isMe ? [getMyBudgets()] : Object.values(latestBudgetPerUser || {});
  budgetSources.forEach(bMap => {
    Object.entries(bMap || {}).forEach(([kat, lim]) => {
      const limitNum = Number(lim) || 0;
      if (limitNum <= 0) return;
      const norm = cleanPosName(kat).toLowerCase();
      const prev = spendByNorm.get(norm);
      if (prev) prev.budget += limitNum;
      else spendByNorm.set(norm, { kategori: kat, spent: 0, budget: limitNum });
    });
  });

  const items = [...spendByNorm.values()]
    .filter(x => x.spent > 0 || x.budget > 0)
    .sort((a, b) => {
      const aOver = a.budget > 0 && a.spent >= a.budget ? 1 : 0;
      const bOver = b.budget > 0 && b.spent >= b.budget ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      return (b.spent - a.spent) || (b.budget - a.budget);
    });

  const totalSpent = items.reduce((acc, x) => acc + x.spent, 0);
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <p class="hand">Belum ada pengeluaran ${isMe ? 'pribadimu' : 'bersama'} bulan ini.</p>
        <button type="button" onclick="openBudgetModal()" class="btn-text">Atur budget bulanan</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.slice(0, 6).map(item => {
    const hasBudget = item.budget > 0;
    const pct = hasBudget ? Math.round((item.spent / item.budget) * 100) : (totalSpent > 0 ? Math.round((item.spent / totalSpent) * 100) : 0);
    const barW = Math.min(100, Math.max(pct > 0 ? 4 : 0, pct));
    let barCls = 'bar-base';
    let statusHtml = `<span class="small muted">${pct}% dari total</span>`;
    if (hasBudget) {
      if (pct >= 100) {
        barCls = 'bar-err';
        statusHtml = `<span class="small txt-err" style="font-weight:800;display:inline-flex;align-items:center;gap:4px">${svgIcon('i-alert', 'ico ico-sm')}<span>Melebihi (${pct}%)</span></span>`;
      } else if (pct >= 80) {
        barCls = 'bar-warn';
        statusHtml = `<span class="small txt-warn" style="font-weight:800;display:inline-flex;align-items:center;gap:4px">${svgIcon('i-alert', 'ico ico-sm')}<span>Hampir penuh (${pct}%)</span></span>`;
      } else {
        barCls = 'bar-ok';
        statusHtml = `<span class="small txt-ok" style="font-weight:800;display:inline-flex;align-items:center;gap:4px">${svgIcon('i-check', 'ico ico-sm')}<span>Aman (${pct}%)</span></span>`;
      }
    }
    const amtHtml = hasBudget
      ? `<span class="money">${formatRp(item.spent)}</span> <span class="muted small">/ ${formatRp(item.budget)}</span>`
      : `<span class="money">${formatRp(item.spent)}</span>`;
    return `
      <button type="button" data-kat="${escapeHtml(item.kategori)}" onclick="openBudgetModal(this.dataset.kat)" class="budget-btn">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap">
          <span style="font-weight:800;font-size:.88rem;word-break:break-word">${escapeHtml(item.kategori)}</span>
          <span class="small" style="flex-shrink:0">${amtHtml}</span>
        </div>
        <div class="budget-bar"><i class="${barCls}" style="width:${barW}%"></i></div>
        <div style="display:flex;justify-content:space-between;margin-top:3px;gap:8px;flex-wrap:wrap">
          ${statusHtml}
          <span class="small muted" style="font-weight:700">${hasBudget ? 'Ubah budget' : 'Set budget'}</span>
        </div>
      </button>
    `;
  }).join('');
}

function parseDueDateDaysRemaining(rawTempo) {
  const s = String(rawTempo || '').trim();
  if (!s || s === '-') return null;
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mFull = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (mFull) {
    const day = Number(mFull[1]);
    const monIdx = BULAN_INDO.findIndex(b => b.toLowerCase() === mFull[2].slice(0, 3).toLowerCase());
    const year = Number(mFull[3]);
    if (monIdx >= 0 && day >= 1 && day <= 31) return Math.round((new Date(year, monIdx, day) - todayMid) / 86400000);
  }
  const mDay = s.match(/^(?:tgl\.?\s*)?(\d{1,2})$/i);
  if (mDay) {
    const day = Math.min(28, Math.max(1, Number(mDay[1])));
    let target = new Date(now.getFullYear(), now.getMonth(), day);
    if (target < todayMid) target = new Date(now.getFullYear(), now.getMonth() + 1, day);
    return Math.round((target - todayMid) / 86400000);
  }
  if (/akhir\s*bulan/i.test(s)) return Math.round((new Date(now.getFullYear(), now.getMonth() + 1, 0) - todayMid) / 86400000);
  return null;
}

function renderDueSoonBanner() {
  const banner = document.getElementById('dueSoonBanner');
  if (!banner) return;
  const myDebts = (latestDaftarHutang || []).filter(h => h.status === 'Aktif' && String(h.oleh).trim() === activeUser);
  const urgent = [];
  myDebts.forEach(h => {
    const days = parseDueDateDaysRemaining(h.tglJatuhTempo);
    if (days !== null && days <= 5) urgent.push({ nama: h.namaHutang, sisa: h.sisaHutang, days });
  });
  if (urgent.length === 0) { banner.classList.add('hide'); return; }
  urgent.sort((a, b) => a.days - b.days);
  const top = urgent[0];
  const statusHari = top.days < 0 ? `terlambat ${Math.abs(top.days)} hari` : (top.days === 0 ? 'jatuh tempo HARI INI' : `jatuh tempo ${top.days} hari lagi`);
  document.getElementById('dueSoonTitle').innerText = urgent.length === 1 ? `Tagihan ${statusHari}` : `${urgent.length} tagihan mendekati jatuh tempo`;
  document.getElementById('dueSoonText').innerText = urgent.length === 1
    ? `${top.nama} (sisa ${formatRp(top.sisa)})`
    : `${top.nama} (${statusHari}, sisa ${formatRp(top.sisa)}) dan ${urgent.length - 1} lainnya.`;
  banner.classList.remove('hide');
}

function bukaEditDariBeranda(idTrx) {
  const item = latestRiwayatTrx.find(t => String(t.id) === String(idTrx));
  if (!item) return showToast('Transaksi tidak ditemukan. Coba edit lewat Buku Besar.', 'info');
  bukaEditTransaksiObj({
    id: item.id,
    isoDate: item.isoDate || todayIso(),
    Tanggal: item.tanggal,
    Oleh: item.oleh,
    Tipe: item.tipe,
    Kategori: item.kategori,
    Metode: item.metode,
    Nominal: item.nominal,
    Catatan: item.catatan,
    rawCatatan: item.rawCatatan !== undefined ? item.rawCatatan : item.catatan,
    isPayHutang: Boolean(item.isPayHutang)
  });
}
