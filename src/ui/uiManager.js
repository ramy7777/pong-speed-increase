export class UIManager {
    constructor() {
        this.elements = new Map();
        this.initializeUI();
    }

    initializeUI() {
        // Create and store references to UI elements
        this.elements.set('scoreBoard', document.getElementById('scoreboard'));
        this.elements.set('playerList', document.getElementById('player-list'));
        this.elements.set('boostIndicator', document.getElementById('boost-indicator'));
        this.elements.set('pingDisplay', document.getElementById('ping'));
        
        // Initialize game over screen
        this.createGameOverScreen();
        
        // Initialize any additional UI elements that might be needed
        this.createBoostCooldownIndicator();
    }

    createBoostCooldownIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'boost-cooldown';
        indicator.className = 'boost-cooldown';
        document.body.appendChild(indicator);
        this.elements.set('boostCooldown', indicator);
    }

    createGameOverScreen() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        gameOverScreen.className = 'game-over-screen hidden';
        
        gameOverScreen.innerHTML = `
            <div class="game-over-content">
                <h1>Game Over!</h1>
                <div class="final-scores"></div>
                <div id="host-controls" class="hidden">
                    <button id="restart-game" class="restart-button">Start New Game</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(gameOverScreen);
        this.elements.set('gameOverScreen', gameOverScreen);
        this.elements.set('finalScores', gameOverScreen.querySelector('.final-scores'));
        this.elements.set('hostControls', gameOverScreen.querySelector('#host-controls'));
        this.elements.set('restartButton', gameOverScreen.querySelector('#restart-game'));
    }

    updateScoreboard(scores) {
        const scoreBoard = this.elements.get('scoreBoard');
        if (!scoreBoard) return;

        // Sort scores by value in descending order
        const sortedScores = [...scores].sort((a, b) => b.score - a.score);

        // Clear existing scores
        scoreBoard.innerHTML = '';

        // Add header
        const header = document.createElement('div');
        header.className = 'scoreboard-header';
        header.innerHTML = '<span>Player</span><span>Score</span>';
        scoreBoard.appendChild(header);

        // Add each score
        sortedScores.forEach(({playerId, score}) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-entry';
            scoreElement.innerHTML = `
                <span class="player-id">${playerId}</span>
                <span class="player-score">${score}</span>
            `;
            scoreBoard.appendChild(scoreElement);
        });
    }

    updatePlayerList(players) {
        const playerList = this.elements.get('playerList');
        if (!playerList) return;

        playerList.innerHTML = '';
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-entry';
            playerElement.textContent = `Player ${player.id}`;
            if (player.isLocal) {
                playerElement.classList.add('local-player');
            }
            playerList.appendChild(playerElement);
        });
    }

    updateBoostStatus(isActive, cooldown) {
        const indicator = this.elements.get('boostIndicator');
        const cooldownIndicator = this.elements.get('boostCooldown');
        
        if (indicator) {
            indicator.className = isActive ? 'boost active' : 'boost';
        }

        if (cooldownIndicator) {
            cooldownIndicator.style.display = cooldown ? 'block' : 'none';
            if (cooldown) {
                cooldownIndicator.style.animation = 'cooldown 10s linear';
            }
        }
    }

    updatePing(ping) {
        const pingDisplay = this.elements.get('pingDisplay');
        if (pingDisplay) {
            pingDisplay.textContent = `Ping: ${ping}ms`;
        }
    }

    showMessage(message, type = 'info', duration = 3000) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `game-message ${type}`;
        messageContainer.textContent = message;
        
        document.body.appendChild(messageContainer);
        
        setTimeout(() => {
            messageContainer.remove();
        }, duration);
    }

    // Add any UI animations or transitions
    animateScore(playerId, amount) {
        const scoreElement = document.querySelector(`[data-player-id="${playerId}"] .player-score`);
        if (scoreElement) {
            scoreElement.classList.add('score-updated');
            setTimeout(() => scoreElement.classList.remove('score-updated'), 500);
        }
    }

    showGameOver(scores, isHost) {
        const gameOverScreen = this.elements.get('gameOverScreen');
        const finalScores = this.elements.get('finalScores');
        const hostControls = this.elements.get('hostControls');
        
        if (!gameOverScreen || !finalScores) return;

        // Sort scores by value in descending order
        const sortedScores = [...scores].sort((a, b) => b.score - a.score);

        // Display final scores
        finalScores.innerHTML = '<h2>Final Scores</h2>';
        sortedScores.forEach(({playerId, score}, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'final-score-entry';
            scoreElement.innerHTML = `
                <span class="position">${index + 1}</span>
                <span class="player-id">${playerId}</span>
                <span class="final-score">${score}</span>
            `;
            finalScores.appendChild(scoreElement);
        });

        // Show/hide host controls
        if (hostControls) {
            hostControls.className = isHost ? 'host-controls' : 'host-controls hidden';
        }

        // Show the game over screen with animation
        gameOverScreen.className = 'game-over-screen';
    }

    hideGameOver() {
        const gameOverScreen = this.elements.get('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.className = 'game-over-screen hidden';
        }
    }

    onRestartClick(callback) {
        const restartButton = this.elements.get('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', callback);
        }
    }
}
