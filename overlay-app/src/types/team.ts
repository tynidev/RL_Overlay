export interface Team {
  color_primary: string;
  color_secondary: string;
  name: string;
  score: number;
}

export function NewTeam():Team{
  return { score: 0, name: '', color_primary: '', color_secondary: '' };
}
