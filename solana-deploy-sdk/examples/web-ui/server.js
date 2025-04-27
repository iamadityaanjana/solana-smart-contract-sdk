// Express server for Solana Deploy Web UI
const express = require('express');
const path = require('path');
const fs = require('fs');
const { buildContract, deploy, validateEnvironment, getConnection } = require('../../index');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/check-environment', async (req, res) => {
  try {
    const isValid = await validateEnvironment();
    res.json({ success: true, isValid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/build', async (req, res) => {
  try {
    const { programDir, verbose } = req.body;
    
    if (!programDir) {
      return res.status(400).json({ success: false, error: 'Program directory is required' });
    }
    
    const result = await buildContract(programDir, { verbose: verbose || false });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/deploy', async (req, res) => {
  try {
    const { programPath, network, keypairPath, verbose } = req.body;
    
    if (!programPath) {
      return res.status(400).json({ success: false, error: 'Program path is required' });
    }
    
    const result = await deploy(programPath, {
      network: network || 'devnet',
      keypairPath,
      verbose: verbose || false
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/networks', (req, res) => {
  try {
    const { networks } = require('../../src/config');
    res.json({ success: true, networks: Object.keys(networks) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Solana Deploy Web UI server listening at http://localhost:${port}`);
});