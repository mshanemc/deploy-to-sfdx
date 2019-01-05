/* globals location, WebSocket */

const HOST = location.href.replace(/^http/, 'ws');

const ws = new WebSocket(HOST);
let pinger;

ws.onopen = function () {
  console.log('WS is open!');
  pinger = setInterval( () => {
    ws.send('ping');
  }, 5000);
};

ws.onclose = function () {
  console.log('WS is closing');
  clearInterval(pinger);
};