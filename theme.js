/* ================================
   ГЛОБАЛЬНАЯ ТЕМА
   Работает на всех страницах сайта
================================ */
(function() {
    'use strict';

    const STORAGE_KEY = 'siteTheme'; // 'dark' | 'light'
    const DEFAULT_THEME = 'dark';

    // ─── Применяем тему СРАЗУ, до отрисовки ───
    // Это делается через inline-скрипт в <head>, см. инструкцию ниже

    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
        } catch (e) {
            return DEFAULT_THEME;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {}
    }

    function applyTheme(theme) {
        // 'light' = светлая (ретро), отсутствие класса = тёмная
        if (theme === 'light') {
            document.body.classList.add('light');
            document.documentElement.classList.add('light');
        } else {
            document.body.classList.remove('light');
            document.documentElement.classList.remove('light');
        }
        updateToggleButton(theme);
    }

    function updateToggleButton(theme) {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        // Если светлая — показываем 🌞 (или ☀️), если тёмная — 🌙
        btn.textContent = theme === 'light' ? '☀️' : '🌙';
        btn.title = theme === 'light' ? 'Тёмная тема' : 'Светлая тема';
    }

    function toggleTheme() {
        const current = getSavedTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        saveTheme(next);
        applyTheme(next);

        // Небольшая анимация кнопки
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.animate([
                { transform: 'scale(1) rotate(0deg)' },
                { transform: 'scale(1.3) rotate(180deg)' },
                { transform: 'scale(1) rotate(360deg)' }
            ], { duration: 400, easing: 'ease-out' });
        }
    }

    // ─── Публичное API ───
    window.SiteTheme = {
        get: getSavedTheme,
        set: function(theme) {
            saveTheme(theme);
            applyTheme(theme);
        },
        toggle: toggleTheme,
        apply: applyTheme,
    };

    // ─── Инициализация при загрузке ───
    function init() {
        const theme = getSavedTheme();
        applyTheme(theme);

        // Находим кнопку (если ещё не в DOM — ждём)
        const btn = document.getElementById('themeToggle');
        if (btn) {
            // Удаляем старые обработчики, чтобы не дублировались
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', toggleTheme);
            updateToggleButton(theme);
        } else {
            // Кнопки ещё нет — ждём DOMContentLoaded
            document.addEventListener('DOMContentLoaded', () => {
                const btn2 = document.getElementById('themeToggle');
                if (btn2) {
                    btn2.addEventListener('click', toggleTheme);
                    updateToggleButton(theme);
                }
            });
        }
    }

    // Если DOM уже загружен — сразу, иначе ждём
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Синхронизация между вкладками — если в другой вкладке переключили, обновим здесь
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            applyTheme(e.newValue || DEFAULT_THEME);
        }
    });

})();