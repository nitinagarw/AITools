import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { mockAnalysisRequests } from "@/test/mocks";

vi.mock("@/services/api", () => ({
  pipelineApi: {
    list: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
      error: null,
    }),
    cancel: vi.fn(),
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

describe("MyRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FT-PG-20: renders request list", async () => {
    const { pipelineApi } = await import("@/services/api");
    vi.mocked(pipelineApi.list).mockResolvedValue({
      data: mockAnalysisRequests,
      pagination: { page: 1, page_size: 20, total_items: 3, total_pages: 1 },
      error: null,
    });

    const { MyRequestsPage } = await import("@/pages/MyRequestsPage");
    render(<MyRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Wipro/i)).toBeInTheDocument();
    });
  });

  it("FT-PG-20: shows status badges", async () => {
    const { pipelineApi } = await import("@/services/api");
    vi.mocked(pipelineApi.list).mockResolvedValue({
      data: mockAnalysisRequests,
      pagination: { page: 1, page_size: 20, total_items: 3, total_pages: 1 },
      error: null,
    });

    const { MyRequestsPage } = await import("@/pages/MyRequestsPage");
    render(<MyRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText(/ready/i)).toBeInTheDocument();
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
