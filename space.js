/* ================================
   ЗВЁЗДЫ
================================ */
const starsCanvas = document.getElementById('stars');
const sctx = starsCanvas.getContext('2d');
let stars = [];

function resizeStars() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
}

function initStars() {
    stars = [];
    const count = Math.floor(window.innerWidth / 8);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.5 ? '#00f0ff' : '#b026ff'
        });
    }
}

function animateStars() {
    sctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > starsCanvas.height) s.y = 0;
        sctx.fillStyle = s.color;
        sctx.shadowBlur = 10;
        sctx.shadowColor = s.color;
        sctx.fillRect(s.x, s.y, s.size, s.size);
    });
    requestAnimationFrame(animateStars);
}

resizeStars();
initStars();
animateStars();

window.addEventListener('resize', () => {
    resizeStars();
    initStars();
});

/* ================================
   SPACE RUNNER
================================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvasWrapper');

const W = canvas.width;
const H = canvas.height;

let ship, asteroids, crystals, particles, bgStars, powerups;
let score, highScore, crystalCount, shieldCount;
let gameState = 'idle';
let keys = {};
let animId = null;

let targetY = H / 2;
let targetX = W / 2;

let spawnTimer = 0;
let lastFrameTime = 0;
let elapsedTime = 0;

let boostActive = false;
let boostFuel = 100;
let BOOST_MAX = 100;
const BOOST_REGEN = 8;
const BOOST_USE = 60;

// Второй шанс
let revivesLeft = 0;

// Магнит
let magnetActive = false;

// DOM
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const crystalsEl = document.getElementById('crystals');
const shieldEl = document.getElementById('shield');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const boostBtn = document.getElementById('boostBtn');

// DOM магазина
const shopOpenBtn = document.getElementById('shopOpenBtn');
const shopModal = document.getElementById('shopModal');
const shopClose = document.getElementById('shopClose');
const shopList = document.getElementById('shopList');
const shopBalance = document.getElementById('shopBalance');
const shopCrystals = document.getElementById('shopCrystals');

highScore = parseInt(localStorage.getItem('spaceHighScore') || '0');
highScoreEl.textContent = highScore;

/* ================================
   ⚖️ БАЛАНС
================================ */
const BALANCE = {
    shipSpeed: 5,
    startScrollSpeed: 2,
    maxScrollSpeed: 7,
    speedUpPerSec: 0.05,
    asteroidSpawnMin: 900,
    asteroidSpawnMax: 1600,
    crystalSpawnChance: 0.5,
    powerupSpawnChance: 0.08,
    shieldMax: 3,
    boostMultiplier: 2.5,
};

/* ================================
   🛒 МАГАЗИН — УЛУЧШЕНИЯ
================================ */
const SHOP_ITEMS = [
    {
        id: 'startShield',
        icon: '🛡️',
        name: 'СТАРТОВЫЙ ЩИТ',
        desc: 'Начинаешь с +1 щитом',
        maxLevel: 5,
        basePrice: 15,
        priceStep: 10,
        effect: (lvl) => `+${lvl} щит${lvl > 1 ? 'а' : ''}`
    },
    {
        id: 'boostCapacity',
        icon: '⚡',
        name: 'БОЛЬШЕ ТОПЛИВА',
        desc: '+25% к максимуму буста',
        maxLevel: 5,
        basePrice: 10,
        priceStep: 10,
        effect: (lvl) => `+${lvl * 25}% буста`
    },
    {
        id: 'magnet',
        icon: '💎',
        name: 'МАГНИТ',
        desc: 'Кристаллы притягиваются к кораблю',
        maxLevel: 1,
        basePrice: 20,
        priceStep: 0,
        effect: () => 'Активен'
    },
    {
        id: 'revive',
        icon: '❤️',
        name: 'ВТОРОЙ ШАНС',
        desc: '1 раз оживаешь после смерти',
        maxLevel: 1,
        basePrice: 30,
        priceStep: 0,
        effect: () => '1 возрождение'
    },
    {
        id: 'startBoost',
        icon: '🚀',
        name: 'СТАРТОВЫЙ БУСТ',
        desc: 'Начинаешь с полным баком',
        maxLevel: 1,
        basePrice: 8,
        priceStep: 0,
        effect: () => 'Полный бак'
    },
    {
        id: 'slowStart',
        icon: '🐢',
        name: 'МЕДЛЕННЫЙ СТАРТ',
        desc: 'Скорость растёт медленнее',
        maxLevel: 5,
        basePrice: 12,
        priceStep: 8,
        effect: (lvl) => `-${lvl * 15}% разгона`
    }
];

