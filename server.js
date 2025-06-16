// server.js - Enhanced WebSocket Signaling Server with Advanced Features
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

// Enhanced connection management
const connections = new Map();
const rooms = new Map();
const waitingQueue = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        connections: connections.size,
        rooms: rooms.size,
        waiting: waitingQueue.length,
        timestamp: new Date().toISOString()
    });
});

// TURN server configuration endpoint
app.get('/api/ice-servers', (req, res) => {
    // In production, this would return dynamic TURN credentials
    res.json({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    });
});

// Enhanced WebSocket handling
wss.on('connection', (ws, req) => {
    const clientId = generateId();
    const clientIp = req.socket.remoteAddress;
    
    console.log(`[Server] New connection: ${clientId} from ${clientIp}`);
    
    // Enhanced client object
    const client = {
        id: clientId,
        ws: ws,
        partner: null,
        room: null,
        stats: {
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            messagesExchanged: 0
        }
    };
    
    connections.set(clientId, client);
    
    // Send initial connection info
    ws.send(JSON.stringify({
        type: 'connected',
        payload: { clientId, timestamp: Date.now() }
    }));
    
    // Heartbeat mechanism
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    
    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('[Server] Invalid JSON:', e);
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
            return;
        }
        
        client.stats.lastActivity = Date.now();
        client.stats.messagesExchanged++;
        
        handleMessage(client, data);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`[Server] Client disconnected: ${clientId}, code: ${code}, reason: ${reason}`);
        handleDisconnection(client);
    });
    
    ws.on('error', (error) => {
        console.error(`[Server] WebSocket error for ${clientId}:`, error);
    });
});

// Message handling
function handleMessage(client, data) {
    const { type, payload } = data;
    
    switch (type) {
        case 'join-queue':
            handleJoinQueue(client, payload);
            break;
            
        case 'leave-queue':
            handleLeaveQueue(client);
            break;
            
        case 'signal':
            handleSignal(client, payload);
            break;
            
        case 'quality-report':
            handleQualityReport(client, payload);
            break;
            
        case 'toggle-media':
            handleToggleMedia(client, payload);
            break;
            
        case 'request-stats':
            handleStatsRequest(client);
            break;
            
        case 'heartbeat':
            client.ws.send(JSON.stringify({ type: 'heartbeat-ack', payload: { timestamp: Date.now() } }));
            break;
            
        default:
            console.warn(`[Server] Unknown message type: ${type}`);
            client.ws.send(JSON.stringify({ 
                type: 'error', 
                payload: { message: `Unknown message type: ${type}` } 
            }));
    }
}

// Queue management
function handleJoinQueue(client, payload) {
    const { preferences = {} } = payload;
    
    // Remove from queue if already present
    const queueIndex = waitingQueue.findIndex(c => c.id === client.id);
    if (queueIndex !== -1) {
        waitingQueue.splice(queueIndex, 1);
    }
    
    // Try to find a match
    const match = findMatch(client, preferences);
    
    if (match) {
        createRoom(client, match);
    } else {
        // Add to waiting queue
        client.preferences = preferences;
        waitingQueue.push(client);
        
        client.ws.send(JSON.stringify({
            type: 'waiting',
            payload: { position: waitingQueue.length, timestamp: Date.now() }
        }));
        
        console.log(`[Server] Client ${client.id} joined queue. Queue size: ${waitingQueue.length}`);
    }
}

function handleLeaveQueue(client) {
    const index = waitingQueue.findIndex(c => c.id === client.id);
    if (index !== -1) {
        waitingQueue.splice(index, 1);
        client.ws.send(JSON.stringify({ type: 'left-queue' }));
        console.log(`[Server] Client ${client.id} left queue`);
    }
}

// Matching algorithm
function findMatch(client, preferences) {
    // Simple FIFO matching for now, can be enhanced with preferences
    if (waitingQueue.length > 0) {
        return waitingQueue.shift();
    }
    return null;
}

