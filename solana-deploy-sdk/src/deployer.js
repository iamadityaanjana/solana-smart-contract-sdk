// Solana program deployment utilities
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { networks, errorCodes, defaultConfig } = require('./config');
const { validateEnvironment } = require('./builder');

/**
 * Deploy a Solana program to the specified network
 * @param {string} programPath - Path to the compiled .so file
 * @param {Object} options - Deployment options
 * @returns {Promise<Object>} Deployment result
 */
async function deploy(programPath, options = {}) {
  const {
    network = defaultConfig.network, 
    keypairPath = defaultConfig.keypairPath,
    verbose = false
  } = options;
  
  // Validate environment
  const isEnvironmentValid = await validateEnvironment();
  if (!isEnvironmentValid) {
    return {
      success: false,
      error: errorCodes.E101,
      errorCode: 'E101'
    };
  }
  
  // Validate network
  if (!networks[network]) {
    return {
      success: false,
      error: `${errorCodes.E105}: ${network}`,
      errorCode: 'E105'
    };
  }
  
  // Validate keypair file
  if (!fs.existsSync(keypairPath)) {
    return {
      success: false,
      error: `${errorCodes.E106}: ${keypairPath}`,
      errorCode: 'E106'
    };
  }
  
  // Validate program file
  const absoluteProgramPath = path.resolve(programPath);
  if (!fs.existsSync(absoluteProgramPath)) {
    return {
      success: false,
      error: `${errorCodes.E108}: ${absoluteProgramPath}`,
      errorCode: 'E108'
    };
  }

  console.log(`Deploying program to ${networks[network].label}...`);
  
  // Try to get program ID from keypair file first if it exists
  try {
    // Check if the keypair file exists next to the .so file
    const programName = path.basename(absoluteProgramPath, '.so');
    const programDir = path.dirname(absoluteProgramPath);
    const programKeypairPath = path.join(programDir, `${programName}-keypair.json`);
    
    if (fs.existsSync(programKeypairPath)) {
      console.log(`Found program keypair at ${programKeypairPath}`);
      const programKeypairData = JSON.parse(fs.readFileSync(programKeypairPath, 'utf8'));
      const programKeypair = Keypair.fromSecretKey(new Uint8Array(programKeypairData));
      const existingProgramId = programKeypair.publicKey.toString();
      console.log(`Program ID from keypair: ${existingProgramId}`);
      
      // Now we'll still run the deploy command, but we already know the program ID
      const knownProgramId = existingProgramId;
      
      return new Promise((resolve) => {
        // Deploy using the Solana CLI
        const deployProcess = spawn('solana', [
          'program', 'deploy',
          '--keypair', keypairPath,
          '--url', networks[network].url,
          absoluteProgramPath
        ], {
          shell: true,
          stdio: verbose ? 'inherit' : 'pipe'
        });

        let stdoutData = '';
        let stderrData = '';

        if (!verbose) {
          deployProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log(data.toString()); // Log it anyway for debugging
          });
          
          deployProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error(data.toString()); // Log it anyway for debugging
          });
        }

        deployProcess.on('close', (code) => {
          if (code !== 0) {
            return resolve({
              success: false,
              error: `Deployment failed with code ${code}`,
              errorCode: 'E104',
              details: stderrData || 'No error details available'
            });
          }
          
          // We already know the program ID from the keypair file
          resolve({
            success: true,
            programId: knownProgramId,
            network
          });
        });
      });
    }
  } catch (err) {
    console.warn("Warning: Could not extract program ID from keypair file:", err);
    // Continue with normal deployment
  }
  
  // If we reach here, we don't have a program keypair file, so deploy normally
  return new Promise((resolve) => {
    // Deploy using the Solana CLI
    const deployProcess = spawn('solana', [
      'program', 'deploy',
      '--keypair', keypairPath,
      '--url', networks[network].url,
      absoluteProgramPath
    ], {
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe'
    });

    let stdoutData = '';
    let stderrData = '';

    if (!verbose) {
      deployProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        console.log(data.toString()); // Log it anyway for debugging
      });
      
      deployProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(data.toString()); // Log it anyway for debugging
      });
    }

    deployProcess.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          success: false,
          error: `Deployment failed with code ${code}`,
          errorCode: 'E104',
          details: stderrData || 'No error details available'
        });
      }
      
      // Try multiple regex patterns to extract program ID
      // Pattern 1: Standard "Program Id: <id>"
      let programIdMatch = stdoutData.match(/Program Id: ([a-zA-Z0-9]{32,44})/);
      
      // Pattern 2: "Program ID: <id>"
      if (!programIdMatch || !programIdMatch[1]) {
        programIdMatch = stdoutData.match(/Program ID: ([a-zA-Z0-9]{32,44})/);
      }
      
      // Pattern 3: "Programm *ID: <id>" (accounting for typos or variations)
      if (!programIdMatch || !programIdMatch[1]) {
        programIdMatch = stdoutData.match(/Programm?\s*ID:?\s*([a-zA-Z0-9]{32,44})/i);
      }
      
      // Pattern 4: Just look for a base58 encoded program ID
      if (!programIdMatch || !programIdMatch[1]) {
        programIdMatch = stdoutData.match(/([a-zA-Z0-9]{32,44})/);
      }
      
      // If we still can't find a program ID, return an error
      if (!programIdMatch || !programIdMatch[1]) {
        console.error("Failed to extract program ID. CLI Output:", stdoutData);
        return resolve({
          success: false,
          error: errorCodes.E107,
          errorCode: 'E107',
          rawOutput: stdoutData
        });
      }
      
      const programId = programIdMatch[1];

      // Verify that the program ID is a valid Solana public key
      try {
        new PublicKey(programId);
      } catch (error) {
        return resolve({
          success: false,
          error: `Invalid program ID extracted: ${programId}`,
          errorCode: 'E107',
          details: error.message
        });
      }
      
      resolve({
        success: true,
        programId,
        network
      });
    });
  });
}

