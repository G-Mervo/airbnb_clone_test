#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { watch } = require('fs');

// Configuration
const rootDir = path.join(__dirname, '../../..');
const backendSrcDir = path.join(rootDir, 'apps/backend/src');
const generateOpenApiScript = path.join(rootDir, 'scripts/generate-openapi.js');
const apiDir = path.join(rootDir, 'libs/api');

let isBuilding = false;
let buildQueued = false;

// Function to run a command and return a promise
function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    const child = exec(command, { ...options, stdio: 'inherit' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Forward output to console
    child.stdout?.on('data', (data) => process.stdout.write(data));
    child.stderr?.on('data', (data) => process.stderr.write(data));
  });
}

// Function to run the full build pipeline
async function runBuildPipeline() {
  if (isBuilding) {
    buildQueued = true;
    console.log('Build already in progress, queuing another build...');
    return;
  }

  isBuilding = true;
  buildQueued = false;

  try {
    console.log('\n🔄 Starting build pipeline...');

    // Step 1: Generate OpenAPI schema
    console.log('\n📋 Generating OpenAPI schema...');
    await runCommand(`node ${generateOpenApiScript}`, { cwd: rootDir });

    // Step 2: Generate TypeScript client
    console.log('\n🔧 Generating TypeScript client...');
    await runCommand('pnpm generate', { cwd: apiDir });

    // Step 3: Build the library
    console.log('\n🏗️  Building library...');
    await runCommand('pnpm nx build api', { cwd: rootDir });

    console.log('\n✅ Build pipeline completed successfully!');
  } catch (error) {
    console.error('\n❌ Build pipeline failed:', error.message);
  } finally {
    isBuilding = false;

    // If another build was queued, run it now
    if (buildQueued) {
      console.log('\n🔄 Running queued build...');
      runBuildPipeline();
    }
  }
}

// Function to watch for changes
function watchBackendChanges() {
  console.log(`\n👀 Watching for changes in ${backendSrcDir}...`);

  // Create a debounced version of the build function
  let debounceTimer;
  const debouncedBuild = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log('\n🔄 Backend changes detected, rebuilding...');
      runBuildPipeline();
    }, 1000); // Wait 1 second after last change before building
  };

  // Watch the backend src directory recursively
  const watcher = watch(backendSrcDir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.py') || filename.endsWith('.json'))) {
      console.log(`📝 ${eventType}: ${filename}`);
      debouncedBuild();
    }
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping file watcher...');
    watcher.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.close();
    process.exit(0);
  });
}

// Main function
async function main() {
  console.log('🚀 Starting API development mode...');

  // Run initial build
  await runBuildPipeline();

  // Start watching for changes
  watchBackendChanges();
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
