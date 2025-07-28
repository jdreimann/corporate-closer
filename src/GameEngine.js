export { GameEngine };

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            followSpeed: 0.1
        };
        
        // Input handling
        this.keys = {};
        this.setupInputHandling();
    }

    setupInputHandling() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }

    isKeyPressed(key) {
        return !!this.keys[key];
    }

    start(gameLoop) {
        this.isRunning = true;
        this.gameLoop = gameLoop;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.isRunning = false;
    }

    loop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 0.016);
        
        this.gameLoop(this.deltaTime);
        requestAnimationFrame(() => this.loop());
    }

    updateCamera(targetX) {
        this.camera.targetX = Math.max(0, targetX - this.canvas.width / 2);
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.followSpeed;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - this.camera.x, y - this.camera.y, width, height);
    }

    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x - this.camera.x, y - this.camera.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawText(text, x, y, font = '16px Arial', color = 'white', align = 'left') {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, x - this.camera.x, y - this.camera.y);
    }

    // Collision detection
    static checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // Utility functions
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
}