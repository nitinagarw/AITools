export type Role = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  sso_id: string;
  email: string;
  display_name: string;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  ticker_symbol: string | null;
  sector: string | null;
  headquarters: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  scraping_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: string;
  organization_id: string;
  headline: string;
  source: string | null;
  source_url: string;
  published_at: string;
  summary: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_score: number | null;
  ingested_at: string;
}

export interface FinancialSnapshot {
  id: string;
  organization_id: string;
  share_price: number | null;
  daily_change_pct: number | null;
  market_cap: number | null;
  revenue_ttm: number | null;
  profit_ttm: number | null;
  employee_count: number | null;
  snapshot_date: string;
  source: string | null;
  created_at: string;
}

export interface AnnualReport {
  id: string;
  organization_id: string;
  fiscal_year: number;
  title: string;
  source_url: string;
  processing_status: string;
  pages_count: number | null;
  extracted_entities_count: number;
  embeddings_count: number;
  ingested_at: string;
  processed_at: string | null;
}

export interface AnalysisReport {
  id: string;
  organization_id: string;
  report_type: "growth_trajectory" | "sentiment_summary" | "competitive_landscape";
  content: Record<string, unknown>;
  confidence_score: number | null;
  generated_at: string;
  valid_until: string | null;
  model_version: string | null;
}

export interface AIModel {
  id: string;
  organization_id: string;
  model_type: string;
  status: "building" | "ready" | "updating" | "failed";
  knowledge_base_version: number;
  last_trained_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRequest {
  id: string;
  user_id: string;
  organization_name: string;
  ticker_symbol: string | null;
  sector: string | null;
  organization_id: string | null;
  status: "queued" | "scraping" | "building_knowledge_base" | "training_model" | "ready" | "failed" | "cancelled";
  estimated_completion: string | null;
  failure_reason: string | null;
  submitted_at: string;
  completed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  delivery_channels: string[];
  delivery_status: Record<string, string>;
  created_at: string;
}

export interface CreditAccount {
  id: string;
  user_id: string;
  total_credits_purchased: number;
  credits_balance: number;
  quota_limit: number;
  quota_used: number;
  billing_cycle_start: string;
  billing_cycle_days: number;
  low_credit_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface CreditPricing {
  id: string;
  action_type: string;
  credits_cost: number;
  description: string;
  is_active: boolean;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_address: string | null;
  sms_enabled: boolean;
  sms_phone_number: string | null;
  push_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  notify_on: Record<string, string[]>;
}

export interface PlatformSettings {
  id: string;
  default_user_role: string;
  default_scraping_frequency: string;
  llm_provider: string;
  llm_model: string;
  llm_api_key?: string;
  llm_endpoint_url?: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_dimensions: number;
  embedding_endpoint_url?: string;
}

export interface DataSourceConfig {
  id: string;
  source_type: "financial" | "news";
  provider_name: string;
  display_name: string;
  adapter_class: string;
  base_url: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
}

export interface ExportJob {
  id: string;
  user_id: string;
  organization_id: string;
  format: "pdf" | "csv" | "json";
  sections: string[];
  status: "queued" | "processing" | "completed" | "failed";
  file_path: string | null;
  download_url: string | null;
  error_message: string | null;
  expires_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GraphNode {
  id: string;
  entity_type: string;
  entity_name: string;
  properties: Record<string, unknown>;
}

export interface OrgDashboard {
  organization: Organization;
  latest_financial: FinancialSnapshot | null;
  recent_news: NewsArticle[];
  annual_reports: AnnualReport[];
  ai_model_status: string | null;
  kg_node_count: number | null;
}

export interface ApiResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  error: { message: string } | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { label: string; reference: string }[];
  timestamp: string;
}

export interface OrgLayoutContext {
  dashboard: OrgDashboard | null;
  loading: boolean;
}
