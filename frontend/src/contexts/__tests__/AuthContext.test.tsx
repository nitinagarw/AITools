import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { mockAnalystUser } from "@/test/mocks";

vi.mock("@/services/api", () => ({
  userApi: {
    getMe: vi.fn(),
  },
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FT-CTX-01: provides user profile after mount", async () => {
    const { userApi } = await import("@/services/api");
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: mockAnalystUser,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockAnalystUser);
    });
  });

  it("FT-CTX-02: isRole returns true for matching role", async () => {
    const { userApi } = await import("@/services/api");
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: mockAnalystUser,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isRole("analyst")).toBe(true);
    });
  });

  it("FT-CTX-03: isRole returns false for non-matching role", async () => {
    const { userApi } = await import("@/services/api");
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: mockAnalystUser,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isRole("admin")).toBe(false);
    });
  });

  it("FT-CTX-01: handles fetch error gracefully", async () => {
    const { userApi } = await import("@/services/api");
    vi.mocked(userApi.getMe).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Network error");
      expect(result.current.user).toBeNull();
    });
  });
});
