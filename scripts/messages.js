/* globals WebSocket, location, document */
const HOST = location.href.replace(/^http/, 'ws');
console.log(HOST);

const ws = new WebSocket(HOST);
const deployIdinput = document.getElementById('deployId');
const deployId = deployIdinput.value;

console.log(deployId);

ws.onmessage = function (event) {
	if (event.data.deployId === deployId){
		console.log('mine');
		console.log(event.data);
	} else {
		console.log('not mine');
		console.log(event.data);
	}
};