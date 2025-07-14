//Clases

class Game { 
    constructor() {
        this.container = document.getElementById("game-container");
        this.scoreElement = document.getElementById("score");
        this.personaje = null;
        this.monedas = [];
        this.puntuacion = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.playerName = "";
        this.gameStarted = false;
        this.isMobile = /Mobi|Android|iPhone|iPad|iPod|Touch/.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth <= 1366);
        this.isPortrait = window.innerHeight > window.innerWidth;
        this.isTablet = /iPad|Android.*Tablet|Tablet/.test(navigator.userAgent) || (window.innerWidth > 768 && window.innerWidth <= 1024 && !/iPhone/.test(navigator.userAgent));
        
        // Отладочная информация
        console.log('Device detection:', {
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isPortrait: this.isPortrait
        });

        // Создаем персонажа
        this.personaje = new Personaje(this);
        this.container.appendChild(this.personaje.element);
        
        this.crearEscenario();
        this.agregarEventos();

        this.overlay = document.getElementById("win-overlay");
        this.startOverlay = document.getElementById("start-overlay");
        this.startBtn = document.getElementById("start-btn");
        this.restartBtn = document.getElementById("restart-btn");
        this.celebrationSound = new Audio('./public/sounds/fanfare.mp3');
        this.celebrationSound.volume = 0.2;

        this.startBtn.addEventListener("click", () => this.startGame());
        

        this.backgroundMusic = new Audio('./public/sounds/background-music-mini.mp3');
        this.backgroundMusic.loop = true; 
        this.backgroundMusic.volume = 0.2; 
        // Music is OFF by default - don't play automatically
        // this.backgroundMusic.play()

        // Background music button
        this.musicToggleBtn = document.getElementById("music-toggle-btn");
        this.musicToggleBtn.addEventListener("click", () => this.toggleMusic());



        this.restartBtn.addEventListener("click", () => this.reiniciarJuego());
        this.gameStarted = false;
        
