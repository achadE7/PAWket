const API_URL = "https://script.google.com/macros/s/AKfycbzufhYyOQwVmj0qEPWd_vZwYHh-nnGo5iKNQrZFMXBHJcoFOvECMkr1qg0Y-VB7kpGf/exec";

const DESK_SCENES = {
  pagi: "assets/desk-pagi.jpg",
  siang: "assets/desk-siang.jpg",
  senja: "assets/desk-senja.jpg",
  malam: "assets/desk-malam.jpg"
};

const BULAN_INDO = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const GREET_TIME = { pagi: "Selamat pagi", siang: "Selamat siang", senja: "Selamat sore", malam: "Selamat malam" };
const REKAP_BATCH_SIZE = 10;
const DASHBOARD_STALE_MS = 60000;

const BANK_KEYWORDS = ["bni", "bri", "bca", "mandiri", "bsi", "cimb", "seabank", "jago", "permata", "btn", "danamon", "blu", "ocbc", "jenius", "mega", "panin", "maybank", "neo", "allo", "superbank", "krom"];
const EWALLET_KEYWORDS = ["gopay", "spay", "shopeepay", "dana", "ovo", "linkaja", "tapcash", "flazz", "emoney", "e-money", "brizzi", "jakcard", "astrapay", "sakuku", "isaku"];

const CATEGORY_ICON_OPTIONS = [
  { id: 'i-cat-food', label: 'Makan & Minum' },
  { id: 'i-cat-coffee', label: 'Kopi & Jajan' },
  { id: 'i-cat-cart', label: 'Belanja' },
  { id: 'i-cat-paw', label: 'Anabul' },
  { id: 'i-cat-fuel', label: 'Transportasi' },
  { id: 'i-cat-ticket', label: 'Hiburan' },
  { id: 'i-cat-baby', label: 'Anak & Keluarga' },
  { id: 'i-cat-salary', label: 'Gaji & Masuk' },
  { id: 'i-cat-gift', label: 'Bonus & Hadiah' },
  { id: 'i-cat-vault', label: 'Simpanan' },
  { id: 'i-cat-plane', label: 'Liburan' },
  { id: 'i-cat-bag', label: 'Keperluan Lain' },
  { id: 'i-cat-building', label: 'Admin & Kantor' },
  { id: 'i-cat-home', label: 'Rumah & Tagihan' },
  { id: 'i-cat-heart', label: 'Kesehatan' },
  { id: 'i-cat-book', label: 'Pendidikan' },
  { id: 'i-cat-tag', label: 'Umum' }
];
const VALID_CAT_ICON_IDS = new Set(CATEGORY_ICON_OPTIONS.map(o => o.id));

const svgIcon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const spinnerIcon = (cls = 'ico spin') => svgIcon('i-spinner', cls);

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angka) || 0);
const stripCategoryEmoji = (str = '') => String(str)
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE0E}\u{FE0F}\u{200D}]/gu, '')
  .replace(/\s+/g, ' ')
  .trim();
const cleanPosName = (str = '') => stripCategoryEmoji(str).replace(/^[^a-zA-Z0-9]+/, '').trim();
const todayIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

