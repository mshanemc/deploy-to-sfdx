/* globals window, document, location, WebSocket */
const HOST = location.href.replace(/^http/, 'ws');

const ws = new WebSocket(HOST);
let pinger;
let msgCounter;

ws.onopen = function () {
  console.log('WS is open!');
  pinger = setInterval(() => {
    ws.send('ping');
  }, 5000);
};

ws.onclose = function () {
  console.log('WS is closing');
  clearInterval(pinger);
};

ws.onmessage = function (event) {
  msgCounter = msgCounter || 0;
  msgCounter++;
  let parsedData;
  try {
    parsedData = JSON.parse(event.data);
  } catch (err) {
    console.log('unparseable message (not JSON)');
    console.log(event.data);
  }
  if (parsedData) {
    const deployIdInput = document.getElementById('deployId');
    const deployId = deployIdInput.innerText;

    if (parsedData.deployId.trim() === deployId.trim()) {
      console.log(parsedData);
      if (parsedData.content.includes('secur/frontdoor')) {
        console.log('This is the login url in JSON');
        const goodstuff = JSON.parse(parsedData.content);
        console.log('url is ' + goodstuff.result.url);
        window.location.href = goodstuff.result.url;
      }
    }
  }
};