# RL_Overlay
 Broadcasting overlay to use for streaming rocket league games.

![screen shot](/screenshot.png?raw=true "Overlay Example")

## Pre-requisites

- [Node.js](https://nodejs.org/en/) 
on windows in terminal run: `winget install OpenJS.NodeJS`
- [OBS](https://obsproject.com/download)
download from link and install then configure to stream rocket league

## HowTo Run Overlay
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
[Original Documentation](https://gitlab.com/bakkesplugins/sos/sos-ws-relay/-/blob/master/README.md)

To build run Step 1-3 in terminal.
1. `cd <ws-relay root>`
2. `npm install websocket`
3. `npm install`

To run ws-ovleray complete step 4 in terminal.

4. `node ws-relay.js`

### 4. Run Overlay Server
In terminal:
1. `cd <project root>`
2. `serve -s build`

### 5. Add Browser source to OBS
1. Add new source of type Browser to OBS Scene
2. Configure source as follows:

![image](https://user-images.githubusercontent.com/118381/220740126-cbef0e81-4d6f-45be-90e4-c4cd0cf7b544.png)

3. Size Source to OBS canvas
