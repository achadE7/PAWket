const NEKO_TAB_IDS = ['nav-dashboard', 'nav-saldo', 'nav-catat', 'nav-hutang', 'nav-rekap'];
const NEKO_VOICES = [
  { id: "bocah_imut", label: "Chibi Bocah", pitch: 1.55, rate: 1.04 }
];
const NEKO_MOOD_META = {
  marah_gemas: { label: "Galak Gemas" },
  panik: { label: "Kaget Panik" },
  bangga: { label: "Bangga Ceria" },
  sarkas: { label: "Sarkas Jahil" },
  santai: { label: "Santai Ramah" },
  berpikir: { label: "Sedang Mikir" }
};
const selectedNekoVoice = 'bocah_imut';
const NEKO_CHIBI_PITCH_RATE = 1.25;
const getActiveNekoPitchRate = () => NEKO_CHIBI_PITCH_RATE;

let mainNeko3D = null;
let mainNekoNode = null;
let modalNeko3D = null;
let neko3dLoopStarted = false;
let nekoRafId = null;
let nekoT0 = 0;
const FROZEN_NEKO_T = 1.25;

let nekoSpeechState = "idle";
let nekoAudioCtx = null;
let nekoActiveSource = null;
let nekoActiveFallbackAudio = null;
let nekoLipSyncRaf = null;
let nekoSpeechRequestId = 0;
const nekoAudioCache = new Map();

let wejanganState = {
  mode: "me", // Per orang: "me" | "partner"
  isAI: true,
  isLoading: false,
  debugPesan: "",
  komentarKu: "",
  komentarPasangan: "",
  moodKu: "santai",
  moodPasangan: "santai",
  namaPasangan: "Pasangan"
};

const nekoLife = {
  loggedIn: false,
  mode: 'kursi',        // 'kursi' | 'meja' | 'balon'
  userHidden: false,
  peekTabId: 'nav-rekap',
  sneakTimers: [],
  roaming: true,
  deskPose: 'duduk',    // 'duduk' | 'rebahan'
  balloonColorIdx: 0,
  x: 60,
  y: 120,
  vx: 0.44,
  vy: 0.28,
  dragging: false,
  moved: 0,
  dragOffsetX: 0,
  dragOffsetY: 0,
  lastLifeSwitchAt: 0,
  lastSneakAt: 0,
  bubbleTimeout: null
};

function getFloatingNekoBounds() {
  const appCard = document.getElementById('appShell');
  const wrap = document.getElementById('floatingNekoWrap');
  const rect = appCard ? appCard.getBoundingClientRect() : { left: 0, right: window.innerWidth };
  const wrapW = (wrap && wrap.offsetWidth > 0) ? wrap.offsetWidth : Math.min(window.innerWidth * 0.718, 345);
  const padX = Math.round(wrapW * 0.22);
  const padTop = Math.round(wrapW * 0.08);
  const padBot = Math.round(wrapW * 0.14);
  const minX = rect.left - padX + 6;
  const maxX = Math.max(minX, Math.min(window.innerWidth, rect.right) - wrapW + padX - 6);
  const minY = 58 - padTop;
  const maxY = Math.max(minY, window.innerHeight - wrapW + padBot - 112);
  return { minX, maxX, minY, maxY, wrapW };
}

function clearNekoSneakTimers() {
  nekoLife.sneakTimers.forEach(id => clearTimeout(id));
  nekoLife.sneakTimers = [];
}

function pickRandomPeekTab(excludeTabId = null) {
  const candidates = NEKO_TAB_IDS.filter(id => id !== excludeTabId && id !== 'nav-catat');
  return candidates[Math.floor(Math.random() * candidates.length)] || 'nav-rekap';
}

function positionPeekSlot(tabId) {
  const slot = document.getElementById('peekSlot');
  const btn = document.getElementById(tabId) || document.getElementById('nav-rekap');
  if (!slot || !btn) return;
  const r = btn.getBoundingClientRect();
  slot.style.left = `${Math.round(r.left + r.width / 2 - 61)}px`;
}

function applyFloatingNekoPosition() {
  const wrap = document.getElementById('floatingNekoWrap');
  if (!wrap) return;
  wrap.style.transform = `translate3d(${nekoLife.x.toFixed(1)}px, ${nekoLife.y.toFixed(1)}px, 0)`;
}

function showFloatingNekoBubble(text, ms = 2600) {
  const b = document.getElementById('floatingNekoBubble');
  const bt = document.getElementById('floatingNekoBubbleText');
  if (!b || !bt) return;
  bt.textContent = text;
  b.classList.remove('bubble-hidden');
  if (nekoLife.bubbleTimeout) clearTimeout(nekoLife.bubbleTimeout);
  nekoLife.bubbleTimeout = setTimeout(() => b.classList.add('bubble-hidden'), ms);
}

function sneakNekoToAnotherTab(targetTabId = null) {
  const slot = document.getElementById('peekSlot');
  if (!slot || slot.classList.contains('hide')) return;
  clearNekoSneakTimers();
  const nextTab = targetTabId && NEKO_TAB_IDS.includes(targetTabId) ? targetTabId : pickRandomPeekTab(nekoLife.peekTabId);
  nekoLife.lastSneakAt = performance.now();
  slot.classList.add('is-ducked');
  nekoLife.sneakTimers.push(setTimeout(() => {
    nekoLife.peekTabId = nextTab;
    positionPeekSlot(nextTab);
  }, 280));
  nekoLife.sneakTimers.push(setTimeout(() => {
    slot.classList.remove('is-ducked');
  }, 560));
}

