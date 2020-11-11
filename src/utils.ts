export function sortObjectProps (obj: any) {
  let result: any = {};
  if (!Object.keys(obj).length) return result;

  const keys: string[] = Object.keys(obj);
  keys.sort((a, b) => sort2String(a, b));

  keys.forEach((k) => {
    result[k] = obj[k];
  });

  return result;
}

export function sort2String (a: string, b: string): number {
  let index: number = 0;
  let msort: number = 0;
  do {
    msort = a.charCodeAt(index) - b.charCodeAt(index);
    index += 1;

  } while (msort === 0 && (index + 1 < a.length && index + 1 < b.length));

  return msort;
}