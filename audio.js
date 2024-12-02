class AudioManager {
    constructor() {
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.5; // Set master volume to 50%
        
        // Add background music flag
        this.isPlayingMusic = false;
        this.currentNoteIndex = 0;
        this.musicInterval = null;
    }

    playStartSound() {
        // Bell-like sound for game start
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Sleigh bell effect
        oscillator1.type = 'sine';
        oscillator2.type = 'triangle';
        
        oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(1100, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }

    playHitSound() {
        // Tinkling bell sound for hits
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator1.type = 'sine';
        oscillator2.type = 'triangle';
        
        // High-pitched bell sound
        oscillator1.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(1500, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.1);
        oscillator2.stop(this.audioContext.currentTime + 0.1);
    }

    playScoreSound() {
        // Cheerful bells for scoring
        const oscillators = [];
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);

        // Create a chord of bells
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
        frequencies.forEach(freq => {
            const osc = this.audioContext.createOscillator();
            osc.connect(gainNode);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillators.push(osc);
        });

        // Bell-like envelope
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillators.forEach(osc => {
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.5);
        });
    }

    playBoostSound() {
        // Magical sleigh boost sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const oscillator3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        oscillator3.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Magical rising effect
        oscillator1.type = 'sine';
        oscillator2.type = 'triangle';
        oscillator3.type = 'sine';

        // Ascending magical sound
        oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
        
        oscillator2.frequency.setValueAtTime(554.37, this.audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(1108.73, this.audioContext.currentTime + 0.3);
        
        oscillator3.frequency.setValueAtTime(659.25, this.audioContext.currentTime);
        oscillator3.frequency.exponentialRampToValueAtTime(1318.51, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator1.start();
        oscillator2.start();
        oscillator3.start();
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
        oscillator3.stop(this.audioContext.currentTime + 0.3);
    }

    playGameOverSound() {
        // Festive game over sound with descending bells
        const oscillators = [];
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);

        // Create a descending bell sequence
        const frequencies = [
            880, // A5
            783.99, // G5
            659.25, // E5
            523.25  // C5
        ];

        frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.audioContext.createGain();
            
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + (index * 0.15));
            
            // Individual note envelope
            oscGain.gain.setValueAtTime(0, this.audioContext.currentTime + (index * 0.15));
            oscGain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + (index * 0.15) + 0.05);
            oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + (index * 0.15) + 0.3);
            
            oscillators.push(osc);
        });

        // Overall volume envelope
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

        // Start and stop each oscillator with proper timing
        oscillators.forEach((osc, index) => {
            osc.start(this.audioContext.currentTime + (index * 0.15));
            osc.stop(this.audioContext.currentTime + (index * 0.15) + 0.3);
        });
    }

    playChristmasMelody() {
        if (this.isPlayingMusic) return;
        
        // Jingle Bells melody (full first verse)
        const notes = [
            // Jingle Bells, Jingle Bells
            { freq: 349.23, duration: 300 }, // F
            { freq: 349.23, duration: 300 }, // F
            { freq: 349.23, duration: 600 }, // F
            { freq: 349.23, duration: 300 }, // F
            { freq: 349.23, duration: 300 }, // F
            { freq: 349.23, duration: 600 }, // F
            
            // Jingle all the way
            { freq: 349.23, duration: 300 }, // F
            { freq: 392.00, duration: 300 }, // G
            { freq: 293.66, duration: 300 }, // D
            { freq: 329.63, duration: 300 }, // E
            { freq: 349.23, duration: 900 }, // F
            
            // Short pause
            { freq: 0, duration: 300 },
            
            // Oh what fun it
            { freq: 392.00, duration: 300 }, // G
            { freq: 392.00, duration: 300 }, // G
            { freq: 392.00, duration: 450 }, // G
            { freq: 392.00, duration: 150 }, // G
            
            // is to ride
            { freq: 392.00, duration: 300 }, // G
            { freq: 349.23, duration: 300 }, // F
            { freq: 349.23, duration: 300 }, // F
            
            // in a one-horse
            { freq: 349.23, duration: 300 }, // F
            { freq: 349.23, duration: 300 }, // F
            { freq: 329.63, duration: 300 }, // E
            { freq: 329.63, duration: 300 }, // E
            
            // open sleigh
            { freq: 392.00, duration: 300 }, // G
            { freq: 440.00, duration: 300 }, // A
            { freq: 349.23, duration: 600 }, // F
            
            // Short pause before loop
            { freq: 0, duration: 600 }
        ];

        this.isPlayingMusic = true;
        this.currentNoteIndex = 0;

        const playNote = () => {
            if (!this.isPlayingMusic) {
                return;
            }

            if (this.currentNoteIndex >= notes.length) {
                this.currentNoteIndex = 0; // Loop the melody
            }

            const note = notes[this.currentNoteIndex];
            
            if (note.freq > 0) { // Only create oscillator if it's not a pause
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime); // Reduced volume
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + (note.duration / 1000));

                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + (note.duration / 1000));
            }

            this.currentNoteIndex++;
            setTimeout(playNote, note.duration);
        };

        playNote();
    }

    stopChristmasMelody() {
        this.isPlayingMusic = false;
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
