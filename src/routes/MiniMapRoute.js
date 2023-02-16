import React from 'react';
import MiniMap from '../components/MiniMap';

class MiniMapRoute extends React.Component {
  
  /** @type {Match} */
  match;
  unsubscribers = [];
  
  constructor(props) {
    super(props);
    this.match = props.match;
    this.state = {
      MiniMapState: MiniMap.GetState(this.match)
    };
  }

  componentDidMount() {
    // OnBallMove - Every update
    this.unsubscribers.push(
      this.match.OnBallMove((ball) => {
        this.setState({ 
          MiniMapState: MiniMap.GetState(this.match),
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
      <div className="overlay" style={{width:this.props.width}}>
        <MiniMap {...this.state.MiniMapState} height={this.props.height}/>
      </div>);
  }
}

export default MiniMapRoute;
