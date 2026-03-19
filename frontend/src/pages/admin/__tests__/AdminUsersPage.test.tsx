import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { mockAdminUser, mockAnalystUser, mockViewerUser } from "@/test/mocks";

vi.mock("@/services/api", () => ({
  userApi: {
    listUsers: vi.fn().mockResolvedValue({
      data: [mockAdminUser, mockAnalystUser, mockViewerUser],
      pagination: { page: 1, page_size: 20, total_items: 3, total_pages: 1 },
      error: null,
    }),
    changeRole: vi.fn(),
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

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("FT-PG-34: renders user table with role info", async () => {
    const { AdminUsersPage } = await import("@/pages/admin/AdminUsersPage");
    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("Analyst User")).toBeInTheDocument();
      expect(screen.getByText("Viewer User")).toBeInTheDocument();
    });
  });
});
