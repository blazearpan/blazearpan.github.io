const mahjongSymbols = [
  "tile 1.png", "tile 2.png", "tile 3.png", "tile 4.png",
  "tile 5.png", "tile 6.png", "tile 7.png", "tile 8.png",
  "tile 9.png", "tile 10.png", "tile 11.png", "tile 12.png",
  "tile 13.png", "tile 14.png", "tile 15.png", "tile 16.png"
];

const tileWidth = 60;
const tileHeight = 80;
const tileSpacing = 6;
const layerOffset = 4;
const selectedTiles = [];

let tiles = [];
let tilesRemaining = 0;
let timerInterval;
let startTime;
let hintCount = 0;
const maxHints = 3;

const pagodaLayout = [
  ...grid(0, 10, 5, 5, 0),
  ...grid(1, 9, 4, 4, 0),
  ...grid(2, 8, 3, 3, 0),
  ...grid(3, 7, 4, 4, 1),
  ...grid(4, 6, 3, 3, 1),
  { x: 5, y: 2, z: 1 },
  { x: 5, y: 5, z: 1 },
  ...grid(4, 6, 4, 4, 2),
  { x: 5, y: 3, z: 2 },
  { x: 5, y: 4, z: 3 }
];

function grid(x1, x2, y1, y2, z) {
  const arr = [];
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      arr.push({ x, y, z });
    }
  }
  return arr;
}

function createTile(symbol, pos) {
  const tile = document.createElement("div");
  tile.classList.add("tile");

  const img = document.createElement("img");
  img.src = symbol;
  img.alt = "Mahjong Tile";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  tile.appendChild(img);

  const offsetX = pos.x * (tileWidth + tileSpacing) - pos.z * layerOffset;
  const offsetY = pos.y * (tileHeight * 0.6) - pos.z * layerOffset;

  tile.style.left = offsetX + "px";
  tile.style.top = offsetY + "px";
  tile.style.zIndex = 10 + pos.z;
  tile.style.border = pos.z === 0 ? "2px solid #aaa"
                      : pos.z === 1 ? "2px solid #00f"
                      : "1px solid #000";

  const tileObj = { element: tile, symbol, ...pos, removed: false };
  tile.addEventListener("click", () => onTileClick(tileObj));
  document.getElementById("mahjong-container").appendChild(tile);
  tiles.push(tileObj);
}

function generateBoard() {
  document.getElementById("mahjong-container").innerHTML = "";
  tiles = [];
  selectedTiles.length = 0;
  hintCount = 0;
  enableHelp();

  const layerMap = {};
  tilesRemaining = 0;
  document.getElementById("tile-count").textContent = 0;

  for (const pos of pagodaLayout) {
    layerMap[pos.z] = layerMap[pos.z] || [];
    layerMap[pos.z].push(pos);
  }

  for (const z in layerMap) {
    let layerTiles = layerMap[z];
    if (layerTiles.length % 2 !== 0) {
      shuffle(layerTiles);
      layerTiles.pop();
    }
    shuffle(layerTiles);

    const symbols = [];
    for (let i = 0; i < layerTiles.length / 2; i++) {
      const sym = mahjongSymbols[i % mahjongSymbols.length];
      symbols.push(sym, sym);
    }
    shuffle(symbols);

    layerTiles.forEach((p, i) => createTile(symbols[i], p));
    tilesRemaining += layerTiles.length;
  }

  document.getElementById("tile-count").textContent = tilesRemaining;
  startTimer();

  setTimeout(() => {
    useHint();
    if (!document.querySelector(".hint")) refreshGame();
  }, 100);
}

