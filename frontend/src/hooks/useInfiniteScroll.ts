import { useState, useRef, useEffect, useCallback } from "react";

/**
 useInfiniteScroll

 Slices `allItems` into pages of `pageSize` and exposes the currently
 visible slice. Attach the returned `sentinelRef` to a div placed after
 the last rendered item; the next page loads when that div enters the
 viewport.

 Design decisions:
 - rootMargin is "0px" — load only when the sentinel is actually visible,
   not 200px before. This ensures the user must scroll to the bottom before
   more items appear, which is the expected UX.
 - The observer effect depends on `[sentinelRef, loadMore]`. Because
   `sentinelRef` is a stable ref object this effectively re-runs only when
   `loadMore` identity changes (i.e. when `hasMore` flips). We additionally
   use a ref-callback pattern so the observer is always attached to whatever
   DOM node is currently in the ref, even after re-renders that swap the node.
 */
export function useInfiniteScroll<T>(allItems: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  // Use a callback ref instead of useRef so the effect re-runs whenever the
  // sentinel DOM node itself is mounted/unmounted (e.g. after a mode switch
  // causes the sentinel to re-render into a different element).
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = allItems.slice(0, page * pageSize);
  const hasMore = visibleItems.length < allItems.length;

  // Stable increment — identity only changes when hasMore flips so we don't
  // needlessly recreate the IntersectionObserver on every render.
  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  // Reset whenever the source data changes (feed-mode switch, new data, etc.)
  useEffect(() => {
    setPage(1);
  }, [allItems]);

  // Attach / detach the IntersectionObserver.
  // We read sentinelRef.current *inside* the effect so we always get the
  // current DOM node. The effect re-runs when `hasMore` changes so we
  // disconnect the observer once everything is loaded.
  useEffect(() => {
    if (!hasMore) {
      observerRef.current?.disconnect();
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "0px", threshold: 0.1 }
      // threshold: 0.1 — fire when at least 10% of the sentinel is visible.
      // This prevents the edge case where a 0-height sentinel triggers
      // before it's meaningfully in view.
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadMore]);

  return { visibleItems, sentinelRef, hasMore };
}