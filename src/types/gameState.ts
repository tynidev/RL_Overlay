import { Game } from "./game";
import { Player } from "./player";

export interface Stats {
  game?: Game;
  left: Player[];
  right: Player[];
}

export type GameStates =
  | "none"
  | "pre-game-lobby"
  | "in-game"
  | "game-ended"
  | "post-game";

export class GameState {
  private _state: GameStates = "none";
  public get state(): GameStates {
    return this._state;
  }

  private prev?: Stats;
  private curr?: Stats;

  public get game(): Stats["game"] {
    return this.curr?.game;
  }
  public get left(): Stats["left"] {
    return this.curr?.left ?? [];
  }
  public get right(): Stats["right"] {
    return this.curr?.right ?? [];
  }
  public get stats() {
    return {
      prev: this.prev,
      curr: this.curr,
    };
  }

  public setState(state: Exclude<GameStates, "none">) {
    this._state = state;
  }

  public reset() {
    this._state = "none";
    this.prev = undefined;
    this.curr = undefined;
  }

  public update(game: Game, left: Player[], right: Player[]) {
    this.prev = this.curr;
    this.curr = { game, left, right };
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
