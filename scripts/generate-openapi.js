#!/usr/bin/env node
/**
 * Generate OpenAPI JSON schema from FastAPI backend.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const SERVER_PORT = 8003;
const SERVER_HOST = '0.0.0.0';
const HEALTH_CHECK_URL = `http://localhost:${SERVER_PORT}/health`;
const OPENAPI_JSON_URL = `http://localhost:${SERVER_PORT}/openapi.json`;
const TIMEOUT = 30000;

// Paths
const projectRoot = path.join(__dirname, '..');
const backendSrc = path.join(projectRoot, 'apps', 'backend', 'src');
const outputPath = path.join(projectRoot, 'libs', 'api', 'openapi.json');

/**
 * Make an HTTP GET request
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      })
      .on('error', reject);
  });
}

/**
 * Wait for the server to be ready
 */
async function waitForServer(url, timeout = TIMEOUT) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await httpGet(url);
      if (response.status === 200) {
        console.log('✓ Server is ready');
        return true;
      }
    } catch {
      // Server not ready yet, continue waiting
    }

    // Wait 500ms before next attempt
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting backend server...');

  // Start the backend server
  const serverProcess = spawn(
    'uv',
    ['run', 'uvicorn', 'api.main:app', '--host', SERVER_HOST, '--port', SERVER_PORT.toString()],
    {
      cwd: backendSrc,
      env: {
        ...process.env,
        PYTHONPATH: backendSrc,
      },
      detached: process.platform !== 'win32', // Enable process group on Unix
    },
  );

  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    if (process.env.DEBUG) {
      console.log(`[Server] ${data}`);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    if (process.env.DEBUG) {
      console.error(`[Server Error] ${data}`);
    }
  });

  try {
    // Wait for server to be ready
    const isReady = await waitForServer(HEALTH_CHECK_URL);

    if (!isReady) {
      console.error('✗ Server failed to start within timeout');
      process.exit(1);
    }

    // Fetch the OpenAPI JSON
    console.log('Fetching OpenAPI schema...');
    const response = await httpGet(OPENAPI_JSON_URL);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch OpenAPI schema: HTTP ${response.status}`);
    }

    // Ensure the directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to file
    fs.writeFileSync(outputPath, response.data);
    console.log(`✓ OpenAPI schema saved to: ${outputPath}`);
  } finally {
    // Stop the server
    console.log('Stopping backend server...');

    if (process.platform === 'win32') {
      serverProcess.kill();
    } else {
      // Kill the entire process group on Unix
      process.kill(-serverProcess.pid, 'SIGTERM');
    }

    // Wait a bit for the process to terminate
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('✓ Server stopped');
  }
}

// Run the script
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
