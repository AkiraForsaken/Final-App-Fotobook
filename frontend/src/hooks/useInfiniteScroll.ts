import { useState, useRef, useEffect, useCallback } from "react";

/*
 Custom hook: useInfiniteScroll
 Slices `allItems` into pages of `pageSize` and exposes the currently
 visible slice. It returns a `sentinelRef` callback function to be attached 
 to your loader/sentinel element.

 Note: when switching to a real API later on,
  rewrite this hook to accept a fetching callback function that handles 
  query parameters (e.g., ?page=2&limit=6) so the server only sends down chunks of data at a time.
*/
export function useInfiniteScroll<T>(allItems: T[], pageSize: number, loadDelay: number = 800) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const visibleItems = allItems.slice(0, page * pageSize);
  const hasMore = visibleItems.length < allItems.length;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      setPage((p) => p + 1);
      setLoading(false);
    }, loadDelay);
  }, [loadDelay, loading, hasMore]);

  // Reset page whenever the source data container changes
  useEffect(() => {
    setPage(1);
  }, [allItems]);

  // Clean up timers and observers when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // Callback Ref: React calls this function with the DOM element node 
  // when it mounts, and with `null` when it unmounts.
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Skip observing if there is no more data to load
      if (!hasMore || !node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Trigger loading only if the element enters view and we aren't currently waiting on a timeout
          if (entries[0].isIntersecting && !loading) {
            loadMore();
          }
        },
        { rootMargin: "0px", threshold: 0.05 }
      );

      observerRef.current.observe(node);
      return () => {
        if (observerRef.current)
          observerRef.current.disconnect();
      }
    },
    [hasMore, loading, loadMore]
  );

  return { visibleItems, sentinelRef, hasMore, loading };
}