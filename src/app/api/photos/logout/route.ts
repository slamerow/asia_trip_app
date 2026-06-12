import { NextResponse } from "next/server";
import { PHOTO_SESSION_COOKIE } from "@/lib/photo-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PHOTO_SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
