import { Player } from './player';

export interface GameTeam {
  color_primary: string;
  color_secondary: string;
  name: string;
  score: number;
  logo: string;
}

export interface Game {
  arena: string;
  ball: {
    location: {
      X: number;
      Y: number;
      Z: number;
    };
    speed: number;
    team: number;
  };
  hasTarget: boolean;
  hasWinner: boolean;
  isOT: boolean;
  isReplay: boolean;
  isSeries: boolean;
  localplayer: string;
  seriesLength: number;
  target: string;
  teams: [GameTeam, GameTeam];
  time_milliseconds: number;
  time_seconds: number;
  winner: string;
}

export interface GameStateData {
  game: Game;
  players: Record<string, Player>; // TODO: this is a guess
}
