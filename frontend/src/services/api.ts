import type {
  AnnualReport,
  AnalysisReport,
  AnalysisRequest,
  ApiResponse,
  AIModel,
  CreditAccount,
  CreditPricing,
  CreditTransaction,
  DataSourceConfig,
  ExportJob,
  FinancialSnapshot,
  GraphNode,
  NewsArticle,
  Notification,
  NotificationPreferences,
  Organization,
  OrgDashboard,
  PaginatedResponse,
  PlatformSettings,
  User,
} from "@/types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── User ──────────────────────────────────────────────────

export const userApi = {
  getMe: () => request<ApiResponse<User>>("/me"),

  listUsers: (page = 1, pageSize = 20) =>
    request<PaginatedResponse<User>>(`/admin/users?page=${page}&page_size=${pageSize}`),

  changeRole: (userId: string, newRole: string, reason?: string) =>
    request<ApiResponse<User>>(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ new_role: newRole, reason }),
    }),

  getAuditLog: (page = 1) =>
    request<PaginatedResponse<{ id: string; user_id: string; changed_by: string; old_role: string; new_role: string; reason: string | null; created_at: string }>>(
      `/admin/audit-log/roles?page=${page}`
    ),

  getNotificationPrefs: () =>
    request<ApiResponse<NotificationPreferences>>("/me/notification-preferences"),

  updateNotificationPrefs: (data: Partial<NotificationPreferences>) =>
    request<ApiResponse<NotificationPreferences>>("/me/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── Organization ──────────────────────────────────────────

export const orgApi = {
  search: (q: string, page = 1, sector?: string) => {
    const params = new URLSearchParams({ q, page: String(page) });
    if (sector) params.set("sector", sector);
    return request<PaginatedResponse<Organization>>(`/search?${params}`);
  },

  get: (id: string) => request<ApiResponse<Organization>>(`/organizations/${id}`),

  create: (data: { name: string; ticker_symbol?: string; sector?: string; headquarters?: string; description?: string }) =>
    request<ApiResponse<Organization>>("/organizations", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Organization>) =>
    request<ApiResponse<Organization>>(`/organizations/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getDashboard: (id: string) =>
    request<ApiResponse<OrgDashboard>>(`/organizations/${id}/dashboard`),

  listNews: (id: string, page = 1, sentiment?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (sentiment) params.set("sentiment", sentiment);
    return request<PaginatedResponse<NewsArticle>>(`/organizations/${id}/news?${params}`);
  },

  listFinancials: (id: string, page = 1) =>
    request<PaginatedResponse<FinancialSnapshot>>(`/organizations/${id}/financials?page=${page}`),

  listAnnualReports: (id: string) =>
    request<ApiResponse<AnnualReport[]>>(`/organizations/${id}/annual-reports`),

  updateScrapingFrequency: (id: string, frequency: string) =>
    request<ApiResponse<Organization>>(`/organizations/${id}/scraping-frequency`, {
      method: "PUT",
      body: JSON.stringify({ frequency }),
    }),
};

// ─── Intelligence ──────────────────────────────────────────

export const intelligenceApi = {
  listAnalysis: (orgId: string) =>
    request<ApiResponse<AnalysisReport[]>>(`/organizations/${orgId}/analysis`),

  refreshAnalysis: (orgId: string) =>
    request<unknown>(`/organizations/${orgId}/analysis/refresh`, { method: "POST" }),

  getGraph: (orgId: string) =>
    request<ApiResponse<GraphNode[]>>(`/organizations/${orgId}/graph`),

  getModel: (orgId: string) =>
    request<ApiResponse<AIModel>>(`/organizations/${orgId}/model`),

  chat: (orgId: string, message: string, conversationId?: string) =>
    request<ApiResponse<{ reply: string; sources: { label: string; reference: string }[]; credits_used: number }>>(`/organizations/${orgId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    }),
};

// ─── Pipeline ──────────────────────────────────────────────

export const pipelineApi = {
  submit: (data: { organization_name: string; ticker_symbol?: string; sector?: string }) =>
    request<ApiResponse<AnalysisRequest>>("/analysis-requests", { method: "POST", body: JSON.stringify(data) }),

  list: (page = 1) =>
    request<PaginatedResponse<AnalysisRequest>>(`/analysis-requests?page=${page}`),

  get: (id: string) =>
    request<ApiResponse<AnalysisRequest>>(`/analysis-requests/${id}`),

  cancel: (id: string) =>
    request<ApiResponse<AnalysisRequest>>(`/analysis-requests/${id}/cancel`, { method: "PUT" }),

  seedInitialize: (orgIds: string[]) =>
    request<unknown>("/seed/initialize", { method: "POST", body: JSON.stringify({ organization_ids: orgIds }) }),

  seedStatus: () =>
    request<ApiResponse<{ organization_id: string; status: string; progress_pct: number }[]>>("/seed/status"),
};

// ─── Notifications ─────────────────────────────────────────

export const notificationApi = {
  list: (page = 1, isRead?: boolean) => {
    const params = new URLSearchParams({ page: String(page) });
    if (isRead !== undefined) params.set("is_read", String(isRead));
    return request<PaginatedResponse<Notification>>(`/notifications?${params}`);
  },

  markRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: "PUT" }),
};

