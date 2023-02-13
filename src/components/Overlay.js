import React from 'react';
import GameState from '../GameState';
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
      gamestate: this.match.state
    };
  }

  componentDidMount() {
    // Match Created - When game is created before everyone has picked sides or specator roles
    this.unsubscribers.push(
      this.match.OnMatchCreated(() => {
        this.setState({
          gamestate: this.match.state
        });

      })
    );

    // OnMatchEnded - When match is destroyed
    this.unsubscribers.push(
      this.match.OnMatchEnded(() => {
        this.setState({
          gamestate: this.match.state
        });
      })
    );

    // OnGameEnded - When name of team winner is displayed on screen after game is over
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        setTimeout(() => {
          this.setState({
            gamestate: this.match.state
          });
        }, 7600);
      })
    );

    // OnFirstCountdown - When the first kick off of the game occurs
    this.unsubscribers.push(
      this.match.OnFirstCountdown(() => {
        this.setState({
          gamestate: this.match.state
        });
      })
    );

    // OnTimeUpdated - When a time update is recieved
    this.unsubscribers.push(
      this.match.OnTimeUpdated(() => {
        // If we join in the middle of the match show the overlay
        if(this.match.state === GameState.InGame && !this.state.display) {
          this.setState({
            gamestate: this.match.state
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
    switch(GameState.PostGame)
    {
      case GameState.None:
      case GameState.PreGameLobby:
        return (<div className='overlay'></div>);

      case GameState.InGame:
        return (
        <div className="overlay">
          <PostGameStats match={this.match} displayPostGame={false}/>
          <Scoreboard match={this.match} />
          <Teamboard match={this.match} />
          <Spectating match={this.match} />
          <Replay match={this.match} />
        </div>);

      case GameState.PostGame:
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
