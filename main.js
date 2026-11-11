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
    tamanoMoneda: 0.038,
    margenSuelo: 0.04,
    hitboxPersonaje: 0.8,     // коллизия чуть меньше спрайта — так честнее

    // Метеориты
    vidas: 3,
    tamanoMeteorito: 0.075,
    velocidadMeteorito: 0.28,     // высота поля в секунду
    hitboxMeteorito: 0.40,        // попадание засчитываем только по центру
    meteoritosIniciales: 1,
    estrellasPorMeteorito: 8,     // каждые N звёзд добавляется метеорит
    invulnerabilidad: 1.5,        // секунд неуязвимости после удара
    tiempoBocadillo: 5,           // через сколько секунд облачко уходит само
};

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

// 78 секунд → "1:18"
const formatearTiempo = (segundos) => {
    const total = Math.floor(segundos);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

// Звук монетки один на всю игру вместо 20 копий одного файла
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

// Общий предок всего, что живёт на поле: позиция в долях, свой div и хитбокс
class Entidad {
    constructor(game, clase, { anchoFrac, proporcion = 1, hitbox = 1 }) {
        this.game = game;
        this.anchoFrac = anchoFrac;
        this.proporcion = proporcion;
        this.hitbox = hitbox;
        this.x = 0;
        this.y = 0;
        this.element = document.createElement("div");
        this.element.classList.add(clase);
    }

    get anchoPx() {
        return this.game.ancho * this.anchoFrac;
    }

    get altoPx() {
        return this.anchoPx * this.proporcion;
    }

    get altoFrac() {
        return this.altoPx / this.game.alto;
    }

    dibujar() {
        this.element.style.width = `${this.anchoPx}px`;
        this.element.style.height = `${this.altoPx}px`;
        this.element.style.left = `${this.x * this.game.ancho}px`;
        this.element.style.top = `${this.y * this.game.alto}px`;
    }

    // Прямоугольник в пикселях, уменьшенный по hitbox относительно спрайта
    get caja() {
        const ancho = this.anchoPx * this.hitbox;
        const alto = this.altoPx * this.hitbox;
        return {
            x: this.x * this.game.ancho + (this.anchoPx - ancho) / 2,
            y: this.y * this.game.alto + (this.altoPx - alto) / 2,
            ancho,
            alto,
        };
    }

    colisionaCon(otro) {
        const a = this.caja;
        const b = otro.caja;
        return (
            a.x < b.x + b.ancho &&
            a.x + a.ancho > b.x &&
            a.y < b.y + b.alto &&
            a.y + a.alto > b.y
        );
    }

    eliminar() {
        this.element.remove();
    }
}

class Personaje extends Entidad {
    constructor(game) {
        super(game, "personaje", {
            anchoFrac: CONFIG.anchoPersonaje,
            proporcion: CONFIG.proporcionPersonaje,
            hitbox: CONFIG.hitboxPersonaje,
        });

        // Облачко — ребёнок котика, поэтому ездит за ним само
        this.bocadillo = document.createElement("div");
        this.bocadillo.classList.add("bocadillo");
        this.bocadillo.innerText = "Let's go!";
        this.element.appendChild(this.bocadillo);
        this.bocadilloVisible = true;

        this.reiniciar();
    }

    mostrarBocadillo() {
        this.bocadillo.classList.remove("oculto");
        this.bocadilloVisible = true;
    }

    ocultarBocadillo() {
        this.bocadillo.classList.add("oculto");
        this.bocadilloVisible = false;
    }

    reiniciar() {
        this.x = 0.05;
        this.vy = 0;
        this.enSuelo = true;
        this.y = this.suelo;
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
        this.x = limitar(this.x, 0, 1 - this.anchoFrac);

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

    // После удара метеоритом котика сбрасывает на землю
    aterrizar() {
        this.y = this.suelo;
        this.vy = 0;
        this.enSuelo = true;
    }
}

class Moneda extends Entidad {
    constructor(game, x, y) {
        super(game, "moneda", { anchoFrac: CONFIG.tamanoMoneda });
        this.x = x;
        this.y = y;
        this.dibujar();
    }
}

class Meteorito extends Entidad {
    constructor(game) {
        super(game, "meteorito", {
            anchoFrac: CONFIG.tamanoMeteorito,
            hitbox: CONFIG.hitboxMeteorito,
        });
        // Разные длительность и фаза, иначе обломки качаются синхронно
        this.element.style.animationDuration = `${1.6 + Math.random()}s`;
        this.element.style.animationDelay = `-${Math.random() * 2}s`;
        this.reaparecer(true);
    }

    // inicial: при старте разводим метеориты повыше, чтобы не прилетели разом
    reaparecer(inicial = false) {
        this.x = Math.random() * (1 - this.anchoFrac);
        this.y = inicial ? -(Math.random() * 1.2 + 0.4) : -this.altoFrac;
        this.velocidad = CONFIG.velocidadMeteorito * (0.8 + Math.random() * 0.4);
        this.dibujar();
    }

    actualizar(dt) {
        this.y += this.velocidad * dt;
        if (this.y > 1) this.reaparecer();
        this.dibujar();
    }
}

class Game {
    constructor() {
        this.container = document.getElementById("game-container");
        this.scoreElement = document.getElementById("score");
        this.playerLabel = document.getElementById("player-label");
        this.timerElement = document.getElementById("timer");
        this.livesElement = document.getElementById("lives");
        this.overlay = document.getElementById("win-overlay");
        this.winWindow = document.querySelector(".win-message");
        this.startOverlay = document.getElementById("start-overlay");
        this.gameControls = document.getElementById("game-controls");
        this.rotateOverlay = document.getElementById("rotate-phone-overlay");

        this.monedas = [];
        this.meteoritos = [];
        this.puntuacion = 0;
        this.vidas = CONFIG.vidas;
        this.invulnerable = 0;
        this.tiempo = 0;
        this.segundosMostrados = -1;
        this.playerName = "";
        this.estado = "inicio"; // inicio | jugando | ganado | perdido
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

    get entidades() {
        return [this.personaje, ...this.monedas, ...this.meteoritos];
    }

    alCambiarTamano() {
        this.handleOrientationChange();

        // Размеры поля изменились — пересчитываем границы и перерисовываем
        this.personaje.x = limitar(this.personaje.x, 0, 1 - this.personaje.anchoFrac);
        if (this.personaje.enSuelo) this.personaje.y = this.personaje.suelo;

        this.monedas.forEach((moneda) => {
            moneda.x = limitar(moneda.x, 0, 1 - moneda.anchoFrac);
            moneda.y = limitar(moneda.y, 0, 1 - moneda.altoFrac);
        });

        this.entidades.forEach((entidad) => entidad.dibujar());
    }

    handleOrientationChange() {
        const esPortraitMovil = this.esTactil && window.innerHeight > window.innerWidth;
        this.rotateOverlay.style.display = esPortraitMovil ? "flex" : "none";

        if (esPortraitMovil && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
            this.marcarMusica(false);
        }
    }

    startGame() {
        const playerNameInput = document.getElementById("player-name-input");
        this.playerName = playerNameInput.value || "Player";

        document.getElementById("score-container").style.display = "flex";
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
        this.vidas = CONFIG.vidas;
        this.invulnerable = 0;
        this.personaje.element.classList.remove("invulnerable");
        this.tiempo = 0;
        this.segundosMostrados = -1;
        this.personaje.reiniciar();
        this.personaje.mostrarBocadillo();
        this.personaje.dibujar();

        this.crearEscenario();
        for (let i = 0; i < CONFIG.meteoritosIniciales; i++) this.agregarMeteorito();

        this.updateScore();
        this.actualizarVidas();

        this.input.reiniciar();
        this.estado = "jugando";
        this.iniciarBucle();
    }

    limpiarEscenario() {
        this.monedas.forEach((moneda) => moneda.eliminar());
        this.meteoritos.forEach((meteorito) => meteorito.eliminar());
        this.monedas = [];
        this.meteoritos = [];
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

    agregarMeteorito() {
        const meteorito = new Meteorito(this);
        this.meteoritos.push(meteorito);
        this.container.appendChild(meteorito.element);
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
        this.meteoritos.forEach((meteorito) => meteorito.actualizar(dt));

        this.revisarColisiones();
        if (this.estado === "jugando") this.revisarGolpes(dt);

        if (this.personaje.bocadilloVisible) {
            const tocoTeclas = this.input.activas.size > 0 || this.input.pulsadas.size > 0;
            if (tocoTeclas || this.tiempo > CONFIG.tiempoBocadillo) {
                this.personaje.ocultarBocadillo();
            }
        }

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

            moneda.eliminar();
            this.monedas.splice(i, 1);
            this.puntuacion++;
            this.updateScore();
            this.animar(this.scoreElement, "recogida");

            sonidoMoneda.currentTime = 0;
            sonidoMoneda.play().catch(() => {});

            // Чем меньше звёзд осталось, тем плотнее поток мусора
            if (this.puntuacion % CONFIG.estrellasPorMeteorito === 0) this.agregarMeteorito();
        }

        if (this.monedas.length === 0 && this.estado === "jugando") {
            this.mostrarVentanaGanadora();
        }
    }

    revisarGolpes(dt) {
        if (this.invulnerable > 0) {
            this.invulnerable -= dt;
            if (this.invulnerable <= 0) {
                this.personaje.element.classList.remove("invulnerable");
            }
            return;
        }

        const impacto = this.meteoritos.find((m) => this.personaje.colisionaCon(m));
        if (impacto) this.recibirGolpe(impacto);
    }

    recibirGolpe(meteorito) {
        this.vidas--;
        this.invulnerable = CONFIG.invulnerabilidad;
        this.personaje.element.classList.add("invulnerable");
        this.personaje.aterrizar();
        meteorito.reaparecer(); // чтобы тот же обломок не добил сразу после неуязвимости
        this.actualizarVidas(true);

        if (this.vidas <= 0) this.mostrarVentanaPerdedora();
    }

    actualizarVidas(golpe = false) {
        this.livesElement.innerHTML =
            "♥".repeat(this.vidas) +
            `<span class="perdida">${"♥".repeat(CONFIG.vidas - this.vidas)}</span>`;

        if (golpe) this.animar(this.livesElement, "golpe");
    }

    updateScore() {
        this.playerLabel.innerText = this.playerName;
        this.scoreElement.innerText = `${this.puntuacion}/${CONFIG.totalEstrellas}`;
        this.timerElement.innerText = formatearTiempo(this.tiempo);
    }

    // Перезапуск CSS-анимации: снять класс, дёрнуть reflow, повесить обратно
    animar(elemento, clase) {
        elemento.classList.remove(clase);
        void elemento.offsetWidth;
        elemento.classList.add(clase);
    }

    toggleMusic() {
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play();
            this.marcarMusica(true);
        } else {
            this.backgroundMusic.pause();
            this.marcarMusica(false);
        }
    }

    // Иконка ♪ остаётся на месте, меняется только состояние кнопки
    marcarMusica(encendida) {
        this.musicToggleBtn.classList.toggle("inactive", !encendida);
        this.musicToggleBtn.setAttribute("aria-pressed", String(encendida));
        this.musicToggleBtn.title = encendida ? "Music: on" : "Music: off";
    }

    terminarPartida(estado) {
        this.estado = estado;
        cancelAnimationFrame(this.rafId);
        this.personaje.element.classList.remove("invulnerable");
        this.overlay.style.display = 'flex';
    }

    mostrarVentanaGanadora() {
        this.celebrationSound.play().catch(() => {});
        this.winWindow.classList.remove("derrota");
        document.getElementById('win-message').innerText = `Congratulations, ${this.playerName}!`;
        document.getElementById('win-time').innerText = `Your time: ${Math.floor(this.tiempo)}s`;
        this.terminarPartida("ganado");
    }

    mostrarVentanaPerdedora() {
        this.winWindow.classList.add("derrota");
        document.getElementById('win-message').innerText = `Game over, ${this.playerName}!`;
        document.getElementById('win-time').innerText =
            `Stars: ${this.puntuacion}/${CONFIG.totalEstrellas} · Time: ${Math.floor(this.tiempo)}s`;
        this.terminarPartida("perdido");
    }
}

const juego = new Game();
