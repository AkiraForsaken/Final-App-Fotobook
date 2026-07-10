import type { UserProfile, FollowRelation } from './user.js';
import type { Photo } from './photo.js';
import type { Album } from './album.js';

// The hydrated, per-user bundle the frontend's useProfile hook works with.
// This is an internal shape assembled by the frontend from several GET
// responses — it never crosses the wire as-is, so it stays a plain
// TypeScript type rather than a Zod schema (nothing to validate at a
// boundary).
export interface UserProfileData {
	profile: UserProfile;
	following: FollowRelation[];
	followers: FollowRelation[];
	publicPhotos: Photo[];
	publicAlbums: Album[];
	ownerPhotos: Photo[];
	ownerAlbums: Album[];
}

/**
 * NOTE — mock-era transitional type.
 * `RawProfileEntry`/`RawProfiles` mirror the current mock `GET /api/profiles`
 * response: one big object keyed by user id, embedding photos/albums/follow
 * lists all at once. Once the backend moves to Prisma-backed, per-resource
 * REST endpoints (`GET /api/users/:id`, `GET /api/users/:id/photos`, etc.
 * per the RESTful-naming best practice), this single blob goes away and
 * `useProfile`'s `buildHydratedProfiles` helper gets replaced by several
 * smaller fetches. Keeping it here for now so the mock backend and frontend
 * both compile against one definition during the transition.
 */
export interface RawProfileEntry {
	profile: UserProfile;
	following?: FollowRelation[];
	followers?: FollowRelation[];
	publicPhotos?: Photo[];
	publicAlbums?: Album[];
	ownerPhotos?: Photo[];
	ownerAlbums?: Album[];
}

export type RawProfiles = Record<number, RawProfileEntry>;
