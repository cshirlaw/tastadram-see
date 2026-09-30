import { NextResponse } from "next/server";
import { initSchema, seedHosts } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-time, idempotent: the tables, then HQ and a demonstration producer.
export async function POST() {
  try {
    await initSchema();
    const seed = await seedHosts();
    return NextResponse.json({ ok: true, ...seed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
