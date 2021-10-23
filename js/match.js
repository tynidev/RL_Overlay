function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }

  /**
   * Match - Class for handling all state related to a rocket league match
   */
class Match {

    // Last game state recorded
    game = {};

    // Last left team recorded
    left = [];

    // Last right team recorded
    right = [];

    // All callback arrays
    matchCreatedCallbacks = [];
    initializedCallbacks = [];
    teamUpdateCallbacks = [];
    playerUpdateCallbacks = [];
    spectatorUpdateCallbacks = [];
    timeUpdateCallbacks = [];
    preCountDownBeginCallbacks = [];
    onGoalScoredCallbacks = [];
    replayStartCallbacks = [];
    replayWillEndCallbacks = [];
    replayEndCallbacks = [];
    matchEndedCallbacks = [];
    teamsChangedCallbacks = [];
    gameEndCallbacks = [];
    podiumCallbacks = [];

    /**
     * Constructor
     * @param {WebSocket client} ws 
     */
    constructor(ws) {
        // When game is created before everyone has picked sides or specator roles
        ws.subscribe("game", "match_created", (p) => { 
            this.game = {};
            this.left = [];
            this.right = [];
            this.matchCreatedCallbacks.forEach((callback) => { callback(); });
        });
        //ws.subscribe("game", "replay_created", (p) => { }); // Same as match_created but for replay

        // Game state updates happens as soon as match_created is fired and until match_destroyed is called. 
        // How often this fires depends on the hook rate in the SOS plugin in bakkesmod
        // NOTE: Players are added/removed dynamically throughout game
        ws.subscribe("game", "update_state", (p) => { this.HandleStateChange(p) });

        // Game is initialized and players have chosen a side. NOTE: This is the same as the first kick off countdown
        ws.subscribe("game", "initialized", (p) => { 
            this.initializedCallbacks.forEach((callback) => { callback(); });
        });

        // Kick off countdown
        ws.subscribe("game", "pre_countdown_begin", (p) => { 
            this.preCountDownBeginCallbacks.forEach((callback) => { callback(); });
        });
        //ws.subscribe("game", "post_countdown_begin", (p) => { this.post_countdown_begin(p) }); // duplicate of pre_countdown_begin

        // Kick off countdown finished and cars are free to GO!!!!
        ws.subscribe("game", "round_started_go", (p) => {  });

        // Occurs when ball is hit
        //ws.subscribe("game", "ball_hit", (p) => { });

        // Fires when the clock starts ticking after any kick off
        //ws.subscribe("game", "clock_started", (p) => { });
        // Fired when the clock ends NOTE: this fires many times in a row so you will receive duplicates
        //ws.subscribe("game", "clock_stopped", (p) => { });
        // Fired when the seconds for the game are updated NOTE: it's better to read time from update_state than to depend on this
        //ws.subscribe("game", "clock_updated_seconds", (p) => { });

        // When a goal is scored
        ws.subscribe("game", "goal_scored", (p) => { 
            this.onGoalScoredCallbacks.forEach((callback) => { callback(); });
        });

        // When an in game replay from a goal is started
        ws.subscribe("game", "replay_start", (p) => { 
             // replay_start is sent twice one with json and one with plain text
            if(p == "game_replay_start") // skip plain text
                return;
            this.replayStartCallbacks.forEach((callback) => { callback(); });
        });

        // When an in game replay from a goal is about to end
        ws.subscribe("game", "replay_will_end", (p) => { 
            this.replayWillEndCallbacks.forEach((callback) => { callback(); });
        });

        // When an in game replay from a goal ends
        ws.subscribe("game", "replay_end", (p) => { 
            this.replayEndCallbacks.forEach((callback) => { callback(); });
        });

        // When name of team winner is displayed on screen after game is over
        ws.subscribe("game", "match_ended", (p) => { 
            this.gameEndCallbacks.forEach((callback) => { callback(); });
        });

        // Celebration screen for winners podium after game ends
        ws.subscribe("game", "podium_start", (p) => { 
            this.podiumCallbacks.forEach((callback) => { callback(); });
        });

        // When match OR replay is destroyed
        ws.subscribe("game", "match_destroyed", (p) => { 
            this.matchEndedCallbacks.forEach((callback) => { callback(); });
        });
    }
    
    /***************************/
    /****  EVENT CALLBACKS  ****/
    /***************************/

    /**
     * When game is created before everyone has picked sides or specator roles
     * @param {Callback to call when event fires} callback 
     */
    OnGameCreated(callback){
        this.matchCreatedCallbacks.push(callback);
    }

    /**
     * When the first kick off of the game occurs
     * @param {Callback to call when event fires} callback 
     */
    OnFirstCountdown(callback){
        this.initializedCallbacks.push(callback);
    }

