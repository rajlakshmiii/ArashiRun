// Game elements
let startScreen = document.getElementById("startScreen");
let instructionsScreen = document.getElementById("instructionsScreen");
let settingsMenu = document.getElementById("settingsMenu");
let playButton = document.getElementById("playButton");
let startGameBtn = document.getElementById("startGameBtn");
let backBtn = document.getElementById("backBtn");
let settingsBtn = document.getElementById("settingsBtn");
let ninja = document.getElementById("ninja");
let game = document.getElementById("game");
let coinsContainer = document.getElementById("coinsContainer");
let monstersContainer = document.getElementById("monstersContainer");
let powerupsContainer = document.getElementById("powerupsContainer");

// UI elements
let distanceEl = document.getElementById("distance");
let highScoreEl = document.getElementById("highScore");
let timerEl = document.getElementById("timer");
let livesEl = document.getElementById("lives");
let gameOverScreen = document.getElementById("gameOver");
let restartBtn = document.getElementById("restartBtn");
let mainMenuBtn = document.getElementById("mainMenuBtn");
let comboEl = document.getElementById("combo");
let dashCooldownEl = document.getElementById("dashCooldown");
let shieldStatusEl = document.getElementById("shieldStatus");

// Settings controls
let musicToggle = document.getElementById("musicToggle");
let resumeBtn = document.getElementById("resumeBtn");
let restartFromSettings = document.getElementById("restartFromSettings");
let quitFromSettings = document.getElementById("quitFromSettings");

// Audio
let bgMusic = document.getElementById("bgMusic");
let musicEnabled = true;

// Game state
let gameRunning = false;
let gamePaused = false;
let distance = 0;
let coinsCollected = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let maxComboReached = 0;
let lives = 5;
let coins = [];
let monsters = [];
let powerups = [];
let startTime = Date.now();
let pauseTime = 0;
let timerInterval;
let weapons = [];
let particles = [];

// New features state
let combo = 0;
let comboTimer = null;
let comboMultiplier = 1;
let dashCooldown = 0;
let dashReady = true;
let shieldActive = false;
let shieldTimer = null;
let slowMotionActive = false;
let slowMotionTimer = null;
let invincible = false;
let monstersKilled = 0;
let multiShotActive = false;
let multiShotTimer = null;

// Ninja variables
let positionX = 100;
let positionY = 0;
let velocityY = 0;
let velocityX = 0;
let isJumping = false;
let isPressingJump = false;
let isDashing = false;
let maxJumpHeight = 450;
let jumpPower = 10;
let holdJumpPower = 8;
let gravity = 0.5;
let maxHoldTime = 50;
let holdFrames = 0;

// Game settings
let gameSpeed = 3;
let baseGameSpeed = 3;
let coinSpawnRate = 2500;
let monsterSpawnRate = 4000;
let powerupSpawnRate = 10000;
let gameTime = 0;

// Spawn intervals
let coinSpawnInterval;
let monsterInterval;
let powerupInterval;

// Initialize
highScoreEl.textContent = highScore;
ninja.style.left = positionX + "px";
ninja.style.bottom = positionY + "px";

// Play background music on start
window.addEventListener('load', () => {
  bgMusic.volume = 0.3;
  // Try to play music (some browsers require user interaction)
  let playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      console.log("Autoplay prevented, music will start on first user interaction");
      // Try to play on first click anywhere
      document.addEventListener('click', function playOnce() {
        if (musicEnabled) {
          bgMusic.play();
        }
        document.removeEventListener('click', playOnce);
      }, { once: true });
    });
  }
});

// Music toggle in settings - this is the ONLY music control
musicToggle.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    bgMusic.play().catch(e => console.log("Couldn't play music"));
    musicToggle.textContent = "ON";
    musicToggle.classList.remove("off");
  } else {
    bgMusic.pause();
    musicToggle.textContent = "OFF";
    musicToggle.classList.add("off");
  }
});

// Settings menu toggle
settingsBtn.addEventListener("click", () => {
  togglePause();
});

// ESC key to open settings
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && gameRunning) {
    togglePause();
  }
});

function togglePause() {
  gamePaused = !gamePaused;
  if (gamePaused) {
    settingsMenu.classList.remove("hidden");
    pauseTime = Date.now();
  } else {
    settingsMenu.classList.add("hidden");
    // Adjust start time to account for pause duration
    startTime += Date.now() - pauseTime;
  }
}

// Resume game
resumeBtn.addEventListener("click", () => {
  if (gameRunning) {
    togglePause();
  }
});

// Restart from settings
restartFromSettings.addEventListener("click", () => {
  settingsMenu.classList.add("hidden");
  location.reload();
});

