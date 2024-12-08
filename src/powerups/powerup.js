// Base class for all power-ups
export class PowerUp {
    constructor(game, options = {}) {
        this.game = game;
        this.active = false;
        this.cooldown = false;
        this.cooldownTime = options.cooldownTime || 5000;
        this.duration = options.duration || 3000;
    }

    activate() {
        if (this.cooldown || this.active) return false;
        
        this.active = true;
        this.onActivate();
        
        setTimeout(() => {
            this.active = false;
            this.onDeactivate();
            this.cooldown = true;
            setTimeout(() => {
                this.cooldown = false;
                this.onCooldownEnd();
            }, this.cooldownTime);
        }, this.duration);
        
        return true;
    }

    // Override these methods in child classes
    onActivate() {}
    onDeactivate() {}
    onCooldownEnd() {}

    isActive() {
        return this.active;
    }

    isCooldown() {
        return this.cooldown;
    }
}
