const express = require('express');
const cors = require('cors');
const { analyzeCode } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Complexity Analyzer' });
});

// Complexity analysis endpoint
app.post('/api/analyze', (req, res) => {
  const { code, mode = 'cpp', targetFunction = null } = req.body;

  if (typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: "code" must be a string.'
    });
  }

  if (mode !== 'cpp' && mode !== 'pseudocode') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: "mode" must be either "cpp" or "pseudocode".'
    });
  }

  const result = analyzeCode(code, mode, targetFunction);
  res.json(result);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Complexity Analyzer API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
