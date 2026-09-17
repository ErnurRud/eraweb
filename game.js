/* ================================
   ЗВЁЗДЫ НА ФОНЕ
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
            color: Math.random() > 0.5 ? '#00f0ff' : '#ff2e97'
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
   ИГРА "ЧЕРВЯК"
================================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvasWrapper');

const GRID = 20;
const CELL = canvas.width / GRID;

let snake, dir, nextDir, food, score, highScore, level, speed;
let gameState = 'idle'; // idle | playing | paused | gameover
let lastMove = 0;
let gameLoopId = null;
let particles = [];

// DOM
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');

// Рекорд из localStorage
highScore = parseInt(localStorage.getItem('wormHighScore') || '0');
highScoreEl.textContent = highScore;

/* ================================
   ИНИЦИАЛИЗАЦИЯ
================================ */
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    level = 1;
    speed = 150;
    particles = [];

    scoreEl.textContent = score;
    levelEl.textContent = level;

    spawnFood();
    draw();
}

/* ================================
   ЕДА
================================ */
function spawnFood() {
    let newFood;
    let tries = 0;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID)
        };
        tries++;
    } while (snake.some(s => s.x === newFood.x && s.y === newFood.y) && tries < 100);

    food = newFood;
}

/* ================================
   ЧАСТИЦЫ
================================ */
function spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x * CELL + CELL / 2,
            y: y * CELL + CELL / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= 0.03;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

/* ================================
   ОТРИСОВКА
================================ */
function draw() {
    // Фон
    ctx.fillStyle = '#12122a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(canvas.width, i * CELL);
        ctx.stroke();
    }

    // Еда (пульсирующая)
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
    const foodSize = CELL * 0.75 * pulse;
    const foodOffset = (CELL - foodSize) / 2;

    ctx.fillStyle = '#ff2e97';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff2e97';
    ctx.fillRect(
        food.x * CELL + foodOffset,
        food.y * CELL + foodOffset,
        foodSize,
        foodSize
    );

    // Червь (круглые сегменты)
    snake.forEach((seg, i) => {
        const isHead = i === 0;
        const cx = seg.x * CELL + CELL / 2;
        const cy = seg.y * CELL + CELL / 2;
        const radius = CELL * (isHead ? 0.48 : 0.42);

        ctx.fillStyle = isHead ? '#39ff14' : '#00f0ff';
        ctx.shadowBlur = isHead ? 20 : 12;
        ctx.shadowColor = isHead ? '#39ff14' : '#00f0ff';

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Глаза на голове
        if (isHead) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0a1a';
            const eyeSize = CELL * 0.14;
            const eyeDist = CELL * 0.18;
            let ex1, ey1, ex2, ey2;

            // Позиция глаз в зависимости от направления
            if (dir.x === 1) {
                ex1 = cx + eyeDist - eyeSize / 2;
                ey1 = cy - eyeDist - eyeSize / 2;
                ex2 = cx + eyeDist - eyeSize / 2;
                ey2 = cy + eyeDist - eyeSize / 2;
            } else if (dir.x === -1) {
                ex1 = cx - eyeDist - eyeSize / 2;
                ey1 = cy - eyeDist - eyeSize / 2;
                ex2 = cx - eyeDist - eyeSize / 2;
                ey2 = cy + eyeDist - eyeSize / 2;
            } else if (dir.y === -1) {
                ex1 = cx - eyeDist - eyeSize / 2;
                ey1 = cy - eyeDist - eyeSize / 2;
                ex2 = cx + eyeDist - eyeSize / 2;
                ey2 = cy - eyeDist - eyeSize / 2;
            } else {
                ex1 = cx - eyeDist - eyeSize / 2;
                ey1 = cy + eyeDist - eyeSize / 2;
                ex2 = cx + eyeDist - eyeSize / 2;
                ey2 = cy + eyeDist - eyeSize / 2;
            }

            ctx.beginPath();
            ctx.arc(ex1 + eyeSize / 2, ey1 + eyeSize / 2, eyeSize / 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex2 + eyeSize / 2, ey2 + eyeSize / 2, eyeSize / 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Частицы
    drawParticles();

    ctx.shadowBlur = 0;
}

/* ================================
   ИГРОВОЙ ЦИКЛ
================================ */
function update() {
    dir = { ...nextDir };

    const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    };

    // Стены
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        gameOver();
        return;
    }

    // Себя
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Съел еду
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;

        spawnParticles(food.x, food.y, '#ff2e97');

        if (score % 50 === 0) {
            level++;
            levelEl.textContent = level;
            speed = Math.max(60, speed - 12);
            restartLoop();
        }

        spawnFood();
    } else {
        snake.pop();
    }

    draw();
}

function loop(timestamp) {
    if (gameState !== 'playing') return;

    if (timestamp - lastMove >= speed) {
        update();
        lastMove = timestamp;
    }

    // Анимация частиц идёт всегда
    updateParticles();
    draw();

    gameLoopId = requestAnimationFrame(loop);
}

function restartLoop() {
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    lastMove = 0;
    gameLoopId = requestAnimationFrame(loop);
}

/* ================================
   СОСТОЯНИЯ
================================ */
function startGame() {
    initGame();
    gameState = 'playing';
    overlay.classList.add('hidden');
    restartLoop();
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        overlayTitle.textContent = 'ПАУЗА';
        overlayText.textContent = 'Нажми, чтобы продолжить';
        startBtn.textContent = '▶ ПРОДОЛЖИТЬ';
        overlay.classList.remove('hidden');
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        overlay.classList.add('hidden');
        restartLoop();
    }
}

