import PusherServer from "pusher";
import PusherClient from "pusher-js";

// ─── Server-side Pusher (for triggering events from API routes) ───
let _pusherServer: PusherServer | null = null;

export function getPusherServer(): PusherServer {
  if (!_pusherServer) {
    if (
      !process.env.PUSHER_APP_ID ||
      !process.env.PUSHER_KEY ||
      !process.env.PUSHER_SECRET ||
      !process.env.PUSHER_CLUSTER
    ) {
      throw new Error("Pusher server env vars not set");
    }
    _pusherServer = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return _pusherServer;
}

// ─── Client-side Pusher singleton ───
let _pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    throw new Error("getPusherClient() must only be called on the client");
  }
  if (!_pusherClient) {
    _pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return _pusherClient;
}

// ─── Channel / event names ───
export const CHANNELS = {
  giveaway: (id: string) => `giveaway-${id}`,
};

export const EVENTS = {
  DRAW_COMPLETE: "draw:complete",    // winners announced
  ENTRY_COUNT:   "entry:count",     // live entry count update
};
