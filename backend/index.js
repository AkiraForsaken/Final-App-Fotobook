const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
// Add Body Parsing
app.use(express.json());

const DATA_DIR = path.join(__dirname, "mock-data");

// Json Helpers
function readJson(name) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(name, data) {
  const p = path.join(DATA_DIR, name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const users = readJson("users.json") || [];

  const userAuth = users.find(
    (u) => u.email === email.toLowerCase() && u.password === password,
  );

  if (!userAuth) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  // Look up the user's profile data
  const profiles = readJson("profiles.json") || {};
  const userProfileData = profiles[userAuth.id]?.profile || {};

  // Construct the full user object
  const user = {
    id: userAuth.id,
    email: userAuth.email,
    firstName: userProfileData.firstName || "Unknown",
    lastName: userProfileData.lastName || "User",
    avatarUrl: userProfileData.avatarUrl,
    isActive: true,
    isAdmin: false,
    createdAt: userProfileData.createdAt || new Date().toISOString(),
  };

  res.json({ user });
});

app.post("/api/auth/signup", (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const users = readJson("users.json") || [];

  // Check for existing email
  if (users.some((u) => u.email === email.toLowerCase())) {
    return res.status(400).json({ error: "Email already in use" });
  }

  // Generate a unique ID
  const newId = Date.now();

  // Save credentials
  users.push({ id: newId, email: email.toLowerCase(), password });
  writeJson("users.json", users);

  // Initialize a blank profile in profiles.json
  const profiles = readJson("profiles.json") || {};
  profiles[newId] = {
    profile: {
      id: newId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatarUrl: undefined,
      publicPhotoCount: 3,
      publicAlbumCount: 1,
      followerCount: 0,
      followingCount: 0,
      isFollowedByMe: false,
    },
    following: [],
    followers: [],
    publicPhotos: [],
    publicAlbums: [],
    ownerPhotos: [],
    ownerAlbums: [],
  };
  writeJson("profiles.json", profiles);

  // Return the newly created User object
  const newUser = {
    id: newId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase(),
    avatarUrl: undefined,
    isActive: true,
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };

  res.status(201).json({ user: newUser });
});

app.get("/api/feed/photos", (req, res) => {
  const data = readJson("feed_photos.json") || [];
  res.json(data);
});

app.get("/api/feed/albums", (req, res) => {
  const data = readJson("feed_albums.json") || [];
  res.json(data);
});

app.get("/api/discovery/photos", (req, res) => {
  const data = readJson("discovery_photos.json") || [];
  res.json(data);
});

app.get("/api/discovery/albums", (req, res) => {
  const data = readJson("discovery_albums.json") || [];
  res.json(data);
});

app.get("/api/profiles", (req, res) => {
  const data = readJson("profiles.json") || [];
  res.json(data);
});

