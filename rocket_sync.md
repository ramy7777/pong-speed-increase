# Rocket Spawn and Synchronization Mechanism

## Overview
The rocket spawn feature is a game element that appears every 5 seconds at random locations on the game canvas. This document explains how the rocket is spawned and synchronized between the host and client players.

## Implementation Details

### 1. Game State
The rocket's state is maintained in the game object:
```javascript
game.middleButton = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 30,
    visible: false
}
```

### 2. Spawn Mechanism
- The rocket spawns every 5 seconds (defined by `middleButtonSpawnInterval = 5000`)
- Only the host controls the spawn timing and location
- The spawn location is randomly calculated with margins to avoid edges
- The rocket remains visible for 2 seconds before disappearing

### 3. Synchronization Flow
1. **Host Side**:
   - The host checks if it's time to spawn (`currentTime - lastMiddleButtonSpawn >= middleButtonSpawnInterval`)
   - When spawning, the host:
     - Sets the rocket's visibility to true
     - Sends a WebSocket message to the client with type 'middleButtonSpawn'
   - After 2 seconds, the host:
     - Sets the rocket's visibility to false
     - Sends another message to hide it on the client side

2. **Client Side**:
   - The client receives WebSocket messages of type 'middleButtonSpawn'
   - Updates its local game state based on the message:
     ```javascript
     case 'middleButtonSpawn':
         game.middleButton.visible = message.visible;
         break;
     ```

### 4. Drawing
The rocket is drawn in the main draw loop when visible:
```javascript
if (game.middleButton.visible) {
    ctx.beginPath();
    ctx.arc(game.middleButton.x, game.middleButton.y, game.middleButton.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
}
```

## Server-Side Handling
The server is configured to handle and broadcast the 'middleButtonSpawn' message type:
```javascript
case 'middleButtonSpawn':
    broadcastToRoom(ws, data);
    break;
```

## Key Points
1. The host is the source of truth for rocket spawning
2. Synchronization happens through WebSocket messages
3. The server acts as a relay, broadcasting messages to all players in the room
4. The spawn timing and visibility are controlled by the host to maintain consistency
5. Random positions are calculated on the host side to ensure both players see the rocket in the same location

## Related Files
- `game.js`: Contains the main game logic and WebSocket handling
- `server.js`: Handles message routing between players
