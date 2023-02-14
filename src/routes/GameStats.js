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
