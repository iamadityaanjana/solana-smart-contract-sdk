// Main entry point for the Solana Deploy SDK
const { buildContract, validateEnvironment } = require('./src/builder');
const { deploy, loadKeypair, getConnection, getBalance, invokeProgram, getExplorerUrl } = require('./src/deployer');
const { networks, errorCodes, defaultConfig } = require('./src/config');

// Export all functionality
module.exports = {
  // Building functionality
  buildContract,
  validateEnvironment,
  
  // Deployment functionality
  deploy,
  loadKeypair,
  getConnection,
  getBalance,
  invokeProgram,
  getExplorerUrl,
  
  // Configuration
  networks,
  errorCodes,
  defaultConfig
};