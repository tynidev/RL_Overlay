import '../css/PostGameStats.css';
import React, { FC } from 'react';
import { Match } from '../match';
import { NewPlayer, Player } from '../types/player';
import { NewTeam, Team } from '../types/team';
import { Series } from '../types/series';
import { GameTeam } from '../types/game';
import mvp_svg from '../assets/stat-icons/mvp.svg';
import { areEqual } from '../util/utils';

function arePlayersEqual(p1: Player, p2: Player): boolean{
  return !(
    p1.name !== p2.name ||
    p1.score !== p2.score ||
    p1.goals !== p2.goals ||
    p1.assists !== p2.assists ||
    p1.shots !== p2.shots ||
    p1.saves !== p2.saves ||
    p1.demos !== p2.demos
  );
}

export const getPostGameState = (
  match: Match,
  display: boolean
): PostGameProps => ({
  display: display,
  teams: match?.state?.game?.teams
    ? [match?.state?.game?.teams[0], match?.state?.game?.teams[1]]
    : [NewTeam(),NewTeam(),],
  left: (match?.state.left.length ?? 0) > 0 ? match?.state.left : [],
  right: (match?.state.right.length ?? 0) > 0 ? match?.state.right : [],
  series: match.series,
});

export interface PostGameProps {
  display: boolean;
  teams: GameTeam[];
  left: Player[];
  right: Player[];
  series: Series;
}

interface TeamCount {
  left: number;
  right: number;
}

interface Stats {
  score: TeamCount;
  goals: TeamCount;
  assists: TeamCount;
  shots: TeamCount;
  saves: TeamCount;
  demos: TeamCount;
}

interface TeamTable {
  mvpHeader:Array<boolean>;
  nameHeader:Array<string>; 
  statsRows:Array<Array<string>>;
}

function FillTeams_AggregateStats_GetMVP(
  teams: Team[],
  left_orig: Player[],
  right_orig: Player[]
): [TeamTable, TeamTable, Stats] {

  let leftTable:TeamTable = {mvpHeader:[], nameHeader:[], statsRows:[[],[],[],[],[],[]]};
  let rightTable:TeamTable = {mvpHeader:[], nameHeader:[], statsRows:[[],[],[],[],[],[]]};

  let mvp_max = 0;
  let mvp_idx = 0;

  let stats: Stats = {
    score: { left: 0, right: 0 },
    goals: { left: 0, right: 0 },
    assists: { left: 0, right: 0 },
    shots: { left: 0, right: 0 },
    saves: { left: 0, right: 0 },
    demos: { left: 0, right: 0 },
  };

  for (let i = 0; i < 3; i++) {
    if (i < left_orig.length) {
      // Fill Team with player
      let p = left_orig[i];
      leftTable.mvpHeader.push(false);
      leftTable.nameHeader.push(p.name);
      leftTable.statsRows[0].push(p.score.toString());
      leftTable.statsRows[1].push(p.goals.toString());
      leftTable.statsRows[2].push(p.assists.toString());
      leftTable.statsRows[3].push(p.shots.toString());
      leftTable.statsRows[4].push(p.saves.toString());
      leftTable.statsRows[5].push(p.demos.toString());

      // Aggregate Stats
      stats.score.left += p.score;
      stats.goals.left += p.goals;
      stats.assists.left += p.assists;
      stats.shots.left += p.shots;
      stats.saves.left += p.saves;
      stats.demos.left += p.demos;

      // Calculate MVP
      if (teams[0].score >= teams[1].score && p.score >= mvp_max) {
        mvp_idx = i;
        mvp_max = p.score;
      }
    } else {
      // Fill Team empty player
      leftTable.mvpHeader.push(false);
      leftTable.nameHeader.push('');
      leftTable.statsRows[0].push('');
      leftTable.statsRows[1].push('');
      leftTable.statsRows[2].push('');
      leftTable.statsRows[3].push('');
      leftTable.statsRows[4].push('');
      leftTable.statsRows[5].push('');
    }
  }

  for (let i = 0; i < 3; i++) {
    if (i < right_orig.length) {
      // Fill Team with player
      let p = right_orig[i];
      rightTable.mvpHeader.push(false);
      rightTable.nameHeader.push(p.name);
      rightTable.statsRows[0].push(p.score.toString());
      rightTable.statsRows[1].push(p.goals.toString());
      rightTable.statsRows[2].push(p.assists.toString());
      rightTable.statsRows[3].push(p.shots.toString());
      rightTable.statsRows[4].push(p.saves.toString());
      rightTable.statsRows[5].push(p.demos.toString());

      // Aggregate Stats
      stats.score.right += p.score;
      stats.goals.right += p.goals;
      stats.assists.right += p.assists;
      stats.shots.right += p.shots;
      stats.saves.right += p.saves;
      stats.demos.right += p.demos;

      // Calculate MVP
      if (teams[1].score >= teams[0].score && p.score >= mvp_max) {
        mvp_idx = i + 3;
        mvp_max = p.score;
      }
    } else {
      // Fill Team empty player
      rightTable.mvpHeader.push(false);
      rightTable.nameHeader.push('');
      rightTable.statsRows[0].push('');
      rightTable.statsRows[1].push('');
      rightTable.statsRows[2].push('');
      rightTable.statsRows[3].push('');
      rightTable.statsRows[4].push('');
      rightTable.statsRows[5].push('');
    }
  }

  if(mvp_idx < 3)
    leftTable.mvpHeader[mvp_idx] = true;
  else
    rightTable.mvpHeader[mvp_idx - 3] = true;
  
  const swapElement = (array:Array<any>, indexA:number, indexB:number) => {
    var tmp = array[indexA];
    array[indexA] = array[indexB];
    array[indexB] = tmp;
  }
  
  [leftTable.mvpHeader, leftTable.nameHeader].forEach(element => {
    swapElement(element, 0, 1);
    swapElement(element, 0, 2);
  });
  leftTable.statsRows.forEach(element => {
    swapElement(element, 0, 1);
    swapElement(element, 0, 2);
  });

  swapElement(rightTable.mvpHeader, 0, 1);
  swapElement(rightTable.nameHeader, 0, 1);
  rightTable.statsRows.forEach(element => {
    swapElement(element, 0, 1);
  });

  return [leftTable, rightTable, stats];
}

