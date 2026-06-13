import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSignedSessionToken, isValidSignedSessionToken } from "@/lib/photo-session";

export const PHOTO_SESSION_COOKIE = "asia_trip_photo_access";
export const PHOTO_SESSION_SECONDS = 60 * 60 * 24 * 180;

export type PhotoMember = {
  id: "00000000-0000-0000-0000-000000000001";
  label: "Trip member";
};

export function isPhotoPasswordConfigured(): boolean {
  return Boolean(process.env.PHOTO_UPLOAD_PASSWORD && process.env.PHOTO_SESSION_SECRET);
}

export function isCorrectPhotoPassword(password: string): boolean {
  const expected = process.env.PHOTO_UPLOAD_PASSWORD;

  if (!expected) return false;
  return safeEqual(password, expected);
}

export function createPhotoSessionToken(): string {
  const secret = process.env.PHOTO_SESSION_SECRET;

  if (!secret) return "";
  return createSignedSessionToken(secret, PHOTO_SESSION_SECONDS);
}

export async function getPhotoMember(): Promise<PhotoMember | null> {
  const token = (await cookies()).get(PHOTO_SESSION_COOKIE)?.value;

  const secret = process.env.PHOTO_SESSION_SECRET;

  if (!token || !secret || !isValidSignedSessionToken(token, secret)) return null;
  return {
    id: "00000000-0000-0000-0000-000000000001",
    label: "Trip member",
  };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
