# RL_Overlay
 Broadcasting overlay to use for streaming rocket league games.

![image](https://user-images.githubusercontent.com/118381/221255286-2634bf16-71b2-445c-9756-69698ab924ab.png)

## Pre-requisites
- [BakkesMod](https://bakkesmod.com/)
- [OBS](https://obsproject.com/download)
download from link and install then configure to stream rocket league

Note: The following pre-reqs are installed via the `install.ps1` script
- [Node.js](https://nodejs.org/en/) 
- SOS Bakkes Plugin - sends game data out on websocket
- [SOS-WS-Relay](https://github.com/tynidev/RL_Overlay/blob/main/sos-ws-relay/README.md) - recieves and relays game data


## Architecture
OBS must be run on the same machine as Rocket League in order to catpure the game but everything else (WS-Relay, Overlay Web Server, Overlay App) can be run on separate machines if preferred.

![image](https://user-images.githubusercontent.com/118381/221242728-42a86089-7e9a-43d0-945e-c946259baac5.png)

*NOTE: Overlay App is hosted by the Overlay Web Server which isn't shown in this diagram*

## How to Install\Build

Make sure BakkesMod is installed then in powershell window run:
1. `cd <project root>`
2. `.\install.ps1` - will also create shortcuts for next steps

## How to Setup and run Test

1. Double click shortcut `SOS-WS-Relay` and follow prompts entering default values
2. Double click shortcut `Overlay-Server`
3. In OBS add new source of type Browser to OBS Scene
4. Configure source as follows:

![image](https://user-images.githubusercontent.com/118381/220740126-cbef0e81-4d6f-45be-90e4-c4cd0cf7b544.png)

5. Size Source to OBS canvas
6. Double click shortcut `Test-Game`

If test is successful then in the future you only need to start RocketLeague and run steps 1 and 2 to setup your stream.

## Manual Instructions (Case you like to do it yourself)
### 1. Build Overlay Server (only need once OR on any changes)
In terminal:
1. `cd <project root>\overlay-app`
2. `npm install`
3. `npm run build`
4. `npm install -g serve` (only need step 4 once to install serve command for later)

### 2. Install SOS plugin & Run Rocket League
Steps 1-3 only needed once.
1. Copy `<project root>\bakkes-plugins\SOS.dll` to `%appdata%\bakkesmod\bakkesmod\plugins`
2. Copy `<project root>\bakkes-plugins\sos.set` to `%appdata%\bakkesmod\bakkesmod\plugins\settings`
3. Add new line `plugin load sos` to BakkesMod plugin load cfg at `%appdata%\bakkesmod\bakkesmod\cfg\plugins.cfg`

In the future just open Rocket League.

4. Run Rocket League

Video showing how to get SOS running 
https://www.youtube.com/watch?v=QE816DBuwI4

### 3. Build & Run ws-relay
[Original Documentation](https://github.com/tynidev/RL_Overlay/blob/main/sos-ws-relay/README.md)

To build run Step 1-2 in terminal.
1. `cd <project root>\sos-ws-relay`
2. `npm install`

To run ws-ovleray complete step 3 in terminal.

3. `node ws-relay.js`

### 4. Run Overlay Server
In terminal:
1. `cd <project root>\overlay-app`
2. For production run: `serve -s build` OR for testing/developing run: `npm start`

## Extras
### ButtonMash.dll
The file `<project root>\bakkes-plugins\ButtonMash.dll` is a BakkesMod plugin that automatically joins matches as specator.  Install following the same steps as the SOS plugin and then enable in game in the BakkesMod settings UI accesible via F2.

### RCONN connection to Rocket League
The Overlay App can be configured to connect to Rocket League through a remote connection or RCONN plugin in BakkesMod and execute commands to automatically hide the UI elements when a match starts.

Steps to configure:
1. Get RCONN password located in file `%appdata%\bakkesmod\bakkesmod\cfg\config.cfg`. Look for line that starts with `rcon_password` and take the following value.
2. Add `.env` file at `<project root>\overlay-app` and add text `REACT_APP_RCONN_PASS = <rconn password from step 1>`  to the file on its own line.
