# Rocket Powerup Synchronization Documentation

## Overview
The rocket powerup is a synchronized game element that appears at random positions on the game board. This document details the implementation of its synchronization mechanism between host and client.

## Technical Implementation

### 1. Core Variables
```javascript
// Timing variables
let nextRocketSpawnTime = 0;
let rocketSeed = 0;
const middleButtonSpawnInterval = 15000;  // 15 seconds between spawns

// Game state
game.middleButton = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 80,      // Doubled size for better visibility
    height: 120,    // Doubled size for better visibility
    visible: false,
    rotation: 0
};
```

### 2. Deterministic Random Generation
```javascript
function generateRandomFromSeed(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
```

### 3. Spawn Logic
```javascript
function spawnMiddleButton() {
    if (!gameStarted) return;
    
    const currentTime = Date.now();
    
    if (isHost) {
        if (currentTime >= nextRocketSpawnTime) {
            // Generate new position using seeded random
            const margin = 100;
            const randomX = generateRandomFromSeed(rocketSeed++);
            const randomY = generateRandomFromSeed(rocketSeed++);
            const randomRotation = generateRandomFromSeed(rocketSeed++) * Math.PI * 2;
            
            // Calculate position within margins
            game.middleButton.x = margin + randomX * (canvas.width - 2 * margin);
            game.middleButton.y = margin + randomY * (canvas.height - 2 * margin);
            game.middleButton.rotation = randomRotation;
            game.middleButton.visible = true;
            
            // Set next spawn time
            nextRocketSpawnTime = currentTime + middleButtonSpawnInterval;
            
            // Send spawn data to client
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'middleButtonSpawn',
                    visible: true,
                    x: game.middleButton.x,
                    y: game.middleButton.y,
                    rotation: game.middleButton.rotation,
                    nextSpawnTime: nextRocketSpawnTime,
                    seed: rocketSeed
                }));
            }
            
            // Auto-hide after 7 seconds
            setTimeout(() => {
                game.middleButton.visible = false;
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'middleButtonSpawn',
                        visible: false
                    }));
                }
            }, 7000);
        }
    }
}
```

### 4. WebSocket Message Handling
```javascript
case 'middleButtonSpawn':
    game.middleButton.visible = message.visible;
    if (message.visible) {
        game.middleButton.x = message.x;
        game.middleButton.y = message.y;
        game.middleButton.rotation = message.rotation;
        nextRocketSpawnTime = message.nextSpawnTime;
        rocketSeed = message.seed;
    }
    break;
```

### 5. Reset Handling
```javascript
// In resetGame function
game.middleButton.visible = false;
nextRocketSpawnTime = Date.now() + middleButtonSpawnInterval;
rocketSeed = Math.floor(Math.random() * 10000); // New random seed

// Sync reset state with client
if (isHost && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: 'resetState',
        middleButton: {
            visible: false,
            x: game.middleButton.x,
            y: game.middleButton.y,
            rotation: game.middleButton.rotation
        },
        nextRocketSpawnTime: nextRocketSpawnTime,
        rocketSeed: rocketSeed
    }));
}
```

## Key Features
1. **Deterministic Spawning**: Uses seeded random generation for consistent positions
2. **Host Control**: Host manages spawn timing and sends updates to client
3. **Safe Margins**: Spawns rockets with 100px margin from edges
4. **Timed Visibility**: Visible for 7 seconds, spawns every 15 seconds
5. **Synchronized State**: Full state synchronization including position, rotation, and timing
6. **Reset Handling**: Proper state reset and synchronization during game restarts

## Best Practices
1. Always use seeded random for deterministic behavior
2. Let host control all random aspects
3. Include timing information in sync messages
4. Handle edge cases (game reset, disconnection)
5. Use margins to prevent spawning too close to edges
6. Implement proper cleanup

## Common Issues and Solutions
1. **Desynchronization**: Fixed by using seeded random and host control
2. **Edge Spawning**: Solved with margin calculations
3. **Timing Issues**: Resolved by sending nextSpawnTime in messages
4. **Reset Problems**: Handled by proper reset state synchronization

This implementation ensures consistent behavior across all clients while maintaining game balance and playability.
