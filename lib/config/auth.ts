export const REQUIRED_OSU_ENV_KEYS = [
  "OSU_CLIENT_ID",
  "OSU_CLIENT_SECRET",
  "OSU_REDIRECT_URI"
] as const;

export type RequiredOsuEnvKey = (typeof REQUIRED_OSU_ENV_KEYS)[number];

export const OSU_OAUTH_SCOPES = ["public", "identify", "friends.read"] as const;

export const AUTH_MESSAGE_BY_CODE: Record<string, string> = {
  callback_failed: "The osu! callback failed. Check your env and redirect URI.",
  invalid_state: "The OAuth state check failed. Try starting login again.",
  missing_code: "osu! did not send back an authorization code.",
  missing_env: "Set your osu! OAuth env vars before using live login."
};
