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
            color: Math.random() > 0.5 ? '#00f0ff' : '#39ff14'
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
   ALIEN INVASION
================================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvasWrapper');

const W = canvas.width;
const H = canvas.height;

let ship, aliens, bullets, alienBullets, particles, stars2, bonuses;
let score, highScore, wave, lives;
let gameState = 'idle';
let alienDir, alienSpeed, alienShootTimer;
let keys = {};
let animId = null;

// Таймеры бонусов (в мс)
let rapidFireTime = 0;
let shieldTime = 0;
let tripleTime = 0;

// Автострельба
let autoFireTimer = 0;
let lastManualShot = 0;

// DOM
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const waveEl = document.getElementById('wave');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');
const fireBtn = document.getElementById('fireBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Теги бонусов
const tagRapid = document.getElementById('tagRapid');
const tagShield = document.getElementById('tagShield');
const tagTriple = document.getElementById('tagTriple');
const rapidTimeEl = document.getElementById('rapidTime');
const shieldTimeEl = document.getElementById('shieldTime');
const tripleTimeEl = document.getElementById('tripleTime');

highScore = parseInt(localStorage.getItem('alienHighScore') || '0');
highScoreEl.textContent = highScore;

/* ================================
   ⚖️ БАЛАНС — настраивай тут!
================================ */
const BALANCE = {
    shipSpeed: 6,                 // скорость корабля клавиатурой
    bulletSpeed: 10,              // скорость пули
    autoFireDelay: 180,           // автострельба каждые N мс (было = только ручная)
    manualFireDelay: 130,         // ручной выстрел (быстрее авто)

    alienStartSpeed: 0.25,        // ⚖️ старт НЛО — медленно
    alienSpeedPerWave: 0.04,      // плавный рост за волну
    alienSpeedPerHit: 0.01,       // плавный рост при ударе о стену
    alienShootBase: 100,          // как часто стреляют НЛО (больше = реже)
    alienBulletSpeed: 2,          // скорость пули врага

    bonusChance: 0.12,            // 12% шанс бонуса за убитого
    bonusFallSpeed: 1.2,          // скорость падения бонусов
    bonusDuration: 8000,          // длительность бонуса (мс)
};

/* ================================
   БОНУСЫ
================================ */
const BONUS_TYPES = [
    { emoji: '❤️', type: 'life',    color: '#ff2e97', label: 'ЖИЗНЬ' },
    { emoji: '⚡', type: 'rapid',   color: '#ffcc00', label: 'СКОРОСТРЕЛ' },
    { emoji: '🛡️', type: 'shield',  color: '#00f0ff', label: 'ЩИТ' },
    { emoji: '🔫', type: 'triple',  color: '#b026ff', label: 'ТРОЙНОЙ' },
    { emoji: '💣', type: 'bomb',    color: '#ff0040', label: 'БОМБА' },
];

function randomBonusType() {
    // Жизнь реже
    const weights = [1, 3, 2, 2, 1]; // life:1, rapid:3, shield:2, triple:2, bomb:1
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < BONUS_TYPES.length; i++) {
        r -= weights[i];
        if (r <= 0) return BONUS_TYPES[i];
    }
    return BONUS_TYPES[0];
}

function spawnBonus(x, y) {
    const type = randomBonusType();
    bonuses.push({
        x: x,
        y: y,
        w: 24,
        h: 24,
        vy: BALANCE.bonusFallSpeed,
        type: type.type,
        emoji: type.emoji,
        color: type.color,
        label: type.label,
        wobble: Math.random() * Math.PI * 2
    });
}

