import { NextRequest, NextResponse } from "next/server";

interface MockRequest {
  cmd?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: MockRequest = await request.json();

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Generate mock joint values (0-180 for demo)
    const mockJoints = [45, 30, 60, 20, 90];

    const mockResponse = {
      received: body,
      status: {
        type: "status",
        status: "ok",
        joints: mockJoints,
        base: {
          vx: Math.random() * 0.1,
          vy: Math.random() * 0.1,
          omega: Math.random() * 0.05,
        },
        errors: [] as string[],
        message: `Received command: ${body.cmd || "unknown"}`,
      },
    };

    // Simulate errors for certain commands
    if (body.cmd === "invalid") {
      mockResponse.status.status = "error";
      mockResponse.status.errors = ["invalid_command"];
      mockResponse.status.message = "Invalid command received";
    }

    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Internal server error",
        errors: ["parse_error"],
      },
      { status: 400 }
    );
  }
}
