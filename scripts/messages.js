/* globals io */
const socket = io();
console.log('Messages script is running');
socket.on('deployMessage', function(msg){
	console.log(msg);
});