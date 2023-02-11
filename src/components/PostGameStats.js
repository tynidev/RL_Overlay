import '../css/PostGameStats.css';
import React from 'react';

class PostGameStats extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
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
        left: [],
        right: [],
        display: props.displayPostGame,
    };
  }

  componentDidMount() {
    // OnPlayersUpdated - When players stats/properties have changed
    this.unsubscribers.push(
      this.match.OnPlayersUpdated((left, right) => {
        this.setState({left: left,right: right});
      })
    );    
    // OnTeamsUpdated - When Team scores/names/colors are updated
    this.unsubscribers.push(
      this.match.OnTeamsUpdated((teams) => {
        this.setState({teams: teams});
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(){
    if(!this.props.displayPostGame)
        return (<div style={{display:"none"}}/>);
    let stats = {
        score: { left: 0, right: 0},
        goals: { left: 0, right: 0},
        assists: { left: 0, right: 0},
        shots: { left: 0, right: 0},
        saves: { left: 0, right: 0},
        demos: { left: 0, right: 0},
    };
    let left = [];
    for(let i = 0; i < 3; i++){
        if(i < this.state.left.length){
            let p = this.state.left[i];
            left.push(this.state.left[i]);
            stats.score.left += p.score;
            stats.goals.left += p.goals;
            stats.assists.left += p.assists;
            stats.shots.left += p.shots;
            stats.saves.left += p.saves;
            stats.demos.left += p.demos;
        }
        else{
            left.push({
                name: '',
                score: '',
                goals: '',
                assists: '',
                shots: '',
                saves: '',
                demos: '',
            });
        }
    }
    let right = [];
    for(let i = 0; i < 3; i++){
        if(i < this.state.right.length){
            let p = this.state.right[i];
            right.push(this.state.right[i]);
            stats.score.right += p.score;
            stats.goals.right += p.goals;
            stats.assists.right += p.assists;
            stats.shots.right += p.shots;
            stats.saves.right += p.saves;
            stats.demos.right += p.demos;
        }
        else{
            right.push({
                name: '',
                score: '',
                goals: '',
                assists: '',
                shots: '',
                saves: '',
                demos: '',
            });
        }
    }

    let leftStatSliderWidth = {
        score: (360 - 10) * (stats.score.left / (stats.score.left + stats.score.right)),
        goals: (360 - 10) * (stats.goals.left / (stats.goals.left + stats.goals.right)),
        assists: (360 - 10) * (stats.assists.left / (stats.assists.left + stats.assists.right)),
        shots: (360 - 10) * (stats.shots.left / (stats.shots.left + stats.shots.right)),
        saves: (360 - 10) * (stats.saves.left / (stats.saves.left + stats.saves.right)),
        demos: (360 - 10) * (stats.demos.left / (stats.demos.left + stats.demos.right)),
    };
    
    return (
    <div className="postgame-stats">
        <div className="left-team-score-overline"></div>
        <div className="left-team-score">{this.state.teams[0].score}</div>
        <div className="left-team-name">{this.state.teams[0].name}</div>

        {/*<div className='seriesBox'> 
            <div className='game_txt'>Game 2</div>
            <div className='best_of'>BO7</div>
        </div>

        <div className='series-score'>gengmobile leads 2-0</div> */}

        <div className="right-team-score-overline"></div>
        <div className="right-team-score">{this.state.teams[1].score}</div>
        <div className="right-team-name">{this.state.teams[1].name}</div>

        <div className="bottom-postgame-darken"></div>

        <table className="left-team-stats">
            <tr>
                <th>{left[0].name}</th><th>{left[1].name}</th><th>{left[2].name}</th>
            </tr>
            <tr className='score'>
                <td>{left[0].score}</td><td>{left[1].score}</td><td>{left[2].score}</td>
            </tr>
            <tr className='goals'>
                <td>{left[0].goals}</td><td>{left[1].goals}</td><td>{left[2].goals}</td>
            </tr>
            <tr className='assists'>
                <td>{left[0].assists}</td><td>{left[1].assists}</td><td>{left[2].assists}</td>
            </tr>
            <tr className='shots'>
                <td>{left[0].shots}</td><td>{left[1].shots}</td><td>{left[2].shots}</td>
            </tr>
            <tr className='saves'>
                <td>{left[0].saves}</td><td>{left[1].saves}</td><td>{left[2].saves}</td>
            </tr>
            <tr className='demos'>
                <td>{left[0].demos}</td><td>{left[1].demos}</td><td>{left[2].demos}</td>
            </tr>
        </table>

        <div className='stat-sliders'>
            <div className='stat-slider'>
                <div className='stat-slider-name'>score</div>
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
            <tr className='name'>
                <th>{right[0].name}</th><th>{right[1].name}</th><th>{right[2].name}</th>
            </tr>
            <tr className='score'>
                <td>{right[0].score}</td><td>{right[1].score}</td><td>{right[2].score}</td>
            </tr>
            <tr className='goals'>
                <td>{right[0].goals}</td><td>{right[1].goals}</td><td>{right[2].goals}</td>
            </tr>
            <tr className='assists'>
                <td>{right[0].assists}</td><td>{right[1].assists}</td><td>{right[2].assists}</td>
            </tr>
            <tr className='shots'>
                <td>{right[0].shots}</td><td>{right[1].shots}</td><td>{right[2].shots}</td>
            </tr>
            <tr className='saves'>
                <td>{right[0].saves}</td><td>{right[1].saves}</td><td>{right[2].saves}</td>
            </tr>
            <tr className='demos'>
                <td>{right[0].demos}</td><td>{right[1].demos}</td><td>{right[2].demos}</td>
            </tr>
        </table>
        <div className="left-player-names-underline"></div>
        <div className="right-player-names-underline"></div>
    </div>);
  }
}

export default PostGameStats;