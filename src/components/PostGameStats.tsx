import '../css/PostGameStats.css';
import React from 'react';

// eslint-disable-next-line no-unused-vars
import Match from '../match'
import { Player } from "../types/player";
import { Team } from '../types/team';
import { Series } from '../types/series';
import { GameTeam } from '../types/game';

const mvp_svg = require('../assets/stat-icons/mvp.svg') as string;

export const postGameGetState = (match:Match, display:boolean):PostGameProps => ({
    display: display,
    teams: match?.state?.game?.teams ? [
        match?.state?.game?.teams[0],
        match?.state?.game?.teams[1],
    ] : [{ score: 0, name: '', color_primary: '', color_secondary: '' }, { score: 0, name: '', color_primary: '', color_secondary: '' }],
    left: (match?.state.left.length ?? 0) > 0 ? match?.state.left : [],
    right: (match?.state.right.length ?? 0) > 0 ? match?.state.right : [],
    series: match.series,
});

interface PostGameProps {
    display: boolean,
    teams: GameTeam[];
    left: Player[];
    right: Player[];
    series: Series;
}

interface TeamCount{
    left: number,
    right: number,
}

interface Stats {
    score: TeamCount,
    goals: TeamCount,
    assists: TeamCount,
    shots: TeamCount,
    saves: TeamCount,
    demos: TeamCount,
}

export class PostGameStats extends React.Component<PostGameProps, {}> {

    arePlayersEqual(p1:Player, p2:Player) {
        return !(
            p1.name !== p2.name ||
            p1.score !== p2.score ||
            p1.goals !== p2.goals ||
            p1.assists !== p2.assists ||
            p1.shots !== p2.shots ||
            p1.saves !== p2.saves ||
            p1.demos !== p2.demos
            )
    }

    areTeamsEqual(oldLeft:Player[], oldRight:Player[], newLeft:Player[], newRight:Player[]) {
        if(oldLeft.length !== newLeft.length || oldRight.length !== newRight.length)
            return false;

        for (let i = 0; i < oldLeft.length; i++) {
            if(!this.arePlayersEqual(oldLeft[i], newLeft[i]))
                return false;
        }

        for (let i = 0; i < oldRight.length; i++) {
            if(!this.arePlayersEqual(oldRight[i], newRight[i]))
                return false;
        }

        return true;
    }

    shouldComponentUpdate(nextProps: PostGameProps, nextState:{}) {
        return (
            this.props.display !== nextProps.display ||
            this.props.teams.length !== nextProps.teams.length ||
            this.props.teams[0].score !== nextProps.teams[0].score ||
            this.props.teams[1].score !== nextProps.teams[1].score ||
            !this.areTeamsEqual(this.props.left, this.props.right, nextProps.left, nextProps.right) ||
            this.props.series.length !== nextProps.series.length ||
            this.props.series.series_txt !== nextProps.series.series_txt ||
            this.props.series.teams.length !== nextProps.series.teams.length ||
            this.props.series.teams[0].name !== nextProps.series.teams[0].name ||
            this.props.series.teams[1].name !== nextProps.series.teams[1].name ||
            this.props.series.teams[0].matches_won !== nextProps.series.teams[0].matches_won ||
            this.props.series.teams[1].matches_won !== nextProps.series.teams[1].matches_won
            );
    }

