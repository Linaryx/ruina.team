<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "#imports";
import TierControls from "~/components/chat-tiers/TierControls.vue";
import TierSummary from "~/components/chat-tiers/TierSummary.vue";
import TierTable from "~/components/chat-tiers/TierTable.vue";
import UserCard from "~/components/chat-tiers/UserCard.vue";
import LoadingBar from "~/components/chat-tiers/LoadingBar.vue";
import { useRoles } from "~/composables/useRoles";
import { defaultTierColors, tierRanges } from "~/constants/tiers";
import {
  fetchAvailableChannels,
  fetchAvailablePeriods,
  fetchTiersSupabase as fetchTiers,
} from "~/lib/api";
import type { Mode, Scope, TierEntry, TierResponse } from "~/types/tiers";

const channel = ref("zakvielchannel");
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const scope = ref<Scope>("month");
const mode = ref<Mode>("online");
const availableYears = ref<number[]>([]);
const availableMonthsMap = ref<Record<number, number[]>>({});
const availableMonths = computed(() => availableMonthsMap.value[year.value] || []);
const availableChannels = ref<string[]>([]);
const availableScopes = ref<Scope[]>(["year", "month"]);
const availableModesMap = ref<Record<Scope, Mode[]>>({
  year: ["all", "online", "offline"],
  month: ["all", "online", "offline"],
  day: ["all", "online", "offline"],
});
const availableModes = computed(
  () => availableModesMap.value[scope.value] || ["all", "online", "offline"],
);

type IvrUser = {
  id: string;
  login: string;
  displayName: string;
  logo?: string;
  followers?: number | null;
  createdAt?: string;
  roles?: { isAffiliate?: boolean; isPartner?: boolean; isStaff?: boolean | null };
};

type Relation = { followedAt?: string; subMonths?: number; subEnd?: string };
const profiles = reactive<Record<string, { displayName: string; login: string; logo?: string }>>(
  {},
);
const relations = reactive<Record<string, Relation>>({});
const userLookup = ref("");
const userData = ref<IvrUser | null>(null);
const userLoading = ref(false);
const userError = ref<string | null>(null);
const showProfile = ref(false);

const tierColors = reactive<Record<string, string>>({ ...defaultTierColors });
const prefetchIndex = ref(0);
const tableRef = ref<{ wrapEl: HTMLElement | null; sentinelEl: HTMLElement | null } | null>(null);
let prefetchObserver: IntersectionObserver | null = null;
let scrollEl: HTMLElement | null = null;
let isPrefetching = false;

const { loadRoles, avatarClasses } = useRoles();
const route = useRoute();
const router = useRouter();

const plural = (n: number, forms: [string, string, string]) => {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (d > 1 && d < 5) return forms[1];
  if (d === 1) return forms[0];
  return forms[2];
};

const humanizeFromDate = (iso?: string) => {
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

const humanizeMonths = (months?: number) => {
  if (months == null) return "-";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${plural(y, ["год", "года", "лет"])}`);
  if (m) parts.push(`${m} ${plural(m, ["месяц", "месяца", "месяцев"])}`);
  const base = parts.length ? parts.join(" ") : `${months} мес`;
  return `${months} мес (${base})`;
};
const formatHours = (count: number, minutes: number) => {
  const hours = (count * minutes) / 60;
  return `${hours.toFixed(1)}h`;
};

const fetchProfiles = async (ids: string[]) => {
  if (!ids.length) return;
  const uniq = ids.filter((id) => !profiles[id]);
  if (!uniq.length) return;
  const chunkSize = 25;
  for (let i = 0; i < uniq.length; i += chunkSize) {
    const chunk = uniq.slice(i, i + chunkSize);
    try {
      const res = await $fetch<IvrUser[]>(
        `https://api.ivr.fi/v2/twitch/user?id=${chunk.join(",")}`,
      );
      res.forEach((u) => {
        profiles[u.id] = { displayName: u.displayName, login: u.login, logo: u.logo };
      });
    } catch {
      /* ignore */
    }
  }
};

const fetchRelations = async (ids: string[]) => {
  if (!ids.length) return;
  const channelLogin = channel.value.trim();
  const top = ids.slice(0, 30);
  for (const id of top) {
    const prof = profiles[id];
    if (!prof || relations[id]) continue;
    try {
      const res: any = await $fetch(
        `https://api.ivr.fi/v2/twitch/subage/${prof.login}/${channelLogin}`,
      );
      relations[id] = {
        followedAt: res?.followedAt || undefined,
        subMonths: res?.cumulative?.months ?? undefined,
        subEnd: res?.cumulative?.end || undefined,
      };
    } catch {
      relations[id] = {};
    }
  }
};