// Загружаем купленные улучшения и кристаллы из localStorage
let ownedUpgrades = JSON.parse(localStorage.getItem('spaceUpgrades') || '{}');
let bankCrystals = parseInt(localStorage.getItem('spaceBankCrystals') || '0');

function getUpgradeLevel(id) {
    return ownedUpgrades[id] || 0;
}

function getUpgradePrice(item) {
    const lvl = getUpgradeLevel(item.id);
    if (lvl >= item.maxLevel) return null;
    return item.basePrice + lvl * item.priceStep;
}

function updateShopUI() {
    shopBalance.textContent = bankCrystals;
    shopCrystals.textContent = bankCrystals;
}

function renderShop() {
    shopList.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const lvl = getUpgradeLevel(item.id);
        const isMaxed = lvl >= item.maxLevel;
        const price = getUpgradePrice(item);
        const canAfford = bankCrystals >= (price || 0);

        const div = document.createElement('div');
        div.className = 'shop-item' + (isMaxed ? ' maxed' : '');

        div.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.desc}</div>
                <div class="shop-item-level">
                    УР. ${lvl}/${item.maxLevel}${lvl > 0 ? ' · ' + item.effect(lvl) : ''}
                </div>
            </div>
            <button class="shop-item-buy${isMaxed ? ' maxed' : ''}"
                    data-id="${item.id}"
                    ${isMaxed || !canAfford ? 'disabled' : ''}>
                ${isMaxed ? '✔ МАКС' : 'КУПИТЬ'}
                ${!isMaxed ? `<span class="price">💎 ${price}</span>` : ''}
            </button>
        `;

        shopList.appendChild(div);
    });

    // Обработчики покупки
    shopList.querySelectorAll('.shop-item-buy').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            buyUpgrade(id);
        });
    });

    updateShopUI();
}

function buyUpgrade(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    const lvl = getUpgradeLevel(id);
    if (lvl >= item.maxLevel) return;

    const price = getUpgradePrice(item);
    if (bankCrystals < price) {
        // Тряска — недостаточно средств
        shopBalance.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300 });
        shopBalance.style.color = '#ff0040';
        setTimeout(() => shopBalance.style.color = '', 400);
        return;
    }

    bankCrystals -= price;
    ownedUpgrades[id] = lvl + 1;

    localStorage.setItem('spaceUpgrades', JSON.stringify(ownedUpgrades));
    localStorage.setItem('spaceBankCrystals', bankCrystals);

    // Анимация успеха
    shopList.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.01)' },
        { transform: 'scale(1)' }
    ], { duration: 250 });

    renderShop();
}

function openShop() {
    if (gameState === 'playing') pauseGame();
    renderShop();
    shopModal.classList.remove('hidden');
}

function closeShop() {
    shopModal.classList.add('hidden');
}

shopOpenBtn.addEventListener('click', openShop);
shopClose.addEventListener('click', closeShop);

shopModal.addEventListener('click', (e) => {
    if (e.target === shopModal) closeShop();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !shopModal.classList.contains('hidden')) {
        closeShop();
    }
});

/* ================================
   ИНИЦИАЛИЗАЦИЯ
================================ */
function initGame() {
    // Применяем улучшения
    BOOST_MAX = 100 + getUpgradeLevel('boostCapacity') * 25;
    revivesLeft = getUpgradeLevel('revive');
    magnetActive = getUpgradeLevel('magnet') > 0;

    ship = {
        x: W / 2,
        y: H / 2,
        w: 30,
        h: 36,
        tilt: 0,
        alive: true
    };

    targetX = W / 2;
    targetY = H / 2;

    asteroids = [];
    crystals = [];
    powerups = [];
    particles = [];
    bgStars = [];

    score = 0;
    crystalCount = 0;
    shieldCount = getUpgradeLevel('startShield');
    elapsedTime = 0;
    spawnTimer = 0;
    boostFuel = getUpgradeLevel('startBoost') > 0 ? BOOST_MAX : BOOST_MAX * 0.5;
    boostActive = false;

    scoreEl.textContent = 0;
    crystalsEl.textContent = 0;
    shieldEl.textContent = shieldCount;

    for (let i = 0; i < 60; i++) {
        bgStars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5
        });
    }

    lastFrameTime = performance.now();
}

/* ================================
   СПАВН
================================ */
function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
        x: Math.random() * (W - 40) + 20,
        y: -size,
        w: size,
        h: size,
        vx: (Math.random() - 0.5) * 0.8,
        rot: 0,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        emoji: Math.random() > 0.5 ? '☄️' : '🪨'
    });
}

function spawnCrystal() {
    crystals.push({
        x: Math.random() * (W - 40) + 20,
        y: -30,
        w: 24,
        h: 24,
        vx: (Math.random() - 0.5) * 0.6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.03,
        emoji: '💎'
    });
}

function spawnPowerup() {
    const types = [
        { emoji: '🛡️', type: 'shield', color: '#00f0ff' },
        { emoji: '⚡', type: 'fuel',   color: '#ffcc00' },
        { emoji: '❤️', type: 'extra',  color: '#ff2e97' },
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    powerups.push({
        x: Math.random() * (W - 40) + 20,
        y: -30,
        w: 26,
        h: 26,
        vx: (Math.random() - 0.5) * 0.5,
        type: t.type,
        emoji: t.emoji,
        color: t.color,
        wobble: Math.random() * Math.PI * 2
    });
}

/* ================================
   ЧАСТИЦЫ
================================ */
function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            size: Math.random() * 3 + 2,
            color
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= 0.025;
        return p.life > 0;
    });
}

let floatingTexts = [];
function spawnText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1 });
}

/* ================================
   ОТРИСОВКА
================================ */
function draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#050515');
    grad.addColorStop(0.5, '#0a0a25');
    grad.addColorStop(1, '#050515');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    bgStars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + s.size * 0.15})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Кристаллы
    crystals.forEach(c => {
        ctx.save();
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
        ctx.rotate(c.rot);
        ctx.font = `${c.w}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f0ff';
        ctx.fillText(c.emoji, 0, 0);
        ctx.restore();
    });

    // Бонусы
    powerups.forEach(p => {
        const wob = Math.sin(Date.now() / 200 + p.wobble) * 3;
        ctx.font = `${p.w}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2 + wob, 18, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '33';
        ctx.fill();
        ctx.fillText(p.emoji, p.x + p.w / 2, p.y + p.h / 2 + wob);
    });

    // Астероиды
    asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
        ctx.rotate(a.rot);
        ctx.font = `${a.w}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff2e97';
        ctx.fillText(a.emoji, 0, 0);
        ctx.restore();
    });

    drawShip();

    // Магнит-эффект
    if (magnetActive) {
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, 90, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 + Math.sin(Date.now() / 300) * 0.05})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    floatingTexts.forEach(t => {
        ctx.globalAlpha = t.life;
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = t.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = t.color;
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    drawBoostBar();
}

function drawShip() {
    const x = ship.x;
    const y = ship.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ship.tilt * 0.3);

    if (boostActive && boostFuel > 0) {
        const flameSize = 12 + Math.random() * 8;
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(-8, 20);
        ctx.lineTo(0, 20 + flameSize);
        ctx.lineTo(8, 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff2e97';
        ctx.shadowColor = '#ff2e97';
        ctx.beginPath();
        ctx.moveTo(-4, 20);
        ctx.lineTo(0, 20 + flameSize * 0.6);
        ctx.lineTo(4, 20);
        ctx.closePath();
        ctx.fill();
    } else {
        const flicker = 8 + Math.random() * 4;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(-5, 18);
        ctx.lineTo(0, 18 + flicker);
        ctx.lineTo(5, 18);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-14, 18);
    ctx.lineTo(14, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b026ff';
    ctx.shadowColor = '#b026ff';
    ctx.beginPath();
    ctx.arc(0, -2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.fillRect(-16, 8, 6, 8);
    ctx.fillRect(10, 8, 6, 8);

    if (shieldCount > 0) {
        for (let i = 0; i < shieldCount; i++) {
            const radius = 26 + i * 6;
            const alpha = 0.5 - i * 0.12 + Math.sin(Date.now() / 200 + i) * 0.15;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0.1, alpha)})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f0ff';
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawBoostBar() {
    const barW = W - 40;
    const barH = 6;
    const x = 20;
    const y = H - 20;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, barW, barH);

    const fill = (boostFuel / BOOST_MAX) * barW;
    const color = boostFuel > 30 ? '#ffcc00' : '#ff0040';
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillRect(x, y, fill, barH);

    ctx.shadowBlur = 0;
}

/* ================================
   ЛОГИКА
================================ */
function update() {
    if (gameState !== 'playing') return;

    const now = performance.now();
    const dt = Math.min(now - lastFrameTime, 50) / 1000;
    lastFrameTime = now;
    elapsedTime += dt;

    // Замедление роста скорости при улучшении slowStart
    const slowFactor = 1 - getUpgradeLevel('slowStart') * 0.15;
    const scrollSpeed = Math.min(
        BALANCE.maxScrollSpeed,
        BALANCE.startScrollSpeed + elapsedTime * BALANCE.speedUpPerSec * slowFactor
    );

    const currentSpeed = scrollSpeed * (boostActive ? BALANCE.boostMultiplier : 1);

    if (boostActive && boostFuel > 0) {
        boostFuel = Math.max(0, boostFuel - BOOST_USE * dt);
        if (boostFuel <= 0) boostActive = false;
    } else {
        boostFuel = Math.min(BOOST_MAX, boostFuel + BOOST_REGEN * dt);
    }

    const dx = targetX - ship.x;
    const dy = targetY - ship.y;
    ship.x += dx * 0.15;
    ship.y += dy * 0.15;
    ship.tilt = Math.max(-1, Math.min(1, dx / 40));

    if (keys['ArrowLeft'] || keys['a'] || keys['ф']) targetX -= BALANCE.shipSpeed * 2;
    if (keys['ArrowRight'] || keys['d'] || keys['в']) targetX += BALANCE.shipSpeed * 2;
    if (keys['ArrowUp'] || keys['w'] || keys['ц']) targetY -= BALANCE.shipSpeed * 2;
    if (keys['ArrowDown'] || keys['s'] || keys['ы']) targetY += BALANCE.shipSpeed * 2;

    targetX = Math.max(30, Math.min(W - 30, targetX));
    targetY = Math.max(30, Math.min(H - 40, targetY));

    spawnTimer -= dt * 1000;
    if (spawnTimer <= 0) {
        const interval = BALANCE.asteroidSpawnMin +
            Math.random() * (BALANCE.asteroidSpawnMax - BALANCE.asteroidSpawnMin);
        const speedFactor = Math.max(0.5, 1 - elapsedTime * 0.005);
        spawnTimer = interval * speedFactor;

        const roll = Math.random();
        if (roll < BALANCE.powerupSpawnChance) spawnPowerup();
        else if (roll < BALANCE.crystalSpawnChance) spawnCrystal();
        else spawnAsteroid();
    }

    bgStars.forEach(s => {
        s.y += s.speed * (boostActive ? 3 : 1);
        if (s.y > H) {
            s.y = 0;
            s.x = Math.random() * W;
        }
    });

    // Магнит притягивает кристаллы
    if (magnetActive) {
        crystals.forEach(c => {
            const cx = c.x + c.w / 2;
            const cy = c.y + c.h / 2;
            const ddx = ship.x - cx;
            const ddy = ship.y - cy;
            const dist = Math.hypot(ddx, ddy);
            if (dist < 130 && dist > 0) {
                const pull = 0.5;
                c.x += (ddx / dist) * pull;
                c.y += (ddy / dist) * pull;
            }
        });
    }

    asteroids.forEach(a => {
        a.y += currentSpeed * 60 * dt;
        a.x += a.vx * 60 * dt;
        a.rot += a.rotSpeed;
        if (a.x < 10) { a.x = 10; a.vx *= -1; }
        if (a.x > W - a.w - 10) { a.x = W - a.w - 10; a.vx *= -1; }
    });
    asteroids = asteroids.filter(a => a.y < H + 50);

    crystals.forEach(c => {
        c.y += currentSpeed * 60 * dt;
        c.x += c.vx * 60 * dt;
        c.rot += c.rotSpeed;
        if (c.x < 10) { c.x = 10; c.vx *= -1; }
        if (c.x > W - c.w - 10) { c.x = W - c.w - 10; c.vx *= -1; }
    });
    crystals = crystals.filter(c => c.y < H + 50);

    powerups.forEach(p => {
        p.y += currentSpeed * 60 * dt;
        p.x += p.vx * 60 * dt;
    });
    powerups = powerups.filter(p => p.y < H + 50);

    // Астероид vs корабль
    asteroids.forEach(a => {
        const ax = a.x + a.w / 2;
        const ay = a.y + a.h / 2;
        const dist = Math.hypot(ax - ship.x, ay - ship.y);
        if (dist < a.w / 2 + 12) {
            hitShip();
            a.y = H + 100;
            spawnParticles(ax, ay, '#ff2e97', 20);
        }
    });

    // Кристаллы
    crystals = crystals.filter(c => {
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;
        const dist = Math.hypot(cx - ship.x, cy - ship.y);
        if (dist < 24) {
            crystalCount++;
            score += 25;
            crystalsEl.textContent = crystalCount;
            scoreEl.textContent = score;
            spawnParticles(cx, cy, '#00f0ff', 12);
            spawnText(cx, cy, '+25', '#00f0ff');
            return false;
        }
        return true;
    });

    // Бонусы
    powerups = powerups.filter(p => {
        const px = p.x + p.w / 2;
        const py = p.y + p.h / 2;
        const dist = Math.hypot(px - ship.x, py - ship.y);
        if (dist < 26) {
            applyPowerup(p);
            return false;
        }
        return true;
    });

    score += Math.floor(dt * 20 * (boostActive ? 2 : 1));
    scoreEl.textContent = score;

    if (Math.random() < 0.6) {
        particles.push({
            x: ship.x + (Math.random() - 0.5) * 10,
            y: ship.y + 18,
            vx: (Math.random() - 0.5) * 2,
            vy: 3 + Math.random() * 3,
            life: 1,
            size: Math.random() * 3 + 1,
            color: boostActive ? '#ffcc00' : '#00f0ff'
        });
    }

    updateParticles();

    floatingTexts = floatingTexts.filter(t => {
        t.y -= 1.2;
        t.life -= 0.02;
        return t.life > 0;
    });
}

function applyPowerup(p) {
    spawnParticles(p.x + p.w / 2, p.y + p.h / 2, p.color, 20);

    switch (p.type) {
        case 'shield':
            shieldCount = Math.min(shieldCount + 1, BALANCE.shieldMax + getUpgradeLevel('startShield'));
            shieldEl.textContent = shieldCount;
            spawnText(p.x + p.w / 2, p.y, 'ЩИТ +1', '#00f0ff');
            break;
        case 'fuel':
            boostFuel = BOOST_MAX;
            spawnText(p.x + p.w / 2, p.y, 'БУСТ!', '#ffcc00');
            break;
        case 'extra':
            score += 100;
            scoreEl.textContent = score;
            spawnText(p.x + p.w / 2, p.y, '+100', '#ff2e97');
            break;
    }
}

function hitShip() {
    if (shieldCount > 0) {
        shieldCount--;
        shieldEl.textContent = shieldCount;
        spawnParticles(ship.x, ship.y, '#00f0ff', 25);

        canvas.animate([
            { transform: 'translate(0)' },
            { transform: 'translate(-6px, 4px)' },
            { transform: 'translate(6px, -4px)' },
            { transform: 'translate(0)' }
        ], { duration: 200 });

        spawnText(ship.x, ship.y - 40, 'ЩИТ!', '#00f0ff');
        return;
    }

    // Второй шанс
    if (revivesLeft > 0) {
        revivesLeft--;
        spawnParticles(ship.x, ship.y, '#ff2e97', 40);

        // Очищаем всё вокруг
        asteroids.forEach(a => {
            const ax = a.x + a.w / 2;
            const ay = a.y + a.h / 2;
            const dist = Math.hypot(ax - ship.x, ay - ship.y);
            if (dist < 200) {
                a.y = H + 100;
                spawnParticles(ax, ay, '#ff2e97', 15);
            }
        });

        spawnText(ship.x, ship.y - 60, '❤️ ВТОРОЙ ШАНС!', '#ff2e97');

        // Восстанавливаем немного топлива
        boostFuel = BOOST_MAX;

        // Даём временный щит
        shieldCount = Math.max(shieldCount, 1);
        shieldEl.textContent = shieldCount;

        canvas.animate([
            { transform: 'translate(0) scale(1)' },
            { transform: 'translate(-10px, 8px) scale(1.05)' },
            { transform: 'translate(10px, -8px) scale(1.05)' },
            { transform: 'translate(0) scale(1)' }
        ], { duration: 500 });

        return;
    }

    // Game over
    spawnParticles(ship.x, ship.y, '#ff2e97', 40);
    spawnParticles(ship.x, ship.y, '#ffcc00', 30);

    canvas.animate([
        { transform: 'translate(0)' },
        { transform: 'translate(-12px, 8px)' },
        { transform: 'translate(12px, -8px)' },
        { transform: 'translate(-8px, -8px)' },
        { transform: 'translate(0)' }
    ], { duration: 400 });

    gameOver();
}

/* ================================
   ЦИКЛ
================================ */
function loop() {
    if (gameState !== 'playing') return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
}

/* ================================
   СОСТОЯНИЯ
================================ */
function startGame() {
    initGame();
    gameState = 'playing';
    overlay.classList.add('hidden');
    if (animId) cancelAnimationFrame(animId);
    loop();
}

function gameOver() {
    gameState = 'gameover';
    if (animId) cancelAnimationFrame(animId);

    // Начисляем кристаллы в банк
    bankCrystals += crystalCount;
    localStorage.setItem('spaceBankCrystals', bankCrystals);
    updateShopUI();

    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('spaceHighScore', highScore);
        overlayTitle.textContent = '🏆 НОВЫЙ РЕКОРД!';
    } else {
        overlayTitle.textContent = 'КОРАБЛЬ УНИЧТОЖЕН';
    }

    overlayText.innerHTML =
        `Счёт: ${score}<br>💎 Собрано: ${crystalCount}<br>💰 Банк: ${bankCrystals}`;

    startBtn.textContent = '↻ ЗАНОВО';
    overlay.classList.remove('hidden');

    if (window.Achievements) {
        window.Achievements.registerGame('space');
        if (crystalCount >= 50)  window.Achievements.unlock('spaceCrystal50');
        if (crystalCount >= 500) window.Achievements.unlock('spaceCrystal500');
    }
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        overlayTitle.textContent = 'ПАУЗА';
        overlayText.textContent = 'Нажми, чтобы продолжить';
        startBtn.textContent = '▶ ПРОДОЛЖИТЬ';
        overlay.classList.remove('hidden');
        if (animId) cancelAnimationFrame(animId);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        lastFrameTime = performance.now();
        overlay.classList.add('hidden');
        loop();
    }
}

