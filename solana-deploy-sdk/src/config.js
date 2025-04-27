// Configuration for the Solana Deploy SDK
const path = require('path');
require('dotenv').config();

/**
 * Network configurations for Solana clusters
 */
const networks = {
  localhost: {
    url: 'http://localhost:8899',
    label: 'Localhost'
  },
  devnet: {
    url: 'https://api.devnet.solana.com',
    label: 'Devnet'
  },
  testnet: {
    url: 'https://api.testnet.solana.com',
    label: 'Testnet'
  },
  'mainnet-beta': {
    url: 'https://api.mainnet-beta.solana.com',
    label: 'Mainnet Beta'
  }
};

/**
 * Error codes for the SDK
 */
const errorCodes = {
  E101: 'Solana CLI not found. Please install Solana CLI.',
  E102: 'Rust not found. Please install Rust and Cargo.',
  E103: 'Cargo build-sbf command failed.',
  E104: 'Deployment failed.',
  E105: 'Invalid network specified.',
  E106: 'Invalid keypair file.',
  E107: 'Failed to extract program ID.',
  E108: 'Invalid program file path.'
};

/**
 * Default configuration
 */
const defaultConfig = {
  network: process.env.SOLANA_NETWORK || 'devnet',
  keypairPath: process.env.SOLANA_KEYPAIR_PATH || path.join(require('os').homedir(), '.config/solana/id.json'),
  buildOutputDir: 'target/deploy',
  defaultTimeout: 60000, // 1 minute
};

/**
 * Validate that required tools are installed
 */
const requiredTools = {
  solana: 'solana --version',
  rust: 'rustc --version',
  cargo: 'cargo --version'
};

module.exports = {
  networks,
  errorCodes,
  defaultConfig,
  requiredTools
};