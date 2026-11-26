function applyScale() {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;
    const width = activeScreen.offsetWidth;
    if (width === 0) return;
    const scale = width / 576;
    document.documentElement.style.setProperty('--scale', scale);
}

// Вызывать при загрузке и ресайзе
window.addEventListener('resize', applyScale);


// Функция для чтения textSize из localStorage
function getTextSize() {
    return localStorage.getItem('textSize') || 'm';
}

// Функция для сохранения textSize в localStorage
function saveTextSize(size) {
    localStorage.setItem('textSize', size);
}

// Функция для применения textSize к текстам
function applyTextSize(size) {
    const sizes = {
        's': 8,
        'm': 9,
        'l': 10,
        'xl': 11
    };

    const fontSize = sizes[size] || 9;

    document.querySelectorAll('.task-description, .story-content, .answer-content').forEach(text => {
        const section = text.closest('.screen');
        // Если экран скрыт (display: none), пропускаем, чтобы размер не стал 0
        if (!section || section.offsetWidth === 0) return; 
        
        const scale = section.offsetWidth / 576;
        
        // ВОТ ГЛАВНЫЙ ФИКС: используем setProperty с 'important', 
        // чтобы перебить жесткие стили из CSS
        text.style.setProperty('font-size', (fontSize * scale) + 'px', 'important');
    });
}

// Функция для обновления подсветки кнопок размера
function updateSizeButtons(activeSize) {
    document.querySelectorAll('.size-btn').forEach(btn => {
        if (btn.dataset.size === activeSize) {
            btn.classList.add('active'); // Включаем подсветку
        } else {
            btn.classList.remove('active'); // Выключаем
        }
    });
}

// Переход с затемнением
function transitionTo(screenId, saveSliders = false) {
    const fade = document.getElementById('screen-fade');
    if (!fade) { goTo(screenId, saveSliders); return; }
    
    fade.classList.add('active');
    setTimeout(() => {
        try {
            goTo(screenId, saveSliders); // передаем флаг дальше
        } catch (e) {
            console.error('goTo упал:', e);
        } finally {
            setTimeout(() => fade.classList.remove('active'), 50);
        }
    }, 300);
}

// Показать указанный экран (базовая функция без анимации)
function goTo(screenId, saveSettings = false) {
    // Прямой переход
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    playBGMForScreen(screenId);

    // СОХРАНЕНИЕ (если вышли через "Сохранить и выйти")
    if (screenId !== '02-settings' && saveSettings) {
        saveTextSize(draftSize);
        saveSliderPositions();
    }

    // Восстановление при входе в настройки
    if (screenId === '02-settings') {
        restoreSliderPositions();
        draftSize = getTextSize();
        updateSizeButtons(draftSize);
    } 
    // Применение размера и прозрачности при входе на 3 и 4 экраны
    else if (screenId === '03-task1' || screenId === '04-task2') {
        applyTextSize(getTextSize()); // берем именно СОХРАНЕННЫЙ размер
        const alpha = document.getElementById('slider4').value / 100;
        document.documentElement.style.setProperty('--panel-alpha', alpha);
    }
}

// Сохранение ползунков в localStorage
function saveSliderPositions() {
    const sliders = document.querySelectorAll('.slider');
    const positions = Array.from(sliders).map(slider => slider.value);
    localStorage.setItem('sliderPositions', JSON.stringify(positions));
}

// Восстановление ползунков из localStorage
function restoreSliderPositions() {
    const saved = localStorage.getItem('sliderPositions');
    const defaultPositions = ['68.3', '83.2', '45.9', '27.0'];
    const positions = saved ? JSON.parse(saved) : defaultPositions;

    const sliders = document.querySelectorAll('.slider');
    sliders.forEach((slider, index) => {
        slider.value = positions[index] || defaultPositions[index];
    });
}

// Сброс ползунков к позициям при входе
function resetSliderPositions() {
    const defaultPositions = ['68.3', '83.2', '45.9', '27.0'];
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach((slider, index) => {
        slider.value = defaultPositions[index];
    });
}

