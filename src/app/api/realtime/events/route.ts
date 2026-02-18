import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { eventStore } from "@/lib/realtime/event-store";

/**
 * GET /api/realtime/events
 * Server-Sent Events endpoint for real-time dashboard updates
 */
export async function GET(req: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = `${session.user.id}-${Date.now()}`;

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`)
      );

      // Subscribe to events
      eventStore.subscribe(clientId, (event) => {
        try {
          const message = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("Error sending event:", error);
        }
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        eventStore.unsubscribe(clientId);
        try {
          controller.close();
        } catch (error) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
