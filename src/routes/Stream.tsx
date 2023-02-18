import React from 'react';
import { PostGameStats, postGameGetState } from '../components/PostGameStats';
import { getState, Replay, ReplayState } from '../components/Replay';
import {
  getState as getScoreboardState,
  Scoreboard,
} from '../components/Scoreboard';
import {
  getState as getSpectatingState,
  Spectating,
} from '../components/Spectating';
import {
  getState as getTeamBoardState,
  TeamBoard,
} from '../components/Teamboard';
import { Match } from '../match';
import { GameStates } from '../types/gameState';
import { Callback } from '../utils';

interface StreamProps {
  match: Match;
}

interface StreamState {
  gamestate: GameStates;
  ScoreboardState: ReturnType<typeof getScoreboardState>;
  SpectatingState: ReturnType<typeof getSpectatingState>;
  TeamboardState: ReturnType<typeof getTeamBoardState>;
  ReplayState: ReplayState;
  PostGameStatsState: ReturnType<typeof postGameGetState>;
  display: boolean;
}

export class Stream extends React.PureComponent<StreamProps, StreamState> {
  match: Match;
  unsubscribers: Callback[] = [];

  constructor(props: StreamProps) {
    super(props);
    this.match = props.match;
    this.state = {
      gamestate: this.match.state.state,
      ScoreboardState: getScoreboardState(this.match),
      SpectatingState: getSpectatingState(this.match, undefined, undefined),
      TeamboardState: getTeamBoardState(this.match),
      ReplayState: getState(undefined),
      PostGameStatsState: postGameGetState(this.match, false),
      display: true,
    };
  }

  componentDidMount() {
    // Match Created - When game is created before everyone has picked sides or specator roles
    this.unsubscribers.push(
      this.match.OnMatchCreated(() => {
        this.setState({
          gamestate: this.match.state.state,
        });
      })
    );

    // OnFirstCountdown - When the first kick off of the game occurs
    this.unsubscribers.push(
      this.match.OnFirstCountdown(() => {
        this.setState({
          gamestate: this.match.state.state,
        });
      })
    );

    // OnCountdown - When a kickoff countdown occurs
    this.unsubscribers.push(
      this.match.OnCountdown(() => {
        this.setState({
          SpectatingState: getSpectatingState(
            this.match,
            'OnCountdown',
            this.state.SpectatingState
          ),
        });
      })
    );

    // OnTimeUpdated - When a time update is recieved
    this.unsubscribers.push(
      this.match.OnTimeUpdated(() => {
        // If we join in the middle of the match show the overlay
        if (this.match.state.state === 'in-game' && !this.state.display) {
          this.setState({
            gamestate: this.match.state.state,
            ScoreboardState: getScoreboardState(this.match),
          });
        } else {
          this.setState({ ScoreboardState: getScoreboardState(this.match) });
        }
      })
    );

    // OnPlayersUpdated - When players stats/properties have changed
    this.unsubscribers.push(
      this.match.OnPlayersUpdated((left, right) => {
        this.setState({
          TeamboardState: getTeamBoardState(this.match),
          PostGameStatsState: postGameGetState(this.match, false),
        });
      })
    );

    // OnSpecatorUpdated - When the spectated player changes
    this.unsubscribers.push(
      this.match.OnSpecatorUpdated((hasTarget, player) => {
        this.setState({
          TeamboardState: getTeamBoardState(this.match),
          SpectatingState: getSpectatingState(
            this.match,
            'OnSpecatorUpdated',
            this.state.SpectatingState
          ),
        });
      })
    );

    // OnInstantReplayStart - When an in game instant replay is started after a goal
    this.unsubscribers.push(
      this.match.OnInstantReplayStart(() => {
        this.setState({
          SpectatingState: getSpectatingState(
            this.match,
            'OnInstantReplayStart',
            this.state.SpectatingState
          ),
          ReplayState: getState({
            event: 'OnInstantReplayStart',
            prevState: this.state.ReplayState,
          }),
        });
      })
    );

    // OnInstantReplayEnd - When an in game instant replay is ended
    this.unsubscribers.push(
      this.match.OnInstantReplayEnd(() => {
        this.setState({
          ReplayState: getState({
            event: 'OnInstantReplayEnd',
            prevState: this.state.ReplayState,
          }),
        });
      })
    );

    // OnGoalScored - When a goal is scored
    this.unsubscribers.push(
      this.match.OnGoalScored((data) => {
        this.setState({
          ReplayState: getState({
            event: 'OnGoalScored',
            data,
            prevState: this.state.ReplayState,
          }),
        });
      })
    );

    // OnTeamsUpdated - When Team scores/names/colors are updated
    this.unsubscribers.push(
      this.match.OnTeamsUpdated((teams) => {
        this.setState({
          ScoreboardState: getScoreboardState(this.match),
          PostGameStatsState: postGameGetState(this.match, false),
        });
      })
    );

    // OnSeriesUpdate
    this.unsubscribers.push(
      this.match.OnSeriesUpdate((series) => {
        this.setState({
          ScoreboardState: getScoreboardState(this.match),
          PostGameStatsState: postGameGetState(this.match, false),
        });
      })
    );

    // OnGameEnded - When name of team winner is displayed on screen after game is over
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        this.setState({
          PostGameStatsState: postGameGetState(this.match, false),
        });
        setTimeout(() => {
          this.setState({
            gamestate: this.match.state.state,
          });
        }, 2990);
      })
    );

    // OnPodiumStart - Celebration screen for winners podium after game ends
    this.unsubscribers.push(
      this.match.OnPodiumStart(() => {
        setTimeout(() => {
          this.setState({
            gamestate: this.match.state.state,
            PostGameStatsState: postGameGetState(this.match, true),
          });
        }, 4700);
      })
    );

    // OnMatchEnded - When match is destroyed
    this.unsubscribers.push(
      this.match.OnMatchEnded(() => {
        this.setState({
          gamestate: this.match.state.state,
        });
      })
    );
  }

  componentWillUnmount() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render() {
    switch (this.state.gamestate) {
      case 'none':
      case 'pre-game-lobby':
        return <div className="overlay"></div>;

      case 'in-game':
        return (
          <div className="overlay">
            <Scoreboard {...this.state.ScoreboardState} />
            <TeamBoard {...this.state.TeamboardState} />
            <Spectating {...this.state.SpectatingState} />
            <Replay {...this.state.ReplayState} />
          </div>
        );

      case 'game-ended':
        return (
          <div className="overlay">
            <PostGameStats {...this.state.PostGameStatsState} />
          </div>
        );

      case 'post-game':
        return (
          <div className="overlay">
            <PostGameStats {...this.state.PostGameStatsState} />
          </div>
        );

      default:
        return (
          <div className="overlay">
            Display State not recognized: {this.state.display}
          </div>
        );
    }
  }
}
