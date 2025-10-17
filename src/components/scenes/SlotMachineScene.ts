Frontend & Backend (Unified):
├── Next.js 14.2.33 (App Router)
├── TypeScript
├── React 18.2.0
└── Axios

Database (if needed):
├── MongoDB Atlas (Free tier)
└── Mongoose 7.5.0

Styling:
├── CSS Modules or globals.css
└── Your choice of theme!

Deployment:
├── Vercel (Serverless)
└── GitHub (CI/CD)import Phaser from 'phaser';

interface Symbol {
  sprite: Phaser.GameObjects.Text;
  icon: string;
}

interface Reel {
  symbols: Symbol[];
  container: Phaser.GameObjects.Container;
  spinning: boolean;
  targetPosition: number;
}

export default class SlotMachineScene extends Phaser.Scene {
  private reels: Reel[] = [];
  private readonly SYMBOLS = ['☢', '💀', '🎯', '⚙', '💊', '🔫'];
  private readonly REEL_COUNT = 3;
  private readonly SYMBOLS_PER_REEL = 5;
  private readonly SYMBOL_SIZE = 110;
  private readonly VISIBLE_SYMBOLS = 3;
  private spinning = false;
  private betAmount = 10;
  private spinSound?: Phaser.Sound.BaseSound;
  private winSound?: Phaser.Sound.BaseSound;
  private lightShow?: Phaser.GameObjects.Particles.ParticleEmitter;
  private glowLights: Phaser.GameObjects.Arc[] = [];
  private neonGlow: Phaser.GameObjects.Arc[] = [];
  
  // Pinball-style objectives
  private objectives = {
    spinStreak: 0,
    symbolsCollected: new Set<string>(),
    bonusMultiplier: 1,
    jackpotProgress: 0
  };

  constructor() {
    super({ key: 'SlotMachineScene' });
    console.log('SlotMachineScene constructor called');
  }

  preload() {
    console.log('SlotMachineScene preload called');
  }

