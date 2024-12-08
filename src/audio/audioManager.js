// Audio management functionality
export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.audioContext = null;
        this.masterGainNode = null;
    }

    async initialize() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds.set(name, audioBuffer);
    }

    playSound(name, options = {}) {
        const buffer = this.sounds.get(name);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume || 1;

        source.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        source.start(0);
        return source;
    }

    setMasterVolume(value) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = value;
        }
    }
}
