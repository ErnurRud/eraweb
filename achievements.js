/* ================================
   СИСТЕМА ДОСТИЖЕНИЙ
   Работает на всех страницах
================================ */
(function() {
    'use strict';

    const STORAGE_KEY = 'siteAchievements';
    const CLICKS_KEY = 'siteTotalClicks';
    const GAMES_KEY = 'sitePlayedGames';

    /* ================================
       СПИСОК ВСЕХ ДОСТИЖЕНИЙ
    ================================ */
    const ACHIEVEMENTS = {
        // === ОБЩИЕ ===
        firstVisit: {
            icon: '👋',
            title: 'Добро пожаловать!',
            desc: 'Первый визит на сайт',
        },
        firstClick: {
            icon: '🖱️',
            title: 'Первый клик',
            desc: 'Кликни где угодно',
        },
        clicked100: {
            icon: '💯',
            title: 'Кликер',
            desc: '100 кликов по сайту',
        },
        clicked1000: {
            icon: '🎯',
            title: 'Кликомастер',
            desc: '1000 кликов по сайту',
        },

        // === ТЕМА / МУЗЫКА ===
        changedTheme: {
            icon: '🌙',
            title: 'Двуликий',
            desc: 'Переключил тему сайта',
        },
        changedTheme10: {
            icon: '🎨',
            title: 'Стилист',
            desc: 'Переключил тему 10 раз',
        },
        musicOn: {
            icon: '🎵',
            title: 'Меломан',
            desc: 'Включил музыку',
        },
        musicNext: {
            icon: '⏭️',
            title: 'Ди-джей',
            desc: 'Переключил трек',
        },
        foundStar: {
            icon: '⭐',
            title: 'Ловец звёзд',
            desc: 'Кликни по летящей звезде',
        },
        sentForm: {
            icon: '📨',
            title: 'Связист',
            desc: 'Отправил сообщение',
        },

        // === ИГРЫ (общие) ===
        playedGame: {
            icon: '🎮',
            title: 'Геймер',
            desc: 'Запустил любую игру',
        },
        playedAll: {
            icon: '🏆',
            title: 'Коллекционер',
            desc: 'Сыграл во все 6 игр',
        },

        // === SNAKE ===
        snakeScore10: {
            icon: '🐍',
            title: 'Змейка-новичок',
            desc: '10 очков в Червяке',
        },
        snakeScore50: {
            icon: '🐍',
            title: 'Змейка-про',
            desc: '50 очков в Червяке',
        },
        snakeScore100: {
            icon: '🐍',
            title: 'Змейка-мастер',
            desc: '100 очков в Червяке',
        },

        // === ALIEN ===
        alienWave5: {
            icon: '👾',
            title: 'Защитник',
            desc: '5 волн в Пришельцах',
        },
        alienWave10: {
            icon: '🛸',
            title: 'Капитан',
            desc: '10 волн в Пришельцах',
        },

        // === SPACE ===
        spaceCrystal50: {
            icon: '💎',
            title: 'Кристальный',
            desc: '50 кристаллов в Раннере',
        },
        spaceCrystal500: {
            icon: '💎',
            title: 'Богач',
            desc: '500 кристаллов в Раннере',
        },

        // === POWER ===
        powerClick100: {
            icon: '⚡',
            title: 'Энергетик',
            desc: '100 кликов в Реакторе',
        },
        powerPrestige1: {
            icon: '🌟',
            title: 'Престиж',
            desc: 'Первый престиж',
        },

        // === TERMINAL ===
        terminalHelp: {
            icon: '❓',
            title: 'Любопытный',
            desc: 'Ввёл "help" в терминале',
        },
        terminalHack: {
            icon: '💻',
            title: 'Хакер',
            desc: 'Взломал Пентагон (шутка)',
        },
        terminalMatrix: {
            icon: '🟢',
            title: 'Нео',
            desc: 'Увидел Матрицу',
        },
    };

    /* ================================
       ЗАГРУЗКА / СОХРАНЕНИЕ
    ================================ */
    function getUnlocked() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveUnlocked(obj) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {}
    }

    function getTotalClicks() {
        return parseInt(localStorage.getItem(CLICKS_KEY) || '0');
    }

    function saveTotalClicks(n) {
        localStorage.setItem(CLICKS_KEY, n.toString());
    }

    function getPlayedGames() {
        try {
            return JSON.parse(localStorage.getItem(GAMES_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function savePlayedGames(arr) {
        localStorage.setItem(GAMES_KEY, JSON.stringify(arr));
    }

    /* ================================
       РАЗБЛОКИРОВКА
    ================================ */
    function unlock(id) {
        const unlocked = getUnlocked();
        if (unlocked[id]) return; // уже есть

        unlocked[id] = {
            unlockedAt: Date.now()
        };
        saveUnlocked(unlocked);

        // Показать попап
        showAchievementPopup(ACHIEVEMENTS[id]);

        // Обновить панель, если она есть на странице
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    }

    /* ================================
       ПОПАП
    ================================ */
    function showAchievementPopup(ach) {
        if (!ach) return;

        // Удаляем старый попап, если есть
        const old = document.querySelector('.achievement-popup');
        if (old) old.remove();

        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-popup-icon">${ach.icon}</div>
            <div class="achievement-popup-text">
                <div class="achievement-popup-label">🏆 ДОСТИЖЕНИЕ ОТКРЫТО!</div>
                <div class="achievement-popup-title">${ach.title}</div>
                <div class="achievement-popup-desc">${ach.desc}</div>
            </div>
        `;
        document.body.appendChild(popup);

        // Показать
        requestAnimationFrame(() => popup.classList.add('show'));

        // Автоскрытие
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 400);
        }, 4000);
    }

    /* ================================
       АВТОТРИГГЕРЫ
    ================================ */
    function initAutoTriggers() {
        // Первый визит
        if (!getUnlocked().firstVisit) {
            setTimeout(() => unlock('firstVisit'), 500);
        }

        // Счётчик кликов
        document.addEventListener('click', () => {
            const total = getTotalClicks() + 1;
            saveTotalClicks(total);

            if (total === 1) unlock('firstClick');
            if (total === 100) unlock('clicked100');
            if (total === 1000) unlock('clicked1000');
        });

        // Смена темы
        let themeCount = parseInt(localStorage.getItem('siteThemeCount') || '0');
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                themeCount++;
                localStorage.setItem('siteThemeCount', themeCount.toString());
                unlock('changedTheme');
                if (themeCount >= 10) unlock('changedTheme10');
            });
        }

        // Музыка
        const musicBtn = document.getElementById('musicToggle');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                // Если после клика кнопка стала "🔊" — музыка включена
                setTimeout(() => {
                    if (musicBtn.textContent === '🔊') {
                        unlock('musicOn');
                    }
                }, 100);
            });
        }

        const musicNext = document.getElementById('musicNext');
        if (musicNext) {
            musicNext.addEventListener('click', () => unlock('musicNext'));
        }
    }

    /* ================================
       API ДЛЯ ИГР
    ================================ */
    function registerGame(gameId) {
        const played = getPlayedGames();
        if (!played.includes(gameId)) {
            played.push(gameId);
            savePlayedGames(played);
        }

        unlock('playedGame');

        if (played.length >= 6) {
            unlock('playedAll');
        }
    }

    /* ================================
       ПУБЛИЧНОЕ API
    ================================ */
    window.Achievements = {
        unlock: unlock,
        isUnlocked: (id) => !!getUnlocked()[id],
        getAll: () => ACHIEVEMENTS,
        getUnlockedList: () => getUnlocked(),
        registerGame: registerGame,
        getProgress: () => {
            const total = Object.keys(ACHIEVEMENTS).length;
            const done = Object.keys(getUnlocked()).length;
            return {
                done: done,
                total: total,
                percent: Math.round(done / total * 100)
            };
        },
        reset: () => {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(CLICKS_KEY);
            localStorage.removeItem(GAMES_KEY);
            localStorage.removeItem('siteThemeCount');
        }
    };

    /* ================================
       СТАРТ
    ================================ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoTriggers);
    } else {
        initAutoTriggers();
    }

    // Синхронизация между вкладками
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            if (typeof window.renderAchievements === 'function') {
                window.renderAchievements();
            }
        }
    });

})();