// Quit from settings
quitFromSettings.addEventListener("click", () => {
  if (confirm("Are you sure you want to quit to main menu?")) {
    location.reload();
  }
});

// Navigation
playButton.addEventListener("click", function() {
  startScreen.classList.add("hidden");
  instructionsScreen.classList.remove("hidden");
  // Ensure music plays
  if (musicEnabled) {
    bgMusic.play().catch(e => console.log("Couldn't play music"));
  }
});

startGameBtn.addEventListener("click", function() {
  instructionsScreen.classList.add("hidden");
  startGame();
});

backBtn.addEventListener("click", function() {
  instructionsScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

function startGame() {
  gameRunning = true;
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
  coinSpawnInterval = setInterval(spawnCoin, coinSpawnRate);
  startMonsterSpawning();
  startPowerupSpawning();
  gameLoop();
  
  // Ensure music is playing
  if (musicEnabled) {
    bgMusic.play().catch(e => console.log("Couldn't play music"));
  }
}

// Timer
function updateTimer() {
  if (!gameRunning || gamePaused) return;
  let elapsed = Math.floor((Date.now() - startTime) / 1000);
  let minutes = Math.floor(elapsed / 60);
  let seconds = elapsed % 60;
  timerEl.textContent = 
    String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

// Distance counter
setInterval(() => {
  if (!gameRunning || gamePaused) return;
  distance += comboMultiplier;
  gameTime += 0.1;
  distanceEl.textContent = Math.floor(distance);

  // Progressive difficulty
  if (gameTime < 20) {
    baseGameSpeed = 3;
    monsterSpawnRate = 5000;
  } else if (gameTime < 40) {
    baseGameSpeed = 4;
    monsterSpawnRate = 3500;
  } else if (gameTime < 60) {
    baseGameSpeed = 5;
    monsterSpawnRate = 2800;
  } else {
    baseGameSpeed = 6;
    monsterSpawnRate = 2200;
    if (Math.floor(distance) % 500 === 0 && distance > 0) {
      baseGameSpeed += 0.1;
    }
  }

  // Apply slow motion effect
  gameSpeed = slowMotionActive ? baseGameSpeed * 0.5 : baseGameSpeed;

  // Update dash cooldown
  if (dashCooldown > 0) {
    dashCooldown -= 0.1;
    dashCooldownEl.textContent = Math.ceil(dashCooldown) + "s";
  } else {
    dashReady = true;
    dashCooldownEl.textContent = "READY";
  }
}, 100);

// Combo system
function updateCombo() {
  combo++;
  if (combo > maxComboReached) maxComboReached = combo;
  comboMultiplier = Math.min(1 + (combo * 0.1), 3);
  comboEl.textContent = `${combo}x`;
  comboEl.style.transform = "scale(1.3)";
  
  setTimeout(() => {
    comboEl.style.transform = "scale(1)";
  }, 200);

  // Reset combo timer
  if (comboTimer) clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    combo = 0;
    comboMultiplier = 1;
    comboEl.textContent = "0x";
  }, 3000);
}

// Particle system
function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    let particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = x + "px";
    particle.style.bottom = y + "px";
    particle.style.background = color;
    
    let angle = (Math.PI * 2 * i) / count;
    let velocity = 5 + Math.random() * 5;
    
    game.appendChild(particle);
    particles.push({
      element: particle,
      x: x,
      y: y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 1
    });
  }
}

// Ninja movement
document.addEventListener("keydown", function(event) {
  if (!gameRunning || gamePaused) return;

  if (event.key === "ArrowRight") {
    positionX += 20;
    if (positionX > window.innerWidth - 250) positionX = window.innerWidth - 250;
    ninja.style.left = positionX + "px";
    ninja.style.transform = "scaleX(1)";
  }

  if (event.key === "ArrowLeft") {
    positionX -= 20;
    if (positionX < 0) positionX = 0; // Fixed: Added left boundary
    ninja.style.left = positionX + "px";
    ninja.style.transform = "scaleX(-1)";
  }

  // Jump
  if ((event.key === "ArrowUp" || event.key === " ") && !isPressingJump) {
    if (!isJumping) {
      isJumping = true;
      velocityY = jumpPower;
      holdFrames = 0;
      createParticles(positionX + 100, positionY, "#FFD700", 5);
    }
    isPressingJump = true;
  }

  // Dash
  if ((event.key === "d" || event.key === "D") && dashReady && !isDashing) {
    activateDash();
  }

  // Attack
  if (event.key === "f" || event.key === "F") {
    throwWeapon();
  }

  // Shield
  if ((event.key === "s" || event.key === "S") && !shieldActive) {
    activateShield();
  }
});

