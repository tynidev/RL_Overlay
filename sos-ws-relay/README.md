# SOS-WS-Relay
SOS-WS-Relay is a special rebroadcasting application that handles communications between specially coded overlays
and remote control boards. Incoming websocket communications are rebroadcast on all connections except the
one it came on, minimizing self-reaction to events for control boards and overlays. 

### Installation
- Install NodeJS (preferably an LTS build which is the default when downloading from the NodeJS website)
- Download this repository and extract it to a folder that you can find again
- In a command prompt that's pointed at the root of this directory:
  1. `npm install`
  2. `node ws-relay.js`
    - This will run the server. Once you get a prompt saying `"Opened WebSocket server on port XXXXX"`, you are good to go.
    Simply minimize the window and forget about it

### Configuration
By default, the relay runs on `ws://localhost:49322`.

Run the command `npm run relay` if you're a direct user. You will be prompted to enter options manually if needed.

#### Command Line Options
If you're a developer wanting to implement the server programmatically or a power user, there are some configuration options
available from the command line:
```json
{
  "port": 123,
  "delay": 321,
  "rocketLeagueHost": "127.0.0.1::49322",
  "timeout": 10000
}
```

Usage:
```
> node ws-relay.js --port=123 --delay=321 --rocketLeagueHost="127.0.0.1::49322"
```
If you are launching the server programmatically, you may also need a timeout in-case there was an issue with the 
input you gave. For example, the prompt module will reject non-numbers for the `port` and `delay` options and will
prompt via stdin (or user input). Using the `--timeout` option allows you to have the software automatically exit
after a set period of time if the prompt checks haven't been passed.

The following example will automatically exit after 10 seconds if the prompts have not
been answered::
```
> node ws-relay.js --timeout=10000
// Output: Prompts not completed within timeout limit (10000ms). Exiting
```