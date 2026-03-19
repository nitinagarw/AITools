-- ============================================================
-- AI360 — Create per-service databases
-- Run once on the PostgreSQL instance as a superuser / ai360 role.
-- ============================================================

CREATE DATABASE user_db       OWNER ai360;
CREATE DATABASE org_db        OWNER ai360;
CREATE DATABASE intelligence_db OWNER ai360;
CREATE DATABASE notification_db OWNER ai360;
CREATE DATABASE credit_db     OWNER ai360;
CREATE DATABASE export_db     OWNER ai360;
CREATE DATABASE pipeline_db   OWNER ai360;

-- Enable UUID extension on each database
\connect user_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\connect org_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\connect intelligence_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect notification_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect credit_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect export_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect pipeline_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
