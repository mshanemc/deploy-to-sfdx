/* globals WebSocket, location */
const HOST = location.origin.href(/^https/, 'wss');
console.log(HOST);

const ws = new WebSocket(HOST);

ws.onmessage = function (event) {
  console.log(event);
};