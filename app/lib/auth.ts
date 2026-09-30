import { cookies } from "next/headers";
import crypto from "crypto";
import { getSql, HostRow } from "./db";

const COOKIE = "tw_auth";

function secret() {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

function sign(id: number) {
  const mac = crypto.createHmac("sha256", secret()).update(String(id)).digest("hex");
  return `${id}.${mac}`;
}

function verify(token: string): number | null {
  const [idStr, mac] = token.split(".");
  if (!idStr || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(idStr).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const id = parseInt(idStr, 10);
  return Number.isFinite(id) ? id : null;
}

export async function setAuthCookie(id: number) {
  const c = await cookies();
  c.set(COOKIE, sign(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie() {
  const c = await cookies();
  c.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function currentHost(): Promise<HostRow | null> {
  const c = await cookies();
  const tok = c.get(COOKIE)?.value;
  if (!tok) return null;
  const id = verify(tok);
  if (id == null) return null;
  const sql = getSql();
  const rows = await sql`SELECT id, name, role, manager_id, verified, group_id FROM hosts WHERE id = ${id}`;
  return (rows[0] as HostRow) ?? null;
}
