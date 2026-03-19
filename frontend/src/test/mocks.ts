import type {
  User,
  Organization,
  NewsArticle,
  FinancialSnapshot,
  CreditAccount,
  CreditTransaction,
  Notification,
  AnalysisRequest,
  OrgDashboard,
  CreditPricing,
  PlatformSettings,
  GraphNode,
} from "@/types";

// ─── Users ─────────────────────────────────────────────────

export const mockAdminUser: User = {
  id: "user-admin-001",
  sso_id: "sso-admin-001",
  email: "admin@ai360.test",
  display_name: "Admin User",
  role: "admin",
  is_active: true,
  last_login_at: "2026-03-17T10:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-03-17T10:00:00Z",
};

export const mockAnalystUser: User = {
  id: "user-analyst-001",
  sso_id: "sso-analyst-001",
  email: "analyst@ai360.test",
  display_name: "Analyst User",
  role: "analyst",
  is_active: true,
  last_login_at: "2026-03-17T09:00:00Z",
  created_at: "2026-01-15T00:00:00Z",
  updated_at: "2026-03-17T09:00:00Z",
};

export const mockViewerUser: User = {
  id: "user-viewer-001",
  sso_id: "sso-viewer-001",
  email: "viewer@ai360.test",
  display_name: "Viewer User",
  role: "viewer",
  is_active: true,
  last_login_at: "2026-03-16T15:00:00Z",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-03-16T15:00:00Z",
};

// ─── Organizations ─────────────────────────────────────────

export const mockReliance: Organization = {
  id: "org-reliance-001",
  name: "Reliance Industries",
  ticker_symbol: "RELIANCE.NS",
  sector: "Conglomerate",
  headquarters: "Mumbai, India",
  description: "Indian multinational conglomerate company",
  logo_url: null,
  is_active: true,
  scraping_frequency: "daily",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-03-17T06:00:00Z",
};

export const mockTCS: Organization = {
  id: "org-tcs-001",
  name: "Tata Consultancy Services",
  ticker_symbol: "TCS.NS",
  sector: "IT Services",
  headquarters: "Mumbai, India",
  description: "IT services, consulting and business solutions",
  logo_url: null,
  is_active: true,
  scraping_frequency: "every_6h",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-03-17T05:00:00Z",
};

export const mockInfosys: Organization = {
  id: "org-infosys-001",
  name: "Infosys",
  ticker_symbol: "INFY.NS",
  sector: "IT Services",
  headquarters: "Bengaluru, India",
  description: "Global leader in next-generation digital services",
  logo_url: null,
  is_active: true,
  scraping_frequency: "daily",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-03-17T04:00:00Z",
};

// ─── News Articles ─────────────────────────────────────────

export const mockNewsArticles: NewsArticle[] = [
  {
    id: "news-001",
    organization_id: "org-reliance-001",
    headline: "Reliance posts record Q4 revenue of ₹2.7 lakh crore",
    source: "Economic Times",
    source_url: "https://economictimes.com/reliance-q4-2026",
    published_at: "2026-03-17T08:00:00Z",
    summary: "Reliance Industries reported its highest-ever quarterly revenue driven by strong Jio and retail performance.",
    sentiment: "positive",
    sentiment_score: 0.85,
    ingested_at: "2026-03-17T08:30:00Z",
  },
  {
    id: "news-002",
    organization_id: "org-reliance-001",
    headline: "Reliance Jio crosses 500 million subscribers",
    source: "Mint",
    source_url: "https://livemint.com/jio-500m",
    published_at: "2026-03-16T12:00:00Z",
    summary: "Jio has become the first Indian telecom operator to cross the 500M subscriber mark.",
    sentiment: "positive",
    sentiment_score: 0.72,
    ingested_at: "2026-03-16T12:45:00Z",
  },
  {
    id: "news-003",
    organization_id: "org-reliance-001",
    headline: "Reliance faces antitrust investigation in retail segment",
    source: "Reuters",
    source_url: "https://reuters.com/reliance-antitrust",
    published_at: "2026-03-15T09:00:00Z",
    summary: "Competition Commission of India has opened an investigation into Reliance Retail's market practices.",
    sentiment: "negative",
    sentiment_score: -0.6,
    ingested_at: "2026-03-15T09:30:00Z",
  },
  {
    id: "news-004",
    organization_id: "org-reliance-001",
    headline: "Reliance announces ₹75,000 crore investment in green energy",
    source: "NDTV",
    source_url: "https://ndtv.com/reliance-green-energy",
    published_at: "2026-03-14T10:00:00Z",
    summary: "The company plans to invest heavily in solar, hydrogen, and battery storage over the next 3 years.",
    sentiment: "positive",
    sentiment_score: 0.65,
    ingested_at: "2026-03-14T10:30:00Z",
  },
  {
    id: "news-005",
    organization_id: "org-reliance-001",
    headline: "Reliance retail expansion rate flattens in Q4",
    source: "Bloomberg",
    source_url: "https://bloomberg.com/reliance-retail-q4",
    published_at: "2026-03-13T14:00:00Z",
    summary: "Store opening pace has slowed compared to previous quarters amid market saturation.",
    sentiment: "neutral",
    sentiment_score: 0.1,
    ingested_at: "2026-03-13T14:30:00Z",
  },
];

