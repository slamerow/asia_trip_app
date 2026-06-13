import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createPhotoSessionToken,
  isCorrectPhotoPassword,
  isPhotoPasswordConfigured,
  PHOTO_SESSION_COOKIE,
  PHOTO_SESSION_SECONDS,
} from "@/lib/photo-auth";
import { LoginRateLimiter } from "@/lib/login-rate-limit";

const MAX_LOGIN_FAILURES = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const loginRateLimiter = new LoginRateLimiter(MAX_LOGIN_FAILURES, LOGIN_WINDOW_SECONDS);

export async function POST(request: Request) {
  if (!isPhotoPasswordConfigured()) {
    return NextResponse.json({ message: "Photo access is not configured." }, { status: 503 });
  }

  const rateLimitKey = getRateLimitKey(request);
  const limit = loginRateLimiter.check(rateLimitKey);

  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSeconds);

  const body = await readLoginBody(request);
  const password = typeof body.password === "string" ? body.password : "";

  if (!isCorrectPhotoPassword(password)) {
    const nextLimit = loginRateLimiter.recordFailure(rateLimitKey);

    if (!nextLimit.allowed) return rateLimitedResponse(nextLimit.retryAfterSeconds);
    return NextResponse.json({ message: "That password is not correct." }, { status: 401 });
  }

  loginRateLimiter.reset(rateLimitKey);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PHOTO_SESSION_COOKIE, createPhotoSessionToken(), {
    httpOnly: true,
    maxAge: PHOTO_SESSION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

async function readLoginBody(request: Request): Promise<{ password?: unknown }> {
  try {
    return (await request.json()) as { password?: unknown };
  } catch {
    return {};
  }
}

function getRateLimitKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const secret = process.env.PHOTO_SESSION_SECRET ?? "unconfigured";

  return createHash("sha256").update(`${secret}:${address}`).digest("base64url");
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { message: "Too many password attempts. Please try again in a few minutes." },
    {
      headers: { "Retry-After": String(retryAfterSeconds) },
      status: 429,
    },
  );
}
