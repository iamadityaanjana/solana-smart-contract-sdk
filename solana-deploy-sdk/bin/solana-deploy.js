#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { buildContract, validateEnvironment, deploy, loadKeypair, invokeProgram } = require('../index');
const { networks } = require('../src/config');
const { checkTool } = require('../src/builder');

// Set up CLI program
program
  .name('solana-deploy')
  .description('Solana smart contract deployment tool')
  .version('1.0.0');

// Build command
program
  .command('build')
  .description('Build a Solana smart contract')
  .argument('<program-dir>', 'Directory containing the Rust program')
  .option('-o, --output <dir>', 'Output directory for the compiled program')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (programDir, options) => {
    const result = await buildContract(programDir, {
      verbose: options.verbose,
      outputDir: options.output
    });

    if (result.success) {
      console.log(`✅ Build successful!`);
      console.log(`Program: ${result.programName}`);
      console.log(`Path: ${result.programPath}`);
    } else {
      console.error(`❌ Build failed: ${result.error}`);
      console.error(`Error code: ${result.errorCode}`);
      if (result.details) {
        console.error(`Details: ${result.details}`);
      }
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy a Solana smart contract')
  .argument('<program-path>', 'Path to the compiled .so program file')
  .option('-n, --network <network>', 'Network to deploy to (localhost, devnet, testnet, mainnet-beta)', 'devnet')
  .option('-k, --keypair <keypair-path>', 'Path to the keypair file')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (programPath, options) => {
    // Validate network option
    if (!networks[options.network]) {
      console.error(`❌ Invalid network: ${options.network}`);
      console.error(`Valid networks: ${Object.keys(networks).join(', ')}`);
      process.exit(1);
    }

    const result = await deploy(programPath, {
      network: options.network,
      keypairPath: options.keypair,
      verbose: options.verbose
    });

    if (result.success) {
      console.log(`✅ Deployment successful!`);
      console.log(`Network: ${networks[result.network].label}`);
      console.log(`Program ID: ${result.programId}`);
    } else {
      console.error(`❌ Deployment failed: ${result.error}`);
      console.error(`Error code: ${result.errorCode}`);
      if (result.details) {
        console.error(`Details: ${result.details}`);
      }
      process.exit(1);
    }
  });

// Build and deploy command
program
  .command('build-and-deploy')
  .description('Build and deploy a Solana smart contract in one step')
  .argument('<program-dir>', 'Directory containing the Rust program')
  .option('-n, --network <network>', 'Network to deploy to (localhost, devnet, testnet, mainnet-beta)', 'devnet')
  .option('-k, --keypair <keypair-path>', 'Path to the keypair file')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (programDir, options) => {
    console.log(`Building and deploying Solana program from ${programDir}...`);
    
    // First build
    const buildResult = await buildContract(programDir, {
      verbose: options.verbose
    });

    if (!buildResult.success) {
      console.error(`❌ Build failed: ${buildResult.error}`);
      console.error(`Error code: ${buildResult.errorCode}`);
      if (buildResult.details) {
        console.error(`Details: ${buildResult.details}`);
      }
      process.exit(1);
    }

    console.log(`✅ Build successful!`);
    console.log(`Program: ${buildResult.programName}`);

    // Then deploy
    const deployResult = await deploy(buildResult.programPath, {
      network: options.network,
      keypairPath: options.keypair,
      verbose: options.verbose
    });

    if (deployResult.success) {
      console.log(`✅ Deployment successful!`);
      console.log(`Network: ${networks[deployResult.network].label}`);
      console.log(`Program ID: ${deployResult.programId}`);
    } else {
      console.error(`❌ Deployment failed: ${deployResult.error}`);
      console.error(`Error code: ${deployResult.errorCode}`);
      if (deployResult.details) {
        console.error(`Details: ${deployResult.details}`);
      }
      process.exit(1);
    }
  });

// Check environment command
program
  .command('check-environment')
  .description('Check if the required tools are installed')
  .action(async () => {
    const valid = await validateEnvironment();
    
    if (valid) {
      console.log('✅ All required tools are installed:');
      console.log('  - Solana CLI');
      console.log('  - Rust');
      console.log('  - Cargo');
    } else {
      console.error('❌ Some required tools are missing:');
      if (!await checkTool('solana --version')) {
        console.error('  - Solana CLI is not installed');
      }
      if (!await checkTool('rustc --version')) {
        console.error('  - Rust is not installed');
      }
      if (!await checkTool('cargo --version')) {
        console.error('  - Cargo is not installed');
      }
      
      console.log('\nPlease install the missing tools before using solana-deploy-sdk.');
      process.exit(1);
    }
  });

