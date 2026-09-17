(function() {
    'use strict';

    const PLAYLIST = [
        { file: 'music/backgroundmusicmaster-pixel-adventure-382649.mp3', title: 'Главная тема' },
        { file: 'music/brutaldesign-small-story-pixel-opera-570005.mp3',      title: 'Космос' },
        { file: 'music/mroneilovealot-pixel-rush-8-bit-chiptune-background-music-410043.mp3',      title: 'Ретро' },
        { file: 'music/robloxeur-pixel-245147.mp3',     title: 'Битва' },
        { file: 'music/yoshiyuki_tatsuya-winter-pixel-422896.mp3',      title: 'Чилл' },
    ];

    // ─── Ключи localStorage ───
    const STORAGE_KEY_ENABLED = 'siteMusicEnabled';   // 'true' | 'false'
    const STORAGE_KEY_TRACK   = 'siteMusicTrack';     // индекс трека
    const STORAGE_KEY_TIME    = 'siteMusicTime';      // позиция в секундах
    const STORAGE_KEY_VOLUME  = 'siteMusicVolume';    // 0..1

    const DEFAULT_VOLUME = 0.3;

    // ─── Создаём <audio> ───
    const audio = new Audio();
    audio.preload = 'auto';
    audio.loop = false;

    // ─── Читаем сохранённое состояние ───
    let enabled = localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    let currentVolume = parseFloat(localStorage.getItem(STORAGE_KEY_VOLUME) || DEFAULT_VOLUME);

    // 🔑 ВЫБРАННЫЙ ТРЕК — читаем из localStorage
    let trackIndex = parseInt(localStorage.getItem(STORAGE_KEY_TRACK) || '0');
    if (isNaN(trackIndex) || trackIndex < 0 || trackIndex >= PLAYLIST.length) {
        trackIndex = 0;
    }

    // 🔑 ПОЗИЦИЯ — читаем из localStorage
    let savedTime = parseFloat(localStorage.getItem(STORAGE_KEY_TIME) || '0');
    if (isNaN(savedTime) || savedTime < 0) savedTime = 0;

    audio.volume = Math.max(0, Math.min(1, currentVolume));

    // ─── Загрузить трек по индексу ───
    function loadTrack(index, restorePosition = true) {
        // Зациклить индекс
        if (index < 0) index = PLAYLIST.length - 1;
        if (index >= PLAYLIST.length) index = 0;

        trackIndex = index;

        // 🔑 СРАЗУ сохраняем выбранный трек
        localStorage.setItem(STORAGE_KEY_TRACK, trackIndex.toString());

        // Устанавливаем источник
        audio.src = PLAYLIST[trackIndex].file;
        audio.load();

        // Восстанавливаем позицию (только если нужно)
        if (restorePosition && savedTime > 0) {
            audio.addEventListener('loadedmetadata', function onMeta() {
                audio.removeEventListener('loadedmetadata', onMeta);
                if (savedTime > 0 && savedTime < audio.duration - 2) {
                    try {
                        audio.currentTime = savedTime;
                    } catch (e) {}
                }
            });
        } else {
            // Сбросить позицию
            savedTime = 0;
            localStorage.setItem(STORAGE_KEY_TIME, '0');
        }
    }

    // Первая загрузка трека
    loadTrack(trackIndex, true);

    // ─── Автопереход к следующему, когда трек закончился ───
    audio.addEventListener('ended', () => {
        nextTrack();
        if (enabled) play();
    });

    // ─── Следующий трек ───
    function nextTrack() {
        savedTime = 0;
        localStorage.setItem(STORAGE_KEY_TIME, '0');

        // 🔑 СРАЗУ сохраняем новый индекс
        const newIndex = (trackIndex + 1) % PLAYLIST.length;
        loadTrack(newIndex, false);

        showTrackToast('⏭ ' + PLAYLIST[trackIndex].title);
        updateButton();
    }

    // ─── Предыдущий трек ───
    function prevTrack() {
        savedTime = 0;
        localStorage.setItem(STORAGE_KEY_TIME, '0');

        const newIndex = (trackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
        loadTrack(newIndex, false);

        showTrackToast('⏮ ' + PLAYLIST[trackIndex].title);
        updateButton();
    }

    // ─── Выбрать конкретный трек по индексу ───
    function setTrack(index) {
        if (index === trackIndex && !audio.paused) return;

        savedTime = 0;
        localStorage.setItem(STORAGE_KEY_TIME, '0');

        loadTrack(index, false);

        showTrackToast('🎵 ' + PLAYLIST[trackIndex].title);

        if (enabled) play();
        updateButton();
    }

    // ─── Обновить кнопки ───
    function updateButton() {
        const btn = document.getElementById('musicToggle');
        const nextBtn = document.getElementById('musicNext');

        if (btn) {
            if (enabled && !audio.paused) {
                btn.textContent = '🔊';
                btn.title = 'Пауза — ' + PLAYLIST[trackIndex].title;
                btn.classList.add('playing');
            } else {
                btn.textContent = '🔇';
                btn.title = 'Включить музыку — ' + PLAYLIST[trackIndex].title;
                btn.classList.remove('playing');
            }
        }

        if (nextBtn) {
            nextBtn.title = 'Следующий: ' + PLAYLIST[(trackIndex + 1) % PLAYLIST.length].title;
        }
    }

    // ─── Toast ───
    let toastTimer = null;
    function showTrackToast(text) {
        let toast = document.getElementById('musicToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'musicToast';
            toast.className = 'music-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = text;
        toast.classList.add('show');

        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    // ─── Включить ───
    function play() {
        enabled = true;
        localStorage.setItem(STORAGE_KEY_ENABLED, 'true');

        const promise = audio.play();
        if (promise !== undefined) {
            promise
                .then(() => updateButton())
                .catch(() => updateButton());
        }
        updateButton();
    }

    // ─── Выключить ───
    function pause() {
        enabled = false;
        localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
        audio.pause();
        updateButton();
    }

    // ─── Переключить ───
    function toggle() {
        if (enabled && !audio.paused) {
            pause();
        } else {
            play();
        }
    }

    // ─── Привязать кнопки ───
    function bindButtons() {
        const btn = document.getElementById('musicToggle');
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle();
                showTrackToast(
                    (enabled ? '🔊 ' : '🔇 ') + PLAYLIST[trackIndex].title
                );
            });
        }

        const nextBtn = document.getElementById('musicNext');
        if (nextBtn) {
            const newNext = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNext, nextBtn);
            newNext.addEventListener('click', (e) => {
                e.stopPropagation();
                nextTrack();
                if (enabled) play();
            });
        }

        updateButton();
    }

    // ─── Автозапуск после первого клика ───
    function tryAutoplay() {
        if (!enabled) return;

        const attempt = audio.play();
        if (attempt !== undefined) {
            attempt
                .then(() => {
                    document.removeEventListener('click', tryAutoplay);
                    document.removeEventListener('touchstart', tryAutoplay);
                    document.removeEventListener('keydown', tryAutoplay);
                    updateButton();
                })
                .catch(() => {});
        }
    }

    document.addEventListener('click', tryAutoplay);
    document.addEventListener('touchstart', tryAutoplay, { passive: true });
    document.addEventListener('keydown', tryAutoplay);

    // ─── 💾 СОХРАНЕНИЕ ПОЗИЦИИ ───
    // Каждую секунду сохраняем текущую секунду трека
    setInterval(() => {
        if (!audio.paused && audio.currentTime > 0) {
            localStorage.setItem(STORAGE_KEY_TIME, audio.currentTime.toString());
        }
    }, 1000);

    // При уходе со страницы — СРАЗУ сохраняем
    window.addEventListener('beforeunload', () => {
        if (audio.currentTime > 0) {
            localStorage.setItem(STORAGE_KEY_TIME, audio.currentTime.toString());
        }
        localStorage.setItem(STORAGE_KEY_TRACK, trackIndex.toString());
        localStorage.setItem(STORAGE_KEY_ENABLED, enabled.toString());
    });

    // При возврате из bfcache (Safari/Chrome назад)
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            // Перечитываем актуальный трек и позицию
            const savedTrack = parseInt(localStorage.getItem(STORAGE_KEY_TRACK) || '0');
            const savedT = parseFloat(localStorage.getItem(STORAGE_KEY_TIME) || '0');

            if (savedTrack !== trackIndex) {
                loadTrack(savedTrack, false);
            } else if (savedT > 0 && Math.abs(audio.currentTime - savedT) > 2) {
                try {
                    audio.currentTime = savedT;
                } catch (err) {}
            }

            if (enabled && audio.paused) {
                tryAutoplay();
            }
        }
    });

    // ─── Инициализация ───
    function init() {
        bindButtons();

        if (enabled) {
            tryAutoplay();
        } else {
            updateButton();
        }

        // Показать текущий трек после загрузки
        setTimeout(() => {
            showTrackToast('🎵 ' + PLAYLIST[trackIndex].title);
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ─── Публичное API ───
    window.SiteMusic = {
        play,
        pause,
        toggle,
        next: nextTrack,
        prev: prevTrack,
        setTrack,
        getTrack: () => PLAYLIST[trackIndex],
        getAllTracks: () => PLAYLIST.slice(),
        setVolume: (v) => {
            currentVolume = Math.max(0, Math.min(1, v));
            audio.volume = currentVolume;
            localStorage.setItem(STORAGE_KEY_VOLUME, currentVolume.toString());
        },
        getAudio: () => audio,
        getState: () => ({
            trackIndex,
            track: PLAYLIST[trackIndex],
            enabled,
            paused: audio.paused,
            currentTime: audio.currentTime,
        }),
    };

})();