import "server-only";

import type { FriendSnapshot, OsuViewer, StoredSession } from "@/lib/models";

type CreateStoredSessionInput = {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  refreshToken?: string;
  snapshot: FriendSnapshot;
  viewer: OsuViewer;
};

type SessionStoreState = {
  sessions: Map<string, StoredSession>;
};

declare global {
  var __osuFriendsMapSessionStore: SessionStoreState | undefined;
}

const store = globalThis.__osuFriendsMapSessionStore ?? {
  sessions: new Map<string, StoredSession>()
};

globalThis.__osuFriendsMapSessionStore = store;

export function createStoredSession({
  accessToken,
  accessTokenExpiresAt,
  refreshToken,
  snapshot,
  viewer
}: CreateStoredSessionInput): StoredSession {
  const now = new Date().toISOString();
  const session: StoredSession = {
    accessToken,
    accessTokenExpiresAt,
    createdAt: now,
    id: crypto.randomUUID(),
    refreshToken,
    snapshot,
    updatedAt: now,
    viewer
  };

  store.sessions.set(session.id, session);

  return session;
}

export function deleteStoredSession(sessionId: string) {
  store.sessions.delete(sessionId);
}

export function getStoredSession(sessionId: string) {
  return store.sessions.get(sessionId) ?? null;
}

export function updateStoredSessionSnapshot(
  sessionId: string,
  snapshot: FriendSnapshot
) {
  const session = store.sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const updatedSession: StoredSession = {
    ...session,
    snapshot,
    updatedAt: new Date().toISOString()
  };

  store.sessions.set(sessionId, updatedSession);

  return updatedSession;
}

export function updateStoredSessionTokens(
  sessionId: string,
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: string | null;
    refreshToken?: string;
  }
) {
  const session = store.sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const updatedSession: StoredSession = {
    ...session,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshToken: tokens.refreshToken ?? session.refreshToken,
    updatedAt: new Date().toISOString()
  };

  store.sessions.set(sessionId, updatedSession);

  return updatedSession;
}
