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
            color: Math.random() > 0.7
                ? '#39ff14'
                : (Math.random() > 0.5 ? '#00f0ff' : '#b026ff')
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
   ТЕРМИНАЛ
================================ */
const terminalBody = document.getElementById('terminalBody');
const terminalInput = document.getElementById('terminalInput');
const terminal = document.getElementById('terminal');
const cursor = document.getElementById('cursor');

let commandHistory = [];
let historyIndex = -1;

/* ================================
   ПЕЧАТЬ СТРОК
================================ */
function printLine(text, className = '') {
    const line = document.createElement('div');
    line.className = 'line ' + className;
    line.innerHTML = text;
    terminalBody.appendChild(line);
    scrollToBottom();
    return line;
}

// Печать посимвольно (для эффекта)
function printTyping(text, className = '', speed = 15) {
    return new Promise(resolve => {
        const line = document.createElement('div');
        line.className = 'line ' + className;
        terminalBody.appendChild(line);
        scrollToBottom();

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                // Обработка HTML-тегов (просто вставляем как текст, но с поддержкой span)
                if (text[i] === '<') {
                    const end = text.indexOf('>', i);
                    if (end !== -1) {
                        line.innerHTML += text.substring(i, end + 1);
                        i = end + 1;
                        return;
                    }
                }
                line.innerHTML += text[i];
                i++;
                scrollToBottom();
            } else {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}

function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function printEmpty() {
    printLine('&nbsp;', '');
}

/* ================================
   ЗАДЕРЖКА
================================ */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ================================
   КОМАНДЫ
================================ */
const COMMANDS = {
    help: {
        desc: 'показать список команд',
        run: async () => {
            printLine('&gt; Доступные команды:', 'accent');
            printEmpty();
            const cmds = [
                ['help',      'этот список'],
                ['about',     'обо мне'],
                ['skills',    'навыки и технологии'],
                ['projects',  'мои проекты'],
                ['contact',   'контакты'],
                ['whoami',    'инфа о пользователе'],
                ['date',      'текущая дата и время'],
                ['echo',      'повторить текст'],
                ['matrix',    'эффект матрицы ✨'],
                ['hack',      'взломать Пентагон 😎'],
                ['sudo',      'попробуй!'],
                ['clear',     'очистить экран'],
            ];
            cmds.forEach(([cmd, desc]) => {
                printLine(
                    `  <span style="color:#00f0ff">${cmd.padEnd(12, ' ')}</span>` +
                    `<span style="color:#667">— ${desc}</span>`
                );
            });
            printEmpty();
            printLine('&gt; подсказка: ↑ ↓ — история, Tab — автодополнение', 'dim');
                    if (window.Achievements) window.Achievements.unlock('terminalHelp');

        }
    },

    about: {
        desc: 'обо мне',
        run: async () => {
            printLine('&gt; Загружаю профиль...', 'info');
            await sleep(300);
            printEmpty();
            printLine('👤 ИМЯ:     ERNUR', 'success');
            printLine('🎂 ВОЗРАСТ: где-то между 0b1111 и 0x20', 'success');
            printLine('🌍 ЛОКАЦИЯ: Земля, сектор Млечный путь', 'success');
            printLine('💼 РОЛЬ:    Frontend-разработчик', 'success');
            printLine('☕ Чай:    ∞ чашек в день', 'warn');
            printLine('👨 Асылан:   Татакбас который я ненавижу его (Щучу)', 'pink');
            printEmpty();
            printLine('&gt; Пишу код, делаю игры, ломаю стереотипы.', 'dim');
            printLine('&gt; Люблю неон, пиксель-арт и ретро-игры.', 'dim');
            printLine('&gt; Верю, что код — это поэзия для машин.', 'dim');
        }
    },

    skills: {
        desc: 'навыки',
        run: async () => {
            printLine('&gt; Сканирую нейронную сеть...', 'info');
            await sleep(400);
            printEmpty();
            const skills = [
                ['HTML/CSS',      90, '🟢'],
                ['JavaScript',    85, '🟡'],
                ['Python',        75, '🟡'],
                ['Node.js',       70, '🟡'],
                ['React',         65, '🔵'],
                ['UI/UX',         80, '🟢'],
                ['Git',           85, '🟢'],
                ['Linux',         70, '🟡'],
            ];
            skills.forEach(([name, lvl, dot]) => {
                const filled = Math.floor(lvl / 10);
                const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
                printLine(
                    `  ${dot} ${name.padEnd(12, ' ')} ` +
                    `<span style="color:#39ff14">${bar}</span> ` +
                    `<span style="color:#667">${lvl}%</span>`
                );
            });
            printEmpty();
            printLine('&gt; Прокачиваю новые скиллы каждый день 💪', 'success');
        }
    },

    projects: {
        desc: 'проекты',
        run: async () => {
            printLine('&gt; Ищу проекты в ~/workspace...', 'info');
            await sleep(400);
            printEmpty();
            const projects = [
                ['🐍 Snake Game',       'game.html',     'классическая змейка с пиксель-артом'],
                ['🕹️ Retro Arcade',     'retro.html',    '3 мини-игры: breakout, memory, reaction'],
                ['👾 Alien Invasion',   'alien.html',    'шутер с пришельцами и бонусами'],
                ['🚀 Space Runner',     'space.html',    'бесконечный раннер с магазином'],
                ['💾 Dev Terminal',     'code.html',     'этот терминал :)'],
            ];
            projects.forEach(([name, file, desc]) => {
                printLine(
                    `  <span style="color:#39ff14">${name}</span>` +
                    ` <span style="color:#667">→</span> ` +
                    `<span class="link" data-link="${file}">${file}</span>`
                );
                printLine(`     <span style="color:#667">${desc}</span>`);
            });
            printEmpty();
            printLine('&gt; Кликабельные ссылки ведут на страницы игр!', 'success');

            // Обработчики для ссылок
            setTimeout(() => {
                terminalBody.querySelectorAll('.link[data-link]').forEach(link => {
                    link.addEventListener('click', () => {
                        window.location.href = link.dataset.link;
                    });
                });
            }, 50);
        }
    },

    contact: {
        desc: 'контакты',
        run: async () => {
            printLine('&gt; Устанавливаю соединение...', 'info');
            await sleep(400);
            printEmpty();
            printLine('📧 Email:    <span class="link">you@example.com</span>', 'success');
            printLine('💬 Telegram: <span class="link">@your_username</span>', 'success');
            printLine('🐙 GitHub:   <span class="link">github.com/yourname</span>', 'success');
            printLine('🎮 Discord:  yourname#1234', 'success');
            printEmpty();
            printLine('&gt; Открыт для предложений и коллабораций!', 'warn');
        }
    },

    whoami: {
        desc: 'инфа о пользователе',
        run: async () => {
            printLine('&gt; visitor@mysite', 'success');
            printLine('&gt; Роль: гость', 'dim');
            printLine('&gt; IP: 127.0.0.1 (ну почти 😄)', 'dim');
            printLine('&gt; Браузер: ' + navigator.userAgent.split(') ')[0].split(' (')[0], 'dim');
            printLine('&gt; Экран: ' + window.screen.width + 'x' + window.screen.height, 'dim');
        }
    },

    date: {
        desc: 'дата и время',
        run: async () => {
            const now = new Date();
            printLine('&gt; ' + now.toLocaleString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }), 'success');
        }
    },

    echo: {
        desc: 'повторить текст',
        run: async (args) => {
            if (args.length === 0) {
                printLine('&gt; Использование: echo [текст]', 'error');
            } else {
                printLine('&gt; ' + args.join(' '), 'success');
            }
        }
    },

    matrix: {
        desc: 'эффект матрицы',
        run: async () => {
            if (window.Achievements) window.Achievements.unlock('terminalMatrix');
            printLine('&gt; Инициализация Матрицы...', 'success');
            await sleep(300);
            for (let i = 0; i < 12; i++) {
                const chars = '01アイウエオカキクケコサシスセソタチツテト';
                let line = '';
                for (let j = 0; j < 60; j++) {
                    line += chars[Math.floor(Math.random() * chars.length)];
                }
                const color = i === 11 ? '#39ff14' : '#005500';
                printLine(`<span style="color:${color}">${line}</span>`);
                await sleep(60);
            }
            printEmpty();
            printLine('&gt; Wake up, Neo... 🐇', 'success');
        }
    },

    hack: {
        desc: 'взломать Пентагон',
        run: async () => {
            if (window.Achievements) window.Achievements.unlock('terminalHelp');
            printLine('&gt; Инициализация взлома...', 'warn');
            await sleep(300);
            printLine('&gt; [████░░░░░░] 40%', 'info');
            await sleep(400);
            printLine('&gt; [████████░░] 80%', 'info');
            await sleep(400);
            printLine('&gt; [██████████] 100%', 'success');
            await sleep(300);
            printEmpty();
            printLine('&gt; ВЗЛОМ УСПЕШЕН! 😎', 'success');
            printLine('&gt; ...шутка 😄 Это просто сайт', 'warn');
            printLine('&gt; Не занимайся этим в реальной жизни!', 'error');
        }
    },

    sudo: {
        desc: 'попробуй!',
        run: async () => {
            printLine('&gt; [sudo] password for visitor:', 'warn');
            await sleep(800);
            printLine('&gt; Sorry, try again.', 'error');
            await sleep(400);
            printLine('&gt; Sorry, try again.', 'error');
            await sleep(400);
            printLine('&gt; sudo: 3 incorrect password attempts', 'error');
            printEmpty();
            printLine('&gt; Классика 😄 Попробуй "hack" или "matrix"', 'dim');
        }
    },

    clear: {
        desc: 'очистить экран',
        run: async () => {
            terminalBody.innerHTML = '';
        }
    },
};

