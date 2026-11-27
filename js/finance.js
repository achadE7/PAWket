function getPinnedWalletsForUser(user) {
  if (!user) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(`pawketPinnedWallets_${user}`) || '[]');
    return Array.isArray(parsed) ? parsed.map(cleanPosName).filter(Boolean) : [];
  } catch (_) { return []; }
}

function pinWalletForUser(user, walletName) {
  const clean = cleanPosName(walletName);
  if (!user || !clean) return;
  const list = getPinnedWalletsForUser(user);
  if (!list.some(w => w.toLowerCase() === clean.toLowerCase())) {
    list.push(clean);
    localStorage.setItem(`pawketPinnedWallets_${user}`, JSON.stringify(list));
  }
}

function getUniqueDompetList() {
  const raw = listKategori.dompet?.length > 0
    ? listKategori.dompet
    : ["Uang Cash", "BNI", "BRI", "BCA", "Mandiri", "GoPay", "Spay", "Dana", "Tapcash"];
  const seen = new Set();
  const unique = [];
  raw.forEach(d => {
    const clean = cleanPosName(d);
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(clean);
  });
  return unique;
}

function getMyWalletBalance(dompetName) {
  const target = cleanPosName(dompetName).toLowerCase();
  const myWallets = latestDompetPerUser?.[activeUser] || {};
  let found = 0;
  Object.entries(myWallets).forEach(([k, v]) => {
    if (cleanPosName(k).toLowerCase() === target) found += Number(v) || 0;
  });
  return found;
}

function switchOwnerSaldo(ownerType) {
  activeSaldoOwner = ownerType;
  const isMe = ownerType === 'me';
  document.getElementById('btnViewSaldoku').setAttribute('aria-pressed', String(isMe));
  document.getElementById('btnViewSaldoPasangan').setAttribute('aria-pressed', String(!isMe));
  document.getElementById('kartuHeaderSaldo').classList.toggle('is-partner', !isMe);
  document.getElementById('aksiSaldokuBox').classList.toggle('hide', !isMe);
  renderMenuSaldo();
}

function klasifikasiDompet(nama) {
  const lower = cleanPosName(nama).toLowerCase();
  if (BANK_KEYWORDS.some(k => lower === k || lower.includes(k))) return 'bank';
  if (EWALLET_KEYWORDS.some(k => lower === k || lower.includes(k))) return 'ewallet';
  return 'lainnya';
}

function renderMenuSaldo() {
  const isMe = activeSaldoOwner === 'me';
  const targetUser = isMe ? activeUser : partnerFullName;
  const saldoObj = latestDompetPerUser?.[targetUser] || {};
  const totalUserSaldo = Object.values(saldoObj).reduce((acc, v) => acc + (Number(v) || 0), 0);
  document.getElementById('labelHeaderSaldo').innerText = isMe
    ? `Total saldoku (${(activeUser || '').split(' ')[0]})`
    : `Total saldo ${(partnerFullName || 'Pasangan').split(' ')[0]}`;
  document.getElementById('totalSemuaSaldo').innerText = formatRp(totalUserSaldo);

  const pinned = isMe ? getPinnedWalletsForUser(activeUser) : [];
  const seenLower = new Map();
  [...Object.keys(saldoObj), ...pinned].forEach(rawKey => {
    const key = cleanPosName(rawKey);
    if (!key) return;
    const lower = key.toLowerCase();
    const val = saldoObj[rawKey] !== undefined ? (Number(saldoObj[rawKey]) || 0) : 0;
    if (!seenLower.has(lower)) seenLower.set(lower, { nama: key, nominal: val });
    else if (saldoObj[rawKey] !== undefined && rawKey !== seenLower.get(lower).nama) seenLower.get(lower).nominal += val;
  });

  const banks = [], ewallets = [], others = [], minusItems = [];
  seenLower.forEach(item => {
    if (item.nominal < 0) minusItems.push(item);
    const jenis = klasifikasiDompet(item.nama);
    if (jenis === 'bank') banks.push(item);
    else if (jenis === 'ewallet') ewallets.push(item);
    else others.push(item);
  });

  const warnBox = document.getElementById('saldoMinusWarning');
  if (minusItems.length > 0) {
    const daftarMinus = minusItems.map(i => `${i.nama} (${formatRp(i.nominal)})`).join(', ');
    document.getElementById('saldoMinusWarningText').innerText = isMe
      ? `Dompet minus: ${daftarMinus}. Saldo tidak boleh minus; klik ikon pensil untuk menyesuaikan ke saldo sebenarnya (minimal Rp 0) atau gunakan menu Reset di Pengaturan.`
      : `Dompet minus milik ${(partnerFullName || 'Pasangan').split(' ')[0]}: ${daftarMinus}.`;
    warnBox.classList.remove('hide');
  } else {
    warnBox.classList.add('hide');
  }

  const buatKartu = (item, warnaIkon, iconId) => {
    const isMinus = item.nominal < 0;
    return `
      <div class="bank-card ${isMinus ? 'is-minus' : ''}">
        <div class="bank-card-top">
          <span class="name ${isMinus ? 'txt-err' : warnaIkon}">${svgIcon(iconId, 'ico ico-sm')}<span>${escapeHtml(item.nama)}</span></span>
          ${isMe
            ? `<button type="button" data-dompet="${escapeHtml(item.nama)}" data-nominal="${item.nominal}" onclick="openSesuaikanSaldoFromBtn(this)" class="icon-btn icon-btn-sm" style="margin:-6px -6px 0 0" aria-label="Sesuaikan saldo ${escapeHtml(item.nama)}" title="Sesuaikan Saldo">${svgIcon('i-pen', 'ico ico-sm')}</button>`
            : ''}
        </div>
        <div>
          <p class="money ${isMinus ? 'txt-err' : ''}" style="font-size:1rem">${formatRp(item.nominal)}</p>
          ${isMinus ? `<span class="small txt-err" style="font-weight:800;display:inline-flex;align-items:center;gap:4px">${svgIcon('i-alert', 'ico ico-sm')}<span>Minus</span></span>` : ''}
        </div>
      </div>
    `;
  };

  document.getElementById('wrapSaldoBank').classList.toggle('hide', banks.length === 0);
  document.getElementById('listSaldoBank').innerHTML = banks.map(b => buatKartu(b, 'pen-reza', 'i-bank')).join('');
  document.getElementById('wrapSaldoEwallet').classList.toggle('hide', ewallets.length === 0);
  document.getElementById('listSaldoEwallet').innerHTML = ewallets.map(e => buatKartu(e, 'pen-naghiya', 'i-wallet')).join('');
  document.getElementById('wrapSaldoLainnya').classList.toggle('hide', others.length === 0);
  document.getElementById('listSaldoLainnya').innerHTML = others.map(k => buatKartu(k, 'txt-ok', 'i-cash')).join('');

  const allEmpty = banks.length === 0 && ewallets.length === 0 && others.length === 0;
  document.getElementById('saldoEmptyBox').classList.toggle('hide', !allEmpty);
  const btnEmptyAdd = document.getElementById('btnSaldoEmptyAdd');
  if (btnEmptyAdd) btnEmptyAdd.classList.toggle('hide', !isMe);
  if (allEmpty) {
    document.getElementById('saldoEmptyText').innerText = isMe
      ? 'Belum ada dompet yang dipakai. Catat pemasukan atau klik Tambah Dompet untuk mulai.'
      : `${(partnerFullName || 'Pasangan').split(' ')[0]} belum memiliki catatan saldo dompet.`;
  }
}

function openSesuaikanSaldoFromBtn(btn) {
  if (activeSaldoOwner !== 'me') return showToast("Kamu hanya bisa mengubah saldomu sendiri.", 'error');
  const nama = btn.dataset.dompet || '';
  const nominal = Number(btn.dataset.nominal) || 0;
  selectedSaldoToAdjust = { nama, nominal };
  document.getElementById('adjDompetInfo').innerText = `Dompet: ${nama} (Tercatat saat ini: ${formatRp(nominal)})`;
  setRupiahInputValue('adjSaldoBaru', Math.max(0, nominal));
  updatePreviewSelisihSaldo();
  openModalDialog('sesuaikanSaldoModal', closeSesuaikanSaldoModal, document.getElementById('adjSaldoBaru'));
}

