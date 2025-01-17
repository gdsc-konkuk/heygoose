import * as log from 'bog';
import ws from 'ws';
import GooseStore from '../store/GooseStore';
import config from '../config';

export default () => {
  const wss = new ws.Server({ port: config.http.wss_port }) as ws.Server & {
    broadcast(data: any): void;
  };
  log.info(`WebSocketServer started on port ${config.http.wss_port}`);

  wss.broadcast = (data: any) => {
    wss.clients.forEach((client: any) => {
      if (client.readyState === ws.OPEN) {
        client.send(data);
      }
    });
  };

  GooseStore.on('GIVE', async (to: string, from: string) => {
    wss.broadcast(JSON.stringify({ event: 'GIVE', data: { to, from } }));
  });

  GooseStore.on('TAKE_AWAY', async (to: string, from: string) => {
    wss.broadcast(JSON.stringify({ event: 'TAKE_AWAY', data: { to, from } }));
  });
};
