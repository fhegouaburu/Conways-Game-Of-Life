"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

const elements = {
  playButton: document.getElementById("playButton"),
  stepButton: document.getElementById("stepButton"),
  clearButton: document.getElementById("clearButton"),
  randomButton: document.getElementById("randomButton"),
  speedRange: document.getElementById("speedRange"),
  speedOutput: document.getElementById("speedOutput"),
  gridRange: document.getElementById("gridRange"),
  gridOutput: document.getElementById("gridOutput"),
  gridLabel: document.getElementById("gridLabel"),
  generation: document.getElementById("generation"),
  population: document.getElementById("population"),
  wrapToggle: document.getElementById("wrapToggle"),
  patternSelect: document.getElementById("patternSelect"),
  loadPatternButton: document.getElementById("loadPatternButton"),
  shareButton: document.getElementById("shareButton"),
  shareStatus: document.getElementById("shareStatus"),
};

const PATTERNS = {
  glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  blinker: [[0, 0], [1, 0], [2, 0]],
  toad: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]],
  beacon: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 2], [3, 2], [2, 3], [3, 3]],
  pulsar: [
    [2,0],[3,0],[4,0],[8,0],[9,0],[10,0],
    [0,2],[5,2],[7,2],[12,2],[0,3],[5,3],[7,3],[12,3],[0,4],[5,4],[7,4],[12,4],
    [2,5],[3,5],[4,5],[8,5],[9,5],[10,5],
    [2,7],[3,7],[4,7],[8,7],[9,7],[10,7],
    [0,8],[5,8],[7,8],[12,8],[0,9],[5,9],[7,9],[12,9],[0,10],[5,10],[7,10],[12,10],
    [2,12],[3,12],[4,12],[8,12],[9,12],[10,12]
  ],
  gosper: [
    [0,4],[0,5],[1,4],[1,5],
    [10,4],[10,5],[10,6],[11,3],[11,7],[12,2],[12,8],[13,2],[13,8],[14,5],[15,3],[15,7],[16,4],[16,5],[16,6],[17,5],
    [20,2],[20,3],[20,4],[21,2],[21,3],[21,4],[22,1],[22,5],[24,0],[24,1],[24,5],[24,6],
    [34,2],[34,3],[35,2],[35,3]
  ]
};

let columns = Number(elements.gridRange.value);
let rows = 36;
let board = createBoard(columns, rows);
let generation = 0;
let running = false;
let generationsPerSecond = Number(elements.speedRange.value);
let lastFrameTime = 0;
let accumulatedTime = 0;
let drawing = false;
let drawValue = 1;
let previousDrawnCell = null;
let cellWidth = 1;
let cellHeight = 1;

function createBoard(cols, rowCount) {
  return new Uint8Array(cols * rowCount);
}

function indexOf(x, y) {
  return y * columns + x;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  rows = Math.max(16, Math.round(columns * (rect.height / rect.width)));
  const previous = board;
  const previousColumns = Number(canvas.dataset.columns || columns);
  const previousRows = Number(canvas.dataset.rows || rows);
  const resized = createBoard(columns, rows);

  const copyWidth = Math.min(columns, previousColumns);
  const copyHeight = Math.min(rows, previousRows);
  const xOffsetNew = Math.floor((columns - copyWidth) / 2);
  const yOffsetNew = Math.floor((rows - copyHeight) / 2);
  const xOffsetOld = Math.floor((previousColumns - copyWidth) / 2);
  const yOffsetOld = Math.floor((previousRows - copyHeight) / 2);

  for (let y = 0; y < copyHeight; y += 1) {
    for (let x = 0; x < copyWidth; x += 1) {
      const oldIndex = (y + yOffsetOld) * previousColumns + (x + xOffsetOld);
      const newIndex = (y + yOffsetNew) * columns + (x + xOffsetNew);
      if (oldIndex >= 0 && oldIndex < previous.length) resized[newIndex] = previous[oldIndex];
    }
  }

  board = resized;
  canvas.dataset.columns = String(columns);
  canvas.dataset.rows = String(rows);
  cellWidth = rect.width / columns;
  cellHeight = rect.height / rows;
  updateStats();
  draw();
}

