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

const svgIcon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const spinnerIcon = (cls = 'ico spin') => svgIcon('i-spinner', cls);

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angka) || 0);
const cleanPosName = (str = '') => String(str).replace(/^[^a-zA-Z0-9]+/, '').trim();
const todayIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

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
