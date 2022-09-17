import { pack, unpack } from 'msgpackr';

export function uwsClient(onMessage:(data:any)=>void, address:string = 'ws://127.0.0.1:9001') {
  const ws = new WebSocket(address);
  ws.binaryType = 'arraybuffer'; // to get an arraybuffer instead of a blob

  ws.addEventListener('open', () => {
    console.log('open');
  });

  ws.addEventListener('close', () => {
    console.log('close');
  });

  ws.addEventListener('error', (ev) => {
    console.error(ev);
  });

  ws.addEventListener('message', (ev) => {
    const data = unpack(new Uint8Array(ev.data));
    onMessage(data);
  });

  return {
    send(o: any): void {
      ws.send(pack(o));
    }
  }
}