/**
 * Load a Solana keypair from a file
 * @param {string} keypairPath - Path to the keypair JSON file
 * @returns {Keypair} Solana keypair
 */
function loadKeypair(keypairPath) {
  try {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    return Keypair.fromSecretKey(new Uint8Array(keypairData));
  } catch (error) {
    throw new Error(`Failed to load keypair from ${keypairPath}: ${error.message}`);
  }
}

/**
 * Get a Solana connection for the specified network
 * @param {string} network - Network name
 * @returns {Connection} Solana connection
 */
function getConnection(network = defaultConfig.network) {
  if (!networks[network]) {
    throw new Error(`Invalid network: ${network}`);
  }
  
  return new Connection(networks[network].url);
}

/**
 * Get balance of a wallet
 * @param {Keypair} keypair - Solana keypair
 * @param {string} network - Network name
 * @returns {Promise<number>} Balance in SOL
 */
async function getBalance(keypair, network = defaultConfig.network) {
  const connection = getConnection(network);
  const balance = await connection.getBalance(keypair.publicKey);
  return balance / 1000000000; // Convert lamports to SOL
}

/**
 * Invoke a deployed Solana program
 * @param {string} programId - The program ID to invoke
 * @param {Keypair} payerKeypair - Keypair to pay for the transaction
 * @param {string} network - Network name
 * @returns {Promise<Object>} Invocation result with logs
 */
async function invokeProgram(programId, payerKeypair, network = defaultConfig.network) {
  try {
    const connection = getConnection(network);
    const programPubkey = new PublicKey(programId);
    
    // Create a simple instruction that just calls the program
    const instruction = new TransactionInstruction({
      keys: [],
      programId: programPubkey,
      data: Buffer.from([]), // Empty data buffer for simple invocation
    });

    // Create a transaction with just this instruction
    const transaction = new Transaction().add(instruction);
    
    // Set recent blockhash
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = payerKeypair.publicKey;
    
    // Sign and send the transaction
    transaction.sign(payerKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    // Wait for confirmation and get transaction details
    const confirmation = await connection.confirmTransaction(signature);
    
    // Fetch transaction details to get logs
    const txInfo = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    // Extract logs
    const logs = txInfo?.meta?.logMessages || [];
    
    console.log(`Program invoked successfully! Transaction signature: ${signature}`);
    console.log(`Explorer URL: ${getExplorerUrl(signature, network)}`);
    
    return {
      success: true,
      signature,
      logs,
      explorerUrl: getExplorerUrl(signature, network)
    };
    
  } catch (error) {
    console.error("Error invoking program:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get Solana Explorer URL for a transaction
 * @param {string} signature - Transaction signature
 * @param {string} network - Network name
 * @returns {string} Explorer URL
 */
function getExplorerUrl(signature, network) {
  const baseUrl = "https://explorer.solana.com";
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `${baseUrl}/tx/${signature}${cluster}`;
}

module.exports = {
  deploy,
  loadKeypair,
  getConnection,
  getBalance,
  invokeProgram,
  getExplorerUrl
};