  create() {
    console.log('SlotMachineScene create called');
    
    // Post-apocalyptic background
    const bg = this.add.rectangle(400, 300, 800, 600, 0x3d2817);
    bg.setStrokeStyle(4, 0x8b4513);
    
    // Wasteland Title
    const title = this.add.text(400, 50, '☢ MOJAVE WASTELAND SLOTS ☢', {
      fontSize: '42px',
      color: '#ff6b35',
      fontStyle: 'bold',
      fontFamily: 'Courier New, monospace',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // Pinball-style objectives display
    this.createObjectivesDisplay();

    // Rusty metal slot machine frame - sized for 3x3 grid
    const frameGraphics = this.add.graphics();
    frameGraphics.fillStyle(0x2a1810, 1);
    frameGraphics.fillRoundedRect(145, 130, 510, 380, 15);
    frameGraphics.lineStyle(10, 0x8b4513, 1);
    frameGraphics.strokeRoundedRect(145, 130, 510, 380, 15);
    
    // Add rust spots
    frameGraphics.fillStyle(0x4a2511, 0.6);
    frameGraphics.fillCircle(165, 150, 15);
    frameGraphics.fillCircle(635, 150, 20);
    frameGraphics.fillCircle(155, 490, 18);

    // Create simple particle texture first (used for effects)
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff6b35, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();

    // Create reels
    for (let i = 0; i < this.REEL_COUNT; i++) {
      this.createReel(i);
    }

    // Add ambient radiation glow particles
    const particles = this.add.particles(400, 300, 'particle', {
      speed: { min: -30, max: 30 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      lifespan: 2000,
      alpha: { start: 0.6, end: 0 },
      tint: 0x00ff00,
      frequency: 200
    });

    // Listen for spin events from React
    this.game.events.on('start-spin', (betAmount: number) => {
      this.betAmount = betAmount;
      this.spin();
    });
  }

  private createReel(reelIndex: number) {
    const x = 260 + reelIndex * 140;
    const y = 310;

    const container = this.add.container(x, y);
    const symbols: Symbol[] = [];

    // Draw reel background - sized for 3 visible symbols
    const reelBg = this.add.graphics();
    reelBg.fillStyle(0x1a0f0a, 0.8);
    reelBg.fillRect(-65, -165, 130, 330);
    reelBg.lineStyle(3, 0x654321, 1);
    reelBg.strokeRect(-65, -165, 130, 330);
    container.add(reelBg);

    // Create mask for the reel - shows exactly 3 symbols
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(x - 65, y - 165, 130, 330);
    const mask = maskShape.createGeometryMask();
    container.setMask(mask);

    // Create symbols for this reel
    for (let i = 0; i < this.SYMBOLS_PER_REEL; i++) {
      const symbolIndex = Phaser.Math.Between(0, this.SYMBOLS.length - 1);
      const icon = this.SYMBOLS[symbolIndex];
      
      console.log(`Creating symbol ${i} for reel ${reelIndex}: ${icon}`);
      
      const text = this.add.text(0, (i * this.SYMBOL_SIZE) - 110, icon, {
        fontSize: '70px',
        fontFamily: 'Segoe UI Emoji, Arial, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: '#000000',
          blur: 5,
          fill: true
        }
      });
      text.setOrigin(0.5);
      text.setDepth(10);

      container.add(text);
      symbols.push({
        sprite: text,
        icon: icon
      });
    }

    this.reels.push({
      symbols,
      container,
      spinning: false,
      targetPosition: 0
    });
  }

  private spin() {
    if (this.spinning) return;
    
    this.spinning = true;
    this.game.events.emit('spin-start');

    // Spin each reel
    this.reels.forEach((reel, index) => {
      reel.spinning = true;
      
      // Random spin duration for each reel (staggered stop)
      const spinDuration = 2000 + index * 500;
      const spins = 3 + index; // More spins for later reels
      
      // Add motion blur effect while spinning
      const reelX = 150 + index * 200;
      const spinTrail = this.add.particles(reelX, 300, 'particle', {
        speed: { min: 50, max: 100 },
        scale: { start: 0.8, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        alpha: { start: 0.6, end: 0 },
        tint: 0xff6b35,
        frequency: 30,
        angle: { min: 80, max: 100 }
      });
      
      this.tweens.add({
        targets: reel.container,
        y: `+=${this.SYMBOL_SIZE * this.SYMBOLS_PER_REEL * spins}`,
        duration: spinDuration,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          // Wrap symbols around
          reel.symbols.forEach((symbol) => {
            const worldY = symbol.sprite.y + reel.container.y;
            if (worldY > 450) {
              symbol.sprite.y -= this.SYMBOL_SIZE * this.SYMBOLS_PER_REEL;
              // Change symbol during spin
              const newIcon = this.SYMBOLS[Phaser.Math.Between(0, this.SYMBOLS.length - 1)];
              symbol.icon = newIcon;
              symbol.sprite.setText(newIcon);
            }
          });
        },
        onComplete: () => {
          reel.spinning = false;
          
          // Stop the spin trail
          spinTrail.stop();
          this.time.delayedCall(500, () => spinTrail.destroy());
          
          // Snap to position - ensure we align to nearest symbol boundary
          const currentY = reel.container.y;
          const remainder = currentY % this.SYMBOL_SIZE;
          
          // Round to nearest symbol position
          if (remainder !== 0) {
            if (remainder > this.SYMBOL_SIZE / 2) {
              reel.container.y += (this.SYMBOL_SIZE - remainder);
            } else {
              reel.container.y -= remainder;
            }
          }

          // Check if all reels stopped
          if (this.reels.every(r => !r.spinning)) {
            this.checkWin();
          }
        }
      });
    });
  }

  private checkWin() {
    this.spinning = false;

    // Get the center symbol from each reel (index 2)
    const centerSymbols = this.reels.map(reel => {
      const centerSymbol = reel.symbols[2];
      return centerSymbol.icon;
    });

    console.log('Result:', centerSymbols);

    // 🎯 PINBALL OBJECTIVES UPDATE
    centerSymbols.forEach(symbol => this.objectives.symbolsCollected.add(symbol));
    
    // Check for matches
    const allMatch = centerSymbols.every(symbol => symbol === centerSymbols[0]);
    
    // Count occurrences of each symbol
    const symbolCounts: { [key: string]: number } = {};
    centerSymbols.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });
    
    // Find if we have any pairs (2 matching symbols)
    const hasPair = Object.values(symbolCounts).some(count => count === 2);
    
    let winAmount = 0;
    if (allMatch) {
      // All 3 match - BIG WIN!
      const symbol = centerSymbols[0];
      const baseMultipliers: { [key: string]: number } = {
        '💀': 3,
        '💊': 5,
        '�': 8,
        '⚙': 15,
        '🔫': 25,
        '☢': 100
      };
      
      const baseMultiplier = baseMultipliers[symbol] || 2;
      
      // 🎯 Apply bonus multiplier from objectives!
      winAmount = this.betAmount * baseMultiplier * this.objectives.bonusMultiplier;
      
      // Update objectives
      this.objectives.spinStreak++;
      this.objectives.jackpotProgress += 5;
      
      // Increase bonus multiplier with streak
      if (this.objectives.spinStreak % 3 === 0) {
        this.objectives.bonusMultiplier += 0.5;
      }
      
      // Collected all symbols? BIG BONUS!
      if (this.objectives.symbolsCollected.size === 6) {
        winAmount *= 2;
        this.showBonusMessage('🎉 ALL SYMBOLS COLLECTED! 2x BONUS! 🎉');
        this.objectives.symbolsCollected.clear();
      }
      
      // Jackpot achieved!
      const isJackpot = this.objectives.jackpotProgress >= 100;
      if (isJackpot) {
        winAmount *= 3;
        this.objectives.jackpotProgress = 0;
        // Show atomic explosion AFTER win registers
        this.time.delayedCall(1000, () => {
          this.showAtomicExplosion();
        });
      }

      // Show win animation with horizontal line
      this.showWinAnimation(winAmount, 'horizontal', [0, 1, 2], isJackpot);
    } else if (hasPair) {
      // 2 matching symbols - SMALL WIN!
      const pairSymbol = Object.keys(symbolCounts).find(key => symbolCounts[key] === 2);
      
      if (pairSymbol) {
        const pairMultipliers: { [key: string]: number } = {
          '💀': 1.5,
          '💊': 2,
          '🎯': 2.5,
          '⚙': 3,
          '🔫': 4,
          '☢': 10
        };
        
        const pairMultiplier = pairMultipliers[pairSymbol] || 1;
        winAmount = this.betAmount * pairMultiplier;
        
        // Small streak increment
        this.objectives.spinStreak++;
        this.objectives.jackpotProgress += 1;
        
        // Find which reels have the pair
        const pairReels: number[] = [];
        centerSymbols.forEach((symbol, index) => {
          if (symbol === pairSymbol) {
            pairReels.push(index);
          }
        });
        
        // Show win animation with custom highlighting
        this.showWinAnimation(winAmount, 'horizontal', pairReels);
      }
    } else {
      // Reset streak on loss
      this.objectives.spinStreak = 0;
      this.objectives.bonusMultiplier = Math.max(1, this.objectives.bonusMultiplier - 0.1);
    }
    
    // Update objectives display
    this.updateObjectivesDisplay();

    this.game.events.emit('spin-complete', winAmount);
  }

