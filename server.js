const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from the project root
app.use(express.static(path.join(__dirname)));

// Root route: send the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTMLtest.html'));
});

// Data file for persistence
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load subscriptions (2D array) from file on startup
let subscriptions = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    subscriptions = JSON.parse(raw || '[]');
    if (!Array.isArray(subscriptions)) subscriptions = [];
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(subscriptions, null, 2));
  }
} catch (err) {
  console.error('Failed to load subscriptions:', err);
  subscriptions = [];
}

function persist() {
  try {
    fs.writeFile(DATA_FILE, JSON.stringify(subscriptions, null, 2), (err) => {
      if (err) console.error('Failed to save subscriptions:', err);
    });
  } catch (err) {
    console.error('Persist error:', err);
  }
}

// Get all subscriptions
app.get('/api/subscriptions', (req, res) => {
  res.json(subscriptions);
});

// Add a subscription (expects JSON { name, cost, category, nextRenewal })
app.post('/api/subscriptions', (req, res) => {
  const { name, cost, category, nextRenewal } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const row = [name, cost ?? null, category ?? null, nextRenewal ?? null];
  subscriptions.push(row);
  persist();
  res.status(201).json(row);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