function getSavedCategoryIcons() {
  try {
    const parsed = JSON.parse(localStorage.getItem('pawketCatIcons_v1') || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) { return {}; }
}

function saveCategoryIconPref(rawName, iconId) {
  const key = cleanPosName(rawName).toLowerCase();
  if (!key || !VALID_CAT_ICON_IDS.has(iconId)) return;
  const map = getSavedCategoryIcons();
  map[key] = iconId;
  try { localStorage.setItem('pawketCatIcons_v1', JSON.stringify(map)); } catch (_) {}
}

function getCategoryIconId(rawName = '') {
  const raw = String(rawName || '');
  const clean = cleanPosName(raw).toLowerCase();
  const saved = getSavedCategoryIcons()[clean];
  if (saved && VALID_CAT_ICON_IDS.has(saved)) return saved;

  if (/🍔|🍜|🍛|🍕|🍽/.test(raw) || /makan|resto|warung|nasi|bakso|kuliner|food|sarapan|lunch|dinner/.test(clean)) return 'i-cat-food';
  if (/☕|🧋/.test(raw) || /kopi|cafe|kafe|coffee|jajan|snack|teh|boba/.test(clean)) return 'i-cat-coffee';
  if (/🛒/.test(raw) || /belanja|mart|supermarket|grocer|sembako|pasar/.test(clean)) return 'i-cat-cart';
  if (/🐱|🐶|🐾/.test(raw) || /anabul|kucing|neko|pet|hewan|pasir|whiskas/.test(clean)) return 'i-cat-paw';
  if (/⛽|🚗|🛵|🚌/.test(raw) || /transport|bensin|bbm|ojek|ojol|gojek|grab|parkir|tol|kereta|servis|motor|mobil/.test(clean)) return 'i-cat-fuel';
  if (/🎬|🎮|🎉/.test(raw) || /hiburan|kencan|nonton|bioskop|film|game|musik|date|konser/.test(clean)) return 'i-cat-ticket';
  if (/👶|🍼/.test(raw) || /bocil|anak|bayi|susu|popok|diaper|mainan/.test(clean)) return 'i-cat-baby';
  if (/💰|💵/.test(raw) || /gaji|salary|upah|honor|pendapatan|komisi|jualan|omzet/.test(clean)) return 'i-cat-salary';
  if (/🎁/.test(raw) || /bonus|hadiah|thr|kado|gift|cashback|angpao/.test(clean)) return 'i-cat-gift';
  if (/🏦/.test(raw) || /simpanan|darurat|deposito|invest|emas|tabung/.test(clean)) return 'i-cat-vault';
  if (/✈️|✈|🏖/.test(raw) || /liburan|wisata|travel|hotel|tiket|pesawat|jalan/.test(clean)) return 'i-cat-plane';
  if (/🛍/.test(raw) || /keperluan lain|lainnya|baju|fashion|skincare|kosmetik/.test(clean)) return 'i-cat-bag';
  if (/🏢/.test(raw) || /admin|bank|biaya|pajak|kantor|kerja/.test(clean)) return 'i-cat-building';
  if (/🏠|⚡|💧/.test(raw) || /rumah|kost|sewa|listrik|pln|air|pdam|wifi|internet|pulsa|kuota|tagihan|cicilan|hutang|kpr/.test(clean)) return 'i-cat-home';
  if (/💊|🏥|❤/.test(raw) || /sehat|kesehatan|obat|dokter|apotek|rs|klinik|vitamin|bpjs/.test(clean)) return 'i-cat-heart';
  if (/📚|🎓/.test(raw) || /buku|kuliah|sekolah|kursus|les|pendidikan|unil|kampus/.test(clean)) return 'i-cat-book';
  return 'i-cat-tag';
}

function renderCategoryWithIcon(rawName = '', extraCls = '') {
  const iconId = getCategoryIconId(rawName);
  const label = stripCategoryEmoji(rawName) || String(rawName || '').trim();
  return `<span class="cat-label${extraCls ? ' ' + extraCls : ''}">${svgIcon(iconId, 'ico ico-sm cat-ico')}<span>${escapeHtml(label)}</span></span>`;
}

const escapeHtml = (str = '') => String(str)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const safeExcelCell = (val) => (typeof val === 'string' && /^[=+\-@\t\r]/.test(val)) ? `'${val}` : val;

function parseRupiahInput(rawVal, allowNegative = false) {
  const s = String(rawVal ?? '').trim();
  if (!s) return NaN;
  const isNeg = allowNegative && s.startsWith('-');
  const digits = s.replace(/[^\d]/g, '');
  if (!digits) return NaN;
  const num = parseInt(digits, 10);
  if (!Number.isFinite(num)) return NaN;
  return isNeg ? -num : num;
}

function formatRupiahString(num, allowNegative = false) {
  if (num === '' || num === null || num === undefined) return '';
  const n = Number(num);
  if (!Number.isFinite(n)) return '';
  const absStr = Math.abs(Math.round(n)).toLocaleString('id-ID');
  return (allowNegative && n < 0) ? `-${absStr}` : absStr;
}

function formatRupiahInput(el, allowNegative = false) {
  if (!el) return;
  const raw = String(el.value || '');
  const isNeg = allowNegative && raw.trim().startsWith('-');
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) { el.value = isNeg ? '-' : ''; return; }
  const formatted = parseInt(digits, 10).toLocaleString('id-ID');
  el.value = isNeg ? `-${formatted}` : formatted;
}

