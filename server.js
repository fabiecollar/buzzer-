const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');

// ─── GET LOCAL IP ─────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const PORT = 3000;
const IP = getLocalIP();

// ─── HTTP SERVER (serves the HTML app) ───────────────────
const httpServer = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'app.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ─── WEBSOCKET SERVER ─────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

let clients = new Set();
let orderQueue = [];   // [{num, status}]
let callLog = [];

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[+] Client connected. Total: ${clients.size}`);

  // Send current queue state to new client
  ws.send(JSON.stringify({ type: 'QUEUE_STATE', queue: orderQueue, log: callLog }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'ADD_ORDER') {
        const num = parseInt(msg.num);
        if (!orderQueue.find(o => o.num === num)) {
          orderQueue.push({ num, status: 'waiting' });
          broadcast({ type: 'QUEUE_STATE', queue: orderQueue, log: callLog });
          console.log(`[+] Order added: ${num}`);
        }
      }

      if (msg.type === 'CALL_ORDER') {
        const num = parseInt(msg.num);
        const item = orderQueue.find(o => o.num === num);
        if (item) {
          item.status = 'called';
          const entry = { num, time: new Date().toTimeString().slice(0,5) };
          callLog.unshift(entry);
          if (callLog.length > 20) callLog.pop();
          broadcast({ type: 'QUEUE_STATE', queue: orderQueue, log: callLog });
          broadcast({ type: 'ORDER_READY', num });
          console.log(`[🔔] Order called: ${num}`);
          // Auto-remove after 15s
          setTimeout(() => {
            orderQueue = orderQueue.filter(o => o.num !== num);
            broadcast({ type: 'QUEUE_STATE', queue: orderQueue, log: callLog });
          }, 15000);
        }
      }

    } catch(e) { console.error('Parse error:', e); }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[-] Client disconnected. Total: ${clients.size}`);
  });
});

function broadcast(msg) {
  const str = JSON.stringify(msg);
  clients.forEach(c => { if (c.readyState === 1) c.send(str); });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n');
  console.log('  ██████  ██    ██ ███████ ███████ ███████ ██████  ');
  console.log('  ██   ██ ██    ██    ███     ███  ██      ██   ██ ');
  console.log('  ██████  ██    ██   ███     ███   █████   ██████  ');
  console.log('  ██   ██ ██    ██  ███     ███    ██      ██   ██ ');
  console.log('  ██████   ██████  ███████ ███████ ███████ ██   ██ ');
  console.log('\n');
  console.log(`  ✅ Server running`);
  console.log(`\n  📱 Open on any phone on this WiFi:`);
  console.log(`\n     http://${IP}:${PORT}\n`);
  console.log(`  🖥️  Or on this machine: http://localhost:${PORT}\n`);
});
