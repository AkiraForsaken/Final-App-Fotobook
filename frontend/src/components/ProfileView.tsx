import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Button } from './myUI/Button';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { PhotoThumb } from './PhotoThumb';
import { AlbumThumb } from './AlbumThumb';
import { FollowCard } from './FollowCard';
import { PhotoModal } from './PhotoModal';
import { AlbumModal } from './AlbumModal';
import type { UserProfile, Photo, Album, FollowRelation, ProfileTab, User } from '../types/index';
import { APP_ROUTE, routeUtils } from '../utils/routes';
import type { usePaginatedContent } from '../hooks/usePaginatedContent';

// The exact shape each tab's usePaginatedContent() call returns
type PaginatedSlice<T extends { id: number }> = ReturnType<typeof usePaginatedContent<T>>;

interface ProfileViewProps {
	profile: UserProfile;
	photos: PaginatedSlice<Photo>;
	albums: PaginatedSlice<Album>;
	following: PaginatedSlice<FollowRelation>;
	followers: PaginatedSlice<FollowRelation>;
	currentUser: User | null;
	isOwner?: boolean;
	onFollowToggle?: (userId: number) => void;
}

const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
	<div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
		<i className="fa-regular fa-folder-open text-4xl" />
		<p className="text-lg">{message}</p>
		{action}
	</div>
);

// Lightweight infinite-scroll footer shared by every tab — shows a spinner
// while the next page loads, renders nothing once there's nothing left.
const LoadMoreFooter = ({
	sentinelRef,
	loadingMore,
}: {
	sentinelRef: (node: HTMLDivElement | null) => void;
	loadingMore: boolean;
}) => (
	<div ref={sentinelRef} className="flex justify-center py-6">
		{loadingMore && <i className="fa-solid fa-spinner fa-spin text-text-muted" />}
	</div>
);

export const ProfileView = ({
	profile,
	photos,
	albums,
	following,
	followers,
	currentUser,
	isOwner = false,
	onFollowToggle,
}: ProfileViewProps) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const rawTab = searchParams.get('tab') ?? 'photos';
	const activeTab = (
		['photos', 'albums', 'following', 'followers'].includes(rawTab) ? rawTab : 'photos'
	) as ProfileTab;

	const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
	const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

	// ── Tab contents ───────────────────────────────────────────────────────

	const photoGrid = (
		<>
			{isOwner && (
				<div className="mb-4 flex justify-end">
					<Button onClick={() => navigate(APP_ROUTE.ADD_PHOTO)}>
						<i className="fa-solid fa-plus" />
						Add Photo
					</Button>
				</div>
			)}
			{photos.items.length === 0 && !photos.loading ? (
				<EmptyState
					message="No photos yet."
					action={
						isOwner ? (
							<Button onClick={() => navigate(APP_ROUTE.ADD_PHOTO)} className="hover:underline">
								Upload your first photo
							</Button>
						) : undefined
					}
				/>
			) : (
				<>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
						{photos.items.map((photo) => (
							<PhotoThumb
								key={photo.id}
								photo={photo}
								isOwner={isOwner}
								onOpen={(p) => setActivePhoto(p)}
								onEdit={isOwner ? (p) => navigate(routeUtils.getEditPhoto(p.id)) : undefined}
							/>
						))}
					</div>
					<LoadMoreFooter sentinelRef={photos.sentinelRef} loadingMore={photos.loadingMore} />
				</>
			)}
		</>
	);

	const albumGrid = (
		<>
			{isOwner && (
				<div className="mb-4 flex justify-end">
					<Button onClick={() => navigate(APP_ROUTE.ADD_ALBUM)}>
						<i className="fa-solid fa-plus" />
						Add Album
					</Button>
				</div>
			)}
			{albums.items.length === 0 && !albums.loading ? (
				<EmptyState
					message="No albums yet."
					action={
						isOwner ? (
							<Button onClick={() => navigate(APP_ROUTE.ADD_ALBUM)} className="hover:underline">
								Create your first album
							</Button>
						) : undefined
					}
				/>
			) : (
				<>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
						{albums.items.map((album) => (
							<AlbumThumb
								key={album.id}
								album={album}
								isOwner={isOwner}
								onOpen={(a) => setActiveAlbum(a)}
								onEdit={isOwner ? (a) => navigate(routeUtils.getEditAlbum(a.id)) : undefined}
							/>
						))}
					</div>
					<LoadMoreFooter sentinelRef={albums.sentinelRef} loadingMore={albums.loadingMore} />
				</>
			)}
		</>
	);

	const followList = (slice: PaginatedSlice<FollowRelation>, emptyMessage: string) =>
		slice.items.length === 0 && !slice.loading ? (
			<EmptyState message={emptyMessage} />
		) : (
			<>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
					{slice.items.map((user) => (
						<FollowCard
							key={user.id}
							user={user}
							currentUserId={currentUser?.id}
							onFollowToggle={() => onFollowToggle?.(user.id)}
						/>
					))}
				</div>
				<LoadMoreFooter sentinelRef={slice.sentinelRef} loadingMore={slice.loadingMore} />
			</>
		);

	return (
		<div className="w-full mx-auto">
			<ProfileHeader
				profile={profile}
				isOwner={isOwner}
				currentUserId={currentUser?.id}
				isFollowing={profile.isFollowedByMe}
				onFollowToggle={() => onFollowToggle?.(profile.id)}
				onEditProfile={() => navigate(APP_ROUTE.EDIT_PROFILE)}
			/>

			<div className="mt-6">
				<ProfileTabs activeTab={activeTab} />
				<div className="mt-4">
					{activeTab === 'photos' && photoGrid}
					{activeTab === 'albums' && albumGrid}
					{activeTab === 'following' && followList(following, 'Not following anyone yet.')}
					{activeTab === 'followers' && followList(followers, 'No followers yet.')}
				</div>
			</div>

			<PhotoModal photo={activePhoto} onClose={() => setActivePhoto(null)} />
			<AlbumModal album={activeAlbum} onClose={() => setActiveAlbum(null)} />
		</div>
	);
};
