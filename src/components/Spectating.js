import '../css/Spectating.css';
import assist_svg from '../assets/stat-icons/assist.svg'
import save_svg from '../assets/stat-icons/save.svg'
import goal_svg from '../assets/stat-icons/goal.svg'
import shot_svg from '../assets/stat-icons/shot-on-goal.svg'
import demo_svg from '../assets/stat-icons/demolition.svg'
import React from 'react';

// eslint-disable-next-line no-unused-vars
import Match from '../match'

class Spectating extends React.PureComponent {

    /**
     * Static method to generate props from match
     * @param {Match} match
     */
    static GetState(match, event, prevState){
      
      let spectating_left = 0; 
      let display_boost_ring = true;
      if(event === "OnInstantReplayStart")
      {
        spectating_left = -1000;
        display_boost_ring = false;
      }
      else if(event === "OnSpecatorUpdated")
      {
        spectating_left = prevState.spectating_left;
        display_boost_ring = prevState.display_boost_ring;
      }

      return {
        display: match?.playerTarget === undefined ? false : true,
        display_boost_ring: display_boost_ring,
        spectating_left: spectating_left,
        bg_color: match?.playerTarget?.team === 0 ? 'linear-gradient(to right, rgb(var(--blue)), rgba(var(--blue), 0.4))' : 'linear-gradient(to right, rgb(var(--orange)), rgba(var(--orange), 0.4))',
        player: match?.playerTarget ?? {
          team: 0,
          name: "",
          boost: 0,
          saves: 0,
          goals: 0,
          assists: 0,
          demos: 0,
          shots: 0
        },
        hasLocalPlayer: match.localplayer,
      }
    }

  render() {
    
    let {display, display_boost_ring, spectating_left, bg_color, player, hasLocalPlayer} = this.props;

    if(!display)
      return <div><div className="spectating" /><div className='spectating-boost' /></div>;
    
    let circumference = 135 * 2 * Math.PI;
    let offset = circumference - player.boost / 100 * circumference;
    let boost_ring = (<div className="specatating-boost"></div>);
    if(display_boost_ring)
    {
      boost_ring = (<div className="spectating-boost">
        <svg className="boost-ring">
          <circle className="border-inner" style={{stroke:hasLocalPlayer ? 'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0.4)'}}/>
          <circle className="inner" style={{fill:hasLocalPlayer ? 'rgba(15, 15, 15, 1)' : 'rgba(0, 0, 0, 0.8)'}}/>
          <circle className="fill" 
                  fill="transparent" 
                  style={{stroke:player.team !== 0 ? 'rgb(var(--orange))' : 'rgb(var(--blue))', transition:'100ms'}}
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
              el.setAttribute('y', y + centerY - (hasLocalPlayer ? 0 : 35));
            }}>
              {player.boost}
          </text>
          <text className="speed-num" 
            fill={player.isSonic ? 'rgba(255, 217, 0,1)' : 'white'} 
            x="85" 
            y="178.33984375" 
            fontSize="30"
            style={{visibility:hasLocalPlayer ? 'hidden' : 'visible'}}
            ref={el => {
              if (!el) return;
      
              let x = 155;
              let y = 155;
              let centerX = el.getBoundingClientRect().width / 2;
              let centerY = el.getBoundingClientRect().height / 4;
              el.setAttribute('x', x - centerX - 5);
              el.setAttribute('y', y + centerY + 20);
            }}>
              {player.speed} MPH
          </text>
          <line x1="80" y1="150" x2="220" y2="150" stroke="white" style={{visibility:hasLocalPlayer ? 'hidden' : 'visible'}}/>
        </svg>
      </div>);
    }
    return (
    <div>
      <div className="spectating" style={{backgroundImage:bg_color, left:spectating_left, transition: "400ms"}}>
        <div className="name">{this.truncate(player.name, 14)}</div>
        <div className="boost"><div className="fill" style={{width: player.boost, transition: "0.25s"}}></div></div>
        <div className="stats">
          <img src={goal_svg} alt=''/><div className="goal">{player.goals}</div>
          <img src={assist_svg} alt=''/><div className="assist">{player.assists}</div>
          <img src={save_svg} alt=''/><div className="save">{player.saves}</div>
          <img src={shot_svg} alt=''/><div className="shots">{player.shots}</div>
          <img src={demo_svg} alt=''/><div className="demo">{player.demos}</div>
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