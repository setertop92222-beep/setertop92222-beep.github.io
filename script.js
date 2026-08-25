// =============================================
// 1. НАСТРОЙКИ TELEGRAM (ЗАМЕНИТЕ НА СВОИ!)
// =============================================
const TELEGRAM_BOT_TOKEN = '8987375609:AAG4GiltPO4fuhc8twbt1oGpvcFykLgTNkc';  // Токен от @BotFather
const TELEGRAM_CHAT_ID = '7227279621';      // Ваш ID в Telegram

// =============================================
// 2. ЭКРАН ВВОДА НИКА
// =============================================
const nicknameScreen = document.getElementById('nicknameScreen');
const nicknameInput = document.getElementById('nicknameInput');
const nicknameSubmitBtn = document.getElementById('nicknameSubmitBtn');
const nicknameError = document.getElementById('nicknameError');
const userMenu = document.getElementById('userMenu');

let currentUser = localStorage.getItem('playerNickname');

if (currentUser) {
    nicknameScreen.classList.add('hidden');
    userMenu.style.display = 'block';
    updateUserUI();
}

nicknameSubmitBtn.addEventListener('click', function() {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        nicknameError.classList.add('show');
        return;
    }
    nicknameError.classList.remove('show');
    localStorage.setItem('playerNickname', nickname);
    currentUser = nickname;
    nicknameScreen.classList.add('hidden');
    userMenu.style.display = 'block';
    updateUserUI();
});

nicknameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') nicknameSubmitBtn.click();
});

// =============================================
// 3. МЕНЮ
// =============================================
const userAvatar = document.getElementById('userAvatar');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownUsername = document.getElementById('dropdownUsername');
const logoutBtn = document.getElementById('logoutBtn');

userAvatar.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
});

document.addEventListener('click', function() {
    dropdownMenu.classList.remove('active');
});

function updateUserUI() {
    if (currentUser) {
        dropdownUsername.textContent = '🎮 ' + currentUser;
        document.querySelector('.status-dot').className = 'status-dot online';
    }
}

logoutBtn.addEventListener('click', function() {
    dropdownMenu.classList.remove('active');
    localStorage.removeItem('playerNickname');
    currentUser = null;
    userMenu.style.display = 'none';
    nicknameScreen.classList.remove('hidden');
    nicknameInput.value = '';
});

// =============================================
// 4. ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
// =============================================
const buttons = document.querySelectorAll('.minecraft-btn');
const sections = document.querySelectorAll('.page-section');

function switchPage(pageId) {
    sections.forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (pageId === 'apply') initDialog();
    }
}

buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        const page = this.dataset.page;
        if (page) switchPage(page);
    });
});

// =============================================
// 5. ОТПРАВКА В TELEGRAM
// =============================================
async function sendToTelegram(data) {
    // Проверяем, заполнены ли настройки
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ВАШ_ТОКЕН_БОТА') {
        return { ok: false, error: '❌ Токен бота не настроен!' };
    }
    if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'ВАШ_CHAT_ID') {
        return { ok: false, error: '❌ Chat ID не настроен!' };
    }

    const text = `📝 **НОВАЯ ЗАЯВКА НА HERICRAFT!**

🆔 **Номер:** #${data.id}
🎮 **Ник в Minecraft:** ${data.nickname}
💭 **Причина:** ${data.reason}
🕐 **Время:** ${data.time}

---
✅ Заявка ожидает рассмотрения.`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();
        return { ok: result.ok, error: result.description };
    } catch (error) {
        return { ok: false, error: '❌ Нет подключения к интернету или Telegram заблокирован' };
    }
}

// =============================================
// 6. ДИАЛОГ ЗАЯВКИ
// =============================================
const dialogContainer = document.getElementById('dialogContainer');
const dialogMessage = document.getElementById('dialogMessage');
const dialogInputArea = document.getElementById('dialogInputArea');
const dialogButtons = document.getElementById('dialogButtons');
const applyStatus = document.getElementById('applyStatus');

let dialogState = { step: 0, data: {} };

function generateId() {
    return Date.now().toString(36).substring(2, 8).toUpperCase();
}

function initDialog() {
    // Проверяем, есть ли уже заявка от этого пользователя
    const apps = JSON.parse(localStorage.getItem('applications') || '[]');
    const existing = apps.find(a => a.nickname === currentUser);

    if (existing) {
        dialogContainer.innerHTML = `
            <div class="dialog-message">
                ${existing.status === 'accepted' 
                    ? '✅ Ваша заявка уже принята! Вы можете заходить на сервер.'
                    : '⏳ Ваша заявка уже на рассмотрении. Ожидайте ответа.'
                }
            </div>
        `;
        return;
    }

    dialogState = { step: 0, data: {} };
    renderDialogStep(0);
}

