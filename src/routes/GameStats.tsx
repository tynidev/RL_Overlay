import React, { FunctionComponent, useEffect, useState } from "react";
import PostGameStats from "../components/PostGameStats";
import Match from "../match";

interface GameStatsProps {
  match: Match;
  width: number;
}

const GameStats: FunctionComponent<GameStatsProps> = (props) => {
  const [state, setState] = useState(PostGameStats.GetState(props.match));

  useEffect(() => {
    const refreshState = () => setState(PostGameStats.GetState(props.match));

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
        transformOrigin: "left",
        transform: `scale(${props.width / 2560})`,
      }}
    >
      <PostGameStats {...state} display={true} />
    </div>
  );
};

export default GameStats;
