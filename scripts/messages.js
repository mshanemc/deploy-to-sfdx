/* globals WebSocket, location */
const HOST = location.href.replace(/^http/, 'ws');
console.log(HOST);

const ws = new WebSocket(HOST);

ws.onmessage = function (event) {
  console.log(event.data);
};