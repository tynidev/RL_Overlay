import { Game } from './game';
import { Player } from './player';

export interface Stats {
  game?: Game;
  left: Player[];
  right: Player[];
}

export type GameStates =
  | 'none'
  | 'pre-game-lobby'
  | 'in-game'
  | 'game-ended'
  | 'post-game';

export class GameState {
  clockRunning: boolean = false;

  possession: number = 0;
  ballPossessions: number[] = [];

  fieldPosition: number = 0;
  fieldPositions: number[] = [];

  private _state: GameStates = 'none';
  public get state(): GameStates {
    return this._state;
  }

  private prev?: Stats;
  private curr?: Stats;

  public get game(): Stats['game'] {
    return this.curr?.game;
  }
  public get left(): Stats['left'] {
    return this.curr?.left ?? [];
  }
  public get right(): Stats['right'] {
    return this.curr?.right ?? [];
  }

  public setState(state: Exclude<GameStates, 'none'>) {
    this._state = state;
  }

  public reset() {
    this.fieldPositions = [];
    this.possession = 0;
    this.ballPossessions = [];
    this.fieldPosition = 0;
    this.clockRunning = false;
    this._state = 'none';
    this.prev = undefined;
    this.curr = undefined;
  }

  public update(game: Game, left: Player[], right: Player[]) {
    
    if(this.curr === undefined) // initialize if empty and return
    {
      this.curr = {game, left, right};
      return;
    }
    
    this.prev = this.curr;

    this.curr.game = game;
    this.curr.left = left;
    this.curr.right = right;

    // don't calculate stats if we don't have prev/curr stats to compare to
    if(this.prev.game === undefined || game === undefined)
      return;

    // don't calculate stats if not in-game
    if(this.state !== 'in-game' || this.clockRunning !== true)
      return;

    // record possession
    this.ballPossessions.push(this.curr.game.ball.team);
    let possessions = [0,0];
    for(let i = this.ballPossessions.length - 1; i > 0 && i >= this.ballPossessions.length - (10 * 16); i--)
    {
      possessions[this.ballPossessions[i]] += 1;
    }
    let totalRecords = possessions[0] + possessions[1];
    possessions[0] = possessions[0] / totalRecords * 100;
    possessions[1] = possessions[1] / totalRecords * 100;
    this.possession = possessions[0] - possessions[1];

    // record field position
    this.fieldPositions.push(this.computPositionalAdvantage()); // add ball location at end of array
    let sum = 0;
    let records = 0;
    for(let i = this.fieldPositions.length - 1; i > 0 && i >= this.fieldPositions.length - (10 * 8); i--)
    {
      sum += this.fieldPositions[i];
      records += 1;
    }
    this.fieldPosition = sum / (records === 0 ? 1 : records);
  }

  private computPositionalAdvantage() {
    let ballPosition = this.computePostionalAdv(this.curr!.game!.ball.location);
    let playersPosition = this.computePlayersPostionalAdv(this.curr!.left, this.curr!.right);
    let positionalAdvantage = (ballPosition * 0.7) + (playersPosition * 0.3);
    return positionalAdvantage;
  }

  private computePostionalAdv(location: {X:number, Y:number, Z:number}){
    let position = (location.Y / 5120 * 100);
    return position > 100 ? 100 : position < -100 ? -100 : position;
  }

  private computePlayersPostionalAdv(lPlayers: Player[], rPlayers: Player[]){
    let sum = 0;
    lPlayers.forEach(player => {
      sum += this.computePostionalAdv(player.location);
    });
    rPlayers.forEach(player => {
      sum += this.computePostionalAdv(player.location);
    });
    return sum / (lPlayers.length + rPlayers.length);
  }

  public computeTeamMemberChanges(newLeft: Player[], newRight: Player[]) {
    const except = (a1: Player[], a2: Player[]) =>
      a1.filter((p1) => !a2.some((p2) => p1.id === p2.id));

    const addLeft = except(newLeft, this.left);
    const addRight = except(newRight, this.right);
    const removeLeft = except(this.left, newLeft);
    const removeRight = except(this.right, newRight);

    return {
      equal:
        addLeft.length === 0 &&
        addRight.length === 0 &&
        removeLeft.length === 0 &&
        removeRight.length === 0,
      add: {
        left: addLeft,
        right: addRight,
      },
      remove: {
        left: removeLeft,
        right: removeRight,
      },
    } as const;
  }
}
