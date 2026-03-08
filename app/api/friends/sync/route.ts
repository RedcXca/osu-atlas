import { NextResponse } from "next/server";
import { buildFriendSnapshot } from "@/lib/domain/friend-snapshot";
import { readSessionIdFromCookies } from "@/lib/server/cookies";
import { fetchFriends, OsuApiError } from "@/lib/server/osu-api";
import { getValidAccessToken } from "@/lib/server/osu-session";
import {
  getStoredSession,
  updateStoredSessionSnapshot
} from "@/lib/server/session-store";

export async function POST() {
  const sessionId = await readSessionIdFromCookies();

  if (!sessionId) {
    return NextResponse.json({ error: "You need to sign in before syncing." }, { status: 401 });
  }

  const session = getStoredSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Your session expired. Sign in again." }, { status: 401 });
  }

  try {
    const accessToken = await getValidAccessToken(sessionId);

    if (!accessToken) {
      return NextResponse.json({ error: "Your session expired. Sign in again." }, { status: 401 });
    }

    let friends;

    try {
      friends = await fetchFriends(accessToken);
    } catch (error) {
      if (!(error instanceof OsuApiError) || error.status !== 401 || !session.refreshToken) {
        throw error;
      }

      const refreshedAccessToken = await getValidAccessToken(sessionId, { forceRefresh: true });

      if (!refreshedAccessToken) {
        return NextResponse.json({ error: "Your session expired. Sign in again." }, { status: 401 });
      }

      friends = await fetchFriends(refreshedAccessToken);
    }

    const snapshot = buildFriendSnapshot(session.viewer, friends);

    updateStoredSessionSnapshot(sessionId, snapshot);

    return NextResponse.json({
      ok: true,
      syncedAt: snapshot.syncedAt,
      totals: snapshot.totals
    });
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
