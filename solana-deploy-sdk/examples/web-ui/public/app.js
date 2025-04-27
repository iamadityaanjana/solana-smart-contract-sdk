// Solana Smart Contract Deployer UI JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const envStatusElement = document.getElementById('env-status');
  const programDirInput = document.getElementById('program-dir');
  const programPathInput = document.getElementById('program-path');
  const keypairPathInput = document.getElementById('keypair-path');
  const networkSelect = document.getElementById('network-select');
  const buildVerboseCheckbox = document.getElementById('build-verbose');
  const deployVerboseCheckbox = document.getElementById('deploy-verbose');
  const buildButton = document.getElementById('build-btn');
  const deployButton = document.getElementById('deploy-btn');
  const buildOutput = document.getElementById('build-output');
  const deployOutput = document.getElementById('deploy-output');
  const buildLoader = document.getElementById('build-loader');
  const deployLoader = document.getElementById('deploy-loader');

  // Check environment status on page load
  checkEnvironment();

  // Event Listeners
  buildButton.addEventListener('click', buildContract);
  deployButton.addEventListener('click', deployContract);

  // File browse buttons are mocked for this demo
  document.getElementById('browse-btn').addEventListener('click', () => {
    alert('In a real app, this would open a file browser dialog. Please manually enter the path for this demo.');
  });
  
  document.getElementById('browse-keypair-btn').addEventListener('click', () => {
    alert('In a real app, this would open a file browser dialog. Please manually enter the path for this demo.');
  });

  // Functions
  async function checkEnvironment() {
    try {
      envStatusElement.textContent = 'Checking environment...';
      
      const response = await fetch('/api/check-environment');
      const data = await response.json();
      
      if (data.isValid) {
        envStatusElement.textContent = '✅ Environment ready';
        envStatusElement.classList.add('success');
      } else {
        envStatusElement.textContent = '❌ Environment not properly set up';
        envStatusElement.classList.add('error');
        
        // Disable buttons if environment is not valid
        buildButton.disabled = true;
        deployButton.disabled = true;
        
        buildOutput.innerHTML = '<div class="error">Please install required tools: Solana CLI, Rust, and Cargo</div>';
      }
    } catch (error) {
      envStatusElement.textContent = '❌ Failed to check environment';
      envStatusElement.classList.add('error');
      console.error('Error checking environment:', error);
    }
  }

  // Load networks from server
  async function loadNetworks() {
    try {
      const response = await fetch('/api/networks');
      const data = await response.json();
      
      if (data.success) {
        // Clear existing options
        networkSelect.innerHTML = '';
        
        // Add new options
        data.networks.forEach(network => {
          const option = document.createElement('option');
          option.value = network;
          option.textContent = network.charAt(0).toUpperCase() + network.slice(1);
          networkSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading networks:', error);
    }
  }

  // Build contract
  async function buildContract() {
    const programDir = programDirInput.value;
    
    if (!programDir) {
      buildOutput.innerHTML = '<div class="error">Please enter a program directory</div>';
      return;
    }
    
    try {
      // Show loader and disable button
      buildLoader.style.display = 'block';
      buildButton.disabled = true;
      buildOutput.textContent = 'Building program...';
      
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programDir,
          verbose: buildVerboseCheckbox.checked
        })
      });
      
      const result = await response.json();
      
      // Hide loader
      buildLoader.style.display = 'none';
      
      if (result.success) {
        buildOutput.innerHTML = `
          <div class="success">
            ✅ Build successful!<br>
            Program: ${result.programName}<br>
            Path: ${result.programPath}
          </div>
        `;
        
        // Update program path for deployment
        programPathInput.value = result.programPath;
        
        // Enable deploy button
        deployButton.disabled = false;
      } else {
        buildOutput.innerHTML = `
          <div class="error">
            ❌ Build failed: ${result.error}<br>
            Error code: ${result.errorCode}<br>
            ${result.details ? `Details: ${result.details}` : ''}
          </div>
        `;
      }
    } catch (error) {
      buildLoader.style.display = 'none';
      buildOutput.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
      console.error('Error building contract:', error);
    } finally {
      buildButton.disabled = false;
    }
  }

  // Deploy contract
  async function deployContract() {
    const programPath = programPathInput.value;
    const network = networkSelect.value;
    const keypairPath = keypairPathInput.value || undefined; // Use default if empty
    
    if (!programPath) {
      deployOutput.innerHTML = '<div class="error">Please build the contract first</div>';
      return;
    }
    
    try {
      // Show loader and disable button
      deployLoader.style.display = 'block';
      deployButton.disabled = true;
      deployOutput.textContent = `Deploying program to ${network}...`;
      
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programPath,
          network,
          keypairPath,
          verbose: deployVerboseCheckbox.checked
        })
      });
      
      const result = await response.json();
      
      // Hide loader
      deployLoader.style.display = 'none';
      
      if (result.success) {
        deployOutput.innerHTML = `
          <div class="success">
            ✅ Deployment successful!<br>
            Network: ${result.network}<br>
            Program ID: ${result.programId}<br><br>
            Your contract is now live on the Solana blockchain!
          </div>
        `;
      } else {
        deployOutput.innerHTML = `
          <div class="error">
            ❌ Deployment failed: ${result.error}<br>
            Error code: ${result.errorCode}<br>
            ${result.details ? `Details: ${result.details}` : ''}
          </div>
        `;
      }
    } catch (error) {
      deployLoader.style.display = 'none';
      deployOutput.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
      console.error('Error deploying contract:', error);
    } finally {
      deployButton.disabled = false;
    }
  }

  // Load networks when page loads
  loadNetworks();
});