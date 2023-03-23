import '../css/PossessionPosition.css';
import React, { FC } from 'react';
import { Match } from '../match';

export const getState = (match: Match | undefined) => {
  var possession = match?.gameState?.possession === undefined ? 0 : Math.round(match.gameState.possession);
  var fieldPosition = match?.gameState?.fieldPosition === undefined ? 0 : Math.round(match.gameState.fieldPosition);

  const flatten = (val:number, thresh:number) => {
    let nThreh = thresh * -1;
    if(val <= thresh && val >= nThreh)
      return 0;
    else if(possession > thresh)
      return thresh + 1;
    else
      return nThreh - 1;
  };

  possession = flatten(possession, 50);
  fieldPosition = flatten(fieldPosition, 60);

  return {
    possession: possession,
    fieldPosition: fieldPosition,
  };
};

// function StatFlyouts(value:number, id:string, text:string, showThresh:number, dangerThresh:number): [JSX.Element, JSX.Element]
// {
//   let leftEl = (<div id={id} className="left" style={{
//     transform:value >= showThresh ? "translateX(18.5rem)" : "",
//     backgroundColor:value >= dangerThresh ? "#cb0000" : "rgb(var(--base-color))"}}>
//       {text} {value.toFixed()}%
//       </div>);
//   let rightEl = (<div id={id} className="right" style={{
//     transform:value <= (showThresh * -1) ? "translateX(-18.5rem)" : "",
//     backgroundColor:value <= (dangerThresh * -1) ? "#cb0000" : "rgb(var(--base-color))"}}>
//       {Math.abs(value).toFixed()}% {text} 
//       </div>);
//   return [leftEl,rightEl];
// }

const PossessionPositionCore: FC<ReturnType<typeof getState>> = (props) => {
  const { possession, fieldPosition } = props;
  
  // let positionEls = StatFlyouts(fieldPosition, "position-flyout", "position adv", 50, 70);
  // let possessionEls = StatFlyouts(possession, "possession-flyout", "possession", 40, 70);

  return (
    <div id="possession-positon">
      <div id="possession-positon-text-left">
        {fieldPosition > 60 ? (<div id="possession-text">position</div>) : (<></>)}
        {possession > 50 ? (<div id="possession-text">possession</div>) : (<></>)}
      </div>
      <div id="possession-positon-text-right">
        {fieldPosition < -60 ? (<div id="possession-text">position</div>) : (<></>)}
        {possession < -50 ? (<div id="possession-text">possession</div>) : (<></>)}
      </div>
    </div>
    // <div id="possession-positon">
    //   {possessionEls[0]}
    //   {positionEls[0]}
    //   {possessionEls[1]}
    //   {positionEls[1]}
    // </div>
  );
};

export const PossessionPosition = React.memo(
  PossessionPositionCore,
);
