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
          time: time
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

    return <div className="scoreboard">
      
      <div className="left">
        <div className="name">{this.truncate(this.state.teams[0].name, 12)}</div>
        <div className="score">{this.state.teams[0].score}</div>
      </div>

      <div className="center">
        <div className="box">
          <div className="time">{this.state.time}</div>
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
