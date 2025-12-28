(async function start() {
  try {
    // Prefer production build copied to root (production/index.js).
    // Fall back to dist output for local/dev builds.
    try {
      await import('./index.js');
      return;
    } catch (innerError) {
      if (innerError?.code !== 'ERR_MODULE_NOT_FOUND') {
        throw innerError;
      }
    }
    await import('./dist/index.js');
  } catch (error) {
    console.error('Failed to start server via a2-starter.cjs:', error);
    process.exit(1);
  }
})();
