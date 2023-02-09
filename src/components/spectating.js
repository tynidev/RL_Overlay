import '../css/spectating.css';
import assist_svg from '../assets/stat-icons/assist.svg'
import save_svg from '../assets/stat-icons/save.svg'
import goal_svg from '../assets/stat-icons/goal.svg'
import shot_svg from '../assets/stat-icons/shot-on-goal.svg'
import demo_svg from '../assets/stat-icons/demolition.svg'
import React from 'react';

class Spectating extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];

  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      display: false,
      bg_color: 'linear-gradient(to right, rgb(var(--base-color)), rgba(var(--base-color), 0.4))',
      player: {
        team: 0,
        name: "",
        boost: 0,
        saves: 0,
        goals: 0,
        assists: 0,
        demos: 0,
        shots: 0
      }
    };
  }

  componentDidMount() {
    this.unsubscribers.push(
      this.match.OnSpecatorUpdated((isSpectating, player) => {
        if(player === undefined || !isSpectating)
        {
          this.setState({display: false});
          return;
        }

        var bg_color = player.team === 0 ? 
        'linear-gradient(to right, rgb(var(--blue)), rgba(var(--blue), 0.4))' :
        'linear-gradient(to right, rgb(var(--orange)), rgba(var(--orange), 0.4))';
        
        this.setState({
          display: true,
          bg_color: bg_color,
          player: player
        });
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
  }

  render() {
    if(!this.state.display)
      return <div className="spectating"></div>;
    return (
    <div className="spectating" style={{backgroundImage:this.state.bg_color}}>
      <div className="name">{this.truncate(this.state.player.name, 14)}</div>
      <div className="boost"><div className="fill" style={{width: this.state.player.boost, transition: "0.25s"}}></div></div>
      <div className="stats">
        <div className="goal">{this.state.player.goals}</div><img src={goal_svg}/>
        <div className="assist">{this.state.player.assists}</div><img src={assist_svg}/>
        <div className="save">{this.state.player.saves}</div><img src={save_svg}/>
        <div className="shots">{this.state.player.shots}</div><img src={shot_svg}/>
        <div className="demo">{this.state.player.demos}</div><img src={demo_svg}/>
      </div>
    </div>
    );
  }

  truncate(str, len) {
    return str.length > len ? str.substring(0, len) + "..." : str;
  }
}
export default Spectating;