        // Add orientation change handler
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Add resize handler
        window.addEventListener('resize', () => {
            this.isMobile = /Mobi|Android|iPhone|iPad|iPod|Touch/.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth <= 1366);
            this.isPortrait = window.innerHeight > window.innerWidth;
            this.isTablet = /iPad|Android.*Tablet|Tablet/.test(navigator.userAgent) || (window.innerWidth > 768 && window.innerWidth <= 1024 && !/iPhone/.test(navigator.userAgent));
            this.handleOrientationChange();
            this.actualizarTamanos();
        });
        
        // Initial orientation check
        this.handleOrientationChange();
    } 
    
    handleOrientationChange() {
        const rotateOverlay = document.getElementById('rotate-phone-overlay');
        const isMobilePortrait = this.isMobile && this.isPortrait;
        
        if (isMobilePortrait) {
            // Show rotate overlay for mobile portrait
            rotateOverlay.style.display = 'flex';
            // Pause music if playing
            if (!this.backgroundMusic.paused) {
                this.backgroundMusic.pause();
                this.musicToggleBtn.textContent = "Music: OFF";
                this.musicToggleBtn.classList.add("inactive");
            }
        } else {
            // Hide rotate overlay for landscape or desktop
            rotateOverlay.style.display = 'none';
        }
    }
    
    actualizarTamanos() {
        // Обновляем размеры персонажа и монет в зависимости от размера экрана
        if (this.personaje) {
            if (this.isMobile && !this.isTablet) {
                // Мобильные телефоны
                this.personaje.width = 40;
                this.personaje.height = 28;
                // Обновляем размеры контейнера для персонажа
                this.personaje.containerWidth = this.container.offsetWidth;
                this.personaje.containerHeight = this.container.offsetHeight;
            } else if (this.isTablet) {
                // Планшеты - больший размер котика
                this.personaje.width = 70;
                this.personaje.height = 50;
                // Обновляем размеры контейнера для персонажа
                this.personaje.containerWidth = this.container.offsetWidth;
                this.personaje.containerHeight = this.container.offsetHeight;
            } else {
                // Десктоп
                this.personaje.width = 100;
                this.personaje.height = 70;
            }
        }
        
        this.monedas.forEach(moneda => {
            if (this.isMobile && !this.isTablet) {
                // Мобильные телефоны
                moneda.width = 15;
                moneda.height = 15;
                
                // Перераспределяем звездочки по всей доступной высоте
                const catStartY = this.container.offsetHeight - 100;
                const minStarY = 60;
                const maxStarY = catStartY - 40;
                
                // Если звездочка находится вне допустимого диапазона, перемещаем её
                if (moneda.y < minStarY || moneda.y > maxStarY) {
                    moneda.y = Math.random() * (maxStarY - minStarY) + minStarY;
                    moneda.actualizarPosicion();
                }
            } else if (this.isTablet) {
                // Планшеты - больший размер звездочек
                moneda.width = 25;
                moneda.height = 25;
                
                // Перераспределяем звездочки для планшетов
                const catStartY = this.container.offsetHeight - 100;
                const minStarY = 50;
                const maxStarY = catStartY - 80; // Учитываем высоту прыжка
                
                // Если звездочка находится вне допустимого диапазона, перемещаем её
                if (moneda.y < minStarY || moneda.y > maxStarY) {
                    moneda.y = Math.random() * (maxStarY - minStarY) + minStarY;
                    moneda.actualizarPosicion();
                }
            } else {
                // Десктоп
                moneda.width = 30;
                moneda.height = 30;
            }
            moneda.actualizarPosicion();
        });
    }
    
    startGame() {
        const playerNameInput = document.getElementById("player-name-input");
        this.playerName = playerNameInput.value || "Player"; 
        
        // Show score container and update score
        const scoreContainer = document.getElementById("score-container");
        scoreContainer.style.display = "block";
        this.scoreElement.innerText = `Player: ${this.playerName} | Stars: 0/20 | Time: 0s`;

        // Show game controls only on mobile devices
        const gameControls = document.getElementById("game-controls");
        if (this.isMobile) {
            gameControls.style.display = "flex";
        } else {
            gameControls.style.display = "none";
        }

        this.startOverlay.style.display = "none"; 
        // Don't automatically play music when game starts
        // this.backgroundMusic.play();
        
        this.agregarEventos();
        this.startTimer(); 
        this.gameStarted = true;
        this.actualizarTamanos();
    }
    
    handleKeydown(event) {
        if (!this.gameStarted) return;  
        
        this.personaje.mover(event);
        
    }
    
    startTimer() {
        this.timer = 0;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateScore();
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    updateScore() {
        this.scoreElement.innerText = `Player: ${this.playerName} | Stars: ${this.puntuacion}/20 | Time: ${this.timer}s`;
    }

    toggleMusic() {
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play();
            this.musicToggleBtn.textContent = "Music: ON";
            this.musicToggleBtn.classList.remove("inactive");
        } else {
            this.backgroundMusic.pause();
            this.musicToggleBtn.textContent = "Music: OFF"; 
            this.musicToggleBtn.classList.add("inactive");
        }
    }

    crearEscenario() {    
        // Создаем только звездочки, персонаж создается отдельно
        for (let i = 0; i < 20; i++){
            const moneda = new Moneda(this);
            this.monedas.push(moneda);
            this.container.appendChild(moneda.element);
        }
    }
    
    agregarEventos() {
        // Удаляем старые обработчики клавиатуры, если они есть
        if (this.handleKeydown) {
            window.removeEventListener("keydown", this.handleKeydown);
        }
        
        // Создаем новый обработчик клавиатуры
        this.handleKeydown = (e) => {
            if (this.personaje && this.gameStarted) {
                this.personaje.mover(e);
            }
        };
        window.addEventListener("keydown", this.handleKeydown, { passive: true });
        
        // Сенсорные события для мобильных устройств
        if (this.isMobile) {
            this.agregarEventosTactiles();
        }
        
        this.checkColisiones();
    }
    
    agregarEventosTactiles() {
        // Обработчики для кнопок управления
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const upBtn = document.getElementById('up-btn');
        const spaceBtn = document.getElementById('space-btn');
        
        // Удаляем старые обработчики, если они есть
        if (this.touchHandlers) {
            leftBtn.removeEventListener('touchstart', this.touchHandlers.leftTouch);
            rightBtn.removeEventListener('touchstart', this.touchHandlers.rightTouch);
            upBtn.removeEventListener('touchstart', this.touchHandlers.upTouch);
            spaceBtn.removeEventListener('touchstart', this.touchHandlers.spaceTouch);
            leftBtn.removeEventListener('click', this.touchHandlers.leftClick);
            rightBtn.removeEventListener('click', this.touchHandlers.rightClick);
            upBtn.removeEventListener('click', this.touchHandlers.upClick);
            spaceBtn.removeEventListener('click', this.touchHandlers.spaceClick);
        }
        
        // Создаем новые обработчики
        this.touchHandlers = {
            leftTouch: (e) => {
                e.preventDefault();
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                window.dispatchEvent(event);
            },
            rightTouch: (e) => {
                e.preventDefault();
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                window.dispatchEvent(event);
            },
            upTouch: (e) => {
                e.preventDefault();
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                window.dispatchEvent(event);
            },
            spaceTouch: (e) => {
                e.preventDefault();
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: ' ' });
                window.dispatchEvent(event);
            },
            leftClick: () => {
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                window.dispatchEvent(event);
            },
            rightClick: () => {
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                window.dispatchEvent(event);
            },
            upClick: () => {
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                window.dispatchEvent(event);
            },
            spaceClick: () => {
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: ' ' });
                window.dispatchEvent(event);
            }
        };
        
        // Добавляем новые обработчики с passive для улучшения производительности
        leftBtn.addEventListener('touchstart', this.touchHandlers.leftTouch, { passive: false });
        rightBtn.addEventListener('touchstart', this.touchHandlers.rightTouch, { passive: false });
        upBtn.addEventListener('touchstart', this.touchHandlers.upTouch, { passive: false });
        spaceBtn.addEventListener('touchstart', this.touchHandlers.spaceTouch, { passive: false });
        
        // Также добавляем обработчики для кликов (для устройств с мышью)
        leftBtn.addEventListener('click', this.touchHandlers.leftClick);
        rightBtn.addEventListener('click', this.touchHandlers.rightClick);
        upBtn.addEventListener('click', this.touchHandlers.upClick);
        spaceBtn.addEventListener('click', this.touchHandlers.spaceClick);
    }
    
    checkColisiones() {
        setInterval(() => {
            this.monedas.forEach((moneda, index) => {
                if (this.personaje.colisionaCon(moneda)) {
                    this.container.removeChild(moneda.element);
                    this.monedas.splice(index, 1);
    
                    moneda.coinSound.play();
                    this.puntuacion++;
                    this.updateScore();
                    if (this.monedas.length === 0) {
                        this.mostrarVentanaGanadora();
                    }
                }
            })
        }, 100);
    }
    
    mostrarVentanaGanadora() {
        this.celebrationSound.play();
        this.stopTimer();
        this.overlay.style.display = 'flex';
        const winMessage = document.getElementById('win-message');
        const winTime = document.getElementById('win-time');
        winMessage.innerText = `Congratulations, ${this.playerName}!`;
        winTime.innerText = `Your time: ${this.timer}s`; 
        this.gameStarted = false;

    }

    reiniciarJuego() {
        console.log('Reiniciando juego...');
        this.overlay.style.display = 'none'; 
        this.container.innerHTML = ''; 
        this.monedas = []; 
        this.puntuacion = 0; 
        this.stopTimer();
        this.startTimer(); 
        this.scoreElement.innerText = `Player: ${this.playerName} | Stars: 0/20 | Time: 0s`;
        
        // Создаем нового персонажа
        this.personaje = new Personaje(this);
        this.container.appendChild(this.personaje.element);
        console.log('Nuevo personaje creado:', this.personaje);
        
        // Создаем новые звездочки
        this.crearEscenario(); 
        this.updateScore();
        this.actualizarTamanos();
        
        // Пересоздаем обработчики событий
        this.agregarEventos();
        
        // Устанавливаем флаг, что игра запущена
        this.gameStarted = true;
        console.log('Juego reiniciado, gameStarted:', this.gameStarted);
        
        // Убеждаемся, что кнопки управления видимы только на мобильных устройствах
        const gameControls = document.getElementById("game-controls");
        if (this.isMobile) {
            gameControls.style.display = "flex";
        } else {
            gameControls.style.display = "none";
        }
    }
}



