import '../css/Scoreboard.css';
import React from 'react';

// eslint-disable-next-line no-unused-vars
import Match from '../match'

class Scoreboard extends React.PureComponent {
  
  /**
     * Static method to generate props from match
     * @param {Match} match
     */
  static GetState(match){
    return {
      time: match?.game ? Match.GameTimeString(match.game) : "5:00",
      seconds: match?.game?.seconds ?? 5 * 60,
      isOT: match?.game?.isOT ?? false,
      teams: match?.game?.teams ?? [
        {
          name: "Blue",
          score: 0,
        },
        {
          name: "Orange",
          score: 0,
        }
      ],
      series: match?.series ?? {
        series_txt : "ROCKET LEAGUE",
        length : 1, 
        teams: [
            {
            team : 0,
            name : "Blue",
            matches_won : 0
            },
            {
            team : 1,
            name : "Orange",
            matches_won : 0
            }
        ]
    },
    }
  }

  render() {
    let {time, seconds, isOT, teams, series} = this.props;
    let timeStyle = {color:"#fffbb3"};
    if(!isOT)
    {
      if(seconds <= 10)
        timeStyle = {color:"rgb(209, 35, 23)"};
      else if(seconds <= 30)
        timeStyle = {color:"#ffa53d"};
      else if(seconds <= 60)
        timeStyle = {color:"#ffe880"};
    }

    let leftTeamName = teams[0].name;
    let rightTeamName = teams[1].name;
    let series_txt = '';
    
    let leftMarks = (<div className="left" />);
    let rightMarks = (<div className="right" />);
    
    series_txt = series.series_txt;
    if(series.length > 0)
    {
      leftTeamName = series.teams[0].name;
      rightTeamName = series.teams[1].name;

      let games = Math.ceil(series.length / 2);
      let leftWon = series.teams[0].matches_won;
      let rightWon = series.teams[1].matches_won;

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

    return <div className="scoreboard">
      
      <div className="left">
        <div className="name">{this.truncate(leftTeamName, 12)}</div>
        <div className="score">{teams[0].score}</div>
      </div>

      <div className="center">
        <div className="box">
          <div className="time" style={timeStyle}>{time}</div>
        </div>
      </div>

      <div className="right">
        <div className="name">{this.truncate(rightTeamName, 12)}</div>
        <div className="score">{teams[1].score}</div>
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