function updatePreviewSelisihSaldo() {
  const val = parseRupiahInput(document.getElementById('adjSaldoBaru').value);
  const preview = document.getElementById('adjPreviewSelisih');
  if (!Number.isFinite(val)) { preview.innerText = ''; return; }
  if (val < 0) { preview.innerText = 'Saldo tidak boleh minus (minimal Rp 0).'; return; }
  const selisih = val - selectedSaldoToAdjust.nominal;
  preview.innerText = selisih === 0 ? 'Tidak ada perubahan saldo.' : `Selisih penyesuaian: ${selisih > 0 ? '+' : ''}${formatRp(selisih)}`;
}
function closeSesuaikanSaldoModal() { closeModalDialog('sesuaikanSaldoModal'); }

async function simpanSesuaikanSaldo(event) {
  event.preventDefault();
  const saldoBaru = parseRupiahInput(document.getElementById('adjSaldoBaru').value);
  if (!Number.isFinite(saldoBaru)) return showToast('Masukkan angka saldo yang valid.', 'error');
  if (saldoBaru < 0) return showToast('Saldo dompet tidak boleh minus (minimal Rp 0).', 'error');
  const btn = document.getElementById('btnSimpanAdjSaldo');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  const res = await callAPI('sesuaikanSaldo', { form: { dompet: selectedSaldoToAdjust.nama, saldoBaru } });
  btn.disabled = false;
  btn.innerHTML = 'Simpan Saldo Aktual';
  if (res?.sukses) {
    pinWalletForUser(activeUser, selectedSaldoToAdjust.nama);
    showToast(res.pesan || 'Saldo berhasil disesuaikan.', 'success');
    closeSesuaikanSaldoModal();
    loadDataDashboard(true);
  } else if (!res?.authError) showToast(res?.pesan || 'Gagal menyesuaikan saldo.', 'error');
}

let selectedMasterIconId = 'i-cat-tag';

function renderAddMasterIconPicker(selectedId = 'i-cat-tag') {
  selectedMasterIconId = VALID_CAT_ICON_IDS.has(selectedId) ? selectedId : 'i-cat-tag';
  const grid = document.getElementById('addMasterIconGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORY_ICON_OPTIONS.map(opt => `
    <button type="button" class="icon-pick-btn" data-icon="${opt.id}" onclick="pilihAddMasterIcon('${opt.id}')" aria-pressed="${String(opt.id === selectedMasterIconId)}" aria-label="${escapeHtml(opt.label)}" title="${escapeHtml(opt.label)}">
      ${svgIcon(opt.id, 'ico')}
    </button>
  `).join('');
}

function pilihAddMasterIcon(iconId) {
  if (!VALID_CAT_ICON_IDS.has(iconId)) return;
  selectedMasterIconId = iconId;
  document.querySelectorAll('#addMasterIconGrid .icon-pick-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.icon === iconId));
  });
}

function openAddMasterModal({ tipe, title, label, placeholder, hint, onSuccess, quickOptions = [] }) {
  addMasterContext = { tipe, onSuccess };
  document.getElementById('addMasterTitle').innerText = title;
  document.getElementById('addMasterLabel').innerText = label;
  const input = document.getElementById('addMasterInput');
  input.value = '';
  input.placeholder = placeholder || '';
  document.getElementById('addMasterHint').innerText = hint || '';
  const quickBox = document.getElementById('addMasterQuickBox');
  const quickChips = document.getElementById('addMasterQuickChips');
  if (Array.isArray(quickOptions) && quickOptions.length > 0) {
    quickChips.innerHTML = quickOptions.map(name => `
      <button type="button" data-wallet="${escapeHtml(name)}" onclick="aktifkanDompetCepat(this.dataset.wallet)" class="chip-btn">+ ${escapeHtml(name)}</button>
    `).join('');
    quickBox.classList.remove('hide');
  } else {
    quickChips.innerHTML = '';
    quickBox.classList.add('hide');
  }
  const iconBox = document.getElementById('addMasterIconBox');
  const showIcons = tipe !== 'Dompet';
  if (iconBox) {
    iconBox.classList.toggle('hide', !showIcons);
    if (showIcons) renderAddMasterIconPicker(tipe === 'Tabungan' ? 'i-cat-vault' : (tipe === 'Pemasukan' ? 'i-cat-salary' : 'i-cat-tag'));
  }
  openModalDialog('addMasterModal', closeAddMasterModal, input);
}
function closeAddMasterModal() { closeModalDialog('addMasterModal'); }

function aktifkanDompetCepat(namaDompet) {
  const clean = cleanPosName(namaDompet);
  if (!clean) return;
  pinWalletForUser(activeUser, clean);
  closeAddMasterModal();
  renderMenuSaldo();
  showToast(`"${clean}" ditampilkan di Saldoku.`, 'success');
  if (typeof addMasterContext.onSuccess === 'function') addMasterContext.onSuccess(clean);
}

function openTambahDompetModal(onSuccessCallback = null) {
  const usedKeys = new Set([
    ...Object.keys(latestDompetPerUser?.[activeUser] || {}),
    ...getPinnedWalletsForUser(activeUser)
  ].map(k => cleanPosName(k).toLowerCase()));
  const availableUnused = getUniqueDompetList().filter(d => !usedKeys.has(d.toLowerCase()));
  openAddMasterModal({
    tipe: 'Dompet',
    title: 'Tambah Dompet / Rekening',
    label: 'Nama Rekening atau E-Wallet Baru',
    placeholder: 'Contoh: SeaBank, Jago, OVO, Flazz',
    hint: 'Hanya dompet yang kamu pakai yang akan ditampilkan di halaman Saldo.',
    quickOptions: availableUnused,
    onSuccess: onSuccessCallback
  });
}

async function simpanAddMaster(event) {
  event.preventDefault();
  const rawVal = document.getElementById('addMasterInput').value.trim();
  if (!rawVal) return showToast('Nama tidak boleh kosong.', 'error');
  const namaKirim = addMasterContext.tipe === 'Dompet' ? cleanPosName(rawVal) : (stripCategoryEmoji(rawVal) || rawVal);
  if (addMasterContext.tipe === 'Dompet') {
    const existingMaster = getUniqueDompetList().find(d => d.toLowerCase() === namaKirim.toLowerCase());
    if (existingMaster) { aktifkanDompetCepat(existingMaster); return; }
  }
  const btn = document.getElementById('btnSimpanAddMaster');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  const res = await callAPI('tambahKategori', { tipe: addMasterContext.tipe, namaKategori: namaKirim });
  btn.disabled = false;
  btn.innerHTML = 'Tambahkan';
  if (res?.sukses) {
    listKategori = res;
    if (addMasterContext.tipe === 'Dompet') pinWalletForUser(activeUser, namaKirim);
    else saveCategoryIconPref(namaKirim, selectedMasterIconId);
    closeAddMasterModal();
    showToast(`"${namaKirim}" berhasil ditambahkan.`, 'success');
    if (typeof addMasterContext.onSuccess === 'function') addMasterContext.onSuccess(namaKirim);
    else { renderMetodePembayaran(); renderMenuSaldo(); loadDataDashboard(true); }
  } else if (!res?.authError) showToast(res?.pesan || 'Gagal menambahkan data.', 'error');
}

function openTransferModal() {
  const uniqueClean = getUniqueDompetList();
  const sortedDari = [...uniqueClean].sort((a, b) => getMyWalletBalance(b) - getMyWalletBalance(a));
  document.getElementById('trfDari').innerHTML = sortedDari.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${formatRp(getMyWalletBalance(c))})</option>`).join('');
  const selKe = document.getElementById('trfKe');
  selKe.innerHTML = uniqueClean.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  const firstTargetIdx = uniqueClean.findIndex(d => d.toLowerCase() !== (sortedDari[0] || '').toLowerCase());
  if (firstTargetIdx >= 0) selKe.selectedIndex = firstTargetIdx;
  document.getElementById('trfNominal').value = '';
  document.getElementById('trfCatatan').value = '';
  cekInfoAdminTransfer();
  openModalDialog('transferModal', closeTransferModal, document.getElementById('trfNominal'));
}
function closeTransferModal() { closeModalDialog('transferModal'); }

