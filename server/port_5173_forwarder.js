const http = require('http');

const PORT = 5173;
const TARGET_PORT = 3000;

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  };

  const proxyReq = http.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Connecting to http://localhost:${TARGET_PORT}... Please refresh in a moment.`);
  });

  req.pipe(proxyReq, { end: true });
});

server.on('upgrade', (req, socket, head) => {
  const proxyReq = http.request({
    hostname: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  });

  proxyReq.on('upgrade', (targetRes, targetSocket, targetHead) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n`);
    for (const [k, v] of Object.entries(targetRes.headers)) {
      socket.write(`${k}: ${v}\r\n`);
    }
    socket.write(`\r\n`);
    targetSocket.pipe(socket);
    socket.pipe(targetSocket);
  });

  proxyReq.on('error', () => {
    socket.destroy();
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`Port ${PORT} forwarder active -> forwarding to http://localhost:${TARGET_PORT}`);
});
