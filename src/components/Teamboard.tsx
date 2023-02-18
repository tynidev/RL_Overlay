import '../css/Teamboard.css';
import React, { FunctionComponent } from 'react';
import { Match } from '../match';
import { PlayerCard } from './PlayerCard';

export const getState = (match: Match) => ({
  left: match?.state.left ?? [],
  right: match?.state.right ?? [],
  playerTarget: match?.playerTarget ?? undefined,
  localPlayer: match?.localPlayer ?? undefined,
});

export const TeamBoard: FunctionComponent<ReturnType<typeof getState>> = (
  props
) => {
  const { playerTarget, localPlayer } = props;
  const getTeam = (side: 'left' | 'right') => (
    <div className={side}>
      {props[side].map((player, index) => (
        <PlayerCard
          player={player}
          spectating={playerTarget?.id === player.id}
          index={index}
          showBoost={!localPlayer}
          key={index}
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
