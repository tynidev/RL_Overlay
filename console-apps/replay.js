import WebSocket from 'ws';
import fs from 'fs'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

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


const rl = readline.createInterface({ input, output });

const relay_host = await rl.question('Relay Host: ');

await replay(relay_host, 1, 800);

rl.close();
