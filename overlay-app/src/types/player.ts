export interface PlayerLocation {
  X: number;
  Y: number;
  Z: number;
  pitch: number;
  roll: number;
  yaw: number;
}

export interface Player {
  assists: number;
  attacker: string;
  boost: number;
  cartouches: number;
  demos: number;
  goals: number;
  hasCar: boolean;
  id: string;
  isDead: boolean;
  isPowersliding: boolean;
  isSonic: boolean;
  location: {
    X: number;
    Y: number;
    Z: number;
    pitch: number;
    roll: number;
    yaw: number;
  };
  name: string;
  onGround: boolean;
  onWall: boolean;
  primaryID: string;
  saves: number;
  score: number;
  shortcut: number;
  shots: number;
  speed: number;
  team: number;
  touches: number;
}

export function NewPlayer(): Player {
  return {
    name: '',
    score: 0,
    goals: 0,
    assists: 0,
    shots: 0,
    saves: 0,
    demos: 0,
    attacker: '',
    boost: 0,
    cartouches: 0,
    hasCar: false,
    id: '',
    isDead: false,
    isPowersliding: false,
    isSonic: false,
    location: {
      X: 0,
      Y: 0,
      Z: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
    },
    onGround: false,
    onWall: false,
    primaryID: '',
    shortcut: 0,
    speed: 0,
    team: 0,
    touches: 0,
  };
}
