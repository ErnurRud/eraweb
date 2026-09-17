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
    const count = Math.floor(window.innerWidth / 10);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.3 + 0.05,
            color: Math.random() > 0.7 ? '#ffcc00' : '#00f0ff'
        });
    }
}

function animateStars() {
    sctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > starsCanvas.height) s.y = 0;
        sctx.fillStyle = s.color;
        sctx.shadowBlur = 8;
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
   POWER REACTOR — IDLE CLICKER
================================ */

// ─── DOM ───
const energyEl      = document.getElementById('energy');
const epsEl         = document.getElementById('eps');
const reactorEl     = document.getElementById('reactor');
const reactorHint   = document.getElementById('reactorHint');
const upgradesList  = document.getElementById('upgradesList');
const starsCountEl  = document.getElementById('starsCount');
const starsBonusEl  = document.getElementById('starsBonus');
const starsGainEl   = document.getElementById('starsGain');
const prestigeBtn   = document.getElementById('prestigeBtn');

const statTotal     = document.getElementById('statTotal');
const statClicks    = document.getElementById('statClicks');
const statPerClick  = document.getElementById('statPerClick');
const statPerSec    = document.getElementById('statPerSec');
const statUpgrades  = document.getElementById('statUpgrades');
const statPrestiges = document.getElementById('statPrestiges');
const statTime      = document.getElementById('statTime');

const resetBtn      = document.getElementById('resetBtn');

// ─── СОСТОЯНИЕ ───
const state = {
    energy: 0,
    totalEnergy: 0,
    clicks: 0,
    stars: 0,
    prestiges: 0,
    upgrades: {},       // { id: level }
    startedAt: Date.now(),
    playTime: 0,        // секунд
    lastTick: Date.now(),
    lastSave: Date.now(),
};

/* ================================
   УЛУЧШЕНИЯ
================================ */
const UPGRADES = [
    {
        id: 'click',
        icon: '👆',
        name: 'СИЛА КЛИКА',
        desc: '+1 к энергии за клик',
        basePrice: 15,
        priceMult: 1.18,
        effect: (lvl) => `+${lvl} за клик`,
    },
    {
        id: 'panel',
        icon: '☀️',
        name: 'СОЛНЕЧНАЯ ПАНЕЛЬ',
        desc: '+0.5 энергии в секунду',
        basePrice: 25,
        priceMult: 1.15,
        effect: (lvl) => `+${(lvl * 0.5).toFixed(1)}/сек`,
    },
    {
        id: 'battery',
        icon: '🔋',
        name: 'БАТАРЕЯ',
        desc: '+2 энергии в секунду',
        basePrice: 120,
        priceMult: 1.17,
        effect: (lvl) => `+${(lvl * 2)}/сек`,
    },
    {
        id: 'solar_farm',
        icon: '🌞',
        name: 'СОЛНЕЧНАЯ ФЕРМА',
        desc: '+10 энергии в секунду',
        basePrice: 600,
        priceMult: 1.19,
        effect: (lvl) => `+${(lvl * 10)}/сек`,
    },
    {
        id: 'nuclear',
        icon: '☢️',
        name: 'ЯДЕРНЫЙ РЕАКТОР',
        desc: '+60 энергии в секунду',
        basePrice: 3000,
        priceMult: 1.20,
        effect: (lvl) => `+${(lvl * 60)}/сек`,
    },
    {
        id: 'fusion',
        icon: '⚛️',
        name: 'ТЕРМОЯД',
        desc: '+350 энергии в секунду',
        basePrice: 15000,
        priceMult: 1.22,
        effect: (lvl) => `+${(lvl * 350)}/сек`,
    },
    {
        id: 'antimatter',
        icon: '🌌',
        name: 'АНТИМАТЕРИЯ',
        desc: '+2000 энергии в секунду',
        basePrice: 80000,
        priceMult: 1.24,
        effect: (lvl) => `+${(lvl * 2000)}/сек`,
    },
    {
        id: 'multiplier',
        icon: '💎',
        name: 'КРИСТАЛЬНЫЙ УСИЛИТЕЛЬ',
        desc: '+15% ко всей добыче',
        basePrice: 5000,
        priceMult: 1.5,
        effect: (lvl) => `×${(1 + lvl * 0.15).toFixed(2)}`,
    },
];

/* ================================
   РАСЧЁТЫ
================================ */
function getUpgradeLevel(id) {
    return state.upgrades[id] || 0;
}

function getUpgradePrice(upgrade) {
    const lvl = getUpgradeLevel(upgrade.id);
    return Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMult, lvl));
}

// Энергия за один клик (с учётом всех бонусов)
function getClickPower() {
    const base = 1 + getUpgradeLevel('click');
    const mult = 1 + getUpgradeLevel('multiplier') * 0.15;
    const starBonus = 1 + state.stars * 0.10;
    return base * mult * starBonus;
}

