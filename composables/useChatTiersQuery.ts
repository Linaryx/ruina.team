import { useRoute, useRouter } from "#imports";
import type { Ref } from "vue";
import type { Mode, Scope } from "~/types/tiers";

type UseChatTiersQueryOptions = {
  channel: Ref<string>;
  scope: Ref<Scope>;
  year: Ref<number>;
  month: Ref<number>;
  mode: Ref<Mode>;
  hadInitialPeriodQuery: Ref<boolean>;
};

// Синхронизация query-параметров URL с рефами состояния страницы.
export const useChatTiersQuery = ({
  channel,
  scope,
  year,
  month,
  mode,
  hadInitialPeriodQuery,
}: UseChatTiersQueryOptions) => {
  const route = useRoute();
  const router = useRouter();

  const firstQueryValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);
  const getBrowserQueryString = (key: string) => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get(key)?.trim() || "";
  };

  const isDebugEnabled = () => {
    const debugValue = getQueryString("debug");
    const isLocalhost =
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocalhost || debugValue === "1" || debugValue === "tiers";
  };

  const debugLog = (event: string, payload: Record<string, unknown> = {}) => {
    if (!isDebugEnabled()) return;
    console.debug(`[chat-tiers:url] ${event}`, {
      ...payload,
      routeFullPath: route.fullPath,
      routeQuery: { ...route.query },
      state: {
        channel: channel.value,
        scope: scope.value,
        year: year.value,
        month: month.value,
        mode: mode.value,
      },
    });
  };

  const getFullPathQueryString = (key: string) => {
    const queryStart = route.fullPath.indexOf("?");
    if (queryStart === -1) return "";

    const queryString = route.fullPath.slice(queryStart + 1).split("#")[0];
    return new URLSearchParams(queryString).get(key)?.trim() || "";
  };

  const getQueryString = (...keys: string[]) => {
    for (const key of keys) {
      const value = firstQueryValue(route.query[key]);
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      const fullPathValue = getFullPathQueryString(key);
      if (fullPathValue) {
        return fullPathValue;
      }

      const browserValue = getBrowserQueryString(key);
      if (browserValue) {
        return browserValue;
      }
    }
    return "";
  };

  const hasQuery = () =>
    !!getQueryString("c", "channel") ||
    !!getQueryString("sc", "scope") ||
    !!getQueryString("y", "year") ||
    !!getQueryString("mo", "month") ||
    !!getQueryString("m", "mode");

  const waitForLateInitialQuery = async () => {
    if (hasQuery()) return;
    if (typeof window === "undefined") return;

    const startedAt = performance.now();
    const timeoutMs = 900;
    while (performance.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
      if (hasQuery()) {
        debugLog("syncFromQuery:late-query-detected", {
          waitedMs: Math.round(performance.now() - startedAt),
        });
        return;
      }
    }

    debugLog("syncFromQuery:late-query-timeout", { waitedMs: timeoutMs });
  };

  const syncFromQuery = async () => {
    debugLog("syncFromQuery:before-ready");
    await router.isReady();
    debugLog("syncFromQuery:after-ready");
    await waitForLateInitialQuery();

    const hadInitialChannelQuery = !!getQueryString("c", "channel");
    hadInitialPeriodQuery.value =
      !!getQueryString("sc", "scope") ||
      !!getQueryString("y", "year") ||
      !!getQueryString("mo", "month") ||
      !!getQueryString("m", "mode");
    const hadInitialQuery = hadInitialChannelQuery || hadInitialPeriodQuery.value;

    const queryChannel = getQueryString("c", "channel");
    const queryScope = getQueryString("sc", "scope");
    const queryYear = getQueryString("y", "year");
    const queryMonth = getQueryString("mo", "month");
    const queryMode = getQueryString("m", "mode");

    if (queryChannel) channel.value = queryChannel;
    if (queryScope === "year" || queryScope === "month") scope.value = queryScope;
    const y = Number(queryYear);
    if (Number.isFinite(y) && y > 2000) year.value = y;
    const m = Number(queryMonth);
    if (Number.isFinite(m) && m >= 1 && m <= 12) month.value = m;
    if (queryMode === "all" || queryMode === "online" || queryMode === "offline") {
      mode.value = queryMode;
    }

    debugLog("syncFromQuery:applied", {
      parsed: {
        channel: queryChannel,
        scope: queryScope,
        year: queryYear,
        month: queryMonth,
        mode: queryMode,
      },
      hadInitialPeriodQuery: hadInitialPeriodQuery.value,
      hadInitialQuery,
    });

    return {
      hadInitialPeriodQuery: hadInitialPeriodQuery.value,
      hadInitialQuery,
    };
  };

  const pushQuery = (reason = "unknown") => {
    const query: Record<string, string> = {
      c: channel.value,
      sc: scope.value,
      y: String(year.value),
    };

    if (scope.value !== "year") {
      query.mo = String(month.value);
    }

    query.m = mode.value;

    debugLog("pushQuery", { reason, nextQuery: query });
    if (isDebugEnabled()) {
      console.trace("[chat-tiers:url] pushQuery stack");
    }

    router.replace({
      query,
    });
  };

  return {
    hasQuery,
    syncFromQuery,
    pushQuery,
  };
};
