import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? `${process.env.TURSO_DATABASE_URL.substring(0, 30)}...` : "NOT SET",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "SET (length: " + process.env.TURSO_AUTH_TOKEN.length + ")" : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL || "NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