// Переменные для управления размером текста
let draftSize = 'm'; // Текущий выбранный размер (не сохранён)

// Подсказки для 03-task1
let currentIndex03 = 0;  // 0 = первый текст, 1 = второй
const hintTexts03 = [
    "В инвентаре можно соединить предметы",
    "Что-то деревянное и что-то гибкое точно поможет"
];
let hintTimer03 = null;

function showHint03(index) {
    const popup = document.getElementById('hint-popup-1');
    const content = popup.querySelector('.hint-popup-content');

    content.textContent = hintTexts03[index];
    popup.classList.add('visible');

    // Сброс таймера
    if (hintTimer03) clearTimeout(hintTimer03);
    hintTimer03 = setTimeout(() => {
        popup.classList.remove('visible');
    }, 5000);
}

// Подсказка для 04-task2
let hint04Visible = false;
let hintTimer04 = null;

function toggleHint04() {
    const popup = document.getElementById('hint-04');

    if (hint04Visible) {
        popup.classList.remove('visible');
        hint04Visible = false;
        return;
    }

    popup.classList.add('visible');
    hint04Visible = true;

    // Сброс таймера
    if (hintTimer04) clearTimeout(hintTimer04);
    hintTimer04 = setTimeout(() => {
        popup.classList.remove('visible');
        hint04Visible = false;
    }, 5000);
}

// Обновленная функция showHint для совместимости
function showHint(hintType) {
    if (hintType === 1) {
        onHintClick();
    } else if (hintType === 2) {
        // Старая логика для task2
        // ... (оставляем как было)
    }
}


