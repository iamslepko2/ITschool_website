// ============================================================
//  access.js — система доступа к курсу
//  Версия: 1.0
//  Механика: ключи через консоль с паролем
// ============================================================

(function() {
    'use strict';

    // ========== НАСТРОЙКИ ==========
    const CONFIG = {
        PASSWORD: 'game2025',
    
        // Названия страниц и их соответствие этапам
        PAGES: {
            'ideas.html': 0,   // Этап I
            'spec.html': 1,    // Этап II
            'dev.html': 2,     // Этап III
            'roles.html': 3,   // Этап IV
            'test.html': 4,     // Этап V — Тестирование
            'release.html': 5
        },
    
        // Информация об этапах
        STAGES: [
            { id: 0, name: 'Идея', icon: '💡', page: 'ideas.html' },
            { id: 1, name: 'Спецификация', icon: '📐', page: 'spec.html' },
            { id: 2, name: 'Разработка', icon: '⚙️', page: 'dev.html' },
            { id: 3, name: 'Роли', icon: '👥', page: 'roles.html' },
            { id: 4, name: 'Тестирование', icon: '🧪', page: 'test.html' },
            { id: 5, name: 'Релиз', icon: '🚀', page: 'release.html'}  
        ]
    };

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

    // Генерация хеша (6 символов)
    function generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        hash = Math.abs(hash);
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[(hash + i * 7) % chars.length];
        }
        return code;
    }

    // Генерация ключа для этапа
    function generateKey(teamName, stageId) {
        const base = teamName.trim() || 'game';
        const hash = generateHash(base + stageId + 7);
        return `${base}-stage${stageId + 1}-${hash}`;
    }

    // ========== РАБОТА С ХРАНИЛИЩЕМ ==========

    function getTeamName() {
        return localStorage.getItem('gamedev_team') || '';
    }

    function setTeamName(name) {
        localStorage.setItem('gamedev_team', name);
    }

    function getProgress() {
        try {
            return JSON.parse(localStorage.getItem('gamedev_progress') || '[]');
        } catch {
            return [];
        }
    }

    function setProgress(progress) {
        localStorage.setItem('gamedev_progress', JSON.stringify(progress));
    }

    function isStageUnlocked(stageId) {
        return getProgress().includes(stageId);
    }

    function unlockStage(stageId) {
        const progress = getProgress();
        if (!progress.includes(stageId)) {
            progress.push(stageId);
            setProgress(progress);
            return true;
        }
        return false;
    }

    // ========== ПРОВЕРКА ДОСТУПА К СТРАНИЦЕ ==========

    function checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // Главная страница всегда открыта
        if (currentPage === 'index.html') {
            return true;
        }

        // Проверяем, есть ли этап для этой страницы
        const stageId = CONFIG.PAGES[currentPage];
        if (stageId === undefined) {
            return true; // Если страница не в списке — открыта
        }

        // Проверяем, открыт ли этап
        if (isStageUnlocked(stageId)) {
            return true;
        }

        // Если закрыто — показываем модалку
        showAccessModal(currentPage, stageId);
        return false;
    }

    // ========== МОДАЛЬНОЕ ОКНО ДЛЯ ВВОДА КЛЮЧА ==========

    function showAccessModal(pageName, stageId) {
        // Удаляем старую модалку
        const oldModal = document.getElementById('accessModal');
        if (oldModal) oldModal.remove();

        const stage = CONFIG.STAGES.find(s => s.id === stageId);
        const stageName = stage ? stage.name : 'этап';

        const modal = document.createElement('div');
        modal.id = 'accessModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(11, 17, 32, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 1rem;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(18, 28, 50, 0.95);
                border-radius: 2rem;
                padding: 2rem 2.5rem;
                max-width: 480px;
                width: 100%;
                border: 1px solid rgba(255, 255, 255, 0.06);
                box-shadow: 0 25px 50px -8px rgba(0,0,0,0.6);
            ">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">🔒</span>
                    <h2 style="color: #eef4ff; font-size: 1.4rem; font-weight: 600;">Доступ закрыт</h2>
                    <p style="color: #8aa0d0; font-size: 0.95rem; margin-top: 0.3rem;">
                        Чтобы открыть <strong style="color: #b6c8f0;">«${stageName}»</strong>, введите ключ
                    </p>
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; color: #b6c8f0; font-size: 0.85rem; margin-bottom: 0.3rem;">
                        🔑 Ключ доступа
                    </label>
                    <input type="text" id="accessKeyInput" style="
                        width: 100%;
                        padding: 0.7rem 1rem;
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 0.8rem;
                        color: #eef4ff;
                        font-size: 0.95rem;
                        outline: none;
                        font-family: monospace;
                    ">
                </div>

                <div style="display: flex; gap: 0.8rem;">
                    <button id="accessConfirmBtn" style="
                        flex: 1;
                        padding: 0.7rem;
                        background: linear-gradient(135deg, #4f72b0, #2a4bb0);
                        border: none;
                        color: white;
                        font-weight: 600;
                        border-radius: 0.8rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.95rem;
                    ">✅ Открыть</button>
                    <button id="accessCancelBtn" style="
                        padding: 0.7rem 1.5rem;
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        color: #5b72a3;
                        border-radius: 0.8rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.95rem;
                    ">Назад</button>
                </div>

                <div id="accessError" style="
                    margin-top: 0.8rem;
                    color: #e74c3c;
                    font-size: 0.85rem;
                    display: none;
                    text-align: center;
                ">❌ Неверный ключ! Попробуйте снова.</div>

                <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: #5b72a3;">
                    💡 Ключ можно получить у преподавателя
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Фокус на поле ввода
        const input = document.getElementById('accessKeyInput');
        input.focus();

        // Обработчики
        document.getElementById('accessConfirmBtn').addEventListener('click', function() {
            const key = input.value.trim();
            if (!key) {
                showError('Введите ключ!');
                return;
            }

            // Проверяем ключ
            const teamName = getTeamName();
            const expectedKey = generateKey(teamName || 'game', stageId);

            if (key === expectedKey) {
                // Ключ верный — открываем этап
                unlockStage(stageId);

                // Показываем сообщение об успехе
                const errorEl = document.getElementById('accessError');
                errorEl.style.display = 'none';
                modal.innerHTML = `
                    <div style="
                        background: rgba(18, 28, 50, 0.95);
                        border-radius: 2rem;
                        padding: 2rem 2.5rem;
                        max-width: 480px;
                        width: 100%;
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        box-shadow: 0 25px 50px -8px rgba(0,0,0,0.6);
                        text-align: center;
                    ">
                        <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">🎉</span>
                        <h2 style="color: #eef4ff; font-size: 1.4rem; font-weight: 600;">Доступ открыт!</h2>
                        <p style="color: #b6c8f0; margin: 0.5rem 0 1rem 0;">
                            Этап <strong style="color: #d6e2ff;">«${stageName}»</strong> теперь доступен.
                        </p>
                        <button onclick="location.reload()" style="
                            padding: 0.7rem 2rem;
                            background: linear-gradient(135deg, #2ecc71, #27ae60);
                            border: none;
                            color: #0b1120;
                            font-weight: 700;
                            border-radius: 0.8rem;
                            cursor: pointer;
                            font-size: 0.95rem;
                        ">🔄 Обновить страницу</button>
                    </div>
                `;
            } else {
                showError('❌ Неверный ключ! Попробуйте снова.');
            }
        });

        document.getElementById('accessCancelBtn').addEventListener('click', function() {
            // Возвращаемся на главную
            window.location.href = 'index.html';
        });

        // Ввод по Enter
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('accessConfirmBtn').click();
            }
        });

        function showError(msg) {
            const errorEl = document.getElementById('accessError');
            errorEl.textContent = msg || '❌ Неверный ключ!';
            errorEl.style.display = 'block';
            input.value = '';
            input.focus();
        }
    }

    // ========== КОНСОЛЬНАЯ КОМАНДА ДЛЯ ПРЕПОДАВАТЕЛЯ ==========

    function consoleGetKeys(teamName, password) {
        if (!password) {
            console.error('❌ Доступ запрещён! Требуется пароль.');
            console.log('📌 Пример: getKeys("Название игры", "ваш_пароль")');
            console.log(`ℹ️ Пароль можно узнать у администратора курса.`);
            return;
        }

        if (password !== CONFIG.PASSWORD) {
            console.error('❌ Неверный пароль! Доступ запрещён.');
            return;
        }

        if (!teamName || teamName.trim() === '') {
            console.error('❌ Ошибка: укажи название игры!');
            console.log('📌 Пример: getKeys("Montic monster", "game2025")');
            return;
        }

        const stages = CONFIG.STAGES;

        console.log(`\n✅ Ключи для игры "${teamName}":\n`);
        console.log('━'.repeat(50));
        stages.forEach(stage => {
            const key = generateKey(teamName, stage.id);
            console.log(`${stage.icon} Этап ${stage.id + 1} (${stage.name}): ${key}`);
        });
        console.log('━'.repeat(50));
        console.log('\n📋 Скопируй нужный ключ и отправь студенту.\n');
        console.log('🔒 Чтобы проверить прогресс студента, введи: showProgress("Название игры")');
    }

    function consoleShowProgress(teamName, password) {
        if (!password || password !== CONFIG.PASSWORD) {
            console.error('❌ Доступ запрещён! Требуется пароль.');
            return;
        }

        if (!teamName || teamName.trim() === '') {
            console.error('❌ Укажи название игры');
            return;
        }

        // Сохраняем название, чтобы посмотреть прогресс
        const savedTeam = localStorage.getItem('gamedev_team');
        if (savedTeam && savedTeam !== teamName) {
            console.warn(`⚠️ Сейчас в браузере сохранена другая игра: "${savedTeam}"`);
            console.log(`📌 Для просмотра прогресса "${teamName}" нужно открыть страницу от имени этого студента.`);
            console.log(`💡 Прогресс хранится локально в браузере каждого студента.`);
            return;
        }

        const progress = getProgress();
        const stages = CONFIG.STAGES;

        console.log(`\n📊 Прогресс игры "${teamName}":\n`);
        console.log('━'.repeat(50));
        stages.forEach(stage => {
            const isDone = progress.includes(stage.id);
            const icon = isDone ? '✅' : '🔒';
            console.log(`${icon} Этап ${stage.id + 1} (${stage.name}): ${isDone ? 'ПРОЙДЕН' : 'ЗАКРЫТ'}`);
        });
        console.log('━'.repeat(50));
        console.log(`\n📈 Всего пройдено: ${progress.length} / ${stages.length}\n`);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    // Добавляем команды в глобальный объект window
    window.getKeys = consoleGetKeys;
    window.showProgress = consoleShowProgress;

    // Подсказка в консоли
    console.log('\n🎮 GameDev карта — система доступа');
    console.log('━'.repeat(50));
    console.log('🔑 Для получения ключей введи: getKeys("Название игры", "пароль")');
    console.log('📊 Для проверки прогресса: showProgress("Название игры", "пароль")');
    console.log('━'.repeat(50) + '\n');

    // Проверяем доступ к текущей странице
    document.addEventListener('DOMContentLoaded', function() {
        // Если есть название игры — показываем прогресс в консоли
        const team = getTeamName();
        if (team) {
            console.log(`👋 Привет, "${team}"! Твой прогресс: ${getProgress().length} / ${CONFIG.STAGES.length}`);
        }

        // Проверяем доступ
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage !== 'index.html') {
            const stageId = CONFIG.PAGES[currentPage];
            if (stageId !== undefined && !isStageUnlocked(stageId)) {
                // Показываем модалку с небольшой задержкой
                setTimeout(() => {
                    showAccessModal(currentPage, stageId);
                }, 300);
            }
        }
    });

    // ========== ДЛЯ ТЕСТИРОВАНИЯ ==========
    // Если нужно сбросить прогресс: localStorage.removeItem('gamedev_progress')
    // Если нужно сменить команду: localStorage.setItem('gamedev_team', 'Новая игра')

})();