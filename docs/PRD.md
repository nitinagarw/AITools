# AI360 — Product Requirements Document

## Introduction

**Product/Feature:** AI360
**Author:** Nitin Agarwal
**Last Updated:** 2026-03-18
**Status:** Draft

AI360 is a AI integrated application which gives a 360 view of an organization. It provides current status of the organization which includes organization performance, it share price and future plans. It connects to the web and scrapes all the present news articles in present and past and analyses the future growth trajectory of the organization. The information gathered about the organization is stored in a knowledge graph.
The solution will keep 360 view of multiple organizations.

Seed data for major organizations will be pre-built from publicly available Annual Reports. These Annual Reports are processed by an Agentic AI pipeline that extracts structured knowledge — entities, relationships, financials, strategic plans — and populates the organization's knowledge base in Neo4j. Vector embeddings are generated for all extracted content to enable semantic search and RAG-based querying. The embedding model is configurable; the default is self-hosted BGE-M3 (BAAI).

---

## Problem Statement

There is a limited ability for any professional to analyze an organization and take a decision based on analysis. It take huge amount of time to collect all the information about the organization, organize the information and summarize the inference. AI360 will quickly analyse the information available in public domain for any organization. It will also keep enriching the knowledge graph for the organization.

---

## Goals & Success Metrics

### Core Experience Goals

| Goal | Metric | Target |
|------|--------|--------|
| Instantaneous analysis access | Query response time for organizations with a built knowledge base | Under 2 seconds |
| Fast async onboarding of new organizations | Time from analysis request submission to user notification of readiness | Under 30 minutes for initial build |
| Per-organization AI model quality | Relevance score of AI-generated insights (human-rated sample) | 4.0+ out of 5.0 |

### Coverage & Freshness Goals

| Goal | Metric | Target |
|------|--------|--------|
| Broad organization coverage | Number of organizations with active 360 profiles and built AI models | 500+ organizations within 6 months |
| High data freshness | Age of latest ingested news article per organization | Less than 24 hours old |
| Knowledge graph completeness | Entities and relationships per organization's knowledge base | 100+ nodes per active organization |
| Continuous knowledge enrichment | New nodes/edges added per organization per week | 10+ per active organization |

### Prediction & Accuracy Goals

| Goal | Metric | Target |
|------|--------|--------|
| Accurate growth trajectory predictions | Prediction accuracy vs. actual quarterly results | 70%+ directional accuracy |
| Sentiment analysis accuracy | Sentiment classification accuracy on a labeled test set | 85%+ |
| Entity extraction precision | Precision/recall of extracted entities vs. manual annotation | 80%+ F1 score |

### Adoption & Engagement Goals

| Goal | Metric | Target |
|------|--------|--------|
| User adoption | Monthly active users | 80% of target analyst/professional team |
| Repeat usage | Users returning weekly | 60%+ weekly retention |
| Request completion rate | % of async analysis requests that complete successfully | 95%+ |
| Notification effectiveness | % of users who open the app within 1 hour of a readiness notification | 50%+ |

### Seed Data Strategy

The platform launches with **10 major organizations** pre-built as seed data. For each seed organization, the **last 3 years of publicly available Annual Reports** are processed to build a rich, day-one knowledge base. The seed data pipeline works as follows:

1. **Annual Report Collection** -- The last 3 years of Annual Reports (PDFs, HTML filings) for each of the 10 seed organizations are collected from corporate websites, stock exchanges, and regulatory portals. This provides a longitudinal view of each organization's trajectory.
2. **Agentic AI Processing (LangGraph)** -- A LangGraph-based Agentic AI pipeline orchestrates multiple specialized AI agents to process each Annual Report: (a) a **Document Parser Agent** extracts text, tables, and charts from PDF/HTML; (b) an **Entity Extraction Agent** identifies people, products, financials, strategies, and risks; (c) a **Relationship Mapping Agent** discovers connections between entities; (d) a **Summarization Agent** produces structured summaries per section. LangGraph's stateful graph execution model allows agents to collaborate, share intermediate state, and handle complex multi-step extraction workflows with retries and human-in-the-loop review if needed.
3. **Knowledge Base Population & Vector Embedding** -- Extracted entities and relationships are stored as nodes and edges in Neo4j. All textual content (summaries, extracted passages, financial narratives) is chunked and embedded using a **configurable embedding model** (default: self-hosted BGE-M3, supporting dense vectors up to 8192 token input, plus sparse and multi-granularity retrieval). The embedding model is abstracted behind a provider interface so it can be swapped to alternatives (e.g., OpenAI `text-embedding-3-large`, Cohere embed-v3, or any sentence-transformers compatible model) via configuration without code changes. Embeddings are stored in Neo4j's native vector index alongside the graph data, enabling both semantic similarity search and graph-based traversal in a single query.
4. **AI Model Initialization** -- The per-organization AI model is configured to use RAG over the Neo4j knowledge graph and vector store, giving it deep context from day one. With 3 years of Annual Reports, the model has strong historical context for trend analysis and growth trajectory predictions.

This ensures that 10 major organizations are available for instant querying from the moment the platform launches, without requiring users to wait for async builds. Additional organizations are onboarded via the async analysis workflow.

### Async Analysis Workflow

For organizations not covered by seed data, users do not wait for analysis to be built in real time. The workflow is:

1. **Submit** -- User provides a target organization name (and optional ticker/sector) and submits an analysis request.
2. **Async Build** -- The system asynchronously collects Annual Reports (if available), scrapes news and financial data, runs the LangGraph Agentic AI pipeline to build the knowledge base in Neo4j with vector embeddings (via self-hosted BGE-M3), configures the organization-specific AI model, and generates initial reports.
3. **Notify** -- Once the analysis is ready, the application notifies the user (in-app notification, and optionally email/push).
4. **Instant Access** -- From that point on, all queries against that organization's 360 profile are served instantaneously from the pre-built knowledge base and AI model.
5. **Continuous Enrichment** -- The knowledge base, vector embeddings, and AI model are continuously updated in the background as new data (news, financials, subsequent Annual Reports) is ingested.

### Per-Organization AI Model

Each tracked organization gets its own AI model built on top of its dedicated knowledge base in Neo4j. This means:

- The model uses RAG (retrieval-augmented generation) over the organization's knowledge graph and vector embeddings, grounding every response in organization-specific facts extracted from Annual Reports, news, and financial data.
- Vector embeddings enable semantic similarity search across all ingested content — the model retrieves the most relevant passages, entities, and relationships before generating a response.
- Queries about an organization are answered by its dedicated model, producing more relevant and contextual insights than a generic model.
- Model quality improves over time as the knowledge base grows through continuous data ingestion and new Annual Report processing.

---

## User Stories

### Personas

| Persona | Description | Default Role |
|---------|-------------|--------------|
| **Business Analyst** | Evaluates organizations for partnerships, market entry, or competitive positioning. Needs quick, high-level insights and comparison capabilities. | Analyst |
| **Investment Analyst** | Assesses organizations for investment decisions. Needs financial performance data, growth trajectories, risk factors, and forward-looking analysis. | Analyst |
| **Research Professional** | Conducts deep-dive research on organizations. Needs access to raw data, news timelines, entity relationships, and the ability to explore connections. | Analyst |
| **Admin** | Manages the platform — adds/removes organizations, monitors pipelines, configures system settings, manages users and roles. | Admin |
| **Viewer** | Has read-only access to organization dashboards and reports. Cannot submit analysis requests or export data. Useful for stakeholders who need visibility without full access. | Viewer |

### Roles & Permissions (RBAC)

The platform uses role-based access control. Users are assigned one role. Permissions are enforced at the API layer and reflected in the UI (unauthorized actions are hidden or disabled).

