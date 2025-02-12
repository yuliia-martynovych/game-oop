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
        this.restartBtn.addEventListener("click", () => this.reiniciarJuego());
        
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
        if (evento.key === "ArrowRight") {
            this.x += this.velocidad;
        } else if (evento.key === "ArrowLeft") {
            this.x -= this.velocidad;
        } else if (evento.key === "ArrowUp" && !this.saltando) {
            this.saltar();
        } 
        this.actualizarPosicion();
    }
    saltar() {
        this.saltando = true;
        let alturaMaxima = this.y - 250;
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
