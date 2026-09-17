/* ================================
   ЗВЁЗДЫ НА ФОНЕ (Canvas)
================================ */
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initStars() {
    stars = [];
    const count = Math.floor(window.innerWidth / 8);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.5 ? '#00f0ff' : '#ff2e97'
        });
    }
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;

        ctx.fillStyle = s.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    requestAnimationFrame(animateStars);
}

resizeCanvas();
initStars();
animateStars();

window.addEventListener('resize', () => {
    resizeCanvas();
    initStars();
});


/* ================================
   ПОЯВЛЕНИЕ СЕКЦИЙ ПРИ СКРОЛЛЕ
================================ */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(40px)';
    section.style.transition = 'opacity 0.8s, transform 0.8s';
    observer.observe(section);
});


/* ================================
   АНИМАЦИЯ ПОЛОСОК НАВЫКОВ + ПРОЦЕНТЫ
================================ */
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skill = entry.target;
            const fill = skill.querySelector('.fill');
            const percentEl = skill.querySelector('.skill-percent');
            const level = parseInt(skill.dataset.level) || 0;

            setTimeout(() => {
                fill.style.width = level + '%';
            }, 150);

            if (level < 40) percentEl.classList.add('level-low');
            else if (level < 70) percentEl.classList.add('level-mid');
            else percentEl.classList.add('level-high');

            animatePercent(percentEl, 0, level, 1500);

            skillsObserver.unobserve(skill);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.skill').forEach(s => skillsObserver.observe(s));


/* ================================
   СЧЁТЧИК ПРОЦЕНТОВ
================================ */
function animatePercent(el, from, to, duration) {
    const startTime = performance.now();
    const diff = to - from;

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + diff * eased);

        el.textContent = current + '%';

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = to + '%';
        }
    }

    requestAnimationFrame(step);
}


/* ================================
   УРОВЕНЬ ИГРОКА (счётчик)
================================ */
let level = 1;
const levelEl = document.getElementById('level');
if (levelEl) {
    const levelInterval = setInterval(() => {
        if (level < 99) {
            level++;
            levelEl.textContent = level;
        } else {
            clearInterval(levelInterval);
        }
    }, 40);
}


/* ================================
   ГАЛЕРЕЯ — ЭФФЕКТ КЛИКА
================================ */
document.querySelectorAll('.pixel-card').forEach(card => {
    card.addEventListener('click', () => {
        card.animate([
            { transform: 'scale(1) rotate(0deg)' },
            { transform: 'scale(1.2) rotate(10deg)' },
            { transform: 'scale(1) rotate(0deg)' }
        ], {
            duration: 400,
            easing: 'ease-out'
        });
    });
});


/* ================================
   ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ
================================ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});


/* ================================
   КУРСОР-СВЕЧЕНИЕ
================================ */
const glow = document.querySelector('.cursor-glow');
document.addEventListener('mousemove', (e) => {
    if (!glow) return;
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
});


/* ================================
   БУРГЕР-МЕНЮ (мобильное)
================================ */
const burgerBtn = document.getElementById('burgerBtn');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');

function openMenu() {
    if (!navMenu) return;
    navMenu.classList.add('open');
    burgerBtn.classList.add('active');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    if (burgerBtn) burgerBtn.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (burgerBtn) {
    burgerBtn.addEventListener('click', () => {
        navMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
}

if (navOverlay) {
    navOverlay.addEventListener('click', closeMenu);
}

if (navMenu) {
    navMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMenu);
    });
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
});


/* ================================
   КЛИК ПО ЛОГОТИПУ → СКРОЛЛ НАВЕРХ
================================ */
const logoBtn = document.getElementById('logoBtn');

if (logoBtn) {
    logoBtn.addEventListener('click', function(e) {
        e.preventDefault();

        logoBtn.classList.remove('clicked');
        void logoBtn.offsetWidth;
        logoBtn.classList.add('clicked');

        setTimeout(() => {
            logoBtn.classList.remove('clicked');
        }, 700);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        if (navMenu && navMenu.classList.contains('open')) {
            closeMenu();
        }
    });
}


