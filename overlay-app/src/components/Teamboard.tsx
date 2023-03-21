import '../css/Teamboard.css';
import React, { FC } from 'react';
import { Match } from '../match';
import { PlayerCard } from './PlayerCard';
import { StatfeedEvent } from '../types/statfeedEvent';

export const getState = (match: Match, s:StatfeedEvent|undefined) => {
  return {
    left: match?.gameState.left ?? [],
    right: match?.gameState.right ?? [],
    playerTarget: match?.playerTarget ?? undefined,
    localPlayer: match?.localPlayer ?? undefined,
    statfeed: s,
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
          s={statfeed}
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
