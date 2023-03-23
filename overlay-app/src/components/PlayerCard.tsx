import '../css/PlayerCard.css';
import assist_svg from '../assets/stat-icons/assist.svg';
import save_svg from '../assets/stat-icons/save.svg';
import epic_save_svg from '../assets/stat-icons/epic-save.svg';
import goal_svg from '../assets/stat-icons/goal.svg';
import shot_svg from '../assets/stat-icons/shot-on-goal.svg';
import demo_svg from '../assets/stat-icons/demolition.svg';
import React, { FC } from 'react';
import { Player } from '../types/player';
import { areEqual, scaleText } from '../util/utils';
import { StatFeed } from '../types/statfeedEvent';

interface PlayerCardProps {
  player: Player;
  spectating: boolean;
  index: number;
  showBoost: boolean;
  statfeed: StatFeed[];
}

const PlayerCardCore: FC<PlayerCardProps> = (props) => {
  const { player, spectating, index, showBoost, statfeed} = props;

  let feeds:JSX.Element[] = [];
  if(statfeed !== undefined)
  {
    statfeed.forEach(item => {
      let img = <></>;
      if(feeds.length > 1)
        feeds.shift();
      switch(item.stat.type){
        case 'Assist':
          img = (<img src={assist_svg} alt="" key="assist"/>);
          break;
        case 'Demolition':
          img = (<img src={demo_svg} alt="" key="demo"/>);
          break;
        case 'Epic Save':
          img = (<img src={epic_save_svg} alt="" key="epic-save"/>);
          break;
        case 'Goal':
          img = (<img src={goal_svg} alt="" key="goal"/>);
          break;
        case 'Save':
          img = (<img src={save_svg} alt="" key="save"/>);
          break;
        case 'Shot on Goal':
          img = (<img src={shot_svg} alt="" style={{top:"-.5rem"}} key="shot"/>);
          break;
      }
      if(feeds.length === 0 || img.key !== feeds[0].key)
      {
        feeds.push(img);
      }
    });
  }

  let isStatfeed = feeds.length > 0;
  let [name, fontSize] = scaleText(player.name, [[17, "1.5rem"], [20, "1.25rem"], [23, "1rem"]]);

  let className = 'player' + 
                  (spectating ? ' spectatingTeamBoard' : '') + 
                  (isStatfeed ? ' statfeed' : '');
  
  return (
    <div id={'t0-p' + index + '-board'} key={index} className={className}>
      <div className='statOverlay' style={{display:isStatfeed?'block':'none'}}>
        {feeds!.map((el) => el )}
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
  // ArePropsEqual // for some reason we aren't getting this right... so I'm taking the performance hit of rendering every time
);

function ArePropsEqual(prevProps:PlayerCardProps, nextProps:PlayerCardProps): boolean{
  let render = !(
    prevProps.index !== nextProps.index ||
    prevProps.showBoost !== nextProps.showBoost ||
    prevProps.spectating !== nextProps.spectating ||
    prevProps.player.id !== nextProps.player.id ||
    prevProps.player.name !== nextProps.player.name ||
    prevProps.player.boost !== nextProps.player.boost ||
    !areEqual(prevProps.statfeed, nextProps.statfeed, areStatsEqual)
  );
  return render;
}

function areStatsEqual(a:StatFeed, b:StatFeed){
  let equal = !(a.stat.main_target.id !== b.stat.main_target.id || 
    a.stat.secondary_target.id !== b.stat.secondary_target.id || 
    a.stat.type !== b.stat.type)
 return equal;
}