import WebSocket from 'ws';
import fs from 'fs'
import { networkInterfaces } from 'node:os';

const nets = networkInterfaces();
const externalInterfaces = [];

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            externalInterfaces.push(net.address);
        }
    }
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

function send(eventNum, webSocket){
    console.log(eventNum);
    fs.readFile("./testdata/" + (eventNum) + ".json", 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        webSocket.send(data);
    });
}

async function replay(host, eventStart, eventEnd){
    const init = () => {
        let webSocket = new WebSocket(`ws://${host}:49322`);

        webSocket.onopen = (event) => {
            console.count("WebSocket:OnOpen");
        };
        
        webSocket.onclose  = (event) => {
            console.count("WebSocket:OnClose");
        };
        
        webSocket.onerror  = (event) => {
            console.count("WebSocket:OnError");
            console.error(event);
        };

        return webSocket;
    }

    let webSocket = init();
    setInterval(function () {
        if(webSocket.readyState === WebSocket.CLOSED)
          webSocket = init();
      }, 1500);

    while(eventStart <= eventEnd){
        if(webSocket.readyState === WebSocket.OPEN)
            send(eventStart++, webSocket);
        await sleep(50);
    }
    process.exit();
}


await replay(externalInterfaces[0], 1, 800);