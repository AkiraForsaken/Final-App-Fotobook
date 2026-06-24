const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const DATA_DIR = path.join(__dirname, 'mock-data');

function readJson(name) {
	const p = path.join(DATA_DIR, name);
	if (!fs.existsSync(p)) return null;
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

app.get('/api/feed/photos', (req, res) => {
	const data = readJson('feed_photos.json') || [];
	res.json(data);
});

app.get('/api/feed/albums', (req, res) => {
	const data = readJson('feed_albums.json') || [];
	res.json(data);
});

app.get('/api/discovery/photos', (req, res) => {
	const data = readJson('discovery_photos.json') || [];
	res.json(data);
});

app.get('/api/discovery/albums', (req, res) => {
	const data = readJson('discovery_albums.json') || [];
	res.json(data);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Mock API server running on http://localhost:${PORT}`);
});
