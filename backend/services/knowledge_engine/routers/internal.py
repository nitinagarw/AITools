"""Internal service-to-service endpoints for Knowledge Engine."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from libs.shared.auth import verify_internal_jwt
from libs.shared.schemas import ApiResponse

from ..schemas import (
    DocumentChunkCreate,
    KGEdgeCreate,
    KGNodeCreate,
    KGNodeOut,
    VectorSearchRequest,
    VectorSearchResult,
)

router = APIRouter(prefix="/internal", dependencies=[Depends(verify_internal_jwt)])


class KGStatsOut(BaseModel):
    node_count: int
    edge_count: int


@router.post("/organizations/{org_id}/kg/nodes", response_model=ApiResponse[KGNodeOut])
async def create_kg_node(org_id: str, body: KGNodeCreate):
    """Create a KG node. Placeholder stub returning mock data."""
    return ApiResponse(
        data=KGNodeOut(
            id="mock-node-id",
            organization_id=body.organization_id,
            entity_type=body.entity_type,
            entity_name=body.entity_name,
            properties=body.properties,
        )
    )


@router.post("/organizations/{org_id}/kg/edges", response_model=ApiResponse[dict])
async def create_kg_edge(org_id: str, body: KGEdgeCreate):
    """Create a KG edge. Placeholder stub returning mock data."""
    return ApiResponse(
        data={
            "source_node_id": body.source_node_id,
            "target_node_id": body.target_node_id,
            "relationship_type": body.relationship_type,
        }
    )


@router.post("/organizations/{org_id}/kg/chunks", response_model=ApiResponse[dict])
async def create_document_chunk(org_id: str, body: DocumentChunkCreate):
    """Create a document chunk with embedding. Placeholder stub returning mock data."""
    return ApiResponse(
        data={
            "chunk_id": "mock-chunk-id",
            "organization_id": body.organization_id,
            "source_document_id": body.source_document_id,
            "chunk_index": body.chunk_index,
        }
    )


@router.post("/organizations/{org_id}/kg/search", response_model=ApiResponse[list[VectorSearchResult]])
async def vector_search(org_id: str, body: VectorSearchRequest):
    """Vector similarity search. Placeholder stub returning mock data."""
    return ApiResponse(
        data=[
            VectorSearchResult(
                chunk_id="mock-chunk-1",
                chunk_text="Placeholder chunk text",
                score=0.95,
                metadata={},
            )
        ]
    )


@router.get("/organizations/{org_id}/kg/stats", response_model=ApiResponse[KGStatsOut])
async def get_kg_stats(org_id: str):
    """Return node and edge counts. Placeholder stub returning mock data."""
    return ApiResponse(data=KGStatsOut(node_count=0, edge_count=0))
