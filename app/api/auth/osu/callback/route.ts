import { NextResponse } from "next/server";
import {
  applySessionCookie,
  clearOAuthStateCookie,
  readOAuthStateFromCookies
} from "@/lib/server/cookies";
import { buildFriendSnapshot } from "@/lib/domain/friend-snapshot";
import {
  exchangeAuthorizationCode,
  fetchFriends,
  fetchOwnProfile,
  getTokenExpiryTimestamp,
  toOsuViewer
} from "@/lib/server/osu-api";
import { buildHomeUrl } from "@/lib/server/redirects";
import { createStoredSession } from "@/lib/server/session-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(buildHomeUrl(request.url, { auth: "missing_code" }));
  }

  const expectedState = await readOAuthStateFromCookies();

  if (!state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(buildHomeUrl(request.url, { auth: "invalid_state" }));
    clearOAuthStateCookie(response);
    return response;
  }

  try {
    const token = await exchangeAuthorizationCode(code);
    const viewer = toOsuViewer(await fetchOwnProfile(token.access_token));
    const friends = await fetchFriends(token.access_token);
    const snapshot = buildFriendSnapshot(viewer, friends);
    const session = createStoredSession({
      accessToken: token.access_token,
      accessTokenExpiresAt: getTokenExpiryTimestamp(token.expires_in),
      refreshToken: token.refresh_token,
      snapshot,
      viewer
    });

    const response = NextResponse.redirect(new URL("/", request.url));

    applySessionCookie(response, session.id);
    clearOAuthStateCookie(response);

    return response;
  } catch (error) {
    console.error("osu callback failed", error);
    const response = NextResponse.redirect(buildHomeUrl(request.url, { auth: "callback_failed" }));
    clearOAuthStateCookie(response);
    return response;
  }
}
