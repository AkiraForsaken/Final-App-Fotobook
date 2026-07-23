import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const PAGE_SIZE = 40 as const;

export interface PagedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

type Fetcher<T> = (page: number, pageSize: number) => Promise<PagedResult<T>>;

/**
 * useOffsetPagination — drives standard page-based pagination for tables/grids.
 * Replaces the cursor-based infinite scroll implementation.
 */
export function useOffsetPagination<T extends { id: number }>(
	fetchPage: Fetcher<T>,
	pageSize = 40,
	enabled = true,
	resetKey?: unknown
) {
	const [items, setItems] = useState<T[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [loading, setLoading] = useState(enabled);
	const [error, setError] = useState<string | null>(null);

	// Always call the latest fetcher without needing it in effect deps —
	// callers often pass an inline function reference each render.
	const fetchPageRef = useRef(fetchPage);
	useLayoutEffect(() => {
		fetchPageRef.current = fetchPage;
	}, [fetchPage]);

	const load = useCallback(
		async function loadPage(targetPage: number) {
			if (!enabled) return;
			setLoading(true);
			try {
				const page = await fetchPageRef.current(targetPage, pageSize);
				if (page.totalPages > 0 && targetPage > page.totalPages) {
					await loadPage(page.totalPages);
					return;
				}

				setItems(page.items);
				setTotalPages(Math.max(1, page.totalPages));
				setTotalItems(page.totalItems);
				setPage(targetPage);
				setError(null);
			} catch (err) {
				console.error('Failed to load content:', err);
				setError('Could not load content.');
			} finally {
				setLoading(false);
			}
		},
		[pageSize, enabled]
	);

	useEffect(() => {
		let active = true;

		const fetchInitialData = async () => {
			setItems([]);
			if (active) {
				await load(1);
			}
		};

		void fetchInitialData();

		return () => {
			active = false;
		};
	}, [load, resetKey]);

	const goToPage = useCallback(
		(targetPage: number) => {
			const clamped = Math.min(Math.max(1, targetPage), Math.max(1, totalPages));
			if (clamped === page) return;
			void load(clamped);
		},
		[load, totalPages, page]
	);

	const refetch = useCallback(() => load(page), [load, page]);

	// Optimistic single-item update (e.g. for quick edits/status changes)
	const updateItem = useCallback((id: number, apply: (item: T) => T) => {
		setItems((prev) => prev.map((item) => (item.id === id ? apply(item) : item)));
	}, []);

	return {
		items,
		page,
		totalPages,
		totalItems,
		loading,
		error,
		goToPage,
		updateItem,
		refetch,
	};
}