class Personaje {
    constructor(game) {
        this.game = game;
        // Получаем размеры контейнера для правильного позиционирования
        const container = document.getElementById("game-container");
        this.containerWidth = container.offsetWidth;
        this.containerHeight = container.offsetHeight;
        
        // Устанавливаем начальную позицию в зависимости от устройства
        if (this.game.isMobile && !this.game.isTablet) {
            // Мобильные телефоны
            this.x = 50;
            this.y = this.containerHeight - 100; // Размещаем персонажа внизу экрана
            this.startY = this.y; // Сохраняем стартовую позицию
        } else if (this.game.isTablet) {
            // Планшеты
            this.x = 50;
            this.y = this.containerHeight - 120; // Размещаем персонажа чуть выше для планшетов
            this.startY = this.y; // Сохраняем стартовую позицию
        } else {
            // Десктоп
            this.x = 50;
            this.y = 300;
            this.startY = this.y; // Сохраняем стартовую позицию
        }
        
        this.width = 100;
        this.height = 100;
        this.velocidad = 10;
        this.saltando = false;
        this.element = document.createElement("div");
        this.element.classList.add("personaje");
        this.actualizarPosicion();
    }
    
    mover(evento) {
        if (!this.game.gameStarted) return;  
        
        // Обновляем размеры контейнера
        this.containerWidth = document.getElementById("game-container").offsetWidth;
        this.containerHeight = document.getElementById("game-container").offsetHeight;

        if (evento.key === "ArrowRight") {
            if (this.x + this.width < this.containerWidth) {
                this.x += this.velocidad;
            }
        } else if (evento.key === "ArrowLeft") {
            if (this.x > 0) {
                this.x -= this.velocidad;
            }
        } else if (evento.key === "ArrowUp" && !this.saltando) {
            this.saltar();
        } else if (evento.key === " " && !this.saltando) {
            this.saltarAlto();
        }
        
        // Ограничиваем позицию котика в зависимости от устройства
        if (this.game.isMobile && !this.game.isTablet) {
            // Мобильные телефоны
            if (this.y > this.startY) {
                this.y = this.startY;
            }
            
            const maxHeight = this.startY - 90; // Новая максимальная высота для мобильных
            if (this.y < maxHeight) {
                this.y = maxHeight;
            }
        } else if (this.game.isTablet) {
            // Планшеты - больший диапазон движения
            if (this.y > this.startY) {
                this.y = this.startY;
            }
            
            const maxHeight = this.startY - 270; // Увеличили высоту для планшетов
            if (this.y < maxHeight) {
                this.y = maxHeight;
            }
        }
        
        // Отладочная информация для мобильных устройств
        if (this.game.isMobile && !this.game.isTablet) {
            console.log('Mobile movement - Y:', this.y, 'StartY:', this.startY, 'MaxHeight:', this.startY - 30);
        } else if (this.game.isTablet) {
            console.log('Tablet movement - Y:', this.y, 'StartY:', this.startY, 'MaxHeight:', this.startY - 270);
        }
        
        this.actualizarPosicion();
    }
    
