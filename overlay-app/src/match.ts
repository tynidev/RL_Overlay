import { WsSubscribers as WsSubscribersObject } from './wsSubscribers';
import { Player } from './types/player';
import { Game, GameStateData, GameTeam } from './types/game';
import { Series } from './types/series';
import { GameState, Stats } from './types/gameState';
import { Callback, pad } from './util/utils';
import { RCONN } from './RCONN';
import { StatFeed, StatfeedEvent } from './types/statfeedEvent';
import { WsSubscribers } from './types/wsSubscribers'; // Import the interface

interface MatchEndData {
  winner_team_num: 0 | 1;
}

function areTeamsEqual(t1: GameTeam, t2: GameTeam): boolean{
  return (t1.color_primary === t2.color_primary &&
  t1.color_secondary === t2.color_secondary &&
  t1.name === t2.name &&
  t1.score === t2.score);
}

/**
 * Match - Class for handling all state related to a rocket league match
 */
export class Match {
  gameState = new GameState();

  localplayer_support = false;
  localPlayer?: Player;
  playerTarget?: Player;

  stats?: Stats;
  
  statfeeds = new Map<string,StatFeed[]>();

  /**
   * Series information
   */
  series: Series = {
    series_txt: 'ROCKET LEAGUE',
    length: 1,
    teams: [
      {
        team: 0,
        name: 'Blue',
        matches_won: 0,
        color_primary: '12,125,255', // Default blue RGB values
        color_secondary: '',
      },
      {
        team: 1,
        name: 'Orange',
        matches_won: 0,
        color_primary: '255, 130, 30', // Default orange RGB values
        color_secondary: '',
      },
    ],
  };

  // All callback arrays
  matchCreatedCallbacks: Callback[] = [];
  initializedCallbacks: Callback[] = [];
  teamUpdateCallbacks: Callback[] = [];
  playerUpdateCallbacks: Callback[] = [];
  spectatorUpdateCallbacks: Callback[] = [];
  timeUpdateCallbacks: Callback[] = [];
  preCountDownBeginCallbacks: Callback[] = [];
  onGoalScoredCallbacks: Callback[] = [];
  replayStartCallbacks: Callback[] = [];
  replayWillEndCallbacks: Callback[] = [];
  replayEndCallbacks: Callback[] = [];
  matchEndedCallbacks: Callback[] = [];
  teamsChangedCallbacks: Callback[] = [];
  gameEndCallbacks: Callback[] = [];
  podiumCallbacks: Callback[] = [];
  ballUpdateCallbacks: Callback[] = [];
  seriesUpdateCallbacks: ((s: Series) => void)[] = [];
  statfeedCallbacks: ((s: Map<string,StatFeed[]>) => void)[] = [];

  ws: WsSubscribers; // Use the interface type
  RCONN?: RCONN = undefined;
  hiddenUI = false;

