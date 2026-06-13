import { NextResponse } from "next/server";
import { getTripData } from "@/lib/trip-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getTripData();

    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check failed", error);

    return NextResponse.json(
      { status: "unavailable" },
      {
        headers: { "Cache-Control": "no-store" },
        status: 503,
      },
    );
  }
}
