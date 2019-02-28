console.log('hello from the trial loading script');
const HOST = location.href.replace(/^http/, 'ws');
const ws = new WebSocket(HOST);
let pinger;
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
    try {
        const parsedData = JSON.parse(event.data);
        console.log(parsedData);
        if (parsedData.mainUser && parsedData.mainUser.loginUrl) {
            ws.close();
            window.location.href = parsedData.mainUser.loginUrl;
        }
    }
    catch (err) {
        console.error('unparseable message (not JSON)', event.data);
    }
};
