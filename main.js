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
        this.backgroundMusic.play()

        // Background music button
        this.musicToggleBtn = document.getElementById("music-toggle-btn");
        this.musicToggleBtn.addEventListener("click", () => this.toggleMusic());



        this.restartBtn.addEventListener("click", () => this.reiniciarJuego());
        
    } 
    startGame() {
        const playerNameInput = document.getElementById("player-name-input");
        this.playerName = playerNameInput.value || "Player"; 
        this.scoreElement.innerText = `Player: ${this.playerName} | Stars: 0/20 | Time: 0s`;

        this.startOverlay.style.display = "none"; 
        this.backgroundMusic.play();
        
        this.agregarEventos();
        this.startTimer();  
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
            this.musicToggleBtn.textContent = "Music:ON";
            this.musicToggleBtn.classList.remove("inactive");
        } else {
            this.backgroundMusic.pause();
            this.musicToggleBtn.textContent = "Music:OFF"; 
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
        window.addEventListener("keydown", (e) => this.personaje.mover(e));
        this.checkColisiones();
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
        },
            100);
    }
    mostrarVentanaGanadora() {
        this.celebrationSound.play();
        this.stopTimer();
        this.overlay.style.display = 'flex';
        const winMessage = document.getElementById('win-message');
        winMessage.innerText = `Congratulations, ${this.playerName}!`;

    }

    reiniciarJuego() {

        this.overlay.style.display = 'none'; 
        this.container.innerHTML = ''; 
        this.monedas = []; 
        this.puntuacion = 0; 
        this.stopTimer();
        this.startTimer(); 
        this.scoreElement.innerText = `Stars: ${this.puntuacion}`;
        this.personaje = new Personaje();
        this.container.appendChild(this.personaje.element);
        this.crearEscenario(); 
        this.updateScore();
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

document.getElementById('left-btn').addEventListener('click', () => {
  const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
  window.dispatchEvent(event);
});

document.getElementById('up-btn').addEventListener('click', () => {
  const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
  window.dispatchEvent(event);
});

document.getElementById('right-btn').addEventListener('click', () => {
  const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
  window.dispatchEvent(event);
});

document.getElementById('space-btn').addEventListener('click', () => {
  const event = new KeyboardEvent('keydown', { key: ' ' });
  window.dispatchEvent(event);
});