function buildNekoMascotSvg(uid = 'inline', mood = 'santai', isTalking = false, withBalloon = false) {
  const m = NEKO_MOOD_META[mood] ? mood : 'santai';
  const talkingAttr = isTalking ? 'true' : 'false';
  const earInnerId = `nekoEar_${uid}`;
  const balloonSvg = withBalloon
    ? `<g class="neko-balloon-svg"><path d="M126 112 Q142 74 146 38" stroke="#474444" stroke-width="2" fill="none"/><ellipse cx="146" cy="20" rx="18" ry="22" fill="#f25c66" stroke="#474444" stroke-width="2.2"/><ellipse cx="140" cy="12" rx="4" ry="7" fill="#ffffff" opacity="0.75"/></g>`
    : '';

  return `
    <svg viewBox="0 0 180 164" class="neko-svg" style="width:100%;height:100%" data-mood="${m}" data-talking="${talkingAttr}" role="img" aria-label="Maskot kucing anime Neko (${NEKO_MOOD_META[m].label})">
      <defs>
        <linearGradient id="${earInnerId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f3a3ab"/>
          <stop offset="100%" stop-color="#fde3e6"/>
        </linearGradient>
      </defs>
      ${balloonSvg}
      <g class="neko-tail">
        <path d="M122 132 C148 130 164 114 159 94 C155 82 143 85 141 96 C140 106 134 115 119 119 Z" fill="#8e9195" stroke="#474444" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M135 118 Q144 121 150 114" stroke="#313336" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <path d="M144 104 Q152 106 157 99" stroke="#313336" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      </g>
      <g class="neko-body">
        <ellipse cx="90" cy="129" rx="40" ry="24" fill="#ffffff" stroke="#474444" stroke-width="2.4"/>
        <path d="M51 124 C54 111 66 106 75 112 C67 119 64 132 65 142 C56 138 50 132 51 124 Z" fill="#8e9195"/>
        <path d="M129 124 C126 111 114 106 105 112 C113 119 116 132 115 142 C124 138 130 132 129 124 Z" fill="#8e9195"/>
        <g class="neko-paws">
          <ellipse cx="64" cy="142" rx="13" ry="9" fill="#ffffff" stroke="#474444" stroke-width="2.2"/>
          <circle cx="64" cy="143" r="3.2" fill="#2d2a2a"/>
          <ellipse cx="116" cy="142" rx="13" ry="9" fill="#ffffff" stroke="#474444" stroke-width="2.2"/>
          <circle cx="116" cy="143" r="3.2" fill="#2d2a2a"/>
        </g>
      </g>
      <g class="neko-head">
        <g class="neko-ear-l">
          <path d="M40 72 L30 22 L76 47 Z" fill="#8e9195" stroke="#474444" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M43 64 L36 31 L67 49 Z" fill="url(#${earInnerId})" stroke="#5a5656" stroke-width="1.4" stroke-linejoin="round"/>
        </g>
        <g class="neko-ear-r">
          <path d="M140 72 L150 22 L104 47 Z" fill="#8e9195" stroke="#474444" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M137 64 L144 31 L113 49 Z" fill="url(#${earInnerId})" stroke="#5a5656" stroke-width="1.4" stroke-linejoin="round"/>
        </g>
        <ellipse cx="90" cy="82" rx="58" ry="44" fill="#8e9195" stroke="#474444" stroke-width="2.4"/>
        <path d="M90 42 C78 62 66 78 44 86 C34 90 36 112 58 121 C72 126 108 126 122 121 C144 112 146 90 136 86 C114 78 102 62 90 42 Z" fill="#ffffff"/>
        <circle cx="68" cy="82" r="14" fill="#ffffff" stroke="#474444" stroke-width="2.2"/>
        <circle cx="69" cy="83" r="9.5" fill="#111111"/>
        <circle cx="112" cy="82" r="14" fill="#ffffff" stroke="#474444" stroke-width="2.2"/>
        <circle cx="111" cy="83" r="9.5" fill="#111111"/>
        <polygon points="87,94 93,94 90,98" fill="#363232"/>
        <path class="neko-mouth-idle" d="M81 101 Q85.5 107 90 101 Q94.5 107 99 101" stroke="#474444" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <ellipse class="neko-mouth-talk" cx="90" cy="105" rx="8" ry="10" fill="#f4a9ae" stroke="#474444" stroke-width="2"/>
      </g>
    </svg>
  `;
}

let nekoSharedFurBase = null;
let nekoSharedBodyCanvas = null;
let nekoSharedEarCanvas = null;

