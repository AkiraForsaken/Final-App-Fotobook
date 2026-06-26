import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.ts';
import type { FeedMode, Photo, Album } from '../types/index.ts';
import { useDataContext } from '../hooks/useDataContext.ts';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { AlbumCard } from '../components/AlbumCard.tsx';
import { FeedToggle } from '../components/FeedToggle.tsx';
import { ScrollFooter } from '../components/ScrollFooter.tsx';
import { PhotoModal } from '../components/PhotoModal.tsx';
import { AlbumModal } from '../components/AlbumModal.tsx';

const PAGE_SIZE = 6;

export const Feeds = () => {
	const { feedPhotos, feedAlbums, loading, toggleLikePhoto, toggleLikeAlbum } = useDataContext();
	const [feedMode, setFeedMode] = useState<FeedMode>('photos');
	const navigate = useNavigate();

	// Separate infinite-scroll instances for each mode
	const photoScroll = useInfiniteScroll(feedPhotos, PAGE_SIZE);
	const albumScroll = useInfiniteScroll(feedAlbums, PAGE_SIZE);

	// Modal states
	const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
	const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">Loading Feeds Content...</div>
		);
	}

	return (
		<div className="">
			{/* <SideBar items={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /> */}

			{/* Main content */}
			<main className="flex flex-col">
				<FeedToggle mode={feedMode} onChange={setFeedMode} />

				<div className="mt-6">
					{/* Photos grid  */}
					<div className={feedMode === 'photos' ? '' : 'hidden'}>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{(photoScroll.visibleItems as Photo[]).map((photo) => (
								<PhotoCard
									key={photo.id}
									photo={photo}
									onLike={toggleLikePhoto}
									onClickPhoto={(p) => setActivePhoto(p)}
									onClickAuthor={(id) => navigate(`/profile/${id}`)}
								/>
							))}
						</div>
						{/* Photo sentinel */}
						<div
							ref={(node) => photoScroll.sentinelRef(node)}
							className="mt-4 flex justify-center py-6"
						>
							<ScrollFooter hasMore={photoScroll.hasMore || photoScroll.loading} mode="photo" />
						</div>
					</div>

					{/* Albums grid */}
					<div className={feedMode === 'albums' ? '' : 'hidden'}>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{(albumScroll.visibleItems as Album[]).map((album) => (
								<AlbumCard
									key={album.id}
									album={album}
									onLike={toggleLikeAlbum}
									onClickAlbum={(a) => setActiveAlbum(a)}
									onClickAuthor={(id) => navigate(`/profile/${id}`)}
								/>
							))}
						</div>
						{/* Album sentinel */}
						<div
							ref={(node) => albumScroll.sentinelRef(node)}
							className="mt-4 flex justify-center py-6"
						>
							<ScrollFooter hasMore={albumScroll.hasMore || albumScroll.loading} mode="album" />
						</div>
					</div>
				</div>

				<PhotoModal photo={activePhoto} onClose={() => setActivePhoto(null)} />
				<AlbumModal album={activeAlbum} onClose={() => setActiveAlbum(null)} />
			</main>

			{/* Right spacer
				<div className="hidden xl:block min-w-[13%] shrink-0 bg-gray-100" /> */}
		</div>
	);
};
