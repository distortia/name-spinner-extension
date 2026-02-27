const DEFAULT_NAMES = [];

const STORAGE_KEY = 'nameList';
const HISTORY_KEY = 'winnerHistory';
const STATS_KEY = 'pickCounts';
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

let nameList = [];
let winnerHistory = [];
let pickCounts = {};
let isSpinning = false;

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

function removeName(index) {
  if (isSpinning) return;
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

function loadAndRender() {
  chrome.storage.local.get([STORAGE_KEY, HISTORY_KEY, STATS_KEY], (data) => {
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
  }, 3100);
}

addBtn.addEventListener('click', addName);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addName();
});
spinBtn.addEventListener('click', spin);
leverBtn.addEventListener('click', spin);
importBtn.addEventListener('click', openImportPanel);
importReplaceBtn.addEventListener('click', applyImport);
importCancelBtn.addEventListener('click', closeImportPanel);

loadAndRender();
