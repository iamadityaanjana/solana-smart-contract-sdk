// Test file for building Solana contracts
const { buildContract } = require('solana-deploy-sdk');
const path = require('path');

console.log('Testing Solana Deploy SDK Build Functionality...');

async function testBuild() {
  try {
    // Path to the sample contract to build
    const programDir = path.resolve('../add-numbers');
    console.log(`Building Solana program from: ${programDir}`);
    
    const buildResult = await buildContract(programDir, {
      verbose: true
    });
    
    if (buildResult.success) {
      console.log(`\n✅ SUCCESS: Contract built successfully!`);
      console.log(`Program Name: ${buildResult.programName}`);
      console.log(`Program Path: ${buildResult.programPath}`);
      return true;
    } else {
      console.log(`\n❌ FAILURE: Build failed!`);
      console.log(`Error: ${buildResult.error}`);
      console.log(`Error Code: ${buildResult.errorCode}`);
      if (buildResult.details) {
        console.log(`Details: ${buildResult.details}`);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

testBuild().then(result => {
  console.log('\nTest completed:', result ? 'PASSED' : 'FAILED');
});