import { useRuntimeConfig } from "#app";
import { ofetch } from "ofetch";
import type { Mode, Scope, TierResponse } from "~/types/tiers";
import { useSupabaseClient } from "./supabase";

type AvailableResult = {
  years: number[];
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

  const sb = useSupabaseClient();
  const period_key =
    scope === "day"
      ? `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`
      : scope === "month"
        ? `${year}${String(month).padStart(2, "0")}`
        : `${year}`;

  const { data, error } = await sb
    .from("tiers_snapshots")
    .select("*")
    .eq("channel", channel)
    .eq("scope", scope)
    .eq("mode", mode)
    .eq("period_key", period_key)
    .limit(1)
    .single();

  if (error) throw error;

  return {
    year,
    month,
    day,
    timezone: "Europe/Moscow",
    totalUsers: data.total_users,
    totalMessages: data.total_messages,
    totalUniqueMessages: data.total_unique_messages,
    entries: data.entries,
  };
}

export async function fetchAvailablePeriods(channel: string): Promise<AvailableResult> {
  if (!channel.trim()) return { years: [], months: {}, modes: { year: [], month: [], day: [] } };
  const sb = useSupabaseClient();
  const { data, error } = await sb
    .from("tiers_snapshots")
    .select("scope,period_key,mode")
    .eq("channel", channel);

  if (error) throw error;

  const years = new Set<number>();
  const months: Record<number, Set<number>> = {};
  const modes: Record<Scope, Set<Mode>> = {
    year: new Set<Mode>(),
    month: new Set<Mode>(),
    day: new Set<Mode>(),
  };

  const modeOrder: Mode[] = ["all", "online", "offline"];

  (data || []).forEach((row: any) => {
    const scope = row?.scope as Scope | undefined;
    const key = String(row?.period_key || "");
    const mode = row?.mode as Mode | undefined;
    const y = parseInt(key.slice(0, 4), 10);
    const m = parseInt(key.slice(4, 6), 10);
    if (!Number.isFinite(y)) return;
    years.add(y);
    if (scope === "month" && Number.isFinite(m)) {
      if (!months[y]) months[y] = new Set<number>();
      months[y].add(m);
    }
    if (scope && modes[scope] && mode) {
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
    years: Array.from(years).sort((a, b) => b - a),
    months: monthsNormalized,
    modes: modesNormalized,
  };
}

export async function fetchAvailableChannels(): Promise<AvailableChannelsResult> {
  const sb = useSupabaseClient();
  const { data, error } = await sb
    .from("tiers_snapshots")
    .select("channel", { count: "exact", head: false });

  if (error) throw error;
  const set = new Set<string>();
  (data || []).forEach((row: any) => {
    const ch = (row?.channel || "").toString().trim();
    if (ch) set.add(ch);
  });
  return { channels: Array.from(set).sort() };
}
