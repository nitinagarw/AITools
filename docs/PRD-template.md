# [Product/Feature Name] — Product Requirements Document

## Introduction

**Product/Feature:** [Name]
**Author:** [Name]
**Last Updated:** [Date]
**Status:** Draft | In Review | Approved

[Brief description of what this product/feature does and why it exists. 2-3 sentences covering the core problem it solves and the target audience. If applicable, describe the data strategy — how the system is seeded, what data sources it uses, and how knowledge is maintained.]

---

## Problem Statement

[Describe the problem users face today. Be specific — what pain points exist, what workarounds are people using, and why is this worth solving now?]

---

## Goals & Success Metrics

Organize goals into categories relevant to your product. Common categories:

### Core Experience Goals

| Goal | Metric | Target |
|------|--------|--------|
| [e.g., Instantaneous response time] | [e.g., Query response time for pre-built data] | [e.g., Under 2 seconds] |
| [e.g., Fast async onboarding] | [e.g., Time from request to completion notification] | [e.g., Under 30 minutes] |

### Coverage & Data Quality Goals

| Goal | Metric | Target |
|------|--------|--------|
| [e.g., Broad data coverage] | [e.g., Number of active entities] | [e.g., 500+ within 6 months] |
| [e.g., Data freshness] | [e.g., Age of latest ingested data] | [e.g., Less than 24 hours] |

### Accuracy & Intelligence Goals

| Goal | Metric | Target |
|------|--------|--------|
| [e.g., Prediction accuracy] | [e.g., Accuracy vs. actuals] | [e.g., 70%+ directional accuracy] |
| [e.g., Classification accuracy] | [e.g., Precision on labeled test set] | [e.g., 85%+] |

### Adoption & Engagement Goals

| Goal | Metric | Target |
|------|--------|--------|
| [e.g., User adoption] | [e.g., Monthly active users] | [e.g., 80% of target team] |
| [e.g., Repeat usage] | [e.g., Weekly retention rate] | [e.g., 60%+] |

### Seed Data Strategy

[If the product launches with pre-built data, describe the seed data pipeline: what data is collected, how it is processed, how the knowledge base is populated, and how many entities are pre-built at launch.]

### Async Workflows

[If users can submit requests that are processed asynchronously, describe the workflow: submit → async build → notify → instant access → continuous enrichment.]

### Per-Entity AI/Intelligence Model

[If each entity gets its own AI model or knowledge base, describe: what the model is built on, how queries are answered, and how the model improves over time.]

---

## User Stories

### Personas

| Persona | Description | Default Role |
|---------|-------------|--------------|
| [e.g., Business Analyst] | [What they do, what they need] | [e.g., Analyst] |
| [e.g., Admin] | [What they do, what they need] | [e.g., Admin] |
| [e.g., Viewer] | [What they do, what they need] | [e.g., Viewer] |

### Roles & Permissions (RBAC)

[Define roles and a permissions matrix. Common roles: Admin, Analyst/Editor, Viewer.]

| Permission | Admin | Analyst | Viewer |
|------------|:-----:|:-------:|:------:|
| [e.g., View data] | Yes | Yes | Yes |
| [e.g., Submit requests] | Yes | Yes | No |
| [e.g., Export reports] | Yes | Yes | No |
| [e.g., Manage platform settings] | Yes | No | No |
| [e.g., Manage users and roles] | Yes | No | No |

### US1: [Short Title]

**As a** [persona], **I want to** [capability] **so that** [benefit].

- **Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)
- **Description:** [Detailed description of the user story — context, behavior, edge cases, what happens on success and failure. 3-5 sentences.]
- **Key Interactions:** [Specific UI elements and flows the user engages with — e.g., search input, dashboard cards, filter dropdowns, export buttons.]

### US2: [Short Title]

**As a** [persona], **I want to** [capability] **so that** [benefit].

- **Priority:** [P0/P1/P2/P3]
- **Description:** [Detailed description.]
- **Key Interactions:** [UI elements and flows.]

### US3: [Short Title]

**As a** [persona], **I want to** [capability] **so that** [benefit].

