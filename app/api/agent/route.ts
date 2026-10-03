import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      message,
      customerId,
      sessionId,
    } = body;

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 },
      );
    }

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "customerId is required",
        },
        { status: 400 },
      );
    }

    const finalSessionId =
      sessionId ||
      `session-${Date.now()}`;

    const result = await runAgent({
      message,
      customerId,
      sessionId: finalSessionId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}