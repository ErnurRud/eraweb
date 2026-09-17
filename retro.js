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
   ПЕРЕКЛЮЧЕНИЕ ИГР
================================ */
const gameMenu = document.getElementById('gameMenu');
const gameArea = document.getElementById('gameArea');
const gameTitle = document.getElementById('gameTitle');
const closeBtn = document.getElementById('closeGame');

const panels = {
    breakout: document.getElementById('panel-breakout'),
    memory: document.getElementById('panel-memory'),
    reaction: document.getElementById('panel-reaction')
};

const titles = {
    breakout: 'BREAKOUT',
    memory: 'MEMORY',
    reaction: 'REACTION'
};

let currentGame = null;

function openGame(name) {
    if (window.Achievements) {
        window.Achievements.registerGame('retro');
    }
    currentGame = name;
    gameMenu.style.display = 'none';
    gameArea.classList.remove('hidden');
    gameTitle.textContent = titles[name];

    Object.keys(panels).forEach(k => {
        panels[k].classList.toggle('hidden', k !== name);
    });

    if (name === 'breakout') Breakout.init();
    if (name === 'memory') Memory.init();
    if (name === 'reaction') Reaction.init();
}

function closeGame() {
    currentGame = null;
    gameArea.classList.add('hidden');
    gameMenu.style.display = 'grid';

    Breakout.stop();
    Memory.stop();
    Reaction.stop();
}

document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('click', () => openGame(card.dataset.game));
});

closeBtn.addEventListener('click', closeGame);

