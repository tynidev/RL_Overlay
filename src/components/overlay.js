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
    // Match Created
    this.unsubscribers.push(
      this.match.OnMatchCreated(() => {
        this.setState({
          display: false
        });

      })
    );

    // Match Ended
    this.unsubscribers.push(
      this.match.OnMatchEnded(() => {
        this.setState({
          display: false
        });
      })
    );

    // Game Ended
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        this.setState({
          display: false
        });
      })
    );

    // First count down at 0-0
    this.unsubscribers.push(
      this.match.OnFirstCountdown(() => {
        this.setState({
          display: true
        });
      })
    );

    // Time changed
    this.unsubscribers.push(
      this.match.OnTimeUpdated(() => {
        // If were not showing main elements then animate them in
        if(this.match.timeStarted && this.state.display === false) {
          //PreGamePosition();
          this.setState({
            display: true
          });
          //CountdownAnimation();
        }
      })
    );
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
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