    /**
     * When a kickoff countdown occurs
     * @param {Callback to call when event fires} callback 
     */
    OnCountdown(callback){
        this.preCountDownBeginCallbacks.push(callback);
    }

    /**
     * When Team scores/names/colors are updated
     * @param {Callback to call when event fires} callback 
     */
    OnTeamsUpdated(callback){
        this.teamUpdateCallbacks.push(callback);
    }

    /**
     * When players stats/properties have changed
     * @param {Callback to call when event fires} callback 
     */
    OnPlayersUpdated(callback){
        this.playerUpdateCallbacks.push(callback);
    }

    /**
     * When the spectated player or stats/properties of player have changed
     * @param {Callback to call when event fires} callback 
     */
    OnSpecatorUpdated(callback){
        this.spectatorUpdateCallbacks.push(callback);
    }

    /**
     * When a time update is recieved
     * @param {Callback to call when event fires} callback 
     */
    OnTimeUpdated(callback){
        this.timeUpdateCallbacks.push(callback);
    }

    /**
     * When team membership has changed and players have been added or removed
     * @param {Callback to call when event fires} callback 
     */
    OnTeamsChanged(callback){
        this.teamsChangedCallbacks.push(callback);
    }

    /**
     * When a goal is scored
     * @param {Callback to call when event fires} callback 
     */
    OnGoalScored(callback){
        this.onGoalScoredCallbacks.push(callback);
    }

    /**
     * When an in game instant replay is started
     * @param {Callback to call when event fires} callback 
     */
    OnInstantReplayStart(callback){
        this.replayStartCallbacks.push(callback);
    }

    /**
     * When an in game instant replay is about to end
     * @param {Callback to call when event fires} callback 
     */
    OnInstantReplayEnding(callback){
        this.replayWillEndCallbacks.push(callback);
    }

    /**
     * When an in game instant replay is ended
     * @param {Callback to call when event fires} callback 
     */

    OnInstantReplayEnd(callback){
        this.replayEndCallbacks.push(callback);
    }

    /**
     * When a game is over
     * @param {Callback to call when event fires} callback 
     */
    OnGameEnded(callback){
        this.gameEndCallbacks.push(callback);
    }

    /**
     * Celebration screen for winners podium after game ends
     * @param {Callback to call when event fires} callback 
     */
    OnPodiumStart(callback){
        this.podiumCallbacks.push(callback);
    }

    /***************************/
    /**** INTERNAL METHODS  ****/
    /***************************/

    HandleStateChange(param){
        var game = param.game;
        var players = Object.values(param.players);
        let left = players.filter((p) => { return p.team == 0 });
        let right = players.filter((p) => { return p.team == 1 });
        
        this.teamUpdateCallbacks.forEach(function (callback, index) {
            callback(game.teams);
        });

        this.playerUpdateCallbacks.forEach(function (callback, index) {
            callback(left, right);
        });

        this.spectatorUpdateCallbacks.forEach(function (callback, index) {
            var player = game.hasTarget ? param.players[game.target] : players.filter((p) => { return p.name == game.localplayer })[0];
            callback(true, player);
        });

        this.timeUpdateCallbacks.forEach(function (callback, index) {
            
            let seconds = game.time_seconds % 60;
            let min = Math.floor(game.time_seconds / 60);

            callback((game.isOT ? "+" : "") + min + ":" + pad(seconds, 2));
        });

        // Compare teams
        var diff = this.CompareTeams(this.left, this.right, left, right);

        if(!diff.equal){ // Fire team members changed if teams have changed
            this.teamsChangedCallbacks.forEach(function(callback, index) {
                callback(left, right);
            });
        }

        // Replace old state with new state
        this.game = game;
        this.left = left;
        this.right = right;
    }

    CompareTeams(prevLeft, prevRight, currentLeft, currentRight)
    {
        var newLeft = currentLeft.filter((p1) => {
            return prevLeft.filter((p2) => { return p2.id == p1.id; }).length === 0;
        });
        var newRight = currentRight.filter((p1) => {
            return prevRight.filter((p2) => { return p2.id == p1.id; }).length === 0;
        });
        var removeLeft = prevLeft.filter((p1) => {
            return currentLeft.filter((p2) => { return p2.id == p1.id; }).length === 0;
        });
        var removeRight = prevRight.filter((p1) => {
            return currentRight.filter((p2) => { return p2.id == p1.id; }).length === 0;
        });

        return { 
            'equal' : newLeft.length == 0 && newRight.length == 0 && removeLeft.length == 0 && removeRight.length == 0,
            'add' : { 
                'left' : newLeft, 
                'right' : newRight
            }, 
            'remove' : {
                'left' : removeLeft, 
                'right' : removeRight
            }
        };
    }
  }