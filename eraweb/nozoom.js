/* ================================
   БЛОКИРОВКА ЗУМА И ДВОЙНОГО ТАПА
   Работает на всех страницах
================================ */
(function() {
    'use strict';

    // 1) Запрет двойного тапа (double-tap zoom)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 350) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // 2) Запрет pinch-zoom (сжатие двумя пальцами)
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // 3) Запрет gesture-событий (Safari iOS)
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    }, { passive: false });

    // 4) Запрет Ctrl + колесо мыши (десктопный зум)
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // 5) Запрет Ctrl + / Ctrl - / Ctrl 0 (клавиатурный зум)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (
            e.key === '+' ||
            e.key === '-' ||
            e.key === '=' ||
            e.key === '0'
        )) {
            e.preventDefault();
        }
    });

    // 6) Принудительно сбрасываем масштаб при загрузке
    function resetZoom() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.setAttribute(
                'content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resetZoom);
    } else {
        resetZoom();
    }

    // 7) Сброс масштаба после смены ориентации
    window.addEventListener('orientationchange', function() {
        setTimeout(resetZoom, 100);
    });

})();