import React from 'react';
import PostGameStats from '../components/PostGameStats';

class GameStats extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      PostGameStatsState: PostGameStats.GetState(this.match)
    };
  }

  componentDidMount() {
    // OnPlayersUpdated - When players stats/properties have changed
    this.unsubscribers.push(
      this.match.OnPlayersUpdated((left, right) => {
        this.setState({ 
          PostGameStatsState: PostGameStats.GetState(this.match),
        });
      })
    );    
    
    // OnTeamsUpdated - When Team scores/names/colors are updated
    this.unsubscribers.push(
      this.match.OnTeamsUpdated((teams) => {
        this.setState({
          PostGameStatsState: PostGameStats.GetState(this.match),
        })
    }));

    // OnSeriesUpdate
    this.unsubscribers.push(
      this.match.OnSeriesUpdate((series) => {
        this.setState({
          PostGameStatsState: PostGameStats.GetState(this.match),
        })
    }));

    // OnGameEnded - When name of team winner is displayed on screen after game is over
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        this.setState({
          PostGameStatsState: PostGameStats.GetState(this.match),
        });
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(){
    return (
      <div className="overlay" style={{transformOrigin: "left", transform:"scale(" + this.props.width / 2560 + ")"}}>
        <PostGameStats {...this.state.PostGameStatsState} display={true}/>
      </div>);
  }
}

export default GameStats;