/* ================================
   ИГРА 1: BREAKOUT
================================ */
const Breakout = (() => {
    const canvas = document.getElementById('breakoutCanvas');
    const ctx = canvas.getContext('2d');
    const wrapper = document.getElementById('bWrapper');
    const overlay = document.getElementById('bOverlay');
    const overlayTitle = document.getElementById('bOverlayTitle');
    const overlayText = document.getElementById('bOverlayText');
    const startBtn = document.getElementById('bStartBtn');
    const scoreEl = document.getElementById('bScore');
    const livesEl = document.getElementById('bLives');
    const levelEl = document.getElementById('bLevel');

    const W = canvas.width;
    const H = canvas.height;

    let paddle, ball, bricks;
    let score = 0, lives = 3, level = 1;
    let running = false, gameState = 'idle';
    let animId = null;

    function init() {
        resetGame();
        gameState = 'idle';
        overlayTitle.textContent = 'BREAKOUT';
        overlayText.textContent = 'Води пальцем / мышью';
        startBtn.textContent = '▶ ИГРАТЬ';
        overlay.classList.remove('hidden');
        draw();
    }

    function resetGame() {
        paddle = {
            w: 90,
            h: 12,
            x: (W - 90) / 2,
            y: H - 30
        };

        ball = {
            x: W / 2,
            y: H - 60,
            r: 7,
            vx: 3 * (Math.random() > 0.5 ? 1 : -1),
            vy: -4
        };

        createBricks();
        score = 0;
        lives = 3;
        scoreEl.textContent = score;
        livesEl.textContent = lives;
        levelEl.textContent = level;
    }

    function createBricks() {
        bricks = [];
        const cols = 8;
        const rows = 4 + Math.min(level - 1, 3);
        const padding = 4;
        const brickW = (W - padding * (cols + 1)) / cols;
        const brickH = 18;
        const offsetTop = 50;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const colors = ['#ff2e97', '#b026ff', '#00f0ff', '#39ff14', '#ffcc00'];
                bricks.push({
                    x: padding + c * (brickW + padding),
                    y: offsetTop + r * (brickH + padding),
                    w: brickW,
                    h: brickH,
                    color: colors[r % colors.length],
                    alive: true
                });
            }
        }
    }

    function draw() {
        ctx.fillStyle = '#12122a';
        ctx.fillRect(0, 0, W, H);

        // Сетка
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        for (let x = 0; x < W; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Блоки
        bricks.forEach(b => {
            if (!b.alive) return;
            ctx.fillStyle = b.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        // Платформа
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f0ff';
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

        // Мяч
        ctx.fillStyle = '#ff2e97';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff2e97';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    function update() {
        if (gameState !== 'playing') return;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Отскок от стен
        if (ball.x - ball.r < 0) {
            ball.x = ball.r;
            ball.vx *= -1;
        }
        if (ball.x + ball.r > W) {
            ball.x = W - ball.r;
            ball.vx *= -1;
        }
        if (ball.y - ball.r < 0) {
            ball.y = ball.r;
            ball.vy *= -1;
        }

        // Платформа
        if (
            ball.y + ball.r >= paddle.y &&
            ball.y - ball.r <= paddle.y + paddle.h &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.w &&
            ball.vy > 0
        ) {
            const hitPos = (ball.x - paddle.x) / paddle.w;
            const angle = (hitPos - 0.5) * Math.PI * 0.7;
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.sin(angle) * speed;
            ball.vy = -Math.abs(Math.cos(angle) * speed);
            ball.y = paddle.y - ball.r;
        }

        // Блоки
        bricks.forEach(b => {
            if (!b.alive) return;
            if (
                ball.x + ball.r > b.x &&
                ball.x - ball.r < b.x + b.w &&
                ball.y + ball.r > b.y &&
                ball.y - ball.r < b.y + b.h
            ) {
                b.alive = false;
                score += 10;
                scoreEl.textContent = score;

                // Определяем сторону удара
                const overlapX = Math.min(
                    ball.x + ball.r - b.x,
                    b.x + b.w - (ball.x - ball.r)
                );
                const overlapY = Math.min(
                    ball.y + ball.r - b.y,
                    b.y + b.h - (ball.y - ball.r)
                );

                if (overlapX < overlapY) ball.vx *= -1;
                else ball.vy *= -1;

                // Глитч
                canvas.animate([
                    { transform: 'translate(0)' },
                    { transform: 'translate(-2px, 2px)' },
                    { transform: 'translate(2px, -2px)' },
                    { transform: 'translate(0)' }
                ], { duration: 100 });
            }
        });

        // Упал вниз
        if (ball.y - ball.r > H) {
            lives--;
            livesEl.textContent = lives;

            if (lives <= 0) {
                gameOver();
            } else {
                // Респавн мяча
                ball.x = W / 2;
                ball.y = H - 60;
                ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
                ball.vy = -4;
            }
        }

        // Уровень пройден
        if (bricks.every(b => !b.alive)) {
            level++;
            levelEl.textContent = level;
            resetBall();
            createBricks();
        }
    }

    function resetBall() {
        ball.x = W / 2;
        ball.y = H - 60;
        ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
        ball.vy = -4;
    }

    function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
    }

    function start() {
        resetGame();
        gameState = 'playing';
        overlay.classList.add('hidden');
        if (animId) cancelAnimationFrame(animId);
        loop();
    }

    function stop() {
        gameState = 'idle';
        running = false;
        if (animId) cancelAnimationFrame(animId);
    }

    function gameOver() {
        gameState = 'gameover';
        if (animId) cancelAnimationFrame(animId);
        overlayTitle.textContent = 'ИГРА ОКОНЧЕНА';
        overlayText.textContent = `Счёт: ${score}`;
        startBtn.textContent = '↻ ЗАНОВО';
        overlay.classList.remove('hidden');
    }

    /* ---- УПРАВЛЕНИЕ ---- */
    function movePaddle(clientX) {
        const rect = wrapper.getBoundingClientRect();
        const x = clientX - rect.left;
        const scale = W / rect.width;
        let newX = (x * scale) - paddle.w / 2;
        newX = Math.max(0, Math.min(W - paddle.w, newX));
        paddle.x = newX;
    }

    // Мышь
    wrapper.addEventListener('mousemove', (e) => {
        if (gameState === 'playing') movePaddle(e.clientX);
    });

    // Тач
    wrapper.addEventListener('touchstart', (e) => {
        if (gameState === 'playing') movePaddle(e.touches[0].clientX);
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (gameState === 'playing') movePaddle(e.touches[0].clientX);
    }, { passive: false });

    startBtn.addEventListener('click', start);

    return { init, stop };
})();

