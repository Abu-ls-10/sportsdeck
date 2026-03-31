export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCacheWarmer } = await import("@/lib/cache/warmCache");
    startCacheWarmer();
  }
}
