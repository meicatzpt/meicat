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
  const SUPABASE_URL = "https://cldpinzembpfsulkombx.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2Z9IaBHJolcfAoHwZMiUJQ_jg-aSDON";
  const SUBMIT_GAME_ENDPOINT =
    `${SUPABASE_URL}/functions/v1/submit-arcade-game`;
  const GET_PLAYER_ENDPOINT =
    `${SUPABASE_URL}/functions/v1/get-arcade-player`;
  const PURCHASE_REWARD_ENDPOINT =
    `${SUPABASE_URL}/functions/v1/purchase-arcade-reward`;
  const REDEEM_REWARD_ENDPOINT =
    `${SUPABASE_URL}/functions/v1/redeem-arcade-reward`;

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
  const leaderboardList = document.getElementById("leaderboardList");
  const leaderboardStatus = document.getElementById("leaderboardStatus");
  const submissionStatus = document.getElementById("submissionStatus");
  const resultTotals = document.getElementById("resultTotals");
  const usernameGate = document.getElementById("usernameGate");
  const usernameForm = document.getElementById("usernameForm");
  const usernameInput = document.getElementById("usernameInput");
  const usernameError = document.getElementById("usernameError");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const changeUsernameButton = document.getElementById("changeUsername");
  const headerMeiowPoints = document.getElementById("headerMeiowPoints");
  const openShopButton = document.getElementById("openShop");
  const shopOverlay = document.getElementById("shopOverlay");
  const closeShopButton = document.getElementById("closeShop");
  const shopBackdrop = shopOverlay.querySelector(".shop-overlay__backdrop");
  const shopMeiowPoints = document.getElementById("shopMeiowPoints");
  const shopCatalogHeader = document.getElementById("shopCatalogHeader");
  const shopStatus = document.getElementById("shopStatus");
  const shopRewards = document.getElementById("shopRewards");
  const shopCatalog = document.getElementById("shopCatalog");
  const shopConfirmation = document.getElementById("shopConfirmation");
  const shopSuccess = document.getElementById("shopSuccess");
  const confirmationRewardName = document.getElementById("confirmationRewardName");
  const confirmationRewardImage = document.getElementById("confirmationRewardImage");
  const confirmationCost = document.getElementById("confirmationCost");
  const confirmationBalance = document.getElementById("confirmationBalance");
  const confirmationAfter = document.getElementById("confirmationAfter");
  const cancelPurchaseButton = document.getElementById("cancelPurchase");
  const confirmPurchaseButton = document.getElementById("confirmPurchase");
  const purchaseError = document.getElementById("purchaseError");
  const purchaseGreeting = document.getElementById("purchaseGreeting");
  const successRewardImage = document.getElementById("successRewardImage");
  const successRewardName = document.getElementById("successRewardName");
  const redemptionCode = document.getElementById("redemptionCode");
  const successBalance = document.getElementById("successBalance");
  const backToShopButton = document.getElementById("backToShop");
  const redeemRewardButton = document.getElementById("redeemReward");
  const shopRedeemConfirmation = document.getElementById("shopRedeemConfirmation");
  const shopRedeemRequested = document.getElementById("shopRedeemRequested");
  const redeemRewardImage = document.getElementById("redeemRewardImage");
  const redeemRewardName = document.getElementById("redeemRewardName");
  const redeemUsername = document.getElementById("redeemUsername");
  const redeemCode = document.getElementById("redeemCode");
  const backFromRedeemButton = document.getElementById("backFromRedeem");
  const confirmRedeemButton = document.getElementById("confirmRedeem");
  const redeemErrorElement = document.getElementById("redeemError");
  const requestedRewardImage = document.getElementById("requestedRewardImage");
  const requestedRewardName = document.getElementById("requestedRewardName");
  const requestedCode = document.getElementById("requestedCode");
  const requestedUsername = document.getElementById("requestedUsername");
  const fulfillmentBadge = document.getElementById("fulfillmentBadge");
  const backFromRequestedButton = document.getElementById("backFromRequested");
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
  let gameRunId = 0;
  let submittedRunId = null;
  let leaderboardRequestId = 0;
  let currentMeiowPoints = null;
  let shopWasGameplayActive = false;
  let shopReturnFocus = null;
  let shopRewardsRequestId = 0;
  let shopRewardsData = [];
  let selectedReward = null;
  let purchasePending = false;
  let lastPurchase = null;
  let purchaseRequestId = 0;
  let redeemPending = false;
  let redeemRequested = false;
  let redeemError = "";
  let redeemRequestId = 0;

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

  function updateMeiowPointsDisplay() {
    const balance = currentMeiowPoints == null
      ? "—"
      : Number(currentMeiowPoints).toLocaleString();

    headerMeiowPoints.textContent = balance;
    shopMeiowPoints.textContent = `${balance} MEIOW POINTS`;
    updateShopEligibility();
  }

  function setGameplayAccess(enabled) {
    gameplayStarted = enabled;
    openShopButton.disabled = !enabled;
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
    currentMeiowPoints = null;
    updateUsernameDisplay();
    updateMeiowPointsDisplay();
    selectedReward = null;
    lastPurchase = null;
    redeemPending = false;
    redeemRequested = false;
    redeemError = "";
    usernameGate.classList.remove("is-open");
    usernameGate.setAttribute("aria-hidden", "true");
    setGameplayAccess(!shopOverlay.classList.contains("is-open"));
    if (shopOverlay.classList.contains("is-open")) {
      showShopCatalog();
    }
    loadCurrentPlayer();
    gameStatus.textContent = "Move, then tap or click to drop.";
    canvas.focus({ preventScroll: true });
    return true;
  }

  /* ==========================================================
     SUPABASE LEADERBOARD / RESULTS
     ========================================================== */

  const supabaseHeaders = {
    apikey: SUPABASE_PUBLISHABLE_KEY
  };

  function displayUsername(username) {
    return username.startsWith("@")
      ? username
      : `@${username}`;
  }

  function renderLeaderboard(players) {
    leaderboardList.replaceChildren();

    players.slice(0, 10).forEach((player, index) => {
      const row = document.createElement("li");
      const rank = document.createElement("span");
      const username = document.createElement("strong");
      const bestScore = document.createElement("b");

      rank.textContent = String(index + 1);
      username.textContent = displayUsername(String(player.username || ""));
      bestScore.textContent = Number(player.best_score || 0).toLocaleString();

      row.append(rank, username, bestScore);
      leaderboardList.append(row);
    });

    leaderboardStatus.textContent = players.length
      ? ""
      : "No scores yet.";
  }

  async function loadLeaderboard() {
    const requestId = ++leaderboardRequestId;
    leaderboardStatus.textContent = "Loading...";

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/arcade_players?select=username,best_score&order=best_score.desc&limit=10`,
        {
          headers: supabaseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`Leaderboard request failed: ${response.status}`);
      }

      const players = await response.json();

      if (requestId !== leaderboardRequestId) {
        return;
      }

      renderLeaderboard(Array.isArray(players) ? players : []);
    } catch (error) {
      if (requestId !== leaderboardRequestId) {
        return;
      }

      leaderboardList.replaceChildren();
      leaderboardStatus.textContent = "Leaderboard unavailable.";
      console.error("Arcade leaderboard load failed:", error);
    }
  }

  async function loadCurrentPlayer() {
    const requestedUsername = currentUsername;

    if (!requestedUsername) {
      currentMeiowPoints = null;
      updateMeiowPointsDisplay();
      return;
    }

    try {
      const response = await fetch(GET_PLAYER_ENDPOINT, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: requestedUsername
        })
      });

      if (!response.ok) {
        throw new Error(`Player request failed: ${response.status}`);
      }

      const result = await response.json();

      if (
        requestedUsername !== currentUsername ||
        result.ok !== true ||
        !result.player ||
        result.player.meiowPoints == null
      ) {
        return;
      }

      currentMeiowPoints = result.player.meiowPoints;
      updateMeiowPointsDisplay();
    } catch (error) {
      if (requestedUsername !== currentUsername) {
        return;
      }

      currentMeiowPoints = null;
      updateMeiowPointsDisplay();
      shopStatus.textContent = "Balance unavailable.";
      console.error("Arcade player load failed:", error);
    }
  }

  function rewardImageElement(imageUrl, className = "reward-image") {
    if (imageUrl) {
      const image = document.createElement("img");
      image.className = className;
      image.src = imageUrl;
      image.alt = "";
      return image;
    }

    const placeholder = document.createElement("div");
    const label = document.createElement("span");
    placeholder.className = className;
    label.textContent = "ZEM\nGIFT";
    placeholder.append(label);
    return placeholder;
  }

  function rewardEligibility(reward) {
    if (Number(reward.stock) === 0) {
      return { label: "OUT OF STOCK", disabled: true };
    }

    if (currentMeiowPoints == null) {
      return { label: "BALANCE UNAVAILABLE", disabled: true };
    }

    if (currentMeiowPoints < Number(reward.cost)) {
      return { label: "NOT ENOUGH MEIOW POINTS", disabled: true };
    }

    if (purchasePending) {
      return { label: "PURCHASING...", disabled: true };
    }

    return { label: "BUY", disabled: false };
  }

  function updateShopEligibility() {
    shopRewards.querySelectorAll(".reward-buy").forEach((button) => {
      const reward = shopRewardsData.find(
        (item) => String(item.id) === button.dataset.rewardId
      );

      if (!reward) {
        return;
      }

      const eligibility = rewardEligibility(reward);
      button.disabled = eligibility.disabled;
      button.textContent = eligibility.label;
    });
  }

  function renderShopRewards(rewards) {
    shopRewards.replaceChildren();

    rewards.forEach((reward) => {
      const card = document.createElement("article");
      const title = document.createElement("h3");
      const cost = document.createElement("p");
      const costValue = document.createElement("strong");
      const costLabel = document.createElement("span");
      const stock = document.createElement("p");
      const buy = document.createElement("button");

      card.className = "reward-card";
      const image = rewardImageElement(reward.image_url);
      title.textContent = reward.name;
      cost.className = "reward-cost";
      costValue.textContent = Number(reward.cost).toLocaleString();
      costLabel.textContent = " MEIOW POINTS";
      cost.append(costValue, costLabel);
      stock.className = "reward-stock";

      if (reward.stock === 0) {
        stock.textContent = "OUT OF STOCK";
      } else if (reward.stock != null) {
        stock.textContent = `${Number(reward.stock).toLocaleString()} LEFT`;
      }

      buy.className = "reward-buy";
      buy.type = "button";
      buy.dataset.rewardId = String(reward.id);
      buy.addEventListener("click", () => openPurchaseConfirmation(reward));
      card.append(image, title, cost, stock, buy);
      shopRewards.append(card);
    });

    updateShopEligibility();
  }

  function showShopCatalog() {
    shopCatalogHeader.hidden = false;
    shopCatalog.hidden = false;
    shopConfirmation.hidden = true;
    shopSuccess.hidden = true;
    shopRedeemConfirmation.hidden = true;
    shopRedeemRequested.hidden = true;
    shopStatus.hidden = false;
  }

  function showPurchaseConfirmation(reward) {
    shopCatalogHeader.hidden = true;
    shopCatalog.hidden = true;
    shopStatus.hidden = true;
    shopConfirmation.hidden = false;
    shopSuccess.hidden = true;
    shopRedeemConfirmation.hidden = true;
    shopRedeemRequested.hidden = true;
    confirmationRewardImage.replaceChildren(
      rewardImageElement(reward.image_url)
    );
    confirmationRewardName.textContent = reward.name;
    confirmationCost.textContent = `${Number(reward.cost).toLocaleString()} MP`;
    confirmationBalance.textContent = currentMeiowPoints == null
      ? "— MP"
      : `${Number(currentMeiowPoints).toLocaleString()} MP`;
    confirmationAfter.textContent = currentMeiowPoints == null
      ? ""
      : `${Math.max(0, currentMeiowPoints - Number(reward.cost)).toLocaleString()} MP`;
    purchaseError.textContent = "";
    confirmPurchaseButton.disabled = false;
    confirmPurchaseButton.textContent = `BUY · ${Number(reward.cost).toLocaleString()} MP`;
  }

  function openPurchaseConfirmation(reward) {
    const eligibility = rewardEligibility(reward);

    if (eligibility.disabled || purchasePending) {
      return;
    }

    selectedReward = reward;
    showPurchaseConfirmation(reward);
    confirmPurchaseButton.focus();
  }

  function closePurchaseConfirmation() {
    if (purchasePending) {
      return;
    }

    selectedReward = null;
    purchaseError.textContent = "";
    showShopCatalog();
  }

  function purchaseErrorMessage(errorText) {
    const message = String(errorText || "").toLowerCase();

    if (message.includes("not enough") || message.includes("meiow")) {
      return "NOT ENOUGH MEIOW POINTS";
    }

    if (message.includes("out of stock") || message.includes("stock")) {
      return "OUT OF STOCK";
    }

    if (message.includes("unavailable")) {
      return "Reward is unavailable.";
    }

    if (message.includes("player not found")) {
      return "Player not found.";
    }

    return "Purchase could not be completed. Please try again.";
  }

  function renderPurchaseSuccess(purchase) {
    shopCatalog.hidden = true;
    shopStatus.hidden = true;
    shopConfirmation.hidden = true;
    shopSuccess.hidden = false;
    shopRedeemConfirmation.hidden = true;
    shopRedeemRequested.hidden = true;
    purchaseGreeting.textContent = `CONGRATULATIONS, ${displayUsername(purchase.username)}!`;
    successRewardImage.replaceChildren();
    if (selectedReward && selectedReward.image_url) {
      const image = document.createElement("img");
      image.src = selectedReward.image_url;
      image.alt = "";
      successRewardImage.append(image);
    } else {
      const label = document.createElement("span");
      label.textContent = "ZEM\nGIFT";
      successRewardImage.append(label);
    }
    successRewardName.textContent = purchase.rewardName;
    redemptionCode.textContent = purchase.redemptionCode;
    successBalance.textContent = `${Number(purchase.remainingMeiowPoints).toLocaleString()} MEIOW POINTS LEFT`;
    redeemRequested = false;
    redeemPending = false;
    redeemError = "";
    updateRedeemEligibility();
  }

  function updateRedeemEligibility() {
    const purchase = lastPurchase;
    const enabled = Boolean(
      purchase &&
      purchase.redemptionCode &&
      purchase.username &&
      purchase.status === "pending" &&
      !redeemPending &&
      !redeemRequested
    );

    redeemRewardButton.disabled = !enabled;
    redeemRewardButton.textContent = redeemPending ? "SENDING..." : "REDEEM";
  }

  function renderRedeemRewardImage(container) {
    container.replaceChildren();
    if (selectedReward && selectedReward.image_url) {
      const image = document.createElement("img");
      image.src = selectedReward.image_url;
      image.alt = "";
      container.append(image);
    } else {
      const label = document.createElement("span");
      label.textContent = "ZEM\nGIFT";
      container.append(label);
    }
  }

  function showRedeemConfirmation() {
    if (!lastPurchase || redeemPending || redeemRequested) {
      return;
    }

    shopCatalogHeader.hidden = true;
    shopCatalog.hidden = true;
    shopStatus.hidden = true;
    shopSuccess.hidden = true;
    shopConfirmation.hidden = true;
    shopRedeemRequested.hidden = true;
    shopRedeemConfirmation.hidden = false;
    renderRedeemRewardImage(redeemRewardImage);
    redeemRewardName.textContent = lastPurchase.rewardName;
    redeemUsername.textContent = displayUsername(lastPurchase.username);
    redeemCode.textContent = lastPurchase.redemptionCode;
    redeemErrorElement.textContent = redeemError;
    confirmRedeemButton.disabled = false;
    confirmRedeemButton.textContent = "REDEEM";
    confirmRedeemButton.focus();
  }

  function showPurchaseSuccessView() {
    shopCatalogHeader.hidden = true;
    shopCatalog.hidden = true;
    shopStatus.hidden = true;
    shopConfirmation.hidden = true;
    shopRedeemConfirmation.hidden = true;
    shopRedeemRequested.hidden = true;
    shopSuccess.hidden = false;
    updateRedeemEligibility();
  }

  function showRedemptionRequested(purchase, status) {
    shopCatalogHeader.hidden = true;
    shopCatalog.hidden = true;
    shopStatus.hidden = true;
    shopConfirmation.hidden = true;
    shopSuccess.hidden = true;
    shopRedeemConfirmation.hidden = true;
    shopRedeemRequested.hidden = false;
    renderRedeemRewardImage(requestedRewardImage);
    requestedRewardName.textContent = purchase.rewardName;
    requestedCode.textContent = purchase.redemptionCode;
    requestedUsername.textContent = displayUsername(purchase.username);
    fulfillmentBadge.textContent = status === "fulfilled"
      ? "FULFILLED"
      : "PENDING FULFILLMENT";
  }

  function redeemErrorMessage(errorText) {
    const message = String(errorText || "").toLowerCase();

    if (message.includes("cancel")) {
      return "This redemption is no longer available.";
    }

    return "Redemption request could not be sent. Please try again.";
  }

  async function submitRedemption() {
    if (
      redeemPending ||
      redeemRequested ||
      !lastPurchase ||
      !lastPurchase.username ||
      !lastPurchase.redemptionCode ||
      lastPurchase.status !== "pending"
    ) {
      return;
    }

    const capturedUsername = lastPurchase.username;
    const capturedRedemptionCode = lastPurchase.redemptionCode;
    const requestId = ++redeemRequestId;
    redeemPending = true;
    confirmRedeemButton.disabled = true;
    confirmRedeemButton.textContent = "SENDING...";
    redeemErrorElement.textContent = "";
    updateRedeemEligibility();

    try {
      const response = await fetch(REDEEM_REWARD_ENDPOINT, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: capturedUsername,
          redemptionCode: capturedRedemptionCode
        })
      });

      const result = await response.json().catch(() => ({}));
      const redemption = result.redemption || result.purchase || {};
      const alreadyRequested =
        result.alreadyRequested === true ||
        redemption.alreadyRequested === true ||
        redemption.status === "already_requested" ||
        result.status === "already_requested";
      const status = redemption.status || result.status || (alreadyRequested ? "redeem_requested" : "");

      if (
        !response.ok ||
        result.ok !== true ||
        (!alreadyRequested && !["pending", "redeem_requested", "requested", "already_requested", "fulfilled"].includes(status))
      ) {
        throw new Error(result.error || result.message || "Redemption failed");
      }

      if (
        redemption.username &&
        normalizeUsername(String(redemption.username)) !== normalizeUsername(String(capturedUsername))
      ) {
        throw new Error("Redemption username mismatch");
      }

      if (
        redemption.redemptionCode &&
        String(redemption.redemptionCode) !== String(capturedRedemptionCode)
      ) {
        throw new Error("Redemption code mismatch");
      }

      if (requestId !== redeemRequestId) {
        return;
      }

      redeemPending = false;
      redeemRequested = true;
      lastPurchase.status = status === "fulfilled" ? "fulfilled" : "redeem_requested";
      showRedemptionRequested(lastPurchase, lastPurchase.status);
    } catch (error) {
      if (requestId !== redeemRequestId) {
        return;
      }

      redeemPending = false;
      redeemError = redeemErrorMessage(error.message);
      redeemErrorElement.textContent = redeemError;
      confirmRedeemButton.disabled = false;
      confirmRedeemButton.textContent = "REDEEM";
      console.error("Arcade redemption request failed:", error);
    }
  }

  async function purchaseSelectedReward() {
    if (!selectedReward || purchasePending || !shopOverlay.classList.contains("is-open")) {
      return;
    }

    const capturedUsername = currentUsername;
    const capturedRewardId = selectedReward.id;
    const capturedCost = selectedReward.cost;
    const requestId = ++purchaseRequestId;
    purchasePending = true;
    confirmPurchaseButton.disabled = true;
    confirmPurchaseButton.textContent = "PURCHASING...";
    updateShopEligibility();

    try {
      const response = await fetch(PURCHASE_REWARD_ENDPOINT, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: capturedUsername,
          rewardId: capturedRewardId
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.ok !== true || !result.purchase) {
        throw new Error(result.error || result.message || "Purchase failed");
      }

      const purchase = result.purchase;

      if (
        purchase.rewardId == null ||
        String(purchase.rewardId) !== String(capturedRewardId) ||
        purchase.username == null ||
        normalizeUsername(String(purchase.username)) !== normalizeUsername(capturedUsername) ||
        purchase.redemptionCode == null ||
        purchase.rewardName == null ||
        purchase.remainingMeiowPoints == null ||
        !Object.prototype.hasOwnProperty.call(purchase, "remainingStock")
      ) {
        throw new Error("Purchase returned an invalid result");
      }

      if (requestId !== purchaseRequestId) {
        return;
      }

      if (capturedUsername === currentUsername) {
        currentMeiowPoints = purchase.remainingMeiowPoints;
        updateMeiowPointsDisplay();
      }

      const matchingReward = shopRewardsData.find(
        (reward) => String(reward.id) === String(capturedRewardId)
      );

      if (matchingReward) {
        matchingReward.stock = purchase.remainingStock;
      }

      lastPurchase = purchase;
      purchasePending = false;
      renderPurchaseSuccess(purchase);
      loadShopRewards();
    } catch (error) {
      if (requestId !== purchaseRequestId) {
        return;
      }

      purchasePending = false;
      confirmPurchaseButton.disabled = false;
      confirmPurchaseButton.textContent = `BUY · ${Number(capturedCost).toLocaleString()} MP`;
      purchaseError.textContent = purchaseErrorMessage(error.message);
      updateShopEligibility();
      console.error("Arcade reward purchase failed:", error);

      if (/stock|not enough|meiow/i.test(error.message)) {
        loadCurrentPlayer();
        loadShopRewards();
      }
    }
  }

  async function loadShopRewards() {
    const requestId = ++shopRewardsRequestId;
    shopStatus.textContent = "Loading...";

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/arcade_rewards?select=id,slug,name,description,image_url,cost,stock,sort_order&is_active=eq.true&order=sort_order.asc`,
        {
          headers: supabaseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`Shop rewards request failed: ${response.status}`);
      }

      const rewards = await response.json();

      if (requestId !== shopRewardsRequestId) {
        return;
      }

      shopRewardsData = Array.isArray(rewards) ? rewards : [];
      renderShopRewards(shopRewardsData);
      shopStatus.textContent = rewards.length ? "" : "No rewards available right now.";
    } catch (error) {
      if (requestId !== shopRewardsRequestId) {
        return;
      }

      shopRewards.replaceChildren();
      shopStatus.textContent = "Shop unavailable right now.";
      console.error("Arcade shop rewards load failed:", error);
    }
  }

  function openShop() {
    if (!gameplayStarted || usernameGate.classList.contains("is-open")) {
      return;
    }

    shopWasGameplayActive = gameplayStarted;
    shopReturnFocus = document.activeElement;
    setGameplayAccess(false);
    document.body.style.overflow = "hidden";
    shopOverlay.classList.add("is-open");
    shopOverlay.setAttribute("aria-hidden", "false");
    selectedReward = null;
    purchaseError.textContent = "";
    showShopCatalog();
    loadShopRewards();
    loadCurrentPlayer();
    closeShopButton.focus();
  }

  function closeShop() {
    if (purchasePending || redeemPending) {
      return;
    }

    shopOverlay.classList.remove("is-open");
    shopOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (shopWasGameplayActive && !gameOver && currentUsername) {
      setGameplayAccess(true);
    }

    if (shopReturnFocus && typeof shopReturnFocus.focus === "function") {
      shopReturnFocus.focus({ preventScroll: true });
    } else {
      openShopButton.focus({ preventScroll: true });
    }

    shopReturnFocus = null;
  }

  async function submitCompletedGame(runId, username, finalRunScore) {
    if (submittedRunId === runId) {
      return;
    }

    submittedRunId = runId;
    submissionStatus.textContent = "Saving result...";
    resultTotals.textContent = "";

    try {
      const response = await fetch(SUBMIT_GAME_ENDPOINT, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          score: finalRunScore
        })
      });

      if (!response.ok) {
        throw new Error(`Game submission failed: ${response.status}`);
      }

      const result = await response.json();

      if (
        result.ok !== true ||
        !result.player ||
        result.player.pointsEarned == null ||
        result.player.bestScore == null ||
        result.player.meiowPoints == null
      ) {
        throw new Error("Game submission returned an invalid result");
      }

      if (runId !== gameRunId || !gameOver) {
        return;
      }

      const player = result.player || {};
      currentMeiowPoints = player.meiowPoints;
      updateMeiowPointsDisplay();
      submissionStatus.textContent =
        `+${Number(player.pointsEarned || 0).toLocaleString()} MEIOW POINTS`;
      resultTotals.textContent =
        `BEST ${Number(player.bestScore || 0).toLocaleString()} · MEIOW POINTS ${Number(player.meiowPoints || 0).toLocaleString()}`;
      loadLeaderboard();
    } catch (error) {
      if (runId !== gameRunId || !gameOver) {
        return;
      }

      submissionStatus.textContent = "Result could not be saved.";
      resultTotals.textContent = "";
      console.error("Arcade game submission failed:", error);
    }
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
    const dropRunId = gameRunId;

    window.setTimeout(() => {
      if (gameOver || dropRunId !== gameRunId) {
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
    const finalRunScore = score;
    const finalRunUsername = currentUsername;

    finalScore.textContent = String(finalRunScore);
    submissionStatus.textContent = "Saving result...";
    resultTotals.textContent = "";
    gameOverOverlay.hidden = false;
    gameStatus.textContent = "Board full. Start a new game to play again.";
    submitCompletedGame(
      gameRunId,
      finalRunUsername,
      finalRunScore
    );
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
    gameRunId += 1;
    clearBoard();
    score = 0;
    gameOver = false;
    dropLocked = false;
    pointerIsDown = false;
    activePointerId = null;
    submittedRunId = null;
    aimX = WORLD_WIDTH / 2;
    nextLevel = randomNaturalLevel();
    gameOverOverlay.hidden = true;
    submissionStatus.textContent = "Saving result...";
    resultTotals.textContent = "";
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

  openShopButton.addEventListener("click", openShop);
  closeShopButton.addEventListener("click", closeShop);
  shopBackdrop.addEventListener("click", closeShop);
  cancelPurchaseButton.addEventListener("click", closePurchaseConfirmation);
  confirmPurchaseButton.addEventListener("click", purchaseSelectedReward);
  backToShopButton.addEventListener("click", () => {
    if (purchasePending || redeemPending) {
      return;
    }
    selectedReward = null;
    showShopCatalog();
    loadShopRewards();
  });
  redeemRewardButton.addEventListener("click", showRedeemConfirmation);
  backFromRedeemButton.addEventListener("click", () => {
    if (redeemPending) {
      return;
    }
    showPurchaseSuccessView();
  });
  confirmRedeemButton.addEventListener("click", submitRedemption);
  backFromRequestedButton.addEventListener("click", () => {
    if (redeemPending) {
      return;
    }
    selectedReward = null;
    showShopCatalog();
    loadShopRewards();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (shopOverlay.classList.contains("is-open") && !purchasePending && !redeemPending) {
      closeShop();
    }
  });

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
  loadLeaderboard();

  currentUsername = readSavedUsername();
  updateUsernameDisplay();
  updateMeiowPointsDisplay();

  if (currentUsername) {
    setGameplayAccess(true);
    gameStatus.textContent = "Move, then tap or click to drop.";
    loadCurrentPlayer();
  } else {
    openUsernameGate();
  }

  window.requestAnimationFrame(frame);
})();