/* ================================
   ИГРА 2: MEMORY
================================ */
const Memory = (() => {
    const grid = document.getElementById('memoryGrid');
    const movesEl = document.getElementById('mMoves');
    const pairsEl = document.getElementById('mPairs');
    const timeEl = document.getElementById('mTime');
    const restartBtn = document.getElementById('mRestart');

    const EMOJIS = ['🎮', '🕹️', '👾', '🚀', '💾', '⚡', '🎯', '💜'];
    const TOTAL_PAIRS = 8;

    let cards = [];
    let flipped = [];
    let matched = 0;
    let moves = 0;
    let time = 0;
    let timerId = null;
    let lock = false;
    let isActive = false;

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function init() {
        isActive = true;
        reset();
    }

    function stop() {
        isActive = false;
        if (timerId) clearInterval(timerId);
    }

    function reset() {
        if (timerId) clearInterval(timerId);
        flipped = [];
        matched = 0;
        moves = 0;
        time = 0;
        lock = false;

        movesEl.textContent = 0;
        pairsEl.textContent = `0/${TOTAL_PAIRS}`;
        timeEl.textContent = '0s';

        // Формируем карточки
        const deck = shuffle([...EMOJIS, ...EMOJIS]);
        grid.innerHTML = '';
        cards = [];

        deck.forEach((emoji, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.dataset.index = i;
            card.textContent = emoji;
            card.addEventListener('click', () => flip(card));
            grid.appendChild(card);
            cards.push(card);
        });

        // Старт таймера
        timerId = setInterval(() => {
            if (!isActive) return;
            time++;
            timeEl.textContent = time + 's';
        }, 1000);
    }

    function flip(card) {
        if (lock) return;
        if (card.classList.contains('flipped')) return;
        if (card.classList.contains('matched')) return;

        card.classList.add('flipped');
        flipped.push(card);

        if (flipped.length === 2) {
            moves++;
            movesEl.textContent = moves;
            check();
        }
    }

    function check() {
        const [a, b] = flipped;

        if (a.dataset.emoji === b.dataset.emoji) {
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            pairsEl.textContent = `${matched}/${TOTAL_PAIRS}`;
            flipped = [];

            if (matched === TOTAL_PAIRS) {
                if (timerId) clearInterval(timerId);
                setTimeout(() => {
                    alert(`🏆 Победа!\nХоды: ${moves}\nВремя: ${time}s`);
                }, 400);
            }
        } else {
            lock = true;
            setTimeout(() => {
                a.classList.remove('flipped');
                b.classList.remove('flipped');
                flipped = [];
                lock = false;
            }, 700);
        }
    }

    restartBtn.addEventListener('click', reset);

    return { init, stop };
})();

/* ================================
   ИГРА 3: REACTION
================================ */
const Reaction = (() => {
    const zone = document.getElementById('reactionZone');
    const text = document.getElementById('reactionText');
    const bestEl = document.getElementById('rBest');
    const tryEl = document.getElementById('rTry');

    let state = 'idle'; // idle | waiting | ready | toosoon | result
    let startTime = 0;
    let timeoutId = null;
    let best = parseInt(localStorage.getItem('reactionBest') || '0');
    let attempt = 1;
    let isActive = false;

    function init() {
        isActive = true;
        attempt = 1;
        tryEl.textContent = attempt;
        bestEl.textContent = best > 0 ? best + 'ms' : '—';
        reset();
    }

    function stop() {
        isActive = false;
        if (timeoutId) clearTimeout(timeoutId);
        reset();
    }

    function reset() {
        state = 'idle';
        zone.className = 'reaction-zone';
        text.textContent = 'НАЖМИ, ЧТОБЫ НАЧАТЬ';
        if (timeoutId) clearTimeout(timeoutId);
    }

    function startWaiting() {
        state = 'waiting';
        zone.className = 'reaction-zone waiting';
        text.textContent = 'ЖДИ ЗЕЛЁНОГО...';

        const delay = 1500 + Math.random() * 2500;
        timeoutId = setTimeout(() => {
            if (!isActive) return;
            state = 'ready';
            zone.className = 'reaction-zone ready';
            text.textContent = '👉 ЖМИ! 👈';
            startTime = performance.now();
        }, delay);
    }

    function handleClick() {
        if (!isActive) return;

        if (state === 'idle') {
            startWaiting();
            return;
        }

        if (state === 'waiting') {
            // Слишком рано
            if (timeoutId) clearTimeout(timeoutId);
            state = 'toosoon';
            zone.className = 'reaction-zone toosoon';
            text.textContent = '❌ СЛИШКОМ РАНО!\nнажми, чтобы повторить';
            return;
        }

        if (state === 'ready') {
            const reactionTime = Math.round(performance.now() - startTime);
            state = 'result';
            zone.className = 'reaction-zone result';

            let msg = `${reactionTime} ms`;
            if (reactionTime < 200) msg += '\n⚡ МОЛНИЯ!';
            else if (reactionTime < 300) msg += '\n🔥 ОТЛИЧНО!';
            else if (reactionTime < 400) msg += '\n👍 ХОРОШО';
            else msg += '\n🐢 МОЖНО БЫСТРЕЕ';

            text.textContent = msg;

            if (best === 0 || reactionTime < best) {
                best = reactionTime;
                localStorage.setItem('reactionBest', best);
                bestEl.textContent = best + 'ms';
                text.textContent = '🏆 НОВЫЙ РЕКОРД!\n' + msg;
            }

            attempt++;
            tryEl.textContent = attempt;

            // Через 1.5с — повторить
            setTimeout(() => {
                if (!isActive) return;
                reset();
            }, 1500);
            return;
        }

        if (state === 'toosoon' || state === 'result') {
            reset();
        }
    }

    zone.addEventListener('click', handleClick);
    zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleClick();
    }, { passive: false });

    return { init, stop };
})();

/* ================================
   ЗАПРЕТ КОНТЕКСТНОГО МЕНЮ
================================ */
document.addEventListener('contextmenu', (e) => {
    if (currentGame) e.preventDefault();
});