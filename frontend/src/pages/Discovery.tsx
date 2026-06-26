import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.ts';
import type { FeedMode, Photo, Album, User } from '../types/index.ts';
import { useDataContext } from '../hooks/useDataContext.ts';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { AlbumCard } from '../components/AlbumCard.tsx';
import { FeedToggle } from '../components/FeedToggle.tsx';
import { FollowButton } from '../components/FollowButton.tsx';
import { ScrollFooter } from '../components/ScrollFooter.tsx';
import { PhotoModal } from '../components/PhotoModal.tsx';
import { AlbumModal } from '../components/AlbumModal.tsx';

// 6 cards per load
const PAGE_SIZE = 6;

export const Discovery = ({ currentUser }: { currentUser: User | null }) => {
	const {
		discoveryPhotos,
		discoveryAlbums,
		profilesMap,
		loading,
		toggleLikePhoto,
		toggleLikeAlbum,
		toggleFollowUser,
	} = useDataContext();
	const navigate = useNavigate();
	const [feedMode, setFeedMode] = useState<FeedMode>('photos');

	const photoScroll = useInfiniteScroll(discoveryPhotos, PAGE_SIZE);
	const albumScroll = useInfiniteScroll(discoveryAlbums, PAGE_SIZE);

	// Modal states
	const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
	const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">Loading Discovery Content...</div>
		);
	}

	const followBtn = (authorId: number) => {
		if (!currentUser || currentUser.id === authorId) return null;

		// Look up the profile bundle state from provider
		const targetProfile = profilesMap[authorId]?.profile;
		const isFollowing = targetProfile ? targetProfile.isFollowedByMe : false;

		return (
			<FollowButton
				authorId={targetProfile?.id ?? authorId}
				currentUserId={currentUser.id}
				isFollowing={isFollowing}
				onToggle={() => toggleFollowUser(authorId)}
			/>
		);
	};

	return (
		<div>
			{/* <SideBar items={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /> */}

			<main className="flex flex-col">
				<FeedToggle mode={feedMode} onChange={setFeedMode} />

				<div className="mt-6">
					{/* Photos grid */}
					<div className={feedMode === 'photos' ? '' : 'hidden'}>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{(photoScroll.visibleItems as Photo[]).map((photo) => (
								<div key={photo.id} className="relative">
									<PhotoCard
										photo={photo}
										onLike={toggleLikePhoto}
										onClickPhoto={(p) => setActivePhoto(p)}
										onClickAuthor={(id) => navigate(`/profile/${id}`)}
									/>
									<div className="absolute top-3 right-3">{followBtn(photo.author.id)}</div>
								</div>
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
								<div key={album.id} className="relative">
									<AlbumCard
										album={album}
										onLike={toggleLikeAlbum}
										onClickAlbum={(a) => setActiveAlbum(a)}
										onClickAuthor={(id) => navigate(`/profile/${id}`)}
									/>
									<div className="absolute top-3 right-3">{followBtn(album.author.id)}</div>
								</div>
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

			{/* <div className="hidden xl:block min-w-[13%] shrink-0 bg-gray-100" /> */}
		</div>
	);
};
