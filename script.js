// =============================================
// 1. ЭКРАН ВВОДА НИКА
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
// 2. МЕНЮ
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
// 3. ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
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
// 4. ДИАЛОГ ЗАЯВКИ (ЧЕРЕЗ EMAIL)
// =============================================
const dialogContainer = document.getElementById('dialogContainer');
const dialogMessage = document.getElementById('dialogMessage');
const dialogInputArea = document.getElementById('dialogInputArea');
const dialogButtons = document.getElementById('dialogButtons');
const applyStatus = document.getElementById('applyStatus');

let dialogState = { step: 0, data: {} };
const ADMIN_EMAIL = 'setertop911@gmail.com'; // ЗАМЕНИТЕ НА СВОЙ EMAIL!

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

function submitApplication() {
    const reason = dialogState.data.reason || 'Не указана';

    if (!currentUser) {
        applyStatus.className = 'message error';
        applyStatus.textContent = '❌ Сначала войдите на сайт!';
        applyStatus.style.display = 'block';
        return;
    }

    if (!ADMIN_EMAIL || ADMIN_EMAIL === 'admin@gmail.com') {
        applyStatus.className = 'message error';
        applyStatus.textContent = '❌ Настройте email администратора в script.js!';
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

    dialogMessage.innerHTML = '⏳ Открытие почты...';
    dialogInputArea.innerHTML = '';
    dialogButtons.innerHTML = '';
    applyStatus.style.display = 'block';

    // Формируем письмо
    const subject = encodeURIComponent(`📝 Новая заявка #${appData.id} на HeriCraft!`);
    const body = encodeURIComponent(
        `📝 НОВАЯ ЗАЯВКА НА HERICRAFT!\n\n` +
        `🆔 Номер: #${appData.id}\n` +
        `🎮 Ник в Minecraft: ${appData.nickname}\n` +
        `💭 Причина: ${appData.reason}\n` +
        `🕐 Время: ${appData.time}\n\n` +
        `---\n` +
        `✅ Чтобы принять заявку, ответьте на это письмо.\n` +
        `❌ Чтобы отклонить, также ответьте.\n\n` +
        `С уважением,\n` +
        `HeriCraft Team`
    );

    // Открываем почтовую программу
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;

    // Сохраняем в localStorage
    const apps = JSON.parse(localStorage.getItem('applications') || '[]');
    apps.push(appData);
    localStorage.setItem('applications', JSON.stringify(apps));

    dialogMessage.innerHTML = `
        ✅ <span class="highlight">Заявка #${appData.id} готова к отправке!</span><br><br>
        Откроется почтовая программа. Просто нажмите "Отправить".<br><br>
        Спасибо, что участвуете в нашем проекте! 🙌
    `;

    applyStatus.className = 'message success';
    applyStatus.textContent = `✅ Письмо открыто! Отправьте его вручную.`;
    applyStatus.style.display = 'block';

    const homeBtn = document.createElement('button');
    homeBtn.className = 'dialog-btn danger';
    homeBtn.textContent = '🏠 На главную';
    homeBtn.addEventListener('click', function() {
        switchPage('home');
        applyStatus.style.display = 'none';
    });
    dialogButtons.appendChild(homeBtn);

    dialogContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// =============================================
// 5. ИНИЦИАЛИЗАЦИЯ
// =============================================
console.log('📝 HeriCraft загружен!');
console.log('📧 Email администратора:', ADMIN_EMAIL);
console.log('📌 Заявки отправляются через почту');

if (ADMIN_EMAIL === 'admin@gmail.com') {
    console.warn('⚠️ Настройте email администратора в script.js!');
    document.querySelector('.content').insertAdjacentHTML('afterbegin', `
        <div class="message error" style="display:block;margin-bottom:20px;">
            ⚠️ Настройте email администратора в script.js!
            <br><small>Замените ADMIN_EMAIL на свой email</small>
        </div>
    `);
}

if (document.getElementById('apply').classList.contains('active')) {
    initDialog();
}
