import React from 'react';
import Scoreboard from './scoreboard';
import Spectating from './spectating';
import Teamboard from './teamboard';

class Overlay extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      display: false
    };
  }

  componentDidMount() {
    // Match Created - When game is created before everyone has picked sides or specator roles
    this.unsubscribers.push(
      this.match.OnMatchCreated(() => {
        this.setState({
          display: false
        });

      })
    );

    // OnMatchEnded - When match is destroyed
    this.unsubscribers.push(
      this.match.OnMatchEnded(() => {
        this.setState({
          display: false
        });
      })
    );

    // OnGameEnded - When name of team winner is displayed on screen after game is over
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        this.setState({
          display: false
        });
      })
    );

    // OnFirstCountdown - When the first kick off of the game occurs
    this.unsubscribers.push(
      this.match.OnFirstCountdown(() => {
        this.setState({
          display: true
        });
      })
    );

    // OnTimeUpdated - When a time update is recieved
    this.unsubscribers.push(
      this.match.OnTimeUpdated(() => {
        // If we join in the middle of the match show the overlay
        if(this.match.timeStarted && this.state.display === false) {
          this.setState({
            display: true
          });
        }
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(){
    if(!this.state.display)
      return (<div className='overlay'></div>);
    return (
      <div className="overlay">
        <Scoreboard match={this.match} />
        <Teamboard match={this.match} />
        <Spectating match={this.match} />
      </div>
    );
  }
}

export default Overlay;