| Permission | Admin | Analyst | Viewer |
|------------|:-----:|:-------:|:------:|
| Search organizations | Yes | Yes | Yes |
| View organization dashboard | Yes | Yes | Yes |
| View news articles | Yes | Yes | Yes |
| View growth trajectory analysis | Yes | Yes | Yes |
| View knowledge graph | Yes | Yes | Yes |
| View Annual Report summaries | Yes | Yes | Yes |
| Use conversational AI Q&A | Yes | Yes | No |
| Compare multiple organizations | Yes | Yes | No |
| Submit analysis requests | Yes | Yes | No |
| View own request status | Yes | Yes | No |
| Export reports (PDF/CSV/JSON) | Yes | Yes | No |
| Add/remove organizations | Yes | No | No |
| Configure scraping frequency | Yes | No | No |
| Configure LLM/embedding/data sources | Yes | No | No |
| Manage platform settings | Yes | No | No |
| Manage users and assign roles | Yes | No | No |
| Trigger seed pipeline | Yes | No | No |
| View all users' requests | Yes | No | No |

### US1: Organization Search

**As a** business analyst, **I want to** search for an organization by name or ticker symbol **so that** I can quickly access its 360-degree profile.

- **Priority:** P0 (Critical)
- **Description:** The search is the primary entry point into the application. Users land on a search screen and type an organization name (e.g., "Reliance Industries") or ticker (e.g., "RELIANCE.NS"). Results appear instantly, showing matching organizations with their sector and a brief summary. Selecting a result navigates to the organization's full 360 dashboard. If the organization is not yet in the system, the user is prompted to submit an analysis request (US8).
- **Key Interactions:** Search input with autocomplete, search results list, navigation to dashboard, "Request Analysis" prompt for missing organizations.

### US2: Organization 360 Dashboard

**As a** business analyst, **I want to** view an organization dashboard showing performance, share price, and future plans **so that** I can assess its current standing at a glance.

- **Priority:** P0 (Critical)
- **Description:** The dashboard is the central hub for each organization. It presents a consolidated view: identity (name, sector, HQ, logo), financial snapshot (share price with daily change, market cap, revenue, profit), AI-extracted strategic initiatives and future plans, sentiment gauge (overall positive/neutral/negative from recent news), and knowledge base health (last updated, node count). For seed organizations, this is available from day one. For async-onboarded organizations, this becomes available once the pipeline completes.
- **Key Interactions:** Dashboard cards/widgets, share price chart with historical trend, "Future Plans" AI summary section, last-updated timestamps, manual refresh button.

### US3: News Articles & Media Intelligence

**As a** research professional, **I want to** see all scraped news articles (past and present) for an organization **so that** I can understand the media narrative and key events.

- **Priority:** P0 (Critical)
- **Description:** A chronological feed of news articles related to the organization. Each article shows the headline, source publication, date, AI-generated 2-3 sentence summary, and a sentiment tag (positive/neutral/negative with score). Users can filter by date range, source, or sentiment to focus on relevant coverage. Clicking an article opens the original source URL. Articles are deduplicated — if the same story appears across multiple publications, the system groups or prioritizes the primary source. This feed is continuously enriched as new articles are ingested.
- **Key Interactions:** Scrollable article feed, sentiment filter chips, date range picker, source filter dropdown, article summary cards, external link to source, sentiment distribution chart.

### US4: AI-Powered Growth Trajectory Analysis

**As an** investment analyst, **I want to** view AI-generated growth trajectory analysis for an organization **so that** I can make informed decisions about its future outlook.

- **Priority:** P0 (Critical)
- **Description:** The growth trajectory report is generated by the organization's dedicated AI model using RAG over its knowledge base. It synthesizes data from Annual Reports (last 3 years of financials, strategies, risk disclosures), recent news sentiment, and current financial metrics to produce: (a) projected revenue trend with confidence bands; (b) market position forecast relative to sector peers; (c) identified risk factors and headwinds; (d) strategic opportunities extracted from Annual Reports and news. Each prediction includes a confidence score. Reports are regenerated weekly by default but can be refreshed on demand. For seed organizations, this report is available at launch.
- **Key Interactions:** Growth trajectory chart, revenue projection with confidence bands, risk factor list, opportunity highlights, confidence score badges, "Refresh Analysis" button, report generation timestamp.

### US5: Knowledge Graph Exploration

**As a** research professional, **I want to** explore the knowledge graph for an organization **so that** I can discover relationships between entities, events, and trends.

- **Priority:** P1 (High)
- **Description:** An interactive visual graph showing the organization's entity network — people (executives, board members), products/services, competitors, events (acquisitions, partnerships, lawsuits), sectors, and locations. Edges represent typed relationships (e.g., "CEO of", "competes with", "acquired", "partnered with", "supplies to"). The graph is built from Annual Reports (via the LangGraph Agentic AI pipeline) and enriched from news. Users can click nodes to see detail panels, expand/collapse neighborhoods, and search within the graph. This is a powerful tool for discovering non-obvious connections — e.g., a competitor's board member who also sits on a partner's advisory board.
- **Key Interactions:** Interactive force-directed graph visualization, node click for detail panel, expand/collapse controls, graph search, node type filter (people, products, events, etc.), edge type filter, zoom/pan, full-screen mode.

### US6: Multi-Organization Comparison

**As a** business analyst, **I want to** compare multiple organizations side by side **so that** I can evaluate relative performance and outlook.

- **Priority:** P1 (High)
- **Description:** Users select 2-5 organizations from the tracked list and view a comparison dashboard. This shows key metrics in a table format: share price, revenue, market cap, profit margin, growth score, sentiment score. A chart overlay allows visual comparison of share price trends over selectable time periods (1M, 3M, 6M, 1Y, 3Y). The comparison also surfaces AI-generated competitive insights — e.g., "Organization A has been gaining market share in segment X while Organization B is divesting." Users can export the comparison as a PDF report or CSV data.
- **Key Interactions:** Organization multi-select, comparison table, share price overlay chart, time period selector, AI competitive insight section, export to PDF/CSV buttons.

### US7: Admin — Organization Management

**As an** admin, **I want to** add or remove organizations from the tracking list **so that** the platform stays focused on relevant entities.

- **Priority:** P0 (Critical)
- **Description:** Admins manage the organization catalog and platform configuration through a dedicated admin panel. Adding an organization involves providing a name, ticker symbol (optional), and sector, which triggers the async pipeline (Annual Report collection, Agentic AI processing, knowledge base build, AI model setup). Admins can deactivate an organization (pauses scraping and enrichment, retains all historical data) or reactivate it (resumes the pipeline). The admin panel shows per-organization health: pipeline status, last scrape time, knowledge base node count, AI model readiness, and any errors. Admins can also trigger the initial seed pipeline for batch loading organizations. Admins can configure the **scraping frequency** per organization (e.g., hourly, every 6 hours, daily) and set a global default. Admins can also configure the **LLM provider** (default: Anthropic; alternatives: OpenAI, self-hosted), the **embedding model** (default: BGE-M3), and **data sources** (add/remove financial and news API providers) through the platform settings. The system ships with free APIs (Yahoo Finance, Alpha Vantage, NewsAPI, Google News RSS) enabled by default; admins can add paid APIs (Bloomberg, Refinitiv, etc.) as additional or replacement sources.
- **Key Interactions:** Organization list with status indicators, add organization form, activate/deactivate toggle, pipeline status dashboard, error logs, "Trigger Seed Pipeline" action, per-organization scraping frequency selector, platform settings page for LLM provider, embedding model, and data source configuration.

### US8: Async Analysis Request & Notification

**As a** user, **I want to** submit an analysis request for a new organization and be notified when the 360 profile is ready **so that** I don't have to wait or keep checking manually.

