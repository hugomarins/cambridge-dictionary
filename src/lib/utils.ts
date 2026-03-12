export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function prettifyString(input: string): string {
  if (!input) return "";
  let s = input.replace(/\s+/g, " ").trim();
  s = s.replace(/\n/g, "").trim();
  s = s.replace(/:$/, "").trim();
  return s;
}

export const groupBy = <T, K extends keyof any>(
  list: T[],
  getKey: (item: T) => K
) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);
