export const ScrollFooter = ({ hasMore, mode }: { hasMore: boolean; mode: string }) => {
	return hasMore ? (
		<span className="text-gray-500 flex items-center gap-2">
			<i className="fa-solid fa-spinner fa-spin" />
			Loading more…
		</span>
	) : (
		<span className="text-gray-500">
			<i className="fa-solid fa-check-circle mr-1" />
			You've seen everything!
			{mode === 'photo' ? ' There are no more photos!' : ' There are no more albums!'}
		</span>
	);
};