function cekInfoAdminTransfer() {
  const dari = String(document.getElementById('trfDari').value || '').toLowerCase();
  const ke = String(document.getElementById('trfKe').value || '').toLowerCase();
  const isTopup = (ke === 'gopay' || ke === 'spay') && dari !== 'uang cash';
  setRupiahInputValue('trfAdmin', isTopup ? 1250 : 0);
  document.getElementById('infoAdminTrf').innerText = isTopup
    ? 'Default biaya admin top up GoPay/Spay Rp 1.250 (bisa diubah ke 0 jika bebas admin).'
    : 'Isi 0 jika bebas biaya admin (dipotong dari saldo pengirim).';
}

async function prosesTransferSaldo(event) {
  event.preventDefault();
  const dari = document.getElementById('trfDari').value;
  const ke = document.getElementById('trfKe').value;
  const nominal = parseRupiahInput(document.getElementById('trfNominal').value);
  const biayaAdminRaw = parseRupiahInput(document.getElementById('trfAdmin').value);
  const biayaAdmin = Number.isFinite(biayaAdminRaw) ? biayaAdminRaw : 0;
  const catatan = document.getElementById('trfCatatan').value.trim();
  if (!dari || !ke || dari.toLowerCase() === ke.toLowerCase()) return showToast("Pilih rekening asal dan tujuan yang berbeda.", 'error');
  if (!Number.isFinite(nominal) || nominal <= 0) return showToast("Masukkan nominal transfer lebih dari 0.", 'error');
  if (!Number.isFinite(biayaAdmin) || biayaAdmin < 0) return showToast("Biaya admin tidak boleh negatif.", 'error');
  const saldoDari = getMyWalletBalance(dari);
  if (saldoDari - (nominal + biayaAdmin) < 0) {
    return showToast(`Saldo ${dari} tidak mencukupi (tersedia: ${formatRp(Math.max(0, saldoDari))}). Saldo tidak boleh minus.`, 'error');
  }
  const btn = document.getElementById('btnProsesTrf');
  btn.innerHTML = `${spinnerIcon()}<span>Memproses...</span>`;
  btn.disabled = true;
  const res = await callAPI('transferSaldo', { form: { tanggal: todayIso(), dari, ke, nominal, biayaAdmin, catatan } });
  btn.innerHTML = 'Pindahkan Saldo Sekarang';
  btn.disabled = false;
  if (res?.sukses) { showToast(res.pesan || 'Saldo berhasil dipindahkan.', 'success'); closeTransferModal(); loadDataDashboard(true); }
  else if (!res?.authError) showToast(res?.pesan || "Gagal memindahkan saldo.", 'error');
}

function openTargetModal() {
  const opsiPos = ["Semua", ...(listKategori.tabungan || ['Simpanan', 'Liburan', 'Keperluan Lainnya']).map(cleanPosName)];
  const sel = document.getElementById('targetPosSelect');
  sel.innerHTML = opsiPos.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
  sel.value = opsiPos.includes(latestTargetTabungan.pos) ? latestTargetTabungan.pos : "Semua";
  setRupiahInputValue('targetNominalInput', latestTargetTabungan.nominal || '');
  openModalDialog('targetModal', closeTargetModal, document.getElementById('targetNominalInput'));
}
function closeTargetModal() { closeModalDialog('targetModal'); }

async function simpanTargetBaru(event) {
  event.preventDefault();
  const pos = document.getElementById('targetPosSelect').value;
  const nominal = parseRupiahInput(document.getElementById('targetNominalInput').value);
  if (!Number.isFinite(nominal) || nominal <= 0) return showToast('Nominal target harus lebih dari 0.', 'error');
  const btn = document.getElementById('btnSimpanTarget');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  const res = await callAPI('setTarget', { pos, nominal });
  btn.disabled = false;
  btn.innerHTML = 'Simpan Target';
  if (res?.sukses) { showToast('Target celengan berhasil diperbarui.', 'success'); closeTargetModal(); loadDataDashboard(true); }
  else if (!res?.authError) showToast(res?.pesan || 'Gagal memperbarui target.', 'error');
}

function switchOwnerHutang(ownerType) {
  activeHutangOwner = ownerType;
  const isMe = ownerType === 'me';
  document.getElementById('btnViewHutangku').setAttribute('aria-pressed', String(isMe));
  document.getElementById('btnViewHutangPasangan').setAttribute('aria-pressed', String(!isMe));
  document.getElementById('formInputHutangBox').classList.toggle('hide', !isMe);
  renderHutang();
}

function renderHutang() {
  const listUi = document.getElementById('listHutang');
  const semuaAktif = (latestDaftarHutang || []).filter(h => h.status === 'Aktif');
  const hutangkuList = semuaAktif.filter(h => String(h.oleh).trim() === activeUser);
  const hutangPasanganList = semuaAktif.filter(h => String(h.oleh).trim() !== activeUser);
  document.getElementById('countHutangku').innerText = hutangkuList.length;
  document.getElementById('countHutangPasangan').innerText = hutangPasanganList.length;

  const totalAku = hutangkuList.reduce((acc, h) => acc + (Number(h.sisaHutang) || 0), 0);
  const totalPasangan = hutangPasanganList.reduce((acc, h) => acc + (Number(h.sisaHutang) || 0), 0);
  const cicilanAku = hutangkuList.reduce((acc, h) => acc + (Number(h.cicilanRutin) || 0), 0);
  const cicilanPasangan = hutangPasanganList.reduce((acc, h) => acc + (Number(h.cicilanRutin) || 0), 0);
  const myShort = (activeUser || 'Aku').split(' ')[0];
  const partnerShort = (partnerFullName || 'Pasangan').split(' ')[0];

  const elBerdua = document.getElementById('hutangTotalBerdua');
  if (elBerdua) elBerdua.innerText = formatRp(totalAku + totalPasangan);
  const elLabAku = document.getElementById('hutangLabelAku');
  if (elLabAku) elLabAku.innerText = myShort;
  const elTotAku = document.getElementById('hutangTotalAku');
  if (elTotAku) elTotAku.innerText = formatRp(totalAku);
  const elSubAku = document.getElementById('hutangSubAku');
  if (elSubAku) elSubAku.innerText = cicilanAku > 0 ? `${hutangkuList.length} tagihan • ${formatRp(cicilanAku)}/bln` : `${hutangkuList.length} tagihan aktif`;
  const elLabPas = document.getElementById('hutangLabelPasangan');
  if (elLabPas) elLabPas.innerText = partnerShort;
  const elTotPas = document.getElementById('hutangTotalPasangan');
  if (elTotPas) elTotPas.innerText = formatRp(totalPasangan);
  const elSubPas = document.getElementById('hutangSubPasangan');
  if (elSubPas) elSubPas.innerText = cicilanPasangan > 0 ? `${hutangPasanganList.length} tagihan • ${formatRp(cicilanPasangan)}/bln` : `${hutangPasanganList.length} tagihan aktif`;

  const isMe = activeHutangOwner === 'me';
  const dataTampil = isMe ? hutangkuList : hutangPasanganList;
  if (dataTampil.length === 0) {
    listUi.innerHTML = `<div class="empty"><p class="hand">${isMe ? 'Tidak ada tagihan atas namamu. Meja Neko bersih!' : `Tidak ada tagihan aktif milik ${escapeHtml(partnerShort)}.`}</p></div>`;
    return;
  }

  listUi.innerHTML = dataTampil.map(h => {
    const teksCicilan = h.cicilanRutin > 0 ? formatRp(h.cicilanRutin) : "Sesuai Tagihan";
    const rawTgl = String(h.tglJatuhTempo || '-');
    const labelJatuhTempo = (rawTgl.includes(' ') || rawTgl === '-') ? rawTgl : `Tgl ${rawTgl}`;
    const safeId = escapeHtml(h.id);
    const kontrolOwner = isMe
      ? `<div style="display:flex;gap:6px;flex-shrink:0">
           <button type="button" data-id="${safeId}" onclick="openEditHutangModal(this.dataset.id)" class="btn btn-sm">${svgIcon('i-pen', 'ico ico-sm')}<span>Edit</span></button>
           <button type="button" data-id="${safeId}" onclick="konfirmasiHapusCatatan(this.dataset.id)" aria-label="Hapus hutang ${escapeHtml(h.namaHutang)}" class="icon-btn icon-btn-sm txt-err">${svgIcon('i-trash', 'ico ico-sm')}</button>
         </div>`
      : '';
    const tombolBayar = isMe
      ? `<button type="button" data-id="${safeId}" onclick="bukaModalBayarHutang(this.dataset.id)" class="btn btn-primary btn-block">Bayar Tagihan / Cicilan</button>`
      : '';

    return `
      <div class="bill">
        <div class="bill-row">
          <div style="min-width:0;flex:1">
            <p style="font-weight:900;word-break:break-word">${escapeHtml(h.namaHutang)}</p>
            <p class="small muted">Total awal: <span class="money">${formatRp(h.totalAwal)}</span> &bull; ${escapeHtml(h.oleh)}</p>
          </div>
          <p class="money txt-err">${formatRp(h.sisaHutang)}</p>
        </div>
        <div class="bill-meta">
          <p class="small">Jatuh tempo: <b>${escapeHtml(labelJatuhTempo)}</b><br>Cicilan: <b class="money">${teksCicilan}</b></p>
          ${kontrolOwner}
        </div>
        ${tombolBayar}
      </div>
    `;
  }).join('');
}