function getNekoSharedTextures() {
  if (!nekoSharedFurBase) {
    nekoSharedFurBase = document.createElement('canvas');
    nekoSharedFurBase.width = 1024;
    nekoSharedFurBase.height = 512;
    const ctx = nekoSharedFurBase.getContext('2d');
    ctx.fillStyle = '#8e9195';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#333538';
    for (let row = 0; row < 5; row++) {
      const y = 78 + row * 68;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.quadraticCurveTo(130, y - 16, 260, y + 6);
      ctx.lineTo(260, y + 26); ctx.quadraticCurveTo(130, y + 6, 0, y + 22);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1024, y); ctx.quadraticCurveTo(894, y - 16, 764, y + 6);
      ctx.lineTo(764, y + 26); ctx.quadraticCurveTo(894, y + 6, 1024, y + 22);
      ctx.closePath(); ctx.fill();
    }
    [[-1, 512], [1, 512]].forEach(([dir, cx]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 24, 102); ctx.quadraticCurveTo(cx + dir * 64, 152, cx + dir * 92, 206);
      ctx.lineTo(cx + dir * 116, 198); ctx.quadraticCurveTo(cx + dir * 82, 138, cx + dir * 42, 92);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + dir * 98, 134); ctx.quadraticCurveTo(cx + dir * 138, 174, cx + dir * 162, 224);
      ctx.lineTo(cx + dir * 178, 214); ctx.quadraticCurveTo(cx + dir * 150, 158, cx + dir * 112, 124);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + dir * 124, 294); ctx.lineTo(cx + dir * 178, 282); ctx.lineTo(cx + dir * 184, 296);
      ctx.lineTo(cx + dir * 144, 306); ctx.lineTo(cx + dir * 178, 322); ctx.lineTo(cx + dir * 170, 336);
      ctx.lineTo(cx + dir * 118, 312); ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(512, 146);
    ctx.bezierCurveTo(476, 196, 444, 250, 412, 296);
    ctx.bezierCurveTo(372, 314, 336, 330, 332, 378);
    ctx.bezierCurveTo(328, 462, 412, 512, 512, 512);
    ctx.bezierCurveTo(612, 512, 696, 462, 692, 378);
    ctx.bezierCurveTo(688, 330, 652, 314, 612, 296);
    ctx.bezierCurveTo(580, 250, 548, 196, 512, 146);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6d7074';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(412, 296); ctx.quadraticCurveTo(372, 314, 344, 344);
    ctx.moveTo(612, 296); ctx.quadraticCurveTo(652, 314, 680, 344);
    ctx.stroke();
  }

  if (!nekoSharedBodyCanvas) {
    nekoSharedBodyCanvas = document.createElement('canvas');
    nekoSharedBodyCanvas.width = 512;
    nekoSharedBodyCanvas.height = 256;
    const ctx = nekoSharedBodyCanvas.getContext('2d');
    ctx.fillStyle = '#8e9195';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#313336';
    for (let i = 0; i < 6; i++) {
      const y = 34 + i * 38;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.bezierCurveTo(140, y - 14, 372, y + 14, 512, y);
      ctx.lineTo(512, y + 18); ctx.bezierCurveTo(372, y + 30, 140, y + 4, 0, y + 18);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.bezierCurveTo(346, 0, 368, 70, 362, 160);
    ctx.bezierCurveTo(356, 224, 320, 256, 256, 256);
    ctx.bezierCurveTo(192, 256, 156, 224, 150, 160);
    ctx.bezierCurveTo(144, 70, 166, 0, 256, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5c5e62';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(156, 24); ctx.quadraticCurveTo(146, 130, 162, 222);
    ctx.moveTo(356, 24); ctx.quadraticCurveTo(366, 130, 350, 222);
    ctx.stroke();
  }

  if (!nekoSharedEarCanvas) {
    nekoSharedEarCanvas = document.createElement('canvas');
    nekoSharedEarCanvas.width = 256;
    nekoSharedEarCanvas.height = 256;
    const ctx = nekoSharedEarCanvas.getContext('2d');
    ctx.fillStyle = '#8e9195';
    ctx.fillRect(0, 0, 256, 256);
    const g = ctx.createLinearGradient(0, 28, 0, 240);
    g.addColorStop(0, '#f3a3ab');
    g.addColorStop(0.6, '#f9c4c9');
    g.addColorStop(1, '#fde3e6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(128, 22); ctx.lineTo(176, 232);
    ctx.quadraticCurveTo(128, 246, 80, 232);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a5656';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130, 82, 86, 0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = 74 + i * 25;
      const spread = 14 + i * 5.2;
      ctx.beginPath();
      ctx.moveTo(128 - spread, y); ctx.lineTo(128 - spread * 0.28, y + 3);
      ctx.moveTo(128 + spread, y); ctx.lineTo(128 + spread * 0.28, y + 3);
      ctx.stroke();
    }
  }
  return { furBase: nekoSharedFurBase, bodyCanvas: nekoSharedBodyCanvas, earCanvas: nekoSharedEarCanvas };
}

function paintChiFaceToCanvas(fctx, mood, blink, talkAmt, talking, timeSec) {
  const { furBase } = getNekoSharedTextures();
  fctx.drawImage(furBase, 0, 0);

  const eyeL = { x: 446, y: 264 };
  const eyeR = { x: 578, y: 264 };
  const rx = 43, ry = 53;

  [[-1, eyeL], [1, eyeR]].forEach(([side, pos]) => {
    fctx.save();
    fctx.translate(pos.x, pos.y);

    if (mood === 'marah_gemas') {
      fctx.strokeStyle = '#2d2a2a';
      fctx.lineWidth = 10; fctx.lineCap = 'round'; fctx.lineJoin = 'round';
      fctx.beginPath();
      if (side < 0) { fctx.moveTo(-26, -18); fctx.lineTo(22, 4); fctx.lineTo(-24, 24); }
      else { fctx.moveTo(26, -18); fctx.lineTo(-22, 4); fctx.lineTo(24, 24); }
      fctx.stroke();

      fctx.fillStyle = '#ffffff'; fctx.strokeStyle = '#474343'; fctx.lineWidth = 3.5;
      fctx.beginPath();
      if (side < 0) { fctx.moveTo(-36, -38); fctx.lineTo(38, -2); fctx.lineTo(30, 8); fctx.lineTo(-42, -22); }
      else { fctx.moveTo(36, -38); fctx.lineTo(-38, -2); fctx.lineTo(-30, 8); fctx.lineTo(42, -22); }
      fctx.closePath(); fctx.fill(); fctx.stroke();
    } else if (mood === 'bangga') {
      fctx.strokeStyle = '#2d2a2a';
      fctx.lineWidth = 10; fctx.lineCap = 'round'; fctx.lineJoin = 'round';
      fctx.beginPath();
      if (side < 0) { fctx.moveTo(-28, -16); fctx.quadraticCurveTo(16, 2, 22, 6); fctx.quadraticCurveTo(-4, 16, -26, 24); }
      else { fctx.moveTo(28, -16); fctx.quadraticCurveTo(-16, 2, -22, 6); fctx.quadraticCurveTo(4, 16, 26, 24); }
      fctx.stroke();
    } else if (mood === 'panik') {
      const jx = Math.sin(timeSec * 38) * 2.5;
      const jy = Math.cos(timeSec * 44) * 2.5;
      fctx.fillStyle = '#ffffff'; fctx.strokeStyle = '#333131'; fctx.lineWidth = 5.5;
      fctx.beginPath(); fctx.ellipse(0, 0, rx + 5, ry + 5, side * 0.08, 0, Math.PI * 2); fctx.fill(); fctx.stroke();
      fctx.fillStyle = '#111111';
      fctx.beginPath(); fctx.arc(jx, jy, 4.5, 0, Math.PI * 2); fctx.fill();
    } else if (mood === 'sarkas') {
      fctx.fillStyle = '#ffffff'; fctx.strokeStyle = '#3c3939'; fctx.lineWidth = 5.5;
      fctx.beginPath(); fctx.ellipse(0, 2, rx, ry * 0.92, 0, 0, Math.PI * 2); fctx.fill();
      fctx.save();
      fctx.beginPath(); fctx.ellipse(0, 2, rx, ry * 0.92, 0, 0, Math.PI * 2); fctx.clip();
      fctx.fillStyle = '#0d0d0f';
      fctx.beginPath(); fctx.ellipse(0, 6, rx * 0.72, ry * 0.66, 0, 0, Math.PI * 2); fctx.fill();
      fctx.fillStyle = '#8e9195';
      fctx.fillRect(-rx - 6, -ry - 6, rx * 2 + 12, ry * 0.94);
      fctx.strokeStyle = '#2d2a2a'; fctx.lineWidth = 7;
      fctx.beginPath(); fctx.moveTo(-rx - 4, -2); fctx.lineTo(rx + 4, 4 * side * -1 + 2); fctx.stroke();
      fctx.restore();
      fctx.strokeStyle = '#3c3939'; fctx.lineWidth = 5.5;
      fctx.beginPath(); fctx.ellipse(0, 2, rx, ry * 0.92, 0, 0, Math.PI * 2); fctx.stroke();
    } else if (mood === 'berpikir') {
      fctx.fillStyle = '#ffffff'; fctx.strokeStyle = '#474545'; fctx.lineWidth = 5.5;
      fctx.beginPath(); fctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); fctx.fill(); fctx.stroke();
      fctx.fillStyle = '#0b0b0d';
      fctx.beginPath(); fctx.ellipse(10, -10, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2); fctx.fill();
      fctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
      fctx.beginPath(); fctx.ellipse(2, -22, 6, 8, -0.25, 0, Math.PI * 2); fctx.fill();
    } else if (blink) {
      fctx.strokeStyle = '#2d2a2a'; fctx.lineWidth = 7.5; fctx.lineCap = 'round';
      fctx.beginPath(); fctx.moveTo(-rx + 4, 4); fctx.quadraticCurveTo(0, -10, rx - 4, 4); fctx.stroke();
    } else {
      fctx.fillStyle = '#ffffff'; fctx.strokeStyle = '#474545'; fctx.lineWidth = 5.5;
      fctx.beginPath(); fctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); fctx.fill(); fctx.stroke();
      fctx.fillStyle = '#0b0b0d';
      fctx.beginPath(); fctx.ellipse(side * -3, 2, rx * 0.67, ry * 0.68, 0, 0, Math.PI * 2); fctx.fill();
      fctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      fctx.beginPath(); fctx.ellipse(side * -3 - 9, -12, 6, 8, -0.25, 0, Math.PI * 2); fctx.fill();
    }
    fctx.restore();
  });

  fctx.fillStyle = '#363232';
  fctx.beginPath();
  fctx.moveTo(503, 304); fctx.lineTo(521, 304); fctx.lineTo(512, 313);
  fctx.closePath(); fctx.fill();

  const mx = 512, my = 326;
  const shouldOpen = talking
    ? (talkAmt >= 0.14)
    : (mood === 'marah_gemas' || mood === 'panik' || mood === 'bangga');

  if (shouldOpen) {
    const openness = talking
      ? Math.max(0.05, Math.min(1, (talkAmt - 0.14) / 0.86))
      : (mood === 'bangga' ? 0.90 : (mood === 'marah_gemas' ? 0.94 : 0.98));
    const mw = 16 + openness * 29;
    const mh = 12 + openness * 66;

    fctx.fillStyle = '#b9787b';
    fctx.beginPath();
    fctx.moveTo(mx - mw, my + 4);
    fctx.quadraticCurveTo(mx - mw * 0.35, my - 4 * openness, mx, my - 8 * openness);
    fctx.quadraticCurveTo(mx + mw * 0.35, my - 4 * openness, mx + mw, my + 4);
    fctx.quadraticCurveTo(mx + mw * 0.72, my + mh * 0.78, mx, my + mh);
    fctx.quadraticCurveTo(mx - mw * 0.72, my + mh * 0.78, mx - mw, my + 4);
    fctx.closePath(); fctx.fill();

    fctx.save();
    fctx.clip();
    fctx.fillStyle = '#f8b9bc';
    fctx.beginPath();
    fctx.ellipse(mx, my + mh * 0.72, mw * 0.85, mh * 0.56, 0, 0, Math.PI * 2);
    fctx.fill();
    fctx.restore();

    if (openness > 0.32) {
      fctx.fillStyle = '#ffffff'; fctx.strokeStyle = '#534949'; fctx.lineWidth = 2.4;
      const fangH = 6 + openness * 6;
      [[-1, 0.44], [1, 0.44]].forEach(([dir, frac]) => {
        const fx = mx + dir * mw * frac;
        fctx.beginPath();
        fctx.moveTo(fx - dir * 6, my - 1); fctx.lineTo(fx, my + fangH); fctx.lineTo(fx + dir * 6, my + 2);
        fctx.closePath(); fctx.fill(); fctx.stroke();
      });
    }

    fctx.strokeStyle = '#4e4646'; fctx.lineWidth = 4.2; fctx.lineJoin = 'round';
    fctx.beginPath();
    fctx.moveTo(mx - mw, my + 4);
    fctx.quadraticCurveTo(mx - mw * 0.35, my - 4 * openness, mx, my - 8 * openness);
    fctx.quadraticCurveTo(mx + mw * 0.35, my - 4 * openness, mx + mw, my + 4);
    fctx.quadraticCurveTo(mx + mw * 0.72, my + mh * 0.78, mx, my + mh);
    fctx.quadraticCurveTo(mx - mw * 0.72, my + mh * 0.78, mx - mw, my + 4);
    fctx.closePath(); fctx.stroke();
  } else if (mood === 'sarkas' && !talking) {
    fctx.fillStyle = '#b9787b'; fctx.strokeStyle = '#474343'; fctx.lineWidth = 4;
    fctx.beginPath(); fctx.ellipse(mx, my + 14, 7, 9, 0, 0, Math.PI * 2); fctx.fill(); fctx.stroke();
  } else if (mood === 'berpikir' && !talking) {
    fctx.strokeStyle = '#474343'; fctx.lineWidth = 4.5; fctx.lineCap = 'round';
    fctx.beginPath();
    fctx.moveTo(mx - 16, my + 12);
    fctx.quadraticCurveTo(mx - 8, my + 6, mx, my + 12);
    fctx.quadraticCurveTo(mx + 8, my + 18, mx + 16, my + 12);
    fctx.stroke();
  } else if (mood === 'marah_gemas' && talking) {
    fctx.strokeStyle = '#474343'; fctx.lineWidth = 5; fctx.lineCap = 'round';
    fctx.beginPath();
    fctx.moveTo(mx - 18, my + 10); fctx.quadraticCurveTo(mx, my + 1, mx + 18, my + 10);
    fctx.stroke();
  } else {
    fctx.strokeStyle = '#474343'; fctx.lineWidth = 5; fctx.lineCap = 'round';
    fctx.beginPath();
    fctx.moveTo(mx - 22, my + 8);
    fctx.quadraticCurveTo(mx - 11, my + 21, mx, my + 8);
    fctx.quadraticCurveTo(mx + 11, my + 21, mx + 22, my + 8);
    fctx.stroke();
  }
}

