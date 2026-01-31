/**
 * Zoo-F-O RUSH
 * Endless drift racer for Remix.gg
 * Built with Phaser 3
 */

// Game Constants
const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;
const LANE_COUNT = 3;
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
const PLAYER_Y = GAME_HEIGHT - 180;
const BASE_SPEED = 400;
const MAX_SPEED = 1200;

// Game State
let gameState = {
    isPlaying: false,
    score: 0,
    distance: 0,
    speed: BASE_SPEED,
    hypeMeter: 0,
    maxHype: 100,
    hypeActive: false,
    driftAngle: 0,
    isDrifting: false,
    lane: 1, // 0, 1, 2
    combo: 0
};

// Phaser Game Config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Initialize Game
const game = new Phaser.Game(config);

// ============================================================================
// BOOT SCENE - Asset Loading
// ============================================================================
function BootScene() {
    Phaser.Scene.call(this, { key: 'BootScene' });
}
BootScene.prototype = Object.create(Phaser.Scene.prototype);
BootScene.prototype.constructor = BootScene;

BootScene.prototype.preload = function() {
    // Create placeholder graphics (will be replaced with actual assets)
    this.createPlaceholderAssets();
};

BootScene.prototype.createPlaceholderAssets = function() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Player vehicle (placeholder)
    graphics.fillStyle(0xff3366);
    graphics.fillRoundedRect(0, 0, 60, 80, 10);
    graphics.generateTexture('player', 60, 80);
    graphics.clear();
    
    // Enemy vehicle
    graphics.fillStyle(0x6633ff);
    graphics.fillRoundedRect(0, 0, 50, 70, 8);
    graphics.generateTexture('enemy', 50, 70);
    graphics.clear();
    
    // Obstacle
    graphics.fillStyle(0xcc3300);
    graphics.fillCircle(25, 25, 25);
    graphics.generateTexture('obstacle', 50, 50);
    graphics.clear();
    
    // Coin/Collectible
    graphics.fillStyle(0xffdd00);
    graphics.fillCircle(15, 15, 15);
    graphics.generateTexture('coin', 30, 30);
    graphics.clear();
    
    // Hype particle
    graphics.fillStyle(0x00ffff);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('hypeParticle', 10, 10);
    graphics.clear();
    
    // Drift trail
    graphics.fillStyle(0x00ffff, 0.6);
    graphics.fillRect(0, 0, 20, 40);
    graphics.generateTexture('trail', 20, 40);
    graphics.clear();
    
    // Background grid
    graphics.lineStyle(2, 0x333366, 0.5);
    for (let i = 0; i <= LANE_COUNT; i++) {
        graphics.moveTo(i * LANE_WIDTH, 0);
        graphics.lineTo(i * LANE_WIDTH, GAME_HEIGHT);
    }
    graphics.strokePath();
    graphics.generateTexture('grid', GAME_WIDTH, GAME_HEIGHT);
    graphics.clear();
    
    // Hype burst effect
    graphics.fillStyle(0x00ffff, 0.8);
    graphics.fillCircle(50, 50, 50);
    graphics.generateTexture('hypeBurst', 100, 100);
};

BootScene.prototype.create = function() {
    this.scene.start('MenuScene');
};

// ============================================================================
// MENU SCENE - Start Screen
// ============================================================================
function MenuScene() {
    Phaser.Scene.call(this, { key: 'MenuScene' });
}
MenuScene.prototype = Object.create(Phaser.Scene.prototype);
MenuScene.prototype.constructor = MenuScene;

MenuScene.prototype.create = function() {
    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'grid');
    
    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'ZOO-F-O', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#ff3366',
        stroke: '#ffffff',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3 + 70, 'RUSH', {
        fontSize: '80px',
        fontFamily: 'Arial Black',
        color: '#00ffff',
        stroke: '#ffffff',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    // Instructions
    const instructions = [
        'HOLD to DRIFT',
        'RELEASE to BOOST',
        'Build HYPE meter!',
        'UNLEASH EMOTE BURST!'
    ];
    
    instructions.forEach((line, i) => {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.55 + i * 40, line, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
    });
    
    // Start prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.85, 'TAP TO START', {
        fontSize: '32px',
        fontFamily: 'Arial Black',
        color: '#ffdd00'
    }).setOrigin(0.5).setInteractive();
    
    // Input handling
    this.input.on('pointerdown', () => {
        this.scene.start('GameScene');
    });
};

