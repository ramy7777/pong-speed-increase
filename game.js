// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1600;
canvas.height = 1000;

// Game constants
const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;
const winningScore = 11; // New winning score constant
const initialBallSpeed = 7; // New initial ball speed constant
const maxBoosts = 5; // New max boosts constant
const boostDuration = 1000; // New boost duration constant

// Room interface elements
const roomInterface = document.getElementById('roomInterface');
const roomInput = document.getElementById('roomInput');
const joinRoomBtn = document.getElementById('joinRoom');
const waitingMessage = document.getElementById('waitingMessage');
const startBtn = document.getElementById('startBtn');
const gameStatus = document.getElementById('gameStatus');
const timerDisplay = document.getElementById('timer');

// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreenBtn');

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

fullscreenBtn.addEventListener('click', toggleFullScreen);

// Game variables
let socket = null;
let isHost = false;
let roomId = null;
let playerId = null;
let gameStarted = false;
let gameLoop = null;
let gameTimer = null;
let timeRemaining = 90;
let lastBoostTime = 0;  // Track last boost time

// Game state
const game = {
    player: {
        y: canvas.height / 2 - paddleHeight / 2,
        score: 0
    },
    opponent: {
        y: canvas.height / 2 - paddleHeight / 2,
        score: 0,
        isBoostPressed: false,
        boostsRemaining: maxBoosts
    },
    ball: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        dx: 5,
        dy: 0,
        baseSpeed: 5,
        maxSpeed: 12,
        speedIncrease: 0.4,
        maxAngleRad: Math.PI / 3,
        boostSpeed: 15,
        isBoostActive: false,
        boostTimeout: null,
        originalSpeed: null
    },
    paddleSpeed: 8,
    boosts: {
        host: 5,
        client: 5
    }
};

// Control states
const controls = {
    upPressed: false,
    downPressed: false,
    boostPressed: false
};

// Room creation and joining
joinRoomBtn.addEventListener('click', async () => {
    const room = roomInput.value.trim();
    if (room) {
        try {
            // Ensure audio is initialized on user interaction
            if (window.audioManager) {
                console.log('Initializing audio before joining room...');
                await window.audioManager.initOnUserInteraction();
            }
            connectToServer(room);
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            connectToServer(room);
        }
    } else {
        alert('Please enter a room code');
    }
});

// WebSocket connection
function connectToServer(room) {
    // Get WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 
        'localhost:3000' : 
        window.location.host === 'example.com' ? 
        'wss://example.com' : 
        window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    socket = new WebSocket(wsUrl);
    roomId = room;

    socket.onopen = () => {
        console.log('Connected to server');
        socket.send(JSON.stringify({
            type: 'join',
            roomId: room
        }));
    };

    socket.onmessage = handleWebSocketMessage;

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        gameStatus.textContent = 'Connection error. Please try again.';
    };

    socket.onclose = () => {
        console.log('Disconnected from server');
        gameStatus.textContent = 'Connection lost. Please refresh the page.';
        resetGame();
        
        // Stop the Christmas melody if it's playing
        if (window.audioManager) {
            window.audioManager.stopChristmasMelody();
        }
    };
}