const fetchUser = async () => {
  userError.value = null;
  userData.value = null;
  showProfile.value = false;
  const term = userLookup.value.trim();
  if (!term) return;
  userLoading.value = true;
  try {
    const isId = /^\d+$/.test(term);
    const primaryUrl = isId
      ? `https://api.ivr.fi/v2/twitch/user?id=${encodeURIComponent(term)}`
      : `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(term)}`;
    let res = await $fetch<IvrUser[]>(primaryUrl);
    if ((!res || !res.length) && !isId) {
      res = await $fetch<IvrUser[]>(
        `https://api.ivr.fi/v2/twitch/user?id=${encodeURIComponent(term)}`,
      );
    }
    userData.value = res?.[0] ?? null;
    if (!res?.length) {
      userError.value = "Not found";
      showProfile.value = false;
    } else {
      showProfile.value = true;
      const foundId = res[0]?.id;
      if (foundId) {
        profiles[foundId] = {
          displayName: res[0]?.displayName || res[0]?.login || foundId,
          login: res[0]?.login || foundId,
          logo: res[0]?.logo,
        };
      }
      const rel = foundId ? relations[foundId] : null;
      const needsRelations = foundId && (!rel || (!rel.followedAt && rel.subMonths == null));
      if (foundId && needsRelations) {
        await fetchRelations([foundId]);
      }
    }
  } catch (e: unknown) {
    const msg =
      typeof e === "object" && e && "message" in e && (e as any).message
        ? String((e as any).message)
        : "Request failed";
    userError.value = msg;
    showProfile.value = false;
  } finally {
    userLoading.value = false;
  }
};

const openProfile = async (userId: string) => {
  userLookup.value = userId;
  const entry = data.value?.entries.find((e: TierEntry) => e.userId === userId);
  const prof = profiles[userId];
  if (entry) {
    profiles[userId] = {
      displayName: prof?.displayName || entry.userLogin || userId,
      login: prof?.login || entry.userLogin || userId,
      logo: prof?.logo,
    };
    userData.value = {
      id: userId,
      login: entry.userLogin || userId,
      displayName: prof?.displayName || entry.userLogin || userId,
      logo: prof?.logo,
    };
    showProfile.value = true;
  }
  const rel = relations[userId];
  const needsRelations = !rel || (!rel.followedAt && rel.subMonths == null);
  if (needsRelations) {
    await fetchRelations([userId]);
  }
  await fetchUser();
};

const data = ref<TierResponse | null>(null);
const pending = ref(false);
const error = ref<unknown>(null);
const loadingNote = ref("");
const elapsedMs = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const syncFromQuery = () => {
  const q = route.query;
  if (typeof q.channel === "string" && q.channel.trim()) channel.value = q.channel.trim();
  if (q.scope === "year" || q.scope === "month") scope.value = q.scope;
  const y = Number(q.year);
  if (Number.isFinite(y) && y > 2000) year.value = y;
  const m = Number(q.month);
  if (Number.isFinite(m) && m >= 1 && m <= 12) month.value = m;
  if (q.mode === "all" || q.mode === "online" || q.mode === "offline") mode.value = q.mode;
};

const pushQuery = () => {
  router.replace({
    query: {
      channel: channel.value,
      scope: scope.value,
      year: String(year.value),
      month: String(month.value),
      mode: mode.value,
    },
  });
};

const alignToAvailable = () => {
  if (availableChannels.value.length && !availableChannels.value.includes(channel.value)) {
    channel.value = availableChannels.value[0];
  }
  if (availableYears.value.length && !availableYears.value.includes(year.value)) {
    year.value = availableYears.value[0];
  }
  if (scope.value === "month") {
    const monthsForYear = availableMonths.value;
    if (!monthsForYear.length) {
      scope.value = "year";
    } else if (!monthsForYear.includes(month.value)) {
      month.value = monthsForYear[0];
    }
  }
  if (availableModes.value.length && !availableModes.value.includes(mode.value)) {
    mode.value = availableModes.value[0];
  }
};

