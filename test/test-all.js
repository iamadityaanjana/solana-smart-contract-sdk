// Main test file for solana-deploy-sdk
const { exec } = require('child_process');

console.log('🚀 Testing Solana Deploy SDK - All Functionalities');
console.log('==============================================\n');

async function runTest(testName, scriptName) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Running ${testName}...\n`);
    const test = exec(`node ${scriptName}.js`);
    
    test.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    test.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    test.on('close', (code) => {
      console.log(`\n${testName} ${code === 0 ? '✅ PASSED' : '❌ FAILED'}`);
      resolve(code === 0);
    });
  });
}

async function runAllTests() {
  try {
    const results = {
      environment: await runTest('Environment Test', 'test-environment'),
      build: await runTest('Build Test', 'test-build'),
      deploy: await runTest('Deploy Test', 'test-deploy'),
      invoke: await runTest('Invoke Test', 'test-invoke'),
    };
    
    console.log('\n==============================================');
    console.log('📋 Test Summary:');
    console.log('==============================================');
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log('\n==============================================');
    console.log(`🏁 Final Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('==============================================\n');
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runAllTests();