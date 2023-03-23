import '../css/Teamboard.css';
import React, { FC } from 'react';
import { Match } from '../match';
import { PlayerCard } from './PlayerCard';

export const getState = (match: Match) => {
  return {
    left: match?.gameState.left ?? [],
    right: match?.gameState.right ?? [],
    playerTarget: match?.playerTarget ?? undefined,
    localPlayer: match?.localPlayer ?? undefined,
    statfeed: match?.statfeeds,
  };
};

export const TeamBoard: FC<ReturnType<typeof getState>> = (props) => {
  const { playerTarget, localPlayer, statfeed} = props;
  const getTeam = (side: 'left' | 'right') => (
    <div className={side}>
      {props[side].map((player, index) => (
        <PlayerCard
          player={player}
          spectating={playerTarget?.id === player.id}
          index={index}
          showBoost={!localPlayer}
          key={index}
          statfeed={statfeed.get(player.id) ?? []}
        />
      ))}
    </div>
  );

  return (
    <div className="teamboard">
      {getTeam('left')}
      {getTeam('right')}
    </div>
  );
};
