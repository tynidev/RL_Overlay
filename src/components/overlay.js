import React from 'react';
import PostGameStats from './PostGameStats';
import Replay from './Replay';
import Scoreboard from './Scoreboard';
import Spectating from './Spectating';
import Teamboard from './Teamboard';

class Overlay extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      display: undefined
    };
  }

  componentDidMount() {
    // Match Created - When game is created before everyone has picked sides or specator roles
    this.unsubscribers.push(
      this.match.OnMatchCreated(() => {
        this.setState({
          display: undefined
        });

      })
    );

    // OnMatchEnded - When match is destroyed
    this.unsubscribers.push(
      this.match.OnMatchEnded(() => {
        this.setState({
          display: undefined
        });
      })
    );

    // OnGameEnded - When name of team winner is displayed on screen after game is over
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        setTimeout(() => {
          this.setState({
          display: 'post-game'
          });
        }, 8000);
      })
    );

    // OnFirstCountdown - When the first kick off of the game occurs
    this.unsubscribers.push(
      this.match.OnFirstCountdown(() => {
        this.setState({
          display: 'in-game'
        });
      })
    );

    // OnTimeUpdated - When a time update is recieved
    this.unsubscribers.push(
      this.match.OnTimeUpdated(() => {
        // If we join in the middle of the match show the overlay
        if(this.match.timeStarted && !this.state.display) {
          this.setState({
            display: 'in-game'
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
    
    switch("post-game")
    {
      case "in-game":
        return (
        <div className="overlay">
          <PostGameStats match={this.match} displayPostGame={false}/>
          <Scoreboard match={this.match} />
          <Teamboard match={this.match} />
          <Spectating match={this.match} />
          <Replay match={this.match} />
        </div>);
      case "post-game":
        return (
          <div className="overlay">
            <PostGameStats match={this.match} displayPostGame={true}/>
          </div>);
      default:
        return (<div className='overlay'>Display State not recognized: {this.state.display}</div>);
    }
  }
}

export default Overlay;
