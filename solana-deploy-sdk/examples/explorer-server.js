#!/usr/bin/env node

// Server for the Solana Contract Explorer
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { deploy, loadKeypair, invokeProgram } = require('../index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'contract-explorer.html'));
});

// API Endpoint to deploy a program
app.post('/api/deploy', async (req, res) => {
  try {
    const { programPath, network, keypairPath } = req.body;

    console.log(`Deploying program at ${programPath} to ${network}...`);

    // Deploy the program
    const result = await deploy(programPath, {
      network,
      keypairPath: path.resolve(keypairPath),
      verbose: true
    });

    console.log('Deployment result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error deploying program:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API Endpoint to invoke a program
app.post('/api/invoke', async (req, res) => {
  try {
    const { programId, network, keypairPath } = req.body;

    console.log(`Invoking program ${programId} on ${network}...`);

    // Load the keypair
    const keypair = loadKeypair(path.resolve(keypairPath));

    // Invoke the program
    const result = await invokeProgram(programId, keypair, network);

    console.log('Invocation result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error invoking program:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Solana Contract Explorer server running at http://localhost:${PORT}`);
  console.log(`Open this URL in your browser to interact with your contracts.`);
  console.log(`Make sure your Solana contracts are compiled before deploying.`);
});