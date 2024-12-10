# Pong Speed Increase

A multiplayer Pong game with increasing ball speed mechanics, built with HTML5 Canvas and WebSocket.

## Features
- Real-time multiplayer gameplay
- Ball speed increases with each paddle hit
- 90-second game timer
- Mobile-friendly controls
- Fullscreen support

## Local Development
1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open http://localhost:3000 in your browser

## Deployment
This game can be deployed to Render.com:

1. Fork/clone this repository
2. Create a new Web Service on Render
3. Connect your repository
4. The deployment will automatically use the settings in `render.yaml`

## How to Play
1. Open the game URL
2. Enter a room code
3. Share the room code with another player
4. Host player can start the game
5. Use the on-screen buttons to move paddles
6. Ball speed increases with each hit
7. Game ends after 90 seconds

## Powerup Synchronization Mechanism

### Rocket Powerup Implementation
The rocket powerup uses a robust synchronization mechanism that ensures consistent behavior between host and client. This can be used as a template for implementing future powerups.

Key Components:
1. **Deterministic Spawning**:
   - Uses a seeded random number generator to ensure identical spawn positions
   - Seed is synchronized between host and client
   - Host controls spawn timing and sends updates to client
   - Margin of 100px from edges for spawn positions

2. **State Management**:
   ```javascript
   // State variables
   let nextRocketSpawnTime = 0;  // Next spawn timestamp
   let rocketSeed = 0;           // Seed for random generation
   const middleButtonSpawnInterval = 15000; // 15 seconds between spawns
   
   // Rocket properties in game state
   game.middleButton = {
       x: canvas.width / 2,
       y: canvas.height / 2,
       width: 80,
       height: 120,
       visible: false,
       rotation: 0
   };
   ```

3. **Spawn Logic**:
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
               
               // Sync with client
               sendRocketState();
               
               // Auto-hide after 7 seconds
               setTimeout(hideRocket, 7000);
           }
       }
   }
   ```

4. **Random Number Generation**:
   ```javascript
   function generateRandomFromSeed(seed) {
       const x = Math.sin(seed++) * 10000;
       return x - Math.floor(x);
   }
   ```

5. **WebSocket Messages**:
   ```javascript
   // Host to Client message format
   {
       type: 'middleButtonSpawn',
       visible: true,
       x: position.x,
       y: position.y,
       rotation: rotation,
       nextSpawnTime: timestamp,
       seed: currentSeed
   }
   
   // Client handler
   case 'middleButtonSpawn':
       game.middleButton.visible = message.visible;
       game.middleButton.x = message.x;
       game.middleButton.y = message.y;
       game.middleButton.rotation = message.rotation;
       nextRocketSpawnTime = message.nextSpawnTime;
       rocketSeed = message.seed;
       break;
   ```

6. **Reset Handling**:
   ```javascript
   function resetGame() {
       // Reset middle button state
       game.middleButton.visible = false;
       nextRocketSpawnTime = Date.now() + middleButtonSpawnInterval;
       rocketSeed = Math.floor(Math.random() * 10000); // New random seed
       
       // Sync reset state with client
       if (isHost) {
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
   }
   ```

### Implementation Guide for New Powerups
1. **State Definition**:
   - Add powerup properties to game state
   - Define timing variables
   - Set up random seed if needed

2. **Spawn Control**:
   - Host should control spawn timing
   - Use deterministic random generation for positions
   - Implement visibility duration
   - Consider margins for spawn positions
   - Use seeded random for predictable behavior

3. **Synchronization**:
   - Send state updates via WebSocket
   - Include all necessary properties (position, rotation, timing)
   - Sync state during game resets
   - Ensure host controls all random aspects
   - Use timestamps for timing synchronization

4. **Message Types**:
   - Create specific message types for your powerup
   - Include all necessary state information
   - Handle both spawn and despawn events
   - Include seed and timing information

Example WebSocket Handler:
```javascript
function handleWebSocketMessage(event) {
    const message = JSON.parse(event.data);
    switch(message.type) {
        case 'powerupSpawn':
            // Update powerup state
            game.powerup.x = message.x;
            game.powerup.y = message.y;
            game.powerup.visible = message.visible;
            game.powerup.rotation = message.rotation;
            // Update timing
            nextSpawnTime = message.nextSpawnTime;
            powerupSeed = message.seed;
            break;
    }
}
```

This synchronization mechanism ensures that powerups behave consistently across all clients and can be used as a template for implementing future powerups in the game. The key is to:
1. Use seeded random numbers for deterministic behavior
2. Let the host control all random aspects
3. Synchronize state and timing information
4. Handle game resets properly
5. Consider spawn positions and margins
6. Implement proper cleanup and visibility duration
