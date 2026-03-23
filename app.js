// Wrapper for Passenger - loads Astro's ESM entry point
async function main() {
  const { handler } = await import('./server/entry.mjs');
  return handler;
}

// Passenger expects the app to listen, but Astro standalone already does
main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