document.addEventListener("keyup", function(event) {
  if (!gameRunning || gamePaused) return;

  if (event.key === "ArrowUp" || event.key === " ") {
    isPressingJump = false;
  }
});

// Dash ability
function activateDash() {
  isDashing = true;
  dashReady = false;
  dashCooldown = 10;
  invincible = true;
  
  ninja.classList.add("dashing");
  
  let dashDistance = 300;
  let dashSpeed = 30;
  let dashTime = 0;
  
  let dashInterval = setInterval(() => {
    if (dashTime < dashDistance) {
      positionX += dashSpeed;
      if (positionX > window.innerWidth - 250) positionX = window.innerWidth - 250;
      ninja.style.left = positionX + "px";
      createParticles(positionX, positionY + 80, "#00FFFF", 2);
      dashTime += dashSpeed;
    } else {
      clearInterval(dashInterval);
      isDashing = false;
      invincible = false;
      ninja.classList.remove("dashing");
    }
  }, 20);
}

// Shield ability
function activateShield() {
  shieldActive = true;
  shieldStatusEl.textContent = "ACTIVE";
  shieldStatusEl.style.color = "#00FF00";
  ninja.classList.add("shielded");
  
  if (shieldTimer) clearTimeout(shieldTimer);
  shieldTimer = setTimeout(() => {
    deactivateShield();
  }, 5000);
}

function deactivateShield() {
  shieldActive = false;
  shieldStatusEl.textContent = "INACTIVE";
  shieldStatusEl.style.color = "#888";
  ninja.classList.remove("shielded");
}

// Ninja physics
function updateNinjaPhysics() {
  if (isJumping) {
    if (isPressingJump && holdFrames < maxHoldTime && positionY < maxJumpHeight) {
      velocityY += holdJumpPower * 0.15;
      holdFrames++;
    }

    positionY += velocityY;
    velocityY -= gravity;

    if (positionY >= maxJumpHeight) {
      positionY = maxJumpHeight;
      velocityY = -1;
      isPressingJump = false;
    }

    if (positionY <= 0) {
      positionY = 0;
      velocityY = 0;
      isJumping = false;
      isPressingJump = false;
      holdFrames = 0;
    }

    ninja.style.bottom = positionY + "px";
  }
}

// Throw weapon
function throwWeapon() {
  if (!gameRunning || gamePaused) return;

  let numWeapons = multiShotActive ? 3 : 1;
  
  for (let i = 0; i < numWeapons; i++) {
    let weapon = document.createElement("div");
    weapon.className = "weapon";

    let img = document.createElement("img");
    img.src = "assets/sword.png";
    weapon.appendChild(img);

    let offsetY = 0;
    if (multiShotActive) {
      offsetY = (i - 1) * 40; // Spread weapons vertically
    }

    weapon.style.left = (positionX + 120) + "px";
    weapon.style.bottom = (positionY + 80 + offsetY) + "px";

    game.appendChild(weapon);

    weapons.push({
      element: weapon,
      x: positionX + 120,
      y: positionY + 80 + offsetY
    });
  }
}

// Coin spawning
function spawnCoin() {
  if (!gameRunning || gamePaused) return;

  let coinDiv = document.createElement("div");
  coinDiv.className = "coin";

  let coinImg = document.createElement("img");
  coinImg.src = "assets/coin.png";
  coinDiv.appendChild(coinImg);

  coinDiv.style.right = "-50px";
  coinDiv.style.bottom = Math.random() * 250 + 100 + "px";

  coinsContainer.appendChild(coinDiv);
  coins.push({ 
    element: coinDiv, 
    x: window.innerWidth + 50, 
    y: parseInt(coinDiv.style.bottom), 
    collected: false 
  });
}

setTimeout(spawnCoin, 500);

// Powerup spawning
function startPowerupSpawning() {
  powerupInterval = setInterval(() => spawnPowerup(), powerupSpawnRate);
}

function spawnPowerup() {
  if (!gameRunning || gamePaused) return;

  // Weighted random selection
  let types = ["shield", "shield", "slowmo", "magnet", "2x", "life", "multishot"];
  let type = types[Math.floor(Math.random() * types.length)];
  
  let powerup = document.createElement("div");
  powerup.className = "powerup";
  powerup.dataset.type = type;
  
  let icon = document.createElement("div");
  icon.className = "powerup-icon";
  icon.textContent = type === "shield" ? "🛡️" : 
                     type === "slowmo" ? "⏰" : 
                     type === "magnet" ? "🧲" : 
                     type === "2x" ? "2️⃣" :
                     type === "life" ? "❤️" : "⚔️";
  powerup.appendChild(icon);

  powerup.style.right = "-60px";
  powerup.style.bottom = Math.random() * 200 + 100 + "px";

  powerupsContainer.appendChild(powerup);
  powerups.push({ 
    element: powerup, 
    x: window.innerWidth + 60, 
    y: parseInt(powerup.style.bottom), 
    type: type,
    collected: false 
  });
}