function countNeighbors(x, y) {
  let count = 0;
  const wrap = elements.wrapToggle.checked;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      let nx = x + dx;
      let ny = y + dy;

      if (wrap) {
        nx = (nx + columns) % columns;
        ny = (ny + rows) % rows;
      } else if (nx < 0 || nx >= columns || ny < 0 || ny >= rows) {
        continue;
      }

      count += board[indexOf(nx, ny)];
    }
  }
  return count;
}

function step() {
  const next = createBoard(columns, rows);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const currentIndex = indexOf(x, y);
      const neighbors = countNeighbors(x, y);
      const alive = board[currentIndex] === 1;
      next[currentIndex] = alive ? Number(neighbors === 2 || neighbors === 3) : Number(neighbors === 3);
    }
  }

  board = next;
  generation += 1;
  updateStats();
  draw();
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.fillStyle = "#090c12";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#69f0ae";
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!board[indexOf(x, y)]) continue;
      const inset = Math.max(0.7, Math.min(cellWidth, cellHeight) * 0.08);
      ctx.fillRect(
        x * cellWidth + inset,
        y * cellHeight + inset,
        Math.max(1, cellWidth - inset * 2),
        Math.max(1, cellHeight - inset * 2)
      );
    }
  }

  if (cellWidth >= 8) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(138, 158, 194, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= columns; x += 1) {
      const px = Math.round(x * cellWidth) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (let y = 0; y <= rows; y += 1) {
      const py = Math.round(y * cellHeight) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();
  }
}

function updateStats() {
  let population = 0;
  for (const cell of board) population += cell;
  elements.generation.textContent = generation.toLocaleString();
  elements.population.textContent = population.toLocaleString();
  elements.gridLabel.textContent = `${columns} × ${rows}`;
}

function setRunning(value) {
  running = value;
  elements.playButton.textContent = running ? "❚❚ Pause" : "▶ Play";
  elements.playButton.setAttribute("aria-pressed", String(running));
  accumulatedTime = 0;
}

function animationLoop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = Math.min(timestamp - lastFrameTime, 250);
  lastFrameTime = timestamp;

  if (running) {
    accumulatedTime += elapsed;
    const interval = 1000 / generationsPerSecond;
    while (accumulatedTime >= interval) {
      step();
      accumulatedTime -= interval;
    }
  }

  requestAnimationFrame(animationLoop);
}

function clearBoard() {
  board.fill(0);
  generation = 0;
  setRunning(false);
  updateStats();
  draw();
}

function randomizeBoard() {
  generation = 0;
  setRunning(false);
  for (let i = 0; i < board.length; i += 1) board[i] = Math.random() < 0.23 ? 1 : 0;
  updateStats();
  draw();
}

function loadPattern(name) {
  clearBoard();
  const pattern = PATTERNS[name];
  const maxX = Math.max(...pattern.map(([x]) => x));
  const maxY = Math.max(...pattern.map(([, y]) => y));
  const startX = Math.max(0, Math.floor((columns - maxX - 1) / 2));
  const startY = Math.max(0, Math.floor((rows - maxY - 1) / 2));

  for (const [x, y] of pattern) {
    const targetX = startX + x;
    const targetY = startY + y;
    if (targetX < columns && targetY < rows) board[indexOf(targetX, targetY)] = 1;
  }
  updateStats();
  draw();
}

function pointToCell(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / cellWidth);
  const y = Math.floor((event.clientY - rect.top) / cellHeight);
  if (x < 0 || x >= columns || y < 0 || y >= rows) return null;
  return { x, y };
}