- **Priority:** P0 (Critical)
- **Description:** When a user searches for an organization that doesn't exist in the system, they are prompted to submit an analysis request. The form accepts the organization name and optional ticker/sector. On submission, the system validates the request, deduplicates against existing organizations and pending requests, and returns a confirmation with an estimated completion time. The full async pipeline runs in the background — collecting Annual Reports, scraping news, building the knowledge base with vector embeddings, configuring the AI model, and generating initial reports. The user receives an in-app notification (and optionally email) when the profile is ready with a direct link to the dashboard. If the pipeline fails, the user is notified with a reason and an option to retry.
- **Key Interactions:** "Request Analysis" prompt on search miss, request form (name, ticker, sector), submission confirmation with ETA, notification bell in header with unread count, notification panel with clickable items, retry action on failure.

### US9: Request Status Tracking

**As a** user, **I want to** see the status of my pending analysis requests **so that** I know which organizations are still being processed.

- **Priority:** P1 (High)
- **Description:** A "My Requests" view shows all analysis requests submitted by the user. Each request displays the organization name, submission timestamp, and current pipeline stage: queued → scraping → building knowledge base → configuring AI model → ready (or failed). Status updates in near real-time via polling or WebSocket. Users can cancel a pending request before completion. Completed requests show a direct link to the organization's 360 dashboard.
- **Key Interactions:** Request list with status badges, pipeline stage progress bar, cancel button for pending requests, link to dashboard for completed requests, auto-refresh.

### US10: Conversational AI Q&A

**As an** investment analyst, **I want to** ask natural language questions about an organization and get AI-generated answers grounded in its knowledge base **so that** I can get specific insights without navigating multiple dashboard sections.

- **Priority:** P1 (High)
- **Description:** Each organization's 360 profile includes a conversational AI chat interface. The user can ask questions in natural language — e.g., "What were Reliance's key strategic initiatives in FY2025?", "How has the debt-to-equity ratio changed over the last 3 years?", "What are the main risks mentioned in the latest Annual Report?". The organization's dedicated AI model answers using RAG over its Neo4j knowledge graph and vector embeddings, citing the source documents (Annual Report section, news article, financial snapshot) for each claim. The chat supports multi-turn conversations with context retention within a session.
- **Key Interactions:** Chat input at the bottom of the dashboard, message bubbles with AI responses, source citations as clickable links, follow-up question suggestions, conversation history within the session, "New Conversation" button.

### US11: Annual Report Summaries

**As a** research professional, **I want to** view structured summaries of an organization's Annual Reports **so that** I can quickly understand year-over-year changes without reading the full documents.

- **Priority:** P2 (Medium)
- **Description:** For each processed Annual Report, the system displays an AI-generated structured summary covering: financial highlights (revenue, profit, growth rates), strategic priorities, risk factors, management commentary key points, and notable changes from the prior year. Users can view summaries for each of the last 3 years and see a year-over-year comparison highlighting what changed. Each summary section links back to the relevant page/section of the original Annual Report PDF.
- **Key Interactions:** Annual Report timeline (FY2023, FY2024, FY2025), structured summary cards per section, year-over-year comparison toggle, link to original PDF with page reference, expand/collapse sections.

### US12: Report Export & Sharing

**As a** business analyst, **I want to** export an organization's 360 profile as a PDF or structured data file **so that** I can share it with stakeholders who don't have access to the platform.

- **Priority:** P2 (Medium)
- **Description:** Users can generate a downloadable report for any organization with a ready profile. The PDF includes: executive summary, financial snapshot, growth trajectory analysis, news sentiment overview, key knowledge graph relationships, and Annual Report summaries. A CSV/JSON export option provides raw structured data (financials, metrics, entity list) for users who want to run their own analysis. Export generation runs asynchronously for large reports and notifies the user when ready.
- **Key Interactions:** "Export" button on dashboard, format selector (PDF/CSV/JSON), section selector (choose which sections to include), async generation with notification for large reports, download link.

### US13: User & Role Management (RBAC)

**As an** admin, **I want to** manage users and assign roles (Admin, Analyst, Viewer) **so that** each user has the appropriate level of access to platform features.

- **Priority:** P0 (Critical)
- **Description:** The platform enforces role-based access control (RBAC) with three roles: Admin, Analyst, and Viewer. Users are authenticated via corporate SSO; on first login, they are assigned a default role (configurable in PlatformSettings, default: Viewer). Admins can promote/demote users through a user management panel. Permissions are enforced at the API layer — unauthorized requests return 403 Forbidden. The UI adapts to the user's role: actions the user cannot perform are hidden or disabled (e.g., a Viewer does not see the "Export" button or "Request Analysis" prompt). Admins can view an audit log of role changes.
- **Key Interactions:** User management panel (list users, search, filter by role), role assignment dropdown per user, default role setting in platform settings, role-aware UI (hide/disable unauthorized actions), audit log of role changes.

### US14: Notification Preferences

**As a** user, **I want to** configure how I receive notifications (email, SMS, push) and control which events trigger each channel **so that** I get alerted through my preferred channels without unnecessary noise.

- **Priority:** P1 (High)
- **Description:** Each user can configure their notification delivery preferences from a settings page. Three channels are available: email (default on), SMS (default off), and push notification (default off). In-app notifications are always delivered regardless of preferences. Users can map specific notification types (analysis ready, analysis failed, export ready, low credits, quota reached) to specific channels — e.g., "send analysis ready via email and SMS, but credit warnings via email only." Users can also set quiet hours during which non-critical notifications are held and delivered when quiet hours end. SMS and push require the user to provide a phone number or subscribe to push respectively. All notification delivery attempts are logged with per-channel success/failure status.
- **Key Interactions:** Notification preferences page in user settings, channel toggles (email/SMS/push), per-notification-type channel mapping grid, quiet hours time range picker, phone number input for SMS, push notification subscription button, delivery history log.

### US15: Credits & Quota Management

**As a** user, **I want to** manage my credit balance and set a usage quota **so that** I can control my spending and avoid unexpected costs.

- **Priority:** P0 (Critical)
- **Description:** Each user account has a pre-purchased credit balance. Billable actions (analysis requests, report exports, AI Q&A queries) consume credits at rates set by the admin. Users can view their current balance, transaction history, and set a personal quota limit — the maximum credits they allow to be spent in a billing cycle. The quota cannot exceed the available credit balance. When the user's quota is reached, billable actions are blocked until the next billing cycle or until the user raises their quota (if credits are available). When credits drop below a user-configurable threshold, a low-credit notification is sent. Admins configure per-action credit pricing via a CreditPricing table. Admins can also issue credit adjustments (add/deduct) for any user.
- **Key Interactions:** Credits dashboard (balance, quota used/remaining, billing cycle dates), transaction history table with filters, quota limit slider/input (capped at available credits), low-credit threshold setting, "Purchase Credits" flow (or admin top-up), notification when quota reached or credits low, admin pricing configuration panel, admin credit adjustment action.

---

## Acceptance Criteria

### US1: Organization Search

- [ ] User can search for an organization by name or ticker symbol
- [ ] Search results appear within 2 seconds
- [ ] Results show organization name, sector, and a brief summary
- [ ] If no match is found, the system displays a clear message and suggests adding the organization
- [ ] Search supports partial and fuzzy matching

### US2: Organization Dashboard

- [ ] Dashboard displays organization name, sector, headquarters, and logo
- [ ] Current share price is shown with daily change (absolute and percentage)
- [ ] Key performance metrics are displayed (revenue, profit, market cap, employee count)
- [ ] A "Future Plans" section summarizes AI-extracted strategic initiatives
- [ ] Dashboard data refreshes automatically or provides a manual refresh option
- [ ] All data points show their source and last-updated timestamp

### US3: News Articles View

- [ ] News articles are listed in reverse chronological order
- [ ] Each article shows: headline, source, date, and a brief AI-generated summary
- [ ] User can filter articles by date range, source, or sentiment (positive/neutral/negative)
- [ ] Clicking an article opens the original source URL
- [ ] New articles are ingested within 24 hours of publication
- [ ] System handles duplicate articles from different sources gracefully

