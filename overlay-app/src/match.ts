import { WsSubscribers } from './wsSubscribers';
import { Player } from './types/player';
import { Game, GameStateData, GameTeam } from './types/game';
import { Series } from './types/series';
import { GameState, Stats } from './types/gameState';
import { Callback, pad } from './util/utils';
import { RCONN } from './RCONN';

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
      },
      {
        team: 1,
        name: 'Orange',
        matches_won: 0,
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

  RCONN?: RCONN = undefined;
  hiddenUI = false;

  constructor(
    ws: typeof WsSubscribers,
    RCONN?: RCONN,
    localplayer_support?: boolean
  ) {
    this.localplayer_support = localplayer_support || true;
    this.RCONN = RCONN || undefined;
    
    // When game is created before everyone has picked sides or specator roles
    ws.subscribe('game', 'match_created', () => {
      this.gameState.clockRunning = false;
      this.gameState.setState('pre-game-lobby');
      this.matchCreatedCallbacks.forEach((callback) => {
        callback();
      });
      this.hiddenUI = false;

      let games = Math.ceil(this.series.length / 2);
      if (
        this.series.teams[0].matches_won === games ||
        this.series.teams[1].matches_won === games
      ) {
        this.series.teams[0].matches_won = 0;
        this.series.teams[1].matches_won = 0;
      }
    });
    //ws.subscribe("game", "replay_created", (p) => { }); // Same as match_created but for replay

    // Game state updates happens as soon as match_created is fired and until match_destroyed is called.
    // How often this fires depends on the hook rate in the SOS plugin in bakkesmod
    // NOTE: Players are added/removed dynamically throughout game
    ws.subscribe('game', 'update_state', (p: GameStateData) => {
      this.HandleStateChange(p);
    });

    // Game is initialized and players have chosen a side. NOTE: This is the same as the first kick off countdown
    ws.subscribe('game', 'initialized', () => {
      this.gameState.clockRunning = false;
      this.gameState.setState('in-game');
      this.initializedCallbacks.forEach((callback) => {
        callback();
      });
    });

    // Kick off countdown
    ws.subscribe('game', 'pre_countdown_begin', () => {
      this.gameState.ballPossessions = [];
      this.gameState.fieldPositions = [];
      this.gameState.clockRunning = false;
      this.gameState.setState('in-game');
      this.preCountDownBeginCallbacks.forEach((callback) => {
        callback();
      });
    });
    ws.subscribe('game', 'post_countdown_begin', () => {
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
    ws.subscribe('game', 'round_started_go', () => {
      this.gameState.clockRunning = false;
      this.gameState.setState('in-game');
    });

    // Occurs when ball is hit
    ws.subscribe("game", "ball_hit", (p) => { 
      this.gameState.clockRunning = true;
    });

    // Fires when the clock starts ticking after any kick off
    //ws.subscribe("game", "clock_started", (p) => { });
    // Fired when the clock ends NOTE: this fires many times in a row so you will receive duplicates
    //ws.subscribe("game", "clock_stopped", (p) => { });
    // Fired when the seconds for the game are updated NOTE: it's better to read time from update_state than to depend on this
    ws.subscribe('game', 'clock_updated_seconds', () => {
      this.gameState.setState('in-game');
    });

    // When a goal is scored
    ws.subscribe('game', 'goal_scored', (p: unknown) => {
      this.gameState.clockRunning = false;
      this.onGoalScoredCallbacks.forEach((callback) => {
        callback(p);
      });
    });

    // When an in game replay from a goal is started
    ws.subscribe('game', 'replay_start', (p: unknown) => {
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
    ws.subscribe('game', 'replay_will_end', () => {
      this.gameState.clockRunning = false;
      for (const cb of this.replayWillEndCallbacks) {
        cb();
      }
    });

    // When an in game replay from a goal ends
    ws.subscribe('game', 'replay_end', () => {
      this.gameState.clockRunning = false;
      for (const cb of this.replayEndCallbacks) {
        cb();
      }
    });

    // When name of team winner is displayed on screen after game is over
    ws.subscribe('game', 'match_ended', (p: MatchEndData) => {
      this.gameState.clockRunning = false;
      this.gameState.setState('game-ended');
      this.series.teams[p.winner_team_num].matches_won += 1;
      for (const cb of this.gameEndCallbacks) {
        cb();
      }
    });

    // Celebration screen for winners podium after game ends
    ws.subscribe('game', 'podium_start', () => {
      this.gameState.clockRunning = false;
      this.gameState.setState('post-game');
      this.podiumCallbacks.forEach((callback) => {
        callback();
      });
    });

    // When match OR replay is destroyed
    ws.subscribe('game', 'match_destroyed', () => {
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
    ws.subscribe('game', 'series_update', (p: Series) => {
      this.series = p;
      for (const cb of this.seriesUpdateCallbacks) {
        cb(p);
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
      this.gameState.clockRunning = true;
      if (prev_time_sec) this.gameState.setState('in-game');
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
}
