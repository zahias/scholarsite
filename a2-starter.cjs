(async function start() {
  try {
    // Prefer built server in dist (output of `npm run build`).
    // If you're running source directly on A2, change to './server/index.js'
    await import('./dist/index.js');
  } catch (error) {
    console.error('Failed to start server via a2-starter.cjs:', error);
    process.exit(1);
  }
})();
