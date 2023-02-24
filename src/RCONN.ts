import { Callback } from "./util/utils";

export class RCONN{
  BAKKESMOD_DIR:string = 'bakkesmod/bakkesmod';
  RCONPASS:string = '';
  RCONHOST:string = 'localhost';
  RCONPORT:number|string = 9002;
  ws:WebSocket;
  sendNoWait: (command:string) => void;

  constructor(RCONPASS:string, RCONHOST?:string, RCONPORT?:number|string){
    this.RCONPASS = RCONPASS;
    this.RCONHOST = RCONHOST || this.RCONHOST;
    this.RCONPORT = RCONPORT || this.RCONPORT;

    const onopen = ():void => {
      this.sendNoWait(`rcon_password ${this.RCONPASS}`);
      this.sendNoWait('rcon_refresh_allowed');
    };

    const sendNoWait = (command:string):void =>{
      console.log(`Sending RCONN command: ${command}`);
      this.ws.send(command);
    }
    this.sendNoWait = sendNoWait;

    console.log(`Connecting RocketLeague.RCONN: ws://${this.RCONHOST}:${this.RCONPORT} with pass: ${this.RCONPASS}`);
    this.ws = new WebSocket(`ws://${this.RCONHOST}:${this.RCONPORT}`);
    this.ws.onopen = onopen;
  };

  send(command:string):void{
    this.waitForConnection(this.sendNoWait, command, 1000);
  }

  waitForConnection(callback:Callback, command:string, interval:number):void {
    if (this.ws.readyState === 1) {
        callback(command);
    } else {
        var that = this;
        setTimeout(function () {
            that.waitForConnection(callback, command, interval);
        }, interval);
    }
  }
}