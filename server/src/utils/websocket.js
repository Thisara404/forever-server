// server/src/utils/websocket.js
const WebSocket = require('ws');

let wss;

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('🔗 WebSocket client connected');
    
    ws.on('close', () => {
      console.log('❌ WebSocket client disconnected');
    });
  });
};

const broadcastUpdate = (type, data) => {
  if (wss) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    console.log(`📢 Broadcasted ${type} update to ${wss.clients.size} clients`);
  }
};

module.exports = { initWebSocket, broadcastUpdate };