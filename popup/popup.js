const DEFAULT_NAMES = [];

const STORAGE_KEY = 'nameList';
const HISTORY_KEY = 'winnerHistory';
const STATS_KEY = 'pickCounts';
const LIST_COLLAPSED_KEY = 'namesListCollapsed';
const HISTORY_SIZE = 5;
const SCROLLER_VIEWPORT_HEIGHT = 80;
const SCROLLER_ITEM_HEIGHT = 44;
const SCROLLER_REPEAT = 10;

const CONFETTI_COLORS = ['#e53935', '#ff9800', '#ffeb3b', '#43a047', '#2196f3', '#9c27b0', '#ffd700', '#00bcd4'];

const nameInput = document.getElementById('name-input');
const addBtn = document.getElementById('add-btn');
const nameListEl = document.getElementById('name-list');
const emptyMsg = document.getElementById('empty-msg');
const scrollerStrip = document.getElementById('scroller-strip');
const spinBtn = document.getElementById('spin-btn');
const leverBtn = document.getElementById('lever-btn');
const resultEl = document.getElementById('result');
const winnerHistoryEl = document.getElementById('winner-history');
const winnerHistoryListEl = document.getElementById('winner-history-list');
const statsEl = document.getElementById('stats');
const statsListEl = document.getElementById('stats-list');
const confettiContainer = document.getElementById('confetti-container');
const importPanel = document.getElementById('import-panel');
const importBtn = document.getElementById('import-btn');
const importTextarea = document.getElementById('import-textarea');
const importReplaceBtn = document.getElementById('import-replace-btn');
const importCancelBtn = document.getElementById('import-cancel-btn');
const tabSlot = document.getElementById('tab-slot');
const tabBattle = document.getElementById('tab-battle');
const panelSlot = document.getElementById('panel-slot');
const panelBattle = document.getElementById('panel-battle');
const battleCanvas = document.getElementById('battle-canvas');
const battleBtn = document.getElementById('battle-btn');
const battleLegend = document.getElementById('battle-legend');
const listCollapseBtn = document.getElementById('list-collapse-btn');
const listSection = document.querySelector('.list-section');

let nameList = [];
let winnerHistory = [];
let pickCounts = {};
let isSpinning = false;
let isBattling = false;
let currentMode = 'slot';

function renderScroller(names) {
  scrollerStrip.innerHTML = '';
  scrollerStrip.classList.remove('spinning');
  scrollerStrip.style.transform = 'translateY(0)';

  if (names.length === 0) return;

  for (let r = 0; r < SCROLLER_REPEAT; r++) {
    names.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'scroller-item';
      item.textContent = name;
      scrollerStrip.appendChild(item);
    });
  }
}

function renderList() {
  nameListEl.innerHTML = '';
  nameList.forEach((name, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = name;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeName(i));
    li.appendChild(span);
    li.appendChild(removeBtn);
    nameListEl.appendChild(li);
  });

  const empty = nameList.length === 0;
  emptyMsg.classList.toggle('hidden', !empty);
  spinBtn.disabled = empty;
  leverBtn.disabled = empty;
  battleBtn.disabled = empty;
  resultEl.classList.add('hidden');

  renderScroller(nameList);
  renderHistory(winnerHistory);
  renderStats(pickCounts);
}

function renderHistory(history) {
  winnerHistoryListEl.innerHTML = '';
  winnerHistoryEl.classList.toggle('hidden', !history || history.length === 0);
  if (!history || history.length === 0) return;
  const text = history.join(' • ');
  winnerHistoryListEl.textContent = text;
}

function renderStats(counts) {
  statsListEl.innerHTML = '';
  const namesWithCounts = nameList.filter((name) => (counts[name] || 0) > 0);
  statsEl.classList.toggle('hidden', namesWithCounts.length === 0);
  if (namesWithCounts.length === 0) return;
  const sorted = [...namesWithCounts].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  sorted.forEach((name) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = name;
    const countSpan = document.createElement('span');
    countSpan.className = 'stats-count';
    countSpan.textContent = String(counts[name] || 0);
    li.appendChild(span);
    li.appendChild(countSpan);
    statsListEl.appendChild(li);
  });
}

