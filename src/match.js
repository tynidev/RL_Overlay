import Stats from "./stats"

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

    localplayer_support = false;

    timeStarted = false;

    stats = new Stats();

    spectating = true;

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
    ballUpdateCallbacks = [];
    seriesUpdateCallbacks = [];

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
            this.stats = new Stats();
            this.timeStarted = false;
            this.spectating = true;
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
        ws.subscribe("game", "clock_updated_seconds", (p) => { 
            this.timeStarted = true;
        });

        // When a goal is scored
        ws.subscribe("game", "goal_scored", (p) => { 
            this.onGoalScoredCallbacks.forEach((callback) => { callback(p); });
        });

        // When an in game replay from a goal is started
        ws.subscribe("game", "replay_start", (p) => { 
             // replay_start is sent twice one with json and one with plain text
            if(p === "game_replay_start") // skip plain text
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
            this.game = {};
            this.left = [];
            this.right = [];
            this.stats = new Stats();
            this.timeStarted = false;
            this.spectating = true;
            this.matchEndedCallbacks.forEach((callback) => { callback(); });
        });

        // When we get a series update
        // Example:
        // {
        //     "series_txt" : "CEA | Week 1",
        //     "length" : 5, 
        //     "teams": [
        //         {
        //         "team" : 0,
        //         "name" : "Blue",
        //         "matches_won" : 0
        //         },
        //         {
        //         "team" : 1,
        //         "name" : "Orange",
        //         "matches_won" : 0
        //         }
        //     ]
        // }
        ws.subscribe("game", "series_update", (p) => { 
            this.seriesUpdateCallbacks.forEach((callback) => { callback(p); });
        });
    }
    
    /***************************/
    /****  EVENT CALLBACKS  ****/
    /***************************/

    /**
     * When game is created before everyone has picked sides or specator roles
     * @param {Callback to call when event fires} callback 
     */
    OnMatchCreated(callback){
        this.matchCreatedCallbacks.push(callback);
        return function(match) {
            const index = match.matchCreatedCallbacks.indexOf(callback);
            if (index > -1) {
                match.matchCreatedCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When the first kick off of the game occurs
     * @param {Callback to call when event fires} callback 
     */
    OnFirstCountdown(callback){
        this.initializedCallbacks.push(callback);
        return function(match) {
            const index = match.initializedCallbacks.indexOf(callback);
            if (index > -1) {
                match.initializedCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When a kickoff countdown occurs
     * @param {Callback to call when event fires} callback 
     */
    OnCountdown(callback){
        this.preCountDownBeginCallbacks.push(callback);
        return function(match) {
            const index = match.preCountDownBeginCallbacks.indexOf(callback);
            if (index > -1) {
                match.preCountDownBeginCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When Team scores/names/colors are updated
     * @param {Callback to call when event fires} callback 
     */
    OnTeamsUpdated(callback){
        this.teamUpdateCallbacks.push(callback);
        return function(match) {
            const index = match.teamUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                match.teamUpdateCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When players stats/properties have changed
     * @param {Callback to call when event fires} callback 
     */
    OnPlayersUpdated(callback){
        this.playerUpdateCallbacks.push(callback);
        return function(match) {
            const index = match.playerUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                match.playerUpdateCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When the spectated player or stats/properties of player have changed
     * @param {Callback to call when event fires} callback 
     */
    OnSpecatorUpdated(callback){
        this.spectatorUpdateCallbacks.push(callback);
        return function(match) {
            const index = match.spectatorUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                match.spectatorUpdateCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When a time update is recieved
     * @param {Callback to call when event fires} callback 
     */
    OnTimeUpdated(callback){
        this.timeUpdateCallbacks.push(callback);
        return function(match) {
            const index = match.timeUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                match.timeUpdateCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When team membership has changed and players have been added or removed
     * @param {Callback to call when event fires} callback 
     */
    OnTeamsChanged(callback){
        this.teamsChangedCallbacks.push(callback);
        return function(match) {
            const index = match.teamsChangedCallbacks.indexOf(callback);
            if (index > -1) {
                match.teamsChangedCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When a goal is scored
     * @param {Callback to call when event fires} callback 
     */
    OnGoalScored(callback){
        this.onGoalScoredCallbacks.push(callback);
        return function(match) {
            const index = match.onGoalScoredCallbacks.indexOf(callback);
            if (index > -1) {
                match.onGoalScoredCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When an in game instant replay is started
     * @param {Callback to call when event fires} callback 
     */
    OnInstantReplayStart(callback){
        this.replayStartCallbacks.push(callback);
        return function(match) {
            const index = match.replayStartCallbacks.indexOf(callback);
            if (index > -1) {
                match.replayStartCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When an in game instant replay is about to end
     * @param {Callback to call when event fires} callback 
     */
    OnInstantReplayEnding(callback){
        this.replayWillEndCallbacks.push(callback);
        return function(match) {
            const index = match.replayWillEndCallbacks.indexOf(callback);
            if (index > -1) {
                match.replayWillEndCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When an in game instant replay is ended
     * @param {Callback to call when event fires} callback 
     */

    OnInstantReplayEnd(callback){
        this.replayEndCallbacks.push(callback);
        return function(match) {
            const index = match.replayEndCallbacks.indexOf(callback);
            if (index > -1) {
                match.replayEndCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When a game is over
     * @param {Callback to call when event fires} callback 
     */
    OnGameEnded(callback){
        this.gameEndCallbacks.push(callback);
        return function(match) {
            const index = match.gameEndCallbacks.indexOf(callback);
            if (index > -1) {
                match.gameEndCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * Celebration screen for winners podium after game ends
     * @param {Callback to call when event fires} callback 
     */
    OnPodiumStart(callback){
        this.podiumCallbacks.push(callback);
        return function(match) {
            const index = match.podiumCallbacks.indexOf(callback);
            if (index > -1) {
                match.podiumCallbacks.splice(index, 1);
            }
         };
    }

    /**
     * When the ball moves this callback is called
     * @param {Callback to call when event fires} callback 
     */
    OnBallMove(callback){
        this.ballUpdateCallbacks.push(callback);
        return function(match) {
            const index = match.ballUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                match.ballUpdateCallbacks.splice(index, 1);
            }
         };
    }
    
    /**
     * When match is destroyed
     * @param {Callback to call when event fires} callback 
     */
    OnMatchEnded(callback){
        this.matchEndedCallbacks.push(callback);
        return function(match) {
            const index = match.matchEndedCallbacks.indexOf(callback);
            if (index > -1) {
                match.matchEndedCallbacks.splice(index, 1);
            }
         };
    }
    
    /**
     * When a series update is received
     * @param {Callback to call when event fires} callback 
     */
    OnSeriesUpdate(callback){
        this.seriesUpdateCallbacks.push(callback);
        return function(match) {
            const index = match.seriesUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                match.seriesUpdateCallbacks.splice(index, 1);
            }
         };
    }

    /***************************/
    /**** INTERNAL METHODS  ****/
    /***************************/

    HandleStateChange(param){
        if(param.game.hasWinner) // if game is over don't handle any updates
            return;

        var game = param.game;
        var players = Object.values(param.players);
        let left = players.filter((p) => { return p.team === 0 });
        let right = players.filter((p) => { return p.team === 1 });
        
        // Call ballUpdateCallbacks on every update
        this.ballUpdateCallbacks.forEach(function(callback, index) {
            callback(game.ball);
        });

        // Call playerUpdateCallbacks on every update
        this.playerUpdateCallbacks.forEach(function (callback, index) {
            callback(left, right);
        });

        // Call spectatorUpdateCallbacks on every update
        var localPlayer = undefined;
        if(this.localplayer_support)
        {
            localPlayer = players.filter((p) => { return p.name === game.localplayer })[0];
            if(localPlayer)
            {
                // local player is playing.....
                this.spectating = false;
            }
            else
            {
                // local player is not playing so just see if game hasTarget
                this.spectating = game.hasTarget;
            }
        }

        this.spectatorUpdateCallbacks.forEach(function (callback, index) {
            if(localPlayer){
                callback(true, localPlayer, true);
            }else{
                callback(game.hasTarget, param.players[game.target], false);
            }
        });

        // Call teamUpdateCallbacks on every update
        this.teamUpdateCallbacks.forEach(function (callback, index) {
            callback(game.teams);
        });

        // Has time changed?
        if(this.game.time_seconds !== game.time_seconds){
            if(this.game.time_seconds)
                this.timeStarted = true;
            this.timeUpdateCallbacks.forEach(function (callback, index) {
                
                let seconds = game.time_seconds % 60;
                let min = Math.floor(game.time_seconds / 60);

                callback((game.isOT ? "+" : "") + min + ":" + pad(seconds, 2), game.time_seconds, game.isOT);
            });
        }

        // Compare teams
        var diff = this.ComputeTeamMemberChanges(this.left, this.right, left, right);
        if(!diff.equal){ // Fire team members changed if teams have changed
            this.teamsChangedCallbacks.forEach(function(callback, index) {
                callback(left, right);
            });
        }

        this.stats.Record({
            'prev' : {
                'game': this.game,
                'left' : this.left,
                'right' : this.right
            },
            'curr' : {
                'game': game,
                'left' : left,
                'right' : right
            }
        });

        // Replace old state with new state
        this.game = game;
        this.left = left;
        this.right = right;
    }

    TeamsEqual(t1, t2)
    {
        return t1.color_primary === t2.color_primary && 
               t1.color_secondary === t2.color_secondary && 
               t1.name === t2.name && 
               t1.score === t2.score;
    }

    HasTeamStateChanged(prevTeams, currTeams)
    {
        if(prevTeams === undefined && currTeams !== undefined)
            return true;
        return !this.TeamsEqual(prevTeams[0], currTeams[0]) || !this.TeamsEqual(prevTeams[1], currTeams[1]);
    }

    ComputeTeamMemberChanges(prevLeft, prevRight, currentLeft, currentRight)
    {
        var newLeft = currentLeft.filter((p1) => {
            return prevLeft.filter((p2) => { return p2.id === p1.id; }).length === 0;
        });
        var newRight = currentRight.filter((p1) => {
            return prevRight.filter((p2) => { return p2.id === p1.id; }).length === 0;
        });
        var removeLeft = prevLeft.filter((p1) => {
            return currentLeft.filter((p2) => { return p2.id === p1.id; }).length === 0;
        });
        var removeRight = prevRight.filter((p1) => {
            return currentRight.filter((p2) => { return p2.id === p1.id; }).length === 0;
        });

        return { 
            'equal' : newLeft.length === 0 && newRight.length === 0 && removeLeft.length === 0 && removeRight.length === 0,
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

  export default Match;