// Room creation
function createRoom(client1, client2) {
    const roomId = generateRoomId();
    
    const room = {
        id: roomId,
        participants: [client1.id, client2.id],
        createdAt: Date.now(),
        stats: {
            duration: 0,
            quality: { client1: null, client2: null }
        }
    };
    
    rooms.set(roomId, room);
    
    // Update client states
    client1.partner = client2.id;
    client1.room = roomId;
    client2.partner = client1.id;
    client2.room = roomId;
    
    // Notify both clients
    client1.ws.send(JSON.stringify({
        type: 'matched',
        payload: {
            partnerId: client2.id,
            roomId: roomId,
            initiator: true,
            timestamp: Date.now()
        }
    }));
    
    client2.ws.send(JSON.stringify({
        type: 'matched',
        payload: {
            partnerId: client1.id,
            roomId: roomId,
            initiator: false,
            timestamp: Date.now()
        }
    }));
    
    console.log(`[Server] Room created: ${roomId} with ${client1.id} and ${client2.id}`);
}

// Signal relay
function handleSignal(client, payload) {
    const { to, signal } = payload;
    const targetClient = connections.get(to);
    
    if (targetClient && targetClient.partner === client.id) {
        targetClient.ws.send(JSON.stringify({
            type: 'signal',
            payload: { from: client.id, signal }
        }));
    } else {
        client.ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Invalid signal target' }
        }));
    }
}

// Quality reporting
function handleQualityReport(client, payload) {
    if (client.room) {
        const room = rooms.get(client.room);
        if (room) {
            room.stats.quality[client.id] = payload.stats;
            
            // Relay quality info to partner
            if (client.partner) {
                const partner = connections.get(client.partner);
                if (partner) {
                    partner.ws.send(JSON.stringify({
                        type: 'partner-quality',
                        payload: { stats: payload.stats }
                    }));
                }
            }
        }
    }
}

// Media toggle relay
function handleToggleMedia(client, payload) {
    if (client.partner) {
        const partner = connections.get(client.partner);
        if (partner) {
            partner.ws.send(JSON.stringify({
                type: 'partner-media-toggle',
                payload: payload
            }));
        }
    }
}

// Stats request
function handleStatsRequest(client) {
    const stats = {
        connectionDuration: Date.now() - client.stats.connectedAt,
        messagesExchanged: client.stats.messagesExchanged,
        serverTime: Date.now(),
        totalConnections: connections.size,
        totalRooms: rooms.size
    };
    
    if (client.room) {
        const room = rooms.get(client.room);
        if (room) {
            stats.roomDuration = Date.now() - room.createdAt;
            stats.roomQuality = room.stats.quality;
        }
    }
    
    client.ws.send(JSON.stringify({
        type: 'stats-response',
        payload: stats
    }));
}

// Disconnection handling
function handleDisconnection(client) {
    // Remove from waiting queue
    const queueIndex = waitingQueue.findIndex(c => c.id === client.id);
    if (queueIndex !== -1) {
        waitingQueue.splice(queueIndex, 1);
    }
    
    // Notify partner
    if (client.partner) {
        const partner = connections.get(client.partner);
        if (partner) {
            partner.partner = null;
            partner.room = null;
            partner.ws.send(JSON.stringify({
                type: 'partner-disconnected',
                payload: { 
                    partnerId: client.id,
                    timestamp: Date.now()
                }
            }));
        }
    }
    
    // Clean up room
    if (client.room) {
        const room = rooms.get(client.room);
        if (room) {
            room.stats.duration = Date.now() - room.createdAt;
            console.log(`[Server] Room ${client.room} ended. Duration: ${room.stats.duration}ms`);
            rooms.delete(client.room);
        }
    }
    
    connections.delete(client.id);
}

// Utility functions
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// Heartbeat interval
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Cleanup on server shutdown
wss.on('close', () => {
    clearInterval(heartbeatInterval);
});

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║   Starlight VoIP Pro Server v2.0         ║
    ║   Running on http://localhost:${PORT}       ║
    ║   WebSocket: ws://localhost:${PORT}         ║
    ╚═══════════════════════════════════════════╝
    `);
});