### US4: Growth Trajectory Analysis

- [ ] System displays an AI-generated growth trajectory report for the selected organization
- [ ] Report includes projected revenue trend, market position forecast, and risk factors
- [ ] Analysis is powered by the organization's dedicated AI model and knowledge base
- [ ] Analysis is based on historical data, current performance, and news sentiment
- [ ] Report shows a confidence score for each prediction
- [ ] For organizations with a built knowledge base, the report loads instantaneously (under 2 seconds)
- [ ] Report is regenerated at a configurable interval (default: weekly) via background enrichment
- [ ] User can request an on-demand refresh of the analysis

### US5: Knowledge Graph Exploration

- [ ] User can view a visual graph of entities and relationships for an organization
- [ ] Graph nodes represent: organization, people (executives), products, events, competitors, sectors
- [ ] Edges represent relationships: "CEO of", "competes with", "acquired", "partnered with", etc.
- [ ] User can click a node to see detailed information
- [ ] User can expand/collapse graph nodes to control depth
- [ ] Graph renders within 5 seconds for organizations with up to 500 nodes

### US6: Multi-Organization Comparison

- [ ] User can select 2-5 organizations to compare
- [ ] Comparison view shows key metrics side by side (share price, revenue, growth score, sentiment)
- [ ] A chart overlay allows visual comparison of share price trends
- [ ] User can export the comparison as a PDF or CSV

### US7: Admin Organization Management

- [ ] Admin can add a new organization by providing name, ticker symbol, and sector
- [ ] Adding an organization triggers an async pipeline: data scrape, knowledge base build, and AI model configuration
- [ ] Admin can deactivate an organization (stops scraping and model updates, retains historical data)
- [ ] Admin can reactivate a deactivated organization (resumes enrichment pipeline)
- [ ] Admin can view per-organization status: scraping status, knowledge base build progress, AI model readiness, and last-updated timestamps
- [ ] Admin can configure scraping frequency per organization (options: hourly, every 6 hours, every 12 hours, daily)
- [ ] Admin can set a global default scraping frequency that applies to newly added organizations
- [ ] Admin can configure the LLM provider from platform settings (default: Anthropic; alternatives: OpenAI, self-hosted)
- [ ] Admin can configure the embedding model from platform settings (default: self-hosted BGE-M3; alternatives: OpenAI, Cohere, sentence-transformers compatible)
- [ ] Changes to LLM or embedding model configuration take effect for new processing jobs without disrupting in-progress pipelines
- [ ] Admin can view the list of configured data sources (financial and news) with their status (enabled/disabled)
- [ ] Admin can add a new data source by providing: provider name, API base URL, API key (optional), and adapter configuration
- [ ] Admin can enable or disable a data source without deleting it
- [ ] Default free data sources (Yahoo Finance, Alpha Vantage, NewsAPI, Google News RSS) cannot be deleted but can be disabled
- [ ] When multiple data sources provide the same data type, the system uses priority ordering to query and merge results

### US8: Async Analysis Request & Notification

- [ ] User can submit an analysis request for a new organization by providing name and optional ticker/sector
- [ ] System validates the request and returns a confirmation with an estimated completion time
- [ ] The analysis pipeline runs asynchronously (scraping, knowledge base build, AI model setup)
- [ ] Once the 360 profile is ready, the user receives an in-app notification
- [ ] Notification includes a direct link to the organization's dashboard
- [ ] If the pipeline fails, the user is notified with a reason and option to retry
- [ ] User does not need to keep the app open; notification is delivered on next visit or via configured channel

### US9: Request Status Tracking

- [ ] User can view a list of all their submitted analysis requests
- [ ] Each request shows: organization name, submission time, current status (queued, scraping, building knowledge base, training model, ready, failed)
- [ ] Status updates in near real-time (polling or WebSocket)
- [ ] User can cancel a pending request before it completes
- [ ] Completed requests link directly to the organization's 360 dashboard

### US10: Conversational AI Q&A

- [ ] Each organization dashboard includes a chat interface for natural language queries
- [ ] User can type a question and receive an AI-generated answer within 5 seconds
- [ ] Answers are grounded in the organization's knowledge base (Annual Reports, news, financials)
- [ ] Each claim in the response includes a source citation (document name, section, or article headline)
- [ ] Citations are clickable and navigate to the source material
- [ ] Chat supports multi-turn conversations with context retained within the session
- [ ] AI gracefully handles questions outside its knowledge base (e.g., "I don't have enough information to answer that")
- [ ] User can start a new conversation to reset context
- [ ] Follow-up question suggestions are displayed after each AI response

### US11: Annual Report Summaries

- [ ] For each processed Annual Report, the system displays a structured AI-generated summary
- [ ] Summary includes: financial highlights, strategic priorities, risk factors, management commentary key points
- [ ] Summaries are available for each of the last 3 processed fiscal years
- [ ] A year-over-year comparison view highlights material changes between consecutive years
- [ ] Each summary section links back to the relevant page/section of the original Annual Report PDF
- [ ] Summaries load within 2 seconds for organizations with a ready knowledge base

### US12: Report Export & Sharing

- [ ] User can export an organization's 360 profile as a PDF
- [ ] User can export structured data (financials, entity list, metrics) as CSV or JSON
- [ ] User can select which sections to include in the export (executive summary, financials, growth trajectory, news sentiment, knowledge graph, Annual Report summaries)
- [ ] PDF export includes properly formatted charts, tables, and text
- [ ] For large reports, export generation runs asynchronously and the user is notified when the file is ready for download
- [ ] Exported files include a generation timestamp and data freshness disclaimer

### US13: User & Role Management (RBAC)

- [ ] Three roles exist: Admin, Analyst, Viewer
- [ ] On first SSO login, a new user is assigned the default role (configurable in PlatformSettings; default: Viewer)
- [ ] Admin can view a list of all users with their current role, last login, and registration date
- [ ] Admin can change a user's role via a dropdown in the user management panel
- [ ] Role changes take effect immediately on the user's next API call (no session restart needed)
- [ ] API endpoints enforce permissions per role — unauthorized requests return 403 Forbidden
- [ ] UI adapts to the user's role: actions the user cannot perform are hidden or visually disabled
- [ ] Viewers can search and view dashboards, news, analysis, knowledge graphs, and Annual Report summaries (read-only)
- [ ] Viewers cannot submit analysis requests, export reports, use conversational AI Q&A, or compare organizations
- [ ] Analysts have all Viewer permissions plus: submit analysis requests, export reports, use AI Q&A, compare organizations
- [ ] Admins have all Analyst permissions plus: manage organizations, configure platform settings, manage users/roles, trigger seed pipeline
- [ ] Admin can view an audit log of all role changes (who changed, what role, when)
- [ ] At least one Admin must exist at all times — the last Admin cannot be demoted

### US14: Notification Preferences

- [ ] In-app notifications are always delivered for all notification types (cannot be disabled)
- [ ] User can enable/disable email notifications (default: enabled)
- [ ] User can enable/disable SMS notifications (default: disabled); enabling requires a valid phone number
- [ ] User can enable/disable push notifications (default: disabled); enabling requires browser push subscription
- [ ] User can configure which notification types go to which channels (e.g., analysis_ready → email + SMS, credit_low → email only)
- [ ] User can set quiet hours (start time, end time) during which non-critical notifications are queued and delivered when quiet hours end
- [ ] System logs delivery status per channel for each notification (delivered, failed, queued)
- [ ] If a channel delivery fails (e.g., SMS provider error), the notification is still delivered via other enabled channels
- [ ] User can view their notification delivery history with per-channel status

### US15: Credits & Quota Management