function applyBonus(bonus) {
    spawnParticles(bonus.x, bonus.y, bonus.color, 20);

    // Всплывающий текст
    floatingTexts.push({
        x: bonus.x,
        y: bonus.y,
        text: bonus.label,
        color: bonus.color,
        life: 1
    });

    switch (bonus.type) {
        case 'life':
            lives = Math.min(lives + 1, 5);
            livesEl.textContent = lives;
            break;
        case 'rapid':
            rapidFireTime = BALANCE.bonusDuration;
            break;
        case 'shield':
            shieldTime = BALANCE.bonusDuration;
            break;
        case 'triple':
            tripleTime = BALANCE.bonusDuration;
            break;
        case 'bomb':
            // Уничтожаем всех пришельцев на экране
            aliens.forEach(a => {
                if (a.alive) {
                    a.alive = false;
                    score += a.points;
                    spawnParticles(a.x + a.w / 2, a.y + a.h / 2, '#ff0040', 12);
                }
            });
            scoreEl.textContent = score;
            // Глитч
            canvas.animate([
                { transform: 'translate(0)' },
                { transform: 'translate(-8px, 8px)' },
                { transform: 'translate(8px, -8px)' },
                { transform: 'translate(0)' }
            ], { duration: 400 });
            break;
    }
}

let floatingTexts = [];

/* ================================
   ИНИЦИАЛИЗАЦИЯ
================================ */
function initGame() {
    ship = {
        x: W / 2,
        y: H - 50,
        w: 32,
        h: 24,
        speed: BALANCE.shipSpeed
    };

    aliens = [];
    bullets = [];
    alienBullets = [];
    particles = [];
    bonuses = [];
    floatingTexts = [];
    stars2 = [];

    score = 0;
    wave = 1;
    lives = 3;
    alienDir = 1;
    alienSpeed = BALANCE.alienStartSpeed;
    alienShootTimer = 0;

    rapidFireTime = 0;
    shieldTime = 0;
    tripleTime = 0;
    autoFireTimer = 0;
    lastManualShot = 0;

    scoreEl.textContent = score;
    waveEl.textContent = wave;
    livesEl.textContent = lives;

    updatePowerupTags();

    for (let i = 0; i < 30; i++) {
        stars2.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.3 + 0.1
        });
    }

    spawnWave();
}

function spawnWave() {
    aliens = [];
    const rows = Math.min(3 + Math.floor(wave / 2), 5);
    const cols = 8;
    const startX = 40;
    const startY = 50;
    const gapX = (W - startX * 2) / (cols - 1);
    const gapY = 42;

    const emojis = ['👾', '👽', '🛸', '🤖', '👹'];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            aliens.push({
                x: startX + c * gapX,
                y: startY + r * gapY,
                w: 26,
                h: 26,
                emoji: emojis[r % emojis.length],
                alive: true,
                row: r,
                hp: r === 0 ? 2 : 1,
                points: (rows - r) * 10
            });
        }
    }

    alienDir = 1;
    alienSpeed = BALANCE.alienStartSpeed + (wave - 1) * BALANCE.alienSpeedPerWave;
    alienShootTimer = 0;
    if (window.Achievements) {
        window.Achievements.registerGame('alien');
        if (wave >= 5)  window.Achievements.unlock('alienWave5');
        if (wave >= 10) window.Achievements.unlock('alienWave10');
    }
}

/* ================================
   HUD БОНУСОВ
================================ */
function updatePowerupTags() {
    if (rapidFireTime > 0) {
        tagRapid.classList.remove('hidden');
        rapidTimeEl.textContent = Math.ceil(rapidFireTime / 1000);
    } else {
        tagRapid.classList.add('hidden');
    }

    if (shieldTime > 0) {
        tagShield.classList.remove('hidden');
        shieldTimeEl.textContent = Math.ceil(shieldTime / 1000);
    } else {
        tagShield.classList.add('hidden');
    }

    if (tripleTime > 0) {
        tagTriple.classList.remove('hidden');
        tripleTimeEl.textContent = Math.ceil(tripleTime / 1000);
    } else {
        tagTriple.classList.add('hidden');
    }
}

