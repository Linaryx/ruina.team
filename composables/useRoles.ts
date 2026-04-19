import { reactive } from "vue";

export const useRoles = () => {
  const mods = reactive<Set<string>>(new Set());
  const vips = reactive<Set<string>>(new Set());
  const state = reactive<{ lastChannel: string; lastLoadedAt: number; loading: boolean }>({
    lastChannel: "",
    lastLoadedAt: 0,
    loading: false,
  });

  const normalizeKey = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const extractRoleKeys = (entry: unknown) => {
    if (typeof entry === "string" || typeof entry === "number") {
      const key = normalizeKey(entry);
      return key ? [key] : [];
    }

    if (!entry || typeof entry !== "object") return [];

    const candidate = entry as Record<string, unknown>;
    const keys = [
      candidate.id,
      candidate.userId,
      candidate.login,
      candidate.userLogin,
      candidate.name,
    ]
      .map(normalizeKey)
      .filter(Boolean);

    return Array.from(new Set(keys));
  };

  const fillRoleSet = (set: Set<string>, entries: unknown) => {
    const list = Array.isArray(entries) ? entries : [];
    list.forEach((entry) => {
      extractRoleKeys(entry).forEach((key) => set.add(key));
    });
  };

  const loadRoles = async (channel: string) => {
    const chan = channel.trim();
    if (!chan) return;

    // simple cache: skip if already loaded recently for the same channel
    const now = Date.now();
    if (state.loading || (state.lastChannel === chan && now - state.lastLoadedAt < 5 * 60 * 1000)) {
      return;
    }

    state.loading = true;
    mods.clear();
    vips.clear();

    try {
      const roles = await $fetch<{
        moderators?: unknown[];
        vips?: unknown[];
      }>(`/api-cache/roles/${encodeURIComponent(chan)}.json`).catch(
        () => ({ moderators: [], vips: [] }) as { moderators: unknown[]; vips: unknown[] },
      );

      fillRoleSet(mods, roles.moderators);
      fillRoleSet(vips, roles.vips);
    } finally {
      state.lastChannel = chan;
      state.lastLoadedAt = now;
      state.loading = false;
    }
  };

  const avatarClasses = (id: string, login?: string) => {
    const keys = [normalizeKey(id), normalizeKey(login)].filter(Boolean);
    return {
      "role-mod-border": keys.some((key) => mods.has(key)),
      "role-vip-border": keys.some((key) => vips.has(key)),
    };
  };

  return {
    mods,
    vips,
    loadRoles,
    avatarClasses,
  };
};