  render(){

    if(!this.props.display)
        return "";

    let [left_team, right_team, stats, mvp] = this.FillTeams(this.props.teams, this.props.left, this.props.right);

    let leftStatSliderWidth = {
        score: (360 - 10) * this.GetPercentage(stats.score.left, stats.score.right),
        goals: (360 - 10) * this.GetPercentage(stats.goals.left, stats.goals.right),
        assists: (360 - 10) * this.GetPercentage(stats.assists.left, stats.assists.right),
        shots: (360 - 10) * this.GetPercentage(stats.shots.left, stats.shots.right),
        saves: (360 - 10) * this.GetPercentage(stats.saves.left, stats.saves.right),
        demos: (360 - 10) * this.GetPercentage(stats.demos.left, stats.demos.right),
    };
    
    let series_txt = "";
    let game_txt = "";
    let best_of = "";
    if(this.props.series.length > 0)
    {
        let left_won = this.props.series.teams[0].matches_won;
        let right_won = this.props.series.teams[1].matches_won;
        let games = Math.ceil(this.props.series.length / 2);

        let games_played = left_won + right_won;
        game_txt = "GAME " + games_played; 
        best_of = "Best of " + this.props.series.length;
        if(left_won > right_won)
        {
            if(left_won === games)
                series_txt = this.props.series.teams[0].name + " wins " + left_won + "-" + right_won;
            else
                series_txt = this.props.series.teams[0].name + " leads " + left_won + "-" + right_won;
        }
        else if(left_won < right_won)
        {
            if(right_won === games)
                series_txt = this.props.series.teams[1].name + " wins " + right_won + "-" + left_won;
            else
                series_txt = this.props.series.teams[1].name + " leads " + right_won + "-" + left_won;
        }
        else
        {
            series_txt = "series tied " + left_won + "-" + right_won;
        }
    }

    return (
    <div className="postgame-stats" style={{opacity:this.props.display ? "1" : "0", transition:"400ms"}}>
        <div className="left-team-score-overline"></div>
        <div className="left-team-score">{this.props.teams[0].score}</div>
        <div className="left-team-name">{this.props.series.teams[0].name}</div>

        <div className='seriesBox'> 
            <div className='game_txt'>{game_txt}</div>
            <div className='best_of'>{best_of}</div>
        </div>

        <div className='series-score'>{series_txt}</div>

        <div className="right-team-score-overline"></div>
        <div className="right-team-score">{this.props.teams[1].score}</div>
        <div className="right-team-name">{this.props.series.teams[1].name}</div>

        <div className="bottom-postgame-darken"></div>

        <table className="left-team-stats">
            <thead>
            <tr className='mvp-row'>
                <th><img className="mvp" src={mvp_svg} alt='' style={{visibility:mvp[2] ? "visible" : "hidden"}}/></th><th><img className="mvp" src={mvp_svg} alt='' style={{visibility:mvp[0] ? "visible" : "hidden"}}/></th><th><img className="mvp" src={mvp_svg} alt='' style={{visibility:mvp[1] ? "visible" : "hidden"}}/></th>
            </tr>
            <tr className='name'>
                <th>{left_team[2].name}</th><th>{left_team[0].name}</th><th>{left_team[1].name}</th>
            </tr>
            </thead>
            <tbody>
            <tr className='score'>
                <td>{left_team[2].score}</td><td>{left_team[0].score}</td><td>{left_team[1].score}</td>
            </tr>
            <tr className='goals'>
                <td>{left_team[2].goals}</td><td>{left_team[0].goals}</td><td>{left_team[1].goals}</td>
            </tr>
            <tr className='assists'>
                <td>{left_team[2].assists}</td><td>{left_team[0].assists}</td><td>{left_team[1].assists}</td>
            </tr>
            <tr className='shots'>
                <td>{left_team[2].shots}</td><td>{left_team[0].shots}</td><td>{left_team[1].shots}</td>
            </tr>
            <tr className='saves'>
                <td>{left_team[2].saves}</td><td>{left_team[0].saves}</td><td>{left_team[1].saves}</td>
            </tr>
            <tr className='demos'>
                <td>{left_team[2].demos}</td><td>{left_team[0].demos}</td><td>{left_team[1].demos}</td>
            </tr>
            </tbody>
        </table>

        <div className='stat-sliders'>
            <div className='stat-slider' style={{height:"80px"}}>
                <div className='stat-slider-name' style={{lineHeight:"70px"}}>score</div>
                <div className='stat-slider-box'>
                    <div className='stat-slider-left' style={{width:leftStatSliderWidth.score}}/> <div className='stat-slider-right' style={{width:(360 - 10 - leftStatSliderWidth.score), left:leftStatSliderWidth.score+5}}/>
                </div>
            </div>
            <div className='stat-slider'>
                <div className='stat-slider-name'>goals</div>
                <div className='stat-slider-box'>
                    <div className='stat-slider-left' style={{width:leftStatSliderWidth.goals}}/> <div className='stat-slider-right' style={{width:(360 - 10 - leftStatSliderWidth.goals), left:leftStatSliderWidth.goals+5}}/>
                </div>
            </div>
            <div className='stat-slider'>
                <div className='stat-slider-name'>assists</div>
                <div className='stat-slider-box'>
                    <div className='stat-slider-left' style={{width:leftStatSliderWidth.assists}}/> <div className='stat-slider-right' style={{width:(360 - 10 - leftStatSliderWidth.assists), left:leftStatSliderWidth.assists+5}}/>
                </div>
            </div>
            <div className='stat-slider'>
                <div className='stat-slider-name'>shots</div>
                <div className='stat-slider-box'>
                    <div className='stat-slider-left' style={{width:leftStatSliderWidth.shots}}/> <div className='stat-slider-right' style={{width:(360 - 10 - leftStatSliderWidth.shots), left:leftStatSliderWidth.shots+5}}/>
                </div>
            </div>
            <div className='stat-slider'>
                <div className='stat-slider-name'>saves</div>
                <div className='stat-slider-box'>
                    <div className='stat-slider-left' style={{width:leftStatSliderWidth.saves}}/> <div className='stat-slider-right' style={{width:(360 - 10 - leftStatSliderWidth.saves), left:leftStatSliderWidth.saves+5}}/>
                </div>
            </div>
            <div className='stat-slider'>
                <div className='stat-slider-name'>demos</div>
                <div className='stat-slider-box'>
                    <div className='stat-slider-left' style={{width:leftStatSliderWidth.demos}}/> <div className='stat-slider-right' style={{width:(360 - 10 - leftStatSliderWidth.demos), left:leftStatSliderWidth.demos+5}}/>
                </div>
            </div>
        </div>

        <table className="right-team-stats">
            <thead>
            <tr className='mvp-row'>
                <th><img className="mvp" src={mvp_svg} alt='' style={{visibility:mvp[5] ? "visible" : "hidden"}}/></th><th><img className="mvp" src={mvp_svg} alt='' style={{visibility:mvp[3] ? "visible" : "hidden"}}/></th><th><img className="mvp" src={mvp_svg} alt='' style={{visibility:mvp[4] ? "visible" : "hidden"}}/></th>
            </tr>
            <tr className='name'>
                <th>{right_team[2].name}</th><th>{right_team[0].name}</th><th>{right_team[1].name}</th>
            </tr>
            </thead>
            <tbody>
            <tr className='score'>
                <td>{right_team[2].score}</td><td>{right_team[0].score}</td><td>{right_team[1].score}</td>
            </tr>
            <tr className='goals'>
                <td>{right_team[2].goals}</td><td>{right_team[0].goals}</td><td>{right_team[1].goals}</td>
            </tr>
            <tr className='assists'>
                <td>{right_team[2].assists}</td><td>{right_team[0].assists}</td><td>{right_team[1].assists}</td>
            </tr>
            <tr className='shots'>
                <td>{right_team[2].shots}</td><td>{right_team[0].shots}</td><td>{right_team[1].shots}</td>
            </tr>
            <tr className='saves'>
                <td>{right_team[2].saves}</td><td>{right_team[0].saves}</td><td>{right_team[1].saves}</td>
            </tr>
            <tr className='demos'>
                <td>{right_team[2].demos}</td><td>{right_team[0].demos}</td><td>{right_team[1].demos}</td>
            </tr>
            </tbody>
        </table>
        <div className="left-player-names-underline"></div>
        <div className="right-player-names-underline"></div>
    </div>);
  }

