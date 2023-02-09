import '../css/scoreboard.css';
import React from 'react';

class Scoreboard extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];

  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      time: "5:00",
      seconds: 5 * 60,
      isOT: false,
      teams: [
        {
          name: "Blue",
          score: 0,
        },
        {
          name: "Orange",
          score: 0,
        }
      ],
    };
  }

  componentDidMount() {
    this.unsubscribers.push(
      this.match.OnTimeUpdated((time, seconds, isOT) => {
        // Update time
        this.setState({
          time: time,
          seconds: seconds,
          isOT: isOT
        });
      })
    );

    this.unsubscribers.push(
      this.match.OnTeamsUpdated((teams) => {
        this.setState({teams: teams});
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
  }

  render() {
    let timeStyle = {color:"#fffbb3", fontSize: "60px"};
    if(!this.state.isOT)
    {
      if(this.state.seconds <= 10)
        timeStyle = {color:"rgb(209, 35, 23)", fontSize: "60px"};
      else if(this.state.seconds <= 30)
        timeStyle = {color:"#ffa53d", fontSize: "60px"};
      else if(this.state.seconds <= 60)
        timeStyle = {color:"#ffe880", fontSize: "60px"};
    }

    return <div className="scoreboard">
      
      <div className="left">
        <div className="name">{this.truncate(this.state.teams[0].name, 12)}</div>
        <div className="score">{this.state.teams[0].score}</div>
      </div>

      <div className="center">
        <div className="box">
          <div className="time" style={timeStyle}>{this.state.time}</div>
        </div>
      </div>

      <div className="right">
        <div className="name">{this.truncate(this.state.teams[1].name, 12)}</div>
        <div className="score">{this.state.teams[1].score}</div>
      </div>

      <div className="series-tally">
        <div className="left">
          <div className="mark w1"></div>
          <div className="mark w2"></div>
          <div className="mark w3"></div>
          <div className="mark w4"></div>
        </div>
        <div className="series-text">SERIES</div>
        <div className="right">
          <div className="mark w1"></div>
          <div className="mark w2"></div>
          <div className="mark w3"></div>
          <div className="mark w4"></div>
        </div>
      </div>

  </div>;
  }

  truncate(str, len) {
    return str.length > len ? str.substring(0, len) + "..." : str;
  }
}

export default Scoreboard;
