class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = {};
        this.isInitialized = false;
        this.currentMelodyInterval = null;
        this.soundConfigs = [
            { name: 'hit', frequency: 440, duration: 0.1 },    // A4 note
            { name: 'score', frequency: 880, duration: 0.2 },  // A5 note
            { name: 'boost', frequency: 660, duration: 0.15 }, // E5 note
            { name: 'start', frequency: 550, duration: 0.3 },   // C#5 note
            { name: 'shield', frequency: 1200, duration: 0.2 }, // High-pitched sci-fi shield sound
            // Christmas melody notes
            { name: 'note_C4', frequency: 261.63, duration: 0.3 },  // C4
            { name: 'note_D4', frequency: 293.66, duration: 0.3 },  // D4
            { name: 'note_E4', frequency: 329.63, duration: 0.3 },  // E4
            { name: 'note_F4', frequency: 349.23, duration: 0.3 },  // F4
            { name: 'note_G4', frequency: 392.00, duration: 0.3 },  // G4
            { name: 'note_A4', frequency: 440.00, duration: 0.3 },  // A4
            { name: 'note_B4', frequency: 493.88, duration: 0.3 }   // B4
        ];
        
        // Add click handler to initialize audio
        document.addEventListener('click', () => this.initOnUserInteraction(), { once: true });
        document.addEventListener('keydown', () => this.initOnUserInteraction(), { once: true });
        document.addEventListener('touchstart', () => this.initOnUserInteraction(), { once: true });
    }

    async initOnUserInteraction() {
        console.log('User interaction detected, initializing audio...');
        try {
            await this.initAudioContext();
            // Play a silent sound to unlock audio
            await this.playSound('hit', 0);
        } catch (error) {
            console.error('Failed to initialize audio on user interaction:', error);
        }
    }
    
    async initAudioContext() {
        console.log('Attempting to initialize AudioContext...');
        if (this.audioContext) {
            console.log('AudioContext already exists');
            if (this.audioContext.state === 'suspended') {
                console.log('Resuming suspended AudioContext...');
                await this.audioContext.resume();
            }
            return;
        }
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log('Created new AudioContext, state:', this.audioContext.state);
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;
            
            await this.generateSounds();
            this.isInitialized = true;
            console.log('Audio system fully initialized');
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
            throw error;
        }
    }
    
    async generateSounds() {
        console.log('Generating sounds...');
        if (this.isInitialized) {
            console.log('Sounds already generated');
            return;
        }
        
        try {
            for (const config of this.soundConfigs) {
                const sampleRate = this.audioContext.sampleRate;
                const length = config.duration * sampleRate;
                const buffer = this.audioContext.createBuffer(1, length, sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < length; i++) {
                    const t = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * config.frequency * t) *
                             Math.exp(-3 * t / config.duration);
                }
                
                this.sounds[config.name] = buffer;
                console.log(`Generated sound: ${config.name}`);
            }
        } catch (error) {
            console.error('Failed to generate sounds:', error);
            throw error;
        }
    }
    
    async playSound(soundName, volume = 1, pitch = 1) {
        console.log(`Attempting to play sound: ${soundName}`);
        if (!this.audioContext) {
            console.warn('AudioContext not initialized. Initializing now...');
            try {
                await this.initAudioContext();
            } catch (error) {
                console.error('Failed to initialize AudioContext:', error);
                return;
            }
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log('AudioContext suspended. Resuming...');
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.error('Failed to resume AudioContext:', error);
                return;
            }
        }
        
        const soundBuffer = this.sounds[soundName];
        if (!soundBuffer) {
            console.warn(`Sound ${soundName} not found. Available sounds:`, Object.keys(this.sounds));
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundBuffer;
            source.playbackRate.value = pitch;
            
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            source.start(0);
            console.log(`Successfully played sound: ${soundName}`);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
    
    async playChristmasMelody() {
        console.log('Attempting to play Christmas melody...');
        console.log('Audio context state:', this.audioContext?.state);
        console.log('Is initialized:', this.isInitialized);
        
        if (!this.audioContext || !this.isInitialized) {
            console.warn('Audio not initialized for Christmas melody');
            try {
                await this.initAudioContext();
            } catch (error) {
                console.error('Failed to initialize audio for melody:', error);
                return;
            }
        }

        // Try to resume the context if it's suspended
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Resumed audio context');
            } catch (error) {
                console.error('Failed to resume audio context:', error);
                return;
            }
        }

        // Clear any existing melody
        if (this.currentMelodyInterval) {
            clearInterval(this.currentMelodyInterval);
            this.currentMelodyInterval = null;
        }

        // Jingle Bells melody pattern
        const melody = [
            // First line: "Jingle bells, jingle bells"
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 500 },
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 500 },

            // Second line: "Jingle all the way"
            { note: 'note_E4', duration: 250 },
            { note: 'note_G4', duration: 250 },
            { note: 'note_C4', duration: 250 },
            { note: 'note_D4', duration: 250 },
            { note: 'note_E4', duration: 1000 },

            // Third line: "Oh what fun it"
            { note: 'note_F4', duration: 250 },
            { note: 'note_F4', duration: 250 },
            { note: 'note_F4', duration: 250 },
            { note: 'note_F4', duration: 250 },
            { note: 'note_F4', duration: 250 },

            // Fourth line: "is to ride"
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 250 },
            { note: 'note_E4', duration: 250 },

            // Fifth line: "In a one-horse open sleigh"
            { note: 'note_G4', duration: 250 },
            { note: 'note_G4', duration: 250 },
            { note: 'note_F4', duration: 250 },
            { note: 'note_D4', duration: 250 },
            { note: 'note_C4', duration: 1000 }
        ];

        const playMelodyOnce = () => {
            let delay = 0;
            melody.forEach((note) => {
                setTimeout(() => {
                    this.playSound(note.note, 0.4); // Slightly increased volume
                }, delay);
                delay += note.duration;
            });
            return delay; // Return total duration
        };

        // Play immediately
        const totalDuration = playMelodyOnce();

        // Loop the melody
        this.melodyInterval = setInterval(() => {
            playMelodyOnce();
        }, totalDuration);

        // Store the interval ID in the class
        this.currentMelodyInterval = this.melodyInterval;
    }

    stopChristmasMelody() {
        if (this.currentMelodyInterval) {
            clearInterval(this.currentMelodyInterval);
            this.currentMelodyInterval = null;
        }
    }

    // Wrapper methods for specific sounds
    async playStartSound() {
        await this.playSound('start');
    }
    
    async playHitSound(intensity = 1) {
        await this.playSound('hit', intensity);
    }
    
    async playScoreSound() {
        await this.playSound('score');
    }
    
    async playBoostSound() {
        await this.playSound('boost');
    }
    
    async playShieldSound() {
        await this.playSound('shield');
    }
}

// Create and export a single instance
window.audioManager = new AudioManager();

// Start playing the Christmas melody when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit before starting the melody
    setTimeout(() => {
        window.audioManager.playChristmasMelody();
    }, 1000);
});