function openEditHutangModal(idHutang) {
  const h = latestDaftarHutang.find(item => String(item.id) === String(idHutang));
  if (!h) return showToast('Data hutang tidak ditemukan.', 'error');
  selectedHutangToEdit = h;
  document.getElementById('editHutangNama').value = h.namaHutang || '';
  setRupiahInputValue('editHutangSisa', Number(h.sisaHutang) || 0);
  document.getElementById('editHutangTempo').value = (h.tglJatuhTempo && h.tglJatuhTempo !== '-') ? h.tglJatuhTempo : '';
  setRupiahInputValue('editHutangCicilan', Number(h.cicilanRutin) || 0);
  openModalDialog('editHutangModal', closeEditHutangModal, document.getElementById('editHutangNama'));
}
function closeEditHutangModal() { closeModalDialog('editHutangModal'); selectedHutangToEdit = null; }

async function simpanEditHutang(event) {
  event.preventDefault();
  if (!selectedHutangToEdit) return;
  const namaHutang = document.getElementById('editHutangNama').value.trim();
  const sisaHutang = parseRupiahInput(document.getElementById('editHutangSisa').value);
  const tgl = document.getElementById('editHutangTempo').value.trim();
  const cicilanRaw = parseRupiahInput(document.getElementById('editHutangCicilan').value);
  const cicilan = Number.isFinite(cicilanRaw) ? cicilanRaw : 0;
  if (!namaHutang) return showToast('Nama hutang wajib diisi.', 'error');
  if (!Number.isFinite(sisaHutang) || sisaHutang < 0) return showToast('Sisa hutang harus angka 0 atau lebih.', 'error');
  const btn = document.getElementById('btnSimpanEditHutang');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  const res = await callAPI('updatePengingatHutang', { id: selectedHutangToEdit.id, namaHutang, sisaHutang, tgl, cicilan });
  btn.disabled = false;
  btn.innerHTML = 'Simpan Perubahan';
  if (res?.sukses) { showToast('Data hutang berhasil diperbarui.', 'success'); closeEditHutangModal(); loadDataDashboard(true); }
  else if (!res?.authError) showToast(res?.pesan || 'Gagal memperbarui hutang.', 'error');
}

async function simpanHutangBaru(event) {
  event.preventDefault();
  const nama = document.getElementById('inputNamaHutang').value.trim();
  const nominal = parseRupiahInput(document.getElementById('inputNominalHutang').value);
  if (!nama || !Number.isFinite(nominal) || nominal <= 0) return showToast('Nama dan Total Hutang (> 0) wajib diisi.', 'error');
  const btn = document.getElementById('btnSimpanHutang');
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  btn.disabled = true;
  const res = await callAPI('tambahHutang', { form: { tanggal: todayIso(), namaHutang: nama, nominal } });
  btn.innerHTML = 'Jepit ke tumpukan tagihan';
  btn.disabled = false;
  if (res?.sukses) {
    showToast('Hutang baru berhasil dicatat.', 'success');
    document.getElementById('inputNamaHutang').value = '';
    document.getElementById('inputNominalHutang').value = '';
    loadDataDashboard(true);
  } else if (!res?.authError) showToast(res?.pesan || 'Gagal mencatat hutang baru.', 'error');
}

function bukaModalBayarHutang(idHutang) {
  const h = latestDaftarHutang.find(item => String(item.id) === String(idHutang));
  if (!h) return showToast('Data hutang tidak ditemukan.', 'error');
  selectedHutangToPay = { id: h.id, sisa: Number(h.sisaHutang) || 0, nama: h.namaHutang };
  document.getElementById('labelNamaHutangBayar').innerText = `${h.namaHutang} (Sisa: ${formatRp(h.sisaHutang)})`;
  setRupiahInputValue('bayarHutangNominal', h.sisaHutang);
  const dompetList = getUniqueDompetList();
  document.getElementById('bayarHutangMetode').innerHTML = dompetList.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${formatRp(getMyWalletBalance(c))})</option>`).join('');
  openModalDialog('bayarHutangModal', closeBayarHutangModal, document.getElementById('bayarHutangNominal'));
}
function closeBayarHutangModal() { closeModalDialog('bayarHutangModal'); }

async function konfirmasiBayarHutang(event) {
  event.preventDefault();
  const nominalBayar = parseRupiahInput(document.getElementById('bayarHutangNominal').value);
  const metode = document.getElementById('bayarHutangMetode').value;
  if (!Number.isFinite(nominalBayar) || nominalBayar <= 0) return showToast("Masukkan nominal pembayaran lebih dari 0.", 'error');
  if (nominalBayar > selectedHutangToPay.sisa) return showToast("Nominal bayar melebihi sisa hutang.", 'error');
  const saldoDompet = getMyWalletBalance(metode);
  if (saldoDompet - nominalBayar < 0) {
    return showToast(`Saldo ${metode} tidak mencukupi (tersedia: ${formatRp(Math.max(0, saldoDompet))}). Saldo tidak boleh minus.`, 'error');
  }
  const btn = document.getElementById('btnKonfirmasiBayarHutang');
  btn.innerHTML = `${spinnerIcon()}<span>Memproses...</span>`;
  btn.disabled = true;
  const res = await callAPI('bayarHutang', { idHutang: selectedHutangToPay.id, nominalBayar, metode });
  btn.innerHTML = 'Bayar Sekarang';
  btn.disabled = false;
  if (res?.sukses) { showToast(`Pembayaran dicatat & memotong saldo ${metode}.`, 'success'); closeBayarHutangModal(); loadDataDashboard(true); }
  else if (!res?.authError) showToast(res?.pesan || "Gagal mencatat pembayaran hutang.", 'error');
}

function syncKategoriPickerActive() {
  const curVal = document.getElementById('inputKategori')?.value || '';
  document.querySelectorAll('#kategoriPickerGrid .cat-pick-btn[data-val]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.val === curVal));
  });
}

function pilihKategoriPicker(val) {
  const sel = document.getElementById('inputKategori');
  if (!sel) return;
  if (val === 'ADD_NEW') {
    sel.value = 'ADD_NEW';
    cekKategoriBaru();
    return;
  }
  sel.value = val;
  syncKategoriPickerActive();
}

function renderKategoriPickerGrid(items) {
  const grid = document.getElementById('kategoriPickerGrid');
  if (!grid) return;
  const curVal = document.getElementById('inputKategori')?.value || '';
  const addLabel = tipeAktif === 'Tabungan' ? 'Pos baru' : 'Kategori baru';
  grid.innerHTML = [
    ...items.map(it => {
      const iconId = getCategoryIconId(it.raw);
      const cleanLbl = stripCategoryEmoji(it.raw) || it.val;
      const pressed = curVal === it.val;
      return `<button type="button" class="cat-pick-btn" data-val="${escapeHtml(it.val)}" onclick="pilihKategoriPicker(this.dataset.val)" aria-pressed="${String(pressed)}">${svgIcon(iconId, 'ico ico-sm cat-ico')}<span>${escapeHtml(cleanLbl)}</span></button>`;
    }),
    `<button type="button" class="cat-pick-btn cat-pick-add" onclick="pilihKategoriPicker('ADD_NEW')">${svgIcon('i-plus', 'ico ico-sm')}<span>${addLabel}</span></button>`
  ].join('');
}

function renderKategori() {
  const arr = tipeAktif === 'Pemasukan' ? listKategori.masuk : listKategori.keluar;
  const items = (arr || []).map(k => ({ val: k, raw: k }));
  document.getElementById('inputKategori').innerHTML = [
    '<option value="" disabled selected>-- Pilih Kategori --</option>',
    ...items.map(it => `<option value="${escapeHtml(it.val)}">${escapeHtml(stripCategoryEmoji(it.raw) || it.val)}</option>`),
    '<option value="ADD_NEW">+ Tambah Kategori Baru</option>'
  ].join('');
  renderKategoriPickerGrid(items);
}

function renderKategoriTabungan() {
  const posList = listKategori.tabungan?.length > 0 ? listKategori.tabungan : ['Simpanan', 'Liburan', 'Keperluan Lainnya'];
  const items = posList.map(k => ({ val: cleanPosName(k), raw: k }));
  document.getElementById('inputKategori').innerHTML = [
    '<option value="" disabled selected>-- Pilih Pos Tabungan --</option>',
    ...items.map(it => `<option value="${escapeHtml(it.val)}">${escapeHtml(stripCategoryEmoji(it.raw) || it.val)}</option>`),
    '<option value="ADD_NEW">+ Tambah Pos Tabungan Baru</option>'
  ].join('');
  renderKategoriPickerGrid(items);
}

function renderMetodePembayaran() {
  const select = document.getElementById('inputMetode');
  const label = document.getElementById('labelMetodeBayar');
  const hintTab = document.getElementById('hintMetodeTabungan');
  const dompetList = getUniqueDompetList();
  const paylaterList = listKategori.paylater || ["GopayLater", "SpayLater", "TiktokPaylater", "Kredivo", "Indodana"];
  hintTab.classList.toggle('hide', tipeAktif !== 'Tabungan');

  if (tipeAktif === 'Pemasukan') {
    label.innerText = "Masuk ke Saldoku / Rekening";
    select.innerHTML = [
      ...dompetList.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`),
      '<option value="ADD_NEW_DOMPET">+ Tambah Dompet / Rekening Lainnya</option>'
    ].join('');
  } else if (tipeAktif === 'Pengeluaran') {
    label.innerText = "Pembayaran Menggunakan";
    select.innerHTML = `
      <optgroup label="Saldoku (Rekening / E-Wallet / Cash)">
        ${dompetList.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${formatRp(getMyWalletBalance(c))})</option>`).join('')}
      </optgroup>
      <optgroup label="PayLater (Otomatis Masuk Hutangku)">
        ${paylaterList.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
      </optgroup>
      <option value="ADD_NEW_DOMPET">+ Tambah Dompet / Rekening Lainnya</option>
    `;
  } else {
    label.innerText = jenisTabunganAktif === 'Setor' ? "Sumber Dana (Opsional)" : "Tujuan Dana (Opsional)";
    select.innerHTML = [
      '<option value="Virtual">Alokasi Virtual (Tidak ubah saldo dompet)</option>',
      ...dompetList.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${formatRp(getMyWalletBalance(c))})</option>`),
      '<option value="ADD_NEW_DOMPET">+ Tambah Dompet / Rekening Lainnya</option>'
    ].join('');
  }
  cekInfoPaylater();
}