  private showWinAnimation(amount: number, direction: 'horizontal' | 'vertical' | 'diagonal', reelIndices: number[], isJackpot: boolean = false) {
    const winText = this.add.text(400, 510, `+${amount} BOTTLE CAPS`, {
      fontSize: '24px',
      color: '#ffff00',
      fontStyle: 'bold',
      fontFamily: 'Courier New, monospace',
      stroke: '#000000',
      strokeThickness: 4
    });
    winText.setOrigin(0.5);
    winText.setAlpha(0);

    // Animate win text - more subtle
    this.tweens.add({
      targets: winText,
      alpha: 1,
      y: 495,
      duration: 400,
      ease: 'Back.easeOut',
      hold: 800,
      yoyo: true,
      onComplete: () => {
        winText.destroy();
      }
    });

    // Highlight winning symbols with directional line
    if (direction === 'horizontal') {
      // Subtle glow effect on winning line
      const startX = 260 + reelIndices[0] * 140;
      const endX = 260 + reelIndices[reelIndices.length - 1] * 140;
      const width = endX - startX + 130;
      const centerX = (startX + endX) / 2;
      
      // Create a more subtle highlight - thin border only
      const flash = this.add.rectangle(centerX, 310, width, 100, 0x000000, 0);
      flash.setStrokeStyle(3, 0xffff00, 0.9);
      
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        repeat: 2,
        yoyo: true,
        onComplete: () => {
          flash.destroy();
        }
      });
      
