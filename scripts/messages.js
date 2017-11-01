/* globals WebSocket, location, document */
const HOST = location.href.replace(/^http/, 'ws');
console.log(HOST);

const ws = new WebSocket(HOST);
const deployIdInput = document.getElementById('deployId');
console.log(deployIdInput);

let pinger;

function startPing(){
	pinger = setTimeout( () => ws.send('ping'), 10000);
}
// const deployId = deployIdInput.value;

// console.log(deployId);

ws.onmessage = function (event) {
	// console.log(event);
	console.log(event.data);
	// if (event.data.deployId === deployId){
	// 	console.log('mine');
	// 	console.log(event.data);
	// } else {
	// 	console.log('not mine');
	// 	console.log(event.data);
	// }
};

ws.onopen = function () {
	startPing();
};