// Apply powerup
function applyPowerup(type) {
  switch(type) {
    case "shield":
      activateShield();
      break;
    case "slowmo":
      slowMotionActive = true;
      if (slowMotionTimer) clearTimeout(slowMotionTimer);
      slowMotionTimer = setTimeout(() => {
        slowMotionActive = false;
      }, 5000);
      break;
    case "magnet":
      coins.forEach(coin => {
        if (!coin.collected) {
          coin.element.style.transition = "all 0.5s ease-in";
          coin.x = positionX;
          coin.y = positionY;
        }
      });
      break;
    case "2x":
      comboMultiplier *= 2;
      setTimeout(() => {
        comboMultiplier = Math.max(1, comboMultiplier / 2);
      }, 5000);
      break;
    case "life":
      if (lives < 5) {
        lives++;
        let hearts = livesEl.querySelectorAll(".heart");
        hearts[lives - 1].classList.remove("lost");
      }
      break;
    case "multishot":
      multiShotActive = true;
      ninja.classList.add("multishot");
      if (multiShotTimer) clearTimeout(multiShotTimer);
      multiShotTimer = setTimeout(() => {
        multiShotActive = false;
        ninja.classList.remove("multishot");
      }, 10000);
      break;
  }
}

// Monster spawning
function startMonsterSpawning() {
  if (monsterInterval) clearInterval(monsterInterval);
  monsterInterval = setInterval(() => spawnMonster(), monsterSpawnRate);
}

function spawnMonster() {
  if (!gameRunning || gamePaused) return;

  // Determine monster type based on game time
  let type = "ground";
  let speed = 1;
  
  if (gameTime > 30) {
    let rand = Math.random();
    if (rand < 0.3) {
      type = "flying";
    } else if (rand < 0.5) {
      type = "speed";
      speed = 2;
    }
  }

  let monster = document.createElement("img");
  monster.src = "assets/monster.png";
  monster.className = "monster";
  
  if (type === "flying") {
    monster.classList.add("flying");
    monster.style.bottom = "200px";
  } else if (type === "speed") {
    monster.classList.add("speed");
    monster.style.bottom = "20px";
  } else {
    monster.style.bottom = "20px";
  }
  
  monster.style.right = "-150px";

  monstersContainer.appendChild(monster);
  monsters.push({ 
    element: monster, 
    x: window.innerWidth + 150, 
    y: type === "flying" ? 200 : 20, 
    type: type,
    speed: speed,
    hit: false 
  });
}

setTimeout(spawnMonster, 3000);

// Collision detection
function isColliding(ninjaEl, objectEl) {
  const ninjaRect = ninjaEl.getBoundingClientRect();
  const objectRect = objectEl.getBoundingClientRect();
  
  const padding = 20;
  
  return !(
    ninjaRect.top + padding > objectRect.bottom ||
    ninjaRect.bottom - padding < objectRect.top ||
    ninjaRect.right - padding < objectRect.left ||
    ninjaRect.left + padding > objectRect.right
  );
}

