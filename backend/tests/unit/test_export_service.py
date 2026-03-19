"""Unit tests for Export Service — UT-ES-01 through UT-ES-08."""

import pytest

from services.export_service.models import ExportFormat, ExportStatus, ExportJob
from services.export_service.schemas import ExportJobCreate, ExportJobOut
from tests.factories import export_job_factory


class TestExportModels:
    def test_export_format_enum(self):
        assert ExportFormat.PDF.value == "pdf"
        assert ExportFormat.CSV.value == "csv"
        assert ExportFormat.JSON.value == "json"

    def test_export_status_enum(self):
        assert ExportStatus.QUEUED.value == "queued"
        assert ExportStatus.PROCESSING.value == "processing"
        assert ExportStatus.COMPLETED.value == "completed"
        assert ExportStatus.FAILED.value == "failed"


class TestExportSchemas:
    def test_create_schema_validates_format(self):
        """UT-ES-01/02/03: Valid formats accepted."""
        for fmt in ["pdf", "csv", "json"]:
            job = ExportJobCreate(organization_id="org-1", format=fmt)
            assert job.format == fmt

    def test_create_schema_rejects_invalid_format(self):
        with pytest.raises(Exception):
            ExportJobCreate(organization_id="org-1", format="docx")

    def test_out_schema_from_factory(self):
        """UT-ES-05: Export includes metadata."""
        data = export_job_factory(fmt="pdf", status="completed")
        assert data["format"] == "pdf"
        assert data["status"] == "completed"
        assert "executive_summary" in data["sections"]

    def test_sections_default_to_list(self):
        job = ExportJobCreate(organization_id="org-1", format="pdf")
        assert job.sections == ["all"]

    def test_custom_sections(self):
        job = ExportJobCreate(
            organization_id="org-1",
            format="pdf",
            sections=["financials", "growth_trajectory", "news_sentiment"],
        )
        assert len(job.sections) == 3
