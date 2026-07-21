import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { FeedMode } from '../types/index.ts';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { AlbumCard } from '../components/AlbumCard.tsx';
import { FeedToggle } from '../components/FeedToggle.tsx';
import { ScrollFooter } from '../components/ScrollFooter.tsx';
import { PhotoModal } from '../components/PhotoModal.tsx';
import { AlbumModal } from '../components/AlbumModal.tsx';
import { routeUtils } from '../utils/routes.ts';
import { useFeed } from '../hooks/useFeed.ts';
import { useAuth } from '../hooks/useAuth.ts';

export const Feeds = () => {
	const { checkingSession } = useAuth();
	const {
		photoFeed,
		albumFeed,
		activePhoto,
		setActivePhoto,
		activeAlbum,
		setActiveAlbum,
		toggleLikePhoto,
		toggleLikeAlbum,
		loading,
	} = useFeed(!checkingSession);

	const [feedMode, setFeedMode] = useState<FeedMode>('photos');
	const navigate = useNavigate();

	if (checkingSession) {
		return <div className="flex h-screen items-center justify-center">Verifying session...</div>;
	}

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">Loading Feeds Content...</div>
		);
	}

	return (
		<div className="">
			<main className="flex flex-col">
				<FeedToggle mode={feedMode} onChange={setFeedMode} />

				<div className="mt-6">
					{/* Photos grid  */}
					<div className={feedMode === 'photos' ? '' : 'hidden'}>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{photoFeed.items.map((photo) => (
								<PhotoCard
									key={photo.id}
									photo={photo}
									onLike={toggleLikePhoto}
									onClickPhoto={(p) => setActivePhoto(p)}
									onClickAuthor={(id) => navigate(routeUtils.getPublicProfile(id))}
								/>
							))}
						</div>
						<div
							ref={(node) => photoFeed.sentinelRef(node)}
							className="mt-4 flex justify-center py-6"
						>
							<ScrollFooter hasMore={photoFeed.hasMore || photoFeed.loadingMore} mode="photo" />
						</div>
					</div>

					{/* Albums grid */}
					<div className={feedMode === 'albums' ? '' : 'hidden'}>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{albumFeed.items.map((album) => (
								<AlbumCard
									key={album.id}
									album={album}
									onLike={toggleLikeAlbum}
									onClickAlbum={(a) => setActiveAlbum(a)}
									onClickAuthor={(id) => navigate(routeUtils.getPublicProfile(id))}
								/>
							))}
						</div>
						<div
							ref={(node) => albumFeed.sentinelRef(node)}
							className="mt-4 flex justify-center py-6"
						>
							<ScrollFooter hasMore={albumFeed.hasMore || albumFeed.loadingMore} mode="album" />
						</div>
					</div>
				</div>

				<PhotoModal photo={activePhoto} onClose={() => setActivePhoto(null)} />
				<AlbumModal album={activeAlbum} onClose={() => setActiveAlbum(null)} />
			</main>
		</div>
	);
};
