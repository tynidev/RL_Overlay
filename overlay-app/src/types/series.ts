export interface SeriesTeam {
  team: number;
  name: string;
  matches_won: number;
}

export interface Series {
  series_txt: string;
  length: number;
  teams: [SeriesTeam, SeriesTeam];
}
