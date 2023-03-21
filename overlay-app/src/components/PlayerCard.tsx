import '../css/PlayerCard.css';
import assist_svg from '../assets/stat-icons/assist.svg';
import save_svg from '../assets/stat-icons/save.svg';
import epic_save_svg from '../assets/stat-icons/epic-save.svg';
import goal_svg from '../assets/stat-icons/goal.svg';
import shot_svg from '../assets/stat-icons/shot-on-goal.svg';
import demo_svg from '../assets/stat-icons/demolition.svg';
import React, { FC, useEffect, useState } from 'react';
import { Player } from '../types/player';
import { scaleText } from '../util/utils';
import { StatfeedEvent } from '../types/statfeedEvent';

interface PlayerCardProps {
  player: Player;
  spectating: boolean;
  index: number;
  showBoost: boolean;
  s: StatfeedEvent|undefined;
}

interface feed_ttl {
  el: JSX.Element,
  ttl: number
}
let statfeeds = new Map<string,feed_ttl[]>();

export const PlayerCardCore: FC<PlayerCardProps> = (props) => {

  // const [statfeeds, setStatfeeds] = useState(new Map<string,feed_ttl[]>());

  const { player, spectating, index, showBoost, s} = props;

  if(!statfeeds.has(player.id)){
    statfeeds.set(player.id, []);
    // setStatfeeds(statfeeds);
  }

  let isStatfeed = false
  let feeds = statfeeds.get(player.id);
  if(s !== undefined && s.main_target.id === player.id)
  {
    let img = <></>;
    if(feeds!.length > 1)
      feeds!.shift();
    switch(s?.type){
      case 'Assist':
        isStatfeed = true;
        img = (<img src={assist_svg} alt="" key="assist"/>);
        break;
      case 'Demolition':
        isStatfeed = true;
        img = (<img src={demo_svg} alt="" key="demo"/>);
        break;
      case 'Epic Save':
        isStatfeed = true;
        img = (<img src={epic_save_svg} alt="" key="epic-save"/>);
        break;
      case 'Goal':
        isStatfeed = true;
        img = (<img src={goal_svg} alt="" key="goal"/>);
        break;
      case 'Save':
        isStatfeed = true;
        img = (<img src={save_svg} alt="" key="save"/>);
        break;
      case 'Shot on Goal':
        isStatfeed = true;
        img = (<img src={shot_svg} alt="" style={{top:"-.5rem"}} key="shot"/>);
        break;
    }

    if(feeds!.length === 0 || img.key !== feeds![0].el.key)
    {
      feeds!.push({el:img, ttl:2});
    }
  }

  // const forceUpdate = React.useReducer(() => ({}), {})[1] as () => void;

  // useEffect(() => {
  //   const interval = setInterval(() => {

  //     for (let i = 0; i < feeds!.length; i++) {
        
  //       feeds![i].ttl += -1;
  //       console.log(`Decremented stat: ${feeds![i].el.key} from player: ${player.id} ttl: ${feeds![i].ttl}`);
        
  //       if(feeds![i].ttl <= 0){
  //         var stat = feeds![i];
  //         feeds!.splice(i, 1);
  //         console.log(`Removed stat: ${stat.el.key} from player: ${player.id}`);
  //       }

  //     }
  //     console.log(`Length: ${feeds!.length}`);

  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, [feeds, player.id, forceUpdate]);

  // let isStatfeed = feeds!.length > 0;
  let [name, fontSize] = scaleText(player.name, [[17, "1.5rem"], [20, "1.25rem"], [23, "1rem"]]);

  let className = 'player' + 
                  (spectating ? ' spectatingTeamBoard' : '') + 
                  (isStatfeed ? ' statfeed' : '');
  
  return (
    <div id={'t0-p' + index + '-board'} key={index} className={className}>
      <div className='statOverlay' style={{display:isStatfeed?'block':'none'}}>
        {feeds!.map((el:feed_ttl) => { return el.ttl > 0 ? el.el : <></>; })}
      </div> 
      <div className="name" style={{fontSize:fontSize}}>{name}</div>
      <div className="boost" style={{ visibility: showBoost ? 'visible' : 'hidden' }}>
        <div className="fill-bg"></div>
        <div className="fill" style={{ width: player.boost + '%' }}></div>
        <div className="num">{!isStatfeed ? player.boost : ''}</div>
      </div>
    </div>
  );
};

export const PlayerCard = React.memo(
  PlayerCardCore,
  ShouldUpdate
);

function ShouldUpdate(prevProps:PlayerCardProps, nextProps:PlayerCardProps): boolean{
  return!(
    prevProps.index !== nextProps.index ||
    prevProps.showBoost !== nextProps.showBoost ||
    prevProps.spectating !== nextProps.spectating ||
    prevProps.player.id !== nextProps.player.id ||
    prevProps.player.name !== nextProps.player.name ||
    prevProps.player.boost !== nextProps.player.boost ||
    prevProps.s?.main_target.id !== nextProps.s?.main_target.id ||
    prevProps.s?.secondary_target.id !== nextProps.s?.secondary_target.id ||
    prevProps.s?.type !== nextProps.s?.type
  );
}
