/* globals window, document, location, WebSocket, XMLHttpRequest, Vue */

// works for both http and https

// const deployId = deployIdInput.value;
const HOST = location.href.replace(/^http/, 'ws');

const ws = new WebSocket(HOST);
let pinger;

const deployIdInput = document.getElementById('deployId');
const deployId = deployIdInput.innerText;

const display = new Vue({
  el: '#regular_display_area',
  data: {
    deployId: deployId.trim(),
    complete: false,
    completeTimestamp: '',
    browserStartTime: new Date(),
    orgId: 'init',
    mainUser: {},
    additionalUsers: [],
    errors: [],
    commandResults: []
  },
  methods: {
    deleteOrg (e){
      e.preventDefault();
      e.stopPropagation();

      // document.getElementById("demo").innerHTML = "Hello World";
      const xhttp = new XMLHttpRequest();

      xhttp.open('POST', '/delete', true);
      xhttp.setRequestHeader('Content-type', 'application/json');
      xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4 && xhttp.status === 302) {
          console.log(xhttp.response);
          console.log(xhttp.status);
          console.log(xhttp.responseText);
          window.location = xhttp.responseText;
        }
      };
      xhttp.send(JSON.stringify({
        username: this.mainUser.username,
        delete: true
      }));
      return false;
    }
  }
});

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
  const newData = JSON.parse(event.data);
  console.log(newData);
  try {
    // display.data = JSON.parse(event.data);
    display.orgId = newData.orgId;
    display.deployId = newData.deployId;
    display.commandResults = newData.commandResults;
    display.complete = newData.complete;
    display.errors = newData.errors;
    display.mainUser = newData.mainUser;
    display.additionalUsers = newData.additionalUsers;
  } catch (err){
    console.error('unexpected message format follows');
    console.log(event);
  }

};