/* ================================
   ВЫПОЛНЕНИЕ КОМАНДЫ
================================ */
async function runCommand(input) {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Печатаем команду в истории
    printLine(
        `<span style="color:#ff2e97">visitor@mysite:~$</span> ${escapeHtml(trimmed)}`,
        'cmd'
    );

    // Сохраняем в историю
    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Парсим
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Ищем команду
    if (COMMANDS[cmd]) {
        await COMMANDS[cmd].run(args);
    } else {
        printLine(`&gt; команда не найдена: ${escapeHtml(cmd)}`, 'error');
        printLine('&gt; введи "help" для списка команд', 'dim');
    }

    printEmpty();
    scrollToBottom();
}

/* ================================
   ЗАЩИТА ОТ XSS
================================ */
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ================================
   ОБРАБОТКА ВВОДА
================================ */
terminalInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const value = terminalInput.value;
        terminalInput.value = '';
        await runCommand(value);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            terminalInput.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            terminalInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            terminalInput.value = '';
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const current = terminalInput.value.toLowerCase();
        if (!current) return;
        const matches = Object.keys(COMMANDS).filter(c => c.startsWith(current));
        if (matches.length === 1) {
            terminalInput.value = matches[0];
        } else if (matches.length > 1) {
            printLine('&gt; Варианты: ' + matches.join(', '), 'dim');
            scrollToBottom();
        }
    } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        terminalBody.innerHTML = '';
    }
});

