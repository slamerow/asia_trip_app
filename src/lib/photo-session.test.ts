import { describe, expect, it } from "vitest";
import { createSignedSessionToken, isValidSignedSessionToken } from "./photo-session";

const secret = "test-session-secret";
const now = 1_800_000_000;

describe("signed photo sessions", () => {
  it("accepts an untampered token before its expiry", () => {
    const token = createSignedSessionToken(secret, 60, now);

    expect(isValidSignedSessionToken(token, secret, now + 59)).toBe(true);
  });

  it("rejects a token at or after its expiry", () => {
    const token = createSignedSessionToken(secret, 60, now);

    expect(isValidSignedSessionToken(token, secret, now + 60)).toBe(false);
  });

  it("rejects tampered, malformed, or incorrectly signed tokens", () => {
    const token = createSignedSessionToken(secret, 60, now);
    const [expiresAt, signature] = token.split(".");

    expect(isValidSignedSessionToken(`${Number(expiresAt) + 600}.${signature}`, secret, now)).toBe(false);
    expect(isValidSignedSessionToken(token, "different-secret", now)).toBe(false);
    expect(isValidSignedSessionToken("not-a-token", secret, now)).toBe(false);
    expect(isValidSignedSessionToken(`${token}.extra`, secret, now)).toBe(false);
  });
});
