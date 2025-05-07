export interface SeriesTeam {
  team: number;
  name: string;
  matches_won: number;
  logo?: string;
  color_primary?: string;  // Add color_primary property
  color_secondary?: string; // Add color_secondary property
}

export interface Series {
  series_txt: string;
  length: number;
  teams: [SeriesTeam, SeriesTeam];
}