const NEKO_BALLOON_COLORS = [
  [0.95, 0.36, 0.40], // coral
  [0.95, 0.72, 0.25], // kuning
  [0.36, 0.68, 0.95], // biru
  [0.95, 0.54, 0.72]  // pink
];

function createNekoChi3DEngine(canvas, shadowEl, opts = {}) {
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return null;

  let contextLost = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); contextLost = true; });
  canvas.addEventListener('webglcontextrestored', () => { contextLost = false; });

  const vsSrc = `
    attribute vec3 aPos;
    attribute vec3 aNorm;
    attribute vec2 aUv;
    uniform mat4 uProj;
    uniform mat4 uTransform;
    uniform vec3 uScale;
    uniform float uOutlineWidth;
    varying vec3 vNorm;
    varying vec3 vWorldPos;
    varying vec2 vUv;
    void main() {
      vec3 nLocal = normalize(aNorm / max(uScale, vec3(0.001)));
      vec3 pLocal = aPos * uScale + nLocal * uOutlineWidth;
      vec4 wp = uTransform * vec4(pLocal, 1.0);
      vWorldPos = wp.xyz;
      vNorm = normalize(mat3(uTransform) * nLocal);
      vUv = aUv;
      gl_Position = uProj * wp;
    }
  `;
  const fsSrc = `
    precision mediump float;
    varying vec3 vNorm;
    varying vec3 vWorldPos;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uUseTex;
    uniform float uIsOutline;
    uniform float uRimStr;
    uniform float uSpecStr;
    uniform float uFlatFace;
    uniform sampler2D uTex;
    void main() {
      if (uIsOutline > 0.5) {
        gl_FragColor = vec4(0.28, 0.26, 0.26, 1.0);
        return;
      }
      vec3 N = normalize(vNorm);
      vec3 V = normalize(vec3(0.0, 0.05, 6.4) - vWorldPos);
      vec3 L = normalize(vec3(0.42, 0.72, 0.96));
      vec3 H = normalize(L + V);
      vec3 baseCol = uUseTex > 0.5 ? texture2D(uTex, vUv).rgb : uColor;
      float ndotl = dot(N, L);
      float shift = uFlatFace > 0.5 ? 0.22 : 0.06;
      float cel = smoothstep(-0.14 - shift, 0.08 - shift, ndotl);
      vec3 lightCol = mix(vec3(0.84, 0.84, 0.89), vec3(1.01, 1.01, 1.00), cel);
      float rim = smoothstep(0.68, 0.82, 1.0 - max(dot(N, V), 0.0)) * uRimStr;
      float spec = smoothstep(0.88, 0.94, pow(max(dot(N, H), 0.0), 18.0)) * uSpecStr;
      vec3 col = baseCol * lightCol + vec3(1.0, 0.99, 0.98) * (rim + spec);
      gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
    }
  `;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const loc = {
    aPos: gl.getAttribLocation(prog, 'aPos'),
    aNorm: gl.getAttribLocation(prog, 'aNorm'),
    aUv: gl.getAttribLocation(prog, 'aUv'),
    uProj: gl.getUniformLocation(prog, 'uProj'),
    uTransform: gl.getUniformLocation(prog, 'uTransform'),
    uScale: gl.getUniformLocation(prog, 'uScale'),
    uOutlineWidth: gl.getUniformLocation(prog, 'uOutlineWidth'),
    uColor: gl.getUniformLocation(prog, 'uColor'),
    uUseTex: gl.getUniformLocation(prog, 'uUseTex'),
    uIsOutline: gl.getUniformLocation(prog, 'uIsOutline'),
    uRimStr: gl.getUniformLocation(prog, 'uRimStr'),
    uSpecStr: gl.getUniformLocation(prog, 'uSpecStr'),
    uFlatFace: gl.getUniformLocation(prog, 'uFlatFace'),
    uTex: gl.getUniformLocation(prog, 'uTex')
  };

  const buildMesh = (latBands, lonBands, evalPos) => {
    const rows = latBands + 1, cols = lonBands + 1;
    const pos = new Float32Array(rows * cols * 3);
    const norm = new Float32Array(rows * cols * 3);
    const uv = new Float32Array(rows * cols * 2);
    const idx = [];
    for (let lat = 0; lat <= latBands; lat++) {
      const v = lat / latBands;
      for (let lon = 0; lon <= lonBands; lon++) {
        const u = lon / lonBands;
        const p = evalPos(u, v);
        const k = lat * cols + lon;
        pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2];
        uv[k * 2] = u; uv[k * 2 + 1] = v;
      }
    }
    for (let lat = 0; lat < latBands; lat++) {
      for (let lon = 0; lon < lonBands; lon++) {
        const p00 = lat * cols + lon, p10 = p00 + cols, p01 = p00 + 1, p11 = p10 + 1;
        idx.push(p00, p10, p01, p10, p11, p01);
      }
    }
    for (let i = 0; i < idx.length; i += 3) {
      const i0 = idx[i] * 3, i1 = idx[i + 1] * 3, i2 = idx[i + 2] * 3;
      const ax = pos[i1] - pos[i0], ay = pos[i1 + 1] - pos[i0 + 1], az = pos[i1 + 2] - pos[i0 + 2];
      const bx = pos[i2] - pos[i0], by = pos[i2 + 1] - pos[i0 + 1], bz = pos[i2 + 2] - pos[i0 + 2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      [i0, i1, i2].forEach(k => { norm[k] += nx; norm[k + 1] += ny; norm[k + 2] += nz; });
    }
    for (let lat = 0; lat <= latBands; lat++) {
      const a = (lat * cols) * 3, b = (lat * cols + lonBands) * 3;
      const sx = norm[a] + norm[b], sy = norm[a + 1] + norm[b + 1], sz = norm[a + 2] + norm[b + 2];
      norm[a] = norm[b] = sx; norm[a + 1] = norm[b + 1] = sy; norm[a + 2] = norm[b + 2] = sz;
    }
    [0, latBands].forEach(poleLat => {
      let px = 0, py = 0, pz = 0;
      for (let lon = 0; lon <= lonBands; lon++) {
        const k = (poleLat * cols + lon) * 3;
        px += norm[k]; py += norm[k + 1]; pz += norm[k + 2];
      }
      for (let lon = 0; lon <= lonBands; lon++) {
        const k = (poleLat * cols + lon) * 3;
        norm[k] = px; norm[k + 1] = py; norm[k + 2] = pz;
      }
    });
    for (let i = 0; i < norm.length; i += 3) {
      const l = Math.hypot(norm[i], norm[i + 1], norm[i + 2]) || 1;
      norm[i] /= l; norm[i + 1] /= l; norm[i + 2] /= l;
    }
    const mk = (data, target) => {
      const b = gl.createBuffer();
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, gl.STATIC_DRAW);
      return b;
    };
    return {
      pos: mk(pos, gl.ARRAY_BUFFER),
      norm: mk(norm, gl.ARRAY_BUFFER),
      uv: mk(uv, gl.ARRAY_BUFFER),
      idx: mk(new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER),
      count: idx.length
    };
  };

  const headMesh = buildMesh(22, 30, (u, v) => {
    const theta = v * Math.PI, phi = (u - 0.5) * Math.PI * 2;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    const sx = Math.sin(phi) * sinT, sy = cosT, sz = Math.cos(phi) * sinT;
    const cheek = Math.exp(-Math.pow((sy + 0.14) / 0.42, 2));
    let x = sx * (1.10 + 0.08 * cheek), y = sy * 0.90, z = sz * 0.94;
    if (z > 0.48) z = 0.48 + (z - 0.48) * 0.88;
    return [x, y, z];
  });
  const earMesh = buildMesh(12, 18, (u, v) => {
    const phi = (u - 0.5) * Math.PI * 2, h = (1 - v) * 1.02;
    const tipCap = Math.sin(Math.min(1, v * 1.18) * Math.PI * 0.5);
    const baseCap = v > 0.92 ? Math.cos(((v - 0.92) / 0.08) * Math.PI * 0.5) : 1;
    const rad = (0.03 + 0.48 * Math.pow(v, 0.72)) * tipCap * baseCap;
    let z = Math.cos(phi) * rad * 0.42;
    if (z > 0) z *= 0.62;
    return [Math.sin(phi) * rad, h, z];
  });
  const bodyMesh = buildMesh(16, 22, (u, v) => {
    const theta = v * Math.PI, phi = (u - 0.5) * Math.PI * 2;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    const belly = 1 + 0.14 * Math.exp(-Math.pow((cosT + 0.25) / 0.5, 2));
    return [Math.sin(phi) * sinT * 0.64 * belly, cosT * 0.76, Math.cos(phi) * sinT * 0.60 * belly];
  });
  const armMesh = buildMesh(12, 16, (u, v) => {
    const theta = v * Math.PI, phi = (u - 0.5) * Math.PI * 2;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    const r = 0.185, y = -0.31 + cosT * 0.34, flare = cosT < 0 ? (1 + (-cosT) * 0.16) : 1;
    return [Math.sin(phi) * sinT * r * flare, y, Math.cos(phi) * sinT * r * 0.92 * flare];
  });
  const sphereMesh = buildMesh(12, 18, (u, v) => {
    const theta = v * Math.PI, phi = (u - 0.5) * Math.PI * 2;
    return [Math.sin(phi) * Math.sin(theta), Math.cos(theta), Math.cos(phi) * Math.sin(theta)];
  });

  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 1024;
  faceCanvas.height = 512;
  const fctx = faceCanvas.getContext('2d');
  paintChiFaceToCanvas(fctx, 'santai', false, 0, false, 0);

  const { bodyCanvas, earCanvas } = getNekoSharedTextures();
  const mkTex = (c) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const faceTex = mkTex(faceCanvas);
  const bodyTex = mkTex(bodyCanvas);
  const earTex = mkTex(earCanvas);

  const m4 = {
    mul: (a, b) => {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
          o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
      }
      return o;
    },
    persp: (fov, asp, near, far) => {
      const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
      return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    },
    trans: (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]),
    rotX: (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
    rotY: (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
    rotZ: (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  };

  let boundMesh = null;
  const bindMesh = (mesh) => {
    if (boundMesh === mesh) return;
    boundMesh = mesh;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.enableVertexAttribArray(loc.aPos);
    gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.norm);
    gl.enableVertexAttribArray(loc.aNorm);
    gl.vertexAttribPointer(loc.aNorm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uv);
    gl.enableVertexAttribArray(loc.aUv);
    gl.vertexAttribPointer(loc.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
  };

  const drawPart = (mesh, parentMat, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], col = [0.6, 0.6, 0.6], tex = null, outline = 0.03, rimStr = 0.12, specStr = 0.0, flatFace = false }) => {
    bindMesh(mesh);
    let m = m4.mul(parentMat, m4.trans(p[0], p[1], p[2]));
    if (r[1]) m = m4.mul(m, m4.rotY(r[1]));
    if (r[0]) m = m4.mul(m, m4.rotX(r[0]));
    if (r[2]) m = m4.mul(m, m4.rotZ(r[2]));
    gl.uniformMatrix4fv(loc.uTransform, false, m);
    gl.uniform3fv(loc.uScale, s);
    if (outline > 0) {
      gl.cullFace(gl.FRONT);
      gl.uniform1f(loc.uIsOutline, 1.0);
      gl.uniform1f(loc.uOutlineWidth, outline);
      gl.uniform1f(loc.uUseTex, 0.0);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }
    gl.cullFace(gl.BACK);
    gl.uniform1f(loc.uIsOutline, 0.0);
    gl.uniform1f(loc.uOutlineWidth, 0.0);
    gl.uniform3fv(loc.uColor, col);
    gl.uniform1f(loc.uRimStr, rimStr);
    gl.uniform1f(loc.uSpecStr, specStr);
    gl.uniform1f(loc.uFlatFace, flatFace ? 1.0 : 0.0);
    if (tex) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc.uTex, 0);
      gl.uniform1f(loc.uUseTex, 1.0);
    } else {
      gl.uniform1f(loc.uUseTex, 0.0);
    }
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  };

  const drawChiArm = (parentMat, shoulderPos, rotX, rotZ) => {
    let arm = m4.mul(parentMat, m4.trans(shoulderPos[0], shoulderPos[1], shoulderPos[2]));
    arm = m4.mul(arm, m4.rotZ(rotZ));
    arm = m4.mul(arm, m4.rotX(rotX));
    drawPart(armMesh, arm, { col: [0.99, 0.99, 0.99], outline: 0.028, flatFace: true });
    drawPart(sphereMesh, arm, { p: [0, -0.62, 0.02], s: [0.22, 0.19, 0.17], col: [0.99, 0.99, 0.99], outline: 0.028, flatFace: true });
    const padCol = [0.20, 0.19, 0.20];
    drawPart(sphereMesh, arm, { p: [0, -0.59, 0.172], s: [0.072, 0.064, 0.032], col: padCol, outline: 0 });
    [[-0.10, -0.68], [-0.038, -0.73], [0.038, -0.73], [0.10, -0.68]].forEach(([bx, by]) => {
      drawPart(sphereMesh, arm, { p: [bx, by, 0.154], s: [0.034, 0.038, 0.026], col: padCol, outline: 0 });
    });
  };

  const state = {
    mood: 'santai',
    pose: 'duduk',
    peeking: false,
    balloon: false,
    balloonW: 0,
    balloonColorIdx: 0,
    talking: false,
    mouthOpen: 0,
    yaw: opts.initYaw ?? 0.08,
    pitch: opts.initPitch ?? 0.04,
    targetYaw: opts.initYaw ?? 0.08,
    targetPitch: opts.initPitch ?? 0.04,
    pokeTimer: 0,
    camZ: opts.camZ ?? -8.15,
    poseW: { duduk: 1, berdiri: 0, rebahan: 0 },
    lastFaceKey: '',
    faceDirty: true
  };

  function render(t, snapInstant = false) {
    if (contextLost) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(80, Math.round((canvas.clientWidth || 140) * dpr));
    const h = Math.max(80, Math.round((canvas.clientHeight || 140) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.useProgram(prog);
    boundMesh = null;

    gl.uniformMatrix4fv(loc.uProj, false, m4.persp(0.56, canvas.width / canvas.height, 0.1, 35));

    const lerpRate = snapInstant ? 1.0 : 0.16;
    if (state.pokeTimer > 0) state.pokeTimer = Math.max(0, state.pokeTimer - 0.016);
    const targetBalloon = (state.balloon && !state.peeking) ? 1 : 0;
    state.balloonW += (targetBalloon - state.balloonW) * lerpRate;
    const bW = state.balloonW;

    const isBlink = (state.mood === 'santai') && (Math.sin(t * 1.45) > 0.985);
    const talkAmt = state.talking ? Math.max(0, Math.min(1, state.mouthOpen)) : 0;
    const panicTick = state.mood === 'panik' ? Math.floor(t * 16) : 0;
    const faceKey = `${state.mood}|${isBlink ? 1 : 0}|${state.talking ? 1 : 0}|${Math.round(talkAmt * 16)}|${panicTick}`;
    if (state.faceDirty || faceKey !== state.lastFaceKey) {
      paintChiFaceToCanvas(fctx, state.mood, isBlink, talkAmt, state.talking, t);
      gl.bindTexture(gl.TEXTURE_2D, faceTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, faceCanvas);
      state.lastFaceKey = faceKey;
      state.faceDirty = false;
    }

    const targetPoseNow = state.peeking ? 'duduk' : (state.balloon ? 'berdiri' : state.pose);
    state.poseW.duduk += ((targetPoseNow === 'duduk' ? 1 : 0) - state.poseW.duduk) * lerpRate;
    state.poseW.berdiri += ((targetPoseNow === 'berdiri' ? 1 : 0) - state.poseW.berdiri) * lerpRate;
    state.poseW.rebahan += ((targetPoseNow === 'rebahan' ? 1 : 0) - state.poseW.rebahan) * lerpRate;
    const wD = state.poseW.duduk, wB = state.poseW.berdiri, wR = state.poseW.rebahan;
    const mixP = (d, b, r) => d * wD + b * wB + r * wR;

    state.yaw += (state.targetYaw - state.yaw) * (snapInstant ? 1.0 : 0.12);
    state.pitch += (state.targetPitch - state.pitch) * (snapInstant ? 1.0 : 0.12);

    const pokeHop = state.pokeTimer > 0 ? Math.sin((state.pokeTimer / 0.58) * Math.PI) * 0.28 : 0;
    const panicShake = state.mood === 'panik' ? Math.sin(t * 34) * 0.04 : 0;
    const floatY = state.peeking
      ? (Math.sin(t * 1.65) * 0.075 - 0.04 + pokeHop)
      : (Math.sin(t * 2.2) * mixP(0.08, 0.14, 0.05) + mixP(0.06, 0.10, 0.02) + pokeHop + (state.mood === 'bangga' ? Math.abs(Math.sin(t * 5.2)) * 0.12 : 0));
    const idleYaw = state.peeking ? Math.sin(t * 0.85) * 0.24 : Math.sin(t * 0.9) * 0.11;

    const effCamZ = state.camZ - bW * 3.55;
    const rootY = floatY - 0.22 - bW * 1.15;
    const balloonSwing = Math.sin(t * 1.65) * 0.08 * bW;

    let root = m4.mul(m4.trans(panicShake, rootY, effCamZ), m4.rotY(state.yaw + idleYaw));
    root = m4.mul(root, m4.rotX(state.pitch));
    if (bW > 0.01) root = m4.mul(root, m4.rotZ(balloonSwing));

    const bodyY = mixP(-1.04, -0.96, -0.96);
    const bodyZ = mixP(-0.08, -0.04, -0.60);
    const bodyRotX = mixP(-0.15, 0.0, 1.36) + (state.mood === 'panik' ? -0.14 * wD : 0);
    const bodyScale = [mixP(1.06, 1.0, 1.02), mixP(0.96, 1.0, 1.08), mixP(1.06, 1.0, 0.92)];
    drawPart(bodyMesh, root, { p: [0, bodyY, bodyZ], r: [bodyRotX, 0, 0], s: bodyScale, tex: bodyTex, outline: 0.034, flatFace: true });

    const shX = state.peeking ? 0.56 : mixP(0.54, 0.56, 0.46);
    const shY = state.peeking ? -0.28 : mixP(-0.74, -0.68, -0.96);
    const shZ = state.peeking ? 0.28 : mixP(0.16, 0.14, 0.04);
    let lRotX = -0.25, lRotZ = -0.35, rRotX = -0.25, rRotZ = 0.35;

    if (state.peeking && !state.talking) {
      const gripWiggle = Math.sin(t * 2.1) * 0.06;
      lRotX = -1.36; lRotZ = -0.42 + gripWiggle;
      rRotX = -1.36; rRotZ = 0.42 - gripWiggle;
    } else if (bW > 0.35) {
      rRotZ = 2.32 + Math.sin(t * 2.0) * 0.06;
      rRotX = -0.34;
      lRotZ = -1.78 + Math.sin(t * 2.9) * 0.22;
      lRotX = -0.32;
    } else if (state.pokeTimer > 0) {
      lRotZ = -2.35; rRotZ = 2.35; lRotX = -0.38; rRotX = -0.38;
    } else if (state.mood === 'panik') {
      const flail = Math.sin(t * 22) * 0.22;
      lRotZ = -2.42 + flail; lRotX = -0.35;
      rRotZ = 2.42 - flail; rRotX = -0.35;
    } else if (state.mood === 'bangga') {
      const cheer = Math.sin(t * 8.5) * 0.16;
      lRotZ = -2.58 + cheer; lRotX = -0.25;
      rRotZ = 2.58 - cheer; rRotX = -0.25;
    } else if (state.mood === 'marah_gemas') {
      const tantrum = Math.sin(t * 20) * 0.38;
      lRotZ = -1.65 + tantrum; lRotX = -0.68;
      rRotZ = 1.65 + tantrum; rRotX = -0.68;
    } else if (state.mood === 'berpikir') {
      lRotZ = -0.22; lRotX = -0.78;
      rRotZ = 1.75 + Math.sin(t * 2.4) * 0.08; rRotX = -0.82;
    } else if (state.mood === 'sarkas') {
      lRotZ = mixP(-0.14, -0.24, -0.18) + Math.sin(t * 1.5) * 0.04;
      rRotZ = mixP(0.14, 0.24, 0.18) - Math.sin(t * 1.5) * 0.04;
      lRotX = mixP(-0.74, -0.18, -1.42);
      rRotX = mixP(-0.74, -0.18, -1.42);
    } else if (state.talking) {
      const wave = Math.sin(t * 10) * 0.24;
      rRotZ = mixP(2.05, 2.18, 0.55) + wave;
      rRotX = mixP(-0.36, -0.28, -1.25);
      lRotZ = mixP(-1.55, -1.45, -0.55) - wave * 0.8;
      lRotX = mixP(-0.48, -0.42, -1.25);
    } else {
      lRotZ = mixP(-0.18, -0.36, -0.18) - Math.sin(t * 2.0) * 0.05;
      lRotX = mixP(-0.78, -0.22, -1.45);
      rRotZ = mixP(0.24, 2.18, 0.18) + Math.sin(t * 3.6) * mixP(0.10, 0.24, 0.06);
      rRotX = mixP(-0.82 - Math.max(0, Math.sin(t * 1.6)) * 0.35, -0.28, -1.45);
    }
    drawChiArm(root, [-shX, shY, shZ], lRotX, lRotZ);
    drawChiArm(root, [shX, shY, shZ], rRotX, rRotZ);

    if (bW > 0.04) {
      const cx = Math.cos(rRotX), sx = Math.sin(rRotX);
      const y1 = -0.62 * cx - 0.02 * sx;
      const z1 = -0.62 * sx + 0.02 * cx;
      const cz = Math.cos(rRotZ), sz = Math.sin(rRotZ);
      const pawX = shX - sz * y1;
      const pawY = shY + cz * y1;
      const pawZ = shZ + z1;

      const bSway = Math.sin(t * 1.85 + 0.4) * 0.14;
      const bX = pawX + 0.42 + bSway;
      const bY = pawY + 2.68 * bW;
      const bZ = pawZ + 0.14;
      const knotY = bY - 0.88 * bW;
      const bCol = NEKO_BALLOON_COLORS[state.balloonColorIdx % NEKO_BALLOON_COLORS.length];

      // Warna tali krem ber-outline gelap agar terbaca di tema terang maupun gelap.
      const stringSegs = 16;
      for (let s = 0; s < stringSegs; s++) {
        const f0 = s / stringSegs;
        const f1 = (s + 1) / stringSegs;
        const c0 = Math.sin(f0 * Math.PI) * 0.11 * Math.sin(t * 2.2);
        const c1 = Math.sin(f1 * Math.PI) * 0.11 * Math.sin(t * 2.2);
        const x0 = pawX + (bX - pawX) * f0 + c0;
        const y0 = pawY + (knotY - pawY) * f0;
        const z0 = pawZ + (bZ - pawZ) * f0;
        const x1 = pawX + (bX - pawX) * f1 + c1;
        const y1s = pawY + (knotY - pawY) * f1;
        const z1s = pawZ + (bZ - pawZ) * f1;
        const dx = x1 - x0, dy = y1s - y0, dz = z1s - z0;
        const segLen = Math.hypot(dx, dy, dz) || 0.05;
        const tiltZ = -Math.atan2(dx, dy);
        drawPart(sphereMesh, root, {
          p: [(x0 + x1) * 0.5, (y0 + y1s) * 0.5, (z0 + z1s) * 0.5],
          r: [0, 0, tiltZ],
          s: [0.026 * bW, segLen * 0.64, 0.026 * bW],
          col: [0.95, 0.91, 0.82],
          outline: 0.016 * bW,
          flatFace: true
        });
      }

      drawPart(sphereMesh, root, { p: [bX, knotY, bZ], s: [0.13 * bW, 0.10 * bW, 0.13 * bW], col: bCol, outline: 0.022 * bW });
      drawPart(sphereMesh, root, {
        p: [bX, bY, bZ],
        r: [0, 0, -bSway * 0.55],
        s: [0.78 * bW, 0.92 * bW, 0.78 * bW],
        col: bCol,
        outline: 0.034 * bW,
        rimStr: 0.26,
        specStr: 0.68
      });
      drawPart(sphereMesh, root, {
        p: [bX - 0.29 * bW, bY + 0.34 * bW, bZ + 0.58 * bW],
        r: [0.18, -0.35, 0.22],
        s: [0.13 * bW, 0.22 * bW, 0.05 * bW],
        col: [1.0, 0.99, 0.98],
        outline: 0,
        flatFace: true
      });
    }

    const kickAmp = state.mood === 'panik' ? 0.28 : (bW > 0.3 ? 0.24 : (wD > 0.5 ? 0.06 : 0.10));
    const kickL = Math.sin(t * (state.mood === 'panik' ? 18 : (bW > 0.3 ? 3.8 : 2.6))) * kickAmp;
    [-1, 1].forEach(side => {
      const k = side < 0 ? kickL : -kickL;
      if (wD > 0.04) {
        drawPart(sphereMesh, root, {
          p: [side * 0.52, -1.34, 0.10],
          s: [0.27 * wD, 0.26 * wD, 0.30 * wD],
          col: [0.99, 0.99, 0.99],
          outline: 0.026 * wD,
          flatFace: true
        });
      }
      const lx = side * mixP(0.47, 0.31, 0.38);
      const ly = mixP(-1.46, -1.62, -1.16);
      const lz = mixP(0.45, 0.08, -1.30);
      let leg = m4.mul(root, m4.trans(lx, ly, lz));
      leg = m4.mul(leg, m4.rotY(side * mixP(0.30, 0.0, 0.18)));
      leg = m4.mul(leg, m4.rotX(mixP(-0.32 + k * 0.8, k, 0.15 + k * 0.5)));
      drawPart(sphereMesh, leg, { s: [0.22, 0.16, 0.26], col: [0.99, 0.99, 0.99], outline: 0.028, flatFace: true });
      drawPart(sphereMesh, leg, {
        p: [0, mixP(-0.02, -0.14, -0.11), mixP(0.24, 0.05, -0.06)],
        s: [0.078, mixP(0.065, 0.03, 0.04), mixP(0.035, 0.08, 0.07)],
        col: [0.20, 0.19, 0.20], outline: 0
      });
      if (wD > 0.35) {
        [[-0.08, 0.075, 0.205], [0, 0.105, 0.192], [0.08, 0.075, 0.205]].forEach(([bx, by, bz]) => {
          drawPart(sphereMesh, leg, { p: [bx, by, bz], s: [0.030 * wD, 0.032 * wD, 0.025 * wD], col: [0.20, 0.19, 0.20], outline: 0 });
        });
      }
    });

    const tailPuff = state.mood === 'panik' ? 1.28 : 1.0;
    for (let seg = 0; seg < 11; seg++) {
      const frac = seg / 10;
      const wag = Math.sin(t * (state.mood === 'panik' ? 14 : 2.8) - frac * 2.5) * (state.mood === 'panik' ? 0.08 : 0.18);
      const ang = -0.35 + frac * 1.95;
      const sx = mixP(0.22 + Math.sin(ang) * 0.68 + wag * frac * 0.22, 0.44 + frac * 0.78 + wag * frac * 0.85, 0.08 + frac * 0.56 + wag * frac * 0.95);
      const sy = mixP(-1.50 + frac * 0.12 + (state.mood === 'panik' ? frac * 0.72 : 0), -1.32 + frac * 1.15 + (state.mood === 'panik' ? frac * 0.22 : 0), -0.96 + frac * 0.52);
      const sz = mixP(-0.52 + (1 - Math.cos(ang)) * 0.56, -0.44 - frac * 0.34, -1.24 - frac * 0.82);
      const rad = (0.145 - frac * 0.025) * tailPuff;
      const stripeBand = Math.floor(frac * 5.99);
      const col = (seg === 10 || stripeBand % 2 === 1) ? [0.20, 0.21, 0.22] : [0.56, 0.57, 0.59];
      drawPart(sphereMesh, root, { p: [sx, sy, sz], s: [rad, rad, rad], col, outline: 0.025 });
    }

    const headNod = state.talking ? Math.sin(t * 11) * 0.075 : Math.sin(t * 1.8) * 0.03;
    const headTilt = state.mood === 'berpikir' ? 0.14 : (state.mood === 'santai' ? Math.sin(t * 1.1) * 0.06 : (state.mood === 'marah_gemas' ? Math.sin(t * 16) * 0.05 : 0));
    let head = m4.mul(root, m4.trans(0, mixP(0.24, 0.34, -0.18), mixP(0.08, 0.05, 0.38)));
    head = m4.mul(head, m4.rotX(headNod + mixP(0.04, 0, -0.08)));
    head = m4.mul(head, m4.rotZ(headTilt));
    drawPart(headMesh, head, { tex: faceTex, outline: 0.036, rimStr: 0.10, flatFace: true });

    const earDroop = state.mood === 'panik' ? 0.56 : (state.mood === 'sarkas' ? 0.16 : 0);
    const twL = Math.sin(t * 1.65) > 0.94 ? 0.14 : 0;
    const twR = Math.sin(t * 1.35 + 1.8) > 0.94 ? 0.14 : 0;
    [-1, 1].forEach(side => {
      const tw = side < 0 ? twL : twR;
      let ear = m4.mul(head, m4.trans(side * 0.64, 0.54, -0.02));
      ear = m4.mul(ear, m4.rotX(0.10));
      ear = m4.mul(ear, m4.rotZ(side * -(0.46 + earDroop + tw)));
      drawPart(earMesh, ear, { s: [1.06, 1.04, 1.0], tex: earTex, outline: 0.032, rimStr: 0.14, flatFace: true });
    });

    [-1, 1].forEach(side => {
      [{ dy: -0.16, rz: side * 0.16 }, { dy: -0.27, rz: side * -0.02 }, { dy: -0.38, rz: side * -0.18 }].forEach(w => {
        drawPart(sphereMesh, head, { p: [side * 1.02, w.dy, 0.44], r: [0, side * -0.28, w.rz], s: [0.34, 0.013, 0.013], col: [0.22, 0.21, 0.21], outline: 0 });
      });
    });

    if (state.mood === 'marah_gemas') {
      const pulse = 1 + Math.sin(t * 12) * 0.16;
      drawPart(sphereMesh, head, { p: [0.58, 0.96, 0.48], r: [0, 0, 0.72], s: [0.20 * pulse, 0.052 * pulse, 0.052], col: [0.92, 0.18, 0.28], outline: 0.018 });
      drawPart(sphereMesh, head, { p: [0.58, 0.96, 0.48], r: [0, 0, -0.72], s: [0.20 * pulse, 0.052 * pulse, 0.052], col: [0.92, 0.18, 0.28], outline: 0.018 });
    } else if (state.mood === 'panik') {
      const d1 = 0.72 - ((t * 0.65) % 0.52);
      const d2 = 0.56 - (((t + 0.25) * 0.65) % 0.52);
      drawPart(sphereMesh, head, { p: [-0.96, d1, 0.45], s: [0.085, 0.15, 0.085], col: [0.46, 0.84, 0.99], outline: 0.018, specStr: 0.8 });
      drawPart(sphereMesh, head, { p: [0.96, d2, 0.45], s: [0.075, 0.13, 0.075], col: [0.46, 0.84, 0.99], outline: 0.018, specStr: 0.8 });
    } else if (state.mood === 'bangga') {
      const spY = 0.82 + Math.sin(t * 4.5) * 0.09;
      drawPart(sphereMesh, head, { p: [-1.05, spY, 0.38], r: [0, t * 2.5, 0], s: [0.19, 0.055, 0.055], col: [0.99, 0.80, 0.20], outline: 0.015, specStr: 0.7 });
      drawPart(sphereMesh, head, { p: [-1.05, spY, 0.38], r: [0, t * 2.5, 0], s: [0.055, 0.19, 0.055], col: [0.99, 0.80, 0.20], outline: 0.015, specStr: 0.7 });
      drawPart(sphereMesh, head, { p: [1.05, spY - 0.05, 0.38], r: [0, -t * 2.5, 0], s: [0.16, 0.05, 0.05], col: [0.98, 0.45, 0.66], outline: 0.015, specStr: 0.7 });
      drawPart(sphereMesh, head, { p: [1.05, spY - 0.05, 0.38], r: [0, -t * 2.5, 0], s: [0.05, 0.16, 0.05], col: [0.98, 0.45, 0.66], outline: 0.015, specStr: 0.7 });
    } else if (state.mood === 'berpikir') {
      for (let i = 0; i < 3; i++) {
        const dy = Math.sin(t * 4.5 - i * 0.7) * 0.08;
        drawPart(sphereMesh, head, { p: [0.68 + i * 0.20, 0.86 + i * 0.14 + dy, 0.35], s: [0.07 + i * 0.015, 0.07 + i * 0.015, 0.07 + i * 0.015], col: [0.24, 0.52, 0.96], outline: 0.015, specStr: 0.6 });
      }
    }
  }

  return {
    state,
    render,
    setMood(m) {
      const valid = NEKO_MOOD_META[m] ? m : 'santai';
      if (state.mood !== valid) { state.mood = valid; state.faceDirty = true; }
    },
    setPose(p) {
      if (p === 'duduk' || p === 'berdiri' || p === 'rebahan') state.pose = p;
    },
    setPeeking(p) {
      state.peeking = Boolean(p);
    },
    setBalloon(b, colorIdx = null) {
      state.balloon = Boolean(b);
      if (colorIdx !== null) state.balloonColorIdx = Math.abs(Math.round(colorIdx)) % NEKO_BALLOON_COLORS.length;
    },
    setTalking(talking, mouthOpen = null) {
      if (state.talking !== talking) { state.talking = talking; state.faceDirty = true; }
      if (mouthOpen !== null) state.mouthOpen = mouthOpen;
      else if (!talking) state.mouthOpen = 0;
    },
    poke() { state.pokeTimer = 0.58; }
  };
}
