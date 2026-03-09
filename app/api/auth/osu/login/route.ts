import { NextResponse } from "next/server";
import { applyOAuthStateCookie } from "@/lib/server/cookies";
import { buildOsuAuthorizationUrl, getMissingOsuEnvKeys } from "@/lib/server/osu-api";
import { buildHomeUrl } from "@/lib/server/redirects";

export async function GET(request: Request) {
  const missing = getMissingOsuEnvKeys();

  if (missing.length > 0) {
    return NextResponse.redirect(buildHomeUrl(request.url, { auth: "missing_env" }));
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildOsuAuthorizationUrl(state));

  applyOAuthStateCookie(response, state);

  return response;
}