function cekInfoPaylater() {
  const metode = document.getElementById('inputMetode').value;
  const tgl = document.getElementById('inputTanggal').value;
  const infoBox = document.getElementById('infoPaylaterBox');
  if (tipeAktif === 'Pengeluaran' && isPaylater(metode)) {
    const jatuhTempo = hitungPreviewJatuhTempo(tgl, metode);
    document.getElementById('infoPaylaterText').innerHTML = `Pembayaran via <strong>${escapeHtml(metode)}</strong> otomatis masuk ke <strong>Hutangku</strong> &amp; jatuh tempo <strong>${escapeHtml(jatuhTempo)}</strong>.`;
    infoBox.classList.remove('hide');
  } else {
    infoBox.classList.add('hide');
  }
}

function cekMetodeBaru() {
  const select = document.getElementById('inputMetode');
  if (select.value === "ADD_NEW_DOMPET") {
    select.selectedIndex = 0;
    openTambahDompetModal((namaBaru) => {
      renderMetodePembayaran();
      select.value = namaBaru;
      cekInfoPaylater();
      loadDataDashboard(true);
    });
  } else {
    cekInfoPaylater();
  }
}

function setTipe(tipe) {
  tipeAktif = tipe;
  const btns = [
    ['btnPemasukan', tipe === 'Pemasukan'],
    ['btnPengeluaran', tipe === 'Pengeluaran'],
    ['btnTabungan', tipe === 'Tabungan']
  ];
  btns.forEach(([id, active]) => {
    const b = document.getElementById(id);
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  const isTab = tipe === 'Tabungan';
  document.getElementById('opsiTabungan').classList.toggle('hide', !isTab);
  if (isTab) renderKategoriTabungan();
  else renderKategori();
  renderMetodePembayaran();
}

function setJenisTabungan(jenis) {
  jenisTabunganAktif = jenis;
  document.getElementById('btnSetor').setAttribute('aria-pressed', String(jenis === 'Setor'));
  document.getElementById('btnTarik').setAttribute('aria-pressed', String(jenis === 'Tarik'));
  if (tipeAktif === 'Tabungan') renderMetodePembayaran();
}

function cekKategoriBaru() {
  const select = document.getElementById('inputKategori');
  if (select.value !== "ADD_NEW") return;
  select.value = "";
  const isTab = tipeAktif === 'Tabungan';
  openAddMasterModal({
    tipe: tipeAktif,
    title: isTab ? 'Tambah Pos Tabungan Baru' : `Tambah Kategori ${tipeAktif}`,
    label: isTab ? 'Nama Pos Tabungan' : 'Nama Kategori',
    placeholder: isTab ? 'Contoh: Rumah Impian' : 'Contoh: Sushi Berdua',
    hint: 'Nama kategori bebas sesuai kebutuhanmu.',
    onSuccess: (namaBaru) => {
      if (isTab) { renderKategoriTabungan(); select.value = cleanPosName(namaBaru); syncKategoriPickerActive(); loadDataDashboard(true); }
      else { renderKategori(); select.value = namaBaru; syncKategoriPickerActive(); }
    }
  });
}

async function scanStrukLokalOCR(dataUrl) {
  try {
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
    const result = await Tesseract.recognize(dataUrl, 'ind+eng');
    const rawText = result?.data?.text || "";
    if (!rawText.trim()) return null;
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    const catatanToko = lines.length > 0 ? `Struk: ${lines[0].substring(0, 35)}` : "Struk Belanja";
    const kandidatTotal = [], semuaAngka = [];
    lines.forEach(line => {
      const isTotal = /total|jumlah|bayar|tagihan|subtotal|amount|tunai|cash|debit|qris/i.test(line);
      const isChange = /kembali|change/i.test(line);
      const regexHarga = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,8})(?:[.,]\d{2})?\b/gi;
      let m;
      while ((m = regexHarga.exec(line)) !== null) {
        const cleanNum = parseInt(m[1].replace(/[.,]/g, ''), 10);
        if (cleanNum >= 1000 && cleanNum <= 50000000 && ![2024, 2025, 2026, 2027, 2028].includes(cleanNum)) {
          semuaAngka.push(cleanNum);
          if (isTotal && !isChange) kandidatTotal.push(cleanNum);
        }
      }
    });
    const nominalTerbaca = kandidatTotal.length > 0 ? Math.max(...kandidatTotal) : (semuaAngka.length > 0 ? Math.max(...semuaAngka) : 0);
    let tanggalTerbaca = todayIso();
    const mDate = rawText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})\b/) || rawText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/);
    if (mDate) {
      const dd = Number(mDate[1]), mm = Number(mDate[2]), yyyy = mDate[3].length === 2 ? Number(`20${mDate[3]}`) : Number(mDate[3]);
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) tanggalTerbaca = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
    let kategoriTerbaca = "Belanja Bulanan";
    if (/kopi|cafe|coffee|resto|ayam|makan|food|tea|bakery|warung|mie/i.test(rawText)) kategoriTerbaca = "Makan & Minum";
    else if (/pertamina|spbu|bensin|parkir|gojek|grab|maxim/i.test(rawText)) kategoriTerbaca = "Transportasi";
    return { nominal: nominalTerbaca, tanggal: tanggalTerbaca, kategori: kategoriTerbaca, catatan: catatanToko };
  } catch (_) { return null; }
}