function paintCell(event) {
  const cell = pointToCell(event);
  if (!cell) return;
  const key = `${cell.x},${cell.y}`;
  if (key === previousDrawnCell) return;
  board[indexOf(cell.x, cell.y)] = drawValue;
  previousDrawnCell = key;
  generation = 0;
  updateStats();
  draw();
}

function encodeBoard() {
  const liveCells = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i]) liveCells.push(i.toString(36));
  }
  return `${columns}x${rows}:${liveCells.join(".")}`;
}

function decodeBoard(value) {
  const match = value.match(/^(\d+)x(\d+):(.*)$/);
  if (!match) return false;
  const decodedColumns = Number(match[1]);
  const decodedRows = Number(match[2]);
  if (decodedColumns < 10 || decodedColumns > 150 || decodedRows < 10 || decodedRows > 150) return false;

  columns = decodedColumns;
  rows = decodedRows;
  elements.gridRange.value = String(Math.min(100, Math.max(20, Math.round(columns / 5) * 5)));
  elements.gridOutput.textContent = `${columns} cells`;
  board = createBoard(columns, rows);

  if (match[3]) {
    for (const token of match[3].split(".")) {
      const position = parseInt(token, 36);
      if (Number.isInteger(position) && position >= 0 && position < board.length) board[position] = 1;
    }
  }

  canvas.dataset.columns = String(columns);
  canvas.dataset.rows = String(rows);
  generation = 0;
  updateStats();
  draw();
  return true;
}

async function copyShareLink() {
  const url = new URL(window.location.href);
  url.hash = encodeBoard();
  const text = url.toString();

  try {
    await navigator.clipboard.writeText(text);
    elements.shareStatus.textContent = "Link copied. Anyone opening it will see this board.";
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    elements.shareStatus.textContent = "Link copied. Anyone opening it will see this board.";
  }

  window.setTimeout(() => { elements.shareStatus.textContent = ""; }, 4000);
}

elements.playButton.addEventListener("click", () => setRunning(!running));
elements.stepButton.addEventListener("click", () => { setRunning(false); step(); });
elements.clearButton.addEventListener("click", clearBoard);
elements.randomButton.addEventListener("click", randomizeBoard);
elements.loadPatternButton.addEventListener("click", () => loadPattern(elements.patternSelect.value));
elements.shareButton.addEventListener("click", copyShareLink);

elements.speedRange.addEventListener("input", () => {
  generationsPerSecond = Number(elements.speedRange.value);
  elements.speedOutput.textContent = `${generationsPerSecond} generation${generationsPerSecond === 1 ? "" : "s"}/sec`;
});

elements.gridRange.addEventListener("input", () => {
  elements.gridOutput.textContent = `${elements.gridRange.value} cells`;
});

elements.gridRange.addEventListener("change", () => {
  columns = Number(elements.gridRange.value);
  generation = 0;
  canvas.dataset.columns = String(columns);
  canvas.dataset.rows = String(rows);
  board = createBoard(columns, rows);
  resizeCanvas();
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  drawing = true;
  previousDrawnCell = null;
  const cell = pointToCell(event);
  if (!cell) return;
  drawValue = event.button === 2 || event.shiftKey ? 0 : Number(!board[indexOf(cell.x, cell.y)]);
  paintCell(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (!drawing) return;
  event.preventDefault();
  paintCell(event);
});

function stopDrawing() {
  drawing = false;
  previousDrawnCell = null;
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !["INPUT", "SELECT", "BUTTON"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    setRunning(!running);
  }
  if (event.key.toLowerCase() === "c" && !["INPUT", "SELECT"].includes(document.activeElement.tagName)) clearBoard();
});

new ResizeObserver(resizeCanvas).observe(canvas);

let loadedSharedBoard = false;
if (window.location.hash.length > 1) {
  try {
    loadedSharedBoard = decodeBoard(decodeURIComponent(window.location.hash.slice(1)));
  } catch {
    // Ignore invalid shared links.
  }
}

if (!loadedSharedBoard) loadPattern("glider");
requestAnimationFrame(animationLoop);