// ─── Credits ───────────────────────────────────────────────

export const creditApi = {
  getAccount: () => request<ApiResponse<CreditAccount>>("/me/credits"),

  listTransactions: (page = 1) =>
    request<PaginatedResponse<CreditTransaction>>(`/me/credits/transactions?page=${page}`),

  updateQuota: (quotaLimit: number) =>
    request<ApiResponse<CreditAccount>>("/me/credits/quota", {
      method: "PUT",
      body: JSON.stringify({ quota_limit: quotaLimit }),
    }),

  updateLowThreshold: (threshold: number | null) =>
    request<ApiResponse<CreditAccount>>("/me/credits/low-threshold", {
      method: "PUT",
      body: JSON.stringify({ threshold }),
    }),

  listPricing: () =>
    request<ApiResponse<CreditPricing[]>>("/admin/credits/pricing"),

  createPricing: (data: { action_type: string; credits_cost: number; description: string }) =>
    request<ApiResponse<CreditPricing>>("/admin/credits/pricing", { method: "POST", body: JSON.stringify(data) }),

  updatePricing: (id: string, data: { action_type?: string; credits_cost?: number; description?: string; is_active?: boolean }) =>
    request<ApiResponse<CreditPricing>>(`/admin/credits/pricing/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Export ────────────────────────────────────────────────

export const exportApi = {
  create: (data: { organization_id: string; format: string; sections: string[] }) =>
    request<ApiResponse<ExportJob>>("/export", { method: "POST", body: JSON.stringify(data) }),

  list: (page = 1) =>
    request<PaginatedResponse<ExportJob>>(`/export?page=${page}`),

  get: (id: string) => request<ApiResponse<ExportJob>>(`/export/${id}`),

  download: (id: string) => `${BASE}/export/${id}/download`,
};

// ─── Admin Settings ────────────────────────────────────────

export const settingsApi = {
  get: () => request<ApiResponse<PlatformSettings>>("/admin/settings"),

  update: (data: Partial<PlatformSettings>) =>
    request<ApiResponse<PlatformSettings>>("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),

  listDataSources: () =>
    request<ApiResponse<DataSourceConfig[]>>("/admin/data-sources"),

  createDataSource: (data: Partial<DataSourceConfig>) =>
    request<ApiResponse<DataSourceConfig>>("/admin/data-sources", { method: "POST", body: JSON.stringify(data) }),

  updateDataSource: (id: string, data: Partial<DataSourceConfig>) =>
    request<ApiResponse<DataSourceConfig>>(`/admin/data-sources/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteDataSource: (id: string) =>
    request<void>(`/admin/data-sources/${id}`, { method: "DELETE" }),
};
