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

// //
// // Start the prompt
// //
// prompt.start();

// //
// // Get two properties from the user: username and email
// //
// prompt.get([
//     {
//         description: 'Series text (used in center of scoreboard)',
//         name: 'series_text',
//         required: true,
//         default: "RANKED",
//     },
//     {
//         description: "Series length",
//         pattern: /^\d+$/,
//         message: 'Must be a number',
//         name: 'series_length',
//         required: true,
//         default: "5",
//     },
//     {
//         description: 'Left team',
//         name: 'left_team',
//         required: true,
//         default: "Blue",
//     },
//     {
//         description: 'Right team',
//         name: 'right_team',
//         required: true,
//         default: "Orange",
//     },
// ], async function (e, r) {

//     WsSubscribers.send("game", "series_update", {
//     "series_txt" : r.series_text,
//     "length" : parseInt(r.series_length), 
//     "teams": [
//         {
//         "team" : 0,
//         "name" : r.left_team,
//         "matches_won" : 0
//         },
//         {
//         "team" : 1,
//         "name" : r.right_team,
//         "matches_won" : 0
//         }
//     ]
//     });

//     left_score = 0;
//     right_score = 0;
//     left_team = r.left_team;
//     right_team = r.right_team;

//     while(true)
//     {
//         recieved_prompt = false;

//         prompt.get([        
//             {
//                 description: 'Left team',
//                 name: 'left_team',
//                 required: true,
//                 default: left_team,
//             },
//             {
//                 description: 'Left score',
//                 pattern: /^\d+$/,
//                 message: 'Must be a number',
//                 name: 'left_score',
//                 required: true,
//                 default: left_score,
//             },
//             {
//                 description: 'Right team',
//                 name: 'right_team',
//                 required: true,
//                 default: right_team,
//             },
//             {
//                 description: 'Right score',
//                 pattern: /^\d+$/,
//                 message: 'Must be a number',
//                 name: 'right_score',
//                 required: true,
//                 default: right_score,
//             },
//         ], 
//         function (e, b) {
//             recieved_prompt = true;
//             left_score = b.left_score;
//             right_score = b.right_score;
//             left_team = b.left_team;
//             right_team = b.right_team;
//             WsSubscribers.send("game", "series_update", {
//                 "series_txt" : r.series_text,
//                 "length" : parseInt(r.series_length), 
//                 "teams": [
//                     {
//                     "team" : 0,
//                     "name" : left_team,
//                     "matches_won" : parseInt(left_score)
//                     },
//                     {
//                     "team" : 1,
//                     "name" : right_team,
//                     "matches_won" : parseInt(right_score)
//                     }
//                 ]
//                 });
//         });

//         while(!recieved_prompt)
//         {
//             await new Promise(r => setTimeout(r, 2000));
//         }
//     }
// });