// WebSocket message handling
function handleWebSocketMessage(event) {
    const message = JSON.parse(event.data);
    console.log('Received message:', message.type);
    
    switch(message.type) {
        case 'joined':
            playerId = message.playerId;
            isHost = message.isHost;
            roomId = message.roomId;
            waitingMessage.classList.remove('hidden');
            roomInterface.classList.add('hidden');
            startBtn.classList.add('hidden');
            setupControls();
            break;
            
        case 'gameReady':
            waitingMessage.classList.add('hidden');
            if (isHost) {
                startBtn.classList.remove('hidden');
            }
            break;
            
        case 'gameStarted':
            startGame();
            break;
            
        case 'paddleMove':
            // Update opponent paddle position
            game.opponent.y = message.y;
            game.opponent.isBoostPressed = message.isBoostPressed;
            game.opponent.boostsRemaining = message.boostsRemaining;
            break;
            
        case 'ballUpdate':
            if (!isHost) {
                // Client receives ball position directly
                game.ball.x = message.x;
                game.ball.y = message.y;
            }
            break;
            
        case 'score':
            console.log('Score update received:', message);
            if (isHost) {
                game.player.score = message.playerScore;
                game.opponent.score = message.opponentScore;
            } else {
                game.player.score = message.opponentScore;
                game.opponent.score = message.playerScore;
            }
            break;
            
        case 'playerLeft':
            endGame();
            waitingMessage.textContent = 'Opponent left. Waiting for new player...';
            waitingMessage.classList.remove('hidden');
            break;
            
        case 'error':
            alert(message.message);
            break;
            
        case 'boost':
            // Update boost count for the player who used it
            if (message.player === 'host' || message.player === 'client') {
                game.boosts[message.player]--;
                updateBoostDisplay(message.player);
                
                // Only the host applies the boost effect
                if (isHost) {
                    applyBoostEffect();
                }
                
                // Play sound and vibrate for both players
                playSound('boost');
            }
            break;
            
        case 'playSound':
            // Resume audio context if it's suspended
            if (audioManager.audioContext.state === 'suspended') {
                audioManager.audioContext.resume().then(() => {
                    playSound(message.sound, message.intensity || 1);
                });
            } else {
                playSound(message.sound, message.intensity || 1);
            }
            break;
            
        case 'gameState':
            if (!isHost) {
                game.ball.x = canvas.width - message.ballX;
                game.ball.y = message.ballY;
                game.opponent.y = message.opponentY;
                game.player.score = message.playerScore;
                game.opponent.score = message.opponentScore;
                timeRemaining = message.timeLeft;
                
                // Update opponent boost state
                game.opponent.isBoostPressed = message.isBoostPressed;
                game.opponent.boostsRemaining = message.boostsRemaining;
                
                if (playerScoreElement && opponentScoreElement) {
                    playerScoreElement.textContent = game.player.score;
                    opponentScoreElement.textContent = game.opponent.score;
                }

                // Check for win condition on client side
                if (game.player.score >= winningScore || game.opponent.score >= winningScore) {
                    const winMessage = game.player.score > game.opponent.score ? 'You Win!' : 'Game Over!';
                    gameStatus.textContent = winMessage;
                    gameStatus.classList.remove('hidden');
                    endGame();
                }
            }
            break;
            
        case 'gameOver':
            // End the game for the client
            const winMessage = message.winner === 'client' ? 'You Win!' : 'Game Over!';
            gameStatus.textContent = winMessage;
            gameStatus.classList.remove('hidden');
            endGame();
            break;
            
        case 'room_joined':
            playerId = message.playerId;
            isHost = message.isHost;
            roomId = message.roomId;
            
            if (!isHost) {
                console.log('Client joined, attempting to play Christmas melody');
                // Try to play the melody with a slight delay to ensure audio is ready
                setTimeout(async () => {
                    if (window.audioManager) {
                        try {
                            await window.audioManager.initOnUserInteraction();
                            console.log('Playing Christmas melody...');
                            await window.audioManager.playChristmasMelody();
                        } catch (error) {
                            console.error('Failed to play Christmas melody:', error);
                        }
                    }
                }, 1000);
            }
            
            roomInterface.style.display = 'none';
            waitingMessage.style.display = isHost ? 'block' : 'none';
            break;
    }
}

// Helper function to play sounds and vibrate
function playSound(soundType, intensity = 1) {
    switch (soundType) {
        case 'hit':
            audioManager.playSound('hit', intensity);
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            break;
        case 'score':
            audioManager.playSound('score', intensity);
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
            break;
        case 'boost':
            audioManager.playSound('boost', intensity);
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            break;
        case 'gameOver':
            audioManager.playSound('start', 0.8); // We'll use the start sound for game over
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            break;
    }
}

// Control elements
const hostControls = document.getElementById('host-controls');
const clientControls = document.getElementById('client-controls');
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const clientUpBtn = document.getElementById('client-up-btn');
const clientDownBtn = document.getElementById('client-down-btn');
const hostBoostBtn = document.getElementById('host-boost');
const clientBoostBtn = document.getElementById('client-boost');
const hostBoostContainer = document.getElementById('host-boost-container');
const clientBoostContainer = document.getElementById('client-boost-container');

function setupControlButton(button, direction) {
    let moveInterval;

    const startMoving = (e) => {
        e.preventDefault();
        if (direction === 'up') {
            controls.upPressed = true;
        } else {
            controls.downPressed = true;
        }
        // Initial movement
        updatePaddlePosition();
        // Start continuous movement
        moveInterval = setInterval(updatePaddlePosition, 16);
        vibrate(50);
    };

    const stopMoving = (e) => {
        if (e) e.preventDefault();
        if (direction === 'up') {
            controls.upPressed = false;
        } else {
            controls.downPressed = false;
        }
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
    };

    // Touch events
    button.addEventListener('touchstart', startMoving);
    button.addEventListener('touchend', stopMoving);
    button.addEventListener('touchcancel', stopMoving);

    // Mouse events for testing
    button.addEventListener('mousedown', startMoving);
    button.addEventListener('mouseup', stopMoving);
    button.addEventListener('mouseleave', stopMoving);
}

