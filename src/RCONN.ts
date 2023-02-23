import fs from 'fs';

export class RCONN{
  BAKKESMOD_DIR:string = 'bakkesmod/bakkesmod';
  RCONPASS:string = '';
  RCONHOST:string = 'localhost';
  RCONPORT:number = 9002;
  ws:WebSocket;

  constructor(RCONPASS?:string, RCONHOST?:string, RCONPORT?:number){
    this.RCONPASS = RCONPASS || this.FindRCONNPASS();
    this.RCONHOST = RCONHOST || this.RCONHOST;
    this.RCONPORT = RCONPORT || this.RCONPORT;

    this.ws = new WebSocket(`ws://${RCONHOST}:${RCONPORT}`);
    this.ws.onopen = this.onopen;
  };

  FindRCONNPASS():string{
    let cfg = this.ReadBakkesCfg();
    let pass = cfg["rcon_password"];
    if(pass === undefined)
        throw "Bakkes config file did not contain configuration for rcon_password";
    return pass;
  }

  ReadBakkesCfg():{ [key: string]: string }{
    let cfg:{ [key: string]: string } = {};

    let file = `${process.env.APPDATA}/${this.BAKKESMOD_DIR}/cfg/config.cfg`;
    try {
      const contents = fs.readFileSync(file, {encoding:'utf8', flag:'r'});
      contents.split(/\r?\n/).forEach(line =>  {
        let pieces = line.split(' ');
        if(pieces.length >= 2)
            cfg[pieces[0]] = pieces[1].replace(/['"]+/g, '');
      });
      return cfg;
    } catch (err) {
      throw `Failed to read bakkes config from ${file} with error:\n\n${err}`;
    }
    throw `Failed to read bakkes config from ${file} with unknown error`;
  }

  onopen():void{
    this.ws.send(`rcon_password ${this.RCONPASS}`);
    this.ws.send('rcon_refresh_allowed');
  }

  send(command:string):void{
    this.ws.send(command);
  }
}