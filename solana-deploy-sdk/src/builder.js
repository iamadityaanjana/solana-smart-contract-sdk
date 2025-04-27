// Smart contract build utilities
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { errorCodes, requiredTools } = require('./config');

/**
 * Validates that required tools are installed
 * @returns {Promise<boolean>} True if all tools are installed
 */
async function validateEnvironment() {
  const checks = [];
  
  for (const [tool, command] of Object.entries(requiredTools)) {
    const [cmd, ...args] = command.split(' ');
    checks.push(new Promise(resolve => {
      const proc = spawn(cmd, args);
      proc.on('error', () => resolve(false));
      proc.on('close', code => resolve(code === 0));
    }));
  }
  
  const results = await Promise.all(checks);
  return results.every(result => result === true);
}

/**
 * Builds a Rust Solana program
 * @param {string} programDir - Path to the Rust program directory
 * @param {Object} options - Build options
 * @returns {Promise<Object>} Build result
 */
async function buildContract(programDir, options = {}) {
  const {
    verbose = false,
    outputDir = null
  } = options;

  // Verify environment first
  const isEnvironmentValid = await validateEnvironment();
  if (!isEnvironmentValid) {
    const missingTools = [];
    if (!await checkTool(requiredTools.solana)) missingTools.push('Solana CLI');
    if (!await checkTool(requiredTools.rust)) missingTools.push('Rust');
    if (!await checkTool(requiredTools.cargo)) missingTools.push('Cargo');
    
    return {
      success: false,
      error: `Missing required tools: ${missingTools.join(', ')}`,
      errorCode: missingTools.includes('Solana CLI') ? 'E101' : 'E102'
    };
  }

  return new Promise((resolve) => {
    const absoluteProgramDir = path.resolve(programDir);
    
    if (!fs.existsSync(absoluteProgramDir)) {
      return resolve({
        success: false,
        error: `Program directory does not exist: ${absoluteProgramDir}`,
        errorCode: 'E108'
      });
    }

    console.log(`Building Solana program at ${absoluteProgramDir}...`);
    
    // The cargo build-sbf command replaced the older cargo build-bpf command
    const buildProcess = spawn('cargo', ['build-sbf'], {
      cwd: absoluteProgramDir,
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe'
    });

    let stdoutData = '';
    let stderrData = '';

    if (!verbose) {
      buildProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      buildProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
    }

    buildProcess.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          success: false,
          error: `Build failed with code ${code}`,
          errorCode: 'E103',
          details: stderrData || 'No error details available'
        });
      }

      // Get the path to the compiled .so file
      const defaultBuildDir = path.join(absoluteProgramDir, 'target', 'deploy');
      const buildDir = outputDir || defaultBuildDir;
      
      // Ensure the output directory exists
      if (outputDir && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Find the .so file (program binary)
      const files = fs.existsSync(defaultBuildDir) 
        ? fs.readdirSync(defaultBuildDir).filter(file => file.endsWith('.so'))
        : [];
      
      if (files.length === 0) {
        return resolve({
          success: false,
          error: 'Build completed but no .so file was found',
          errorCode: 'E103'
        });
      }

      const programFile = files[0];
      const programPath = path.join(defaultBuildDir, programFile);
      
      // Copy to output directory if different from default
      if (outputDir && outputDir !== defaultBuildDir) {
        fs.copyFileSync(programPath, path.join(outputDir, programFile));
      }
      
      resolve({
        success: true,
        programPath: path.join(buildDir, programFile),
        programName: programFile
      });
    });
  });
}

/**
 * Helper to check if a specific tool is installed
 * @param {string} command - Command string to execute
 * @returns {Promise<boolean>} True if tool is installed
 */
async function checkTool(command) {
  const [cmd, ...args] = command.split(' ');
  return new Promise(resolve => {
    const proc = spawn(cmd, args);
    proc.on('error', () => resolve(false));
    proc.on('close', code => resolve(code === 0));
  });
}

module.exports = {
  buildContract,
  validateEnvironment,
  checkTool
};