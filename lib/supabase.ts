import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useRuntimeConfig } from "#app";

let client: SupabaseClient | null = null;

export const useSupabaseClient = () => {
  if (!client) {
    const cfg = useRuntimeConfig().public;
    client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }
  return client;
};
