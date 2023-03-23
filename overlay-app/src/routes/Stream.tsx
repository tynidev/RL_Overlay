import React, { FC, useEffect, useState } from 'react';
import { PostGameStats, getPostGameState } from '../components/PostGameStats';
import { getState as getReplayState, Replay } from '../components/Replay';
import { getState as getPossessionPositionState, PossessionPosition } from '../components/PossessionPosition'
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
import { StatFeed } from '../types/statfeedEvent';

export const Stream: FC<{ match: Match }> = (props) => {
  const [gameState, setGameState] = useState(props.match.gameState.state);
  const [scoreboardState, setScoreboardState] = useState(
    getScoreboardState(props.match)
  );
  const [spectatingState, setSpectatingState] = useState(
    getSpectatingState(props.match, undefined, undefined)
  );
  const [teamBoardState, setTeamBoardState] = useState(
    getTeamBoardState(props.match)
  );
  const [replayState, setReplayState] = useState(getReplayState(undefined));
  const [postGameStatsState, setPostGameStatsState] = useState(
    getPostGameState(props.match, false)
  );
  const [possessionPositionState, setPossessionPositionState] = useState(
    getPossessionPositionState(props.match)
  );

  useEffect(() => {
    const unsubscribers = [
      // Match Created - When game is created before everyone has picked sides or specator roles
      props.match.OnMatchCreated(() => setGameState(props.match.gameState.state)),
      // OnFirstCountdown - When the first kick off of the game occurs
      props.match.OnFirstCountdown(() => setGameState(props.match.gameState.state)),
      // OnCountdown - When a kickoff countdown occurs
      props.match.OnCountdown(() =>
        setSpectatingState((prevState) =>
          getSpectatingState(props.match, 'OnCountdown', prevState)
        )
      ),
      // OnTimeUpdated - When a time update is recieved
      props.match.OnTimeUpdated(() => {
        setScoreboardState(getScoreboardState(props.match));
      }),
      props.match.OnStatfeedEvent((s: Map<string,StatFeed[]>) => {
        setTeamBoardState(() => getTeamBoardState(props.match));
      }),
      // OnPlayersUpdated - When players stats/properties have changed
      props.match.OnPlayersUpdated(() => {
        setTeamBoardState(() => getTeamBoardState(props.match));
        setPostGameStatsState(getPostGameState(props.match, false));
        setPossessionPositionState(getPossessionPositionState(props.match));
      }),
      // OnSpecatorUpdated - When the spectated player changes
      props.match.OnSpecatorUpdated(() => {
        setTeamBoardState(() => getTeamBoardState(props.match));
        setSpectatingState((prevState) =>
          getSpectatingState(props.match, 'OnSpecatorUpdated', prevState)
        );
      }),
      // OnInstantReplayStart - When an in game instant replay is started after a goal
      props.match.OnInstantReplayStart(() => {
        setSpectatingState((prevState) =>
          getSpectatingState(props.match, 'OnInstantReplayStart', prevState)
        );
        setReplayState((prevState) =>
          getReplayState({
            event: 'OnInstantReplayStart',
            prevState,
          })
        );
      }),
      // OnInstantReplayEnd - When an in game instant replay is ended
      props.match.OnInstantReplayEnd(() =>
        setReplayState((prevState) =>
          getReplayState({
            event: 'OnInstantReplayEnd',
            prevState,
          })
        )
      ),
      // OnGoalScored - When a goal is scored
      props.match.OnGoalScored((data) =>
        setReplayState((prevState) =>
          getReplayState({
            event: 'OnGoalScored',
            data,
            prevState,
          })
        )
      ),
      // OnTeamsUpdated - When Team scores/names/colors are updated
      props.match.OnTeamsUpdated(() => {
        setScoreboardState(getScoreboardState(props.match));
        setPostGameStatsState(getPostGameState(props.match, false));
      }),
      // OnSeriesUpdate
      props.match.OnSeriesUpdate(() => {
        setScoreboardState(getScoreboardState(props.match));
        setPostGameStatsState(getPostGameState(props.match, false));
      }),
      // OnGameEnded - When name of team winner is displayed on screen after game is over
      props.match.OnGameEnded(() => {
        setPostGameStatsState(getPostGameState(props.match, false));
        setTimeout(() => setGameState(props.match.gameState.state), 2990);
      }),
      // OnPodiumStart - Celebration screen for winners podium after game ends
      props.match.OnPodiumStart(() =>
        setTimeout(() => {
          setGameState(props.match.gameState.state);
          setPostGameStatsState(getPostGameState(props.match, true));
        }, 4700)
      ),
      // OnMatchEnded - When match is destroyed
      props.match.OnMatchEnded(() => setGameState(props.match.gameState.state)),
    ];

    return () => unsubscribers.forEach((u) => u(props.match));
  }, [props.match]);

  switch (props.match.gameState.state) {
    case 'none':
    case 'pre-game-lobby':
      return <div className="overlay"></div>;

    case 'in-game':
      return (
        <div className="overlay">
          <Scoreboard {...scoreboardState} />
          <TeamBoard {...teamBoardState} />
          <PossessionPosition {...possessionPositionState} />
          <Spectating {...spectatingState} />
          <Replay {...replayState} />
        </div>
      );

    case 'game-ended':
      return (
        <div className="overlay">
          <PostGameStats {...postGameStatsState} />
        </div>
      );

    case 'post-game':
      return (
        <div className="overlay">
          <PostGameStats {...postGameStatsState} />
        </div>
      );

    default:
      return (
        <div className="overlay">Game State not recognized: {props.match.gameState.state}</div>
      );
  }
};
