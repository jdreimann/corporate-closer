export { AudioManager };

class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicContext = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        
        this.initializeAudio();
        this.createSounds();
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            this.musicGain.connect(this.audioContext.destination);
            this.sfxGain.connect(this.audioContext.destination);
            
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
            
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    createSounds() {
        // Create procedural sound effects using Web Audio API
        this.sounds = {
            emailShoot: this.createEmailSound,
            callShoot: this.createCallSound,
            enemyHit: this.createHitSound,
            playerHit: this.createPlayerHitSound,
            enemyDestroy: this.createDestroySound,
            collectItem: this.createCollectSound,
            jump: this.createJumpSound,
            gameOver: this.createGameOverSound,
            victory: this.createVictorySound
        };
    }

    playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName]) return;
        
        try {
            this.sounds[soundName].call(this);
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    createEmailSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createCallSound() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator1.type = 'sine';
        oscillator2.type = 'square';
        oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(880, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }

    createHitSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    createPlayerHitSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    createDestroySound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.4);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    createCollectSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createJumpSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    createGameOverSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
    }

    createVictorySound() {
        // Play a triumphant melody
        const notes = [523, 659, 784, 1047]; // C, E, G, C (octave)
        const duration = 0.3;
        
        notes.forEach((frequency, index) => {
            const startTime = this.audioContext.currentTime + index * duration;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, startTime);
            
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    playBackgroundMusic() {
        if (!this.audioContext) return;
        
        // Create a simple ambient corporate background track
        this.createAmbientTrack();
    }

    createAmbientTrack() {
        // Create multiple oscillators for richer sound
        const oscillators = [];
        const gains = [];
        const filters = [];
        
        // Create 4 oscillators for different layers
        for (let i = 0; i < 4; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            oscillators.push(osc);
            gains.push(gain);
            filters.push(filter);
        }
        
        // Set up different waveforms and frequencies for retro feel
        oscillators[0].type = 'square'; // Bass layer
        oscillators[1].type = 'sawtooth'; // Lead layer
        oscillators[2].type = 'triangle'; // Harmony layer
        oscillators[3].type = 'sine'; // Pad layer
        
        // Corporate-themed chord progression (Am - F - C - G)
        const bassNotes = [55, 43, 65, 49]; // A, F, C, G
        const leadNotes = [220, 174, 261, 196]; // A, F, C, G (octave up)
        const harmonyNotes = [110, 87, 130, 98]; // A, F, C, G (middle)
        const padNotes = [55, 43, 65, 49]; // Same as bass but different envelope
        
        // Set initial frequencies
        oscillators[0].frequency.setValueAtTime(bassNotes[0], this.audioContext.currentTime);
        oscillators[1].frequency.setValueAtTime(leadNotes[0], this.audioContext.currentTime);
        oscillators[2].frequency.setValueAtTime(harmonyNotes[0], this.audioContext.currentTime);
        oscillators[3].frequency.setValueAtTime(padNotes[0], this.audioContext.currentTime);
        
        // Configure filters for retro sound
        filters[0].type = 'lowpass'; // Bass filter
        filters[0].frequency.setValueAtTime(400, this.audioContext.currentTime);
        filters[0].Q.setValueAtTime(0.5, this.audioContext.currentTime);
        
        filters[1].type = 'bandpass'; // Lead filter
        filters[1].frequency.setValueAtTime(800, this.audioContext.currentTime);
        filters[1].Q.setValueAtTime(2, this.audioContext.currentTime);
        
        filters[2].type = 'lowpass'; // Harmony filter
        filters[2].frequency.setValueAtTime(600, this.audioContext.currentTime);
        filters[2].Q.setValueAtTime(1, this.audioContext.currentTime);
        
        filters[3].type = 'lowpass'; // Pad filter
        filters[3].frequency.setValueAtTime(300, this.audioContext.currentTime);
        filters[3].Q.setValueAtTime(0.3, this.audioContext.currentTime);
        
        // Set initial gains
        gains[0].gain.setValueAtTime(0.15, this.audioContext.currentTime); // Bass
        gains[1].gain.setValueAtTime(0.08, this.audioContext.currentTime); // Lead
        gains[2].gain.setValueAtTime(0.12, this.audioContext.currentTime); // Harmony
        gains[3].gain.setValueAtTime(0.06, this.audioContext.currentTime); // Pad
        
        // Start all oscillators
        oscillators.forEach(osc => osc.start());
        
        let currentChord = 0;
        const chordDuration = 4000; // 4 seconds per chord
        let isDramaticMode = false;
        
        // Store references for external control
        this.ambientOscillators = oscillators;
        this.ambientGains = gains;
        this.ambientFilters = filters;
        this.ambientChordDuration = chordDuration;
        this.ambientIsDramatic = false;
        
        // Create chord progression loop
        const chordLoop = setInterval(() => {
            const time = this.audioContext.currentTime;
            
            // Transition to next chord
            oscillators[0].frequency.setValueAtTime(bassNotes[currentChord], time);
            oscillators[1].frequency.setValueAtTime(leadNotes[currentChord], time);
            oscillators[2].frequency.setValueAtTime(harmonyNotes[currentChord], time);
            oscillators[3].frequency.setValueAtTime(padNotes[currentChord], time);
            
            // Add subtle filter modulation for movement
            filters[1].frequency.setValueAtTime(800 + Math.sin(time * 0.5) * 100, time);
            filters[2].frequency.setValueAtTime(600 + Math.sin(time * 0.3) * 50, time);
            
            // Add slight gain modulation for dynamics
            gains[1].gain.setValueAtTime(0.08 + Math.sin(time * 0.7) * 0.02, time);
            gains[2].gain.setValueAtTime(0.12 + Math.sin(time * 0.5) * 0.03, time);
            
            currentChord = (currentChord + 1) % 4;
        }, chordDuration);
        
        // Create arpeggio pattern for lead layer
        let arpeggioStep = 0;
        const arpeggioInterval = setInterval(() => {
            const time = this.audioContext.currentTime;
            const arpeggioNotes = [leadNotes[currentChord], leadNotes[currentChord] * 1.25, leadNotes[currentChord] * 1.5];
            
            oscillators[1].frequency.setValueAtTime(arpeggioNotes[arpeggioStep], time);
            arpeggioStep = (arpeggioStep + 1) % 3;
        }, 500); // Every 0.5 seconds
        
        // Store intervals for cleanup
        this.ambientChordLoop = chordLoop;
        this.ambientArpeggioInterval = arpeggioInterval;
        
        // Create seamless loop by starting the next track before the current one ends
        const loopDuration = 30000; // 30 seconds
        const crossfadeDuration = 2000; // 2 second crossfade
        
        setTimeout(() => {
            // Start crossfade to new track
            this.createAmbientTrackCrossfade(oscillators, gains, crossfadeDuration);
        }, loopDuration - crossfadeDuration);
        
        // Stop current track after crossfade completes
        setTimeout(() => {
            // Only stop if this is still the current track (not replaced by reset)
            if (this.ambientOscillators === oscillators) {
                clearInterval(chordLoop);
                clearInterval(arpeggioInterval);
                oscillators.forEach(osc => {
                    try {
                        osc.stop();
                    } catch (e) {
                        // Oscillator might already be stopped
                    }
                });
            }
        }, loopDuration);
    }

    createAmbientTrackCrossfade(oldOscillators, oldGains, crossfadeDuration) {
        // Only create crossfade if this is still the current track
        if (this.ambientOscillators !== oldOscillators) return;
        
        // Create new oscillators for crossfade
        const newOscillators = [];
        const newGains = [];
        const newFilters = [];
        
        // Create 4 new oscillators
        for (let i = 0; i < 4; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            newOscillators.push(osc);
            newGains.push(gain);
            newFilters.push(filter);
        }
        
        // Set up new oscillators with same settings
        newOscillators[0].type = 'square';
        newOscillators[1].type = 'sawtooth';
        newOscillators[2].type = 'triangle';
        newOscillators[3].type = 'sine';
        
        const bassNotes = [55, 43, 65, 49];
        const leadNotes = [220, 174, 261, 196];
        const harmonyNotes = [110, 87, 130, 98];
        const padNotes = [55, 43, 65, 49];
        
        const time = this.audioContext.currentTime;
        
        // Set initial frequencies to match current chord
        const currentChord = Math.floor((time * 1000) / 4000) % 4;
        newOscillators[0].frequency.setValueAtTime(bassNotes[currentChord], time);
        newOscillators[1].frequency.setValueAtTime(leadNotes[currentChord], time);
        newOscillators[2].frequency.setValueAtTime(harmonyNotes[currentChord], time);
        newOscillators[3].frequency.setValueAtTime(padNotes[currentChord], time);
        
        // Configure filters
        newFilters[0].type = 'lowpass';
        newFilters[0].frequency.setValueAtTime(400, time);
        newFilters[0].Q.setValueAtTime(0.5, time);
        
        newFilters[1].type = 'bandpass';
        newFilters[1].frequency.setValueAtTime(800, time);
        newFilters[1].Q.setValueAtTime(2, time);
        
        newFilters[2].type = 'lowpass';
        newFilters[2].frequency.setValueAtTime(600, time);
        newFilters[2].Q.setValueAtTime(1, time);
        
        newFilters[3].type = 'lowpass';
        newFilters[3].frequency.setValueAtTime(300, time);
        newFilters[3].Q.setValueAtTime(0.3, time);
        
        // Start new oscillators with zero gain
        newOscillators.forEach(osc => osc.start());
        newGains.forEach(gain => gain.gain.setValueAtTime(0, time));
        
        // Crossfade: fade out old, fade in new
        oldGains.forEach(gain => {
            gain.gain.linearRampToValueAtTime(0, time + crossfadeDuration);
        });
        
        newGains[0].gain.linearRampToValueAtTime(0.15, time + crossfadeDuration);
        newGains[1].gain.linearRampToValueAtTime(0.08, time + crossfadeDuration);
        newGains[2].gain.linearRampToValueAtTime(0.12, time + crossfadeDuration);
        newGains[3].gain.linearRampToValueAtTime(0.06, time + crossfadeDuration);
        
        // Update references to new oscillators
        this.ambientOscillators = newOscillators;
        this.ambientGains = newGains;
        this.ambientFilters = newFilters;
        this.ambientIsDramatic = false;
        
        // Set up new chord progression loop
        let newCurrentChord = currentChord;
        const newChordLoop = setInterval(() => {
            const currentTime = this.audioContext.currentTime;
            
            newOscillators[0].frequency.setValueAtTime(bassNotes[newCurrentChord], currentTime);
            newOscillators[1].frequency.setValueAtTime(leadNotes[newCurrentChord], currentTime);
            newOscillators[2].frequency.setValueAtTime(harmonyNotes[newCurrentChord], currentTime);
            newOscillators[3].frequency.setValueAtTime(padNotes[newCurrentChord], currentTime);
            
            newFilters[1].frequency.setValueAtTime(800 + Math.sin(currentTime * 0.5) * 100, currentTime);
            newFilters[2].frequency.setValueAtTime(600 + Math.sin(currentTime * 0.3) * 50, currentTime);
            
            newGains[1].gain.setValueAtTime(0.08 + Math.sin(currentTime * 0.7) * 0.02, currentTime);
            newGains[2].gain.setValueAtTime(0.12 + Math.sin(currentTime * 0.5) * 0.03, currentTime);
            
            newCurrentChord = (newCurrentChord + 1) % 4;
        }, 4000);
        
        // Set up new arpeggio
        let newArpeggioStep = 0;
        const newArpeggioInterval = setInterval(() => {
            const currentTime = this.audioContext.currentTime;
            const arpeggioNotes = [leadNotes[newCurrentChord], leadNotes[newCurrentChord] * 1.25, leadNotes[newCurrentChord] * 1.5];
            
            newOscillators[1].frequency.setValueAtTime(arpeggioNotes[newArpeggioStep], currentTime);
            newArpeggioStep = (newArpeggioStep + 1) % 3;
        }, 500);
        
        this.ambientChordLoop = newChordLoop;
        this.ambientArpeggioInterval = newArpeggioInterval;
        
        // Set up next loop
        setTimeout(() => {
            this.createAmbientTrackCrossfade(newOscillators, newGains, crossfadeDuration);
        }, 30000 - crossfadeDuration);
        
        // Clean up old track
        setTimeout(() => {
            if (this.ambientOscillators !== oldOscillators) {
                oldOscillators.forEach(osc => {
                    try {
                        osc.stop();
                    } catch (e) {
                        // Oscillator might already be stopped
                    }
                });
            }
        }, crossfadeDuration);
    }

    transitionToDramaticMode() {
        if (!this.ambientOscillators || this.ambientIsDramatic) return;
        
        this.ambientIsDramatic = true;
        const time = this.audioContext.currentTime;
        const transitionDuration = 2.0; // 2 second transition
        
        // Dramatic mode changes:
        // 1. Faster chord progression (2 seconds instead of 4)
        this.ambientChordDuration = 2000;
        
        // 2. Increase overall volume
        this.ambientGains[0].gain.setValueAtTime(0.15, time);
        this.ambientGains[0].gain.linearRampToValueAtTime(0.25, time + transitionDuration);
        
        this.ambientGains[1].gain.setValueAtTime(0.08, time);
        this.ambientGains[1].gain.linearRampToValueAtTime(0.15, time + transitionDuration);
        
        this.ambientGains[2].gain.setValueAtTime(0.12, time);
        this.ambientGains[2].gain.linearRampToValueAtTime(0.2, time + transitionDuration);
        
        this.ambientGains[3].gain.setValueAtTime(0.06, time);
        this.ambientGains[3].gain.linearRampToValueAtTime(0.12, time + transitionDuration);
        
        // 3. More aggressive filter settings
        this.ambientFilters[0].frequency.setValueAtTime(400, time);
        this.ambientFilters[0].frequency.linearRampToValueAtTime(600, time + transitionDuration);
        
        this.ambientFilters[1].frequency.setValueAtTime(800, time);
        this.ambientFilters[1].frequency.linearRampToValueAtTime(1200, time + transitionDuration);
        
        this.ambientFilters[2].frequency.setValueAtTime(600, time);
        this.ambientFilters[2].frequency.linearRampToValueAtTime(900, time + transitionDuration);
        
        // 4. Faster arpeggio (every 0.3 seconds instead of 0.5)
        clearInterval(this.ambientArpeggioInterval);
        
        let arpeggioStep = 0;
        this.ambientArpeggioInterval = setInterval(() => {
            const currentTime = this.audioContext.currentTime;
            const currentChord = Math.floor((currentTime * 1000) / this.ambientChordDuration) % 4;
            const bassNotes = [55, 43, 65, 49];
            const leadNotes = [220, 174, 261, 196];
            const arpeggioNotes = [leadNotes[currentChord], leadNotes[currentChord] * 1.25, leadNotes[currentChord] * 1.5];
            
            this.ambientOscillators[1].frequency.setValueAtTime(arpeggioNotes[arpeggioStep], currentTime);
            arpeggioStep = (arpeggioStep + 1) % 3;
        }, 300); // Every 0.3 seconds
        
        // 5. Add more dramatic modulation
        const dramaticModulation = setInterval(() => {
            const currentTime = this.audioContext.currentTime;
            this.ambientFilters[1].frequency.setValueAtTime(1200 + Math.sin(currentTime * 1.5) * 200, currentTime);
            this.ambientFilters[2].frequency.setValueAtTime(900 + Math.sin(currentTime * 1.0) * 100, currentTime);
            
            this.ambientGains[1].gain.setValueAtTime(0.15 + Math.sin(currentTime * 1.2) * 0.05, currentTime);
            this.ambientGains[2].gain.setValueAtTime(0.2 + Math.sin(currentTime * 0.8) * 0.08, currentTime);
        }, 100);
        
        this.ambientDramaticModulation = dramaticModulation;
        
        console.log('🎵 Ambient track transitioned to dramatic mode!');
    }

    resetAmbientTrack() {
        // Clear any existing intervals
        if (this.ambientChordLoop) {
            clearInterval(this.ambientChordLoop);
        }
        if (this.ambientArpeggioInterval) {
            clearInterval(this.ambientArpeggioInterval);
        }
        if (this.ambientDramaticModulation) {
            clearInterval(this.ambientDramaticModulation);
        }
        
        // Stop any existing oscillators
        if (this.ambientOscillators) {
            this.ambientOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // Oscillator might already be stopped
                }
            });
        }
        
        // Reset state
        this.ambientOscillators = null;
        this.ambientGains = null;
        this.ambientFilters = null;
        this.ambientChordDuration = null;
        this.ambientIsDramatic = false;
        this.ambientChordLoop = null;
        this.ambientArpeggioInterval = null;
        this.ambientDramaticModulation = null;
        
        // Start fresh ambient track
        this.createAmbientTrack();
        
        console.log('🎵 Ambient track reset to normal mode!');
    }
}