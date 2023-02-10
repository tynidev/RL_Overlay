import '../css/PostGameStats.css';
import React from 'react';

class PostGameStats extends React.Component {
  
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
    <div className="postgame-stats">
        <div className="bottom-postgame-darken"></div>
        <table className="left-team-stats">
            <tr className='names'>
                <th>CAARD'</th><th>LOST</th><th>YANXNZ^^</th>
            </tr>
            <tr className='score'>
                <td>242</td><td>358</td><td>310</td>
            </tr>
            <tr>
                <td>1</td><td>0</td><td>0</td>
            </tr>
            <tr>
                <td>0</td><td>0</td><td>1</td>
            </tr>
            <tr>
                <td>2</td><td>1</td><td>0</td>
            </tr>
            <tr>
                <td>0</td><td>3</td><td>2</td>
            </tr>
            <tr>
                <td>1</td><td>2</td><td>1</td>
            </tr>
        </table>
        <table className="right-team-stats">
            <tr className='names'>
                <th>APPARENTLY JACK</th><th>CHRONIC</th><th>NOLY</th>
            </tr>
            <tr className='score'>
                <td>242</td><td>358</td><td>310</td>
            </tr>
            <tr>
                <td>1</td><td>0</td><td>0</td>
            </tr>
            <tr>
                <td>0</td><td>0</td><td>1</td>
            </tr>
            <tr>
                <td>2</td><td>1</td><td>0</td>
            </tr>
            <tr>
                <td>0</td><td>3</td><td>2</td>
            </tr>
            <tr>
                <td>1</td><td>2</td><td>1</td>
            </tr>
        </table>
    </div>);
  }
}

export default PostGameStats;
