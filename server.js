const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game rooms storage
const rooms = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            
            switch(data.type) {
                case 'create':
                case 'join':
                    handleRoomJoin(ws, data.roomId);
                    break;
                    
                case 'paddleMove':
                case 'ballUpdate':
                case 'score':
                case 'gameStarted':
                case 'boost':
                case 'shield':
                case 'shieldEnd':
                case 'playSound':
                case 'middleButtonSpawn':
                    broadcastToRoom(ws, data);
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        handlePlayerDisconnect(ws);
    });
});

function handleRoomJoin(ws, roomId) {
    if (!rooms.has(roomId)) {
        // Create new room
        rooms.set(roomId, {
            host: ws,
            client: null
        });
        ws.roomId = roomId;
        ws.isHost = true;
        
        ws.send(JSON.stringify({
            type: 'joined',
            playerId: 'host',
            isHost: true,
            roomId: roomId
        }));
        
        console.log(`Room ${roomId} created`);
    } else {
        const room = rooms.get(roomId);
        if (!room.client && room.host !== ws) {
            // Join as client
            room.client = ws;
            ws.roomId = roomId;
            ws.isHost = false;
            
            ws.send(JSON.stringify({
                type: 'joined',
                playerId: 'client',
                isHost: false,
                roomId: roomId
            }));
            
            // Notify both players that game is ready
            room.host.send(JSON.stringify({ type: 'gameReady' }));
            room.client.send(JSON.stringify({ type: 'gameReady' }));
            
            console.log(`Client joined room ${roomId}`);
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Room is full'
            }));
        }
    }
}

function broadcastToRoom(sender, data) {
    if (!sender.roomId) return;
    
    const room = rooms.get(sender.roomId);
    if (!room) return;
    
    const message = JSON.stringify(data);
    
    // Send to other player
    if (sender === room.host && room.client) {
        room.client.send(message);
    } else if (sender === room.client && room.host) {
        room.host.send(message);
    }
}

function handlePlayerDisconnect(ws) {
    if (!ws.roomId) return;
    
    const room = rooms.get(ws.roomId);
    if (!room) return;
    
    // Notify other player
    if (ws === room.host && room.client) {
        room.client.send(JSON.stringify({ type: 'playerLeft' }));
    } else if (ws === room.client && room.host) {
        room.host.send(JSON.stringify({ type: 'playerLeft' }));
    }
    
    // Clean up room if empty
    if (ws === room.host) {
        room.host = room.client;
        room.client = null;
        if (room.host) {
            room.host.isHost = true;
            room.host.send(JSON.stringify({
                type: 'joined',
                playerId: 'host',
                isHost: true,
                roomId: ws.roomId
            }));
        } else {
            rooms.delete(ws.roomId);
        }
    } else if (ws === room.client) {
        room.client = null;
    }
    
    console.log(`Player left room ${ws.roomId}`);
}

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
