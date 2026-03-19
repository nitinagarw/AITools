// ============================================================
// AI360 — Neo4j Knowledge Graph Schema Initialization
// Run via cypher-shell or Neo4j Browser.
// ============================================================

// ─── Constraints ───────────────────────────────────────────

CREATE CONSTRAINT kg_node_id IF NOT EXISTS
FOR (n:KnowledgeGraphNode) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT kg_edge_id IF NOT EXISTS
FOR (r:KnowledgeGraphEdge) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT doc_chunk_id IF NOT EXISTS
FOR (c:DocumentChunk) REQUIRE c.id IS UNIQUE;

// ─── Indexes ───────────────────────────────────────────────

CREATE INDEX kg_node_org_id IF NOT EXISTS
FOR (n:KnowledgeGraphNode) ON (n.organization_id);

CREATE INDEX kg_node_entity_type IF NOT EXISTS
FOR (n:KnowledgeGraphNode) ON (n.entity_type);

CREATE INDEX kg_node_entity_name IF NOT EXISTS
FOR (n:KnowledgeGraphNode) ON (n.entity_name);

CREATE INDEX doc_chunk_org_id IF NOT EXISTS
FOR (c:DocumentChunk) ON (c.organization_id);

CREATE INDEX doc_chunk_source_type IF NOT EXISTS
FOR (c:DocumentChunk) ON (c.source_type);

CREATE INDEX doc_chunk_source_doc IF NOT EXISTS
FOR (c:DocumentChunk) ON (c.source_document_id);

// ─── Vector Index for semantic search ──────────────────────
// BGE-M3 default: 1024 dimensions, cosine similarity

CREATE VECTOR INDEX doc_chunk_embedding IF NOT EXISTS
FOR (c:DocumentChunk) ON (c.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1024,
    `vector.similarity_function`: 'cosine'
  }
};

CREATE VECTOR INDEX kg_node_embedding IF NOT EXISTS
FOR (n:KnowledgeGraphNode) ON (n.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1024,
    `vector.similarity_function`: 'cosine'
  }
};

// ─── Relationship Types (documentation) ────────────────────
// The following relationship types are used between KnowledgeGraphNode instances:
//   RELATED_TO           — generic relationship
//   CEO_OF               — person is CEO of organization
//   BOARD_MEMBER_OF      — person is board member of organization
//   COMPETES_WITH        — organization competes with another
//   ACQUIRED             — organization acquired another
//   PARTNERED_WITH       — organizations in partnership
//   SUBSIDIARY_OF        — org is subsidiary of parent
//   OPERATES_IN          — org operates in a sector/location
//   REPORTED_METRIC      — org reported a financial metric
//   LAUNCHED_PRODUCT     — org launched a product
//   ANNOUNCED_STRATEGY   — org announced a strategic initiative
//
// Each relationship carries properties:
//   { id, source_document_id, confidence, date, created_at }
