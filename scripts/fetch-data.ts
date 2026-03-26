import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

type TierEntry = Record<string, unknown>;
type RolesResponse = {
  moderators?: string[];
  vips?: string[];
};

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || "";
const channels = (process.env.TIERS_CHANNELS || "zakvielchannel")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

const cacheDir = join(process.cwd(), "public", "api-cache");
const tiersDir = join(cacheDir, "tiers");
const rolesDir = join(cacheDir, "roles");

const ensureDirs = () => {
  mkdirSync(tiersDir, { recursive: true });
  mkdirSync(rolesDir, { recursive: true });
};

const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const fetchLatestTier = async (channel: string) => {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from("tiers_snapshots")
      .select("*")
      .eq("channel", channel)
      .order("period_key", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data as TierEntry;
  } catch (err) {
    console.warn(`[tiers] skip ${channel}:`, (err as Error)?.message || err);
    return null;
  }
};

const fetchRoles = async (channel: string) => {
  const base = "https://tools.2807.eu/api";
  const result: RolesResponse = {};
  try {
    result.moderators = await fetch(`${base}/getmods/${channel}`).then((r) => r.json());
  } catch (err) {
    console.warn(`[roles] mods skip ${channel}:`, (err as Error)?.message || err);
  }
  try {
    result.vips = await fetch(`${base}/getvips/${channel}`).then((r) => r.json());
  } catch (err) {
    console.warn(`[roles] vips skip ${channel}:`, (err as Error)?.message || err);
  }
  return result;
};

const main = async () => {
  ensureDirs();
  for (const channel of channels) {
    // tiers
    if (supabaseClient) {
      const tier = await fetchLatestTier(channel);
      if (tier) {
        const path = join(tiersDir, `${channel}.json`);
        writeFileSync(path, JSON.stringify(tier, null, 2), "utf8");
        console.log(`[cache] tiers -> ${path}`);
      }
    }
    // roles
    const roles = await fetchRoles(channel);
    const path = join(rolesDir, `${channel}.json`);
    writeFileSync(path, JSON.stringify(roles, null, 2), "utf8");
    console.log(`[cache] roles -> ${path}`);
  }
};

main().catch((err) => {
  console.error("fetch-data failed", err);
  process.exitCode = 1;
});
