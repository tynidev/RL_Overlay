import React from 'react';
import GameState from '../GameState';
import PostGameStats from '../components/PostGameStats';
import Replay from '../components/Replay';
import Scoreboard from '../components/Scoreboard';
import Spectating from '../components/Spectating';
import Teamboard from '../components/Teamboard';

class Stream extends React.PureComponent {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      gamestate: this.match.state,
      ScoreboardState: Scoreboard.GetState(this.match),
      SpectatingState: Spectating.GetState(this.match, undefined, undefined),
      TeamboardState: Teamboard.GetState(this.match),
      ReplayState: Replay.GetState(undefined, undefined, undefined),
      PostGameStatsState: PostGameStats.GetState(this.match),
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

    // OnFirstCountdown - When the first kick off of the game occurs
    this.unsubscribers.push(
      this.match.OnFirstCountdown(() => {
        this.setState({
          gamestate: this.match.state
        });
      })
    );    
    
    // OnCountdown - When a kickoff countdown occurs
    this.unsubscribers.push(
     this.match.OnCountdown(() => { 
      this.setState({ SpectatingState: Spectating.GetState(this.match, "OnCountdown", this.state.SpectatingState)});
     })
    );

    // OnTimeUpdated - When a time update is recieved
    this.unsubscribers.push(
      this.match.OnTimeUpdated(() => {
        // If we join in the middle of the match show the overlay
        if(this.match.state === GameState.InGame && !this.state.display) {
          this.setState({
            gamestate: this.match.state,
            ScoreboardState: Scoreboard.GetState(this.match),
          });
        }
        else{
          this.setState({ ScoreboardState: Scoreboard.GetState(this.match) });
        }
      })
    );

    // OnPlayersUpdated - When players stats/properties have changed
    this.unsubscribers.push(
      this.match.OnPlayersUpdated((left, right) => {
        this.setState({ 
          TeamboardState: Teamboard.GetState(this.match),
          PostGameStatsState: PostGameStats.GetState(this.match),
        });
      })
    );

    // OnSpecatorUpdated - When the spectated player changes
    this.unsubscribers.push(
      this.match.OnSpecatorUpdated((hasTarget, player) => {
        this.setState({ 
          TeamboardState: Teamboard.GetState(this.match), 
          SpectatingState: Spectating.GetState(this.match, "OnSpecatorUpdated", this.state.SpectatingState) 
        });
      })
    );    
    
    // OnInstantReplayStart - When an in game instant replay is started after a goal
    this.unsubscribers.push(
      this.match.OnInstantReplayStart(() => { 
        this.setState({ 
          SpectatingState: Spectating.GetState(this.match, "OnInstantReplayStart", this.state.SpectatingState),
          ReplayState: Replay.GetState("OnInstantReplayStart", undefined, this.state.ReplayState),
        });
      })
    );
    
    // OnInstantReplayEnd - When an in game instant replay is ended
    this.unsubscribers.push(
      this.match.OnInstantReplayEnd(() => { 
        this.setState({ 
          ReplayState: Replay.GetState("OnInstantReplayEnd", undefined, this.state.ReplayState),
        });
      })
    );
    
    // OnGoalScored - When a goal is scored
    this.unsubscribers.push(
      this.match.OnGoalScored((data) => { 
        this.setState({ 
          ReplayState: Replay.GetState("OnGoalScored", data, this.state.ReplayState),
        });
      })
    );

    // OnTeamsUpdated - When Team scores/names/colors are updated
    this.unsubscribers.push(
      this.match.OnTeamsUpdated((teams) => {
        this.setState({
          ScoreboardState: Scoreboard.GetState(this.match),
          PostGameStatsState: PostGameStats.GetState(this.match),
        })
    }));

    // OnSeriesUpdate
    this.unsubscribers.push(
      this.match.OnSeriesUpdate((series) => {
        this.setState({
          ScoreboardState: Scoreboard.GetState(this.match),
          PostGameStatsState: PostGameStats.GetState(this.match),
        })
    }));

    // OnGameEnded - When name of team winner is displayed on screen after game is over
    this.unsubscribers.push(
      this.match.OnGameEnded(() => {
        this.setState({
          PostGameStatsState: PostGameStats.GetState(this.match),
        });
        setTimeout(() => {
          this.setState({
            gamestate: this.match.state
          });
        }, 2990);
      })
    );

    // OnPodiumStart - Celebration screen for winners podium after game ends
    this.unsubscribers.push(
      this.match.OnPodiumStart(() => {
        setTimeout(() => {
          this.setState({
            gamestate: this.match.state
          });
        }, 4700);
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
  }

  componentWillUnmount(){
    this.unsubscribers.forEach(unsubscribe => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(){
    switch(this.state.gamestate)
    {
      case GameState.None:
      case GameState.PreGameLobby:
        return (<div className='overlay'></div>);

      case GameState.InGame:
        return (
        <div className="overlay">
          <Scoreboard {...this.state.ScoreboardState} />
          <Teamboard {...this.state.TeamboardState} />
          <Spectating {...this.state.SpectatingState} />
          <Replay {...this.state.ReplayState}  />
        </div>);

      case GameState.GameEnded:
        return (
        <div className="overlay">
          <PostGameStats {...this.state.PostGameStatsState} display={false}/>
        </div>);

      case GameState.PostGame:
        return (
          <div className="overlay">
            <PostGameStats {...this.state.PostGameStatsState} display={true}/>
          </div>);
          
      default:
        return (<div className='overlay'>Display State not recognized: {this.state.display}</div>);
    }
  }
}

export default Stream;
