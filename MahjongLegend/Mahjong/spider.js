const mahjongSymbols = [
  "🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏",
  "🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘", "🀙", "🀚", "🀛"
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

const spiderLayout = [
  ...grid(3, 7, 3, 7, 0),
  ...grid(2, 8, 4, 6, 0),

  ...grid(4, 6, 4, 6, 1),
  ...grid(3, 7, 5, 5, 1),

  ...grid(4, 6, 4, 6, 2),
  { x: 5, y: 5, z: 2 },

  ...grid(4, 6, 4, 5, 3),

  { x: 5, y: 4, z: 4 },

  ...grid(4, 6, 1, 2, 0),
  { x: 5, y: 1, z: 1 },
  { x: 4, y: 0, z: 0 },
  { x: 6, y: 0, z: 0 },

  { x: 2, y: 2, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 0, y: 3, z: 0 },
  { x: 0, y: 4, z: 0 }, { x: 1, y: 5, z: 0 },

  { x: 2, y: 8, z: 0 }, { x: 1, y: 8, z: 0 }, { x: 0, y: 7, z: 0 },
  { x: 0, y: 6, z: 0 }, { x: 1, y: 5, z: 0 },

  { x: 8, y: 2, z: 0 }, { x: 9, y: 2, z: 0 }, { x: 10, y: 3, z: 0 },
  { x: 10, y: 4, z: 0 }, { x: 9, y: 5, z: 0 },

  { x: 8, y: 8, z: 0 }, { x: 9, y: 8, z: 0 }, { x: 10, y: 7, z: 0 },
  { x: 10, y: 6, z: 0 }, { x: 9, y: 5, z: 0 },

  { x: 3, y: 2, z: 0 }, { x: 7, y: 2, z: 0 }, { x: 3, y: 8, z: 0 },
  { x: 7, y: 8, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 8, y: 3, z: 0 },
  { x: 2, y: 7, z: 0 }, { x: 8, y: 7, z: 0 },

  { x: 4, y: 3, z: 1 }, { x: 6, y: 3, z: 1 },
  { x: 4, y: 7, z: 1 }, { x: 6, y: 7, z: 1 },
  { x: 3, y: 4, z: 1 }, { x: 3, y: 6, z: 1 },
  { x: 7, y: 4, z: 1 }, { x: 7, y: 6, z: 1 },
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
  tile.innerText = symbol;

  const offsetX = pos.x * (tileWidth + tileSpacing) - pos.z * layerOffset;
  const offsetY = pos.y * (tileHeight * 0.6) - pos.z * layerOffset;

  tile.style.left = offsetX + "px";
  tile.style.top = offsetY + "px";
  tile.style.zIndex = 10 + pos.z;

  const tileObj = {
    element: tile,
    symbol,
    ...pos,
    removed: false
  };

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

  for (const pos of spiderLayout) {
    if (!layerMap[pos.z]) layerMap[pos.z] = [];
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
      const symbol = mahjongSymbols[i % mahjongSymbols.length];
      symbols.push(symbol, symbol);
    }

    shuffle(symbols);

    for (let i = 0; i < layerTiles.length; i++) {
      createTile(symbols[i], layerTiles[i]);
    }

    tilesRemaining += layerTiles.length;
  }

  document.getElementById("tile-count").textContent = tilesRemaining;
  startTimer();

  setTimeout(() => {
    useHint();
    const hasHint = document.querySelector(".hint");
    if (!hasHint) refreshGame();
  }, 100);
}

function onTileClick(tileObj) {
  if (tileObj.removed || !isTileFree(tileObj)) return;

  tileObj.element.classList.toggle("selected");

  const index = selectedTiles.indexOf(tileObj);
  if (index > -1) {
    selectedTiles.splice(index, 1);
    return;
  }

  selectedTiles.push(tileObj);

  if (selectedTiles.length === 2) {
    const [t1, t2] = selectedTiles;
    if (t1.symbol === t2.symbol) {
      t1.element.classList.add("hidden");
      t2.element.classList.add("hidden");
      t1.removed = true;
      t2.removed = true;

      tilesRemaining -= 2;
      document.getElementById("tile-count").textContent = tilesRemaining;
    }

    t1.element.classList.remove("selected");
    t2.element.classList.remove("selected");
    selectedTiles.length = 0;

    if (tilesRemaining === 0) {
      clearInterval(timerInterval);
      showGameOver();
    }
  }
}

function isTileFree(tile) {
  const hasAbove = tiles.some(t =>
    !t.removed &&
    t.z > tile.z &&
    Math.abs(t.x - tile.x) <= 1 &&
    Math.abs(t.y - tile.y) <= 1
  );
  if (hasAbove) return false;

  const leftBlocked = tiles.some(t =>
    !t.removed && t.z === tile.z && t.y === tile.y && t.x === tile.x - 2
  );
  const rightBlocked = tiles.some(t =>
    !t.removed && t.z === tile.z && t.y === tile.y && t.x === tile.x + 2
  );

  return !(leftBlocked && rightBlocked);
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

  const gameOverBox = document.getElementById("game-over-text");
  if (gameOverBox) gameOverBox.remove();

  generateBoard();
}

function useHint() {
  if (hintCount >= maxHints) return;

  tiles.forEach(t => t.element.classList.remove("hint"));

  const freeTiles = tiles.filter(t => !t.removed && isTileFree(t));

  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      if (freeTiles[i].symbol === freeTiles[j].symbol) {
        freeTiles[i].element.classList.add("hint");
        freeTiles[j].element.classList.add("hint");

        hintCount++;

        if (hintCount >= maxHints) disableHelp();
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
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function showGameOver() {
  if (document.getElementById("game-over-text")) return;

  const gameOverText = document.createElement("div");
  gameOverText.id = "game-over-text";
  gameOverText.innerHTML = `Perfect Matching<br>Time: ${document.getElementById("timer").textContent}`;
  document.body.appendChild(gameOverText);
}

function toggleMenu() {
  if (gamePaused) return;
  clearInterval(timerInterval);
  savedTime = Date.now() - startTime;
  document.getElementById("menu-overlay").classList.remove("hidden");
  gamePaused = true;

  const gameOverBox = document.getElementById("game-over-text");
  if (gameOverBox) gameOverBox.remove();
}

function resumeGame() {
  document.getElementById("menu-overlay").classList.add("hidden");
  startTime = Date.now() - savedTime;
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
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

window.onload = generateBoard;