// Invoke program command
program
  .command('invoke')
  .description('Invoke a deployed Solana program')
  .argument('<program-id>', 'Program ID of the deployed program')
  .option('-n, --network <network>', 'Network where the program is deployed (localhost, devnet, testnet, mainnet-beta)', 'devnet')
  .option('-k, --keypair <keypair-path>', 'Path to the keypair file')
  .action(async (programId, options) => {
    try {
      // Validate network
      if (!networks[options.network]) {
        console.error(`❌ Invalid network: ${options.network}`);
        console.error(`Valid networks: ${Object.keys(networks).join(', ')}`);
        process.exit(1);
      }
      
      console.log(`Invoking program ${programId} on ${networks[options.network].label}...`);
      
      // Load keypair
      const keypair = loadKeypair(options.keypair);
      
      // Invoke program
      const result = await invokeProgram(programId, keypair, options.network);
      
      if (result.success) {
        console.log(`✅ Program invoked successfully!`);
        console.log(`Transaction signature: ${result.signature}`);
        console.log(`View in Explorer: ${result.explorerUrl}`);
        
        // Print the program logs
        console.log('\nProgram Logs:');
        result.logs.forEach(log => {
          // Highlight only the important program logs
          if (log.includes('Program log:')) {
            console.log(`  ${log}`);
          }
        });
      } else {
        console.error(`❌ Program invocation failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Web UI command
program
  .command('web-ui')
  .description('Start the Solana Deploy web UI')
  .option('-p, --port <port>', 'Port to run the web UI server on', '3000')
  .action(async (options) => {
    try {
      console.log(`Starting Solana Deploy Web UI on port ${options.port}...`);
      console.log(`Open http://localhost:${options.port} in your browser`);
      
      // Set the port in the environment
      process.env.PORT = options.port;
      
      // Run the web UI server
      require('../examples/web-ui/server.js');
    } catch (error) {
      console.error(`❌ Error starting web UI: ${error.message}`);
      process.exit(1);
    }
  });

// Explorer UI command
program
  .command('explorer-ui')
  .description('Start the Solana Contract Explorer UI')
  .option('-p, --port <port>', 'Port to run the explorer UI server on', '3000')
  .action(async (options) => {
    try {
      console.log(`Starting Solana Contract Explorer UI on port ${options.port}...`);
      console.log(`Open http://localhost:${options.port} in your browser`);
      
      // Set the port in the environment
      process.env.PORT = options.port;
      
      // Run the explorer UI server
      require('../examples/explorer-server.js');
    } catch (error) {
      console.error(`❌ Error starting explorer UI: ${error.message}`);
      process.exit(1);
    }
  });

// Build, deploy, and invoke command
program
  .command('build-deploy-invoke')
  .description('Build, deploy, and invoke a Solana smart contract in one step')
  .argument('<program-dir>', 'Directory containing the Rust program')
  .option('-n, --network <network>', 'Network to deploy to (localhost, devnet, testnet, mainnet-beta)', 'devnet')
  .option('-k, --keypair <keypair-path>', 'Path to the keypair file')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (programDir, options) => {
    console.log(`Building, deploying, and invoking Solana program from ${programDir}...`);
    
    // Build
    const buildResult = await buildContract(programDir, {
      verbose: options.verbose
    });

    if (!buildResult.success) {
      console.error(`❌ Build failed: ${buildResult.error}`);
      process.exit(1);
    }

    console.log(`✅ Build successful!`);
    console.log(`Program: ${buildResult.programName}`);

    // Deploy
    const deployResult = await deploy(buildResult.programPath, {
      network: options.network,
      keypairPath: options.keypair,
      verbose: options.verbose
    });

    if (!deployResult.success) {
      console.error(`❌ Deployment failed: ${deployResult.error}`);
      process.exit(1);
    }

    console.log(`✅ Deployment successful!`);
    console.log(`Program ID: ${deployResult.programId}`);
    console.log(`Network: ${networks[deployResult.network].label}`);
    
    // Wait for deployment to confirm
    console.log('Waiting for deployment to confirm...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Invoke
    console.log(`Invoking the program...`);
    const keypair = loadKeypair(options.keypair);
    const invokeResult = await invokeProgram(deployResult.programId, keypair, options.network);
    
    if (invokeResult.success) {
      console.log(`✅ Program invoked successfully!`);
      console.log(`Transaction signature: ${invokeResult.signature}`);
      console.log(`View in Explorer: ${invokeResult.explorerUrl}`);
      
      // Print the program logs
      console.log('\nProgram Logs:');
      invokeResult.logs.forEach(log => {
        if (log.includes('Program log:')) {
          console.log(`  ${log}`);
        }
      });
    } else {
      console.error(`❌ Program invocation failed: ${invokeResult.error}`);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();