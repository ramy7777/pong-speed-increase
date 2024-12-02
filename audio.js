class AudioManager {
    constructor() {
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.5; // Set master volume to 50%
    }

    playStartSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Rising pitch effect
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);

        // Volume envelope
        gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playHitSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Sharp, percussive sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    playScoreSound() {
        // Create two oscillators for a richer sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // First oscillator: high-pitched success sound
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.1);

        // Second oscillator: supporting harmony
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.1);

        // Volume envelope
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.2);
        oscillator2.stop(this.audioContext.currentTime + 0.2);
    }

    playBoostSound() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // First oscillator: whoosh effect
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(110, this.audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.15);

        // Second oscillator: power-up effect
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.15);
        oscillator2.stop(this.audioContext.currentTime + 0.15);
    }

    playGameOverSound() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // First oscillator: descending tone
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.5);

        // Second oscillator: low rumble
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.5);
        oscillator2.stop(this.audioContext.currentTime + 0.5);
    }
}

// Create and export a single instance
window.audioManager = new AudioManager();