// Game loop
function gameLoop() {
  if (!gameRunning) return;
  if (gamePaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  updateNinjaPhysics();

  // Update particles (fixed array modification)
  for (let i = particles.length - 1; i >= 0; i--) {
    let particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy -= 0.5;
    particle.life -= 0.02;
    
    particle.element.style.left = particle.x + "px";
    particle.element.style.bottom = particle.y + "px";
    particle.element.style.opacity = particle.life;
    
    if (particle.life <= 0) {
      particle.element.remove();
      particles.splice(i, 1);
    }
  }

  // Coins
  for (let i = coins.length - 1; i >= 0; i--) {
    let coin = coins[i];
    coin.x -= gameSpeed;
    coin.element.style.right = (window.innerWidth - coin.x) + "px";

    if (!coin.collected && isColliding(ninja, coin.element)) {
      coin.collected = true;
      coin.element.classList.add("collected");
      distance += 10 * comboMultiplier;
      coinsCollected++;
      updateCombo();
      createParticles(coin.x, coin.y, "#FFD700", 8);
      setTimeout(() => {
        coin.element.remove();
        coins.splice(coins.indexOf(coin), 1);
      }, 500);
    }

    if (coin.x < -100) {
      coin.element.remove();
      coins.splice(i, 1);
    }
  }

  // Powerups
  for (let i = powerups.length - 1; i >= 0; i--) {
    let powerup = powerups[i];
    powerup.x -= gameSpeed;
    powerup.element.style.right = (window.innerWidth - powerup.x) + "px";

    if (!powerup.collected && isColliding(ninja, powerup.element)) {
      powerup.collected = true;
      applyPowerup(powerup.type);
      createParticles(powerup.x, powerup.y, "#FF00FF", 12);
      powerup.element.remove();
      powerups.splice(i, 1);
    }

    if (powerup.x < -100) {
      powerup.element.remove();
      powerups.splice(i, 1);
    }
  }

  // Weapons
  for (let w = weapons.length - 1; w >= 0; w--) {
    let weapon = weapons[w];
    weapon.x += 12 * (slowMotionActive ? 0.5 : 1); // Apply slow motion to weapons
    weapon.element.style.left = weapon.x + "px";

    // Check weapon-monster collision
    for (let m = monsters.length - 1; m >= 0; m--) {
      let monster = monsters[m];
      if (
        Math.abs(weapon.x - monster.x) < 80 &&
        Math.abs(weapon.y - monster.y) < 80 &&
        !monster.hit
      ) {
        monster.hit = true;
        monstersKilled++;
        updateCombo();
        
        // Speed demons give more points
        if (monster.type === "speed") {
          distance += 50 * comboMultiplier;
        } else {
          distance += 20 * comboMultiplier;
        }
        
        createParticles(monster.x, monster.y, "#FF0000", 15);
        
        monster.element.remove();
        monsters.splice(m, 1);

        weapon.element.remove();
        weapons.splice(w, 1);
        break;
      }
    }

    if (weapon.x > window.innerWidth) {
      weapon.element.remove();
      weapons.splice(w, 1);
    }
  }

  // Monsters
  for (let i = monsters.length - 1; i >= 0; i--) {
    let monster = monsters[i];
    monster.x -= gameSpeed * monster.speed;
    monster.element.style.right = (window.innerWidth - monster.x) + "px";

    if (!monster.hit && isColliding(ninja, monster.element)) {
      if (invincible || isDashing) {
        monster.hit = true;
        monstersKilled++;
        
        if (monster.type === "speed") {
          distance += 50 * comboMultiplier;
        } else {
          distance += 20 * comboMultiplier;
        }
        
        createParticles(monster.x, monster.y, "#00FFFF", 12);
        monster.element.remove();
        monsters.splice(i, 1);
      } else if (shieldActive) {
        monster.hit = true;
        deactivateShield();
        createParticles(positionX + 100, positionY + 80, "#00FF00", 10);
        monster.element.remove();
        monsters.splice(i, 1);
      } else {
        monster.hit = true;
        loseLife();
        ninja.classList.add("hit");
        createParticles(positionX + 100, positionY + 80, "#FF0000", 8);
        setTimeout(() => ninja.classList.remove("hit"), 500);
        monster.element.remove();
        monsters.splice(i, 1);
      }
    }

    if (monster.x < -200) {
      monster.element.remove();
      monsters.splice(i, 1);
    }
  }

  requestAnimationFrame(gameLoop);
}

// Lose life
function loseLife() {
  if (lives <= 0) return;

  lives--;
  let hearts = livesEl.querySelectorAll(".heart");
  hearts[lives].classList.add("lost");

  if (lives <= 0) endGame();
}

// End game
function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  clearInterval(coinSpawnInterval);
  clearInterval(monsterInterval);
  clearInterval(powerupInterval);

  let finalDistance = Math.floor(distance);
  
  if (finalDistance > highScore) {
    highScore = finalDistance;
    localStorage.setItem("highScore", highScore);
  }

  document.getElementById("finalDistance").textContent = finalDistance;
  document.getElementById("finalCoins").textContent = coinsCollected;
  document.getElementById("finalHighScore").textContent = highScore;
  document.getElementById("finalKills").textContent = monstersKilled;
  document.getElementById("finalCombo").textContent = maxComboReached;
  
  highScoreEl.textContent = highScore;
  
  gameOverScreen.classList.remove("hidden");
}

function startMusic() {
  if (musicEnabled && bgMusic.paused) {
    bgMusic.volume = 0.4;
    bgMusic.play().then(() => {
      console.log("Music started");
    }).catch(err => {
      console.log("Music blocked:", err);
    });
  }
}


// Restart and menu
restartBtn.addEventListener("click", () => location.reload());
mainMenuBtn.addEventListener("click", () => location.reload());