    saltar() {
        this.saltando = true;
        // Ограничиваем высоту прыжка в зависимости от устройства
        let alturaMaxima;
        if (this.game.isMobile && !this.game.isTablet) {
            // На мобильных телефонах ограничиваем прыжок
            const maxJumpHeight = 45;
            alturaMaxima = this.y - maxJumpHeight;
            console.log('Mobile jump:', maxJumpHeight, 'px', 'Current Y:', this.y, 'Target Y:', alturaMaxima);
        } else if (this.game.isTablet) {
            // На планшетах - большая высота прыжка
            const maxJumpHeight = 120;
            alturaMaxima = this.y - maxJumpHeight;
            console.log('Tablet jump:', maxJumpHeight, 'px');
        } else {
            // На десктопе
            alturaMaxima = this.y - 150;
            console.log('Desktop jump: 150px');
        }
        
        const salto = setInterval(() => {
            if (this.y > alturaMaxima) {
                this.y -= 15; // Увеличили скорость движения вверх
            } else {
                clearInterval(salto);
                this.caer();
            }
            this.actualizarPosicion()
        }, 20);
    }

    saltarAlto() {
        this.saltando = true;
        // Ограничиваем высоту высокого прыжка в зависимости от устройства
        let alturaMaxima;
        if (this.game.isMobile && !this.game.isTablet) {
            // На мобильных телефонах ограничиваем высокий прыжок
            const maxHighJumpHeight = 80; // Очень низкий высокий прыжок для мобильных
            alturaMaxima = this.y - maxHighJumpHeight;
            console.log('Mobile high jump:', maxHighJumpHeight, 'px', 'Current Y:', this.y, 'Target Y:', alturaMaxima);
        } else if (this.game.isTablet) {
            // На планшетах - большая высота высокого прыжка
            const maxHighJumpHeight = 250;
            alturaMaxima = this.y - maxHighJumpHeight;
            console.log('Tablet high jump:', maxHighJumpHeight, 'px');
        } else {
            // На десктопе
            alturaMaxima = this.y - 250;
            console.log('Desktop high jump: 250px');
        }
        
        const saltoAlto = setInterval(() => {
            if (this.y > alturaMaxima) {
                this.y -= 15; // Увеличили скорость движения вверх
            } else {
                clearInterval(saltoAlto);
                this.caer();
            }
            this.actualizarPosicion()
        }, 20);
    }

