// Чистые форматеры без зависимостей от Vue.

export const plural = (n: number, forms: [string, string, string]) => {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (d > 1 && d < 5) return forms[1];
  if (d === 1) return forms[0];
  return forms[2];
};

export const humanizeFromDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  const yearsDiff = Math.floor(days / 365);
  const monthsDiff = Math.floor((days % 365) / 30);
  const parts: string[] = [];
  if (yearsDiff) parts.push(`${yearsDiff} ${plural(yearsDiff, ["год", "года", "лет"])}`);
  if (monthsDiff) parts.push(`${monthsDiff} ${plural(monthsDiff, ["месяц", "месяца", "месяцев"])}`);
  if (!parts.length) parts.push("меньше месяца");
  return `${d.toLocaleDateString("ru-RU")} · ${parts.join(" ")} назад`;
};

export const humanizeMonths = (months?: number) => {
  if (months == null) return "-";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${plural(y, ["год", "года", "лет"])}`);
  if (m) parts.push(`${m} ${plural(m, ["месяц", "месяца", "месяцев"])}`);
  const base = parts.length ? parts.join(" ") : `${months} мес`;
  return `${months} мес (${base})`;
};