function triggerConfetti() {
  confettiContainer.innerHTML = '';
  const popup = document.querySelector('.popup');
  const rect = popup ? popup.getBoundingClientRect() : document.body.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const pieceCount = 50;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const angle = (Math.PI * 2 * i) / pieceCount + Math.random() * 0.5;
    const dist = 60 + Math.random() * 80;
    
    const tx = Math.cos(angle) * dist * (Math.random() > 0.5 ? 1 : -1);
    const ty = Math.sin(angle) * dist + Math.random() * 40;
    piece.style.left = `${centerX}px`;
    piece.style.top = `${centerY}px`;
    piece.style.setProperty('--tx', `${tx}px`);
    piece.style.setProperty('--ty', `${ty}px`);
    piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = piece.style.width;
    confettiContainer.appendChild(piece);
  }
  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 2500);
}

function declareWinner(winnerName) {
  winnerHistory = [winnerName, ...winnerHistory].slice(0, HISTORY_SIZE);
  pickCounts[winnerName] = (pickCounts[winnerName] || 0) + 1;
  chrome.storage.local.set(
    { [HISTORY_KEY]: winnerHistory, [STATS_KEY]: pickCounts },
    () => {
      renderHistory(winnerHistory);
      renderStats(pickCounts);
    }
  );
  triggerConfetti();
  resultEl.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'result-label';
  label.textContent = 'Selected: ';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'winner-name';
  nameSpan.textContent = winnerName;
  function addSparkles(count) {
    const container = document.createElement('span');
    container.className = 'sparkles';
    container.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.style.setProperty('--i', i);
      container.appendChild(s);
    }
    return container;
  }
  resultEl.appendChild(label);
  resultEl.appendChild(addSparkles(4));
  resultEl.appendChild(nameSpan);
  resultEl.appendChild(addSparkles(4));
  resultEl.classList.remove('hidden');
}

function removeName(index) {
  if (isSpinning || isBattling) return;
  nameList.splice(index, 1);
  saveAndRender();
}

function addName() {
  const raw = nameInput.value.trim();
  if (!raw) return;
  const newNames = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  if (newNames.length === 0) return;
  nameList.push(...newNames);
  nameInput.value = '';
  saveAndRender();
}

