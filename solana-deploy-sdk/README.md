# Solana Deploy SDK

A Node.js SDK for building and deploying Rust-based Solana smart contracts with ease.

## Features

- ✅ Automated Rust compilation for Solana programs
- ✅ Easy deployment to Solana networks (localhost, devnet, testnet, mainnet-beta)
- ✅ Program invocation to test and verify your contracts
- ✅ Environment validation for required tools
- ✅ Keypair management for secure deployments
- ✅ Command-line interface for quick deployment

## Prerequisites

Before using this SDK, ensure you have the following installed:

- [Solana CLI Tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v14 or higher)

## Installation

```bash
# Install locally in your project
npm install solana-deploy-sdk

# Or install globally to use CLI
npm install -g solana-deploy-sdk
```

## Using the SDK in JavaScript

```javascript
// Import the SDK
const { buildContract, deploy, invokeProgram, loadKeypair } = require('solana-deploy-sdk');

// Build a Rust program
const buildResult = await buildContract('./my-program');
if (buildResult.success) {
  console.log(`Program built at: ${buildResult.programPath}`);
  
  // Deploy the program
  const deployResult = await deploy(buildResult.programPath, {
    network: 'devnet', // Options: 'localhost', 'devnet', 'testnet', 'mainnet-beta'
    keypairPath: '/path/to/keypair.json', // Optional: Default is ~/.config/solana/id.json
    verbose: true // Optional: Show detailed output
  });
  
  if (deployResult.success) {
    console.log(`Program deployed with ID: ${deployResult.programId}`);
    
    // Invoke the program to see its output
    const keypair = loadKeypair('/path/to/keypair.json');
    const invokeResult = await invokeProgram(deployResult.programId, keypair, 'devnet');
    
    if (invokeResult.success) {
      console.log(`Program invoked successfully!`);
      console.log(`View on Explorer: ${invokeResult.explorerUrl}`);
      
      // Display program logs
      invokeResult.logs.forEach(log => {
        if (log.includes('Program log:')) {
          console.log(log);
        }
      });
    }
  }
}
```

## Environment Variables

You can configure the SDK using environment variables in a .env file:

```
SOLANA_NETWORK=devnet
SOLANA_KEYPAIR_PATH=/path/to/your/keypair.json
```

## Using the CLI

The SDK comes with a CLI for quick deployment:

```bash
# Check environment
solana-deploy check-environment

# Build a program
solana-deploy build ./my-program

# Deploy a program
solana-deploy deploy ./target/deploy/my_program.so --network devnet

# Invoke a deployed program
solana-deploy invoke <PROGRAM_ID> --network devnet

# Build and deploy in one step
solana-deploy build-and-deploy ./my-program --network devnet

# Build, deploy, and invoke in one step
solana-deploy build-deploy-invoke ./my-program --network devnet
```

### CLI Options

```
build [options] <program-dir>
  -o, --output <dir>   Output directory for compiled program
  -v, --verbose        Show verbose output

deploy [options] <program-path>
  -n, --network <network>        Network to deploy to (localhost, devnet, testnet, mainnet-beta)
  -k, --keypair <keypair-path>   Path to keypair file
  -v, --verbose                  Show verbose output

invoke [options] <program-id>
  -n, --network <network>        Network where the program is deployed
  -k, --keypair <keypair-path>   Path to keypair file

build-and-deploy [options] <program-dir>
  -n, --network <network>        Network to deploy to (localhost, devnet, testnet, mainnet-beta)
  -k, --keypair <keypair-path>   Path to keypair file
  -v, --verbose                  Show verbose output

build-deploy-invoke [options] <program-dir>
  -n, --network <network>        Network to deploy to (localhost, devnet, testnet, mainnet-beta)
  -k, --keypair <keypair-path>   Path to keypair file
  -v, --verbose                  Show verbose output
```

## API Reference

### buildContract(programDir, options)

Builds a Rust program for Solana.

- `programDir`: Path to the Rust program directory
- `options`:
  - `verbose`: Boolean, show detailed output
  - `outputDir`: Custom output directory

Returns a Promise resolving to an object with:
- `success`: Boolean indicating success
- `programPath`: Path to the compiled program
- `programName`: Name of the compiled program file

### deploy(programPath, options)

Deploys a compiled Solana program.

- `programPath`: Path to the compiled .so file
- `options`:
  - `network`: Network to deploy to (localhost, devnet, testnet, mainnet-beta)
  - `keypairPath`: Path to the keypair file
  - `verbose`: Boolean, show detailed output

Returns a Promise resolving to an object with:
- `success`: Boolean indicating success
- `programId`: Deployed program ID
- `network`: Network where the program was deployed

### invokeProgram(programId, payerKeypair, network)

Invokes a deployed Solana program.

- `programId`: Program ID of the deployed program
- `payerKeypair`: Keypair to pay for the transaction
- `network`: Network where the program is deployed (localhost, devnet, testnet, mainnet-beta)

Returns a Promise resolving to an object with:
- `success`: Boolean indicating success
- `signature`: Transaction signature
- `logs`: Array of program logs
- `explorerUrl`: URL to view the transaction on Solana Explorer

### Other functions

- `loadKeypair(keypairPath)`: Load a Solana keypair from a file
- `getConnection(network)`: Get a Solana connection for a network
- `getBalance(keypair, network)`: Get SOL balance of a keypair
- `validateEnvironment()`: Check if required tools are installed
- `getExplorerUrl(signature, network)`: Get Explorer URL for a transaction

## Error Handling

The SDK uses a consistent error code system:

- E101: Solana CLI not found
- E102: Rust not found
- E103: Cargo build-sbf command failed
- E104: Deployment failed
- E105: Invalid network specified
- E106: Invalid keypair file
- E107: Failed to extract program ID
- E108: Invalid program file path

## Security Considerations

- Never store private keys in your code repository
- Consider using environment variables for sensitive values
- Use keypair files stored securely on your system

## License

ISC