/* ================================
   УПРАВЛЕНИЕ
================================ */
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    const key = e.key.toLowerCase();

    // Если магазин открыт — не управляем игрой
    if (!shopModal.classList.contains('hidden')) return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') startGame();
        else if (gameState === 'playing') boostActive = true;
        else pauseGame();
    }

    if (key === 'p') {
        if (gameState === 'playing' || gameState === 'paused') pauseGame();
    }

    if (key === 'r') {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.code === 'Space') boostActive = false;
});

function moveShipTo(clientX, clientY) {
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    targetX = Math.max(30, Math.min(W - 30, x * scaleX));
    targetY = Math.max(30, Math.min(H - 40, y * scaleY));
}

let isDragging = false;

wrapper.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing') return;
    isDragging = true;
    moveShipTo(e.clientX, e.clientY);
});

wrapper.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    moveShipTo(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

wrapper.addEventListener('touchstart', (e) => {
    if (gameState === 'idle' || gameState === 'gameover') {
        startGame();
        return;
    }
    if (gameState !== 'playing') return;
    e.preventDefault();
    const t = e.touches[0];
    moveShipTo(t.clientX, t.clientY);
}, { passive: false });

wrapper.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        const t = e.touches[0];
        moveShipTo(t.clientX, t.clientY);
    }
}, { passive: false });