function terapkanHasilStrukKeForm(hasil) {
  setTipe('Pengeluaran');
  document.getElementById('inputTanggal').value = hasil.tanggal || todayIso();
  if (Number(hasil.nominal) > 0) setRupiahInputValue('inputNominal', hasil.nominal);
  document.getElementById('inputCatatan').value = hasil.catatan || '';
  const selKat = document.getElementById('inputKategori');
  if (hasil.kategori) {
    const cleanTarget = cleanPosName(hasil.kategori).toLowerCase();
    for (let i = 0; i < selKat.options.length; i++) {
      const optText = selKat.options[i].value.toLowerCase();
      if (optText.includes(cleanTarget) || (cleanTarget.includes('makan') && optText.includes('makan')) || (cleanTarget.includes('belanja') && optText.includes('belanja'))) {
        selKat.selectedIndex = i; break;
      }
    }
  }
  syncKategoriPickerActive();
  cekInfoPaylater();
}

function prosesScanAI() {
  const inputNode = document.getElementById('fotoStruk');
  const file = inputNode.files[0];
  if (!file) return;
  const btnUi = document.getElementById('btnScanUi');
  const resetBtn = () => { btnUi.innerHTML = `${svgIcon('i-camera')}<span>Foto Struk</span>`; inputNode.value = ''; };
  btnUi.innerHTML = `${spinnerIcon()}<span>Membaca Struk...</span>`;
  const reader = new FileReader();
  reader.onerror = () => { showToast('Gagal membaca file gambar.', 'error'); resetBtn(); };
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = () => { showToast('Format gambar tidak didukung. Gunakan JPG/PNG.', 'error'); resetBtn(); };
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const scaleSize = img.width > 700 ? 700 / img.width : 1;
        canvas.width = Math.max(1, Math.round(img.width * scaleSize));
        canvas.height = Math.max(1, Math.round(img.height * scaleSize));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        const base64 = dataUrl.split(',')[1];
        const res = await callAPI('scanStruk', { base64, mimeType: 'image/jpeg' });
        if (res?.sukses && res.hasil) {
          terapkanHasilStrukKeForm(res.hasil);
          showToast('Struk terbaca oleh Neko AI. Periksa kembali datanya.', 'success');
        } else if (!res?.authError) {
          btnUi.innerHTML = `${spinnerIcon()}<span>Memuat OCR Lokal...</span>`;
          const ocrHasil = await scanStrukLokalOCR(dataUrl);
          if (ocrHasil?.nominal > 0) {
            terapkanHasilStrukKeForm(ocrHasil);
            showToast('Struk dibaca via OCR lokal. Periksa kembali datanya.', 'success');
          } else {
            showToast(`Gagal membaca struk: ${res?.pesan || 'Pastikan foto jelas dan terang.'}`, 'error');
          }
        }
      } catch (_) {
        showToast('Terjadi kesalahan saat memproses struk.', 'error');
      } finally { resetBtn(); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function simpanTransaksi(event) {
  event.preventDefault();
  const nominalNum = parseRupiahInput(document.getElementById('inputNominal').value);
  const form = {
    tanggal: document.getElementById('inputTanggal').value,
    tipe: tipeAktif,
    kategori: document.getElementById('inputKategori').value,
    metode: document.getElementById('inputMetode').value || (tipeAktif === 'Tabungan' ? 'Virtual' : 'Uang Cash'),
    nominal: nominalNum,
    catatan: document.getElementById('inputCatatan').value.trim()
  };
  if (!form.tanggal || !form.kategori || form.kategori === 'ADD_NEW') return showToast('Tanggal dan Kategori wajib diisi.', 'error');
  if (!Number.isFinite(nominalNum) || nominalNum <= 0) return showToast('Nominal harus lebih dari 0.', 'error');

  if (tipeAktif === 'Pengeluaran' && !isPaylater(form.metode)) {
    const saldoDompet = getMyWalletBalance(form.metode);
    if (saldoDompet - nominalNum < 0) return showToast(`Saldo ${form.metode} tidak mencukupi (tersedia: ${formatRp(Math.max(0, saldoDompet))}).`, 'error');
  } else if (tipeAktif === 'Tabungan' && jenisTabunganAktif === 'Setor' && form.metode && form.metode.toLowerCase() !== 'virtual') {
    const saldoDompet = getMyWalletBalance(form.metode);
    if (saldoDompet - nominalNum < 0) return showToast(`Saldo ${form.metode} tidak mencukupi untuk setor tabungan (tersedia: ${formatRp(Math.max(0, saldoDompet))}).`, 'error');
  }

  const btn = document.getElementById('btnSimpan');
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  btn.disabled = true;
  const res = tipeAktif === 'Tabungan'
    ? await callAPI('tambahTabungan', { form: { ...form, pos: form.kategori, jenis: jenisTabunganAktif } })
    : await callAPI('tambahTransaksi', { form });
  btn.innerHTML = 'Simpan ke buku besar';
  btn.disabled = false;

  if (res?.sukses) {
    showToast("Transaksi berhasil dicatat." + (res.pesanTambahan || ""), 'success');
    document.getElementById('inputNominal').value = '';
    document.getElementById('inputCatatan').value = '';
    document.getElementById('inputKategori').value = '';
    syncKategoriPickerActive();
    document.getElementById('inputTanggal').value = todayIso();
    cekInfoPaylater();
    await loadDataDashboard(true);
    switchTab('dashboard');
  } else if (!res?.authError) showToast(res?.pesan || 'Gagal menyimpan transaksi.', 'error');
}

function switchOwnerRekap(ownerType) {
  activeRekapOwner = ownerType;
  rekapVisibleCount = REKAP_BATCH_SIZE;
  document.getElementById('btnRekapAku').setAttribute('aria-pressed', String(ownerType === 'me'));
  document.getElementById('btnRekapPasangan').setAttribute('aria-pressed', String(ownerType !== 'me'));
  renderListRekap();
}

function ubahFilterRekap() {
  rekapSearchQuery = String(document.getElementById('inputCariRekap').value || '').trim().toLowerCase();
  rekapFilterTipe = document.getElementById('filterRekapTipe').value || 'all';
  rekapVisibleCount = REKAP_BATCH_SIZE;
  renderListRekap();
}

function muatLebihBanyakRekap() { rekapVisibleCount += REKAP_BATCH_SIZE; renderListRekap(); }

async function loadRekap() {
  if (!activeToken) return;
  const bln = document.getElementById('inputBulan').value;
  if (!bln) return;
  const listUi = document.getElementById('listRekap');
  document.getElementById('loadMoreRekapBox').classList.add('hide');
  document.getElementById('infoTotalRekap').innerText = '';
  listUi.setAttribute('aria-busy', 'true');
  listUi.innerHTML = `<p class="small muted" style="text-align:center;padding:18px 0;display:flex;align-items:center;justify-content:center;gap:8px">${spinnerIcon()}<span>Memuat catatan bulan ini...</span></p>`;

  const res = await callAPI('getRekap', { bulanTahun: bln });
  listUi.setAttribute('aria-busy', 'false');
  if (res?.sukses && Array.isArray(res.detail)) {
    dataRekapBulanIni = res.detail;
    rekapPerUserBulanIni = res.rekapPerUser || {};
    let masukAku = rekapPerUserBulanIni[activeUser]?.masuk;
    let keluarAku = rekapPerUserBulanIni[activeUser]?.keluar;
    let masukPasangan = rekapPerUserBulanIni[partnerFullName]?.masuk;
    let keluarPasangan = rekapPerUserBulanIni[partnerFullName]?.keluar;

    if (masukAku === undefined || masukPasangan === undefined) {
      masukAku = 0; keluarAku = 0; masukPasangan = 0; keluarPasangan = 0;
      dataRekapBulanIni.forEach(d => {
        const isMine = String(d.Oleh).trim() === activeUser;
        const nom = Number(d.Nominal) || 0;
        if (d.Tipe === 'Pemasukan') { if (isMine) masukAku += nom; else masukPasangan += nom; }
        else if (d.Tipe === 'Pengeluaran' && !isPaylater(d.Metode)) { if (isMine) keluarAku += nom; else keluarPasangan += nom; }
      });
    }

    const myShort = (activeUser || 'Aku').split(' ')[0];
    const partnerShort = (partnerFullName || 'Pasangan').split(' ')[0];
    document.getElementById('rekapMasukAkuLabel').innerText = myShort;
    document.getElementById('rekapMasukPasanganLabel').innerText = partnerShort;
    document.getElementById('rekapKeluarAkuLabel').innerText = myShort;
    document.getElementById('rekapKeluarPasanganLabel').innerText = partnerShort;
    document.getElementById('rekapTabNamaAku').innerText = myShort;
    document.getElementById('rekapTabNamaPasangan').innerText = partnerShort;
    document.getElementById('rekapMasuk').innerText = formatRp(res.totalMasuk);
    document.getElementById('rekapKeluar').innerText = formatRp(res.totalKeluar);
    document.getElementById('rekapMasukAku').innerText = formatRp(masukAku);
    document.getElementById('rekapMasukPasangan').innerText = formatRp(masukPasangan);
    document.getElementById('rekapKeluarAku').innerText = formatRp(keluarAku);
    document.getElementById('rekapKeluarPasangan').innerText = formatRp(keluarPasangan);
    rekapVisibleCount = REKAP_BATCH_SIZE;
    renderListRekap();
  } else if (!res?.authError) {
    dataRekapBulanIni = [];
    listUi.innerHTML = `<div class="empty"><p class="small txt-err" style="font-weight:800">${escapeHtml(res?.pesan || 'Gagal memuat rekap.')}</p><button type="button" onclick="loadRekap()" class="btn btn-sm">Coba Lagi</button></div>`;
  }
}

function renderListRekap() {
  const listUi = document.getElementById('listRekap');
  const loadMoreBox = document.getElementById('loadMoreRekapBox');
  const btnLoadMore = document.getElementById('btnLoadMoreRekap');
  const infoTotal = document.getElementById('infoTotalRekap');

  const listAku = dataRekapBulanIni.filter(d => String(d.Oleh).trim() === activeUser);
  const listPasangan = dataRekapBulanIni.filter(d => String(d.Oleh).trim() !== activeUser);
  document.getElementById('countRekapAku').innerText = listAku.length;
  document.getElementById('countRekapPasangan').innerText = listPasangan.length;

  const isMeTab = activeRekapOwner === 'me';
  const baseList = isMeTab ? listAku : listPasangan;
  const filteredList = baseList.filter(d => {
    if (rekapFilterTipe !== 'all' && d.Tipe !== rekapFilterTipe) return false;
    if (rekapSearchQuery) {
      const hay = `${d.Kategori || ''} ${d.Catatan || ''} ${d.Metode || ''} ${d.Tanggal || ''} ${d.Nominal || ''}`.toLowerCase();
      if (!hay.includes(rekapSearchQuery)) return false;
    }
    return true;
  });

  const hasFilter = rekapFilterTipe !== 'all' || Boolean(rekapSearchQuery);
  infoTotal.innerText = hasFilter ? `${filteredList.length} dari ${baseList.length} Trx` : `Total ${dataRekapBulanIni.length} Trx`;

  if (filteredList.length === 0) {
    const partnerShort = (partnerFullName || 'Pasangan').split(' ')[0];
    listUi.innerHTML = `<div class="empty"><p class="hand">${hasFilter ? 'Tidak ada transaksi yang cocok dengan filter.' : (isMeTab ? 'Belum ada transaksi milikmu di bulan ini.' : `Belum ada transaksi milik ${escapeHtml(partnerShort)} di bulan ini.`)}</p></div>`;
    loadMoreBox.classList.add('hide');
    return;
  }

  const itemsDitampilkan = filteredList.slice(0, rekapVisibleCount);
  const sisaCount = filteredList.length - itemsDitampilkan.length;

  listUi.innerHTML = itemsDitampilkan.map(d => {
    const isOwner = String(d.Oleh).trim() === activeUser;
    const isTrf = d.Tipe === 'Transfer';
    const isAdj = d.Tipe === 'Penyesuaian';
    const isMasuk = d.Tipe === 'Pemasukan' || (d.Tipe === 'Tabungan' && (d.jenisTabungan === 'Setor' || String(d.Catatan).startsWith('Setor')));
    const iconId = isAdj ? 'i-sliders' : (isTrf ? 'i-transfer' : (isMasuk ? 'i-arrow-down' : 'i-arrow-up'));
    const color = isAdj ? 'txt-warn' : (isTrf ? 'txt-purple' : (isMasuk ? 'pen-reza' : 'pen-naghiya'));
    const badgeMetode = d.Metode ? `<span class="trx-pill">${escapeHtml(d.Metode)}</span>` : '';
    const nominalText = isAdj && Number(d.Nominal) > 0 ? `+${formatRp(d.Nominal)}` : formatRp(d.Nominal);
    const aksiHtml = isOwner
      ? `<div class="trx-actions">
           <button type="button" data-id="${escapeHtml(d.id)}" onclick="bukaEditTransaksiById(this.dataset.id)" aria-label="Edit ${escapeHtml(d.Kategori)}" class="icon-btn icon-btn-sm">${svgIcon('i-pen', 'ico ico-sm')}</button>
           <button type="button" data-id="${escapeHtml(d.id)}" onclick="konfirmasiHapusCatatan(this.dataset.id)" aria-label="Hapus ${escapeHtml(d.Kategori)}" class="icon-btn icon-btn-sm txt-err">${svgIcon('i-trash', 'ico ico-sm')}</button>
         </div>`
      : `<p class="small muted" style="margin-top:6px" title="Milik ${escapeHtml(d.Oleh)}">${svgIcon('i-lock', 'ico ico-sm')}</p>`;

    return `
      <div class="trx-item">
        <span class="trx-dir ${color}" aria-hidden="true">${svgIcon(iconId, 'ico ico-sm')}</span>
        <div style="min-width:0">
          <p style="font-weight:800;font-size:.9rem;word-break:break-word;display:flex;align-items:center;flex-wrap:wrap;gap:4px">${renderCategoryWithIcon(d.Kategori)}${badgeMetode}</p>
          <p class="small muted">${escapeHtml(d.Tanggal)} &bull; <strong class="${isOwner ? 'pen-reza' : 'pen-naghiya'}">${escapeHtml(d.Oleh)}</strong></p>
          ${d.Catatan ? `<p class="small muted" style="font-style:italic;word-break:break-word">${escapeHtml(d.Catatan)}</p>` : ''}
        </div>
        <div style="text-align:right">
          <p class="money small ${color}">${nominalText}</p>
          ${aksiHtml}
        </div>
      </div>
    `;
  }).join('');

  loadMoreBox.classList.toggle('hide', sisaCount <= 0);
  if (sisaCount > 0) btnLoadMore.innerText = `Tampilkan Lebih Banyak (${sisaCount} lagi)`;
}

function bukaEditTransaksiById(idTrx) {
  const item = dataRekapBulanIni.find(it => String(it.id) === String(idTrx));
  if (!item) return showToast("Catatan tidak ditemukan.", 'error');
  bukaEditTransaksiObj(item);
}

function bukaEditTransaksiObj(item) {
  if (!item || String(item.Oleh).trim() !== activeUser) return showToast("Kamu hanya bisa mengedit catatan milikmu sendiri.", 'error');
  selectedTrxToEdit = item;
  const isTab = item.Tipe === 'Tabungan';
  const isTrf = item.Tipe === 'Transfer';
  const isAdj = item.Tipe === 'Penyesuaian';

  document.getElementById('editTrxTanggal').value = item.isoDate || todayIso();
  setRupiahInputValue('editTrxNominal', item.Nominal || 0, isAdj);
  document.getElementById('editTrxCatatan').value = (item.rawCatatan !== undefined ? item.rawCatatan : item.Catatan) || '';
  document.getElementById('editTrxJenisTabBox').classList.toggle('hide', !isTab);
  document.getElementById('editTrxNominalHint').classList.toggle('hide', !isAdj);

  const katSel = document.getElementById('editTrxKategori');
  let katOptions = [];
  if (isTab) {
    document.getElementById('editTrxJenisTab').value = item.jenisTabungan || 'Setor';
    katOptions = (listKategori.tabungan || ['Simpanan', 'Liburan', 'Keperluan Lainnya']).map(k => ({ val: cleanPosName(k), label: k }));
  } else if (item.Tipe === 'Pemasukan') katOptions = (listKategori.masuk || []).map(k => ({ val: k, label: k }));
  else if (item.Tipe === 'Pengeluaran') katOptions = (listKategori.keluar || []).map(k => ({ val: k, label: k }));
  else katOptions = [{ val: item.Kategori, label: item.Kategori }];

  const currentKatVal = isTab ? cleanPosName(item.Kategori) : item.Kategori;
  if (currentKatVal && !katOptions.some(o => o.val === currentKatVal)) katOptions.unshift({ val: currentKatVal, label: item.Kategori || currentKatVal });
  katSel.innerHTML = katOptions.map(o => `<option value="${escapeHtml(o.val)}">${escapeHtml(stripCategoryEmoji(o.label) || o.val)}</option>`).join('');
  katSel.value = currentKatVal;
  katSel.disabled = isTrf || isAdj || Boolean(item.isPayHutang);

  const metodeBox = document.getElementById('editTrxMetodeBox');
  const metodeSel = document.getElementById('editTrxMetode');
  const labelMetode = document.getElementById('labelEditTrxMetode');
  const dompetList = getUniqueDompetList();

  if (isTrf) {
    metodeBox.classList.add('hide');
  } else if (isTab) {
    metodeBox.classList.remove('hide');
    labelMetode.innerText = 'Sumber / Tujuan Dompet (Opsional)';
    metodeSel.innerHTML = ['<option value="Virtual">Alokasi Virtual (Tidak ubah saldo dompet)</option>', ...dompetList.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)].join('');
    metodeSel.value = item.rawMetode ? cleanPosName(item.rawMetode) : 'Virtual';
  } else {
    metodeBox.classList.remove('hide');
    labelMetode.innerText = 'Metode / Saldo';
    const allowPaylater = item.Tipe === 'Pengeluaran' && !item.isPayHutang;
    const allMethods = [...dompetList, ...(allowPaylater ? (listKategori.paylater || []) : [])];
    if (item.Metode && !allMethods.includes(item.Metode)) allMethods.unshift(item.Metode);
    metodeSel.innerHTML = allMethods.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    if (item.Metode) metodeSel.value = item.Metode;
  }

  cekEditInfoPaylater();
  openModalDialog('editTrxModal', closeEditTrxModal, document.getElementById('editTrxNominal'));
}

