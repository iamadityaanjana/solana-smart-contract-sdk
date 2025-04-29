# solana-smart-contract-sdk

A toolkit for building, deploying, and testing Solana smart contracts.

## Project Components

### solana-deploy-sdk

The `solana-deploy-sdk` is a Node.js toolkit that simplifies the process of building and deploying Rust-based Solana smart contracts.

**Key features:**
- Automated Rust compilation for Solana programs
- Easy deployment to multiple networks (localhost, devnet, testnet, mainnet-beta)
- Program invocation for testing and verification
- Environment validation and keypair management
- Comprehensive CLI for quick deployments

### add-numbers

A simple Solana program written in Rust that adds two predefined numbers:
- Demonstrates the basic structure of a Solana program
- Contains a simple operation (adding 5 + 7)
- Outputs the numbers and their sum to the program logs
- Built and deployed using the solana-deploy-sdk

### test

Test suite for the solana-deploy-sdk, containing scripts to verify:
- Building Solana programs
- Deploying contracts to Solana networks
- Invoking deployed smart contracts
- Full end-to-end testing of the build-deploy-invoke workflow

## Getting Started

To use this toolkit, ensure you have the following prerequisites:
- Solana CLI Tools
- Rust and Cargo
- Node.js (v14 or higher)

Refer to the documentation in each component for detailed usage instructions.
