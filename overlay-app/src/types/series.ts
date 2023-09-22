export interface SeriesTeam {
  team: number;
  name: string;
  matches_won: number;
  logo?: string;
}

export interface Series {
  series_txt: string;
  length: number;
  teams: [SeriesTeam, SeriesTeam];
}
