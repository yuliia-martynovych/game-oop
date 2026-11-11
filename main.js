// Все позиции и размеры хранятся в долях игрового поля (0..1),
// поэтому игра одинаково работает на любом размере контейнера.
const CONFIG = {
    totalEstrellas: 20,
    velocidad: 0.55,          // ширина поля в секунду
    gravedad: 3.0,            // высота поля в секунду²
    saltoNormal: 1.45,        // начальная скорость: ~35% высоты поля
    saltoAlto: 1.9,           // начальная скорость: ~60% высоты поля
    anchoPersonaje: 0.12,     // доля ширины поля
    proporcionPersonaje: 0.7, // высота/ширина спрайта
    tamanoMoneda: 0.038,      // доля ширины поля
    margenSuelo: 0.04,
    hitbox: 0.8,              // коллизия чуть меньше спрайта — так честнее
};

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

// Сонид монетки один на всю игру вместо 20 копий одного файла
const sonidoMoneda = new Audio('./public/sounds/coin.wav');
sonidoMoneda.volume = 0.2;

// Набор нажатых клавиш + разовые нажатия (для прыжка)
class Input {
    constructor() {
        this.activas = new Set();
        this.pulsadas = new Set();

        this.teclas = {
            ArrowLeft: "izquierda",
            ArrowRight: "derecha",
            ArrowUp: "salto",
            " ": "saltoAlto",
        };

        window.addEventListener("keydown", (e) => {
            // Не перехватываем клавиши, пока игрок печатает имя
            if (e.target.tagName === "INPUT") return;
            const accion = this.teclas[e.key];
            if (!accion) return;
            e.preventDefault();
            if (!e.repeat) this.pulsadas.add(accion);
            this.activas.add(accion);
        });

        window.addEventListener("keyup", (e) => {
            const accion = this.teclas[e.key];
            if (accion) this.activas.delete(accion);
        });

        // Если вкладка теряет фокус, клавиши "залипают" — сбрасываем
        window.addEventListener("blur", () => this.reiniciar());
    }

    // Кнопки на экране: нажатие и отпускание как у настоящей клавиши
    conectarBoton(id, accion) {
        const boton = document.getElementById(id);
        const presionar = (e) => {
            e.preventDefault();
            this.pulsadas.add(accion);
            this.activas.add(accion);
        };
        const soltar = () => this.activas.delete(accion);

        boton.addEventListener("touchstart", presionar, { passive: false });
        boton.addEventListener("mousedown", presionar);
        boton.addEventListener("touchend", soltar);
        boton.addEventListener("touchcancel", soltar);
        boton.addEventListener("mouseup", soltar);
        boton.addEventListener("mouseleave", soltar);
    }

    activa(accion) {
        return this.activas.has(accion);
    }

    // true только один раз на каждое нажатие
    pulsada(accion) {
        if (!this.pulsadas.has(accion)) return false;
        this.pulsadas.delete(accion);
        return true;
    }

    limpiarPulsaciones() {
        this.pulsadas.clear();
    }

    reiniciar() {
        this.activas.clear();
        this.pulsadas.clear();
    }
}

class Personaje {
    constructor(game) {
        this.game = game;
        this.element = document.createElement("div");
        this.element.classList.add("personaje");
        this.reiniciar();
    }

    reiniciar() {
        this.x = 0.05;
        this.vy = 0;
        this.enSuelo = true;
        this.y = this.suelo;
    }

    get anchoPx() {
        return this.game.ancho * CONFIG.anchoPersonaje;
    }

    get altoPx() {
        return this.anchoPx * CONFIG.proporcionPersonaje;
    }

    get altoFrac() {
        return this.altoPx / this.game.alto;
    }

    // Верхняя координата персонажа, когда он стоит на земле
    get suelo() {
        return 1 - CONFIG.margenSuelo - this.altoFrac;
    }

    actualizar(dt, input) {
        let direccion = 0;
        if (input.activa("izquierda")) direccion -= 1;
        if (input.activa("derecha")) direccion += 1;

        this.x += direccion * CONFIG.velocidad * dt;
        this.x = limitar(this.x, 0, 1 - CONFIG.anchoPersonaje);

        if (this.enSuelo) {
            if (input.pulsada("saltoAlto")) this.saltar(CONFIG.saltoAlto);
            else if (input.pulsada("salto")) this.saltar(CONFIG.saltoNormal);
        }

        this.vy += CONFIG.gravedad * dt;
        this.y += this.vy * dt;

        const suelo = this.suelo;
        if (this.y >= suelo) {
            this.y = suelo;
            this.vy = 0;
            this.enSuelo = true;
        } else if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }
    }

    saltar(impulso) {
        this.vy = -impulso;
        this.enSuelo = false;
    }

    dibujar() {
        const ancho = this.anchoPx;
        const alto = this.altoPx;
        this.element.style.width = `${ancho}px`;
        this.element.style.height = `${alto}px`;
        this.element.style.left = `${this.x * this.game.ancho}px`;
        this.element.style.top = `${this.y * this.game.alto}px`;
    }

    // Прямоугольник в пикселях, слегка уменьшенный относительно спрайта
    get caja() {
        const ancho = this.anchoPx * CONFIG.hitbox;
        const alto = this.altoPx * CONFIG.hitbox;
        return {
            x: this.x * this.game.ancho + (this.anchoPx - ancho) / 2,
            y: this.y * this.game.alto + (this.altoPx - alto) / 2,
            ancho,
            alto,
        };
    }

    colisionaCon(objeto) {
        const a = this.caja;
        const b = objeto.caja;
        return (
            a.x < b.x + b.ancho &&
            a.x + a.ancho > b.x &&
            a.y < b.y + b.alto &&
            a.y + a.alto > b.y
        );
    }
}