  FillTeams(teams:Team[], left_orig:Player[], right_orig:Player[]): [Player[], Player[], Stats, boolean[]]{
    
    let mvp = [false, false, false, false, false, false];
    let mvp_max = 0;
    let mvp_idx = 0;
    
    let stats:Stats = {
        score: { left: 0, right: 0},
        goals: { left: 0, right: 0},
        assists: { left: 0, right: 0},
        shots: { left: 0, right: 0},
        saves: { left: 0, right: 0},
        demos: { left: 0, right: 0},
    };

    let left:Player[] = [];
    for(let i = 0; i < 3; i++){
        if(i < left_orig.length){
            let p = left_orig[i];
            left.push(left_orig[i]);
            stats.score.left += p.score;
            stats.goals.left += p.goals;
            stats.assists.left += p.assists;
            stats.shots.left += p.shots;
            stats.saves.left += p.saves;
            stats.demos.left += p.demos;
            if(teams[0].score >= teams[1].score && p.score >= mvp_max)
            {
                mvp_idx = i;
                mvp_max = p.score;
            }
        }
        else{
            left.push({
                name: '',
                score: 0,
                goals: 0,
                assists: 0,
                shots: 0,
                saves: 0,
                demos: 0,
                attacker: '',
                boost: 0,
                cartouches: 0,
                hasCar: false,
                id: '',
                isDead: false,
                isPowersliding: false,
                isSonic: false,
                location: {
                    X: 0,
                    Y: 0,
                    Z: 0,
                    pitch: 0,
                    roll: 0,
                    yaw: 0
                },
                onGround: false,
                onWall: false,
                primaryID: '',
                shortcut: 0,
                speed: 0,
                team: 0,
                touches: 0
            });
        }
    }
    let right:Player[] = [];
    for(let i = 0; i < 3; i++){
        if(i < right_orig.length){
            let p = right_orig[i];
            right.push(right_orig[i]);
            stats.score.right += p.score;
            stats.goals.right += p.goals;
            stats.assists.right += p.assists;
            stats.shots.right += p.shots;
            stats.saves.right += p.saves;
            stats.demos.right += p.demos;
            if(teams[1].score >= teams[0].score && p.score >= mvp_max)
            {
                mvp_idx = i + 3;
                mvp_max = p.score;
            }
        }
        else{
            right.push({
                name: '',
                score: 0,
                goals: 0,
                assists: 0,
                shots: 0,
                saves: 0,
                demos: 0,
                attacker: '',
                boost: 0,
                cartouches: 0,
                hasCar: false,
                id: '',
                isDead: false,
                isPowersliding: false,
                isSonic: false,
                location: {
                    X: 0,
                    Y: 0,
                    Z: 0,
                    pitch: 0,
                    roll: 0,
                    yaw: 0
                },
                onGround: false,
                onWall: false,
                primaryID: '',
                shortcut: 0,
                speed: 0,
                team: 0,
                touches: 0
            });
        }
    }

    mvp[mvp_idx] = true;
    
    return [left, right, stats, mvp];
  } 

  GetPercentage(left:number, right:number){
    if(left + right === 0)
        return 0.5;
    var num = (left / (left + right));
    return num;
  }
}

export default PostGameStats;