// Mode balon tetap melayang saat pindah tab; mode kursi/meja mengintip di balik tab.
function getEffectiveNekoPlacement() {
  const modal = document.getElementById('nekoModal');
  const modalOpen = modal && !modal.classList.contains('hide');
  if (!nekoLife.loggedIn || modalOpen) return 'none';
  if (nekoLife.userHidden) return 'peek';
  if (nekoLife.mode === 'balon') return 'balon';
  if (activeTab === 'dashboard') return nekoLife.mode;
  return 'peek';
}

function getDefaultDeskWejanganSnippet() {
  const isMe = wejanganState.mode === 'me';
  const raw = isMe ? wejanganState.komentarKu : wejanganState.komentarPasangan;
  return (raw || 'Ketuk kopi kalau mau ngobrol sama Neko!').replace(/\*\*/g, '');
}

function setDeskBubbleShort(text) {
  const el = document.getElementById('bubbleText');
  if (el) el.innerText = text;
}

function placeNeko() {
  if (!mainNekoNode) return;
  const placement = getEffectiveNekoPlacement();
  const seat = document.getElementById('nekoSeat');
  const hit = document.getElementById('nekoHit');
  const bubble = document.getElementById('nekoBubble');
  const peekSlot = document.getElementById('peekSlot');
  const floatWrap = document.getElementById('floatingNekoWrap');
  const floatStage = document.getElementById('floatingNekoStage');

  if (placement === 'none') {
    clearNekoSneakTimers();
    peekSlot.classList.add('hide');
    floatWrap.classList.add('hide');
    requestNekoRenderFrame();
    return;
  }

  if (placement === 'balon') {
    clearNekoSneakTimers();
    peekSlot.classList.add('hide');
    hit.classList.add('hide');
    bubble.classList.add('hide');
    floatWrap.classList.remove('hide');
    if (mainNekoNode.parentElement !== floatStage) {
      floatStage.prepend(mainNekoNode);
    }
    if (mainNeko3D) {
      mainNeko3D.setPeeking(false);
      mainNeko3D.setBalloon(true, nekoLife.balloonColorIdx);
      mainNeko3D.setPose('berdiri');
    } else {
      mainNekoNode.innerHTML = buildNekoMascotSvg('main', getActiveNekoMood(), nekoSpeechState === 'speaking', true);
    }
    const b = getFloatingNekoBounds();
    nekoLife.x = Math.max(b.minX, Math.min(b.maxX, nekoLife.x));
    nekoLife.y = Math.max(b.minY, Math.min(b.maxY, nekoLife.y));
    applyFloatingNekoPosition();
    updateFloatingNekoButtonsUI();
  } else if (placement === 'kursi' || placement === 'meja') {
    clearNekoSneakTimers();
    peekSlot.classList.add('hide');
    floatWrap.classList.add('hide');
    hit.classList.remove('hide');
    bubble.classList.remove('hide');

    const isMeja = placement === 'meja';
    seat.classList.toggle('pos-meja', isMeja);
    seat.classList.toggle('pos-kursi', !isMeja);
    hit.classList.toggle('pos-meja', isMeja);

    if (mainNekoNode.parentElement !== seat) {
      seat.prepend(mainNekoNode);
    }
    if (mainNeko3D) {
      mainNeko3D.setPeeking(false);
      mainNeko3D.setBalloon(false);
      mainNeko3D.setPose(isMeja ? nekoLife.deskPose : 'duduk');
      mainNeko3D.state.targetYaw = isMeja ? -0.10 : 0.02;
    } else {
      mainNekoNode.innerHTML = buildNekoMascotSvg('main', getActiveNekoMood(), nekoSpeechState === 'speaking', false);
    }
  } else {
    floatWrap.classList.add('hide');
    hit.classList.add('hide');
    bubble.classList.add('hide');
    peekSlot.classList.remove('hide');
    if (mainNekoNode.parentElement !== peekSlot) {
      peekSlot.prepend(mainNekoNode);
    }
    if (mainNeko3D) {
      mainNeko3D.setBalloon(false);
      mainNeko3D.setPeeking(true);
      mainNeko3D.state.targetYaw = 0;
    } else {
      mainNekoNode.innerHTML = buildNekoMascotSvg('main', getActiveNekoMood(), nekoSpeechState === 'speaking', false);
    }
    if (nekoLife.peekTabId === `nav-${activeTab}` || nekoLife.peekTabId === 'nav-catat') {
      nekoLife.peekTabId = pickRandomPeekTab(`nav-${activeTab}`);
    }
    positionPeekSlot(nekoLife.peekTabId);
  }
  requestNekoRenderFrame();
}