function gameOver() {
    gameState = 'gameover';
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('wormHighScore', highScore);
        overlayTitle.textContent = '🏆 РЕКОРД!';
    } else {
        overlayTitle.textContent = 'ИГРА ОКОНЧЕНА';
    }

    overlayText.textContent = `Счёт: ${score} | Рекорд: ${highScore}`;
    startBtn.textContent = '↻ ЗАНОВО';
    overlay.classList.remove('hidden');

    // Глитч-эффект
    canvas.animate([
        { transform: 'translate(0)' },
        { transform: 'translate(-8px, 4px)' },
        { transform: 'translate(8px, -4px)' },
        { transform: 'translate(-4px, -4px)' },
        { transform: 'translate(0)' }
    ], { duration: 400, easing: 'ease-out' });

    // 🏆 Достижения
    if (window.Achievements) {
        window.Achievements.registerGame('snake');
        if (score >= 10)  window.Achievements.unlock('snakeScore10');
        if (score >= 50)  window.Achievements.unlock('snakeScore50');
        if (score >= 100) window.Achievements.unlock('snakeScore100');
    }
}

/* ================================
   УПРАВЛЕНИЕ НАПРАВЛЕНИЕМ
================================ */
function setDirection(newDir) {
    if (dir.x === -newDir.x && dir.y === -newDir.y) return;
    if (dir.x === newDir.x && dir.y === newDir.y) return;
    nextDir = newDir;
}

/* ================================
   КЛАВИАТУРА
================================ */
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') startGame();
        else pauseGame();
        return;
    }

    if (key === 'r') {
        startGame();
        return;
    }

    if (gameState !== 'playing') return;

    switch (key) {
        case 'arrowup':
        case 'w':
        case 'ц':
            e.preventDefault();
            setDirection({ x: 0, y: -1 });
            break;
        case 'arrowdown':
        case 's':
        case 'ы':
            e.preventDefault();
            setDirection({ x: 0, y: 1 });
            break;
        case 'arrowleft':
        case 'a':
        case 'ф':
            e.preventDefault();
            setDirection({ x: -1, y: 0 });
            break;
        case 'arrowright':
        case 'd':
        case 'в':
            e.preventDefault();
            setDirection({ x: 1, y: 0 });
            break;
    }
});

/* ================================
   👆 СВАЙПЫ (главное для телефона!)
================================ */
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchMoved = false;
const SWIPE_THRESHOLD = 25;  // минимальная длина свайпа (px)
const TAP_MAX_TIME = 250;    // тап = быстрый (мс)
const TAP_MAX_MOVE = 15;     // тап = без движения (px)

wrapper.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    touchMoved = false;
}, { passive: true });

wrapper.addEventListener('touchmove', (e) => {
    // Предотвращаем скролл страницы при игре
    e.preventDefault();
}, { passive: false });

wrapper.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // ТАП (быстрый и без движения) — пауза / старт
    if (dist < TAP_MAX_MOVE && dt < TAP_MAX_TIME) {
        if (gameState === 'idle' || gameState === 'gameover') {
            startGame();
        } else {
            pauseGame();
        }
        return;
    }

    // СВАЙП — только если играем
    if (gameState !== 'playing') return;

    if (dist < SWIPE_THRESHOLD) return;

    // Определяем направление (по большей оси)
    if (Math.abs(dx) > Math.abs(dy)) {
        // Горизонтальный свайп
        if (dx > 0) setDirection({ x: 1, y: 0 });
        else setDirection({ x: -1, y: 0 });
    } else {
        // Вертикальный свайп
        if (dy > 0) setDirection({ x: 0, y: 1 });
        else setDirection({ x: 0, y: -1 });
    }
}, { passive: true });

/* Также поддержим мышь для десктопа (drag) */
let mouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;

wrapper.addEventListener('mousedown', (e) => {
    mouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
});

wrapper.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    mouseDown = false;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (gameState !== 'playing' || dist < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) setDirection({ x: 1, y: 0 });
        else setDirection({ x: -1, y: 0 });
    } else {
        if (dy > 0) setDirection({ x: 0, y: 1 });
        else setDirection({ x: 0, y: -1 });
    }
});

// Отпускаем мышь за пределами поля
document.addEventListener('mouseup', () => {
    mouseDown = false;
});

/* ================================
   КНОПКА СТАРТА
================================ */
startBtn.addEventListener('click', () => {
    if (gameState === 'paused') {
        pauseGame();
    } else {
        startGame();
    }
});

/* ================================
   МОБИЛЬНЫЕ КНОПКИ
================================ */
document.querySelectorAll('.arrow').forEach(btn => {
    const dir = btn.dataset.dir;

    // Убираем задержку тапа
    const handler = (e) => {
        e.preventDefault();

        if (dir === 'pause') {
            if (gameState === 'idle' || gameState === 'gameover') startGame();
            else pauseGame();
            return;
        }

        if (gameState !== 'playing') return;

        switch (dir) {
            case 'up': setDirection({ x: 0, y: -1 }); break;
            case 'down': setDirection({ x: 0, y: 1 }); break;
            case 'left': setDirection({ x: -1, y: 0 }); break;
            case 'right': setDirection({ x: 1, y: 0 }); break;
        }
    };

    btn.addEventListener('touchstart', handler, { passive: false });
    btn.addEventListener('click', handler);
});

/* ================================
   ЗАПРЕТ СКРОЛЛА/ЗУМА НА ПОЛЕ
================================ */
wrapper.addEventListener('gesturestart', (e) => e.preventDefault());
wrapper.addEventListener('contextmenu', (e) => e.preventDefault());

/* ================================
   СТАРТ
================================ */
initGame();
draw();