      // Glow the winning symbols with color tint
      reelIndices.forEach(reelIdx => {
        const reel = this.reels[reelIdx];
        const centerSymbol = reel.symbols[2].sprite;
        
        // Scale and tint animation
        this.tweens.add({
          targets: centerSymbol,
          scale: 1.2,
          duration: 250,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut'
        });
        
        // Add a subtle glow circle behind the symbol
        const glow = this.add.circle(260 + reelIdx * 140, 310, 50, 0xffff00, 0.3);
        glow.setDepth(5);
        
        this.tweens.add({
          targets: glow,
          alpha: 0,
          scale: 1.5,
          duration: 600,
          repeat: 2,
          yoyo: true,
          onComplete: () => {
            glow.destroy();
          }
        });
      });
    }

    // Add subtle sparkle particles at center of win line
    if (!isJackpot) {
      const centerX = reelIndices.reduce((sum, idx) => sum + (260 + idx * 140), 0) / reelIndices.length;
      const sparkles = this.add.particles(centerX, 310, 'particle', {
        speed: { min: 50, max: 100 },
        scale: { start: 0.6, end: 0 },
        blendMode: 'ADD',
        lifespan: 400,
        tint: [0xffff00, 0xffa500],
        quantity: 8,
        angle: { min: -30, max: 30 }
      });
      
      this.time.delayedCall(400, () => {
        sparkles.destroy();
      });
    }
  }

  private createObjectivesDisplay() {
    // Background for objectives (used for visual separation)
    this.add.rectangle(400, 540, 600, 35, 0x000000, 0.7);
    
    const objectivesText = this.add.text(400, 540, this.getObjectivesText(), {
      fontSize: '14px',
      color: '#00ff00',
      fontFamily: 'Courier New, monospace',
      fontStyle: 'bold'
    });
    objectivesText.setOrigin(0.5);
    objectivesText.setName('objectivesText');
  }

  private getObjectivesText(): string {
    const streak = this.objectives.spinStreak;
    const collected = this.objectives.symbolsCollected.size;
    const multiplier = this.objectives.bonusMultiplier.toFixed(1);
    const progress = Math.floor(this.objectives.jackpotProgress);
    
    return `🎯 STREAK: ${streak} | 📦 SYMBOLS: ${collected}/6 | ⚡ MULTIPLIER: x${multiplier} | 🎰 JACKPOT: ${progress}%`;
  }

  private updateObjectivesDisplay() {
    const text = this.children.getByName('objectivesText') as Phaser.GameObjects.Text;
    if (text) {
      text.setText(this.getObjectivesText());
      
      // Flash effect when objectives update
      this.tweens.add({
        targets: text,
        scale: 1.1,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }
  }

  private startLightShow() {
    // NEON CHASE SEQUENCE - Super fast pinball style!
    this.glowLights.forEach((light, index) => {
      this.tweens.killTweensOf(light);
      this.tweens.add({
        targets: light,
        alpha: 1,
        scale: 1.3,
        duration: 80,
        yoyo: true,
        repeat: -1,
        delay: index * 15,
        ease: 'Sine.easeInOut'
      });
    });
    
    this.neonGlow.forEach((glow, index) => {
      this.tweens.killTweensOf(glow);
      this.tweens.add({
        targets: glow,
        alpha: 1,
        scale: 1.5,
        duration: 80,
        yoyo: true,
        repeat: -1,
        delay: index * 15,
        ease: 'Sine.easeInOut'
      });
    });

    // Create spinning particle burst
    if (this.lightShow) {
      this.lightShow.stop();
    }

    this.lightShow = this.add.particles(400, 300, 'particle', {
      speed: { min: 100, max: 200 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      alpha: { start: 0.8, end: 0 },
      tint: [0xff6b35, 0xffa500, 0xff0000, 0xffff00],
      frequency: 50,
      angle: { min: 0, max: 360 },
      gravityY: 0
    });

    // Add strobing flash effect
    const flashRect = this.add.rectangle(400, 300, 800, 600, 0xff6b35, 0);
    this.tweens.add({
      targets: flashRect,
      alpha: 0.1,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Store reference to stop later
    this.time.delayedCall(100, () => {
      this.tweens.add({
        targets: flashRect,
        alpha: 0,
        duration: 500,
        onComplete: () => flashRect.destroy()
      });
    });
  }

  private stopLightShow() {
    // Return neon lights to normal chase pattern
    this.glowLights.forEach((light, index) => {
      this.tweens.killTweensOf(light);
      this.tweens.add({
        targets: light,
        alpha: 0.6,
        scale: 1,
        duration: 300,
        yoyo: true,
        repeat: -1,
        delay: index * 40,
        ease: 'Sine.easeInOut'
      });
    });
    
    this.neonGlow.forEach((glow, index) => {
      this.tweens.killTweensOf(glow);
      this.tweens.add({
        targets: glow,
        alpha: 0.3,
        scale: 1,
        duration: 300,
        yoyo: true,
        repeat: -1,
        delay: index * 40,
        ease: 'Sine.easeInOut'
      });
    });

    // Stop particle burst
    if (this.lightShow) {
      this.tweens.add({
        targets: this.lightShow,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (this.lightShow) {
            this.lightShow.stop();
          }
        }
      });
    }
  }

  private showBonusMessage(message: string) {
    const bonusText = this.add.text(400, 200, message, {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold',
      fontFamily: 'Courier New, monospace',
      stroke: '#ff0000',
      strokeThickness: 6,
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    bonusText.setOrigin(0.5);
    bonusText.setAlpha(0);
    bonusText.setDepth(1000);

    // Exciting animation!
    this.tweens.add({
      targets: bonusText,
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      y: 180,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        this.tweens.add({
          targets: bonusText,
          alpha: 0,
          y: 150,
          duration: 500,
          onComplete: () => bonusText.destroy()
        });
      }
    });
  }

  private showAtomicExplosion() {
    // Full screen atomic explosion overlay
    const explosionBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
    explosionBg.setDepth(2000);
    
    // Fade to black first
    this.tweens.add({
      targets: explosionBg,
      alpha: 0.9,
      duration: 300,
      ease: 'Power2'
    });

    // Giant atomic symbol
    const atomicSymbol = this.add.text(400, 300, '☢', {
      fontSize: '400px',
      fontFamily: 'Segoe UI Emoji, Arial, sans-serif',
      color: '#00ff00',
      stroke: '#ffff00',
      strokeThickness: 15
    });
    atomicSymbol.setOrigin(0.5);
    atomicSymbol.setAlpha(0);
    atomicSymbol.setDepth(2001);

    // Jackpot text
    const jackpotText = this.add.text(400, 100, '💥 MEGA JACKPOT! 💥', {
      fontSize: '48px',
      color: '#ffff00',
      fontStyle: 'bold',
      fontFamily: 'Courier New, monospace',
      stroke: '#ff0000',
      strokeThickness: 8
    });
    jackpotText.setOrigin(0.5);
    jackpotText.setAlpha(0);
    jackpotText.setDepth(2002);

    // Bonus text
    const bonusText = this.add.text(400, 500, '3x MULTIPLIER!', {
      fontSize: '36px',
      color: '#00ff00',
      fontStyle: 'bold',
      fontFamily: 'Courier New, monospace',
      stroke: '#000000',
      strokeThickness: 6
    });
    bonusText.setOrigin(0.5);
    bonusText.setAlpha(0);
    bonusText.setDepth(2002);

    // Massive particle explosion
    const massiveExplosion = this.add.particles(400, 300, 'particle', {
      speed: { min: 200, max: 600 },
      scale: { start: 2, end: 0 },
      blendMode: 'ADD',
      lifespan: 2000,
      alpha: { start: 1, end: 0 },
      tint: [0xff0000, 0xff6b35, 0xffff00, 0x00ff00],
      quantity: 100,
      angle: { min: 0, max: 360 },
      gravityY: -50
    });
    massiveExplosion.setDepth(1999);

    // Animate atomic symbol - expand with glow
    this.tweens.add({
      targets: atomicSymbol,
      alpha: 1,
      scale: { from: 0, to: 1.5 },
      duration: 800,
      ease: 'Back.easeOut'
    });

    // Pulse the atomic symbol
    this.tweens.add({
      targets: atomicSymbol,
      scale: 1.6,
      duration: 500,
      yoyo: true,
      repeat: 4,
      delay: 800,
      ease: 'Sine.easeInOut'
    });

    // Show jackpot text
    this.tweens.add({
      targets: jackpotText,
      alpha: 1,
      scale: { from: 0.5, to: 1.3 },
      y: 120,
      duration: 600,
      delay: 400,
      ease: 'Back.easeOut'
    });

    // Show bonus text
    this.tweens.add({
      targets: bonusText,
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      duration: 600,
      delay: 600,
      ease: 'Back.easeOut'
    });

    // Screen shake
    this.cameras.main.shake(3000, 0.01);

    // Flash the screen with radiation glow
    const radiationFlash = this.add.rectangle(400, 300, 800, 600, 0x00ff00, 0);
    radiationFlash.setDepth(2003);
    
    for (let i = 0; i < 5; i++) {
      this.tweens.add({
        targets: radiationFlash,
        alpha: 0.3,
        duration: 150,
        yoyo: true,
        delay: 800 + i * 300,
        ease: 'Sine.easeInOut'
      });
    }

    // Clear everything after 4 seconds
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: [explosionBg, atomicSymbol, jackpotText, bonusText, radiationFlash],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          explosionBg.destroy();
          atomicSymbol.destroy();
          jackpotText.destroy();
          bonusText.destroy();
          radiationFlash.destroy();
          massiveExplosion.destroy();
        }
      });
    });
  }

  update() {
    // Any continuous updates can go here
  }
}