- **Priority:** [P0/P1/P2/P3]
- **Description:** [Detailed description.]
- **Key Interactions:** [UI elements and flows.]

[Add more user stories as needed. Common cross-cutting stories to consider:
- Admin management (entity CRUD, platform configuration)
- Async request submission & notification
- Request status tracking
- Conversational AI Q&A (if AI-powered)
- Data summaries & year-over-year comparison
- Report export & sharing
- User & role management (RBAC)
- Notification preferences (multi-channel: email, SMS, push)
- Credits & quota management (if billable actions exist)]

---

## Acceptance Criteria

### US1: [Short Title]

- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Edge case or error handling]

### US2: [Short Title]

- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]

### US3: [Short Title]

- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]

[One acceptance criteria section per user story. Each criterion should be independently testable.]

---

## Constraints

- **Tech Stack:** [e.g., Python 3.10+ (FastAPI) backend; React 18 + TypeScript frontend; Neo4j for knowledge graph; PostgreSQL for relational data; Celery for background tasks; configurable LLM provider (default: Anthropic); configurable embedding model (default: self-hosted BGE-M3)]
- **Performance:** [e.g., Dashboard load < 3s; search < 2s; graph render < 5s for 500 nodes]
- **Security & Access:** [e.g., RBAC with Admin/Analyst/Viewer roles; corporate SSO authentication; permissions enforced at API layer]
- **Retention Policy:** [e.g., Transient data retained N years then archived; core data persisted indefinitely]
- **Notifications:** [e.g., Configurable multi-channel: in-app (always on), email, SMS, push; user-controlled preferences and quiet hours]
- **Credits & Billing:** [e.g., Pre-purchased credit system; billable actions debit credits at admin-configured rates; user-set quota limits capped at available credits]
- **Compliance:** [e.g., GDPR compliant; only publicly available data; robots.txt compliance]
- **Data Sources:** [e.g., Pluggable adapter pattern; default free APIs; admins can add paid APIs via configuration]
- **Dependencies:** [e.g., External APIs, databases, LLM providers, embedding model infrastructure, notification delivery services]

---

## Technical Notes

**Data Models:**

[List all data models. Common models to consider:
- Core domain entities (the primary objects the system manages)
- User, RoleChangeAuditLog (for RBAC)
- PlatformSettings (singleton, admin-managed global config)
- DataSourceConfig (pluggable external API adapters)
- NotificationPreferences (per-user channel config)
- Notification (multi-channel with delivery status)
- CreditAccount, CreditTransaction, CreditPricing (for billing)
- Async request tracking models
- AI model configuration per entity]

```
[ModelName]
- id: UUID (primary key)
- field_name: type (description)
- field_name: type (description)
- created_at: datetime
- updated_at: datetime

User
- id: UUID (primary key)
- sso_id: string (unique, from corporate SSO)
- email: string (unique)
- display_name: string
- role: enum (admin, analyst, viewer; default: from PlatformSettings)
- is_active: boolean (default: true)
- last_login_at: datetime (nullable)
- created_at: datetime
- updated_at: datetime

PlatformSettings (singleton / admin-managed)
- id: UUID (primary key)
- default_user_role: enum (admin, analyst, viewer; default: viewer)
- [other configurable platform defaults: LLM provider, embedding model, scraping frequency, etc.]
- updated_at: datetime
- updated_by: string (admin user ID)

NotificationPreferences (per user)
- id: UUID (primary key)
- user_id: UUID (foreign key -> User, unique)
- email_enabled: boolean (default: true)
- sms_enabled: boolean (default: false)
- sms_phone_number: string (nullable)
- push_enabled: boolean (default: false)
- quiet_hours_start: time (nullable)
- quiet_hours_end: time (nullable)
- notify_on: JSON (notification type -> channels mapping)
- created_at: datetime
- updated_at: datetime

Notification
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- type: enum ([define notification types relevant to your product])
- title: string
- message: text
- link_url: string (nullable)
- is_read: boolean (default: false)
- delivery_channels: JSON (channels attempted)
- delivery_status: JSON (per-channel status)
- created_at: datetime

CreditAccount (per user)
- id: UUID (primary key)
- user_id: UUID (foreign key -> User, unique)
- total_credits_purchased: decimal
- credits_balance: decimal
- quota_limit: decimal (user-set, must be <= credits_balance)
- quota_used: decimal (resets each billing cycle)
- billing_cycle_start: date
- billing_cycle_days: integer (default: 30)
- low_credit_threshold: decimal (nullable)
- created_at: datetime
- updated_at: datetime

CreditTransaction
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- transaction_type: enum (purchase, debit, refund, admin_adjustment)
- amount: decimal
- balance_after: decimal
- description: string
- reference_id: UUID (nullable)
- created_at: datetime

CreditPricing (admin-managed)
- id: UUID (primary key)
- action_type: enum ([define billable action types])
- credits_cost: decimal
- description: string
- is_active: boolean (default: true)
- created_at: datetime
- updated_at: datetime
```

