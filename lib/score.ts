import type { TierEntry } from "~/types/tiers";

export const windowMultipliers = {
  "1m": 0.7,
  "5m": 2,
  "15m": 4,
  "30m": 6,
  "60m": 8,
  unique: 0,
} as const;

export const timeWeight = 0.8;
export const chatWeight = 0.2;

export const timeScore = (row: TierEntry) =>
  (row.windows1m || 0) * windowMultipliers["1m"] +
  (row.windows5m || 0) * windowMultipliers["5m"] +
  (row.windows15m || 0) * windowMultipliers["15m"] +
  (row.windows30m || 0) * windowMultipliers["30m"] +
  (row.windows60m || 0) * windowMultipliers["60m"];

export const chatScore = (row: TierEntry) => {
  if (!row.messages) return 0;
  const uniqueness = row.messages ? row.uniqueMessages / row.messages : 0;
  return Math.log(1 + row.messages) * (0.5 + 0.5 * uniqueness);
};

export const totalScore = (row: TierEntry) =>
  timeWeight * timeScore(row) + chatWeight * chatScore(row);

export const buildScoredEntry = (row: TierEntry) => {
  const score = totalScore(row);
  return {
    ...row,
    score,
    scoreRounded: score.toFixed(0),
    timeScore: timeScore(row),
    chatScore: chatScore(row),
  };
};
