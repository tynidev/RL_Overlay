export const truncate = (s: string, len: number): string =>
  s.length > len ? `${s.substring(0, len)}...` : s;

export function pad(num: number, size: number): string {
  let str = num.toString();
  while (str.length < size) str = '0' + str;
  return str;
}

export type Callback = (...args: any[]) => void;

export const areEqual = <T>(
  a1: T[],
  a2: T[],
  cmp: (i1: T, i2: T) => boolean
) => {
  if (a1.length !== a2.length) {
    return false;
  }
  for (let i = 0; i < a1.length; i++) {
    if (!cmp(a1[i], a2[i])) {
      return false;
    }
  }
  return true;
};
