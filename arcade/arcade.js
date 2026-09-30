(() => {
  "use strict";

  const {
    Engine,
    Bodies,
    Body,
    Composite,
    Events,
    Vector
  } = Matter;

  /* ==========================================================
     CONFIGURATION
     ========================================================== */

  const WORLD_WIDTH = 360;
  const WORLD_HEIGHT = 600;
  const WALL_THICKNESS = 24;
  const DANGER_Y = 116;
  const DROP_COOLDOWN = 650;
  const DANGER_SETTLE_DURATION = 2000;
  const POINTER_MOVE_THRESHOLD = 8;
  const USERNAME_STORAGE_KEY = "meicatArcadeUsername";
  const MAX_NATURAL_LEVEL = 5;
  const MAX_LEVEL = 11;

  const PIECES = [
    { level: 1, radius: 16, score: 2, fill: "#ef9cba", image: null },
    { level: 2, radius: 22, score: 5, fill: "#eaa1df", image: null },
    { level: 3, radius: 29, score: 10, fill: "#c79ee8", image: null },
    { level: 4, radius: 37, score: 18, fill: "#9f9ee8", image: null },
    { level: 5, radius: 46, score: 30, fill: "#8ebde3", image: null },
    { level: 6, radius: 57, score: 48, fill: "#83d0cf", image: null },
    { level: 7, radius: 69, score: 75, fill: "#91d38e", image: null },
    { level: 8, radius: 82, score: 112, fill: "#c8d77c", image: null },
    { level: 9, radius: 96, score: 165, fill: "#f0c878", image: null },
    { level: 10, radius: 111, score: 240, fill: "#efa36f", image: null },
    { level: 11, radius: 127, score: 350, fill: "#e98986", image: null }
  ];

  /* ==========================================================
     DOM AND STATE
     ========================================================== */

  const canvas = document.getElementById("gameCanvas");
  const context = canvas.getContext("2d");
  const scoreValue = document.getElementById("scoreValue");
  const finalScore = document.getElementById("finalScore");
  const nextPreview = document.getElementById("nextPreview");
  const gameOverOverlay = document.getElementById("gameOver");
  const tryAgainButton = document.getElementById("tryAgain");
  const gameStatus = document.getElementById("gameStatus");
  const usernameGate = document.getElementById("usernameGate");
  const usernameForm = document.getElementById("usernameForm");
  const usernameInput = document.getElementById("usernameInput");
  const usernameError = document.getElementById("usernameError");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const changeUsernameButton = document.getElementById("changeUsername");
  const devButtons = document.querySelectorAll("[data-spawn-level], [data-clear-board]");

  const engine = Engine.create({
    enableSleeping: true
  });

  engine.gravity.y = 1;
  engine.gravity.scale = 0.0013;

  const pieces = new Map();
  const dangerTimers = new Map();
  const popAnimations = new Map();

  let currentPiece = null;
  let nextLevel = 1;
  let score = 0;
  let gameOver = false;
  let dropLocked = false;
  let pointerIsDown = false;
  let pointerDragged = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let activePointerId = null;
  let aimX = WORLD_WIDTH / 2;
  let gameplayStarted = false;
  let currentUsername = "";

  /* ==========================================================
     USERNAME STATE
     ========================================================== */

  function normalizeUsername(value) {
    return value.trim().replace(/^@+/, "");
  }

  function validateUsername(value) {
    const normalized = normalizeUsername(value);

    if (!normalized) {
      return "Enter your ZEPETO username.";
    }

    if (/\s/.test(normalized)) {
      return "Usernames cannot contain spaces.";
    }

    return "";
  }

  function isValidUsername(value) {
    return validateUsername(value) === "";
  }

  function saveUsername(username) {
    try {
      window.localStorage.setItem(
        USERNAME_STORAGE_KEY,
        username
      );
    } catch (error) {
      // Private browsing may block storage; gameplay can continue.
    }
  }

  function readSavedUsername() {
    try {
      const saved = window.localStorage.getItem(
        USERNAME_STORAGE_KEY
      );

      return saved && isValidUsername(saved)
        ? normalizeUsername(saved)
        : "";
    } catch (error) {
      return "";
    }
  }

  function updateUsernameDisplay() {
    usernameDisplay.textContent = `@${currentUsername}`;
  }

  function setGameplayAccess(enabled) {
    gameplayStarted = enabled;
    devButtons.forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function openUsernameGate() {
    setGameplayAccess(false);
    usernameGate.classList.add("is-open");
    usernameGate.setAttribute("aria-hidden", "false");
    usernameInput.value = currentUsername ? `@${currentUsername}` : "";
    usernameError.textContent = "";
    window.requestAnimationFrame(() => usernameInput.focus());
  }

  function acceptUsername(value) {
    const error = validateUsername(value);

    if (error) {
      usernameError.textContent = error;
      usernameInput.focus();
      return false;
    }

    currentUsername = normalizeUsername(value);
    saveUsername(currentUsername);
    updateUsernameDisplay();
    usernameGate.classList.remove("is-open");
    usernameGate.setAttribute("aria-hidden", "true");
    setGameplayAccess(true);
    gameStatus.textContent = "Move, then tap or click to drop.";
    canvas.focus({ preventScroll: true });
    return true;
  }

  /* ==========================================================
     MATTER WORLD
     ========================================================== */

  const wallOptions = {
    isStatic: true,
    label: "arcade-wall",
    restitution: 0.2,
    friction: 0.7
  };

  const walls = [
    Bodies.rectangle(-WALL_THICKNESS / 2, WORLD_HEIGHT / 2, WALL_THICKNESS, WORLD_HEIGHT, wallOptions),
    Bodies.rectangle(WORLD_WIDTH + WALL_THICKNESS / 2, WORLD_HEIGHT / 2, WALL_THICKNESS, WORLD_HEIGHT, wallOptions),
    Bodies.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT + WALL_THICKNESS / 2, WORLD_WIDTH, WALL_THICKNESS, wallOptions)
  ];

  Composite.add(engine.world, walls);

  function pieceDefinition(level) {
    return PIECES[level - 1];
  }

  function randomNaturalLevel() {
    return 1 + Math.floor(Math.random() * MAX_NATURAL_LEVEL);
  }

  function createPiece(level, x, y, inheritedVelocity = null) {
    const definition = pieceDefinition(level);
    const body = Bodies.circle(x, y, definition.radius, {
      label: `arcade-piece-${level}`,
      restitution: 0.22,
      friction: 0.55,
      frictionAir: 0.012,
      density: 0.0012,
      slop: 0.04
    });

    body.plugin.arcade = {
      level,
      dropped: true
    };

    if (inheritedVelocity) {
      Body.setVelocity(body, {
        x: inheritedVelocity.x * 0.72,
        y: Math.min(inheritedVelocity.y * 0.55, 8)
      });
    }

    pieces.set(body.id, body);
    Composite.add(engine.world, body);
    popAnimations.set(body.id, performance.now());
    return body;
  }

  function removePiece(body) {
    pieces.delete(body.id);
    dangerTimers.delete(body.id);
    popAnimations.delete(body.id);
    Composite.remove(engine.world, body);
  }

  /* ==========================================================
     CONTROLLED DROP PIECE
     ========================================================== */

  function setCurrentPiece(level) {
    currentPiece = {
      level,
      x: aimX
    };
    updateNextPreview();
  }

  function currentRadius() {
    return currentPiece ? pieceDefinition(currentPiece.level).radius : 0;
  }

  function clampAim(x) {
    const radius = currentRadius();
    return Math.max(radius + 2, Math.min(WORLD_WIDTH - radius - 2, x));
  }

  function setAimFromPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / bounds.width;
    const pointerX = (event.clientX - bounds.left) * scaleX;
    aimX = clampAim(pointerX);

    if (currentPiece) {
      currentPiece.x = aimX;
    }
  }

  function dropCurrentPiece() {
    if (!gameplayStarted || !currentPiece || dropLocked || gameOver) {
      return;
    }

    dropLocked = true;
    const level = currentPiece.level;
    const radius = pieceDefinition(level).radius;
    createPiece(level, clampAim(currentPiece.x), radius + 5);
    currentPiece = null;
    gameStatus.textContent = "Piece dropped. Get ready...";

    window.setTimeout(() => {
      if (gameOver) {
        return;
      }

      setCurrentPiece(nextLevel);
      nextLevel = randomNaturalLevel();
      updateNextPreview();
      dropLocked = false;
      gameStatus.textContent = "Move, then tap or click to drop.";
    }, DROP_COOLDOWN);
  }

  /* ==========================================================
     INPUT
     ========================================================== */

  canvas.tabIndex = 0;

  canvas.addEventListener("pointermove", (event) => {
    if (!gameplayStarted) {
      return;
    }

    setAimFromPointer(event);

    if (
      pointerIsDown &&
      activePointerId === event.pointerId &&
      Math.hypot(
        event.clientX - pointerStartX,
        event.clientY - pointerStartY
      ) > POINTER_MOVE_THRESHOLD
    ) {
      pointerDragged = true;
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!gameplayStarted || dropLocked || gameOver) {
      return;
    }

    pointerIsDown = true;
    pointerDragged = false;
    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
    setAimFromPointer(event);
    event.preventDefault();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!gameplayStarted || activePointerId !== event.pointerId) {
      return;
    }

    setAimFromPointer(event);
    if (pointerIsDown) {
      dropCurrentPiece();
    }
    pointerIsDown = false;
    pointerDragged = false;
    activePointerId = null;
    event.preventDefault();
  });

  canvas.addEventListener("pointercancel", (event) => {
    pointerIsDown = false;
    pointerDragged = false;
    activePointerId = null;
    canvas.releasePointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("lostpointercapture", () => {
    pointerIsDown = false;
    pointerDragged = false;
    activePointerId = null;
  });

  /* ==========================================================
     MERGE HANDLING
     ========================================================== */

  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const first = pieces.get(pair.bodyA.id);
      const second = pieces.get(pair.bodyB.id);

      if (!first || !second) {
        return;
      }

      const firstLevel = first.plugin.arcade.level;
      const secondLevel = second.plugin.arcade.level;

      if (
        firstLevel !== secondLevel ||
        firstLevel >= MAX_LEVEL ||
        first.plugin.arcade.merging ||
        second.plugin.arcade.merging
      ) {
        return;
      }

      first.plugin.arcade.merging = true;
      second.plugin.arcade.merging = true;

      const midpoint = Vector.create(
        (first.position.x + second.position.x) / 2,
        (first.position.y + second.position.y) / 2
      );
      const inheritedVelocity = Vector.create(
        (first.velocity.x + second.velocity.x) / 2,
        (first.velocity.y + second.velocity.y) / 2
      );

      removePiece(first);
      removePiece(second);

      const merged = createPiece(
        firstLevel + 1,
        midpoint.x,
        midpoint.y,
        inheritedVelocity
      );

      score += pieceDefinition(firstLevel + 1).score;
      updateScore();
      popAnimations.set(merged.id, performance.now());
    });
  });

  /* ==========================================================
     DANGER LINE / GAME OVER
     ========================================================== */

  function updateDangerTimers(now) {
    pieces.forEach((body) => {
      const definition = pieceDefinition(body.plugin.arcade.level);
      const aboveLine = body.position.y - definition.radius < DANGER_Y;
      const speed = Vector.magnitude(body.velocity);
      const settled = speed < 0.42 && Math.abs(body.angularVelocity) < 0.04;

      if (aboveLine && settled) {
        if (!dangerTimers.has(body.id)) {
          dangerTimers.set(body.id, now);
        } else if (now - dangerTimers.get(body.id) >= DANGER_SETTLE_DURATION) {
          endGame();
        }
      } else {
        dangerTimers.delete(body.id);
      }
    });
  }

  function endGame() {
    if (gameOver) {
      return;
    }

    gameOver = true;
    currentPiece = null;
    finalScore.textContent = String(score);
    gameOverOverlay.hidden = false;
    gameStatus.textContent = "Board full. Start a new game to play again.";
  }

  /* ==========================================================
     SCORE / RESET
     ========================================================== */

  function updateScore() {
    scoreValue.textContent = String(score);
  }

  function updateNextPreview() {
    const definition = pieceDefinition(nextLevel);
    nextPreview.textContent = String(nextLevel);
    nextPreview.style.background = definition.fill;
    nextPreview.style.borderColor = "rgba(255, 255, 255, .9)";
  }

  function clearBoard() {
    pieces.forEach((body) => {
      Composite.remove(engine.world, body);
    });
    pieces.clear();
    dangerTimers.clear();
    popAnimations.clear();
  }

  function resetGame() {
    clearBoard();
    score = 0;
    gameOver = false;
    dropLocked = false;
    pointerIsDown = false;
    aimX = WORLD_WIDTH / 2;
    nextLevel = randomNaturalLevel();
    gameOverOverlay.hidden = true;
    updateScore();
    setCurrentPiece(randomNaturalLevel());
    gameStatus.textContent = "Move, then tap or click to drop.";
  }

  tryAgainButton.addEventListener("click", resetGame);

  document.querySelectorAll("[data-spawn-level]").forEach((button) => {
    button.addEventListener("click", () => {
      if (gameOver) {
        return;
      }

      const level = Number(button.dataset.spawnLevel);
      const radius = pieceDefinition(level).radius;
      const minX = radius + 4;
      const maxX = WORLD_WIDTH - radius - 4;
      const x = minX + Math.random() * Math.max(0, maxX - minX);
      createPiece(level, x, radius + 8);
    });
  });

  document.querySelector("[data-clear-board]").addEventListener("click", clearBoard);

  usernameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    acceptUsername(usernameInput.value);
  });

  changeUsernameButton.addEventListener("click", openUsernameGate);

  /* ==========================================================
     RENDERING
     ========================================================== */

  function drawPiece(body, now) {
    const level = body.plugin.arcade.level;
    const definition = pieceDefinition(level);
    const age = now - (popAnimations.get(body.id) || now);
    const pop = age < 180 ? 1 + 0.09 * (1 - age / 180) : 1;
    const radius = definition.radius * pop;

    context.save();
    context.translate(body.position.x, body.position.y);
    context.rotate(body.angle);

    const gradient = context.createRadialGradient(
      -radius * 0.34,
      -radius * 0.38,
      radius * 0.12,
      0,
      0,
      radius
    );
    gradient.addColorStop(0, "rgba(255,255,255,.72)");
    gradient.addColorStop(.18, definition.fill);
    gradient.addColorStop(1, "rgba(72,42,74,.35)");

    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,255,255,.78)";
    context.stroke();

    context.fillStyle = "rgba(255,255,255,.94)";
    context.font = `900 ${Math.max(11, radius * .72)}px ui-sans-serif, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(level), 0, 1);
    context.restore();
  }

  function drawControlledPiece() {
    if (!currentPiece || gameOver) {
      return;
    }

    const definition = pieceDefinition(currentPiece.level);
    const x = clampAim(currentPiece.x);
    const y = definition.radius + 7;

    context.save();
    context.globalAlpha = 0.78;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(x, y + definition.radius + 8);
    context.lineTo(x, WORLD_HEIGHT);
    context.strokeStyle = "rgba(255,255,255,.28)";
    context.stroke();
    context.setLineDash([]);
    context.restore();

    const fakeBody = {
      angle: 0,
      plugin: { arcade: { level: currentPiece.level } },
      position: { x, y }
    };
    drawPiece(fakeBody, performance.now());
  }

  function render(now) {
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const background = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    background.addColorStop(0, "#4a285e");
    background.addColorStop(.48, "#3b244f");
    background.addColorStop(1, "#241b36");
    context.fillStyle = background;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    context.fillStyle = "rgba(255,255,255,.035)";
    context.fillRect(0, DANGER_Y, WORLD_WIDTH, 2);
    context.strokeStyle = "rgba(255,184,157,.82)";
    context.setLineDash([8, 7]);
    context.beginPath();
    context.moveTo(0, DANGER_Y);
    context.lineTo(WORLD_WIDTH, DANGER_Y);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "rgba(255,223,210,.72)";
    context.font = "700 9px ui-sans-serif, sans-serif";
    context.fillText("DANGER", 12, DANGER_Y - 8);

    pieces.forEach((body) => drawPiece(body, now));
    drawControlledPiece();
  }

  let previousTime = performance.now();

  function frame(now) {
    const delta = Math.min(now - previousTime, 34);
    previousTime = now;

    if (!gameOver && gameplayStarted) {
      Engine.update(engine, delta);
      updateDangerTimers(now);
    }

    render(now);
    window.requestAnimationFrame(frame);
  }

  resetGame();

  currentUsername = readSavedUsername();
  updateUsernameDisplay();

  if (currentUsername) {
    setGameplayAccess(true);
    gameStatus.textContent = "Move, then tap or click to drop.";
  } else {
    openUsernameGate();
  }

  window.requestAnimationFrame(frame);
})();
