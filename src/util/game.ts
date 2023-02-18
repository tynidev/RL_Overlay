import { GameTeam } from '../types/game';
import { Player } from '../types/player';

export const arePlayersEqual = (p1: Player, p2: Player) =>
  !(
    p1.name !== p2.name ||
    p1.score !== p2.score ||
    p1.goals !== p2.goals ||
    p1.assists !== p2.assists ||
    p1.shots !== p2.shots ||
    p1.saves !== p2.saves ||
    p1.demos !== p2.demos
  );

export const areTeamsEqual = (t1: GameTeam, t2: GameTeam) =>
  t1.color_primary === t2.color_primary &&
  t1.color_secondary === t2.color_secondary &&
  t1.name === t2.name &&
  t1.score === t2.score;
