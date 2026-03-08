import { NextResponse } from "next/server";
import { clearSessionCookie, readSessionIdFromCookies } from "@/lib/server/cookies";
import { deleteStoredSession } from "@/lib/server/session-store";

export async function GET(request: Request) {
  const sessionId = await readSessionIdFromCookies();

  if (sessionId) {
    deleteStoredSession(sessionId);
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(response);

  return response;
}