  constructor(
    ws: WsSubscribers, // Use the interface type
    RCONN?: RCONN,
    localplayer_support?: boolean
  ) {
    this.ws = ws; // Store the instance
    this.localplayer_support = localplayer_support ?? true;
    this.RCONN = RCONN || undefined;
    
    // When game is created before everyone has picked sides or specator roles
    this.ws.subscribe('game', 'match_created', () => { // Use this.ws
      this.gameState.clockRunning = false;
      this.gameState.setState('pre-game-lobby');
      this.matchCreatedCallbacks.forEach((callback) => {
        callback();
      });
      this.hiddenUI = false;

      // Determines if a team has won the series, reset the match counters, and broadcasts the update to subscribers. 
      let games = Math.ceil(this.series.length / 2);
      if (
        this.series.teams[0].matches_won === games ||
        this.series.teams[1].matches_won === games
      ) {
        console.log(`Series over, resetting match counters for teams ${this.series.teams[0].name} and ${this.series.teams[1].name}`);
        this.series.teams[0].matches_won = 0;
        this.series.teams[1].matches_won = 0;
        this.ws.send("local", "series_update", this.series);
      }
    });
    //ws.subscribe("game", "replay_created", (p) => { }); // Same as match_created but for replay

    // Game state updates happens as soon as match_created is fired and until match_destroyed is called.
    // How often this fires depends on the hook rate in the SOS plugin in bakkesmod
    // NOTE: Players are added/removed dynamically throughout game
    this.ws.subscribe('game', 'update_state', (p: GameStateData) => { // Use this.ws
      this.HandleStateChange(p);
    });

    // Game is initialized and players have chosen a side. NOTE: This is the same as the first kick off countdown
    this.ws.subscribe('game', 'initialized', () => { // Use this.ws
      this.gameState.clockRunning = false;
      this.gameState.setState('in-game');
      this.initializedCallbacks.forEach((callback) => {
        callback();
      });
    });

    // Kick off countdown
    this.ws.subscribe('game', 'pre_countdown_begin', () => { // Use this.ws
      this.gameState.clockRunning = false;
      this.gameState.setState('in-game');
      this.preCountDownBeginCallbacks.forEach((callback) => {
        callback();
      });
    });
    this.ws.subscribe('game', 'post_countdown_begin', () => { // Use this.ws
      this.gameState.clockRunning = false;
      if (this.RCONN !== undefined && !this.hiddenUI) {
        this.RCONN.send('replay_gui hud 1');
        this.RCONN.send('replay_gui matchinfo 1');
        let r = this.RCONN;
        setTimeout(() => {
          r.send('replay_gui hud 0');
          r.send('replay_gui matchinfo 0');
        }, 500);
        this.hiddenUI = true;
      }
    });

    // Kick off countdown finished and cars are free to GO!!!!
    this.ws.subscribe('game', 'round_started_go', () => { // Use this.ws
      this.gameState.clockRunning = false;
      this.gameState.setState('in-game');
    });

    // Occurs when ball is hit
    this.ws.subscribe("game", "ball_hit", (_p: unknown) => { // Use unknown type for unused parameter
      this.gameState.clockRunning = true;
    });

    // Fires when the clock starts ticking after any kick off
    //ws.subscribe("game", "clock_started", (p) => { });
    // Fired when the clock ends NOTE: this fires many times in a row so you will receive duplicates
    //ws.subscribe("game", "clock_stopped", (p) => { });
    // Fired when the seconds for the game are updated NOTE: it's better to read time from update_state than to depend on this
    this.ws.subscribe('game', 'clock_updated_seconds', () => { // Use this.ws
      this.gameState.setState('in-game');
    });

    // When a goal is scored
    this.ws.subscribe('game', 'goal_scored', (p: unknown) => { // Use this.ws
      this.gameState.clockRunning = false;
      this.onGoalScoredCallbacks.forEach((callback) => {
        callback(p);
      });
    });

    // When an in game replay from a goal is started
    this.ws.subscribe('game', 'replay_start', (p: unknown) => { // Use this.ws
      this.gameState.ballPossessions = [];
      this.gameState.fieldPositions = [];
      this.gameState.possession = 0;
      this.gameState.fieldPosition =  0;
      this.gameState.clockRunning = false;
      // replay_start is sent twice one with json and one with plain text
      if (p !== 'game_replay_start')
        // skip json
        return;
      for (const cb of this.replayStartCallbacks) {
        cb();
      }
    });

    // When an in game replay from a goal is about to end
    this.ws.subscribe('game', 'replay_will_end', () => { // Use this.ws
      this.gameState.clockRunning = false;
      for (const cb of this.replayWillEndCallbacks) {
        cb();
      }
    });

    // When an in game replay from a goal ends
    this.ws.subscribe('game', 'replay_end', () => { // Use this.ws
      this.gameState.clockRunning = false;
      
      // clear out current stat feeds when replay ends
      this.statfeeds = new Map<string,StatFeed[]>();
      // call statfeed changed callbacks
      for (const cb of this.statfeedCallbacks) {
        cb(this.statfeeds);
      }

      // call callbacks
      for (const cb of this.replayEndCallbacks) {
        cb();
      }
    });

    // When name of team winner is displayed on screen after game is over
    this.ws.subscribe('game', 'match_ended', (p: MatchEndData) => { // Use this.ws
      this.gameState.clockRunning = false;
      this.gameState.setState('game-ended');
      this.series.teams[p.winner_team_num].matches_won += 1;
      this.ws.send("local", "series_update", this.series);
      for (const cb of this.gameEndCallbacks) {
        cb();
      }
    });

    // Celebration screen for winners podium after game ends
    this.ws.subscribe('game', 'podium_start', () => { // Use this.ws
      this.gameState.clockRunning = false;
      this.gameState.setState('post-game');
      this.podiumCallbacks.forEach((callback) => {
        callback();
      });
    });

    // When match OR replay is destroyed
    this.ws.subscribe('game', 'match_destroyed', () => { // Use this.ws
      this.gameState.reset();
      this.matchEndedCallbacks.forEach((callback) => {
        callback();
      });
      this.hiddenUI = false;
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
    this.ws.subscribe('game', 'series_update', (data: unknown) => { // Use this.ws
      console.log(`game.series_update received:`, data);
      
      // The data from websocket may be either direct series object or wrapped in a data property
      let seriesData: Series;
      
      if (data && typeof data === 'object' && 'data' in data) {
        // If data is wrapped in a data property (from WebSocket)
        const wrappedData = data as { data: Series };
        seriesData = wrappedData.data;
      } else {
        // Direct series object (from direct send)
        seriesData = data as Series;
      }
      
      this.handleSeriesUpdate(seriesData);
    });

    this.ws.subscribe('local', 'series_update', (data: unknown) => { // Use this.ws
      console.log(`local.series_update received:`, data);
      
      // The data from websocket may be either direct series object or wrapped in a data property
      let seriesData: Series;
      
      if (data && typeof data === 'object' && 'data' in data) {
        // If data is wrapped in a data property (from WebSocket)
        const wrappedData = data as { data: Series };
        seriesData = wrappedData.data;
      } else {
        // Direct series object (from direct send)
        seriesData = data as Series;
      }
      
      this.handleSeriesUpdate(seriesData);

      // send game update to any remote subscribers
      this.ws.send("game", "series_update", seriesData); // Use this.ws
    });

    // "game:statfeed_event": {
    //   "event_name": "string"
    //   "main_target": {
    //     "id": "string",
    //     "name": "string",
    //     "team_num": "number"
    //   },
    //   "secondary_target": {
    //     "id": "string",
    //     "name": "string",
    //     "team_num": "number"
    //   },
    //   "type": "string"
    // }
    this.ws.subscribe('game', 'statfeed_event', (p: StatfeedEvent) =>{ // Use this.ws
      var supportedEvent = false;
      switch(p.type){
        case 'Assist':
        case 'Demolition':
        case 'Epic Save':
        case 'Goal':
        case 'Save':
        case 'Shot on Goal':
          supportedEvent = true;
          break;
      }

      if(supportedEvent){

        let changed = false;
        if(!this.statfeeds.has(p.main_target.id)){
          this.statfeeds.set(p.main_target.id, [{stat:p,ttl:5}]);
          changed = true;
        }
        else{

          // we get multiple events for the same feed so filter duplicates
          let feeds = this.statfeeds.get(p.main_target.id);
          let found = false;
          for (let i = 0; i < feeds!.length; i++) {
            var stat = feeds![i].stat;
            if(stat.main_target.id !== p.main_target.id ||
               stat.secondary_target.id !== p.secondary_target.id ||
               stat.type !== p.type)
               continue;
            found = true;
            break;
          }

          if(!found){
            this.statfeeds.get(p.main_target.id)?.push({stat:p,ttl:5});
            changed = true;
          }
        }

        if(changed){
          for (const cb of this.statfeedCallbacks) {
            cb(this.statfeeds);
          }
        }
      }
    });
  }

  /***************************/
  /****  EVENT CALLBACKS  ****/
  /***************************/
  private handleCallback<T>(cb: T, getCallbacks: (m: Match) => T[]) {
    getCallbacks(this).push(cb);
    return (m: Match) => {
      const callbacks = getCallbacks(m);
      const index = callbacks.indexOf(cb);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * When game is created before everyone has picked sides or specator roles
   */
  OnMatchCreated(callback: Callback) {
    return this.handleCallback(callback, (m) => m.matchCreatedCallbacks);
  }

  /**
   * When the first kick off of the game occurs
   */
  OnFirstCountdown(callback: Callback) {
    return this.handleCallback(callback, (m) => m.initializedCallbacks);
  }

  /**
   * When a kickoff countdown occurs
   */
  OnCountdown(callback: Callback) {
    return this.handleCallback(callback, (m) => m.preCountDownBeginCallbacks);
  }

  /**
   * When Team scores/names/colors are updated
   */
  OnTeamsUpdated(callback: Callback) {
    return this.handleCallback(callback, (m) => m.teamUpdateCallbacks);
  }

  /**
   * When players stats/properties have changed
   */
  OnPlayersUpdated(callback: Callback) {
    return this.handleCallback(callback, (m) => m.playerUpdateCallbacks);
  }

  /**
   * When the spectated player or stats/properties of player have changed
   */
  OnSpecatorUpdated(callback: Callback) {
    return this.handleCallback(callback, (m) => m.spectatorUpdateCallbacks);
  }

  /**
   * When a time update is recieved
   */
  OnTimeUpdated(callback: Callback) {
    return this.handleCallback(callback, (m) => m.timeUpdateCallbacks);
  }

  /**
   * When team membership has changed and players have been added or removed
   */
  OnTeamsChanged(callback: Callback) {
    return this.handleCallback(callback, (m) => m.teamsChangedCallbacks);
  }

  /**
   * When a goal is scored
   */
  OnGoalScored(callback: Callback) {
    return this.handleCallback(callback, (m) => m.onGoalScoredCallbacks);
  }

  /**
   * When an in game instant replay is started
   */
  OnInstantReplayStart(callback: Callback) {
    return this.handleCallback(callback, (m) => m.replayStartCallbacks);
  }

  /**
   * When an in game instant replay is about to end
   */
  OnInstantReplayEnding(callback: Callback) {
    return this.handleCallback(callback, (m) => m.replayWillEndCallbacks);
  }

  /**
   * When an in game instant replay is ended
   */

  OnInstantReplayEnd(callback: Callback) {
    return this.handleCallback(callback, (m) => m.replayEndCallbacks);
  }

  /**
   * When a game is over
   */
  OnGameEnded(callback: Callback) {
    return this.handleCallback(callback, (m) => m.gameEndCallbacks);
  }

  /**
   * Celebration screen for winners podium after game ends
   */
  OnPodiumStart(callback: Callback) {
    return this.handleCallback(callback, (m) => m.podiumCallbacks);
  }

  /**
   * When the ball moves this callback is called
   */
  OnBallMove(callback: Callback) {
    return this.handleCallback(callback, (m) => m.ballUpdateCallbacks);
  }

  /**
   * When match is destroyed
   */
  OnMatchEnded(callback: Callback) {
    return this.handleCallback(callback, (m) => m.matchEndedCallbacks);
  }

  /**
   * When a series update is received
   */
  OnSeriesUpdate(callback: (s: Series) => void) {
    return this.handleCallback(callback, (m) => m.seriesUpdateCallbacks);
  }

  OnStatfeedEvent(callback: (s: Map<string,StatFeed[]>) => void){
    return this.handleCallback(callback, (m) => m.statfeedCallbacks);
  }

  public getGameTimeString(game?: Game): string {
    game ??= this.gameState.game;
    if (game === undefined) {
      return '5:00';
    }
    const prefix = game.isOT ? '+' : '';
    const sec = game.time_seconds % 60;
    const min = Math.floor(game.time_seconds / 60);
    return `${prefix}${min}:${pad(sec, 2)}`;
  }

  /***************************/
  /**** INTERNAL METHODS  ****/
  /***************************/

  HandleStateChange(param: GameStateData) {
    if (param.game.hasWinner)
      // if game is over don't handle any updates
      return;

    const game = param.game;
    const players = Object.values(param.players);
    const left = players.filter((p) => {
      return p.team === 0;
    });
    const right = players.filter((p) => {
      return p.team === 1;
    });

    // Call ballUpdateCallbacks on every update
    this.ballUpdateCallbacks.forEach(function (callback, index) {
      callback(game.ball);
    });

    // Call playerUpdateCallbacks on every update
    this.playerUpdateCallbacks.forEach(function (callback, index) {
      callback(left, right);
    });

    // Call spectatorUpdateCallbacks on every update
    if (this.localplayer_support) {
      this.localPlayer = players.filter((p) => {
        return p.name === game.localplayer;
      })[0];
      if (this.localPlayer) {
        // local player is playing.....
        this.playerTarget = this.localPlayer;
      } else {
        // local player is not playing so just see if game hasTarget
        this.playerTarget = param.players[game.target];
      }
    } else {
      this.localPlayer = undefined;
      this.playerTarget = param.players[game.target];
    }

    let localPlayer = this.localPlayer; // we set local variable since we can't access this inside foreach
    this.spectatorUpdateCallbacks.forEach(function (callback, index) {
      if (localPlayer) {
        callback(true, localPlayer);
      } else {
        callback(game.hasTarget, param.players[game.target]);
      }
    });

    // Call teamUpdateCallbacks on every update
    this.teamUpdateCallbacks.forEach(function (callback, index) {
      callback(game.teams);
    });

    // Has time changed?
    const prev_time_sec = this.gameState.game?.time_seconds;
    if (prev_time_sec !== game.time_seconds) {
      // time is running as it is changing
      this.gameState.clockRunning = true
      
      // if time has changed and we didn't have a previous time
      if (prev_time_sec){
        this.gameState.setState('in-game');
      }
      
      // Update statfeeds time to live every second of game time
      let changedStats = false;
      for (let [_pid, feeds] of this.statfeeds) { // Prefix unused variable with _
        // Iterate backwards through the array to safely remove elements
        for (let i = feeds.length - 1; i >= 0; i--) {
          feeds[i].ttl -= 1;
          
          if (feeds[i].ttl <= 0) {
            feeds.splice(i, 1);
            changedStats = true;
          }
        }
      }

      // call statfeed events if stats have changed
      if(changedStats){
        for (const cb of this.statfeedCallbacks) {
          cb(this.statfeeds);
        }
      }
      
      // call time update callbacks
      var game_time_str = this.getGameTimeString(game);
      for (const cb of this.timeUpdateCallbacks) {
        cb(game_time_str, game.time_seconds, game.isOT);
      }
    }

    // Compare teams
    const diff = this.gameState.computeTeamMemberChanges(left, right);

    if (!diff.equal) {
      // Fire team members changed if teams have changed
      for (const cb of this.teamsChangedCallbacks) {
        cb(left, right);
      }
    }

    this.gameState.update(game, left, right);
  }

  hasTeamStateChanged(prevTeams: GameTeam[], currTeams: GameTeam[]) {
    if (prevTeams === undefined && currTeams !== undefined) return true;
    return (
      !areTeamsEqual(prevTeams[0], currTeams[0]) ||
      !areTeamsEqual(prevTeams[1], currTeams[1])
    );
  }
  
  // Helper method to handle series updates from any source
  private handleSeriesUpdate(p: Series) {
    console.log(`Processing series update:`, p);
    
    if (!p) {
      console.error('Received invalid series data');
      return;
    }
    
    this.series.length = p.length ?? this.series.length;
    this.series.series_txt = p.series_txt ?? this.series.series_txt;
    
    if (p.teams && p.teams.length >= 2) {
      this.series.teams[0].name = p.teams[0].name ?? this.series.teams[0].name;
      this.series.teams[0].matches_won = 
        p.teams[0].matches_won !== undefined ? 
        p.teams[0].matches_won : 
        this.series.teams[0].matches_won;
      this.series.teams[0].team = p.teams[0].team ?? this.series.teams[0].team;
      this.series.teams[0].logo = p.teams[0].logo ?? this.series.teams[0].logo;
      this.series.teams[0].color_primary = p.teams[0].color_primary ?? this.series.teams[0].color_primary;
      this.series.teams[0].color_secondary = p.teams[0].color_secondary ?? this.series.teams[0].color_secondary;
  
      this.series.teams[1].name = p.teams[1].name ?? this.series.teams[1].name;
      this.series.teams[1].matches_won = 
        p.teams[1].matches_won !== undefined ? 
        p.teams[1].matches_won : 
        this.series.teams[1].matches_won;
      this.series.teams[1].team = p.teams[1].team ?? this.series.teams[1].team;
      this.series.teams[1].logo = p.teams[1].logo ?? this.series.teams[1].logo;
      this.series.teams[1].color_secondary = p.teams[1].color_secondary ?? this.series.teams[1].color_secondary;
      this.series.teams[1].color_primary = p.teams[1].color_primary ?? this.series.teams[1].color_primary;
      
      // Update CSS variables for team colors if they've been provided
      if (this.series.teams[0].color_primary) {
        document.documentElement.style.setProperty('--blue', this.series.teams[0].color_primary);
      }
      
      if (this.series.teams[1].color_primary) {
        document.documentElement.style.setProperty('--orange', this.series.teams[1].color_primary);
      }
    }
    
    console.log(`Series updated to:`, this.series);
    
    // Call all registered callbacks
    for (const cb of this.seriesUpdateCallbacks) {
      cb(this.series);
    }
  }
}
