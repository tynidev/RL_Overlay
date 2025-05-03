import '../css/Spectating.css';
import assist_svg from '../assets/stat-icons/assist.svg';
import save_svg from '../assets/stat-icons/save.svg';
import goal_svg from '../assets/stat-icons/goal.svg';
import shot_svg from '../assets/stat-icons/shot-on-goal.svg';
import demo_svg from '../assets/stat-icons/demolition.svg';
import React, { FC } from 'react';
import { Match } from '../match';
import { truncate } from '../util/utils';
import { NewPlayer, Player } from '../types/player';

export const getState = (
  match: Match,
  event:
    | 'OnInstantReplayStart'
    | 'OnSpecatorUpdated'
    | 'OnCountdown'
    | undefined,
  prevState: any // this is too lazy
) => {
  let spectating_left = 0;
  let display_boost_ring = true;
  if (event === 'OnInstantReplayStart') {
    spectating_left = -1000;
    display_boost_ring = false;
  } else if (event === 'OnSpecatorUpdated') {
    spectating_left = prevState.spectating_left;
    display_boost_ring = prevState.display_boost_ring;
  }

  return {
    display: match?.playerTarget === undefined ? false : true,
    display_boost_ring: display_boost_ring,
    spectating_left: spectating_left,
    bg_color:
      match?.playerTarget?.team === 0
        ? 'linear-gradient(to right, rgb(var(--blue)), rgba(var(--blue), 0.4))'
        : 'linear-gradient(to right, rgb(var(--orange)), rgba(var(--orange), 0.4))',
    player: match?.playerTarget ?? NewPlayer(),
    hasLocalPlayer: match.localPlayer,
  };
};

export const SpectatingCore: FC<ReturnType<typeof getState>> = (props) => {
  const {
    display,
    display_boost_ring,
    spectating_left,
    bg_color,
    player,
    hasLocalPlayer,
  } = props;

  if (!display) {
    return (
      <div>
        <div className="spectating" />
        <div className="spectating-boost" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="spectating"
        style={{
          backgroundImage: bg_color,
          left: spectating_left,
          transition: '400ms',
        }}
      >
        <div className="name">{truncate(player.name, 10)}</div>
        <div className="stats">
          <img src={goal_svg} alt="" />
          <div className="goal">{player.goals}</div>
          <img src={assist_svg} alt="" />
          <div className="assist">{player.assists}</div>
          <img src={save_svg} alt="" />
          <div className="save">{player.saves}</div>
          <img src={shot_svg} alt="" />
          <div className="shots">{player.shots}</div>
          <img src={demo_svg} alt="" />
          <div className="demo">{player.demos}</div>
        </div>
      </div>
      {BoostRing(display_boost_ring, hasLocalPlayer, player)}
    </div>
  );
};

export const Spectating = React.memo(
  SpectatingCore,
  ShouldUpdate
);

function ShouldUpdate(prevProps:ReturnType<typeof getState>, nextProps:ReturnType<typeof getState>): boolean{
  return!(
    prevProps.display !== nextProps.display ||
    prevProps.bg_color !== nextProps.bg_color ||
    prevProps.display_boost_ring !== nextProps.display_boost_ring ||
    prevProps.spectating_left !== nextProps.spectating_left ||
    (prevProps.hasLocalPlayer === undefined && nextProps.hasLocalPlayer !== undefined) ||
    (prevProps.hasLocalPlayer !== undefined && nextProps.hasLocalPlayer === undefined) ||
    prevProps.player.name !== nextProps.player.name ||
    prevProps.player.team !== nextProps.player.team ||
    prevProps.player.goals !== nextProps.player.goals ||
    prevProps.player.assists !== nextProps.player.assists ||
    prevProps.player.saves !== nextProps.player.saves ||
    prevProps.player.shots !== nextProps.player.shots ||
    prevProps.player.assists !== nextProps.player.assists ||
    prevProps.player.boost !== nextProps.player.boost ||
    prevProps.player.isSonic !== nextProps.player.isSonic ||
    prevProps.player.speed !== nextProps.player.speed
  );
}

function BoostRing(display_boost_ring:boolean, hasLocalPlayer:Player|undefined, player: Player){

  if (!display_boost_ring)
    return <div className="specatating-boost"></div>;

  let circumference = 135 * 2 * Math.PI;
  let offset = circumference - (player.boost / 100) * circumference;

  const swRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--sw')
    .trim();
  const sw = parseInt(swRaw.substring(0, swRaw.length - 2));
  const one = sw / 2560;
  const x = one * 155;
  const y = x;
  
  return (
    <div className="spectating-boost">
      <svg className="boost-ring">
        <circle
          className="border-inner"
          style={{
            stroke: hasLocalPlayer
              ? 'rgba(0, 0, 0, 1)'
              : 'rgba(0, 0, 0, 0.4)',
          }}
        />
        <circle
          className="inner"
          style={{
            fill: hasLocalPlayer
              ? 'rgba(15, 15, 15, 1)'
              : 'rgba(0, 0, 0, 0.8)',
          }}
        />
        <circle
          className="fill"
          fill="transparent"
          style={{
            stroke:
              player.team !== 0 ? 'rgb(var(--orange))' : 'rgb(var(--blue))',
            transition: '100ms',
          }}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <circle className="border-outer" />
        <text
          className="boost-num"
          fill="white"
          ref={(boostNum) => {
            if (!boostNum) return;
            let centerX = boostNum.getBoundingClientRect().width / 2;
            let centerY = boostNum.getBoundingClientRect().height / 4;
            boostNum.setAttribute('x', `${x - centerX - 5}`);
            boostNum.setAttribute(
              'y',
              `${y + centerY - (hasLocalPlayer ? 0 : 35)}`
            );
          }}
        >
          {player.boost}
        </text>
        <text
          className="speed-num"
          fill={player.isSonic ? 'rgba(255, 217, 0,1)' : 'white'}
          style={{ visibility: hasLocalPlayer ? 'hidden' : 'visible' }}
          ref={(speedNum) => {
            if (!speedNum) return;
            let centerX = speedNum.getBoundingClientRect().width / 2;
            let centerY = speedNum.getBoundingClientRect().height / 4;
            speedNum.setAttribute('x', `${x - centerX - 5}`);
            speedNum.setAttribute('y', `${y + centerY + 20}`);
          }}
        >
          {player.speed} MPH
        </text>
        <line
          x1={one * 80}
          y1={one * 150}
          x2={one * 220}
          y2={one * 150}
          stroke="white"
          style={{ visibility: hasLocalPlayer ? 'hidden' : 'visible' }}
        />
      </svg>
    </div>
  );
}