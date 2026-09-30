// Runs once when a server instance starts: brings the database schema up to
// date with the code being deployed. The deploy is `git push`; nothing else
// runs migrations.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { ensureSchema } = await import("./app/lib/db");
    const result = await ensureSchema();
    console.log(`[schema] ${result}`);
  } catch (e) {
    console.error("[schema] FAILED to apply — the app is running against whatever schema exists:", e);
  }
}
