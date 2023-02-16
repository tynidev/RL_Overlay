import '../css/PlayerCard.css';
import assist_svg from '../assets/stat-icons/assist.svg'
import save_svg from '../assets/stat-icons/save.svg'
import goal_svg from '../assets/stat-icons/goal.svg'
import shot_svg from '../assets/stat-icons/shot-on-goal.svg'
import demo_svg from '../assets/stat-icons/demolition.svg'
import React from 'react';

class PlayerCard extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.spectating !== nextProps.spectating ||
       this.props.index !== nextProps.index ||
       this.props.showBoost !== nextProps.showBoost ||
       this.props.player.name !== nextProps.player.name ||
       this.props.player.goals !== nextProps.player.goals ||
       this.props.player.assists !== nextProps.player.assists ||
       this.props.player.saves !== nextProps.player.saves ||
       this.props.player.shots !== nextProps.player.shots ||
       this.props.player.demos !== nextProps.player.demos ||
       this.props.player.boost !== nextProps.player.boost);
  }

  render() {
    let {player, spectating, index, showBoost} = this.props;
    return (
        <div id={'t0-p' + index +'-board'} key={index} className={'player' + (spectating ? ' spectatingTeamBoard' : '')}>
          <div className='name'>{this.truncate(player.name)}</div>
          <div className="stats">
            <div className="stat"><div className="goal">{player.goals}</div><img src={goal_svg} alt=''/></div>
            <div className="stat"><div className="assist">{player.assists}</div><img src={assist_svg} alt=''/></div>
            <div className="stat"><div className="save">{player.saves}</div><img src={save_svg} alt=''/></div>
            <div className="stat"><div className="shots">{player.shots}</div><img src={shot_svg} alt=''/></div>
            <div className="stat"><div className="demo">{player.demos}</div><img src={demo_svg} alt=''/></div>
          </div>
          <div className="boost" style={{visibility:showBoost ? 'visible' : 'hidden'}}>
            <div className="fill-bg"></div>
            <div className="fill" style={{width:player.boost + "%"}}></div>
            <div className="num">{player.boost}</div>
          </div>
        </div>
    );
  }

  truncate(str) {
    return str.length > 19 ? str.substring(0, 18) + "..." : str;
  }
}
export default PlayerCard;