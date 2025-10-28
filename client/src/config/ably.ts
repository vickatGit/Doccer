// src/lib/ablyClient.ts
import Ably from "ably";

let ablyRealtime: any = null;
let userChannel: any = null;
const roomChannels: Map<string, any> = new Map();
const env = import.meta.env.VITE_ENV;
const devBaseurl = import.meta.env.VITE_DEV_BASE_URL;
const prodBaseurl = import.meta.env.VITE_PROD_BASE_URL;

export async function initAblyForUser(userId: string) {
  if (ablyRealtime) return ablyRealtime;

  // request token request from server
  // const { data: tokenRequest } = await docApi.post("/api/ably/token-request");

  // create realtime client using token request (Ably SDK will refresh token using tokenRequest info)
  ablyRealtime = new Ably.Realtime({
    authUrl: `${
      env === "dev" ? devBaseurl : prodBaseurl
    }/api/ably/token-request`,
    authMethod: "POST",
    authHeaders: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
  });

  // optionally handle connection events
  ablyRealtime.connection.on("connected", () => console.log("Ably connected"));
  ablyRealtime.connection.on("failed", (err: any) =>
    console.error("Ably connection failed", err)
  );

  // subscribe to user's channel by default
  userChannel = ablyRealtime.channels.get(`user:${userId}`);

  return ablyRealtime;
}

/**
 * Subscribe to user channel events (chat list updates, offline responseDone/Failed)
 * handlers = { onResponseStart, onResponseDone, onResponseFailed, onNotification }
 */
export function subscribeToUserChannel(userId: string, handlers: any = {}) {
  if (!ablyRealtime) throw new Error("Ably not initialized");
  userChannel = ablyRealtime.channels.get(`user:${userId}`);

  if (handlers.onResponseStart)
    userChannel.subscribe("responseStart", (msg: any) =>
      handlers.onResponseStart(msg.data)
    );
  if (handlers.onResponseDone)
    userChannel.subscribe("responseDone", (msg: any) =>
      handlers.onResponseDone(msg.data)
    );
  if (handlers.onResponseFailed)
    userChannel.subscribe("responseFailed", (msg: any) =>
      handlers.onResponseFailed(msg.data)
    );
  if (handlers.onNotification)
    userChannel.subscribe("notification", (msg: any) =>
      handlers.onNotification(msg.data)
    );

  return userChannel;
}

/**
 * Subscribe to a room channel when user opens that chat
 * handlers = { onResponseStart, onStream, onDone, onFailed }
 */
export function subscribeToRoom(roomId: string, handlers: any = {}) {
  if (!ablyRealtime) throw new Error("Ably not initialized");
  if (roomChannels.has(roomId)) return roomChannels.get(roomId);

  const channel = ablyRealtime.channels.get(`room:${roomId}`);
  roomChannels.set(roomId, channel);

  if (handlers.onResponseStart)
    channel.subscribe("responseStart", (msg: any) =>
      handlers.onResponseStart(msg.data)
    );
  if (handlers.onStream)
    channel.subscribe("responseStream", (msg: any) =>
      handlers.onStream(msg.data)
    );
  if (handlers.onDone)
    channel.subscribe("responseDone", (msg: any) => handlers.onDone(msg.data));
  if (handlers.onFailed)
    channel.subscribe("responseFailed", (msg: any) =>
      handlers.onFailed(msg.data)
    );

  // presence: enter when subscribing (assuming clientId set via tokenRequest)
  try {
    channel.presence.enter({}); // optionally pass data, e.g., { activeAt: Date.now() }
  } catch (e) {
    // sometimes presence.enter will fail if no clientId - ensure your tokenRequest created with clientId
    console.warn(
      "presence.enter failed (ensure tokenRequest used clientId)",
      e
    );
  }

  return channel;
}

/**
 * Unsubscribe from a room when user leaves
 */
export function unsubscribeFromRoom(roomId: string) {
  const ch = roomChannels.get(roomId);
  if (!ch) return;
  try {
    ch.presence.leave();
  } catch (e) {}
  try {
    ch.unsubscribe();
  } catch (e) {}
  roomChannels.delete(roomId);
}

/**
 * Clean up (close client)
 */
export function closeAbly() {
  try {
    userChannel?.unsubscribe();
    roomChannels.forEach((ch) => {
      try {
        ch.unsubscribe();
      } catch (e) {}
    });
    roomChannels.clear();
    ablyRealtime?.close();
    ablyRealtime = null;
    userChannel = null;
  } catch (e) {
    console.error("closeAbly err", e);
  }
}
