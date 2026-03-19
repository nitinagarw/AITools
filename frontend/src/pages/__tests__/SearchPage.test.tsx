import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { mockReliance, mockTCS, mockInfosys } from "@/test/mocks";

vi.mock("@/services/api", () => ({
  orgApi: {
    search: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "analyst", display_name: "Test" },
    loading: false,
    error: null,
    isRole: (...roles: string[]) => roles.includes("analyst"),
  }),
}));

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FT-PG-01: renders hero search bar", async () => {
    const { SearchPage } = await import("@/pages/SearchPage");
    render(<SearchPage />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("FT-PG-02: search triggers API call", async () => {
    const { orgApi } = await import("@/services/api");
    const mockSearch = vi.mocked(orgApi.search);
    mockSearch.mockResolvedValue({
      data: [mockReliance, mockTCS],
      pagination: { page: 1, page_size: 20, total_items: 2, total_pages: 1 },
      error: null,
    });

    const { SearchPage } = await import("@/pages/SearchPage");
    render(<SearchPage />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "reliance" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith("reliance", expect.anything(), undefined);
    });
  });
});