/* ================================
   ОТРИСОВКА
================================ */
function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    // Звёзды-параллакс
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    stars2.forEach(s => {
        s.y += s.speed;
        if (s.y > H) {
            s.y = 0;
            s.x = Math.random() * W;
        }
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Пришельцы
    aliens.forEach(a => {
        if (!a.alive) return;
        ctx.font = `${a.w}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 15;
        ctx.shadowColor = a.hp > 1 ? '#ffcc00' : '#39ff14';
        ctx.fillText(a.emoji, a.x + a.w / 2, a.y + a.h / 2);

        if (a.hp > 1) {
            ctx.fillStyle = '#ffcc00';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffcc00';
            ctx.fillRect(a.x + 2, a.y - 4, (a.w - 4) * (a.hp / 2), 2);
        }
    });

    // Пули игрока
    bullets.forEach(b => {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';
        ctx.fillRect(b.x - 1.5, b.y, 3, 12);
    });

    // Пули врагов
    alienBullets.forEach(b => {
        ctx.fillStyle = '#ff2e97';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff2e97';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Бонусы
    bonuses.forEach(b => {
        const wobble = Math.sin(Date.now() / 200 + b.wobble) * 3;
        ctx.font = `${b.w}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = b.color;

        // Свечение-круг
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2 + wobble, 16, 0, Math.PI * 2);
        ctx.fillStyle = b.color + '33'; // полупрозрачный
        ctx.fill();

        ctx.fillText(b.emoji, b.x + b.w / 2, b.y + b.h / 2 + wobble);
    });

    drawShip();

    // Частицы
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Всплывающие тексты
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

    // Земля
    ctx.fillStyle = '#39ff14';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#39ff14';
    ctx.fillRect(0, H - 8, W, 2);
    ctx.shadowBlur = 0;
}