/* ================================
   КНОПКИ УПРАВЛЕНИЯ
================================ */
let holdingUp = false;
let holdingDown = false;

upBtn.addEventListener('mousedown', (e) => { e.preventDefault(); holdingUp = true; });
upBtn.addEventListener('mouseup', () => { holdingUp = false; });
upBtn.addEventListener('mouseleave', () => { holdingUp = false; });

downBtn.addEventListener('mousedown', (e) => { e.preventDefault(); holdingDown = true; });
downBtn.addEventListener('mouseup', () => { holdingDown = false; });
downBtn.addEventListener('mouseleave', () => { holdingDown = false; });

upBtn.addEventListener('touchstart', (e) => { e.preventDefault(); holdingUp = true; }, { passive: false });
upBtn.addEventListener('touchend', () => { holdingUp = false; });
downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); holdingDown = true; }, { passive: false });
downBtn.addEventListener('touchend', () => { holdingDown = false; });

const origUpdate = update;
update = function() {
    if (gameState === 'playing') {
        if (holdingUp) targetY -= BALANCE.shipSpeed * 2;
        if (holdingDown) targetY += BALANCE.shipSpeed * 2;
        targetY = Math.max(30, Math.min(H - 40, targetY));
    }
    origUpdate();
};

boostBtn.addEventListener('mousedown', (e) => { e.preventDefault(); boostActive = true; });
boostBtn.addEventListener('mouseup', () => { boostActive = false; });
boostBtn.addEventListener('mouseleave', () => { boostActive = false; });

boostBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    boostActive = true;
}, { passive: false });
boostBtn.addEventListener('touchend', () => { boostActive = false; });

startBtn.addEventListener('click', () => {
    if (gameState === 'paused') pauseGame();
    else startGame();
});

wrapper.addEventListener('contextmenu', (e) => e.preventDefault());
wrapper.addEventListener('gesturestart', (e) => e.preventDefault());

/* ================================
   СТАРТ
================================ */
initGame();
draw();
updateShopUI();