function cekEditInfoPaylater() {
  const box = document.getElementById('editInfoPaylaterBox');
  if (!selectedTrxToEdit || selectedTrxToEdit.Tipe !== 'Pengeluaran' || selectedTrxToEdit.isPayHutang) { box.classList.add('hide'); return; }
  const metode = document.getElementById('editTrxMetode').value;
  const tgl = document.getElementById('editTrxTanggal').value;
  if (isPaylater(metode)) {
    box.innerHTML = `Tagihan <strong>${escapeHtml(metode)}</strong> disinkronkan ke Hutang (Jatuh Tempo: <strong>${escapeHtml(hitungPreviewJatuhTempo(tgl, metode))}</strong>).`;
    box.classList.remove('hide');
  } else box.classList.add('hide');
}
function closeEditTrxModal() { closeModalDialog('editTrxModal'); selectedTrxToEdit = null; }

async function simpanEditTransaksi(event) {
  event.preventDefault();
  if (!selectedTrxToEdit) return;
  const isAdj = selectedTrxToEdit.Tipe === 'Penyesuaian';
  const tanggal = document.getElementById('editTrxTanggal').value;
  const kategori = document.getElementById('editTrxKategori').value;
  const metode = document.getElementById('editTrxMetode').value;
  const nominal = parseRupiahInput(document.getElementById('editTrxNominal').value, isAdj);
  const catatan = document.getElementById('editTrxCatatan').value.trim();
  if (!tanggal || !kategori) return showToast('Tanggal dan Kategori wajib diisi.', 'error');
  if (!Number.isFinite(nominal) || (!isAdj && nominal <= 0) || (isAdj && nominal === 0)) {
    return showToast(isAdj ? 'Nominal penyesuaian tidak boleh 0.' : 'Nominal harus lebih dari 0.', 'error');
  }
  const btn = document.getElementById('btnSimpanEditTrx');
  btn.innerHTML = `${spinnerIcon()}<span>Menyimpan...</span>`;
  btn.disabled = true;
  const formPayload = { id: selectedTrxToEdit.id, tanggal, kategori, metode, nominal, catatan };
  if (selectedTrxToEdit.Tipe === 'Tabungan') formPayload.jenis = document.getElementById('editTrxJenisTab').value;
  const res = await callAPI('editTransaksi', { form: formPayload });
  btn.innerHTML = 'Simpan Perubahan';
  btn.disabled = false;
  if (res?.sukses) {
    showToast(res.pesan || 'Transaksi berhasil diperbarui.', 'success');
    closeEditTrxModal();
    if (activeTab === 'rekap') loadRekap();
    loadDataDashboard(true);
  } else if (!res?.authError) showToast(res?.pesan || "Gagal memperbarui transaksi.", 'error');
}

