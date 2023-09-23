import WebSocket from 'ws';
import prompt from 'prompt';

const WsSubscribers = {
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

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: username and email
//
prompt.get([
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

    WsSubscribers.send("game", "series_update", {
    "series_txt" : r.series_text,
    "length" : parseInt(r.series_length), 
    "teams": [
        {
        "team" : 0,
        "name" : r.left_team,
        "matches_won" : 0,
        "logo": r.left_team_logo
        },
        {
        "team" : 1,
        "name" : r.right_team,
        "matches_won" : 0,
        "logo": r.right_team_logo
        }
    ]
    });

    let left_score = 0;
    let right_score = 0;
    let left_team = r.left_team;
    let right_team = r.right_team;
    let left_team_logo = r.left_team_logo;
    let right_team_logo = r.right_team_logo;

    while(true)
    {
        let recieved_prompt = false;

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
                description: 'Right score',
                pattern: /^\d+$/,
                message: 'Must be a number',
                name: 'right_score',
                required: true,
                default: right_score,
            },
            {
                description: 'Right Team Logo',
                name: 'right_team_logo',
                required: false,
                default: right_team_logo,
            },
        ], 
        function (e, b) {
            recieved_prompt = true;
            left_score = b.left_score;
            right_score = b.right_score;
            left_team = b.left_team;
            right_team = b.right_team;
            WsSubscribers.send("game", "series_update", {
                "series_txt" : r.series_text,
                "length" : parseInt(r.series_length), 
                "teams": [
                    {
                    "team" : 0,
                    "name" : left_team,
                    "matches_won" : parseInt(left_score),
                    "logo": left_team_logo
                    },
                    {
                    "team" : 1,
                    "name" : right_team,
                    "matches_won" : parseInt(right_score),
                    "logo": right_team_logo
                    }
                ]
                });
        });

        while(!recieved_prompt)
        {
            await new Promise(r => setTimeout(r, 2000));
        }
    }
});