// ─── Financial Snapshot ────────────────────────────────────

export const mockFinancial: FinancialSnapshot = {
  id: "fin-001",
  organization_id: "org-reliance-001",
  share_price: 2845.5,
  daily_change_pct: 2.3,
  market_cap: 19200000000000,
  revenue_ttm: 9800000000000,
  profit_ttm: 790000000000,
  employee_count: 389000,
  snapshot_date: "2026-03-17",
  source: "yahoo_finance",
  created_at: "2026-03-17T06:00:00Z",
};

// ─── Credit Account ────────────────────────────────────────

export const mockCreditAccount: CreditAccount = {
  id: "credit-001",
  user_id: "user-analyst-001",
  total_credits_purchased: 1000,
  credits_balance: 847,
  quota_limit: 500,
  quota_used: 312,
  billing_cycle_start: "2026-03-01",
  billing_cycle_days: 30,
  low_credit_threshold: 100,
  created_at: "2026-01-15T00:00:00Z",
  updated_at: "2026-03-17T10:00:00Z",
};

export const mockTransactions: CreditTransaction[] = [
  {
    id: "tx-001",
    user_id: "user-analyst-001",
    transaction_type: "debit_ai_query",
    amount: -1,
    balance_after: 847,
    description: "AI Q&A query for Reliance Industries",
    reference_id: "chat-001",
    created_at: "2026-03-17T10:00:00Z",
  },
  {
    id: "tx-002",
    user_id: "user-analyst-001",
    transaction_type: "debit_export",
    amount: -5,
    balance_after: 848,
    description: "PDF export for TCS",
    reference_id: "export-001",
    created_at: "2026-03-17T09:00:00Z",
  },
  {
    id: "tx-003",
    user_id: "user-analyst-001",
    transaction_type: "debit_analysis_request",
    amount: -25,
    balance_after: 853,
    description: "Analysis request for Wipro",
    reference_id: "req-001",
    created_at: "2026-03-16T14:00:00Z",
  },
  {
    id: "tx-004",
    user_id: "user-analyst-001",
    transaction_type: "purchase",
    amount: 500,
    balance_after: 878,
    description: "Credit top-up by admin",
    reference_id: null,
    created_at: "2026-03-15T08:00:00Z",
  },
];

// ─── Notifications ─────────────────────────────────────────

export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    user_id: "user-analyst-001",
    type: "analysis_ready",
    title: "Analysis Ready: Wipro",
    message: "The 360 profile for Wipro Limited is now ready.",
    link_url: "/org/org-wipro-001",
    is_read: false,
    delivery_channels: ["in_app", "email"],
    delivery_status: { in_app: "delivered", email: "delivered" },
    created_at: "2026-03-17T08:00:00Z",
  },
  {
    id: "notif-002",
    user_id: "user-analyst-001",
    type: "export_ready",
    title: "Export Ready: TCS PDF",
    message: "Your PDF report for TCS is ready for download.",
    link_url: "/export/export-001/download",
    is_read: false,
    delivery_channels: ["in_app"],
    delivery_status: { in_app: "delivered" },
    created_at: "2026-03-17T07:00:00Z",
  },
  {
    id: "notif-003",
    user_id: "user-analyst-001",
    type: "credit_low",
    title: "Low Credit Balance",
    message: "Your credit balance (95) is below your alert threshold (100).",
    link_url: "/credits",
    is_read: true,
    delivery_channels: ["in_app", "email"],
    delivery_status: { in_app: "delivered", email: "delivered" },
    created_at: "2026-03-16T20:00:00Z",
  },
];

