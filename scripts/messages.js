/* globals WebSocket, location */
const HOST = location.origin.replace(/^http/, 'ws');
const ws = new WebSocket(HOST);

ws.onmessage = function (event) {
  console.log(event);
};