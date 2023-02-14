import '../css/Teamboard.css';
import assist_svg from '../assets/stat-icons/assist.svg'
import save_svg from '../assets/stat-icons/save.svg'
import goal_svg from '../assets/stat-icons/goal.svg'
import shot_svg from '../assets/stat-icons/shot-on-goal.svg'
import demo_svg from '../assets/stat-icons/demolition.svg'
import React from 'react';

// eslint-disable-next-line no-unused-vars
import Match from '../match'

class Teamboard extends React.Component {
  
  /**
     * Static method to generate props from match
     * @param {Match} match
     */
  static GetState(match){
    return {
      teams: [
        match.left, match.right
      ],
      playerTarget: match.playerTarget,
      localPlayer: match.localPlayer,
    };
  }

  render() {
    let {teams, playerTarget, localPlayer} = this.props;
    return (
      <div className='teamboard'>
        <div className='left'>
        {teams[0].map((player, index) => (
          <div id={'t0-p' + index +'-board'} key={index} className={'player' + (playerTarget && playerTarget.id === player.id ? ' spectatingTeamBoard' : '')}>
            <div className='name'>{this.truncate(player.name)}</div>
            <div className="stats">
              <div className="stat"><div className="goal">{player.goals}</div><img src={goal_svg} alt=''/></div>
              <div className="stat"><div className="assist">{player.assists}</div><img src={assist_svg} alt=''/></div>
              <div className="stat"><div className="save">{player.saves}</div><img src={save_svg} alt=''/></div>
              <div className="stat"><div className="shots">{player.shots}</div><img src={shot_svg} alt=''/></div>
              <div className="stat"><div className="demo">{player.demos}</div><img src={demo_svg} alt=''/></div>
            </div>
            <div className="boost" style={{visibility:!localPlayer ? 'visible' : 'hidden'}}>
              <div className="fill-bg"></div>
              <div className="fill" style={{width:player.boost + "%"}}></div>
              <div className="num">{player.boost}</div>
            </div>
          </div>
        ))} 
        </div>

        <div className='right'>
        {teams[1].map((player, index) => (
          <div id={'t0-p' + index +'-board'} key={index} className={'player' + (playerTarget && playerTarget.id === player.id ? ' spectatingTeamBoard' : '')}>
            <div className='name'>{this.truncate(player.name)}</div>
            <div className="stats">
              <div className="stat"><div className="goal">{player.goals}</div><img src={goal_svg} alt=''/></div>
              <div className="stat"><div className="assist">{player.assists}</div><img src={assist_svg} alt=''/></div>
              <div className="stat"><div className="save">{player.saves}</div><img src={save_svg} alt=''/></div>
              <div className="stat"><div className="shots">{player.shots}</div><img src={shot_svg} alt=''/></div>
              <div className="stat"><div className="demo">{player.demos}</div><img src={demo_svg} alt=''/></div>
            </div>
            <div className="boost" style={{visibility:!localPlayer ? 'visible' : 'hidden'}}>
              <div className="fill-bg"></div>
              <div className="fill" style={{width:player.boost + "%"}}></div>
              <div className="num">{player.boost}</div>
            </div>
          </div>
        ))} 
        </div>
      </div>
    );
  }

  truncate(str) {
    return str.length > 19 ? str.substring(0, 18) + "..." : str;
  }
}
export default Teamboard;