function setupControls() {
    // Clear any existing controls
    if (isHost) {
        setupControlButton(upBtn, 'up');
        setupControlButton(downBtn, 'down');
        hostControls.classList.remove('hidden');
        clientControls.classList.add('hidden');
        hostBoostContainer.classList.remove('hidden');
        clientBoostContainer.classList.add('hidden');
    } else {
        setupControlButton(clientUpBtn, 'up');
        setupControlButton(clientDownBtn, 'down');
        clientControls.classList.remove('hidden');
        hostControls.classList.add('hidden');
        clientBoostContainer.classList.remove('hidden');
        hostBoostContainer.classList.add('hidden');
    }

    // Set up boost buttons
    hostBoostBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isHost && gameStarted && game.boosts.host > 0) {
            useBoost('host');
        }
    });

    hostBoostBtn.addEventListener('mousedown', (e) => {
        if (isHost && gameStarted && game.boosts.host > 0) {
            useBoost('host');
        }
    });

    clientBoostBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!isHost && gameStarted && game.boosts.client > 0) {
            useBoost('client');
        }
    });

    clientBoostBtn.addEventListener('mousedown', (e) => {
        if (!isHost && gameStarted && game.boosts.client > 0) {
            useBoost('client');
        }
    });
}

function useBoost(player) {
    if (game.boosts[player] > 0 && !game.ball.isBoostActive) {
        game.boosts[player]--;
        updateBoostDisplay(player);
        
        // Only the host applies the boost effect directly
        if (isHost) {
            applyBoostEffect();
        }
        
        playSound('boost');
        
        // Send boost message to other player
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'boost',
                player: player
            }));
        }
    }
}

function applyBoostEffect() {
    const ball = game.ball;
    
    // Store original speed and direction
    if (!ball.isBoostActive) {
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const directionX = ball.dx / currentSpeed;
        const directionY = ball.dy / currentSpeed;
        
        // Save original speed for restoration later
        ball.originalSpeed = currentSpeed;
        
        // Apply boost while maintaining direction
        ball.dx = directionX * ball.boostSpeed;
        ball.dy = directionY * ball.boostSpeed;
        ball.isBoostActive = true;

        // Clear any existing timeout
        if (ball.boostTimeout) {
            clearTimeout(ball.boostTimeout);
        }

        // Set timeout to restore original speed while maintaining direction
        ball.boostTimeout = setTimeout(() => {
            if (ball.isBoostActive) {
                const boostedSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                const currentDirX = ball.dx / boostedSpeed;
                const currentDirY = ball.dy / boostedSpeed;
                
                ball.dx = currentDirX * ball.originalSpeed;
                ball.dy = currentDirY * ball.originalSpeed;
                ball.isBoostActive = false;
                ball.originalSpeed = null;
            }
        }, 1000);
    }
}

function updateBoostDisplay(player) {
    console.log(`Updating boost display for ${player}. Current boost count:`, game.boosts[player]);
    const boostBtn = document.getElementById(`${player}-boost`);
    if (boostBtn) {
        const boostCount = boostBtn.querySelector('.boost-count');
        if (boostCount) {
            boostCount.textContent = game.boosts[player];
            console.log(`Updated ${player} boost display to:`, boostCount.textContent);
            
            if (game.boosts[player] === 0) {
                boostBtn.classList.add('boost-disabled');
            } else {
                boostBtn.classList.remove('boost-disabled');
            }
        } else {
            console.log(`Could not find boost count element for ${player}`);
        }
    } else {
        console.log(`Could not find boost button for ${player}`);
    }
}

function initGame() {
    console.log('Initializing game...');
    
    // Show appropriate controls
    if (isHost) {
        hostControls.classList.remove('hidden');
        clientControls.classList.add('hidden');
        hostBoostContainer.classList.remove('hidden');
        clientBoostContainer.classList.add('hidden');
    } else {
        clientControls.classList.remove('hidden');
        hostControls.classList.add('hidden');
        clientBoostContainer.classList.remove('hidden');
        hostBoostContainer.classList.add('hidden');
    }
    
    // Reset timer
    timeRemaining = 90;
    updateTimerDisplay();
    
    // Start game timer
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    gameTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            endGame();
        }
    }, 1000);
}