// Энергия в секунду
function getEPS() {
    let eps = 0;
    eps += getUpgradeLevel('panel') * 0.5;
    eps += getUpgradeLevel('battery') * 2;
    eps += getUpgradeLevel('solar_farm') * 10;
    eps += getUpgradeLevel('nuclear') * 60;
    eps += getUpgradeLevel('fusion') * 350;
    eps += getUpgradeLevel('antimatter') * 2000;

    const mult = 1 + getUpgradeLevel('multiplier') * 0.15;
    const starBonus = 1 + state.stars * 0.10;
    return eps * mult * starBonus;
}

// Сколько звёзд получишь при престиже
function getPrestigeGain() {
    // Формула: sqrt от всего добытого / 1000
    const total = state.totalEnergy;
    if (total < 10000) return 0;
    return Math.floor(Math.sqrt(total / 10000));
}

/* ================================
   ФОРМАТ ЧИСЕЛ
================================ */
function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();

    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

    if (tier === 0) return Math.floor(num).toString();
    if (tier >= suffixes.length) return num.toExponential(2);

    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;

    return scaled.toFixed(scaled < 10 ? 2 : (scaled < 100 ? 1 : 0)) + suffix;
}

function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}ч ${m}м`;
    if (m > 0) return `${m}м ${s}с`;
    return `${s}с`;
}

/* ================================
   РЕНДЕР ИНТЕРФЕЙСА
================================ */
function updateUI() {
    // HUD
    energyEl.textContent = formatNumber(state.energy);
    epsEl.textContent = formatNumber(getEPS());
    reactorHint.textContent = '+' + formatNumber(getClickPower()) + ' за клик';

    // Престиж
    starsCountEl.textContent = state.stars;
    starsBonusEl.textContent = '+' + (state.stars * 10) + '%';
    const gain = getPrestigeGain();
    starsGainEl.textContent = gain;
    prestigeBtn.disabled = gain < 1;

    // Статистика
    statTotal.textContent = formatNumber(state.totalEnergy);
    statClicks.textContent = formatNumber(state.clicks);
    statPerClick.textContent = formatNumber(getClickPower());
    statPerSec.textContent = formatNumber(getEPS());

    // Кол-во купленных улучшений
    let totalUpgrades = 0;
    for (const id in state.upgrades) totalUpgrades += state.upgrades[id];
    statUpgrades.textContent = totalUpgrades;

    statPrestiges.textContent = state.prestiges;
    statTime.textContent = formatTime(state.playTime);
}

function renderUpgrades() {
    upgradesList.innerHTML = '';

    UPGRADES.forEach(up => {
        const lvl = getUpgradeLevel(up.id);
        const price = getUpgradePrice(up);
        const canAfford = state.energy >= price;

        const div = document.createElement('div');
        div.className = 'upgrade-item';
        if (!canAfford) div.classList.add('locked');
        else div.classList.add('affordable');

        div.innerHTML = `
            <div class="upgrade-icon">${up.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${up.name}</div>
                <div class="upgrade-desc">${up.desc}</div>
                <div class="upgrade-level">
                    УР. ${lvl}${lvl > 0 ? ' · ' + up.effect(lvl) : ''}
                </div>
            </div>
            <div class="upgrade-price">
                ⚡ ${formatNumber(price)}
            </div>
        `;

        div.addEventListener('click', () => buyUpgrade(up));
        upgradesList.appendChild(div);
    });
}

/* ================================
   ПОКУПКА
================================ */
function buyUpgrade(upgrade) {
    const price = getUpgradePrice(upgrade);
    if (state.energy < price) {
        // Тряска
        const items = upgradesList.querySelectorAll('.upgrade-item');
        items.forEach(item => {
            const nameEl = item.querySelector('.upgrade-name');
            if (nameEl && nameEl.textContent === upgrade.name) {
                item.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-6px)' },
                    { transform: 'translateX(6px)' },
                    { transform: 'translateX(0)' },
                ], { duration: 250 });
            }
        });
        return;
    }

    state.energy -= price;
    state.upgrades[upgrade.id] = getUpgradeLevel(upgrade.id) + 1;

    // Анимация
    renderUpgrades();
    updateUI();
    saveGame();
}

/* ================================
   КЛИК ПО РЕАКТОРУ
================================ */
function onReactorClick(e) {
    const power = getClickPower();
    state.energy += power;
    state.totalEnergy += power;
    state.clicks++;

    // Всплывающий "+N"
    const popup = document.createElement('div');
    popup.className = 'click-popup';
    popup.textContent = '+' + formatNumber(power);

    const x = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || (reactorEl.getBoundingClientRect().left + reactorEl.offsetWidth / 2));
    const y = (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || (reactorEl.getBoundingClientRect().top + reactorEl.offsetHeight / 2));

    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);

    // Пульсация реактора
    reactorEl.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1.03)' },
        { transform: 'scale(1)' },
    ], { duration: 200 });

    updateUI();
    renderUpgrades();
    if (window.Achievements) {
        window.Achievements.registerGame('power');
        if (state.clicks >= 100) window.Achievements.unlock('powerClick100');
    }
}

reactorEl.addEventListener('click', onReactorClick);

/* ================================
   ИГРОВОЙ ЦИКЛ
================================ */
function gameTick() {
    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    if (dt > 0 && dt < 5) {
        const gain = getEPS() * dt;
        state.energy += gain;
        state.totalEnergy += gain;
        state.playTime += dt;
    }

    updateUI();
    renderUpgrades();
}

/* ================================
   ПРЕСТИЖ
================================ */
prestigeBtn.addEventListener('click', () => {
    const gain = getPrestigeGain();
    if (gain < 1) return;

    if (!confirm(`Сбросить прогресс и получить ${gain} 🌟 звёзд?\nКаждая звезда даёт +10% навсегда.`)) return;

    state.stars += gain;
    state.prestiges++;

    // Сброс
    state.energy = 0;
    state.totalEnergy = 0;
    state.clicks = 0;
    state.upgrades = {};
    state.playTime = 0;
    state.lastTick = Date.now();

    saveGame();
    updateUI();
    renderUpgrades();

    // Праздник
    showFireworks();

    if (window.Achievements && state.prestiges === 1) {
        window.Achievements.unlock('powerPrestige1');
    }
});

function showFireworks() {
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const popup = document.createElement('div');
            popup.className = 'click-popup';
            popup.textContent = '🌟';
            popup.style.left = (Math.random() * window.innerWidth) + 'px';
            popup.style.top = (Math.random() * window.innerHeight) + 'px';
            popup.style.color = '#ffcc00';
            popup.style.fontSize = (14 + Math.random() * 20) + 'px';
            document.body.appendChild(popup);
            setTimeout(() => popup.remove(), 1000);
        }, i * 40);
    }
}

/* ================================
   ВКЛАДКИ
================================ */
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});

/* ================================
   СБРОС
================================ */
resetBtn.addEventListener('click', () => {
    if (!confirm('⚠️ ВНИМАНИЕ!\nЭто сбросит ВСЁ: энергию, улучшения, звёзды и статистику.\n\nТочно сбросить?')) return;
    if (!confirm('Последнее предупреждение. Всё будет потеряно. Продолжить?')) return;

    localStorage.removeItem('powerReactorSave');
    location.reload();
});

/* ================================
   СОХРАНЕНИЕ / ЗАГРУЗКА
================================ */
function saveGame() {
    const save = {
        energy: state.energy,
        totalEnergy: state.totalEnergy,
        clicks: state.clicks,
        stars: state.stars,
        prestiges: state.prestiges,
        upgrades: state.upgrades,
        playTime: state.playTime,
        savedAt: Date.now(),
    };
    localStorage.setItem('powerReactorSave', JSON.stringify(save));
    state.lastSave = Date.now();
}

function loadGame() {
    const raw = localStorage.getItem('powerReactorSave');
    if (!raw) return;

    try {
        const save = JSON.parse(raw);
        state.energy = save.energy || 0;
        state.totalEnergy = save.totalEnergy || 0;
        state.clicks = save.clicks || 0;
        state.stars = save.stars || 0;
        state.prestiges = save.prestiges || 0;
        state.upgrades = save.upgrades || {};
        state.playTime = save.playTime || 0;

        // Оффлайн-доход
        if (save.savedAt) {
            const offlineSec = (Date.now() - save.savedAt) / 1000;
            if (offlineSec > 10) {
                const maxOffline = Math.min(offlineSec, 60 * 60 * 8); // макс 8 часов
                const offlineGain = getEPS() * maxOffline;
                if (offlineGain > 0) {
                    state.energy += offlineGain;
                    state.totalEnergy += offlineGain;

                    setTimeout(() => {
                        alert(
                            `💤 ПОКА ТЕБЯ НЕ БЫЛО\n\n` +
                            `Время: ${formatTime(offlineSec)}\n` +
                            `Добыто: ⚡ ${formatNumber(offlineGain)}\n\n` +
                            `Оффлайн-доход работает до 8 часов.`
                        );
                    }, 500);
                }
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

// Автосохранение каждые 10 секунд
setInterval(saveGame, 10000);

// Сохранение при закрытии
window.addEventListener('beforeunload', saveGame);

// Сохранение при потере фокуса (свёрнутая вкладка)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveGame();
    else state.lastTick = Date.now(); // не считаем оффлайн-доход дважды
});

/* ================================
   ПАССИВНЫЙ ДОХОД (requestAnimationFrame)
================================ */
let lastFrame = Date.now();
function passiveLoop() {
    const now = Date.now();
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;

    if (dt > 0 && dt < 1 && document.visibilityState === 'visible') {
        const gain = getEPS() * dt;
        if (gain > 0) {
            state.energy += gain;
            state.totalEnergy += gain;
            state.playTime += dt;
        }
    }

    requestAnimationFrame(passiveLoop);
}

/* ================================
   UI-обновление (реже, для производительности)
================================ */
setInterval(() => {
    updateUI();
    renderUpgrades();
}, 200);

/* ================================
   СТАРТ
================================ */
loadGame();
state.lastTick = Date.now();
updateUI();
renderUpgrades();
passiveLoop();

// Первый рестарт рендера
setInterval(gameTick, 1000);