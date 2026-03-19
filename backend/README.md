# AI360 Backend

Microservices backend for the AI360 organization intelligence platform.

## Architecture

10 microservices organized around bounded contexts:

| Port | Service | Database | Description |
|------|---------|----------|-------------|
| 8000 | API Gateway | — | Auth, routing, RBAC, rate limiting |
| 8001 | User Service | `user_db` | Users, roles, notification preferences |
| 8002 | Organization Service | `org_db` | Orgs, news, financials, settings |
| 8003 | Intelligence Service | `intelligence_db` | RAG Q&A, analysis, AI models |
| 8004 | Pipeline Orchestrator | `pipeline_db` | Async analysis pipelines, seed |
| 8005 | Notification Service | `notification_db` | Multi-channel dispatch |
| 8006 | Credit Service | `credit_db` | Billing, quotas, pricing |
| 8007 | Export Service | `export_db` | PDF/CSV/JSON report generation |
| — | Ingestion Service | (uses `org_db`) | Celery workers for scraping |
| — | Knowledge Engine | Neo4j | LangGraph, KG, embeddings |

## Quick Start

### 1. Start infrastructure

```bash
docker-compose up -d postgres neo4j redis minio
```

### 2. Initialize databases

The SQL scripts in `database/scripts/` run automatically when the PostgreSQL container starts for the first time (mounted to `/docker-entrypoint-initdb.d`).

For Neo4j, run the Cypher script manually:

```bash
docker exec -i <neo4j_container> cypher-shell -u neo4j -p neo4j_secret < database/scripts/09_neo4j_init.cypher
```

### 3. Install Python dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 4. Run a service locally

```bash
# From the backend/ directory
uvicorn services.user_service.main:app --port 8001 --reload
uvicorn services.org_service.main:app --port 8002 --reload
uvicorn services.gateway.main:app --port 8000 --reload
```

### 5. Run everything with Docker Compose

```bash
docker-compose up --build
```

## Project Structure

```
backend/
├── libs/shared/            # Shared library (config, DB, auth, schemas, events)
├── services/
│   ├── gateway/            # API Gateway (port 8000)
│   ├── user_service/       # User Service (port 8001)
│   ├── org_service/        # Organization Service (port 8002)
│   ├── intelligence_service/ # Intelligence Service (port 8003)
│   ├── pipeline_service/   # Pipeline Orchestrator (port 8004)
│   ├── notification_service/ # Notification Service (port 8005)
│   ├── credit_service/     # Credit Service (port 8006)
│   ├── export_service/     # Export Service (port 8007)
│   ├── ingestion_service/  # Celery workers (no HTTP port)
│   └── knowledge_engine/   # Knowledge Engine (Neo4j worker)
├── database/
│   └── scripts/            # SQL init scripts (01-08) + Neo4j Cypher (09)
├── docker-compose.yml
└── requirements.txt
```

## Database Scripts

| Script | Target | Tables |
|--------|--------|--------|
| `01_init_databases.sql` | PostgreSQL | Creates all 7 databases + extensions |
| `02_user_db.sql` | `user_db` | users, role_change_audit_log, notification_preferences |
| `03_org_db.sql` | `org_db` | organizations, platform_settings, data_source_configs, news_articles, annual_reports, financial_snapshots |
| `04_intelligence_db.sql` | `intelligence_db` | organization_ai_models, analysis_reports |
| `05_notification_db.sql` | `notification_db` | notifications |
| `06_credit_db.sql` | `credit_db` | credit_accounts, credit_transactions, credit_pricing |
| `07_export_db.sql` | `export_db` | export_jobs |
| `08_pipeline_db.sql` | `pipeline_db` | analysis_requests |
| `09_neo4j_init.cypher` | Neo4j | Constraints, indexes, vector indexes (1024-dim cosine) |

## Key Design Decisions

- **Database-per-service**: Each service owns its schema. Cross-service data access via internal REST APIs only.
- **Event-driven coordination**: Redis Streams for pipeline orchestration and cross-service events.
- **Provider-agnostic AI**: LLM and embedding model are behind abstraction layers, configurable at runtime.
- **RBAC at the Gateway**: SSO authentication and role-based access control enforced before requests reach downstream services.
- **Credits-first billing**: All billable actions check/reserve credits before execution.

## Environment Variables

Each service reads configuration from environment variables. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `ai360` | Database name (overridden per service) |
| `DB_USER` | `ai360` | Database user |
| `DB_PASSWORD` | `ai360_secret` | Database password |
| `REDIS_HOST` | `localhost` | Redis host |
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection URI |
| `JWT_INTERNAL_SECRET` | `internal-cluster-key` | Cluster-internal JWT signing key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key for LLM |
