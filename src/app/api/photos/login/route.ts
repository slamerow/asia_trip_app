import { NextResponse } from "next/server";
import {
  createPhotoSessionToken,
  isCorrectPhotoPassword,
  isPhotoPasswordConfigured,
  PHOTO_SESSION_COOKIE,
  PHOTO_SESSION_SECONDS,
} from "@/lib/photo-auth";

export async function POST(request: Request) {
  if (!isPhotoPasswordConfigured()) {
    return NextResponse.json({ message: "Photo access is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (!isCorrectPhotoPassword(password)) {
    return NextResponse.json({ message: "That password is not correct." }, { status: 401 });
  }

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
