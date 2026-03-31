// Import all game modules
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';
import { Projectile, EmailProjectile, CallProjectile, EnemyProjectile } from './Projectile.js';
import { Enemy, MeetingDecline, FinanceReview, CriticalStakeholder } from './Enemy.js';
import { Level } from './Level.js';
import { AudioManager } from './AudioManager.js';
import { HallOfFame } from './HallOfFame.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.engine = new GameEngine(this.canvas);
        this.audioManager = new AudioManager();
        this.hallOfFame = new HallOfFame();

        this.player = new Player(100, 400);
        this.level = new Level();
        this.projectiles = [];
        this.enemyProjectiles = [];

        this.score = 0;
        this.gameState = 'playing'; // 'playing', 'gameOver', 'victory'
        this.bossFirstSeen = false;
        this.scoreSaved = false;

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

        // Show name entry if it's a high score
        const nameEntrySection = document.getElementById('nameEntrySection');
        const gameOverScores = document.getElementById('gameOverScores');
        const playerNameInput = document.getElementById('playerNameInput');
        const saveScoreBtn = document.getElementById('saveScoreBtn');

        if (this.hallOfFame.isHighScore(this.score)) {
            pendo.track('high_score_achieved', {
                score: this.score,
                rank: this.hallOfFame.getRank(this.score),
                victory: victory
            });
            nameEntrySection.classList.remove('hidden');
            gameOverScores.classList.add('hidden');
            playerNameInput.value = '';
            playerNameInput.focus();

            const handleSave = () => {
                const name = playerNameInput.value.trim() || 'Anonymous';
                this.hallOfFame.saveScore(name, this.score, victory);
                pendo.track('score_saved', {
                    score: this.score,
                    name: name,
                    rank: this.hallOfFame.getRank(this.score),
                    victory: victory
                });
                this.scoreSaved = true;
                nameEntrySection.classList.add('hidden');
                this.showGameOverScores();
                saveScoreBtn.removeEventListener('click', handleSave);
                playerNameInput.removeEventListener('keydown', handleEnter);
            };

            const handleEnter = (e) => {
                if (e.key === 'Enter') handleSave();
            };

            saveScoreBtn.addEventListener('click', handleSave);
            playerNameInput.addEventListener('keydown', handleEnter);
        } else {
            nameEntrySection.classList.add('hidden');
            this.showGameOverScores();
        }
    }

    showGameOverScores() {
        const gameOverScores = document.getElementById('gameOverScores');
        const gameOverScoreList = document.getElementById('gameOverScoreList');
        const scores = this.hallOfFame.getScores();

        if (scores.length === 0) {
            gameOverScores.classList.add('hidden');
            return;
        }

        gameOverScores.classList.remove('hidden');
        gameOverScoreList.innerHTML = scores.map((entry, i) => {
            const date = new Date(entry.date).toLocaleDateString();
            const icon = entry.victory ? '&#x2705;' : '&#x274C;';
            return `<div class="score-row${entry.score === this.score && this.scoreSaved ? ' highlight' : ''}">
                <span class="score-rank">#${i + 1}</span>
                <span class="score-name">${this.escapeHtml(entry.name)}</span>
                <span class="score-value">$${entry.score.toLocaleString()}</span>
                <span class="score-icon">${icon}</span>
            </div>`;
        }).join('');
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    restart() {
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.bossFirstSeen = false;
        this.scoreSaved = false;
        
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

    // Hall of Fame from splash screen
    const hallOfFame = new HallOfFame();
    const viewHallOfFameBtn = document.getElementById('viewHallOfFameBtn');
    const hallOfFameScreen = document.getElementById('hallOfFameScreen');
    const closeHallOfFameBtn = document.getElementById('closeHallOfFameBtn');

    viewHallOfFameBtn.addEventListener('click', () => {
        splashScreen.classList.add('hidden');
        hallOfFameScreen.classList.remove('hidden');
        renderHallOfFame();
        pendo.track('hall_of_fame_viewed');
    });

    closeHallOfFameBtn.addEventListener('click', () => {
        hallOfFameScreen.classList.add('hidden');
        splashScreen.classList.remove('hidden');
    });

    function renderHallOfFame() {
        const list = document.getElementById('hallOfFameList');
        const scores = hallOfFame.getScores();

        if (scores.length === 0) {
            list.innerHTML = '<p class="no-scores">No scores yet. Be the first to close a deal!</p>';
            return;
        }

        list.innerHTML = scores.map((entry, i) => {
            const date = new Date(entry.date).toLocaleDateString();
            const icon = entry.victory ? '&#x2705;' : '&#x274C;';
            const medal = i === 0 ? '&#x1F947;' : i === 1 ? '&#x1F948;' : i === 2 ? '&#x1F949;' : '';
            return `<div class="hof-row">
                <span class="hof-rank">${medal || '#' + (i + 1)}</span>
                <span class="hof-name">${escapeHtml(entry.name)}</span>
                <span class="hof-score">$${entry.score.toLocaleString()}</span>
                <span class="hof-icon">${icon}</span>
                <span class="hof-date">${date}</span>
            </div>`;
        }).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});