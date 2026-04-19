import { onBeforeUnmount, ref, type Ref } from "vue";

type UsePrefetchRowsOptions = {
  fetchBatch: (ids: string[]) => Promise<void>;
  getIds: () => string[];
  wrapEl: Ref<HTMLElement | null>;
  sentinelEl: Ref<HTMLElement | null>;
  initialSkip?: number;
  batchSize?: number;
};

// Composable для подгрузки профилей при скролле таблицы: IntersectionObserver + scroll handler.
export const usePrefetchRows = ({
  fetchBatch,
  getIds,
  wrapEl,
  sentinelEl,
  initialSkip = 50,
  batchSize = 25,
}: UsePrefetchRowsOptions) => {
  const prefetchIndex = ref(0);
  let observer: IntersectionObserver | null = null;
  let scrollEl: HTMLElement | null = null;
  let isPrefetching = false;

  const prefetchMore = async () => {
    if (isPrefetching) return;
    const entries = getIds();
    if (!entries.length) return;
    const start = initialSkip + prefetchIndex.value * batchSize;
    if (start >= entries.length) return;
    isPrefetching = true;
    try {
      const slice = entries.slice(start, start + batchSize);
      await fetchBatch(slice);
      prefetchIndex.value += 1;
    } finally {
      isPrefetching = false;
    }
  };

  const handleScroll = () => {
    if (!scrollEl) return;
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight || 1;
    const progress = Math.min(1, scrollEl.scrollTop / maxScroll);
    if (progress > 0.7) {
      prefetchMore();
    }
  };

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scrollEl) {
      scrollEl.removeEventListener("scroll", handleScroll);
      scrollEl = null;
    }
  };

  const setup = () => {
    const wrap = wrapEl.value;
    const sentinel = sentinelEl.value;
    scrollEl = wrap || null;
    if (!wrap || !sentinel) return;
    if (observer) {
      observer.disconnect();
    }
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          prefetchMore();
        }
      });
    };
    observer = new IntersectionObserver(handleIntersect, {
      root: wrap,
      threshold: 0.3,
    });
    observer.observe(sentinel);

    wrap.removeEventListener("scroll", handleScroll);
    wrap.addEventListener("scroll", handleScroll, { passive: true });
  };

  const resetIndex = () => {
    prefetchIndex.value = 0;
  };

  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    prefetchIndex,
    prefetchMore,
    setup,
    cleanup,
    resetIndex,
  };
};
