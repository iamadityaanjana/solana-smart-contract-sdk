// Test file for invoking Solana contracts
const { invokeProgram, loadKeypair, getExplorerUrl } = require('solana-deploy-sdk');
const path = require('path');
const fs = require('fs');

console.log('Testing Solana Deploy SDK Invoke Functionality...');

async function testInvoke() {
  try {
    // Try to load previously deployed program ID from test-data.json
    const testDataFile = path.join(__dirname, 'test-data.json');
    let programId, network;
    
    if (fs.existsSync(testDataFile)) {
      const testData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));
      programId = testData.programId;
      network = testData.network;
      console.log(`Found previously deployed program ID: ${programId}`);
    } else {
      console.log('No previously deployed program ID found.');
      console.log('Please run the deploy test first to deploy the program.');
      return false;
    }
    
    // Path to keypair file (modify as needed)
    const keypairPath = path.resolve('../id.json');
    
    // Check if the keypair file exists
    if (!fs.existsSync(keypairPath)) {
      console.log(`❌ Keypair file not found: ${keypairPath}`);
      console.log('Please ensure you have a valid keypair file at the specified path.');
      return false;
    }
    
    console.log(`Using keypair from: ${keypairPath}`);
    console.log(`Invoking program ${programId} on ${network}...`);
    
    // Load the keypair
    const keypair = loadKeypair(keypairPath);
    
    // Invoke the program
    const invokeResult = await invokeProgram(programId, keypair, network);
    
    if (invokeResult.success) {
      console.log(`\n✅ SUCCESS: Program invoked successfully!`);
      console.log('Transaction logs:');
      invokeResult.logs.forEach(log => {
        if (log.includes('Program log:')) {
          console.log(`  ${log}`);
        }
      });
      
      const explorerUrl = getExplorerUrl(invokeResult.signature, network);
      console.log(`\nView on Solana Explorer: ${explorerUrl}`);
      return true;
    } else {
      console.log(`\n❌ FAILURE: Invocation failed!`);
      console.log(`Error: ${invokeResult.error}`);
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

testInvoke().then(result => {
  console.log('\nTest completed:', result ? 'PASSED' : 'FAILED');
});