    caer() {
        const gravedad = setInterval(() => {
            // Определяем нижнюю границу в зависимости от устройства
            let bottomLimit;
            if (this.game.isMobile && !this.game.isTablet) {
                // На мобильных телефонах котик не должен падать ниже стартовой позиции
                bottomLimit = this.startY;
            } else if (this.game.isTablet) {
                // На планшетах котик не должен падать ниже стартовой позиции
                bottomLimit = this.startY;
            } else {
                // На десктопе
                bottomLimit = 300;
            }
            
            if (this.y < bottomLimit) {
                this.y += 10;
            } else {
                clearInterval(gravedad);
                this.saltando = false;
            }
            this.actualizarPosicion();
        }, 20);
    }
    
    actualizarPosicion() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    
   colisionaCon(objeto) {
    return (
      this.x < objeto.x + objeto.width &&
      this.x + this.width > objeto.x &&
      this.y < objeto.y + objeto.height &&
      this.y + this.height > objeto.y
    );
}
}

class Moneda {
    constructor(game) {
        this.game = game;
        // Получаем размеры контейнера для правильного размещения
        const container = document.getElementById("game-container");
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Генерируем позиции в зависимости от устройства
        if (this.game.isMobile && !this.game.isTablet) {
            // Для мобильных телефонов - распределяем звездочки по всей высоте, где котик может достать
            this.x = Math.random() * (containerWidth - 60) + 30; // Оставляем отступы по краям
            
            // Определяем диапазон высоты для звездочек
            const catStartY = containerHeight - 100; // Стартовая позиция котика
            const maxJumpHeight = 45; // Максимальная высота прыжка котика
            const minStarY = 60; // Минимальная высота для звездочек (от верха экрана)
            const maxStarY = catStartY - 40; // Максимальная высота (учитываем высоту прыжка)
            
            // Распределяем звездочки равномерно по всей доступной высоте
            this.y = Math.random() * (maxStarY - minStarY) + minStarY;
        } else if (this.game.isTablet) {
            // Для планшетов - распределяем звездочки с учетом большей высоты прыжка
            this.x = Math.random() * (containerWidth - 80) + 40; // Оставляем отступы по краям
            
            // Определяем диапазон высоты для звездочек на планшетах
            const catStartY = containerHeight - 100; // Стартовая позиция котика
            const maxJumpHeight = 280; // Максимальная высота прыжка котика на планшетах
            const minStarY = 50; // Минимальная высота для звездочек
            const maxStarY = catStartY - 80; // Максимальная высота (учитываем высоту прыжка)
            
            // Распределяем звездочки равномерно по всей доступной высоте
            this.y = Math.random() * (maxStarY - minStarY) + minStarY;
        } else {
            // Для десктопа - распределяем по всей высоте игрового поля
            this.x = Math.random() * 700 + 50;
            // Распределяем звездочки по всей высоте от 50 до 300 пикселей
            this.y = Math.random() * 250 + 50;
        }
        
        this.width = 30;
        this.height = 30;
        this.element = document.createElement("div");
        this.element.classList.add("moneda");
        this.coinSound = new Audio('./public/sounds/coin.wav');
        this.actualizarPosicion();
        this.coinSound.volume = 0.2;
    }
    
    actualizarPosicion() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
}

const juego = new Game();
