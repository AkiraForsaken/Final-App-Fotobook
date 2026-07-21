import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface Page<T> {
	items: T[];
	nextCursor: number | null;
}

type Fetcher<T> = (cursor: number | undefined, take: number) => Promise<Page<T>>;

/**
 * usePaginatedContent — drives ONE server-paginated list (e.g. "feed photos",
 * "feed albums", "discovery photos"...) against a cursor/take endpoint, with
 * an IntersectionObserver sentinel for infinite scroll.
 *
 * Replaces the old useInfiniteScroll.ts (which sliced an already-fully-loaded
 * client array) now that the backend does real keyset pagination. Feed and
 * Discovery each need two independent instances — one for photos, one for
 * albums — since they paginate against separate endpoints/cursors.
 */
export function usePaginatedContent<T extends { id: number }>(
	fetchPage: Fetcher<T>,
	pageSize = 6,
	enabled = true
) {
	const [items, setItems] = useState<T[]>([]);
	const [nextCursor, setNextCursor] = useState<number | null>(null);
	const [loading, setLoading] = useState(enabled); // initial page only
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Always call the latest fetcher without needing it in effect deps —
	// callers often pass an inline function reference each render.
	const fetchPageRef = useRef(fetchPage);
	useLayoutEffect(() => {
		fetchPageRef.current = fetchPage;
	}, [fetchPage]);

	const loadFirstPage = useCallback(async () => {
		if (!enabled) return;
		setLoading(true);
		// setError(null);
		try {
			const page = await fetchPageRef.current(undefined, pageSize);
			setItems(page.items);
			setNextCursor(page.nextCursor);
			setError(null);
		} catch (err) {
			console.error('Failed to load content:', err);
			setError('Could not load content.');
		} finally {
			setLoading(false);
		}
	}, [pageSize, enabled]);

	useEffect(() => {
		let active = true;

		const fetchInitialData = async () => {
			// Prevents updating state on unmounted components
			if (active) {
				await loadFirstPage();
			}
		};

		void fetchInitialData();

		return () => {
			active = false;
		};
	}, [loadFirstPage]);

	const hasMore = nextCursor !== null;

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore || nextCursor === null) return;
		setLoadingMore(true);
		try {
			const page = await fetchPageRef.current(nextCursor, pageSize);
			setItems((prev) => [...prev, ...page.items]);
			setNextCursor(page.nextCursor);
		} catch (err) {
			console.error('Failed to load more content:', err);
			setError('Could not load more content.');
		} finally {
			setLoadingMore(false);
		}
	}, [hasMore, loadingMore, nextCursor, pageSize]);

	const observerRef = useRef<IntersectionObserver | null>(null);
	const sentinelRef = useCallback(
		(node: HTMLDivElement | null) => {
			observerRef.current?.disconnect();
			if (!hasMore || !node) return;
			observerRef.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) void loadMore();
				},
				{ rootMargin: '0px', threshold: 0.05 }
			);
			observerRef.current.observe(node);
		},
		[hasMore, loadMore]
	);

	useEffect(() => () => observerRef.current?.disconnect(), []);

	// Optimistic single-item update (used for like/unlike) — caller supplies
	// the transform; this hook doesn't know about likes specifically.
	const updateItem = useCallback((id: number, apply: (item: T) => T) => {
		setItems((prev) => prev.map((item) => (item.id === id ? apply(item) : item)));
	}, []);

	return {
		items,
		loading,
		loadingMore,
		error,
		hasMore,
		sentinelRef,
		updateItem,
		refetch: loadFirstPage,
	};
}
