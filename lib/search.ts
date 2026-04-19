// Чистые утилиты для fuzzy-поиска.

export const normalizeSearch = (value?: string | null) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

export const fuzzyScore = (query: string, target: string) => {
  if (!query || !target) return -1;
  if (target === query) return 1200;
  if (target.startsWith(query)) return 950 - (target.length - query.length);
  if (target.includes(query)) return 700 - (target.length - query.length);

  let score = 0;
  let qIndex = 0;
  let consecutive = 0;

  for (let i = 0; i < target.length && qIndex < query.length; i += 1) {
    if (target[i] !== query[qIndex]) continue;
    consecutive += 1;
    score += 32 + consecutive * 14;
    qIndex += 1;
  }

  return qIndex === query.length ? score - (target.length - query.length) * 2 : -1;
};
