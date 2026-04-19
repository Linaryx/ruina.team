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
  const getQueryString = (...keys: string[]) => {
    for (const key of keys) {
      const value = firstQueryValue(route.query[key]);
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return "";
  };

  const syncFromQuery = () => {
    hadInitialPeriodQuery.value =
      !!getQueryString("sc", "scope") ||
      !!getQueryString("y", "year") ||
      !!getQueryString("mo", "month") ||
      !!getQueryString("m", "mode");

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
  };

  const pushQuery = () => {
    const query: Record<string, string> = {
      c: channel.value,
      sc: scope.value,
      y: String(year.value),
    };

    if (scope.value !== "year") {
      query.mo = String(month.value);
    }

    query.m = mode.value;

    router.replace({
      query,
    });
  };

  return {
    syncFromQuery,
    pushQuery,
  };
};
