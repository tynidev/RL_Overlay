import '../css/Scoreboard.css';
import React, { FC } from 'react';
import { Match } from '../match';
import { scaleText } from '../util/utils';

export const getState = (match: Match | undefined) => ({
  time: match?.getGameTimeString() ?? '5:00',
  seconds: match?.gameState.game?.time_seconds ?? 5 * 60,
  isOT: match?.gameState.game?.isOT ?? false,
  teams: match?.gameState.game?.teams ?? [
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
        logo: ''
      },
      {
        team: 1,
        name: 'Orange',
        matches_won: 0,
        logo: ''
      },
    ],
  },
})

export const Scoreboard: FC<ReturnType<typeof getState>> = (props) => {
  const { time, seconds, isOT, teams, series } = props;
  let timeStyle = { color: '#fffbb3' };
  if (!isOT) {
    if (seconds <= 10) timeStyle = { color: 'rgb(209, 35, 23)' };
    else if (seconds <= 30) timeStyle = { color: '#ffa53d' };
    else if (seconds <= 60) timeStyle = { color: '#ffe880' };
  }

  let leftTeamName = teams[0].name;
  let leftTeamLogo = series.teams[0].logo;
  let rightTeamName = teams[1].name;
  let rightTeamLogo = series.teams[1].logo;
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

    leftMarks = <div className="tally-side left">{leftRows}</div>;

    rightMarks = <div className="tally-side right">{rightRows}</div>;
  }

  let sizes:Array<[number, string]> = [[13, "2.5rem"], [16, "2rem"], [23, "1.5rem"]];
  let leftFontSize, rightFontSize = "1.5rem";
  [leftTeamName, leftFontSize] = scaleText(leftTeamName, sizes);
  [rightTeamName, rightFontSize] = scaleText(rightTeamName, sizes);
  let hasBothLogos = leftTeamLogo && rightTeamLogo;

  return (
    <div className="scoreboard-wrapper">
      <div className={`scoreboard ${hasBothLogos && 'has-logos'}`}>
        <div className="side left">
          <div className="name" style={{fontSize:leftFontSize}}>{leftTeamName}</div>
          <div className="score">{teams[0].score}</div>
          { hasBothLogos && <div className="logo">
            <div className="logo-inner" style={{backgroundImage: `url(${leftTeamLogo})`}}></div>
          </div> }
          <div className="series-tally">
            {leftMarks}
          </div>
        </div>

        <div className="center">
          <div className="box">
            <div className="time" style={timeStyle}>
              {time}
            </div>
          </div>
          <div className="series-text">{series_txt}</div>
        </div>

        <div className="side right">
          <div className="name" style={{fontSize:rightFontSize}}>{rightTeamName}</div>
          <div className="score">{teams[1].score}</div>
          { hasBothLogos && <div className="logo">
            <div className="logo-inner" style={{backgroundImage: `url(${rightTeamLogo})`}}></div>
          </div> }
          <div className="series-tally">
            {rightMarks}
          </div>
        </div>

        <div style={{ clear: "both" }}></div>
      </div>
    </div>
  );
};