// POST /api/photos  — create a new photo
app.post("/api/photos", (req, res) => {
  const { title, description, sharingMode, authorId } = req.body;

  if (!title || !description || !sharingMode || !authorId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const profiles = readJson("profiles.json") || {};
  const profileEntry = profiles[authorId];
  if (!profileEntry) {
    return res.status(404).json({ error: "Author profile not found." });
  }

  const newPhoto = {
    id: Date.now(),
    title,
    description,
    // Placeholder image — replaced by real upload URL in the real backend
    imageUrl: `https://picsum.photos/seed/${Date.now()}/600/600`,
    sharingMode,
    likesCount: 0,
    likedByMe: false,
    author: {
      id: profileEntry.profile.id,
      firstName: profileEntry.profile.firstName,
      lastName: profileEntry.profile.lastName,
      avatarUrl: profileEntry.profile.avatarUrl,
    },
    createdAt: new Date().toISOString(),
  };

  // Add to ownerPhotos (always visible to owner)
  profileEntry.ownerPhotos = [newPhoto, ...(profileEntry.ownerPhotos || [])];

  // If public, also add to publicPhotos and feed
  if (sharingMode === "public") {
    profileEntry.publicPhotos = [
      newPhoto,
      ...(profileEntry.publicPhotos || []),
    ];
    profileEntry.profile.publicPhotoCount =
      (profileEntry.profile.publicPhotoCount || 0) + 1;

    const feedPhotos = readJson("feed_photos.json") || [];
    feedPhotos.unshift(newPhoto);
    writeJson("feed_photos.json", feedPhotos);

    const discoveryPhotos = readJson("discovery_photos.json") || [];
    discoveryPhotos.unshift(newPhoto);
    writeJson("discovery_photos.json", discoveryPhotos);
  }

  profiles[authorId] = profileEntry;
  writeJson("profiles.json", profiles);

  res.status(201).json(newPhoto);
});

// PUT /api/photos/:id  — update an existing photo
app.put("/api/photos/:id", (req, res) => {
  const photoId = parseInt(req.params.id, 10);
  const { title, description, sharingMode, authorId } = req.body;

  if (!title || !description || !sharingMode || !authorId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const profiles = readJson("profiles.json") || {};
  const profileEntry = profiles[authorId];
  if (!profileEntry) {
    return res.status(404).json({ error: "Author profile not found." });
  }

  // Find the photo in ownerPhotos
  const photoIndex = (profileEntry.ownerPhotos || []).findIndex(
    (p) => p.id === photoId,
  );
  if (photoIndex === -1) {
    return res.status(404).json({ error: "Photo not found." });
  }

  const existingPhoto = profileEntry.ownerPhotos[photoIndex];
  const wasPublic = existingPhoto.sharingMode === "public";
  const nowPublic = sharingMode === "public";

  const updatedPhoto = { ...existingPhoto, title, description, sharingMode };
  profileEntry.ownerPhotos[photoIndex] = updatedPhoto;

  // Sync publicPhotos
  profileEntry.publicPhotos = (profileEntry.publicPhotos || []).filter(
    (p) => p.id !== photoId,
  );
  if (nowPublic) {
    profileEntry.publicPhotos.unshift(updatedPhoto);
  }

  // Sync publicPhotoCount
  if (wasPublic && !nowPublic) {
    profileEntry.profile.publicPhotoCount = Math.max(
      0,
      (profileEntry.profile.publicPhotoCount || 1) - 1,
    );
  } else if (!wasPublic && nowPublic) {
    profileEntry.profile.publicPhotoCount =
      (profileEntry.profile.publicPhotoCount || 0) + 1;
  }

  // Sync feed & discovery
  for (const file of ["feed_photos.json", "discovery_photos.json"]) {
    const list = readJson(file) || [];
    const idx = list.findIndex((p) => p.id === photoId);
    if (nowPublic) {
      if (idx !== -1) list[idx] = updatedPhoto;
      else list.unshift(updatedPhoto);
    } else {
      if (idx !== -1) list.splice(idx, 1);
    }
    writeJson(file, list);
  }

  profiles[authorId] = profileEntry;
  writeJson("profiles.json", profiles);

  res.json(updatedPhoto);
});

// DELETE /api/photos/:id
app.delete("/api/photos/:id", (req, res) => {
  const photoId = parseInt(req.params.id, 10);
  const { authorId } = req.body;

  if (!authorId) {
    return res.status(400).json({ error: "Missing authorId." });
  }

  const profiles = readJson("profiles.json") || {};
  const profileEntry = profiles[authorId];
  if (!profileEntry) {
    return res.status(404).json({ error: "Author profile not found." });
  }

  const before = (profileEntry.ownerPhotos || []).find((p) => p.id === photoId);
  if (!before) {
    return res.status(404).json({ error: "Photo not found." });
  }

  profileEntry.ownerPhotos = (profileEntry.ownerPhotos || []).filter(
    (p) => p.id !== photoId,
  );
  profileEntry.publicPhotos = (profileEntry.publicPhotos || []).filter(
    (p) => p.id !== photoId,
  );

  if (before.sharingMode === "public") {
    profileEntry.profile.publicPhotoCount = Math.max(
      0,
      (profileEntry.profile.publicPhotoCount || 1) - 1,
    );
    for (const file of ["feed_photos.json", "discovery_photos.json"]) {
      const list = (readJson(file) || []).filter((p) => p.id !== photoId);
      writeJson(file, list);
    }
  }

  profiles[authorId] = profileEntry;
  writeJson("profiles.json", profiles);

  res.status(204).send();
});

// POST /api/albums  — create a new album
app.post("/api/albums", (req, res) => {
  const { title, description, sharingMode, authorId } = req.body;

  if (!title || !description || !sharingMode || !authorId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const profiles = readJson("profiles.json") || {};
  const profileEntry = profiles[authorId];
  if (!profileEntry) {
    return res.status(404).json({ error: "Author profile not found." });
  }

  const seed = Date.now();
  const newAlbum = {
    id: seed,
    title,
    description,
    coverImageUrl: `https://picsum.photos/seed/${seed}/600/600`,
    imageUrls: [
      `https://picsum.photos/seed/${seed}a/400/400`,
      `https://picsum.photos/seed/${seed}b/400/400`,
    ],
    sharingMode,
    likesCount: 0,
    likedByMe: false,
    author: {
      id: profileEntry.profile.id,
      firstName: profileEntry.profile.firstName,
      lastName: profileEntry.profile.lastName,
      avatarUrl: profileEntry.profile.avatarUrl,
    },
    createdAt: new Date().toISOString(),
  };

  profileEntry.ownerAlbums = [newAlbum, ...(profileEntry.ownerAlbums || [])];

  if (sharingMode === "public") {
    profileEntry.publicAlbums = [
      newAlbum,
      ...(profileEntry.publicAlbums || []),
    ];
    profileEntry.profile.publicAlbumCount =
      (profileEntry.profile.publicAlbumCount || 0) + 1;

    const feedAlbums = readJson("feed_albums.json") || [];
    feedAlbums.unshift(newAlbum);
    writeJson("feed_albums.json", feedAlbums);

    const discoveryAlbums = readJson("discovery_albums.json") || [];
    discoveryAlbums.unshift(newAlbum);
    writeJson("discovery_albums.json", discoveryAlbums);
  }

  profiles[authorId] = profileEntry;
  writeJson("profiles.json", profiles);

  res.status(201).json(newAlbum);
});

// PUT /api/albums/:id  — update an existing album
app.put("/api/albums/:id", (req, res) => {
  const albumId = parseInt(req.params.id, 10);
  const { title, description, sharingMode, authorId } = req.body;

  if (!title || !description || !sharingMode || !authorId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const profiles = readJson("profiles.json") || {};
  const profileEntry = profiles[authorId];
  if (!profileEntry) {
    return res.status(404).json({ error: "Author profile not found." });
  }

  const albumIndex = (profileEntry.ownerAlbums || []).findIndex(
    (a) => a.id === albumId,
  );
  if (albumIndex === -1) {
    return res.status(404).json({ error: "Album not found." });
  }

  const existingAlbum = profileEntry.ownerAlbums[albumIndex];
  const wasPublic = existingAlbum.sharingMode === "public";
  const nowPublic = sharingMode === "public";

  const updatedAlbum = { ...existingAlbum, title, description, sharingMode };
  profileEntry.ownerAlbums[albumIndex] = updatedAlbum;

  profileEntry.publicAlbums = (profileEntry.publicAlbums || []).filter(
    (a) => a.id !== albumId,
  );
  if (nowPublic) {
    profileEntry.publicAlbums.unshift(updatedAlbum);
  }

  if (wasPublic && !nowPublic) {
    profileEntry.profile.publicAlbumCount = Math.max(
      0,
      (profileEntry.profile.publicAlbumCount || 1) - 1,
    );
  } else if (!wasPublic && nowPublic) {
    profileEntry.profile.publicAlbumCount =
      (profileEntry.profile.publicAlbumCount || 0) + 1;
  }

  for (const file of ["feed_albums.json", "discovery_albums.json"]) {
    const list = readJson(file) || [];
    const idx = list.findIndex((a) => a.id === albumId);
    if (nowPublic) {
      if (idx !== -1) list[idx] = updatedAlbum;
      else list.unshift(updatedAlbum);
    } else {
      if (idx !== -1) list.splice(idx, 1);
    }
    writeJson(file, list);
  }

  profiles[authorId] = profileEntry;
  writeJson("profiles.json", profiles);

  res.json(updatedAlbum);
});

// DELETE /api/albums/:id
app.delete("/api/albums/:id", (req, res) => {
  const albumId = parseInt(req.params.id, 10);
  const { authorId } = req.body;

  if (!authorId) {
    return res.status(400).json({ error: "Missing authorId." });
  }

  const profiles = readJson("profiles.json") || {};
  const profileEntry = profiles[authorId];
  if (!profileEntry) {
    return res.status(404).json({ error: "Author profile not found." });
  }

  const before = (profileEntry.ownerAlbums || []).find((a) => a.id === albumId);
  if (!before) {
    return res.status(404).json({ error: "Album not found." });
  }

  profileEntry.ownerAlbums = (profileEntry.ownerAlbums || []).filter(
    (a) => a.id !== albumId,
  );
  profileEntry.publicAlbums = (profileEntry.publicAlbums || []).filter(
    (a) => a.id !== albumId,
  );

  if (before.sharingMode === "public") {
    profileEntry.profile.publicAlbumCount = Math.max(
      0,
      (profileEntry.profile.publicAlbumCount || 1) - 1,
    );
    for (const file of ["feed_albums.json", "discovery_albums.json"]) {
      const list = (readJson(file) || []).filter((a) => a.id !== albumId);
      writeJson(file, list);
    }
  }

  profiles[authorId] = profileEntry;
  writeJson("profiles.json", profiles);

  res.status(204).send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