- [ ] Each user has a credit account with a pre-purchased balance
- [ ] Billable actions (analysis request, export, AI Q&A query) deduct credits at admin-configured rates
- [ ] User can view their current credit balance, quota limit, quota used, and billing cycle dates
- [ ] User can view a transaction history showing: action, credits debited/credited, balance after, timestamp
- [ ] User can set a personal quota limit — the maximum credits to spend per billing cycle
- [ ] Quota limit cannot exceed the user's available credit balance
- [ ] When quota is reached, billable actions are blocked with a clear message ("Quota reached. Raise your limit or wait for the next billing cycle.")
- [ ] User can raise their quota limit at any time (up to available credits) to unblock themselves
- [ ] User can set a low-credit threshold; a notification is sent when balance drops below it
- [ ] A notification is sent when the user's quota is reached
- [ ] Quota usage resets automatically at the start of each billing cycle
- [ ] Admin can configure per-action credit pricing via a CreditPricing management page
- [ ] Admin can issue credit adjustments (add or deduct credits) for any user with a reason
- [ ] Credit balance can never go negative — if insufficient credits remain for an action, it is blocked before execution

---

## Constraints

- **Tech Stack:** Python 3.10+ backend (FastAPI); React 18 with TypeScript frontend; Neo4j for knowledge graph and vector embeddings (using Neo4j's native vector index); PostgreSQL for relational data; Celery or equivalent for background task scheduling; LangGraph for Agentic AI pipeline (Annual Report processing and knowledge extraction); configurable LLM provider behind a provider-agnostic interface (default: Anthropic; alternatives: OpenAI, self-hosted); configurable embedding model behind a provider-agnostic interface (default: self-hosted BGE-M3 by BAAI; alternatives: OpenAI, Cohere, or any sentence-transformers compatible model); admin-configurable scraping frequency per organization
- **Performance:** Dashboard page load under 3 seconds; search results under 2 seconds; knowledge graph render under 5 seconds for up to 500 nodes
- **Security & Access:** Role-based access control (RBAC) with three roles: Admin, Analyst, Viewer. Authentication via corporate SSO. Permissions enforced at the API layer. Default role for new users configurable in PlatformSettings.
- **Notifications:** Configurable multi-channel delivery: in-app (always on), email, SMS, push. User controls channel preferences and quiet hours. Requires email service (e.g., SendGrid, SES), SMS provider (e.g., Twilio), and web push (e.g., Firebase Cloud Messaging or Web Push API).
- **Credits & Billing:** Pre-purchased credit system. Billable actions debit credits at admin-configured rates. Users set personal quota limits capped at available credits. Credit balance cannot go negative.
- **Retention Policy:** News articles are retained for 7 years from publication date, then archived or purged. Financial snapshots, analysis reports, Annual Report data, knowledge graph entities/relationships, and vector embeddings are persisted indefinitely (long-term). Credit transactions and audit logs are also persisted long-term for compliance.
- **Compliance:** Only publicly available data will be scraped and stored; must comply with robots.txt directives of target sites; no proprietary or paywalled content; GDPR-compliant handling of any personal data (executive names, etc.)
- **Data Sources:** Financial and news data APIs are pluggable. Default free APIs ship out of the box; admins can add paid APIs for richer data. Defaults: Yahoo Finance (stock prices, financials), Alpha Vantage (historical data), Google News RSS / NewsAPI (news articles). Paid alternatives can be added by admin: Bloomberg, Refinitiv, S&P Capital IQ, Dow Jones, etc. The system uses a data source adapter pattern so new APIs are added via configuration, not code changes.
- **Dependencies:** Default free financial APIs (Yahoo Finance, Alpha Vantage); default free news APIs (NewsAPI, Google News RSS); Anthropic API (default LLM provider; configurable to OpenAI or self-hosted); Neo4j database; GPU infrastructure for self-hosted embedding model (if using BGE-M3 default) or API key for cloud embedding provider; LangGraph framework; publicly available Annual Reports for 10 seed organizations (last 3 years each); email delivery service (e.g., SendGrid, AWS SES); SMS provider (e.g., Twilio); push notification service (e.g., Firebase Cloud Messaging or Web Push API)

---

## Technical Notes

**Data Models:**

```
User
- id: UUID (primary key)
- sso_id: string (unique, from corporate SSO)
- email: string (unique)
- display_name: string
- role: enum (admin, analyst, viewer; default: from PlatformSettings.default_user_role)
- is_active: boolean (default: true)
- last_login_at: datetime (nullable)
- created_at: datetime
- updated_at: datetime

RoleChangeAuditLog
- id: UUID (primary key)
- user_id: UUID (foreign key -> User; the user whose role was changed)
- changed_by: UUID (foreign key -> User; the admin who made the change)
- old_role: enum (admin, analyst, viewer)
- new_role: enum (admin, analyst, viewer)
- reason: string (nullable; optional note from admin)
- created_at: datetime

Organization
- id: UUID (primary key)
- name: string (unique, required)
- ticker_symbol: string (nullable, for publicly traded companies)
- sector: string
- headquarters: string
- description: text
- logo_url: string (nullable)
- is_active: boolean (default: true)
- scraping_frequency: enum (hourly, every_6h, every_12h, daily; default: from platform settings)
- created_at: datetime
- updated_at: datetime

PlatformSettings (singleton / admin-managed)
- id: UUID (primary key)
- default_user_role: enum (admin, analyst, viewer; default: viewer)
- default_scraping_frequency: enum (hourly, every_6h, every_12h, daily; default: daily)
- llm_provider: string (default: "anthropic"; alternatives: "openai", "self_hosted")
- llm_model: string (default: "claude-sonnet-4-20250514"; configurable per provider)
- llm_api_key: string (encrypted; nullable for self-hosted)
- llm_endpoint_url: string (nullable; for self-hosted provider)
- embedding_provider: string (default: "bge-m3"; alternatives: "openai", "cohere", "sentence_transformers")
- embedding_model: string (default: "BAAI/bge-m3")
- embedding_dimensions: integer (default: 1024)
- embedding_endpoint_url: string (nullable; for self-hosted or custom endpoint)
- updated_at: datetime
- updated_by: string (admin user ID)

DataSourceConfig (admin-managed, multiple rows)
- id: UUID (primary key)
- source_type: enum (financial, news)
- provider_name: string (e.g., "yahoo_finance", "alpha_vantage", "bloomberg", "newsapi", "google_news_rss")
- display_name: string (e.g., "Yahoo Finance", "Bloomberg Terminal API")
- adapter_class: string (fully qualified Python class name implementing the data source adapter interface)
- base_url: string (API base URL)
- api_key: string (encrypted; nullable for free/keyless APIs)
- config: JSON (provider-specific settings: rate limits, endpoints, field mappings, etc.)
- is_enabled: boolean (default: true)
- is_default: boolean (true for free APIs shipped out of the box)
- priority: integer (determines query order when multiple sources provide the same data; lower = higher priority)
- created_at: datetime
- updated_at: datetime

NewsArticle
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization)
- headline: string
- source: string (publication name)
- source_url: string (original article URL)
- published_at: datetime
- summary: text (AI-generated)
- sentiment: enum (positive, neutral, negative)
- sentiment_score: float (-1.0 to 1.0)
- raw_content: text
- ingested_at: datetime
- retention_expires_at: datetime (auto-set to published_at + 7 years; used by the archival job)
- is_archived: boolean (default: false; set to true when article is archived after retention period)

AnnualReport
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization)
- fiscal_year: integer (e.g., 2025)
- title: string (e.g., "Annual Report 2024-25")
- source_url: string (URL where the report was downloaded)
- file_path: string (local/S3 path to stored PDF)
- processing_status: enum (pending, parsing, extracting, embedding, completed, failed)
- pages_count: integer (nullable)
- extracted_entities_count: integer (default: 0)
- embeddings_count: integer (default: 0)
- processed_by: string (Agentic AI pipeline version)
- ingested_at: datetime
- processed_at: datetime (nullable)

FinancialSnapshot
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization)
- share_price: decimal (nullable)
- daily_change_pct: float
- market_cap: decimal (nullable)
- revenue_ttm: decimal (trailing twelve months, nullable)
- profit_ttm: decimal (nullable)
- employee_count: integer (nullable)
- snapshot_date: date
- source: string
- created_at: datetime

AnalysisReport
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization)
- report_type: enum (growth_trajectory, sentiment_summary, competitive_landscape)
- content: JSON (structured analysis output)
- confidence_score: float (0.0 to 1.0)
- generated_at: datetime
- valid_until: datetime
- model_version: string (LLM model used)

KnowledgeGraphNode (Neo4j)
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization)
- entity_type: enum (organization, person, product, event, sector, location, financial_metric, strategy)
- entity_name: string
- properties: JSON (flexible key-value attributes)
- source_document_id: UUID (nullable, links to AnnualReport or NewsArticle that produced this node)
- embedding: vector (dense vector embedding for semantic search, stored in Neo4j vector index)
- created_at: datetime
- updated_at: datetime

KnowledgeGraphEdge (Neo4j)
- id: UUID (primary key)
- source_node_id: UUID (foreign key -> KnowledgeGraphNode)
- target_node_id: UUID (foreign key -> KnowledgeGraphNode)
- relationship_type: string (e.g., "CEO_of", "competes_with", "acquired", "partnered_with")
- properties: JSON (e.g., date, confidence)
- source_document_id: UUID (nullable, links to source document)
- created_at: datetime

DocumentChunk (for vector embeddings — stored in Neo4j vector index)
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization)
- source_type: enum (annual_report, news_article, financial_filing)
- source_document_id: UUID (foreign key -> AnnualReport or NewsArticle)
- chunk_text: text (the text passage)
- chunk_index: integer (position within the source document)
- embedding: vector (dimensions depend on configured model; 1024 for BGE-M3 default; optional sparse vector for hybrid retrieval)
- metadata: JSON (section title, page number, fiscal year, etc.)
- created_at: datetime

OrganizationAIModel
- id: UUID (primary key)
- organization_id: UUID (foreign key -> Organization, unique)
- model_type: string (e.g., "rag_knowledgebase", "fine_tuned", "prompt_engineered")
- llm_provider: string (inherited from PlatformSettings at build time, e.g., "anthropic", "openai", "self_hosted")
- base_model: string (default: "claude-sonnet-4-20250514"; inherited from PlatformSettings at build time)
- embedding_model: string (inherited from PlatformSettings at build time, e.g., "bge-m3", "text-embedding-3-large", "cohere-embed-v3")
- embedding_dimensions: integer (vector dimensions produced by the configured model, e.g., 1024 for BGE-M3)
- config: JSON (model-specific config: system prompt, retrieval settings, fine-tune ID, embedding provider endpoint)
- knowledge_base_version: integer (increments on each enrichment cycle)
- status: enum (building, ready, updating, failed)
- last_trained_at: datetime (nullable)
- created_at: datetime
- updated_at: datetime

AnalysisRequest
- id: UUID (primary key)
- user_id: string (from SSO)
- organization_name: string (target org as provided by user)
- ticker_symbol: string (nullable)
- sector: string (nullable)
- organization_id: UUID (nullable, linked once org is created/matched)
- status: enum (queued, scraping, building_knowledge_base, training_model, ready, failed)
- estimated_completion: datetime (nullable)
- failure_reason: text (nullable)
- submitted_at: datetime
- completed_at: datetime (nullable)

Notification
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- type: enum (analysis_ready, analysis_failed, enrichment_complete, export_ready, credit_low, quota_reached)
- title: string
- message: text
- link_url: string (nullable, e.g., link to org dashboard)
- is_read: boolean (default: false)
- delivery_channels: JSON (list of channels attempted, e.g., ["in_app", "email", "sms"])
- delivery_status: JSON (per-channel status, e.g., {"in_app": "delivered", "email": "delivered", "sms": "failed"})
- created_at: datetime

NotificationPreferences (per user)
- id: UUID (primary key)
- user_id: UUID (foreign key -> User, unique)
- email_enabled: boolean (default: true)
- email_address: string (default: from User.email; can be overridden)
- sms_enabled: boolean (default: false)
- sms_phone_number: string (nullable; required if sms_enabled is true)
- push_enabled: boolean (default: false)
- push_subscription: JSON (nullable; web push subscription object or device token)
- quiet_hours_start: time (nullable; e.g., 22:00 — no notifications during quiet hours)
- quiet_hours_end: time (nullable; e.g., 07:00)
- notify_on: JSON (map of notification types to enabled channels, e.g., {"analysis_ready": ["in_app", "email", "sms"], "credit_low": ["in_app", "email"]})
- created_at: datetime
- updated_at: datetime

CreditAccount (per user)
- id: UUID (primary key)
- user_id: UUID (foreign key -> User, unique)
- total_credits_purchased: decimal (lifetime total credits purchased)
- credits_balance: decimal (current available credits)
- quota_limit: decimal (user-set spending limit per billing cycle; must be <= credits_balance)
- quota_used: decimal (credits consumed in the current billing cycle; resets each cycle)
- billing_cycle_start: date (start of current billing cycle)
- billing_cycle_days: integer (default: 30; length of billing cycle)
- low_credit_threshold: decimal (nullable; user-set threshold to trigger a credit_low notification)
- created_at: datetime
- updated_at: datetime

CreditTransaction
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- transaction_type: enum (purchase, debit_analysis_request, debit_export, debit_ai_query, refund, admin_adjustment)
- amount: decimal (positive for credits in, negative for credits out)
- balance_after: decimal (running balance after this transaction)
- description: string (e.g., "Analysis request for Reliance Industries", "100 credits purchased")
- reference_id: UUID (nullable; links to AnalysisRequest, export job, or chat session that consumed credits)
- created_at: datetime

CreditPricing (admin-managed)
- id: UUID (primary key)
- action_type: enum (analysis_request, export_pdf, export_csv, ai_query, ai_query_followup)
- credits_cost: decimal (credits consumed per action)
- description: string (e.g., "New organization analysis request")
- is_active: boolean (default: true)
- created_at: datetime
- updated_at: datetime
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/organizations | List all tracked organizations |
| GET | /api/organizations/{id} | Get organization details and summary |
| POST | /api/organizations | (Admin) Add a new organization |
| PUT | /api/organizations/{id} | (Admin) Update organization details |
| PATCH | /api/organizations/{id}/activate | (Admin) Activate/deactivate an organization |
| GET | /api/organizations/{id}/dashboard | Get dashboard data (financials, plans, status) |
| GET | /api/organizations/{id}/news | List news articles for an organization |
| GET | /api/organizations/{id}/news?sentiment=positive&from=2026-01-01 | Filtered news |
| GET | /api/organizations/{id}/analysis | Get latest AI analysis reports |
| POST | /api/organizations/{id}/analysis/refresh | Trigger on-demand analysis refresh |
| GET | /api/organizations/{id}/graph | Get knowledge graph nodes and edges |
| GET | /api/organizations/{id}/graph/node/{node_id} | Get node details |
| GET | /api/organizations/{id}/financials | Get financial snapshots history |
| GET | /api/compare?ids=uuid1,uuid2,uuid3 | Compare multiple organizations |
| GET | /api/search?q=term | Search organizations by name or ticker |
| POST | /api/analysis-requests | Submit async analysis request for a new organization |
| GET | /api/analysis-requests | List user's analysis requests and their statuses |
| GET | /api/analysis-requests/{id} | Get status details for a specific request |
| DELETE | /api/analysis-requests/{id} | Cancel a pending analysis request |
| GET | /api/notifications | List user's notifications (with delivery status) |
| PATCH | /api/notifications/{id}/read | Mark a notification as read |
| GET | /api/me/notification-preferences | Get user's notification channel preferences |
| PUT | /api/me/notification-preferences | Update notification channel preferences |
| GET | /api/me/credits | Get user's credit balance, quota, and billing cycle info |
| GET | /api/me/credits/transactions | List user's credit transaction history |
| PATCH | /api/me/credits/quota | Update user's quota limit (capped at available credits) |
| PATCH | /api/me/credits/low-threshold | Set low-credit notification threshold |
| GET | /api/admin/credits/pricing | (Admin) List per-action credit pricing |
| PUT | /api/admin/credits/pricing/{id} | (Admin) Update credit pricing for an action |
| POST | /api/admin/credits/adjust/{user_id} | (Admin) Issue credit adjustment (add/deduct) for a user |
| GET | /api/organizations/{id}/model | Get AI model status and metadata for an organization |
| GET | /api/organizations/{id}/annual-reports | List ingested Annual Reports for an organization |
| POST | /api/organizations/{id}/annual-reports | (Admin) Upload or link an Annual Report for processing |
| GET | /api/organizations/{id}/annual-reports/{report_id} | Get processing status and extracted summary for a report |
| POST | /api/seed/initialize | (Admin) Trigger seed data pipeline for pre-configured major organizations |
| GET | /api/seed/status | (Admin) View seed pipeline progress across all organizations |
| GET | /api/admin/settings | (Admin) Get current platform settings (LLM provider, embedding model, default scraping frequency) |
| PUT | /api/admin/settings | (Admin) Update platform settings |
| PATCH | /api/organizations/{id}/scraping-frequency | (Admin) Set scraping frequency for a specific organization |
| GET | /api/admin/data-sources | (Admin) List all configured data source adapters (financial and news) |
| POST | /api/admin/data-sources | (Admin) Add a new data source (e.g., Bloomberg API) |
| PUT | /api/admin/data-sources/{id} | (Admin) Update a data source configuration |
| PATCH | /api/admin/data-sources/{id}/enable | (Admin) Enable or disable a data source |
| DELETE | /api/admin/data-sources/{id} | (Admin) Remove a non-default data source |
| GET | /api/admin/users | (Admin) List all users with roles and last login |
| GET | /api/admin/users/{id} | (Admin) Get user details |
| PATCH | /api/admin/users/{id}/role | (Admin) Change a user's role |
| GET | /api/admin/audit-log/roles | (Admin) View role change audit log |
| GET | /api/me | Get current user's profile and role |

**Architecture Notes:**

> **Full architecture specification:** See [docs/architecture.md](architecture.md) for the complete microservices solution architecture, including service decomposition, data ownership, inter-service communication, event catalog, deployment topology, and architecture diagrams.

The system is decomposed into **10 microservices** organized around bounded contexts. At a high level, the six functional layers are:

1. **Seed Data & Annual Report Ingestion** -- At launch, the last 3 years of Annual Reports for 10 major organizations are collected and processed. A LangGraph-based Agentic AI pipeline orchestrates the processing through specialized agents with stateful graph execution: (a) **Document Parser Agent** — extracts text, tables, and charts from PDF/HTML reports; (b) **Entity Extraction Agent** — identifies people, products, financial metrics, strategies, risks, and organizational structure; (c) **Relationship Mapping Agent** — discovers connections between entities (e.g., executive-to-company, product-to-revenue, competitor relationships); (d) **Summarization Agent** — produces structured summaries per section (financials, strategy, risk factors). The output feeds directly into the knowledge base and vector store. Subsequent Annual Reports are processed incrementally to update the knowledge base.

2. **Ongoing Data Ingestion** -- Background workers (Celery tasks) periodically fetch news and financial data using a pluggable data source adapter system. Default free APIs (Yahoo Finance, Alpha Vantage for financials; NewsAPI, Google News RSS for news) are shipped out of the box and require no paid subscriptions. Admins can add paid data sources (Bloomberg, Refinitiv, S&P Capital IQ, Dow Jones, etc.) via the admin panel — each is registered as a `DataSourceConfig` entry with an adapter class that implements a common interface. When multiple sources provide the same data type, the system queries them in priority order and merges/deduplicates results. Scraping frequency is admin-configurable per organization (hourly, every 6h, every 12h, or daily) with a platform-wide default set in PlatformSettings. Celery beat schedules are updated dynamically when an admin changes the frequency. Newly ingested content is chunked and embedded alongside Annual Report data.

3. **Processing & Model Layer** -- An NLP/AI pipeline processes all ingested data through: (a) entity extraction to identify people, products, events, and relationships; (b) sentiment analysis on news articles; (c) growth trajectory prediction using historical trends, financial data, and sentiment signals. All text content is embedded using the configured embedding model (default: self-hosted BGE-M3) via a provider-agnostic embedding interface, and stored in Neo4j's vector index. Each organization gets a dedicated AI model that uses RAG (retrieval-augmented generation) over its Neo4j knowledge graph and vector embeddings. When a query is made, the system retrieves the most semantically relevant document chunks and graph context via vector similarity search, then feeds them to the LLM for grounded, organization-specific responses. The LLM is called via a provider-agnostic abstraction layer (default: Anthropic; configurable by admin to OpenAI or self-hosted) so providers can be swapped without code changes.

4. **Async Pipeline, Notifications & Credits** -- When a user submits an analysis request, the system first checks the user's credit balance and quota. If sufficient credits are available and quota is not exceeded, credits are debited and the async pipeline is queued: (a) resolve/create the organization record; (b) collect and process Annual Reports (last 3 years if available) via the LangGraph Agentic AI pipeline; (c) run initial news and financial data scrape; (d) build the knowledge base in Neo4j with vector embeddings (via the configured embedding model); (e) configure and validate the org-specific AI model; (f) generate initial analysis reports. Each stage updates the request status. On completion (or failure), the system creates a notification and dispatches it through a configurable multi-channel delivery system. The notification dispatcher reads the user's NotificationPreferences to determine which channels to use (in-app is always on; email, SMS, and push are user-configurable per notification type). Delivery is attempted per channel with status tracking. Quiet hours are respected — notifications generated during quiet hours are queued and delivered when quiet hours end. If credits fall below the user's low-credit threshold, a credit_low notification is triggered.

5. **Storage Layer & Retention** -- Structured relational data (organizations, articles, financials, reports, annual reports, analysis requests, notifications, credits) lives in PostgreSQL. The per-organization knowledge graph (entities, relationships) and vector embeddings are stored in Neo4j, leveraging its native vector index for semantic similarity search. Vector dimensions are determined by the configured embedding model (e.g., 1024 for BGE-M3, 3072 for OpenAI). When using BGE-M3, optional sparse vectors can be stored alongside for hybrid dense+sparse retrieval. AI model configurations are stored in the OrganizationAIModel table. Both stores are kept in sync by the processing pipeline. **Retention policy:** News articles are retained for 7 years from publication date. A scheduled Celery job runs periodically (e.g., weekly) to identify expired articles and either archive them to cold storage (e.g., S3/object store) or purge them, based on configuration. Associated document chunks and embeddings in Neo4j are also cleaned up. Financial snapshots, analysis reports, Annual Report data, knowledge graph entities/relationships, and their embeddings are persisted indefinitely — they form the long-term knowledge foundation and must remain available for historical trend analysis, growth trajectory predictions, and RAG-based querying. Credit transactions, audit logs, and notification history are also persisted long-term for compliance and traceability.

6. **API & Presentation Layer** -- A FastAPI backend exposes RESTful endpoints consumed by a React/TypeScript frontend. For organizations with a ready AI model, all dashboard queries are served instantaneously from the pre-built Neo4j knowledge base and vector store. The frontend renders organization profiles, news feeds, analysis reports, interactive knowledge graph visualization, Annual Report summaries, request status tracking, and a notification center.

---

## Out of Scope

- Access to proprietary, paywalled, or non-public data sources
- Real-time stock trading or buy/sell recommendations
- Regulatory filings parsing (SEC, SEBI, etc.) in the initial release
- Mobile-native application (responsive web only for v1)
- User-generated annotations or notes on organizations
- Multi-language support (English only for v1)
- Proactive alerting on news events (notifications cover system events like analysis completion and credit warnings; event-driven alerts triggered by news content are out of scope for v1)

---

## Open Questions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | What is the target scraping frequency — hourly, every 6 hours, or daily? | Resolved | Admin-configurable per organization (hourly, every 6h, every 12h, daily); platform-wide default set in PlatformSettings |
| 2 | Which graph database to use — Neo4j, Amazon Neptune, or ArangoDB? | Resolved | Neo4j — will be used for both knowledge graph storage and vector embeddings via its native vector index |
| 3 | Which LLM provider for AI analysis — OpenAI, Anthropic, or self-hosted? | Resolved | Configurable by admin via PlatformSettings. Default: Anthropic (Claude). Alternatives: OpenAI, self-hosted. Provider-agnostic abstraction layer ensures zero code changes on switch |
| 4 | Should financial data come from free APIs (Yahoo Finance) or paid providers (Bloomberg, Refinitiv)? | Resolved | Default: free APIs (Yahoo Finance, Alpha Vantage). Pluggable adapter system allows admins to add paid APIs (Bloomberg, Refinitiv, S&P Capital IQ, etc.) via configuration |
| 5 | What is the retention policy for historical news articles and financial snapshots? | Resolved | News articles: 7-year retention from publication date, then archived/purged. Financial snapshots, analysis reports, Annual Report data, knowledge graph, and embeddings: persisted indefinitely (long-term) |
| 6 | Should the knowledge graph be shared across organizations (global graph) or isolated per organization? | Resolved | Isolated per organization — each org gets its own knowledge base and AI model |
| 7 | Is role-based access control needed (e.g., analyst vs. admin vs. viewer)? | Resolved | Yes — three roles: Admin (full access), Analyst (read + write + export + AI Q&A), Viewer (read-only). Enforced at API layer, reflected in UI. Default role for new SSO users is configurable |
| 8 | What is the per-org AI model approach — RAG over knowledge base, fine-tuned model, or hybrid? | Resolved | RAG over Neo4j knowledge graph + vector embeddings; fine-tuning optional for high-priority organizations |
| 9 | Should notifications be delivered via email/push in addition to in-app? | Resolved | Yes — configurable multi-channel: in-app (always on), email (default on), SMS (default off), push (default off). Users control per-notification-type channel mapping and quiet hours |
| 10 | What is the maximum number of concurrent async analysis pipelines the system should support? | Open | |
| 11 | Should there be a cost/quota limit on analysis requests per user? | Resolved | Yes — pre-purchased credit system. Billable actions debit credits at admin-configured rates. Users set personal quota limits (capped at available credits). Quota resets per billing cycle |
| 12 | Which Agentic AI framework to use for the Annual Report processing pipeline (e.g., LangGraph, CrewAI, AutoGen)? | Resolved | LangGraph — chosen for its stateful graph execution, agent collaboration, and LangChain ecosystem integration |
| 13 | Which embedding model to use for vector generation (OpenAI ada-002, Cohere embed, or self-hosted)? | Resolved | Configurable via provider-agnostic interface. Default: self-hosted BGE-M3 (BAAI). Can be swapped to OpenAI, Cohere, or any sentence-transformers model via config |
| 14 | What is the initial list of major organizations for seed data? How many at launch? | Resolved | 10 organizations at launch; specific list TBD |
| 15 | How many years of Annual Reports should be processed per organization for seed data (latest only, or last 3-5 years)? | Resolved | Last 3 years of Annual Reports per organization |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-03-18 | Nitin Agarwal | Initial draft |
| 2026-03-18 | Nitin Agarwal | Elaborated Goals & Success Metrics; added async analysis workflow, per-org AI model, notification system (US8, US9); updated technical notes with OrganizationAIModel, AnalysisRequest, Notification models; updated architecture |
| 2026-03-18 | Nitin Agarwal | Added seed data strategy from Annual Reports; Agentic AI pipeline for report processing; confirmed Neo4j for knowledge graph + vector embeddings; added AnnualReport, DocumentChunk data models; added annual report and seed API endpoints; resolved Open Questions #2, #8; expanded architecture to 6 layers |
| 2026-03-18 | Nitin Agarwal | Confirmed LangGraph as Agentic AI framework; set seed data to 10 organizations with last 3 years of Annual Reports; resolved Open Questions #12-#15 |
| 2026-03-18 | Nitin Agarwal | Switched embedding model from OpenAI text-embedding-3-large to self-hosted BGE-M3 (BAAI) as default |
| 2026-03-18 | Nitin Agarwal | Made embedding model configurable via provider-agnostic interface (default: BGE-M3; alternatives: OpenAI, Cohere, sentence-transformers); added embedding_model and embedding_dimensions fields to OrganizationAIModel; updated all references across PRD |
| 2026-03-18 | Nitin Agarwal | Elaborated all User Stories (US1-US9) with full descriptions, personas, priorities, and key interactions; added US10 (Conversational AI Q&A), US11 (Annual Report Summaries), US12 (Report Export & Sharing) with acceptance criteria |
| 2026-03-18 | Nitin Agarwal | Made scraping frequency admin-configurable per organization (hourly/6h/12h/daily) with platform default; made LLM provider admin-configurable (default: Anthropic; alternatives: OpenAI, self-hosted); added PlatformSettings data model; added admin settings API endpoints; updated US7 acceptance criteria; resolved Open Questions #1, #3 |
| 2026-03-18 | Nitin Agarwal | Made financial and news data sources pluggable via adapter pattern; default free APIs (Yahoo Finance, Alpha Vantage, NewsAPI, Google News RSS) ship out of the box; admins can add paid APIs (Bloomberg, Refinitiv, etc.); added DataSourceConfig data model; added data source admin API endpoints; updated US7 criteria and architecture; resolved Open Question #4 |
| 2026-03-18 | Nitin Agarwal | Added RBAC with three roles (Admin, Analyst, Viewer); added permissions matrix; added US13 (User & Role Management) with acceptance criteria; added User and RoleChangeAuditLog data models; added default_user_role to PlatformSettings; added user management API endpoints; updated Constraints with Security & Access; resolved Open Question #7 |
| 2026-03-18 | Nitin Agarwal | Added configurable multi-channel notifications (email, SMS, push + always-on in-app); added US14 (Notification Preferences) with acceptance criteria; added NotificationPreferences data model; updated Notification model with delivery channels/status. Added pre-purchased credits & quota system; added US15 (Credits & Quota Management) with acceptance criteria; added CreditAccount, CreditTransaction, CreditPricing data models; added notification/credit API endpoints; updated architecture layer 4; resolved Open Questions #9, #11 |
| 2026-03-18 | Nitin Agarwal | Added retention policy: news articles retained 7 years (then archived/purged); financial snapshots, analysis reports, Annual Reports, knowledge graph, and embeddings persisted indefinitely (long-term); added retention_expires_at and is_archived fields to NewsArticle model; updated Storage Layer in architecture; updated Constraints; resolved Open Question #5 |
| 2026-03-18 | Nitin Agarwal | Created microservices solution architecture (docs/architecture.md): 10 services (API Gateway, User, Organization, Ingestion, Knowledge Engine, Intelligence, Notification, Credit, Export, Pipeline Orchestrator); database-per-service; event-driven coordination via Redis Streams; Kubernetes deployment topology; full event catalog and sequence diagrams |
