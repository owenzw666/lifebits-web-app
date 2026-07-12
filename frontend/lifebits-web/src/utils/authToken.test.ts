import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAccessToken,
  getAuthProfile,
  isTokenExpired,
  setAccessToken,
} from "./authToken";

const createToken = (payload: object) => {
  const encodedPayload = window
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `header.${encodedPayload}.signature`;
};

describe("authToken", () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.useRealTimers();
  });

  it("stores the access token in memory", () => {
    setAccessToken("test-token");

    expect(getAccessToken()).toBe("test-token");
  });

  it("reads email details from the JWT payload", () => {
    const token = createToken({
      email: "demo@lifebits.test",
      email_verified: "true",
    });

    expect(getAuthProfile(token)).toEqual({
      email: "demo@lifebits.test",
      isEmailVerified: true,
    });
  });

  it("treats expired or invalid tokens as expired", () => {
    vi.setSystemTime(new Date("2026-07-12T00:00:00Z"));

    const expiredToken = createToken({
      exp: Math.floor(Date.parse("2026-07-11T23:59:00Z") / 1000),
    });

    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(isTokenExpired("not-a-jwt")).toBe(true);
  });
});
