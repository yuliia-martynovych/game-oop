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
        this.isMobile = window.innerWidth <= 1024;
        this.isPortrait = window.innerHeight > window.innerWidth;

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
            this.isMobile = window.innerWidth <= 1024;
            this.isPortrait = window.innerHeight > window.innerWidth;
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
            if (this.isMobile) {
                this.personaje.width = 40; // Уменьшили с 60 до 40
                this.personaje.height = 28; // Уменьшили с 42 до 28
                // Обновляем размеры контейнера для персонажа
                this.personaje.containerWidth = this.container.offsetWidth;
                this.personaje.containerHeight = this.container.offsetHeight;
            } else {
                this.personaje.width = 100;
                this.personaje.height = 70;
            }
        }
        
        this.monedas.forEach(moneda => {
            if (this.isMobile) {
                moneda.width = 15; // Уменьшили с 20 до 15
                moneda.height = 15; // Уменьшили с 20 до 15
                
                // Проверяем, что звездочки не находятся ниже стартовой позиции котика
                const catStartY = this.container.offsetHeight - 100;
                if (moneda.y > catStartY - 40) {
                    // Если звездочка слишком низко, перемещаем её выше
                    moneda.y = Math.random() * (catStartY - 90) + 50;
                    moneda.actualizarPosicion();
                }
            } else {
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

        // Show game controls
        const gameControls = document.getElementById("game-controls");
        gameControls.style.display = "flex";

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
            console.log('Key pressed:', e.key, 'Game started:', this.gameStarted, 'Personaje exists:', !!this.personaje);
            if (this.personaje && this.gameStarted) {
                this.personaje.mover(e);
            }
        };
        window.addEventListener("keydown", this.handleKeydown);
        
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
                console.log('Left touch, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                window.dispatchEvent(event);
            },
            rightTouch: (e) => {
                e.preventDefault();
                console.log('Right touch, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                window.dispatchEvent(event);
            },
            upTouch: (e) => {
                e.preventDefault();
                console.log('Up touch, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                window.dispatchEvent(event);
            },
            spaceTouch: (e) => {
                e.preventDefault();
                console.log('Space touch, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: ' ' });
                window.dispatchEvent(event);
            },
            leftClick: () => {
                console.log('Left click, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                window.dispatchEvent(event);
            },
            rightClick: () => {
                console.log('Right click, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                window.dispatchEvent(event);
            },
            upClick: () => {
                console.log('Up click, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                window.dispatchEvent(event);
            },
            spaceClick: () => {
                console.log('Space click, gameStarted:', this.gameStarted);
                if (!this.gameStarted) return;
                const event = new KeyboardEvent('keydown', { key: ' ' });
                window.dispatchEvent(event);
            }
        };
        
        // Добавляем новые обработчики
        leftBtn.addEventListener('touchstart', this.touchHandlers.leftTouch);
        rightBtn.addEventListener('touchstart', this.touchHandlers.rightTouch);
        upBtn.addEventListener('touchstart', this.touchHandlers.upTouch);
        spaceBtn.addEventListener('touchstart', this.touchHandlers.spaceTouch);
        
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
        
        // Убеждаемся, что кнопки управления видимы
        const gameControls = document.getElementById("game-controls");
        gameControls.style.display = "flex";
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
        if (this.game.isMobile) {
            this.x = 50;
            this.y = this.containerHeight - 100; // Размещаем персонажа внизу экрана
            this.startY = this.y; // Сохраняем стартовую позицию
        } else {
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
        
        // Ограничиваем позицию котика на мобильных устройствах
        if (this.game.isMobile) {
            // Не позволяем котику упасть ниже стартовой позиции
            if (this.y > this.startY) {
                this.y = this.startY;
            }
            
            // Не позволяем котику подняться слишком высоко
            const maxHeight = this.startY - 120; // Максимальная высота для котика
            if (this.y < maxHeight) {
                this.y = maxHeight;
            }
        }
        
        this.actualizarPosicion();
    }
    
    saltar() {
        this.saltando = true;
        // Ограничиваем высоту прыжка для мобильных устройств
        let alturaMaxima;
        if (this.game.isMobile) {
            // На мобильных ограничиваем прыжок, чтобы котик не выпрыгивал слишком высоко
            const maxJumpHeight = 60; // Максимальная высота прыжка на мобильных
            alturaMaxima = this.y - maxJumpHeight;
        } else {
            alturaMaxima = this.y - 150;
        }
        
        const salto = setInterval(() => {
            if (this.y > alturaMaxima) {
                this.y -= 10;
            } else {
                clearInterval(salto);
                this.caer();
            }
            this.actualizarPosicion()
        }, 20);
    }

    saltarAlto() {
        this.saltando = true;
        // Ограничиваем высоту высокого прыжка для мобильных устройств
        let alturaMaxima;
        if (this.game.isMobile) {
            // На мобильных ограничиваем высокий прыжок
            const maxHighJumpHeight = 100; // Максимальная высота высокого прыжка на мобильных
            alturaMaxima = this.y - maxHighJumpHeight;
        } else {
            alturaMaxima = this.y - 250;
        }
        
        const saltoAlto = setInterval(() => {
            if (this.y > alturaMaxima) {
                this.y -= 10; 
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
            if (this.game.isMobile) {
                // На мобильных котик не должен падать ниже стартовой позиции
                bottomLimit = this.startY;
            } else {
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
        if (this.game.isMobile) {
            // Для мобильных устройств - ограничиваем высоту звездочек
            this.x = Math.random() * (containerWidth - 60) + 30; // Оставляем отступы по краям
            
            // Определяем стартовую высоту котика для ограничения звездочек
            const catStartY = containerHeight - 100; // Стартовая позиция котика
            const maxStarY = catStartY - 40; // Максимальная высота для звездочек (доступная для прыжка)
            const minStarY = 50; // Минимальная высота для звездочек
            
            this.y = Math.random() * (maxStarY - minStarY) + minStarY;
        } else {
            // Для десктопа - как было
            this.x = Math.random() * 700 + 50;
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
