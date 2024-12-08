export class ScoreSystem {
    constructor() {
        this.scores = new Map(); // Player ID -> Score
        this.callbacks = new Set(); // Update callbacks
    }

    addPlayer(playerId) {
        this.scores.set(playerId, 0);
        this.notifyListeners();
    }

    removePlayer(playerId) {
        this.scores.delete(playerId);
        this.notifyListeners();
    }

    updateScore(playerId, newScore) {
        this.scores.set(playerId, newScore);
        this.notifyListeners();
    }

    incrementScore(playerId, amount = 1) {
        const currentScore = this.getScore(playerId);
        this.scores.set(playerId, currentScore + amount);
        this.notifyListeners();
    }

    getScore(playerId) {
        return this.scores.get(playerId) || 0;
    }

    getAllScores() {
        return Array.from(this.scores.entries()).map(([id, score]) => ({
            playerId: id,
            score: score
        }));
    }

    getTopScores(limit = 10) {
        return this.getAllScores()
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // Observer pattern for UI updates
    addUpdateListener(callback) {
        this.callbacks.add(callback);
    }

    removeUpdateListener(callback) {
        this.callbacks.delete(callback);
    }

    notifyListeners() {
        for (const callback of this.callbacks) {
            callback(this.getAllScores());
        }
    }

    reset() {
        this.scores.clear();
        this.notifyListeners();
    }
}
