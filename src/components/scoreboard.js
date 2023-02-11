import '../css/Scoreboard.css';
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
      series: undefined,
    };
  }

  componentDidMount() {
    // OnTimeUpdated - When a time update is recieved
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

    // OnTeamsUpdated - When Team scores/names/colors are updated
    this.unsubscribers.push(
      this.match.OnTeamsUpdated((teams) => {
        this.setState({teams: teams});
      })
    );

    // OnSeriesUpdate
    this.unsubscribers.push(
      this.match.OnSeriesUpdate((series) => {
        this.setState({
          series: series
        })
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
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

    let leftTeamName = this.state.teams[0].name;
    let rightTeamName = this.state.teams[1].name;
    let series_txt = '';
    
    let leftMarks = (<div className="left" />);
    let rightMarks = (<div className="right" />);
    
    if(this.state.series)
    {
      leftTeamName = this.state.series.teams[0].name;
      rightTeamName = this.state.series.teams[1].name;
      series_txt = this.state.series.series_txt;

      let games = Math.ceil(this.state.series.length / 2);
      let leftWon = this.state.series.teams[0].matches_won;
      let rightWon = this.state.series.teams[1].matches_won;
      if(games > 1)
      {
        let leftRows = [];
        let rightRows = [];
        for(var i = 1; i <= games; i++)
        {

          leftRows.push((<div className={"mark" + (leftWon > 0 ? " w" : "")} key={i}></div>));
          rightRows.push((<div className={"mark" + (rightWon > 0 ? " w" : "")} key={i}></div>));

          leftWon--;
          rightWon--;
        }

        leftMarks = 
          (<div className="left">
            {leftRows}
          </div>);

        rightMarks = 
          (<div className="right">
            {rightRows}
          </div>);
      }
    }

    return <div className="scoreboard">
      
      <div className="left">
        <div className="name">{this.truncate(leftTeamName, 12)}</div>
        <div className="score">{this.state.teams[0].score}</div>
      </div>

      <div className="center">
        <div className="box">
          <div className="time" style={timeStyle}>{this.state.time}</div>
        </div>
      </div>

      <div className="right">
        <div className="name">{this.truncate(rightTeamName, 12)}</div>
        <div className="score">{this.state.teams[1].score}</div>
      </div>

      <div className="series-tally">
        {leftMarks}
        <div className="series-text">{series_txt}</div>
        {rightMarks}
      </div>

  </div>;
  }

  truncate(str, len) {
    return str.length > len ? str.substring(0, len) + "..." : str;
  }
}

export default Scoreboard;
