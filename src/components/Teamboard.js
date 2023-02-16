import '../css/Teamboard.css';
import React from 'react';

// eslint-disable-next-line no-unused-vars
import Match from '../match'
import PlayerCard from './PlayerCard';

class Teamboard extends React.PureComponent {
  
  /**
     * Static method to generate props from match
     * @param {Match} match
     */
  static GetState(match){
    return {
      teams: [
        match?.left ?? [], match?.right ?? []
      ],
      playerTarget: match?.playerTarget ?? undefined,
      localPlayer: match?.localPlayer ?? undefined,
    };
  }

  render() {
    let {teams, playerTarget, localPlayer} = this.props;
    return (
      <div className='teamboard'>
        <div className='left'>
        {teams[0].map((player, index) => (
          <PlayerCard player={player} spectating={playerTarget && playerTarget.id === player.id} index={index} showBoost={!localPlayer} />
        ))} 
        </div>

        <div className='right'>
        {teams[1].map((player, index) => (
          <PlayerCard player={player} spectating={playerTarget && playerTarget.id === player.id} index={index} showBoost={!localPlayer} />
        ))} 
        </div>
      </div>
    );
  }

  truncate(str) {
    return str.length > 19 ? str.substring(0, 18) + "..." : str;
  }
}
export default Teamboard;