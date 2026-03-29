<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "#imports";
import TierControls from "~/components/chat-tiers/TierControls.vue";
import TierSummary from "~/components/chat-tiers/TierSummary.vue";
import TierTable from "~/components/chat-tiers/TierTable.vue";
import UserCard from "~/components/chat-tiers/UserCard.vue";
import { useRoles } from "~/composables/useRoles";
import { defaultTierColors } from "~/constants/tiers";
import {
  fetchAvailableChannels,
  fetchAvailablePeriods,
  fetchTiersSupabase as fetchTiers,
} from "~/lib/api";
import { sortScoredEntries } from "~/lib/score";
import type { Mode, Scope, TierEntry, TierResponse } from "~/types/tiers";

const channel = ref("zakvielchannel");
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);
const scope = ref<Scope>("month");
const mode = ref<Mode>("online");
const hadInitialPeriodQuery = ref(false);
const availableYears = ref<number[]>([]);
const availableMonthsMap = ref<Record<number, number[]>>({});
const availableMonths = computed(() => availableMonthsMap.value[year.value] || []);
const availableChannels = ref<string[]>([]);
const availableScopes = ref<Scope[]>([]);
const availableModesMap = ref<Record<Scope, Mode[]>>({
  year: [],
  month: [],
  day: [],
});
const availableModes = computed(() => availableModesMap.value[scope.value] || []);

