export function findLastIndex<T>(
  array: Array<T>,
  from: number,
  predicate: (value: T, index: number, obj: T[]) => boolean,
): number {
  let l = from;
  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
}
