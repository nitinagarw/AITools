"""Pydantic schemas for Knowledge Engine API."""

from pydantic import BaseModel, Field


class KGNodeCreate(BaseModel):
    organization_id: str
    entity_type: str
    entity_name: str
    properties: dict = Field(default_factory=dict)
    source_document_id: str | None = None
    embedding: list[float] | None = None


class KGNodeOut(BaseModel):
    id: str
    organization_id: str
    entity_type: str
    entity_name: str
    properties: dict


class KGEdgeCreate(BaseModel):
    source_node_id: str
    target_node_id: str
    relationship_type: str
    properties: dict = Field(default_factory=dict)
    source_document_id: str | None = None


class DocumentChunkCreate(BaseModel):
    organization_id: str
    source_type: str
    source_document_id: str
    chunk_text: str
    chunk_index: int
    embedding: list[float]
    metadata: dict = Field(default_factory=dict)


class VectorSearchRequest(BaseModel):
    query_embedding: list[float]
    top_k: int = Field(default=10, ge=1, le=100)
    organization_id: str


class VectorSearchResult(BaseModel):
    chunk_id: str
    chunk_text: str
    score: float
    metadata: dict
