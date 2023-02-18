import React, { FunctionComponent, useEffect, useState } from 'react';
import { PostGameStats, getPostGameState } from '../components/PostGameStats';
import { Match } from '../match';

interface GameStatsProps {
  match: Match;
  width: number;
}

export const GameStats: FunctionComponent<GameStatsProps> = (props) => {
  const [state, setState] = useState(getPostGameState(props.match, true));

  useEffect(() => {
    const refreshState = () => setState(getPostGameState(props.match, true));

    const unsubscribers = [
      props.match.OnPlayersUpdated(refreshState),
      props.match.OnTeamsUpdated(refreshState),
      props.match.OnSeriesUpdate(refreshState),
      props.match.OnGameEnded(refreshState),
    ];

    return () => unsubscribers.forEach((u) => u(props.match));
  }, [props.match]);

  return (
    <div
      className="overlay"
      style={{
        transformOrigin: 'left',
        transform: `scale(${props.width / 2560})`,
      }}
    >
      <PostGameStats {...state} />
    </div>
  );
};
