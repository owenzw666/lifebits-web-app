import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";
import Login from "./login";
import { loginApi } from "../api/authApi";

vi.mock("../api/authApi", () => ({
  googleLoginApi: vi.fn(),
  loginApi: vi.fn(),
  resendVerificationApi: vi.fn(),
}));

vi.mock("../api/http", () => ({
  getApiErrorMessage: (_error: unknown, fallbackMessage: string) => fallbackMessage,
}));

vi.mock("../utils/googleIdentity", () => ({
  loadGoogleIdentity: vi.fn(),
}));

const mockedLoginApi = vi.mocked(loginApi);

const renderLogin = (authOverrides: Partial<AuthContextValue> = {}) => {
  const auth: AuthContextValue = {
    token: null,
    isInitializing: false,
    isAuthenticated: false,
    email: null,
    isEmailVerified: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...authOverrides,
  };

  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  return auth;
};

describe("Login", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits trimmed email and password, then stores the returned token", async () => {
    mockedLoginApi.mockResolvedValue({
      token: "signed-in-token",
      email: "demo@lifebits.test",
      isEmailVerified: true,
    });
    const auth = renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Email"), " demo@lifebits.test ");
    await userEvent.type(screen.getByPlaceholderText("Password"), "TestPass123!");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockedLoginApi).toHaveBeenCalledWith({
        email: "demo@lifebits.test",
        password: "TestPass123!",
      });
    });
    expect(auth.login).toHaveBeenCalledWith("signed-in-token");
  });

  it("shows a friendly error when login fails", async () => {
    mockedLoginApi.mockRejectedValue(new Error("Network failed"));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Email"), "demo@lifebits.test");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not log in. Please try again.",
    );
  });
});