// ============================================================================
// GAME SCENE - Main Gameplay
// ============================================================================
function GameScene() {
    Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.create = function() {
    // Reset game state
    gameState = {
        isPlaying: true,
        score: 0,
        distance: 0,
        speed: BASE_SPEED,
        hypeMeter: 0,
        maxHype: 100,
        hypeActive: false,
        driftAngle: 0,
        isDrifting: false,
        lane: 1,
        combo: 0
    };
    
    // Background
    this.grid = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'grid');
    
    // Particles
    this.trailParticles = this.add.particles(0, 0, 'trail', {
        follow: null,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        frequency: 50
    });
    this.trailParticles.stop();
    
    this.hypeParticles = this.add.particles(0, 0, 'hypeParticle', {
        speed: { min: 100, max: 300 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        gravityY: 0,
        emitting: false
    });
    
    // Player
    this.player = this.physics.add.sprite(
        this.getLaneX(gameState.lane),
        PLAYER_Y,
        'player'
    );
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(500);
    
    // Groups
    this.enemies = this.physics.add.group();
    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();
    
    // UI
    this.createUI();
    
    // Input
    this.input.on('pointerdown', this.startDrift, this);
    this.input.on('pointerup', this.endDrift, this);
    
    // Spawning
    this.spawnEvent = this.time.addEvent({
        delay: 1000,
        callback: this.spawnObject,
        callbackScope: this,
        loop: true
    });
    
    // Speed ramp
    this.speedEvent = this.time.addEvent({
        delay: 5000,
        callback: this.increaseSpeed,
        callbackScope: this,
        loop: true
    });
    
    // Collisions
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    
    // Setup Remix SDK
    this.setupRemixSDK();
};

GameScene.prototype.setupRemixSDK = function() {
    // Handle play again
    window.FarcadeSDK.onPlayAgain(() => {
        this.scene.restart();
    });
    
    // Handle mute toggle (required)
    window.FarcadeSDK.onToggleMute((data) => {
        // Audio handling would go here
        console.log('Mute toggled:', data.isMuted);
    });
};

GameScene.prototype.getLaneX = function(lane) {
    return (lane * LANE_WIDTH) + (LANE_WIDTH / 2);
};

GameScene.prototype.createUI = function() {
    // Score
    this.scoreText = this.add.text(20, 20, '0', {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#ffffff'
    });
    
    // Hype Meter Background
    this.hypeBg = this.add.rectangle(GAME_WIDTH / 2, 40, 300, 30, 0x333333);
    this.hypeBg.setStrokeStyle(3, 0xffffff);
    
    // Hype Meter Fill
    this.hypeFill = this.add.rectangle(GAME_WIDTH / 2 - 148, 40, 0, 24, 0x00ffff);
    this.hypeFill.setOrigin(0, 0.5);
    
    // Hype Label
    this.hypeLabel = this.add.text(GAME_WIDTH / 2, 70, 'HYPE', {
        fontSize: '16px',
        fontFamily: 'Arial Black',
        color: '#00ffff'
    }).setOrigin(0.5);
    
    // Combo text (hidden initially)
    this.comboText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, '', {
        fontSize: '36px',
        fontFamily: 'Arial Black',
        color: '#ffdd00'
    }).setOrigin(0.5);
    this.comboText.setVisible(false);
};

GameScene.prototype.startDrift = function() {
    if (!gameState.isPlaying || gameState.hypeActive) return;
    
    gameState.isDrifting = true;
    this.trailParticles.startFollow(this.player);
    
    // Haptic feedback on drift start
    if (window.FarcadeSDK) {
        window.FarcadeSDK.hapticFeedback();
    }
};

