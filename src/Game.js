// Import all game modules
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';
import { Projectile, EmailProjectile, CallProjectile, EnemyProjectile } from './Projectile.js';
import { Enemy, MeetingDecline, FinanceReview, CriticalStakeholder } from './Enemy.js';
import { Level } from './Level.js';
import { AudioManager } from './AudioManager.js';

export class Game {
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

        // Generate unique session ID for this game session
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionStartTime = Date.now();

        // Initialize Pendo with game session data
        this.initializePendo();

        this.setupUI();
        this.start();
    }

    initializePendo() {
        // Check if pendo is available
        if (typeof window.pendo === 'undefined') {
            console.warn('Pendo is not loaded yet');
            return;
        }

        try {
            // Get or create persistent visitor ID (across sessions)
            let visitorId = localStorage.getItem('pendo_visitor_id');
            if (!visitorId) {
                visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('pendo_visitor_id', visitorId);
            }

            // Get persistent data from localStorage
            const firstVisitDate = localStorage.getItem('first_visit_date') || Date.now();
            if (!localStorage.getItem('first_visit_date')) {
                localStorage.setItem('first_visit_date', firstVisitDate.toString());
            }

            const totalSessions = parseInt(localStorage.getItem('total_sessions') || '0') + 1;
            localStorage.setItem('total_sessions', totalSessions.toString());

            const highScore = parseInt(localStorage.getItem('high_score') || '0');

            // Initialize Pendo with visitor metadata
            window.pendo.initialize({
                visitor: {
                    id: visitorId,

                    // Session-specific metadata
                    sessionId: this.sessionId,
                    currentScore: this.score,
                    gameState: this.gameState,
                    sessionStartTime: this.sessionStartTime,

                    // Player state metadata
                    playerHealth: this.player.health,
                    playerPositionX: this.player.x,
                    emailAmmo: this.player.emailAmmo,
                    callAmmo: this.player.callAmmo,

                    // Game progress metadata
                    hasWon: false,
                    bossDefeated: false,
                    enemiesDefeated: 0,

                    // Persistent visitor metadata
                    totalSessions: totalSessions,
                    highScore: highScore,
                    firstVisitDate: parseInt(firstVisitDate),
                    lastVisitDate: Date.now(),

                    // User preferences
                    audioEnabled: this.audioManager.enabled
                }
            });

            console.log('Pendo initialized for session:', this.sessionId);
        } catch (error) {
            console.error('Error initializing Pendo:', error);
        }
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
        this.level.update(deltaTime, this.player, this.engine, this);
        
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
                    
                    // Check if Critical Stakeholder was defeated
                    if (enemy instanceof CriticalStakeholder && enemy.health <= 0) {
                        // Reset ambient track to normal mode after boss defeat
                        setTimeout(() => {
                            this.audioManager.resetAmbientTrack();
                        }, 3000); // Wait 3 seconds after boss defeat
                    }
                    
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
            // Check if boss was defeated for additional bonus
            const boss = this.level.enemies.find(e => e instanceof CriticalStakeholder);
            if (boss && !boss.active) {
                // Boss was defeated - add massive bonus
                this.addScore(1000000); // Additional 1 million bonus for defeating boss
                console.log('Boss defeated bonus: +1,000,000');
            }
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

        this.finalScore.textContent = `$${this.score.toLocaleString()}`;
        this.gameOverScreen.classList.remove('hidden');

        // Update high score if needed
        const currentHighScore = parseInt(localStorage.getItem('high_score') || '0');
        if (this.score > currentHighScore) {
            localStorage.setItem('high_score', this.score.toString());
        }

        // Update Pendo with final game state
        this.updatePendoGameState(victory);
    }

    updatePendoGameState(victory) {
        // Check if pendo is available
        if (typeof window.pendo === 'undefined' || !window.pendo.identify) {
            return;
        }

        try {
            const boss = this.level.enemies.find(e => e instanceof CriticalStakeholder);
            const bossDefeated = boss && !boss.active;
            const enemiesDefeated = this.level.getActiveEnemies ?
                this.level.enemies.filter(e => !e.active).length : 0;

            // Update visitor metadata with final game state
            window.pendo.identify({
                visitor: {
                    id: localStorage.getItem('pendo_visitor_id'),

                    // Final session metadata
                    sessionId: this.sessionId,
                    finalScore: this.score,
                    gameState: victory ? 'victory' : 'defeat',
                    hasWon: victory,
                    bossDefeated: bossDefeated,
                    enemiesDefeated: enemiesDefeated,

                    // Updated persistent metadata
                    highScore: Math.max(this.score, parseInt(localStorage.getItem('high_score') || '0')),
                    lastVisitDate: Date.now(),
                    totalSessions: parseInt(localStorage.getItem('total_sessions') || '1')
                }
            });

            console.log('Pendo updated with final game state');
        } catch (error) {
            console.error('Error updating Pendo:', error);
        }
    }

    restart() {
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.bossFirstSeen = false;

        // Reset player
        this.player = new Player(100, 400);

        // Reset level
        this.level = new Level();

        // Clear projectiles
        this.projectiles = [];
        this.enemyProjectiles = [];

        // Reset camera
        this.engine.camera.x = 0;

        // Reset ambient track to normal mode
        this.audioManager.resetAmbientTrack();

        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');

        // Generate new session ID for the new game
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionStartTime = Date.now();

        // Re-initialize Pendo for the new session
        this.initializePendo();

        // Restart game loop
        this.engine.start((deltaTime) => this.gameLoop(deltaTime));
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
                // Trigger dramatic audio transition
                this.audioManager.transitionToDramaticMode();
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
        
        // Performance indicator - HIDDEN
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // ctx.fillRect(10, 10, 200, 30);
        // ctx.fillStyle = '#fff';
        // ctx.font = '12px Arial';
        // ctx.textAlign = 'left';
        // ctx.fillText(`FPS: ${Math.round(1 / this.engine.deltaTime)}`, 15, 30);
        // ctx.fillText(`Enemies: ${this.level.getActiveEnemies().length}`, 80, 30);
    }

    updateUI() {
        // Update score with dollar signs
        this.scoreElement.textContent = `$${this.score.toLocaleString()}`;
        
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
        window.game = new Game();
    });
});