function startGame() {
    console.log('Starting game...');
    
    gameStarted = true;
    startBtn.classList.add('hidden');
    gameStatus.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    
    // Play start sound
    audioManager.playStartSound();
    
    // Reset all game state first
    resetGame();
    
    // Initialize UI and timers
    initGame();
    
    // Start the game loop
    startGameLoop();
}

function resetGame() {
    console.log('Resetting game...');
    console.log('Previous boost counts:', game.boosts);
    
    // Reset positions
    game.player.y = canvas.height / 2 - paddleHeight / 2;
    game.opponent.y = canvas.height / 2 - paddleHeight / 2;
    
    // Reset scores
    game.player.score = 0;
    game.opponent.score = 0;
    
    // Reset ball
    game.ball.baseSpeed = initialBallSpeed;
    resetBall();
    
    // Reset boost counts
    game.boosts.host = maxBoosts;
    game.boosts.client = maxBoosts;
    console.log('Reset boost counts to:', game.boosts);
    
    updateBoostDisplay('host');
    updateBoostDisplay('client');
    
    timeRemaining = 90;

    // Update score display if elements exist
    const playerScoreElement = document.getElementById('playerScore');
    const opponentScoreElement = document.getElementById('opponentScore');
    
    if (playerScoreElement) {
        playerScoreElement.textContent = game.player.score;
    }
    if (opponentScoreElement) {
        opponentScoreElement.textContent = game.opponent.score;
    }

    // Reset any active boost effects
    if (game.ball.boostTimeout) {
        clearTimeout(game.ball.boostTimeout);
    }
    game.ball.isBoostActive = false;
    game.ball.originalSpeed = null;
    
    console.log('Game reset complete. Final boost counts:', game.boosts);
}

function endGame() {
    gameStarted = false;
    clearInterval(gameLoop);
    clearInterval(gameTimer);
    
    // Stop the Christmas melody if it's playing
    if (window.audioManager) {
        window.audioManager.stopChristmasMelody();
    }
    
    playSound('gameOver');
    // Send game over sound to other player
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'playSound',
            sound: 'gameOver'
        }));
    }
    
    // Show final score with proper message
    if (game.player.score >= winningScore || game.opponent.score >= winningScore) {
        const message = isHost ? 
            (game.player.score > game.opponent.score ? 'You Win!' : 'Game Over!') :
            (game.opponent.score > game.player.score ? 'You Win!' : 'Game Over!');
        gameStatus.textContent = message;
        gameStatus.classList.remove('hidden');
    }
    
    // Only show start button for host
    if (isHost) {
        startBtn.classList.remove('hidden');
    }
    timerDisplay.classList.add('hidden');
    
    // Hide controls
    if (isHost) {
        hostControls.classList.add('hidden');
    } else {
        clientControls.classList.add('hidden');
    }
    
    // Reset boost counts
    game.boosts.host = maxBoosts;
    game.boosts.client = maxBoosts;
    updateBoostDisplay('host');
    updateBoostDisplay('client');
}

function updatePaddlePosition() {
    let newY = game.player.y;
    
    if (controls.upPressed) {
        newY = Math.max(0, game.player.y - game.paddleSpeed);
    }
    if (controls.downPressed) {
        newY = Math.min(canvas.height - paddleHeight, game.player.y + game.paddleSpeed);
    }
    
    if (newY !== game.player.y) {
        game.player.y = newY;
        // Send paddle position to other player
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'paddleMove',
                y: game.player.y,
                isBoostPressed: controls.boostPressed,
                boostsRemaining: game.boosts.host
            }));
        }
    }
}

