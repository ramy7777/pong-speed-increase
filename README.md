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

## Technical Notes

### Boost System Implementation
The boost system was improved to prevent double-decrementing of boost counts:

1. **Debounce Protection**
   - Added 250ms cooldown between boost activations
   - Prevents rapid-fire button presses from consuming multiple boosts
   - Uses timestamp tracking to enforce cooldown

2. **Client-Server Synchronization**
   - Only the initiating player decrements their boost count locally
   - Boost count is sent with WebSocket messages to sync both players
   - Receiving player updates their display to match sender's state

3. **Debug Logging**
   - Added '[BOOST]' tagged logging for debugging
   - Tracks boost attempts, cooldowns, and count changes
   - Monitors WebSocket message flow for boost events

This implementation ensures that each boost activation only decrements the count once, while maintaining game state synchronization between players.
