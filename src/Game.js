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

        // Track milestone reached
        this.halfwayReached = false;

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

        // Track background music started event
        if (typeof pendo !== 'undefined') {
            pendo.track('audio_background_music_started', {
                audio_context_state: this.audioManager.audioContext ? this.audioManager.audioContext.state : 'unavailable',
                music_volume: this.audioManager.musicVolume,
                timestamp: new Date().toISOString()
            });
        }

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

        // Check milestone reached (halfway point)
        if (!this.halfwayReached && this.player.x > 2400) {
            this.halfwayReached = true;
            if (typeof pendo !== 'undefined') {
                const enemiesDefeated = this.level.enemies.filter(e => !e.active).length;
                const collectiblesObtained = this.level.collectibles.filter(c => c.collected).length;
                pendo.track('milestone_reached_halfway', {
                    position_x: Math.round(this.player.x),
                    time_elapsed: Math.round(this.engine.gameTime || 0),
                    player_health: this.player.health,
                    player_score: this.score,
                    enemies_defeated: enemiesDefeated,
                    collectibles_obtained: collectiblesObtained
                });
            }
        }
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
                this.player.takeDamage(projectile.damage, 'enemy_projectile', 'projectile');
                this.audioManager.playSound('playerHit');

                // Track player hit by projectile event
                if (typeof pendo !== 'undefined') {
                    pendo.track('player_hit_by_projectile', {
                        projectile_type: 'enemy_projectile',
                        damage_amount: projectile.damage,
                        health_remaining: this.player.health,
                        position_x: Math.round(this.player.x),
                        position_y: Math.round(this.player.y),
                        enemy_distance: 0
                    });
                }

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
                    const enemyHealthBefore = enemy.health;
                    enemy.takeDamage(projectile.damage);
                    this.audioManager.playSound(enemy.health <= 0 ? 'enemyDestroy' : 'enemyHit');

                    // Track projectile hit enemy event
                    if (typeof pendo !== 'undefined') {
                        pendo.track('projectile_hit_enemy', {
                            projectile_type: projectile instanceof EmailProjectile ? 'email' : 'call',
                            enemy_type: enemy.constructor.name,
                            damage_dealt: projectile.damage,
                            enemy_health_remaining: Math.max(0, enemy.health),
                            position_x: Math.round(enemy.x),
                            position_y: Math.round(enemy.y)
                        });
                    }

                    projectile.hit();


                    // Check if Critical Stakeholder was defeated
                    if (enemy instanceof CriticalStakeholder && enemy.health <= 0) {
                        // Track boss defeated event
                        if (typeof pendo !== 'undefined') {
                            const timeToDefeat = Math.round(this.engine.gameTime || 0);
                            pendo.track('boss_defeated', {
                                time_to_defeat: timeToDefeat,
                                player_health_remaining: this.player.health,
                                shots_fired: 0,
                                damage_dealt: enemy.maxHealth,
                                damage_taken: 100 - this.player.health,
                                score_bonus: enemy.scoreValue
                            });
                        }

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

                // Track boss victory bonus awarded event
                if (typeof pendo !== 'undefined') {
                    pendo.track('boss_victory_bonus_awarded', {
                        bonus_amount: 1000000,
                        total_score: this.score,
                        time_played: Math.round(this.engine.gameTime || 0),
                        boss_defeat_time: Math.round(this.engine.gameTime || 0)
                    });
                }
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

        const timePlayedSeconds = this.engine.gameTime || 0;
        const boss = this.level.enemies.find(e => e instanceof CriticalStakeholder);
        const bossDefeated = boss && !boss.active;
        const enemiesDefeated = this.level.enemies.filter(e => !e.active).length;

        if (victory) {
            this.gameOverTitle.textContent = 'Deal Closed!';
            this.gameOverMessage.textContent = 'Congratulations! You\'ve successfully navigated the corporate maze and closed the deal. Your sales skills are unmatched!';
            this.audioManager.playSound('victory');

            // Track game completed victory event
            if (typeof pendo !== 'undefined') {
                pendo.track('game_completed_victory', {
                    final_score: this.score,
                    time_played_seconds: Math.round(timePlayedSeconds),
                    boss_defeated: bossDefeated,
                    health_remaining: this.player.health,
                    enemies_defeated: enemiesDefeated,
                    collectibles_gathered: this.level.collectibles.filter(c => c.collected).length
                });
            }
        } else {
            this.gameOverTitle.textContent = 'Deal Lost';
            this.gameOverMessage.textContent = 'The corporate world got the better of you this time. Don\'t give up - every great salesperson faces rejection!';
            this.audioManager.playSound('gameOver');

            // Track game over defeat event
            if (typeof pendo !== 'undefined') {
                pendo.track('game_over_defeat', {
                    final_score: this.score,
                    time_played_seconds: Math.round(timePlayedSeconds),
                    position_x: Math.round(this.player.x),
                    cause_of_death: 'health_depleted',
                    enemies_defeated: enemiesDefeated,
                    health_at_death: 0
                });
            }
        }

        this.finalScore.textContent = `$${this.score.toLocaleString()}`;
        this.gameOverScreen.classList.remove('hidden');
    }

    restart() {
        const previousScore = this.score;
        const previousGameState = this.gameState;

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

        // Track game restarted event
        if (typeof pendo !== 'undefined') {
            pendo.track('game_restarted', {
                previous_score: previousScore,
                previous_outcome: previousGameState === 'gameOver' ? 'defeat' : 'victory',
                restart_count: (parseInt(sessionStorage.getItem('restartCount') || '0')) + 1,
                time_since_game_over: 0
            });
            sessionStorage.setItem('restartCount', ((parseInt(sessionStorage.getItem('restartCount') || '0')) + 1).toString());
        }

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

                // Track boss encountered event
                if (typeof pendo !== 'undefined') {
                    pendo.track('boss_encountered', {
                        position_x: Math.round(this.player.x),
                        player_health: this.player.health,
                        player_score: this.score,
                        time_elapsed: Math.round(this.engine.gameTime || 0),
                        boss_health: boss.health
                    });
                }

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

        // Track game started event
        if (typeof pendo !== 'undefined') {
            pendo.track('game_started', {
                session_id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                screen_resolution: `${window.screen.width}x${window.screen.height}`
            });
        }
    });
});