/* globals window, document, location, WebSocket, XMLHttpRequest */

// works for both http and https

// const deployId = deployIdInput.value;
const HOST = location.href.replace(/^http/, 'ws');

const ws = new WebSocket(HOST);
let pinger;
let msgCounter;

const deployIdInput = document.getElementById('deployId');
const deployId = deployIdInput.innerText;

const defaultContent = function (content) {
  const para = document.createElement('p');
  para.classList.add('slds-m-vertical_medium');
  const node = document.createTextNode(`${msgCounter}. ${content}`);
  para.appendChild(node);

  const element = document.getElementById('status');
  element.appendChild(para);
};

const displayContent = function (content) {
  // the login url
  if (content.includes('ERROR')) {
    console.log('an error occurred');
    console.log(content);
    document.getElementById('errorBlock').setAttribute('style', 'display : block');
  } else if (content.includes('secur/frontdoor')) {
    console.log('This is the login url in JSON');
    const goodstuff = JSON.parse(content);
    const link = document.getElementById('loginUrl');
    link.href = goodstuff.result.url;
    // link.innerHTML = goodstuff.result.url;
    document.getElementById('loginBlock').setAttribute('style', 'display : block');
  } else if (content.includes('password')) {
    const goodstuff = JSON.parse(content);
    if (goodstuff.result.fields) {
      // secondary user generated with password.  Show the block
      document.getElementById('secondaryUserBlock').setAttribute('style', 'display : block');
      // add to the secondaryUserArray
      const html = `<p class="slds-m-vertical_medium slds-text-heading_small">User named <b>${goodstuff.result.fields.firstname} ${goodstuff.result.fields.lastname}</b> created with username <b>${goodstuff.result.fields.username}</b> and password <b>${goodstuff.result.password}</b></p>`;
      const element = document.getElementById('secondaryUserArray');
      element.insertAdjacentHTML('beforeend', html.trim());
    } else {
      // primary user password generated/set
      document.getElementById('password').innerHTML = goodstuff.result.password;
      document.getElementById('passwordBlock').setAttribute('style', 'display : block');
      defaultContent('Password Generated');
    }

  } else if (content.includes('pushedSource')) {

    defaultContent('Source Pushed');
    // // let's create an array to share
    // var element = document.getElementById("status");
    // var para = document.createElement("p");
    // para.classList.add('slds-m-vertical_medium');
    // var ul = document.createElement("ul");
    // ul.classList.add('slds-list_vertical');

    // let goodstuff = JSON.parse(content);
    // for (let line of goodstuff.result.pushedSource){
    // 	var li = document.createElement("li");
    // 	var node = document.createTextNode(line.state + ' ' + line.fullName + ' (' + line.type + ')' );
    // 	li.appendChild(node);
    // 	ul.appendChild(li);
    // }
    // para.appendChild(ul);
    // var element = document.getElementById("status");
    // element.appendChild(para);
    // refId
  } else if (content.includes('Permsets Assigned')) {
    defaultContent('Assigned Perm Sets (see console logs for details)');
  } else if (content.includes('Import Results')) {
    defaultContent('Loaded some data (see console logs for details)');
  } else if (content.includes('EXECUTION_FINISHED')) {
    defaultContent('Executed Apex (see console logs for details)');
  } else if (content.includes('username') && content.includes('orgId') && !content.includes('"fields":{')) {
    const goodstuff = JSON.parse(content);
    document.getElementById('username').innerHTML = goodstuff.result.username;
    // document.getElementById("passwordBlock").setAttribute("style", "display : block");
    defaultContent(`Scratch org created with username ${goodstuff.result.username}`);
  } else if (content.includes('ALLDONE')) {
    document.getElementById('loaderBlock').setAttribute('style', 'display : none');
    // document.getElementById("passwordBlock").setAttribute("style", "display : block");
  } else {
    // everything unspecified
    defaultContent(content);
  }

};

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
  msgCounter++;
  // console.log(event);
  let parsedData;
  try {
    parsedData = JSON.parse(event.data);
  } catch (err) {
    console.log('unparseable message (not JSON)');
    console.log(event.data);
  }
  if (parsedData) {
    if (parsedData.deployId.trim() === deployId.trim()) {
      console.log(parsedData);
      if (parsedData.content) {
        displayContent(parsedData.content);
      } else {
        console.log('no content!');
      }
    } else {
      console.log('not mine');
      console.log(parsedData);
    }
  }
};

// deleteButton
document.getElementById('deleteButton').addEventListener('click', (e) => {
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
    username: document.getElementById('username').innerHTML,
    delete: true
  }));
  return false;
});