class Projectile {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.active = true;
        this.width = 8;
        this.height = 4;
    }

    update(deltaTime, level) {
        this.x += this.speed * this.direction * deltaTime;
        
        // Remove if off-screen (using camera position)
        const screenLeft = game.engine.camera.x - 50;
        const screenRight = game.engine.camera.x + game.engine.canvas.width + 50;
        
        if (this.x < screenLeft || this.x > screenRight) {
            this.active = false;
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    checkCollision(target) {
        return GameEngine.checkCollision(this.getBounds(), target.getBounds());
    }

    hit() {
        this.active = false;
    }
}

class EmailProjectile extends Projectile {
    constructor(x, y, direction) {
        super(x, y, direction);
        this.speed = 600;
        this.damage = 15;
        this.width = 12;
        this.height = 8;
        this.animationTime = 0;
    }

    update(deltaTime, level) {
        super.update(deltaTime, level);
        this.animationTime += deltaTime;
    }

    draw(engine) {
        // Draw email envelope with animation
        const pulse = 1 + Math.sin(this.animationTime * 20) * 0.1;
        const width = this.width * pulse;
        const height = this.height * pulse;
        
        // Envelope body
        engine.drawRect(this.x - width/2, this.y - height/2, width, height, '#34d399');
        
        // Envelope flap
        engine.drawRect(this.x - width/2 + 2, this.y - height/2, width - 4, height/2, '#22c55e');
        
        // Trail effect
        for (let i = 1; i <= 3; i++) {
            const trailX = this.x - (this.direction * i * 8);
            const alpha = (4 - i) / 4;
            engine.ctx.globalAlpha = alpha;
            engine.drawCircle(trailX, this.y, 2, '#34d399');
            engine.ctx.globalAlpha = 1;
        }
    }
}

class CallProjectile extends Projectile {
    constructor(x, y, direction) {
        super(x, y, direction);
        this.speed = 400;
        this.damage = 35;
        this.width = 16;
        this.height = 12;
        this.animationTime = 0;
        this.particles = [];
    }

    update(deltaTime, level) {
        super.update(deltaTime, level);
        this.animationTime += deltaTime;
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
        
        // Add new particles
        if (Math.random() < 0.3) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
                life: 0.5
            });
        }
    }

    draw(engine) {
        // Draw particles first
        for (const particle of this.particles) {
            const alpha = particle.life / 0.5;
            engine.ctx.globalAlpha = alpha;
            engine.drawCircle(particle.x, particle.y, 2, '#f59e0b');
        }
        engine.ctx.globalAlpha = 1;
        
        // Draw phone with ringing animation
        const bounce = Math.sin(this.animationTime * 30) * 2;
        
        // Phone body
        engine.drawRect(this.x - 8, this.y - 6 + bounce, 16, 12, '#f59e0b');
        
        // Phone screen
        engine.drawRect(this.x - 6, this.y - 4 + bounce, 12, 8, '#fbbf24');
        
        // Signal waves
        const waveAlpha = Math.sin(this.animationTime * 10) * 0.5 + 0.5;
        engine.ctx.globalAlpha = waveAlpha;
        engine.drawCircle(this.x, this.y + bounce, 20, 'rgba(245, 158, 11, 0.3)');
        engine.drawCircle(this.x, this.y + bounce, 15, 'rgba(245, 158, 11, 0.5)');
        engine.ctx.globalAlpha = 1;
    }
}

class EnemyProjectile extends Projectile {
    constructor(x, y, direction) {
        super(x, y, direction);
        this.speed = 300;
        this.damage = 20;
        this.width = 10;
        this.height = 6;
        this.animationTime = 0;
    }

    update(deltaTime, level) {
        super.update(deltaTime, level);
        this.animationTime += deltaTime;
    }

    draw(engine) {
        // Draw red projectile (rejection notice)
        const pulse = 1 + Math.sin(this.animationTime * 15) * 0.2;
        
        engine.drawRect(
            this.x - 5, 
            this.y - 3, 
            10 * pulse, 
            6 * pulse, 
            '#ef4444'
        );
        
        // Add warning symbol
        engine.drawText('!', this.x, this.y + 2, '12px Arial', '#fff', 'center');
    }
}