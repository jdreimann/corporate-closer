class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.engine = new GameEngine(this.canvas);
        this.audioManager = new AudioManager();
        
        this.player = new Player(100, 400);
        this.level = new Level();
        this.projectiles = [];
        this.enemyProjectiles = [];
        
        this.score = 0;
        this.gameState = 'playing'; // 'playing', 'gameOver', 'victory'
        this.bossFirstSeen = false;
        
        this.setupUI();
        this.start();
    }

    setupUI() {
        // UI element references
        this.scoreElement = document.getElementById('score');
        this.healthBar = document.getElementById('healthBar');
        this.emailAmmoElement = document.getElementById('emailAmmo');
        this.callAmmoElement = document.getElementById('callAmmo');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.finalScore = document.getElementById('finalScore');
    }

    start() {
        this.audioManager.playBackgroundMusic();
        this.engine.start((deltaTime) => this.gameLoop(deltaTime));
    }

    gameLoop(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.update(deltaTime);
        this.render();
        this.updateUI();
    }

    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.engine, this.level);
        
        // Update level
        this.level.update(deltaTime, this.player, this.engine);
        
        // Update camera
        this.engine.updateCamera(this.player.x);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update enemy projectiles
        this.updateEnemyProjectiles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check victory condition
        this.checkVictoryCondition();
    }

    updateProjectiles(deltaTime) {
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.active) return false;
            
            projectile.update(deltaTime, this.level);
            return projectile.active;
        });
    }

    updateEnemyProjectiles(deltaTime) {
        this.enemyProjectiles = this.enemyProjectiles.filter(projectile => {
            if (!projectile.active) return false;
            
            projectile.update(deltaTime, this.level);
            
            // Check collision with player
            if (projectile.checkCollision(this.player)) {
                this.player.takeDamage(projectile.damage);
                this.audioManager.playSound('playerHit');
                projectile.hit();
            }
            
            return projectile.active;
        });
    }

    checkCollisions() {
        // Player projectiles vs enemies
        for (const projectile of this.projectiles) {
            for (const enemy of this.level.enemies) {
                if (enemy.active && projectile.checkCollision(enemy)) {
                    enemy.takeDamage(projectile.damage);
                    this.audioManager.playSound(enemy.health <= 0 ? 'enemyDestroy' : 'enemyHit');
                    projectile.hit();
                    break;
                }
            }
        }
        
        // Player vs enemies (contact damage)
        for (const enemy of this.level.enemies) {
            if (enemy.active) {
                enemy.checkPlayerCollision(this.player);
            }
        }
    }

    checkVictoryCondition() {
        // Victory when player reaches the end of the level (after 10PM)
        if (this.player.x > this.level.width - 100) {
            this.gameOver(true);
        }
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
        
        if (projectile instanceof EmailProjectile) {
            this.audioManager.playSound('emailShoot');
        } else if (projectile instanceof CallProjectile) {
            this.audioManager.playSound('callShoot');
        }
    }

    addEnemyProjectile(projectile) {
        this.enemyProjectiles.push(projectile);
    }

    addScore(points) {
        this.score += points;
    }

    gameOver(victory) {
        this.gameState = 'gameOver';
        
        if (victory) {
            this.gameOverTitle.textContent = 'Deal Closed!';
            this.gameOverMessage.textContent = 'Congratulations! You\'ve successfully navigated the corporate maze and closed the deal. Your sales skills are unmatched!';
            this.audioManager.playSound('victory');
        } else {
            this.gameOverTitle.textContent = 'Deal Lost';
            this.gameOverMessage.textContent = 'The corporate world got the better of you this time. Don\'t give up - every great salesperson faces rejection!';
            this.audioManager.playSound('gameOver');
        }
        
        this.finalScore.textContent = this.score.toLocaleString();
        this.gameOverScreen.classList.remove('hidden');
    }

    restart() {
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        
        // Reset player
        this.player = new Player(100, 400);
        
        // Reset level
        this.level = new Level();
        
        // Clear projectiles
        this.projectiles = [];
        this.enemyProjectiles = [];
        
        // Reset camera
        this.engine.camera.x = 0;
        this.engine.camera.targetX = 0;
        
        // Reset boss visibility tracking
        this.bossFirstSeen = false;
        
        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');
        
        // Restart background music
        this.audioManager.playBackgroundMusic();
    }

    render() {
        this.engine.clear();
        
        // Draw level
        this.level.draw(this.engine);
        
        // Draw projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(this.engine);
        }
        
        for (const projectile of this.enemyProjectiles) {
            projectile.draw(this.engine);
        }
        
        // Draw player
        this.player.draw(this.engine);
        
        // Draw HUD elements
        this.drawHUD();
    }

    drawHUD() {
        const ctx = this.engine.ctx;
        const canvas = this.engine.canvas;
        
        // Boss health bar (if boss is active and in view)
        const boss = this.level.enemies.find(e => e instanceof CriticalStakeholder && e.active);
        if (boss) {
            // Check if boss is in camera view
            const bossInView = boss.x >= this.engine.camera.x - 100 && 
                              boss.x <= this.engine.camera.x + this.engine.canvas.width + 100;
            
            // Mark boss as seen when it first comes into view
            if (bossInView && !this.bossFirstSeen) {
                this.bossFirstSeen = true;
            }
            
            // Only show health bar if boss has been seen
            if (this.bossFirstSeen) {
                const barWidth = 400;
                const barHeight = 20;
                const barX = (canvas.width - barWidth) / 2;
                const barY = 30;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);
                
                // Health bar
                ctx.fillStyle = '#374151';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                const healthPercent = boss.health / boss.maxHealth;
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
                
                // Boss name
                ctx.fillStyle = '#fff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Critical Stakeholder', canvas.width / 2, barY + 15);
            }
        }
        
        // Performance indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${Math.round(1 / this.engine.deltaTime)}`, 15, 30);
        ctx.fillText(`Enemies: ${this.level.getActiveEnemies().length}`, 80, 30);
    }

    updateUI() {
        // Update score
        this.scoreElement.textContent = this.score.toLocaleString();
        
        // Update health bar
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        
        // Update ammo displays
        this.emailAmmoElement.textContent = this.player.emailAmmo.toString();
        this.callAmmoElement.textContent = this.player.callAmmo.toString();
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    // Set up splash screen
    const splashScreen = document.getElementById('splashScreen');
    const gameContainer = document.getElementById('gameContainer');
    const startGameBtn = document.getElementById('startGameBtn');
    
    startGameBtn.addEventListener('click', () => {
        splashScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        game = new Game();
    });
});