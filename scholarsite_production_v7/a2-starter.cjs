// CommonJS wrapper for A2 Hosting LiteSpeed/Passenger
// This file uses dynamic import to load the ES module server

async function start() {
  try {
    await import('./index.js');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
