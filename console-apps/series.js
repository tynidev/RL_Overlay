import WebSocket from 'ws';
import prompt from 'prompt';
import fs from 'fs'; // Added import
import minimist from 'minimist'; // Added import

const WsSubscribers = {
    // ... existing WsSubscribers object ...
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function(port, debug, debugFilters) {
        port = port || 49322;
        debug = debug || false;
        if (debug) {
            if (debugFilters !== undefined) {
                console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
            } else {
                console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
                console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
            }
        }
        WsSubscribers.webSocket = new WebSocket("ws://localhost:" + port);
        WsSubscribers.webSocket.onmessage = function (event) {
            let jEvent = JSON.parse(event.data);
            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            let eventSplit = jEvent.event.split(':');
            let channel = eventSplit[0];
            let event_event = eventSplit[1];
            if (debug) {
                if (!debugFilters) {
                    console.log(channel, event_event, jEvent);
                } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
        };
        WsSubscribers.webSocket.onopen = function () {
            WsSubscribers.triggerSubscribers("ws", "open");
            WsSubscribers.webSocketConnected = true;
            WsSubscribers.registerQueue.forEach((r) => {
                WsSubscribers.send("wsRelay", "register", r);
            });
            WsSubscribers.registerQueue = [];
        };
        WsSubscribers.webSocket.onerror = function () {
            WsSubscribers.triggerSubscribers("ws", "error");
            WsSubscribers.webSocketConnected = false;
        };
        WsSubscribers.webSocket.onclose = function () {
            WsSubscribers.triggerSubscribers("ws", "close");
            WsSubscribers.webSocketConnected = false;
        };
    },
    /**
     * Add callbacks for when certain events are thrown
     * Execution is guaranteed to be in First In First Out order
     * @param channels
     * @param events
     * @param callback
     */
    subscribe: function(channels, events, callback) {
        if (typeof channels === "string") {
            let channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            let event = events;
            events = [];
            events.push(event);
        }
        channels.forEach(function(c) {
            events.forEach(function (e) {
                if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
                    WsSubscribers.__subscribers[c] = {};
                }
                if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
                    WsSubscribers.__subscribers[c][e] = [];
                    if (WsSubscribers.webSocketConnected) {
                        WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
                    } else {
                        WsSubscribers.registerQueue.push(`${c}:${e}`);
                    }
                }
                WsSubscribers.__subscribers[c][e].push(callback);
            });
        })
    },
    clearEventCallbacks: function (channel, event) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function (channel, event, data) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel][event].forEach(function(callback) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function (channel, event, data) {
        if (typeof channel !== 'string') {
            console.error("Channel must be a string");
            return;
        }
        if (typeof event !== 'string') {
            console.error("Event must be a string");
            return;
        }
        if (channel === 'local') {
            this.triggerSubscribers(channel, event, data);
        } else {
            let cEvent = channel + ":" + event;
            WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};

WsSubscribers.init(49322, false);

// Function to send series update
function sendSeriesUpdate(data) {
    WsSubscribers.send("game", "series_update", data);
}

// Function to run the update prompt loop
async function runUpdateLoop(currentSeriesText, currentSeriesLength, initialLeftScore, initialRightScore, initialLeftTeam, initialRightTeam, initialLeftLogo, initialRightLogo) {
    let left_score = initialLeftScore;
    let right_score = initialRightScore;
    let left_team = initialLeftTeam;
    let right_team = initialRightTeam;
    let left_team_logo = initialLeftLogo;
    let right_team_logo = initialRightLogo;

    while (true) {
        let received_prompt = false;

        prompt.get([
            {
                description: 'Left team',
                name: 'left_team',
                required: true,
                default: left_team,
            },
            {
                description: 'Left Team Logo',
                name: 'left_team_logo',
                required: false,
                default: left_team_logo,
            },
            {
                description: 'Left score',
                pattern: /^\d+$/,
                message: 'Must be a number',
                name: 'left_score',
                required: true,
                default: left_score,
            },
            {
                description: 'Right team',
                name: 'right_team',
                required: true,
                default: right_team,
            },
            {
                description: 'Right Team Logo',
                name: 'right_team_logo',
                required: false,
                default: right_team_logo,
            },
            {
                description: 'Right score',
                pattern: /^\d+$/,
                message: 'Must be a number',
                name: 'right_score',
                required: true,
                default: right_score,
            },
        ],
            function (err, b) {
                if (err) {
                    console.error("Error getting update prompt:", err);
                    // Decide how to handle prompt errors, e.g., continue or exit
                    // For now, just log and continue the loop
                    received_prompt = true; // Mark as received to avoid infinite wait
                    return;
                }
                received_prompt = true;
                left_score = b.left_score;
                right_score = b.right_score;
                left_team = b.left_team;
                right_team = b.right_team;
                left_team_logo = b.left_team_logo; // Update logos
                right_team_logo = b.right_team_logo; // Update logos

                const updateData = {
                    "series_txt": currentSeriesText, // Keep original series text
                    "length": parseInt(currentSeriesLength), // Keep original length
                    "teams": [
                        {
                            "team": 0,
                            "name": left_team,
                            "matches_won": parseInt(left_score),
                            "logo": left_team_logo
                        },
                        {
                            "team": 1,
                            "name": right_team,
                            "matches_won": parseInt(right_score),
                            "logo": right_team_logo
                        }
                    ]
                };
                sendSeriesUpdate(updateData);
            });

        while (!received_prompt) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Reduced wait time
        }
    }
}


// Parse command line arguments
const args = minimist(process.argv.slice(2));
const filePath = args.file;

if (filePath) {
    // Read data from file
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const seriesDataFromFile = JSON.parse(fileContent);

        // Validate required fields (basic validation)
        if (!seriesDataFromFile.series_text || !seriesDataFromFile.series_length || !seriesDataFromFile.teams || seriesDataFromFile.teams.length !== 2) {
            console.error("Invalid JSON structure in the provided file.");
            process.exit(1);
        }

        console.log(`Loaded series data from ${filePath}`);

        const initialData = {
            "series_txt": seriesDataFromFile.series_text,
            "length": parseInt(seriesDataFromFile.series_length),
            "teams": seriesDataFromFile.teams.map(team => ({
                "team": team.team,
                "name": team.name,
                "matches_won": parseInt(team.matches_won || 0), // Default matches_won to 0 if not present
                "logo": team.logo || "" // Default logo to empty string if not present
            }))
        };

        // Function to send initial data and start the update loop
        const startAfterFileLoad = () => {
            sendSeriesUpdate(initialData);
            console.log("Initial series data sent from file. Starting update prompt.");
            prompt.start(); // Start prompt for file mode
            runUpdateLoop(
                initialData.series_txt,
                initialData.length,
                initialData.teams[0].matches_won,
                initialData.teams[1].matches_won,
                initialData.teams[0].name,
                initialData.teams[1].name,
                initialData.teams[0].logo,
                initialData.teams[1].logo
            );
        };

        // Ensure websocket is ready before sending
        if (WsSubscribers.webSocketConnected) {
            startAfterFileLoad();
        } else {
            // Wait for websocket connection
            WsSubscribers.subscribe("ws", "open", startAfterFileLoad);
        }

    } catch (error) {
        console.error(`Error reading or parsing file ${filePath}:`, error);
        process.exit(1);
    }
} else {
    // Original prompt logic if no file path is provided
    //
    // Start the prompt
    //
    prompt.start();

    //
    // Get initial properties from the user:
    //
    prompt.get([
        // ... existing prompt schema ...
        {
            description: 'Series text (used in center of scoreboard)',
            name: 'series_text',
            required: true,
            default: "RANKED",
        },
        {
            description: "Series length",
            pattern: /^\d+$/,
            message: 'Must be a number',
            name: 'series_length',
            required: true,
            default: "5",
        },
        {
            description: 'Left team',
            name: 'left_team',
            required: true,
            default: "Blue",
        },
        {
            description: 'Left Team Logo',
            name: 'left_team_logo',
            required: false,
            default: "",
        },
        {
            description: 'Right team',
            name: 'right_team',
            required: true,
            default: "Orange",
        },
        {
            description: 'Right Team Logo',
            name: 'right_team_logo',
            required: false,
            default: "",
        },
    ], async function (e, r) {
        if (e) {
            console.error("Error getting initial prompt:", e);
            process.exit(1);
        }

        const initialData = {
            "series_txt": r.series_text,
            "length": parseInt(r.series_length),
            "teams": [
                {
                    "team": 0,
                    "name": r.left_team,
                    "matches_won": 0,
                    "logo": r.left_team_logo
                },
                {
                    "team": 1,
                    "name": r.right_team,
                    "matches_won": 0,
                    "logo": r.right_team_logo
                }
            ]
        };

        // Function to send initial data and start the update loop
        const startAfterInitialPrompt = () => {
            sendSeriesUpdate(initialData);
            console.log("Initial series data sent from prompt. Starting update prompt.");
            // prompt was already started
            runUpdateLoop(
                initialData.series_txt,
                initialData.length,
                initialData.teams[0].matches_won, // starts at 0
                initialData.teams[1].matches_won, // starts at 0
                initialData.teams[0].name,
                initialData.teams[1].name,
                initialData.teams[0].logo,
                initialData.teams[1].logo
            );
        };

        // Ensure websocket is ready before sending
        if (WsSubscribers.webSocketConnected) {
             startAfterInitialPrompt();
        } else {
            WsSubscribers.subscribe("ws", "open", startAfterInitialPrompt);
        }
    });
} // End of else block for prompt logic