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
      isFollowedByMe: false,
      followerCount: 0,
      followingCount: 0,
    },
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
