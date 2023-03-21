import '../css/PossessionPosition.css';
import React, { FC } from 'react';
import { Match } from '../match';

export const getState = (match: Match | undefined) => ({
  possession: match?.gameState?.possession === undefined ? 0 : Math.round(match.gameState.possession),
  fieldPosition: match?.gameState?.fieldPosition === undefined ? 0 : Math.round(match.gameState.fieldPosition),
});

function StatFlyouts(value:number, id:string, text:string, showThresh:number, dangerThresh:number): [JSX.Element, JSX.Element]
{
  let leftEl = (<div id={id} className="left" style={{
    transform:value >= showThresh ? "translateX(18.5rem)" : "",
    backgroundColor:value >= dangerThresh ? "#cb0000" : "rgb(var(--base-color))"}}>
      {text} {value.toFixed()}%
      </div>);
  let rightEl = (<div id={id} className="right" style={{
    transform:value <= (showThresh * -1) ? "translateX(-18.5rem)" : "",
    backgroundColor:value <= (dangerThresh * -1) ? "#cb0000" : "rgb(var(--base-color))"}}>
      {Math.abs(value).toFixed()}% {text} 
      </div>);
  return [leftEl,rightEl];
}

export const PossessionPosition: FC<ReturnType<typeof getState>> = (props) => {
  const { possession, fieldPosition } = props;
  
  let positionEls = StatFlyouts(fieldPosition, "position-flyout", "position adv", 50, 70);
  let possessionEls = StatFlyouts(possession, "possession-flyout", "possession", 40, 70);

  return (
    <div id="possession-positon">
      {possessionEls[0]}
      {positionEls[0]}
      {possessionEls[1]}
      {positionEls[1]}
    </div>
  );
};