// Обработка анимации предметов
function collectItem(itemId) {
    const item = document.querySelector(`[data-item="${itemId}"]`);
    const inventory = document.querySelector('[id="03-task1"] .hotspot[data-action="highlight"]');

    // ВОТ ИСПРАВЛЕННЫЙ БАГ (было inventory без !)
    if (!item || !inventory) return;

    // Добавляем класс для анимации
    item.classList.add('item-collecting');
    
    // Делаем кнопку видимой на время полета (светящийся шар)
    item.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    item.style.borderRadius = '50%';
    item.style.boxShadow = '0 0 20px #fff';
    item.style.pointerEvents = 'none'; // Чтобы нельзя было кликнуть дважды

    // Вычисляем, куда лететь
    const inventoryRect = inventory.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    // Запускаем полет (сдвиг + уменьшение + исчезновение)
    setTimeout(() => {
        item.style.transform = `
            translate(${inventoryRect.left - itemRect.left}px, 
                      ${inventoryRect.top - itemRect.top}px) 
            scale(0.2)
        `;
        item.style.opacity = '0';
    }, 10);

    // Подсветка инвентаря в момент прилёта
    setTimeout(() => {
        inventory.classList.add('pressed');
        // Убираем искусственную подсветку через 0.15 сек
        setTimeout(() => inventory.classList.remove('pressed'), 150);
    }, 700);

    // Удаление предмета и проверка на переход
    setTimeout(() => {
        item.style.display = 'none';

        // Проверяем, остались ли предметы
        const remainingItems = document.querySelectorAll('[id="03-task1"] .item:not([style*="display: none"])');
        if (remainingItems.length === 0) {
            // Если оба собраны — переход на task2 через затемнение
            setTimeout(() => {
                transitionTo('04-task2');
            }, 500);
        }
    }, 700);
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Читаем сохранённый textSize или ставим по умолчанию
    draftSize = getTextSize();

    // Устанавливаем начальный масштаб
    applyScale();

    // Устанавливаем начальную прозрачность
    if (document.getElementById('slider4')) {
        const alpha = document.getElementById('slider4').value / 100;
        document.documentElement.style.setProperty('--panel-alpha', alpha);
    }

    // Устанавливаем начальный размер при загрузке
    if (document.getElementById('03-task1') || document.getElementById('04-task2')) {
        applyTextSize(draftSize);
    }

    // Обновляем подсветку кнопок размера при загрузке
    updateSizeButtons(draftSize);

    // Обработчик для кнопок размера
    document.addEventListener('click', function(e) {
        const sizeBtn = e.target.closest('.size-btn');
        if (!sizeBtn) return;

        // Изменяем draftSize (без сохранения в localStorage)
        draftSize = sizeBtn.dataset.size;
        updateSizeButtons(draftSize);
    });

    // Обработчик для ползунка прозрачности
    document.getElementById('slider4')?.addEventListener('input', function() {
        const alpha = this.value / 100;
        document.documentElement.style.setProperty('--panel-alpha', alpha);
    });

    // Обработчик для плашек-ответов (они сами являются кнопками)
    document.addEventListener('click', function(e) {
        const answer = e.target.closest('.answer-text');
        if (!answer) return;

        // Плашка-ответ ведёт на login через затемнение
        playSFX('answer');
        transitionTo('01-login');
    });

    // Обработчик для закрытия подсказки 04-task2 кликом мимо
    document.addEventListener('click', function(e) {
        if (hint04Visible && !e.target.closest('#hint-04') && !e.target.closest('[data-hint="2"]')) {
            const popup = document.getElementById('hint-04');
            popup.classList.remove('visible');
            hint04Visible = false;
        }
    });

    // Эффект ряби при клике на горячие зоны
    document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.hotspot');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });

        // Обработка кликов по горячим зонам (логика)
    document.addEventListener('click', function(e) {
        const hotspot = e.target.closest('.hotspot');

        if (!hotspot) return;

        // Определяем действие (теперь объявляем ОДИН раз)
        const action = hotspot.getAttribute('data-action');
        const saveAttr = hotspot.getAttribute('data-save');

        // --- ЛОГИКА ЗВУКОВ ---
        if (action === 'hint') {
            playSFX('hint');
        } else if (action === 'collect') {
            const itemId = hotspot.getAttribute('data-item');
            playSFX(itemId === '1' ? 'item1' : 'item2');
        } else if (saveAttr === 'true' || saveAttr === 'false') {
            playSFX('save');
        } else {
            playSFX('click'); // Звук для обычных кнопок, размеров текста и т.д.
        }
        // ----------------------

        // Если это кнопка размера - уже обработана выше
        if (hotspot.classList.contains('size-btn')) return;

        // Навигация и остальная логика
        if (action === 'navigate') {
            const screenId = hotspot.getAttribute('data-screen');
            const save = hotspot.getAttribute('data-save');

            if (screenId) {
                transitionTo(screenId, save === 'true');
            }
        } else if (action === 'highlight') {
            // Только визуальный эффект ряби - ничего больше
            return;
        } else if (action === 'hint') {
            const hintType = hotspot.getAttribute('data-hint');
            
            // Определяем, на каком экране мы находимся
            const currentScreen = hotspot.closest('.screen');
            if (currentScreen && currentScreen.id === '03-task1') {
                showHint03(currentIndex03); // Исправила на currentIndex03 (как объявлено вверху)
                currentIndex03 = (currentIndex03 + 1) % hintTexts03.length;
            } else if (currentScreen && currentScreen.id === '04-task2') {
                toggleHint04();
            }
        } else if (action === 'collect') {
            const itemId = hotspot.getAttribute('data-item');
            collectItem(itemId);
        }
    });

    // Обработка кликов по элементам выпадающих списков
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('dropdown-item')) {
            const dropdownId = e.target.parentElement.id;
            const displayId = dropdownId.replace('content', '');
            const dropdown = document.getElementById(displayId);

            if (dropdown) {
                dropdown.textContent = e.target.getAttribute('data-value');
                document.getElementById(dropdownId).style.display = 'none';
            }
        }
    });

    // Обработка кликов по триггерам выпадающих списков
    document.addEventListener('click', function(e) {
        const trigger = e.target.closest('.dropdown-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();

            const dropdownId = trigger.getAttribute('data-dropdown');
            const dropdown = document.getElementById(`dropdown-content${dropdownId}`);

            // Закрываем все другие списки
            document.querySelectorAll('.dropdown-content').forEach(d => {
                if (d.id !== dropdown.id) {
                    d.style.display = 'none';
                }
            });

            // Переключаем текущий список
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
    });

    // Единый делегированный обработчик для выпадающих списков
    document.addEventListener('click', (e) => {
        const arrow = e.target.closest('.dropdown-arrow');
        if (arrow) {
            e.stopPropagation();
            e.preventDefault();
            const dropdown = arrow.closest('.dropdown');
            document.querySelectorAll('.dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
            return;
        }
        const item = e.target.closest('.dropdown-menu li');
        if (item) {
            e.stopPropagation();
            e.preventDefault();
            const dropdown = item.closest('.dropdown');
            const valueEl = dropdown.querySelector('.dropdown-value');
            // читаем значение ДО закрытия меню, из data-value (не из innerText)
            const newValue = item.dataset.value || item.textContent.trim();
            if (valueEl) valueEl.textContent = newValue;
            dropdown.classList.remove('open');
            return;
        }
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        }
    });

    // Показываем первый экран
    transitionTo('01-login');

    // Обработчик resize для пересчета масштаба
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            applyScale();
            if (document.getElementById('03-task1') || document.getElementById('04-task2')) {
                applyTextSize(draftSize);
            }
        }, 100);
    });

    // Временная отладочная функция
    window.debugPanels = function() {
        document.querySelectorAll('.scene-panel, .plot-panel, .task-panel, .story-panel, .text-panel, [class*="panel"]').forEach((p, i) => {
            const r = p.getBoundingClientRect();
            const s = p.closest('.screen').getBoundingClientRect();
            const cs = getComputedStyle(p);
            console.log(i, '| class:', p.className,
                '| offset:', (r.left - s.left).toFixed(1), (r.top - s.top).toFixed(1),
                '| size:', r.width.toFixed(1), '×', r.height.toFixed(1),
                '| section:', s.width.toFixed(1), '×', s.height.toFixed(1),
                '| box-sizing:', cs.boxSizing,
                '| padding:', cs.padding,
                '| width:', cs.width);
        });
    };
});

