import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/cookies";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(response);
  return response;
}
