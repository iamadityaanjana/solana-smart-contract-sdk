// Test file for deploying Solana contracts
const { deploy, loadKeypair } = require('solana-deploy-sdk');
const path = require('path');
const fs = require('fs');

console.log('Testing Solana Deploy SDK Deploy Functionality...');

async function testDeploy() {
  try {
    // Path to the compiled program
    const programPath = path.resolve('../add-numbers/target/deploy/add_numbers.so');
    
    // Check if the program file exists
    if (!fs.existsSync(programPath)) {
      console.log(`❌ Program file not found: ${programPath}`);
      console.log('Please run the build test first to compile the program.');
      return false;
    }
    
    console.log(`Deploying Solana program from: ${programPath}`);
    
    // Path to keypair file (modify as needed)
    const keypairPath = path.resolve('../id.json');
    
    // Check if the keypair file exists
    if (!fs.existsSync(keypairPath)) {
      console.log(`❌ Keypair file not found: ${keypairPath}`);
      console.log('Please ensure you have a valid keypair file at the specified path.');
      return false;
    }
    
    console.log(`Using keypair from: ${keypairPath}`);
    console.log('Deploying to Solana devnet...');
    
    const deployResult = await deploy(programPath, {
      network: 'devnet',
      keypairPath: keypairPath,
      verbose: true
    });
    
    if (deployResult.success) {
      console.log(`\n✅ SUCCESS: Contract deployed successfully!`);
      console.log(`Program ID: ${deployResult.programId}`);
      console.log(`Network: ${deployResult.network}`);
      
      // Save the program ID for later invocation tests
      const testDataFile = path.join(__dirname, 'test-data.json');
      fs.writeFileSync(testDataFile, JSON.stringify({
        programId: deployResult.programId,
        network: deployResult.network
      }));
      console.log(`Test data saved to: ${testDataFile}`);
      
      return true;
    } else {
      console.log(`\n❌ FAILURE: Deployment failed!`);
      console.log(`Error: ${deployResult.error}`);
      console.log(`Error Code: ${deployResult.errorCode}`);
      if (deployResult.details) {
        console.log(`Details: ${deployResult.details}`);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

testDeploy().then(result => {
  console.log('\nTest completed:', result ? 'PASSED' : 'FAILED');
});