function onTileClick(tileObj) {
  if (tileObj.removed || !isTileFree(tileObj)) return;
  tileObj.element.classList.toggle("selected");

  const idx = selectedTiles.indexOf(tileObj);
  if (idx > -1) {
    selectedTiles.splice(idx, 1);
    return;
  }

  selectedTiles.push(tileObj);

  if (selectedTiles.length === 2) {
    const [t1, t2] = selectedTiles;
    if (t1.symbol === t2.symbol) {
      [t1, t2].forEach(t => {
        t.element.classList.add("hidden");
        t.removed = true;
      });
      tilesRemaining -= 2;
      document.getElementById("tile-count").textContent = tilesRemaining;
    }
    [t1.element, t2.element].forEach(el => el.classList.remove("selected"));
    selectedTiles.length = 0;
  }

  if (tilesRemaining === 0) {
    clearInterval(timerInterval);
    showGameOver();
  }
}

function isTileFree(tile) {
  const hasAbove = tiles.some(t =>
    !t.removed && t.z > tile.z &&
    Math.abs(t.x - tile.x) <= 1 && Math.abs(t.y - tile.y) <= 1
  );
  if (hasAbove) return false;

  const lb = tiles.some(t =>
    !t.removed && t.z === tile.z && t.y === tile.y && t.x === tile.x - 2
  );
  const rb = tiles.some(t =>
    !t.removed && t.z === tile.z && t.y === tile.y && t.x === tile.x + 2
  );
  return !(lb && rb);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function refreshGame() {
  document.getElementById("mahjong-container").innerHTML = "";
  tiles = [];
  selectedTiles.length = 0;
  hintCount = 0;
  enableHelp();
  const gob = document.getElementById("game-over-text");
  if (gob) gob.remove();
  generateBoard();
}

function useHint() {
  if (hintCount >= maxHints) return;
  tiles.forEach(t => t.element.classList.remove("hint"));

  const freeTiles = tiles.filter(t => !t.removed && isTileFree(t));
  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      if (freeTiles[i].symbol === freeTiles[j].symbol) {
        [freeTiles[i], freeTiles[j]].forEach(t => t.element.classList.add("hint"));
        hintCount++;
        const helpIcon = document.getElementById("help-icon");
        const helpBtn = document.getElementById("help-btn");
        if (hintCount >= maxHints) {
          helpIcon.src = "crossed brain light.png";
          helpBtn.style.pointerEvents = "none";
          helpBtn.style.opacity = "0.5";
        } else {
          helpIcon.src = "brain light.png";
        }
        return;
      }
    }
  }
}

function disableHelp() {
  const helpIcon = document.getElementById("help-icon");
  const helpBtn = document.getElementById("help-btn");
  helpIcon.src = "crossed brain light.png";
  helpBtn.style.pointerEvents = "none";
  helpBtn.style.opacity = "0.5";
}

function enableHelp() {
  const helpIcon = document.getElementById("help-icon");
  const helpBtn = document.getElementById("help-btn");
  helpIcon.src = "brain light.png";
  helpBtn.style.pointerEvents = "auto";
  helpBtn.style.opacity = "1";
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${m}:${s}`;
  }, 1000);
}

function showGameOver() {
  if (document.getElementById("game-over-text")) return;
  const div = document.createElement("div");
  div.id = "game-over-text";
  div.innerHTML = `Perfect Matching<br>Time: ${document.getElementById("timer").textContent}`;
  document.body.appendChild(div);
}

window.onload = generateBoard;

let gamePaused = false;
let savedTime = 0;

function toggleMenu() {
  if (gamePaused) return;
  clearInterval(timerInterval);
  savedTime = Date.now() - startTime;
  document.getElementById("menu-overlay").classList.remove("hidden");
  gamePaused = true;
  const gob = document.getElementById("game-over-text");
  if (gob) gob.remove();
}

function resumeGame() {
  document.getElementById("menu-overlay").classList.add("hidden");
  startTime = Date.now() - savedTime;
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${m}:${s}`;
  }, 1000);
  gamePaused = false;
}

document.getElementById("new-game-btn").addEventListener("click", () => {
  document.getElementById("menu-overlay").classList.add("hidden");
  clearInterval(timerInterval);
  gamePaused = false;
  savedTime = 0;
  refreshGame();
});

window.addEventListener('click', () => {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
});
