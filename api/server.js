const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store. The demo only needs the most recent reading, so no database.
let latest = {
  status: 'Normal',
  waterLevel: 0,
  updatedAt: null,
};

// Edge nodes post telemetry here.
app.post('/api/telemetry', (req, res) => {
  const { status, waterLevel } = req.body;

  latest = {
    status,
    waterLevel,
    updatedAt: new Date().toISOString(),
  };

  console.log(`[API] received status="${status}" waterLevel=${waterLevel}cm`);
  res.json(latest);
});

// Dashboard polls this endpoint.
app.get('/api/status', (req, res) => {
  res.json(latest);
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`[API] listening on port ${PORT}`));
