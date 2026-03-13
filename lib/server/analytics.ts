import { neon } from "@neondatabase/serverless";

function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export async function ensureSignInsTable(): Promise<void> {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS sign_ins (
      username TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function recordSignIn(username: string): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO sign_ins (username, count, last_seen_at)
      VALUES (${username}, 1, now())
      ON CONFLICT (username)
      DO UPDATE SET count = sign_ins.count + 1, last_seen_at = now()
    `;
  } catch (error) {
    console.error("Failed to record sign-in", error);
  }
}
