import { describe, expect, it } from "vitest";
import { LoginRateLimiter } from "./login-rate-limit";

describe("LoginRateLimiter", () => {
  it("allows attempts until the failure limit is reached", () => {
    const limiter = new LoginRateLimiter(3, 60);

    expect(limiter.recordFailure("visitor", 100)).toEqual({ allowed: true });
    expect(limiter.recordFailure("visitor", 101)).toEqual({ allowed: true });
    expect(limiter.recordFailure("visitor", 102)).toEqual({
      allowed: false,
      retryAfterSeconds: 58,
    });
  });

  it("keeps visitors isolated from one another", () => {
    const limiter = new LoginRateLimiter(1, 60);

    limiter.recordFailure("visitor-a", 100);

    expect(limiter.check("visitor-a", 101).allowed).toBe(false);
    expect(limiter.check("visitor-b", 101)).toEqual({ allowed: true });
  });

  it("allows attempts after the window expires", () => {
    const limiter = new LoginRateLimiter(1, 60);

    limiter.recordFailure("visitor", 100);

    expect(limiter.check("visitor", 159).allowed).toBe(false);
    expect(limiter.check("visitor", 160)).toEqual({ allowed: true });
  });

  it("clears failures after a successful login", () => {
    const limiter = new LoginRateLimiter(2, 60);

    limiter.recordFailure("visitor", 100);
    limiter.reset("visitor");

    expect(limiter.check("visitor", 101)).toEqual({ allowed: true });
  });
});
