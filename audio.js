class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = {};
        this.isInitialized = false;
        this.soundConfigs = [
            { name: 'hit', frequency: 440, duration: 0.1 },    // A4 note
            { name: 'score', frequency: 880, duration: 0.2 },  // A5 note
            { name: 'boost', frequency: 660, duration: 0.15 }, // E5 note
            { name: 'start', frequency: 550, duration: 0.3 }   // C#5 note
        ];
        
        // Don't create AudioContext in constructor
        // Wait for user interaction
        this.bindUserInteractionListeners();
    }
    
    async initAudioContext() {
        if (this.audioContext) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;
            
            await this.generateSounds();
            console.log('AudioContext initialized and sounds generated');
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        }
    }
    
    bindUserInteractionListeners() {
        const initializeAudio = async () => {
            try {
                await this.initAudioContext();
                
                // Remove listeners after successful initialization
                ['click', 'touchstart', 'keydown'].forEach(event => {
                    document.removeEventListener(event, initializeAudio);
                });
            } catch (error) {
                console.error('Failed to initialize audio:', error);
            }
        };
        
        // Add listeners for user interaction
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, initializeAudio, { once: true });
        });
    }
    
    async generateSounds() {
        if (this.isInitialized) return;
        
        try {
            this.soundConfigs.forEach(config => {
                const sampleRate = this.audioContext.sampleRate;
                const length = config.duration * sampleRate;
                const buffer = this.audioContext.createBuffer(1, length, sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < length; i++) {
                    // Generate a simple sine wave
                    const t = i / sampleRate;
                    data[i] = Math.sin(2 * Math.PI * config.frequency * t) *
                             // Add an envelope to avoid clicks
                             Math.exp(-3 * t / config.duration);
                }
                
                this.sounds[config.name] = buffer;
                console.log(`Generated sound: ${config.name}`);
            });
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to generate sounds:', error);
        }
    }
    
    async playSound(soundName, volume = 1, pitch = 1) {
        // Initialize AudioContext if it hasn't been initialized yet
        if (!this.audioContext) {
            console.warn('AudioContext not initialized. Waiting for user interaction.');
            return;
        }
        
        // Resume AudioContext if it's suspended
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.error('Failed to resume AudioContext:', error);
                return;
            }
        }
        
        // Check if sound is available
        const soundBuffer = this.sounds[soundName];
        if (!soundBuffer) {
            console.warn(`Sound ${soundName} not generated. Attempting to generate.`);
            await this.generateSounds();
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
        } catch (error) {
            console.error('Error playing sound:', error);
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
}

// Create and export a single instance
window.audioManager = new AudioManager();

// Start playing the Christmas melody when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit before starting the melody
    setTimeout(() => {
        // Removed playChristmasMelody call as it's not defined in the updated AudioManager
    }, 1000);
});
