import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { OsuViewer } from "@/lib/models";

export const OAUTH_STATE_COOKIE_NAME = "osu_friends_map_oauth_state";
const SESSION_COOKIE_NAME = "osu_friends_map_session";

type SessionCookieData = {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  refreshToken?: string;
  viewer: OsuViewer;
};

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

// --- session (tokens + viewer only) ---

export function applySessionCookie(response: NextResponse, data: SessionCookieData) {
  const value = Buffer.from(JSON.stringify(data)).toString("base64");

  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: SESSION_COOKIE_NAME,
    value
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    name: SESSION_COOKIE_NAME,
    value: ""
  });

  // clean up old chunked cookies from previous implementation
  for (let i = 0; i < 20; i++) {
    response.cookies.set({
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
      name: `osu_sess_${i}`,
      value: ""
    });
  }

  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    name: "osu_sess_n",
    value: ""
  });
}

export async function readSessionFromCookies(): Promise<SessionCookieData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  try {
    const json = Buffer.from(cookie.value, "base64").toString("utf-8");
    return JSON.parse(json) as SessionCookieData;
  } catch {
    return null;
  }
}