function setNekoLifeMode(newMode, announce = false) {
  if (!['kursi', 'meja', 'balon'].includes(newMode)) return;
  const prev = nekoLife.mode;
  nekoLife.mode = newMode;
  nekoLife.lastLifeSwitchAt = performance.now();

  if (newMode === 'meja') {
    nekoLife.deskPose = Math.random() < 0.42 ? 'rebahan' : 'duduk';
  } else if (newMode === 'balon' && prev !== 'balon') {
    nekoLife.balloonColorIdx = (nekoLife.balloonColorIdx + 1) % NEKO_BALLOON_COLORS.length;
    const b = getFloatingNekoBounds();
    nekoLife.x = Math.round((b.minX + b.maxX) * 0.52);
    nekoLife.y = Math.round(b.minY + 40);
  }

  placeNeko();
  if (mainNeko3D) mainNeko3D.poke();

  if (newMode === 'kursi' && activeTab === 'dashboard') {
    setDeskBubbleShort(getDefaultDeskWejanganSnippet());
  } else if (announce && !nekoLife.userHidden) {
    if (newMode === 'balon') showFloatingNekoBubble('Wiii~ Neko terbang pakai balon!', 2600);
    else if (newMode === 'meja' && activeTab === 'dashboard') {
      setDeskBubbleShort(nekoLife.deskPose === 'rebahan' ? 'Neko rebahan bentar di atas meja ya~' : 'Meong! Neko lompat ke atas meja biar kelihatan jelas!');
    }
  }
}

function updateFloatingNekoButtonsUI() {
  const btnRoam = document.getElementById('btnFloatRoam');
  if (!btnRoam) return;
  btnRoam.className = nekoLife.roaming ? 'float-ctrl-btn is-active' : 'float-ctrl-btn';
  btnRoam.setAttribute('aria-label', nekoLife.roaming ? 'Hentikan gerakan melayang Neko' : 'Jalankan gerakan melayang Neko');
  btnRoam.title = nekoLife.roaming ? 'Melayang keliling: AKTIF (ketuk untuk jeda)' : 'Mode jeda: ketuk agar Neko melayang keliling';
  btnRoam.innerHTML = svgIcon(nekoLife.roaming ? 'i-pause' : 'i-play', 'ico');
}

function toggleFloatingNekoRoam() {
  nekoLife.roaming = !nekoLife.roaming;
  localStorage.setItem('pawketNekoRoam', nekoLife.roaming ? '1' : '0');
  updateFloatingNekoButtonsUI();
  showFloatingNekoBubble(nekoLife.roaming ? 'Neko terbang jalan-jalan lagi~' : 'Neko parkir di udara dulu ya!', 2200);
  requestNekoRenderFrame();
}

function sembunyikanNekoBalon() {
  nekoLife.userHidden = true;
  nekoLife.peekTabId = pickRandomPeekTab(`nav-${activeTab}`);
  nekoLife.lastSneakAt = performance.now();
  placeNeko();
  if (mainNeko3D) mainNeko3D.poke();
}

const DESK_POKES = [
  'Meong! Jangan dicolek terus, Neko lagi ngitung catatan kalian.',
  'Mau catat belanjaan? Ketuk laptop di sebelah kiri Neko ya!',
  'Kopi di meja itu buat lembur ngitung tagihan. Ketuk kopinya kalau mau wejangan!'
];
let deskPokeIdx = 0;

function klikNekoDiMeja() {
  if (mainNeko3D) mainNeko3D.poke();
  setDeskBubbleShort(DESK_POKES[deskPokeIdx++ % DESK_POKES.length]);
  requestNekoRenderFrame();
}

function klikNekoMengintip() {
  if (nekoLife.userHidden && (activeTab === 'dashboard' || nekoLife.mode === 'balon')) {
    nekoLife.userHidden = false;
    if (activeTab === 'dashboard' && nekoLife.mode === 'balon') nekoLife.mode = 'kursi';
    nekoLife.lastLifeSwitchAt = performance.now();
    placeNeko();
    if (mainNeko3D) mainNeko3D.poke();
    return;
  }
  if (mainNeko3D) mainNeko3D.poke();
  showNekoModal(false);
}

function setFloatingNekoLoggedIn(isLoggedIn) {
  nekoLife.loggedIn = Boolean(isLoggedIn);
  if (isLoggedIn) {
    nekoLife.mode = 'kursi';
    nekoLife.userHidden = false;
    nekoLife.lastLifeSwitchAt = performance.now();
    nekoLife.lastSneakAt = performance.now();
    const b = getFloatingNekoBounds();
    nekoLife.x = Math.round((b.minX + b.maxX) * 0.55);
    nekoLife.y = Math.round(b.minY + 40);
  } else {
    clearNekoSneakTimers();
  }
  placeNeko();
}

function shouldRunNekoLoop() {
  if (document.visibilityState !== 'visible') return false;
  const motionOn = document.documentElement.dataset.motion !== 'off';
  const modal = document.getElementById('nekoModal');
  const modalOpen = modal && !modal.classList.contains('hide');
  if (!nekoLife.loggedIn && !modalOpen) return false;
  if (motionOn) return true;
  return nekoSpeechState === 'speaking';
}

