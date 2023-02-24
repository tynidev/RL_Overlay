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

export function scaleText(text:string, sizes:Array<[number,string]>):[string, string]{
  
  sizes.sort((a:[number,string], b:[number,string]) => {
    return a[0] - b[0];
  });
  
  let biggestSize = sizes[sizes.length - 1];
  text = truncate(text, biggestSize[0]); // truncate to the longest size

  let fontSize:string = biggestSize[1];
  for (let i = 0; i < sizes.length; i++) {
    let size = sizes[i];
    if(text.length <= size[0]){
      fontSize = size[1];
      break;
    }
  }

  return [text, fontSize];
}