function renderDialogStep(step) {
    const steps = [
        {
            message: '📝 Расскажи, <span class="highlight">почему ты хочешь присоединиться к нашему проекту?</span>',
            input: true,
            placeholder: 'Напишите причину...',
            field: 'reason'
        }
    ];

    if (step >= steps.length) {
        submitApplication();
        return;
    }

    const currentStep = steps[step];
    dialogMessage.innerHTML = currentStep.message;
    dialogInputArea.innerHTML = '';
    dialogButtons.innerHTML = '';

    if (currentStep.input) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'dialog-input';
        input.placeholder = currentStep.placeholder || 'Введите текст...';
        input.id = 'dialogInput';
        if (dialogState.data[currentStep.field]) {
            input.value = dialogState.data[currentStep.field];
        }
        dialogInputArea.appendChild(input);
        setTimeout(() => input.focus(), 100);

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const value = this.value.trim();
                if (value) {
                    dialogState.data[currentStep.field] = value;
                    renderDialogStep(step + 1);
                }
            }
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'dialog-btn primary';
        nextBtn.textContent = '➡️ Далее';
        nextBtn.addEventListener('click', function() {
            const input = document.getElementById('dialogInput');
            const value = input ? input.value.trim() : '';
            if (value) {
                dialogState.data[currentStep.field] = value;
                renderDialogStep(step + 1);
            }
        });
        dialogButtons.appendChild(nextBtn);
    }
}

async function submitApplication() {
    const reason = dialogState.data.reason || 'Не указана';

    if (!currentUser) {
        applyStatus.className = 'message error';
        applyStatus.textContent = '❌ Сначала войдите на сайт!';
        applyStatus.style.display = 'block';
        return;
    }

    const appData = {
        id: generateId(),
        time: new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        nickname: currentUser,
        reason: reason
    };

    dialogMessage.innerHTML = '⏳ Отправка заявки...';
    dialogInputArea.innerHTML = '';
    dialogButtons.innerHTML = '';
    applyStatus.style.display = 'block';

    const result = await sendToTelegram(appData);

    if (result.ok) {
        const apps = JSON.parse(localStorage.getItem('applications') || '[]');
        apps.push(appData);
        localStorage.setItem('applications', JSON.stringify(apps));

        dialogMessage.innerHTML = `
            ✅ <span class="highlight">Заявка #${appData.id} успешно отправлена!</span><br><br>
            Администратор рассмотрит её в ближайшее время.<br><br>
            Спасибо, что участвуете в нашем проекте! 🙌
        `;

        applyStatus.className = 'message success';
        applyStatus.textContent = `✅ Заявка #${appData.id} отправлена!`;
        applyStatus.style.display = 'block';

        const homeBtn = document.createElement('button');
        homeBtn.className = 'dialog-btn danger';
        homeBtn.textContent = '🏠 На главную';
        homeBtn.addEventListener('click', function() {
            switchPage('home');
            applyStatus.style.display = 'none';
        });
        dialogButtons.appendChild(homeBtn);

    } else {
        dialogMessage.innerHTML = `
            ❌ <span class="highlight">Ошибка отправки заявки!</span><br><br>
            ${result.error || 'Попробуйте позже.'}
        `;

        applyStatus.className = 'message error';
        applyStatus.textContent = `❌ ${result.error || 'Неизвестная ошибка'}`;
        applyStatus.style.display = 'block';

        const retryBtn = document.createElement('button');
        retryBtn.className = 'dialog-btn primary';
        retryBtn.textContent = '🔄 Попробовать снова';
        retryBtn.addEventListener('click', function() {
            applyStatus.style.display = 'none';
            initDialog();
        });
        dialogButtons.appendChild(retryBtn);
    }

    dialogContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// =============================================
// 7. ИНИЦИАЛИЗАЦИЯ
// =============================================
console.log('📝 HeriCraft загружен!');

// Проверяем настройки Telegram
if (TELEGRAM_BOT_TOKEN === 'ВАШ_ТОКЕН_БОТА' || TELEGRAM_CHAT_ID === 'ВАШ_CHAT_ID') {
    console.warn('⚠️ Настройки Telegram не заполнены! Заявки не будут отправляться.');
    document.querySelector('.content').insertAdjacentHTML('afterbegin', `
        <div class="message error" style="display:block;margin-bottom:20px;">
            ⚠️ Настройки Telegram не заполнены! Заявки не будут отправляться.
            <br><small>Откройте script.js и вставьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID</small>
        </div>
    `);
}

// Если страница заявок активна — запускаем диалог
if (document.getElementById('apply').classList.contains('active')) {
    initDialog();
}
