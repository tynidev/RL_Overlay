import '../css/PlayerCard.css';
import assist_svg from '../assets/stat-icons/assist.svg';
import save_svg from '../assets/stat-icons/save.svg';
import goal_svg from '../assets/stat-icons/goal.svg';
import shot_svg from '../assets/stat-icons/shot-on-goal.svg';
import demo_svg from '../assets/stat-icons/demolition.svg';
import React, { FC } from 'react';
import { Player } from '../types/player';
import { truncate } from '../util/utils';

interface PlayerCardProps {
  player: Player;
  spectating: boolean;
  index: number;
  showBoost: boolean;
}

export const PlayerCard: FC<PlayerCardProps> = (props) => {
  const { player, spectating, index, showBoost } = props;

  let name = truncate(player.name, 25);
  let fontSize = name.length <= 17 ? "1.5rem" : (name.length <= 20 ? "1.25rem" : "1rem");

  return (
    <div
      id={'t0-p' + index + '-board'}
      key={index}
      className={'player' + (spectating ? ' spectatingTeamBoard' : '')}
    >
      <div className="name" style={{fontSize:fontSize}}>{name}</div>
      <div className="stats">
        <div className="stat">
          <div className="goal">{player.goals}</div>
          <img src={goal_svg} alt="" />
        </div>
        <div className="stat">
          <div className="assist">{player.assists}</div>
          <img src={assist_svg} alt="" />
        </div>
        <div className="stat">
          <div className="save">{player.saves}</div>
          <img src={save_svg} alt="" />
        </div>
        <div className="stat">
          <div className="shots">{player.shots}</div>
          <img src={shot_svg} alt="" />
        </div>
        <div className="stat">
          <div className="demo">{player.demos}</div>
          <img src={demo_svg} alt="" />
        </div>
      </div>
      <div
        className="boost"
        style={{ visibility: showBoost ? 'visible' : 'hidden' }}
      >
        <div className="fill-bg"></div>
        <div className="fill" style={{ width: player.boost + '%' }}></div>
        <div className="num">{player.boost}</div>
      </div>
    </div>
  );
};