// Клик по терминалу = фокус на вводе
terminal.addEventListener('click', (e) => {
    // Не фокусируемся при клике на ссылку
    if (e.target.classList.contains('link')) return;
    terminalInput.focus();
});

// Скрываем/показываем курсор при фокусе
terminalInput.addEventListener('focus', () => cursor.classList.remove('hidden'));
terminalInput.addEventListener('blur', () => cursor.classList.add('hidden'));

/* ================================
   БЫСТРЫЕ КОМАНДЫ
================================ */
document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const cmd = btn.dataset.cmd;
        await runCommand(cmd);
        terminalInput.focus();
    });
});

/* ================================
   ПРИВЕТСТВИЕ
================================ */
async function showWelcome() {
    // ASCII-логотип
    const ascii = [
        "  ____  _____ ______   __",
        " |  _ \\| ____|  _ \\ \\ / /",
        " | | | |  _| | |_) \\ V / ",
        " | |_| | |___|  _ < | |  ",
        " |____/|_____|_| \\_\\|_|  ",
    ];
    ascii.forEach(l => printLine(l, 'ascii'));
    printEmpty();
    printLine('&gt; Добро пожаловать в <span style="color:#39ff14">DEV TERMINAL</span>', 'success');
    printLine('&gt; версия 1.0.0', 'dim');
    printEmpty();
    await sleep(300);
    printLine('&gt; Введи <span style="color:#ffcc00">help</span> для списка команд или нажми кнопку сверху', 'info');
    printEmpty();

    // Автостартовая команда about
    await sleep(500);
    printLine('&gt; Автозапуск: about', 'dim');
    await COMMANDS.about.run([]);
    printEmpty();
}

/* ================================
   СТАРТ
================================ */
terminalInput.focus();
showWelcome();

// Фокус при клике на страницу
document.addEventListener('click', () => {
    terminalInput.focus();
});