# RL_Overlay
 Broadcasting overlay to use for streaming rocket league games.

![screen shot](/screenshot.png?raw=true "Overlay Example")

## Pre-requisites

- [Node.js](https://nodejs.org/en/) 
on windows in terminal run: `winget install OpenJS.NodeJS`
- [SOS-WS-Relay](https://github.com/tynidev/RL_Overlay/blob/main/sos-ws-relay/README.md)
Follow readme instructions to build/run
- [OBS](https://obsproject.com/download)
download from link and install then configure to stream rocket league

## Architecture
OBS must be run on the same machine as Rocket League in order to catpure the game but everything else (WS-Relay, Overlay Web Server, Overlay App) can be run on separate machines if preferred.

![image](https://user-images.githubusercontent.com/118381/221242728-42a86089-7e9a-43d0-945e-c946259baac5.png)

*NOTE: Overlay App is hosted by the Overlay Web Server which isn't shown in this diagram*

## HowTo Run Overlay App
### 1. Build Overlay Server (only need once OR on any changes)
In terminal:
1. `cd <project root>`
2. `npm install`
3. `npm run build`
4. `npm install -g serve` (only need step 4 once to install serve command for later)

### 2. Install SOS plugin & Run Rocket League
Steps 1-3 only needed once.
1. Copy `SOS.dll` to `%appdata%\bakkesmod\bakkesmod\plugins`
2. Copy `sos.set` to `%appdata%\bakkesmod\bakkesmod\plugins\settings`
3. Add new line `plugin load sos` to BakkesMod plugin load cfg at `%appdata%\bakkesmod\bakkesmod\cfg\plugins.cfg`

In the future just open Rocket League.

4. Run Rocket League

Video showing how to get SOS running 
https://www.youtube.com/watch?v=QE816DBuwI4

### 3. Build & Run ws-relay
[Original Documentation](https://github.com/tynidev/RL_Overlay/blob/main/sos-ws-relay/README.md)

To build run Step 1-3 in terminal.
1. `cd <project root>\sos-ws-relay`
2. `npm install websocket`
3. `npm install`

To run ws-ovleray complete step 4 in terminal.

4. `node ws-relay.js`

### 4. Run Overlay Server
In terminal:
1. `cd <project root>`
2. `serve -s build`

### 5. Add Overlay App as Browser source to OBS
1. Add new source of type Browser to OBS Scene
2. Configure source as follows:

![image](https://user-images.githubusercontent.com/118381/220740126-cbef0e81-4d6f-45be-90e4-c4cd0cf7b544.png)

3. Size Source to OBS canvas

## Extras
### ButtonMash.dll
This is a BakkesMod plugin that automatically joins matches as specator.  Install following the same steps as the SOS plugin and then enable in game in the BakkesMod settings UI accesible via F2.

### RCONN connection to Rocket League
The Overlay App can be configured to connect to Rocket League through a remote connection or RCONN plugin in BakkesMod and execute commands to automatically hide the UI elements when a match starts.

Steps to configure:
1. Get RCONN password located in file `%appdata%\bakkesmod\bakkesmod\cfg\config.cfg`. Look for line that starts with `rcon_password` and take the following value.
2. Add `.env` file at `<project root>` and add text `REACT_APP_RCONN_PASS = <rconn password from step 1>`  to the file on its own line.