let currentHintIndex = 0;
let hintTimeout = null;

function showHint(index) {
    const popup = document.querySelector('.hint-popup');
    if (!popup) return;
    
    // Если попап уже открыт - листаем дальше (цикл)
    if (popup.classList.contains('visible')) {
        currentHintIndex = (currentHintIndex + 1) % 2;
    } else {
        currentHintIndex = 0;
    }
    
    const texts = [
        "В инвентаре можно соединить предметы",
        "Тебе точно поможет что-то деревянное и что-то гибкое"
    ];
    
    popup.textContent = texts[currentHintIndex];
    popup.classList.add('visible');
    
    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => {
        popup.classList.remove('visible');
    }, 5000);
}

// Закрытие подсказки кликом мимо
document.addEventListener('click', (e) => {
    const popup = document.querySelector('.hint-popup');
    if (popup && popup.classList.contains('visible')) {
        if (!e.target.closest('.hint-popup') && !e.target.closest('[data-action="hint"]')) {
            popup.classList.remove('visible');
            clearTimeout(hintTimeout);
        }
    }
});

// =======================================================
// АУДИО-ДВИЖОК
// =======================================================

// 1. Создаем объекты звуков
const bgmTracks = {
    'menu': new Audio('audio/bgm_menu.mp3'),
    'task1': new Audio('audio/bgm_task1.mp3'),
    'task2': new Audio('audio/bgm_task2.mp3')
};