const loadAvailable = async () => {
  try {
    const chRes = await fetchAvailableChannels();
    availableChannels.value = chRes.channels;
    const res = await fetchAvailablePeriods(channel.value);
    availableYears.value = res.years;
    availableMonthsMap.value = res.months;
    availableModesMap.value = res.modes as Record<Scope, Mode[]>;
    const hasMonths = Object.keys(res.months || {}).length > 0;
    const scopes: Scope[] = [];
    if (res.years.length) scopes.push("year");
    if (hasMonths) scopes.push("month");
    availableScopes.value = scopes.length ? scopes : ["year"];
    // первично сдвигаем год/месяц в допустимые для текущего канала
    const firstYear = res.years[0];
    if (firstYear && !res.years.includes(year.value)) {
      year.value = firstYear;
    }
    const monthsForYear = res.months[year.value] || [];
    const firstMonth = monthsForYear[0];
    if (monthsForYear.length && !monthsForYear.includes(month.value) && firstMonth) {
      month.value = firstMonth;
    }
    if (availableScopes.value.length === 1) {
      scope.value = availableScopes.value[0];
    } else if (!availableScopes.value.includes(scope.value)) {
      scope.value = availableScopes.value[0];
    }
    alignToAvailable();
  } catch {
    availableChannels.value = [];
    availableYears.value = [];
    availableMonthsMap.value = {};
    availableScopes.value = ["year"];
  }
};

const loadTiers = async () => {
  pending.value = true;
  error.value = null;
  loadingNote.value = "Готовим запрос...";
  elapsedMs.value = 0;
  clearTimer();
  const started = Date.now();
  timer = setInterval(() => {
    elapsedMs.value = Date.now() - started;
  }, 120);
  try {
    data.value = await fetchTiers({
      channel: channel.value,
      scope: scope.value,
      year: year.value,
      month: month.value,
      mode: mode.value,
    });
    prefetchIndex.value = 0;
    await prefetchMoreProfiles();
    loadingNote.value = `Готово за ${elapsedMs.value} ms`;
  } catch (e: unknown) {
    error.value = e;
    loadingNote.value = "Ошибка запроса";
  } finally {
    clearTimer();
    pending.value = false;
  }
};

watch(
  () => data.value?.entries,
  async (entries: TierEntry[] | undefined) => {
    if (!entries) return;
    const topIds = entries.slice(0, 50).map((e) => e.userId);
    await fetchProfiles(topIds);
    await fetchRelations(topIds);
    setupPrefetchObserver();
  },
  { immediate: true },
);

const reload = async () => {
  await loadRoles(channel.value);
  await loadAvailable();
  await loadTiers();
  pushQuery();
};

watch(
  () => [channel.value, year.value],
  () => {
    alignToAvailable();
    pushQuery();
  },
);

watch(
  () => channel.value,
  async () => {
    await loadAvailable();
    pushQuery();
  },
);

watch(
  () => availableScopes.value,
  () => {
    if (!availableScopes.value.includes(scope.value)) {
      scope.value = availableScopes.value[0] || "year";
    }
    alignToAvailable();
  },
  { deep: true },
);

watch(
  () => [scope.value, month.value, mode.value],
  () => pushQuery(),
);

const prefetchMoreProfiles = async () => {
  if (isPrefetching) return;
  if (!data.value?.entries?.length) return;
  const entries = data.value.entries;
  const start = 50 + prefetchIndex.value * 25;
  if (start >= entries.length) return;
  isPrefetching = true;
  const slice = entries.slice(start, start + 25).map((e) => e.userId);
  await fetchProfiles(slice);
  prefetchIndex.value += 1;
  isPrefetching = false;
};

const setupPrefetchObserver = () => {
  const wrap = tableRef.value?.wrapEl;
  const sentinel = tableRef.value?.sentinelEl;
  scrollEl = wrap || null;
  if (!wrap || !sentinel) return;
  if (prefetchObserver) {
    prefetchObserver.disconnect();
  }
  const handleIntersect: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        prefetchMoreProfiles();
      }
    });
  };
  prefetchObserver = new IntersectionObserver(handleIntersect, {
    root: wrap,
    threshold: 0.3,
  });
  prefetchObserver.observe(sentinel);

  wrap.removeEventListener("scroll", handleScroll, { passive: true } as any);
  wrap.addEventListener("scroll", handleScroll, { passive: true });
};

const handleScroll = () => {
  if (!scrollEl) return;
  const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight || 1;
  const progress = Math.min(1, scrollEl.scrollTop / maxScroll);
  if (progress > 0.7) {
    prefetchMoreProfiles();
  }
};

