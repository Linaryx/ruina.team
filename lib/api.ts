import { useRuntimeConfig } from "#app";
import { ofetch } from "ofetch";
import type { Mode, Scope, TierResponse } from "~/types/tiers";
import { useSupabaseClient } from "./supabase";

const SUPABASE_PAGE_SIZE = 1000;

type SnapshotTotalsRow = {
  total_users: number | null;
  total_messages: number | null;
  total_unique_messages: number | null;
  entries: TierResponse["entries"] | null;
};

type SnapshotPeriodRow = {
  scope: Scope | null;
  period_key: string | number | null;
  mode: Mode | null;
};

type SnapshotChannelRow = {
  channel: string | null;
};

type AvailableResult = {
  years: Record<Scope, number[]>;
  months: Record<number, number[]>;
  modes: Record<Scope, Mode[]>;
};

type AvailableChannelsResult = {
  channels: string[];
};

type TiersParams = {
  channel: string;
  scope: Scope;
  year: number;
  month?: number;
  day?: number;
  mode?: Mode;
  excludeBots?: string;
};

let availableChannelsCache: Promise<AvailableChannelsResult> | null = null;
const availablePeriodsCache = new Map<string, Promise<AvailableResult>>();

export const useApiBase = () => {
  const config = useRuntimeConfig();
  return config.public.apiBase || "";
};

export async function fetchTiers(params: TiersParams): Promise<TierResponse | null> {
  const base = useApiBase();
  const { channel, scope, year, month, day, mode = "all", excludeBots } = params;
  if (!channel.trim()) return null;

  let path = "";
  if (scope === "year") {
    path = `/channel/${encodeURIComponent(channel)}/tiers/${year}`;
  } else if (scope === "month") {
    path = `/channel/${encodeURIComponent(channel)}/tiers/${year}/${month}`;
  } else {
    path = `/channel/${encodeURIComponent(channel)}/tiers/${year}/${month}/${day}`;
  }

  const query = new URLSearchParams();
  query.set("mode", mode);
  if (excludeBots?.trim()) query.set("exclude_bots", excludeBots.trim());

  const url = `${base}${path}?${query.toString()}`;
  return await ofetch<TierResponse>(url, { method: "GET" });
}

export async function fetchTiersSupabase(params: TiersParams): Promise<TierResponse | null> {
  const { channel, scope, year, month, day, mode = "all" } = params;
  if (!channel.trim()) return null;
  if (scope === "month" && month == null) return null;
  if (scope === "day" && (month == null || day == null)) return null;

  const sb = useSupabaseClient();
  const period_key =
    scope === "day"
      ? `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`
      : scope === "month"
        ? `${year}${String(month).padStart(2, "0")}`
        : `${year}`;

  const { data, error } = await sb
    .from("tiers_snapshots")
    .select("total_users,total_messages,total_unique_messages,entries")
    .eq("channel", channel)
    .eq("scope", scope)
    .eq("mode", mode)
    .eq("period_key", period_key)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle<SnapshotTotalsRow>();

  if (error) throw error;
  const row = data;
  if (!row) return null;

  return {
    year,
    month,
    day,
    timezone: "Europe/Moscow",
    totalUsers: row.total_users ?? 0,
    totalMessages: row.total_messages ?? 0,
    totalUniqueMessages: row.total_unique_messages ?? 0,
    entries: row.entries ?? [],
  };
}

export async function fetchAvailablePeriods(channel: string): Promise<AvailableResult> {
  const normalizedChannel = channel.trim();
  if (!normalizedChannel) {
    return {
      years: { year: [], month: [], day: [] },
      months: {},
      modes: { year: [], month: [], day: [] },
    };
  }
  const cached = availablePeriodsCache.get(normalizedChannel);
  if (cached) return cached;

  const promise = fetchAvailablePeriodsUncached(normalizedChannel).catch((error) => {
    availablePeriodsCache.delete(normalizedChannel);
    throw error;
  });
  availablePeriodsCache.set(normalizedChannel, promise);
  return promise;
}

async function fetchAvailablePeriodsUncached(channel: string): Promise<AvailableResult> {
  const sb = useSupabaseClient();
  const rows: SnapshotPeriodRow[] = [];
  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await sb
      .from("tiers_snapshots")
      .select("scope,period_key,mode")
      .eq("channel", channel)
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) throw error;
    const batch = (data ?? []) as SnapshotPeriodRow[];
    rows.push(...batch);
    if (batch.length < SUPABASE_PAGE_SIZE) break;
  }

  const years: Record<Scope, Set<number>> = {
    year: new Set<number>(),
    month: new Set<number>(),
    day: new Set<number>(),
  };
  const months: Record<number, Set<number>> = {};
  const modes: Record<Scope, Set<Mode>> = {
    year: new Set<Mode>(),
    month: new Set<Mode>(),
    day: new Set<Mode>(),
  };

  const modeOrder: Mode[] = ["all", "online", "offline"];

  rows.forEach((row) => {
    const scope = row.scope || undefined;
    const key = String(row?.period_key || "");
    const mode = row.mode || undefined;
    const y = parseInt(key.slice(0, 4), 10);
    const m = parseInt(key.slice(4, 6), 10);
    if (!Number.isFinite(y) || !scope) return;
    years[scope].add(y);
    if (scope === "month" && Number.isFinite(m)) {
      if (!months[y]) months[y] = new Set<number>();
      months[y].add(m);
    }
    if (modes[scope] && mode) {
      modes[scope].add(mode);
    }
  });

  const monthsNormalized: Record<number, number[]> = {};
  Object.entries(months).forEach(([yearStr, set]) => {
    const yy = Number(yearStr);
    monthsNormalized[yy] = Array.from(set).sort((a, b) => a - b);
  });

  const modesNormalized: Record<Scope, Mode[]> = {
    year: Array.from(modes.year).sort((a, b) => modeOrder.indexOf(a) - modeOrder.indexOf(b)),
    month: Array.from(modes.month).sort((a, b) => modeOrder.indexOf(a) - modeOrder.indexOf(b)),
    day: Array.from(modes.day).sort((a, b) => modeOrder.indexOf(a) - modeOrder.indexOf(b)),
  };

  return {
    years: {
      year: Array.from(years.year).sort((a, b) => b - a),
      month: Array.from(years.month).sort((a, b) => b - a),
      day: Array.from(years.day).sort((a, b) => b - a),
    },
    months: monthsNormalized,
    modes: modesNormalized,
  };
}

export async function fetchAvailableChannels(): Promise<AvailableChannelsResult> {
  if (availableChannelsCache) return availableChannelsCache;

  availableChannelsCache = fetchAvailableChannelsUncached().catch((error) => {
    availableChannelsCache = null;
    throw error;
  });
  return availableChannelsCache;
}

async function fetchAvailableChannelsUncached(): Promise<AvailableChannelsResult> {
  const sb = useSupabaseClient();
  const rows: SnapshotChannelRow[] = [];
  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await sb
      .from("tiers_snapshots")
      .select("channel")
      .order("channel", { ascending: true })
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) throw error;
    const batch = (data ?? []) as SnapshotChannelRow[];
    rows.push(...batch);
    if (batch.length < SUPABASE_PAGE_SIZE) break;
  }

  const set = new Set<string>();
  rows.forEach((row) => {
    const ch = (row.channel || "").toString().trim();
    if (ch) set.add(ch);
  });
  return { channels: Array.from(set).sort() };
}
