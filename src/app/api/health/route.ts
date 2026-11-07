import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    // Probe database connectivity with minimal overhead
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        app: "RaamBow Client Management",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: "connected",
        databaseLatencyMs: latencyMs,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error("Health check database probe failed:", error?.message || error);

    return NextResponse.json(
      {
        status: "degraded",
        app: "RaamBow Client Management",
        timestamp: new Date().toISOString(),
        database: "unreachable",
        databaseLatencyMs: latencyMs,
        error: "Database connectivity check failed.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

