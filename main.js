//Clases

class Game { 
    constructor() {
        this.container = document.getElementById("game-container");
        this.scoreElement = document.getElementById("score");
        this.personaje = null;
        this.monedas = [];
        this.puntuacion = 0;
        this.crearEscenario();
        this.agregarEventos();
        this.overlay = document.getElementById("win-overlay");
        this.restartBtn = document.getElementById("restart-btn");
        this.celebrationSound = new Audio('./sounds/fanfare.mp3');
        this.celebrationSound.volume = 0.2;

        this.backgroundMusic = new Audio('./sounds/background-music.mp3');
        this.backgroundMusic.loop = true; 
        this.backgroundMusic.volume = 0.2; 
        this.backgroundMusic.play()

        // Background music button
        this.musicToggleBtn = document.getElementById("music-toggle-btn");
        this.musicToggleBtn.addEventListener("click", () => this.toggleMusic());



        this.restartBtn.addEventListener("click", () => this.reiniciarJuego());
        
    } 
    toggleMusic() {
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play();
            this.musicToggleBtn.textContent = "🔔";
            this.musicToggleBtn.classList.remove("inactive");
        } else {
            this.backgroundMusic.pause();
            this.musicToggleBtn.textContent = "🔕"; 
            this.musicToggleBtn.classList.add("inactive");
        }
    }

    crearEscenario() {    
        this.personaje = new Personaje();
        this.container.appendChild(this.personaje.element);
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
                    this.scoreElement.innerText = `Estrellas: ${this.puntuacion}`;
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
        this.overlay.style.display = 'flex';
    }

    reiniciarJuego() {

        this.overlay.style.display = 'none'; 
        this.container.innerHTML = ''; 
        this.monedas = []; 
        this.puntuacion = 0; 
        this.scoreElement.innerText = `Estrellas: ${this.puntuacion}`;
        this.crearEscenario(); 
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
        this.coinSound = new Audio('./sounds/coin.wav');
        this.actualizarPosicion();
        this.coinSound.volume = 0.2;
    }
    actualizarPosicion() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
}
const juego = new Game();
