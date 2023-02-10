import '../css/replay.css';
import React from 'react';
import assist_svg from '../assets/stat-icons/assist.svg'
import goal_svg from '../assets/stat-icons/goal.svg'
import shot_svg from '../assets/stat-icons/shot-on-goal.svg'

class Replay extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
        display: false,
        assister: {
            id: "Merlin_3",
            name: "Merlin"
        },
        ball_last_touch: {
            player: "C-Block_2",
            speed: 116.86531829833984
        },
        goalspeed: 114.98399353027344,
        goaltime: 42,
        impact_location: {
            X: 0.12062221765518188,
            Y: 0.8474531173706055
        },
        scorer: {
            id: "C-Block_2",
            name: "C-Block",
            teamnum: 0

        }
    };
  }

  componentDidMount() {
    this.unsubscribers.push(
    this.match.OnInstantReplayStart(() => { 
        this.setState({display: true});
    }));
  
    this.unsubscribers.push(
    this.match.OnInstantReplayEnd(() => { 
        this.setState({display: false});
    }));

    this.unsubscribers.push(
    this.match.OnGoalScored((data) => {
        this.setState({
            assister: data.assister,
            ball_last_touch: data.ball_last_touch,
            goalspeed: data.goalspeed,
            goaltime: data.goaltime,
            impact_location: data.impact_location,
            scorer: data.scorer
        });
    }));
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(){
    return (
    <div className="replay" style={{zIndex: 1000, opacity: this.state.display ? 1 : 0, transition: '400ms'}}>
        <div className="bottom-overlay">
        <div className={"goal-stats " + (this.state.scorer.teamnum === 0 ? 'blue' : 'orange')}>
            <div className="scored-by">
                <img src={goal_svg} alt=''/>
                <div>{this.state.scorer.name}</div>
            </div>
            <div className="goal-speed">
                <img src={shot_svg} alt=''/>
                <div>{(Math.ceil(this.state.goalspeed/1.609)) + "MPH"}</div>
            </div>
            <div className="assist" style={{visibility: this.state.assister.id !== "" ? 'visible' : 'hidden'}}>
                <img src={assist_svg} alt=''/>
                <div>{this.state.assister.name}</div>
            </div>
        </div>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2560 1440">
            <g id="bottom-replay-overlay-group">
            <path id="replay-bottom-overlay" className="st0" d="M2121.5,1360.9c5-2.1,32.3-38.9,39.8-39.4l398.6-23.1c0,1,0,141.6,0,141.6H0c0-14,0-133.5,0-142.5l399.4,23.5c7.9,0.5,39.7,38,40.3,38C1097.7,1401.7,2118.2,1362.3,2121.5,1360.9z"/>
            <circle className="st1" cx="41.8" cy="1392.1" r="10"/>
            <text transform="matrix(1 0 0 1 59.4526 1408.7168)" className="st1 st2 st3">REPLAY</text>
            </g>
            <g id="top-replay-overlay-group">
            <path id="replay-top-overlay" className="st0" d="M438.5,78.4c-5,2.1-32.3,38.9-39.8,39.4L0,140.9c0-1,0-141.6,0-141.6h2560c0,14,0,133.5,0,142.5l-399.4-23.5c-7.9-0.5-39.7-38-40.3-38C1462.3,37.6,441.8,77,438.5,78.4z"/>
            <circle className="st1" cx="2362.3" cy="53.9" r="10"/>
            <text transform="matrix(1 0 0 1 2380.0012 70.5469)" className="st1 st2 st3">REPLAY</text>
            </g>
        </svg>
        </div>
    </div>);
  }
}

export default Replay;