// Объекты для звуковых эффектов
const sfx = {
    click: new Audio('audio/sfx_click.mp3'),
    save: new Audio('audio/sfx_save.mp3'),
    answer: new Audio('audio/sfx_answer.mp3'),
    hint: new Audio('audio/sfx_hint.mp3'),
    item1: new Audio('audio/sfx_item1.mp3'),
    item2: new Audio('audio/sfx_item2.mp3')
};

let soundVolume = 0.5;  // Громкость звуков (slider3)
let effectVolume = 0.5; // Громкость эффектов (slider1)

// Функция воспроизведения звуков
function playSFX(name) {
    if (!sfx[name]) return;
    // Клонируем, чтобы можно было быстро кликать по кнопкам (звуки не обрывают друг друга)
    const sound = sfx[name].cloneNode(); 
    
    if (name === 'click' || name === 'save' || name === 'answer') {
        sound.volume = soundVolume;
    } else {
        sound.volume = effectVolume;
    }
    sound.play().catch(e => console.warn("Звук не запустился:", e));
}

// Привязка ползунков громкости эффектов (1) и звуков (3)
document.getElementById('slider1')?.addEventListener('input', function() {
    effectVolume = this.value / 100;
});
document.getElementById('slider3')?.addEventListener('input', function() {
    soundVolume = this.value / 100;
});

// Зацикливаем всю фоновую музыку (так как треки короткие)
Object.values(bgmTracks).forEach(audio => {
    audio.loop = true;
});

let currentBgm = null;      // Текущий играющий трек
let bgmVolume = 0.5;        // Громкость музыки (по умолчанию 50%)
let fadeInterval = null;    // Для плавного затухания

// 2. Функция для переключения музыки с плавным переходом (fade)
function playBGMForScreen(screenId) {
    let targetTrack = 'menu';
    if (screenId === '03-task1') targetTrack = 'task1';
    if (screenId === '04-task2') targetTrack = 'task2';

    const nextTrack = bgmTracks[targetTrack];

    // Если этот трек уже играет — ничего не делаем
    if (currentBgm === nextTrack && !currentBgm.paused) return;

    // Плавно гасим текущий трек
    if (currentBgm) {
        let fadeOut = setInterval(() => {
            if (currentBgm.volume > 0.05) {
                currentBgm.volume -= 0.05;
            } else {
                clearInterval(fadeOut);
                currentBgm.pause();
                currentBgm.currentTime = 0; // Сброс в начало
                
                // Запускаем новый трек
                currentBgm = nextTrack;
                currentBgm.volume = 0;
                currentBgm.play().catch(e => console.warn("Браузер заблокировал автоплей, нужен клик."));
                fadeIn();
            }
        }, 50);
    } else {
        // Если это самый первый запуск
        currentBgm = nextTrack;
        currentBgm.volume = 0;
        currentBgm.play().catch(e => console.warn("Браузер заблокировал автоплей, нужен клик."));
        fadeIn();
    }

    // Функция плавного появления
    function fadeIn() {
        let fadeInInterval = setInterval(() => {
            if (currentBgm.volume < bgmVolume - 0.05) {
                currentBgm.volume += 0.05;
            } else {
                currentBgm.volume = bgmVolume;
                clearInterval(fadeInInterval);
            }
        }, 50);
    }
}

// 3. Привязка ползунков громкости из настроек
// (slider2 = музыка, slider3 = звуки, slider1 = эффекты)
document.getElementById('slider2')?.addEventListener('input', function() {
    bgmVolume = this.value / 100;
    if (currentBgm && currentBgm.volume > 0) {
        currentBgm.volume = bgmVolume; // Мгновенно меняем громкость текущей музыки
    }
});

// Запускаем меню-музыку при первом клике (будим заблокированный трек)
document.addEventListener('click', function startAudio() {
    if (currentBgm && currentBgm.paused) {
        currentBgm.play().catch(e => console.warn(e));
        currentBgm.volume = bgmVolume;
    }
    document.removeEventListener('click', startAudio);
}, { once: true });