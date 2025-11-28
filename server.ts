import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocket } from './src/lib/socket';
import { setGlobalIO } from './src/lib/socket-emitter';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  // Inicializar Socket.IO
  const io = initializeSocket(httpServer);

  // Configurar emissão global para API routes
  setGlobalIO(io);

  httpServer.listen(port, () => {
    console.log(`> Servidor pronto em http://${hostname}:${port}`);
    console.log(`> Socket.IO ativo em /api/socketio`);
  });
});
