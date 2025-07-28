class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.health = 1;
        this.maxHealth = 1;
        this.animationTime = 0;
        this.damageFlash = 0;
        // Randomize score value between 8000-12000, rounded to nearest thousand
        this.scoreValue = Math.round((8000 + Math.random() * 4000) / 1000) * 1000;
    }

    update(deltaTime, level, player, engine) {
        this.animationTime += deltaTime;
        this.damageFlash = Math.max(0, this.damageFlash - deltaTime);
        
        if (this.health <= 0) {
            this.active = false;
            game.addScore(this.scoreValue);
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.damageFlash = 0.3;
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    checkPlayerCollision(player) {
        if (GameEngine.checkCollision(this.getBounds(), player.getBounds())) {
            player.takeDamage(this.contactDamage || 15);
            return true;
        }
        return false;
    }
}

class MeetingDecline extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 30;
        this.height = 20;
        this.health = 25;
        this.maxHealth = 25;
        this.speed = 80;
        this.amplitude = 60;
        this.frequency = 2;
        this.originalY = y;
        this.contactDamage = 15;
        this.scoreValue = 150;
    }

    checkPlayerCollision(player) {
        if (GameEngine.checkCollision(this.getBounds(), player.getBounds())) {
            // Reduce player health by 34% instead of fixed damage
            const damageAmount = Math.floor(player.maxHealth * 0.34);
            player.takeDamage(damageAmount);
            
            // Remove the declined calendar invite after collision
            this.active = false;
            
            return true;
        }
        return false;
    }

    update(deltaTime, level, player, engine) {
        super.update(deltaTime, level, player, engine);
        
        // Floating movement pattern (up and down)
        this.y = this.originalY + Math.sin(this.animationTime * this.frequency) * this.amplitude;
        
        // Move consistently from right to left across the screen
        this.x -= this.speed * deltaTime;
        
        // Remove if off-screen to the left
        if (this.x < -100) {
            this.active = false;
        }
    }

    draw(engine) {
        const color = this.damageFlash > 0 ? '#ef4444' : '#8b5cf6';
        const bounce = Math.sin(this.animationTime * 8) * 2;
        
        // Main body (calendar/meeting icon)
        engine.drawRect(this.x, this.y + bounce, this.width, this.height, color);
        
        // Calendar header
        engine.drawRect(this.x + 2, this.y + bounce, this.width - 4, 6, '#4c1d95');
        
        // Calendar grid
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                engine.drawRect(
                    this.x + 4 + j * 5, 
                    this.y + 8 + i * 3 + bounce, 
                    3, 2, '#6d28d9'
                );
            }
        }
        
        // Decline X
        engine.drawText('×', this.x + this.width/2, this.y + this.height/2 + bounce + 4, 
                       '20px Arial', '#ef4444', 'center');
        
        // Health bar
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            engine.drawRect(this.x, this.y - 8 + bounce, this.width, 4, '#333');
            engine.drawRect(this.x, this.y - 8 + bounce, this.width * healthPercent, 4, '#ef4444');
        }
    }
}

class FinanceReview extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 35;
        this.height = 40;
        this.health = 40;
        this.maxHealth = 40;
        this.speed = 60;
        this.direction = 1;
        this.patrolDistance = 200;
        this.startX = x;
        this.contactDamage = 20;
        this.scoreValue = 200;
        this.shootTimer = 0;
        this.shootInterval = 1.8; // Increased fire rate (was 2.5)
    }

    update(deltaTime, level, player, engine) {
        super.update(deltaTime, level, player, engine);
        
        // Patrol movement
        this.x += this.speed * this.direction * deltaTime;
        
        // Change direction at patrol boundaries
        if (this.x <= this.startX - this.patrolDistance || 
            this.x >= this.startX + this.patrolDistance) {
            this.direction *= -1;
        }
        
        // Shooting behavior
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval) {
            const distanceToPlayer = Math.abs(player.x - this.x);
            if (distanceToPlayer < 300) {
                this.shoot(player);
                this.shootTimer = 0;
            }
        }
    }

    shoot(player) {
        const direction = Math.sign(player.x - this.x);
        const projectile = new EnemyProjectile(
            this.x + this.width / 2,
            this.y + this.height / 2,
            direction
        );
        game.addEnemyProjectile(projectile);
    }

    draw(engine) {
        const color = this.damageFlash > 0 ? '#ef4444' : '#f59e0b';
        
        // Body (calculator/spreadsheet)
        engine.drawRect(this.x, this.y, this.width, this.height, color);
        
        // Screen
        engine.drawRect(this.x + 3, this.y + 3, this.width - 6, 15, '#1f2937');
        
        // Numbers display
        engine.drawText('$$$', this.x + this.width/2, this.y + 13, '12px Arial', '#22c55e', 'center');
        
        // Buttons grid
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                engine.drawRect(
                    this.x + 4 + j * 8, 
                    this.y + 20 + i * 6, 
                    6, 4, '#d97706'
                );
            }
        }
        
        // Direction indicator
        const eyeX = this.direction > 0 ? this.x + this.width - 8 : this.x + 8;
        engine.drawCircle(eyeX, this.y - 5, 3, '#ef4444');
        
        // Health bar
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            engine.drawRect(this.x, this.y - 10, this.width, 4, '#333');
            engine.drawRect(this.x, this.y - 10, this.width * healthPercent, 4, '#ef4444');
        }
    }
}

