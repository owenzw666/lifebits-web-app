export const AUTH_EXPIRED_EVENT = "lifebits:auth-expired";
export const AUTH_TOKEN_CHANGED_EVENT = "lifebits:auth-token-changed";

let accessToken: string | null = null;

export interface JwtPayload {
  exp?: number;
  email?: string;
  email_verified?: string;
}

// The short-lived access token stays in memory only. The browser keeps the
// long-lived refresh credential in an HttpOnly cookie that scripts cannot read.
export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split(".");

    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

export const getAuthProfile = (token: string | null) => {
  if (!token) {
    return {
      email: null,
      isEmailVerified: false,
    };
  }

  const payload = decodeJwtPayload(token);

  return {
    email: payload?.email ?? null,
    isEmailVerified: payload?.email_verified === "true",
  };
};