// ─── Analysis Requests ─────────────────────────────────────

export const mockAnalysisRequests: AnalysisRequest[] = [
  {
    id: "req-001",
    user_id: "user-analyst-001",
    organization_name: "Wipro Limited",
    ticker_symbol: "WIPRO.NS",
    sector: "IT Services",
    organization_id: "org-wipro-001",
    status: "ready",
    estimated_completion: "2026-03-17T07:30:00Z",
    failure_reason: null,
    submitted_at: "2026-03-17T07:00:00Z",
    completed_at: "2026-03-17T07:25:00Z",
  },
  {
    id: "req-002",
    user_id: "user-analyst-001",
    organization_name: "HCL Technologies",
    ticker_symbol: "HCLTECH.NS",
    sector: "IT Services",
    organization_id: null,
    status: "building_knowledge_base",
    estimated_completion: "2026-03-17T11:00:00Z",
    failure_reason: null,
    submitted_at: "2026-03-17T10:30:00Z",
    completed_at: null,
  },
  {
    id: "req-003",
    user_id: "user-analyst-001",
    organization_name: "Unknown Corp",
    ticker_symbol: null,
    sector: null,
    organization_id: null,
    status: "failed",
    estimated_completion: null,
    failure_reason: "Unable to find sufficient public data for this organization",
    submitted_at: "2026-03-16T15:00:00Z",
    completed_at: "2026-03-16T15:20:00Z",
  },
];

// ─── Dashboard ─────────────────────────────────────────────

export const mockDashboard: OrgDashboard = {
  organization: mockReliance,
  latest_financial: mockFinancial,
  recent_news: mockNewsArticles.slice(0, 3),
  annual_reports: [],
  ai_model_status: "ready",
  kg_node_count: 347,
};

// ─── Credit Pricing ────────────────────────────────────────

export const mockPricing: CreditPricing[] = [
  { id: "price-001", action_type: "analysis_request", credits_cost: 25, description: "New organization analysis", is_active: true },
  { id: "price-002", action_type: "export_pdf", credits_cost: 5, description: "PDF report export", is_active: true },
  { id: "price-003", action_type: "export_csv", credits_cost: 3, description: "CSV data export", is_active: true },
  { id: "price-004", action_type: "ai_query", credits_cost: 1, description: "AI Q&A query", is_active: true },
  { id: "price-005", action_type: "ai_query_followup", credits_cost: 0.5, description: "Follow-up query", is_active: true },
];

// ─── Graph Nodes ───────────────────────────────────────────

export const mockGraphNodes: GraphNode[] = [
  { id: "node-001", entity_type: "organization", entity_name: "Reliance Industries", properties: { sector: "Conglomerate" } },
  { id: "node-002", entity_type: "person", entity_name: "Mukesh Ambani", properties: { title: "Chairman & MD" } },
  { id: "node-003", entity_type: "product", entity_name: "Jio", properties: { type: "Telecom" } },
  { id: "node-004", entity_type: "product", entity_name: "Reliance Retail", properties: { type: "Retail" } },
  { id: "node-005", entity_type: "organization", entity_name: "Bharti Airtel", properties: { relationship: "competitor" } },
];

// ─── Platform Settings ─────────────────────────────────────

export const mockSettings: PlatformSettings = {
  id: "settings-001",
  default_user_role: "viewer",
  default_scraping_frequency: "daily",
  llm_provider: "anthropic",
  llm_model: "claude-sonnet-4-20250514",
  embedding_provider: "bge-m3",
  embedding_model: "BAAI/bge-m3",
  embedding_dimensions: 1024,
};
