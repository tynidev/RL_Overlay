import WebSocket from 'ws';
import fs from 'fs'

let webSocket = new WebSocket(`ws://localhost:49322`);

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

async function replay(eventStart, eventEnd, webSocket){
    while(eventStart <= eventEnd){
        send(eventStart++, webSocket);
        await sleep(100);
    }
    process.exit();
}

webSocket.onopen = (event) => {
    console.count("WebSocket:OnOpen");
    replay(82, 400, webSocket);
};

webSocket.onclose  = (event) => {
    console.count("WebSocket:OnClose");
};

webSocket.onerror  = (event) => {
    console.count("WebSocket:OnError");
};