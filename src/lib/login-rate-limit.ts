export type LoginRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type Attempt = {
  failures: number;
  windowStartedAt: number;
};

export class LoginRateLimiter {
  private readonly attempts = new Map<string, Attempt>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowSeconds: number,
    private readonly maxEntries = 10_000,
  ) {}

  check(key: string, nowSeconds = currentTimeSeconds()): LoginRateLimitResult {
    const attempt = this.getCurrentAttempt(key, nowSeconds);

    if (!attempt || attempt.failures < this.maxFailures) return { allowed: true };

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, attempt.windowStartedAt + this.windowSeconds - nowSeconds),
    };
  }

  recordFailure(key: string, nowSeconds = currentTimeSeconds()): LoginRateLimitResult {
    const current = this.getCurrentAttempt(key, nowSeconds);
    const attempt = current
      ? { ...current, failures: current.failures + 1 }
      : { failures: 1, windowStartedAt: nowSeconds };

    this.attempts.set(key, attempt);
    this.prune(nowSeconds);
    return this.check(key, nowSeconds);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private getCurrentAttempt(key: string, nowSeconds: number): Attempt | null {
    const attempt = this.attempts.get(key);

    if (!attempt) return null;
    if (nowSeconds < attempt.windowStartedAt + this.windowSeconds) return attempt;

    this.attempts.delete(key);
    return null;
  }

  private prune(nowSeconds: number): void {
    for (const [key, attempt] of this.attempts) {
      if (nowSeconds >= attempt.windowStartedAt + this.windowSeconds) this.attempts.delete(key);
    }

    while (this.attempts.size > this.maxEntries) {
      const oldestKey = this.attempts.keys().next().value;
      if (typeof oldestKey !== "string") break;
      this.attempts.delete(oldestKey);
    }
  }
}

function currentTimeSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
