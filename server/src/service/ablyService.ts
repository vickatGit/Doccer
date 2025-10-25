// src/services/ablyService.ts
import Ably from "ably";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.ABLY_API_KEY) {
  throw new Error("ABLY_API_KEY must be set in env");
}

// Ably REST client (server-side)
const rest = new Ably.Rest({ key: process.env.ABLY_API_KEY });

// Channel name helpers
const userChannelName = (userId: string) => `user:${userId}`;
const roomChannelName = (roomId: string) => `room:${roomId}`;

/**
 * createTokenRequestForUser(userId)
 * - Returns a token-request object for client to use.
 * - Pass clientId=userId so presence works correctly.
 */
export async function createTokenRequestForUser(userId?: string) {
  try {
    const options: any = {};
    if (userId) options.clientId = userId.toString();

    console.log("Creating token request for user:", userId);

    const tokenRequest = await rest.auth.createTokenRequest(options);
    return tokenRequest;
  } catch (err) {
    console.error("Error creating Ably token request:", err);
    throw err;
  }
}

/**
 * publishToRoom(roomId, eventName, payload)
 */
export async function publishToRoom(
  roomId: string,
  eventName: string,
  payload: any
) {
  try {
    await rest.channels
      .get(roomChannelName(roomId))
      .publish(eventName, payload);
  } catch (err) {
    console.error("publishToRoom error:", err);
  }
}

/**
 * publishToUser(userId, eventName, payload)
 */
export async function publishToUser(
  userId: string,
  eventName: string,
  payload: any
) {
  try {
    await rest.channels
      .get(userChannelName(userId))
      .publish(eventName, payload);
  } catch (err) {
    console.error("publishToUser error:", err);
  }
}

/**
 * publishResponseStarted(roomId, userId, meta)
 * - publish to room for online viewers
 * - publish to user channel so offline users see chat-list update
 */
export async function publishResponseStarted(
  roomId: string,
  userId: string,
  meta: { requestId?: string; promptSnippet?: string; startedAt?: string } = {}
) {
  const payload = {
    roomId,
    userId,
    promptSnippet: meta.promptSnippet || "",
    requestId: meta.requestId || undefined,
    startedAt: meta.startedAt || new Date().toISOString(),
  };

  // publish to room and user channel
  await publishToRoom(roomId, "responseStart", payload);
  await publishToUser(userId, "responseStart", payload);
}

/**
 * publishResponseStreamChunk(roomId, userId, chunk, seq)
 * - only published to the room channel (online users)
 */
export async function publishResponseStreamChunk(
  roomId: string,
  userId: string,
  chunk: string,
  seq?: number
) {
  const payload = {
    roomId,
    userId,
    chunk,
    seq: seq ?? 0,
    ts: new Date().toISOString(),
  };
  await publishToRoom(roomId, "responseStream", payload);
}

/**
 * publishResponseDone(roomId, userId, finalPayload)
 * - publish to room and to user channel (so offline users get final update)
 */
export async function publishResponseDone(
  roomId: string,
  userId: string,
  finalPayload: { text: any; tokens?: number; finishedAt?: string }
) {
  const payload = {
    roomId,
    userId,
    final: finalPayload.text,
    tokens: finalPayload.tokens ?? undefined,
    finishedAt: finalPayload.finishedAt || new Date().toISOString(),
  };

  await publishToRoom(roomId, "responseDone", payload);
  await publishToUser(userId, "responseDone", payload);
}

/**
 * publishResponseFailed(roomId, userId, errorPayload)
 * - publish to room (so online viewers get error)
 * - publish to user channel (so offline user gets notified)
 */
export async function publishResponseFailed(
  roomId: string,
  userId: string,
  errorPayload: { code?: string; message: string; details?: any } = {
    message: "AI generation failed",
  }
) {
  const payload = {
    roomId,
    userId,
    error: errorPayload,
    ts: new Date().toISOString(),
  };

  // publish to both room and user
  await publishToRoom(roomId, "responseFailed", payload);
  await publishToUser(userId, "responseFailed", payload);
}

/**
 * getRoomPresenceMembers(roomId)
 * - Returns presence members via REST client (useful if you need to inspect server-side)
 */
export function getRoomPresenceMembers(roomId: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const channel = rest.channels.get(roomChannelName(roomId));
    (channel.presence as any).get((err: any, members: any[]) => {
      if (err) return reject(err);
      resolve(members || []);
    });
  });
}

/**
 * Exports
 */
export default {
  createTokenRequestForUser,
  publishToRoom,
  publishToUser,
  publishResponseStarted,
  publishResponseStreamChunk,
  publishResponseDone,
  publishResponseFailed,
  getRoomPresenceMembers,
};
