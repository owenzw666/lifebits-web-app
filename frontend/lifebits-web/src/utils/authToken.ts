const TOKEN_KEY = "token";
export const AUTH_EXPIRED_EVENT = "lifebits:auth-expired";

interface JwtPayload {
  exp?: number;
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const storeToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
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

export const getValidStoredToken = () => {
  const token = getStoredToken();

  if (!token) return null;

  if (isTokenExpired(token)) {
    clearStoredToken();
    return null;
  }

  return token;
};