function requestNekoRenderFrame() {
  if (!neko3dLoopStarted) return;
  if (shouldRunNekoLoop()) {
    if (!nekoRafId) nekoRafId = requestAnimationFrame(nekoLoopTick);
    return;
  }
  const modal = document.getElementById('nekoModal');
  const modalOpen = modal && !modal.classList.contains('hide');
  if (modalOpen && modalNeko3D) {
    modalNeko3D.render(FROZEN_NEKO_T, true);
  } else if (nekoLife.loggedIn && mainNeko3D && getEffectiveNekoPlacement() !== 'none') {
    mainNeko3D.render(FROZEN_NEKO_T, true);
  }
}

function nekoLoopTick(now) {
  nekoRafId = null;
  if (!shouldRunNekoLoop()) {
    requestNekoRenderFrame();
    return;
  }

  const motionOn = document.documentElement.dataset.motion !== 'off';
  const t = motionOn ? (now - nekoT0) / 1000 : FROZEN_NEKO_T;
  const modalOpen = !document.getElementById('nekoModal').classList.contains('hide');

  if (modalOpen && modalNeko3D) {
    modalNeko3D.render(t, false);
  } else if (nekoLife.loggedIn && mainNeko3D) {
    const placement = getEffectiveNekoPlacement();
    const canAutoCycle = motionOn && !nekoLife.userHidden && !nekoLife.dragging && nekoSpeechState !== 'speaking';
    if (canAutoCycle && (now - nekoLife.lastLifeSwitchAt > 22000)) {
      if (activeTab === 'dashboard') {
        const candidates = ['kursi', 'meja', 'balon'].filter(m => m !== nekoLife.mode);
        const nextMode = candidates[Math.floor(Math.random() * candidates.length)];
        setNekoLifeMode(nextMode, true);
      } else if (nekoLife.mode === 'balon') {
        // Reset timer agar mode balon tidak berpindah saat berada di tab lain.
        nekoLife.lastLifeSwitchAt = now;
      }
    }

    if (placement === 'balon') {
      const typingInForm = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (motionOn && nekoLife.roaming && !nekoLife.dragging && !typingInForm) {
        const nb = getFloatingNekoBounds();
        nekoLife.x += nekoLife.vx;
        nekoLife.y += nekoLife.vy + Math.sin(t * 1.45) * 0.18;
        if (nekoLife.x <= nb.minX) { nekoLife.x = nb.minX; nekoLife.vx = Math.abs(nekoLife.vx); }
        if (nekoLife.x >= nb.maxX) { nekoLife.x = nb.maxX; nekoLife.vx = -Math.abs(nekoLife.vx); }
        if (nekoLife.y <= nb.minY) { nekoLife.y = nb.minY; nekoLife.vy = Math.abs(nekoLife.vy); }
        if (nekoLife.y >= nb.maxY) { nekoLife.y = nb.maxY; nekoLife.vy = -Math.abs(nekoLife.vy); }
        mainNeko3D.state.targetYaw = nekoLife.vx >= 0 ? 0.20 : -0.20;
        applyFloatingNekoPosition();
      } else {
        mainNeko3D.state.targetYaw = -0.10;
      }
    } else if (placement === 'peek') {
      mainNeko3D.state.targetYaw = 0;
      if (motionOn && (now - nekoLife.lastSneakAt > 26000)) {
        sneakNekoToAnotherTab();
      }
    }

    if (placement !== 'none') mainNeko3D.render(t, false);
  }

  nekoRafId = requestAnimationFrame(nekoLoopTick);
}

