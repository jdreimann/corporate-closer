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
        this.sessionStartTime = Date.now();
        this.restartCount = 0;
        this.enemiesDefeatedCount = 0;
        this.lastMilestone = 0;
        this.scoreMilestones = [100000, 500000, 1000000, 5000000];

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
                const healthBefore = this.player.health;
                this.player.takeDamage(projectile.damage);
                this.audioManager.playSound('playerHit');
                projectile.hit();

                if (typeof pendo !== 'undefined') {
                    pendo.track('player_damage_taken', {
                        damage_amount: projectile.damage,
                        damage_source_type: 'projectile',
                        health_before: healthBefore,
                        health_after: this.player.health,
                        health_percent_remaining: Math.round((this.player.health / this.player.maxHealth) * 100),
                        player_x_position: Math.round(this.player.x),
                        is_fatal: this.player.health <= 0
                    });
                }
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
                        if (typeof pendo !== 'undefined') {
                            pendo.track('boss_defeated', {
                                boss_score_value: enemy.scoreValue,
                                player_health_remaining: this.player.health,
                                player_health_percent: Math.round((this.player.health / this.player.maxHealth) * 100),
                                time_to_defeat_boss: this.bossEncounterTime ? Math.round((Date.now() - this.bossEncounterTime) / 1000) : 0,
                                current_total_score: this.score,
                                session_duration: Math.round((Date.now() - this.sessionStartTime) / 1000)
                            });
                        }
                        // Reset ambient track to normal mode after boss defeat
                        setTimeout(() => {
                            this.audioManager.resetAmbientTrack();
                            if (typeof pendo !== 'undefined') {
                                pendo.track('audio_mode_transitioned', {
                                    transition_type: 'dramatic_to_ambient',
                                    from_mode: 'dramatic',
                                    to_mode: 'ambient',
                                    trigger_reason: 'boss_defeated'
                                });
                            }
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
            const bossDefeated = boss && !boss.active;
            if (bossDefeated) {
                // Boss was defeated - add massive bonus
                this.addScore(1000000); // Additional 1 million bonus for defeating boss
                console.log('Boss defeated bonus: +1,000,000');
            }

            if (typeof pendo !== 'undefined') {
                pendo.track('game_completed_victory', {
                    final_score: this.score,
                    boss_defeated: !!bossDefeated,
                    boss_bonus_applied: !!bossDefeated,
                    health_remaining: this.player.health,
                    health_percent: Math.round((this.player.health / this.player.maxHealth) * 100),
                    enemies_defeated_count: this.enemiesDefeatedCount,
                    session_duration: Math.round((Date.now() - this.sessionStartTime) / 1000)
                });
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
        const previousScore = this.score;
        this.score += points;

        if (typeof pendo !== 'undefined') {
            for (const milestone of this.scoreMilestones) {
                if (previousScore < milestone && this.score >= milestone && this.lastMilestone < milestone) {
                    this.lastMilestone = milestone;
                    pendo.track('score_milestone_reached', {
                        milestone_value: milestone,
                        time_to_reach: Math.round((Date.now() - this.sessionStartTime) / 1000),
                        player_health: this.player.health,
                        player_x_position: Math.round(this.player.x),
                        enemies_defeated_count: this.enemiesDefeatedCount
                    });
                    break;
                }
            }
        }
    }

    gameOver(victory) {
        this.gameState = 'gameOver';

        if (!victory && typeof pendo !== 'undefined') {
            const boss = this.level.enemies.find(e => e instanceof CriticalStakeholder);
            pendo.track('game_completed_defeat', {
                final_score: this.score,
                player_x_position: Math.round(this.player.x),
                level_progress_percent: Math.round((this.player.x / this.level.width) * 100),
                enemies_defeated_count: this.enemiesDefeatedCount,
                boss_encountered: this.bossFirstSeen,
                boss_health_remaining: boss ? boss.health : 0,
                session_duration: Math.round((Date.now() - this.sessionStartTime) / 1000)
            });
        }

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
    }

    restart() {
        const previousOutcome = this.gameState === 'gameOver' ? (this.player.health <= 0 ? 'defeat' : 'victory') : 'unknown';
        const previousScore = this.score;
        const previousSessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
        this.restartCount++;

        if (typeof pendo !== 'undefined') {
            pendo.track('game_session_restarted', {
                previous_outcome: previousOutcome,
                previous_score: previousScore,
                previous_session_duration: previousSessionDuration,
                restart_count: this.restartCount
            });
        }

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

        // Reset tracking state
        this.sessionStartTime = Date.now();
        this.enemiesDefeatedCount = 0;
        this.lastMilestone = 0;

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
                this.bossEncounterTime = Date.now();
                // Trigger dramatic audio transition
                this.audioManager.transitionToDramaticMode();

                if (typeof pendo !== 'undefined') {
                    pendo.track('boss_encountered', {
                        player_health: this.player.health,
                        player_health_percent: Math.round((this.player.health / this.player.maxHealth) * 100),
                        current_score: this.score,
                        email_ammo: this.player.emailAmmo,
                        call_ammo: this.player.callAmmo,
                        session_duration: Math.round((Date.now() - this.sessionStartTime) / 1000)
                    });
                    pendo.track('audio_mode_transitioned', {
                        transition_type: 'ambient_to_dramatic',
                        from_mode: 'ambient',
                        to_mode: 'dramatic',
                        trigger_reason: 'boss_encountered'
                    });
                }
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

        if (typeof pendo !== 'undefined') {
            pendo.track('game_session_started', {
                session_id: window.game.sessionStartTime.toString(),
                timestamp: new Date().toISOString(),
                is_first_session: !window.localStorage.getItem('has_played'),
                user_agent: navigator.userAgent,
                screen_width: window.screen.width,
                screen_height: window.screen.height
            });
        }
        window.localStorage.setItem('has_played', 'true');
    });
});