interface PaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	windowSize?: number;
}

const baseButtonClass =
	'px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150';
const defaultButtonClass = `${baseButtonClass} text-text-secondary hover:bg-bg-page`;
const activeButtonClass = `${baseButtonClass} bg-nav-active-bg text-nav-active-text`;
const disabledButtonClass = `${baseButtonClass} text-text-secondary hover:bg-bg-page disabled:opacity-40 disabled:cursor-not-allowed`;

const PaginationButton = ({
	children,
	isActive,
	disabled,
	onClick,
}: {
	children: React.ReactNode;
	isActive?: boolean;
	disabled?: boolean;
	onClick: () => void;
}) => (
	<button
		type="button"
		disabled={disabled}
		onClick={onClick}
		className={isActive ? activeButtonClass : disabled ? disabledButtonClass : defaultButtonClass}
	>
		{children}
	</button>
);

export const Pagination = ({ page, totalPages, onPageChange, windowSize = 6 }: PaginationProps) => {
	// Hide pagination if there is only 1 page or no data
	if (totalPages <= 1) return null;

	const start = Math.min(
		Math.max(1, page - Math.floor(windowSize / 2)),
		Math.max(1, totalPages - windowSize + 1)
	);
	const end = Math.min(totalPages, start + windowSize - 1);

	const pages: number[] = [];
	for (let p = start; p <= end; p++) pages.push(p);

	return (
		<nav className="flex items-center justify-center flex-wrap gap-1 py-6" aria-label="Pagination">
			<PaginationButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
				Previous
			</PaginationButton>

			{start > 1 && (
				<>
					<PaginationButton onClick={() => onPageChange(1)}>1</PaginationButton>
					{start > 2 && <span className="px-1 text-text-muted">…</span>}
				</>
			)}

			{pages.map((p) => (
				<PaginationButton key={p} isActive={p === page} onClick={() => onPageChange(p)}>
					{p}
				</PaginationButton>
			))}

			{end < totalPages && (
				<>
					{end < totalPages - 1 && <span className="px-1 text-text-muted">…</span>}
					<PaginationButton onClick={() => onPageChange(totalPages)}>{totalPages}</PaginationButton>
				</>
			)}

			<PaginationButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
				Next
			</PaginationButton>
		</nav>
	);
};
