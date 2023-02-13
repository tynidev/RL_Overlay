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
    };
  }

  componentDidMount() {
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(){
    return (
      <div className="overlay">
        <PostGameStats match={this.match} displayPostGame={true}/>
      </div>);
  }
}

export default GameStats;
