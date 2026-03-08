import "server-only";

import { APP_ROUTES } from "@/lib/config/routes";

export function buildHomeUrl(requestUrl: string, searchParams?: Record<string, string>) {
  const url = new URL(APP_ROUTES.home, requestUrl);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return url;
}
