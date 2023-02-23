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