function updateClient() {
    if (!gameStarted) return;

    // Only handle client paddle movement here
    if (controls.upPressed && game.player.y > 0) {
        game.player.y -= game.paddleSpeed;
    }
    if (controls.downPressed && game.player.y + paddleHeight < canvas.height) {
        game.player.y += game.paddleSpeed;
    }

    // Handle boost for client
    if (controls.boostPressed && game.boosts.client > 0) {
        game.paddleSpeed = boostSpeed;
        game.boostTimeLeft = Math.max(0, game.boostTimeLeft - (1000 / 60));

        if (game.boostTimeLeft <= 0) {
            controls.boostPressed = false;
            game.paddleSpeed = normalSpeed;
            game.boosts.client--;
            updateBoostDisplay('client');
        }
    }

    // Ball collision sounds for client
    if (game.ball.y <= 0 || game.ball.y + ballSize >= canvas.height) {
        vibrate(50);
        audioManager.playHitSound();
    }

    if (game.ball.x <= paddleWidth &&
        game.ball.y + ballSize >= game.player.y &&
        game.ball.y <= game.player.y + paddleHeight) {
        vibrate(100);
        audioManager.playHitSound();
    }

    if (game.ball.x + ballSize >= canvas.width - paddleWidth &&
        game.ball.y + ballSize >= game.opponent.y &&
        game.ball.y <= game.opponent.y + paddleHeight) {
        vibrate(100);
        audioManager.playHitSound();
    }

    if (game.ball.x + ballSize >= canvas.width || game.ball.x <= 0) {
        vibrate(200);
        audioManager.playScoreSound();
    }

    // Send paddle position to host
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'paddleMove',
            y: game.player.y,
            isBoostPressed: controls.boostPressed,
            boostsRemaining: game.boosts.client
        }));
    }
}

function update() {
    if (!gameStarted) return;

    if (isHost) {
        // Host paddle movement
        if (controls.upPressed && game.player.y > 0) {
            game.player.y -= game.paddleSpeed;
        }
        if (controls.downPressed && game.player.y + paddleHeight < canvas.height) {
            game.player.y += game.paddleSpeed;
        }

        // Handle boost for host
        if (controls.boostPressed && game.boosts.host > 0) {
            game.paddleSpeed = boostSpeed;
            game.boostTimeLeft = Math.max(0, game.boostTimeLeft - (1000 / 60));

            if (game.boostTimeLeft <= 0) {
                controls.boostPressed = false;
                game.paddleSpeed = normalSpeed;
                game.boosts.host--;
                updateBoostDisplay('host');
            }
        }

        updateBall();

        // Send game state to client
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'gameState',
                ballX: game.ball.x,
                ballY: game.ball.y,
                opponentY: game.player.y,
                playerScore: game.player.score,
                opponentScore: game.opponent.score,
                timeLeft: timeRemaining,
                isBoostPressed: controls.boostPressed,
                boostsRemaining: game.boosts.host
            }));
        }
    } else {
        updateClient();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = 'white';
    if (isHost) {
        // Host: draw player paddle on right
        ctx.fillRect(canvas.width - paddleWidth, game.player.y, paddleWidth, paddleHeight);
        // Host: draw opponent (client) paddle on left
        ctx.fillRect(0, game.opponent.y, paddleWidth, paddleHeight);
    } else {
        // Client: draw player paddle on left
        ctx.fillRect(0, game.player.y, paddleWidth, paddleHeight);
        // Client: draw opponent (host) paddle on right
        ctx.fillRect(canvas.width - paddleWidth, game.opponent.y, paddleWidth, paddleHeight);
    }

    // Draw ball only when game is started
    if (gameStarted) {
        ctx.fillRect(game.ball.x, game.ball.y, ballSize, ballSize);
    }

    // Always draw scores with bigger text
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    
    // Draw scores based on player position (host on right, client on left)
    const leftScore = isHost ? 
        game.opponent.score : 
        game.player.score;
    const rightScore = isHost ? 
        game.player.score : 
        game.opponent.score;
    
    // Draw left score
    ctx.fillText(leftScore.toString(), canvas.width / 4, 60);
    // Draw right score
    ctx.fillText(rightScore.toString(), 3 * canvas.width / 4, 60);
}