function konfirmasiHapusCatatan(id) {
  openConfirmModal('Hapus Catatan?', 'Catatan ini akan dihapus permanen dan saldo/hutang terkait disesuaikan otomatis.', () => hapusCatatan(id));
}

async function hapusCatatan(id) {
  const res = await callAPI('hapusCatatan', { id });
  if (res?.sukses) {
    showToast("Catatan berhasil dihapus.", 'success');
    if (activeTab === 'rekap') loadRekap();
    loadDataDashboard(true);
  } else if (!res?.authError) showToast(res?.pesan || "Gagal menghapus catatan.", 'error');
}

async function exportXLS() {
  if (dataRekapBulanIni.length === 0) return showToast("Tidak ada data untuk diexport.", 'error');
  const btn = document.getElementById('btnExport');
  btn.disabled = true;
  btn.innerHTML = `${spinnerIcon()}<span>Menyiapkan Excel...</span>`;
  try {
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js");
    const bln = document.getElementById('inputBulan').value;
    const mapRow = (d) => ({
      Tanggal: safeExcelCell(d.Tanggal),
      Oleh: safeExcelCell(d.Oleh),
      Tipe: safeExcelCell(d.Tipe),
      Kategori: safeExcelCell(d.Kategori),
      Metode: safeExcelCell(d.Metode),
      Nominal: Number(d.Nominal) || 0,
      Catatan: safeExcelCell(d.Catatan || '')
    });
    const colWidths = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 32 }];
    const wb = XLSX.utils.book_new();
    const sanitizeSheet = (name) => String(name || 'Sheet').replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet';
    const appendListSheet = (list, sheetName) => {
      const rows = list.length > 0 ? list.map(mapRow) : [{ Tanggal: '-', Oleh: '-', Tipe: '-', Kategori: 'Belum ada transaksi', Metode: '-', Nominal: 0, Catatan: '' }];
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheet(sheetName));
    };
    const myShort = (activeUser || 'User').split(' ')[0];
    const partnerShort = (partnerFullName || 'Pasangan').split(' ')[0];
    appendListSheet(dataRekapBulanIni, `Semua_${bln}`);
    appendListSheet(dataRekapBulanIni.filter(d => String(d.Oleh).trim() === activeUser), `${myShort}_${bln}`);
    appendListSheet(dataRekapBulanIni.filter(d => String(d.Oleh).trim() !== activeUser), `${partnerShort}_${bln}`);
    XLSX.writeFile(wb, `PAWket_Rekap_${bln}.xlsx`);
    showToast('File Excel berhasil diunduh.', 'success');
  } catch (_) {
    showToast('Gagal memuat library Excel. Periksa koneksi internet.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${svgIcon('i-excel')}<span>Download Excel (.xlsx)</span>`;
  }
}
