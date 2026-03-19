import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { mockCreditAccount, mockTransactions } from "@/test/mocks";

vi.mock("@/services/api", () => ({
  creditApi: {
    getAccount: vi.fn().mockResolvedValue({ data: null, error: null }),
    listTransactions: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
      error: null,
    }),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-analyst-001", role: "analyst", display_name: "Analyst" },
    loading: false,
    error: null,
    isRole: (...roles: string[]) => roles.includes("analyst"),
  }),
}));

describe("CreditsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FT-PG-25: renders credit balance info", async () => {
    const { creditApi } = await import("@/services/api");
    vi.mocked(creditApi.getAccount).mockResolvedValue({
      data: mockCreditAccount,
      error: null,
    });
    vi.mocked(creditApi.listTransactions).mockResolvedValue({
      data: mockTransactions,
      pagination: { page: 1, page_size: 20, total_items: 4, total_pages: 1 },
      error: null,
    });

    const { CreditsPage } = await import("@/pages/CreditsPage");
    render(<CreditsPage />);

    await waitFor(() => {
      expect(screen.getByText(/847/)).toBeInTheDocument();
    });
  });
});
