// Boost power-up functionality
export class Boost {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.cooldown = false;
        this.cooldownTime = 10000; // 10 seconds cooldown
        this.duration = 3000; // 3 seconds boost duration
    }

    activate() {
        if (this.cooldown || this.active) return false;
        
        this.active = true;
        setTimeout(() => {
            this.active = false;
            this.cooldown = true;
            setTimeout(() => {
                this.cooldown = false;
            }, this.cooldownTime);
        }, this.duration);
        
        return true;
    }

    isActive() {
        return this.active;
    }

    isCooldown() {
        return this.cooldown;
    }
}