type IvrUser = {
  id: string;
  login: string;
  displayName: string;
  logo?: string;
  followers?: number | null;
  createdAt?: string;
  roles?: {
    isAffiliate?: boolean;
    isPartner?: boolean;
    isStaff?: boolean | null;
  };
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
const tableAnimationSeed = ref(0);
const tableRef = ref<{
  wrapEl: HTMLElement | null;
  sentinelEl: HTMLElement | null;
} | null>(null);
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
        profiles[u.id] = {
          displayName: u.displayName,
          login: u.login,
          logo: u.logo,
        };
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

const lookupUserRemotely = async (termOverride?: string) => {
  userError.value = null;
  userData.value = null;
  showProfile.value = false;
  const term = (termOverride ?? userLookup.value).trim();
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

const normalizeSearch = (value?: string | null) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const fuzzyScore = (query: string, target: string) => {
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

const filteredEntries = computed(() => {
  const query = normalizeSearch(activeSearch.value);
  if (!query || !rankedEntries.value.length) return [];

  return rankedEntries.value
    .map((entry) => {
      const profile = profiles[entry.userId];
      const displayName = normalizeSearch(profile?.displayName || entry.userLogin || entry.userId);
      const login = normalizeSearch(profile?.login || entry.userLogin || "");
      const userId = normalizeSearch(entry.userId);
      return Math.max(
        fuzzyScore(query, userId) + (userId === query ? 900 : 0),
        fuzzyScore(query, login),
        fuzzyScore(query, displayName),
      );
    })
    .map((score, idx) => ({ score, entry: rankedEntries.value[idx] }))
    .filter((item) => item.score >= 0)
    .map((item) => item.entry);
});

const displayedEntries = computed(() =>
  activeSearch.value.trim() ? filteredEntries.value : data.value?.entries || [],
);

const openProfile = async (userId: string) => {
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
  await lookupUserRemotely(userId);
};

const data = ref<TierResponse | null>(null);
const pending = ref(false);
const error = ref<unknown>(null);
const latestMonthlySelection = computed(() => {
  for (const y of availableYears.value) {
    const monthsForYear = availableMonthsMap.value[y] || [];
    if (monthsForYear.length) {
      return {
        year: y,
        month: monthsForYear[monthsForYear.length - 1],
      };
    }
  }
  return null;
});

const syncFromQuery = () => {
  const q = route.query;
  hadInitialPeriodQuery.value =
    typeof q.scope === "string" ||
    typeof q.year === "string" ||
    typeof q.month === "string" ||
    typeof q.mode === "string";
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

const alignToAvailable = (preferLatestMonth = false) => {
  if (availableChannels.value.length && !availableChannels.value.includes(channel.value)) {
    channel.value = availableChannels.value[0];
  }

  let yearWasAdjusted = false;
  if (availableYears.value.length && !availableYears.value.includes(year.value)) {
    year.value = availableYears.value[0];
    yearWasAdjusted = true;
  }

  if (
    preferLatestMonth &&
    latestMonthlySelection.value &&
    availableScopes.value.includes("month")
  ) {
    scope.value = "month";
    year.value = latestMonthlySelection.value.year;
    month.value = latestMonthlySelection.value.month;
  } else if (scope.value === "month") {
    const monthsForYear = availableMonths.value;
    if (!monthsForYear.length) {
      scope.value = "year";
    } else if (yearWasAdjusted || !monthsForYear.includes(month.value)) {
      month.value = monthsForYear[monthsForYear.length - 1];
    }
  }

  if (availableModes.value.length && !availableModes.value.includes(mode.value)) {
    mode.value = availableModes.value[0];
  }
};

const loadAvailable = async (preferLatestMonth = false) => {
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
    availableScopes.value = scopes;
    if (availableScopes.value.length === 1) {
      scope.value = availableScopes.value[0];
    } else if (!availableScopes.value.includes(scope.value)) {
      scope.value = availableScopes.value[0] || "year";
    }
    alignToAvailable(preferLatestMonth);
  } catch {
    availableChannels.value = [];
    availableYears.value = [];
    availableMonthsMap.value = {};
    availableScopes.value = [];
    availableModesMap.value = {
      year: [],
      month: [],
      day: [],
    };
  }
};

const loadTiers = async () => {
  data.value = await fetchTiers({
    channel: channel.value,
    scope: scope.value,
    year: year.value,
    month: month.value,
    mode: mode.value,
  });
  tableAnimationSeed.value += 1;
  prefetchIndex.value = 0;
  await prefetchMoreProfiles();
};

const canReload = computed(() => {
  if (!channel.value.trim()) return false;
  if (!availableYears.value.length) return false;
  if (!availableScopes.value.includes(scope.value)) return false;
  if (!availableModes.value.length || !availableModes.value.includes(mode.value)) return false;
  if (scope.value === "month" && !availableMonths.value.includes(month.value)) return false;
  return true;
});

watch(
  () => data.value?.entries,
  async (entries: TierEntry[] | undefined) => {
    if (!entries) return;
    const topIds = sortScoredEntries(entries)
      .slice(0, 50)
      .map((entry) => entry.userId);
    await fetchProfiles(topIds);
    await fetchRelations(topIds);
    setupPrefetchObserver();
  },
  { immediate: true },
);

const reload = async () => {
  if (!canReload.value) return;

  pending.value = true;
  error.value = null;

  const rolesPromise = loadRoles(channel.value).catch(() => {
    /* cosmetic only */
  });

  try {
    await loadAvailable();
    await loadTiers();
    await rolesPromise;
    pushQuery();
  } catch (e: unknown) {
    error.value = e;
  } finally {
    pending.value = false;
  }
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
    await loadAvailable(true);
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
  if (!rankedEntries.value.length) return;
  const entries = rankedEntries.value;
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
  await loadAvailable(!hadInitialPeriodQuery.value);
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

const rankedEntries = computed(() =>
  data.value?.entries ? sortScoredEntries(data.value.entries) : [],
);

const activeSearch = computed(() => userLookup.value.trim());
const rankMap = computed(() =>
  Object.fromEntries(rankedEntries.value.map((entry, index) => [entry.userId, index + 1])),
);

const selectedEntry = computed(() => {
  if (!data.value || !userData.value) return null;
  return data.value.entries.find((e: TierEntry) => e.userId === userData.value?.id) || null;
});

const selectedRank = computed(() => {
  if (!userData.value) return null;
  const idx = rankedEntries.value.findIndex((entry) => entry.userId === userData.value?.id);
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
  <main class="site-page tiers-page surface-panel surface-panel--padded">
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
      <button class="btn primary refresh-btn" @click="reload" :disabled="pending || !canReload">
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
          <input v-model="userLookup" type="text" placeholder="login, display name or id" />
          <button v-if="activeSearch" class="btn secondary" type="button" @click="userLookup = ''">
            Сбросить
          </button>
        </div>
        <p v-if="activeSearch" class="lookup-meta">
          Найдено {{ filteredEntries.length }} из {{ rankedEntries.length }} по запросу "{{
            activeSearch
          }}"
        </p>
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

    <section v-if="pending || data" class="card no-lift results-card">
      <TierSummary
        :loading="pending"
        :period="periodText"
        :timezone="data?.timezone || ''"
        :users="data?.totalUsers || 0"
        :messages="data?.totalMessages || 0"
        :unique="data?.totalUniqueMessages || 0"
      />

      <div class="table-slot">
        <p v-if="!pending && activeSearch && !filteredEntries.length" class="lookup-empty">
          По текущему запросу ничего не найдено.
        </p>
        <TierTable
          ref="tableRef"
          :entries="displayedEntries"
          :rank-map="rankMap"
          :profiles="profiles"
          :avatar-classes="avatarClasses"
          :tier-colors="tierColors"
          :loading="pending"
          :skeleton-rows="11"
          :animation-seed="tableAnimationSeed"
          @open-profile="openProfile"
        />
      </div>
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
.tiers-page {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  backdrop-filter: blur(10px);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
  color: var(--color-text-2);
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
  margin-top: 0;
  background: rgba(11, 11, 14, 0.82);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 16px;
}

.results-card {
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.results-card :deep(.summary) {
  padding: 16px 16px 12px;
  margin-bottom: 0;
}

.card.no-lift:hover {
  transform: none;
  box-shadow: none;

  border-color: #1f1f1f;
}

.lookup {
  display: grid;
  gap: 12px;
  position: relative;
}

.lookup-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.lookup-row input {
  flex: 1 1 240px;
  min-width: 0;
  background: rgba(11, 11, 11, 0.92);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-1);
  border-radius: 12px;
  padding: 10px 12px;
}

.lookup-meta,
.lookup-empty {
  color: var(--color-text-2);
  font-size: 0.92rem;
}

.lookup-empty {
  margin: 0;
  padding: 12px 16px;
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
  border: 1px solid var(--color-border-strong);
  background: rgba(10, 10, 10, 0.92);
  color: var(--color-text-1);
  box-shadow: none;
  cursor: pointer;
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

.profile-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.table-slot {
  min-height: 0;
}

.table-slot :deep(.table-wrap) {
  border: 0;
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 14px 14px;
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
  border-color: #446973;
  background: #43656d;
  box-shadow:
    0 6px 18px rgba(67, 101, 109, 0.18),
    0 0 10px rgba(84, 129, 138, 0.24);
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

@media (min-width: 901px) {
  .tiers-page {
    height: calc(100dvh - 132px);
    overflow: hidden;
  }

  .results-card {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .table-slot {
    flex: 1 1 auto;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  .table-slot :deep(.table-wrap) {
    height: 100%;
    width: 100%;
    min-height: 0;
  }
}

@media (max-width: 900px) {
  .tiers-page {
    padding: 16px;
  }

  h1 {
    font-size: 28px;
  }
}

@media (max-width: 640px) {
  .lookup-row,
  .profile-mini {
    flex-direction: column;
    align-items: stretch;
  }

  .btn,
  .btn.primary.refresh-btn {
    width: 100%;
  }
}
</style>
