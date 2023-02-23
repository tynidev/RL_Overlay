import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import WebSocket from 'ws';
import fs from 'fs'

let eventNum = 0;
let webSocket = new WebSocket(`ws://localhost:49322`);
const rl = readline.createInterface({ input, output });

webSocket.onopen = (event) => {
    console.count("WebSocket:OnOpen");
    register('game', 'match_created');
    register('game', 'update_state');
    register('game', 'initialized');
    register('game', 'pre_countdown_begin');
    register('game', 'post_countdown_begin');
    register('game', 'round_started_go');
    register('game', 'clock_updated_seconds');
    register('game', 'goal_scored');
    register('game', 'replay_start');
    register('game', 'replay_will_end');
    register('game', 'replay_end');
    register('game', 'match_ended');
    register('game', 'podium_start');
    register('game', 'match_destroyed');
    register('game', 'series_update');
};

webSocket.onclose  = (event) => {
    console.count("WebSocket:OnClose");
};

webSocket.onmessage = (event) => {
    console.count("WebSocket:OnMessage");
    fs.writeFile("./testdata/" + (++eventNum) + ".json", event.data, (err) => {
        if (err) console.log(err);
    });
};

webSocket.onerror  = (event) => {
    console.count("WebSocket:OnError");
};

function register(channel, event){
    webSocket.send(
        JSON.stringify({
            event: 'wsRelay:register',
            data: `${channel}:${event}`,
        })
    );
}

await rl.question('Stop? ');
process.exit()