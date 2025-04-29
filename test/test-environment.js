// Test file for environment validation
const { validateEnvironment, networks } = require('solana-deploy-sdk');

console.log('Testing Solana Deploy SDK Environment Validation...');

async function testEnvironment() {
  try {
    console.log('Checking if required tools are installed...');
    const isValid = await validateEnvironment();
    
    if (isValid) {
      console.log('✅ SUCCESS: All required tools are installed!');
      console.log('  - Solana CLI');
      console.log('  - Rust');
      console.log('  - Cargo');
    } else {
      console.log('❌ FAILURE: Some required tools are missing.');
    }
    
    console.log('\nAvailable Solana networks:');
    Object.entries(networks).forEach(([name, config]) => {
      console.log(`  - ${name}: ${config.url} (${config.label})`);
    });
    
    return isValid;
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

testEnvironment().then(result => {
  console.log('\nTest completed:', result ? 'PASSED' : 'FAILED');
});