/* ================================
   🌟 ЛЕТЯЩАЯ ЗВЕЗДА + МОДАЛКА
================================ */
(function() {
    'use strict';

    const CONFIG = {
        startDelay: 3000,
        minInterval: 8000,
        maxInterval: 15000,
        flightDuration: 6000,
    };

    const photoModal = document.getElementById('photoModal');
    const photoClose = document.getElementById('photoClose');
    let currentStar = null;
    let nextStarTimer = null;

    function spawnStar() {
        if (currentStar) return;

        const star = document.createElement('div');
        star.className = 'flying-star';
        star.textContent = '⭐';
        star.title = 'Нажми на меня!';

        const startX = window.innerWidth + 50;
        const startY = -50;

        star.style.left = startX + 'px';
        star.style.top = startY + 'px';

        document.body.appendChild(star);
        currentStar = star;

        requestAnimationFrame(() => {
            star.classList.add('falling');
        });

        star.addEventListener('click', (e) => {
            e.stopPropagation();

            // 🏆 Достижение
            if (window.Achievements) window.Achievements.unlock('foundStar');

            openPhoto();
            removeStar();
        });

        star.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 🏆 Достижение
            if (window.Achievements) window.Achievements.unlock('foundStar');

            openPhoto();
            removeStar();
        }, { passive: false });

        setTimeout(() => {
            if (currentStar === star) {
                removeStar();
            }
        }, CONFIG.flightDuration + 500);
    }

    function removeStar() {
        if (currentStar) {
            currentStar.remove();
            currentStar = null;
        }
        scheduleNextStar();
    }

    function scheduleNextStar() {
        if (nextStarTimer) clearTimeout(nextStarTimer);

        const delay = CONFIG.minInterval +
            Math.random() * (CONFIG.maxInterval - CONFIG.minInterval);

        nextStarTimer = setTimeout(() => {
            spawnStar();
        }, delay);
    }

    function openPhoto() {
        if (!photoModal) return;
        photoModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePhoto() {
        if (!photoModal) return;
        photoModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (photoClose) {
        photoClose.addEventListener('click', closePhoto);
        photoClose.addEventListener('touchstart', (e) => {
            e.preventDefault();
            closePhoto();
        }, { passive: false });
    }

    if (photoModal) {
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) closePhoto();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePhoto();
    });

    setTimeout(() => {
        spawnStar();
    }, CONFIG.startDelay);

})();


/* ================================
   📨 ОТПРАВКА ФОРМЫ БЕЗ РЕДИРЕКТА
================================ */
(function() {
    'use strict';

    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    const FORM_ENDPOINT = 'https://formsubmit.co/ajax/ernurrud@gmail.com';

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ ОТПРАВЛЯЮ...';

        status.className = 'form-status loading';
        status.textContent = '> отправка сообщения...';

        const formData = new FormData(form);

        try {
            const response = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка сети: ' + response.status);
            }

            const data = await response.json();

            if (data.success === 'true' || data.success === true) {
                // 🏆 Достижение
                if (window.Achievements) window.Achievements.unlock('sentForm');

                status.className = 'form-status success';
                status.textContent = '✅ Сообщение отправлено! Спасибо 💜';

                form.reset();

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 1000);

                setTimeout(() => {
                    status.textContent = '';
                    status.className = 'form-status';
                }, 6000);

            } else {
                throw new Error('FormSubmit вернул неуспешный ответ');
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);

            status.className = 'form-status error';
            status.textContent = '❌ Не удалось отправить. Попробуй позже';

            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

            setTimeout(() => {
                status.textContent = '';
                status.className = 'form-status';
            }, 6000);
        }
    });

})();


/* ================================
   🏆 ПАНЕЛЬ ДОСТИЖЕНИЙ
================================ */
function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    const doneEl = document.getElementById('achDone');
    const totalEl = document.getElementById('achTotal');
    const percentEl = document.getElementById('achPercent');

    if (!grid) return;

    if (!window.Achievements) {
        setTimeout(renderAchievements, 100);
        return;
    }

    const all = window.Achievements.getAll();
    const unlocked = window.Achievements.getUnlockedList();

    const total = Object.keys(all).length;
    const done = Object.keys(unlocked).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    if (doneEl) doneEl.textContent = done;
    if (totalEl) totalEl.textContent = total;
    if (percentEl) percentEl.textContent = `(${percent}%)`;

    grid.innerHTML = '';

    Object.entries(all).forEach(([id, ach]) => {
        const isUnlocked = !!unlocked[id];
        const card = document.createElement('div');
        card.className = 'achievement-card ' + (isUnlocked ? 'unlocked' : 'locked');

        let dateHtml = '';
        if (isUnlocked && unlocked[id].unlockedAt) {
            const date = new Date(unlocked[id].unlockedAt);
            const dateStr = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            dateHtml = `<div class="achievement-card-date">✓ ${dateStr}</div>`;
        }

        card.innerHTML = `
            ${!isUnlocked ? '<div class="achievement-card-lock">🔒</div>' : ''}
            <div class="achievement-card-icon">${ach.icon}</div>
            <div class="achievement-card-info">
                <div class="achievement-card-title">${ach.title}</div>
                <div class="achievement-card-desc">${ach.desc}</div>
                ${dateHtml}
            </div>
        `;

        grid.appendChild(card);
    });
}

window.renderAchievements = renderAchievements;

function tryRenderAchievements(attempt) {
    attempt = attempt || 0;
    if (window.Achievements) {
        renderAchievements();
    } else if (attempt < 20) {
        setTimeout(() => tryRenderAchievements(attempt + 1), 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryRenderAchievements(0));
} else {
    tryRenderAchievements(0);
}

window.addEventListener('load', () => {
    setTimeout(renderAchievements, 200);
});

setInterval(() => {
    if (document.getElementById('achievementsGrid')) {
        renderAchievements();
    }
}, 2000);