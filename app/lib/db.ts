import { neon } from "@neondatabase/serverless";

// tastaDRAM See — the database. Forked from tastaDRAM Tea on 29 Sep 2026 and
// cut to what See needs: producers (hosts), sessions, the people who join
// them, and their answers. Each copy of tastaDRAM has its own Neon database.

export function getSql() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error("No database connection string is set");
  return neon(url);
}

const SCHEMA_MARKER =
  process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "local";

let schemaCheckedThisInstance = false;

// Applies the schema once per deployment, from instrumentation.ts. Structure
// is automatic; seeding (/api/setup) is a deliberate act.
export async function ensureSchema(): Promise<"applied" | "current"> {
  if (process.env.SKIP_SCHEMA === "1") return "current";
  if (schemaCheckedThisInstance) return "current";
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS schema_state (
      id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      applied_for text NOT NULL,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )`;
  const rows = await sql`SELECT applied_for FROM schema_state WHERE id = 1`;
  if (rows.length > 0 && rows[0].applied_for === SCHEMA_MARKER) {
    schemaCheckedThisInstance = true;
    return "current";
  }
  await initSchema();
  await sql`
    INSERT INTO schema_state (id, applied_for, applied_at)
    VALUES (1, ${SCHEMA_MARKER}, now())
    ON CONFLICT (id) DO UPDATE SET applied_for = EXCLUDED.applied_for, applied_at = now()`;
  schemaCheckedThisInstance = true;
  return "applied";
}

// Idempotent. hosts keep the whisky app's shape (role, manager_id, verified,
// group_id) so app/lib/auth.ts is unchanged; a producer is a host.
export async function initSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS hosts (
      id serial PRIMARY KEY,
      name text NOT NULL,
      passcode text NOT NULL,
      role text NOT NULL DEFAULT 'host',
      manager_id int REFERENCES hosts(id),
      verified boolean NOT NULL DEFAULT true,
      group_id int,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id serial PRIMARY KEY,
      host_id int NOT NULL REFERENCES hosts(id),
      name text NOT NULL,
      location text,
      event_code text UNIQUE NOT NULL,
      currency text NOT NULL DEFAULT '£',
      samples jsonb,
      line_up_locked boolean NOT NULL DEFAULT true,
      revealed boolean NOT NULL DEFAULT false,
      archived boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS attendees (
      id serial PRIMARY KEY,
      session_id int NOT NULL REFERENCES sessions(id),
      pseudonym text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  // One row per person per session: their three choices, the split they were
  // dealt, and the buy answer for the sample they preferred.
  await sql`
    CREATE TABLE IF NOT EXISTS tastings (
      id serial PRIMARY KEY,
      session_id int NOT NULL REFERENCES sessions(id),
      attendee_id int REFERENCES attendees(id),
      pair_choices jsonb,
      pair_split int,
      finished boolean NOT NULL DEFAULT false,
      buy boolean,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS tastings_one_per_person ON tastings (session_id, attendee_id) WHERE attendee_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_host_idx ON sessions (host_id, created_at DESC)`;
}

// HQ and one producer for demonstrations, if the table is empty.
export async function seedHosts() {
  const sql = getSql();
  const existing = await sql`SELECT count(*)::int AS n FROM hosts`;
  if (existing[0].n > 0) return { seededHosts: false };
  const hqCode = process.env.HQ_PASSCODE || "edinburgh";
  const mgrCode = process.env.MANAGER_PASSCODE || "banchory";
  const hq = await sql`
    INSERT INTO hosts (name, passcode, role) VALUES ('tastaDRAM', ${hqCode}, 'hq')
    RETURNING id`;
  await sql`
    INSERT INTO hosts (name, passcode, role, manager_id)
    VALUES ('Producer (demonstration)', ${mgrCode}, 'host', ${hq[0].id})`;
  return { seededHosts: true };
}

export interface HostRow {
  id: number;
  name: string;
  role: "hq" | "manager" | "host";
  manager_id: number | null;
  verified: boolean;
  group_id: number | null;
}
