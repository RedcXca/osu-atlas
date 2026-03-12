import { NextResponse } from "next/server";
import {
  applySessionCookie,
  clearOAuthStateCookie,
  readOAuthStateFromCookies
} from "@/lib/server/cookies";
import {
  exchangeAuthorizationCode,
  fetchOwnProfile,
  getTokenExpiryTimestamp,
  toOsuViewer
} from "@/lib/server/osu-api";
import { buildHomeUrl } from "@/lib/server/redirects";

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

    const response = NextResponse.redirect(new URL("/", request.url));

    applySessionCookie(response, {
      accessToken: token.access_token,
      accessTokenExpiresAt: getTokenExpiryTimestamp(token.expires_in),
      refreshToken: token.refresh_token,
      viewer
    });
    clearOAuthStateCookie(response);

    return response;
  } catch (error) {
    console.error("osu callback failed", error);
    const response = NextResponse.redirect(buildHomeUrl(request.url, { auth: "callback_failed" }));
    clearOAuthStateCookie(response);
    return response;
  }
}
