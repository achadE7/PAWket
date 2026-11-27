let activeUser = "";
let activeToken = "";
let activeTab = "dashboard";
let partnerFullName = "Pasangan";
let tipeAktif = "Pengeluaran";
let jenisTabunganAktif = "Setor";
let listKategori = {
  masuk: [],
  keluar: [],
  tabungan: [],
  dompet: ["Uang Cash", "BNI", "BRI", "BCA", "Mandiri", "GoPay", "Spay", "Dana", "Tapcash"],
  paylater: ["GopayLater", "SpayLater", "TiktokPaylater", "Kredivo", "Indodana"]
};
let latestDompetPerUser = {};
let latestDaftarHutang = [];
let latestTargetTabungan = { pos: "Semua", nominal: 10000000 };
let latestBudgetPerUser = {};
let latestBulananPerUser = {};
let latestPengeluaranKategori = {};
let latestRiwayatTrx = [];
let activeKategoriScope = "me";
let lastDashboardFetchAt = 0;

let activeSaldoOwner = "me";
let activeHutangOwner = "me";
let activeRekapOwner = "me";
let dataRekapBulanIni = [];
let rekapPerUserBulanIni = {};
let rekapVisibleCount = REKAP_BATCH_SIZE;
let rekapSearchQuery = "";
let rekapFilterTipe = "all";
let selectedHutangToPay = { id: "", sisa: 0, nama: "" };
let selectedHutangToEdit = null;
let selectedTrxToEdit = null;
let selectedSaldoToAdjust = { nama: "", nominal: 0 };
let addMasterContext = { tipe: "Dompet", onSuccess: null };
let pendingConfirmAction = null;

let isNekoCalled = false;
let currentFinanceSignature = "";

const modalTrapStack = [];

function showToast(pesan, tipe = 'info') {
  const container = document.getElementById('toastContainer');
  const cls = tipe === 'success' ? 'toast-success' : (tipe === 'error' ? 'toast-error' : 'toast-info');
  const iconId = tipe === 'success' ? 'i-check' : (tipe === 'error' ? 'i-alert' : 'i-info');
  const el = document.createElement('div');
  el.className = `toast-item ${cls}`;
  el.innerHTML = `
    ${svgIcon(iconId, 'ico')}
    <span style="flex:1;white-space:pre-line;line-height:1.4">${escapeHtml(pesan)}</span>
    <button type="button" aria-label="Tutup notifikasi" style="background:none;border:0;color:inherit;padding:4px;min-width:36px;min-height:36px;display:inline-grid;place-items:center;flex-shrink:0">
      ${svgIcon('i-close', 'ico ico-sm')}
    </button>
  `;
  el.querySelector('button').addEventListener('click', () => el.remove());
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 260);
  }, 4200);
}

function getModalFocusable(modalEl) {
  return [...modalEl.querySelectorAll(
    'button:not(:disabled), [href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.offsetParent !== null);
}

function openModalDialog(modalId, onCloseFn, focusTargetEl = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const triggerEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.classList.remove('hide');
  document.body.classList.add('modal-open');

  const existingIdx = modalTrapStack.findIndex(item => item.modalId === modalId);
  if (existingIdx !== -1) {
    modalTrapStack[existingIdx].release();
    modalTrapStack.splice(existingIdx, 1);
  }

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (typeof onCloseFn === 'function') onCloseFn();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = getModalFocusable(modal);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  modal.addEventListener('keydown', onKeydown);
  modalTrapStack.push({
    modalId,
    triggerEl,
    release: () => modal.removeEventListener('keydown', onKeydown)
  });

  requestAnimationFrame(() => {
    const target = focusTargetEl || getModalFocusable(modal)[0];
    if (target && typeof target.focus === 'function') target.focus();
  });
}

function closeModalDialog(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hide');

  const idx = modalTrapStack.findIndex(item => item.modalId === modalId);
  let triggerToRestore = null;
  if (idx !== -1) {
    modalTrapStack[idx].release();
    triggerToRestore = modalTrapStack[idx].triggerEl;
    modalTrapStack.splice(idx, 1);
  }
  if (modalTrapStack.length === 0) document.body.classList.remove('modal-open');
  if (triggerToRestore && triggerToRestore.isConnected && triggerToRestore.offsetParent !== null) {
    try { triggerToRestore.focus(); } catch (_) {}
  }
}

function handleBackdropClose(event, closeFn) {
  if (event.target === event.currentTarget) closeFn();
}

function openConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmModalTitle').innerText = title;
  document.getElementById('confirmModalText').innerText = message;
  pendingConfirmAction = onConfirm;
  openModalDialog('confirmModal', closeConfirmModal, document.getElementById('btnConfirmAction'));
}

function closeConfirmModal() {
  closeModalDialog('confirmModal');
  pendingConfirmAction = null;
}

async function callAPI(action, payload = {}) {
  try {
    const bodyObj = { ...payload, action };
    if (activeToken && action !== 'login') bodyObj.token = activeToken;
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(bodyObj)
    });
    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (_) { return { sukses: false, pesan: `Respons server tidak valid: ${text.substring(0, 80)}` }; }
    if (parsed?.authError && action !== 'login') {
      showToast(parsed.pesan || 'Sesi berakhir. Silakan login kembali.', 'error');
      prosesLogout(true);
    }
    return parsed;
  } catch (_) {
    return { sukses: false, pesan: "Gagal terhubung ke server. Periksa koneksi internet." };
  }
}

const isPaylater = (metode = '') => {
  const m = String(metode).toLowerCase().trim();
  return (listKategori.paylater || []).some(p => p.toLowerCase() === m);
};

const hitungPreviewJatuhTempo = (tanggalStr, metode) => {
  if (!tanggalStr) return "-";
  const [year, month, day] = String(tanggalStr).split('-').map(Number);
  if (!year || !month || !day) return "-";
  const mLower = String(metode).toLowerCase().trim();
  let tambahBulan = 1;
  if (mLower === 'gopaylater' || mLower === 'tiktokpaylater') tambahBulan = (day >= 1 && day <= 15) ? 1 : 2;
  else if (mLower === 'spaylater') tambahBulan = (day >= 1 && day <= 21) ? 1 : 2;
  const targetDate = new Date(Date.UTC(year, (month - 1) + tambahBulan, 1));
  return `1 ${BULAN_INDO[targetDate.getUTCMonth()]} ${targetDate.getUTCFullYear()}`;
};
