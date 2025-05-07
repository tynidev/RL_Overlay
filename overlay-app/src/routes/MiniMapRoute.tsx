import React from 'react';
import { MiniMap, getState } from '../components/MiniMap';
import { Match } from '../match';
import { Player } from '../types/player';
import { Point } from '../types/point';
import { Callback } from '../util/utils';

interface MiniMapRouteProps {
  match: Match;
  width: number;
  height: number;
}

interface MiniMapProps {
  ballLocation: Point;
  left: Player[];
  right: Player[];
}

// Changed class name for default export
class MiniMapRouteComponent extends React.Component<MiniMapRouteProps, MiniMapProps> {
  match: Match;
  unsubscribers: Callback[] = [];

  constructor(props: MiniMapRouteProps) {
    super(props);
    this.match = props.match;
    this.state = getState(this.match);
  }
  
  componentDidMount() {
    this.unsubscribers.push(
      this.match.OnPlayersUpdated(() => {
        this.setState(getState(this.match));
      })
    );
  }

  componentWillUnmount() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe(this.match));
    this.unsubscribers = [];
  }
  render() {
    return (
      <div className="overlay" style={{ width: this.props.width }}>
        <MiniMap {...this.state} height={this.props.height} />
      </div>
    );
  }
}

// Add default export for lazy loading
export default MiniMapRouteComponent;
// Keep named export for backward compatibility
export { MiniMapRouteComponent as MiniMapRoute };