# RL_Overlay
 Broadcasting overlay to use for streaming rocket league games.

![screen shot](/screenshot.png?raw=true "Overlay Example")

## Pre-requisites

- [Node.js](https://nodejs.org/en/) `winget install OpenJS.NodeJS`
- npm install websocket
- https://gitlab.com/bakkesplugins/sos/sos-plugin/-/releases 
- https://gitlab.com/bakkesplugins/sos/sos-ws-relay

## HowTo Run Overlay
### 1. Build Overlay Server (only need once OR on any changes)
1. `cd \<project root\>`
2. `npm install`
3. `npm run build`
4. `npm install -g serve` (only need step 4 once to install serve command for later)

### 2. Install SOS plugin & Run Rocket League
Steps 1-2 only needed once. In the future just open Rocket League.
1. Copy `SOS.dll` to BakkesMod plugin directory
2. Copy `sos.set` to BakkesMod plugin settings directory
3. Add SOS to BakkesMod plugin load cfg
4. Run Rocket League

Video showing how to get SOS running 
https://www.youtube.com/watch?v=QE816DBuwI4

### 3. Build & Run ws-relay
[Original Documentation](https://gitlab.com/bakkesplugins/sos/sos-ws-relay/-/blob/master/README.md)

To build run Step 1-2 in terminal.
1. `cd \<ws-relay root\>`
2. `npm install`

To run ws-ovleray complete step 3 in terminal.

3. `node ws-relay.js`

### 4. Run Overlay Server
In terminal:
1. `cd \<project root\>`
2. `serve -s build`

### 5. Add Browser source to OBS
1. Add new source of type Browser to OBS Scene
2. Configure source as follows:![image](https://user-images.githubusercontent.com/118381/220740126-cbef0e81-4d6f-45be-90e4-c4cd0cf7b544.png)
3. Size Source to OBS canvas
