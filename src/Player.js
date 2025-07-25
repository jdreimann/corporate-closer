class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 300;
        this.jumpPower = 500;
        this.gravity = 1200;
        this.onGround = false;
        this.health = 100;
        this.maxHealth = 100;
        this.facingRight = true;
        
        // Combat system
        this.emailCooldown = 0;
        this.callCooldown = 0;
        this.callAmmo = 10;
        this.maxCallAmmo = 10;
        
        // Animation system
        this.animationTime = 0;
        this.isMoving = false;
        this.isJumping = false;
        
        // Double jump system
        this.jumpsRemaining = 2;
        this.maxJumps = 2;
        
        // Visual effects
        this.damageFlash = 0;
        this.screenShake = 0;
    }

    update(deltaTime, engine, level) {
        this.handleInput(deltaTime, engine);
        this.updatePhysics(deltaTime, level);
        this.updateAnimation(deltaTime);
        this.updateCooldowns(deltaTime);
        this.updateEffects(deltaTime);
        
        // Constrain to level bounds
        this.x = GameEngine.clamp(this.x, 0, level.width - this.width);
    }

    handleInput(deltaTime, engine) {
        const moveLeft = engine.isKeyPressed('KeyA') || engine.isKeyPressed('ArrowLeft');
        const moveRight = engine.isKeyPressed('KeyD') || engine.isKeyPressed('ArrowRight');
        const jump = engine.isKeyPressed('KeyW') || engine.isKeyPressed('ArrowUp');
        const emailShoot = engine.isKeyPressed('Space');
        const callShoot = engine.isKeyPressed('ShiftLeft') || engine.isKeyPressed('ShiftRight');

        // Movement
        this.isMoving = false;
        if (moveLeft) {
            this.velocityX = -this.speed;
            this.facingRight = false;
            this.isMoving = true;
        } else if (moveRight) {
            this.velocityX = this.speed;
            this.facingRight = true;
            this.isMoving = true;
        } else {
            this.velocityX *= 0.8; // Friction
        }

        // Jumping
        if (jump && this.jumpsRemaining > 0) {
            this.velocityY = -this.jumpPower;
            this.jumpsRemaining--;
            this.onGround = false;
            this.isJumping = true;
        }

        // Shooting
        if (emailShoot && this.emailCooldown <= 0) {
            this.shootEmail();
        }
        
        if (callShoot && this.callCooldown <= 0 && this.callAmmo > 0) {
            this.shootCall();
        }
    }

    updatePhysics(deltaTime, level) {
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity * deltaTime;
        }

        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Platform collision
        this.onGround = false;
        const playerRect = { x: this.x, y: this.y, width: this.width, height: this.height };
        
        for (const platform of level.platforms) {
            if (GameEngine.checkCollision(playerRect, platform)) {
                // Landing on top of platform
                if (this.velocityY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    this.isJumping = false;
                    this.jumpsRemaining = this.maxJumps; // Reset jumps when landing on platform
                }
            }
        }

        // Ground collision
        if (this.y + this.height >= level.groundY) {
            this.y = level.groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.isJumping = false;
            this.jumpsRemaining = this.maxJumps; // Reset jumps when landing
        }
    }

    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
    }

    updateCooldowns(deltaTime) {
        this.emailCooldown = Math.max(0, this.emailCooldown - deltaTime);
        this.callCooldown = Math.max(0, this.callCooldown - deltaTime);
    }

    updateEffects(deltaTime) {
        this.damageFlash = Math.max(0, this.damageFlash - deltaTime);
        this.screenShake = Math.max(0, this.screenShake - deltaTime * 10);
    }

    shootEmail() {
        const projectile = new EmailProjectile(
            this.x + (this.facingRight ? this.width : 0),
            this.y + this.height / 2,
            this.facingRight ? 1 : -1
        );
        game.addProjectile(projectile);
        this.emailCooldown = 0.15; // 6.67 shots per second
    }

    shootCall() {
        const projectile = new CallProjectile(
            this.x + (this.facingRight ? this.width : 0),
            this.y + this.height / 2,
            this.facingRight ? 1 : -1
        );
        game.addProjectile(projectile);
        this.callCooldown = 0.8; // 1.25 shots per second
        this.callAmmo--;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.damageFlash = 0.3;
        this.screenShake = 0.5;
        
        if (this.health <= 0) {
            game.gameOver(false);
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addCallAmmo(amount) {
        this.callAmmo = Math.min(this.maxCallAmmo, this.callAmmo + amount);
    }

    draw(engine) {
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 10 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 10 : 0;
        
        const x = this.x + shakeX;
        const y = this.y + shakeY;
        
        // Body color based on damage flash
        const bodyColor = this.damageFlash > 0 ? '#ef4444' : '#3b82f6';
        
        // Draw body
        engine.drawRect(x + 8, y + 10, 24, 30, bodyColor);
        
        // Draw head
        engine.drawCircle(x + this.width / 2, y + 8, 8, '#fbbf24');
        
        // Draw tie
        engine.drawRect(x + 18, y + 15, 4, 20, '#dc2626');
        
        // Draw briefcase arm
        const briefcaseX = this.facingRight ? x + 32 : x - 8;
        engine.drawRect(briefcaseX, y + 20, 8, 6, '#8b5cf6');
        
        // Draw legs with walking animation
        const legOffset = this.isMoving ? Math.sin(this.animationTime * 10) * 3 : 0;
        engine.drawRect(x + 12, y + 40, 6, 10, '#1e40af');
        engine.drawRect(x + 22, y + 40 + legOffset, 6, 10, '#1e40af');
        
        // Draw weapon indicator
        if (this.emailCooldown > 0) {
            engine.drawCircle(x + this.width / 2, y - 10, 3, '#34d399');
        }
        if (this.callCooldown > 0) {
            engine.drawCircle(x + this.width / 2, y - 15, 3, '#f59e0b');
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}