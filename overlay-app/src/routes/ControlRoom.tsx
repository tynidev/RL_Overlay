import React from 'react';
import { SeriesCtrl } from '../components/SeriesCtrl';
import '../css/ControlRoom.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'

interface ControlRoomProps {
  width: number;
  height: number;
}

export class ControlRoom extends React.Component<ControlRoomProps, {}> {

  componentDidMount() {
  }

  componentWillUnmount() {
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
        <Tabs>
          <TabList>
            <Tab>Series</Tab>
          </TabList>
      
          <TabPanel>
            <SeriesCtrl />
          </TabPanel>
        </Tabs>
      </div>
    );
  }
};
