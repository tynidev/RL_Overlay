import '../css/teamboard.css';
import assist_svg from '../assets/stat-icons/assist.svg'
import save_svg from '../assets/stat-icons/save.svg'
import goal_svg from '../assets/stat-icons/goal.svg'
import shot_svg from '../assets/stat-icons/shot-on-goal.svg'
import demo_svg from '../assets/stat-icons/demolition.svg'
import React from 'react';

class Teamboard extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];

  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      teams: [
        [], []
      ],
      spectating: this.match.spectating,
    };
  }

  componentDidMount() {
    this.unsubscribers.push(
      this.match.OnPlayersUpdated((left, right) => {
        this.setState({teams: [left, right], spectating: this.match.spectating});
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
  }

  render() {
    return (
      <div className='teamboard'>
        <div className='left'>
        {this.state.teams[0].map((player, index) => (
          <div id={'t0-p' + index +'-board'} key={index} className='player'>
            <div className='name'>{this.truncate(player.name)}</div>
            <div className="stats">
              <div className="stat"><div className="goal">{player.goals}</div><img src={goal_svg} alt=''/></div>
              <div className="stat"><div className="assist">{player.assists}</div><img src={assist_svg} alt=''/></div>
              <div className="stat"><div className="save">{player.saves}</div><img src={save_svg} alt=''/></div>
              <div className="stat"><div className="shots">{player.shots}</div><img src={shot_svg} alt=''/></div>
              <div className="stat"><div className="demo">{player.demos}</div><img src={demo_svg} alt=''/></div>
            </div>
            <div className="boost" style={{visibility:this.state.spectating ? 'visible' : 'hidden'}}>
              <div className="fill" style={{width:player.boost + "%"}}></div>
              <div className="num">{player.boost}</div>
            </div>
          </div>
        ))} 
        </div>

        <div className='right'>
        {this.state.teams[1].map((player, index) => (
          <div id={'t0-p' + index +'-board'} key={index} className='player'>
            <div className='name'>{this.truncate(player.name)}</div>
            <div className="stats">
              <div className="stat"><div className="goal">{player.goals}</div><img src={goal_svg} alt=''/></div>
              <div className="stat"><div className="assist">{player.assists}</div><img src={assist_svg} alt=''/></div>
              <div className="stat"><div className="save">{player.saves}</div><img src={save_svg} alt=''/></div>
              <div className="stat"><div className="shots">{player.shots}</div><img src={shot_svg} alt=''/></div>
              <div className="stat"><div className="demo">{player.demos}</div><img src={demo_svg} alt=''/></div>
            </div>
            <div className="boost" style={{visibility:this.state.spectating ? 'visible' : 'hidden'}}>
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