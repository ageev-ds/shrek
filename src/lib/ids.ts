export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const cellKey = (categoryId: string, levelId: string) => `${categoryId}:${levelId}`;

export const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function pluralRu(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