onMounted(async () => {
  syncFromQuery();
  await loadAvailable();
  setupPrefetchObserver();
});

onBeforeUnmount(() => {
  if (prefetchObserver) {
    prefetchObserver.disconnect();
  }
  if (scrollEl) {
    scrollEl.removeEventListener("scroll", handleScroll);
  }
});

const periodText = computed(() => {
  if (!data.value) return "";
  const { year: y, month: m } = data.value;
  return [y, m].filter(Boolean).join("/");
});

const selectedEntry = computed(() => {
  if (!data.value || !userData.value) return null;
  return data.value.entries.find((e: TierEntry) => e.userId === userData.value?.id) || null;
});

const selectedRank = computed(() => {
  if (!data.value || !userData.value) return null;
  const idx = data.value.entries.findIndex((e) => e.userId === userData.value?.id);
  return idx >= 0 ? idx : null;
});

const displayNameLine = computed(() => {
  if (!userData.value) return "";
  const { displayName, login } = userData.value;
  if (!displayName || !login) return displayName || login || "";
  if (displayName.toLowerCase() === login.toLowerCase()) return displayName;
  return `${displayName} (${login})`;
});

const errorText = computed(() => {
  const val = error.value;
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && "message" in val && val?.message) {
    return String((val as any).message);
  }
  return String(val);
});
</script>

<template>
  <main class="page">
    <header class="header">
      <div>
        <h1>Рейтинг пользователей чата</h1>
        <p class="muted">
          Подгружаем данные из
          <a href="https://github.com/Linaryx/rustlog" target="_blank" rel="noopener noreferrer"
            >rustlog tiers</a
          >: online / offline / all
        </p>
      </div>
      <button class="btn primary refresh-btn" @click="reload" :disabled="pending">
        {{ pending ? "Загрузка..." : "Загрузить статистику" }}
      </button>
    </header>

    <TierControls
      :channel="channel"
      :scope="scope"
      :year="year"
      :month="month"
      :mode="mode"
      :available-channels="availableChannels"
      :available-scopes="availableScopes"
      :available-years="availableYears"
      :available-months="availableMonths"
      :available-modes="availableModes"
      @update:channel="channel = $event"
      @update:scope="scope = $event"
      @update:year="year = $event"
      @update:month="month = $event"
      @update:mode="mode = $event"
      @reload="reload"
    />

    <section class="card no-lift">
      <div class="lookup">
        <div class="lookup-row">
          <input v-model="userLookup" type="text" placeholder="login or id" />
          <button class="btn primary" @click="fetchUser" :disabled="userLoading">
            {{ userLoading ? "Загрузка..." : "Поиск" }}
          </button>
        </div>
        <p v-if="userError" class="error-text">Ошибка: {{ userError }}</p>
        <div v-if="userData" class="profile-mini">
          <span class="value">{{ userData.displayName }}</span>
          <button class="btn secondary" @click="showProfile = !showProfile">
            {{ showProfile ? "Скрыть карточку" : "Карточка" }}
          </button>
        </div>
      </div>
    </section>

    <section class="card error" v-if="error">
      <p>Ошибка: {{ errorText }}</p>
    </section>

    <LoadingBar
      v-if="pending"
      :label="`${channel} / ${scope} / ${mode}`"
      :elapsed-ms="elapsedMs"
      :note="loadingNote"
    />

    <section v-else-if="data" class="card no-lift">
      <TierSummary
        :period="periodText"
        :timezone="data.timezone"
        :users="data.totalUsers"
        :messages="data.totalMessages"
        :unique="data.totalUniqueMessages"
      />

      <div class="tier-grid">
        <div class="tier-group" v-for="idx in 5" :key="idx">
          <div class="tier-chip">
            <span class="chip-color" :style="{ background: tierColors[`HT${idx}`] }" />
            <div class="chip-meta">
              <span class="chip-label">HT{{ idx }}</span>
              <span class="range">{{ tierRanges[`HT${idx}`] }}</span>
            </div>
          </div>
          <div class="tier-chip">
            <span class="chip-color" :style="{ background: tierColors[`LT${idx}`] }" />
            <div class="chip-meta">
              <span class="chip-label">LT{{ idx }}</span>
              <span class="range">{{ tierRanges[`LT${idx}`] }}</span>
            </div>
          </div>
        </div>
      </div>

      <TierTable
        ref="tableRef"
        :entries="data.entries"
        :profiles="profiles"
        :avatar-classes="avatarClasses"
        :tier-colors="tierColors"
        @open-profile="openProfile"
      />
    </section>
  </main>

  <UserCard
    v-if="showProfile && userData"
    :user-data="userData"
    :display-name="displayNameLine"
    :created-text="humanizeFromDate(userData.createdAt)"
    :follow-text="humanizeFromDate(relations[userData.id]?.followedAt)"
    :sub-text="humanizeMonths(relations[userData.id]?.subMonths)"
    :role-text="
      userData.roles?.isPartner ? 'Партнёр' : userData.roles?.isAffiliate ? 'Компаньон' : ''
    "
    :selected-entry="selectedEntry"
    :selected-rank="selectedRank"
    :tier-colors="tierColors"
    @close="showProfile = false"
  />