class Moneda {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.element = document.createElement("div");
        this.element.classList.add("moneda");
        this.dibujar();
    }

    get tamanoPx() {
        return this.game.ancho * CONFIG.tamanoMoneda;
    }

    get anchoFrac() {
        return CONFIG.tamanoMoneda;
    }

    get altoFrac() {
        return this.tamanoPx / this.game.alto;
    }

    dibujar() {
        const tamano = this.tamanoPx;
        this.element.style.width = `${tamano}px`;
        this.element.style.height = `${tamano}px`;
        this.element.style.left = `${this.x * this.game.ancho}px`;
        this.element.style.top = `${this.y * this.game.alto}px`;
    }

    get caja() {
        return {
            x: this.x * this.game.ancho,
            y: this.y * this.game.alto,
            ancho: this.tamanoPx,
            alto: this.tamanoPx,
        };
    }
}

class Game {
    constructor() {
        this.container = document.getElementById("game-container");
        this.scoreElement = document.getElementById("score");
        this.overlay = document.getElementById("win-overlay");
        this.startOverlay = document.getElementById("start-overlay");
        this.gameControls = document.getElementById("game-controls");
        this.rotateOverlay = document.getElementById("rotate-phone-overlay");

        this.monedas = [];
        this.puntuacion = 0;
        this.tiempo = 0;
        this.segundosMostrados = -1;
        this.playerName = "";
        this.estado = "inicio"; // inicio | jugando | ganado
        this.rafId = null;
        this.ultimoFrame = 0;

        this.esTactil = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

        this.input = new Input();
        this.input.conectarBoton("left-btn", "izquierda");
        this.input.conectarBoton("right-btn", "derecha");
        this.input.conectarBoton("up-btn", "salto");
        this.input.conectarBoton("space-btn", "saltoAlto");

        this.personaje = new Personaje(this);
        this.container.appendChild(this.personaje.element);

        this.celebrationSound = new Audio('./public/sounds/fanfare.mp3');
        this.celebrationSound.volume = 0.2;

        this.backgroundMusic = new Audio('./public/sounds/background-music-mini.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.2;

        this.musicToggleBtn = document.getElementById("music-toggle-btn");
        this.musicToggleBtn.addEventListener("click", () => this.toggleMusic());

        document.getElementById("start-btn").addEventListener("click", () => this.startGame());
        document.getElementById("restart-btn").addEventListener("click", () => this.reiniciarJuego());

        // Поле резиновое: позиции в долях, поэтому достаточно перерисовать
        window.addEventListener("resize", () => this.alCambiarTamano());
        window.addEventListener("orientationchange", () => {
            setTimeout(() => this.alCambiarTamano(), 100);
        });

        this.alCambiarTamano();
    }

    // || 1 — страховка от деления на ноль, если поле ещё не разложилось
    get ancho() {
        return this.container.offsetWidth || 1;
    }

    get alto() {
        return this.container.offsetHeight || 1;
    }

    alCambiarTamano() {
        this.handleOrientationChange();

        // Размеры поля изменились — пересчитываем границы и перерисовываем
        this.personaje.x = limitar(this.personaje.x, 0, 1 - CONFIG.anchoPersonaje);
        if (this.personaje.enSuelo) this.personaje.y = this.personaje.suelo;
        this.personaje.dibujar();

        this.monedas.forEach((moneda) => {
            moneda.x = limitar(moneda.x, 0, 1 - moneda.anchoFrac);
            moneda.y = limitar(moneda.y, 0, 1 - moneda.altoFrac);
            moneda.dibujar();
        });
    }

    handleOrientationChange() {
        const esPortraitMovil = this.esTactil && window.innerHeight > window.innerWidth;
        this.rotateOverlay.style.display = esPortraitMovil ? "flex" : "none";

        if (esPortraitMovil && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
            this.musicToggleBtn.textContent = "Music: OFF";
            this.musicToggleBtn.classList.add("inactive");
        }
    }

    startGame() {
        const playerNameInput = document.getElementById("player-name-input");
        this.playerName = playerNameInput.value || "Player";

        document.getElementById("score-container").style.display = "block";
        this.gameControls.style.display = this.esTactil ? "flex" : "none";
        this.startOverlay.style.display = "none";

        this.nuevaPartida();
    }

    reiniciarJuego() {
        this.overlay.style.display = 'none';
        this.nuevaPartida();
    }

    nuevaPartida() {
        this.limpiarEscenario();
        this.puntuacion = 0;
        this.tiempo = 0;
        this.segundosMostrados = -1;
        this.personaje.reiniciar();
        this.personaje.dibujar();
        this.crearEscenario();
        this.updateScore();

        this.input.reiniciar();
        this.estado = "jugando";
        this.iniciarBucle();
    }

    limpiarEscenario() {
        this.monedas.forEach((moneda) => moneda.element.remove());
        this.monedas = [];
    }

    crearEscenario() {
        const suelo = this.personaje.suelo;
        const alcance = CONFIG.saltoAlto ** 2 / (2 * CONFIG.gravedad); // высота высокого прыжка

        // Звёзды только там, куда котик реально допрыгнет
        const minY = Math.max(0.06, suelo - alcance * 0.92);
        const maxY = Math.min(suelo + this.personaje.altoFrac * 0.5, 1 - CONFIG.tamanoMoneda);
        const maxX = 1 - CONFIG.tamanoMoneda - 0.03;

        for (let i = 0; i < CONFIG.totalEstrellas; i++) {
            const posicion = this.buscarPosicionLibre(0.03, maxX, minY, maxY);
            const moneda = new Moneda(this, posicion.x, posicion.y);
            this.monedas.push(moneda);
            this.container.appendChild(moneda.element);
        }
    }

    // Несколько попыток, чтобы звёзды не слипались в кучу
    buscarPosicionLibre(minX, maxX, minY, maxY) {
        let candidato;
        for (let intento = 0; intento < 12; intento++) {
            candidato = {
                x: Math.random() * (maxX - minX) + minX,
                y: Math.random() * (maxY - minY) + minY,
            };
            // Не ставим звезду на место старта котика — иначе она засчитается сразу
            const lejosDelInicio =
                Math.hypot(this.personaje.x - candidato.x, this.personaje.y - candidato.y) > 0.18;
            const libre = this.monedas.every((moneda) => {
                return Math.hypot(moneda.x - candidato.x, moneda.y - candidato.y) > 0.08;
            });
            if (libre && lejosDelInicio) break;
        }
        return candidato;
    }

    iniciarBucle() {
        cancelAnimationFrame(this.rafId);
        this.ultimoFrame = performance.now();
        this.rafId = requestAnimationFrame((ts) => this.bucle(ts));
    }

    bucle(ts) {
        // Ограничиваем dt: после сворачивания вкладки кадр может быть очень длинным
        const dt = Math.min((ts - this.ultimoFrame) / 1000, 0.05);
        this.ultimoFrame = ts;

        this.personaje.actualizar(dt, this.input);
        this.personaje.dibujar();
        this.revisarColisiones();
        this.input.limpiarPulsaciones();

        this.tiempo += dt;
        const segundos = Math.floor(this.tiempo);
        if (segundos !== this.segundosMostrados) {
            this.segundosMostrados = segundos;
            this.updateScore();
        }

        if (this.estado === "jugando") {
            this.rafId = requestAnimationFrame((t) => this.bucle(t));
        }
    }

    revisarColisiones() {
        // Идём с конца, чтобы удаление не пропускало следующий элемент
        for (let i = this.monedas.length - 1; i >= 0; i--) {
            const moneda = this.monedas[i];
            if (!this.personaje.colisionaCon(moneda)) continue;

            moneda.element.remove();
            this.monedas.splice(i, 1);
            this.puntuacion++;
            this.updateScore();

            sonidoMoneda.currentTime = 0;
            sonidoMoneda.play().catch(() => {});
        }

        if (this.monedas.length === 0 && this.estado === "jugando") {
            this.mostrarVentanaGanadora();
        }
    }

    updateScore() {
        this.scoreElement.innerText =
            `Player: ${this.playerName} | Stars: ${this.puntuacion}/${CONFIG.totalEstrellas} | Time: ${Math.floor(this.tiempo)}s`;
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

    mostrarVentanaGanadora() {
        this.estado = "ganado";
        cancelAnimationFrame(this.rafId);
        this.celebrationSound.play().catch(() => {});

        document.getElementById('win-message').innerText = `Congratulations, ${this.playerName}!`;
        document.getElementById('win-time').innerText = `Your time: ${Math.floor(this.tiempo)}s`;
        this.overlay.style.display = 'flex';
    }
}

const juego = new Game();
