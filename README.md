# Fotobook — Frontend

Vite + React (TypeScript) frontend for the Fotobook photo-sharing app.

## Setup

```bash
npm create vite@latest fotobook -- --template react-ts
cd fotobook
npm install
npm run dev
```

Then copy the `src/` folder from this package into your Vite project's `src/`.

## Component map

```
src/
├── types/
│   └── index.ts          # Shared types: User, Photo, Album, FeedMode
│
├── components/
│   ├── myUI/               # Primitive / reusable UI
│   │   ├── Button.tsx       variant, size props
│   │   ├── SearchBar.tsx    search input with icon
│   │   ├── Avatar.tsx       image or initials fallback
│   │   └── FeedToggle.tsx   Photos / Albums switcher
│   │
│   ├── TopBar.tsx       sticky nav: logo, search, user, logout
│   ├── SideBar.tsx      desktop left rail + mobile drawer
│   ├── PhotoCard.tsx    single photo post card
│   └── AlbumCard.tsx    album post card (with image count badge)
│
├── pages/
│   └── Feeds.tsx     # Feeds page — wires all components together
│                           (contains mock data; swap for API calls)
│
└── App.tsx               # Root — swap for react-router later
```

---

## What's next

### Pages to build
- `DiscoveryPage` — same layout as Feeds but shows all public posts + follow/unfollow
- `PublicProfilePage` — tabs: Photos, Albums, Followings, Followers
- `MyProfilePage` — same + Edit, Add Photo/Album buttons
- `NewPhotoPage` / `EditPhotoPage`
- `NewAlbumPage` / `EditAlbumPage`
- `EditProfilePage`
- Admin pages: `ManagePhotosPage`, `ManageAlbumsPage`, `ManageUsersPage`

### Components to build next
- `PhotoModal` — popup viewer for a single photo (Bootstrap modal or headless)
- `AlbumModal` — carousel viewer for album images (left/right arrows)
- `FollowButton` — follow/unfollow toggle
- `NotificationBell` — notification dropdown in TopBar
- `Pagination` / infinite scroll sentinel