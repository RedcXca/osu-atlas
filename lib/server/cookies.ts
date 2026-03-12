import "server-only";

import { deflateSync, inflateSync } from "node:zlib";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { StoredSession } from "@/lib/models";

export const OAUTH_STATE_COOKIE_NAME = "osu_friends_map_oauth_state";

// session data is compressed + chunked across multiple cookies
const SESSION_COOKIE_PREFIX = "osu_sess_";
const CHUNK_SIZE = 3500;

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

// --- oauth state ---

export function applyOAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 60 * 10,
    name: OAUTH_STATE_COOKIE_NAME,
    value: state
  });
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    name: OAUTH_STATE_COOKIE_NAME,
    value: ""
  });
}

export async function readOAuthStateFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value ?? null;
}

// --- session (compressed + chunked) ---

function compressSession(session: StoredSession): string {
  const json = JSON.stringify(session);
  const compressed = deflateSync(Buffer.from(json, "utf-8"));
  return compressed.toString("base64");
}

function decompressSession(encoded: string): StoredSession | null {
  try {
    const compressed = Buffer.from(encoded, "base64");
    const json = inflateSync(compressed).toString("utf-8");
    return JSON.parse(json) as StoredSession;
  } catch {
    return null;
  }
}

export function applySessionCookie(response: NextResponse, session: StoredSession) {
  const encoded = compressSession(session);
  const chunkCount = Math.ceil(encoded.length / CHUNK_SIZE);

  // write chunks
  for (let i = 0; i < chunkCount; i++) {
    response.cookies.set({
      ...BASE_COOKIE_OPTIONS,
      name: `${SESSION_COOKIE_PREFIX}${i}`,
      value: encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    });
  }

  // store chunk count so we know how many to read
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: `${SESSION_COOKIE_PREFIX}n`,
    value: String(chunkCount)
  });
}

export function clearSessionCookie(response: NextResponse) {
  // clear up to 20 chunks (more than enough)
  for (let i = 0; i < 20; i++) {
    response.cookies.set({
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
      name: `${SESSION_COOKIE_PREFIX}${i}`,
      value: ""
    });
  }

  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    name: `${SESSION_COOKIE_PREFIX}n`,
    value: ""
  });
}

export async function readSessionFromCookies(): Promise<StoredSession | null> {
  const cookieStore = await cookies();
  const countCookie = cookieStore.get(`${SESSION_COOKIE_PREFIX}n`);

  if (!countCookie?.value) {
    return null;
  }

  const chunkCount = parseInt(countCookie.value, 10);

  if (isNaN(chunkCount) || chunkCount < 1) {
    return null;
  }

  let encoded = "";

  for (let i = 0; i < chunkCount; i++) {
    const chunk = cookieStore.get(`${SESSION_COOKIE_PREFIX}${i}`);

    if (!chunk?.value) {
      return null;
    }

    encoded += chunk.value;
  }

  return decompressSession(encoded);
}
