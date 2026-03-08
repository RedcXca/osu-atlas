import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "osu_friends_map_session";
export const OAUTH_STATE_COOKIE_NAME = "osu_friends_map_oauth_state";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

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

export function applySessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    name: SESSION_COOKIE_NAME,
    value: sessionId
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
    name: SESSION_COOKIE_NAME,
    value: ""
  });
}

export async function readOAuthStateFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value ?? null;
}

export async function readSessionIdFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
