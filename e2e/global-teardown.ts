export default async function globalTeardown() {
  // Test database is preserved between runs for inspection.
  // To reset it: bun run test:db:reset
  console.log("\n[global-teardown] Done. Test database preserved for inspection.");
}
