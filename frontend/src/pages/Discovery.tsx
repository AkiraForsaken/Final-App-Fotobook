import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { FeedMode, User } from '../types/index.ts';
import { PhotoCard } from '../components/photo/PhotoCard.tsx';
import { AlbumCard } from '../components/album/AlbumCard.tsx';
import { FeedToggle } from '../components/FeedToggle.tsx';
import { FollowButton } from '../components/FollowButton.tsx';
import { ScrollFooter } from '../components/ScrollFooter.tsx';
import { PhotoModal } from '../components/photo/PhotoModal.tsx';
import { AlbumModal } from '../components/album/AlbumModal.tsx';
import { routeUtils } from '../utils/routes.ts';
import { useDiscovery } from '../hooks/useDiscovery.ts';
import { useAuth } from '../hooks/useAuth.ts';

export const Discovery = ({ currentUser }: { currentUser: User | null }) => {
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
		toggleFollow,
		loading,
	} = useDiscovery(!checkingSession);

	const navigate = useNavigate();
	const [feedMode, setFeedMode] = useState<FeedMode>('photos');

	if (checkingSession) {
		return <div className="flex h-screen items-center justify-center">Verifying session...</div>;
	}

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">Loading Discovery Content...</div>
		);
	}

	const followBtn = (author: { id: number; isFollowedByMe?: boolean }) => {
		if (!currentUser || currentUser.id === author.id) return null;
		return (
			<FollowButton
				authorId={author.id}
				currentUserId={currentUser.id}
				isFollowing={Boolean(author.isFollowedByMe)}
				onToggle={() => toggleFollow(author.id, Boolean(author.isFollowedByMe))}
			/>
		);
	};

	return (
		<div>
			<main className="flex flex-col">
				<FeedToggle mode={feedMode} onChange={setFeedMode} />

				<div className="mt-6">
					{/* Photos grid */}
					<div className={feedMode === 'photos' ? '' : 'hidden'}>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{photoFeed.items.map((photo) => (
								<div key={photo.id} className="relative">
									<PhotoCard
										photo={photo}
										onLike={toggleLikePhoto}
										onClickPhoto={(p) => setActivePhoto(p)}
										onClickAuthor={(id) => navigate(routeUtils.getPublicProfile(id))}
									/>
									<div className="absolute top-4 right-1">{followBtn(photo.author)}</div>
								</div>
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
								<div key={album.id} className="relative">
									<AlbumCard
										album={album}
										onLike={toggleLikeAlbum}
										onClickAlbum={(a) => setActiveAlbum(a)}
										onClickAuthor={(id) => navigate(routeUtils.getPublicProfile(id))}
									/>
									<div className="absolute top-3 right-3">{followBtn(album.author)}</div>
								</div>
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