**API Endpoints:**

[Organize endpoints by domain. Common endpoint groups:]

| Method | Endpoint | Description |
|--------|----------|-------------|
| | **Core Domain** | |
| GET | /api/[resource] | List all [resources] |
| GET | /api/[resource]/{id} | Get [resource] details |
| POST | /api/[resource] | (Admin) Create a [resource] |
| PUT | /api/[resource]/{id} | (Admin) Update a [resource] |
| | **User & Auth** | |
| GET | /api/me | Get current user's profile and role |
| GET | /api/admin/users | (Admin) List all users |
| PATCH | /api/admin/users/{id}/role | (Admin) Change user role |
| GET | /api/admin/audit-log/roles | (Admin) Role change audit log |
| | **Notifications** | |
| GET | /api/notifications | List user's notifications |
| PATCH | /api/notifications/{id}/read | Mark notification as read |
| GET | /api/me/notification-preferences | Get notification preferences |
| PUT | /api/me/notification-preferences | Update notification preferences |
| | **Credits & Billing** | |
| GET | /api/me/credits | Get credit balance and quota |
| GET | /api/me/credits/transactions | Credit transaction history |
| PATCH | /api/me/credits/quota | Update quota limit |
| GET | /api/admin/credits/pricing | (Admin) List credit pricing |
| PUT | /api/admin/credits/pricing/{id} | (Admin) Update credit pricing |
| POST | /api/admin/credits/adjust/{user_id} | (Admin) Credit adjustment |
| | **Platform Settings** | |
| GET | /api/admin/settings | (Admin) Get platform settings |
| PUT | /api/admin/settings | (Admin) Update platform settings |

**Architecture Notes:**

[Describe the system architecture in numbered layers. Common layers:
1. Seed Data / Initial Ingestion
2. Ongoing Data Ingestion (background workers, configurable frequency, pluggable data sources)
3. Processing / AI / Model Layer (NLP pipeline, embedding, per-entity AI model with RAG)
4. Async Pipeline, Notifications & Credits (async workflows, multi-channel notification dispatch, credit enforcement)
5. Storage & Retention (relational DB, graph DB, vector index, retention policies, archival)
6. API & Presentation (REST API, frontend, role-aware UI)]

---

## Out of Scope

- [Feature or capability explicitly excluded from this release]
- [Feature or capability explicitly excluded from this release]
- [Feature or capability explicitly excluded from this release]

---

## Open Questions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | [Question] | Open / Resolved | [Decision if resolved] |
| 2 | [Question] | Open / Resolved | [Decision if resolved] |

[Track all architectural and product decisions here. Resolve them as decisions are made — include the rationale in the Decision column. Common open questions:
- Data source choices (free vs. paid)
- LLM / embedding model selection
- Retention policies
- Scraping/refresh frequency
- RBAC role definitions
- Notification channel support
- Credit pricing structure
- Async pipeline concurrency limits]

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| [Date] | [Name] | Initial draft |

[Update the changelog with every PRD revision. Each entry should summarize what was added, changed, or resolved. This provides a full audit trail of how the PRD evolved.]