function initNeko3DSystem() {
  if (neko3dLoopStarted) return;
  neko3dLoopStarted = true;
  nekoT0 = performance.now();

  const savedRoam = localStorage.getItem('pawketNekoRoam');
  nekoLife.roaming = savedRoam === null ? true : savedRoam === '1';

  // Satu konteks WebGL utama dipindah antar wadah agar hemat memori GPU.
  const c = document.createElement('canvas');
  c.id = 'nekoMainCanvas';
  c.setAttribute('aria-hidden', 'true');
  document.getElementById('nekoSeat').prepend(c);
  mainNeko3D = createNekoChi3DEngine(c, null, { camZ: -8.15, initYaw: 0.02 });
  if (mainNeko3D) {
    mainNekoNode = c;
  } else {
    c.remove();
    const fb = document.createElement('div');
    fb.className = 'neko-fallback';
    fb.innerHTML = buildNekoMascotSvg('main', 'santai', false, false);
    document.getElementById('nekoSeat').prepend(fb);
    mainNekoNode = fb;
  }

  modalNeko3D = createNekoChi3DEngine(
    document.getElementById('nekoModalCanvas'),
    null,
    { camZ: -7.95, initYaw: 0.14 }
  );
  if (!modalNeko3D) {
    document.getElementById('nekoModalCanvas').classList.add('hide');
    document.getElementById('nekoModalMascot').classList.remove('hide');
  }

  const fHit = document.getElementById('floatingNekoHit');
  if (fHit) {
    fHit.addEventListener('pointerdown', (e) => {
      nekoLife.dragging = true;
      nekoLife.moved = 0;
      nekoLife.dragOffsetX = e.clientX - nekoLife.x;
      nekoLife.dragOffsetY = e.clientY - nekoLife.y;
      try { fHit.setPointerCapture(e.pointerId); } catch (_) {}
    });
    fHit.addEventListener('pointermove', (e) => {
      if (!nekoLife.dragging) return;
      const b = getFloatingNekoBounds();
      const nx = e.clientX - nekoLife.dragOffsetX;
      const ny = e.clientY - nekoLife.dragOffsetY;
      nekoLife.moved += Math.abs(nx - nekoLife.x) + Math.abs(ny - nekoLife.y);
      nekoLife.x = Math.max(b.minX, Math.min(b.maxX, nx));
      nekoLife.y = Math.max(b.minY, Math.min(b.maxY, ny));
      applyFloatingNekoPosition();
    });
    fHit.addEventListener('pointerup', () => {
      if (!nekoLife.dragging) return;
      nekoLife.dragging = false;
      if (nekoLife.moved < 9) {
        if (mainNeko3D) mainNeko3D.poke();
        showNekoModal(false);
      } else {
        nekoLife.roaming = false;
        updateFloatingNekoButtonsUI();
      }
    });
    fHit.addEventListener('keydown', (e) => {
      const b = getFloatingNekoBounds();
      const step = 24;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nekoLife.roaming = false; nekoLife.x = Math.max(b.minX, nekoLife.x - step); applyFloatingNekoPosition(); updateFloatingNekoButtonsUI(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nekoLife.roaming = false; nekoLife.x = Math.min(b.maxX, nekoLife.x + step); applyFloatingNekoPosition(); updateFloatingNekoButtonsUI(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); nekoLife.roaming = false; nekoLife.y = Math.max(b.minY, nekoLife.y - step); applyFloatingNekoPosition(); updateFloatingNekoButtonsUI(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); nekoLife.roaming = false; nekoLife.y = Math.min(b.maxY, nekoLife.y + step); applyFloatingNekoPosition(); updateFloatingNekoButtonsUI(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showNekoModal(false); }
    });
  }

  const mStage = document.getElementById('nekoModal3dStage');
  if (mStage) {
    let mDrag = { active: false, moved: 0, lx: 0, ly: 0 };
    mStage.addEventListener('pointerdown', (e) => {
      mDrag = { active: true, moved: 0, lx: e.clientX, ly: e.clientY };
      try { mStage.setPointerCapture(e.pointerId); } catch (_) {}
    });
    mStage.addEventListener('pointermove', (e) => {
      if (!modalNeko3D || !mDrag.active) return;
      const dx = e.clientX - mDrag.lx, dy = e.clientY - mDrag.ly;
      mDrag.moved += Math.abs(dx) + Math.abs(dy);
      modalNeko3D.state.targetYaw += dx * 0.016;
      modalNeko3D.state.targetPitch = Math.max(-0.55, Math.min(0.55, modalNeko3D.state.targetPitch + dy * 0.013));
      mDrag.lx = e.clientX; mDrag.ly = e.clientY;
      requestNekoRenderFrame();
    });
    mStage.addEventListener('pointerup', () => {
      if (!mDrag.active) return;
      mDrag.active = false;
      if (mDrag.moved < 9) {
        if (modalNeko3D) modalNeko3D.poke();
        toggleBicaraNeko();
      }
    });
    mStage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBicaraNeko(); }
      else if (e.key === 'ArrowLeft' && modalNeko3D) { e.preventDefault(); modalNeko3D.state.targetYaw -= 0.35; requestNekoRenderFrame(); }
      else if (e.key === 'ArrowRight' && modalNeko3D) { e.preventDefault(); modalNeko3D.state.targetYaw += 0.35; requestNekoRenderFrame(); }
    });
  }

  window.addEventListener('resize', () => {
    if (!nekoLife.loggedIn) return;
    const p = getEffectiveNekoPlacement();
    if (p === 'peek') positionPeekSlot(nekoLife.peekTabId);
    else if (p === 'balon') {
      const b = getFloatingNekoBounds();
      nekoLife.x = Math.max(b.minX, Math.min(b.maxX, nekoLife.x));
      nekoLife.y = Math.max(b.minY, Math.min(b.maxY, nekoLife.y));
      applyFloatingNekoPosition();
    }
    requestNekoRenderFrame();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => requestNekoRenderFrame());
  requestNekoRenderFrame();
}

function getActiveNekoMood() {
  if (wejanganState.isLoading) return 'berpikir';
  const m = wejanganState.mode === "me" ? wejanganState.moodKu : wejanganState.moodPasangan;
  return NEKO_MOOD_META[m] ? m : 'santai';
}

function ensureNekoModalMascot(moodOverride = null) {
  const mood = moodOverride || getActiveNekoMood();
  const isTalking = nekoSpeechState === 'speaking';
  if (modalNeko3D) {
    modalNeko3D.setMood(mood);
    modalNeko3D.setPose(mood === 'sarkas' ? 'rebahan' : 'duduk');
    modalNeko3D.setTalking(isTalking);
  }
  const holder = document.getElementById('nekoModalMascot');
  if (!holder) return;
  const existingSvg = holder.querySelector('.neko-svg');
  if (!existingSvg) holder.innerHTML = buildNekoMascotSvg('modal', mood, isTalking, false);
  else {
    existingSvg.setAttribute('data-mood', mood);
    existingSvg.setAttribute('data-talking', isTalking ? 'true' : 'false');
  }
}

