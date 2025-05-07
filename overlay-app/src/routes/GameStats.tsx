import React from 'react';
import { PostGameStats, getPostGameState, PostGameProps } from '../components/PostGameStats';
import { Match } from '../match';
import { Callback } from '../util/utils';

interface GameStatsProps {
  match: Match;
  width: number;
}

// Changed class name for default export
class GameStatsComponent extends React.Component<GameStatsProps, PostGameProps> {
  match: Match;
  unsubscribers: Callback[] = [];

  constructor(props: GameStatsProps) {
    super(props);
    this.match = props.match;
    this.state = getPostGameState(this.match, true);
  }

  componentDidMount() {
    this.unsubscribers = [
      this.match.OnPlayersUpdated(() => {
        this.setState(getPostGameState(this.match, true));
      }),
      this.match.OnTeamsUpdated(() => {
        this.setState(getPostGameState(this.match, true));
      }),
      this.match.OnSeriesUpdate(() => {
        this.setState(getPostGameState(this.match, true));
      }),
      this.match.OnMatchCreated(() => {
        this.setState(getPostGameState(this.match, false));
      }),
      this.match.OnGameEnded(() => {
        this.setState(getPostGameState(this.match, true));
      }),
    ];
  }

  componentWillUnmount() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe(this.match));
    this.unsubscribers = [];
  }

  render(): React.ReactNode {
    return (
      <div
        className="overlay"
        style={{
          transformOrigin: 'left',
          transform: `scale(${this.props.width / 2560})`,
        }}
      >
        <PostGameStats {...this.state} />
      </div>
    );
  }
}

// Add default export for lazy loading
export default GameStatsComponent;
// Keep named export for backward compatibility
export { GameStatsComponent as GameStats };
