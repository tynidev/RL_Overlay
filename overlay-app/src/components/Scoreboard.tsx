import '../css/Scoreboard.css';
import React, { FC } from 'react';
import { Match } from '../match';
import { truncate } from '../util/utils';

export const getState = (match: Match | undefined) => ({
  time: match?.getGameTimeString() ?? '5:00',
  seconds: match?.state.game?.time_seconds ?? 5 * 60,
  isOT: match?.state.game?.isOT ?? false,
  teams: match?.state.game?.teams ?? [
    {
      name: 'Blue',
      score: 0,
    },
    {
      name: 'Orange',
      score: 0,
    },
  ],
  series: match?.series ?? {
    series_txt: 'ROCKET LEAGUE',
    length: 1,
    teams: [
      {
        team: 0,
        name: 'Blue',
        matches_won: 0,
      },
      {
        team: 1,
        name: 'Orange',
        matches_won: 0,
      },
    ],
  },
});

export const Scoreboard: FC<ReturnType<typeof getState>> = (props) => {
  const { time, seconds, isOT, teams, series } = props;
  let timeStyle = { color: '#fffbb3' };
  if (!isOT) {
    if (seconds <= 10) timeStyle = { color: 'rgb(209, 35, 23)' };
    else if (seconds <= 30) timeStyle = { color: '#ffa53d' };
    else if (seconds <= 60) timeStyle = { color: '#ffe880' };
  }

  let leftTeamName = teams[0].name;
  let rightTeamName = teams[1].name;
  let series_txt = '';

  let leftMarks = <div className="left" />;
  let rightMarks = <div className="right" />;

  series_txt = series.series_txt;
  if (series.length > 0) {
    leftTeamName = series.teams[0].name;
    rightTeamName = series.teams[1].name;

    let games = Math.ceil(series.length / 2);
    let leftWon = series.teams[0].matches_won;
    let rightWon = series.teams[1].matches_won;

    let leftRows = [];
    let rightRows = [];
    for (var i = 1; i <= games; i++) {
      leftRows.push(
        <div className={'mark' + (leftWon > 0 ? ' w' : '')} key={i}></div>
      );
      rightRows.push(
        <div className={'mark' + (rightWon > 0 ? ' w' : '')} key={i}></div>
      );

      leftWon--;
      rightWon--;
    }

    leftMarks = <div className="left">{leftRows}</div>;

    rightMarks = <div className="right">{rightRows}</div>;
  }

  let leftFontSize = leftTeamName.length <= 13 ? "2.5rem" : (leftTeamName.length <= 16 ? "2rem" : "1.5rem");
  let rightFontSize = rightTeamName.length <= 13 ? "2.5rem" : (rightTeamName.length <= 16 ? "2rem" : "1.5rem");

  return (
    <div className="scoreboard">
      <div className="left">
        <div className="name" style={{fontSize:leftFontSize}}>{truncate(leftTeamName, 23)}</div>
        <div className="score">{teams[0].score}</div>
      </div>

      <div className="center">
        <div className="box">
          <div className="time" style={timeStyle}>
            {time}
          </div>
        </div>
      </div>

      <div className="right">
        <div className="name" style={{fontSize:rightFontSize}}>{truncate(rightTeamName, 23)}</div>
        <div className="score">{teams[1].score}</div>
      </div>

      <div className="series-tally">
        {leftMarks}
        <div className="series-text">{series_txt}</div>
        {rightMarks}
      </div>
    </div>
  );
};