function syncAllNekoMascots(moodOverride = null, mouthOpen = null) {
  const mood = moodOverride || getActiveNekoMood();
  const isTalking = nekoSpeechState === 'speaking';
  ensureNekoModalMascot(mood);
  if (modalNeko3D) {
    modalNeko3D.setMood(mood);
    modalNeko3D.setTalking(isTalking, mouthOpen);
  }
  if (mainNeko3D) {
    mainNeko3D.setMood(mood);
    mainNeko3D.setTalking(isTalking, mouthOpen);
  }
  document.querySelectorAll('.neko-svg').forEach(svg => {
    svg.setAttribute('data-mood', mood);
    svg.setAttribute('data-talking', isTalking ? 'true' : 'false');
    if (mouthOpen !== null) svg.style.setProperty('--mouth-open', Math.max(0.08, mouthOpen).toFixed(2));
    else if (!isTalking) svg.style.removeProperty('--mouth-open');
  });
  requestNekoRenderFrame();
}

function updateNekoVoiceButtonsUI() {
  document.querySelectorAll('.btn-neko-speak').forEach(btn => {
    if (nekoSpeechState === 'loading') {
      btn.disabled = true;
      btn.innerHTML = `${spinnerIcon()}<span>Menyiapkan suara Neko...</span>`;
    } else if (nekoSpeechState === 'speaking') {
      btn.disabled = false;
      btn.innerHTML = '<span class="neko-wave" aria-hidden="true"><span></span><span></span><span></span></span><span>Hentikan Suara</span>';
    } else {
      btn.disabled = false;
      btn.innerHTML = `${svgIcon('i-volume')}<span>Dengarkan Neko</span>`;
    }
  });
  const deskBtn = document.getElementById('btnDeskSpeak');
  if (deskBtn) {
    if (nekoSpeechState === 'loading') {
      deskBtn.disabled = true;
      deskBtn.innerHTML = `${spinnerIcon('ico ico-sm spin')}<span>Siap...</span>`;
    } else if (nekoSpeechState === 'speaking') {
      deskBtn.disabled = false;
      deskBtn.innerHTML = '<span class="neko-wave" aria-hidden="true"><span></span><span></span><span></span></span><span>Stop</span>';
    } else {
      deskBtn.disabled = false;
      deskBtn.innerHTML = `${svgIcon('i-volume', 'ico ico-sm')}<span>Suara</span>`;
    }
  }
}

