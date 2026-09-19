/**
 * Portfolio 2.0 — BOB API Rate Limiter
 * 
 * Provides defense-in-depth protection against API abuse, flood attacks,
 * and uncontrolled Gemini token consumption.
 * 
 * Features:
 * 1. Window Limiting: Max 15 requests per minute per IP.
 * 2. Burst Protection: Max 3 requests in any 5-second interval.
 * 3. Memory Cleanup: Automatic periodic sweep of stale IP records.
 */

export class BobRateLimiter {
  constructor(options = {}) {
    this.maxPerMinute = options.maxPerMinute || 25;
    this.burstLimit = options.burstLimit || 6;
    this.burstWindowMs = options.burstWindowMs || 5000;
    this.windowMs = options.windowMs || 60000;

    // Map: IP -> { timestamps: number[] }
    this.clients = new Map();

    // Periodic sweep every 5 minutes
    this.sweepInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Ensure timer does not prevent process exit in Node
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  /**
   * Checks if an IP is allowed to make a request.
   * @param {string} ip
   * @returns {{ allowed: boolean, retryAfter?: number, message?: string }}
   */
  check(ip) {
    const safeIp = ip || 'unknown-client';
    const now = Date.now();

    let client = this.clients.get(safeIp);
    if (!client) {
      client = { timestamps: [] };
      this.clients.set(safeIp, client);
    }

    // Filter out timestamps older than the 1-minute window
    client.timestamps = client.timestamps.filter(t => now - t < this.windowMs);

    // 1. Check burst window (last 5 seconds)
    const recentBurst = client.timestamps.filter(t => now - t < this.burstWindowMs);
    if (recentBurst.length >= this.burstLimit) {
      const oldestInBurst = recentBurst[0];
      const waitSec = Math.max(1, Math.ceil((this.burstWindowMs - (now - oldestInBurst)) / 1000));
      return {
        allowed: false,
        retryAfter: waitSec,
        message: 'You are sending messages too quickly. Please wait a moment.'
      };
    }

    // 2. Check 1-minute window
    if (client.timestamps.length >= this.maxPerMinute) {
      const oldest = client.timestamps[0];
      const waitSec = Math.max(1, Math.ceil((this.windowMs - (now - oldest)) / 1000));
      return {
        allowed: false,
        retryAfter: waitSec,
        message: 'Rate limit reached. Please wait a moment before sending another message.'
      };
    }

    // Record this valid request timestamp
    client.timestamps.push(now);
    return { allowed: true };
  }

  /**
   * Removes stale clients whose timestamps are completely outside the window
   */
  cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.clients.entries()) {
      data.timestamps = data.timestamps.filter(t => now - t < this.windowMs);
      if (data.timestamps.length === 0) {
        this.clients.delete(ip);
      }
    }
  }

  /**
   * Resets rate limits (useful for test suites)
   */
  reset() {
    this.clients.clear();
  }
}

// Export singleton instance for app-wide use
export const rateLimiter = new BobRateLimiter();
