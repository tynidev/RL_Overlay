import '../css/PossessionPosition.css';
import React, { FC } from 'react';
import { Match } from '../match';

export const getState = (match: Match | undefined) => ({
  possession: match?.gameState?.possession ?? [0,0],
  fieldPosition: match?.gameState?.fieldPosition ?? 0,
});

export const PossessionPosition: FC<ReturnType<typeof getState>> = (props) => {
  const { possession, fieldPosition } = props;
  
  let positionLeftElement = (<div id="position-flyout" className="left" style={{transform:fieldPosition >= 50 ? "translateX(17.5rem)" : "",backgroundColor:fieldPosition >= 70 ? "#cb0000" : "rgb(var(--base-color))"}}>positional adv.</div>);
  let positionRightElement = (<div id="position-flyout" className="right" style={{transform:fieldPosition <= -50 ? "translateX(-17.5rem)" : "",backgroundColor:fieldPosition <= -70 ? "#cb0000" : "rgb(var(--base-color))"}}>positional adv.</div>);

  let possessionLeftElement = (<div id="possession-flyout" className="left" style={{transform:possession >= 40 ? "translateX(17.5rem)" : ""}}>possession</div>);
  let possessionRightElement = (<div id="possession-flyout" className="right" style={{transform:possession <= -40 ? "translateX(-17.5rem)" : ""}}>possession</div>);

  return (
    <div id="possession-positon">
      {possessionLeftElement}
      {positionLeftElement}
      {possessionRightElement}
      {positionRightElement}
    </div>
  );
};