function stopNekoSpeech() {
  nekoSpeechRequestId++;
  if (nekoLipSyncRaf) { cancelAnimationFrame(nekoLipSyncRaf); nekoLipSyncRaf = null; }
  if (nekoActiveSource) {
    try { nekoActiveSource.onended = null; nekoActiveSource.stop(); nekoActiveSource.disconnect(); } catch (_) {}
    nekoActiveSource = null;
  }
  if (nekoActiveFallbackAudio) {
    try { nekoActiveFallbackAudio.pause(); nekoActiveFallbackAudio.src = ''; } catch (_) {}
    nekoActiveFallbackAudio = null;
  }
  if (typeof window.speechSynthesis !== 'undefined') {
    try { window.speechSynthesis.cancel(); } catch (_) {}
  }
  nekoSpeechState = 'idle';
  syncAllNekoMascots();
  updateNekoVoiceButtonsUI();
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function startAudioAnalyserLipSync(analyser) {
  const dataArr = new Uint8Array(analyser.fftSize);
  let smoothed = 0;
  const tick = () => {
    if (nekoSpeechState !== 'speaking') return;
    analyser.getByteTimeDomainData(dataArr);
    let sumSq = 0;
    for (let i = 0; i < dataArr.length; i++) {
      const norm = (dataArr[i] - 128) / 128;
      sumSq += norm * norm;
    }
    const rms = Math.sqrt(sumSq / dataArr.length);
    const target = rms < 0.022 ? 0 : Math.min(1.0, (rms - 0.022) * 7.8);
    smoothed = smoothed * 0.42 + target * 0.58;
    if (smoothed < 0.04) smoothed = 0;
    syncAllNekoMascots(null, smoothed);
    nekoLipSyncRaf = requestAnimationFrame(tick);
  };
  nekoLipSyncRaf = requestAnimationFrame(tick);
}

function startRhythmicLipSync() {
  const startTime = performance.now();
  const tick = (now) => {
    if (nekoSpeechState !== 'speaking') return;
    const t = (now - startTime) / 1000;
    const syllable = Math.sin(t * 15.5);
    const phrase = 0.5 + 0.5 * Math.sin(t * 2.6);
    const pulse = syllable > -0.10 ? Math.pow((syllable + 0.10) / 1.10, 1.35) : 0;
    const wave = phrase < 0.14 ? 0 : Math.min(1, pulse * (0.68 + 0.32 * Math.sin(t * 6.4)));
    syncAllNekoMascots(null, wave);
    nekoLipSyncRaf = requestAnimationFrame(tick);
  };
  nekoLipSyncRaf = requestAnimationFrame(tick);
}

function playNekoBrowserSpeechFallback(rawText, voiceId, reqId) {
  if (typeof window.speechSynthesis === 'undefined') {
    stopNekoSpeech();
    return showToast('Browser tidak mendukung suara cadangan.', 'error');
  }
  const cleanText = String(rawText || '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim();
  if (!cleanText || reqId !== nekoSpeechRequestId) return;
  const voiceMeta = NEKO_VOICES[0];
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = 'id-ID';
  utter.pitch = voiceMeta.pitch;
  utter.rate = voiceMeta.rate;
  const availableVoices = window.speechSynthesis.getVoices() || [];
  const idVoice = availableVoices.find(v => /id[-_]?ID/i.test(v.lang));
  if (idVoice) utter.voice = idVoice;
  utter.onstart = () => {
    if (reqId !== nekoSpeechRequestId) return;
    nekoSpeechState = 'speaking';
    syncAllNekoMascots();
    updateNekoVoiceButtonsUI();
    startRhythmicLipSync();
  };
  utter.onend = () => { if (reqId === nekoSpeechRequestId) stopNekoSpeech(); };
  utter.onerror = () => { if (reqId === nekoSpeechRequestId) stopNekoSpeech(); };
  try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(utter); } catch (_) { stopNekoSpeech(); }
}

async function playNekoWavBase64(audioBase64, mimeType, reqId) {
  if (reqId !== nekoSpeechRequestId) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    try {
      if (!nekoAudioCtx) nekoAudioCtx = new AudioCtx();
      if (nekoAudioCtx.state === 'suspended') await nekoAudioCtx.resume();
      const arrayBuf = base64ToArrayBuffer(audioBase64);
      const audioBuffer = await nekoAudioCtx.decodeAudioData(arrayBuf.slice(0));
      if (reqId !== nekoSpeechRequestId) return;
      const source = nekoAudioCtx.createBufferSource();
      const analyser = nekoAudioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.buffer = audioBuffer;
      source.playbackRate.value = getActiveNekoPitchRate();
      source.connect(analyser);
      analyser.connect(nekoAudioCtx.destination);
      nekoActiveSource = source;
      nekoSpeechState = 'speaking';
      syncAllNekoMascots();
      updateNekoVoiceButtonsUI();
      startAudioAnalyserLipSync(analyser);
      source.onended = () => { if (reqId === nekoSpeechRequestId) stopNekoSpeech(); };
      source.start(0);
      return;
    } catch (_) {}
  }
  try {
    const blob = new Blob([base64ToArrayBuffer(audioBase64)], { type: mimeType || 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.preservesPitch = false;
    audio.mozPreservesPitch = false;
    audio.webkitPreservesPitch = false;
    audio.playbackRate = getActiveNekoPitchRate();
    nekoActiveFallbackAudio = audio;
    audio.onplay = () => {
      if (reqId !== nekoSpeechRequestId) return;
      nekoSpeechState = 'speaking';
      syncAllNekoMascots();
      updateNekoVoiceButtonsUI();
      startRhythmicLipSync();
    };
    audio.onended = () => { URL.revokeObjectURL(url); if (reqId === nekoSpeechRequestId) stopNekoSpeech(); };
    audio.onerror = () => { URL.revokeObjectURL(url); if (reqId === nekoSpeechRequestId) stopNekoSpeech(); };
    await audio.play();
  } catch (_) {
    if (reqId === nekoSpeechRequestId) stopNekoSpeech();
  }
}

async function toggleBicaraNeko() {
  if (nekoSpeechState === 'speaking' || nekoSpeechState === 'loading') {
    stopNekoSpeech();
    return;
  }
  const isMe = wejanganState.mode === "me";
  const teks = isMe ? wejanganState.komentarKu : wejanganState.komentarPasangan;
  const mood = getActiveNekoMood();
  if (!teks || !teks.trim()) {
    showNekoModal(false);
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    try {
      if (!nekoAudioCtx) nekoAudioCtx = new AudioCtx();
      if (nekoAudioCtx.state === 'suspended') nekoAudioCtx.resume().catch(() => {});
    } catch (_) {}
  }
  const reqId = ++nekoSpeechRequestId;
  const cacheKey = `${selectedNekoVoice}|${mood}|${teks}`;
  if (nekoAudioCache.has(cacheKey)) {
    const cached = nekoAudioCache.get(cacheKey);
    await playNekoWavBase64(cached.audioBase64, cached.mimeType, reqId);
    return;
  }
  nekoSpeechState = 'loading';
  updateNekoVoiceButtonsUI();
  const res = await callAPI('ttsNeko', { teks, voice: selectedNekoVoice, mood });
  if (reqId !== nekoSpeechRequestId) return;
  if (res?.sukses && res.audioBase64) {
    if (nekoAudioCache.size >= 8) nekoAudioCache.delete(nekoAudioCache.keys().next().value);
    nekoAudioCache.set(cacheKey, { audioBase64: res.audioBase64, mimeType: res.mimeType || 'audio/wav' });
    await playNekoWavBase64(res.audioBase64, res.mimeType || 'audio/wav', reqId);
  } else if (!res?.authError) {
    showToast('Suara AI sedang padat, memakai suara cadangan browser.', 'info');
    playNekoBrowserSpeechFallback(teks, selectedNekoVoice, reqId);
  } else {
    stopNekoSpeech();
  }
}

function bukaPopupNekoSekarang() {
  ensureNekoModalMascot();
  openModalDialog('nekoModal', closeNekoModal);
  placeNeko();
}

function showNekoModal(forceRefresh = false) {
  if (!isNekoCalled || forceRefresh) {
    mintaWejanganAuto(forceRefresh, true);
  } else {
    bukaPopupNekoSekarang();
  }
}

function closeNekoModal() {
  stopNekoSpeech();
  closeModalDialog('nekoModal');
  placeNeko();
}

function toggleWejanganPasangan() {
  stopNekoSpeech();
  wejanganState.mode = wejanganState.mode === "me" ? "partner" : "me";
  renderWejanganNekoUI();
}

function renderWejanganNekoUI() {
  const textContainer = document.getElementById('nekoModalText');
  const isMe = wejanganState.mode === "me";
  const partnerShortName = (wejanganState.namaPasangan || partnerFullName || "Pasangan").split(" ")[0];
  const activeMood = getActiveNekoMood();
  const rawText = isMe ? wejanganState.komentarKu : wejanganState.komentarPasangan;
  const formattedText = escapeHtml(rawText || "").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const btnLabel = isMe
    ? `Lihat Analisa Keuangan ${escapeHtml(partnerShortName)}`
    : `Kembali ke Analisa Keuanganku`;

  const debugBoxHtml = (!wejanganState.isAI && wejanganState.debugPesan)
    ? `<details style="width:100%;text-align:left;background:var(--warn-bg);border:1px solid var(--warn);border-radius:10px;padding:8px">
         <summary class="small" style="font-weight:800">Info Status Layanan AI</summary>
         <p class="small" style="margin-top:4px;word-break:break-word;font-family:monospace">${escapeHtml(wejanganState.debugPesan)}</p>
       </details>`
    : "";

  ensureNekoModalMascot(activeMood);
  if (nekoLife.mode === 'kursi') setDeskBubbleShort(getDefaultDeskWejanganSnippet());

  textContainer.innerHTML = `
    <p class="hand-text" style="width:100%">"${formattedText}"</p>
    <button type="button" onclick="toggleBicaraNeko()" class="btn btn-primary btn-block btn-neko-speak">
      ${svgIcon('i-volume')}<span>Dengarkan Neko</span>
    </button>
    ${debugBoxHtml}
    <button type="button" onclick="toggleWejanganPasangan()" class="btn btn-block">
      <span>${btnLabel}</span>
    </button>
  `;

  updateNekoVoiceButtonsUI();
  syncAllNekoMascots(activeMood);
}

async function mintaWejanganAuto(forceRefresh = false, openModalAfter = false) {
  if (!activeToken) return;
  stopNekoSpeech();
  isNekoCalled = true;
  wejanganState.mode = "me";

  const savedSig = localStorage.getItem(`pawketNekoSig_${activeUser}`);
  const savedData = localStorage.getItem(`pawketNekoData_${activeUser}`);
  if (!forceRefresh && currentFinanceSignature && savedSig === currentFinanceSignature && savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.moodKu && parsed.moodPasangan) {
        wejanganState = parsed;
        wejanganState.mode = "me";
        wejanganState.isLoading = false;
        renderWejanganNekoUI();
        if (openModalAfter) bukaPopupNekoSekarang();
        return;
      }
    } catch (_) {}
  }

  wejanganState.isLoading = true;
  ensureNekoModalMascot('berpikir');
  setDeskBubbleShort('Neko lagi baca catatan keuangan kalian...');
  document.getElementById('nekoModalText').innerHTML = `
    ${spinnerIcon('ico ico-lg spin')}
    <p class="small muted">Neko sedang mengintip dompet kalian...</p>
  `;
  if (openModalAfter) bukaPopupNekoSekarang();

  const res = await callAPI('analisisKeuanganAI', { forceRefresh });
  if (!activeToken) return;
  wejanganState.isLoading = false;

  if (res?.sukses) {
    wejanganState.isAI = res.isAI !== false;
    wejanganState.debugPesan = res.debugPesan || "";
    wejanganState.komentarKu = res.komentarKu || res.hasil || "";
    wejanganState.komentarPasangan = res.komentarPasangan || res.hasil || "";
    wejanganState.moodKu = res.moodKu || "santai";
    wejanganState.moodPasangan = res.moodPasangan || "santai";
    wejanganState.namaPasangan = res.namaPasangan || partnerFullName || "Pasangan";

    if (currentFinanceSignature && wejanganState.isAI) {
      localStorage.setItem(`pawketNekoSig_${activeUser}`, currentFinanceSignature);
      localStorage.setItem(`pawketNekoData_${activeUser}`, JSON.stringify(wejanganState));
    }
  } else {
    const sUtama = document.getElementById('saldoUtama').innerText || 'Rp 0';
    wejanganState.isAI = false;
    wejanganState.debugPesan = res?.pesan || "Gagal memanggil analisisKeuanganAI.";
    wejanganState.komentarKu = `Meong! Saldo siap pakai kalian saat ini ${sUtama}. Yuk tetap rajin catat pengeluaran dan bayar tagihan tepat waktu ya!`;
    wejanganState.komentarPasangan = `Pastikan pasanganmu juga rajin mencatat pemasukan dan pengeluarannya di PAWket ya!`;
    wejanganState.moodKu = "marah_gemas";
    wejanganState.moodPasangan = "sarkas";
    wejanganState.namaPasangan = partnerFullName || "Pasangan";
  }

  renderWejanganNekoUI();
}