function parseImportedNames(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function openImportPanel() {
  importPanel.classList.remove('hidden');
  importTextarea.value = '';
  importTextarea.focus();
}

function closeImportPanel() {
  importPanel.classList.add('hidden');
  importTextarea.value = '';
}

function applyImport() {
  const names = parseImportedNames( importTextarea.value );
  if (names.length === 0) return;
  nameList = names;
  chrome.storage.local.set({ [STORAGE_KEY]: nameList }, () => {
    renderList();
    closeImportPanel();
  });
}

function saveAndRender() {
  chrome.storage.local.set({ [STORAGE_KEY]: nameList }, () => renderList());
}

function setMode(mode) {
  currentMode = mode;
  const isSlot = mode === 'slot';
  tabSlot.setAttribute('aria-selected', isSlot ? 'true' : 'false');
  tabBattle.setAttribute('aria-selected', !isSlot ? 'true' : 'false');
  panelSlot.classList.toggle('hidden', !isSlot);
  panelBattle.classList.toggle('hidden', isSlot);
  panelBattle.setAttribute('aria-hidden', isSlot ? 'true' : 'false');
}

const BATTLE_COLORS = ['#e53935', '#ff9800', '#ffeb3b', '#43a047', '#2196f3', '#9c27b0', '#00bcd4', '#795548'];
const ARENA_WIDTH = 320;
const ARENA_HEIGHT = 200;
const FRICTION = 0.998;
const CENTER_GRAVITY = 0.04;
const DEAD_ZONE_RADIUS = 50;
const REPULSION_RADIUS = 22;
const REPULSION_STRENGTH = 0.06;
const MAX_INITIAL_SPEED = 1.2;
const BOUNCE_MULTIPLIER = 1.5;
const BATTLE_TOP_MIN_R = 10;
const BATTLE_TOP_MAX_R = 22;

function runBattle() {
  if (isBattling || nameList.length === 0) return;
  isBattling = true;
  battleBtn.disabled = true;
  resultEl.classList.add('hidden');

  const ctx = battleCanvas.getContext('2d');
  const W = ARENA_WIDTH;
  const H = ARENA_HEIGHT;
  const n = nameList.length;
  const radius = Math.max(BATTLE_TOP_MIN_R, Math.min(BATTLE_TOP_MAX_R, Math.min(W, H) / (2 * (n + 2))));

  const tops = nameList.map((name, i) => {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
    const dist = Math.min(W, H) * 0.25;
    return {
      name,
      x: W / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
      y: H / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 2 * MAX_INITIAL_SPEED,
      vy: (Math.random() - 0.5) * 2 * MAX_INITIAL_SPEED,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: (Math.random() - 0.5) * 0.3,
      radius,
      color: BATTLE_COLORS[i % BATTLE_COLORS.length],
      eliminated: false,
    };
  });

  battleLegend.innerHTML = '';
  tops.forEach((t) => {
    const item = document.createElement('span');
    item.className = 'battle-legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'battle-legend-swatch';
    swatch.style.background = t.color;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'battle-legend-name';
    nameSpan.textContent = t.name;
    item.appendChild(swatch);
    item.appendChild(nameSpan);
    battleLegend.appendChild(item);
  });

  let animationId = null;

  function eliminate(i) {
    tops[i].eliminated = true;
  }

  function drawArena() {
    const cx = W / 2;
    const cy = H / 2;
    const pad = 4;

    // Dark gradient floor (lighter in center)
    const floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    floorGrad.addColorStop(0, '#2a2a2e');
    floorGrad.addColorStop(0.5, '#1e1e22');
    floorGrad.addColorStop(1, '#141418');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, W, H);

    // Concentric ring pattern (arena circles)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let r = 40; r < Math.min(W, H) / 2 - 10; r += 28) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner "battle ring" border (gold/amber)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 72, 58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer arena edge (double line)
    ctx.strokeStyle = 'rgba(80, 80, 90, 0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
    ctx.strokeStyle = 'rgba(180, 180, 190, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 2, pad + 2, W - pad * 2 - 4, H - pad * 2 - 4);

    // Corner accents
    const cornerLen = 18;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 2;
    [[pad, pad], [W - pad, pad], [W - pad, H - pad], [pad, H - pad]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (x < cx ? cornerLen : -cornerLen), y);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (y < cy ? cornerLen : -cornerLen));
      ctx.stroke();
    });
  }

  function draw() {
    drawArena();

    tops.forEach((t) => {
      if (t.eliminated) return;
      ctx.save();
      ctx.translate(t.x, t.y);
      // Shadow under top
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(2, 3, t.radius * 0.9, t.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(t.angle);
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.rotate(-t.angle);
      const label = t.name.length > 6 ? t.name.slice(0, 5) + '\u2026' : t.name;
      ctx.font = `${Math.max(9, Math.min(12, t.radius))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(label, 0, 0);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  }

  const cx = W / 2;
  const cy = H / 2;

  function step() {
    tops.forEach((t) => {
      if (t.eliminated) return;
      const dx = cx - t.x;
      const dy = cy - t.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < REPULSION_RADIUS) {
        t.vx -= (dx / dist) * REPULSION_STRENGTH;
        t.vy -= (dy / dist) * REPULSION_STRENGTH;
      } else if (dist > DEAD_ZONE_RADIUS) {
        t.vx += (dx / dist) * CENTER_GRAVITY;
        t.vy += (dy / dist) * CENTER_GRAVITY;
      }
      t.x += t.vx;
      t.y += t.vy;
      t.vx *= FRICTION;
      t.vy *= FRICTION;
      t.angle += t.angleSpeed;
      if (t.x - t.radius < 0 || t.x + t.radius > W || t.y - t.radius < 0 || t.y + t.radius > H) {
        t.eliminated = true;
      }
    });

    for (let i = 0; i < tops.length; i++) {
      if (tops[i].eliminated) continue;
      for (let j = i + 1; j < tops.length; j++) {
        if (tops[j].eliminated) continue;
        const a = tops[i];
        const b = tops[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1e-6;
        const minDist = a.radius + b.radius;
        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          a.x -= (overlap / 2) * nx;
          a.y -= (overlap / 2) * ny;
          b.x += (overlap / 2) * nx;
          b.y += (overlap / 2) * ny;
          const v1n = a.vx * nx + a.vy * ny;
          const v2n = b.vx * nx + b.vy * ny;
          const impulse = (v2n - v1n) * BOUNCE_MULTIPLIER;
          a.vx += impulse * nx;
          a.vy += impulse * ny;
          b.vx -= impulse * nx;
          b.vy -= impulse * ny;
        }
      }
    }

    draw();
    const remaining = tops.filter((t) => !t.eliminated);
    if (remaining.length <= 1) {
      cancelAnimationFrame(animationId);
      isBattling = false;
      battleBtn.disabled = nameList.length === 0;
      const winner = remaining.length === 1 ? remaining[0] : tops[Math.floor(Math.random() * tops.length)];
      declareWinner(winner.name);
      return;
    }
    animationId = requestAnimationFrame(step);
  }

  draw();
  animationId = requestAnimationFrame(step);
}

function applyListCollapsed(collapsed) {
  if (collapsed) {
    listSection.classList.add('collapsed');
    listCollapseBtn.setAttribute('aria-expanded', 'false');
    listCollapseBtn.setAttribute('aria-label', 'Expand names list');
  } else {
    listSection.classList.remove('collapsed');
    listCollapseBtn.setAttribute('aria-expanded', 'true');
    listCollapseBtn.setAttribute('aria-label', 'Collapse names list');
  }
}

function loadAndRender() {
  chrome.storage.local.get([STORAGE_KEY, HISTORY_KEY, STATS_KEY, LIST_COLLAPSED_KEY], (data) => {
    winnerHistory = Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
    pickCounts = data[STATS_KEY] && typeof data[STATS_KEY] === 'object' ? data[STATS_KEY] : {};
    const stored = data[STORAGE_KEY];
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      nameList = [...DEFAULT_NAMES];
      chrome.storage.local.set({ [STORAGE_KEY]: nameList }, () => renderList());
    } else {
      nameList = stored;
      renderList();
    }
    applyListCollapsed(data[LIST_COLLAPSED_KEY] === true);
  });
}

function spin() {
  if (isSpinning || nameList.length === 0) return;
  isSpinning = true;
  spinBtn.disabled = true;
  leverBtn.disabled = true;
  leverBtn.classList.add('pulling');
  resultEl.classList.add('hidden');

  const n = nameList.length;
  const winnerIndex = Math.floor(Math.random() * n);
  const midRepetition = Math.floor(SCROLLER_REPEAT / 2);
  const targetItemIndex = midRepetition * n + winnerIndex;
  const finalTranslateY = targetItemIndex * SCROLLER_ITEM_HEIGHT + SCROLLER_ITEM_HEIGHT / 2 - SCROLLER_VIEWPORT_HEIGHT / 2;

  scrollerStrip.style.transition = 'none';
  scrollerStrip.style.transform = 'translateY(0)';
  scrollerStrip.offsetHeight;
  scrollerStrip.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)';
  scrollerStrip.classList.add('spinning');
  scrollerStrip.style.transform = `translateY(-${finalTranslateY}px)`;

  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = nameList.length === 0;
    leverBtn.disabled = nameList.length === 0;
    leverBtn.classList.remove('pulling');
    const winnerName = nameList[winnerIndex];
    declareWinner(winnerName);
  }, 3100);
}

addBtn.addEventListener('click', addName);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addName();
});
tabSlot.addEventListener('click', () => setMode('slot'));
tabBattle.addEventListener('click', () => setMode('battle'));
spinBtn.addEventListener('click', spin);
leverBtn.addEventListener('click', spin);
battleBtn.addEventListener('click', runBattle);
listCollapseBtn.addEventListener('click', () => {
  const isCollapsed = listSection.classList.toggle('collapsed');
  listCollapseBtn.setAttribute('aria-expanded', !isCollapsed);
  listCollapseBtn.setAttribute('aria-label', isCollapsed ? 'Expand names list' : 'Collapse names list');
  chrome.storage.local.set({ [LIST_COLLAPSED_KEY]: isCollapsed });
});
importBtn.addEventListener('click', openImportPanel);
importReplaceBtn.addEventListener('click', applyImport);
importCancelBtn.addEventListener('click', closeImportPanel);

loadAndRender();
