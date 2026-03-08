import "server-only";

import { getTokenExpiryTimestamp, refreshAccessToken } from "@/lib/server/osu-api";
import {
  getStoredSession,
  updateStoredSessionTokens
} from "@/lib/server/session-store";

function shouldRefreshToken(accessTokenExpiresAt: string | null) {
  if (!accessTokenExpiresAt) {
    return false;
  }

  return new Date(accessTokenExpiresAt).getTime() - Date.now() < 60_000;
}

type GetValidAccessTokenOptions = {
  forceRefresh?: boolean;
};

export async function getValidAccessToken(
  sessionId: string,
  options?: GetValidAccessTokenOptions
) {
  const session = getStoredSession(sessionId);

  if (!session) {
    return null;
  }

  if (!options?.forceRefresh && !shouldRefreshToken(session.accessTokenExpiresAt)) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    return session.accessToken;
  }

  const refreshedTokens = await refreshAccessToken(session.refreshToken);
  const updatedSession = updateStoredSessionTokens(sessionId, {
    accessToken: refreshedTokens.access_token,
    accessTokenExpiresAt: getTokenExpiryTimestamp(refreshedTokens.expires_in),
    refreshToken: refreshedTokens.refresh_token ?? session.refreshToken
  });

  return updatedSession?.accessToken ?? refreshedTokens.access_token;
}
