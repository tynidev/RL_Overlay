export const truncate = (s: string, len: number): string =>
  s.length > len ? `${s.substring(0, len)}...` : s;

export type Callback = (...args: any[]) => void;
