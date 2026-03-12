import { NextResponse } from "next/server";
import { buildFriendSnapshot } from "@/lib/domain/friend-snapshot";
import { readSessionFromCookies, applySessionCookie } from "@/lib/server/cookies";
import { fetchFriends, OsuApiError } from "@/lib/server/osu-api";

export async function POST() {
  const session = await readSessionFromCookies();

  if (!session) {
    return NextResponse.json({ error: "You need to sign in before syncing." }, { status: 401 });
  }

  try {
    const friends = await fetchFriends(session.accessToken);
    const snapshot = buildFriendSnapshot(session.viewer, friends);
    const updatedSession = {
      ...session,
      snapshot,
      updatedAt: new Date().toISOString()
    };

    const response = NextResponse.json({
      ok: true,
      syncedAt: snapshot.syncedAt,
      totals: snapshot.totals
    });

    applySessionCookie(response, updatedSession);

    return response;
  } catch (error) {
    if (error instanceof OsuApiError && error.status === 401) {
      return NextResponse.json(
        { error: "Your osu! session expired. Sign in again." },
        { status: 401 }
      );
    }

    console.error("friend sync failed", error);
    return NextResponse.json(
      { error: "The osu! sync failed. The token may have expired." },
      { status: 500 }
    );
  }
}
