import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { mockAdminUser, mockPricing } from "@/test/mocks";

vi.mock("@/services/api", () => ({
  creditApi: {
    listPricing: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
    updatePricing: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockAdminUser,
    loading: false,
    error: null,
    isRole: (...roles: string[]) => roles.includes("admin"),
  }),
}));

describe("AdminPricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FT-PG-40: renders pricing table", async () => {
    const { creditApi } = await import("@/services/api");
    vi.mocked(creditApi.listPricing).mockResolvedValue({
      data: mockPricing,
      error: null,
    });

    const { AdminPricingPage } = await import("@/pages/admin/AdminPricingPage");
    render(<AdminPricingPage />);

    await waitFor(() => {
      expect(screen.getByText(/analysis/i)).toBeInTheDocument();
    });
  });
});