</template>

<style scoped>
.page {
  min-width: 60vw;
  margin-top: 5em;
  padding: 32px 20px 64px;
  background: var(--color-bg3);
  border-radius: 1em;
  border: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
  width: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7dd3fc;
  font-size: 12px;
  font-weight: 600;
  margin: 0;
}

h1 {
  margin: 4px 0;
  font-size: 32px;
}

.muted {
  margin: 0;
  color: #ffffff;
}

.pill {
  background: #0b0b0e;
  border: 1px solid #1a1a1a;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-weight: 700;
}

.card {
  margin-top: 1em;
  background: var(--color-bg2);
  border: 1px solid #161616;
  border-radius: 14px;
  padding: 16px;
}

.card.no-lift:hover {
  transform: none;
  box-shadow: none;

  border-color: #1f1f1f;
}

.lookup {
  display: grid;
  gap: 12px;
}

.lookup-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.lookup-row input {
  flex: 1;
  background: #0b0b0b;
  border: 1px solid #2d2d2d;
  color: #ffffff;
  border-radius: 12px;
  padding: 10px 12px;
}

.lookup-row .btn:hover,
.lookup-row .btn:active {
  transform: none !important;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.15s ease;
  border: 1px solid #2d2d2d;
  background: #0a0a0a;
  color: #ffffff;
  box-shadow: none;
}

.btn.primary:hover {
  border-color: #444444;
  background: #111111;
  transform: none;
}

.btn.primary:active {
  transform: none;
  border-color: #666666;
  background: #111111;
}

.profile {
  display: flex;
  gap: 12px;
  align-items: center;
}

.profile img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #1f2937;
}

.card.error {
  border-color: #b91c1c;
  color: #fecdd3;
}

.error-text {
  color: #fca5a5;
  margin: 0;
}

.tier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.tier-group {
  display: grid;
  gap: 6px;
}

.tier-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #0b0b0e;
  border: 1px solid #2d2d2d;
  border-radius: 12px;
}

.chip-color {
  width: 16px;
  height: 16px;
  border-radius: 6px;
}

.chip-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.range {
  font-size: 12px;
  color: #cbd5e1;
}

.profile-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.btn.secondary {
  background: #0d0d0d;
  border: 1px solid #2d2d2d;
}

.btn.primary.refresh-btn {
  align-self: flex-start;
  padding: 10px 16px;
  background: var(--color-brand-accent-1);
  border-color: var(--color-brand-accent-2);
  color: #ffffff;
  box-shadow:
    0 6px 20px rgba(16, 174, 185, 0.15),
    0 0 12px rgba(16, 145, 185, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s,
    color 0.15s;
}

.btn.primary.refresh-btn:hover {
  transform: none;
}

.btn.primary.refresh-btn:active {
  transform: none;
  border-color: #065f46;
  background: #059669;
  box-shadow:
    0 6px 18px rgba(16, 185, 129, 0.12),
    0 0 10px rgba(16, 185, 129, 0.3);
}

/* Disabled state: gray and non-interactive */
.btn.primary.refresh-btn[disabled],
.btn.primary.refresh-btn:disabled {
  background: #4b5563;
  border-color: #374151;
  color: #e5e7eb;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.75;
}

.btn.primary.refresh-btn[disabled]:hover,
.btn.primary.refresh-btn[disabled]:active,
.btn.primary.refresh-btn:disabled:hover,
.btn.primary.refresh-btn:disabled:active {
  transform: none;
  background: #4b5563;
  border-color: #374151;
  box-shadow: none;
}

/* Underline rustlog link in muted text */
.muted a {
  text-decoration: underline;
  text-underline-offset: 2px;
  color: inherit;
}

.muted a:focus,
.muted a:hover {
  text-decoration: underline;
}
</style>
