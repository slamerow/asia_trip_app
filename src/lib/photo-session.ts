import { createHmac, timingSafeEqual } from "node:crypto";

export function createSignedSessionToken(
  secret: string,
  lifetimeSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const expiresAt = nowSeconds + lifetimeSeconds;
  return `${expiresAt}.${sign(String(expiresAt), secret)}`;
}

export function isValidSignedSessionToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const [expiresAtText, signature, ...extra] = token.split(".");
  const expiresAt = Number(expiresAtText);

  if (
    !secret ||
    !expiresAtText ||
    !signature ||
    extra.length > 0 ||
    !Number.isInteger(expiresAt) ||
    expiresAt <= nowSeconds
  ) {
    return false;
  }

  return safeEqual(signature, sign(expiresAtText, secret));
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
