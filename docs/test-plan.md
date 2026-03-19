# AI360 — Test Plan

**Version:** 1.0
**Author:** Nitin Agarwal
**Last Updated:** 2026-03-17
**Status:** Draft

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Test Environments](#2-test-environments)
3. [Unit Tests — Backend](#3-unit-tests--backend)
4. [Unit Tests — Frontend](#4-unit-tests--frontend)
5. [API Integration Tests](#5-api-integration-tests)
6. [End-to-End (E2E) Tests](#6-end-to-end-e2e-tests)
7. [AI & Pipeline Tests](#7-ai--pipeline-tests)
8. [Performance Tests](#8-performance-tests)
9. [Security Tests](#9-security-tests)
10. [Accessibility Tests](#10-accessibility-tests)
11. [Data Integrity & Retention Tests](#11-data-integrity--retention-tests)
12. [Test Data Strategy](#12-test-data-strategy)
13. [Test Execution Schedule](#13-test-execution-schedule)
14. [Exit Criteria](#14-exit-criteria)

---

## 1. Test Strategy Overview

### 1.1 Testing Pyramid

```
           ┌─────────┐
           │  E2E    │   ~50 scenarios — Playwright
           │ (UI)    │
          ┌┴─────────┴┐
          │ API/Integ │   ~200 cases — pytest + httpx
         ┌┴───────────┴┐
         │  Unit Tests  │  ~800 cases — pytest (BE) + Vitest (FE)
         └──────────────┘
```

| Layer | Tool | Coverage Target | Run Frequency |
|-------|------|-----------------|---------------|
| Unit (Backend) | pytest + pytest-asyncio | 80%+ line coverage per service | Every commit (CI) |
| Unit (Frontend) | Vitest + React Testing Library | 75%+ line coverage for components/hooks | Every commit (CI) |
| API Integration | pytest + httpx + testcontainers | All API endpoints (happy + error paths) | Every PR merge |
| E2E | Playwright | All critical user flows | Nightly + pre-release |
| Performance | Locust | P0 endpoints meet SLA | Weekly + pre-release |
| Security | OWASP ZAP + manual | Top 10 OWASP | Monthly + pre-release |
| Accessibility | axe-core + manual | WCAG 2.1 AA | Per feature + pre-release |
| AI/Pipeline | Custom harness + pytest | Pipeline stages + RAG quality | Per model/pipeline change |

### 1.2 Quality Gates

A PR cannot merge if:
- Unit test coverage drops below 75% (backend) or 70% (frontend)
- Any API integration test fails
- Any P0 E2E test fails
- Security scan finds a Critical or High severity vulnerability

A release cannot ship if:
- Any P0 or P1 E2E scenario fails
- Performance SLA violations on P0 endpoints
- Accessibility audit fails on WCAG 2.1 AA criteria
- AI pipeline test suite accuracy drops below defined thresholds

---

## 2. Test Environments

| Environment | Purpose | Infrastructure | Data |
|-------------|---------|---------------|------|
| **Local Dev** | Developer testing, unit tests | Docker Compose (Postgres, Neo4j, Redis, MinIO) | Fixtures + factories |
| **CI** | Automated pipeline tests | GitHub Actions + testcontainers | Ephemeral, seeded per run |
| **Staging** | Full integration, E2E, perf | Kubernetes (mirrors prod) | Copy of production seed data |
| **Pre-Prod** | Final acceptance, security scan | Kubernetes (identical to prod) | Anonymized production snapshot |

---

## 3. Unit Tests — Backend

### 3.1 Shared Libraries (`backend/libs/shared/`)

| ID | Module | Test Description | Type |
|----|--------|------------------|------|
| UT-SH-01 | `auth.py` | `get_current_user` returns valid `CurrentUser` from a correctly signed JWT | Positive |
| UT-SH-02 | `auth.py` | `get_current_user` raises 401 for expired JWT | Negative |
| UT-SH-03 | `auth.py` | `get_current_user` raises 401 for malformed token | Negative |
| UT-SH-04 | `auth.py` | `require_role(admin)` allows admin user | Positive |
| UT-SH-05 | `auth.py` | `require_role(admin)` raises 403 for analyst/viewer | Negative |
| UT-SH-06 | `auth.py` | `verify_internal_jwt` validates inter-service tokens | Positive |
| UT-SH-07 | `config.py` | `BaseServiceSettings` loads env vars with defaults | Positive |
| UT-SH-08 | `config.py` | Missing required env var raises `ValidationError` | Negative |
| UT-SH-09 | `database.py` | `create_session_factory` returns async session | Positive |
| UT-SH-10 | `events.py` | `EventBus.publish` writes to correct Redis stream | Positive |
| UT-SH-11 | `events.py` | `EventBus.subscribe` receives published events | Positive |
| UT-SH-12 | `schemas.py` | `ApiResponse` serializes correctly | Positive |
| UT-SH-13 | `schemas.py` | `PaginatedResponse` computes page metadata correctly | Positive |

### 3.2 User Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-US-01 | Create user on first SSO login with default role from PlatformSettings | Positive |
| UT-US-02 | Return existing user if SSO ID already exists | Positive |
| UT-US-03 | `GET /api/me` returns current user's profile and role | Positive |
| UT-US-04 | `PATCH /api/admin/users/{id}/role` — admin can promote user to analyst | Positive |
| UT-US-05 | `PATCH /api/admin/users/{id}/role` — non-admin gets 403 | Negative |
| UT-US-06 | Cannot demote the last remaining admin | Negative |
| UT-US-07 | Role change creates an entry in `RoleChangeAuditLog` | Positive |
| UT-US-08 | `GET /api/admin/audit-log/roles` returns paginated audit entries | Positive |
| UT-US-09 | `GET /api/me/notification-preferences` returns defaults for new user | Positive |
| UT-US-10 | `PUT /api/me/notification-preferences` — enable SMS requires phone number | Negative |
| UT-US-11 | `PUT /api/me/notification-preferences` — valid update persists | Positive |
| UT-US-12 | Notification preferences `quiet_hours_start` must be before `quiet_hours_end` | Negative |

### 3.3 Organization Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-OS-01 | `POST /api/organizations` — admin creates org successfully | Positive |
| UT-OS-02 | `POST /api/organizations` — duplicate name returns 409 | Negative |
| UT-OS-03 | `POST /api/organizations` — non-admin gets 403 | Negative |
| UT-OS-04 | `GET /api/search?q=reliance` — fuzzy search returns matching orgs | Positive |
| UT-OS-05 | `GET /api/search?q=reliance` — search by ticker symbol works | Positive |
| UT-OS-06 | `GET /api/search?q=xyz_nonexistent` — returns empty list | Positive |
| UT-OS-07 | `PATCH /api/organizations/{id}/activate` — deactivate pauses scraping | Positive |
| UT-OS-08 | `PATCH /api/organizations/{id}/activate` — reactivate resumes | Positive |
| UT-OS-09 | `GET /api/organizations/{id}/dashboard` — aggregates financial + AI data | Positive |
| UT-OS-10 | `GET /api/organizations/{id}/news` — returns paginated articles | Positive |
| UT-OS-11 | `GET /api/organizations/{id}/news?sentiment=positive` — filters correctly | Positive |
| UT-OS-12 | `GET /api/organizations/{id}/news?from=2026-01-01&to=2026-03-01` — date filter | Positive |
| UT-OS-13 | `GET /api/organizations/{id}/financials` — returns snapshots in chronological order | Positive |
| UT-OS-14 | `GET /api/organizations/{id}/annual-reports` — lists processed reports | Positive |
| UT-OS-15 | `GET /api/admin/settings` — returns current platform settings | Positive |
| UT-OS-16 | `PUT /api/admin/settings` — updates LLM provider | Positive |
| UT-OS-17 | `PATCH /api/organizations/{id}/scraping-frequency` — valid enum values accepted | Positive |
| UT-OS-18 | `PATCH /api/organizations/{id}/scraping-frequency` — invalid value returns 422 | Negative |
| UT-OS-19 | `GET /api/admin/data-sources` — lists all configured adapters | Positive |
| UT-OS-20 | `POST /api/admin/data-sources` — adds new data source | Positive |
| UT-OS-21 | `DELETE /api/admin/data-sources/{id}` — cannot delete default data sources | Negative |
| UT-OS-22 | `PATCH /api/admin/data-sources/{id}/enable` — disables a source | Positive |
| UT-OS-23 | News article deduplication logic correctly identifies duplicates | Positive |

### 3.4 Credit Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-CS-01 | New user gets a credit account with zero balance | Positive |
| UT-CS-02 | `GET /api/me/credits` — returns balance, quota, cycle info | Positive |
| UT-CS-03 | Debit transaction reduces balance and records in transaction history | Positive |
| UT-CS-04 | Debit blocked when balance < cost (balance cannot go negative) | Negative |
| UT-CS-05 | Debit blocked when quota_used + cost > quota_limit | Negative |
| UT-CS-06 | `PATCH /api/me/credits/quota` — update quota (must be <= balance) | Positive |
| UT-CS-07 | `PATCH /api/me/credits/quota` — reject if requested quota > balance | Negative |
| UT-CS-08 | `PATCH /api/me/credits/low-threshold` — sets threshold and triggers notification when crossed | Positive |
| UT-CS-09 | `GET /api/me/credits/transactions` — returns paginated history | Positive |
| UT-CS-10 | `GET /api/me/credits/transactions` — filter by transaction type | Positive |
| UT-CS-11 | `POST /api/admin/credits/adjust/{user_id}` — admin adds credits | Positive |
| UT-CS-12 | `POST /api/admin/credits/adjust/{user_id}` — admin deducts credits | Positive |
| UT-CS-13 | `POST /api/admin/credits/adjust/{user_id}` — non-admin gets 403 | Negative |
| UT-CS-14 | Quota usage resets at billing cycle boundary | Positive |
| UT-CS-15 | `GET /api/admin/credits/pricing` — returns all pricing rules | Positive |
| UT-CS-16 | `PUT /api/admin/credits/pricing/{id}` — updates credit cost for action | Positive |
| UT-CS-17 | Concurrent debit requests handled correctly (no double-spend) | Concurrency |

### 3.5 Pipeline Orchestrator

| ID | Test Description | Type |
|----|------------------|------|
| UT-PO-01 | `POST /api/analysis-requests` — creates request with status `queued` | Positive |
| UT-PO-02 | `POST /api/analysis-requests` — deduplicates against existing org | Positive |
| UT-PO-03 | `POST /api/analysis-requests` — deduplicates against pending request for same org | Negative |
| UT-PO-04 | `POST /api/analysis-requests` — checks credit balance before accepting | Positive |
| UT-PO-05 | `POST /api/analysis-requests` — insufficient credits returns 402 | Negative |
| UT-PO-06 | `GET /api/analysis-requests` — lists user's own requests only | Positive |
| UT-PO-07 | `GET /api/analysis-requests/{id}` — returns status with pipeline stage | Positive |
| UT-PO-08 | `DELETE /api/analysis-requests/{id}` — cancels pending request, releases credits | Positive |
| UT-PO-09 | `DELETE /api/analysis-requests/{id}` — cannot cancel completed request | Negative |
| UT-PO-10 | Pipeline publishes `pipeline.stage_changed` event on each stage transition | Positive |
| UT-PO-11 | Pipeline publishes `pipeline.completed` event on success | Positive |
| UT-PO-12 | Pipeline publishes `pipeline.failed` event on failure | Positive |
| UT-PO-13 | `POST /api/seed/initialize` — triggers batch seed for pre-configured orgs | Positive |
| UT-PO-14 | `GET /api/seed/status` — returns per-org seed progress | Positive |

### 3.6 Notification Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-NS-01 | Create in-app notification for user | Positive |
| UT-NS-02 | `GET /api/notifications` — returns user's notifications, newest first | Positive |
| UT-NS-03 | `PATCH /api/notifications/{id}/read` — marks as read | Positive |
| UT-NS-04 | Dispatcher reads user preferences and routes to enabled channels | Positive |
| UT-NS-05 | Quiet hours: notification queued, not dispatched immediately | Positive |
| UT-NS-06 | Quiet hours: queued notifications delivered when quiet hours end | Positive |
| UT-NS-07 | Channel failure (e.g., SMS) does not block other channels | Positive |
| UT-NS-08 | Delivery status logged per channel (`delivered`, `failed`, `queued`) | Positive |
| UT-NS-09 | `analysis_ready` notification includes link to org dashboard | Positive |
| UT-NS-10 | `credit_low` notification triggered when balance crosses threshold | Positive |

### 3.7 Intelligence Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-IS-01 | `GET /api/organizations/{id}/analysis` — returns latest analysis report | Positive |
| UT-IS-02 | `POST /api/organizations/{id}/analysis/refresh` — triggers re-generation | Positive |
| UT-IS-03 | `GET /api/organizations/{id}/graph` — returns knowledge graph nodes + edges | Positive |
| UT-IS-04 | `GET /api/organizations/{id}/graph/node/{node_id}` — returns node detail | Positive |
| UT-IS-05 | `GET /api/organizations/{id}/graph` — filters by entity type | Positive |
| UT-IS-06 | RAG query retrieves relevant chunks from vector index | Positive |
| UT-IS-07 | RAG response includes source citations | Positive |
| UT-IS-08 | Chat handles multi-turn conversation with context retention | Positive |
| UT-IS-09 | Chat gracefully handles out-of-knowledge questions | Positive |
| UT-IS-10 | Analysis report includes confidence scores | Positive |
| UT-IS-11 | LLM provider abstraction: can swap Anthropic → OpenAI via config | Positive |
| UT-IS-12 | Embedding model abstraction: can swap BGE-M3 → OpenAI via config | Positive |

### 3.8 Export Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-ES-01 | Generate PDF export with selected sections | Positive |
| UT-ES-02 | Generate CSV export with structured data | Positive |
| UT-ES-03 | Generate JSON export | Positive |
| UT-ES-04 | Large report runs asynchronously and sends notification on completion | Positive |
| UT-ES-05 | Export includes generation timestamp and data freshness disclaimer | Positive |
| UT-ES-06 | Export deducts credits at configured rate | Positive |
| UT-ES-07 | Export blocked for viewers (403) | Negative |
| UT-ES-08 | Export file uploaded to object storage (MinIO/S3) with download URL | Positive |

### 3.9 Ingestion Service

| ID | Test Description | Type |
|----|------------------|------|
| UT-IG-01 | News scraper adapter fetches articles from Google News RSS | Positive |
| UT-IG-02 | Financial adapter fetches data from Yahoo Finance | Positive |
| UT-IG-03 | Data source adapter interface is respected by all implementations | Positive |
| UT-IG-04 | Priority-based source querying merges results correctly | Positive |
| UT-IG-05 | Disabled data sources are skipped during scraping | Positive |
| UT-IG-06 | Scraping frequency per org is respected by Celery beat | Positive |
| UT-IG-07 | Duplicate news articles are identified and deduplicated | Positive |
| UT-IG-08 | Annual Report PDF download and storage works | Positive |
| UT-IG-09 | Ingestion publishes `data.ingested` event on completion | Positive |
| UT-IG-10 | Scraping error is logged and does not crash the worker | Negative |

### 3.10 Knowledge Engine

| ID | Test Description | Type |
|----|------------------|------|
| UT-KE-01 | Entity extraction from Annual Report text produces valid nodes | Positive |
| UT-KE-02 | Relationship mapping produces valid edges between nodes | Positive |
| UT-KE-03 | Vector embeddings generated and stored in Neo4j vector index | Positive |
| UT-KE-04 | Semantic similarity search returns relevant chunks | Positive |
| UT-KE-05 | Knowledge graph population is idempotent (re-processing same report doesn't duplicate) | Positive |
| UT-KE-06 | Embedding dimension matches configured model (1024 for BGE-M3) | Positive |
| UT-KE-07 | LangGraph pipeline handles multi-step extraction with retries | Positive |
| UT-KE-08 | Knowledge base version increments on each enrichment cycle | Positive |

### 3.11 API Gateway

| ID | Test Description | Type |
|----|------------------|------|
| UT-GW-01 | Valid SSO token is accepted, user context attached | Positive |
| UT-GW-02 | Invalid/expired SSO token returns 401 | Negative |
| UT-GW-03 | Request routed to correct downstream service based on URL | Positive |
| UT-GW-04 | Rate limiter blocks requests exceeding threshold | Negative |
| UT-GW-05 | Rate limiter allows requests within threshold | Positive |
| UT-GW-06 | RBAC: viewer accessing admin endpoint gets 403 | Negative |
| UT-GW-07 | RBAC: admin accessing admin endpoint gets 200 | Positive |
| UT-GW-08 | CORS headers set correctly for React frontend origin | Positive |
| UT-GW-09 | Proxy passes internal JWT to downstream services | Positive |
| UT-GW-10 | Health check endpoint (`/health`) returns 200 | Positive |

---

## 4. Unit Tests — Frontend

### 4.1 Contexts & Hooks

| ID | Component | Test Description |
|----|-----------|------------------|
| FT-CTX-01 | `AuthContext` | Provides user profile and role after mount |
| FT-CTX-02 | `AuthContext` | `isRole('admin')` returns true for admin user |
| FT-CTX-03 | `AuthContext` | `isRole('admin')` returns false for viewer |
| FT-CTX-04 | `NotificationContext` | Fetches notifications on mount |
| FT-CTX-05 | `NotificationContext` | `markRead` updates notification state |
| FT-CTX-06 | `NotificationContext` | `unreadCount` reflects actual unread items |
| FT-CTX-07 | `CreditContext` | Fetches credit balance on mount |
| FT-CTX-08 | `CreditContext` | `refetch` updates balance after transaction |
| FT-CTX-09 | `useToast` | `addToast` adds toast to queue |
| FT-CTX-10 | `useToast` | Toast auto-dismisses after timeout |

### 4.2 Common Components

| ID | Component | Test Description |
|----|-----------|------------------|
| FT-CC-01 | `SearchBar` | Renders with placeholder text |
| FT-CC-02 | `SearchBar` | Calls `onSearch` on Enter key |
| FT-CC-03 | `SearchBar` | Hero variant renders larger |
| FT-CC-04 | `OrgCard` | Displays org name, sector, sentiment |
| FT-CC-05 | `OrgCard` | Click triggers navigation |
| FT-CC-06 | `StatCard` | Renders value, label, trend icon |
| FT-CC-07 | `StatCard` | Positive trend shows green arrow up |
| FT-CC-08 | `StatCard` | Negative trend shows red arrow down |
| FT-CC-09 | `SentimentBadge` | Renders correct color for each sentiment |
| FT-CC-10 | `StatusBadge` | Renders correct color for each status |
| FT-CC-11 | `RoleBadge` | Renders correct color for each role |
| FT-CC-12 | `DataTable` | Renders rows from provided data |
| FT-CC-13 | `DataTable` | Sorting toggles on column header click |
| FT-CC-14 | `DataTable` | Pagination controls navigate pages |
| FT-CC-15 | `DataTable` | Shows loading skeleton when loading |
| FT-CC-16 | `DataTable` | Shows empty state when no data |
| FT-CC-17 | `Modal` | Opens and closes on trigger |
| FT-CC-18 | `Modal` | Traps focus inside modal |
| FT-CC-19 | `Modal` | Closes on Escape key |
| FT-CC-20 | `Tabs` | Renders all tab labels |
| FT-CC-21 | `Tabs` | Active tab is visually highlighted |
| FT-CC-22 | `Tabs` | Clicking tab calls onChange |
| FT-CC-23 | `ConfirmDialog` | Renders title, message, and action buttons |
| FT-CC-24 | `ConfirmDialog` | Confirm button calls onConfirm |
| FT-CC-25 | `ConfirmDialog` | Cancel button calls onCancel |
| FT-CC-26 | `Pagination` | Shows correct page range |
| FT-CC-27 | `Pagination` | Disables prev on first page, next on last |
| FT-CC-28 | `FilterBar` | Renders filter dropdowns |
| FT-CC-29 | `FilterBar` | Selecting a filter calls onChange |
| FT-CC-30 | `EmptyState` | Renders message and optional action button |

### 4.3 Layout Components

| ID | Component | Test Description |
|----|-----------|------------------|
| FT-LY-01 | `TopBar` | Renders logo, search bar, notification bell, credit chip, avatar |
| FT-LY-02 | `TopBar` | Notification bell shows unread count |
| FT-LY-03 | `TopBar` | Credit chip shows current balance |
| FT-LY-04 | `Sidebar` | Renders nav items for all roles |
| FT-LY-05 | `Sidebar` | Admin section hidden for non-admin |
| FT-LY-06 | `Sidebar` | "My Requests" hidden for viewer |
| FT-LY-07 | `Sidebar` | Active item is highlighted |
| FT-LY-08 | `Sidebar` | Collapses below lg breakpoint |
| FT-LY-09 | `NotificationPanel` | Renders notification list |
| FT-LY-10 | `NotificationPanel` | Click "Mark as read" updates state |
| FT-LY-11 | `AppShell` | Renders TopBar, Sidebar, and main content area |
| FT-LY-12 | `ToastContainer` | Renders active toasts |

### 4.4 Page Components

| ID | Page | Test Description |
|----|------|------------------|
| FT-PG-01 | `SearchPage` | Renders hero search bar and trending organizations |
| FT-PG-02 | `SearchPage` | Search input triggers API call and displays results |
| FT-PG-03 | `SearchPage` | No results shows "Request Analysis" prompt for analyst |
| FT-PG-04 | `SearchPage` | No results hides "Request Analysis" for viewer |
| FT-PG-05 | `OrgOverviewPage` | Renders financial cards, sentiment, chart, future plans |
| FT-PG-06 | `OrgOverviewPage` | Export button hidden for viewer |
| FT-PG-07 | `OrgNewsPage` | Renders article feed with sentiment badges |
| FT-PG-08 | `OrgNewsPage` | Filter by sentiment works |
| FT-PG-09 | `OrgNewsPage` | Filter by date range works |
| FT-PG-10 | `OrgAnalysisPage` | Renders growth trajectory chart |
| FT-PG-11 | `OrgAnalysisPage` | "Refresh Analysis" button triggers API call |
| FT-PG-12 | `OrgGraphPage` | Renders force-directed graph |
| FT-PG-13 | `OrgGraphPage` | Click node shows detail panel |
| FT-PG-14 | `OrgAnnualReportsPage` | Renders report timeline |
| FT-PG-15 | `OrgAnnualReportsPage` | Year-over-year comparison toggle works |
| FT-PG-16 | `OrgChatPage` | Renders chat input and message area |
| FT-PG-17 | `OrgChatPage` | Sending message shows loading, then response |
| FT-PG-18 | `OrgChatPage` | AI response includes citation chips |
| FT-PG-19 | `OrgChatPage` | "New Conversation" clears history |
| FT-PG-20 | `MyRequestsPage` | Renders request list with status badges |
| FT-PG-21 | `MyRequestsPage` | Cancel button appears for pending requests |
| FT-PG-22 | `MyRequestsPage` | Completed request links to org dashboard |
| FT-PG-23 | `ComparePage` | Org multi-select allows 2–5 orgs |
| FT-PG-24 | `ComparePage` | Comparison table renders metrics side by side |
| FT-PG-25 | `CreditsPage` | Renders balance, quota, cycle info |
| FT-PG-26 | `CreditsPage` | Quota slider capped at available balance |
| FT-PG-27 | `CreditsPage` | Transaction history renders with filters |
| FT-PG-28 | `NotificationPrefsPage` | Channel toggles work |
| FT-PG-29 | `NotificationPrefsPage` | Enabling SMS shows phone input |
| FT-PG-30 | `NotificationPrefsPage` | Quiet hours picker saves correctly |
| FT-PG-31 | `ProfilePage` | Renders user name, email, role |
| FT-PG-32 | `AdminOrgsPage` | Renders org table with status columns |
| FT-PG-33 | `AdminOrgsPage` | "Add Organization" modal opens and submits |
| FT-PG-34 | `AdminUsersPage` | Renders user table with role dropdowns |
| FT-PG-35 | `AdminUsersPage` | Role change triggers API call |
| FT-PG-36 | `AdminSettingsPage` | Renders LLM provider, embedding model, frequency settings |
| FT-PG-37 | `AdminSettingsPage` | Save updates platform settings |
| FT-PG-38 | `AdminDataSourcesPage` | Renders data source list with enable/disable toggles |
| FT-PG-39 | `AdminSeedPage` | "Trigger Seed Pipeline" button opens confirm dialog |
| FT-PG-40 | `AdminPricingPage` | Renders pricing table with editable costs |

### 4.5 API Client (`services/api.ts`)

| ID | Test Description |
|----|------------------|
| FT-API-01 | `searchOrganizations` calls correct endpoint with query param |
| FT-API-02 | `getOrganization` calls `/api/organizations/{id}` |
| FT-API-03 | API client handles 401 by redirecting to login |
| FT-API-04 | API client handles 403 with error toast |
| FT-API-05 | API client handles network error gracefully |

---

## 5. API Integration Tests

Integration tests run against real services with testcontainers (PostgreSQL, Neo4j, Redis).

### 5.1 User Management Flow

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-UM-01 | Full user lifecycle | Create user via SSO → fetch profile → admin changes role → verify audit log | User exists with updated role; audit log has entry |
| IT-UM-02 | Last admin protection | Create 2 admins → demote admin A → attempt demote admin B | Second demotion rejected with 400 |
| IT-UM-03 | Role change propagation | Change user from viewer → analyst → verify analyst-only endpoints accessible | 200 on analyst endpoints that previously returned 403 |

### 5.2 Organization Lifecycle Flow

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-OL-01 | Create and search | Admin creates org → search by name → search by ticker | Org appears in both search results |
| IT-OL-02 | Deactivate/reactivate | Admin deactivates org → verify not in active list → reactivate → verify in active list | Active status toggles correctly |
| IT-OL-03 | Dashboard aggregation | Create org + insert financial snapshot + insert news articles → fetch dashboard | Dashboard returns aggregated data |
| IT-OL-04 | News filtering | Insert 20 articles (mixed sentiment/dates) → filter by sentiment → filter by date | Correct subsets returned |

### 5.3 Analysis Request Flow

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-AR-01 | Happy path | Submit request → verify credits debited → pipeline progresses → status reaches `ready` → notification created | End-to-end flow completes |
| IT-AR-02 | Insufficient credits | Set balance to 0 → submit request | 402 returned; no request created |
| IT-AR-03 | Quota exceeded | Set quota low → submit request | 402 returned with quota message |
| IT-AR-04 | Cancel request | Submit request → cancel before completion → verify credits refunded | Credits restored; status = cancelled |
| IT-AR-05 | Duplicate detection | Submit request for "Reliance" → submit again for "Reliance" | Second request rejected as duplicate |

### 5.4 Credit System Flow

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-CR-01 | Debit + transaction log | Admin adds 100 credits → user performs action costing 25 → check balance + history | Balance = 75; transaction logged |
| IT-CR-02 | Quota reset | Set billing cycle = 1 day → consume credits → advance time past cycle → check quota_used | quota_used = 0 |
| IT-CR-03 | Low credit alert | Set threshold = 50, balance = 60 → debit 15 → check notifications | credit_low notification created |
| IT-CR-04 | Concurrent debits | Two concurrent requests each costing 50, balance = 80 | One succeeds, one fails; balance >= 0 always |

### 5.5 Notification Delivery Flow

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-NF-01 | Multi-channel dispatch | User enables email + SMS for `analysis_ready` → trigger notification | Delivery attempted on both channels; status logged per channel |
| IT-NF-02 | Quiet hours enforcement | Set quiet hours 22:00–07:00 → trigger notification at 23:00 → check at 23:01 → advance to 07:01 | Notification queued at 23:00; delivered after 07:00 |
| IT-NF-03 | Channel failure fallback | SMS provider fails → notification still delivered in-app and email | SMS status = `failed`; email = `delivered`; in_app = `delivered` |

### 5.6 Export Flow

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-EX-01 | PDF export | Request PDF with all sections → wait for completion | PDF file in object storage; download URL valid |
| IT-EX-02 | CSV export | Request CSV → wait for completion | CSV contains structured data |
| IT-EX-03 | Export credits | Request export → verify credits debited at configured rate | Balance reduced correctly |
| IT-EX-04 | Viewer blocked | Viewer requests export | 403 returned |

### 5.7 Inter-Service Communication

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| IT-ISC-01 | Event propagation | Pipeline Orchestrator publishes `pipeline.completed` → Notification Service creates notification | Notification created within 5s |
| IT-ISC-02 | Internal JWT | Gateway sends internal JWT → downstream service validates | Service accepts and extracts user context |
| IT-ISC-03 | Service health | Each service's `/health` endpoint responds | All return 200 with status `ok` |

---

## 6. End-to-End (E2E) Tests

All E2E tests run on Playwright against the full stack (Docker Compose).

### 6.1 Critical User Flows (P0)

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| E2E-01 | Search → Dashboard | Open app → type org name in search → click result → verify dashboard loads with financial data | Dashboard renders with org header, stat cards, chart |
| E2E-02 | Request Analysis | Search for unknown org → see "Request Analysis" prompt → fill form → submit → navigate to My Requests → see status | Request appears with `queued` status |
| E2E-03 | Role-based visibility (Viewer) | Login as viewer → verify: no admin sidebar, no export button, no chat tab, no compare nav | All restricted elements hidden |
| E2E-04 | Role-based visibility (Admin) | Login as admin → verify: admin sidebar visible, all tabs visible | All admin elements visible |
| E2E-05 | Credit check before action | Set credits to 0 → attempt analysis request → verify error message | "Insufficient credits" shown; action blocked |
| E2E-06 | Admin: Add Organization | Admin navigates to Admin > Organizations → clicks Add → fills form → submits → new row appears | Org created with "Building" status |
| E2E-07 | Admin: Change User Role | Admin navigates to Admin > Users → changes user role from viewer to analyst → verify change persists | Role updated; audit log entry created |

### 6.2 Important Flows (P1)

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| E2E-08 | News filtering | Navigate to org → News tab → filter by positive sentiment → verify only positive articles shown | List filtered correctly |
| E2E-09 | Chat conversation | Navigate to org → Chat tab → type question → wait for response → verify citations present | AI response renders with citation chips |
| E2E-10 | Multi-org comparison | Navigate to Compare → select 3 orgs → verify metrics table and chart overlay | Table shows 3 columns; chart has 3 lines |
| E2E-11 | Notification flow | Trigger pipeline completion → check notification bell badge increments → open panel → click notification → navigated to dashboard | Full notification lifecycle works |
| E2E-12 | Credits dashboard | Navigate to Credits → verify balance, quota slider, transaction history | All data renders correctly |
| E2E-13 | Notification preferences | Navigate to Notification Preferences → enable SMS → enter phone → save → reload → verify persisted | Preferences saved and reloaded |
| E2E-14 | Knowledge graph | Navigate to org → Knowledge Graph tab → wait for graph to render → click a node | Graph renders; node detail panel opens |
| E2E-15 | Annual reports | Navigate to org → Annual Reports tab → select fiscal year → verify summary renders | Structured summary displayed |
| E2E-16 | Cancel request | Create analysis request → go to My Requests → click Cancel → confirm → verify credits refunded | Status = cancelled; credits restored |

### 6.3 Admin Flows (P1)

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| E2E-17 | Platform settings | Admin updates LLM provider → saves → reloads → verifies persisted | Setting saved and reflected |
| E2E-18 | Data source management | Admin adds new data source → enables → disables → deletes | Full CRUD lifecycle works |
| E2E-19 | Credit pricing | Admin updates analysis request cost → verifies new rate applies | New pricing reflected in debit |
| E2E-20 | Seed pipeline | Admin triggers seed pipeline → monitors progress on seed status page | Seed pipeline status updates shown |

### 6.4 Edge Cases & Error Handling (P2)

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| E2E-21 | Unauthorized direct URL | Viewer navigates directly to `/admin/users` | Redirected to `/` with permission toast |
| E2E-22 | 404 page | Navigate to `/nonexistent` | Redirected to `/` (catch-all route) |
| E2E-23 | API error handling | Backend returns 500 → verify frontend shows error message | User-friendly error displayed |
| E2E-24 | Network offline | Disconnect network → attempt action → verify error | "Network error" message shown |
| E2E-25 | Concurrent sessions | Two tabs open → perform actions → verify state consistency | Both tabs reflect latest state after refresh |

---

## 7. AI & Pipeline Tests

### 7.1 LangGraph Agentic Pipeline Tests

| ID | Test Description | Acceptance Criteria |
|----|------------------|---------------------|
| AI-PL-01 | Document Parser Agent extracts text from sample Annual Report PDF | Extracted text covers > 90% of readable content |
| AI-PL-02 | Entity Extraction Agent identifies organizations, people, products, financials | F1 score >= 80% on annotated test set |
| AI-PL-03 | Relationship Mapping Agent discovers edges between extracted entities | Precision >= 75% on annotated test set |
| AI-PL-04 | Summarization Agent produces structured section summaries | Human-rated relevance >= 4.0/5.0 on 20 sample summaries |
| AI-PL-05 | Full pipeline processes a complete Annual Report end-to-end | All stages complete without error; KG nodes > 50 |
| AI-PL-06 | Pipeline handles corrupted PDF gracefully | Status = `failed` with descriptive error; no crash |
| AI-PL-07 | Pipeline is idempotent — re-processing same report doesn't duplicate nodes | Node count unchanged after second run |
| AI-PL-08 | Pipeline publishes correct events at each stage | Events captured by test subscriber |

### 7.2 RAG & AI Model Quality Tests

| ID | Test Description | Acceptance Criteria |
|----|------------------|---------------------|
| AI-RAG-01 | Query: "What was the revenue for FY2025?" retrieves relevant Annual Report chunks | Top-3 retrieved chunks contain the answer |
| AI-RAG-02 | Query: "Who is the CEO?" returns correct answer with citation | Answer is factually correct; citation points to source |
| AI-RAG-03 | Query: "What are the main risks?" returns comprehensive answer from Annual Report | Answer covers >= 3 risk factors mentioned in AR |
| AI-RAG-04 | Out-of-knowledge query: "What is the stock price tomorrow?" | Graceful fallback: "I don't have enough information..." |
| AI-RAG-05 | Multi-turn: Follow-up question retains context from prior turn | Second answer references context from first |
| AI-RAG-06 | Growth trajectory analysis generates valid projections | Report contains revenue trend, risks, opportunities, confidence scores |
| AI-RAG-07 | Sentiment analysis classifies news articles correctly | Accuracy >= 85% on labeled test set of 100 articles |

### 7.3 Embedding & Vector Search Tests

| ID | Test Description | Acceptance Criteria |
|----|------------------|---------------------|
| AI-VS-01 | BGE-M3 embeddings have correct dimensions (1024) | All embeddings are 1024-dim vectors |
| AI-VS-02 | Cosine similarity search returns semantically similar chunks | Top-5 results are topically relevant to query |
| AI-VS-03 | Embedding model swap (BGE-M3 → OpenAI) produces valid embeddings | Dimension matches config; search still functional |
| AI-VS-04 | Incremental embedding: new chunks added without re-embedding existing | Only new chunks embedded; existing unchanged |

---

## 8. Performance Tests

### 8.1 Load Profiles

| Profile | Concurrent Users | Duration | Use Case |
|---------|-----------------|----------|----------|
| Baseline | 10 | 5 min | Smoke test under light load |
| Normal | 50 | 30 min | Typical weekday usage |
| Peak | 200 | 15 min | Product launch / announcement day |
| Stress | 500 | 10 min | Find breaking point |
| Soak | 50 | 4 hours | Memory leak / connection pool exhaustion detection |

### 8.2 Performance SLAs

| Endpoint / Action | SLA (P95) | SLA (P99) | Measurement |
|-------------------|-----------|-----------|-------------|
| `GET /api/search?q=...` | < 500ms | < 1s | Response time |
| `GET /api/organizations/{id}/dashboard` | < 1s | < 2s | Response time |
| `GET /api/organizations/{id}/news` (paginated) | < 500ms | < 1s | Response time |
| `GET /api/organizations/{id}/graph` (≤500 nodes) | < 2s | < 5s | Response time |
| `GET /api/organizations/{id}/analysis` | < 1s | < 2s | Response time |
| `POST /api/analysis-requests` | < 500ms | < 1s | Acceptance response |
| AI Chat Q&A response | < 5s | < 10s | First token to last token |
| `GET /api/notifications` | < 300ms | < 500ms | Response time |
| `GET /api/me/credits` | < 200ms | < 500ms | Response time |
| Page load (first contentful paint) | < 1.5s | < 3s | Lighthouse FCP |
| Knowledge graph render (≤500 nodes) | < 3s | < 5s | Client-side render time |

### 8.3 Performance Test Scenarios

| ID | Scenario | Tool |
|----|----------|------|
| PT-01 | 50 concurrent users searching different terms | Locust |
| PT-02 | 20 concurrent users viewing dashboards for different orgs | Locust |
| PT-03 | 10 concurrent chat sessions with multi-turn queries | Locust |
| PT-04 | 5 concurrent analysis request submissions | Locust |
| PT-05 | Pipeline throughput: 10 orgs processing simultaneously | Custom harness |
| PT-06 | Neo4j vector search under 100 concurrent queries | Locust |
| PT-07 | Database connection pool saturation test | Locust (stress) |
| PT-08 | Redis event bus throughput: 1000 events/min | Custom harness |
| PT-09 | Frontend bundle size < 500KB gzipped | Vite build analysis |
| PT-10 | Lighthouse score >= 90 (Performance) | Lighthouse CI |

---

## 9. Security Tests

### 9.1 Authentication & Authorization

| ID | Test Description | Expected |
|----|------------------|----------|
| SEC-01 | Access any API endpoint without auth token | 401 Unauthorized |
| SEC-02 | Access API with expired token | 401 Unauthorized |
| SEC-03 | Access API with forged/tampered token | 401 Unauthorized |
| SEC-04 | Viewer accessing admin endpoint | 403 Forbidden |
| SEC-05 | Analyst accessing admin endpoint | 403 Forbidden |
| SEC-06 | User A accessing User B's notification preferences | 403 Forbidden |
| SEC-07 | User A accessing User B's credit transactions | 403 or scoped to own data |
| SEC-08 | Internal service JWT not accepted from external client | 401 Unauthorized |
| SEC-09 | Horizontal privilege escalation: change another user's role without admin | 403 Forbidden |
| SEC-10 | Rate limiter blocks brute-force auth attempts | 429 Too Many Requests |

### 9.2 Input Validation & Injection

| ID | Test Description | Expected |
|----|------------------|----------|
| SEC-11 | SQL injection in search query parameter | Input sanitized; no SQL executed |
| SEC-12 | XSS payload in organization name | Rendered as text, not executed |
| SEC-13 | XSS payload in chat message | Rendered as text, not executed |
| SEC-14 | Cypher injection in Neo4j graph query | Parameterized query; no injection |
| SEC-15 | Path traversal in export file download | Access restricted to allowed paths |
| SEC-16 | Oversized request body (> 10MB) | 413 Payload Too Large |
| SEC-17 | Malformed JSON request body | 422 Unprocessable Entity |
| SEC-18 | Negative credit amount in quota update | Validation error (400) |

### 9.3 Data Protection

| ID | Test Description | Expected |
|----|------------------|----------|
| SEC-19 | API keys (LLM, data sources) are encrypted at rest | Values in DB are encrypted |
| SEC-20 | API keys not returned in plaintext via admin settings API | Masked or omitted |
| SEC-21 | Password/secret fields not logged in application logs | Structlog output redacted |
| SEC-22 | PII (email, phone) follows GDPR handling guidelines | Accessible only to the user and admins |
| SEC-23 | Credit transaction amounts cannot be modified after creation | Transactions are append-only |

### 9.4 OWASP Top 10 Scan

Run OWASP ZAP (or equivalent) against the full API surface.

| Category | Check |
|----------|-------|
| A01: Broken Access Control | RBAC enforcement, IDOR, privilege escalation |
| A02: Cryptographic Failures | TLS, encrypted secrets, JWT algorithm |
| A03: Injection | SQL, NoSQL (Cypher), XSS, command injection |
| A05: Security Misconfiguration | CORS, debug mode off, default credentials removed |
| A06: Vulnerable Components | Dependency audit (`pip-audit`, `npm audit`) |
| A07: Auth Failures | Session management, token handling |
| A09: Logging & Monitoring | Security events logged, no sensitive data in logs |

---

## 10. Accessibility Tests

### 10.1 Automated (axe-core + Playwright)

| ID | Page/Component | Criteria |
|----|----------------|----------|
| A11Y-01 | All pages | No axe-core critical or serious violations |
| A11Y-02 | All pages | Color contrast ratio >= 4.5:1 for body text |
| A11Y-03 | All pages | Color contrast ratio >= 3:1 for large text and UI components |
| A11Y-04 | All interactive elements | Visible focus indicators (ring-2) |
| A11Y-05 | All images/icons | `alt` text or `aria-label` present |
| A11Y-06 | Data tables | Proper `<th scope>` attributes |
| A11Y-07 | Modals | Focus trap active; close on Escape |
| A11Y-08 | Toast notifications | `role="alert"` for screen reader announcement |
| A11Y-09 | Form inputs | Associated `<label>` elements |
| A11Y-10 | All pages | Navigable by keyboard only (Tab, Enter, Escape) |

### 10.2 Manual Checks

| ID | Check | Method |
|----|-------|--------|
| A11Y-11 | Screen reader navigation (NVDA/VoiceOver) on search page | Manual |
| A11Y-12 | Screen reader navigation on organization dashboard | Manual |
| A11Y-13 | Screen reader navigation on chat interface | Manual |
| A11Y-14 | Knowledge graph provides text alternative for visually impaired | Manual |
| A11Y-15 | Mobile touch targets >= 44x44px | Manual inspection |
| A11Y-16 | Responsive layout usable with 200% zoom | Manual |

---

## 11. Data Integrity & Retention Tests

### 11.1 Database Integrity

| ID | Test Description | Expected |
|----|------------------|----------|
| DI-01 | Foreign key constraints enforced across all tables | Orphan records cannot be created |
| DI-02 | UUID primary keys are unique | Duplicate insert fails |
| DI-03 | Enum fields reject invalid values | 422 or constraint violation |
| DI-04 | `created_at` / `updated_at` auto-populated by triggers | Timestamps present and correct |
| DI-05 | Credit balance never goes negative under concurrent load | Verified via stress test |
| DI-06 | Transaction history balance_after is mathematically consistent | Running balance correct |

### 11.2 Retention Policy

| ID | Test Description | Expected |
|----|------------------|----------|
| DI-07 | News article `retention_expires_at` = `published_at` + 7 years | Auto-calculated on insert |
| DI-08 | Archival job identifies articles past retention expiry | Correct articles flagged |
| DI-09 | Archived articles have `is_archived = true` and are excluded from API | Not returned in news feed |
| DI-10 | Associated Neo4j chunks cleaned up when article archived | Document chunks removed |
| DI-11 | Financial snapshots, analysis reports, KG data are never purged | Records persist after archival job runs |
| DI-12 | Credit transactions and audit logs persist indefinitely | No purge logic affects these tables |

### 11.3 Neo4j Consistency

| ID | Test Description | Expected |
|----|------------------|----------|
| DI-13 | Knowledge graph nodes have valid `organization_id` | No orphan nodes |
| DI-14 | Edges reference valid source and target node IDs | Referential integrity |
| DI-15 | Vector index dimensions match configured embedding model | 1024 for BGE-M3 |
| DI-16 | Re-indexing after embedding model change produces correct dimensions | Old embeddings replaced; new dimensions correct |

---

## 12. Test Data Strategy

### 12.1 Fixtures & Factories

| Entity | Strategy | Details |
|--------|----------|---------|
| Users | Factory | Generate users with each role (admin, analyst, viewer) |
| Organizations | Fixtures | 5 seed orgs with realistic names, sectors, tickers |
| News Articles | Factory | 50+ articles per org with mixed sentiment |
| Financial Snapshots | Factory | 365 daily snapshots per org (1 year history) |
| Annual Reports | Fixtures | 3 sample PDFs per seed org (FY2023–FY2025) |
| Knowledge Graph | Fixtures | Pre-built small graph (50 nodes, 100 edges) per org |
| Credit Accounts | Factory | Accounts with various balances (0, 100, 1000) |
| Notifications | Factory | Mix of read/unread across all types |
| Analysis Requests | Factory | Requests in each status (queued, scraping, ready, failed) |

### 12.2 Test Doubles

| Dependency | Double Type | Usage |
|------------|------------|-------|
| Anthropic API | Mock | Return canned LLM responses for unit/integration tests |
| OpenAI API | Mock | Return canned responses when testing provider swap |
| SendGrid (email) | Mock | Capture sent emails without delivery |
| Twilio (SMS) | Mock | Capture sent SMS without delivery |
| Yahoo Finance API | Mock | Return static financial data |
| NewsAPI | Mock | Return static news articles |
| BGE-M3 Embedding | Mock | Return random 1024-dim vectors for speed |
| MinIO/S3 | Testcontainer | Real MinIO instance in test |

---

## 13. Test Execution Schedule

### 13.1 Per-Commit (CI — ~5 min)

- Backend unit tests (pytest, all services)
- Frontend unit tests (Vitest)
- Linting (ruff, eslint)
- Type checking (mypy, tsc)

### 13.2 Per-PR (CI — ~15 min)

- All per-commit checks
- API integration tests (testcontainers)
- Frontend build verification
- Dependency vulnerability scan (`pip-audit`, `npm audit`)

### 13.3 Nightly (CI — ~45 min)

- All per-PR checks
- Full E2E test suite (Playwright)
- Accessibility scan (axe-core)
- Code coverage report generation

### 13.4 Weekly

- Performance test suite (Locust — baseline + normal profiles)
- AI pipeline quality test suite
- Soak test (4 hours)

### 13.5 Pre-Release

- Full regression: all E2E + integration + unit
- Performance: all profiles including peak and stress
- Security: OWASP ZAP scan + manual pen-test checklist
- Accessibility: full manual + automated audit
- AI quality: RAG accuracy + sentiment accuracy benchmarks
- Data integrity: retention policy verification

---

## 14. Exit Criteria

### 14.1 Release Readiness Checklist

| # | Criterion | Threshold | Status |
|---|-----------|-----------|--------|
| 1 | Backend unit test pass rate | 100% | ☐ |
| 2 | Frontend unit test pass rate | 100% | ☐ |
| 3 | Backend unit test coverage | >= 80% | ☐ |
| 4 | Frontend unit test coverage | >= 75% | ☐ |
| 5 | API integration test pass rate | 100% | ☐ |
| 6 | P0 E2E test pass rate | 100% | ☐ |
| 7 | P1 E2E test pass rate | >= 95% | ☐ |
| 8 | P2 E2E test pass rate | >= 90% | ☐ |
| 9 | Performance SLAs met (P95) | All P0 endpoints | ☐ |
| 10 | Zero Critical/High security vulnerabilities | 0 open | ☐ |
| 11 | Zero Critical accessibility violations | 0 open | ☐ |
| 12 | AI pipeline accuracy (entity extraction F1) | >= 80% | ☐ |
| 13 | RAG answer relevance (human-rated) | >= 4.0/5.0 | ☐ |
| 14 | Sentiment classification accuracy | >= 85% | ☐ |
| 15 | No P0/P1 bugs open | 0 open | ☐ |
| 16 | Dependency audit clean (no known critical CVEs) | 0 critical | ☐ |

### 14.2 Bug Severity Definitions

| Severity | Definition | Example | Resolution SLA |
|----------|-----------|---------|---------------|
| **P0 — Critical** | System unusable; data loss; security breach | Auth bypass; credit double-spend; data corruption | Block release; fix immediately |
| **P1 — High** | Major feature broken; no workaround | Search returns wrong results; pipeline stuck permanently | Fix before release |
| **P2 — Medium** | Feature partially broken; workaround exists | Chart doesn't render on Safari; export missing one section | Fix within next sprint |
| **P3 — Low** | Cosmetic; minor UX issue | Tooltip misaligned; slight color mismatch | Backlog |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-03-17 | Nitin Agarwal | Initial test plan covering all 10 microservices, frontend, AI/pipeline, performance, security, accessibility, and data integrity |
