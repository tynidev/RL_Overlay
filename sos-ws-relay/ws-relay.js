const WebSocket = require('ws');
const prompt = require('prompt');
const { success, error, warn, info, log, indent } = require('cli-msg');
const atob = require('atob');
let argv = require('minimist')(process.argv);

let promptsPassed = false;

function addPromptOverrideProperty(key, val) {
    if (!prompt.override) {
        prompt.override = {};
    }
    prompt.override[key] = val;
}

if (argv.hasOwnProperty('delay')) {
    addPromptOverrideProperty('delay', argv.delay);
}
if (argv.hasOwnProperty('port')) {
    addPromptOverrideProperty('port',argv.port);
}
if (argv.hasOwnProperty('rocketLeagueHost')) {
    addPromptOverrideProperty('rocketLeagueHost',argv.rocketLeagueHost);
}

//Add timeout, in case of programmatic usage where a user may not be fully present
if (argv.timeout) {
    let timeoutMs = parseInt(argv.timeout, 10);
    if (timeoutMs > 0) {
        setTimeout(() => {
            if (!promptsPassed) {
                console.error(`\n\nPrompts not completed within timeout limit (${timeoutMs}ms). Exiting`);
                process.exit(100);
            }
        }, timeoutMs);
    }
}

prompt.get([
    {
        description: 'Relay delay in milliseconds (used in cloud productions)',
        pattern: /^\d+$/,
        message: 'Must be a number',
        name: 'delay',
        required: true,
        default: "0",
    },
    {
        description: "Port number for this websocket server",
        pattern: /^\d+$/,
        message: 'Must be a number',
        name: 'port',
        required: true,
        default: "49322",
    },
    {
        description: "Hostname:Port that Rocket League is running on",
        name: 'rocketLeagueHost',
        required: true,
        default: "localhost:49122"
    }
], function (e, r) {
    promptsPassed = true;
    /**
     * Rocket League WebSocket client
     * @type {WebSocket}
     */
    let wsClient;
    let relayMsDelay = parseInt(r.delay, 10);

    const wss = new WebSocket.Server({ port: r.port });
    let connections = {};
    info.wb("Opened WebSocket server on port " + r.port);

    wss.on('connection', function connection(ws) {
        let id = (+ new Date()).toString();
        success.wb("Received connection: " + id);
        connections[id] = {
            connection: ws,
            registeredFunctions: []
        };

        ws.send(JSON.stringify({
            event: "wsRelay:info",
            data: "Connected!"
        }));

        ws.on('message', function incoming(message) {
            sendRelayMessage(id, message);
        });

        ws.on('close', function close() {
            // Might run into race conditions with accessing connections for sending, but cant be arsed to account for this.
            // If a connection closes something will be fucked anyway
            delete connections[id];
        });
    });

    initRocketLeagueWebsocket(r.rocketLeagueHost);
    setInterval(function () {
       if (wsClient.readyState === WebSocket.CLOSED) {
           warn.wb("Rocket League WebSocket Server Closed. Attempting to reconnect");
           initRocketLeagueWebsocket(r.rocketLeagueHost);
       }
    }, 10000);

    function sendRelayMessage(senderConnectionId, message) {
        let json = JSON.parse(message);
        log.wb(senderConnectionId + "> Sent " + json.event);
        let channelEvent = (json['event']).split(':');
        if (channelEvent[0] === 'wsRelay') {
            if (channelEvent[1] === 'register') {
                if (connections[senderConnectionId].registeredFunctions.indexOf(json['data']) < 0) {
                    connections[senderConnectionId].registeredFunctions.push(json['data']);
                    info.wb(senderConnectionId + "> Registered to receive: "+json['data']);
                } else {
                    warn.wb(senderConnectionId + "> Attempted to register an already registered function: "+json['data']);
                }
            } else if (channelEvent[1] === 'unregister') {
                let idx = connections[senderConnectionId].registeredFunctions.indexOf(json['data']);
                if (idx > -1) {
                    connections[senderConnectionId].registeredFunctions.splice(idx, 1);
                    info.wb(senderConnectionId + "> Unregistered: "+json['data']);
                } else {
                    warn.wb(senderConnectionId + "> Attempted to unregister a non-registered function: "+json['data']);
                }
            }
            return;
        }
        for (let k in connections) {
            if (senderConnectionId === k) {
                continue;
            }
            if (!connections.hasOwnProperty(k)) {
                continue;
            }
            if (connections[k].registeredFunctions.indexOf(json['event']) > -1) {
                setTimeout(() => {
                    try {
                        connections[k].connection.send(message);
                    } catch (e) {
                        //The connection can close between the exist check, and sending, so we catch it here and ignore
                    }
                }, 0);
            }
        }
    }

    function initRocketLeagueWebsocket(rocketLeagueHost) {
        wsClient = new WebSocket("ws://"+rocketLeagueHost);

        wsClient.onopen = function open() {
            success.wb("Connected to Rocket League on "+rocketLeagueHost);
        };
        wsClient.onmessage = function(message) {
            let sendMessage = message.data;
            if (sendMessage.substr(0, 1) !== '{') {
                sendMessage = atob(message.data);
            }
            setTimeout(() => {
                sendRelayMessage(0, sendMessage);
            }, relayMsDelay);
        };
        wsClient.onerror = function (err) {
            error.wb(`Error connecting to Rocket League on host "${rocketLeagueHost}"\nIs the plugin loaded into Rocket League? Run the command "plugin load sos" from the BakkesMod console to make sure`);
        };
    }
});