import React, { FormEventHandler } from 'react';
import { ColorResult, RGBColor, SketchPicker } from "react-color"
import reactCSS from 'reactcss'
import { Match } from '../match';
import { Callback } from '../util/utils';


import '../css/ControlRoom.css';

interface ControlRoomProps {
  width: number;
  height: number;
}

interface Team {
  id: 0 | 1,
  name: string,
  seriesScore: number,
  display: boolean,
  color: RGBColor,
  logo: string,
}

export class ControlRoom extends React.Component<ControlRoomProps, {}> {

  state = {
    bestOf: 1,
    autoUpdateSeriesScore: true,
    seriesInfo:'ranked',
    teams:{
      left:{
        id: 0,
        name: "blue",
        seriesScore: 0,
        display: false,
        color: {
          r: 7,
          g: 121,
          b: 211,
        } as RGBColor,
        logo: "rl_logo.svg",
      } as Team,
      right:{
        id: 1,
        name: "orange",
        seriesScore: 0,
        display: false,
        color: {
          r: 242,
          g: 96,
          b: 29,
        } as RGBColor,
        logo: "rl_logo.svg",
      } as Team
    }
  };

  constructor(props: ControlRoomProps) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  colorToString = (color:RGBColor) => {
    return color.r + ", " + color.g + ", " + color.b;
  }

  setTeam = (team:Team) => {
    if(team.id == 0){
      this.setState({ teams: {left:team, right:this.state.teams.right} });
    }else{
      this.setState({ teams: {left:this.state.teams.left, right:team} });
    }
  }

  toggleUpdateSeriesScore = () => {
    this.setState({autoUpdateSeriesScore:!this.state.autoUpdateSeriesScore});
  }

  onSubmit: FormEventHandler<HTMLInputElement> | undefined = (event) => {
    // TODO: Open web-socket and send data
  }

  teamControl(team:Team): React.ReactNode{
    let id = team.id == 0 ? 'left-team-ctrl' : 'right-team-ctrl';
    const styles = reactCSS({
      'default': {
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });
    
    let colorStr = this.colorToString(team.color);
    return (
    <div id={id} className="team-ctrl">
      <div className='team-logo'><img src={team.logo} /></div>
      <div className='team-name'>
      </div>
      <div className='team-input'>
        <label htmlFor={id + "-name"}>Name: </label>
        <input type="text" value={team.name} id={id + "-name"} onChange={(event) => {
          team.name = event.target.value;
          this.setTeam(team);
        }}/>
      </div>
      <div className='team-input'>
        <label htmlFor={id + "-color"}>Color: <span style={{color:"#555"}}>({team.id == 0 ? "7, 121, 211" : "242, 96, 29"})</span></label>
        <input type="text" value={colorStr} id={id + "-color"}/>
        <div className='team-color-sample' style={{backgroundColor:"rgba(" + colorStr + ")"}} onClick={ (event) => {
          team.display = true;
          this.setTeam(team);
        } }/>
        {team.display ?
        <div style={ styles.popover as React.CSSProperties }>
          <div style={ styles.cover as React.CSSProperties } onClick={ () =>
          {
            team.display = false;
            this.setTeam(team);
          }}/>
          <SketchPicker color={ team.color } disableAlpha={true} onChange={ (color: ColorResult, event: React.ChangeEvent<HTMLInputElement>) => 
          {
            team.color = color.rgb;
            this.setTeam(team);
          }}/>
        </div> : null }
      </div>
      <div className='team-input'>
        <label htmlFor={id + "-logo"}>Logo: <span style={{color:"#555",textTransform:'none'}}>(rl_logo.svg)</span></label>
        <input type="text" value={team.logo} id={id + "-logo"} className='logo_input' onChange={(event) => {
          team.logo = event.target.value;
          this.setTeam(team);
        }}/>
      </div>
    </div>);
  }

  render(): React.ReactNode {
    document.body.style.backgroundColor = "rgba(var(--base-color))";
    var root = document.getElementById("root");
    root!.style.height = "100%";
    root!.style.width = "100%";
    return (
      <div id="control-room">
        <div id="title-bar">
          <div>Control Room</div>
          <div id="rl-status" className="conn-status connected align-right">Rocket League</div>
          <div id="rcon-status" className="conn-status align-right">RCON</div>
          <div id="overlay-status" className="conn-status align-right">Overlay</div>
        </div>
        <form>
        <div id="series-ctrl">
            <div style={{flexBasis:"25%"}}>
            <label style={{display:"inline",marginRight:"2.6rem"}}>Best of:</label>
            <select name="bestof" id="bestof" onChange={(event) => this.setState({bestOf:event.target.value})}>
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
            </div>
            <div style={{flexBasis:"75%",textAlign:"right"}} className="e-disabled">
              Auto Update Series Score
              <label className="switch">
                <input type="checkbox" defaultChecked={this.state.autoUpdateSeriesScore} onClick={this.toggleUpdateSeriesScore}/>
                <span className="slider round"></span>
              </label>
              Left<input type="text" value={this.state.teams.left.seriesScore} style={{width:"0.4rem"}} disabled={this.state.autoUpdateSeriesScore}/>
              Right<input type="text" value={this.state.teams.right.seriesScore} style={{width:"0.4rem"}} disabled={this.state.autoUpdateSeriesScore}/>
            </div>
            
            <label htmlFor="series-info" style={{flexBasis:"13%",lineHeight:"3.5rem"}}>Series Info: </label>
            <input type="text" id="series-info" style={{flexBasis:"78%"}} onChange={(event) => this.setState({seriesInfo:event.target.value}) } value={this.state.seriesInfo}/>

        </div>
        <div id="teams-ctrl">
          {this.teamControl(this.state.teams.left)}
          {this.teamControl(this.state.teams.right)}
          <input type="submit" value="Update" onSubmit={this.onSubmit}/>
          <input type="submit" value="Reset" className='red'/>
        </div>
        </form>
      </div>
    );
  }
};