function updateBall() {
    if (!isHost || !gameStarted) return;

    game.ball.x += game.ball.dx;
    game.ball.y += game.ball.dy;

    // Ball collision with top and bottom
    if (game.ball.y <= 0 || game.ball.y + ballSize >= canvas.height) {
        game.ball.dy = -game.ball.dy;
        playSound('hit', 0.5);
        // Send hit sound to client
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'playSound',
                sound: 'hit',
                intensity: 0.5
            }));
        }
    }

    // Ball collision with paddles
    // Host paddle (right side)
    if (game.ball.x + ballSize >= canvas.width - paddleWidth &&
        game.ball.y + ballSize >= game.player.y &&
        game.ball.y <= game.player.y + paddleHeight) {
        
        // Increase speed but cap it at maxSpeed
        game.ball.baseSpeed = Math.min(game.ball.baseSpeed + game.ball.speedIncrease, game.ball.maxSpeed);
        
        // Calculate new velocity
        game.ball.dx = -Math.abs(game.ball.baseSpeed);
        
        // Add spin based on where the ball hits the paddle
        const relativeIntersectY = (game.player.y + (paddleHeight/2)) - game.ball.y;
        const normalizedIntersectY = relativeIntersectY / (paddleHeight/2);
        game.ball.dy = -normalizedIntersectY * game.ball.baseSpeed;
        
        playSound('hit', 1);
        // Send hit sound to client
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'playSound',
                sound: 'hit',
                intensity: 1
            }));
        }
    }
    // Client paddle (left side)
    else if (game.ball.x <= paddleWidth &&
        game.ball.y + ballSize >= game.opponent.y &&
        game.ball.y <= game.opponent.y + paddleHeight) {
        
        // Increase speed but cap it at maxSpeed
        game.ball.baseSpeed = Math.min(game.ball.baseSpeed + game.ball.speedIncrease, game.ball.maxSpeed);
        
        // Calculate new velocity
        game.ball.dx = Math.abs(game.ball.baseSpeed);
        
        // Add spin based on where the ball hits the paddle
        const relativeIntersectY = (game.opponent.y + (paddleHeight/2)) - game.ball.y;
        const normalizedIntersectY = relativeIntersectY / (paddleHeight/2);
        game.ball.dy = -normalizedIntersectY * game.ball.baseSpeed;
        
        playSound('hit', 1);
        // Send hit sound to client
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'playSound',
                sound: 'hit',
                intensity: 1
            }));
        }
    }

    // Send ball position to client
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'ballUpdate',
            x: game.ball.x,
            y: game.ball.y
        }));
    }

    // Scoring
    const playerScoreElement = document.getElementById('playerScore');
    const opponentScoreElement = document.getElementById('opponentScore');

    if (game.ball.x + ballSize >= canvas.width) { // Client scores
        game.opponent.score++;
        if (opponentScoreElement) {
            opponentScoreElement.textContent = game.opponent.score;
        }
        resetBall();
        vibrate(200);
        audioManager.playScoreSound();
        // Send score sound to client
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'playSound',
                sound: 'score'
            }));
        }
        // Check for win condition
        if (game.opponent.score >= winningScore) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'gameOver',
                    winner: 'client'
                }));
            }
            const message = 'Game Over!';
            gameStatus.textContent = message;
            gameStatus.classList.remove('hidden');
            endGame();
        }
    } else if (game.ball.x <= 0) { // Host scores
        game.player.score++;
        if (playerScoreElement) {
            playerScoreElement.textContent = game.player.score;
        }
        resetBall();
        vibrate(200);
        audioManager.playScoreSound();
        // Send score sound to client
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'playSound',
                sound: 'score'
            }));
        }
        // Check for win condition
        if (game.player.score >= winningScore) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'gameOver',
                    winner: 'host'
                }));
            }
            const message = 'You Win!';
            gameStatus.textContent = message;
            gameStatus.classList.remove('hidden');
            endGame();
        }
    }

    // Send score update
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'score',
            playerScore: game.player.score,
            opponentScore: game.opponent.score
        }));
    }
}

function resetBall() {
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    game.ball.baseSpeed = initialBallSpeed;
    game.ball.dx = isHost ? -game.ball.baseSpeed : game.ball.baseSpeed;
    game.ball.dy = 0;
}

function sendPaddlePosition() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'paddle',
            playerId: playerId,
            position: game.player.y
        }));
    }
}

function sendBallUpdate() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'ballUpdate',
            x: game.ball.x,
            y: game.ball.y
        }));
    }
}

function sendScore() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('Sending score update:', {
            playerScore: game.player.score,
            opponentScore: game.opponent.score
        });
        socket.send(JSON.stringify({
            type: 'score',
            playerScore: game.player.score,
            opponentScore: game.opponent.score
        }));
    }
}

function startTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    gameTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function vibrate(duration = 50) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Initialize continuous draw loop for UI
setInterval(draw, 16);

function startGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    gameLoop = setInterval(() => {
        update();
        draw();
    }, 16); // approximately 60fps
}

// Handle start button click
startBtn.addEventListener('click', () => {
    if (isHost) {
        // Notify other player that game is starting
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'gameStarted'
            }));
            startGame();
        }
    }
});
