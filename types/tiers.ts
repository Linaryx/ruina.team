export type Mode = "all" | "online" | "offline";
export type Scope = "year" | "month" | "day";

export type TierEntry = {
  userId: string;
  userLogin?: string;
  messages: number;
  uniqueMessages: number;
  windows1m: number;
  windows5m: number;
  windows15m: number;
  windows30m: number;
  windows60m: number;
  rank1m?: number;
  rank5m?: number;
  rank15m?: number;
  rank30m?: number;
  rank60m?: number;
  tier1m?: string;
  tier5m?: string;
  tier15m?: string;
  tier30m?: string;
  tier60m?: string;
  tierScore: number;
};

export type TierResponse = {
  year: number;
  month?: number;
  day?: number;
  timezone: string;
  totalUsers: number;
  totalMessages: number;
  totalUniqueMessages: number;
  entries: TierEntry[];
};
