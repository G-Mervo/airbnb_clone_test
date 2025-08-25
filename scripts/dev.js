#!/usr/bin/env node

/**
 * A bit dissapointed that this is necessary, but it's a necessary evil.
 *
 * This script is used to start the development servers for the frontend and backend.
 * It's also used to kill the development servers when the user exits the process.
 *
 * It's a bit of a hack.
 */

const { spawn, exec } = require('child_process');
const process = require('process');

// Store all child processes
const children = new Set();
let isExiting = false;

// Function to find all nx-related processes
function findNxProcesses() {
  return new Promise((resolve) => {
    exec(
      'ps aux | grep -E "node.*(nx|vite|uvicorn)" | grep -v grep | grep -v "scripts/dev.js"',
      (error, stdout) => {
        if (error || !stdout) {
          resolve([]);
          return;
        }

        const pids = stdout
          .trim()
          .split('\n')
          .filter((line) => line.length > 0)
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            return parseInt(parts[1]);
          })
          .filter((pid) => !isNaN(pid) && pid !== process.pid);

        resolve(pids);
      },
    );
  });
}

// Function to kill all child processes
async function killAllChildren() {
  if (isExiting) return;
  isExiting = true;

  console.log('\n🛑 Shutting down all processes...');

  // First, try to stop nx daemon gracefully
  try {
    await new Promise((resolve) => {
      exec('npx nx daemon --stop', (_error) => {
        if (_error) {
          console.log('Error stopping nx daemon', _error);
        }
        resolve();
      });
    });
  } catch {
    // Ignore errors
  }

  // Kill direct children
  children.forEach((child) => {
    try {
      if (child.pid) {
        process.kill(-child.pid, 'SIGTERM');
      }
    } catch {
      // Ignore errors
    }
  });

  // Find and kill all nx-related processes
  const nxPids = await findNxProcesses();
  console.log(`Found ${nxPids.length} nx-related processes to clean up...`);

  nxPids.forEach((pid) => {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Ignore errors
    }
  });

  // Give processes time to shut down gracefully
  setTimeout(async () => {
    // Force kill any remaining processes
    const remainingPids = await findNxProcesses();
    remainingPids.forEach((pid) => {
      try {
        console.log(`Force killing process ${pid}`);
        process.kill(pid, 'SIGKILL');
      } catch {
        // Ignore errors
      }
    });

    // Final cleanup of direct children
    children.forEach((child) => {
      try {
        if (child.pid) {
          process.kill(-child.pid, 'SIGKILL');
        }
      } catch {
        // Ignore errors
      }
    });

    console.log('✅ All processes terminated');
    process.exit(0);
  }, 2000);
}

// Handle various exit signals
process.on('SIGINT', killAllChildren);
process.on('SIGTERM', killAllChildren);
process.on('SIGHUP', killAllChildren);
process.on('exit', () => {
  if (!isExiting) {
    killAllChildren();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  killAllChildren();
});

// Start nx dev command
console.log('🚀 Starting development servers...\n');

const nxProcess = spawn('nx', ['run-many', '-t', 'dev', '-p', 'frontend,backend'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  // Create a new process group
  detached: process.platform !== 'win32',
});

children.add(nxProcess);

nxProcess.on('error', (error) => {
  console.error('Failed to start nx:', error);
  killAllChildren();
});

nxProcess.on('exit', (code) => {
  if (code !== null && code !== 0 && !isExiting) {
    console.error(`nx process exited with code ${code}`);
  }
  killAllChildren();
});