function calcPct({ left, right }: TeamCount): number {
  const num = left + right === 0 ? 0.5 : left / (left + right);
  return (360 - 10) * num;
}

const PostGameStatsCore: FC<PostGameProps> = (props) => {
 
  const [leftTable, rightTable, stats] = FillTeams_AggregateStats_GetMVP(
    props.teams,
    props.left,
    props.right
  );

  const leftStatSliderWidth = {
    'score': calcPct(stats.score),
    'goals': calcPct(stats.goals),
    'assists': calcPct(stats.assists),
    'shots': calcPct(stats.shots),
    'saves': calcPct(stats.saves),
    'demos': calcPct(stats.demos),
  };

  let series_txt = '';
  let game_txt = '';
  let best_of = '';
  if (props.series.length > 0) {
    let left_won = props.series.teams[0].matches_won;
    let right_won = props.series.teams[1].matches_won;
    let games = Math.ceil(props.series.length / 2);

    game_txt = `GAME ${left_won + right_won}`;
    best_of = `Best of ${props.series.length}`;
    const formText = (leader: string, wins: number, losses: number) =>
      `${leader} ${wins === games ? 'wins' : 'leads'} ${wins}-${losses}`;
    series_txt =
      left_won > right_won
        ? formText(props.series.teams[0].name, left_won, right_won)
        : right_won > left_won
        ? formText(props.series.teams[1].name, right_won, left_won)
        : `series tied ${left_won}-${right_won}`;
  }

  const TeamStatTable = (className:any, team:TeamTable):JSX.Element => {
    return (<table className={className}>
    <thead>
      <tr className="mvp-row">
        {team.mvpHeader.map((value, index) => {
          return <th><img className="mvp" src={mvp_svg} alt="" style={{ visibility: value ? 'visible' : 'hidden' }} key={index}/></th>
        })}
      </tr>
      <tr className="name">
        {team.nameHeader.map((value, index) => {
          return <th key={index}>{value}</th>
        })}
      </tr>
    </thead>
    <tbody>
      {team.statsRows.map((stats, statIdx):JSX.Element => {
        return <tr key={statIdx}>{stats.map((playerStat, playerStatIdx):JSX.Element =>{
          return <td key={playerStatIdx}>{playerStat}</td>;
        })}</tr>
      })}
    </tbody>
  </table>);
  };

  let sliders:JSX.Element[] = [];
  Object.keys(leftStatSliderWidth).forEach((sliderStat, idx) => {
    let value = leftStatSliderWidth[sliderStat as keyof typeof leftStatSliderWidth];
    sliders.push(<div className="stat-slider" key={idx}>
      <div className="stat-slider-name">{sliderStat}</div>
      <div className="stat-slider-box">
        <div className="stat-slider-left" style={{ width: value }} />
        <div className="stat-slider-right"style={{ width: 360 - 10 - value, left: value + 5 }} />
      </div>
    </div>);
  });

  return (
    <div
      className="postgame-stats"
      style={{ opacity: props.display ? '1' : '0', transition: '400ms' }}
    >
      <div className="left-team-score-overline"></div>
      <div className="left-team-score">{props.teams[0].score}</div>
      <div className="left-team-name">{props.series.teams[0].name}</div>

      <div className="seriesBox">
        <div className="game_txt">{game_txt}</div>
        <div className="best_of">{best_of}</div>
      </div>

      <div className="series-score">{series_txt}</div>

      <div className="right-team-score-overline"></div>
      <div className="right-team-score">{props.teams[1].score}</div>
      <div className="right-team-name">{props.series.teams[1].name}</div>

      <div className="bottom-postgame-darken"></div>

      {TeamStatTable("left-team-stats", leftTable)}

      <div className="stat-sliders">
        {sliders}
      </div>

      {TeamStatTable("right-team-stats", rightTable)}

      <div className="left-player-names-underline"></div>
      <div className="right-player-names-underline"></div>
    </div>
  );
};

function ShouldUpdate(prevProps:PostGameProps, nextProps:PostGameProps): boolean{
  return!(
    prevProps.display !== nextProps.display ||
    // Team Scores for current game
    prevProps.teams.length !== nextProps.teams.length ||
    prevProps.teams[0].score !== nextProps.teams[0].score ||
    prevProps.teams[1].score !== nextProps.teams[1].score ||
    // Series Info
    prevProps.series.length !== nextProps.series.length ||
    prevProps.series.series_txt !== nextProps.series.series_txt ||
    prevProps.series.teams.length !== nextProps.series.teams.length ||
    prevProps.series.teams[0].name !== nextProps.series.teams[0].name ||
    prevProps.series.teams[1].name !== nextProps.series.teams[1].name ||
    prevProps.series.teams[0].matches_won !== nextProps.series.teams[0].matches_won ||
    prevProps.series.teams[1].matches_won !== nextProps.series.teams[1].matches_won ||
    // Left and Right team members
    !areEqual(prevProps.left, nextProps.left, arePlayersEqual) ||
    !areEqual(prevProps.right, nextProps.right, arePlayersEqual));
}
export const PostGameStats = React.memo(
  PostGameStatsCore,
  ShouldUpdate
);
