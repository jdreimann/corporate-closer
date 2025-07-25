class Level {
    constructor() {
        this.width = 4800; // 4 screens wide
        this.height = 600;
        this.groundY = 520;
        this.backgroundColor = '#0f172a';
        
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.windowStates = new Map(); // Store window states
        this.lastWindowUpdate = 0; // Track last window state update
        
        this.generateLevel();
    }

    generateLevel() {
        this.createPlatforms();
        this.createEnemies();
        this.createCollectibles();
    }

    createPlatforms() {
        // Starting platforms
        this.platforms.push({ x: 300, y: 450, width: 150, height: 20 });
        this.platforms.push({ x: 550, y: 380, width: 120, height: 20 });
        
        // Mid-level platforms
        this.platforms.push({ x: 800, y: 320, width: 180, height: 20 });
        this.platforms.push({ x: 1100, y: 280, width: 100, height: 20 });
        this.platforms.push({ x: 1350, y: 350, width: 160, height: 20 });
        
        // Upper level platforms
        this.platforms.push({ x: 1600, y: 200, width: 140, height: 20 });
        this.platforms.push({ x: 1900, y: 250, width: 120, height: 20 });
        this.platforms.push({ x: 2200, y: 180, width: 200, height: 20 });
        
        // Challenge section
        this.platforms.push({ x: 2600, y: 400, width: 100, height: 20 });
        this.platforms.push({ x: 2800, y: 320, width: 100, height: 20 });
        this.platforms.push({ x: 3000, y: 240, width: 100, height: 20 });
        
        // Boss arena platforms
        this.platforms.push({ x: 3400, y: 350, width: 200, height: 20 });
        this.platforms.push({ x: 3800, y: 280, width: 150, height: 20 });
        this.platforms.push({ x: 4200, y: 400, width: 180, height: 20 });
    }

    createEnemies() {
        // Meeting Declines (floating enemies)
        this.enemies.push(new MeetingDecline(400, 300));
        this.enemies.push(new MeetingDecline(700, 250));
        this.enemies.push(new MeetingDecline(1200, 180));
        this.enemies.push(new MeetingDecline(1800, 150));
        this.enemies.push(new MeetingDecline(2500, 200));
        this.enemies.push(new MeetingDecline(3100, 160));
        
        // Finance Reviews (ground patrolling enemies)
        this.enemies.push(new FinanceReview(600, this.groundY - 40));
        this.enemies.push(new FinanceReview(1000, this.groundY - 40));
        this.enemies.push(new FinanceReview(1500, this.groundY - 40));
        this.enemies.push(new FinanceReview(2000, this.groundY - 40));
        this.enemies.push(new FinanceReview(2700, this.groundY - 40));
        this.enemies.push(new FinanceReview(3200, this.groundY - 40));
        
        // Critical Stakeholder (Boss)
        this.enemies.push(new CriticalStakeholder(4000, this.groundY - 80));
    }

    createCollectibles() {
        // Health pickups
        this.collectibles.push({ 
            type: 'health', 
            x: 820, y: 290, 
            width: 20, height: 20, 
            value: 25, 
            collected: false 
        });
        this.collectibles.push({ 
            type: 'health', 
            x: 1620, y: 170, 
            width: 20, height: 20, 
            value: 25, 
            collected: false 
        });
        this.collectibles.push({ 
            type: 'health', 
            x: 2620, y: 370, 
            width: 20, height: 20, 
            value: 25, 
            collected: false 
        });
        
        // Call ammo pickups
        this.collectibles.push({ 
            type: 'ammo', 
            x: 1120, y: 250, 
            width: 15, height: 15, 
            value: 5, 
            collected: false 
        });
        this.collectibles.push({ 
            type: 'ammo', 
            x: 1920, y: 220, 
            width: 15, height: 15, 
            value: 5, 
            collected: false 
        });
        this.collectibles.push({ 
            type: 'ammo', 
            x: 3020, y: 210, 
            width: 15, height: 15, 
            value: 5, 
            collected: false 
        });
        
        // Score bonuses
        this.collectibles.push({ 
            type: 'bonus', 
            x: 2220, y: 150, 
            width: 25, height: 25, 
            value: 500, 
            collected: false 
        });
        this.collectibles.push({ 
            type: 'bonus', 
            x: 3420, y: 320, 
            width: 25, height: 25, 
            value: 1000, 
            collected: false 
        });
    }

    update(deltaTime, player) {
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.active) {
                enemy.update(deltaTime, this, player);
                return true;
            }
            return false;
        });
        
        // Update window states every 3-8 seconds
        const currentTime = Date.now();
        if (currentTime - this.lastWindowUpdate > 3000 + Math.random() * 5000) {
            this.updateWindowStates();
            this.lastWindowUpdate = currentTime;
        }
        
        // Check collectible collisions
        for (const collectible of this.collectibles) {
            if (!collectible.collected && 
                GameEngine.checkCollision(player.getBounds(), collectible)) {
                
                collectible.collected = true;
                
                switch (collectible.type) {
                    case 'health':
                        player.heal(collectible.value);
                        break;
                    case 'ammo':
                        player.addCallAmmo(collectible.value);
                        break;
                    case 'bonus':
                        game.addScore(collectible.value);
                        break;
                }
            }
        }
    }

    draw(engine) {
        // Draw background gradient
        const gradient = engine.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        engine.ctx.fillStyle = gradient;
        engine.ctx.fillRect(-engine.camera.x, 0, engine.canvas.width + engine.camera.x, this.height);
        
        // Draw background elements (corporate buildings)
        this.drawBackground(engine);
        
        // Draw platforms
        for (const platform of this.platforms) {
            engine.drawRect(platform.x, platform.y, platform.width, platform.height, '#64748b');
            // Platform highlight
            engine.drawRect(platform.x, platform.y, platform.width, 4, '#94a3b8');
        }
        
        // Draw ground
        engine.drawRect(0, this.groundY, this.width, this.height - this.groundY, '#374151');
        engine.drawRect(0, this.groundY, this.width, 8, '#6b7280');
        
        // Draw collectibles
        for (const collectible of this.collectibles) {
            if (!collectible.collected) {
                this.drawCollectible(engine, collectible);
            }
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(engine);
        }
        
        // Draw level indicators
        this.drawLevelMarkers(engine);
    }

    updateWindowStates() {
        // Corporate buildings in background
        const buildings = [
            { x: 200, width: 80, height: 200 },
            { x: 400, width: 120, height: 250 },
            { x: 800, width: 100, height: 180 },
            { x: 1200, width: 90, height: 220 },
            { x: 1600, width: 110, height: 190 },
            { x: 2000, width: 130, height: 240 },
            { x: 2500, width: 95, height: 210 },
            { x: 3000, width: 140, height: 260 },
            { x: 3500, width: 120, height: 230 },
            { x: 4000, width: 150, height: 280 }
        ];
        
        for (const building of buildings) {
            const buildingY = this.groundY - building.height;
            
            // Update window states for this building
            for (let floor = 0; floor < Math.floor(building.height / 25); floor++) {
                for (let window = 0; window < Math.floor(building.width / 20); window++) {
                    const windowKey = `${building.x}-${floor}-${window}`;
                    
                    // Only update if window state doesn't exist or randomly decide to change
                    if (!this.windowStates.has(windowKey) || Math.random() > 0.7) {
                        const isLit = Math.random() > 0.3;
                        this.windowStates.set(windowKey, isLit);
                    }
                }
            }
        }
    }

    drawBackground(engine) {
        // Corporate buildings in background
        const buildings = [
            { x: 200, width: 80, height: 200 },
            { x: 400, width: 120, height: 250 },
            { x: 800, width: 100, height: 180 },
            { x: 1200, width: 90, height: 220 },
            { x: 1600, width: 110, height: 190 },
            { x: 2000, width: 130, height: 240 },
            { x: 2500, width: 95, height: 210 },
            { x: 3000, width: 140, height: 260 },
            { x: 3500, width: 120, height: 230 },
            { x: 4000, width: 150, height: 280 }
        ];
        
        for (const building of buildings) {
            const buildingY = this.groundY - building.height;
            engine.drawRect(building.x, buildingY, building.width, building.height, '#1e293b');
            
            // Windows
            for (let floor = 0; floor < Math.floor(building.height / 25); floor++) {
                for (let window = 0; window < Math.floor(building.width / 20); window++) {
                    const windowX = building.x + 5 + window * 20;
                    const windowY = buildingY + 5 + floor * 25;
                    const windowKey = `${building.x}-${floor}-${window}`;
                    const isLit = this.windowStates.get(windowKey) || false;
                    engine.drawRect(windowX, windowY, 10, 15, isLit ? '#fbbf24' : '#374151');
                }
            }
        }
    }

    drawCollectible(engine, collectible) {
        const time = Date.now() * 0.005;
        const bounce = Math.sin(time + collectible.x * 0.01) * 3;
        const pulse = 1 + Math.sin(time * 3 + collectible.x * 0.01) * 0.1;
        
        switch (collectible.type) {
            case 'health':
                engine.drawRect(
                    collectible.x - 2, 
                    collectible.y + bounce - 2, 
                    collectible.width * pulse + 4, 
                    collectible.height * pulse + 4, 
                    '#22c55e'
                );
                engine.drawText('+', collectible.x + 10, collectible.y + bounce + 15, 
                               '20px Arial', '#fff', 'center');
                break;
                
            case 'ammo':
                engine.drawCircle(
                    collectible.x + collectible.width/2, 
                    collectible.y + collectible.height/2 + bounce, 
                    collectible.width/2 * pulse + 2, 
                    '#f59e0b'
                );
                engine.drawText('📞', collectible.x + collectible.width/2, 
                               collectible.y + collectible.height/2 + bounce + 5, 
                               '12px Arial', '#fff', 'center');
                break;
                
            case 'bonus':
                engine.drawRect(
                    collectible.x - 3, 
                    collectible.y + bounce - 3, 
                    collectible.width * pulse + 6, 
                    collectible.height * pulse + 6, 
                    '#8b5cf6'
                );
                engine.drawText('$', collectible.x + collectible.width/2, 
                               collectible.y + collectible.height/2 + bounce + 8, 
                               '18px Arial', '#fff', 'center');
                break;
        }
    }

    drawLevelMarkers(engine) {
        // Draw distance markers
        const markerSpacing = 800;
        for (let i = 1; i <= 5; i++) {
            const x = i * markerSpacing;
            engine.drawRect(x, this.groundY - 60, 4, 60, '#64748b');
            engine.drawText(`${i * 800}m`, x + 10, this.groundY - 40, 
                           '12px Arial', '#94a3b8');
        }
        

    }

    getActiveEnemies() {
        return this.enemies.filter(enemy => enemy.active);
    }

    isComplete() {
        return this.getActiveEnemies().every(enemy => !(enemy instanceof CriticalStakeholder));
    }
}