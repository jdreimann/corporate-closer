
### 🎯 Key Components

#### Game Architecture
- **Game.js**: Central game controller managing state, collisions, and victory conditions
- **GameEngine.js**: Canvas rendering, camera system, and input handling
- **AudioManager.js**: Dynamic background music with seamless looping and dramatic transitions

#### Game Objects
- **Player.js**: Character with double jump, ammunition system, and health management
- **Enemy.js**: Base class with derived types (MeetingDecline, FinanceReview, CriticalStakeholder)
- **Projectile.js**: Email and call projectiles with different behaviors
- **Level.js**: Platform generation, collectibles, and time-based progression

#### UI System
- **Splash Screen**: Comprehensive game introduction with controls and goals
- **HUD**: Health bar, ammunition counters, and boss health display
- **Game Over Screen**: Victory/defeat messages with final score

## 🎵 Audio System

The game features a sophisticated audio system with:
- **Ambient Background Music**: Retro-style synthesized tracks with chord progressions
- **Seamless Looping**: Crossfade system for continuous playback
- **Dramatic Transitions**: Enhanced audio when boss appears
- **Sound Effects**: Weapon firing, enemy hits, and victory sounds

## 🛠️ Development

### Technology Stack
- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with Tailwind-inspired classes
- **Audio**: Web Audio API
- **Graphics**: HTML5 Canvas

### Key Features
- **Responsive Design**: Works on desktop and mobile
- **Progressive Web App**: Can be installed as a desktop app
- **Accessibility**: Keyboard controls and screen reader support
- **Performance**: Optimized rendering and audio processing

## �� Customization

### Adding New Enemies
```javascript
// In src/Enemy.js
class NewEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.health = 50;
        this.scoreValue = Math.round((8000 + Math.random() * 4000) / 1000) * 1000;
    }
    
    update(deltaTime, level, player, engine) {
        // Custom enemy behavior
    }
}
```

### Modifying Level Design
```javascript
// In src/Level.js
createPlatforms() {
    // Add new platforms
    this.platforms.push({ x: 1000, y: 300, width: 150, height: 20 });
}

createEnemies() {
    // Add new enemies
    this.enemies.push(new NewEnemy(1200, this.groundY - 40));
}
```

### Audio Customization
```javascript
// In src/AudioManager.js
createAmbientTrack() {
    // Modify chord progression or add new instruments
    const bassNotes = [55, 43, 65, 49]; // Custom notes
}
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Bug Reports
1. Check existing issues first
2. Create a new issue with detailed description
3. Include steps to reproduce and expected behavior

### �� Feature Requests
1. Describe the feature and its benefits
2. Consider implementation complexity
3. Discuss with maintainers before coding

### 🔧 Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request with detailed description

### 📋 Development Guidelines
- **Code Style**: Follow existing patterns and add comments
- **Testing**: Test on multiple browsers and devices
- **Performance**: Ensure smooth 60fps gameplay
- **Accessibility**: Maintain keyboard controls and screen reader support

## 🚀 Deployment

### GitHub Pages
```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

### Vercel
1. Import your GitHub repository
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## �� Acknowledgments

- **Retro Game Inspiration**: Classic platformer mechanics
- **Corporate Theme**: Office environment and business humor
- **Web Audio API**: Advanced audio synthesis and processing
- **Canvas Graphics**: Smooth rendering and animations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/corporate-closer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/corporate-closer/discussions)
- **Wiki**: [Game Documentation](https://github.com/yourusername/corporate-closer/wiki)

---

**Ready to close some deals?** 🚀💼