GameScene.prototype.endDrift = function() {
    if (!gameState.isPlaying) return;
    
    gameState.isDrifting = false;
    this.trailParticles.stop();
    
    // Boost if hype is full
    if (gameState.hypeMeter >= gameState.maxHype && !gameState.hypeActive) {
        this.activateHypeMode();
    }
    
    // Lane change based on drift duration
    this.changeLane();
};

GameScene.prototype.changeLane = function() {
    // Simple lane switching logic
    const pointer = this.input.activePointer;
    const laneWidth = GAME_WIDTH / LANE_COUNT;
    const targetLane = Math.floor(pointer.x / laneWidth);
    const clampedLane = Phaser.Math.Clamp(targetLane, 0, LANE_COUNT - 1);
    
    if (clampedLane !== gameState.lane) {
        gameState.lane = clampedLane;
        this.tweens.add({
            targets: this.player,
            x: this.getLaneX(gameState.lane),
            duration: 200,
            ease: 'Cubic.out'
        });
    }
};

GameScene.prototype.activateHypeMode = function() {
    gameState.hypeActive = true;
    gameState.hypeMeter = 0;
    
    // Visual feedback
    this.hypeBurst = this.add.image(this.player.x, this.player.y, 'hypeBurst');
    this.hypeBurst.setScale(0);
    this.tweens.add({
        targets: this.hypeBurst,
        scale: 3,
        alpha: 0,
        duration: 500,
        onComplete: () => this.hypeBurst.destroy()
    });
    
    // Particle burst
    this.hypeParticles.emitParticleAt(this.player.x, this.player.y, 30);
    
    // Haptic
    if (window.FarcadeSDK) {
        window.FarcadeSDK.hapticFeedback();
    }
    
    // Destroy nearby enemies/obstacles (emote burst effect)
    const burstRadius = 200;
    this.enemies.getChildren().forEach(enemy => {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < burstRadius) {
            this.destroyEnemy(enemy);
            gameState.score += 100;
        }
    });
    
    this.obstacles.getChildren().forEach(obstacle => {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, obstacle.x, obstacle.y) < burstRadius) {
            obstacle.destroy();
            gameState.score += 50;
        }
    });
    
    // Speed boost
    const oldSpeed = gameState.speed;
    gameState.speed = MAX_SPEED;
    
    // Reset after 3 seconds
    this.time.delayedCall(3000, () => {
        gameState.hypeActive = false;
        gameState.speed = oldSpeed;
    });
};

GameScene.prototype.spawnObject = function() {
    if (!gameState.isPlaying) return;
    
    const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
    const x = this.getLaneX(lane);
    const type = Phaser.Math.Between(0, 10);
    
    if (type < 5) {
        // Enemy
        const enemy = this.enemies.create(x, -50, 'enemy');
        enemy.setVelocityY(gameState.speed * 0.8);
    } else if (type < 8) {
        // Obstacle
        const obstacle = this.obstacles.create(x, -50, 'obstacle');
        obstacle.setVelocityY(gameState.speed * 0.9);
    } else {
        // Coin
        const coin = this.coins.create(x, -50, 'coin');
        coin.setVelocityY(gameState.speed * 0.8);
    }
};

GameScene.prototype.increaseSpeed = function() {
    if (gameState.speed < MAX_SPEED && !gameState.hypeActive) {
        gameState.speed += 50;
    }
};

GameScene.prototype.hitEnemy = function(player, enemy) {
    if (gameState.hypeActive) {
        this.destroyEnemy(enemy);
        gameState.score += 100;
    } else {
        this.gameOver();
    }
};

GameScene.prototype.hitObstacle = function(player, obstacle) {
    if (gameState.hypeActive) {
        obstacle.destroy();
        gameState.score += 50;
    } else {
        this.gameOver();
    }
};

GameScene.prototype.destroyEnemy = function(enemy) {
    // Explosion effect
    this.hypeParticles.emitParticleAt(enemy.x, enemy.y, 10);
    enemy.destroy();
};

