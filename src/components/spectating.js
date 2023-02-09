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
      display_boost_ring: true,
      spectating_left: 0,
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
      },
      spectating: this.match.spectating,
    };
  }

  componentDidMount() {

    // OnSpecatorUpdated - When the spectated player or stats/properties of player have changed
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

    // OnPlayersUpdated - When players stats/properties have changed
    //       We hook here because if a player changes from spectating 
    //       to playing this is the best place to catch it
    this.unsubscribers.push(
      this.match.OnPlayersUpdated((left, right) => {
        this.setState({spectating: this.match.spectating});
      })
    );

    // OnInstantReplayStart - When an in game instant replay is started after a goal
    this.unsubscribers.push(
      this.match.OnInstantReplayStart(() => { 
        this.setState({
          spectating_left: -1000,
          display_boost_ring: false,
        });
      })
    );

    // OnCountdown - When a kickoff countdown occurs
    this.unsubscribers.push(
     this.match.OnCountdown(() => { 
      this.setState({
        spectating_left: 0,
        display_boost_ring: true,
      });
     })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render() {
    
    if(!this.state.display)
      return <div><div className="spectating" /><div className='spectating-boost' /></div>;
    
    let circumference = 135 * 2 * Math.PI;
    let offset = circumference - this.state.player.boost / 100 * circumference;
    let boost_ring = (<div className="specatating-boost"></div>);
    if(this.state.display_boost_ring)
    {
      boost_ring = (<div className="spectating-boost">
        <svg className="boost-ring">
          <circle className="border-inner"/>
          <circle className="inner"/>
          <circle className="fill" 
                  fill="transparent" 
                  style={{stroke:this.state.player.team !== 0 ? 'rgb(var(--orange))' : 'rgb(var(--blue))', transition:'100ms'}}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  />
          <circle className="border-outer"/>
          <text className="boost-num" 
            fill="white" 
            x="108" 
            y="139.671875" 
            fontSize="60"
            ref={el => {
              if (!el) return;
      
              let x = 155;
              let y = 155;
              let centerX = el.getBoundingClientRect().width / 2;
              let centerY = el.getBoundingClientRect().height / 4;
              el.setAttribute('x', x - centerX - 5);
              el.setAttribute('y', y + centerY - (this.state.spectating ? 35 : 0));
            }}>
              {this.state.player.boost}
          </text>
          <text className="speed-num" 
            fill={this.state.player.isSonic ? 'rgba(255, 217, 0,1)' : 'white'} 
            x="85" 
            y="178.33984375" 
            fontSize="30"
            style={{visibility:this.state.spectating ? 'visible' : 'hidden'}}
            ref={el => {
              if (!el) return;
      
              let x = 155;
              let y = 155;
              let centerX = el.getBoundingClientRect().width / 2;
              let centerY = el.getBoundingClientRect().height / 4;
              el.setAttribute('x', x - centerX - 5);
              el.setAttribute('y', y + centerY + 20);
            }}>
              {this.state.player.speed} MPH
          </text>
          <line x1="80" y1="150" x2="220" y2="150" stroke="white" style={{visibility:this.state.spectating ? 'visible' : 'hidden'}}/>
        </svg>
      </div>);
    }
    return (
    <div>
      <div className="spectating" style={{backgroundImage:this.state.bg_color, left:this.state.spectating_left, transition: "400ms"}}>
        <div className="name">{this.truncate(this.state.player.name, 14)}</div>
        <div className="boost"><div className="fill" style={{width: this.state.player.boost, transition: "0.25s"}}></div></div>
        <div className="stats">
          <div className="goal">{this.state.player.goals}</div><img src={goal_svg} alt=''/>
          <div className="assist">{this.state.player.assists}</div><img src={assist_svg} alt=''/>
          <div className="save">{this.state.player.saves}</div><img src={save_svg} alt=''/>
          <div className="shots">{this.state.player.shots}</div><img src={shot_svg} alt=''/>
          <div className="demo">{this.state.player.demos}</div><img src={demo_svg} alt=''/>
        </div>
      </div>
      {boost_ring}
    </div>
    );
  }

  truncate(str, len) {
    return str.length > len ? str.substring(0, len) + "..." : str;
  }
}
export default Spectating;