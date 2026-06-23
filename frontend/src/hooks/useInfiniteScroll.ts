import { useState, useRef, useEffect, useCallback } from "react";

/*
 Custom hook: useInfiniteScroll

 Slices `allItems` into pages of `pageSize` and exposes the currently
 visible slice. Attach the returned `sentinelRef` to a div placed after
 the last rendered item; the next page loads when that div enters the
 viewport.
*/
export function useInfiniteScroll<T>(allItems: T[], pageSize: number, loadDelay: number = 800) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoading(false);
    }, loadDelay);
  }, [loadDelay]);

  // Reset whenever the source data changes (feed-mode switch, new data, etc.)
  useEffect(() => {
    setPage(1);
  }, [allItems]);

  // Attach / detach the IntersectionObserver.
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
      { rootMargin: "0px", threshold: 0.01 }
      // load only when at least the sentinel is actually visible 
      // prevents the edge case 0 height
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadMore]);

  return { visibleItems, sentinelRef, hasMore, loading };
}