GameScene.prototype.collectCoin = function(player, coin) {
    coin.destroy();
    gameState.score += 50;
    gameState.hypeMeter = Math.min(gameState.hypeMeter + 10, gameState.maxHype);
    
    if (window.FarcadeSDK) {
        window.FarcadeSDK.hapticFeedback();
    }
};

GameScene.prototype.gameOver = function() {
    gameState.isPlaying = false;
    
    // Stop spawning
    this.spawnEvent.remove();
    this.speedEvent.remove();
    
    // Report to Remix SDK
    if (window.FarcadeSDK) {
        window.FarcadeSDK.singlePlayer.actions.gameOver({ score: Math.floor(gameState.score) });
    }
    
    // Go to game over scene
    this.scene.start('GameOverScene', { score: gameState.score });
};

GameScene.prototype.update = function(time, delta) {
    if (!gameState.isPlaying) return;
    
    const dt = delta / 1000;
    
    // Scroll background
    this.grid.tilePositionY -= gameState.speed * dt * 0.5;
    
    // Update score based on distance
    gameState.distance += gameState.speed * dt;
    gameState.score += gameState.speed * dt * 0.01;
    this.scoreText.setText(Math.floor(gameState.score));
    
    // Build hype while drifting
    if (gameState.isDrifting && !gameState.hypeActive) {
        gameState.hypeMeter = Math.min(gameState.hypeMeter + dt * 30, gameState.maxHype);
        
        // Rotate player while drifting
        this.player.angle = Math.sin(time * 0.01) * 15;
        
        // Add combo
        gameState.combo += dt;
        if (gameState.combo > 1) {
            this.comboText.setText(`${Math.floor(gameState.combo)}x DRIFT!`);
            this.comboText.setVisible(true);
        }
    } else {
        this.player.angle = 0;
        gameState.combo = 0;
        this.comboText.setVisible(false);
    }
    
    // Update hype meter UI
    const hypePercent = gameState.hypeMeter / gameState.maxHype;
    this.hypeFill.width = hypePercent * 296;
    
    // Change hype color when full
    if (hypePercent >= 1) {
        this.hypeFill.fillColor = 0xffdd00;
        this.hypeLabel.setColor('#ffdd00');
        this.hypeLabel.setText('READY! RELEASE TO BURST!');
    } else {
        this.hypeFill.fillColor = 0x00ffff;
        this.hypeLabel.setColor('#00ffff');
        this.hypeLabel.setText('HYPE');
    }
    
    // Cleanup off-screen objects
    this.enemies.getChildren().forEach(enemy => {
        if (enemy.y > GAME_HEIGHT + 100) enemy.destroy();
    });
    this.obstacles.getChildren().forEach(obstacle => {
        if (obstacle.y > GAME_HEIGHT + 100) obstacle.destroy();
    });
    this.coins.getChildren().forEach(coin => {
        if (coin.y > GAME_HEIGHT + 100) coin.destroy();
    });
};

// ============================================================================
// GAME OVER SCENE
// ============================================================================
function GameOverScene() {
    Phaser.Scene.call(this, { key: 'GameOverScene' });
}
GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
GameOverScene.prototype.constructor = GameOverScene;

GameOverScene.prototype.init = function(data) {
    this.finalScore = Math.floor(data.score || 0);
};

GameOverScene.prototype.create = function() {
    // Semi-transparent overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    
    // Game Over text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'GAME OVER', {
        fontSize: '64px',
        fontFamily: 'Arial Black',
        color: '#ff3366',
        stroke: '#ffffff',
        strokeThickness: 4
    }).setOrigin(0.5);
    
    // Score
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 'SCORE', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#aaaaaa'
    }).setOrigin(0.5);
    
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, this.finalScore.toString(), {
        fontSize: '72px',
        fontFamily: 'Arial Black',
        color: '#00ffff'
    }).setOrigin(0.5);
    
    // Play again prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 'TAP TO PLAY AGAIN', {
        fontSize: '28px',
        fontFamily: 'Arial Black',
        color: '#ffdd00'
    }).setOrigin(0.5);
    
    // Input
    this.input.on('pointerdown', () => {
        this.scene.start('GameScene');
    });
};
