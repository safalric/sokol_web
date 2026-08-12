const RETENTION_MS = 24 * 60 * 60 * 1_000;

async function hashClientKey(value, secret) {
  const bytes = new TextEncoder().encode(`${secret}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function consumeDurableRateLimit(database, client, secret, timestamp, windowMs) {
  if (!database || client === "unknown") throw new Error("Durable rate limiting is unavailable");

  const clientHash = await hashClientKey(client, secret);
  const windowStart = Math.floor(timestamp / windowMs) * windowMs;
  const result = await database.prepare(`
    INSERT INTO registration_rate_limits (client_hash, window_start, attempt_count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(client_hash, window_start) DO UPDATE SET
      attempt_count = registration_rate_limits.attempt_count + 1,
      updated_at = excluded.updated_at
    RETURNING attempt_count
  `).bind(clientHash, windowStart, timestamp).first();

  if (Math.random() < 0.02) {
    await database.prepare("DELETE FROM registration_rate_limits WHERE updated_at < ?")
      .bind(timestamp - RETENTION_MS).run();
  }

  return Number(result?.attempt_count || 0);
}