function setRupiahInputValue(elId, value, allowNegative = false) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (value === '' || value === null || value === undefined) { el.value = ''; return; }
  el.value = formatRupiahString(value, allowNegative);
}

function formatEditTrxNominal(el) { formatRupiahInput(el, selectedTrxToEdit?.Tipe === 'Penyesuaian'); }

function tambahNominalCepat(delta) {
  const el = document.getElementById('inputNominal');
  if (!el) return;
  const current = parseRupiahInput(el.value);
  const next = (Number.isFinite(current) ? current : 0) + Number(delta || 0);
  el.value = formatRupiahString(Math.max(0, next));
  el.focus();
}

function resetNominalCepat() {
  const el = document.getElementById('inputNominal');
  if (!el) return;
  el.value = '';
  el.focus();
}

function injectPwaManifest() {
  try {
    const iconSvg = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' rx='44' fill='#2B2420'/><circle cx='60' cy='76' r='18' fill='#E8A33D'/><circle cx='96' cy='54' r='18' fill='#E8A33D'/><circle cx='132' cy='76' r='18' fill='#E8A33D'/><path d='M96 86c-27 0-48 21-48 42 0 15 12 24 27 24 9 0 15-3 21-3s12 3 21 3c15 0 27-9 27-24 0-21-21-42-48-42z' fill='#FBF6EC'/></svg>");
    const manifest = {
      name: "PAWket - Meja Neko",
      short_name: "PAWket",
      description: "Catatan keuangan bersama pasangan bersama Neko 3D",
      start_url: location.href.split('#')[0],
      display: "standalone",
      background_color: "#F1E6D3",
      theme_color: "#2B2420",
      icons: [{ src: iconSvg, sizes: "192x192", type: "image/svg+xml", purpose: "any" }]
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  } catch (_) {}
}

const loadedScripts = {};
function loadScriptOnce(src) {
  if (loadedScripts[src]) return loadedScripts[src];
  loadedScripts[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { delete loadedScripts[src]; reject(new Error(`Gagal memuat: ${src}`)); };
    document.head.appendChild(s);
  });
  return loadedScripts[src];
}

function detectAutoRoomTime() {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= 4 && h < 11) return 'pagi';
  if (h >= 11 && h < 15) return 'siang';
  if (h >= 15 && h < 18.5) return 'senja';
  return 'malam';
}

function applyRoomThemeAndTime() {
  const pref = localStorage.getItem('pawketTime') || 'auto';
  const t = pref === 'auto' ? detectAutoRoomTime() : pref;
  const root = document.documentElement;
  root.dataset.time = t;
  root.dataset.theme = t === 'malam' ? 'dark' : 'light';
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', t === 'malam' ? '#1B1613' : '#F1E6D3');

  const src = DESK_SCENES[t] || DESK_SCENES.siang;
  document.querySelectorAll('.js-scene-img').forEach(img => {
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  });
  const greetEl = document.getElementById('greetWord');
  if (greetEl) greetEl.innerText = GREET_TIME[t] || 'Halo';

  document.querySelectorAll('#segTime button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.time === pref));
  });
}

function setRoomTimePref(pref) {
  localStorage.setItem('pawketTime', pref);
  applyRoomThemeAndTime();
}

function applyMotionPref() {
  const saved = localStorage.getItem('pawketMotion');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = saved || (reduced ? 'off' : 'on');
  document.documentElement.dataset.motion = motion;
  document.querySelectorAll('#segMotion button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.motion === motion));
  });
  if (typeof requestNekoRenderFrame === 'function') requestNekoRenderFrame();
}

function setMotionPref(val) {
  localStorage.setItem('pawketMotion', val);
  applyMotionPref();
}