function drawShip() {
    const x = ship.x;
    const y = ship.y;

    // Щит (если активен)
    if (shieldTime > 0) {
        const shieldAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y + 4, 34, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f0ff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y + 4, 34, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${shieldAlpha * 0.15})`;
        ctx.fill();
    }

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#39ff14';

    ctx.fillStyle = '#39ff14';
    ctx.fillRect(x - 14, y + 4, 28, 10);

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.fillRect(x - 6, y - 4, 12, 8);

    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.fillRect(x - 2, y - 12, 4, 10);

    ctx.fillRect(x - 18, y + 8, 6, 8);
    ctx.fillRect(x + 12, y + 8, 6, 8);

    ctx.shadowBlur = 0;
}

/* ================================
   ЧАСТИЦЫ
================================ */
function spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            size: Math.random() * 3 + 2,
            color: color
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

    floatingTexts = floatingTexts.filter(t => {
        t.y -= 1;
        t.life -= 0.02;
        return t.life > 0;
    });
}

/* ================================
   ВЫСТРЕЛ
================================ */
function fire(isManual = false) {
    if (gameState !== 'playing') return;

    if (isManual) {
        const now = performance.now();
        const delay = rapidFireTime > 0 ? 80 : BALANCE.manualFireDelay;
        if (now - lastManualShot < delay) return;
        lastManualShot = now;
    }

    const speed = BALANCE.bulletSpeed;

    if (tripleTime > 0) {
        // Тройной выстрел
        bullets.push({ x: ship.x, y: ship.y - 14, vy: speed });
        bullets.push({ x: ship.x - 10, y: ship.y - 10, vy: speed, vx: -1.5 });
        bullets.push({ x: ship.x + 10, y: ship.y - 10, vy: speed, vx: 1.5 });
    } else {
        bullets.push({ x: ship.x, y: ship.y - 14, vy: speed });
    }

    spawnParticles(ship.x, ship.y - 12, '#00f0ff', 2);
}

/* ================================
   ЛОГИКА
================================ */
let lastFrameTime = performance.now();

function update() {
    if (gameState !== 'playing') return;

    const now = performance.now();
    const dt = Math.min(now - lastFrameTime, 50); // мс, ограничим
    lastFrameTime = now;

    // Движение корабля (клавиатура)
    if (keys['ArrowLeft'] || keys['a'] || keys['ф']) {
        ship.x -= ship.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['в']) {
        ship.x += ship.speed;
    }
    ship.x = Math.max(20, Math.min(W - 20, ship.x));

    // Таймеры бонусов
    if (rapidFireTime > 0) rapidFireTime = Math.max(0, rapidFireTime - dt);
    if (shieldTime > 0) shieldTime = Math.max(0, shieldTime - dt);
    if (tripleTime > 0) tripleTime = Math.max(0, tripleTime - dt);
    updatePowerupTags();

    // Автострельба
    autoFireTimer += dt;
    const fireDelay = rapidFireTime > 0 ? 80 : BALANCE.autoFireDelay;
    if (autoFireTimer >= fireDelay) {
        autoFireTimer = 0;
        fire(false);
    }

    // Пули игрока
    bullets = bullets.filter(b => {
        b.y -= b.vy;
        if (b.vx) b.x += b.vx;
        return b.y > -20 && b.x > -20 && b.x < W + 20;
    });

    // Пули врагов
    alienBullets = alienBullets.filter(b => {
        b.y += b.vy;
        return b.y < H + 20;
    });

    // Живые пришельцы
    let aliveAliens = aliens.filter(a => a.alive);

    if (aliveAliens.length === 0) {
        wave++;
        waveEl.textContent = wave;
        spawnWave();
        return;
    }

    // Движение НЛО
    let hitEdge = false;
    aliveAliens.forEach(a => {
        a.x += alienDir * alienSpeed;
        if (a.x + a.w > W - 10 || a.x < 10) hitEdge = true;
    });

    if (hitEdge) {
        alienDir *= -1;
        aliveAliens.forEach(a => a.y += 12);
        alienSpeed += BALANCE.alienSpeedPerHit;
    }

    // Стрельба врагов
    alienShootTimer++;
    const shootDelay = Math.max(40, BALANCE.alienShootBase - wave * 4);
    if (alienShootTimer > shootDelay && aliveAliens.length > 0) {
        alienShootTimer = 0;
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        alienBullets.push({
            x: shooter.x + shooter.w / 2,
            y: shooter.y + shooter.h,
            vy: BALANCE.alienBulletSpeed + wave * 0.1
        });
    }

    // Пуля игрока vs пришелец
    bullets.forEach(b => {
        aliens.forEach(a => {
            if (!a.alive) return;
            if (
                b.x > a.x && b.x < a.x + a.w &&
                b.y > a.y && b.y < a.y + a.h
            ) {
                b.y = -100;
                a.hp--;
                if (a.hp <= 0) {
                    a.alive = false;
                    score += a.points;
                    scoreEl.textContent = score;
                    spawnParticles(a.x + a.w / 2, a.y + a.h / 2, '#39ff14', 15);

                    // Шанс выпадения бонуса
                    if (Math.random() < BALANCE.bonusChance) {
                        spawnBonus(a.x + a.w / 2 - 12, a.y);
                    }
                } else {
                    spawnParticles(a.x + a.w / 2, a.y + a.h / 2, '#ffcc00', 6);
                }
            }
        });
    });

    // Бонусы падают
    bonuses = bonuses.filter(b => {
        b.y += b.vy;
        return b.y < H + 30;
    });

    // Подбор бонусов
    bonuses = bonuses.filter(b => {
        if (
            b.x + b.w > ship.x - 20 && b.x < ship.x + 20 &&
            b.y + b.h > ship.y - 16 && b.y < ship.y + 24
        ) {
            applyBonus(b);
            return false;
        }
        return true;
    });

    // Пуля врага vs корабль
    alienBullets.forEach(b => {
        if (
            b.x > ship.x - 18 && b.x < ship.x + 18 &&
            b.y > ship.y - 12 && b.y < ship.y + 20
        ) {
            b.y = H + 100;
            hitShip();
        }
    });

    // Пришелец vs корабль
    aliens.forEach(a => {
        if (!a.alive) return;
        if (
            a.x + a.w > ship.x - 18 && a.x < ship.x + 18 &&
            a.y + a.h > ship.y - 12 && a.y < ship.y + 20
        ) {
            a.alive = false;
            spawnParticles(ship.x, ship.y, '#ff0040', 20);
            hitShip();
        }
    });

    // Пришелец у земли
    aliens.forEach(a => {
        if (a.alive && a.y + a.h > H - 20) {
            gameOver();
        }
    });

    updateParticles();
}

function hitShip() {
    // Если щит — не теряем жизнь
    if (shieldTime > 0) {
        spawnParticles(ship.x, ship.y, '#00f0ff', 15);
        // Отбрасываем щит немного
        shieldTime = Math.max(0, shieldTime - 1000);
        return;
    }

    lives--;
    livesEl.textContent = lives;

    spawnParticles(ship.x, ship.y, '#ff2e97', 25);

    canvas.animate([
        { transform: 'translate(0)' },
        { transform: 'translate(-10px, 6px)' },
        { transform: 'translate(10px, -6px)' },
        { transform: 'translate(-6px, -6px)' },
        { transform: 'translate(0)' }
    ], { duration: 300 });

    if (lives <= 0) {
        gameOver();
    }
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
    lastFrameTime = performance.now();
    gameState = 'playing';
    overlay.classList.add('hidden');
    if (animId) cancelAnimationFrame(animId);
    loop();
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

function gameOver() {
    gameState = 'gameover';
    if (animId) cancelAnimationFrame(animId);

    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('alienHighScore', highScore);
        overlayTitle.textContent = '🏆 НОВЫЙ РЕКОРД!';
    } else {
        overlayTitle.textContent = 'ЗЕМЛЯ ПАЛА...';
    }

    overlayText.textContent = `Счёт: ${score} | Волна: ${wave}`;
    startBtn.textContent = '↻ ЗАНОВО';
    overlay.classList.remove('hidden');
}

/* ================================
   УПРАВЛЕНИЕ — КЛАВИАТУРА
================================ */
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    const key = e.key.toLowerCase();

    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') startGame();
        else if (gameState === 'playing') fire(true);
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
});

/* ================================
   УПРАВЛЕНИЕ — МЫШЬ (десктоп)
================================ */
function moveShipTo(clientX) {
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const scale = W / rect.width;
    ship.x = Math.max(20, Math.min(W - 20, x * scale));
}

let isDragging = false;

wrapper.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing') return;
    isDragging = true;
    moveShipTo(e.clientX);
});

wrapper.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    moveShipTo(e.clientX);
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

/* ================================
   УПРАВЛЕНИЕ — ТАЧ
================================ */
wrapper.addEventListener('touchstart', (e) => {
    if (gameState === 'idle' || gameState === 'gameover') {
        startGame();
        return;
    }
    if (gameState !== 'playing') return;
    e.preventDefault();
    moveShipTo(e.touches[0].clientX);
}, { passive: false });

wrapper.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState === 'playing') moveShipTo(e.touches[0].clientX);
}, { passive: false });

/* ================================
   КНОПКИ
================================ */
// ОГОНЬ (ручной выстрел)
fireBtn.addEventListener('click', () => fire(true));
fireBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    fire(true);
}, { passive: false });

// Влево / Вправо (кнопки двигают корабль, пока зажаты)
let holdingLeft = false;
let holdingRight = false;

function startHold(direction) {
    if (direction === 'left') holdingLeft = true;
    else holdingRight = true;
}

function stopHold() {
    holdingLeft = false;
    holdingRight = false;
}

// Мышь
leftBtn.addEventListener('mousedown', (e) => { e.preventDefault(); startHold('left'); });
rightBtn.addEventListener('mousedown', (e) => { e.preventDefault(); startHold('right'); });
document.addEventListener('mouseup', stopHold);

// Тач
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startHold('left');
}, { passive: false });
leftBtn.addEventListener('touchend', stopHold);

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startHold('right');
}, { passive: false });
rightBtn.addEventListener('touchend', stopHold);

// Применяем движение от кнопок в игровом цикле — добавим проверку в update
// (см. правку ниже — используем глобальные флаги)
const originalUpdate = update;
update = function() {
    originalUpdate();
    if (gameState === 'playing') {
        if (holdingLeft) ship.x = Math.max(20, ship.x - ship.speed * 1.5);
        if (holdingRight) ship.x = Math.min(W - 20, ship.x + ship.speed * 1.5);
    }
};

// Старт
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