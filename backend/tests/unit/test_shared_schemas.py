"""Unit tests for libs.shared.schemas — UT-SH-12, UT-SH-13."""

from libs.shared.schemas import ApiResponse, ErrorDetail, PaginatedResponse, PaginationMeta


class TestApiResponse:
    def test_data_response(self):
        """UT-SH-12: ApiResponse serializes correctly with data."""
        resp = ApiResponse[str](data="hello", error=None)
        d = resp.model_dump()
        assert d["data"] == "hello"
        assert d["error"] is None

    def test_error_response(self):
        """UT-SH-12: ApiResponse serializes correctly with error."""
        resp = ApiResponse[str](
            data=None,
            error=ErrorDetail(message="not found", code="NOT_FOUND"),
        )
        d = resp.model_dump()
        assert d["data"] is None
        assert d["error"]["message"] == "not found"
        assert d["error"]["code"] == "NOT_FOUND"


class TestPaginatedResponse:
    def test_pagination_meta(self):
        """UT-SH-13: PaginatedResponse computes page metadata correctly."""
        resp = PaginatedResponse[str](
            data=["a", "b", "c"],
            pagination=PaginationMeta(
                page=1, page_size=10, total_items=25, total_pages=3
            ),
        )
        d = resp.model_dump()
        assert len(d["data"]) == 3
        assert d["pagination"]["total_items"] == 25
        assert d["pagination"]["total_pages"] == 3
        assert d["pagination"]["page"] == 1

    def test_empty_page(self):
        resp = PaginatedResponse[str](
            data=[],
            pagination=PaginationMeta(
                page=1, page_size=20, total_items=0, total_pages=0
            ),
        )
        assert len(resp.data) == 0
        assert resp.pagination.total_items == 0
