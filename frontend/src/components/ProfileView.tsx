import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { PhotoThumb } from './PhotoThumb';
import { AlbumThumb } from './AlbumThumb';
import { FollowCard } from './FollowCard';
import { PhotoModal } from './PhotoModal';
import { AlbumModal } from './AlbumModal';
import type { UserProfile, Photo, Album, FollowRelation, ProfileTab, User, UserProfileData } from '../types/index';

interface ProfileViewProps {
	profile: UserProfile;
	photos: Photo[];
	albums: Album[];
	following: FollowRelation[];
	followers: FollowRelation[];
	profilesMap?: Record<number, UserProfileData>;
	currentUser: User | null;
	isOwner?: boolean;
	onFollowToggle?: (userId: number) => void;
}

const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
	<div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
		<i className="fa-regular fa-folder-open text-4xl" />
		<p className="text-sm">{message}</p>
		{action}
	</div>
);

export const ProfileView = ({
	profile,
	photos,
	albums,
	following,
	followers,
	profilesMap = {},
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
					<button
						onClick={() => navigate('/photos/new')}
						className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-700 transition-colors"
					>
						<i className="fa-solid fa-plus" />
						Add Photo
					</button>
				</div>
			)}
			{photos.length === 0 ? (
				<EmptyState
					message="No photos yet."
					action={
						isOwner ? (
							<button
								onClick={() => navigate('/photos/new')}
								className="text-sm text-blue-700 hover:underline"
							>
								Upload your first photo
							</button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
					{photos.map((photo) => (
						<PhotoThumb
							key={photo.id}
							photo={photo}
							isOwner={isOwner}
							onOpen={(p) => setActivePhoto(p)}
							onEdit={isOwner ? (p) => navigate(`/photos/${p.id}/edit`) : undefined}
						/>
					))}
				</div>
			)}
		</>
	);

	const albumGrid = (
		<>
			{isOwner && (
				<div className="mb-4 flex justify-end">
					<button
						onClick={() => navigate('/albums/new')}
						className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-700 transition-colors"
					>
						<i className="fa-solid fa-plus" />
						Add Album
					</button>
				</div>
			)}
			{albums.length === 0 ? (
				<EmptyState
					message="No albums yet."
					action={
						isOwner ? (
							<button
								onClick={() => navigate('/albums/new')}
								className="text-sm text-blue-700 hover:underline"
							>
								Create your first album →
							</button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
					{albums.map((album) => (
						<AlbumThumb
							key={album.id}
							album={album}
							isOwner={isOwner}
							onOpen={(a) => setActiveAlbum(a)}
							onEdit={isOwner ? (a) => navigate(`/albums/${a.id}/edit`) : undefined}
						/>
					))}
				</div>
			)}
		</>
	);

	const followList = (users: FollowRelation[], emptyMessage: string) =>
		users.length === 0 ? (
			<EmptyState message={emptyMessage} />
		) : (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2">
				{users.map((user) => {
					const liveIsFollowing =
						profilesMap[user.id]?.profile.isFollowedByMe ?? user.isFollowedByMe;
					return (
						<FollowCard
							key={user.id}
							user={user}
							currentUserId={currentUser?.id}
							isFollowing={liveIsFollowing}
							onFollowToggle={() => onFollowToggle?.(user.id)}
						/>
					);
				})}
			</div>
		);

	return (
		<div className="w-full mx-auto">
			<ProfileHeader
				profile={profile}
				isOwner={isOwner}
				currentUserId={currentUser?.id}
				isFollowing={profile.isFollowedByMe}
				onFollowToggle={() => onFollowToggle?.(profile.id)}
				onEditProfile={() => navigate('/my-profile/edit')}
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
