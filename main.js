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
                if (this.isPortrait) {
                    // Don't update sizes in portrait mode
                    return;
                }
                this.personaje.width = 60;
                this.personaje.height = 42;
            } else {
                this.personaje.width = 100;
                this.personaje.height = 70;
            }
        }
        
        this.monedas.forEach(moneda => {
            if (this.isMobile) {
                if (this.isPortrait) {
                    // Don't update sizes in portrait mode
                    return;
                }
                moneda.width = 20;
                moneda.height = 20;
            } else {
                moneda.width = 30;
                moneda.height = 30;
            }
            moneda.actualizarPosicion();
        });
    }
    
    startGame() {
        // Don't start game if in portrait mode on mobile
        if (this.isMobile && this.isPortrait) {
            return;
        }
        
        const playerNameInput = document.getElementById("player-name-input");
        this.playerName = playerNameInput.value || "Player"; 
        
        // Show score container and update score
        const scoreContainer = document.getElementById("score-container");
        scoreContainer.style.display = "block";
        this.scoreElement.innerText = `Player: ${this.playerName} | Stars: 0/20 | Time: 0s`;

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
        // Don't handle keys if in portrait mode on mobile
        if (this.isMobile && this.isPortrait) return;
        
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
        // Don't toggle music if in portrait mode on mobile
        if (this.isMobile && this.isPortrait) return;
        
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
        if (!this.personaje) { 
        this.personaje = new Personaje();
        this.container.appendChild(this.personaje.element);
    }
        for (let i = 0; i < 20; i++){
            const moneda = new Moneda();
            this.monedas.push(moneda);
            this.container.appendChild(moneda.element);
        }
    }
    
    agregarEventos() {
        // Клавиатурные события
        window.addEventListener("keydown", (e) => this.personaje.mover(e));
        
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
        
        // Удаляем старые обработчики
        leftBtn.replaceWith(leftBtn.cloneNode(true));
        rightBtn.replaceWith(rightBtn.cloneNode(true));
        upBtn.replaceWith(upBtn.cloneNode(true));
        spaceBtn.replaceWith(spaceBtn.cloneNode(true));
        
        // Получаем новые элементы
        const newLeftBtn = document.getElementById('left-btn');
        const newRightBtn = document.getElementById('right-btn');
        const newUpBtn = document.getElementById('up-btn');
        const newSpaceBtn = document.getElementById('space-btn');
        
        // Добавляем новые обработчики
        newLeftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            window.dispatchEvent(event);
        });
        
        newRightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            window.dispatchEvent(event);
        });
        
        newUpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            window.dispatchEvent(event);
        });
        
        newSpaceBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(event);
        });
        
        // Также добавляем обработчики для кликов (для устройств с мышью)
        newLeftBtn.addEventListener('click', () => {
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            window.dispatchEvent(event);
        });
        
        newRightBtn.addEventListener('click', () => {
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            window.dispatchEvent(event);
        });
        
        newUpBtn.addEventListener('click', () => {
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            window.dispatchEvent(event);
        });
        
        newSpaceBtn.addEventListener('click', () => {
            if (!this.gameStarted || (this.isMobile && this.isPortrait)) return;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            window.dispatchEvent(event);
        });
    }
    
    checkColisiones() {
        setInterval(() => {
            // Don't check collisions if in portrait mode on mobile
            if (this.isMobile && this.isPortrait) return;
            
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
        },
            100);
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
        // Don't restart if in portrait mode on mobile
        if (this.isMobile && this.isPortrait) return;

        this.overlay.style.display = 'none'; 
        this.container.innerHTML = ''; 
        this.monedas = []; 
        this.puntuacion = 0; 
        this.stopTimer();
        this.startTimer(); 
        this.scoreElement.innerText = `Player: ${this.playerName} | Stars: 0/20 | Time: 0s`;
        this.personaje = new Personaje();
        this.container.appendChild(this.personaje.element);
        this.crearEscenario(); 
        this.updateScore();
        this.actualizarTamanos();
    }
}



class Personaje {
    constructor() {
        this.x = 50;
        this.y = 300;
        this.width = 100;
        this.height = 100;
        this.velocidad = 10;
        this.saltando = false;
        this.element = document.createElement("div");
        this.element.classList.add("personaje");
        this.actualizarPosicion();
    }
    
    mover(evento) {
        if (!juego.gameStarted) return;  
        // Don't move if in portrait mode on mobile
        if (juego.isMobile && juego.isPortrait) return;
        
        const containerWidth = document.getElementById("game-container").offsetWidth;
        const containerHeight = document.getElementById("game-container").offsetHeight;

        if (evento.key === "ArrowRight") {
            if (this.x + this.width < containerWidth) {
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
        this.actualizarPosicion();
    }
    
    saltar() {
        this.saltando = true;
        let alturaMaxima = this.y - 150;
        const salto = setInterval(() => {
            if (this.y > alturaMaxima) {
                this.y -= 10; //redondeo de la gravedad
            } else {
                clearInterval(salto);
                this.caer();
            }
            this.actualizarPosicion()
        },
            20);
    }

    saltarAlto() {
        this.saltando = true;
        let alturaMaxima = this.y - 250;
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
            if (this.y < 300) {
                this.y += 10;
            } else {
                clearInterval(gravedad);
                this.saltando = false;
            }
            this.actualizarPosicion();
        },

            20);
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
    constructor() {
        this.x = Math.random() * 700 + 50;
        this.y = Math.random() * 250 + 50;
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
