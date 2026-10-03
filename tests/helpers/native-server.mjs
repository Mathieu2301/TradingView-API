// Node loopback fixture used by both runners; no external endpoint involved.
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
const server = createServer((_request, response) => { response.writeHead(503); response.end(); });
if (process.argv[2] === 'echo') {
  const websocket = new WebSocketServer({ server });
  websocket.on('connection', (socket, request) => {
    socket.on('message', (data) => {
      socket.send(Buffer.from(JSON.stringify({
        origin: request.headers.origin, header: request.headers['x-test'], echo: data.toString(),
      })));
      socket.close(1000, 'finished');
    });
  });
}
server.listen(0, '127.0.0.1', () => console.log(server.address().port));