class CriticalStakeholder extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 60;
        this.height = 80;
        this.health = 180; // Increased by 50% (was 120)
        this.maxHealth = 180; // Increased by 50% (was 120)
        this.speed = 40;
        this.direction = 1;
        this.contactDamage = 30;
        // Randomize boss score between 500k-5M, rounded to nearest thousand
        this.scoreValue = Math.round((500000 + Math.random() * 4500000) / 1000) * 1000;
        
        // Attack patterns
        this.attackTimer = 0;
        this.attackPattern = 0;
        this.burstCount = 0;
        this.phase = 1;
        
        // Movement
        this.jumpTimer = 0;
        this.velocityY = 0;
        this.onGround = true;
        
        // Boss activation
        this.isActivated = false;
    }

    update(deltaTime, level, player, engine) {
        super.update(deltaTime, level, player, engine);
        
        // Check if 8PM marker is in view to activate boss
        const eightPMPosition = 4800 * 0.875; // 8PM is at 87.5% of level
        const cameraX = engine.camera.x;
        const canvasWidth = engine.canvas.width;
        
        if (!this.isActivated && cameraX > eightPMPosition - canvasWidth) {
            this.isActivated = true;
        }
        
        // Only update boss behavior if activated
        if (this.isActivated) {
        // Phase transitions
        if (this.health <= this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed = 60;
        }
        
        // Movement AI
        this.updateMovement(deltaTime, level, player);
        
        // Attack AI
        this.updateAttacks(deltaTime, player);
        }
    }

    updateMovement(deltaTime, level, player) {
        // Move towards player
        const dx = player.x - this.x;
        if (Math.abs(dx) > 50) {
            this.direction = Math.sign(dx);
            this.x += this.speed * this.direction * deltaTime;
        }
        
        // Jumping behavior
        this.jumpTimer += deltaTime;
        if (this.jumpTimer > 3 && this.onGround && Math.abs(dx) < 200) {
            this.velocityY = -400;
            this.onGround = false;
            this.jumpTimer = 0;
        }
        
        // Apply gravity and ground collision
        if (!this.onGround) {
            this.velocityY += 800 * deltaTime;
            this.y += this.velocityY * deltaTime;
            
            if (this.y + this.height >= level.groundY) {
                this.y = level.groundY - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        }
    }

    updateAttacks(deltaTime, player) {
        this.attackTimer += deltaTime;
        
        const distanceToPlayer = Math.abs(player.x - this.x);
        
        if (this.attackTimer >= 1.5) {
            if (distanceToPlayer < 400) {
                if (this.phase === 1) {
                    this.singleShot(player);
                } else {
                    this.burstShot(player);
                }
            }
            this.attackTimer = 0;
        }
    }

    singleShot(player) {
        const direction = Math.sign(player.x - this.x);
        const projectile = new EnemyProjectile(
            this.x + this.width / 2,
            this.y + 60, // Lower position (was 20) - will hit player unless they jump
            direction
        );
        game.addEnemyProjectile(projectile);
    }

    burstShot(player) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const direction = Math.sign(player.x - this.x);
                const spread = (i - 1) * 0.3;
                const projectile = new EnemyProjectile(
                    this.x + this.width / 2,
                    this.y + 60, // Lower position (was 20) - will hit player unless they jump
                    direction + spread
                );
                game.addEnemyProjectile(projectile);
            }, i * 150);
        }
    }

    draw(engine) {
        const color = this.damageFlash > 0 ? '#ef4444' : '#dc2626';
        const pulse = Math.sin(this.animationTime * 4) * 2;
        
        // Main body (large corporate figure)
        engine.drawRect(this.x, this.y + pulse, this.width, this.height, color);
        
        // Suit details
        engine.drawRect(this.x + 10, this.y + 15 + pulse, this.width - 20, this.height - 30, '#7f1d1d');
        
        // Tie
        engine.drawRect(this.x + this.width/2 - 4, this.y + 20 + pulse, 8, 30, '#1f2937');
        
        // Head
        engine.drawCircle(this.x + this.width/2, this.y + 10 + pulse, 15, '#fbbf24');
        
        // Angry eyes
        engine.drawCircle(this.x + this.width/2 - 6, this.y + 6 + pulse, 2, '#ef4444');
        engine.drawCircle(this.x + this.width/2 + 6, this.y + 6 + pulse, 2, '#ef4444');
        
        // Money symbols floating around
        for (let i = 0; i < 3; i++) {
            const angle = this.animationTime + i * 2;
            const fx = this.x + this.width/2 + Math.cos(angle) * 40;
            const fy = this.y + this.height/2 + Math.sin(angle) * 20;
            engine.drawText('$', fx, fy, '16px Arial', '#22c55e', 'center');
        }
        
        // Health bar (always visible for boss)
        const healthPercent = this.health / this.maxHealth;
        engine.drawRect(this.x - 10, this.y - 20, this.width + 20, 8, '#333');
        engine.drawRect(this.x - 10, this.y - 20, (this.width + 20) * healthPercent, 8, '#ef4444');
        
        // Boss name
        engine.drawText('Critical Stakeholder', this.x + this.width/2, this.y - 30, 
                       '14px Arial', '#fff', 'center');
        
        // Phase indicator
        if (this.phase === 2) {
            engine.drawText('ENRAGED!', this.x + this.width/2, this.y - 45, 
                           '12px Arial', '#ef4444', 'center');
        }
    }
}